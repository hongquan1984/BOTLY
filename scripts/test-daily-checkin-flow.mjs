import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
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

  const profileDir = path.join(root, "App", ".tmp", "inspect-ui", `chrome-checkin-${Date.now()}`);
  mkdirSync(profileDir, { recursive: true });

  const chromeProc = spawn(chromePath, [
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${profileDir}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--headless=new",
    "--disable-gpu",
    "--window-size=1440,900",
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
    assert.ok(targetWs);

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

    console.log("Waiting for world page...");
    await new Promise((r) => setTimeout(r, 3000));

    // Check initial state: Day 3 node status
    const beforeCheckin = await send("Runtime.evaluate", {
      expression: `(() => {
        const d3 = document.querySelector('.hc-day-node:nth-child(3)');
        const btn = document.querySelector('.hc-journey-today-checkin-btn');
        return {
          day3Class: d3 ? d3.className : null,
          hasCheckinBtn: !!btn,
        };
      })()`,
      returnByValue: true,
    });
    console.log("Before checkin:", beforeCheckin.result?.value);

    // Click check-in button
    await send("Runtime.evaluate", {
      expression: `(() => {
        const btn = document.querySelector('.hc-journey-today-checkin-btn');
        if (btn) btn.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 1500));

    // In checkin modal, select statuses and submit
    await send("Runtime.evaluate", {
      expression: `(() => {
        // Find status buttons (e.g. "Tried / Used" or "done")
        const doneBtns = Array.from(document.querySelectorAll('button')).filter(b => b.innerText && (b.innerText.includes('Tried') || b.innerText.includes('Used') || b.innerText.includes('Đã thử')));
        doneBtns.forEach(b => b.click());

        // Find submit button
        const submitBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText && (b.innerText.includes('Save check-in') || b.innerText.includes('Lưu ghi nhận')));
        if (submitBtn) submitBtn.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 2500));

    // Reopen My Journey if it closed
    await send("Runtime.evaluate", {
      expression: `(() => {
        if (!document.querySelector('[data-my-journey-panel]')) {
          const btn = document.querySelector('[data-my-journey-button]');
          if (btn) btn.click();
        }
      })()`,
    });
    await new Promise((r) => setTimeout(r, 2000));

    // Capture screenshot after checkin
    const shot = await send("Page.captureScreenshot", { format: "png", quality: 100 });
    const shotPath = path.join(artifactsDir, "my-journey-after-checkin.png");
    writeFileSync(shotPath, Buffer.from(shot.data, "base64"));
    console.log(`Saved screenshot after checkin to ${shotPath}`);

    const afterCheckin = await send("Runtime.evaluate", {
      expression: `(() => {
        const d3 = document.querySelector('.hc-day-node:nth-child(3)');
        const pct = document.querySelector('.hc-progress-percent-num');
        const count = document.querySelector('.hc-progress-counts-col strong');
        return {
          day3Class: d3 ? d3.className : null,
          percent: pct ? pct.innerText : null,
          counts: count ? count.innerText : null,
        };
      })()`,
      returnByValue: true,
    });
    console.log("After checkin:", afterCheckin.result?.value);

    ws.close();
  } finally {
    chromeProc.kill("SIGKILL");
  }
}

main().catch(console.error);
