-- The admin analytics API calls this RPC with the server service role.
-- Revoke the baseline's public grants so raw aggregates cannot be queried
-- directly through the public Supabase REST endpoint.
REVOKE ALL ON FUNCTION public.get_admin_analytics(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_analytics(integer) TO service_role;

