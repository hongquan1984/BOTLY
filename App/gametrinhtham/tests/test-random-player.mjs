/**
 * HEALTHCLUES MYSTERY DETECTIVE - RANDOM PLAYER MONTE CARLO TEST (V6 + V4)
 * Simulates random brute-force guessing against the V6 Unified Conclusion Board
 * on Case 001 & Case 002 (7 candidates -> 127 subsets -> 0.79% theoretical pass rate per try).
 */

import assert from "node:assert/strict";
import { ALL_DETECTIVE_CASES } from "../src/data/cases.ts";
import { evaluateUnifiedConclusion } from "../src/engine/deduction-engine/index.ts";

function pickRandomNonEmptySubset(items) {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  const k = Math.floor(Math.random() * arr.length) + 1;
  return arr.slice(0, k);
}

function runRandomAttempt(caseData) {
  const cfg = caseData.conclusionConfig;
  assert.ok(cfg && cfg.candidates.length >= 7, `${caseData.id} must have >= 7 V6 candidates`);
  const ids = cfg.candidates.map((c) => c.id);
  const picked = pickRandomNonEmptySubset(ids);
  return evaluateUnifiedConclusion(cfg, picked, 0).isCorrect;
}

async function main() {
  console.log("================================================================================");
  console.log(" HEALTHCLUES MYSTERY DETECTIVE: RANDOM PLAYER MONTE CARLO SIMULATION (6 CASES)");
  console.log("================================================================================\n");

  const ITERATIONS = 5000;
  const passCounts = ALL_DETECTIVE_CASES.map(() => 0);
  let campaignFullPasses = 0;

  for (let i = 0; i < ITERATIONS; i++) {
    let allPassedThisRun = true;
    for (let idx = 0; idx < ALL_DETECTIVE_CASES.length; idx++) {
      const ok = runRandomAttempt(ALL_DETECTIVE_CASES[idx]);
      if (ok) {
        passCounts[idx]++;
      } else {
        allPassedThisRun = false;
      }
    }
    if (allPassedThisRun) campaignFullPasses++;
  }

  console.log(`MONTE CARLO RESULTS (${ITERATIONS} RANDOM RUNS ACROSS 6 CASES):`);
  ALL_DETECTIVE_CASES.forEach((c, idx) => {
    const rate = ((passCounts[idx] / ITERATIONS) * 100).toFixed(2);
    console.log(` - ${c.id.padEnd(24)} Random Pass Rate: ${rate}% (${passCounts[idx]}/${ITERATIONS})`);
    assert.ok(
      passCounts[idx] / ITERATIONS < 0.015,
      `Anti-brute-force failed on ${c.id}: random pass rate ${rate}% >= 1.5%`
    );
  });

  const fullRate = ((campaignFullPasses / ITERATIONS) * 100).toFixed(4);
  console.log(` - Full 6-Case Campaign Random Pass Rate:   ${fullRate}% (${campaignFullPasses}/${ITERATIONS})\n`);

  assert.ok(
    campaignFullPasses / ITERATIONS < 0.001,
    `Full campaign brute force should be < 0.1% (actual: ${fullRate}%)`
  );

  console.log("✅ PASS: Random guessers fail >98.5% per case and ~100% across 6-case campaign.");
}

main().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
