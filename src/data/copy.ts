// All authored page copy. Pages and components render from here.
// Style: plain, specific, short sentences, second person, one idea per sentence. No dashes used as punctuation.
// Payment wording comes from ./payment.ts (one module, two variants). Never type payment wording here.
import { ENTRY_RULE, RESTRICTED_NAMES } from './roll.ts';
import { pay, requestSteps, stepText } from './payment.ts';

export type Faq = { q: string; a: string };

export const home = {
  title: 'TripRoll: Spin the Globe, Get a Sealed Surprise Trip',
  description:
    'Set your budget, dates and rules, take the Travel DNA assessment, and request a surprise trip. A person plans it and keeps the place sealed until you fly.',
  kicker: 'Surprise travel, fully planned',
  bandTitle: 'Not knowing is the point.',
  bandBody: 'Pack from a few hints. Land somewhere you did not pick. The planning is done. The place is yours to discover.',
  h1: 'Spin the globe. Get a trip.',
  explainer:
    'Set a budget, dates and the rules you will not bend. A person builds a complete trip inside them. The place stays sealed until you choose to know.',
  ctaRoll: 'Roll a trip',
  ctaDna: 'Find your Travel DNA',
  exampleNote: 'Example sealed card with sample numbers. Yours shows your own dates and price.',
  stepsTitle: 'How it works',
  stepsLead: 'Four steps, about ten minutes. Nothing is charged today.',
  steps: [
    { title: 'Build your Travel DNA', body: 'Answer 24 short scenarios. We score eight things about how you travel. Then tell your planner what matters to you.' },
    { title: 'Set your rules', body: 'Choose your budget, dates, party size and airport. Add the things you will never do. Every trip stays inside them.' },
    { title: 'Seal your card', body: 'You see your dates, your package price and how many places fit your rules. You do not see the place.' },
    { title: 'Request your trip', body: 'A person builds and books the real trip within 72 hours. You choose when we tell you where you are going.' },
  ],
  includedTitle: 'What is in a trip',
  includedLead: 'Everything below is planned for you. The one thing you do not get early is the name of the place.',
  included: [
    { title: 'Flights', body: 'Round trip from your departure airport.' },
    { title: 'A place to stay', body: 'Rooms sized to your party. Chosen for the place and your budget.' },
    { title: 'Transfers', body: 'Airport to your bed and back. Handled.' },
    { title: 'A few curated experiences', body: 'A short list picked for the place and your Travel DNA. Not a packed schedule.' },
    { title: 'A packing list', body: 'It arrives when your trip is confirmed. It fits the climate and the kind of trip.' },
    { title: 'The reveal', body: 'Choose when you find out. At confirmation, or the morning you leave.' },
  ],
  rulesTitle: 'You set the rules',
  rulesLead: 'A surprise only works if you trust the guardrails. These are hard limits. They are not preferences.',
  rules: [
    { title: 'Budget', body: 'Your per-person budget is the package price. If a trip needs more, we tell you the minimum.' },
    { title: 'Dates', body: 'Pick exact dates, plus or minus three days, or anytime in a month.' },
    { title: 'Party', body: 'One to eight travelers. Rooms planned to match.' },
    { title: 'Passport', body: 'No valid passport means domestic trips only.' },
    { title: 'Vetoes', body: 'No beaches, no cold, no long-haul over 8 hours, no cities, no remote. Strike what you will not do.' },
    { title: 'Entry rules', body: ENTRY_RULE },
  ],
  whereTitle: 'Where we are',
  whereBody: [
    'TripRoll is in beta. A person reviews every request.',
    'A request is not a booking. ' + pay.noCharge,
  ],
  timelineTitle: 'What happens when you request',
  faqTitle: 'Common questions',
  faqSeeAll: 'Read all questions',
  faqTeaserIndexes: [0, 1, 2],
  finalTitle: 'Ready to seal your rules?',
  finalBody: 'It takes a few minutes and nothing is charged today. Take the assessment first so your planner knows how you travel.',
  galleryTitle: 'Planned around you, not around a place',
  galleryBody: 'Beaches or none. Cold or never. Cities or quiet. You strike what you will not do. The trip works inside what is left.',
};

