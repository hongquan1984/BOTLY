import { chromium } from "file:///D:/botly/App/word3d/node_modules/playwright-core/index.mjs";
import fs from "fs";
import path from "path";

const ARTIFACT_DIR = "C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb";

async function testRender() {
  const buf = fs.readFileSync("d:/botly/App/word3d/public/assets/models/lumi_model.bin");
  const dv = new DataView(buf.buffer, buf.byteOffset);
  const count = dv.getUint32(0, true);

  const posArr = new Float32Array(count * 3);
  const colArr = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    posArr[i * 3] = dv.getFloat32(4 + i * 12, true);
    posArr[i * 3 + 1] = dv.getFloat32(4 + i * 12 + 4, true);
    posArr[i * 3 + 2] = dv.getFloat32(4 + i * 12 + 8, true);

    colArr[i * 3] = buf[4 + count * 12 + i * 3] / 255.0;
    colArr[i * 3 + 1] = buf[4 + count * 12 + i * 3 + 1] / 255.0;
    colArr[i * 3 + 2] = buf[4 + count * 12 + i * 3 + 2] / 255.0;
  }

  const browser = await chromium.launch({
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true,
  });
  const page = await browser.newPage({ viewport: { width: 600, height: 600 } });

  await page.setContent(`
    <!DOCTYPE html>
    <html>
    <head>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
      <style>body { margin: 0; background: #1a2e22; overflow: hidden; }</style>
    </head>
    <body>
    <script>
      window.initScene = function(posData, colData) {
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
        camera.position.set(0, 0, 1.8);
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(600, 600);
        document.body.appendChild(renderer.domElement);

        // Soft circle texture
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
        grad.addColorStop(0, 'rgba(255,255,255,1)');
        grad.addColorStop(0.7, 'rgba(255,255,255,0.9)');
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(16, 16, 16, 0, Math.PI * 2);
        ctx.fill();
        const texture = new THREE.CanvasTexture(canvas);

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(posData), 3));
        geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(colData), 3));

        const mat = new THREE.PointsMaterial({
          size: 0.010,
          map: texture,
          transparent: true,
          alphaTest: 0.05,
          vertexColors: true,
          sizeAttenuation: true,
        });

        const points = new THREE.Points(geo, mat);
        scene.add(points);

        renderer.render(scene, camera);
        return true;
      };
    </script>
    </body>
    </html>
  `);

  await page.waitForTimeout(1000);
  await page.evaluate(({ posArr, colArr }) => {
    window.initScene(posArr, colArr);
  }, { posArr: Array.from(posArr), colArr: Array.from(colArr) });

  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "test_three_points_success.png") });
  console.log("Screenshot saved: test_three_points_success.png");
  await browser.close();
}

testRender();
