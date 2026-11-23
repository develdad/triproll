// Run with: npm test  (node --test, Node 22 strips TypeScript types natively)
import test from 'node:test';
import assert from 'node:assert/strict';
import { AXES, scoreQuiz, matchArchetype, rollTrip, packingHints, internalCostPP, minBudgetPP, packagePrice } from './dna.ts';
import { BUFFER, COST_CEILING, FLOOR_OVERALL, FLOOR_PER_NIGHT, MARGIN, SEASON_MAX } from './pricing.config.ts';
import { RESTRICTED_STATES, RESTRICTED_NAMES } from '../data/roll.ts';
import { faqs, terms, howItWorks, about } from '../data/copy.ts';
import { questions, archetypes } from '../data/quiz.ts';
import { destinations } from '../data/destinations.ts';

// Small seeded rng (mulberry32) so failures are reproducible.
function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const TODAY = '2027-01-10';

test('quiz scoring returns six axes in 0..1 for random answer sets', () => {
  const rng = seeded(1);
  for (let n = 0; n < 200; n++) {
    const chosen = questions.map((q) => q.answers[Math.floor(rng() * q.answers.length)]);
    const { dna, passport } = scoreQuiz(chosen);
    assert.deepEqual(Object.keys(dna).sort(), [...AXES].sort());
    for (const a of AXES) assert.ok(dna[a] >= 0 && dna[a] <= 1, `${a}=${dna[a]}`);
    assert.ok(passport === 'valid' || passport === 'none');
    assert.ok(archetypes.some((x) => x.key === matchArchetype(dna).key));
  }
});

test('passport none never yields an international destination across 500 rolls', () => {
  const rng = seeded(2);
  let ok = 0;
  for (let i = 0; i < 500; i++) {
    const r = rollTrip({ passport: 'none', party: 1 + Math.floor(rng() * 8), nights: 2 + Math.floor(rng() * 9), budgetPP: 6000, rng, today: TODAY, dna: i % 2 ? scoreQuiz(questions.map((q) => q.answers[Math.floor(rng() * 4)])).dna : null });
    assert.ok(r.ok);
    if (r.ok) { assert.equal(r.trip.dest.domestic, true); ok++; }
  }
  assert.equal(ok, 500);
});

test('pricing constants: margin 15 percent plus buffer 10 percent leaves a 75 percent cost ceiling', () => {
  assert.equal(MARGIN, 0.15);
  assert.equal(BUFFER, 0.1);
  assert.equal(COST_CEILING, 0.75);
  assert.equal(SEASON_MAX, 1.14);
});

test('internal cost never exceeds 75 percent of budget across 500 rolls; package price is budget rounded down to 10', () => {
  const rng = seeded(3);
  let fits = 0;
  for (let i = 0; i < 500; i++) {
    const budgetPP = 600 + Math.floor(rng() * 5400);
    const party = 1 + Math.floor(rng() * 8);
    const nights = 2 + Math.floor(rng() * 9);
    const r = rollTrip({ budgetPP, party, nights, rng, today: TODAY });
    if (r.ok) {
      fits++;
      const cost = internalCostPP(destinations.find((x) => x.id === r.trip.dest.id)!, party, nights, SEASON_MAX);
      assert.ok(cost <= budgetPP * 0.75 + 1e-9, `${r.trip.dest.id} cost ${cost} > 75% of ${budgetPP}`);
      assert.equal(r.trip.price.perPerson, Math.floor(budgetPP / 10) * 10);
      assert.equal(r.trip.price.perPerson, packagePrice(budgetPP));
      assert.equal(r.trip.price.total, r.trip.price.perPerson * party);
      assert.ok(r.trip.price.perPerson <= budgetPP);
    } else {
      assert.equal(r.reason, 'below-floor');
      assert.ok((r.minBudget ?? 0) > budgetPP);
    }
  }
  assert.ok(fits > 250);
});

