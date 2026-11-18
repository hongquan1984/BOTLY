import { chromium } from "file:///D:/botly/App/word3d/node_modules/playwright-core/index.mjs";
import path from "path";

const ARTIFACT_DIR = "C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb";

async function checkClick() {
  const browser = await chromium.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: true,
  });
  const context = await browser.newContext({ viewport: { width: 412, height: 860 }, deviceScaleFactor: 2 });
  await context.addInitScript(() => {
    window.localStorage.setItem("healthclues-starter-profile", JSON.stringify({
      quest: "glucose",
      topic: "Đường huyết / Tiểu đường",
      twoWeekGoal: "Ổn định đường huyết",
      profile: { primaryConcernId: "glucose" }
    }));
    window.localStorage.setItem("healthclues-onboarding-completed", "true");
    window.localStorage.setItem("healthclues-post-tour-roadmap-reviewed-v1", "true");
    window.localStorage.setItem("healthclues-cinematic-tour-dismissed", "true");
    window.localStorage.setItem("healthclues-interactive-spotlight-tour-v4", "true");
  });

  const page = await context.newPage();

  await page.goto("http://localhost:8081/(game)/journey", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);

  // Click "+ Thêm Mới"
  const addBtn = await page.$('[aria-label="Thêm mới"]');
  if (addBtn) await addBtn.click();
  await page.waitForTimeout(1000);

  // Fill in: "Không uống rượu bia"
  const input = await page.$('input[placeholder*="Không uống rượu bia"]');
  if (input) await input.fill("Không uống rượu bia");
  await page.waitForTimeout(300);

  // Select "Lối Sống"
  const lifestyleCat = await page.$('text="Lối Sống"');
  if (lifestyleCat) await lifestyleCat.click();
  await page.waitForTimeout(300);

  // Click submit button by aria-label
  const submitBtn = page.locator('[aria-label="save-custom-habit-btn"]');
  console.log("Submit btn count:", await submitBtn.count());
  if (await submitBtn.count() > 0) {
    await submitBtn.click();
    console.log("Clicked submit button!");
    await page.waitForTimeout(2500);
  }

  // Screenshot of active list with the newly added habit
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "qa_custom_habit_saved_in_journey.png") });
  console.log("Saved: qa_custom_habit_saved_in_journey.png");

  await browser.close();
}

checkClick();
