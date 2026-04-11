/**
 * Unified flight search layer
 *
 * Queries Duffel + Kiwi in parallel, normalizes results into a common
 * FlightResult type, caches in Supabase, and ranks by user preferences.
 *
 * Duffel replaced Amadeus Self-Service (decommissioned July 2026) as primary
 * GDS source. 300+ airlines, free searches, pay-per-booking only.
 *
 * Falls back gracefully: if both APIs fail or are unconfigured, returns null
 * so generateTrip() can use its existing mock pricing.
 */

import * as duffel from "./duffel";
import * as kiwi from "./kiwi";
import { createClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// Common types
// ---------------------------------------------------------------------------
export type FlightResult = {
  source: "duffel" | "kiwi";
  price: number;
  currency: string;
  airline: string;
  airlineName: string;
  outboundDuration: string;
  returnDuration: string | null;
  stops: number;
  cabin: string;
  departureTime: string;
  arrivalTime: string;
  bookingUrl: string | null;
  isVirtualInterline: boolean;
};

export type FlightSearchResult = {
  bestPrice: FlightResult | null;
  bestExperience: FlightResult | null;  // Fewest stops, shortest duration, best airline
  allOffers: FlightResult[];
  priceRange: { low: number; high: number } | null;
  cached: boolean;
};

// ---------------------------------------------------------------------------
// IATA code mapping for common US departure cities
// ---------------------------------------------------------------------------
const CITY_TO_IATA: Record<string, string> = {
  "New York": "JFK", "Los Angeles": "LAX", "Chicago": "ORD",
  "San Francisco": "SFO", "Miami": "MIA", "Dallas": "DFW",
  "Houston": "IAH", "Seattle": "SEA", "Denver": "DEN",
  "Boston": "BOS", "Atlanta": "ATL", "Washington DC": "IAD",
  "Philadelphia": "PHL", "Phoenix": "PHX", "Las Vegas": "LAS",
  "Minneapolis": "MSP", "Detroit": "DTW", "Orlando": "MCO",
  "Portland": "PDX", "Nashville": "BNA", "Austin": "AUS",
  "San Diego": "SAN", "Charlotte": "CLT", "Tampa": "TPA",
  "Salt Lake City": "SLC", "Honolulu": "HNL", "Anchorage": "ANC",
};

// Destination city to nearest major airport
const DEST_TO_IATA: Record<string, string> = {
  "Tokyo": "NRT", "Paris": "CDG", "Bali": "DPS", "Barcelona": "BCN",
  "Rome": "FCO", "London": "LHR", "Reykjavik": "KEF", "Marrakech": "RAK",
  "Lisbon": "LIS", "Bangkok": "BKK", "Cape Town": "CPT",
  "Buenos Aires": "EZE", "Istanbul": "IST", "Dubrovnik": "DBV",
  "Cusco": "CUZ", "Kyoto": "KIX", "Santorini": "JTR",
  "Cartagena": "CTG", "Prague": "PRG", "Tulum": "CUN",
  "Dubai": "DXB", "Queenstown": "ZQN", "Havana": "HAV",
  "Chiang Mai": "CNX", "Amalfi Coast": "NAP", "Petra": "AMM",
  "Maldives": "MLE", "Zanzibar": "ZNZ", "Patagonia": "USH",
  "Sedona": "PHX", "Savannah": "SAV", "Asheville": "AVL",
  "Moab": "CNY", "Big Sur": "MRY", "Key West": "EYW",
  "Charleston": "CHS", "Santa Fe": "SAF", "Napa Valley": "SFO",
  "Lake Tahoe": "RNO", "New Orleans": "MSY",
};

function resolveIATA(cityName: string, mapping: Record<string, string>): string | null {
  // Direct match
  if (mapping[cityName]) return mapping[cityName];
  // Fuzzy match: check if any key is contained in the city name
  for (const [key, code] of Object.entries(mapping)) {
    if (cityName.toLowerCase().includes(key.toLowerCase())) return code;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Duration parsing for ranking
// ---------------------------------------------------------------------------
function durationToMinutes(dur: string): number {
  // Handle ISO 8601 "PT12H30M"
  const isoMatch = dur.match(/PT(\d+)H(?:(\d+)M)?/);
  if (isoMatch) {
    return parseInt(isoMatch[1]) * 60 + parseInt(isoMatch[2] ?? "0");
  }
  // Handle "12h 30m" format
  const humanMatch = dur.match(/(\d+)h\s*(\d+)?m?/);
  if (humanMatch) {
    return parseInt(humanMatch[1]) * 60 + parseInt(humanMatch[2] ?? "0");
  }
  return 9999; // Unknown, sort last
}

// ---------------------------------------------------------------------------
// Cache layer (Supabase)
// ---------------------------------------------------------------------------
const CACHE_TTL_HOURS = 24;

async function getCached(
  origin: string,
  destination: string,
  departureDate: string,
  returnDate?: string
): Promise<FlightSearchResult | null> {
  try {
    const supabase = await createClient();
    const cacheKey = `${origin}-${destination}-${departureDate}-${returnDate ?? "oneway"}`;

    const { data } = await supabase
      .from("flight_price_cache")
      .select("result, fetched_at")
      .eq("cache_key", cacheKey)
      .single();

    if (!data) return null;

    const age = Date.now() - new Date(data.fetched_at).getTime();
    if (age > CACHE_TTL_HOURS * 60 * 60 * 1000) return null;

    return { ...data.result, cached: true };
  } catch {
    // Cache miss or table doesn't exist yet, that's fine
    return null;
  }
}

async function setCache(
  origin: string,
  destination: string,
  departureDate: string,
  returnDate: string | undefined,
  result: FlightSearchResult
): Promise<void> {
  try {
    const supabase = await createClient();
    const cacheKey = `${origin}-${destination}-${departureDate}-${returnDate ?? "oneway"}`;

    await supabase.from("flight_price_cache").upsert(
      {
        cache_key: cacheKey,
        origin,
        destination,
        departure_date: departureDate,
        return_date: returnDate ?? null,
        result,
        fetched_at: new Date().toISOString(),
      },
      { onConflict: "cache_key" }
    );
  } catch (err) {
    // Non-critical: log but don't break the flow
    console.warn("[FlightCache] Failed to write cache:", err);
  }
}

// ---------------------------------------------------------------------------
// Main search function
// ---------------------------------------------------------------------------
export async function searchFlights(params: {
  departureCity: string;
  destinationCity: string;
  departureDate: string;
  returnDate?: string;
  adults?: number;
  /** User's budget axis from Travel DNA (-1 = budget, +1 = splurge) */
  budgetPreference?: number;
}): Promise<FlightSearchResult | null> {
  const originIATA = resolveIATA(params.departureCity, CITY_TO_IATA);
  const destIATA = resolveIATA(params.destinationCity, DEST_TO_IATA);

  // If we can't resolve either airport, bail to mock pricing
  if (!originIATA || !destIATA) {
    console.warn(
      `[Flights] Could not resolve IATA codes: ${params.departureCity} -> ${originIATA}, ${params.destinationCity} -> ${destIATA}`
    );
    return null;
  }

  // Check cache first
  const cached = await getCached(originIATA, destIATA, params.departureDate, params.returnDate);
  if (cached) return cached;

  // Fire both APIs in parallel
  const [duffelOffers, kiwiOffers] = await Promise.all([
    duffel.searchFlights({
      origin: originIATA,
      destination: destIATA,
      departureDate: params.departureDate,
      returnDate: params.returnDate,
      adults: params.adults ?? 1,
      maxResults: 5,
    }).catch((err) => {
      console.error("[Flights] Duffel search error:", err);
      return [] as duffel.DuffelFlightOffer[];
    }),
    kiwi.searchFlights({
      originCity: originIATA,
      destinationCity: destIATA,
      departureDate: params.departureDate,
      returnDate: params.returnDate,
      adults: params.adults ?? 1,
      maxResults: 5,
    }).catch((err) => {
      console.error("[Flights] Kiwi search error:", err);
      return [] as kiwi.KiwiFlightOffer[];
    }),
  ]);

  // Normalize into common FlightResult type
  const allOffers: FlightResult[] = [
    ...duffelOffers.map((o) => ({
      source: o.source,
      price: o.price,
      currency: o.currency,
      airline: o.airline,
      airlineName: o.airlineName,
      outboundDuration: o.outboundDuration,
      returnDuration: o.returnDuration,
      stops: o.stops,
      cabin: o.cabin,
      departureTime: o.departureTime,
      arrivalTime: o.arrivalTime,
      bookingUrl: o.bookingUrl,
      isVirtualInterline: false,
    })),
    ...kiwiOffers.map((o) => ({
      source: o.source,
      price: o.price,
      currency: o.currency,
      airline: o.airline,
      airlineName: o.airlineName,
      outboundDuration: o.outboundDuration,
      returnDuration: o.returnDuration,
      stops: o.stops,
      cabin: "ECONOMY" as string,
      departureTime: o.departureTime,
      arrivalTime: o.arrivalTime,
      bookingUrl: o.bookingUrl,
      isVirtualInterline: o.isVirtualInterline,
    })),
  ];

  if (allOffers.length === 0) {
    return null; // Both APIs returned nothing, fall back to mock
  }

  // Rank: best price
  const byPrice = [...allOffers].sort((a, b) => a.price - b.price);
  const bestPrice = byPrice[0];

  // Rank: best experience (fewest stops, then shortest duration, then price)
  const byExperience = [...allOffers].sort((a, b) => {
    if (a.stops !== b.stops) return a.stops - b.stops;
    const durA = durationToMinutes(a.outboundDuration);
    const durB = durationToMinutes(b.outboundDuration);
    if (durA !== durB) return durA - durB;
    return a.price - b.price;
  });
  const bestExperience = byExperience[0];

  const prices = allOffers.map((o) => o.price).filter((p) => p > 0);
  const priceRange = prices.length > 0
    ? { low: Math.min(...prices), high: Math.max(...prices) }
    : null;

  const result: FlightSearchResult = {
    bestPrice,
    bestExperience,
    allOffers,
    priceRange,
    cached: false,
  };

  // Write to cache (non-blocking)
  setCache(originIATA, destIATA, params.departureDate, params.returnDate, result);

  return result;
}

// ---------------------------------------------------------------------------
// Convenience: get just a price estimate for a route
// ---------------------------------------------------------------------------
export async function getFlightPriceEstimate(params: {
  departureCity: string;
  destinationCity: string;
  departureDate: string;
  returnDate?: string;
  adults?: number;
  budgetPreference?: number;
}): Promise<{
  price: number;
  airline: string;
  source: "duffel" | "kiwi";
  bookingUrl: string | null;
} | null> {
  const result = await searchFlights(params);
  if (!result) return null;

  // Pick based on budget preference
  const pick =
    (params.budgetPreference ?? 0) < 0
      ? result.bestPrice   // Budget-conscious: cheapest
      : result.bestExperience; // Comfort-oriented: best experience

  if (!pick) return null;

  return {
    price: pick.price,
    airline: pick.airlineName,
    source: pick.source,
    bookingUrl: pick.bookingUrl,
  };
}
