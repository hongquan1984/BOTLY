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

  page.on('console', msg => console.log(`[PAGE LOG] ${msg.text()}`));
  page.on('pageerror', err => console.error(`[PAGE ERROR] ${err.message}`));

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
  console.log("Opening Kho Đồ to inspect real 3D model thumbnails...");
  await page.click("#btn-open-inv");
  // Wait for 3D thumbnail rendering
  await page.waitForTimeout(2500);

  // Check how many thumbnails have loaded
  const loadedThumbCount = await page.$$eval(".item-thumb-img.loaded", imgs => imgs.length);
  console.log(`Loaded real 3D thumbnails count: ${loadedThumbCount}`);

  await page.screenshot({ path: path.join(artifactDir, "15_inventory_real_3d_thumbnails.png") });
  console.log("Saved 15_inventory_real_3d_thumbnails.png");

  // 2. Filter Category 'building' (Kiến Trúc)
  await page.click('#inv-category-filter button[data-cat="building"]');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(artifactDir, "16_inventory_buildings_real_thumbnails.png") });
  console.log("Saved 16_inventory_buildings_real_thumbnails.png");

  // 3. Filter Category 'companion' (Bạn Đồng Hành)
  await page.click('#inv-category-filter button[data-cat="companion"]');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(artifactDir, "17_inventory_companions_real_thumbnails.png") });
  console.log("Saved 17_inventory_companions_real_thumbnails.png");

  // 4. Place Knight on the island to verify human scale
  const placeKnightBtn = await page.$("#inv-item-list .item-card:nth-child(3) .action-btn");
  if (placeKnightBtn) {
    await placeKnightBtn.click();
    await page.waitForTimeout(600);
    await page.click("#btn-confirm");
    await page.waitForTimeout(800);
  }

  // 5. Open Kho Đồ again, filter Companion and Place Fox
  await page.click("#btn-open-inv");
  await page.waitForTimeout(500);
  await page.click('#inv-category-filter button[data-cat="companion"]');
  await page.waitForTimeout(400);
  const placeFoxBtn = await page.$("#inv-item-list .item-card:nth-child(1) .action-btn");
  if (placeFoxBtn) {
    await placeFoxBtn.click();
    await page.waitForTimeout(600);
    // Move slightly or rotate
    await page.click("#btn-rotate");
    await page.waitForTimeout(200);
    await page.click("#btn-confirm");
    await page.waitForTimeout(800);
  }

  // 6. Open Kho Đồ again, filter Nature and Place Momiji Maple Tree
  await page.click("#btn-open-inv");
  await page.waitForTimeout(500);
  await page.click('#inv-category-filter button[data-cat="nature"]');
  await page.waitForTimeout(400);
  const placeMapleBtn = await page.$("#inv-item-list .item-card:nth-child(1) .action-btn");
  if (placeMapleBtn) {
    await placeMapleBtn.click();
    await page.waitForTimeout(600);
    await page.click("#btn-confirm");
    await page.waitForTimeout(800);
  }

  // 7. Capture final proportional island scene
  await page.screenshot({ path: path.join(artifactDir, "18_island_proportional_models_harmony.png") });
  console.log("Saved 18_island_proportional_models_harmony.png");

  await browser.close();
  console.log("=== THUMBNAILS & SCALING VERIFICATION COMPLETE ===");
}

main().catch(err => {
  console.error("Verification failed:", err);
  process.exit(1);
});
