import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

const source = readFileSync(new URL("../src/data/healthclues-discoveries.ts", import.meta.url), "utf8")
  .replace(/^import .*;\r?\n/gm, "");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const testModule = { exports: {} };
new Function("module", "exports", "wellnessArticles", "wellnessEbooks", compiled)(testModule, testModule.exports, [], []);
const { matchHealthCluesDiscoveries: match, discoveryTimeLabel, getDiscoveryCandidateSeeds } = testModule.exports;
const candidateSeeds = getDiscoveryCandidateSeeds();

const item = (id, contentType, topicTags, extra = {}) => ({
  id, locale: "en", url: `/en/wellness/guides/${id}`, title: id, summary: "Editorially reviewed resource.",
  topicTags, contentType, estimatedMinutes: 4, ingredients: [], instructions: [], restrictions: [], countryRelevance: [],
  evidence: { summary: "Reviewed source notes", sources: [{ label: "Primary source", url: "https://example.org/source" }] },
  safetyNotes: null, reviewStatus: "reviewed", reviewedBy: "Test reviewer", reviewedAt: new Date().toISOString(), status: "published", ...extra,
});
const profile = (overrides = {}) => ({ topic: "Healthy weight", contentPreferences: ["Food & recipes"], presentation: "Step-by-step recipes", comfortableActivityTime: "5 minutes", refreshFrequency: "Daily", twoWeekGoal: "Explore simple recipes", ...overrides });

const recipe = item("quick-recipe", "recipe", ["healthy-weight"], { estimatedMinutes: 4, ingredients: ["oats", "milk"], instructions: ["Mix ingredients", "Serve"] });
const recipe2 = item("second-quick-recipe", "recipe", ["healthy-weight"], { estimatedMinutes: 5, ingredients: ["rice", "beans"], instructions: ["Combine ingredients", "Serve"] });
const unknownTimeRecipe = item("unknown-time-recipe", "recipe", ["healthy-weight"], { estimatedMinutes: null, ingredients: ["beans"], instructions: ["Cook and serve"] });
const guide = item("weight-guide", "ebook", ["healthy-weight"], { estimatedMinutes: null });
const sourcedReading = item("weight-research", "research", ["healthy-weight"], { estimatedMinutes: 6 });
const activity = item("weight-activity", "activity", ["healthy-weight"], { estimatedMinutes: 3, instructions: ["Take a short pause"] });
assert.equal(discoveryTimeLabel(recipe), "Estimated time: 4 minutes", "known practical duration is labeled as estimated time");
assert.equal(discoveryTimeLabel(unknownTimeRecipe), "Not estimated", "unknown recipe duration is not mislabeled as reading time");
assert.equal(discoveryTimeLabel(guide), "Reading time not stated by the source", "reading resources use the source-time fallback");
assert.equal(discoveryTimeLabel(sourcedReading), "Reading time: 6 minutes", "article reading time is not mislabeled as a practical duration");
assert.equal(match(profile(), [guide, recipe])[0]?.id, "quick-recipe", "short structured recipe ranks before reading material");
assert.equal(match(profile(), [unknownTimeRecipe])[0], undefined, "unknown recipe duration does not satisfy a five-minute limit");
assert.equal(match(profile(), [{ ...recipe, estimatedMinutes: 6 }])[0], undefined, "recipe beyond the selected time limit is excluded");
assert.equal(match(profile(), [{ ...activity, estimatedMinutes: null }])[0], undefined, "unknown activity duration does not satisfy a five-minute limit");
assert.equal(match(profile({ comfortableActivityTime: "10–15 minutes" }), [{ ...recipe, estimatedMinutes: 16 }])[0], undefined, "activity-time band excludes recipes over its upper bound");
assert.equal(match(profile({ excludedIngredients: ["Dairy"] }), [recipe])[0], undefined, "declared food avoidance blocks a matching recipe");
assert.equal(match(profile({ foodSafetyHold: true }), [recipe])[0], undefined, "food safety hold blocks recipes");
assert.equal(match(profile(), [{ ...recipe, status: "draft" }])[0], undefined, "draft content is never returned");
assert.equal(match(profile(), [{ ...recipe, reviewStatus: "needs_review" }])[0], undefined, "unreviewed content is never returned");
assert.equal(match(profile(), [guide])[0]?.contentType, "ebook", "reading material remains an explicitly typed fallback");
assert.equal(match(profile({ contentPreferences: [], presentation: "A mix of everything", twoWeekGoal: "Find interesting new information", specificInterests: ["Simple recipes"] }), [recipe])[0]?.id, recipe.id, "Eat Healthier branch preference can rank recipe content");
assert.equal(match(profile({ topic: "Healthy weight", contentPreferences: [], presentation: "A mix of everything", twoWeekGoal: "Find interesting new information", comfortableActivityTime: "10–15 minutes", specificInterests: ["Breathing and grounding activities"] }), [activity])[0]?.id, activity.id, "Feel Calmer branch preference can rank reviewed activities");
assert.equal(match(profile({ contentPreferences: [], presentation: "A mix of everything", twoWeekGoal: "Find interesting new information", specificInterests: ["Research and evidence"] }), [sourcedReading])[0]?.id, sourcedReading.id, "Natural Wellness branch preference can rank source-linked research");
const goutProfile = profile({ topic: "Gout & uric acid", contentPreferences: ["Everyday habits"], presentation: "Short research summaries", twoWeekGoal: "Understand the research better" });

