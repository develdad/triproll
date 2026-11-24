// Travel DNA assessment (v3). Part 1: 24 scenario questions in 8 named sections, scored on eight axes.
// Part 2: the planner brief (direct inputs, all skippable). Answers carry axis values on a 0 to 1 scale.
// Axis poles (0 to 1): pace unhurried to packed; novelty familiar comforts to far outside the comfort zone;
// setting wild nature to big city; comfort rugged to luxe; social solitude to in the crowd;
// structure wander to planned; culture casual to deep dive; activity lounging to physically demanding.
import type { Axis, Dna } from './destinations.ts';
export type { Axis, Dna };

export type Answer = { label: string; dna: Partial<Dna> };
export type Question = { id: string; prompt: string; answers: Answer[] };
export type Section = { id: string; name: string; blurb: string; questions: Question[] };
export type Archetype = { key: string; name: string; profile: Dna; tagline: string; description: string };

export const AXES: Axis[] = ['pace', 'novelty', 'setting', 'comfort', 'social', 'structure', 'culture', 'activity'];
export const AXIS_META: Record<Axis, { name: string; low: string; high: string; lowDesc: string; highDesc: string; what: string }> = {
  pace: { name: 'Pace', low: 'Unhurried', high: 'Packed', lowDesc: 'You like slow mornings and room to breathe.', highDesc: 'You like full days and a lot seen.', what: 'How much you want to fit into a day.' },
  novelty: { name: 'Novelty', low: 'Familiar comforts', high: 'Far outside your comfort zone', lowDesc: 'You like places that feel easy from the first hour.', highDesc: 'You like places that stretch you and surprise you.', what: 'How far from home you want to feel.' },
  setting: { name: 'Setting', low: 'Wild nature', high: 'Big city', lowDesc: 'You feel best with open land, water and quiet.', highDesc: 'You feel best with streets, density and energy.', what: 'Whether the trip lives in nature or in a city.' },
  comfort: { name: 'Comfort', low: 'Rugged', high: 'Luxe', lowDesc: 'You trade comfort for access and a good story.', highDesc: 'You want great beds, easy transfers and no friction.', what: 'How much ease you want from the trip.' },
  social: { name: 'Social', low: 'Solitude', high: 'In the crowd', lowDesc: 'You recharge with few people around.', highDesc: 'You recharge around people, noise and strangers.', what: 'How much company you want on a trip.' },
  structure: { name: 'Structure', low: 'Wander', high: 'Planned', lowDesc: 'You prefer to leave room for whatever turns up.', highDesc: 'You prefer to know what happens next.', what: 'How much of the trip is decided in advance.' },
  culture: { name: 'Culture and food depth', low: 'Casual', high: 'Deep dive', lowDesc: 'You enjoy local color without making it the point.', highDesc: 'You want history, food and craft to be the point.', what: 'How deep you go into how a place lives and eats.' },
  activity: { name: 'Activity', low: 'Lounging', high: 'Physically demanding', lowDesc: 'You want to rest and be looked after.', highDesc: 'You want to move, climb, paddle and earn the view.', what: 'How much physical effort you want.' },
};

const K: Record<string, Axis> = { p: 'pace', n: 'novelty', s: 'setting', c: 'comfort', o: 'social', t: 'structure', u: 'culture', a: 'activity' };
// Compact weights: 'p.8 n.8 t1' means pace 0.8, novelty 0.8, structure 1.
function w(spec: string): Partial<Dna> {
  const out: Partial<Dna> = {};
  for (const tok of spec.split(' ')) {
    const m = tok.match(/^([pnscotua])(\d*\.?\d+)$/);
    if (!m) throw new Error(`bad weight token "${tok}"`);
    out[K[m[1]]] = Number(m[2]);
  }
  return out;
}
const q = (id: string, prompt: string, a: [string, string][]): Question => ({ id, prompt, answers: a.map(([label, spec]) => ({ label, dna: w(spec) })) });

