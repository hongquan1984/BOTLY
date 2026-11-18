import { chromium } from 'playwright-core';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const targetDir = 'D:\\botly\\App\\word3d';
const screenshotsDir = path.join(targetDir, 'docs', 'screenshots');

if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

async function main() {
  console.log('Starting Vite preview server on port 5199...');
  const server = spawn('npx.cmd', ['vite', 'preview', '--port', '5199'], {
    cwd: targetDir,
    shell: true,
    stdio: 'pipe',
  });

  server.stdout.on('data', (d) => console.log('[Vite Preview]', d.toString().trim()));
  server.stderr.on('data', (d) => console.error('[Vite Err]', d.toString().trim()));

  // Wait for server to start
  await new Promise((r) => setTimeout(r, 2500));

  console.log('Launching Chrome with WebGL support...');
  const browser = await chromium.launch({
    executablePath: chromePath,
    headless: true,
    args: [
      '--use-gl=angle',
      '--use-angle=default',
      '--enable-webgl',
      '--ignore-gpu-blocklist',
      '--no-sandbox',
    ],
  });

  try {
    // -------------------------------------------------------------
    // 1. Desktop Test (1280x800)
    // -------------------------------------------------------------
    console.log('1. Testing Desktop Overview (1280x800)...');
    const desktopPage = await browser.newPage({
      viewport: { width: 1280, height: 800 },
    });

    await desktopPage.goto('http://localhost:5199/', { waitUntil: 'networkidle' });
    await desktopPage.waitForTimeout(4000);

    const shot1 = path.join(screenshotsDir, '01_village_overview_desktop.png');
    await desktopPage.screenshot({ path: shot1 });
    console.log(`Saved screenshot: ${shot1}`);

    // Test Location 1: Lumi's House
    console.log('2. Testing Location 1: Lumi\'s House...');
    const lumisBtn = desktopPage.locator('button.loc-btn:has-text("Lumi\'s House")');
    await lumisBtn.click();
    await desktopPage.waitForSelector('.location-modal', { timeout: 12000 });
    await desktopPage.waitForTimeout(1000);
    const shot2 = path.join(screenshotsDir, '02_lumis_house_modal.png');
    await desktopPage.screenshot({ path: shot2 });
    console.log(`Saved screenshot: ${shot2}`);
    await desktopPage.click('.modal-close-btn');
    await desktopPage.waitForTimeout(1000);

    // Test Location 2: Knowledge Library
    console.log('3. Testing Location 2: Knowledge Library...');
    const libBtn = desktopPage.locator('button.loc-btn:has-text("Library")');
    await libBtn.click();
    await desktopPage.waitForSelector('.location-modal', { timeout: 12000 });
    await desktopPage.waitForTimeout(1000);
    const shot3 = path.join(screenshotsDir, '03_knowledge_library_modal.png');
    await desktopPage.screenshot({ path: shot3 });
    console.log(`Saved screenshot: ${shot3}`);
    await desktopPage.click('.modal-close-btn');
    await desktopPage.waitForTimeout(1000);

    // Test Location 3: Peaceful Lake
    console.log('4. Testing Location 3: Peaceful Lake...');
    const lakeBtn = desktopPage.locator('button.loc-btn:has-text("Peaceful Lake")');
    await lakeBtn.click();
    await desktopPage.waitForSelector('.location-modal', { timeout: 12000 });
    await desktopPage.waitForTimeout(1000);
    const shot4 = path.join(screenshotsDir, '04_peaceful_lake_modal.png');
    await desktopPage.screenshot({ path: shot4 });
    console.log(`Saved screenshot: ${shot4}`);
    await desktopPage.click('.modal-close-btn');
    await desktopPage.waitForTimeout(1000);

    // Test Location 4: Herbal Garden
    console.log('5. Testing Location 4: Herbal Garden...');
    const gardenBtn = desktopPage.locator('button.loc-btn:has-text("Herbal Garden")');
    await gardenBtn.click();
    await desktopPage.waitForSelector('.location-modal', { timeout: 12000 });
    await desktopPage.waitForTimeout(1000);
    const shot5 = path.join(screenshotsDir, '05_herbal_garden_modal.png');
    await desktopPage.screenshot({ path: shot5 });
    console.log(`Saved screenshot: ${shot5}`);
    await desktopPage.click('.modal-close-btn');
    await desktopPage.waitForTimeout(1000);

    // Test Location 5: Village Square
    console.log('6. Testing Location 5: Village Square...');
    const sqBtn = desktopPage.locator('button.loc-btn:has-text("Village Square")');
    await sqBtn.click();
    await desktopPage.waitForSelector('.location-modal', { timeout: 12000 });
    await desktopPage.waitForTimeout(1000);
    const shot6 = path.join(screenshotsDir, '06_village_square_modal.png');
    await desktopPage.screenshot({ path: shot6 });
    console.log(`Saved screenshot: ${shot6}`);
    await desktopPage.click('.modal-close-btn');
    await desktopPage.waitForTimeout(1000);

    // Test Reset View
    console.log('7. Testing Camera Reset View...');
    await desktopPage.click('button.hud-btn:has-text("Reset View")');
    await desktopPage.waitForTimeout(1500);

    await desktopPage.close();

    // -------------------------------------------------------------
    // 8. Mobile Viewport Test (390x844 - iPhone 14)
    // -------------------------------------------------------------
    console.log('8. Testing Mobile Viewport (390x844 iPhone 14)...');
    const mobilePage = await browser.newPage({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });

    await mobilePage.goto('http://localhost:5199/', { waitUntil: 'networkidle' });
    await mobilePage.waitForTimeout(4000);

    const shot7 = path.join(screenshotsDir, '07_village_mobile_390x844.png');
    await mobilePage.screenshot({ path: shot7 });
    console.log(`Saved screenshot: ${shot7}`);

    // Mobile tap interaction on Lumi's House
    const mobileLumi = mobilePage.locator('button.loc-btn:has-text("Lumi\'s House")');
    await mobileLumi.click();
    await mobilePage.waitForSelector('.location-modal', { timeout: 12000 });
    await mobilePage.waitForTimeout(1000);

    const shot8 = path.join(screenshotsDir, '08_mobile_lumis_house_modal.png');
    await mobilePage.screenshot({ path: shot8 });
    console.log(`Saved screenshot: ${shot8}`);

    await mobilePage.close();

    // -------------------------------------------------------------
    // 9. Mobile Viewport Test (375x667 - iPhone SE)
    // -------------------------------------------------------------
    console.log('9. Testing Mobile Viewport (375x667 iPhone SE)...');
    const sePage = await browser.newPage({
      viewport: { width: 375, height: 667 },
      isMobile: true,
      hasTouch: true,
    });

    await sePage.goto('http://localhost:5199/', { waitUntil: 'networkidle' });
    await sePage.waitForTimeout(3000);

    const shot9 = path.join(screenshotsDir, '09_village_mobile_375x667_se.png');
    await sePage.screenshot({ path: shot9 });
    console.log(`Saved screenshot: ${shot9}`);

    await sePage.close();

    console.log('\n=============================================================');
    console.log('  ALL VERIFICATION TESTS AND SCREENSHOT EVIDENCE SUCCEEDED!  ');
    console.log('=============================================================\n');
  } catch (err) {
    console.error('Test error:', err);
  } finally {
    await browser.close();
    server.kill();
  }
}

main();
