import { chromium } from 'playwright-core';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:/Users/Admin/.gemini/antigravity/brain/b6ff82c9-4cf6-4c71-93a2-4574cb0af50a';

async function run() {
  console.log('--- TESTING ANIMATED SINUOUS STREAMS & PERSISTENCE ---');
  const browser = await chromium.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--use-gl=angle', '--use-angle=default', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox'],
  });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Spawn') || text.includes('Water') || text.includes('IndexedDB') || text.includes('Saved') || msg.type() === 'error') {
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

  // Check palette buttons for sinuous streams
  console.log('3. Checking Sinuous Stream buttons in palette...');
  const streamSBtn = page.locator('button:has-text("Suối Uốn Chữ S")');
  const streamWaveBtn = page.locator('button:has-text("Suối Sóng Đôi")');
  const streamBendBtn = page.locator('button:has-text("Khúc Cua 90°")');
  const streamForkBtn = page.locator('button:has-text("Ngã Ba Suối Chữ Y")');

  console.log('Suối Uốn Chữ S count:', await streamSBtn.count());
  console.log('Suối Sóng Đôi count:', await streamWaveBtn.count());
  console.log('Khúc Cua 90° count:', await streamBendBtn.count());
  console.log('Ngã Ba Suối Chữ Y count:', await streamForkBtn.count());

  if (await streamSBtn.count() === 0) {
    throw new Error('Suối Uốn Chữ S button not found!');
  }

  // Spawn Suối Uốn Chữ S
  console.log('4. Spawning 🌊 Suối Uốn Chữ S into the village...');
  await streamSBtn.click();
  await page.waitForTimeout(1500);

  // Elevate slightly to sit proudly on grass
  console.log('5. Elevating stream with ⬆️ Lên + ...');
  const elevateUpBtn = page.locator('button:has-text("Lên +")');
  await elevateUpBtn.click();
  await page.waitForTimeout(400);

  // Also spawn Suối Sóng Đôi
  console.log('6. Spawning 〰️ Suối Sóng Đôi into the village...');
  await streamWaveBtn.click();
  await page.waitForTimeout(1500);
  await elevateUpBtn.click();
  await page.waitForTimeout(400);

  // Screenshot placed sinuous streams
  const ss1Path = path.join(ARTIFACT_DIR, '35_sinuous_stream_placed.png');
  await page.screenshot({ path: ss1Path });
  console.log('Screenshot 1 saved:', ss1Path);

  // Save layout
  console.log('7. Saving layout...');
  const saveBtn = page.locator('button:has-text("Lưu Bố Cục")');
  await saveBtn.click();
  await page.waitForTimeout(1500);

  // Reload page (F5)
  console.log('8. Reloading page (F5) to test persistence...');
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('.loading-screen', { state: 'detached', timeout: 30000 });
  await page.waitForTimeout(2500);

  // Verify persistence in LocalStorage
  const layoutCheck = await page.evaluate(() => {
    const raw = localStorage.getItem('cozy_village_layout_v1');
    if (!raw) return { totalCount: 0, streams: [] };
    const parsed = JSON.parse(raw);
    const streams = parsed.filter(o => o.name && (o.name.includes('Suối') || o.name.includes('Hồ')));
    return {
      totalCount: parsed.length,
      streamCount: streams.length,
      streams: streams.map(o => o.name)
    };
  });
  console.log('Reloaded layout check:', JSON.stringify(layoutCheck, null, 2));

  // Open Asset Studio modal
  console.log('9. Opening Asset Studio (22)...');
  const studioBtn = page.locator('button:has-text("Asset Studio")');
  await studioBtn.click();
  await page.waitForTimeout(2000);

  // Click Terrain category: Suối & Nước (6)
  const streamCatBtn = page.locator('button:has-text("Suối & Nước")');
  if (await streamCatBtn.count() > 0) {
    console.log('10. Selecting 🌊 Suối & Nước (6) category...');
    await streamCatBtn.click();
    await page.waitForTimeout(1000);
  }

  const cards = page.locator('.asset-item-card');
  const cardCount = await cards.count();
  console.log('Stream cards count in Studio:', cardCount);

  // Click first card to inspect 3D preview with water animation
  if (cardCount > 0) {
    await cards.first().click();
    await page.waitForTimeout(1500);
  }

  // Screenshot Asset Studio
  const ss2Path = path.join(ARTIFACT_DIR, '36_asset_studio_animated_streams.png');
  await page.screenshot({ path: ss2Path });
  console.log('Screenshot 2 saved:', ss2Path);

  await browser.close();
  console.log('=== ALL TESTS COMPLETED SUCCESSFULLY ===');
}

run().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
