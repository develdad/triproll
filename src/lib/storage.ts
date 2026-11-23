// Safe localStorage helpers. Keys and shape are kept from v2: triproll_dna = { dna, passport, archetype }.
import type { Dna } from '../data/quiz.ts';
import type { Flexibility, Passport, Veto } from './dna.ts';

export const DNA_KEY = 'triproll_dna';
export const PARAMS_KEY = 'triproll_params';

export type StoredDna = { dna: Dna; passport: Passport; archetype?: string };
export type StoredParams = {
  airport: string; party: number; budget: number; nights: number; flexibility: Flexibility;
  earliest: string; month: string; passport: Passport; vetoes: Veto[]; reveal: 'surprise' | 'now';
};

function read<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch { return null; }
}
function write(key: string, value: unknown) {
  try { window.localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable */ }
}

export function loadDna(): StoredDna | null {
  const v = read<StoredDna>(DNA_KEY);
  if (!v || !v.dna || typeof v.dna.adventure !== 'number') return null;
  return v;
}
export const saveDna = (v: StoredDna) => write(DNA_KEY, v);
export const loadParams = () => read<Partial<StoredParams>>(PARAMS_KEY);
export const saveParams = (v: StoredParams) => write(PARAMS_KEY, v);
