import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, writeFileSync } from "node:fs";
import net from "node:net";
import path from "node:path";

const artifactsDir = "C:\\Users\\Admin\\.gemini\\antigravity\\brain\\bf806726-5fdf-45f1-b574-a2b65a5fbf0f";

async function main() {
  const chromePath = [
    path.join(process.env.PROGRAMFILES || "C:\\Program Files", "Google", "Chrome", "Application", "chrome.exe"),
  ].find(existsSync);

  const probe = net.createServer();
  const debugPort = await new Promise(resolve => probe.listen(0, "127.0.0.1", () => {
    const port = probe.address().port;
    probe.close(() => resolve(port));
  }));

  const chromeProc = spawn(chromePath, [
    `--remote-debugging-port=${debugPort}`,
    "--no-first-run",
    "--headless=new",
    "--window-size=1440,900",
    "http://127.0.0.1:3329/play-demo.html",
  ]);

  try {
    let targetWs = null;
    for (let i = 0; i < 30; i++) {
      try {
        const res = await fetch(`http://127.0.0.1:${debugPort}/json/list`);
        const json = await res.json();
        const page = json.find(p => p.type === "page" && p.webSocketDebuggerUrl);
        if (page) { targetWs = page.webSocketDebuggerUrl; break; }
      } catch {}
      await new Promise(r => setTimeout(r, 200));
    }
    const ws = new WebSocket(targetWs);
    await new Promise(r => ws.addEventListener("open", r, { once: true }));

    let id = 1;
    const send = (method, params = {}) => new Promise((resolve) => {
      const msgId = id++;
      const handler = (e) => {
        const d = JSON.parse(e.data);
        if (d.id === msgId) {
          ws.removeEventListener("message", handler);
          resolve(d.result);
        }
      };
      ws.addEventListener("message", handler);
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });

    await send("Page.enable");
    await send("Runtime.enable");

    await new Promise(r => setTimeout(r, 3000));

    // Ensure Vietnamese
    await send("Runtime.evaluate", {
      expression: `(() => {
        const vi = Array.from(document.querySelectorAll('button')).find(b => b.innerText && b.innerText.includes('Tiếng Việt'));
        if (vi) vi.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 800));

    // Open My Journey
    await send("Runtime.evaluate", { expression: `window.location.hash = '#hc-journey'` });
    await new Promise(r => setTimeout(r, 1500));

    // Scroll to goals
    await send("Runtime.evaluate", {
      expression: `(() => {
        const mb = document.querySelector('.hc-game-modal-body');
        if (mb) mb.scrollTop = 380;
      })()`
    });
    await new Promise(r => setTimeout(r, 1000));

    // Inspect the goals text
    const inspectResult = await send("Runtime.evaluate", {
      expression: `(() => {
        return Array.from(document.querySelectorAll('.hc-active-goal-card')).map(card => {
          return {
            title: card.querySelector('.hc-quest-card-title')?.innerText,
            desc: card.querySelector('.hc-goal-desc-text')?.innerText,
            hasOldAmberBox: !!card.querySelector('.hc-goal-action-box'),
            pills: Array.from(card.querySelectorAll('.hc-goal-card-pills-row span')).map(s => s.innerText),
          };
        });
      })()`,
      returnByValue: true,
    });
    console.log("Card Inspection on Desktop:", JSON.stringify(inspectResult.result?.value, null, 2));

    // Capture desktop screenshot
    const shotDesktop = await send("Page.captureScreenshot", { format: "png", quality: 100 });
    writeFileSync(path.join(artifactsDir, "verified-compact-goals-desktop.png"), Buffer.from(shotDesktop.data, "base64"));
    console.log("Saved verified-compact-goals-desktop.png");

    // Switch to mobile viewport (390x844)
    await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
    await new Promise(r => setTimeout(r, 1000));

    // Scroll to goals on mobile
    await send("Runtime.evaluate", {
      expression: `(() => {
        const mb = document.querySelector('.hc-game-modal-body');
        if (mb) mb.scrollTop = 300;
      })()`
    });
    await new Promise(r => setTimeout(r, 1000));

    const shotMobile = await send("Page.captureScreenshot", { format: "png", quality: 100 });
    writeFileSync(path.join(artifactsDir, "verified-compact-goals-mobile.png"), Buffer.from(shotMobile.data, "base64"));
    console.log("Saved verified-compact-goals-mobile.png");

    ws.close();
  } finally {
    chromeProc.kill("SIGKILL");
  }
}
main().catch(console.error);
