// All authored page copy. Pages and components render from here.
// Style: plain, specific, no dashes used as punctuation.
import { RESTRICTED_NAMES } from './roll.ts';

export type Faq = { q: string; a: string };

export const home = {
  title: 'TripRoll: Spin the Globe, Get a Sealed Surprise Trip',
  description:
    'Set your budget, dates and rules, take the Travel DNA quiz, and roll. TripRoll plans a priced surprise trip and keeps the destination sealed until you fly.',
  kicker: 'Surprise travel, fully planned',
  bandTitle: 'Not knowing is the point.',
  bandBody: 'Pack from a few hints. Land somewhere you did not pick. The planning is done, and the place stays yours to discover.',
  h1: 'Spin the globe. Get a trip.',
  explainer:
    'Set a budget, dates and the rules you will not bend. TripRoll rolls a complete trip inside them and seals the destination until the day you leave.',
  ctaRoll: 'Roll a trip',
  ctaDna: 'Find your Travel DNA',
  exampleNote: 'Example itinerary with sample numbers. Your roll shows your own dates and estimated price.',
  stepsTitle: 'How it works',
  stepsLead: 'Four steps, about five minutes. Rolling is free and nothing is charged.',
  steps: [
    { title: 'Build your Travel DNA', body: 'A short assessment maps six dimensions of how you actually travel: adventure, social, structure, cultural, budget, and energy. Your answers tilt every roll toward places you would enjoy.' },
    { title: 'Set your parameters', body: 'Budget, dates, party size, departure city, passport status and the things you will never do. You set the guardrails and every roll honors them.' },
    { title: 'Roll', body: 'We generate a complete trip: flights, stay, transfers and a few curated experiences, built to your budget. You see the package price, the dates and a packing hint. Not the destination.' },
    { title: 'Find out on departure day', body: 'Tickets and your full itinerary arrive the morning you leave. Serendipity, fully handled. Prefer to know sooner? Choose to see the destination now, or peek early. It is your trip.' },
  ],
  includedTitle: 'What is in a trip',
  includedLead: 'Everything below is planned for you. The one thing you do not get early is the name of the place.',
  included: [
    { title: 'Flights', body: 'Round trip from your departure airport, with the flight time band shown on your itinerary.' },
    { title: 'A place to stay', body: 'Rooms sized to your party, chosen for the destination and your budget.' },
    { title: 'Transfers', body: 'Getting from the airport to your bed and back, handled.' },
    { title: 'A few curated experiences', body: 'A short list picked for the destination and your Travel DNA, not a packed schedule.' },
    { title: 'A packing list', body: 'Five hints on every itinerary that suit the climate and the kind of trip, without naming the place.' },
    { title: 'The reveal', body: 'The destination stays sealed until departure day, unless you choose otherwise.' },
  ],
  rulesTitle: 'You set the rules',
  rulesLead: 'A surprise only works if you trust the guardrails. These are hard limits, not preferences.',
  rules: [
    { title: 'Budget', body: 'Your per-person budget is the package price. If a trip length needs more than you set, we say so and tell you the minimum.' },
    { title: 'Dates', body: 'Exact dates, plus or minus three days, or anytime in a month you pick.' },
    { title: 'Party', body: 'One to eight travelers, with rooms planned to match.' },
    { title: 'Passport', body: 'No valid passport means domestic trips only. No exceptions.' },
    { title: 'Vetoes', body: 'No beaches, no cold, no long-haul over 8 hours, no cities, no remote. Strike what you will not do.' },
    { title: 'Dietary needs', body: 'Add dietary needs when you request a trip. A person reviews them before confirming.' },
  ],
  whereTitle: 'Where we are',
  whereBody: [
    'TripRoll is in beta. Every order is reviewed by a person before any card is charged, and you hear back within 72 hours.',
    'If the trip cannot be built inside your rules, you owe nothing and can roll again free. If it is confirmed, you get the confirmation and packing list right away. Tickets and the full itinerary arrive the morning you leave, or sooner if you chose to reveal. There is no payment step yet: a request is not a booking, and payment is collected only at confirmation.',
  ],
  timelineTitle: 'What happens after you request',
  faqTitle: 'Common questions',
  faqSeeAll: 'Read all questions',
  faqTeaserIndexes: [0, 1, 2],
  finalTitle: 'Ready to see what you roll?',
  finalBody: 'Rolling is free and takes a minute. Take the quiz first if you want the roll to lean toward your taste.',
  galleryTitle: 'Planned around you, not around a place',
  galleryBody: 'Beaches or none, cold or never, cities or quiet. You strike what you will not do, and the roll works inside what is left.',
};

