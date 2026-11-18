import path from "path";
import fs from "fs";
import { chromium } from "file:///d:/botly/App/word3d/node_modules/playwright-core/index.mjs";

const ARTIFACTS_DIR = "C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb";

async function run() {
  console.log("=== CAPTURING FIXED INVENTORY PLAYBACK (NO OVERLAP) ===");
  const chromePath = "C:/Program Files/Google/Chrome/Application/chrome.exe";
  const browser = await chromium.launch({
    executablePath: chromePath,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2
  });

  const page = await context.newPage();

  // Seed storage
  await page.goto("http://localhost:8081");
  await page.evaluate(() => {
    localStorage.setItem("healthclues-onboarding-completed", "true");
    localStorage.setItem("@healthclues_quiz_completed", "true");
    localStorage.setItem("healthclues_realm_mode_v1", "healthclues-realm");
    localStorage.setItem("healthclues-village-cinematic-tour-v1", "true");
    localStorage.setItem("healthclues-post-tour-roadmap-reviewed-v1", "true");
    localStorage.setItem("healthclues-interactive-spotlight-tour-v4", "true");
    localStorage.setItem("healthclues-active-tour-step", "-1");
    localStorage.setItem("healthclues_mascot_guide_step_v1", "99");
    localStorage.setItem("healthclues_mascot_dismissed_v1", "true");
    localStorage.setItem("healthclues-starter-profile", JSON.stringify({
      onboardingCompleted: true,
      nickname: "Lữ Khách",
      goals: ["sleep"],
      challenge: "sleep"
    }));
    // Seed Delta 432Hz in bag
    localStorage.setItem("hc_mobile_toolkit_sounds", JSON.stringify(["binaural_432"]));
  });

  await page.goto("http://localhost:8081/(game)/inventory?tab=sounds", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);

  // Turn ON Delta 432Hz
  const playBtn = page.getByText("BẬT", { exact: false }).first();
  if (await playBtn.isVisible()) {
    await playBtn.click({ force: true });
    await page.waitForTimeout(1500);
    console.log("Turned ON Delta 432Hz sound track!");
  }

  // Capture screenshot of inventory with sound playing and volume slider
  const targetPath = path.join(ARTIFACTS_DIR, "qa_fixed_inventory_playback_no_overlap.png");
  await page.screenshot({ path: targetPath });
  console.log("Captured:", targetPath);

  await browser.close();
}

run().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
