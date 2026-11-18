import { chromium } from 'playwright-core';
import path from 'path';

const outPath = 'C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/village_3d_shots/07_iphone_simulator_3d_village.png';

async function run() {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--enable-webgl', '--ignore-gpu-blocklist', '--use-gl=angle', '--no-sandbox'],
  });

  const page = await browser.newPage({
    viewport: { width: 1440, height: 1050 },
    deviceScaleFactor: 1,
  });

  await page.goto('http://localhost:8081/iphone.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  console.log('Switching to 3D Village Route in iPhone Simulator...');
  await page.click('#route-village');
  await page.waitForTimeout(4000);

  await page.screenshot({ path: outPath });
  console.log('Saved iPhone Simulator 3D Village screenshot to:', outPath);

  await browser.close();
}

run().catch(err => {
  console.error('Run failed:', err);
  process.exit(1);
});