const goutSeed = candidateSeeds.find(candidate => candidate.id === "external-niams-gout-overview");
const sleepSeed = candidateSeeds.find(candidate => candidate.id === "external-nhlbi-healthy-sleep-habits");
const salmonSeed = candidateSeeds.find(candidate => candidate.id === "external-myplate-salmon-skewers");
for (const candidate of [goutSeed, sleepSeed, salmonSeed]) {
  assert.equal(candidate?.reviewStatus, "needs_review", `${candidate?.id} stays pending human review`);
  assert.equal(candidate?.status, "draft", `${candidate?.id} is not public`);
  assert.ok(candidate?.evidence.sources.length, `${candidate?.id} has a real source link`);
}
assert.equal(match(goutProfile, [goutSeed])[0], undefined, "new gout source is not distributed before review");
assert.equal(match(goutProfile, [{ ...goutSeed, reviewStatus: "reviewed", status: "published" }])[0]?.id, goutSeed.id, "reviewed gout education matches the gout topic");
const sleepResearchProfile = profile({ topic: "Sleep & rest", contentPreferences: ["Research explained"], presentation: "Short research summaries", twoWeekGoal: "Understand the research better" });
assert.equal(match(sleepResearchProfile, [{ ...sleepSeed, reviewStatus: "reviewed", status: "published" }])[0]?.id, sleepSeed.id, "reviewed sleep education matches the sleep topic");
const longRecipeProfile = profile({ comfortableActivityTime: "More than 30 minutes" });
assert.equal(match(longRecipeProfile, [{ ...salmonSeed, reviewStatus: "reviewed", status: "published" }])[0]?.id, salmonSeed.id, "sourced recipe matches a compatible time range after review");
assert.equal(match({ ...longRecipeProfile, excludedIngredients: ["Fish"] }, [{ ...salmonSeed, reviewStatus: "reviewed", status: "published" }])[0], undefined, "sourced fish recipe respects a declared fish avoidance");

const goutResearch = item("gout-research", "research", ["gout-uric-acid"]);
assert.equal(match(goutProfile, [goutResearch])[0]?.id, "gout-research", "gout topic matches educational research without treatment-type inference");

const sleepActivity = item("sleep-activity", "activity", ["sleep-rest"], { estimatedMinutes: 3, instructions: ["Pause and notice your surroundings"] });
const sleepProfile = profile({ topic: "Sleep & rest", contentPreferences: ["Everyday habits"], presentation: "Quick daily cards", comfortableActivityTime: "10â€“15 minutes", specificInterests: ["Relaxation"] });
assert.equal(match(sleepProfile, [sleepActivity])[0]?.id, "sleep-activity", "sleep activity within the time ceiling can match");
assert.equal(match({ ...sleepProfile, activitySafetyHold: true }, [sleepActivity])[0], undefined, "safety hold blocks practical activities");
assert.equal(match(profile({ refreshFrequency: "Weekly" }), [recipe, guide]).length, 1, "refresh preference caps weekly discovery count");
const mixedInterests = { contentPreferences: ["Food & recipes", "Everyday habits"] };
assert.equal(match(profile({ ...mixedInterests, refreshFrequency: "Three times a week" }), [recipe, recipe2, guide, activity]).length, 2, "three-times-weekly preference caps discovery at two cards");
assert.equal(match(profile({ ...mixedInterests, refreshFrequency: "Daily" }), [recipe, recipe2, guide, activity]).length, 3, "daily preference returns up to three matching cards across preferred formats");

console.log("HealthClues discovery and time-label checks passed (37 assertions).");
