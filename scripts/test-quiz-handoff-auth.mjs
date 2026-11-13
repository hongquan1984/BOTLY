import assert from "node:assert/strict";

console.log("--- TEST: Quiz Handoff & Auth Flow Verification ---");

// Test 1: Verify stress keyword detection logic
function detectConcernFocus(effectiveConcernId, note) {
  let detectedFocus = effectiveConcernId;
  if (effectiveConcernId === "other" && note?.trim()) {
    const lowerNote = note.toLowerCase();
    if (/stress|căng thẳng|áp lực|lo âu|lo lắng|mệt mỏi|anxiety/i.test(lowerNote)) detectedFocus = "stress";
    else if (/ngủ|mất ngủ|khó ngủ|thức giấc|insomnia/i.test(lowerNote)) detectedFocus = "sleep";
    else if (/đường huyết|tiểu đường|glucose|glycemic/i.test(lowerNote)) detectedFocus = "health-concern";
    else if (/gút|gout|axit uric|acid uric/i.test(lowerNote)) detectedFocus = "health-concern";
    else if (/tiêu hóa|dạ dày|đại tràng|bụng/i.test(lowerNote)) detectedFocus = "health-concern";
    else if (/cân nặng|giảm cân|béo|thừa cân/i.test(lowerNote)) detectedFocus = "weight";
  }
  return detectedFocus;
}

assert.equal(detectConcernFocus("other", "stress"), "stress");
assert.equal(detectConcernFocus("other", "dạo này tôi hay bị căng thẳng và áp lực công việc"), "stress");
assert.equal(detectConcernFocus("other", "khó ngủ về đêm"), "sleep");
assert.equal(detectConcernFocus("other", "đường huyết cao"), "health-concern");
console.log("✓ Test 1: Smart intent mapping for 'Vấn đề khác' passes!");

// Test 2: Next route matching in auth callback
function isPlayOrGameNext(next) {
  return typeof next === "string" && (next.startsWith("/play") || next.includes("play") || next.includes("wellness/healthclues/world") || next.includes("healthclues"));
}

assert.equal(isPlayOrGameNext("/play"), true);
assert.equal(isPlayOrGameNext("/play?activation=complete"), true);
assert.equal(isPlayOrGameNext("/vi/wellness/healthclues/world"), true);
assert.equal(isPlayOrGameNext("/en/wellness/healthclues/world"), true);
assert.equal(isPlayOrGameNext("/vi/song-khoe/tai-khoan"), false);
console.log("✓ Test 2: Auth callback route recognition for /play and world passes!");

// Test 3: OAuth redirect URL generation
function buildOAuthUrl(supabaseUrl, provider, origin, locale, nextPath) {
  const callback = `${origin}/${locale === "vi" ? "vi/song-khoe" : "en/wellness"}/auth/callback`;
  const redirectTo = `${callback}?next=${encodeURIComponent(nextPath)}`;
  return `${supabaseUrl}/auth/v1/authorize?provider=${provider}&redirect_to=${encodeURIComponent(redirectTo)}`;
}

const oauthUrl = buildOAuthUrl("https://rswmadukvegraxfcdbcb.supabase.co", "google", "https://www.botly.vn", "vi", "/play");
assert.ok(oauthUrl.includes("provider=google"));
assert.ok(oauthUrl.includes("vi%2Fsong-khoe%2Fauth%2Fcallback"));
assert.ok(oauthUrl.includes("play"));
console.log("✓ Test 3: Google OAuth URL generation passes!");

console.log("ALL UNIT TESTS PASSED!");
