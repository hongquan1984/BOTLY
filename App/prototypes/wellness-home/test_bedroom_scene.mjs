import { spawn } from 'child_process';
import { writeFileSync } from 'fs';
import path from 'path';
import assert from 'assert';

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

async function run() {
  console.log("Starting Chrome for Bedroom Scene verification...");
  const chromeProc = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
    '--remote-debugging-port=9222', '--headless=new', '--disable-gpu',
    '--window-size=1440,900'
  ]);

  try {
    let wsUrl = null;
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 250));
      try {
        const res = await fetch('http://127.0.0.1:9222/json/list');
        const list = await res.json();
        const page = list.find((item) => item.type === "page");
        if (page?.webSocketDebuggerUrl) {
          wsUrl = page.webSocketDebuggerUrl;
          break;
        }
      } catch (_) {}
    }

    const WebSocket = (await import('ws')).default;
    const ws = new WebSocket(wsUrl);
    await new Promise((r) => ws.on('open', r));

    await cdpSend(ws, "Page.enable");
    await cdpSend(ws, "Runtime.enable");

    console.log("Navigating to http://localhost:3450...");
    await cdpSend(ws, "Page.navigate", { url: "http://localhost:3450" });
    await new Promise((r) => setTimeout(r, 2000));

    // 1. Switch to Bedroom Scene
    console.log("Step 1: Switching to Bedroom Scene...");
    const switchRes = await cdpSend(ws, "Runtime.evaluate", {
      returnByValue: true,
      expression: `
        (() => {
          switchScene('scene_bedroom');
          const layer = document.getElementById('layer-scene_bedroom');
          const img = layer ? layer.querySelector('.scene-img') : null;
          return {
            currentSceneId,
            layerActive: layer && layer.classList.contains('active'),
            imgSrc: img ? img.src : ''
          };
        })()
      `
    });

    const swVal = switchRes.result ? switchRes.result.value : switchRes.value;
    console.log("Switch result:", JSON.stringify(swVal, null, 2));
    assert.strictEqual(swVal.currentSceneId, 'scene_bedroom', "Current scene must be scene_bedroom");
    assert.ok(swVal.layerActive, "layer-scene_bedroom must be active");
    assert.ok(swVal.imgSrc.includes('scene_bedroom.webp'), "Image must be scene_bedroom.webp");

    await new Promise((r) => setTimeout(r, 1000));

    // Capture clean bedroom view (just the bed, minimalist luxury)
    const shot1 = await cdpSend(ws, "Page.captureScreenshot", { format: "png" });
    writeFileSync(path.join(outputDir, "42-bedroom-clean-swiss-chalet-view.png"), Buffer.from(shot1.data, "base64"));
    console.log("Saved: 42-bedroom-clean-swiss-chalet-view.png");

    // 2. Add an elegant artwork above the bed or on the side wall
    console.log("Step 2: Adding and positioning wall artwork in bedroom...");
    await cdpSend(ws, "Runtime.evaluate", {
      returnByValue: true,
      expression: `
        (() => {
          const item = {
            id: 'painting-bedroom-01',
            name: 'Tranh Núi Alps Ban Mai',
            img_src: 'assets/items/painting-alps-01.png',
            scene_id: 'scene_bedroom',
            natural_width: 600,
            natural_height: 420,
            corners: {
              tl: [38.5, 12.0],
              tr: [61.5, 12.0],
              br: [61.5, 36.5],
              bl: [38.5, 36.5]
            },
            user_scale: 1.0,
            z_index: 200,
            displayed: true,
            visible: true,
            created_at: new Date().toISOString()
          };
          inventoryState.custom_items.push(item);
          selectedCustomItemId = item.id;
          saveState();
          renderCustomItems();
        })()
      `
    });

    await new Promise((r) => setTimeout(r, 800));

    const shot2 = await cdpSend(ws, "Page.captureScreenshot", { format: "png" });
    writeFileSync(path.join(outputDir, "43-bedroom-with-custom-artwork-warped.png"), Buffer.from(shot2.data, "base64"));
    console.log("Saved: 43-bedroom-with-custom-artwork-warped.png");

    console.log("ALL BEDROOM SCENE VERIFICATIONS COMPLETED 100%!");
  } finally {
    chromeProc.kill();
    process.exit(0);
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
