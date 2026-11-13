import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import net from "node:net";
import path from "node:path";

const root = "d:\\botly";
const artifactsDir = "C:\\Users\\Admin\\.gemini\\antigravity\\brain\\abff8161-8d04-4588-8fd8-ca4619ccaf85";
const workspaceScreenshotsDir = "D:\\botly\\App\\.tmp\\healthclues-tester\\screenshots";
const targetUrl = "http://127.0.0.1:3329/vi/wellness/healthclues/world?quest=health-concern";

mkdirSync(workspaceScreenshotsDir, { recursive: true });

function saveScreenshot(filename, base64Data) {
  const buf = Buffer.from(base64Data, "base64");
  try { writeFileSync(path.join(artifactsDir, filename), buf); } catch {}
  if (existsSync(workspaceScreenshotsDir)) {
    try { writeFileSync(path.join(workspaceScreenshotsDir, filename), buf); } catch {}
  }
}

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

  const profileDir = path.join(root, "App", ".tmp", "inspect-ui", `chrome-village-snap-${Date.now()}`);
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
        if (page) { targetWs = page.webSocketDebuggerUrl; break; }
      } catch {}
      await new Promise((r) => setTimeout(r, 200));
    }

    const WebSocket = (await import("ws")).default;
    const ws = new WebSocket(targetWs);
    await new Promise((resolve, reject) => { ws.on("open", resolve); ws.on("error", reject); });

    let msgId = 1;
    const pending = new Map();
    ws.on("message", (raw) => {
      const msg = JSON.parse(raw.toString("utf8"));
      if (msg.id && pending.has(msg.id)) {
        const { resolve, reject } = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message || JSON.stringify(msg.error)));
        else resolve(msg.result);
      }
    });

    const send = (method, params = {}) =>
      new Promise((resolve, reject) => {
        const id = msgId++;
        pending.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params }));
      });

    await send("Page.enable");
    await send("Runtime.enable");

    console.log("Loading play-demo.html for session...");
    await send("Page.navigate", { url: "http://127.0.0.1:3329/play-demo.html" });
    await new Promise((r) => setTimeout(r, 2000));

    console.log("Navigating to world page...");
    await send("Page.navigate", { url: targetUrl });
    await new Promise((r) => setTimeout(r, 2500));

    // Close modal
    console.log("Clicking [data-close-game-modal] to close journey drawer...");
    await send("Runtime.evaluate", {
      expression: `(() => {
        const btn = document.querySelector('[data-close-game-modal]');
        if (btn) btn.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 1200));

    // Wait 3 seconds for characters to roam
    await new Promise((r) => setTimeout(r, 3000));

    // Take Desktop World Screenshot
    console.log("Capturing Desktop World Screenshot...");
    const shotDesktop = await send("Page.captureScreenshot", { format: "png" });
    saveScreenshot("vision-check-living-village-world.png", shotDesktop.data);

    // Click on Anna to show speech bubble
    console.log("Clicking on Anna to trigger speech bubble...");
    await send("Runtime.evaluate", {
      expression: `(() => {
        const anna = document.querySelector('[data-visitor-id="anna"]');
        if (anna) anna.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 600));

    // Take Speech Bubble Screenshot
    console.log("Capturing Speech Bubble Screenshot...");
    const shotSpeech = await send("Page.captureScreenshot", { format: "png" });
    saveScreenshot("vision-check-living-village-speech.png", shotSpeech.data);

    // Switch to Mobile Viewport
    console.log("Capturing Mobile World Viewport (390x844)...");
    await send("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await new Promise((r) => setTimeout(r, 1500));

    const shotMobile = await send("Page.captureScreenshot", { format: "png" });
    saveScreenshot("vision-check-living-village-mobile-world.png", shotMobile.data);

    console.log("SUCCESSFULLY CAPTURED ALL LIVING VILLAGE VISION PROOFS!");
  } finally {
    try { chromeProc.kill(); } catch {}
  }
}

main().catch(console.error);
