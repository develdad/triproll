// All lead capture goes through submitLead. Today it posts to Netlify Forms (a urlencoded POST to "/").
// To move to another backend (for example Supabase), replace the body of submitLead only; callers do not change.
import type { FormName } from './forms.ts';

export type LeadValue = string | number | boolean | string[] | null | undefined;
export type LeadResult = { ok: true } | { ok: false; error: string };

const flat = (v: LeadValue): string => (Array.isArray(v) ? v.join(', ') : v === null || v === undefined ? '' : String(v));

export async function submitLead(formName: FormName, fields: Record<string, LeadValue>): Promise<LeadResult> {
  const body = new URLSearchParams();
  body.set('form-name', formName);
  body.set('bot-field', '');
  for (const [k, v] of Object.entries(fields)) body.set(k, flat(v));
  try {
    const res = await fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
    if (!res.ok) return { ok: false, error: `Submission failed (${res.status})` };
    return { ok: true };
  } catch {
    return { ok: false, error: 'Network error' };
  }
}
