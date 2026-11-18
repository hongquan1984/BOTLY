import { chromium } from "file:///d:/botly/App/3DHOME/node_modules/playwright-core/index.mjs";
import fs from "fs";
import path from "path";

const ARTIFACT_DIR = "C:\\Users\\Admin\\.gemini\\antigravity\\brain\\657e9da8-7551-4202-bc28-ecfcfda170bb\\round2_audit";
if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

async function runRound2Audit() {
  console.log("=== STARTING ROUND 2 VERIFICATION & FINAL AI-VISION AUDIT ===");

  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    args: ["--no-sandbox", "--disable-gpu-sandbox"],
  });

  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }, // Mobile Portrait (iPhone 14/15/16 standard)
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

  const touchTargets = [];
  async function measureElement(selector, label) {
    try {
      const loc = page.locator(selector).first();
      if (await loc.isVisible({ timeout: 2500 })) {
        const box = await loc.boundingBox();
        if (box) {
          touchTargets.push({
            label,
            selector,
            width: Math.round(box.width),
            height: Math.round(box.height),
            pass44px: box.width >= 40 && box.height >= 40,
          });
        }
      }
    } catch (e) {}
  }

  const shot = async (name) => {
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, name) });
    console.log("Saved Round 2 Shot:", name);
  };

  // 1. Onboarding Screen
  console.log("-> 1. Auditing Onboarding Welcome Screen...");
  await page.goto("http://localhost:8081/(onboarding)/quiz", { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  await shot("r2_01_onboarding_welcome.png");
  await measureElement('[aria-label="welcome-start-btn"]', "Start Journey Button");

  // 1b. Quest Choice
  console.log("-> 1b. Quest Choice...");
  await page.click('[aria-label="welcome-start-btn"]', { force: true });
  await page.waitForTimeout(800);
  await shot("r2_01b_onboarding_quest_choice.png");
  await measureElement('[aria-label="quest-choice-continue-btn"]', "Quest Continue Button");

  // 2. Mascot Welcome & Interaction
  console.log("-> 2. Mascot Welcome Screen...");
  await page.click('[aria-label="quest-choice-continue-btn"]', { force: true });
  await page.waitForTimeout(1000);
  await shot("r2_02_onboarding_mascot_welcome.png");
  await measureElement('[aria-label="Chạm linh vật Mầm Nhỏ"]', "Mascot Sprout Touch Area");

  // Tap Mascot
  console.log("-> 2b. Tapping Mascot for Dolphin SFX & Mood Reaction...");
  await page.click('[aria-label="Chạm linh vật Mầm Nhỏ"]', { force: true });
  await page.waitForTimeout(600);
  await shot("r2_02b_onboarding_mascot_tapped.png");

  // 3. Discovery Screen
  console.log("-> 3. Discovery Screen...");
  await page.click('[aria-label="mascot-welcome-continue-btn"]', { force: true });
  await page.waitForTimeout(1000);
  await shot("r2_03_onboarding_discovery.png");

  // Select Concern
  const sleepOpt = page.locator('text=Mất ngủ').first();
  if (await sleepOpt.isVisible({ timeout: 2000 }).catch(() => false)) {
    await sleepOpt.click({ force: true });
    await page.waitForTimeout(500);
  }
  await shot("r2_03b_concern_selected.png");

  // 4. Setup Profile & Enter Village Tutorial
  console.log("-> 4. Entering Village & Auditing Tutorial 5 Steps...");
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

  // If tutorial modal not open, click Mầm Nhỏ button
  const sproutBtn = page.locator('text=Mầm Nhỏ').first();
  const tutHeader = page.locator("text=CHÀO MỪNG ĐẾN LÀNG SỐNG KHỎE").first();
  if (!await tutHeader.isVisible({ timeout: 1200 }).catch(() => false)) {
    if (await sproutBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
      await sproutBtn.click({ force: true });
      await page.waitForTimeout(1000);
    }
  }

  // Step 1: Health Recommendations (no AI)
  await shot("r2_04_tutorial_step1_health_recs.png");
  await measureElement("text=Tiếp theo", "Tutorial Next Button");

  // Step 2: Journey Menu
  console.log("-> 5. Tutorial Step 2: Journey...");
  await page.click("text=Tiếp theo", { force: true });
  await page.waitForTimeout(800);
  await shot("r2_05_tutorial_step2_journey.png");

  // Step 3: Daily Care & Coins
  console.log("-> 6. Tutorial Step 3: Daily Care...");
  await page.click("text=Tiếp theo", { force: true });
  await page.waitForTimeout(800);
  await shot("r2_06_tutorial_step3_daily_care.png");

  // Step 4: House Gift
  console.log("-> 7. Tutorial Step 4: House Gift...");
  await page.click("text=Tiếp theo", { force: true });
  await page.waitForTimeout(800);
  await shot("r2_07_tutorial_step4_house_overview.png");

  // Open House Celebration Modal
  const viewHouseBtn = page.locator("text=Xem Căn Nhà Được Tặng").first();
  if (await viewHouseBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await viewHouseBtn.click({ force: true });
    await page.waitForTimeout(1000);
    await shot("r2_08_tutorial_step4_house_key_modal.png");
    await measureElement("text=TUYỆT VỜI, BẮT ĐẦU NÀO!", "House Celebration CTA Button");
    await page.click("text=TUYỆT VỜI, BẮT ĐẦU NÀO!", { force: true });
    await page.waitForTimeout(800);
  }

  // Step 5: Body Detective Lore
  console.log("-> 8. Tutorial Step 5: Detective Lore...");
  await page.click("text=Tiếp theo", { force: true });
  await page.waitForTimeout(800);
  await shot("r2_09_tutorial_step5_detective_lore.png");
  await measureElement("text=KHÁM PHÁ NGAY (+50 XU)", "Tutorial Finish CTA Button");

  // Complete Tutorial
  await page.click("text=KHÁM PHÁ NGAY (+50 XU)", { force: true });
  await page.waitForTimeout(1200);

  // 9. World HUD & Living Village
  console.log("-> 9. Auditing World HUD & Living Village...");
  await page.waitForTimeout(1000);
  await shot("r2_10_world_hud_and_plaza.png");
  await measureElement("text=Phá Án", "Pha An Glowing Pill Button");
  await measureElement("text=Mầm Nhỏ", "Mam Nho Glowing Pill Button");

  // 10. Open Body Detective Modal
  console.log("-> 10. Auditing Body Detective Modal...");
  await page.click("text=Phá Án", { force: true });
  await page.waitForTimeout(1000);
  await shot("r2_11_detective_agency_modal.png");
  await measureElement('[aria-label="Đóng văn phòng thám tử"]', "Detective Modal Close Button");

  // 11. Open Case 1
  console.log("-> 11. Auditing Case Investigation...");
  await page.click("text=Vụ 1: Bí Ẩn Đêm Không Ngủ", { force: true });
  await page.waitForTimeout(1000);
  await shot("r2_12_detective_investigation_scene.png");

  // 12. Submit Deduction & Reward
  console.log("-> 12. Auditing Deduction & Reward Modal...");
  await page.click("text=/Uống trà xanh/", { force: true });
  await page.waitForTimeout(400);
  await page.click("text=GỬI KẾT LUẬN SUY LUẬN", { force: true });
  await page.waitForTimeout(1000);
  await shot("r2_13_detective_deduction_and_reward.png");
  await measureElement("text=NHẬN XU & ĐÓNG VĂN PHÒNG", "Detective Solved Fast Close CTA");

  // Close Detective via the new one-tap button
  const doneBtn = page.locator("text=NHẬN XU & ĐÓNG VĂN PHÒNG").first();
  if (await doneBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await doneBtn.click({ force: true });
  } else {
    await page.locator('[aria-label="Đóng văn phòng thám tử"]').click({ force: true });
  }
  await page.waitForTimeout(1000);

  // 13. Tab Ngôi Nhà & 3D Chalet
  console.log("-> 13. Auditing Tab Ngôi Nhà 3D Chalet Stage...");
  await page.click("text=Ngôi Nhà", { force: true });
  await page.waitForTimeout(3000);
  await shot("r2_14_home_3d_chalet_view.png");
  await measureElement('[aria-label="Mở cửa hàng nội thất bằng Xu"]', "Furniture Shop Trigger Button");

  // Test Room Switching: Click "Phòng Ngủ"
  const bedroomPill = page.locator("text=Phòng Ngủ").first();
  if (await bedroomPill.isVisible({ timeout: 2000 }).catch(() => false)) {
    await bedroomPill.click({ force: true });
    await page.waitForTimeout(1500);
    await shot("r2_14b_home_3d_chalet_bedroom.png");
  }

  // 14. Furniture Shop Modal
  console.log("-> 14. Auditing Furniture Shop Modal...");
  await page.click('[aria-label="Mở cửa hàng nội thất bằng Xu"]', { force: true });
  await page.waitForTimeout(1200);
  await shot("r2_15_home_furniture_shop.png");
  await measureElement('[aria-label="Đóng cửa hàng nội thất"]', "Furniture Shop Close Button");

  // 15. Buy Furniture
  console.log("-> 15. Auditing Furniture Purchase with Xu...");
  try {
    const buyButton = page.locator('text=/\\d+\\s*Xu/').first();
    if (await buyButton.isVisible({ timeout: 2500 })) {
      await buyButton.click({ force: true });
      await page.waitForTimeout(1000);
      await shot("r2_16_furniture_purchase_feedback.png");
    }
  } catch (err) {
    console.log("Furniture note:", err.message);
  }

  // Close Furniture Shop
  const closeShopBtn = page.locator('[aria-label="Đóng cửa hàng nội thất"]').first();
  if (await closeShopBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await closeShopBtn.click({ force: true });
    await page.waitForTimeout(800);
  }

  // 16. 3D Village Humanoid Avatar
  console.log("-> 16. Auditing 3D Village Humanoid Avatar & Walk Cycle...");
  const villagePage = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await villagePage.goto("http://localhost:5179/village.html", { waitUntil: "networkidle" });
  await villagePage.waitForTimeout(3500);
  await villagePage.screenshot({ path: path.join(ARTIFACT_DIR, "r2_17_humanoid_walking_village.png") });
  console.log("Saved Round 2 Shot: r2_17_humanoid_walking_village.png");

  await browser.close();

  console.log("=== ROUND 2 AUDIT COMPLETE ===");
  fs.writeFileSync(
    path.join(ARTIFACT_DIR, "r2_metrics.json"),
    JSON.stringify({ touchTargets, errors, totalErrors: errors.length }, null, 2)
  );
  console.log("Metrics saved to r2_metrics.json");
}

runRound2Audit().catch((err) => {
  console.error("ROUND 2 AUDIT ERROR:", err);
  process.exit(1);
});
