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

async function createSeededAccount() {
  const email = `audit-journey-${Date.now()}@example.invalid`;
  const password = `HcLocal_${randomUUID()}_Aa9!`;

  // 1. Create auth user in Supabase
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

  // 2. Sign in to get access token
  const tokenRes = await fetch(`${runtime.apiUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: runtime.publishableKey, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  assert.ok(tokenRes.ok, `Failed login: ${tokenRes.status}`);
  const tokenData = await tokenRes.json();
  const token = tokenData.access_token;
  const authHeaders = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  // 3. Initialize World
  const worldRes = await fetch(`${base}/api/healthclues/world`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      requestKey: randomUUID(),
      topicKey: "sleep-better",
      title: "Sleep Valley",
      timezone: "Asia/Bangkok",
      startedOn: "2026-11-03",
      selections: [],
    }),
  });
  assert.ok(worldRes.ok, `Failed creating World: ${worldRes.status}`);
  const worldData = await worldRes.json();
  const worldId = worldData.world?.id || worldData.id;
  console.log(`Initialized World: ${worldId}`);

  // 4. Save Profile
  const profileRes = await fetch(`${base}/api/healthclues/profile`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      topic: "Sleep & rest",
      twoWeekGoal: "Improve evening wind-down routine",
      contentPreferences: ["Reading", "Nature"],
      presentation: "A mix of everything",
      comfortableActivityTime: "15 minutes",
      refreshFrequency: "Weekly",
      safetyLevel: "none",
      specificInterests: ["Falling asleep", "Relaxation"],
      safetyContext: {},
      adaptiveDiscovery: {
        schemaVersion: 1,
        ageConfirmed: true,
        focusId: "sleep",
        focusLabel: "Sleep & rest",
        answers: [],
      },
    }),
  });
  console.log(`Saved Profile status: ${profileRes.status}`);

  // 5. Save Confirmed Wellness Plan with 2 Active Goals + 1 Saved for Later
  const sampleGoals = [
    {
      goalId: "audit-goal-1",
      title: "Tập hít thở 4-7-8 trước khi ngủ",
      category: "wellness",
      iconKey: "wellness.breathing",
      goalType: "maintain",
      choice: "active",
      frequency: "Daily",
      trackingUnit: "minutes",
      trackingDefinition: "Thực hành hít thở sâu 4-7-8 trong 5 phút khi nằm trên giường",
      targetValue: 5,
      targetUnit: "phút",
      durationDays: 7,
      durationMinutes: 5,
      safetyStatus: "eligible_for_personal_choice",
      provenance: "ai_generated",
      evidenceStatus: "AI-GENERATED · NOT A MEDICAL ASSESSMENT",
      explanation: "Phù hợp với mục tiêu giảm căng thẳng và dễ đi vào giấc ngủ hơn",
      generatedOption: { locale: "vi", option: "A", title: "5 phút thư giãn" },
      sources: [],
    },
    {
      goalId: "audit-goal-2",
      title: "Uống trà hoa cúc ấm",
      category: "herbs",
      iconKey: "herbs.chamomile",
      goalType: "maintain",
      choice: "active",
      frequency: "Daily",
      trackingUnit: "cup",
      trackingDefinition: "Uống 1 tách trà hoa cúc ấm 30 phút trước khi ngủ",
      targetValue: 1,
      targetUnit: "tách",
      durationDays: 14,
      durationMinutes: null,
      safetyStatus: "eligible_for_personal_choice",
      provenance: "ai_generated",
      evidenceStatus: "AI-GENERATED · NOT A MEDICAL ASSESSMENT",
      explanation: "Hoa cúc có tác dụng an thần nhẹ tự nhiên hỗ trợ giấc ngủ ngon",
      generatedOption: { locale: "vi", option: "A", title: "1 tách ấm" },
      sources: [],
    },
    {
      goalId: "audit-goal-3",
      title: "Tắt điện thoại trước khi ngủ 30 phút",
      category: "lifestyle",
      iconKey: "lifestyle.screen_off",
      goalType: "reduce",
      choice: "saved",
      frequency: "5 days a week",
      trackingUnit: "minutes",
      trackingDefinition: "Đặt điện thoại ra xa giường ngủ ít nhất 30 phút trước giờ ngủ",
      targetValue: 30,
      targetUnit: "phút",
      durationDays: 7,
      durationMinutes: null,
      safetyStatus: "eligible_for_personal_choice",
      provenance: "user_created",
      evidenceStatus: "USER-CREATED · NOT REVIEWED",
      explanation: "Giảm tiếp xúc ánh sáng xanh giúp não bộ tiết melatonin tự nhiên",
      sources: [],
    },
  ];

  const planRes = await fetch(`${base}/api/healthclues/plan`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      worldId,
      requestKey: randomUUID(),
      confirmed: true,
      goals: sampleGoals,
    }),
  });
  console.log(`Saved Plan status: ${planRes.status}`);

  return {
    email,
    worldId,
    session: {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: Math.floor(Date.now() / 1000) + tokenData.expires_in,
      user: tokenData.user,
    },
  };
}

const account = await createSeededAccount();
console.log(`Created & seeded test account: ${account.email}`);

const chromePath = [
  path.join(process.env.PROGRAMFILES || "C:\\Program Files", "Google/Chrome/Application/chrome.exe"),
  path.join(process.env["PROGRAMFILES(X86)"] || "C:\\Program Files (x86)", "Google/Chrome/Application/chrome.exe"),
].find(existsSync);
assert.ok(chromePath, "Chrome is required.");

const profileDir = path.resolve(`d:/botly/App/.tmp/ux-audit-seeded-${process.pid}-${randomUUID()}`);
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
    const message = JSON.parse(event.data.toString());
    if (message.id && waiting.has(message.id)) {
      waiting.get(message.id)(message);
      waiting.delete(message.id);
    }
  });

  await cdp("Page.enable");
  await cdp("Runtime.enable");

  // Inject session
  const sessionScript = `try {
    localStorage.setItem('botly-cloud-session', ${JSON.stringify(JSON.stringify(account.session))});
  } catch(e) {}`;
  await cdp("Page.addScriptToEvaluateOnNewDocument", { source: sessionScript });

  console.log("Navigating directly to Sleep Valley in-game World...");
  await cdp("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await cdp("Page.navigate", { url: `${base}/en/wellness/healthclues/world?quest=sleep-better` });

  await wait("Boolean(document.querySelector('.hc-region-hud') || document.querySelector('[data-game-ui]') || document.querySelector('.hc-region-title') || document.querySelector('.hc-hud-action'))", "Sleep Valley Scene");
  await delay(1200);

  // Dismiss tour overlay if present
  await evaluate(`(()=>{
    const skip = [...document.querySelectorAll('button')].find(e => /skip tour|skip/i.test(e.innerText));
    if (skip) skip.click();
  })()`);
  await delay(600);

  // 1. Capture Sleep Valley Scene HUD
  await saveScreenshot("audit-seeded-sleep-valley-desktop.png", 1440, 900, false);
  await saveScreenshot("audit-seeded-sleep-valley-mobile.png", 390, 844, true);

  await cdp("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await delay(400);

  // 2. Open My Journey modal
  console.log("Opening My Journey modal via data-my-journey-button...");
  await evaluate(`(()=>{
    const b = document.querySelector('[data-my-journey-button]');
    if (b) b.click();
  })()`);
  await delay(1500);

  // 3. Capture My Journey modal
  await saveScreenshot("audit-seeded-my-journey-desktop.png", 1440, 900, false);
  await saveScreenshot("audit-seeded-my-journey-mobile.png", 390, 844, true);

  // 4. Click "Review wellness suggestions"
  console.log("Clicking 'Review wellness suggestions' inside My Journey...");
  await evaluate(`(()=>{
    const b = [...document.querySelectorAll('button')].find(btn => btn.innerText.includes('Review wellness suggestions'));
    if (b) b.click();
  })()`);
  await delay(2000);

  // 5. Capture Suggestions / Plan Builder inside My Journey
  await saveScreenshot("audit-seeded-suggestions-desktop.png", 1440, 900, false);
  await saveScreenshot("audit-seeded-suggestions-mobile.png", 390, 844, true);

  console.log("AUDIT CAPTURES COMPLETED 100%!");
} finally {
  if (ws) ws.close();
  chrome.kill("SIGKILL");
}
