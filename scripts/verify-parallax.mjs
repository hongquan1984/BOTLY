import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const BASE_URL = "http://localhost:3000";
const ARTIFACTS_DIR = "C:\\Users\\Admin\\.gemini\\antigravity\\brain\\abff8161-8d04-4588-8fd8-ca4619ccaf85\\parallax-verified";
fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });

async function cdpRequest(ws, id, method, params = {}) {
  return new Promise((resolve, reject) => {
    const msg = JSON.stringify({ id, method, params });
    const onMessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.id === id) {
        ws.removeEventListener("message", onMessage);
        if (data.error) reject(new Error(data.error.message || JSON.stringify(data.error)));
        else resolve(data.result);
      }
    };
    ws.addEventListener("message", onMessage);
    ws.send(msg);
  });
}

async function evalInPage(ws, msgId, expression) {
  const res = await cdpRequest(ws, msgId.id++, "Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  return res.result?.value;
}

async function captureScreenshot(ws, msgId, filePath) {
  const shot = await cdpRequest(ws, msgId.id++, "Page.captureScreenshot", {
    format: "png",
    fromSurface: true,
  });
  fs.writeFileSync(filePath, Buffer.from(shot.data, "base64"));
  console.log(`[CDP] Saved screenshot: ${path.basename(filePath)}`);
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function run() {
  console.log("=== STEP 1: Launch Headless Chrome for CDP Testing ===");
  const chromePath = [
    path.join(process.env.PROGRAMFILES || "C:\\Program Files", "Google", "Chrome", "Application", "chrome.exe"),
    path.join(process.env["PROGRAMFILES(X86)"] || "C:\\Program Files (x86)", "Google", "Chrome", "Application", "chrome.exe"),
  ].find(fs.existsSync);

  if (!chromePath) throw new Error("Chrome not found");

  const cdpPort = 9226;
  const userDataDir = path.join(process.env.TEMP || "C:\\temp", "chrome-cdp-parallax-profile-v2");
  const chromeProc = spawn(
    chromePath,
    [
      `--remote-debugging-port=${cdpPort}`,
      `--user-data-dir=${userDataDir}`,
      "--no-first-run",
      "--no-default-browser-check",
      "--headless=new",
      "--window-size=1440,900",
      "about:blank",
    ],
    { detached: true }
  );

  const cleanup = () => {
    try {
      chromeProc.kill();
    } catch {}
  };
  process.on("exit", cleanup);

  await sleep(1500);

  const pagesRes = await fetch(`http://127.0.0.1:${cdpPort}/json`);
  const pages = await pagesRes.json();
  const wsUrl = pages[0]?.webSocketDebuggerUrl;
  assert.ok(wsUrl, "WebSocket URL must exist");

  const ws = new WebSocket(wsUrl);
  await new Promise((resolve) => ws.addEventListener("open", resolve, { once: true }));
  const msgId = { id: 1 };

  await cdpRequest(ws, msgId.id++, "Page.enable");
  await cdpRequest(ws, msgId.id++, "Runtime.enable");

  // Disable reduced-motion emulation initially so full motion is active
  await cdpRequest(ws, msgId.id++, "Emulation.setEmulatedMedia", {
    media: "screen",
    features: [{ name: "prefers-reduced-motion", value: "no-preference" }],
  });

  try {
    console.log("=== STEP 2: Seed session via play-demo.html and open Home ===");
    await cdpRequest(ws, msgId.id++, "Page.navigate", { url: `${BASE_URL}/play-demo.html` });

    // Wait until redirected to /world
    for (let i = 0; i < 20; i++) {
      await sleep(300);
      const curUrl = await evalInPage(ws, msgId, "window.location.href");
      if (curUrl && curUrl.includes("/world")) break;
    }
    await sleep(1500);

    // Pre-seed full unlocked furniture in localStorage before entering chalet
    await evalInPage(ws, msgId, `
      (() => {
        const allFurniture = [
          "sofa_luxury", "piano_grand", "painting_fireplace", "plant_pot_alps", "table_coffee",
          "luxury_chalet_bed", "bedside_armchair", "painting_bedroom", "bedside_lamp", "bedroom_rug"
        ];
        localStorage.setItem("healthclues_chalet_unlocked_items", JSON.stringify(allFurniture));
        localStorage.setItem("healthclues_chalet_welcome_claimed", "true");
        localStorage.setItem("hc_parallax_enabled_v1", "true");
        localStorage.setItem("hc_parallax_strength_v1", "strong");
        for (let k of Object.keys(localStorage)) {
          if (k.includes("chalet_state")) {
            try {
              const obj = JSON.parse(localStorage.getItem(k));
              obj.unlockedItems = allFurniture;
              obj.hasClaimedWelcome = true;
              localStorage.setItem(k, JSON.stringify(obj));
            } catch {}
          }
        }
      })()
    `);

    // Dismiss any dialogue/guide in world
    await evalInPage(ws, msgId, `
      (() => {
        const skipBtn = Array.from(document.querySelectorAll("button")).find(b => 
          b.textContent.includes("Bỏ qua") || b.textContent.includes("Skip") || b.textContent.includes("Tự do")
        );
        if (skipBtn) skipBtn.click();
        const closeLumi = document.querySelector(".hc-rpg-lumi-close-btn") || document.querySelector(".hc-rpg-talk-close-btn");
        if (closeLumi) closeLumi.click();
      })()
    `);
    await sleep(800);

    // Navigate directly to Home with panel=home and parallax=true
    console.log("Navigating directly to Home with panel=home&parallax=true...");
    await cdpRequest(ws, msgId.id++, "Page.navigate", { url: `${BASE_URL}/vi/wellness/healthclues/world?panel=home&parallax=true` });
    await sleep(3500);

    const stageFound = await evalInPage(ws, msgId, "Boolean(document.querySelector('[data-testid=\"wellness-home-stage\"]'))");
    console.log("Stage mounted:", stageFound);
    assert.ok(stageFound, "Wellness Home Stage must be mounted");

    // Close any welcome popup if open
    await evalInPage(ws, msgId, `
      (() => {
        const claimBtn = document.querySelector('[data-testid="claim-welcome-btn"]');
        if (claimBtn) claimBtn.click();
        const closeBtn = document.querySelector('[data-testid="close-reward-modal-btn"]') ||
                         document.querySelector('button[aria-label="Close"], .hc-modal-close-btn');
        if (closeBtn) closeBtn.click();
      })()
    `);
    await sleep(1000);

    // Diagnostic check after dismiss
    const diag = await evalInPage(ws, msgId, `
      (() => {
        const stage = document.querySelector('[data-testid="wellness-home-stage"]');
        const items = Array.from(document.querySelectorAll('.hc-stage-item-wrapper')).map(el => el.getAttribute('data-testid'));
        return {
          prefersReducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
          itemsCount: items.length,
          items,
        };
      })()
    `);
    console.log("Stage Diagnostic:", diag);

    // Screenshot 1: Baseline Home with Furniture
    await captureScreenshot(ws, msgId, path.join(ARTIFACTS_DIR, "01_home_baseline.png"));

    // Check Parallax Dev Controller is present
    const devPillFound = await evalInPage(ws, msgId, "Boolean(document.querySelector('[data-testid=\"parallax-dev-toggle-pill\"]'))");
    console.log("Parallax Dev Pill found:", devPillFound);
    assert.ok(devPillFound, "Dev control pill must be present");

    // Click Dev Pill to open controls
    await evalInPage(ws, msgId, "document.querySelector('[data-testid=\"parallax-dev-toggle-pill\"]').click()");
    await sleep(600);

    // Verify Dev Panel expanded
    const devPanelOpen = await evalInPage(ws, msgId, "Boolean(document.querySelector('[data-testid=\"parallax-dev-panel\"]'))");
    console.log("Parallax Dev Panel opened:", devPanelOpen);
    assert.ok(devPanelOpen, "Dev panel must expand on click");

    // Check Master Toggle and ensure it is ON
    const toggleStatus = await evalInPage(ws, msgId, `
      (() => {
        const btn = document.querySelector('[data-testid="parallax-master-toggle"]');
        if (!btn) return "not_found";
        if (btn.textContent.includes("TẮT") || btn.textContent.includes("OFF")) {
          btn.click();
          return "toggled_on";
        }
        return "already_on";
      })()
    `);
    console.log("Master toggle status:", toggleStatus);

    // Set Strength to "Mạnh Mẽ" (strong) for prominent verification
    await evalInPage(ws, msgId, `
      (() => {
        const strongBtn = document.querySelector('[data-testid="parallax-strength-strong"]');
        if (strongBtn) strongBtn.click();
      })()
    `);
    await sleep(600);

    await captureScreenshot(ws, msgId, path.join(ARTIFACTS_DIR, "02_parallax_controls_active.png"));

    console.log("=== STEP 3: Simulate Drag Gesture on Empty Stage Area ===");
    // Dispatch native pointer events on stage
    await evalInPage(ws, msgId, `
      (() => {
        const stage = document.querySelector('[data-testid="wellness-home-stage"]');
        if (!stage) return;
        const rect = stage.getBoundingClientRect();
        const startX = rect.left + rect.width * 0.5;
        const startY = rect.top + rect.height * 0.5;

        stage.dispatchEvent(new PointerEvent("pointerdown", {
          bubbles: true, cancelable: true,
          clientX: startX, clientY: startY, button: 0, buttons: 1, pointerType: "mouse"
        }));

        for (let i = 1; i <= 10; i++) {
          stage.dispatchEvent(new PointerEvent("pointermove", {
            bubbles: true, cancelable: true,
            clientX: startX + i * 20, clientY: startY + i * 10, button: 0, buttons: 1, pointerType: "mouse"
          }));
        }

        stage.dispatchEvent(new PointerEvent("pointerup", {
          bubbles: true, cancelable: true,
          clientX: startX + 200, clientY: startY + 100, button: 0, buttons: 0, pointerType: "mouse"
        }));
      })()
    `);
    await sleep(600); // Allow RAF dampening to settle

    // Inspect viewpoint and transforms
    const parallaxStateRight = await evalInPage(ws, msgId, `
      (() => {
        const bgLayer = document.querySelector('.hc-stage-bg-layer');
        const sofa = document.querySelector('[data-testid="stage-item-sofa_luxury"]');
        const wallPainting = document.querySelector('[data-testid="stage-item-painting_fireplace"]');
        const coordsBadge = document.querySelector('[data-testid="parallax-view-coords"]') ||
                            Array.from(document.querySelectorAll('.hc-parallax-dev-panel span')).find(s => s.textContent.includes('X:'));
        return {
          coordsText: coordsBadge ? coordsBadge.textContent : null,
          bgTransform: bgLayer ? bgLayer.style.transform : null,
          sofaTransform: sofa ? sofa.style.transform : null,
          wallPaintingTransform: wallPainting ? wallPainting.style.transform : null,
        };
      })()
    `);
    console.log("Parallax State after Drag Right:", parallaxStateRight);
    assert.ok(parallaxStateRight.bgTransform?.includes("translate3d"), "Background must have translate3d applied");

    await captureScreenshot(ws, msgId, path.join(ARTIFACTS_DIR, "03_parallax_dragged_right.png"));

    console.log("=== STEP 4: Test Reset Viewpoint ===");
    await evalInPage(ws, msgId, `
      (() => {
        const resetBtn = document.querySelector('[data-testid="parallax-reset-btn"]');
        if (resetBtn) resetBtn.click();
      })()
    `);
    await sleep(600);

    const resetState = await evalInPage(ws, msgId, `
      (() => {
        const bgLayer = document.querySelector('.hc-stage-bg-layer');
        const coordsBadge = document.querySelector('[data-testid="parallax-view-coords"]') ||
                            Array.from(document.querySelectorAll('.hc-parallax-dev-panel span')).find(s => s.textContent.includes('X:'));
        return {
          coordsText: coordsBadge ? coordsBadge.textContent : null,
          bgTransform: bgLayer ? bgLayer.style.transform : null,
        };
      })()
    `);
    console.log("State after Reset:", resetState);
    assert.ok(
      resetState.bgTransform?.includes("translate3d(0px, 0px, 0px)") ||
      resetState.coordsText?.includes("0.00"),
      "Viewpoint must return to center"
    );
    await captureScreenshot(ws, msgId, path.join(ARTIFACTS_DIR, "04_parallax_reset_center.png"));

    console.log("=== STEP 5: Test Room Switch to Bedroom ===");
    // Click Bedroom tab
    await evalInPage(ws, msgId, `
      (() => {
        const bedTab = document.querySelector('[data-testid="tab-bedroom"]');
        if (bedTab) bedTab.click();
      })()
    `);
    await sleep(1500);

    // Drag in bedroom via PointerEvent
    await evalInPage(ws, msgId, `
      (() => {
        const stage = document.querySelector('[data-testid="wellness-home-stage"]');
        if (!stage) return;
        const rect = stage.getBoundingClientRect();
        const startX = rect.left + rect.width * 0.5;
        const startY = rect.top + rect.height * 0.5;

        stage.dispatchEvent(new PointerEvent("pointerdown", {
          bubbles: true, cancelable: true,
          clientX: startX, clientY: startY, button: 0, buttons: 1, pointerType: "mouse"
        }));

        for (let i = 1; i <= 8; i++) {
          stage.dispatchEvent(new PointerEvent("pointermove", {
            bubbles: true, cancelable: true,
            clientX: startX - i * 20, clientY: startY - i * 8, button: 0, buttons: 1, pointerType: "mouse"
          }));
        }

        stage.dispatchEvent(new PointerEvent("pointerup", {
          bubbles: true, cancelable: true,
          clientX: startX - 160, clientY: startY - 64, button: 0, buttons: 0, pointerType: "mouse"
        }));
      })()
    `);
    await sleep(600);

    const bedroomParallax = await evalInPage(ws, msgId, `
      (() => {
        const bgLayer = document.querySelector('.hc-stage-bg-layer');
        return {
          bgTransform: bgLayer ? bgLayer.style.transform : null,
          bgImage: bgLayer ? bgLayer.style.backgroundImage : null,
        };
      })()
    `);
    console.log("Bedroom Parallax State:", bedroomParallax);
    assert.ok(bedroomParallax.bgImage?.includes("scene_bedroom"), "Background must be scene_bedroom");
    assert.ok(bedroomParallax.bgTransform?.includes("translate3d"), "Bedroom background must have translate3d");

    await captureScreenshot(ws, msgId, path.join(ARTIFACTS_DIR, "05_bedroom_parallax_dragged.png"));

    console.log("=== STEP 6: Test prefers-reduced-motion Suppression ===");
    await cdpRequest(ws, msgId.id++, "Emulation.setEmulatedMedia", {
      media: "screen",
      features: [{ name: "prefers-reduced-motion", value: "reduce" }],
    });
    await sleep(600);

    // Toggle override button so it strictly adheres to OS
    await evalInPage(ws, msgId, `
      (() => {
        const overrideBtn = document.querySelector('[data-testid="parallax-toggle-override-motion"]');
        if (overrideBtn && overrideBtn.textContent.includes("ĐANG BẬT TEST")) {
          overrideBtn.click();
        }
      })()
    `);
    await sleep(600);

    const reducedMotionState = await evalInPage(ws, msgId, `
      (() => {
        const stage = document.querySelector('[data-testid="wellness-home-stage"]');
        const bgLayer = document.querySelector('.hc-stage-bg-layer');
        return {
          stageClasses: stage ? stage.className : null,
          bgTransform: bgLayer ? bgLayer.style.transform : null,
          hasNotice: Boolean(document.querySelector('.text-amber-200')),
        };
      })()
    `);
    console.log("Reduced Motion State:", reducedMotionState);
    assert.ok(!reducedMotionState.stageClasses?.includes("is-parallax-active"), "Parallax class must be inactive when reduced motion is preferred");
    assert.ok(reducedMotionState.hasNotice, "Reduced motion safety banner must be displayed");

    await captureScreenshot(ws, msgId, path.join(ARTIFACTS_DIR, "06_reduced_motion_suppressed.png"));

    console.log("=== ALL BROWSER 2.5D PARALLAX CHECKS PASSED ===");
  } finally {
    ws.close();
    cleanup();
  }
}

run().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
