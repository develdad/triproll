import { useEffect, useRef, useState } from 'react';
import { lastGlobe, onGlobe } from '../../lib/globeBus.ts';
import type { Earth } from '../../lib/earth.ts';
import Icon from './Icon.tsx';

type Props = { variant: 'hero' | 'roll' };

function hasWebGL(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch { return false; }
}

// The static poster (rendered by the page) is always underneath. This island only adds the live canvas on top,
// and only when it is worth it: hero loads on idle (desktop) or first interaction (small screens), never under
// reduced motion; the roll globe always loads because it carries state, and renders single frames when motion is reduced.
export default function Globe({ variant }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const label = useRef<HTMLDivElement>(null);
  const earthRef = useRef<Earth | null>(null);
  const [live, setLive] = useState(false);
  const interactive = variant === 'roll';

  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (variant === 'hero' && reduced) return;
    if (!hasWebGL()) return;

    let cancelled = false;
    let off: (() => void) | undefined;
    const cleanups: (() => void)[] = [];

    const start = async () => {
      if (cancelled) return;
      try {
        const { createEarth } = await import('../../lib/earth.ts');
        if (cancelled) return;
        const earth = await createEarth(el, {
          base: '/globe', interactive, reducedMotion: reduced, idleSpin: variant === 'hero' ? 0.05 : 0.06,
          onFirstFrame: () => setLive(true),
          onLabel: ({ x, y, visible, label: text }) => {
            const l = label.current;
            if (!l) return;
            l.style.opacity = visible ? '1' : '0';
            l.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px) translate(-50%, -135%)`;
            if (l.textContent !== text) l.textContent = text;
          },
        });
        if (cancelled) { earth.dispose(); return; }
        earthRef.current = earth;
        const first = lastGlobe();
        if (first) earth.send(first);
        off = onGlobe((m) => earth.send(m));
      } catch { /* the poster stays */ }
    };

    if (variant === 'roll') {
      start();
    } else if (window.matchMedia('(min-width: 900px)').matches) {
      const go = () => {
        const ric = (window as unknown as { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
        if (ric) ric(start, { timeout: 3500 }); else setTimeout(start, 2000);
      };
      if (document.readyState === 'complete') go();
      else { window.addEventListener('load', go, { once: true }); cleanups.push(() => window.removeEventListener('load', go)); }
    } else {
      const once = () => { cleanups.forEach((c) => c()); start(); };
      ['pointerdown', 'touchstart', 'scroll', 'keydown'].forEach((t) => {
        window.addEventListener(t, once, { once: true, passive: true });
        cleanups.push(() => window.removeEventListener(t, once));
      });
    }

    return () => {
      cancelled = true;
      cleanups.forEach((c) => c());
      off?.();
      earthRef.current?.dispose();
      earthRef.current = null;
    };
  }, [variant, interactive]);

  return (
    <div className={`globe-live ${variant}${live ? ' live' : ''}`}>
      <canvas
        ref={canvas}
        tabIndex={interactive ? 0 : -1}
        role={interactive ? 'img' : undefined}
        aria-label={interactive ? 'Interactive globe. Drag to rotate. Use plus and minus to zoom.' : undefined}
        aria-hidden={interactive ? undefined : true}
      />
      <div className="globe-pin-label" ref={label} aria-hidden="true" />
      {interactive && live && (
        <div className="globe-controls">
          <button type="button" onClick={() => earthRef.current?.zoomBy(0.85)} aria-label="Zoom in"><Icon name="plus" /></button>
          <button type="button" onClick={() => earthRef.current?.zoomBy(1.18)} aria-label="Zoom out"><Icon name="minus" /></button>
        </div>
      )}
    </div>
  );
}
