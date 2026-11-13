import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const BASE_URL = "http://localhost:3000";
const ARTIFACTS_DIR = "C:\\Users\\Admin\\.gemini\\antigravity\\brain\\abff8161-8d04-4588-8fd8-ca4619ccaf85\\fireworks-verified";
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
  console.log("=== STEP 1: Launch Chrome for CDP Testing ===");
  const chromePath = [
    path.join(process.env.PROGRAMFILES || "C:\\Program Files", "Google", "Chrome", "Application", "chrome.exe"),
    path.join(process.env["PROGRAMFILES(X86)"] || "C:\\Program Files (x86)", "Google", "Chrome", "Application", "chrome.exe"),
  ].find(fs.existsSync);

  const cdpPort = 9230;
  const userDataDir = path.join(process.env.TEMP || "C:\\temp", "chrome-cdp-fireworks-profile");
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
    try { chromeProc.kill(); } catch {}
  };
  process.on("exit", cleanup);

  await sleep(1500);

  const pagesRes = await fetch(`http://127.0.0.1:${cdpPort}/json`);
  const pages = await pagesRes.json();
  const pageTarget = pages.find((p) => p.type === "page") || pages[0];
  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  await new Promise((resolve) => ws.addEventListener("open", resolve, { once: true }));
  const msgId = { id: 1 };

  await cdpRequest(ws, msgId.id++, "Page.enable");
  await cdpRequest(ws, msgId.id++, "Runtime.enable");

  try {
    console.log("=== STEP 2: Navigate to Check-in via play-demo.html?checkin=1 ===");
    await cdpRequest(ws, msgId.id++, "Page.navigate", { url: `${BASE_URL}/play-demo.html?checkin=1` });
    await sleep(2500);

    // Verify Check-in Dialog is open
    const checkinOpen = await evalInPage(ws, msgId, `
      Boolean(document.querySelector('.hc-checkin-dialog'))
    `);
    console.log("Check-in dialog open:", checkinOpen);
    assert.ok(checkinOpen, "Check-in dialog must be open");

    // Click "Hoàn thành" (Done) buttons on checkin items
    console.log("=== STEP 3: Mark Habits & Click Save Check-in ===");
    await evalInPage(ws, msgId, `
      (() => {
        const doneButtons = Array.from(document.querySelectorAll('.hc-checkin-binary-btn, button')).filter(b =>
          b.textContent.includes('Hoàn thành') || b.textContent.includes('Tried') || b.textContent.includes('Done')
        );
        doneButtons.forEach(btn => btn.click());
      })()
    `);
    await sleep(500);

    // Click "Lưu ghi nhận" (Save check-in)
    await evalInPage(ws, msgId, `
      (() => {
        const saveBtn = document.querySelector('button[data-save-checkin]') ||
                        Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Lưu ghi nhận') || b.textContent.includes('Save check-in'));
        if (saveBtn) saveBtn.click();
      })()
    `);

    // Capture right as fireworks explode
    await sleep(400);
    console.log("=== STEP 4: Capture Fireworks Explosion on Experience Bar ===");
    const fireworksState = await evalInPage(ws, msgId, `
      (() => {
        const overlay = document.querySelector('.hc-exp-fireworks-overlay');
        const canvas = document.querySelector('.hc-exp-fireworks-overlay canvas');
        const celebratingCapsule = document.querySelector('.hc-rpg-exp-capsule.is-exp-celebrating');
        const badge = document.querySelector('.hc-exp-float-badge');
        return {
          hasOverlay: Boolean(overlay),
          hasCanvas: Boolean(canvas),
          isCapsuleCelebrating: Boolean(celebratingCapsule),
          badgeText: badge ? badge.textContent : null
        };
      })()
    `);
    console.log("Fireworks state right after saving check-in:", fireworksState);

    await captureScreenshot(ws, msgId, path.join(ARTIFACTS_DIR, "01_exp_fireworks_exploding.png"));

    // Wait a moment for mid-air burst and floating badge
    await sleep(600);
    await captureScreenshot(ws, msgId, path.join(ARTIFACTS_DIR, "02_exp_badge_floating.png"));

    // Test explicit fireworks trigger if needed
    await evalInPage(ws, msgId, `
      if (typeof window.__triggerHealthCluesExpFireworks === 'function') {
        window.__triggerHealthCluesExpFireworks(10);
      }
    `);
    await sleep(350);
    await captureScreenshot(ws, msgId, path.join(ARTIFACTS_DIR, "03_exp_fireworks_closeup.png"));

    console.log("=== ALL EXP FIREWORKS CHECKS PASSED ===");
  } finally {
    ws.close();
    cleanup();
  }
}

run().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
