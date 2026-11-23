// Sample trip for the static example itinerary in the home hero. Sample numbers only, labeled as such on the page.
import { destinations, toPublic } from './destinations.ts';
import { bandFor, type Trip } from '../lib/dna.ts';

const base = destinations.find((d) => d.id === 'lisbon')!;
export const exampleTrip: Trip = {
  dest: toPublic(base),
  nights: 5,
  party: 2,
  start: '2027-03-14',
  end: '2027-03-19',
  price: { perPerson: 1640, total: 3280 },
  band: bandFor(base.hours),
};
export const exampleAirport = 'PHX';
