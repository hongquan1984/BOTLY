import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

async function testDirectPlanPost() {
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
  const profData = profRows[0].profile;

  // 1. Get advisor goals
  const advRequestId = crypto.randomUUID();
  const advRes = await fetch("http://127.0.0.1:3329/api/healthclues/wellness-advisor", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, "X-Request-Id": advRequestId },
    body: JSON.stringify({
      requestId: advRequestId,
      questId: "health-concern",
      profile: profData,
      locale: "vi",
      forceRefresh: false,
    }),
  });

  const advData = await advRes.json();
  console.log("Advisor status:", advRes.status, "goals count:", advData.goals?.length);

  const modUrl = pathToFileURL("d:/botly/src/features/healthclues/personalized-wellness-plan.ts").href;
  const { toAiPlanGoal } = await import(modUrl);

  const chosenGoals = advData.goals.slice(0, 2).map((g) => ({
    ...toAiPlanGoal(g, "A", "vi"),
    choice: "active",
  }));

  console.log("Chosen goals count:", chosenGoals.length);

  // 2. Get World
  const worldRes = await fetch("http://127.0.0.1:3329/api/healthclues/world", {
    headers: { Authorization: `Bearer ${token}` }
  });
  const worldData = await worldRes.json();
  const worldId = worldData.world?.id;
  console.log("World ID:", worldId);

  // 3. Post Plan
  const planKey = crypto.randomUUID();
  const planRes = await fetch("http://127.0.0.1:3329/api/healthclues/plan", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      worldId,
      requestKey: planKey,
      confirmed: true,
      goals: chosenGoals,
    }),
  });

  console.log("Direct Plan POST status:", planRes.status);
  const planData = await planRes.json();
  console.log("Direct Plan POST data:", planData);

  // 4. Reload World
  const reloaded = await fetch("http://127.0.0.1:3329/api/healthclues/world", {
    headers: { Authorization: `Bearer ${token}` }
  });
  const reloadedData = await reloaded.json();
  console.log("Reloaded wellnessPlan goals count:", reloadedData.wellnessPlan?.goals?.length);
  console.log("Reloaded goals titles:", reloadedData.wellnessPlan?.goals?.map(g => g.title));
}

testDirectPlanPost().catch(console.error);
