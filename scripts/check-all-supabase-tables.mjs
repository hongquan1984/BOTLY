import nextEnv from "@next/env";

const projectRoot = "D:\\botly";
const env = nextEnv.loadEnvConfig(projectRoot).combinedEnv;

const url = (env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
const serviceKey = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY || "";

async function checkAllTables() {
  const res = await fetch(`${url}/rest/v1/`, {
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
  });
  console.log("Root OpenAPI status:", res.status);
  const data = await res.json();
  const definitions = Object.keys(data.definitions || {});
  console.log("Existing tables in Supabase:", definitions);
}

checkAllTables();
