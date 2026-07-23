import { useState } from 'react'
import { Plane, Hotel, Sparkles, ShieldCheck, Calendar, Users, Wifi } from 'lucide-react'
import { fmt, fmtDate } from '../lib/dna.js'
import BookModal from './BookModal.jsx'

export default function TripCard({ trip }) {
  const [booking, setBooking] = useState(false)
  if (!trip) return null
  const { dest, nights, party, start, end, price } = trip

  return (
    <div className="rise mx-auto w-full max-w-md rounded-3xl border border-deep/10 bg-white p-6 shadow-xl shadow-deep/10">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-lagoon">You rolled</p>
          <h3 className="mt-1 font-display text-2xl font-bold text-ink">{dest.name}</h3>
          <p className="text-sm text-body">{dest.country} · {dest.blurb}</p>
        </div>
        <span className="rounded-2xl bg-mist px-3 py-2 text-right">
          <span className="block font-display text-2xl font-bold text-lagoon">{fmt(price.total)}</span>
          <span className="block text-[11px] text-body">{fmt(price.perPerson)} per person</span>
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-body">
        <span className="flex items-center gap-1.5 rounded-full bg-sand px-3 py-1.5"><Calendar size={13} /> {fmtDate(start)} to {fmtDate(end)} · {nights} nights</span>
        <span className="flex items-center gap-1.5 rounded-full bg-sand px-3 py-1.5"><Users size={13} /> {party} {party === 1 ? 'traveler' : 'travelers'}</span>
        {dest.wifi && <span className="flex items-center gap-1.5 rounded-full bg-sand px-3 py-1.5"><Wifi size={13} /> Work-ready Wi-Fi</span>}
      </div>

      <ul className="mt-5 space-y-2.5 text-sm text-body">
        <li className="flex items-center justify-between"><span className="flex items-center gap-2"><Plane size={15} className="text-lagoon" /> Roundtrip flights</span><span className="font-semibold text-ink">{fmt(price.flights)}</span></li>
        <li className="flex items-center justify-between"><span className="flex items-center gap-2"><Hotel size={15} className="text-lagoon" /> {nights} nights, well-reviewed stay</span><span className="font-semibold text-ink">{fmt(price.hotel)}</span></li>
        <li className="flex items-center justify-between"><span className="flex items-center gap-2"><Sparkles size={15} className="text-lagoon" /> Transfers + curated experience</span><span className="font-semibold text-ink">{fmt(price.extras)}</span></li>
        <li className="flex items-center justify-between"><span className="flex items-center gap-2"><ShieldCheck size={15} className="text-lagoon" /> TripRoll concierge + protection</span><span className="font-semibold text-ink">{fmt(price.service)}</span></li>
      </ul>

      <button
        onClick={() => setBooking(true)}
        className="mt-6 w-full rounded-full bg-coral py-3.5 font-display text-base font-bold text-white transition hover:bg-ink"
      >
        I would actually book this
      </button>
      <p className="mt-2 text-center text-[11px] text-body/70">Live-market estimate. Booked trips are locked against real inventory before you pay.</p>

      {booking && <BookModal trip={trip} onClose={() => setBooking(false)} />}
    </div>
  )
}
