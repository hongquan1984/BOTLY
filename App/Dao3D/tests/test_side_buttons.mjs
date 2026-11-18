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

  await page.goto("http://localhost:3355/", { waitUntil: "domcontentloaded", timeout: 15000 });
  await page.waitForTimeout(1000);

  // Close Lumi modal
  const lumiBtn = await page.$("#btn-accept-lumi");
  if (lumiBtn && await lumiBtn.isVisible()) {
    await lumiBtn.click();
    await page.waitForTimeout(600);
  }

  // Click side-btn-up
  console.log("Clicking side-btn-up...");
  await page.click("#side-btn-up");
  await page.waitForTimeout(400);

  const badgeText = await page.$eval("#side-elevation-badge", el => el.textContent);
  console.log("Side badge text after up:", badgeText);

  // Click side-btn-del
  console.log("Clicking side-btn-del...");
  await page.click("#side-btn-del");
  await page.waitForTimeout(600);

  console.log("Capturing 29_after_clicking_side_delete_button.png...");
  await page.screenshot({ path: path.join(artifactDir, "29_after_clicking_side_delete_button.png") });

  await browser.close();
  console.log("Verification finished successfully!");
}

main().catch(err => {
  console.error("Failed:", err);
  process.exit(1);
});
