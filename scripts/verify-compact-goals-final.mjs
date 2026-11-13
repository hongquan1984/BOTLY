import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, writeFileSync } from "node:fs";
import net from "node:net";
import path from "node:path";

const artifactsDir = "C:\\Users\\Admin\\.gemini\\antigravity\\brain\\bf806726-5fdf-45f1-b574-a2b65a5fbf0f";

async function run() {
  const chromePath = [
    path.join(process.env.PROGRAMFILES || "C:\\Program Files", "Google", "Chrome", "Application", "chrome.exe"),
    path.join(process.env["PROGRAMFILES(X86)"] || "C:\\Program Files (x86)", "Google", "Chrome", "Application", "chrome.exe"),
  ].find(existsSync);

  const probe = net.createServer();
  const debugPort = await new Promise(resolve => probe.listen(0, "127.0.0.1", () => {
    const port = probe.address().port;
    probe.close(() => resolve(port));
  }));

  console.log(`Launching Chrome on debug port ${debugPort}...`);
  const chromeProc = spawn(chromePath, [
    `--remote-debugging-port=${debugPort}`,
    "--no-first-run",
    "--headless=new",
    "--window-size=390,844",
    "http://127.0.0.1:3329/play-demo.html",
  ]);

  try {
    let targetWs = null;
    for (let i = 0; i < 30; i++) {
      try {
        const res = await fetch(`http://127.0.0.1:${debugPort}/json/list`);
        const tabs = await res.json();
        const tab = tabs.find(t => t.url.includes("play") || t.url.includes("play-demo"));
        if (tab && tab.webSocketDebuggerUrl) {
          targetWs = tab.webSocketDebuggerUrl;
          break;
        }
      } catch {}
      await new Promise(r => setTimeout(r, 500));
    }

    if (!targetWs) throw new Error("Could not connect to Chrome tab");

    const ws = new WebSocket(targetWs);
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    let msgId = 1;
    const pending = new Map();
    ws.onmessage = (evt) => {
      const msg = JSON.parse(evt.data);
      if (msg.id && pending.has(msg.id)) {
        const { resolve, reject } = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
      }
    };

    const send = (method, params = {}) => new Promise((resolve, reject) => {
      const id = msgId++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });

    await send("Page.enable");
    await send("Runtime.enable");

    // Wait for redirect to /play and goals to render
    console.log("Waiting for /play and Journey modal...");
    let goalFound = false;
    for (let i = 0; i < 40; i++) {
      const { result } = await send("Runtime.evaluate", {
        expression: `(() => {
          // If Journey panel is not open, try clicking My Journey button
          const btn = document.querySelector('[data-my-journey-button]');
          const drawer = document.querySelector('.hc-game-modal-journey');
          if (!drawer && btn) btn.click();
          const cards = document.querySelectorAll('.hc-active-goal-card');
          return {
            hasDrawer: Boolean(drawer),
            cardCount: cards.length,
            titles: Array.from(cards).map(c => c.querySelector('.hc-quest-card-title')?.innerText || ''),
            hasActionBox: Boolean(document.querySelector('.hc-goal-action-box')),
            hasDescText: Boolean(document.querySelector('.hc-goal-desc-text')),
            pillsRows: Array.from(cards).map(c => c.querySelector('.hc-goal-card-pills-row')?.innerText || ''),
          };
        })()`,
        returnByValue: true,
      });

      if (result.value?.cardCount > 0) {
        console.log("Found goal cards:", result.value);
        goalFound = true;
        break;
      }
      await new Promise(r => setTimeout(r, 600));
    }

    if (!goalFound) {
      console.warn("Could not find active goal cards within timeout, capturing snapshot anyway...");
    }

    // Set viewport to mobile 390x844
    await send("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await new Promise(r => setTimeout(r, 800));

    // Capture Mobile Screenshot
    const mobileScreen = await send("Page.captureScreenshot", { format: "png" });
    const mobilePath = path.join(artifactsDir, "verified-compact-goals-mobile-v2.png");
    writeFileSync(mobilePath, Buffer.from(mobileScreen.data, "base64"));
    console.log(`Saved mobile screenshot to ${mobilePath}`);

    // Click "Xem chi tiết" on first card to expand disclosure
    console.log("Testing disclosure expansion...");
    await send("Runtime.evaluate", {
      expression: `(() => {
        const toggle = document.querySelector('.hc-quest-details-toggle');
        if (toggle) toggle.click();
      })()`,
    });
    await new Promise(r => setTimeout(r, 500));

    const disclosureScreen = await send("Page.captureScreenshot", { format: "png" });
    const disclosurePath = path.join(artifactsDir, "verified-compact-goals-disclosure-open.png");
    writeFileSync(disclosurePath, Buffer.from(disclosureScreen.data, "base64"));
    console.log(`Saved disclosure screenshot to ${disclosurePath}`);

    // Test clicking Check-in button to verify Vietnamese companion checkin dialog
    console.log("Testing Check-in button click...");
    await send("Runtime.evaluate", {
      expression: `(() => {
        const checkinBtn = document.querySelector('.hc-goal-quick-checkin-btn');
        if (checkinBtn) checkinBtn.click();
      })()`,
    });
    await new Promise(r => setTimeout(r, 1000));

    const { result: checkinTextResult } = await send("Runtime.evaluate", {
      expression: `(() => {
        const dialog = document.querySelector('.hc-checkin-dialog');
        if (!dialog) return { found: false };
        return {
          found: true,
          title: dialog.querySelector('#hc-checkin-title')?.innerText || '',
          intro: dialog.querySelector('.hc-checkin-intro')?.innerText || '',
          skipBtn: dialog.querySelector('.hc-checkin-skip')?.innerText || '',
          buttons: Array.from(dialog.querySelectorAll('.hc-checkin-entries button')).map(b => b.innerText),
        };
      })()`,
      returnByValue: true,
    });
    console.log("Companion check-in dialog evaluation:", checkinTextResult.value);

    const checkinModalScreen = await send("Page.captureScreenshot", { format: "png" });
    const checkinModalPath = path.join(artifactsDir, "verified-companion-modal-vi-v2.png");
    writeFileSync(checkinModalPath, Buffer.from(checkinModalScreen.data, "base64"));
    console.log(`Saved companion check-in screenshot to ${checkinModalPath}`);

    // Now test Desktop Viewport (1280x800)
    console.log("Switching to Desktop Viewport 1280x800...");
    await send("Emulation.setDeviceMetricsOverride", {
      width: 1280,
      height: 800,
      deviceScaleFactor: 1,
      mobile: false,
    });
    // Close check-in modal if open and open My Journey
    await send("Runtime.evaluate", {
      expression: `(() => {
        const closeBtn = document.querySelector('.hc-game-modal-header button');
        if (closeBtn) closeBtn.click();
        const btn = document.querySelector('[data-my-journey-button]');
        if (btn) btn.click();
      })()`,
    });
    await new Promise(r => setTimeout(r, 1000));

    const desktopScreen = await send("Page.captureScreenshot", { format: "png" });
    const desktopPath = path.join(artifactsDir, "verified-compact-goals-desktop-v2.png");
    writeFileSync(desktopPath, Buffer.from(desktopScreen.data, "base64"));
    console.log(`Saved desktop screenshot to ${desktopPath}`);

    ws.close();
  } finally {
    chromeProc.kill();
  }
}

run().catch(err => {
  console.error("Verification failed:", err);
  process.exit(1);
});