export const faqs: Faq[] = [
  { q: 'What if I hate the destination?', a: 'Before anything is confirmed you can reroll, up to three times per set of rules, and the vetoes you set are hard rules. A person reviews every order. If the trip cannot be built inside your rules, you owe nothing and can roll again free.' },
  { q: 'Is the price real?', a: 'The roll shows one estimated package price per person and in total. It is based on the budget you set. During beta a person reviews every order before any card is charged, and the price becomes final only when your trip is confirmed.' },
  { q: 'Do I pay when I request a trip?', a: 'No. There is no payment step yet. A request is not a booking and collects no payment. Every order is reviewed by a person before any card is charged, and payment is collected only at confirmation.' },
  { q: 'How long until I hear back?', a: 'Within 72 hours. A person reviews your order and either confirms it or tells you it cannot be built inside your rules. If it cannot, you owe nothing and can roll again free.' },
  { q: 'When do I get my tickets and itinerary?', a: 'If your trip is confirmed, you get the confirmation and a packing list right away. Tickets and the full itinerary arrive the morning you leave, or sooner if you chose to reveal.' },
  { q: 'What about passports and visas?', a: 'You tell us your passport status. If you have no valid passport, every roll is domestic. For international destinations, a person checks entry rules and any required travel authorizations for your passport before confirming. Those rules change, so the check happens at review time, not on the roll.' },
  { q: 'Can I use it like a normal booking site?', a: 'Surprise mode is the signature, but you can choose to see the destination now, or reveal it on the roll. Either way a request goes through the same review.' },
  { q: 'How do rerolls and vetoes work?', a: 'A reroll never repeats a destination you have already rolled in the same set. You get three rerolls per set of rules. Vetoes remove whole kinds of trips before the roll happens, so a vetoed place cannot appear. Change any rule and you start a fresh set.' },
  { q: 'What is the Travel DNA quiz for?', a: 'It scores you on six axes: adventure, social, structure, cultural, budget and energy. Rolls are weighted toward destinations that suit your scores. The quiz is optional, and without it every eligible destination is equally likely.' },
  { q: 'Where is my quiz result stored?', a: 'In your own browser, on your device. It is only sent to us if you choose to join the waitlist from the result page or include it with a trip request.' },
  { q: 'Which states can request trips?', a: `TripRoll cannot sell travel to residents of ${RESTRICTED_NAMES} yet. If you live in one of them, you can join the waitlist and we will tell you if that changes. Residents of every other state can request a trip.` },
  { q: 'How far ahead do I need to plan?', a: 'Rolls start at least 14 days from today. That gives a person time to review your order and build the trip.' },
  { q: 'What is included in a trip?', a: 'Round-trip flights, a place to stay, transfers, a few curated experiences, a packing list and the reveal. See the how it works page for the detail.' },
  { q: 'What if I have dietary needs or accessibility requirements?', a: 'Put them in the notes when you request a trip. A person reads them during review, and a destination that cannot meet them is replaced before your trip is confirmed.' },
];

