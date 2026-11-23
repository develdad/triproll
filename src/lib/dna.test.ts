// Run with: npm test  (node --test, Node 22 strips TypeScript types natively)
import test from 'node:test';
import assert from 'node:assert/strict';
import { AXES, scoreQuiz, matchArchetype, rollTrip, packingHints } from './dna.ts';
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

test('budget cap is never exceeded across 500 rolls', () => {
  const rng = seeded(3);
  let fits = 0;
  for (let i = 0; i < 500; i++) {
    const budgetPP = 400 + Math.floor(rng() * 5600);
    const r = rollTrip({ budgetPP, party: 1 + Math.floor(rng() * 8), nights: 2 + Math.floor(rng() * 9), rng, today: TODAY });
    if (r.ok) { fits++; assert.ok(r.trip.price.perPerson <= budgetPP, `${r.trip.price.perPerson} > ${budgetPP}`); }
    else { assert.equal(r.reason, 'over-budget'); assert.ok((r.minBudget ?? 0) > budgetPP); }
  }
  assert.ok(fits > 300);
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
