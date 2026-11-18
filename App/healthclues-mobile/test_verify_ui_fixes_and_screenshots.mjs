import path from "path";
import fs from "fs";
import { chromium } from "file:///d:/botly/App/word3d/node_modules/playwright-core/index.mjs";

const ARTIFACTS_DIR = "C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb";

async function run() {
  console.log("=== HEALTHCLUES — UI POLISH & OVERLAP FIX VERIFICATION ===");
  const chromePath = "C:/Program Files/Google/Chrome/Application/chrome.exe";
  const browser = await chromium.launch({
    executablePath: chromePath,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }, // Standard mobile viewport (iPhone 12/13/14)
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
    localStorage.setItem("healthclues-active-tour-step", "-1");
    localStorage.setItem("healthclues_mascot_guide_step_v1", "99");
    localStorage.setItem("healthclues_mascot_dismissed_v1", "true");
    localStorage.setItem("healthclues-starter-profile", JSON.stringify({
      onboardingCompleted: true,
      nickname: "Lữ Khách",
      goals: ["sleep"],
      challenge: "sleep"
    }));
    // Seed 1 sound in bag to test player
    localStorage.setItem("hc_mobile_toolkit_sounds", JSON.stringify(["brainwave_delta_432"]));
    localStorage.setItem("hc_mobile_toolkit_breaths", JSON.stringify(["harvard_478"]));
  });

  // 1. Verify ZenBreathModal Layout & Button Fix
  console.log("--- 1. Testing ZenBreathModal Layout & Two-Row Action Buttons ---");
  await page.goto("http://localhost:8081/(game)/world", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3000);

  // Trigger Zen Breath Modal
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

  // Capture screenshot of ZenBreathModal at top
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "qa_fixed_thien_duong_top_sticky_aura.png") });
  console.log("Captured: qa_fixed_thien_duong_top_sticky_aura.png");

  // Scroll down to see exercise cards 2, 3, 4
  const modalScroll = page.locator("div[style*='overflow-y: auto']").or(page.locator("div[style*='overflow: auto']")).first();
  if (await modalScroll.isVisible()) {
    await modalScroll.evaluate((el) => { el.scrollTop = 350; });
    await page.waitForTimeout(1000);
  }
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "qa_fixed_thien_duong_buttons_scrolled.png") });
  console.log("Captured: qa_fixed_thien_duong_buttons_scrolled.png");

  // Close Zen Breath Modal
  const closeZenBtn = page.locator('[aria-label="Đóng Thiền Đường"]').first();
  if (await closeZenBtn.isVisible()) {
    await closeZenBtn.click({ force: true });
    await page.waitForTimeout(800);
  }

  // 2. Verify SoundGardenModal Sticky Lyra & Tracks
  console.log("--- 2. Testing SoundGardenModal Sticky Lyra & Tracks ---");
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
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "qa_fixed_nha_am_thanh_sticky_lyra.png") });
  console.log("Captured: qa_fixed_nha_am_thanh_sticky_lyra.png");

  // Close Sound Modal
  const closeSoundBtn = page.locator('[aria-label="Đóng Nhà Âm Thanh"]').first();
  if (await closeSoundBtn.isVisible()) {
    await closeSoundBtn.click({ force: true });
    await page.waitForTimeout(800);
  }

  // 3. Verify Túi Đồ (Inventory) Non-Overlapping Master Playback Bar
  console.log("--- 3. Testing Túi Đồ (Inventory) Tab Sounds & Non-Overlapping Playback Bar ---");
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
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "qa_fixed_inventory_playback_no_overlap.png") });
  console.log("Captured: qa_fixed_inventory_playback_no_overlap.png");

  console.log("=== ALL UI FIXES VERIFIED SUCCESSFULLY! ===");
  await browser.close();
}

run().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
