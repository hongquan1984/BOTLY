import { chromium } from "file:///D:/botly/App/word3d/node_modules/playwright-core/index.mjs";
import path from "path";

const ARTIFACT_DIR = "C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb";

async function run() {
  console.log("=== VERIFYING REMOVAL OF LỘ TRÌNH AI BUTTON & SIMPLIFIED FREE-TEXT HABIT FORM ===");
  const browser = await chromium.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 412, height: 860 },
    deviceScaleFactor: 2,
  });

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

  // 1. Verify World Screen HUD - No "Lộ Trình AI" button
  console.log("Navigating to http://localhost:8081/(game)/world...");
  await page.goto("http://localhost:8081/(game)/world", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(4000);

  // Dismiss tour if present
  try {
    const skipBtn = await page.$('text="Bỏ qua"');
    if (skipBtn) {
      await skipBtn.click();
      await page.waitForTimeout(800);
    }
  } catch {}

  await page.screenshot({ path: path.join(ARTIFACT_DIR, "qa_top_hud_no_roadmap_button.png") });
  console.log("Saved: qa_top_hud_no_roadmap_button.png");

  // Check that "Lộ Trình AI" text is NOT present in toolbar
  const hasRoadmapBtn = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("*")).some(el => el.textContent === "Lộ Trình AI");
  });
  console.log("Has 'Lộ Trình AI' button in DOM:", hasRoadmapBtn);

  // 2. Navigate to Journey Screen (Tab Hành Trình)
  console.log("\nNavigating to http://localhost:8081/(game)/journey...");
  await page.goto("http://localhost:8081/(game)/journey", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);

  // Dismiss any tour modal if present
  try {
    const skipBtn = await page.$('text="Bỏ qua"');
    if (skipBtn) {
      await skipBtn.click();
      await page.waitForTimeout(800);
    }
  } catch {}

  // Open "Thêm Mới" Modal
  const addHabitBtn = await page.$('[aria-label="Thêm mới"]');
  if (addHabitBtn) {
    console.log("Clicking '[aria-label=\"Thêm mới\"]' button...");
    await addHabitBtn.click();
    await page.waitForTimeout(1000);
  } else {
    console.log("Button '[aria-label=\"Thêm mới\"]' not found, trying text...");
    const btnByText = await page.$('text="Thêm Mới"');
    if (btnByText) {
      await btnByText.click();
      await page.waitForTimeout(1000);
    }
  }

  // Take screenshot of simplified modal with free-text input
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "qa_custom_habit_form_free_text.png") });
  console.log("Saved: qa_custom_habit_form_free_text.png");

  // Type: "Không uống rượu bia"
  const input = await page.$('input[placeholder*="Không uống rượu bia"]');
  if (input) {
    console.log("Filling 'Không uống rượu bia'...");
    await input.fill("Không uống rượu bia");
    await page.waitForTimeout(400);
  }

  // Click category: "Lối Sống"
  const lifestyleCat = await page.$('text="Lối Sống"');
  if (lifestyleCat) {
    console.log("Selecting category 'Lối Sống'...");
    await lifestyleCat.click();
    await page.waitForTimeout(400);
  }

  // Click Submit: button that has text "LƯU THÓI QUEN VÀO HÀNH TRÌNH"
  const submitBtn = await page.$(':has-text("LƯU THÓI QUEN VÀO HÀNH TRÌNH")');
  if (submitBtn) {
    console.log("Clicking submit button...");
    await submitBtn.click();
    await page.waitForTimeout(2000);
  }

  // Screenshot after saving habit into Journey
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "qa_custom_habit_in_journey_list.png") });
  console.log("Saved: qa_custom_habit_in_journey_list.png");

  console.log("\n=== VERIFICATION COMPLETE ===");
  await browser.close();
}

run();
