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

  // PAGE 1: Place rock, colorize it, verify auto-save
  const page1 = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page1.goto('http://localhost:5173/');
  await page1.waitForTimeout(3500);

  // Enable editor
  await page1.evaluate(() => {
    const editor = window.__levelEditor;
    if (editor && !editor.isEnabled()) editor.enable();
  });
  await page1.waitForTimeout(500);

  // Spawn an extracted rock boulder or spawn item and colorize
  const spawnAndColor = await page1.evaluate(async () => {
    const editor = window.__levelEditor;
    const systems = window.__systems;
    const THREE = window.THREE;
    if (!editor || !systems || !THREE) return { error: 'No editor' };

    // Place an extracted rock asset
    const rock = await editor.spawnExtractedAsset('assets-extracted/rocks/rock_moss_boulder.glb', 'Mountain_Rock_User_1', new THREE.Vector3(-6.5, 1.82, -4.5));
    rock.scale.set(3.5, 3.5, 3.5);

    // Apply color blend
    editor.selectObject(rock);
    const blendOk = editor.blendSelectedColor();

    const saved = localStorage.getItem('cozy_village_layout_v1');
    const parsed = saved ? JSON.parse(saved) : [];
    const item = parsed.find(o => o.name === rock.name);

    // Camera view
    systems.cameraCtrl.focusOn(new THREE.Vector3(-6.5, 3.0, -4.5), [-4.0, 2.5, 5.0]);

    return {
      blendOk,
      actualName: rock.name,
      savedItemFound: !!item,
      isColorBlended: item?.isColorBlended,
    };
  });

  console.log('Page 1 result:', spawnAndColor);
  await page1.waitForTimeout(1000);
  const shot1 = path.join(artifactDir, '93_mountain_colorized_step1.png');
  await page1.screenshot({ path: shot1 });
  console.log('Saved shot 1:', shot1);

  // Save localStorage string to carry over to fresh context
  const storageJson = await page1.evaluate(() => localStorage.getItem('cozy_village_layout_v1'));
  await page1.close();

  // PAGE 2: Fresh page in same browser (simulating F5 reload)
  console.log('Opening Page 2 with saved layout in localStorage...');
  const page2 = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  
  // Set localStorage before loading
  await page2.addInitScript((val) => {
    if (val) localStorage.setItem('cozy_village_layout_v1', val);
  }, storageJson);

  await page2.goto('http://localhost:5173/');
  await page2.waitForTimeout(4000);

  const page2Check = await page2.evaluate(() => {
    const systems = window.__systems;
    const THREE = window.THREE;

    let targetRock = null;
    systems?.cozyVillage?.group?.traverse((c) => {
      if (c.name?.includes('Mountain_Rock_User') || c.userData?.name?.includes('Mountain_Rock_User')) {
        targetRock = c;
      }
    });

    let hasVertexColors = false;
    let greenGrassCount = 0;
    let slateRockCount = 0;

    if (targetRock) {
      targetRock.traverse((c) => {
        if (c.isMesh && c.geometry && c.geometry.attributes.color) {
          hasVertexColors = true;
          const col = c.geometry.attributes.color;
          for (let i = 0; i < col.count; i++) {
            const r = col.getX(i);
            const g = col.getY(i);
            const b = col.getZ(i);
            if (g > 0.5 && g > r) greenGrassCount++;
            if (r > 0.3 && Math.abs(r - b) < 0.15) slateRockCount++;
          }
        }
      });
      systems.cameraCtrl.focusOn(new THREE.Vector3(-6.5, 3.0, -4.5), [-4.0, 2.5, 5.0]);
    }

    return {
      targetRockFound: !!targetRock,
      hasVertexColors,
      greenGrassCount,
      slateRockCount,
      userDataBlended: targetRock?.userData?.isColorBlended,
    };
  });

  console.log('Page 2 (After F5) result:', page2Check);
  await page2.waitForTimeout(1000);

  const shot2 = path.join(artifactDir, '94_mountain_persisted_after_fresh_load.png');
  await page2.screenshot({ path: shot2 });
  console.log('Saved shot 2:', shot2);

  await browser.close();
}

run().catch(console.error);
