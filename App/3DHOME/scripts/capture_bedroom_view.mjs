import { createRequire } from 'module';
import path from 'path';

const require = createRequire('d:/botly/App/3DHOME/package.json');
const { chromium } = require('playwright-core');

const browser = await chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
  args: [
    '--enable-webgl',
    '--ignore-gpu-blocklist',
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--no-sandbox',
    '--disk-cache-dir=D:/botly/.tmp_3dhome/cache',
  ],
});

const page = await browser.newPage({ viewport: { width: 480, height: 854 } });
page.on('console', (msg) => console.log('PAGE_LOG:', msg.text()));
page.on('pageerror', (err) => console.log('PAGE_ERROR:', err.message));

console.log('Navigating to http://localhost:5173/ ...');
await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
console.log('DOM loaded, waiting for __CHALET_API__ ...');
await page.waitForFunction(() => Boolean(window.__CHALET_API__), null, { timeout: 60000 });
console.log('Waiting for Phase 2 ...');
await page.evaluate(() => window.__CHALET_API__.waitPhase2());
await page.waitForTimeout(1000);

// Set bedroom view facing East window across gothic bed (az = 88 deg, el = 3 deg)
console.log('Setting bedroom view ...');
await page.evaluate(() => {
  window.__CHALET_API__.switchView('bedroom');
  window.__CHALET_API__.setHomeLook(88, 3.0, 3.2, 'bedroom');
});
await page.waitForTimeout(800);
await page.screenshot({ path: 'C:/Users/Admin/.gemini/antigravity/brain/819881c5-9f35-406a-a5f6-dec1cc5a607a/bedroom_current_view.png' });
console.log('Screenshot saved to bedroom_current_view.png');

await browser.close();
