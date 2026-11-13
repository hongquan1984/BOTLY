import nextEnv from "@next/env";
import path from "node:path";

const projectRoot = "D:\\botly";
const env = nextEnv.loadEnvConfig(projectRoot).combinedEnv;

const url = (env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
const serviceKey = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY || "";
const publicKey = env.SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

console.log("Supabase URL:", url);
console.log("Service key present:", Boolean(serviceKey), serviceKey.slice(0, 15) + "...");
console.log("Public key present:", Boolean(publicKey), publicKey.slice(0, 15) + "...");

async function testTable(table) {
  try {
    const res = await fetch(`${url}/rest/v1/${table}?select=*&limit=1`, {
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
    });
    console.log(`Table '${table}': status ${res.status}`);
    if (!res.ok) {
      console.log(`  Error:`, await res.text());
    } else {
      console.log(`  OK, rows:`, await res.json());
    }
  } catch (err) {
    console.log(`Table '${table}' fetch failed:`, err.message);
  }
}

async function run() {
  await testTable("healthclues_account_deletion_requests");
  await testTable("healthclues_wellness_worlds");
  await testTable("healthclues_profiles");
  await testTable("healthclues_branches");
}

run();
