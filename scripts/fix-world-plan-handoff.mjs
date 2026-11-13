import fs from "fs";

// 1. Update HealthCluesWorldPreview.tsx
const previewFile = "d:/botly/src/components/healthclues/HealthCluesWorldPreview.tsx";
let previewContent = fs.readFileSync(previewFile, "utf8").replace(/\r\n/g, "\n");
previewContent = previewContent.replace(
  'window.location.href = `${worldPath}?quest=${encodeURIComponent(questId)}#hc-journey`;',
  'window.location.href = `${worldPath}?quest=${encodeURIComponent(questId)}&onboarding=backpack#hc-journey`;'
);
fs.writeFileSync(previewFile, previewContent, "utf8");

// 2. Update WellnessWorldGame.tsx
const gameFile = "d:/botly/src/features/healthclues/WellnessWorldGame.tsx";
let gameContent = fs.readFileSync(gameFile, "utf8").replace(/\r\n/g, "\n");

// Replace onboardingBackpack in useEffect
const targetEffect = `  useEffect(() => {
    if (!onboardingBackpack) return;
    const current = getCloudSession();`;

const replacementEffect = `  useEffect(() => {
    const current = getCloudSession();`;

if (gameContent.includes(targetEffect)) {
  gameContent = gameContent.replace(targetEffect, replacementEffect);
  console.log("Replaced useEffect target");
} else {
  console.log("targetEffect not found");
}

// Replace in enterWorld
const targetPlan = `      if (onboardingBackpack && activationContext?.wellnessPlan !== null && activationContext?.wellnessPlan !== undefined) {
        if (!activationContext.wellnessPlanRequestKey) throw new Error("The confirmed Wellness Plan handoff expired. Return to the preview and confirm the plan again.");
        await authorizedFetch("/api/healthclues/plan", { method: "POST", body: JSON.stringify({ worldId: createdWorld.world_id, requestKey: activationContext.wellnessPlanRequestKey, confirmed: true, goals: activationContext.wellnessPlan }) });
      }`;

const replacementPlan = `      if (activationContext?.wellnessPlan !== null && activationContext?.wellnessPlan !== undefined) {
        const planKey = activationContext.wellnessPlanRequestKey || crypto.randomUUID();
        await authorizedFetch("/api/healthclues/plan", { method: "POST", body: JSON.stringify({ worldId: createdWorld.world_id, requestKey: planKey, confirmed: true, goals: activationContext.wellnessPlan }) });
      }`;

if (gameContent.includes(targetPlan)) {
  gameContent = gameContent.replace(targetPlan, replacementPlan);
  console.log("Replaced targetPlan");
} else {
  console.log("targetPlan not found");
}

fs.writeFileSync(gameFile, gameContent, "utf8");
console.log("Updated WellnessWorldGame.tsx cleanly");
