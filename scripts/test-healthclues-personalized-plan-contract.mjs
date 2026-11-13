import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { parseGeminiWellnessPlanResponse } from "../src/features/healthclues/gemini-wellness-plan.ts";
import { toAiPlanGoal, validateGeneratedWellnessPlan, validatePersistedAiGoal } from "../src/features/healthclues/personalized-wellness-plan.ts";
import { signGeneratedGoal, verifyGeneratedGoalProof } from "../src/features/healthclues/server/wellness-plan-proof.ts";
import { verifiedGeneratedGoalFromProof } from "../src/features/healthclues/server/wellness-plan-proof.ts";
import { localizedPlanGoalCopy } from "../src/features/healthclues/wellness-plan.ts";

const profileFor = topic => ({ topic, contentPreferences: [topic], specificInterests: [], twoWeekGoal: `Improve ${topic.toLowerCase()}`, presentation: "", comfortableActivityTime: "", refreshFrequency: "Weekly", createdAt: "", safetyLevel: "none", safetyContext: { activityRestriction: "no", acutePainfulJoint: "no" } });
const text = (en, vi = en) => ({ en, vi });
const goal = ({ reason, title, actionA, actionB, viReason = reason, viTitle = title, viA = actionA, viB = actionB }) => ({
  title: text(title, viTitle), relevanceReason: text(reason, viReason),
  optionA: { title: text("Small step", "Bước nhỏ"), action: text(actionA, viA) },
  optionB: { title: text("More involved step", "Bước cụ thể hơn"), action: text(actionB, viB) },
});
const cases = [
  { profile: profileFor("Sleep / Insomnia"), item: goal({ title: "Create a phone wind-down", reason: "You said you use your phone before sleep.", viReason: "Bạn nói mình dùng điện thoại trước khi ngủ.", actionA: "Put your phone aside 15 minutes before sleep.", actionB: "Put your phone aside 30 minutes before sleep.", viA: "Để điện thoại sang một bên 15 phút trước khi ngủ.", viB: "Để điện thoại sang một bên 30 phút trước khi ngủ." }) },
  { profile: profileFor("Gout / Uric Acid"), item: goal({ title: "Notice meal patterns", reason: "You selected gout as the concern for this journey.", viReason: "Bạn đã chọn gout làm mối quan tâm cho hành trình này.", actionA: "For one meal this week, note a food choice and how it fits your routine.", actionB: "For two meals this week, note food choices and how they fit your routine.", viA: "Trong một bữa ăn tuần này, ghi lại lựa chọn món ăn và cách nó phù hợp với nếp sinh hoạt.", viB: "Trong hai bữa ăn tuần này, ghi lại lựa chọn món ăn và cách chúng phù hợp với nếp sinh hoạt." }) },
  { profile: profileFor("Weight Management"), item: goal({ title: "Try a manageable walk", reason: "You selected weight management and asked for practical activity ideas.", viReason: "Bạn chọn quản lý cân nặng và muốn có gợi ý vận động thực tế.", actionA: "Try a comfortable 10-minute walk on a day that suits you.", actionB: "Try a comfortable 20-minute walk on a day that suits you.", viA: "Thử đi bộ thoải mái 10 phút vào ngày phù hợp với bạn.", viB: "Thử đi bộ thoải mái 20 phút vào ngày phù hợp với bạn." }) },
];
for (const { profile, item } of cases) {
  const checked = validateGeneratedWellnessPlan({ goals: [item] }, profile);
  assert.equal(checked.goals.length, 1, `${profile.topic}: reasonable numeric or lifestyle choice passes`);
  const parsed = parseGeminiWellnessPlanResponse(JSON.stringify({ goals: [item] }), profile);
  assert.equal(parsed.goals.length, 1);
  assert.match(parsed.goals[0].goalId, /^ai:[0-9a-f-]{36}$/);
  assert.equal("goalId" in item, false, "model does not generate internal IDs");
  assert.equal("target" in item.optionA, false, "no separate target fields are required");
  assert.deepEqual(item.optionA.action.en.match(/\d+/g) || [], item.optionA.action.vi.match(/\d+/g) || [], "EN and VI preserve A numerical choices");
  assert.deepEqual(item.optionB.action.en.match(/\d+/g) || [], item.optionB.action.vi.match(/\d+/g) || [], "EN and VI preserve B numerical choices");
  const a = toAiPlanGoal(parsed.goals[0], "A", "en");
  const aVi = toAiPlanGoal(parsed.goals[0], "A", "vi");
  const bVi = toAiPlanGoal(parsed.goals[0], "B", "vi");
  assert.match(toAiPlanGoal(parsed.goals[0], "A", "en", true).evidenceStatus, /SYNTHETIC TEST ONLY/, "Explicit fixtures retain their synthetic disclosure in persisted goal metadata");
  assert.equal(a.goalId, aVi.goalId, "locale switch keeps canonical goal ID");
  assert.equal(a.trackingDefinition, item.optionA.action.en);
  assert.equal(bVi.trackingDefinition, item.optionB.action.vi);
  assert.equal(a.targetValue, null);
  assert.equal(a.provenance, "ai_generated");
  assert.equal(a.sources.length, 0, "ordinary AI suggestions require no catalog source row");
}

