import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'
import Seo from '../components/Seo.jsx'

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center sm:px-6">
      <Seo title="Lost" />
      <Compass size={42} className="mx-auto text-lagoon" />
      <h1 className="mt-4 font-display text-4xl font-black text-ink">Well, this is off the itinerary.</h1>
      <p className="mt-3 text-body">This page does not exist. The good news: getting lost is kind of our whole thing.</p>
      <Link to="/" className="mt-8 inline-block rounded-full bg-lagoon px-8 py-3.5 font-display font-bold text-sand transition hover:bg-deep">Back home</Link>
    </div>
  )
}
