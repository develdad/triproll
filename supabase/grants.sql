-- ============================================================================
-- TripRoll Database GRANT Permissions
-- Run this in the Supabase SQL Editor AFTER running schema.sql
-- These are required for RLS policies to work with the anon/authenticated roles.
-- ============================================================================

-- Waitlist: anyone can insert (landing page signups)
grant insert on public.waitlist to anon, authenticated;
grant select on public.waitlist to anon, authenticated;

-- Profiles: authenticated users manage their own profile
grant select, insert, update on public.profiles to authenticated;

-- Travel DNA: authenticated users manage their assessments
grant select, insert, update on public.travel_dna to authenticated;

-- Trip Requests: authenticated users manage their requests
grant select, insert, update on public.trip_requests to authenticated;

-- Trips: users can view and update (for booking status), service_role inserts (curation)
grant select, update on public.trips to authenticated;
grant insert on public.trips to service_role;
