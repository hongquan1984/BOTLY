import assert from "node:assert/strict";
import { adaptiveDiscoveryRequestSchema, validateAdaptiveDiscoveryResponse } from "../src/features/healthclues/adaptive-discovery.ts";

const request = adaptiveDiscoveryRequestSchema.parse({
  requestId: "550e8400-e29b-41d4-a716-446655440000", locale: "en", focusId: "sleep", focusLabel: "Sleep & rest", concernDetail: "",
  answeredQuestions: [],
});
const question = { questionId: "q-sleep-routine", prompt: "Which part of your sleep routine feels hardest?", choices: [{ id: "a-falling-asleep", label: "Falling asleep" }, { id: "a-waking", label: "Waking during the night" }, { id: "a-schedule", label: "Keeping a schedule" }], allowMultiple: false, allowSkip: true };
assert.equal(validateAdaptiveDiscoveryResponse({ locale: "en", done: false, question }, request).question.questionId, question.questionId);
assert.throws(() => validateAdaptiveDiscoveryResponse({ locale: "vi", done: false, question }, request), /INVALID_SCHEMA/);
assert.throws(() => validateAdaptiveDiscoveryResponse({ locale: "en", done: true, question }, request), /question_done_mismatch/);
assert.throws(() => validateAdaptiveDiscoveryResponse({ locale: "en", done: true, question: null }, request), /INVALID_SCHEMA/, "At least two short questions are required unless the player skips the flow outside the advisor.");
const twoAnswers = [{ questionId: "q-one", prompt: "Question one text", answerIds: ["a-one"], answerLabels: ["One"] }, { questionId: "q-two", prompt: "Question two text", answerIds: ["a-two"], answerLabels: ["Two"] }];
assert.equal(validateAdaptiveDiscoveryResponse({ locale: "en", done: true, question: null }, { ...request, answeredQuestions: twoAnswers }).done, true);
assert.equal(adaptiveDiscoveryRequestSchema.parse({ ...request, answeredQuestions: [{ questionId: "q-multi", prompt: "Which habits sound familiar?", answerIds: ["a-one", "a-two"], answerLabels: ["One", "Two"], optionalText: "Optional detail" }] }).answeredQuestions.length, 1, "Multiple choices and optional text remain canonical structured data");
assert.throws(() => adaptiveDiscoveryRequestSchema.parse({ ...request, answeredQuestions: [{ questionId: "q-mismatch", prompt: "Which habits sound familiar?", answerIds: ["a-one", "a-two"], answerLabels: ["One"] }] }));
assert.throws(() => adaptiveDiscoveryRequestSchema.parse({ ...request, answeredQuestions: Array.from({ length: 9 }, (_, index) => ({ questionId: `q-question-${index}`, prompt: "A question asked before", answerIds: [`a-option-${index}`], answerLabels: ["Answer"] })) }));
assert.throws(() => validateAdaptiveDiscoveryResponse({ locale: "en", done: false, question }, { ...request, answeredQuestions: [{ questionId: question.questionId, prompt: question.prompt, answerIds: ["a-old"], answerLabels: ["Already answered"] }] }), /INVALID_SCHEMA/);
assert.throws(() => validateAdaptiveDiscoveryResponse({ locale: "en", done: false, question: { ...question, choices: [question.choices[0], question.choices[0], question.choices[2]] } }, request), /duplicate_choice_id/);
assert.throws(() => adaptiveDiscoveryRequestSchema.parse({ ...request, concernDetail: "x".repeat(101) }));
assert.equal(adaptiveDiscoveryRequestSchema.parse({ ...request, locale: "vi" }).locale, "vi");
assert.throws(() => adaptiveDiscoveryRequestSchema.parse({ ...request, focusId: "diagnosed-condition" }));
console.log("PASS: adaptive-discovery schema, bounds, locale, stable IDs, choice arrays, no repeated questions, and minimum context (13 assertions)");
