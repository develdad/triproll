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
- `localStorage.triproll_dna` is the v4 profile: `{ v: 4, axes: { pace, novelty, setting, comfort, social, structure, culture, activity }, archetype, brief, dates }`. `brief` is the planner brief (climate, maxFlight, diet, dietAdventure, dietNotes, mobility, mobilityNotes, lodging, greats, greatsText, noGos, noGosText, visited, withWhom, notes; the occasion question was removed). `dates` is the optional "dates that matter" group (`self`, `anniversary`, `partner`, `children: [{ name, md }]`), each date stored as `MM-DD` with no year (`src/lib/dates.ts`). `parseProfile()` in `src/lib/storage.ts` validates it and migrates v3 profiles (occasion dropped, dates empty). Older shapes (six axes, v1 and v2) are discarded safely and the person retakes the assessment.
- The full profile is serialized to JSON (`serializeProfile()` in `src/lib/profile.ts`) into the hidden `dna_profile` field on the trip-request and waitlist forms, with `archetype` beside it.
- `triproll_params` is the last set of roll rules. The passport confirmation is never restored, so it is asked every time.

## Catalog fields added in v3
`hours`, `climate`, `cold`, `city`, `remote` on each destination (see header of `src/data/destinations.ts`). They drive vetoes, flight band, climate hint and packing hints. They are approximate and hand-assigned. `dna` holds eight hand-assigned axis scores (0 to 1).

## Fixed-package flow (model B)
- The site never picks, stores, transmits or reveals a destination before a request. `sealRules()` in `src/lib/request.ts` validates the rules and returns a sealed summary: dates, nights, travelers, package price per person and total, cabin, how many catalog entries stay in play, a general climate range, the rules honored and the DNA archetype. The header photo comes from vetoes and season only (`moodForRules`).
- The catalog still ships in the client JS so the count can be computed. It is never rendered or posted. A unit test checks that the sealed summary and request payload carry no catalog name.
- If fewer than `MIN_ELIGIBLE` (3) destinations fit, the person is asked to loosen a rule (same path as the below-floor case).
- `rollTrip()` in `src/lib/dna.ts` is kept for tests only. Nothing in the UI imports it.
- Card actions: Request this trip and Change my rules. The request form asks when to reveal: keep it sealed until the morning of departure (default), or reveal on a chosen date (picker limited to tomorrow through the day before departure). Payload fields: `delivery_preference`, `reveal_date`, `cabin`, `citizenship`, `passport_valid_six_months`, `destinations_in_play`, `archetype`, `dna_profile`, plus the per-trip intake below. Add any new field to `src/lib/forms.ts` so Netlify captures it.
- Per-trip intake (separate from the profile): the rules form has a "This trip" group, a single-select trip type (`TRIP_TYPES` in `src/data/roll.ts`) and an optional short reason. Both go on the sealed card as one line and in the payload as `trip_type` and `trip_reason`. If the saved profile has dates that matter and the trip window (with the flexibility option) includes one, the rules form and the sealed card show a note with a "Plan something for it" checkbox (checked by default). The payload carries `date_matches` (labels and `MM-DD`, from the sealed trip dates) and `date_plan` (`yes` or `no`). Matching lives in `src/lib/dates.ts`: windows can cross a year, and Feb 29 counts on Feb 28 or Mar 1 in common years.
- Rules in `src/lib/pricing.config.ts`: `CABIN_FLOOR_MULT` (economy 1, premium economy 1.6, business 3.0) multiplies the per-person budget floor and the eligible set uses the economy-equivalent budget. `MAX_ORDER_TOTAL_USD = 10000`: per-person budget times travelers above that is not sealed; the person is told to reduce travelers or budget, or join the waitlist for larger trips (`roll:over-cap` source).

## Entry rules (beta)
- US passport holders only. The citizenship field routes "Other" to the waitlist with a friendly note. A required checkbox confirms the passport is valid for six months after the return date.
- Each destination has `entry` (`domestic`, `none`, `on_arrival`, `prereg`), `entryVerified`, `advisoryLevel` and `vaccineRequired`. They come from a desk audit of official sources dated 2026-11-23 (source notes in `entry-audit.json`, kept outside the repo). The audit is a snapshot: a planner must re-verify entry rules, health requirements and the advisory before every booking. `entryVerified` is set to `2026-11-23` for every entry.
- Exclusions during beta: `prereg` destinations (`BETA_ALLOW_PREREG = false`), any destination above `MAX_ADVISORY_LEVEL = 2`, and any that require a vaccination. With the current audit that removes the UK, South Korea, Australia and New Zealand (prereg) and Colombia and the UAE (advisory level 3). Mexico is `on_arrival` (FMM issued at the airport) and is Level 2 overall, though some Mexican states are Level 3 or 4, so the planner checks the region.
- Public copy states the rule in general terms and names no country.