export const sections: Section[] = [
  { id: 'landing', name: 'Landing', blurb: 'The first hours and the daily rhythm.', questions: [
    q('first-hour', 'You just landed somewhere new. First move?', [
      ['Drop the bags and start walking, no map', 'p.8 n.8 t.1 a.7'],
      ['Find the food spot locals actually go to', 'u.9 o.6 p.6 n.5'],
      ['Check in, unpack, review the plan for tomorrow', 't.95 p.3 n.2 a.2'],
      ['Pool. Drink. Horizontal by 3pm.', 'p.1 a.05 c.7 t.3'],
    ]),
    q('alarm', 'Your alarm goes off at 6am on vacation. You:', [
      ['Are already up. The sunrise hike is booked.', 'a.95 p.9 t.8'],
      ['Get up for coffee, then see what the day offers', 'p.5 t.3 a.4'],
      ['Snooze. Nobody is timing you.', 'p.1 a.1 t.1'],
      ['Wonder why there is an alarm at all', 'p.05 t.05 a.1 c.6'],
    ]),
    q('pace', 'Trip pace:', [
      ['Five cities, one week, sleep at home', 'p1 n.7 a.7 t.5'],
      ['One base, day trips when inspired', 'p.5 t.5'],
      ['Slow mornings, no alarms, zero agenda', 'p.1 t.15 a.15'],
      ['Busy days, lazy evenings', 'p.7 t.6 a.5'],
    ]),
  ] },
  { id: 'comfort-zone', name: 'Comfort zone', blurb: 'How far from home you want to feel.', questions: [
    q('surprise', 'Not knowing your destination until you are on the way sounds:', [
      ['Like the best idea I have ever heard', 'n1 t.1'],
      ['Exciting, as long as the logistics are handled', 'n.7 t.7'],
      ['Terrifying, but I would try it once', 'n.45 t.6'],
      ['Like I would need the packing list well in advance', 't.9 n.2'],
    ]),
    q('language', 'Nobody around you speaks a language you know, and the sign disagrees with the map. You:', [
      ['Love it and follow the street', 'n.95 t.1 o.5'],
      ['Ask a local and laugh about it', 'n.7 o.8'],
      ['Pull up translate and a route', 'n.4 t.7'],
      ['Head to the nearest hotel front desk', 'n.1 c.8 t.7'],
    ]),
    q('food', 'Eating abroad, you are:', [
      ['Whatever is grilling in that alley, yes', 'n.9 u.9 c.2'],
      ['Booked the tasting menu two months ago', 'u.8 t.8 c.9'],
      ['Local classics, nothing too wild', 'u.6 n.4 t.5'],
      ['Food is fuel, the day is for doing', 'u.1 a.8 p.7'],
    ]),
    q('repeat', 'You can go back to a place you love for the fourth time, or go somewhere you cannot pronounce.', [
      ['Somewhere new, no question', 'n1'],
      ['Somewhere new, with a good guide', 'n.7 t.7'],
      ['Back to the place I love', 'n.1 c.6'],
      ['Back, but a new hotel this time', 'n.3 c.7 t.5'],
    ]),
  ] },
  { id: 'setting', name: 'Setting', blurb: 'Where you feel most like yourself.', questions: [
    q('ideal-day', 'Perfect trip day looks like:', [
      ['Summit hike, cliff jump, or something with a waiver', 'a1 s.05 n.7 p.8'],
      ['Museums, old neighborhoods, and a long dinner', 'u1 s.9 a.4 p.5'],
      ['Beach until golden hour, then great seafood', 'a.15 p.2 s.35 c.6'],
      ['Wander, meet people, say yes to whatever happens', 'o.9 t.05 n.7 s.8'],
    ]),
    q('window', 'The room has one window. What is outside it?', [
      ['Mountains and nothing else', 's0 o.1'],
      ['The ocean', 's.3 p.2'],
      ['Old town rooftops and bell towers', 's.8 u.8'],
      ['Neon, traffic and a street that never sleeps', 's1 o.8 p.9'],
    ]),
    q('last-night', 'It is 9pm on the last night. Where are you?', [
      ['On a rooftop in the middle of the city', 's.95 o.8 p.8'],
      ['By a fire with stars and no signal', 's0 o.3 a.5'],
      ['At a long table with people you met this week', 'o.95 u.6'],
      ['On a quiet balcony with a book', 'o.05 p.1'],
    ]),
    q('people', 'Strangers on a trip are:', [
      ['Future friends, we are getting dinner', 'o1 p.7'],
      ['Fine in small doses', 'o.5'],
      ['Why I picked the quiet place', 'o.1 p.2 c.7'],
      ['Great if they know where the party is', 'o.95 p.9 s.8'],
    ]),
  ] },
  { id: 'plan', name: 'The plan', blurb: 'How much gets decided ahead of time.', questions: [
    q('planning', 'Your relationship with itineraries:', [
      ['Spreadsheet with timestamps. Obviously.', 't1'],
      ['A short list of must-dos, the rest is open', 't.6 n.5'],
      ['I book the flight. The trip plans itself.', 't.15 n.8'],
      ['Someone else plans, I show up', 't.4 p.4 o.6'],
    ]),
    q('dinner', 'How was tonight\'s dinner decided?', [
      ['Booked six weeks ago', 't1 c.7 u.7'],
      ['I looked at the map an hour ago and picked one', 't.4'],
      ['We walked until something smelled right', 't.05 n.6'],
      ['The group argued until 10pm and we ate anything', 't.15 o.7'],
    ]),
    q('delay', 'Your flight is delayed four hours. You:', [
      ['Rebuild the schedule on the spot', 't.95 p.7'],
      ['Shrug and find a bar', 't.1 o.7 p.4'],
      ['Find a lounge and nap', 'p.1 c.85 a.05'],
      ['Head into the nearest town if there is time', 'n.8 t.3 a.6'],
    ]),
    q('density', 'On a trip you love, how many booked things fit in a day?', [
      ['One, with plenty of air around it', 'p.1 t.5 a.2'],
      ['Two or three, with breaks', 'p.5 t.7'],
      ['Four or five. I am here for it.', 'p.95 t.8 a.7'],
      ['None. I would rather just look around.', 'p.1 t.05'],
    ]),
  ] },
  { id: 'table', name: 'Table and culture', blurb: 'What you want to learn and taste.', questions: [
    q('festival', 'A local festival you did not know about is happening in the street. You:', [
      ['Jump in and join the procession', 'u.9 o.9 n.8'],
      ['Watch from a cafe table', 'u.6 o.3 p.2'],
      ['Read up on what it means first', 'u1 t.7'],
      ['Skip it. The beach is waiting.', 'u.05 p.2'],
    ]),
    q('museum', 'A famous museum has a three hour line.', [
      ['Wait. It is why we came.', 'u1 t.8 a.2'],
      ['We booked a timed slot weeks ago', 'u.9 t1'],
      ['Find a small local museum instead', 'u.7 n.6 o.2'],
      ['Skip it. The street is the museum.', 'u.3 t.1 a.5'],
    ]),
    q('trophy', 'You come home happiest with:', [
      ['A story nobody believes', 'n.95 a.7 o.7'],
      ['A camera roll of places most people never see', 'n.7 s.2 u.5'],
      ['New friends in three countries', 'o1 u.6'],
      ['An actual tan and a lower resting heart rate', 'a.1 p.1 c.7'],
    ]),
  ] },
  { id: 'stay', name: 'Stay and spend', blurb: 'Where you sleep and how you get around.', questions: [
    q('money', 'Trip money philosophy:', [
      ['Stretch every dollar, street food over white tablecloths', 'c.1 u.6 n.6'],
      ['Save on the room, splurge on experiences', 'c.35 a.6 n.6'],
      ['Comfort matters, mid-range and no hostels', 'c.7 t.6'],
      ['If I have to look at the price, it is not a vacation', 'c.95 p.3'],
    ]),
    q('bed', 'Pick the bed.', [
      ['A tent under a clear sky', 'c0 s0 a.8'],
      ['A hostel bunk with a great common room', 'c.1 o.9'],
      ['A boutique hotel with character', 'c.7 u.7'],
      ['A suite with a soaking tub', 'c1 p.2 o.2'],
    ]),
    q('transfer', 'Getting between two places four hours apart:', [
      ['Whatever bus or lift is going that way', 'c.05 n.9'],
      ['A regional train with a snack', 'c.5 t.6'],
      ['A private driver', 'c.95 t.7'],
      ['A rental car and a detour or two', 'c.5 t.3 a.5 n.6'],
    ]),
  ] },
  { id: 'energy', name: 'Energy', blurb: 'How much effort you want to put in.', questions: [
    q('hike', 'The trail is described as "strenuous, nine miles".', [
      ['Sign me up', 'a1 p.7'],
      ['One way, then a taxi back', 'a.6 c.6'],
      ['The short version with the view', 'a.35'],
      ['I will meet you at the cafe at the bottom', 'a.05 p.2 c.7'],
    ]),
    q('rain', 'It rains the whole second day.', [
      ['Best day yet. Kayaks and mud.', 'a.95 n.7 c.3'],
      ['A museum and a long lunch', 'u.8 a.2 s.8'],
      ['Stay in, with books and room service', 'p.05 c.85 a.05'],
      ['Reshuffle the plan around it', 't.9 p.5'],
    ]),
    q('last-day', 'It is the last day of a trip you loved. You feel:', [
      ['Wiped out, in the best way', 'a.9 p.9'],
      ['Rested and ready', 'p.2 a.2'],
      ['Like you could start over tomorrow', 'p.6 n.7'],
      ['Already planning the next one', 't.8 n.5'],
    ]),
  ] },
];

