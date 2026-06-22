/**
 * Seller of Travel geofencing.
 *
 * Several US states regulate "sellers of travel" and require registration,
 * bonding, or restitution-fund participation before you can sell travel to
 * their residents. For TripRoll v1 we avoid those costs by NOT operating for
 * customers who reside in those states, rather than registering.
 *
 * The legal trigger is the CUSTOMER'S STATE OF RESIDENCE, not the departure
 * airport. Enforce this server-side at trip-request time (defense in depth),
 * and surface a friendly message + waitlist capture client-side.
 *
 * Revisit (register and switch these on) once revenue justifies the cost.
 * Refs: CA oag.ca.gov/travel, FL FDACS, HI, WA seller-of-travel statutes.
 */

export type UsStateCode =
  | "AL" | "AK" | "AZ" | "AR" | "CA" | "CO" | "CT" | "DE" | "DC" | "FL"
  | "GA" | "HI" | "ID" | "IL" | "IN" | "IA" | "KS" | "KY" | "LA" | "ME"
  | "MD" | "MA" | "MI" | "MN" | "MS" | "MO" | "MT" | "NE" | "NV" | "NH"
  | "NJ" | "NM" | "NY" | "NC" | "ND" | "OH" | "OK" | "OR" | "PA" | "RI"
  | "SC" | "SD" | "TN" | "TX" | "UT" | "VT" | "VA" | "WA" | "WV" | "WI" | "WY";

export const US_STATES: { code: UsStateCode; name: string }[] = [
  { code: "AL", name: "Alabama" }, { code: "AK", name: "Alaska" },
  { code: "AZ", name: "Arizona" }, { code: "AR", name: "Arkansas" },
  { code: "CA", name: "California" }, { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" }, { code: "DE", name: "Delaware" },
  { code: "DC", name: "District of Columbia" }, { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" }, { code: "HI", name: "Hawaii" },
  { code: "ID", name: "Idaho" }, { code: "IL", name: "Illinois" },
  { code: "IN", name: "Indiana" }, { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" }, { code: "KY", name: "Kentucky" },
  { code: "LA", name: "Louisiana" }, { code: "ME", name: "Maine" },
  { code: "MD", name: "Maryland" }, { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" }, { code: "MN", name: "Minnesota" },
  { code: "MS", name: "Mississippi" }, { code: "MO", name: "Missouri" },
  { code: "MT", name: "Montana" }, { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" }, { code: "NH", name: "New Hampshire" },
  { code: "NJ", name: "New Jersey" }, { code: "NM", name: "New Mexico" },
  { code: "NY", name: "New York" }, { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" }, { code: "OH", name: "Ohio" },
  { code: "OK", name: "Oklahoma" }, { code: "OR", name: "Oregon" },
  { code: "PA", name: "Pennsylvania" }, { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" }, { code: "SD", name: "South Dakota" },
  { code: "TN", name: "Tennessee" }, { code: "TX", name: "Texas" },
  { code: "UT", name: "Utah" }, { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" }, { code: "WA", name: "Washington" },
  { code: "WV", name: "West Virginia" }, { code: "WI", name: "Wisconsin" },
  { code: "WY", name: "Wyoming" },
];

/**
 * States where TripRoll v1 does NOT yet operate because they impose
 * Seller of Travel registration/bonding requirements.
 */
export const BLOCKED_STATES: Record<string, { name: string; reason: string }> = {
  CA: { name: "California", reason: "Seller of Travel registration + Travel Consumer Restitution participation" },
  FL: { name: "Florida", reason: "Seller of Travel registration + surety bond" },
  HI: { name: "Hawaii", reason: "Travel agency / seller of travel registration" },
  WA: { name: "Washington", reason: "Seller of Travel registration" },
};

const STATE_NAME_BY_NAME = new Map(US_STATES.map((s) => [s.name.toLowerCase(), s.code]));

/** Normalize a free-text or code state value to a 2-letter code, or null. */
export function normalizeStateCode(input: string | null | undefined): UsStateCode | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (trimmed.length === 2) {
    const upper = trimmed.toUpperCase();
    return US_STATES.some((s) => s.code === upper) ? (upper as UsStateCode) : null;
  }
  const byName = STATE_NAME_BY_NAME.get(trimmed.toLowerCase());
  return (byName as UsStateCode) ?? null;
}

/** True if residents of this state cannot use TripRoll v1 yet. */
export function isResidencyBlocked(state: string | null | undefined): boolean {
  const code = normalizeStateCode(state);
  return code !== null && code in BLOCKED_STATES;
}

/** Friendly, branded message for a blocked state (or null if not blocked). */
export function blockedStateMessage(state: string | null | undefined): string | null {
  const code = normalizeStateCode(state);
  if (!code || !(code in BLOCKED_STATES)) return null;
  const name = BLOCKED_STATES[code].name;
  return `TripRoll isn't available to ${name} residents just yet. We're working through the paperwork to open up your state. Join the waitlist and you'll be the first to know when we roll into ${name}.`;
}
