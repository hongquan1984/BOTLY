import assert from "node:assert/strict";
import { resolveWellnessIcon } from "../src/components/healthclues/wellnessIconResolver.ts";
import { GAME_ICON_REGISTRY } from "../src/components/healthclues/gameIconRegistry.ts";
import { existsSync } from "node:fs";
import path from "node:path";

console.log("Testing Semantic Wellness Icon Resolver...");

const testCases = [
  // User's specific prompt examples:
  {
    input: { title: "Đi bộ nhẹ mỗi ngày", action: "Dạo bộ 20 phút sau bữa tối" },
    expectedKey: "physical:walking",
    expectedCategory: "Physical Activities",
  },
  {
    input: { title: "Tập yoga", action: "15 phút yoga nhẹ nhàng trước khi ngủ" },
    expectedKey: "yoga:lotus",
    expectedCategory: "Yoga & Stretching",
  },
  {
    input: { title: "Uống đủ nước", action: "Uống 1 ly nước ấm ngay khi thức dậy" },
    expectedKey: "hydration:glass",
    expectedCategory: "Hydration",
  },
  {
    input: { title: "Giảm tiêu thụ thịt đỏ", action: "Thay thế thịt bò bằng cá hoặc đậu 2 lần/tuần" },
    expectedKey: "food:red-meat",
    expectedCategory: "Food & Nutrition",
  },
  {
    input: { title: "Ăn thêm rau xanh", action: "Bổ sung cải bó xôi và súp lơ xanh vào bữa trưa" },
    expectedKey: "food:vegetables",
    expectedCategory: "Food & Nutrition",
  },
  {
    input: { title: "Thiền trước khi ngủ", action: "10 phút thiền chánh niệm buông thư" },
    expectedKey: "meditation:mindfulness",
    expectedCategory: "Meditation & Breathing",
  },
  {
    input: { title: "Trà hoa cúc", action: "Uống một tách trà cúc ấm thư giãn" },
    expectedKey: "herbs:chamomile",
    expectedCategory: "Herbs & Plants",
  },
  // Additional wellness examples:
  {
    input: { title: "Ăn cá hồi giàu omega 3", action: "Bổ sung cá hồi 2 lần mỗi tuần" },
    expectedKey: "food:fish",
    expectedCategory: "Food & Nutrition",
  },
  {
    input: { title: "Hít thở 4-7-8 khi căng thẳng", action: "Điều hòa nhịp thở sâu" },
    expectedKey: "meditation:breathing",
    expectedCategory: "Meditation & Breathing",
  },
  {
    input: { title: "Tắm nắng sáng 15 phút", action: "Đón ánh nắng sớm tự nhiên" },
    expectedKey: "habits:sunlight",
    expectedCategory: "Daily Habits",
  },
  {
    input: { title: "Tắt điện thoại trước khi ngủ", action: "Tránh ánh sáng xanh từ màn hình" },
    expectedKey: "habits:screen-off",
    expectedCategory: "Daily Habits",
  },
  {
    input: { title: "Hạn chế bia rượu", action: "Giảm đồ uống có cồn" },
    expectedKey: "habits:alcohol-cessation",
    expectedCategory: "Daily Habits",
  },
  {
    input: { title: "Giảm lượng muối", action: "Hạn chế mặn và bột nêm natri" },
    expectedKey: "food:salt-off",
    expectedCategory: "Food & Nutrition",
  },
  {
    input: { title: "Viết nhật ký giấc ngủ", action: "Ghi chép cảm giác trước khi lên giường" },
    expectedKey: "habits:journaling",
    expectedCategory: "Daily Habits",
  },
  // English examples:
  {
    input: { title: "Brisk morning walk", action: "Walk 20 minutes outside" },
    expectedKey: "physical:walking",
    expectedCategory: "Physical Activities",
  },
  {
    input: { title: "Hydrate regularly", action: "Drink 8 glasses of water daily" },
    expectedKey: "hydration:droplet",
    expectedCategory: "Hydration",
  },
  {
    input: { title: "Gentle bedtime yoga", action: "Perform relaxing stretches" },
    expectedKey: "yoga:lotus",
    expectedCategory: "Yoga & Stretching",
  },
  // Fallbacks:
  {
    input: { title: "Generic wellness goal", category: "sleep" },
    expectedKey: "sleep:moon-stars",
    expectedCategory: "Sleep & Relaxation",
  },
  {
    input: { title: "Mystery activity without keywords", category: "unknown" },
    expectedKey: "quests:target",
    expectedCategory: "Quests & Achievements",
  },
];

let passed = 0;
for (const tc of testCases) {
  const result = resolveWellnessIcon(tc.input);
  assert.equal(
    result.key,
    tc.expectedKey,
    `Failed matching "${tc.input.title}": got ${result.key}, expected ${tc.expectedKey}`
  );
  assert.equal(
    result.category,
    tc.expectedCategory,
    `Category mismatch for "${tc.input.title}": got ${result.category}, expected ${tc.expectedCategory}`
  );

  // Assert the resolved icon exists in GAME_ICON_REGISTRY and on disk
  const url = GAME_ICON_REGISTRY[result.key];
  assert.ok(url, `Registry entry missing for key: ${result.key}`);
  const filePath = path.join("d:/botly/public", url);
  assert.ok(existsSync(filePath), `Physical file missing on disk: ${filePath}`);

  passed++;
  console.log(` ✓ "${tc.input.title}" -> [${result.category}] ${result.key} (${result.matchedBy})`);
}

console.log(`\nALL ${passed}/${testCases.length} SEMANTIC WELLNESS ICON RESOLUTION TESTS PASSED!`);
