import assert from "node:assert/strict";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { spawn } from "node:child_process";
import net from "node:net";
import path from "node:path";

const appRoot = path.resolve("App");
const runtimePath = path.join(appRoot, ".tmp", "healthclues-owner-demo", "owner-demo-runtime.json");
assert.ok(existsSync(runtimePath), "The dedicated local Owner Demo runtime configuration is required.");
const runtime = JSON.parse(readFileSync(runtimePath, "utf8"));
assert.equal(runtime.projectId, "healthclues-owner-demo");
assert.equal(runtime.apiUrl, "http://127.0.0.1:54321");
assert.equal(runtime.source, "supabase status --workdir healthclues-owner-demo --output json");
assert.match(runtime.cliVersion || "", /^\d+\.\d+\.\d+$/);
const base = process.env.HEALTHCLUES_OWNER_DEMO_URL || "http://127.0.0.1:3260";
assert.equal(new URL(base).hostname, "127.0.0.1", "Browser E2E may only target loopback.");
assert.ok(["3260", "3261", "3262", "3263", "3264", "3265", "3266", "3267", "3268", "3269", "3270", "3310"].includes(new URL(base).port), "Refusing an unapproved or existing demo port.");
const preflight = await Promise.all([
  fetch(`${runtime.apiUrl}/auth/v1/health`),
  fetch(`${runtime.apiUrl}/auth/v1/settings`, { headers: { apikey: runtime.publishableKey } }),
  fetch(`${runtime.apiUrl}/rest/v1/healthclues_catalog_items?select=id&limit=1`, { headers: { apikey: runtime.publishableKey, Authorization: `Bearer ${runtime.publishableKey}` } }),
  fetch("http://127.0.0.1:54324/"),
  fetch(`${base}/api/healthclues/wellness-habits`, { cache: "no-store" }),
]);
assert.ok(preflight.every(response => response.ok), `Local Auth, REST, Mailpit and current app routes must respond before creating synthetic test accounts (statuses: ${preflight.map(response => response.status).join(", ")}).`);
const habitsResponse = await preflight[4].json();
assert.equal(habitsResponse.availability, "test-only", "The latest build must identify the isolated TEST ONLY library.");

const chromePath = [path.join(process.env.PROGRAMFILES || "C:\\Program Files", "Google", "Chrome", "Application", "chrome.exe"), path.join(process.env["PROGRAMFILES(X86)"] || "C:\\Program Files (x86)", "Google", "Chrome", "Application", "chrome.exe")].find(existsSync);
assert.ok(chromePath, "Google Chrome is required.");
const profileDir = path.join(appRoot, ".tmp", `post-quiz-browser-${process.pid}`);
mkdirSync(profileDir, { recursive: false });
const screenshotDir = path.join(appRoot, "reports", "previews");
mkdirSync(screenshotDir, { recursive: true });
const portProbe = net.createServer();
const debugPort = await new Promise((resolve, reject) => { portProbe.once("error", reject); portProbe.listen(0, "127.0.0.1", () => { const port = portProbe.address().port; portProbe.close(() => resolve(port)); }); });

