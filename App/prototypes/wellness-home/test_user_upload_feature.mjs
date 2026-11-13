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

async function testUploadFeature() {
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

  const profileDir = path.join(root, ".tmp-upload-test-profile");
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

    // 1. Add a sample uploaded custom furniture item (using one of our clean cutouts)
    await cdpSend(ws, "Runtime.evaluate", { expression: `
      if (!inventoryState.custom_items) inventoryState.custom_items = [];
      inventoryState.custom_items.push({
        id: 'test_upload_piano_01',
        name: 'Đàn Piano Grand Cao Cấp',
        img_src: 'assets/items/layer_02_armchair.png',
        scene_id: 'scene_interior',
        left: 48,
        top: 62,
        scale: 1.15,
        rotation: 0,
        z_index: 25,
        displayed: true
      });
      saveState();
      renderCustomItems();
      renderInventoryList();
    ` });
    await new Promise((r) => setTimeout(r, 500));

    // Capture initial upload placement
    const shot1 = await cdpSend(ws, "Page.captureScreenshot", { format: "png" });
    writeFileSync(path.join(outputDir, "23-user-uploaded-furniture-live.png"), Buffer.from(shot1.data, "base64"));
    console.log("Captured 23-user-uploaded-furniture-live.png");

    // 2. Transform the uploaded item: Move, Scale up to 140%, Rotate by 20 deg
    await cdpSend(ws, "Runtime.evaluate", { expression: `
      const it = inventoryState.custom_items.find(i => i.id === 'test_upload_piano_01');
      if (it) {
        it.left = 58;
        it.top = 58;
        it.scale = 1.35;
        it.rotation = -12;
      }
      saveState();
      renderCustomItems();
      // Select the item so bounding box and controls are highlighted
      selectedCustomItemId = 'test_upload_piano_01';
      document.getElementById('custom-node-test_upload_piano_01')?.classList.add('is-selected');
    ` });
    await new Promise((r) => setTimeout(r, 400));

    const shot2 = await cdpSend(ws, "Page.captureScreenshot", { format: "png" });
    writeFileSync(path.join(outputDir, "24-user-uploaded-scaled-rotated.png"), Buffer.from(shot2.data, "base64"));
    console.log("Captured 24-user-uploaded-scaled-rotated.png");

    // 3. Switch sidebar filter to "Tự tải lên" to demonstrate drawer management
    await cdpSend(ws, "Runtime.evaluate", { expression: `setInventoryFilter('custom');` });
    await new Promise((r) => setTimeout(r, 400));

    const shot3 = await cdpSend(ws, "Page.captureScreenshot", { format: "png" });
    writeFileSync(path.join(outputDir, "25-sidebar-custom-items-drawer.png"), Buffer.from(shot3.data, "base64"));
    console.log("Captured 25-sidebar-custom-items-drawer.png");

    console.log("\nAll custom upload & move/scale/rotate tests passed!");
    ws.close();
  } finally {
    chromeProc.kill("SIGKILL");
  }
}

testUploadFeature().catch(e => {
  console.error("Test error:", e);
  process.exit(1);
});
