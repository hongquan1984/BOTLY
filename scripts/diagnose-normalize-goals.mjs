import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

async function run() {
  const runtime = JSON.parse(readFileSync("d:/botly/App/.tmp/healthclues-owner-demo/owner-demo-runtime.json", "utf8"));
  const html = readFileSync("d:/botly/App/.tmp/healthclues-owner-demo/app-build-rpg-ui/public/play-demo.html", "utf8");
  const match = /const session = (\{.*?\});/s.exec(html);
  const session = JSON.parse(match[1]);
  const token = session.access_token;
  const authHeaders = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const profRes = await fetch(runtime.apiUrl + "/rest/v1/healthclues_profiles?user_id=eq." + session.user.id, {
    headers: { apikey: runtime.secretKey, Authorization: "Bearer " + runtime.secretKey }
  });
  const profRows = await profRes.json();
  const profData = profRows[0].profile;

  const worldsRes = await fetch("http://127.0.0.1:3329/api/healthclues/world", { headers: authHeaders });
  const worldData = await worldsRes.json();
  const worldId = worldData.world?.id || worldData.id || worldData.world_id;

  const currentRequestId = crypto.randomUUID();
  const advRes = await fetch("http://127.0.0.1:3329/api/healthclues/wellness-advisor", {
    method: "POST",
    headers: { ...authHeaders, "X-Request-Id": currentRequestId },
    body: JSON.stringify({
      requestId: currentRequestId,
      questId: "sleep-better",
      worldId,
      profile: profData,
      locale: "vi",
      forceRefresh: false,
    }),
  });
  const advData = await advRes.json();
  const modUrl = pathToFileURL("d:/botly/src/features/healthclues/personalized-wellness-plan.ts").href;
  const { toAiPlanGoal } = await import(modUrl);
  const goalsToSave = advData.goals.map((g) => ({
    ...toAiPlanGoal(g, "A", "vi"),
    choice: "active",
  }));

  // Now test against normalizeGoals logic line-by-line!
  const choices = new Set(["active", "saved", "skipped"]);
  const types = new Set(["maintain", "reduce", "avoid"]);
  const status = new Set(["eligible_for_personal_choice", "insufficient_information", "ineligible", "user_created_unreviewed"]);
  const frequency = new Set(["Flexible", "Once a week", "3 days a week", "Most days", "Daily", ...Array.from({ length: 7 }, (_, index) => `${index + 1} days a week`)]);
  const categories = new Set(["sleep", "relaxation", "mindfulness", "nutrition", "movement", "general routine"]);

  console.log("Goals length:", goalsToSave.length);
  for (let i = 0; i < goalsToSave.length; i++) {
    const goal = goalsToSave[i];
    console.log(`\n--- Checking goal #${i}: "${goal.title}" ---`);
    console.log("goalId valid:", typeof goal.goalId === "string" && goal.goalId.length <= 80, goal.goalId);
    console.log("title valid:", typeof goal.title === "string" && !!goal.title.trim() && goal.title.length <= 120, `"${goal.title}"`);
    console.log("category valid:", typeof goal.category === "string" && goal.category.length <= 60 && categories.has(goal.category), `"${goal.category}"`);
    console.log("goalType valid:", types.has(String(goal.goalType)), goal.goalType);
    console.log("choice valid:", choices.has(String(goal.choice)), goal.choice);
    console.log("frequency valid:", frequency.has(String(goal.frequency)), `"${goal.frequency}"`);
    console.log("trackingUnit valid:", typeof goal.trackingUnit === "string" && !!goal.trackingUnit.trim() && goal.trackingUnit.length <= 60, `"${goal.trackingUnit}"`);
    console.log("trackingDefinition valid:", typeof goal.trackingDefinition === "string" && !!goal.trackingDefinition.trim() && goal.trackingDefinition.length <= 240, `"${goal.trackingDefinition}" (${goal.trackingDefinition?.length} chars)`);
    console.log("safetyStatus valid:", status.has(String(goal.safetyStatus)), goal.safetyStatus);
    console.log("provenance valid:", ["catalog", "habit_library", "user_created", "ai_generated"].includes(String(goal.provenance)), goal.provenance);
    console.log("templateId valid:", goal.templateId === null);
    console.log("sourceVersion valid:", Number.isInteger(goal.sourceVersion), goal.sourceVersion);
    console.log("explanation valid:", typeof goal.explanation === "string" && goal.explanation.length <= 500, `"${goal.explanation}" (${goal.explanation?.length} chars)`);
    console.log("evidenceStatus valid:", typeof goal.evidenceStatus === "string" && goal.evidenceStatus.length <= 120, `"${goal.evidenceStatus}"`);
    console.log("generatedOption valid:", Boolean(goal.generatedOption && ["A", "B"].includes(goal.generatedOption.option) && ["en", "vi"].includes(goal.generatedOption.locale)), goal.generatedOption);
    console.log("sources valid:", Array.isArray(goal.sources) && goal.sources.length <= 4, goal.sources);
  }
}

run().catch(console.error);
