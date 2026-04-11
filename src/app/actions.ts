"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { searchFlights as searchRealFlights, type FlightSearchResult } from "@/lib/apis/flights";

// Save Travel DNA results to database
export async function saveTravelDNA(data: {
  adventure: number;
  social: number;
  structure: number;
  cultural: number;
  budget: number;
  energy: number;
  archetype: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Deactivate any existing active DNA records
  await supabase
    .from("travel_dna")
    .update({ is_active: false })
    .eq("user_id", user.id)
    .eq("is_active", true);

  // Insert new active record
  const { data: dna, error } = await supabase
    .from("travel_dna")
    .insert({
      user_id: user.id,
      adventure: data.adventure,
      social: data.social,
      structure: data.structure,
      cultural: data.cultural,
      budget: data.budget,
      energy: data.energy,
      archetype: data.archetype,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  return { data: dna };
}

// Save trip request to database
export async function saveTripRequest(data: {
  travelDnaId?: string;
  departureDate: string;
  returnDate: string;
  budgetMin: number;
  budgetMax: number;
  partySize: number;
  partyType: string;
  departureCity: string;
  constraintsDietary: string[];
  constraintsMobility: string[];
  constraintsPassport: string[];
  constraintsOther: string;
  travelMode: string;
  mode: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { data: request, error } = await supabase
    .from("trip_requests")
    .insert({
      user_id: user.id,
      travel_dna_id: data.travelDnaId || null,
      departure_date: data.departureDate,
      return_date: data.returnDate,
      budget_min: data.budgetMin,
      budget_max: data.budgetMax,
      party_size: data.partySize,
      party_type: data.partyType,
      departure_city: data.departureCity,
      travel_mode: data.travelMode,
      constraints_dietary: data.constraintsDietary,
      constraints_mobility: data.constraintsMobility,
      constraints_passport: data.constraintsPassport,
      constraints_other: data.constraintsOther,
      mode: data.mode,
      status: "submitted",
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  return { data: request };
}

// Join waitlist
export async function joinWaitlist(email: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("waitlist")
    .insert({ email, source: "landing" });

  if (error) {
    if (error.code === "23505") {
      return { error: "You are already on the waitlist!" };
    }
    return { error: error.message };
  }

  return { success: true };
}

// Get current user's active Travel DNA
export async function getActiveTravelDNA() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("travel_dna")
    .select()
    .eq("user_id", user.id)
    .eq("is_active", true)
    .single();

  return data;
}

// Get current user's trip requests
export async function getTripRequests() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  const { data } = await supabase
    .from("trip_requests")
    .select()
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return data || [];
}

// Get a single trip by ID
export async function getTrip(tripId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("trips")
    .select("*, trip_requests(*)")
    .eq("id", tripId)
    .eq("user_id", user.id)
    .single();

  return data;
}

// Generate a trip from a trip request
// Matches a destination from the sample set based on the user's Travel DNA and budget,
// then fetches real flight pricing from Duffel + Kiwi (with mock fallback).
export async function generateTrip(tripRequestId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Fetch the trip request
  const { data: tripRequest, error: reqError } = await supabase
    .from("trip_requests")
    .select("*")
    .eq("id", tripRequestId)
    .eq("user_id", user.id)
    .single();

  if (reqError || !tripRequest) {
    return { error: "Trip request not found" };
  }

  // Fetch the user's active Travel DNA (if any)
  const { data: dna } = await supabase
    .from("travel_dna")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .single();

  // Import destinations and helpers from constants (server-side)
  const { ALL_DESTINATIONS, SAMPLE_DESTINATIONS, DOMESTIC_DESTINATIONS, DEPARTURE_CITY_COORDS } = await import("@/lib/constants");

  // ---- Helpers ----
  const travelMode = tripRequest.travel_mode || "flights-included";
  const TRAVEL_RATIO_MAX = 0.33; // Max 33% of trip spent traveling

  // One-way flight hours by region (from continental US, conservative estimates)
  const FLIGHT_HOURS: Record<string, number> = {
    "Asia": 20,
    "Oceania": 22,
    "Europe": 12,
    "Africa": 18,
    "South America": 12,
    "Central America": 6,
    "Caribbean": 5,
    "Middle East": 18,
    "Domestic": 4,
  };

  // Haversine distance in miles between two lat/lng points
  function haversineMiles(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 3959; // Earth radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  // Estimate driving hours from straight-line distance (1.3x road factor, 55mph avg)
  function estimateDriveHours(miles: number): number {
    const roadMiles = miles * 1.3;
    return roadMiles / 55;
  }

  // Get departure city coordinates (fall back to geographic center of US)
  const departureCoords = DEPARTURE_CITY_COORDS[tripRequest.departure_city]
    ?? { lat: 39.8283, lng: -98.5795 };

  // Trip duration in total hours
  const tripDays = Math.max(1, Math.ceil(
    (new Date(tripRequest.return_date).getTime() - new Date(tripRequest.departure_date).getTime()) / (1000 * 60 * 60 * 24)
  ));
  const tripHours = tripDays * 24;
  const maxOneWayTravelHours = (tripHours * TRAVEL_RATIO_MAX) / 2; // 33% total = 16.5% each way

  // ---- Build candidate pool based on travel mode ----
  type DestWithTravel = typeof ALL_DESTINATIONS[number] & {
    oneWayHours: number;
    travelMode: string;
  };

  let candidates: DestWithTravel[] = [];

  if (travelMode === "road-trip") {
    // Road trip: only domestic destinations within drive-time budget
    candidates = DOMESTIC_DESTINATIONS
      .map((dest) => {
        const miles = haversineMiles(departureCoords.lat, departureCoords.lng, dest.lat, dest.lng);
        const driveHours = estimateDriveHours(miles);
        return { ...dest, oneWayHours: driveHours, travelMode: "drive" };
      })
      .filter((d) => d.oneWayHours <= maxOneWayTravelHours);
  } else if (travelMode === "arrange-own-flights") {
    // User books own flights: all destinations, but still apply 33% feasibility
    // based on flight time so we don't suggest Bali for a 3-day trip
    candidates = ALL_DESTINATIONS
      .map((dest) => {
        const flightHours = FLIGHT_HOURS[dest.region] ?? 6;
        return { ...dest, oneWayHours: flightHours, travelMode: "own-flights" };
      })
      .filter((d) => d.oneWayHours <= maxOneWayTravelHours);
  } else {
    // Flights included: all destinations within 33% flight-time budget
    candidates = ALL_DESTINATIONS
      .map((dest) => {
        const flightHours = FLIGHT_HOURS[dest.region] ?? 6;
        return { ...dest, oneWayHours: flightHours, travelMode: "flights" };
      })
      .filter((d) => d.oneWayHours <= maxOneWayTravelHours);
  }

  // Fallback: if no candidates pass the filter (very short trip), use domestic only
  if (candidates.length < 2) {
    candidates = DOMESTIC_DESTINATIONS.map((dest) => {
      const miles = haversineMiles(departureCoords.lat, departureCoords.lng, dest.lat, dest.lng);
      const driveHours = estimateDriveHours(miles);
      const flightHours = FLIGHT_HOURS[dest.region] ?? 4;
      const oneWayHours = travelMode === "road-trip" ? driveHours : flightHours;
      return { ...dest, oneWayHours, travelMode: travelMode === "road-trip" ? "drive" : "flights" };
    });
  }

  // ---- Score each candidate ----
  type ScoredDest = DestWithTravel & { score: number };
  const scored: ScoredDest[] = candidates.map((dest) => {
    let score = 0;

    // Budget fit (max 30 points)
    const budgetMid = (tripRequest.budget_min + tripRequest.budget_max) / 2;
    const budgetDiff = Math.abs(dest.avgPrice - budgetMid);
    const budgetRange = tripRequest.budget_max - tripRequest.budget_min;
    score += Math.max(0, 30 - (budgetDiff / Math.max(budgetRange, 1)) * 15);

    // Travel time penalty: prefer destinations with less travel overhead
    const travelRatio = (dest.oneWayHours * 2) / tripHours;
    score -= travelRatio * 20;

    // DNA matching (if available)
    if (dna) {
      const tags = dest.tags;
      if (dna.adventure > 0 && tags.some((t: string) => ["adventure", "hiking", "outdoor"].includes(t))) score += 15;
      if (dna.adventure < 0 && tags.some((t: string) => ["beach", "luxury", "romantic"].includes(t))) score += 15;
      if (dna.cultural > 0 && tags.some((t: string) => ["culture", "art", "history", "architecture"].includes(t))) score += 15;
      if (dna.cultural < 0 && tags.some((t: string) => ["nature", "beach", "outdoor"].includes(t))) score += 15;
      if (dna.budget > 0 && tags.some((t: string) => ["luxury", "shopping", "modern"].includes(t))) score += 10;
      if (dna.budget < 0 && tags.some((t: string) => ["budget"].includes(t))) score += 10;
      if (dna.social > 0 && tags.some((t: string) => ["nightlife", "urban", "food"].includes(t))) score += 10;
      if (dna.social < 0 && tags.some((t: string) => ["nature", "unique", "photography"].includes(t))) score += 10;
      if (dna.energy > 0 && tags.some((t: string) => ["adventure", "hiking", "nightlife"].includes(t))) score += 10;
      if (dna.energy < 0 && tags.some((t: string) => ["beach", "romantic", "nature"].includes(t))) score += 10;
    }

    // Small random factor for variety
    score += Math.random() * 5;

    return { ...dest, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const chosen = scored[0];

  // ---- Calculate stay duration ----
  const startDate = tripRequest.departure_date;
  const endDate = tripRequest.return_date;
  const totalNights = tripDays;

  // Travel days: each way loses a day if travel > 8 hours
  const travelDaysEachWay = chosen.oneWayHours >= 8 ? 1 : 0;
  const stayNights = Math.max(1, totalNights - (travelDaysEachWay * 2));
  const activityDays = stayNights;

  // ---- Real flight pricing (Duffel + Kiwi) ----
  const isRoadTrip = travelMode === "road-trip";
  const includesFlights = travelMode === "flights-included";

  let flightData: FlightSearchResult | null = null;
  if (!isRoadTrip) {
    try {
      flightData = await searchRealFlights({
        departureCity: tripRequest.departure_city,
        destinationCity: chosen.name,
        departureDate: startDate,
        returnDate: endDate,
        adults: tripRequest.party_size,
        budgetPreference: dna?.budget ?? 0,
      });
    } catch (err) {
      console.warn("[generateTrip] Flight search failed, using mock pricing:", err);
    }
  }

  // ---- Price ----
  let pricePerPerson: number;
  let flightAirline: string;
  let flightSource: string | null = null;
  let flightBookingUrl: string | null = null;
  let flightPriceRange: { low: number; high: number } | null = null;

  if (flightData?.bestPrice && !isRoadTrip) {
    // Real pricing available: use it
    const pick = (dna?.budget ?? 0) < 0 ? flightData.bestPrice : (flightData.bestExperience ?? flightData.bestPrice);
    const flightCostPerPerson = Math.round(pick.price / tripRequest.party_size);
    // Estimate accommodation + activities on top of flight cost
    const groundCostPerPerson = Math.round(chosen.avgPrice * 0.5 * (0.85 + Math.random() * 0.3));
    pricePerPerson = flightCostPerPerson + groundCostPerPerson;
    flightAirline = pick.airlineName;
    flightSource = pick.source;
    flightBookingUrl = pick.bookingUrl;
    flightPriceRange = flightData.priceRange;
  } else {
    // Mock fallback pricing
    const flightDiscount = isRoadTrip ? 0.65 : travelMode === "arrange-own-flights" ? 0.7 : 1.0;
    pricePerPerson = Math.round(
      chosen.avgPrice * flightDiscount * (0.85 + Math.random() * 0.3)
    );
    const mockAirlines = ["United Airlines", "Delta", "Emirates", "British Airways", "Lufthansa", "JAL"];
    flightAirline = mockAirlines[Math.floor(Math.random() * mockAirlines.length)];
  }
  const totalPrice = pricePerPerson * tripRequest.party_size;

  // Drive distance for road trips
  const driveMiles = isRoadTrip
    ? Math.round(haversineMiles(departureCoords.lat, departureCoords.lng, chosen.lat, chosen.lng) * 1.3)
    : 0;

  // ---- Build itinerary ----
  const itinerary: Record<string, unknown> = {
    accommodation: {
      name: `${["Grand", "Boutique", "The", "Hotel"][Math.floor(Math.random() * 4)]} ${chosen.name} ${["Resort", "Hotel", "Inn", "Lodge", "Suites"][Math.floor(Math.random() * 5)]}`,
      nights: stayNights,
      type: dna && dna.budget > 0 ? "4-star" : "3-star",
    },
    activities: generateActivities(chosen.tags, activityDays),
    travelMode,
    travelInfo: {
      estimatedOneWayHours: Math.round(chosen.oneWayHours),
      travelDaysEachWay,
      stayNights,
      activityDays,
      mode: travelMode,
    },
    // Pricing metadata
    pricingSource: flightSource ?? "estimated",
    flightPriceRange,
  };

  if (includesFlights) {
    // Use real flight data if available, otherwise mock
    const outboundDuration = flightData?.bestPrice?.outboundDuration ?? null;
    const returnDuration = flightData?.bestPrice?.returnDuration ?? null;
    const stops = flightData?.bestPrice?.stops ?? null;

    itinerary.flights = {
      outbound: {
        from: tripRequest.departure_city,
        to: `${chosen.name}, ${chosen.country}`,
        date: startDate,
        airline: flightAirline,
        estimatedHours: Math.round(chosen.oneWayHours),
        ...(outboundDuration && { duration: outboundDuration }),
        ...(stops !== null && { stops }),
      },
      return: {
        from: `${chosen.name}, ${chosen.country}`,
        to: tripRequest.departure_city,
        date: endDate,
        airline: flightAirline,
        estimatedHours: Math.round(chosen.oneWayHours),
        ...(returnDuration && { duration: returnDuration }),
      },
      ...(flightBookingUrl && { bookingUrl: flightBookingUrl }),
      ...(flightSource && { dataSource: flightSource }),
    };
  } else if (travelMode === "arrange-own-flights") {
    itinerary.flights = {
      note: "You are arranging your own flights to and from the destination.",
      estimatedFlightHours: Math.round(chosen.oneWayHours),
      ...(flightPriceRange && { estimatedPriceRange: flightPriceRange }),
    };
  }

  if (isRoadTrip) {
    itinerary.driving = {
      from: tripRequest.departure_city,
      to: `${chosen.name}, ${chosen.country}`,
      estimatedMiles: driveMiles,
      estimatedHours: Math.round(chosen.oneWayHours),
    };
  }

  // Insert the trip (authenticated users have INSERT grant + RLS policy)
  const { data: trip, error: tripError } = await supabase
    .from("trips")
    .insert({
      trip_request_id: tripRequestId,
      user_id: user.id,
      destination_name: chosen.name,
      destination_country: chosen.country,
      destination_lat: chosen.lat,
      destination_lng: chosen.lng,
      start_date: startDate,
      end_date: endDate,
      price_cents: totalPrice * 100,
      currency: "usd",
      itinerary,
      status: "available",
    })
    .select("id")
    .single();

  if (tripError) {
    return { error: tripError.message };
  }

  // Update the trip request status to "ready"
  await supabase
    .from("trip_requests")
    .update({ status: "ready" })
    .eq("id", tripRequestId);

  return { data: { id: trip.id } };
}

// Helper: generate sample activities based on destination tags
function generateActivities(tags: string[], days: number): string[] {
  const activityPool: Record<string, string[]> = {
    culture: ["Guided walking tour of historic quarter", "Visit local museums and galleries", "Cooking class with local chef"],
    food: ["Street food tasting tour", "Fine dining experience", "Local market visit and cooking class"],
    beach: ["Beach day with snorkeling", "Sunset sailing cruise", "Beachfront yoga session"],
    adventure: ["Guided hiking expedition", "Zip-lining through the canopy", "White-water rafting"],
    nature: ["National park day trip", "Sunrise nature walk", "Wildlife spotting tour"],
    hiking: ["Mountain trail trek", "Waterfall hike", "Ridge-line sunrise hike"],
    luxury: ["Spa and wellness day", "Private yacht excursion", "Champagne sunset experience"],
    history: ["Ancient ruins guided tour", "Historical museum deep dive", "Archaeological site visit"],
    architecture: ["Architecture walking tour", "Cathedral and monument visits", "Rooftop city panorama tour"],
    urban: ["City highlights bike tour", "Neighborhood exploration walk", "Rooftop bar crawl"],
    nightlife: ["Evening food and bar crawl", "Live music venue visit", "Night market exploration"],
    romantic: ["Couples spa treatment", "Private sunset dinner", "Scenic gondola or boat ride"],
    photography: ["Golden hour photo walk", "Scenic viewpoint tour", "Drone-friendly landscape visit"],
    desert: ["Desert safari adventure", "Stargazing in the dunes", "Camel trek at sunset"],
    diving: ["Coral reef diving excursion", "Snorkeling with marine life", "Underwater photography tour"],
    budget: ["Free walking tour", "Local street food crawl", "Public park and garden visit"],
    shopping: ["Designer district shopping tour", "Local artisan market visit", "Souvenir hunting walk"],
    tech: ["Tech district exploration", "Robot restaurant experience", "Arcade and gaming quarter visit"],
    outdoor: ["Kayaking adventure", "Mountain biking trail", "Rock climbing experience"],
    unique: ["Geothermal hot springs visit", "Northern Lights viewing tour", "Glacier walk expedition"],
    modern: ["Observation deck visit", "Futuristic architecture tour", "Luxury mall exploration"],
    art: ["Contemporary art gallery tour", "Street art walking tour", "Artist studio visits"],
  };

  const activities: string[] = [];
  const usedActivities = new Set<string>();

  // Pull activities from matching tags
  for (const tag of tags) {
    const pool = activityPool[tag] || [];
    for (const activity of pool) {
      if (!usedActivities.has(activity)) {
        activities.push(activity);
        usedActivities.add(activity);
      }
    }
  }

  // Pad with generic activities if needed
  const generic = ["Free day to explore at your own pace", "Rest and relaxation day", "Local cafe and bookshop morning"];
  for (const g of generic) {
    if (!usedActivities.has(g)) activities.push(g);
  }

  // Return exactly one activity per day
  return activities.slice(0, days);
}

// Sign out
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
