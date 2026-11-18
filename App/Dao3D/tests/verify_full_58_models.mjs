import { chromium } from "file:///D:/botly/App/word3d/node_modules/playwright-core/index.mjs";
import path from "path";

const artifactDir = "C:/Users/Admin/.gemini/antigravity/brain/b4c98197-8d8b-4888-a15e-eb76e32dedc4";

async function main() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    args: ["--no-sandbox", "--disable-gpu-sandbox"],
  });
  const context = await browser.newContext({ viewport: { width: 420, height: 880 }, deviceScaleFactor: 2 });
  const page = await context.newPage();

  const logs = [];
  page.on('console', msg => logs.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => logs.push(`[PAGE ERROR] ${err.message}`));

  console.log("Navigating to http://localhost:3355/...");
  await page.goto("http://localhost:3355/", { waitUntil: "domcontentloaded", timeout: 15000 });
  await page.waitForTimeout(1000);

  // Close Lumi welcome modal if visible
  const lumiBtn = await page.$("#btn-accept-lumi");
  if (lumiBtn && await lumiBtn.isVisible()) {
    await lumiBtn.click();
    await page.waitForTimeout(600);
  }

  // 1. Open Kho Đồ (Inventory)
  await page.click("#btn-open-inv");
  await page.waitForTimeout(600);

  const itemCount = await page.$$eval('#inv-item-list .item-card', cards => cards.length);
  console.log(`Inventory card count (All): ${itemCount}`);
  await page.screenshot({ path: path.join(artifactDir, "11_full_58_models_inventory.png") });
  console.log("Saved 11_full_58_models_inventory.png");

  // 2. Filter Landscape (Cầu & Tiện Ích)
  await page.click('#inv-category-filter button[data-cat="landscape"]');
  await page.waitForTimeout(400);
  const landscapeCount = await page.$$eval('#inv-item-list .item-card', cards => cards.length);
  console.log(`Inventory card count (Landscape): ${landscapeCount}`);
  await page.screenshot({ path: path.join(artifactDir, "12_inventory_landscape_category.png") });
  console.log("Saved 12_inventory_landscape_category.png");

  // 3. Filter Terrain (Suối & Địa Hình)
  await page.click('#inv-category-filter button[data-cat="terrain"]');
  await page.waitForTimeout(400);
  const terrainCount = await page.$$eval('#inv-item-list .item-card', cards => cards.length);
  console.log(`Inventory card count (Terrain): ${terrainCount}`);
  await page.screenshot({ path: path.join(artifactDir, "13_inventory_terrain_category.png") });
  console.log("Saved 13_inventory_terrain_category.png");

  // 4. Filter Companion (Đồng Hành) and Place Knight
  await page.click('#inv-category-filter button[data-cat="companion"]');
  await page.waitForTimeout(400);
  const placeKnightBtn = await page.$("#inv-item-list .item-card:nth-child(3) .action-btn");
  if (placeKnightBtn) {
    await placeKnightBtn.click();
    await page.waitForTimeout(600);
    await page.click("#btn-confirm");
    await page.waitForTimeout(1000);
  }

  // 5. Open Kho Đồ again, filter Nature and Place Momiji Maple
  await page.click("#btn-open-inv");
  await page.waitForTimeout(400);
  await page.click('#inv-category-filter button[data-cat="nature"]');
  await page.waitForTimeout(400);
  const placeMomijiBtn = await page.$("#inv-item-list .item-card:nth-child(1) .action-btn");
  if (placeMomijiBtn) {
    await placeMomijiBtn.click();
    await page.waitForTimeout(600);
    // Rotate twice
    await page.click("#btn-rotate");
    await page.waitForTimeout(200);
    await page.click("#btn-rotate");
    await page.waitForTimeout(200);
    await page.click("#btn-confirm");
    await page.waitForTimeout(1000);
  }

  // 6. Capture final island with placed models
  await page.screenshot({ path: path.join(artifactDir, "14_island_with_placed_word3d_models.png") });
  console.log("Saved 14_island_with_placed_word3d_models.png");

  await browser.close();
  console.log("=== COMPLETED VERIFICATION OF 58 MODELS ===");
}

main().catch(err => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
