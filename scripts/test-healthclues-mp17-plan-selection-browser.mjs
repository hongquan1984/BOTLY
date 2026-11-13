import assert from "node:assert/strict";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { spawn } from "node:child_process";
import net from "node:net";
import path from "node:path";

const appRoot = path.resolve("App");
const base = process.env.HEALTHCLUES_OWNER_DEMO_URL || "http://127.0.0.1:3304";
assert.equal(new URL(base).hostname, "127.0.0.1", "The fixture browser may only use loopback.");
const runtime = await (await fetch(`${base}/api/healthclues/wellness-habits`)).json();
assert.equal(runtime.availability, "test-only", "Expected the isolated HealthClues owner build.");
const chromePath = [path.join(process.env.PROGRAMFILES || "C:\\Program Files", "Google", "Chrome", "Application", "chrome.exe"), path.join(process.env["PROGRAMFILES(X86)"] || "C:\\Program Files (x86)", "Google", "Chrome", "Application", "chrome.exe")].find(existsSync);
assert.ok(chromePath, "Google Chrome is required.");
const profileDir = path.join(appRoot, ".tmp", `mp17-plan-browser-${process.pid}`);
mkdirSync(profileDir, { recursive: false });
const screenshotDir = path.join(appRoot, "reports", "previews", "mp17-plan-selection-fixture");
mkdirSync(screenshotDir, { recursive: true });
const portProbe = net.createServer();
const debugPort = await new Promise((resolve, reject) => { portProbe.once("error", reject); portProbe.listen(0, "127.0.0.1", () => { const port = portProbe.address().port; portProbe.close(() => resolve(port)); }); });
const pending = new Map();
const exceptions = [];
const fulfilled = [];
let commandId = 0;
let socket;
let chrome;

const goal = (id, locale) => ({
  goalId: id, category: "sleep", title: locale === "vi" ? `Mục tiêu giả lập ${id.endsWith("alpha") ? "A" : "B"}` : `Synthetic goal ${id.endsWith("alpha") ? "alpha" : "beta"}`, relevanceReason: locale === "vi" ? "Chỉ dùng để kiểm tra giao diện; không phải suy luận cá nhân hóa." : "Synthetic UI fixture only; this is not personalized reasoning.",
  optionA: { title: locale === "vi" ? "Mức A" : "Level A", action: locale === "vi" ? "Thao tác giả lập A chỉ để kiểm tra điều khiển." : "Fixture action A shown only to test controls.", target: { value: null, unit: null, frequency: null, period: null } },
  optionB: { title: locale === "vi" ? "Mức B" : "Level B", action: locale === "vi" ? "Thao tác giả lập B chỉ để kiểm tra điều khiển." : "Fixture action B shown only to test controls.", target: { value: null, unit: null, frequency: null, period: null } },
  evidenceSourceIds: ["nhlbi_sleep"], safetyConditions: [], advisorProof: "SYNTHETIC_TEST_ONLY_NOT_SIGNED",
});
let activeLocale = "en";
let fixture = { status: "SYNTHETIC_TEST", requestId: "550e8400-e29b-41d4-a716-446655440000", model: null, suggestions: [], goals: [goal("fixture-goal-alpha", "en"), goal("fixture-goal-beta", "en")], knowledgeCount: 0 };

