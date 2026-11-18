import { chromium } from "file:///D:/botly/App/word3d/node_modules/playwright-core/index.mjs";
import path from "path";

const ARTIFACT_DIR = "C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb";

async function testRender() {
  const browser = await chromium.launch({
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true,
  });
  const page = await browser.newPage({ viewport: { width: 800, height: 800 } });
  page.on("console", (m) => console.log("PAGE CONSOLE:", m.text()));
  page.on("pageerror", (e) => console.log("PAGE ERROR:", e));

  // Load a simple page that renders lumi_model.bin with Three.js
  await page.setContent(`
    <!DOCTYPE html>
    <html>
    <head>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
      <style>body { margin: 0; background: #222; overflow: hidden; }</style>
    </head>
    <body>
    <script>
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
      camera.position.set(0, 0, 2.5);
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(800, 800);
      document.body.appendChild(renderer.domElement);

      fetch('http://localhost:5173/assets/models/lumi_model.bin')
        .then(r => r.arrayBuffer())
        .then(buffer => {
          const dv = new DataView(buffer);
          const count = dv.getUint32(0, true);
          const pos = new Float32Array(buffer, 4, count * 3);
          const col = new Uint8Array(buffer, 4 + count * 12, count * 3);

          const geo = new THREE.BufferGeometry();
          geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
          geo.setAttribute('color', new THREE.BufferAttribute(col, 3, true));

          // Test 1: Standard PointsMaterial
          const mat = new THREE.PointsMaterial({
            size: 0.012,
            vertexColors: true,
            sizeAttenuation: true
          });

          const points = new THREE.Points(geo, mat);
          scene.add(points);

          renderer.render(scene, camera);
          window.__RENDERED__ = true;
        })
        .catch(err => {
          window.__ERROR__ = err.message;
        });
    </script>
    </body>
    </html>
  `);

  await page.waitForFunction(() => window.__RENDERED__ || window.__ERROR__, { timeout: 10000 });
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "test_points_material.png") });
  console.log("Screenshot saved: test_points_material.png");
  await browser.close();
}

testRender();
