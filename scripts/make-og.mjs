// Builds public/og-default.png (1200x630): the brand logo, the tagline and the globe render on deep ink-teal.
// Needs src/assets/globe-poster.webp (npm run poster) and system Chrome. Run: node scripts/make-og.mjs
import puppeteer from 'puppeteer-core';
import { readFileSync } from 'node:fs';

const b64 = (p, mime) => `data:${mime};base64,${readFileSync(p).toString('base64')}`;
const serif = b64('node_modules/@fontsource/instrument-serif/files/instrument-serif-latin-400-normal.woff2', 'font/woff2');
const serifI = b64('node_modules/@fontsource/instrument-serif/files/instrument-serif-latin-400-italic.woff2', 'font/woff2');
const sans = b64('node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2', 'font/woff2');
const globe = b64('src/assets/globe-poster.webp', 'image/webp');
const mark = b64('public/favicon.svg', 'image/svg+xml');

const html = `<!doctype html><meta charset="utf-8"><style>
@font-face{font-family:S;src:url(${serif})}
@font-face{font-family:S;font-style:italic;src:url(${serifI})}
@font-face{font-family:I;src:url(${sans});font-weight:100 900}
*{box-sizing:border-box}html{overflow:hidden;width:1200px;height:630px}body{margin:0;width:1200px;height:630px;position:relative;overflow:hidden;background:radial-gradient(90% 90% at 78% 30%,#08423e 0%,#052e2b 60%,#031f1d 100%);font-family:I}
.g{position:absolute;width:880px;height:880px;right:-150px;top:-120px}
.s{position:absolute;inset:0;background:linear-gradient(90deg,rgba(4,28,31,.92) 0%,rgba(4,28,31,.55) 45%,transparent 70%)}
.t{position:absolute;left:84px;top:80px}
.brand{display:flex;align-items:center;gap:18px}.brand img{width:76px;height:76px}.brand span{font:700 44px/1 I;color:#fff;letter-spacing:-0.5px}
h1{font:400 128px/0.95 S;color:#fff;margin:64px 0 0;letter-spacing:-1px}
h1 em{color:#4fd9cc}
p{font:500 27px/1.4 I;color:#cfe0df;margin:34px 0 0;width:560px}
</style><body><img class="g" src="${globe}"><div class="s"></div>
<div class="t"><div class="brand"><img src="${mark}"><span>TripRoll</span></div><h1>Spin the globe.<br><em>Get a trip.</em></h1><p>Surprise trips, fully planned. The destination stays sealed until you fly.</p></div>
</body>`;

const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
await page.setContent(html, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: 'public/og-default.png', type: 'png', clip: { x: 0, y: 0, width: 1200, height: 630 } });
await browser.close();
console.log('og-default.png written');
