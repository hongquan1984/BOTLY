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

async function captureMultiPlayerEvidence() {
  console.log("Starting Chrome for Multi-Player Evidence Screenshots...");

  const chromeProc = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
    '--remote-debugging-port=9226', '--headless=new', '--disable-gpu',
    '--window-size=1440,900'
  ]);

  try {
    let wsUrl = null;
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 250));
      try {
        const res = await fetch('http://127.0.0.1:9226/json/list');
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

    await cdpSend(ws, "Page.navigate", { url: "http://localhost:3450" });
    await new Promise((r) => setTimeout(r, 2500));

    // 1. Capture Player 1 Living Room (Has Sofa)
    console.log("1. Capturing Player 1 Living Room...");
    await cdpSend(ws, "Runtime.evaluate", {
      expression: `
        (async () => {
          await switchPlayerProfile('player_1');
          switchScene('scene_interior_wide');
        })()
      `
    });
    await new Promise((r) => setTimeout(r, 800));

    let shot = await cdpSend(ws, "Page.captureScreenshot", { format: "png" });
    writeFileSync(path.join(outputDir, "60-player1-living-room-sofa.png"), Buffer.from(shot.data, "base64"));
    console.log("Saved 60-player1-living-room-sofa.png");

    // 2. Capture Player 1 Bedroom (Has Armchair)
    console.log("2. Capturing Player 1 Bedroom...");
    await cdpSend(ws, "Runtime.evaluate", {
      expression: `switchScene('scene_bedroom');`
    });
    await new Promise((r) => setTimeout(r, 800));

    shot = await cdpSend(ws, "Page.captureScreenshot", { format: "png" });
    writeFileSync(path.join(outputDir, "61-player1-bedroom-armchair.png"), Buffer.from(shot.data, "base64"));
    console.log("Saved 61-player1-bedroom-armchair.png");

    // 3. Switch to Player 2 Living Room (Has Piano)
    console.log("3. Capturing Player 2 Living Room...");
    await cdpSend(ws, "Runtime.evaluate", {
      expression: `
        (async () => {
          await switchPlayerProfile('player_2');
          switchScene('scene_interior_wide');
        })()
      `
    });
    await new Promise((r) => setTimeout(r, 800));

    shot = await cdpSend(ws, "Page.captureScreenshot", { format: "png" });
    writeFileSync(path.join(outputDir, "62-player2-living-room-piano.png"), Buffer.from(shot.data, "base64"));
    console.log("Saved 62-player2-living-room-piano.png");

    // 4. Capture Player 2 Bedroom (Has Luxury Bed)
    console.log("4. Capturing Player 2 Bedroom...");
    await cdpSend(ws, "Runtime.evaluate", {
      expression: `switchScene('scene_bedroom');`
    });
    await new Promise((r) => setTimeout(r, 800));

    shot = await cdpSend(ws, "Page.captureScreenshot", { format: "png" });
    writeFileSync(path.join(outputDir, "63-player2-bedroom-luxury-bed.png"), Buffer.from(shot.data, "base64"));
    console.log("Saved 63-player2-bedroom-luxury-bed.png");

    // 5. Capture Pick 1 of 2 Daily Reward Modal
    console.log("5. Capturing Pick 1 of 2 Modal...");
    await cdpSend(ws, "Runtime.evaluate", {
      expression: `openDailyRewardModal();`
    });
    await new Promise((r) => setTimeout(r, 800));

    shot = await cdpSend(ws, "Page.captureScreenshot", { format: "png" });
    writeFileSync(path.join(outputDir, "64-pick-1-of-2-reward-modal.png"), Buffer.from(shot.data, "base64"));
    console.log("Saved 64-pick-1-of-2-reward-modal.png");

    console.log("All multi-player evidence screenshots captured successfully!");
    ws.close();
  } finally {
    chromeProc.kill();
  }
}

captureMultiPlayerEvidence().catch(err => {
  console.error("Capture failed:", err);
  process.exit(1);
});
