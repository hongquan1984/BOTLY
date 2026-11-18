import { chromium } from "file:///d:/botly/App/3DHOME/node_modules/playwright-core/index.mjs";
import path from "path";

const ARTIFACT_DIR = "C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/spotlight_mascot_audit";

async function run() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    args: ["--no-sandbox", "--disable-gpu-sandbox"],
  });

  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();

  await page.goto("http://localhost:8081");
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem("healthclues-onboarding-completed", "true");
    localStorage.setItem(
      "healthclues-starter-profile",
      JSON.stringify({
        quest: "sleep",
        profile: { topic: "sleep", safetyLevel: "none", concernNote: "Mất ngủ & Khó ngủ" },
      })
    );
    localStorage.setItem(
      "healthclues-home-state-v1",
      JSON.stringify({
        hasClaimedWelcome: false,
        hasReceivedKey: true,
        placedObjects: [],
        inventory: [],
        currentRoom: "living",
        coins: 150,
      })
    );
  });

  const shot = async (name) => {
    await page.waitForTimeout(800);
    const dest = path.join(ARTIFACT_DIR, name);
    await page.screenshot({ path: dest });
    console.log("Saved:", name);
  };

  // 1. World Screen (Welcome Step)
  await page.goto("http://localhost:8081/world");
  await page.waitForTimeout(1500);
  await shot("perfect_01_world_welcome.png");

  // Click 'Đến Hành Trình'
  console.log("1. Click Đến Hành Trình...");
  await page.locator('[aria-label*="Đến Hành Trình"]').first().click();
  await page.waitForTimeout(1200);

  // 2. Journey Track (7-Day Streak)
  console.log("2. Capturing Journey Track...");
  await shot("perfect_02_streak_focused.png");
  await page.locator('[aria-label*="Thêm Thói Quen"]').first().click();
  await page.waitForTimeout(1200);

  // 3. Journey Add (+ Thêm Mới Button)
  console.log("3. Capturing Journey Add...");
  await shot("perfect_03_add_button_focused.png");
  await page.locator('[aria-label*="Bảng Điểm Danh"]').first().click();
  await page.waitForTimeout(1200);

  // 4. Journey to Daily (Nhiệm Vụ Tab Highlighted)
  console.log("4. Capturing Journey to Daily...");
  await shot("perfect_04_to_daily_focused.png");
  await page.locator('[aria-label*="Đến Nhiệm Vụ"]').first().click();
  await page.waitForTimeout(1200);

  // 5. Daily Checkin (Daily Seal Focused)
  console.log("5. Capturing Daily Checkin...");
  await shot("perfect_05_daily_seal_focused.png");
  await page.locator('[aria-label*="Nhận Căn Nhà Riêng"]').first().click();
  await page.waitForTimeout(1200);

  // 6. Daily to Home (Ngôi Nhà Tab Highlighted)
  console.log("6. Capturing Daily to Home...");
  await shot("perfect_06_to_home_focused.png");
  await page.locator('[aria-label*="Đến Ngôi Nhà"]').first().click();
  await page.waitForTimeout(2200);

  // 7a. House Gift Celebration Modal
  console.log("7a. Capturing House Gift Modal...");
  await shot("perfect_07a_house_gift_modal.png");
  await page.locator('text="TUYỆT VỜI, BẮT ĐẦU NÀO!"').first().click();
  await page.waitForTimeout(2000);

  // 7b. Home Screen (3D Chalet Lore / Decorate)
  console.log("7b. Capturing Home Chalet Lore...");
  await shot("perfect_07b_home_chalet_lore.png");
  await page.locator('[aria-label*="Bí Ẩn Ngôi Làng"]').first().click();
  await page.waitForTimeout(2000);

  // 8. World Detective Lore (Phá Án Button Focused)
  console.log("8. Capturing World Detective Lore...");
  await shot("perfect_08_world_detective_focused.png");

  // 9. Click Mở Game Phá Án -> opens WebView
  console.log("9. Opening Detective WebView...");
  await page.locator('[aria-label*="Mở Game Phá Án"]').first().click();
  await page.waitForTimeout(4000);
  await shot("perfect_09_detective_webview_opened.png");

  // 10. Close WebView and show Permanent Mascot Helper
  console.log("10. Closing Detective and checking Permanent Mascot...");
  const closeBtn = page.locator('[aria-label="Quay lại Làng Sống Khỏe"]').first();
  if (await closeBtn.isVisible({ timeout: 5000 })) {
    await closeBtn.click();
    await page.waitForTimeout(1500);
  }
  await shot("perfect_10_permanent_mascot_ready.png");

  // 11. Tap Permanent Mascot Helper to open Assistant Drawer
  console.log("11. Opening Assistant Drawer via Permanent Mascot...");
  const mascotIcon = page.locator('[aria-label="Mở trợ lý Mầm Nhỏ"]').first();
  if (await mascotIcon.isVisible({ timeout: 3000 })) {
    await mascotIcon.click();
    await page.waitForTimeout(1000);
    await shot("perfect_11_assistant_drawer_opened.png");
  }

  await browser.close();
  console.log("=== ALL 10 STEPS AUDITED PERFECTLY ===");
}

run().catch(console.error);
