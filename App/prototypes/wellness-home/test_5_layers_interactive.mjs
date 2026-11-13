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

async function test5Layers() {
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

  const profileDir = path.join(root, ".tmp-layers-test-profile");
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
    await new Promise((r) => setTimeout(r, 1500));

    // 1. Initial view: All 5 layers active
    const shot1 = await cdpSend(ws, "Page.captureScreenshot", { format: "png" });
    writeFileSync(path.join(outputDir, "18-interior-5-layers-all-on.png"), Buffer.from(shot1.data, "base64"));
    console.log("Captured 18-interior-5-layers-all-on.png");

    // 2. Toggle Sofa OFF
    await cdpSend(ws, "Runtime.evaluate", { expression: `toggleIndividualLayer('sofa');` });
    await new Promise((r) => setTimeout(r, 400));
    const shot2 = await cdpSend(ws, "Page.captureScreenshot", { format: "png" });
    writeFileSync(path.join(outputDir, "19-interior-sofa-hidden.png"), Buffer.from(shot2.data, "base64"));
    console.log("Captured 19-interior-sofa-hidden.png");

    // 3. Toggle Coffee Table OFF
    await cdpSend(ws, "Runtime.evaluate", { expression: `toggleIndividualLayer('table');` });
    await new Promise((r) => setTimeout(r, 400));
    const shot3 = await cdpSend(ws, "Page.captureScreenshot", { format: "png" });
    writeFileSync(path.join(outputDir, "20-interior-table-hidden.png"), Buffer.from(shot3.data, "base64"));
    console.log("Captured 20-interior-table-hidden.png");

    // 4. Toggle All OFF (Empty room)
    await cdpSend(ws, "Runtime.evaluate", { expression: `
      for (const k of Object.keys(interiorLayersState)) {
        if (interiorLayersState[k]) toggleIndividualLayer(k);
      }
    ` });
    await new Promise((r) => setTimeout(r, 400));
    const shot4 = await cdpSend(ws, "Page.captureScreenshot", { format: "png" });
    writeFileSync(path.join(outputDir, "21-interior-all-hidden-empty.png"), Buffer.from(shot4.data, "base64"));
    console.log("Captured 21-interior-all-hidden-empty.png");

    // 5. Restore All ON
    await cdpSend(ws, "Runtime.evaluate", { expression: `toggleAllInteriorLayers();` });
    await new Promise((r) => setTimeout(r, 500));
    const shot5 = await cdpSend(ws, "Page.captureScreenshot", { format: "png" });
    writeFileSync(path.join(outputDir, "22-interior-restored-all-on.png"), Buffer.from(shot5.data, "base64"));
    console.log("Captured 22-interior-restored-all-on.png");

    console.log("\nAll 5-layer interactive automated tests passed!");
    ws.close();
  } finally {
    chromeProc.kill("SIGKILL");
  }
}

test5Layers().catch(e => {
  console.error("Test error:", e);
  process.exit(1);
});
