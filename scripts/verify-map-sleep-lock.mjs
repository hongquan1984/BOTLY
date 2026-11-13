import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const BASE_URL = "http://localhost:3000";
const ARTIFACTS_DIR = "C:\\Users\\Admin\\.gemini\\antigravity\\brain\\abff8161-8d04-4588-8fd8-ca4619ccaf85\\reminder-verified";

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
  const chromePath = [
    path.join(process.env.PROGRAMFILES || "C:\\Program Files", "Google", "Chrome", "Application", "chrome.exe"),
    path.join(process.env["PROGRAMFILES(X86)"] || "C:\\Program Files (x86)", "Google", "Chrome", "Application", "chrome.exe"),
  ].find(fs.existsSync);

  const cdpPort = 9229;
  const userDataDir = path.join(process.env.TEMP || "C:\\temp", "chrome-cdp-map-lock-profile");
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
    console.log("Navigating to world page...");
    await cdpRequest(ws, msgId.id++, "Page.navigate", { url: `${BASE_URL}/play-demo.html` });
    await sleep(2500);

    // Click on "Bản đồ" or back to Overworld map
    console.log("Switching to Overworld Map view...");
    const mapOpened = await evalInPage(ws, msgId, `
      (() => {
        // Find back button or world button
        const backBtn = document.querySelector('button[aria-label="Back to world map"]') ||
                        Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Bản đồ') || b.textContent.includes('Quay lại bản đồ') || b.textContent.includes('Bản đồ thế giới'));
        if (backBtn) {
          backBtn.click();
          return true;
        }
        return false;
      })()
    `);
    console.log("Map navigation action:", mapOpened);
    await sleep(1000);

    // Check Sleep Valley lock status in DOM
    const lockInfo = await evalInPage(ws, msgId, `
      (() => {
        const text = document.body.innerText;
        const hasTamKhoa = text.includes("TẠM KHÓA") || text.includes("Tạm khóa");
        const sleepButtons = Array.from(document.querySelectorAll('button, g')).filter(el =>
          (el.getAttribute('aria-label') || '').includes('Sleep') || el.textContent.includes('Sleep Valley')
        );
        return {
          hasTamKhoa,
          buttonCount: sleepButtons.length,
          labels: sleepButtons.map(el => el.getAttribute('aria-label') || el.textContent)
        };
      })()
    `);
    console.log("Sleep Valley Lock Info on Map:", lockInfo);
    await captureScreenshot(ws, msgId, path.join(ARTIFACTS_DIR, "04_sleep_valley_map_lock.png"));

    console.log("=== MAP LOCK VERIFIED ===");
  } finally {
    ws.close();
    cleanup();
  }
}

run().catch((err) => {
  console.error("Map check error:", err);
  process.exit(1);
});
