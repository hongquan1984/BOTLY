/**
 * HealthClues — My Wellness Home V1
 * Layered Scene & Photorealistic Slot System Controller
 */

// Storage Keys
const STORAGE_INVENTORY_KEY = 'healthclues_home_v1_inventory';
const STORAGE_SCENE_KEY = 'healthclues_home_v1_scene';

// State containers
let scenes = [];
let slots = [];
let items = [];
let inventoryState = null;

let currentSceneId = 'scene_interior_wide';
let activeFilter = 'custom';
let selectedItemId = null;
let selectedSlotIdForPicker = null;

let isCompareMode = false;
let isDraggingSlider = false;
let showSlotGuides = false;

// 5 Independent Interior Luxury Furniture Layers State
const interiorLayersState = {
  rug: true,
  sofa: true,
  table: true,
  armchair: true,
  lamp: true
};

// DOM Element references
const stageElem = document.getElementById('scene-stage');
const inventoryListElem = document.getElementById('inventory-list');
const footerSummaryElem = document.getElementById('footer-summary');
const compareContainer = document.getElementById('compare-slider-container');
const compareBeforeWrapper = document.getElementById('compare-before-wrapper');
const compareDivider = document.getElementById('compare-divider');
const toastElem = document.getElementById('toast');

// Modal Elements
const itemModal = document.getElementById('item-modal');
const slotPickerModal = document.getElementById('slot-picker-modal');
const pipelineModal = document.getElementById('pipeline-modal');

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', async () => {
  await loadManifests();
  await loadMasterBlueprint();
  await loadPlayerProfile(activePlayerId || 'player_1');
  await loadPlayerState();
  renderSceneNavBadges();
  renderActiveSceneSlots();
  renderInventoryList();
  initCompareSlider();

  // Default to wide-angle panoramic interior
  switchScene('scene_interior_wide');
  updateInteriorDockUI();
  initStageDropzone();
  applySceneBackgrounds();
  renderCustomItems();
});

// ========================================================
// 1. Data Manifest Loading
// ========================================================
async function loadManifests() {
  try {
    const [scenesRes, slotsRes, itemsRes] = await Promise.all([
      fetch('data/scene-manifest.json'),
      fetch('data/slot-manifest.json'),
      fetch('data/item-manifest.json')
    ]);

    scenes = (await scenesRes.json()).scenes;
    slots = (await slotsRes.json()).slots;
    items = (await itemsRes.json()).items;
  } catch (err) {
    console.error('Error loading manifests:', err);
    showToast('⚠️ Không thể tải dữ liệu manifest: ' + err.message);
  }
}

// Load player inventory & slot state (Dual persistence: Server Disk + localStorage)
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
}

function initDefaultInventoryState() {
  inventoryState = {
    version: '1.0.0',
    last_updated: new Date().toISOString(),
    inventory: {
      flower_pot_01: {
        owned: true,
        displayed: true,
        active_slot: 'slot_garden_01',
        acquired_at: new Date().toISOString(),
        source: 'first_time_gift'
      },
      wooden_bench_01: {
        owned: true,
        displayed: true,
        active_slot: 'slot_garden_02',
        acquired_at: new Date().toISOString(),
        source: 'daily_wellness_streak_3'
      },
      flower_pot_02: {
        owned: true,
        displayed: true,
        active_slot: 'slot_interior_01',
        acquired_at: new Date().toISOString(),
        source: 'mindful_reading_milestone'
      },
      outdoor_chair_01: {
        owned: false,
        displayed: false,
        active_slot: null,
        unlock_requirement: 'Hoàn thành 5 bài kiểm tra giấc ngủ'
      },
      outdoor_table_01: {
        owned: true,
        displayed: true,
        active_slot: 'slot_interior_03',
        acquired_at: new Date().toISOString(),
        source: 'hydration_champion'
      },
      garden_lantern_01: {
        owned: false,
        displayed: false,
        active_slot: null,
        unlock_requirement: 'Duy trì chuỗi đi ngủ đúng giờ 5 ngày'
      },
      watering_can_01: {
        owned: false,
        displayed: false,
        active_slot: null,
        unlock_requirement: 'Đọc 3 cẩm nang sống khỏe thảo mộc'
      },
      rug_01: {
        owned: true,
        displayed: false,
        active_slot: null,
        acquired_at: new Date().toISOString(),
        source: 'energy_balance_week'
      },
      armchair_01: {
        owned: false,
        displayed: false,
        active_slot: null,
        unlock_requirement: 'Đạt mốc 14 ngày thiền định buổi tối'
      },
      table_lamp_01: {
        owned: true,
        displayed: true,
        active_slot: 'slot_interior_05',
        acquired_at: new Date().toISOString(),
        source: 'sweet_dreams_certificate'
      }
    },
    slots: {
      slot_garden_01: 'flower_pot_01',
      slot_garden_02: 'wooden_bench_01',
      slot_garden_03: null,
      slot_garden_04: null,
      slot_garden_05: null,
      slot_interior_01: 'flower_pot_02',
      slot_interior_02: null,
      slot_interior_03: 'outdoor_table_01',
      slot_interior_04: null,
      slot_interior_05: 'table_lamp_01',
      slot_overview_01: null
    }
  };
  saveState();
}

async function saveState() {
  if (!inventoryState) return;
  inventoryState.last_updated = new Date().toISOString();
  inventoryState.interior_layers = { ...interiorLayersState };
  inventoryState.active_scene = currentSceneId;
  inventoryState.day_night = currentDayNight;

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
}

// ========================================================
// 2. Scene Navigation & Switcher
// ========================================================
function switchScene(sceneId) {
  currentSceneId = sceneId;
  localStorage.setItem(STORAGE_SCENE_KEY, sceneId);

  // Close compare mode if switching away
  if (isCompareMode) {
    toggleCompareMode();
  }

  // Update nav tabs
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.classList.toggle('active', tab.getAttribute('data-scene') === sceneId);
  });

  // Update scene layers
  document.querySelectorAll('.scene-layer').forEach(layer => {
    layer.classList.toggle('active', layer.id === `layer-${sceneId}`);
  });

  stageElem.className = `scene-stage view-${sceneId}`;

  // Update top room-nav buttons
  const btnLiving = document.getElementById('btn-scene-living');
  const btnBed = document.getElementById('btn-scene-bedroom');
  if (btnLiving) btnLiving.classList.toggle('active', sceneId === 'scene_interior_wide' || sceneId === 'scene_interior');
  if (btnBed) btnBed.classList.toggle('active', sceneId === 'scene_bedroom');

  renderActiveSceneSlots();
  renderCustomItems();
  applySceneBackgrounds();
  updateInteriorDockUI();
  if (typeof onSceneChangedForCompanion === 'function') {
    onSceneChangedForCompanion(sceneId);
  }
}

// Render badges count on top scene tabs
function renderSceneNavBadges() {
  const counts = { scene_overview: 0, scene_garden: 0, scene_interior: 0 };

  for (const [slotId, itemId] of Object.entries(inventoryState.slots)) {
    if (itemId) {
      const slotDef = slots.find(s => s.slot_id === slotId);
      if (slotDef && counts[slotDef.scene_id] !== undefined) {
        counts[slotDef.scene_id]++;
      }
    }
  }

  ['overview', 'garden', 'interior'].forEach(key => {
    const fullId = `scene_${key}`;
    const badge = document.getElementById(`badge-${key}-count`);
    if (badge) {
      const c = counts[fullId] || 0;
      badge.textContent = c;
      badge.className = c > 0 ? 'tab-badge badge-active' : 'tab-badge';
    }
  });
}

// ========================================================
// 3. Slot & Free-Drag Placement Engine
// ========================================================
let activeDragItem = null;

function getScenePlacementBounds(sceneId, leftPercent) {
  if (sceneId === 'scene_interior') {
    // Bookshelf zone on the far left
    if (leftPercent <= 16.5) {
      return { minX: 9, maxX: 15.5, minY: 28, maxY: 68 };
    }
    // Main hardwood living room floor
    return { minX: 18, maxX: 92, minY: 72, maxY: 95 };
  }
  if (sceneId === 'scene_garden') {
    // Porch area
    if (leftPercent < 36) {
      return { minX: 12, maxX: 36, minY: 68, maxY: 82 };
    }
    // Lawn area
    return { minX: 30, maxX: 92, minY: 70, maxY: 94 };
  }
  return { minX: 10, maxX: 90, minY: 50, maxY: 90 };
}

function calculatePerspectiveScale(sceneId, topPercent) {
  if (sceneId === 'scene_interior') {
    // On the bookshelf (left): constant scale ~0.65
    if (topPercent < 70) return 0.65;
    // Sàn phòng khách: top 72% -> top 94%
    const t = Math.max(0, Math.min(1, (topPercent - 72) / (94 - 72)));
    return 0.85 + t * 0.35; // 0.85 -> 1.20
  }
  if (sceneId === 'scene_garden') {
    // Sân vườn: top 70% -> top 92%
    const t = Math.max(0, Math.min(1, (topPercent - 70) / (92 - 70)));
    return 0.85 + t * 0.35; // 0.85 -> 1.20
  }
  return 1.0;
}

function initItemDrag(node, itemId) {
  node.addEventListener('pointerdown', (e) => {
    // Only primary button or touch
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    if (e.target.closest('.slot-action-btn') || 
        e.target.closest('.slot-resize-handle') || 
        e.target.closest('.slot-rotate-handle') ||
        e.target.closest('.slot-scale-control-group') ||
        e.target.closest('.slot-rotate-control-group')) return;

    e.preventDefault();
    e.stopPropagation();

    const stageRect = stageElem.getBoundingClientRect();
    activeDragItem = {
      itemId,
      node,
      startX: e.clientX,
      startY: e.clientY,
      startLeft: parseFloat(node.style.left) || 50,
      startTop: parseFloat(node.style.top) || 80,
      stageWidth: stageRect.width,
      stageHeight: stageRect.height,
      hasMoved: false,
      pointerId: e.pointerId
    };

    node.setPointerCapture(e.pointerId);
    node.classList.add('is-dragging');
  });

  node.addEventListener('pointermove', (e) => {
    if (!activeDragItem || activeDragItem.itemId !== itemId) return;

    const dx = e.clientX - activeDragItem.startX;
    const dy = e.clientY - activeDragItem.startY;

    if (Math.hypot(dx, dy) > 4) {
      activeDragItem.hasMoved = true;
    }

    if (!activeDragItem.hasMoved) return;

    const dxPercent = (dx / activeDragItem.stageWidth) * 100;
    const dyPercent = (dy / activeDragItem.stageHeight) * 100;

    let newLeft = activeDragItem.startLeft + dxPercent;
    let newTop = activeDragItem.startTop + dyPercent;

    // Realistic bounds by scene
    const bounds = getScenePlacementBounds(currentSceneId, newLeft);
    newLeft = Math.max(bounds.minX, Math.min(bounds.maxX, newLeft));
    newTop = Math.max(bounds.minY, Math.min(bounds.maxY, newTop));

    // Perspective depth scale
    const depthScale = calculatePerspectiveScale(currentSceneId, newTop);

    node.style.left = `${newLeft.toFixed(2)}%`;
    node.style.top = `${newTop.toFixed(2)}%`;

    // Real-time Auto Y-Sorting: items positioned lower (near foreground) render in front
    node.style.zIndex = Math.round(newTop * 10);

    const itemDef = items.find(i => i.item_id === itemId);
    const slotId = inventoryState.inventory[itemId]?.active_slot;
    const slotDef = slots.find(s => s.slot_id === slotId) || { base_width: 150 };
    const imgEl = node.querySelector('.slot-item-img');
    const shadowEl = node.querySelector('.slot-contact-shadow');
    const sunShadow = node.querySelector('.slot-sunlight-shadow');

    const inv = inventoryState.inventory[itemId];
    const userScale = inv?.custom_pos?.user_scale || inv?.user_scale || 1.0;

    if (imgEl && itemDef) {
      const newWidth = Math.round(slotDef.base_width * (itemDef.scale_hint || 1.0) * depthScale * userScale);
      imgEl.style.width = `${newWidth}px`;
      if (shadowEl) {
        shadowEl.style.width = `${Math.round(newWidth * 0.85)}px`;
      }
      if (sunShadow) {
        sunShadow.style.width = `${Math.round(newWidth * 0.9)}px`;
      }
    }
  });

  const finishDrag = (e) => {
    if (!activeDragItem || activeDragItem.itemId !== itemId) return;

    node.classList.remove('is-dragging');
    try {
      node.releasePointerCapture(e.pointerId);
    } catch (_) {}

    if (activeDragItem.hasMoved) {
      const finalLeft = node.style.left;
      const finalTop = node.style.top;
      const depthScale = calculatePerspectiveScale(currentSceneId, parseFloat(finalTop));

      if (!inventoryState.inventory[itemId]) {
        inventoryState.inventory[itemId] = { owned: true, displayed: true };
      }
      const existingUserScale = inventoryState.inventory[itemId]?.custom_pos?.user_scale 
        || inventoryState.inventory[itemId]?.user_scale 
        || 1.0;
      const existingRot = inventoryState.inventory[itemId]?.custom_pos?.rotation
        || inventoryState.inventory[itemId]?.rotation
        || 0;

      inventoryState.inventory[itemId].custom_pos = {
        left: finalLeft,
        top: finalTop,
        scale: depthScale,
        user_scale: existingUserScale,
        rotation: existingRot,
        scene_id: currentSceneId
      };
      saveState();
      recalculateSceneYSorting(currentSceneId);
      showToast(`✨ Đã lưu vị trí mới cho "${items.find(i => i.item_id === itemId)?.name_vi}"!`);
    } else {
      // Simple click -> open modal
      openItemModal(itemId);
    }

    activeDragItem = null;
  };

  node.addEventListener('pointerup', finishDrag);
  node.addEventListener('pointercancel', finishDrag);
}

// ========================================================
// Auto Y-Sorting (Perspective Depth Layering)
// ========================================================
function recalculateSceneYSorting(sceneId = currentSceneId) {
  const container = document.getElementById(`slots-container-${sceneId}`);
  if (!container) return;

  const nodes = Array.from(container.querySelectorAll('.slot-node[data-item-id]'));
  nodes.forEach(node => {
    const topVal = parseFloat(node.style.top) || 50;
    const isDragging = node.classList.contains('is-dragging');
    // Items positioned lower on screen (nearer foreground) layer on top of background items
    node.style.zIndex = isDragging ? 1000 : Math.round(topVal * 10);
  });
}

// ========================================================
// Interactive Scaling Helpers (Wheel, Corner Handle, Buttons)
// ========================================================
let zoomPillTimer = null;

function showZoomPill(itemId, text) {
  const node = document.querySelector(`.slot-node[data-item-id="${itemId}"]`) || 
               document.querySelector(`#node-${inventoryState.inventory[itemId]?.active_slot}`);
  if (!node) return;
  const pill = node.querySelector('.slot-zoom-pill');
  if (!pill) return;

  pill.textContent = `🔍 ${text}`;
  pill.classList.add('active');

  clearTimeout(zoomPillTimer);
  zoomPillTimer = setTimeout(() => {
    pill.classList.remove('active');
  }, 900);
}