export const howItWorks = {
  title: 'How TripRoll Works: Rules, Roll, Review, Reveal',
  description:
    'The full loop: build your Travel DNA, set hard rules, roll a sealed trip, request it, get a person\'s review within 72 hours, and learn where you are going.',
  h1: 'How TripRoll works',
  lead: 'Serendipity with none of the logistics. Here is the whole loop, including what is estimated and what is confirmed.',
  stepCards: [
    { title: 'Build your Travel DNA', body: 'Ten questions, about two minutes. Six scores and one of eight archetypes, stored in your browser.' },
    { title: 'Set your parameters', body: 'Airport, party, budget, nights, dates, passport and vetoes. Hard rules, not preferences.' },
    { title: 'Roll', body: 'A sealed itinerary with dates, a flight time band, a climate hint and one package price.' },
    { title: 'Reveal', body: 'Tickets and the full itinerary arrive the morning you leave, or sooner if you chose to reveal.' },
  ],
  sections: [
    { id: 'steps', h: 'The four steps', paras: [
      'Build your Travel DNA. Ten questions, about two minutes. The result is six scores from 0 to 1 and one of eight archetypes. It is stored in your browser.',
      'Set your parameters. Departure airport, travelers, budget per person, nights, dates and how flexible they are, passport status, optional vetoes and your reveal preference.',
      'Roll. TripRoll picks a destination that fits every rule and shows you a sealed itinerary: dates, nights, flight time band, a climate hint, a packing hint and one estimated package price. The place stays hidden.',
      'Reveal. The full itinerary and tickets arrive the morning you leave, or sooner if you ask. If you set your reveal preference to show me now, the destination opens right away.',
    ] },
    { id: 'included', h: 'What is included', paras: [
      'Every trip is planned around five parts: round-trip flights, a place to stay sized to your party, transfers between the airport and your stay, a few curated experiences, and a packing list. The sixth part is the reveal.',
      'Carrier, times and the hotel are named in your itinerary once your trip is confirmed. Curated experiences are a short list, not a full schedule. Surprise travel works best with room to wander.',
    ] },
    { id: 'reveal', h: 'How the reveal works', paras: [
      'The destination is stored but not displayed. Your itinerary shows the dates, the price, how long the flight is and what the weather tends to be like, so you can pack and plan time off.',
      'You choose when it opens. Surprise me until departure day keeps it sealed. Show me now opens it immediately. Either way you can peek on the roll screen, and the preference you chose is sent with your request.',
    ] },
    { id: 'pricing', h: 'How pricing and review work', paras: [
      'You set a budget per person. The trip is sold as one package price, shown per person and in total, and labeled an estimate until a person confirms it. The roll only picks destinations that can be built comfortably inside your budget, so the package price is your budget rounded down to the nearest 10 dollars.',
      'Every trip length has a minimum workable budget that depends on your nights, party size and passport. If your budget is below it, TripRoll does not roll. It tells you the minimum so you can adjust.',
      'During beta, when you request a trip a person reviews the order before any card is charged. You hear back within 72 hours. If the trip cannot be built inside your rules, you owe nothing and can roll again free. If it is confirmed, you get the confirmation and packing list, and tickets and the full itinerary arrive the morning you leave. There is no payment step yet. Payment is collected only at confirmation.',
    ] },
    { id: 'rerolls', h: 'How rerolls and vetoes work', paras: [
      'You get three rerolls for each set of rules. A reroll never repeats a destination from the same set. If every destination that fits has been shown, we say so.',
      'Vetoes are applied before the roll. No beaches removes coastal and island destinations. No cold removes cool-climate places. No long-haul removes anything over 8 hours of travel. No cities removes city-centered trips. No remote removes nature and island trips far from town. The catalog flags are approximate, which is why a person reviews every request.',
    ] },
    { id: 'passport', h: 'Passport and visa handling', paras: [
      'If you have no valid passport, or yours has expired, every roll is a domestic destination. If you have a valid passport, international destinations are eligible.',
      'Entry rules, including visas and electronic travel authorizations, depend on your passport and change over time. TripRoll does not show them on the roll. A person checks them during review, and international confirmations list what you need to do.',
    ] },
    { id: 'states', h: 'Where requests are accepted', paras: [
      `TripRoll cannot sell travel to residents of ${RESTRICTED_NAMES} yet. If you live in one of those states you can still roll, and the request step offers the waitlist instead of a trip request.`,
    ] },
  ],
  ctaTitle: 'Try a roll',
  ctaBody: 'It is free, takes a minute and commits you to nothing.',
};

