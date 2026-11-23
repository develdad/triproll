// Roll experience data and UI strings. Components import from here; no copy lives in components.
import type { Veto } from '../lib/dna.ts';

export const RESTRICTED_STATES = ['CA', 'FL', 'HI', 'WA'] as const;

export const US_STATES: { code: string; name: string }[] = [
  ['AL', 'Alabama'], ['AK', 'Alaska'], ['AZ', 'Arizona'], ['AR', 'Arkansas'], ['CA', 'California'], ['CO', 'Colorado'],
  ['CT', 'Connecticut'], ['DE', 'Delaware'], ['DC', 'District of Columbia'], ['FL', 'Florida'], ['GA', 'Georgia'], ['HI', 'Hawaii'],
  ['ID', 'Idaho'], ['IL', 'Illinois'], ['IN', 'Indiana'], ['IA', 'Iowa'], ['KS', 'Kansas'], ['KY', 'Kentucky'], ['LA', 'Louisiana'],
  ['ME', 'Maine'], ['MD', 'Maryland'], ['MA', 'Massachusetts'], ['MI', 'Michigan'], ['MN', 'Minnesota'], ['MS', 'Mississippi'],
  ['MO', 'Missouri'], ['MT', 'Montana'], ['NE', 'Nebraska'], ['NV', 'Nevada'], ['NH', 'New Hampshire'], ['NJ', 'New Jersey'],
  ['NM', 'New Mexico'], ['NY', 'New York'], ['NC', 'North Carolina'], ['ND', 'North Dakota'], ['OH', 'Ohio'], ['OK', 'Oklahoma'],
  ['OR', 'Oregon'], ['PA', 'Pennsylvania'], ['RI', 'Rhode Island'], ['SC', 'South Carolina'], ['SD', 'South Dakota'],
  ['TN', 'Tennessee'], ['TX', 'Texas'], ['UT', 'Utah'], ['VT', 'Vermont'], ['VA', 'Virginia'], ['WV', 'West Virginia'],
  ['WI', 'Wisconsin'], ['WY', 'Wyoming'],
].map(([code, name]) => ({ code, name }));

export const AIRPORTS: string[] = [
  'ATL, Atlanta', 'AUS, Austin', 'BNA, Nashville', 'BOS, Boston', 'BWI, Baltimore', 'CLE, Cleveland', 'CLT, Charlotte',
  'CMH, Columbus', 'CVG, Cincinnati', 'DCA, Washington Reagan', 'DEN, Denver', 'DFW, Dallas Fort Worth', 'DTW, Detroit',
  'EWR, Newark', 'FLL, Fort Lauderdale', 'HNL, Honolulu', 'HOU, Houston Hobby', 'IAD, Washington Dulles', 'IAH, Houston Bush',
  'IND, Indianapolis', 'JFK, New York JFK', 'LAS, Las Vegas', 'LAX, Los Angeles', 'LGA, New York LaGuardia', 'MCO, Orlando',
  'MDW, Chicago Midway', 'MEM, Memphis', 'MIA, Miami', 'MKE, Milwaukee', 'MSP, Minneapolis', 'MSY, New Orleans', 'OAK, Oakland',
  'ORD, Chicago O\'Hare', 'PDX, Portland', 'PHL, Philadelphia', 'PHX, Phoenix', 'PIT, Pittsburgh', 'RDU, Raleigh Durham',
  'SAN, San Diego', 'SEA, Seattle', 'SFO, San Francisco', 'SJC, San Jose', 'SLC, Salt Lake City', 'SMF, Sacramento',
  'STL, St. Louis', 'TPA, Tampa', 'ANC, Anchorage',
];

export const VETOES: { id: Veto; label: string }[] = [
  { id: 'no-beaches', label: 'No beaches' },
  { id: 'no-cold', label: 'No cold' },
  { id: 'no-long-haul', label: 'No long-haul over 8 hours' },
  { id: 'no-cities', label: 'No cities' },
  { id: 'no-remote', label: 'No remote' },
];

export const BAND_LABEL = { short: 'Short haul, under 4 h', medium: 'Medium haul, 4 to 8 h', long: 'Long haul, over 8 h' } as const;

export const ui = {
  steps: ['Parameters', 'Roll', 'Request'],
  paramsTitle: 'Set the rules',
  paramsIntro: 'These are hard rules. Every roll stays inside them.',
  rollButton: 'Roll the trip',
  rolling: 'Rolling. Pricing a trip inside your rules.',
  rerollLimit: 'You have used all 3 rerolls for these rules. Change a rule to start a fresh set of rolls.',
  exhausted: 'Every destination that fits your rules has been rolled already. Loosen a rule to see more.',
  noMatch: 'No destination fits all of your rules. Remove a veto or change your passport status.',
  overBudget: (min: string) => `Nothing fits that budget with these rules. The lowest workable budget is about ${min} per person.`,
  estimateNote: 'Estimate only. Not live pricing. A person confirms real flight and hotel prices and emails you a quote before anything is charged.',
  revealNote: 'Peeking is your call. The reveal preference you chose is sent with your request.',
  restrictedNote: 'TripRoll cannot sell travel to residents of California, Florida, Hawaii or Washington yet. Choose one of these and we will add you to the waitlist instead of taking a trip request.',
  successTrip: 'Request received. A person reviews your roll, prices it against real flight and hotel inventory, and emails you a firm quote. Nothing is charged until you approve that quote.',
  successWaitlist: 'You are on the waitlist. We will email you if TripRoll opens to residents of your state. No trip request was created.',
  submitError: 'That did not send. Check your connection and try again.',
};
