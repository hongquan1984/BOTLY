import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import net from "node:net";
import path from "node:path";

const root = "d:\\botly";
const artifactsDir = "C:\\Users\\Admin\\.gemini\\antigravity\\brain\\abff8161-8d04-4588-8fd8-ca4619ccaf85";
const base = "http://127.0.0.1:3000";

function saveScreenshot(filename, base64Data) {
  const buf = Buffer.from(base64Data, "base64");
  try { writeFileSync(path.join(artifactsDir, filename), buf); } catch {}
}

async function main() {
  console.log("=== VERIFYING UI FIXES IN CHROME HEADLESS ===");

  const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
  assert.ok(existsSync(chromePath), "Chrome executable must exist");

  const debugPort = 9345;
  const userDataDir = path.join(root, "App", ".tmp", "test-ui-fix-profile-" + Date.now());

  const chromeProc = spawn(chromePath, [
    "--headless=new",
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${userDataDir}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-features=Translate,OptimizationHints",
    "about:blank",
  ], { stdio: "ignore", windowsHide: true });

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  try {
    for (let i = 0; i < 40; i++) {
      try {
        const socket = net.createConnection(debugPort, "127.0.0.1");
        await new Promise((res, rej) => {
          socket.once("connect", () => { socket.end(); res(); });
          socket.once("error", rej);
        });
        break;
      } catch {
        await sleep(250);
      }
    }

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
      await sleep(200);
    }
    assert.ok(targetWs, "Must get page webSocketDebuggerUrl from Chrome");

    const WebSocket = (await import("ws")).default;
    const ws = new WebSocket(targetWs);
    await new Promise((res, rej) => {
      ws.once("open", res);
      ws.once("error", rej);
    });

    let msgId = 1;
    const send = (method, params = {}) =>
      new Promise((resolve, reject) => {
        const id = msgId++;
        const handler = (event) => {
          const data = JSON.parse(event.data);
          if (data.id === id) {
            ws.removeEventListener("message", handler);
            if (data.error) reject(new Error(JSON.stringify(data.error)));
            else resolve(data.result);
          }
        };
        ws.addEventListener("message", handler);
        ws.send(JSON.stringify({ id, method, params }));
      });

    await send("Page.enable");
    await send("Runtime.enable");
    await send("DOM.enable");
    await send("Emulation.setDeviceMetricsOverride", {
      width: 1280,
      height: 800,
      deviceScaleFactor: 1,
      mobile: false,
    });

    console.log("Navigating to", `${base}/play`);
    await send("Page.navigate", { url: `${base}/play` });
    await sleep(4000);

    // Click Enter Adventure or enter World
    const enterRes = await send("Runtime.evaluate", {
      expression: `
        (() => {
          const btn = document.querySelector('button.hc-gold-action') || Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('VÀO VƯƠNG QUỐC') || b.textContent.includes('ENTER') || b.textContent.includes('Start'));
          if (btn) { btn.click(); return 'clicked'; }
          return 'none';
        })()
      `,
      returnByValue: true,
    });
    console.log("Entry button click:", enterRes.result?.value);
    await sleep(2500);

    // Click Home dock button
    const clickHomeRes = await send("Runtime.evaluate", {
      expression: `
        (() => {
          const btn = document.querySelector('[data-testid="hud-dock-home-btn"]');
          if (btn) { btn.click(); return 'clicked-dock-home'; }
          return 'home-dock-btn-not-found';
        })()
      `,
      returnByValue: true,
    });
    console.log("Click home dock result:", clickHomeRes.result?.value);
    await sleep(2000);

    // Verify: Is hc-game-modal open with "Nhà Nghỉ Dưỡng Thụy Sĩ"?
    const phantomModalCheck = await send("Runtime.evaluate", {
      expression: `
        (() => {
          const modalHeader = document.querySelector('.hc-game-modal-header h2');
          const isPhantomOpen = modalHeader && modalHeader.textContent.includes('Nhà Nghỉ Dưỡng');
          const isHomeContainerOpen = !!document.querySelector('[data-testid="home-full-container"]');
          const isStageOpen = !!document.querySelector('[data-testid="wellness-home-stage"]');
          return {
            isPhantomOpen: !!isPhantomOpen,
            isHomeContainerOpen,
            isStageOpen,
            modalHeaderText: modalHeader ? modalHeader.textContent : null
          };
        })()
      `,
      returnByValue: true,
    });
    console.log("Phantom modal check:", phantomModalCheck.result?.value);
    assert.equal(phantomModalCheck.result?.value?.isPhantomOpen, false, "Phantom hc-game-modal must NOT be open!");
    assert.equal(phantomModalCheck.result?.value?.isHomeContainerOpen, true, "Home full container MUST be open!");

    // Capture screenshot of Home entry
    const shot1 = await send("Page.captureScreenshot", { format: "png" });
    saveScreenshot("verified_home_entry.png", shot1.data);
    console.log("Saved verified_home_entry.png");

    // Click "Mở Hộp Quà Tân Gia" if welcome modal is open
    await send("Runtime.evaluate", {
      expression: `
        (() => {
          const btn = document.querySelector('[data-testid="claim-welcome-btn"]');
          if (btn) { btn.click(); return 'claimed-welcome'; }
          return 'no-welcome-modal';
        })()
      `,
    });
    await sleep(2000);

    // Now test opening the Daily Quest Reward Modal (Pick 1 of 2)
    // Click "Nhận Thưởng Nhiệm Vụ Hằng Ngày" in the Chalet toolbar or trigger it
    const openDailyRewardRes = await send("Runtime.evaluate", {
      expression: `
        (() => {
          const btn = document.querySelector('[data-testid="claim-daily-btn"]');
          if (btn) { btn.click(); return 'clicked-claim-daily'; }
          return 'claim-daily-not-found';
        })()
      `,
      returnByValue: true,
    });
    console.log("Open daily reward modal result:", openDailyRewardRes.result?.value);
    await sleep(1500);

    // Inspect the Daily Reward modal state
    const modalInspection = await send("Runtime.evaluate", {
      expression: `
        (() => {
          const modal = document.querySelector('[data-testid="daily-reward-modal"]');
          if (!modal) return { open: false };

          // Count visible stage items inside stage
          const stageItems = document.querySelectorAll('.hc-stage-item-wrapper');

          // Check cards inside modal
          const cards = Array.from(modal.querySelectorAll('.hc-home-pick-card')).map(c => {
            const name = c.querySelector('.hc-home-pick-name')?.textContent?.trim();
            const tag = c.querySelector('.hc-home-pick-room-tag')?.textContent?.trim();
            const img = c.querySelector('img.hc-home-pick-img');
            return {
              name,
              tag,
              imgSrc: img ? img.src : null,
              imgNaturalWidth: img ? img.naturalWidth : 0,
              imgNaturalHeight: img ? img.naturalHeight : 0,
            };
          });

          // Check action buttons visibility and position
          const confirmBtn = modal.querySelector('[data-testid="confirm-reward-btn"]');
          const rect = confirmBtn ? confirmBtn.getBoundingClientRect() : null;

          return {
            open: true,
            stageItemsInDomCount: stageItems.length,
            cards,
            confirmButton: {
              exists: !!confirmBtn,
              visible: rect && rect.width > 0 && rect.height > 0,
              text: confirmBtn?.textContent?.trim()
            }
          };
        })()
      `,
      returnByValue: true,
    });
    console.log("Daily Reward Modal Inspection:", JSON.stringify(modalInspection.result?.value, null, 2));

    // Verify stage items are 0 in DOM while modal is open!
    assert.equal(modalInspection.result?.value?.stageItemsInDomCount, 0, "Stage items must be completely unmounted from DOM while modal is open!");
    assert.equal(modalInspection.result?.value?.confirmButton?.visible, true, "Confirm reward button must be visible!");

    // Capture screenshot of the Daily Quest Reward modal
    const shot2 = await send("Page.captureScreenshot", { format: "png" });
    saveScreenshot("verified_daily_reward_modal.png", shot2.data);
    console.log("Saved verified_daily_reward_modal.png");

    console.log("ALL BROWSER AUTOMATION CHECKS PASSED!");
  } finally {
    try { chromeProc.kill("SIGKILL"); } catch {}
  }
}

main().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
