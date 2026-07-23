import { archetypes } from '../data/quiz.js'
import { destinations } from '../data/destinations.js'

export const AXES = ['adventure', 'social', 'structure', 'cultural', 'budget', 'energy']

// Average the weights each chosen answer contributed per axis.
export function scoreQuiz(chosen) {
  const sums = {}
  const counts = {}
  AXES.forEach((a) => { sums[a] = 0; counts[a] = 0 })
  let passport = 'valid'
  chosen.forEach((ans) => {
    if (ans.passport) passport = ans.passport
    Object.entries(ans.dna || {}).forEach(([axis, w]) => {
      sums[axis] += w
      counts[axis] += 1
    })
  })
  const dna = {}
  AXES.forEach((a) => { dna[a] = counts[a] ? +(sums[a] / counts[a]).toFixed(2) : 0.5 })
  return { dna, passport }
}

export function matchArchetype(dna) {
  let best = archetypes[0]
  let bestDist = Infinity
  archetypes.forEach((arc) => {
    const d = AXES.reduce((acc, a) => acc + (dna[a] - arc.profile[a]) ** 2, 0)
    if (d < bestDist) { bestDist = d; best = arc }
  })
  return best
}

function affinity(dna, dest) {
  // Cosine-ish similarity: lower distance = better fit.
  const d = AXES.reduce((acc, a) => acc + (dna[a] - dest.dna[a]) ** 2, 0)
  return 1 / (1 + d)
}

const seasonMult = () => 0.92 + Math.random() * 0.22

// Generate a trip. Weighted random when DNA exists, uniform otherwise.
export function rollTrip({ dna = null, passport = 'valid', party = 2, exclude = [] } = {}) {
  let pool = destinations.filter((d) => !exclude.includes(d.id))
  if (passport === 'none') pool = pool.filter((d) => d.domestic)
  if (!pool.length) pool = destinations

  let dest
  if (dna) {
    const weights = pool.map((d) => affinity(dna, d) ** 3)
    const total = weights.reduce((a, b) => a + b, 0)
    let r = Math.random() * total
    dest = pool[pool.length - 1]
    for (let i = 0; i < pool.length; i++) {
      r -= weights[i]
      if (r <= 0) { dest = pool[i]; break }
    }
  } else {
    dest = pool[Math.floor(Math.random() * pool.length)]
  }

  const nights = 4 + Math.floor(Math.random() * 6) // 4-9
  const flightPP = Math.round(dest.flightBase * seasonMult())
  const rooms = Math.ceil(party / 2)
  const hotel = Math.round(dest.hotelNight * nights * rooms * seasonMult())
  const flights = flightPP * party
  const extras = Math.round((flights + hotel) * 0.12) // transfers + one curated experience
  const service = Math.round((flights + hotel + extras) * 0.15)
  const total = flights + hotel + extras + service

  const start = new Date()
  start.setDate(start.getDate() + 21 + Math.floor(Math.random() * 40))
  const end = new Date(start)
  end.setDate(end.getDate() + nights)

  return {
    dest,
    nights,
    party,
    start,
    end,
    price: { flights, hotel, extras, service, total, perPerson: Math.round(total / party) },
  }
}

export const fmt = (n) => '$' + n.toLocaleString('en-US')
export const fmtDate = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
