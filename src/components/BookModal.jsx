import { useState } from 'react'
import { X, PartyPopper } from 'lucide-react'
import { supabase } from '../lib/supabase.js'
import { fmt } from '../lib/dna.js'

// Early-access capture: writes to the waitlist with the trip context as source.
export default function BookModal({ trip, onClose }) {
  const [email, setEmail] = useState('')
  const [state, setState] = useState('idle') // idle | busy | done | error

  const submit = async (e) => {
    e.preventDefault()
    setState('busy')
    const { error } = await supabase.from('waitlist').insert({
      email: email.trim().toLowerCase(),
      source: `trip-hold:${trip.dest.id}:${trip.price.total}`,
    })
    if (error && error.code !== '23505') setState('error')
    else setState('done')
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-deep/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="rise w-full max-w-sm rounded-3xl bg-white p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <h3 className="font-display text-xl font-bold text-ink">Hold this trip</h3>
          <button onClick={onClose} aria-label="Close"><X size={20} className="text-body" /></button>
        </div>

        {state === 'done' ? (
          <div className="mt-4 text-center">
            <PartyPopper size={36} className="mx-auto text-coral" />
            <p className="mt-3 text-sm text-body">You are on the founders list. When live booking opens, {trip.dest.name} at {fmt(trip.price.total)} gets first-in-line pricing and reduced fees.</p>
          </div>
        ) : (
          <>
            <p className="mt-2 text-sm text-body">
              Live booking opens soon. Drop your email and we will hold your spot as a founding member: reduced fees on your first roll, and this trip's parameters saved to your profile.
            </p>
            <form onSubmit={submit} className="mt-4 flex flex-col gap-3">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                className="rounded-full border border-deep/15 bg-sand px-4 py-3 text-sm outline-none focus:border-lagoon"
              />
              <button
                disabled={state === 'busy'}
                className="rounded-full bg-lagoon py-3 font-display font-bold text-sand transition hover:bg-deep disabled:opacity-60"
              >
                {state === 'busy' ? 'Saving...' : 'Save my spot'}
              </button>
              {state === 'error' && <p className="text-center text-xs text-coral">Something hiccuped. Try again.</p>}
            </form>
          </>
        )}
      </div>
    </div>
  )
}