function updateItemVisualScale(itemId) {
  const node = document.querySelector(`.slot-node[data-item-id="${itemId}"]`) || 
               document.querySelector(`#node-${inventoryState.inventory[itemId]?.active_slot}`);
  if (!node) {
    renderActiveSceneSlots();
    return;
  }

  const slotId = inventoryState.inventory[itemId]?.active_slot;
  const slotDef = slots.find(s => s.slot_id === slotId) || { base_width: 150 };
  const itemDef = items.find(i => i.item_id === itemId);
  if (!itemDef) return;

  const inv = inventoryState.inventory[itemId];
  const userScale = inv?.custom_pos?.user_scale || inv?.user_scale || 1.0;
  const depthScale = inv?.custom_pos?.scale || 1.0;

  const widthPx = Math.round(slotDef.base_width * (itemDef.scale_hint || 1.0) * depthScale * userScale);
  const shadowWidth = Math.round(widthPx * 0.85);

  const imgEl = node.querySelector('.slot-item-img');
  const shadowEl = node.querySelector('.slot-contact-shadow');
  const sunShadow = node.querySelector('.slot-sunlight-shadow');
  const scaleBadge = node.querySelector('.slot-scale-val');

  if (imgEl) imgEl.style.width = `${widthPx}px`;
  if (shadowEl) shadowEl.style.width = `${shadowWidth}px`;
  if (sunShadow) sunShadow.style.width = `${Math.round(widthPx * 0.9)}px`;
  if (scaleBadge) scaleBadge.textContent = `${Math.round(userScale * 100)}%`;

  // Update modal controls if currently open for this item
  const modalSlider = document.getElementById('modal-scale-slider');
  const modalBadge = document.getElementById('modal-scale-val');
  if (modalSlider && selectedItemId === itemId) {
    modalSlider.value = Math.round(userScale * 100);
  }
  if (modalBadge && selectedItemId === itemId) {
    modalBadge.textContent = `${Math.round(userScale * 100)}%`;
  }
}

function applyScale(itemId, newScale, saveImmediately = true) {
  const inv = inventoryState.inventory[itemId];
  if (!inv) return;

  newScale = Math.max(0.4, Math.min(2.2, Math.round(newScale * 100) / 100));

  if (!inv.custom_pos) {
    const slotId = inv.active_slot;
    const slotDef = slots.find(s => s.slot_id === slotId);
    if (slotDef) {
      inv.custom_pos = {
        left: slotDef.relative.left,
        top: slotDef.relative.top,
        scale: 1.0,
        user_scale: newScale,
        scene_id: currentSceneId
      };
    }
  } else {
    inv.custom_pos.user_scale = newScale;
  }
  inv.user_scale = newScale;

  updateItemVisualScale(itemId);

  if (saveImmediately) {
    saveState();
    showZoomPill(itemId, `${Math.round(newScale * 100)}%`);
  }
}

function changeItemScale(itemId, deltaOrTarget, isAbsolute = false, event = null) {
  if (event) event.stopPropagation();
  const inv = inventoryState.inventory[itemId];
  if (!inv) return;

  const currentScale = inv.custom_pos?.user_scale || inv.user_scale || 1.0;
  const newScale = isAbsolute ? deltaOrTarget : currentScale + deltaOrTarget;
  applyScale(itemId, newScale, true);

  const itemName = items.find(i => i.item_id === itemId)?.name_vi || 'Vật phẩm';
  showToast(`🔍 Kích thước "${itemName}": ${Math.round((inv.custom_pos?.user_scale || newScale) * 100)}%`);
}

function initWheelZoom(node, itemId) {
  node.addEventListener('wheel', (e) => {
    e.preventDefault();
    e.stopPropagation();

    const inv = inventoryState.inventory[itemId];
    if (!inv || !inv.displayed) return;

    const currentScale = inv.custom_pos?.user_scale || inv.user_scale || 1.0;
    const step = e.deltaY < 0 ? 0.05 : -0.05;
    const newScale = currentScale + step;

    applyScale(itemId, newScale, true);
  }, { passive: false });
}

function initResizeHandle(handleNode, node, itemId) {
  let isResizing = false;
  let startX = 0;
  let startY = 0;
  let initialScale = 1.0;

  handleNode.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.preventDefault();
    e.stopPropagation();

    isResizing = true;
    startX = e.clientX;
    startY = e.clientY;

    const inv = inventoryState.inventory[itemId];
    initialScale = inv?.custom_pos?.user_scale || inv?.user_scale || 1.0;

    handleNode.setPointerCapture(e.pointerId);
    handleNode.classList.add('is-resizing');
    node.classList.add('is-resizing-item');
  });

  handleNode.addEventListener('pointermove', (e) => {
    if (!isResizing) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    const delta = (dx + dy) / 220;
    const newScale = initialScale + delta;

    applyScale(itemId, newScale, false);
    showZoomPill(itemId, `${Math.round(Math.max(0.4, Math.min(2.2, newScale)) * 100)}%`);
  });

  const stopResize = (e) => {
    if (!isResizing) return;
    isResizing = false;
    handleNode.classList.remove('is-resizing');
    node.classList.remove('is-resizing-item');
    try {
      handleNode.releasePointerCapture(e.pointerId);
    } catch (_) {}

    const inv = inventoryState.inventory[itemId];
    const finalScale = inv?.custom_pos?.user_scale || inv?.user_scale || 1.0;
    saveState();
    showToast(`📐 Đã lưu tỷ lệ mới cho "${items.find(i => i.item_id === itemId)?.name_vi}": ${Math.round(finalScale * 100)}%`);
  };

  handleNode.addEventListener('pointerup', stopResize);
  handleNode.addEventListener('pointercancel', stopResize);
}

// ========================================================
// Interactive Rotation Helpers (Direct Handle, Action Bar, Modal)
// ========================================================
function applyRotation(itemId, newRot, saveImmediately = true) {
  const inv = inventoryState.inventory[itemId];
  if (!inv) return;

  // Snap to 0 if within +/- 3 deg
  if (Math.abs(newRot) < 3) newRot = 0;

  if (!inv.custom_pos) {
    const slotId = inv.active_slot;
    const slotDef = slots.find(s => s.slot_id === slotId);
    if (slotDef) {
      inv.custom_pos = {
        left: slotDef.relative.left,
        top: slotDef.relative.top,
        scale: 1.0,
        user_scale: 1.0,
        rotation: newRot,
        scene_id: currentSceneId
      };
    }
  } else {
    inv.custom_pos.rotation = newRot;
  }
  inv.rotation = newRot;

  updateItemVisualRotation(itemId);

  if (saveImmediately) {
    saveState();
    showZoomPill(itemId, `🔄 ${newRot}°`);
  }
}

function changeItemRotation(itemId, deltaDeg, isAbsolute = false, event = null) {
  if (event) event.stopPropagation();
  const inv = inventoryState.inventory[itemId];
  if (!inv) return;

  const currentRot = inv.custom_pos?.rotation || inv.rotation || 0;
  let newRot = isAbsolute ? deltaDeg : currentRot + deltaDeg;

  if (newRot > 180) newRot -= 360;
  if (newRot < -180) newRot += 360;

  applyRotation(itemId, newRot, true);

  const itemName = items.find(i => i.item_id === itemId)?.name_vi || 'Vật phẩm';
  showToast(`🔄 Góc xoay "${itemName}": ${newRot}°`);
}

function updateItemVisualRotation(itemId) {
  const node = document.querySelector(`.slot-node[data-item-id="${itemId}"]`) || 
               document.querySelector(`#node-${inventoryState.inventory[itemId]?.active_slot}`);
  if (!node) return;

  const inv = inventoryState.inventory[itemId];
  const rot = inv?.custom_pos?.rotation || inv?.rotation || 0;

  node.style.setProperty('--item-rot', `${rot}deg`);

  const rotBadge = node.querySelector('.slot-rotate-val');
  if (rotBadge) rotBadge.textContent = `${rot}°`;

  const shadowEl = node.querySelector('.slot-contact-shadow');
  if (shadowEl) {
    shadowEl.style.transform = `translateX(-50%) rotate(${rot}deg)`;
  }

  // Update modal controls if open
  const modalRotSlider = document.getElementById('modal-rotation-slider');
  const modalRotBadge = document.getElementById('modal-rotation-val');
  if (modalRotSlider && selectedItemId === itemId) {
    modalRotSlider.value = rot;
  }
  if (modalRotBadge && selectedItemId === itemId) {
    modalRotBadge.textContent = `${rot}°`;
  }
}

function initRotateHandle(handleNode, node, itemId) {
  let isRotating = false;
  let center = { x: 0, y: 0 };

  handleNode.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.preventDefault();
    e.stopPropagation();

    isRotating = true;
    const rect = node.getBoundingClientRect();
    center = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    };

    handleNode.setPointerCapture(e.pointerId);
    handleNode.classList.add('is-rotating');
    node.classList.add('is-rotating-item');
  });

  handleNode.addEventListener('pointermove', (e) => {
    if (!isRotating) return;

    const dx = e.clientX - center.x;
    const dy = e.clientY - center.y;
    // Calculate angle in degrees relative to vertical (top = 0 deg)
    let angleRad = Math.atan2(dy, dx);
    let angleDeg = Math.round((angleRad * 180 / Math.PI) + 90);

    // Normalize to -180 .. 180
    if (angleDeg > 180) angleDeg -= 360;
    if (angleDeg < -180) angleDeg += 360;

    applyRotation(itemId, angleDeg, false);
    showZoomPill(itemId, `🔄 ${angleDeg}°`);
  });

  const stopRotate = (e) => {
    if (!isRotating) return;
    isRotating = false;
    handleNode.classList.remove('is-rotating');
    node.classList.remove('is-rotating-item');
    try {
      handleNode.releasePointerCapture(e.pointerId);
    } catch (_) {}

    const inv = inventoryState.inventory[itemId];
    const finalRot = inv?.custom_pos?.rotation || inv?.rotation || 0;
    saveState();
    showToast(`🔄 Đã lưu góc xoay cho "${items.find(i => i.item_id === itemId)?.name_vi}": ${finalRot}°`);
  };

  handleNode.addEventListener('pointerup', stopRotate);
  handleNode.addEventListener('pointercancel', stopRotate);
}

function resetItemToDefaultSlot(itemId, event) {
  if (event) event.stopPropagation();
  if (inventoryState.inventory[itemId]?.custom_pos) {
    delete inventoryState.inventory[itemId].custom_pos;
  }
  if (inventoryState.inventory[itemId]?.user_scale) {
    delete inventoryState.inventory[itemId].user_scale;
  }
  if (inventoryState.inventory[itemId]?.rotation) {
    delete inventoryState.inventory[itemId].rotation;
  }
  saveState();
  renderActiveSceneSlots();
  showToast(`🎯 Đã khôi phục vị trí, góc xoay & kích thước chuẩn cho "${items.find(i => i.item_id === itemId)?.name_vi}"!`);
}

// ========================================================
// 5-Layer Interior Furniture Independent Toggles
// ========================================================
function toggleIndividualLayer(layerKey) {
  if (currentSceneId !== 'scene_interior') {
    switchScene('scene_interior');
  }

  interiorLayersState[layerKey] = !interiorLayersState[layerKey];
  applyInteriorLayerVisibility(layerKey);
  updateInteriorDockUI();

  const names = {
    rug: 'Thảm len dệt Thụy Sĩ',
    sofa: 'Sofa Ý Greige Linen',
    table: 'Bàn trà đôi Travertine & Sồi',
    armchair: 'Ghế bành Lông cừu & Óc chó',
    lamp: 'Đèn sàn kiến trúc Đồng phay'
  };
  const isNowOn = interiorLayersState[layerKey];
  showToast(`${isNowOn ? '✨ Đã hiện' : '👁️ Đã ẩn'}: ${names[layerKey] || layerKey}`);
  saveState();
}

function applyInteriorLayerVisibility(layerKey) {
  const el = document.getElementById(`layer-interior-${layerKey}`);
  if (el) {
    el.classList.toggle('is-hidden', !interiorLayersState[layerKey]);
  }
}

function toggleAllInteriorLayers() {
  if (currentSceneId !== 'scene_interior') {
    switchScene('scene_interior');
  }

  const anyActive = Object.values(interiorLayersState).some(Boolean);
  const targetState = !anyActive;

  for (const k of Object.keys(interiorLayersState)) {
    interiorLayersState[k] = targetState;
    applyInteriorLayerVisibility(k);
  }
  updateInteriorDockUI();

  showToast(targetState ? '🛋️ Đã hiện trọn bộ 5 lớp nội thất Luxury' : '👁️ Đã ẩn tất cả 5 lớp (Phòng khách trống nguyên bản)');
  saveState();
}

function updateInteriorDockUI() {
  const activeCount = Object.values(interiorLayersState).filter(Boolean).length;
  
  for (const [k, val] of Object.entries(interiorLayersState)) {
    const btn = document.getElementById(`btn-dock-${k}`);
    const statusText = document.getElementById(`status-dock-${k}`);
    if (btn) btn.classList.toggle('active', val);
    if (statusText) statusText.textContent = val ? 'BẬT' : 'TẮT';
  }

  const allLabel = document.getElementById('dock-all-label');
  if (allLabel) {
    allLabel.textContent = activeCount === 5 ? 'Ẩn hết (5/5)' : activeCount === 0 ? 'Hiện hết (0/5)' : `Tất cả (${activeCount}/5)`;
  }

  const headerBtn = document.getElementById('btn-toggle-salon');
  const headerText = document.getElementById('salon-status-text');
  if (headerBtn) headerBtn.classList.toggle('active', activeCount > 0);
  if (headerText) headerText.textContent = activeCount === 5 ? 'Bật (5/5)' : activeCount === 0 ? 'Tắt' : `Bật (${activeCount}/5)`;

  // Show / Hide dock based on active scene
  const dock = document.getElementById('interior-layer-dock');
  if (dock) {
    dock.classList.toggle('is-hidden', currentSceneId !== 'scene_interior');
  }
}

function toggleSlotGuides() {
  showSlotGuides = !showSlotGuides;
  const btn = document.getElementById('btn-toggle-guides');
  const statusText = document.getElementById('guides-status-text');
  if (btn && statusText) {
    btn.classList.toggle('active', showSlotGuides);
    statusText.textContent = showSlotGuides ? 'Bật' : 'Tắt';
  }
  ['scene_overview', 'scene_garden', 'scene_interior', 'scene_interior_wide', 'scene_bedroom'].forEach(sId => {
    const container = document.getElementById(`slots-container-${sId}`);
    if (container) {
      container.classList.toggle('hide-guides', !showSlotGuides);
    }
  });
  showToast(showSlotGuides ? '✨ Đã bật gợi ý vị trí' : '👁️ Đã ẩn gợi ý vị trí (Ngắm trọn khung cảnh)');
}

