// Photoreal globe: NASA Blue Marble day map, topology bump, ocean specular, fresnel atmosphere.
// Loaded lazily by the Globe island (dynamic import), so marketing pages do not pay for three.js up front.
// The same module renders the static hero poster (scripts/render-globe-poster.mjs), so the poster and the live
// globe start from the identical frame.
import {
  AdditiveBlending, AmbientLight, BackSide, CanvasTexture, CircleGeometry, Color, CylinderGeometry, DirectionalLight, DoubleSide,
  FrontSide, Group, LinearFilter, Mesh, MeshBasicMaterial, MeshPhongMaterial, PerspectiveCamera, RingGeometry, Scene,
  ShaderMaterial, SphereGeometry, SRGBColorSpace, Texture, TextureLoader, Vector3, WebGLRenderer,
} from 'three';

export type GlobeMode = 'idle' | 'spin' | 'focus';
export type GlobeMsg = { mode: GlobeMode; lat?: number; lng?: number; label?: string };

export type EarthOptions = {
  base: string; // URL prefix for textures, for example /globe
  interactive: boolean;
  reducedMotion: boolean;
  maxDpr?: number;
  idleSpin?: number; // rad/s
  onFirstFrame?: () => void;
  onLabel?: (p: { x: number; y: number; visible: boolean; label: string }) => void;
};

export type Earth = {
  send: (m: GlobeMsg) => void;
  zoomBy: (factor: number) => void;
  dispose: () => void;
};

// The poster and the first live frame share this view: centered on the Atlantic, tilted north.
export const START_YAW = -Math.PI / 2 + (70 * Math.PI) / 180;
export const START_PITCH = 0.38;
const DIST = { idle: 4.9, spin: 6.6, focus: 3.0 } as const;

const TAU = Math.PI * 2;
const wrapPi = (a: number) => ((((a + Math.PI) % TAU) + TAU) % TAU) - Math.PI;
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const toVec = (lat: number, lng: number, r = 1) => {
  const la = (lat * Math.PI) / 180, lo = (lng * Math.PI) / 180;
  return new Vector3(r * Math.cos(la) * Math.cos(lo), r * Math.sin(la), -r * Math.cos(la) * Math.sin(lo));
};

function loadTexture(loader: TextureLoader, url: string, srgb: boolean): Promise<Texture> {
  return new Promise((resolve, reject) => {
    loader.load(url, (t) => { if (srgb) t.colorSpace = SRGBColorSpace; resolve(t); }, undefined, reject);
  });
}

// Ocean mask: oceans are blue-dominant and dark in the Blue Marble map. Built once at small size.
function oceanSpecular(img: CanvasImageSource & { width: number; height: number }): CanvasTexture | null {
  try {
    const w = 1024, h = 512;
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const g = c.getContext('2d', { willReadFrequently: true });
    if (!g) return null;
    g.drawImage(img, 0, 0, w, h);
    const d = g.getImageData(0, 0, w, h);
    for (let i = 0; i < d.data.length; i += 4) {
      const r = d.data[i], gg = d.data[i + 1], b = d.data[i + 2];
      const ocean = b > r * 1.35 && b >= gg * 0.95 && r < 90 ? 255 : 0;
      d.data[i] = d.data[i + 1] = d.data[i + 2] = ocean;
    }
    g.putImageData(d, 0, 0);
    const t = new CanvasTexture(c);
    t.minFilter = LinearFilter;
    return t;
  } catch { return null; }
}

const ATMO_VERT = `varying vec3 vN; varying vec3 vV;
void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`;
const GLOW_FRAG = `varying vec3 vN; varying vec3 vV; uniform vec3 uColor; uniform float uPow; uniform float uGain;
void main(){ float f = pow(clamp(-dot(vN, vV) / 0.52, 0.0, 1.0), uPow); gl_FragColor = vec4(uColor, 1.0) * f * uGain; }`;
const RIM_FRAG = `varying vec3 vN; varying vec3 vV; uniform vec3 uColor;
void main(){ float f = pow(1.0 - clamp(dot(vN, vV), 0.0, 1.0), 3.2); gl_FragColor = vec4(uColor, 1.0) * f * 0.45; }`;

