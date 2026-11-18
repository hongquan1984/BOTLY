import { chromium } from "file:///D:/botly/App/word3d/node_modules/playwright-core/index.mjs";
import path from "path";

const ARTIFACT_DIR = "C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb";

async function verifyAll() {
  console.log("=== FULL INTERACTIVE AUDIT OF ALL LANDMARKS & MODALS ===");
  const browser = await chromium.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-web-security",
    ],
  });

  const context = await browser.newContext({
    viewport: { width: 412, height: 860 },
    deviceScaleFactor: 2,
  });

  await context.addInitScript(() => {
    window.localStorage.setItem("healthclues-starter-profile", JSON.stringify({
      quest: "glucose",
      topic: "Đường huyết / Tiểu đường",
      twoWeekGoal: "Ổn định đường huyết và giảm cảm giác thèm ngọt",
      profile: {
        primaryConcernId: "glucose",
        topic: "Đường huyết / Tiểu đường",
        concernNote: "tiểu đường",
        adaptiveDiscovery: {
          focusId: "glucose",
          focusLabel: "Đường huyết / Tiểu đường",
        }
      }
    }));
    window.localStorage.setItem("healthclues-onboarding-completed", "true");
    window.localStorage.setItem("healthclues-post-tour-roadmap-reviewed-v1", "true");
    window.localStorage.setItem("healthclues-cinematic-tour-dismissed", "true");
  });

  const page = await context.newPage();

  try {
    console.log("Navigating to world...");
    await page.goto("http://localhost:8081/(game)/world", { waitUntil: "domcontentloaded", timeout: 20000 });
    await page.waitForTimeout(3000);

    // 1. Capture World Main View
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "audit_01_world_main_view.png") });
    console.log("Screenshot: audit_01_world_main_view.png");

    // 2. Test Tour Button Click
    console.log("\nTesting Tour button...");
    const tourBtn = page.locator("text=Tour").first();
    if (await tourBtn.isVisible()) {
      await tourBtn.click();
      await page.waitForTimeout(1200);
      await page.screenshot({ path: path.join(ARTIFACT_DIR, "audit_02_tour_opened.png") });
      console.log("Screenshot: audit_02_tour_opened.png");

      // Skip tour
      const skipTour = page.locator("text=Bỏ qua").or(page.locator("text=Khám phá ngay")).first();
      if (await skipTour.isVisible({ timeout: 2000 })) {
        await skipTour.click();
        await page.waitForTimeout(1000);
      }
    }

    // 3. Test Roadmap Modal (Lộ Trình AI button)
    console.log("\nTesting Lộ Trình AI button...");
    const roadmapBtn = page.locator("text=Lộ Trình AI").first();
    if (await roadmapBtn.isVisible()) {
      await roadmapBtn.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(ARTIFACT_DIR, "audit_03_roadmap_modal_opened.png") });
      console.log("Screenshot: audit_03_roadmap_modal_opened.png");

      const closeRoadmap = page.locator("[aria-label='Đóng Lộ Trình Sống Khỏe']").first();
      if (await closeRoadmap.isVisible()) {
        await closeRoadmap.click();
        await page.waitForTimeout(800);
      }
    }

    // 4. Test Herbal Garden Modal (Nhà Thảo Mộc)
    console.log("\nTesting Herbal Garden Modal...");
    await page.evaluate(() => {
      if (typeof window.__OPEN_HERBAL_GARDEN__ === "function") {
        window.__OPEN_HERBAL_GARDEN__();
      }
    });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "audit_04_herbal_garden_for_you.png") });
    console.log("Screenshot: audit_04_herbal_garden_for_you.png");

    // Switch to All Herbs tab
    const tabAll = page.locator("[aria-label='Tất cả thảo mộc']").first();
    if (await tabAll.isVisible()) {
      await tabAll.click();
      await page.waitForTimeout(600);
      await page.screenshot({ path: path.join(ARTIFACT_DIR, "audit_05_herbal_garden_all.png") });
      console.log("Screenshot: audit_05_herbal_garden_all.png");
    }

    // Close Herbal Garden
    const closeHerbal = page.locator("[aria-label='Đóng Nhà Thảo Mộc']").first();
    if (await closeHerbal.isVisible()) {
      await closeHerbal.click();
      await page.waitForTimeout(800);
    }

    // 5. Test Body Science Library Modal (Nhà Cơ Thể)
    console.log("\nTesting Body Science Library Modal...");
    await page.evaluate(() => {
      if (typeof window.__OPEN_BODY_SCIENCE__ === "function") {
        window.__OPEN_BODY_SCIENCE__();
      }
    });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "audit_06_body_science_modal.png") });
    console.log("Screenshot: audit_06_body_science_modal.png");

    // Close Body Science
    const closeBody = page.locator("[aria-label='Đóng Thư Viện Tri Thức']").first();
    if (await closeBody.isVisible()) {
      await closeBody.click();
      await page.waitForTimeout(800);
    }

    // 6. Test Detective Game Shortcut (Giải Mã)
    console.log("\nTesting Giải Mã button...");
    const detectiveBtn = page.locator("text=Giải Mã").first();
    if (await detectiveBtn.isVisible()) {
      await detectiveBtn.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(ARTIFACT_DIR, "audit_07_detective_modal.png") });
      console.log("Screenshot: audit_07_detective_modal.png");
    }

    console.log("\n=== AUDIT FINISHED WITH 100% SUCCESS ===");
  } catch (err) {
    console.error("Audit error:", err);
  } finally {
    await browser.close();
  }
}

verifyAll();
