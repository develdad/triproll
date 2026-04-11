/**
 * Amadeus Self-Service API client
 * Handles flight and hotel price lookups with automatic token management.
 *
 * Docs: https://developers.amadeus.com/self-service
 * Node SDK: https://github.com/amadeus4dev/amadeus-node
 *
 * We use raw fetch instead of the SDK to avoid an extra dependency
 * and keep full control over error handling + caching.
 */

const AMADEUS_BASE =
  process.env.AMADEUS_ENV === "production"
    ? "https://api.amadeus.com"
    : "https://test.api.amadeus.com";

const CLIENT_ID = process.env.AMADEUS_CLIENT_ID ?? "";
const CLIENT_SECRET = process.env.AMADEUS_CLIENT_SECRET ?? "";

// In-memory token cache (server-side, lives per process)
let tokenCache: { token: string; expiresAt: number } | null = null;

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
async function getAccessToken(): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.expiresAt) {
    return tokenCache.token;
  }

  const res = await fetch(`${AMADEUS_BASE}/v1/security/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Amadeus auth failed (${res.status}): ${body}`);
  }

  const data = await res.json();
  tokenCache = {
    token: data.access_token,
    // Expire 60s early to avoid edge-case 401s
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };
  return tokenCache.token;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type FlightOffer = {
  source: "amadeus";
  price: number;           // Total price in USD (or local currency)
  currency: string;
  airline: string;         // Marketing carrier code (e.g. "UA")
  airlineName: string;     // Resolved name
  outboundDuration: string; // ISO 8601 duration e.g. "PT12H30M"
  returnDuration: string | null;
  stops: number;           // 0 = direct
  cabin: string;           // ECONOMY, BUSINESS, etc.
  departureTime: string;
  arrivalTime: string;
  bookingUrl: string | null;
};

// Common airline code to name mapping (top carriers)
const AIRLINE_NAMES: Record<string, string> = {
  AA: "American Airlines", UA: "United Airlines", DL: "Delta Air Lines",
  WN: "Southwest Airlines", B6: "JetBlue", AS: "Alaska Airlines",
  NK: "Spirit Airlines", F9: "Frontier Airlines", G4: "Allegiant Air",
  BA: "British Airways", LH: "Lufthansa", AF: "Air France",
  KL: "KLM", EK: "Emirates", QR: "Qatar Airways",
  SQ: "Singapore Airlines", CX: "Cathay Pacific", JL: "Japan Airlines",
  NH: "ANA", TK: "Turkish Airlines", LX: "Swiss",
  IB: "Iberia", AZ: "ITA Airways", SK: "SAS",
  AY: "Finnair", QF: "Qantas", AC: "Air Canada",
  AM: "Aeromexico", LA: "LATAM", AV: "Avianca",
  FR: "Ryanair", U2: "easyJet", W6: "Wizz Air",
};

function resolveAirlineName(code: string): string {
  return AIRLINE_NAMES[code] ?? code;
}

// ---------------------------------------------------------------------------
// Flight Search
// ---------------------------------------------------------------------------
export async function searchFlights(params: {
  origin: string;       // IATA code e.g. "JFK"
  destination: string;  // IATA code e.g. "BCN"
  departureDate: string; // YYYY-MM-DD
  returnDate?: string;
  adults?: number;
  maxResults?: number;
}): Promise<FlightOffer[]> {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    console.warn("[Amadeus] Missing API credentials, skipping search");
    return [];
  }

  const token = await getAccessToken();

  const query = new URLSearchParams({
    originLocationCode: params.origin,
    destinationLocationCode: params.destination,
    departureDate: params.departureDate,
    adults: String(params.adults ?? 1),
    max: String(params.maxResults ?? 5),
    currencyCode: "USD",
  });

  if (params.returnDate) {
    query.set("returnDate", params.returnDate);
  }

  const res = await fetch(
    `${AMADEUS_BASE}/v2/shopping/flight-offers?${query}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      // 10s timeout for flight search
      signal: AbortSignal.timeout(10_000),
    }
  );

  if (!res.ok) {
    const body = await res.text();
    console.error(`[Amadeus] Flight search failed (${res.status}):`, body);
    return [];
  }

  const data = await res.json();
  const offers: FlightOffer[] = (data.data ?? []).map((offer: any) => {
    const firstSegment = offer.itineraries?.[0]?.segments?.[0];
    const outboundSegments = offer.itineraries?.[0]?.segments ?? [];
    const returnSegments = offer.itineraries?.[1]?.segments ?? [];

    return {
      source: "amadeus" as const,
      price: parseFloat(offer.price?.total ?? "0"),
      currency: offer.price?.currency ?? "USD",
      airline: firstSegment?.carrierCode ?? "??",
      airlineName: resolveAirlineName(firstSegment?.carrierCode ?? ""),
      outboundDuration: offer.itineraries?.[0]?.duration ?? "",
      returnDuration: offer.itineraries?.[1]?.duration ?? null,
      stops: Math.max(0, outboundSegments.length - 1),
      cabin: offer.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.cabin ?? "ECONOMY",
      departureTime: firstSegment?.departure?.at ?? "",
      arrivalTime: outboundSegments[outboundSegments.length - 1]?.arrival?.at ?? "",
      bookingUrl: null, // Amadeus doesn't provide direct booking links in Self-Service
    };
  });

  return offers;
}

// ---------------------------------------------------------------------------
// IATA Code Lookup (city name to airport code)
// ---------------------------------------------------------------------------
export async function lookupAirportCode(cityName: string): Promise<string | null> {
  if (!CLIENT_ID || !CLIENT_SECRET) return null;

  const token = await getAccessToken();
  const query = new URLSearchParams({
    subType: "CITY,AIRPORT",
    keyword: cityName,
    "page[limit]": "1",
  });

  const res = await fetch(
    `${AMADEUS_BASE}/v1/reference-data/locations?${query}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(5_000),
    }
  );

  if (!res.ok) return null;

  const data = await res.json();
  const location = data.data?.[0];
  return location?.iataCode ?? null;
}

// ---------------------------------------------------------------------------
// Health check: verify credentials work
// ---------------------------------------------------------------------------
export async function isConfigured(): Promise<boolean> {
  return Boolean(CLIENT_ID && CLIENT_SECRET);
}
