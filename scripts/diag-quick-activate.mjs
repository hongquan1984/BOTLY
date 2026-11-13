import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import net from "node:net";
import path from "node:path";

const root = "d:\\botly";

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

  const profileDir = path.join(root, "App", ".tmp", "inspect-ui", `chrome-diag-${Date.now()}`);
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

    ws.addEventListener("message", (event) => {
      const data = JSON.parse(event.data);
      if (data.method === "Runtime.consoleAPICalled") {
        console.log("[BROWSER CONSOLE]", data.params.type, data.params.args.map(a => a.value || a.description));
      }
      if (data.method === "Runtime.exceptionThrown") {
        console.error("[BROWSER EXCEPTION]", data.params.exceptionDetails);
      }
    });

    await send("Page.enable");
    await send("Runtime.enable");

    console.log("Navigating to Quiz Step 1...");
    await send("Page.navigate", { url: "http://127.0.0.1:3329/vi/wellness/healthclues/quiz?quest=health-concern&step=discovery" });
    await new Promise((r) => setTimeout(r, 2500));

    // Step 1: select option & click Next
    await send("Runtime.evaluate", {
      expression: `(() => {
        const quiz = document.querySelector('[data-healthclues-two-question-quiz]');
        const btns = Array.from(quiz.querySelectorAll('button[aria-pressed]'));
        if (btns[0]) btns[0].click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 400));
    await send("Runtime.evaluate", {
      expression: `(() => {
        const quiz = document.querySelector('[data-healthclues-two-question-quiz]');
        const nextBtn = Array.from(quiz.querySelectorAll('button')).find(b => b.textContent.includes('Tiếp tục'));
        if (nextBtn) nextBtn.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 1000));

    // Step 2: select a factor & click Finish
    await send("Runtime.evaluate", {
      expression: `(() => {
        const quiz = document.querySelector('[data-healthclues-two-question-quiz]');
        const btns = Array.from(quiz.querySelectorAll('button[aria-pressed]'));
        if (btns[0]) btns[0].click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 400));
    await send("Runtime.evaluate", {
      expression: `(() => {
        const quiz = document.querySelector('[data-healthclues-two-question-quiz]');
        const finishBtn = Array.from(quiz.querySelectorAll('button')).find(b => b.textContent.includes('kích hoạt tài khoản'));
        if (finishBtn) finishBtn.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 1500));

    // In Preview: click Start Journey
    console.log("Clicking Start Journey in Preview...");
    const openRes = await send("Runtime.evaluate", {
      expression: `(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const startBtn = btns.find(b => b.textContent.includes('BẮT ĐẦU HÀNH TRÌNH') || b.textContent.includes('START YOUR JOURNEY'));
        if (startBtn) {
          startBtn.click();
          return { clicked: true, text: startBtn.textContent.trim() };
        }
        return { clicked: false, btns: btns.map(b => b.textContent.trim()) };
      })()`,
      returnByValue: true,
    });
    console.log("Open dialog:", openRes.result?.value);
    await new Promise((r) => setTimeout(r, 1000));

    // Fill email and click Instant Activate
    console.log("Filling email and clicking Instant Activate...");
    const actRes = await send("Runtime.evaluate", {
      expression: `(() => {
        const emailInput = document.querySelector('#hc-activation-email') || document.querySelector('input[type="email"]');
        if (emailInput) {
          emailInput.value = 'hongquan0508@gmail.com';
          emailInput.dispatchEvent(new Event('input', { bubbles: true }));
          emailInput.dispatchEvent(new Event('change', { bubbles: true }));
        }
        const btns = Array.from(document.querySelectorAll('button'));
        const instantBtn = btns.find(b => b.textContent.includes('Kích hoạt tức thì') || b.textContent.includes('Instant Activate'));
        if (instantBtn) {
          instantBtn.click();
          return { clicked: true, text: instantBtn.textContent.trim() };
        }
        return { clicked: false, btns: btns.map(b => b.textContent.trim()) };
      })()`,
      returnByValue: true,
    });
    console.log("Instant activate result:", actRes.result?.value);

    // Wait and check URL every second
    for (let i = 0; i < 15; i++) {
      await new Promise((r) => setTimeout(r, 1000));
      const url = await send("Runtime.evaluate", { expression: "window.location.href", returnByValue: true });
      const errorMsg = await send("Runtime.evaluate", {
        expression: `document.querySelector('[role="alert"]')?.textContent || ''`,
        returnByValue: true,
      });
      console.log(`[T+${i + 1}s] URL: ${url.result?.value} | Alert: ${errorMsg.result?.value}`);
    }

    ws.close();
  } finally {
    chromeProc.kill("SIGTERM");
  }
}

main().catch(console.error);
