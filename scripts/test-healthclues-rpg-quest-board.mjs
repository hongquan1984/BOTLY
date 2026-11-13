import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { toAiPlanGoal } from "../src/features/healthclues/personalized-wellness-plan.ts";
import { healthCluesText } from "../src/lib/healthclues-i18n.ts";

// 1. Verify WellnessPlanBuilder source contracts & RPG elements
const uiSource = await readFile(new URL("../src/components/healthclues/WellnessPlanBuilder.tsx", import.meta.url), "utf8");
const cssSource = await readFile(new URL("../src/components/healthclues/WellnessPlanBuilder.module.css", import.meta.url), "utf8");

// A. Pet Companion Integration
assert.match(uiSource, /import\s+\{\s*HealthCluesPet\s*\}\s+from\s+["']@\/features\/healthclues\/HealthCluesPet["']/, "Imports HealthCluesPet companion.");
assert.match(uiSource, /styles\.petGuide/, "Renders petGuide container.");
assert.match(uiSource, /styles\.petPortrait/, "Renders petPortrait container.");
assert.match(uiSource, /styles\.petSpeech/, "Renders petSpeech dialogue container.");
assert.match(uiSource, /petRegion\s*===\s*["']sleep-better["']\s*\?\s*["']Luna["']\s*:\s*["']Lumi["']/, "Selects Luna for sleep and Lumi for general health.");
assert.match(cssSource, /\.petGuide\s*\{/, "CSS defines .petGuide layout.");
assert.match(cssSource, /\.petSpeech\s*\{/, "CSS defines .petSpeech bubble.");

// B. 3-Slot Quest HUD
assert.match(uiSource, /styles\.questSlotsHud/, "Renders questSlotsHud region.");
assert.match(uiSource, /styles\.questSlotsGrid/, "Renders questSlotsGrid with 3 slots.");
assert.match(uiSource, /\[0,\s*1,\s*2\]\.map\(slotIndex/, "Iterates exactly 3 quest slots.");
assert.match(uiSource, /styles\.questSlotFilled/, "Applies questSlotFilled style when slot contains an equipped goal.");
assert.match(uiSource, /styles\.questSlotEmpty/, "Applies questSlotEmpty style when slot is unequipped.");
assert.match(uiSource, /text\("equipped"\)/, "Renders equipped counter.");
assert.match(cssSource, /\.questSlotsHud\s*\{/, "CSS defines .questSlotsHud.");
assert.match(cssSource, /\.questSlot\s*\{/, "CSS defines .questSlot.");
assert.match(cssSource, /\.questSlotFilled\s*\{/, "CSS defines .questSlotFilled.");

// C. Gamified Quest Cards: EXP & Difficulty Tiers
assert.match(uiSource, /styles\.rewardBadge/, "Renders rewardBadge container.");
assert.match(uiSource, /✨ \+20 EXP/, "Displays EXP reward for AI quests.");
assert.match(uiSource, /styles\.stepBadge/, "Renders stepBadge for difficulty levels.");
assert.match(uiSource, /badge:\s*text\("Start Small"\)/, "Option A provides Start Small / Khởi Động badge.");
assert.match(uiSource, /badge:\s*text\("Level Up"\)/, "Option B provides Level Up / Bứt Phá badge.");
assert.match(cssSource, /\.rewardBadge\s*\{/, "CSS defines .rewardBadge.");
assert.match(cssSource, /\.stepBadge\s*\{/, "CSS defines .stepBadge.");

// D. Single Consolidated Notice
assert.match(uiSource, /styles\.gameNotice/, "Consolidates banners into gameNotice.");
assert.match(uiSource, /data-advisor-status=\{providerStatus\}/, "Preserves data-advisor-status test attribute.");
assert.match(cssSource, /\.gameNotice\s*\{/, "CSS defines .gameNotice.");

// E. Interactive Equipping Behavior
assert.match(uiSource, /setAiIncluded\(current\s*=>\s*\(\{\s*\.\.\.current,\s*\[goal\.goalId\]:\s*true\s*\}\)\)/, "Choosing Option A or B automatically equips quest into HUD.");
assert.match(uiSource, /type="checkbox"\s+checked=\{included\}/, "Maintains accessible inclusion checkbox.");
assert.match(uiSource, /chooseAiOption\(goal,\s*["']A["']\)/, "Defaulting to Option A when checking checkbox directly.");

// 2. Verify Vietnamese i18n dictionary for RPG terms
assert.equal(healthCluesText("vi", "Start Small"), "Khởi Động", "i18n Start Small -> Khởi Động");
assert.equal(healthCluesText("vi", "Level Up"), "Bứt Phá", "i18n Level Up -> Bứt Phá");
assert.equal(healthCluesText("vi", "Empty Slot"), "Ô trống", "i18n Empty Slot -> Ô trống");
assert.equal(healthCluesText("vi", "Slot"), "Ô", "i18n Slot -> Ô");
assert.ok(healthCluesText("vi", "Welcome, adventurer! Based on your sleep journey, I've gathered practical habit quests to help restore your vitality. Choose up to 3 to equip into your Journey!"), "Luna dialogue translation exists.");

// 3. Verify HealthCluesWorldPreview safety error strings have NO mojibake
const previewSource = await readFile(new URL("../src/components/healthclues/HealthCluesWorldPreview.tsx", import.meta.url), "utf8");
assert.doesNotMatch(previewSource, /M\?t s\? th\?ng tin/, "WorldPreview 400 string has no ? mojibake.");
assert.doesNotMatch(previewSource, /H\?nh tr\?nh c\? nhi\?u/, "WorldPreview 413 string has no ? mojibake.");
assert.doesNotMatch(previewSource, /T\?nh n\?ng l\?u/, "WorldPreview 503 string has no ? mojibake.");
assert.doesNotMatch(previewSource, /Kh\?ng th\? l\?u/, "WorldPreview network error string has no ? mojibake.");
assert.match(previewSource, /Tính năng lưu hành trình an toàn đang tạm thời không khả dụng/, "WorldPreview 503 contains proper Vietnamese text.");

// 4. Verify toAiPlanGoal produces valid bilingual output with signed proof
const sampleGoal = {
  goalId: "ai:sample-sleep-1",
  category: "sleep",
  title: { en: "Soothing bedtime snack", vi: "Bữa phụ êm dịu trước giờ ngủ" },
  relevanceReason: { en: "Light nourishment before rest", vi: "Bữa ăn nhẹ giúp thư giãn trước khi ngủ" },
  optionA: { title: { en: "Small Step", vi: "Khởi Động" }, action: { en: "Eat a banana slice", vi: "Ăn vài lát chuối" } },
  optionB: { title: { en: "Level Up", vi: "Bứt Phá" }, action: { en: "Prepare chamomile tea", vi: "Pha trà hoa cúc" } },
  advisorProof: "proof:signed:20261105:advisor-hmac-sha256",
};
const planA_vi = toAiPlanGoal(sampleGoal, "A", "vi", true);
// Per decision D-2026-11-05, the concrete selected action is the displayed title
assert.equal(planA_vi.title, "Ăn vài lát chuối", "Plan A title is concrete selected action");
assert.equal(planA_vi.trackingDefinition, "Ăn vài lát chuối", "Plan A tracking definition matches selected action");
assert.equal(planA_vi.advisorProof, "proof:signed:20261105:advisor-hmac-sha256", "Advisor proof preserved");
assert.equal(planA_vi.generatedOption.option, "A");
assert.equal(planA_vi.generatedOption.locale, "vi");

const planB_vi = toAiPlanGoal(sampleGoal, "B", "vi", true);
assert.equal(planB_vi.title, "Pha trà hoa cúc", "Plan B title is concrete selected action");
assert.equal(planB_vi.trackingDefinition, "Pha trà hoa cúc", "Plan B tracking definition matches selected action");
assert.equal(planB_vi.generatedOption.option, "B");

// Legacy record fallback: when specific action text is blank, falls back to general title
const legacyGoal = {
  goalId: "ai:legacy-sleep-1",
  category: "sleep",
  title: { en: "Soothing bedtime snack", vi: "Bữa phụ êm dịu trước giờ ngủ" },
  relevanceReason: { en: "Light nourishment before rest", vi: "Bữa ăn nhẹ giúp thư giãn trước khi ngủ" },
  optionA: { title: { en: "Small Step", vi: "Khởi Động" }, action: { en: "", vi: "" } },
  optionB: { title: { en: "Level Up", vi: "Bứt Phá" }, action: { en: "", vi: "" } },
  advisorProof: "proof:legacy:signed",
};
const legacyPlan_vi = toAiPlanGoal(legacyGoal, "A", "vi", true);
assert.equal(legacyPlan_vi.title, "Bữa phụ êm dịu trước giờ ngủ", "Legacy goal falls back to generalized title when action is empty");
assert.equal(legacyPlan_vi.advisorProof, "proof:legacy:signed", "Advisor proof preserved on legacy record");

console.log("PASS: test-healthclues-rpg-quest-board (Pet guide, 3-slot HUD, EXP badges, tier badges, interactive equipping, i18n & mojibake cleanup, signed action & legacy titles)");
