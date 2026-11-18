import { chromium } from 'playwright-core';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function run() {
  const browser = await chromium.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--use-gl=angle', '--use-angle=default', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox'],
  });

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.waitForSelector('.loading-screen', { state: 'detached', timeout: 30000 });
  await page.waitForTimeout(2000);

  const info = await page.evaluate(() => {
    const editor = window.__levelEditor;
    const systems = window.__systems;
    if (!editor) return { error: 'No __levelEditor found' };

    // Get list of all editable objects
    const cozyVillage = systems?.cozyVillage;
    const editableList = cozyVillage?.editableObjects?.map((obj) => ({
      name: obj.name,
      userData: obj.userData,
      pos: [obj.position.x, obj.position.y, obj.position.z],
      scale: [obj.scale.x, obj.scale.y, obj.scale.z],
      childrenCount: obj.children?.length,
    }));

    return {
      editableCount: editableList?.length,
      mountain: editableList?.find((o) => o.name?.includes('Mountain') || o.userData?.name?.includes('Mountain')),
      allNames: editableList?.map((o) => o.userData?.name || o.name),
    };
  });

  console.log('Inspection result:', JSON.stringify(info, null, 2));
  await browser.close();
}

run().catch(console.error);
