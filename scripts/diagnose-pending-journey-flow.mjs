import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

async function diagnose() {
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

  console.log("Profile topic:", profData.topic);

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

  console.log("Chosen goal 0:", JSON.stringify(chosenGoals[0], null, 2));

  // 2. Now call savePendingHealthCluesJourney payload against POST /api/healthclues/pending-journey
  const reqKey = crypto.randomUUID();
  const pjRes = await fetch("http://127.0.0.1:3329/api/healthclues/pending-journey", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "hongquan0508@gmail.com",
      questId: "health-concern",
      profile: profData,
      wellnessPlan: chosenGoals,
      wellnessPlanRequestKey: reqKey,
      consentedAt: new Date().toISOString(),
      consent: true,
    }),
  });

  console.log("Pending journey POST status:", pjRes.status);
  const pjData = await pjRes.json();
  console.log("Pending journey POST body:", pjData);
  const cookie = pjRes.headers.get("set-cookie");
  console.log("Pending journey set-cookie present:", Boolean(cookie));

  // 3. Now let's test GET /api/healthclues/pending-journey with that cookie!
  const getPjRes = await fetch("http://127.0.0.1:3329/api/healthclues/pending-journey", {
    headers: {
      Authorization: `Bearer ${token}`,
      Cookie: cookie || "",
    },
  });
  console.log("Pending journey GET status:", getPjRes.status);
  const getPjData = await getPjRes.json();
  console.log("Pending journey GET data has wellnessPlan:", Boolean(getPjData?.wellnessPlan), "count:", getPjData?.wellnessPlan?.length);

  // 4. Now let's test POST /api/healthclues/plan!
  const worldRes = await fetch("http://127.0.0.1:3329/api/healthclues/world", {
    headers: { Authorization: `Bearer ${token}` }
  });
  const worldData = await worldRes.json();
  const worldId = worldData.world?.id;
  console.log("Target World ID:", worldId);

  const planRes = await fetch("http://127.0.0.1:3329/api/healthclues/plan", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      worldId,
      requestKey: reqKey,
      confirmed: true,
      goals: getPjData.wellnessPlan,
    }),
  });
  console.log("Plan POST status:", planRes.status);
  const planData = await planRes.json();
  console.log("Plan POST data:", planData);
}

diagnose().catch(console.error);
