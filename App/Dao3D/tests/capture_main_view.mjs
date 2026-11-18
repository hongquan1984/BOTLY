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

  // Close Lumi welcome modal
  const lumiBtn = await page.$("#btn-accept-lumi");
  if (lumiBtn && await lumiBtn.isVisible()) {
    await lumiBtn.click();
    await page.waitForTimeout(600);
  }

  console.log("Capturing 28_always_visible_controls_on_main_screen.png...");
  await page.screenshot({ path: path.join(artifactDir, "28_always_visible_controls_on_main_screen.png") });

  await browser.close();
  console.log("Done!");
}

main().catch(err => {
  console.error("Failed:", err);
  process.exit(1);
});
