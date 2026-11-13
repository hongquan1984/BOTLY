import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

// Dynamic imports of our TypeScript modules
const {
  GAME_ICON_REGISTRY,
  VALID_AI_HABIT_ICON_KEYS,
  VALID_AI_HABIT_CATEGORIES,
  AI_CATEGORY_FALLBACK_ICONS,
  UNIVERSAL_AI_FALLBACK_ICON,
  toAiHabitIconKey,
} = await import("../src/components/healthclues/gameIconRegistry.ts");

const {
  validateAndResolveGoalIcon,
  resolveWellnessIcon,
} = await import("../src/components/healthclues/wellnessIconResolver.ts");

console.log("============================================================");
console.log("HEALTHCLUES — DYNAMIC AI HABIT ICON MAPPING TEST SUITE");
console.log("============================================================\n");

// TEST 1: All VALID_AI_HABIT_ICON_KEYS exist in GAME_ICON_REGISTRY and exist on disk
console.log("▶ TEST 1: Validating all approved AI habit icon keys map to real files on disk...");
assert(VALID_AI_HABIT_ICON_KEYS.length >= 35, `Expected >= 35 valid AI icon keys, got ${VALID_AI_HABIT_ICON_KEYS.length}`);

for (const key of VALID_AI_HABIT_ICON_KEYS) {
  const assetPath = GAME_ICON_REGISTRY[key];
  assert(assetPath, `Key "${key}" must exist in GAME_ICON_REGISTRY`);
  const fullPath = path.join(projectRoot, "public", assetPath);
  assert(fs.existsSync(fullPath), `Asset file must exist on disk: ${fullPath} (key: ${key})`);
  const stat = fs.statSync(fullPath);
  assert(stat.size > 0, `Asset file cannot be empty: ${fullPath}`);
}
console.log(`  ✓ All ${VALID_AI_HABIT_ICON_KEYS.length} AI habit keys map to non-empty disk files.`);

// TEST 2: Category Fallbacks are valid
console.log("\n▶ TEST 2: Validating category fallbacks...");
for (const cat of VALID_AI_HABIT_CATEGORIES) {
  const fallback = AI_CATEGORY_FALLBACK_ICONS[cat];
  assert(fallback, `Category "${cat}" must have a category fallback icon`);
  assert(GAME_ICON_REGISTRY[fallback], `Fallback icon "${fallback}" must be registered`);
}
console.log(`  ✓ All ${VALID_AI_HABIT_CATEGORIES.length} AI habit categories have valid registered fallbacks.`);

// TEST 3: Simulating 10 habits returned by Gemini in a single response
console.log("\n▶ TEST 3: Simulating 10 habits returned in a single Gemini response...");
const mockGemini10Habits = [
  { id: "h1", title: "Morning brisk walk", category: "movement", icon_key: "movement.walking", tracking: "20 min walk" },
  { id: "h2", title: "Eat oily fish twice a week", category: "nutrition", icon_key: "nutrition.fish", tracking: "2 portions of salmon" },
  { id: "h3", title: "Daily vegetable intake", category: "nutrition", icon_key: "nutrition.vegetables", tracking: "2 cups greens" },
  { id: "h4", title: "Mindfulness breathing session", category: "wellness", icon_key: "wellness.breathing", tracking: "5 min session" },
  { id: "h5", title: "Consistent sleep bedtime", category: "sleep", icon_key: "sleep.bedtime", tracking: "In bed by 10:30 PM" },
  { id: "h6", title: "Drink 2L fresh water", category: "hydration", icon_key: "hydration.water", tracking: "8 glasses" },
  { id: "h7", title: "Chamomile herbal tea before sleep", category: "herbs", icon_key: "herbs.chamomile", tracking: "1 cup chamomile" },
  { id: "h8", title: "Morning sunlight exposure", category: "lifestyle", icon_key: "lifestyle.sunlight", tracking: "15 min outside" },
  { id: "h9", title: "Evening stretching / yoga", category: "movement", icon_key: "movement.yoga", tracking: "10 min gentle yoga" },
  { id: "h10", title: "Reduce sugary soda", category: "nutrition", icon_key: "nutrition.sugary_drink_avoid", tracking: "0 soda cans" },
];

for (const habit of mockGemini10Habits) {
  const resolved = validateAndResolveGoalIcon(habit);
  assert.equal(resolved.iconKey, habit.icon_key, `Expected iconKey ${habit.icon_key}, got ${resolved.iconKey}`);
  assert.equal(resolved.matchedBy, "direct_ai_key");
  const assetPath = GAME_ICON_REGISTRY[resolved.iconKey];
  assert(assetPath, `Asset path must exist for ${resolved.iconKey}`);
  assert(fs.existsSync(path.join(projectRoot, "public", assetPath)));
}
console.log("  ✓ All 10 habits resolved synchronously without external fetch or AI image generation.");

// TEST 4: Fallback behavior on invalid / hallucinated AI key
console.log("\n▶ TEST 4: Testing invalid AI icon_key fallback to category fallback...");
const invalidKeyHabit1 = {
  title: "Fly to the stars for fitness",
  category: "movement",
  icon_key: "movement.flying_to_mars", // invalid
};
const resolvedInvalid1 = validateAndResolveGoalIcon(invalidKeyHabit1);
assert.equal(resolvedInvalid1.iconKey, AI_CATEGORY_FALLBACK_ICONS.movement);
assert.equal(resolvedInvalid1.matchedBy, "category_fallback");
console.log(`  ✓ Invalid key in "movement" fell back to: ${resolvedInvalid1.iconKey}`);

