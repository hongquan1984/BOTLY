#!/usr/bin/env node
import { execFileSync } from "node:child_process";

const args = process.argv.slice(2);
function valuesAfter(flag) {
  const result = [];
  for (let index = 0; index < args.length; index++) {
    if (args[index] !== flag) continue;
    let found = false;
    while (args[index + 1] && !args[index + 1].startsWith("--")) {
      found = true;
      result.push(...args[++index].split(",").map(item => item.trim()).filter(Boolean));
    }
    if (!found) throw new Error(`${flag} expects at least one path.`);
  }
  return result;
}

let changedFiles = valuesAfter("--files");
let updatedDocs = valuesAfter("--docs").map(path => path.replaceAll("\\", "/").toLowerCase());
const stagedMode = args.includes("--staged");
if (stagedMode && !changedFiles.length) {
  try {
    changedFiles = execFileSync("git", ["diff", "--cached", "--name-only"], { encoding: "utf8" }).split(/\r?\n/).filter(Boolean);
    updatedDocs = changedFiles.filter(path => /^App\//i.test(path)).map(path => path.replaceAll("\\", "/").toLowerCase());
  } catch {
    console.error("Could not read staged Git changes.");
    process.exit(2);
  }
  if (!changedFiles.some(file => /healthclues/i.test(file) || /(^|\/)App\/(DECISIONS_AND_ASSUMPTIONS|MASTER_SPEC|IMPLEMENTATION_PLAN|ACCEPTANCE_TESTS|V1_PROGRESS|V1_TEST_RESULTS|V1_RELEASE_READINESS)\.md$/i.test(file))) {
    console.log("No staged HealthClues source or canonical documentation changes detected.");
    process.exit(0);
  }
}
if (!changedFiles.length) {
  try {
    changedFiles = execFileSync("git", ["diff", "--name-only", "HEAD", "--", "src", "supabase/migrations"], { encoding: "utf8" })
      .split(/\r?\n/).filter(Boolean);
  } catch {
    console.error("Could not read Git changes. Pass --files explicitly.");
    process.exit(2);
  }
  if (!changedFiles.length) {
    console.log("No tracked HealthClues source/migration changes detected. For untracked files, pass --files explicitly.");
    process.exit(0);
  }
  try {
    updatedDocs = execFileSync("git", ["diff", "--name-only", "HEAD", "--", "App"], { encoding: "utf8" })
      .split(/\r?\n/).filter(Boolean).map(path => path.replaceAll("\\", "/").toLowerCase());
  } catch { /* The explicit --docs option remains available for untracked documentation trees. */ }
}

const rules = [
  { test: /healthclues.*(quiz|question)|healthclues-quiz|quiz-bank|healthclues\/quiz/i, docs: ["app/user_flows.md", "app/business_rules.md", "app/use_cases.md"] },
  { test: /supabase\/migrations\/.*healthclues|healthclues.*migration/i, docs: ["app/database_design.md"] },
  { test: /healthclues.*(world|map|region|pet|shell|welcome|preview)|healthclues\/world-map|healthclues\/wellnessworldgame/i, docs: ["app/master_spec.md", "app/ui_ux_spec.md", "app/user_flows.md"] },
  { test: /healthclues.*(knowledge|boss|reward|toolkit|checkin|companion|skill)|healthclues\/(knowledge|boss|toolkit)/i, docs: ["app/knowledge_and_safety_spec.md", "app/business_rules.md", "app/use_cases.md"] },
  { test: /healthclues.*(community|journal|privacy)|healthclues\/community/i, docs: ["app/community_and_privacy_spec.md", "app/business_rules.md"] },
  { test: /healthclues.*(auth|pending|consent)|healthclues-pending-journey|healthclues\/auth/i, docs: ["app/user_flows.md", "app/business_rules.md", "app/community_and_privacy_spec.md"] },
];
const required = new Set();
const matched = new Map();
const hasHealthCluesCodeChange = changedFiles.some(file => /(^|\/)(src\/.*healthclues|supabase\/migrations\/.*healthclues|scripts\/.*healthclues)/i.test(file));
if (hasHealthCluesCodeChange) required.add("app/current_state.md");
for (const file of changedFiles) {
  const normalized = file.replaceAll("\\", "/");
  const isDecisionRecord = /(^|\/)App\/DECISIONS_AND_ASSUMPTIONS\.md$/i.test(normalized);
  const isHealthCluesDoc = isDecisionRecord || /(^|\/)App\/(MASTER_SPEC|IMPLEMENTATION_PLAN|ACCEPTANCE_TESTS|V1_PROGRESS|V1_TEST_RESULTS|V1_RELEASE_READINESS)\.md$/i.test(normalized);
  if (!/healthclues/i.test(normalized) && !isHealthCluesDoc) continue;
  if (isDecisionRecord) {
    required.add("app/master_spec.md");
    required.add("app/current_state.md");
    required.add("app/implementation_plan.md or App/reports/* (record resulting work/evidence when applicable)");
    matched.set(normalized, true);
  }
  for (const rule of rules) if (rule.test.test(normalized)) {
    for (const doc of rule.docs) required.add(doc);
    matched.set(normalized, true);
  }
}
if (changedFiles.some(file => /healthclues/i.test(file)) && !updatedDocs.some(doc => doc.includes("implementation_plan.md") || doc.includes("reports/"))) {
  required.add("app/implementation_plan.md or App/reports/* (record milestone/progress/evidence when applicable)");
}

const missing = [...required].filter(doc => doc.includes(" or ")
  ? !updatedDocs.some(updated => updated.includes("implementation_plan.md") || updated.includes("app/reports/"))
  : !updatedDocs.includes(doc));
console.log(`HealthClues documentation consistency check: ${changedFiles.length} file(s), ${required.size} recommended documentation target(s).`);
if (matched.size) console.log(`Mapped HealthClues change groups: ${matched.size}.`);
if (missing.length) {
  console.error("Potential documentation omissions (review semantically; this check cannot prove coverage):");
  for (const doc of missing) console.error(`  - ${doc}`);
  console.error("Pass changed source via --files and documents actually updated via --docs. This is a reminder, not semantic verification.");
  process.exit(1);
}
console.log("PASS: every recommended target was named as updated. Review document accuracy manually.");

