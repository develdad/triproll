import { Link } from 'react-router-dom'
import { Dices, Fingerprint, MapPinOff, Luggage, ArrowRight } from 'lucide-react'
import Seo from '../components/Seo.jsx'
import { site } from '../data/site.js'

const icons = [Fingerprint, Luggage, Dices, MapPinOff]

export default function Home() {
  return (
    <div>
      <Seo />

      {/* Hero */}
      <section className="relative overflow-hidden bg-deep text-sand">
        <div className="pointer-events-none absolute -right-40 -top-40 h-[480px] w-[480px] rounded-full bg-lagoon/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-52 -left-32 h-[420px] w-[420px] rounded-full bg-aqua/20 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-4 py-24 text-center sm:px-6 sm:py-32">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-aqua">Surprise travel, fully handled</p>
          <h1 className="mx-auto mt-4 max-w-3xl font-display text-5xl font-black leading-tight sm:text-7xl">
            Spin the globe.<br />Get a trip.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-sand/80">
            TripRoll builds a complete trip around your Travel DNA and your budget. You see the price, the dates, and a packing list. The destination? Departure day.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link to="/roll" className="pulse-ring flex items-center gap-2 rounded-full bg-coral px-8 py-4 font-display text-lg font-black text-white transition hover:scale-105">
              <Dices size={22} /> Try the globe
            </Link>
            <Link to="/quiz" className="flex items-center gap-2 rounded-full border border-sand/30 px-8 py-4 font-display text-lg font-bold text-sand transition hover:bg-sand/10">
              Find your Travel DNA <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <h2 className="text-center font-display text-3xl font-black text-ink sm:text-4xl">How TripRoll works</h2>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {site.steps.map((step, i) => {
            const Icon = icons[i]
            return (
              <div key={step.title} className="rounded-3xl border border-deep/10 bg-white p-6">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-mist text-lagoon">
                  <Icon size={22} />
                </span>
                <p className="mt-4 text-xs font-bold uppercase tracking-widest text-lagoon">Step {i + 1}</p>
                <h3 className="mt-1 font-display text-lg font-bold text-ink">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-body">{step.body}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* DNA pitch */}
      <section className="bg-mist">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-10 px-4 py-20 sm:px-6 lg:flex-row">
          <div className="flex-1">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-lagoon">Travel DNA</p>
            <h2 className="mt-3 font-display text-3xl font-black text-ink sm:text-4xl">The more it knows you, the better it rolls.</h2>
            <p className="mt-4 max-w-lg leading-relaxed text-body">
              Six dimensions: adventure, social, structure, cultural, budget, and energy. A two-minute assessment builds your first profile, and every roll, veto, and booking refines it. Your parameters are hard rules: budget, dates, passport, dietary needs, Wi-Fi for work. Serendipity inside guardrails.
            </p>
            <Link to="/quiz" className="mt-8 inline-flex items-center gap-2 rounded-full bg-lagoon px-7 py-3.5 font-display font-bold text-sand transition hover:bg-deep">
              Take the assessment <ArrowRight size={18} />
            </Link>
          </div>
          <div className="w-full max-w-sm flex-1 rounded-3xl border border-deep/10 bg-white p-6 shadow-xl shadow-deep/5">
            <p className="text-xs font-semibold uppercase tracking-widest text-lagoon">Sample profile</p>
            <p className="mt-1 font-display text-xl font-bold text-ink">The Free Spirit</p>
            {[['Adventure', 80], ['Social', 70], ['Structure', 10], ['Cultural', 70], ['Budget savvy', 80], ['Energy', 75]].map(([label, v]) => (
              <div key={label} className="mt-3">
                <div className="flex justify-between text-xs font-medium text-body"><span>{label}</span><span>{v}</span></div>
                <div className="mt-1 h-2 rounded-full bg-mist">
                  <div className="h-2 rounded-full bg-gradient-to-r from-lagoon to-aqua" style={{ width: `${v}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
        <h2 className="text-center font-display text-3xl font-black text-ink">Fair questions</h2>
        <div className="mt-10 space-y-4">
          {site.faqs.map((f) => (
            <details key={f.q} className="group rounded-2xl border border-deep/10 bg-white p-5">
              <summary className="cursor-pointer list-none font-display text-base font-bold text-ink">{f.q}</summary>
              <p className="mt-3 text-sm leading-relaxed text-body">{f.a}</p>
            </details>
          ))}
        </div>
        <div className="mt-14 text-center">
          <Link to="/roll" className="inline-flex items-center gap-2 rounded-full bg-coral px-8 py-4 font-display text-lg font-black text-white transition hover:scale-105">
            <Dices size={20} /> Roll one now
          </Link>
        </div>
      </section>
    </div>
  )
}
