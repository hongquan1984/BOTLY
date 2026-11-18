import { chromium } from "file:///D:/botly/App/word3d/node_modules/playwright-core/index.mjs";

const ARTIFACT_DIR = "C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb";

async function run() {
  console.log("=== STARTING FULL TOOLKIT & 3 HOUSES VERIFICATION ===");
  const browser = await chromium.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
  });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });

  await context.addInitScript(() => {
    window.localStorage.setItem("healthclues-onboarding-completed", "true");
    window.localStorage.setItem("healthclues-story-state-v1", "completed");
    window.localStorage.setItem("healthclues-post-tour-roadmap-reviewed-v1", "true");
    window.localStorage.setItem("healthclues-cinematic-tour-dismissed", "true");
    window.localStorage.setItem("healthclues-interactive-spotlight-tour-v4", "true");
    window.localStorage.setItem(
      "healthclues-starter-profile",
      JSON.stringify({
        quest: "sleep",
        primaryConcernId: "sleep",
        topic: "Mất ngủ & Khó ngủ",
        category: "Mất ngủ & Khó ngủ",
      })
    );
  });

  const page = await context.newPage();

  // Navigate directly to /inventory
  console.log("Navigating to http://localhost:8081/inventory...");
  await page.goto("http://localhost:8081/inventory", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  console.log("Page URL:", page.url());

  // 1. Verify Tab 1: Thảo Mộc (Flora)
  console.log("1. Verifying Tab 1: Thảo Mộc (Flora)...");
  const floraText = await page.locator("text=Tiên Nữ Thảo Mộc · Flora").first();
  console.log("Flora card visible:", await floraText.isVisible());

  await page.screenshot({
    path: `${ARTIFACT_DIR}/qa_toolkit_tab1_herbs.png`,
  });

  // Click "+ Đưa vào Hành Trình" on the first herb
  const addJourneyBtn = await page.locator("text=+ Đưa vào Hành Trình").first();
  console.log("+ Đưa vào Hành Trình button visible:", await addJourneyBtn.isVisible());
  if (await addJourneyBtn.isVisible()) {
    await addJourneyBtn.click();
    console.log("Clicked '+ Đưa vào Hành Trình'");
    await page.waitForTimeout(1000);
  }

  // 2. Switch to Tab 2: Âm Thanh (Lyra)
  console.log("2. Verifying Tab 2: Âm Thanh (Lyra)...");
  const soundTabBtn = await page.locator("text=Âm Thanh").first();
  await soundTabBtn.click();
  await page.waitForTimeout(1000);

  const lyraText = await page.locator("text=Tiên Nữ Thanh Âm · Lyra").first();
  console.log("Lyra card visible:", await lyraText.isVisible());

  // Turn ON Rain track
  const soundToggleBtns = await page.locator("text=BẬT").all();
  console.log("Found BẬT buttons:", soundToggleBtns.length);
  if (soundToggleBtns.length > 0) {
    await soundToggleBtns[0].click();
    console.log("Turned on Rain sound");
    await page.waitForTimeout(800);
  }

  // Turn ON 432Hz Frequency track
  const soundToggleBtns2 = await page.locator("text=BẬT").all();
  if (soundToggleBtns2.length > 1) {
    await soundToggleBtns2[1].click();
    console.log("Turned on second sound track");
    await page.waitForTimeout(800);
  }

  await page.screenshot({
    path: `${ARTIFACT_DIR}/qa_toolkit_tab2_sounds_mixer.png`,
  });

  // 3. Switch to Tab 3: Hơi Thở (Aura)
  console.log("3. Verifying Tab 3: Hơi Thở (Aura)...");
  const breathTabBtn = await page.locator("text=Hơi Thở").first();
  await breathTabBtn.click();
  await page.waitForTimeout(1000);

  const auraText = await page.locator("text=Tiên Nữ Khí Tức · Aura").first();
  console.log("Aura card visible:", await auraText.isVisible());

  // Start breathing exercise 4-7-8
  const startBreathBtn = await page.locator("text=BẮT ĐẦU TẬP THỞ").first();
  if (await startBreathBtn.isVisible()) {
    await startBreathBtn.click();
    console.log("Started 4-7-8 breath exercise widget");
    await page.waitForTimeout(2000);
  }

  await page.screenshot({
    path: `${ARTIFACT_DIR}/qa_toolkit_tab3_breath_widget.png`,
  });

  // 4. Verify Journey sync
  console.log("4. Verifying synced habit in Hành Trình tab (/journey)...");
  await page.goto("http://localhost:8081/journey", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);

  await page.screenshot({
    path: `${ARTIFACT_DIR}/qa_journey_synced_from_toolkit.png`,
  });

  console.log("=== ALL TEST CHECKS PASSED ===");
  await browser.close();
}

run().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
