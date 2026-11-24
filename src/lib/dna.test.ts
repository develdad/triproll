// Run with: npm test  (node --test, Node 22 strips TypeScript types natively)
import test from 'node:test';
import assert from 'node:assert/strict';
import { matchArchetype, scoreQuiz, rollTrip, packingHints, internalCostPP, minBudgetPP, packagePrice, type Cabin, eligibleSet, passesFilters, type Veto } from './dna.ts';
import { BETA_ALLOW_PREREG, CABIN_FLOOR_MULT, MAX_ADVISORY_LEVEL, MAX_ORDER_TOTAL_USD, BUFFER, COST_CEILING, FLOOR_OVERALL, FLOOR_PER_NIGHT, MARGIN, MIN_ELIGIBLE, SEASON_MAX, paymentsLive } from './pricing.config.ts';
import { RESTRICTED_STATES, ENTRY_RULE, DELIVERY_OPTIONS, ui } from '../data/roll.ts';
import { faqs, terms, howItWorks, about, home, rollPage, travelDna, privacy, thanks, footerBlurb } from '../data/copy.ts';
import { variants, requestSteps, stepText, pay } from '../data/payment.ts';
import { AXES, questions, sections, archetypes, EMPTY_BRIEF } from '../data/quiz.ts';
import { destinations } from '../data/destinations.ts';
import { FORM_FIELDS } from './forms.ts';
import { buildRequestPayload, overCap, catalogNames, climateRange, moodForRules, sealRules, type Rules } from './request.ts';
import { parseProfile, DNA_KEY } from './storage.ts';
import { axisExplainer, briefRows, implications, openAxes, serializeProfile, strongestAxes } from './profile.ts';
import { MOODS } from '../data/photos.ts';

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
const randomAnswers = (rng: () => number) => questions.map((q) => q.answers[Math.floor(rng() * q.answers.length)]);

test('assessment has 24 questions in named sections, four answers each', () => {
  assert.equal(questions.length, 24);
  assert.ok(sections.length >= 5 && sections.every((s) => s.name.length > 2 && s.questions.length >= 2));
  for (const q of questions) assert.equal(q.answers.length, 4, q.id);
  assert.equal(new Set(questions.map((q) => q.id)).size, 24);
});

test('eight axes: each is scored by at least five questions and both poles are reachable', () => {
  assert.deepEqual([...AXES], ['pace', 'novelty', 'setting', 'comfort', 'social', 'structure', 'culture', 'activity']);
  for (const a of AXES) {
    const n = questions.filter((q) => q.answers.some((x) => x.dna[a] !== undefined)).length;
    assert.ok(n >= 5, `${a} is scored by ${n} questions`);
    for (const dir of [1, -1]) {
      const forced: number[] = [], opt: number[] = [];
      for (const q of questions) {
        const v = q.answers.map((x) => x.dna[a]);
        const m = v.filter((x): x is number => x !== undefined);
        if (!m.length) continue;
        const best = dir > 0 ? Math.max(...m) : Math.min(...m);
        (m.length === v.length ? forced : opt).push(best);
      }
      opt.sort((x, y) => dir * (y - x));
      const set = forced.length ? [...forced] : [opt.shift() as number];
      let avg = set.reduce((s, x) => s + x, 0) / set.length;
      for (const o of opt) { const na = (set.reduce((s, x) => s + x, 0) + o) / (set.length + 1); if (dir * (na - avg) > 0) { set.push(o); avg = na; } else break; }
      if (dir > 0) assert.ok(avg >= 0.8, `${a} max ${avg}`); else assert.ok(avg <= 0.2, `${a} min ${avg}`);
    }
  }
});

test('scoring returns eight axes in 0..1 for random answer sets, and archetype matching is stable', () => {
  const rng = seeded(1);
  for (let n = 0; n < 300; n++) {
    const dna = scoreQuiz(randomAnswers(rng));
    assert.deepEqual(Object.keys(dna).sort(), [...AXES].sort());
    for (const a of AXES) assert.ok(dna[a] >= 0 && dna[a] <= 1, `${a}=${dna[a]}`);
    assert.ok(archetypes.some((x) => x.key === matchArchetype(dna).key));
  }
  assert.equal(archetypes.length, 8);
  for (const arc of archetypes) {
    assert.deepEqual(Object.keys(arc.profile).sort(), [...AXES].sort());
    assert.equal(matchArchetype(arc.profile).key, arc.key);
    const jitter = Object.fromEntries(AXES.map((a) => [a, Math.min(1, Math.max(0, arc.profile[a] + (a.length % 2 ? 0.05 : -0.05)))])) as typeof arc.profile;
    assert.equal(matchArchetype(jitter).key, arc.key, `${arc.key} unstable under small noise`);
  }
});

