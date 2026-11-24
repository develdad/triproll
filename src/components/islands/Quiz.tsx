import { useEffect, useRef, useState, type SyntheticEvent } from 'react';
import { AXES, AXIS_META, EMPTY_BRIEF, briefOptions, questions, sections, type Brief } from '../../data/quiz.ts';
import { matchArchetype, scoreQuiz } from '../../lib/dna.ts';
import { loadProfile, saveProfile, type StoredProfile } from '../../lib/storage.ts';
import { archetypeOf, axisExplainer, briefRows, implications, openAxes, serializeProfile, strongestAxes } from '../../lib/profile.ts';
import { submitLead } from '../../lib/leads.ts';
import { travelDna } from '../../data/copy.ts';
import Radar from './Radar.tsx';

type Stage = 'questions' | 'brief' | 'result';

// Flat question list with section info so each screen can show its section name and the overall progress.
const flat = sections.flatMap((s, si) => s.questions.map((q, qi) => ({ q, section: s, si, qi })));

function Chips({ name, options, value, onChange }: { name: string; options: string[]; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="chips">
      {options.map((o) => (
        <label className="chip" key={o}>
          <input type="checkbox" name={name} checked={value.includes(o)} onChange={() => onChange(value.includes(o) ? value.filter((x) => x !== o) : [...value, o])} />
          <span>{o}</span>
        </label>
      ))}
    </div>
  );
}
function Choice({ name, options, value, onChange }: { name: string; options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="chips">
      {options.map((o) => (
        <label className="chip" key={o}>
          <input type="radio" name={name} checked={value === o} onClick={() => value === o && onChange('')} onChange={() => onChange(o)} />
          <span>{o}</span>
        </label>
      ))}
    </div>
  );
}

