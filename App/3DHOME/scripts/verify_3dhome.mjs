import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';

const require = createRequire('d:/botly/App/3DHOME/package.json');
const { chromium } = require('playwright-core');

const outDir = 'D:/botly/App/3DHOME/reports/shots';
fs.mkdirSync(outDir, { recursive: true });

const url = 'http://127.0.0.1:5179';

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
const errors = [];
page.on('pageerror', (err) => errors.push(`PAGEERROR: ${err.message}`));
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(`CONSOLE_ERROR: ${msg.text()}`);
});

const t0 = Date.now();
await page.goto(url, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => Boolean(window.__CHALET_API__), null, { polling: 150, timeout: 90000 });
const phase1Ms = Date.now() - t0;

// Wait cleanly for Phase 2 background streaming (Kitchen, Bedroom, Bathroom, Fine Props)
await page.evaluate(() => window.__CHALET_API__.waitPhase2());
const phase2Ms = Date.now() - t0;
await page.waitForTimeout(800);

// 1. Living Room (HUD on + off)
await page.evaluate(() => {
  window.__CHALET_API__.setQuality('high');
  window.__CHALET_API__.switchView('overview');
});
await page.waitForTimeout(800);
const perfDesktop = await page.evaluate(() => window.__CHALET_API__.getPerfStats());
const livingState = await page.evaluate(() => window.__CHALET_API__.getCameraState());
await page.screenshot({ path: path.join(outDir, 'room1_living.png') });

// 2. Open Kitchen & Waterfall Island + Dining
await page.evaluate(() => window.__CHALET_API__.hideHud());
await page.evaluate(() => {
  window.__CHALET_API__.setHomeLook(-42, 7.0, 3.25, 'kitchen');
});
await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
await page.waitForTimeout(300);
const kitchenState = await page.evaluate(() => window.__CHALET_API__.getCameraState());
await page.screenshot({ path: path.join(outDir, 'room2_kitchen_dining.png') });

// 3. Master Bedroom w/ Giant Floor-to-Ceiling Pine Forest Window
await page.evaluate(() => {
  window.__CHALET_API__.setHomeLook(-162, 4.5, 3.20, 'bedroom');
});
await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
await page.waitForTimeout(300);
const bedroomState = await page.evaluate(() => window.__CHALET_API__.getCameraState());
await page.screenshot({ path: path.join(outDir, 'room3_bedroom_forest.png') });

// 4. Enclosed Luxury Spa Bathroom / WC
await page.evaluate(() => {
  window.__CHALET_API__.setHomeLook(-55, 6.0, 2.85, 'bathroom');
});
await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
await page.waitForTimeout(300);
const bathroomState = await page.evaluate(() => window.__CHALET_API__.getCameraState());
await page.screenshot({ path: path.join(outDir, 'room4_bathroom_wc.png') });

// 5. Full 16.8m Villa 3/4 Cutaway View
await page.evaluate(() => {
  window.__CHALET_API__.setView34(-36, 36, 18.2);
});
await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
await page.waitForTimeout(300);
await page.screenshot({ path: path.join(outDir, 'room5_cutaway34.png') });

// 6. Character Walk across rooms (Kitchen -> Master Bedroom Doorway)
await page.evaluate(() => {
  window.__CHALET_API__.showHud();
  window.__CHALET_API__.switchView('character');
  window.__CHALET_API__.movePlayerTo(1.35, -3.5);
});
await page.waitForTimeout(450);
const posBefore = await page.evaluate(() => window.__CHALET_API__.getPlayerPos());
await page.keyboard.down('KeyW');
await page.waitForTimeout(550);
await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(r)))));
await page.keyboard.up('KeyW');
const posAfter = await page.evaluate(() => window.__CHALET_API__.getPlayerPos());
await page.screenshot({ path: path.join(outDir, 'room6_character_walk.png') });

// 7. Mobile Portrait Viewport (390x844): Living Room & Master Bedroom
await page.setViewportSize({ width: 390, height: 844 });
await page.evaluate(() => {
  window.__CHALET_API__.setQuality('balanced');
  window.__CHALET_API__.switchView('overview');
});
await page.waitForTimeout(450);
const perfMobile = await page.evaluate(() => window.__CHALET_API__.getPerfStats());
await page.screenshot({ path: path.join(outDir, 'room7_mobile_living.png') });

await page.evaluate(() => {
  window.__CHALET_API__.setHomeLook(-165, 4.5, 3.25, 'bedroom');
});
await page.waitForTimeout(450);
await page.screenshot({ path: path.join(outDir, 'room8_mobile_bedroom.png') });

// 8. CacheStorage Warm Reload Test (second load in same browser context)
await page.setViewportSize({ width: 1280, height: 720 });
const tReload0 = Date.now();
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => Boolean(window.__CHALET_API__), null, { polling: 150, timeout: 90000 });
const cachedPhase1Ms = Date.now() - tReload0;
await page.evaluate(() => window.__CHALET_API__.waitPhase2());
const cachedPhase2Ms = Date.now() - tReload0;
const cacheKeys = await page.evaluate(async () => {
  if (!('caches' in window)) return [];
  const cache = await caches.open('alpine-chalet-glb-v1');
  const keys = await cache.keys();
  return keys.map((k) => new URL(k.url).pathname);
});

const report = {
  errors,
  phase1Ms,
  phase2Ms,
  cachedPhase1Ms,
  cachedPhase2Ms,
  cachedGlbCount: cacheKeys.length,
  perfDesktop,
  perfMobile,
  livingState,
  kitchenState,
  bedroomState,
  bathroomState,
  posBefore,
  posAfter,
  movedDist: Math.hypot(posAfter.x - posBefore.x, posAfter.z - posBefore.z),
};

fs.writeFileSync('D:/botly/App/3DHOME/reports/verify_result.json', JSON.stringify(report, null, 2));
await browser.close();
