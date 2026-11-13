import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import net from "node:net";
import path from "node:path";

const root = "d:\\botly";
const artifactsDir = "C:\\Users\\Admin\\.gemini\\antigravity\\brain\\bf806726-5fdf-45f1-b574-a2b65a5fbf0f";

async function main() {
  const chromePath = [
    path.join(process.env.PROGRAMFILES || "C:\\Program Files", "Google", "Chrome", "Application", "chrome.exe"),
    path.join(process.env["PROGRAMFILES(X86)"] || "C:\\Program Files (x86)", "Google", "Chrome", "Application", "chrome.exe"),
  ].find(existsSync);

  const probe = net.createServer();
  const debugPort = await new Promise((resolve) => {
    probe.listen(0, "127.0.0.1", () => {
      const port = probe.address().port;
      probe.close(() => resolve(port));
    });
  });

  const profileDir = path.join(root, "App", ".tmp", "inspect-ui", `chrome-mobile-lang-${Date.now()}`);
  mkdirSync(profileDir, { recursive: true });

  const chromeProc = spawn(chromePath, [
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${profileDir}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--headless=new",
    "--disable-gpu",
    "--window-size=390,844",
    "http://127.0.0.1:3329/play-demo.html",
  ]);

  try {
    let targetWs = null;
    for (let i = 0; i < 40; i++) {
      try {
        const res = await fetch(`http://127.0.0.1:${debugPort}/json/list`);
        const json = await res.json();
        const page = json.find((item) => item.type === "page" && item.webSocketDebuggerUrl);
        if (page) {
          targetWs = page.webSocketDebuggerUrl;
          break;
        }
      } catch {}
      await new Promise((r) => setTimeout(r, 250));
    }
    assert.ok(targetWs, "Could not find WebSocket URL for Chrome page");

    const ws = new WebSocket(targetWs);
    await new Promise((resolve, reject) => {
      ws.addEventListener("open", resolve, { once: true });
      ws.addEventListener("error", reject, { once: true });
    });

    let msgId = 1;
    const pending = new Map();
    ws.addEventListener("message", (event) => {
      const payload = JSON.parse(event.data);
      if (payload.id && pending.has(payload.id)) {
        const { resolve, reject } = pending.get(payload.id);
        pending.delete(payload.id);
        if (payload.error) reject(new Error(JSON.stringify(payload.error)));
        else resolve(payload.result);
      }
    });

    const send = (method, params = {}) => {
      const id = msgId++;
      return new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params }));
      });
    };

    await send("Page.enable");
    await send("Runtime.enable");

    // Emulate mobile 390x844
    await send("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
    });

    console.log("Waiting for game world to load...");
    await new Promise((r) => setTimeout(r, 3500));

    // Ensure Vietnamese locale is active
    await send("Runtime.evaluate", {
      expression: `(() => {
        const viBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText && b.innerText.includes('Tiếng Việt'));
        if (viBtn && viBtn.getAttribute('aria-pressed') !== 'true') viBtn.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 1000));

    // Open "Hành trình của tôi" (My Journey)
    await send("Runtime.evaluate", {
      expression: `(() => {
        const journeyBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText && (b.innerText.includes('Hành trình') || b.innerText.includes('My Journey') || b.innerText.includes('Xem toàn bộ')));
        if (journeyBtn) journeyBtn.click();
        else window.location.hash = '#hc-journey';
      })()`,
    });
    await new Promise((r) => setTimeout(r, 2000));

    // Scroll down inside modal body to show goal cards and bottom stations
    await send("Runtime.evaluate", {
      expression: `(() => {
        const modalBody = document.querySelector('.hc-game-modal-body');
        if (modalBody) modalBody.scrollTop = 420;
      })()`,
    });
    await new Promise((r) => setTimeout(r, 1000));

    // Capture mobile screenshot of Goal Cards & Bottom Stations
    const shot1 = await send("Page.captureScreenshot", { format: "png", quality: 100 });
    const shotPath1 = path.join(artifactsDir, "verified-mobile-journey-cards.png");
    writeFileSync(shotPath1, Buffer.from(shot1.data, "base64"));
    console.log(`Saved mobile journey screenshot to ${shotPath1}`);

    // Inspect the goal card text and layout metrics
    const cardAudit = await send("Runtime.evaluate", {
      expression: `(() => {
        const titleEl = document.querySelector('.hc-active-goal-card .hc-quest-card-title');
        const statusEl = document.querySelector('.hc-active-goal-card .hc-journey-status');
        const quantitiesEl = document.querySelector('.hc-active-goal-card .hc-journey-quantities');
        const checkinBtn = document.querySelector('.hc-goal-quick-checkin-btn');
        const bottomStation = document.querySelector('.hc-station-pill-card');
        const emptyText = document.querySelector('.hc-station-pill-empty-text');

        return {
          title: titleEl?.innerText,
          status: statusEl?.innerText,
          quantities: quantitiesEl?.innerText,
          checkinButtonText: checkinBtn?.innerText?.trim(),
          bottomStationTitle: bottomStation?.querySelector('.hc-station-pill-title')?.innerText,
          bottomStationEmptyText: emptyText?.innerText?.replace(/\\s+/g, ' '),
        };
      })()`,
      returnByValue: true,
    });
    console.log("Card Audit Result:", JSON.stringify(cardAudit.result?.value, null, 2));

    // Now open the Check-in dialog from the goal card
    console.log("Opening Checkin Dialog...");
    await send("Runtime.evaluate", {
      expression: `(() => {
        const btn = document.querySelector('.hc-goal-quick-checkin-btn') || document.querySelector('.hc-journey-today-checkin-btn');
        if (btn) btn.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 1500));

    // Capture screenshot of DailyCheckinDialog step 0
    const shot2 = await send("Page.captureScreenshot", { format: "png", quality: 100 });
    const shotPath2 = path.join(artifactsDir, "verified-checkin-dialog-vi.png");
    writeFileSync(shotPath2, Buffer.from(shot2.data, "base64"));
    console.log(`Saved checkin dialog screenshot to ${shotPath2}`);

    // Inspect checkin dialog text
    const checkinAudit = await send("Runtime.evaluate", {
      expression: `(() => {
        const headerP = document.querySelector('.hc-checkin-dialog .hc-game-modal-header p');
        const headerH2 = document.querySelector('.hc-checkin-dialog #hc-checkin-title');
        const introP = document.querySelector('.hc-checkin-intro');
        const promptH3 = document.querySelector('.hc-companion-checkin h3');
        const answerButtons = Array.from(document.querySelectorAll('.hc-checkin-entries button')).map(b => b.innerText);
        const skipBtn = document.querySelector('.hc-checkin-skip');

        return {
          headerP: headerP?.innerText,
          headerH2: headerH2?.innerText,
          introP: introP?.innerText,
          promptH3: promptH3?.innerText,
          answers: answerButtons,
          skipBtn: skipBtn?.innerText,
        };
      })()`,
      returnByValue: true,
    });
    console.log("Checkin Audit Result:", JSON.stringify(checkinAudit.result?.value, null, 2));

    // Click an answer (e.g. "Khá tốt") to verify step 1 / reflection save
    await send("Runtime.evaluate", {
      expression: `(() => {
        const firstChoice = document.querySelector('.hc-checkin-entries button');
        if (firstChoice) firstChoice.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 1000));

    // Capture screenshot of reflection save / step 1
    const shot3 = await send("Page.captureScreenshot", { format: "png", quality: 100 });
    const shotPath3 = path.join(artifactsDir, "verified-checkin-reflection-save.png");
    writeFileSync(shotPath3, Buffer.from(shot3.data, "base64"));
    console.log(`Saved reflection save screenshot to ${shotPath3}`);

    ws.close();
  } finally {
    chromeProc.kill("SIGKILL");
  }
}

main().catch(console.error);
