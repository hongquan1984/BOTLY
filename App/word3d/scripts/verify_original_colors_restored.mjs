import { chromium } from 'playwright-core';
import fs from 'fs';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = 'C:\\Users\\Admin\\.gemini\\antigravity\\brain\\b6ff82c9-4cf6-4c71-93a2-4574cb0af50a';

async function run() {
  const browser = await chromium.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--use-gl=angle', '--use-angle=default', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox'],
  });

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:5173/');
  await page.waitForTimeout(4000);

  // 1. Focus camera on the wooden bridge
  await page.evaluate(() => {
    const systems = window.__systems;
    const THREE = window.THREE;
    if (systems && systems.cameraCtrl && THREE) {
      systems.cameraCtrl.focusOn(new THREE.Vector3(-0.8, 2.0, 1.2), [-5.0, 3.5, 6.0]);
    }
  });
  await page.waitForTimeout(1000);

  const shot1 = path.join(artifactDir, '95_bridge_wooden_original_restored.png');
  await page.screenshot({ path: shot1 });
  console.log('Saved shot 1 (Bridge natural wood):', shot1);

  // 2. Focus camera on the houses
  await page.evaluate(() => {
    const systems = window.__systems;
    const THREE = window.THREE;
    if (systems && systems.cameraCtrl && THREE) {
      systems.cameraCtrl.focusOn(new THREE.Vector3(4.0, 3.0, -3.0), [6.0, 4.0, 8.0]);
    }
  });
  await page.waitForTimeout(1000);

  const shot2 = path.join(artifactDir, '96_houses_original_colors.png');
  await page.screenshot({ path: shot2 });
  console.log('Saved shot 2 (Houses original colors):', shot2);

  // 3. Overview screenshot
  await page.evaluate(() => {
    const systems = window.__systems;
    if (systems && systems.cameraCtrl) {
      systems.cameraCtrl.resetView();
    }
  });
  await page.waitForTimeout(1000);

  const shot3 = path.join(artifactDir, '97_overview_all_original_colors.png');
  await page.screenshot({ path: shot3 });
  console.log('Saved shot 3 (Full overview):', shot3);

  await browser.close();
}

run().catch(console.error);
