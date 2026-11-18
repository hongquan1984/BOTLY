import { chromium } from "file:///D:/botly/App/word3d/node_modules/playwright-core/index.mjs";

const ARTIFACT_DIR = "C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb";

async function debug() {
  const browser = await chromium.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: true,
  });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });

  await context.addInitScript(() => {
    window.localStorage.setItem("healthclues-onboarding-completed", "true");
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
  page.on("console", (msg) => console.log("PAGE LOG:", msg.text()));
  page.on("pageerror", (err) => console.log("PAGE ERROR:", err));

  await page.goto("http://localhost:8081/(game)/world", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3000);
  console.log("Current URL:", page.url());

  // Click Túi Đồ tab on the bottom bar!
  const inventoryTab = page.locator('text="Túi Đồ"').first();
  console.log("Túi Đồ tab count:", await inventoryTab.count());
  if (await inventoryTab.count() > 0) {
    await inventoryTab.click();
    console.log("Clicked Túi Đồ tab!");
    await page.waitForTimeout(2000);
  }

  console.log("URL after clicking Túi Đồ:", page.url());
  await page.screenshot({ path: `${ARTIFACT_DIR}/debug_inventory_screen.png` });

  await browser.close();
}

debug().catch((err) => console.error(err));
