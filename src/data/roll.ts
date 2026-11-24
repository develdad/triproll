// Roll experience data and UI strings. Components import from here; no copy lives in components.
import type { Veto } from '../lib/dna.ts';

// The single list of blocked residency states. Copy reads RESTRICTED_NAMES, so edit only here.
export const RESTRICTED_STATES = ['CA', 'FL', 'HI', 'IA', 'WA'] as const;
export const RESTRICTED_NAMES = 'California, Florida, Hawaii, Iowa or Washington';

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

export const DELIVERY_OPTIONS = [
  { id: 'sealed', label: 'Keep it sealed until the morning I leave' },
  { id: 'date', label: 'Reveal on a date I choose' },
] as const;

// Beta entry rules, one sentence reused wherever the rule is explained.
export const CABINS = [
  { id: 'economy', label: 'Economy' },
  { id: 'premium', label: 'Premium economy' },
  { id: 'business', label: 'Business' },
] as const;

export const ENTRY_RULE = 'During beta we only plan trips to places a US passport holder can enter with no advance visa, no pre-registration and no required vaccinations. The list grows after beta.';

export const ui = {
  steps: ['Rules', 'Sealed card', 'Request'],
  paramsTitle: 'Set your rules',
  paramsIntro: 'These are hard rules. Your trip stays inside them.',
  sealButton: 'Seal my rules',
  sealing: 'Sealing your rules and counting the places that fit.',
  belowFloor: (min: string) => `This trip needs at least ${min} per person. Raise your budget or shorten the trip.`,
  overCap: 'Beta trips are capped at $10,000 per order. Reduce your travelers or budget, or join the waitlist for larger trips.',
  revealHelp: 'Good for a birthday or an anniversary. The date must be before you leave.',
  tooFew: 'Too few places fit these rules. Loosen a rule, such as a veto, and try again.',
  otherCitizen: 'During beta we plan trips for US passport holders only. Join the waitlist and we will tell you when that changes.',
  estimateNote: 'This is your package price. A person builds and books the real trip after you request it.',
  restrictedNote: `TripRoll cannot sell travel to residents of ${RESTRICTED_NAMES} yet. Choose one of these states and we will add you to the waitlist instead.`,
  submitError: 'That did not send. Check your connection and try again.',
  successTrip: 'Request received. A person reviews it within 72 hours and emails you.',
  successWaitlist: 'You are on the waitlist. We will email you if TripRoll opens to you. No trip request was created.',
  passportLabel: 'My passport is valid for at least six months after my return date.',
  sealedNote: 'The place stays out of this page on purpose. A person picks it inside your rules after you request.',
  packingNote: 'Your packing list arrives at confirmation.',
};
