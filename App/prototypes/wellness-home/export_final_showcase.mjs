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

async function exportFinalShowcase() {
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

  const profileDir = path.join(root, ".tmp-showcase-profile");
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

    // 1. Capture Interior Empty (Hide all items & guide pins)
    await cdpSend(ws, "Runtime.evaluate", {
      expression: `(() => {
        switchScene('scene_interior');
        const container = document.getElementById('slots-container-scene_interior');
        if (container) container.style.display = 'none';
      })()`
    });
    await new Promise((r) => setTimeout(r, 400));
    const shotIntEmpty = await cdpSend(ws, "Page.captureScreenshot", { format: "png" });
    writeFileSync(path.join(outputDir, "07-interior-empty.png"), Buffer.from(shotIntEmpty.data, "base64"));
    console.log("Saved 07-interior-empty.png");

    // 2. Fully stage Interior with all 5 items, hide empty pins for clean luxury view
    await cdpSend(ws, "Runtime.evaluate", {
      expression: `(() => {
        const container = document.getElementById('slots-container-scene_interior');
        if (container) container.style.display = 'block';

        // Unlock all items
        claimAllTestItems();

        // Assign all 5 interior slots
        inventoryState.slots['slot_interior_01'] = 'flower_pot_02';
        inventoryState.inventory['flower_pot_02'].displayed = true;
        inventoryState.inventory['flower_pot_02'].active_slot = 'slot_interior_01';

        inventoryState.slots['slot_interior_02'] = 'rug_01';
        inventoryState.inventory['rug_01'].displayed = true;
        inventoryState.inventory['rug_01'].active_slot = 'slot_interior_02';

        inventoryState.slots['slot_interior_03'] = 'outdoor_table_01';
        inventoryState.inventory['outdoor_table_01'].displayed = true;
        inventoryState.inventory['outdoor_table_01'].active_slot = 'slot_interior_03';

        inventoryState.slots['slot_interior_04'] = 'armchair_01';
        inventoryState.inventory['armchair_01'].displayed = true;
        inventoryState.inventory['armchair_01'].active_slot = 'slot_interior_04';

        inventoryState.slots['slot_interior_05'] = 'table_lamp_01';
        inventoryState.inventory['table_lamp_01'].displayed = true;
        inventoryState.inventory['table_lamp_01'].active_slot = 'slot_interior_05';

        saveState();
        renderActiveSceneSlots();

        // Turn off guide pins for clean luxury showcase
        if (showSlotGuides) toggleSlotGuides();
      })()`
    });
    await new Promise((r) => setTimeout(r, 600));
    const shotIntFull = await cdpSend(ws, "Page.captureScreenshot", { format: "png" });
    writeFileSync(path.join(outputDir, "07-interior-completed.png"), Buffer.from(shotIntFull.data, "base64"));
    console.log("Saved 07-interior-completed.png");

    // 3. Capture Garden Empty
    await cdpSend(ws, "Runtime.evaluate", {
      expression: `(() => {
        switchScene('scene_garden');
        const container = document.getElementById('slots-container-scene_garden');
        if (container) container.style.display = 'none';
      })()`
    });
    await new Promise((r) => setTimeout(r, 400));
    const shotGdnEmpty = await cdpSend(ws, "Page.captureScreenshot", { format: "png" });
    writeFileSync(path.join(outputDir, "08-garden-empty.png"), Buffer.from(shotGdnEmpty.data, "base64"));
    console.log("Saved 08-garden-empty.png");

    // 4. Fully stage Garden with all 5 items
    await cdpSend(ws, "Runtime.evaluate", {
      expression: `(() => {
        const container = document.getElementById('slots-container-scene_garden');
        if (container) container.style.display = 'block';

        inventoryState.slots['slot_garden_01'] = 'flower_pot_01';
        inventoryState.inventory['flower_pot_01'].displayed = true;
        inventoryState.inventory['flower_pot_01'].active_slot = 'slot_garden_01';

        inventoryState.slots['slot_garden_02'] = 'wooden_bench_01';
        inventoryState.inventory['wooden_bench_01'].displayed = true;
        inventoryState.inventory['wooden_bench_01'].active_slot = 'slot_garden_02';

        inventoryState.slots['slot_garden_03'] = 'outdoor_chair_01';
        inventoryState.inventory['outdoor_chair_01'].displayed = true;
        inventoryState.inventory['outdoor_chair_01'].active_slot = 'slot_garden_03';

        inventoryState.slots['slot_garden_04'] = 'garden_lantern_01';
        inventoryState.inventory['garden_lantern_01'].displayed = true;
        inventoryState.inventory['garden_lantern_01'].active_slot = 'slot_garden_04';

        inventoryState.slots['slot_garden_05'] = 'watering_can_01';
        inventoryState.inventory['watering_can_01'].displayed = true;
        inventoryState.inventory['watering_can_01'].active_slot = 'slot_garden_05';

        saveState();
        renderActiveSceneSlots();
      })()`
    });
    await new Promise((r) => setTimeout(r, 600));
    const shotGdnFull = await cdpSend(ws, "Page.captureScreenshot", { format: "png" });
    writeFileSync(path.join(outputDir, "08-garden-completed.png"), Buffer.from(shotGdnFull.data, "base64"));
    console.log("Saved 08-garden-completed.png");

    // 5. Open Before / After Split Slider for Interior
    await cdpSend(ws, "Runtime.evaluate", {
      expression: `(() => {
        switchScene('scene_interior');
        if (!isCompareMode) toggleCompareMode();
      })()`
    });
    await new Promise((r) => setTimeout(r, 600));
    const shotSplit = await cdpSend(ws, "Page.captureScreenshot", { format: "png" });
    writeFileSync(path.join(outputDir, "09-interior-before-after-split.png"), Buffer.from(shotSplit.data, "base64"));
    console.log("Saved 09-interior-before-after-split.png");

    // Close compare mode for normal viewing
    await cdpSend(ws, "Runtime.evaluate", {
      expression: `if (isCompareMode) toggleCompareMode();`
    });

    console.log("\nAll showcase captures successfully created!");
    ws.close();
  } finally {
    chromeProc.kill("SIGKILL");
  }
}

exportFinalShowcase().catch((e) => {
  console.error("Export error:", e);
  process.exit(1);
});
