import assert from "node:assert/strict";
import { existsSync, mkdirSync } from "node:fs";
import { spawn } from "node:child_process";
import net from "node:net";
import path from "node:path";
import { WebSocket } from "ws";

const appRoot = path.resolve("App");
const runtimePath = path.join(appRoot, ".tmp", "healthclues-owner-demo", "owner-demo-runtime.json");
assert.ok(existsSync(runtimePath), "The verified isolated Owner Demo runtime config is required.");
const runtime = JSON.parse(await (await import("node:fs/promises")).readFile(runtimePath, "utf8"));
assert.equal(runtime.projectId, "healthclues-owner-demo");
assert.equal(runtime.apiUrl, "http://127.0.0.1:54321");
const base = process.env.HEALTHCLUES_OWNER_DEMO_URL || "http://127.0.0.1:3271";
assert.equal(new URL(base).hostname, "127.0.0.1", "Only the loopback Owner Demo may be used.");
assert.equal(new URL(base).port, "3271", "This acceptance script is pinned to the newly isolated build.");
const page = await fetch(`${base}/en/wellness/healthclues/quiz?from=play&step=reveal#wellness-plan`);
assert.ok(page.ok, "The new local build route responds.");

const chromePath = [path.join(process.env.PROGRAMFILES || "C:\\Program Files", "Google", "Chrome", "Application", "chrome.exe"), path.join(process.env["PROGRAMFILES(X86)"] || "C:\\Program Files (x86)", "Google", "Chrome", "Application", "chrome.exe")].find(existsSync);
assert.ok(chromePath, "Google Chrome is required for browser verification.");
const temp = path.join(appRoot, ".tmp", `gemini-unavailable-${process.pid}`);
mkdirSync(temp, { recursive: false });
const screenshots = path.join(appRoot, "reports", "previews");
mkdirSync(screenshots, { recursive: true });
const probe = net.createServer();
const debugPort = await new Promise((resolve, reject) => { probe.once("error", reject); probe.listen(0, "127.0.0.1", () => { const result = probe.address().port; probe.close(() => resolve(result)); }); });
const chrome = spawn(chromePath, ["--headless=new", "--no-sandbox", "--disable-gpu", "--disable-background-networking", "--no-first-run", `--remote-debugging-port=${debugPort}`, `--user-data-dir=${temp}`, "about:blank"], { stdio: "ignore", windowsHide: true });
let socket;
try {
  let target;
  for (let i = 0; i < 40; i++) {
    try { const targets = await (await fetch(`http://127.0.0.1:${debugPort}/json`)).json(); target = targets.find(item => item.type === "page"); if (target) break; } catch {}
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  assert.ok(target, "Chromium remote debugging endpoint started.");
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.once("open", resolve); socket.once("error", reject); });
  let nextId = 0;
  const pending = new Map();
  const advisorCalls = [];
  const responses = [];
  socket.on("message", raw => {
    const message = JSON.parse(raw.toString());
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message));
      else resolve(message.result);
      return;
    }
    const item = message.method === "Network.requestWillBeSent" ? message.params : null;
    if (item?.request?.url?.includes("/api/healthclues/wellness-advisor")) advisorCalls.push({ method: item.request.method, url: new URL(item.request.url).pathname, requestId: item.request.headers?.["X-Request-Id"] || item.request.headers?.["x-request-id"] || null });
    if (message.method === "Network.responseReceived" && message.params.response.url.includes("/api/healthclues/wellness-advisor")) responses.push({ status: message.params.response.status });
  });
  const cdp = (method, params = {}) => new Promise((resolve, reject) => { const id = ++nextId; pending.set(id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params })); });
  const evaluate = async expression => { const result = await cdp("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true, userGesture: true }); if (result.exceptionDetails) throw new Error(result.exceptionDetails.text); return result.result?.value; };
  const syntheticProfile = {
    topic: "Sleep & rest", contentPreferences: ["short routines"], presentation: "A mix of everything", comfortableActivityTime: "Under 15 minutes", refreshFrequency: "Weekly", twoWeekGoal: "Explore a wind-down routine", createdAt: new Date().toISOString(), safetyLevel: "none", specificInterests: ["relaxation"], excludedIngredients: [],
    safetyContext: { foodAllergy: "unknown", foodRestriction: "unknown", professionalRestriction: "unknown", activityRestriction: "unknown", medicationOrSupplement: "unknown", acutePainfulJoint: "unknown", urgentSymptoms: "unknown", fluidRestriction: "unknown" },
  };
  await cdp("Network.enable");
  await cdp("Page.navigate", { url: `${base}/play` });
  for (let i = 0; i < 80; i++) {
    const ready = await evaluate("document.readyState === 'complete'").catch(() => false);
    if (ready) break;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  await evaluate(`sessionStorage.setItem('healthclues_discovery_profile_v1',${JSON.stringify(JSON.stringify(syntheticProfile))})`);
  await cdp("Page.navigate", { url: `${base}/en/wellness/healthclues/quiz?from=play&step=reveal#wellness-plan` });
  for (let i = 0; i < 120; i++) {
    const revealed = await evaluate("document.body.innerText.includes('Your adventure is ready!')").catch(() => false);
    if (revealed) break;
    await new Promise(resolve => setTimeout(resolve, 150));
  }
  await evaluate("[...document.querySelectorAll('button')].find(button=>button.innerText.trim().toLowerCase()==='build my wellness plan')?.click()");
  for (let i = 0; i < 150; i++) {
    const ready = await evaluate("!!document.querySelector('[data-healthclues-plan-builder]') && document.querySelector('[data-advisor-status]')?.getAttribute('data-advisor-status') === 'AI_UNAVAILABLE'").catch(() => false);
    if (ready) break;
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  const state = await evaluate(`JSON.stringify({title:document.querySelector('[data-healthclues-plan-builder] h1')?.innerText,status:document.querySelector('[data-advisor-status]')?.dataset.advisorStatus,requestId:document.querySelector('[data-advisor-status]')?.dataset.advisorRequestId,body:document.querySelector('[data-healthclues-plan-builder]')?.innerText,suggestions:document.querySelectorAll('[data-plan-suggestion]').length})`);
  const parsed = JSON.parse(state);
  assert.equal(parsed.title, "Your Suggested Wellness Plan", `Plan Builder did not render: ${JSON.stringify({ url: await evaluate("location.href"), body: await evaluate("document.body.innerText.slice(-1800)") })}`);
  assert.equal(parsed.status, "AI_UNAVAILABLE");
  assert.equal(parsed.suggestions, 0, "No deterministic or TEST ONLY candidate is substituted after provider failure.");
  assert.match(parsed.body, /unavailable|not configured/i);
  assert.ok(!/TEST ONLY.*personalized|deterministic rules/i.test(parsed.body), "The unavailable state does not disguise a fixture as Gemini output.");
  await new Promise(resolve => setTimeout(resolve, 300));
  assert.equal(advisorCalls.filter(call => call.method === "POST").length, 1, "Quiz Plan Builder issued one real browser POST to the server advisor route.");
  assert.equal(responses[0]?.status, 503, "Missing provider configuration returns HTTP 503.");
  await evaluate("document.querySelector('[data-healthclues-plan-builder]')?.scrollIntoView({block:'start'})");
  await cdp("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  let capture = await cdp("Page.captureScreenshot", { format: "png", captureBeyondViewport: false, fromSurface: true });
  const desktopScreenshot = path.join(screenshots, "gemini-advisor-unavailable-desktop-20261031.png");
  await (await import("node:fs/promises")).writeFile(desktopScreenshot, Buffer.from(capture.data, "base64"));
  await cdp("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  capture = await cdp("Page.captureScreenshot", { format: "png", captureBeyondViewport: false, fromSurface: true });
  const mobileScreenshot = path.join(screenshots, "gemini-advisor-unavailable-mobile-20261031.png");
  await (await import("node:fs/promises")).writeFile(mobileScreenshot, Buffer.from(capture.data, "base64"));
  console.log(JSON.stringify({ result: "PASS_UNAVAILABLE_NO_FALLBACK", projectId: runtime.projectId, url: base, providerMode: "AI_UNAVAILABLE", providerResponse: responses[0]?.status, browserAdvisorPosts: advisorCalls.length, syntheticProfile: "Sleep / short routine (sanitized test only)", requestId: advisorCalls[0]?.requestId || parsed.requestId, suggestions: parsed.suggestions, screenshots: [desktopScreenshot, mobileScreenshot].map(file => path.relative(appRoot, file).replaceAll("\\", "/")) }, null, 2));
} finally {
  try { socket?.close(); } catch {}
  try { chrome.kill(); } catch {}
}
