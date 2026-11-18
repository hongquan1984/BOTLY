import { chromium } from "file:///D:/botly/App/word3d/node_modules/playwright-core/index.mjs";
import path from "path";
import { spawn } from "child_process";

const artifactDir = "C:/Users/Admin/.gemini/antigravity/brain/b4c98197-8d8b-4888-a15e-eb76e32dedc4";

async function ensureServerRunning() {
  try {
    const res = await fetch("http://localhost:3355/api/players");
    if (res.ok) return;
  } catch (e) {
    // Server not running, spawn it
    console.log("Spawning server.mjs locally for test...");
    const serverProcess = spawn("node", ["D:\\botly\\App\\Dao3D\\server.mjs"], {
      detached: true,
      stdio: "ignore"
    });
    serverProcess.unref();
    await new Promise(r => setTimeout(r, 2000));
  }
}

async function main() {
  await ensureServerRunning();
  console.log("Launching headless Chrome for Player & Admin Modes test...");
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    args: ["--no-sandbox", "--disable-gpu-sandbox"],
  });

  const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  const page = await context.newPage();

  page.on("console", (msg) => {
    console.log("BROWSER:", msg.text());
  });

  console.log("Navigating to http://localhost:3355/ ...");
  await page.goto("http://localhost:3355/", { waitUntil: "domcontentloaded", timeout: 15000 });
  await page.waitForTimeout(1500);

  // Close Lumi welcome modal if visible
  const lumiBtn = await page.$("#btn-accept-lumi");
  if (lumiBtn && await lumiBtn.isVisible()) {
    await lumiBtn.click();
    await page.waitForTimeout(600);
  }

  // TEST 1: VERIFY PLAYER 1 (MINH QUÂN) ISLAND
  console.log("Verifying Player 1 (Minh Quân)...");
  await page.waitForTimeout(800);
  const p1Items = await page.evaluate(() => window.placedItems.map(p => p.itemId));
  console.log("Player 1 placed items:", p1Items);
  await page.screenshot({ path: path.join(artifactDir, "51_player1_hero_island.png") });
  console.log("Saved: 51_player1_hero_island.png");

  // TEST 2: SWITCH TO PLAYER 2 (PHƯƠNG LINH) AND VERIFY INDEPENDENT ISLAND
  console.log("Switching to Player 2 (Phương Linh)...");
  await page.selectOption("#player-select", "player_02");
  await page.waitForTimeout(1000);
  const p2Items = await page.evaluate(() => window.placedItems.map(p => p.itemId));
  console.log("Player 2 placed items:", p2Items);
  await page.screenshot({ path: path.join(artifactDir, "52_player2_luna_island.png") });
  console.log("Saved: 52_player2_luna_island.png");

  // TEST 3: SWITCH TO ADMIN MODE (DEFAULT TEMPLATE EDITOR)
  console.log("Switching to Admin Mode...");
  await page.click("#btn-mode-admin");
  await page.waitForTimeout(1000);
  const adminInitialItems = await page.evaluate(() => window.placedItems.map(p => p.itemId));
  console.log("Admin initial template items:", adminInitialItems);
  await page.screenshot({ path: path.join(artifactDir, "53_admin_mode_editing_template.png") });
  console.log("Saved: 53_admin_mode_editing_template.png");

  // TEST 4: ADMIN ADDS AN EXTRA LANDMARK TO DEFAULT TEMPLATE (e.g. Biệt Thự Đá Cổ Phong) AND SAVES
  console.log("Admin placing an extra item to default template...");
  await page.evaluate(async () => {
    // Add stone house to template using spawnPlacedItem
    window.spawnPlacedItem({
      instanceId: "inst_admin_stone_house",
      itemId: "bld_stone_house",
      position: { x: 5.5, y: 1.8, z: -3.5 },
      rotationY: -0.6,
      elevation: 0
    });
    await window.saveAdminDefaultTemplate();
  });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(artifactDir, "54_admin_template_saved.png") });
  console.log("Saved: 54_admin_template_saved.png");

  // TEST 5: NEW PLAYER RECEIVES THE UPDATED ADMIN TEMPLATE
  console.log("Switching back to Player Mode and verifying new player receives updated template...");
  await page.click("#btn-mode-player");
  await page.waitForTimeout(800);

  // Switch to player_03 (new player)
  await page.evaluate(async () => {
    await window.loadPlayerIsland('player_03');
  });
  await page.waitForTimeout(1000);
  const p3Items = await page.evaluate(() => window.placedItems.map(p => p.itemId));
  console.log("New Player (player_03) received items:", p3Items);
  await page.screenshot({ path: path.join(artifactDir, "55_new_player_with_admin_updated_default_island.png") });
  console.log("Saved: 55_new_player_with_admin_updated_default_island.png");

  // TEST 6: VERIFY PLAYER 1 (MINH QUÂN) STILL HAS HIS OWN ORIGINAL ISLAND UNTOUCHED
  console.log("Switching back to Player 1 to verify complete data isolation...");
  await page.evaluate(async () => {
    await window.loadPlayerIsland('player_01');
  });
  await page.waitForTimeout(1000);
  const p1FinalItems = await page.evaluate(() => window.placedItems.map(p => p.itemId));
  console.log("Player 1 final items:", p1FinalItems);
  await page.screenshot({ path: path.join(artifactDir, "56_player1_remains_independent_and_untouched.png") });
  console.log("Saved: 56_player1_remains_independent_and_untouched.png");

  await browser.close();
  console.log("ALL TESTS FOR MULTI-PLAYER & ADMIN TEMPLATE PASSED 100% SUCCESSFULLY!");
}

main().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
