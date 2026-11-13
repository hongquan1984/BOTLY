import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

const source = readFileSync(new URL("../src/lib/healthclues-quiz.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const loaded = { exports: {} };
new Function("module", "exports", compiled)(loaded, loaded.exports);
const { getDeepQuestionIds } = loaded.exports;
const bank = JSON.parse(readFileSync(new URL("../src/data/healthclues-quiz-bank.json", import.meta.url), "utf8"));
const byId = new Map(bank.map(question => [question.id, question]));

const branches = [
  ["sleep-better", "Sleep & rest", "sleep", "S"],
  ["feel-calmer", "General wellness", "calm", "R"],
  ["more-energy", "General wellness", "energy", "E"],
  ["eat-healthier", "Balanced nutrition", "nutrition", "N"],
  ["move-more", "General wellness", "movement", "M"],
  ["healthy-weight", "Healthy weight", "weight", "W"],
  ["natural-wellness", "General wellness", "natural", "L"],
  ["health-concern", "Gout & uric acid", "gout", "G"],
];

for (const [questId, topic, group, prefix] of branches) {
  const ids = getDeepQuestionIds(topic, questId);
  assert.equal(ids.length, 20, `${questId} exposes the shared optional profile plus seven adaptive questions`);
  assert.deepEqual(ids.slice(0, 13), ["C11", "C12", "C16", "C17", "C18", "C20", "C21", "C22", "C23", "C24", "C25", "C32", "C33"], `${questId} retains common preference and safety questions`);
  for (const id of ids) assert.ok(byId.has(id), `${questId} maps to a real question-bank record (${id})`);
  const branchQuestions = ids.slice(13).map(id => byId.get(id));
  assert.deepEqual(branchQuestions.map(question => question.id), Array.from({ length: 7 }, (_, index) => `${prefix}0${index + 1}`), `${questId} exposes the intended branch IDs`);
  assert.ok(branchQuestions.every(question => question.stage === "deep" && question.group === group), `${questId} uses seven deep questions from its matching content group`);
}

const fallbackIds = getDeepQuestionIds("General wellness", "health-concern");
assert.deepEqual(fallbackIds.slice(13), Array.from({ length: 7 }, (_, index) => `F0${index + 1}`), "general health-concern fallback uses the general branch");
console.log("HealthClues adaptive Quest branches passed across eight Quest/topic mappings and the general concern fallback.");
