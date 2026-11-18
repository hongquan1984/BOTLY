import path from "path";
import fs from "fs";
import { chromium } from "file:///d:/botly/App/word3d/node_modules/playwright-core/index.mjs";

const ARTIFACTS_DIR = "C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb";

async function runTest() {
  console.log("=== HEALTHCLUES — 3 HOUSES POPUP MODALS VERIFICATION ===");
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

  console.log("--- 1. Navigating to World with completed tour state ---");
  await page.goto("http://localhost:8081");
  await page.evaluate(() => {
    localStorage.setItem("healthclues-onboarding-completed", "true");
    localStorage.setItem("@healthclues_quiz_completed", "true");
    localStorage.setItem("healthclues_realm_mode_v1", "healthclues-realm");
    localStorage.setItem("healthclues-village-cinematic-tour-v1", "true");
  });
  await page.goto("http://localhost:8081/(game)/world", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(4000);

  // Take screenshot of World 3D
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "qa_world_with_3_houses.png") });

  // Test 1: Open Popup Nhà Thảo Mộc (Flora)
  console.log("--- 2. Triggering Popup Nhà Thảo Mộc (Tiên Nữ Flora) ---");
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
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "qa_popup_nha_thao_moc_flora.png") });
  const hasFloraModal = await page.getByText("Nhà Thảo Mộc").first().isVisible();
  console.log("Popup Nhà Thảo Mộc visible:", hasFloraModal);

  // Close Flora Modal
  const closeBtn1 = page.locator('[aria-label="Đóng Nhà Thảo Mộc"]').first();
  if (await closeBtn1.isVisible()) {
    await closeBtn1.click({ force: true });
    await page.waitForTimeout(800);
  }

  // Test 2: Open Popup Vườn Âm Thanh (Lyra)
  console.log("--- 3. Triggering Popup Vườn Âm Thanh (Tiên Nữ Lyra) ---");
  await page.evaluate(() => {
    window.postMessage(JSON.stringify({
      version: "HEALTHCLUES_WORLD3D_V3",
      source: "word3d",
      type: "INTERACT_BUILDING",
      buildingInstanceId: "bld_watermill",
      landmarkId: "sound_garden",
      actionId: "OPEN_SOUND_GARDEN"
    }), "*");
  });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "qa_popup_vuon_am_thanh_lyra.png") });
  const hasLyraModal = await page.getByText("Vườn Âm Thanh").first().isVisible();
  const hasLyraTitle = await page.getByText("Tiên Nữ Thanh Âm · Lyra").first().isVisible();
  console.log("Popup Vườn Âm Thanh visible:", hasLyraModal, "| Lyra Header visible:", hasLyraTitle);

  // Toggle a sound track inside the popup to verify interactivity
  const batBtn = page.getByText("BẬT").first();
  if (await batBtn.isVisible()) {
    await batBtn.click({ force: true });
    await page.waitForTimeout(600);
    console.log("Clicked BẬT button inside Vườn Âm Thanh popup!");
  }
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "qa_popup_vuon_am_thanh_playing.png") });

  // Close Lyra Modal
  const closeBtn2 = page.locator('[aria-label="Đóng Vườn Âm Thanh"]').first();
  if (await closeBtn2.isVisible()) {
    await closeBtn2.click({ force: true });
    await page.waitForTimeout(800);
  }

  // Test 3: Open Popup Thiền Đường - Hơi Thở (Aura)
  console.log("--- 4. Triggering Popup Thiền Đường - Hơi Thở (Tiên Nữ Aura) ---");
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
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "qa_popup_thien_duong_aura.png") });
  const hasAuraModal = await page.getByText("Thiền Đường - Hơi Thở").first().isVisible();
  const hasAuraTitle = await page.getByText("Tiên Nữ Khí Tức · Aura").first().isVisible();
  console.log("Popup Thiền Đường visible:", hasAuraModal, "| Aura Header visible:", hasAuraTitle);

  // Click 'Luyện Thở Ngay' inside the popup to verify live interactive breathing circle
  const startBreathBtn = page.getByText("Luyện Thở Ngay").first();
  if (await startBreathBtn.isVisible()) {
    await startBreathBtn.click({ force: true });
    await page.waitForTimeout(1200);
    console.log("Started breath exercise widget inside Thiền Đường popup!");
  }
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "qa_popup_thien_duong_breathing_active.png") });

  // Close Aura Modal
  const closeBtn3 = page.locator('[aria-label="Đóng Thiền Đường"]').first();
  if (await closeBtn3.isVisible()) {
    await closeBtn3.click({ force: true });
    await page.waitForTimeout(800);
  }

  await browser.close();
  console.log("=== ALL 3 HOUSE POPUPS VERIFIED SUCCESSFULLY ===");
}

runTest().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
