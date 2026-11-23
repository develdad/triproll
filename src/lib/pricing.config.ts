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
