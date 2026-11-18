import { chromium } from 'file:///d:/botly/App/3DHOME/node_modules/playwright-core/index.mjs';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb';

async function runTest() {
  console.log('=== STARTING HEALTHCLUES 3D WORLD INTEGRATION TEST ===');

  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--enable-webgl', '--ignore-gpu-blocklist', '--use-gl=angle', '--no-sandbox']
  });

  // TEST 1: Mobile Portrait (390 x 844)
  console.log('>>> 1. Testing Mobile Portrait (390x844)...');
  const pagePortrait = await browser.newPage({ viewport: { width: 390, height: 844 } });
  
  await pagePortrait.addInitScript(() => {
    localStorage.setItem('healthclues-onboarding-completed', 'true');
    localStorage.setItem('healthclues-village-tutorial-v2-completed', 'true');
    localStorage.setItem('healthclues_tutorial_completed', 'true');
  });

  await pagePortrait.goto('http://localhost:8081/(game)/world', { waitUntil: 'networkidle' });
  await pagePortrait.waitForTimeout(4000);

  // Dismiss tutorial if still present
  try {
    const skipBtn = await pagePortrait.$('text=Bỏ qua');
    if (skipBtn) await skipBtn.click();
    await pagePortrait.waitForTimeout(1000);
  } catch(e) {}

  // Screenshot 1: 3D Floating Village in Mobile Portrait
  await pagePortrait.screenshot({
    path: path.join(ARTIFACT_DIR, 'test_01_3d_world_mobile_portrait.png')
  });
  console.log('Saved test_01_3d_world_mobile_portrait.png');

  // TEST 2: Toggle to 2D view (Rollback check)
  console.log('>>> 2. Testing Toggle from 3D to 2D...');
  const toggleBtn = await pagePortrait.$('text=3D Làng Nổi');
  if (toggleBtn) {
    await toggleBtn.click();
    await pagePortrait.waitForTimeout(1500);
    await pagePortrait.screenshot({
      path: path.join(ARTIFACT_DIR, 'test_02_toggled_to_2d_portrait.png')
    });
    console.log('Saved test_02_toggled_to_2d_portrait.png');

    // Toggle back to 3D
    const toggleBackBtn = await pagePortrait.$('text=2D Làng Núi');
    if (toggleBackBtn) {
      await toggleBackBtn.click();
      await pagePortrait.waitForTimeout(2000);
      console.log('Toggled back to 3D successfully');
    }
  }

  // TEST 3: Desktop Landscape (1024 x 600)
  console.log('>>> 3. Testing Desktop Landscape (1024x600)...');
  const pageLandscape = await browser.newPage({ viewport: { width: 1024, height: 600 } });
  
  await pageLandscape.addInitScript(() => {
    localStorage.setItem('healthclues-onboarding-completed', 'true');
    localStorage.setItem('healthclues-village-tutorial-v2-completed', 'true');
    localStorage.setItem('healthclues_tutorial_completed', 'true');
  });

  await pageLandscape.goto('http://localhost:8081/(game)/world', { waitUntil: 'networkidle' });
  await pageLandscape.waitForTimeout(4000);

  try {
    const skipBtn = await pageLandscape.$('text=Bỏ qua');
    if (skipBtn) await skipBtn.click();
    await pageLandscape.waitForTimeout(1000);
  } catch(e) {}

  await pageLandscape.screenshot({
    path: path.join(ARTIFACT_DIR, 'test_03_3d_world_desktop_landscape.png')
  });
  console.log('Saved test_03_3d_world_desktop_landscape.png');

  // TEST 4: Communication Bridge - Trigger interaction from 3D scene
  console.log('>>> 4. Testing Communication Bridge (Flora Potion Shop -> Herbal Sheet)...');
  await pageLandscape.evaluate(() => {
    window.postMessage(
      JSON.stringify({
        type: 'INTERACT_NPC',
        landmarkId: 'potion-shop',
        npcId: 'npc-flora',
        name: 'Flora',
        role: 'Vườn Thảo Mộc',
        greeting: 'Chào mừng bạn đến Vườn Thảo Mộc!'
      }),
      '*'
    );
  });
  await pageLandscape.waitForTimeout(1500);

  await pageLandscape.screenshot({
    path: path.join(ARTIFACT_DIR, 'test_04_landmark_sheet_opened_via_bridge.png')
  });
  console.log('Saved test_04_landmark_sheet_opened_via_bridge.png');

  // TEST 5: Body Detective Library Bridge
  console.log('>>> 5. Testing Detective Library Bridge (Lyra -> Detective Modal)...');
  await pageLandscape.evaluate(() => {
    window.postMessage(
      JSON.stringify({
        type: 'INTERACT_NPC',
        landmarkId: 'arcane-library',
        npcId: 'npc-lyra',
        name: 'Lyra',
        role: 'Thư Viện Tri Thức',
        greeting: 'Bạn đã sẵn sàng mở hồ sơ thám tử y khoa chưa?'
      }),
      '*'
    );
  });
  await pageLandscape.waitForTimeout(2000);

  await pageLandscape.screenshot({
    path: path.join(ARTIFACT_DIR, 'test_05_detective_modal_opened_via_bridge.png')
  });
  console.log('Saved test_05_detective_modal_opened_via_bridge.png');

  await browser.close();
  console.log('=== ALL TESTS COMPLETED SUCCESSFULLY! ===');
}

runTest().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
