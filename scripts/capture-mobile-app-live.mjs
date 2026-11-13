import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import net from "node:net";
import path from "node:path";

const root = "d:\\botly";
const artifactsDir = "C:\\Users\\Admin\\.gemini\\antigravity\\brain\\657e9da8-7551-4202-bc28-ecfcfda170bb";

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

  const profileDir = path.join(root, "App", ".tmp", "inspect-ui", `chrome-mobile-${Date.now()}`);
  mkdirSync(profileDir, { recursive: true });

  const chromeProc = spawn(chromePath, [
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${profileDir}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--headless=new",
    "--disable-gpu",
    "--window-size=430,932",
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
    assert.ok(targetWs, "Could not find Chrome page WebSocket target.");

    const ws = new WebSocket(targetWs);
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    let messageId = 0;
    const pending = new Map();
    ws.onmessage = (event) => {
      const payload = JSON.parse(event.data);
      if (payload.id && pending.has(payload.id)) {
        const { resolve, reject } = pending.get(payload.id);
        pending.delete(payload.id);
        if (payload.error) reject(new Error(payload.error.message));
        else resolve(payload.result);
      }
    };

    function send(method, params = {}) {
      return new Promise((resolve, reject) => {
        const id = ++messageId;
        pending.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    await send("Page.enable");
    await send("DOM.enable");
    await send("Network.enable");

    // Emulate iPhone 14 Pro Dimensions
    await send("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
      hasTouch: true,
    });

    const routes = [
      { name: "mobile-login", path: "/(auth)/login" },
      { name: "mobile-register", path: "/(auth)/register" },
      { name: "mobile-world", path: "/(game)/world" },
      { name: "mobile-journey", path: "/(game)/journey" },
      { name: "mobile-daily-care", path: "/(game)/daily-care" },
      { name: "mobile-inventory", path: "/(game)/inventory" },
      { name: "mobile-profile", path: "/(game)/profile" },
    ];

    const baseUrl = "http://127.0.0.1:8081";

    for (const route of routes) {
      console.log(`Navigating to ${route.name} (${route.path})...`);
      await send("Page.navigate", { url: `${baseUrl}${route.path}` });
      await new Promise((r) => setTimeout(r, 3000));

      const screenshot = await send("Page.captureScreenshot", {
        format: "png",
        captureBeyondViewport: false,
      });

      const outPath = path.join(artifactsDir, `${route.name}.png`);
      writeFileSync(outPath, Buffer.from(screenshot.data, "base64"));
      console.log(`[+] Captured: ${outPath}`);
    }

    console.log("=== ALL MOBILE SCREENSHOTS CAPTURED SUCCESSFULLY ===");
    ws.close();
  } finally {
    chromeProc.kill();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
