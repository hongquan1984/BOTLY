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
  assert.ok(chromePath, "Google Chrome is required.");

  const probe = net.createServer();
  const debugPort = await new Promise((resolve) => {
    probe.listen(0, "127.0.0.1", () => {
      const port = probe.address().port;
      probe.close(() => resolve(port));
    });
  });

  const profileDir = path.join(root, "App", ".tmp", "inspect-ui", `chrome-${Date.now()}`);
  mkdirSync(profileDir, { recursive: true });

  const chromeProc = spawn(chromePath, [
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${profileDir}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--headless=new",
    "--disable-gpu",
    "--window-size=1280,900",
    "about:blank",
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
      await new Promise((r) => setTimeout(r, 200));
    }
    assert.ok(targetWs, "Could not obtain Chrome WebSocket endpoint.");

    const ws = new WebSocket(targetWs);
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    let id = 1;
    const send = (method, params = {}) =>
      new Promise((resolve, reject) => {
        const msgId = id++;
        const handler = (event) => {
          const data = JSON.parse(event.data);
          if (data.id === msgId) {
            ws.removeEventListener("message", handler);
            if (data.error) reject(new Error(data.error.message || JSON.stringify(data.error)));
            else resolve(data.result);
          }
        };
        ws.addEventListener("message", handler);
        ws.send(JSON.stringify({ id: msgId, method, params }));
      });

    await send("Page.enable");
    await send("Runtime.enable");
    await send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });

    console.log("Navigating to http://127.0.0.1:3329/play-demo.html...");
    await send("Page.navigate", { url: "http://127.0.0.1:3329/play-demo.html" });
    await new Promise((r) => setTimeout(r, 3500));

    // Wait for world scene to appear
    console.log("Waiting for world journey scene...");
    for (let i = 0; i < 40; i++) {
      const check = await send("Runtime.evaluate", {
        expression: `Boolean(document.querySelector('.hc-active-goals-section') || document.querySelector('.hc-quest-card-title') || document.querySelector('.hc-day-node'))`,
        returnByValue: true,
      });
      if (check.result?.value) break;
      await new Promise((r) => setTimeout(r, 500));
    }

    await new Promise((r) => setTimeout(r, 2000));

    // 1. Inspect Active Goals
    const activeGoalsRes = await send("Runtime.evaluate", {
      expression: `(() => {
        const titles = Array.from(document.querySelectorAll('.hc-active-goal-card .hc-quest-card-title')).map(el => el.innerText.trim());
        const cards = Array.from(document.querySelectorAll('.hc-active-goal-card')).map(card => ({
          title: card.querySelector('.hc-quest-card-title')?.innerText.trim(),
          exp: card.querySelector('.hc-journey-exp-tag')?.innerText.trim(),
          pills: Array.from(card.querySelectorAll('.hc-goal-card-pills-row span, .hc-goal-card-pills-row button')).map(p => p.innerText.trim())
        }));
        return { titles, cards };
      })()`,
      returnByValue: true,
    });
    console.log("Active Goals Result:", JSON.stringify(activeGoalsRes.result?.value, null, 2));

    // Capture screenshot of main screen with specific habits & timeline stars
    const mainSs = await send("Page.captureScreenshot", { format: "png" });
    const mainPath = path.join(artifactsDir, "verified-active-goals-specific-habits.png");
    writeFileSync(mainPath, Buffer.from(mainSs.data, "base64"));
    console.log("Saved main screenshot to:", mainPath);

    // 2. Inspect Timeline Day Nodes & Stars
    const timelineRes = await send("Runtime.evaluate", {
      expression: `(() => {
        const nodes = Array.from(document.querySelectorAll('.hc-day-node'));
        return nodes.slice(0, 5).map(node => ({
          num: node.querySelector('.hc-day-node-num')?.innerText || node.innerText.trim(),
          hasStars: Boolean(node.querySelector('.hc-day-node-stars')),
          starsCount: node.querySelectorAll('.hc-node-star').length,
          filledStars: node.querySelectorAll('.hc-node-star.is-filled').length,
          starsLabel: node.querySelector('.hc-day-node-stars')?.getAttribute('aria-label'),
          classes: node.className
        }));
      })()`,
      returnByValue: true,
    });
    console.log("Timeline Day Nodes sample:", JSON.stringify(timelineRes.result?.value, null, 2));

    // 3. Open Mission Modal [📜 NHIỆM VỤ]
    console.log("Clicking [📜 NHIỆM VỤ] button...");
    const clickMissionRes = await send("Runtime.evaluate", {
      expression: `(() => {
        const btn = Array.from(document.querySelectorAll('button, a')).find(b => b.innerText.includes('NHIỆM VỤ') || b.getAttribute('aria-label')?.includes('Nhiệm vụ'));
        if (btn) {
          btn.click();
          return true;
        }
        return false;
      })()`,
      returnByValue: true,
    });
    console.log("Clicked mission modal button:", clickMissionRes.result?.value);

    // Wait for modal to render
    await new Promise((r) => setTimeout(r, 3000));

    // Check if red error alert exists
    const alertRes = await send("Runtime.evaluate", {
      expression: `(() => {
        const alerts = Array.from(document.querySelectorAll('[role="alert"], [data-advisor-error], .hc-plan-error')).map(a => a.innerText.trim());
        const hasRedBox = alerts.some(a => a.includes('không khớp') || a.includes('mismatch') || a.includes('Chưa tạo gợi ý'));
        const followingGoals = Array.from(document.querySelectorAll('[data-currently-following] li strong, .hc-plan-following li strong, .hc-plan-goal h3')).map(el => el.innerText.trim());
        const planIntro = document.querySelector('.hc-plan-intro, .hc-plan-recovery')?.innerText.trim();
        return { alerts, hasRedBox, followingGoals, planIntro: planIntro ? planIntro.slice(0, 150) : null };
      })()`,
      returnByValue: true,
    });
    console.log("Mission Modal Status:", JSON.stringify(alertRes.result?.value, null, 2));

    // Capture screenshot of Mission Modal
    const missionSs = await send("Page.captureScreenshot", { format: "png" });
    const missionPath = path.join(artifactsDir, "verified-mission-panel-no-mismatch.png");
    writeFileSync(missionPath, Buffer.from(missionSs.data, "base64"));
    console.log("Saved mission modal screenshot to:", missionPath);

    ws.close();
  } finally {
    chromeProc.kill();
  }
}

main().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});
