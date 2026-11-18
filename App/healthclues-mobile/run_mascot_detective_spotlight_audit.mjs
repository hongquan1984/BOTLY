import { chromium } from "file:///d:/botly/App/3DHOME/node_modules/playwright-core/index.mjs";
import fs from "fs";
import path from "path";

const ARTIFACT_DIR = "C:\\Users\\Admin\\.gemini\\antigravity\\brain\\657e9da8-7551-4202-bc28-ecfcfda170bb\\spotlight_mascot_audit";
if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

async function runAudit() {
  console.log("=== STARTING MASCOT & DETECTIVE SPOTLIGHT AUDIT ===");

  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    args: ["--no-sandbox", "--disable-gpu-sandbox"],
  });

  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }, // Mobile Portrait iPhone standard
    deviceScaleFactor: 2,
    hasTouch: true,
    isMobile: true,
  });

  const page = await context.newPage();

  const shot = async (name) => {
    await page.waitForTimeout(650);
    const dest = path.join(ARTIFACT_DIR, name);
    await page.screenshot({ path: dest });
    console.log("Saved Artifact:", name);
  };

  // 1. Onboarding Screen 1: Welcome with Pre-generated Sprout Rabbit
  console.log("-> 1. Auditing Onboarding Welcome Screen...");
  await page.goto("http://localhost:8081/(onboarding)/quiz", { waitUntil: "networkidle" });
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  await shot("01_onboarding_welcome_screen.png");

  // Tap "welcome-start-btn" -> Goes to quest choice
  console.log("-> 2. Selecting Quest Choice...");
  const startJourneyBtn = page.locator('[aria-label="welcome-start-btn"]').first();
  if (await startJourneyBtn.isVisible({ timeout: 3000 })) {
    await startJourneyBtn.click();
    await page.waitForTimeout(600);
  }
  await shot("02_onboarding_quest_choice.png");

  // Tap "Tiếp Tục Khám Phá Vấn Đề"
  const questContBtn = page.locator('text="Tiếp Tục Khám Phá Vấn Đề"').first();
  if (await questContBtn.isVisible({ timeout: 3000 })) {
    await questContBtn.click();
    await page.waitForTimeout(600);
  }
  await shot("03_onboarding_mascot_welcome.png");

  // Tap Mầm Nhỏ to trigger laughter / dolphin sound
  const mascotImg = page.locator('img[src*="healthclues-sprout-rabbit"]').first();
  if (await mascotImg.isVisible({ timeout: 2000 })) {
    await mascotImg.click({ force: true });
    await page.waitForTimeout(400);
  }
  await shot("03b_onboarding_mascot_tapped.png");

  // Tap "mascot-welcome-continue-btn" (Mình sẵn sàng rồi)
  const readyBtn = page.locator('[aria-label="mascot-welcome-continue-btn"]').first();
  if (await readyBtn.isVisible({ timeout: 3000 })) {
    await readyBtn.click();
    await page.waitForTimeout(600);
  }
  await shot("04_onboarding_discovery_step1.png");

  // Select Concern: "Mất ngủ & Giấc ngủ kém"
  const sleepChip = page.locator('[aria-label="quick-focus-sleep"]').first();
  if (await sleepChip.isVisible({ timeout: 3000 })) {
    await sleepChip.click();
    await page.waitForTimeout(400);
  }
  await shot("04b_onboarding_concern_selected.png");

  // Tap "discovery-step1-next" (Tiếp tục)
  const discNextBtn = page.locator('[aria-label="discovery-step1-next"]').first();
  if (await discNextBtn.isVisible({ timeout: 3000 })) {
    await discNextBtn.click();
    await page.waitForTimeout(600);
  }
  await shot("04c_onboarding_discovery_step2.png");

  // Tap "discovery-analyze-btn" (Phân Tích & Gợi Ý Lộ Trình)
  const analyzeBtn = page.locator('[aria-label="discovery-analyze-btn"]').first();
  if (await analyzeBtn.isVisible({ timeout: 3000 })) {
    await analyzeBtn.click();
    await page.waitForTimeout(1000);
  }
  await shot("05_onboarding_plan_ready.png");

  // Tap "Bắt Đầu Hành Trình (+50 EXP)" in plan
  const planContBtn = page.locator('text="Bắt Đầu Hành Trình (+50 EXP)"').first();
  if (await planContBtn.isVisible({ timeout: 3000 })) {
    await planContBtn.click();
    await page.waitForTimeout(600);
  }
  await shot("05b_onboarding_mascot_ready.png");

  // Tap "Vào Vùng đất HealthClues"
  const enterWorldBtn = page.locator('[aria-label="mascot-enter-healthclues-realm-btn"]').first();
  if (await enterWorldBtn.isVisible({ timeout: 3000 })) {
    await enterWorldBtn.click();
    await page.waitForTimeout(2000);
  }

  // 2. Village World with Interactive Tour Step 1 (Welcome + Glowing Journey Tab)
  console.log("-> 2. Auditing Village World with Tour Step 1 & Glowing Journey Tab...");
  await shot("06_tour_step1_world_welcome_and_glowing_journey_tab.png");

  // 3. Permanent Mascot Helper icon pinned at bottom-left
  console.log("-> 3. Auditing Permanent Bottom-Left Mascot Helper...");
  await shot("07_permanent_mascot_helper_bottom_left.png");

  // 4. Tap Highlighted "Hành Trình" tab -> Tour Step 2
  console.log("-> 4. Tapping Glowing Journey Tab -> Tour Step 2...");
  const journeyTab = page.locator('text="Hành Trình"').first();
  if (await journeyTab.isVisible({ timeout: 3000 })) {
    await journeyTab.click();
    await page.waitForTimeout(1200);
  }
  await shot("08_tour_step2_journey_screen_and_glowing_dailycare_tab.png");

  // 5. Tap Highlighted "Nhiệm Vụ" tab -> Tour Step 3
  console.log("-> 5. Tapping Glowing Daily Care Tab -> Tour Step 3...");
  const dailyTab = page.locator('text="Nhiệm Vụ"').first();
  if (await dailyTab.isVisible({ timeout: 3000 })) {
    await dailyTab.click();
    await page.waitForTimeout(1200);
  }
  await shot("09_tour_step3_daily_care_and_glowing_home_tab.png");

  // 6. Tap Highlighted "Ngôi Nhà" tab -> Tour Step 4
  console.log("-> 6. Tapping Glowing Home Tab -> Tour Step 4 (House Gift Celebration)...");
  const homeTab = page.locator('text="Ngôi Nhà"').first();
  if (await homeTab.isVisible({ timeout: 3000 })) {
    await homeTab.click();
    await page.waitForTimeout(2200);
  }
  await shot("10_tour_step4_home_gift_celebration_golden_key.png");

  // Dismiss House Gift modal
  const startHouseBtn = page.locator('text="TUYỆT VỜI, BẮT ĐẦU NÀO!"').first();
  if (await startHouseBtn.isVisible({ timeout: 3000 })) {
    await startHouseBtn.click({ force: true });
    await page.waitForTimeout(1500);
  }
  await shot("11_tour_step4_home_3d_chalet_and_detective_lore_card.png");

  // Go to World to inspect glowing Phá Án button
  const worldTab = page.locator('text="Làng"').first();
  if (await worldTab.isVisible({ timeout: 3000 })) {
    await worldTab.click({ force: true });
    await page.waitForTimeout(1200);
  }
  await shot("12_world_floating_pha_an_glowing_button.png");

  // 7. Tap Glowing "Phá Án" Button -> Open Detective WebView Modal (/detective)
  console.log("-> 7. Tapping Phá Án -> Opening Detective WebView Modal (/detective)...");
  const phaAnBtn = page.locator('text="Phá Án"').first();
  if (await phaAnBtn.isVisible({ timeout: 3000 })) {
    await phaAnBtn.click({ force: true });
    await page.waitForTimeout(3000);
  }
  await shot("13_detective_webview_modal_opened.png");

  // Close Detective Modal
  const backToVillage = page.locator('text="Về Làng"').first();
  if (await backToVillage.isVisible({ timeout: 3000 })) {
    await backToVillage.click({ force: true });
    await page.waitForTimeout(1000);
  }
  await shot("14_back_to_village_after_detective.png");

  // 8. Tap Permanent Bottom-Left Mascot Helper
  console.log("-> 8. Tapping Permanent Bottom-Left Mascot Helper Drawer...");
  const helperBtn = page.locator('text="Mầm Nhỏ 🌱"').first();
  if (await helperBtn.isVisible({ timeout: 3000 })) {
    await helperBtn.click({ force: true });
    await page.waitForTimeout(1000);
  }
  await shot("15_permanent_mascot_helper_drawer_open.png");

  // 9. Direct Detective Game Web Verification on Port 3329 (/detective)
  console.log("-> 9. Direct Audit of Detective Game App at http://127.0.0.1:3329/detective...");
  await page.goto("http://127.0.0.1:3329/detective", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await shot("16_detective_case_library_standalone.png");

  // Click into Case 001
  const case1 = page.locator('text="Bí ẩn đêm không ngủ"').first();
  if (await case1.isVisible({ timeout: 3000 })) {
    await case1.click();
    await page.waitForTimeout(1500);
  }
  await shot("17_detective_case_001_luna_dossier.png");

  // Click start investigation
  const startInvestigateBtn = page.locator('button:has-text("Bắt đầu điều tra"), div[role="button"]:has-text("Bắt đầu điều tra"), button:has-text("Vào phòng")').first();
  if (await startInvestigateBtn.isVisible({ timeout: 3000 })) {
    await startInvestigateBtn.click();
    await page.waitForTimeout(1500);
  }
  await shot("18_detective_investigation_scene_bedroom.png");

  console.log("=== MASCOT & DETECTIVE SPOTLIGHT AUDIT COMPLETE! ALL SHOTS SAVED ===");
  await browser.close();
}

runAudit().catch((err) => {
  console.error("AUDIT FAILED:", err);
  process.exit(1);
});
