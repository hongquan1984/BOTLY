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
  await page.waitForTimeout(3000);

  const dump = await page.evaluate(() => {
    // Check localStorage
    const localKeys = Object.keys(localStorage);
    const storageData = {};
    for (const k of localKeys) {
      storageData[k] = localStorage.getItem(k);
    }

    // Traverse Three.js scene if accessible
    // Let's find any object in window
    let sceneObjects = [];
    const root = window.__THREE_SCENE__ || window.scene;
    return {
      storageData,
      rootFound: !!root,
    };
  });

  console.log('LocalStorage Dump:', JSON.stringify(dump, null, 2));
  await browser.close();
}

run().catch(console.error);
