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

  const profileDir = path.join(root, "App", ".tmp", "inspect-ui", `chrome-flow-${Date.now()}`);
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

    // ==========================================
    // PHASE 1: TEST QUIZ MULTI-SELECT
    // ==========================================
    console.log("Navigating to Quiz at http://127.0.0.1:3329/vi/wellness/healthclues/quiz...");
    await send("Page.navigate", { url: "http://127.0.0.1:3329/vi/wellness/healthclues/quiz" });
    await new Promise((r) => setTimeout(r, 2500));

    // Wait for quiz screen 1 choices
    for (let i = 0; i < 30; i++) {
      const check = await send("Runtime.evaluate", {
        expression: `document.querySelectorAll('button[aria-pressed]').length > 0`,
        returnByValue: true,
      });
      if (check.result?.value) break;
      await new Promise((r) => setTimeout(r, 300));
    }

    // Step 1: Select 2 concerns inside the quiz section
    console.log("Selecting 2 concerns in Step 1...");
    await send("Runtime.evaluate", {
      expression: `(() => {
        const quiz = document.querySelector('[data-healthclues-two-question-quiz]');
        const btns = Array.from(quiz.querySelectorAll('button[aria-pressed]'));
        if (btns[0]) btns[0].click();
        if (btns[1]) btns[1].click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 400));

    // Check Step 1 count badge
    const step1State = await send("Runtime.evaluate", {
      expression: `(() => {
        const quiz = document.querySelector('[data-healthclues-two-question-quiz]');
        const selectedButtons = Array.from(quiz.querySelectorAll('button[aria-pressed="true"]')).map(b => b.innerText.trim());
        const badge = Array.from(quiz.querySelectorAll('span')).find(s => s.innerText.includes('Đã chọn:'))?.innerText;
        return { selectedButtons, badge };
      })()`,
      returnByValue: true,
    });
    console.log("Step 1 Selection:", JSON.stringify(step1State.result?.value, null, 2));

    // Click Next to Step 2
    console.log("Clicking Next to Step 2...");
    await send("Runtime.evaluate", {
      expression: `(() => {
        const quiz = document.querySelector('[data-healthclues-two-question-quiz]');
        const nextBtn = Array.from(quiz.querySelectorAll('button')).find(b => b.innerText.includes('Tiếp tục'));
        if (nextBtn) nextBtn.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 800));

    // Step 2: Select multiple factors (e.g. 1st, 2nd, and 3rd option)
    console.log("Selecting multiple factors in Step 2...");
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

    const step2State = await send("Runtime.evaluate", {
      expression: `(() => {
        const quiz = document.querySelector('[data-healthclues-two-question-quiz]');
        const selectedButtons = Array.from(quiz.querySelectorAll('button[aria-pressed="true"]')).map(b => b.innerText.trim().replace(/\\s+/g, ' '));
        const badge = Array.from(quiz.querySelectorAll('span')).find(s => s.innerText.includes('Đã chọn:'))?.innerText;
        return { selectedButtons, badge };
      })()`,
      returnByValue: true,
    });
    console.log("Step 2 Multi-Selection Result:", JSON.stringify(step2State.result?.value, null, 2));

    // Capture screenshot of Quiz Step 2 with multiple selections
    const quizSs = await send("Page.captureScreenshot", { format: "png" });
    const quizPath = path.join(artifactsDir, "verified-quiz-step2-multi-select.png");
    writeFileSync(quizPath, Buffer.from(quizSs.data, "base64"));
    console.log("Saved Quiz Step 2 screenshot to:", quizPath);

    // ==========================================
    // PHASE 2: TEST WORLD & MY JOURNEY LAYOUT
    // ==========================================
    console.log("Navigating to http://127.0.0.1:3329/play-demo.html...");
    await send("Page.navigate", { url: "http://127.0.0.1:3329/play-demo.html" });
    await new Promise((r) => setTimeout(r, 3500));

    // Wait for world scene
    for (let i = 0; i < 40; i++) {
      const check = await send("Runtime.evaluate", {
        expression: `Boolean(document.querySelector('.hc-day-node'))`,
        returnByValue: true,
      });
      if (check.result?.value) break;
      await new Promise((r) => setTimeout(r, 500));
    }

    // Check modal overflow metrics
    const metrics = await send("Runtime.evaluate", {
      expression: `(() => {
        const modalBody = document.querySelector('.hc-game-modal-body');
        const modal = document.querySelector('.hc-game-modal');
        const panel = document.querySelector('.hc-my-journey-panel');
        return {
          modalBodyScrollWidth: modalBody?.scrollWidth,
          modalBodyClientWidth: modalBody?.clientWidth,
          modalBodyScrollLeft: modalBody?.scrollLeft,
          panelScrollWidth: panel?.scrollWidth,
          panelClientWidth: panel?.clientWidth,
          hasHorizontalScroll: modalBody ? modalBody.scrollWidth > modalBody.clientWidth : false
        };
      })()`,
      returnByValue: true,
    });
    console.log("Layout Overflow Check:", JSON.stringify(metrics.result?.value, null, 2));

    // 1. Click Day 01 (Past unrecorded)
    console.log("Clicking Day 01 node (Past)...");
    await send("Runtime.evaluate", {
      expression: `(() => {
        const nodes = Array.from(document.querySelectorAll('.hc-day-node'));
        const day1 = nodes.find(n => n.innerText.includes('01'));
        if (day1) day1.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 800));

    const day1Details = await send("Runtime.evaluate", {
      expression: `(() => {
        const popoverHeader = document.querySelector('.hc-day-popover-header')?.innerText.trim();
        const popoverBody = document.querySelector('.hc-day-popover-body')?.innerText.trim();
        const cardButtons = Array.from(document.querySelectorAll('.hc-active-goal-card .hc-goal-quick-checkin-btn')).map(b => ({
          text: b.innerText.trim(),
          disabled: b.disabled,
          classes: b.className
        }));
        return { popoverHeader, popoverBody, cardButtons };
      })()`,
      returnByValue: true,
    });
    console.log("Day 01 Selected Details:", JSON.stringify(day1Details.result?.value, null, 2));

    const day1Ss = await send("Page.captureScreenshot", { format: "png" });
    const day1Path = path.join(artifactsDir, "verified-day01-locked-view.png");
    writeFileSync(day1Path, Buffer.from(day1Ss.data, "base64"));
    console.log("Saved Day 01 screenshot to:", day1Path);

    // 2. Click Day 04 (Today)
    console.log("Clicking Day 04 node (Today)...");
    await send("Runtime.evaluate", {
      expression: `(() => {
        const nodes = Array.from(document.querySelectorAll('.hc-day-node'));
        const day4 = nodes.find(n => n.innerText.includes('04'));
        if (day4) day4.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 800));

    const day4Ss = await send("Page.captureScreenshot", { format: "png" });
    const day4Path = path.join(artifactsDir, "verified-day04-today-view.png");
    writeFileSync(day4Path, Buffer.from(day4Ss.data, "base64"));
    console.log("Saved Day 04 screenshot to:", day4Path);

    ws.close();
  } finally {
    chromeProc.kill();
  }
}

main().catch(console.error);
