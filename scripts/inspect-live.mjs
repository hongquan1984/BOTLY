import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.goto('https://www.botly.vn/healthclues', { waitUntil: 'networkidle2', timeout: 30000 });
  
  await page.evaluate(() => {
    const el = document.querySelector('.hc-doors-section');
    if (el) el.scrollIntoView({ behavior: 'instant' });
  });
  await new Promise(r => setTimeout(r, 1500));
  
  const metrics = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.carousel-3d-card')).map((c, i) => {
      const r = c.getBoundingClientRect();
      const computed = window.getComputedStyle(c);
      return {
        index: i,
        left: Math.round(r.left),
        right: Math.round(r.right),
        width: Math.round(r.width),
        transform: c.style.transform,
        computedTransform: computed.transform,
        leftStyle: computed.left,
        rightStyle: computed.right,
        position: computed.position,
        zIndex: computed.zIndex,
        opacity: computed.opacity,
        title: c.querySelector('.card-title')?.textContent?.trim()
      };
    });
    return {
      windowWidth: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      hasHorizontalScroll: document.documentElement.scrollWidth > window.innerWidth,
      cards
    };
  });
  
  console.log('Metrics on live botly.vn/healthclues:', JSON.stringify(metrics, null, 2));
  
  const screenshotPath = 'C:/Users/Admin/.gemini/antigravity/brain/26d5c7f6-01a9-45c4-9f12-9d045293059f/scratch_live_mobile.png';
  await page.screenshot({ path: screenshotPath });
  console.log('Screenshot saved to', screenshotPath);
  
  await browser.close();
})();
