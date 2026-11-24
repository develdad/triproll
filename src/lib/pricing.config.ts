// Pricing rules in one place. Owner decisions, beta:
// - The customer states a per-person budget. The trip is sold as one package price.
// - The package price shown is the stated budget rounded down to the nearest PRICE_STEP.
// - A destination is eligible only if its internal cost estimate (flights, stay, transfers and
//   experiences, with the seasonal multiplier at its maximum) is at or below COST_CEILING of the budget.
// - Internal cost lines are never shown to customers and are not part of the Trip type.
export const MARGIN = 0.15;
export const BUFFER = 0.1;
export const COST_CEILING = +(1 - MARGIN - BUFFER).toFixed(4); // 0.75

export const PRICE_STEP = 10;

// Hard viability floors, USD per person.
export const FLOOR_PER_NIGHT = 150;
export const FLOOR_OVERALL = 600;

// Seasonal multiplier range applied to flight and hotel base prices.
export const SEASON_MIN = 0.92;
export const SEASON_SPAN = 0.22;
export const SEASON_MAX = +(SEASON_MIN + SEASON_SPAN).toFixed(4); // 1.14

// Allowance for transfers and experiences, as a share of flights plus stay.
export const EXTRAS_RATE = 0.12;

export const BUDGET_MAX = 6000;

// Beta entry rules. Beta serves US passport holders only. Destinations whose entry flag is 'prereg'
// (advance electronic authorization or e-visa) are excluded while this is false.
// The entry flags in src/data/destinations.ts are unverified working assumptions: a planner confirms them before every booking.
export const BETA_ALLOW_PREREG = false;

// Beta only plans places at or below this US State Department country advisory level (1 to 4). Higher levels are excluded.
export const MAX_ADVISORY_LEVEL = 2;

// Cabin class. The per-person budget floor is multiplied for the higher cabins. No first class during beta.
export const CABIN_FLOOR_MULT = { economy: 1, premium: 1.6, business: 3.0 } as const;

// Beta order cap: per-person budget times travelers may not exceed this. Larger trips go to the waitlist.
export const MAX_ORDER_TOTAL_USD = 10000;

// A set of rules must leave at least this many destinations in play, otherwise the person is asked to loosen a rule.
export const MIN_ELIGIBLE = 3;

// Payments are not live. All payment wording reads from src/data/payment.ts, which has two variants keyed on this flag.
// Do not set to true until a card-hold flow exists.
export const paymentsLive = false;
