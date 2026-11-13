import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import net from "node:net";
import path from "node:path";

const root = "d:\\botly";
const artifactsDir = "C:\\Users\\Admin\\.gemini\\antigravity\\brain\\abff8161-8d04-4588-8fd8-ca4619ccaf85";

async function main() {
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

  const profileDir = path.join(root, "App", ".tmp", "inspect-ui", `chrome-${Date.now()}`);
  mkdirSync(profileDir, { recursive: true });

  const chromeProc = spawn(chromePath, [
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${profileDir}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--headless=new",
    "--disable-gpu",
    "--window-size=1200,900",
    "about:blank",
  ]);

  try {
    let targetWs = null;
    for (let i = 0; i < 40; i++) {
      try {
        const res = await fetch(`http://127.0.0.1:${debugPort}/json/list`);
        const json = await res.json();
        const page = json.find((item) => item.type === "page" && item.webSocketDebuggerUrl);
        if (page) {
          targetWs = page.webSocketDebuggerUrl;
          break;
        }
      } catch {}
      await new Promise((r) => setTimeout(r, 250));
    }
    assert.ok(targetWs, "Could not connect to Chrome debugging target");

    const ws = new WebSocket(targetWs);
    await new Promise((resolve, reject) => {
      ws.addEventListener("open", resolve, { once: true });
      ws.addEventListener("error", reject, { once: true });
    });

    let msgId = 1;
    const pending = new Map();
    ws.addEventListener("message", (event) => {
      const payload = JSON.parse(event.data);
      if (payload.id && pending.has(payload.id)) {
        const { resolve, reject } = pending.get(payload.id);
        pending.delete(payload.id);
        if (payload.error) reject(new Error(JSON.stringify(payload.error)));
        else resolve(payload.result);
      }
    });

    const send = (method, params = {}) => {
      const id = msgId++;
      return new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params }));
      });
    };

    await send("Page.enable");
    await send("DOM.enable");
    await send("Runtime.enable");

    // 1. TEST PORTRAIT (iPhone 14: 390 x 844)
    console.log("=== TEST 1: iPhone 14 Portrait (390 x 844) ===");
    await send("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await send("Page.navigate", { url: "http://localhost:3000/play" });
    await new Promise((r) => setTimeout(r, 3500));

    // Audit DOM elements in Portrait
    const portraitEval = await send("Runtime.evaluate", {
      expression: `(() => {
        const gameRoot = document.querySelector('.hc-game-root');
        const gameRootRect = gameRoot ? gameRoot.getBoundingClientRect() : null;
        const topbar = document.querySelector('.hc-rpg-topbar');
        const topbarRect = topbar ? topbar.getBoundingClientRect() : null;
        const rewardBtn = document.querySelector('.hc-rpg-next-reward');
        const rewardComputed = rewardBtn ? window.getComputedStyle(rewardBtn) : null;
        const expCapsule = document.querySelector('.hc-rpg-exp-capsule');
        const expCapsuleRect = expCapsule ? expCapsule.getBoundingClientRect() : null;
        const levelTitle = document.querySelector('.hc-rpg-level-title.is-mobile-title') || document.querySelector('.hc-rpg-level-title');
        const bottomDock = document.querySelector('.hc-rpg-bottom-dock');
        const bottomDockRect = bottomDock ? bottomDock.getBoundingClientRect() : null;
        const bottomDockComputed = bottomDock ? window.getComputedStyle(bottomDock) : null;

        return {
          gameRoot: {
            top: gameRootRect?.top,
            height: gameRootRect?.height,
            marginTop: gameRoot ? window.getComputedStyle(gameRoot).marginTop : null,
          },
          topbar: {
            top: topbarRect?.top,
            height: topbarRect?.height,
          },
          rewardBtn: {
            display: rewardComputed?.display,
            visibility: rewardComputed?.visibility,
          },
          expCapsule: {
            width: expCapsuleRect?.width,
            levelText: levelTitle?.innerText || levelTitle?.textContent,
          },
          bottomDock: {
            display: bottomDockComputed?.display,
            top: bottomDockRect?.top,
          }
        };
      })()`,
      returnByValue: true,
    });

    console.log("Portrait Eval Result:", JSON.stringify(portraitEval.result?.value, null, 2));

    const shotPortrait = await send("Page.captureScreenshot", { format: "png" });
    writeFileSync(path.join(artifactsDir, "verify_fix_01_portrait.png"), Buffer.from(shotPortrait.data, "base64"));
    console.log("Saved verify_fix_01_portrait.png");

    // 2. TEST LANDSCAPE (iPhone 14 Landscape: 844 x 390)
    console.log("\n=== TEST 2: iPhone 14 Landscape (844 x 390) ===");
    await send("Emulation.setDeviceMetricsOverride", {
      width: 844,
      height: 390,
      deviceScaleFactor: 2,
      mobile: true,
      screenOrientation: { angle: 90, type: "landscapePrimary" },
    });
    await new Promise((r) => setTimeout(r, 1500));

    // Audit DOM elements in Landscape
    const landscapeEval = await send("Runtime.evaluate", {
      expression: `(() => {
        const gameRoot = document.querySelector('.hc-game-root');
        const gameRootRect = gameRoot ? gameRoot.getBoundingClientRect() : null;
        const topbar = document.querySelector('.hc-rpg-topbar');
        const topbarRect = topbar ? topbar.getBoundingClientRect() : null;
        const bottomDock = document.querySelector('.hc-rpg-bottom-dock');
        const bottomDockComputed = bottomDock ? window.getComputedStyle(bottomDock) : null;
        const stage = document.querySelector('.hc-rpg-stage') || document.querySelector('[data-hc-game-canvas]');
        const stageRect = stage ? stage.getBoundingClientRect() : null;

        return {
          gameRoot: {
            top: gameRootRect?.top,
            height: gameRootRect?.height,
            marginTop: gameRoot ? window.getComputedStyle(gameRoot).marginTop : null,
          },
          topbar: {
            top: topbarRect?.top,
            height: topbarRect?.height,
          },
          bottomDock: {
            display: bottomDockComputed?.display,
          },
          stage: {
            width: stageRect?.width,
            height: stageRect?.height,
            top: stageRect?.top,
          }
        };
      })()`,
      returnByValue: true,
    });

    console.log("Landscape Eval Result:", JSON.stringify(landscapeEval.result?.value, null, 2));

    const shotLandscape = await send("Page.captureScreenshot", { format: "png" });
    writeFileSync(path.join(artifactsDir, "verify_fix_02_landscape.png"), Buffer.from(shotLandscape.data, "base64"));
    console.log("Saved verify_fix_02_landscape.png");

    // 3. TEST CHALET HOME IN LANDSCAPE
    console.log("\n=== TEST 3: Chalet Home in Landscape (844 x 390) ===");
    await send("Runtime.evaluate", {
      expression: `(() => {
        const homeBtn = document.querySelector('[data-testid=\"hud-dock-home-btn\"]') || document.querySelector('.hc-rpg-brand') || document.querySelector('button[title*=\"Chalet\"]') || document.querySelector('.hc-rpg-topbar button');
        // Let's click the Home button via window router or click
        const btns = Array.from(document.querySelectorAll('button'));
        const chaletBtn = btns.find(b => b.textContent.includes('Nhà Của Tôi') || b.textContent.includes('Home') || b.title?.includes('Chalet'));
        if (chaletBtn) chaletBtn.click();
      })()`
    });
    await new Promise((r) => setTimeout(r, 2000));

    const shotChalet = await send("Page.captureScreenshot", { format: "png" });
    writeFileSync(path.join(artifactsDir, "verify_fix_03_chalet_landscape.png"), Buffer.from(shotChalet.data, "base64"));
    console.log("Saved verify_fix_03_chalet_landscape.png");

    // Close ws & chrome
    ws.close();
    chromeProc.kill();
    console.log("Verification finished successfully!");
  } catch (err) {
    console.error("Verification failed:", err);
    chromeProc.kill();
  }
}

main();
