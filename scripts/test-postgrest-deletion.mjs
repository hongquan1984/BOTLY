import nextEnv from '@next/env';

const env = nextEnv.loadEnvConfig('d:\\botly').combinedEnv;
const url = (env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
const serviceKey = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY || "";

async function main() {
  console.log("Testing PostgREST query to healthclues_account_deletion_requests...");
  console.log("URL:", url);
  console.log("Service key starts with:", serviceKey.slice(0, 20) + "...");

  const res = await fetch(`${url}/rest/v1/healthclues_account_deletion_requests?select=id&limit=1`, {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
    }
  });

  console.log("Status:", res.status, res.statusText);
  const text = await res.text();
  console.log("Response:", text);
}

main().catch(console.error);
