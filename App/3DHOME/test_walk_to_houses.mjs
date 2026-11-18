import { chromium } from 'file:///D:/botly/App/3DHOME/node_modules/playwright-core/index.mjs';
import path from 'path';

const outputDir = 'C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/village_3d_shots';

async function testWalk() {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--enable-webgl', '--ignore-gpu-blocklist', '--use-gl=angle', '--no-sandbox'],
  });

  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });

  console.log('Navigating to http://localhost:5179/village.html ...');
  await page.goto('http://localhost:5179/village.html', { waitUntil: 'networkidle', timeout: 30000 });

  await page.waitForFunction(() => window.villageReady === true, { timeout: 35000 });
  console.log('Village ready! Testing character walking up close to houses...');

  const shots = [
    {
      name: 'walk_01_at_east_apothecary.png',
      // East flank house that was previously blocked at x=14! Now walk right up to x=20.5, z=0.0!
      fn: () => {
        window.teleportPlayer(20.5, 0.0, -Math.PI * 0.5);
        document.querySelector('.view-tabs [data-view="character"]').click();
        if (window.setCharCamYaw) window.setCharCamYaw(Math.PI * 0.5);
      }
    },
    {
      name: 'walk_02_at_east_inn_patio.png',
      // Walk right up to Alpine Inn at x=18.5, z=12.0
      fn: () => {
        window.teleportPlayer(18.5, 12.0, -Math.PI * 0.6);
        document.querySelector('.view-tabs [data-view="character"]').click();
        if (window.setCharCamYaw) window.setCharCamYaw(Math.PI * 0.4);
      }
    },
    {
      name: 'walk_03_at_bell_tower.png',
      // Walk right up to Bell Tower at x=18.0, z=-12.0
      fn: () => {
        window.teleportPlayer(18.0, -12.0, -Math.PI * 0.4);
        document.querySelector('.view-tabs [data-view="character"]').click();
        if (window.setCharCamYaw) window.setCharCamYaw(Math.PI * 0.6);
      }
    },
    {
      name: 'walk_04_at_west_greenhouse.png',
      // Walk right up to Greenhouse at x=-19.0, z=-12.0
      fn: () => {
        window.teleportPlayer(-19.0, -12.0, Math.PI * 0.4);
        document.querySelector('.view-tabs [data-view="character"]').click();
        if (window.setCharCamYaw) window.setCharCamYaw(-Math.PI * 0.6);
      }
    },
    {
      name: 'walk_05_replan_overview.png',
      fn: () => {
        document.querySelector('.view-tabs [data-view="overview"]').click();
      }
    }
  ];

  for (const s of shots) {
    await page.evaluate(s.fn);
    await page.waitForTimeout(1600);
    const outPath = path.join(outputDir, s.name);
    await page.screenshot({ path: outPath });
    console.log('Captured', s.name);
  }

  await browser.close();
  console.log('All walk tests completed successfully!');
}

testWalk().catch(console.error);
