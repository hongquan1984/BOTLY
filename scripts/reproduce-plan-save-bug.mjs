import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

async function run() {
  const runtime = JSON.parse(readFileSync("d:/botly/App/.tmp/healthclues-owner-demo/owner-demo-runtime.json", "utf8"));
  const html = readFileSync("d:/botly/App/.tmp/healthclues-owner-demo/app-build-rpg-ui/public/play-demo.html", "utf8");
  const match = /const session = (\{.*?\});/s.exec(html);
  if (!match) throw new Error("No session in html");
  const session = JSON.parse(match[1]);
  const token = session.access_token;
  const authHeaders = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  // 1. Get profile from Supabase
  const profRes = await fetch(runtime.apiUrl + "/rest/v1/healthclues_profiles?user_id=eq." + session.user.id, {
    headers: { apikey: runtime.secretKey, Authorization: "Bearer " + runtime.secretKey }
  });
  const profRows = await profRes.json();
  const profData = profRows[0].profile;

  const worldsRes = await fetch("http://127.0.0.1:3329/api/healthclues/world", { headers: authHeaders });
  const worldData = await worldsRes.json();
  const worldId = worldData.world?.id || worldData.id || worldData.world_id;
  console.log("World ID:", worldId);

  // 2. Call wellness-advisor with this profile
  const currentRequestId = crypto.randomUUID();
  console.log("Calling wellness-advisor with requestId:", currentRequestId);
  const advRes = await fetch("http://127.0.0.1:3329/api/healthclues/wellness-advisor", {
    method: "POST",
    headers: {
      ...authHeaders,
      "X-Request-Id": currentRequestId,
    },
    body: JSON.stringify({
      requestId: currentRequestId,
      questId: "sleep-better",
      worldId,
      profile: profData,
      locale: "vi",
      forceRefresh: false,
    }),
  });
  console.log("Advisor status:", advRes.status);
  const advData = await advRes.json();
  console.log("Advisor goals returned:", advData.goals?.length);
  if (!advData.goals?.length) {
    console.log("Advisor error:", advData.error);
    return;
  }

  // 3. Prepare goals
  const modUrl = pathToFileURL("d:/botly/src/features/healthclues/personalized-wellness-plan.ts").href;
  const { toAiPlanGoal } = await import(modUrl);
  const goalsToSave = advData.goals.map((g) => {
    const aiGoal = toAiPlanGoal(g, "A", "vi");
    return {
      ...aiGoal,
      choice: "active",
    };
  });
  console.log("Goals to save count:", goalsToSave.length);

  // 4. Call /api/healthclues/plan
  console.log("\n--- Calling POST /api/healthclues/plan ---");
  const saveRes = await fetch("http://127.0.0.1:3329/api/healthclues/plan", {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      worldId,
      requestKey: crypto.randomUUID(),
      confirmed: true,
      goals: goalsToSave,
    }),
  });
  console.log("Save status:", saveRes.status);
  const saveBody = await saveRes.text();
  console.log("Save response body:", saveBody);
}

run().catch(console.error);
