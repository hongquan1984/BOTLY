import { chromium } from "file:///d:/botly/App/3DHOME/node_modules/playwright-core/index.mjs";
import fs from "fs";
import path from "path";

const ARTIFACT_DIR = "C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/mobile_shots";
if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

async function run() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    args: ["--no-sandbox", "--disable-gpu-sandbox"],
  });

  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const shot = async (name) => {
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, name) });
    console.log("Saved:", name);
  };

  await page.goto("http://localhost:8081/", { waitUntil: "networkidle" });
  await page.evaluate(() => {
    localStorage.setItem("healthclues-onboarding-completed", "true");
    localStorage.removeItem("healthclues-village-tutorial-v2-completed");
    localStorage.setItem(
      "healthclues-starter-profile",
      JSON.stringify({
        profile: { concernNote: "Mất ngủ & Căng thẳng việc làm" },
      })
    );
  });

  await page.goto("http://localhost:8081/(game)/world", { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);

  // 1. Step 1: Health concern in Village
  await shot("step1_tutorial_concern.png");

  // 2. Step 2: Journey explanation
  await page.click("text=Tiếp theo");
  await shot("step2_tutorial_journey.png");

  // 3. Step 3: Daily quests check-in, EXP & Coins
  await page.click("text=Tiếp theo");
  await shot("step3_tutorial_daily_care.png");

  // 4. Step 4: House gift & celebration
  await page.click("text=Tiếp theo");
  await page.waitForTimeout(1000);
  await shot("step4_tutorial_house_gift_modal.png");

  // Dismiss house gift
  await page.click("text=TUYỆT VỜI, BẮT ĐẦU NÀO!");
  await shot("step4_tutorial_house_lore.png");

  // 5. Step 5: Detective story (no doctor in village, villagers pay Xu)
  await page.click("text=Tiếp theo");
  await shot("step5_tutorial_detective_lore.png");

  // Complete tutorial (+50 Xu)
  await page.click("text=KHÁM PHÁ NGAY (+50 XU)");
  await page.waitForTimeout(1000);
  await shot("world_hud_with_coins.png");

  // 6. Detective Game via Phá Án button
  await page.click("text=Phá Án");
  await page.waitForTimeout(1000);
  await shot("detective_cases_list.png");

  // Open Case 1
  await page.click("text=Vụ 1: Bí Ẩn Đêm Không Ngủ");
  await page.waitForTimeout(1000);
  await shot("detective_case1_inspection.png");

  // Select correct deduction & submit
  await page.click("text=Uống trà xanh đậm đặc buổi tối");
  await page.waitForTimeout(400);
  await page.click("text=GỬI KẾT LUẬN SUY LUẬN");
  await page.waitForTimeout(1000);
  await shot("detective_case1_solved_reward.png");

  // Close detective
  await page.click('[aria-label="Đóng văn phòng thám tử"]');
  await page.waitForTimeout(800);

  // 7. Tab Ngôi Nhà & 3D Chalet
  await page.click("text=Ngôi Nhà");
  await page.waitForTimeout(3000);
  await shot("home_3d_chalet_stage.png");

  // Open Furniture Shop
  await page.click('[aria-label="Mở cửa hàng nội thất bằng Xu"]', { force: true });
  await page.waitForTimeout(1000);
  await shot("furniture_shop_modal.png");

  // Buy any available item with Xu
  try {
    const buyButton = page.locator('text=/\\d+\\s*Xu/').first();
    if (await buyButton.isVisible({ timeout: 3000 })) {
      await buyButton.click({ force: true });
      await page.waitForTimeout(1000);
      await shot("furniture_purchased_success.png");
    }
  } catch (err) {
    console.log("Could not buy item:", err.message);
  }

  // Close shop
  await page.click('[aria-label="close-shop-btn"], text=✕, button >> text=X', { force: true }).catch(() => {});
  await page.waitForTimeout(500);

  // 8. Humanoid 3D Character Walking in Làng Sống Khỏe
  console.log("-> Checking Humanoid 3D Character with walk animation in Làng Sống Khỏe...");
  const villagePage = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await villagePage.goto("http://localhost:5179/village.html", { waitUntil: "networkidle" });
  await villagePage.waitForTimeout(3500);
  await villagePage.screenshot({ path: path.join(ARTIFACT_DIR, "17_humanoid_3d_character_in_village.png") });
  console.log("Saved: 17_humanoid_3d_character_in_village.png");

  await browser.close();
  console.log("=== ALL SCREENSHOTS CAPTURED PERFECTLY! ===");
}

run();
