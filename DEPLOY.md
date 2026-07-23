# TripRoll Deploy Runbook

## Current state (v2 rebuild, July 2026)

- Staging: https://triproll.netlify.app (Netlify site `triproll`, id `a5e9cd43-d25d-479a-8f2f-4307b90254c6`, manual deploy via Netlify MCP)
- Old production: https://triproll.vercel.app (Vercel, old codebase, repo `develdad/triproll`, local folder `Triproll/triproll-app`)
- Domain: triproll.co currently 302-forwards at the registrar to triproll.vercel.app. Needs proper attachment at cutover.
- Backend: Supabase project `Triproll` (`ygzrdnntrqociawmbygv`), region us-west-2. Tables: profiles, travel_dna, trip_requests, trips, waitlist, flight_price_cache. Client uses publishable key in `src/lib/supabase.js`.

## Stack

Vite + React + react-router-dom + Tailwind v4 (`@tailwindcss/vite`), lucide-react, globe.gl (lazy-loaded on /roll only), @supabase/supabase-js. Earth textures bundled in `public/` (do not swap back to unpkg URLs).

## Ship loop (manual deploy until repo is wired)

```
npm run build                 # must exit 0
# request deploy command via Netlify MCP deploy-site (siteId above), then run it
# IMPORTANT: normalize the proxy URL to a single slash: .app/proxy/ not .app//proxy/
# the double-slash version 404s. This burned two deploy cycles on 2026-07-22.
```

Verify: fetch https://triproll.netlify.app/ and confirm the new copy, check /roll and /quiz load, hard refresh on mobile.

## Smoke test

`node smoke.mjs` against `npx vite preview --port 4173`. Completes the quiz, checks an archetype renders, rolls the globe, checks a trip card appears. Screenshots land in /tmp.

## Data writes from the frontend

- Quiz results: localStorage `triproll_dna` + optional email capture to `waitlist` (source `quiz:<archetype>`)
- Book button: email capture to `waitlist` (source `trip-hold:<dest>:<price>`)
- travel_dna table writes require auth; wired at account launch.

## Cutover checklist (when going production)

1. Salvage review of old repo `develdad/triproll` (needs GitHub PAT; old repo has plaintext PAT in .git/config, rotate it).
2. Push this codebase to a repo under develdad, wire Netlify CI, staging + main branches per ship-it.
3. Attach triproll.co properly (DNS to Netlify or keep Vercel, decide then), fix the 302.
4. Supabase: enable auth flows, add redirect URLs, fix advisor warnings (anon SELECT grants on tables, handle_new_user EXECUTE, leaked password protection).
5. Wire real pricing: Duffel for bookable flights, keep flight_price_cache as the cache layer.
