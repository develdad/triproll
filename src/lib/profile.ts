// Travel DNA profile helpers: serialization for the forms, plain-language insights and the
// "What this means for your trip" statements. Pure functions, covered by tests.
import { AXES, AXIS_META, archetypes, type Axis, type Brief, type Dna } from '../data/quiz.ts';
import { matchArchetype } from './dna.ts';
import type { StoredProfile } from './storage.ts';

// Compact JSON that goes into the hidden `dna_profile` field on the trip request and waitlist forms.
export function serializeProfile(p: StoredProfile): string {
  return JSON.stringify({ v: 3, archetype: p.archetype, axes: p.axes, brief: p.brief });
}

export const archetypeOf = (p: { archetype: string; axes: Dna }) => archetypes.find((a) => a.key === p.archetype) ?? matchArchetype(p.axes);

const dist = (v: number) => Math.abs(v - 0.5);
// "Strongest" signals are the axes furthest from the middle. "Most open" are the axes closest to it.
export function strongestAxes(d: Dna, n = 2): Axis[] {
  return [...AXES].sort((a, b) => dist(d[b]) - dist(d[a]) || AXES.indexOf(a) - AXES.indexOf(b)).slice(0, n);
}
export function openAxes(d: Dna, n = 2): Axis[] {
  return [...AXES].sort((a, b) => dist(d[a]) - dist(d[b]) || AXES.indexOf(a) - AXES.indexOf(b)).slice(0, n);
}

export function axisExplainer(a: Axis, v: number): string {
  const m = AXIS_META[a];
  if (v >= 0.65) return `${m.name}: leaning ${m.high.toLowerCase()}. ${m.highDesc}`;
  if (v <= 0.35) return `${m.name}: leaning ${m.low.toLowerCase()}. ${m.lowDesc}`;
  return `${m.name}: in the middle. You are happy either way, so your planner can choose for the trip.`;
}

const AXIS_STATEMENT: Record<Axis, [string, string, string]> = {
  pace: ['We will keep your days unhurried: no more than one booked thing a day.', 'We will plan two booked things a day and leave the rest open.', 'We will fill your days: three or four things, best first.'],
  novelty: ['We will pick places that feel easy from the first hour.', 'We will mix one familiar anchor with one thing that stretches you.', 'We will send you somewhere that stretches you, with the logistics handled.'],
  setting: ['Your base will be outside the city, with nature first.', 'Your base will mix city access with open space.', 'Your base will be in the middle of a city, on foot from the good streets.'],
  comfort: ['We will spend on access and experiences, not on the room.', 'We will book mid-range rooms and easy transfers.', 'We will book well-reviewed rooms and private transfers where the budget allows.'],
  social: ['We will favor quiet places and small tables over crowds.', 'We will balance quiet time with places where people gather.', 'We will pick places with a pulse, where it is easy to meet people.'],
  structure: ['We will book the anchors and leave open afternoons for wandering.', 'We will give you a short list of must-dos and leave the rest open.', 'Your plan will be set before you leave, with times, bookings and a clear order.'],
  culture: ['We will keep the history and food light, so they add color without driving the day.', 'We will include a few local meals and sights without making them the whole trip.', 'We will build the trip around local food, history and craft.'],
  activity: ['We will build in rest, with easy walks and nothing steep.', 'We will plan a few active hours a day and keep the rest easy.', 'We will include real effort: long walks, climbs or paddling.'],
};
const band = (v: number) => (v <= 0.35 ? 0 : v >= 0.65 ? 2 : 1);
export const axisStatement = (a: Axis, v: number) => AXIS_STATEMENT[a][band(v)];

const list = (xs: string[]) => (xs.length <= 1 ? xs.join('') : xs.slice(0, -1).join(', ') + ' and ' + xs[xs.length - 1]);
const lc = (xs: string[]) => xs.map((x) => x.toLowerCase());

// Five or six concrete statements generated from the scores and the planner brief.
export function implications(d: Dna, b: Brief): string[] {
  const out: string[] = [];
  const diet = b.diet.filter(Boolean);
  if (diet.length || b.dietNotes.trim()) out.push(`Every meal we suggest will respect your food needs${diet.length ? `: ${list(lc(diet))}` : ''}.`);
  const mob = b.mobility.filter((m) => m !== 'No needs');
  if (mob.length || b.mobilityNotes.trim()) out.push(`We will check access before we book: ${list(lc(mob.length ? mob : ['your mobility notes']))}.`);
  const nogos = [...b.noGos, ...(b.noGosText.trim() ? [b.noGosText.trim().toLowerCase()] : [])];
  if (nogos.length) out.push(`We will keep these off your trip: ${list(lc(nogos).slice(0, 4))}.`);
  if (b.occasion && b.occasion !== 'None') out.push(`We will plan one moment around your ${b.occasion.toLowerCase()}.`);
  const greats = b.greats.length ? b.greats : [];
  if (greats.length) out.push(`We will build the trip around ${list(lc(greats).slice(0, 3))}.`);
  if (b.lodging.length) out.push(`We will look for ${list(lc(b.lodging).slice(0, 2))} stays first.`);
  const extras = strongestAxes(d, 8).map((a) => axisStatement(a, d[a]));
  const target = 6;
  const picked = out.slice(0, 4);
  for (const s of extras) { if (picked.length >= target) break; picked.push(s); }
  return picked;
}

export const BRIEF_FIELDS = ['climate', 'maxFlight', 'diet', 'dietAdventure', 'dietNotes', 'mobility', 'mobilityNotes', 'lodging', 'greats', 'greatsText', 'noGos', 'noGosText', 'visited', 'withWhom', 'occasion', 'notes'] as const;

// One-line rows for the "Your planner brief" summary card. Empty answers are skipped.
export function briefRows(b: Brief): { label: string; value: string }[] {
  const rows: [string, string][] = [
    ['Climate', b.climate], ['Longest flight', b.maxFlight],
    ['Food', [...b.diet, b.dietAdventure, b.dietNotes].filter(Boolean).join(', ')],
    ['Access', [...b.mobility.filter((m) => m !== 'No needs'), b.mobilityNotes].filter(Boolean).join(', ')],
    ['Stay', b.lodging.join(', ')],
    ['Makes a trip great', [...b.greats, b.greatsText].filter(Boolean).join(', ')],
    ['Hard no', [...b.noGos, b.noGosText].filter(Boolean).join(', ')],
    ['Already been', b.visited], ['Travels with', b.withWhom], ['Occasion', b.occasion === 'None' ? '' : b.occasion], ['Planner notes', b.notes],
  ];
  return rows.filter(([, v]) => v.trim()).map(([label, value]) => ({ label, value }));
}
