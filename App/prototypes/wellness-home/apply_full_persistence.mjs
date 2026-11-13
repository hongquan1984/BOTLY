import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

const baseDir = 'D:/botly/App/prototypes/wellness-home';

// 1. Update index.html
let html = readFileSync(path.join(baseDir, 'index.html'), 'utf8');

if (!html.includes('id="btn-save-room-state"')) {
  html = html.replace(
    `<button id="btn-toggle-editor-mode"`,
    `<button id="btn-save-room-state" class="btn-save-room" onclick="saveAllRoomDesign()" title="Lưu toàn bộ thiết kế phòng (lần sau mở lại sẽ giữ nguyên 100% vị trí và chỉnh sửa)">\n          <span>💾</span> Lưu Phòng\n        </button>\n        <button id="btn-toggle-editor-mode"`
  );
  writeFileSync(path.join(baseDir, 'index.html'), html, 'utf8');
  console.log('Updated index.html with btn-save-room-state.');
}

// 2. Update style.css
let css = readFileSync(path.join(baseDir, 'style.css'), 'utf8');
if (!css.includes('.btn-save-room')) {
  const saveRoomCss = `
.btn-save-room {
  background: linear-gradient(135deg, #059669, #047857);
  border: 1px solid #10b981;
  color: #ffffff;
  font-weight: 700;
  border-radius: 8px;
  padding: 6px 14px;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
}

.btn-save-room:hover {
  background: #10b981;
  transform: translateY(-1px);
  box-shadow: 0 4px 14px rgba(16, 185, 129, 0.5);
}
`;
  css += saveRoomCss;
  writeFileSync(path.join(baseDir, 'style.css'), css, 'utf8');
  console.log('Updated style.css with btn-save-room styling.');
}

// 3. Update app.js
let appJs = readFileSync(path.join(baseDir, 'app.js'), 'utf8');

// Update saveState to save to both localStorage and /api/state
const oldSaveState = `function saveState() {
  inventoryState.last_updated = new Date().toISOString();
  localStorage.setItem(STORAGE_INVENTORY_KEY, JSON.stringify(inventoryState));
  renderSceneNavBadges();
  renderSummaryStats();
}`;

const newSaveState = `async function saveState() {
  if (!inventoryState) return;
  inventoryState.last_updated = new Date().toISOString();
  inventoryState.interior_layers = { ...interiorLayersState };
  inventoryState.active_scene = currentSceneId;

  // 1. Browser LocalStorage persistence
  try {
    localStorage.setItem(STORAGE_INVENTORY_KEY, JSON.stringify(inventoryState));
    localStorage.setItem(STORAGE_SCENE_KEY, currentSceneId);
  } catch (e) {
    console.warn('localStorage error:', e);
  }

  // 2. Server Disk Persistence via POST /api/state
  try {
    await fetch('/api/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(inventoryState)
    });
  } catch (err) {
    console.warn('Server state save warning:', err);
  }

  renderSceneNavBadges();
  renderSummaryStats();
}

async function saveAllRoomDesign() {
  await saveState();
  showToast('💾 Đã lưu toàn bộ thiết kế phòng thành công! Lần sau mở lại trang sẽ hiển thị chính xác 100% như đã chỉnh sửa.');
}`;

if (appJs.includes(oldSaveState)) {
  appJs = appJs.replace(oldSaveState, newSaveState);
  console.log('Updated saveState function in app.js.');
} else {
  console.warn('Could not find oldSaveState exact match.');
}

// Update loadPlayerState to load from /api/state first, fallback to localStorage
const oldLoadPlayerStatePattern = /\/\/ Load player inventory & slot state\s*function loadPlayerState\(\) \{[\s\S]*?initDefaultInventoryState\(\);\s*\}/;

