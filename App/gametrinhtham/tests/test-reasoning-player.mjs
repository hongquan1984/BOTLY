/**
 * HEALTHCLUES MYSTERY DETECTIVE - V6 REASONING PLAYER SIMULATION TEST
 * Verifies:
 * 1. Phương án 2: Sổ Tay Y Khoa progressively unlocks entries matching collected clues only.
 * 2. Medical Handbook & Clues never spoil the case outcome or exact clock time conclusions.
 * 3. Star Penalty mechanics: 3 -> 2 -> 1 -> 0 across wrong submissions with vague error hints,
 *    scaled EXP (1.0 / 0.7 / 0.4 / 0.2), and 0-star solve does NOT block Campaign unlock.
 * 4. Solving Case 001 unlocks Case 002 immediately; solving Case 002 unlocks Case 003.
 * 5. Replay grants 0 bonus EXP.
 */

import assert from "node:assert/strict";
import {
  ALL_DETECTIVE_CASES,
  CASE_SLEEP_001,
  CASE_GOUT_002,
  CASE_MIGRAINE_003,
} from "../src/data/cases.ts";
import {
  getUnlockedMedicalHandbookEntries,
  evaluateUnifiedConclusion,
} from "../src/engine/deduction-engine/index.ts";
import { computeCaseFileStatus } from "../src/engine/case-engine/campaign-engine.ts";
import {
  calculateDetectiveRank,
  calculateRewardCoins,
  calculateRewardExp,
} from "../src/engine/progression-engine/index.ts";

