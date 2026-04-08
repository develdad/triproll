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

// Sign out
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
