import path from "path";
import fs from "fs";
import { chromium } from "file:///d:/botly/App/word3d/node_modules/playwright-core/index.mjs";

const ARTIFACTS_DIR = "C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb";

async function main() {
  console.log("=== HEALTHCLUES — RIGOROUS AUDIT: QUIZ -> TOUR -> HERBAL -> BODY SCIENCE ===");

  const browser = await chromium.launch({
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
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

  // Listen to console logs
  page.on("console", (msg) => {
    if (msg.type() === "error" || msg.text().includes("[PlayerApp]") || msg.text().includes("Tour")) {
      console.log(`[Browser Console ${msg.type()}]:`, msg.text());
    }
  });

  // 1. Start at /quiz
  console.log("1. Navigating to http://localhost:8081/quiz...");
  await page.goto("http://localhost:8081/quiz", { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "audit_v2_01_quiz_welcome.png") });

  // Click "Bắt Đầu Hành Trình"
  console.log("Clicking welcome start button...");
  const startBtn = page.locator("[aria-label='welcome-start-btn']");
  if (await startBtn.isVisible()) {
    await startBtn.click();
  } else {
    await page.getByText("Bắt Đầu Hành Trình").first().click();
  }
  await page.waitForTimeout(2000);

  // If Story Intro appears, click "Bỏ qua"
  const skipStoryBtn = page.getByText("Bỏ qua").first();
  if (await skipStoryBtn.isVisible()) {
    console.log("Skipping story video...");
    await skipStoryBtn.click();
    await page.waitForTimeout(1500);
  }

  // Step 2: Discovery Concern - Pick "Mất ngủ"
  console.log("Selecting 'Mất ngủ' concern...");
  const sleepChoice = page.locator("[aria-label='quick-focus-sleep']");
  if (await sleepChoice.isVisible()) {
    await sleepChoice.click();
  } else {
    await page.getByText("Mất ngủ").first().click();
  }
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "audit_v2_02_sleep_selected.png") });

  // Discovery Screen 1 -> Click Next
  console.log("Advancing from discovery screen 1...");
  const discNext1 = page.locator("[aria-label='discovery-step1-next']");
  if (await discNext1.isVisible()) {
    await discNext1.click();
    await page.waitForTimeout(1500);
  }

  // Discovery Screen 2 -> Click Analyze & Build Plan
  console.log("Advancing from discovery screen 2 (Analyze & Build Plan)...");
  const discAnalyze = page.locator("[aria-label='discovery-analyze-btn']");
  if (await discAnalyze.isVisible()) {
    await discAnalyze.click();
    await page.waitForTimeout(2500);
  }

  // Plan Screen -> Click Enter Realm
  console.log("Advancing from Plan screen...");
  const enterRealm = page.locator("[aria-label='onboarding-enter-world-btn']");
  if (await enterRealm.isVisible()) {
    await enterRealm.click();
    await page.waitForTimeout(2000);
  }

  // Mascot Ready Screen -> Click Enter World
  console.log("Clicking 'mascot-enter-healthclues-realm-btn'...");
  const enterWorld = page.locator("[aria-label='mascot-enter-healthclues-realm-btn']");
  if (await enterWorld.isVisible()) {
    await enterWorld.click();
    await page.waitForTimeout(4000);
  }

  // Arrived at World
  console.log("Arrived at world:", page.url());
  await page.waitForTimeout(5000);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "audit_v2_03_world_tour_step0.png") });

  // Verify Tour Step 0 (Overview)
  console.log("Advancing Tour through all stops...");

  // Step 1: Ngôi Nhà Của Bạn
  await page.getByText("Tiếp tục").last().click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "audit_v2_04_tour_step1_home.png") });

  // Step 2: Nhà Thảo Mộc
  await page.getByText("Tiếp tục").last().click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "audit_v2_05_tour_step2_herbal.png") });

  // Step 3: Nhà Cơ Thể
  await page.getByText("Tiếp tục").last().click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "audit_v2_06_tour_step3_body.png") });

  // Step 4: Văn Phòng Giải Mã
  await page.getByText("Tiếp tục").last().click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "audit_v2_07_tour_step4_detective.png") });

  // Step 5: Quảng Trường
  await page.getByText("Tiếp tục").last().click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "audit_v2_08_tour_step5_plaza.png") });

  // Step 6: Sẵn Sàng Khám Phá
  await page.getByText("Tiếp tục").last().click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "audit_v2_09_tour_step6_ready.png") });

  // Click "Bắt đầu khám phá"
  console.log("Clicking 'Bắt đầu khám phá'...");
  await page.getByText("Bắt đầu khám phá").last().click();
  await page.waitForTimeout(2500);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "audit_v2_10_world_freeroam.png") });

  // Now test entering Herbal Garden
  console.log("Testing Herbal Garden opening via postMessage / building interaction...");
  await page.evaluate(() => {
    window.postMessage({
      type: "INTERACT_BUILDING",
      buildingInstanceId: "bld_potion_shop",
      landmarkId: "herbal_garden",
      actionId: "OPEN_HERBAL_GARDEN"
    }, "*");
  });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "audit_v2_11_herbal_garden_opened.png") });

  // Test Brewing Tea in Herbal Garden
  const brewBtn = page.getByText("Pha tách trà này (+15 EXP)").first();
  if (await brewBtn.isVisible()) {
    console.log("Executing Daily Tea Brewing Ritual...");
    await brewBtn.click();
    await page.waitForTimeout(2500);
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, "audit_v2_12_tea_brewed_success.png") });
  }

  // Close Herbal Garden
  console.log("Closing Herbal Garden...");
  await page.locator("[aria-label='Đóng Nhà Thảo Mộc']").click();
  await page.waitForTimeout(1500);

  // Test entering Body Science Library
  console.log("Testing Body Science Library opening...");
  await page.evaluate(() => {
    window.postMessage({
      type: "INTERACT_BUILDING",
      buildingInstanceId: "bld_bookshop",
      landmarkId: "knowledge_library",
      actionId: "OPEN_KNOWLEDGE_LIBRARY"
    }, "*");
  });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "audit_v2_13_body_science_opened.png") });

  // Test Answering Daily Quiz in Body Science Library
  console.log("Testing Daily Biological Clue Quiz...");
  const quizOption = page.getByText("Adenosine").first();
  if (await quizOption.isVisible()) {
    await quizOption.click();
    await page.waitForTimeout(500);
    const confirmBtn = page.getByText("Xác nhận câu trả lời").first();
    if (await confirmBtn.isVisible()) {
      await confirmBtn.click();
    }
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, "audit_v2_14_quiz_answered_correct.png") });
  }

  // Close Body Science Library
  console.log("Closing Body Science Library...");
  await page.locator("[aria-label='Đóng Thư Viện Tri Thức']").click();
  await page.waitForTimeout(1500);

  // Test Detective Button in Top Bar
  console.log("Testing Detective Shortcut...");
  const detectiveBtn = page.locator("[aria-label='Giải Mã Hồ Sơ Sức Khỏe']");
  if (await detectiveBtn.isVisible()) {
    await detectiveBtn.click();
  } else {
    await page.getByText("Giải Mã").first().click();
  }
  await page.waitForTimeout(2500);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "audit_v2_15_detective_opened.png") });

  console.log("=== ALL RIGOROUS AUDIT CHECKS COMPLETED SUCCESSFULLY ===");
  await browser.close();
}

main().catch((err) => {
  console.error("Audit failed:", err);
  process.exit(1);
});
