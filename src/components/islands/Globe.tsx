import { useEffect, useRef, useState } from 'react';
import createGlobe from 'cobe';
import { lastGlobe, onGlobe, type GlobeMsg } from '../../lib/globeBus.ts';

const toAngles = (lat: number, lng: number): [number, number] => [Math.PI - ((lng * Math.PI) / 180 - Math.PI / 2), (lat * Math.PI) / 180];
const wrap = (a: number) => ((a + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;

// Static fallback shown until WebGL is ready, and when it is unavailable.
function Fallback() {
  return (
    <svg viewBox="0 0 200 200" role="img" aria-label="Globe outline">
      <circle cx="100" cy="100" r="92" fill="#141413" />
      <g fill="none" stroke="#6fd0d4" strokeWidth="1.4" opacity="0.9">
        <circle cx="100" cy="100" r="92" />
        <ellipse cx="100" cy="100" rx="38" ry="92" />
        <ellipse cx="100" cy="100" rx="72" ry="92" opacity="0.5" />
        <line x1="8" y1="100" x2="192" y2="100" />
        <path d="M14 62 Q100 82 186 62" />
        <path d="M14 138 Q100 118 186 138" />
      </g>
    </svg>
  );
}

export default function Globe() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let globe: ReturnType<typeof createGlobe>;
    try {
      globe = createGlobe(el, {
        devicePixelRatio: 2, width: 1000, height: 1000, phi: 0.4, theta: 0.3, dark: 0.85, diffuse: 1.6,
        mapSamples: 16000, mapBrightness: 9, baseColor: [0.2, 0.22, 0.22], markerColor: [0.44, 0.82, 0.83],
        glowColor: [0.05, 0.3, 0.32], markers: [],
      });
    } catch { return; }
    setReady(true);

    let phi = 0.4, theta = 0.3, mode: GlobeMsg['mode'] = 'idle', tPhi = 0, tTheta = 0, raf = 0, markers: { location: [number, number]; size: number }[] = [];
    const apply = (m: GlobeMsg) => {
      mode = m.mode;
      if (m.mode === 'focus' && m.lat !== undefined && m.lng !== undefined) {
        [tPhi, tTheta] = toAngles(m.lat, m.lng);
        markers = [{ location: [m.lat, m.lng], size: 0.09 }];
        if (reduced) { phi = tPhi; theta = tTheta; }
      } else { markers = []; }
      if (reduced) globe.update({ phi, theta, markers });
    };
    const first = lastGlobe();
    if (first) apply(first);
    else if (reduced) globe.update({ phi, theta, markers });
    const off = onGlobe(apply);

    const tick = () => {
      if (mode === 'spin') phi += 0.11;
      else if (mode === 'focus') { phi += wrap(tPhi - phi) * 0.06; theta += (tTheta - theta) * 0.06; }
      else { phi += 0.003; theta += (0.3 - theta) * 0.04; }
      globe.update({ phi, theta, markers });
      raf = requestAnimationFrame(tick);
    };
    if (!reduced) raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); off(); globe.destroy(); };
  }, []);

  return (
    <div className={`globe${ready ? ' ready' : ''}`}>
      <Fallback />
      <canvas ref={canvas} width={1000} height={1000} aria-hidden="true" />
    </div>
  );
}