// The 8 sections above hold 24 questions. Flat list for scoring.
export const questions: Question[] = sections.flatMap((s) => s.questions);

// ---- Part 2: the planner brief (all optional) ----
export type Brief = {
  climate: string; maxFlight: string; diet: string[]; dietAdventure: string; dietNotes: string; mobility: string[]; mobilityNotes: string;
  lodging: string[]; greats: string[]; greatsText: string; noGos: string[]; noGosText: string;
  visited: string; withWhom: string; notes: string;
};
export const EMPTY_BRIEF: Brief = {
  climate: '', maxFlight: '', diet: [], dietAdventure: '', dietNotes: '', mobility: [], mobilityNotes: '', lodging: [],
  greats: [], greatsText: '', noGos: [], noGosText: '', visited: '', withWhom: '', notes: '',
};
export const briefOptions = {
  climate: ['Warm and sunny', 'Mild', 'Cool', 'Snow is fine', 'No preference'],
  maxFlight: ['Up to 4 hours', 'Up to 8 hours', 'Up to 12 hours', 'No limit'],
  diet: ['Vegetarian', 'Vegan', 'Pescatarian', 'Gluten-free', 'Dairy-free', 'Nut allergy', 'Shellfish allergy', 'Halal', 'Kosher'],
  dietAdventure: ['Familiar foods', 'Local classics', 'Adventurous', 'Anything goes'],
  mobility: ['No needs', 'Limited walking', 'Avoid stairs', 'Mobility device', 'Other'],
  lodging: ['Hotel', 'Boutique hotel', 'Resort', 'Apartment or rental', 'Lodge or cabin', 'Hostel'],
  greats: ['Food', 'Nature', 'History', 'Art', 'Music', 'Nightlife', 'Beaches', 'Hiking', 'Wildlife', 'Wellness', 'Architecture', 'Water sports'],
  noGos: ['Crowds', 'Heights', 'Small boats', 'Long drives', 'Early starts', 'Camping', 'Group tours', 'Raw food', 'Extreme heat', 'Extreme cold'],
  withWhom: ['Solo', 'Partner', 'Friends', 'Family with kids', 'Family, all adults'],
};

