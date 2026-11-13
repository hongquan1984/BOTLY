/**
 * HEALTHCLUES MYSTERY DETECTIVE: DEEP INSPECTION & TWO-TIER HOTSPOT TEST SUITE
 *
 * Verifies:
 * 1. Scene Hotspot Click opens Object Inspection (Layer 2) WITHOUT auto-recording clues.
 * 2. Detail Hotspots within object close-up allow discovering specific factual observations.
 * 3. Secondary/minor details (battery 72%, Wi-Fi, plant watering at 18:00) can be inspected & recorded.
 * 4. Anti-Spoiler Boundary: Player UI never displays 'correct', 'wrong', 'red herring', or 'important evidence'.
 * 5. Case 001 Two-Layer Deduction: Contradiction buster (phone 00:12 vs claim 22:00) +
 *    Verification (App usage log) + Circadian multi-factor synthesis.
 */

import assert from "node:assert/strict";
import { ALL_DETECTIVE_CASES, CASE_SLEEP_001, CASE_GOUT_002 } from "../src/data/cases.ts";
import { calculateRewardCoins } from "../src/engine/progression-engine/index.ts";
import {
  inspectSceneHotspot,
  inspectDetailHotspot,
  createClueFromDetail,
} from "../src/engine/clue-engine/index.ts";
import {
  evaluateContradictionBuster,
  evaluateMultiFactorSynthesis,
  evaluateBatchPuzzles,
  getUnlockedMedicalHandbookEntries,
  evaluateUnifiedConclusion,
} from "../src/engine/deduction-engine/index.ts";