async function createVerifiedSyntheticAccount(label) {
  const email = `hc-plan-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@example.invalid`;
  const password = `HC-local-${crypto.randomUUID()}-Aa9!`;
  const admin = await fetch(`${runtime.apiUrl}/auth/v1/admin/users`, { method: "POST", headers: { apikey: runtime.secretKey, Authorization: `Bearer ${runtime.secretKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ email, password, email_confirm: true, user_metadata: { test_only: true, suite: "post-quiz-wellness-plan" } }) });
  if (!admin.ok) throw new Error(`Local Auth admin fixture creation failed with HTTP ${admin.status}; response body suppressed.`);
  const created = await admin.json();
  const login = await fetch(`${runtime.apiUrl}/auth/v1/token?grant_type=password`, { method: "POST", headers: { apikey: runtime.publishableKey, "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
  if (!login.ok) throw new Error(`Local Auth synthetic sign-in failed with HTTP ${login.status}; response body suppressed.`);
  const session = await login.json();
  assert.equal(session.user?.id, created.id, "Local Auth sign-in returns the created synthetic user.");
  assert.ok(session.user?.email_confirmed_at || session.user?.confirmed_at, "Synthetic local account must be confirmed before onboarding persistence.");
  return { email, session: { access_token: session.access_token, refresh_token: session.refresh_token, expires_at: Math.floor(Date.now() / 1000) + session.expires_in, user: session.user } };
}

const advisorAuditOnly = process.env.HEALTHCLUES_ADVISOR_AUDIT_ONLY === "1";
const accounts = { gout: await createVerifiedSyntheticAccount("gout"), sleep: await createVerifiedSyntheticAccount("sleep") };
if (!advisorAuditOnly) accounts.digestion = await createVerifiedSyntheticAccount("digestion");
let chrome;
let ws;
let id = 0;
const pending = new Map();
const errors = [];
const browserApiRequests = [];
const browserApiResponses = [];
const localRequestPaths = new Map();
async function cdp(method, params = {}) {
  const commandId = ++id;
  ws.send(JSON.stringify({ id: commandId, method, params }));
  return new Promise((resolve, reject) => { const timer = setTimeout(() => { pending.delete(commandId); reject(new Error(`CDP timeout ${method}`)); }, 20000); pending.set(commandId, message => { clearTimeout(timer); if (message.error) reject(new Error(message.error.message)); else resolve(message.result); }); });
}
async function evaluate(expression) {
  const result = await cdp("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true, userGesture: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text || "Browser evaluation failed.");
  return result.result?.value;
}
async function waitFor(expression, label, timeout = 30000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) { if (await evaluate(expression).catch(() => false)) return; await new Promise(resolve => setTimeout(resolve, 200)); }
  const state = await evaluate("JSON.stringify({url:location.href,text:document.body.innerText.slice(0,6000),custom:{value:document.querySelector('textarea[placeholder=\"e.g. I want to avoid soda for 7 days\"]')?.value,alerts:[...document.querySelectorAll('[role=alert]')].map(x=>x.innerText)}})").catch(error => error.message);
  throw new Error(`Timed out waiting for ${label}: ${state}`);
}
async function clickButton(text, index = 0) {
  const clicked = await evaluate(`(()=>{const xs=[...document.querySelectorAll('button')].filter(b=>b.innerText.trim().toLowerCase().includes(${JSON.stringify(text.toLowerCase())}));const b=xs[${index}];if(!b||b.disabled)return false;b.click();return true})()`);
  assert.ok(clicked, `Enabled button not found: ${text}; visible buttons: ${await evaluate("JSON.stringify([...document.querySelectorAll('button')].map(b=>b.innerText.trim()).filter(Boolean))")}`);
}
async function fill(selector, value) {
  const ok = await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e)return false;const p=e instanceof HTMLTextAreaElement?HTMLTextAreaElement.prototype:e instanceof HTMLSelectElement?HTMLSelectElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(p,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));return true})()`);
  assert.ok(ok, `Could not fill ${selector}`);
}
async function clickByLabel(text) {
  const ok = await evaluate(`(()=>{const l=[...document.querySelectorAll('label')].find(x=>x.innerText.includes(${JSON.stringify(text)}));const e=l?.querySelector('input,select,textarea');if(!e)return false;e.click();return true})()`);
  assert.ok(ok, `Could not click control labelled ${text}`);
}
async function capture(name, width, height, mobile) {
  await cdp("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile });
  await new Promise(resolve => setTimeout(resolve, 400));
  const shot = await cdp("Page.captureScreenshot", { format: "png", captureBeyondViewport: false, fromSurface: true });
  const file = path.join(screenshotDir, name);
  writeFileSync(file, Buffer.from(shot.data, "base64"));
  return path.relative(appRoot, file).replaceAll("\\", "/");
}
async function getLocalVerificationUrl(targetEmail) {
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    const response = await fetch("http://127.0.0.1:54324/api/v1/messages?limit=30", { signal: AbortSignal.timeout(5000) });
    assert.ok(response.ok, "Mailpit local API is available for the activation scenario.");
    const payload = await response.json();
    for (const message of payload.messages || []) {
      const detailResponse = await fetch(`http://127.0.0.1:54324/api/v1/message/${encodeURIComponent(message.ID || message.Id || message.id)}`, { signal: AbortSignal.timeout(5000) });
      if (!detailResponse.ok) continue;
      const detail = await detailResponse.json();
      const recipients = JSON.stringify(detail.To || detail.to || message.To || message.to || "").toLowerCase();
      if (!recipients.includes(targetEmail.toLowerCase())) continue;
      const body = `${detail.HTML || detail.Html || detail.html || ""}\n${detail.Text || detail.text || ""}`.replaceAll("&amp;", "&");
      const match = body.match(/https?:\/\/[^\s"'<>]+\/auth\/v1\/verify\?[^\s"'<>]+/i);
      if (match) return match[0].replace(/[),.;]+$/, "");
    }
    await new Promise(resolve => setTimeout(resolve, 350));
  }
  throw new Error("A local Supabase activation link did not arrive in Mailpit.");
}
async function runJourney({ label, account, topic, questLabel, screenshotPrefix, personalGoal }) {
  const requestStart = browserApiRequests.length;
  const responseStart = browserApiResponses.length;
  await cdp("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  const sessionSource = `try{if(location.origin===${JSON.stringify(base)})localStorage.setItem('botly-cloud-session',${JSON.stringify(JSON.stringify(account.session))})}catch{}`;
  const injectedSession = await cdp("Page.addScriptToEvaluateOnNewDocument", { source: sessionSource });
  await cdp("Page.navigate", { url: `${base}/play` });
  await waitFor("document.body.innerText.includes('START ADVENTURE')", "Welcome");
  await cdp("Page.removeScriptToEvaluateOnNewDocument", { identifier: injectedSession.identifier });
  await clickButton("START ADVENTURE");
  await waitFor("document.body.innerText.includes('Two adventures are open')", "Quest selection");
  await clickButton(questLabel);
  await waitFor("document.body.innerText.includes('Question 1 of 10')", "Quiz start");
  await clickButton("Yes"); await clickButton("Next");
  for (let question = 2; question <= 9; question++) {
    await waitFor(`document.body.innerText.includes('Question ${question} of 10')`, `Question ${question}`);
    const body = await evaluate("document.body.innerText");
    if (body.includes("Which health or wellness topic interests you most right now?")) { await clickButton(topic); await clickButton("Next"); }
    else await clickButton("Skip");
  }
  await waitFor("document.body.innerText.includes('Question 10 of 10')", "Question 10");
  await clickButton("Skip");
  await waitFor("document.body.innerText.includes('Your adventure is ready!')", "Discovery Reveal");
  const revealText = await evaluate("document.body.innerText");
  assert.ok(revealText.includes(topic), `${label} Quiz topic is retained on the reveal.`);
  const shots = [await capture(`${screenshotPrefix}-reveal-desktop.png`, 1440, 900, false), await capture(`${screenshotPrefix}-reveal-mobile.png`, 390, 844, true)];
  await clickButton("BUILD MY WELLNESS PLAN");
  await waitFor("document.body.innerText.includes('Your Suggested Wellness Plan') && !document.body.innerText.includes('Finding relevant habit topics')", "suggestion list loaded");
  const state = JSON.parse(await evaluate("JSON.stringify({text:document.body.innerText,items:[...document.querySelectorAll('[data-plan-suggestion]')].map(e=>({id:e.dataset.planSuggestion,text:e.innerText,addDisabled:[...e.querySelectorAll('button')].find(b=>b.innerText.trim()==='Add')?.disabled}))})"));
  assert.ok(state.items.length > 0, `${label} has supported isolated checklist candidates.`);
  assert.ok(state.text.includes("TEST ONLY") && state.text.includes("Live AI generation is not configured"), "The UI labels test content and deterministic fallback truthfully.");
  assert.ok(!/2,?000\s*mL|2 liters|11\s*PM/i.test(state.text), "No universal target is shown.");
  shots.push(await capture(`${screenshotPrefix}-plan-desktop.png`, 1440, 900, false), await capture(`${screenshotPrefix}-plan-mobile.png`, 390, 844, true));
  const mobileOverflow = await evaluate("document.documentElement.scrollWidth > innerWidth");
  assert.equal(mobileOverflow, false, "Plan Builder has no horizontal overflow at 390px.");
  await cdp("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  if (advisorAuditOnly) return { topic, checklistIds: state.items.map(item => item.id), testOnlyDisclosure: state.text.includes("TEST ONLY"), deterministicFallbackDisclosure: state.text.includes("Live AI generation is not configured"), apiRequests: browserApiRequests.slice(requestStart), apiResponses: browserApiResponses.slice(responseStart), providerRequestId: null, providerResponseId: null };
  if (topic === "Gout & uric acid") {
    await evaluate("(()=>{const card=document.querySelector('[data-plan-suggestion=\"habit:gout-hydration-guidance\"]');const button=[...(card?.querySelectorAll('button')||[])].find(item=>item.innerText.trim()==='Add');button?.click();return !!button})()");
    await waitFor("document.body.innerText.includes('Configure: Follow your personal hydration guidance')", "hydration guidance configuration");
    assert.equal(await evaluate("!document.querySelector('section[role=\"dialog\"] input[type=\"number\"]')"), true, "Hydration has no suggested numeric volume target.");
    shots.push(await capture(`${screenshotPrefix}-hydration-safety.png`, 1440, 900, false));
    const hydrationSafety = await evaluate("JSON.stringify({messages:[...document.querySelectorAll('[role=\"alert\"]')].map(node=>node.innerText),dialogOpen:!!document.querySelector('section[role=\"dialog\"]'),goalReady:document.querySelector('[data-plan-suggestion=\"habit:gout-hydration-guidance\"]')?.innerText.includes('Ready')||false,addDisabled:document.querySelector('section[role=\"dialog\"] button:last-child')?.disabled,confirmCheckbox:!!document.querySelector('section[role=\"dialog\"] input[type=\"checkbox\"]')})");
    const hydrationState = JSON.parse(hydrationSafety);
    assert.ok(hydrationState.messages.some(message => /no active hydration goal can be set/i.test(message)) && hydrationState.dialogOpen && !hydrationState.goalReady && hydrationState.addDisabled && !hydrationState.confirmCheckbox, "Unknown fluid context cannot create an active hydration goal or be overridden by an inaccurate checkbox.");
    await clickButton("Cancel");
  }
  const addId = topic === "Gout & uric acid" ? "habit:gout-balanced-meals" : "habit:sleep-consistent-schedule";
  const add = async (candidateId, target, days, detail = "") => {
    const opened = await evaluate(`(()=>{const c=document.querySelector('[data-plan-suggestion="${candidateId}"]');const b=[...(c?.querySelectorAll('button')||[])].find(x=>x.innerText.trim()==='Add'||x.innerText.trim()==='Adjust');if(!b||b.disabled)return false;b.click();return true})()`);
    assert.ok(opened, `${candidateId} opens target configuration.`);
    await waitFor("document.body.innerText.includes('Configure:')", "goal configuration dialog");
    await fill('section[role="dialog"] input[type="number"]', target);
    await evaluate(`(()=>{const s=document.querySelector('section[role="dialog"] select');if(!s)return false;Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set.call(s,${JSON.stringify(days)});s.dispatchEvent(new Event('change',{bubbles:true}));return true})()`);
    if (detail) {
      const prompt = await evaluate("document.querySelector('section[role=\"dialog\"] input[placeholder=\"Describe your chosen behavior\"]')?.placeholder");
      if (prompt) await fill('section[role="dialog"] input[placeholder="Describe your chosen behavior"]', detail);
    }
    await capture(`${screenshotPrefix}-goal-adjust.png`, 1440, 900, false);
    await clickButton("Add configured goal");
    await waitFor("document.body.innerText.includes('configured goal')", "configured selection");
  };
  await add(addId, "3", "3", topic === "Gout & uric acid" ? "Include vegetables with lunch" : "Follow my own sleep/wake routine");
  const secondSuggestionId = topic === "Gout & uric acid" ? "habit:gout-sugary-drinks" : "habit:sleep-wind-down";
  await add(secondSuggestionId, "4", "2", topic === "Gout & uric acid" ? "" : "Try my own wind-down activity");
  const skipId = topic === "Gout & uric acid" ? "habit:gout-alcohol-awareness" : "habit:sleep-evening-habits";
  await evaluate(`(()=>{const c=document.querySelector('[data-plan-suggestion="${skipId}"]');const b=[...(c?.querySelectorAll('button')||[])].find(x=>x.innerText.trim()==='Skip');b?.click();return !!b})()`);
  const custom = await evaluate("[...document.querySelectorAll('summary')].find(x=>x.innerText.includes('Add My Own Goal'))?.click(),true");
  assert.equal(custom, true, "Custom goal form is reachable.");
  await fill('textarea[placeholder="e.g. I want to avoid soda for 7 days"]', personalGoal);
  await capture(`${screenshotPrefix}-custom-goal.png`, 1440, 900, false);
  await clickButton("Save personal goal draft");
  await waitFor("document.body.innerText.includes('2 configured goals') || !!document.querySelector('[role=alert]')", "personal goal draft result");
  assert.equal(await evaluate("!!document.querySelector('[role=alert]')"), false, "The personal note is saved as an unconfigured draft, not an active measured goal.");
  await clickButton("Continue My Journey"); await waitFor("document.body.innerText.includes('My Wellness Plan')", "Plan review");
  const review = await evaluate("document.body.innerText");
  assert.ok(review.includes(personalGoal), "Review lists the user-created goal.");
  assert.ok(review.includes("Skipped suggestions"), "Review keeps skipped suggestions distinct.");
  shots.push(await capture(`${screenshotPrefix}-review-desktop.png`, 1440, 900, false), await capture(`${screenshotPrefix}-review-mobile.png`, 390, 844, true));
  await clickButton("Confirm My Plan"); await waitFor("document.body.innerText.includes('READ-ONLY PREVIEW')", "World Preview");
  shots.push(await capture(`${screenshotPrefix}-world-preview.png`, 1440, 900, false));
  await clickButton("START YOUR JOURNEY");
  await waitFor("document.body.innerText.includes('Create Your Adventure')", "activation consent");
  await clickByLabel("I agree to save my HealthClues discovery profile");
  await clickButton("Send secure verification link");
  await waitFor("location.pathname.includes('/en/wellness/healthclues/world')", "authenticated World activation", 45000);
  await waitFor("document.body.innerText.includes('Prepare your backpack')", "authenticated World activation and Backpack step", 45000);
  shots.push(await capture(`${screenshotPrefix}-activation-backpack.png`, 1440, 900, false));
  await clickButton("START EXPLORING");
  await waitFor("!!document.querySelector('[data-region-map]')", "persistent playable World", 45000);
  const nicknameVisible = await evaluate("document.body.innerText.includes('What should we call you?')");
  if (nicknameVisible) { await fill('#hc-player-nickname', label === "Gout" ? "Plan Tester A" : "Plan Tester B"); await clickButton("Save nickname"); }
  await waitFor("!!document.querySelector('[data-world-entry-tutorial][data-tutorial-step=\"1\"]')", "four-step cinematic companion tutorial");
  const petWelcome = await evaluate("JSON.stringify({text:document.querySelector('[data-world-entry-tutorial]')?.innerText,pet:document.querySelector('[data-world-entry-tutorial] .hc-pet')?.className,region:document.querySelector('[data-region-map]')?.dataset.regionMap})");
  assert.ok(JSON.parse(petWelcome).pet && JSON.parse(petWelcome).text.includes(label === "Gout" ? "Lumi" : "Luna"), `${label} sees the correct existing Pet in the full viewport tutorial.`);
  shots.push(await capture(`${screenshotPrefix}-world-tutorial-welcome-desktop.png`, 1440, 900, false));
  shots.push(await capture(`${screenshotPrefix}-world-tutorial-welcome-mobile.png`, 390, 844, true));
  assert.equal(await evaluate("document.documentElement.scrollWidth<=innerWidth+1"), true, `${label} cinematic welcome fits mobile without horizontal overflow.`);
  await cdp("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await clickButton("Continue");
  await waitFor("document.querySelector('[data-world-entry-tutorial][data-tutorial-step=\"2\"]')?.innerText.includes('Remember the goals you chose')", "actual saved goal preview");
  const stepTwoText = await evaluate("document.querySelector('[data-world-entry-tutorial]')?.innerText||''");
  assert.ok(stepTwoText.includes(personalGoal), `${label} tutorial renders the actual confirmed personal goal, not illustrative examples.`);
  shots.push(await capture(`${screenshotPrefix}-world-tutorial-saved-goals.png`, 1440, 900, false));
  await clickButton("Continue");
  await waitFor("!!document.querySelector('[data-world-entry-tutorial][data-tutorial-step=\"3\"]')", "Quests tutorial stage");
  assert.equal(await evaluate("!!document.querySelector('[data-game-nav=quest]')?.closest('header')"), true, "Quests remains present in the game navigation.");
  assert.equal(await evaluate("!!document.querySelector('[data-spotlight-navigation=quest]')"), true, "The actual Quests navigation button is spotlighted during the tutorial step.");
  shots.push(await capture(`${screenshotPrefix}-world-tutorial-quests-highlight.png`, 1440, 900, false));
  shots.push(await capture(`${screenshotPrefix}-world-tutorial-quests-highlight-mobile.png`, 390, 844, true));
  assert.equal(await evaluate("document.documentElement.scrollWidth<=innerWidth+1"), true, `${label} Quests tutorial fits mobile width.`);
  await cdp("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  if (label === "Gout") await evaluate("document.querySelector('[data-game-nav=quest]')?.click()");
  else await clickButton("Open My Wellness Plan");
  await waitFor("!!document.querySelector('[data-my-wellness-plan]')", "real authenticated My Wellness Plan panel");
  const planPanelText = await evaluate("document.querySelector('[data-my-wellness-plan]')?.innerText||''");
  assert.ok(planPanelText.includes(personalGoal), `${label} Quests panel displays the same private saved Plan.`);
  shots.push(await capture(`${screenshotPrefix}-world-my-wellness-plan.png`, 1440, 900, false));
  if (label === "Gout") {
    await evaluate("document.querySelector('.hc-plan-goal .hc-plan-actions button')?.click()");
    await waitFor("!!document.querySelector('[data-plan-goal-editor]')", "authorized goal adjustment controls");
    await fill('.hc-plan-edit input[type="number"]', "5");
    await fill('.hc-plan-edit textarea', "Include vegetables with five chosen meals across three selected days.");
    await evaluate("(()=>{const e=document.querySelector('.hc-plan-edit select');if(!e)return false;Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set.call(e,'3 days a week');e.dispatchEvent(new Event('change',{bubbles:true}));return true})()");
    shots.push(await capture(`${screenshotPrefix}-world-plan-adjust-desktop.png`, 1440, 900, false), await capture(`${screenshotPrefix}-world-plan-adjust-mobile.png`, 390, 844, true));
    assert.equal(await evaluate("document.documentElement.scrollWidth<=innerWidth+1"), true, "Plan editor fits mobile width.");
    await cdp("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
    await clickButton("Save Plan revision");
    await waitFor("document.querySelector('.hc-plan-notice')?.innerText.includes('Plan version 2')", "goal edit saved as a new Plan revision");
    assert.ok((await evaluate("document.querySelector('.hc-plan-goal')?.innerText||''")).includes("5 meals per week"), "Adjusted target is shown from the saved revision.");
    await evaluate("document.querySelector('.hc-plan-goal .hc-plan-actions button:nth-child(2)')?.click()");
    await waitFor("document.querySelector('.hc-plan-notice')?.innerText.includes('Plan version 3')", "goal pause persisted as a new revision");
    assert.ok((await evaluate("document.querySelector('.hc-plan-goal')?.innerText||''")).includes("Saved for later"), "Paused goal is not presented as active.");
    await evaluate("document.querySelector('.hc-plan-goal .hc-plan-actions button:nth-child(2)')?.click()");
    await waitFor("document.querySelector('.hc-plan-notice')?.innerText.includes('Plan version 4')", "goal resume persisted after server validation");
    await evaluate("[...document.querySelectorAll('.hc-plan-goal')].find(card=>card.innerText.includes('Consider an alcohol goal'))?.querySelector('.hc-plan-actions button:last-child')?.click()");
    await waitFor("!!document.querySelector('.hc-plan-remove-confirm')", "explicit goal removal confirmation");
    await clickButton("Remove goal");
    await waitFor("document.querySelector('.hc-plan-notice')?.innerText.includes('Plan version 5')", "removed goal saved in the next revision");
    assert.equal(await evaluate("[...document.querySelectorAll('.hc-plan-goal')].some(card=>card.innerText.includes('Consider an alcohol goal'))"), false, "Removed goal no longer appears in the current Plan.");
    await fill('#hc-world-plan-note', "I want to reduce sugary drinks for 3 days");
    await clickButton("Save note");
    await waitFor("document.querySelector('.hc-plan-notice')?.innerText.includes('Plan version 6')", "personal goal note saved to the World Plan");
    const personalNoteCard = await evaluate("[...document.querySelectorAll('.hc-plan-goal')].find(card=>card.innerText.includes('I want to reduce sugary drinks for 3 days'))?.innerText||''");
    shots.push(await capture(`${screenshotPrefix}-world-plan-revised-desktop.png`, 1440, 900, false));
    assert.ok(personalNoteCard.toLowerCase().includes("my own goal") && personalNoteCard.includes("Saved for later"), `New note remains self-reported and inactive until configured; rendered card: ${personalNoteCard}`);
    await evaluate("[...document.querySelectorAll('.hc-plan-goal')].find(card=>card.innerText.includes('I want to reduce sugary drinks for 3 days'))?.querySelector('.hc-plan-actions button:nth-child(2)')?.click()");
    await waitFor("!!document.querySelector('[data-plan-goal-editor]')", "personal goal target configuration");
    await fill('.hc-plan-edit input[type="number"]', "3");
    await fill('.hc-plan-edit input:not([type="number"])', "days");
    await fill('.hc-plan-edit textarea', "I will record each day I choose a non-sugary drink.");
    await clickButton("Save Plan revision");
    await waitFor("document.querySelector('.hc-plan-notice')?.innerText.includes('Plan version 7')", "measurable personal goal configuration saved");
    await evaluate("[...document.querySelectorAll('.hc-plan-goal')].find(card=>card.innerText.includes('I want to reduce sugary drinks for 3 days'))?.querySelector('.hc-plan-actions button:nth-child(2)')?.click()");
    await waitFor("document.querySelector('.hc-plan-notice')?.innerText.includes('Plan version 8')", "user explicitly activates configured personal goal");
    const activatedNote = await evaluate("[...document.querySelectorAll('.hc-plan-goal')].find(card=>card.innerText.includes('I want to reduce sugary drinks for 3 days'))?.innerText||''");
    assert.ok(activatedNote.includes("Active goal") && activatedNote.includes("3 days"), "Configured user goal is active only after explicit resume, with its chosen target.");
    shots.push(await capture(`${screenshotPrefix}-world-plan-revised-mobile.png`, 390, 844, true));
    assert.equal(await evaluate("document.documentElement.scrollWidth<=innerWidth+1"), true, "Updated Plan remains usable on mobile.");
    await cdp("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  }
  shots.push(await capture(`${screenshotPrefix}-world-my-wellness-plan-mobile.png`, 390, 844, true));
  assert.equal(await evaluate("document.documentElement.scrollWidth<=innerWidth+1"), true, `${label} saved Plan panel fits mobile width.`);
  await cdp("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  assert.equal(await evaluate("(()=>{const b=document.querySelector('[data-game-panel] button[aria-label=\"Close panel\"]');b?.click();return !!b})()"), true, "Plan panel has a reachable close control.");
  await waitFor("!!document.querySelector('[data-world-entry-tutorial][data-tutorial-step=\"3\"]')", "tutorial returns to Quests prompt after closing Plan");
  await clickButton("Continue");
  await waitFor("!!document.querySelector('[data-world-entry-tutorial][data-tutorial-step=\"4\"]')", "final exploration tutorial stage");
  assert.equal(await evaluate("document.querySelector('[data-region-map] [data-landmark-id=nutrition]')?.dataset.guideTarget"), "true", "The Garden is highlighted as a reachable first discovery station.");
  shots.push(await capture(`${screenshotPrefix}-world-tutorial-start-exploring.png`, 1440, 900, false));
  await clickButton("Start Exploring");
  await waitFor("!document.querySelector('[data-world-entry-tutorial]') && !!document.querySelector('[data-region-map]')", "interactive region after tutorial");
  assert.equal(await evaluate("document.querySelector('[data-region-map] [data-landmark-id=nutrition]')?.dataset.guideTarget"), "true", "The first optional objective remains visible after the overlay closes.");
  shots.push(await capture(`${screenshotPrefix}-world-free-exploration-desktop.png`, 1440, 900, false));
  shots.push(await capture(`${screenshotPrefix}-world-free-exploration-mobile.png`, 390, 844, true));
  assert.equal(await evaluate("document.documentElement.scrollWidth<=innerWidth+1"), true, `${label} playable World fits mobile width.`);
  await cdp("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  const beforeRoute = JSON.parse(await evaluate("JSON.stringify({player:document.querySelector('[data-player-actor]')?.dataset.worldX,pet:document.querySelector('.hc-rpg-pet-actor')?.dataset.worldX})"));
  await clickButton("Approach botanist").catch(async () => {
    const npcClick = await evaluate("(()=>{const n=document.querySelector('[data-landmark-id=nutrition] .hc-rpg-npc');if(!n)return false;n.click();return true})()");
    assert.equal(npcClick, true, "The highlighted Botanist interaction surface can be selected.");
  });
  await waitFor("!!document.querySelector('[data-interact-landmark=nutrition]')", "real route arrival at Botanist");
  const routeState = JSON.parse(await evaluate("JSON.stringify({player:document.querySelector('[data-player-actor]')?.dataset.worldX,pet:document.querySelector('.hc-rpg-pet-actor')?.dataset.worldX,walking:document.querySelector('[data-player-actor]')?.dataset.walking})"));
  assert.ok(routeState.player && routeState.pet && routeState.player !== beforeRoute.player, `${label} player visibly traverses the authored path toward the NPC.`);
  assert.equal(routeState.walking, "false", "Player reaches the station before Talk becomes available.");
  const arrivalPlayerPosition = routeState.player;
  await clickButton("Talk");
  await waitFor("!!document.querySelector('[data-game-panel=nutrition]')", "Botanist contextual interaction");
  shots.push(await capture(`${screenshotPrefix}-world-botanist-talk-desktop.png`, 1440, 900, false));
  await cdp("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  shots.push(await capture(`${screenshotPrefix}-world-botanist-talk-mobile.png`, 390, 844, true));
  assert.equal(await evaluate("document.documentElement.scrollWidth<=innerWidth+1"), true, `${label} NPC interaction fits mobile width.`);
  await cdp("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  assert.equal(await evaluate("(()=>{const b=document.querySelector('[data-game-panel] button[aria-label=\"Close panel\"]');b?.click();return !!b})()"), true, "NPC panel has a reachable close control.");
  await waitFor("!!document.querySelector('[data-region-map]') && !document.querySelector('[data-game-panel=nutrition]')", "return to same region after closing NPC interaction");
  assert.equal(await evaluate("document.querySelector('[data-player-actor]')?.dataset.worldX"), arrivalPlayerPosition, "Closing NPC dialogue returns to the same player position.");
  const snapshot = JSON.parse(await evaluate("(async()=>{const s=JSON.parse(localStorage.getItem('botly-cloud-session'));const w=await fetch('/api/healthclues/world',{headers:{Authorization:'Bearer '+s.access_token},cache:'no-store'});const world=await w.json();const p=await fetch('/api/healthclues/plan?worldId='+encodeURIComponent(world.world.id),{headers:{Authorization:'Bearer '+s.access_token},cache:'no-store'});const plan=await p.json();return JSON.stringify({userId:s.user.id,worldId:world.world.id,region:world.world.region_id,planStatus:p.status,plan:plan.plan})})()"));
  assert.equal(snapshot.userId, account.session.user.id);
  assert.equal(snapshot.planStatus, 200);
  assert.equal(snapshot.plan.worldId, snapshot.worldId);
  assert.ok(snapshot.plan.goals.some(goal => goal.title === personalGoal));
  const beforeId = snapshot.worldId;
  const beforeVersion = snapshot.plan.version;
  await cdp("Page.reload", { ignoreCache: true });
  await waitFor("location.pathname.includes('/en/wellness/healthclues/world')", "World after reload", 45000);
  await waitFor("!!document.querySelector('[data-world-canvas=immersive]') && !document.querySelector('[data-world-entry-tutorial]')", "returning World does not replay the completed tutorial");
  await waitFor("!!document.querySelector('[data-world-canvas=immersive]')", "persistent Overworld after reload", 15000);
  const persisted = JSON.parse(await evaluate("(async()=>{const s=JSON.parse(localStorage.getItem('botly-cloud-session'));const w=await fetch('/api/healthclues/world',{headers:{Authorization:'Bearer '+s.access_token},cache:'no-store'});const d=await w.json();return JSON.stringify({worldId:d.world.id,plan:d.wellnessPlan})})()"));
  assert.equal(persisted.worldId, beforeId);
  assert.equal(persisted.plan.version, beforeVersion);
  shots.push(await capture(`${screenshotPrefix}-world-desktop.png`, 1440, 900, false), await capture(`${screenshotPrefix}-world-mobile.png`, 390, 844, true));
  assert.equal(await evaluate("document.documentElement.scrollWidth<=innerWidth+1"), true, `${label} returning World map fits mobile width.`);
  await cdp("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await clickButton(label === "Gout" ? "HealthClues Realm" : "Sleep Valley");
  await waitFor(`document.querySelector('[role=dialog]')?.innerText.includes(${JSON.stringify(questLabel)})`, `${label} selected region details after reload`);
  await clickButton(label === "Gout" ? "ENTER HEALTHCLUES REALM" : "ENTER SLEEP VALLEY");
  await waitFor("!!document.querySelector('[data-region-map]') && !document.querySelector('[data-world-entry-tutorial]')", "returning player enters without forced tutorial replay");
  assert.equal(await evaluate("(()=>{const b=document.querySelector('[data-region-map] button[aria-label=\"Open Pet guide\"]');b?.click();return !!b})()"), true, "Returning player can voluntarily replay the guide.");
  await waitFor("!!document.querySelector('[data-world-entry-tutorial][data-tutorial-step=\"1\"]')", "voluntary guide replay");
  await clickButton("Skip tutorial");
  await waitFor("!document.querySelector('[data-world-entry-tutorial]')", "whole tutorial skip");
  await cdp("Page.reload", { ignoreCache: true });
  await waitFor("location.pathname.includes('/en/wellness/healthclues/world')", "World after skipped replay", 45000);
  assert.equal(await evaluate("!!document.querySelector('[data-world-entry-tutorial]')"), false, "A skipped replay does not restart on refresh.");
  return { userId: snapshot.userId, worldId: snapshot.worldId, version: snapshot.plan.version, goalCount: snapshot.plan.goals.length, topic, screenshots: shots };
}

async function runCoverageGapJourney() {
  const prefix = "post-quiz-digestion";
  await cdp("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  const injectedSession = await cdp("Page.addScriptToEvaluateOnNewDocument", { source: `try{if(location.origin===${JSON.stringify(base)})localStorage.setItem('botly-cloud-session',${JSON.stringify(JSON.stringify(accounts.digestion.session))})}catch{}` });
  await cdp("Page.navigate", { url: `${base}/play` });
  await waitFor("document.body.innerText.includes('START ADVENTURE')", "Digestion World entry");
  await cdp("Page.removeScriptToEvaluateOnNewDocument", { identifier: injectedSession.identifier });
  await clickButton("START ADVENTURE"); await waitFor("document.body.innerText.includes('Two adventures are open')", "Digestion Quest selection");
  await clickButton("HealthClues Realm"); await waitFor("document.body.innerText.includes('Question 1 of 10')", "Digestion Quiz start");
  await clickButton("Yes"); await clickButton("Next");
  for (let question = 2; question <= 9; question++) {
    await waitFor(`document.body.innerText.includes('Question ${question} of 10')`, `Digestion Quiz question ${question}`);
    if ((await evaluate("document.body.innerText")).includes("Which health or wellness topic interests you most right now?")) { await clickButton("Digestion & gut health"); await clickButton("Next"); }
    else await clickButton("Skip");
  }
  await waitFor("document.body.innerText.includes('Question 10 of 10')", "Digestion final Quiz question"); await clickButton("Skip");
  await waitFor("document.body.innerText.includes('Your adventure is ready!')", "Digestion Reveal");
  await clickButton("BUILD MY WELLNESS PLAN");
  await waitFor("document.body.innerText.includes('Your Suggested Wellness Plan') && !document.body.innerText.includes('Finding relevant habit topics')", "Digestion checklist coverage result");
  const planText = await evaluate("document.body.innerText");
  assert.equal(await evaluate("document.querySelectorAll('[data-plan-suggestion]').length"), 0, "Unsupported Digestion topic does not receive unrelated Gout/Sleep fixture cards.");
  assert.ok(planText.includes("No reviewed, eligible habit templates are available for this topic yet") && planText.includes("TEST ONLY"), "Digestion UI truthfully reports a content gap and demo-only library status.");
  const shots = [await capture(`${prefix}-coverage-gap-desktop.png`, 1440, 900, false), await capture(`${prefix}-coverage-gap-mobile.png`, 390, 844, true)];
  await cdp("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await clickButton("Skip suggestions & continue"); await waitFor("document.body.innerText.includes('READ-ONLY PREVIEW')", "Digestion empty-plan World Preview");
  await clickButton("START YOUR JOURNEY"); await waitFor("document.body.innerText.includes('Create Your Adventure')", "Digestion activation consent");
  await clickByLabel("I agree to save my HealthClues discovery profile"); await clickButton("Send secure verification link");
  await waitFor("location.pathname.includes('/en/wellness/healthclues/world')", "Digestion authenticated World activation", 45000);
  const state = JSON.parse(await evaluate("(async()=>{const session=JSON.parse(localStorage.getItem('botly-cloud-session'));const response=await fetch('/api/healthclues/world',{headers:{Authorization:'Bearer '+session.access_token},cache:'no-store'});const data=await response.json();return JSON.stringify({status:response.status,worldId:data.world?.id,region:data.branches?.[0]?.topic_key,plan:data.wellnessPlan||null})})()"));
  assert.equal(state.status, 200, "Coverage-gap player can activate an empty Plan World.");
  const savedProfileResponse = await fetch(`${runtime.apiUrl}/rest/v1/healthclues_profiles?user_id=eq.${encodeURIComponent(accounts.digestion.session.user.id)}&select=profile`, { headers: { apikey: runtime.publishableKey, Authorization: `Bearer ${accounts.digestion.session.access_token}` }, cache: "no-store" });
  assert.equal(savedProfileResponse.status, 200, "Owner-scoped local REST can read the activated Quiz profile under RLS.");
  const savedProfileRows = await savedProfileResponse.json();
  assert.equal(savedProfileRows[0]?.profile?.topic, "Digestion & gut health", "Unsupported self-reported Quiz topic remains in the authenticated private profile, separate from the playable region key.");
  assert.equal(state.plan, null, "Skipping all unsupported suggestions does not create a plan.");
  await clickButton("START EXPLORING"); await waitFor("!!document.querySelector('[data-region-map]')", "Digestion region map", 45000);
  if (await evaluate("document.body.innerText.includes('What should we call you?')")) { await fill('#hc-player-nickname', "Digestion Explorer"); await clickButton("Save nickname"); }
  await waitFor("!!document.querySelector('[data-world-entry-tutorial][data-tutorial-step=\"1\"]')", "Lumi welcome after empty-plan activation");
  assert.ok((await evaluate("document.querySelector('[data-world-entry-tutorial]')?.innerText||''")).includes("Lumi"), "The HealthClues Realm still starts with Lumi when the user has no confirmed Plan.");
  shots.push(await capture(`${prefix}-world-tutorial-desktop.png`, 1440, 900, false), await capture(`${prefix}-world-tutorial-mobile.png`, 390, 844, true));
  assert.ok(await evaluate("(document.querySelector('.hc-world-tutorial-pet .hc-pet')?.getBoundingClientRect().width||0) >= 90"), "The regional Pet remains a prominent visible guide on mobile.");
  return { topic: "Digestion & gut health", items: 0, plan: state.plan, worldId: state.worldId, screenshots: shots };
}

async function runEmailActivationJourney(existingWorldIds = []) {
  const prefix = "post-quiz-email-activation";
  const email = `hc-quiz-mailpit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@example.invalid`;
  await evaluate("localStorage.removeItem('botly-cloud-session');sessionStorage.clear()");
  await cdp("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await cdp("Page.navigate", { url: `${base}/play` });
  await waitFor("document.body.innerText.includes('START ADVENTURE')", "new unverified player's welcome");
  await clickButton("START ADVENTURE"); await waitFor("document.body.innerText.includes('Two adventures are open')", "new player's Quest selection");
  await clickButton("HealthClues Realm"); await waitFor("document.body.innerText.includes('Question 1 of 10')", "new player's Quiz");
  await clickButton("Yes"); await clickButton("Next");
  for (let question = 2; question <= 9; question++) {
    await waitFor(`document.body.innerText.includes('Question ${question} of 10')`, `email journey Quiz question ${question}`);
    if ((await evaluate("document.body.innerText")).includes("Which health or wellness topic interests you most right now?")) { await clickButton("Gout & uric acid"); await clickButton("Next"); }
    else await clickButton("Skip");
  }
  await waitFor("document.body.innerText.includes('Question 10 of 10')", "email journey final Quiz question"); await clickButton("Skip");
  await waitFor("document.body.innerText.includes('Your adventure is ready!')", "email journey Reveal");
  await clickButton("BUILD MY WELLNESS PLAN");
  await waitFor("document.body.innerText.includes('Your Suggested Wellness Plan') && !!document.querySelector('[data-plan-suggestion=\"habit:gout-balanced-meals\"]')", "Gout checklist for real-email activation");
  const configure = async (id, target, days, detail = "") => {
    const opened = await evaluate(`(()=>{const c=document.querySelector('[data-plan-suggestion="${id}"]');const b=[...(c?.querySelectorAll('button')||[])].find(x=>x.innerText.trim()==='Add');if(!b||b.disabled)return false;b.click();return true})()`);
    assert.ok(opened, `Email activation can configure ${id}.`);
    await waitFor("document.body.innerText.includes('Configure:')", `configure ${id}`);
    await fill('section[role="dialog"] input[type="number"]', target);
    await evaluate(`(()=>{const s=document.querySelector('section[role="dialog"] select');if(!s)return false;Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set.call(s,${JSON.stringify(days)});s.dispatchEvent(new Event('change',{bubbles:true}));return true})()`);
    const detailInput = await evaluate("!!document.querySelector('section[role=\"dialog\"] input[placeholder=\"Describe your chosen behavior\"]')");
    if (detail && detailInput) await fill('section[role="dialog"] input[placeholder="Describe your chosen behavior"]', detail);
    await clickButton("Add configured goal"); await waitFor("document.body.innerText.includes('configured goal')", `save ${id}`);
  };
  await configure("habit:gout-balanced-meals", "3", "3", "Include vegetables with lunch");
  await configure("habit:gout-sugary-drinks", "4", "2");
  await evaluate("(()=>{const c=document.querySelector('[data-plan-suggestion=\"habit:gout-alcohol-awareness\"]');[...(c?.querySelectorAll('button')||[])].find(b=>b.innerText.trim()==='Skip')?.click();return true})()");
  await evaluate("[...document.querySelectorAll('summary')].find(x=>x.innerText.includes('Add My Own Goal'))?.click()");
  await fill('textarea[placeholder="e.g. I want to avoid soda for 7 days"]', "I want to include vegetables at lunch for 3 days");
  await clickButton("Save personal goal draft"); await waitFor("document.body.innerText.includes('2 configured goals')", "custom note remains a draft before activation");
  await clickButton("Continue My Journey"); await waitFor("document.body.innerText.includes('My Wellness Plan')", "email journey plan review");
  assert.ok((await evaluate("document.body.innerText")).includes("I want to include vegetables at lunch for 3 days"), "Plan review shows the user's exact custom note.");
  await clickButton("Confirm My Plan"); await waitFor("document.body.innerText.includes('READ-ONLY PREVIEW')", "confirmed-plan World Preview");
  await clickButton("START YOUR JOURNEY"); await waitFor("document.body.innerText.includes('Create Your Adventure')", "new account consent gate");
  await fill("#hc-activation-email", email); await clickByLabel("I agree to save my HealthClues discovery profile");
  await clickButton("Send secure verification link");
  await waitFor("document.body.innerText.includes('Check your email for the secure verification link.')", "verification requested, not yet confirmed");
  const screenshots = [await capture(`${prefix}-activation-desktop.png`, 1440, 900, false), await capture(`${prefix}-activation-mobile.png`, 390, 844, true)];
  const verificationUrl = await getLocalVerificationUrl(email);
  await cdp("Page.navigate", { url: verificationUrl });
  await waitFor("location.pathname.includes('/en/wellness/healthclues/world') && document.body.innerText.includes('Prepare your backpack')", "Mailpit verification callback and pending handoff", 60000);
  const beforeWorld = JSON.parse(await evaluate("JSON.stringify({url:location.href,session:JSON.parse(localStorage.getItem('botly-cloud-session')||'{}')})"));
  assert.ok(beforeWorld.session.user?.email_confirmed_at || beforeWorld.session.user?.confirmed_at, "Mailpit callback establishes a verified account before persistent World creation.");
  assert.equal(beforeWorld.session.user.email?.toLowerCase(), email.toLowerCase(), "Pending Quiz context is resumed only for the email the player verified.");
  await clickButton("START EXPLORING"); await waitFor("!!document.querySelector('[data-region-map]')", "newly activated HealthClues Realm", 45000);
  if (await evaluate("document.body.innerText.includes('What should we call you?')")) { await fill("#hc-player-nickname", "Verified Explorer"); await clickButton("Save nickname"); }
  await waitFor("!!document.querySelector('[data-world-entry-tutorial][data-tutorial-step=\"1\"]')", "Lumi tutorial after real email verification", 45000);
  const verifiedSession = JSON.parse(await evaluate("JSON.stringify(JSON.parse(localStorage.getItem('botly-cloud-session')||'{}'))"));
  const data = JSON.parse(await evaluate("(async()=>{const s=JSON.parse(localStorage.getItem('botly-cloud-session'));const r=await fetch('/api/healthclues/world',{headers:{Authorization:'Bearer '+s.access_token},cache:'no-store'});const d=await r.json();return JSON.stringify({status:r.status,worldId:d.world?.id,plan:d.wellnessPlan||null})})()"));
  assert.equal(data.status, 200, "Verified activation creates the persistent World for the same Quiz user.");
  assert.ok(data.plan && Array.isArray(data.plan.goals), "The confirmed Wellness Plan crosses the encrypted email activation handoff.");
  assert.ok(data.plan.goals.some(goal=>goal.title==="Explore balanced meals") && data.plan.goals.some(goal=>goal.originalNote==="I want to include vegetables at lunch for 3 days"), `World persistence retains the accepted suggestion and original personal draft (saved goal count: ${data.plan.goals.length}; titles: ${data.plan.goals.map(goal=>goal.title).join(" | ")}).`);
  assert.ok(!existingWorldIds.includes(data.worldId), "Mailpit-verified player has a private World distinct from all earlier test accounts.");
  const profileResponse = await fetch(`${runtime.apiUrl}/rest/v1/healthclues_profiles?user_id=eq.${encodeURIComponent(verifiedSession.user.id)}&select=profile`, { headers: { apikey: runtime.publishableKey, Authorization: `Bearer ${verifiedSession.access_token}` }, cache: "no-store" });
  assert.equal(profileResponse.status, 200, "Verified user can read only their own private Quiz profile through local RLS.");
  assert.equal((await profileResponse.json())[0]?.profile?.topic, "Gout & uric acid", "The encrypted pending handoff preserves the self-reported Quiz topic across real email verification.");
  screenshots.push(await capture(`${prefix}-lumi-tutorial-desktop.png`, 1440, 900, false), await capture(`${prefix}-lumi-tutorial-mobile.png`, 390, 844, true));
  assert.ok(await evaluate("(document.querySelector('.hc-world-tutorial-pet .hc-pet')?.getBoundingClientRect().width||0)>=90"), "Verified player's mobile tutorial keeps Lumi prominently visible.");
  return { emailVerified: true, mailpit: true, topic: "Gout & uric acid", plan: data.plan, worldId: data.worldId, userId: verifiedSession.user.id, screenshots };
}

try {
  chrome = spawn(chromePath, ["--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", "--disable-background-networking", "--no-proxy-server", "--no-sandbox", `--remote-debugging-port=${debugPort}`, "--remote-allow-origins=*", `--user-data-dir=${profileDir}`, "about:blank"], { stdio: "ignore", windowsHide: true });
  let target;
  for (let attempt = 0; attempt < 80; attempt++) { try { target = await (await fetch(`http://127.0.0.1:${debugPort}/json/new?about:blank`, { method: "PUT" })).json(); if (target.webSocketDebuggerUrl) break; } catch {} await new Promise(resolve => setTimeout(resolve, 150)); }
  assert.ok(target?.webSocketDebuggerUrl, "Chromium DevTools endpoint is available.");
  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.addEventListener("open", resolve, { once: true }); ws.addEventListener("error", reject, { once: true }); });
  ws.addEventListener("message", event => {
    const message = JSON.parse(event.data);
    if (message.method === "Runtime.exceptionThrown") errors.push(message.params.exceptionDetails);
    if (message.method === "Network.requestWillBeSent") {
      try { const url = new URL(message.params.request.url); if (url.origin === base && url.pathname.startsWith("/api/")) { const item = { method: message.params.request.method, path: url.pathname }; browserApiRequests.push(item); localRequestPaths.set(message.params.requestId, item); } } catch {}
    }
    if (message.method === "Network.responseReceived") { const request = localRequestPaths.get(message.params.requestId); if (request) browserApiResponses.push({ ...request, status: message.params.response.status }); }
    if (message.id && pending.has(message.id)) { const done = pending.get(message.id); pending.delete(message.id); done(message); }
  });
  await cdp("Page.enable"); await cdp("Runtime.enable"); await cdp("Network.enable");
  await cdp("Page.navigate", { url: `${base}/en/wellness/healthclues/quiz?from=play&step=reveal#wellness-plan` });
  await waitFor("!!document.querySelector('[data-quiz-profile-recovery]')", "truthful missing-profile recovery for a direct Plan deep link");
  const recoveryText = await evaluate("document.querySelector('[data-quiz-profile-recovery]')?.innerText||''");
  const recoveryBody = await evaluate("document.body.innerText");
  assert.ok(recoveryText.includes("Your Quiz profile is not available") && !recoveryBody.includes("Your Suggested Wellness Plan"), "A missing Quiz profile cannot show an invented checklist.");
  const recoveryShots = [await capture("post-quiz-missing-profile-recovery-desktop.png", 1440, 900, false), await capture("post-quiz-missing-profile-recovery-mobile.png", 390, 844, true)];
  await cdp("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await clickButton("Start the Quiz");
  await waitFor("document.body.innerText.includes('Create Your Wellness Journey')", "recoverable Quiz entry");
  const gout = await runJourney({ label: "Gout", account: accounts.gout, topic: "Gout & uric acid", questLabel: "HealthClues Realm", screenshotPrefix: advisorAuditOnly ? "codex-advisor-audit-gout" : "post-quiz-gout", personalGoal: "Reduce sugary drinks for three days" });
  const sleep = await runJourney({ label: "Sleep", account: accounts.sleep, topic: "Sleep & rest", questLabel: "Sleep Valley", screenshotPrefix: advisorAuditOnly ? "codex-advisor-audit-sleep" : "post-quiz-sleep", personalGoal: "Keep a chosen wind-down routine" });
  if (advisorAuditOnly) {
    assert.notDeepEqual(gout.checklistIds, sleep.checklistIds, "Different synthetic Quiz profiles render different deterministic checklist items.");
    assert.equal(gout.deterministicFallbackDisclosure && sleep.deterministicFallbackDisclosure, true, "Both browser profiles disclose that live AI is not configured.");
    assert.equal(gout.testOnlyDisclosure && sleep.testOnlyDisclosure, true, "Both browser profiles retain TEST ONLY provenance.");
    for (const profile of [gout, sleep]) {
      assert.ok(profile.apiRequests.some(item => item.method === "GET" && item.path === "/api/healthclues/wellness-habits"), `${profile.topic} browser uses the existing habit library endpoint.`);
      assert.ok(profile.apiResponses.some(item => item.method === "GET" && item.path === "/api/healthclues/wellness-habits" && item.status === 200), `${profile.topic} habit library response is successful.`);
      assert.ok(!profile.apiRequests.some(item => /codex|advisor|ai-generation/i.test(item.path)), `${profile.topic} browser does not call a Quiz AI generation endpoint.`);
    }
    console.log(JSON.stringify({ result: "CHROMIUM_AUDIT_COMPLETE_LIVE_CODEX_NOT_IMPLEMENTED", projectId: runtime.projectId, buildUrl: base, mode: "DETERMINISTIC", quizAiGenerationEndpointCalls: 0, profiles: [gout, sleep] }, null, 2));
  } else {
  const digestion = await runCoverageGapJourney();
  const emailActivation = await runEmailActivationJourney([gout.worldId, sleep.worldId, digestion.worldId]);
  assert.notEqual(gout.userId, sleep.userId, "Two synthetic accounts have distinct ownership.");
  assert.notEqual(gout.worldId, sleep.worldId, "Two synthetic accounts have separate Worlds.");
  const isolation = await evaluate(`(async()=>{const s=${JSON.stringify(accounts.sleep.session)};const r=await fetch('/api/healthclues/plan?worldId=${gout.worldId}',{headers:{Authorization:'Bearer '+s.access_token},cache:'no-store'});return JSON.stringify({crossReadStatus:r.status})})()`);
  assert.equal(JSON.parse(isolation).crossReadStatus, 404, "Cross-account plan reads are rejected.");
  const crossWrite = await fetch(`${base}/api/healthclues/plan`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${accounts.sleep.session.access_token}` }, body: JSON.stringify({ worldId: gout.worldId, requestKey: crypto.randomUUID(), confirmed: true, goals: [] }), cache: "no-store" });
  assert.equal(crossWrite.status, 404, "Cross-account plan writes are rejected before modifying either profile.");
  assert.deepEqual(errors, [], "No uncaught browser runtime errors.");
  console.log(JSON.stringify({ result: "PASS_LOCAL_AUTHENTICATED_PLAN_PERSISTENCE", runtime: { projectId: runtime.projectId, cliVersion: runtime.cliVersion, api: new URL(runtime.apiUrl).origin }, liveLlm: false, directLinkRecovery: recoveryShots, topics: { gout: { library: "TEST ONLY", items: 6 }, sleep: { library: "TEST ONLY", items: 4 }, digestion: { coverage: "honest gap", items: 0 } }, journeys: [...[gout, sleep].map(item => ({ topic: item.topic, worldCreated: Boolean(item.worldId), planRevision: item.version, goalsPersisted: item.goalCount, screenshots: item.screenshots })), digestion, emailActivation], ownership: { distinctSyntheticUsers: gout.userId !== sleep.userId && sleep.userId !== accounts.digestion.session.user.id, distinctWorlds: gout.worldId !== sleep.worldId, crossReadStatus: JSON.parse(isolation).crossReadStatus, crossWriteStatus: crossWrite.status }, errors: errors.length }, null, 2));
  }
} finally {
  try { ws?.close(); } catch {}
  try { chrome?.kill(); } catch {}
}