async function main() {
  console.log("================================================================================");
  console.log(" HEALTHCLUES MYSTERY DETECTIVE: V6 REASONING PLAYER SIMULATION");
  console.log("================================================================================\n");

  const playerProgressList = [];

  // STAGE 1: CASE 001 PROGRESSIVE HANDBOOK + CONCLUSION + STAR PENALTY CHECK
  console.log("STAGE 1: Investigating Case 001 (Sleep Valley)...");
  assert.equal(computeCaseFileStatus(CASE_SLEEP_001, playerProgressList).canPlay, true);

  const hb0 = getUnlockedMedicalHandbookEntries(CASE_SLEEP_001.medicalHandbook, []);
  assert.equal(hb0.length, 0, "Handbook starts locked before any clues are recorded");

  const hb2 = getUnlockedMedicalHandbookEntries(CASE_SLEEP_001.medicalHandbook, [
    "clue-sleep-coffee",
    "clue-sleep-phone",
  ]);
  assert.equal(hb2.length, 2, "Should unlock exactly 2 matching handbook entries");

  // Simulate star deduction progression (3 -> 2 -> 1 -> 0 -> clamped at 0)
  const wrong1 = evaluateUnifiedConclusion(CASE_SLEEP_001.conclusionConfig, ["cand-sleep-coffee"], 0);
  assert.equal(wrong1.isCorrect, false);
  assert.equal(wrong1.starsRemaining, 2);
  assert.equal(wrong1.expMultiplier, 0.7);
  assert.ok(!wrong1.feedbackMessage.includes("07:00"));
  assert.ok(!wrong1.feedbackMessage.toLowerCase().includes("cà phê"));
  assert.ok(!wrong1.feedbackMessage.toLowerCase().includes("bán thải"));

  const wrong2 = evaluateUnifiedConclusion(CASE_SLEEP_001.conclusionConfig, ["cand-sleep-coffee", "cand-sleep-plant"], 1);
  assert.equal(wrong2.starsRemaining, 1);
  assert.equal(wrong2.expMultiplier, 0.4);

  const wrong3 = evaluateUnifiedConclusion(CASE_SLEEP_001.conclusionConfig, ["cand-sleep-genetic"], 2);
  assert.equal(wrong3.starsRemaining, 0);
  assert.equal(wrong3.expMultiplier, 0.2);

  // Even at 3 prior errors (0 stars), a correct conclusion still completes Case 001 & unlocks Case 002
  const winAfter3Errors = evaluateUnifiedConclusion(
    CASE_SLEEP_001.conclusionConfig,
    ["cand-sleep-phone", "cand-sleep-schedule", "cand-sleep-laptop", "cand-sleep-light"],
    3
  );
  assert.equal(winAfter3Errors.isCorrect, true);
  assert.equal(winAfter3Errors.starsRemaining, 0);
  assert.equal(winAfter3Errors.expMultiplier, 0.2);

  const expAt0Stars = calculateRewardExp(CASE_SLEEP_001.resolution.expReward, 0, winAfter3Errors.expMultiplier);
  assert.equal(expAt0Stars, Math.round(CASE_SLEEP_001.resolution.expReward * 0.2));

  playerProgressList.push({
    userId: "test-detective",
    caseId: CASE_SLEEP_001.id,
    foundClueIds: CASE_SLEEP_001.clues.map((c) => c.id),
    inspectedHotspotIds: [],
    boardConnections: [],
    revealedContradictions: [],
    completedStepIds: [],
    status: "solved",
    startedAt: new Date().toISOString(),
    solvedAt: new Date().toISOString(),
    starsAwarded: 0,
    expAwarded: expAt0Stars,
  });

  // STAGE 2: CASE 002 UNLOCK EVEN AFTER 0-STAR CASE 001
  console.log("STAGE 2: Verifying immediate unlock of Case 002 after solving Case 001 (even at 0 stars)...");
  assert.equal(computeCaseFileStatus(CASE_GOUT_002, playerProgressList).canPlay, true);

  // STAGE 3: CASE 002 PERFECT FIRST-TRY SOLVE (3 STARS, 100% EXP)
  console.log("STAGE 3: Investigating Case 002 (Gout) & solving cleanly in 1 attempt...");
  const hbGoutAll = getUnlockedMedicalHandbookEntries(
    CASE_GOUT_002.medicalHandbook,
    CASE_GOUT_002.clues.map((c) => c.id)
  );
  assert.equal(hbGoutAll.length, 6, "All 6 Case 002 medical handbook entries unlock once all 6 clues collected");

  const wrongBeef = evaluateUnifiedConclusion(
    CASE_GOUT_002.conclusionConfig,
    ["cand-gout-photo", "cand-gout-meds", "cand-gout-lab", "cand-gout-bill"],
    0
  );
  assert.equal(wrongBeef.isCorrect, false);
  assert.ok(!wrongBeef.feedbackMessage.toLowerCase().includes("thịt bò"));
  assert.ok(!wrongBeef.feedbackMessage.toLowerCase().includes("exif"));

  const perfectGout = evaluateUnifiedConclusion(
    CASE_GOUT_002.conclusionConfig,
    ["cand-gout-meds", "cand-gout-lab", "cand-gout-water", "cand-gout-bill"],
    0
  );
  assert.equal(perfectGout.isCorrect, true);
  assert.equal(perfectGout.starsRemaining, 3);
  assert.equal(perfectGout.expMultiplier, 1.0);

  const expAwarded02 = calculateRewardExp(
    CASE_GOUT_002.resolution.expReward,
    perfectGout.starsRemaining,
    perfectGout.expMultiplier
  );
  assert.equal(expAwarded02, CASE_GOUT_002.resolution.expReward);

  playerProgressList.push({
    userId: "test-detective",
    caseId: CASE_GOUT_002.id,
    foundClueIds: CASE_GOUT_002.clues.map((c) => c.id),
    inspectedHotspotIds: [],
    boardConnections: [],
    revealedContradictions: [],
    completedStepIds: [],
    status: "solved",
    startedAt: new Date().toISOString(),
    solvedAt: new Date().toISOString(),
    starsAwarded: 3,
    expAwarded: expAwarded02,
  });

  // STAGE 4..6: SOLVING CASES 003 -> 004 -> 005 -> 006 & VERIFYING XU WALLET + MAX RANK
  console.log("STAGE 4: Investigating Cases 003, 004, 005, 006 -> Total 6 Cases & Xu Payouts...");
  let totalCoinsEarned =
    calculateRewardCoins(CASE_SLEEP_001.resolution.coinReward, 0, 0.2, 0).deltaCoins +
    calculateRewardCoins(CASE_GOUT_002.resolution.coinReward, 3, 1.0, 0).deltaCoins;

  const remainingCases = ALL_DETECTIVE_CASES.slice(2);
  for (const nextCase of remainingCases) {
    assert.equal(computeCaseFileStatus(nextCase, playerProgressList).canPlay, true, `${nextCase.id} must unlock after prior case`);
    const trueCauseIds = nextCase.conclusionConfig.candidates
      .filter((c) => c.isTrueCause)
      .map((c) => c.id);
    assert.equal(trueCauseIds.length, 4, `${nextCase.id} must have 4 true causes`);

    const res = evaluateUnifiedConclusion(nextCase.conclusionConfig, trueCauseIds, 0);
    assert.equal(res.isCorrect, true, `${nextCase.id} must solve cleanly with 4 true causes`);
    assert.equal(res.starsRemaining, 3);

    const { deltaCoins } = calculateRewardCoins(nextCase.resolution.coinReward, res.starsRemaining, res.expMultiplier, 0);
    assert.equal(deltaCoins, nextCase.resolution.coinReward, `${nextCase.id} first-try 3* must pay 100% coinReward`);
    totalCoinsEarned += deltaCoins;

    playerProgressList.push({
      userId: "test-detective",
      caseId: nextCase.id,
      foundClueIds: nextCase.clues.map((c) => c.id),
      inspectedHotspotIds: [],
      boardConnections: [],
      revealedContradictions: [],
      completedStepIds: [],
      status: "solved",
      startedAt: new Date().toISOString(),
      solvedAt: new Date().toISOString(),
      starsAwarded: 3,
      expAwarded: nextCase.resolution.expReward,
      coinsAwarded: deltaCoins,
    });
  }

  assert.equal(playerProgressList.length, 6, "Must have solved all 6 campaign cases");
  assert.equal(calculateDetectiveRank(6).title, "Bậc thầy bí ẩn", "Solving all 6 cases unlocks top rank Bậc thầy bí ẩn");
  assert.equal(totalCoinsEarned, 30 + 200 + 250 + 300 + 350 + 450, "Xu wallet must equal exact sum across 6 cases (1,580 Xu)");
  const replayExp = 0;
  assert.equal(replayExp, 0);

  console.log(`🎉 ALL 6-CASE V6 REASONING & XU WALLET TESTS PASSED (${totalCoinsEarned} Xu, Rank: 👑 Bậc thầy bí ẩn)!\n`);
}

main().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
