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

  const profileDir = path.join(root, ".tmp-independent-corner-profile");
  mkdirSync(profileDir, { recursive: true });

  // Ensure prototype server is running on 3450
  let serverProc = null;
  try {
    await fetch("http://127.0.0.1:3450/api/manifest");
  } catch (_) {
    console.log("Starting server.mjs locally for test...");
    serverProc = spawn("node", [path.join(root, "server.mjs")], { stdio: "inherit" });
    await new Promise((r) => setTimeout(r, 1200));
  }

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

    // 1. Add sample painting to room
    console.log("Step 1: Adding painting on the chalet wall...");
    await cdpSend(ws, "Runtime.evaluate", {
      expression: `
        addSamplePainting();
      `
    });
    await new Promise((r) => setTimeout(r, 600));

    // Capture initial painting view
    const shot1 = await cdpSend(ws, "Page.captureScreenshot", { format: "png" });
    writeFileSync(path.join(outputDir, "31-independent-corners-initial-painting.png"), Buffer.from(shot1.data, "base64"));
    console.log("Saved: 31-independent-corners-initial-painting.png");

    // 2. Test independent Top-Left drag: only TL moves, TR, BR, BL remain fixed!
    console.log("Step 2: Testing Independent Top-Left corner drag...");
    const tlDragResult = await cdpSend(ws, "Runtime.evaluate", {
      returnByValue: true,
      expression: `
        (() => {
          const item = inventoryState.custom_items.find(it => it.id === 'painting-alps-01');
          const beforeCorners = JSON.parse(JSON.stringify(item.corners));
          
          const handleTL = document.getElementById('perspective-handle-painting-alps-01-tl');
          const stage = document.getElementById('scene-stage');
          const stageRect = stage.getBoundingClientRect();
          
          const startX = parseFloat(handleTL.style.left) + stageRect.left;
          const startY = parseFloat(handleTL.style.top) + stageRect.top;
          
          // Drag TL upward and leftward by 40px, 30px
          handleTL.dispatchEvent(new PointerEvent('pointerdown', { clientX: startX, clientY: startY, pointerId: 1, bubbles: true }));
          handleTL.dispatchEvent(new PointerEvent('pointermove', { clientX: startX - 40, clientY: startY - 30, pointerId: 1, bubbles: true }));
          handleTL.dispatchEvent(new PointerEvent('pointerup', { clientX: startX - 40, clientY: startY - 30, pointerId: 1, bubbles: true }));
          
          const afterCorners = JSON.parse(JSON.stringify(item.corners));
          const img = document.getElementById('perspective-img-painting-alps-01');
          
          return {
            beforeCorners,
            afterCorners,
            tlMoved: afterCorners.tl[0] !== beforeCorners.tl[0] || afterCorners.tl[1] !== beforeCorners.tl[1],
            trFixed: afterCorners.tr[0] === beforeCorners.tr[0] && afterCorners.tr[1] === beforeCorners.tr[1],
            brFixed: afterCorners.br[0] === beforeCorners.br[0] && afterCorners.br[1] === beforeCorners.br[1],
            blFixed: afterCorners.bl[0] === beforeCorners.bl[0] && afterCorners.bl[1] === beforeCorners.bl[1],
            matrix3d: img.style.transform
          };
        })()
      `
    });

    console.log("Top-Left Drag Result:", JSON.stringify(tlDragResult.result.value, null, 2));
    assert.ok(tlDragResult.result.value.tlMoved, "TL must have moved");
    assert.ok(tlDragResult.result.value.trFixed, "TR must remain exactly fixed");
    assert.ok(tlDragResult.result.value.brFixed, "BR must remain exactly fixed");
    assert.ok(tlDragResult.result.value.blFixed, "BL must remain exactly fixed");

    const shot2 = await cdpSend(ws, "Page.captureScreenshot", { format: "png" });
    writeFileSync(path.join(outputDir, "32-independent-tl-corner-warped.png"), Buffer.from(shot2.data, "base64"));
    console.log("Saved: 32-independent-tl-corner-warped.png");

    // 3. Test independent Bottom-Right drag: only BR moves, TL, TR, BL remain fixed!
    console.log("Step 3: Testing Independent Bottom-Right corner drag...");
    const brDragResult = await cdpSend(ws, "Runtime.evaluate", {
      returnByValue: true,
      expression: `
        (() => {
          const item = inventoryState.custom_items.find(it => it.id === 'painting-alps-01');
          const beforeCorners = JSON.parse(JSON.stringify(item.corners));
          
          const handleBR = document.getElementById('perspective-handle-painting-alps-01-br');
          const stage = document.getElementById('scene-stage');
          const stageRect = stage.getBoundingClientRect();
          
          const startX = parseFloat(handleBR.style.left) + stageRect.left;
          const startY = parseFloat(handleBR.style.top) + stageRect.top;
          
          // Drag BR downward and outward by 50px, 35px to create a strong perspective trapezoid
          handleBR.dispatchEvent(new PointerEvent('pointerdown', { clientX: startX, clientY: startY, pointerId: 2, bubbles: true }));
          handleBR.dispatchEvent(new PointerEvent('pointermove', { clientX: startX + 50, clientY: startY + 35, pointerId: 2, bubbles: true }));
          handleBR.dispatchEvent(new PointerEvent('pointerup', { clientX: startX + 50, clientY: startY + 35, pointerId: 2, bubbles: true }));
          
          const afterCorners = JSON.parse(JSON.stringify(item.corners));
          const img = document.getElementById('perspective-img-painting-alps-01');
          
          return {
            beforeCorners,
            afterCorners,
            brMoved: afterCorners.br[0] !== beforeCorners.br[0] || afterCorners.br[1] !== beforeCorners.br[1],
            tlFixed: afterCorners.tl[0] === beforeCorners.tl[0] && afterCorners.tl[1] === beforeCorners.tl[1],
            trFixed: afterCorners.tr[0] === beforeCorners.tr[0] && afterCorners.tr[1] === beforeCorners.tr[1],
            blFixed: afterCorners.bl[0] === beforeCorners.bl[0] && afterCorners.bl[1] === beforeCorners.bl[1],
            matrix3d: img.style.transform
          };
        })()
      `
    });

    console.log("Bottom-Right Drag Result:", JSON.stringify(brDragResult.result.value, null, 2));
    assert.ok(brDragResult.result.value.brMoved, "BR must have moved");
    assert.ok(brDragResult.result.value.tlFixed, "TL must remain exactly fixed");
    assert.ok(brDragResult.result.value.trFixed, "TR must remain exactly fixed");
    assert.ok(brDragResult.result.value.blFixed, "BL must remain exactly fixed");

    const shot3 = await cdpSend(ws, "Page.captureScreenshot", { format: "png" });
    writeFileSync(path.join(outputDir, "33-independent-br-corner-trapezoid-warp.png"), Buffer.from(shot3.data, "base64"));
    console.log("Saved: 33-independent-br-corner-trapezoid-warp.png");

    // 4. Test Save & Reload persistence
    console.log("Step 4: Testing Save Position & Page Reload Persistence...");
    await cdpSend(ws, "Runtime.evaluate", {
      expression: `
        saveSelectedPerspective();
      `
    });

    // Reload the page
    await cdpSend(ws, "Page.reload");
    await new Promise((r) => setTimeout(r, 1200));

    const reloadedInfo = await cdpSend(ws, "Runtime.evaluate", {
      returnByValue: true,
      expression: `
        (() => {
          const item = (inventoryState.custom_items || []).find(it => it.id === 'painting-alps-01');
          const img = document.getElementById('perspective-img-painting-alps-01');
          return {
            found: !!item,
            corners: item?.corners,
            hasMatrix3d: !!img?.style?.transform?.includes('matrix3d'),
            transform: img?.style?.transform
          };
        })()
      `
    });

    console.log("Reloaded State Persistence:", JSON.stringify(reloadedInfo.result.value, null, 2));
    assert.ok(reloadedInfo.result.value.found, "Item must exist after reload");
    assert.ok(reloadedInfo.result.value.hasMatrix3d, "Matrix3D transform must be active after reload");

    // 5. Test Player Mode Toggle
    console.log("Step 5: Testing Player Mode...");
    await cdpSend(ws, "Runtime.evaluate", {
      expression: `
        toggleEditorMode();
      `
    });
    await new Promise((r) => setTimeout(r, 400));

    const playerModeCheck = await cdpSend(ws, "Runtime.evaluate", {
      returnByValue: true,
      expression: `
        (() => {
          const bodyHasClass = document.body.classList.contains('mode-player');
          const toolbar = document.getElementById('perspective-toolbar');
          const toolbarVisible = toolbar && window.getComputedStyle(toolbar).display !== 'none';
          const handlesContainer = document.getElementById('perspective-handles-stage');
          const handlesVisible = handlesContainer && window.getComputedStyle(handlesContainer).display !== 'none';
          return {
            bodyHasClass,
            toolbarHidden: !toolbarVisible,
            handlesHidden: !handlesVisible
          };
        })()
      `
    });

    console.log("Player Mode Check:", JSON.stringify(playerModeCheck.result.value, null, 2));
    assert.ok(playerModeCheck.result.value.toolbarHidden, "Toolbar must be hidden in Player Mode");

    const shot4 = await cdpSend(ws, "Page.captureScreenshot", { format: "png" });
    writeFileSync(path.join(outputDir, "34-player-mode-clean-view.png"), Buffer.from(shot4.data, "base64"));
    console.log("Saved: 34-player-mode-clean-view.png");

    console.log("ALL PERSPECTIVE TRANSFORM HOMOGRAPHY TESTS PASSED 100%!");
  } finally {
    chromeProc.kill();
  }
}

runTest().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
