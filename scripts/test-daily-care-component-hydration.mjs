import assert from "node:assert/strict";
import {
  computeInitialStatuses,
  parseReasonsAndPersonalNote,
  calculateStars,
  parseGoalStatusesFromNote
} from "../src/features/healthclues/daily-care-domain.ts";
import {
  computeConsecutiveStreak,
  getTodayLocalDate
} from "../src/features/healthclues/daily-care-domain.ts";

console.log("=== STARTING DAILY CARE COMPONENT HYDRATION & REOPEN TEST ===");

// 1. Pure Domain Verification for computeInitialStatuses
console.log("\n1. Testing computeInitialStatuses with 5 Goals and 0 Tools...");
const sampleGoals = [
  { goalId: "g1", title: "Uống trà hoa cúc buổi tối", templateId: "tool-chamomile", choice: "active" },
  { goalId: "g2", title: "Tắt màn hình 30 phút", templateId: null, choice: "active" },
  { goalId: "g3", title: "Thở 4-7-8 5 phút", templateId: "tool-breathing", choice: "active" },
  { goalId: "g4", title: "Giữ phòng ngủ 22°C", templateId: null, choice: "active" },
  { goalId: "g5", title: "Ghi nhật ký cảm xúc", templateId: null, choice: "active" },
];
const items = sampleGoals.map(g => ({
  id: g.goalId,
  title: g.title,
  isGoal: true,
  rawGoal: g
}));

// Test 1A: Empty initial state when loaded=false, note="", statuses={}
const initialEmpty = computeInitialStatuses(items, [], "", {});
assert.deepEqual(initialEmpty, {}, "Empty note and statuses must produce empty initial map");
console.log("✓ Initial empty state produces empty status map.");

// Test 1B: Saved note arrives
const savedNote = [
  "[Đánh giá ngày: 3/5 sao]",
  "[Trạng thái mục tiêu: g1=done,g2=not_yet,g3=done,g4=not_yet,g5=not_yet]",
  "Lý do chưa hoàn thành:",
  "- Tắt màn hình 30 phút: bận việc đột xuất",
  "Tối nay thấy thư thái hơn."
].join("\n");

const hydrated = computeInitialStatuses(items, [], savedNote, {});
assert.equal(hydrated["g1"], "done");
assert.equal(hydrated["g2"], "not_yet");
assert.equal(hydrated["g3"], "done");
assert.equal(hydrated["g4"], "not_yet");
assert.equal(hydrated["g5"], "not_yet");
console.log("✓ All 5 goal statuses correctly computed from saved note.");

// 2. Testing parseReasonsAndPersonalNote
console.log("\n2. Testing parseReasonsAndPersonalNote...");
const parsed = parseReasonsAndPersonalNote(savedNote, items);
assert.equal(parsed.reasonsMap["g2"], "bận việc đột xuất", "Reason for g2 must be extracted");
assert.equal(parsed.personalNote, "Tối nay thấy thư thái hơn.", "Personal note must exclude tags and reasons header");
console.log("✓ Uncompleted reasons and personal note parsed accurately.");

// 3. Simulating Component Lifecycle: loaded=false -> loaded=true (Prop Hydration)
console.log("\n3. Simulating Component Lifecycle: Transition from loaded=false to loaded=true...");

class DailyCheckinSimulator {
  constructor(initialProps) {
    this.props = initialProps;
    this.userDirtiedStatuses = new Set();
    this.userDirtiedReasons = new Set();
    this.userDirtiedNote = false;

    // Initial state
    this.localStatuses = computeInitialStatuses(this.props.items, this.props.entries, this.props.note, this.props.statuses);
    const parsed = parseReasonsAndPersonalNote(this.props.note, this.props.items);
    this.reasons = { ...parsed.reasonsMap };
    this.personalNote = parsed.personalNote;
  }

  updateProps(nextProps) {
    this.props = nextProps;
    // Mirror the useEffect logic in DailyCheckinDialog.tsx
    const incomingStatuses = computeInitialStatuses(this.props.items, this.props.entries, this.props.note, this.props.statuses);
    const { reasonsMap, personalNote: incomingNote } = parseReasonsAndPersonalNote(this.props.note, this.props.items);

    const nextStatuses = { ...this.localStatuses };
    for (const [id, val] of Object.entries(incomingStatuses)) {
      if (!this.userDirtiedStatuses.has(id)) {
        nextStatuses[id] = val;
      }
    }
    this.localStatuses = nextStatuses;

    const nextReasons = { ...this.reasons };
    for (const [id, val] of Object.entries(reasonsMap)) {
      if (!this.userDirtiedReasons.has(id)) {
        nextReasons[id] = val;
      }
    }
    this.reasons = nextReasons;

    if (!this.userDirtiedNote) {
      this.personalNote = incomingNote;
    }
  }

  toggleStatus(itemId, requestedStatus) {
    this.userDirtiedStatuses.add(itemId);
    const current = this.localStatuses[itemId];
    const nextStatus = current === requestedStatus ? "not_yet" : requestedStatus;
    this.localStatuses[itemId] = nextStatus;
    return nextStatus;
  }

  setReason(itemId, text) {
    this.userDirtiedReasons.add(itemId);
    this.reasons[itemId] = text;
  }

  setNote(text) {
    this.userDirtiedNote = true;
    this.personalNote = text;
  }

