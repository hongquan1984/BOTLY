import { chromium } from "file:///d:/botly/App/word3d/node_modules/playwright-core/index.mjs";

const ARTIFACTS_DIR = "C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb";

async function main() {
  const browser = await chromium.launch({
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true,
    args: ["--no-sandbox", "--disable-web-security"],
  });

  const page = await browser.newPage();
  await page.setViewportSize({ width: 412, height: 869 });

  // 1. Visit root and seed storage
  await page.goto("http://localhost:8081/", { waitUntil: "domcontentloaded" });
  await page.evaluate(() => {
    localStorage.setItem("healthclues-onboarding-completed", "true");
    localStorage.setItem("healthclues-starter-profile", JSON.stringify({
      quest: "sleep",
      profile: { nickname: "Nhà Thám Hiểm", experienceLevel: "beginner" },
      completedAt: new Date().toISOString(),
      expAwarded: 50
    }));
    localStorage.setItem("healthclues-user-goals", JSON.stringify(["sleep_routine"]));
    localStorage.setItem("healthclues-total-exp", "50");
    localStorage.setItem("healthclues-cinematic-tour-completed", "true");
    localStorage.setItem("healthclues-tour-step", "journey_track");
  });

  // 2. Navigate directly to /world
  console.log("Navigating to /world...");
  await page.goto("http://localhost:8081/world", { waitUntil: "networkidle", timeout: 20000 });
  await page.waitForTimeout(5000);

  await page.screenshot({ path: `${ARTIFACTS_DIR}/mobile_world_clean_freeroam.png` });
  console.log("Saved mobile_world_clean_freeroam.png");

  await browser.close();
}

main();
