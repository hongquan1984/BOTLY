import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { createHmac, createHash, timingSafeEqual } from "node:crypto";

async function debugProof() {
  const runtime = JSON.parse(readFileSync("d:/botly/App/.tmp/healthclues-owner-demo/owner-demo-runtime.json", "utf8"));
  const key = runtime.secretKey;

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
  const { toAiPlanGoal, localized } = await import(modUrl);

  const goal = toAiPlanGoal(advData.goals[0], "A", "vi");
  console.log("Input goal:", goal.title);

  // Debug proof check
  const [payload, supplied, extra] = goal.advisorProof.split(".");
  console.log("advisorProof parts count:", 3, !extra);
  const expected = createHmac("sha256", key).update(payload).digest();
  const actual = Buffer.from(supplied, "base64url");
  console.log("HMAC match:", expected.length === actual.length && timingSafeEqual(expected, actual));

  const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  console.log("Expires in future:", claims.expiresAt > Date.now());

  // Check profileDigest
  function clean(value, max) { return String(value || "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, max); }
  function getProfileDigest(prof) {
    const safetyFields = ["foodAllergy", "foodRestriction", "professionalRestriction", "activityRestriction", "medicationOrSupplement", "acutePainfulJoint", "urgentSymptoms", "fluidRestriction"];
    const safetyContext = Object.fromEntries(safetyFields.flatMap(field => {
      const value = prof.safetyContext?.[field];
      return value === "yes" || value === "no" || value === "unknown" ? [[field, value]] : [];
    }));
    const safe = {
      topic: clean(prof.topic, 100), contentPreferences: prof.contentPreferences.map(value => clean(value, 80)),
      twoWeekGoal: clean(prof.twoWeekGoal, 160), specificInterests: (prof.specificInterests || []).map(value => clean(value, 80)),
      adaptiveDiscovery: prof.adaptiveDiscovery ? {
        focusId: prof.adaptiveDiscovery.focusId, focusLabel: clean(prof.adaptiveDiscovery.focusLabel, 100),
        concernDetail: clean(prof.adaptiveDiscovery.concernDetail || "", 100),
        answers: prof.adaptiveDiscovery.answers.map(answer => ({ questionId: answer.questionId, answerIds: answer.answerIds, answerLabels: answer.answerLabels.map(label => clean(label, 100)), optionalText: clean(answer.optionalText || "", 180) })),
      } : null,
      safetyLevel: prof.safetyLevel, safetyContext,
    };
    return createHash("sha256").update(JSON.stringify(safe)).digest("base64url");
  }

  const calculatedDigest = getProfileDigest(profile);
  console.log("Claims profileDigest:   ", claims.profileDigest);
  console.log("Calculated profileDigest:", calculatedDigest);
  console.log("Digest match:", claims.profileDigest === calculatedDigest);

  const signedGoal = claims.goal;
  const selected = goal.generatedOption.option === "A" ? signedGoal.optionA : signedGoal.optionB;
  const locale = goal.generatedOption.locale;

  console.log("goalId match:", goal.goalId === signedGoal.goalId, goal.goalId, signedGoal.goalId);
  console.log("title match:", goal.title === localized(signedGoal.title, locale), `"${goal.title}"`, `"${localized(signedGoal.title, locale)}"`);
  console.log("category match:", goal.category === signedGoal.category, `"${goal.category}"`, `"${signedGoal.category}"`);
  console.log("explanation match:", goal.explanation === localized(signedGoal.relevanceReason, locale), `"${goal.explanation}"`, `"${localized(signedGoal.relevanceReason, locale)}"`);
  console.log("trackingDefinition match:", goal.trackingDefinition === localized(selected.action, locale), `"${goal.trackingDefinition}"`, `"${localized(selected.action, locale)}"`);
  console.log("generatedOption title match:", goal.generatedOption.title === localized(selected.title, locale), `"${goal.generatedOption.title}"`, `"${localized(selected.title, locale)}"`);
}

debugProof().catch(console.error);
