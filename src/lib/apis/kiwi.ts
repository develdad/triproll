/**
 * Kiwi Tequila API client
 * Handles flight search with budget carrier coverage.
 *
 * Docs: https://tequila.kiwi.com/portal/docs
 * Free tier: unlimited searches, affiliate commission model.
 */

const KIWI_BASE = "https://api.tequila.kiwi.com";
const API_KEY = process.env.KIWI_API_KEY ?? "";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type KiwiFlightOffer = {
  source: "kiwi";
  price: number;           // Total price in USD
  currency: string;
  airline: string;         // Carrier code
  airlineName: string;     // Carrier name (Kiwi provides this)
  outboundDuration: string; // Human-readable e.g. "12h 30m"
  returnDuration: string | null;
  stops: number;
  departureTime: string;   // ISO datetime
  arrivalTime: string;
  bookingUrl: string;      // Deep link to Kiwi booking page
  isVirtualInterline: boolean; // True if self-connecting itinerary
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function isoFromUnix(ts: number): string {
  return new Date(ts * 1000).toISOString();
}

// ---------------------------------------------------------------------------
// Location Search (city/airport name to Kiwi location ID)
// ---------------------------------------------------------------------------
export async function lookupLocation(
  query: string
): Promise<{ id: string; code: string; name: string } | null> {
  if (!API_KEY) return null;

  const params = new URLSearchParams({
    term: query,
    location_types: "airport,city",
    limit: "1",
    active_only: "true",
  });

  const res = await fetch(`${KIWI_BASE}/locations/query?${params}`, {
    headers: { apikey: API_KEY },
    signal: AbortSignal.timeout(5_000),
  });

  if (!res.ok) return null;

  const data = await res.json();
  const loc = data.locations?.[0];
  if (!loc) return null;

  return {
    id: loc.id,
    code: loc.code ?? loc.id,
    name: loc.name,
  };
}

// ---------------------------------------------------------------------------
// Flight Search
// ---------------------------------------------------------------------------
export async function searchFlights(params: {
  originCity: string;      // City name or IATA code
  destinationCity: string; // City name or IATA code
  departureDate: string;   // YYYY-MM-DD
  returnDate?: string;
  adults?: number;
  maxResults?: number;
}): Promise<KiwiFlightOffer[]> {
  if (!API_KEY) {
    console.warn("[Kiwi] Missing API key, skipping search");
    return [];
  }

  // Kiwi uses DD/MM/YYYY format
  const fmtDate = (d: string) => {
    const [y, m, day] = d.split("-");
    return `${day}/${m}/${y}`;
  };

  const query = new URLSearchParams({
    fly_from: params.originCity,
    fly_to: params.destinationCity,
    date_from: fmtDate(params.departureDate),
    date_to: fmtDate(params.departureDate),
    adults: String(params.adults ?? 1),
    curr: "USD",
    limit: String(params.maxResults ?? 5),
    sort: "price",
    max_stopovers: "2",
  });

  if (params.returnDate) {
    query.set("return_from", fmtDate(params.returnDate));
    query.set("return_to", fmtDate(params.returnDate));
    query.set("flight_type", "round");
  } else {
    query.set("flight_type", "oneway");
  }

  const res = await fetch(`${KIWI_BASE}/v2/search?${query}`, {
    headers: { apikey: API_KEY },
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`[Kiwi] Flight search failed (${res.status}):`, body);
    return [];
  }

  const data = await res.json();
  const offers: KiwiFlightOffer[] = (data.data ?? []).map((flight: any) => {
    // Count outbound stops (routes before return)
    const outboundRoutes = (flight.route ?? []).filter(
      (r: any) => r.return === 0
    );
    const returnRoutes = (flight.route ?? []).filter(
      (r: any) => r.return === 1
    );

    return {
      source: "kiwi" as const,
      price: flight.price ?? 0,
      currency: "USD",
      airline: flight.airlines?.[0] ?? "??",
      airlineName: flight.airlines?.[0] ?? "Unknown",
      outboundDuration: formatDuration(flight.duration?.departure ?? 0),
      returnDuration: flight.duration?.return
        ? formatDuration(flight.duration.return)
        : null,
      stops: Math.max(0, outboundRoutes.length - 1),
      departureTime: isoFromUnix(flight.dTime ?? 0),
      arrivalTime: isoFromUnix(flight.aTime ?? 0),
      bookingUrl: flight.deep_link ?? "",
      isVirtualInterline: flight.virtual_interlining ?? false,
    };
  });

  return offers;
}

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------
export async function isConfigured(): Promise<boolean> {
  return Boolean(API_KEY);
}