export const archetypes: Archetype[] = [
  { key: 'trailblazer', name: 'The Trailblazer', profile: { pace: 0.8, novelty: 0.9, setting: 0.15, comfort: 0.3, social: 0.45, structure: 0.3, culture: 0.45, activity: 0.95 }, tagline: 'You collect summits, not souvenirs. The itinerary is a dare.', description: 'Trailblazers pick the harder trail and the later flight home. They want a destination that asks something of them, and they are happiest when the plan leaves room for a dare.' },
  { key: 'culture-hound', name: 'The Culture Hound', profile: { pace: 0.55, novelty: 0.5, setting: 0.85, comfort: 0.55, social: 0.5, structure: 0.7, culture: 0.95, activity: 0.45 }, tagline: 'You travel to taste, hear, and stand inside history.', description: 'Culture Hounds travel for the table, the gallery and the back street with the good bakery. They plan enough to see what matters and linger where it is worth it.' },
  { key: 'socialite', name: 'The Socialite', profile: { pace: 0.85, novelty: 0.55, setting: 0.9, comfort: 0.6, social: 0.95, structure: 0.3, culture: 0.6, activity: 0.55 }, tagline: 'The destination is the people. The night is young everywhere.', description: 'Socialites measure a trip in conversations. They want places with a pulse, a good crowd and a reason to stay out one more hour.' },
  { key: 'sunseeker', name: 'The Sunseeker', profile: { pace: 0.1, novelty: 0.2, setting: 0.3, comfort: 0.75, social: 0.5, structure: 0.45, culture: 0.25, activity: 0.1 }, tagline: 'You measure trips in sunsets and naps. Elite recovery.', description: 'Sunseekers travel to switch off. Warm water, slow mornings and nowhere to be are the goal, and a trip counts as a success if the phone stayed in the bag.' },
  { key: 'architect', name: 'The Architect', profile: { pace: 0.5, novelty: 0.25, setting: 0.7, comfort: 0.65, social: 0.4, structure: 0.95, culture: 0.7, activity: 0.4 }, tagline: 'Your trips run like Swiss rail. Serendipity, but scheduled.', description: 'Architects like a trip that runs on time. They enjoy knowing what happens next, and they are at their best in places where the logistics are quietly excellent.' },
  { key: 'free-spirit', name: 'The Free Spirit', profile: { pace: 0.6, novelty: 0.9, setting: 0.55, comfort: 0.2, social: 0.7, structure: 0.05, culture: 0.65, activity: 0.65 }, tagline: 'One-way tickets and open questions. The plan is no plan.', description: 'Free Spirits leave space for the unplanned. They travel light, say yes to detours and care more about the story than the schedule.' },
  { key: 'luxe-nomad', name: 'The Luxe Nomad', profile: { pace: 0.4, novelty: 0.45, setting: 0.65, comfort: 0.95, social: 0.55, structure: 0.7, culture: 0.65, activity: 0.3 }, tagline: 'You will try anything once, as long as there is a robe waiting.', description: 'Luxe Nomads will try nearly anything as long as the room is excellent. They put comfort first and spend where it makes the days easier and better.' },
  { key: 'wanderer', name: 'The Wanderer', profile: { pace: 0.3, novelty: 0.7, setting: 0.4, comfort: 0.35, social: 0.2, structure: 0.35, culture: 0.8, activity: 0.55 }, tagline: 'Quiet streets, long walks, and places that do not perform for tourists.', description: 'Wanderers want quiet streets and long walks in places that are not built for visitors. They travel slowly and pay attention.' },
];
