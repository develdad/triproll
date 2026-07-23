import { useRef, useState, lazy, Suspense } from 'react'
import { Link } from 'react-router-dom'
import { Dices, Users, Fingerprint } from 'lucide-react'
import Seo from '../components/Seo.jsx'

const GlobeRoll = lazy(() => import('../components/GlobeRoll.jsx'))
import TripCard from '../components/TripCard.jsx'
import { rollTrip } from '../lib/dna.js'
import { matchArchetype } from '../lib/dna.js'

function loadDna() {
  try { return JSON.parse(localStorage.getItem('triproll_dna')) } catch { return null }
}

export default function Roll() {
  const api = useRef(null)
  const [trip, setTrip] = useState(null)
  const [rolling, setRolling] = useState(false)
  const [party, setParty] = useState(2)
  const [lastIds, setLastIds] = useState([])
  const saved = loadDna()
  const archetype = saved ? matchArchetype(saved.dna) : null

  const doRoll = () => {
    if (rolling) return
    setTrip(null)
    setRolling(true)
    const next = rollTrip({
      dna: saved?.dna || null,
      passport: saved?.passport || 'valid',
      party,
      exclude: lastIds,
    })
    setLastIds((ids) => [next.dest.id, ...ids].slice(0, 3))
    api.current?.roll(next)
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Seo title="Roll the Globe" description="Spin the globe and get a complete trip with real-world pricing." />

      <div className="text-center">
        <h1 className="font-display text-3xl font-black text-ink sm:text-4xl">Roll the globe</h1>
        {archetype ? (
          <p className="mx-auto mt-2 flex max-w-md items-center justify-center gap-2 text-sm text-body">
            <Fingerprint size={15} className="text-lagoon" />
            Rolling with your Travel DNA: <span className="font-semibold text-lagoon">{archetype.name}</span>
          </p>
        ) : (
          <p className="mx-auto mt-2 max-w-md text-sm text-body">
            Infinite rolls, real-world price ranges.{' '}
            <Link to="/quiz" className="font-semibold text-lagoon underline">Build your Travel DNA</Link> and the globe starts rolling trips that fit you.
          </p>
        )}
      </div>

      <Suspense fallback={<div className="grid h-[400px] place-items-center text-sm text-body">Loading the planet...</div>}>
        <GlobeRoll apiRef={api} onLanded={(t) => { setTrip(t); setRolling(false) }} height={400} />
      </Suspense>

      <div className="mx-auto -mt-2 flex max-w-md flex-col items-center gap-4">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-sm text-body"><Users size={15} /> Travelers</span>
          {[1, 2, 4].map((n) => (
            <button
              key={n}
              onClick={() => setParty(n)}
              className={`h-9 w-9 rounded-full text-sm font-bold transition ${party === n ? 'bg-lagoon text-sand' : 'bg-mist text-body hover:bg-aqua/30'}`}
            >
              {n}
            </button>
          ))}
        </div>

        <button
          onClick={doRoll}
          disabled={rolling}
          className={`flex items-center gap-2 rounded-full bg-coral px-10 py-4 font-display text-lg font-black text-white transition hover:scale-105 disabled:opacity-60 ${rolling ? '' : 'pulse-ring'}`}
        >
          <Dices size={22} /> {rolling ? 'Rolling...' : trip ? 'Roll again' : 'Roll'}
        </button>
      </div>

      <div className="mt-8">
        <TripCard trip={trip} />
      </div>
    </div>
  )
}
