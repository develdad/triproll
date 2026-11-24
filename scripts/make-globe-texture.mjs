// Builds the brand globe texture from public-domain Natural Earth land (npm package world-atlas) as a flat
// equirectangular map: deep brand teal ocean, lighter teal land, a faint graticule. Output: public/globe/globe-{4096,2048}.webp
// Run: node scripts/make-globe-texture.mjs
import { readFileSync, mkdirSync } from 'node:fs';
import { feature } from 'topojson-client';
import sharp from 'sharp';

const OCEAN = '#0a4f4a';
const LAND = '#52c4b7';
const topo = JSON.parse(readFileSync('node_modules/world-atlas/land-50m.json', 'utf8'));
const land = feature(topo, topo.objects.land);
const W = 4096, H = 2048;
const X = (lng) => ((lng + 180) / 360) * W;
const Y = (lat) => ((90 - lat) / 180) * H;
// Rings that cross the antimeridian are unwrapped to continuous longitudes, then drawn at -360, 0 and +360 degrees
// so the wrapped part lands on the other edge of the map.
const ring = (r) => {
  let prev = r[0][0], off = 0;
  const pts = r.map(([x, y], i) => {
    if (i) { const dx = x + off - prev; if (dx > 180) off -= 360; else if (dx < -180) off += 360; }
    prev = x + off;
    return [x + off, y];
  });
  return [-360, 0, 360].map((k) => 'M' + pts.map(([x, y]) => `${X(x + k).toFixed(1)} ${Y(y).toFixed(1)}`).join('L') + 'Z').join('');
};
const polys = land.type === 'FeatureCollection' ? land.features.map((f) => f.geometry) : [land.geometry];
let d = '';
for (const g of polys) {
  const ps = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
  for (const p of ps) for (const r of p) d += ring(r);
}
let grat = '';
for (let lng = -180; lng <= 180; lng += 30) grat += `M${X(lng)} 0V${H}`;
for (let lat = -60; lat <= 60; lat += 30) grat += `M0 ${Y(lat)}H${W}`;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<rect width="${W}" height="${H}" fill="${OCEAN}"/>
<path d="${d}" fill="${LAND}" fill-rule="evenodd"/>
<path d="${grat}" fill="none" stroke="#ffffff" stroke-opacity="0.11" stroke-width="2.4"/>
</svg>`;
mkdirSync('public/globe', { recursive: true });
const base = await sharp(Buffer.from(svg), { density: 72 }).png().toBuffer();
await sharp(base).webp({ quality: 82, effort: 6, smartSubsample: false }).toFile('public/globe/globe-4096.webp');
await sharp(base).resize(2048, 1024, { kernel: 'lanczos3' }).webp({ quality: 82, effort: 6 }).toFile('public/globe/globe-2048.webp');
console.log('globe textures written');
