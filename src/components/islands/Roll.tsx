import { useEffect, useMemo, useRef, useState, type SyntheticEvent } from 'react';
import { AIRPORTS, CABINS, DELIVERY_OPTIONS, ENTRY_RULE, RESTRICTED_STATES, TRIP_REASON_MAX, TRIP_TYPES, US_STATES, VETOES, ui } from '../../data/roll.ts';
import { matchSentence, matchTrip, matchWindow } from '../../lib/dates.ts';
import { MIN_LEAD_DAYS, fmt, fmtDate, minBudgetPP, type Cabin, type Citizenship, type Flexibility, type Passport, type Veto } from '../../lib/dna.ts';
import { BUDGET_MAX } from '../../lib/pricing.config.ts';
import { pay } from '../../data/payment.ts';
import type { Mood } from '../../data/photos.ts';
import { loadParams, loadProfile, saveParams, type StoredProfile } from '../../lib/storage.ts';
import { archetypeOf, serializeProfile } from '../../lib/profile.ts';
import { buildRequestPayload, moodForRules, overCap as isOverCap, sealRules, type Delivery, type Rules, type Sealed } from '../../lib/request.ts';
import { submitLead } from '../../lib/leads.ts';
import ItineraryCard, { makeRef, type MoodImage } from './ItineraryCard.tsx';
import Timeline from './Timeline.tsx';
import Globe from './Globe.tsx';
import OrbitOverlay from './OrbitOverlay.tsx';

type WaitlistWhy = 'other' | 'cap';
type Phase = 'params' | 'stage' | 'result' | 'request' | 'sent' | 'waitlist';
export const STAGE_MS = 2100;

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

const DEFAULTS: Rules = {
  airport: '', party: 2, budget: 1500, nights: 5, flexibility: 'exact', earliest: '', month: '',
  citizenship: 'us', passport: 'valid', passportSixMonths: false, vetoes: [], cabin: 'economy', delivery: 'sealed', revealDate: '', tripType: '', tripReason: '',
};
type Poster = { src: string; width: number; height: number };

