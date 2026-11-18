import path from "path";
import { chromium } from "file:///d:/botly/App/word3d/node_modules/playwright-core/index.mjs";

const ARTIFACTS_DIR = "C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb";

async function main() {
  console.log("=== FINAL VERIFICATION: CUTE 3D CHARACTER, FORWARD WALKING, CLEAN TOUR & FREE-ROAM ===");

  const browser = await chromium.launch({
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true,
    args: ["--no-sandbox", "--disable-web-security"],
  });

  const context = await browser.newContext({
    viewport: { width: 412, height: 869 },
    deviceScaleFactor: 2,
  });

  const page = await context.newPage();

  // 1. Verify 5173 3D world directly
  console.log("1. Testing 5173 direct 3D view...");
  await page.goto("http://localhost:5173/?mode=player", { waitUntil: "networkidle" });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "final_01_5173_spawn.png") });

  // Click on ground near stone bridge
  console.log("   Clicking ground to walk forward...");
  await page.mouse.click(206, 450);
  await page.waitForTimeout(700);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "final_02_5173_walking.png") });
  await page.waitForTimeout(1600);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "final_03_5173_arrived.png") });

  // 2. Verify 8081 Mobile Web App
  console.log("2. Testing 8081 mobile app in world...");
  await page.goto("http://localhost:8081/quiz", { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);

  // Click welcome
  const startBtn = page.locator("[aria-label='welcome-start-btn']");
  if (await startBtn.isVisible()) {
    await startBtn.click();
  } else {
    await page.getByText("Bắt Đầu Hành Trình").first().click();
  }
  await page.waitForTimeout(2000);

  // Skip story if visible
  const skipStoryBtn = page.getByText("Bỏ qua").first();
  if (await skipStoryBtn.isVisible()) {
    await skipStoryBtn.click();
    await page.waitForTimeout(1500);
  }

  // Pick sleep
  const sleepChoice = page.locator("[aria-label='quick-focus-sleep']");
  if (await sleepChoice.isVisible()) {
    await sleepChoice.click();
  } else {
    await page.getByText("Mất ngủ").first().click();
  }
  await page.waitForTimeout(1000);

  // Next 1
  const discNext1 = page.locator("[aria-label='discovery-step1-next']");
  if (await discNext1.isVisible()) {
    await discNext1.click();
    await page.waitForTimeout(1500);
  }

  // Analyze
  const discAnalyze = page.locator("[aria-label='discovery-analyze-btn']");
  if (await discAnalyze.isVisible()) {
    await discAnalyze.click();
    await page.waitForTimeout(2500);
  }

  // Enter realm
  const enterRealm = page.locator("[aria-label='onboarding-enter-world-btn']");
  if (await enterRealm.isVisible()) {
    await enterRealm.click();
    await page.waitForTimeout(2000);
  }

  // Enter world
  const enterWorld = page.locator("[aria-label='mascot-enter-healthclues-realm-btn']");
  if (await enterWorld.isVisible()) {
    await enterWorld.click();
    await page.waitForTimeout(4000);
  }

  console.log("   Arrived at world:", page.url());
  await page.waitForTimeout(4000);

  // Tour Step 0 (Overview) - take screenshot
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "final_04_tour_step0_top.png") });

  // Advance through stops 1 to 6
  for (let s = 1; s <= 6; s++) {
    const nextBtn = page.getByText("Tiếp tục").last();
    if (await nextBtn.isVisible()) {
      await nextBtn.click();
      await page.waitForTimeout(1200);
    }
  }

  // Tour Step 7: Ready to explore
  console.log("   Capturing Tour Step 7 (Ready to explore)...");
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "final_05_tour_step7_ready.png") });

  // Click "Bắt đầu khám phá"
  console.log("   Clicking 'Bắt đầu khám phá'...");
  const finishBtn = page.getByText("Bắt đầu khám phá").last();
  if (await finishBtn.isVisible()) {
    await finishBtn.click();
    await page.waitForTimeout(1500);
  }

  // Free roam clean view
  console.log("   Capturing clean free-roam world...");
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "final_06_mobile_freeroam_clean.png") });

  // Tap ground in mobile view to make cute character walk
  console.log("   Tapping ground to make cute character walk in mobile app...");
  await page.mouse.click(206, 420);
  await page.waitForTimeout(700);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "final_07_mobile_character_walk.png") });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "final_08_mobile_character_arrived.png") });

  await browser.close();
  console.log("=== FINAL VERIFICATION ALL COMPLETED SUCCESSFULLY ===");
}

main().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
