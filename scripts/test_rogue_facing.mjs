import { chromium } from "file:///d:/botly/App/word3d/node_modules/playwright-core/index.mjs";

async function main() {
  const browser = await chromium.launch({
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true,
    args: ["--no-sandbox", "--disable-web-security"],
  });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 800, height: 600 });
  
  const html = `
  <!DOCTYPE html><html><head>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js"></script>
  <style>body { margin: 0; background: #222; overflow: hidden; }</style>
  </head><body><script>
    const scene = new THREE.Scene();
    // Look from +X side: camera at (3, 1.2, 0), looking at (0, 1.2, 0)
    // Left of screen is -Z, Right of screen is +Z!
    const camera = new THREE.PerspectiveCamera(45, 800 / 600, 0.1, 100);
    camera.position.set(3, 1.2, 0);
    camera.lookAt(0, 1.2, 0);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(800, 600);
    document.body.appendChild(renderer.domElement);
    scene.add(new THREE.AmbientLight(0xffffff, 2.0));
    
    // Add arrow helper: arrow pointing in +Z direction (cyan)
    const arrow = new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 1, 0), 1, 0x00ffff);
    scene.add(arrow);
    
    new THREE.GLTFLoader().load('http://localhost:5174/assets/characters/Rogue.glb', (gltf) => {
      const m = gltf.scene;
      m.traverse(c => {
        if (c.name.includes('Knife') || c.name.includes('Crossbow') || c.name.includes('Throwable')) c.visible = false;
      });
      scene.add(m);
      renderer.render(scene, camera);
      window.ready = true;
    });
  </script></body></html>
  `;
  await page.setContent(html);
  await new Promise(r => setTimeout(r, 2500));
  await page.screenshot({ path: 'C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/test_rogue_facing.png' });
  await browser.close();
  console.log('Saved test_rogue_facing.png');
}

main();