const invalidKeyHabit2 = {
  title: "Eat magic glowing mushrooms",
  category: "nutrition",
  icon_key: "nutrition.magic_potion", // invalid
};
const resolvedInvalid2 = validateAndResolveGoalIcon(invalidKeyHabit2);
assert.equal(resolvedInvalid2.iconKey, AI_CATEGORY_FALLBACK_ICONS.nutrition);
assert.equal(resolvedInvalid2.matchedBy, "category_fallback");
console.log(`  ✓ Invalid key in "nutrition" fell back to: ${resolvedInvalid2.iconKey}`);

// TEST 5: Fallback behavior on missing key + missing category (Semantic text matching)
console.log("\n▶ TEST 5: Testing missing key & category with semantic text resolution...");
const semanticTests = [
  { text: "Đi bộ nhẹ 20 phút mỗi ngày", expectedDotKey: "movement.walking", expectedColonKey: "physical:walking" },
  { text: "Uống 2 lít nước ấm", expectedDotKey: "hydration.water", expectedColonKey: "hydration:glass" },
  { text: "Ăn thêm rau xanh và cà rốt", expectedDotKey: "nutrition.vegetables", expectedColonKey: "food:vegetables" },
  { text: "Tập yoga kéo giãn cơ", expectedDotKey: "movement.yoga", expectedColonKey: "yoga:lotus" },
  { text: "Thiền định tĩnh tâm trước khi ngủ", expectedDotKey: "wellness.meditation", expectedColonKey: "meditation:mindfulness" },
  { text: "Trà hoa cúc thư giãn", expectedDotKey: "herbs.chamomile", expectedColonKey: "herbs:chamomile" },
];

for (const t of semanticTests) {
  // Test validateAndResolveGoalIcon
  const resolvedGoal = validateAndResolveGoalIcon({ title: t.text });
  assert.equal(resolvedGoal.iconKey, t.expectedDotKey, `For "${t.text}", expected dot key ${t.expectedDotKey}, got ${resolvedGoal.iconKey}`);
  assert.equal(resolvedGoal.matchedBy, "semantic_text");

  // Test resolveWellnessIcon
  const resolvedDirect = resolveWellnessIcon({ text: t.text });
  assert.equal(resolvedDirect.key, t.expectedColonKey);
  assert.equal(resolvedDirect.aiHabitKey, t.expectedDotKey);
}
console.log("  ✓ Semantic text analyzer accurately matched Vietnamese health habit prompts.");

// TEST 6: Universal fallback on unmatchable gibberish
console.log("\n▶ TEST 6: Testing universal fallback on unmatchable text...");
const gibberishGoal = {
  title: "Xyzzqwerty 12345 !@#$%",
  category: "unknown_category_xyz",
};
const resolvedGibberish = validateAndResolveGoalIcon(gibberishGoal);
assert.equal(resolvedGibberish.iconKey, UNIVERSAL_AI_FALLBACK_ICON);
assert.equal(resolvedGibberish.matchedBy, "universal_fallback");
console.log(`  ✓ Unmatchable text safely fell back to: ${resolvedGibberish.iconKey}`);

// TEST 7: Custom user note mapping (without calling Gemini)
console.log("\n▶ TEST 7: Testing user custom note mapping (client-side, no AI call)...");
const userNotes = [
  { note: "Tôi muốn đi bộ quanh hồ mỗi tối", category: "movement" },
  { note: "Cắt giảm nước ngọt có ga", category: "nutrition" },
  { note: "Tập hít thở sâu 4-7-8 khi làm việc", category: "mindfulness" },
  { note: "Uống đủ 8 ly nước mỗi ngày", category: "hydration" },
];

for (const u of userNotes) {
  const resolved = validateAndResolveGoalIcon({ title: u.note, category: u.category });
  assert(resolved.iconKey, `Must resolve an iconKey for user note: ${u.note}`);
  assert(GAME_ICON_REGISTRY[resolved.iconKey], `Resolved key ${resolved.iconKey} must exist in registry`);
  const fullPath = path.join(projectRoot, "public", GAME_ICON_REGISTRY[resolved.iconKey]);
  assert(fs.existsSync(fullPath), `File must exist for user note: ${fullPath}`);
}
console.log("  ✓ User-created custom goals resolved directly to valid icons without extra Gemini calls.");

// TEST 8: Persistence stability (iconKey remains identical after serialization)
console.log("\n▶ TEST 8: Testing iconKey persistence across serialization...");
const originalGoal = {
  goalId: "test-goal-uuid-1",
  title: "Morning brisk walk",
  category: "movement",
  iconKey: "movement.walking",
  choice: "active",
};
const serialized = JSON.stringify(originalGoal);
const deserialized = JSON.parse(serialized);
assert.equal(deserialized.iconKey, originalGoal.iconKey);
const reResolved = validateAndResolveGoalIcon(deserialized);
assert.equal(reResolved.iconKey, originalGoal.iconKey);
console.log("  ✓ Goal iconKey persisted perfectly across JSON serialization cycles.");

console.log("\n============================================================");
console.log("ALL TESTS PASSED SUCCESSFULLY! (8 / 8 suites passed)");
console.log("============================================================");
