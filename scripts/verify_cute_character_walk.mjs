import path from "path";
import { chromium } from "file:///d:/botly/App/word3d/node_modules/playwright-core/index.mjs";

const ARTIFACTS_DIR = "C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb";

async function main() {
  console.log("=== VERIFYING CUTE 3D CHARACTER AND FORWARD WALKING DIRECTION ===");

  const browser = await chromium.launch({
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true,
    args: ["--no-sandbox", "--disable-web-security"],
  });

  const context = await browser.newContext({
    viewport: { width: 412, height: 869 },
    deviceScaleFactor: 2,
  });

  const page = await context.newPage();

  page.on("console", (msg) => {
    if (msg.type() === "error" || msg.text().includes("[PlayerApp]") || msg.text().includes("character")) {
      console.log(`[Browser Console ${msg.type()}]:`, msg.text());
    }
  });

  // 1. First test preview 5173 directly to see character in close-up
  console.log("Testing 5173 directly...");
  await page.goto("http://localhost:5173", { waitUntil: "networkidle" });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "character_test_01_spawn_5173.png") });

  // Click on the ground to make character walk
  console.log("Clicking on ground to make character walk...");
  // Tap near the center of the screen
  await page.mouse.click(206, 500);
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "character_test_02_walking_forward.png") });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "character_test_03_arrived.png") });

  // 2. Now test through 8081 full app
  console.log("Testing 8081 mobile app in world...");
  await page.goto("http://localhost:8081/quiz", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  
  // Click welcome
  const startBtn = page.locator("[aria-label='welcome-start-btn']");
  if (await startBtn.isVisible()) await startBtn.click();
  else await page.getByText("Bắt Đầu Hành Trình").first().click();
  await page.waitForTimeout(1500);

  // Skip video
  const skipStory = page.getByText("Bỏ qua").first();
  if (await skipStory.isVisible()) await skipStory.click();
  await page.waitForTimeout(1000);

  // Sleep concern
  const sleepChoice = page.locator("[aria-label='quick-focus-sleep']");
  if (await sleepChoice.isVisible()) await sleepChoice.click();
  else await page.getByText("Mất ngủ").first().click();
  await page.waitForTimeout(1000);

  const discNext1 = page.locator("[aria-label='discovery-step1-next']");
  if (await discNext1.isVisible()) await discNext1.click();
  await page.waitForTimeout(1500);

  const discAnalyze = page.locator("[aria-label='discovery-analyze-btn']");
  if (await discAnalyze.isVisible()) await discAnalyze.click();
  await page.waitForTimeout(2000);

  const enterRealm = page.locator("[aria-label='onboarding-enter-world-btn']");
  if (await enterRealm.isVisible()) await enterRealm.click();
  await page.waitForTimeout(1500);

  const enterWorld = page.locator("[aria-label='mascot-enter-healthclues-realm-btn']");
  if (await enterWorld.isVisible()) await enterWorld.click();
  await page.waitForTimeout(4000);

  // Skip tour or advance to step 6
  console.log("Advancing to Step 6 / Ready to explore...");
  for (let i = 0; i < 6; i++) {
    const nextBtn = page.getByText("Tiếp tục").last();
    if (await nextBtn.isVisible()) {
      await nextBtn.click();
      await page.waitForTimeout(800);
    }
  }

  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "character_test_04_mobile_step6.png") });

  const finishBtn = page.getByText("Bắt đầu khám phá").first();
  if (await finishBtn.isVisible()) {
    await finishBtn.click();
    await page.waitForTimeout(1500);
  }

  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "character_test_05_mobile_freeroam.png") });

  // Tap ground to walk in 8081
  console.log("Tapping ground in mobile world...");
  await page.mouse.click(206, 520);
  await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "character_test_06_mobile_walk.png") });

  await browser.close();
  console.log("=== CHARACTER VERIFICATION FINISHED ===");
}

main().catch(console.error);
