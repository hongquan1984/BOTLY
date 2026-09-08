const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL)?.replace(/\/$/, '');
const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const publicKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !key || !publicKey) {
  console.error('Missing Supabase URL, public key or service-role key in .env.local');
  process.exitCode = 1;
} else {
  for (const table of ['wellness_categories', 'wellness_channels', 'wellness_articles',
    'wellness_article_translations', 'wellness_channel_tokens', 'wellness_publish_limits']) {
    const response = await fetch(`${url}/rest/v1/${table}?select=*&limit=0`, {
      headers: { apikey: key, ...(!key.startsWith('sb_') ? { Authorization: `Bearer ${key}` } : {}) }, signal: AbortSignal.timeout(15000),
    });
    console.log(`${table}: ${response.ok ? 'OK' : `HTTP ${response.status}`}`);
    if (!response.ok) process.exitCode = 1;
  }
  const response = await fetch(`${url}/rest/v1/rpc/publish_wellness_article`, {
    method: 'POST', headers: { apikey: key, ...(!key.startsWith('sb_') ? { Authorization: `Bearer ${key}` } : {}), 'Content-Type': 'application/json' },
    body: JSON.stringify({ p_token_hash: '0'.repeat(64), p_payload: {} }), signal: AbortSignal.timeout(15000),
  });
  const result = await response.json();
  const ready = result.message === 'UNAUTHORIZED';
  console.log(`Publishing RPC: ${ready ? 'OK (invalid token rejected)' : 'NOT READY'}`);
  if (!ready) process.exitCode = 1;
}
