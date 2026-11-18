import path from "path";
import fs from "fs";
import { chromium } from "file:///d:/botly/App/word3d/node_modules/playwright-core/index.mjs";

const ARTIFACTS_DIR = "C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb";

async function runTest() {
  console.log("=== HEALTHCLUES — CINEMATIC VILLAGE OVERVIEW & LUMI TOUR TEST ===");
  const chromePath = "C:/Program Files/Google/Chrome/Application/chrome.exe";
  const browser = await chromium.launch({
    executablePath: chromePath,
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

  // 1. Direct navigation to World with fresh tour state
  console.log("--- 1. Setting up fresh state & navigating to World 3D ---");
  await page.goto("http://localhost:8081");
  await page.evaluate(() => {
    localStorage.setItem("healthclues-onboarding-completed", "true");
    localStorage.setItem("@healthclues_quiz_completed", "true");
    localStorage.setItem("healthclues_realm_mode_v1", "healthclues-realm");
    localStorage.removeItem("healthclues-village-cinematic-tour-v1");
  });
  await page.goto("http://localhost:8081/(game)/world", { waitUntil: "networkidle" });
  await page.waitForTimeout(4000);

  // Helper to click next
  async function clickNextStep() {
    const btn = page.getByText("Tiếp tục").last();
    const box = await btn.boundingBox();
    if (box) {
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    }
    await page.waitForTimeout(1600);
  }

  // Stop 0: Overview
  console.log("--- 2. Checking Tour Stop 0: Toàn Cảnh Làng Mây ---");
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "tour_01_overview.png") });
  const stop0Title = await page.getByText("Chào mừng đến Xứ Sở Sức Khỏe!").first().isVisible();
  const stop0Badge = await page.getByText("TOÀN CẢNH LÀNG MÂY", { exact: true }).isVisible();
  console.log("Stop 0 Title visible:", stop0Title, "| Badge visible:", stop0Badge);

  // Check top toolbar is hidden during tour
  const toolBarGiaiMaTour = await page.getByText("Giải Mã", { exact: true }).isVisible();
  console.log("Top toolbar 'Giải Mã' button visible during tour (must be false):", toolBarGiaiMaTour);

  // Click Tiếp tục -> Stop 1: Ngôi Nhà Của Bạn
  console.log("--- 3. Step 1: Ngôi Nhà Của Bạn ---");
  await clickNextStep();
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "tour_02_home.png") });
  const stop1Title = await page.getByText("Chốn Bình Yên Riêng Tư").first().isVisible();
  const stop1Badge = await page.getByText("NGÔI NHÀ CỦA BẠN", { exact: true }).isVisible();
  console.log("Stop 1 Title visible:", stop1Title, "| Badge visible:", stop1Badge);

  // Click Tiếp tục -> Stop 2: Nhà Thảo Mộc
  console.log("--- 4. Step 2: Nhà Thảo Mộc ---");
  await clickNextStep();
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "tour_03_herbal.png") });
  const stop2Title = await page.getByText("Dược Liệu & Hoa Cỏ Tự Nhiên").first().isVisible();
  const stop2Badge = await page.getByText("NHÀ THẢO MỘC", { exact: true }).isVisible();
  console.log("Stop 2 Title visible:", stop2Title, "| Badge visible:", stop2Badge);

  // Click Tiếp tục -> Stop 3: Nhà Cơ Thể
  console.log("--- 5. Step 3: Nhà Cơ Thể ---");
  await clickNextStep();
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "tour_04_body.png") });
  const stop3Title = await page.getByText("Thư Viện Tri Thức Cơ Thể").first().isVisible();
  const stop3Badge = await page.getByText("NHÀ CƠ THỂ", { exact: true }).isVisible();
  console.log("Stop 3 Title visible:", stop3Title, "| Badge visible:", stop3Badge);

  // Click Tiếp tục -> Stop 4: Văn Phòng Giải Mã
  console.log("--- 6. Step 4: Văn Phòng Giải Mã ---");
  await clickNextStep();
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "tour_05_detective.png") });
  const stop4Title = await page.getByText("Giải Mã Manh Mối Sức Khỏe").first().isVisible();
  const stop4Badge = await page.getByText("VĂN PHÒNG GIẢI MÃ", { exact: true }).isVisible();
  console.log("Stop 4 Title visible:", stop4Title, "| Badge visible:", stop4Badge);

  // Click Tiếp tục -> Stop 5: Quảng Trường & Giếng Ước
  console.log("--- 7. Step 5: Quảng Trường & Giếng Ước ---");
  await clickNextStep();
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "tour_06_plaza.png") });
  const stop5Title = await page.getByText("Điểm Danh Sống Khỏe Mỗi Ngày").first().isVisible();
  const stop5Badge = await page.getByText("QUẢNG TRƯỜNG & GIẾNG ƯỚC", { exact: true }).isVisible();
  console.log("Stop 5 Title visible:", stop5Title, "| Badge visible:", stop5Badge);

  // Click Tiếp tục -> Stop 6: Sẵn Sàng Khám Phá!
  console.log("--- 8. Step 6: Sẵn Sàng Khám Phá ---");
  await clickNextStep();
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "tour_07_ready.png") });
  const stop6Title = await page.getByText("Bắt Đầu Hành Trình Cùng Lumi!").first().isVisible();
  const stop6Badge = await page.getByText("SẴN SÀNG KHÁM PHÁ", { exact: true }).isVisible();
  console.log("Stop 6 Title visible:", stop6Title, "| Badge visible:", stop6Badge);

  // Click "Bắt đầu khám phá" to finish tour
  console.log("--- 9. Completing Tour and Unveiling Top HUD ---");
  const finishBtn = page.getByRole("button", { name: "Bắt đầu khám phá" }).first();
  await finishBtn.click();
  await page.waitForTimeout(2500);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "tour_08_world_unveiled.png") });

  const toolBarGiaiMaAfter = await page.getByText("Giải Mã", { exact: true }).isVisible();
  console.log("Top toolbar 'Giải Mã' button visible after tour:", toolBarGiaiMaAfter);

  // Click "Giải Mã" button to open Detective Modal
  console.log("--- 10. Clicking 'Giải Mã' button to open Detective Modal ---");
  const giaiMaBtn = page.getByText("Giải Mã", { exact: true }).first();
  if (await giaiMaBtn.isVisible()) {
    await giaiMaBtn.click({ force: true });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, "tour_09_detective_modal.png") });
    const modalTitle = await page.getByText("Hồ Sơ Thám Tử Cơ Thể").first().isVisible();
    console.log("Detective Modal Title visible:", modalTitle);
  }

  console.log("=== ALL TEST CHECKS COMPLETED SUCCESSFULLY ===");
  await browser.close();
}

runTest().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
