import assert from "node:assert/strict";
import { getHealthCluesSkillLevel, HEALTHCLUES_SKILL_LEVELS } from "../src/features/healthclues/knowledge-skill-progress.ts";

assert.deepEqual(HEALTHCLUES_SKILL_LEVELS, ["Novice", "Explorer", "Learner", "Scholar", "Master"]);
for (const [completions, expected] of [[0, 0], [1, 1], [2, 1], [3, 2], [4, 2], [5, 3], [7, 3], [8, 4], [20, 4]]) {
  assert.equal(getHealthCluesSkillLevel(completions), expected, `${completions} unique completions map to the expected Skill level.`);
}
assert.equal(getHealthCluesSkillLevel(-5), 0, "Negative values cannot lower a Skill below Novice.");
assert.equal(getHealthCluesSkillLevel(Number.NaN), 0, "Invalid values safely resolve to Novice.");
console.log("HealthClues Skill progression passed (five levels and 11 threshold/boundary assertions).");