function cdp(method, params = {}) {
  const id = ++commandId;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { pending.delete(id); reject(new Error(`CDP timeout: ${method}`)); }, 15_000);
    pending.set(id, message => { clearTimeout(timer); if (message.error) reject(new Error(message.error.message)); else resolve(message.result); });
    socket.send(JSON.stringify({ id, method, params }));
  });
}
async function evaluate(expression) { return (await cdp("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true })).result.value; }
async function wait(expression, description) {
  const until = Date.now() + 20_000;
  while (Date.now() < until) { if (await evaluate(expression)) return; await new Promise(resolve => setTimeout(resolve, 200)); }
  throw new Error(`Timed out waiting for ${description}; page=${String(await evaluate("document.body.innerText")).slice(-700)}`);
}
async function click(expression) { assert.equal(await evaluate(`(()=>{const e=${expression};if(!e)return false;e.click();return true})()`), true, `Could not click ${expression}`); }
async function capture(name, width, height, mobile) {
  await cdp("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile });
  await new Promise(resolve => setTimeout(resolve, 350));
  const shot = await cdp("Page.captureScreenshot", { format: "png", captureBeyondViewport: false, fromSurface: true });
  const file = path.join(screenshotDir, name);
  writeFileSync(file, Buffer.from(shot.data, "base64"));
  return path.relative(appRoot, file).replaceAll("\\", "/");
}

try {
  chrome = spawn(chromePath, ["--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", "--disable-background-networking", "--no-proxy-server", "--no-sandbox", `--remote-debugging-port=${debugPort}`, "--remote-allow-origins=*", `--user-data-dir=${profileDir}`, "about:blank"], { stdio: "ignore", windowsHide: true });
  let target;
  for (let attempt = 0; attempt < 80; attempt++) { try { target = await (await fetch(`http://127.0.0.1:${debugPort}/json/new?about:blank`, { method: "PUT" })).json(); if (target.webSocketDebuggerUrl) break; } catch {} await new Promise(resolve => setTimeout(resolve, 150)); }
  assert.ok(target?.webSocketDebuggerUrl, "Chromium DevTools endpoint is available.");
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.addEventListener("open", resolve, { once: true }); socket.addEventListener("error", reject, { once: true }); });
  socket.addEventListener("message", event => {
    const message = JSON.parse(event.data);
    if (message.method === "Runtime.exceptionThrown") exceptions.push(message.params.exceptionDetails.text);
    if (message.method === "Fetch.requestPaused") {
      const paused = message.params;
      if (paused.request.url.includes("/api/healthclues/wellness-advisor")) {
        fulfilled.push(paused.request.url);
        const body = Buffer.from(JSON.stringify(fixture)).toString("base64");
        void cdp("Fetch.fulfillRequest", { requestId: paused.requestId, responseCode: 200, responseHeaders: [{ name: "Content-Type", value: "application/json" }, { name: "Cache-Control", value: "no-store" }], body });
      } else void cdp("Fetch.continueRequest", { requestId: paused.requestId });
    }
    if (message.id && pending.has(message.id)) { const done = pending.get(message.id); pending.delete(message.id); done(message); }
  });
  await cdp("Page.enable"); await cdp("Runtime.enable"); await cdp("Fetch.enable", { patterns: [{ urlPattern: "*://*/api/healthclues/wellness-advisor*", requestStage: "Request" }] });
  const profile = { topic: "Sleep / Insomnia", contentPreferences: [], presentation: "", comfortableActivityTime: "", refreshFrequency: "Weekly", twoWeekGoal: "Improve sleep routine", createdAt: new Date().toISOString(), safetyLevel: "none", specificInterests: [], safetyContext: { foodAllergy: "unknown", foodRestriction: "unknown", professionalRestriction: "unknown", activityRestriction: "unknown", medicationOrSupplement: "unknown", acutePainfulJoint: "unknown", urgentSymptoms: "unknown", fluidRestriction: "unknown" } };
  await cdp("Page.addScriptToEvaluateOnNewDocument", { source: `sessionStorage.setItem('healthclues_discovery_profile_v1',${JSON.stringify(JSON.stringify(profile))});sessionStorage.setItem('healthclues-selected-quest',location.pathname.startsWith('/vi')?'health-concern':'sleep-better')` });
  await cdp("Page.navigate", { url: `${base}/en/wellness/healthclues/quiz?from=play&step=reveal#wellness-plan` });
  await wait("[...document.querySelectorAll('button')].some(e=>e.innerText.includes('BUILD MY WELLNESS PLAN'))", "the real Reveal action");
  await click("[...document.querySelectorAll('button')].find(e=>e.innerText.includes('BUILD MY WELLNESS PLAN'))");
  await wait("!!document.querySelector('[data-healthclues-plan-builder]')", "the real Plan Builder with a synthetic UI response");
  await wait("document.querySelector('[data-advisor-status]')?.dataset.advisorStatus==='SYNTHETIC_TEST'", "the explicit synthetic fixture banner");
  const petEn = await evaluate("(()=>{const p=document.querySelector('.hc-pet-luna'),b=document.querySelector('[class*=petSpeech]');if(!p||!b)return null;const a=p.getBoundingClientRect(),r=b.getBoundingClientRect();return {name:p.getAttribute('aria-label'),portraitVisible:a.width>0&&a.height>0,bubbleVisible:r.width>0&&r.height>0,copy:b.innerText}})()");
  assert.ok(petEn?.name?.startsWith("Luna,") && petEn.portraitVisible && petEn.bubbleVisible && petEn.copy.includes("Choose what feels right"), `Sleep Valley guidance uses the actual visible Luna portrait and concise English bubble: ${JSON.stringify(petEn)}`);
  const iconAudit = await evaluate("(async()=>{const e=document.querySelector('[data-ai-goal] .hc-game-icon');if(!e)return null;const s=getComputedStyle(e),r=e.getBoundingClientRect(),response=await fetch('/healthclues/assets/ui/goal-icons/sleep-rest.svg');return {mask:s.maskImage,background:s.backgroundColor,width:r.width,height:r.height,assetLoaded:response.ok&&response.headers.get('content-type')?.includes('image/svg+xml')}})()");
  assert.ok(iconAudit?.mask?.includes("sleep-rest.svg") && iconAudit.assetLoaded && iconAudit.width >= 24 && iconAudit.height >= 24 && iconAudit.background !== "rgba(0, 0, 0, 0)", `The cozy category SVG is loaded, tinted and visibly sized: ${JSON.stringify(iconAudit)}`);
  assert.ok((await evaluate("document.body.innerText")).includes("not Gemini-generated"), "The browser visibly labels the fixture as synthetic, not Gemini output.");
  assert.equal(await evaluate("[...document.querySelectorAll('[data-ai-goal] input[type=checkbox]')].every(e=>!e.checked)"), true, "All generated goal include boxes start unchecked.");
  const desktopShot = await capture("desktop-unselected.png", 1440, 900, false);
  await click("document.querySelector('[data-ai-goal] input[type=radio][aria-label*=A]')");
  assert.equal(await evaluate("document.querySelector('[data-ai-goal] input[type=checkbox]').checked"), false, "Choosing a level does not auto-check its goal.");
  assert.equal(await evaluate("document.querySelector('[data-selected-goal-count]').innerText.includes('0/2')"), true, "Option choice alone leaves selected count at zero.");
  await click("document.querySelector('[data-ai-goal] input[type=checkbox]')");
  assert.equal(await evaluate("document.querySelector('[data-selected-goal-count]').innerText.includes('1/2')"), true, "Checking independently updates the selection count.");
  await click("document.querySelector('[data-ai-goal] input[type=checkbox]')");
  assert.equal(await evaluate("document.querySelector('[data-selected-goal-count]').innerText.includes('0/2')"), true, "Unchecking removes the goal from the selection count.");
  await click("document.querySelector('[data-ai-goal] input[type=checkbox]')");
  await click("document.querySelector('[data-ai-goal] input[type=radio][aria-label*=B]')");
  assert.equal(await evaluate("document.querySelector('[data-ai-goal] input[type=checkbox]').checked"), true, "Choosing another level preserves the independent checked state.");
  await click("[...document.querySelector('[data-ai-goal]').querySelectorAll('input[type=radio]')][2]");
  await evaluate("(()=>{const e=document.querySelector('[data-ai-goal] input[maxlength=180]');const s=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;s.call(e,'My chosen routine');e.dispatchEvent(new Event('input',{bubbles:true}));})()");
  await click("[...document.querySelectorAll('[data-ai-goal] button')].find(e=>e.innerText.includes('Use my goal'))");
  assert.equal(await evaluate("document.querySelector('[data-selected-goal-count]').innerText.includes('1/2')"), true, "Custom implementation remains under the independently checked goal.");
  assert.equal(await evaluate("[...document.querySelectorAll('button')].find(e=>e.innerText.includes('Continue My Journey'))?.disabled"), true, "A synthetic fixture cannot enter the persistent plan flow.");
  const mobileShot = await capture("mobile-custom-selected.png", 390, 844, true);
  assert.equal(await evaluate("document.documentElement.scrollWidth<=innerWidth+1"), true, "Mobile layout has no horizontal overflow.");
  activeLocale = "vi";
  fixture = { ...fixture, goals: [goal("fixture-goal-alpha", "vi"), goal("fixture-goal-beta", "vi")] };
  await evaluate("localStorage.setItem('healthclues-player-locale-v1','vi')");
  await cdp("Page.navigate", { url: `${base}/vi/wellness/healthclues/quiz?from=play&step=reveal#wellness-plan` });
  await wait("[...document.querySelectorAll('button')].some(e=>e.innerText.includes('TẠO KẾ HOẠCH SỨC KHỎE'))", "Vietnamese Quiz Reveal");
  await click("[...document.querySelectorAll('button')].find(e=>e.innerText.includes('TẠO KẾ HOẠCH SỨC KHỎE'))");
  await wait("document.querySelector('[data-advisor-status]')?.dataset.advisorStatus==='SYNTHETIC_TEST'", "localized synthetic fixture in Vietnamese Builder");
  const petVi = await evaluate("(()=>{const p=document.querySelector('.hc-pet-lumi'),b=document.querySelector('[class*=petSpeech]');return {name:p?.getAttribute('aria-label'),copy:b?.innerText}})()");
  assert.ok(petVi?.name?.startsWith("Lumi,") && petVi.copy.includes("Mình ở đây") && petVi.copy.includes("chọn điều phù hợp"), `HealthClues Realm uses the Lumi portrait and fully Vietnamese guidance: ${JSON.stringify(petVi)}`);
  const vietnameseText = await evaluate("document.querySelector('[data-healthclues-plan-builder]').innerText");
  assert.ok(vietnameseText.includes("Kế hoạch sức khỏe dành riêng cho bạn") && vietnameseText.includes("Tự điều chỉnh") && vietnameseText.includes("DỮ LIỆU KIỂM THỬ GIẢ LẬP"), `Vietnamese Builder labels and fixture disclosure render in Vietnamese: ${vietnameseText.slice(0, 900)}`);
  assert.equal(await evaluate("[...document.querySelectorAll('[data-ai-goal] input[type=checkbox]')].every(e=>!e.checked)"), true, "Vietnamese suggestions also start unchecked.");
  await click("document.querySelector('[data-ai-goal] input[type=checkbox]')");
  const viShot = await capture("vietnamese-mobile-selected.png", 390, 844, true);
  assert.equal(await evaluate("document.documentElement.scrollWidth<=innerWidth+1"), true, "Vietnamese mobile layout has no horizontal overflow.");
  assert.deepEqual(exceptions, [], "No uncaught browser exceptions.");
  assert.ok(fulfilled.length, "The synthetic Advisor response was intercepted; no real provider call was made.");
  assert.equal(activeLocale, "vi");
  console.log(JSON.stringify({ result: "PASS_SYNTHETIC_UI_ONLY", fixture: "explicitly marked and non-persistable", realGemini: "NOT CALLED", url: base, screenshots: [desktopShot, mobileShot, viShot], assertions: 16, runtimeExceptions: 0 }, null, 2));
} finally { try { socket?.close(); } catch {} try { chrome?.kill(); } catch {} }
