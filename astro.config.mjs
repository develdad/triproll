import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import { site, noindexPaths } from './src/site.config.ts';

const excluded = new Set(noindexPaths);

export default defineConfig({
  site: site.domain,
  output: 'static',
  trailingSlash: 'never',
  build: { format: 'file' },
  integrations: [
    react(),
    sitemap({
      filter: (page) => {
        const path = new URL(page).pathname.replace(/\.html$/, '').replace(/\/$/, '') || '/';
        return !excluded.has(path);
      },
    }),
  ],
  vite: { plugins: [tailwindcss()] },
});
