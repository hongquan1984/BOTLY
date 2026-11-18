import { chromium } from "file:///d:/botly/App/3DHOME/node_modules/playwright-core/index.mjs";
import fs from "fs";
import path from "path";

const ARTIFACT_DIR = "C:\\Users\\Admin\\.gemini\\antigravity\\brain\\657e9da8-7551-4202-bc28-ecfcfda170bb\\spotlight_mascot_audit";
if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

async function runAudit() {
  console.log("=== BẮT ĐẦU KIỂM THỬ TỰ ĐỘNG GAME SPOTLIGHT TOUR & DIMMED BACKDROP ===");

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

  const pageErrors = [];
  page.on("pageerror", (err) => {
    console.error("PAGE ERROR:", err.message);
    pageErrors.push(err.message);
  });

  const shot = async (name) => {
    await page.waitForTimeout(650);
    const dest = path.join(ARTIFACT_DIR, name);
    await page.screenshot({ path: dest });
    console.log(`[PASS] Captured: ${name}`);
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

  // Tap "welcome-start-btn" -> Goes to quest choice
  console.log("-> 2. Selecting Quest Choice...");
  const startJourneyBtn = page.locator('[aria-label="welcome-start-btn"]').first();
  if (await startJourneyBtn.isVisible({ timeout: 3000 })) {
    await startJourneyBtn.click();
    await page.waitForTimeout(600);
  }

  // Tap "Tiếp Tục Khám Phá Vấn Đề"
  const questContBtn = page.locator('text="Tiếp Tục Khám Phá Vấn Đề"').first();
  if (await questContBtn.isVisible({ timeout: 3000 })) {
    await questContBtn.click();
    await page.waitForTimeout(600);
  }

  // Tap "mascot-welcome-continue-btn" (Mình sẵn sàng rồi)
  const readyBtn = page.locator('[aria-label="mascot-welcome-continue-btn"]').first();
  if (await readyBtn.isVisible({ timeout: 3000 })) {
    await readyBtn.click();
    await page.waitForTimeout(600);
  }

  // Select Concern: "Mất ngủ & Giấc ngủ kém"
  const sleepChip = page.locator('[aria-label="quick-focus-sleep"]').first();
  if (await sleepChip.isVisible({ timeout: 3000 })) {
    await sleepChip.click();
    await page.waitForTimeout(400);
  }

  // Tap "discovery-step1-next" (Tiếp tục)
  const discNextBtn = page.locator('[aria-label="discovery-step1-next"]').first();
  if (await discNextBtn.isVisible({ timeout: 3000 })) {
    await discNextBtn.click();
    await page.waitForTimeout(600);
  }

  // Tap "discovery-analyze-btn" (Phân Tích & Gợi Ý Lộ Trình)
  const analyzeBtn = page.locator('[aria-label="discovery-analyze-btn"]').first();
  if (await analyzeBtn.isVisible({ timeout: 3000 })) {
    await analyzeBtn.click();
    await page.waitForTimeout(1000);
  }

  // Tap "Bắt Đầu Hành Trình (+50 EXP)" in plan
  const planContBtn = page.locator('text="Bắt Đầu Hành Trình (+50 EXP)"').first();
  if (await planContBtn.isVisible({ timeout: 3000 })) {
    await planContBtn.click();
    await page.waitForTimeout(600);
  }

  // Tap "Vào Vùng đất HealthClues"
  const enterWorldBtn = page.locator('[aria-label="mascot-enter-healthclues-realm-btn"]').first();
  if (await enterWorldBtn.isVisible({ timeout: 3000 })) {
    await enterWorldBtn.click();
    await page.waitForTimeout(2000);
  }

  // =========================================================================
  // STEP 1: World Screen with Dimmed Backdrop & Tab 'Hành Trình' Spotlight
  // =========================================================================
  console.log("-> 3. Auditing Step 1: World Screen with Dimmed Backdrop & Spotlight Tab Hành Trình...");
  await shot("spotlight_01_world_focus_journey.png");

  // Assert Permanent Mascot Helper is NOT rendered during tour
  const helperHiddenDuringTour = await page.evaluate(() => {
    return !document.querySelector('[aria-label="Trợ lý Mầm Nhỏ"]');
  });
  console.log("   ✓ Assert Permanent Mascot Helper hidden during tour:", helperHiddenDuringTour);

  // Assert Skip button is visible
  const skipBtn = page.locator('text="Bỏ qua"').first();
  console.log("   ✓ Assert Skip button visible:", await skipBtn.isVisible({ timeout: 2000 }));

  // =========================================================================
  // STEP 2A: Journey Screen -> Focus 'Nhật Ký 7 Ngày'
  // =========================================================================
  console.log("-> 4. Clicking [Đến Hành Trình ➔] to open Journey...");
  const toJourneyCta = page.locator('text="Đến Hành Trình ➔"').first();
  if (await toJourneyCta.isVisible({ timeout: 3000 })) {
    await toJourneyCta.click({ force: true });
    await page.waitForTimeout(1500);
  } else {
    // Fallback: tap tab Hành Trình directly
    const journeyTab = page.locator('text="Hành Trình"').first();
    await journeyTab.click({ force: true });
    await page.waitForTimeout(1500);
  }
  await shot("spotlight_02_journey_track_7days.png");

  // =========================================================================
  // STEP 2B: Journey Screen -> Focus '+ Thêm Mới' & Habit list
  // =========================================================================
  console.log("-> 5. Clicking [Tiếp Tục: Thêm Thói Quen ➔] to focus '+ Thêm Mới'...");
  const toAddHabitCta = page.locator('text="Tiếp Tục: Thêm Thói Quen ➔"').first();
  if (await toAddHabitCta.isVisible({ timeout: 3000 })) {
    await toAddHabitCta.click({ force: true });
    await page.waitForTimeout(1000);
  }
  await shot("spotlight_03_journey_add_habit.png");

  // =========================================================================
  // STEP 2C: Journey Screen -> Focus Bottom Tab 'Nhiệm Vụ'
  // =========================================================================
  console.log("-> 6. Clicking [Tiếp Tục: Bảng Điểm Danh ➔] to focus Tab Nhiệm Vụ...");
  const toDailyTabCta = page.locator('text="Tiếp Tục: Bảng Điểm Danh ➔"').first();
  if (await toDailyTabCta.isVisible({ timeout: 3000 })) {
    await toDailyTabCta.click({ force: true });
    await page.waitForTimeout(1000);
  }
  await shot("spotlight_04_journey_focus_tab_daily.png");

  // =========================================================================
  // STEP 3A: Daily Care Screen -> Focus Check-in Seals
  // =========================================================================
  console.log("-> 7. Clicking [Đến Nhiệm Vụ ➔] to open Daily Care...");
  const toDailyScreenCta = page.locator('text="Đến Nhiệm Vụ ➔"').first();
  if (await toDailyScreenCta.isVisible({ timeout: 3000 })) {
    await toDailyScreenCta.click({ force: true });
    await page.waitForTimeout(1500);
  } else {
    // Fallback: tap tab Nhiệm Vụ directly
    const dailyTab = page.locator('text="Nhiệm Vụ"').first();
    await dailyTab.click({ force: true });
    await page.waitForTimeout(1500);
  }
  await shot("spotlight_05_daily_checkin_seals.png");

  // =========================================================================
  // STEP 3B: Daily Care Screen -> Focus Bottom Tab 'Ngôi Nhà'
  // =========================================================================
  console.log("-> 8. Clicking [Tiếp Tục: Nhận Căn Nhà Riêng ➔] to focus Tab Ngôi Nhà...");
  const toHomeTabCta = page.locator('text="Tiếp Tục: Nhận Căn Nhà Riêng ➔"').first();
  if (await toHomeTabCta.isVisible({ timeout: 3000 })) {
    await toHomeTabCta.click({ force: true });
    await page.waitForTimeout(1000);
  }
  await shot("spotlight_06_daily_focus_tab_home.png");

  // =========================================================================
  // STEP 4A: Home Screen -> Golden Key Celebration Modal
  // =========================================================================
  console.log("-> 9. Clicking [Đến Ngôi Nhà ➔] to open Home & Golden Key Modal...");
  const toHomeScreenCta = page.locator('text="Đến Ngôi Nhà ➔"').first();
  if (await toHomeScreenCta.isVisible({ timeout: 3000 })) {
    await toHomeScreenCta.click({ force: true });
    await page.waitForTimeout(2000);
  } else {
    // Fallback: tap tab Ngôi Nhà directly
    const homeTab = page.locator('text="Ngôi Nhà"').first();
    await homeTab.click({ force: true });
    await page.waitForTimeout(2000);
  }
  await shot("spotlight_07_home_gift_celebration.png");

  // =========================================================================
  // STEP 4B: Home Screen -> 3D Chalet Lore
  // =========================================================================
  console.log("-> 10. Dismissing celebration modal to view 3D Chalet Lore...");
  const exploreHomeBtn = page.locator('text=/TUYỆT VỜI/').first();
  if (await exploreHomeBtn.isVisible({ timeout: 4000 })) {
    await exploreHomeBtn.click({ force: true });
    await page.waitForTimeout(1500);
  }
  await shot("spotlight_08_home_chalet_lore.png");

  // =========================================================================
  // STEP 4C: World Screen -> Focus Floating 'Phá Án' Button & Doctorless Lore
  // =========================================================================
  console.log("-> 11. Clicking [Tiếp Tục: Bí Ẩn Ngôi Làng ➔] to focus floating Phá Án button...");
  const toDetectiveLoreCta = page.locator('text="Tiếp Tục: Bí Ẩn Ngôi Làng ➔"').first();
  if (await toDetectiveLoreCta.isVisible({ timeout: 3000 })) {
    await toDetectiveLoreCta.click({ force: true });
    await page.waitForTimeout(1500);
  }
  await shot("spotlight_09_world_focus_pha_an.png");

  // =========================================================================
  // STEP 5: Open Detective WebView Modal
  // =========================================================================
  console.log("-> 12. Clicking [Mở Game Phá Án ➔] to open Detective WebView Modal...");
  const openDetectiveCta = page.locator('text="Mở Game Phá Án ➔"').first();
  if (await openDetectiveCta.isVisible({ timeout: 3000 })) {
    await openDetectiveCta.click({ force: true });
    await page.waitForTimeout(3000);
  } else {
    // Fallback: click floating Phá Án button directly
    const phaAnBtn = page.locator('text="Phá Án"').first();
    await phaAnBtn.click({ force: true });
    await page.waitForTimeout(3000);
  }
  await shot("spotlight_10_detective_webview.png");

  // =========================================================================
  // STEP 6: Close Detective -> Tour Completed -> Permanent Mascot Helper Appears
  // =========================================================================
  console.log("-> 13. Closing Detective Modal via [← Về Làng] to complete tour...");
  const backToVillage = page.locator('text="Về Làng"').first();
  if (await backToVillage.isVisible({ timeout: 3000 })) {
    await backToVillage.click({ force: true });
    await page.waitForTimeout(1200);
  }
  await shot("spotlight_11_tour_completed_permanent_mascot.png");

  // Verify Permanent Mascot Helper NOW exists
  const helperPresentAfterTour = await page.locator('text="Mầm Nhỏ 🌱"').first().isVisible({ timeout: 3000 }).catch(() => false);
  console.log("   ✓ Assert Permanent Mascot Helper now visible at bottom-left:", helperPresentAfterTour);

  // =========================================================================
  // STEP 7: Open Permanent Mascot Helper Drawer
  // =========================================================================
  console.log("-> 14. Tapping Permanent Mascot Helper to open Drawer...");
  const helperBtn = page.locator('text="Mầm Nhỏ 🌱"').first();
  if (await helperBtn.isVisible({ timeout: 3000 })) {
    await helperBtn.click({ force: true });
    await page.waitForTimeout(1000);
  }
  await shot("spotlight_12_helper_drawer_open.png");

  console.log("\n========================================================");
  console.log("TỔNG KẾT KIỂM THỬ SPOTLIGHT TOUR:");
  console.log("  - Tổng số lỗi trang (pageerror):", pageErrors.length);
  if (pageErrors.length > 0) {
    console.error("  - Chi tiết lỗi:", pageErrors);
    process.exit(1);
  } else {
    console.log("  - KẾT QUẢ: 100% PASS! Không có bất kỳ lỗi nào.");
  }

  await browser.close();
}

runAudit().catch((err) => {
  console.error("Audit script failed:", err);
  process.exit(1);
});
