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

async function testRotationAndYSorting() {
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

  const profileDir = path.join(root, ".tmp-rot-chrome-profile");
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

    // Navigate to prototype
    await cdpSend(ws, "Page.navigate", { url: "http://localhost:3450" });
    await new Promise((r) => setTimeout(r, 1200));

    // Switch to scene_interior
    await cdpSend(ws, "Runtime.evaluate", {
      expression: `switchScene('scene_interior');`
    });
    await new Promise((r) => setTimeout(r, 600));

    // Test 1: Check Auto Y-Sorting initial state
    const evalYSortingInit = await cdpSend(ws, "Runtime.evaluate", {
      expression: `(() => {
        const tableNode = document.querySelector('.slot-node[data-item-id="outdoor_table_01"]');
        const potNode = document.querySelector('.slot-node[data-item-id="flower_pot_02"]');
        const lampNode = document.querySelector('.slot-node[data-item-id="table_lamp_01"]');
        return {
          tableZ: tableNode ? parseInt(tableNode.style.zIndex, 10) : 0,
          tableTop: tableNode ? tableNode.style.top : '',
          potZ: potNode ? parseInt(potNode.style.zIndex, 10) : 0,
          potTop: potNode ? potNode.style.top : '',
          lampZ: lampNode ? parseInt(lampNode.style.zIndex, 10) : 0
        };
      })()`,
      returnByValue: true
    });
    console.log("Initial Y-Sorting state:", evalYSortingInit.result.value);
    const { tableZ, potZ } = evalYSortingInit.result.value;
    assert.ok(tableZ > potZ, `Table (z=${tableZ}) should have higher zIndex than Pot (z=${potZ}) because it is further in foreground`);

    // Test 2: Rotate the coffee table by +30°
    await cdpSend(ws, "Runtime.evaluate", {
      expression: `changeItemRotation('outdoor_table_01', 30, true);`
    });
    await new Promise((r) => setTimeout(r, 400));

    const evalRot = await cdpSend(ws, "Runtime.evaluate", {
      expression: `(() => {
        const node = document.querySelector('.slot-node[data-item-id="outdoor_table_01"]');
        const rotVal = node ? node.querySelector('.slot-rotate-val') : null;
        const cssRot = node ? node.style.getPropertyValue('--item-rot') : '';
        return {
          rotText: rotVal ? rotVal.textContent : '',
          cssRot: cssRot
        };
      })()`,
      returnByValue: true
    });
    console.log("Rotated table state (+30°):", evalRot.result.value);
    assert.equal(evalRot.result.value.rotText, "30°", "Rotation badge should show 30°");
    assert.equal(evalRot.result.value.cssRot, "30deg", "CSS --item-rot should be 30deg");

    // Capture screenshot: Table rotated
    const shot1 = await cdpSend(ws, "Page.captureScreenshot", { format: "png" });
    writeFileSync(path.join(outputDir, "06a-rotation-active.png"), Buffer.from(shot1.data, "base64"));
    console.log("Captured 06a-rotation-active.png");

    // Test 3: Auto Y-sorting dynamic test
    // Drag table backwards (higher up on screen to top: 68%, behind pot which is at ~72%)
    await cdpSend(ws, "Runtime.evaluate", {
      expression: `(() => {
        const node = document.querySelector('.slot-node[data-item-id="outdoor_table_01"]');
        if (node) {
          node.style.top = '68%';
          node.style.left = '22%';
          recalculateSceneYSorting();
        }
      })()`
    });
    await new Promise((r) => setTimeout(r, 400));

    const evalYSortingMoved = await cdpSend(ws, "Runtime.evaluate", {
      expression: `(() => {
        const tableNode = document.querySelector('.slot-node[data-item-id="outdoor_table_01"]');
        const potNode = document.querySelector('.slot-node[data-item-id="flower_pot_02"]');
        return {
          tableZ: tableNode ? parseInt(tableNode.style.zIndex, 10) : 0,
          potZ: potNode ? parseInt(potNode.style.zIndex, 10) : 0
        };
      })()`,
      returnByValue: true
    });
    console.log("Y-Sorting moved state (table dragged behind pot):", evalYSortingMoved.result.value);
    assert.ok(evalYSortingMoved.result.value.tableZ < evalYSortingMoved.result.value.potZ, 
      `Table (z=${evalYSortingMoved.result.value.tableZ}) should now have LOWER zIndex than Pot (z=${evalYSortingMoved.result.value.potZ})`);

    // Capture screenshot: Y-Sorting depth layering
    const shot2 = await cdpSend(ws, "Page.captureScreenshot", { format: "png" });
    writeFileSync(path.join(outputDir, "06b-ysorting-depth-layering.png"), Buffer.from(shot2.data, "base64"));
    console.log("Captured 06b-ysorting-depth-layering.png");

    // Test 4: Open modal and verify rotation slider & badge
    await cdpSend(ws, "Runtime.evaluate", {
      expression: `openItemModal('outdoor_table_01');`
    });
    await new Promise((r) => setTimeout(r, 500));

    const evalModal = await cdpSend(ws, "Runtime.evaluate", {
      expression: `(() => {
        const slider = document.getElementById('modal-rotation-slider');
        const badge = document.getElementById('modal-rotation-val');
        return {
          sliderVal: slider ? slider.value : '',
          badgeText: badge ? badge.textContent : ''
        };
      })()`,
      returnByValue: true
    });
    console.log("Modal rotation state:", evalModal.result.value);
    assert.equal(evalModal.result.value.badgeText, "30°", "Modal rotation badge should reflect 30°");

    // Close modal and reset table to default slot
    await cdpSend(ws, "Runtime.evaluate", {
      expression: `(() => {
        closeItemModal();
        resetItemToDefaultSlot('outdoor_table_01');
      })()`
    });
    await new Promise((r) => setTimeout(r, 500));

    // Capture clean reset screenshot
    const shot3 = await cdpSend(ws, "Page.captureScreenshot", { format: "png" });
    writeFileSync(path.join(outputDir, "06c-reset-clean.png"), Buffer.from(shot3.data, "base64"));
    console.log("Captured 06c-reset-clean.png");

    console.log("\n=========================================");
    console.log("🎉 ALL ROTATION & AUTO Y-SORTING TESTS PASSED!");
    console.log("=========================================\n");

    ws.close();
  } finally {
    chromeProc.kill("SIGKILL");
  }
}

testRotationAndYSorting().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
