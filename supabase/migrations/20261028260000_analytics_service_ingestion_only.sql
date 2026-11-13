-- Analytics writes must pass through the server ingestion routes so their
-- consent checks and HealthClues data minimization cannot be bypassed.
DROP POLICY IF EXISTS anon_insert_analytics ON public.analytics_events;
REVOKE INSERT ON TABLE public.analytics_events FROM anon, authenticated;

