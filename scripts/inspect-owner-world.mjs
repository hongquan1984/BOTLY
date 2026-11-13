import { readFileSync } from "node:fs";

async function check() {
  const runtime = JSON.parse(readFileSync("d:/botly/App/.tmp/healthclues-owner-demo/owner-demo-runtime.json", "utf8"));
  const actRes = await fetch("http://127.0.0.1:3329/api/healthclues/account/quick-activate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "hongquan0508@gmail.com" }),
  });
  const actData = await actRes.json();
  const token = actData.session.access_token;
  const userId = actData.session.user.id;

  const profRes = await fetch(runtime.apiUrl + "/rest/v1/healthclues_profiles?user_id=eq." + userId, {
    headers: { apikey: runtime.secretKey, Authorization: "Bearer " + runtime.secretKey }
  });
  const profRows = await profRes.json();
  console.log("Profile exists:", profRows.length);
  if (profRows.length) {
    const p = profRows[0].profile;
    console.log("Profile topic:", p.topic);
    console.log("Profile wellnessPlans count:", p.wellnessPlans?.length || 0);
    if (p.wellnessPlans?.length) {
      console.log("Saved plans:", JSON.stringify(p.wellnessPlans, null, 2));
    }
  }

  const worldsRes = await fetch("http://127.0.0.1:3329/api/healthclues/world", {
    headers: { Authorization: `Bearer ${token}` }
  });
  const worldData = await worldsRes.json();
  console.log("World ID:", worldData.world?.id);
  console.log("World wellnessPlan in payload:", worldData.wellnessPlan);
}

check().catch(console.error);
