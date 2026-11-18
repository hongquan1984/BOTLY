import { chromium } from "file:///d:/botly/App/3DHOME/node_modules/playwright-core/index.mjs";
import fs from "fs";
import path from "path";

const ARTIFACT_DIR = "C:\\Users\\Admin\\.gemini\\antigravity\\brain\\657e9da8-7551-4202-bc28-ecfcfda170bb\\spotlight_mascot_audit";

async function verifyModal() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    args: ["--no-sandbox", "--disable-gpu-sandbox"],
  });

  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    hasTouch: true,
    isMobile: true,
  });

  const page = await context.newPage();

  // Set onboarding completed
  await page.goto("http://localhost:8081/(onboarding)/quiz", { waitUntil: "networkidle" });
  await page.evaluate(() => {
    localStorage.setItem("healthclues-onboarding-completed", "true");
    localStorage.setItem("healthclues-interactive-spotlight-tour-v3", "true");
  });

  // Navigate to World
  await page.goto("http://localhost:8081/(game)/world", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);

  // Click on "Phá Án" on the World HUD
  const phaAnBtn = page.locator('text="Phá Án"').first();
  if (await phaAnBtn.isVisible({ timeout: 3000 })) {
    console.log("Clicking Phá Án button on World HUD...");
    await phaAnBtn.click({ force: true });
  }

  // Wait for detective modal & iframe to load
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "13_detective_webview_modal_verified.png") });
  console.log("Saved 13_detective_webview_modal_verified.png");

  await browser.close();
}

verifyModal().catch(console.error);
