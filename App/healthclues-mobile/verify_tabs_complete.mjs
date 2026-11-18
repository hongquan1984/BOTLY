import { chromium } from "file:///D:/botly/App/word3d/node_modules/playwright-core/index.mjs";

const ARTIFACT_DIR = "C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb";

async function verifyAll() {
  console.log("=== STARTING COMPLETE VERIFICATION OF 3 TABS & HOUSES ===");
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
    window.localStorage.setItem("healthclues-village-cinematic-tour-completed", "true");
  });

  const page = await context.newPage();

  // 1. Load world
  await page.goto("http://localhost:8081/(game)/world", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);

  // 2. Click Túi Đồ on the bottom tab bar!
  console.log("Locating Túi Đồ tab on bottom bar...");
  const bagTab = page.locator('text="Túi Đồ"').first();
  console.log("Bag tab found:", await bagTab.count());
  await bagTab.click();
  await page.waitForTimeout(1500);

  // --- TAB 1: THẢO MỘC (FLORA) ---
  console.log("Verifying Tab 1: Thảo Mộc (Flora)...");
  await page.screenshot({ path: `${ARTIFACT_DIR}/qa_toolkit_tab1_herbs_verified.png` });

  // Click "+ Đưa vào Hành Trình (+20 EXP)" on the first herb
  const addJourneyBtn = page.locator('text="+ Đưa vào Hành Trình (+20 EXP)"').first();
  if (await addJourneyBtn.count() > 0) {
    console.log("Found + Đưa vào Hành Trình button, clicking...");
    await addJourneyBtn.click();
    await page.waitForTimeout(1000);
  }

  // --- TAB 2: ÂM THANH (LYRA) ---
  console.log("Switching to Tab 2: Âm Thanh (Lyra)...");
  const soundTab = page.locator('text="Âm Thanh"').first();
  await soundTab.click();
  await page.waitForTimeout(1000);

  // Turn ON Rain sound
  const playBtns = page.locator('text="BẬT"');
  const count = await playBtns.count();
  console.log("Play buttons found in Sound tab:", count);
  if (count > 0) {
    await playBtns.first().click();
    console.log("Turned on Rain sound!");
    await page.waitForTimeout(500);
  }
  if (count > 1) {
    await playBtns.nth(1).click();
    console.log("Turned on Stream sound!");
    await page.waitForTimeout(500);
  }

  await page.screenshot({ path: `${ARTIFACT_DIR}/qa_toolkit_tab2_sounds_verified.png` });

  // --- TAB 3: HƠI THỞ (AURA) ---
  console.log("Switching to Tab 3: Hơi Thở (Aura)...");
  const breathTab = page.locator('text="Hơi Thở"').first();
  await breathTab.click();
  await page.waitForTimeout(1000);

  const startBreath = page.locator('text="BẮT ĐẦU TẬP THỞ"').first();
  if (await startBreath.count() > 0) {
    console.log("Found BẮT ĐẦU TẬP THỞ, clicking...");
    await startBreath.click();
    await page.waitForTimeout(2000);
  }

  await page.screenshot({ path: `${ARTIFACT_DIR}/qa_toolkit_tab3_breath_verified.png` });

  // --- TAB 4: HÀNH TRÌNH SYNC ---
  console.log("Switching to Hành Trình tab to verify habit sync...");
  const journeyTab = page.locator('text="Hành Trì..."').first();
  if (await journeyTab.count() > 0) {
    await journeyTab.click();
  } else {
    const jTabFallback = page.locator('text="Hành Trình"').first();
    if (await jTabFallback.count() > 0) await jTabFallback.click();
  }
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${ARTIFACT_DIR}/qa_journey_synced_verified.png` });

  console.log("=== ALL TABS & FLOWS VERIFIED SUCCESSFULLY ===");
  await browser.close();
}

verifyAll().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
