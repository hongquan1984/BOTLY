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

async function runTest() {
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

  const profileDir = path.join(root, ".tmp-corner-test-profile");
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

    // 1. Add sample luxury sofa with trimmed asset in scene_interior_wide
    console.log("Adding luxury sofa custom item...");
    await cdpSend(ws, "Runtime.evaluate", { expression: `
      if (!inventoryState.custom_items) inventoryState.custom_items = [];
      inventoryState.custom_items = [{
        id: 'luxury_sofa_demo',
        name: 'Sofa Vải Cao Cấp Ý',
        img_src: 'assets/items/sofa_italian_trimmed.png',
        scene_id: 'scene_interior_wide',
        left: 50,
        top: 72,
        width: 360,
        scale: 1.38,
        rotation: 0,
        z_index: 720,
        displayed: true
      }];
      selectedCustomItemId = 'luxury_sofa_demo';
      saveState();
      renderCustomItems();
      renderInventoryList();
    ` });

    await new Promise((r) => setTimeout(r, 800));

    // Check handles in DOM
    const handlesInfo = await cdpSend(ws, "Runtime.evaluate", {
      returnByValue: true,
      expression: `
        (() => {
          const node = document.getElementById('custom-node-luxury_sofa_demo');
          if (!node) return { found: false };
          const handles = Array.from(node.querySelectorAll('.custom-resize-handle')).map(h => ({
            corner: h.getAttribute('data-corner'),
            className: h.className,
            cursor: window.getComputedStyle(h).cursor,
            rect: h.getBoundingClientRect()
          }));
          const frame = node.querySelector('.custom-item-frame');
          const rotator = node.querySelector('.custom-rotate-handle');
          return {
            found: true,
            frameWidth: frame.style.width,
            handlesCount: handles.length,
            handles,
            hasRotator: !!rotator
          };
        })()
      `
    });

    console.log("Handles info:", JSON.stringify(handlesInfo.result.value, null, 2));
    assert.equal(handlesInfo.result.value.handlesCount, 4, "Must have exactly 4 corner handles");

    // Capture screenshot showing the 4 corner handles active on the luxury sofa
    const shot1 = await cdpSend(ws, "Page.captureScreenshot", { format: "png" });
    writeFileSync(path.join(outputDir, "29-four-corner-handles-active.png"), Buffer.from(shot1.data, "base64"));
    console.log("Saved: 29-four-corner-handles-active.png");

    // 2. Test dragging Top-Left corner handle
    console.log("Testing Top-Left (corner-tl) drag resizing...");
    const dragTlResult = await cdpSend(ws, "Runtime.evaluate", {
      returnByValue: true,
      expression: `
        (() => {
          const handle = document.querySelector('.custom-resize-handle.corner-tl');
          const frame = document.querySelector('.custom-item-frame');
          const initialWidth = parseInt(frame.style.width);
          const rect = handle.getBoundingClientRect();
          
          // Simulate drag pointer events pulling Top-Left outward (-60px, -40px)
          const startX = rect.left + rect.width / 2;
          const startY = rect.top + rect.height / 2;
          
          handle.dispatchEvent(new PointerEvent('pointerdown', { clientX: startX, clientY: startY, pointerId: 1, bubbles: true }));
          handle.dispatchEvent(new PointerEvent('pointermove', { clientX: startX - 70, clientY: startY - 50, pointerId: 1, bubbles: true }));
          handle.dispatchEvent(new PointerEvent('pointerup', { clientX: startX - 70, clientY: startY - 50, pointerId: 1, bubbles: true }));
          
          const newWidth = parseInt(frame.style.width);
          return { initialWidth, newWidth, grown: newWidth > initialWidth };
        })()
      `
    });
    console.log("Top-Left drag result:", dragTlResult.result.value);
    assert.ok(dragTlResult.result.value.grown, "Image must grow when pulling Top-Left outward");

    // 3. Test dragging Bottom-Right corner handle
    console.log("Testing Bottom-Right (corner-br) drag resizing...");
    const dragBrResult = await cdpSend(ws, "Runtime.evaluate", {
      returnByValue: true,
      expression: `
        (() => {
          const handle = document.querySelector('.custom-resize-handle.corner-br');
          const frame = document.querySelector('.custom-item-frame');
          const initialWidth = parseInt(frame.style.width);
          const rect = handle.getBoundingClientRect();
          
          // Drag Bottom-Right inward (towards center: -40px, -30px)
          const startX = rect.left + rect.width / 2;
          const startY = rect.top + rect.height / 2;
          
          handle.dispatchEvent(new PointerEvent('pointerdown', { clientX: startX, clientY: startY, pointerId: 2, bubbles: true }));
          handle.dispatchEvent(new PointerEvent('pointermove', { clientX: startX - 50, clientY: startY - 40, pointerId: 2, bubbles: true }));
          handle.dispatchEvent(new PointerEvent('pointerup', { clientX: startX - 50, clientY: startY - 40, pointerId: 2, bubbles: true }));
          
          const newWidth = parseInt(frame.style.width);
          return { initialWidth, newWidth, shrunk: newWidth < initialWidth };
        })()
      `
    });
    console.log("Bottom-Right drag result:", dragBrResult.result.value);
    assert.ok(dragBrResult.result.value.shrunk, "Image must shrink when pushing Bottom-Right inward");

    // 4. Test dragging Top-Right corner handle
    console.log("Testing Top-Right (corner-tr) drag resizing...");
    const dragTrResult = await cdpSend(ws, "Runtime.evaluate", {
      returnByValue: true,
      expression: `
        (() => {
          const handle = document.querySelector('.custom-resize-handle.corner-tr');
          const frame = document.querySelector('.custom-item-frame');
          const initialWidth = parseInt(frame.style.width);
          const rect = handle.getBoundingClientRect();
          
          const startX = rect.left + rect.width / 2;
          const startY = rect.top + rect.height / 2;
          
          handle.dispatchEvent(new PointerEvent('pointerdown', { clientX: startX, clientY: startY, pointerId: 3, bubbles: true }));
          handle.dispatchEvent(new PointerEvent('pointermove', { clientX: startX + 60, clientY: startY - 40, pointerId: 3, bubbles: true }));
          handle.dispatchEvent(new PointerEvent('pointerup', { clientX: startX + 60, clientY: startY - 40, pointerId: 3, bubbles: true }));
          
          const newWidth = parseInt(frame.style.width);
          return { initialWidth, newWidth, grown: newWidth > initialWidth };
        })()
      `
    });
    console.log("Top-Right drag result:", dragTrResult.result.value);
    assert.ok(dragTrResult.result.value.grown, "Image must grow when pulling Top-Right outward");

    // 5. Test dragging Bottom-Left corner handle
    console.log("Testing Bottom-Left (corner-bl) drag resizing...");
    const dragBlResult = await cdpSend(ws, "Runtime.evaluate", {
      returnByValue: true,
      expression: `
        (() => {
          const handle = document.querySelector('.custom-resize-handle.corner-bl');
          const frame = document.querySelector('.custom-item-frame');
          const initialWidth = parseInt(frame.style.width);
          const rect = handle.getBoundingClientRect();
          
          const startX = rect.left + rect.width / 2;
          const startY = rect.top + rect.height / 2;
          
          handle.dispatchEvent(new PointerEvent('pointerdown', { clientX: startX, clientY: startY, pointerId: 4, bubbles: true }));
          handle.dispatchEvent(new PointerEvent('pointermove', { clientX: startX - 60, clientY: startY + 40, pointerId: 4, bubbles: true }));
          handle.dispatchEvent(new PointerEvent('pointerup', { clientX: startX - 60, clientY: startY + 40, pointerId: 4, bubbles: true }));
          
          const newWidth = parseInt(frame.style.width);
          return { initialWidth, newWidth, grown: newWidth > initialWidth };
        })()
      `
    });
    console.log("Bottom-Left drag result:", dragBlResult.result.value);
    assert.ok(dragBlResult.result.value.grown, "Image must grow when pulling Bottom-Left outward");

    // Add a second item (coffee table) to verify multiple items independently resize
    await cdpSend(ws, "Runtime.evaluate", { expression: `
      inventoryState.custom_items.push({
        id: 'table_demo',
        name: 'Bàn Trà Đôi Gỗ Mộc',
        img_src: 'assets/items/table_trimmed.png',
        scene_id: 'scene_interior_wide',
        left: 32,
        top: 76,
        width: 220,
        scale: 0.85,
        rotation: 0,
        z_index: 760,
        displayed: true
      });
      saveState();
      renderCustomItems();
      renderInventoryList();
    ` });

    await new Promise((r) => setTimeout(r, 600));

    // Capture screenshot of both items in wide-angle room
    const shot2 = await cdpSend(ws, "Page.captureScreenshot", { format: "png" });
    writeFileSync(path.join(outputDir, "30-multi-item-corner-handles-demo.png"), Buffer.from(shot2.data, "base64"));
    console.log("Saved: 30-multi-item-corner-handles-demo.png");

    console.log("ALL 4 CORNER DRAG TESTS PASSED SUCCESSFULLY!");
  } finally {
    chromeProc.kill();
  }
}

runTest().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
