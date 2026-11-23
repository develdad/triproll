import { useEffect, useRef, useState, type SyntheticEvent } from 'react';
import { questions, archetypes, type Answer, type Dna } from '../../data/quiz.ts';
import { AXES, matchArchetype, scoreQuiz, type Passport } from '../../lib/dna.ts';
import { loadDna, saveDna, type StoredDna } from '../../lib/storage.ts';
import { submitLead } from '../../lib/leads.ts';
import { travelDna } from '../../data/copy.ts';
import Radar from './Radar.tsx';

const AXIS_NAME: Record<string, string> = { adventure: 'Adventure', social: 'Social', structure: 'Structure', cultural: 'Culture', budget: 'Budget', energy: 'Energy' };

export default function Quiz() {
  const [idx, setIdx] = useState(0);
  const [picks, setPicks] = useState<(number | null)[]>(() => questions.map(() => null));
  const [result, setResult] = useState<StoredDna | null>(null);
  const [email, setEmail] = useState('');
  const [trap, setTrap] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const legend = useRef<HTMLLegendElement>(null);
  const moved = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const saved = loadDna();
    if (saved) setResult({ ...saved, archetype: saved.archetype ?? matchArchetype(saved.dna).key });
  }, []);
  useEffect(() => {
    if (moved.current) legend.current?.focus();
  }, [idx]);
  useEffect(() => {
    if (result && moved.current) heading.current?.focus();
  }, [result]);

  const q = questions[idx];
  const last = idx === questions.length - 1;

  function next(e?: SyntheticEvent) {
    e?.preventDefault();
    if (picks[idx] === null) return;
    moved.current = true;
    if (!last) { setIdx(idx + 1); return; }
    const chosen: Answer[] = questions.map((qq, i) => qq.answers[picks[i] as number]);
    const scored = scoreQuiz(chosen);
    const arc = matchArchetype(scored.dna);
    const stored: StoredDna = { dna: scored.dna, passport: scored.passport as Passport, archetype: arc.key };
    saveDna(stored);
    setResult(stored);
  }
  function retake() {
    moved.current = true;
    setPicks(questions.map(() => null));
    setIdx(0);
    setResult(null);
    setStatus('idle');
  }
  async function join(e: SyntheticEvent) {
    e.preventDefault();
    if (!result) return;
    setStatus('sending');
    const r = await submitLead('waitlist', { email, source: `quiz:${result.archetype}`, archetype: result.archetype, 'bot-field': trap });
    setStatus(r.ok ? 'done' : 'error');
  }

  if (result) {
    const arc = archetypes.find((a) => a.key === result.archetype) ?? matchArchetype(result.dna);
    const dna: Dna = result.dna;
    const summary = `Travel DNA scores for ${arc.name}: ` + AXES.map((a) => `${AXIS_NAME[a]} ${Math.round(dna[a] * 100)} out of 100`).join(', ');
    return (
      <div>
        <span className="eyebrow">Your result</span>
        <div className="result-grid">
          <div>
            <h2 ref={heading} tabIndex={-1} style={{ outline: 'none' }}>{arc.name}</h2>
            <p className="lead" style={{ marginTop: '1rem' }}>{arc.tagline}</p>
            <p>{arc.description}</p>
            <p className="hint">{result.passport === 'none' ? 'Passport: none or expired, so your rolls stay domestic.' : 'Passport: valid, so international trips are eligible.'}</p>
            <div className="actions">
              <a className="btn" href="/roll">{travelDna.resultCta}</a>
              <button type="button" className="btn ghost" onClick={retake}>Retake the quiz</button>
            </div>
          </div>
          <div>
            <Radar dna={dna} label={summary} />
            <ul className="axis-list">
              {AXES.map((a) => <li key={a}><span>{AXIS_NAME[a]}</span><span>{Math.round(dna[a] * 100)}</span></li>)}
            </ul>
          </div>
        </div>
        <div className="notice" style={{ marginTop: '2.5rem' }}>
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

  return (
    <form className="quiz" onSubmit={next} aria-label="Travel DNA quiz">
      <div className="qcount" aria-live="polite">Question {idx + 1} of {questions.length}</div>
      <div className="progress" role="progressbar" aria-label="Quiz progress" aria-valuemin={0} aria-valuemax={questions.length} aria-valuenow={idx + 1}>
        <i style={{ width: `${((idx + 1) / questions.length) * 100}%` }} />
      </div>
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
        <button type="submit" className="btn" disabled={picks[idx] === null}>{last ? 'See my Travel DNA' : 'Next'}</button>
      </div>
    </form>
  );
}
