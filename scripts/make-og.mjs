// Builds public/favicon.png (256px) from public/favicon.svg and public/og-default.png (1200x630).
// Flat ink background, one accent. Run: node scripts/make-og.mjs
import sharp from 'sharp';
import { readFileSync } from 'node:fs';

await sharp(readFileSync('public/favicon.svg')).resize(256, 256).png().toFile('public/favicon.png');

const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<rect width="1200" height="630" fill="#141413"/>
<rect x="72" y="72" width="1056" height="486" fill="none" stroke="#3a3935" stroke-width="2"/>
<text x="120" y="190" font-family="DejaVu Sans Mono, monospace" font-size="24" letter-spacing="4" fill="#5fc4c8">TRIPROLL  /  SEALED TRIP</text>
<text x="120" y="340" font-family="Instrument Serif, Georgia, serif" font-size="128" fill="#faf9f6">Spin the globe.</text>
<text x="120" y="470" font-family="Instrument Serif, Georgia, serif" font-size="128" font-style="italic" fill="#5fc4c8">Get a trip.</text>
<g transform="translate(985 175) scale(0.55)" fill="none" stroke="#5fc4c8" stroke-width="3">
<circle r="130"/><ellipse rx="52" ry="130"/><line x1="-130" x2="130"/><path d="M-120 -50 Q0 -20 120 -50"/><path d="M-120 50 Q0 20 120 50"/>
</g>
<circle cx="1015" cy="147" r="6" fill="#faf9f6"/>
</svg>`;
await sharp(Buffer.from(og)).png().toFile('public/og-default.png');
console.log('favicon.png and og-default.png written');
