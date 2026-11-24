import { site } from '../site.config';

// Web app manifest, built from site.config.ts so the name is never typed twice.
export function GET() {
  const body = {
    name: site.business.name,
    short_name: site.business.name,
    description: site.business.description,
    start_url: '/',
    display: 'standalone',
    background_color: '#faf9f6',
    theme_color: '#00a99d',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' },
    ],
  };
  return new Response(JSON.stringify(body, null, 2), { headers: { 'Content-Type': 'application/manifest+json' } });
}
