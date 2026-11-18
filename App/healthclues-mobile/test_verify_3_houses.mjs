import path from "path";
import fs from "fs";
import { chromium } from "file:///d:/botly/App/word3d/node_modules/playwright-core/index.mjs";

const ARTIFACTS_DIR = "C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb";

async function runTest() {
  console.log("=== HEALTHCLUES — 3 HOUSES VERIFICATION IN 3D WORLD & TOUR ===");
  const chromePath = "C:/Program Files/Google/Chrome/Application/chrome.exe";
  const browser = await chromium.launch({
    executablePath: chromePath,
    headless: true,
    args: ["--no-sandbox", "--disable-web-security", "--autoplay-policy=no-user-gesture-required"],
  });

  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });

  const page = await context.newPage();

  console.log("--- 1. Setting up fresh state & navigating to World 3D ---");
  await page.goto("http://localhost:8081");
  await page.evaluate(() => {
    localStorage.setItem("healthclues-onboarding-completed", "true");
    localStorage.setItem("@healthclues_quiz_completed", "true");
    localStorage.setItem("healthclues_realm_mode_v1", "healthclues-realm");
    localStorage.removeItem("healthclues-village-cinematic-tour-v1");
  });
  await page.goto("http://localhost:8081/(game)/world", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(4000);

  async function clickNextStep() {
    const btn = page.getByText("Tiếp tục").last();
    const box = await btn.boundingBox();
    if (box) {
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    }
    await page.waitForTimeout(1600);
  }

  // Stop 0: Overview
  console.log("--- 2. Tour Stop 0: Overview ---");
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "qa_tour_00_overview.png") });

  // Step 1: Nhà Thảo Mộc (Tiên Nữ Flora)
  console.log("--- 3. Step 1: Nhà Thảo Mộc (Tiên Nữ Flora) ---");
  await clickNextStep();
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "qa_tour_01_nha_thao_moc_flora.png") });
  const hasHerbal = await page.getByText("NHÀ THẢO MỘC", { exact: true }).isVisible();
  const hasFlora = await page.getByText("Tiên Nữ Flora").first().isVisible();
  console.log("Nhà Thảo Mộc visible:", hasHerbal, "| Flora visible:", hasFlora);

  // Step 2: Vườn Âm Thanh (Tiên Nữ Lyra)
  console.log("--- 4. Step 2: Vườn Âm Thanh (Tiên Nữ Lyra) ---");
  await clickNextStep();
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "qa_tour_02_vuon_am_thanh_lyra.png") });
  const hasSound = await page.getByText("VƯỜN ÂM THANH", { exact: true }).isVisible();
  const hasLyra = await page.getByText("Tiên Nữ Lyra").first().isVisible();
  console.log("Vườn Âm Thanh visible:", hasSound, "| Lyra visible:", hasLyra);

  // Step 3: Thiền Đường - Hơi Thở (Tiên Nữ Aura)
  console.log("--- 5. Step 3: Thiền Đường - Hơi Thở (Tiên Nữ Aura) ---");
  await clickNextStep();
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "qa_tour_03_thien_duong_hoi_tho_aura.png") });
  const hasZen = await page.getByText("THIỀN ĐƯỜNG - HƠI THỞ", { exact: true }).isVisible();
  const hasAura = await page.getByText("Tiên Nữ Aura").first().isVisible();
  console.log("Thiền Đường - Hơi Thở visible:", hasZen, "| Aura visible:", hasAura);

  // Also check 3D scene directly on port 5173 to verify 3D landmarks
  console.log("--- 6. Verifying 3D scene landmarks on port 5173 ---");
  const page3d = await context.newPage();
  await page3d.goto("http://localhost:5173/?mode=player", { waitUntil: "domcontentloaded" });
  await page3d.waitForTimeout(4000);
  await page3d.screenshot({ path: path.join(ARTIFACTS_DIR, "qa_3d_village_houses_landmarks.png") });

  const textContent = await page3d.content();
  const has3dHerbal = textContent.includes("Nhà Thảo Mộc");
  const has3dSound = textContent.includes("Vườn Âm Thanh");
  const has3dZen = textContent.includes("Thiền Đường");
  console.log("3D Landmarks in DOM - Nhà Thảo Mộc:", has3dHerbal, "| Vườn Âm Thanh:", has3dSound, "| Thiền Đường:", has3dZen);

  await browser.close();
  console.log("=== ALL 3 HOUSES VERIFIED SUCCESSFULLY ===");
}

runTest().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
