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

const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
const page = await context.newPage();
page.setDefaultTimeout(90000);

await page.goto(url, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => Boolean(window.__CHALET_API__ && window.__CHALET_API__.camera), null, { timeout: 90000 });
await page.evaluate(() => window.__CHALET_API__.waitPhase2());
await page.waitForTimeout(1000);
await page.evaluate(() => window.__CHALET_API__.hideHud());

// Shot 1: 3/4 cutaway view of entire villa & yard with lush vibrant green lawn (no 3D grass, no dry stick trees)
await page.evaluate(() => {
  window.__CHALET_API__.resetCustomCamera();
  window.__CHALET_API__.switchView('view34');
});
await page.waitForTimeout(1200);
const p1 = path.join(outDir, 'lush_green_yard_view34.png');
await page.screenshot({ path: p1 });
console.log('Saved:', p1);

// Shot 2: Hero tree and the vibrant green lawn looking toward the lake
await page.evaluate(() => {
  window.__CHALET_API__.setCustomCamera(-8.5, 2.0, 3.2, -12.4, 3.0, 12.1, 40);
});
await page.waitForTimeout(1000);
const p2 = path.join(outDir, 'lush_green_lawn_hero_tree.png');
await page.screenshot({ path: p2 });
console.log('Saved:', p2);

// Shot 3: Looking from living room terrace out to the garden & lake
await page.evaluate(() => {
  window.__CHALET_API__.setCustomCamera(0.0, 3.5, 2.0, -8.0, 2.5, 14.0, 55);
});
await page.waitForTimeout(1000);
const p3 = path.join(outDir, 'lush_green_patio_vista.png');
await page.screenshot({ path: p3 });
console.log('Saved:', p3);

await browser.close();
console.log('DONE!');
