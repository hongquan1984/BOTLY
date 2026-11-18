import { chromium } from "file:///d:/botly/App/word3d/node_modules/playwright-core/index.mjs";

async function main() {
  const browser = await chromium.launch({
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true,
    args: ["--no-sandbox", "--disable-web-security"],
  });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 800, height: 600 });
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERR:', err.message));
  
  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/DRACOLoader.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js"></script>
    <style>body { margin: 0; background: #667788; overflow: hidden; }</style>
  </head>
  <body>
    <script>
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
      camera.position.set(0, 1.2, 3.5);
      
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setClearColor(0x667788);
      document.body.appendChild(renderer.domElement);
      
      const ambLight = new THREE.AmbientLight(0xffffff, 2.0);
      scene.add(ambLight);
      const dirLight = new THREE.DirectionalLight(0xffffff, 2.0);
      dirLight.position.set(5, 10, 7);
      scene.add(dirLight);
      
      const dracoLoader = new THREE.DRACOLoader();
      dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.4.3/');
      
      const loader = new THREE.GLTFLoader();
      loader.setDRACOLoader(dracoLoader);
      
      loader.load('http://localhost:5174/assets/characters/cute_character.glb', (gltf) => {
        console.log('Loaded gltf successfully!');
        const m = gltf.scene;
        
        const box = new THREE.Box3().setFromObject(m);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        console.log('Box size:', JSON.stringify(size), 'Center:', JSON.stringify(center));
        
        m.position.sub(center); // center it
        m.position.y += size.y / 2; // place on ground
        scene.add(m);
        
        const mixer = new THREE.AnimationMixer(m);
        const clip = THREE.AnimationClip.findByName(gltf.animations, 'idle');
        if (clip) {
          mixer.clipAction(clip).play();
          console.log('Playing clip:', clip.name);
        }
        window.mixer = mixer;
        window.ready = true;
      }, undefined, (err) => {
        console.error('Load error:', err);
      });
      
      const clock = new THREE.Clock();
      function animate() {
        requestAnimationFrame(animate);
        const delta = clock.getDelta();
        if (window.mixer) window.mixer.update(delta);
        renderer.render(scene, camera);
      }
      animate();
    </script>
  </body>
  </html>
  `;
  
  await page.setContent(html);
  await new Promise(r => setTimeout(r, 4500));
  await page.screenshot({ path: 'C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/test_cute_character_draco.png' });
  console.log('Saved test_cute_character_draco.png');
  await browser.close();
}

main();
