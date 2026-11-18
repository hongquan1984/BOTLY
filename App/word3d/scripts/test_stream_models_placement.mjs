import { chromium } from 'playwright-core';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:/Users/Admin/.gemini/antigravity/brain/b6ff82c9-4cf6-4c71-93a2-4574cb0af50a';

async function run() {
  console.log('--- TESTING 3D STREAM MODELS PLACEMENT, PERSISTENCE & ASSET STUDIO ---');
  const browser = await chromium.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--use-gl=angle', '--use-angle=default', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox'],
  });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Stream') || text.includes('Spawn') || text.includes('IndexedDB') || text.includes('Saved') || msg.type() === 'error') {
      console.log(`[Browser ${msg.type()}] ${text}`);
    }
  });

  console.log('1. Navigating to http://localhost:5173/ ...');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.waitForSelector('.loading-screen', { state: 'detached', timeout: 30000 });
  await page.waitForTimeout(2000);

  // Click Edit Map
  console.log('2. Entering Edit Map mode...');
  const editMapBtn = page.locator('button:has-text("Edit Map")');
  await editMapBtn.click();
  await page.waitForTimeout(1000);

  // Check palette buttons
  console.log('3. Checking Stream items in palette...');
  const streamStraightBtn = page.locator('button:has-text("Suối Thẳng")');
  const streamCurveBtn = page.locator('button:has-text("Suối Uốn Cong")');
  const streamPondBtn = page.locator('button:has-text("Hồ Nước Đá Rêu")');
  const streamWaterfallBtn = page.locator('button:has-text("Bậc Thác Đá")');

  console.log('Stream Straight count:', await streamStraightBtn.count());
  console.log('Stream Curve count:', await streamCurveBtn.count());
  console.log('Stream Pond count:', await streamPondBtn.count());
  console.log('Stream Waterfall count:', await streamWaterfallBtn.count());

  if (await streamStraightBtn.count() === 0) {
    throw new Error('Stream Straight button not found in palette!');
  }

  // Spawn Stream Straight
  console.log('4. Spawning 🌊 Suối Thẳng into the map...');
  await streamStraightBtn.click();
  await page.waitForTimeout(1500);

  // Elevate stream using ⬆️ Lên +
  console.log('5. Elevating stream with ⬆️ Lên + button...');
  const elevateUpBtn = page.locator('button:has-text("Lên +")');
  await elevateUpBtn.click();
  await page.waitForTimeout(300);
  await elevateUpBtn.click();
  await page.waitForTimeout(500);

  // Spawn Pond
  console.log('6. Spawning 💧 Hồ Nước Đá Rêu into the map...');
  await streamPondBtn.click();
  await page.waitForTimeout(1500);
  await elevateUpBtn.click();
  await page.waitForTimeout(500);

  // Save layout
  console.log('7. Saving layout...');
  const saveBtn = page.locator('button:has-text("Lưu Bố Cục")');
  await saveBtn.click();
  await page.waitForTimeout(1500);

  // Take screenshot 1: Placed & elevated streams in map
  const ss1Path = path.join(ARTIFACT_DIR, '33_stream_models_in_map.png');
  await page.screenshot({ path: ss1Path });
  console.log('Screenshot 1 saved:', ss1Path);

  // Reload page (F5)
  console.log('8. Reloading page (F5) to verify layout persistence...');
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('.loading-screen', { state: 'detached', timeout: 30000 });
  await page.waitForTimeout(2500);

  // Verify LocalStorage layout data
  const layoutCheck = await page.evaluate(() => {
    const raw = localStorage.getItem('cozy_village_layout_v1');
    if (!raw) return { count: 0, items: [] };
    const parsed = JSON.parse(raw);
    const streams = parsed.filter(o => o.name && (o.name.includes('Suối') || o.name.includes('Hồ')));
    return {
      totalCount: parsed.length,
      streamCount: streams.length,
      streams: streams.map(o => ({ id: o.id, name: o.name, y: o.position.y }))
    };
  });
  console.log('Reloaded layout verification:', JSON.stringify(layoutCheck, null, 2));

  // Open Asset Studio modal
  console.log('9. Opening Asset Studio modal...');
  const studioBtn = page.locator('button:has-text("Asset Studio")');
  await studioBtn.click();
  await page.waitForTimeout(2000);

  // Filter by Terrain / Stream category
  const streamCatBtn = page.locator('button:has-text("Suối & Nước")');
  if (await streamCatBtn.count() > 0) {
    console.log('10. Clicking category tab: 🌊 Suối & Nước...');
    await streamCatBtn.click();
    await page.waitForTimeout(1000);
  }

  // Check 3D models listed in Asset Studio
  const cards = page.locator('.asset-item-card');
  const cardCount = await cards.count();
  console.log('Asset Studio cards count:', cardCount);

  // Click on a stream item to view 3D inspection
  if (cardCount > 0) {
    await cards.first().click();
    await page.waitForTimeout(1500);
  }

  // Screenshot Asset Studio
  const ss2Path = path.join(ARTIFACT_DIR, '34_asset_studio_streams.png');
  await page.screenshot({ path: ss2Path });
  console.log('Screenshot 2 saved:', ss2Path);

  await browser.close();
  console.log('=== ALL TESTS COMPLETED SUCCESSFULLY ===');
}

run().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
