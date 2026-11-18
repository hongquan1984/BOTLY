import { chromium } from "file:///d:/botly/App/3DHOME/node_modules/playwright-core/index.mjs";
import fs from "fs";
import path from "path";

const ARTIFACT_DIR = "C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/human_and_quiz_audit";
if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

async function run() {
  console.log("=== HEALTHCLUES AUDIT: DISCOVERY BALANCE & REALISTIC HUMAN CHARACTER ===");
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    args: ["--no-sandbox", "--disable-gpu-sandbox"],
  });

  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1",
  });

  const page = await context.newPage();

  try {
    // -------------------------------------------------------------
    // PART 1: TEST DISCOVERY QUIZ SCREEN 1
    // -------------------------------------------------------------
    console.log("-> 1. Navigating to /quiz...");
    await page.goto("http://localhost:8081/quiz", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    // Welcome -> click "Bắt Đầu Hành Trình"
    console.log("Clicking 'Bắt Đầu Hành Trình'...");
    await page.locator('text=Bắt Đầu Hành Trình').click();
    await page.waitForTimeout(800);

    // Quest Choice -> click "Tiếp tục"
    console.log("Clicking 'Tiếp tục' to enter Mascot Welcome...");
    await page.locator('text=Tiếp tục').click();
    await page.waitForTimeout(800);

    // Mascot Welcome -> click "Mình sẵn sàng rồi"
    console.log("Clicking 'Mình sẵn sàng rồi' to enter Discovery Screen 1...");
    const readyBtn = page.locator('text=Mình sẵn sàng rồi');
    if (await readyBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await readyBtn.click();
      await page.waitForTimeout(1200);
    }

    // Now on Discovery screen 1: "Bạn cần quan tâm điều gì?"
    console.log("Capturing Discovery Screen 1 (The exact screen user reported)...");
    const quizShotPath = path.join(ARTIFACT_DIR, "10_discovery_screen1_balanced_perfect.png");
    await page.screenshot({ path: quizShotPath, fullPage: false });
    console.log("Saved Discovery Screen 1 to:", quizShotPath);

    // -------------------------------------------------------------
    // PART 2: TEST REALISTIC HUMAN CHARACTERS IN WORLD
    // -------------------------------------------------------------
    console.log("-> 2. Setting completed onboarding and tour, navigating to /world...");
    await page.evaluate(() => {
      localStorage.setItem("healthclues-onboarding-completed", "true");
      localStorage.setItem("healthclues_onboarding_completed", "true");
      localStorage.setItem("healthclues-interactive-spotlight-tour-v4", "true");
      localStorage.setItem("healthclues_ftue_completed_v1", "true");
      localStorage.setItem("healthclues-user-profile", JSON.stringify({
        displayName: "Hiệp Sĩ Khỏe Mạnh",
        level: 2,
        exp: 120,
        coins: 350,
      }));
    });

    await page.goto("http://localhost:8081/world", { waitUntil: "networkidle" });
    await page.waitForTimeout(2500);

    // Close any lingering modal or tour if open
    const skipBtn = page.locator('text=Bỏ qua ✕').or(page.locator('text=Bỏ qua'));
    if (await skipBtn.first().isVisible({ timeout: 1000 }).catch(() => false)) {
      await skipBtn.first().click();
      await page.waitForTimeout(500);
    }

    // Capture clean full view of village square with realistic humans
    console.log("Capturing Clean World Screen with Realistic Human Characters...");
    const worldCleanPath = path.join(ARTIFACT_DIR, "11_world_realistic_characters_clean.png");
    await page.screenshot({ path: worldCleanPath, fullPage: false });
    console.log("Saved Clean World to:", worldCleanPath);

    // Tap to walk down-right across plaza
    console.log("Tapping to walk across plaza...");
    await page.mouse.click(290, 680);
    await page.waitForTimeout(100);

    const walkingFrame1 = path.join(ARTIFACT_DIR, "12_world_human_walking_frame1.png");
    await page.screenshot({ path: walkingFrame1, fullPage: false });
    console.log("Saved Walking Frame 1 to:", walkingFrame1);

    await page.waitForTimeout(150);
    const walkingFrame2 = path.join(ARTIFACT_DIR, "13_world_human_walking_frame2.png");
    await page.screenshot({ path: walkingFrame2, fullPage: false });
    console.log("Saved Walking Frame 2 to:", walkingFrame2);

    await page.waitForTimeout(2500);
    const arrivedClean = path.join(ARTIFACT_DIR, "14_world_human_arrived_clean.png");
    await page.screenshot({ path: arrivedClean, fullPage: false });
    console.log("Saved Arrived Clean to:", arrivedClean);

    console.log("=== ALL CAPTURES COMPLETE! ===");
  } catch (err) {
    console.error("Test error:", err);
  } finally {
    await browser.close();
  }
}

run();
