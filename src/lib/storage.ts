// Safe localStorage helpers. `triproll_dna` holds the v4 profile: { v: 4, axes, archetype, brief, dates }.
// v3 profiles (same axes and brief, no dates, a brief with an occasion) are migrated on read: the occasion is dropped and dates start empty.
// Older shapes (v1 and v2 stored six axes as { dna, passport, archetype }) are discarded safely because six axes
// cannot be mapped honestly onto eight, so the person retakes the assessment.
import { AXES, EMPTY_BRIEF, type Brief, type Dna } from '../data/quiz.ts';
import { EMPTY_DATES, parseDates, type ImportantDates } from './dates.ts';
import type { Rules } from './request.ts';

export const DNA_KEY = 'triproll_dna';
export const PARAMS_KEY = 'triproll_params';
export const PROFILE_VERSION = 4;

export type StoredProfile = { v: 4; axes: Dna; archetype: string; brief: Brief; dates: ImportantDates };
export type StoredParams = Rules;

function readRaw(key: string): unknown {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
function write(key: string, value: unknown) {
  try { window.localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable */ }
}

const isNum = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= 1;
const strArr = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);
const str = (v: unknown): string => (typeof v === 'string' ? v : '');

// Validate and normalize any value into a v4 profile (migrating v3), or return null.
export function parseProfile(v: unknown): StoredProfile | null {
  if (!v || typeof v !== 'object') return null;
  const o = v as Record<string, unknown>;
  if (o.v !== PROFILE_VERSION && o.v !== 3) return null;
  const axes = o.axes as Record<string, unknown> | undefined;
  if (!axes || typeof axes !== 'object' || !AXES.every((a) => isNum(axes[a]))) return null;
  const b = (o.brief && typeof o.brief === 'object' ? o.brief : {}) as Record<string, unknown>;
  const brief: Brief = {
    ...EMPTY_BRIEF,
    climate: str(b.climate), maxFlight: str(b.maxFlight), diet: strArr(b.diet), dietAdventure: str(b.dietAdventure), dietNotes: str(b.dietNotes),
    mobility: strArr(b.mobility), mobilityNotes: str(b.mobilityNotes), lodging: strArr(b.lodging), greats: strArr(b.greats), greatsText: str(b.greatsText),
    noGos: strArr(b.noGos), noGosText: str(b.noGosText), visited: str(b.visited), withWhom: str(b.withWhom), notes: str(b.notes),
  };
  const dates = o.v === 4 ? parseDates(o.dates) : { ...EMPTY_DATES, children: [] };
  return { v: 4, axes: Object.fromEntries(AXES.map((a) => [a, axes[a] as number])) as Dna, archetype: str(o.archetype), brief, dates };
}

export function loadProfile(): StoredProfile | null {
  const raw = readRaw(DNA_KEY);
  const p = parseProfile(raw);
  if (!p && raw) { try { window.localStorage.removeItem(DNA_KEY); } catch { /* ignore */ } }
  return p;
}
export const saveProfile = (v: StoredProfile) => write(DNA_KEY, v);
export const loadParams = () => readRaw(PARAMS_KEY) as Partial<StoredParams> | null;
export const saveParams = (v: StoredParams) => write(PARAMS_KEY, v);
