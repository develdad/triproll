-- Seller of Travel geofencing: capture the customer's state of residence on
-- each trip request so we can enforce which states TripRoll v1 operates in.
alter table public.trip_requests
  add column if not exists residency_state text;

comment on column public.trip_requests.residency_state is
  'US state of residence (2-letter code). Used for Seller of Travel geofencing in v1.';