const sleep = cases[0];
const identical = structuredClone(sleep.item);
identical.optionB.action = structuredClone(identical.optionA.action);
assert.equal(validateGeneratedWellnessPlan({ goals: [identical] }, sleep.profile).semanticRejectedCount, 1, "identical A/B levels are rejected");
const mismatchedLocale = structuredClone(sleep.item);
mismatchedLocale.optionB.action.vi = "Để điện thoại sang một bên 45 phút trước khi ngủ.";
assert.equal(validateGeneratedWellnessPlan({ goals: [mismatchedLocale] }, sleep.profile).semanticRejectedCount, 1, "different EN/VI numbers are rejected");
const unsupportedFluidLimit = structuredClone(cases[1].item);
unsupportedFluidLimit.optionA.action = text("Drink 3 liters of water every day to manage gout.", "Uống 3 lít nước mỗi ngày để kiểm soát gout.");
assert.equal(validateGeneratedWellnessPlan({ goals: [unsupportedFluidLimit] }, cases[1].profile).safetyRejectedCount, 1, "unsupported fluid prescription is rejected");
unsupportedFluidLimit.optionA.action = text("Notice your hydration routine.", "Uống 3 lít nước mỗi ngày để kiểm soát gout.");
assert.equal(validateGeneratedWellnessPlan({ goals: [unsupportedFluidLimit] }, cases[1].profile).safetyRejectedCount, 1, "Vietnamese quantified fluid prescription is also rejected");
const unsupportedWeightTarget = structuredClone(cases[2].item);
unsupportedWeightTarget.optionA.action = text("Restrict yourself to 900 calories each day.", "Giới hạn bản thân ở mức 900 calo mỗi ngày.");
assert.equal(validateGeneratedWellnessPlan({ goals: [unsupportedWeightTarget] }, cases[2].profile).safetyRejectedCount, 1, "unsupported calorie restriction is rejected");
const dangerous = structuredClone(sleep.item);
dangerous.optionA.action = text("Stop prescribed medication and use herbs instead.");
assert.equal(validateGeneratedWellnessPlan({ goals: [dangerous] }, sleep.profile).safetyRejectedCount, 1);
const genericReason = structuredClone(sleep.item);
genericReason.relevanceReason = text("This may be a useful idea.");
assert.equal(validateGeneratedWellnessPlan({ goals: [genericReason] }, sleep.profile).semanticRejectedCount, 1, "reason must itself connect to the selected concern");

