import * as THREE from 'three';
import { VillageBuildResult, VillageEntity } from './VillageBuilder';

export class VillageEditor {
  private active = false;
  private selectedId: string | null = null;
  private dragModeEnabled = true;
  private stepSize = 0.5;

  // 3D Visual Feedback
  private selectionRing: THREE.Mesh;
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  private isDraggingEntity = false;
  private dragPlaneIntersect = new THREE.Vector3();
  private dragOffset = new THREE.Vector3();

  // DOM Elements
  private panel: HTMLElement | null = null;
  private selectEl: HTMLSelectElement | null = null;
  private scaleRange: HTMLInputElement | null = null;
  private scaleVal: HTMLElement | null = null;
  private posXRange: HTMLInputElement | null = null;
  private posXNum: HTMLInputElement | null = null;
  private posZRange: HTMLInputElement | null = null;
  private posZNum: HTMLInputElement | null = null;
  private posYRange: HTMLInputElement | null = null;
  private posYNum: HTMLInputElement | null = null;
  private rotRange: HTMLInputElement | null = null;
  private rotVal: HTMLElement | null = null;
  private dragToggleBtn: HTMLButtonElement | null = null;
  private toastEl: HTMLElement | null = null;
  private toastTimer: any = null;

  constructor(
    private scene: THREE.Scene,
    private camera: THREE.PerspectiveCamera,
    private village: VillageBuildResult,
    private onFocusCamera?: (targetPos: THREE.Vector3, dist: number) => void,
    private camControls?: {
      setMode: (mode: string) => void;
      adjustZoom: (delta: number) => void;
      getCurrentMode: () => string;
    }
  ) {
    // 1. Create Glowing Ground Selection Ring
    const ringGeo = new THREE.RingGeometry(1.6, 1.85, 48);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    });
    this.selectionRing = new THREE.Mesh(ringGeo, ringMat);
    this.selectionRing.rotation.x = -Math.PI / 2;
    this.selectionRing.position.y = 0.44;
    this.selectionRing.visible = false;
    this.selectionRing.renderOrder = 999;
    this.scene.add(this.selectionRing);

    // 2. Build DOM Panel
    this.initDOM();

    // 3. Select first building by default
    if (this.village.entitiesList.length > 0) {
      this.selectedId = this.village.entitiesList[0].id;
    }
  }

  private initDOM(): void {
    // Create editor panel container
    const panel = document.createElement('div');
    panel.id = 'village-editor-panel';
    panel.className = 'editor-panel hidden';
    panel.innerHTML = /* html */ `
      <div class="editor-header">
        <div class="editor-title">
          <span>🛠️</span>
          <h3>Sắp Xếp & Thu Phóng Mô Hình</h3>
        </div>
        <button class="editor-close-btn" id="btn-editor-close" title="Đóng bảng sắp xếp">✕</button>
      </div>

      <div class="editor-body">
        <!-- CAMERA VIEW & ZOOM FOR EASY ARRANGING -->
        <div class="editor-section camera-tools-card card-highlight-blue">
          <div class="section-title">
            <span>🔭 Góc Nhìn & Thu Phóng Camera</span>
            <span class="badge-value badge-blue" id="val-cam-mode">Trên Cao (52°)</span>
          </div>
          <div class="cam-btn-grid">
            <button class="cam-btn active" id="btn-cam-planner" title="Góc nhìn quy hoạch từ trên cao bao quát toàn bộ ngôi làng">
              🗺️ Trên Cao (Quy Hoạch)
            </button>
            <button class="cam-btn" id="btn-cam-overview" title="Góc nhìn toàn cảnh ngang hồ & núi tuyết">
              🏔️ Toàn Cảnh Ngang
            </button>
          </div>
          <div class="zoom-btn-row">
            <button class="zoom-btn" id="btn-cam-zoom-out" title="Thu nhỏ góc nhìn camera để thấy rộng hơn (lùi xa ra toàn cảnh)">
              🔍- Thu Nhỏ Camera (Lùi Xa)
            </button>
            <button class="zoom-btn" id="btn-cam-zoom-in" title="Phóng to góc nhìn camera (lại gần)">
              🔍+ Phóng To Camera (Lại Gần)
            </button>
          </div>
          <div class="editor-subtext">💡 Dùng <b>Cuộn chuột (Scroll)</b> để phóng to / thu nhỏ camera tự do từ 18m đến 105m!</div>
        </div>

        <div class="editor-section">
          <label class="editor-label">Chọn Mô Hình Cần Chỉnh:</label>
          <div class="select-row">
            <select id="editor-entity-select" class="editor-select"></select>
            <button class="editor-action-btn" id="btn-editor-focus" title="Di chuyển camera nhìn thẳng vào mô hình">👁️ Xem</button>
          </div>
          <div class="editor-subtext">💡 Hoặc nhấp chuột trực tiếp vào mô hình 3D trên màn hình</div>
        </div>

        <!-- SCALE CONTROLS (PHÓNG TO / THU NHỎ) -->
        <div class="editor-section card-highlight">
          <div class="section-title">
            <span>🔍 Kích Thước (Thu Phóng)</span>
            <span class="badge-value" id="val-editor-scale">1.00x</span>
          </div>
          <div class="slider-row">
            <input type="range" id="range-editor-scale" min="0.2" max="3.0" step="0.05" value="1.0" class="editor-range" />
          </div>
          <div class="quick-btn-grid">
            <button class="quick-btn" data-scale-delta="-0.1">➖ -10%</button>
            <button class="quick-btn" data-scale-delta="0.1">➕ +10%</button>
            <button class="quick-btn" data-scale-set="0.5">0.5x</button>
            <button class="quick-btn" data-scale-set="1.0">1.0x</button>
            <button class="quick-btn" data-scale-set="1.5">1.5x</button>
            <button class="quick-btn" data-scale-set="2.0">2.0x</button>
          </div>
        </div>

        <!-- POSITION CONTROLS (DI CHUYỂN / SẮP XẾP) -->
        <div class="editor-section">
          <div class="section-title">
            <span>📍 Tọa Độ Di Chuyển</span>
            <div class="step-selector">
              <span class="step-label">Bước:</span>
              <button class="step-btn" data-step="0.2">0.2m</button>
              <button class="step-btn active" data-step="0.5">0.5m</button>
              <button class="step-btn" data-step="1.0">1.0m</button>
              <button class="step-btn" data-step="2.5">2.5m</button>
            </div>
          </div>

          <!-- D-Pad Nudge -->
          <div class="dpad-container">
            <button class="dpad-btn dpad-up" data-dir="north" title="Di chuyển về phía Bắc (+Z)">▲ Bắc</button>
            <div class="dpad-mid">
              <button class="dpad-btn dpad-left" data-dir="west" title="Di chuyển về phía Tây (-X)">◄ Tây</button>
              <button class="dpad-btn dpad-center" id="btn-center-origin" title="Đưa về tâm quảng trường">● Tâm</button>
              <button class="dpad-btn dpad-right" data-dir="east" title="Di chuyển về phía Đông (+X)">► Đông</button>
            </div>
            <button class="dpad-btn dpad-down" data-dir="south" title="Di chuyển về phía Nam (-Z)">▼ Nam</button>
          </div>

          <!-- Coordinate Inputs -->
          <div class="coord-inputs">
            <div class="coord-row">
              <span class="coord-tag tag-x">X (Tây ↔ Đông)</span>
              <input type="range" id="range-editor-x" min="-36" max="36" step="0.1" class="editor-range-sm" />
              <input type="number" id="num-editor-x" step="0.1" class="editor-num" />
            </div>
            <div class="coord-row">
              <span class="coord-tag tag-z">Z (Nam ↔ Bắc)</span>
              <input type="range" id="range-editor-z" min="-48" max="28" step="0.1" class="editor-range-sm" />
              <input type="number" id="num-editor-z" step="0.1" class="editor-num" />
            </div>
            <div class="coord-row">
              <span class="coord-tag tag-y">Y (Độ cao)</span>
              <input type="range" id="range-editor-y" min="-0.5" max="4.0" step="0.05" class="editor-range-sm" />
              <input type="number" id="num-editor-y" step="0.05" class="editor-num" />
            </div>
          </div>

          <div class="drag-toggle-row">
            <button class="editor-toggle-btn active" id="btn-toggle-drag">
              ✋ Kéo rê trực tiếp trên mặt đất: <b>BẬT</b>
            </button>
          </div>
        </div>

        <!-- ROTATION CONTROLS (XOAY GÓC) -->
        <div class="editor-section">
          <div class="section-title">
            <span>🧭 Hướng Xoay (Góc Quay)</span>
            <span class="badge-value" id="val-editor-rot">0°</span>
          </div>
          <div class="slider-row">
            <input type="range" id="range-editor-rot" min="0" max="360" step="1" value="0" class="editor-range" />
          </div>
          <div class="rot-btn-grid">
            <button class="quick-btn" data-rot-delta="-45">↺ -45°</button>
            <button class="quick-btn" data-rot-delta="-15">↺ -15°</button>
            <button class="quick-btn" data-rot-delta="15">↻ +15°</button>
            <button class="quick-btn" data-rot-delta="45">↻ +45°</button>
            <button class="quick-btn full-span" id="btn-face-center">🎯 Hướng Về Trung Tâm Làng</button>
          </div>
        </div>
      </div>

      <!-- PERSISTENCE & EXPORT PINNED FOOTER -->
      <div class="editor-footer">
        <div class="footer-btn-row">
          <button class="btn-primary" id="btn-save-layout" title="Lưu toàn bộ bố cục vào bộ nhớ trình duyệt">💾 Lưu Bố Cục</button>
          <button class="btn-secondary" id="btn-export-json" title="Xuất mã JSON cấu hình">📋 Xuất JSON</button>
        </div>
        <div class="footer-btn-row">
          <button class="btn-secondary" id="btn-import-json" title="Dán mã JSON để nạp bố cục">📥 Nhập JSON</button>
          <button class="btn-danger" id="btn-reset-layout" title="Xóa tùy biến, khôi phục vị trí mặc định">↺ Khôi Phục</button>
        </div>
      </div>

      <!-- Toast Notification -->
      <div id="editor-toast" class="editor-toast hidden"></div>
    `;

    document.getElementById('app')?.appendChild(panel);
    this.panel = panel;

    // Cache elements
    this.selectEl = panel.querySelector('#editor-entity-select') as HTMLSelectElement;
    this.scaleRange = panel.querySelector('#range-editor-scale') as HTMLInputElement;
    this.scaleVal = panel.querySelector('#val-editor-scale') as HTMLElement;
    this.posXRange = panel.querySelector('#range-editor-x') as HTMLInputElement;
    this.posXNum = panel.querySelector('#num-editor-x') as HTMLInputElement;
    this.posZRange = panel.querySelector('#range-editor-z') as HTMLInputElement;
    this.posZNum = panel.querySelector('#num-editor-z') as HTMLInputElement;
    this.posYRange = panel.querySelector('#range-editor-y') as HTMLInputElement;
    this.posYNum = panel.querySelector('#num-editor-y') as HTMLInputElement;
    this.rotRange = panel.querySelector('#range-editor-rot') as HTMLInputElement;
    this.rotVal = panel.querySelector('#val-editor-rot') as HTMLElement;
    this.dragToggleBtn = panel.querySelector('#btn-toggle-drag') as HTMLButtonElement;
    this.toastEl = panel.querySelector('#editor-toast') as HTMLElement;

    // Populate Select options
    this.rebuildSelectOptions();

    // Wire DOM Events
    this.wireEvents();
  }

  private rebuildSelectOptions(): void {
    if (!this.selectEl) return;
    this.selectEl.innerHTML = '';

    const buildingsGroup = document.createElement('optgroup');
    buildingsGroup.label = '🏛️ 10 Công Trình Làng Thụy Sỹ';

    const propsGroup = document.createElement('optgroup');
    propsGroup.label = '🪴 Đạo Cụ & Cảnh Quan';

    for (const ent of this.village.entitiesList) {
      const opt = document.createElement('option');
      opt.value = ent.id;
      opt.textContent = `${ent.badge} ${ent.name}`;
      if (ent.category === 'building') {
        buildingsGroup.appendChild(opt);
      } else {
        propsGroup.appendChild(opt);
      }
    }

    this.selectEl.appendChild(buildingsGroup);
    this.selectEl.appendChild(propsGroup);

    if (this.selectedId) {
      this.selectEl.value = this.selectedId;
    }
  }

  private wireEvents(): void {
    if (!this.panel) return;

    // Close button
    this.panel.querySelector('#btn-editor-close')?.addEventListener('click', () => {
      this.toggle(false);
    });

    // Camera Mode & Zoom buttons
    this.panel.querySelector('#btn-cam-planner')?.addEventListener('click', () => {
      this.camControls?.setMode('planner');
      const valEl = this.panel?.querySelector('#val-cam-mode');
      if (valEl) valEl.textContent = 'Trên Cao (52°)';
      this.panel?.querySelector('#btn-cam-planner')?.classList.add('active');
      this.panel?.querySelector('#btn-cam-overview')?.classList.remove('active');
      this.showToast('🗺️ Đã chuyển sang góc nhìn quy hoạch trên cao!');
    });

    this.panel.querySelector('#btn-cam-overview')?.addEventListener('click', () => {
      this.camControls?.setMode('overview');
      const valEl = this.panel?.querySelector('#val-cam-mode');
      if (valEl) valEl.textContent = 'Toàn Cảnh (22°)';
      this.panel?.querySelector('#btn-cam-overview')?.classList.add('active');
      this.panel?.querySelector('#btn-cam-planner')?.classList.remove('active');
      this.showToast('🏔️ Đã chuyển sang góc nhìn toàn cảnh ngang!');
    });

    this.panel.querySelector('#btn-cam-zoom-out')?.addEventListener('click', () => {
      this.camControls?.adjustZoom(12.0);
      this.showToast('🔭 Đã thu nhỏ camera (lùi xa ra toàn cảnh)');
    });

    this.panel.querySelector('#btn-cam-zoom-in')?.addEventListener('click', () => {
      this.camControls?.adjustZoom(-12.0);
      this.showToast('🔍 Đã phóng to camera (tiến lại gần)');
    });

    // Dropdown change
    this.selectEl?.addEventListener('change', () => {
      if (this.selectEl?.value) {
        this.selectEntity(this.selectEl.value);
      }
    });

    // Camera Focus button
    this.panel.querySelector('#btn-editor-focus')?.addEventListener('click', () => {
      this.focusOnSelected();
    });

    // Scale slider
    this.scaleRange?.addEventListener('input', () => {
      const s = parseFloat(this.scaleRange!.value);
      this.applyCurrentTransform({ scale: s });
    });

    // Quick scale buttons
    this.panel.querySelectorAll<HTMLButtonElement>('[data-scale-delta]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const delta = parseFloat(btn.getAttribute('data-scale-delta') || '0');
        const ent = this.getSelectedEntity();
        if (ent) {
          const newScale = Math.max(0.2, Math.min(3.0, Math.round((ent.current.scale + delta) * 100) / 100));
          this.applyCurrentTransform({ scale: newScale });
        }
      });
    });

    this.panel.querySelectorAll<HTMLButtonElement>('[data-scale-set]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const s = parseFloat(btn.getAttribute('data-scale-set') || '1.0');
        this.applyCurrentTransform({ scale: s });
      });
    });

    // Position sliders & numbers
    const onPosChange = () => {
      const x = parseFloat(this.posXNum!.value) || 0;
      const z = parseFloat(this.posZNum!.value) || 0;
      const y = parseFloat(this.posYNum!.value) || 0;
      this.applyCurrentTransform({ x, y, z });
    };

    this.posXRange?.addEventListener('input', () => {
      this.posXNum!.value = this.posXRange!.value;
      onPosChange();
    });
    this.posXNum?.addEventListener('change', () => {
      this.posXRange!.value = this.posXNum!.value;
      onPosChange();
    });

    this.posZRange?.addEventListener('input', () => {
      this.posZNum!.value = this.posZRange!.value;
      onPosChange();
    });
    this.posZNum?.addEventListener('change', () => {
      this.posZRange!.value = this.posZNum!.value;
      onPosChange();
    });

    this.posYRange?.addEventListener('input', () => {
      this.posYNum!.value = this.posYRange!.value;
      onPosChange();
    });
    this.posYNum?.addEventListener('change', () => {
      this.posYRange!.value = this.posYNum!.value;
      onPosChange();
    });

    // Step size buttons
    this.panel.querySelectorAll<HTMLButtonElement>('[data-step]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.panel?.querySelectorAll('[data-step]').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.stepSize = parseFloat(btn.getAttribute('data-step') || '0.5');
      });
    });

    // D-Pad nudge
    this.panel.querySelectorAll<HTMLButtonElement>('[data-dir]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const dir = btn.getAttribute('data-dir');
        const ent = this.getSelectedEntity();
        if (!ent) return;
        let nx = ent.current.x;
        let nz = ent.current.z;
        if (dir === 'north') nz += this.stepSize;
        if (dir === 'south') nz -= this.stepSize;
        if (dir === 'west') nx -= this.stepSize;
        if (dir === 'east') nx += this.stepSize;
        this.applyCurrentTransform({ x: nx, z: nz });
      });
    });

    // Center button
    this.panel.querySelector('#btn-center-origin')?.addEventListener('click', () => {
      this.applyCurrentTransform({ x: 0, z: 0 });
    });

    // Rotation slider
    this.rotRange?.addEventListener('input', () => {
      const deg = parseFloat(this.rotRange!.value);
      const rad = THREE.MathUtils.degToRad(deg);
      this.applyCurrentTransform({ rotY: rad });
    });

    // Quick rotation buttons
    this.panel.querySelectorAll<HTMLButtonElement>('[data-rot-delta]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const delta = parseFloat(btn.getAttribute('data-rot-delta') || '0');
        const ent = this.getSelectedEntity();
        if (ent) {
          const curDeg = Math.round(THREE.MathUtils.radToDeg(ent.current.rotY));
          let newDeg = (curDeg + delta) % 360;
          if (newDeg < 0) newDeg += 360;
          this.applyCurrentTransform({ rotY: THREE.MathUtils.degToRad(newDeg) });
        }
      });
    });

    // Face village center
    this.panel.querySelector('#btn-face-center')?.addEventListener('click', () => {
      const ent = this.getSelectedEntity();
      if (ent) {
        // Calculate angle facing towards origin (0, 0)
        const angle = Math.atan2(-ent.current.x, -ent.current.z);
        this.applyCurrentTransform({ rotY: angle });
      }
    });

    // Toggle 3D Dragging
    this.dragToggleBtn?.addEventListener('click', () => {
      this.dragModeEnabled = !this.dragModeEnabled;
      if (this.dragToggleBtn) {
        this.dragToggleBtn.classList.toggle('active', this.dragModeEnabled);
        this.dragToggleBtn.innerHTML = `✋ Kéo rê trực tiếp trên mặt đất: <b>${this.dragModeEnabled ? 'BẬT' : 'TẮT'}</b>`;
      }
    });

    // Save layout
    this.panel.querySelector('#btn-save-layout')?.addEventListener('click', () => {
      this.village.saveToStorage();
      this.showToast('✅ Đã lưu bố cục vào bộ nhớ trình duyệt!');
    });

    // Export JSON
    this.panel.querySelector('#btn-export-json')?.addEventListener('click', () => {
      const json = this.village.getLayoutJSON();
      navigator.clipboard?.writeText(json).catch(() => {});
      this.showJSONModal('Mã Cấu Hình JSON (Đã sao chép vào bộ nhớ đệm)', json);
      this.showToast('📋 Đã sao chép mã cấu hình JSON!');
    });

    // Import JSON
    this.panel.querySelector('#btn-import-json')?.addEventListener('click', () => {
      const input = prompt('Dán chuỗi JSON bố cục vào đây:');
      if (input) {
        const ok = this.village.applyLayoutJSON(input);
        if (ok) {
          this.village.saveToStorage();
          this.updateUIFromSelected();
          this.showToast('✅ Đã nạp thành công bố cục mới!');
        } else {
          alert('Mã JSON không đúng định dạng!');
        }
      }
    });

    // Reset layout
    this.panel.querySelector('#btn-reset-layout')?.addEventListener('click', () => {
      if (confirm('Bạn có chắc chắn muốn khôi phục lại vị trí và kích thước mặc định của toàn bộ làng?')) {
        this.village.resetAllTransforms();
        this.updateUIFromSelected();
        this.showToast('↺ Đã khôi phục bố cục gốc!');
      }
    });
  }

  public toggle(force?: boolean): void {
    this.active = force !== undefined ? force : !this.active;
    this.panel?.classList.toggle('hidden', !this.active);
    this.selectionRing.visible = this.active && !!this.selectedId;

    const toggleBtn = document.getElementById('btn-editor-toggle');
    if (toggleBtn) {
      toggleBtn.classList.toggle('active', this.active);
    }

    if (this.active) {
      this.rebuildSelectOptions();
      // Automatically switch to top-down planner view for broad village overview
      this.camControls?.setMode('planner');
      const valEl = this.panel?.querySelector('#val-cam-mode');
      if (valEl) valEl.textContent = 'Trên Cao (52°)';
      this.panel?.querySelector('#btn-cam-planner')?.classList.add('active');
      this.panel?.querySelector('#btn-cam-overview')?.classList.remove('active');

      if (!this.selectedId && this.village.entitiesList.length > 0) {
        this.selectEntity(this.village.entitiesList[0].id);
      } else {
        this.updateUIFromSelected();
      }
    }
  }

  public isOpen(): boolean {
    return this.active;
  }

  public selectEntity(id: string): void {
    this.selectedId = id;
    if (this.selectEl && this.selectEl.value !== id) {
      this.selectEl.value = id;
    }
    this.updateUIFromSelected();
    this.updateSelectionRing();
  }

  public getSelectedEntity(): VillageEntity | undefined {
    return this.selectedId ? this.village.entities.get(this.selectedId) : undefined;
  }

  private updateUIFromSelected(): void {
    const ent = this.getSelectedEntity();
    if (!ent) return;

    // Scale
    if (this.scaleRange && this.scaleVal) {
      this.scaleRange.value = ent.current.scale.toFixed(2);
      this.scaleVal.textContent = `${ent.current.scale.toFixed(2)}x (${Math.round(ent.current.scale * 100)}%)`;
    }

    // Position
    if (this.posXRange && this.posXNum) {
      this.posXRange.value = ent.current.x.toFixed(1);
      this.posXNum.value = ent.current.x.toFixed(1);
    }
    if (this.posZRange && this.posZNum) {
      this.posZRange.value = ent.current.z.toFixed(1);
      this.posZNum.value = ent.current.z.toFixed(1);
    }
    if (this.posYRange && this.posYNum) {
      this.posYRange.value = ent.current.y.toFixed(2);
      this.posYNum.value = ent.current.y.toFixed(2);
    }

    // Rotation
    if (this.rotRange && this.rotVal) {
      let deg = Math.round(THREE.MathUtils.radToDeg(ent.current.rotY)) % 360;
      if (deg < 0) deg += 360;
      this.rotRange.value = deg.toString();
      this.rotVal.textContent = `${deg}°`;
    }

    this.updateSelectionRing();
  }

  private applyCurrentTransform(partial: { x?: number; y?: number; z?: number; rotY?: number; scale?: number }): void {
    const ent = this.getSelectedEntity();
    if (!ent) return;

    const nx = partial.x !== undefined ? partial.x : ent.current.x;
    const ny = partial.y !== undefined ? partial.y : ent.current.y;
    const nz = partial.z !== undefined ? partial.z : ent.current.z;
    const nRotY = partial.rotY !== undefined ? partial.rotY : ent.current.rotY;
    const nScale = partial.scale !== undefined ? partial.scale : ent.current.scale;

    this.village.updateEntityTransform(ent.id, nx, ny, nz, nRotY, nScale);
    this.updateUIFromSelected();
  }

  private updateSelectionRing(): void {
    const ent = this.getSelectedEntity();
    if (!ent || !this.active) {
      this.selectionRing.visible = false;
      return;
    }

    this.selectionRing.visible = true;
    this.selectionRing.position.set(ent.current.x, ent.current.y + 0.44, ent.current.z);

    // Adapt ring radius to entity dimensions
    const baseRadius = ent.category === 'building' ? 4.2 : (ent.initial.radius || 1.4);
    const radius = baseRadius * ent.current.scale;
    this.selectionRing.scale.set(radius, radius, 1);
  }

  public focusOnSelected(): void {
    const ent = this.getSelectedEntity();
    if (!ent) return;

    const targetPos = new THREE.Vector3(ent.current.x, ent.current.y + 1.8, ent.current.z);
    const dist = ent.category === 'building' ? 24.0 : 8.0;

    if (this.onFocusCamera) {
      this.onFocusCamera(targetPos, dist);
    }
    this.showToast(`👁️ Đã chuyển camera đến ${ent.name}!`);
  }

  // =========================================================
  // 3D POINTER & DRAG HANDLING
  // =========================================================
  public handlePointerDown(e: PointerEvent): boolean {
    if (!this.active) return false;

    // Ignore if clicking on UI elements
    const target = e.target as HTMLElement;
    if (target.closest('.hud-top') || target.closest('.editor-panel') || target.closest('#modal-json-export')) {
      return false;
    }

    this.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    this.pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;

    this.raycaster.setFromCamera(this.pointer, this.camera);
    const intersects = this.raycaster.intersectObjects(this.village.group.children, true);

    if (intersects.length > 0) {
      let hitObj: THREE.Object3D | null = intersects[0].object;
      while (hitObj && !hitObj.userData?.entityId && hitObj !== this.village.group) {
        hitObj = hitObj.parent;
      }

      if (hitObj && hitObj.userData?.entityId) {
        const entityId = hitObj.userData.entityId;
        this.selectEntity(entityId);

        if (this.dragModeEnabled) {
          this.isDraggingEntity = true;
          // Calculate offset on ground plane
          if (this.raycaster.ray.intersectPlane(this.groundPlane, this.dragPlaneIntersect)) {
            const ent = this.getSelectedEntity();
            if (ent) {
              this.dragOffset.set(ent.current.x - this.dragPlaneIntersect.x, 0, ent.current.z - this.dragPlaneIntersect.z);
            }
          }
          return true; // Handled! Suppress camera orbit
        }
      }
    }

    return false;
  }

  public handlePointerMove(e: PointerEvent): boolean {
    if (!this.active || !this.isDraggingEntity) return false;

    this.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    this.pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;

    this.raycaster.setFromCamera(this.pointer, this.camera);
    if (this.raycaster.ray.intersectPlane(this.groundPlane, this.dragPlaneIntersect)) {
      const nx = Math.max(-36, Math.min(36, this.dragPlaneIntersect.x + this.dragOffset.x));
      const nz = Math.max(-48, Math.min(28, this.dragPlaneIntersect.z + this.dragOffset.z));
      this.applyCurrentTransform({ x: Math.round(nx * 10) / 10, z: Math.round(nz * 10) / 10 });
      return true; // Handled!
    }

    return false;
  }

  public handlePointerUp(): boolean {
    if (this.isDraggingEntity) {
      this.isDraggingEntity = false;
      return true;
    }
    return false;
  }

  public update(dt: number): void {
    if (this.selectionRing && this.selectionRing.visible) {
      const mat = this.selectionRing.material as THREE.MeshBasicMaterial;
      const t = performance.now() * 0.003;
      mat.opacity = 0.55 + Math.sin(t) * 0.3;
    }
  }

  private showToast(msg: string): void {
    if (!this.toastEl) return;
    this.toastEl.textContent = msg;
    this.toastEl.classList.remove('hidden');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.toastEl?.classList.add('hidden');
    }, 2800);
  }

  private showJSONModal(title: string, json: string): void {
    let modal = document.getElementById('modal-json-export');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'modal-json-export';
      modal.className = 'editor-modal';
      document.body.appendChild(modal);
    }
    modal.innerHTML = /* html */ `
      <div class="modal-backdrop"></div>
      <div class="modal-card">
        <div class="modal-header">
          <h3>${title}</h3>
          <button class="modal-close-btn" id="btn-modal-close">✕</button>
        </div>
        <textarea class="modal-textarea" readonly>${json}</textarea>
        <div class="modal-footer">
          <button class="btn-primary" id="btn-modal-copy">Sao Chép Vào Clipboard</button>
          <button class="btn-secondary" id="btn-modal-dismiss">Đóng</button>
        </div>
      </div>
    `;
    modal.classList.remove('hidden');

    const closeModal = () => modal?.classList.add('hidden');
    modal.querySelector('#btn-modal-close')?.addEventListener('click', closeModal);
    modal.querySelector('#btn-modal-dismiss')?.addEventListener('click', closeModal);
    modal.querySelector('.modal-backdrop')?.addEventListener('click', closeModal);
    modal.querySelector('#btn-modal-copy')?.addEventListener('click', () => {
      navigator.clipboard?.writeText(json).catch(() => {});
      this.showToast('📋 Đã sao chép vào bộ nhớ đệm!');
      closeModal();
    });
  }
}
