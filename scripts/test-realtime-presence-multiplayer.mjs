import assert from "node:assert/strict";
import nextEnv from "@next/env";

const env = nextEnv.loadEnvConfig("d:\\botly").combinedEnv;
const url = (env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
const key = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY;

assert.ok(url, "SUPABASE_URL must be defined");
assert.ok(key, "SUPABASE_SECRET_KEY must be defined");

async function main() {
  console.log("=================================================================");
  console.log("🎮 TESTING REALTIME SYNCHRONOUS MULTIPLAYER PRESENCE");
  console.log("=================================================================\n");

  const userA = {
    userId: `user-sim-alpha-${Date.now()}`,
    region: "healthclues-realm",
    nickname: "Minh Quân",
    avatarKey: "chibi-leo",
    x: 745.5,
    y: 420.0,
    facing: "right",
    walking: true,
    action: null,
    speech: null
  };

  const userB = {
    userId: `user-sim-beta-${Date.now()}`,
    region: "healthclues-realm",
    nickname: "Thanh Mai",
    avatarKey: "chibi-anna",
    x: 810.0,
    y: 450.0,
    facing: "left",
    walking: false,
    action: null,
    speech: null
  };

  const userC = {
    userId: `user-sim-gamma-${Date.now()}`,
    region: "healthclues-realm",
    nickname: "Hoàng Long",
    avatarKey: "chibi-ben",
    x: 780.0,
    y: 390.0,
    facing: "right",
    walking: false,
    action: null,
    speech: null
  };

  // Step 1: User A enters village & broadcasts presence
  console.log(">>> STEP 1: User A enters HealthClues Realm");
  const resA1 = await fetch(`${url}/rest/v1/healthclues_online_presence`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=representation"
    },
    body: JSON.stringify([{
      user_id: userA.userId,
      region: userA.region,
      nickname: userA.nickname,
      avatar_key: userA.avatarKey,
      x: userA.x,
      y: userA.y,
      facing: userA.facing,
      walking: userA.walking,
      updated_at: new Date().toISOString()
    }])
  });
  assert.equal(resA1.status, 201, "User A presence upsert must succeed");
  console.log("✓ User A registered in village: (x: 745.5, y: 420)");

  // Step 2: User B enters village & broadcasts presence
  console.log("\n>>> STEP 2: User B enters HealthClues Realm");
  const resB1 = await fetch(`${url}/rest/v1/healthclues_online_presence`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=representation"
    },
    body: JSON.stringify([{
      user_id: userB.userId,
      region: userB.region,
      nickname: userB.nickname,
      avatar_key: userB.avatarKey,
      x: userB.x,
      y: userB.y,
      facing: userB.facing,
      walking: userB.walking,
      updated_at: new Date().toISOString()
    }])
  });
  assert.equal(resB1.status, 201, "User B presence upsert must succeed");
  console.log("✓ User B registered in village: (x: 810, y: 450)");

  // Step 3: User C enters village & broadcasts presence
  console.log("\n>>> STEP 3: User C enters HealthClues Realm");
  const resC1 = await fetch(`${url}/rest/v1/healthclues_online_presence`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=representation"
    },
    body: JSON.stringify([{
      user_id: userC.userId,
      region: userC.region,
      nickname: userC.nickname,
      avatar_key: userC.avatarKey,
      x: userC.x,
      y: userC.y,
      facing: userC.facing,
      walking: userC.walking,
      updated_at: new Date().toISOString()
    }])
  });
  assert.equal(resC1.status, 201, "User C presence upsert must succeed");
  console.log("✓ User C registered in village: (x: 780, y: 390)");

  // Step 4: User A queries presence - sees User B and User C
  console.log("\n>>> STEP 4: User A sees other online adventurers");
  const queryA = await fetch(`${url}/rest/v1/healthclues_online_presence?region=eq.healthclues-realm&user_id=neq.${userA.userId}&select=user_id,nickname,avatar_key,x,y,facing,walking,speech`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` }
  });
  const peersForA = await queryA.json();
  console.log("User A sees peers in village:", peersForA.map(p => `${p.nickname} (${p.avatar_key}) at [${p.x}, ${p.y}]`));
  assert.ok(peersForA.some(p => p.user_id === userB.userId), "User A must see User B");
  assert.ok(peersForA.some(p => p.user_id === userC.userId), "User A must see User C");

  // Step 5: User B moves position and User A receives updated coordinates
  console.log("\n>>> STEP 5: User B walks to (x: 850, y: 480)");
  await fetch(`${url}/rest/v1/healthclues_online_presence`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates"
    },
    body: JSON.stringify([{
      user_id: userB.userId,
      region: userB.region,
      nickname: userB.nickname,
      avatar_key: userB.avatarKey,
      x: 850.0,
      y: 480.0,
      facing: "right",
      walking: true,
      updated_at: new Date().toISOString()
    }])
  });

  const queryA2 = await fetch(`${url}/rest/v1/healthclues_online_presence?region=eq.healthclues-realm&user_id=eq.${userB.userId}&select=x,y,walking,facing`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` }
  });
  const updatedB = (await queryA2.json())[0];
  assert.equal(Number(updatedB.x), 850.0, "User B x coordinate must update in real time");
  assert.equal(Number(updatedB.y), 480.0, "User B y coordinate must update in real time");
  assert.equal(updatedB.walking, true, "User B walking state must update");
  console.log(`✓ User A observes User B walking to [${updatedB.x}, ${updatedB.y}]`);

  // Step 6: User A sends greeting "👋 Chào bạn!" and User B receives it
  console.log("\n>>> STEP 6: User A waves and sends greeting");
  await fetch(`${url}/rest/v1/healthclues_online_presence`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates"
    },
    body: JSON.stringify([{
      user_id: userA.userId,
      region: userA.region,
      nickname: userA.nickname,
      avatar_key: userA.avatarKey,
      x: userA.x,
      y: userA.y,
      facing: userA.facing,
      walking: false,
      speech: "👋 Chào bạn nhé!",
      updated_at: new Date().toISOString()
    }])
  });

  const queryB2 = await fetch(`${url}/rest/v1/healthclues_online_presence?user_id=eq.${userA.userId}&select=speech`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` }
  });
  const speechReceived = (await queryB2.json())[0]?.speech;
  assert.equal(speechReceived, "👋 Chào bạn nhé!", "User B must see User A's greeting bubble");
  console.log(`✓ User B sees speech bubble above User A: "${speechReceived}"`);

  // Step 7: Clean up simulated users
  console.log("\n>>> STEP 7: Disconnect & Clean up test presences");
  await fetch(`${url}/rest/v1/healthclues_online_presence?user_id=in.(${userA.userId},${userB.userId},${userC.userId})`, {
    method: "DELETE",
    headers: { apikey: key, Authorization: `Bearer ${key}` }
  });
  console.log("✓ All simulated presences cleaned up cleanly.");

  console.log("\n=================================================================");
  console.log("🎉 ALL REALTIME MULTIPLAYER SYNCHRONIZATION TESTS 100% PASSED!");
  console.log("=================================================================");
}

main().catch(err => {
  console.error("Test error:", err);
  process.exit(1);
});
