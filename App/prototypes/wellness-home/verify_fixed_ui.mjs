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

    // 1. Capture Normal Restored View
    console.log("Capturing 40-fixed-clean-ui-overview.png...");
    const shot1 = await cdpSend(ws, "Page.captureScreenshot", { format: "png" });
    writeFileSync(path.join(outputDir, "40-fixed-clean-ui-overview.png"), Buffer.from(shot1.data, "base64"));

    // 2. Test collapsing the drawer to expand room to full width
    console.log("Collapsing drawer for full width room...");
    await cdpSend(ws, "Runtime.evaluate", {
      expression: `toggleDecorDrawer()`
    });
    await new Promise((r) => setTimeout(r, 500));

    const shot2 = await cdpSend(ws, "Page.captureScreenshot", { format: "png" });
    writeFileSync(path.join(outputDir, "41-fullscreen-wide-room-drawer-collapsed.png"), Buffer.from(shot2.data, "base64"));
    console.log("Saved 41-fullscreen-wide-room-drawer-collapsed.png");

    console.log("ALL UI CAPTURES COMPLETED SUCCESSFULLY!");
  } finally {
    chromeProc.kill();
    process.exit(0);
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
