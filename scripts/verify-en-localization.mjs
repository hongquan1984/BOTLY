import path from "path";
import fs from "fs";
import { chromium } from "file:///d:/botly/App/word3d/node_modules/playwright-core/index.mjs";

const ARTIFACTS_DIR = "C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb";

async function run() {
  console.log("=== HEALTHCLUES — FULL ENGLISH LOCALIZATION VERIFICATION ===");
  const chromePath = "C:/Program Files/Google/Chrome/Application/chrome.exe";
  const browser = await chromium.launch({
    executablePath: chromePath,
    headless: true,
    args: ["--no-sandbox", "--disable-web-security", "--autoplay-policy=no-user-gesture-required"],
  });

  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });

  const page = await context.newPage();
  page.on("console", (msg) => console.log("[BROWSER]", msg.text()));

  // 1. Initialize English locale and completed state
  await page.goto("http://localhost:8081");
  await page.evaluate(() => {
    localStorage.setItem("@healthclues_locale", "en");
    localStorage.setItem("healthclues_locale", "en");
    localStorage.setItem("healthclues-onboarding-completed", "true");
    localStorage.setItem("@healthclues_quiz_completed", "true");
    localStorage.setItem("healthclues_realm_mode_v1", "healthclues-realm");
    localStorage.setItem("healthclues-village-cinematic-tour-v1", "true");
    localStorage.setItem("healthclues-post-tour-roadmap-reviewed-v1", "true");
    localStorage.setItem("healthclues-active-tour-step", "-1");
    localStorage.setItem("healthclues_mascot_guide_step_v1", "99");
    localStorage.setItem("healthclues_mascot_dismissed_v1", "true");
    localStorage.setItem("healthclues-interactive-spotlight-tour-v4", "true");
    // Seed some items in bag
    localStorage.setItem("hc_mobile_toolkit_sounds", JSON.stringify(["binaural_432", "rain"]));
    localStorage.setItem("hc_mobile_toolkit_breaths", JSON.stringify(["breath_478"]));
    localStorage.setItem("hc_mobile_botanical_bookmarks", JSON.stringify(["matricaria-chamomilla"]));
  });

  // Navigate to World screen in English
  await page.goto("http://localhost:8081/(game)/world", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3500);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "qa_en_world_screen.png") });
  console.log("Saved qa_en_world_screen.png");

  // 2. Open House 1: Nhà Âm Thanh (Sound Garden)
  console.log("--- Opening Sound Garden Modal in English ---");
  await page.evaluate(() => {
    window.postMessage(JSON.stringify({
      version: "HEALTHCLUES_WORLD3D_V3",
      source: "word3d",
      type: "INTERACT_BUILDING",
      buildingInstanceId: "bld_bookshop",
      landmarkId: "sound_garden",
      actionId: "OPEN_SOUND_GARDEN"
    }), "*");
  });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "qa_en_sound_garden_modal.png") });
  console.log("Saved qa_en_sound_garden_modal.png");

  // Close Sound Garden Modal
  await page.evaluate(() => {
    if (typeof window.__CLOSE_ALL_MODALS__ === "function") {
      window.__CLOSE_ALL_MODALS__();
    }
  });
  await page.waitForTimeout(600);

  // 3. Open House 2: Thiền Đường - Hơi Thở (Zen Breath Sanctuary)
  console.log("--- Opening Zen Breath Modal in English ---");
  await page.evaluate(() => {
    window.postMessage(JSON.stringify({
      version: "HEALTHCLUES_WORLD3D_V3",
      source: "word3d",
      type: "INTERACT_BUILDING",
      buildingInstanceId: "bld_great_hall",
      landmarkId: "zen_breath",
      actionId: "OPEN_ZEN_BREATH"
    }), "*");
  });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "qa_en_zen_breath_modal.png") });
  console.log("Saved qa_en_zen_breath_modal.png");

  // Close Zen Breath Modal
  await page.evaluate(() => {
    if (typeof window.__CLOSE_ALL_MODALS__ === "function") {
      window.__CLOSE_ALL_MODALS__();
    }
  });
  await page.waitForTimeout(600);

  // 4. Open House 3: Nhà Thảo Mộc (Herbal Garden)
  console.log("--- Opening Herbal Garden Modal in English ---");
  await page.evaluate(() => {
    window.postMessage(JSON.stringify({
      version: "HEALTHCLUES_WORLD3D_V3",
      source: "word3d",
      type: "INTERACT_BUILDING",
      buildingInstanceId: "bld_potion_shop",
      landmarkId: "herbal_garden",
      actionId: "OPEN_HERBAL_GARDEN"
    }), "*");
  });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "qa_en_herbal_garden_modal.png") });
  console.log("Saved qa_en_herbal_garden_modal.png");

  // Close Herbal Garden Modal
  await page.evaluate(() => {
    if (typeof window.__CLOSE_ALL_MODALS__ === "function") {
      window.__CLOSE_ALL_MODALS__();
    }
  });
  await page.waitForTimeout(600);

  // 5. Navigate to Backpack Sounds tab
  console.log("--- Navigating to Backpack Sounds Tab ---");
  await page.goto("http://localhost:8081/(game)/inventory?tab=sounds", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  // Click PLAY on the first sound track to activate master playback bar
  const playBtn = page.getByText("PLAY").first().or(page.getByText("BẬT").first());
  if (await playBtn.isVisible()) {
    await playBtn.click({ force: true });
    await page.waitForTimeout(800);
  }
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "qa_en_inventory_sounds.png") });
  console.log("Saved qa_en_inventory_sounds.png");

  // 6. Navigate to Backpack Breaths tab
  console.log("--- Navigating to Backpack Breaths Tab ---");
  await page.goto("http://localhost:8081/(game)/inventory?tab=breath", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "qa_en_inventory_breath.png") });
  console.log("Saved qa_en_inventory_breath.png");

  // 7. Navigate to Backpack Herbs tab
  console.log("--- Navigating to Backpack Herbs Tab ---");
  await page.goto("http://localhost:8081/(game)/inventory?tab=herbs", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "qa_en_inventory_herbs.png") });
  console.log("Saved qa_en_inventory_herbs.png");

  // 8. Navigate to Profile
  console.log("--- Navigating to Profile Screen ---");
  await page.goto("http://localhost:8081/(game)/profile", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "qa_en_profile.png") });
  console.log("Saved qa_en_profile.png");

  // 9. Navigate to Journey
  console.log("--- Navigating to Journey Screen ---");
  await page.goto("http://localhost:8081/(game)/journey", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "qa_en_journey.png") });
  console.log("Saved qa_en_journey.png");

  // 10. Navigate to Daily Care
  console.log("--- Navigating to Daily Care Screen ---");
  await page.goto("http://localhost:8081/(game)/daily-care", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "qa_en_daily_care.png") });
  console.log("Saved qa_en_daily_care.png");

  // 11. Navigate to Home
  console.log("--- Navigating to Home Screen ---");
  await page.goto("http://localhost:8081/(game)/home", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "qa_en_home.png") });
  console.log("Saved qa_en_home.png");

  await browser.close();
  console.log("=== ALL QA SCREENSHOTS COMPLETED! ===");
}

run().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});
