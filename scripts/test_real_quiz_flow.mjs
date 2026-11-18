import { chromium } from "file:///d:/botly/App/3DHOME/node_modules/playwright-core/index.mjs";
import path from "path";

const ARTIFACT_DIR = "C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb";

async function testRealQuizFlow() {
  console.log("=== TESTING REAL QUIZ COMPLETION FLOW ===");
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
    console.log(`[Browser Console ${msg.type()}]`, msg.text());
  });

  page.on("pageerror", (err) => {
    console.log(`[Browser Page Error]`, err.message);
  });

  // Step 0: Open /quiz and clear existing progress to simulate a fresh user
  await page.goto("http://localhost:8081/quiz", { waitUntil: "networkidle" });
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  // Step 1: Click "Bắt Đầu Hành Trình"
  console.log("1. Clicking 'Bắt Đầu Hành Trình'...");
  const startBtn = await page.$("text=Bắt Đầu Hành Trình");
  if (startBtn) {
    await startBtn.click();
    await page.waitForTimeout(1500);
  }
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "live_flow_01_story.png") });

  // Step 2: Skip story if present
  console.log("2. Skipping story video...");
  const skipBtn = await page.$("text=Bỏ qua câu chuyện");
  if (skipBtn) {
    await skipBtn.click();
    await page.waitForTimeout(1200);
  }
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "live_flow_02_discovery.png") });

  // Step 3: Pick "Mất ngủ"
  console.log("3. Selecting 'Mất ngủ' (quick-focus-sleep)...");
  const sleepChoice = await page.$("[aria-label='quick-focus-sleep']");
  if (sleepChoice) {
    await sleepChoice.click();
    await page.waitForTimeout(600);
  }
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "live_flow_03_sleep_picked.png") });

  // Step 4: Click Next on Discovery
  console.log("4. Clicking 'Tiếp tục' on Discovery...");
  const nextBtn = await page.$("[aria-label='discovery-step1-next']");
  if (nextBtn) {
    await nextBtn.click();
    await page.waitForTimeout(1500);
  }
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "live_flow_04_finale_screen.png") });

  // Step 5: Click "Bước Vào Xứ Sở Sức Khỏe"
  console.log("5. Clicking 'Bước Vào Xứ Sở Sức Khỏe'...");
  const enterWorldBtn = await page.$("[aria-label='mascot-enter-healthclues-realm-btn']");
  if (enterWorldBtn) {
    await enterWorldBtn.click();
    await page.waitForTimeout(4500); // Wait for World 3D to load
  }
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "live_flow_05_world_loaded.png") });

  console.log("Final URL:", page.url());

  // Step 6: Wait 2s and inspect what is on the world screen
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "live_flow_06_world_inspect.png") });

  await browser.close();
  console.log("=== TEST REAL QUIZ FLOW COMPLETE ===");
}

testRealQuizFlow().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
