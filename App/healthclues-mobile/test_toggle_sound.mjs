import path from "path";
import { chromium } from "file:///d:/botly/App/word3d/node_modules/playwright-core/index.mjs";

const ARTIFACTS_DIR = "C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb";

async function run() {
  const chromePath = "C:/Program Files/Google/Chrome/Application/chrome.exe";
  const browser = await chromium.launch({
    executablePath: chromePath,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--autoplay-policy=no-user-gesture-required"]
  });

  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2
  });

  const page = await context.newPage();
  page.on("console", msg => console.log("[BROWSER]", msg.text()));

  await page.goto("http://localhost:8081");
  await page.evaluate(() => {
    localStorage.setItem("healthclues-onboarding-completed", "true");
    localStorage.setItem("@healthclues_quiz_completed", "true");
    localStorage.setItem("healthclues_realm_mode_v1", "healthclues-realm");
    localStorage.setItem("healthclues-village-cinematic-tour-v1", "true");
    localStorage.setItem("healthclues-post-tour-roadmap-reviewed-v1", "true");
    localStorage.setItem("healthclues-interactive-spotlight-tour-v4", "true");
    localStorage.setItem("healthclues-active-tour-step", "-1");
    localStorage.setItem("healthclues_mascot_dismissed_v1", "true");
    localStorage.setItem("hc_mobile_toolkit_sounds", JSON.stringify(["binaural_432"]));
  });

  await page.goto("http://localhost:8081/(game)/inventory?tab=sounds", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);

  // Click BẬT button directly by locator
  console.log("Looking for BẬT button...");
  const btn = page.locator("div").filter({ hasText: /^BẬT$/ }).first();
  console.log("Is visible:", await btn.isVisible());
  await btn.click({ force: true });
  await page.waitForTimeout(1500);

  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "qa_fixed_inventory_playback_with_master_bar.png") });
  console.log("Captured: qa_fixed_inventory_playback_with_master_bar.png");

  await browser.close();
}

run().catch(console.error);
