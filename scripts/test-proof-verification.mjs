import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

async function testProof() {
  const runtime = JSON.parse(readFileSync("d:/botly/App/.tmp/healthclues-owner-demo/owner-demo-runtime.json", "utf8"));
  process.env.SUPABASE_SECRET_KEY = runtime.secretKey;
  process.env.SUPABASE_SERVICE_ROLE_KEY = runtime.secretKey;

  const html = readFileSync("d:/botly/App/.tmp/healthclues-owner-demo/app-build-rpg-ui/public/play-demo.html", "utf8");
  const match = /const session = (\{.*?\});/s.exec(html);
  const session = JSON.parse(match[1]);
  const token = session.access_token;
  const authHeaders = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const profRes = await fetch(runtime.apiUrl + "/rest/v1/healthclues_profiles?user_id=eq." + session.user.id, {
    headers: { apikey: runtime.secretKey, Authorization: "Bearer " + runtime.secretKey }
  });
  const profRows = await profRes.json();
  const profile = profRows[0].profile;

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
      profile,
      locale: "vi",
      forceRefresh: false,
    }),
  });
  const advData = await advRes.json();
  const modUrl = pathToFileURL("d:/botly/src/features/healthclues/personalized-wellness-plan.ts").href;
  const proofUrl = pathToFileURL("d:/botly/src/features/healthclues/server/wellness-plan-proof.ts").href;
  const { toAiPlanGoal } = await import(modUrl);
  const { verifiedGeneratedGoalFromProof } = await import(proofUrl);

  const goalsToSave = advData.goals.map((g) => ({
    ...toAiPlanGoal(g, "A", "vi"),
    choice: "active",
  }));

  for (let i = 0; i < goalsToSave.length; i++) {
    const goal = goalsToSave[i];
    console.log(`\nTesting verifiedGeneratedGoalFromProof for goal #${i}: "${goal.title}"`);
    console.log("has advisorProof:", Boolean(goal.advisorProof));
    const verified = verifiedGeneratedGoalFromProof(goal, profile);
    console.log("Verified result:", Boolean(verified));
  }
}

testProof().catch(console.error);
