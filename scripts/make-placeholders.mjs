// Generates placeholder brand images with sharp:
//   public/favicon.svg, public/favicon.png, public/og-default.png (1200x630), src/assets/hero.png
// Usage: npm run placeholders -- "Business Name"
// These are PLACEHOLDERS. Replace with the real logo, favicon and og image before launch.
import sharp from 'sharp';
import { writeFileSync } from 'node:fs';

const name = process.argv[2] || 'Example Co.';
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const initial = esc(name.trim()[0]?.toUpperCase() || 'E');

const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="#1d4ed8"/><text x="32" y="45" text-anchor="middle" font-family="Arial, sans-serif" font-size="38" font-weight="700" fill="#ffffff">${initial}</text></svg>`;
writeFileSync('public/favicon.svg', favicon);
await sharp(Buffer.from(favicon)).resize(256, 256).png().toFile('public/favicon.png');

const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="1200" height="630" fill="#1d4ed8"/><text x="600" y="330" text-anchor="middle" font-family="Arial, sans-serif" font-size="84" font-weight="700" fill="#ffffff">${esc(name)}</text><text x="600" y="420" text-anchor="middle" font-family="Arial, sans-serif" font-size="32" fill="#dbe6ff">Placeholder image</text></svg>`;
await sharp(Buffer.from(og)).png().toFile('public/og-default.png');

const hero = `<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="825"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#dbe6ff"/><stop offset="1" stop-color="#93b4ff"/></linearGradient></defs><rect width="1100" height="825" fill="url(#g)"/><circle cx="550" cy="412" r="170" fill="#1d4ed8" opacity="0.85"/></svg>`;
await sharp(Buffer.from(hero)).png().toFile('src/assets/hero.png');

console.log(`placeholders written for "${name}"`);
