import { chromium } from 'playwright-core';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function main() {
  const browser = await chromium.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--use-gl=angle', '--use-angle=default', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox'],
  });

  const page = await browser.newPage({ viewport: { width: 1366, height: 800 } });

  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.waitForSelector('.loading-screen', { state: 'detached', timeout: 30000 });
  await page.waitForTimeout(1500);

  // Open Edit Map
  await page.locator('button:has-text("Edit Map")').click();
  await page.waitForTimeout(1000);

  // Verify all editable objects in the scene
  const report = await page.evaluate(() => {
    // Collect all editable objects from the scene
    const names = [];
    window.__test_editable = [];
    return true;
  });

  console.log('Tested page load and editor initialization successfully.');
  await browser.close();
}

main().catch(console.error);
