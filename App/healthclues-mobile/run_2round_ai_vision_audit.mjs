import { chromium } from "file:///d:/botly/App/3DHOME/node_modules/playwright-core/index.mjs";
import fs from "fs";
import path from "path";

const AUDIT_DIR_R1 = "C:\\Users\\Admin\\.gemini\\antigravity\\brain\\657e9da8-7551-4202-bc28-ecfcfda170bb\\round1_audit";
const AUDIT_DIR_R2 = "C:\\Users\\Admin\\.gemini\\antigravity\\brain\\657e9da8-7551-4202-bc28-ecfcfda170bb\\round2_audit";

[AUDIT_DIR_R1, AUDIT_DIR_R2].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

async function runTwoRoundAudit() {
  console.log("=== STARTING 2-ROUND AI-VISION & ERGONOMIC AUDIT ===");

  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    args: ["--no-sandbox", "--disable-gpu-sandbox"],
  });

  const errors = [];

  // =========================================================================
  // ROUND 1: MOBILE PORTRAIT (390 x 844 - iPhone 15 Pro)
  // =========================================================================
  console.log("\n>>> EXECUTING ROUND 1: MOBILE PORTRAIT (390x844) <<<");
  const ctxR1 = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    hasTouch: true,
    isMobile: true,
  });

  const pageR1 = await ctxR1.newPage();
  pageR1.on("pageerror", (err) => {
    console.error("[R1 PAGE_ERROR]:", err.message);
    errors.push({ round: 1, type: "pageerror", msg: err.message });
  });

  // 1.1 Onboarding Discovery Survey
  console.log("Testing 1.1: Onboarding Quiz Survey Screen...");
  await pageR1.goto("http://localhost:8081/quiz", { waitUntil: "networkidle" });
  await pageR1.evaluate(() => {
    localStorage.clear();
    localStorage.setItem("healthclues-locale", "vi");
  });
  await pageR1.reload({ waitUntil: "networkidle" });
  await pageR1.waitForTimeout(1000);

  // Click through steps until reaching discovery survey
  for (let step = 0; step < 6; step++) {
    const bodyText = await pageR1.textContent("body");
    if (bodyText.includes("Bạn cần quan tâm điều gì?") || bodyText.includes("KHÁM PHÁ SỨC KHỎE")) {
      console.log("-> Reached Discovery survey card!");
      break;
    }
    const ctas = [
      'text=Bắt đầu hành trình',
      '[aria-label="start-journey-cta-btn"]',
      'text=Tiếp Tục Khám Phá Vấn Đề',
      '[aria-label="quest-choice-continue-btn"]',
      'text=Mình sẵn sàng rồi',
      '[aria-label="mascot-welcome-continue-btn"]',
    ];
    for (const cta of ctas) {
      const loc = pageR1.locator(cta).first();
      if (await loc.isVisible().catch(() => false)) {
        console.log(`-> Clicking step CTA: ${cta}`);
        await loc.click();
        await pageR1.waitForTimeout(800);
        break;
      }
    }
  }
  await pageR1.waitForTimeout(1500);

  await pageR1.screenshot({
    path: path.join(AUDIT_DIR_R1, "01_quiz_discovery_portrait.png"),
    fullPage: false,
  });
  console.log("-> Saved 01_quiz_discovery_portrait.png");

  // 1.2 World Screen (Sleep Valley Swiss Village)
  console.log("Testing 1.2: World Screen - Swiss Village Diorama & 2.5D Parallax...");
  await pageR1.evaluate(() => {
    localStorage.setItem("healthclues-onboarding-completed", "true");
    localStorage.setItem("healthclues-tutorial-completed", "true");
  });
  await pageR1.goto("http://localhost:8081/world", { waitUntil: "networkidle" });
  await pageR1.waitForTimeout(2500);

  await pageR1.screenshot({
    path: path.join(AUDIT_DIR_R1, "02_world_village_portrait.png"),
    fullPage: false,
  });
  console.log("-> Saved 02_world_village_portrait.png");

  // 1.3 Player Walk on Cobblestone Plaza
  console.log("Testing 1.3: Interactive 3D CGI Adventurer Walking...");
  await pageR1.mouse.click(240, 520);
  await pageR1.waitForTimeout(400); // capture during walk
  await pageR1.screenshot({
    path: path.join(AUDIT_DIR_R1, "03_world_player_walking.png"),
    fullPage: false,
  });
  console.log("-> Saved 03_world_player_walking.png");

  // Wait for walk completion
  await pageR1.waitForTimeout(2000);

  // 1.4 Overview Mode (Numbered Pins & Legend)
  console.log("Testing 1.4: World Overview Mode...");
  try {
    const toanCanhBtn = pageR1.locator('text=Toàn Cảnh').first();
    if (await toanCanhBtn.isVisible({ timeout: 2000 })) {
      await toanCanhBtn.click();
      await pageR1.waitForTimeout(1000);
    }
  } catch (e) {}
  await pageR1.screenshot({
    path: path.join(AUDIT_DIR_R1, "04_world_overview_portrait.png"),
    fullPage: false,
  });
  console.log("-> Saved 04_world_overview_portrait.png");

  // Return to close view
  try {
    const toanCanhBtn = pageR1.locator('text=Cận Cảnh').first();
    if (await toanCanhBtn.isVisible({ timeout: 2000 })) {
      await toanCanhBtn.click();
      await pageR1.waitForTimeout(800);
    }
  } catch (e) {}

  // 1.5 3D Chalet Home View
  console.log("Testing 1.5: 3D Chalet Home Stage (Portrait)...");
  await pageR1.goto("http://localhost:8081/home", { waitUntil: "networkidle" });
  await pageR1.waitForTimeout(3000);
  await pageR1.screenshot({
    path: path.join(AUDIT_DIR_R1, "05_home_3d_portrait.png"),
    fullPage: false,
  });
  console.log("-> Saved 05_home_3d_portrait.png");

  await ctxR1.close();

  // =========================================================================
  // ROUND 2: LANDSCAPE & DESKTOP (1024 x 507 & 1280 x 800)
  // =========================================================================
  console.log("\n>>> EXECUTING ROUND 2: LANDSCAPE & DESKTOP <<<");

  // 2.1 Landscape 1024x507 (User Ground Truth Dimension)
  const ctxR2Landscape = await browser.newContext({
    viewport: { width: 1024, height: 507 },
    deviceScaleFactor: 2,
    hasTouch: false,
  });
  const pageR2Landscape = await ctxR2Landscape.newPage();
  pageR2Landscape.on("pageerror", (err) => {
    console.error("[R2 PAGE_ERROR]:", err.message);
    errors.push({ round: 2, type: "pageerror", msg: err.message });
  });

  await pageR2Landscape.goto("http://localhost:8081/world", { waitUntil: "networkidle" });
  await pageR2Landscape.evaluate(() => {
    localStorage.setItem("healthclues-onboarding-completed", "true");
    localStorage.setItem("healthclues-tutorial-completed", "true");
  });
  await pageR2Landscape.reload({ waitUntil: "networkidle" });
  await pageR2Landscape.waitForTimeout(2500);

  await pageR2Landscape.screenshot({
    path: path.join(AUDIT_DIR_R2, "01_world_landscape_1024x507.png"),
    fullPage: false,
  });
  console.log("-> Saved 01_world_landscape_1024x507.png");

  // 2.2 Desktop 1280x800 Wide Perspective
  console.log("Testing 2.2: Desktop 1280x800 Wide Perspective...");
  const ctxR2Desktop = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1,
    hasTouch: false,
  });
  const pageR2Desktop = await ctxR2Desktop.newPage();
  await pageR2Desktop.goto("http://localhost:8081/world", { waitUntil: "networkidle" });
  await pageR2Desktop.evaluate(() => {
    localStorage.setItem("healthclues-onboarding-completed", "true");
    localStorage.setItem("healthclues-tutorial-completed", "true");
  });
  await pageR2Desktop.reload({ waitUntil: "networkidle" });
  await pageR2Desktop.waitForTimeout(2500);

  await pageR2Desktop.screenshot({
    path: path.join(AUDIT_DIR_R2, "02_world_desktop_1280x800.png"),
    fullPage: false,
  });
  console.log("-> Saved 02_world_desktop_1280x800.png");

  // 2.3 Desktop 1280x800 3D Chalet Home
  console.log("Testing 2.3: Desktop 1280x800 3D Chalet Home...");
  await pageR2Desktop.goto("http://localhost:8081/home", { waitUntil: "networkidle" });
  await pageR2Desktop.waitForTimeout(3000);
  await pageR2Desktop.screenshot({
    path: path.join(AUDIT_DIR_R2, "03_home_3d_desktop.png"),
    fullPage: false,
  });
  console.log("-> Saved 03_home_3d_desktop.png");

  await ctxR2Landscape.close();
  await ctxR2Desktop.close();
  await browser.close();

  console.log("\n=== 2-ROUND CAPTURE COMPLETED ===");
  console.log(`Total Page Errors Encountered: ${errors.length}`);
  return errors;
}

runTwoRoundAudit().then((errs) => {
  if (errs.length > 0) {
    console.error("Audit finished with errors:", errs);
    process.exit(1);
  } else {
    console.log("AUDIT SUCCESS: 0 PAGE ERRORS!");
    process.exit(0);
  }
}).catch((err) => {
  console.error("FATAL AUDIT ERROR:", err);
  process.exit(1);
});
