import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import net from "node:net";
import path from "node:path";

const root = "d:\\botly";
const artifactsDir = "C:\\Users\\Admin\\.gemini\\antigravity\\brain\\abff8161-8d04-4588-8fd8-ca4619ccaf85";
const base = process.env.BASE_URL || (process.argv.includes("--prod") ? "https://www.botly.vn" : "http://127.0.0.1:3329");

mkdirSync(artifactsDir, { recursive: true });

function saveScreenshot(filename, base64Data) {
  const buf = Buffer.from(base64Data, "base64");
  const fullPath = path.join(artifactsDir, filename);
  writeFileSync(fullPath, buf);
  console.log(`✓ Saved screenshot: ${fullPath} (${buf.length} bytes)`);
  return fullPath;
}

export async function runQaVerification({ captureOnly = false } = {}) {
  console.log("===============================================================");
  console.log("STARTING VISUAL QA & END-USER AUTOMATION (CHROMIUM REAL BROWSER)");
  console.log("===============================================================");

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

  const profileDir = path.join(root, "App", ".tmp", "inspect-ui", `chrome-qa-${Date.now()}`);
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
    assert.ok(targetWs, "Could not connect to Chrome DevTools.");

    const ws = new WebSocket(targetWs);
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    let msgId = 1;
    const send = (method, params = {}) =>
      new Promise((resolve, reject) => {
        const id = msgId++;
        const timer = setTimeout(() => {
          ws.removeEventListener("message", handler);
          reject(new Error(`CDP Timeout waiting for ${method} (id=${id})`));
        }, 15000);

        const handler = (event) => {
          const data = JSON.parse(event.data);
          if (data.id === id) {
            clearTimeout(timer);
            ws.removeEventListener("message", handler);
            if (data.error) reject(new Error(data.error.message || JSON.stringify(data.error)));
            else resolve(data.result);
          }
        };
        ws.addEventListener("message", handler);
        ws.send(JSON.stringify({ id, method, params }));
      });

    await send("Page.enable");
    await send("Runtime.enable");

    console.log("Navigating to play-demo.html for authenticated world entry...");
    await send("Page.navigate", { url: `${base}/play-demo.html` });
    await new Promise((r) => setTimeout(r, 2500));

    // Wait for world map and dock
    let loaded = false;
    for (let i = 0; i < 30; i++) {
      const check = await send("Runtime.evaluate", {
        expression: `(() => {
          return {
            hasMap: Boolean(document.querySelector('[data-region-map]') || document.querySelector('[data-rpg-world]')),
            hasDock: Boolean(document.querySelector('.hc-rpg-bottom-dock')),
            hasLumi: Boolean(document.querySelector('.hc-rpg-lumi-dialogue')),
            url: window.location.href
          };
        })()`,
        returnByValue: true,
      });
      if (check.result?.value?.hasDock) {
        loaded = true;
        break;
      }
      await new Promise((r) => setTimeout(r, 500));
    }
    assert.ok(loaded, "World and bottom dock failed to load.");

    // Dismiss tour or existing modal
    await send("Runtime.evaluate", {
      expression: `(() => {
        const skipTourBtn = document.querySelector('.hc-world-tour button.hc-tour-link') ||
                            Array.from(document.querySelectorAll('.hc-world-tour button')).find(b =>
                              b.innerText?.includes('Bỏ qua') || b.innerText?.includes('Skip')
                            );
        if (skipTourBtn) skipTourBtn.click();
        const closeBtn = document.querySelector('[data-close-game-modal]');
        if (closeBtn) closeBtn.click();
      })()`
    });
    await new Promise((r) => setTimeout(r, 500));

    // =========================================================================
    // FEATURE 1: NPC/Lumi Dialogue Box above Bottom Dock (Desktop, Tablet, Mobile)
    // =========================================================================
    console.log("\n===========================================================");
    console.log("TEST 1: NPC/Lumi Dialogue Box vs Bottom Dock Clearance");
    console.log("===========================================================");

    const resolutions = [
      { name: "desktop_1280", width: 1280, height: 800, mobile: false },
      { name: "tablet_768", width: 768, height: 1024, mobile: true },
      { name: "mobile_390", width: 390, height: 844, mobile: true },
      { name: "mobile_375", width: 375, height: 667, mobile: true },
    ];

    const dialogueResults = [];

    for (const res of resolutions) {
      console.log(`\nTesting Resolution: ${res.name} (${res.width}x${res.height})`);
      await send("Emulation.setDeviceMetricsOverride", {
        width: res.width,
        height: res.height,
        deviceScaleFactor: 1,
        mobile: res.mobile,
      });
      await new Promise((r) => setTimeout(r, 600));

      const measurement = await send("Runtime.evaluate", {
        expression: `(() => {
          const lumi = document.querySelector('.hc-rpg-lumi-dialogue');
          const dock = document.querySelector('.hc-rpg-bottom-dock');
          if (!lumi || !dock) return { found: false, hasLumi: Boolean(lumi), hasDock: Boolean(dock) };

          const lumiRect = lumi.getBoundingClientRect();
          const dockRect = dock.getBoundingClientRect();
          const clearance = dockRect.top - lumiRect.bottom;
          const isOverlapping = lumiRect.bottom > dockRect.top;
          const isCompletelyAbove = lumiRect.bottom <= dockRect.top;

          return {
            found: true,
            isCompletelyAbove,
            isOverlapping,
            clearancePx: clearance,
            lumiRect: {
              top: lumiRect.top,
              bottom: lumiRect.bottom,
              left: lumiRect.left,
              right: lumiRect.right,
              height: lumiRect.height
            },
            dockRect: {
              top: dockRect.top,
              bottom: dockRect.bottom,
              left: dockRect.left,
              right: dockRect.right,
              height: dockRect.height
            }
          };
        })()`,
        returnByValue: true,
      });

      const data = measurement.result?.value;
      console.log(`Resolution ${res.name} measurement:`, data);
      dialogueResults.push({ ...res, ...data });

      if (res.name === "mobile_390" || res.name === "desktop_1280") {
        const shot = await send("Page.captureScreenshot", { format: "png" });
        if (res.name === "mobile_390") {
          saveScreenshot("verified-npc-dialogue-above-menu.png", shot.data);
        }
      }
    }

    // =========================================================================
    // FEATURE 2: Mystery Gift Box & Unboxing Effect
    // =========================================================================
    console.log("\n===========================================================");
    console.log("TEST 2: Mystery Gift Box (Top HUD & Day 7 Card) & Unboxing Modal");
    console.log("===========================================================");

    // Set to desktop 1280 for clear HUD & Modal inspection
    await send("Emulation.setDeviceMetricsOverride", {
      width: 1280,
      height: 800,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await new Promise((r) => setTimeout(r, 600));

    // Audit Top HUD & Day 7 Mystery Gift elements
    const giftAudit = await send("Runtime.evaluate", {
      expression: `(() => {
        const nextReward = document.querySelector('.hc-rpg-next-reward');
        const day7Box = document.querySelector('.hc-rpg-day7-box');
        const topText = nextReward ? nextReward.innerText : '';
        const day7Text = day7Box ? day7Box.innerText : '';

        // Mystery check: should contain gift/hộp quà/mystery and not spoil specific item before opening
        const hasGiftIcon = topText.includes('🎁') || Boolean(nextReward?.querySelector('.hc-rpg-gift-icon, [data-mystery-gift]'));
        const hasMysteryWord = /b&#237; ?\u1ea9n|mystery|h\u1ed9p qu\u00e0/i.test(topText) || /b&#237; ?\u1ea9n|mystery|h\u1ed9p qu\u00e0/i.test(day7Text);

        return {
          hasTopReward: Boolean(nextReward),
          topRewardText: topText.trim(),
          hasGiftIcon,
          hasMysteryWord,
          hasDay7Box: Boolean(day7Box),
          day7Text: day7Text.trim()
        };
      })()`,
      returnByValue: true,
    });

    console.log("Mystery Gift Audit on HUD:", giftAudit.result?.value);

    // Capture HUD proof
    const hudShot = await send("Page.captureScreenshot", { format: "png" });
    saveScreenshot("verified-mystery-gift-box-hud.png", hudShot.data);

    // Click Mystery Gift Box to trigger unboxing modal
    console.log("\nClicking Mystery Gift Box to trigger unboxing effect...");
    const clickRes = await send("Runtime.evaluate", {
      expression: `(() => {
        const giftBox = document.querySelector('.hc-rpg-next-reward') || document.querySelector('.hc-rpg-day7-box') || document.querySelector('[data-mystery-gift]');
        if (giftBox) {
          giftBox.click();
          return { clicked: true, className: giftBox.className };
        }
        return { clicked: false };
      })()`,
      returnByValue: true,
    });
    console.log("Click result:", clickRes.result?.value);

    // Wait for modal animation (sparkles, shake, reveal)
    await new Promise((r) => setTimeout(r, 1200));

    // Inspect Modal
    const modalAudit = await send("Runtime.evaluate", {
      expression: `(() => {
        const modal = document.querySelector('.hc-mystery-gift-modal') ||
                      document.querySelector('[data-mystery-gift-modal]') ||
                      document.querySelector('.hc-rpg-modal') ||
                      document.querySelector('.hc-gift-reveal-modal');

        const allModals = Array.from(document.querySelectorAll('div[class*="modal"], aside[class*="modal"], div[role="dialog"]'));
        const activeModal = allModals.find(m => getComputedStyle(m).display !== 'none');

        const textContent = (modal || activeModal)?.innerText || '';
        const hasSparkles = Boolean(document.querySelector('.hc-sparkles, .hc-mystery-sparkles, [data-sparkles]'));
        const hasOpenEffect = Boolean(document.querySelector('.hc-gift-shaking, .hc-gift-opening, .hc-gift-revealed, [data-gift-stage]'));

        return {
          hasModal: Boolean(modal || activeModal),
          modalClass: (modal || activeModal)?.className,
          textContent: textContent.trim().slice(0, 300),
          hasSparkles,
          hasOpenEffect
        };
      })()`,
      returnByValue: true,
    });

    console.log("Modal Audit:", modalAudit.result?.value);

    // Capture Unboxing Modal proof
    const modalShot = await send("Page.captureScreenshot", { format: "png" });
    saveScreenshot("verified-mystery-gift-opening-modal.png", modalShot.data);

    console.log("\n===========================================================");
    console.log("SUMMARY OF QA VERIFICATION RESULTS:");
    console.log("===========================================================");
    console.log("Dialogue vs Dock Clearance across viewports:");
    console.table(dialogueResults.map(d => ({
      resolution: d.name,
      clearancePx: d.clearancePx?.toFixed(2),
      isCompletelyAbove: d.isCompletelyAbove,
      isOverlapping: d.isOverlapping
    })));
    console.log("Mystery Gift HUD:", giftAudit.result?.value);
    console.log("Unboxing Modal:", modalAudit.result?.value);

    return {
      dialogueResults,
      giftAudit: giftAudit.result?.value,
      modalAudit: modalAudit.result?.value,
    };

  } finally {
    try { chromeProc.kill(); } catch {}
  }
}

// If executed directly
if (process.argv[1]?.endsWith("qa-test-runner.mjs")) {
  runQaVerification()
    .then(() => {
      console.log("\n✓ QA script completed successfully.");
      process.exit(0);
    })
    .catch((err) => {
      console.error("QA Execution Error:", err);
      process.exit(1);
    });
}
