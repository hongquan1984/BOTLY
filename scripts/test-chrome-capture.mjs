import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

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
    "--window-size=1440,900",
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
      await new Promise((r) => setTimeout(r, 250));
    }
    assert.ok(targetWs, "Could not connect to Chrome debugging target");

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
    await send("DOM.enable");
    await send("Runtime.enable");

    // First navigate to set localStorage
    console.log("Navigating to http://127.0.0.1:3329/play-demo.html ...");
    await send("Page.navigate", { url: "http://127.0.0.1:3329/play-demo.html" });
    await new Promise((r) => setTimeout(r, 2000));

    // Wait for redirect to /vi/wellness/healthclues/world?quest=sleep-better
    console.log("Waiting for world page...");
    await new Promise((r) => setTimeout(r, 2000));

    // If on the entry page, click "Enter My Wellness World"
    await send("Runtime.evaluate", {
      expression: `(() => {
        const enterBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText && b.innerText.includes('Enter My Wellness World'));
        if (enterBtn) {
          console.log('Clicking Enter My Wellness World button');
          enterBtn.click();
        }
      })()`,
    });
    await new Promise((r) => setTimeout(r, 2000));

    // Now trigger My Journey
    await send("Runtime.evaluate", {
      expression: `(() => {
        const journeyBtn = document.querySelector('[data-my-journey-button]');
        if (journeyBtn) {
          console.log('Clicking journey button');
          journeyBtn.click();
        } else {
          window.location.hash = '#hc-journey';
        }
      })()`,
    });
    await new Promise((r) => setTimeout(r, 2000));

    // Evaluate modal visual styles
    const stylesResult = await send("Runtime.evaluate", {
      expression: `(() => {
        const modal = document.querySelector('.hc-game-modal.hc-game-modal-journey');
        const banner = document.querySelector('.hc-journey-map-banner');
        const goalsSection = document.querySelector('.hc-active-goals-section');
        const goalCards = document.querySelectorAll('.hc-active-goal-card');
        const stations = document.querySelectorAll('.hc-station-pill-card');
        const popover = document.querySelector('.hc-day-detail-popover');
        const pet = document.querySelector('.hc-journey-banner-pet');

        return {
          hasModal: !!modal,
          modalBg: modal ? window.getComputedStyle(modal).backgroundImage || window.getComputedStyle(modal).backgroundColor : null,
          hasBanner: !!banner,
          hasPopover: !!popover,
          goalsCount: goalCards.length,
          stationsCount: stations.length,
          hasPet: !!pet,
          bannerText: banner ? banner.innerText.slice(0, 150) : null
        };
      })()`,
      returnByValue: true,
    });
    console.log("Evaluated UI state:", stylesResult.result?.value);

    // Capture screenshot
    const shot = await send("Page.captureScreenshot", { format: "png", quality: 100 });
    const shotPath = path.join(artifactsDir, "my-journey-live-check.png");
    writeFileSync(shotPath, Buffer.from(shot.data, "base64"));
    console.log(`Saved screenshot to ${shotPath}`);

    ws.close();
  } finally {
    chromeProc.kill("SIGKILL");
  }
}

main().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
