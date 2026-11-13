import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

const baseDir = 'D:/botly/App/prototypes/wellness-home';

// 1. Update index.html: Add Day/Night toggle button in header
let html = readFileSync(path.join(baseDir, 'index.html'), 'utf8');

const targetHeaderNav = `<div class="room-switcher-nav">
        <button id="btn-scene-living" class="room-nav-btn active" onclick="switchScene('scene_interior_wide')" title="Chuyển sang Phòng Khách Góc Rộng">
          <span>🏔️</span> Phòng Khách
        </button>
        <button id="btn-scene-bedroom" class="room-nav-btn" onclick="switchScene('scene_bedroom')" title="Chuyển sang Phòng Ngủ Tĩnh Dưỡng (Chỉ có giường)">
          <span>🛏️</span> Phòng Ngủ
        </button>
      </div>`;

const newHeaderNav = `<div class="room-switcher-nav">
        <button id="btn-scene-living" class="room-nav-btn active" onclick="switchScene('scene_interior_wide')" title="Chuyển sang Phòng Khách Góc Rộng">
          <span>🏔️</span> Phòng Khách
        </button>
        <button id="btn-scene-bedroom" class="room-nav-btn" onclick="switchScene('scene_bedroom')" title="Chuyển sang Phòng Ngủ Tĩnh Dưỡng (Chỉ có giường)">
          <span>🛏️</span> Phòng Ngủ
        </button>
      </div>
      <button id="btn-toggle-day-night" class="btn-day-night" onclick="toggleDayNightMode()" title="Chuyển đổi Ban Ngày (Nắng ấm) / Ban Đêm (Trăng sao dãy Alps)">
        <span id="day-night-icon">🌙</span> <span id="day-night-label">Ban Đêm</span>
      </button>`;

if (html.includes(targetHeaderNav) && !html.includes('id="btn-toggle-day-night"')) {
  html = html.replace(targetHeaderNav, newHeaderNav);
  writeFileSync(path.join(baseDir, 'index.html'), html, 'utf8');
  console.log('Added btn-toggle-day-night to index.html.');
}

// 2. Update style.css: Add styling for .btn-day-night
let css = readFileSync(path.join(baseDir, 'style.css'), 'utf8');

if (!css.includes('.btn-day-night')) {
  const dayNightCss = `
/* ========================================================
   Day / Night Toggle Button
======================================================== */
.btn-day-night {
  display: inline-flex !important;
  align-items: center !important;
  gap: 5px !important;
  background: rgba(30, 41, 59, 0.85) !important;
  color: #fbbf24 !important;
  border: 1px solid rgba(251, 191, 36, 0.35) !important;
  border-radius: 6px !important;
  padding: 0 10px !important;
  height: 32px !important;
  font-size: 0.74rem !important;
  font-weight: 700 !important;
  cursor: pointer !important;
  white-space: nowrap !important;
  flex-shrink: 0 !important;
  transition: all 0.2s ease !important;
}

.btn-day-night:hover {
  background: rgba(45, 55, 72, 0.95) !important;
  border-color: #fbbf24 !important;
  box-shadow: 0 0 12px rgba(251, 191, 36, 0.4) !important;
  transform: translateY(-1px);
}

.btn-day-night.is-night {
  background: linear-gradient(135deg, #1e1b4b, #312e81) !important;
  border-color: #818cf8 !important;
  color: #c7d2fe !important;
  box-shadow: 0 0 12px rgba(129, 140, 248, 0.4) !important;
}
`;
  css += dayNightCss;
  writeFileSync(path.join(baseDir, 'style.css'), css, 'utf8');
  console.log('Added .btn-day-night styling to style.css.');
}

// 3. Update app.js: Add day/night mode logic
let appJs = readFileSync(path.join(baseDir, 'app.js'), 'utf8');

