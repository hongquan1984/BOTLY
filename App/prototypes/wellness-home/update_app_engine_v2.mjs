import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

const filePath = 'D:/botly/App/prototypes/wellness-home/app.js';
let content = readFileSync(filePath, 'utf8');

// Find start of handleFilesUpload
const uploadStartIdx = content.indexOf('async function handleFilesUpload(files,');
if (uploadStartIdx === -1) {
  console.error('Cannot find handleFilesUpload in app.js');
  process.exit(1);
}

// Find applySceneBackgrounds at the end
const bgEndIdx = content.indexOf('function applySceneBackgrounds()');
if (bgEndIdx === -1) {
  console.error('Cannot find applySceneBackgrounds in app.js');
  process.exit(1);
}

const beforeCode = content.slice(0, uploadStartIdx);
const afterCode = content.slice(bgEndIdx);

const newEngineCode = `async function handleFilesUpload(files, defaultXPct = 50, defaultYPct = 60) {
  if (!inventoryState.custom_items) inventoryState.custom_items = [];

  const { width: stageWidth, height: stageHeight } = getStageDimensions();
  let count = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (!file.type.startsWith('image/')) continue;

    const dataUrl = await readFileAsDataURL(file);
    let finalUrl = dataUrl;
    let initialWidth = 280;

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, dataUrl, folder: 'furniture' })
      });
      const data = await res.json();
      if (data.url) finalUrl = data.url;
      if (data.width) initialWidth = data.width;
    } catch (_) {
      // Fallback: keep dataUrl
    }

    // Load actual image natural dimensions to preserve natural aspect ratio
    const imgObj = new Image();
    imgObj.src = finalUrl;
    await new Promise((resolve) => {
      imgObj.onload = resolve;
      imgObj.onerror = resolve;
    });

    const natW = imgObj.naturalWidth || initialWidth || 300;
    const natH = imgObj.naturalHeight || 300;

    let targetW = Math.min(340, Math.max(180, natW));
    let targetH = Math.round(targetW * (natH / natW));
    if (targetH > 420) {
      targetH = 420;
      targetW = Math.round(targetH * (natW / natH));
    }

    const cleanName = file.name.replace(/\\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    const offset = i * 4;
    const cxPct = Math.max(15, Math.min(85, defaultXPct + offset));
    const cyPct = Math.max(20, Math.min(80, defaultYPct + offset));

    const halfWPct = ((targetW / 2) / stageWidth) * 100;
    const halfHPct = ((targetH / 2) / stageHeight) * 100;

    const newItem = {
      id: 'custom_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      name: cleanName,
      img_src: finalUrl,
      scene_id: currentSceneId,
      natural_width: targetW,
      natural_height: targetH,
      corners: {
        tl: [Math.round((cxPct - halfWPct) * 100) / 100, Math.round((cyPct - halfHPct) * 100) / 100],
        tr: [Math.round((cxPct + halfWPct) * 100) / 100, Math.round((cyPct - halfHPct) * 100) / 100],
        br: [Math.round((cxPct + halfWPct) * 100) / 100, Math.round((cyPct + halfHPct) * 100) / 100],
        bl: [Math.round((cxPct - halfWPct) * 100) / 100, Math.round((cyPct + halfHPct) * 100) / 100]
      },
      user_scale: 1.0,
      z_index: Math.round((cyPct + halfHPct) * 10),
      displayed: true,
      visible: true,
      created_at: new Date().toISOString()
    };

    inventoryState.custom_items.push(newItem);
    selectedCustomItemId = newItem.id;
    count++;
  }

  if (count > 0) {
    saveState();
    renderCustomItems();
    renderInventoryList();
    showToast(\`🎉 Đã thêm \${count} ảnh tải lên! Kéo thân ảnh để di chuyển, lăn chuột để phóng to, kéo 4 góc để nắn phối cảnh.\`);
  }
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ========================================================
// Perspective Homography 4-Corner Warp Engine (Section 3-7)
// ========================================================
let isEditorAdminMode = true; // true: Admin Editor, false: Player Experience
let perspectiveInteractionMode = 'move'; // 'move' (drag body to translate) or 'perspective' (4 corner warp)
let perspectiveHistory = []; // Undo stack: [{ itemId, corners, user_scale }]
let perspectiveRedoHistory = []; // Redo stack: [{ itemId, corners, user_scale }]

function toggleEditorMode() {
  isEditorAdminMode = !isEditorAdminMode;
  const label = document.getElementById('label-editor-mode');
  const btn = document.getElementById('btn-toggle-editor-mode');

  if (isEditorAdminMode) {
    document.body.classList.remove('mode-player');
    if (label) label.textContent = 'Admin Editor';
    if (btn) {
      btn.classList.add('active-admin');
      btn.classList.remove('active-player');
    }
    showToast('🛠️ Chế độ Admin Editor: Bật 4 góc điều khiển & công cụ phối cảnh');
  } else {
    document.body.classList.add('mode-player');
    if (label) label.textContent = 'Người Chơi (Preview)';
    if (btn) {
      btn.classList.remove('active-admin');
      btn.classList.add('active-player');
    }
    showToast('🎮 Chế độ Người Chơi: Đã ẩn toàn bộ góc điều khiển. Thưởng thức không gian phòng!');
  }
  renderPerspectiveOverlays();
}

function setPerspectiveInteractionMode(mode) {
  perspectiveInteractionMode = mode;
  const btnMove = document.getElementById('btn-mode-move');
  const btnPersp = document.getElementById('btn-mode-perspective');

  if (mode === 'move') {
    if (btnMove) btnMove.classList.add('active');
    if (btnPersp) btnPersp.classList.remove('active');
    showToast('✥ Chế độ Di chuyển: Kéo thân ảnh bất kỳ lúc nào để di chuyển khắp phòng.');
  } else {
    if (btnMove) btnMove.classList.remove('active');
    if (btnPersp) btnPersp.classList.add('active');
    showToast('📐 Chế độ Phối cảnh: Kéo 4 núm tròn (TL, TR, BR, BL) để nắn góc.');
  }
}

// 3x3 Projective Homography from Rectangle [0,w]x[0,h] to 4 Points
function computeHomography(w, h, p0, p1, p2, p3) {
  const x0 = p0.x, y0 = p0.y;
  const x1 = p1.x, y1 = p1.y;
  const x2 = p2.x, y2 = p2.y;
  const x3 = p3.x, y3 = p3.y;

  const dx1 = x1 - x2;
  const dx2 = x3 - x2;
  const dx3 = x0 - x1 + x2 - x3;
  const dy1 = y1 - y2;
  const dy2 = y3 - y2;
  const dy3 = y0 - y1 + y2 - y3;

  let a, b, c, d, e, f, g, h_val;
  if (Math.abs(dx3) < 1e-7 && Math.abs(dy3) < 1e-7) {
    a = x1 - x0;
    b = x3 - x0;
    c = x0;
    d = y1 - y0;
    e = y3 - y0;
    f = y0;
    g = 0;
    h_val = 0;
  } else {
    const det = dx1 * dy2 - dx2 * dy1;
    if (Math.abs(det) < 1e-7) return null;
    g = (dx3 * dy2 - dx2 * dy3) / det;
    h_val = (dx1 * dy3 - dx3 * dy1) / det;
    a = x1 - x0 + g * x1;
    b = x3 - x0 + h_val * x3;
    c = x0;
    d = y1 - y0 + g * y1;
    e = y3 - y0 + h_val * y3;
    f = y0;
  }

  // Column-major 4x4 matrix for CSS matrix3d:
  return [
    a / w, d / w, 0, g / w,
    b / h, e / h, 0, h_val / h,
    0, 0, 1, 0,
    c, f, 0, 1
  ];
}

// Check strictly convex quadrilateral to prevent self-intersection or degeneracy
function isConvexQuad(p0, p1, p2, p3) {
  const pts = [p0, p1, p2, p3];
  let sign = 0;
  for (let i = 0; i < 4; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % 4];
    const c = pts[(i + 2) % 4];
    const cross = (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x);
    if (Math.abs(cross) < 1e-4) return false;
    if (sign === 0) sign = Math.sign(cross);
    else if (Math.sign(cross) !== sign) return false;
  }
  return true;
}

function getStageDimensions() {
  const stage = document.getElementById('scene-stage');
  if (!stage) return { width: 1440, height: 810 };
  const rect = stage.getBoundingClientRect();
  return {
    width: rect.width || stage.clientWidth || 1440,
    height: rect.height || stage.clientHeight || 810
  };
}

function getPixelCorners(item, stageWidth, stageHeight) {
  ensureItemCorners(item, stageWidth, stageHeight);
  return {
    tl: { x: (item.corners.tl[0] / 100) * stageWidth, y: (item.corners.tl[1] / 100) * stageHeight },
    tr: { x: (item.corners.tr[0] / 100) * stageWidth, y: (item.corners.tr[1] / 100) * stageHeight },
    br: { x: (item.corners.br[0] / 100) * stageWidth, y: (item.corners.br[1] / 100) * stageHeight },
    bl: { x: (item.corners.bl[0] / 100) * stageWidth, y: (item.corners.bl[1] / 100) * stageHeight }
  };
}

function ensureItemCorners(item, stageWidth, stageHeight) {
  if (item.corners && item.corners.tl && item.corners.tr && item.corners.br && item.corners.bl) {
    return;
  }
  const w = item.natural_width || item.width || 340;
  const h = item.natural_height || item.height || Math.round(w * 0.7);
  const cx = item.left ? (item.left / 100) * stageWidth : stageWidth * 0.5;
  const cy = item.top ? (item.top / 100) * stageHeight : stageHeight * 0.65;
  const halfW = w / 2;
  const halfH = h / 2;

  item.natural_width = w;
  item.natural_height = h;
  item.corners = {
    tl: [Math.max(2, Math.min(98, ((cx - halfW) / stageWidth) * 100)), Math.max(2, Math.min(98, ((cy - halfH) / stageHeight) * 100))],
    tr: [Math.max(2, Math.min(98, ((cx + halfW) / stageWidth) * 100)), Math.max(2, Math.min(98, ((cy - halfH) / stageHeight) * 100))],
    br: [Math.max(2, Math.min(98, ((cx + halfW) / stageWidth) * 100)), Math.max(2, Math.min(98, ((cy + halfH) / stageHeight) * 100))],
    bl: [Math.max(2, Math.min(98, ((cx - halfW) / stageWidth) * 100)), Math.max(2, Math.min(98, ((cy + halfH) / stageHeight) * 100))]
  };
}

function renderCustomItems() {
  const container = document.getElementById('custom-items-stage');
  if (!container) return;
  container.innerHTML = '';

  if (!inventoryState.custom_items) inventoryState.custom_items = [];

  const { width: stageWidth, height: stageHeight } = getStageDimensions();
  const sceneItems = inventoryState.custom_items.filter(it => it.scene_id === currentSceneId && it.displayed !== false && it.visible !== false);

  const badge = document.getElementById('custom-count-badge');
  if (badge) badge.textContent = inventoryState.custom_items.length;

  sceneItems.forEach(item => {
    ensureItemCorners(item, stageWidth, stageHeight);

    const w = item.natural_width || 400;
    const h = item.natural_height || 300;
    const pts = getPixelCorners(item, stageWidth, stageHeight);
    const m = computeHomography(w, h, pts.tl, pts.tr, pts.br, pts.bl);

    const node = document.createElement('div');
    node.className = \`perspective-item-node \${selectedCustomItemId === item.id ? 'is-selected' : ''}\`;
    node.id = \`perspective-node-\${item.id}\`;
    node.style.zIndex = item.z_index || Math.round(pts.br.y);

    const img = document.createElement('img');
    img.src = item.img_src;
    img.className = 'perspective-item-img';
    img.id = \`perspective-img-\${item.id}\`;
    img.style.width = \`\${w}px\`;
    img.style.height = \`\${h}px\`;
    if (m) {
      img.style.transform = \`matrix3d(\${m.join(',')})\`;
    }
    img.alt = item.name;

    // Interactive Hit-area for clicking / dragging anywhere on the image body
    const hitArea = document.createElement('div');
    hitArea.className = 'perspective-item-hitarea';
    hitArea.id = \`perspective-hit-\${item.id}\`;
    hitArea.style.width = \`\${w}px\`;
    hitArea.style.height = \`\${h}px\`;
    if (m) {
      hitArea.style.transform = \`matrix3d(\${m.join(',')})\`;
    }

    // Direct drag-to-move whenever clicking the image body
    hitArea.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      e.preventDefault();
      e.stopPropagation();

      selectCustomItem(item.id);
      startItemDragMove(item.id, e);
    });

    // Mouse wheel zoom directly on the item
    hitArea.addEventListener('wheel', (e) => {
      e.preventDefault();
      e.stopPropagation();

      selectCustomItem(item.id);
      const step = e.deltaY < 0 ? 0.08 : -0.08;
      scaleSelectedCustomItem(step);
    }, { passive: false });

    node.appendChild(img);
    node.appendChild(hitArea);
    container.appendChild(node);
  });

  renderPerspectiveOverlays();
}

function selectCustomItem(itemId) {
  selectedCustomItemId = itemId;
  document.querySelectorAll('.perspective-item-node').forEach(n => n.classList.remove('is-selected'));
  const node = document.getElementById(\`perspective-node-\${itemId}\`);
  if (node) node.classList.add('is-selected');

  renderPerspectiveOverlays();
}

function renderPerspectiveOverlays() {
  const svg = document.getElementById('perspective-svg-overlay');
  const handlesContainer = document.getElementById('perspective-handles-stage');
  const toolbar = document.getElementById('perspective-toolbar');
  if (!svg || !handlesContainer) return;

  svg.innerHTML = '';
  handlesContainer.innerHTML = '';

  if (!isEditorAdminMode || !selectedCustomItemId) {
    if (toolbar) toolbar.style.display = 'none';
    return;
  }

  const item = (inventoryState.custom_items || []).find(it => it.id === selectedCustomItemId);
  if (!item || item.scene_id !== currentSceneId || item.displayed === false || item.visible === false) {
    if (toolbar) toolbar.style.display = 'none';
    return;
  }

  const { width: stageWidth, height: stageHeight } = getStageDimensions();
  const pts = getPixelCorners(item, stageWidth, stageHeight);

  // SVG Polygon Wireframe connecting TL -> TR -> BR -> BL
  const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
  polygon.setAttribute('points', \`\${pts.tl.x},\${pts.tl.y} \${pts.tr.x},\${pts.tr.y} \${pts.br.x},\${pts.br.y} \${pts.bl.x},\${pts.bl.y}\`);
  polygon.setAttribute('class', 'perspective-polygon is-active');
  svg.appendChild(polygon);

  // 4 Corner Handles
  const corners = [
    { key: 'tl', name: 'Top-Left', pt: pts.tl, label: 'TL' },
    { key: 'tr', name: 'Top-Right', pt: pts.tr, label: 'TR' },
    { key: 'br', name: 'Bottom-Right', pt: pts.br, label: 'BR' },
    { key: 'bl', name: 'Bottom-Left', pt: pts.bl, label: 'BL' }
  ];

  corners.forEach(c => {
    const handle = document.createElement('div');
    handle.className = \`perspective-corner-handle handle-\${c.key}\`;
    handle.id = \`perspective-handle-\${item.id}-\${c.key}\`;
    handle.style.left = \`\${c.pt.x}px\`;
    handle.style.top = \`\${c.pt.y}px\`;
    handle.setAttribute('data-corner', c.key);
    handle.title = \`Kéo góc \${c.name} độc lập (chỉ góc này di chuyển)\`;

    const badge = document.createElement('span');
    badge.className = 'corner-badge';
    badge.textContent = c.label;
    handle.appendChild(badge);

    initSingleCornerDrag(handle, item.id, c.key);
    handlesContainer.appendChild(handle);
  });

  // Display and position toolbar
  if (toolbar) {
    toolbar.style.display = 'flex';
    const minY = Math.min(pts.tl.y, pts.tr.y, pts.br.y, pts.bl.y);
    const avgX = (pts.tl.x + pts.tr.x + pts.br.x + pts.bl.x) / 4;
    toolbar.style.left = \`\${Math.max(240, Math.min(stageWidth - 240, avgX))}px\`;
    toolbar.style.top = \`\${Math.max(14, minY - 56)}px\`;

    const btnVis = document.getElementById('btn-toggle-vis');
    if (btnVis) {
      btnVis.textContent = item.visible !== false ? '👁️ Ẩn' : '👁️ Hiện';
    }

    const scaleBadge = document.getElementById('ptool-scale-badge');
    if (scaleBadge) {
      scaleBadge.textContent = \`\${Math.round((item.user_scale || 1.0) * 100)}%\`;
    }
  }
}

// Update visuals in realtime during drag/scale WITHOUT rebuilding DOM
function updateItemVisuals(item, stageWidth, stageHeight) {
  if (!stageWidth || !stageHeight) {
    const dims = getStageDimensions();
    stageWidth = dims.width;
    stageHeight = dims.height;
  }

  const pts = getPixelCorners(item, stageWidth, stageHeight);
  const w = item.natural_width || 400;
  const h = item.natural_height || 300;
  const m = computeHomography(w, h, pts.tl, pts.tr, pts.br, pts.bl);

  const img = document.getElementById(\`perspective-img-\${item.id}\`);
  const hitArea = document.getElementById(\`perspective-hit-\${item.id}\`);
  if (img && m) img.style.transform = \`matrix3d(\${m.join(',')})\`;
  if (hitArea && m) hitArea.style.transform = \`matrix3d(\${m.join(',')})\`;

  const handleTL = document.getElementById(\`perspective-handle-\${item.id}-tl\`);
  const handleTR = document.getElementById(\`perspective-handle-\${item.id}-tr\`);
  const handleBR = document.getElementById(\`perspective-handle-\${item.id}-br\`);
  const handleBL = document.getElementById(\`perspective-handle-\${item.id}-bl\`);

  if (handleTL) { handleTL.style.left = \`\${pts.tl.x}px\`; handleTL.style.top = \`\${pts.tl.y}px\`; }
  if (handleTR) { handleTR.style.left = \`\${pts.tr.x}px\`; handleTR.style.top = \`\${pts.tr.y}px\`; }
  if (handleBR) { handleBR.style.left = \`\${pts.br.x}px\`; handleBR.style.top = \`\${pts.br.y}px\`; }
  if (handleBL) { handleBL.style.left = \`\${pts.bl.x}px\`; handleBL.style.top = \`\${pts.bl.y}px\`; }

  const polygon = document.querySelector('.perspective-polygon');
  if (polygon) {
    polygon.setAttribute('points', \`\${pts.tl.x},\${pts.tl.y} \${pts.tr.x},\${pts.tr.y} \${pts.br.x},\${pts.br.y} \${pts.bl.x},\${pts.bl.y}\`);
  }

  const toolbar = document.getElementById('perspective-toolbar');
  if (toolbar && toolbar.style.display !== 'none') {
    const minY = Math.min(pts.tl.y, pts.tr.y, pts.br.y, pts.bl.y);
    const avgX = (pts.tl.x + pts.tr.x + pts.br.x + pts.bl.x) / 4;
    toolbar.style.left = \`\${Math.max(240, Math.min(stageWidth - 240, avgX))}px\`;
    toolbar.style.top = \`\${Math.max(14, minY - 56)}px\`;
  }
}

// 1. Independent Corner Drag: ONLY this corner moves; other 3 remain strictly pinned!
function initSingleCornerDrag(handleNode, itemId, cornerKey) {
  let isDragging = false;
  const stage = document.getElementById('scene-stage');

  handleNode.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.preventDefault();
    e.stopPropagation();

    isDragging = true;
    const item = (inventoryState.custom_items || []).find(it => it.id === itemId);
    if (!item) return;

    pushUndoState(item);

    handleNode.setPointerCapture(e.pointerId);
    handleNode.classList.add('is-dragging');
  });

  handleNode.addEventListener('pointermove', (e) => {
    if (!isDragging) return;
    e.preventDefault();
    e.stopPropagation();

    const stageRect = stage.getBoundingClientRect();
    const curX = e.clientX - stageRect.left;
    const curY = e.clientY - stageRect.top;

    const stageWidth = stageRect.width;
    const stageHeight = stageRect.height;

    const item = (inventoryState.custom_items || []).find(it => it.id === itemId);
    if (!item) return;

    // Get current pixel points of all 4 corners
    const pts = getPixelCorners(item, stageWidth, stageHeight);

    // Update ONLY this corner
    const testPts = {
      tl: { ...pts.tl },
      tr: { ...pts.tr },
      br: { ...pts.br },
      bl: { ...pts.bl }
    };
    testPts[cornerKey] = { x: curX, y: curY };

    // Prevent non-convex or self-intersecting quads (renderer stability)
    if (!isConvexQuad(testPts.tl, testPts.tr, testPts.br, testPts.bl)) {
      return;
    }

    // Save normalized coordinates [0..100%]
    item.corners[cornerKey] = [
      Math.round(((curX / stageWidth) * 100) * 100) / 100,
      Math.round(((curY / stageHeight) * 100) * 100) / 100
    ];

    // Realtime homography calculation & visual update
    updateItemVisuals(item, stageWidth, stageHeight);
  });

  const stopDrag = (e) => {
    if (!isDragging) return;
    isDragging = false;
    handleNode.classList.remove('is-dragging');
    try {
      handleNode.releasePointerCapture(e.pointerId);
    } catch (_) {}

    saveState();
    renderPerspectiveOverlays();
  };

  handleNode.addEventListener('pointerup', stopDrag);
  handleNode.addEventListener('pointercancel', stopDrag);
}

// 2. Drag whole body: all 4 corners translate simultaneously
function startItemDragMove(itemId, e) {
  const item = (inventoryState.custom_items || []).find(it => it.id === itemId);
  if (!item) return;

  const stage = document.getElementById('scene-stage');
  const stageRect = stage.getBoundingClientRect();
  const startX = e.clientX;
  const startY = e.clientY;
  const origCorners = JSON.parse(JSON.stringify(item.corners));

  pushUndoState(item);

  const hitArea = document.getElementById(\`perspective-hit-\${itemId}\`);
  if (hitArea) {
    try {
      hitArea.setPointerCapture(e.pointerId);
    } catch (_) {}
  }

  let hasMoved = false;

  const moveHandler = (moveEvent) => {
    moveEvent.preventDefault();
    moveEvent.stopPropagation();

    const dxPct = ((moveEvent.clientX - startX) / stageRect.width) * 100;
    const dyPct = ((moveEvent.clientY - startY) / stageRect.height) * 100;

    if (Math.hypot(dxPct, dyPct) > 0.2) {
      hasMoved = true;
    }

    item.corners.tl = [Math.round((origCorners.tl[0] + dxPct) * 100) / 100, Math.round((origCorners.tl[1] + dyPct) * 100) / 100];
    item.corners.tr = [Math.round((origCorners.tr[0] + dxPct) * 100) / 100, Math.round((origCorners.tr[1] + dyPct) * 100) / 100];
    item.corners.br = [Math.round((origCorners.br[0] + dxPct) * 100) / 100, Math.round((origCorners.br[1] + dyPct) * 100) / 100];
    item.corners.bl = [Math.round((origCorners.bl[0] + dxPct) * 100) / 100, Math.round((origCorners.bl[1] + dyPct) * 100) / 100];

    updateItemVisuals(item, stageRect.width, stageRect.height);
  };

  const upHandler = (upEvent) => {
    window.removeEventListener('pointermove', moveHandler);
    window.removeEventListener('pointerup', upHandler);
    window.removeEventListener('pointercancel', upHandler);

    if (hitArea) {
      try {
        hitArea.releasePointerCapture(upEvent.pointerId);
      } catch (_) {}
    }

    if (hasMoved) {
      saveState();
      renderPerspectiveOverlays();
    }
  };

  window.addEventListener('pointermove', moveHandler);
  window.addEventListener('pointerup', upHandler);
  window.addEventListener('pointercancel', upHandler);
}

// 3. Scale/Zoom around Quad Center: preserves exact perspective deformation
function scaleItemAroundCenter(itemId, factor) {
  const item = (inventoryState.custom_items || []).find(it => it.id === itemId);
  if (!item) return;

  const { width: stageWidth, height: stageHeight } = getStageDimensions();
  ensureItemCorners(item, stageWidth, stageHeight);

  const cx = (item.corners.tl[0] + item.corners.tr[0] + item.corners.br[0] + item.corners.bl[0]) / 4;
  const cy = (item.corners.tl[1] + item.corners.tr[1] + item.corners.br[1] + item.corners.bl[1]) / 4;

  const newCorners = {
    tl: [Math.round((cx + (item.corners.tl[0] - cx) * factor) * 100) / 100, Math.round((cy + (item.corners.tl[1] - cy) * factor) * 100) / 100],
    tr: [Math.round((cx + (item.corners.tr[0] - cx) * factor) * 100) / 100, Math.round((cy + (item.corners.tr[1] - cy) * factor) * 100) / 100],
    br: [Math.round((cx + (item.corners.br[0] - cx) * factor) * 100) / 100, Math.round((cy + (item.corners.br[1] - cy) * factor) * 100) / 100],
    bl: [Math.round((cx + (item.corners.bl[0] - cx) * factor) * 100) / 100, Math.round((cy + (item.corners.bl[1] - cy) * factor) * 100) / 100]
  };

  const spanX = Math.hypot(newCorners.tr[0] - newCorners.tl[0], newCorners.tr[1] - newCorners.tl[1]);
  if (spanX < 3 || spanX > 96) return;

  item.corners = newCorners;
  item.user_scale = Math.max(0.2, Math.min(3.5, Math.round(((item.user_scale || 1.0) * factor) * 100) / 100));

  saveState();
  updateItemVisuals(item, stageWidth, stageHeight);

  const badge = document.getElementById('ptool-scale-badge');
  if (badge) {
    badge.textContent = \`\${Math.round((item.user_scale || 1.0) * 100)}%\`;
  }
}

function scaleSelectedCustomItem(delta) {
  if (!selectedCustomItemId) {
    showToast('Vui lòng chọn ảnh trước khi phóng to / thu nhỏ.');
    return;
  }
  const item = (inventoryState.custom_items || []).find(it => it.id === selectedCustomItemId);
  if (!item) return;

  pushUndoState(item);

  const currentScale = item.user_scale || 1.0;
  const newScale = Math.max(0.2, Math.min(3.5, Math.round((currentScale + delta) * 100) / 100));
  const factor = newScale / currentScale;

  scaleItemAroundCenter(item.id, factor);
  showToast(\`🔍 Kích thước "\${item.name}": \${Math.round((item.user_scale || 1.0) * 100)}%\`);
}

function pushUndoState(item) {
  perspectiveHistory.push({
    itemId: item.id,
    corners: JSON.parse(JSON.stringify(item.corners)),
    user_scale: item.user_scale || 1.0
  });
  if (perspectiveHistory.length > 30) perspectiveHistory.shift();
  perspectiveRedoHistory = [];
}

function undoPerspective() {
  if (perspectiveHistory.length === 0) {
    showToast('Không còn thao tác để hoàn tác.');
    return;
  }
  const last = perspectiveHistory.pop();
  const item = (inventoryState.custom_items || []).find(it => it.id === last.itemId);
  if (item) {
    perspectiveRedoHistory.push({
      itemId: item.id,
      corners: JSON.parse(JSON.stringify(item.corners)),
      user_scale: item.user_scale || 1.0
    });
    item.corners = last.corners;
    item.user_scale = last.user_scale;
    saveState();
    renderCustomItems();
    showToast('↶ Đã hoàn tác thao tác gần nhất.');
  }
}

function redoPerspective() {
  if (perspectiveRedoHistory.length === 0) {
    showToast('Không có thao tác nào để làm lại.');
    return;
  }
  const next = perspectiveRedoHistory.pop();
  const item = (inventoryState.custom_items || []).find(it => it.id === next.itemId);
  if (item) {
    perspectiveHistory.push({
      itemId: item.id,
      corners: JSON.parse(JSON.stringify(item.corners)),
      user_scale: item.user_scale || 1.0
    });
    item.corners = next.corners;
    item.user_scale = next.user_scale;
    saveState();
    renderCustomItems();
    showToast('↷ Đã làm lại thao tác.');
  }
}

function resetSelectedPerspective() {
  const item = (inventoryState.custom_items || []).find(it => it.id === selectedCustomItemId);
  if (!item) return;
  pushUndoState(item);

  const { width: stageWidth, height: stageHeight } = getStageDimensions();
  const pts = getPixelCorners(item, stageWidth, stageHeight);
  const cx = (pts.tl.x + pts.tr.x + pts.br.x + pts.bl.x) / 4;
  const cy = (pts.tl.y + pts.tr.y + pts.br.y + pts.bl.y) / 4;
  const w = item.natural_width || 340;
  const h = item.natural_height || 240;
  const halfW = w / 2;
  const halfH = h / 2;

  item.corners = {
    tl: [Math.round(((cx - halfW) / stageWidth) * 1000) / 10, Math.round(((cy - halfH) / stageHeight) * 1000) / 10],
    tr: [Math.round(((cx + halfW) / stageWidth) * 1000) / 10, Math.round(((cy - halfH) / stageHeight) * 1000) / 10],
    br: [Math.round(((cx + halfW) / stageWidth) * 1000) / 10, Math.round(((cy + halfH) / stageHeight) * 1000) / 10],
    bl: [Math.round(((cx - halfW) / stageWidth) * 1000) / 10, Math.round(((cy + halfH) / stageHeight) * 1000) / 10]
  };
  item.user_scale = 1.0;

  saveState();
  renderCustomItems();
  showToast(\`↺ Đã khôi phục góc chữ nhật phẳng cho "\${item.name}".\`);
}

function toggleSelectedVisibility() {
  const item = (inventoryState.custom_items || []).find(it => it.id === selectedCustomItemId);
  if (!item) return;

  item.visible = item.visible === false ? true : false;
  item.displayed = item.visible;
  saveState();
  renderCustomItems();
  renderInventoryList();
  showToast(item.visible ? \`✨ Đã hiển thị layer "\${item.name}"\` : \`👁️ Đã ẩn layer "\${item.name}"\`);
}

function deleteSelectedPerspectiveItem() {
  const item = (inventoryState.custom_items || []).find(it => it.id === selectedCustomItemId);
  if (!item) return;

  const confirmed = confirm(\`Bạn có chắc chắn muốn xóa layer "\${item.name}" khỏi phòng không?\`);
  if (!confirmed) return;

  const idx = inventoryState.custom_items.findIndex(it => it.id === selectedCustomItemId);
  if (idx >= 0) {
    inventoryState.custom_items.splice(idx, 1);
    selectedCustomItemId = null;
    saveState();
    renderCustomItems();
    renderInventoryList();
    showToast(\`🗑️ Đã xóa layer "\${item.name}".\`);
  }
}

function toggleCustomItemVisibility(itemId, event) {
  if (event) event.stopPropagation();
  const item = (inventoryState.custom_items || []).find(it => it.id === itemId);
  if (!item) return;
  item.displayed = item.displayed === false ? true : false;
  item.visible = item.displayed;
  saveState();
  renderCustomItems();
  renderInventoryList();
}

function deleteCustomItem(itemId, event) {
  if (event) event.stopPropagation();
  const idx = (inventoryState.custom_items || []).findIndex(it => it.id === itemId);
  if (idx === -1) return;
  const name = inventoryState.custom_items[idx].name;
  if (!confirm(\`Bạn có chắc muốn xóa "\${name}" không?\`)) return;
  inventoryState.custom_items.splice(idx, 1);
  if (selectedCustomItemId === itemId) {
    selectedCustomItemId = null;
  }
  saveState();
  renderCustomItems();
  renderInventoryList();
  showToast(\`🗑️ Đã xóa "\${name}"\`);
}

function triggerReplaceImage() {
  const fileInput = document.getElementById('input-replace-furniture');
  if (fileInput) fileInput.click();
}

async function handleReplaceFurnitureUpload(event) {
  const file = event.target.files?.[0];
  if (!file || !selectedCustomItemId) return;

  const item = (inventoryState.custom_items || []).find(it => it.id === selectedCustomItemId);
  if (!item) return;

  const dataUrl = await readFileAsDataURL(file);
  let finalUrl = dataUrl;

  try {
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: file.name, dataUrl, folder: 'furniture' })
    });
    const data = await res.json();
    if (data.url) finalUrl = data.url;
  } catch (_) {}

  item.img_src = finalUrl;
  item.name = file.name.replace(/\\.[^/.]+$/, '').replace(/[-_]/g, ' ');

  const imgTemp = new Image();
  imgTemp.onload = () => {
    item.natural_width = imgTemp.naturalWidth;
    item.natural_height = imgTemp.naturalHeight;
    saveState();
    renderCustomItems();
    renderInventoryList();
    showToast(\`🖼️ Đã đổi ảnh mới cho "\${item.name}", giữ nguyên cấu hình 4 góc!\`);
  };
  imgTemp.src = finalUrl;
  event.target.value = '';
}

function saveSelectedPerspective() {
  const item = (inventoryState.custom_items || []).find(it => it.id === selectedCustomItemId);
  if (!item) return;

  saveState();

  const refW = 1672;
  const refH = 941;
  const config = {
    itemId: item.id,
    sceneId: item.scene_id || currentSceneId,
    assetPath: item.img_src,
    corners: {
      tl: [Math.round((item.corners.tl[0] / 100) * refW), Math.round((item.corners.tl[1] / 100) * refH)],
      tr: [Math.round((item.corners.tr[0] / 100) * refW), Math.round((item.corners.tr[1] / 100) * refH)],
      br: [Math.round((item.corners.br[0] / 100) * refW), Math.round((item.corners.br[1] / 100) * refH)],
      bl: [Math.round((item.corners.bl[0] / 100) * refW), Math.round((item.corners.bl[1] / 100) * refH)]
    },
    userScale: item.user_scale || 1.0,
    zIndex: item.z_index || 20,
    visible: item.visible !== false
  };

  const modal = document.getElementById('perspective-json-modal');
  const codeEl = document.getElementById('perspective-json-code');
  if (modal && codeEl) {
    codeEl.textContent = JSON.stringify(config, null, 2);
    modal.style.display = 'flex';
  }

  showToast(\`💾 Đã lưu cấu hình phối cảnh cho "\${item.name}"!\`);
  console.log('HOMOGRAPHY_CONFIG_SAVED:', config);
}

function closeJsonModal(e) {
  const modal = document.getElementById('perspective-json-modal');
  if (modal) modal.style.display = 'none';
}

function copyJsonConfig() {
  const codeEl = document.getElementById('perspective-json-code');
  if (codeEl) {
    navigator.clipboard.writeText(codeEl.textContent).then(() => {
      showToast('📋 Đã sao chép JSON cấu hình vào clipboard!');
    }).catch(() => {
      showToast('Đã chọn JSON cấu hình.');
    });
  }
}

function addSamplePainting() {
  if (!inventoryState.custom_items) inventoryState.custom_items = [];

  const { width: stageWidth, height: stageHeight } = getStageDimensions();
  const newItem = {
    id: 'painting-alps-01',
    name: 'Tranh Dãy Alps Thụy Sĩ',
    img_src: 'assets/items/painting-alps-01.png',
    scene_id: currentSceneId,
    natural_width: 600,
    natural_height: 420,
    corners: {
      tl: [16.5, 14.5],
      tr: [31.5, 18.0],
      br: [30.5, 41.5],
      bl: [16.0, 43.0]
    },
    user_scale: 1.0,
    z_index: 250,
    visible: true,
    displayed: true,
    created_at: new Date().toISOString()
  };

  const existingIdx = inventoryState.custom_items.findIndex(it => it.id === newItem.id);
  if (existingIdx >= 0) {
    inventoryState.custom_items.splice(existingIdx, 1);
  }
  inventoryState.custom_items.unshift(newItem);
  selectedCustomItemId = newItem.id;
  saveState();
  renderCustomItems();
  renderInventoryList();
  showToast('🖼️ Đã treo tranh Dãy Alps lên tường với góc phối cảnh chuẩn!');
}

window.addEventListener('resize', () => {
  renderCustomItems();
});

// Background Upload Handlers
function handleBackgroundUpload(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (e) => {
    const dataUrl = e.target.result;
    let finalUrl = dataUrl;

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, dataUrl, folder: 'backgrounds' })
      });
      const data = await res.json();
      if (data.url) finalUrl = data.url;
    } catch (_) {}

    if (!inventoryState.custom_backgrounds) inventoryState.custom_backgrounds = {};
    inventoryState.custom_backgrounds[currentSceneId] = finalUrl;
    saveState();
    applySceneBackgrounds();
    showToast(\`🖼️ Đã đổi ảnh nền cho cảnh "\${getSceneName(currentSceneId)}"\`);
  };
  reader.readAsDataURL(file);
  event.target.value = '';
}

function resetCurrentSceneBackground() {
  if (inventoryState.custom_backgrounds && inventoryState.custom_backgrounds[currentSceneId]) {
    delete inventoryState.custom_backgrounds[currentSceneId];
    saveState();
    applySceneBackgrounds();
    showToast(\`↺ Đã khôi phục ảnh nền gốc Thụy Sĩ cho cảnh "\${getSceneName(currentSceneId)}"\`);
  }
}

`;

const fullUpdatedContent = beforeCode + newEngineCode + afterCode;
writeFileSync(filePath, fullUpdatedContent, 'utf8');
console.log('app.js updated successfully with full Move, Zoom, Scale, and Corner drag features!');
