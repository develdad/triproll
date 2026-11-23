// Converts the NASA Blue Marble day map and topology bump map to WebP in public/globe.
// Inputs (not committed): /tmp/earth-blue-marble.jpg (4096x2048) and /tmp/earth-topology.png (2048x1024).
// Usage: node scripts/make-textures.mjs [dayJpg] [topologyPng]
import sharp from 'sharp';
const day = process.argv[2] || '/tmp/earth-blue-marble.jpg';
const topo = process.argv[3] || '/tmp/earth-topology.png';
await sharp(day).resize(4096, 2048).webp({ quality: 70, effort: 6 }).toFile('public/globe/earth-day-4096.webp');
await sharp(day).resize(2048, 1024).webp({ quality: 78, effort: 6 }).toFile('public/globe/earth-day-2048.webp');
await sharp(topo).greyscale().resize(2048, 1024).webp({ quality: 70, effort: 6 }).toFile('public/globe/earth-bump-2048.webp');
await sharp(topo).greyscale().resize(1024, 512).webp({ quality: 70, effort: 6 }).toFile('public/globe/earth-bump-1024.webp');
console.log('textures written');