export default function Quiz() {
  const [stage, setStage] = useState<Stage>('questions');
  const [idx, setIdx] = useState(0);
  const [picks, setPicks] = useState<(number | null)[]>(() => questions.map(() => null));
  const [brief, setBrief] = useState<Brief>(EMPTY_BRIEF);
  const [profile, setProfile] = useState<StoredProfile | null>(null);
  const [email, setEmail] = useState('');
  const [trap, setTrap] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const legend = useRef<HTMLLegendElement>(null);
  const moved = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const briefHead = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const saved = loadProfile();
    if (saved) { setProfile(saved); setBrief(saved.brief); setStage('result'); }
  }, []);
  useEffect(() => { if (moved.current && stage === 'questions') legend.current?.focus(); }, [idx, stage]);
  useEffect(() => { if (moved.current && stage === 'result') heading.current?.focus(); if (moved.current && stage === 'brief') briefHead.current?.focus(); }, [stage]);

  const cur = flat[idx];
  const last = idx === flat.length - 1;
  const setB = <K extends keyof Brief>(k: K, v: Brief[K]) => setBrief((b) => ({ ...b, [k]: v }));

  function next(e?: SyntheticEvent) {
    e?.preventDefault();
    if (picks[idx] === null) return;
    moved.current = true;
    if (!last) { setIdx(idx + 1); return; }
    const axes = scoreQuiz(questions.map((qq, i) => qq.answers[picks[i] as number]));
    const stored: StoredProfile = { v: 3, axes, archetype: matchArchetype(axes).key, brief: EMPTY_BRIEF };
    saveProfile(stored);
    setProfile(stored);
    setStage('brief');
  }
  function finishBrief(skip: boolean) {
    if (!profile) return;
    moved.current = true;
    const stored: StoredProfile = { ...profile, brief: skip ? EMPTY_BRIEF : brief };
    saveProfile(stored);
    setProfile(stored);
    setBrief(stored.brief);
    setStage('result');
  }
  function retake() {
    moved.current = true;
    setPicks(questions.map(() => null));
    setBrief(EMPTY_BRIEF);
    setIdx(0);
    setProfile(null);
    setStage('questions');
    setStatus('idle');
  }
  async function join(e: SyntheticEvent) {
    e.preventDefault();
    if (!profile) return;
    setStatus('sending');
    const r = await submitLead('waitlist', { email, source: `assessment:${profile.archetype}`, archetype: profile.archetype, dna_profile: serializeProfile(profile), 'bot-field': trap });
    setStatus(r.ok ? 'done' : 'error');
  }

  if (stage === 'result' && profile) {
    const arc = archetypeOf(profile);
    const dna = profile.axes;
    const summary = `Travel DNA scores for ${arc.name}: ` + AXES.map((a) => `${AXIS_META[a].name} ${Math.round(dna[a] * 100)} out of 100`).join(', ');
    const rows = briefRows(profile.brief);
    return (
      <div>
        <span className="eyebrow">Your result</span>
        <div className="result-grid">
          <div>
            <h2 ref={heading} tabIndex={-1} style={{ outline: 'none' }}>{arc.name}</h2>
            <p className="lead" style={{ marginTop: '1rem' }}>{arc.tagline}</p>
            <p>{arc.description}</p>
            <p className="hint">{travelDna.humanNote}</p>
            <div className="actions">
              <a className="btn" href="/roll">{travelDna.resultCta}</a>
              <button type="button" className="btn ghost" onClick={retake}>Retake the assessment</button>
            </div>
          </div>
          <div>
            <Radar dna={dna} label={summary} />
            <ul className="axis-list">
              {AXES.map((a) => <li key={a}><span>{AXIS_META[a].name}</span><span>{Math.round(dna[a] * 100)}</span></li>)}
            </ul>
          </div>
        </div>

        <div className="insight-grid">
          <section aria-labelledby="strong-h">
            <h3 id="strong-h">Your strongest signals</h3>
            <ul>{strongestAxes(dna).map((a) => <li key={a}>{axisExplainer(a, dna[a])}</li>)}</ul>
          </section>
          <section aria-labelledby="open-h">
            <h3 id="open-h">Where you are most open</h3>
            <ul>{openAxes(dna).map((a) => <li key={a}>{axisExplainer(a, dna[a])}</li>)}</ul>
          </section>
        </div>

        <div className="means">
          <h3>What this means for your trip</h3>
          <ul>{implications(dna, profile.brief).map((s) => <li key={s}>{s}</li>)}</ul>
        </div>

        <div className="brief-card">
          <h3>Your planner brief</h3>
          {rows.length ? (
            <dl>{rows.map((r) => <div key={r.label}><dt>{r.label}</dt><dd>{r.value}</dd></div>)}</dl>
          ) : <p>You skipped the brief. You can retake the assessment to add one.</p>}
          <p className="hint">A person reads this profile when building your trip.</p>
        </div>

        <div className="notice" style={{ marginTop: '2rem' }}>
          <h3 style={{ marginBottom: '0.35rem' }}>{travelDna.emailTitle}</h3>
          <p style={{ marginBottom: '0.75rem' }}>{travelDna.emailBody}</p>
          {status === 'done' ? (
            <p role="status"><strong>You are on the list.</strong> Nothing else was created.</p>
          ) : (
            <form onSubmit={join} className="grid2" style={{ alignItems: 'end' }}>
              <div className="field" style={{ marginBottom: 0 }}>
                <label htmlFor="wl-email">Email</label>
                <input id="wl-email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <input type="hidden" name="archetype" value={profile.archetype} />
              <input type="hidden" name="dna_profile" value={serializeProfile(profile)} />
              <input className="hp" tabIndex={-1} autoComplete="off" aria-hidden="true" name="bot-field" value={trap} onChange={(e) => setTrap(e.target.value)} />
              <div><button className="btn" type="submit" disabled={status === 'sending'}>{status === 'sending' ? 'Sending' : 'Join the waitlist'}</button></div>
              {status === 'error' && <p className="error" role="alert">That did not send. Check your connection and try again.</p>}
            </form>
          )}
        </div>
        <p className="hint" style={{ marginTop: '1rem' }}>{travelDna.privacyNote}</p>
      </div>
    );
  }

  if (stage === 'brief') {
    return (
      <form className="quiz brief" onSubmit={(e) => { e.preventDefault(); finishBrief(false); }} aria-label="Planner brief">
        <div className="qcount">Part 2 of 2: the planner brief</div>
        <div className="progress" role="progressbar" aria-label="Assessment progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={100}><i style={{ width: '100%' }} /></div>
        <h2 className="qprompt" ref={briefHead} tabIndex={-1}>Tell your planner directly</h2>
        <p className="lead" style={{ marginBottom: '1.5rem' }}>Everything here is optional. Skip any of it. A person reads it when building your trip.</p>

        <fieldset><legend>Climate you prefer</legend><Choice name="climate" options={briefOptions.climate} value={brief.climate} onChange={(v) => setB('climate', v)} /></fieldset>
        <fieldset><legend>Longest flight you will tolerate</legend><Choice name="maxFlight" options={briefOptions.maxFlight} value={brief.maxFlight} onChange={(v) => setB('maxFlight', v)} /></fieldset>
        <fieldset>
          <legend>Food restrictions</legend>
          <Chips name="diet" options={briefOptions.diet} value={brief.diet} onChange={(v) => setB('diet', v)} />
          <div className="field" style={{ marginTop: '0.75rem' }}><label htmlFor="b-diet">Anything else about food <span className="hint">optional</span></label><input id="b-diet" type="text" value={brief.dietNotes} onChange={(e) => setB('dietNotes', e.target.value)} /></div>
        </fieldset>
        <fieldset><legend>How adventurous do you eat?</legend><Choice name="dietAdventure" options={briefOptions.dietAdventure} value={brief.dietAdventure} onChange={(v) => setB('dietAdventure', v)} /></fieldset>
        <fieldset>
          <legend>Mobility or accessibility needs</legend>
          <Chips name="mobility" options={briefOptions.mobility} value={brief.mobility} onChange={(v) => setB('mobility', v)} />
          <div className="field" style={{ marginTop: '0.75rem' }}><label htmlFor="b-mob">Details <span className="hint">optional</span></label><input id="b-mob" type="text" value={brief.mobilityNotes} onChange={(e) => setB('mobilityNotes', e.target.value)} /></div>
        </fieldset>
        <fieldset><legend>Lodging style</legend><Chips name="lodging" options={briefOptions.lodging} value={brief.lodging} onChange={(v) => setB('lodging', v)} /></fieldset>
        <fieldset>
          <legend>Three things that make a trip great for you</legend>
          <Chips name="greats" options={briefOptions.greats} value={brief.greats} onChange={(v) => setB('greats', v)} />
          <div className="field" style={{ marginTop: '0.75rem' }}><label htmlFor="b-great">In your own words <span className="hint">optional</span></label><input id="b-great" type="text" value={brief.greatsText} onChange={(e) => setB('greatsText', e.target.value)} /></div>
        </fieldset>
        <fieldset>
          <legend>Hard no's</legend>
          <Chips name="noGos" options={briefOptions.noGos} value={brief.noGos} onChange={(v) => setB('noGos', v)} />
          <div className="field" style={{ marginTop: '0.75rem' }}><label htmlFor="b-no">Anything else <span className="hint">optional</span></label><input id="b-no" type="text" value={brief.noGosText} onChange={(e) => setB('noGosText', e.target.value)} /></div>
        </fieldset>
        <div className="field"><label htmlFor="b-visited">Places you have already been and do not want repeated <span className="hint">one per line or separated by commas</span></label><textarea id="b-visited" value={brief.visited} onChange={(e) => setB('visited', e.target.value)} /></div>
        <fieldset><legend>Who you usually travel with</legend><Choice name="withWhom" options={briefOptions.withWhom} value={brief.withWhom} onChange={(v) => setB('withWhom', v)} /></fieldset>
        <fieldset><legend>The occasion, if any</legend><Choice name="occasion" options={briefOptions.occasion} value={brief.occasion} onChange={(v) => setB('occasion', v)} /></fieldset>
        <div className="field"><label htmlFor="b-notes">Anything your planner should know <span className="hint">optional</span></label><textarea id="b-notes" value={brief.notes} onChange={(e) => setB('notes', e.target.value)} /></div>

        <div className="controls">
          <button type="button" className="btn ghost" onClick={() => finishBrief(true)}>Skip this part</button>
          <button type="submit" className="btn">See my Travel DNA</button>
        </div>
      </form>
    );
  }

  const q = cur.q;
  return (
    <form className="quiz" onSubmit={next} aria-label="Travel DNA assessment">
      <div className="qcount" aria-live="polite">{cur.section.name}<span className="dotsep" aria-hidden="true" />Question {idx + 1} of {flat.length}</div>
      <div className="progress" role="progressbar" aria-label="Assessment progress" aria-valuemin={0} aria-valuemax={flat.length} aria-valuenow={idx + 1}>
        <i style={{ width: `${((idx + 1) / flat.length) * 100}%` }} />
      </div>
      <ol className="sec-steps" aria-label="Sections">
        {sections.map((s, i) => <li key={s.id} className={i < cur.si ? 'done' : i === cur.si ? 'current' : ''} aria-current={i === cur.si ? 'step' : undefined}><span className="sr-only">{s.name}</span></li>)}
      </ol>
      <fieldset>
        <legend className="qprompt" tabIndex={-1} ref={legend}>{q.prompt}</legend>
        <div className="seg">
          {q.answers.map((a, i) => (
            <label className="opt" key={`${q.id}-${i}`}>
              <input type="radio" name={`q-${q.id}`} checked={picks[idx] === i} onChange={() => setPicks(picks.map((p, k) => (k === idx ? i : p)))} />
              <span>{a.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="controls">
        <button type="button" className="btn ghost" onClick={() => { moved.current = true; setIdx(idx - 1); }} disabled={idx === 0}>Back</button>
        <button type="submit" className="btn" disabled={picks[idx] === null}>{last ? 'Continue to the brief' : 'Next'}</button>
      </div>
    </form>
  );
}