if (!appJs.includes('let currentDayNight =')) {
  const dayNightLogic = `
// ========================================================
// Day / Night Seamless Mode Switcher (100% Geometry Match)
// ========================================================
let currentDayNight = 'day'; // 'day' or 'night'

function toggleDayNightMode() {
  currentDayNight = currentDayNight === 'day' ? 'night' : 'day';
  applyDayNightBackground();
  saveState();
  if (currentDayNight === 'night') {
    showToast('🌙 Đã chuyển sang Ban Đêm: Ngắm trăng sao dãy Alps & ánh đèn ấm cúng! (Vị trí đồ đạc giữ nguyên 100%)');
  } else {
    showToast('☀️ Đã chuyển sang Ban Ngày: Đón nắng mai rực rỡ dãy Alps! (Vị trí đồ đạc giữ nguyên 100%)');
  }
}

function applyDayNightBackground() {
  const btn = document.getElementById('btn-toggle-day-night');
  const icon = document.getElementById('day-night-icon');
  const label = document.getElementById('day-night-label');

  if (btn) btn.classList.toggle('is-night', currentDayNight === 'night');
  if (icon) icon.textContent = currentDayNight === 'night' ? '☀️' : '🌙';
  if (label) label.textContent = currentDayNight === 'night' ? 'Ban Ngày' : 'Ban Đêm';

  applySceneBackgrounds();
}
`;
  appJs += dayNightLogic;
  console.log('Added day/night logic to app.js.');
}

// Update applySceneBackgrounds in app.js to use night variant if currentDayNight === 'night'
const oldApplyBg = `function applySceneBackgrounds() {
  if (!inventoryState.custom_backgrounds) return;
  ['scene_overview', 'scene_garden', 'scene_interior', 'scene_interior_wide', 'scene_bedroom'].forEach(sId => {
    const customBg = inventoryState.custom_backgrounds[sId];
    const layer = document.getElementById(\`layer-\${sId}\`);
    if (layer) {
      const baseImg = layer.querySelector('.scene-img.base-layer');
      if (baseImg) {
        if (customBg) {
          baseImg.src = customBg;
        } else {
          baseImg.src = \`assets/scenes/\${sId}.webp\`;
        }
      }
    }
  });
}`;

const newApplyBg = `function applySceneBackgrounds() {
  const scenesList = ['scene_overview', 'scene_garden', 'scene_interior', 'scene_interior_wide', 'scene_bedroom'];
  scenesList.forEach(sId => {
    const customBg = inventoryState?.custom_backgrounds?.[sId];
    const layer = document.getElementById(\`layer-\${sId}\`);
    if (layer) {
      const baseImg = layer.querySelector('.scene-img.base-layer');
      if (baseImg) {
        if (customBg) {
          baseImg.src = customBg;
        } else {
          if (currentDayNight === 'night' && (sId === 'scene_interior_wide' || sId === 'scene_bedroom')) {
            baseImg.src = \`assets/scenes/\${sId}_night.webp\`;
          } else {
            baseImg.src = \`assets/scenes/\${sId}.webp\`;
          }
        }
      }
    }
  });
}`;

if (appJs.includes(oldApplyBg)) {
  appJs = appJs.replace(oldApplyBg, newApplyBg);
  console.log('Updated applySceneBackgrounds to support day/night switching.');
}

// In saveState: save day_night mode
appJs = appJs.replace(
  `inventoryState.active_scene = currentSceneId;`,
  `inventoryState.active_scene = currentSceneId;\n  inventoryState.day_night = currentDayNight;`
);

// In loadPlayerState: restore day_night mode
appJs = appJs.replace(
  `if (inventoryState.active_scene) {\n    currentSceneId = inventoryState.active_scene;\n  }`,
  `if (inventoryState.active_scene) {\n    currentSceneId = inventoryState.active_scene;\n  }\n\n  if (inventoryState.day_night) {\n    currentDayNight = inventoryState.day_night;\n  }\n  applyDayNightBackground();`
);

writeFileSync(path.join(baseDir, 'app.js'), appJs, 'utf8');
console.log('Day/Night integration completed successfully!');
