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

  const profileDir = path.join(root, "App", ".tmp", "inspect-ui", `chrome-checkin-${Date.now()}`);
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

    // Wait for world scene
    for (let i = 0; i < 40; i++) {
      const check = await send("Runtime.evaluate", {
        expression: `Boolean(document.querySelector('.hc-active-goals-section') && document.querySelector('.hc-goal-quick-checkin-btn'))`,
        returnByValue: true,
      });
      if (check.result?.value) break;
      await new Promise((r) => setTimeout(r, 500));
    }

    // 1. Click Quick Checkin button
    console.log("Clicking quick check-in button...");
    const clickCheckin = await send("Runtime.evaluate", {
      expression: `(() => {
        const btn = document.querySelector('.hc-goal-quick-checkin-btn');
        if (btn) {
          btn.click();
          return true;
        }
        return false;
      })()`,
      returnByValue: true,
    });
    console.log("Clicked quick check-in:", clickCheckin.result?.value);

    // Wait for checkin dialog
    await new Promise((r) => setTimeout(r, 1500));

    // 2. Perform 2-choice check-in: 1 Done, 1 Not Yet + Reason
    const checkinState = await send("Runtime.evaluate", {
      expression: `(() => {
        const dialog = document.querySelector('.hc-checkin-dialog');
        if (!dialog) return { found: false };

        // Click 'Hoàn thành' on first card
        const firstDoneBtn = dialog.querySelectorAll('.hc-checkin-btn.is-done')[0];
        if (firstDoneBtn) firstDoneBtn.click();

        // Click 'Chưa hoàn thành' on second card
        const secondNotYetBtn = dialog.querySelectorAll('.hc-checkin-btn.is-not-yet')[1];
        if (secondNotYetBtn) secondNotYetBtn.click();

        return { found: true };
      })()`,
      returnByValue: true,
    });
    console.log("Dialog interaction:", checkinState.result?.value);

    await new Promise((r) => setTimeout(r, 800));

    // Type reason for second goal
    await send("Runtime.evaluate", {
      expression: `(() => {
        const reasonInput = document.querySelector('.hc-reason-input');
        if (reasonInput) {
          reasonInput.value = 'Hôm nay bận việc gia đình, mai tiếp tục';
          reasonInput.dispatchEvent(new Event('input', { bubbles: true }));
          reasonInput.dispatchEvent(new Event('change', { bubbles: true }));
        }
      })()`,
    });

    await new Promise((r) => setTimeout(r, 500));

    // Capture screenshot of check-in dialog with 2 choices + reason
    const checkinSs = await send("Page.captureScreenshot", { format: "png" });
    const checkinPath = path.join(artifactsDir, "verified-2choice-checkin-with-reason.png");
    writeFileSync(checkinPath, Buffer.from(checkinSs.data, "base64"));
    console.log("Saved checkin modal screenshot to:", checkinPath);

    // Click 'Lưu ghi nhận'
    console.log("Submitting check-in...");
    await send("Runtime.evaluate", {
      expression: `(() => {
        const saveBtn = Array.from(document.querySelectorAll('.hc-checkin-buttons button')).find(b => b.innerText.includes('Lưu') || b.innerText.includes('Save'));
        if (saveBtn) saveBtn.click();
      })()`,
    });

    // Wait for check-in to save and dialog to close
    await new Promise((r) => setTimeout(r, 2500));

    // 3. Inspect Day 04 Node & Stars
    const dayNodeEval = await send("Runtime.evaluate", {
      expression: `(() => {
        const node = Array.from(document.querySelectorAll('.hc-day-node')).find(n => n.querySelector('.hc-day-node-num')?.innerText.includes('04') || n.innerText.includes('04'));
        if (!node) return null;
        return {
          text: node.innerText.trim(),
          hasStars: Boolean(node.querySelector('.hc-day-node-stars')),
          starsCount: node.querySelectorAll('.hc-node-star').length,
          filledStars: node.querySelectorAll('.hc-node-star.is-filled').length,
          starsLabel: node.querySelector('.hc-day-node-stars')?.getAttribute('aria-label'),
          classes: node.className
        };
      })()`,
      returnByValue: true,
    });
    console.log("Day 04 Node after check-in:", JSON.stringify(dayNodeEval.result?.value, null, 2));

    // Capture screenshot of Day Node Stars on Timeline
    const timelineSs = await send("Page.captureScreenshot", { format: "png" });
    const timelinePath = path.join(artifactsDir, "verified-day-node-stars-proportional.png");
    writeFileSync(timelinePath, Buffer.from(timelineSs.data, "base64"));
    console.log("Saved timeline screenshot to:", timelinePath);

    ws.close();
  } finally {
    chromeProc.kill();
  }
}

main().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});
