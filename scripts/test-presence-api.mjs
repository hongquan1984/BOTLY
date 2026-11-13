import nextEnv from '@next/env';

const env = nextEnv.loadEnvConfig('d:\\botly').combinedEnv;
const url = (env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');
const key = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY;

async function test() {
  const payload = [{
    user_id: 'test-user-multiplayer-1',
    region: 'healthclues-realm',
    nickname: 'Test Adventurer 1',
    avatar_key: 'chibi-leo',
    x: 750,
    y: 420,
    facing: 'right',
    walking: false,
    status_action: 'wave',
    speech: 'Chào bạn!',
    updated_at: new Date().toISOString()
  }];

  console.log('Testing PostgREST upsert...');
  const res = await fetch(`${url}/rest/v1/healthclues_online_presence`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=representation'
    },
    body: JSON.stringify(payload)
  });

  console.log('Upsert status:', res.status);
  const data = await res.json();
  console.log('Result:', data);

  console.log('Testing query active users...');
  const queryRes = await fetch(`${url}/rest/v1/healthclues_online_presence?region=eq.healthclues-realm&select=*`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`
    }
  });
  console.log('Query status:', queryRes.status);
  const queryData = await queryRes.json();
  console.log('Active players found:', queryData);

  // Clean up test row
  await fetch(`${url}/rest/v1/healthclues_online_presence?user_id=eq.test-user-multiplayer-1`, {
    method: 'DELETE',
    headers: { apikey: key, Authorization: `Bearer ${key}` }
  });
  console.log('Cleaned up test row.');
}

test().catch(console.error);
