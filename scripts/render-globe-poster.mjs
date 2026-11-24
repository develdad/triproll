// Renders the static globe poster used as the first paint of the home hero and the roll page.
// It bundles src/lib/globe3d.ts, serves it with public/globe textures, screenshots one transparent frame
// with system Chrome, and writes src/assets/globe-poster.webp (globe only, no swoosh or pin) and src/data/orbit.json
// (the projected orbit the home hero draws as an SVG overlay).
// Run: CHROME_PATH=/usr/bin/google-chrome node scripts/render-globe-poster.mjs
import { build } from 'vite';
import http from 'node:http';
import { readFileSync, existsSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, extname } from 'node:path';
import puppeteer from 'puppeteer-core';
import sharp from 'sharp';
import { writeFileSync } from 'node:fs';

const out = mkdtempSync(join(tmpdir(), 'globe-'));
await build({
  logLevel: 'warn',
  build: { outDir: out, emptyOutDir: true, minify: true, lib: { entry: 'src/lib/globe3d.ts', formats: ['es'], fileName: 'globe3d' } },
});

const types = { '.js': 'text/javascript', '.webp': 'image/webp', '.html': 'text/html' };
const server = http.createServer((req, res) => {
  const url = decodeURIComponent((req.url || '/').split('?')[0]);
  const file = url === '/' ? null : url.startsWith('/globe/') ? join('public', url) : join(out, url);
  if (!file) { res.setHeader('content-type', 'text/html'); res.end('<!doctype html><body style="margin:0;background:transparent"><canvas id="c" style="width:1600px;height:1600px;display:block"></canvas><script type="module">import {createGlobe} from "/globe3d.js"; window.__go=()=>createGlobe(document.getElementById("c"),{base:"/globe",interactive:false,reducedMotion:true,maxDpr:1,bare:true});</script></body>'); return; }
  if (!existsSync(file)) { res.statusCode = 404; res.end(); return; }
  res.setHeader('content-type', types[extname(file)] || 'application/octet-stream');
  res.end(readFileSync(file));
});
await new Promise((r) => server.listen(0, r));
const port = server.address().port;

const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome',
  headless: 'new',
  args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1600, height: 1600, deviceScaleFactor: 1 });
await page.goto(`http://localhost:${port}/`);
await page.evaluate(() => window.__go());
await page.waitForFunction(() => window.__globeReady === true, { timeout: 60000 });
await new Promise((r) => setTimeout(r, 400));
const orbit = await page.evaluate(() => window.__orbit);
const png = await page.screenshot({ omitBackground: true, type: 'png' });
await browser.close();
server.close();
await sharp(png).resize(1400, 1400).webp({ quality: 82, alphaQuality: 90, effort: 6 }).toFile('src/assets/globe-poster.webp');

// Orbit overlay data: rounded samples, plus a clip polygon on each side of the line through the two points where the
// orbit crosses the globe's center depth. The back half is drawn under the poster, the front half over it.
const { samples, front, depth, startPin } = orbit;
const n = samples.length;
const cross = [];
for (let i = 0; i < n; i++) {
  const j = (i + 1) % n;
  if (front[i] !== front[j]) {
    const k = depth[i] / (depth[i] - depth[j]);
    cross.push([samples[i][0] + (samples[j][0] - samples[i][0]) * k, samples[i][1] + (samples[j][1] - samples[i][1]) * k]);
  }
}
if (cross.length !== 2) throw new Error('expected two depth crossings, got ' + cross.length);
const [A, B] = cross;
const d = [B[0] - A[0], B[1] - A[1]];
const len = Math.hypot(...d);
let nrm = [-d[1] / len, d[0] / len];
const mean = samples.filter((_, i) => front[i]).reduce((s, p) => [s[0] + p[0], s[1] + p[1]], [0, 0]).map((v) => v / front.filter(Boolean).length);
if ((mean[0] - A[0]) * nrm[0] + (mean[1] - A[1]) * nrm[1] < 0) nrm = [-nrm[0], -nrm[1]];
const big = 400;
const poly = (s) => [[A[0] - (d[0] / len) * big, A[1] - (d[1] / len) * big], [B[0] + (d[0] / len) * big, B[1] + (d[1] / len) * big], [B[0] + (d[0] / len) * big + s * nrm[0] * big, B[1] + (d[1] / len) * big + s * nrm[1] * big], [A[0] - (d[0] / len) * big + s * nrm[0] * big, A[1] - (d[1] / len) * big + s * nrm[1] * big]].map((p) => p.map((v) => +v.toFixed(2)).join(',')).join(' ');
const r2 = (v) => +v.toFixed(2);
writeFileSync('src/data/orbit.json', JSON.stringify({ startPin, samples: samples.map((s) => s.map(r2)), clipFront: poly(1), clipBack: poly(-1) }) + '\n');
console.log('poster and orbit written');
