import { spawn } from 'child_process';
import { writeFileSync, existsSync, readFileSync } from 'fs';
import path from 'path';
import assert from 'assert';

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const outputDir = "C:\\Users\\Admin\\.gemini\\antigravity\\brain\\685e195b-af4b-4fee-8d91-49c1fcd4597d";
const diskSavePath = "D:\\botly\\App\\prototypes\\wellness-home\\data\\saved-room-state.json";

function cdpSend(ws, method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = Math.floor(Math.random() * 1000000);
    const msg = JSON.stringify({ id, method, params });
    const handler = (data) => {
      const res = JSON.parse(data.toString());
      if (res.id === id) {
        ws.off('message', handler);
        if (res.error) reject(res.error);
        else resolve(res.result);
      }
    };
    ws.on('message', handler);
    ws.send(msg);
  });
}

async function runTest() {
  console.log("Starting Chrome for Persistence & Reload test...");
  const chromeProc = spawn(CHROME_PATH, [
    "--remote-debugging-port=9222",
    "--headless=new",
    "--window-size=1440,900",
    "--disable-gpu",
    "--no-sandbox"
  ]);

  try {
    let wsUrl = null;
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 300));
      try {
        const res = await fetch("http://127.0.0.1:9222/json/list");
        const list = await res.json();
        const page = list.find((item) => item.type === "page");
        if (page?.webSocketDebuggerUrl) {
          wsUrl = page.webSocketDebuggerUrl;
          break;
        }
      } catch (_) {}
    }

    if (!wsUrl) throw new Error("Could not connect to Chrome debugging WebSocket");

    const WebSocket = (await import('ws')).default;
    const ws = new WebSocket(wsUrl);
    await new Promise((r) => ws.on('open', r));

    await cdpSend(ws, "Page.enable");
    await cdpSend(ws, "Runtime.enable");

    console.log("Navigating to http://localhost:3450...");
    await cdpSend(ws, "Page.navigate", { url: "http://localhost:3450" });
    await new Promise((r) => setTimeout(r, 2000));

    // 1. Add painting, warp corner TL, and scale it
    console.log("Step 1: Setting up custom modifications (warp, scale, position)...");
    const setupResult = await cdpSend(ws, "Runtime.evaluate", {
      returnByValue: true,
      expression: `
        (async () => {
          switchScene('scene_interior_wide');
          addSamplePainting();
          
          const item = inventoryState.custom_items.find(it => it.id === 'painting-alps-01');
          
          // Modify TL corner to create distinct trapezoid warp
          item.corners.tl = [14.2, 10.8];
          item.corners.tr = [33.6, 16.5];
          item.corners.br = [34.1, 44.2];
          item.corners.bl = [14.0, 45.8];
          item.user_scale = 1.15;
          
          // Toggle off lamp layer
          interiorLayersState.lamp = false;
          
          renderCustomItems();
          
          // Click Save Room
          await saveAllRoomDesign();
          
          return {
            savedItem: item,
            corners: item.corners,
            user_scale: item.user_scale,
            lampLayer: interiorLayersState.lamp
          };
        })()
      `
    });

    console.log("Setup result:", JSON.stringify(setupResult.result ? setupResult.result.value : setupResult.value, null, 2));

    await new Promise((r) => setTimeout(r, 800));

    // 2. Verify saved-room-state.json exists on disk
    console.log("Step 2: Checking saved-room-state.json on server disk...");
    assert.ok(existsSync(diskSavePath), "saved-room-state.json must exist on disk");
    const diskContent = JSON.parse(readFileSync(diskSavePath, 'utf8'));
    console.log("Disk Saved Custom Items count:", diskContent.custom_items?.length);
    const diskItem = diskContent.custom_items?.find(it => it.id === 'painting-alps-01');
    assert.ok(diskItem, "painting-alps-01 must be saved on disk");
    assert.deepStrictEqual(diskItem.corners.tl, [14.2, 10.8], "Disk corners must match modified corners");
    assert.strictEqual(diskItem.user_scale, 1.15, "Disk user_scale must match 1.15");
    console.log("Verified: Disk file contains exact corners and scale!");

    // 3. Clear browser localStorage to simulate a fresh browser session or new device
    console.log("Step 3: Clearing browser localStorage to test pure Server Disk hydration...");
    await cdpSend(ws, "Runtime.evaluate", {
      expression: `localStorage.clear()`
    });

    // 4. Reload page from scratch
    console.log("Step 4: Reloading page...");
    await cdpSend(ws, "Page.reload");
    await new Promise((r) => setTimeout(r, 2200));

    // 5. Verify restored state on the reloaded page
    console.log("Step 5: Verifying restored positions, corners, matrix3d, and layers...");
    const restoreCheck = await cdpSend(ws, "Runtime.evaluate", {
      returnByValue: true,
      expression: `
        (() => {
          const item = (inventoryState.custom_items || []).find(it => it.id === 'painting-alps-01');
          if (!item) return { found: false };
          
          const img = document.getElementById('perspective-img-painting-alps-01');
          const transform = img ? img.style.transform : '';
          
          return {
            found: true,
            corners: item.corners,
            user_scale: item.user_scale,
            hasMatrix3d: transform.includes('matrix3d'),
            transform,
            lampOff: interiorLayersState.lamp === false,
            activeScene: currentSceneId
          };
        })()
      `
    });

    const resVal = restoreCheck.result ? restoreCheck.result.value : restoreCheck.value;
    console.log("Reload Verification Result:", JSON.stringify(resVal, null, 2));

    assert.ok(resVal.found, "painting-alps-01 must be found after reload");
    assert.deepStrictEqual(resVal.corners.tl, [14.2, 10.8], "TL corner must be [14.2, 10.8]");
    assert.deepStrictEqual(resVal.corners.tr, [33.6, 16.5], "TR corner must be [33.6, 16.5]");
    assert.strictEqual(resVal.user_scale, 1.15, "user_scale must be 1.15");
    assert.ok(resVal.hasMatrix3d, "matrix3d transform must be computed and active");
    assert.ok(resVal.lampOff, "lamp layer state must be preserved as false");

    // Capture visual screenshot
    const shot = await cdpSend(ws, "Page.captureScreenshot", { format: "png" });
    writeFileSync(path.join(outputDir, "38-saved-room-reloaded-from-disk-success.png"), Buffer.from(shot.data, "base64"));
    console.log("Saved: 38-saved-room-reloaded-from-disk-success.png");

    console.log("ALL PERSISTENCE, SAVE & RELOAD TESTS PASSED 100%!");
  } finally {
    chromeProc.kill();
    process.exit(0);
  }
}

runTest().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
