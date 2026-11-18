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
  <!DOCTYPE html>
  <html>
  <head>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js"></script>
    <style>body { margin: 0; background: #222; overflow: hidden; }</style>
  </head>
  <body>
    <script>
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
      camera.position.set(0, 1.2, 3.2);
      
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setClearColor(0x334455);
      document.body.appendChild(renderer.domElement);
      
      const ambLight = new THREE.AmbientLight(0xffffff, 1.2);
      scene.add(ambLight);
      const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
      dirLight.position.set(5, 10, 7);
      scene.add(dirLight);
      
      const loader = new THREE.GLTFLoader();
      
      // Load Knight
      loader.load('http://localhost:5174/assets/characters/KnightCharacter.glb', (gltf) => {
        const m = gltf.scene;
        m.position.set(-0.8, 0, 0);
        m.scale.set(0.7, 0.7, 0.7);
        scene.add(m);
        
        const mixer = new THREE.AnimationMixer(m);
        const clip = THREE.AnimationClip.findByName(gltf.animations, 'HumanArmature|Idle');
        if (clip) mixer.clipAction(clip).play();
        window.mixerKnight = mixer;
      });
      
      // Load Soldier
      loader.load('http://localhost:5174/assets/characters/Soldier.glb', (gltf) => {
        const m = gltf.scene;
        m.position.set(0.8, 0, 0);
        m.scale.set(0.7, 0.7, 0.7);
        scene.add(m);
        
        const mixer = new THREE.AnimationMixer(m);
        const clip = THREE.AnimationClip.findByName(gltf.animations, 'Idle');
        if (clip) mixer.clipAction(clip).play();
        window.mixerSoldier = mixer;
      });
      
      const clock = new THREE.Clock();
      function animate() {
        requestAnimationFrame(animate);
        const delta = clock.getDelta();
        if (window.mixerKnight) window.mixerKnight.update(delta);
        if (window.mixerSoldier) window.mixerSoldier.update(delta);
        renderer.render(scene, camera);
      }
      animate();
    </script>
  </body>
  </html>
  `;
  
  await page.setContent(html);
  await new Promise(r => setTimeout(r, 4000));
  await page.screenshot({ path: 'C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/compare_knight_soldier.png' });
  console.log('compare_knight_soldier.png saved!');
  await browser.close();
}

main();
