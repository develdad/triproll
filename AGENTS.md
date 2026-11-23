# Rules for working on this repo

1. Business facts (name, phone, address, hours, links, mode) live ONLY in `src/site.config.ts`. Never type them anywhere else.
2. Never invent schema facts. JSON-LD is built from the config in `src/lib/schema.ts`. No ratings, reviews, coordinates or founding dates unless the owner supplies a source.
3. Add a page by creating an `.astro` file in `src/pages/` that wraps content in `<Base title description>`. Page copy lives in `src/data/copy.ts`. Nothing else lists routes. Islands (quiz, roll, globe) live in `src/components/islands/`.
4. Run `npm run verify` before every commit. It runs type checks, the build and the SEO gate. A red result means the work is not done.
5. `mode: 'demo'` means noindex everywhere and robots Disallow. `mode: 'live'` means indexable and any `REPLACE:` marker in the output fails the build. Cutover steps are in the ship-it skill, `references/launch.md`.
6. If you add a non-indexable page, add its path to `noindexPaths` in `src/site.config.ts` and pass `noindex` to `<Base>`.
7. Every image needs `alt` text. Use `<Image>` from `astro:assets` for images in `src/assets`.
8. No em-dashes anywhere. No entity or legal-name line in the footer.
9. Local installs: set `PUPPETEER_SKIP_DOWNLOAD=1` when running `npm ci` (only Netlify needs the Lighthouse browser).
10. Client-exposed env vars need the `PUBLIC_` prefix. Secrets stay server-side in `netlify/functions`.
