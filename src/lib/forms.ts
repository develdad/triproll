// Single source of truth for Netlify form definitions. FormDefs.astro renders hidden static copies
// from these lists so Netlify detects both forms at deploy time. Islands submit through leads.ts.
export const FORM_FIELDS = {
  'trip-request': [
    'name', 'email', 'state', 'notes', 'dietary',
    'departure_airport', 'travelers', 'budget_per_person', 'nights', 'flexibility', 'earliest_departure', 'month',
    'passport', 'vetoes', 'reveal_preference', 'revealed_in_app',
    'destination_id', 'trip_start', 'trip_end', 'estimated_total', 'estimated_per_person', 'rerolls_used', 'archetype',
  ],
  waitlist: ['name', 'email', 'state', 'source', 'archetype', 'note'],
} as const;

export type FormName = keyof typeof FORM_FIELDS;