export const faqs: Faq[] = [
  { q: 'What if I hate the place you pick?', a: 'Your vetoes are hard rules. A person only plans inside them. They also read your Travel DNA and planner brief. If they cannot build a trip you would want, they tell you within 72 hours. You owe nothing.' },
  { q: 'Is the price real?', a: 'Your budget is the package price. You see it per person and in total. The price is final when a person confirms your trip.' },
  { q: 'Do I pay when I request a trip?', a: pay.today + ' ' + pay.whenCharged + ' A request is not a booking.' },
  { q: 'How long until I hear back?', a: 'Within 72 hours. A person reviews your request. They confirm we can build it inside your rules, or they tell you we cannot. If we cannot, you owe nothing.' },
  { q: 'When do I find out where I am going?', a: 'You choose. Keep it sealed until the morning you leave, or pick a reveal date before you go. Either way it happens only after the trip is confirmed.' },
  { q: 'What about passports, visas and vaccines?', a: ENTRY_RULE + ' You tell us your passport status. Your passport must be valid for at least six months after your return date. A person confirms the entry rules against official government sources before every booking.' },
  { q: 'Who can request a trip during beta?', a: 'US passport holders. If you hold another passport, join the waitlist and we will tell you when that changes.' },
  { q: 'Why can you not tell me the place now?', a: 'A person picks and books your trip after you request it. The site does not choose a place for you. Your card shows how many places fit your rules and a broad climate range.' },
  { q: 'What is the Travel DNA assessment for?', a: 'It scores you on eight things: pace, novelty, setting, comfort, social, structure, culture and activity. You can add a planner brief with food needs, hard no\'s and more. A person reads it when building your trip.' },
  { q: 'Where is my assessment result stored?', a: 'In your own browser. We only receive it if you join the waitlist from the result page or send it with a trip request.' },
  { q: 'Which states can request trips?', a: `TripRoll cannot sell travel to residents of ${RESTRICTED_NAMES} yet. If you live in one of them, join the waitlist. We will tell you if that changes. Residents of every other state can request a trip.` },
  { q: 'How far ahead do I need to plan?', a: 'Start at least 14 days from today. That gives a person time to build your trip.' },
  { q: 'What is included in a trip?', a: 'Round-trip flights, a place to stay, transfers, a few curated experiences, a packing list and the reveal. The how it works page has the detail.' },
  { q: 'What if I have food or access needs?', a: 'Add them to your planner brief or the notes on your request. A person reads them during review. They plan around them or tell you we cannot.' },
];

export const howItWorks = {
  title: 'How TripRoll Works: Rules, Seal, Request, Reveal',
  description:
    'The full loop: build your Travel DNA, set hard rules, seal your card, request the trip, hear back from a person within 72 hours, and learn where you are going.',
  h1: 'How TripRoll works',
  lead: 'Serendipity with none of the logistics. Here is the whole loop.',
  stepCards: [
    { title: 'Build your Travel DNA', body: '24 scenarios and an optional brief. Eight scores and one of eight archetypes. Stored in your browser.' },
    { title: 'Set your rules', body: 'Airport, party, budget, nights, dates, passport and vetoes. Hard rules, not preferences.' },
    { title: 'Seal your card', body: 'Your dates, your package price and how many places fit. The place stays out.' },
    { title: 'Request and reveal', body: 'A person builds your trip. You choose when you find out where.' },
  ],
  sections: [
    { id: 'steps', h: 'The four steps', paras: [
      'Build your Travel DNA. Answer 24 short scenarios. You get eight scores and one of eight archetypes. Then fill in the planner brief if you want to. Every part of it is optional.',
      'Set your rules. Choose your departure airport, travelers, budget per person, nights and dates. Add your passport status and any vetoes.',
      'Seal your card. You see your dates, your package price and how many places fit your rules. You also see a broad climate range. You do not see the place.',
      'Request your trip. A person builds and books it inside your rules. You choose when we tell you where you are going.',
    ] },
    { id: 'included', h: 'What is included', paras: [
      'Every trip has round-trip flights, a place to stay and transfers. It also has a few curated experiences and a packing list.',
      'Carrier, times and the hotel are named in your itinerary. Experiences are a short list. Surprise travel works best with room to wander.',
    ] },
    { id: 'reveal', h: 'How the reveal works', paras: [
      'The site never picks or stores a place for you. A person picks it after you request the trip.',
      'You choose when you find out. Keep it sealed until the morning you leave, or pick a reveal date before you go. Both happen only after the trip is confirmed.',
    ] },
    { id: 'pricing', h: 'How pricing and review work', paras: [
      'Your budget per person is the package price. You see it per person and in total. It is your budget rounded down to the nearest 10 dollars.',
      'Every trip length has a minimum workable budget. It depends on your nights, party size and rules. If you are below it, we tell you the minimum.',
      'A person reviews every request. ' + requestSteps.map(stepText).join(' '),
    ] },
    { id: 'vetoes', h: 'How vetoes work', paras: [
      'Vetoes are hard rules. No beaches removes coastal and island places. No cold removes cool-climate places. No long-haul removes anything over 8 hours of travel.',
      'No cities removes city-centered trips. No remote removes nature and island trips far from town. The catalog flags are approximate. That is why a person reviews every request.',
    ] },
    { id: 'passport', h: 'Passports and entry rules', paras: [
      ENTRY_RULE,
      'Your passport must be valid for at least six months after your return date. If you have no valid passport, we plan domestic trips only.',
      'A person confirms the entry rules against official government sources before every booking. During beta we serve US passport holders only.',
    ] },
    { id: 'states', h: 'Where requests are accepted', paras: [
      `TripRoll cannot sell travel to residents of ${RESTRICTED_NAMES} yet. If you live in one of those states, the request step offers the waitlist.`,
    ] },
  ],
  ctaTitle: 'Seal your rules',
  ctaBody: 'It takes a few minutes. Nothing is charged today.',
};

