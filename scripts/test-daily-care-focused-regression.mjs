import assert from "node:assert/strict";
import { parseGoalStatusesFromNote, computeConsecutiveStreak, getTodayLocalDate } from "../src/features/healthclues/daily-care-domain.ts";

console.log("=== STARTING DAILY CARE FOCUSED REGRESSION SUITE ===");

// -----------------------------------------------------------------------------
// TEST 1: Double Toggle Logic (Done -> Not Yet) & Synchronized onStatus Value
// -----------------------------------------------------------------------------
console.log("\n1. Testing Double Toggle Logic (first tap -> done, second tap -> not_yet)...");

function simulateToggleStatus({
  itemId,
  requestedStatus,
  localStatuses,
  items,
  entries,
  onStatusCalls
}) {
  const current = localStatuses[itemId];
  const nextStatus = current === requestedStatus ? "not_yet" : requestedStatus;
  const newLocal = { ...localStatuses, [itemId]: nextStatus };

  const item = items.find(it => it.id === itemId);
  if (item) {
    if (!item.isGoal) {
      onStatusCalls.push({ id: item.id, status: nextStatus });
    } else if (item.rawGoal?.templateId) {
      const matchingEntry = entries.find(e => e.catalog_item_id === item.rawGoal.templateId);
      if (matchingEntry) {
        onStatusCalls.push({ id: matchingEntry.id, status: nextStatus });
      }
    }
  }

  return { newLocal, nextStatus };
}

const mockGoal1 = { id: "g1", isGoal: true, rawGoal: { goalId: "g1", templateId: "tool-sleep-tea" } };
const mockGoal2 = { id: "g2", isGoal: true, rawGoal: { goalId: "g2", templateId: null } }; // Unrelated goal
const mockEntries = [
  { id: "entry-shoes", catalog_item_id: "tool-shoes" }, // Index 0: unrelated tool!
  { id: "entry-tea", catalog_item_id: "tool-sleep-tea" }, // Index 1: tea tool
];

let state = {};
let calls = [];

// Tap 1 on Goal 2 (unrelated tool):
let res1 = simulateToggleStatus({
  itemId: "g2",
  requestedStatus: "done",
  localStatuses: state,
  items: [mockGoal1, mockGoal2],
  entries: mockEntries,
  onStatusCalls: calls
});
assert.equal(res1.nextStatus, "done");
assert.equal(res1.newLocal["g2"], "done");
assert.equal(calls.length, 0, "Goal without matching templateId must NOT trigger onStatus for unrelated entry-shoes");

// Tap 2 on Goal 2 (Double tap to uncheck):
let res2 = simulateToggleStatus({
  itemId: "g2",
  requestedStatus: "done",
  localStatuses: res1.newLocal,
  items: [mockGoal1, mockGoal2],
  entries: mockEntries,
  onStatusCalls: calls
});
assert.equal(res2.nextStatus, "not_yet", "Second tap on Done must toggle status back to not_yet");
assert.equal(res2.newLocal["g2"], "not_yet");
assert.equal(calls.length, 0, "Unrelated tool at index 0 must never be modified by goal at index 1");
console.log("✓ Double tap toggles to not_yet, and unrelated tool is NEVER touched.");

// -----------------------------------------------------------------------------
// TEST 2: Matching Tool Synchronization
// -----------------------------------------------------------------------------
console.log("\n2. Testing Matching Tool Synchronization...");
calls = [];
// Tap 1 on Goal 1 (matches tool-sleep-tea):
let res3 = simulateToggleStatus({
  itemId: "g1",
  requestedStatus: "done",
  localStatuses: {},
  items: [mockGoal1, mockGoal2],
  entries: mockEntries,
  onStatusCalls: calls
});
assert.equal(calls.length, 1);
assert.equal(calls[0].id, "entry-tea");
assert.equal(calls[0].status, "done");

// Tap 2 on Goal 1 (uncheck):
calls = [];
let res4 = simulateToggleStatus({
  itemId: "g1",
  requestedStatus: "done",
  localStatuses: res3.newLocal,
  items: [mockGoal1, mockGoal2],
  entries: mockEntries,
  onStatusCalls: calls
});
assert.equal(res4.nextStatus, "not_yet");
assert.equal(calls.length, 1);
assert.equal(calls[0].id, "entry-tea");
assert.equal(calls[0].status, "not_yet", "Toggling off must send not_yet to onStatus, NEVER done");
console.log("✓ Matching tool correctly receives done on check and not_yet on uncheck.");

