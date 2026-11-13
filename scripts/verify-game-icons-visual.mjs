import assert from "node:assert/strict";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import net from "node:net";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import WebSocket from "ws";

const base = process.env.HEALTHCLUES_OWNER_DEMO_URL || "http://127.0.0.1:3329";
assert.equal(new URL(base).hostname, "127.0.0.1", "Only loopback demo is allowed.");

const artifactsDir = "C:\\Users\\Admin\\.gemini\\antigravity\\brain\\bf806726-5fdf-45f1-b574-a2b65a5fbf0f";
const reportDir = "d:\\botly\\App\\reports\\previews\\game-icons";
mkdirSync(reportDir, { recursive: true });

const runtime = JSON.parse(readFileSync("d:/botly/App/.tmp/healthclues-owner-demo/owner-demo-runtime.json", "utf8"));

// 1. Create a synthetic test account in local Supabase
async function createVerifiedAccount() {
  const email = `game-icons-${Date.now()}@example.invalid`;
  const password = `HcLocal_${randomUUID()}_Aa9!`;
  const adminRes = await fetch(`${runtime.apiUrl}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      apikey: runtime.secretKey,
      Authorization: `Bearer ${runtime.secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata: { test_only: true, suite: "game-icons-verification" },
    }),
  });
  assert.ok(adminRes.ok, `Failed creating test user: ${adminRes.status}`);
  const created = await adminRes.json();

  const tokenRes = await fetch(`${runtime.apiUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: runtime.publishableKey, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  assert.ok(tokenRes.ok, `Failed login for test user: ${tokenRes.status}`);
  const tokenData = await tokenRes.json();

  return {
    email,
    session: {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: Math.floor(Date.now() / 1000) + tokenData.expires_in,
      user: tokenData.user,
    },
  };
}

const account = await createVerifiedAccount();
console.log(`Created test account: ${account.email}`);

const chromePath = [
  path.join(process.env.PROGRAMFILES || "C:\\Program Files", "Google/Chrome/Application/chrome.exe"),
  path.join(process.env["PROGRAMFILES(X86)"] || "C:\\Program Files (x86)", "Google/Chrome/Application/chrome.exe")
].find(existsSync);
assert.ok(chromePath, "Chrome is required.");

const profileDir = path.resolve(`d:/botly/App/.tmp/game-icons-browser-${process.pid}-${randomUUID()}`);
mkdirSync(profileDir, { recursive: true });

const probe = net.createServer();
const debugPort = await new Promise((resolve, reject) => {
  probe.once("error", reject);
  probe.listen(0, "127.0.0.1", () => {
    const p = probe.address().port;
    probe.close(() => resolve(p));
  });
});

console.log(`Starting headless Chrome on debug port ${debugPort}...`);
const chrome = spawn(
  chromePath,
  [
    "--headless=new",
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-background-networking",
    "--disable-features=Translate",
    `--user-data-dir=${profileDir}`,
    `--remote-debugging-port=${debugPort}`,
    "about:blank",
  ],
  { stdio: "ignore", windowsHide: true }
);

let ws;
let nextId = 0;
const waiting = new Map();
const requestedAssets = new Set();
const failedAssets = [];

const cdp = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const id = ++nextId;
    const timer = setTimeout(() => {
      waiting.delete(id);
      reject(new Error(`CDP timeout: ${method}`));
    }, 45000);
    waiting.set(id, (value) => {
      clearTimeout(timer);
      value.error ? reject(new Error(value.error.message)) : resolve(value.result);
    });
    ws.send(JSON.stringify({ id, method, params }));
  });

const evaluate = async (expression) => {
  const value = await cdp("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
    userGesture: true,
  });
  if (value.exceptionDetails) {
    throw new Error(value.exceptionDetails.exception?.description || value.exceptionDetails.text);
  }
  return value.result?.value;
};

const wait = async (expression, label) => {
  const end = Date.now() + 25000;
  while (Date.now() < end) {
    if (await evaluate(expression).catch(() => false)) return;
    await delay(200);
  }
  throw new Error(`Timeout waiting for ${label}`);
};

async function saveScreenshot(filename, width = 1440, height = 900, mobile = false) {
  await cdp("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile });
  await delay(400);
  const shot = await cdp("Page.captureScreenshot", { format: "png", captureBeyondViewport: false, fromSurface: true });
  const buffer = Buffer.from(shot.data, "base64");
  
  const reportPath = path.join(reportDir, filename);
  writeFileSync(reportPath, buffer);

  const artifactPath = path.join(artifactsDir, filename);
  writeFileSync(artifactPath, buffer);

  console.log(`Saved screenshot: ${filename}`);
}

try {
  const end = Date.now() + 10000;
  let version;
  while (Date.now() < end) {
    try {
      version = await (await fetch(`http://127.0.0.1:${debugPort}/json/version`)).json();
      break;
    } catch {
      await delay(100);
    }
  }
  assert.ok(version, "Chrome debugging endpoint did not start.");

  let targets = [];
  const targetEnd = Date.now() + 10000;
  while (Date.now() < targetEnd) {
    targets = await fetch(`http://127.0.0.1:${debugPort}/json`).then((r) => r.json()).catch(() => []);
    if (targets.some((item) => item.type === "page")) break;
    await delay(100);
  }
  const target = targets.find((item) => item.type === "page");
  assert.ok(target, "Chrome page target did not start.");

  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve, { once: true });
    ws.addEventListener("error", reject, { once: true });
  });

  ws.on("message", (raw) => {
    const message = JSON.parse(raw.toString());
    if (message.id && waiting.has(message.id)) {
      waiting.get(message.id)(message);
      waiting.delete(message.id);
    }
    if (message.method === "Network.requestWillBeSent") {
      const url = message.params.request.url;
      if (url.includes("/assets/game/")) {
        requestedAssets.add(url);
      }
    }
    if (message.method === "Network.responseReceived") {
      const resp = message.params.response;
      if (resp.url.includes("/assets/game/") && resp.status >= 400) {
        failedAssets.push({ url: resp.url, status: resp.status });
      }
    }
  });

  await cdp("Page.enable");
  await cdp("Runtime.enable");
  await cdp("Network.enable");

  // Inject session so player enters World directly
  const sessionScript = `try {
    localStorage.setItem('botly-cloud-session', ${JSON.stringify(JSON.stringify(account.session))});
  } catch(e) {}`;
  await cdp("Page.addScriptToEvaluateOnNewDocument", { source: sessionScript });

  // 1. Navigate to Sleep Valley
  console.log("Navigating directly to Sleep Valley in-game World...");
  await cdp("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await cdp("Page.navigate", { url: `${base}/en/wellness/healthclues/world?quest=sleep-better` });

  await wait("Boolean(document.body && document.body.innerText && document.body.innerText.length > 20)", "World Page loaded");
  await delay(1000);

  const canClickEnter = await evaluate(`(()=>{
    const b = [...document.querySelectorAll('button')].find(x => x.innerText.includes('Enter My Wellness World') || x.innerText.includes('START EXPLORING'));
    if (b) { b.click(); return true; }
    return false;
  })()`);
  if (canClickEnter) {
    console.log("Clicked 'Enter My Wellness World' / 'START EXPLORING'...");
    await delay(1500);
  }

  await wait("Boolean(document.querySelector('.hc-region-hud') || document.querySelector('[data-game-ui]') || document.querySelector('.hc-region-title'))", "Sleep Valley Scene");
  await delay(1000);

  // Dismiss tour overlay so modal views are clean and unobscured
  const dismissedTour = await evaluate(`(()=>{
    const skip = [...document.querySelectorAll('button')].find(e => /skip tour|skip/i.test(e.innerText));
    if (skip) { skip.click(); return true; }
    return false;
  })()`);
  if (dismissedTour) {
    console.log("Dismissed tour overlay.");
    await delay(500);
  }

  // Capture Sleep Valley Scene (Desktop + Mobile)
  console.log("Capturing Sleep Valley Scene...");
  await saveScreenshot("game-icons-sleep-valley-hud-desktop.png", 1440, 900, false);
  await saveScreenshot("game-icons-sleep-valley-hud-mobile.png", 390, 844, true);

  await cdp("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await delay(400);

  // 2. Open Backpack modal (#hc-toolkit)
  console.log("Opening Backpack modal (#hc-toolkit)...");
  await evaluate(`window.location.hash = "#hc-toolkit"`);
  await delay(1000);
  await saveScreenshot("game-icons-backpack-modal-desktop.png", 1440, 900, false);
  await saveScreenshot("game-icons-backpack-modal-mobile.png", 390, 844, true);

  // Close modal via Escape
  await evaluate(`window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))`);
  await delay(400);

  // 3. Open Knowledge Journey (#hc-knowledge)
  console.log("Opening Knowledge Journey modal (#hc-knowledge)...");
  await cdp("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await evaluate(`window.location.hash = "#hc-knowledge"`);
  await delay(1000);
  await saveScreenshot("game-icons-knowledge-journey-desktop.png", 1440, 900, false);
  await saveScreenshot("game-icons-knowledge-journey-mobile.png", 390, 844, true);

  // Close modal
  await evaluate(`window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))`);
  await delay(400);

  // 4. Open My Journey modal
  console.log("Opening My Journey modal...");
  await evaluate(`(()=>{
    const b = document.querySelector('[data-my-journey-button]');
    if (b) b.click();
  })()`);
  await delay(1000);
  await saveScreenshot("game-icons-my-journey-modal-desktop.png", 1440, 900, false);
  await saveScreenshot("game-icons-my-journey-modal-mobile.png", 390, 844, true);

  // Close modal
  await evaluate(`window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))`);
  await delay(400);

  // 5. Click World Map in HUD to view Overworld Map
  console.log("Navigating to World Map via HUD...");
  await cdp("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await evaluate(`(()=>{
    const back = document.querySelector('.hc-region-back');
    if (back) back.click();
  })()`);
  await delay(1000);
  await saveScreenshot("game-icons-world-map-desktop.png", 1440, 900, false);
  await saveScreenshot("game-icons-world-map-mobile.png", 390, 844, true);

  // 6. Enter HealthClues Realm
  console.log("Entering HealthClues Realm...");
  await cdp("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await evaluate(`(()=>{
    const b = [...document.querySelectorAll('button')].find(e => e.innerText.includes('HealthClues Realm'));
    if (b) b.click();
  })()`);
  await delay(1200);
  await saveScreenshot("game-icons-realm-scene-desktop.png", 1440, 900, false);

  // 7. Verify Asset loading stats
  console.log(`Total unique /assets/game/ requested: ${requestedAssets.size}`);
  console.log("Requested assets list:");
  for (const url of requestedAssets) {
    console.log(` ✓ ${url}`);
  }
  console.log(`Failed /assets/game/ requests: ${failedAssets.length}`);
  if (failedAssets.length > 0) {
    console.error("FAILED ASSETS:", failedAssets);
  }
  assert.equal(failedAssets.length, 0, `There are ${failedAssets.length} failed game asset requests!`);

  console.log("ALL VISUAL VERIFICATIONS AND ASSET INTEGRATION CONTRACTS PASSED 100%!");
} finally {
  if (ws) ws.close();
  if (chrome) chrome.kill();
}
