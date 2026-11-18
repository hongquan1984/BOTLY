import { createRequire } from "node:module";

const require = createRequire("D:/botly/App/3DHOME/package.json");
const { chromium } = require("playwright-core");

const baseUrl = "http://127.0.0.1:8081";
const shotPath = "D:/botly/App/healthclues-mobile/qa-mascot-onboarding.png";
const quizShotPath = "D:/botly/App/healthclues-mobile/qa-mascot-quiz.png";
const finaleShotPath = "D:/botly/App/healthclues-mobile/qa-mascot-finale.png";

async function run() {
  const browser = await chromium.launch({
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true,
    args: ["--no-sandbox"],
  });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  const runtimeErrors = [];
  page.on("pageerror", (error) => runtimeErrors.push(error.message));
  await page.addInitScript(() => localStorage.clear());

  await page.goto(baseUrl, { waitUntil: "networkidle", timeout: 30000 });
  await page.getByLabel("welcome-start-btn").click();
  await page.getByLabel("quest-choice-continue-btn").click();
  await page.getByLabel("mascot-welcome-continue-btn").waitFor({ state: "visible" });
  await page.waitForFunction(() => {
    const img = document.querySelector('[aria-label="Chạm linh vật HealthClues"] img');
    return Boolean(img?.complete && img.naturalWidth > 0);
  }, { timeout: 12000 });
  await page.screenshot({ path: shotPath });

  await page.getByLabel("Chạm linh vật HealthClues").click();
  await page.waitForTimeout(500);
  const mascotReactionVisible = await page.getByText(/Hí hí! Cù quá/).isVisible();
  const giggleAudioLoaded = await page.waitForFunction(
    () => performance.getEntriesByType("resource").some((entry) => entry.name.includes("mascot-giggle")),
    { timeout: 5000 }
  ).then(() => true).catch(() => false);
  await page.waitForTimeout(1100);
  await page.getByLabel("mascot-welcome-continue-btn").click();
  await page.waitForFunction(() => {
    const img = document.querySelector('[aria-label="Chạm linh vật trong phần khám phá"] img');
    return Boolean(img?.complete && img.naturalWidth > 0);
  }, { timeout: 12000 });
  const discoveryControls = await Promise.all([
    "quick-focus-weight",
    "quick-focus-general",
    "quick-focus-stress",
    "quick-focus-sleep",
    "onboarding-custom-concern-input",
    "discovery-step1-next",
  ].map(async (label) => {
    const box = await page.getByLabel(label).boundingBox();
    return Boolean(box && box.y >= 0 && box.y + box.height <= 844);
  }));
  const discoveryFitsOneScreen = discoveryControls.every(Boolean);
  await page.screenshot({ path: quizShotPath });
  await page.getByLabel("quick-focus-stress").click();
  await page.getByLabel("discovery-step1-next").click();
  await page.getByLabel("mascot-enter-healthclues-realm-btn").waitFor({ state: "visible" });
  await page.waitForFunction(() => {
    const img = document.querySelector('[aria-label="Linh vật HealthClues đang vẫy chào"] img');
    return Boolean(img?.complete && img.naturalWidth > 0);
  }, { timeout: 12000 });
  await page.screenshot({ path: finaleShotPath });

  console.log(JSON.stringify({
    result: mascotReactionVisible && giggleAudioLoaded && discoveryFitsOneScreen && runtimeErrors.length === 0 ? "PASS" : "FAIL",
    mascotReactionVisible,
    giggleAudioLoaded,
    discoveryFitsOneScreen,
    finaleVisible: true,
    runtimeErrors,
    screenshots: [shotPath, quizShotPath, finaleShotPath],
  }));
  await browser.close();
  if (!mascotReactionVisible || !giggleAudioLoaded || !discoveryFitsOneScreen || runtimeErrors.length) process.exitCode = 1;
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
