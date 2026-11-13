import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';

const require = createRequire('d:/botly/App/3DHOME/package.json');
const { chromium } = require('playwright-core');

const outDir = 'D:/botly/App/3DHOME/reports/shots';
fs.mkdirSync(outDir, { recursive: true });

const url = 'http://127.0.0.1:5173';

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

const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
page.setDefaultTimeout(90000);

const errors = [];
page.on('pageerror', (err) => errors.push(`PAGEERROR: ${err.message}`));
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(`CONSOLE_ERROR: ${msg.text()}`);
});

console.log('Navigating to', url);
await page.goto(url, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => Boolean(window.__CHALET_API__), null, { polling: 150, timeout: 90000 });
console.log('CHALET_API ready!');

// Wait for Phase 2 streaming
await page.evaluate(() => window.__CHALET_API__.waitPhase2());
await page.waitForTimeout(1500);

const stats = await page.evaluate(() => window.__CHALET_API__.getPerfStats());
console.log('Perf stats:', JSON.stringify(stats));

// Hide HUD for clean cinematic screenshots
await page.evaluate(() => window.__CHALET_API__.hideHud());

// Shot 1: Switch to 3/4 cutaway view showing the entire house and yard
await page.evaluate(() => window.__CHALET_API__.switchView('view34'));
await page.waitForTimeout(1000);
const shot34Path = path.join(outDir, 'yard_trees_view34.png');
await page.screenshot({ path: shot34Path });
console.log('Saved 3/4 yard view:', shot34Path);

// Shot 2: Outdoor Garden Front-Left angle (looking right at the spot where the old ugly tree was!)
// In character mode or by moving camera to front yard looking toward lake
await page.evaluate(() => {
  // Switch to character mode and move player near -10, 11
  window.__CHALET_API__.switchView('character');
});
await page.waitForTimeout(1000);
const shotYardPath = path.join(outDir, 'yard_trees_ground_view.png');
await page.screenshot({ path: shotYardPath });
console.log('Saved ground view:', shotYardPath);

console.log('Errors caught:', errors);
await browser.close();
console.log('DONE!');