test('catalog: eight axes in 0..1 for every destination, entry flags set, no vaccinations', () => {
  assert.ok(destinations.length >= 30);
  for (const d of destinations) {
    assert.deepEqual(Object.keys(d.dna).sort(), [...AXES].sort(), d.id);
    for (const a of AXES) assert.ok(d.dna[a] >= 0 && d.dna[a] <= 1, `${d.id}.${a}`);
    assert.ok(['domestic', 'none', 'on_arrival', 'prereg'].includes(d.entry), d.id);
    assert.equal(d.entryVerified, '2026-11-23', d.id);
    assert.equal(d.vaccineRequired, false, d.id);
    assert.equal(d.entry === 'domestic', d.domestic, d.id);
  }
  for (const a of AXES) {
    assert.ok(destinations.some((d) => d.dna[a] <= 0.3) && destinations.some((d) => d.dna[a] >= 0.7), `${a} range in catalog`);
  }
  const by = (e: string) => destinations.filter((d) => d.entry === e).map((d) => d.country).sort();
  assert.deepEqual([...new Set(by('prereg'))], ['Australia', 'New Zealand', 'South Korea', 'United Kingdom']);
  assert.deepEqual([...new Set(by('on_arrival'))], ['Indonesia', 'Mexico', 'Singapore', 'Thailand', 'UAE']);
});

test('entry rules: prereg is excluded while BETA_ALLOW_PREREG is false, and passport none is domestic only', () => {
  assert.equal(BETA_ALLOW_PREREG, false);
  const e = eligibleSet({ budgetPP: 6000, party: 2, nights: 5 });
  assert.ok(e.ok);
  if (e.ok) {
    assert.ok(e.set.every((d) => d.entry !== 'prereg' && !d.vaccineRequired));
    assert.ok(!e.set.some((d) => ['london', 'sydney', 'queenstown', 'seoul'].includes(d.id)));
    assert.ok(e.set.some((d) => d.entry === 'on_arrival'));
  }
  const none = eligibleSet({ budgetPP: 6000, passport: 'none' });
  assert.ok(none.ok && none.set.every((d) => d.domestic));
  assert.equal(passesFilters({ ...destinations[0], vaccineRequired: true }, 'valid', []), false);
});

test('eligible count respects the budget rule, passport, vetoes and entry rules', () => {
  const rng = seeded(6);
  const allVetoes: Veto[] = ['no-beaches', 'no-cold', 'no-long-haul', 'no-cities', 'no-remote'];
  for (let i = 0; i < 400; i++) {
    const party = 1 + Math.floor(rng() * 8), nights = 2 + Math.floor(rng() * 9), budgetPP = 600 + Math.floor(rng() * 5400);
    const passport = rng() < 0.3 ? 'none' : 'valid';
    const vetoes = allVetoes.filter(() => rng() < 0.25);
    const r = eligibleSet({ party, nights, budgetPP, passport, vetoes });
    if (r.ok) {
      assert.equal(r.count, r.set.length);
      assert.ok(r.count >= MIN_ELIGIBLE);
      for (const d of r.set) {
        assert.ok(internalCostPP(d, party, nights) <= budgetPP * COST_CEILING + 1e-9, 'budget rule');
        assert.ok(passport === 'valid' || d.domestic, 'passport');
        assert.ok(d.entry !== 'prereg', 'entry');
        assert.ok(!(vetoes.includes('no-beaches') && d.beach) && !(vetoes.includes('no-cold') && d.cold) && !(vetoes.includes('no-long-haul') && d.hours > 8) && !(vetoes.includes('no-cities') && d.city) && !(vetoes.includes('no-remote') && d.remote), 'vetoes');
      }
      const more = eligibleSet({ party, nights, budgetPP: budgetPP + 1000, passport, vetoes });
      assert.ok(more.ok && more.count >= r.count, 'more budget never shrinks the set');
    } else {
      assert.ok(r.reason === 'too-few' || r.reason === 'below-floor');
    }
  }
  // Fewer than three places means loosen a rule, treated like the below-floor case.
  const tight = eligibleSet({ budgetPP: 6000, passport: 'none', vetoes: allVetoes });
  assert.equal(tight.ok, false);
  const s = sealRules({ ...baseRules(), passport: 'none', vetoes: allVetoes }, { today: TODAY });
  assert.equal(s.ok, false);
});

