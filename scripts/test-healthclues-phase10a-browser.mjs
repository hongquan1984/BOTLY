import assert from "node:assert/strict";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { spawn } from "node:child_process";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const base = process.env.HEALTHCLUES_OWNER_DEMO_URL || "http://127.0.0.1:3258";
const inbox = "http://127.0.0.1:54324";
const email = "hc-phase10a-" + Date.now() + "@example.invalid";
const chromePath = [path.join(process.env.PROGRAMFILES || "C:\\Program Files", "Google", "Chrome", "Application", "chrome.exe"), path.join(process.env["PROGRAMFILES(X86)"] || "C:\\Program Files (x86)", "Google", "Chrome", "Application", "chrome.exe")].find(existsSync);
assert.ok(chromePath, "Google Chrome is required.");
const probe = net.createServer();
const debugPort = await new Promise((resolve, reject) => { probe.once("error", reject); probe.listen(0, "127.0.0.1", () => { const p = probe.address().port; probe.close(() => resolve(p)); }); });
const profileDir = path.join(root, "App", ".tmp", "phase10a-chrome-" + process.pid);
mkdirSync(profileDir, { recursive: false });
const screenshotDir = path.join(root, "App", "reports", "previews");
mkdirSync(screenshotDir, { recursive: true });
let chrome, ws, commandId = 0;
const pending = new Map(), runtimeErrors = [];
let handoffResponse = [];
const networkMethods = new Map();
async function cdp(method, params = {}) {
  const id = ++commandId; ws.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => { const timer = setTimeout(() => { pending.delete(id); reject(new Error("CDP timeout: " + method)); }, 15000); pending.set(id, msg => { clearTimeout(timer); if (msg.error) reject(new Error(msg.error.message)); else resolve(msg.result); }); });
}
async function evaluate(expression) {
  const result = await cdp("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true, userGesture: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text || "Browser evaluation failed.");
  return result.result?.value;
}
async function waitFor(predicate, label, timeout = 30000) {
  const until = Date.now() + timeout;
  while (Date.now() < until) { if (await predicate().catch(() => false)) return; await new Promise(resolve => setTimeout(resolve, 250)); }
  const state = await evaluate("JSON.stringify({url:location.origin+location.pathname+location.search,body:document.body.innerText.slice(0,1600)})").catch(e => e.message);
  throw new Error("Timed out: " + label + " " + state);
}
async function waitText(text, timeout) { return waitFor(() => evaluate("document.body.innerText.includes(" + JSON.stringify(text) + ")"), text, timeout); }
async function clickButton(text, nth = 0) {
  const ok = await evaluate("(()=>{const xs=[...document.querySelectorAll('button')].filter(x=>x.innerText.trim().toLowerCase().includes(" + JSON.stringify(text.toLowerCase()) + "));const b=xs[" + nth + "];if(!b||b.disabled)return false;b.click();return true})()");
  assert.equal(ok, true, "Could not click enabled button: " + text);
}
async function fill(selector, value) {
  const ok = await evaluate("(()=>{const e=document.querySelector(" + JSON.stringify(selector) + ");if(!e)return false;const p=e instanceof HTMLTextAreaElement?HTMLTextAreaElement.prototype:e instanceof HTMLSelectElement?HTMLSelectElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(p,'value').set.call(e," + JSON.stringify(value) + ");e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));return true})()");
  assert.equal(ok, true, "Could not fill control: " + selector);
}
async function capture(name, width, height, mobile) {
  await cdp("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile });
  await new Promise(resolve => setTimeout(resolve, 500));
  const shot = await cdp("Page.captureScreenshot", { format: "png", captureBeyondViewport: false, fromSurface: true });
  const file = path.join(screenshotDir, name + ".png"); writeFileSync(file, Buffer.from(shot.data, "base64")); return file;
}
async function verificationUrl(targetEmail) {
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    const response = await fetch(inbox + "/api/v1/messages?limit=30", { signal: AbortSignal.timeout(5000) }); assert.ok(response.ok, "Local Mailpit API responds.");
    const items = (await response.json()).messages || [];
    for (const item of items) {
      const id = item.ID || item.Id || item.id; if (!id) continue;
      const detailResponse = await fetch(inbox + "/api/v1/message/" + encodeURIComponent(id), { signal: AbortSignal.timeout(5000) }); if (!detailResponse.ok) continue;
      const detail = await detailResponse.json(); const recipients = JSON.stringify(detail.To || detail.to || item.To || item.to || "").toLowerCase(); if (!recipients.includes(targetEmail.toLowerCase())) continue;
      const body = (String(detail.HTML || detail.Html || detail.html || "") + "\n" + String(detail.Text || detail.text || "")).replaceAll("&amp;", "&");
      const match = body.match(/https?:\/\/[^\s\"'<>]+\/auth\/v1\/verify\?[^\s\"'<>]+/i); if (match) return match[0].replace(/[),.;]+$/, "");
    }
    await new Promise(resolve => setTimeout(resolve, 350));
  }
  throw new Error("Local verification email did not appear in Mailpit.");
}

try {
  chrome = spawn(chromePath, ["--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", "--disable-background-networking", "--no-proxy-server", "--no-sandbox", "--remote-debugging-port=" + debugPort, "--remote-allow-origins=*", "--user-data-dir=" + profileDir, "about:blank"], { stdio: "ignore", windowsHide: true });
  let target;
  for (let i = 0; i < 60; i++) { try { target = await (await fetch("http://127.0.0.1:" + debugPort + "/json/new?about:blank", { method: "PUT" })).json(); if (target.webSocketDebuggerUrl) break; } catch {} await new Promise(resolve => setTimeout(resolve, 150)); }
  assert.ok(target?.webSocketDebuggerUrl, "Chrome DevTools is available.");
  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.addEventListener("open", resolve, { once: true }); ws.addEventListener("error", reject, { once: true }); });
  ws.addEventListener("message", event => { const msg = JSON.parse(event.data); if (msg.method === "Runtime.exceptionThrown") runtimeErrors.push(msg.params.exceptionDetails); if (msg.method === "Network.requestWillBeSent" && String(msg.params.request?.url || "").includes("/api/healthclues/pending-journey")) networkMethods.set(msg.params.requestId, msg.params.request.method); if (msg.method === "Network.responseReceived" && String(msg.params.response?.url || "").includes("/api/healthclues/pending-journey")) handoffResponse.push({ method: networkMethods.get(msg.params.requestId), status: msg.params.response.status, headers: Object.keys(msg.params.response.headers || {}).map(key => key.toLowerCase()) }); if (msg.method === "Network.responseReceivedExtraInfo" && networkMethods.get(msg.params.requestId) === "POST") handoffResponse.push({ method: "POST-extra", status: msg.params.statusCode, headers: Object.keys(msg.params.headers || {}).map(key => key.toLowerCase()), blockedCookieReasons: (msg.params.blockedCookies || []).map(cookie => cookie.blockedReasons) }); if (msg.id && pending.has(msg.id)) { const resolve = pending.get(msg.id); pending.delete(msg.id); resolve(msg); } });
  await cdp("Page.enable"); await cdp("Runtime.enable"); await cdp("Log.enable"); await cdp("Network.enable");
  await cdp("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await cdp("Page.navigate", { url: base + "/play" }); await waitText("START ADVENTURE"); await clickButton("START ADVENTURE"); await waitText("Two adventures are open"); await clickButton("HealthClues Realm"); await waitText("Question 1 of 10"); await clickButton("Yes"); await clickButton("Next");
  let goutTopicSeen = false;
  for (let q = 2; q <= 9; q++) {
    await waitText("Question " + q + " of 10");
    const body = await evaluate("document.body.innerText");
    if (body.includes("Which health or wellness topic interests you most right now?")) { goutTopicSeen = true; await clickButton("Gout & uric acid"); await clickButton("Next"); }
    else await clickButton("Skip");
  }
  await waitText("Question 10 of 10"); await clickButton("Skip"); assert.ok(goutTopicSeen, "The original ten-question Quiz asks and retains Gout/Uric Acid.");
  await waitText("Your adventure is ready!"); const revealShot = await capture("phase10a-gout-discovery-reveal-desktop", 1440, 900, false); await clickButton("BUILD MY WELLNESS PLAN"); await waitText("Your Suggested Wellness Plan");
  await waitFor(() => evaluate("!document.body.innerText.includes('Finding current catalog entries')"), "catalog loading completes");
  const startState = JSON.parse(await evaluate("JSON.stringify({text:document.body.innerText,items:[...document.querySelectorAll('[data-plan-suggestion]')].map(e=>({id:e.dataset.planSuggestion,text:e.innerText,disabled:e.querySelector('button')?.disabled})),overflow:document.documentElement.scrollWidth>innerWidth})"));
  assert.ok(startState.items.length > 0, "Plan Builder displays actual local Catalog entries.");
  assert.ok(!/2,?000\s*mL|2 liters|11\s*PM|15 minutes of walking/i.test(startState.text), "No universal 2-liter, 11 PM or walking target is imposed.");
  const planDesktop = await capture("phase10a-gout-plan-builder-desktop", 1440, 900, false);
  const planMobile = await capture("phase10a-gout-plan-builder-mobile", 390, 844, true);
  const mobileOverflow = await evaluate("document.documentElement.scrollWidth>innerWidth"); assert.equal(mobileOverflow, false, "Plan Builder has no horizontal overflow at 390px.");
  await cdp("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  const safeIds = startState.items.filter(item => !item.disabled && /I can do this/.test(item.text)).map(item => item.id);
  assert.ok(safeIds.length >= 2, "At least two suggestions pass the UI safety gate for a voluntary selection.");
  const choose = async id => { const result = await evaluate("(()=>{const c=document.querySelector('[data-plan-suggestion=" + JSON.stringify(id) + "]');const b=[...(c?.querySelectorAll('button')||[])].find(x=>x.innerText.includes('I can do this'));if(!b||b.disabled)return false;b.click();return true})()"); assert.equal(result, true, "Eligible card can be explicitly chosen: " + id); };
  await choose(safeIds[0]);
  await fill('[aria-label^="Schedule for"]', "3 days a week"); await choose(safeIds[1]);
  const skippedId = startState.items.find(item => !safeIds.slice(0, 2).includes(item.id))?.id;
  if (skippedId) await evaluate("(()=>{const c=document.querySelector('[data-plan-suggestion=" + JSON.stringify(skippedId) + "]');const b=[...(c?.querySelectorAll('button')||[])].find(x=>x.innerText.includes('Not for me / Skip'));b?.click();return !!b})()");
  await evaluate("[...document.querySelectorAll('summary')].find(x=>x.innerText.includes('Add My Own Goal'))?.click()");
  await fill('input[placeholder="e.g. Include vegetables with lunch"]', "Drink 2 liters of water every day");
  await fill('input[placeholder="e.g. I will note whether I chose vegetables with lunch"]', "I will record the amount");
  await clickButton("Add personal goal"); await waitFor(() => evaluate("!!document.querySelector('[role=alert]')"), "unsafe personal target is rejected");
  const unsafeGoalMessage = await evaluate("document.querySelector('[role=alert]')?.innerText||''"); assert.match(unsafeGoalMessage, /fluid|target|professional/i, "Unknown fluid safety does not permit a fixed water target.");
  await fill('input[placeholder="e.g. Include vegetables with lunch"]', "Reduce sugary drinks for three days");
  await fill('input[placeholder="e.g. I will note whether I chose vegetables with lunch"]', "I will note each day I chose not to drink sugary drinks");
  await evaluate("(()=>{const s=[...document.querySelectorAll('select')].find(e=>[...e.options].some(o=>o.value==='nutrition'));if(!s)return false;Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set.call(s,'nutrition');s.dispatchEvent(new Event('input',{bubbles:true}));s.dispatchEvent(new Event('change',{bubbles:true}));const g=[...document.querySelectorAll('select')].find(e=>[...e.options].some(o=>o.value==='reduce'));if(!g)return false;Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set.call(g,'reduce');g.dispatchEvent(new Event('change',{bubbles:true}));return true})()");
  await clickButton("Add personal goal"); await waitFor(() => evaluate("document.querySelector('input[placeholder=\"e.g. Include vegetables with lunch\"]')?.value === '' || !!document.querySelector('[role=alert]')"), "custom goal validation response");
  const customValidation = await evaluate("document.querySelector('[role=alert]')?.innerText||''"); assert.equal(customValidation, "", "The safe personal goal is accepted by the planner.");
  const customShot = await capture("phase10a-custom-goal-added-desktop", 1440, 900, false);
  await clickButton("Review my plan"); await waitText("My Wellness Plan");
  const reviewText = await evaluate("document.body.innerText"); assert.ok(reviewText.includes("Active Daily Goals") && reviewText.includes("Reduce sugary drinks for three days"), "Review includes accepted catalog goals and the confirmed custom goal.");
  const reviewShot = await capture("phase10a-gout-plan-review-desktop", 1440, 900, false); await clickButton("Confirm plan and continue"); await waitText("READ-ONLY PREVIEW");
  const previewShot = await capture("phase10a-gout-world-preview-desktop", 1440, 900, false); await clickButton("START YOUR JOURNEY"); await waitText("Create Your Adventure");
  await fill("#hc-activation-email", email); await evaluate("document.querySelector('input[type=checkbox]')?.click()"); await clickButton("Send secure verification link"); await waitText("Check your email for the secure verification link.");
  const pendingCookiePresent = (await cdp("Network.getAllCookies")).cookies.some(cookie => cookie.name === "hc-pending-journey" && cookie.domain.includes("127.0.0.1"));
  if (!pendingCookiePresent) console.error("Safe handoff diagnostic:", JSON.stringify({ pendingCookiePresent, handoffResponse }));
  assert.equal(pendingCookiePresent, true, "Encrypted handoff cookie is stored before leaving the preview for email verification.");
  const activationShot = await capture("phase10a-gout-activation-desktop", 1440, 900, false);
  const verify = await verificationUrl(email); await cdp("Page.navigate", { url: verify });
  await waitFor(() => evaluate("document.body.innerText.includes('Prepare your backpack') || document.body.innerText.includes('different email')"), "local verification callback", 45000);
  const callbackDiagnostic = await evaluate("document.body.innerText.includes('different email') ? (async()=>{const token=new URLSearchParams(location.hash.slice(1)).get('access_token');if(!token)return JSON.stringify({tokenPresent:false});const r=await fetch('/api/healthclues/pending-journey',{headers:{Authorization:'Bearer '+token},cache:'no-store'});const p=r.ok?await r.json():null;return JSON.stringify({tokenPresent:true,pendingStatus:r.status,pendingEmailMatchesAuth:!!p&&p.email===JSON.parse(atob(token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'))).email?.trim().toLowerCase(),pendingExists:!!p})})() : JSON.stringify({verified:true})");
  const callbackDiagnosticData = JSON.parse(callbackDiagnostic);
  if (!callbackDiagnosticData.verified) console.error("Safe activation diagnostic:", JSON.stringify(callbackDiagnosticData));
  assert.ok(callbackDiagnosticData.verified || (callbackDiagnosticData.pendingExists && callbackDiagnosticData.pendingEmailMatchesAuth), "Encrypted pending onboarding survives the verified local email redirect.");
  await waitText("START EXPLORING"); await clickButton("START EXPLORING"); await waitText("MY WELLNESS WORLD", 45000); await waitText("What should we call you?"); await fill("#hc-player-nickname", "Phase Ten A"); await clickButton("Save nickname"); await waitText("Welcome, Phase Ten A");
  const authSnapshot = JSON.parse(await evaluate("(async()=>{const s=JSON.parse(localStorage.getItem('botly-cloud-session'));const r=await fetch('/api/healthclues/world',{headers:{Authorization:'Bearer '+s.access_token},cache:'no-store'});const p=await r.json();const q=await fetch('/api/healthclues/plan?worldId='+encodeURIComponent(p.world.id),{headers:{Authorization:'Bearer '+s.access_token},cache:'no-store'});const plan=await q.json();return JSON.stringify({userId:s.user.id,accessToken:s.access_token,worldId:p.world.id,region:p.world.region_id,topic:p.branches?.[0]?.topic_key,planStatus:q.status,plan:plan.plan})})()"));
  assert.ok(authSnapshot.userId && authSnapshot.worldId, "Local activation creates an authenticated account and World.");
  assert.equal(authSnapshot.planStatus, 200, "Confirmed Plan is readable by the authenticated account.");
  assert.equal(authSnapshot.plan.worldId, authSnapshot.worldId, "Plan revision belongs to the activated World.");
  assert.ok(authSnapshot.plan.goals.some(g => g.title === "Reduce sugary drinks for three days"), "Custom self-created goal persists in the World Plan.");
  const duplicateConfirmation = await fetch(base + "/api/healthclues/plan", { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + authSnapshot.accessToken }, body: JSON.stringify({ worldId: authSnapshot.worldId, requestKey: authSnapshot.plan.requestKey, confirmed: true, goals: authSnapshot.plan.goals }), cache: "no-store" }).then(async response => ({ status: response.status, body: await response.json() }));
  assert.equal(duplicateConfirmation.status, 200, "Retrying an identical Plan confirmation is accepted idempotently."); assert.equal(duplicateConfirmation.body.reused, true, "Duplicate confirmation reuses the same revision.");
  const worldDesktop = await capture("phase10a-health-realm-world-desktop", 1440, 900, false);
  const worldMobile = await capture("phase10a-health-realm-world-mobile", 390, 844, true);
  assert.equal(await evaluate("document.documentElement.scrollWidth<=innerWidth+1"), true, "Authenticated game fits the mobile viewport.");
  await cdp("Page.reload", { ignoreCache: true }); await waitText("Welcome, Phase Ten A", 45000);
  const persisted = JSON.parse(await evaluate("(async()=>{const s=JSON.parse(localStorage.getItem('botly-cloud-session'));const r=await fetch('/api/healthclues/world',{headers:{Authorization:'Bearer '+s.access_token},cache:'no-store'});const p=await r.json();const q=await fetch('/api/healthclues/plan?worldId='+encodeURIComponent(p.world.id),{headers:{Authorization:'Bearer '+s.access_token},cache:'no-store'});const d=await q.json();return JSON.stringify({worldId:p.world.id,plan:d.plan,regionMap:!!document.querySelector('[data-region-map]'),dailyCare:!!document.querySelector('[data-daily-plan-preview]')})})()"));
  assert.equal(persisted.worldId, authSnapshot.worldId, "The same World ID survives browser reload.");
  assert.equal(persisted.plan.version, authSnapshot.plan.version, "The confirmed Plan revision survives reload.");
  assert.equal(persisted.regionMap, true, "HealthClues Realm gameplay map renders after activation.");
  assert.equal(await evaluate("!!document.querySelector('[data-region-map]') && document.body.innerText.includes('Skip tour')"), true, "The new HealthClues player sees the Pet guide on the active map.");
  await clickButton("Skip tour"); await evaluate("document.querySelector('[data-landmark=camp]')?.click();true"); await waitFor(() => evaluate("!!document.querySelector('[data-interact-landmark=camp]')"), "arrive at Adventure Camp"); await clickButton("Interact"); await waitFor(() => evaluate("!!document.querySelector('[data-daily-plan-preview]')"), "Daily Care plan preview at Camp");
  const dailyCareDesktop = await capture("phase10a-daily-care-preview-desktop",1440,900,false); const dailyCareMobile = await capture("phase10a-daily-care-preview-mobile",390,844,true);
  assert.equal(await evaluate("document.documentElement.scrollWidth<=innerWidth+1"),true,"Daily Care preview fits mobile.");
  const guestStatus = await evaluate("(async()=>{localStorage.removeItem('botly-cloud-session');return (await fetch('/api/healthclues/plan?worldId=" + authSnapshot.worldId + "')).status})()");
  assert.equal(guestStatus, 401, "Guest requests cannot read a private Plan.");
  await evaluate("sessionStorage.clear();location.href='/play'"); await waitText("START ADVENTURE",45000); await clickButton("START ADVENTURE"); await waitText("Two adventures are open"); await clickButton("Sleep Valley"); await waitText("Question 1 of 10"); await clickButton("Yes"); await clickButton("Next");
  let sleepTopicSeen = false;
  for (let q=2;q<=9;q++) { await waitText("Question "+q+" of 10"); const body=await evaluate("document.body.innerText"); if(body.includes("Which health or wellness topic interests you most right now?")){sleepTopicSeen=true;await clickButton("Sleep & rest");await clickButton("Next");}else await clickButton("Skip"); }
  await waitText("Question 10 of 10");await clickButton("Skip");assert.equal(sleepTopicSeen,true,"Sleep topic is collected within the original Quiz.");await waitText("Your adventure is ready!");await clickButton("BUILD MY WELLNESS PLAN");await waitText("Your Suggested Wellness Plan");await waitFor(()=>evaluate("!document.body.innerText.includes('Finding current catalog entries')"),"Sleep Catalog loading");
  const sleepItems=JSON.parse(await evaluate("JSON.stringify([...document.querySelectorAll('[data-plan-suggestion]')].map(e=>e.dataset.planSuggestion))"));assert.notDeepEqual(sleepItems,startState.items.map(item=>item.id),"Sleep and Gout suggestions differ.");
  const sleepPlanShot=await capture("phase10a-sleep-plan-builder-desktop",1440,900,false);const sleepPlanMobile=await capture("phase10a-sleep-plan-builder-mobile",390,844,true);assert.equal(await evaluate("document.documentElement.scrollWidth<=innerWidth+1"),true,"Sleep Plan fits mobile.");
  const sleepCandidate=sleepItems.includes("hc-demo-wind-down")?"hc-demo-wind-down":sleepItems.includes("hc-demo-breath-awareness")?"hc-demo-breath-awareness":sleepItems[0];await choose(sleepCandidate);await clickButton("Review my plan");await waitText("My Wellness Plan");await clickButton("Confirm plan and continue");await waitText("READ-ONLY PREVIEW");const sleepPreviewShot=await capture("phase10a-sleep-world-preview-desktop",1440,900,false);await clickButton("START YOUR JOURNEY");await waitText("Create Your Adventure");
  const sleepEmail="hc-phase10a-sleep-"+Date.now()+"@example.invalid";await fill("#hc-activation-email",sleepEmail);await evaluate("document.querySelector('input[type=checkbox]')?.click()");await clickButton("Send secure verification link");await waitText("Check your email for the secure verification link.");const sleepVerify=await verificationUrl(sleepEmail);await cdp("Page.navigate",{url:sleepVerify});await waitFor(()=>evaluate("document.body.innerText.includes('Prepare your backpack')||document.body.innerText.includes('different email')"),"Sleep email callback",45000);assert.equal(await evaluate("document.body.innerText.includes('different email')"),false,"Sleep verification retains encrypted pending data.");
  await waitText("START EXPLORING");await clickButton("START EXPLORING");await waitText("MY WELLNESS WORLD",45000);await waitText("What should we call you?");await fill("#hc-player-nickname","Sleep Wayfinder");await clickButton("Save nickname");await waitText("Welcome, Sleep Wayfinder");
  const sleepAccount=JSON.parse(await evaluate("(async()=>{const s=JSON.parse(localStorage.getItem('botly-cloud-session'));const r=await fetch('/api/healthclues/world',{headers:{Authorization:'Bearer '+s.access_token},cache:'no-store'});const p=await r.json();const q=await fetch('/api/healthclues/plan?worldId='+p.world.id,{headers:{Authorization:'Bearer '+s.access_token},cache:'no-store'});return JSON.stringify({userId:s.user.id,accessToken:s.access_token,worldId:p.world.id,plan:(await q.json()).plan})})()"));
  assert.notEqual(sleepAccount.userId,authSnapshot.userId,"Synthetic Sleep player is a separate account.");assert.notEqual(sleepAccount.worldId,authSnapshot.worldId,"Each synthetic account owns a separate World.");assert.ok(sleepAccount.plan?.goals.some(goal=>goal.templateId===sleepCandidate),"Sleep Plan persists with its World.");
  const crossReadA=await evaluate("(async()=>{const s=JSON.parse(localStorage.getItem('botly-cloud-session'));return (await fetch('/api/healthclues/plan?worldId="+authSnapshot.worldId+"',{headers:{Authorization:'Bearer '+s.access_token},cache:'no-store'})).status})()");
  const crossReadB=await fetch(base+"/api/healthclues/plan?worldId="+encodeURIComponent(sleepAccount.worldId),{headers:{Authorization:"Bearer "+authSnapshot.accessToken},cache:"no-store"}).then(r=>r.status);
  const crossWrite=await fetch(base+"/api/healthclues/plan",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+sleepAccount.accessToken},body:JSON.stringify({worldId:authSnapshot.worldId,requestKey:"6f26163a-b8a7-4e52-a79f-1e8be70ac451",confirmed:true,goals:[]}),cache:"no-store"}).then(r=>r.status);
  assert.equal(crossReadA,404,"Account B cannot read account A Plan.");assert.equal(crossReadB,404,"Account A cannot read account B Plan.");assert.equal(crossWrite,404,"Account B cannot write into account A World.");
  await cdp("Page.reload",{ignoreCache:true});await waitText("Welcome, Sleep Wayfinder",45000);const sleepPersisted=JSON.parse(await evaluate("(async()=>{const s=JSON.parse(localStorage.getItem('botly-cloud-session'));const r=await fetch('/api/healthclues/world',{headers:{Authorization:'Bearer '+s.access_token},cache:'no-store'});const p=await r.json();const q=await fetch('/api/healthclues/plan?worldId='+p.world.id,{headers:{Authorization:'Bearer '+s.access_token},cache:'no-store'});return JSON.stringify({worldId:p.world.id,plan:(await q.json()).plan,scene:!!document.querySelector('[data-region-map]')})})()"));assert.equal(sleepPersisted.worldId,sleepAccount.worldId,"Sleep World ID persists after reload.");assert.equal(sleepPersisted.plan.version,sleepAccount.plan.version,"Sleep Plan revision persists after reload.");assert.equal(sleepPersisted.scene,true,"Sleep Valley gameplay map renders.");
  const sleepWorldDesktop=await capture("phase10a-sleep-valley-world-desktop",1440,900,false);const sleepWorldMobile=await capture("phase10a-sleep-valley-world-mobile",390,844,true);assert.equal(await evaluate("document.documentElement.scrollWidth<=innerWidth+1"),true,"Sleep map fits mobile.");
  assert.deepEqual(runtimeErrors, [], "No uncaught Chromium runtime errors occur in the verified flow.");
  console.log(JSON.stringify({ result: "PASS", scenario: "Gout + Sleep Wellness Plans, verified local activation, Plan/World persistence, Daily Care preview and two-account isolation", appUrl: base + "/play", localAuth: "verified through Mailpit", gout: { userId: authSnapshot.userId, worldId: authSnapshot.worldId, planVersion: authSnapshot.plan.version, suggestions: startState.items.map(x=>x.id), unsafeFixedFluidTarget: "rejected", duplicateConfirmation: duplicateConfirmation.body.reused }, sleep: { userId: sleepAccount.userId, worldId: sleepAccount.worldId, selectedSuggestion: sleepCandidate, planVersion: sleepAccount.plan.version }, crossAccount: { guestRead: guestStatus, accountBReadA: crossReadA, accountAReadB: crossReadB, accountBWriteA: crossWrite }, screenshots: [revealShot,planDesktop,planMobile,customShot,reviewShot,previewShot,activationShot,worldDesktop,worldMobile,dailyCareDesktop,dailyCareMobile,sleepPlanShot,sleepPlanMobile,sleepPreviewShot,sleepWorldDesktop,sleepWorldMobile], mobileOverflow: false, runtimeErrors: runtimeErrors.length }, null, 2));
} finally {
  try { ws?.close(); } catch {}
  if (chrome?.pid) { try { process.kill(chrome.pid); } catch {} }
}
