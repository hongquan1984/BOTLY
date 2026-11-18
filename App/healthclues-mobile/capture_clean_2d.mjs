import { chromium } from 'file:///d:/botly/App/3DHOME/node_modules/playwright-core/index.mjs';

async function run() {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--enable-webgl', '--ignore-gpu-blocklist', '--use-gl=angle', '--no-sandbox']
  });

  const setupPage = async (w, h, outName) => {
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    await page.addInitScript(() => {
      localStorage.setItem('healthclues-onboarding-completed', 'true');
      localStorage.setItem('healthclues-village-tutorial-v2-completed', 'true');
      localStorage.setItem('healthclues_tutorial_completed', 'true');
    });
    await page.goto('http://localhost:8081/(game)/world', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    try {
      const skip = await page.$('text=Bỏ qua');
      if (skip) {
        await skip.click();
        await page.waitForTimeout(1000);
      }
    } catch(e) {}
    await page.screenshot({ path: 'C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/' + outName });
    console.log('Saved', outName);
  };

  await setupPage(390, 844, 'final_restored_2d_portrait.png');
  await setupPage(1024, 512, 'final_restored_2d_landscape.png');

  await browser.close();
}

run();
