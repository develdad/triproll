// Travel DNA scoring and the weighted trip roll. Ported from v2 with the same mechanics:
// answers are averaged per axis, archetypes are matched by squared distance, destinations are
// weighted by affinity cubed. Pricing rules (package price, cost ceiling, floors) live in pricing.config.ts.
// Pure functions with an injectable rng and clock so they can be tested.
import { archetypes, type Answer, type Archetype, type Axis, type Dna } from '../data/quiz.ts';
import { destinations, toPublic, type Destination, type PublicDestination } from '../data/destinations.ts';
import { BUDGET_MAX, COST_CEILING, EXTRAS_RATE, FLOOR_OVERALL, FLOOR_PER_NIGHT, PRICE_STEP, SEASON_MAX } from './pricing.config.ts';

export const AXES: Axis[] = ['adventure', 'social', 'structure', 'cultural', 'budget', 'energy'];

export type Passport = 'valid' | 'none';
export type Veto = 'no-beaches' | 'no-cold' | 'no-long-haul' | 'no-cities' | 'no-remote';
export type Flexibility = 'exact' | 'pm3' | 'month';
export type Rng = () => number;

export function scoreQuiz(chosen: Answer[]): { dna: Dna; passport: Passport } {
  const sums = {} as Dna;
  const counts = {} as Dna;
  AXES.forEach((a) => { sums[a] = 0; counts[a] = 0; });
  let passport: Passport = 'valid';
  chosen.forEach((ans) => {
    if (ans.passport) passport = ans.passport;
    (Object.entries(ans.dna || {}) as [Axis, number][]).forEach(([axis, w]) => {
      sums[axis] += w;
      counts[axis] += 1;
    });
  });
  const dna = {} as Dna;
  AXES.forEach((a) => { dna[a] = counts[a] ? +(sums[a] / counts[a]).toFixed(2) : 0.5; });
  return { dna, passport };
}

export function matchArchetype(dna: Dna): Archetype {
  let best = archetypes[0];
  let bestDist = Infinity;
  archetypes.forEach((arc) => {
    const d = AXES.reduce((acc, a) => acc + (dna[a] - arc.profile[a]) ** 2, 0);
    if (d < bestDist) { bestDist = d; best = arc; }
  });
  return best;
}

export function affinity(dna: Dna, dest: PublicDestination): number {
  const d = AXES.reduce((acc, a) => acc + (dna[a] - dest.dna[a]) ** 2, 0);
  return 1 / (1 + d);
}

export function fitLabel(dna: Dna, dest: PublicDestination): 'strong' | 'good' | 'stretch' {
  const a = affinity(dna, dest);
  return a >= 0.7 ? 'strong' : a >= 0.5 ? 'good' : 'stretch';
}

export type Band = 'short' | 'medium' | 'long';
export const bandFor = (hours: number): Band => (hours < 4 ? 'short' : hours <= 8 ? 'medium' : 'long');

export type RollParams = {
  dna?: Dna | null;
  passport?: Passport;
  party?: number;
  budgetPP?: number;
  nights?: number;
  flexibility?: Flexibility;
  earliest?: string; // YYYY-MM-DD, used for exact and pm3
  month?: string; // YYYY-MM, used for month
  vetoes?: Veto[];
  exclude?: string[];
  today?: string; // YYYY-MM-DD, injectable for tests
  rng?: Rng;
};

// The only price data the UI layer receives: one package price. No cost lines, no margin.
export type Price = { perPerson: number; total: number };
export type Trip = { dest: PublicDestination; nights: number; party: number; start: string; end: string; price: Price; band: Band };
export type RollResult =
  | { ok: true; trip: Trip }
  | { ok: false; reason: 'no-match' | 'exhausted' | 'below-floor'; minBudget?: number };

export function passesFilters(d: Destination, passport: Passport, vetoes: Veto[]): boolean {
  if (passport === 'none' && !d.domestic) return false;
  if (vetoes.includes('no-beaches') && d.beach) return false;
  if (vetoes.includes('no-cold') && d.cold) return false;
  if (vetoes.includes('no-long-haul') && d.hours > 8) return false;
  if (vetoes.includes('no-cities') && d.city) return false;
  if (vetoes.includes('no-remote') && d.remote) return false;
  return true;
}

// Internal cost per person for one destination. Server-side style helper: never put its result on a Trip.
export function internalCostPP(d: Destination, party: number, nights: number, mult: number = SEASON_MAX): number {
  const rooms = Math.ceil(party / 2);
  const flights = Math.round(d.flightBase * mult) * party;
  const hotel = Math.round(d.hotelNight * nights * rooms * mult);
  const extras = Math.round((flights + hotel) * EXTRAS_RATE);
  return (flights + hotel + extras) / party;
}

const roundUp = (n: number, step: number) => Math.ceil(n / step) * step;
export const packagePrice = (budgetPP: number) => Math.floor(budgetPP / PRICE_STEP) * PRICE_STEP;

