import type { APIRoute } from 'astro';
import { site, isDemo } from '../site.config';

export const GET: APIRoute = () => {
  const body = isDemo
    ? 'User-agent: *\nDisallow: /\n'
    : `User-agent: *\nAllow: /\n\nSitemap: ${site.domain}/sitemap-index.xml\n`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
