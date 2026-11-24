import assert from "node:assert/strict";
import fs from "node:fs";

const world = fs.readFileSync(new URL("../src/hooks/useWorld.ts", import.meta.url), "utf8");
const service = fs.readFileSync(new URL("../src/services/healthclues.ts", import.meta.url), "utf8");
const toolkit = fs.readFileSync(new URL("../src/services/toolkitStorage.ts", import.meta.url), "utf8");
const detective = fs.readFileSync(new URL("../src/modules/detective/detectiveService.ts", import.meta.url), "utf8");
const onboarding = fs.readFileSync(new URL("../src/services/onboarding.ts", import.meta.url), "utf8");
const herbal = fs.readFileSync(new URL("../src/modules/herbal/HerbalGardenModal.tsx", import.meta.url), "utf8");
const roadmap = fs.readFileSync(new URL("../src/modules/roadmap/PostTourRoadmapModal.tsx", import.meta.url), "utf8");
const layout = fs.readFileSync(new URL("../app/(game)/_layout.tsx", import.meta.url), "utf8");
const economy = fs.readFileSync(new URL("../src/modules/economy/economyStorage.ts", import.meta.url), "utf8");
const auth = fs.readFileSync(new URL("../src/services/auth.ts", import.meta.url), "utf8");
const adapter = fs.readFileSync(new URL("../Gametrinhtham/dataAdapter.ts", import.meta.url), "utf8");
const component = fs.readFileSync(new URL("../Gametrinhtham/MobileDetectiveGame.tsx", import.meta.url), "utf8");
const solveRoute = fs.readFileSync(new URL("../../../src/app/api/healthclues/mobile-detective/solve/route.ts", import.meta.url), "utf8");
const route = fs.readFileSync(new URL("../../../src/app/api/healthclues/mobile-progress/route.ts", import.meta.url), "utf8");
const worldRoute = fs.readFileSync(new URL("../../../src/app/api/healthclues/world/route.ts", import.meta.url), "utf8");

assert.doesNotMatch(world, /AsyncStorage|localStorage/);
assert.match(world, /fetchMobileProgress/);
assert.match(world, /saveMobileGoals/);
assert.match(world, /saveMobileCheckin/);
assert.match(service, /mobile-progress/);
assert.match(toolkit, /mobile-toolkit/);
assert.doesNotMatch(detective, /AsyncStorage|localStorage/);
assert.doesNotMatch(economy, /AsyncStorage|COINS_STORAGE_KEY|TOTAL_EXP_STORAGE_KEY/);
assert.doesNotMatch(auth, /demo-jwt-token|dev-fallback-token|demo-refresh-token|dev-fallback-refresh/);
assert.match(adapter, /getStoredSession/);
assert.match(component, /onPress=\{\(\) => setMode\("scene"\)\}/);
assert.match(solveRoute, /selectedConclusionIds/);
assert.match(solveRoute, /wrongConclusionAttempts/);
assert.match(solveRoute, /puzzleStates/);
for (const source of [onboarding, herbal, roadmap, layout, economy]) {
  assert.doesNotMatch(source, /healthclues-user-goals|healthclues-total-exp|healthclues-checkin-|healthclues_solved_cases_v1/);
}
assert.match(detective, /mobile-detective\/(campaign|solve)/);
assert.match(route, /requireUser/);
assert.match(route, /healthclues_profiles/);
assert.match(route, /healthclues_xp_ledger/);
assert.match(worldRoute, /mobileJourneyGoals/);
console.log("PASS mobile DB persistence contract");
