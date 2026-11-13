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
  console.log("Starting Chrome for Day/Night verification...");
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

    // 1. In Living Room: Add painting in Day mode
    console.log("Step 1: Adding painting in Living Room Day mode...");
    const daySetup = await cdpSend(ws, "Runtime.evaluate", {
      returnByValue: true,
      expression: `
        (() => {
          switchScene('scene_interior_wide');
          if (currentDayNight !== 'day') toggleDayNightMode();
          addSamplePainting();
          const item = inventoryState.custom_items.find(it => it.id === 'painting-alps-01');
          const img = document.getElementById('perspective-img-painting-alps-01');
          const baseImg = document.querySelector('#layer-scene_interior_wide .scene-img');
          return {
            corners: JSON.parse(JSON.stringify(item.corners)),
            transform: img ? img.style.transform : '',
            baseImgSrc: baseImg ? baseImg.src : ''
          };
        })()
      `
    });

    const dayVal = daySetup.result ? daySetup.result.value : daySetup.value;
    console.log("Day mode setup:", JSON.stringify(dayVal, null, 2));

    const shotDay = await cdpSend(ws, "Page.captureScreenshot", { format: "png" });
    writeFileSync(path.join(outputDir, "44-living-room-day-mode.png"), Buffer.from(shotDay.data, "base64"));
    console.log("Saved: 44-living-room-day-mode.png");

    // 2. Toggle to Night mode
    console.log("Step 2: Toggling to Night mode in Living Room...");
    const nightCheck = await cdpSend(ws, "Runtime.evaluate", {
      returnByValue: true,
      expression: `
        (() => {
          toggleDayNightMode();
          const item = inventoryState.custom_items.find(it => it.id === 'painting-alps-01');
          const img = document.getElementById('perspective-img-painting-alps-01');
          const baseImg = document.querySelector('#layer-scene_interior_wide .scene-img');
          return {
            mode: currentDayNight,
            corners: JSON.parse(JSON.stringify(item.corners)),
            transform: img ? img.style.transform : '',
            baseImgSrc: baseImg ? baseImg.src : ''
          };
        })()
      `
    });

    const nightVal = nightCheck.result ? nightCheck.result.value : nightCheck.value;
    console.log("Night mode check:", JSON.stringify(nightVal, null, 2));

    assert.strictEqual(nightVal.mode, 'night', "Mode must be night");
    assert.ok(nightVal.baseImgSrc.includes('scene_interior_wide_night.webp'), "Base image must switch to night version");
    assert.deepStrictEqual(nightVal.corners, dayVal.corners, "Item corners must be 100% IDENTICAL between day and night!");
    assert.strictEqual(nightVal.transform, dayVal.transform, "CSS matrix3d transform must be 100% IDENTICAL!");

    const shotNight = await cdpSend(ws, "Page.captureScreenshot", { format: "png" });
    writeFileSync(path.join(outputDir, "45-living-room-night-mode-identical-position.png"), Buffer.from(shotNight.data, "base64"));
    console.log("Saved: 45-living-room-night-mode-identical-position.png");

    // 3. Switch to Bedroom in Night mode
    console.log("Step 3: Checking Bedroom in Night mode...");
    const bedNightCheck = await cdpSend(ws, "Runtime.evaluate", {
      returnByValue: true,
      expression: `
        (() => {
          switchScene('scene_bedroom');
          const baseImg = document.querySelector('#layer-scene_bedroom .scene-img');
          return {
            scene: currentSceneId,
            mode: currentDayNight,
            baseImgSrc: baseImg ? baseImg.src : ''
          };
        })()
      `
    });

    const bedNightVal = bedNightCheck.result ? bedNightCheck.result.value : bedNightCheck.value;
    console.log("Bedroom Night check:", JSON.stringify(bedNightVal, null, 2));
    assert.ok(bedNightVal.baseImgSrc.includes('scene_bedroom_night.webp'), "Bedroom must show night version when in night mode");

    const shotBedNight = await cdpSend(ws, "Page.captureScreenshot", { format: "png" });
    writeFileSync(path.join(outputDir, "46-bedroom-night-mode-view.png"), Buffer.from(shotBedNight.data, "base64"));
    console.log("Saved: 46-bedroom-night-mode-view.png");

    console.log("ALL DAY/NIGHT VERIFICATIONS COMPLETED 100%!");
  } finally {
    chromeProc.kill();
    process.exit(0);
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
