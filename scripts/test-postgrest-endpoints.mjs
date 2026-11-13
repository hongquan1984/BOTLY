import nextEnv from '@next/env';

const env = nextEnv.loadEnvConfig('d:\\botly').combinedEnv;
const url = (env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
const serviceKey = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY || "";

async function testEndpoint(name, path, method = "GET", body = null) {
  const init = {
    method,
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json"
    }
  };
  if (body) init.body = JSON.stringify(body);

  const res = await fetch(`${url}/rest/v1/${path}`, init);
  console.log(`[${res.status}] ${name} -> ${path}`);
  if (!res.ok) {
    const text = await res.text();
    console.error(`  Error: ${text}`);
  }
}

async function main() {
  await testEndpoint("Deletion Requests", "healthclues_account_deletion_requests?select=id&limit=1");
  await testEndpoint("Wellness Worlds", "healthclues_wellness_worlds?select=id,title&limit=1");
  await testEndpoint("Branches", "healthclues_branches?select=id,topic_key&limit=1");
  await testEndpoint("Journeys", "healthclues_journeys?select=id,title&limit=1");
  await testEndpoint("Toolkit Entries", "healthclues_toolkit_entries?select=id&limit=1");
  await testEndpoint("Profiles", "healthclues_profiles?select=user_id&limit=1");
  await testEndpoint("Catalog Items", "healthclues_catalog_items?select=id,slug&limit=5");
  await testEndpoint("Create World RPC check", "rpc/healthclues_create_world_v1", "POST", {});
}

main().catch(console.error);
