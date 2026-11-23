// Optional. Pings IndexNow (Bing, Yandex and others) with every URL in the sitemap.
// Setup once: generate a key (8 to 128 hex chars), save it as public/<key>.txt containing
// only the key, and set INDEXNOW_KEY in the shell. Run after a production deploy:
//   INDEXNOW_KEY=<key> npm run indexnow
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const key = process.env.INDEXNOW_KEY;
if (!key || !/^[a-zA-Z0-9-]{8,128}$/.test(key)) {
  console.error('Set INDEXNOW_KEY (8 to 128 chars: letters, digits, dash).');
  process.exit(1);
}
const { site } = await import(new URL('../src/site.config.ts', import.meta.url).href);
if (site.mode !== 'live') {
  console.error('Site is in demo mode. IndexNow is only for live sites.');
  process.exit(1);
}
const dist = new URL('../dist/', import.meta.url).pathname;
const urls = [];
const index = readFileSync(join(dist, 'sitemap-index.xml'), 'utf8');
for (const m of index.matchAll(/<loc>([^<]+)<\/loc>/g)) {
  const file = m[1].split('/').pop();
  const xml = readFileSync(join(dist, file), 'utf8');
  for (const u of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) urls.push(u[1]);
}
const host = new URL(site.domain).host;
const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host, key, keyLocation: `${site.domain}/${key}.txt`, urlList: urls }),
});
console.log(`IndexNow: submitted ${urls.length} URLs, HTTP ${res.status}`);
process.exit(res.status === 200 || res.status === 202 ? 0 : 1);
