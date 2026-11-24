// Static markup only: rendered at build time, never hydrated. Draws the orbit swoosh and the amber pin over the globe poster.
// The back half sits under the poster and the front half over it, so the globe passes in front of the far side of the orbit.
// Motion is CSS (see .orbit rules in global.css); animate adds the keyframes for it.
import { CLIP_BACK, CLIP_FRONT, ORBIT_PATH, START_TRANSFORM, TRAILS, orbitKeyframes, trailStartOffset } from '../../lib/orbit.ts';

function Layer({ side }: { side: 'back' | 'front' }) {
  const clip = side === 'back' ? 'url(#orbit-back)' : 'url(#orbit-front)';
  return (
    <svg className={`orbit orbit-${side}`} viewBox="0 0 100 100" aria-hidden="true" focusable="false" preserveAspectRatio="xMidYMid meet">
      {side === 'back' && (
        <defs>
          <clipPath id="orbit-back"><polygon points={CLIP_BACK} /></clipPath>
          <clipPath id="orbit-front"><polygon points={CLIP_FRONT} /></clipPath>
        </defs>
      )}
      <g clipPath={clip}>
        <path className="ring" d={ORBIT_PATH} />
        {TRAILS.map((t, k) => (
          <path key={k} className={`trail trail-${k}`} d={ORBIT_PATH} pathLength={100} style={{ strokeDasharray: `${t.len} ${100 - t.len}`, strokeDashoffset: trailStartOffset(t.len), opacity: t.opacity }} />
        ))}
        <g className="pin" style={{ transform: START_TRANSFORM }}>
          <path d="M0 0L0.854 -1.399A1 1 0 1 0 -0.854 -1.399Z" fill="#fbb03b" />
          <circle cx="0.22" cy="-2.12" r="0.3" fill="#fff6e2" />
        </g>
      </g>
    </svg>
  );
}

export default function OrbitOverlay({ part, animate = false }: { part: 'back' | 'front'; animate?: boolean }) {
  return (
    <>
      <Layer side={part} />
      {animate && part === 'back' && <style dangerouslySetInnerHTML={{ __html: orbitKeyframes() }} />}
    </>
  );
}