test('no cost breakdown or margin fields are exposed on a Trip', () => {
  const r = rollTrip({ budgetPP: 3000, today: TODAY, rng: seeded(9) });
  assert.ok(r.ok);
  if (r.ok) {
    assert.deepEqual(Object.keys(r.trip.price).sort(), ['perPerson', 'total']);
    assert.deepEqual(Object.keys(r.trip).sort(), ['band', 'dest', 'end', 'nights', 'party', 'price', 'start']);
    assert.ok(!JSON.stringify(r.trip).match(/margin|service|flightBase|hotelNight|extras|breakdown/i));
  }
});

test('viability floor: at least 150 per person per night and 600 overall, and a roll below it is refused', () => {
  for (const nights of [2, 4, 5, 8, 10]) {
    for (const party of [1, 2, 3, 8]) {
      for (const passport of ['valid', 'none'] as const) {
        const f = minBudgetPP(nights, party, passport);
        assert.ok(f >= FLOOR_PER_NIGHT * nights && f >= FLOOR_OVERALL, `${nights}/${party}/${passport}: ${f}`);
        assert.equal(f % 10, 0);
        const below = rollTrip({ budgetPP: f - 10, nights, party, passport, today: TODAY });
        assert.equal(below.ok, false);
        if (!below.ok) { assert.equal(below.reason, 'below-floor'); assert.equal(below.minBudget, f); }
        const at = rollTrip({ budgetPP: f, nights, party, passport, today: TODAY, rng: seeded(nights * 10 + party) });
        assert.equal(at.ok, true, `floor ${f} should roll for ${nights} nights, party ${party}, ${passport}`);
      }
    }
  }
  assert.equal(minBudgetPP(2, 1, 'valid') >= 600, true);
  assert.ok(minBudgetPP(10, 2, 'valid') >= 1500);
});

test('Iowa joins the blocked residency list and every state mention in copy matches the config', () => {
  assert.deepEqual([...RESTRICTED_STATES].sort(), ['CA', 'FL', 'HI', 'IA', 'WA']);
  assert.match(RESTRICTED_NAMES, /Iowa/);
  const blob = JSON.stringify([faqs, terms, howItWorks, about]);
  assert.ok(blob.includes('Iowa'));
  assert.ok(!/California, Florida, Hawaii or Washington/.test(blob));
});

test('copy never says a card is held or charged today and carries no margin language', () => {
  const blob = JSON.stringify([faqs, terms, howItWorks, about]).toLowerCase();
  assert.ok(!/service margin|planning margin|15 percent/.test(blob));
  assert.ok(!/we hold|card is held|charged today/.test(blob));
  assert.ok(blob.includes('72 hours'));
});

test('rerolls never repeat an excluded destination', () => {
  const rng = seeded(4);
  for (let i = 0; i < 100; i++) {
    const exclude: string[] = [];
    for (let k = 0; k < 4; k++) {
      const r = rollTrip({ budgetPP: 6000, exclude, rng, today: TODAY });
      assert.ok(r.ok);
      if (r.ok) { assert.ok(!exclude.includes(r.trip.dest.id)); exclude.push(r.trip.dest.id); }
    }
  }
  const all = destinations.map((d) => d.id);
  const r = rollTrip({ budgetPP: 6000, exclude: all, today: TODAY });
  assert.equal(r.ok, false);
});

test('vetoes are respected and dates respect the lead time', () => {
  const rng = seeded(5);
  for (let i = 0; i < 300; i++) {
    const r = rollTrip({ budgetPP: 6000, vetoes: ['no-beaches', 'no-cold', 'no-long-haul', 'no-cities', 'no-remote'], rng, today: TODAY, flexibility: 'pm3', earliest: '2027-01-12' });
    if (!r.ok) continue;
    const d = r.trip.dest;
    assert.ok(!d.beach && !d.cold && d.hours <= 8 && !d.city && !d.remote);
    assert.ok(r.trip.start >= '2027-01-24');
  }
});

test('packing hints always return five unique items', () => {
  for (const d of destinations) {
    const h = packingHints(d);
    assert.equal(h.length, 5);
    assert.equal(new Set(h).size, 5);
  }
});