function baseRules(): Rules {
  return { airport: 'PHX', party: 2, budget: 1800, nights: 5, flexibility: 'exact', earliest: '2027-03-14', month: '', citizenship: 'us', passport: 'valid', passportSixMonths: true, vetoes: [], cabin: 'economy', delivery: 'sealed', revealDate: '' };
}

test('the request payload and sealed summary never carry a destination identifier, name or country', () => {
  const rng = seeded(11);
  const words = [...new Set(catalogNames())].filter((w) => w !== 'USA');
  const re = new RegExp(`\\b(${words.map((w) => w.replace(/[+.*?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`, 'i');
  for (let i = 0; i < 150; i++) {
    const rules: Rules = { ...baseRules(), party: 1 + Math.floor(rng() * 8), nights: 2 + Math.floor(rng() * 9), budget: 1500 + Math.floor(rng() * 4500), vetoes: (['no-cold', 'no-beaches'] as Veto[]).filter(() => rng() < 0.4), delivery: rng() < 0.5 ? 'sealed' : 'date', revealDate: '2027-03-01' };
    const r = sealRules(rules, { today: TODAY, rng });
    if (!r.ok) continue;
    const payload = buildRequestPayload(rules, r.sealed, { name: 'Pat Doe', email: 'pat@example.com', state: 'AZ', notes: '' }, { archetype: 'trailblazer', profileJson: serializeProfile({ v: 3, axes: scoreQuiz(randomAnswers(rng)), archetype: 'trailblazer', brief: EMPTY_BRIEF }) });
    const blob = JSON.stringify([payload, r.sealed]);
    assert.ok(!re.test(blob), `destination leaked: ${blob.match(re)?.[0]}`);
    for (const k of Object.keys(payload)) assert.ok(!/^destination(_id|_name)?$|reveal(?!_date)|reroll/i.test(k), k);
    assert.equal(payload.delivery_preference, rules.delivery === 'sealed' ? 'keep it sealed until the morning I leave' : 'reveal on a date I choose');
    assert.equal(payload.cabin, 'Economy');
    assert.equal(payload.estimated_per_person, Math.floor(rules.budget / 10) * 10);
    assert.equal(payload.estimated_total, Math.floor(rules.budget / 10) * 10 * rules.party);
    assert.ok(typeof payload.destinations_in_play === 'number' && (payload.destinations_in_play as number) >= 3);
  }
  assert.ok(!climateRange(destinations).match(re));
  assert.ok(MOODS.includes(moodForRules(['no-cold'], '2027-03-14')));
  for (const v of [[], ['no-beaches'], ['no-cold'], ['no-cold', 'no-beaches'], ['no-cities'], ['no-beaches', 'no-cities']] as Veto[][]) for (const d of ['2027-01-10', '2027-07-10']) assert.ok(MOODS.includes(moodForRules(v, d)));
});

test('form definitions: no destination, reveal or reroll fields; DNA profile and entry fields are captured', () => {
  for (const f of FORM_FIELDS['trip-request']) assert.ok(!/destination_id|revealed|reroll|reveal_preference/.test(f), f);
  for (const need of ['dna_profile', 'archetype', 'citizenship', 'passport_valid_six_months', 'delivery_preference', 'destinations_in_play']) assert.ok((FORM_FIELDS['trip-request'] as readonly string[]).includes(need), need);
  assert.ok((FORM_FIELDS.waitlist as readonly string[]).includes('dna_profile'));
});

test('pricing constants: margin 15 percent plus buffer 10 percent leaves a 75 percent cost ceiling', () => {
  assert.equal(MARGIN, 0.15);
  assert.equal(BUFFER, 0.1);
  assert.equal(COST_CEILING, 0.75);
  assert.equal(SEASON_MAX, 1.14);
});

test('weighted roll (kept for future use): internal cost never exceeds 75 percent of budget; package price is budget rounded down to 10', () => {
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
      assert.ok(cost <= budgetPP * 0.75 + 1e-9);
      assert.equal(r.trip.price.perPerson, packagePrice(budgetPP));
      assert.equal(r.trip.price.total, r.trip.price.perPerson * party);
      assert.notEqual(r.trip.dest.entry, 'prereg');
    } else {
      assert.equal(r.reason, 'below-floor');
      assert.ok((r.minBudget ?? 0) > budgetPP);
    }
  }
  assert.ok(fits > 250);
  const r = rollTrip({ budgetPP: 3000, today: TODAY, rng: seeded(9) });
  assert.ok(r.ok);
  if (r.ok) assert.ok(!JSON.stringify(r.trip).match(/margin|service|flightBase|hotelNight|extras|breakdown/i));
});

