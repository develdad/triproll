# TripRoll -- Project Instructions

> This file is the persistent memory for the TripRoll project.
> Every session MUST read this file first and update it before ending.

## Session Protocol

1. **On session start**: Read this entire file. Do not ask the user to recap prior work.
2. **During work**: Update the Change Log and Task Backlog as tasks are completed.
3. **On session end**: Update this file with a summary of what was done, what changed, and any new issues discovered. Commit the updated CLAUDE.md alongside code changes.
4. **Never duplicate work**: Check the Change Log before starting any task. If it has been done, skip it.
5. **Token efficiency**: Do not re-read files whose contents have not changed since the last recorded session. Use the Architecture section below to orient yourself.

## Project Overview

TripRoll is a travel platform where users spin a 3D globe and receive a complete, personalized travel package (flights, hotel, activities) within their budget. Currently in pre-launch with a waitlist landing page.

## Tech Stack

- **Framework**: Next.js 16.2 (App Router), React 19, TypeScript, Tailwind CSS v4
- **3D**: React Three Fiber + Three.js (Blue Marble globe, particle stars, destination pins)
- **Auth/DB**: Supabase (email/password auth, PostgreSQL)
- **Hosting**: Vercel (auto-deploy from GitHub main branch)
- **Repo**: github.com/develdad/triproll (single triproll-app directory)

## Architecture

```
triproll-app/
  src/
    app/
      page.tsx              # Landing page (hero, globe, how-it-works, features, waitlist CTA)
      layout.tsx            # Root layout
      globals.css           # Global styles + Tailwind
      login/page.tsx        # Login page
      signup/page.tsx       # Signup page
      dashboard/page.tsx    # User dashboard (post-auth)
      travel-dna/page.tsx   # Travel DNA personality quiz
      travel-dna/results/page.tsx  # DNA results with radar chart
      trip/
        new/page.tsx        # New trip request flow
        [id]/page.tsx       # Trip detail view
      auth/callback/        # Supabase auth callback
    components/
      Globe.tsx             # 3D globe, pins, trip card, genie animation (COMPLEX -- ~500 lines)
      Navbar.tsx            # Fixed nav with TripRoll logo (height ~64px / 72px with padding)
      Footer.tsx            # Site footer
      WaitlistForm.tsx      # Email capture -> Supabase
      TravelDNA.tsx         # 6-question personality quiz
      RadarChart.tsx        # SVG radar chart for DNA axis visualization
      TripCard.tsx          # Trip details card
      TripQuestionnaire.tsx # Trip request form
      AuthForm.tsx          # Login/signup form
    lib/
      types.ts              # All TypeScript types
      constants.ts          # Colors, DNA questions, archetypes, destinations, budgets
      supabase/
        client.ts           # Browser Supabase client
        server.ts           # Server Supabase client
        middleware.ts        # Auth middleware
  public/
    logo-mini.png           # TripRoll brand logo
```

## Key Technical Decisions

- **Globe.tsx is the most complex file.** It contains: useIsMobile hook, Particles, DestinationPin, CardPositionTracker, CameraCapture, CanvasInteraction, Earth, CardBody, DesktopTripCard, MobileTripCard, and the main Globe component. Any globe/card/animation work happens here.
- **Mobile touch passthrough**: Canvas uses `touchAction: "pan-y"` with pointer direction detection in CanvasInteraction. Horizontal drag = globe rotation; vertical drag = page scroll.
- **Genie animation**: Uses direction-based scroll anchors (not absolute scroll position). When scroll direction changes, a new anchor is set. Card collapses over 250px of downward scroll and re-emerges over 250px of upward scroll, from any page position. Desktop origin: bottom-left corner at pin. Mobile origin: center of card.
- **Lerp animation**: Both cards use requestAnimationFrame with lerp rate 0.1 and easeOutCubic easing for smooth genie transitions.
- **FUSE mount workaround**: The workspace is mounted via FUSE, causing git lock files. Commits must be done from a sandbox copy: `cp -r` to /sessions/.../build/, remove .git locks, commit, push. Then the mounted repo needs `git pull --rebase` to sync.

## Known Issues

