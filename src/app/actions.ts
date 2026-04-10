"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

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
// This is the "Wizard of Oz" version: matches a destination from the sample set
// based on the user's Travel DNA and budget, then creates a trip record.
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

  // Import destinations from constants (server-side)
  const { SAMPLE_DESTINATIONS } = await import("@/lib/constants");

  // ---- Travel time estimation ----
  // Rough one-way travel hours from major US cities to destination regions.
  // Includes airport time, layovers, and transit. These are conservative estimates.
  const TRAVEL_HOURS: Record<string, number> = {
    "Asia": 20,
    "Oceania": 22,
    "Europe": 12,
    "Africa": 18,
    "South America": 12,
    "Middle East": 18,
  };

  // Calculate trip length in days
  const tripDays = Math.max(1, Math.ceil(
    (new Date(tripRequest.return_date).getTime() - new Date(tripRequest.departure_date).getTime()) / (1000 * 60 * 60 * 24)
  ));

  // Filter destinations by travel feasibility.
  // Rule: one-way travel time (in days, rounded up) should be at most 25% of the total trip.
  // E.g., a 20-hour flight = ~1 travel day each way = 2 travel days total.
  // For a 4-day trip, 2 travel days = 50% -> not feasible.
  // For an 8-day trip, 2 travel days = 25% -> feasible.
  const feasibleDestinations = SAMPLE_DESTINATIONS.filter((dest) => {
    const oneWayHours = TRAVEL_HOURS[dest.region] ?? 6; // Default: domestic/nearby
    const totalTravelDays = Math.ceil(oneWayHours / 12) * 2; // Round up to half-days, both ways
    const travelRatio = totalTravelDays / tripDays;
    return travelRatio <= 0.25;
  });

  // If no destinations pass the filter (very short trip), fall back to all
  // but apply a heavy penalty for long travel times
  const candidateDestinations = feasibleDestinations.length >= 2
    ? feasibleDestinations
    : SAMPLE_DESTINATIONS;

  // Score each destination based on DNA + budget fit + travel feasibility
  type ScoredDest = typeof SAMPLE_DESTINATIONS[number] & { score: number };
  const scored: ScoredDest[] = candidateDestinations.map((dest) => {
    let score = 0;

    // Budget fit: prefer destinations within the user's budget range
    const budgetMid = (tripRequest.budget_min + tripRequest.budget_max) / 2;
    const budgetDiff = Math.abs(dest.avgPrice - budgetMid);
    const budgetRange = tripRequest.budget_max - tripRequest.budget_min;
    // Lower difference = higher score (max 30 points)
    score += Math.max(0, 30 - (budgetDiff / Math.max(budgetRange, 1)) * 15);

    // Travel time penalty: penalize destinations where travel eats into the trip
    const oneWayHours = TRAVEL_HOURS[dest.region] ?? 6;
    const totalTravelDays = Math.ceil(oneWayHours / 12) * 2;
    const travelRatio = totalTravelDays / tripDays;
    // Max 20 point penalty for travel-heavy trips
    score -= travelRatio * 20;

    // DNA matching (if available)
    if (dna) {
      const tags = dest.tags;

      // Adventure axis: adventure/hiking/outdoor tags
      if (dna.adventure > 0 && tags.some((t: string) => ["adventure", "hiking", "outdoor"].includes(t))) score += 15;
      if (dna.adventure < 0 && tags.some((t: string) => ["beach", "luxury", "romantic"].includes(t))) score += 15;

      // Cultural axis: culture/art/history tags
      if (dna.cultural > 0 && tags.some((t: string) => ["culture", "art", "history", "architecture"].includes(t))) score += 15;
      if (dna.cultural < 0 && tags.some((t: string) => ["nature", "beach", "outdoor"].includes(t))) score += 15;

      // Budget axis: budget vs luxury tags
      if (dna.budget > 0 && tags.some((t: string) => ["luxury", "shopping", "modern"].includes(t))) score += 10;
      if (dna.budget < 0 && tags.some((t: string) => ["budget"].includes(t))) score += 10;

      // Social axis: nightlife/urban vs nature/unique
      if (dna.social > 0 && tags.some((t: string) => ["nightlife", "urban", "food"].includes(t))) score += 10;
      if (dna.social < 0 && tags.some((t: string) => ["nature", "unique", "photography"].includes(t))) score += 10;

      // Energy axis: adventure/hiking vs beach/romantic
      if (dna.energy > 0 && tags.some((t: string) => ["adventure", "hiking", "nightlife"].includes(t))) score += 10;
      if (dna.energy < 0 && tags.some((t: string) => ["beach", "romantic", "nature"].includes(t))) score += 10;
    }

    // Small random factor to add variety
    score += Math.random() * 5;

    return { ...dest, score };
  });

  // Sort by score descending, pick the best match
  scored.sort((a, b) => b.score - a.score);
  const chosen = scored[0];

  // Calculate trip dates, stay duration, and price
  const startDate = tripRequest.departure_date;
  const endDate = tripRequest.return_date;
  const totalNights = Math.max(1, Math.ceil(
    (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
  ));

  // Subtract travel days from stay duration to get actual "on the ground" days
  const chosenOneWayHours = TRAVEL_HOURS[chosen.region] ?? 6;
  const travelDaysEachWay = chosenOneWayHours >= 12 ? 1 : 0; // Lose a day each way for long-haul
  const stayNights = Math.max(1, totalNights - (travelDaysEachWay * 2));
  // Full activity days = stay nights (you have full days between arrival and departure)
  const activityDays = stayNights;

  const pricePerPerson = Math.round(
    chosen.avgPrice * (0.85 + Math.random() * 0.3)
  );
  const totalPrice = pricePerPerson * tripRequest.party_size;

  // Build the itinerary
  const airlines = ["United Airlines", "Delta", "Emirates", "British Airways", "Lufthansa", "JAL"];
  const itinerary = {
    flights: {
      outbound: {
        from: tripRequest.departure_city,
        to: `${chosen.name}, ${chosen.country}`,
        date: startDate,
        airline: airlines[Math.floor(Math.random() * airlines.length)],
        estimatedHours: chosenOneWayHours,
      },
      return: {
        from: `${chosen.name}, ${chosen.country}`,
        to: tripRequest.departure_city,
        date: endDate,
        airline: airlines[Math.floor(Math.random() * airlines.length)],
        estimatedHours: chosenOneWayHours,
      },
    },
    accommodation: {
      name: `${["Grand", "Boutique", "The", "Hotel"][Math.floor(Math.random() * 4)]} ${chosen.name} ${["Resort", "Hotel", "Inn", "Lodge", "Suites"][Math.floor(Math.random() * 5)]}`,
      nights: stayNights,
      type: dna && dna.budget > 0 ? "4-star" : "3-star",
    },
    activities: generateActivities(chosen.tags, activityDays),
    travelInfo: {
      estimatedOneWayHours: chosenOneWayHours,
      travelDaysEachWay,
      stayNights,
      activityDays,
    },
  };

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
