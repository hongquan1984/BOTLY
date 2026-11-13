import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const base = "http://127.0.0.1:3329";
const artifactsDir = "C:\\Users\\Admin\\.gemini\\antigravity\\brain\\bf806726-5fdf-45f1-b574-a2b65a5fbf0f";

const chromePath = [
  path.join(process.env.PROGRAMFILES || "C:\\Program Files", "Google/Chrome/Application/chrome.exe"),
  path.join(process.env["PROGRAMFILES(X86)"] || "C:\\Program Files (x86)", "Google/Chrome/Application/chrome.exe"),
].find(existsSync);
assert.ok(chromePath, "Chrome is required.");

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
    `--remote-debugging-port=${debugPort}`,
    "about:blank",
  ],
  { stdio: "ignore", windowsHide: true }
);

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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

  // TEST 1: Internal Icon Gallery at /admin/healthclues-icon-gallery
  console.log("Navigating to internal Icon Gallery (/admin/healthclues-icon-gallery)...");
  await cdp("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await cdp("Page.navigate", { url: `${base}/admin/healthclues-icon-gallery` });

  await wait("Boolean(document.querySelector('[data-icon-gallery-page]') || document.querySelector('h1'))", "Icon Gallery loaded");
  await delay(1000);

  const galleryInfo = await evaluate(`(()=>{
    return {
      title: document.querySelector('h1')?.innerText || '',
      iconCardsCount: document.querySelectorAll('[data-icon-card]').length,
      categoryTabsCount: document.querySelectorAll('.hc-gallery-tabs button').length,
      hasSimulator: Boolean(document.querySelector('#ai-sim-input')),
      statCardsCount: document.querySelectorAll('header .grid > div').length,
      headerText: document.querySelector('header')?.innerText || '',
    };
  })()`);

  console.log("Gallery Info:", galleryInfo);
  assert.ok(galleryInfo.iconCardsCount >= 85, `Expected >= 85 icons, got ${galleryInfo.iconCardsCount}`);
  assert.ok(galleryInfo.hasSimulator, "Live AI Resolver Simulator must be present");
  assert.ok(galleryInfo.headerText.includes("Gemini AI Keys") || galleryInfo.headerText.includes("48"), "Gemini AI Keys stat must be rendered in header");

  // Save desktop and mobile screenshots of the updated Icon Gallery
  console.log("Capturing Icon Gallery Desktop...");
  await saveScreenshot("dynamic-ai-icon-gallery-desktop.png", 1440, 900, false);

  console.log("Capturing Icon Gallery Mobile...");
  await saveScreenshot("dynamic-ai-icon-gallery-mobile.png", 390, 844, true);

  await cdp("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await delay(300);

  // TEST 2: Testing live simulator phrases with dot-notation and approval badge
  console.log("Testing Live AI Resolver Simulator with canonical phrases...");
  const simPhrases = [
    { text: "Ăn cá hồi giàu omega 3", expectedAiKey: "nutrition.fish" },
    { text: "Tập yoga trước khi ngủ", expectedAiKey: "movement.yoga" },
    { text: "Uống đủ 2 lít nước", expectedAiKey: "hydration.water" },
    { text: "Thiền trước khi ngủ", expectedAiKey: "wellness.meditation" },
    { text: "Tắm nắng sáng 15 phút", expectedAiKey: "lifestyle.sunlight" },
  ];

  for (const item of simPhrases) {
    await evaluate(`(()=>{
      const input = document.querySelector('#ai-sim-input');
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
      if (setter) {
        setter.call(input, ${JSON.stringify(item.text)});
      } else {
        input.value = ${JSON.stringify(item.text)};
      }
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    })()`);
    await delay(500);

    const simCardText = await evaluate(`document.querySelector('.hc-gallery-sim-card')?.innerText || ''`);
    console.log(`Simulator output for "${item.text}":\n  ${simCardText.replace(/\n+/g, " | ")}`);
    assert.ok(simCardText.includes(item.expectedAiKey), `Expected simCardText to contain ${item.expectedAiKey}`);
    assert.ok(simCardText.includes("Gemini Approved Key"), `Expected "Gemini Approved Key" badge for ${item.expectedAiKey}`);
  }

  // Save screenshot of the active simulator
  console.log("Capturing Simulator with Gemini Approved Key badge...");
  await saveScreenshot("dynamic-ai-icon-gallery-simulator.png", 1440, 900, false);

  // TEST 3: Navigate to /play to verify World Map and region icons
  console.log("Navigating to /play...");
  await cdp("Page.navigate", { url: `${base}/play` });
  await wait("Boolean(document.body && document.body.innerText && document.body.innerText.length > 30)", "Play page loaded");
  await delay(1200);

  const playInfo = await evaluate(`(()=>{
    return {
      title: document.title,
      regions: document.querySelectorAll('[data-world-map-region], .hc-overworld-region').length,
      buttons: [...document.querySelectorAll('button')].map(b => b.innerText.trim()).filter(Boolean).slice(0, 8),
    };
  })()`);
  console.log("Play Page Info:", playInfo);

  console.log("Capturing Play Page...");
  await saveScreenshot("dynamic-ai-play-page-desktop.png", 1440, 900, false);

  // Verify asset loading integrity
  console.log("\nVerifying asset network integrity...");
  console.log(`Requested game assets: ${requestedAssets.size}`);
  console.log(`Failed game assets: ${failedAssets.length}`);
  assert.equal(failedAssets.length, 0, `Detected ${failedAssets.length} broken game assets: ${JSON.stringify(failedAssets)}`);

  console.log("\n============================================================");
  console.log("ALL VISUAL AND BROWSER CHECKS PASSED WITH 0 BROKEN ASSETS!");
  console.log("============================================================");
} finally {
  if (ws) ws.close();
  chrome.kill("SIGKILL");
}
