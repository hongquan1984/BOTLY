import { chromium } from 'playwright-core';

async function diagnose() {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--use-gl=angle', '--use-angle=default', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox'],
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  page.on('console', msg => {
    console.log(`[${msg.type().toUpperCase()}] ${msg.text()}`);
  });
  page.on('pageerror', err => {
    console.error(`[PAGE ERROR]`, err);
  });

  console.log('Navigating to http://localhost:5173/ ...');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.waitForSelector('.loading-screen', { state: 'detached', timeout: 30000 });
  await page.waitForTimeout(2000);

  const debugInfo = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return { error: 'No canvas found' };
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    return {
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      glError: gl ? gl.getError() : 'no gl context',
      isContextLost: gl ? gl.isContextLost() : true,
    };
  });

  console.log('Debug Info:', debugInfo);

  const testSS = 'C:/Users/Admin/.gemini/antigravity/brain/b6ff82c9-4cf6-4c71-93a2-4574cb0af50a/43_diagnose_ss.png';
  await page.screenshot({ path: testSS });
  console.log('Saved diagnose screenshot to:', testSS);

  await browser.close();
}

diagnose().catch(console.error);
