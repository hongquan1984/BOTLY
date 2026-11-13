import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';

const require = createRequire('d:/botly/App/3DHOME/package.json');
const { chromium } = require('playwright-core');

const outDir = 'C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb';
fs.mkdirSync(outDir, { recursive: true });

async function run() {
  const browser = await chromium.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-web-security'],
  });

  // 1. Mobile Device Viewport (iPhone 15 Pro: 393 x 852)
  const mobileContext = await browser.newContext({
    viewport: { width: 393, height: 852 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const page = await mobileContext.newPage();

  // Set onboarding complete in storage before page load
  await page.addInitScript(() => {
    localStorage.setItem('healthclues-onboarding-completed', 'true');
    localStorage.setItem('hc_onboarding_done', 'true');
    localStorage.setItem('guest_session', JSON.stringify({ guest: true, nickname: 'Lữ Khách' }));
  });
  
  console.log('Navigating directly to http://127.0.0.1:8081/(game)/world ...');
  await page.goto('http://127.0.0.1:8081/(game)/world', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);

  // If still on landing, click "Bắt Đầu Hành Trình"
  try {
    const startBtn = await page.locator('text=Bắt Đầu Hành Trình').first();
    if (await startBtn.isVisible()) {
      console.log('Clicking start button...');
      await startBtn.click();
      await page.waitForTimeout(3000);
    }
  } catch(e) {}

  // Capture 2.5D with separated parallax mountain
  const shot1 = path.join(outDir, 'world-25d-parallax-mountain.png');
  await page.screenshot({ path: shot1 });
  console.log('Saved 2.5D mode:', shot1);

  // Click on the 2.5D toggle to switch to 2D
  try {
    const toggleBtn = await page.locator('text=2.5D').first();
    if (await toggleBtn.isVisible()) {
      console.log('Found 2.5D toggle, clicking to switch to 2D...');
      await toggleBtn.click();
      await page.waitForTimeout(1500);

      const shot2 = path.join(outDir, 'world-2d-flat-ground.png');
      await page.screenshot({ path: shot2 });
      console.log('Saved 2D mode:', shot2);

      // Toggle back to 2.5D
      const toggle2dBtn = await page.locator('text=2D').first();
      if (await toggle2dBtn.isVisible()) {
        await toggle2dBtn.click();
        await page.waitForTimeout(1000);
      }
    } else {
      console.log('Toggle 2.5D button not found directly');
    }
  } catch (e) {
    console.log('Toggle error:', e.message);
  }

  // Capture Home Haven Gate area by clicking on Cổng Làng An Cư or tapping near it
  try {
    console.log('Finding Cổng Làng An Cư landmark...');
    const homeGateBadge = await page.locator('text=Cổng Làng An Cư').first();
    if (await homeGateBadge.isVisible()) {
      console.log('Clicking Cổng Làng An Cư landmark...');
      await homeGateBadge.click();
      await page.waitForTimeout(2000);
      const shotGate = path.join(outDir, 'world-home-gate-view.png');
      await page.screenshot({ path: shotGate });
      console.log('Saved Home Gate View:', shotGate);
    }
  } catch(e) {
    console.log('Gate click error:', e.message);
  }

  // 2. Capture iphone simulator view
  const simContext = await browser.newContext({
    viewport: { width: 1200, height: 950 },
    deviceScaleFactor: 1.5,
  });
  const simPage = await simContext.newPage();
  await simPage.addInitScript(() => {
    localStorage.setItem('healthclues-onboarding-completed', 'true');
    localStorage.setItem('hc_onboarding_done', 'true');
  });

  console.log('Navigating to http://127.0.0.1:8081/iphone.html ...');
  await simPage.goto('http://127.0.0.1:8081/iphone.html', { waitUntil: 'networkidle', timeout: 30000 });
  await simPage.waitForTimeout(3500);

  const shotSim = path.join(outDir, 'iphone-simulator-25d-horizon.png');
  await simPage.screenshot({ path: shotSim });
  console.log('Saved iPhone simulator:', shotSim);

  await browser.close();
  console.log('All captures done!');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
