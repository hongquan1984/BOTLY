import { chromium } from "file:///d:/botly/App/3DHOME/node_modules/playwright-core/index.mjs";
import path from "node:path";
import fs from "node:fs";

const outDir = "C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/photorealistic_25d_audit";
fs.mkdirSync(outDir, { recursive: true });

async function run() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    args: ["--no-sandbox", "--disable-gpu-sandbox"],
  });

  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });

  console.log("Navigating to http://localhost:8081/ to set storage...");
  await page.goto("http://localhost:8081/", { waitUntil: "networkidle" });
  await page.waitForTimeout(500);

  // Set onboarding and tour completed in localStorage
  await page.evaluate(() => {
    localStorage.setItem("healthclues-onboarding-completed", "true");
    localStorage.setItem("healthclues-interactive-spotlight-tour-v4", "true");
    localStorage.setItem("healthclues_ftue_completed_v1", "true");
    localStorage.setItem("healthclues-guide-spotlight-completed-v1", "true");
  });

  console.log("Navigating to http://localhost:8081/(game)/world ...");
  await page.goto("http://localhost:8081/(game)/world", { waitUntil: "networkidle" });
  await page.waitForTimeout(3000);

  // Dismiss any tour if visible
  await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll('div, button, span'));
    const dismiss = all.find(el => {
      const t = (el.innerText || el.textContent || '').trim();
      return t === 'Bỏ qua' || t === 'Đã hiểu' || t.includes('Bỏ qua');
    });
    if (dismiss) dismiss.click();
  });
  await page.waitForTimeout(500);

  // 1. Initial World View
  const shot1 = path.join(outDir, "01_world_photorealistic_scene.png");
  await page.screenshot({ path: shot1 });
  console.log("Captured 01_world_photorealistic_scene.png");

  // Inspect DOM elements
  const info = await page.evaluate(() => {
    const playerActor = document.querySelector('[aria-label="player-avatar-actor"]');
    const playerImg = playerActor ? playerActor.querySelector('img') : null;

    const npcs = Array.from(document.querySelectorAll('[role="button"]'))
      .map(el => {
        const img = el.querySelector('img');
        const text = el.innerText || el.textContent || '';
        return {
          aria: el.getAttribute('aria-label'),
          text: text.slice(0, 40),
          imgSrc: img ? img.src : null,
          w: img ? img.clientWidth : 0,
          h: img ? img.clientHeight : 0,
        };
      })
      .filter(item => (item.aria && item.aria.includes('Nhà')) || (item.text && item.text.includes('Nhà')));

    const imgs = Array.from(document.querySelectorAll('img')).map(i => i.src);

    return {
      currentUrl: window.location.href,
      player: {
        src: playerImg ? playerImg.src : null,
        w: playerImg ? playerImg.clientWidth : 0,
        h: playerImg ? playerImg.clientHeight : 0,
      },
      npcs,
      hasParallaxHorizon: imgs.some(s => s.includes('swiss-village-lake-bg')),
      hasForegroundDiorama: imgs.some(s => s.includes('swiss-village-mobile-diorama')),
    };
  });
  console.log("DOM Inspection:", JSON.stringify(info, null, 2));

  // 2. Click fountain plaza to walk
  console.log("Clicking cobblestone square to trigger 3D walk cycle...");
  await page.mouse.click(195, 420);
  await page.waitForTimeout(200);

  const shot2 = path.join(outDir, "02_walk_step1.png");
  await page.screenshot({ path: shot2 });
  console.log("Captured 02_walk_step1.png");

  await page.waitForTimeout(220);
  const shot3 = path.join(outDir, "03_walk_step2.png");
  await page.screenshot({ path: shot3 });
  console.log("Captured 03_walk_step2.png");

  await page.waitForTimeout(220);
  const shot4 = path.join(outDir, "04_walk_step3.png");
  await page.screenshot({ path: shot4 });
  console.log("Captured 04_walk_step3.png");

  await page.waitForTimeout(1500);
  const shot5 = path.join(outDir, "05_arrived_idle.png");
  await page.screenshot({ path: shot5 });
  console.log("Captured 05_arrived_idle.png");

  // 3. Pan camera across the village plaza to verify 2.5D parallax separation
  console.log("Panning camera across the village plaza...");
  await page.mouse.move(200, 500);
  await page.mouse.down();
  await page.mouse.move(80, 400, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(600);

  const shot6 = path.join(outDir, "06_parallax_panned.png");
  await page.screenshot({ path: shot6 });
  console.log("Captured 06_parallax_panned.png");

  await browser.close();
  console.log("Audit script completed successfully!");
}

run().catch(err => {
  console.error("Audit failed:", err);
  process.exit(1);
});