test('passport none never yields an international destination, and rerolls never repeat', () => {
  const rng = seeded(2);
  for (let i = 0; i < 300; i++) {
    const r = rollTrip({ passport: 'none', party: 1 + Math.floor(rng() * 8), nights: 2 + Math.floor(rng() * 9), budgetPP: 6000, rng, today: TODAY, dna: i % 2 ? scoreQuiz(randomAnswers(rng)) : null });
    assert.ok(r.ok);
    if (r.ok) assert.equal(r.trip.dest.domestic, true);
  }
  for (let i = 0; i < 60; i++) {
    const exclude: string[] = [];
    for (let k = 0; k < 4; k++) {
      const r = rollTrip({ budgetPP: 6000, exclude, rng, today: TODAY });
      assert.ok(r.ok);
      if (r.ok) { assert.ok(!exclude.includes(r.trip.dest.id)); exclude.push(r.trip.dest.id); }
    }
  }
});

test('viability floor: at least 150 per person per night and 600 overall, and a request below it is refused', () => {
  for (const nights of [2, 4, 5, 8, 10]) {
    for (const party of [1, 2, 3, 8]) {
      for (const passport of ['valid', 'none'] as const) {
        const f = minBudgetPP(nights, party, passport);
        assert.ok(f >= FLOOR_PER_NIGHT * nights && f >= FLOOR_OVERALL, `${nights}/${party}/${passport}: ${f}`);
        assert.equal(f % 10, 0);
        const below = eligibleSet({ budgetPP: f - 10, nights, party, passport });
        assert.equal(below.ok, false);
        const at = eligibleSet({ budgetPP: f, nights, party, passport });
        assert.equal(at.ok, true, `floor ${f} should keep ${MIN_ELIGIBLE} places for ${nights} nights, party ${party}, ${passport}`);
        assert.equal(rollTrip({ budgetPP: f, nights, party, passport, today: TODAY, rng: seeded(nights * 10 + party) }).ok, true);
      }
    }
  }
});

test('vetoes are respected by the weighted roll and dates respect the lead time', () => {
  const rng = seeded(5);
  for (let i = 0; i < 200; i++) {
    const r = rollTrip({ budgetPP: 6000, vetoes: ['no-beaches', 'no-cold', 'no-long-haul', 'no-cities', 'no-remote'], rng, today: TODAY, flexibility: 'pm3', earliest: '2027-01-12' });
    if (!r.ok) continue;
    const d = r.trip.dest;
    assert.ok(!d.beach && !d.cold && d.hours <= 8 && !d.city && !d.remote);
    assert.ok(r.trip.start >= '2027-01-24');
  }
});

test('Iowa joins the blocked residency list and every state mention in copy matches the config', () => {
  assert.deepEqual([...RESTRICTED_STATES].sort(), ['CA', 'FL', 'HI', 'IA', 'WA']);
  const blob = JSON.stringify([faqs, terms, howItWorks, about, home, rollPage]);
  assert.ok(blob.includes('Iowa'));
  assert.ok(!/California, Florida, Hawaii or Washington/.test(blob));
});

test('payment wording: exact list, two variants, no hold wording while paymentsLive is false', () => {
  assert.equal(paymentsLive, false);
  assert.deepEqual(variants.off.map(stepText), [
    'Request your trip. Nothing is charged today.',
    'A person reviews it. Within 72 hours we confirm we can build it inside your rules.',
    'If we can, you approve payment and get your confirmation and packing list. If we cannot, you owe nothing.',
    'Your itinerary arrives the morning you leave, or on the reveal date you picked.',
  ]);
  assert.equal(stepText(variants.on[0]), 'Request your trip. We place a hold on your card to verify funds.');
  assert.equal(stepText(variants.on[2]), 'If we can, your card is charged and you get your confirmation and packing list. If we cannot, the hold is released and you owe nothing.');
  assert.deepEqual(requestSteps, variants.off);
  const blob = JSON.stringify([faqs, terms, howItWorks, about, home, rollPage, travelDna, privacy, thanks, footerBlurb, pay]).toLowerCase();
  assert.ok(!/hold on your card|place a hold|hold is released|verify funds|card is held|we hold/.test(blob));
  assert.ok(blob.includes('72 hours'));
});

