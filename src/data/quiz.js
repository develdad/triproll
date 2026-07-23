// Travel DNA intake assessment.
// Each answer contributes weights to the six travel_dna axes (0-1 scale, averaged at the end).
// Axes match the Supabase travel_dna table: adventure, social, structure, cultural, budget, energy.

export const questions = [
  {
    id: 'first-hour',
    prompt: 'You just landed somewhere new. First move?',
    answers: [
      { label: 'Drop the bags and start walking, no map', dna: { adventure: 0.9, structure: 0.1, energy: 0.8 } },
      { label: 'Find the food spot locals actually go to', dna: { cultural: 0.9, social: 0.6, energy: 0.6 } },
      { label: 'Check in, unpack, review the plan for tomorrow', dna: { structure: 0.95, energy: 0.3, adventure: 0.2 } },
      { label: 'Pool. Drink. Horizontal by 3pm.', dna: { energy: 0.15, social: 0.5, structure: 0.4 } },
    ],
  },
  {
    id: 'ideal-day',
    prompt: 'Perfect trip day looks like:',
    answers: [
      { label: 'Summit hike, cliff jump, or something with a waiver', dna: { adventure: 1.0, energy: 0.95 } },
      { label: 'Museums, old neighborhoods, and a long dinner', dna: { cultural: 1.0, energy: 0.5, structure: 0.6 } },
      { label: 'Beach until golden hour, then great seafood', dna: { energy: 0.3, adventure: 0.3, social: 0.5 } },
      { label: 'Wander, meet people, say yes to whatever happens', dna: { social: 0.95, adventure: 0.7, structure: 0.05 } },
    ],
  },
  {
    id: 'planning',
    prompt: 'Your relationship with itineraries:',
    answers: [
      { label: 'Spreadsheet with timestamps. Obviously.', dna: { structure: 1.0 } },
      { label: 'A short list of must-dos, the rest is open', dna: { structure: 0.6, adventure: 0.5 } },
      { label: 'I book the flight. The trip plans itself.', dna: { structure: 0.15, adventure: 0.8 } },
      { label: 'Someone else plans, I show up', dna: { structure: 0.4, energy: 0.4, social: 0.6 } },
    ],
  },
  {
    id: 'money',
    prompt: 'Trip money philosophy:',
    answers: [
      { label: 'Stretch every dollar, street food over white tablecloths', dna: { budget: 1.0, cultural: 0.6, adventure: 0.6 } },
      { label: 'Save on the room, splurge on experiences', dna: { budget: 0.7, adventure: 0.6, energy: 0.6 } },
      { label: 'Comfort matters, mid-range and no hostels', dna: { budget: 0.4, structure: 0.6 } },
      { label: 'If I have to look at the price, it is not a vacation', dna: { budget: 0.05, energy: 0.4 } },
    ],
  },
  {
    id: 'people',
    prompt: 'Strangers on a trip are:',
    answers: [
      { label: 'Future friends, we are getting dinner', dna: { social: 1.0, energy: 0.7 } },
      { label: 'Fine in small doses', dna: { social: 0.5 } },
      { label: 'Why I picked the quiet resort', dna: { social: 0.1, energy: 0.3 } },
      { label: 'Great if they know where the party is', dna: { social: 0.9, energy: 0.95, budget: 0.5 } },
    ],
  },
  {
    id: 'food',
    prompt: 'Eating abroad, you are:',
    answers: [
      { label: 'Whatever is grilling in that alley, yes', dna: { adventure: 0.9, cultural: 0.9, budget: 0.8 } },
      { label: 'Booked the tasting menu two months ago', dna: { cultural: 0.8, structure: 0.8, budget: 0.2 } },
      { label: 'Local classics, nothing too wild', dna: { cultural: 0.6, structure: 0.5 } },
      { label: 'Food is fuel, the day is for doing', dna: { energy: 0.8, adventure: 0.6, cultural: 0.2 } },
    ],
  },
  {
    id: 'pace',
    prompt: 'Trip pace:',
    answers: [
      { label: 'Five cities, one week, sleep at home', dna: { energy: 1.0, adventure: 0.7, structure: 0.5 } },
      { label: 'One base, day trips when inspired', dna: { energy: 0.55, structure: 0.5 } },
      { label: 'Slow mornings, no alarms, zero agenda', dna: { energy: 0.15, structure: 0.2 } },
      { label: 'Busy days, lazy evenings', dna: { energy: 0.7, structure: 0.6 } },
    ],
  },
  {
    id: 'surprise',
    prompt: 'Not knowing your destination until departure day sounds:',
    answers: [
      { label: 'Like the best idea I have ever heard', dna: { adventure: 1.0, structure: 0.1 } },
      { label: 'Exciting, as long as the logistics are handled', dna: { adventure: 0.7, structure: 0.7 } },
      { label: 'Terrifying but I would try it once', dna: { adventure: 0.45, structure: 0.6 } },
      { label: 'I would need the packing list well in advance', dna: { structure: 0.9, adventure: 0.35 } },
    ],
  },
  {
    id: 'trophy',
    prompt: 'You come home happiest with:',
    answers: [
      { label: 'A story nobody believes', dna: { adventure: 0.95, social: 0.7, energy: 0.8 } },
      { label: 'A camera roll of places most people never see', dna: { adventure: 0.7, cultural: 0.7 } },
      { label: 'New friends in three countries', dna: { social: 1.0, energy: 0.7 } },
      { label: 'An actual tan and a lower resting heart rate', dna: { energy: 0.2, structure: 0.4 } },
    ],
  },
  {
    id: 'passport',
    prompt: 'Passport status:',
    isPassport: true,
    answers: [
      { label: 'Valid and hungry for stamps', passport: 'valid', dna: { adventure: 0.6 } },
      { label: 'Valid but barely used', passport: 'valid', dna: { adventure: 0.4 } },
      { label: 'Expired or in progress', passport: 'none', dna: {} },
      { label: 'No passport yet, keep me domestic', passport: 'none', dna: {} },
    ],
  },
]

