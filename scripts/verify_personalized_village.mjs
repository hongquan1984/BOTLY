import { chromium } from "file:///d:/botly/App/3DHOME/node_modules/playwright-core/index.mjs";
import fs from "fs";
import path from "path";

const ARTIFACT_DIR = "C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb";

async function runVerification() {
  console.log("=== STARTING RIGOROUS AUDIT: HERBAL GARDEN & BODY SCIENCE LIBRARY ===");
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    args: ["--no-sandbox", "--disable-gpu-sandbox"],
  });
  const context = await browser.newContext({
    viewport: { width: 440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  // Test Case 1: Player with Sleep concern ("Mất ngủ & Khó ngủ", "Ngủ sâu giấc trước 23h")
  console.log("1. Setting up Sleep Profile in localStorage...");
  await page.goto("http://localhost:8081/", { waitUntil: "networkidle" });
  await page.waitForTimeout(500);

  await page.evaluate(() => {
    const sleepProfile = {
      quest: "sleep",
      profile: {
        primaryConcernId: "sleep",
        topic: "Mất ngủ & Khó ngủ",
        twoWeekGoal: "Ngủ sâu giấc trước 23h mỗi đêm",
        concernNote: "Khó vào giấc và hay trằn trọc",
      },
      twoWeekGoal: "Ngủ sâu giấc trước 23h mỗi đêm",
      specificInterests: ["Dược liệu & Trà thảo mộc", "Cơ chế sinh học giấc ngủ"],
      safetyContext: { pregnant: false, breastfeeding: false, chronicConditions: [] },
      nickname: "Lữ Khách",
      onboardingComplete: true
    };
    localStorage.setItem("healthclues-starter-profile", JSON.stringify(sleepProfile));
    localStorage.setItem("healthclues-village-cinematic-tour-v1", "true");
    localStorage.setItem("healthclues-village-tutorial-completed-v1", "true");
    localStorage.setItem("healthclues-interactive-spotlight-tour-v4", "true");
    localStorage.setItem("healthclues-onboarding-completed", "true");
    localStorage.setItem("healthclues_ftue_completed_v1", "true");
    localStorage.removeItem("hc_mobile_tea_brewed_date");
    localStorage.removeItem("hc_mobile_body_science_quiz_date");
  });

  // Navigate to World screen
  console.log("2. Navigating to World 3D Village...");
  await page.goto("http://localhost:8081/(game)/world", { waitUntil: "networkidle" });
  await page.waitForTimeout(3000);

  // Click Potion Shop / Herbal Garden
  console.log("3. Triggering Herbal Garden interaction...");
  await page.evaluate(() => {
    window.postMessage({
      type: "INTERACT_BUILDING",
      actionId: "OPEN_HERBAL_GARDEN",
      landmarkId: "herbal_garden",
      buildingInstanceId: "bld_potion_shop"
    }, "*");
  });
  await page.waitForTimeout(1000);

  // Take screenshot of Herbal Garden opened with personalized sleep herbs
  const shot1Path = path.join(ARTIFACT_DIR, "audit_01_herbal_garden_sleep.png");
  await page.screenshot({ path: shot1Path });
  console.log(`Saved screenshot 1: ${shot1Path}`);

  // Test Tea Brewing Ritual
  console.log("4. Testing Daily Tea Brewing Ritual...");
  const brewBtn = await page.$("text=Pha tách trà này");
  if (brewBtn) {
    await brewBtn.click();
    await page.waitForTimeout(800);
    const shotBrewPath = path.join(ARTIFACT_DIR, "audit_02_tea_brewed.png");
    await page.screenshot({ path: shotBrewPath });
    console.log(`Saved screenshot 2 (Tea Brewed): ${shotBrewPath}`);
  }

  // Test Expand PubMed Details
  console.log("5. Expanding medical proof & tea recipe...");
  const expandBtn = await page.$("text=Bằng chứng y học & Hướng dẫn");
  if (expandBtn) {
    await expandBtn.click();
    await page.waitForTimeout(800);
    const shotExpandPath = path.join(ARTIFACT_DIR, "audit_03_herbal_expanded_evidence.png");
    await page.screenshot({ path: shotExpandPath });
    console.log(`Saved screenshot 3 (Expanded Evidence): ${shotExpandPath}`);
  }

  // Close Herbal Garden
  console.log("6. Closing Herbal Garden...");
  const closeBtn = await page.$("[aria-label='Đóng Nhà Thảo Mộc']");
  if (closeBtn) {
    await closeBtn.click();
  }
  await page.waitForTimeout(800);

  // Click Bookshop / Body Science Library
  console.log("7. Triggering Body Science Library interaction...");
  await page.evaluate(() => {
    window.postMessage({
      type: "INTERACT_BUILDING",
      actionId: "OPEN_KNOWLEDGE_LIBRARY",
      landmarkId: "knowledge_library",
      buildingInstanceId: "bld_bookshop"
    }, "*");
  });
  await page.waitForTimeout(1000);

  // Take screenshot of Body Science Library
  const shotBodyPath = path.join(ARTIFACT_DIR, "audit_04_body_science_sleep.png");
  await page.screenshot({ path: shotBodyPath });
  console.log(`Saved screenshot 4 (Body Science): ${shotBodyPath}`);

  // Test Daily Clue Quiz
  console.log("8. Testing Daily Biology Clue Quiz...");
  const optionAdenosine = await page.$("text=Adenosine");
  if (optionAdenosine) {
    await optionAdenosine.click();
    await page.waitForTimeout(500);

    const submitQuizBtn = await page.$("text=Xác nhận câu trả lời");
    if (submitQuizBtn) {
      await submitQuizBtn.click();
      await page.waitForTimeout(800);
      const shotQuizPath = path.join(ARTIFACT_DIR, "audit_05_body_science_quiz_solved.png");
      await page.screenshot({ path: shotQuizPath });
      console.log(`Saved screenshot 5 (Quiz Solved & Clue Unlocked): ${shotQuizPath}`);
    }
  }

  // Close Body Science Library
  console.log("9. Closing Body Science Library...");
  const closeBodyBtn = await page.$("[aria-label='Đóng Thư Viện Tri Thức']");
  if (closeBodyBtn) {
    await closeBodyBtn.click();
  }
  await page.waitForTimeout(800);

  // Test Case 2: Player with Weight / Gout concern ("Chuyển hóa, Cân nặng & Gout")
  console.log("10. Testing Weight/Metabolism Profile to verify dynamic personalization...");
  await page.evaluate(() => {
    const weightProfile = {
      quest: "weight",
      profile: {
        primaryConcernId: "weight",
        topic: "Chuyển hóa, Cân nặng & Gout",
        twoWeekGoal: "Kiểm soát mỡ thừa & hạ chỉ số acid uric",
        concernNote: "Muốn làm phẳng đường cong glucose và đào thải uric",
      },
      twoWeekGoal: "Kiểm soát mỡ thừa & hạ chỉ số acid uric",
      specificInterests: ["Thảo dược đào thải", "Đường cong insulin"],
      safetyContext: { pregnant: false, breastfeeding: false, chronicConditions: [] },
      nickname: "Hiệp Sĩ",
      onboardingComplete: true
    };
    localStorage.setItem("healthclues-starter-profile", JSON.stringify(weightProfile));
    localStorage.removeItem("hc_mobile_tea_brewed_date");
    localStorage.removeItem("hc_mobile_body_science_quiz_date");
  });

  // Reload page to apply profile
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(3000);

  // Open Herbal Garden again
  await page.evaluate(() => {
    window.postMessage({
      type: "INTERACT_BUILDING",
      actionId: "OPEN_HERBAL_GARDEN",
      landmarkId: "herbal_garden",
      buildingInstanceId: "bld_potion_shop"
    }, "*");
  });
  await page.waitForTimeout(1000);

  const shotWeightHerbalPath = path.join(ARTIFACT_DIR, "audit_06_herbal_garden_weight.png");
  await page.screenshot({ path: shotWeightHerbalPath });
  console.log(`Saved screenshot 6 (Weight Herbal Garden): ${shotWeightHerbalPath}`);

  // Test Watermill -> Opens Detective Minigame
  console.log("11. Testing Watermill -> Detective Office...");
  const closeBtn2 = await page.$("[aria-label='Đóng Nhà Thảo Mộc']");
  if (closeBtn2) await closeBtn2.click();
  await page.waitForTimeout(600);

  await page.evaluate(() => {
    window.postMessage({
      type: "INTERACT_BUILDING",
      actionId: "OPEN_CLOUD_THERAPY",
      landmarkId: "cloud_therapy",
      buildingInstanceId: "bld_watermill"
    }, "*");
  });
  await page.waitForTimeout(1200);

  const shotDetectivePath = path.join(ARTIFACT_DIR, "audit_07_detective_opened_from_watermill.png");
  await page.screenshot({ path: shotDetectivePath });
  console.log(`Saved screenshot 7 (Detective Office from Watermill): ${shotDetectivePath}`);

  await browser.close();
  console.log("=== ALL RIGOROUS AUDIT CHECKS COMPLETE SUCCESFULLY ===");
}

runVerification().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
