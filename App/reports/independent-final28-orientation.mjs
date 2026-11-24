import fs from 'node:fs';
let code = fs.readFileSync('D:/botly/App/healthclues-mobile/scripts/qa_detective_bundle_round3.mjs', 'utf8');
code = code.replaceAll('mobile-detective-round3-', 'final28-orientation-');
const cut = code.indexOf('const earlyGate =');
code = code.slice(0, cut) + `
await page.screenshot({path:out+'/final28-fresh-portrait-scene.png'});
console.log('portrait', await page.evaluate(() => ({width:innerWidth,height:innerHeight, scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight})));
await page.setViewportSize({width:844,height:390}); await page.waitForTimeout(1000);
await page.screenshot({path:out+'/final28-fresh-landscape-scene.png'});
console.log('landscape', await page.evaluate(() => ({width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight,svg:[...document.querySelectorAll('svg')].map(e=>{let r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height}}).filter(r=>r.w===18&&r.h===18)})));
await browser.close();`;
await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
