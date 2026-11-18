import { chromium } from "file:///d:/botly/App/word3d/node_modules/playwright-core/index.mjs";

async function main() {
  const browser = await chromium.launch({
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true,
    args: ["--no-sandbox", "--disable-web-security"],
  });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1000, height: 600 });
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERR:', err.message));
  
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
      camera.position.set(0, 1.2, 3.5);
      
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
      
      loader.load('http://localhost:5174/assets/characters/Soldier.glb', (soldierGltf) => {
        function cleanClip(clip) {
          const newTracks = [];
          for (const track of clip.tracks) {
            if (track.name.endsWith('.position')) {
              if (track.name.toLowerCase().includes('hips')) {
                newTracks.push(track);
              }
            } else if (track.name.endsWith('.quaternion')) {
              newTracks.push(track);
            }
          }
          return new THREE.AnimationClip(clip.name, clip.duration, newTracks);
        }
        
        const cleanWalk = cleanClip(soldierGltf.animations.find(a => a.name === 'Walk'));
        
        // Left: Peasant_Girl
        loader.load('http://localhost:5174/assets/characters/Peasant_Girl.glb', (gltf) => {
          const m = gltf.scene;
          m.position.set(-1.0, 0, 0);
          m.scale.set(0.65, 0.65, 0.65);
          scene.add(m);
          
          const mixer = new THREE.AnimationMixer(m);
          mixer.clipAction(cleanWalk).play();
          window.mixer1 = mixer;
        });
        
        // Right: Michelle
        loader.load('http://localhost:5174/assets/characters/Michelle.glb', (gltf) => {
          const m = gltf.scene;
          m.position.set(1.0, 0, 0);
          m.scale.set(0.75, 0.75, 0.75);
          scene.add(m);
          
          const mixer = new THREE.AnimationMixer(m);
          mixer.clipAction(cleanWalk).play();
          window.mixer2 = mixer;
        });
        
        // Center: Soldier
        const soldier = soldierGltf.scene;
        soldier.position.set(0, 0, 0);
        soldier.scale.set(0.7, 0.7, 0.7);
        scene.add(soldier);
        const mixer3 = new THREE.AnimationMixer(soldier);
        mixer3.clipAction(cleanWalk).play();
        window.mixer3 = mixer3;
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
  await page.screenshot({ path: 'C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/compare_mixamo_walk_fixed.png' });
  console.log('Saved compare_mixamo_walk_fixed.png');
  await browser.close();
}

main();