## Travel DNA
- Part 1: 24 scenario questions in 8 named sections, one per screen, scoring 8 axes (pace, novelty, setting, comfort, social, structure, culture and food depth, activity). Every axis is scored by at least 5 answers and both poles are reachable (tested). Choosing an answer records it and moves on after a 250 ms flash (instant under reduced motion); there is no Next button, Back stays. Keys: 1 to 4 choose, arrow up and down move focus, Enter or Space picks the focused option, Backspace or left arrow goes back (never while a text field has focus). Key hints show only on fine pointers. Focus moves to the new question heading and the counter is an aria-live region. Part 2: a skippable planner brief with explicit Continue and Skip buttons, including the optional dates that matter (month and day selects, children rows).
- Results show the archetype, an inline SVG radar, two strongest and two weakest axes, 5 or 6 "What this means for your trip" statements, a planner brief card, and a statement that a person reads the profile.
- Matching logic and catalog scores are in `src/lib/dna.ts` and `src/data/quiz.ts`. Tests cover scoring, pole reachability, storage migration and serialization.

## Payment wording
`paymentsLive` in `src/lib/pricing.config.ts` is `false`. All payment wording comes from `src/data/payment.ts`, which has two variants. The "on" variant (card hold) exists for later; do not enable it until a card-hold flow exists. A test fails if hold wording appears anywhere while the flag is false.

## Open items
- Owner review of `/privacy` and `/terms` (marked DRAFT). A privacy contact email is not published because none was supplied.
- No phone, address or email in `site.config.ts`; JSON-LD type is `TravelAgency` with only name, url and logo.
- Costs assume a major US hub regardless of the departure airport entered.
- Entry rules in the catalog are a dated desk audit, not legal advice. A planner re-verifies them before every booking.
- Seller-of-travel registration and the CA/FL/HI/IA/WA restriction are taken from the brief; confirm legal position.
- Confirm the Netlify forms in the dashboard after the first deploy.

## Pricing model (beta, owner decisions)
All constants live in `src/lib/pricing.config.ts`. Tests read them from there.
- `MARGIN = 0.15` and `BUFFER = 0.10`, so `COST_CEILING = 0.75`.
- The customer states a per-person budget. The trip is sold as one package price: the stated budget rounded down to the nearest 10 dollars, shown per person and in total, labeled an estimate until a person confirms.
- Eligibility: a destination can be rolled only if its internal cost per person (flights plus stay plus a 12 percent transfers and experiences allowance, with the seasonal multiplier at its maximum, 1.14) is at or below 75 percent of the budget. The internal cost is computed in `internalCostPP()` and is never attached to a `Trip`. `Trip.price` is exactly `{ perPerson, total }` and `Trip.dest` has no `flightBase` or `hotelNight`.
- Viability floor (`minBudgetPP()`): the cost of the cheapest eligible destination for the entered nights, party and passport divided by 0.75 and rounded up to 10, or 150 per person per night, or 600 per person, whichever is highest. Below the floor the island does not roll; it shows one message ("This trip length needs at least X per person...") and the slider minimum follows the floor. There is no "almost there" messaging.
- Copy (home, how it works, FAQ, roll, terms, footer): beta orders are reviewed by a person within 72 hours before any card is charged; if the trip cannot be built inside the rules the customer owes nothing and can roll again free; confirmed customers get the confirmation and packing list, and the full itinerary arrives the morning of departure, or on the reveal date the customer picked. There is no payment step; payment is collected only at confirmation. The 4-step timeline lives in `TIMELINE` in `src/data/roll.ts`.

## Photography
Originals are in `src/assets/photos/`, rendered by `src/components/Photo.astro` (AVIF and WebP, responsive widths, lazy below the fold). Alt text and the climate-to-mood rule for the itinerary card header are in `src/data/photos.ts`. The header photo is chosen from climate flags only (`moodFor`), never from a destination id. `src/assets/photos/CREDITS.md` lists every file with its Unsplash URL. Photographer names and licenses are NOT confirmed: the owner must confirm licensing before launch. No photo of a passport flat-lay or a street-food scene shipped (no clean candidate passed review).