function renderActiveSceneSlots() {
  // Clear all slot containers
  ['scene_overview', 'scene_garden', 'scene_interior', 'scene_interior_wide'].forEach(sId => {
    const container = document.getElementById(`slots-container-${sId}`);
    if (container) {
      container.innerHTML = '';
      container.classList.toggle('hide-guides', !showSlotGuides);
    }
  });

  const activeSlots = slots.filter(s => s.scene_id === currentSceneId);
  const container = document.getElementById(`slots-container-${currentSceneId}`);
  if (!container) return;

  activeSlots.forEach(slotDef => {
    const placedItemId = inventoryState.slots[slotDef.slot_id];
    const itemDef = placedItemId ? items.find(i => i.item_id === placedItemId) : null;

    const node = document.createElement('div');
    node.className = `slot-node ${slotDef.anchor_point === 'center' ? 'anchor-center' : ''}`;
    node.id = `node-${slotDef.slot_id}`;
    node.style.zIndex = slotDef.z_index;

    if (!itemDef) {
      // Empty slot marker: minimalist Swiss pin + hover tooltip
      node.style.left = slotDef.relative.left;
      node.style.top = slotDef.relative.top;
      node.innerHTML = `
        <div class="slot-empty-marker" title="${slotDef.note}">
          <div class="slot-pin"></div>
          <span class="slot-tag">${slotDef.label}</span>
        </div>
      `;
      node.onclick = () => openSlotPicker(slotDef.slot_id);
    } else {
      // Check if item has custom position from user dragging, custom user scale, and custom rotation
      const invItem = inventoryState.inventory[placedItemId];
      const hasCustomPos = invItem?.custom_pos && invItem.custom_pos.scene_id === currentSceneId;

      const leftPos = hasCustomPos ? invItem.custom_pos.left : slotDef.relative.left;
      const topPos = hasCustomPos ? invItem.custom_pos.top : slotDef.relative.top;
      const depthScale = hasCustomPos ? (invItem.custom_pos.scale || 1.0) : 1.0;
      const userScale = invItem?.custom_pos?.user_scale || invItem?.user_scale || 1.0;
      const rotation = invItem?.custom_pos?.rotation || invItem?.rotation || 0;

      node.style.left = leftPos;
      node.style.top = topPos;
      node.setAttribute('data-item-id', itemDef.item_id);
      node.style.setProperty('--item-rot', `${rotation}deg`);

      const widthPx = Math.round(slotDef.base_width * (itemDef.scale_hint || 1.0) * depthScale * userScale);
      const shadowWidth = Math.round(widthPx * 0.85);

      // Realistic directional sunlight shadow for indoor items
      const sunShadowHtml = currentSceneId === 'scene_interior' ? `<div class="slot-sunlight-shadow" style="width: ${Math.round(widthPx * 0.9)}px;"></div>` : '';

      node.innerHTML = `
        <div class="slot-occupied-wrapper" title="${itemDef.name_vi} (${slotDef.label})">
          ${sunShadowHtml}
          <div class="slot-contact-shadow" style="width: ${shadowWidth}px; transform: translateX(-50%) rotate(${rotation}deg);"></div>
          <img src="${itemDef.asset_path}" alt="${itemDef.name_vi}" class="slot-item-img" style="width: ${widthPx}px;">
          <div class="slot-rotate-handle" title="Bấm giữ và xoay tròn để chỉnh góc nhìn">🔄</div>
          <div class="slot-resize-handle" title="Kéo góc để phóng to / thu nhỏ">⤡</div>
          <div class="slot-zoom-pill">🔍 ${Math.round(userScale * 100)}%</div>
          <div class="slot-action-bar">
            <span class="slot-action-name">${itemDef.name_vi}</span>
            <div class="slot-action-btns">
              <!-- Scale Controls -->
              <div class="slot-scale-control-group" title="Phóng to / Thu nhỏ (Lăn chuột trên hình hoặc bấm ➖ ➕)">
                <button class="slot-action-btn btn-scale-step" onclick="changeItemScale('${itemDef.item_id}', -0.1, false, event)" title="Thu nhỏ (-10%)">
                  <span class="btn-icon">➖</span>
                </button>
                <span class="slot-scale-val" title="Tỷ lệ kích thước">${Math.round(userScale * 100)}%</span>
                <button class="slot-action-btn btn-scale-step" onclick="changeItemScale('${itemDef.item_id}', 0.1, false, event)" title="Phóng to (+10%)">
                  <span class="btn-icon">➕</span>
                </button>
              </div>

              <!-- Rotation Controls -->
              <div class="slot-rotate-control-group" title="Xoay góc đồ vật (Hoặc kéo nút 🔄 trên đỉnh)">
                <button class="slot-action-btn btn-rotate-step" onclick="changeItemRotation('${itemDef.item_id}', -15, false, event)" title="Xoay trái 15°">
                  <span class="btn-icon">↺</span>
                </button>
                <span class="slot-rotate-val" title="Góc xoay hiện tại">${rotation}°</span>
                <button class="slot-action-btn btn-rotate-step" onclick="changeItemRotation('${itemDef.item_id}', 15, false, event)" title="Xoay phải 15°">
                  <span class="btn-icon">↻</span>
                </button>
              </div>

              <button class="slot-action-btn btn-drag-hint" title="Bấm giữ và kéo trên sàn/sân để sắp xếp"><span class="btn-icon">✋</span> Kéo xếp</button>
              <button class="slot-action-btn btn-reset-pos" onclick="resetItemToDefaultSlot('${itemDef.item_id}', event)" title="Đặt lại vị trí, góc xoay & kích thước chuẩn"><span class="btn-icon">🎯</span> Về chuẩn</button>
              <button class="slot-action-btn btn-remove-item" onclick="hideItem('${itemDef.item_id}', event)" title="Cất vào kho"><span class="btn-icon">📦</span> Cất đi</button>
            </div>
          </div>
        </div>
      `;

      // Enable drag & drop rearrangement
      initItemDrag(node, itemDef.item_id);

      // Enable mouse wheel zoom
      initWheelZoom(node, itemDef.item_id);

      // Enable corner resize handle
      const resizeHandle = node.querySelector('.slot-resize-handle');
      if (resizeHandle) {
        initResizeHandle(resizeHandle, node, itemDef.item_id);
      }

      // Enable rotation handle
      const rotateHandle = node.querySelector('.slot-rotate-handle');
      if (rotateHandle) {
        initRotateHandle(rotateHandle, node, itemDef.item_id);
      }
    }

    container.appendChild(node);
  });

  // Apply Auto Y-Sorting across all active scene nodes
  recalculateSceneYSorting(currentSceneId);
}

// ========================================================
// 4. Inventory List & Item Filtering
// ========================================================
function setInventoryFilter(filter) {
  activeFilter = filter;
  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.classList.toggle('active', tab.getAttribute('data-filter') === filter);
  });
  renderInventoryList();
}

function renderInventoryList() {
  inventoryListElem.innerHTML = '';

  // Update badge for custom items
  const badge = document.getElementById('custom-count-badge');
  if (badge) badge.textContent = (inventoryState.custom_items || []).length;

  if (activeFilter === 'custom') {
    const customList = inventoryState.custom_items || [];
    if (customList.length === 0) {
      inventoryListElem.innerHTML = `
        <div style="text-align: center; padding: 2.5rem 1rem; color: #94a3b8;">
          <span style="font-size: 2.5rem; display: block; margin-bottom: 0.6rem;">📥</span>
          <p style="font-size: 0.88rem; font-weight: 700; color: #f1f5f9; margin-bottom: 0.35rem;">Chưa có đồ tự tải lên</p>
          <p style="font-size: 0.75rem; line-height: 1.4;">Kéo thả ảnh PNG từ máy tính trực tiếp vào phòng hoặc bấm "Tải thêm đồ nội thất" ở trên.</p>
        </div>
      `;
      return;
    }

    customList.forEach(item => {
      const card = document.createElement('div');
      card.className = `inventory-card ${item.displayed !== false ? 'is-displayed' : ''}`;
      card.innerHTML = `
        <div class="card-thumb-wrap" style="background: rgba(56, 189, 248, 0.1);">
          <img src="${item.img_src}" class="card-thumb" alt="${item.name}">
        </div>
        <div class="card-body">
          <div class="card-header-row">
            <h3 class="card-title">${item.name}</h3>
            <span class="card-status-badge ${item.displayed !== false ? 'badge-displayed' : 'badge-owned'}">
              ${item.displayed !== false ? 'Đang hiện' : 'Đã ẩn'}
            </span>
          </div>
          <span class="card-slot-hint">📍 ${getSceneName(item.scene_id)} • Tỉ lệ: ${Math.round((item.scale || 1.0) * 100)}% • Góc: ${item.rotation || 0}°</span>
          <div class="card-actions">
            <button class="btn-card-toggle ${item.displayed !== false ? 'btn-card-hide' : 'btn-card-show'}" 
                    onclick="toggleCustomItemVisibility('${item.id}', event)">
              ${item.displayed !== false ? 'Ẩn' : 'Hiện'}
            </button>
            <button class="btn-card-toggle" style="background: rgba(239, 68, 68, 0.2); border-color: rgba(239, 68, 68, 0.4); color: #fca5a5;" 
                    onclick="deleteCustomItem('${item.id}', event)">
              Xóa
            </button>
          </div>
        </div>
      `;
      inventoryListElem.appendChild(card);
    });
    return;
  }

  const filtered = items.filter(item => {
    const invData = inventoryState.inventory[item.item_id] || { owned: false, displayed: false };
    if (activeFilter === 'all') return true;
    if (activeFilter === 'garden') return item.scene_type === 'garden';
    if (activeFilter === 'interior') return item.scene_type === 'interior';
    if (activeFilter === 'owned') return invData.owned;
    return true;
  });

  filtered.forEach(item => {
    const inv = inventoryState.inventory[item.item_id] || { owned: false, displayed: false, active_slot: null };
    const targetSlot = inv.active_slot ? slots.find(s => s.slot_id === inv.active_slot) : slots.find(s => s.slot_id === item.default_slot);

    const card = document.createElement('div');
    card.className = `inventory-card ${inv.displayed ? 'is-displayed' : ''} ${!inv.owned ? 'is-locked' : ''}`;

    let statusBadge = '';
    let actionBtn = '';

    if (inv.displayed) {
      statusBadge = `<span class="card-status-badge badge-displayed">Đang trưng bày</span>`;
      actionBtn = `<button class="btn-card-toggle btn-card-hide" onclick="hideItem('${item.item_id}', event)">Ẩn</button>`;
    } else if (inv.owned) {
      statusBadge = `<span class="card-status-badge badge-owned">Sẵn sàng</span>`;
      actionBtn = `<button class="btn-card-toggle btn-card-show" onclick="displayItem('${item.item_id}', event)">Hiện</button>`;
    } else {
      statusBadge = `<span class="card-status-badge badge-locked">🔒 Chưa mở</span>`;
      actionBtn = `<button class="btn-card-toggle btn-card-claim" onclick="claimReward('${item.item_id}', event)">Nhận thử</button>`;
    }

    card.innerHTML = `
      <div class="card-thumb-box" onclick="openItemModal('${item.item_id}')">
        <img src="${item.asset_path}" alt="${item.name_vi}" class="card-thumb">
      </div>
      <div class="card-details">
        <div class="card-title-row">
          <span class="card-name" onclick="openItemModal('${item.item_id}')">${item.name_vi}</span>
          ${statusBadge}
        </div>
        <div class="card-desc">${inv.owned ? (item.description_vi || item.name_en) : (inv.unlock_requirement || 'Phần thưởng nhiệm vụ')}</div>
        <div class="card-footer-row">
          <span class="card-slot-hint">📍 Slot: ${targetSlot?.label || 'Chưa gán'}</span>
          <div class="card-actions">
            ${actionBtn}
          </div>
        </div>
      </div>
    `;

    inventoryListElem.appendChild(card);
  });

  renderSummaryStats();
}

function renderSummaryStats() {
  const displayedCount = Object.values(inventoryState.slots).filter(Boolean).length;
  const ownedCount = Object.values(inventoryState.inventory).filter(i => i.owned).length;
  footerSummaryElem.textContent = `Đang trưng bày: ${displayedCount}/10 món • Đã sở hữu: ${ownedCount}/10`;
}

// ========================================================
// 5. Item Actions (Display, Hide, Claim)
// ========================================================
function displayItem(itemId, event, targetSlotId = null) {
  if (event) event.stopPropagation();

  const item = items.find(i => i.item_id === itemId);
  if (!item) return;

  const inv = inventoryState.inventory[itemId];
  if (!inv || !inv.owned) {
    showToast('⚠️ Bạn chưa sở hữu vật phẩm này! Hãy bấm nút Nhận thử.');
    return;
  }

  // Determine target slot
  const slotId = targetSlotId || item.default_slot;
  const slotDef = slots.find(s => s.slot_id === slotId);

  if (!slotDef) {
    showToast('⚠️ Không tìm thấy slot phù hợp!');
    return;
  }

  // Check if slot already has an item -> replace cleanly
  const previousItemId = inventoryState.slots[slotId];
  if (previousItemId && previousItemId !== itemId) {
    const prevItem = items.find(i => i.item_id === previousItemId);
    inventoryState.inventory[previousItemId].displayed = false;
    inventoryState.inventory[previousItemId].active_slot = null;
    showToast(`🔄 Đã thay thế "${prevItem?.name_vi || 'vật phẩm trước'}" bằng "${item.name_vi}"`);
  }

  // If item was already displayed in another slot, free that previous slot
  if (inv.active_slot && inv.active_slot !== slotId) {
    inventoryState.slots[inv.active_slot] = null;
  }

  // Assign to slot
  inventoryState.slots[slotId] = itemId;
  inv.displayed = true;
  inv.active_slot = slotId;

  saveState();

  // Auto switch scene if item belongs to a different scene
  if (currentSceneId !== slotDef.scene_id) {
    switchScene(slotDef.scene_id);
    showToast(`✨ Đã mở ${slotDef.scene_id === 'scene_garden' ? 'Khu Vườn' : 'Phòng Khách'} & trưng bày "${item.name_vi}"!`);
  } else {
    renderActiveSceneSlots();
    showToast(`✨ Đã gắn "${item.name_vi}" vào vị trí: ${slotDef.label}!`);
  }

  renderInventoryList();
}

function hideItem(itemId, event) {
  if (event) event.stopPropagation();

  const item = items.find(i => i.item_id === itemId);
  const inv = inventoryState.inventory[itemId];
  if (!inv) return;

  const currentSlotId = inv.active_slot;
  if (currentSlotId) {
    inventoryState.slots[currentSlotId] = null;
  }

  inv.displayed = false;
  inv.active_slot = null;

  saveState();
  renderActiveSceneSlots();
  renderInventoryList();

  showToast(`📦 Đã cất "${item?.name_vi || 'vật phẩm'}" về túi đồ!`);
}

function claimReward(itemId, event) {
  if (event) event.stopPropagation();

  const item = items.find(i => i.item_id === itemId);
  if (!item) return;

  if (!inventoryState.inventory[itemId]) {
    inventoryState.inventory[itemId] = { owned: false, displayed: false, active_slot: null };
  }

  inventoryState.inventory[itemId].owned = true;
  saveState();
  renderInventoryList();

  showToast(`🎁 Chúc mừng! Bạn đã nhận phần thưởng "${item.name_vi}"!`);
}

function claimAllTestItems() {
  items.forEach(item => {
    if (!inventoryState.inventory[item.item_id]) {
      inventoryState.inventory[item.item_id] = { owned: false, displayed: false, active_slot: null };
    }
    inventoryState.inventory[item.item_id].owned = true;
  });

  saveState();
  renderInventoryList();
  showToast('⚡ Đã mở khóa sở hữu toàn bộ 10 vật phẩm để test!');
}

function resetToInitialGift() {
  initDefaultInventoryState();
  switchScene('scene_garden');
  renderActiveSceneSlots();
  renderInventoryList();
  showToast('↺ Đã khôi phục trạng thái ban đầu: chỉ có Chậu hoa đất nung!');
}