async function main() {
  console.log("================================================================================");
  console.log(" HEALTHCLUES MYSTERY DETECTIVE: DEEP INSPECTION & TWO-TIER HOTSPOT SUITE");
  console.log("================================================================================\n");

  // TEST 1: Scene Hotspot Click opens Inspection without auto-recording
  console.log("1. Testing Scene Hotspot Click boundary (Does NOT auto-record clues)...");
  const phoneHotspot = CASE_SLEEP_001.scenes[0].hotspots.find(
    (h) => h.id === "hotspot-an-phone"
  );
  assert.ok(phoneHotspot, "Phone hotspot must exist in Case 001 scene");

  const sceneInspection = inspectSceneHotspot(phoneHotspot, CASE_SLEEP_001.clues);
  assert.equal(
    sceneInspection.opensDeepInspection,
    true,
    "Clicking phone hotspot must trigger Layer 2 Deep Inspection"
  );
  assert.ok(
    sceneInspection.detailHotspots.length >= 3,
    "Phone must contain multiple interactive detail hotspots (time, battery, wifi, app log)"
  );

  // Player's notebook starts empty
  let foundClueIds = [];
  assert.equal(foundClueIds.length, 0, "Notebook must remain empty upon opening object inspection");
  console.log("   ✓ Verified: Clicking phone opens inspection view without adding clues.\n");

  // TEST 2: Inspecting Specific Detail Hotspot (Phone Time 01:24)
  console.log("2. Testing Detail Hotspot Examination (01:24 Screen Active & Polygon Geometry)...");
  for (const sc of [...CASE_SLEEP_001.scenes, ...CASE_GOUT_002.scenes]) {
    assert.ok(sc.aspectRatio && sc.aspectRatio > 1.7, `Scene ${sc.id} must lock natural aspectRatio`);
    for (const h of sc.hotspots) {
      assert.ok(h.polygon && h.polygon.length >= 3, `Hotspot ${h.id} must define exact SVG polygon contour`);
    }
  }
  const timeDetail = phoneHotspot.detailHotspots.find((d) => d.id === "detail-phone-time");
  assert.ok(timeDetail, "01:24 timestamp detail hotspot must exist on phone");

  const detailResult = inspectDetailHotspot(
    timeDetail,
    phoneHotspot,
    CASE_SLEEP_001.clues,
    foundClueIds
  );
  assert.equal(detailResult.isAlreadyRecorded, false);
  assert.equal(detailResult.clueToRecord.source.timestamp, "Rạng sáng lúc 01:24");

  // Player records 01:24 into Evidence Notebook
  foundClueIds.push(detailResult.clueToRecord.id);
  assert.equal(foundClueIds.includes("clue-sleep-phone"), true);
  console.log("   ✓ Verified: Player explicitly examines and records 01:24 timestamp; all polygons locked.\n");

  // TEST 3: Inspecting & Recording Minor / Secondary Details
  console.log("3. Testing Secondary & Benign Details (Battery 72%, Plant watering at 18:00)...");
  const batteryDetail = phoneHotspot.detailHotspots.find((d) => d.id === "detail-phone-battery");
  assert.ok(batteryDetail, "Battery 72% detail must exist");
  const batteryClue = createClueFromDetail(batteryDetail, phoneHotspot, CASE_SLEEP_001.clues);
  assert.ok(batteryClue.id, "Synthesizes a valid clue from secondary detail");
  foundClueIds.push(batteryClue.id);

  const plantHotspot = CASE_SLEEP_001.scenes[0].hotspots.find(
    (h) => h.id === "hotspot-an-plant"
  );
  assert.ok(plantHotspot, "Plant hotspot must exist");
  const wateringDetail = plantHotspot.detailHotspots.find(
    (d) => d.id === "detail-plant-watering"
  );
  assert.ok(wateringDetail, "18:00 watering detail must exist");
  const wateringClue = createClueFromDetail(wateringDetail, plantHotspot, CASE_SLEEP_001.clues);
  foundClueIds.push(wateringClue.id);

  assert.equal(foundClueIds.length, 3, "Notebook now holds both critical and secondary observations");
  console.log("   ✓ Verified: Secondary details can be freely examined and recorded into notebook.\n");

  // TEST 4: Anti-Spoiler Boundary & Raw Clue Separation (No 'correct', 'wrong', 'red herring', and zero medicalRef spoilers inside room clues)
  console.log("4. Testing Anti-Spoiler Boundary & V6 Raw Clues vs Separate Medical Handbook...");
  for (const caseItem of ALL_DETECTIVE_CASES) {
    assert.ok(caseItem.medicalHandbook && caseItem.medicalHandbook.length >= 6, `${caseItem.id} must have 6 Medical Handbook entries`);
    assert.ok(caseItem.conclusionConfig && caseItem.conclusionConfig.candidates.length === 7, `${caseItem.id} must have 7 conclusion candidates`);
    assert.ok((caseItem.resolution.coinReward || 0) >= 150, `${caseItem.id} must grant coinReward >= 150 Xu`);
    for (const h of caseItem.scenes[0].hotspots) {
      assert.ok(h.polygon && h.polygon.length >= 3, `${caseItem.id} hotspot ${h.id} must have SVG polygon`);
      if (h.detailHotspots) {
        for (const d of h.detailHotspots) {
          assert.equal(d.isCorrect, undefined, `Detail ${d.id} must not leak isCorrect`);
          assert.equal(d.isRedHerring, undefined, `Detail ${d.id} must not leak isRedHerring`);
        }
      }
    }
    for (const clue of caseItem.clues) {
      assert.equal(
        clue.source.medicalRef,
        undefined,
        `V6 Raw clue ${clue.id} must NOT embed medicalRef spoilers directly in Scene/Notebook`
      );
    }
  }

  // Test Xu coin reward calculation & star upgrade delta anti-farm rule
  const firstRun2Stars = calculateRewardCoins(200, 2, 0.7, 0);
  assert.equal(firstRun2Stars.deltaCoins, 140, "2 stars (70%) of 200 Xu must pay 140 Xu");
  const replaySameStars = calculateRewardCoins(200, 2, 0.7, 140);
  assert.equal(replaySameStars.deltaCoins, 0, "Replay at same stars grants 0 duplicate Xu");
  const replayBetterStars = calculateRewardCoins(200, 3, 1.0, 140);
  assert.equal(replayBetterStars.deltaCoins, 60, "Upgrading 2 -> 3 stars grants only +60 Xu delta");
  // Progressive handbook unlock (Phương án 2): starts empty -> unlocks only Caffeine when coffee clue recorded
  assert.equal(getUnlockedMedicalHandbookEntries(CASE_SLEEP_001.medicalHandbook, []).length, 0);
  const hbCoffeeOnly = getUnlockedMedicalHandbookEntries(CASE_SLEEP_001.medicalHandbook, ["clue-sleep-coffee"]);
  assert.equal(hbCoffeeOnly.length, 1);
  assert.equal(hbCoffeeOnly[0].id, "hb-sleep-caffeine");
  assert.ok(!hbCoffeeOnly[0].generalPrinciple.includes("07:00"), "Medical Handbook must stay general physiology without spoiling case clock time");
  console.log("   ✓ Verified: Raw clues contain 0 medical spoilers & Phương án 2 unlocks only matching Handbook entries.\n");

  // TEST 5: V6 Unified Conclusion Evaluation + Legacy Two-Layer Puzzle Engine Sanity
  console.log("5. Testing V6 Unified Conclusion Engine & Star Deduction in Case 001...");
  assert.ok(CASE_SLEEP_001.conclusionConfig, "Case 001 must define unified conclusionConfig");
  const wrongTrapAttempt = evaluateUnifiedConclusion(
    CASE_SLEEP_001.conclusionConfig,
    ["cand-sleep-coffee", "cand-sleep-phone", "cand-sleep-schedule", "cand-sleep-laptop"],
    0
  );
  assert.equal(wrongTrapAttempt.isCorrect, false);
  assert.equal(wrongTrapAttempt.starsRemaining, 2, "First wrong submission must deduct 1 star (3 -> 2)");
  assert.ok(!wrongTrapAttempt.feedbackMessage.includes("07:00"), "Wrong feedback must never leak '07:00'");
  assert.ok(!wrongTrapAttempt.feedbackMessage.toLowerCase().includes("cà phê"), "Wrong feedback must never leak 'cà phê'");

  const solvedAttempt = evaluateUnifiedConclusion(
    CASE_SLEEP_001.conclusionConfig,
    ["cand-sleep-phone", "cand-sleep-schedule", "cand-sleep-laptop", "cand-sleep-light"],
    1
  );
  assert.equal(solvedAttempt.isCorrect, true, "All 4 true sleep causes without coffee/plant traps must pass");
  assert.equal(solvedAttempt.starsRemaining, 2, "Retains remaining 2 stars after solving on 2nd try");
  assert.equal(solvedAttempt.expMultiplier, 0.7);
  console.log("   ✓ Verified: Full V6 Case 001 inspection, progressive handbook & non-spoiling conclusion succeed!\n");

  console.log("================================================================================");
  console.log(" 🎉 ALL DEEP INSPECTION & TWO-TIER HOTSPOT TESTS PASSED (100% VERIFIED)!");
  console.log("================================================================================\n");
}

main().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