export const travelDna = {
  title: 'Travel DNA Assessment: Eight Axes, Eight Archetypes',
  description:
    '24 short scenarios score how you travel on eight axes. Add a planner brief. Get your archetype, a radar and a profile a person reads when building your trip.',
  h1: 'Find your Travel DNA',
  lead: 'Twenty-four short scenarios, then an optional brief. You get eight scores, an archetype and a profile your planner reads when building your trip.',
  axesTitle: 'The eight axes',
  axes: [
    { key: 'pace', name: 'Pace', body: 'Unhurried to packed. How much you want to fit into a day.' },
    { key: 'novelty', name: 'Novelty', body: 'Familiar comforts to far outside your comfort zone. How far from home you want to feel.' },
    { key: 'setting', name: 'Setting', body: 'Wild nature to big city. Where you feel most like yourself.' },
    { key: 'comfort', name: 'Comfort', body: 'Rugged to luxe. How much ease you want from the trip.' },
    { key: 'social', name: 'Social', body: 'Solitude to in the crowd. How much company you want.' },
    { key: 'structure', name: 'Structure', body: 'Wander to planned. How much is decided before you go.' },
    { key: 'culture', name: 'Culture and food depth', body: 'Casual to deep dive. How far into local food, history and craft you go.' },
    { key: 'activity', name: 'Activity', body: 'Lounging to physically demanding. How much effort you want to put in.' },
  ],
  briefTitle: 'The planner brief',
  briefBody: [
    'After the scenarios you can tell your planner things directly. Every question is optional.',
    'You can share your climate preference, your longest flight and your food needs. You can add access needs, your lodging style and what makes a trip great for you.',
    'You can also list your hard no\'s, places you have already been and who you travel with. Add an occasion and anything else your planner should know.',
    'A person reads your profile and brief when building your trip.',
  ],
  archetypesTitle: 'The eight archetypes',
  archetypesLead: 'Your eight scores are matched to the closest of these.',
  privacyNote: 'Your result stays in your browser. We only receive it if you join the waitlist or send it with a trip request.',
  humanNote: 'A person reads this profile when building your trip.',
  resultCta: 'Set your rules and seal a card',
  emailTitle: 'Get a note when TripRoll opens up',
  emailBody: 'Optional. Leave your email and we will tell you when beta widens. Your profile goes with it. No trip request is created.',
};

export const rollPage = {
  title: 'Roll a Trip: Set Your Rules, Get a Sealed Card',
  description:
    'Set your airport, party, budget, nights, dates, passport and vetoes. Seal your card, then request the trip. A person builds it and you choose when you find out.',
  h1: 'Roll a trip',
  lead: 'Set your rules and seal your card. You see your dates, your package price and how many places fit. A person builds the trip after you request it.',
  below: {
    title: 'What happens when you request a trip',
    steps: requestSteps,
    body: [
      ENTRY_RULE,
      `TripRoll cannot sell travel to residents of ${RESTRICTED_NAMES} yet. We offer them the waitlist instead.`,
    ],
  },
  noscript: 'The roll needs JavaScript. To hear from us when it opens up for you, leave your details here.',
};

