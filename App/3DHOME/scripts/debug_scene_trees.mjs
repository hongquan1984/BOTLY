import { createRequire } from 'module';
const require = createRequire('d:/botly/App/3DHOME/package.json');
const { chromium } = require('playwright-core');

const browser = await chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
  args: ['--enable-webgl', '--ignore-gpu-blocklist', '--use-gl=angle', '--use-angle=swiftshader', '--no-sandbox'],
});

const page = await browser.newPage({ viewport: { width: 480, height: 854 } });
await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => Boolean(window.__CHALET_API__), null, { timeout: 30000 });
await page.evaluate(() => window.__CHALET_API__.waitPhase2());

const info = await page.evaluate(() => {
  const scene = window.__CHALET_API__.scene;
  const objects = [];
  scene.traverse((obj) => {
    if (obj.isMesh) {
      const e = obj.matrixWorld.elements;
      const x = e[12];
      const y = e[13];
      const z = e[14];
      if (x > 3.0 && z < 0.0 && z > -15.0) {
        objects.push({
          geo: obj.geometry?.type,
          x: +x.toFixed(2),
          y: +y.toFixed(2),
          z: +z.toFixed(2),
        });
      }
    }
  });
  return objects;
});

console.log('Objects at x > 3.0, -15 < z < 0:', info.length);
for (const o of info) {
  console.log(o);
}

await browser.close();
