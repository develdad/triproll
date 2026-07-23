import { Link } from 'react-router-dom'
import { Dices, ArrowRight } from 'lucide-react'
import Seo from '../components/Seo.jsx'
import { site } from '../data/site.js'

export default function HowItWorks() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <Seo title="How It Works" description="Surprise travel with hard guardrails: your budget, your dates, your rules. Our reveal." />
      <h1 className="text-center font-display text-4xl font-black text-ink">How TripRoll works</h1>
      <p className="mx-auto mt-4 max-w-xl text-center text-body">
        Serendipity at its finest, with none of the logistics. Here is the whole loop.
      </p>

      <ol className="mt-12 space-y-8">
        {site.steps.map((step, i) => (
          <li key={step.title} className="flex gap-5">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-lagoon font-display text-xl font-black text-sand">{i + 1}</span>
            <div>
              <h2 className="font-display text-xl font-bold text-ink">{step.title}</h2>
              <p className="mt-1.5 leading-relaxed text-body">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-16 rounded-3xl bg-deep p-8 text-center text-sand">
        <h2 className="font-display text-2xl font-black">Ready to see what you roll?</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-sand/75">The demo globe is open. Infinite rolls, real price ranges, zero commitment.</p>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link to="/roll" className="flex items-center gap-2 rounded-full bg-coral px-7 py-3.5 font-display font-bold text-white transition hover:scale-105"><Dices size={18} /> Roll the globe</Link>
          <Link to="/quiz" className="flex items-center gap-2 rounded-full border border-sand/30 px-7 py-3.5 font-display font-bold text-sand transition hover:bg-sand/10">Find your Travel DNA <ArrowRight size={16} /></Link>
        </div>
      </div>
    </div>
  )
}
