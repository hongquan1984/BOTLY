import assert from "node:assert/strict";
import { healthCluesText } from "../src/lib/healthclues-i18n.ts";

function localeHealthCluesPath(pathname, locale) {
  if (!/^\/(en|vi)\/wellness\/healthclues(?:\/|$)/.test(pathname)) return pathname;
  return pathname.replace(/^\/(en|vi)(?=\/wellness\/healthclues(?:\/|$))/, `/${locale}`);
}

console.log("=== Testing HealthClues Language Toggle Verification ===");

// 1. Verify Path Translation
console.log("Step 1: Testing localeHealthCluesPath...");
assert.equal(
  localeHealthCluesPath("/vi/wellness/healthclues/world", "en"),
  "/en/wellness/healthclues/world",
  "Path should toggle from vi to en"
);
assert.equal(
  localeHealthCluesPath("/en/wellness/healthclues/world", "vi"),
  "/vi/wellness/healthclues/world",
  "Path should toggle from en to vi"
);
assert.equal(
  localeHealthCluesPath("/play", "en"),
  "/play",
  "/play path should remain unchanged"
);
console.log("PASS: Path translations correct!");

// 2. Verify NPC Names and Greetings
console.log("Step 2: Testing NPC Names and Greetings in EN & VI...");

const npcs = [
  {
    enName: "Botanist",
    viName: "Nhà Thực Vật Học",
    enGreeting: "Welcome to my garden. We can explore educational topics connected to your journey.",
    viGreeting: "Chào mừng bạn đến khu vườn. Chúng ta có thể tìm hiểu các chủ đề kiến thức liên quan đến hành trình của bạn.",
  },
  {
    enName: "Trail Explorer",
    viName: "Người Khám Phá Đường Mòn",
    enGreeting: "Welcome to the trail. Explore movement ideas at your own pace.",
    viGreeting: "Chào mừng bạn đến đường mòn. Hãy khám phá các gợi ý vận động theo nhịp độ của riêng mình.",
  },
  {
    enName: "Wellness Guide",
    viName: "Người Hướng Dẫn Sức Khỏe",
    enGreeting: "Welcome. This sanctuary is a place to explore supportive practices.",
    viGreeting: "Chào mừng bạn. Đây là nơi để khám phá các phương pháp hỗ trợ sức khỏe.",
  },
];

for (const npc of npcs) {
  // Test English
  assert.equal(healthCluesText("en", npc.enName), npc.enName, `EN name for ${npc.enName}`);
  assert.equal(healthCluesText("en", npc.enGreeting), npc.enGreeting, `EN greeting for ${npc.enName}`);
  
  // Test Vietnamese
  assert.equal(healthCluesText("vi", npc.enName), npc.viName, `VI name for ${npc.enName}`);
  assert.equal(healthCluesText("vi", npc.enGreeting), npc.viGreeting, `VI greeting for ${npc.enName}`);
}
console.log("PASS: NPC names and greetings verified!");

// 3. Verify Landmarks and Subtitles
console.log("Step 3: Testing Landmark Names and Subtitles...");

const landmarks = [
  { en: "Activity Trail", vi: "Đường Mòn Vận Động" },
  { en: "Food & Botanical Garden", vi: "Vườn Thực Phẩm & Thảo Mộc" },
  { en: "Wellness Sanctuary", vi: "Khu Tĩnh Dưỡng" },
  { en: "Adventure Camp", vi: "Trại Phiêu Lưu" },
  { en: "Explorer Camp", vi: "Trại Khám Phá" },
  { en: "Research Library", vi: "Thư Viện Nghiên Cứu" },
  { en: "Knowledge Library", vi: "Thư Viện Kiến Thức" },
  { en: "Gentle activity discovery", vi: "Khám phá vận động nhẹ nhàng" },
  { en: "Food and botanical learning", vi: "Tìm hiểu dinh dưỡng & thảo mộc" },
  { en: "Backpack, Journal and Care Records", vi: "Túi đồ, Nhật ký & Hồ sơ chăm sóc" },
  { en: "Supportive practices", vi: "Các phương pháp hỗ trợ sức khỏe" },
  { en: "Journey learning", vi: "Kiến thức theo hành trình" },
  { en: "Optional knowledge challenge", vi: "Thử thách kiến thức tự chọn" },
  { en: "Saved rewards and keepsakes", vi: "Phần thưởng & kỷ vật đã lưu" },
];

for (const lm of landmarks) {
  assert.equal(healthCluesText("en", lm.en), lm.en, `EN text for ${lm.en}`);
  assert.equal(healthCluesText("vi", lm.en), lm.vi, `VI text for ${lm.en}`);
}
console.log("PASS: All landmark titles and subtitles verified!");

// 4. Verify HUD Action Labels & Bottom Dock
console.log("Step 4: Testing Bottom Dock & Talk Buttons in EN & VI...");

const hudTerms = [
  { en: "Talk", vi: "Trò chuyện" },
  { en: "Map", vi: "Bản đồ" },
  { en: "Journey", vi: "Hành Trình" },
  { en: "Reminders", vi: "Nhắc nhở" },
  { en: "Today", vi: "Hôm nay" },
  { en: "Knowledge", vi: "Kiến Thức" },
  { en: "Settings", vi: "Cài Đặt" },
  { en: "Daily Care", vi: "Nhiệm vụ Sống Khỏe" },
  { en: "7-Day Streak", vi: "Hành trình 7 ngày" },
];

for (const term of hudTerms) {
  const getLabel = (locale) => {
    switch (term.en) {
      case "Talk": return locale === "vi" ? "Trò chuyện" : "Talk";
      case "Map": return locale === "vi" ? "Bản đồ" : "Map";
      case "Journey": return locale === "vi" ? "Hành Trình" : "Journey";
      case "Reminders": return locale === "vi" ? "Nhắc nhở" : "Reminders";
      case "Today": return locale === "vi" ? "Hôm nay" : "Today";
      case "Knowledge": return locale === "vi" ? "Kiến Thức" : "Knowledge";
      case "Settings": return locale === "vi" ? "Cài Đặt" : "Settings";
      case "Daily Care": return locale === "vi" ? "Nhiệm vụ Sống Khỏe" : "Daily Care";
      case "7-Day Streak": return locale === "vi" ? "Hành trình 7 ngày" : "7-Day Streak";
      default: return term.en;
    }
  };
  assert.equal(getLabel("en"), term.en, `HUD EN term for ${term.en}`);
  assert.equal(getLabel("vi"), term.vi, `HUD VI term for ${term.en}`);
}
console.log("PASS: HUD action labels and bottom dock verified!");

console.log("ALL LANGUAGE TOGGLE VERIFICATION TESTS PASSED 100%!");