// ========================================================
// 6. Item Detail Modal
// ========================================================
function openItemModal(itemId) {
  selectedItemId = itemId;
  const item = items.find(i => i.item_id === itemId);
  if (!item) return;

  const inv = inventoryState.inventory[itemId] || { owned: false, displayed: false, active_slot: null };
  const targetSlot = inv.active_slot ? slots.find(s => s.slot_id === inv.active_slot) : slots.find(s => s.slot_id === item.default_slot);

  document.getElementById('modal-item-title').textContent = item.name_vi;
  document.getElementById('modal-item-img').src = item.asset_path;
  document.getElementById('modal-item-name').textContent = item.name_vi;
  document.getElementById('modal-item-en').textContent = item.name_en;
  document.getElementById('modal-item-desc').textContent = item.description_vi;
  document.getElementById('modal-item-scene').textContent = item.scene_type === 'garden' ? 'Khu vườn ngoài trời' : 'Phòng khách';
  document.getElementById('modal-item-slot-name').textContent = targetSlot ? targetSlot.label : 'Chưa gán';

  // Score badge
  const scoreBadge = document.getElementById('modal-item-score');
  const overallScore = item.vision_score?.overall || 94;
  scoreBadge.textContent = `${overallScore}/100 (${overallScore >= 85 ? 'PASS' : 'RETRY'})`;

  // Status badge
  const statusBadge = document.getElementById('modal-item-status-badge');
  if (inv.displayed) {
    statusBadge.textContent = 'ĐANG HIỆN';
    statusBadge.className = 'item-status-badge badge-displayed';
  } else if (inv.owned) {
    statusBadge.textContent = 'SẴN SÀNG';
    statusBadge.className = 'item-status-badge badge-owned';
  } else {
    statusBadge.textContent = 'CHƯA MỞ';
    statusBadge.className = 'item-status-badge badge-locked';
  }

  // 6 Criteria progress bars
  const criteriaContainer = document.getElementById('modal-criteria-bars');
  criteriaContainer.innerHTML = '';

  const criteriaLabels = {
    perspective_fit: '1. Góc nhìn',
    scale_fit: '2. Tỷ lệ',
    lighting_fit: '3. Ánh sáng',
    shadow_fit: '4. Bóng đổ',
    visual_harmony: '5. Hòa hợp',
    slot_fit: '6. Vị trí slot'
  };

  const scores = item.vision_score || {
    perspective_fit: 94, scale_fit: 92, lighting_fit: 94,
    shadow_fit: 92, visual_harmony: 95, slot_fit: 96
  };

  for (const [key, label] of Object.entries(criteriaLabels)) {
    const val = scores[key] || 90;
    const row = document.createElement('div');
    row.className = 'criteria-row';
    row.innerHTML = `
      <span class="criteria-name">${label}</span>
      <div class="criteria-bar-track">
        <div class="criteria-bar-fill" style="width: ${val}%;"></div>
      </div>
      <span class="criteria-num">${val}</span>
    `;
    criteriaContainer.appendChild(row);
  }

  // Action Button in modal
  const btnAction = document.getElementById('modal-btn-action');
  if (inv.displayed) {
    btnAction.textContent = 'Ẩn khỏi Slot';
    btnAction.className = 'btn-primary btn-card-hide';
    btnAction.onclick = () => {
      hideItem(itemId);
      closeItemModal();
    };
  } else if (inv.owned) {
    btnAction.textContent = 'Trưng bày vào Slot';
    btnAction.className = 'btn-primary';
    btnAction.onclick = () => {
      displayItem(itemId);
      closeItemModal();
    };
  } else {
    btnAction.textContent = 'Nhận thưởng thử';
    btnAction.className = 'btn-primary btn-card-claim';
    btnAction.onclick = () => {
      claimReward(itemId);
      openItemModal(itemId);
    };
  }

  // Update scale slider and badge in modal
  const userScale = inv?.custom_pos?.user_scale || inv?.user_scale || 1.0;
  const scaleSlider = document.getElementById('modal-scale-slider');
  const scaleBadge = document.getElementById('modal-scale-val');
  if (scaleSlider) scaleSlider.value = Math.round(userScale * 100);
  if (scaleBadge) scaleBadge.textContent = `${Math.round(userScale * 100)}%`;

  // Update rotation slider and badge in modal
  const rotVal = inv?.custom_pos?.rotation || inv?.rotation || 0;
  const rotSlider = document.getElementById('modal-rotation-slider');
  const rotBadge = document.getElementById('modal-rotation-val');
  if (rotSlider) rotSlider.value = rotVal;
  if (rotBadge) rotBadge.textContent = `${rotVal}°`;

  itemModal.style.display = 'flex';
}

function onModalScaleInput(val) {
  if (!selectedItemId) return;
  const newScale = parseFloat(val) / 100;
  applyScale(selectedItemId, newScale, true);
  const badge = document.getElementById('modal-scale-val');
  if (badge) badge.textContent = `${Math.round(newScale * 100)}%`;
}

function stepCurrentModalScale(delta) {
  if (!selectedItemId) return;
  const inv = inventoryState.inventory[selectedItemId];
  const current = inv?.custom_pos?.user_scale || inv?.user_scale || 1.0;
  let newScale = Math.max(0.4, Math.min(2.2, Math.round((current + delta) * 100) / 100));
  applyScale(selectedItemId, newScale, true);
  const slider = document.getElementById('modal-scale-slider');
  const badge = document.getElementById('modal-scale-val');
  if (slider) slider.value = Math.round(newScale * 100);
  if (badge) badge.textContent = `${Math.round(newScale * 100)}%`;
}

function resetCurrentModalScale() {
  if (!selectedItemId) return;
  applyScale(selectedItemId, 1.0, true);
  const slider = document.getElementById('modal-scale-slider');
  const badge = document.getElementById('modal-scale-val');
  if (slider) slider.value = 100;
  if (badge) badge.textContent = '100%';
}

function onModalRotationInput(val) {
  if (!selectedItemId) return;
  const newRot = parseInt(val, 10) || 0;
  applyRotation(selectedItemId, newRot, true);
  const badge = document.getElementById('modal-rotation-val');
  if (badge) badge.textContent = `${newRot}°`;
}

function stepCurrentModalRotation(delta) {
  if (!selectedItemId) return;
  const inv = inventoryState.inventory[selectedItemId];
  const current = inv?.custom_pos?.rotation || inv?.rotation || 0;
  let newRot = current + delta;
  if (newRot > 180) newRot -= 360;
  if (newRot < -180) newRot += 360;
  applyRotation(selectedItemId, newRot, true);
  const slider = document.getElementById('modal-rotation-slider');
  const badge = document.getElementById('modal-rotation-val');
  if (slider) slider.value = newRot;
  if (badge) badge.textContent = `${newRot}°`;
}

function resetCurrentModalRotation() {
  if (!selectedItemId) return;
  applyRotation(selectedItemId, 0, true);
  const slider = document.getElementById('modal-rotation-slider');
  const badge = document.getElementById('modal-rotation-val');
  if (slider) slider.value = 0;
  if (badge) badge.textContent = '0°';
}

function closeItemModal(event) {
  if (event && event.target !== itemModal && !event.target.classList.contains('btn-close-modal')) return;
  itemModal.style.display = 'none';
}

// ========================================================
// 7. Slot Picker Modal (When clicking empty slot on stage)
// ========================================================
function openSlotPicker(slotId) {
  selectedSlotIdForPicker = slotId;
  const slotDef = slots.find(s => s.slot_id === slotId);
  if (!slotDef) return;

  document.getElementById('slot-picker-title').textContent = `Chọn vật phẩm cho: ${slotDef.label}`;
  document.getElementById('slot-picker-subtitle').textContent = `Loại đồ vật hợp lệ: ${slotDef.allowed_types.join(', ')}`;

  const grid = document.getElementById('slot-picker-items-grid');
  grid.innerHTML = '';

  // Filter items matching allowed_types
  const compatibleItems = items.filter(item => {
    return item.allowed_slots.includes(slotId) || slotDef.allowed_types.includes(item.type);
  });

  if (compatibleItems.length === 0) {
    grid.innerHTML = '<p style="color: #94a3b8; font-size: 0.8rem; grid-column: span 2;">Chưa có vật phẩm tương thích cho slot này.</p>';
  } else {
    compatibleItems.forEach(item => {
      const inv = inventoryState.inventory[item.item_id] || { owned: false };
      const card = document.createElement('div');
      card.className = 'slot-pick-item-card';

      card.innerHTML = `
        <img src="${item.asset_path}" alt="${item.name_vi}" class="slot-pick-thumb">
        <div>
          <div class="slot-pick-name">${item.name_vi}</div>
          <span style="font-size: 0.65rem; color: ${inv.owned ? '#34d399' : '#94a3b8'};">
            ${inv.owned ? '✓ Đã sở hữu (Bấm để đặt)' : '🔒 Chưa sở hữu'}
          </span>
        </div>
      `;

      card.onclick = () => {
        if (!inv.owned) {
          claimReward(item.item_id);
        }
        displayItem(item.item_id, null, slotId);
        closeSlotPicker();
      };

      grid.appendChild(card);
    });
  }

  slotPickerModal.style.display = 'flex';
}

function closeSlotPicker(event) {
  if (event && event.target !== slotPickerModal && !event.target.classList.contains('btn-close-modal')) return;
  slotPickerModal.style.display = 'none';
}

// ========================================================
// 8. Before / After Split Comparison Slider
// ========================================================
function toggleCompareMode() {
  isCompareMode = !isCompareMode;
  const btn = document.getElementById('btn-toggle-compare');
  btn.classList.toggle('active', isCompareMode);

  if (isCompareMode) {
    // Sync images to current scene
    const activeScene = scenes.find(s => s.scene_id === currentSceneId);
    document.getElementById('compare-img-before').src = activeScene?.image_path || 'assets/scenes/scene_garden.webp';
    document.getElementById('compare-img-after').src = activeScene?.image_path || 'assets/scenes/scene_garden.webp';

    // Clone active slots to the after-wrapper
    const previewContainer = document.getElementById('compare-active-items-preview');
    previewContainer.innerHTML = '';

    // If interior, include active luxury layers on the After side
    if (currentSceneId === 'scene_interior') {
      const layerAssets = [
        { key: 'rug', src: 'assets/items/layer_05_rug.png', zIndex: 2 },
        { key: 'sofa', src: 'assets/items/layer_01_sofa.png', zIndex: 3 },
        { key: 'table', src: 'assets/items/layer_03_table.png', zIndex: 4 },
        { key: 'armchair', src: 'assets/items/layer_02_armchair.png', zIndex: 5 },
        { key: 'lamp', src: 'assets/items/layer_04_lamp.png', zIndex: 6 }
      ];

      layerAssets.forEach(item => {
        if (interiorLayersState[item.key]) {
          const layerEl = document.createElement('img');
          layerEl.src = item.src;
          layerEl.className = 'scene-img overlay-layer';
          layerEl.style.position = 'absolute';
          layerEl.style.inset = '0';
          layerEl.style.width = '100%';
          layerEl.style.height = '100%';
          layerEl.style.objectFit = 'cover';
          layerEl.style.zIndex = item.zIndex;
          previewContainer.appendChild(layerEl);
        }
      });
    }

    const currentSlots = slots.filter(s => s.scene_id === currentSceneId);
    currentSlots.forEach(slotDef => {
      const placedItemId = inventoryState.slots[slotDef.slot_id];
      if (placedItemId) {
        const itemDef = items.find(i => i.item_id === placedItemId);
        if (itemDef) {
          const invItem = inventoryState.inventory[placedItemId];
          const hasCustomPos = invItem?.custom_pos && invItem.custom_pos.scene_id === currentSceneId;
          const leftPos = hasCustomPos ? invItem.custom_pos.left : slotDef.relative.left;
          const topPos = hasCustomPos ? invItem.custom_pos.top : slotDef.relative.top;
          const depthScale = hasCustomPos ? (invItem.custom_pos.scale || 1.0) : 1.0;
          const userScale = invItem?.custom_pos?.user_scale || invItem?.user_scale || 1.0;
          const rotation = invItem?.custom_pos?.rotation || invItem?.rotation || 0;

          const widthPx = Math.round(slotDef.base_width * (itemDef.scale_hint || 1.0) * depthScale * userScale);
          const shadowWidth = Math.round(widthPx * 0.85);
          const sunShadowHtml = currentSceneId === 'scene_interior' ? `<div class="slot-sunlight-shadow" style="width: ${Math.round(widthPx * 0.9)}px;"></div>` : '';

          const el = document.createElement('div');
          el.className = `slot-node ${slotDef.anchor_point === 'center' ? 'anchor-center' : ''}`;
          el.style.left = leftPos;
          el.style.top = topPos;
          el.style.zIndex = Math.round(parseFloat(topPos) * 10);
          el.style.setProperty('--item-rot', `${rotation}deg`);
          el.innerHTML = `
            <div class="slot-occupied-wrapper">
              ${sunShadowHtml}
              <div class="slot-contact-shadow" style="width: ${shadowWidth}px; transform: translateX(-50%) rotate(${rotation}deg);"></div>
              <img src="${itemDef.asset_path}" alt="${itemDef.name_vi}" class="slot-item-img" style="width: ${widthPx}px;">
            </div>
          `;
          previewContainer.appendChild(el);
        }
      }
    });

    compareContainer.style.display = 'block';
    setDividerPosition(50);
    showToast('↔️ So sánh Trước (Cảnh trống) và Sau (Đã trang trí theo Slot)');
  } else {
    compareContainer.style.display = 'none';
  }
}

function initCompareSlider() {
  function updateSlider(clientX) {
    const rect = compareContainer.getBoundingClientRect();
    let x = clientX - rect.left;
    x = Math.max(0, Math.min(rect.width, x));
    const percent = (x / rect.width) * 100;
    setDividerPosition(percent);
  }

  compareDivider.addEventListener('mousedown', (e) => {
    isDraggingSlider = true;
    e.preventDefault();
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDraggingSlider || !isCompareMode) return;
    updateSlider(e.clientX);
  });

  window.addEventListener('mouseup', () => {
    isDraggingSlider = false;
  });

  compareDivider.addEventListener('touchstart', () => {
    isDraggingSlider = true;
  });

  window.addEventListener('touchmove', (e) => {
    if (!isDraggingSlider || !isCompareMode) return;
    if (e.touches && e.touches[0]) {
      updateSlider(e.touches[0].clientX);
    }
  });

  window.addEventListener('touchend', () => {
    isDraggingSlider = false;
  });
}

function setDividerPosition(percent) {
  compareDivider.style.left = `${percent}%`;
  compareBeforeWrapper.style.width = `${percent}%`;
}

