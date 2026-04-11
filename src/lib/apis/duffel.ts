/**
 * Duffel Flights API client
 * Replaces Amadeus Self-Service (decommissioned July 2026) as primary GDS source.
 *
 * Docs: https://duffel.com/docs/api/overview
 * Free starter tier: searches are free, pay-per-booking only.
 * 300+ airlines including legacy carriers, LCCs, and NDC content.
 *
 * Raw fetch -- no SDK dependency, consistent with our Kiwi client.
 */

const DUFFEL_BASE = "https://api.duffel.com";
const API_TOKEN = process.env.DUFFEL_API_TOKEN ?? "";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type DuffelFlightOffer = {
  source: "duffel";
  price: number;
  currency: string;
  airline: string;        // IATA carrier code
  airlineName: string;    // Full carrier name (Duffel provides this)
  outboundDuration: string; // Human-readable e.g. "12h 30m"
  returnDuration: string | null;
  stops: number;
  cabin: string;          // economy, premium_economy, business, first
  departureTime: string;  // ISO datetime
  arrivalTime: string;
  bookingUrl: string | null;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatDuration(isoStr: string): string {
  // Duffel returns ISO 8601 durations like "PT12H30M" or segment times
  const match = isoStr.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (match) {
    const h = parseInt(match[1] ?? "0");
    const m = parseInt(match[2] ?? "0");
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  return isoStr;
}

function computeDurationFromSegments(segments: any[]): string {
  if (segments.length === 0) return "0h";
  const dep = new Date(segments[0].departing_at).getTime();
  const arr = new Date(segments[segments.length - 1].arriving_at).getTime();
  const diffMin = Math.round((arr - dep) / 60000);
  const h = Math.floor(diffMin / 60);
  const m = diffMin % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

// ---------------------------------------------------------------------------
// Offer Request (Step 1: create search, Step 2: get offers)
// Duffel uses a two-step flow: POST offer_requests returns offers inline.
// ---------------------------------------------------------------------------
export async function searchFlights(params: {
  origin: string;          // IATA code e.g. "JFK"
  destination: string;     // IATA code e.g. "BCN"
  departureDate: string;   // YYYY-MM-DD
  returnDate?: string;
  adults?: number;
  maxResults?: number;
  cabinClass?: "economy" | "premium_economy" | "business" | "first";
}): Promise<DuffelFlightOffer[]> {
  if (!API_TOKEN) {
    console.warn("[Duffel] Missing API token, skipping search");
    return [];
  }

  // Build slices (legs of the journey)
  const slices: any[] = [
    {
      origin: params.origin,
      destination: params.destination,
      departure_date: params.departureDate,
    },
  ];

  if (params.returnDate) {
    slices.push({
      origin: params.destination,
      destination: params.origin,
      departure_date: params.returnDate,
    });
  }

  const passengers: any[] = Array.from(
    { length: params.adults ?? 1 },
    () => ({ type: "adult" })
  );

  const body: any = {
    data: {
      slices,
      passengers,
      cabin_class: params.cabinClass ?? "economy",
      max_connections: 2,
    },
  };

  // Duffel returns offers inline with return_offers=true (default)
  const res = await fetch(`${DUFFEL_BASE}/air/offer_requests?return_offers=true`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_TOKEN}`,
      "Duffel-Version": "v2",
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15_000), // Duffel can be slower on cold searches
  });

  if (!res.ok) {
    const errBody = await res.text();
    console.error(`[Duffel] Offer request failed (${res.status}):`, errBody);
    return [];
  }

  const data = await res.json();
  const offers = data.data?.offers ?? [];

  // Limit results
  const maxResults = params.maxResults ?? 5;
  const limited = offers.slice(0, maxResults);

  const results: DuffelFlightOffer[] = limited.map((offer: any) => {
    const outboundSlice = offer.slices?.[0];
    const returnSlice = offer.slices?.[1] ?? null;
    const outboundSegments = outboundSlice?.segments ?? [];
    const firstSegment = outboundSegments[0];
    const lastOutboundSegment = outboundSegments[outboundSegments.length - 1];
    const carrier = firstSegment?.marketing_carrier ?? firstSegment?.operating_carrier;

    return {
      source: "duffel" as const,
      price: parseFloat(offer.total_amount ?? "0"),
      currency: offer.total_currency ?? "USD",
      airline: carrier?.iata_code ?? "??",
      airlineName: carrier?.name ?? carrier?.iata_code ?? "Unknown",
      outboundDuration: outboundSlice?.duration
        ? formatDuration(outboundSlice.duration)
        : computeDurationFromSegments(outboundSegments),
      returnDuration: returnSlice
        ? (returnSlice.duration
            ? formatDuration(returnSlice.duration)
            : computeDurationFromSegments(returnSlice.segments ?? []))
        : null,
      stops: Math.max(0, outboundSegments.length - 1),
      cabin: firstSegment?.passengers?.[0]?.cabin_class ?? "economy",
      departureTime: firstSegment?.departing_at ?? "",
      arrivalTime: lastOutboundSegment?.arriving_at ?? "",
      bookingUrl: null, // Duffel is a booking API; deep links are created on book
    };
  });

  return results;
}

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------
export async function isConfigured(): Promise<boolean> {
  return Boolean(API_TOKEN);
}
