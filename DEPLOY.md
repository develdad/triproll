# TripRoll v3 deploy notes

Not deployed. This branch is source only.

## Stack
Astro 7 static output, Tailwind v4, self-hosted Inter Variable and Instrument Serif (latin subsets via @fontsource), React islands for the quiz, the roll, the itinerary card and the globe (three.js, lazy loaded). Marketing pages ship only a few hundred bytes of JS until the globe island loads. URLs have no trailing slash (the starter's SEO gate enforces canonicals without one); `netlify.toml` 301s `/roll/` style URLs to the canonical form.

## Gates
1. `npm run verify`: logic tests, `astro check`, build, then the postbuild SEO check (one title, description, canonical, h1, JSON-LD parses, links, sitemap, robots, 404, no `REPLACE:`).
2. Lighthouse runs in the Netlify build via `@netlify/plugin-lighthouse` on `/` and `/how-it-works` (thresholds unchanged: 0.95, seo 1). Local mobile runs are recorded below.
3. After deploy: `node scripts/seo-check.mjs --live https://triproll.co`.
4. Turn off the "Powered by Netlify" badge (Project configuration, General).

## Forms (Netlify Forms only)
Two forms: `trip-request` and `waitlist`. Field lists live in `src/lib/forms.ts`; `FormDefs.astro` renders hidden static copies on `/roll` and `/travel-dna` so Netlify detects them. Islands submit through `submitLead()` in `src/lib/leads.ts` (urlencoded POST to `/`). No-JS fallback is a plain waitlist form inside `<noscript>`. Form detection ships OFF for new Netlify sites: enable it and redeploy, then submit a test entry and delete it. Residents of CA, FL, HI, IA, WA are routed to `waitlist` in the island. The list lives only in `RESTRICTED_STATES` in `src/data/roll.ts`; copy reads `RESTRICTED_NAMES` from the same file.

## Swapping lead capture to Supabase later
Replace the body of `submitLead` in `src/lib/leads.ts` with an insert (a Netlify Function holding the service key, or an RLS-limited anon insert). Keep the signature `(formName, fields) => Promise<{ok}>`. Keep the static form defs until Netlify Forms is retired. No Supabase calls exist today.

## State
`localStorage.triproll_dna` = `{ dna, passport, archetype }`; `triproll_params` = last roll rules.

## Catalog fields added in v3
`hours`, `climate`, `cold`, `city`, `remote` on each destination (see header of `src/data/destinations.ts`). They drive vetoes, flight band, climate hint and packing hints. They are approximate and hand-assigned.

## Open items
- Owner review of `/privacy` and `/terms` (marked DRAFT). A privacy contact email is not published because none was supplied.
- No phone, address or email in `site.config.ts`; JSON-LD type is `TravelAgency` with only name, url and logo.
- Costs assume a major US hub regardless of the departure airport entered.
- Entry and visa rules are not shown; copy says a person checks them at quote time.
- Seller-of-travel registration and the CA/FL/HI/IA/WA restriction are taken from the brief; confirm legal position.
- Confirm the Netlify forms in the dashboard after the first deploy.

## Pricing model (beta, owner decisions)
All constants live in `src/lib/pricing.config.ts`. Tests read them from there.
- `MARGIN = 0.15` and `BUFFER = 0.10`, so `COST_CEILING = 0.75`.
- The customer states a per-person budget. The trip is sold as one package price: the stated budget rounded down to the nearest 10 dollars, shown per person and in total, labeled an estimate until a person confirms.
- Eligibility: a destination can be rolled only if its internal cost per person (flights plus stay plus a 12 percent transfers and experiences allowance, with the seasonal multiplier at its maximum, 1.14) is at or below 75 percent of the budget. The internal cost is computed in `internalCostPP()` and is never attached to a `Trip`. `Trip.price` is exactly `{ perPerson, total }` and `Trip.dest` has no `flightBase` or `hotelNight`.
- Viability floor (`minBudgetPP()`): the cost of the cheapest eligible destination for the entered nights, party and passport divided by 0.75 and rounded up to 10, or 150 per person per night, or 600 per person, whichever is highest. Below the floor the island does not roll; it shows one message ("This trip length needs at least X per person...") and the slider minimum follows the floor. There is no "almost there" messaging.
- Copy (home, how it works, FAQ, roll, terms, footer): beta orders are reviewed by a person within 72 hours before any card is charged; if the trip cannot be built inside the rules the customer owes nothing and can roll again free; confirmed customers get the confirmation and packing list, and tickets and the full itinerary arrive the morning of departure (or sooner if they chose to reveal). There is no payment step; payment is collected only at confirmation. The 4-step timeline lives in `TIMELINE` in `src/data/roll.ts`.

## Photography
Originals are in `src/assets/photos/`, rendered by `src/components/Photo.astro` (AVIF and WebP, responsive widths, lazy below the fold). Alt text and the climate-to-mood rule for the itinerary card header are in `src/data/photos.ts`. The header photo is chosen from climate flags only (`moodFor`), never from a destination id. `src/assets/photos/CREDITS.md` lists every file with its Unsplash URL. Photographer names and licenses are NOT confirmed: the owner must confirm licensing before launch. No photo of a passport flat-lay or a street-food scene shipped (no clean candidate passed review).

## Globe
- `src/lib/earth.ts` is a three.js scene (NASA Blue Marble day map, topology bump map, ocean specular mask, fresnel atmosphere, pin and label). It is only reached by dynamic import from `src/components/islands/Globe.tsx`.
- Textures: `public/globe/earth-day-4096.webp` (desktop, 438 KB), `earth-day-2048.webp` (under 900 px wide, 172 KB), `earth-bump-2048.webp` and `earth-bump-1024.webp`. Rebuild with `npm run textures` (inputs in /tmp, see the script header).
- Poster: `src/assets/globe-poster.webp` is a transparent frame of the same scene, rendered with `npm run poster` (system Chrome via puppeteer-core). The hero and the roll sidebar paint the poster first; the WebGL canvas fades in on top. Hero loads WebGL on idle at 900 px and wider, on first interaction on small screens, and never under reduced motion or without WebGL. The roll globe loads when visible and renders single frames under reduced motion.
- Behavior: slow idle spin; fast spin and pull back while rolling; sealed rolls never point at the destination; reveal flies in to the destination with a pin and label; a new roll zooms back out. Drag to rotate, pinch or +/- buttons to zoom, Ctrl or Cmd with the wheel zooms (plain wheel scrolls the page). Rendering pauses when the canvas is offscreen or the tab is hidden; devicePixelRatio is capped at 2; geometries, materials, textures and the renderer are disposed on unmount.
- Regenerate the favicon set with `npm run brand` and the og image with `npm run og` (needs the poster).

## Local gate results (mobile Lighthouse on `astro preview`, headless Chrome, simulated throttling)
- `/`: performance 0.95 to 0.99 across runs, accessibility 0.98, best practices 1, SEO 1. The hero poster is the LCP element (about 2.2 to 2.4 s), so keep the poster small and the globe island on `client:idle`.
- `/how-it-works`: 0.96 / 0.98 / 1 / 1.
- `/roll` (not gated): performance 0.55 because headless Chrome rasterizes WebGL in software (SwiftShader), which blocks the main thread. The globe drops to 1x and 2048 textures on software renderers. Real GPUs are not affected. Check on a real phone before launch.
- First-load transfer (Chrome, 4 s idle): `/` 805 KB desktop (includes the 4096 day texture) and 283 KB mobile; `/roll` 544 KB desktop and 521 KB mobile.
- Scores vary by a few points between runs; the Netlify plugin thresholds in `netlify.toml` are unchanged.

## Performance notes (Lighthouse 9 mobile, the version the Netlify plugin runs)
- Marketing pages ship no script except JSON-LD. Scroll reveal is CSS only (`animation-timeline: view()`), so nothing starts hidden above the fold. The how-it-works page has no client JS.
- The LCP image on `/` (globe poster, AVIF) and `/how-it-works` (first step photo, AVIF) is preloaded in `<head>` with the same srcset the `<picture>` uses. Keep the quality constants in the page frontmatter in sync with the markup (they feed both).
- Fonts are self-hosted subsets in `src/assets/fonts` (rebuild with `python3 scripts/subset-fonts.py`). Keep font stacks short: every missing family in a long stack costs a font lookup on Linux, which showed up as first-layout time. `--font-mono` is `Menlo, monospace` for that reason.
- Below-the-fold sections use `.defer` (`content-visibility: auto`) to skip their style and layout until near the viewport. Full-page screenshots of these pages show the skipped sections blank; scroll screenshots are correct.
- Local results with `--throttling.cpuSlowdownMultiplier=8`: both pages 0.97 to 1.00. At 12x, total blocking time from first style and layout can still dip a page to about 0.85 to 0.9 on a bad run.
