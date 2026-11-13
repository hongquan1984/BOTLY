import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import net from "node:net";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const base = "http://127.0.0.1:3329";
const artifactsDir = "C:\\Users\\Admin\\.gemini\\antigravity\\brain\\bf806726-5fdf-45f1-b574-a2b65a5fbf0f";

const runtime = JSON.parse(readFileSync("d:/botly/App/.tmp/healthclues-owner-demo/owner-demo-runtime.json", "utf8"));

async function createVerifiedAccount() {
  const email = `audit-journey-${Date.now()}@example.invalid`;
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
      user_metadata: { test_only: true, suite: "ux-audit" },
    }),
  });
  assert.ok(adminRes.ok, `Failed creating test user: ${adminRes.status}`);

  const tokenRes = await fetch(`${runtime.apiUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: runtime.publishableKey, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  assert.ok(tokenRes.ok, `Failed login: ${tokenRes.status}`);
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
  path.join(process.env["PROGRAMFILES(X86)"] || "C:\\Program Files (x86)", "Google/Chrome/Application/chrome.exe"),
].find(existsSync);
assert.ok(chromePath, "Chrome is required.");

const profileDir = path.resolve(`d:/botly/App/.tmp/ux-audit-browser-${process.pid}-${randomUUID()}`);
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

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let ws;
let nextId = 0;
const waiting = new Map();

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
  assert.ok(version, "Chrome debug endpoint did not respond.");

  const targets = await (await fetch(`http://127.0.0.1:${debugPort}/json/list`)).json();
  const target = targets.find((item) => item.type === "page");
  assert.ok(target, "Chrome page target did not start.");

  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve, { once: true });
    ws.addEventListener("error", reject, { once: true });
  });

  ws.addEventListener("message", (event) => {
    const raw = event.data;
    const message = JSON.parse(raw.toString());
    if (message.id && waiting.has(message.id)) {
      waiting.get(message.id)(message);
      waiting.delete(message.id);
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
  await delay(1200);

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

  // Dismiss tour overlay
  const dismissedTour = await evaluate(`(()=>{
    const skip = [...document.querySelectorAll('button')].find(e => /skip tour|skip/i.test(e.innerText));
    if (skip) { skip.click(); return true; }
    return false;
  })()`);
  if (dismissedTour) {
    console.log("Dismissed tour overlay.");
    await delay(500);
  }

  // 2. Open My Journey modal
  console.log("Opening My Journey modal...");
  const openedJourney = await evaluate(`(()=>{
    const b = document.querySelector('[data-my-journey-button]');
    if (b) { b.click(); return true; }
    return false;
  })()`);
  console.log("Opened My Journey:", openedJourney);
  await delay(1200);

  // Capture Initial My Journey modal (Desktop and Mobile)
  await saveScreenshot("audit-my-journey-initial-desktop.png", 1440, 900, false);
  await saveScreenshot("audit-my-journey-initial-mobile.png", 390, 844, true);

  await cdp("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await delay(400);

  // 3. Inspect what is inside My Journey modal
  const modalText = await evaluate(`document.querySelector('.hc-game-modal')?.innerText || ''`);
  console.log("--- MY JOURNEY MODAL CONTENT PREVIEW ---");
  console.log(modalText.slice(0, 800));
  console.log("---------------------------------------");

  // 4. Click "Review wellness suggestions" if present
  console.log("Clicking 'Review wellness suggestions'...");
  const clickedSuggestions = await evaluate(`(()=>{
    const btn = [...document.querySelectorAll('button')].find(b => b.innerText.includes('Review wellness suggestions') || b.innerText.includes('Review saved Quiz suggestions'));
    if (btn) { btn.click(); return true; }
    return false;
  })()`);
  console.log("Clicked suggestions button:", clickedSuggestions);
  await delay(2000);

  // Capture Suggestions in My Journey (Desktop and Mobile)
  await saveScreenshot("audit-my-journey-suggestions-desktop.png", 1440, 900, false);
  await saveScreenshot("audit-my-journey-suggestions-mobile.png", 390, 844, true);

  console.log("Audit capture completed successfully!");
} finally {
  if (ws) ws.close();
  chrome.kill("SIGKILL");
}
