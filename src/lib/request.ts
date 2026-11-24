// The sealed request. Under the fixed-package model the site never picks, stores, transmits or reveals a
// destination before a person confirms the trip. This module turns the customer's rules into a sealed summary
// (dates, price, how many catalog entries stay in play, a general climate range) and into the form payload.
// Nothing here returns a destination id, name, country or coordinates.
import { destinations, type Destination } from '../data/destinations.ts';
import { MAX_ORDER_TOTAL_USD, PRICE_STEP } from './pricing.config.ts';
import { eligibleSet, pickStart, type Cabin, type Citizenship, type EligibleResult, type Flexibility, type Passport, type Rng, type Veto } from './dna.ts';
import type { Mood } from '../data/photos.ts';

export type Delivery = 'sealed' | 'date';
export type Rules = {
  airport: string; party: number; budget: number; nights: number; flexibility: Flexibility; earliest: string; month: string;
  citizenship: Citizenship; passport: Passport; passportSixMonths: boolean; vetoes: Veto[]; cabin: Cabin; delivery: Delivery; revealDate: string;
};

export type Sealed = {
  nights: number; party: number; start: string; end: string; perPerson: number; total: number;
  count: number; climate: string; vetoes: Veto[]; passport: Passport; cabin: Cabin;
};

const MS_DAY = 86400000;
const iso = (ms: number) => new Date(ms).toISOString().slice(0, 10);
export const CABIN_LABEL: Record<Cabin, string> = { economy: 'Economy', premium: 'Premium economy', business: 'Business' };
export const packagePricePP = (budget: number) => Math.floor(budget / PRICE_STEP) * PRICE_STEP;

function temp(d: Destination): 'warm' | 'mild' | 'cool' {
  if (d.cold) return 'cool';
  if (/four seasons|^mild|changeable|dry and sunny/i.test(d.climate)) return 'mild';
  return /hot|tropical|warm/i.test(d.climate) ? 'warm' : 'mild';
}
function place(d: Destination): string {
  if (d.city) return 'city';
  if (d.beach) return 'coast';
  return d.cold ? 'mountain town' : 'countryside';
}

// A general climate and setting range across the eligible set. Never names or points to one place.
export function climateRange(set: Destination[]): string {
  if (!set.length) return '';
  const counts = new Map<string, number>();
  for (const d of set) { const k = `${temp(d)} ${place(d)}`; counts.set(k, (counts.get(k) ?? 0) + 1); }
  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const first = ranked[0][0];
  const [t1, p1] = [first.split(' ')[0], first.split(' ').slice(1).join(' ')];
  
  const split = (k: string) => [k.split(' ')[0], k.split(' ').slice(1).join(' ')];
  const dist = (k: string) => { const [t, p] = split(k); return (p !== p1 ? 2 : 0) + (t !== t1 ? 1 : 0); };
  const other = ranked.filter(([k]) => k !== first).sort((a, b) => dist(b[0]) - dist(a[0]) || b[1] - a[1])[0];
  if (!other) return `Likely a ${first}.`;
  return `Could be a ${first}, could be a ${other[0]}.`;
}

export type SealResult = { ok: true; sealed: Sealed } | { ok: false; reason: 'below-floor' | 'too-few' | 'over-cap'; minBudget?: number };

export const overCap = (budgetPP: number, party: number) => budgetPP * party > MAX_ORDER_TOTAL_USD;

export function sealRules(r: Rules, opts: { today?: string; rng?: Rng } = {}): SealResult {
  if (overCap(r.budget, r.party)) return { ok: false, reason: 'over-cap' };
  const e: EligibleResult = eligibleSet({ passport: r.passport, party: r.party, budgetPP: r.budget, nights: r.nights, vetoes: r.vetoes, cabin: r.cabin });
  if (!e.ok) return { ok: false, reason: e.reason, minBudget: e.minBudget };
  const start = pickStart({ flexibility: r.flexibility, earliest: r.earliest, month: r.month, today: opts.today, rng: opts.rng });
  const end = iso(Date.parse(start + 'T00:00:00Z') + r.nights * MS_DAY);
  const perPerson = packagePricePP(r.budget);
  return { ok: true, sealed: { nights: r.nights, party: r.party, start, end, perPerson, total: perPerson * r.party, count: e.count, climate: climateRange(e.set), vetoes: r.vetoes, passport: r.passport, cabin: r.cabin } };
}

// Header photo for the sealed card: chosen from the person's vetoes and the season only, never from a destination.
export function moodForRules(vetoes: Veto[], startISO: string): Mood {
  const m = Number(startISO.slice(5, 7));
  const winter = m >= 11 || m <= 3;
  const noBeach = vetoes.includes('no-beaches'), noCold = vetoes.includes('no-cold'), noCity = vetoes.includes('no-cities'), noRemote = vetoes.includes('no-remote');
  if (noCold && noBeach) return noCity ? 'desert' : winter ? 'desert' : 'market';
  if (noCold) return noCity ? 'lagoon' : 'coast';
  if (noBeach) return noCity ? (noRemote ? 'wing' : 'lake') : 'market';
  if (noCity && !noRemote) return winter ? 'mountain' : 'lake';
  return 'wing';
}

export type RequestContact = { name: string; email: string; state: string; notes: string };
export type DnaForForm = { archetype: string; profileJson: string } | null;

// The trip-request form fields. No destination identifier, name or coordinates appear anywhere in this object.
export function buildRequestPayload(r: Rules, s: Sealed, c: RequestContact, dna: DnaForForm): Record<string, string | number | string[]> {
  return {
    name: c.name, email: c.email, state: c.state, notes: c.notes,
    departure_airport: r.airport, travelers: r.party, budget_per_person: r.budget, nights: r.nights, flexibility: r.flexibility,
    earliest_departure: r.flexibility === 'month' ? '' : r.earliest, month: r.flexibility === 'month' ? r.month : '',
    citizenship: r.citizenship === 'us' ? 'US passport' : 'Other', passport: r.passport,
    passport_valid_six_months: r.passport === 'valid' ? (r.passportSixMonths ? 'yes' : 'no') : 'n/a',
    vetoes: r.vetoes,
    cabin: CABIN_LABEL[r.cabin],
    delivery_preference: r.delivery === 'sealed' ? 'keep it sealed until the morning I leave' : 'reveal on a date I choose',
    reveal_date: r.delivery === 'date' ? r.revealDate : '',
    trip_start: s.start, trip_end: s.end, estimated_total: s.total, estimated_per_person: s.perPerson, destinations_in_play: s.count,
    archetype: dna?.archetype ?? '', dna_profile: dna?.profileJson ?? '',
  };
}

export const catalogNames = () => destinations.flatMap((d) => [d.id, d.name, d.country]);
