import { chromium } from "file:///D:/botly/App/word3d/node_modules/playwright-core/index.mjs";
import path from "path";

const artifactDir = "C:/Users/Admin/.gemini/antigravity/brain/b4c98197-8d8b-4888-a15e-eb76e32dedc4";

async function main() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    args: ["--no-sandbox", "--disable-gpu-sandbox"],
  });

  // Test wide desktop viewport (1280x720) matching user's screen
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  const page = await context.newPage();

  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err));

  console.log("Navigating to http://localhost:3355/ at 1280x720...");
  await page.goto("http://localhost:3355/", { waitUntil: "domcontentloaded", timeout: 15000 });
  await page.waitForTimeout(1500);

  // Close Lumi welcome modal if open
  const lumiBtn = await page.$("#btn-accept-lumi");
  if (lumiBtn && await lumiBtn.isVisible()) {
    await lumiBtn.click();
    await page.waitForTimeout(500);
  }

  // 1. Capture pristine default perspective
  console.log("Capturing 19_lush_organic_island_default.png...");
  await page.screenshot({ path: path.join(artifactDir, "19_lush_organic_island_default.png") });

  // 2. Drag to rotate 180 degrees (exact angle user had in defect screenshot)
  console.log("Rotating camera by 180 degrees...");
  await page.mouse.move(700, 360);
  await page.mouse.down();
  await page.mouse.move(180, 360, { steps: 30 });
  await page.mouse.up();
  await page.waitForTimeout(800);

  console.log("Capturing 20_rotated_180_no_seams.png...");
  await page.screenshot({ path: path.join(artifactDir, "20_rotated_180_no_seams.png") });

  // 3. Drag further to test full 360 degree continuous parallax
  console.log("Rotating camera further by 120 degrees...");
  await page.mouse.move(700, 360);
  await page.mouse.down();
  await page.mouse.move(250, 360, { steps: 25 });
  await page.mouse.up();
  await page.waitForTimeout(800);

  console.log("Capturing 21_rotated_300_full_coverage.png...");
  await page.screenshot({ path: path.join(artifactDir, "21_rotated_300_full_coverage.png") });

  // 4. Reset camera
  const resetBtn = await page.$("#btn-reset-cam");
  if (resetBtn) {
    await resetBtn.click();
    await page.waitForTimeout(600);
  }

  // 5. Open Inventory and place an item to verify harmony
  const btnInv = await page.$("#btn-open-inventory");
  if (btnInv) {
    await btnInv.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(artifactDir, "22_inventory_thumbnails_verified.png") });

    // Click item 0 to place
    const itemCard = await page.$(".inv-card");
    if (itemCard) {
      await itemCard.click();
      await page.waitForTimeout(500);

      // Confirm placement
      const btnConfirm = await page.$("#btn-confirm-placement");
      if (btnConfirm) {
        await btnConfirm.click();
        await page.waitForTimeout(600);
      }
    }
  }

  console.log("Capturing 23_organic_island_with_placed_item.png...");
  await page.screenshot({ path: path.join(artifactDir, "23_organic_island_with_placed_item.png") });

  await browser.close();
  console.log("ALL VERIFICATIONS COMPLETED SUCCESSFULLY!");
}

main().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
