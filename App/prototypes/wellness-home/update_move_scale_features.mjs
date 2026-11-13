import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

const baseDir = 'D:/botly/App/prototypes/wellness-home';

// 1. Update index.html
let html = readFileSync(path.join(baseDir, 'index.html'), 'utf8');

const oldToolbar = `<div id="perspective-toolbar" class="perspective-toolbar" style="display: none;">
            <div class="ptool-group">
              <span class="ptool-title">Chế độ:</span>
              <button id="btn-mode-move" class="ptool-btn active" onclick="setPerspectiveInteractionMode('move')" title="Kéo toàn bộ ảnh để di chuyển (giữ nguyên hình dạng)">✥ Move</button>
              <button id="btn-mode-perspective" class="ptool-btn" onclick="setPerspectiveInteractionMode('perspective')" title="Kéo từng góc độc lập để biến dạng phối cảnh">📐 Perspective</button>
            </div>
            <div class="ptool-divider"></div>
            <div class="ptool-group">
              <button class="ptool-btn" onclick="undoPerspective()" title="Hoàn tác (Undo)">↶ Undo</button>
              <button class="ptool-btn" onclick="redoPerspective()" title="Làm lại (Redo)">↷ Redo</button>
              <button class="ptool-btn" onclick="resetSelectedPerspective()" title="Khôi phục góc chữ nhật">↺ Reset góc</button>
            </div>
            <div class="ptool-divider"></div>
            <div class="ptool-group">
              <button class="ptool-btn" id="btn-toggle-vis" onclick="toggleSelectedVisibility()" title="Ẩn / Hiện layer">👁️ Ẩn/Hiện</button>
              <button class="ptool-btn" onclick="triggerReplaceImage()" title="Thay ảnh PNG nhưng giữ cấu hình 4 góc">🖼️ Đổi ảnh</button>
              <button class="ptool-btn ptool-btn-save" onclick="saveSelectedPerspective()" title="Lưu vị trí cấu hình">💾 Lưu vị trí</button>
              <button class="ptool-btn ptool-btn-danger" onclick="deleteSelectedPerspectiveItem()" title="Xóa layer">🗑️ Xóa</button>
            </div>
          </div>`;

const newToolbar = `<div id="perspective-toolbar" class="perspective-toolbar" style="display: none;">
            <div class="ptool-group">
              <span class="ptool-title">Thao tác:</span>
              <button id="btn-mode-move" class="ptool-btn active" onclick="setPerspectiveInteractionMode('move')" title="Kéo thân ảnh bất kỳ đâu để di chuyển toàn bộ">✥ Di chuyển</button>
              <button id="btn-mode-perspective" class="ptool-btn" onclick="setPerspectiveInteractionMode('perspective')" title="Kéo 4 núm tròn (TL, TR, BR, BL) để nắn góc phối cảnh">📐 Nắn 4 góc</button>
            </div>
            <div class="ptool-divider"></div>
            <div class="ptool-group ptool-zoom-group">
              <button class="ptool-btn ptool-btn-zoom" onclick="scaleSelectedCustomItem(-0.1)" title="Thu nhỏ ảnh (hoặc lăn chuột xuống)">➖ Thu nhỏ</button>
              <span class="ptool-scale-badge" id="ptool-scale-badge" title="Tỷ lệ kích thước (hoặc lăn chuột trực tiếp trên ảnh)">100%</span>
              <button class="ptool-btn ptool-btn-zoom" onclick="scaleSelectedCustomItem(0.1)" title="Phóng to ảnh (hoặc lăn chuột lên)">➕ Phóng to</button>
            </div>
            <div class="ptool-divider"></div>
            <div class="ptool-group">
              <button class="ptool-btn" onclick="undoPerspective()" title="Hoàn tác (Undo)">↶ Undo</button>
              <button class="ptool-btn" onclick="redoPerspective()" title="Làm lại (Redo)">↷ Redo</button>
              <button class="ptool-btn" onclick="resetSelectedPerspective()" title="Khôi phục góc chữ nhật">↺ Reset góc</button>
            </div>
            <div class="ptool-divider"></div>
            <div class="ptool-group">
              <button class="ptool-btn" id="btn-toggle-vis" onclick="toggleSelectedVisibility()" title="Ẩn / Hiện layer">👁️ Ẩn/Hiện</button>
              <button class="ptool-btn" onclick="triggerReplaceImage()" title="Thay ảnh PNG nhưng giữ cấu hình 4 góc">🖼️ Đổi ảnh</button>
              <button class="ptool-btn ptool-btn-save" onclick="saveSelectedPerspective()" title="Lưu vị trí cấu hình">💾 Lưu vị trí</button>
              <button class="ptool-btn ptool-btn-danger" onclick="deleteSelectedPerspectiveItem()" title="Xóa layer">🗑️ Xóa</button>
            </div>
          </div>`;

if (html.includes('id="perspective-toolbar"')) {
  html = html.replace(/<div id="perspective-toolbar"[\s\S]*?<\/div>(\s*<\/div>)/m, (match, p1) => {
    // replace just the toolbar
    return newToolbar + p1;
  });
  writeFileSync(path.join(baseDir, 'index.html'), html, 'utf8');
  console.log('Updated index.html toolbar successfully.');
} else {
  console.warn('Could not find perspective-toolbar in index.html');
}

// 2. Update style.css
let css = readFileSync(path.join(baseDir, 'style.css'), 'utf8');
if (!css.includes('.ptool-zoom-group')) {
  const zoomCss = `
.perspective-item-hitarea {
  position: absolute;
  left: 0;
  top: 0;
  transform-origin: 0 0;
  cursor: grab;
  pointer-events: auto;
  touch-action: none;
  background: rgba(0, 0, 0, 0.001);
}

.perspective-item-hitarea:active {
  cursor: grabbing;
}

.ptool-zoom-group {
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(30, 41, 59, 0.7);
  padding: 2px 6px;
  border-radius: 8px;
  border: 1px solid rgba(56, 189, 248, 0.25);
}

.ptool-scale-badge {
  font-size: 0.76rem;
  font-weight: 700;
  color: #38bdf8;
  min-width: 44px;
  text-align: center;
  user-select: none;
}

.ptool-btn-zoom {
  padding: 3px 8px;
  font-size: 0.72rem;
  font-weight: 700;
  background: rgba(51, 65, 85, 0.8);
}
`;
  css += zoomCss;
  writeFileSync(path.join(baseDir, 'style.css'), css, 'utf8');
  console.log('Updated style.css with zoom styling.');
}

console.log('Step 1 & 2 done.');
