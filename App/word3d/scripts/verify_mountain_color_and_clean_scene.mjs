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

  const consoleLogs = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error' || msg.text().includes('blend') || msg.text().includes('mountain') || msg.text().includes('màu')) {
      consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
    }
  });

  console.log('Navigating to http://localhost:5173/ ...');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  // 1. Capture clean scene overview: verify no hardcoded mountain, new sky background
  const shot1 = path.join(artifactDir, '80_clean_village_new_bg_no_hardcoded_mountain.png');
  await page.screenshot({ path: shot1 });
  console.log('Captured shot 1:', shot1);

  // 2. Open editor mode and inspect
  await page.evaluate(() => {
    const editor = window.__levelEditor;
    if (editor && !editor.isEnabled()) {
      editor.enable();
    }
  });
  await page.waitForTimeout(1000);

  // 3. Spawn user mountain simulation
  const spawnResult = await page.evaluate(async () => {
    const editor = window.__levelEditor;
    const systems = window.__systems;
    const THREE = window.THREE;
    if (!editor || !systems || !THREE) return { error: 'No editor or THREE' };

    const rockGroup = new THREE.Group();
    rockGroup.name = 'UserPlaced_MountainCliffs';

    // Stepped terraced geometries (matching the user's screenshot)
    const step1Geo = new THREE.CylinderGeometry(2.4, 2.8, 1.2, 8);
    const step2Geo = new THREE.CylinderGeometry(1.6, 2.0, 1.0, 7);
    const step3Geo = new THREE.CylinderGeometry(0.9, 1.3, 0.8, 6);

    // Initial chalk white material (simulating untextured model)
    const whiteMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.9,
    });

    const m1 = new THREE.Mesh(step1Geo, whiteMat.clone());
    m1.position.y = 0.6;
    m1.name = 'rock_base_step';

    const m2 = new THREE.Mesh(step2Geo, whiteMat.clone());
    m2.position.set(0.2, 1.6, -0.1);
    m2.name = 'rock_middle_terrace';

    const m3 = new THREE.Mesh(step3Geo, whiteMat.clone());
    m3.position.set(0.4, 2.4, 0.1);
    m3.name = 'rock_top_terrace';

    rockGroup.add(m1, m2, m3);

    // Red maple tree on top (tree_momiji_maple)
    const trunkGeo = new THREE.CylinderGeometry(0.08, 0.12, 1.2, 5);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c3a21, roughness: 0.8 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.set(0.4, 3.2, 0.1);
    trunk.name = 'tree_momiji_trunk';

    const leafGeo = new THREE.DodecahedronGeometry(0.65, 1);
    const leafMat = new THREE.MeshStandardMaterial({ color: 0xc0392b, roughness: 0.7 });
    const leaves = new THREE.Mesh(leafGeo, leafMat);
    leaves.position.set(0.4, 3.9, 0.1);
    leaves.name = 'tree_momiji_leaves';

    rockGroup.add(trunk, leaves);

    // Position on island edge exactly where user placed it
    rockGroup.position.set(-7.0, 1.8, -4.5);
    systems.cozyVillage.group.add(rockGroup);

    editor.selectObject(rockGroup);

    return {
      placed: true,
      selectedName: editor.getSelectedInfo()?.name,
    };
  });

  console.log('Spawn simulation result:', spawnResult);
  await page.waitForTimeout(800);

  // Position camera to look directly at the user's mountain on the edge
  await page.evaluate(() => {
    const systems = window.__systems;
    const THREE = window.THREE;
    if (systems && systems.cameraCtrl && THREE) {
      systems.cameraCtrl.focusOn(new THREE.Vector3(-7.0, 3.0, -4.5), [-4.5, 3.0, 5.0]);
    }
  });
  await page.waitForTimeout(1000);

  // 4. Capture screenshot showing white mountain with editor selection & Lên Màu button
  const shot2 = path.join(artifactDir, '81_user_mountain_before_blend.png');
  await page.screenshot({ path: shot2 });
  console.log('Captured shot 2:', shot2);

  // 5. Trigger Color Blend on the selected mountain!
  await page.evaluate(() => {
    const editor = window.__levelEditor;
    if (editor) {
      editor.blendSelectedColor();
    }
  });
  await page.waitForTimeout(1000);

  // 6. Capture closeup of the colorized mountain: lush green grass terraces + slate rock cliff sides + red tree intact!
  const shot3 = path.join(artifactDir, '82_user_mountain_colorized_closeup.png');
  await page.screenshot({ path: shot3 });
  console.log('Captured shot 3:', shot3);

  // 7. Reset camera to panoramic overview and test orbit / 2.5D parallax with new sky
  await page.evaluate(() => {
    const systems = window.__systems;
    if (systems && systems.cameraCtrl) {
      systems.cameraCtrl.resetView();
      systems.levelEditor.selectObject(null);
    }
  });
  await page.waitForTimeout(1200);

  const shot4 = path.join(artifactDir, '83_panoramic_village_with_colorized_mountain.png');
  await page.screenshot({ path: shot4 });
  console.log('Captured shot 4:', shot4);

  // 8. Mobile viewport test
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(1200);
  const shot5 = path.join(artifactDir, '84_mobile_village_and_sky_acceptance.png');
  await page.screenshot({ path: shot5 });
  console.log('Captured shot 5:', shot5);

  // Performance stats
  const stats = await page.evaluate(() => {
    const systems = window.__systems;
    const info = systems?.renderer?.info;
    return {
      triangles: info?.render?.triangles,
      drawCalls: info?.render?.calls,
      geometries: info?.memory?.geometries,
      textures: info?.memory?.textures,
    };
  });

  console.log('Performance stats:', stats);
  console.log('Relevant console logs:', consoleLogs);

  await browser.close();
}

run().catch(console.error);
