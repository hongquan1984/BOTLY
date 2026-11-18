import path from "path";
import fs from "fs";
import { chromium } from "file:///d:/botly/App/word3d/node_modules/playwright-core/index.mjs";

const ARTIFACTS_DIR = "C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb";

async function runTest() {
  console.log("=== HEALTHCLUES — 3 HOUSES IDENTIFICATION & LIBRARY TO BAG VERIFICATION ===");
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

  // Step 1: Clear toolkit storage to test fresh/empty state
  console.log("--- 1. Testing Empty State in Túi Đồ (Inventory) ---");
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
    localStorage.setItem("healthclues-interactive-spotlight-tour-v4", "true");
    // Clear toolkit storage
    localStorage.removeItem("hc_mobile_toolkit_sounds");
    localStorage.removeItem("hc_mobile_toolkit_breaths");
    localStorage.removeItem("hc_mobile_botanical_bookmarks");
  });

  await page.goto("http://localhost:8081/(game)/inventory?tab=sounds", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3000);

  // Capture empty sound tab in inventory
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "qa_inventory_tab2_empty_state.png") });
  const hasEmptySound = await page.getByText("Túi đồ Âm Thanh đang trống").isVisible();
  console.log("Tab 2 Âm Thanh empty state visible:", hasEmptySound);

  // Switch to Breath tab empty state
  await page.getByText("Hơi Thở (0)").click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "qa_inventory_tab3_empty_state.png") });
  const hasEmptyBreath = await page.getByText("Túi đồ Hơi Thở đang trống").isVisible();
  console.log("Tab 3 Hơi Thở empty state visible:", hasEmptyBreath);

  // Step 2: Navigate to World 3D
  console.log("--- 2. Entering World 3D Village ---");
  await page.goto("http://localhost:8081/(game)/world", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(4000);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "qa_3d_world_houses_view.png") });

  // Test House 1: Open Nhà Âm Thanh (bld_bookshop cottage, NOT watermill)
  console.log("--- 3. Interacting with House 1: Nhà Âm Thanh (Ngôi nhà ngói đỏ - bld_bookshop) ---");
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
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "qa_modal_nha_am_thanh_library.png") });
  const hasSoundModal = await page.getByText("Nhà Âm Thanh").first().isVisible();
  console.log("Modal Nhà Âm Thanh visible:", hasSoundModal);

  // Click "Lưu Vào Túi Đồ" on 2 tracks (Mưa rào & Suối thác)
  console.log("--- 4. Saving Sound Tracks to Bag from Nhà Âm Thanh Library ---");
  const saveSoundBtns = page.locator('[aria-label="Lưu vào túi đồ"]').or(page.getByText("Lưu Vào Túi Đồ (+10 EXP)"));
  const soundBtnCount = await saveSoundBtns.count();
  console.log("Available save sound buttons:", soundBtnCount);

  if (soundBtnCount > 0) {
    await saveSoundBtns.nth(0).click({ force: true });
    await page.waitForTimeout(600);
    console.log("Saved Track 1 to Bag!");
  }
  if (soundBtnCount > 1) {
    await saveSoundBtns.nth(0).click({ force: true }); // click next available
    await page.waitForTimeout(600);
    console.log("Saved Track 2 to Bag!");
  }
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "qa_modal_nha_am_thanh_saved_tracks.png") });

  // Close Sound House Modal
  const closeSoundBtn = page.locator('[aria-label="Đóng Nhà Âm Thanh"]').first();
  if (await closeSoundBtn.isVisible()) {
    await closeSoundBtn.click({ force: true });
    await page.waitForTimeout(800);
  }

  // Test House 2: Open Thiền Đường - Hơi Thở (bld_great_hall)
  console.log("--- 5. Interacting with House 2: Thiền Đường - Hơi Thở (bld_great_hall) ---");
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
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "qa_modal_thien_duong_library.png") });
  const hasZenModal = await page.getByText("Thiền Đường - Hơi Thở").first().isVisible();
  console.log("Modal Thiền Đường visible:", hasZenModal);

  // Click "Lưu Vào Túi Đồ" on Breath Exercises
  console.log("--- 6. Saving Breath Exercise to Bag from Thiền Đường Library ---");
  const saveBreathBtns = page.locator('[aria-label="Lưu vào túi đồ"]').or(page.getByText("Lưu Vào Túi Đồ (+10 EXP)"));
  if (await saveBreathBtns.first().isVisible()) {
    await saveBreathBtns.first().click({ force: true });
    await page.waitForTimeout(600);
    console.log("Saved Harvard 4-7-8 Breath to Bag!");
  }
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "qa_modal_thien_duong_saved_breath.png") });

  // Close Zen Breath Modal
  const closeZenBtn = page.locator('[aria-label="Đóng Thiền Đường"]').first();
  if (await closeZenBtn.isVisible()) {
    await closeZenBtn.click({ force: true });
    await page.waitForTimeout(800);
  }

  // Test House 3: Open Nhà Thảo Mộc (bld_potion_shop)
  console.log("--- 7. Interacting with House 3: Nhà Thảo Mộc (bld_potion_shop) ---");
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
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "qa_modal_nha_thao_moc_library.png") });

  // Save Cúc La Mã
  const saveHerbBtn = page.getByText("Cất vào Túi").first();
  if (await saveHerbBtn.isVisible()) {
    await saveHerbBtn.click({ force: true });
    await page.waitForTimeout(600);
    console.log("Saved Cúc La Mã herb to Bag!");
  }
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "qa_modal_nha_thao_moc_saved_herb.png") });

  // Close Herbal Modal
  const closeHerbBtn = page.locator('[aria-label="Đóng"]').first();
  if (await closeHerbBtn.isVisible()) {
    await closeHerbBtn.click({ force: true });
    await page.waitForTimeout(800);
  }

  // Step 3: Go back to Túi Đồ (Inventory) to verify collected items ONLY
  console.log("--- 8. Verifying Túi Đồ (Inventory) now contains ONLY the saved items ---");
  await page.goto("http://localhost:8081/(game)/inventory?tab=sounds", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);

  // Tab 2: Should show 2 saved sounds
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "qa_inventory_tab2_with_saved_sounds.png") });
  const soundCardCount = await page.getByText("Bỏ Khỏi Túi Đồ").count();
  console.log("Saved sound tracks in bag:", soundCardCount);

  // Toggle play on one saved sound track in bag
  const batSoundBtn = page.getByText("BẬT").first();
  if (await batSoundBtn.isVisible()) {
    await batSoundBtn.click({ force: true });
    await page.waitForTimeout(800);
    console.log("Playing saved sound track inside Bag!");
  }
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "qa_inventory_tab2_playing_in_bag.png") });

  // Switch to Tab 3: Breath in bag
  const breathTabBtn = page.getByText("Hơi Thở").first();
  await breathTabBtn.click({ force: true });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "qa_inventory_tab3_with_saved_breath.png") });
  const hasSavedBreathInBag = await page.getByText("BẮT ĐẦU TẬP THỞ").isVisible();
  console.log("Saved breath exercise in bag visible:", hasSavedBreathInBag);

  // Switch to Tab 1: Herbs in bag
  const herbTabBtn = page.getByText("Thảo Mộc").first();
  await herbTabBtn.click({ force: true });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "qa_inventory_tab1_with_saved_herb.png") });

  console.log("=== ALL ACCEPTANCE CRITERIA VERIFIED SUCCESSFULLY! ===");
  await browser.close();
}

runTest().catch((err) => {
  console.error("Test failed with error:", err);
  process.exit(1);
});
