import { chromium } from "file:///d:/botly/App/word3d/node_modules/playwright-core/index.mjs";

const ARTIFACTS_DIR = "C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb";

async function verify() {
  console.log("=== VERIFYING CUTE HUMAN CHARACTER & RIVER BRIDGE PATHFINDING ===");

  const browser = await chromium.launch({
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true,
    args: ["--no-sandbox", "--disable-web-security"],
  });

  const page = await browser.newPage();
  await page.setViewportSize({ width: 1024, height: 768 });

  // 1. Open word3d on 5173
  console.log("Loading http://localhost:5173/ ...");
  await page.goto("http://localhost:5173/", { waitUntil: "networkidle", timeout: 20000 });
  await page.waitForTimeout(4000);

  // Take spawn screenshot
  await page.screenshot({ path: `${ARTIFACTS_DIR}/human_01_spawn_village.png` });
  console.log("Saved human_01_spawn_village.png");

  // Inspect character state in 5173 window
  const charInfo = await page.evaluate(() => {
    const char = window.__CHARACTER__;
    if (!char) return { error: "No __CHARACTER__ found" };
    const pos = char.getPosition();
    return {
      position: { x: pos.x, y: pos.y, z: pos.z },
      isMoving: char.isMoving,
    };
  });
  console.log("Initial character info:", JSON.stringify(charInfo));

  // 2. Command character to move from current position across the river to Great Hall / West bank
  // Great Hall entrance is around (-2.8, 4.0)
  console.log("Moving character across river to (-2.8, 4.0)...");
  const moveRes = await page.evaluate(() => {
    if (window.__CHARACTER__) {
      return window.__CHARACTER__.moveTo(-2.8, 4.0);
    }
    return false;
  });
  console.log("moveTo returned:", moveRes);

  // Wait 1.5 seconds while character is walking towards the bridge
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${ARTIFACTS_DIR}/human_02_walking_to_bridge.png` });
  console.log("Saved human_02_walking_to_bridge.png");

  // Wait another 2.5 seconds while character is crossing the bridge
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${ARTIFACTS_DIR}/human_03_crossing_bridge.png` });
  console.log("Saved human_03_crossing_bridge.png");

  // Wait until character arrives
  await page.waitForTimeout(4000);
  await page.screenshot({ path: `${ARTIFACTS_DIR}/human_04_arrived_destination.png` });
  console.log("Saved human_04_arrived_destination.png");

  // 3. Check Mobile Web View on 8081 with authenticated/onboarded state
  console.log("Checking Mobile Web on http://localhost:8081/world ...");
  const mobilePage = await browser.newPage();
  await mobilePage.setViewportSize({ width: 412, height: 869 });

  // Pre-seed localStorage to bypass onboarding redirect and tour
  await mobilePage.goto("http://localhost:8081/", { waitUntil: "domcontentloaded" });
  await mobilePage.evaluate(() => {
    localStorage.setItem("healthclues_onboarding_completed", "true");
    localStorage.setItem("healthclues_primary_health_goal", "sleep");
    localStorage.setItem("healthclues_wellness_level", "1");
    localStorage.setItem("healthclues_tour_step", "journey_track");
    localStorage.setItem("healthclues_cinematic_tour_completed", "true");
  });

  await mobilePage.goto("http://localhost:8081/world", { waitUntil: "networkidle", timeout: 20000 });
  await mobilePage.waitForTimeout(4500);
  await mobilePage.screenshot({ path: `${ARTIFACTS_DIR}/human_05_mobile_freeroam.png` });
  console.log("Saved human_05_mobile_freeroam.png");

  await browser.close();
  console.log("=== ALL VERIFICATION CHECKS COMPLETED ===");
}

verify().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
