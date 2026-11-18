import { chromium } from "file:///D:/botly/App/word3d/node_modules/playwright-core/index.mjs";
import path from "path";
import { spawn } from "child_process";

const artifactDir = "C:/Users/Admin/.gemini/antigravity/brain/b4c98197-8d8b-4888-a15e-eb76e32dedc4";

async function ensureServerRunning() {
  try {
    const res = await fetch("http://localhost:3355/api/template/default");
    if (res.ok) return;
  } catch (e) {
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
  console.log("Launching headless Chrome for Admin World Builder & Player Island test...");
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

  // TEST 1: ADMIN MODE WITH MOUNTAIN AND LAKE MASTER TEMPLATE
  console.log("Verifying Admin Mode with Mountain & Lake...");
  await page.waitForTimeout(800);
  const adminItems = await page.evaluate(() => window.placedItems.map(p => p.itemId));
  console.log("Admin Master Template items:", adminItems);

  if (!adminItems.includes("ter_snowy_mountain") || !adminItems.includes("ter_mossy_pond")) {
    throw new Error("Master template does not have both Mountain and Lake!");
  }

  await page.screenshot({ path: path.join(artifactDir, "57_admin_designed_mountain_and_lake_master_template.png") });
  console.log("Saved: 57_admin_designed_mountain_and_lake_master_template.png");

  // TEST 2: SWITCH TO PLAYER VIEW (APP NGƯỜI CHƠI)
  console.log("Switching to Player View (Góc Nhìn Người Chơi)...");
  await page.click("#btn-mode-player");
  await page.waitForTimeout(1000);

  const playerItems = await page.evaluate(() => window.placedItems.map(p => p.itemId));
  console.log("Player Island received items:", playerItems);

  if (!playerItems.includes("ter_snowy_mountain") || !playerItems.includes("ter_mossy_pond")) {
    throw new Error("Player island did not receive both Mountain and Lake from Admin!");
  }

  await page.screenshot({ path: path.join(artifactDir, "58_player_receives_master_mountain_and_lake_island.png") });
  console.log("Saved: 58_player_receives_master_mountain_and_lake_island.png");

  await browser.close();
  console.log("ADMIN WORLD BUILDER & PLAYER ISLAND TEST PASSED 100% SUCCESSFULLY!");
}

main().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
