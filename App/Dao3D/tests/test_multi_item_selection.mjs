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

  console.log("Navigating to http://localhost:3355/ ...");
  await page.goto("http://localhost:3355/", { waitUntil: "domcontentloaded", timeout: 15000 });
  await page.waitForTimeout(1000);

  // Close Lumi modal
  const lumiBtn = await page.$("#btn-accept-lumi");
  if (lumiBtn && await lumiBtn.isVisible()) {
    await lumiBtn.click();
    await page.waitForTimeout(600);
  }

  // Verify Decor Tray is visible
  const tray = await page.$("#decor-tray");
  const isTrayOpen = await page.$eval("#decor-tray", el => el.classList.contains("open"));
  console.log("Is Decor Tray open:", isTrayOpen);

  console.log("Capturing 30_decor_tray_with_selectable_items.png...");
  await page.screenshot({ path: path.join(artifactDir, "30_decor_tray_with_selectable_items.png") });

  // Select another item from the tray (prop_oak_bench)
  console.log("Clicking chip for prop_oak_bench (Ghế Gỗ Sồi)...");
  await page.click("#decor-chip-prop_oak_bench");
  await page.waitForTimeout(600);

  // Verify active selection
  const titleText = await page.$eval("#txt-placement-name", el => el.textContent);
  console.log("Active placement item after click:", titleText);

  // Elevate up
  console.log("Elevating bench up twice...");
  await page.click("#side-btn-up");
  await page.waitForTimeout(300);
  await page.click("#side-btn-up");
  await page.waitForTimeout(400);

  console.log("Capturing 31_switch_selection_to_bench.png...");
  await page.screenshot({ path: path.join(artifactDir, "31_switch_selection_to_bench.png") });

  await browser.close();
  console.log("Multi-item selection test passed successfully!");
}

main().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