export const archetypes = [
  { key: 'trailblazer', name: 'The Trailblazer', profile: { adventure: 0.95, social: 0.5, structure: 0.25, cultural: 0.5, budget: 0.6, energy: 0.9 }, tagline: 'You collect summits, not souvenirs. The itinerary is a dare.' },
  { key: 'culture-hound', name: 'The Culture Hound', profile: { adventure: 0.45, social: 0.5, structure: 0.65, cultural: 0.95, budget: 0.5, energy: 0.6 }, tagline: 'You travel to taste, hear, and stand inside history.' },
  { key: 'socialite', name: 'The Socialite', profile: { adventure: 0.55, social: 0.95, structure: 0.3, cultural: 0.6, budget: 0.55, energy: 0.9 }, tagline: 'The destination is the people. The night is young everywhere.' },
  { key: 'sunseeker', name: 'The Sunseeker', profile: { adventure: 0.3, social: 0.5, structure: 0.45, cultural: 0.35, budget: 0.45, energy: 0.2 }, tagline: 'You measure trips in sunsets and naps. Elite recovery.' },
  { key: 'architect', name: 'The Architect', profile: { adventure: 0.35, social: 0.4, structure: 0.95, cultural: 0.7, budget: 0.45, energy: 0.55 }, tagline: 'Your trips run like Swiss rail. Serendipity, but scheduled.' },
  { key: 'free-spirit', name: 'The Free Spirit', profile: { adventure: 0.8, social: 0.7, structure: 0.1, cultural: 0.7, budget: 0.8, energy: 0.75 }, tagline: 'One-way tickets and open questions. The plan is no plan.' },
  { key: 'luxe-nomad', name: 'The Luxe Nomad', profile: { adventure: 0.45, social: 0.6, structure: 0.7, cultural: 0.6, budget: 0.1, energy: 0.55 }, tagline: 'You will try anything once, as long as there is a robe waiting.' },
  { key: 'wanderer', name: 'The Wanderer', profile: { adventure: 0.65, social: 0.3, structure: 0.35, cultural: 0.75, budget: 0.7, energy: 0.5 }, tagline: 'Quiet streets, long walks, and places that do not perform for tourists.' },
]
