import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

const source = readFileSync(new URL("../src/lib/healthclues-analytics-consent.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const consent = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);

let stored = null;
let dispatched = 0;
let cookie = "";
globalThis.window = {
  localStorage: {
    getItem(key) { assert.equal(key, "botly_analytics_consent"); return stored; },
    setItem(key, value) { assert.equal(key, "botly_analytics_consent"); stored = value; },
    removeItem(key) { assert.equal(key, "botly_analytics_consent"); stored = null; },
  },
  location: { protocol: "https:" },
  dispatchEvent(event) { assert.equal(event.type, "botly:analytics-consent"); dispatched++; return true; },
};
globalThis.document = { get cookie() { return cookie; }, set cookie(value) { cookie = value; } };

assert.equal(consent.hasHealthCluesAnalyticsConsent(), false, "no stored choice defaults to denied");
for (const path of [
  "/en/wellness/healthclues/quiz",
  "/en/wellness/healthclues/world",
  "/vi/song-khoe/healthclues/quiz",
  "/en/wellness/ebooks",
  "/en/wellness/ebooks/blood-sugar-pairings",
  "/vi/song-khoe/ebooks/duong-huyet",
]) {
  assert.equal(consent.isHealthCluesAnalyticsPath(path), true, `${path} is a consent-gated HealthClues funnel path`);
  assert.equal(consent.shouldTrackAnalyticsPath(path, false), false, `${path} blocks analytics before opt-in`);
  assert.equal(consent.shouldTrackAnalyticsPath(path, true), true, `${path} allows analytics after opt-in`);
}
assert.equal(consent.isHealthCluesAnalyticsPath("/en/wellness/healthclues-archive"), false, "prefix lookalikes are not gated as HealthClues paths");
assert.equal(consent.shouldTrackAnalyticsPath("/en/wellness/guides/sleep", false), true, "unrelated Botly routes retain existing analytics behavior");
const quizPath = "/en/wellness/healthclues/quiz";
assert.notEqual(consent.analyticsTrackingKey(quizPath, false), consent.analyticsTrackingKey(quizPath, true), "granting consent while staying on the same HealthClues route changes its tracking key");
assert.equal(consent.analyticsTrackingKey("/en/wellness/guides/sleep", false), consent.analyticsTrackingKey("/en/wellness/guides/sleep", true), "HealthClues consent changes do not retrack unrelated pages");

consent.setHealthCluesAnalyticsConsent(true);
assert.equal(consent.hasHealthCluesAnalyticsConsent(), true, "explicit opt-in is persisted");
assert.match(cookie, /^botly_analytics_consent=granted;/, "explicit opt-in mirrors to a server-verifiable same-site cookie");
assert.equal(consent.hasHealthCluesAnalyticsConsentCookie(cookie), true, "server consent parser accepts only the explicit grant cookie");
const safeEvent = consent.sanitizeHealthCluesAnalyticsPayload("quiz_started", "/en/wellness/healthclues/quiz?concern=gout", { entry: "post_download", ebook_id: "gout-support", quest_id: "explore-health-concern", answer: "private", note: "private" });
assert.deepEqual(safeEvent, { eventType: "quiz_started", path: "/en/wellness/healthclues/quiz", metadata: { funnel: "healthclues_ebook_quiz_v1", entry: "post_download" } }, "HealthClues analytics removes query strings and all identifying or health-specific metadata");
assert.equal(consent.sanitizeHealthCluesAnalyticsPayload("quiz_answer_submitted", "/en/wellness/healthclues/quiz", {}), null, "answer-level events are never admitted to the HealthClues analytics stream");
assert.deepEqual(consent.excludeHealthCluesFromGeneralAnalytics([
  { path: "/en/wellness/healthclues/quiz", metadata: { answer: "historic private field" } },
  { path: "/vi/song-khoe/ebooks/duong-huyet" },
  { path: "/en/wellness/guides/sleep" },
  { path: "/en/wellness/healthclues-archive" },
]), [
  { path: "/en/wellness/guides/sleep" },
  { path: "/en/wellness/healthclues-archive" },
], "general Botly analytics excludes historic HealthClues-specific rows without filtering unrelated routes");
consent.setHealthCluesAnalyticsConsent(false);
assert.equal(consent.hasHealthCluesAnalyticsConsent(), false, "revocation disables subsequent HealthClues analytics");
assert.match(cookie, /^botly_analytics_consent=;/, "revocation clears server-verifiable analytics consent");
assert.equal(consent.hasHealthCluesAnalyticsConsentCookie(cookie), false, "revoked consent is denied server-side");
const originalRemoveItem = window.localStorage.removeItem;
consent.setHealthCluesAnalyticsConsent(true);
window.localStorage.removeItem = () => { throw new Error("storage removal unavailable"); };
consent.setHealthCluesAnalyticsConsent(false);
assert.equal(consent.hasHealthCluesAnalyticsConsent(), false, "failed storage removal cannot restore an earlier analytics grant in the current page session");
window.localStorage.removeItem = originalRemoveItem;
const originalSetItem = window.localStorage.setItem;
window.localStorage.setItem = () => { throw new Error("storage write unavailable"); };
consent.setHealthCluesAnalyticsConsent(true);
assert.equal(consent.hasHealthCluesAnalyticsConsent(), false, "failed consent write cannot enable analytics");
window.localStorage.setItem = originalSetItem;
assert.equal(dispatched, 5, "grant and revoke actions notify tracking subscribers even when storage fails");

globalThis.window.localStorage.getItem = () => { throw new Error("storage unavailable"); };
assert.equal(consent.hasHealthCluesAnalyticsConsent(), false, "storage failure fails closed");
assert.equal(consent.shouldTrackAnalyticsPath("/en/wellness/healthclues/quiz", consent.hasHealthCluesAnalyticsConsent()), false, "storage failure never enables HealthClues tracking");

delete globalThis.window;
delete globalThis.document;
assert.equal(consent.hasHealthCluesAnalyticsConsent(), false, "server rendering defaults to denied");
console.log("HealthClues analytics consent tests passed: denied-by-default, quiz/ebook route gating, explicit grant/revocation, route-boundary matching, unrelated route behavior, storage failure and server-side denial.");
