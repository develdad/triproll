import { useEffect, useMemo, useRef, useState, type SyntheticEvent } from 'react';
import { AIRPORTS, RESTRICTED_STATES, US_STATES, VETOES, ui } from '../../data/roll.ts';
import { MIN_LEAD_DAYS, fmt, minBudgetPP, rollTrip, type Flexibility, type Passport, type Trip, type Veto } from '../../lib/dna.ts';
import { BUDGET_MAX } from '../../lib/pricing.config.ts';
import { moodFor, type Mood } from '../../data/photos.ts';
import { loadDna, loadParams, saveParams, type StoredDna, type StoredParams } from '../../lib/storage.ts';
import { emitGlobe } from '../../lib/globeBus.ts';
import { submitLead } from '../../lib/leads.ts';
import ItineraryCard, { makeRef, type MoodImage } from './ItineraryCard.tsx';
import Timeline from './Timeline.tsx';

type Phase = 'params' | 'rolling' | 'result' | 'request' | 'sent';
const MAX_REROLLS = 3;
const ROLL_MS = 1600;

const isoToday = () => new Date().toISOString().slice(0, 10);
const addDays = (iso: string, n: number) => new Date(Date.parse(iso + 'T00:00:00Z') + n * 86400000).toISOString().slice(0, 10);
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, Number.isFinite(n) ? n : lo));

function monthOptions(): { value: string; label: string }[] {
  const out: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 13; i++) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + i, 1));
    out.push({ value: d.toISOString().slice(0, 7), label: d.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }) });
  }
  return out;
}

const DEFAULTS: StoredParams = {
  airport: '', party: 2, budget: 1500, nights: 5, flexibility: 'exact', earliest: '', month: '',
  passport: 'valid', vetoes: [], reveal: 'surprise',
};

