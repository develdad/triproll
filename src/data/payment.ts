// The ONE place payment wording lives. Two variants keyed on `paymentsLive` (src/lib/pricing.config.ts).
// While payments are not live, nothing may mention a card hold. The live variant exists for later and must not be enabled yet.
import { paymentsLive } from '../lib/pricing.config.ts';

export type Step = { title: string; body: string };

const OFF: Step[] = [
  { title: 'Request your trip.', body: 'Nothing is charged today.' },
  { title: 'A person reviews it.', body: 'Within 72 hours we confirm we can build it inside your rules.' },
  { title: 'If we can, you approve payment and get your confirmation and packing list.', body: 'If we cannot, you owe nothing.' },
  { title: 'Your itinerary arrives the morning you leave,', body: 'or on the reveal date you picked.' },
];
const ON: Step[] = [
  { title: 'Request your trip.', body: 'We place a hold on your card to verify funds.' },
  OFF[1],
  { title: 'If we can, your card is charged and you get your confirmation and packing list.', body: 'If we cannot, the hold is released and you owe nothing.' },
  OFF[3],
];

export const variants = { off: OFF, on: ON } as const;
export const requestSteps: Step[] = paymentsLive ? ON : OFF;
export const stepText = (s: Step) => `${s.title} ${s.body}`;

// Short payment lines reused across pages. Same two-variant rule.
export const pay = {
  today: paymentsLive ? 'We place a hold on your card to verify funds.' : 'Nothing is charged today.',
  noCharge: paymentsLive ? 'If we cannot build it, the hold is released and you owe nothing.' : 'If we cannot build it, you owe nothing.',
  requestNote: paymentsLive
    ? 'This is a request, not a booking. We place a hold on your card to verify funds. A person reviews it within 72 hours.'
    : 'This is a request, not a booking. Nothing is charged today. A person reviews it within 72 hours.',
  whenCharged: paymentsLive ? 'Your card is charged when we confirm the trip.' : 'You approve payment only after we confirm the trip.',
};
