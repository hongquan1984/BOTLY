import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

const baseDir = 'D:/botly/App/prototypes/wellness-home';

// 1. Update index.html
let html = readFileSync(path.join(baseDir, 'index.html'), 'utf8');

// Replace room-title-badge and header buttons with clean, non-wrapping versions
const oldHeaderRight = `<div class="room-title-badge">
        <span class="room-icon">🌟</span>
        <div class="room-info">
          <span class="room-name">Phòng Khách Góc Rộng (Wide Panoramic)</span>
          <span class="room-sub">Sàn gỗ sồi Thụy Sĩ • Tự do tải & bài trí đồ nội thất</span>
        </div>
      </div>

      <!-- Header Tools & Sandbox Actions -->
      <div class="header-right">
        <!-- Mode Switch: Admin Editor vs Player Experience -->
        <button id="btn-save-room-state" class="btn-save-room" onclick="saveAllRoomDesign()" title="Lưu toàn bộ thiết kế phòng (lần sau mở lại sẽ giữ nguyên 100% vị trí và chỉnh sửa)">
          <span>💾</span> Lưu Phòng
        </button>
        <button id="btn-toggle-editor-mode" class="btn-mode-toggle active-admin" onclick="toggleEditorMode()" title="Chuyển đổi giữa chế độ Admin chỉnh sửa và Người chơi trải nghiệm">
          <span>🛠️</span> <span id="label-editor-mode">Admin Editor</span>
        </button>
        <button id="btn-add-painting" class="btn-reset-bg" onclick="addSamplePainting()" title="Thêm bức tranh Dãy Alps để thử nghiệm biến dạng phối cảnh độc lập 4 góc">
          <span>🖼️</span> + Tranh Dãy Alps
        </button>
        <button id="btn-upload-furniture" class="btn-upload-furniture" onclick="document.getElementById('input-upload-furniture').click()" title="Tải ảnh đồ nội thất (PNG trong suốt hoặc JPG) từ máy tính">
          <span>📤</span> Tải Ảnh Lên
        </button>
        <button id="btn-upload-bg" class="btn-upload-bg" onclick="document.getElementById('input-upload-bg').click()" title="Đổi ảnh nền của phòng">
          <span>🖼️</span> Đổi Nền
        </button>
        <button id="btn-reset-bg" class="btn-reset-bg" onclick="resetCurrentSceneBackground()" title="Khôi phục ảnh phòng khách góc rộng gốc Thụy Sĩ">
          <span>↺</span> Nền gốc
        </button>
        <button id="btn-clear-furniture" class="btn-reset-bg" onclick="clearAllCustomFurniture()" title="Dọn sạch toàn bộ đồ nội thất trong phòng">
          <span>🧹</span> Dọn sạch
        </button>
      </div>`;

const newHeaderRight = `<div class="room-title-badge">
        <span class="room-icon">🏔️</span>
        <span class="room-name">Phòng Khách Góc Rộng</span>
      </div>

      <!-- Header Tools & Sandbox Actions -->
      <div class="header-right">
        <button id="btn-save-room-state" class="btn-save-room" onclick="saveAllRoomDesign()" title="Lưu toàn bộ vị trí & thiết kế phòng (lần sau mở lại giữ nguyên 100%)">
          <span>💾</span> Lưu Phòng
        </button>
        <button id="btn-toggle-editor-mode" class="btn-mode-toggle active-admin" onclick="toggleEditorMode()" title="Chuyển đổi chế độ Admin / Người chơi">
          <span>🛠️</span> <span id="label-editor-mode">Admin Editor</span>
        </button>
        <button id="btn-add-painting" class="btn-hdr-action" onclick="addSamplePainting()" title="Thêm bức tranh Dãy Alps để nắn góc phối cảnh">
          <span>🖼️</span> + Tranh Alps
        </button>
        <button id="btn-upload-furniture" class="btn-upload-furniture" onclick="document.getElementById('input-upload-furniture').click()" title="Tải ảnh đồ nội thất PNG / JPG từ máy">
          <span>📤</span> Tải Ảnh
        </button>
        <button id="btn-upload-bg" class="btn-hdr-action" onclick="document.getElementById('input-upload-bg').click()" title="Đổi ảnh nền phòng">
          <span>🖼️</span> Đổi Nền
        </button>
        <button id="btn-reset-bg" class="btn-hdr-action" onclick="resetCurrentSceneBackground()" title="Khôi phục ảnh nền gốc Thụy Sĩ">
          <span>↺</span> Nền gốc
        </button>
        <button id="btn-clear-furniture" class="btn-hdr-action btn-danger-action" onclick="clearAllCustomFurniture()" title="Dọn sạch toàn bộ đồ nội thất">
          <span>🧹</span> Dọn sạch
        </button>
        <button id="btn-toggle-drawer" class="btn-hdr-action" onclick="toggleDecorDrawer()" title="Ẩn / Hiện ngăn kéo đồ đạc bên phải">
          <span id="icon-toggle-drawer">🎁</span> <span id="label-toggle-drawer">Đồ Đạc</span>
        </button>
      </div>`;