// ========================================================
// 9. AI Pipeline Modal Viewer
// ========================================================
async function openPipelineModal() {
  try {
    const res = await fetch('data/pipeline-report.json');
    const report = await res.json();

    // Summary cards
    const summaryCardsElem = document.getElementById('pipeline-summary-cards');
    summaryCardsElem.innerHTML = `
      <div class="summary-card">
        <div class="summary-num">${report.total_items}</div>
        <div class="summary-label">Tổng số vật phẩm V1</div>
      </div>
      <div class="summary-card">
        <div class="summary-num" style="color: #34d399;">${report.passed_items}</div>
        <div class="summary-label">Đã duyệt (Approved)</div>
      </div>
      <div class="summary-card">
        <div class="summary-num">${report.pass_rate}</div>
        <div class="summary-label">Tỷ lệ Pass (85+)</div>
      </div>
      <div class="summary-card">
        <div class="summary-num">${report.max_retries_allowed}</div>
        <div class="summary-label">Giới hạn Retry tối đa</div>
      </div>
    `;

    // Results table
    const tbody = document.getElementById('pipeline-table-body');
    tbody.innerHTML = '';

    report.results.forEach(r => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="font-weight: 700; color: #fff;">${r.name_vi}</td>
        <td><code>${r.slot_id}</code></td>
        <td>${r.criteria.perspective_fit}</td>
        <td>${r.criteria.scale_fit}</td>
        <td>${r.criteria.lighting_fit}</td>
        <td>${r.criteria.shadow_fit}</td>
        <td>${r.criteria.visual_harmony}</td>
        <td>${r.criteria.slot_fit}</td>
        <td style="font-weight: 800; color: #34d399;">${r.overall_score}/100</td>
        <td><span class="pass-pill">${r.decision}</span></td>
      `;
      tbody.appendChild(tr);
    });

    pipelineModal.style.display = 'flex';
  } catch (e) {
    showToast('⚠️ Không thể tải pipeline report: ' + e.message);
  }
}

function closePipelineModal(event) {
  if (event && event.target !== pipelineModal && !event.target.classList.contains('btn-close-modal')) return;
  pipelineModal.style.display = 'none';
}

// ========================================================
// 10. Toast Helper
// ========================================================
let toastTimer = null;
function showToast(msg) {
  if (!toastElem) return;
  toastElem.textContent = msg;
  toastElem.classList.add('show');

  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastElem.classList.remove('show');
  }, 3200);
}

// ========================================================
// 11. User-Uploaded Custom Furniture & Backgrounds System
// ========================================================
let selectedCustomItemId = null;

function getSceneName(sId) {
  if (sId === 'scene_overview') return 'Toàn cảnh';
  if (sId === 'scene_garden') return 'Khu vườn';
  if (sId === 'scene_interior') return 'Phòng khách thường';
  if (sId === 'scene_interior_wide') return 'Phòng khách góc rộng';
  if (sId === 'scene_bedroom') return 'Phòng ngủ tĩnh dưỡng';
  return sId || 'Phòng khách góc rộng';
}

function clearAllCustomFurniture() {
  if (!inventoryState.custom_items || inventoryState.custom_items.length === 0) {
    showToast('Phòng đang trống trơn rồi!');
    return;
  }
  const count = inventoryState.custom_items.length;
  inventoryState.custom_items = [];
  selectedCustomItemId = null;
  saveState();
  renderCustomItems();
  renderInventoryList();
  showToast(`🧹 Đã dọn sạch ${count} món đồ nội thất. Phòng đã trở lại trống 100%!`);
}

function initStageDropzone() {
  const stage = document.getElementById('scene-stage');
  const overlay = document.getElementById('stage-drop-overlay');
  if (!stage) return;

  stage.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (overlay) overlay.classList.add('is-active');
  });

  stage.addEventListener('dragleave', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.relatedTarget === null || !stage.contains(e.relatedTarget)) {
      if (overlay) overlay.classList.remove('is-active');
    }
  });

  stage.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (overlay) overlay.classList.remove('is-active');

    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    const rect = stage.getBoundingClientRect();
    const xPct = Math.max(5, Math.min(95, ((e.clientX - rect.left) / rect.width) * 100));
    const yPct = Math.max(5, Math.min(95, ((e.clientY - rect.top) / rect.height) * 100));

    handleFilesUpload(files, xPct, yPct);
  });

  // Deselect custom item when clicking on empty stage
  stage.addEventListener('pointerdown', (e) => {
    if (e.target === stage || e.target.classList.contains('scene-img') || e.target.id === 'custom-items-stage') {
      selectedCustomItemId = null;
      document.querySelectorAll('.custom-item-node').forEach(n => n.classList.remove('is-selected'));
    }
  });
}

function handleFurnitureUpload(event) {
  const files = event.target.files;
  if (!files || files.length === 0) return;
  handleFilesUpload(files, 50, 60);
  event.target.value = '';
}

async function handleFilesUpload(files, defaultXPct = 50, defaultYPct = 60) {
  if (!inventoryState.custom_items) inventoryState.custom_items = [];

  const { width: stageWidth, height: stageHeight } = getStageDimensions();
  let count = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const isImage = (file.type && file.type.startsWith('image/')) || /\.(png|jpe?g|webp|svg|gif|bmp)$/i.test(file.name);
    if (!isImage) continue;

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

    const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
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
    showToast(`🎉 Đã thêm ${count} ảnh tải lên! Kéo thân ảnh để di chuyển, lăn chuột để phóng to, kéo 4 góc để nắn phối cảnh.`);
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

  // Filter items by Player Profile (Only display unlocked items in Player Mode)
  let itemsToFilter = inventoryState.custom_items;
  if (typeof activePlayerId !== 'undefined' && activePlayerId !== 'player_master') {
    const unlockedIds = (typeof currentPlayerProfile !== 'undefined' && currentPlayerProfile?.unlocked_items) || [];
    itemsToFilter = itemsToFilter.filter(it => unlockedIds.includes(it.id));
  }

  const { width: stageWidth, height: stageHeight } = getStageDimensions();
  const sceneItems = itemsToFilter.filter(it => {
    if (it.displayed === false || it.visible === false) return false;
    if (it.scene_id === currentSceneId) return true;
    if ((currentSceneId === 'scene_interior_wide' || currentSceneId === 'scene_interior') &&
        (it.scene_id === 'scene_interior_wide' || it.scene_id === 'scene_interior' || it.scene_id === 'interior')) {
      return true;
    }
    return false;
  });

  const badge = document.getElementById('custom-count-badge');
  if (badge) badge.textContent = inventoryState.custom_items.length;

  sceneItems.forEach(item => {
    ensureItemCorners(item, stageWidth, stageHeight);

    const w = item.natural_width || 400;
    const h = item.natural_height || 300;
    const pts = getPixelCorners(item, stageWidth, stageHeight);
    const m = computeHomography(w, h, pts.tl, pts.tr, pts.br, pts.bl);

    const node = document.createElement('div');
    node.className = `perspective-item-node ${selectedCustomItemId === item.id ? 'is-selected' : ''}`;
    node.id = `perspective-node-${item.id}`;
    node.style.zIndex = item.z_index || Math.round(pts.br.y);

    const img = document.createElement('img');
    img.src = item.img_src;
    img.className = 'perspective-item-img';
    img.id = `perspective-img-${item.id}`;
    img.style.width = `${w}px`;
    img.style.height = `${h}px`;
    if (m) {
      img.style.transform = `matrix3d(${m.join(',')})`;
    }
    img.alt = item.name;

    // Interactive Hit-area for clicking / dragging anywhere on the image body
    const hitArea = document.createElement('div');
    hitArea.className = 'perspective-item-hitarea';
    hitArea.id = `perspective-hit-${item.id}`;
    hitArea.style.width = `${w}px`;
    hitArea.style.height = `${h}px`;
    if (m) {
      hitArea.style.transform = `matrix3d(${m.join(',')})`;
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
  const node = document.getElementById(`perspective-node-${itemId}`);
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
  polygon.setAttribute('points', `${pts.tl.x},${pts.tl.y} ${pts.tr.x},${pts.tr.y} ${pts.br.x},${pts.br.y} ${pts.bl.x},${pts.bl.y}`);
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
    handle.className = `perspective-corner-handle handle-${c.key}`;
    handle.id = `perspective-handle-${item.id}-${c.key}`;
    handle.style.left = `${c.pt.x}px`;
    handle.style.top = `${c.pt.y}px`;
    handle.setAttribute('data-corner', c.key);
    handle.title = `Kéo góc ${c.name} độc lập (chỉ góc này di chuyển)`;

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
    toolbar.style.left = `${Math.max(240, Math.min(stageWidth - 240, avgX))}px`;
    toolbar.style.top = `${Math.max(14, minY - 56)}px`;

    const btnVis = document.getElementById('btn-toggle-vis');
    if (btnVis) {
      btnVis.textContent = item.visible !== false ? '👁️ Ẩn' : '👁️ Hiện';
    }

    const scaleBadge = document.getElementById('ptool-scale-badge');
    if (scaleBadge) {
      scaleBadge.textContent = `${Math.round((item.user_scale || 1.0) * 100)}%`;
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

  const img = document.getElementById(`perspective-img-${item.id}`);
  const hitArea = document.getElementById(`perspective-hit-${item.id}`);
  if (img && m) img.style.transform = `matrix3d(${m.join(',')})`;
  if (hitArea && m) hitArea.style.transform = `matrix3d(${m.join(',')})`;

  const handleTL = document.getElementById(`perspective-handle-${item.id}-tl`);
  const handleTR = document.getElementById(`perspective-handle-${item.id}-tr`);
  const handleBR = document.getElementById(`perspective-handle-${item.id}-br`);
  const handleBL = document.getElementById(`perspective-handle-${item.id}-bl`);

  if (handleTL) { handleTL.style.left = `${pts.tl.x}px`; handleTL.style.top = `${pts.tl.y}px`; }
  if (handleTR) { handleTR.style.left = `${pts.tr.x}px`; handleTR.style.top = `${pts.tr.y}px`; }
  if (handleBR) { handleBR.style.left = `${pts.br.x}px`; handleBR.style.top = `${pts.br.y}px`; }
  if (handleBL) { handleBL.style.left = `${pts.bl.x}px`; handleBL.style.top = `${pts.bl.y}px`; }

  const polygon = document.querySelector('.perspective-polygon');
  if (polygon) {
    polygon.setAttribute('points', `${pts.tl.x},${pts.tl.y} ${pts.tr.x},${pts.tr.y} ${pts.br.x},${pts.br.y} ${pts.bl.x},${pts.bl.y}`);
  }

  const toolbar = document.getElementById('perspective-toolbar');
  if (toolbar && toolbar.style.display !== 'none') {
    const minY = Math.min(pts.tl.y, pts.tr.y, pts.br.y, pts.bl.y);
    const avgX = (pts.tl.x + pts.tr.x + pts.br.x + pts.bl.x) / 4;
    toolbar.style.left = `${Math.max(240, Math.min(stageWidth - 240, avgX))}px`;
    toolbar.style.top = `${Math.max(14, minY - 56)}px`;
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

  const hitArea = document.getElementById(`perspective-hit-${itemId}`);
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
    badge.textContent = `${Math.round((item.user_scale || 1.0) * 100)}%`;
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
  showToast(`🔍 Kích thước "${item.name}": ${Math.round((item.user_scale || 1.0) * 100)}%`);
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
  showToast(`↺ Đã khôi phục góc chữ nhật phẳng cho "${item.name}".`);
}

function toggleSelectedVisibility() {
  const item = (inventoryState.custom_items || []).find(it => it.id === selectedCustomItemId);
  if (!item) return;

  item.visible = item.visible === false ? true : false;
  item.displayed = item.visible;
  saveState();
  renderCustomItems();
  renderInventoryList();
  showToast(item.visible ? `✨ Đã hiển thị layer "${item.name}"` : `👁️ Đã ẩn layer "${item.name}"`);
}

function deleteSelectedPerspectiveItem() {
  const item = (inventoryState.custom_items || []).find(it => it.id === selectedCustomItemId);
  if (!item) return;

  const confirmed = confirm(`Bạn có chắc chắn muốn xóa layer "${item.name}" khỏi phòng không?`);
  if (!confirmed) return;

  const idx = inventoryState.custom_items.findIndex(it => it.id === selectedCustomItemId);
  if (idx >= 0) {
    inventoryState.custom_items.splice(idx, 1);
    selectedCustomItemId = null;
    saveState();
    renderCustomItems();
    renderInventoryList();
    showToast(`🗑️ Đã xóa layer "${item.name}".`);
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
  if (!confirm(`Bạn có chắc muốn xóa "${name}" không?`)) return;
  inventoryState.custom_items.splice(idx, 1);
  if (selectedCustomItemId === itemId) {
    selectedCustomItemId = null;
  }
  saveState();
  renderCustomItems();
  renderInventoryList();
  showToast(`🗑️ Đã xóa "${name}"`);
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
  item.name = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');

  const imgTemp = new Image();
  imgTemp.onload = () => {
    item.natural_width = imgTemp.naturalWidth;
    item.natural_height = imgTemp.naturalHeight;
    saveState();
    renderCustomItems();
    renderInventoryList();
    showToast(`🖼️ Đã đổi ảnh mới cho "${item.name}", giữ nguyên cấu hình 4 góc!`);
  };
  imgTemp.src = finalUrl;
  event.target.value = '';
}

async function saveSelectedPerspective() {
  const item = (inventoryState.custom_items || []).find(it => it.id === selectedCustomItemId);
  if (!item) return;

  await saveState();

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

  showToast(`💾 Đã lưu vị trí và cấu hình cho "${item.name}"! Lần sau mở trang sẽ giữ nguyên 100%.`);
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
    showToast(`🖼️ Đã đổi ảnh nền cho cảnh "${getSceneName(currentSceneId)}"`);
  };
  reader.readAsDataURL(file);
  event.target.value = '';
}

function resetCurrentSceneBackground() {
  if (inventoryState.custom_backgrounds && inventoryState.custom_backgrounds[currentSceneId]) {
    delete inventoryState.custom_backgrounds[currentSceneId];
    saveState();
    applySceneBackgrounds();
    showToast(`↺ Đã khôi phục ảnh nền gốc Thụy Sĩ cho cảnh "${getSceneName(currentSceneId)}"`);
  }
}

function applySceneBackgrounds() {
  const scenesList = ['scene_overview', 'scene_garden', 'scene_interior', 'scene_interior_wide', 'scene_bedroom'];
  scenesList.forEach(sId => {
    const customBg = inventoryState?.custom_backgrounds?.[sId];
    const layer = document.getElementById(`layer-${sId}`);
    if (layer) {
      const baseImg = layer.querySelector('.scene-img.base-layer');
      if (baseImg) {
        if (customBg) {
          baseImg.src = customBg;
        } else {
          if (currentDayNight === 'night' && (sId === 'scene_interior_wide' || sId === 'scene_bedroom')) {
            baseImg.src = `assets/scenes/${sId}_night.webp`;
          } else {
            baseImg.src = `assets/scenes/${sId}.webp`;
          }
        }
      }
    }
  });
}

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



// ========================================================
// PROGRESSIVE GAMEPLAY ENGINE (Master Blueprint & Multi-Player Progression)
// ========================================================

let activePlayerId = 'player_1';
let masterBlueprint = null;
let currentPlayerProfile = null;
let currentRewardChoiceA = null;
let currentRewardChoiceB = null;
let isAutoDayNightEnabled = true;

// 1. Load Master Blueprint from server
async function loadMasterBlueprint() {
  try {
    const res = await fetch('/api/master-blueprint');
    if (res.ok) {
      masterBlueprint = await res.json();
      console.log('Loaded Master Blueprint:', masterBlueprint.name, masterBlueprint.items.length, 'items');
    }
  } catch (err) {
    console.error('Error loading master blueprint:', err);
  }
}

// 2. Load Active Player Profile
async function loadPlayerProfile(playerId) {
  activePlayerId = playerId || 'player_1';
  try {
    const res = await fetch(`/api/player-state?playerId=${activePlayerId}`);
    if (res.ok) {
      currentPlayerProfile = await res.json();
    } else {
      currentPlayerProfile = {
        player_id: activePlayerId,
        created_at: new Date().toISOString(),
        unlocked_items: [],
        active_scene: 'scene_interior_wide',
        day_night_override: null
      };
    }
  } catch (err) {
    console.error('Error loading player profile:', err);
    currentPlayerProfile = {
      player_id: activePlayerId,
      unlocked_items: [],
      active_scene: 'scene_interior_wide'
    };
  }

  updatePlayerGameplayUI();
  syncRoomItemsWithMasterAndPlayer();
}

// 3. Update Header Buttons based on Player State
function updatePlayerGameplayUI() {
  const selectElem = document.getElementById('select-player-profile');
  if (selectElem) selectElem.value = activePlayerId;

  const btnWelcome = document.getElementById('btn-open-welcome-gift');
  const btnDaily = document.getElementById('btn-open-daily-reward');
  const adminTools = document.getElementById('admin-tools-group');

  if (activePlayerId === 'player_master') {
    // Admin Master Mode
    if (btnWelcome) btnWelcome.style.display = 'none';
    if (btnDaily) btnDaily.style.display = 'none';
    if (adminTools) adminTools.style.display = 'inline-flex';
    document.body.classList.add('is-admin-mode');
  } else {
    // Player Mode
    if (adminTools) adminTools.style.display = 'none';
    document.body.classList.remove('is-admin-mode');
    if (typeof toggleWalkablePainter === 'function') {
      toggleWalkablePainter(false);
    }

    const unlocked = currentPlayerProfile?.unlocked_items || [];
    if (unlocked.length === 0) {
      // Day 0: Show Welcome Starter Gift
      if (btnWelcome) btnWelcome.style.display = 'inline-flex';
      if (btnDaily) btnDaily.style.display = 'none';
    } else {
      // Day 1+: Show Daily 1-of-2 Reward
      if (btnWelcome) btnWelcome.style.display = 'none';
      if (btnDaily) btnDaily.style.display = 'inline-flex';
    }
  }
}

// 4. Sync Items on Stage: Master Blueprint + Player Unlocked Items
function syncRoomItemsWithMasterAndPlayer() {
  if (!masterBlueprint || !masterBlueprint.items) return;
  if (!inventoryState) inventoryState = { slots: {}, custom_items: [] };
  if (!Array.isArray(inventoryState.custom_items)) inventoryState.custom_items = [];

  // Strictly preserve all custom uploaded furniture items (never wipe them out!)
  const customUploadedItems = inventoryState.custom_items.filter(it =>
    !masterBlueprint.items.some(bp => bp.id === it.id)
  );

  if (activePlayerId === 'player_master') {
    // Admin Mode: load all 10 master items so Admin can view/edit them + all custom uploaded items
    inventoryState.custom_items = [
      ...masterBlueprint.items.map(it => ({
        id: it.id,
        name: it.name,
        img_src: it.img_src,
        scene_id: it.room,
        natural_width: it.natural_width,
        natural_height: it.natural_height,
        corners: { ...it.corners },
        user_scale: it.user_scale,
        z_index: it.z_index,
        displayed: true,
        visible: true
      })),
      ...customUploadedItems
    ];
  } else {
    // Player Mode: load items this player has unlocked + all player uploaded items!
    const unlockedIds = currentPlayerProfile?.unlocked_items || [];
    inventoryState.custom_items = [
      ...masterBlueprint.items
        .filter(it => unlockedIds.includes(it.id))
        .map(it => ({
          id: it.id,
          name: it.name,
          img_src: it.img_src,
          scene_id: it.room,
          natural_width: it.natural_width,
          natural_height: it.natural_height,
          corners: { ...it.corners },
          user_scale: it.user_scale,
          z_index: it.z_index,
          displayed: true,
          visible: true
        })),
      ...customUploadedItems
    ];
  }

  renderCustomItems();
}

// 5. Switch Player Profile
async function switchPlayerProfile(newPlayerId) {
  console.log('Switching to profile:', newPlayerId);
  if (newPlayerId !== 'player_master' && typeof toggleWalkablePainter === 'function') {
    toggleWalkablePainter(false);
  }
  await loadPlayerProfile(newPlayerId);
  showToast(`👤 Đã chuyển sang: ${newPlayerId === 'player_master' ? '👑 Admin (Master Blueprint)' : newPlayerId === 'player_1' ? 'Người Chơi 1' : 'Người Chơi 2'}`);
}

// 6. Real-time Clock & Auto Day/Night
function updateRealTimeClockAndLighting() {
  const now = new Date();
  const hours = now.getHours();
  const mins = now.getMinutes().toString().padStart(2, '0');
  const timeStr = `${hours}:${mins}`;

  const clockTimeElem = document.getElementById('clock-time-display');
  const clockTagElem = document.getElementById('clock-status-tag');

  if (clockTimeElem) clockTimeElem.textContent = timeStr;

  const isNight = hours >= 18 || hours < 6;

  if (isAutoDayNightEnabled) {
    currentDayNight = isNight ? 'night' : 'day';
    if (clockTagElem) {
      clockTagElem.textContent = isNight ? '🌙 Đêm (Tự động)' : '☀️ Ngày (Tự động)';
      clockTagElem.style.color = isNight ? '#818cf8' : '#fbbf24';
    }
  } else {
    if (clockTagElem) {
      clockTagElem.textContent = currentDayNight === 'night' ? '🌙 Đêm (Thủ công)' : '☀️ Ngày (Thủ công)';
      clockTagElem.style.color = '#38bdf8';
    }
  }

  // Update button label
  const btn = document.getElementById('btn-toggle-day-night');
  const icon = document.getElementById('day-night-icon');
  const label = document.getElementById('day-night-label');
  if (btn) btn.classList.toggle('is-night', currentDayNight === 'night');
  if (icon) icon.textContent = currentDayNight === 'night' ? '☀️' : '🌙';
  if (label) label.textContent = currentDayNight === 'night' ? 'Ban Ngày' : 'Ban Đêm';

  applySceneBackgrounds();
}

// Override toggle to allow temporary manual testing
function toggleDayNightMode() {
  isAutoDayNightEnabled = false;
  currentDayNight = currentDayNight === 'day' ? 'night' : 'day';
  updateRealTimeClockAndLighting();
  showToast(currentDayNight === 'night' 
    ? '🌙 Đã chuyển sang Ban Đêm (Chế độ xem thử)' 
    : '☀️ Đã chuyển sang Ban Ngày (Chế độ xem thử)');
}

// 7. Welcome Gift Modal (Ngày 1 Starter Gift)
function openWelcomeGiftModal() {
  const modal = document.getElementById('modal-welcome-gift');
  if (modal) {
    modal.classList.add('is-open');
    modal.style.setProperty('display', 'flex', 'important');
  }
}

function closeWelcomeGiftModal() {
  const modal = document.getElementById('modal-welcome-gift');
  if (modal) {
    modal.classList.remove('is-open');
    modal.style.setProperty('display', 'none', 'important');
  }
}

async function claimWelcomeGift() {
  if (!currentPlayerProfile) return;
  if (!currentPlayerProfile.unlocked_items.includes('sofa_luxury')) {
    currentPlayerProfile.unlocked_items.push('sofa_luxury');
  }

  // Save to server
  try {
    await fetch('/api/player-state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(currentPlayerProfile)
    });
  } catch (_) {}

  closeWelcomeGiftModal();
  updatePlayerGameplayUI();
  switchScene('scene_interior_wide');
  syncRoomItemsWithMasterAndPlayer();

  showToast('🎉 CHÚC MỪNG TÂN GIA! Bộ Sofa Thụy Sĩ sang trọng đã được đặt vào phòng khách của bạn!');
}

// 8. Daily Reward Modal (Pick 1 of 2 Choices)
function openDailyRewardModal() {
  if (!masterBlueprint || !Array.isArray(masterBlueprint.items)) {
    showToast('⚠️ Dữ liệu nội thất đang tải, vui lòng thử lại sau giây lát!');
    return;
  }
  if (!currentPlayerProfile) {
    currentPlayerProfile = {
      player_id: activePlayerId || 'player_1',
      unlocked_items: ['sofa_luxury'],
      active_scene: 'scene_interior_wide'
    };
  }

  const unlocked = currentPlayerProfile.unlocked_items || [];
  let livingUnowned = masterBlueprint.items.filter(it => it.room === 'scene_interior_wide' && !unlocked.includes(it.id));
  let bedroomUnowned = masterBlueprint.items.filter(it => it.room === 'scene_bedroom' && !unlocked.includes(it.id));

  // If both rooms are full, allow selecting from all items as bonus
  if (livingUnowned.length === 0 && bedroomUnowned.length === 0) {
    livingUnowned = masterBlueprint.items.filter(it => it.room === 'scene_interior_wide');
    bedroomUnowned = masterBlueprint.items.filter(it => it.room === 'scene_bedroom');
  }

  // Pick choices safely
  if (livingUnowned.length > 0 && bedroomUnowned.length > 0) {
    currentRewardChoiceA = livingUnowned[Math.floor(Math.random() * livingUnowned.length)];
    currentRewardChoiceB = bedroomUnowned[Math.floor(Math.random() * bedroomUnowned.length)];
  } else if (livingUnowned.length > 0) {
    currentRewardChoiceA = livingUnowned[0];
    currentRewardChoiceB = livingUnowned[1] || livingUnowned[0];
  } else if (bedroomUnowned.length > 0) {
    currentRewardChoiceA = bedroomUnowned[0];
    currentRewardChoiceB = bedroomUnowned[1] || bedroomUnowned[0];
  } else {
    currentRewardChoiceA = masterBlueprint.items[0];
    currentRewardChoiceB = masterBlueprint.items[1] || masterBlueprint.items[0];
  }

  if (!currentRewardChoiceA || !currentRewardChoiceB) {
    showToast('⚠️ Chưa tìm thấy quà thưởng phù hợp.');
    return;
  }

  // Populate Card A safely
  const imgA = document.getElementById('card-img-a');
  const titleA = document.getElementById('card-title-a');
  const descA = document.getElementById('card-desc-a');
  const btnA = document.getElementById('btn-choose-a');
  if (imgA) imgA.src = currentRewardChoiceA.img_src || 'assets/uploads/furniture/1794146054057_1qbf6w.png';
  if (titleA) titleA.textContent = currentRewardChoiceA.name;
  if (descA) descA.textContent = currentRewardChoiceA.desc;
  if (btnA) btnA.innerHTML = `<span>✨</span> Chọn Món Này (${currentRewardChoiceA.tag || 'Phòng Khách'})`;

  // Populate Card B safely
  const imgB = document.getElementById('card-img-b');
  const titleB = document.getElementById('card-title-b');
  const descB = document.getElementById('card-desc-b');
  const btnB = document.getElementById('btn-choose-b');
  if (imgB) imgB.src = currentRewardChoiceB.img_src || 'assets/items/luxury_chalet_bed.png';
  if (titleB) titleB.textContent = currentRewardChoiceB.name;
  if (descB) descB.textContent = currentRewardChoiceB.desc;
  if (btnB) btnB.innerHTML = `<span>✨</span> Chọn Món Này (${currentRewardChoiceB.tag || 'Phòng Ngủ'})`;

  const modal = document.getElementById('modal-daily-reward');
  if (modal) {
    modal.classList.add('is-open');
    modal.style.setProperty('display', 'flex', 'important');
  }
}

function closeDailyRewardModal() {
  const modal = document.getElementById('modal-daily-reward');
  if (modal) {
    modal.classList.remove('is-open');
    modal.style.setProperty('display', 'none', 'important');
  }
}

async function claimDailyReward(choice) {
  const chosenItem = choice === 'a' ? currentRewardChoiceA : currentRewardChoiceB;
  if (!chosenItem || !currentPlayerProfile) return;

  if (!currentPlayerProfile.unlocked_items.includes(chosenItem.id)) {
    currentPlayerProfile.unlocked_items.push(chosenItem.id);
  }

  // Save to server
  try {
    await fetch('/api/player-state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(currentPlayerProfile)
    });
  } catch (_) {}

  closeDailyRewardModal();
  updatePlayerGameplayUI();

  // Switch to target room and render
  switchScene(chosenItem.room);
  syncRoomItemsWithMasterAndPlayer();

  const roomName = chosenItem.room === 'scene_interior_wide' ? 'Phòng Khách' : 'Phòng Ngủ';
  showToast(`✨ Tuyệt vời! Bạn vừa mở khóa "${chosenItem.name}" và đặt ngay ngắn vào ${roomName}!`);
}

// 9. Reset Active Player to Day 0 (Empty House)
async function resetCurrentPlayer() {
  if (activePlayerId === 'player_master') {
    showToast('⚠️ Không thể reset chế độ Admin Master. Hãy chọn Player 1 hoặc Player 2.');
    return;
  }

  try {
    const res = await fetch('/api/player-reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId: activePlayerId })
    });
    if (res.ok) {
      const data = await res.json();
      currentPlayerProfile = data.state;
      updatePlayerGameplayUI();
      syncRoomItemsWithMasterAndPlayer();
      showToast(`↺ Đã reset tài khoản ${activePlayerId} về Ngày 0 (Cả 2 phòng trống hoàn toàn)!`);
    }
  } catch (err) {
    console.error('Reset error:', err);
  }
}

// 10. Admin Save Master Blueprint
async function saveMasterBlueprintFromAdmin() {
  if (activePlayerId !== 'player_master') return;
  // Update master blueprint item coordinates from current custom_items
  if (inventoryState && inventoryState.custom_items) {
    inventoryState.custom_items.forEach(cItem => {
      const bpItem = masterBlueprint.items.find(it => it.id === cItem.id);
      if (bpItem) {
        bpItem.corners = { ...cItem.corners };
        bpItem.user_scale = cItem.user_scale;
        bpItem.z_index = cItem.z_index;
      }
    });
  }

  try {
    const res = await fetch('/api/master-blueprint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(masterBlueprint)
    });
    if (res.ok) {
      showToast('💾 Đã lưu Master Blueprint thành công cho toàn bộ hệ thống!');
    }
  } catch (err) {
    console.error('Error saving blueprint:', err);
  }
}

// Initialize Progressive Gameplay Engine on DOM Load
window.addEventListener('DOMContentLoaded', async () => {
  await loadMasterBlueprint();
  await loadPlayerProfile('player_1');
  updateRealTimeClockAndLighting();
  setInterval(updateRealTimeClockAndLighting, 30000);
  initCompanionEngine();
});

/* ========================================================
   Autonomous Chibi Companion & Walkable Floor Painter Engine
======================================================== */

const CHIBI_CONFIGS = {
  mia: {
    id: 'mia',
    name: 'Mia',
    title: 'Áo kem dịu dàng',
    normalSprite: 'assets/characters/chibi-mia.png',
    waveSprite: 'assets/characters/chibi-mia.png',
    speed: 3.5,
    quotes: {
      plants: [
        'Hoa tươi làm căn phòng ngát hương thơm và bình yên quá! 🌸🌿',
        'Chăm sóc chậu cây nhỏ giúp tâm trí nhẹ nhõm sau ngày dài. 🌱✨',
        'Lá cây xanh mướt đầy sức sống, cùng hít một hơi thật sâu nào! 🍃'
      ],
      window: [
        'Dãy núi tuyết Alps hôm nay đẹp và thanh bình ghê! 🏔️❄️',
        'Nhìn tuyết rơi ngoài cửa kính thấy lòng tĩnh lặng lạ lùng... ❄️✨',
        'Thiên nhiên Thụy Sĩ hùng vĩ quá, thưởng thức ngụm trà nóng ngắm cảnh thôi! ☕'
      ],
      fireplace: [
        'Lò sưởi ấm sực luôn, chỉ muốn ngồi cuộn tròn đọc sách thôi! 🔥📖',
        'Tiếng lửa reo tí tách nghe thật êm tai và dễ chịu. 🔥☕',
        'Bên bếp lửa hồng ấm cúng, mọi mệt mỏi đều tan biến hết! ✨'
      ],
      piano: [
        'Khúc nhạc tuyết rơi vang lên thì chill phải biết! 🎹🎶',
        'Âm nhạc bên khung cửa tuyết trắng là liệu pháp chữa lành tuyệt nhất! 🎼'
      ],
      bed: [
        'Giường gỗ sồi thơm mùi tinh dầu thông, tối nay sẽ ngủ thật sâu giấc! 🛏️🌙',
        'Thảm mềm dưới chân dễ chịu quá, chúc bạn đêm nay ngủ ngon nhé! 🌟'
      ],
      sofa: [
        'Chiếc sofa này ngồi êm ái ngắm tuyết thì tuyệt cú mèo! 🛋️✨',
        'Tựa lưng vào ghế nhắm mắt thư giãn 5 phút nào bạn ơi! 💆'
      ],
      general: [
        'Hôm nay bạn nhớ uống đủ nước ấm thanh lọc cơ thể nhé! 💧✨',
        'Thả lỏng hai vai, hít vào thật sâu và thở ra mỉm cười nào~ 🌿😊',
        'Ngôi nhà Thụy Sĩ của chúng mình ấm cúng và an yên ghê! 🏡❤️'
      ],
      click: [
        'Chào bạn đồng hành! Chúc bạn ngày an lành và tràn đầy năng lượng! ✨💖',
        'Mình đang dạo quanh nhà ngắm cảnh tuyết đây, bạn thấy đẹp không? ❄️😊',
        'Nhớ chăm sóc sức khỏe và nghỉ ngơi điều độ bạn nhé! 🌿'
      ]
    }
  },
  anna: {
    id: 'anna',
    name: 'Anna',
    title: 'Áo xanh vui tươi',
    normalSprite: 'assets/characters/chibi-anna.png',
    waveSprite: 'assets/characters/chibi-anna-wave.png',
    speed: 4.2,
    quotes: {
      plants: [
        'Chậu cây này tươi tốt quá, cùng tưới thêm chút nước nào! 🌱💧',
        'Màu xanh lá làm mắt mình thư giãn tuyệt vời! 🌿✨'
      ],
      window: [
        'Tuyết rơi dày rồi, ra ban công hít thở không khí trong lành thôi! 🏔️❄️',
        'View đỉnh núi Alps hùng vĩ quá đi mất! ⛷️✨'
      ],
      fireplace: [
        'Ấm áp quá đi thôi! Ngồi sưởi tay một chút nào! 🔥🙌',
        'Lửa ấm xua tan cái lạnh vùng núi tuyết! ☕🔥'
      ],
      piano: [
        'Để mình đàn thử một bản nhạc sôi động chào ngày mới nhé! 🎹🎶',
        'Tiếng dương cầm ngân vang khắp căn nhà Thụy Sĩ! 🎼'
      ],
      bed: [
        'Phòng ngủ ấm áp và thơm dịu, chuẩn bị cho giấc ngủ êm đềm! 🛏️🌟'
      ],
      sofa: [
        'Sofa rộng rãi êm ái, ngồi đây lập kế hoạch sống khỏe là chuẩn bài! 🛋️'
      ],
      general: [
        'Cùng vươn vai khởi động 2 phút cho cơ thể dẻo dai nào! 🏃‍♀️✨',
        'Hôm nay bạn đã hoàn thành nhiệm vụ sức khỏe chưa nè? 🏆💪'
      ],
      click: [
        'Chào bạn! Rất vui được đồng hành cùng bạn hôm nay! 👋✨',
        'Cùng nhau giữ thói quen sống khỏe mỗi ngày nhé! 🌟💪'
      ]
    }
  },
  leo: {
    id: 'leo',
    name: 'Leo',
    title: 'Áo xanh thám hiểm',
    normalSprite: 'assets/characters/chibi-leo.png',
    waveSprite: 'assets/characters/chibi-leo.png',
    speed: 4.0,
    quotes: {
      plants: ['Thực vật vùng núi Alps có sức sống bền bỉ thật! 🌲🌱'],
      window: ['Địa hình núi tuyết phía xa kia trông kỳ vĩ quá! 🏔️🧭'],
      fireplace: ['Ngọn lửa lò sưởi thắp sáng cả gian phòng khách! 🔥✨'],
      piano: ['Giai điệu du dương tiếp thêm năng lượng thám hiểm! 🎹🎶'],
      bed: ['Nghỉ ngơi thật tốt để sẵn sàng cho chuyến phiêu lưu ngày mai! 🛏️⛺'],
      sofa: ['Trạm dừng chân lý tưởng sau những giờ làm việc căng thẳng! 🛋️'],
      general: [
        'Uống đủ nước là chìa khóa duy trì thể lực dẻo dai đấy! 💧🧗',
        'Mỗi bước đi đều đưa chúng ta đến một phiên bản khỏe mạnh hơn! 🌟'
      ],
      click: [
        'Chào đồng đội! Hôm nay chúng ta cùng chinh phục mục tiêu nào? 🧭✨'
      ]
    }
  },
  ben: {
    id: 'ben',
    name: 'Ben',
    title: 'Áo navy ấm áp',
    normalSprite: 'assets/characters/chibi-ben.png',
    waveSprite: 'assets/characters/chibi-ben-chao.png',
    speed: 3.2,
    quotes: {
      plants: ['Cây xanh tạo nên không gian tĩnh tại để suy ngẫm. 🌿🍵'],
      window: ['Ngắm nhìn tuyết rơi chậm rãi giúp tâm trí lắng dịu. ❄️🏔️'],
      fireplace: ['Bên lò sưởi ấm cúng, thưởng thức một tách trà thảo mộc. 🔥🫖'],
      piano: ['Âm điệu nhẹ nhàng xua tan mọi căng thẳng lo âu. 🎹🎼'],
      bed: ['Giấc ngủ chất lượng là liều thuốc phục hồi quý giá nhất. 🛏️🌙'],
      sofa: ['Tĩnh tâm ngồi nghỉ ngơi, buông bỏ muộn phiền ngoài khung cửa. 🛋️'],
      general: [
        'Thong thả thôi bạn ơi, sức khỏe là một hành trình dài bền bỉ. 🌿',
        'Nhớ giữ ấm cơ thể trong những ngày trời lạnh nhé! 🧣'
      ],
      click: [
        'Chào bạn! Mong bạn luôn tìm thấy sự bình an trong ngôi nhà này. 👋🍵'
      ]
    }
  },
  lily: {
    id: 'lily',
    name: 'Lily',
    title: 'Áo tím ngọt ngào',
    normalSprite: 'assets/characters/chibi-lily.png',
    waveSprite: 'assets/characters/chibi-lily-heart.png',
    speed: 3.6,
    quotes: {
      plants: ['Những bông hoa nhỏ xinh này đáng yêu quá chừng! 🌸💖'],
      window: ['Khung cảnh tuyết trắng như trong truyện cổ tích vậy! ❄️✨'],
      fireplace: ['Ấm áp và ngọt ngào bên ngọn lửa bập bùng! 🔥💕'],
      piano: ['Những nốt nhạc tình cảm gửi trọn yêu thương vào không gian! 🎹🎶'],
      bed: ['Chiếc giường êm ái như một đám mây bồng bềnh! 🛏️☁️'],
      sofa: ['Thư giãn trên sofa và nghĩ về những điều vui vẻ hôm nay nào! 🛋️✨'],
      general: [
        'Yêu thương bản thân bắt đầu từ việc chăm sóc giấc ngủ và dinh dưỡng! 💖',
        'Cười lên một cái cho ngày mới thật rạng rỡ nha! 😊✨'
      ],
      click: [
        'Thả tim cho bạn nè! Cảm ơn bạn vì đã luôn cố gắng mỗi ngày! 💖✨'
      ]
    }
  }
};

let currentCompanionId = 'mia';
let companionState = {
  x: 45,
  y: 78,
  targetX: 45,
  targetY: 78,
  isWalking: false,
  isWaving: false,
  facingLeft: false,
  lastTimestamp: null,
  speechTimeout: null,
  nextMoveTimeout: null,
  idleQuoteInterval: null
};

// Walkable Painter State
let walkablePainter = {
  active: false,
  tool: 'brush', // 'brush' or 'eraser'
  brushSize: 45,
  isDrawing: false,
  canvas: null,
  ctx: null,
  cachedMaskData: {} // sceneId -> ImageData
};

// 1. Initialize Companion Engine
function initCompanionEngine() {
  const savedCompanion = localStorage.getItem('hc_wellness_active_companion');
  if (savedCompanion && CHIBI_CONFIGS[savedCompanion]) {
    currentCompanionId = savedCompanion;
  }
  const selectElem = document.getElementById('select-active-companion');
  if (selectElem) selectElem.value = currentCompanionId;

  initWalkablePainterCanvas();
  applyCompanionAppearance();

  // Set initial position based on active scene
  resetCompanionPositionForScene(currentSceneId);

  // Start step animation loop
  requestAnimationFrame(companionAnimationStep);

  // Periodic idle speech check (every 32s)
  if (companionState.idleQuoteInterval) clearInterval(companionState.idleQuoteInterval);
  companionState.idleQuoteInterval = setInterval(triggerPeriodicCompanionSpeech, 32000);

  // Schedule first movement
  scheduleNextCompanionMove(4000);
}

// 2. Change Active Companion
function changeActiveCompanion(companionId) {
  if (!CHIBI_CONFIGS[companionId]) return;
  currentCompanionId = companionId;
  localStorage.setItem('hc_wellness_active_companion', companionId);
  applyCompanionAppearance();
  showToast(`🐾 Đã chọn bạn đồng hành: ${CHIBI_CONFIGS[companionId].name} (${CHIBI_CONFIGS[companionId].title})`);
  showCompanionSpeech(`Chào bạn! Mình là ${CHIBI_CONFIGS[companionId].name}, rất vui được ở cùng bạn trong biệt thự này! ✨`, 5000);
}

function applyCompanionAppearance() {
  const spriteEl = document.getElementById('chibi-sprite-el');
  if (!spriteEl) return;
  const cfg = CHIBI_CONFIGS[currentCompanionId] || CHIBI_CONFIGS.mia;
  const spriteUrl = companionState.isWaving ? cfg.waveSprite : cfg.normalSprite;
  spriteEl.style.backgroundImage = `url("${spriteUrl}")`;
}

// 3. Companion Movement & Target Selection
function resetCompanionPositionForScene(sceneId) {
  if (sceneId === 'scene_bedroom') {
    companionState.x = 24;
    companionState.y = 82;
  } else if (sceneId === 'scene_garden') {
    companionState.x = 50;
    companionState.y = 78;
  } else {
    companionState.x = 42;
    companionState.y = 78;
  }
  companionState.targetX = companionState.x;
  companionState.targetY = companionState.y;
  companionState.isWalking = false;
  updateCompanionElementPosition();
}

function onSceneChangedForCompanion(sceneId) {
  loadWalkableMaskForScene(sceneId);
  resetCompanionPositionForScene(sceneId);
  hideCompanionSpeech();
  scheduleNextCompanionMove(5000);
}

function scheduleNextCompanionMove(delayMs = null) {
  if (companionState.nextMoveTimeout) clearTimeout(companionState.nextMoveTimeout);
  const waitTime = delayMs ?? (7000 + Math.random() * 9000); // 7 to 16 seconds
  companionState.nextMoveTimeout = setTimeout(() => {
    if (!companionState.isWalking && !companionState.isWaving) {
      pickNextWalkableTarget();
    }
  }, waitTime);
}

function pickNextWalkableTarget() {
  let attempts = 0;
  let found = false;
  let candidateX = companionState.x;
  let candidateY = companionState.y;

  const minX = currentSceneId === 'scene_bedroom' ? 18 : 16;
  const maxX = currentSceneId === 'scene_bedroom' ? 82 : 82;
  const minY = currentSceneId === 'scene_bedroom' ? 66 : 62;
  const maxY = 93;

  while (attempts < 60 && !found) {
    attempts++;
    const testX = minX + Math.random() * (maxX - minX);
    const testY = minY + Math.random() * (maxY - minY);
    if (isPointWalkable(testX, testY, currentSceneId)) {
      // Must move a sensible distance (at least 8% away)
      const dist = Math.hypot(testX - companionState.x, testY - companionState.y);
      if (dist >= 8) {
        candidateX = testX;
        candidateY = testY;
        found = true;
      }
    }
  }

  if (found) {
    companionState.targetX = candidateX;
    companionState.targetY = candidateY;
    companionState.isWalking = true;
    companionState.facingLeft = candidateX < companionState.x;

    const companionEl = document.getElementById('home-chibi-companion');
    if (companionEl) {
      companionEl.classList.add('is-walking');
      companionEl.classList.toggle('facing-left', companionState.facingLeft);
    }
  } else {
    // Retry in 4 seconds
    scheduleNextCompanionMove(4000);
  }
}

// 4. Animation Step Loop (Fluid Movement + Depth Y-Sorting)
function companionAnimationStep(timestamp) {
  if (!companionState.lastTimestamp) companionState.lastTimestamp = timestamp;
  const dt = Math.min(0.1, (timestamp - companionState.lastTimestamp) / 1000);
  companionState.lastTimestamp = timestamp;

  if (companionState.isWalking) {
    const cfg = CHIBI_CONFIGS[currentCompanionId] || CHIBI_CONFIGS.mia;
    const speed = cfg.speed || 3.5; // percentage units per second
    const dx = companionState.targetX - companionState.x;
    const dy = companionState.targetY - companionState.y;
    const dist = Math.hypot(dx, dy);

    if (dist <= 0.6) {
      // Arrived at destination
      companionState.x = companionState.targetX;
      companionState.y = companionState.targetY;
      companionState.isWalking = false;

      const companionEl = document.getElementById('home-chibi-companion');
      if (companionEl) companionEl.classList.remove('is-walking');

      onCompanionArrivedAtTarget();
      scheduleNextCompanionMove();
    } else {
      // Move closer
      const step = speed * dt;
      companionState.x += (dx / dist) * Math.min(dist, step);
      companionState.y += (dy / dist) * Math.min(dist, step);
    }

    updateCompanionElementPosition();
  }

  requestAnimationFrame(companionAnimationStep);
}

function updateCompanionElementPosition() {
  const companionEl = document.getElementById('home-chibi-companion');
  if (!companionEl) return;
  companionEl.style.left = `${companionState.x.toFixed(2)}%`;
  companionEl.style.top = `${companionState.y.toFixed(2)}%`;

  // Dynamic Depth Y-Sorting: lower Y goes behind furniture, higher Y goes in front
  const dynamicZIndex = Math.round(companionState.y * 10);
  companionEl.style.zIndex = dynamicZIndex;
}

// 5. Contextual Inspection & Speech Triggers
function onCompanionArrivedAtTarget() {
  const cfg = CHIBI_CONFIGS[currentCompanionId] || CHIBI_CONFIGS.mia;
  const quotes = cfg.quotes || {};

  // Check proximity to key scene focal points
  let quoteCategory = 'general';
  const x = companionState.x;
  const y = companionState.y;

  if (currentSceneId === 'scene_bedroom') {
    if (x > 65 && y < 78) {
      quoteCategory = 'window';
    } else if (y >= 75) {
      quoteCategory = 'bed';
    } else {
      quoteCategory = 'general';
    }
  } else if (currentSceneId === 'scene_garden') {
    if (x < 48 && y < 76) {
      quoteCategory = 'window'; // Looking at turquoise alpine lake and snow peaks
    } else if (x >= 48 && y < 76) {
      quoteCategory = 'plants'; // Alpine pine trees and fresh garden flowers
    } else {
      quoteCategory = 'general'; // Strolling on the sunlit terrace
    }
  } else {
    // Living Room
    if (x < 38 && y < 74) {
      quoteCategory = 'window'; // Mountain window view
    } else if (x >= 38 && x <= 62 && y < 70) {
      quoteCategory = 'fireplace'; // Warm hearth
    } else if (x >= 60 && y < 78) {
      quoteCategory = 'piano'; // Grand piano
    } else if (y >= 84 && x >= 30 && x <= 65) {
      quoteCategory = 'sofa'; // Main sofa & coffee table
    } else if (x >= 55 && y >= 70 && y <= 85) {
      quoteCategory = 'plants'; // Plants / fresh flowers
    } else {
      quoteCategory = 'general';
    }
  }

  // 65% chance to say a contextual quote when stopping at an interesting spot
  if (Math.random() < 0.65) {
    const list = quotes[quoteCategory] || quotes.general || [];
    if (list.length > 0) {
      const chosen = list[Math.floor(Math.random() * list.length)];
      showCompanionSpeech(chosen, 6000);
    }
  }
}

function triggerPeriodicCompanionSpeech() {
  if (companionState.isWalking || companionState.isWaving) return;
  const cfg = CHIBI_CONFIGS[currentCompanionId] || CHIBI_CONFIGS.mia;
  const list = cfg.quotes?.general || [];
  if (list.length > 0) {
    const quote = list[Math.floor(Math.random() * list.length)];
    showCompanionSpeech(quote, 5500);
  }
}

function handleCompanionClick(event) {
  if (event) event.stopPropagation();
  const cfg = CHIBI_CONFIGS[currentCompanionId] || CHIBI_CONFIGS.mia;

  // Pause movement
  companionState.isWalking = false;
  companionState.isWaving = true;

  const companionEl = document.getElementById('home-chibi-companion');
  if (companionEl) {
    companionEl.classList.remove('is-walking');
    companionEl.classList.add('is-waving');
  }

  applyCompanionAppearance();

  const clickQuotes = cfg.quotes?.click || ['Chào bạn đồng hành! Chúc bạn ngày an lành! ✨'];
  const quote = clickQuotes[Math.floor(Math.random() * clickQuotes.length)];
  showCompanionSpeech(quote, 6000);

  // Resume after 4 seconds
  setTimeout(() => {
    companionState.isWaving = false;
    if (companionEl) companionEl.classList.remove('is-waving');
    applyCompanionAppearance();
    scheduleNextCompanionMove(4000);
  }, 4200);
}

function showCompanionSpeech(text, durationMs = 6000) {
  const bubble = document.getElementById('chibi-speech-bubble');
  const textEl = document.getElementById('chibi-speech-text');
  if (!bubble || !textEl) return;

  textEl.textContent = text;
  bubble.style.display = 'block';

  if (companionState.speechTimeout) clearTimeout(companionState.speechTimeout);
  companionState.speechTimeout = setTimeout(() => {
    hideCompanionSpeech();
  }, durationMs);
}

function hideCompanionSpeech() {
  const bubble = document.getElementById('chibi-speech-bubble');
  if (bubble) bubble.style.display = 'none';
  if (companionState.speechTimeout) clearTimeout(companionState.speechTimeout);
}

// 6. Walkable Collision Engine & Presets
function isPointWalkable(xPct, yPct, sceneId) {
  // If custom painted mask exists in cached data, sample it:
  const mask = walkablePainter.cachedMaskData[sceneId];
  if (mask && mask.width > 0 && mask.height > 0) {
    const px = Math.floor((xPct / 100) * mask.width);
    const py = Math.floor((yPct / 100) * mask.height);
    if (px >= 0 && px < mask.width && py >= 0 && py < mask.height) {
      const idx = (py * mask.width + px) * 4;
      // Walkable if alpha > 30 and green/blue channel > 20
      return mask.data[idx + 3] > 30 && (mask.data[idx + 1] > 20 || mask.data[idx] > 20);
    }
  }

  // Fallback to geometric default walkable floor
  if (sceneId === 'scene_bedroom') {
    if (xPct < 15 || xPct > 85 || yPct < 64 || yPct > 93) return false;
    // Obstacle: Center Bed Mattress
    if (xPct >= 33 && xPct <= 67 && yPct >= 65 && yPct <= 85) return false;
    // Obstacle: Left Armchair
    if (xPct >= 16 && xPct <= 27 && yPct >= 72 && yPct <= 85) return false;
    return true;
  }

  // Garden Terrace Walkable Floor
  if (sceneId === 'scene_garden') {
    if (xPct < 15 || xPct > 85 || yPct < 62 || yPct > 93) return false;
    return true;
  }

  // Living Room Default Walkable Floor
  if (xPct < 15 || xPct > 85 || yPct < 60 || yPct > 94) return false;
  // Obstacle: Center Sofa Cushion Core (allow walking behind at 60-65% or in front at >83%)
  if (xPct >= 28 && xPct <= 60 && yPct >= 68 && yPct <= 82) return false;
  // Obstacle: Grand Piano Base
  if (xPct >= 62 && xPct <= 77 && yPct >= 50 && yPct <= 72) return false;
  // Obstacle: Fireplace Hearth Front Lip
  if (xPct >= 40 && xPct <= 58 && yPct >= 50 && yPct <= 61) return false;

  return true;
}

// 7. Admin Walkable Painter Tools (Canvas Overlay)
function initWalkablePainterCanvas() {
  const canvas = document.getElementById('walkable-painter-canvas');
  if (!canvas) return;
  walkablePainter.canvas = canvas;
  walkablePainter.ctx = canvas.getContext('2d', { willReadFrequently: true });

  const syncCanvasSize = () => {
    const stage = document.getElementById('scene-stage');
    if (stage) {
      canvas.width = stage.clientWidth || 1000;
      canvas.height = stage.clientHeight || 562;
      redrawWalkableCanvas();
    }
  };

  window.addEventListener('resize', syncCanvasSize);
  syncCanvasSize();

  // Mouse & Touch events for drawing
  const getPos = (e) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: ((clientX - rect.left) / rect.width) * canvas.width,
      y: ((clientY - rect.top) / rect.height) * canvas.height
    };
  };

  const startDraw = (e) => {
    if (!walkablePainter.active) return;
    walkablePainter.isDrawing = true;
    const pos = getPos(e);
    drawWalkableStroke(pos.x, pos.y);
  };

  const moveDraw = (e) => {
    if (!walkablePainter.active || !walkablePainter.isDrawing) return;
    const pos = getPos(e);
    drawWalkableStroke(pos.x, pos.y);
  };

  const endDraw = () => {
    if (walkablePainter.isDrawing) {
      walkablePainter.isDrawing = false;
      updateCachedMaskFromCanvas();
    }
  };

  canvas.addEventListener('mousedown', startDraw);
  canvas.addEventListener('mousemove', moveDraw);
  window.addEventListener('mouseup', endDraw);

  canvas.addEventListener('touchstart', startDraw, { passive: true });
  canvas.addEventListener('touchmove', moveDraw, { passive: true });
  window.addEventListener('touchend', endDraw);
}

function drawWalkableStroke(x, y) {
  const ctx = walkablePainter.ctx;
  if (!ctx) return;

  ctx.save();
  if (walkablePainter.tool === 'eraser') {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, walkablePainter.brushSize, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Brush: Translucent bright emerald green
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(16, 185, 129, 0.45)';
    ctx.beginPath();
    ctx.arc(x, y, walkablePainter.brushSize, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function toggleWalkablePainter(forceState = null) {
  // Only Admin Master mode is allowed to open the Walkable Floor Painter tool
  if (activePlayerId !== 'player_master') {
    walkablePainter.active = false;
    const canvas = document.getElementById('walkable-painter-canvas');
    const toolbar = document.getElementById('walkable-painter-toolbar');
    const btnToggle = document.getElementById('btn-toggle-walkable-painter');
    if (canvas) {
      canvas.classList.remove('is-open');
      canvas.style.setProperty('display', 'none', 'important');
    }
    if (toolbar) {
      toolbar.classList.remove('is-open');
      toolbar.style.setProperty('display', 'none', 'important');
    }
    if (btnToggle) btnToggle.classList.remove('active');
    if (forceState === true) {
      showToast('⚠️ Công cụ Bôi Mặt Sàn chỉ dành riêng cho Admin cấu hình phòng.');
    }
    return;
  }

  walkablePainter.active = forceState !== null ? forceState : !walkablePainter.active;

  const canvas = document.getElementById('walkable-painter-canvas');
  const toolbar = document.getElementById('walkable-painter-toolbar');
  const btnToggle = document.getElementById('btn-toggle-walkable-painter');

  if (canvas) {
    canvas.classList.toggle('is-open', walkablePainter.active);
    canvas.style.setProperty('display', walkablePainter.active ? 'block' : 'none', 'important');
  }
  if (toolbar) {
    toolbar.classList.toggle('is-open', walkablePainter.active);
    toolbar.style.setProperty('display', walkablePainter.active ? 'flex' : 'none', 'important');
  }
  if (btnToggle) btnToggle.classList.toggle('active', walkablePainter.active);

  if (walkablePainter.active && canvas) {
    const stage = document.getElementById('scene-stage');
    if (stage && stage.clientWidth > 0) {
      canvas.width = stage.clientWidth;
      canvas.height = stage.clientHeight;
    }
    redrawWalkableCanvas();
    showToast('🖌️ Chế độ Admin Bôi Mặt Sàn: Tô màu xanh lên sàn để cho phép nhân vật đi qua, dùng cọ tẩy để né đồ vật!');
  }
}

function setWalkableTool(tool) {
  walkablePainter.tool = tool;
  const btnPaint = document.getElementById('btn-wbrush-paint');
  const btnErase = document.getElementById('btn-wbrush-erase');
  if (btnPaint) btnPaint.classList.toggle('active', tool === 'brush');
  if (btnErase) btnErase.classList.toggle('active', tool === 'eraser');
}

function setWalkableBrushSize(size, btnElem) {
  walkablePainter.brushSize = size;
  document.querySelectorAll('.wpt-btn-size').forEach(btn => btn.classList.remove('active'));
  if (btnElem) btnElem.classList.add('active');
}

function clearWalkableCanvas() {
  const canvas = walkablePainter.canvas;
  const ctx = walkablePainter.ctx;
  if (canvas && ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    updateCachedMaskFromCanvas();
    showToast('🧹 Đã xóa sạch vùng vẽ trên sàn.');
  }
}

function applyDefaultWalkablePreset() {
  const canvas = walkablePainter.canvas;
  const ctx = walkablePainter.ctx;
  if (!canvas || !ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const w = canvas.width;
  const h = canvas.height;

  ctx.save();
  ctx.fillStyle = 'rgba(16, 185, 129, 0.45)';

  if (currentSceneId === 'scene_bedroom') {
    // Bedroom walking paths
    // Left corridor
    ctx.fillRect(w * 0.16, h * 0.65, w * 0.18, h * 0.28);
    // Right corridor near window
    ctx.fillRect(w * 0.66, h * 0.65, w * 0.18, h * 0.28);
    // Foot of bed walkway
    ctx.fillRect(w * 0.25, h * 0.85, w * 0.52, h * 0.09);
  } else {
    // Living Room walking paths
    // Left window walkway
    ctx.fillRect(w * 0.16, h * 0.64, w * 0.16, h * 0.28);
    // Behind sofa corridor
    ctx.fillRect(w * 0.26, h * 0.61, w * 0.36, h * 0.08);
    // In front of sofa / carpet walkway
    ctx.fillRect(w * 0.25, h * 0.83, w * 0.55, h * 0.11);
    // Right terrace / Piano passage
    ctx.fillRect(w * 0.60, h * 0.70, w * 0.22, h * 0.22);
  }

  ctx.restore();
  updateCachedMaskFromCanvas();
  showToast('🎯 Đã áp dụng mẫu mặt sàn chuẩn cho phòng này!');
}

function updateCachedMaskFromCanvas() {
  const canvas = walkablePainter.canvas;
  const ctx = walkablePainter.ctx;
  if (!canvas || !ctx) return;
  try {
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    walkablePainter.cachedMaskData[currentSceneId] = imgData;
  } catch (_) {}
}

function redrawWalkableCanvas() {
  const canvas = walkablePainter.canvas;
  const ctx = walkablePainter.ctx;
  if (!canvas || !ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const cached = walkablePainter.cachedMaskData[currentSceneId];
  if (cached) {
    // Redraw cached image data
    try {
      ctx.putImageData(cached, 0, 0);
    } catch (_) {}
  } else {
    // If master blueprint has saved mask dataUrl
    const savedMaskUrl = masterBlueprint?.scenes?.[currentSceneId]?.walkable_mask;
    if (savedMaskUrl) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        updateCachedMaskFromCanvas();
      };
      img.src = savedMaskUrl;
    } else {
      // Auto apply preset
      applyDefaultWalkablePreset();
    }
  }
}

function loadWalkableMaskForScene(sceneId) {
  const savedMaskUrl = masterBlueprint?.scenes?.[sceneId]?.walkable_mask;
  if (savedMaskUrl) {
    const img = new Image();
    img.onload = () => {
      const offCanvas = document.createElement('canvas');
      offCanvas.width = img.width || 200;
      offCanvas.height = img.height || 112;
      const offCtx = offCanvas.getContext('2d');
      offCtx.drawImage(img, 0, 0, offCanvas.width, offCanvas.height);
      walkablePainter.cachedMaskData[sceneId] = offCtx.getImageData(0, 0, offCanvas.width, offCanvas.height);
    };
    img.src = savedMaskUrl;
  }
}

async function saveWalkableMaskFromAdmin() {
  if (activePlayerId !== 'player_master' || !walkablePainter.canvas) return;

  // Export small normalized 240x135 image mask (takes only ~3KB)
  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = 240;
  exportCanvas.height = 135;
  const expCtx = exportCanvas.getContext('2d');
  expCtx.drawImage(walkablePainter.canvas, 0, 0, 240, 135);
  const dataUrl = exportCanvas.toDataURL('image/png');

  if (!masterBlueprint.scenes[currentSceneId]) {
    masterBlueprint.scenes[currentSceneId] = {};
  }
  masterBlueprint.scenes[currentSceneId].walkable_mask = dataUrl;

  try {
    const res = await fetch('/api/master-blueprint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(masterBlueprint)
    });
    if (res.ok) {
      showToast('💾 ĐÃ LƯU MẶT SÀN THÀNH CÔNG! Nhân vật sẽ đi theo đúng vùng bạn đã bôi!');
      toggleWalkablePainter(false);
    }
  } catch (err) {
    console.error('Error saving walkable mask:', err);
    showToast('❌ Lỗi khi lưu mặt sàn, vui lòng thử lại.');
  }
}