export default function Roll({ moods, poster }: { moods: Record<Mood, MoodImage>; poster: Poster }) {
  const [params, setParams] = useState<Rules>(DEFAULTS);
  const [profile, setProfile] = useState<StoredProfile | null>(null);
  const [months, setMonths] = useState<{ value: string; label: string }[]>([]);
  const [today, setToday] = useState('');
  const [phase, setPhase] = useState<Phase>('params');
  const [sealed, setSealed] = useState<Sealed | null>(null);
  const [mood, setMood] = useState<Mood>('wing');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');
  const [announce, setAnnounce] = useState('');
  const [ref, setRef] = useState('TR-......');
  const [hydrated, setHydrated] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const stepHead = useRef<HTMLHeadingElement>(null);

  const [form, setForm] = useState({ name: '', email: '', state: '', notes: '', trap: '' });
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [waitWhy, setWaitWhy] = useState<WaitlistWhy>('other');
  const [sentKind, setSentKind] = useState<'trip' | 'waitlist'>('trip');

  const restricted = (RESTRICTED_STATES as readonly string[]).includes(form.state);
  const floor = useMemo(() => Math.min(BUDGET_MAX, minBudgetPP(params.nights, params.party, params.passport, params.vetoes, params.cabin)), [params.nights, params.party, params.passport, params.vetoes, params.cabin]);
  const overCap = hydrated && params.citizenship === 'us' && isOverCap(params.budget, params.party);
  const belowFloor = hydrated && params.citizenship === 'us' && params.budget < floor;
  const minDate = useMemo(() => (today ? addDays(today, MIN_LEAD_DAYS) : ''), [today]);
  const arch = profile ? archetypeOf(profile) : null;
  // Dates that matter vs the trip window (rules form) and vs the sealed dates (card). One checkbox covers both.
  const [planForDates, setPlanForDates] = useState(true);
  const windowMatches = useMemo(
    () => (profile && hydrated ? matchWindow(profile.dates, { flexibility: params.flexibility, earliest: params.earliest, month: params.month, nights: params.nights }) : []),
    [profile, hydrated, params.flexibility, params.earliest, params.month, params.nights],
  );
  const cardMatches = useMemo(() => (profile && sealed ? matchTrip(profile.dates, sealed.start, sealed.end) : []), [profile, sealed]);

  useEffect(() => {
    const t = isoToday();
    setToday(t);
    setMonths(monthOptions());
    const saved = loadParams() ?? {};
    setProfile(loadProfile());
    const merged = { ...DEFAULTS, ...saved } as Rules;
    if (!merged.earliest || merged.earliest < addDays(t, MIN_LEAD_DAYS)) merged.earliest = addDays(t, 30);
    if (!merged.month) merged.month = monthOptions()[1].value;
    merged.passportSixMonths = false; // always re-confirm
    merged.delivery = merged.delivery === 'date' ? 'date' : 'sealed';
    merged.cabin = (['economy', 'premium', 'business'] as const).includes(merged.cabin as Cabin) ? merged.cabin : 'economy';
    merged.revealDate = typeof merged.revealDate === 'string' ? merged.revealDate : '';
    merged.tripType = (TRIP_TYPES as readonly string[]).includes(merged.tripType) ? merged.tripType : '';
    merged.tripReason = typeof merged.tripReason === 'string' ? merged.tripReason.slice(0, TRIP_REASON_MAX) : '';
    setParams(merged);
    setHydrated(true);
    return () => clearTimeout(timer.current);
  }, []);
  useEffect(() => { if (hydrated) saveParams(params); }, [params, hydrated]);
  const firstPhase = useRef(true);
  useEffect(() => {
    if (firstPhase.current) { firstPhase.current = false; return; }
    // Bring the new step into view: the page shortens when the form is replaced, so the old scroll position would land past it.
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.querySelector('.stepper')?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    if (phase !== 'params' && phase !== 'stage') stepHead.current?.focus({ preventScroll: true });
  }, [phase]);

  const set = <K extends keyof Rules>(k: K, v: Rules[K]) => setParams((p) => ({ ...p, [k]: v }));
  const toggleVeto = (v: Veto) => set('vetoes', params.vetoes.includes(v) ? params.vetoes.filter((x) => x !== v) : [...params.vetoes, v]);

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (params.airport.trim().length < 3) e.airport = 'Enter your departure airport, for example PHX.';
    if (params.citizenship === 'us') {
      if (params.budget < floor) e.budget = ui.belowFloor(fmt(floor));
      if (params.passport === 'valid' && !params.passportSixMonths) e.passport = 'Confirm your passport is valid for six months after your return date.';
    }
    if (params.flexibility === 'month') { if (!params.month) e.date = 'Choose a month.'; }
    else if (!params.earliest || params.earliest < minDate) e.date = `Choose a date at least ${MIN_LEAD_DAYS} days from today.`;
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function onSeal(e: SyntheticEvent) {
    e.preventDefault();
    setMessage('');
    if (!validate()) return;
    if (params.citizenship === 'us' && isOverCap(params.budget, params.party)) { setMessage(ui.overCap); return; }
    if (params.citizenship === 'other') { setWaitWhy('other'); setPhase('waitlist'); return; }
    const res = sealRules(params);
    if (!res.ok) { setMessage(res.reason === 'too-few' ? ui.tooFew : ui.belowFloor(fmt(res.minBudget ?? floor))); return; }
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setSealed(res.sealed);
    setMood(moodForRules(params.vetoes, res.sealed.start));
    setRef(makeRef());
    setAnnounce(ui.sealing);
    if (reduced) { setPhase('result'); setAnnounce('Rules sealed. Your card is ready.'); return; }
    setPhase('stage');
    clearTimeout(timer.current);
    timer.current = setTimeout(() => { setPhase('result'); setAnnounce('Rules sealed. Your card is ready.'); }, STAGE_MS);
  }
  function editRules() {
    clearTimeout(timer.current);
    setPhase('params');
    setSealed(null);
    setMessage('');
  }

  const dnaForm = profile ? { archetype: profile.archetype, profileJson: serializeProfile(profile) } : null;

  async function onSubmit(e: SyntheticEvent) {
    e.preventDefault();
    setSendError('');
    if (!sealed) return;
    if (!form.name.trim() || !/^\S+@\S+\.\S+$/.test(form.email) || !form.state) { setSendError('Add your name, a valid email and your state.'); return; }
    if (!restricted && params.delivery === 'date') {
      const last = sealed.start ? addDays(sealed.start, -1) : '';
      if (!params.revealDate || params.revealDate <= today || params.revealDate > last) { setSendError(`Pick a reveal date between tomorrow and ${fmtDate(last)}, before you leave.`); return; }
    }
    setSending(true);
    let r;
    if (restricted) {
      r = await submitLead('waitlist', {
        name: form.name, email: form.email, state: form.state, source: 'roll:restricted-state', citizenship: 'US passport',
        archetype: dnaForm?.archetype ?? '', dna_profile: dnaForm?.profileJson ?? '',
        note: `${params.party} traveler(s), ${params.nights} nights, budget ${params.budget} per person. ${form.notes}`.trim(), 'bot-field': form.trap,
      });
      if (r.ok) setSentKind('waitlist');
    } else {
      r = await submitLead('trip-request', { ...buildRequestPayload(params, sealed, { name: form.name, email: form.email, state: form.state, notes: form.notes }, dnaForm, { matches: cardMatches, plan: planForDates }), 'bot-field': form.trap });
      if (r.ok) setSentKind('trip');
    }
    setSending(false);
    if (r.ok) setPhase('sent'); else setSendError(ui.submitError);
  }
  async function onWaitlistOther(e: SyntheticEvent) {
    e.preventDefault();
    setSendError('');
    if (!/^\S+@\S+\.\S+$/.test(form.email)) { setSendError('Add a valid email.'); return; }
    setSending(true);
    const r = await submitLead('waitlist', {
      name: form.name, email: form.email, state: form.state, source: waitWhy === 'cap' ? 'roll:over-cap' : 'roll:non-us-passport', citizenship: waitWhy === 'cap' ? 'US passport' : 'Other',
      archetype: dnaForm?.archetype ?? '', dna_profile: dnaForm?.profileJson ?? '', note: form.notes, 'bot-field': form.trap,
    });
    setSending(false);
    if (r.ok) { setSentKind('waitlist'); setPhase('sent'); } else setSendError(ui.submitError);
  }

  const stepIndex = phase === 'params' || phase === 'waitlist' ? 0 : phase === 'stage' || phase === 'result' ? 1 : 2;
  const inFlow = (phase === 'stage' || phase === 'result' || phase === 'request') && sealed;
  const globeMode = phase === 'stage' ? 'whip' : 'idle';

  return (
    <div>
      <ol className="stepper" aria-label="Progress">
        {ui.steps.map((s, i) => (
          <li key={s} aria-current={i === stepIndex ? 'step' : undefined}><b>{String.fromCharCode(65 + i)}</b>{s}</li>
        ))}
      </ol>
      <div className="sr-only" role="status" aria-live="polite">{announce}</div>

      {phase === 'params' && (
        <form onSubmit={onSeal} noValidate>
          <h2 className="panel-title">{ui.paramsTitle}</h2>
          <p style={{ marginBottom: '0.5rem' }}>{ui.paramsIntro}</p>
          <p className="hint" style={{ marginBottom: '1.5rem' }}>{ENTRY_RULE}</p>

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
            <label htmlFor="budget">Budget per person <span className="hint">USD. This is your package price.</span></label>
            <div className="range-row">
              <input id="budget" type="range" min={floor} max={BUDGET_MAX} step={10} value={Math.min(BUDGET_MAX, Math.max(floor, params.budget))} onChange={(e) => set('budget', Number(e.target.value))} aria-valuetext={`$${params.budget}`} />
              <input id="budget-n" aria-label="Budget per person in dollars" type="number" inputMode="numeric" min={floor} max={BUDGET_MAX} step={10} value={params.budget || ''} onChange={(e) => set('budget', clamp(Math.round(Number(e.target.value)), 0, BUDGET_MAX))} aria-invalid={belowFloor || !!errors.budget} aria-describedby="budget-note" />
            </div>
            <p className={belowFloor ? 'error' : 'hint'} id="budget-note" role={belowFloor ? 'alert' : undefined}>
              {belowFloor ? ui.belowFloor(fmt(floor)) : `Minimum for ${params.nights} nights and ${params.party} ${params.party === 1 ? 'traveler' : 'travelers'}: ${fmt(floor)} per person.`}
            </p>
          </div>

          {params.citizenship === 'us' && (
            <fieldset>
              <legend>Cabin</legend>
              <div className="seg cols3">
                {CABINS.map((c) => (
                  <label className="opt" key={c.id}><input type="radio" name="cabin" checked={params.cabin === c.id} onChange={() => set('cabin', c.id as Cabin)} /><span>{c.label}</span></label>
                ))}
              </div>
              <p className="hint" style={{ marginTop: '0.5rem' }}>Higher cabins raise the minimum budget.</p>
            </fieldset>
          )}

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
                <span className="hint">At least {MIN_LEAD_DAYS} days from today, so a person has time to build it.</span>
              </div>
            )}
            {errors.date && <p className="error">{errors.date}</p>}
            {windowMatches.length > 0 && (
              <div className="date-note" role="status">
                {windowMatches.map((m) => <p key={m.label + m.md}>{matchSentence(m, m.certain)} We will tell your planner.</p>)}
                <label className="check"><input type="checkbox" checked={planForDates} onChange={(e) => setPlanForDates(e.target.checked)} /><span>Plan something for it</span></label>
              </div>
            )}
          </fieldset>

          <fieldset>
            <legend>This trip <span className="hint">optional, separate from your Travel DNA</span></legend>
            <div className="chips" role="radiogroup" aria-label="Trip type">
              {TRIP_TYPES.map((t) => (
                <label className="chip" key={t}>
                  <input type="radio" name="trip_type" checked={params.tripType === t} onChange={() => set('tripType', t)} onClick={() => params.tripType === t && set('tripType', '')} />
                  <span>{t}</span>
                </label>
              ))}
            </div>
            <div className="field" style={{ marginTop: '0.9rem' }}>
              <label htmlFor="trip-reason">Anything this trip is for? <span className="hint">optional</span></label>
              <input id="trip-reason" name="trip_reason" type="text" maxLength={TRIP_REASON_MAX} autoComplete="off" placeholder="For example, our tenth anniversary" value={params.tripReason} onChange={(e) => set('tripReason', e.target.value)} />
            </div>
          </fieldset>

          <fieldset>
            <legend>Citizenship</legend>
            <div className="seg cols2">
              {([['us', 'US passport'], ['other', 'Other']] as [Citizenship, string][]).map(([v, l]) => (
                <label className="opt" key={v}><input type="radio" name="citizenship" checked={params.citizenship === v} onChange={() => set('citizenship', v)} /><span>{l}</span></label>
              ))}
            </div>
            {params.citizenship === 'other' && <p className="notice" role="status" style={{ marginTop: '0.75rem' }}>{ui.otherCitizen}</p>}
          </fieldset>

          {params.citizenship === 'us' && (
            <>
              <fieldset>
                <legend>Passport</legend>
                <div className="seg cols2">
                  {([['valid', 'Valid passport'], ['none', 'None, or expired']] as [Passport, string][]).map(([v, l]) => (
                    <label className="opt" key={v}><input type="radio" name="passport" checked={params.passport === v} onChange={() => set('passport', v)} /><span>{l}</span></label>
                  ))}
                </div>
                {params.passport === 'none' && <p className="hint" style={{ marginTop: '0.5rem' }}>Domestic places only.</p>}
                {params.passport === 'valid' && (
                  <label className="check" style={{ marginTop: '0.75rem' }}>
                    <input type="checkbox" checked={params.passportSixMonths} onChange={(e) => set('passportSixMonths', e.target.checked)} aria-describedby={errors.passport ? 'err-passport' : undefined} aria-invalid={!!errors.passport} />
                    <span>{ui.passportLabel}</span>
                  </label>
                )}
                {errors.passport && <p className="error" id="err-passport">{errors.passport}</p>}
              </fieldset>

              <fieldset>
                <legend>Vetoes <span className="hint">optional, hard rules</span></legend>
                <div className="chips">
                  {VETOES.map((v) => (
                    <label className="chip" key={v.id}><input type="checkbox" checked={params.vetoes.includes(v.id)} onChange={() => toggleVeto(v.id)} /><span>{v.label}</span></label>
                  ))}
                </div>
              </fieldset>
            </>
          )}

          {(message || overCap) && (
            <p className="notice warn" role="alert">
              {message || ui.overCap}
              {(message === ui.overCap || (!message && overCap)) && <> <button type="button" className="linklike" onClick={() => { setWaitWhy('cap'); setPhase('waitlist'); }}>Join the waitlist</button></>}
            </p>
          )}
          {!profile && <p className="hint">No Travel DNA yet. <a href="/travel-dna">Take the assessment</a> so your planner knows how you like to travel.</p>}
          <div className="controls"><button type="submit" className="btn">{params.citizenship === 'other' ? 'Join the waitlist' : ui.sealButton}</button></div>
        </form>
      )}

      {phase === 'waitlist' && (
        <form onSubmit={onWaitlistOther} noValidate>
          <h2 className="panel-title" ref={stepHead} tabIndex={-1} style={{ outline: 'none' }}>Join the waitlist</h2>
          <p className="lead">{waitWhy === 'cap' ? ui.overCap : ui.otherCitizen}</p>
          <div className="grid2" style={{ marginTop: '1.25rem' }}>
            <div className="field"><label htmlFor="w-name">Name <span className="hint">optional</span></label><input id="w-name" type="text" autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="field"><label htmlFor="w-email">Email</label><input id="w-email" type="email" autoComplete="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          </div>
          <input className="hp" tabIndex={-1} autoComplete="off" aria-hidden="true" name="bot-field" value={form.trap} onChange={(e) => setForm({ ...form, trap: e.target.value })} />
          {sendError && <p className="error" role="alert">{sendError}</p>}
          <div className="controls">
            <button type="submit" className="btn" disabled={sending}>{sending ? 'Sending' : 'Join the waitlist'}</button>
            <button type="button" className="btn ghost" onClick={editRules}>Change my rules</button>
          </div>
        </form>
      )}

      {inFlow && sealed && (
        <div className={`roll-flow ${phase === 'stage' ? 'is-stage' : 'is-result'}`}>
          <div className="roll-globe">
            <div className="globe-stage">
              <div className="poster"><OrbitOverlay part="back" /><img src={poster.src} width={poster.width} height={poster.height} alt="" role="presentation" decoding="async" /><OrbitOverlay part="front" /></div>
              <Globe variant={phase === 'stage' ? 'stage' : 'side'} mode={globeMode} />
            </div>
            {phase === 'stage' && <p className="stage-cap" aria-hidden="true">Sealing your rules</p>}
          </div>
          {phase !== 'stage' && (
            <div className="roll-card">
              <h2 className="panel-title" ref={stepHead} tabIndex={-1} style={{ outline: 'none' }}>{phase === 'result' ? 'Your sealed card' : 'Request this trip'}</h2>
              <ItineraryCard sealed={sealed} airport={params.airport} archetypeName={arch?.name ?? null} mood={moods[mood]} refCode={ref} passport={params.passport} dateNotes={cardMatches.length ? { sentences: cardMatches.map((m) => matchSentence(m)), plan: planForDates, onPlan: setPlanForDates } : undefined} />
              <p className="fine">{ui.estimateNote}</p>
              <p className="fine" style={{ marginTop: '0.35rem' }}>{ui.sealedNote}</p>

              {phase === 'result' && (
                <div className="controls">
                  <button type="button" className="btn" onClick={() => setPhase('request')}>Request this trip</button>
                  <button type="button" className="btn ghost" onClick={editRules}>Change my rules</button>
                </div>
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
                    <fieldset>
                      <legend>When should we tell you where you are going?</legend>
                      <div className="seg cols2">
                        {DELIVERY_OPTIONS.map((o) => (
                          <label className="opt" key={o.id}><input type="radio" name="delivery" checked={params.delivery === o.id} onChange={() => set('delivery', o.id as Delivery)} /><span>{o.label}</span></label>
                        ))}
                      </div>
                      {params.delivery === 'date' && (
                        <div className="field" style={{ marginTop: '0.75rem' }}>
                          <label htmlFor="r-reveal">Reveal date</label>
                          <input id="r-reveal" type="date" min={addDays(today, 1)} max={addDays(sealed.start, -1)} value={params.revealDate} onChange={(e) => set('revealDate', e.target.value)} aria-describedby="reveal-help" />
                          <span className="hint" id="reveal-help">{ui.revealHelp}</span>
                        </div>
                      )}
                      <p className="hint" style={{ marginTop: '0.5rem' }}>Both happen only after we confirm the trip.</p>
                    </fieldset>
                  )}
                  <div className="field"><label htmlFor="r-notes">Notes <span className="hint">optional</span></label><textarea id="r-notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
                  {dnaForm && (
                    <>
                      <input type="hidden" name="archetype" value={dnaForm.archetype} />
                      <input type="hidden" name="dna_profile" value={dnaForm.profileJson} />
                      <p className="hint">Your Travel DNA and planner brief ({arch?.name}) go with this request. A person reads them when building your trip.</p>
                    </>
                  )}
                  <input className="hp" tabIndex={-1} autoComplete="off" aria-hidden="true" name="bot-field" value={form.trap} onChange={(e) => setForm({ ...form, trap: e.target.value })} />
                  {sendError && <p className="error" role="alert">{sendError}</p>}
                  <div className="controls">
                    <button type="submit" className="btn" disabled={sending}>{sending ? 'Sending' : restricted ? 'Join the waitlist' : 'Send trip request'}</button>
                    <button type="button" className="btn ghost" onClick={() => setPhase('result')}>Back to card</button>
                  </div>
                  {!restricted && <p className="hint" style={{ marginTop: '0.75rem' }}>{pay.requestNote}</p>}
                </form>
              )}
            </div>
          )}
        </div>
      )}

      {phase === 'sent' && (
        <div>
          <h2 className="panel-title" ref={stepHead} tabIndex={-1} style={{ outline: 'none' }}>{sentKind === 'trip' ? 'Request received' : 'You are on the waitlist'}</h2>
          <p className="lead">{sentKind === 'trip' ? ui.successTrip : ui.successWaitlist}</p>
          {sentKind === 'trip' && <Timeline active={1} />}
          <div className="controls"><button type="button" className="btn ghost" onClick={editRules}>Start another request</button></div>
        </div>
      )}
    </div>
  );
}
