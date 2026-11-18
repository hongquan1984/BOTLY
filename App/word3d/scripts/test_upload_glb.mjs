import { chromium } from 'playwright-core';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const targetDir = 'D:\\botly\\App\\word3d';
const glbPath = path.join(targetDir, 'public', 'assets', 'world', 'original', 'castle_village_scene.glb');

async function main() {
  const browser = await chromium.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--use-gl=angle', '--use-angle=default', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox'],
  });

  const page = await browser.newPage({ viewport: { width: 1366, height: 800 } });
  
  page.on('console', (msg) => {
    if (msg.text().includes('Custom 3D model') || msg.type() === 'error') {
      console.log(`[Browser ${msg.type()}] ${msg.text()}`);
    }
  });

  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.waitForSelector('.loading-screen', { state: 'detached', timeout: 30000 });
  await page.waitForTimeout(1500);

  // Click Edit Map
  await page.locator('button:has-text("Edit Map")').click();
  await page.waitForTimeout(500);

  // Upload .glb
  console.log('Uploading .glb file...');
  const fileInput = page.locator('input[type="file"][accept=".glb,.gltf"]');
  await fileInput.setInputFiles(glbPath);
  await page.waitForTimeout(4000);

  // Verify selection bar displays uploaded model name
  const selectionBar = page.locator('.editor-selection-bar');
  const isVisible = await selectionBar.isVisible();
  console.log('Selection bar visible after GLB upload:', isVisible);
  if (isVisible) {
    const title = await page.locator('.editor-selection-title').innerText();
    console.log('Selected object:', title);
  }

  // Take screenshot
  const outPath = path.join(targetDir, 'docs', 'screenshots', '21_glb_custom_upload_verified.png');
  await page.screenshot({ path: outPath });
  console.log('Screenshot saved:', outPath);

  await browser.close();
}

main();
