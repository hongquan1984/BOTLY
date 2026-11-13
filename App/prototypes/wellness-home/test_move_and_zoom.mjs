import { spawn } from 'child_process';
import { writeFileSync, existsSync } from 'fs';
import path from 'path';
import assert from 'assert';

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const outputDir = "C:\\Users\\Admin\\.gemini\\antigravity\\brain\\685e195b-af4b-4fee-8d91-49c1fcd4597d";

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
  console.log("Starting Chrome for Move & Zoom test...");
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

    if (!wsUrl) throw new Error("Could not connect to Chrome DevTools protocol");

    const WebSocket = (await import('ws')).default;
    const ws = new WebSocket(wsUrl);
    await new Promise((r) => ws.on('open', r));

    await cdpSend(ws, "Page.enable");
    await cdpSend(ws, "Runtime.enable");

    console.log("Navigating to http://localhost:3450...");
    await cdpSend(ws, "Page.navigate", { url: "http://localhost:3450" });
    await new Promise((r) => setTimeout(r, 1500));

    // Ensure wide interior scene and add sample painting
    await cdpSend(ws, "Runtime.evaluate", {
      expression: `
        (() => {
          switchScene('scene_interior_wide');
          addSamplePainting();
        })()
      `
    });
    await new Promise((r) => setTimeout(r, 500));

    // 1. Test Moving the item by dragging its body (hitarea)
    console.log("Step 1: Testing Moving image by dragging its body directly...");
    const moveResult = await cdpSend(ws, "Runtime.evaluate", {
      returnByValue: true,
      expression: `
        (() => {
          const item = inventoryState.custom_items.find(it => it.id === 'painting-alps-01');
          const beforeCorners = JSON.parse(JSON.stringify(item.corners));
          
          const hitArea = document.getElementById('perspective-hit-painting-alps-01');
          const rect = hitArea.getBoundingClientRect();
          const startX = rect.left + rect.width / 2;
          const startY = rect.top + rect.height / 2;
          
          // Drag body +60px right, +40px down
          hitArea.dispatchEvent(new PointerEvent('pointerdown', { clientX: startX, clientY: startY, pointerId: 1, button: 0, bubbles: true }));
          window.dispatchEvent(new PointerEvent('pointermove', { clientX: startX + 60, clientY: startY + 40, pointerId: 1, bubbles: true }));
          window.dispatchEvent(new PointerEvent('pointerup', { clientX: startX + 60, clientY: startY + 40, pointerId: 1, bubbles: true }));
          
          const afterCorners = JSON.parse(JSON.stringify(item.corners));
          const dxTL = afterCorners.tl[0] - beforeCorners.tl[0];
          const dyTL = afterCorners.tl[1] - beforeCorners.tl[1];
          const dxBR = afterCorners.br[0] - beforeCorners.br[0];
          const dyBR = afterCorners.br[1] - beforeCorners.br[1];
          
          return {
            beforeCorners,
            afterCorners,
            dxTL: Math.round(dxTL * 100) / 100,
            dyTL: Math.round(dyTL * 100) / 100,
            dxBR: Math.round(dxBR * 100) / 100,
            dyBR: Math.round(dyBR * 100) / 100,
            translatedTogether: Math.abs(dxTL - dxBR) < 0.1 && Math.abs(dyTL - dyBR) < 0.1 && dxTL > 0
          };
        })()
      `
    });

    console.log("Move Result Raw:", JSON.stringify(moveResult, null, 2));
    const val1 = moveResult.result ? moveResult.result.value : moveResult.value;
    assert.ok(val1 && val1.translatedTogether, "All corners must translate together when dragging body");

    const shot1 = await cdpSend(ws, "Page.captureScreenshot", { format: "png" });
    writeFileSync(path.join(outputDir, "35-direct-body-move-success.png"), Buffer.from(shot1.data, "base64"));
    console.log("Saved: 35-direct-body-move-success.png");

    // 2. Test Zooming In with Button
    console.log("Step 2: Testing Zoom In with Button (+) ...");
    const zoomInResult = await cdpSend(ws, "Runtime.evaluate", {
      returnByValue: true,
      expression: `
        (() => {
          const item = inventoryState.custom_items.find(it => it.id === 'painting-alps-01');
          const beforeCorners = JSON.parse(JSON.stringify(item.corners));
          const beforeSpanX = beforeCorners.tr[0] - beforeCorners.tl[0];
          
          scaleSelectedCustomItem(0.2); // +20%
          
          const afterCorners = JSON.parse(JSON.stringify(item.corners));
          const afterSpanX = afterCorners.tr[0] - afterCorners.tl[0];
          const scaleBadge = document.getElementById('ptool-scale-badge')?.textContent;
          
          return {
            beforeSpanX,
            afterSpanX,
            scaleRatio: Math.round((afterSpanX / beforeSpanX) * 100) / 100,
            scaleBadge,
            isLarger: afterSpanX > beforeSpanX
          };
        })()
      `
    });

    const val2 = zoomInResult.result ? zoomInResult.result.value : zoomInResult.value;
    console.log("Zoom In Result:", JSON.stringify(val2, null, 2));
    assert.ok(val2 && val2.isLarger, "Item width must increase when zooming in");

    const shot2 = await cdpSend(ws, "Page.captureScreenshot", { format: "png" });
    writeFileSync(path.join(outputDir, "36-zoom-in-magnified-success.png"), Buffer.from(shot2.data, "base64"));
    console.log("Saved: 36-zoom-in-magnified-success.png");

    // 3. Test Mouse Wheel Zoom
    console.log("Step 3: Testing Mouse Wheel Zoom Out (-)...");
    const wheelResult = await cdpSend(ws, "Runtime.evaluate", {
      returnByValue: true,
      expression: `
        (() => {
          const item = inventoryState.custom_items.find(it => it.id === 'painting-alps-01');
          const beforeCorners = JSON.parse(JSON.stringify(item.corners));
          const beforeSpanX = beforeCorners.tr[0] - beforeCorners.tl[0];
          
          const hitArea = document.getElementById('perspective-hit-painting-alps-01');
          // Wheel scroll down (zoom out)
          hitArea.dispatchEvent(new WheelEvent('wheel', { deltaY: 100, bubbles: true }));
          hitArea.dispatchEvent(new WheelEvent('wheel', { deltaY: 100, bubbles: true }));
          
          const afterCorners = JSON.parse(JSON.stringify(item.corners));
          const afterSpanX = afterCorners.tr[0] - afterCorners.tl[0];
          const scaleBadge = document.getElementById('ptool-scale-badge')?.textContent;
          
          return {
            beforeSpanX,
            afterSpanX,
            scaleBadge,
            isSmaller: afterSpanX < beforeSpanX
          };
        })()
      `
    });

    const val3 = wheelResult.result ? wheelResult.result.value : wheelResult.value;
    console.log("Wheel Result:", JSON.stringify(val3, null, 2));
    assert.ok(val3 && val3.isSmaller, "Item must shrink when scrolling wheel down");

    // 4. Test Independent Corner Drag is STILL 100% functional
    console.log("Step 4: Testing independent Top-Left corner drag...");
    const cornerDragResult = await cdpSend(ws, "Runtime.evaluate", {
      returnByValue: true,
      expression: `
        (() => {
          const item = inventoryState.custom_items.find(it => it.id === 'painting-alps-01');
          const beforeCorners = JSON.parse(JSON.stringify(item.corners));
          
          const handleTL = document.getElementById('perspective-handle-painting-alps-01-tl');
          const stageRect = document.getElementById('scene-stage').getBoundingClientRect();
          const startX = parseFloat(handleTL.style.left) + stageRect.left;
          const startY = parseFloat(handleTL.style.top) + stageRect.top;
          
          // Drag TL by -30px, -20px
          handleTL.dispatchEvent(new PointerEvent('pointerdown', { clientX: startX, clientY: startY, pointerId: 1, bubbles: true }));
          handleTL.dispatchEvent(new PointerEvent('pointermove', { clientX: startX - 30, clientY: startY - 20, pointerId: 1, bubbles: true }));
          handleTL.dispatchEvent(new PointerEvent('pointerup', { clientX: startX - 30, clientY: startY - 20, pointerId: 1, bubbles: true }));
          
          const afterCorners = JSON.parse(JSON.stringify(item.corners));
          
          return {
            beforeCorners,
            afterCorners,
            tlMoved: afterCorners.tl[0] !== beforeCorners.tl[0] || afterCorners.tl[1] !== beforeCorners.tl[1],
            trFixed: afterCorners.tr[0] === beforeCorners.tr[0] && afterCorners.tr[1] === beforeCorners.tr[1],
            brFixed: afterCorners.br[0] === beforeCorners.br[0] && afterCorners.br[1] === beforeCorners.br[1],
            blFixed: afterCorners.bl[0] === beforeCorners.bl[0] && afterCorners.bl[1] === beforeCorners.bl[1]
          };
        })()
      `
    });

    const val4 = cornerDragResult.result ? cornerDragResult.result.value : cornerDragResult.value;
    console.log("Corner Drag Result:", JSON.stringify(val4, null, 2));
    assert.ok(val4 && val4.tlMoved, "TL must have moved");
    assert.ok(val4 && val4.trFixed, "TR must stay fixed");
    assert.ok(val4 && val4.brFixed, "BR must stay fixed");
    assert.ok(val4 && val4.blFixed, "BL must stay fixed");

    const shot3 = await cdpSend(ws, "Page.captureScreenshot", { format: "png" });
    writeFileSync(path.join(outputDir, "37-corner-warp-and-zoom-combined.png"), Buffer.from(shot3.data, "base64"));
    console.log("Saved: 37-corner-warp-and-zoom-combined.png");

    console.log("ALL MOVE, ZOOM, SCALE & PERSPECTIVE CORNER TESTS PASSED 100%!");
  } finally {
    chromeProc.kill();
    process.exit(0);
  }
}

runTest().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