test('copy: entry rule appears in FAQ, how it works and roll copy; no dashes as punctuation; no reveal or reroll language', () => {
  assert.ok(ENTRY_RULE.includes('no advance visa, no pre-registration and no required vaccinations'));
  assert.ok(JSON.stringify(faqs).includes('no advance visa, no pre-registration and no required vaccinations'));
  assert.ok(JSON.stringify(howItWorks).includes('no advance visa, no pre-registration and no required vaccinations'));
  assert.ok(JSON.stringify(rollPage).includes('no advance visa, no pre-registration and no required vaccinations'));
  const blob = JSON.stringify([faqs, terms, howItWorks, about, home, rollPage, travelDna, privacy]);
  assert.ok(!/[\u2013\u2014]/.test(blob));
  assert.ok(!/reroll|show me now|peek/i.test(blob));
});

test('storage v3: valid profiles parse, older six-axis shapes are discarded', () => {
  assert.equal(DNA_KEY, 'triproll_dna');
  const axes = scoreQuiz(randomAnswers(seeded(4)));
  const ok = parseProfile({ v: 3, axes, archetype: 'trailblazer', brief: { diet: ['Vegan'], noGos: 7 } });
  assert.ok(ok && ok.v === 3 && ok.brief.diet[0] === 'Vegan' && ok.brief.noGos.length === 0);
  assert.equal(parseProfile({ dna: { adventure: 0.5, social: 0.5, structure: 0.5, cultural: 0.5, budget: 0.5, energy: 0.5 }, passport: 'valid', archetype: 'sunseeker' }), null);
  assert.equal(parseProfile({ v: 2, axes }), null);
  assert.equal(parseProfile({ v: 3, axes: { ...axes, pace: 4 } }), null);
  assert.equal(parseProfile(null), null);
  assert.equal(parseProfile('x'), null);
});

test('profile insights: strongest and open axes, 5 or 6 implications, brief summary', () => {
  const dna = scoreQuiz(randomAnswers(seeded(21)));
  assert.equal(strongestAxes(dna).length, 2);
  assert.equal(openAxes(dna).length, 2);
  assert.ok(!strongestAxes(dna).some((a) => openAxes(dna).includes(a)));
  for (const a of AXES) assert.ok(axisExplainer(a, dna[a]).length > 20);
  const empty = implications(dna, EMPTY_BRIEF);
  assert.ok(empty.length >= 5 && empty.length <= 6);
  const brief = { ...EMPTY_BRIEF, diet: ['Gluten-free'], noGos: ['Heights'], occasion: 'Anniversary', greats: ['Food', 'History'], mobility: ['Avoid stairs'] };
  // The first four brief statements win, in the order food, access, hard no's, occasion.
  const full = implications(dna, brief);
  assert.ok(full.length >= 5 && full.length <= 6);
  assert.ok(full.join(' ').includes('gluten-free') && full.join(' ').includes('heights') && full.join(' ').includes('anniversary'));
  assert.equal(briefRows(EMPTY_BRIEF).length, 0);
  assert.ok(briefRows(brief).some((r) => r.label === 'Hard no'));
  const slow = implications({ ...dna, pace: 0.02, novelty: 0.5, setting: 0.5, comfort: 0.5, social: 0.5, structure: 0.5, culture: 0.5, activity: 0.5 }, EMPTY_BRIEF);
  assert.ok(slow[0].includes('no more than one booked thing a day'));
});

test('packing hints always return five unique items', () => {
  for (const d of destinations) {
    const h = packingHints(d);
    assert.equal(h.length, 5);
    assert.equal(new Set(h).size, 5);
  }
});

test('advisory gate: nothing above the maximum advisory level is ever in play', () => {
  assert.equal(MAX_ADVISORY_LEVEL, 2);
  const out = destinations.filter((d) => d.advisoryLevel !== null && d.advisoryLevel > MAX_ADVISORY_LEVEL).map((d) => d.country);
  assert.deepEqual([...new Set(out)].sort(), ['Colombia', 'UAE']);
  for (const d of destinations) assert.equal(passesFilters(d, 'valid', []), !(d.entry === 'prereg' || (d.advisoryLevel ?? 0) > MAX_ADVISORY_LEVEL), d.id);
  const big = eligibleSet({ budgetPP: 6000, party: 1, nights: 5 });
  assert.ok(big.ok);
  if (big.ok) {
    assert.ok(big.set.every((d) => (d.advisoryLevel ?? 0) <= MAX_ADVISORY_LEVEL && d.entry !== 'prereg'));
    assert.ok(!big.set.some((d) => ['cartagena', 'dubai', 'london', 'seoul', 'sydney', 'queenstown'].includes(d.id)));
    assert.equal(big.count, destinations.length - 6);
  }
});

