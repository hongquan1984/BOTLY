import { chromium } from "file:///D:/botly/App/word3d/node_modules/playwright-core/index.mjs";
import path from "path";

const artifactDir = "C:/Users/Admin/.gemini/antigravity/brain/b4c98197-8d8b-4888-a15e-eb76e32dedc4";

async function main() {
  console.log("Launching headless Chrome for House & Mountain Deletion test...");
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

  // Verify initial placed items count (well, mountain, cottage = 3)
  const initialItems = await page.evaluate(() => window.placedItems.map(p => p.itemId));
  console.log("Initial placed items on island:", initialItems);

  // Capture Screenshot 1: Island with house and mountain present
  await page.screenshot({ path: path.join(artifactDir, "41_island_initial_with_house_and_mountain.png") });
  console.log("Saved: 41_island_initial_with_house_and_mountain.png");

  // TEST 1: SELECT & DELETE STARTER HOUSE
  console.log("Selecting Starter Wooden Cottage...");
  await page.evaluate(() => {
    window.selectPlacedItem('inst_starter_cottage');
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(artifactDir, "42_starter_house_selected.png") });
  console.log("Saved: 42_starter_house_selected.png");

  console.log("Clicking Delete House button...");
  await page.click("#btn-delete");
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(artifactDir, "43_island_after_house_deleted.png") });
  console.log("Saved: 43_island_after_house_deleted.png");

  const itemsAfterHouse = await page.evaluate(() => window.placedItems.map(p => p.itemId));
  console.log("Items after deleting house:", itemsAfterHouse);
  if (itemsAfterHouse.includes('bld_starter_cottage')) {
    throw new Error("Starter house was not removed from placedItems!");
  }

  // TEST 2: SELECT & DELETE ALPINE MOUNTAIN
  console.log("Selecting Alpine Mountain...");
  await page.evaluate(() => {
    window.selectPlacedItem('inst_starter_mountain');
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(artifactDir, "44_mountain_selected.png") });
  console.log("Saved: 44_mountain_selected.png");

  console.log("Clicking Delete Mountain button...");
  await page.click("#btn-delete");
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(artifactDir, "45_island_after_mountain_deleted_clean.png") });
  console.log("Saved: 45_island_after_mountain_deleted_clean.png");

  const itemsAfterMountain = await page.evaluate(() => window.placedItems.map(p => p.itemId));
  console.log("Items after deleting mountain:", itemsAfterMountain);
  if (itemsAfterMountain.includes('ter_snowy_mountain')) {
    throw new Error("Alpine mountain was not removed from placedItems!");
  }

  await browser.close();
  console.log("HOUSE & MOUNTAIN DELETION TEST PASSED 100% SUCCESSFULLY!");
}

main().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
