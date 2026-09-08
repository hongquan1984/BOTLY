import 'server-only';

export function supabaseConfig(admin = false) {
  const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL)?.replace(/\/$/, '');
  const key = admin
    ? (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)
    : (process.env.SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  return url && key ? { url, key } : null;
}

export async function supabaseRequest(path: string, init: RequestInit = {}, admin = false) {
  const config = supabaseConfig(admin);
  if (!config) throw new Error('SUPABASE_NOT_CONFIGURED');
  return fetch(`${config.url}/rest/v1/${path}`, {
    ...init, cache: 'no-store', signal: AbortSignal.timeout(15000),
    headers: { apikey: config.key, ...(!config.key.startsWith('sb_') ? { Authorization: `Bearer ${config.key}` } : {}),
      'Content-Type': 'application/json', ...init.headers },
  });
}
