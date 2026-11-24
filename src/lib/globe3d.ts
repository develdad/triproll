// Stylized brand globe: deep teal ocean, flat lighter-tint land from a generated mask, a faint graticule, soft diffuse
// shading, a subtle same-hue rim light, one orbit swoosh and a small amber pin travelling along it (the logo mark, alive).
// Loaded lazily by the Globe island (dynamic import) so marketing pages do not pay for three.js up front.
// The same module renders the static poster (scripts/render-globe-poster.mjs).
import {
  AdditiveBlending, Color, ConeGeometry, DoubleSide, Group, Mesh, MeshBasicMaterial, PerspectiveCamera, Curve, Scene, ShaderMaterial,
  SphereGeometry, SRGBColorSpace, TextureLoader, TubeGeometry, Vector3, WebGLRenderer, type Texture,
} from 'three';

export type GlobeMode = 'idle' | 'whip' | 'calm';
export type GlobeOptions = {
  base: string; // URL prefix for textures, for example /globe
  interactive: boolean;
  reducedMotion: boolean;
  maxDpr?: number;
  idleSpin?: number; // rad/s
  onFirstFrame?: () => void;
};
export type Globe3d = { setMode: (m: GlobeMode) => void; dispose: () => void };

// The poster and the first live frame share this view.
export const START_YAW = -1.9;
export const START_PITCH = 0.32;
const START_PIN = 0.035; // fraction around the orbit
const DIST = 6.3;
const ORBIT_R = 1.42;
const TAU = Math.PI * 2;
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

class Orbit extends Curve<Vector3> {
  constructor() { super(); }
  getPoint(t: number, target = new Vector3()) {
    const a = t * TAU;
    return target.set(Math.cos(a) * ORBIT_R, 0, Math.sin(a) * ORBIT_R);
  }
}

const SPHERE_VERT = `varying vec3 vN; varying vec3 vV; varying vec2 vUv;
void main(){ vUv = uv; vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`;
const SPHERE_FRAG = `uniform sampler2D uMap; uniform vec3 uLight; uniform vec3 uRim; varying vec3 vN; varying vec3 vV; varying vec2 vUv;
void main(){
  vec3 base = texture2D(uMap, vUv).rgb;
  float d = dot(normalize(vN), normalize(uLight));
  float diffuse = pow(clamp(d * 0.5 + 0.5, 0.0, 1.0), 1.7);
  vec3 col = base * (0.42 + 0.78 * diffuse);
  float f = pow(1.0 - clamp(dot(normalize(vN), normalize(vV)), 0.0, 1.0), 3.0);
  col += uRim * f * 0.34 * (0.45 + 0.55 * diffuse);
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}`;
const TRAIL_VERT = `varying float vT; void main(){ vT = uv.x; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`;
const TRAIL_FRAG = `uniform float uHead; uniform vec3 uColor; varying float vT;
void main(){ float behind = fract(uHead - vT); float a = 0.2 + 0.6 * exp(-behind * 7.0); gl_FragColor = vec4(uColor, a);
  #include <colorspace_fragment>
}`;

function loadTexture(url: string): Promise<Texture> {
  return new Promise((resolve, reject) => {
    new TextureLoader().load(url, (t) => { t.colorSpace = SRGBColorSpace; resolve(t); }, undefined, reject);
  });
}

