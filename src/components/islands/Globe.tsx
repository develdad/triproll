import { useEffect, useRef, useState } from 'react';
import type { Globe3d, GlobeMode } from '../../lib/globe3d.ts';

type Props = { variant: 'hero' | 'stage' | 'side'; mode?: GlobeMode };

function hasWebGL(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch { return false; }
}

// The static poster (rendered by the page) is always underneath. This island only adds the live canvas on top.
// Hero: loads on idle (desktop only) and never under reduced motion. Stage and side (the roll page) always load,
// and render single frames when motion is reduced. The roll page drives it with the `mode` prop.
export default function Globe({ variant, mode = 'idle' }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const globeRef = useRef<Globe3d | null>(null);
  const modeRef = useRef<GlobeMode>(mode);
  const [live, setLive] = useState(false);
  const interactive = variant !== 'hero';
  modeRef.current = mode;

  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (variant === 'hero' && reduced) return;
    if (!hasWebGL()) return;

    let cancelled = false;
    const cleanups: (() => void)[] = [];
    const start = async () => {
      if (cancelled) return;
      try {
        const { createGlobe } = await import('../../lib/globe3d.ts');
        if (cancelled) return;
        const g = await createGlobe(el, {
          base: '/globe', interactive, reducedMotion: reduced, idleSpin: variant === 'hero' ? 0.05 : 0.07,
          onFirstFrame: () => setLive(true),
        });
        if (cancelled) { g.dispose(); return; }
        globeRef.current = g;
        if (modeRef.current !== 'idle') g.setMode(modeRef.current);
      } catch { /* the poster stays */ }
    };

    if (variant !== 'hero') {
      start();
    } else {
      const go = () => {
        const ric = (window as unknown as { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
        if (ric) ric(start, { timeout: 3500 }); else setTimeout(start, 2000);
      };
      if (document.readyState === 'complete') go();
      else { window.addEventListener('load', go, { once: true }); cleanups.push(() => window.removeEventListener('load', go)); }
    }
    return () => {
      cancelled = true;
      cleanups.forEach((c) => c());
      globeRef.current?.dispose();
      globeRef.current = null;
    };
  }, [variant, interactive]);

  useEffect(() => { globeRef.current?.setMode(mode); }, [mode]);

  return (
    <div className={`globe-live ${variant}${live ? ' live' : ''}`}>
      <canvas
        ref={canvas}
        tabIndex={interactive ? 0 : -1}
        role={interactive ? 'img' : undefined}
        aria-label={interactive ? 'Decorative globe. Drag to rotate it.' : undefined}
        aria-hidden={interactive ? undefined : true}
      />
    </div>
  );
}
