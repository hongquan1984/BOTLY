import { chromium } from "file:///D:/botly/App/word3d/node_modules/playwright-core/index.mjs";
import path from "path";

const ARTIFACT_DIR = "C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb";

async function verifyLumi() {
  console.log("=== VERIFYING 3D FULL-COLOR LUMI COMPANION FLYING WITH PLAYER ===");
  const browser = await chromium.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-web-security",
    ],
  });

  const context = await browser.newContext({
    viewport: { width: 412, height: 860 },
    deviceScaleFactor: 2,
  });

  const page = await context.newPage();

  page.on("console", (msg) => {
    const text = msg.text();
    if (text.includes("Lumi") || text.includes("Character") || text.includes("NavMesh")) {
      console.log(`[Browser Console] ${text}`);
    }
  });

  try {
    // 1. Load Standalone 3D Village Player View
    console.log("Loading 3D Player mode at http://localhost:5173/?mode=player...");
    await page.goto("http://localhost:5173/?mode=player", { waitUntil: "domcontentloaded", timeout: 20000 });

    // Wait until village assets load and loading spinner is gone
    await page.waitForTimeout(5000);

    // Initial shot: Lumi hovering near player at Central Crossroads
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "lumi_01_hovering_initial.png") });
    console.log("Screenshot: lumi_01_hovering_initial.png");

    // Close view camera to see Lumi's details clearly
    await page.evaluate(() => {
      window.dispatchEvent(new MessageEvent("message", {
        data: JSON.stringify({ type: "SET_CAMERA_VIEW", view: "close" })
      }));
    });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "lumi_02_close_plush_details.png") });
    console.log("Screenshot: lumi_02_close_plush_details.png");

    // Command player to walk towards Herbal Shop / Potion Shop
    console.log("Commanding player to walk across bridge/path...");
    await page.evaluate(() => {
      window.dispatchEvent(new MessageEvent("message", {
        data: JSON.stringify({ type: "WALK_TO_BUILDING", landmarkId: "herbal_house" })
      }));
    });
    await page.waitForTimeout(1800);

    // Mid-motion shot: Lumi flying and orbiting alongside the walking character
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "lumi_03_flying_following_player.png") });
    console.log("Screenshot: lumi_03_flying_following_player.png");

    await page.waitForTimeout(3500);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "lumi_04_arrived_hovering.png") });
    console.log("Screenshot: lumi_04_arrived_hovering.png");

    // 2. Also verify inside Mobile Game View (8081)
    console.log("\nVerifying integrated mobile world at http://localhost:8081/(game)/world...");
    await context.addInitScript(() => {
      window.localStorage.setItem("healthclues-starter-profile", JSON.stringify({
        quest: "glucose",
        topic: "Đường huyết / Tiểu đường",
        twoWeekGoal: "Ổn định đường huyết và giảm cảm giác thèm ngọt",
        profile: { primaryConcernId: "glucose" }
      }));
      window.localStorage.setItem("healthclues-onboarding-completed", "true");
      window.localStorage.setItem("healthclues-post-tour-roadmap-reviewed-v1", "true");
      window.localStorage.setItem("healthclues-cinematic-tour-dismissed", "true");
    });

    const mobilePage = await context.newPage();
    await mobilePage.goto("http://localhost:8081/(game)/world", { waitUntil: "domcontentloaded", timeout: 20000 });
    await mobilePage.waitForTimeout(5000);

    await mobilePage.screenshot({ path: path.join(ARTIFACT_DIR, "lumi_05_integrated_mobile_world.png") });
    console.log("Screenshot: lumi_05_integrated_mobile_world.png");

    console.log("\n=== 3D LUMI VERIFICATION COMPLETED SUCCESSFULLY ===");
  } catch (err) {
    console.error("Verification error:", err);
  } finally {
    await browser.close();
  }
}

verifyLumi();
