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
        expression: `Boolean(document.querySelector('.hc-day-node'))`,
        returnByValue: true,
      });
      if (check.result?.value) break;
      await new Promise((r) => setTimeout(r, 500));
    }

    // Inspect initial layout of modal body
    const inspectLayout = async (tag) => {
      const data = await send("Runtime.evaluate", {
        expression: `(() => {
          const modalBody = document.querySelector('.hc-game-modal-body');
          const modal = document.querySelector('.hc-game-modal');
          const panel = document.querySelector('.hc-my-journey-panel');
          const banner = document.querySelector('.hc-journey-map-banner');
          const grid = document.querySelector('.hc-active-goals-grid');
          const popover = document.querySelector('.hc-day-detail-popover');

          const getMetrics = (el) => el ? {
            tag: el.className,
            clientWidth: el.clientWidth,
            scrollWidth: el.scrollWidth,
            scrollLeft: el.scrollLeft,
            clientHeight: el.clientHeight,
            scrollHeight: el.scrollHeight,
            scrollTop: el.scrollTop,
            rect: el.getBoundingClientRect()
          } : null;

          return {
            modalBody: getMetrics(modalBody),
            modal: getMetrics(modal),
            panel: getMetrics(panel),
            banner: getMetrics(banner),
            grid: getMetrics(grid),
            popover: getMetrics(popover),
            windowWidth: window.innerWidth,
            windowHeight: window.innerHeight,
          };
        })()`,
        returnByValue: true,
      });
      console.log(`[Metrics ${tag}]:`, JSON.stringify(data.result?.value, null, 2));
      return data.result?.value;
    };

    // Find which element causes scrollWidth: 1762
    const badElements = await send("Runtime.evaluate", {
      expression: `(() => {
        const panel = document.querySelector('.hc-my-journey-panel');
        if (!panel) return [];
        const results = [];
        const all = panel.querySelectorAll('*');
        for (const el of all) {
          const rect = el.getBoundingClientRect();
          if (el.scrollWidth > el.clientWidth + 5 || rect.right > window.innerWidth || rect.width > 1200) {
            results.push({
              className: el.className,
              tagName: el.tagName,
              clientWidth: el.clientWidth,
              scrollWidth: el.scrollWidth,
              offsetWidth: el.offsetWidth,
              rectRight: rect.right,
              rectWidth: rect.width,
              innerTextSnippet: el.innerText ? el.innerText.slice(0, 30) : ''
            });
          }
        }
        return results;
      })()`,
      returnByValue: true,
    });
    console.log("Overflowing elements:", JSON.stringify(badElements.result?.value, null, 2));

    // Click Day 01
    console.log("Clicking Day 01...");
    await send("Runtime.evaluate", {
      expression: `(() => {
        const nodes = Array.from(document.querySelectorAll('.hc-day-node'));
        const day1 = nodes.find(n => n.innerText.includes('01'));
        if (day1) day1.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 1000));

    await inspectLayout("After Click Day 01");

    // Capture screenshot
    const ss1 = await send("Page.captureScreenshot", { format: "png" });
    const p1 = path.join(artifactsDir, "diag-after-day01.png");
    writeFileSync(p1, Buffer.from(ss1.data, "base64"));
    console.log("Screenshot saved:", p1);

    ws.close();
  } finally {
    chromeProc.kill();
  }
}

main().catch(console.error);
