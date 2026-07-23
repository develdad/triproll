import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Dices, Fingerprint, Check } from 'lucide-react'
import Seo from '../components/Seo.jsx'
import { questions } from '../data/quiz.js'
import { scoreQuiz, matchArchetype, AXES } from '../lib/dna.js'
import { supabase } from '../lib/supabase.js'

const axisLabels = { adventure: 'Adventure', social: 'Social', structure: 'Structure', cultural: 'Cultural', budget: 'Budget savvy', energy: 'Energy' }

export default function Quiz() {
  const [step, setStep] = useState(-1) // -1 intro, 0..n questions, n = results
  const [chosen, setChosen] = useState([])
  const [result, setResult] = useState(null)
  const [email, setEmail] = useState('')
  const [saveState, setSaveState] = useState('idle')

  const pick = (answer) => {
    const next = [...chosen, answer]
    if (next.length === questions.length) {
      const scored = scoreQuiz(next)
      const archetype = matchArchetype(scored.dna)
      localStorage.setItem('triproll_dna', JSON.stringify(scored))
      setResult({ ...scored, archetype })
      setChosen(next)
      setStep(questions.length)
    } else {
      setChosen(next)
      setStep(next.length)
    }
  }

  const saveEmail = async (e) => {
    e.preventDefault()
    setSaveState('busy')
    const { error } = await supabase.from('waitlist').insert({
      email: email.trim().toLowerCase(),
      source: `quiz:${result.archetype.key}`,
    })
    if (error && error.code !== '23505') setSaveState('error')
    else setSaveState('done')
  }

  // Intro
  if (step === -1) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center sm:px-6">
        <Seo title="Travel DNA" description="A two-minute assessment that maps how you actually travel." />
        <Fingerprint size={42} className="mx-auto text-lagoon" />
        <h1 className="mt-4 font-display text-4xl font-black text-ink">Find your Travel DNA</h1>
        <p className="mx-auto mt-4 max-w-md text-body">
          Ten questions, two minutes. We map six dimensions of how you actually travel, then every roll of the globe is tuned to you.
        </p>
        <button onClick={() => setStep(0)} className="mt-8 inline-flex items-center gap-2 rounded-full bg-lagoon px-8 py-4 font-display text-lg font-bold text-sand transition hover:bg-deep">
          Start <ArrowRight size={18} />
        </button>
      </div>
    )
  }

  // Results
  if (step >= questions.length && result) {
    return (
      <div className="mx-auto max-w-xl px-4 py-14 sm:px-6">
        <Seo title="Your Travel DNA" />
        <div className="rise rounded-3xl border border-deep/10 bg-white p-8 text-center shadow-xl shadow-deep/10">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-lagoon">Your Travel DNA</p>
          <h1 className="mt-2 font-display text-4xl font-black text-ink">{result.archetype.name}</h1>
          <p className="mx-auto mt-3 max-w-sm text-body">{result.archetype.tagline}</p>

          <div className="mt-8 space-y-3 text-left">
            {AXES.map((a) => (
              <div key={a}>
                <div className="flex justify-between text-xs font-medium text-body">
                  <span>{axisLabels[a]}</span><span>{Math.round(result.dna[a] * 100)}</span>
                </div>
                <div className="mt-1 h-2.5 rounded-full bg-mist">
                  <div className="h-2.5 rounded-full bg-gradient-to-r from-lagoon to-aqua" style={{ width: `${result.dna[a] * 100}%` }} />
                </div>
              </div>
            ))}
          </div>

          {result.passport === 'none' && (
            <p className="mt-5 rounded-2xl bg-sand p-3 text-xs text-body">No passport yet, so the globe will keep your rolls domestic until you tell it otherwise.</p>
          )}

          <div className="mt-8 rounded-2xl bg-mist p-5 text-left">
            {saveState === 'done' ? (
              <p className="flex items-center gap-2 text-sm font-medium text-lagoon"><Check size={16} /> Saved. Your profile will be waiting when accounts open.</p>
            ) : (
              <>
                <p className="text-sm font-semibold text-ink">Save this profile</p>
                <p className="mt-1 text-xs text-body">Accounts are opening soon. Drop your email and your Travel DNA transfers the moment they do, with founding-member pricing.</p>
                <form onSubmit={saveEmail} className="mt-3 flex gap-2">
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" className="min-w-0 flex-1 rounded-full border border-deep/15 bg-white px-4 py-2.5 text-sm outline-none focus:border-lagoon" />
                  <button disabled={saveState === 'busy'} className="rounded-full bg-lagoon px-5 py-2.5 text-sm font-bold text-sand disabled:opacity-60">{saveState === 'busy' ? '...' : 'Save'}</button>
                </form>
                {saveState === 'error' && <p className="mt-2 text-xs text-coral">Hiccup. Try again.</p>}
              </>
            )}
          </div>

          <Link to="/roll" className="mt-6 inline-flex items-center gap-2 rounded-full bg-coral px-8 py-4 font-display text-lg font-black text-white transition hover:scale-105">
            <Dices size={20} /> Roll with my DNA
          </Link>
        </div>
      </div>
    )
  }

  // Questions
  const q = questions[step]
  return (
    <div className="mx-auto max-w-xl px-4 py-14 sm:px-6">
      <Seo title="Travel DNA" />
      <div className="mb-8">
        <div className="flex justify-between text-xs font-medium text-body">
          <span>Question {step + 1} of {questions.length}</span>
          <span>{Math.round((step / questions.length) * 100)}%</span>
        </div>
        <div className="mt-2 h-2 rounded-full bg-mist">
          <div className="h-2 rounded-full bg-lagoon transition-all duration-300" style={{ width: `${(step / questions.length) * 100}%` }} />
        </div>
      </div>

      <h1 key={q.id} className="rise font-display text-2xl font-black text-ink sm:text-3xl">{q.prompt}</h1>
      <div className="mt-7 space-y-3">
        {q.answers.map((a) => (
          <button
            key={a.label}
            onClick={() => pick(a)}
            className="rise block w-full rounded-2xl border border-deep/10 bg-white px-5 py-4 text-left text-sm font-medium text-ink transition hover:border-lagoon hover:bg-mist"
          >
            {a.label}
          </button>
        ))}
      </div>
    </div>
  )
}
