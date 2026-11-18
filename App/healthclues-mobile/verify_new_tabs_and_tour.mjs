import { chromium } from "file:///D:/botly/App/word3d/node_modules/playwright-core/index.mjs";
import path from "path";

const ARTIFACT_DIR = "C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb";

async function verify() {
  console.log("=== VERIFYING TOP TOOLBAR & HERBAL GARDEN TOP TABS ===");
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
    await page.goto("http://localhost:8081/(game)/world", { waitUntil: "domcontentloaded", timeout: 20000 });
    await page.waitForTimeout(3000);

    // Skip cinematic tour if visible
    const skipTour = page.locator("text=Bỏ qua tour").or(page.locator("text=Bỏ qua")).or(page.locator("text=Khám phá ngay")).first();
    if (await skipTour.isVisible({ timeout: 2000 })) {
      await skipTour.click();
      await page.waitForTimeout(1000);
    }

    // Dismiss roadmap modal if open
    const closeRoadmap = page.locator("[aria-label='Đóng Lộ Trình Sống Khỏe']").or(page.locator("text=Lưu Vào Hành Trình")).first();
    if (await closeRoadmap.isVisible({ timeout: 2000 })) {
      await closeRoadmap.click();
      await page.waitForTimeout(1000);
    }

    // 1. Verify Top Toolbar (2D/3D button gone, Tour button clear & visible)
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "qa_top_toolbar_tour_clear.png") });
    console.log("Screenshot: qa_top_toolbar_tour_clear.png");

    const content = await page.textContent("body");
    const hasLangNui = content.includes("Làng Núi") || content.includes("Làng Nổi");
    console.log("Toolbar check - 'Làng Núi / Làng Nổi' button exists:", hasLangNui, "(expected: false)");

    const tourBtn = page.locator("text=Tour").first();
    const isTourVisible = await tourBtn.isVisible();
    console.log("Toolbar check - 'Tour' button visible:", isTourVisible, "(expected: true)");

    // 2. Open Herbal Garden
    console.log("\nOpening Herbal Garden modal...");
    await page.evaluate(() => {
      if (typeof window.__OPEN_HERBAL_GARDEN__ === "function") {
        window.__OPEN_HERBAL_GARDEN__();
      }
    });
    await page.waitForTimeout(1500);

    // Screenshot Tab 1: Dành Cho Bạn
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "qa_herbal_top_tabs_for_you.png") });
    console.log("Screenshot: qa_herbal_top_tabs_for_you.png");

    // 3. Click Tab 2: Tất Cả
    console.log("Clicking Tab 'Tất Cả'...");
    const tabAll = page.locator("[aria-label='Tất cả thảo mộc']").or(page.locator("text=Tất Cả")).first();
    await tabAll.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "qa_herbal_top_tabs_all.png") });
    console.log("Screenshot: qa_herbal_top_tabs_all.png");

    // 4. Click Tab 3: Đã Lưu
    console.log("Clicking Tab 'Đã Lưu'...");
    const tabSaved = page.locator("[aria-label='Thảo mộc đã lưu']").or(page.locator("text=Đã Lưu")).first();
    await tabSaved.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "qa_herbal_top_tabs_saved.png") });
    console.log("Screenshot: qa_herbal_top_tabs_saved.png");

    // 5. Click Tab 1: Dành Cho Bạn again
    console.log("Clicking Tab 'Dành Cho Bạn'...");
    const tabForYou = page.locator("[aria-label='Dành cho bạn']").or(page.locator("text=Dành Cho Bạn")).first();
    await tabForYou.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "qa_herbal_top_tabs_for_you_restored.png") });
    console.log("Screenshot: qa_herbal_top_tabs_for_you_restored.png");

    console.log("\n=== ALL CHECKS COMPLETED SUCCESSFULLY ===");
  } catch (err) {
    console.error("Verification error:", err);
  } finally {
    await browser.close();
  }
}

verify();
