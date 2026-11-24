// Builds the footer logo from the OFFICIAL light logo file (never redrawn).
// The official light PNG is light gray on transparent. We keep its alpha and fill it with the footer text color.
// Also refreshes the header logo and the JSON-LD logo from the official primary file.
// Usage: node scripts/make-logo.mjs [dir with the official logo files]  (default /home/claude/logos)
import sharp from 'sharp';
const dir = process.argv[2] || '/home/claude/logos';
const FOOT = { r: 0xf2, g: 0xef, b: 0xe8 }; // --ink-text
const light = `${dir}/TripRoll Logo Light.png`;
const primary = `${dir}/TripRoll Logo Primary.png`;
const W = 2712, H = 695;
// Compose: flat color with the official alpha.
const flat = await sharp({ create: { width: W, height: H, channels: 4, background: { ...FOOT, alpha: 1 } } })
  .composite([{ input: await sharp(light).ensureAlpha().toBuffer(), blend: 'dest-in' }])
  .png().toBuffer();
for (const [h, tag] of [[43, '1x'], [86, '2x']]) {
  const w = Math.round((h * W) / H);
  const r = sharp(flat).resize(w, h, { kernel: 'lanczos3' });
  await r.clone().webp({ quality: 92, alphaQuality: 100, effort: 6 }).toFile(`public/brand/logo-light-${tag}.webp`);
  await r.clone().png({ compressionLevel: 9 }).toFile(`public/brand/logo-light-${tag}.png`);
}
await sharp(primary).resize(1357, 348, { kernel: 'lanczos3' }).png({ compressionLevel: 9 }).toFile('src/assets/logo.png');
await sharp(primary).resize(900, 231, { kernel: 'lanczos3' }).png({ compressionLevel: 9 }).toFile('public/logo.png');
console.log('logos written');
