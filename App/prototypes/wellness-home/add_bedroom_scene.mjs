import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

const baseDir = 'D:/botly/App/prototypes/wellness-home';

// 1. Update index.html
let html = readFileSync(path.join(baseDir, 'index.html'), 'utf8');

// Replace room-title-badge with room-switcher-nav
const oldBadge = `<div class="room-title-badge">
        <span class="room-icon">🏔️</span>
        <span class="room-name">Phòng Khách Góc Rộng</span>
      </div>`;

const newSwitcherNav = `<div class="room-switcher-nav">
        <button id="btn-scene-living" class="room-nav-btn active" onclick="switchScene('scene_interior_wide')" title="Chuyển sang Phòng Khách Góc Rộng">
          <span>🏔️</span> Phòng Khách
        </button>
        <button id="btn-scene-bedroom" class="room-nav-btn" onclick="switchScene('scene_bedroom')" title="Chuyển sang Phòng Ngủ Tĩnh Dưỡng (Chỉ có giường)">
          <span>🛏️</span> Phòng Ngủ
        </button>
      </div>`;

if (html.includes(oldBadge)) {
  html = html.replace(oldBadge, newSwitcherNav);
  console.log('Replaced room-title-badge with room-switcher-nav in index.html.');
}

// Add layer-scene_bedroom right after layer-scene_interior_wide
const targetLayer = `<div class="scene-layer active" id="layer-scene_interior_wide">
            <img src="assets/scenes/scene_interior_wide.webp" alt="Phòng khách góc siêu rộng nhìn ra hồ và núi" class="scene-img base-layer">
            <div id="slots-container-scene_interior_wide" class="slots-container"></div>
          </div>`;

const newBedroomLayer = `<div class="scene-layer active" id="layer-scene_interior_wide">
            <img src="assets/scenes/scene_interior_wide.webp" alt="Phòng khách góc siêu rộng nhìn ra hồ và núi" class="scene-img base-layer">
            <div id="slots-container-scene_interior_wide" class="slots-container"></div>
          </div>

          <!-- 5. Luxury Swiss Chalet Bedroom Layer (Chỉ có giường, không đồ thừa) -->
          <div class="scene-layer" id="layer-scene_bedroom">
            <img src="assets/scenes/scene_bedroom.webp" alt="Phòng ngủ Chalet Thụy Sĩ nhìn ra đỉnh núi tuyết" class="scene-img base-layer">
            <div id="slots-container-scene_bedroom" class="slots-container"></div>
          </div>`;

if (html.includes(targetLayer) && !html.includes('id="layer-scene_bedroom"')) {
  html = html.replace(targetLayer, newBedroomLayer);
  console.log('Added layer-scene_bedroom to index.html.');
}

writeFileSync(path.join(baseDir, 'index.html'), html, 'utf8');

// 2. Update style.css
let css = readFileSync(path.join(baseDir, 'style.css'), 'utf8');

if (!css.includes('.room-switcher-nav')) {
  const switcherCss = `
/* ========================================================
   Room Switcher (Phòng Khách / Phòng Ngủ)
======================================================== */
.room-switcher-nav {
  display: flex !important;
  align-items: center !important;
  background: rgba(15, 23, 42, 0.8) !important;
  border: 1px solid rgba(56, 189, 248, 0.3) !important;
  border-radius: 8px !important;
  padding: 2px !important;
  gap: 2px !important;
  flex-shrink: 0 !important;
}

.room-nav-btn {
  display: inline-flex !important;
  align-items: center !important;
  gap: 5px !important;
  background: transparent !important;
  color: #94a3b8 !important;
  border: none !important;
  border-radius: 6px !important;
  padding: 4px 10px !important;
  font-size: 0.76rem !important;
  font-weight: 700 !important;
  cursor: pointer !important;
  transition: all 0.18s ease !important;
  white-space: nowrap !important;
}

.room-nav-btn:hover {
  color: #ffffff !important;
  background: rgba(255, 255, 255, 0.08) !important;
}

.room-nav-btn.active {
  background: #0284c7 !important;
  color: #ffffff !important;
  box-shadow: 0 0 10px rgba(56, 189, 248, 0.5) !important;
}
`;
  css += switcherCss;
  writeFileSync(path.join(baseDir, 'style.css'), css, 'utf8');
  console.log('Added room-switcher-nav styling to style.css.');
}

// 3. Update app.js
let appJs = readFileSync(path.join(baseDir, 'app.js'), 'utf8');

// In switchScene, update active state on room-nav-btn
if (!appJs.includes('btn-scene-living')) {
  appJs = appJs.replace(
    `stageElem.className = \`scene-stage view-\${sceneId}\`;`,
    `stageElem.className = \`scene-stage view-\${sceneId}\`;\n\n  // Update top room-nav buttons\n  const btnLiving = document.getElementById('btn-scene-living');\n  const btnBed = document.getElementById('btn-scene-bedroom');\n  if (btnLiving) btnLiving.classList.toggle('active', sceneId === 'scene_interior_wide' || sceneId === 'scene_interior');\n  if (btnBed) btnBed.classList.toggle('active', sceneId === 'scene_bedroom');`
  );
  console.log('Updated switchScene in app.js for room-nav-btn.');
}

// In getSceneName
appJs = appJs.replace(
  `if (sId === 'scene_interior_wide') return 'Phòng khách góc rộng';`,
  `if (sId === 'scene_interior_wide') return 'Phòng khách góc rộng';\n  if (sId === 'scene_bedroom') return 'Phòng ngủ tĩnh dưỡng';`
);

// In applySceneBackgrounds
appJs = appJs.replace(
  `['scene_overview', 'scene_garden', 'scene_interior', 'scene_interior_wide'].forEach(sId => {`,
  `['scene_overview', 'scene_garden', 'scene_interior', 'scene_interior_wide', 'scene_bedroom'].forEach(sId => {`
);

writeFileSync(path.join(baseDir, 'app.js'), appJs, 'utf8');
console.log('Updated app.js with bedroom scene support.');
