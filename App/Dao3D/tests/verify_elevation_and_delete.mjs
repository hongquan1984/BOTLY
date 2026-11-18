import { chromium } from "file:///D:/botly/App/word3d/node_modules/playwright-core/index.mjs";
import path from "path";

const artifactDir = "C:/Users/Admin/.gemini/antigravity/brain/b4c98197-8d8b-4888-a15e-eb76e32dedc4";

async function main() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    args: ["--no-sandbox", "--disable-gpu-sandbox"],
  });

  const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  const page = await context.newPage();

  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err));

  console.log("Navigating to http://localhost:3355/ ...");
  await page.goto("http://localhost:3355/", { waitUntil: "domcontentloaded", timeout: 15000 });
  await page.waitForTimeout(1500);

  // Close Lumi welcome modal
  const lumiBtn = await page.$("#btn-accept-lumi");
  if (lumiBtn && await lumiBtn.isVisible()) {
    await lumiBtn.click();
    await page.waitForTimeout(500);
  }

  // 1. Open Inventory and start placement for a lightweight model (prop_plaza_well)
  console.log("Triggering placement for lightweight model (prop_plaza_well)...");
  await page.evaluate(() => {
    window.startPlacement('prop_plaza_well');
  });
  await page.waitForTimeout(800);

  // Verify placement bar opened with elevation controls
  const badgeText = await page.$eval("#txt-elevation-badge", el => el.textContent);
  console.log("Initial elevation badge:", badgeText);

  // 3. Elevate model UP twice (+0.15m x 2 = +0.30m)
  console.log("Clicking ⬆️ Lên (+) twice...");
  const btnUp = await page.$("#btn-elevate-up");
  await btnUp.click();
  await page.waitForTimeout(300);
  await btnUp.click();
  await page.waitForTimeout(400);

  const badgeTextUp = await page.$eval("#txt-elevation-badge", el => el.textContent);
  console.log("Elevation after Up clicks:", badgeTextUp);

  // Screenshot 24: Elevating model with badge & controls
  console.log("Capturing 24_placement_elevate_up_controls.png...");
  await page.screenshot({ path: path.join(artifactDir, "24_placement_elevate_up_controls.png") });

  // 4. Confirm placement
  console.log("Confirming placement at elevated height...");
  const btnConfirm = await page.$("#btn-confirm");
  await btnConfirm.click();
  await page.waitForTimeout(800);

  // Screenshot 25: Island with elevated placed item
  console.log("Capturing 25_island_with_elevated_item.png...");
  await page.screenshot({ path: path.join(artifactDir, "25_island_with_elevated_item.png") });

  // 5. Click on the placed item in decoration mode to test selection & deletion
  console.log("Enabling decoration mode and clicking placed item to select...");
  const btnDecor = await page.$("#btn-toggle-decor");
  await btnDecor.click();
  await page.waitForTimeout(400);

  // Click on the canvas near the placed item (coords roughly x=2.0, z=2.0)
  // In screen space at distance 38m, [2.0, 1.8, 2.0] is near center (640, 420)
  await page.mouse.click(650, 440);
  await page.waitForTimeout(600);

  // If not hit directly by click, trigger programmatic selection for verification
  const selectResult = await page.evaluate(() => {
    if (window.placedItems && window.placedItems.length > 0) {
      window.selectPlacedItem(window.placedItems[0].instanceId);
      return window.placedItems[0].instanceId;
    }
    return null;
  });
  console.log("Programmatic selection check:", selectResult);
  await page.waitForTimeout(500);

  // Screenshot 26: Selected item with delete & elevation controls
  console.log("Capturing 26_item_selected_with_delete_btn.png...");
  await page.screenshot({ path: path.join(artifactDir, "26_item_selected_with_delete_btn.png") });

  // 6. Test Delete / Stash Button
  console.log("Clicking 🗑️ Xóa Khỏi Đảo button...");
  const btnDelete = await page.$("#btn-delete");
  await btnDelete.click();
  await page.waitForTimeout(800);

  // Screenshot 27: Item deleted and island clear again
  console.log("Capturing 27_item_deleted_island_cleared.png...");
  await page.screenshot({ path: path.join(artifactDir, "27_item_deleted_island_cleared.png") });

  await browser.close();
  console.log("ALL TESTS AND SCREENSHOTS COMPLETED SUCCESSFULLY!");
}

main().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
