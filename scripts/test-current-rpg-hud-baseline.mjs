import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import net from "node:net";
import path from "node:path";

const root = "d:\\botly";
const artifactsDir = "C:\\Users\\Admin\\.gemini\\antigravity\\brain\\abff8161-8d04-4588-8fd8-ca4619ccaf85";
const base = "http://127.0.0.1:3329";

mkdirSync(artifactsDir, { recursive: true });

function saveScreenshot(filename, base64Data) {
  const buf = Buffer.from(base64Data, "base64");
  const fullPath = path.join(artifactsDir, filename);
  writeFileSync(fullPath, buf);
  console.log(`Saved screenshot: ${fullPath} (${buf.length} bytes)`);
}

async function run() {
  console.log("=== INSPECTING CURRENT RPG HUD & LUMI DIALOGUE BASELINE ===");

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

  const profileDir = path.join(root, "App", ".tmp", "inspect-ui", `chrome-baseline-${Date.now()}`);
  mkdirSync(profileDir, { recursive: true });

  const chromeProc = spawn(chromePath, [
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${profileDir}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--headless=new",
    "--disable-gpu",
    "--disable-extensions",
    "--window-size=1280,800",
    "about:blank",
  ]);

  try {
    let targetWs = null;
    for (let i = 0; i < 40; i++) {
      try {
        const res = await fetch(`http://127.0.0.1:${debugPort}/json/list`);
        const json = await res.json();
        const page = json.find((item) => item.type === "page" && !item.url.startsWith("chrome-extension://") && item.webSocketDebuggerUrl);
        if (page) {
          targetWs = page.webSocketDebuggerUrl;
          break;
        }
      } catch {}
      await new Promise((r) => setTimeout(r, 200));
    }
    assert.ok(targetWs, "Could not connect to Chrome DevTools.");

    const ws = new WebSocket(targetWs);
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    let msgId = 1;
    const send = (method, params = {}) =>
      new Promise((resolve, reject) => {
        const id = msgId++;
        const handler = (event) => {
          const data = JSON.parse(event.data);
          if (data.id === id) {
            ws.removeEventListener("message", handler);
            if (data.error) reject(new Error(data.error.message || JSON.stringify(data.error)));
            else resolve(data.result);
          }
        };
        ws.addEventListener("message", handler);
        ws.send(JSON.stringify({ id, method, params }));
      });

    await send("Page.enable");
    await send("Runtime.enable");

    console.log("Navigating to play-demo.html...");
    await send("Page.navigate", { url: `${base}/play-demo.html` });
    await new Promise((r) => setTimeout(r, 3000));

    // Wait for world map or dock
    for (let i = 0; i < 30; i++) {
      const check = await send("Runtime.evaluate", {
        expression: `(() => {
          return {
            hasMap: Boolean(document.querySelector('[data-region-map]') || document.querySelector('[data-rpg-world]')),
            hasDock: Boolean(document.querySelector('.hc-rpg-bottom-dock')),
            hasLumi: Boolean(document.querySelector('.hc-rpg-lumi-dialogue')),
            url: window.location.href
          };
        })()`,
        returnByValue: true,
      });
      console.log(`[Check ${i}]`, check.result?.value);
      if (check.result?.value?.hasDock) break;
      await new Promise((r) => setTimeout(r, 500));
    }

    // Dismiss tour or modal if any
    await send("Runtime.evaluate", {
      expression: `(() => {
        const skipTourBtn = document.querySelector('.hc-world-tour button.hc-tour-link') ||
                            Array.from(document.querySelectorAll('.hc-world-tour button')).find(b =>
                              b.innerText?.includes('Bỏ qua') || b.innerText?.includes('Skip')
                            );
        if (skipTourBtn) skipTourBtn.click();
        const closeBtn = document.querySelector('[data-close-game-modal]');
        if (closeBtn) closeBtn.click();
      })()`
    });
    await new Promise((r) => setTimeout(r, 600));

    // Test viewports: Desktop 1280, Tablet 768, Mobile 390
    const viewports = [
      { name: "desktop_1280", width: 1280, height: 800, mobile: false, dsf: 1 },
      { name: "tablet_768", width: 768, height: 1024, mobile: true, dsf: 2 },
      { name: "mobile_390", width: 390, height: 844, mobile: true, dsf: 2 },
      { name: "mobile_375", width: 375, height: 667, mobile: true, dsf: 2 },
    ];

    for (const vp of viewports) {
      console.log(`\n--- Inspecting Viewport: ${vp.name} (${vp.width}x${vp.height}) ---`);
      await send("Emulation.setDeviceMetricsOverride", {
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: vp.dsf,
        mobile: vp.mobile,
      });
      await new Promise((r) => setTimeout(r, 600));

      const info = await send("Runtime.evaluate", {
        expression: `(() => {
          const lumi = document.querySelector('.hc-rpg-lumi-dialogue');
          const dock = document.querySelector('.hc-rpg-bottom-dock');
          const nextReward = document.querySelector('.hc-rpg-next-reward');
          const day7Box = document.querySelector('.hc-rpg-day7-box');
          const lumiRect = lumi ? lumi.getBoundingClientRect() : null;
          const dockRect = dock ? dock.getBoundingClientRect() : null;

          return {
            hasLumi: Boolean(lumi),
            lumiRect: lumiRect ? {
              top: lumiRect.top,
              bottom: lumiRect.bottom,
              left: lumiRect.left,
              right: lumiRect.right,
              height: lumiRect.height
            } : null,
            hasDock: Boolean(dock),
            dockRect: dockRect ? {
              top: dockRect.top,
              bottom: dockRect.bottom,
              left: dockRect.left,
              right: dockRect.right,
              height: dockRect.height
            } : null,
            overlap: (lumiRect && dockRect) ? (lumiRect.bottom > dockRect.top) : null,
            clearance: (lumiRect && dockRect) ? (dockRect.top - lumiRect.bottom) : null,
            nextRewardText: nextReward?.innerText?.trim(),
            day7Text: day7Box?.innerText?.trim(),
          };
        })()`,
        returnByValue: true,
      });

      console.log(`Viewport ${vp.name} result:`, JSON.stringify(info.result?.value, null, 2));

      const ss = await send("Page.captureScreenshot", { format: "png" });
      saveScreenshot(`baseline-${vp.name}.png`, ss.data);
    }

  } finally {
    try { chromeProc.kill(); } catch {}
  }
}

run().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});
