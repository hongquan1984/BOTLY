import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import net from "node:net";
import path from "node:path";

const root = "d:\\botly";
const artifactsDir = "C:\\Users\\Admin\\.gemini\\antigravity\\brain\\abff8161-8d04-4588-8fd8-ca4619ccaf85";
const base = "http://127.0.0.1:3329";

function saveScreenshot(filename, base64Data) {
  const buf = Buffer.from(base64Data, "base64");
  try { writeFileSync(path.join(artifactsDir, filename), buf); } catch (e) { console.error(e); }
  console.log(`Saved screenshot: ${filename} (${buf.length} bytes)`);
}

async function main() {
  console.log("=== CAPTURING ALL DASHBOARDS FOR AI VISION AUDIT (390px) ===");

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

  const profileDir = path.join(root, "App", ".tmp", "inspect-ui", `chrome-dashboards-vision-${Date.now()}`);
  mkdirSync(profileDir, { recursive: true });

  const chromeProc = spawn(chromePath, [
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${profileDir}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--headless=new",
    "--disable-gpu",
    "--disable-extensions",
    "--window-size=390,844",
    "about:blank",
  ]);

  try {
    let targetWs = null;
    for (let i = 0; i < 40; i++) {
      try {
        const res = await fetch(`http://127.0.0.1:${debugPort}/json/list`);
        const json = await res.json();
        const page = json.find((item) => item.type === "page" && !item.url.startsWith("chrome-extension://") && item.webSocketDebuggerUrl);
        if (page) { targetWs = page.webSocketDebuggerUrl; break; }
      } catch {}
      await new Promise((r) => setTimeout(r, 200));
    }
    assert.ok(targetWs, "Could not obtain target WebSocket debugger URL.");

    const ws = new WebSocket(targetWs);
    await new Promise((resolve, reject) => {
      ws.addEventListener("open", resolve);
      ws.addEventListener("error", reject);
    });

    let msgId = 1;
    function send(method, params = {}) {
      return new Promise((resolve, reject) => {
        const id = msgId++;
        const handler = (evt) => {
          try {
            const data = JSON.parse(evt.data);
            if (data.id === id) {
              ws.removeEventListener("message", handler);
              if (data.error) reject(new Error(JSON.stringify(data.error)));
              else resolve(data.result);
            }
          } catch (e) { reject(e); }
        };
        ws.addEventListener("message", handler);
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    await send("Page.enable");
    await send("DOM.enable");
    await send("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
      hasTouch: true,
    });

    // 1. Authenticate via play-demo.html
    console.log("Authenticating via play-demo.html...");
    await send("Page.navigate", { url: `${base}/play-demo.html` });
    
    // Wait for world and dock to load
    console.log("Waiting for world page and dock to load...");
    for (let i = 0; i < 40; i++) {
      const check = await send("Runtime.evaluate", {
        expression: `(() => {
          const hasMap = Boolean(document.querySelector('[data-region-map]') || document.querySelector('[data-rpg-world]'));
          const hasDock = Boolean(document.querySelector('.hc-rpg-bottom-dock'));
          return { hasMap, hasDock, modal: Boolean(document.querySelector('.hc-game-modal')), url: window.location.href };
        })()`,
        returnByValue: true
      });
      if (check.result?.value?.hasDock) {
        console.log(`World and dock ready (step ${i}):`, check.result?.value);
        break;
      }
      await new Promise((r) => setTimeout(r, 400));
    }
    await new Promise((r) => setTimeout(r, 1000));

    // Ensure Journey Modal is open
    await send("Runtime.evaluate", {
      expression: `(() => {
        const modal = document.querySelector('.hc-game-modal');
        if (!modal) {
          const dock = document.querySelector('.hc-rpg-bottom-dock');
          const journeyBtn = Array.from(dock ? dock.querySelectorAll('.hc-rpg-dock-btn') : []).find(b => b.innerText.includes('Hành Trình') || b.innerText.includes('Journey'));
          if (journeyBtn) journeyBtn.click();
        }
      })()`
    });
    await new Promise((r) => setTimeout(r, 1200));

    // 2. Capture Journey Habits Tab
    console.log("Capturing Journey Habits Tab...");
    const shotHabits = await send("Page.captureScreenshot", { format: "png" });
    saveScreenshot("vision-raw-journey-habits-mobile-390.png", shotHabits.data);

    // 3. Switch to Roadmap Tab
    console.log("Switching to Roadmap Tab...");
    await send("Runtime.evaluate", {
      expression: `(() => {
        const modal = document.querySelector('.hc-game-modal');
        const tabBtns = Array.from(modal ? modal.querySelectorAll('.hc-journey-nav-tab-btn') : []);
        if (tabBtns[1]) tabBtns[1].click();
      })()`
    });
    await new Promise((r) => setTimeout(r, 1000));
    const shotRoadmap = await send("Page.captureScreenshot", { format: "png" });
    saveScreenshot("vision-raw-journey-roadmap-mobile-390.png", shotRoadmap.data);

    // 4. Close Journey Modal and return to World
    console.log("Closing Journey Modal and returning to World...");
    await send("Runtime.evaluate", {
      expression: `(() => {
        if (window.location.hash) history.replaceState(null, '', window.location.pathname + window.location.search);
        const closeBtn = document.querySelector('[data-close-game-modal]') || document.querySelector('.hc-game-modal-header button');
        if (closeBtn) closeBtn.click();
      })()`
    });
    await new Promise((r) => setTimeout(r, 1200));

    // 5. Open Check-in Dialog
    console.log("Opening Check-in Dialog via Bottom Dock...");
    await send("Runtime.evaluate", {
      expression: `(() => {
        const dock = document.querySelector('.hc-rpg-bottom-dock');
        const btns = Array.from(dock ? dock.querySelectorAll('.hc-rpg-dock-btn') : []);
        const homNayBtn = btns.find(b => b.innerText.includes('Hôm nay') || b.innerText.includes('Today'));
        if (homNayBtn) homNayBtn.click();
      })()`
    });
    await new Promise((r) => setTimeout(r, 1500));
    const shotCheckin = await send("Page.captureScreenshot", { format: "png" });
    saveScreenshot("vision-raw-checkin-dialog-mobile-390.png", shotCheckin.data);

    // Close Check-in
    await send("Runtime.evaluate", {
      expression: `(() => {
        const closeBtn = document.querySelector('.hc-checkin-dialog header button') || document.querySelector('[data-close-game-modal]') || document.querySelector('.hc-checkin-close-btn');
        if (closeBtn) closeBtn.click();
      })()`
    });
    await new Promise((r) => setTimeout(r, 1200));

    // 6. Open Reminder Modal
    console.log("Opening Reminder Modal via Bottom Dock...");
    await send("Runtime.evaluate", {
      expression: `(() => {
        const dock = document.querySelector('.hc-rpg-bottom-dock');
        const btns = Array.from(dock ? dock.querySelectorAll('.hc-rpg-dock-btn') : []);
        const nhacNhoBtn = btns.find(b => b.innerText.includes('Nhắc nhở') || b.innerText.includes('Reminder'));
        if (nhacNhoBtn) nhacNhoBtn.click();
      })()`
    });
    await new Promise((r) => setTimeout(r, 1200));
    const shotReminder = await send("Page.captureScreenshot", { format: "png" });
    saveScreenshot("vision-raw-reminder-dialog-mobile-390.png", shotReminder.data);

    // Close Reminder
    await send("Runtime.evaluate", {
      expression: `(() => {
        const closeBtn = document.querySelector('[data-close-game-modal]') || document.querySelector('.hc-reminder-save-btn') || document.querySelector('.hc-reminder-done-btn');
        if (closeBtn) closeBtn.click();
      })()`
    });
    await new Promise((r) => setTimeout(r, 1000));

    // 7. Open Care Plan (#hc-plan)
    console.log("Opening Care Plan Modal (#hc-plan)...");
    await send("Page.navigate", { url: `${base}/vi/wellness/healthclues/world?quest=sleep-better#hc-plan` });
    await new Promise((r) => setTimeout(r, 2000));
    const shotPlan = await send("Page.captureScreenshot", { format: "png" });
    saveScreenshot("vision-raw-plan-modal-mobile-390.png", shotPlan.data);

    // 8. Capture /vi/wellness/healthclues/dashboard
    console.log("Navigating to /vi/wellness/healthclues/dashboard...");
    await send("Page.navigate", { url: `${base}/vi/wellness/healthclues/dashboard` });
    await new Promise((r) => setTimeout(r, 2500));
    const shotDashboard = await send("Page.captureScreenshot", { format: "png" });
    saveScreenshot("vision-raw-dashboard-mobile-390.png", shotDashboard.data);

    console.log("=== ALL DASHBOARDS CAPTURED SUCCESSFULLY ===");
    ws.close();
  } finally {
    try { chromeProc.kill(); } catch {}
  }
}

main().catch((err) => {
  console.error("CAPTURE ERROR:", err);
  process.exit(1);
});
