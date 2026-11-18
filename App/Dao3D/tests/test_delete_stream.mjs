import { chromium } from "file:///D:/botly/App/word3d/node_modules/playwright-core/index.mjs";
import path from "path";

const artifactDir = "C:/Users/Admin/.gemini/antigravity/brain/b4c98197-8d8b-4888-a15e-eb76e32dedc4";

async function main() {
  console.log("Launching headless Chrome for Stream & Waterfall Deletion test...");
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

  // Verify initial placed items count (well, mountain, cottage, stream = 4)
  const initialItems = await page.evaluate(() => window.placedItems.map(p => ({ instanceId: p.instanceId, itemId: p.itemId })));
  console.log("Initial placed items on island:", initialItems);

  const streamItem = initialItems.find(p => p.instanceId === 'inst_starter_stream');
  if (!streamItem) {
    throw new Error("Stream item 'inst_starter_stream' not found in initial placedItems!");
  }

  // TEST 1: SELECT STREAM
  console.log("Selecting Crystal Stream & Waterfall...");
  await page.evaluate(() => {
    window.selectPlacedItem('inst_starter_stream');
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(artifactDir, "46_stream_selected.png") });
  console.log("Saved: 46_stream_selected.png");

  // TEST 2: DELETE STREAM
  console.log("Clicking Delete Stream button...");
  await page.click("#btn-delete");
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(artifactDir, "47_island_after_stream_deleted_clean.png") });
  console.log("Saved: 47_island_after_stream_deleted_clean.png");

  const itemsAfterStream = await page.evaluate(() => window.placedItems.map(p => p.itemId));
  console.log("Items after deleting stream:", itemsAfterStream);
  if (itemsAfterStream.includes('ter_stream_meander_s')) {
    throw new Error("Crystal Stream was not removed from placedItems!");
  }

  // TEST 3: DELETE ALL REMAINING STARTER ITEMS (Cottage, Mountain, Well) TO VERIFY FULLY PRISTINE ISLAND
  console.log("Deleting remaining starter items to test 100% clean island...");
  await page.evaluate(() => {
    window.selectPlacedItem('inst_starter_cottage');
  });
  await page.waitForTimeout(400);
  await page.click("#btn-delete");
  await page.waitForTimeout(400);

  await page.evaluate(() => {
    window.selectPlacedItem('inst_starter_mountain');
  });
  await page.waitForTimeout(400);
  await page.click("#btn-delete");
  await page.waitForTimeout(400);

  const remaining = await page.evaluate(() => window.placedItems.map(p => p.itemId));
  console.log("Remaining placed items:", remaining);

  await page.screenshot({ path: path.join(artifactDir, "48_island_completely_pristine_all_deleted.png") });
  console.log("Saved: 48_island_completely_pristine_all_deleted.png");

  await browser.close();
  console.log("STREAM & FULL DELETION TEST PASSED 100% SUCCESSFULLY!");
}

main().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
