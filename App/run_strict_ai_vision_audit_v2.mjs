import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const ARTIFACT_DIR = "C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb";
const R1_DIR = path.join(ARTIFACT_DIR, "round1_audit_v2");
const R2_DIR = path.join(ARTIFACT_DIR, "round2_audit_v2");

fs.mkdirSync(R1_DIR, { recursive: true });
fs.mkdirSync(R2_DIR, { recursive: true });

async function runAudit() {
  const browser = await chromium.launch({ headless: true });

  console.log("=== ROUND 1: Mobile Portrait (390x844) ===");
  const mobileCtx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15",
  });
  const mobilePage = await mobileCtx.newPage();

  // Test 1: Onboarding Quiz Discovery Screen
  console.log("Navigating to / (onboarding quiz)...");
  await mobilePage.goto("http://localhost:8081", { waitUntil: "networkidle", timeout: 15000 });
  await mobilePage.waitForTimeout(1000);

  // Check if we need to progress through onboarding steps
  let stepFound = false;
  for (let i = 0; i < 5; i++) {
    const text = await mobilePage.textContent("body");
    if (text.includes("Bạn cần quan tâm điều gì?") || text.includes("KHÁM PHÁ SỨC KHỎE")) {
      stepFound = true;
      console.log("Found discovery survey card!");
      break;
    }
    // Try clicking available continue buttons
    const btnTexts = ["Bắt đầu hành trình", "Tiếp Tục Khám Phá Vấn Đề", "Mình sẵn sàng rồi"];
    for (const bText of btnTexts) {
      const btn = mobilePage.getByText(bText, { exact: false }).first();
      if (await btn.isVisible().catch(() => false)) {
        console.log(`Clicking step CTA: ${bText}`);
        await btn.click();
        await mobilePage.waitForTimeout(1000);
        break;
      }
    }
  }

  await mobilePage.waitForTimeout(1500);
  const quizPath = path.join(R1_DIR, "01_quiz_discovery_portrait.png");
  await mobilePage.screenshot({ path: quizPath, fullPage: false });
  console.log(`Saved ${quizPath}`);

  // Test 2: Swiss Village World Screen (Portrait)
  console.log("Navigating to / (game)/world...");
  await mobilePage.goto("http://localhost:8081", { waitUntil: "networkidle", timeout: 15000 });
  await mobilePage.evaluate(() => {
    window.location.hash = "#/(game)/world";
  });
  await mobilePage.waitForTimeout(2000);

  // If still on onboarding, click "Tiếp tục" or skip to world
  const exploreTab = mobilePage.getByText("Thế Giới", { exact: false }).first();
  if (await exploreTab.isVisible().catch(() => false)) {
    await exploreTab.click();
    await mobilePage.waitForTimeout(1000);
  }

  await mobilePage.waitForTimeout(3000); // Wait for animated visitors to initialize
  const worldPortraitPath = path.join(R1_DIR, "02_world_village_portrait.png");
  await mobilePage.screenshot({ path: worldPortraitPath, fullPage: false });
  console.log(`Saved ${worldPortraitPath}`);

  // Test 3: 3D Chalet Screen (Portrait)
  console.log("Navigating to Home tab...");
  const homeTab = mobilePage.getByText("Ngôi Nhà", { exact: false }).first();
  if (await homeTab.isVisible().catch(() => false)) {
    await homeTab.click();
    await mobilePage.waitForTimeout(3000);
  }
  const homePortraitPath = path.join(R1_DIR, "03_home_3d_portrait.png");
  await mobilePage.screenshot({ path: homePortraitPath, fullPage: false });
  console.log(`Saved ${homePortraitPath}`);

  await mobileCtx.close();

  console.log("=== ROUND 2: Landscape & Desktop ===");
  // Test 4: Mobile Landscape (1024x507)
  const landCtx = await browser.newContext({
    viewport: { width: 1024, height: 507 },
    deviceScaleFactor: 2,
  });
  const landPage = await landCtx.newPage();
  await landPage.goto("http://localhost:8081", { waitUntil: "networkidle", timeout: 15000 });
  await landPage.evaluate(() => {
    window.location.hash = "#/(game)/world";
  });
  await landPage.waitForTimeout(3000);
  const worldLandPath = path.join(R2_DIR, "01_world_landscape_1024x507.png");
  await landPage.screenshot({ path: worldLandPath, fullPage: false });
  console.log(`Saved ${worldLandPath}`);
  await landCtx.close();

  // Test 5: Desktop (1280x800)
  const deskCtx = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 2,
  });
  const deskPage = await deskCtx.newPage();
  await deskPage.goto("http://localhost:8081", { waitUntil: "networkidle", timeout: 15000 });
  await deskPage.evaluate(() => {
    window.location.hash = "#/(game)/world";
  });
  await deskPage.waitForTimeout(3000);
  const worldDeskPath = path.join(R2_DIR, "02_world_desktop_1280x800.png");
  await deskPage.screenshot({ path: worldDeskPath, fullPage: false });
  console.log(`Saved ${worldDeskPath}`);

  // Test 6: 3D Chalet Desktop
  const deskHomeTab = deskPage.getByText("Ngôi Nhà", { exact: false }).first();
  if (await deskHomeTab.isVisible().catch(() => false)) {
    await deskHomeTab.click();
    await deskPage.waitForTimeout(3500);
  }
  const homeDeskPath = path.join(R2_DIR, "03_home_3d_desktop.png");
  await deskPage.screenshot({ path: homeDeskPath, fullPage: false });
  console.log(`Saved ${homeDeskPath}`);
  await deskCtx.close();

  await browser.close();
  console.log("AUDIT CAPTURES COMPLETE!");
}

runAudit().catch(err => {
  console.error("Audit error:", err);
  process.exit(1);
});
