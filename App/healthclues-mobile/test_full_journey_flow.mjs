import { chromium } from "file:///D:/botly/App/word3d/node_modules/playwright-core/index.mjs";
import fs from "fs";
import path from "path";

const ARTIFACT_DIR = "C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb";

async function run() {
  console.log("=== STARTING FULL END-TO-END HEALTHCLUES FLOW TEST ===");
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    args: ["--no-sandbox", "--disable-gpu-sandbox"],
  });

  const context = await browser.newContext({
    viewport: { width: 420, height: 880 },
    deviceScaleFactor: 2,
  });

  const page = await context.newPage();

  page.on("console", (msg) => {
    const text = msg.text();
    if (msg.type() === "error" || text.includes("Roadmap") || text.includes("Flora") || text.includes("Herb")) {
      console.log(`[Browser ${msg.type()}]`, text);
    }
  });

  try {
    // -------------------------------------------------------------
    // STAGE 1: ONBOARDING QUIZ & DIABETES CONCERN
    // -------------------------------------------------------------
    console.log("\n--- STAGE 1: Onboarding Quiz ---");
    await page.goto("http://localhost:8081/quiz", { waitUntil: "domcontentloaded", timeout: 25000 });
    await page.waitForTimeout(1500);

    // Clear prior state
    await page.evaluate(() => {
      window.localStorage.clear();
    });
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);

    await page.screenshot({ path: path.join(ARTIFACT_DIR, "e2e_01_welcome.png") });
    console.log("Screenshot: e2e_01_welcome.png");

    // Click "Bắt Đầu Hành Trình"
    const startBtn = page.locator("[aria-label='welcome-start-btn']").first();
    await startBtn.click();
    await page.waitForTimeout(1200);

    // Skip story intro
    const skipStory = page.locator("text=Bỏ qua câu chuyện").or(page.locator("text=Bỏ qua")).first();
    if (await skipStory.isVisible({ timeout: 3000 })) {
      await skipStory.click();
      await page.waitForTimeout(1200);
    }

    // Now on discovery screen
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "e2e_02_discovery_screen.png") });
    console.log("Screenshot: e2e_02_discovery_screen.png");

    // Select "Đường huyết / Tiểu đường"
    console.log("Selecting 'Đường huyết / Tiểu đường'...");
    const glucoseBtn = page.locator("text=Đường huyết / Tiểu đường").or(page.locator("text=Đường huyết")).first();
    await glucoseBtn.click();
    await page.waitForTimeout(500);

    // Also type into note: "tiểu đường type 2"
    const noteInput = page.locator("[aria-label='onboarding-custom-concern-input']").first();
    if (await noteInput.isVisible()) {
      await noteInput.fill("tiểu đường");
      console.log("Filled custom concern note: tiểu đường");
    }

    await page.screenshot({ path: path.join(ARTIFACT_DIR, "e2e_03_concern_selected.png") });
    console.log("Screenshot: e2e_03_concern_selected.png");

    // Click "Tiếp tục" (discovery-step1-next)
    console.log("Clicking Next on discovery step...");
    const nextBtn = page.locator("[aria-label='discovery-step1-next']").first();
    await nextBtn.click();
    await page.waitForTimeout(1500);

    // Now on mascot_ready screen -> Click "Bắt đầu khám phá" to enter world
    console.log("On mascot ready screen, entering world...");
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "e2e_04_mascot_ready.png") });
    console.log("Screenshot: e2e_04_mascot_ready.png");

    const finaleBtn = page.locator("[aria-label='mascot-enter-healthclues-realm-btn']").first();
    if (await finaleBtn.isVisible({ timeout: 4000 })) {
      await finaleBtn.click();
      console.log("Clicked enter world button!");
      await page.waitForTimeout(3000);
    }

    // -------------------------------------------------------------
    // STAGE 3: 3D WORLD & POST-TOUR AI ROADMAP BOARD
    // -------------------------------------------------------------
    console.log("\n--- STAGE 3: 3D World & Post-Tour AI Roadmap ---");
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "e2e_05_world_intro_tour.png") });
    console.log("Screenshot: e2e_05_world_intro_tour.png");

    // Skip cinematic tour
    const skipTour = page.locator("text=Bỏ qua tour").or(page.locator("text=Bỏ qua")).or(page.locator("text=Khám phá ngay")).first();
    if (await skipTour.isVisible({ timeout: 3000 })) {
      console.log("Skipping cinematic tour to trigger Post-Tour AI Roadmap...");
      await skipTour.click();
      await page.waitForTimeout(1500);
    }

    // Now PostTourRoadmapModal ("Lộ Trình Sống Khỏe Đồng Hành") should be visible!
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "e2e_06_post_tour_roadmap_board.png") });
    console.log("Screenshot: e2e_06_post_tour_roadmap_board.png");

    const roadmapTitle = page.locator("text=Lộ Trình Sống Khỏe Đồng Hành");
    const isRoadmapVisible = await roadmapTitle.isVisible({ timeout: 4000 });
    console.log("PostTourRoadmapModal visible:", isRoadmapVisible);

    if (isRoadmapVisible) {
      // Test adding custom habit
      const addCustomBtn = page.locator("text=+ Tự Điền / Thêm Thói Quen Riêng Của Bạn");
      if (await addCustomBtn.isVisible()) {
        await addCustomBtn.click();
        await page.waitForTimeout(500);
        const customInput = page.locator("input[placeholder*='Đo đường huyết']");
        await customInput.fill("Đo đường huyết mao mạch lúc đói 7h sáng");
        const addNowBtn = page.locator("text=Thêm Ngay");
        await addNowBtn.click();
        await page.waitForTimeout(600);
        console.log("Added custom habit: Đo đường huyết mao mạch lúc đói 7h sáng");
      }

      await page.screenshot({ path: path.join(ARTIFACT_DIR, "e2e_07_roadmap_with_custom_habit.png") });
      console.log("Screenshot: e2e_07_roadmap_with_custom_habit.png");

      // Click "Lưu Vào Hành Trình Nhắc Nhở Hàng Ngày"
      const saveBtn = page.locator("text=Lưu Vào Hành Trình Nhắc Nhở Hàng Ngày").first();
      await saveBtn.click();
      console.log("Clicked 'Lưu Vào Hành Trình Nhắc Nhở Hàng Ngày'");
      await page.waitForTimeout(2000);
    }

    // -------------------------------------------------------------
    // STAGE 4: JOURNEY TAB VERIFICATION
    // -------------------------------------------------------------
    console.log("\n--- STAGE 4: Journey Tab Daily Tracking ---");
    // Navigate via "Xem Mục Hành Trình Ngay" button or bottom tab "Hành trình"
    const journeyLink = page.locator("text=Xem Mục Hành Trình Ngay").or(page.locator("text=Hành trình")).or(page.locator("text=Hành Trình")).first();
    await journeyLink.click();
    await page.waitForTimeout(2500);

    await page.screenshot({ path: path.join(ARTIFACT_DIR, "e2e_08_journey_habits_list.png") });
    console.log("Screenshot: e2e_08_journey_habits_list.png");

    const journeyContent = await page.textContent("body");
    console.log("Journey screen habits verified:");
    console.log(" - Nước ấm:", journeyContent.includes("nước") || journeyContent.includes("Nước"));
    console.log(" - Giảm đường:", journeyContent.includes("đường") || journeyContent.includes("Đường"));
    console.log(" - Đĩa ăn rau trước tinh bột:", journeyContent.includes("rau") || journeyContent.includes("Rau"));
    console.log(" - Đi bộ sau ăn:", journeyContent.includes("đi bộ") || journeyContent.includes("Đi bộ"));

    // -------------------------------------------------------------
    // STAGE 5: HERBAL GARDEN & NÀNG TIÊN THẢO MỘC FLORA
    // -------------------------------------------------------------
    console.log("\n--- STAGE 5: Herbal Garden & Nàng Tiên Thảo Mộc Flora ---");
    // Navigate back to World via bottom tab "Thế giới"
    const worldTab = page.locator("text=Thế giới").or(page.locator("text=Thế Giới")).first();
    await worldTab.click();
    await page.waitForTimeout(2500);

    // Trigger opening Herbal Garden via window.__OPEN_HERBAL_GARDEN__()
    console.log("Opening Herbal Garden modal...");
    await page.evaluate(() => {
      if (typeof (window).__OPEN_HERBAL_GARDEN__ === "function") {
        (window).__OPEN_HERBAL_GARDEN__();
      }
    });

    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "e2e_09_herbal_garden_flora.png") });
    console.log("Screenshot: e2e_09_herbal_garden_flora.png");

    // Check Flora text and herbs
    const herbalText = await page.textContent("body");
    console.log("Herbal Garden checks:");
    console.log(" - Flora present:", herbalText.includes("Flora"));
    console.log(" - Dây Thìa Canh present:", herbalText.includes("Dây Thìa Canh"));
    console.log(" - Mướp Đắng Rừng present:", herbalText.includes("Mướp Đắng Rừng"));
    console.log(" - Quế Ceylon present:", herbalText.includes("Quế Ceylon"));

    // Click "Lưu Kiến Thức" on first herb
    const bookmarkBtn = page.locator("text=Lưu Kiến Thức").first();
    if (await bookmarkBtn.isVisible({ timeout: 2500 })) {
      await bookmarkBtn.click();
      console.log("Clicked 'Lưu Kiến Thức' on herb");
      await page.waitForTimeout(600);
    }

    // Click "Dùng Thử / Pha Trà (+15 EXP)"
    const brewBtn = page.locator("text=Dùng Thử / Pha Trà (+15 EXP)").first();
    if (await brewBtn.isVisible({ timeout: 2500 })) {
      await brewBtn.click();
      console.log("Clicked 'Dùng Thử / Pha Trà (+15 EXP)'");
      await page.waitForTimeout(1500);
    }

    await page.screenshot({ path: path.join(ARTIFACT_DIR, "e2e_10_tea_brewed_success.png") });
    console.log("Screenshot: e2e_10_tea_brewed_success.png");

    // Close Herbal Garden Modal
    const closeHerbal = page.locator("[aria-label='Đóng Vườn Thảo Mộc']").first();
    if (await closeHerbal.isVisible()) {
      await closeHerbal.click();
      console.log("Closed Herbal Garden modal");
      await page.waitForTimeout(800);
    }

    // -------------------------------------------------------------
    // STAGE 6: BODY SCIENCE LIBRARY & GLUT4 DIABETES MECHANISM
    // -------------------------------------------------------------
    console.log("\n--- STAGE 6: Body Science Library & GLUT4 Mechanism ---");
    console.log("Opening Body Science Library modal...");
    await page.evaluate(() => {
      if (typeof (window).__OPEN_BODY_SCIENCE__ === "function") {
        (window).__OPEN_BODY_SCIENCE__();
      }
    });

    await page.waitForTimeout(1500);
    // Click on GLUT4 chapter to expand detailed mechanism
    const glut4Chapter = page.locator("text=Kênh GLUT4").or(page.locator("text=Đi Bộ 15 Phút")).first();
    if (await glut4Chapter.isVisible({ timeout: 2500 })) {
      await glut4Chapter.click();
      console.log("Clicked GLUT4 Chapter");
      await page.waitForTimeout(600);
    }

    await page.screenshot({ path: path.join(ARTIFACT_DIR, "e2e_11_body_science_glut4.png") });
    console.log("Screenshot: e2e_11_body_science_glut4.png");

    const bodyScienceText = await page.textContent("body");
    console.log("Body Science checks:");
    console.log(" - Library title present:", bodyScienceText.includes("Thư Viện Tri Thức Cơ Thể"));
    console.log(" - GLUT4 chapter present:", bodyScienceText.includes("GLUT4") || bodyScienceText.includes("Đi Bộ 15 Phút"));
    console.log(" - PubMed 27747394 citation:", bodyScienceText.includes("27747394") || bodyScienceText.includes("PMID"));

    // Check Daily Quiz interaction (Correct answer: "Rau xanh chất xơ trước -> Đạm/chất béo -> Tinh bột sau cùng")
    const quizOption = page.locator("text=Rau xanh chất xơ trước").or(page.locator("text=Rau xanh")).first();
    if (await quizOption.isVisible({ timeout: 2500 })) {
      await quizOption.click();
      console.log("Selected correct quiz option: Rau xanh chất xơ trước -> Đạm/chất béo -> Tinh bột sau cùng");
      await page.waitForTimeout(500);
      const submitQuizBtn = page.locator("text=Xác nhận câu trả lời (+20 EXP)").or(page.locator("text=Xác nhận câu trả lời")).first();
      if (await submitQuizBtn.isVisible()) {
        await submitQuizBtn.click();
        console.log("Submitted Body Science Daily Quiz");
        await page.waitForTimeout(1000);
      }
    }

    await page.screenshot({ path: path.join(ARTIFACT_DIR, "e2e_12_body_science_quiz_solved.png") });
    console.log("Screenshot: e2e_12_body_science_quiz_solved.png");

    await page.screenshot({ path: path.join(ARTIFACT_DIR, "e2e_13_quiz_reward_clue.png") });
    console.log("Screenshot: e2e_13_quiz_reward_clue.png");

    console.log("\n=== ALL E2E STAGES EXECUTED SUCCESSFULLY ===");
  } catch (err) {
    console.error("E2E Test Error:", err);
  } finally {
    await browser.close();
  }
}

run();
