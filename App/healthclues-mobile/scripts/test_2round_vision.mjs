import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';

const require = createRequire('d:/botly/App/3DHOME/package.json');
const { chromium } = require('playwright-core');

const outDir = 'C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/vision_tests';
fs.mkdirSync(outDir, { recursive: true });

async function runRound2() {
  console.log('=== RUNNING ROUND 2 AUDIT & VISION VERIFICATION ===');
  const browser = await chromium.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-web-security'],
  });

  const mobileContext = await browser.newContext({
    viewport: { width: 393, height: 852 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const page = await mobileContext.newPage();

  await page.addInitScript(() => {
    localStorage.setItem('healthclues-onboarding-completed', 'true');
    localStorage.setItem('hc_onboarding_done', 'true');
    localStorage.setItem('guest_session', JSON.stringify({ guest: true, nickname: 'Lữ Khách' }));
  });

  console.log('[R2] Navigating to http://127.0.0.1:8081/(game)/world ...');
  await page.goto('http://127.0.0.1:8081/(game)/world', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);

  // Shot 1: Central Fountain Plaza in 2.5D Diorama
  const shot1 = path.join(outDir, 'round2-01-25d-town-square-fountain.png');
  await page.screenshot({ path: shot1 });
  console.log('[R2] Saved Fountain Plaza:', shot1);

  // Shot 2: Scroll up to Top Chalet & Pine Treeline to view Mountain Parallax Horizon
  try {
    console.log('[R2] Scrolling up towards mountain horizon...');
    const topLibrary = await page.locator('text=Thư Viện Ánh Trăng').first();
    if (await topLibrary.isVisible()) {
      await topLibrary.click();
      await page.waitForTimeout(2000);
      const shot2 = path.join(outDir, 'round2-02-scroll-top-mountain-horizon.png');
      await page.screenshot({ path: shot2 });
      console.log('[R2] Saved Mountain Horizon:', shot2);
    }
  } catch (e) {
    console.log('Notice:', e.message);
  }

  // Shot 3: Navigate to Home Haven Gate & Open Neighborhood Sheet
  try {
    console.log('[R2] Navigating to Home Haven Gate...');
    const gateBadge = await page.locator('text=Cổng Làng An Cư').first();
    if (await gateBadge.isVisible()) {
      await gateBadge.click();
      await page.waitForTimeout(2000);

      // Open the neighborhood sheet by clicking "Khu Phố →" or the gate action
      const khuPhoBtn = await page.locator('text=Khu Phố →').first();
      if (await khuPhoBtn.isVisible()) {
        console.log('[R2] Opening Neighborhood Map Sheet...');
        await khuPhoBtn.click();
        await page.waitForTimeout(2000);
      }

      const shot3 = path.join(outDir, 'round2-03-home-haven-gate-sheet.png');
      await page.screenshot({ path: shot3 });
      console.log('[R2] Saved Neighborhood Sheet:', shot3);

      // Close the sheet by clicking close or pressing Escape
      await page.keyboard.press('Escape');
      await page.waitForTimeout(1000);
    }
  } catch (e) {
    console.log('Gate notice:', e.message);
  }

  // Shot 4: Toggle 2D vs 2.5D Mode
  try {
    console.log('[R2] Toggling 2D mode...');
    const toggleBtn = await page.locator('text=2.5D').first();
    if (await toggleBtn.isVisible()) {
      await toggleBtn.click();
      await page.waitForTimeout(1500);

      const shot4 = path.join(outDir, 'round2-04-toggle-2d-flat-mode.png');
      await page.screenshot({ path: shot4 });
      console.log('[R2] Saved 2D Flat Mode:', shot4);

      // Toggle back to 2.5D
      const toggle2d = await page.locator('text=2D').first();
      if (await toggle2d.isVisible()) {
        await toggle2d.click();
        await page.waitForTimeout(1000);
      }
    }
  } catch (e) {
    console.log('Toggle notice:', e.message);
  }

  // Shot 5: iPhone 15 Pro Simulator Frame
  const simContext = await browser.newContext({
    viewport: { width: 1200, height: 950 },
    deviceScaleFactor: 1.5,
  });
  const simPage = await simContext.newPage();
  await simPage.addInitScript(() => {
    localStorage.setItem('healthclues-onboarding-completed', 'true');
    localStorage.setItem('hc_onboarding_done', 'true');
  });

  console.log('[R2] Navigating to http://127.0.0.1:8081/iphone.html ...');
  await simPage.goto('http://127.0.0.1:8081/iphone.html', { waitUntil: 'networkidle', timeout: 30000 });
  await simPage.waitForTimeout(3500);

  const shotSim = path.join(outDir, 'round2-05-iphone-simulator-final.png');
  await simPage.screenshot({ path: shotSim });
  console.log('[R2] Saved Final iPhone Simulator:', shotSim);

  await browser.close();
  console.log('=== FINISHED ROUND 2 AUDIT & VISION VERIFICATION ===');
}

runRound2().catch((err) => {
  console.error(err);
  process.exit(1);
});
