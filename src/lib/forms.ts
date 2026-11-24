// Single source of truth for Netlify form definitions. FormDefs.astro renders hidden static copies
// from these lists so Netlify detects both forms at deploy time. Islands submit through leads.ts.
// `dna_profile` carries the serialized Travel DNA v3 profile (axes, archetype, planner brief) as JSON.
export const FORM_FIELDS = {
  'trip-request': [
    'name', 'email', 'state', 'notes',
    'departure_airport', 'travelers', 'budget_per_person', 'nights', 'flexibility', 'earliest_departure', 'month',
    'citizenship', 'passport', 'passport_valid_six_months', 'vetoes', 'cabin', 'delivery_preference', 'reveal_date',
    'trip_type', 'trip_reason', 'date_matches', 'date_plan', 'trip_start', 'trip_end', 'estimated_total', 'estimated_per_person', 'destinations_in_play',
    'archetype', 'dna_profile',
  ],
  waitlist: ['name', 'email', 'state', 'source', 'citizenship', 'archetype', 'dna_profile', 'note'],
} as const;

export type FormName = keyof typeof FORM_FIELDS;
