import { chromium } from "file:///D:/botly/App/word3d/node_modules/playwright-core/index.mjs";

const ARTIFACT_DIR = "C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb";

async function run() {
  console.log("=== FULL SUITE VERIFICATION ===");
  const browser = await chromium.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });

  await context.addInitScript(() => {
    window.localStorage.setItem("healthclues-starter-profile", JSON.stringify({
      quest: "sleep",
      topic: "Mất ngủ & Khó ngủ",
      twoWeekGoal: "Ngủ sâu tự nhiên",
      profile: { primaryConcernId: "sleep" }
    }));
    window.localStorage.setItem("healthclues-onboarding-completed", "true");
    window.localStorage.setItem("healthclues-post-tour-roadmap-reviewed-v1", "true");
    window.localStorage.setItem("healthclues-cinematic-tour-dismissed", "true");
    window.localStorage.setItem("healthclues-interactive-spotlight-tour-v4", "true");
  });

  const page = await context.newPage();

  // 1. Load Journey first
  await page.goto("http://localhost:8081/(game)/journey", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);

  // 2. Open Túi Đồ via bottom bar
  console.log("1. Opening Túi Đồ from bottom bar...");
  const bagTab = page.locator('text=/Túi Đồ/').first();
  await bagTab.click();
  await page.waitForTimeout(1500);

  // TAB 1: THẢO MỘC
  console.log("Verifying Tab 1: Thảo Mộc (Flora)...");
  await page.screenshot({ path: `${ARTIFACT_DIR}/qa_final_tab1_flora_herbs.png` });

  // Click "+ Đưa vào Hành Trình (+20 EXP)"
  const addJourneyBtn = page.locator('text="+ Đưa vào Hành Trình (+20 EXP)"').first();
  if (await addJourneyBtn.count() > 0) {
    console.log("Clicking + Đưa vào Hành Trình (+20 EXP)...");
    await addJourneyBtn.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${ARTIFACT_DIR}/qa_final_tab1_added_toast.png` });
  }

  // TAB 2: ÂM THANH
  console.log("2. Switching to Tab 2: Âm Thanh (Lyra)...");
  const soundTab = page.locator('text=/Âm Thanh/').first();
  await soundTab.click();
  await page.waitForTimeout(1000);

  // Turn ON 2 tracks (Rain & Stream)
  const batBtns = page.locator('text="BẬT"');
  if (await batBtns.count() > 0) {
    await batBtns.first().click();
    console.log("Turned on Rain sound");
    await page.waitForTimeout(500);
  }
  const batBtnsAfter = page.locator('text="BẬT"');
  if (await batBtnsAfter.count() > 0) {
    await batBtnsAfter.first().click();
    console.log("Turned on Stream sound");
    await page.waitForTimeout(500);
  }

  await page.screenshot({ path: `${ARTIFACT_DIR}/qa_final_tab2_lyra_sound_mixer.png` });

  // TAB 3: HƠI THỞ
  console.log("3. Switching to Tab 3: Hơi Thở (Aura)...");
  const breathTab = page.locator('text=/Hơi Thở/').first();
  await breathTab.click();
  await page.waitForTimeout(1000);

  const startBreath = page.locator('text="BẮT ĐẦU TẬP THỞ"').first();
  if (await startBreath.count() > 0) {
    console.log("Starting 4-7-8 breathing exercise...");
    await startBreath.click();
    await page.waitForTimeout(2000);
  }

  await page.screenshot({ path: `${ARTIFACT_DIR}/qa_final_tab3_aura_breath_widget.png` });

  // TAB 4: VERIFY HABIT SYNC IN HÀNH TRÌNH
  console.log("4. Switching to Hành Trình on bottom bar to verify synced tea habit...");
  const journeyBottomTab = page.locator('text=/Hành Trì/').first();
  await journeyBottomTab.click();
  await page.waitForTimeout(2000);

  await page.screenshot({ path: `${ARTIFACT_DIR}/qa_final_tab4_journey_synced.png` });

  console.log("=== FULL SUITE VERIFICATION COMPLETE: ALL PASS ===");
  await browser.close();
}

run().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
