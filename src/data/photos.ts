// Photo catalog: alt text and the climate-to-mood rule for the itinerary card header.
// Photos are mood and category imagery only. They are never chosen from a destination id,
// so a header image cannot give away a sealed roll.
export type PhotoKey =
  | 'coast-sunset' | 'lagoon-aerial' | 'mountains-cloud' | 'city-dusk' | 'desert-dunes' | 'market-produce'
  | 'old-town' | 'snow-glacier' | 'wing-window' | 'traveler-suitcase' | 'viewpoint' | 'lake-boat';

export const PHOTO_ALT: Record<PhotoKey, string> = {
  'coast-sunset': 'Warm sunset over a turquoise sea with small waves washing onto a pale sand beach',
  'lagoon-aerial': 'Aerial view of small boats anchored in a clear turquoise cove beside a sandy beach',
  'mountains-cloud': 'Snow-capped mountain peaks glowing at sunrise above a sea of cloud',
  'city-dusk': 'City skyline at dusk reflected in still harbor water, with a tall tower on the right',
  'desert-dunes': 'Rippled golden sand dunes under a low sun with footprints in the foreground',
  'market-produce': 'A market stall stacked with colorful fruit and vegetables, each with a small price label',
  'old-town': 'A cobbled old-town street at dusk with half-timbered houses, flower boxes and a clock tower gate',
  'snow-glacier': 'A wide snow-covered glacier valley between rocky mountain ridges under a pale sky',
  'wing-window': 'An airplane wing seen through the window at sunset above a darkening landscape',
  'traveler-suitcase': 'A traveler seen from behind pulling a suitcase through an archway toward a colorful sunset sky',
  'viewpoint': 'A hiker in a red jacket seen from behind, looking at a snowy mountain peak',
  'lake-boat': 'The bow of a wooden boat on a green mountain lake with forested slopes and rocky peaks',
};

// Header mood for a rolled trip, picked from climate flags only.
export type Mood = 'coast' | 'lagoon' | 'mountain' | 'snow' | 'desert' | 'lake' | 'market' | 'wing';
export const MOOD_PHOTO: Record<Mood, PhotoKey> = {
  coast: 'coast-sunset', lagoon: 'lagoon-aerial', mountain: 'mountains-cloud', snow: 'snow-glacier',
  desert: 'desert-dunes', lake: 'lake-boat', market: 'market-produce', wing: 'wing-window',
};
export const MOODS = Object.keys(MOOD_PHOTO) as Mood[];

export function moodFor(d: { beach: boolean; cold: boolean; city: boolean; remote: boolean; climate: string }): Mood {
  if (d.cold) return d.remote ? 'snow' : 'mountain';
  if (d.beach) return d.remote ? 'lagoon' : 'coast';
  if (/desert/i.test(d.climate)) return 'desert';
  if (d.remote) return 'lake';
  if (d.city) return 'market';
  return 'wing';
}
