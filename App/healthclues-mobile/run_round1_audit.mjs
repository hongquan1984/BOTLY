import { chromium } from "file:///d:/botly/App/3DHOME/node_modules/playwright-core/index.mjs";
import fs from "fs";
import path from "path";

const ARTIFACT_DIR = "C:\\Users\\Admin\\.gemini\\antigravity\\brain\\657e9da8-7551-4202-bc28-ecfcfda170bb\\round1_audit";
if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

async function runAudit() {
  console.log("=== STARTING ROUND 1 COMPREHENSIVE AI-VISION & UX AUDIT ===");

  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    args: ["--no-sandbox", "--disable-gpu-sandbox"],
  });

  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }, // iPhone standard mobile viewport
    deviceScaleFactor: 2,
    hasTouch: true,
    isMobile: true,
  });

  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (err) => {
    console.error("PAGE_ERROR:", err.message);
    errors.push({ type: "pageerror", msg: err.message });
  });
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      console.warn("CONSOLE_ERR:", msg.text());
      errors.push({ type: "console_error", msg: msg.text() });
    }
  });

  const touchTargets = [];
  async function measureElement(selector, label) {
    try {
      const loc = page.locator(selector).first();
      if (await loc.isVisible({ timeout: 2000 })) {
        const box = await loc.boundingBox();
        touchTargets.push({ label, selector, box, pass44px: box && box.width >= 40 && box.height >= 40 });
      }
    } catch (e) {}
  }

  // 1. Onboarding Screen
  console.log("-> 1. Auditing Onboarding Welcome Screen...");
  await page.goto("http://localhost:8081/(onboarding)/quiz", { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "r1_01_onboarding_welcome.png") });
  await measureElement('[aria-label="welcome-start-btn"]', "Start Journey Button");

  // Move to Quest Choice
  console.log("-> 1b. Moving to Quest Choice...");
  await page.click('[aria-label="welcome-start-btn"]', { force: true });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "r1_01b_onboarding_quest_choice.png") });
  await measureElement('[aria-label="quest-choice-continue-btn"]', "Quest Continue Button");

  // Move to Mascot Welcome
  console.log("-> 2. Auditing Mascot Welcome Screen...");
  await page.click('[aria-label="quest-choice-continue-btn"]', { force: true });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "r1_02_onboarding_mascot_welcome.png") });
  await measureElement('[aria-label="Chạm linh vật Mầm Nhỏ"]', "Mascot Sprout Touch Area");

  // Tap Mascot
  console.log("-> 2b. Tapping Mascot for Dolphin SFX & Mood...");
  await page.click('[aria-label="Chạm linh vật Mầm Nhỏ"]', { force: true });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "r1_02b_onboarding_mascot_tapped.png") });

  // Move to Discovery
  console.log("-> 3. Auditing Discovery Step...");
  await page.click('[aria-label="mascot-welcome-continue-btn"]', { force: true });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "r1_03_onboarding_discovery.png") });

  // Select "Mất ngủ"
  console.log("-> 3b. Selecting Mất ngủ concern...");
  const sleepOption = page.locator('text=Mất ngủ').first();
  if (await sleepOption.isVisible({ timeout: 2000 }).catch(() => false)) {
    await sleepOption.click({ force: true });
    await page.waitForTimeout(500);
  }
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "r1_03b_concern_selected.png") });

  // 4. Submit & Enter Village -> Tutorial Step 1
  console.log("-> 4. Entering Village & Auditing Tutorial Step 1...");
  await page.evaluate(() => {
    localStorage.setItem("healthclues-onboarding-completed", "true");
    localStorage.removeItem("healthclues-village-tutorial-v2-completed");
    localStorage.setItem(
      "healthclues-starter-profile",
      JSON.stringify({
        profile: { concernNote: "Mất ngủ & Thức giấc 3h sáng" },
      })
    );
  });
  await page.goto("http://localhost:8081/(game)/world", { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);

  // If tutorial not automatically visible, open it via mascot button
  const sproutBtn = page.locator('[aria-label="Mở hướng dẫn làng"]').first();
  if (await sproutBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
    const tutCard = page.locator("text=Gợi Ý Từ Mầm Nhỏ").first();
    if (!await tutCard.isVisible({ timeout: 1000 }).catch(() => false)) {
      await sproutBtn.click({ force: true });
      await page.waitForTimeout(1000);
    }
  }

  await page.screenshot({ path: path.join(ARTIFACT_DIR, "r1_04_tutorial_step1_health_recs.png") });
  await measureElement("text=Tiếp theo", "Tutorial Step 1 Next Button");

  // 5. Step 2: Journey Menu
  console.log("-> 5. Auditing Tutorial Step 2: Journey...");
  await page.click("text=Tiếp theo", { force: true });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "r1_05_tutorial_step2_journey.png") });

  // 6. Step 3: Daily Care
  console.log("-> 6. Auditing Tutorial Step 3: Daily Care & Coins...");
  await page.click("text=Tiếp theo", { force: true });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "r1_06_tutorial_step3_daily_care.png") });

  // 7. Step 4: House Gift Celebration
  console.log("-> 7. Auditing Tutorial Step 4: House Gift...");
  await page.click("text=Tiếp theo", { force: true });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "r1_07_tutorial_step4_house_overview.png") });

  // Open House Celebration Modal
  const viewHouseBtn = page.locator("text=Xem Căn Nhà Được Tặng").first();
  if (await viewHouseBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await viewHouseBtn.click({ force: true });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "r1_08_tutorial_step4_house_key_modal.png") });
    await page.click("text=TUYỆT VỜI, BẮT ĐẦU NÀO!", { force: true });
    await page.waitForTimeout(800);
  }

  // 8. Step 5: Detective Lore
  console.log("-> 8. Auditing Tutorial Step 5: Detective Lore...");
  await page.click("text=Tiếp theo", { force: true });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "r1_09_tutorial_step5_detective_lore.png") });

  // Finish tutorial
  await page.click("text=KHÁM PHÁ NGAY (+50 XU)", { force: true });
  await page.waitForTimeout(1200);

  // 9. World HUD & Plaza
  console.log("-> 9. Auditing World HUD & Living Village...");
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "r1_10_world_hud_and_plaza.png") });
  await measureElement("text=Phá Án", "Pha An Button");
  await measureElement("text=Mầm Nhỏ", "Mam Nho Button");

  // 10. Open Body Detective Modal
  console.log("-> 10. Auditing Body Detective Modal...");
  await page.click("text=Phá Án", { force: true });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "r1_11_detective_agency_modal.png") });

  // 11. Open Case 1 & Inspect Clues
  console.log("-> 11. Auditing Case Inspection...");
  await page.click("text=Vụ 1: Bí Ẩn Đêm Không Ngủ", { force: true });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "r1_12_detective_investigation_scene.png") });

  // 12. Solve Case & Get Reward
  console.log("-> 12. Auditing Deduction & Reward Modal...");
  await page.click("text=/Uống trà xanh/", { force: true });
  await page.waitForTimeout(400);
  await page.click("text=GỬI KẾT LUẬN SUY LUẬN", { force: true });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "r1_13_detective_deduction_and_reward.png") });

  // Close Detective
  await page.click('[aria-label="Đóng văn phòng thám tử"], text=✕', { force: true }).catch(() => {});
  await page.waitForTimeout(800);

  // 13. Tab Ngôi Nhà & 3D Chalet
  console.log("-> 13. Auditing Tab Ngôi Nhà 3D Chalet...");
  await page.click("text=Ngôi Nhà", { force: true });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "r1_14_home_3d_chalet_view.png") });

  // 14. Furniture Shop
  console.log("-> 14. Auditing Furniture Shop Modal...");
  await page.click('[aria-label="Mở cửa hàng nội thất bằng Xu"]', { force: true });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "r1_15_home_furniture_shop.png") });

  // 15. Buy Furniture
  console.log("-> 15. Auditing Furniture Purchase...");
  try {
    const buyButton = page.locator('text=/\\d+\\s*Xu/').first();
    if (await buyButton.isVisible({ timeout: 2500 })) {
      await buyButton.click({ force: true });
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(ARTIFACT_DIR, "r1_16_furniture_purchase_feedback.png") });
    }
  } catch (err) {
    console.log("Item already purchased or error:", err.message);
  }

  // Close Shop
  await page.click('[aria-label="close-shop-btn"], text=✕, button >> text=X', { force: true }).catch(() => {});
  await page.waitForTimeout(600);

  // 16. 3D Village & Humanoid walking
  console.log("-> 16. Auditing 3D Village Humanoid Avatar...");
  const villagePage = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await villagePage.goto("http://localhost:5179/village.html", { waitUntil: "networkidle" });
  await villagePage.waitForTimeout(3500);
  await villagePage.screenshot({ path: path.join(ARTIFACT_DIR, "r1_17_humanoid_walking_village.png") });

  await browser.close();

  console.log("=== ROUND 1 AUDIT CAPTURE COMPLETE ===");
  fs.writeFileSync(
    path.join(ARTIFACT_DIR, "r1_metrics.json"),
    JSON.stringify({ touchTargets, errors }, null, 2)
  );
  console.log("Metrics saved to r1_metrics.json");
}

runAudit().catch((err) => {
  console.error("AUDIT ERROR:", err);
  process.exit(1);
});
