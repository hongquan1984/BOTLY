import { chromium } from "file:///D:/botly/App/word3d/node_modules/playwright-core/index.mjs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const previewUrl = `file:///${path.resolve(__dirname, '../preview.html').replace(/\\/g, '/')}`;
const artifactDir = "C:/Users/Admin/.gemini/antigravity/brain/b4c98197-8d8b-4888-a15e-eb76e32dedc4";

async function capture() {
  console.log("=== CAPTURING HEALTHCLUES MY ISLAND 3D SCREENSHOTS ===");
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    args: ["--no-sandbox", "--disable-gpu-sandbox", "--allow-file-access-from-files", "--disable-web-security"],
  });

  const context = await browser.newContext({
    viewport: { width: 420, height: 880 }, // iPhone/Android mobile portrait
    deviceScaleFactor: 2,
  });

  const page = await context.newPage();

  console.log(`Navigating to ${previewUrl}...`);
  await page.goto(previewUrl, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  // 1. Capture Lumi Welcome Modal
  console.log("1. Capturing 01_lumi_welcome_modal.png...");
  await page.screenshot({ path: path.join(artifactDir, "01_lumi_welcome_modal.png") });

  // Accept Lumi Gift
  console.log("Accepting Lumi gift...");
  await page.click("#btn-accept-lumi");
  await page.waitForTimeout(800);

  // 2. Capture Pristine Island Overview (1 house, 1 mountain, 1 stream, empty land)
  console.log("2. Capturing 02_pristine_floating_island.png...");
  await page.screenshot({ path: path.join(artifactDir, "02_pristine_floating_island.png") });

  // 3. Open Shop Modal
  console.log("3. Opening Shop Modal...");
  await page.click("#btn-open-shop");
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(artifactDir, "03_decor_shop_modal.png") });

  // Buy Ancient Well (deducts coins)
  console.log("Buying item in shop...");
  const buyBtns = await page.$$("#shop-item-list .action-btn");
  if (buyBtns.length > 0) {
    await buyBtns[0].click();
  }
  await page.waitForTimeout(500);

  // Close Shop
  await page.click("#btn-close-shop");
  await page.waitForTimeout(400);

  // 4. Open Inventory & Start Placing
  console.log("4. Opening Inventory and selecting item to place...");
  await page.click("#btn-open-inv");
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(artifactDir, "04_inventory_modal.png") });

  const placeBtns = await page.$$("#inv-item-list .action-btn");
  if (placeBtns.length > 0) {
    await placeBtns[0].click();
  }
  await page.waitForTimeout(600);

  // 5. Capture Placement Mode with Cursor & Controls
  console.log("5. Capturing 05_decoration_placement_mode.png...");
  await page.screenshot({ path: path.join(artifactDir, "05_decoration_placement_mode.png") });

  // Rotate & Confirm Placement
  await page.click("#btn-rotate");
  await page.waitForTimeout(300);
  await page.click("#btn-confirm");
  await page.waitForTimeout(600);

  // 6. Capture Island with Placed Decoration
  console.log("6. Capturing 06_island_with_placed_decoration.png...");
  await page.screenshot({ path: path.join(artifactDir, "06_island_with_placed_decoration.png") });

  await browser.close();
  console.log("=== ALL CAPTURES COMPLETED SUCCESSFULLY ===");
}

capture().catch((err) => {
  console.error("Error capturing views:", err);
  process.exit(1);
});
