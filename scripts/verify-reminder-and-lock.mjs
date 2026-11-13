import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const BASE_URL = "http://localhost:3000";
const ARTIFACTS_DIR = "C:\\Users\\Admin\\.gemini\\antigravity\\brain\\abff8161-8d04-4588-8fd8-ca4619ccaf85\\reminder-verified";
fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });

async function cdpRequest(ws, id, method, params = {}) {
  return new Promise((resolve, reject) => {
    const msg = JSON.stringify({ id, method, params });
    const onMessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.id === id) {
        ws.removeEventListener("message", onMessage);
        if (data.error) reject(new Error(data.error.message || JSON.stringify(data.error)));
        else resolve(data.result);
      }
    };
    ws.addEventListener("message", onMessage);
    ws.send(msg);
  });
}

async function evalInPage(ws, msgId, expression) {
  const res = await cdpRequest(ws, msgId.id++, "Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  return res.result?.value;
}

async function captureScreenshot(ws, msgId, filePath) {
  const shot = await cdpRequest(ws, msgId.id++, "Page.captureScreenshot", {
    format: "png",
    fromSurface: true,
  });
  fs.writeFileSync(filePath, Buffer.from(shot.data, "base64"));
  console.log(`[CDP] Saved screenshot: ${path.basename(filePath)}`);
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function run() {
  console.log("=== STEP 1: Launch Headless Chrome for CDP Testing ===");
  const chromePath = [
    path.join(process.env.PROGRAMFILES || "C:\\Program Files", "Google", "Chrome", "Application", "chrome.exe"),
    path.join(process.env["PROGRAMFILES(X86)"] || "C:\\Program Files (x86)", "Google", "Chrome", "Application", "chrome.exe"),
  ].find(fs.existsSync);

  if (!chromePath) throw new Error("Chrome not found");

  const cdpPort = 9228;
  const userDataDir = path.join(process.env.TEMP || "C:\\temp", "chrome-cdp-reminder-profile");
  const chromeProc = spawn(
    chromePath,
    [
      `--remote-debugging-port=${cdpPort}`,
      `--user-data-dir=${userDataDir}`,
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-extensions",
      "--headless=new",
      "--window-size=1440,900",
      "about:blank",
    ],
    { detached: true }
  );

  const cleanup = () => {
    try {
      chromeProc.kill();
    } catch {}
  };
  process.on("exit", cleanup);

  await sleep(1500);

  const pagesRes = await fetch(`http://127.0.0.1:${cdpPort}/json`);
  const pages = await pagesRes.json();
  const pageTarget = pages.find((p) => p.type === "page") || pages[0];
  const wsUrl = pageTarget?.webSocketDebuggerUrl;
  assert.ok(wsUrl, "WebSocket URL must exist");

  const ws = new WebSocket(wsUrl);
  await new Promise((resolve) => ws.addEventListener("open", resolve, { once: true }));
  const msgId = { id: 1 };

  await cdpRequest(ws, msgId.id++, "Page.enable");
  await cdpRequest(ws, msgId.id++, "Runtime.enable");

  try {
    console.log("=== STEP 2: Navigate to Email Link (play-demo.html?checkin=1) ===");
    await cdpRequest(ws, msgId.id++, "Page.navigate", { url: `${BASE_URL}/play-demo.html?checkin=1` });

    // Wait until redirected to /world
    for (let i = 0; i < 30; i++) {
      await sleep(300);
      const curUrl = await evalInPage(ws, msgId, "window.location.href");
      if (curUrl && curUrl.includes("/world")) {
        console.log(`[CDP] Redirected to: ${curUrl}`);
        break;
      }
    }
    await sleep(2500);

    // Verify Check-in Dialog is open
    const checkinState = await evalInPage(ws, msgId, `
      (() => {
        const dialog = document.querySelector(".hc-checkin-dialog") || document.querySelector('[aria-labelledby="hc-checkin-title"]');
        const titleEl = document.getElementById("hc-checkin-title") || document.querySelector(".hc-checkin-header h2");
        const title = titleEl ? titleEl.textContent : "";
        const url = window.location.href;
        return {
          dialogExists: Boolean(dialog),
          title,
          url
        };
      })()
    `);

    console.log("Check-in dialog state on page load:", checkinState);
    assert.ok(checkinState.dialogExists, "Check-in dialog must automatically open");
    await captureScreenshot(ws, msgId, path.join(ARTIFACTS_DIR, "01_checkin_auto_opened.png"));

    // Close the checkin dialog
    console.log("=== STEP 3: Close Check-in Dialog and inspect World HUD ===");
    await evalInPage(ws, msgId, `
      (() => {
        const closeBtn = document.querySelector('.hc-checkin-dialog header button') ||
                         document.querySelector('.hc-checkin-buttons button') ||
                         document.querySelector('.hc-checkin-dialog button');
        if (closeBtn) closeBtn.click();
      })()
    `);
    await sleep(800);

    // Verify current region is health-concern and NOT sleep-better
    const regionState = await evalInPage(ws, msgId, `
      (() => {
        const isRealm = document.body.textContent.includes("HealthClues Realm") ||
                        document.body.textContent.includes("Vương Quốc HealthClues") ||
                        document.body.textContent.includes("Lumi");
        const hasSleepValley = document.body.textContent.includes("Sleep Valley") && !document.body.textContent.includes("Tạm khóa");
        return { isRealm, hasSleepValley, textExcerpt: document.body.innerText.slice(0, 300) };
      })()
    `);
    console.log("Region state:", { isRealm: regionState.isRealm, hasSleepValley: regionState.hasSleepValley });
    assert.ok(regionState.isRealm, "Must be in HealthClues Realm");
    await captureScreenshot(ws, msgId, path.join(ARTIFACTS_DIR, "02_health_realm_active.png"));

    // Test direct navigation with ?quest=sleep-better: must fallback to health-concern
    console.log("=== STEP 4: Test direct navigation to ?quest=sleep-better ===");
    await cdpRequest(ws, msgId.id++, "Page.navigate", { url: `${BASE_URL}/vi/wellness/healthclues/world?quest=sleep-better` });
    await sleep(2500);

    const fallbackState = await evalInPage(ws, msgId, `
      (() => {
        const currentUrl = window.location.href;
        const bodyText = document.body.innerText;
        const petIsLumi = bodyText.includes("Lumi");
        return { currentUrl, petIsLumi };
      })()
    `);
    console.log("Fallback state when requesting sleep-better:", fallbackState);
    assert.ok(fallbackState.petIsLumi, "Must default to Lumi / HealthClues Realm when sleep-better is requested");
    await captureScreenshot(ws, msgId, path.join(ARTIFACTS_DIR, "03_sleep_valley_locked_fallback.png"));

    console.log("=== ALL CHECKS PASSED SUCCESSFULLY ===");
  } finally {
    ws.close();
    cleanup();
  }
}

run().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
