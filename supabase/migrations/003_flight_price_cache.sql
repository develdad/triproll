-- Flight price cache table for Amadeus + Kiwi API results
-- Caches search results by route+date with 24h TTL
-- Used by lib/apis/flights.ts to minimize API calls

CREATE TABLE IF NOT EXISTS public.flight_price_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cache_key TEXT NOT NULL UNIQUE,  -- "{origin}-{dest}-{date}-{returnDate}"
  origin TEXT NOT NULL,            -- IATA code
  destination TEXT NOT NULL,       -- IATA code
  departure_date DATE NOT NULL,
  return_date DATE,
  result JSONB NOT NULL,           -- Full FlightSearchResult object
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for cache lookups (primary path)
CREATE INDEX IF NOT EXISTS idx_flight_cache_key ON public.flight_price_cache(cache_key);

-- Index for cleanup of stale entries
CREATE INDEX IF NOT EXISTS idx_flight_cache_fetched ON public.flight_price_cache(fetched_at);

-- RLS: service role can read/write, authenticated users can read
ALTER TABLE public.flight_price_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on flight_price_cache"
  ON public.flight_price_cache
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Grant access
GRANT SELECT ON public.flight_price_cache TO authenticated;
GRANT ALL ON public.flight_price_cache TO service_role;

-- Optional: function to clean stale cache entries (run periodically)
CREATE OR REPLACE FUNCTION clean_flight_cache(max_age_hours INTEGER DEFAULT 48)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.flight_price_cache
  WHERE fetched_at < NOW() - (max_age_hours || ' hours')::INTERVAL;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;