// Lowest per-person budget that can produce a trip for these inputs: the cheapest eligible destination at
// maximum seasonal cost must sit at or below the cost ceiling, and never below the hard floors.
export function minBudgetPP(nights: number, party: number, passport: Passport, vetoes: Veto[] = []): number {
  const pool = destinations.filter((d) => passesFilters(d, passport, vetoes));
  const costs = pool.map((d) => internalCostPP(d, party, nights));
  const byCost = costs.length ? roundUp(Math.min(...costs) / COST_CEILING, PRICE_STEP) : BUDGET_MAX;
  return Math.max(byCost, FLOOR_PER_NIGHT * nights, FLOOR_OVERALL);
}

const MS_DAY = 86400000;
const toMs = (iso: string) => Date.parse(iso + 'T00:00:00Z');
const toISO = (ms: number) => new Date(ms).toISOString().slice(0, 10);
export const MIN_LEAD_DAYS = 14;

export function pickStart(p: Pick<RollParams, 'flexibility' | 'earliest' | 'month' | 'today' | 'rng'>): string {
  const rng = p.rng ?? Math.random;
  const today = toMs(p.today ?? toISO(Date.now()));
  const floor = today + MIN_LEAD_DAYS * MS_DAY;
  const flex = p.flexibility ?? 'exact';
  if (flex === 'month' && p.month) {
    const first = Date.parse(p.month + '-01T00:00:00Z');
    const d = new Date(first);
    const daysInMonth = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
    const lo = Math.max(first, floor);
    const hi = first + (daysInMonth - 1) * MS_DAY;
    if (lo > hi) return toISO(floor);
    const span = Math.round((hi - lo) / MS_DAY);
    return toISO(lo + Math.floor(rng() * (span + 1)) * MS_DAY);
  }
  const base = p.earliest ? toMs(p.earliest) : floor;
  const offset = flex === 'pm3' ? Math.floor(rng() * 7) - 3 : 0;
  return toISO(Math.max(floor, base + offset * MS_DAY));
}

// Generate a trip. Weighted by DNA affinity when DNA exists, uniform otherwise.
// Hard rules: passport, vetoes, exclusions and the per-person budget are never violated.
export function rollTrip(p: RollParams = {}): RollResult {
  const rng = p.rng ?? Math.random;
  const passport = p.passport ?? 'valid';
  const party = Math.min(8, Math.max(1, Math.round(p.party ?? 2)));
  const nights = Math.min(10, Math.max(2, Math.round(p.nights ?? 5)));
  const budget = p.budgetPP ?? BUDGET_MAX;
  const vetoes = p.vetoes ?? [];
  const exclude = p.exclude ?? [];

  const eligible = destinations.filter((d) => passesFilters(d, passport, vetoes));
  if (!eligible.length) return { ok: false, reason: 'no-match' };
  const affordable = eligible.filter((d) => internalCostPP(d, party, nights) <= budget * COST_CEILING);
  if (!affordable.length || budget < FLOOR_PER_NIGHT * nights || budget < FLOOR_OVERALL) {
    return { ok: false, reason: 'below-floor', minBudget: minBudgetPP(nights, party, passport, vetoes) };
  }
  const pool = affordable.filter((d) => !exclude.includes(d.id));
  if (!pool.length) return { ok: false, reason: 'exhausted' };

  let dest: Destination;
  if (p.dna) {
    const dna = p.dna;
    const weights = pool.map((d) => affinity(dna, d) ** 3);
    const total = weights.reduce((a, b) => a + b, 0);
    let r = rng() * total;
    dest = pool[pool.length - 1];
    for (let i = 0; i < pool.length; i++) {
      r -= weights[i];
      if (r <= 0) { dest = pool[i]; break; }
    }
  } else {
    dest = pool[Math.min(pool.length - 1, Math.floor(rng() * pool.length))];
  }

  const perPerson = packagePrice(budget);
  const price: Price = { perPerson, total: perPerson * party };

  const start = pickStart({ flexibility: p.flexibility, earliest: p.earliest, month: p.month, today: p.today, rng });
  const end = toISO(toMs(start) + nights * MS_DAY);
  return { ok: true, trip: { dest: toPublic(dest), nights, party, start, end, price, band: bandFor(dest.hours) } };
}

export const fmt = (n: number) => '$' + n.toLocaleString('en-US');
export const fmtDate = (iso: string) =>
  new Date(iso + 'T00:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

// Five packing hints derived from catalog fields. First five that apply, in priority order.
export function packingHints(d: PublicDestination): string[] {
  const out: string[] = [];
  out.push(d.domestic ? 'Government photo ID' : 'Passport valid for six months past your return');
  if (d.cold) out.push('Insulated layers and a warm hat');
  else if (/hot|tropical/i.test(d.climate)) out.push('Light, breathable clothing');
  else out.push('Layers for changing weather');
  if (d.beach) out.push('Swimsuit and reef-safe sunscreen');
  if (d.dna.adventure >= 0.7 || d.remote) out.push('Broken-in trail shoes');
  else if (d.city) out.push('Comfortable walking shoes');
  if (!d.domestic) out.push('Plug adapter and a card with no foreign fees');
  if (d.remote) out.push('Rain shell and a refillable bottle');
  out.push('Portable charger');
  out.push('Small daypack');
  out.push('Refillable water bottle');
  return [...new Set(out)].slice(0, 5);
}
