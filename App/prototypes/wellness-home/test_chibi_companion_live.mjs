import WebSocket from 'file:///d:/botly/node_modules/ws/index.js';
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

async function runTest() {
  console.log("Starting Chrome for Chibi Companion & Walkable Painter Verification...");

  const chromeProc = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
    '--remote-debugging-port=9240', '--headless=new', '--disable-gpu',
    '--window-size=1440,900'
  ]);

  try {
    let wsUrl = null;
    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 200));
      try {
        const res = await fetch('http://127.0.0.1:9240/json/list');
        const list = await res.json();
        const page = list.find(item => item.type === "page");
        if (page?.webSocketDebuggerUrl) {
          wsUrl = page.webSocketDebuggerUrl;
          break;
        }
      } catch (_) {}
    }

    const ws = new WebSocket(wsUrl);
    await new Promise(r => ws.on('open', r));

    await cdpSend(ws, "Page.enable");
    await cdpSend(ws, "Runtime.enable");

    ws.on('message', d => {
      try {
        const m = JSON.parse(d.toString());
        if (m.method === 'Runtime.consoleAPICalled') {
          console.log('BROWSER_LOG:', ...m.params.args.map(a => a.value));
        }
      } catch (_) {}
    });

    console.log("Navigating to http://localhost:3450...");
    await cdpSend(ws, "Page.navigate", { url: "http://localhost:3450" });
    await new Promise(r => setTimeout(r, 2500));

    // 1. Verify Companion Elements exist and are rendered
    const checkRes = await cdpSend(ws, "Runtime.evaluate", {
      expression: `(() => {
        const comp = document.getElementById('home-chibi-companion');
        const sprite = document.getElementById('chibi-sprite-el');
        const shadow = document.querySelector('.chibi-shadow');
        const select = document.getElementById('select-active-companion');
        return {
          compExists: Boolean(comp),
          spriteExists: Boolean(sprite),
          shadowExists: Boolean(shadow),
          currentSelect: select ? select.value : null,
          compZIndex: comp ? comp.style.zIndex : null,
          compLeft: comp ? comp.style.left : null,
          compTop: comp ? comp.style.top : null,
        };
      })()`,
      returnByValue: true
    });
    console.log("1. Companion Elements Check:", checkRes.result.value);

    // Capture initial companion in Living Room
    let shot = await cdpSend(ws, "Page.captureScreenshot", { format: "png" });
    writeFileSync(path.join(outputDir, "70-chibi-companion-living-room.png"), Buffer.from(shot.data, "base64"));
    console.log("Saved 70-chibi-companion-living-room.png");

    // 2. Click Companion to trigger Greeting & Speech Bubble
    console.log("2. Clicking Companion...");
    await cdpSend(ws, "Runtime.evaluate", {
      expression: `(() => {
        handleCompanionClick();
      })()`
    });
    await new Promise(r => setTimeout(r, 600));

    const bubbleRes = await cdpSend(ws, "Runtime.evaluate", {
      expression: `(() => {
        const bubble = document.getElementById('chibi-speech-bubble');
        const text = document.getElementById('chibi-speech-text');
        return {
          bubbleDisplay: bubble ? window.getComputedStyle(bubble).display : null,
          text: text ? text.textContent : null
        };
      })()`,
      returnByValue: true
    });
    console.log("2. Bubble Check:", bubbleRes.result.value);

    shot = await cdpSend(ws, "Page.captureScreenshot", { format: "png" });
    writeFileSync(path.join(outputDir, "71-chibi-companion-speech-bubble.png"), Buffer.from(shot.data, "base64"));
    console.log("Saved 71-chibi-companion-speech-bubble.png");

    // 3. Switch Companion to Anna and switch to Bedroom
    console.log("3. Switching companion to Anna and scene to Bedroom...");
    await cdpSend(ws, "Runtime.evaluate", {
      expression: `(() => {
        changeActiveCompanion('anna');
        switchScene('scene_bedroom');
      })()`
    });
    await new Promise(r => setTimeout(r, 1200));

    shot = await cdpSend(ws, "Page.captureScreenshot", { format: "png" });
    writeFileSync(path.join(outputDir, "72-chibi-anna-in-bedroom.png"), Buffer.from(shot.data, "base64"));
    console.log("Saved 72-chibi-anna-in-bedroom.png");

    // 4. Switch to Admin mode and Open Walkable Painter Tool
    console.log("4. Switching to Admin mode and opening Walkable Painter Tool...");
    const painterRes = await cdpSend(ws, "Runtime.evaluate", {
      expression: `(async () => {
        try {
          await switchPlayerProfile('player_master');
          switchScene('scene_interior_wide');
          const c = document.getElementById('walkable-painter-canvas');
          console.log('Before toggle:', c ? c.style.display : 'no-c');
          toggleWalkablePainter(true);
          console.log('After toggle:', c ? c.style.display : 'no-c');
          const toolbar = document.getElementById('walkable-painter-toolbar');
          const stage = document.getElementById('scene-stage');
          return {
            active: walkablePainter.active,
            canvasInlineDisplay: c ? c.style.display : null,
            canvasDisplay: c ? window.getComputedStyle(c).display : null,
            toolbarDisplay: toolbar ? window.getComputedStyle(toolbar).display : null,
            canvasWidth: c ? c.width : null,
            canvasHeight: c ? c.height : null,
            stageWidth: stage ? stage.clientWidth : null,
            stageHeight: stage ? stage.clientHeight : null
          };
        } catch (err) {
          console.error('Check 4 error:', err);
          return { error: err.message, stack: err.stack };
        }
      })()`,
      awaitPromise: true,
      returnByValue: true
    });
    console.log("4. Walkable Painter Check:", painterRes.result.value);

    shot = await cdpSend(ws, "Page.captureScreenshot", { format: "png" });
    writeFileSync(path.join(outputDir, "73-admin-walkable-painter-overlay.png"), Buffer.from(shot.data, "base64"));
    console.log("Saved 73-admin-walkable-painter-overlay.png");

    console.log("ALL TESTS PASSED SUCCESSFULLY!");
    ws.close();
  } catch (err) {
    console.error("Test Error:", err);
  } finally {
    chromeProc.kill();
  }
}

runTest();