export const about = {
  title: 'About TripRoll: Why Surprise Travel, Fully Planned',
  description:
    'TripRoll exists for people tired of planning and curious about not knowing. Set the rules, let a person plan the trip, and find out where you are going.',
  h1: 'Why TripRoll exists',
  paras: [
    'Planning a trip can take longer than taking it. There are tabs, comparisons and group chats. There is a spreadsheet nobody opens twice. By the time it is booked, some of the excitement is gone.',
    'TripRoll starts from the other end. You decide what matters. What you can spend. When you can go. Who is coming. What you will not do.',
    'Then a person plans the trip inside your rules. They read your Travel DNA and your planner brief. The place stays sealed until you choose to know.',
    'Not knowing is the point. There is a particular joy in packing from a few hints and learning where you are headed. We think it is worth protecting.',
    'TripRoll is in beta. A person reviews every request. ' + pay.noCharge + ' We would rather be clear than overpromise.',
  ],
  ctaTitle: 'Seal your rules',
};

export const privacy = {
  title: 'Privacy Policy: What TripRoll Collects and Why',
  description:
    'Plain-language draft of what the TripRoll forms collect, where your Travel DNA is stored, how we use your details and how to ask us to delete them.',
  h1: 'Privacy',
  updated: 'Draft. Last edited with the beta launch.',
  sections: [
    { h: 'What we collect', body: [
      'Trip request form: your name, email, state, notes and the rules you set. That means airport, travelers, budget, nights, dates, citizenship, passport status, vetoes and when you want to be told the place. It also includes your package price.',
      'If you took the assessment, a request can include your Travel DNA scores, your archetype and your planner brief. The brief can include food needs, access needs, places you have been and anything you wrote.',
      'Waitlist form: your email, optionally your name and state, and where you signed up from. It can include your Travel DNA profile if you saved a result.',
      'We do not collect payment details. We do not ask for passport numbers.',
    ] },
    { h: 'What stays on your device', body: [
      'Your Travel DNA profile and your last rules are saved in your browser storage. We do not receive them unless you submit a form that includes them. Clearing your browser storage removes them.',
    ] },
    { h: 'How we use it', body: [
      'We use form details to review your request and to confirm or decline it by email. A person reads your profile and brief when building your trip. We do not sell your details.',
    ] },
    { h: 'Where forms go', body: [
      'Forms are processed by our hosting provider, Netlify, and delivered to us. The site does not run advertising trackers.',
    ] },
    { h: 'Deleting your details', body: [
      'Reply to any email we send you and ask us to delete your details. We will. A contact address for privacy requests will be published here before launch.',
    ] },
  ],
};

export const terms = {
  title: 'Terms of Use: Requests Are Not Bookings',
  description:
    'Plain-language draft terms for TripRoll beta: your budget is the package price, a request is not a booking, and a person confirms every trip before you pay.',
  h1: 'Terms',
  sections: [
    { h: 'Beta', body: [
      'TripRoll is in beta. The site may change. A person may find that your rules cannot be met when they review your request.',
    ] },
    { h: 'Package price', body: [
      'Your stated budget, rounded down to the nearest 10 dollars, is the package price. The price is final when a person confirms your trip.',
    ] },
    { h: 'A request is not a booking', body: [
      'A request asks us to build a trip inside your rules. It does not create a booking or a contract to travel. A person reviews it within 72 hours.',
      requestSteps.map(stepText).join(' '),
      'Terms of confirmation, including payment and cancellation, are set out when we confirm the trip.',
    ] },
    { h: 'Where we can sell', body: [
      `TripRoll cannot sell travel to residents of ${RESTRICTED_NAMES} yet. Residents of those states can join the waitlist only.`,
      ENTRY_RULE,
    ] },
    { h: 'Your responsibilities', body: [
      'You must hold the documents your trip needs. That includes a passport valid for at least six months after your return date. Please give us accurate information.',
    ] },
    { h: 'Changes', body: [
      'We may update these terms. The version on this page applies when you use the site.',
    ] },
  ],
};

export const notFound = {
  title: 'Page not found: TripRoll',
  description: 'That page does not exist on TripRoll. Roll a trip, take the Travel DNA assessment or read how it works instead.',
};

export const thanks = {
  title: 'Thank you: TripRoll',
  description: 'Thanks. We received your details. For a trip request, a person reviews it within 72 hours and emails you. ' + pay.today,
};

export const footerBlurb = 'Surprise trips, fully planned. Beta: a person reviews every request, and a request is not a booking. ' + pay.today;
