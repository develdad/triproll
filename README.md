# TripRoll v3

Static front end for TripRoll, a surprise-trip service: set rules, take the Travel DNA quiz, roll, get a sealed priced trip.

- Stack: Astro 7 static, Tailwind v4, React islands (quiz, roll, globe), three.js globe.
- Develop: `npm ci` then `npm run dev`. Gate: `npm run verify` (logic tests, astro check, build, SEO check).
- Tests: `npm test` (node --test on src/lib/dna.test.ts).
- Copy lives in `src/data/copy.ts`; catalog in `src/data/destinations.ts`; quiz in `src/data/quiz.ts`; roll logic in `src/lib/dna.ts`.
- See DEPLOY.md for deploy, forms and open items.