const newLoadPlayerState = `// Load player inventory & slot state (Dual persistence: Server Disk + localStorage)
async function loadPlayerState() {
  let loaded = false;

  // 1. First attempt: fetch persistent state from Server Disk
  try {
    const res = await fetch('/api/state');
    if (res.ok) {
      const data = await res.json();
      if (data && (data.inventory || data.custom_items)) {
        inventoryState = data;
        loaded = true;
      }
    }
  } catch (err) {
    console.warn('Could not load state from server, checking localStorage:', err);
  }

  // 2. Second attempt: localStorage
  if (!loaded) {
    const saved = localStorage.getItem(STORAGE_INVENTORY_KEY);
    if (saved) {
      try {
        inventoryState = JSON.parse(saved);
        loaded = true;
      } catch (_) {}
    }
  }

  if (!loaded) {
    initDefaultInventoryState();
  }

  if (!inventoryState.custom_items) {
    inventoryState.custom_items = [];
  }

  // Clean up interior slots so old placeholder items don't collide with luxury layers
  ['slot_interior_01', 'slot_interior_02', 'slot_interior_03', 'slot_interior_04', 'slot_interior_05'].forEach(sId => {
    if (inventoryState.slots && inventoryState.slots[sId]) {
      const itId = inventoryState.slots[sId];
      if (inventoryState.inventory && inventoryState.inventory[itId]) {
        inventoryState.inventory[itId].displayed = false;
        inventoryState.inventory[itId].active_slot = null;
      }
      inventoryState.slots[sId] = null;
    }
  });

  // Restore interior luxury layers
  if (inventoryState.interior_layers) {
    Object.assign(interiorLayersState, inventoryState.interior_layers);
  }

  // Restore active scene
  const savedScene = localStorage.getItem(STORAGE_SCENE_KEY) || inventoryState.active_scene;
  if (savedScene) {
    currentSceneId = savedScene;
  }
}`;

if (oldLoadPlayerStatePattern.test(appJs)) {
  appJs = appJs.replace(oldLoadPlayerStatePattern, newLoadPlayerState);
  console.log('Updated loadPlayerState function in app.js.');
} else {
  console.warn('Could not match oldLoadPlayerStatePattern.');
}

// Update DOMContentLoaded to await loadPlayerState
appJs = appJs.replace(
  `document.addEventListener('DOMContentLoaded', async () => {\n  await loadManifests();\n  loadPlayerState();`,
  `document.addEventListener('DOMContentLoaded', async () => {\n  await loadManifests();\n  await loadPlayerState();`
);

// Update saveSelectedPerspective toast and behavior
appJs = appJs.replace(
  `function saveSelectedPerspective() {\n  const item = (inventoryState.custom_items || []).find(it => it.id === selectedCustomItemId);\n  if (!item) return;\n\n  saveState();`,
  `async function saveSelectedPerspective() {\n  const item = (inventoryState.custom_items || []).find(it => it.id === selectedCustomItemId);\n  if (!item) return;\n\n  await saveState();`
);

appJs = appJs.replace(
  `showToast(\`💾 Đã lưu cấu hình phối cảnh cho "\${item.name}"!\`);`,
  `showToast(\`💾 Đã lưu vị trí và cấu hình cho "\${item.name}"! Lần sau mở trang sẽ giữ nguyên 100%.\`);`
);

// Update toggleInteriorLayer to call saveState
appJs = appJs.replace(
  `showToast(\`\${isNowOn ? '✨ Đã hiện' : '👁️ Đã ẩn'}: \${names[layerKey] || layerKey}\`);\n}`,
  `showToast(\`\${isNowOn ? '✨ Đã hiện' : '👁️ Đã ẩn'}: \${names[layerKey] || layerKey}\`);\n  saveState();\n}`
);

// Update toggleAllInteriorLayers to call saveState
appJs = appJs.replace(
  `showToast(targetState ? '🛋️ Đã hiện trọn bộ 5 lớp nội thất Luxury' : '👁️ Đã ẩn tất cả 5 lớp (Phòng khách trống nguyên bản)');\n}`,
  `showToast(targetState ? '🛋️ Đã hiện trọn bộ 5 lớp nội thất Luxury' : '👁️ Đã ẩn tất cả 5 lớp (Phòng khách trống nguyên bản)');\n  saveState();\n}`
);

// Update renderCustomItems scene filtering to support both interior scene IDs
appJs = appJs.replace(
  `const sceneItems = inventoryState.custom_items.filter(it => it.scene_id === currentSceneId && it.displayed !== false && it.visible !== false);`,
  `const sceneItems = inventoryState.custom_items.filter(it => {
    if (it.displayed === false || it.visible === false) return false;
    if (it.scene_id === currentSceneId) return true;
    if ((currentSceneId === 'scene_interior_wide' || currentSceneId === 'scene_interior') &&
        (it.scene_id === 'scene_interior_wide' || it.scene_id === 'scene_interior' || it.scene_id === 'interior')) {
      return true;
    }
    return false;
  });`
);

writeFileSync(path.join(baseDir, 'app.js'), appJs, 'utf8');
console.log('Full persistence update applied successfully to app.js!');
