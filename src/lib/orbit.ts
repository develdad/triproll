// The orbit swoosh and the amber pin as an SVG overlay for the globe poster. The geometry comes from
// src/data/orbit.json, which scripts/render-globe-poster.mjs writes from the same scene as the poster.
// Everything here is pure data and string building: the overlay needs no JavaScript in the browser.
import data from '../data/orbit.json';

type Sample = [number, number, number, number]; // x, y (percent of the square), apparent pin radius, outward angle in degrees
const base = data.samples as Sample[];
const n = base.length;
const at = (i: number) => base[i % n];

// Outward angles made continuous over one full loop (index n is index 0 again) so interpolation never flips the pin.
const angles: number[] = [];
for (let i = 0; i <= n; i++) {
  let a = at(i)[3];
  if (i > 0) { while (a - angles[i - 1] > 180) a -= 360; while (a - angles[i - 1] < -180) a += 360; }
  angles.push(a);
}

export const ORBIT_PATH = 'M' + base.map((s) => `${s[0]} ${s[1]}`).join('L') + 'Z';
export const CLIP_FRONT = data.clipFront;
export const CLIP_BACK = data.clipBack;
export const ORBIT_SECONDS = 26;
export const TRAILS = [{ len: 30, opacity: 0.22 }, { len: 12, opacity: 0.38 }] as const;

// Arc-length position (0 to 100) of each sample along the closed path.
const cum: number[] = [0];
for (let i = 1; i <= n; i++) cum.push(cum[i - 1] + Math.hypot(at(i)[0] - at(i - 1)[0], at(i)[1] - at(i - 1)[1]));
const along = (i: number) => (cum[i] / cum[n]) * 100;

const f = (v: number, d = 2) => +v.toFixed(d);
const transform = (x: number, y: number, ang: number, r: number) => `translate(${f(x)}px,${f(y)}px) rotate(${f(ang, 1)}deg) scale(${f(r)})`;

// Pose at fractional position t (0 to 1) around the orbit.
function poseAt(t: number) {
  const x = t * n, i = Math.floor(x), k = x - i, a = at(i), b = at(i + 1);
  const lerp = (p: number, q: number) => p + (q - p) * k;
  return { x: lerp(a[0], b[0]), y: lerp(a[1], b[1]), r: lerp(a[2], b[2]), ang: lerp(angles[i], angles[i + 1]), h: lerp(along(i), along(i + 1)) };
}
const start = poseAt(data.startPin);
export const START_TRANSFORM = transform(start.x, start.y, start.ang, start.r);
export const START_DELAY = -f(data.startPin * ORBIT_SECONDS, 2);
export const trailStartOffset = (len: number) => f(len - start.h, 2);

// Keyframes at every second sample (60 frames), looping back to the first.
const STEP = 2;
export function orbitKeyframes(): string {
  const idx: number[] = [];
  for (let i = 0; i < n; i += STEP) idx.push(i);
  idx.push(n);
  const pct = (i: number) => f((i / n) * 100, 2);
  const pin = idx.map((i) => `${pct(i)}%{transform:${transform(at(i)[0], at(i)[1], angles[i], at(i)[2])}}`).join('');
  const trails = TRAILS.map((t, k) => `@keyframes orbit-trail-${k}{${idx.map((i) => `${pct(i)}%{stroke-dashoffset:${f(t.len - along(i), 2)}}`).join('')}}`).join('');
  return `@keyframes orbit-pin{${pin}}${trails}`;
}