  compileNote() {
    const totalItems = this.props.items.length;
    const doneCount = this.props.items.filter(it => this.localStatuses[it.id] === "done").length;
    const stars = calculateStars(doneCount, totalItems);

    const lines = [];
    lines.push(`[Đánh giá ngày: ${stars}/5 sao]`);
    const goalStatusEntries = this.props.items.map(it => `${it.id}=${this.localStatuses[it.id] || "not_yet"}`);
    if (goalStatusEntries.length > 0) {
      lines.push(`[Trạng thái mục tiêu: ${goalStatusEntries.join(",")}]`);
    }

    const uncompletedWithReason = this.props.items
      .filter(it => this.localStatuses[it.id] === "not_yet" && this.reasons[it.id]?.trim())
      .map(it => `- ${it.title}: ${this.reasons[it.id].trim()}`);

    if (uncompletedWithReason.length > 0) {
      lines.push("Lý do chưa hoàn thành:");
      lines.push(...uncompletedWithReason);
    }

    if (this.personalNote.trim()) {
      lines.push(this.personalNote.trim());
    }

    return lines.join("\n");
  }
}

// Case A: User opens dialog for existing check-in, loaded=false -> loaded=true, saves without modification
const simA = new DailyCheckinSimulator({
  items,
  entries: [],
  note: "",
  statuses: {},
  loaded: false
});

// Initially empty while loading
assert.equal(Object.keys(simA.localStatuses).length, 0);

// Props arrive from server: loaded=true with savedNote
simA.updateProps({
  items,
  entries: [],
  note: savedNote,
  statuses: {},
  loaded: true
});

assert.equal(simA.localStatuses["g1"], "done");
assert.equal(simA.localStatuses["g2"], "not_yet");
assert.equal(simA.localStatuses["g3"], "done");
assert.equal(simA.reasons["g2"], "bận việc đột xuất");
assert.equal(simA.personalNote, "Tối nay thấy thư thái hơn.");

// User saves immediately without touching: compiled note must NOT overwrite with defaults!
const compiledA = simA.compileNote();
assert.match(compiledA, /g1=done/);
assert.match(compiledA, /g2=not_yet/);
assert.match(compiledA, /g3=done/);
assert.match(compiledA, /bận việc đột xuất/);
assert.match(compiledA, /Tối nay thấy thư thái hơn\./);
console.log("✓ Unmodified save preserves 100% of saved data without overwriting defaults.");

// Case B: Double toggle test on Goal 2
console.log("\n4. Testing Double Toggle Behavior on Reopened Dialog...");
// First toggle on g2 (currently not_yet): becomes done
const firstToggle = simA.toggleStatus("g2", "done");
assert.equal(firstToggle, "done", "First click on Done must set to done");
assert.equal(simA.localStatuses["g2"], "done");

// Second toggle on g2: toggles back to not_yet
const secondToggle = simA.toggleStatus("g2", "done");
assert.equal(secondToggle, "not_yet", "Second click on Done must toggle back to not_yet");
assert.equal(simA.localStatuses["g2"], "not_yet");
console.log("✓ Double toggle correctly sets done then reverts to not_yet.");

// Case C: Late network response does not overwrite active user edits
console.log("\n5. Testing Late Response Guard (user edits before loaded=true)...");
const simC = new DailyCheckinSimulator({
  items,
  entries: [],
  note: "",
  statuses: {},
  loaded: false
});

// User marks g1 as done while still loading
simC.toggleStatus("g1", "done");
assert.equal(simC.localStatuses["g1"], "done");

// Server responds late with g1=not_yet in savedNote
const lateSavedNote = "[Trạng thái mục tiêu: g1=not_yet,g2=done]";
simC.updateProps({
  items,
  entries: [],
  note: lateSavedNote,
  statuses: {},
  loaded: true
});

// g1 was dirtied by user -> MUST STAY "done"!
assert.equal(simC.localStatuses["g1"], "done", "User-dirtied g1 must not be overwritten by late server response");
// g2 was untouched -> MUST BE HYDRATED to "done"!
assert.equal(simC.localStatuses["g2"], "done", "Untouched g2 must be hydrated from server response");
console.log("✓ Late network response preserves active user edits while hydrating untouched fields.");

// Case D: Re-opening closed dialog (open -> close -> open)
console.log("\n6. Testing Re-open Dialog Simulation...");
const simReopen = new DailyCheckinSimulator({
  items,
  entries: [],
  note: savedNote,
  statuses: {},
  loaded: true
});
assert.equal(simReopen.localStatuses["g1"], "done");
assert.equal(simReopen.localStatuses["g2"], "not_yet");
assert.equal(simReopen.reasons["g2"], "bận việc đột xuất");
assert.equal(simReopen.personalNote, "Tối nay thấy thư thái hơn.");
console.log("✓ Re-opened dialog accurately displays previously saved state.");

// Case E: Fresh day with 0 existing checkins
console.log("\n7. Testing Fresh Day (no prior checkin)...");
const simFresh = new DailyCheckinSimulator({
  items,
  entries: [],
  note: null,
  statuses: {},
  loaded: true
});
assert.deepEqual(simFresh.localStatuses, {});
assert.deepEqual(simFresh.reasons, {});
assert.equal(simFresh.personalNote, "");
const freshCompiled = simFresh.compileNote();
assert.match(freshCompiled, /g1=not_yet,g2=not_yet,g3=not_yet,g4=not_yet,g5=not_yet/);
assert.match(freshCompiled, /0\/5 sao/);
console.log("✓ Fresh day defaults gracefully to 0/5 stars and not_yet without errors.");

console.log("\n=== ALL DAILY CARE COMPONENT HYDRATION TESTS PASSED (100%) ===");
