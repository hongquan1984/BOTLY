import assert from "node:assert/strict";
import { discoveryContextMatchesWorld } from "../src/features/healthclues/onboarding-context.ts";

console.log("=== TESTING BILINGUAL DISCOVERY CONTEXT MATCHING ===");

// 1. English topic with Vietnamese adaptive focusLabel
const goutVi = {
  topic: "Gout / high uric acid · HealthClues Realm",
  adaptiveDiscovery: {
    schemaVersion: 1,
    ageConfirmed: true,
    focusId: "health-concern",
    focusLabel: "Gút / axit uric cao",
    answers: [{ questionId: "q-gout-factors", answerIds: ["a-schedule"], answerLabels: ["Lịch trình"] }],
  },
};
assert.equal(discoveryContextMatchesWorld("health-concern", goutVi), true, "EN topic + VI label must match health-concern");

// 2. Vietnamese topic with English adaptive focusLabel
const goutEn = {
  topic: "Gút / axit uric cao · HealthClues Realm",
  adaptiveDiscovery: {
    schemaVersion: 1,
    ageConfirmed: true,
    focusId: "health-concern",
    focusLabel: "Gout / high uric acid",
    answers: [{ questionId: "q-gout-factors", answerIds: ["a-schedule"], answerLabels: ["Schedule"] }],
  },
};
assert.equal(discoveryContextMatchesWorld("health-concern", goutEn), true, "VI topic + EN label must match health-concern");

// 3. Sleep Valley with Vietnamese focusLabel
const sleepVi = {
  topic: "Sleep / rest · Sleep Valley",
  adaptiveDiscovery: {
    schemaVersion: 1,
    ageConfirmed: true,
    focusId: "sleep",
    focusLabel: "Khó đi vào giấc ngủ",
    answers: [{ questionId: "q-sleep-onset-factors", answerIds: ["a-screens"], answerLabels: ["Màn hình"] }],
  },
};
assert.equal(discoveryContextMatchesWorld("sleep-better", sleepVi), true, "Sleep VI label must match sleep-better");

// 4. Mismatch test: Gout topic with sleep quest
assert.equal(discoveryContextMatchesWorld("sleep-better", goutVi), false, "Gout must NOT match sleep-better");

// 5. Mismatch test: Sleep topic with health-concern quest
assert.equal(discoveryContextMatchesWorld("health-concern", sleepVi), false, "Sleep must NOT match health-concern");

console.log("✓ ALL BILINGUAL CONTEXT ASSERTIONS PASSED (100%)");
