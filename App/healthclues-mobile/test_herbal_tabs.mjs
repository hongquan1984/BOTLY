import { chromium } from "file:///D:/botly/App/word3d/node_modules/playwright-core/index.mjs";
import path from "path";

const ARTIFACT_DIR = "C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb";

async function verifyHerbal() {
  const browser = await chromium.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: true,
  });
  const context = await browser.newContext({ viewport: { width: 412, height: 860 } });
  await context.addInitScript(() => {
    window.localStorage.setItem("healthclues-starter-profile", JSON.stringify({
      quest: "glucose",
      topic: "Đường huyết / Tiểu đường",
      twoWeekGoal: "Ổn định đường huyết và giảm cảm giác thèm ngọt",
      profile: { primaryConcernId: "glucose" }
    }));
    window.localStorage.setItem("healthclues-onboarding-completed", "true");
    window.localStorage.setItem("healthclues-post-tour-roadmap-reviewed-v1", "true");
    window.localStorage.setItem("healthclues-cinematic-tour-dismissed", "true");
  });

  const page = await context.newPage();
  await page.goto("http://localhost:8081/(game)/world", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(5000);

  // Click on Herbal Garden or open modal via postMessage
  await page.evaluate(() => {
    window.dispatchEvent(new MessageEvent("message", {
      data: JSON.stringify({
        source: "word3d",
        type: "INTERACT_BUILDING",
        landmarkId: "herbal_garden",
        buildingInstanceId: "bld_potion_shop",
        actionId: "herbal_garden",
      })
    }));
  });

  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "qa_herbal_modal_top_tabs_verified.png") });
  console.log("Saved: qa_herbal_modal_top_tabs_verified.png");

  // Click tab "Tất Cả Thảo Mộc"
  const allTab = await page.$('text="Tất Cả Thảo Mộc"');
  if (allTab) {
    await allTab.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "qa_herbal_modal_tab_all_verified.png") });
    console.log("Saved: qa_herbal_modal_tab_all_verified.png");
  }

  await browser.close();
}

verifyHerbal();