export default function Roll({ moods }: { moods: Record<Mood, MoodImage> }) {
  const [params, setParams] = useState<StoredParams>(DEFAULTS);
  const [dna, setDna] = useState<StoredDna | null>(null);
  const [months, setMonths] = useState<{ value: string; label: string }[]>([]);
  const [today, setToday] = useState('');
  const [phase, setPhase] = useState<Phase>('params');
  const [rolls, setRolls] = useState<Trip[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');
  const [announce, setAnnounce] = useState('');
  const [ref, setRef] = useState('TR-......');
  const [hydrated, setHydrated] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const stepHead = useRef<HTMLHeadingElement>(null);

  // request form
  const [form, setForm] = useState({ name: '', email: '', state: '', dietary: '', notes: '', trap: '' });
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [sentKind, setSentKind] = useState<'trip' | 'waitlist'>('trip');

  const rerollsUsed = Math.max(0, rolls.length - 1);
  const trip = rolls[rolls.length - 1];
  const restricted = (RESTRICTED_STATES as readonly string[]).includes(form.state);
  const floor = useMemo(() => minBudgetPP(params.nights, params.party, params.passport), [params.nights, params.party, params.passport]);
  const belowFloor = hydrated && params.budget < floor;
  const minDate = useMemo(() => (today ? addDays(today, MIN_LEAD_DAYS) : ''), [today]);

  useEffect(() => {
    const t = isoToday();
    setToday(t);
    setMonths(monthOptions());
    const saved = loadParams() ?? {};
    const d = loadDna();
    setDna(d);
    const earliestDefault = addDays(t, 30);
    const merged: StoredParams = { ...DEFAULTS, ...saved } as StoredParams;
    if (!merged.earliest || merged.earliest < addDays(t, MIN_LEAD_DAYS)) merged.earliest = earliestDefault;
    if (!saved.passport && d) merged.passport = d.passport;
    if (!merged.month) merged.month = monthOptions()[1].value;
    setParams(merged);
    setHydrated(true);
    return () => clearTimeout(timer.current);
  }, []);
  useEffect(() => { if (hydrated) saveParams(params); }, [params, hydrated]);
  useEffect(() => { if (phase !== 'params') stepHead.current?.focus(); }, [phase]);

  const set = <K extends keyof StoredParams>(k: K, v: StoredParams[K]) => setParams((p) => ({ ...p, [k]: v }));
  const toggleVeto = (v: Veto) => set('vetoes', params.vetoes.includes(v) ? params.vetoes.filter((x) => x !== v) : [...params.vetoes, v]);

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (params.airport.trim().length < 3) e.airport = 'Enter your departure airport, for example PHX.';
    if (params.budget < floor) e.budget = ui.belowFloor(fmt(floor));
    if (params.flexibility === 'month') { if (!params.month) e.date = 'Choose a month.'; }
    else if (!params.earliest || params.earliest < minDate) e.date = `Choose a date at least ${MIN_LEAD_DAYS} days from today.`;
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function runRoll(exclude: string[], fresh: boolean) {
    const res = rollTrip({
      dna: dna?.dna ?? null, passport: params.passport, party: params.party, budgetPP: params.budget, nights: params.nights,
      flexibility: params.flexibility, earliest: params.earliest, month: params.month, vetoes: params.vetoes, exclude,
    });
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const wait = reduced ? 0 : ROLL_MS;
    setMessage('');
    if (!res.ok) {
      const msg = res.reason === 'below-floor' ? ui.belowFloor(fmt(res.minBudget ?? floor)) : res.reason === 'exhausted' ? ui.exhausted : ui.noMatch;
      if (fresh) { setPhase('params'); setMessage(msg); } else setMessage(msg);
      emitGlobe({ mode: 'idle' });
      return;
    }
    setPhase('rolling');
    setAnnounce(ui.rolling);
    if (window.matchMedia('(max-width: 61.99rem)').matches) document.querySelector('.roll-side')?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
    emitGlobe({ mode: 'spin' });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const t = res.trip;
      setRolls((r) => (fresh ? [t] : [...r, t]));
      setRef(makeRef());
      const show = params.reveal === 'now';
      setRevealed(show);
      setPhase('result');
      setAnnounce(show ? `Trip rolled. Destination: ${t.dest.name}, ${t.dest.country}.` : 'Trip rolled. Destination sealed.');
      if (show) emitGlobe({ mode: 'focus', lat: t.dest.lat, lng: t.dest.lng, label: `${t.dest.name}, ${t.dest.country}` });
      else emitGlobe({ mode: 'idle' });
    }, wait);
  }

  function onRoll(e: SyntheticEvent) {
    e.preventDefault();
    if (!validate()) return;
    setRolls([]);
    runRoll([], true);
  }
  function onReroll() {
    if (rerollsUsed >= MAX_REROLLS) return;
    runRoll(rolls.map((r) => r.dest.id), false);
  }
  function onReveal() {
    if (!trip) return;
    setRevealed(true);
    setAnnounce(`Destination revealed: ${trip.dest.name}, ${trip.dest.country}.`);
    if (window.matchMedia('(max-width: 61.99rem)').matches) document.querySelector('.roll-side')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
    emitGlobe({ mode: 'focus', lat: trip.dest.lat, lng: trip.dest.lng, label: `${trip.dest.name}, ${trip.dest.country}` });
  }
  function editRules() {
    setPhase('params');
    setRolls([]);
    setRevealed(false);
    setMessage('');
    emitGlobe({ mode: 'idle' });
  }

  async function onSubmit(e: SyntheticEvent) {
    e.preventDefault();
    setSendError('');
    if (!form.name.trim() || !/^\S+@\S+\.\S+$/.test(form.email) || !form.state) {
      setSendError('Add your name, a valid email and your state.');
      return;
    }
    setSending(true);
    let r;
    if (restricted) {
      r = await submitLead('waitlist', {
        name: form.name, email: form.email, state: form.state, source: 'roll:restricted-state', archetype: dna?.archetype ?? '',
        note: `Rolled: ${params.party} traveler(s), ${params.nights} nights, budget ${params.budget} per person. ${form.notes}`.trim(),
        'bot-field': form.trap,
      });
      if (r.ok) setSentKind('waitlist');
    } else {
      r = await submitLead('trip-request', {
        name: form.name, email: form.email, state: form.state, notes: form.notes, dietary: form.dietary,
        departure_airport: params.airport, travelers: params.party, budget_per_person: params.budget, nights: params.nights,
        flexibility: params.flexibility, earliest_departure: params.flexibility === 'month' ? '' : params.earliest,
        month: params.flexibility === 'month' ? params.month : '', passport: params.passport, vetoes: params.vetoes,
        reveal_preference: params.reveal === 'now' ? 'show me now' : 'surprise me until departure day', revealed_in_app: revealed ? 'yes' : 'no',
        destination_id: trip.dest.id, trip_start: trip.start, trip_end: trip.end, estimated_total: trip.price.total,
        estimated_per_person: trip.price.perPerson, rerolls_used: rerollsUsed, archetype: dna?.archetype ?? '', 'bot-field': form.trap,
      });
      if (r.ok) setSentKind('trip');
    }
    setSending(false);
    if (r.ok) { setPhase('sent'); emitGlobe({ mode: 'idle' }); } else setSendError(ui.submitError);
  }

  const stepIndex = phase === 'params' ? 0 : phase === 'rolling' || phase === 'result' ? 1 : 2;

  return (
    <div>
      <ol className="stepper" aria-label="Progress">
        {ui.steps.map((s, i) => (
          <li key={s} aria-current={i === stepIndex ? 'step' : undefined}><b>{String.fromCharCode(65 + i)}</b>{s}</li>
        ))}
      </ol>
      <div className="sr-only" role="status" aria-live="polite">{announce}</div>

      {phase === 'params' && (
        <form onSubmit={onRoll} noValidate>
          <h2 className="panel-title">{ui.paramsTitle}</h2>
          <p style={{ marginBottom: '1.5rem' }}>{ui.paramsIntro}</p>

          <div className="field">
            <label htmlFor="airport">Departure airport</label>
            <input id="airport" name="airport" type="text" list="airports" autoComplete="off" placeholder="PHX or Phoenix" value={params.airport} onChange={(e) => set('airport', e.target.value)} aria-invalid={!!errors.airport} aria-describedby={errors.airport ? 'err-airport' : undefined} />
            <datalist id="airports">{AIRPORTS.map((a) => <option key={a} value={a} />)}</datalist>
            {errors.airport && <p className="error" id="err-airport">{errors.airport}</p>}
          </div>

          <div className="grid2">
            <div className="field">
              <label htmlFor="party">Travelers <span className="hint">1 to 8</span></label>
              <input id="party" type="number" inputMode="numeric" min={1} max={8} value={params.party} onChange={(e) => set('party', clamp(Math.round(Number(e.target.value)), 1, 8))} />
            </div>
            <div className="field">
              <label htmlFor="nights">Nights <span className="hint">2 to 10</span></label>
              <input id="nights" type="number" inputMode="numeric" min={2} max={10} value={params.nights} onChange={(e) => set('nights', clamp(Math.round(Number(e.target.value)), 2, 10))} />
            </div>
          </div>

          <div className="field">
            <label htmlFor="budget">Budget per person <span className="hint">USD, one package price for the whole trip</span></label>
            <div className="range-row">
              <input id="budget" type="range" min={floor} max={BUDGET_MAX} step={10} value={Math.min(BUDGET_MAX, Math.max(floor, params.budget))} onChange={(e) => set('budget', Number(e.target.value))} aria-valuetext={`$${params.budget}`} />
              <input id="budget-n" aria-label="Budget per person in dollars" type="number" inputMode="numeric" min={floor} max={BUDGET_MAX} step={10} value={params.budget || ''} onChange={(e) => set('budget', clamp(Math.round(Number(e.target.value)), 0, BUDGET_MAX))} aria-invalid={belowFloor || !!errors.budget} aria-describedby="budget-note" />
            </div>
            <p className={belowFloor ? 'error' : 'hint'} id="budget-note" role={belowFloor ? 'alert' : undefined}>
              {belowFloor ? ui.belowFloor(fmt(floor)) : `Minimum for ${params.nights} nights and ${params.party} ${params.party === 1 ? 'traveler' : 'travelers'}: ${fmt(floor)} per person.`}
            </p>
          </div>

          <fieldset>
            <legend>Dates</legend>
            <div className="seg cols3" style={{ marginBottom: '0.75rem' }}>
              {([['exact', 'Exact date'], ['pm3', 'Plus or minus 3 days'], ['month', 'Anytime in a month']] as [Flexibility, string][]).map(([v, l]) => (
                <label className="opt" key={v}><input type="radio" name="flex" checked={params.flexibility === v} onChange={() => set('flexibility', v)} /><span>{l}</span></label>
              ))}
            </div>
            {params.flexibility === 'month' ? (
              <div className="field">
                <label htmlFor="month">Month</label>
                <select id="month" value={params.month} onChange={(e) => set('month', e.target.value)}>
                  {months.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
            ) : (
              <div className="field">
                <label htmlFor="earliest">{params.flexibility === 'exact' ? 'Departure date' : 'Departure date, give or take 3 days'}</label>
                <input id="earliest" type="date" min={minDate || undefined} value={params.earliest} onChange={(e) => set('earliest', e.target.value)} />
                <span className="hint">At least {MIN_LEAD_DAYS} days from today, so a person has time to price it.</span>
              </div>
            )}
            {errors.date && <p className="error">{errors.date}</p>}
          </fieldset>

          <fieldset>
            <legend>Passport</legend>
            <div className="seg cols2">
              {([['valid', 'Valid passport'], ['none', 'None, or expired']] as [Passport, string][]).map(([v, l]) => (
                <label className="opt" key={v}><input type="radio" name="passport" checked={params.passport === v} onChange={() => set('passport', v)} /><span>{l}</span></label>
              ))}
            </div>
            {params.passport === 'none' && <p className="hint" style={{ marginTop: '0.5rem' }}>Domestic destinations only.</p>}
          </fieldset>

          <fieldset>
            <legend>Vetoes <span className="hint">optional, hard rules</span></legend>
            <div className="chips">
              {VETOES.map((v) => (
                <label className="chip" key={v.id}><input type="checkbox" checked={params.vetoes.includes(v.id)} onChange={() => toggleVeto(v.id)} /><span>{v.label}</span></label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend>Reveal</legend>
            <div className="seg cols2">
              {([['surprise', 'Surprise me until departure day'], ['now', 'Show me now']] as ['surprise' | 'now', string][]).map(([v, l]) => (
                <label className="opt" key={v}><input type="radio" name="reveal" checked={params.reveal === v} onChange={() => set('reveal', v)} /><span>{l}</span></label>
              ))}
            </div>
          </fieldset>

          {message && <p className="notice warn" role="alert">{message}</p>}
          {!dna && <p className="hint">No Travel DNA yet. <a href="/travel-dna">Take the quiz</a> to tilt rolls toward your taste, or roll without it.</p>}
          <div className="controls"><button type="submit" className="btn">{ui.rollButton}</button></div>
        </form>
      )}

      {phase === 'rolling' && (
        <div>
          <h2 className="panel-title" ref={stepHead} tabIndex={-1} style={{ outline: 'none' }}>Rolling</h2>
          <p>{ui.rolling}</p>
          <div className="rolling-bar" aria-hidden="true"><i /></div>
        </div>
      )}

      {(phase === 'result' || phase === 'request') && trip && (
        <div>
          <h2 className="panel-title" ref={stepHead} tabIndex={-1} style={{ outline: 'none' }}>{phase === 'result' ? 'Your roll' : 'Request this trip'}</h2>
          <ItineraryCard trip={trip} airport={params.airport} revealed={revealed} dna={dna?.dna ?? null} mood={moods[moodFor(trip.dest)]} refCode={ref} />
          <p className="fine">{ui.estimateNote}</p>
          {message && <p className="notice warn" role="alert" style={{ marginTop: '1rem' }}>{message}</p>}

          {phase === 'result' && (
            <>
              <div className="controls">
                <button type="button" className="btn" onClick={() => { setPhase('request'); setMessage(''); }}>Request this trip</button>
                <button type="button" className="btn ghost" onClick={onReroll} disabled={rerollsUsed >= MAX_REROLLS}>Reroll ({MAX_REROLLS - rerollsUsed} left)</button>
                <button type="button" className="btn ghost" onClick={onReveal} disabled={revealed}>{revealed ? 'Revealed' : 'Reveal destination'}</button>
                <button type="button" className="linkish" onClick={editRules}>Edit rules</button>
              </div>
              {!revealed && <p className="hint" style={{ marginTop: '0.75rem' }}>{ui.revealNote}</p>}
              {rerollsUsed >= MAX_REROLLS && <p className="notice" style={{ marginTop: '1rem' }}>{ui.rerollLimit}</p>}
            </>
          )}

          {phase === 'request' && (
            <form onSubmit={onSubmit} className="request-form" noValidate>
              <h3 className="form-title">Send your request</h3>
              <Timeline active={0} />
              <div className="grid2">
                <div className="field"><label htmlFor="r-name">Name</label><input id="r-name" type="text" autoComplete="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div className="field"><label htmlFor="r-email">Email</label><input id="r-email" type="email" autoComplete="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              </div>
              <div className="field">
                <label htmlFor="r-state">State of residence</label>
                <select id="r-state" required value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })}>
                  <option value="">Choose a state</option>
                  {US_STATES.map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
                </select>
              </div>
              {restricted && <p className="notice warn" role="status">{ui.restrictedNote}</p>}
              {!restricted && (
                <div className="field"><label htmlFor="r-diet">Dietary needs <span className="hint">optional</span></label><input id="r-diet" type="text" value={form.dietary} onChange={(e) => setForm({ ...form, dietary: e.target.value })} /></div>
              )}
              <div className="field"><label htmlFor="r-notes">Notes <span className="hint">optional</span></label><textarea id="r-notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
              <input className="hp" tabIndex={-1} autoComplete="off" aria-hidden="true" name="bot-field" value={form.trap} onChange={(e) => setForm({ ...form, trap: e.target.value })} />
              {sendError && <p className="error" role="alert">{sendError}</p>}
              <div className="controls">
                <button type="submit" className="btn" disabled={sending}>{sending ? 'Sending' : restricted ? 'Join the waitlist' : 'Send trip request'}</button>
                <button type="button" className="btn ghost" onClick={() => setPhase('result')}>Back to roll</button>
              </div>
              {!restricted && <p className="hint" style={{ marginTop: '0.75rem' }}>{ui.requestNote}</p>}
            </form>
          )}
        </div>
      )}

      {phase === 'sent' && (
        <div>
          <h2 className="panel-title" ref={stepHead} tabIndex={-1} style={{ outline: 'none' }}>{sentKind === 'trip' ? 'Request received' : 'You are on the waitlist'}</h2>
          <p className="lead">{sentKind === 'trip' ? ui.successTrip : ui.successWaitlist}</p>
          {sentKind === 'trip' && <Timeline active={1} />}
          <div className="controls"><button type="button" className="btn ghost" onClick={editRules}>Roll another trip</button></div>
        </div>
      )}
    </div>
  );
}