export async function createGlobe(canvas: HTMLCanvasElement, opts: GlobeOptions): Promise<Globe3d> {
  let dpr = Math.min(window.devicePixelRatio || 1, opts.maxDpr ?? 2);
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  const gl = renderer.getContext();
  const dbg = gl.getExtension('WEBGL_debug_renderer_info');
  const gpu = dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)) : '';
  const software = /swiftshader|llvmpipe|software/i.test(gpu);
  if (software) dpr = Math.min(dpr, 1.5);
  renderer.setPixelRatio(dpr);
  renderer.setClearColor(0x000000, 0);

  const scene = new Scene();
  const camera = new PerspectiveCamera(28, 1, 0.1, 50);
  camera.position.set(0, 0, DIST);

  const disposables: { dispose: () => void }[] = [];
  const track = <T extends { dispose: () => void }>(o: T): T => { disposables.push(o); return o; };

  const tex = track(await loadTexture(`${opts.base}/globe-${window.innerWidth < 900 || software ? 2048 : 4096}.webp`));
  tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());

  const earthGeo = track(new SphereGeometry(1, 128, 96));
  const earthMat = track(new ShaderMaterial({
    vertexShader: SPHERE_VERT, fragmentShader: SPHERE_FRAG,
    uniforms: { uMap: { value: tex }, uLight: { value: new Vector3(-0.6, 0.55, 0.9) }, uRim: { value: new Color(0x5fe0d4) } },
  }));
  const earth = new Mesh(earthGeo, earthMat);
  scene.add(earth);

  // Orbit group is fixed in the scene (like the logo's swoosh); the earth turns inside it.
  const orbit = new Group();
  orbit.rotation.set(0.42, 0, 0.45);
  scene.add(orbit);
  const trailGeo = track(new TubeGeometry(new Orbit(), 360, 0.009, 8, true));
  const trailMat = track(new ShaderMaterial({ vertexShader: TRAIL_VERT, fragmentShader: TRAIL_FRAG, uniforms: { uHead: { value: START_PIN }, uColor: { value: new Color(0x5fe0d4) } }, transparent: true, depthWrite: false, side: DoubleSide, blending: AdditiveBlending }));
  orbit.add(new Mesh(trailGeo, trailMat));

  // Pin: an amber teardrop whose tip points at the globe, with a small light dot, as in the logo.
  const pin = new Group();
  const amber = track(new MeshBasicMaterial({ color: 0xfbb03b }));
  const dotMat = track(new MeshBasicMaterial({ color: 0xfff6e2 }));
  const headGeo = track(new SphereGeometry(0.052, 28, 20));
  const tailGeo = track(new ConeGeometry(0.052, 0.12, 28, 1)); tailGeo.rotateX(-Math.PI / 2); // tip toward -z (the globe)
  const dotGeo = track(new SphereGeometry(0.016, 14, 10));
  const head = new Mesh(headGeo, amber), tail = new Mesh(tailGeo, amber), dot = new Mesh(dotGeo, dotMat);
  head.position.z = 0.1; tail.position.z = 0.05;
  pin.add(head, tail, dot);
  orbit.add(pin);
  const inward = new Vector3(), tipDir = new Vector3(0, 0, -1);
  const placePin = (t: number) => {
    const a = t * TAU;
    pin.position.set(Math.cos(a) * ORBIT_R, 0, Math.sin(a) * ORBIT_R);
    inward.set(-Math.cos(a), 0, -Math.sin(a));
    pin.quaternion.setFromUnitVectors(tipDir, inward);
  };
  const camLocal = new Vector3();
  const faceDot = () => {
    scene.updateMatrixWorld();
    camLocal.copy(camera.position); pin.worldToLocal(camLocal).normalize();
    dot.position.copy(head.position).addScaledVector(camLocal, 0.046);
  };

  let yaw = START_YAW, pitch = START_PITCH, yawVel = 0;
  let pinT = START_PIN, pinVel = 0;
  const idleSpin = opts.reducedMotion ? 0 : (opts.idleSpin ?? 0.07);
  const idlePin = 0.06; // orbits per second
  let mode: GlobeMode = 'idle';
  let modeAt = 0;
  let dragging = false, lastDragAt = 0, dragVx = 0;
  let running = true, raf = 0, last = 0, firstDone = false, disposed = false, frames = 0;

  function size() {
    const w = Math.max(1, canvas.clientWidth), h = Math.max(1, canvas.clientHeight);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = w / h < 1 ? (2 * Math.atan(Math.tan((28 * Math.PI) / 360) / (w / h)) * 180) / Math.PI : 28;
    camera.updateProjectionMatrix();
    draw();
  }
  const ro = new ResizeObserver(size);
  ro.observe(canvas);

  function draw() {
    earth.rotation.set(pitch, yaw, 0);
    placePin(pinT);
    faceDot();
    trailMat.uniforms.uHead.value = pinT;
    renderer.render(scene, camera);
    frames++;
    canvas.dataset.frames = String(frames);
    canvas.dataset.mode = mode;
    if (!firstDone) { firstDone = true; opts.onFirstFrame?.(); (window as unknown as { __globeReady?: boolean }).__globeReady = true; }
  }
  size();

  function setMode(m: GlobeMode) {
    mode = m;
    modeAt = performance.now();
    if (opts.reducedMotion) { yaw += m === 'whip' ? 1.2 : 0; pinT = (pinT + 0.4) % 1; draw(); return; }
    kick();
  }

  // Drag to rotate (the roll globe). No zoom.
  const onDown = (e: PointerEvent) => { dragging = true; dragVx = 0; canvas.setPointerCapture(e.pointerId); };
  const onMove = (e: PointerEvent) => {
    if (!dragging) return;
    const k = 0.0058;
    yaw += e.movementX * k;
    pitch = clamp(pitch + e.movementY * k, -1.1, 1.1);
    dragVx = e.movementX * k * 60; lastDragAt = performance.now();
    if (opts.reducedMotion) draw(); else kick();
  };
  const onUp = () => { if (!dragging) return; dragging = false; yawVel = clamp(dragVx, -3, 3); kick(); };
  const onKey = (e: KeyboardEvent) => {
    const step = 0.22;
    if (e.key === 'ArrowLeft') yaw -= step; else if (e.key === 'ArrowRight') yaw += step;
    else if (e.key === 'ArrowUp') pitch = clamp(pitch - step, -1.1, 1.1); else if (e.key === 'ArrowDown') pitch = clamp(pitch + step, -1.1, 1.1);
    else return;
    e.preventDefault(); draw();
  };
  if (opts.interactive) {
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onUp);
    canvas.addEventListener('keydown', onKey);
  }

  function frame(now: number) {
    raf = 0;
    if (disposed || !running) return;
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
    last = now;
    const ease = (k: number) => 1 - Math.exp(-dt * k);
    // Targets: idle drifts; whip spins the earth up and sends the pin around the orbit, then eases back down.
    const since = (performance.now() - modeAt) / 1000;
    let yawTarget = idleSpin, pinTarget = idlePin, k = 1.4;
    if (mode === 'whip') {
      const up = since < 1.35;
      yawTarget = up ? 4.2 : idleSpin; pinTarget = up ? 2.4 : idlePin; k = up ? 4.5 : 2.6;
    }
    if (!dragging) {
      yawVel += (yawTarget - yawVel) * ease(k);
      yaw += yawVel * dt;
      if (performance.now() - lastDragAt > 2500) pitch += (START_PITCH - pitch) * ease(0.8);
    }
    pinVel += (pinTarget - pinVel) * ease(mode === 'whip' ? 5 : 2);
    pinT = (pinT + pinVel * dt) % 1;
    draw();
    raf = requestAnimationFrame(frame);
  }
  function kick() { if (!raf && running && !disposed && !opts.reducedMotion) { last = 0; raf = requestAnimationFrame(frame); } }

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
    setMode,
    dispose() {
      disposed = true;
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect(); io.disconnect();
      document.removeEventListener('visibilitychange', sync);
      if (opts.interactive) {
        canvas.removeEventListener('pointerdown', onDown); canvas.removeEventListener('pointermove', onMove);
        canvas.removeEventListener('pointerup', onUp); canvas.removeEventListener('pointercancel', onUp); canvas.removeEventListener('keydown', onKey);
      }
      disposables.forEach((d) => d.dispose());
      scene.clear();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
