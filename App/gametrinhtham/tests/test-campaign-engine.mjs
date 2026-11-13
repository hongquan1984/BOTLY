import assert from "node:assert/strict";
import {
  computeCaseFileStatus,
  buildChapterCampaignView,
  verifyCaseUnlockAuthorization,
} from "../src/engine/case-engine/campaign-engine.ts";
import { ALL_CHAPTERS, ALL_DETECTIVE_CASES, getCaseById } from "../src/data/cases.ts";

console.log("=== RUNNING UNIT TEST: CAMPAIGN ENGINE ===");

const case01 = getCaseById("case-sleep-001");
const case02 = getCaseById("case-gout-002");
const case03 = getCaseById("case-migraine-003");

assert.ok(case01, "Case 001 must exist");
assert.ok(case02, "Case 002 must exist");
assert.ok(case03, "Case 003 must exist");

// 1. Initial Player State (Brand new player, 0 cases solved)
console.log("1. Testing initial state for a brand new player...");
const initialProgress = [];

const status01 = computeCaseFileStatus(case01, initialProgress);
const status02 = computeCaseFileStatus(case02, initialProgress);
const status03 = computeCaseFileStatus(case03, initialProgress);

assert.equal(status01.status, "available", "Case 001 must be available for brand new player");
assert.equal(status01.canPlay, true, "Player must be allowed to play Case 001");

assert.equal(status02.status, "locked", "Case 002 must be locked initially");
assert.equal(status02.canPlay, false, "Player must not be allowed to play Case 002 yet");

assert.equal(status03.status, "locked", "Case 003 must be locked initially");
assert.equal(status03.canPlay, false, "Player must not be allowed to play Case 003 yet");

console.log("   ✓ Initial unlock rules verified: Case 01 Available, Case 02 & 03 Locked.");

// 2. Unauthorized Unlock Skip Verification
console.log("\n2. Testing server-side authorization check (preventing forged requests)...");
const authCheckFail = verifyCaseUnlockAuthorization(case02, initialProgress);
assert.equal(authCheckFail.authorized, false, "Must reject skip to Case 02");

const authCheckPass = verifyCaseUnlockAuthorization(case01, initialProgress);
assert.equal(authCheckPass.authorized, true, "Must authorize Case 01");
console.log("   ✓ Authorization boundary successfully blocks forged skip attempts.");

// 3. Solving Case 001 -> Unlocking Case 002 IMMEDIATELY (No day wait!)
console.log("\n3. Testing immediate unlock of Case 002 upon solving Case 001...");
const progressAfterCase01 = [
  {
    userId: "test-user",
    caseId: "case-sleep-001",
    foundClueIds: ["clue-sleep-coffee", "clue-sleep-phone", "clue-sleep-schedule"],
    inspectedHotspotIds: ["hotspot-an-coffee", "hotspot-an-phone"],
    boardConnections: [],
    revealedContradictions: [],
    completedStepIds: ["step-sleep-01"],
    status: "solved",
    startedAt: new Date().toISOString(),
    solvedAt: new Date().toISOString(),
    starsAwarded: 3,
  },
];

const status02AfterSolve = computeCaseFileStatus(case02, progressAfterCase01);
assert.equal(status02AfterSolve.status, "available", "Case 002 must be unlocked immediately!");
assert.equal(status02AfterSolve.canPlay, true, "Player must be allowed to play Case 002!");

const authCheck02Pass = verifyCaseUnlockAuthorization(case02, progressAfterCase01);
assert.equal(authCheck02Pass.authorized, true, "Case 002 authorization must pass now!");

console.log("   ✓ Case 002 unlocked immediately without waiting for a new day!");

