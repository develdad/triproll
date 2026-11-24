// Sample sealed request for the static example card in the home hero. Sample numbers only, labeled as such on the page.
// It names no destination, because the real card never does either.
import type { Sealed } from '../lib/request.ts';

export const exampleSealed: Sealed = {
  nights: 5, party: 2, start: '2027-03-14', end: '2027-03-19', perPerson: 1640, total: 3280,
  count: 24, climate: 'Could be a mild city, could be a warm coast.', vetoes: ['no-cold'], passport: 'valid', cabin: 'economy', tripType: '', tripReason: '',
};
export const exampleAirport = 'PHX';
