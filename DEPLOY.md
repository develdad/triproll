# TripRoll v3 deploy notes

Not deployed. This branch is source only.

## Stack
Astro 7 static output, Tailwind v4, self-hosted Inter Variable and Instrument Serif (latin subsets via @fontsource), React islands only for the quiz, the roll and the cobe globe. Marketing pages ship zero JS. URLs have no trailing slash (the starter's SEO gate enforces canonicals without one); `netlify.toml` 301s `/roll/` style URLs to the canonical form.

## Gates
1. `npm run verify`: logic tests, `astro check`, build, then the postbuild SEO check (one title, description, canonical, h1, JSON-LD parses, links, sitemap, robots, 404, no `REPLACE:`).
2. Lighthouse runs in the Netlify build via `@netlify/plugin-lighthouse` on `/` and `/how-it-works` (thresholds unchanged: 0.95, seo 1). It has not been run locally.
3. After deploy: `node scripts/seo-check.mjs --live https://triproll.co`.
4. Turn off the "Powered by Netlify" badge (Project configuration, General).

## Forms (Netlify Forms only)
Two forms: `trip-request` and `waitlist`. Field lists live in `src/lib/forms.ts`; `FormDefs.astro` renders hidden static copies on `/roll` and `/travel-dna` so Netlify detects them. Islands submit through `submitLead()` in `src/lib/leads.ts` (urlencoded POST to `/`). No-JS fallback is a plain waitlist form inside `<noscript>`. Form detection ships OFF for new Netlify sites: enable it and redeploy, then submit a test entry and delete it. Residents of CA, FL, HI, WA are routed to `waitlist` in the island.

## Swapping lead capture to Supabase later
Replace the body of `submitLead` in `src/lib/leads.ts` with an insert (a Netlify Function holding the service key, or an RLS-limited anon insert). Keep the signature `(formName, fields) => Promise<{ok}>`. Keep the static form defs until Netlify Forms is retired. No Supabase calls exist today.

## State
`localStorage.triproll_dna` = `{ dna, passport, archetype }`; `triproll_params` = last roll rules.

## Catalog fields added in v3
`hours`, `climate`, `cold`, `city`, `remote` on each destination (see header of `src/data/destinations.ts`). They drive vetoes, flight band, climate hint and packing hints. They are approximate and hand-assigned.

## Open items
- Owner review of `/privacy` and `/terms` (marked DRAFT). A privacy contact email is not published because none was supplied.
- No phone, address or email in `site.config.ts`; JSON-LD type is `TravelAgency` with only name, url and logo.
- Estimates assume a major US hub regardless of the departure airport entered.
- Entry and visa rules are not shown; copy says a person checks them at quote time.
- Seller-of-travel registration and the CA/FL/HI/WA restriction are taken from the brief; confirm legal position.
- Run Lighthouse on a real build and confirm the Netlify forms in the dashboard.