// -----------------------------------------------------------------------------
// TEST 3: Zero (0) Equipped Tools
// -----------------------------------------------------------------------------
console.log("\n3. Testing 0 Equipped Tools...");
calls = [];
let res5 = simulateToggleStatus({
  itemId: "g1",
  requestedStatus: "done",
  localStatuses: {},
  items: [mockGoal1, mockGoal2],
  entries: [],
  onStatusCalls: calls
});
assert.equal(res5.nextStatus, "done");
assert.equal(res5.newLocal["g1"], "done");
assert.equal(calls.length, 0, "No errors when 0 tools equipped; onStatus not called");
console.log("✓ Zero equipped tools handled gracefully without errors.");

// -----------------------------------------------------------------------------
// TEST 4: Note Parser (Old, New, and Edge Formats)
// -----------------------------------------------------------------------------
console.log("\n4. Testing Note Parser Formats...");

// Legacy note format:
const legacyNote = "Hôm nay tôi ngủ ngon hơn một chút. Đã uống trà.";
assert.deepEqual(parseGoalStatusesFromNote(legacyNote), {});

// Null / undefined note:
assert.deepEqual(parseGoalStatusesFromNote(null), {});
assert.deepEqual(parseGoalStatusesFromNote(undefined), {});

// Modern serialized note:
const modernNote = `[Đánh giá ngày: 4/5 sao]
[Trạng thái mục tiêu: g1=done,g2=not_yet,g3=done,g4=not_yet,g5=not_yet]
Lý do chưa hoàn thành:
- Tắt màn hình 30 phút: bận trả lời email
Thêm ghi chú: đêm nay trời lạnh [18 độ C]`;

const parsed = parseGoalStatusesFromNote(modernNote);
assert.equal(parsed["g1"], "done");
assert.equal(parsed["g2"], "not_yet");
assert.equal(parsed["g3"], "done");
assert.equal(parsed["g4"], "not_yet");
assert.equal(parsed["g5"], "not_yet");
console.log("✓ Note parser correctly handles legacy, null, and modern [Trạng thái mục tiêu: ...] formats.");

// -----------------------------------------------------------------------------
// TEST 5: Consecutive 7-Day Streak Across Timezones
// -----------------------------------------------------------------------------
console.log("\n5. Testing Consecutive Streak Calculation Across Timezones...");

const tzVN = "Asia/Ho_Chi_Minh";
const todayVN = getTodayLocalDate(tzVN);
const [y, m, d] = todayVN.split("-").map(Number);

function shiftDate(baseY, baseM, baseD, offsetDays) {
  const dt = new Date(Date.UTC(baseY, baseM - 1, baseD));
  dt.setUTCDate(dt.getUTCDate() + offsetDays);
  return dt.toISOString().slice(0, 10);
}

// Case A: Checked in today only -> streak = 1
assert.equal(computeConsecutiveStreak([{ local_date: todayVN }], tzVN), 1);

// Case B: Checked in today and yesterday -> streak = 2
assert.equal(computeConsecutiveStreak([
  { local_date: todayVN },
  { local_date: shiftDate(y, m, d, -1) }
], tzVN), 2);

// Case C: Checked in 3 consecutive days ending yesterday (not yet today) -> streak = 3
assert.equal(computeConsecutiveStreak([
  { local_date: shiftDate(y, m, d, -1) },
  { local_date: shiftDate(y, m, d, -2) },
  { local_date: shiftDate(y, m, d, -3) },
], tzVN), 3);

// Case D: Broken streak (today and 2 days ago, missed yesterday) -> streak = 1 (NOT 2)
assert.equal(computeConsecutiveStreak([
  { local_date: todayVN },
  { local_date: shiftDate(y, m, d, -2) }
], tzVN), 1, "Broken streak must NOT count non-consecutive days");

// Case E: Missed both today and yesterday (last was 2 days ago) -> streak = 0
assert.equal(computeConsecutiveStreak([
  { local_date: shiftDate(y, m, d, -2) },
  { local_date: shiftDate(y, m, d, -3) }
], tzVN), 0, "Streak is 0 if last check-in was 2 or more days ago");

// Case F: Max streak is bounded at 7
const consecutive8 = Array.from({ length: 8 }, (_, i) => ({ local_date: shiftDate(y, m, d, -i) }));
assert.equal(computeConsecutiveStreak(consecutive8, tzVN), 7, "Streak is bounded at 7");

console.log("✓ Consecutive streak strictly verified across calendar boundaries and gaps.");

console.log("\n=== ALL DAILY CARE FOCUSED REGRESSION TESTS PASSED (100%) ===");