test('audited catalog: every entry is dated, mexico is on arrival, south korea stays prereg', () => {
  for (const d of destinations) assert.equal(d.entryVerified, '2026-11-23', d.id);
  assert.ok(destinations.filter((d) => d.country === 'Mexico').every((d) => d.entry === 'on_arrival'));
  assert.ok(destinations.filter((d) => d.country === 'South Korea').every((d) => d.entry === 'prereg'));
  assert.ok(destinations.filter((d) => d.domestic).every((d) => d.entry === 'domestic' && d.advisoryLevel === null));
  assert.ok(destinations.filter((d) => !d.domestic).every((d) => typeof d.advisoryLevel === 'number'));
});

test('cabin class multiplies the budget floor and shrinks the eligible set', () => {
  assert.deepEqual(CABIN_FLOOR_MULT, { economy: 1, premium: 1.6, business: 3.0 });
  const base = minBudgetPP(5, 2, 'valid', [], 'economy');
  assert.ok(minBudgetPP(5, 2, 'valid', [], 'premium') >= base * 1.6 && minBudgetPP(5, 2, 'valid', [], 'premium') < base * 1.6 + 10);
  assert.ok(minBudgetPP(5, 2, 'valid', [], 'business') >= base * 3 && minBudgetPP(5, 2, 'valid', [], 'business') < base * 3 + 10);
  for (const c of ['premium', 'business'] as Cabin[]) {
    const m = minBudgetPP(5, 2, 'valid', [], c);
    assert.equal(eligibleSet({ budgetPP: m - 40, party: 2, nights: 5, cabin: c }).ok, false, 'below the cabin floor');
    assert.equal(eligibleSet({ budgetPP: m, party: 2, nights: 5, cabin: c }).ok, true, 'at the cabin floor');
  }
  const e = eligibleSet({ budgetPP: 3000, party: 2, nights: 5, cabin: 'economy' });
  const b = eligibleSet({ budgetPP: 3000, party: 2, nights: 5, cabin: 'business' });
  assert.ok(e.ok && (!b.ok || b.count <= e.count));
  const r = sealRules({ ...baseRules(), budget: 4800, cabin: 'business' }, { today: TODAY });
  assert.ok(r.ok && r.sealed.cabin === 'business');
  assert.equal(buildRequestPayload({ ...baseRules(), cabin: 'premium' }, (sealRules({ ...baseRules(), budget: 3000, cabin: 'premium' }, { today: TODAY }) as any).sealed, { name: 'A', email: 'a@b.co', state: 'AZ', notes: '' }, null).cabin, 'Premium economy');
});

test('beta order cap: budget times travelers above 10000 is not sealed', () => {
  assert.equal(MAX_ORDER_TOTAL_USD, 10000);
  assert.equal(overCap(2500, 4), false);
  assert.equal(overCap(2501, 4), true);
  const over = sealRules({ ...baseRules(), party: 5, budget: 2100 }, { today: TODAY });
  assert.deepEqual(over, { ok: false, reason: 'over-cap' });
  const exact = sealRules({ ...baseRules(), party: 5, budget: 2000 }, { today: TODAY });
  assert.ok(exact.ok);
  assert.ok(/capped at \$10,000 per order/.test(uiText()));
});
function uiText() { return ui.overCap; }

test('reveal timing copy: no at-confirmation option, step four names the reveal date', () => {
  assert.ok(DELIVERY_OPTIONS.map((o) => o.label).includes('Keep it sealed until the morning I leave'));
  assert.ok(DELIVERY_OPTIONS.map((o) => o.label).includes('Reveal on a date I choose'));
  assert.equal(DELIVERY_OPTIONS[0].id, 'sealed');
  assert.ok(!JSON.stringify(DELIVERY_OPTIONS).includes('confirmation'));
  assert.equal(stepText(variants.off[3]), 'Your itinerary arrives the morning you leave, or on the reveal date you picked.');
});
