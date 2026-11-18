import { chromium } from "file:///d:/botly/App/word3d/node_modules/playwright-core/index.mjs";

async function main() {
  const browser = await chromium.launch({
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true,
    args: ["--no-sandbox", "--disable-web-security"],
  });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1000, height: 600 });
  
  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js"></script>
    <style>body { margin: 0; background: #2b3a4a; overflow: hidden; }</style>
  </head>
  <body>
    <script>
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
      camera.position.set(0, 1.1, 3.2);
      
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setClearColor(0x2b3a4a);
      document.body.appendChild(renderer.domElement);
      
      const ambLight = new THREE.AmbientLight(0xffffff, 1.5);
      scene.add(ambLight);
      const dirLight = new THREE.DirectionalLight(0xffffff, 1.8);
      dirLight.position.set(5, 10, 7);
      scene.add(dirLight);
      
      const loader = new THREE.GLTFLoader();
      
      loader.load('http://localhost:5174/assets/characters/Platformer_Character.glb', (sourceGltf) => {
        // Pure rotation retargeting - NO position override
        function retargetClip(clip) {
          const newTracks = clip.tracks.filter(t => t.name.endsWith('.quaternion'));
          return new THREE.AnimationClip(clip.name, clip.duration, newTracks);
        }
        
        const rawIdle = sourceGltf.animations.find(a => a.name === 'CharacterArmature|Idle');
        const rawWalk = sourceGltf.animations.find(a => a.name === 'CharacterArmature|Walk');
        
        const retargetedIdle = retargetClip(rawIdle);
        const retargetedWalk = retargetClip(rawWalk);
        
        // Left: Adventurer Man Walk
        loader.load('http://localhost:5174/assets/characters/modular_men_Adventurer.glb', (gltf) => {
          const m = gltf.scene;
          m.position.set(-0.9, 0, 0);
          m.scale.set(0.75, 0.75, 0.75);
          scene.add(m);
          
          const mixer = new THREE.AnimationMixer(m);
          mixer.clipAction(retargetedWalk).play();
          window.mixer1 = mixer;
        });
        
        // Center: Casual Guy Idle
        loader.load('http://localhost:5174/assets/characters/modular_men_Casual.glb', (gltf) => {
          const m = gltf.scene;
          m.position.set(0, 0, 0);
          m.scale.set(0.75, 0.75, 0.75);
          scene.add(m);
          
          const mixer = new THREE.AnimationMixer(m);
          mixer.clipAction(retargetedIdle).play();
          window.mixer2 = mixer;
        });
        
        // Right: Casual Guy Walk
        loader.load('http://localhost:5174/assets/characters/modular_men_Casual.glb', (gltf) => {
          const m = gltf.scene;
          m.position.set(0.9, 0, 0);
          m.scale.set(0.75, 0.75, 0.75);
          scene.add(m);
          
          const mixer = new THREE.AnimationMixer(m);
          mixer.clipAction(retargetedWalk).play();
          window.mixer3 = mixer;
        });
      });
      
      const clock = new THREE.Clock();
      function animate() {
        requestAnimationFrame(animate);
        const delta = clock.getDelta();
        if (window.mixer1) window.mixer1.update(delta);
        if (window.mixer2) window.mixer2.update(delta);
        if (window.mixer3) window.mixer3.update(delta);
        renderer.render(scene, camera);
      }
      animate();
    </script>
  </body>
  </html>
  `;
  
  await page.setContent(html);
  await new Promise(r => setTimeout(r, 4000));
  await page.screenshot({ path: 'C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/test_humans_quaternion_only.png' });
  console.log('Saved test_humans_quaternion_only.png');
  await browser.close();
}

main();
