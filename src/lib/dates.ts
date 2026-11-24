// Dates that matter: birthdays and an anniversary, month and day only (never a year), and the logic that notices
// when a trip window includes one of them. Pure functions, covered by tests. Dates are stored as "MM-DD".
export type DateRow = { name: string; md: string };
export type ImportantDates = { self: string; anniversary: string; partner: string; children: DateRow[] };
export const EMPTY_DATES: ImportantDates = { self: '', anniversary: '', partner: '', children: [] };
export const MAX_CHILDREN = 8;
export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] as const;

// Feb 29 is a valid answer (a person can be born on it).
export const daysInMonth = (m: number) => [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1] ?? 0;
export function parseMd(v: unknown): string {
  if (typeof v !== 'string') return '';
  const m = /^(\d{2})-(\d{2})$/.exec(v);
  if (!m) return '';
  const mo = Number(m[1]), d = Number(m[2]);
  return mo >= 1 && mo <= 12 && d >= 1 && d <= daysInMonth(mo) ? v : '';
}
export const toMd = (month: number, day: number) => (month && day ? `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}` : '');
export const splitMd = (md: string): { month: number; day: number } => (md ? { month: Number(md.slice(0, 2)), day: Number(md.slice(3, 5)) } : { month: 0, day: 0 });
// "June 12". Never a year.
export function fmtMd(md: string): string {
  const { month, day } = splitMd(md);
  return month ? `${MONTHS[month - 1]} ${day}` : '';
}
export function fmtMdShort(md: string): string {
  const { month, day } = splitMd(md);
  return month ? `${MONTHS[month - 1].slice(0, 3)} ${day}` : '';
}

// Validate and normalize anything into ImportantDates.
export function parseDates(v: unknown): ImportantDates {
  if (!v || typeof v !== 'object') return { ...EMPTY_DATES, children: [] };
  const o = v as Record<string, unknown>;
  const kids = Array.isArray(o.children) ? o.children : [];
  const children = kids
    .map((k) => {
      const r = (k && typeof k === 'object' ? k : {}) as Record<string, unknown>;
      return { name: typeof r.name === 'string' ? r.name.trim().slice(0, 30) : '', md: parseMd(r.md) };
    })
    .filter((k) => k.name || k.md)
    .slice(0, MAX_CHILDREN);
  return { self: parseMd(o.self), anniversary: parseMd(o.anniversary), partner: parseMd(o.partner), children };
}

export type LabeledDate = { label: string; md: string };
const possessive = (name: string) => `${name}'s`;
// The dates the person gave, with plain labels ("Your birthday", "Maya's birthday").
export function listDates(d: ImportantDates): LabeledDate[] {
  const out: LabeledDate[] = [];
  if (d.self) out.push({ label: 'Your birthday', md: d.self });
  if (d.anniversary) out.push({ label: 'Your anniversary', md: d.anniversary });
  if (d.partner) out.push({ label: "Your partner's birthday", md: d.partner });
  for (const c of d.children) if (c.md) out.push({ label: c.name ? `${possessive(c.name)} birthday` : "A child's birthday", md: c.md });
  return out;
}
export const hasDates = (d: ImportantDates) => listDates(d).length > 0;

const MS_DAY = 86400000;
const isoMs = (iso: string) => Date.parse(iso + 'T00:00:00Z');
export const addDaysIso = (iso: string, n: number) => new Date(isoMs(iso) + n * MS_DAY).toISOString().slice(0, 10);
const isLeap = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;

// The calendar days a month-day falls on in one year. Feb 29 in a common year is observed on Feb 28 or Mar 1, so both count.
function occurrences(md: string, year: number): string[] {
  const { month, day } = splitMd(md);
  if (month === 2 && day === 29 && !isLeap(year)) return [`${year}-02-28`, `${year}-03-01`];
  return [`${year}-${md}`];
}
// Does any occurrence of the month-day fall within [from, to] (inclusive ISO dates)? Handles windows that cross a year boundary.
export function inWindow(md: string, from: string, to: string): boolean {
  if (!md || !from || !to || to < from) return false;
  const y0 = Number(from.slice(0, 4)), y1 = Number(to.slice(0, 4));
  for (let y = y0; y <= y1; y++) for (const iso of occurrences(md, y)) if (iso >= from && iso <= to) return true;
  return false;
}

export type Flex = 'exact' | 'pm3' | 'month';
export type WindowRules = { flexibility: Flex; earliest: string; month: string; nights: number };
// Every day the trip could cover (union over the allowed departure days) and every day it is sure to cover (intersection).
export function tripWindows(r: WindowRules): { any: [string, string]; sure: [string, string] } | null {
  let lo: string, hi: string;
  if (r.flexibility === 'month') {
    if (!/^\d{4}-\d{2}$/.test(r.month)) return null;
    lo = `${r.month}-01`;
    const y = Number(r.month.slice(0, 4)), m = Number(r.month.slice(5, 7));
    hi = new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10); // last day of the month
  } else {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(r.earliest)) return null;
    const s = r.flexibility === 'pm3' ? 3 : 0;
    lo = addDaysIso(r.earliest, -s);
    hi = addDaysIso(r.earliest, s);
  }
  return { any: [lo, addDaysIso(hi, r.nights)], sure: [hi, addDaysIso(lo, r.nights)] };
}

export type DateMatch = LabeledDate & { certain: boolean };
// Dates that matter that land inside the chosen trip window. certain is false when only some of the allowed departure days reach it.
export function matchWindow(d: ImportantDates, r: WindowRules): DateMatch[] {
  const w = tripWindows(r);
  if (!w) return [];
  const out: DateMatch[] = [];
  for (const x of listDates(d)) {
    if (inWindow(x.md, w.sure[0], w.sure[1])) out.push({ ...x, certain: true });
    else if (inWindow(x.md, w.any[0], w.any[1])) out.push({ ...x, certain: false });
  }
  return out;
}
// Dates inside one concrete trip (the sealed start and end).
export function matchTrip(d: ImportantDates, start: string, end: string): LabeledDate[] {
  return listDates(d).filter((x) => inWindow(x.md, start, end));
}
export const matchSentence = (m: LabeledDate, certain = true) => `${m.label} (${fmtMd(m.md)}) ${certain ? 'falls during this trip' : 'may fall during this trip'}.`;
// Payload text: labels and month-day only, no years.
export const matchesForPayload = (ms: LabeledDate[]) => ms.map((m) => `${m.label} (${m.md})`).join('; ');