| Issue | Workaround |
|-------|-----------|
| FUSE git lock files (.git/index.lock, HEAD.lock) | Commit from sandbox copy, not mounted dir |
| .next build cache EPERM on FUSE | Build from sandbox copy with clean .next |
| Local git log behind remote | Always check remote; push happens from sandbox |
| Netlify MCP connector timeout | Not currently used for hosting; Vercel is primary |

## Task Backlog

### Completed
- [x] Initial scaffold (Next.js 16, Supabase auth, routing)
- [x] 3D Globe with Blue Marble texture and particle star field
- [x] Destination pin system (12 sample destinations, lat/lng projection)
- [x] Desktop trip card with bottom-left genie animation from pin
- [x] Mobile trip card as full-screen modal with center genie
- [x] Touch scroll passthrough on mobile
- [x] Direction-based scroll-genie (card responds to scroll direction, not absolute position)
- [x] Globe vertical centering on mobile
- [x] Travel DNA quiz (6 axes, 5 archetypes)
- [x] Waitlist form (Supabase)
- [x] Brand identity (logo, color palette)
- [x] TypeScript type system
- [x] Project summary PDF and persistent memory system

### Pending
- [ ] Verify scroll-genie fix on live Vercel deployment (mobile + desktop)
- [ ] Trip generation backend (API routes, destination matching to DNA + budget)
- [ ] Dashboard functionality (upcoming trips, past trips, DNA profile)
- [ ] Trip detail page (itinerary view with flights, hotel, activities)
- [ ] Payment / booking flow
- [ ] Surprise mode (hidden destination until departure)
- [ ] Email notifications (waitlist confirmation, trip alerts)
- [ ] SEO and meta tags (Open Graph, Twitter cards)
- [ ] Performance optimization (globe loading, images, bundle splitting)
- [ ] Travel DNA visual card design (image-based A/B choices per question)
- [ ] Allow retaking Travel DNA (mark previous as inactive) -- backend done, UI at /travel-dna
- [ ] Profile editing page (name, avatar, departure city)
- [ ] Google/Apple OAuth integration

## Change Log

### 2026-04-10 -- Session 2
- Connected Travel DNA quiz to Supabase: server action (`saveTravelDNA`) was already in `src/app/actions.ts`; added loading state, error handling, and removed fragile sessionStorage fallback from `TravelDNA.tsx`
- Verified Supabase production schema: all 5 tables and grants already deployed
- Built Travel DNA results page at `/travel-dna/results` with SVG radar chart (`RadarChart.tsx`), archetype card, and personality breakdown
- Quiz now redirects to results page after saving instead of `/trip/new`
- Added "View Results" link in dashboard sidebar
- Files changed: `src/components/TravelDNA.tsx`, `src/components/RadarChart.tsx` (new), `src/app/travel-dna/results/page.tsx` (new), `src/app/dashboard/layout.tsx`

### 2026-04-10 -- Session 1 (continued)
- Fixed scroll-driven genie animation: replaced absolute scroll position mapping with direction-based anchor system. Card now incrementally collapses on scroll-down and re-emerges on scroll-up from any page position. Both desktop and mobile use the same logic. Lerp rate increased from 0.06 to 0.1 for more responsive tracking. scrollRange set to 250px.
- Created project summary PDF (TripRoll_Project_Summary.pdf in project root)
- Established persistent memory system (this file)
- Files changed: `src/components/Globe.tsx`

### Prior sessions (pre-memory system)
- Built entire landing page: hero section with 3D globe, how-it-works, features grid, waitlist CTA
- Implemented 3D globe with React Three Fiber, Blue Marble texture, quaternion spin
- Built destination pin system with 3D-to-screen projection for card positioning
- Created desktop and mobile trip card variants with genie animation
- Implemented mobile touch handling (scroll passthrough, drag direction detection)
- Added Travel DNA quiz, waitlist form, auth pages
- Replaced placeholder logos with TripRoll brand logo
- Multiple rounds of mobile rendering fixes (globe size, card visibility, centering)

## User Preferences

- Output format: PDF for reports and documents
- No em-dashes in generated content
- Desktop and mobile should share UX/functionality, adapted for screen size
- Genie animation should feel slow and smooth, like emerging from a bottle
