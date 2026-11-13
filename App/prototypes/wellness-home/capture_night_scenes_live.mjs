import { spawn } from 'child_process';
import { writeFileSync } from 'fs';
import path from 'path';

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
  console.log("Starting Chrome for Authentic Night Background verification...");
  const chromeProc = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
    '--remote-debugging-port=9223', '--headless=new', '--disable-gpu',
    '--window-size=1440,900'
  ]);

  try {
    let wsUrl = null;
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 250));
      try {
        const res = await fetch('http://127.0.0.1:9223/json/list');
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

    // 1. Ensure Living room day mode
    console.log("Capturing Living Room Day Mode...");
    await cdpSend(ws, "Runtime.evaluate", {
      expression: `
        (() => {
          switchScene('scene_interior_wide');
          if (currentDayNight === 'night') toggleDayNightMode();
        })()
      `
    });
    await new Promise((r) => setTimeout(r, 800));

    let shot = await cdpSend(ws, "Page.captureScreenshot", { format: "png" });
    writeFileSync(path.join(outputDir, "47-living-room-day-authentic.png"), Buffer.from(shot.data, "base64"));
    console.log("Saved 47-living-room-day-authentic.png");

    // 2. Toggle to Night Mode
    console.log("Toggling to Night Mode...");
    const toggleRes = await cdpSend(ws, "Runtime.evaluate", {
      returnByValue: true,
      expression: `
        (() => {
          toggleDayNightMode();
          const layer = document.getElementById('layer-scene_interior_wide');
          const img = layer ? layer.querySelector('.scene-img.base-layer') : null;
          const items = (inventoryState.custom_items || []).map(it => ({
            id: it.id, name: it.name, x: it.x, y: it.y, scale: it.user_scale
          }));
          return {
            dayNight: currentDayNight,
            imgSrc: img ? img.src : null,
            itemCount: items.length,
            items: items
          };
        })()
      `
    });
    console.log("Living Room Night State:", toggleRes.result.value);
    await new Promise((r) => setTimeout(r, 800));

    shot = await cdpSend(ws, "Page.captureScreenshot", { format: "png" });
    writeFileSync(path.join(outputDir, "48-living-room-night-authentic.png"), Buffer.from(shot.data, "base64"));
    console.log("Saved 48-living-room-night-authentic.png");

    // 3. Switch to Bedroom Day Mode
    console.log("Switching to Bedroom Day Mode...");
    await cdpSend(ws, "Runtime.evaluate", {
      expression: `
        (() => {
          switchScene('scene_bedroom');
          if (currentDayNight === 'night') toggleDayNightMode();
        })()
      `
    });
    await new Promise((r) => setTimeout(r, 800));

    shot = await cdpSend(ws, "Page.captureScreenshot", { format: "png" });
    writeFileSync(path.join(outputDir, "49-bedroom-day-view.png"), Buffer.from(shot.data, "base64"));
    console.log("Saved 49-bedroom-day-view.png");

    // 4. Toggle Bedroom to Night Mode
    console.log("Toggling Bedroom to Night Mode...");
    await cdpSend(ws, "Runtime.evaluate", {
      returnByValue: true,
      expression: `
        (() => {
          toggleDayNightMode();
          const layer = document.getElementById('layer-scene_bedroom');
          const img = layer ? layer.querySelector('.scene-img.base-layer') : null;
          return {
            dayNight: currentDayNight,
            imgSrc: img ? img.src : null
          };
        })()
      `
    });
    await new Promise((r) => setTimeout(r, 800));

    shot = await cdpSend(ws, "Page.captureScreenshot", { format: "png" });
    writeFileSync(path.join(outputDir, "50-bedroom-night-view.png"), Buffer.from(shot.data, "base64"));
    console.log("Saved 50-bedroom-night-view.png");

    console.log("All screenshots captured!");
    ws.close();
  } finally {
    chromeProc.kill();
  }
}

run().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
