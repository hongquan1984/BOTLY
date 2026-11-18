import { chromium } from "file:///D:/botly/App/word3d/node_modules/playwright-core/index.mjs";
import path from "path";

const artifactDir = "C:/Users/Admin/.gemini/antigravity/brain/b4c98197-8d8b-4888-a15e-eb76e32dedc4";

async function main() {
  console.log("Launching headless Chrome for React Chalet & Island test...");
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    args: ["--no-sandbox", "--disable-gpu-sandbox"],
  });

  const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  const page = await context.newPage();

  // Listen to console errors
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      console.error("BROWSER ERROR:", msg.text());
    } else {
      console.log("BROWSER LOG:", msg.text());
    }
  });
  page.on("pageerror", (err) => {
    console.error("UNCAUGHT EXCEPTION:", err.message);
  });

  console.log("Navigating to http://localhost:3355/ ...");
  await page.goto("http://localhost:3355/", { waitUntil: "domcontentloaded", timeout: 20000 });
  await page.waitForTimeout(2500);

  // 1. Verify React root and UI elements
  const root = await page.$("#root");
  if (!root) {
    throw new Error("React root (#root) not found or not rendered!");
  }
  console.log("React #root mounted successfully!");

  // Capture Screenshot 1: Island Exterior Mode
  await page.screenshot({ path: path.join(artifactDir, "32_island_exterior_chalet_react.png") });
  console.log("Saved: 32_island_exterior_chalet_react.png");

  // 2. Click Living Room Tab (#tab-overview)
  console.log("Switching to Living Room interior...");
  await page.click("#tab-overview");
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(artifactDir, "33_living_room_interior_view.png") });
  console.log("Saved: 33_living_room_interior_view.png");

  // 3. Click Kitchen Tab (#tab-kitchen)
  console.log("Switching to Kitchen interior...");
  await page.click("#tab-kitchen");
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(artifactDir, "34_kitchen_interior_view.png") });
  console.log("Saved: 34_kitchen_interior_view.png");

  // 4. Click Bedroom Tab (#tab-bedroom)
  console.log("Switching to Bedroom interior...");
  await page.click("#tab-bedroom");
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(artifactDir, "35_bedroom_interior_view.png") });
  console.log("Saved: 35_bedroom_interior_view.png");

  // 5. Click Bathroom Tab (#tab-bathroom)
  console.log("Switching to Spa Bathroom interior...");
  await page.click("#tab-bathroom");
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(artifactDir, "36_bathroom_interior_view.png") });
  console.log("Saved: 36_bathroom_interior_view.png");

  // 6. Click 3/4 Dollhouse Cutaway Tab (#tab-view34)
  console.log("Switching to 3/4 Dollhouse Cutaway...");
  await page.click("#tab-view34");
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(artifactDir, "37_dollhouse_3_4_cutaway_view.png") });
  console.log("Saved: 37_dollhouse_3_4_cutaway_view.png");

  // 7. Interactive toggles: Doors, Lights & Fireplace
  console.log("Toggling sliding doors and fireplace...");
  await page.click("#btn-toggle-door");
  await page.waitForTimeout(600);
  await page.click("#btn-toggle-lights");
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(artifactDir, "38_chalet_toggles_doors_and_lights.png") });
  console.log("Saved: 38_chalet_toggles_doors_and_lights.png");

  // 8. Select an indoor item from Decor Tray
  console.log("Selecting indoor furniture item from decor tray...");
  const firstChip = await page.$(".decor-chip");
  if (firstChip) {
    await firstChip.click();
    await page.waitForTimeout(600);
  }

  // 9. Side tools: Elevate up and rotate
  console.log("Testing side elevation & rotation controls...");
  await page.click("#btn-elevate-up");
  await page.waitForTimeout(400);
  await page.click("#btn-rotate-item");
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(artifactDir, "39_indoor_decor_selection_and_side_tools.png") });
  console.log("Saved: 39_indoor_decor_selection_and_side_tools.png");

  // 10. Open Shop Modal
  console.log("Opening Shop Modal...");
  await page.click("#btn-open-shop", { force: true });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(artifactDir, "40_chalet_react_shop_modal.png") });
  console.log("Saved: 40_chalet_react_shop_modal.png");

  await browser.close();
  console.log("ALL TESTS COMPLETED SUCCESSFULLY!");
}

main().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
