import path from "path";
import fs from "fs";
import { chromium } from "file:///d:/botly/App/word3d/node_modules/playwright-core/index.mjs";

const ARTIFACTS_DIR = "C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb";

async function run() {
  console.log("=== HEALTHCLUES — VERIFY TOP COMPACT TOUR & LOWERED OVERVIEW VILLAGE ===");
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

  console.log("Navigating to world with fresh tour state...");
  await page.goto("http://localhost:8081");
  await page.evaluate(() => {
    localStorage.setItem("healthclues-onboarding-completed", "true");
    localStorage.setItem("@healthclues_quiz_completed", "true");
    localStorage.setItem("healthclues_realm_mode_v1", "healthclues-realm");
    localStorage.removeItem("healthclues-village-cinematic-tour-v1");
  });

  await page.goto("http://localhost:8081/(game)/world", { waitUntil: "networkidle" });
  await page.waitForTimeout(4500);

  // Stop 0: Welcome & Overview
  console.log("Taking shot of Stop 0 (Overview)...");
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "shot_top_tour_00_overview.png") });

  // Click Tiếp tục -> Stop 1: Ngôi Nhà Của Bạn
  console.log("Advancing to Step 1 (Ngôi Nhà Của Bạn)...");
  await page.getByText("Tiếp tục").last().click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "shot_top_tour_01_home.png") });

  // Click Tiếp tục -> Stop 2: Nhà Thảo Mộc
  console.log("Advancing to Step 2 (Nhà Thảo Mộc)...");
  await page.getByText("Tiếp tục").last().click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "shot_top_tour_02_herbal.png") });

  // Click Tiếp tục -> Stop 3: Nhà Cơ Thể
  console.log("Advancing to Step 3 (Nhà Cơ Thể)...");
  await page.getByText("Tiếp tục").last().click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "shot_top_tour_03_body.png") });

  // Click Tiếp tục -> Stop 4: Văn Phòng Giải Mã
  console.log("Advancing to Step 4 (Văn Phòng Giải Mã)...");
  await page.getByText("Tiếp tục").last().click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "shot_top_tour_04_detective.png") });

  // Click Tiếp tục -> Stop 5: Quảng Trường
  console.log("Advancing to Step 5 (Quảng Trường)...");
  await page.getByText("Tiếp tục").last().click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "shot_top_tour_05_plaza.png") });

  // Click Tiếp tục -> Stop 6: Bắt Đầu Khám Phá
  console.log("Advancing to Step 6 (Bắt Đầu Khám Phá)...");
  await page.getByText("Tiếp tục").last().click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "shot_top_tour_06_ready.png") });

  // Click Bắt đầu khám phá
  console.log("Clicking Bắt đầu khám phá...");
  await page.getByText("Bắt đầu khám phá").last().click();
  await page.waitForTimeout(2500);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "shot_top_tour_07_world_active.png") });

  console.log("=== TOUR CAPTURE COMPLETE ===");
  await browser.close();
}

run().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