if (html.includes('<div class="room-title-badge">')) {
  html = html.replace(/<div class="room-title-badge">[\s\S]*?<\/div>\s*<\/div>/, newHeaderRight);
  writeFileSync(path.join(baseDir, 'index.html'), html, 'utf8');
  console.log('Updated index.html header successfully.');
} else {
  console.warn('Could not find room-title-badge in index.html');
}

// 2. Update style.css
let css = readFileSync(path.join(baseDir, 'style.css'), 'utf8');

const additionalCss = `
/* ========================================================
   Header & Button Polish (Fix cramped layout & text wrap)
======================================================== */
.app-header {
  height: 56px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  padding: 0 1rem !important;
  gap: 0.5rem !important;
  overflow: visible !important;
}

.brand-text h1 {
  font-size: 0.95rem !important;
  white-space: nowrap !important;
}

.brand-sub {
  font-size: 0.68rem !important;
  white-space: nowrap !important;
}

.room-title-badge {
  display: flex !important;
  align-items: center !important;
  gap: 6px !important;
  background: rgba(30, 41, 59, 0.65) !important;
  border: 1px solid rgba(56, 189, 248, 0.3) !important;
  padding: 4px 10px !important;
  border-radius: 8px !important;
  flex-shrink: 0 !important;
}

.room-title-badge .room-name {
  font-size: 0.78rem !important;
  font-weight: 700 !important;
  color: #38bdf8 !important;
  white-space: nowrap !important;
}

.header-right {
  display: flex !important;
  align-items: center !important;
  gap: 5px !important;
  flex-shrink: 0 !important;
}

/* Strict No-Wrap on all header buttons */
.header-right button,
.btn-save-room,
.btn-mode-toggle,
.btn-upload-furniture,
.btn-hdr-action {
  white-space: nowrap !important;
  flex-shrink: 0 !important;
  height: 32px !important;
  padding: 0 10px !important;
  font-size: 0.74rem !important;
  font-weight: 600 !important;
  display: inline-flex !important;
  align-items: center !important;
  gap: 5px !important;
  line-height: 1 !important;
  border-radius: 6px !important;
  cursor: pointer !important;
  transition: all 0.15s ease !important;
}

.btn-hdr-action {
  background: rgba(30, 41, 59, 0.8) !important;
  color: #e2e8f0 !important;
  border: 1px solid rgba(255, 255, 255, 0.12) !important;
}

.btn-hdr-action:hover {
  background: rgba(51, 65, 85, 0.95) !important;
  border-color: #38bdf8 !important;
  color: #ffffff !important;
  transform: translateY(-1px);
}

.btn-danger-action:hover {
  background: rgba(239, 68, 68, 0.3) !important;
  border-color: #ef4444 !important;
  color: #fca5a5 !important;
}

/* Collapsible Decor Panel Drawer */
.decor-panel.is-collapsed {
  display: none !important;
}

body.mode-player .decor-panel {
  display: none !important;
}

/* Make Scene Stage fill space harmoniously */
.scene-viewport {
  padding: 0.75rem !important;
  background: #090e0c !important;
}

.scene-stage {
  max-width: 100% !important;
  max-height: calc(100vh - 76px) !important;
  aspect-ratio: 16 / 9 !important;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(255, 255, 255, 0.1) !important;
}
`;

if (!css.includes('btn-hdr-action')) {
  css += additionalCss;
  writeFileSync(path.join(baseDir, 'style.css'), css, 'utf8');
  console.log('Updated style.css with header and layout polish.');
}

// 3. Add toggleDecorDrawer helper in app.js
let appJs = readFileSync(path.join(baseDir, 'app.js'), 'utf8');
if (!appJs.includes('function toggleDecorDrawer')) {
  const drawerHelper = `
function toggleDecorDrawer() {
  const panel = document.querySelector('.decor-panel');
  const btn = document.getElementById('btn-toggle-drawer');
  if (!panel) return;
  panel.classList.toggle('is-collapsed');
  const isCollapsed = panel.classList.contains('is-collapsed');
  if (btn) {
    btn.classList.toggle('active', !isCollapsed);
  }
  showToast(isCollapsed ? '📐 Đã thu gọn danh sách đồ đạc (Mở rộng toàn màn hình phòng)' : '🎁 Đã mở danh sách đồ đạc');
  setTimeout(() => {
    renderCustomItems();
  }, 100);
}
`;
  appJs += drawerHelper;
  writeFileSync(path.join(baseDir, 'app.js'), appJs, 'utf8');
  console.log('Added toggleDecorDrawer in app.js.');
}

console.log('Interface fix completed successfully!');
