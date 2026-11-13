import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import net from "node:net";
import path from "node:path";

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

  const profileDir = path.join("D:\\botly\\App\\.tmp\\vision-audit", `chrome-profile-${Date.now()}`);
  mkdirSync(profileDir, { recursive: true });

  const chromeProc = spawn(chromePath, [
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${profileDir}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--headless=new",
    "--disable-gpu",
    "--window-size=390,844",
    "http://127.0.0.1:8081",
  ]);

  try {
    let wsUrl = null;
    for (let i = 0; i < 30; i++) {
      try {
        const res = await fetch(`http://127.0.0.1:${debugPort}/json/list`);
        const json = await res.json();
        const page = json.find((item) => item.type === "page" && item.webSocketDebuggerUrl);
        if (page) {
          wsUrl = page.webSocketDebuggerUrl;
          break;
        }
      } catch {}
      await new Promise((r) => setTimeout(r, 200));
    }
    assert.ok(wsUrl, "Could not get Chrome WebSocket debugger URL");

    const ws = new WebSocket(wsUrl);
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    let id = 1;
    const send = (method, params = {}) =>
      new Promise((resolve, reject) => {
        const curId = id++;
        const handler = (event) => {
          const msg = JSON.parse(event.data);
          if (msg.id === curId) {
            ws.removeEventListener("message", handler);
            if (msg.error) reject(new Error(msg.error.message));
            else resolve(msg.result);
          }
        };
        ws.addEventListener("message", handler);
        ws.send(JSON.stringify({ id: curId, method, params }));
      });

    await send("Page.enable");
    await send("Runtime.enable");
    await send("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
      hasTouch: true,
    });

    // Wait for initial page to load
    await new Promise((r) => setTimeout(r, 1500));

    // Pre-populate completed onboarding & guest user session
    await send("Runtime.evaluate", {
      expression: `
        localStorage.setItem("healthclues-onboarding-completed", "true");
        localStorage.setItem("healthclues-chosen-quest", "gout-prevention");
        localStorage.setItem("healthclues-mobile-session", JSON.stringify({
          access_token: "mock_jwt_token",
          refresh_token: "mock_refresh_token",
          expires_at: Math.floor(Date.now() / 1000) + 86400,
          user: {
            id: "hero-user-01",
            email: "hero@healthclues.app",
            created_at: new Date().toISOString()
          }
        }));
      `,
    });

    // Navigate to profile screen
    await send("Page.navigate", { url: "http://127.0.0.1:8081/profile" });
    await new Promise((r) => setTimeout(r, 3000));

    const shot = await send("Page.captureScreenshot", { format: "png" });
    writeFileSync(path.join(artifactsDir, "audit-vision-12-profile-screen.png"), Buffer.from(shot.data, "base64"));
    console.log("Captured real audit-vision-12-profile-screen.png successfully!");

    ws.close();
  } finally {
    try {
      chromeProc.kill("SIGKILL");
    } catch {}
  }
}

main().catch(console.error);
