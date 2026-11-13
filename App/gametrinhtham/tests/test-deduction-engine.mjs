import assert from "node:assert/strict";
import {
  evaluateHypothesis,
  evaluateDeductionSteps,
  checkFinalDeduction,
  deterministicMixCandidates,
  shuffleCandidatesRandomly,
  isMixedCandidateOrder,
} from "../src/engine/deduction-engine/index.ts";
import { CASE_SLEEP_001, CASE_GOUT_002, ALL_DETECTIVE_CASES } from "../src/data/cases.ts";
import { validateCaseDifficulty } from "../src/engine/difficulty-engine/index.ts";

console.log("=== RUNNING UNIT TEST: DEDUCTION & MYSTERY ENGINE ===");

// 1. Difficulty & Complexity Validation
console.log("1. Testing Difficulty Rules...");
const diff1 = validateCaseDifficulty(1, 4, 1, false);
assert.equal(diff1.isValid, true, "Level 1 without misdirection should be valid");

const diff2WithMisdirection = validateCaseDifficulty(2, 5, 1, true);
assert.equal(diff2WithMisdirection.isValid, true, "Level 2 with misdirection should be valid");

const diff2WithoutMisdirection = validateCaseDifficulty(2, 5, 1, false);
assert.equal(diff2WithoutMisdirection.isValid, false, "Level 2 without misdirection should generate warning");
console.log("   ✓ Difficulty engine enforces progression depth.");

// 2. Case 001 Deduction Evaluation
console.log("\n2. Testing Case 001 (Bí ẩn đêm không ngủ)...");
const connections01 = [
  { clueId: "clue-sleep-coffee", hypothesisId: "hypo-sleep-circadian", relation: "supports" },
  { clueId: "clue-sleep-phone", hypothesisId: "hypo-sleep-circadian", relation: "supports" },
  { clueId: "clue-sleep-schedule", hypothesisId: "hypo-sleep-circadian", relation: "supports" },
];

const hypoCircadian = CASE_SLEEP_001.hypotheses.find((h) => h.id === "hypo-sleep-circadian");
assert.ok(hypoCircadian);

const eval01 = evaluateHypothesis(hypoCircadian, connections01, CASE_SLEEP_001.clues);
assert.equal(eval01.status, "supported", "Circadian hypothesis must be supported");

const steps01 = evaluateDeductionSteps(CASE_SLEEP_001.deductionSteps, connections01);
assert.equal(steps01[0].isUnlocked, true, "Step 1 of Case 001 must be unlocked");

const final01 = checkFinalDeduction(CASE_SLEEP_001.hypotheses, CASE_SLEEP_001.deductionSteps, connections01);
assert.equal(final01.canConclude, true, "Case 001 must be ready to conclude");
assert.ok(final01.stars >= 2, "Stars should be at least 2");
console.log("   ✓ Case 001 deduction completed with 3 clues supporting circadian disruption.");

// 3. Case 002 Misdirection & Contradiction Evaluation (Gout Case)
console.log("\n3. Testing Case 002 Misdirection Busting (Bí ẩn cơn đau lúc nửa đêm)...");
const hypoBeef = CASE_GOUT_002.hypotheses.find((h) => h.id === "hypo-gout-beef");
const hypoMultifactor = CASE_GOUT_002.hypotheses.find((h) => h.id === "hypo-gout-multifactor");
assert.ok(hypoBeef);
assert.ok(hypoMultifactor);

// Player links Photo (3 weeks ago EXIF) as CONTRADICTING the Beef hypothesis
const trapBustingConns = [
  { clueId: "clue-gout-photo", hypothesisId: "hypo-gout-beef", relation: "contradicts" },
];

const evalBeef = evaluateHypothesis(hypoBeef, trapBustingConns, CASE_GOUT_002.clues);
assert.equal(evalBeef.status, "contradicted", "Hypothesis must be contradicted by the timestamp proof!");
assert.equal(evalBeef.isTrapBusted, true, "Initial misdirection trap must be successfully busted!");
console.log("   ✓ EXIF Timestamp contradiction correctly busted initial beef hypothesis!");

// Player connects all genuine multi-factor evidence
const completeConns02 = [
  ...trapBustingConns,
  { clueId: "clue-gout-bill", hypothesisId: "hypo-gout-multifactor", relation: "supports" },
  { clueId: "clue-gout-water", hypothesisId: "hypo-gout-multifactor", relation: "supports" },
  { clueId: "clue-gout-meds", hypothesisId: "hypo-gout-multifactor", relation: "supports" },
  { clueId: "clue-gout-lab", hypothesisId: "hypo-gout-multifactor", relation: "supports" },
];

const evalMultifactor = evaluateHypothesis(hypoMultifactor, completeConns02, CASE_GOUT_002.clues);
assert.equal(evalMultifactor.status, "supported", "Multi-factor gout hypothesis must be fully supported");

const steps02 = evaluateDeductionSteps(CASE_GOUT_002.deductionSteps, completeConns02);
assert.equal(steps02[0].isUnlocked, true, "Step 1 (Misdirection revelation) must be unlocked");
assert.equal(steps02[1].isUnlocked, true, "Step 2 (Multi-factor synthesis) must be unlocked");

const final02 = checkFinalDeduction(CASE_GOUT_002.hypotheses, CASE_GOUT_002.deductionSteps, completeConns02);
assert.equal(final02.canConclude, true, "Case 002 must be ready to conclude");
assert.equal(final02.stars, 3, "Must award 3 stars for busting trap and linking all factors");
assert.equal(final02.revealedTrapsCount, 1, "Must record 1 trap busted");

console.log(`   ✓ Case 002 scored ${final02.accuracyScore}% with ${final02.stars} stars!`);

console.log("\n4. Testing Anti-Pattern Shuffle for All 6 Cases Unified Conclusion...");
for (const c of ALL_DETECTIVE_CASES) {
  assert.ok(c.conclusionConfig, `${c.id} must define conclusionConfig`);
  const detOrder = deterministicMixCandidates(c.conclusionConfig.candidates, c.id);
  assert.equal(
    isMixedCandidateOrder(detOrder),
    true,
    `${c.id} SSR deterministic candidate mix must distribute true causes & traps across both halves`
  );
  for (let run = 0; run < 40; run++) {
    const rndOrder = shuffleCandidatesRandomly(c.conclusionConfig.candidates);
    assert.equal(
      isMixedCandidateOrder(rndOrder),
      true,
      `${c.id} runtime shuffle #${run} must never group all true causes into top/left 4 cards`
    );
  }
}
console.log(`   ✓ Verified anti-pattern mixed candidate distribution across all ${ALL_DETECTIVE_CASES.length} cases (SSR + 40×6 random runs).`);

console.log("\n🎉 ALL DEDUCTION & MYSTERY ENGINE TESTS PASSED (100%)!\n");
