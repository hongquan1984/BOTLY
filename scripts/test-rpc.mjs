import nextEnv from '@next/env';

const env = nextEnv.loadEnvConfig('d:\\botly').combinedEnv;
const url = (env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
const serviceKey = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY || "";

async function main() {
  const res = await fetch(`${url}/rest/v1/rpc/healthclues_create_world_v1`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      p_user_id: "00000000-0000-0000-0000-000000000000",
      p_request_key: "00000000-0000-0000-0000-000000000000",
      p_topic_key: "health-concern",
      p_title: "HealthClues Realm",
      p_timezone: "Asia/Bangkok",
      p_started_on: "2026-11-06",
      p_selections: []
    })
  });
  console.log("RPC Status:", res.status);
  console.log("RPC Response:", await res.text());
}

main().catch(console.error);
