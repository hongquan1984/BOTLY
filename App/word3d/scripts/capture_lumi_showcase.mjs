import { chromium } from "file:///D:/botly/App/word3d/node_modules/playwright-core/index.mjs";
import path from "path";

const ARTIFACT_DIR = "C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb";

async function run() {
  console.log("=== CAPTURING 3D LUMI COMPANION SHOWCASE ===");
  const browser = await chromium.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-web-security"],
  });

  const context = await browser.newContext({
    viewport: { width: 412, height: 860 },
    deviceScaleFactor: 2,
  });

  const page = await context.newPage();

  page.on("console", (msg) => {
    const text = msg.text();
    if (text.includes("Lumi") || text.includes("VillageLayout") || text.includes("Cozy Fantasy")) {
      console.log(`[Browser] ${text}`);
    }
  });

  try {
    // 1. Standalone Player View
    console.log("Loading http://localhost:5173/?mode=player...");
    await page.goto("http://localhost:5173/?mode=player", { waitUntil: "domcontentloaded", timeout: 20000 });

    // Wait for buildings to be loaded and loading overlay to be removed
    await page.waitForFunction(() => {
      const s = window.__systems;
      return s && s.buildings && s.buildings.length > 0;
    }, { timeout: 15000 });
    console.log("Village fully loaded!");
    await page.waitForTimeout(1000);

    // Shot 1: Normal gameplay perspective with Lumi hovering beside character
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "qa_lumi_01_village_companion.png") });
    console.log("Saved: qa_lumi_01_village_companion.png");

    // Shot 2: Close-up on Character and Lumi
    await page.evaluate(() => {
      const s = window.__systems;
      if (s) {
        const charPos = s.character.getPosition();
        s.cameraCtrl.setCloseView(charPos);
      }
    });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "qa_lumi_02_closeup_face.png") });
    console.log("Saved: qa_lumi_02_closeup_face.png");

    // Shot 3: Command walk to Market / Plaza and capture mid-flight
    console.log("Commanding player to walk...");
    await page.evaluate(() => {
      const s = window.__systems;
      if (s) {
        // Reset overview/follow camera
        s.cameraCtrl.setOverviewView();
      }
    });
    await page.waitForTimeout(800);

    await page.evaluate(() => {
      window.dispatchEvent(new MessageEvent("message", {
        data: JSON.stringify({ type: "WALK_TO_BUILDING", landmarkId: "task_square" })
      }));
    });
    // Wait for character to be mid-stride and Lumi flying along
    await page.waitForTimeout(1600);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "qa_lumi_03_follow_walk.png") });
    console.log("Saved: qa_lumi_03_follow_walk.png");

    // Shot 4: Integrated Mobile App World
    console.log("\nLoading mobile app at http://localhost:8081/(game)/world...");
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
    // Wait for 3D iframe inside mobile page to report ready or wait 6s
    await mobilePage.waitForTimeout(6500);

    // If cinematic tour modal is open, click "Bỏ qua"
    try {
      const skipBtn = await mobilePage.$('text="Bỏ qua"');
      if (skipBtn) {
        await skipBtn.click();
        await mobilePage.waitForTimeout(1000);
      }
    } catch {}

    await mobilePage.screenshot({ path: path.join(ARTIFACT_DIR, "qa_lumi_04_mobile_integrated.png") });
    console.log("Saved: qa_lumi_04_mobile_integrated.png");

    console.log("\n=== SHOWCASE CAPTURE COMPLETE ===");
  } catch (err) {
    console.error("Error during capture:", err);
  } finally {
    await browser.close();
  }
}

run();