export const travelDna = {
  title: 'Travel DNA Quiz: Six Axes, Eight Travel Archetypes',
  description:
    'Ten questions map how you travel across six axes: adventure, social, structure, cultural, budget and energy. Get your archetype and a sharper roll.',
  h1: 'Find your Travel DNA',
  lead: 'Ten questions, about two minutes. Your answers become six scores and an archetype, and every TripRoll roll leans toward places that suit them.',
  axesTitle: 'The six axes',
  axes: [
    { key: 'adventure', name: 'Adventure', body: 'How much you want the trip to be a little risky, physical or unfamiliar.' },
    { key: 'social', name: 'Social', body: 'How much you want people around you, from strangers to a crowd to a quiet table for two.' },
    { key: 'structure', name: 'Structure', body: 'How much you want a plan: timed reservations at one end, no plan at all at the other.' },
    { key: 'cultural', name: 'Culture', body: 'How much of the trip is about food, history, art and how a place actually lives.' },
    { key: 'budget', name: 'Budget', body: 'A high score means you stretch every dollar and enjoy the hunt. A low score means comfort comes first.' },
    { key: 'energy', name: 'Energy', body: 'The pace you like: slow mornings and a pool, or five things before dinner.' },
  ],
  archetypesTitle: 'The eight archetypes',
  archetypesLead: 'Your six scores are matched to the closest of these.',
  privacyNote: 'Your result stays in your browser. Nothing is sent unless you choose to join the waitlist.',
  resultCta: 'Roll a trip with this DNA',
  emailTitle: 'Get a note when TripRoll opens up',
  emailBody: 'Optional. Leave your email and we will tell you when beta widens. No trip request is created.',
};

export const rollPage = {
  title: 'Roll a Trip: Set Your Rules, Get a Sealed Itinerary',
  description:
    'Set your airport, party, budget, nights, dates, passport and vetoes, then roll. Get a sealed itinerary with an estimated package price. Reveal it when ready.',
  h1: 'Roll a trip',
  lead: 'Set your rules, roll, and see a sealed itinerary with an estimated package price. Reveal the destination when you want, or wait until you fly.',
  below: {
    title: 'What happens when you request a trip',
    body: [
      'You send the roll to us with your name, email and state. During beta, every order is reviewed by a person before any card is charged, and you hear back within 72 hours.',
      `If the trip cannot be built inside your rules, you owe nothing and can roll again free. If it is confirmed, you get the confirmation and packing list, and tickets and the full itinerary arrive the morning you leave, or sooner if you chose to reveal. There is no payment step yet, and a request is not a booking. TripRoll cannot sell travel to residents of ${RESTRICTED_NAMES} yet, and offers the waitlist to them instead.`,
    ],
  },
  noscript: 'The roll needs JavaScript. To hear from us when it opens up for you, leave your details here.',
};

export const about = {
  title: 'About TripRoll: Why Surprise Travel, Fully Planned',
  description:
    'TripRoll exists for people tired of planning and curious about not knowing. Set the rules, let us handle the trip, and find out where you are going.',
  h1: 'Why TripRoll exists',
  paras: [
    'Planning a trip can take longer than taking it. Tabs, comparisons, group chats, a spreadsheet nobody opens twice. By the time everything is booked, some of the excitement is gone.',
    'TripRoll starts from the other end. You decide the things that matter: what you can spend, when you can go, who is coming, what you cannot or will not do. Then a roll does the choosing, and the destination stays sealed until you leave.',
    'Not knowing is the point. There is a particular kind of joy in packing from a few hints, getting to the airport and learning where you are headed. We think it is worth protecting, so the guardrails are hard rules and a person reviews every order before any card is charged.',
    'TripRoll is in beta. Prices are estimates until a person confirms your trip, every order is reviewed within 72 hours, and payment is collected only at confirmation. We would rather be clear about that than overpromise.',
  ],
  ctaTitle: 'See what you roll',
};