export async function createEarth(canvas: HTMLCanvasElement, opts: EarthOptions): Promise<Earth> {
  let dpr = Math.min(window.devicePixelRatio || 1, opts.maxDpr ?? 2);
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  // Software rasterizers (no GPU) cannot keep up: render at 1x so the page stays responsive.
  const gl = renderer.getContext();
  const dbg = gl.getExtension('WEBGL_debug_renderer_info');
  const gpu = dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)) : '';
  const software = /swiftshader|llvmpipe|software/i.test(gpu);
  if (software) dpr = 1;
  renderer.setPixelRatio(dpr);
  renderer.setClearColor(0x000000, 0);

  const scene = new Scene();
  const camera = new PerspectiveCamera(28, 1, 0.1, 50);
  camera.position.set(0, 0, DIST.idle);

  const sun = new DirectionalLight(0xfff6ea, 3.1);
  sun.position.set(-2.4, 1.5, 4.8);
  scene.add(sun, new AmbientLight(0xa9c4e0, 1.25));

  const disposables: { dispose: () => void }[] = [];
  const track = <T extends { dispose: () => void }>(o: T): T => { disposables.push(o); return o; };

  const small = window.innerWidth < 700;
  const loader = new TextureLoader();
  const dayUrl = `${opts.base}/earth-day-${window.innerWidth < 900 || software ? 2048 : 4096}.webp`;
  const bumpUrl = `${opts.base}/earth-bump-${small ? 1024 : 2048}.webp`;
  const [day, bump] = await Promise.all([loadTexture(loader, dayUrl, true), loadTexture(loader, bumpUrl, false)]);
  track(day); track(bump);
  day.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const spec = oceanSpecular(day.image as HTMLImageElement);
  if (spec) track(spec);

  const earthGeo = track(new SphereGeometry(1, 96, 64));
  const earthMat = track(new MeshPhongMaterial({ map: day, bumpMap: bump, bumpScale: 2.2, specularMap: spec ?? undefined, specular: new Color(0x1a2a3a), shininess: 38 }));
  const earth = new Mesh(earthGeo, earthMat);
  earth.rotation.order = 'XYZ';
  scene.add(earth);

  const atmoGeo = track(new SphereGeometry(1, 64, 48));
  const glowMat = track(new ShaderMaterial({ vertexShader: ATMO_VERT, fragmentShader: GLOW_FRAG, uniforms: { uColor: { value: new Color(0x4aa8ff) }, uPow: { value: 2.2 }, uGain: { value: 0.8 } }, side: BackSide, blending: AdditiveBlending, transparent: true, depthWrite: false }));
  const glow = new Mesh(atmoGeo, glowMat);
  glow.scale.setScalar(1.17);
  const rimMat = track(new ShaderMaterial({ vertexShader: ATMO_VERT, fragmentShader: RIM_FRAG, uniforms: { uColor: { value: new Color(0x8fd0ff) } }, side: FrontSide, blending: AdditiveBlending, transparent: true, depthWrite: false }));
  const rim = new Mesh(atmoGeo, rimMat);
  rim.scale.setScalar(1.008);
  scene.add(glow, rim);

  // Destination pin: stem, head and a pulsing ring, parented to the earth so it turns with it.
  const pin = new Group();
  const amber = track(new MeshBasicMaterial({ color: 0xf5a623 }));
  const white = track(new MeshBasicMaterial({ color: 0xffffff }));
  const ringMat = track(new MeshBasicMaterial({ color: 0xf5a623, transparent: true, opacity: 0.8, side: DoubleSide, depthWrite: false }));
  const stemGeo = track(new CylinderGeometry(0.0045, 0.0045, 0.07, 10)); stemGeo.rotateX(Math.PI / 2); stemGeo.translate(0, 0, 0.035);
  const headGeo = track(new SphereGeometry(0.021, 20, 14)); headGeo.translate(0, 0, 0.082);
  const dotGeo = track(new CircleGeometry(0.0075, 16)); dotGeo.translate(0, 0, 0.1034);
  const ringGeo = track(new RingGeometry(0.03, 0.037, 40)); ringGeo.translate(0, 0, 0.002);
  const ring = new Mesh(ringGeo, ringMat);
  pin.add(new Mesh(stemGeo, amber), new Mesh(headGeo, amber), new Mesh(dotGeo, white), ring);
  pin.visible = false;
  earth.add(pin);
  let pinLabel = '';
  let pinWorld = new Vector3();

  let yaw = START_YAW, pitch = START_PITCH, vel = 0;
  let dist: number = DIST.idle, zoom = 1;
  let mode: GlobeMode = 'idle';
  let tYaw = yaw, tPitch = pitch;
  let spinNow = opts.reducedMotion ? 0 : (opts.idleSpin ?? 0.06);
  let dragging = false, lastDragAt = 0, dragVx = 0;
  let dirty = true, running = true, raf = 0, last = 0, firstDone = false, disposed = false, frames = 0;

  function size() {
    const w = Math.max(1, canvas.clientWidth), h = Math.max(1, canvas.clientHeight);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Keep the globe fully framed on tall and narrow canvases by pulling the camera back rather than cropping.
    camera.fov = w / h < 1 ? (2 * Math.atan(Math.tan((28 * Math.PI) / 360) / (w / h)) * 180) / Math.PI : 28;
    camera.updateProjectionMatrix();
    dirty = true;
  }
  const ro = new ResizeObserver(size);
  ro.observe(canvas);
  size();

  const baseDist = () => DIST[mode];
  function applyInstant() {
    yaw = tYaw; pitch = tPitch; vel = 0; dist = baseDist() * zoom;
  }

  function send(m: GlobeMsg) {
    mode = m.mode;
    zoom = 1;
    if (m.mode === 'focus' && m.lat !== undefined && m.lng !== undefined) {
      pin.position.copy(toVec(m.lat, m.lng, 1.0));
      pin.lookAt(toVec(m.lat, m.lng, 3));
      pin.visible = true;
      pinLabel = m.label ?? '';
      const goal = -Math.PI / 2 - (m.lng * Math.PI) / 180;
      tYaw = yaw + wrapPi(goal - yaw);
      tPitch = clamp((m.lat * Math.PI) / 180, -1.05, 1.05);
    } else {
      pin.visible = false;
      pinLabel = '';
      opts.onLabel?.({ x: 0, y: 0, visible: false, label: '' });
      if (m.mode === 'spin') tPitch = 0.3;
      else tPitch = START_PITCH;
    }
    if (opts.reducedMotion) applyInstant();
    dirty = true;
    kick();
  }

  function zoomBy(f: number) { zoom = clamp(zoom * f, 0.55, 1.35); if (opts.reducedMotion) dist = baseDist() * zoom; dirty = true; kick(); }

  // Interaction: drag to rotate, pinch or +/- to zoom, ctrl/cmd + wheel to zoom (plain wheel scrolls the page).
  const pts = new Map<number, { x: number; y: number }>();
  let pinch0 = 0, zoom0 = 1;
  const onDown = (e: PointerEvent) => {
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    canvas.setPointerCapture(e.pointerId);
    if (pts.size === 1) { dragging = true; dragVx = 0; }
    if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch0 = Math.hypot(a.x - b.x, a.y - b.y); zoom0 = zoom; dragging = false; }
  };
  const onMove = (e: PointerEvent) => {
    const p = pts.get(e.pointerId);
    if (!p) return;
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    p.x = e.clientX; p.y = e.clientY;
    if (pts.size === 2) {
      const [a, b] = [...pts.values()];
      zoom = clamp(zoom0 * (pinch0 / Math.max(10, Math.hypot(a.x - b.x, a.y - b.y))), 0.55, 1.35);
      if (opts.reducedMotion) dist = baseDist() * zoom;
    } else if (dragging) {
      const k = 0.0055 * (dist / DIST.idle);
      yaw += dx * k; tYaw = yaw;
      pitch = clamp(pitch + dy * k, -1.15, 1.15); tPitch = pitch;
      dragVx = dx * k * 60; lastDragAt = performance.now();
    }
    dirty = true; kick();
  };
  const onUp = (e: PointerEvent) => {
    pts.delete(e.pointerId);
    if (pts.size === 0) { dragging = false; vel = clamp(dragVx, -4, 4); }
    dirty = true; kick();
  };
  const onWheel = (e: WheelEvent) => {
    if (!(e.ctrlKey || e.metaKey)) return;
    e.preventDefault();
    zoomBy(e.deltaY > 0 ? 1.08 : 0.92);
  };
  const onKey = (e: KeyboardEvent) => {
    const step = 0.2;
    if (e.key === 'ArrowLeft') yaw -= step; else if (e.key === 'ArrowRight') yaw += step;
    else if (e.key === 'ArrowUp') pitch = clamp(pitch - step, -1.15, 1.15); else if (e.key === 'ArrowDown') pitch = clamp(pitch + step, -1.15, 1.15);
    else if (e.key === '+' || e.key === '=') zoomBy(0.88); else if (e.key === '-' || e.key === '_') zoomBy(1.14);
    else return;
    e.preventDefault(); tYaw = yaw; tPitch = pitch; dirty = true; kick();
  };
  if (opts.interactive) {
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });
    canvas.addEventListener('keydown', onKey);
  }

  function frame(now: number) {
    raf = 0;
    if (disposed || !running) return;
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
    last = now;
    const animated = !opts.reducedMotion;
    let moving = false;

    if (animated) {
      const ease = (k: number) => 1 - Math.exp(-dt * k);
      const targetDist = baseDist() * zoom;
      dist += (targetDist - dist) * ease(mode === 'spin' ? 2.4 : 2.2);
      if (Math.abs(targetDist - dist) > 0.002) moving = true;

      if (!dragging) {
        if (mode === 'focus') {
          const err = tYaw - yaw;
          const acc = 16 * err - 8 * vel;
          vel += acc * dt; yaw += vel * dt;
          pitch += (tPitch - pitch) * ease(2.6);
          if (Math.abs(err) > 0.001 || Math.abs(vel) > 0.001 || Math.abs(tPitch - pitch) > 0.001) moving = true;
        } else {
          const target = mode === 'spin' ? 5.8 : (opts.idleSpin ?? 0.06);
          // Free spin from a drag decays into the idle rate; spin mode eases up and back down.
          vel += (target - vel) * ease(mode === 'spin' ? 3.2 : 1.6);
          yaw += vel * dt; tYaw = yaw;
          if (performance.now() - lastDragAt > 2500) pitch += (tPitch - pitch) * ease(1.2);
          moving = true;
        }
      }
    }

    earth.rotation.set(pitch, yaw, 0);
    camera.position.z = dist;
    if (pin.visible && animated) {
      const t = now / 1000;
      const s = 1 + ((t * 0.9) % 1) * 1.3;
      ring.scale.setScalar(s);
      ringMat.opacity = 0.85 * (1 - ((t * 0.9) % 1));
      moving = true;
    }
    renderer.render(scene, camera);
    frames++;
    canvas.dataset.cam = dist.toFixed(2);
    canvas.dataset.mode = mode;
    canvas.dataset.frames = String(frames);

    if (pin.visible && opts.onLabel) {
      pin.updateWorldMatrix(true, false);
      pinWorld.set(0, 0, 0.12).applyMatrix4(pin.matrixWorld);
      const outward = pinWorld.clone().normalize();
      const toCam = camera.position.clone().sub(pinWorld).normalize();
      const facing = outward.dot(toCam) > 0.2;
      const p = pinWorld.clone().project(camera);
      opts.onLabel({ x: (p.x * 0.5 + 0.5) * canvas.clientWidth, y: (-p.y * 0.5 + 0.5) * canvas.clientHeight, visible: facing, label: pinLabel });
    }

    if (!firstDone) { firstDone = true; opts.onFirstFrame?.(); (window as unknown as { __earthReady?: boolean }).__earthReady = true; }
    dirty = false;
    if (animated && (moving || dragging)) raf = requestAnimationFrame(frame);
  }
  function kick() { if (!raf && running && !disposed) { last = 0; raf = requestAnimationFrame(frame); } }

  // Pause when the canvas is offscreen or the tab is hidden.
  let onScreen = true;
  const sync = () => {
    const want = onScreen && !document.hidden;
    if (want && !running) { running = true; kick(); }
    else if (!want && running) { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; }
  };
  const io = new IntersectionObserver((es) => { onScreen = es[es.length - 1].isIntersecting; sync(); });
  io.observe(canvas);
  document.addEventListener('visibilitychange', sync);
  kick();

  return {
    send, zoomBy,
    dispose() {
      disposed = true;
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect(); io.disconnect();
      document.removeEventListener('visibilitychange', sync);
      if (opts.interactive) {
        canvas.removeEventListener('pointerdown', onDown); canvas.removeEventListener('pointermove', onMove);
        canvas.removeEventListener('pointerup', onUp); canvas.removeEventListener('pointercancel', onUp);
        canvas.removeEventListener('wheel', onWheel); canvas.removeEventListener('keydown', onKey);
      }
      disposables.forEach((d) => d.dispose());
      scene.clear();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
