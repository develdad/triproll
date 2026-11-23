// Renders the static globe poster used as the first paint of the home hero and the roll globe.
// It bundles src/lib/earth.ts, serves it with public/globe textures, screenshots one transparent frame
// with system Chrome, and writes src/assets/globe-poster.webp.
// Run: CHROME_PATH=/usr/bin/google-chrome node scripts/render-globe-poster.mjs
import { build } from 'vite';
import http from 'node:http';
import { readFileSync, existsSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, extname } from 'node:path';
import puppeteer from 'puppeteer-core';
import sharp from 'sharp';

const out = mkdtempSync(join(tmpdir(), 'earth-'));
await build({
  logLevel: 'warn',
  build: { outDir: out, emptyOutDir: true, minify: true, lib: { entry: 'src/lib/earth.ts', formats: ['es'], fileName: 'earth' } },
});

const types = { '.js': 'text/javascript', '.webp': 'image/webp', '.html': 'text/html' };
const server = http.createServer((req, res) => {
  const url = decodeURIComponent((req.url || '/').split('?')[0]);
  let file = url === '/' ? null : url.startsWith('/globe/') ? join('public', url) : join(out, url);
  if (!file) { res.setHeader('content-type', 'text/html'); res.end('<!doctype html><body style="margin:0;background:transparent"><canvas id="c" style="width:1600px;height:1600px;display:block"></canvas><script type="module">import {createEarth} from "/earth.js"; window.__go=()=>createEarth(document.getElementById("c"),{base:"/globe",interactive:false,reducedMotion:true,maxDpr:1});</script></body>'); return; }
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
await page.waitForFunction(() => window.__earthReady === true, { timeout: 60000 });
await new Promise((r) => setTimeout(r, 400));
const png = await page.screenshot({ omitBackground: true, type: 'png' });
await browser.close();
server.close();
await sharp(png).resize(1400, 1400).webp({ quality: 80, alphaQuality: 85, effort: 6 }).toFile('src/assets/globe-poster.webp');
console.log('poster written');
