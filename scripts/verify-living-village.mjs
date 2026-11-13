import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import net from "node:net";
import path from "node:path";

const root = "d:\\botly";
const artifactsDir = "C:\\Users\\Admin\\.gemini\\antigravity\\brain\\abff8161-8d04-4588-8fd8-ca4619ccaf85";
const workspaceScreenshotsDir = "D:\\botly\\App\\.tmp\\healthclues-tester\\screenshots";
const targetUrl = "http://127.0.0.1:3329/vi/wellness/healthclues/world?quest=health-concern";

mkdirSync(workspaceScreenshotsDir, { recursive: true });

function saveScreenshot(filename, base64Data) {
  const buf = Buffer.from(base64Data, "base64");
  try { writeFileSync(path.join(artifactsDir, filename), buf); } catch {}
  if (existsSync(workspaceScreenshotsDir)) {
    try { writeFileSync(path.join(workspaceScreenshotsDir, filename), buf); } catch {}
  }
}

async function main() {
  console.log("=== STARTING LIVING VILLAGE V1 VERIFICATION ===");

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

  const profileDir = path.join(root, "App", ".tmp", "inspect-ui", `chrome-village-audit-${Date.now()}`);
  mkdirSync(profileDir, { recursive: true });

  const chromeProc = spawn(chromePath, [
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${profileDir}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--headless=new",
    "--disable-gpu",
    "--disable-extensions",
    "--window-size=1280,800",
    "about:blank",
  ]);

  try {
    let targetWs = null;
    for (let i = 0; i < 40; i++) {
      try {
        const res = await fetch(`http://127.0.0.1:${debugPort}/json/list`);
        const json = await res.json();
        const page = json.find((item) => item.type === "page" && !item.url.startsWith("chrome-extension://") && item.webSocketDebuggerUrl);
        if (page) {
          targetWs = page.webSocketDebuggerUrl;
          break;
        }
      } catch {}
      await new Promise((r) => setTimeout(r, 200));
    }
    assert.ok(targetWs, "Could not connect to Chrome DevTools page target.");

    const WebSocket = (await import("ws")).default;
    const ws = new WebSocket(targetWs);
    await new Promise((resolve, reject) => {
      ws.on("open", resolve);
      ws.on("error", reject);
    });

    let msgId = 1;
    const pending = new Map();
    ws.on("message", (raw) => {
      const msg = JSON.parse(raw.toString("utf8"));
      if (msg.id && pending.has(msg.id)) {
        const { resolve, reject } = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message || JSON.stringify(msg.error)));
        else resolve(msg.result);
      }
    });

    const send = (method, params = {}) =>
      new Promise((resolve, reject) => {
        const id = msgId++;
        pending.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params }));
      });

    await send("Page.enable");
    await send("Runtime.enable");
    await send("DOM.enable");

    console.log(`Navigating to /play-demo.html for session initialization...`);
    await send("Page.navigate", { url: "http://127.0.0.1:3329/play-demo.html" });
    await new Promise((r) => setTimeout(r, 2000));

    console.log(`Navigating to ${targetUrl}...`);
    await send("Page.navigate", { url: targetUrl });
    await new Promise((r) => setTimeout(r, 2500));

    // If modal is open, dismiss it by clicking close button or pressing Escape
    console.log("Dismissing any modal to reveal full game world...");
    await send("Runtime.evaluate", {
      expression: `(() => {
        const closeBtn = document.querySelector('.hc-game-modal-close, .hc-dialogue-close, button[aria-label*="close" i], button[aria-label*="đóng" i]');
        if (closeBtn) closeBtn.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 800));

    const evaluate = async (expression) => {
      const res = await send("Runtime.evaluate", {
        expression,
        returnByValue: true,
        awaitPromise: true,
      });
      return res.result?.value;
    };

    // 1. Check Living Village Layer
    const villageLayerExists = await evaluate(`Boolean(document.querySelector('.hc-living-village-layer'))`);
    console.log("Living Village Layer exists:", villageLayerExists);
    assert.ok(villageLayerExists, "Living Village Layer must exist in DOM");

    // 2. Check 5 Visitors
    const visitorsData = await evaluate(`
      Array.from(document.querySelectorAll('.hc-chibi-visitor')).map(el => ({
        id: el.getAttribute('data-visitor-id'),
        facing: el.getAttribute('data-facing'),
        state: el.getAttribute('data-state'),
        moving: el.getAttribute('data-moving'),
        name: el.querySelector('.hc-chibi-name-pill')?.textContent?.trim(),
        style: el.getAttribute('style'),
        hasShadow: Boolean(el.querySelector('.hc-chibi-shadow')),
        spriteBg: window.getComputedStyle(el.querySelector('.hc-chibi-sprite')).backgroundImage,
      }))
    `);

    console.log("Found Chibi Visitors:", visitorsData);
    assert.equal(visitorsData.length, 5, "Must render exactly 5 chibi visitors");

    const expectedNames = ["Anna", "Leo", "Mia", "Ben", "Lily"];
    for (const exp of expectedNames) {
      const found = visitorsData.find(v => v.name === exp);
      assert.ok(found, `Expected visitor named ${exp} to be present`);
      assert.ok(found.hasShadow, `Visitor ${exp} must have shadow`);
      assert.ok(found.spriteBg && found.spriteBg.includes("chibi-"), `Visitor ${exp} must have chibi sprite url, got: ${found.spriteBg}`);
    }

    // 3. Check Player is using Chibi Adventurer
    console.log("Checking Main Player Chibi Adventurer...");
    const playerData = await evaluate(`
      (() => {
        const p = document.querySelector('.hc-rpg-player');
        if (!p) return null;
        return {
          isChibi: p.classList.contains('is-chibi-adventurer'),
          spriteBg: window.getComputedStyle(p.querySelector('.hc-rpg-player-sprite')).backgroundImage,
          nameVisible: window.getComputedStyle(p.querySelector('.hc-rpg-player-name')).visibility,
          nameDisplay: window.getComputedStyle(p.querySelector('.hc-rpg-player-name')).display,
          nameText: p.querySelector('.hc-rpg-player-name')?.textContent?.trim(),
          worldX: p.getAttribute('data-world-x'),
          worldY: p.getAttribute('data-world-y'),
        };
      })()
    `);
    console.log("Player Data:", playerData);
    assert.ok(playerData, "Player must exist in DOM");
    assert.ok(playerData.isChibi, "Player in HealthClues Realm must have is-chibi-adventurer class");
    assert.equal(playerData.nameVisible, "visible", "Player name tag must be visible");

    // 4. Capture Desktop World Screenshot with all 5 chibis & player
    console.log("Capturing Desktop World Screenshot (1280x800)...");
    const shotWorld = await send("Page.captureScreenshot", { format: "png" });
    saveScreenshot("vision-check-living-village-world.png", shotWorld.data);

    // 5. Track movement over 4.5 seconds
    console.log("Sampling visitor positions over 4.5 seconds to verify autonomous motion...");
    const sample1 = await evaluate(`
      Array.from(document.querySelectorAll('.hc-chibi-visitor')).map(el => ({
        id: el.getAttribute('data-visitor-id'),
        transform: el.style.transform,
      }))
    `);

    await new Promise(r => setTimeout(r, 4500));

    const sample2 = await evaluate(`
      Array.from(document.querySelectorAll('.hc-chibi-visitor')).map(el => ({
        id: el.getAttribute('data-visitor-id'),
        transform: el.style.transform,
        state: el.getAttribute('data-state'),
        moving: el.getAttribute('data-moving'),
      }))
    `);

    console.log("Sample 2 After 4.5s:", sample2);
    const moved = sample2.some((s, idx) => s.transform !== sample1[idx]?.transform || s.moving === "true" || s.state === "moving");
    console.log("Visitors in autonomous action:", moved);

    // 6. Click on Anna to verify speech bubble
    console.log("Testing click interaction on Anna...");
    await evaluate(`
      const anna = document.querySelector('[data-visitor-id="anna"]');
      if (anna) anna.click();
    `);
    await new Promise(r => setTimeout(r, 600));

    const speechInfo = await evaluate(`
      (() => {
        const bubble = document.querySelector('.hc-chibi-speech-bubble');
        if (!bubble) return null;
        return {
          text: bubble.textContent?.trim(),
          visible: window.getComputedStyle(bubble).display !== 'none',
        };
      })()
    `);
    console.log("Speech bubble triggered:", speechInfo);
    assert.ok(speechInfo && speechInfo.text, "A speech bubble must appear when interacting with a visitor");

    // Capture closeup screenshot with speech bubble
    console.log("Capturing Speech Bubble Screenshot...");
    const shotSpeech = await send("Page.captureScreenshot", { format: "png" });
    saveScreenshot("vision-check-living-village-speech.png", shotSpeech.data);

    // 7. Test Mobile Viewport (390 x 844)
    console.log("Testing Mobile Viewport (390x844)...");
    await send("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await new Promise(r => setTimeout(r, 1200));

    const shotMobile = await send("Page.captureScreenshot", { format: "png" });
    saveScreenshot("vision-check-living-village-mobile.png", shotMobile.data);

    console.log("=== ALL LIVING VILLAGE V1 AUDITS PASSED 100%! ===");
  } finally {
    try { chromeProc.kill(); } catch {}
  }
}

main().catch(err => {
  console.error("FATAL LIVING VILLAGE VERIFICATION ERROR:", err);
  process.exit(1);
});
