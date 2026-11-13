import assert from "node:assert/strict";
import { resolveJourneyPlaybook } from "../src/features/healthclues/gout-playbook.ts";

const acute = resolveJourneyPlaybook({ topic: "Gout / Uric Acid", twoWeekGoal: "Learn habits", safetyContext: { acutePainfulJoint: "yes" } });
const longTerm = resolveJourneyPlaybook({ topic: "Gout / Uric Acid", twoWeekGoal: "Explore long-term management habits", safetyContext: { acutePainfulJoint: "unknown" } });
const general = resolveJourneyPlaybook({ topic: "Gout / Uric Acid", twoWeekGoal: "Understand uric acid", safetyContext: { acutePainfulJoint: "no" } });
const sleep = resolveJourneyPlaybook({ topic: "Sleep & rest" });
assert.equal(acute.context, "acute_symptoms");
assert.match(acute.greeting, /avoid exerting a painful joint/i);
assert.equal(longTerm.context, "long_term_interest");
assert.match(longTerm.greeting, /do not replace clinician-directed care/i);
assert.equal(general.context, "general_education");
assert.match(general.greeting, /does not confirm a diagnosis/i);
assert.equal(sleep.id, "general-wellness-v1");
assert.notEqual(sleep.dailyPrompt, acute.dailyPrompt);
console.log("HealthClues Journey playbooks: 8 assertions passed.");
