import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';

const require = createRequire('d:/botly/App/3DHOME/package.json');
const { chromium } = require('playwright-core');

const browser = await chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
  args: [
    '--enable-webgl',
    '--ignore-gpu-blocklist',
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--no-sandbox',
    '--disk-cache-dir=D:/botly/.tmp_3dhome/cache',
  ],
});

const page = await browser.newPage();
page.setDefaultTimeout(90000);

console.log('Navigating to http://127.0.0.1:5173...');
await page.goto('http://127.0.0.1:5173', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => typeof window.__CONVERT_FBX__ === 'function', null, { timeout: 90000 });

console.log('Converter ready! Converting Japanese Maple...');

const mapleBytesArr = await page.evaluate(async () => {
  const buf = await window.__CONVERT_FBX__(
    '/assets/speedtree_source/Japanese Maple/HighPoly/Japanese_Maple.fbx',
    {
      leaf: {
        diffuse: '/assets/speedtree_source/Japanese Maple/HighPoly/Textures/T_JapaneseMapleLeaf_1_BaseColor.png',
        normal: '/assets/speedtree_source/Japanese Maple/HighPoly/Textures/T_JapaneseMapleLeaf_1_Normal.png',
      },
      bark: {
        diffuse: '/assets/speedtree_source/Japanese Maple/HighPoly/Textures/T_JapaneseMapleBark_BaseColor.png',
        normal: '/assets/speedtree_source/Japanese Maple/HighPoly/Textures/T_JapaneseMapleBark_Normal.png',
      },
      cap: {
        diffuse: '/assets/speedtree_source/Japanese Maple/HighPoly/Textures/T_Cap_02_BaseColor.png',
        normal: '/assets/speedtree_source/Japanese Maple/HighPoly/Textures/T_Cap_02_Normal.png',
      }
    },
    0.012
  );
  return Array.from(new Uint8Array(buf));
});

console.log('Japanese Maple converted, converting European Linden...');

const lindenBytesArr = await page.evaluate(async () => {
  const buf = await window.__CONVERT_FBX__(
    '/assets/speedtree_source/European Linden/HighPoly/European_Linden.fbx',
    {
      leaf: {
        diffuse: '/assets/speedtree_source/European Linden/HighPoly/Textures/T_EuropeanLindenLeaf_BaseColor.png',
        normal: '/assets/speedtree_source/European Linden/HighPoly/Textures/T_EuropeanLindenLeaf_Normal.png',
      },
      bark: {
        diffuse: '/assets/speedtree_source/European Linden/HighPoly/Textures/T_EuropeanLindenBark_BaseColor.png',
        normal: '/assets/speedtree_source/European Linden/HighPoly/Textures/T_EuropeanLindenBark_Normal.png',
      },
      cap: {
        diffuse: '/assets/speedtree_source/European Linden/HighPoly/Textures/T_Cap_03_BaseColor.png',
        normal: '/assets/speedtree_source/European Linden/HighPoly/Textures/T_Cap_03_Normal.png',
      }
    },
    0.012
  );
  return Array.from(new Uint8Array(buf));
});

await browser.close();

// Save GLBs
const outGlbDir1 = 'D:/botly/App/3DHOME/public/assets/glb';
const outGlbDir2 = 'D:/botly/App/3DHOME/dist/assets/glb';
fs.mkdirSync(outGlbDir1, { recursive: true });
fs.mkdirSync(outGlbDir2, { recursive: true });

const mapleBytes = Buffer.from(mapleBytesArr);
const lindenBytes = Buffer.from(lindenBytesArr);

fs.writeFileSync(path.join(outGlbDir1, 'speedtree_japanese_maple.glb'), mapleBytes);
fs.writeFileSync(path.join(outGlbDir2, 'speedtree_japanese_maple.glb'), mapleBytes);
console.log('Saved speedtree_japanese_maple.glb:', mapleBytes.length, 'bytes');

fs.writeFileSync(path.join(outGlbDir1, 'speedtree_european_linden.glb'), lindenBytes);
fs.writeFileSync(path.join(outGlbDir2, 'speedtree_european_linden.glb'), lindenBytes);
console.log('Saved speedtree_european_linden.glb:', lindenBytes.length, 'bytes');

console.log('SUCCESS: BOTH SPEEDTREE MODELS CONVERTED TO GLB!');
