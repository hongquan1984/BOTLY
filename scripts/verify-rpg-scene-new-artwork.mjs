import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import net from "node:net";
import path from "node:path";

const root = "d:\\botly";
const artifactsDir = "C:\\Users\\Admin\\.gemini\\antigravity\\brain\\bf806726-5fdf-45f1-b574-a2b65a5fbf0f";

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
  writeFileSync(filePath, Buffer.from(shot.data, "base64"));
  console.log(`[CDP] Saved screenshot: ${filePath}`);
}

async function main() {
  console.log("=== STARTING RPG NEW BACKGROUND & NAVIGATION VERIFICATION ===");

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

  const profileDir = path.join(root, "App", ".tmp", "inspect-ui", `chrome-new-scene-${Date.now()}`);
  mkdirSync(profileDir, { recursive: true });

  const chromeProc = spawn(chromePath, [
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${profileDir}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--headless=new",
    "--disable-gpu",
    "--window-size=1280,720",
    "about:blank",
  ]);

  let ws;
  let msgId = { id: 1 };

  try {
    let targets = null;
    for (let i = 0; i < 40; i++) {
      try {
        const res = await fetch(`http://127.0.0.1:${debugPort}/json`);
        if (res.ok) {
          targets = await res.json();
          break;
        }
      } catch {}
      await new Promise((r) => setTimeout(r, 200));
    }
    assert.ok(targets && targets.length, "No targets returned from Chrome CDP");

    const pageTarget = targets.find((t) => t.type === "page") || targets[0];
    const WebSocket = globalThis.WebSocket;
    ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      ws.addEventListener("open", resolve, { once: true });
      ws.addEventListener("error", reject, { once: true });
    });

    await cdpRequest(ws, msgId.id++, "Page.enable");
    await cdpRequest(ws, msgId.id++, "Runtime.enable");
    await cdpRequest(ws, msgId.id++, "Emulation.setDeviceMetricsOverride", {
      width: 1280,
      height: 720,
      deviceScaleFactor: 1,
      mobile: false,
    });

    // 1. Navigate to /play
    console.log("1. Navigating to /play...");
    await cdpRequest(ws, msgId.id++, "Page.navigate", {
      url: "http://127.0.0.1:3329/play?navDebug=1",
    });

    // Check if we are on quiz or world
    let onWorld = false;
    for (let i = 0; i < 40; i++) {
      await new Promise((r) => setTimeout(r, 300));
      const res = await evalInPage(
        ws,
        msgId,
        `Boolean(document.querySelector('[data-region-map]') || document.querySelector('[data-healthclues-two-question-quiz]') || document.querySelector('[data-wellness-plan-builder]'))`
      );
      if (res) {
        onWorld = await evalInPage(ws, msgId, `Boolean(document.querySelector('[data-region-map]'))`);
        break;
      }
    }

    console.log("Initial state onWorld:", onWorld);

    // If on quiz or plan builder, complete it to get to the World
    if (!onWorld) {
      console.log("Completing initial discovery to reach the World scene...");
      // Check for Quiz Question 1
      const isQuiz = await evalInPage(ws, msgId, `Boolean(document.querySelector('[data-healthclues-two-question-quiz]'))`);
      if (isQuiz) {
        // Step 1: Select concern & continue
        await evalInPage(ws, msgId, `(() => {
          const btns = Array.from(document.querySelectorAll('button[aria-pressed]'));
          if (btns[0]) btns[0].click();
          const continueBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Tiếp tục') || b.textContent.includes('Continue'));
          if (continueBtn) continueBtn.click();
        })()`);
        await new Promise((r) => setTimeout(r, 600));

        // Step 2: Select sub-goal, age confirm & continue
        await evalInPage(ws, msgId, `(() => {
          const subBtns = Array.from(document.querySelectorAll('button[aria-pressed]'));
          if (subBtns[0]) subBtns[0].click();
          const ageBox = document.querySelector('input[type="checkbox"]');
          if (ageBox && !ageBox.checked) ageBox.click();
          const continueBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Kích hoạt') || b.textContent.includes('tiếp tục') || b.textContent.includes('Continue'));
          if (continueBtn) continueBtn.click();
        })()`);
        await new Promise((r) => setTimeout(r, 1200));
      }

      // Check for Plan Builder -> Skip or Continue
      for (let i = 0; i < 30; i++) {
        await new Promise((r) => setTimeout(r, 500));
        const hasPlanOrWorld = await evalInPage(ws, msgId, `Boolean(document.querySelector('[data-region-map]') || document.querySelector('[data-wellness-plan-builder]'))`);
        if (hasPlanOrWorld) break;
      }

      const isPlan = await evalInPage(ws, msgId, `Boolean(document.querySelector('[data-wellness-plan-builder]'))`);
      if (isPlan) {
        console.log("On Plan Builder, proceeding to World Preview...");
        await evalInPage(ws, msgId, `(() => {
          const cta = Array.from(document.querySelectorAll('button')).find(b => 
            b.textContent.includes('Vào khám phá Thế Giới') || 
            b.textContent.includes('Khám phá Thế Giới') || 
            b.textContent.includes('Explore') ||
            b.textContent.includes('Skip') ||
            b.textContent.includes('Bỏ qua')
          );
          if (cta) cta.click();
        })()`);
        await new Promise((r) => setTimeout(r, 1500));
      }

      // Check for World Preview (with START YOUR JOURNEY)
      for (let i = 0; i < 20; i++) {
        await new Promise((r) => setTimeout(r, 500));
        const hasStart = await evalInPage(ws, msgId, `(() => {
          const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('BẮT ĐẦU') || b.textContent.includes('START YOUR JOURNEY'));
          if (btn) { btn.click(); return true; }
          return Boolean(document.querySelector('[data-region-map]'));
        })()`);
        if (hasStart) break;
      }
    }

    // Wait for data-region-map
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 400));
      const found = await evalInPage(ws, msgId, `Boolean(document.querySelector('[data-region-map]'))`);
      if (found) {
        onWorld = true;
        break;
      }
    }
    assert.ok(onWorld, "Failed to load RPG World Scene ([data-region-map])");
    console.log("✓ RPG World Scene loaded successfully!");

    await new Promise((r) => setTimeout(r, 1000));

    // 2. Inspect scene assets, background image & characters
    const sceneData = await evalInPage(
      ws,
      msgId,
      `(() => {
        const scene = document.querySelector('[data-region-map]');
        const bg = document.querySelector('.hc-rpg-background');
        const player = document.querySelector('[data-player-actor]');
        const pet = document.querySelector('[data-pet-follow]');
        const npcs = Array.from(document.querySelectorAll('[data-npc]')).map(n => ({
          npc: n.dataset.npc,
          landmark: n.closest('[data-landmark-id]')?.dataset.landmarkId,
          x: n.closest('[data-landmark-id]')?.offsetLeft,
          y: n.closest('[data-landmark-id]')?.offsetTop,
        }));
        const pills = Array.from(document.querySelectorAll('.hc-rpg-location-pill')).map(p => ({
          text: p.innerText.replace(/\\n/g, ' '),
          landmark: p.closest('[data-landmark-id]')?.dataset.landmarkId,
          x: p.closest('[data-landmark-id]')?.offsetLeft,
          y: p.closest('[data-landmark-id]')?.offsetTop,
        }));

        return {
          bgSrc: bg?.currentSrc || bg?.src,
          bgLoaded: bg?.complete && bg?.naturalWidth > 0,
          bgDimensions: { naturalWidth: bg?.naturalWidth, naturalHeight: bg?.naturalHeight },
          player: {
            x: Number(player?.dataset.worldX),
            y: Number(player?.dataset.worldY),
            facing: player?.dataset.facing,
          },
          pet: {
            follow: pet?.dataset.petFollow,
            x: Number(pet?.dataset.worldX),
            y: Number(pet?.dataset.worldY),
          },
          npcs,
          pills,
        };
      })()`
    );

    console.log("\n=== SCENE INSPECTION DATA ===");
    console.log("Background image:", sceneData.bgSrc);
    console.log("Background loaded:", sceneData.bgLoaded, sceneData.bgDimensions);
    console.log("Player position:", sceneData.player);
    console.log("Pet companion:", sceneData.pet);
    console.log("NPCs count:", sceneData.npcs.length, sceneData.npcs);
    console.log("Landmark pills:", sceneData.pills);

    assert.ok(sceneData.bgLoaded, "Background image should be loaded with naturalWidth > 0");
    assert.ok(sceneData.bgSrc.includes("healthclues-realm-scene-blueprint.webp") || sceneData.bgSrc.includes("sleep-valley-scene-blueprint.webp"), "Background image source matches blueprint asset");
    assert.ok(Number.isFinite(sceneData.player.x) && Number.isFinite(sceneData.player.y), "Player has valid coordinates");

    // Take screenshot 1: Initial scene overview with new background
    const shotOverview = path.join(artifactsDir, "rpg-new-scene-overview.png");
    await captureScreenshot(ws, msgId, shotOverview);

    // 3. Test walking to Botanist (Food & Botanical Garden)
    console.log("\n3. Testing player walking to Botanist...");
    const walkedToBotanist = await evalInPage(
      ws,
      msgId,
      `(() => {
        const botanistPill = Array.from(document.querySelectorAll('.hc-rpg-location-pill')).find(p => 
          p.textContent.includes('Botanist') || p.textContent.includes('Thảo Mộc')
        );
        if (botanistPill) {
          botanistPill.click();
          return true;
        }
        return false;
      })()`
    );
    assert.ok(walkedToBotanist, "Botanist pill must exist and be clickable");

    // Monitor walking animation
    let arrivedAtBotanist = false;
    for (let i = 0; i < 40; i++) {
      await new Promise((r) => setTimeout(r, 200));
      const status = await evalInPage(
        ws,
        msgId,
        `(() => {
          const player = document.querySelector('[data-player-actor]');
          const talk = document.querySelector('.hc-rpg-talk');
          const isWalking = player?.dataset.walking === 'true';
          const currentX = Number(player?.dataset.worldX);
          const currentY = Number(player?.dataset.worldY);
          return { isWalking, currentX, currentY, talkVisible: Boolean(talk), talkText: talk?.innerText };
        })()`
      );
      if (status.talkVisible) {
        arrivedAtBotanist = true;
        console.log(`Arrived at Botanist at (${status.currentX}, ${status.currentY})! Talk dialog:`, status.talkText);
        break;
      }
    }

    assert.ok(arrivedAtBotanist, "Player should safely navigate along stone path to Botanist approach and trigger Talk dialog");

    // Take screenshot 2: Player arrived at Botanist
    const shotBotanist = path.join(artifactsDir, "rpg-player-at-botanist.png");
    await captureScreenshot(ws, msgId, shotBotanist);

    // Click Talk with Botanist to verify interaction
    console.log("\n4. Clicking Talk with Botanist...");
    await evalInPage(ws, msgId, `(() => {
      const talkBtn = document.querySelector('.hc-rpg-talk button');
      if (talkBtn) talkBtn.click();
    })()`);

    await new Promise((r) => setTimeout(r, 1000));
    const shotBotanistModal = path.join(artifactsDir, "rpg-botanist-modal-open.png");
    await captureScreenshot(ws, msgId, shotBotanistModal);

    // Close the modal
    await evalInPage(ws, msgId, `(() => {
      const closeBtn = document.querySelector('.hc-rpg-modal-close, button[aria-label*="Đóng"], button[aria-label*="Close"], .hc-dialogue-close');
      if (closeBtn) closeBtn.click();
    })()`);
    await new Promise((r) => setTimeout(r, 600));

    // 5. Test walking to Knowledge Library
    console.log("\n5. Testing player walking to Knowledge Library...");
    const walkedToLibrary = await evalInPage(
      ws,
      msgId,
      `(() => {
        const libPill = Array.from(document.querySelectorAll('.hc-rpg-location-pill')).find(p => 
          p.textContent.includes('Knowledge') || p.textContent.includes('Kho Tri Thức')
        );
        if (libPill) {
          libPill.click();
          return true;
        }
        return false;
      })()`
    );
    assert.ok(walkedToLibrary, "Knowledge Library pill must exist and be clickable");

    let arrivedAtLibrary = false;
    for (let i = 0; i < 40; i++) {
      await new Promise((r) => setTimeout(r, 200));
      const status = await evalInPage(
        ws,
        msgId,
        `(() => {
          const player = document.querySelector('[data-player-actor]');
          const talk = document.querySelector('.hc-rpg-talk');
          return { currentX: Number(player?.dataset.worldX), currentY: Number(player?.dataset.worldY), arrived: Boolean(talk), talkText: talk?.innerText };
        })()`
      );
      if (status.arrived) {
        arrivedAtLibrary = true;
        console.log(`Arrived at Knowledge Library at (${status.currentX}, ${status.currentY})! Talk dialog:`, status.talkText);
        break;
      }
    }
    assert.ok(arrivedAtLibrary, "Player should safely navigate along stone path to Knowledge Library");

    // Take screenshot 3: Player arrived at Knowledge Library
    const shotLibrary = path.join(artifactsDir, "rpg-player-at-library.png");
    await captureScreenshot(ws, msgId, shotLibrary);

    // 6. Test walking to Wellness Guide (Lotus Pavilion)
    console.log("\n6. Testing player walking to Wellness Guide...");
    const walkedToSanctuary = await evalInPage(
      ws,
      msgId,
      `(() => {
        const guidePill = Array.from(document.querySelectorAll('.hc-rpg-location-pill')).find(p => 
          p.textContent.includes('Wellness') || p.textContent.includes('Cẩm Nang Sống Khỏe')
        );
        if (guidePill) {
          guidePill.click();
          return true;
        }
        return false;
      })()`
    );
    assert.ok(walkedToSanctuary, "Wellness Guide pill must exist and be clickable");

    let arrivedAtSanctuary = false;
    for (let i = 0; i < 40; i++) {
      await new Promise((r) => setTimeout(r, 250));
      const status = await evalInPage(
        ws,
        msgId,
        `(() => {
          const player = document.querySelector('[data-player-actor]');
          const talk = document.querySelector('.hc-rpg-talk');
          return { currentX: Number(player?.dataset.worldX), currentY: Number(player?.dataset.worldY), arrived: Boolean(talk), talkText: talk?.innerText };
        })()`
      );
      if (status.arrived) {
        arrivedAtSanctuary = true;
        console.log(`Arrived at Wellness Guide at (${status.currentX}, ${status.currentY})! Talk dialog:`, status.talkText);
        break;
      }
    }
    assert.ok(arrivedAtSanctuary, "Player should safely navigate along stone path to Wellness Guide");

    // Take screenshot 4: Player arrived at Wellness Guide
    const shotSanctuary = path.join(artifactsDir, "rpg-player-at-wellness-guide.png");
    await captureScreenshot(ws, msgId, shotSanctuary);

    console.log("\n=== ALL RPG BACKGROUND & NAVIGATION TESTS PASSED SUCCESSFULLY! ===");
  } finally {
    if (ws) ws.close();
    chromeProc.kill();
  }
}

main().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
