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
await page.waitForFunction(() => Boolean(window.__CHALET_API__), null, { timeout: 60000 });
await page.evaluate(() => window.__CHALET_API__.waitPhase2());
await page.waitForTimeout(1000);

// Test Bedroom Inside-Out View
console.log('Testing inside-out bedroom view...');
await page.evaluate(() => {
  const api = window.__CHALET_API__;
  api.switchView('bedroom');
  // Set custom look with az = 154 deg, el = 4.0 deg, dist = 3.55
  // But wait, setHomeLook uses ROOM_PRESETS.bedroom target.
  // Let's directly test camera position and lookAt:
  const cam = api.camera;
  cam.position.set(1.40, 1.62, -5.60);
  cam.lookAt(2.65, 1.45, -8.60);
  cam.fov = 64;
  cam.updateProjectionMatrix();
});
await page.waitForTimeout(800);
await page.screenshot({ path: 'C:/Users/Admin/.gemini/antigravity/brain/819881c5-9f35-406a-a5f6-dec1cc5a607a/bedroom_inside_out_test1.png' });
console.log('Saved bedroom_inside_out_test1.png');

// Test Angle 2: slightly wider angle showing more of the East window and bed
await page.evaluate(() => {
  const api = window.__CHALET_API__;
  const cam = api.camera;
  cam.position.set(1.10, 1.62, -5.30);
  cam.lookAt(2.85, 1.45, -8.20);
  cam.fov = 68;
  cam.updateProjectionMatrix();
});
await page.waitForTimeout(800);
await page.screenshot({ path: 'C:/Users/Admin/.gemini/antigravity/brain/819881c5-9f35-406a-a5f6-dec1cc5a607a/bedroom_inside_out_test2.png' });
console.log('Saved bedroom_inside_out_test2.png');

// Test Angle 3: Standing at (0.85, 1.58, -5.60) looking towards East window and bed
await page.evaluate(() => {
  const api = window.__CHALET_API__;
  const cam = api.camera;
  cam.position.set(0.95, 1.58, -5.80);
  cam.lookAt(3.20, 1.45, -7.90);
  cam.fov = 68;
  cam.updateProjectionMatrix();
});
await page.waitForTimeout(800);
await page.screenshot({ path: 'C:/Users/Admin/.gemini/antigravity/brain/819881c5-9f35-406a-a5f6-dec1cc5a607a/bedroom_inside_out_test3.png' });
console.log('Saved bedroom_inside_out_test3.png');

await browser.close();
