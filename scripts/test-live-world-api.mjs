import nextEnv from '@next/env';
import { randomUUID } from 'node:crypto';

const env = nextEnv.loadEnvConfig('d:\\botly').combinedEnv;
const url = (env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
const serviceKey = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY || "";
const publicKey = env.SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

async function main() {
  console.log("=== TESTING LIVE WORLD API ON BOTLY.VN ===");

  const testEmail = `live-test-${Date.now()}@example.invalid`;
  const testPassword = `Pass_${randomUUID()}_!1aA`;

  console.log("1. Creating temporary test user in Supabase Auth...");
  const adminRes = await fetch(`${url}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: { test_only: true }
    })
  });

  if (!adminRes.ok) {
    console.error("Admin user creation failed:", adminRes.status, await adminRes.text());
    return;
  }
  const adminUserData = await adminRes.json();
  const userId = adminUserData.id;
  console.log("  -> User created:", userId);

  try {
    console.log("2. Signing in to obtain access token...");
    const tokenRes = await fetch(`${url}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { apikey: publicKey, "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEmail, password: testPassword })
    });
    if (!tokenRes.ok) {
      console.error("Token login failed:", tokenRes.status, await tokenRes.text());
      return;
    }
    const tokenData = await tokenRes.json();
    const token = tokenData.access_token;
    console.log("  -> Access token acquired successfully!");

    console.log("3. Calling GET https://www.botly.vn/api/healthclues/world with Bearer token...");
    const liveGetRes = await fetch("https://www.botly.vn/api/healthclues/world", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log(`  -> GET /api/healthclues/world status: ${liveGetRes.status}`);
    const getData = await liveGetRes.json();
    console.log("  -> GET response data:", getData);

    if (liveGetRes.status === 200 && getData.world === null) {
      console.log("✓ GET /api/healthclues/world returned 200 with empty world as expected for a new user!");
    } else {
      console.error("✗ Unexpected GET response:", liveGetRes.status, getData);
    }

    console.log("4. Calling POST https://www.botly.vn/api/healthclues/world to create World...");
    const requestKey = randomUUID();
    const livePostRes = await fetch("https://www.botly.vn/api/healthclues/world", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        requestKey,
        topicKey: "health-concern",
        title: "HealthClues Realm",
        timezone: "Asia/Bangkok",
        startedOn: "2026-11-06",
        selections: []
      })
    });
    console.log(`  -> POST /api/healthclues/world status: ${livePostRes.status}`);
    const postData = await livePostRes.json();
    console.log("  -> POST response data:", postData);

    if (livePostRes.status === 201 || livePostRes.status === 200) {
      console.log("✓ POST /api/healthclues/world succeeded! World created:", postData.world_id);
    } else {
      console.error("✗ POST failed:", livePostRes.status, postData);
    }

    console.log("5. Re-calling GET https://www.botly.vn/api/healthclues/world to verify world is populated...");
    const liveGetRes2 = await fetch("https://www.botly.vn/api/healthclues/world", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log(`  -> GET status: ${liveGetRes2.status}`);
    const getData2 = await liveGetRes2.json();
    console.log("  -> World loaded:", getData2.world?.id, getData2.world?.title);
    if (getData2.world && getData2.world.id === postData.world_id) {
      console.log("✓ World loaded successfully on live botly.vn!");
    }

  } finally {
    console.log("6. Cleaning up test user...");
    await fetch(`${url}/auth/v1/admin/users/${userId}`, {
      method: "DELETE",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`
      }
    });
    console.log("  -> Temporary test user removed.");
  }
}

main().catch(console.error);