export const privacy = {
  title: 'Privacy Policy: What TripRoll Collects and Why',
  description:
    'Plain-language draft of what the TripRoll forms collect, where quiz results are stored, how we use your details and how to ask us to delete them.',
  h1: 'Privacy',
  updated: 'Draft. Last edited with the beta launch.',
  sections: [
    { h: 'What we collect', body: [
      'Trip request form: your name, email, state of residence, notes, and the parameters of your roll (departure airport, travelers, budget, nights, dates, passport status, vetoes, reveal preference, the rolled destination and the estimated price).',
      'Waitlist form: your email, optionally your name and state, and where you signed up from, for example the quiz archetype you got.',
      'We do not collect payment details. We do not ask for passport numbers.',
    ] },
    { h: 'What stays on your device', body: [
      'Your Travel DNA result and your last roll parameters are saved in your browser storage so the site can remember them. We do not receive them unless you submit a form that includes them. Clearing your browser storage removes them.',
    ] },
    { h: 'How we use it', body: [
      'We use form details to review your order, to confirm or decline it by email and to contact you about your request or the waitlist. We do not sell your details.',
    ] },
    { h: 'Where forms go', body: [
      'Forms are processed by our hosting provider, Netlify, and delivered to us. The site does not run advertising trackers.',
    ] },
    { h: 'Deleting your details', body: [
      'Reply to any email we send you and ask us to delete your details, and we will. A contact address for privacy requests will be published here before launch.',
    ] },
  ],
};

export const terms = {
  title: 'Terms of Use: Requests Are Not Bookings',
  description:
    'Plain-language draft terms for TripRoll beta: prices are estimates, a request is not a booking, and payment is collected only when a person confirms your trip.',
  h1: 'Terms',
  sections: [
    { h: 'Beta', body: [
      'TripRoll is in beta. The site may change, and rolls may not match what is available when a person reviews your order.',
    ] },
    { h: 'Prices are estimates', body: [
      'The package price shown on a roll is an estimate. It is not an offer, a live price or a guarantee of availability. It becomes final only when a person confirms your trip.',
    ] },
    { h: 'A request is not a booking', body: [
      'Submitting a trip request asks us to review an order. It does not create a booking or a contract to travel, and there is no payment step yet. Every order is reviewed by a person before any card is charged, and you hear back within 72 hours.',
      'If the trip cannot be built inside your rules, you owe nothing and can roll again free. If your trip is confirmed, you are charged at confirmation and receive the confirmation and a packing list. Tickets and the full itinerary arrive the morning of departure, or sooner if you chose to reveal. Terms of confirmation, including payment and cancellation, will be set out when it is sent.',
    ] },
    { h: 'Where we can sell', body: [
      `TripRoll cannot sell travel to residents of ${RESTRICTED_NAMES} yet. Residents of those states can join the waitlist only.`,
    ] },
    { h: 'Your responsibilities', body: [
      'You are responsible for holding the travel documents your trip needs, including a valid passport and any visas or authorizations, and for giving us accurate information.',
    ] },
    { h: 'Changes', body: [
      'We may update these terms. The version on this page applies when you use the site.',
    ] },
  ],
};

export const notFound = {
  title: 'Page not found: TripRoll',
  description: 'That page does not exist on TripRoll. Roll a trip, take the Travel DNA quiz or read how it works instead.',
};

export const thanks = {
  title: 'Thank you: TripRoll',
  description: 'Thanks. We received your details. For a trip request, a person reviews it within 72 hours and emails you. No card is charged before that review.',
};

export const footerBlurb = 'Surprise trips, fully planned. Beta: every order is reviewed by a person before any card is charged, and a request is not a booking.';
