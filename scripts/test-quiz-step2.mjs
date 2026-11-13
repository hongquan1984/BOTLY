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

  const profileDir = path.join(root, "App", ".tmp", "inspect-ui", `chrome-quiz-multi-${Date.now()}`);
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

    console.log("Navigating directly to Quiz Step 1 (discovery)...");
    await send("Page.navigate", { url: "http://127.0.0.1:3329/vi/wellness/healthclues/quiz?step=discovery" });
    await new Promise((r) => setTimeout(r, 2500));

    // Wait for quiz container
    for (let i = 0; i < 30; i++) {
      const check = await send("Runtime.evaluate", {
        expression: `Boolean(document.querySelector('[data-healthclues-two-question-quiz]'))`,
        returnByValue: true,
      });
      if (check.result?.value) break;
      await new Promise((r) => setTimeout(r, 300));
    }

    // Step 1: Select 2 concerns
    console.log("Selecting 2 concerns in Step 1...");
    await send("Runtime.evaluate", {
      expression: `(() => {
        const quiz = document.querySelector('[data-healthclues-two-question-quiz]');
        const btns = Array.from(quiz.querySelectorAll('button[aria-pressed]'));
        if (btns[0]) btns[0].click();
        if (btns[1]) btns[1].click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 500));

    const s1Info = await send("Runtime.evaluate", {
      expression: `(() => {
        const quiz = document.querySelector('[data-healthclues-two-question-quiz]');
        const selected = Array.from(quiz.querySelectorAll('button[aria-pressed="true"]')).map(b => b.innerText.trim().replace(/\\s+/g, ' '));
        const badge = Array.from(quiz.querySelectorAll('span')).find(s => s.innerText.includes('Đã chọn:'))?.innerText;
        return { selected, badge };
      })()`,
      returnByValue: true,
    });
    console.log("Step 1 State:", JSON.stringify(s1Info.result?.value, null, 2));

    // Click Next to Step 2
    console.log("Advancing to Step 2...");
    await send("Runtime.evaluate", {
      expression: `(() => {
        const quiz = document.querySelector('[data-healthclues-two-question-quiz]');
        const next = Array.from(quiz.querySelectorAll('button')).find(b => b.innerText.includes('Tiếp tục'));
        if (next) next.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 800));

    // Step 2: Select Option 0, Option 1, and Option 2
    console.log("Selecting 3 multiple options in Step 2...");
    await send("Runtime.evaluate", {
      expression: `(() => {
        const quiz = document.querySelector('[data-healthclues-two-question-quiz]');
        const btns = Array.from(quiz.querySelectorAll('button[aria-pressed]'));
        if (btns[0]) btns[0].click();
        if (btns[1]) btns[1].click();
        if (btns[2]) btns[2].click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 500));

    const s2MultiInfo = await send("Runtime.evaluate", {
      expression: `(() => {
        const quiz = document.querySelector('[data-healthclues-two-question-quiz]');
        const selected = Array.from(quiz.querySelectorAll('button[aria-pressed="true"]')).map(b => b.innerText.trim().replace(/\\s+/g, ' '));
        const badge = Array.from(quiz.querySelectorAll('span')).find(s => s.innerText.includes('Đã chọn:'))?.innerText;
        return { selected, badge };
      })()`,
      returnByValue: true,
    });
    console.log("Step 2 Multi-Selection (3 items):", JSON.stringify(s2MultiInfo.result?.value, null, 2));

    // Check age confirmed
    await send("Runtime.evaluate", {
      expression: `(() => {
        const cb = document.querySelector('input[type="checkbox"]');
        if (cb && !cb.checked) cb.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 400));

    // Capture screenshot of Step 2 with multiple items selected
    const ssMulti = await send("Page.captureScreenshot", { format: "png" });
    const pMulti = path.join(artifactsDir, "verified-quiz-step2-multi-success.png");
    writeFileSync(pMulti, Buffer.from(ssMulti.data, "base64"));
    console.log("Saved Step 2 Multi-select screenshot to:", pMulti);

    ws.close();
  } finally {
    chromeProc.kill();
  }
}

main().catch(console.error);
