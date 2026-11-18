import { chromium } from "file:///d:/botly/App/word3d/node_modules/playwright-core/index.mjs";

const ARTIFACTS_DIR = "C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb";

async function verify() {
  console.log("=== VERIFYING CHARACTER WALKING ACROSS THE BRIDGE ===");

  const browser = await chromium.launch({
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true,
    args: ["--no-sandbox", "--disable-web-security"],
  });

  const page = await browser.newPage();
  await page.setViewportSize({ width: 1024, height: 768 });

  await page.goto("http://localhost:5173/", { waitUntil: "networkidle", timeout: 20000 });
  await page.waitForTimeout(4000);

  // Set camera to close view on character so we can clearly see her cute appearance and walking
  await page.evaluate(() => {
    const systems = window.__SYSTEMS__;
    if (systems && systems.cameraCtrl && systems.character) {
      systems.cameraCtrl.setCloseView(systems.character.getPosition());
    }
  });

  await page.screenshot({ path: `${ARTIFACTS_DIR}/bridge_01_view_bridge_spawn.png` });
  console.log("Saved bridge_01_view_bridge_spawn.png");

  // Move across river to Great Hall: from current pos to (-2.8, 4.2)
  console.log("Triggering moveTo(-2.8, 4.2)...");
  const success = await page.evaluate(() => {
    return window.__CHARACTER__.moveTo(-2.8, 4.2);
  });
  console.log("moveTo success:", success);

  // Track position every 700ms
  for (let i = 2; i <= 6; i++) {
    await page.waitForTimeout(700);
    const pos = await page.evaluate(() => {
      const p = window.__CHARACTER__.getPosition();
      return { x: p.x.toFixed(2), z: p.z.toFixed(2), isMoving: window.__CHARACTER__.isMoving };
    });
    console.log(`Step ${i} pos: [${pos.x}, ${pos.z}], moving: ${pos.isMoving}`);
    await page.screenshot({ path: `${ARTIFACTS_DIR}/bridge_0${i}_crossing.png` });
  }

  // Also verify Mobile Web view (8081)
  console.log("Verifying Mobile Web (8081)...");
  const mPage = await browser.newPage();
  await mPage.setViewportSize({ width: 412, height: 869 });
  await mPage.goto("http://localhost:8081/", { waitUntil: "domcontentloaded" });
  await mPage.evaluate(() => {
    localStorage.setItem("healthclues_onboarding_completed", "true");
    localStorage.setItem("healthclues_primary_health_goal", "sleep");
    localStorage.setItem("healthclues_wellness_level", "1");
    localStorage.setItem("healthclues_tour_step", "journey_track");
    localStorage.setItem("healthclues_cinematic_tour_completed", "true");
  });
  await mPage.goto("http://localhost:8081/world", { waitUntil: "networkidle", timeout: 20000 });
  await mPage.waitForTimeout(4500);
  await mPage.screenshot({ path: `${ARTIFACTS_DIR}/bridge_07_mobile_freeroam.png` });
  console.log("Saved bridge_07_mobile_freeroam.png");

  await browser.close();
  console.log("=== VERIFICATION COMPLETE ===");
}

verify().catch((e) => {
  console.error("Error:", e);
  process.exit(1);
});
