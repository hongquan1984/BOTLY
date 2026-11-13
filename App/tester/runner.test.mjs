import assert from "node:assert/strict";
import { test } from "node:test";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildCodexArgs, runCodex, validateReview } from "./runner.mjs";

const ids = [
  "discovery", "overworld", "world_entry", "npc_arrival", "journey_daily_care",
  "in_region_learning", "auth_persistence", "mobile_ui", "safety_privacy", "runtime_regression",
];
const base = () => ({
  summary: "Current local checks with direct evidence.",
  checks: ids.map(id => ({ id, status: "PASS", evidence: `current-run command and output for ${id}`, finding: "" })),
  blocking_items: [],
  prompt_for_antigravity: "",
  next_test: "Verify returning player.",
  release_readiness: "Separate editorial and production gates remain.",
});

test("only a complete evidenced review can pass", () => {
  assert.equal(validateReview(base()), "PASS");
  const missing = base();
  missing.checks[0].evidence = "";
  assert.throws(() => validateReview(missing), /PASS needs specific evidence/);
  const duplicate = base();
  duplicate.checks[1].id = duplicate.checks[0].id;
  assert.throws(() => validateReview(duplicate), /repeated check/);
});

test("failure and unavailable browser evidence cannot become PASS", () => {
  const failed = base();
  failed.checks[3] = { id: "npc_arrival", status: "FAIL", evidence: "current local click", finding: "Modal opened before player arrived." };
  failed.prompt_for_antigravity = "Reproduce the NPC click, wait for arrival, then open the station only after arrival.";
  assert.equal(validateReview(failed), "REWORK");
  const unverified = base();
  unverified.checks[7] = { id: "mobile_ui", status: "UNVERIFIED", evidence: "", finding: "No opened screenshots or browser viewport available." };
  unverified.prompt_for_antigravity = "Provide a current isolated demo and inspect 320, 390, and 430 pixel mobile viewports.";
  assert.equal(validateReview(unverified), "BLOCKED");
});

test("subprocess signal is read and later runs address the exact Tester thread", async () => {
  const fixture = path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures", "fake-codex.mjs");
  const result = await runCodex("node", fixture, [], "synthetic handoff");
  assert.equal(result.code, 0);
  assert.equal(result.threadId, "tester-fixture-session");
  const resume = buildCodexArgs(result.threadId, "D:\\botly\\App\\reports\\tester\\synthetic.json");
  assert.equal(resume[0], "exec");
  assert.equal(resume[1], "resume");
  assert.ok(resume.includes(result.threadId));
  assert.ok(!resume.includes("--last"));
  const failure = await runCodex("node", fixture, ["--fail"], "synthetic handoff");
  assert.equal(failure.code, 2);
});
