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

  const profileDir = path.join(root, "App", ".tmp", "inspect-ui", `chrome-past-lock-${Date.now()}`);
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
    await new Promise((r) => setTimeout(r, 4000));

    // Wait for world scene & active goals to load
    for (let i = 0; i < 40; i++) {
      const check = await send("Runtime.evaluate", {
        expression: `(() => {
          const dayNode = Boolean(document.querySelector('.hc-day-node'));
          const hasGoals = document.querySelectorAll('.hc-active-goal-card').length > 0;
          return { dayNode, hasGoals };
        })()`,
        returnByValue: true,
      });
      console.log(`[Wait Check ${i}]:`, check.result?.value);
      if (check.result?.value?.dayNode && check.result?.value?.hasGoals) break;
      await new Promise((r) => setTimeout(r, 1000));
    }

    // 1. Click Day 01 (Past unrecorded day)
    console.log("Clicking Day 01 node...");
    const clickDay1 = await send("Runtime.evaluate", {
      expression: `(() => {
        const nodes = Array.from(document.querySelectorAll('.hc-day-node'));
        const day1 = nodes.find(n => n.innerText.includes('01'));
        if (day1) {
          day1.click();
          return true;
        }
        return false;
      })()`,
      returnByValue: true,
    });
    console.log("Clicked Day 01:", clickDay1.result?.value);

    await new Promise((r) => setTimeout(r, 1000));

    // Check Day 01 popover & button on cards
    const day1State = await send("Runtime.evaluate", {
      expression: `(() => {
        const popover = document.querySelector('.hc-day-detail-popover');
        const popoverHeader = popover?.querySelector('.hc-day-popover-header')?.innerText.trim();
        const popoverBody = popover?.querySelector('.hc-day-popover-body')?.innerText.trim();
        const cardButtons = Array.from(document.querySelectorAll('.hc-active-goal-card .hc-goal-quick-checkin-btn')).map(btn => ({
          text: btn.innerText.trim(),
          disabled: btn.disabled,
          classes: btn.className,
          title: btn.title
        }));
        return { popoverHeader, popoverBody, cardButtons };
      })()`,
      returnByValue: true,
    });
    console.log("Day 01 Selected State:", JSON.stringify(day1State.result?.value, null, 2));

    // Capture screenshot of Day 01 selected state (shows popover locked & card buttons locked)
    const day1Ss = await send("Page.captureScreenshot", { format: "png" });
    const day1Path = path.join(artifactsDir, "verified-day01-past-locked.png");
    writeFileSync(day1Path, Buffer.from(day1Ss.data, "base64"));
    console.log("Saved day 01 locked screenshot to:", day1Path);

    // 2. Click Day 04 (Today)
    console.log("Clicking Day 04 node (Today)...");
    await send("Runtime.evaluate", {
      expression: `(() => {
        const nodes = Array.from(document.querySelectorAll('.hc-day-node'));
        const day4 = nodes.find(n => n.innerText.includes('04'));
        if (day4) day4.click();
      })()`,
    });

    await new Promise((r) => setTimeout(r, 1000));

    const day4State = await send("Runtime.evaluate", {
      expression: `(() => {
        const popover = document.querySelector('.hc-day-detail-popover');
        const popoverHeader = popover?.querySelector('.hc-day-popover-header')?.innerText.trim();
        const cardButtons = Array.from(document.querySelectorAll('.hc-active-goal-card .hc-goal-quick-checkin-btn')).map(btn => ({
          text: btn.innerText.trim(),
          disabled: btn.disabled,
          classes: btn.className
        }));
        return { popoverHeader, cardButtons };
      })()`,
      returnByValue: true,
    });
    console.log("Day 04 (Today) State:", JSON.stringify(day4State.result?.value, null, 2));

    const day4Ss = await send("Page.captureScreenshot", { format: "png" });
    const day4Path = path.join(artifactsDir, "verified-day04-today-status.png");
    writeFileSync(day4Path, Buffer.from(day4Ss.data, "base64"));
    console.log("Saved day 04 screenshot to:", day4Path);

    ws.close();
  } finally {
    chromeProc.kill();
  }
}

main().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});