// 4. Solving Case 002 -> Unlocking Case 003
console.log("\n4. Testing immediate unlock of Case 003 upon solving Case 002...");
const progressAfterCase02 = [
  ...progressAfterCase01,
  {
    userId: "test-user",
    caseId: "case-gout-002",
    foundClueIds: ["clue-gout-photo", "clue-gout-bill", "clue-gout-water", "clue-gout-meds"],
    inspectedHotspotIds: [],
    boardConnections: [],
    revealedContradictions: ["misdirection-busted"],
    completedStepIds: ["step-gout-01", "step-gout-02"],
    status: "solved",
    startedAt: new Date().toISOString(),
    solvedAt: new Date().toISOString(),
    starsAwarded: 3,
  },
];

const status03AfterSolve = computeCaseFileStatus(case03, progressAfterCase02);
assert.equal(status03AfterSolve.status, "available", "Case 003 must be unlocked immediately!");
assert.equal(status03AfterSolve.canPlay, true, "Player must be allowed to play Case 003!");

console.log("   ✓ Case 003 unlocked immediately!");

// 5. Chapter Campaign View Aggregation
console.log("\n5. Testing Chapter Campaign aggregation view...");
const chapter01 = ALL_CHAPTERS[0];
const campaignView = buildChapterCampaignView(
  chapter01,
  ALL_DETECTIVE_CASES.filter((c) => c.chapterId === chapter01.id),
  progressAfterCase02
);

assert.equal(campaignView.progress.totalCases, 3, "Total cases in Chapter 1 must be 3");
assert.equal(campaignView.progress.solvedCases, 2, "Solved cases in Chapter 1 must be 2");
assert.equal(campaignView.progress.totalStars, 6, "Total stars must be 6 (3 + 3)");
assert.equal(campaignView.nextAvailableCaseId, "case-migraine-003", "Next available case must be Case 003");

console.log("   ✓ Campaign aggregation correctly computes progress: 2/3 cases, 6 stars, next: case-migraine-003.");

// 6. Chapter 2 (Total 6 Cases Campaign) Unlock Chain Check
console.log("\n6. Testing Chapter 2 unlock chain (Cases 004, 005, 006 -> Total 6 cases)...");
assert.equal(ALL_CHAPTERS.length, 2, "Must define 2 chapters");
assert.equal(ALL_DETECTIVE_CASES.length, 6, "Campaign must contain exactly 6 full cases");

const case04 = getCaseById("case-reflux-004");
const case05 = getCaseById("case-fatigue-005");
const case06 = getCaseById("case-electrolyte-006");
assert.ok(case04 && case05 && case06, "Cases 004, 005, 006 must exist");
assert.equal(computeCaseFileStatus(case04, progressAfterCase02).status, "locked", "Case 004 stays locked before solving Case 003");

const progressAfterCase03 = [
  ...progressAfterCase02,
  {
    userId: "player-test-01",
    caseId: "case-migraine-003",
    foundClueIds: case03.clues.map((c) => c.id),
    inspectedHotspotIds: [],
    boardConnections: [],
    revealedContradictions: [],
    completedStepIds: [],
    status: "solved",
    startedAt: new Date().toISOString(),
    solvedAt: new Date().toISOString(),
    starsAwarded: 3,
  },
];
assert.equal(computeCaseFileStatus(case04, progressAfterCase03).canPlay, true, "Solving Case 003 must unlock Case 004 in Chapter 2");
assert.equal(computeCaseFileStatus(case05, progressAfterCase03).status, "locked", "Case 005 stays locked before Case 004");

const ch2View = buildChapterCampaignView(
  ALL_CHAPTERS[1],
  ALL_DETECTIVE_CASES.filter((c) => c.chapterId === "chapter-02"),
  progressAfterCase03
);
assert.equal(ch2View.progress.totalCases, 3, "Chapter 2 must have 3 cases");
assert.equal(ch2View.nextAvailableCaseId, "case-reflux-004", "Next available in Chapter 2 must be Case 004");

console.log("   ✓ Chapter 2 (Cases 004–006) unlock chain & 6-case campaign structure verified!");
console.log("\n🎉 ALL CAMPAIGN ENGINE TESTS PASSED (100%)!\n");