process.env.SUPABASE_SECRET_KEY = "local-test-only-signing-secret-32-characters";
const parsedSleep = parseGeminiWellnessPlanResponse(JSON.stringify({ goals: [sleep.item] }), sleep.profile).goals[0];
const signedGoal = { ...parsedSleep, advisorProof: signGeneratedGoal(parsedSleep, sleep.profile) };
const signedVi = toAiPlanGoal(signedGoal, "A", "vi");
assert.equal(verifyGeneratedGoalProof(signedVi, sleep.profile), true, "same confirmed option verifies in EN or VI");
assert.equal(verifyGeneratedGoalProof({ ...signedVi, title: parsedSleep.title.vi }, sleep.profile), true, "historical generic goal title remains verifiable");
assert.equal(verifyGeneratedGoalProof({ ...signedVi, title: "Unrelated client title" }, sleep.profile), false, "unrelated client title is rejected");
assert.deepEqual(verifiedGeneratedGoalFromProof(signedVi, sleep.profile), parsedSleep, "the Plan API can recover the verified bilingual source from the Advisor proof");
assert.equal(verifyGeneratedGoalProof({ ...signedVi, trackingDefinition: "Tampered action" }, sleep.profile), false);
assert.equal(validatePersistedAiGoal(signedVi), true);
const savedBilingual = { ...signedVi, localizedRecommendation: { title: parsedSleep.title, relevanceReason: parsedSleep.relevanceReason, optionA: parsedSleep.optionA, optionB: parsedSleep.optionB } };
const aiCopyVi = localizedPlanGoalCopy(savedBilingual, "vi");
const aiCopyEn = localizedPlanGoalCopy(savedBilingual, "en");
assert.equal(aiCopyVi.title, parsedSleep.title.vi);
assert.equal(aiCopyEn.title, parsedSleep.title.en);
assert.equal(aiCopyVi.relevanceReason, parsedSleep.relevanceReason.vi);
assert.equal(aiCopyEn.relevanceReason, parsedSleep.relevanceReason.en);
assert.equal(aiCopyVi.optionTitle, parsedSleep.optionA.title.vi);
assert.equal(aiCopyEn.optionTitle, parsedSleep.optionA.title.en);
assert.equal(aiCopyVi.trackingDefinition, parsedSleep.optionA.action.vi);
assert.equal(aiCopyEn.trackingDefinition, parsedSleep.optionA.action.en);
const savedB = { ...savedBilingual, generatedOption: { locale: "vi", option: "B", title: parsedSleep.optionB.title.vi }, trackingDefinition: parsedSleep.optionB.action.vi };
assert.equal(localizedPlanGoalCopy(savedB, "en").optionTitle, parsedSleep.optionB.title.en, "Option B retains its own bilingual title");
assert.equal(localizedPlanGoalCopy(savedB, "en").trackingDefinition, parsedSleep.optionB.action.en, "Option B action localizes without changing its choice");
assert.equal(savedB.goalId, savedBilingual.goalId, "locale display keeps the canonical goal ID");
assert.deepEqual(savedB.trackingDefinition.match(/\d+/g), parsedSleep.optionB.action.vi.match(/\d+/g), "localized B action preserves numeric values and units");
const historicalAi = { ...signedVi, localizedRecommendation: undefined };
assert.equal(localizedPlanGoalCopy(historicalAi, "en").title, historicalAi.title, "historical AI rows without source translation retain original text");
const personal = { ...savedBilingual, provenance: "user_created", title: "Mi nota personal en español", originalNote: "Mi nota personal en español" };
assert.equal(localizedPlanGoalCopy(personal, "en").title, personal.title, "user-authored notes are never translated automatically");
const ui = await readFile(new URL("../src/components/healthclues/WellnessPlanBuilder.tsx", import.meta.url), "utf8");
assert.match(ui, /type="checkbox" checked=\{included\}/, "Each AI suggestion keeps a dedicated inclusion checkbox.");
assert.match(ui, /text\("Include goal"\)/, "The checkbox retains its accessible Include goal label.");
assert.match(ui, /onSelectionChange\?: \(goals: WellnessPlanGoal\[\], suggestionIds: string\[\]\) => void/, "The in-inventory Builder supports per-selection persistence without a global confirm.");
assert.match(ui, /liveSelectionCallback\.current\(planGoals, personalizedGoals\.map\(goal => goal\.goalId\)\)/, "Only valid checked/configured choices plus their suggestion identity set are passed to live persistence.");
assert.match(ui, /liveSelectionChanged\.current = true/, "Live persistence is gated on explicit player interaction.");
assert.match(ui, /chooseAiCustom/);
console.log("PASS: synthetic Sleep, Gout and Weight Management; modest numbers accepted; unsupported high-risk quantities rejected; signed bilingual snapshot recovery; EN/VI goal/reason/A/B copy, numeric and ID stability; historical text fallback; user-authored text unchanged; Plan mapping and UI checkbox/Custom compatibility (40+ assertions)");
