import { chromium } from "file:///d:/botly/App/word3d/node_modules/playwright-core/index.mjs";

async function test() {
  const browser = await chromium.launch({
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: false, // Let's test with real window or headless
  });
  const context = await browser.newContext({
    viewport: { width: 412, height: 915 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  page.on("console", (msg) => console.log("PAGE LOG:", msg.type(), msg.text()));
  page.on("pageerror", (err) => console.log("PAGE ERROR:", err.message));

  await page.goto("http://localhost:8081");
  await page.evaluate(() => {
    localStorage.setItem("healthclues-onboarding-completed", "true");
    localStorage.setItem("@healthclues_quiz_completed", "true");
    localStorage.setItem("healthclues_realm_mode_v1", "healthclues-realm");
    localStorage.removeItem("healthclues-village-cinematic-tour-v1");
  });
  await page.goto("http://localhost:8081/(game)/world", { waitUntil: "networkidle" });
  await page.waitForTimeout(3000);

  console.log("Navigating to step 6...");
  for (let i = 0; i < 6; i++) {
    const nextBtn = page.getByRole("button", { name: "Tiếp tục" }).first();
    await nextBtn.click();
    await page.waitForTimeout(500);
  }

  console.log("Reached step 6. Now checking finish button...");
  const finishBtn = page.getByRole("button", { name: "Bắt đầu khám phá" }).first();
  console.log("finishBtn exists:", await finishBtn.count());
  console.log("finishBtn isVisible:", await finishBtn.isVisible());
  console.log("finishBtn boundingBox:", JSON.stringify(await finishBtn.boundingBox()));

  // Let's click it!
  console.log("Clicking finishBtn...");
  await finishBtn.click();
  await page.waitForTimeout(2000);

  const isModalStillVisible = await page.getByText("SẴN SÀNG KHÁM PHÁ").first().isVisible();
  console.log("Is modal still visible after click?", isModalStillVisible);

  await browser.close();
}

test().catch(console.error);
