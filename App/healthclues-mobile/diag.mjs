import { chromium } from "file:///D:/botly/App/word3d/node_modules/playwright-core/index.mjs";

async function diag() {
  const browser = await chromium.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: true,
  });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
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
  page.on("console", msg => console.log("LOG:", msg.type(), msg.text()));
  page.on("pageerror", err => console.log("ERROR:", err.message));

  await page.goto("http://localhost:8081/(game)/journey", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);

  // Click Túi Đồ
  const bagTab = page.locator('text=/Túi Đồ/').first();
  console.log("Bag tab count:", await bagTab.count());
  if (await bagTab.count() > 0) {
    await bagTab.click();
    await page.waitForTimeout(2000);
  }

  await page.screenshot({ path: "C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/diag_bag.png" });
  await browser.close();
}

diag();
