-- ============================================================================
-- TripRoll Database Schema
-- Run this in the Supabase SQL Editor to set up your database.
-- ============================================================================

-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- ============================================================================
-- PROFILES
-- Extends the built-in auth.users table with app-specific data.
-- ============================================================================
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  full_name text,
  avatar_url text,
  departure_city text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Users can read and update their own profile
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- TRAVEL DNA
-- Stores personality assessment results per user.
-- Users can retake; we keep history but mark the latest as active.
-- ============================================================================
create table public.travel_dna (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  adventure float not null default 0,    -- -1 (relaxation) to 1 (adventure)
  social float not null default 0,       -- -1 (solitary) to 1 (social)
  structure float not null default 0,    -- -1 (spontaneous) to 1 (structured)
  cultural float not null default 0,     -- -1 (sensory) to 1 (cultural)
  budget float not null default 0,       -- -1 (budget) to 1 (splurge)
  energy float not null default 0,       -- -1 (calm) to 1 (energetic)
  archetype text not null,               -- e.g. "Explorer-Wanderer"
  is_active boolean default true not null,
  created_at timestamptz default now() not null
);

alter table public.travel_dna enable row level security;

create policy "Users can view own travel DNA"
  on public.travel_dna for select
  using (auth.uid() = user_id);

create policy "Users can insert own travel DNA"
  on public.travel_dna for insert
  with check (auth.uid() = user_id);

create policy "Users can update own travel DNA"
  on public.travel_dna for update
  using (auth.uid() = user_id);

-- Index for quick lookup of active DNA
create index idx_travel_dna_active on public.travel_dna (user_id, is_active)
  where is_active = true;

-- ============================================================================
-- TRIP REQUESTS
-- What the user submits: dates, budget, party info, constraints.
-- ============================================================================
create table public.trip_requests (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  travel_dna_id uuid references public.travel_dna(id),
  departure_date date not null,
  return_date date not null,
  budget_min integer not null,
  budget_max integer not null,
  party_size integer not null default 1,
  party_type text not null default 'solo'
    check (party_type in ('solo', 'couple', 'small-group', 'group')),
  departure_city text not null,
  travel_mode text not null default 'flights-included'
    check (travel_mode in ('flights-included', 'arrange-own-flights', 'road-trip')),
  constraints_dietary text[] default '{}',
  constraints_mobility text[] default '{}',
  constraints_passport text[] default '{}',
  constraints_other text default '',
  mode text not null default 'commitment'
    check (mode in ('playground', 'commitment')),
  status text not null default 'submitted'
    check (status in ('draft', 'submitted', 'curating', 'ready', 'booked', 'completed', 'cancelled')),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.trip_requests enable row level security;

create policy "Users can view own trip requests"
  on public.trip_requests for select
  using (auth.uid() = user_id);

create policy "Users can insert own trip requests"
  on public.trip_requests for insert
  with check (auth.uid() = user_id);

create policy "Users can update own trip requests"
  on public.trip_requests for update
  using (auth.uid() = user_id);

-- ============================================================================
-- TRIPS
-- The curated trip package (filled in by admin/curator after a request).
-- ============================================================================
create table public.trips (
  id uuid default uuid_generate_v4() primary key,
  trip_request_id uuid references public.trip_requests(id) on delete set null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  destination_name text not null,
  destination_country text not null,
  destination_lat float,
  destination_lng float,
  start_date date not null,
  end_date date not null,
  price_cents integer not null,           -- total price in cents
  currency text default 'usd' not null,
  itinerary jsonb default '{}' not null,  -- flexible JSON for flights, hotel, activities
  status text not null default 'available'
    check (status in ('available', 'held', 'booked', 'completed', 'cancelled')),
  stripe_payment_intent_id text,
  hold_expires_at timestamptz,            -- 48-hour hold window
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.trips enable row level security;

create policy "Users can view own trips"
  on public.trips for select
  using (auth.uid() = user_id);

-- Users can insert trips (via generateTrip server action, user_id must match)
create policy "Users can insert own trips"
  on public.trips for insert
  with check (auth.uid() = user_id);

-- Users can update their own trips (e.g. booking status changes)
create policy "Users can update own trips"
  on public.trips for update
  using (auth.uid() = user_id);

-- ============================================================================
-- WAITLIST
-- Email signups from the landing page.
-- ============================================================================
create table public.waitlist (
  id uuid default uuid_generate_v4() primary key,
  email text not null unique,
  source text default 'landing' not null,
  created_at timestamptz default now() not null
);

-- Waitlist is insert-only from the client; no RLS needed for reads
alter table public.waitlist enable row level security;

create policy "Anyone can join the waitlist"
  on public.waitlist for insert
  with check (true);

-- ============================================================================
-- HELPER: auto-update updated_at timestamps
-- ============================================================================
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.update_updated_at();

create trigger trip_requests_updated_at
  before update on public.trip_requests
  for each row execute function public.update_updated_at();

create trigger trips_updated_at
  before update on public.trips
  for each row execute function public.update_updated_at();
