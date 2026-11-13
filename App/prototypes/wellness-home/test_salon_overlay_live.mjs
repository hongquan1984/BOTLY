import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import net from "node:net";
import path from "node:path";

const root = "D:\\botly\\App\\prototypes\\wellness-home";
const outputDir = path.join(root, "evidence");
mkdirSync(outputDir, { recursive: true });

async function cdpSend(ws, method, params = {}) {
  const id = Math.floor(Math.random() * 1000000);
  return new Promise((resolve, reject) => {
    const handler = (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.id === id) {
        ws.off("message", handler);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
      }
    };
    ws.on("message", handler);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function testSalonOverlay() {
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

  const profileDir = path.join(root, ".tmp-salon-test-profile");
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
        const list = await res.json();
        const page = list.find((item) => item.type === "page");
        if (page?.webSocketDebuggerUrl) {
          targetWs = page.webSocketDebuggerUrl;
          break;
        }
      } catch (_) {}
      await new Promise((r) => setTimeout(r, 100));
    }
    assert.ok(targetWs, "Failed to connect to Chrome debugging WebSocket.");

    const { default: WebSocket } = await import("ws");
    const ws = new WebSocket(targetWs);
    await new Promise((resolve) => ws.once("open", resolve));

    await cdpSend(ws, "Page.enable");
    await cdpSend(ws, "Runtime.enable");
    await cdpSend(ws, "DOM.enable");

    await cdpSend(ws, "Page.navigate", { url: "http://localhost:3450" });
    await new Promise((r) => setTimeout(r, 1200));

    // 1. Switch to interior with salon overlay active
    await cdpSend(ws, "Runtime.evaluate", {
      expression: `switchScene('scene_interior');`
    });
    await new Promise((r) => setTimeout(r, 600));

    const shot1 = await cdpSend(ws, "Page.captureScreenshot", { format: "png" });
    writeFileSync(path.join(outputDir, "15-interior-live-with-salon-overlay.png"), Buffer.from(shot1.data, "base64"));
    console.log("Captured 15-interior-live-with-salon-overlay.png");

    // 2. Open split compare slider in interior
    await cdpSend(ws, "Runtime.evaluate", {
      expression: `if (!isCompareMode) toggleCompareMode();`
    });
    await new Promise((r) => setTimeout(r, 600));

    const shot2 = await cdpSend(ws, "Page.captureScreenshot", { format: "png" });
    writeFileSync(path.join(outputDir, "16-interior-live-compare-salon.png"), Buffer.from(shot2.data, "base64"));
    console.log("Captured 16-interior-live-compare-salon.png");

    // Close compare mode
    await cdpSend(ws, "Runtime.evaluate", {
      expression: `if (isCompareMode) toggleCompareMode();`
    });

    console.log("\nAll live salon overlay captures complete!");
    ws.close();
  } finally {
    chromeProc.kill("SIGKILL");
  }
}

testSalonOverlay().catch(e => {
  console.error("Test error:", e);
  process.exit(1);
});