## Globe
- `src/lib/globe3d.ts` is a small three.js scene: deep teal ocean, flat lighter land from a generated mask texture, a faint graticule, soft diffuse shading, a subtle same-hue rim, one orbit swoosh and an amber pin that travels it. It is only reached by dynamic import from `src/components/islands/Globe.tsx`.
- The land mask is generated by `npm run textures` from `world-atlas` (land-50m) and `topojson-client` (dev dependencies). There are no photo textures. The poster (`src/assets/globe-poster.webp`) is rendered from the same scene with `npm run poster` (system Chrome via puppeteer-core).
- Home hero: same placement as before, poster first. Phones get the poster only; desktop loads the canvas on idle. Never under reduced motion or without WebGL.
- The poster has no swoosh or pin. `OrbitOverlay.tsx` draws them as inline SVG (back half under the poster, front half over it) from `src/data/orbit.json`, which `npm run poster` writes from the same scene. Below 1024 px and without reduced motion the pin, a short trail and a slow poster drift are animated with CSS only (keyframes come from `src/lib/orbit.ts`); at 1024 px and up the live globe replaces the poster, and under reduced motion the overlay is static. If you change the globe camera or orbit, rerun `npm run poster` so the poster and overlay stay aligned.
- Roll page: the globe is a short transition (full-width stage, spin-up and pin whip, about 2.1 s, instant under reduced motion). Afterwards it stays as a small calm draggable globe beside or above the card. No zoom buttons, no rings, and the pin never lands on a location.
- Behavior: slow idle rotation, drag to rotate, rendering pauses offscreen or when the tab is hidden, devicePixelRatio capped at 2, resources disposed on unmount.
- Brand assets: `npm run logo` derives the web logos from the official artwork (`scripts/make-logo.mjs`). The footer uses a recolored copy of the official light logo (alpha kept) as WebP and PNG at 1x and 2x. The header uses the official primary artwork. Nothing is redrawn. `npm run brand` regenerates the favicon set and `npm run og` the og image. Teal is #00a99d and amber #fbb03b; text and link colors use a darker teal (#007a72) to keep AA contrast.

## Header and mobile menu
The header is one 64 px row at every width (65 px with the border). Below 48rem the links collapse into a `details` and `summary` menu (no script, 44 px button, panel overlays the page under the header). Any change to the shared header must stay HTML and CSS only: `/` and `/how-it-works` request no JavaScript file on phones. The footer logo matches the header logo width (168 px).

## Local gate results (Lighthouse 9.6.8, headless Chrome, round 5)
- CPU slowdown 8x, three runs each: `/` performance 0.97, 0.97, 0.97 (LCP 2.5 to 2.6 s, blocking time 0, CLS 0 to 0.001); `/how-it-works` 0.99, 0.99, 0.99 (blocking time 0 to 30 ms). At default settings: `/` performance 0.98, accessibility 1.00, best practices 1, SEO 1; `/how-it-works` 0.99, 1.00, 1, 1. Not gated: `/roll` and `/travel-dna` score accessibility 1.00, SEO 1, best practices 1 and performance 0.90 (hydrated islands). Quiz, brief, result, rules form, sealed card and request form states were also checked with axe-core (WCAG 2.2 AA and best practices) at 1440 and 390: zero violations.
- The earlier `/` accessibility score of 0.95 was two things: false contrast failures on the guardrails section (Lighthouse cannot read `content-visibility: auto` content) and heading order (card title and step cards skipped a level).
- `/roll` is not gated. Headless Chrome rasterizes WebGL in software, which blocks the main thread; real GPUs are not affected. Check on a real phone before launch.
- Scores vary by a few points between runs; the Netlify plugin thresholds in `netlify.toml` are unchanged.

## Performance notes (Lighthouse 9 mobile, the version the Netlify plugin runs)
- Marketing pages ship no script except JSON-LD. Scroll reveal is CSS only (`animation-timeline: view()`), so nothing starts hidden above the fold. The how-it-works page has no client JS.
- The LCP image on `/` (globe poster, AVIF) and `/how-it-works` (first step photo, AVIF) is preloaded in `<head>` with the same srcset the `<picture>` uses. Keep the quality constants in the page frontmatter in sync with the markup (they feed both).
- Fonts are self-hosted subsets in `src/assets/fonts` (rebuild with `python3 scripts/subset-fonts.py`). Keep font stacks short: every missing family in a long stack costs a font lookup on Linux, which showed up as first-layout time. `--font-mono` is `Menlo, monospace` for that reason.
- Below-the-fold sections use `.defer` (`content-visibility: auto`) to skip their style and layout until near the viewport. Do not put `.defer` on a section with light text on a gradient or photo background: Lighthouse's contrast audit cannot see skipped content and reports false contrast failures (the home guardrails section lost `.defer` for this reason). Full-page screenshots of these pages show the skipped sections blank; scroll screenshots are correct.
- Local results with `--throttling.cpuSlowdownMultiplier=8`: both pages 0.97 to 1.00. At 12x, total blocking time from first style and layout can still dip a page to about 0.85 to 0.9 on a bad run.
