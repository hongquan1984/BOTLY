import { chromium } from "file:///d:/botly/App/3DHOME/node_modules/playwright-core/index.mjs";
import path from "path";

const ARTIFACT_DIR = "C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb";

async function auditFlow() {
  console.log("=== STARTING FULL LIVE QUIZ TO WORLD AUDIT ===");
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    args: ["--no-sandbox", "--disable-gpu-sandbox"],
  });
  const context = await browser.newContext({
    viewport: { width: 440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      console.log(`[Browser Console Error]`, msg.text());
    }
  });

  page.on("pageerror", (err) => {
    console.log(`[Browser Page Error]`, err.message);
  });

  // Step 0: Open /quiz
  console.log("0. Opening http://localhost:8081/quiz...");
  await page.goto("http://localhost:8081/quiz", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "quiz_flow_00_welcome.png") });

  // Step 1: Tap "Bắt Đầu Hành Trình"
  console.log("1. Tapping 'Bắt Đầu Hành Trình'...");
  const startBtn = await page.$("text=Bắt Đầu Hành Trình");
  if (startBtn) {
    await startBtn.click();
    await page.waitForTimeout(1500);
  }
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "quiz_flow_01_story.png") });

  // Step 2: Skip story if present
  console.log("2. Checking story player / skip...");
  const skipStoryBtn = await page.$("text=Bỏ qua câu chuyện");
  if (skipStoryBtn) {
    await skipStoryBtn.click();
    await page.waitForTimeout(1200);
  }
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "quiz_flow_02_discovery_step1.png") });

  // Step 3: Select Sleep concern
  console.log("3. Selecting 'Giấc ngủ & Phục hồi'...");
  const sleepConcern = await page.$("text=Giấc ngủ");
  if (sleepConcern) {
    await sleepConcern.click();
    await page.waitForTimeout(600);
  }
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "quiz_flow_03_concern_picked.png") });

  // Tap Next in Discovery Screen 1
  console.log("4. Moving to Discovery Screen 2...");
  const nextDiscBtn = await page.$("[aria-label='discovery-step1-next']");
  if (nextDiscBtn) {
    await nextDiscBtn.click();
    await page.waitForTimeout(800);
  } else {
    // Try text button
    const tiếpBtn = await page.$("text=Tiếp theo");
    if (tiếpBtn) await tiếpBtn.click();
    await page.waitForTimeout(800);
  }
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "quiz_flow_04_discovery_step2.png") });

  // Step 4: Pick a factor in Screen 2
  console.log("5. Picking a factor in Screen 2...");
  const factorBtns = await page.$$("text=Khó vào giấc");
  if (factorBtns.length > 0) {
    await factorBtns[0].click();
    await page.waitForTimeout(400);
  }

  // Tap "Tạo Kế Hoạch Sống Khỏe"
  console.log("6. Tapping 'Tạo Kế Hoạch Sống Khỏe'...");
  const createPlanBtn = await page.$("text=Tạo Kế Hoạch Sống Khỏe");
  if (createPlanBtn) {
    await createPlanBtn.click();
    await page.waitForTimeout(3000); // Wait for AI plan generation
  }
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "quiz_flow_05_plan_screen.png") });

  // Step 5: On Plan screen, scroll and tap continue
  console.log("7. Checking Plan screen and continuing...");
  const continuePlanBtn = await page.$("text=Tiếp tục hành trình");
  if (continuePlanBtn) {
    await continuePlanBtn.click();
    await page.waitForTimeout(1200);
  }
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "quiz_flow_06_mascot_ready.png") });

  // Step 6: On mascot_ready screen, tap "Bước Vào Xứ Sở Sức Khỏe"
  console.log("8. Tapping 'Bước Vào Xứ Sở Sức Khỏe'...");
  const enterWorldBtn = await page.$("text=Bước Vào Xứ Sở Sức Khỏe");
  if (enterWorldBtn) {
    await enterWorldBtn.click();
    await page.waitForTimeout(4000); // Wait for world to load
  }
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "quiz_flow_07_world_entered.png") });

  console.log("Current URL after enter world:", page.url());

  // Step 7: Inspect what is currently visible on the World screen!
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "quiz_flow_08_world_inspected.png") });

  await browser.close();
  console.log("=== FULL LIVE QUIZ TO WORLD AUDIT FINISHED ===");
}

auditFlow().catch((err) => {
  console.error("Audit failed:", err);
  process.exit(1);
});
