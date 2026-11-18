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

  console.log("Navigating to http://localhost:3355/...");
  await page.goto("http://localhost:3355/", { waitUntil: "domcontentloaded", timeout: 15000 });
  await page.waitForTimeout(1000);

  // Close Lumi welcome modal if open
  const lumiBtn = await page.$("#btn-accept-lumi");
  if (lumiBtn && await lumiBtn.isVisible()) {
    await lumiBtn.click();
    await page.waitForTimeout(600);
  }

  // 1. Capture 2.5D Parallax background view
  await page.screenshot({ path: path.join(artifactDir, "07_island_25d_parallax_bg.png") });
  console.log("Saved 07_island_25d_parallax_bg.png");

  // 2. Open Inventory with full Word3D catalog
  await page.click("#btn-open-inv");
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(artifactDir, "08_full_word3d_inventory_modal.png") });
  console.log("Saved 08_full_word3d_inventory_modal.png");

  // 3. Filter category 'companion'
  await page.click('#inv-category-filter button[data-cat="companion"]');
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(artifactDir, "09_inventory_companion_category.png") });
  console.log("Saved 09_inventory_companion_category.png");

  // 4. Place companion (Cáo Đồng Hành)
  const placeBtn = await page.$("#inv-item-list .action-btn");
  if (placeBtn) {
    await placeBtn.click();
    await page.waitForTimeout(600);
    await page.click("#btn-confirm");
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(artifactDir, "10_island_with_placed_companion.png") });
    console.log("Saved 10_island_with_placed_companion.png");
  }

  await browser.close();
  console.log("=== ALL PARALLAX & INVENTORY CAPTURES COMPLETED ===");
}

main().catch(err => {
  console.error("Capture failed:", err);
  process.exit(1);
});
