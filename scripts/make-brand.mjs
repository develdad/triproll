// Draws the TripRoll mark (globe, orbit ring, map pin) and renders favicon sizes.
// Outputs: public/favicon.svg, favicon.ico (16/32/48), favicon-32.png, favicon-48.png, apple-touch-icon.png (180),
// icon-192.png, icon-512.png. The og image is built by scripts/make-og.mjs.
// Run: node scripts/make-brand.mjs
import sharp from 'sharp';
import { writeFileSync } from 'node:fs';

const TEAL = '#00a99d';
const PIN = '#fbb03b';
const PAPER = '#faf9f6';

// Bold shapes only, drawn on a 64 grid. The ring passes behind the globe (back half) and in front of it (front half).
export const mark = (bg, small = false) => `<g>
  ${small ? '' : `<g transform="rotate(-26 29 37)">
    <ellipse cx="29" cy="37" rx="29" ry="10.5" fill="none" stroke="${TEAL}" stroke-width="6"/>
  </g>`}
  <circle cx="29" cy="37" r="${small ? 24 : 22.5}" fill="${TEAL}"/>
  ${small ? `<ellipse cx="29" cy="37" rx="9" ry="24" fill="none" stroke="${bg}" stroke-width="5"/>` : `<path d="M29 14.5c-9.5 5-9.5 40 0 45M29 14.5c9.5 5 9.5 40 0 45" fill="none" stroke="${bg}" stroke-width="3.6" stroke-linecap="round"/>`}
  <path d="M${small ? 5 : 8} 37h${small ? 48 : 42}" fill="none" stroke="${bg}" stroke-width="${small ? 5 : 3.8}" stroke-linecap="round"/>
  ${small ? '' : `<g transform="rotate(-26 29 37)">
    <path d="M0 37A29 10.5 0 0 0 58 37" fill="none" stroke="${bg}" stroke-width="12"/>
    <path d="M0 37A29 10.5 0 0 0 58 37" fill="none" stroke="${TEAL}" stroke-width="6" stroke-linecap="round"/>
  </g>`}
  <path d="M49.5 1.5c-7 0-12.5 5.2-12.5 11.6 0 8.8 12.5 20.4 12.5 20.4S62 21.9 62 13.1C62 6.7 56.5 1.5 49.5 1.5z" fill="${PIN}" stroke="${bg}" stroke-width="3" stroke-linejoin="round"/>
  <circle cx="49.5" cy="13.3" r="4.3" fill="${bg}"/>
</g>`;

export const svg = (bg = PAPER, pad = 0, withBg = false, size = 64, small = false) => {
  const s = 64 + pad * 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-pad} ${-pad} ${s} ${s}" width="${size}" height="${size}">${withBg ? `<rect x="${-pad}" y="${-pad}" width="${s}" height="${s}" fill="${bg}"/>` : ''}${mark(bg, small)}</svg>`;
};

if (process.argv[1] && process.argv[1].endsWith('make-brand.mjs')) {
  // SVG favicon is transparent: the halo color is paper, which reads on light and dark tab strips.
  writeFileSync('public/favicon.svg', svg(PAPER));
  const png = (s, pad = 0, bgFill = false, small = false) => sharp(Buffer.from(svg(PAPER, pad, bgFill, 64, small)), { density: (72 * s) / 64 * 4 }).resize(s, s).png().toBuffer();
  const p16 = await png(16, 0, false, true), p32 = await png(32), p48 = await png(48);
  await sharp(p32).toFile('public/favicon-32.png');
  await sharp(p48).toFile('public/favicon-48.png');
  await sharp(await png(180, 10, true)).toFile('public/apple-touch-icon.png');
  await sharp(await png(192, 8, true)).toFile('public/icon-192.png');
  await sharp(await png(512, 8, true)).toFile('public/icon-512.png');
  // ICO container with three PNG images.
  const imgs = [[16, p16], [32, p32], [48, p48]];
  const head = Buffer.alloc(6 + 16 * imgs.length);
  head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(imgs.length, 4);
  let off = head.length;
  imgs.forEach(([s, b], i) => {
    const o = 6 + 16 * i;
    head[o] = s; head[o + 1] = s; head[o + 2] = 0; head[o + 3] = 0;
    head.writeUInt16LE(1, o + 4); head.writeUInt16LE(32, o + 6);
    head.writeUInt32LE(b.length, o + 8); head.writeUInt32LE(off, o + 12);
    off += b.length;
  });
  writeFileSync('public/favicon.ico', Buffer.concat([head, ...imgs.map(([, b]) => b)]));
  console.log('brand assets written');
}
