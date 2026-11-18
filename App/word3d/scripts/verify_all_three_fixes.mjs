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

  console.log('1. Loading http://localhost:5173/ ...');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  // Focus camera directly on the left rim where the cloud was previously clipping
  await page.evaluate(() => {
    const systems = window.__systems;
    const THREE = window.THREE;
    if (systems && systems.cameraCtrl && THREE) {
      systems.cameraCtrl.focusOn(new THREE.Vector3(-14.0, 2.0, 6.0), [-8.0, 4.0, 8.0]);
    }
  });
  await page.waitForTimeout(1000);

  // Capture shot 1: Verify the left rim is clean, no clipping cloud blob!
  const shot1 = path.join(artifactDir, '85_island_edge_clean_no_clipping_cloud.png');
  await page.screenshot({ path: shot1 });
  console.log('Captured shot 1 (Clean edge, no clipping cloud):', shot1);

  // 2. Open Edit Map mode
  await page.evaluate(() => {
    const editor = window.__levelEditor;
    if (editor && !editor.isEnabled()) {
      editor.enable();
    }
  });
  await page.waitForTimeout(800);

  // 3. Spawn user mountain simulation, colorize it, and verify auto-save
  const colorizeResult = await page.evaluate(async () => {
    const editor = window.__levelEditor;
    const systems = window.__systems;
    const THREE = window.THREE;
    if (!editor || !systems || !THREE) return { error: 'No editor' };

    // Create stepped mountain rock (like user's model)
    const rockGroup = new THREE.Group();
    rockGroup.name = 'CustomMountain_Terraced';

    const step1Geo = new THREE.CylinderGeometry(2.2, 2.6, 1.2, 8);
    const step2Geo = new THREE.CylinderGeometry(1.5, 1.8, 1.0, 7);

    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 });
    const m1 = new THREE.Mesh(step1Geo, whiteMat.clone());
    m1.position.y = 0.6;
    m1.name = 'rock_base';

    const m2 = new THREE.Mesh(step2Geo, whiteMat.clone());
    m2.position.set(0.1, 1.6, 0);
    m2.name = 'rock_terrace';

    rockGroup.add(m1, m2);

    // Red tree on top
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 1.0, 5), new THREE.MeshStandardMaterial({ color: 0x5c3a21 }));
    trunk.position.set(0.1, 2.6, 0);
    trunk.name = 'momiji_trunk';
    const leaves = new THREE.Mesh(new THREE.DodecahedronGeometry(0.6, 1), new THREE.MeshStandardMaterial({ color: 0xc0392b }));
    leaves.position.set(0.1, 3.2, 0);
    leaves.name = 'momiji_leaves';
    rockGroup.add(trunk, leaves);

    rockGroup.position.set(-6.5, 1.8, -4.5);
    systems.cozyVillage.group.add(rockGroup);

    // Register object
    window.__testRock = rockGroup;
    editor.selectObject(rockGroup);

    // Trigger color blend!
    const blended = editor.blendSelectedColor();

    // Check if vertex colors were set
    let hasColors = false;
    rockGroup.traverse((c) => {
      if (c.isMesh && c.geometry && c.geometry.attributes.color) {
        hasColors = true;
      }
    });

    // Check localStorage
    const savedLayout = localStorage.getItem('cozy_village_layout_v1');
    const parsed = savedLayout ? JSON.parse(savedLayout) : null;
    const rockSaved = parsed ? parsed.find((o) => o.name === rockGroup.name) : null;

    return {
      blended,
      hasColors,
      rockSaved: !!rockSaved,
      isColorBlendedSaved: rockSaved ? rockSaved.isColorBlended : false,
      savedItemCount: parsed ? parsed.length : 0,
    };
  });

  console.log('Colorize & Auto-Save Result:', colorizeResult);

  // Focus camera on the colorized mountain
  await page.evaluate(() => {
    const systems = window.__systems;
    const THREE = window.THREE;
    if (systems && systems.cameraCtrl && THREE) {
      systems.cameraCtrl.focusOn(new THREE.Vector3(-6.5, 3.0, -4.5), [-4.0, 2.5, 5.0]);
    }
  });
  await page.waitForTimeout(1000);

  const shot2 = path.join(artifactDir, '86_mountain_colorized_before_f5.png');
  await page.screenshot({ path: shot2 });
  console.log('Captured shot 2 (Colorized before F5):', shot2);

  // 4. NOW SIMULATE F5: RELOAD THE PAGE!
  console.log('4. Simulating F5 Page Reload...');
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(3500);

  // Check state after reload
  const reloadState = await page.evaluate(() => {
    const systems = window.__systems;
    const THREE = window.THREE;

    // Find the custom rock object in the scene
    let rockObj = null;
    systems?.cozyVillage?.group?.traverse((c) => {
      if (c.name === 'CustomMountain_Terraced' || c.userData?.name === 'CustomMountain_Terraced') {
        rockObj = c;
      }
    });

    let hasColorsAfterReload = false;
    let grassColorVerified = false;
    let rockColorVerified = false;

    if (rockObj) {
      rockObj.traverse((c) => {
        if (c.isMesh && c.geometry && c.geometry.attributes.color) {
          hasColorsAfterReload = true;
          const colAttr = c.geometry.attributes.color;
          // check if r, g, b matches green grass (g > r) or slate rock
          for (let i = 0; i < colAttr.count; i++) {
            const r = colAttr.getX(i);
            const g = colAttr.getY(i);
            const b = colAttr.getZ(i);
            if (g > 0.5 && g > r && g > b) grassColorVerified = true;
            if (r > 0.3 && Math.abs(r - b) < 0.15) rockColorVerified = true;
          }
        }
      });
    }

    // Check if legacy HeadwaterMountain exists
    let headwaterFound = false;
    systems?.cozyVillage?.group?.traverse((c) => {
      const n = (c.name || '').toLowerCase();
      if (n.includes('headwater') || n.includes('ngọn núi đầu nguồn')) {
        headwaterFound = true;
      }
    });

    // Camera focus on rock
    if (systems && systems.cameraCtrl && THREE) {
      systems.cameraCtrl.focusOn(new THREE.Vector3(-6.5, 3.0, -4.5), [-4.0, 2.5, 5.0]);
    }

    return {
      rockObjFound: !!rockObj,
      hasColorsAfterReload,
      grassColorVerified,
      rockColorVerified,
      headwaterFound,
    };
  });

  console.log('State After F5 Reload:', reloadState);
  await page.waitForTimeout(1000);

  // Capture shot 3: Closeup after F5 - Verify COLOR PERSISTED!
  const shot3 = path.join(artifactDir, '87_mountain_colorized_persisted_after_f5.png');
  await page.screenshot({ path: shot3 });
  console.log('Captured shot 3 (Color persisted after F5):', shot3);

  // 5. Panoramic full view
  await page.evaluate(() => {
    const systems = window.__systems;
    if (systems && systems.cameraCtrl) {
      systems.cameraCtrl.resetView();
    }
  });
  await page.waitForTimeout(1200);

  const shot4 = path.join(artifactDir, '88_full_clean_village_and_sky.png');
  await page.screenshot({ path: shot4 });
  console.log('Captured shot 4 (Full overview):', shot4);

  await browser.close();
}

run().catch(console.error);
