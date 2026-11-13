import assert from "node:assert/strict";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawn } from "node:child_process";
import net from "node:net";
import path from "node:path";
import { parseGeminiWellnessPlanResponse } from "../src/features/healthclues/gemini-wellness-plan.ts";
import { signGeneratedGoal } from "../src/features/healthclues/server/wellness-plan-proof.ts";

const root = process.cwd();
const base = process.env.HEALTHCLUES_OWNER_DEMO_URL || "http://127.0.0.1:3305";
const inbox = "http://127.0.0.1:54324";
const ownerDemoRuntime = JSON.parse(readFileSync(path.join(root, "App", ".tmp", "healthclues-owner-demo", "owner-demo-runtime.json"), "utf8"));
assert.equal(ownerDemoRuntime.projectId, "healthclues-owner-demo");
assert.equal(ownerDemoRuntime.apiUrl, "http://127.0.0.1:54321");
process.env.SUPABASE_SECRET_KEY = ownerDemoRuntime.secretKey;
assert.equal(new URL(base).hostname, "127.0.0.1", "Chromium acceptance is restricted to loopback.");
assert.equal((await (await fetch(`${base}/api/healthclues/wellness-habits`)).json()).availability, "test-only");
const chromePath = [path.join(process.env.PROGRAMFILES || "C:\\Program Files", "Google", "Chrome", "Application", "chrome.exe"), path.join(process.env["PROGRAMFILES(X86)"] || "C:\\Program Files (x86)", "Google", "Chrome", "Application", "chrome.exe")].find(existsSync);
assert.ok(chromePath, "Chromium/Chrome is required.");
const profileDir = path.join(root, "App", ".tmp", `mp17-goal-first-${process.pid}`); mkdirSync(profileDir, { recursive: false });
const screenshots = process.env.HEALTHCLUES_SCREENSHOT_ROOT || path.join(root, "App", "reports", "previews", "mp17-goal-first-fixture"); mkdirSync(screenshots, { recursive: true });
const probe = net.createServer(); const debugPort = await new Promise((resolve, reject) => { probe.once("error", reject); probe.listen(0, "127.0.0.1", () => { const p = probe.address().port; probe.close(() => resolve(p)); }); });
const pending = new Map(); const exceptions = []; const requests = []; const authResponses = []; const verifiedAccounts = []; let supabaseAnonKey = null; let commandId = 0; let ws; let chrome;
let activeAdvisorFixture = false; let signedAdvisorFixture = null; let signedAdvisorProfileDigest = null; let advisorFixtureRequestCount = 0;
function cdp(method, params = {}) { const id = ++commandId; return new Promise((resolve, reject) => { const timer = setTimeout(() => { pending.delete(id); reject(new Error(`CDP timeout ${method}`)); }, 15000); pending.set(id, m => { clearTimeout(timer); if (m.error) reject(new Error(`${method}: ${m.error.message}`)); else resolve(m.result); }); ws.send(JSON.stringify({ id, method, params })); }); }
async function evaluate(expression) { try { const r = await cdp("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true, userGesture: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text); return r.result?.value; } catch (error) { throw new Error(`Runtime.evaluate failed for ${expression.slice(0, 180)}: ${error instanceof Error ? error.message : String(error)}`); } }
async function wait(expression, name) { const end = Date.now() + 20000; while (Date.now() < end) { if (await evaluate(expression)) return; await new Promise(r => setTimeout(r, 150)); } const adaptiveRequests=requests.slice(-4).map(request=>({locale:request.locale,answeredQuestions:request.answeredQuestions?.length,focusId:request.focusId})); throw new Error(`Timeout ${name}: ${String(await evaluate("document.body.innerText")).slice(0, 1200)}; synthetic request summary=${JSON.stringify(adaptiveRequests)}`); }
async function click(expression) { assert.equal(await evaluate(`(()=>{const b=${expression};if(!b||b.disabled)return false;b.click();return true})()`), true, `Unable to click ${expression}`); }
async function type(value) { const encoded = JSON.stringify(value); assert.equal(await evaluate(`(()=>{let e=document.activeElement;if(!(e instanceof HTMLInputElement||e instanceof HTMLTextAreaElement))e=[...document.querySelectorAll('input:not([type=checkbox]):not([type=radio]),textarea')].find(x=>x.getClientRects().length);if(!e)return false;e.focus();const p=e instanceof HTMLTextAreaElement?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(p,'value').set.call(e,${encoded});e.dispatchEvent(new Event('input',{bubbles:true}));return true})()`), true, "A visible text input must be present before typing."); }
async function verificationUrl(email) {
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    const response = await fetch(`${inbox}/api/v1/messages?limit=20`); assert.ok(response.ok, "Local Mailpit is reachable.");
    for (const message of (await response.json()).messages || []) {
      const detailResponse = await fetch(`${inbox}/api/v1/message/${encodeURIComponent(message.ID || message.Id || message.id)}`); if (!detailResponse.ok) continue;
      const detail = await detailResponse.json();
      if (!JSON.stringify(detail.To || detail.to || message.To || message.to || "").toLowerCase().includes(email.toLowerCase())) continue;
      const body = `${detail.HTML || detail.Html || detail.html || ""}\n${detail.Text || detail.text || ""}`.replaceAll("&amp;", "&");
      const match = body.match(/https?:\/\/[^\s"'<>]+\/auth\/v1\/verify\?[^\s"'<>]+/i); if (match) return match[0].replace(/[),.;]+$/, "");
    }
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  throw new Error("No activation link arrived in local Mailpit.");
}
async function shot(name, width, height, mobile = false) { if (!/(?:mp19-world-selection-(?:desktop|mobile)|sleep-quiz-(?:desktop|mobile)|welcome-desktop|adaptive-question-desktop|verified-world-preparation|actual-world-pet-plan-desktop|plan-builder-(?:vi|en)-unselected-desktop|plan-builder-(?:vi|en)-mobile(?:-goals)?|plan-builder-custom-option-desktop|plan-builder-selected-unselected-desktop|custom-goal-my-journey-(?:desktop|mobile)|journey-lower-(?:desktop|mobile)|botanist-npc-greeting-(?:desktop|mobile)|botanist-empty-(?:desktop|mobile))/.test(name)) return null; await cdp("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile }); await new Promise(r => setTimeout(r, 250)); const data = await cdp("Page.captureScreenshot", { format: "png", fromSurface: true }); const file = path.join(screenshots, `${name}.png`); writeFileSync(file, Buffer.from(data.data, "base64")); return path.relative(path.join(root, "App"), file).replaceAll("\\", "/"); }
function question(locale, number) { const vi = locale === "vi"; return { questionId: number === 1 ? "q-habit-baseline" : "q-practical-barrier", prompt: vi ? (number === 1 ? "Thói quen nào thường xuất hiện trong ngày của bạn?" : "Điều gì thường khiến việc thay đổi thói quen trở nên khó khăn?") : (number === 1 ? "Which habit is part of your usual day?" : "What can make a habit change difficult for you?"), choices: (number === 1 ? [vi ? "Nước ngọt" : "Sugary drinks", vi ? "Thịt đỏ" : "Red meat", vi ? "Không điều nào trong số này" : "Neither of these"] : [vi ? "Thiếu thời gian" : "Limited time", vi ? "Khó duy trì đều đặn" : "Hard to keep a routine", vi ? "Tôi chưa rõ" : "I am not sure"]).map((label, i) => ({ id: `a-choice-${number}-${i + 1}`, label })), allowMultiple: number === 1, allowSkip: true }; }
function signedSyntheticAdvisorResponse(request) {
  const profile = request.profile;
  const raw = { goals: [
    { title:{en:"Notice drink choices",vi:"Ghi nhận lựa chọn đồ uống"}, relevanceReason:{en:"You selected Gout and mentioned sugary drinks, so this is a small way to notice your own routine.",vi:"Bạn chọn Gout và nhắc đến nước ngọt; đây là cách nhỏ để quan sát nếp sinh hoạt của mình."}, optionA:{title:{en:"One-day check-in",vi:"Theo dõi một ngày"},action:{en:"For 1 day this week, note your sugary drink choices.",vi:"Trong 1 ngày tuần này, ghi lại lựa chọn nước ngọt của bạn."}}, optionB:{title:{en:"Two-day check-in",vi:"Theo dõi hai ngày"},action:{en:"For 2 days this week, note your sugary drink choices.",vi:"Trong 2 ngày tuần này, ghi lại lựa chọn nước ngọt của bạn."}} },
    { title:{en:"Notice a meal pattern",vi:"Quan sát nếp ăn"}, relevanceReason:{en:"You selected Gout and shared a drink habit; noting meals is an optional observation, not a diet rule.",vi:"Bạn chọn Gout và chia sẻ thói quen đồ uống; ghi chú bữa ăn là quan sát tùy chọn, không phải quy tắc ăn kiêng."}, optionA:{title:{en:"One meal",vi:"Một bữa ăn"},action:{en:"Note 1 meal choice this week, without setting a food limit.",vi:"Ghi lại lựa chọn trong 1 bữa tuần này, không đặt giới hạn thực phẩm."}}, optionB:{title:{en:"Two meals",vi:"Hai bữa ăn"},action:{en:"Note 2 meal choices this week, without setting a food limit.",vi:"Ghi lại lựa chọn trong 2 bữa tuần này, không đặt giới hạn thực phẩm."}} },
    { title:{en:"Choose a routine that fits",vi:"Chọn nếp sinh hoạt phù hợp"}, relevanceReason:{en:"You chose Gout as your focus and can decide whether this optional routine note suits you.",vi:"Bạn chọn Gout làm trọng tâm và có thể tự quyết định ghi chú thói quen tùy chọn này có phù hợp không."}, optionA:{title:{en:"A short note",vi:"Ghi chú ngắn"},action:{en:"Write a brief note about a routine that feels manageable.",vi:"Viết ghi chú ngắn về nếp sinh hoạt bạn thấy vừa sức."}}, optionB:{title:{en:"A fuller note",vi:"Ghi chú cụ thể hơn"},action:{en:"Write a little more about a routine that feels manageable.",vi:"Viết cụ thể hơn một chút về nếp sinh hoạt bạn thấy vừa sức."}} },
    { title:{en:"Plan a reminder",vi:"Lên lời nhắc"}, relevanceReason:{en:"You selected Gout and mentioned a daily drink habit; an optional reminder may help you observe it.",vi:"Bạn chọn Gout và nhắc đến thói quen đồ uống hằng ngày; lời nhắc tùy chọn có thể giúp bạn quan sát thói quen đó."}, optionA:{title:{en:"One reminder",vi:"Một lời nhắc"},action:{en:"Set 1 reminder this week to notice your drink routine.",vi:"Đặt 1 lời nhắc trong tuần này để quan sát thói quen đồ uống."}}, optionB:{title:{en:"Two reminders",vi:"Hai lời nhắc"},action:{en:"Set 2 reminders this week to notice your drink routine.",vi:"Đặt 2 lời nhắc trong tuần này để quan sát thói quen đồ uống."}} },
  ] };
  const cacheKey = JSON.stringify(profile);
  if (signedAdvisorFixture && cacheKey === signedAdvisorProfileDigest) return signedAdvisorFixture;
  const parsed = parseGeminiWellnessPlanResponse(JSON.stringify(raw), profile);
  assert.equal(parsed.goals.length, 4, "Four explicitly synthetic goals pass the current parser and risk-aware validator.");
  const goals = parsed.goals.map(goal => ({ ...goal, advisorProof: signGeneratedGoal(goal, profile) }));
  signedAdvisorProfileDigest = cacheKey;
  signedAdvisorFixture = { status:"SYNTHETIC_TEST", requestId:request.requestId, model:null, suggestions:[], goals, knowledgeCount:0 };
  return signedAdvisorFixture;
}

async function journey(locale, focusLabel, detail, captures, { activateAccount = locale === "vi", tag = locale, persistAdvisorFixture = false } = {}) {
  activeAdvisorFixture = persistAdvisorFixture;
  await evaluate("try{localStorage.clear();sessionStorage.clear()}catch{}");
  await cdp("Page.navigate", { url: `${base}/play` });
  await wait("!!document.querySelector('button[lang=\"en\"]')", "welcome language selector");
  assert.equal(await evaluate("document.documentElement.lang"), "en", "English remains the first-entry default after clearing the synthetic browser profile.");
  if (locale === "vi") await click("document.querySelector('button[lang=\"vi\"]')");
  else await click("document.querySelector('button[lang=\"en\"]')");
  const welcome = await evaluate("document.body.innerText");
  assert.ok(welcome.includes(locale === "vi" ? "Hành trình" : "Wellness Adventure"), `${locale}: Welcome language selected.`);
  captures.push(await shot(`${locale}-welcome-desktop`, 1440, 900));
  await click("[...document.querySelectorAll('button')].find(b=>b.innerText.includes('Start Journey')||b.innerText.includes('Bắt đầu hành trình'))");
  await wait("!!document.querySelector('[data-world-selection]')", `${locale} world-first selection`);
  const worldSelection = await evaluate("document.querySelector('[data-world-selection]').innerText");
  const regionCounts = JSON.parse(await evaluate("JSON.stringify({disabled:document.querySelectorAll('[data-world-selection] button:disabled').length,open:document.querySelectorAll('[data-world-selection] button[aria-pressed]').length})"));
  assert.ok(regionCounts.disabled===6 && regionCounts.open===2 && (worldSelection.includes("Sleep Valley") || worldSelection.includes("Thung lũng Giấc ngủ")), `All eight regions remain visible; only the two playable regions can be selected: ${JSON.stringify({ regionCounts, excerpt: worldSelection.slice(0, 220) })}`);
  captures.push(await shot("mp19-world-selection-desktop", 1440, 900));
  captures.push(await shot("mp19-world-selection-mobile", 390, 844, true));
  await cdp("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await click("document.querySelectorAll('[data-world-selection] button[aria-pressed]')[1]");
  await wait("!!document.querySelector('[data-healthclues-goal-first]')", `${locale} goal discovery`);
  const discovery = await evaluate("document.querySelector('[data-healthclues-goal-first]').innerText");
  assert.ok(discovery.includes(locale === "vi" ? "Bạn đang muốn cải thiện" : "What would you like to improve"), `${locale}: HealthClues Realm asks its concern only after the world choice.`);
  assert.equal(await evaluate("document.querySelectorAll('[data-healthclues-goal-first] button[aria-pressed]').length"), 6, "The six non-sleep focus choices are available inside HealthClues Realm.");
  const iconCount = await evaluate("document.querySelectorAll('[data-healthclues-goal-first] .hc-game-icon').length"); assert.ok(iconCount >= 6, "Localized focus cards render their SVG icons.");
  await click(`document.querySelector('[data-healthclues-goal-first] button[aria-pressed]')`);
  await click(`[...document.querySelectorAll('[data-healthclues-goal-first] button')].find(b=>b.innerText.includes(${JSON.stringify(focusLabel)}))`);
  if (detail) { await click("document.querySelector('[data-healthclues-goal-first] input')"); await type(detail); }
  const ageGatePresent = await evaluate("!!document.querySelector('[data-healthclues-goal-first] input[type=checkbox]')");
  if (ageGatePresent) {
    assert.equal(await evaluate("[...document.querySelectorAll('[data-healthclues-goal-first] button')].find(b=>b.innerText.includes('Start Journey')||b.innerText.includes('Bắt đầu hành trình')).disabled"), true, "The established 13+ age confirmation gates adaptive onboarding.");
    await click("document.querySelector('[data-healthclues-goal-first] input[type=checkbox]')");
  }
  await click("[...document.querySelectorAll('[data-healthclues-goal-first] button')].find(b=>b.innerText.includes('Start Journey')||b.innerText.includes('Bắt đầu hành trình'))");
  await wait("document.querySelector('[data-healthclues-goal-first]')?.getAttribute('data-discovery-source')==='SYNTHETIC_TEST'", "explicit synthetic adaptive prompt");
  const firstQuestion = await evaluate("document.querySelector('[data-healthclues-goal-first]').innerText");
  assert.ok(firstQuestion.includes("SYNTHETIC TEST FIXTURE") && !firstQuestion.includes("Gemini generated"), "Fixture question is disclosed and never labeled as real AI output.");
  assert.ok(firstQuestion.includes(locale === "vi" ? "Thói quen nào" : "Which habit"), `${locale}: first question localized.`);
  captures.push(await shot(`${locale}-adaptive-question-desktop`, 1440, 900));
  await click(`[...document.querySelectorAll('[data-healthclues-goal-first] button[aria-pressed="false"]')].find(b=>b.innerText.trim()===${JSON.stringify(locale === "vi" ? "Nước ngọt" : "Sugary drinks")})`);
  await wait("[...document.querySelectorAll('[data-healthclues-goal-first] button')].some(b=>b.getAttribute('aria-pressed')==='true')&&[...document.querySelectorAll('[data-healthclues-goal-first] button')].some(b=>(b.innerText.includes('Continue')||b.innerText.includes('Tiếp tục'))&&!b.disabled)", "first adaptive answer selected");
  await click("[...document.querySelectorAll('[data-healthclues-goal-first] button')].find(b=>b.innerText.includes('Continue')||b.innerText.includes('Tiếp tục'))");
  await wait("document.querySelector('[data-healthclues-goal-first]')?.innerText.includes('What can make a habit change difficult')||document.querySelector('[data-healthclues-goal-first]')?.innerText.includes('Điều gì thường khiến việc thay đổi')", "second adaptive question");
  if (locale === "vi") {
    await click("[...document.querySelectorAll('button')].find(b=>b.innerText.trim()==='English')");
    await wait("document.querySelector('[data-healthclues-goal-first]')?.innerText.includes('What can make a habit change difficult')", "switch unfinished Quiz to English");
    const preserved = JSON.parse(await evaluate("sessionStorage.getItem('healthclues-goal-first-discovery-v1')||'{}'"));
    assert.equal(preserved.answers.length, 1, "Switching locale keeps the first canonical answer.");
    const answerIds = preserved.answers[0].answerIds;
    await click("[...document.querySelectorAll('button')].find(b=>b.innerText.trim()==='Tiếng Việt')");
    await wait("document.querySelector('[data-healthclues-goal-first]')?.innerText.includes('Điều gì thường khiến việc thay đổi')", "switch unfinished Quiz back to Vietnamese");
    const restored = JSON.parse(await evaluate("sessionStorage.getItem('healthclues-goal-first-discovery-v1')||'{}'"));
    assert.deepEqual(restored.answers[0].answerIds, answerIds, "Canonical answers are unchanged across EN/VI switching.");
  }
  await wait(`[...document.querySelectorAll('[data-healthclues-goal-first] button[aria-pressed="false"]')].some(b=>b.innerText.toLocaleLowerCase().includes(${JSON.stringify(locale === "vi" ? "thời gian" : "limited time")}))`, `${locale.toUpperCase()}: second synthetic answer is rendered`);
  await click(`[...document.querySelectorAll('[data-healthclues-goal-first] button[aria-pressed="false"]')].find(b=>b.innerText.toLocaleLowerCase().includes(${JSON.stringify(locale === "vi" ? "thời gian" : "limited time")}))`);
  await wait("[...document.querySelectorAll('[data-healthclues-goal-first] button')].some(b=>b.getAttribute('aria-pressed')==='true')&&[...document.querySelectorAll('[data-healthclues-goal-first] button')].some(b=>(b.innerText.includes('Continue')||b.innerText.includes('Tiếp tục'))&&!b.disabled)", "localized question answer selected and request settled");
  await click("[...document.querySelectorAll('[data-healthclues-goal-first] button')].find(b=>b.innerText.includes('Continue')||b.innerText.includes('Tiếp tục'))");
  await wait("document.querySelector('[data-healthclues-goal-first]')?.innerText.toLowerCase().includes('discovery profile is ready')||document.querySelector('[data-healthclues-goal-first]')?.innerText.toLowerCase().includes('hồ sơ khám phá đã sẵn sàng')", "adaptive completion");
  const result = await evaluate(`JSON.stringify({requestCount:${"0"},answers:JSON.parse(sessionStorage.getItem('healthclues-goal-first-discovery-v1')||'{}').answers})`);
  assert.equal(JSON.parse(result).answers.length, 2, "Two structured answers remain before account activation.");
  await click("[...document.querySelectorAll('[data-healthclues-goal-first] button')].find(b=>b.innerText.includes('Continue')||b.innerText.includes('Tiếp tục'))");
  await wait("!!document.querySelector('[data-hc-world-preview]')", "actual activation preview after discovery");
  const preview = await evaluate("document.querySelector('[data-hc-world-preview]').innerText");
  const previewLower = preview.toLowerCase();
  assert.ok(previewLower.includes("start your journey") || previewLower.includes("bắt đầu hành trình"), `${locale}: player can continue to the established activation flow.`);
  captures.push(await shot(`${locale}-activation-preview-desktop`, 1440, 900));
  captures.push(await shot(`${locale}-activation-preview-mobile`, 390, 844, true));
  if (activateAccount) {
    await cdp("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
    await click("[...document.querySelectorAll('button')].find(b=>/start your journey|bắt đầu hành trình/i.test(b.innerText))");
    await wait("!!document.querySelector('#hc-activation-email')", "new-account activation form");
    const email = `mp17-${tag}-${process.pid}@example.com`;
    await click("document.querySelector('#hc-activation-email')"); await type(email);
    await click("document.querySelector('[role=dialog] input[type=checkbox]')");
    const formState = JSON.parse(await evaluate("JSON.stringify({email:document.querySelector('#hc-activation-email')?.value,consent:document.querySelector('[role=dialog] input[type=checkbox]')?.checked,disabled:document.querySelector('[role=dialog] button[type=submit]')?.disabled})"));
    assert.equal(formState.email, email, "Synthetic activation email is entered."); assert.equal(formState.consent, true, "Account-scoped profile consent is selected."); assert.equal(formState.disabled, false, "Activation is enabled only after valid email and consent.");
    await evaluate("(()=>{const old=window.fetch;window.__mp17Pending=[];window.fetch=async(...args)=>{const response=await old(...args);if(String(args[0]).includes('pending-journey'))window.__mp17Pending.push({status:response.status,body:await response.clone().text()});return response}})()");
    await click("document.querySelector('[role=dialog] button[type=submit]')");
    await wait("!!document.querySelector('[role=dialog] [role=status]')||!!document.querySelector('[role=dialog] [role=alert]')||document.querySelector('[role=dialog] button[type=submit]')?.innerText.includes('Sending')", "activation request progress");
    const pendingDiagnostics = await evaluate("JSON.stringify(window.__mp17Pending||[])");
    await wait("!!document.querySelector('[role=dialog] [role=status]')||!!document.querySelector('[role=dialog] [role=alert]')", "activation request result");
    const activationStatus = await evaluate("JSON.stringify({status:document.querySelector('[role=dialog] [role=status]')?.innerText||null,error:document.querySelector('[role=dialog] [role=alert]')?.innerText||null})");
    if (JSON.parse(activationStatus).error) throw new Error(`Activation failed: ${activationStatus}; pending=${pendingDiagnostics}; responses=${JSON.stringify(authResponses)}`);
    const url = await verificationUrl(email);
    assert.equal(new URL(url).hostname, "127.0.0.1", "Activation remains on isolated local Supabase.");
    await cdp("Page.navigate", { url });
    await wait("!!document.querySelector('[data-region-map]')&&!!document.querySelector('[data-my-wellness-plan]')", "verified account resumes the same regional World and opens its first Plan");
    const identity = JSON.parse(await evaluate("JSON.stringify({confirmed:!!JSON.parse(localStorage.getItem('botly-cloud-session')||'{}').user?.email_confirmed_at||!!JSON.parse(localStorage.getItem('botly-cloud-session')||'{}').user?.confirmed_at,email:JSON.parse(localStorage.getItem('botly-cloud-session')||'{}').user?.email,userId:JSON.parse(localStorage.getItem('botly-cloud-session')||'{}').user?.id,accessToken:JSON.parse(localStorage.getItem('botly-cloud-session')||'{}').access_token})"));
    assert.equal(identity.confirmed, true, "Magic-link callback confirms the local synthetic account.");
    assert.equal(identity.email, email, "World entry belongs to the synthetic account just activated.");
    assert.ok(identity.userId && identity.accessToken, "A real local authenticated session exists for owner-scoped API checks.");
    captures.push(await shot(`${tag}-verified-world-preparation`, 1440, 900));
    await wait("document.body.innerText.includes('MY WELLNESS WORLD')", "authenticated RPG World shell");
    assert.equal(await evaluate("!!document.querySelector('#hc-player-nickname')"), false, "Optional nickname does not block the first personalized Plan.");
    const expectedRegion = focusLabel.includes("Sleep") || focusLabel.includes("Giấc ngủ") ? "Sleep Valley" : "HealthClues Realm";
    const expectedPet = expectedRegion === "Sleep Valley" ? "Luna" : "Lumi";
    await wait(`document.body.innerText.includes(${JSON.stringify(expectedRegion)})&&document.body.innerText.includes(${JSON.stringify(expectedPet)})`, `${expectedRegion} and ${expectedPet} match the selected focus`);
    await wait("!!document.querySelector('[data-my-wellness-plan]')", "Pet-led Plan opens inside the actual World");
    let persistedFixtureIds = [];
    const personalGoal = persistAdvisorFixture ? "My test choice: note 1 drink pattern weekly" : locale === "vi" ? "Tôi muốn đọc một trang sách trước khi ngủ" : "I want to read one page before bed";
    if (persistAdvisorFixture) {
      await wait("document.querySelector('[data-advisor-status]')?.dataset.advisorStatus==='SYNTHETIC_TEST'&&document.querySelectorAll('[data-ai-goal]').length===4", "explicit four-goal synthetic Advisor fixture");
      assert.equal(await evaluate("document.querySelector('[data-healthclues-plan-builder]')?.innerText.includes('Synthetic test fixture only')"), true, "Fixture is visibly labeled synthetic, not live Gemini.");
      persistedFixtureIds = signedAdvisorFixture.goals.map(goal => goal.goalId);
      captures.push(await shot(`${tag}-synthetic-recommendations-desktop`, 1440, 900));
      captures.push(await shot(`${tag}-plan-builder-${locale}-unselected-desktop`, 1440, 900));
      captures.push(await shot(`${tag}-plan-builder-${locale}-mobile`, 390, 844, true));
      await evaluate("(()=>{const body=document.querySelector('.hc-game-modal-body'),goal=document.querySelector('[data-ai-goal]');if(body&&goal)body.scrollTop=Math.max(0,goal.getBoundingClientRect().top-body.getBoundingClientRect().top+body.scrollTop-20)})()");
      captures.push(await shot(`${tag}-plan-builder-${locale}-mobile-goals`, 390, 844, true));
      await evaluate("(()=>{const body=document.querySelector('.hc-game-modal-body');if(body)body.scrollTop=0})()");
      await cdp("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
      await click("document.querySelectorAll('[data-ai-goal]')[0].querySelector('input[type=checkbox]')");
      await click("[...document.querySelectorAll('[data-ai-goal]')[0].querySelectorAll('input[type=radio]')][0]");
      await click("[...document.querySelectorAll('[data-ai-goal]')[1].querySelectorAll('input[type=radio]')][1]");
      await click("document.querySelectorAll('[data-ai-goal]')[1].querySelector('input[type=checkbox]')");
      await click("[...document.querySelectorAll('[data-ai-goal]')[2].querySelectorAll('input[type=radio]')][2]");
      await click("document.querySelectorAll('[data-ai-goal]')[2].querySelector('input[maxlength=\"180\"]')");
      await type(personalGoal);
      captures.push(await shot(`${tag}-plan-builder-custom-option-desktop`, 1440, 900));
      await click("document.querySelectorAll('[data-ai-goal]')[2].querySelector('button')");
      await click("document.querySelectorAll('[data-ai-goal]')[2].querySelector('input[type=checkbox]')");
      assert.equal(await evaluate("document.querySelectorAll('[data-ai-goal]')[3].querySelector('input[type=checkbox]').checked"), false, "Goal four remains unchecked.");
      assert.ok((await evaluate("document.querySelector('[data-selected-goal-count]').innerText")).includes("3/4"), "Exactly three of four goals are included.");
      captures.push(await shot(`${tag}-plan-builder-selected-unselected-desktop`, 1440, 900));
      await click("document.querySelectorAll('[data-healthclues-plan-builder] button')[document.querySelectorAll('[data-healthclues-plan-builder] button').length-1]");
      await wait("!!document.querySelector('[data-healthclues-plan-builder] #hc-plan-title')", "selected-plan review screen");
      captures.push(await shot(`${tag}-selected-plan-review-desktop`, 1440, 900));
      await click("document.querySelectorAll('[data-healthclues-plan-builder] button')[document.querySelectorAll('[data-healthclues-plan-builder] button').length-1]");
      await wait("!document.querySelector('[data-healthclues-plan-builder]')&&document.querySelectorAll('[data-my-wellness-plan] .hc-plan-goal').length===3", "confirmed Plan API response");
    } else {
      await wait("!!document.querySelector('[data-my-wellness-plan] [data-advisor-status=\"AI_UNAVAILABLE\"]')", "truthful Advisor unavailable state; no Gemini call");
      captures.push(await shot(`${tag}-actual-world-pet-plan-desktop`, 1440, 900));
      await click("[...document.querySelectorAll('[data-healthclues-plan-builder] button')].find(b=>b.innerText.includes('Skip suggestions & continue'))");
      await wait("!document.querySelector('[data-healthclues-plan-builder]')&&!!document.querySelector('[data-my-wellness-plan]')", "player can skip recommendations without saving them");
      await click("[...document.querySelectorAll('[data-my-wellness-plan] button')].find(b=>b.innerText.includes('Review my Quiz suggestions'))");
      await wait("!!document.querySelector('[data-healthclues-plan-builder] [data-advisor-status=\"AI_UNAVAILABLE\"]')", "zero-selection flow can reopen without model inference");
      await click("[...document.querySelectorAll('[data-healthclues-plan-builder] button')].find(b=>b.innerText.includes('Continue My Journey'))");
      await wait("!!document.querySelector('[data-healthclues-plan-builder] #hc-plan-title')", "zero-goal confirmation summary");
      captures.push(await shot(`${tag}-zero-goal-plan-confirm-desktop`, 1440, 900));
      await click("[...document.querySelectorAll('[data-healthclues-plan-builder] button')].find(b=>b.innerText.includes('Confirm My Plan'))");
      await wait("document.querySelector('[data-my-wellness-plan]')?.innerText.includes('No confirmed goals')", "confirmed empty-plan state");
    }    const saved = JSON.parse(await evaluate("(async()=>{const s=JSON.parse(localStorage.getItem('botly-cloud-session'));const w=await fetch('/api/healthclues/world',{headers:{Authorization:'Bearer '+s.access_token},cache:'no-store'}).then(r=>r.json());const p=await fetch('/api/healthclues/plan?worldId='+encodeURIComponent(w.world.id),{headers:{Authorization:'Bearer '+s.access_token},cache:'no-store'}).then(r=>r.json());return JSON.stringify({worldId:w.world.id,plan:p.plan,confirmed:!!s.user.email_confirmed_at||!!s.user.confirmed_at})})()"));
    assert.equal(saved.confirmed, true, "Confirmed session persists while reading the World Plan.");
    assert.ok(saved.worldId, "Plan read is bound to the created World.");
    let savedCustom;
    if (persistAdvisorFixture) {
      assert.equal(saved.plan.goals.length, 3, "Exactly the selected A/B/Custom goals were persisted.");
      assert.ok(saved.plan.goals.every(goal => goal.choice === "active"), "All three selected goals are Active.");
      assert.deepEqual(saved.plan.goals.slice(0,2).map(goal => [goal.goalId, goal.generatedOption?.option]), [[persistedFixtureIds[0],"A"],[persistedFixtureIds[1],"B"]], "The first selected goal retains A and the second retains B with canonical IDs.");
      const selectedIds = saved.plan.goals.map(goal=>goal.goalId);
      assert.equal(new Set(selectedIds).size, 3, "No duplicate goals are persisted.");
      assert.equal(selectedIds.includes(persistedFixtureIds[3]), false, "Unchecked goal four is absent from persistence.");
      assert.deepEqual(saved.plan.goals[0].trackingDefinition.match(/\d+/g), ["1"], "Option A keeps its numeric choice.");
      assert.deepEqual(saved.plan.goals[1].trackingDefinition.match(/\d+/g), ["2"], "Option B keeps its numeric choice.");
      assert.equal(saved.plan.goals[2].title, personalGoal, "User-authored Custom title remains byte-for-byte unchanged.");
      assert.equal(saved.plan.goals[2].originalNote, personalGoal, "User-authored Custom note remains unchanged.");
      assert.ok(saved.plan.goals.slice(0,2).every(goal=>goal.evidenceStatus.includes("SYNTHETIC TEST ONLY")), "Persisted fixture recommendations retain explicit TEST ONLY provenance.");
      assert.ok(saved.worldId, "Plan API returned the authenticated World ID.");
      savedCustom = saved;
    } else {
      assert.ok(saved.plan === null || Array.isArray(saved.plan.goals) && saved.plan.goals.length === 0, "Zero selected goals create no fake active goals.");
      await click("document.querySelector('#hc-world-plan-note')");
      await type(personalGoal);
      await click("document.querySelector('#hc-world-plan-note')?.closest('form')?.querySelector('button[type=submit]')");
      await wait(`document.querySelector('[data-my-wellness-plan]')?.innerText.includes(${JSON.stringify(personalGoal)}) && document.querySelector('[data-my-wellness-plan]')?.innerText.includes('Plan version 2')`, "player-authored goal is saved through the existing authenticated Plan API");
      savedCustom = JSON.parse(await evaluate("(async()=>{const s=JSON.parse(localStorage.getItem('botly-cloud-session'));const w=await fetch('/api/healthclues/world',{headers:{Authorization:'Bearer '+s.access_token},cache:'no-store'}).then(r=>r.json());const p=await fetch('/api/healthclues/plan?worldId='+encodeURIComponent(w.world.id),{headers:{Authorization:'Bearer '+s.access_token},cache:'no-store'}).then(r=>r.json());return JSON.stringify({worldId:w.world.id,plan:p.plan})})()"));
      assert.equal(savedCustom.worldId, saved.worldId, "Personal goal uses the same authenticated World.");
      assert.equal(savedCustom.plan?.version, 2, "Personal goal creates a new confirmed Plan revision.");
      assert.equal(savedCustom.plan?.goals.length, 1, "Only the explicitly authored goal is persisted after the empty Plan.");
      assert.equal(savedCustom.plan.goals[0].title, personalGoal, "Personal goal text is stored without translation or rewriting.");
      assert.equal(savedCustom.plan.goals[0].choice, "saved", "An unconfigured personal goal remains inactive/saved for later.");
      assert.equal(savedCustom.plan.goals[0].provenance, "user_created", "The goal retains user-created provenance.");
    }
    captures.push(await shot(`${tag}-confirmed-plan-desktop`, 1440, 900));    await click("document.querySelector('[data-my-journey-button]')");
    await wait("!!document.querySelector('[data-my-journey-panel]')", "persistent My Journey opens from the actual World sidebar");
    const inventory = JSON.parse(await evaluate("JSON.stringify({sections:[...document.querySelectorAll('[data-my-journey-panel] [data-inventory-section]')].map(e=>e.getAttribute('data-inventory-section')),text:document.querySelector('[data-my-journey-panel]')?.innerText})"));
    assert.deepEqual(inventory.sections, ["checklist", "herbs", "practices"], "The three My Journey inventories remain expanded together.");
    assert.ok(inventory.text.includes(personalGoal), "My Journey displays the exact persisted user-authored goal.");
    let journeyRows = [];
    if (persistAdvisorFixture) {
      journeyRows = JSON.parse(await evaluate("JSON.stringify([...document.querySelectorAll('[data-journey-goal]')].map(e=>e.getAttribute('data-journey-goal')))"));
      assert.deepEqual(journeyRows, savedCustom.plan.goals.map(goal=>goal.goalId), "My Journey shows exactly the three selected Plan IDs.");
      assert.equal(journeyRows.length, 3, "My Journey renders all three selected goals.");
      assert.ok(savedCustom.plan.goals.slice(0,2).every(goal => goal.evidenceStatus.includes("SYNTHETIC TEST ONLY")), "The Plan API retains explicit synthetic-only provenance on the two fixture recommendations.");
      const snapshot = plan => plan.goals.map(goal=>({ id:goal.goalId, choice:goal.choice, level:goal.generatedOption?.option||null, numbers:goal.trackingDefinition.match(/\d+(?:[.,]\d+)?/g)||[], originalNote:goal.originalNote||null }));
      const expectedSnapshot = snapshot(savedCustom.plan);
      for (const targetLocale of (tag === "account-a-vi" ? ["en", "vi"] : [])) {
        await click(targetLocale === "en" ? "[...document.querySelectorAll('button')].find(button=>button.innerText.trim()==='English')" : "document.querySelector('button[lang=vi]')");
        await wait(`document.documentElement.lang==='${targetLocale}'&&location.pathname.startsWith('/${targetLocale}/wellness/healthclues/world')&& (!!document.querySelector('[data-region-map]')||!!document.querySelector('[data-world-canvas=immersive]'))`, `switch account locale to ${targetLocale.toUpperCase()}`);
        await new Promise(resolve=>setTimeout(resolve,500));
        if (!await evaluate("!!document.querySelector('[data-region-map]')")) {
          await click(`document.querySelector('[aria-label="World regions"] button:not(:disabled)[aria-pressed="true"]')||[...document.querySelectorAll('[aria-label="World regions"] button')].find(button=>button.innerText.includes(${JSON.stringify(expectedRegion)}))`);
          await wait("!!document.querySelector('.hc-region-choice[role=dialog]')", `${targetLocale.toUpperCase()}: select the same playable region`);
          await click("[...document.querySelectorAll('.hc-region-choice button')].find(button=>button.innerText.includes('ENTER'))");
          await wait("!!document.querySelector('[data-region-map]')", `${targetLocale.toUpperCase()}: reopen the same World region`);
        }
        if (await evaluate("!!document.querySelector('[data-world-entry-tutorial]')")) {
          await click("[...document.querySelectorAll('[data-world-entry-tutorial] button')].find(button=>/skip tour|bỏ qua hướng dẫn/i.test(button.innerText))");
          await wait("!document.querySelector('[data-world-entry-tutorial]')", `${targetLocale.toUpperCase()} locale guide dismissed before opening My Journey`);
        }
        if (!await evaluate("!!document.querySelector('[data-my-journey-panel]')")) {
          await click("document.querySelector('[data-my-journey-button]')");
          await wait("!!document.querySelector('[data-my-journey-panel]')", `${targetLocale.toUpperCase()} My Journey after locale switch`);
        }
        const localizedPlanResponse = await fetch(`${base}/api/healthclues/plan?worldId=${encodeURIComponent(savedCustom.worldId)}`, { headers:{Authorization:`Bearer ${identity.accessToken}`}, cache:"no-store" });
        assert.equal(localizedPlanResponse.status, 200, `${targetLocale.toUpperCase()}: account still reads its own Plan after locale switch.`);
        const localizedPlan = (await localizedPlanResponse.json()).plan;
        assert.deepEqual(snapshot(localizedPlan), expectedSnapshot, `${targetLocale.toUpperCase()}: IDs, active states, A/B levels, numeric choices and custom text remain identical.`);
        captures.push(await shot(`${tag}-post-locale-switch-${targetLocale}`, 1440, 900));
      }
    } else assert.ok(/Saved for later|Để dành xem sau/i.test(inventory.text), "My Journey does not misrepresent the unconfigured personal goal as active.");
    captures.push(await shot(`${tag}-custom-goal-my-journey-desktop`, 1440, 900));
    await evaluate("(()=>{const e=document.querySelector('.hc-game-modal-journey .hc-game-modal-body');if(e)e.scrollTop=e.scrollHeight})()");
    captures.push(await shot(`${tag}-journey-lower-desktop`, 1440, 900));
    await evaluate("(()=>{const e=document.querySelector('.hc-game-modal-journey .hc-game-modal-body');if(e)e.scrollTop=0})()");
    await cdp("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    captures.push(await shot(`${tag}-custom-goal-my-journey-mobile`, 390, 844, true));
    await evaluate("(()=>{const e=document.querySelector('.hc-game-modal-journey .hc-game-modal-body');if(e)e.scrollTop=e.scrollHeight})()");
    captures.push(await shot(`${tag}-journey-lower-mobile`, 390, 844, true));
    await cdp("Page.reload", { ignoreCache: true });
    await wait("!!document.querySelector('[data-world-entry-tutorial]')||!!document.querySelector('[data-my-journey-button]')||!!document.querySelector('[data-world-canvas=immersive]')", "World and authenticated session survive browser reload");
    if (await evaluate("!!document.querySelector('[data-world-canvas=immersive]')")) {
      const regionName = expectedRegion;
      await click(`document.querySelector('[aria-label="World regions"] button:not(:disabled)[aria-pressed="true"]')||[...document.querySelectorAll('[aria-label="World regions"] button')].find(button=>button.innerText.includes(${JSON.stringify(regionName)}))`);
      await wait("!!document.querySelector('.hc-region-choice[role=dialog]')", "re-enter the same playable region after reload");
      await click("[...document.querySelectorAll('.hc-region-choice button')].find(button=>button.innerText.includes('ENTER'))");
      await wait("!!document.querySelector('[data-my-journey-button]')||!!document.querySelector('[data-world-entry-tutorial]')", "same region opens after reload");
    }
    if (await evaluate("!!document.querySelector('[data-world-entry-tutorial]')")) {
      await click("[...document.querySelectorAll('[data-world-entry-tutorial] button')].find(button=>/skip tour|bỏ qua hướng dẫn/i.test(button.innerText))");
      await wait("!document.querySelector('[data-world-entry-tutorial]')", "skip replayable guide before checking persisted goals");
    }
    await click("document.querySelector('[data-my-journey-button]')");
    await wait("!!document.querySelector('[data-my-journey-panel]')", "My Journey reload persistence");
    const reloadedSections = await evaluate("JSON.stringify([...document.querySelectorAll('[data-my-journey-panel] [data-inventory-section]')].map(e=>e.getAttribute('data-inventory-section')))" );
    assert.deepEqual(JSON.parse(reloadedSections), ["checklist", "herbs", "practices"], "All three sections remain available after reload.");
    assert.equal(await evaluate(`document.querySelector('[data-my-journey-panel]')?.innerText.includes(${JSON.stringify(personalGoal)})`), true, "The exact personal goal survives reload in My Journey.");
    if (persistAdvisorFixture) assert.deepEqual(JSON.parse(await evaluate("JSON.stringify([...document.querySelectorAll('[data-journey-goal]')].map(e=>e.getAttribute('data-journey-goal')))")), savedCustom.plan.goals.map(goal=>goal.goalId), "Reload preserves exactly the selected IDs without duplicates or unchecked goals.");
    if (tag === "account-a-vi" || tag === "account-b-en-gout") {
      await click("document.querySelector('.hc-game-modal-journey .hc-game-modal-header button')");
      await wait("!document.querySelector('[data-my-journey-panel]')", `${tag}: close My Journey before Botanist interaction`);
      await evaluate("document.querySelector('[data-npc=botanist]')?.click();true");
      await wait("!!document.querySelector('[data-interact-landmark=nutrition]')", `${tag}: arrive at Botanist after walking`);
      await cdp("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
      captures.push(await shot(`${tag}-botanist-npc-greeting-desktop`, 1440, 900));
      if (tag === "account-b-en-gout") {
        await cdp("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
        captures.push(await shot("botanist-npc-greeting-mobile", 390, 844, true));
      }
      await click("document.querySelector('.hc-rpg-talk button')");
      await wait("!!document.querySelector('[data-game-panel=nutrition]')", `${tag}: NPC Talk opens Botanist station`);
      await wait("!!document.querySelector('[data-botanist-empty]')||document.querySelectorAll('[data-botanist-item]').length>0", `${tag}: botanical eligibility resolves to reviewed cards or the honest empty state`);
      const botanistContent = JSON.parse(await evaluate("JSON.stringify({empty:!!document.querySelector('[data-botanist-empty]'),items:[...document.querySelectorAll('[data-botanist-item]')].map(item=>({text:item.innerText,testOnly:/TEST ONLY|NOT HUMAN-REVIEWED/i.test(item.innerText)}))})"));
      assert.ok(botanistContent.empty || botanistContent.items.length > 0 && botanistContent.items.every(item=>!item.testOnly), `${tag}: only non-demo botanical content may appear; test-only rows stay hidden.`);
      await cdp("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
      captures.push(await shot(`${tag}-botanist-empty-desktop`, 1440, 900));
      if (tag === "account-b-en-gout") {
        await cdp("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
        captures.push(await shot("botanist-empty-mobile", 390, 844, true));
      }
    }
    verifiedAccounts.push({ tag, locale, email, userId: identity.userId, accessToken: identity.accessToken, worldId: savedCustom.worldId, goalTitle: personalGoal, persistedGoalTitles: savedCustom.plan.goals.map(goal=>goal.title), persistedGoalIds: savedCustom.plan.goals.map(goal=>goal.goalId), persistedLevels: savedCustom.plan.goals.map(goal=>goal.generatedOption?.option||null), region: expectedRegion, pet: expectedPet });
  }
}

try {
  chrome = spawn(chromePath, ["--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", "--disable-background-networking", "--no-proxy-server", "--no-sandbox", `--remote-debugging-port=${debugPort}`, "--remote-allow-origins=*", `--user-data-dir=${profileDir}`, "about:blank"], { stdio: "ignore", windowsHide: true });
  let target; for (let i = 0; i < 80; i++) { try { target = await (await fetch(`http://127.0.0.1:${debugPort}/json/new?about:blank`, { method: "PUT" })).json(); if (target.webSocketDebuggerUrl) break; } catch {} await new Promise(r => setTimeout(r, 150)); }
  assert.ok(target?.webSocketDebuggerUrl); ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.addEventListener("open", resolve, { once: true }); ws.addEventListener("error", reject, { once: true }); });
  ws.addEventListener("message", event => { const message = JSON.parse(event.data); if (message.method === "Runtime.exceptionThrown") exceptions.push(message.params.exceptionDetails.text); if (message.method === "Network.requestWillBeSent" && message.params.request.url.includes("/auth/v1/otp")) { const headers = message.params.request.headers || {}; supabaseAnonKey = headers.apikey || headers.Apikey || supabaseAnonKey; } if (message.method === "Network.responseReceived") { const url = message.params.response.url; if (url.includes("pending-journey") || url.includes("/auth/v1/otp")) authResponses.push({ path: new URL(url).pathname, status: message.params.response.status }); } if (message.method === "Fetch.requestPaused") { const paused = message.params; if (paused.request.url.includes("/api/healthclues/adaptive-discovery")) { requests.push(JSON.parse(paused.request.postData || "{}")); const answers = requests.at(-1).answeredQuestions || []; const locale = requests.at(-1).locale; const n = answers.length + 1; const body = { status: "SYNTHETIC_TEST", locale, done: false, question: question(locale, n) }; if (answers.length >= 2) { body.done = true; body.question = null; } void cdp("Fetch.fulfillRequest", { requestId: paused.requestId, responseCode: 200, responseHeaders: [{ name: "Content-Type", value: "application/json" }, { name: "Cache-Control", value: "no-store" }], body: Buffer.from(JSON.stringify(body)).toString("base64") }); } else if (paused.request.url.includes("/api/healthclues/wellness-advisor")) {
  advisorFixtureRequestCount++;
  if (activeAdvisorFixture) {
    const requestBody = JSON.parse(paused.request.postData || "{}");
    const responseBody = signedSyntheticAdvisorResponse(requestBody);
    void cdp("Fetch.fulfillRequest", { requestId: paused.requestId, responseCode: 200, responseHeaders: [{ name:"Content-Type", value:"application/json" }, { name:"Cache-Control", value:"no-store" }, { name:"X-Request-Id", value:requestBody.requestId }], body:Buffer.from(JSON.stringify(responseBody)).toString("base64") });
  } else void cdp("Fetch.fulfillRequest", { requestId:paused.requestId, responseCode:503, responseHeaders:[{name:"Content-Type",value:"application/json"},{name:"Cache-Control",value:"no-store"}], body:Buffer.from(JSON.stringify({status:"AI_UNAVAILABLE",error:"Billing unavailable; no generated checklist is being shown."})).toString("base64") });
} else void cdp("Fetch.continueRequest", { requestId: paused.requestId }); } if (message.id && pending.has(message.id)) { const done = pending.get(message.id); pending.delete(message.id); done(message); } });
  await cdp("Page.enable"); await cdp("Runtime.enable"); await cdp("Network.enable"); await cdp("Fetch.enable", { patterns: [{ urlPattern: "*://*/api/healthclues/adaptive-discovery*", requestStage: "Request" }, { urlPattern: "*://*/api/healthclues/wellness-advisor*", requestStage: "Request" }] });
  const sleepCaptures = [];
  await evaluate("try{localStorage.clear();sessionStorage.clear()}catch{}");
  await cdp("Page.navigate", { url: `${base}/play` });
  await wait("!!document.querySelector('button[lang=\"en\"]')", "Sleep scenario Welcome");
  await click("[...document.querySelectorAll('button')].find(b=>b.innerText.includes('Start Journey'))");
  await wait("!!document.querySelector('[data-world-selection]')", "Sleep scenario chooses a world before questions");
  await click("document.querySelectorAll('[data-world-selection] button[aria-pressed]')[0]");
  await wait("!!document.querySelector('[data-healthclues-goal-first]')", "Sleep-focused adaptive Quiz");
  const sleepIntro = await evaluate("document.querySelector('[data-healthclues-goal-first]').innerText");
  assert.ok(sleepIntro.includes("What affects your sleep most?") && !sleepIntro.includes("What would you like to improve"), "Sleep Valley asks sleep context without repeating a general concern selection.");
  await click("document.querySelector('[data-healthclues-goal-first] input[type=checkbox]')");
  await click("[...document.querySelectorAll('[data-healthclues-goal-first] button')].find(b=>b.innerText.includes('Start Journey'))");
  await wait("document.querySelector('[data-healthclues-goal-first]')?.dataset.discoverySource==='SYNTHETIC_TEST'", "Sleep synthetic prompt is intercepted before any provider request");
  const sleepRequest = requests.at(-1);
  assert.equal(sleepRequest.focusId, "sleep", "The selected Sleep Valley is retained as the adaptive focus.");
  assert.equal(await evaluate("sessionStorage.getItem('healthclues-selected-quest')"), "sleep-better", "The selected Sleep Valley remains in session state through Quiz start.");
  sleepCaptures.push(await shot("sleep-quiz-desktop", 1440, 900));
  sleepCaptures.push(await shot("sleep-quiz-mobile", 390, 844, true));
  await cdp("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await click("document.querySelector('[data-healthclues-goal-first] button[aria-pressed=\"false\"]')");
  await click("[...document.querySelectorAll('[data-healthclues-goal-first] button')].find(b=>b.innerText.includes('Continue'))");
  await wait("document.querySelector('[data-healthclues-goal-first]')?.innerText.includes('What can make a habit change difficult')", "Sleep follow-up question");
  await click("document.querySelector('[data-healthclues-goal-first] button[aria-pressed=\"false\"]')");
  await click("[...document.querySelectorAll('[data-healthclues-goal-first] button')].find(b=>b.innerText.includes('Continue'))");
  await wait("document.querySelector('[data-healthclues-goal-first]')?.innerText.includes('discovery profile is ready')", "Sleep 2-question Quiz completion");
  await click("[...document.querySelectorAll('[data-healthclues-goal-first] button')].find(b=>b.innerText.includes('Continue'))");
  await wait("!!document.querySelector('[data-hc-world-preview]')", "Sleep Valley activation preview preserves the selected region");
  assert.ok((await evaluate("document.querySelector('[data-hc-world-preview]').innerText")).includes("Sleep Valley"), "Activation preview remains bound to Sleep Valley.");
  const captures = [...sleepCaptures];
  await journey("en", "Health Concerns", "Gout", captures);
  await journey("vi", "Vấn đề sức khỏe", "Gout", captures, { activateAccount: true, tag: "account-a-vi", persistAdvisorFixture: true });
  await journey("en", "Health Concerns", "Gout", captures, { activateAccount: true, tag: "account-b-en-gout", persistAdvisorFixture: true });
  assert.ok(requests.some(request => request.focusId === "health-concern" && request.locale === "en" && request.concernDetail === "Gout"), "Canonical focus and synthetic concern context reached the adaptive endpoint.");
  assert.ok(requests.some(request => request.locale === "vi" && request.answeredQuestions.length === 1), "Vietnamese adaptive request uses structured prior answer IDs.");
  assert.ok(requests.some(request => request.focusId === "health-concern" && request.locale === "en" && request.concernDetail === "Gout"), "The English synthetic Plan account uses the same canonical health concern.");
  assert.equal(verifiedAccounts.length, 2, "Two separate confirmed local accounts completed the World and Plan flow.");
  assert.ok(supabaseAnonKey, "The local public Supabase key was observed from the application's OTP request without printing it.");
  const [accountA, accountB] = verifiedAccounts;
  assert.notEqual(accountA.userId, accountB.userId, "The two synthetic accounts have distinct authenticated owners.");
  assert.notEqual(accountA.worldId, accountB.worldId, "The accounts have distinct owned Worlds.");
  const profileRows = async account => {
    const response = await fetch(`http://127.0.0.1:54321/rest/v1/healthclues_profiles?user_id=eq.${account.userId}&select=profile`, { headers: { apikey: supabaseAnonKey, Authorization: `Bearer ${account.accessToken}` }, cache: "no-store" });
    assert.equal(response.status, 200, `${account.tag}: owner can read their own profile through local RLS.`);
    return response.json();
  };
  const [profileA, profileB] = await Promise.all([profileRows(accountA), profileRows(accountB)]);
  assert.equal(profileA.length, 1, "Vietnamese account owns one profile row.");
  assert.equal(profileB.length, 1, "English synthetic account owns one profile row.");
  assert.equal(profileA[0].profile.preferredLocale, "vi", "Account A's Vietnamese preference persists in its own profile.");
  assert.equal(profileB[0].profile.preferredLocale, "en", "Account B's English preference persists in its own profile.");
  assert.equal(profileA[0].profile.adaptiveDiscovery.focusId, "health-concern", "Account A retains its own concern discovery profile.");
  assert.equal(profileB[0].profile.adaptiveDiscovery.focusId, "health-concern", "Account B retains its own canonical concern profile.");
  const crossProfile = await fetch(`http://127.0.0.1:54321/rest/v1/healthclues_profiles?user_id=eq.${accountA.userId}&select=profile`, { headers: { apikey: supabaseAnonKey, Authorization: `Bearer ${accountB.accessToken}` }, cache: "no-store" });
  assert.equal(crossProfile.status, 200, "PostgREST applies RLS rather than returning an authorization server error.");
  assert.deepEqual(await crossProfile.json(), [], "Account B cannot read Account A's private profile row.");
  const apiGetPlan = async (account, worldId) => fetch(`${base}/api/healthclues/plan?worldId=${encodeURIComponent(worldId)}`, { headers: { Authorization: `Bearer ${account.accessToken}` }, cache: "no-store" });
  const ownAPlanResponse = await apiGetPlan(accountA, accountA.worldId);
  const ownBPlanResponse = await apiGetPlan(accountB, accountB.worldId);
  assert.equal(ownAPlanResponse.status, 200, "Account A reads its own confirmed Plan.");
  assert.equal(ownBPlanResponse.status, 200, "Account B reads its own confirmed Plan.");
  const initialAPlan = (await ownAPlanResponse.json()).plan;
  const initialBPlan = (await ownBPlanResponse.json()).plan;
  assert.equal(initialAPlan.goals.length, 3, "Account A API read returns exactly its three browser-selected goals.");
  assert.deepEqual(initialAPlan.goals.map(goal=>goal.goalId), accountA.persistedGoalIds, "Account A database readback matches browser My Journey IDs.");
  assert.deepEqual(initialAPlan.goals.map(goal=>goal.generatedOption?.option||null), ["A","B",null], "Persisted levels remain A, B, and Custom.");
  assert.equal(initialBPlan.goals.length, 3, "Account B keeps only its own three explicitly selected synthetic goals.");
  assert.deepEqual(initialBPlan.goals.map(goal=>goal.goalId), accountB.persistedGoalIds, "Account B's saved goal IDs match its own browser confirmation.");
  assert.equal(new Set(initialBPlan.goals.map(goal=>goal.goalId)).size, 3, "Account B has no duplicate goal records.");
  assert.ok(initialBPlan.goals.every(goal=>!accountA.persistedGoalIds.includes(goal.goalId)), "Account B has no Account A goal identities.");  for (const [requester, foreign] of [[accountA, accountB], [accountB, accountA]]) {
    assert.equal((await apiGetPlan(requester, foreign.worldId)).status, 404, `${requester.tag} cannot read the other account's World Plan.`);
    const crossWrite = await fetch(`${base}/api/healthclues/plan`, { method: "POST", headers: { Authorization: `Bearer ${requester.accessToken}`, "Content-Type": "application/json" }, body: JSON.stringify({ worldId: foreign.worldId, requestKey: crypto.randomUUID(), confirmed: true, goals: [] }) });
    assert.equal(crossWrite.status, 404, `${requester.tag} cannot write a Plan to the other account's World.`);
  }
  await cdp("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await cdp("Page.navigate", { url: `${base}/play` });
  await wait("!!document.querySelector('[data-region-map]')||!!document.querySelector('[data-world-canvas=immersive]')||!!document.querySelector('[data-world-entry-tutorial]')", "returning authenticated account opens its existing regional World directly");
  const returning = JSON.parse(await evaluate("JSON.stringify({path:location.pathname,user:JSON.parse(localStorage.getItem('botly-cloud-session')||'{}').user?.id,hasNewOnboarding:!!document.querySelector('[data-healthclues-goal-first]'),region:document.body.innerText.includes('HealthClues Realm')})"));
  assert.equal(returning.path.includes("/world"), true, "Returning player goes straight to the existing World route.");
  assert.equal(returning.user, accountB.userId, "Returning World remains owned by Account B.");
  assert.equal(returning.hasNewOnboarding, false, "An existing authenticated World does not force new-player onboarding.");
  assert.equal(returning.region, true, "The existing HealthClues Realm remains intact for the returning player.");
  assert.equal(exceptions.length, 0, `No browser runtime exceptions: ${exceptions.join(" | ")}`);
  assert.equal(advisorFixtureRequestCount, 2, "Both authenticated Advisor requests were intercepted by this test harness; none reached the real provider adapter.");
  console.log(JSON.stringify({ result: "PASS_SYNTHETIC_FIXTURE_UI_TO_PLAN_API_PERSISTENCE_LOCALE_ACCOUNT_ISOLATION_AND_ZERO_PLAN", fixture: "Synthetic adaptive replies and four bilingual signed recommendation fixtures; Account A selected A/B/Custom and persisted through its browser UI to the Plan API, Account B persisted its own separate synthetic selections; cross-account reads/writes were rejected, zero-selection and user-authored-goal flows were checked; all Advisor HTTP requests were fulfilled locally and Gemini was not called.", base, accounts: verifiedAccounts.map(({ tag, locale, goalTitle, persistedGoalTitles, persistedGoalIds, persistedLevels, region, pet }) => ({ tag, locale, goalTitle, persistedGoalTitles, persistedGoalIds, persistedLevels, region, pet })), advisorRequestsIntercepted: advisorFixtureRequestCount, screenshots: captures.filter(Boolean), runtimeExceptions: exceptions.length }, null, 2));
} finally {
  try { ws?.close(); } catch {}
  if (chrome?.pid) {
    try { spawn("taskkill.exe", ["/PID", String(chrome.pid), "/T", "/F"], { stdio: "ignore", windowsHide: true }); } catch {}
    try { chrome.kill(); } catch {}
    await new Promise(resolve => setTimeout(resolve, 700));
  }
  const resolvedProfile = path.resolve(profileDir);
  const ownedTempRoot = path.resolve(root, "App", ".tmp");
  if (resolvedProfile.startsWith(`${ownedTempRoot}${path.sep}`) && path.basename(resolvedProfile) === `mp17-goal-first-${process.pid}`) {
    try { rmSync(resolvedProfile, { recursive: true, force: true }); } catch {}
  }
}
