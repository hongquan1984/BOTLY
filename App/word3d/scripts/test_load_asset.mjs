import { chromium } from 'playwright-core';

async function testLoad() {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
  });
  const page = await browser.newPage();

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.error('PAGE ERROR:', err));

  await page.goto('http://localhost:5173/');
  await page.waitForTimeout(2000);

  // Evaluate GLTF loading of SM_Cottage_Small directly in browser
  const result = await page.evaluate(async () => {
    const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
    const loader = new GLTFLoader();
    return new Promise((resolve) => {
      loader.load(
        '/assets/medieval_village/GLTF/Buildings/SM_Cottage_Small.gltf',
        (gltf) => {
          const names = [];
          gltf.scene.traverse(c => names.push(c.name));
          resolve({ success: true, count: names.length, names });
        },
        undefined,
        (err) => resolve({ success: false, error: err.message })
      );
    });
  });

  console.log('Load test result:', result);
  await browser.close();
}

testLoad().catch(console.error);
