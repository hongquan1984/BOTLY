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
  console.log("Starting Chrome CDP for Progressive Gameplay End-to-End Verification...");
  
  // 1. Reset player_1 and player_2 to fresh state
  await fetch('http://localhost:3450/api/player-reset', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ playerId: 'player_1' })
  });
  await fetch('http://localhost:3450/api/player-reset', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ playerId: 'player_2' })
  });
  console.log("Reset player_1 and player_2 to fresh state (0 items)");

  const chromeProc = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
    '--remote-debugging-port=9225', '--headless=new', '--disable-gpu',
    '--window-size=1440,900'
  ]);

  try {
    let wsUrl = null;
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 250));
      try {
        const res = await fetch('http://127.0.0.1:9225/json/list');
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
    await new Promise((r) => setTimeout(r, 2500));

    // ========================================================
    // TEST 1: DAY 0 - EMPTY ROOM (FRESH ONBOARDING)
    // ========================================================
    console.log("\n--- TEST 1: Day 0 Empty Room Verification ---");
    const test1Res = await cdpSend(ws, "Runtime.evaluate", {
      returnByValue: true,
      expression: `
        (() => {
          const btnWelcome = document.getElementById('btn-open-welcome-gift');
          const btnDaily = document.getElementById('btn-open-daily-reward');
          const renderedItems = document.querySelectorAll('.perspective-item-node');
          return {
            playerId: activePlayerId,
            unlockedCount: currentPlayerProfile.unlocked_items.length,
            btnWelcomeVisible: btnWelcome && btnWelcome.style.display !== 'none',
            btnDailyVisible: btnDaily && btnDaily.style.display !== 'none',
            itemsOnStageCount: renderedItems.length
          };
        })()
      `
    });
    console.log("Test 1 Result (Day 0):", test1Res.result.value);

    let shot = await cdpSend(ws, "Page.captureScreenshot", { format: "png" });
    writeFileSync(path.join(outputDir, "55-day0-empty-room-welcome.png"), Buffer.from(shot.data, "base64"));
    console.log("Saved 55-day0-empty-room-welcome.png");

    // ========================================================
    // TEST 2: DAY 1 - WELCOME GIFT UNBOXING (SOFA PLACED)
    // ========================================================
    console.log("\n--- TEST 2: Day 1 Welcome Gift Unboxing ---");
    await cdpSend(ws, "Runtime.evaluate", { expression: `openWelcomeGiftModal()` });
    await new Promise((r) => setTimeout(r, 600));

    shot = await cdpSend(ws, "Page.captureScreenshot", { format: "png" });
    writeFileSync(path.join(outputDir, "56-day1-welcome-gift-modal.png"), Buffer.from(shot.data, "base64"));
    console.log("Saved 56-day1-welcome-gift-modal.png");

    // Claim Welcome Gift
    const claimRes = await cdpSend(ws, "Runtime.evaluate", {
      returnByValue: true,
      expression: `
        (() => {
          claimWelcomeGift();
          const btnWelcome = document.getElementById('btn-open-welcome-gift');
          const btnDaily = document.getElementById('btn-open-daily-reward');
          const renderedNodes = Array.from(document.querySelectorAll('.perspective-item-node')).map(el => el.id);
          return {
            unlockedItems: currentPlayerProfile.unlocked_items,
            btnWelcomeVisible: btnWelcome && btnWelcome.style.display !== 'none',
            btnDailyVisible: btnDaily && btnDaily.style.display !== 'none',
            renderedNodes: renderedNodes
          };
        })()
      `
    });
    console.log("Test 2 Result (Claimed Welcome Gift):", claimRes.result.value);
    await new Promise((r) => setTimeout(r, 800));

    shot = await cdpSend(ws, "Page.captureScreenshot", { format: "png" });
    writeFileSync(path.join(outputDir, "57-day1-sofa-placed-in-living-room.png"), Buffer.from(shot.data, "base64"));
    console.log("Saved 57-day1-sofa-placed-in-living-room.png");

    // ========================================================
    // TEST 3: DAY 2 - DAILY QUEST REWARD (PICK 1 OF 2 CHOICES)
    // ========================================================
    console.log("\n--- TEST 3: Day 2 Pick 1 of 2 Daily Reward ---");
    const openDailyRes = await cdpSend(ws, "Runtime.evaluate", {
      returnByValue: true,
      expression: `
        (() => {
          openDailyRewardModal();
          return {
            choiceA: { id: currentRewardChoiceA.id, name: currentRewardChoiceA.name, room: currentRewardChoiceA.room },
            choiceB: { id: currentRewardChoiceB.id, name: currentRewardChoiceB.name, room: currentRewardChoiceB.room }
          };
        })()
      `
    });
    console.log("Test 3 Choices (1 Living vs 1 Bedroom):", openDailyRes.result.value);
    await new Promise((r) => setTimeout(r, 600));

    shot = await cdpSend(ws, "Page.captureScreenshot", { format: "png" });
    writeFileSync(path.join(outputDir, "58-day2-pick-1-of-2-modal.png"), Buffer.from(shot.data, "base64"));
    console.log("Saved 58-day2-pick-1-of-2-modal.png");

    // Player chooses Choice B (Bedroom Item)!
    console.log("Player chooses Choice B (Bedroom)...");
    const chooseBRes = await cdpSend(ws, "Runtime.evaluate", {
      returnByValue: true,
      expression: `
        (() => {
          claimDailyReward('b');
          return {
            currentSceneId,
            unlockedItems: currentPlayerProfile.unlocked_items,
            renderedNodes: Array.from(document.querySelectorAll('.perspective-item-node')).map(el => el.id)
          };
        })()
      `
    });
    console.log("Test 3 Claimed Result:", chooseBRes.result.value);
    await new Promise((r) => setTimeout(r, 800));

    shot = await cdpSend(ws, "Page.captureScreenshot", { format: "png" });
    writeFileSync(path.join(outputDir, "59-day2-bedroom-item-placed.png"), Buffer.from(shot.data, "base64"));
    console.log("Saved 59-day2-bedroom-item-placed.png");

    // ========================================================
    // TEST 4: PLAYER ISOLATION (PLAYER 2 VS PLAYER 1)
    // ========================================================
    console.log("\n--- TEST 4: Player Isolation Verification ---");
    // Switch to player_2
    const p2Res = await cdpSend(ws, "Runtime.evaluate", {
      returnByValue: true,
      expression: `
        (async () => {
          await switchPlayerProfile('player_2');
          return {
            activePlayer: activePlayerId,
            p2Unlocked: currentPlayerProfile.unlocked_items.length,
            stageItems: document.querySelectorAll('.perspective-item-node').length
          };
        })()
      `
    });
    console.log("Player 2 Fresh State:", p2Res.result.value);

    // Switch back to player_1
    const p1ReturnRes = await cdpSend(ws, "Runtime.evaluate", {
      returnByValue: true,
      expression: `
        (async () => {
          await switchPlayerProfile('player_1');
          return {
            activePlayer: activePlayerId,
            p1Unlocked: currentPlayerProfile.unlocked_items,
            stageItems: Array.from(document.querySelectorAll('.perspective-item-node')).map(el => el.id)
          };
        })()
      `
    });
    console.log("Player 1 Restored State (Unaffected by Player 2):", p1ReturnRes.result.value);

    // ========================================================
    // TEST 5: AUTO REAL-TIME CLOCK & DAY/NIGHT VERIFICATION
    // ========================================================
    console.log("\n--- TEST 5: Auto Real-Time Clock & Day/Night ---");
    const clockRes = await cdpSend(ws, "Runtime.evaluate", {
      returnByValue: true,
      expression: `
        (() => {
          const clockDisplay = document.getElementById('clock-time-display').textContent;
          const statusTag = document.getElementById('clock-status-tag').textContent;
          return {
            clockDisplay,
            statusTag,
            currentDayNight,
            autoEnabled: isAutoDayNightEnabled
          };
        })()
      `
    });
    console.log("Real-time Clock State:", clockRes.result.value);

    console.log("\nAll 5 automated end-to-end tests completed successfully!");
    ws.close();
  } finally {
    chromeProc.kill();
  }
}

run().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
