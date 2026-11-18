import React from 'react';
import { InteractiveLocation } from '../../data/locations';
import { LANDMARK_CATALOG, AVAILABLE_ICONS } from '../../data/landmarkCatalog';
import { LandmarkBuildingData, BuildingValidationResult } from '../../systems/levelEditor';

export type QualityPreset = 'low' | 'medium' | 'high';
export type WorldMode = 'cozy' | 'castle';

export interface GameUIProps {
  selectedLocation: InteractiveLocation | null;
  activeTargetId: string | null;
  isMoving: boolean;
  quality: QualityPreset;
  worldMode: WorldMode;
  locations: InteractiveLocation[];
  onSelectLocation: (loc: InteractiveLocation) => void;
  onCloseModal: () => void;
  onResetCamera: () => void;
  onChangeQuality: (preset: QualityPreset) => void;
  onToggleWorld: (mode: WorldMode) => void;
  fps: number;
  triangles: number;
  drawCalls: number;

  // Level Editor & 3D Model Upload Props
  editorMode: boolean;
  onToggleEditor: () => void;
  selectedItemName: string | null;
  selectedItemType: string | null;
  onRotateSelected: (deg: number) => void;
  onScaleSelected: (factor: number) => void;
  onElevateSelected: (deltaY: number) => void;
  onDuplicateSelected: () => void;
  onDeleteSelected: () => void;
  onDeselect: () => void;
  onSpawnItem: (type: string) => void;
  onSpawnExtractedAsset: (relativePath: string, name: string) => void;
  onUploadModel: (file: File) => void;
  onSaveLayout: () => void;
  onResetLayout: () => void;
  onExportJSON: () => void;
  onImportJSON: (jsonStr: string) => void;
  isDraggingFile: boolean;
  onOpenLibrary: () => void;
  onBlendSelectedColor?: () => void;
  onRestoreSelectedColor?: () => void;

  // Master Task V3 Landmark & Replace Model Props
  selectedBuildingData?: LandmarkBuildingData | null;
  selectedValidation?: BuildingValidationResult | null;
  onUpdateBuildingLandmark?: (partial: Partial<LandmarkBuildingData>) => void;
  onReplaceModel?: (file: File) => Promise<boolean>;
}

export const GameUI: React.FC<GameUIProps> = ({
  selectedLocation,
  activeTargetId,
  isMoving,
  quality,
  worldMode,
  locations,
  onSelectLocation,
  onCloseModal,
  onResetCamera,
  onChangeQuality,
  onToggleWorld,
  fps,
  triangles,
  drawCalls,
  editorMode,
  onToggleEditor,
  selectedItemName,
  onRotateSelected,
  onScaleSelected,
  onElevateSelected,
  onDuplicateSelected,
  onDeleteSelected,
  onDeselect,
  onSpawnItem,
  onSpawnExtractedAsset,
  onUploadModel,
  onSaveLayout,
  onResetLayout,
  onExportJSON,
  onImportJSON,
  isDraggingFile,
  onOpenLibrary,
  onBlendSelectedColor,
  onRestoreSelectedColor,
  selectedBuildingData,
  selectedValidation,
  onUpdateBuildingLandmark,
  onReplaceModel,
}) => {
  const [showStats, setShowStats] = React.useState(true);
  const [actionFeedback, setActionFeedback] = React.useState<string | null>(null);
  const [paletteTab, setPaletteTab] = React.useState<'extracted' | 'sample'>('extracted');
  const [showLandmarkInspector, setShowLandmarkInspector] = React.useState(true);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const replaceModelInputRef = React.useRef<HTMLInputElement | null>(null);
  const jsonInputRef = React.useRef<HTMLInputElement | null>(null);

  const EXTRACTED_ITEMS = [
    { name: 'Great Hall', file: 'assets-extracted/houses/house_great_hall.glb', icon: '🏛️' },
    { name: 'Nhà Lumi', file: 'assets-extracted/houses/house_general_store.glb', icon: '🏪' },
    { name: 'Thư Viện', file: 'assets-extracted/houses/house_library_cottage.glb', icon: '📚' },
    { name: 'Phong Đỏ', file: 'assets-extracted/trees/tree_momiji_maple.glb', icon: '🍁' },
    { name: 'Cây Bóng Mát', file: 'assets-extracted/trees/tree_shade_park.glb', icon: '🌳' },
    { name: 'Cây Sồi Ven Đường', file: 'assets-extracted/trees/tree_lineside_oak.glb', icon: '🌲' },
    { name: 'Đá Phủ Rêu', file: 'assets-extracted/rocks/rock_moss_boulder.glb', icon: '🪨' },
    { name: 'Bồn Hoa Tròn', file: 'assets-extracted/props/prop_plaza_planter.glb', icon: '⛲' },
    { name: 'Ghế Băng Gỗ', file: 'assets-extracted/props/prop_park_bench.glb', icon: '🪑' },
    { name: 'Hàng Rào Gỗ', file: 'assets-extracted/props/prop_picket_fence.glb', icon: '🪵' },
    { name: 'Chậu Hoa Cúc', file: 'assets-extracted/vegetation/plant_mums_flowerpot.glb', icon: '🌼' },
    { name: 'Chậu Cây Kiểng', file: 'assets-extracted/vegetation/plant_library_flowerpot.glb', icon: '🪴' },
    { name: 'Bụi Acanthus', file: 'assets-extracted/vegetation/grass_acanthus_scatter.glb', icon: '🌿' },
    { name: 'Khóm Cỏ', file: 'assets-extracted/vegetation/grass_lawn_tuft.glb', icon: '🌱' },
    { name: 'Thảm Rêu', file: 'assets-extracted/vegetation/moss_patch.glb', icon: '🟩' },
    { name: 'Luống Đất Mùn', file: 'assets-extracted/vegetation/bed_mulch_tile.glb', icon: '🟫' },
    { name: 'Suối Uốn Chữ S', file: 'assets-extracted/terrain/stream_meandering_s_01.glb', icon: '🌊' },
    { name: 'Suối Sóng Đôi', file: 'assets-extracted/terrain/stream_winding_river_01.glb', icon: '〰️' },
    { name: 'Khúc Cua 90°', file: 'assets-extracted/terrain/stream_bend_90_01.glb', icon: '🔄' },
    { name: 'Ngã Ba Suối Chữ Y', file: 'assets-extracted/terrain/stream_fork_junction_01.glb', icon: '🔱' },
    { name: 'Hồ Nước Đá Rêu', file: 'assets-extracted/terrain/stream_pond_01.glb', icon: '💧' },
    { name: 'Bậc Thác Đá', file: 'assets-extracted/terrain/stream_waterfall_step_01.glb', icon: '🏞️' },
  ];

  const handleAction = (text: string) => {
    setActionFeedback(text);
    setTimeout(() => setActionFeedback(null), 3000);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      onUploadModel(file);
      handleAction(`Đã tải lên mô hình 3D: ${file.name}`);
      e.target.value = '';
    }
  };

  const handleJsonInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content) {
          onImportJSON(content);
          handleAction('Đã nhập bố cục làng từ JSON thành công!');
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    }
  };

  const cycleQuality = () => {
    if (quality === 'high') onChangeQuality('medium');
    else if (quality === 'medium') onChangeQuality('low');
    else onChangeQuality('high');
  };

  return (
    <div className="ui-overlay">
      {/* Drag & Drop File Overlay */}
      {isDraggingFile && (
        <div className="file-drag-overlay">
          <div className="file-drag-card">
            <div className="file-drag-icon">📦✨</div>
            <h2 style={{ fontSize: '1.4rem', color: '#fbbf24', marginBottom: '8px' }}>
              Thả File 3D (.glb / .gltf) Vào Đây
            </h2>
            <p style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>
              Mô hình 3D sẽ xuất hiện ngay trong làng và bạn có thể tự do di chuyển, xoay & phóng to nhỏ!
            </p>
          </div>
        </div>
      )}

      {/* Top Header */}
      <header className="hud-header">
        <div className="brand">
          <span className="brand-icon">{worldMode === 'cozy' ? '🏡' : '🏰'}</span>
          <div>
            <div className="brand-title">
              {worldMode === 'cozy' ? 'Cozy Fantasy Village 3D' : 'Floating Castle Village'}
            </div>
          </div>
          <span className="brand-badge">
            {worldMode === 'cozy' ? 'Medieval Village Pack' : 'BlackSpire Scene'}
          </span>
        </div>

        <div className="hud-actions">
          {/* 3D Asset Studio / Library */}
          <button
            className="hud-btn"
            onClick={onOpenLibrary}
            title="Mở Thư Viện 3D Asset Studio: Xem 3D, tải lẻ GLB & tải trọn bộ ZIP 22 models"
            style={{ borderColor: '#f59e0b', color: '#fef08a' }}
          >
            <span>📦</span>
            <strong>Asset Studio (22)</strong>
          </button>

          {/* Level Editor Mode Toggle */}
          <button
            className={`hud-btn ${editorMode ? 'editor-active' : ''}`}
            onClick={onToggleEditor}
            title="Bật/Tắt chế độ kéo thả di chuyển bố cục và tải mô hình 3D"
          >
            <span>🛠️</span>
            <strong>{editorMode ? 'Editor: ON' : 'Edit Map'}</strong>
          </button>

          {/* Scene Switcher Toggle */}
          <button
            className="hud-btn"
            onClick={() => onToggleWorld(worldMode === 'cozy' ? 'castle' : 'cozy')}
            title="Switch between Cozy Fantasy Village and Castle Village"
          >
            <span>Scene:</span>
            <strong>{worldMode === 'cozy' ? '🏡 Cozy Pack' : '🏰 Castle'}</strong>
          </button>

          <button
            className="hud-btn"
            onClick={cycleQuality}
            title="Change rendering quality preset"
          >
            <span>Quality:</span>
            <strong style={{ textTransform: 'uppercase', color: '#fbbf24' }}>{quality}</strong>
          </button>

          <button
            className="hud-btn"
            onClick={onResetCamera}
            title="Reset camera to default overview"
          >
            <span>↺</span>
            <span>Reset View</span>
          </button>

          <button
            className={`hud-btn ${showStats ? 'active' : ''}`}
            onClick={() => setShowStats(!showStats)}
            title="Toggle Performance Stats"
          >
            <span>📊</span>
          </button>
        </div>
      </header>

      {/* Editor Palette Drawer (Active when in Editor Mode) */}
      {editorMode && (
        <div className="editor-palette-drawer">
          {/* Tab Selection: 16 Extracted Assets vs Sample Pack */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '6px' }}>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                className={`editor-tool-btn ${paletteTab === 'extracted' ? 'editor-active' : ''}`}
                onClick={() => setPaletteTab('extracted')}
                style={{
                  background: paletteTab === 'extracted' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(255, 255, 255, 0.08)',
                  borderColor: paletteTab === 'extracted' ? '#fbbf24' : 'rgba(255, 255, 255, 0.15)',
                  color: paletteTab === 'extracted' ? '#fef08a' : '#cbd5e1',
                  fontWeight: 600,
                }}
              >
                <span>🌟 22 Món Vừa Tách (Suối Nước Động & Uốn Lượn)</span>
              </button>

              <button
                className={`editor-tool-btn ${paletteTab === 'sample' ? 'editor-active' : ''}`}
                onClick={() => setPaletteTab('sample')}
                style={{
                  background: paletteTab === 'sample' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(255, 255, 255, 0.08)',
                  borderColor: paletteTab === 'sample' ? '#fbbf24' : 'rgba(255, 255, 255, 0.15)',
                  color: paletteTab === 'sample' ? '#fef08a' : '#cbd5e1',
                }}
              >
                <span>🏡 Gói Medieval Sample (11 Món)</span>
              </button>
            </div>

            {/* Quick Upload Button */}
            <label className="editor-upload-btn" title="Chọn file .glb hoặc .gltf từ máy tính để đưa vào làng">
              <span>📁</span>
              <span>Tải File 3D (.glb/.gltf)</span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".glb,.gltf"
                style={{ display: 'none' }}
                onChange={handleFileInput}
              />
            </label>
          </div>

          {/* Row 1: Item Catalog Buttons */}
          <div className="editor-palette-row">
            {paletteTab === 'extracted' ? (
              <>
                {EXTRACTED_ITEMS.map((item) => (
                  <button
                    key={item.file}
                    className="editor-spawn-btn"
                    onClick={() => {
                      onSpawnExtractedAsset(item.file, item.name);
                      handleAction(`Đã đặt ${item.name} vào làng! Hãy giữ chuột kéo thả vị trí.`);
                    }}
                    style={{
                      background: 'rgba(245, 158, 11, 0.12)',
                      borderColor: 'rgba(245, 158, 11, 0.4)',
                    }}
                    title={`Thêm ${item.name} (Tách từ HealthClues) vào làng`}
                  >
                    <span>{item.icon}</span>
                    <span>{item.name}</span>
                  </button>
                ))}
              </>
            ) : (
              <>
                {/* Medieval Sample Catalog Presets */}
                <button className="editor-spawn-btn" onClick={() => { onSpawnItem('cottage'); handleAction('Đã thêm Nhà Gỗ!'); }}>
                  <span>🏡</span> Nhà Gỗ
                </button>
                <button className="editor-spawn-btn" onClick={() => { onSpawnItem('well'); handleAction('Đã thêm Giếng Nước!'); }}>
                  <span>⛲</span> Giếng Nước
                </button>
                <button className="editor-spawn-btn" onClick={() => { onSpawnItem('marketStall'); handleAction('Đã thêm Gian Hàng!'); }}>
                  <span>🎪</span> Gian Hàng
                </button>
                <button className="editor-spawn-btn" onClick={() => { onSpawnItem('lampPost'); handleAction('Đã thêm Đèn Lồng!'); }}>
                  <span>🏮</span> Đèn Đường
                </button>
                <button className="editor-spawn-btn" onClick={() => { onSpawnItem('treeOak'); handleAction('Đã thêm Cây Sồi!'); }}>
                  <span>🌳</span> Cây Sồi
                </button>
                <button className="editor-spawn-btn" onClick={() => { onSpawnItem('rock'); handleAction('Đã thêm Tảng Đá!'); }}>
                  <span>🪨</span> Tảng Đá
                </button>
                <button className="editor-spawn-btn" onClick={() => { onSpawnItem('bush'); handleAction('Đã thêm Bụi Cây!'); }}>
                  <span>🌿</span> Bụi Cây
                </button>
                <button className="editor-spawn-btn" onClick={() => { onSpawnItem('fence'); handleAction('Đã thêm Hàng Rào!'); }}>
                  <span>🪵</span> Hàng Rào
                </button>
                <button className="editor-spawn-btn" onClick={() => { onSpawnItem('barrel'); handleAction('Đã thêm Thùng Rượu!'); }}>
                  <span>🛢️</span> Thùng Rượu
                </button>
                <button className="editor-spawn-btn" onClick={() => { onSpawnItem('crate'); handleAction('Đã thêm Kiện Hàng!'); }}>
                  <span>📦</span> Kiện Hàng
                </button>
                <button className="editor-spawn-btn" onClick={() => { onSpawnItem('cart'); handleAction('Đã thêm Xe Kéo!'); }}>
                  <span>🛒</span> Xe Kéo
                </button>
                <button className="editor-spawn-btn" onClick={() => { onSpawnItem('bridge'); handleAction('Đã thêm Cầu Gỗ!'); }}>
                  <span>🌉</span> Cầu Gỗ
                </button>
                <button className="editor-spawn-btn" onClick={() => { onSpawnItem('waterWheel'); handleAction('Đã thêm Guồng Nước!'); }}>
                  <span>⚙️</span> Guồng Nước
                </button>
                <button className="editor-spawn-btn" onClick={() => { onSpawnItem('dock'); handleAction('Đã thêm Cầu Tàu!'); }}>
                  <span>⚓</span> Cầu Tàu Bến Gỗ
                </button>
                <button className="editor-spawn-btn" onClick={() => { onSpawnItem('streamSection'); handleAction('Đã thêm Đoạn Suối!'); }}>
                  <span>🌊</span> Đoạn Suối
                </button>
                <button className="editor-spawn-btn" onClick={() => { onSpawnItem('pond'); handleAction('Đã thêm Hồ Nước!'); }}>
                  <span>💧</span> Hồ Nước
                </button>
              </>
            )}
          </div>

          {/* Row 2: Layout Persistence & Controls */}
          <div className="editor-layout-actions">
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                className="editor-tool-btn"
                onClick={() => {
                  onSaveLayout();
                  handleAction('Đã lưu bố cục làng vào trình duyệt!');
                }}
                title="Lưu lại toàn bộ vị trí vào LocalStorage"
              >
                💾 Lưu Bố Cục
              </button>
              <button
                className="editor-tool-btn"
                onClick={() => {
                  onResetLayout();
                  handleAction('Đã khôi phục bố cục mặc định ban đầu!');
                }}
                title="Khôi phục lại vị trí gốc"
              >
                ↺ Đặt Lại Gốc
              </button>
              <button
                className="editor-tool-btn"
                onClick={() => {
                  onExportJSON();
                  handleAction('Đã xuất file village_layout.json!');
                }}
                title="Tải file JSON cấu hình bố cục làng"
              >
                📥 Xuất JSON
              </button>
              <label className="editor-tool-btn" title="Nạp file JSON bố cục từ máy tính">
                📤 Nhập JSON
                <input
                  ref={jsonInputRef}
                  type="file"
                  accept=".json"
                  style={{ display: 'none' }}
                  onChange={handleJsonInput}
                />
              </label>
            </div>
            <div className="editor-hint">
              🖱️ Nhấp chọn & kéo vật thể trên mặt đất • Kéo thả file .glb từ máy tính vào màn hình
            </div>
          </div>
        </div>
      )}

      {/* Floating Selected Object Inspector Toolbar */}
      {editorMode && selectedItemName && (
        <div className="editor-selection-bar">
          <div className="editor-selection-title">
            <span>🎯</span>
            <span>{selectedItemName}</span>
          </div>

          <button
            className="editor-tool-btn"
            onClick={() => onRotateSelected(-45)}
            title="Xoay ngược chiều kim đồng hồ 45 độ"
          >
            ↺ -45°
          </button>
          <button
            className="editor-tool-btn"
            onClick={() => onRotateSelected(45)}
            title="Xoay theo chiều kim đồng hồ 45 độ"
          >
            ↻ +45°
          </button>
          <button
            className="editor-tool-btn"
            onClick={() => onScaleSelected(0.9)}
            title="Thu nhỏ 10%"
          >
            🔍 -10%
          </button>
          <button
            className="editor-tool-btn"
            onClick={() => onScaleSelected(1.1)}
            title="Phóng to 10%"
          >
            🔍 +10%
          </button>
          <button
            className="editor-tool-btn"
            onClick={() => {
              onElevateSelected(0.15);
              handleAction('Đã nâng cao độ +0.15m!');
            }}
            title="Nâng cao độ vật thể lên (+0.15m) để nổi trên mặt cỏ"
          >
            ⬆️ Lên +
          </button>
          <button
            className="editor-tool-btn"
            onClick={() => {
              onElevateSelected(-0.15);
              handleAction('Đã hạ cao độ -0.15m!');
            }}
            title="Hạ cao độ vật thể xuống (-0.15m)"
          >
            ⬇️ Xuống -
          </button>
          <button
            className="editor-tool-btn"
            onClick={() => {
              onDuplicateSelected();
              handleAction('Đã nhân bản vật thể!');
            }}
            title="Nhân bản vật thể này"
          >
            📋 Nhân Bản
          </button>
          <button
            className="editor-tool-btn"
            onClick={() => {
              onBlendSelectedColor?.();
              handleAction('Đã lên màu cỏ & đá cho núi/đá!');
            }}
            title="Chỉ dùng cho núi/đá: Lên màu cỏ xanh cho bậc thang & đá xám cho vách núi"
            style={{
              background: 'linear-gradient(135deg, #15803d, #16a34a)',
              color: '#ffffff',
              fontWeight: 600,
            }}
          >
            🎨 Lên Màu (Núi/Đá)
          </button>
          <button
            className="editor-tool-btn"
            onClick={() => {
              onRestoreSelectedColor?.();
              handleAction('Đã khôi phục màu & texture gốc cho vật thể!');
            }}
            title="Khôi phục lại toàn bộ màu sắc và texture nguyên bản ban đầu của mô hình"
            style={{
              background: 'linear-gradient(135deg, #475569, #334155)',
              color: '#ffffff',
              fontWeight: 500,
            }}
          >
            ↩️ Màu Gốc
          </button>
          {/* Replace Model Button */}
          {onReplaceModel && (
            <label
              className="editor-tool-btn"
              title="Thay thế file 3D GLB khác cho ngôi nhà này nhưng giữ nguyên ID, chức năng & vị trí!"
              style={{
                background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                color: '#ffffff',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <span>🔄 Thay Model (GLB)</span>
              <input
                ref={replaceModelInputRef}
                type="file"
                accept=".glb,.gltf"
                style={{ display: 'none' }}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (onReplaceModel) {
                    handleAction(`Đang thay mô hình ${file.name}...`);
                    const ok = await onReplaceModel(file);
                    if (ok) {
                      handleAction(`✅ Đã thay mô hình, giữ nguyên Landmark & ID!`);
                    } else {
                      handleAction(`❌ Thay thế thất bại.`);
                    }
                  }
                  e.target.value = '';
                }}
              />
            </label>
          )}

          {/* Toggle Game Function Inspector Drawer */}
          <button
            className={`editor-tool-btn ${showLandmarkInspector ? 'editor-active' : ''}`}
            onClick={() => setShowLandmarkInspector(!showLandmarkInspector)}
            title="Mở bảng cấu hình Landmark & Chức Năng Game"
            style={{
              background: showLandmarkInspector ? 'rgba(52, 211, 153, 0.35)' : 'rgba(5, 23, 18, 0.95)',
              borderColor: '#34d399',
              color: '#34d399',
              fontWeight: 700,
            }}
          >
            <span>🏛️ Landmark Inspector</span>
          </button>

          <button
            className="editor-tool-btn danger"
            onClick={() => {
              if (selectedBuildingData?.hasFunction && typeof window !== 'undefined' && !window.confirm(`Vật thể này đang gán tính năng game [${selectedBuildingData.landmarkId || selectedBuildingData.displayNameVi}]. Bạn có chắc muốn xóa không?`)) {
                return;
              }
              onDeleteSelected();
              handleAction('Đã xóa vật thể khỏi cảnh!');
            }}
            title="Xóa vật thể này"
          >
            🗑️ Xóa
          </button>
          <button
            className="editor-tool-btn"
            onClick={onDeselect}
            title="Bỏ chọn"
            style={{ color: '#94a3b8' }}
          >
            ✕ Bỏ Chọn
          </button>
        </div>
      )}

      {/* Game Function Inspector Panel (Master Task V3 Section 5) */}
      {editorMode && selectedItemName && showLandmarkInspector && (
        <div
          style={{
            position: 'absolute',
            top: '74px',
            right: '16px',
            width: '320px',
            maxHeight: 'calc(100vh - 160px)',
            overflowY: 'auto',
            backgroundColor: 'rgba(5, 22, 17, 0.96)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1.5px solid rgba(52, 211, 153, 0.5)',
            borderRadius: '16px',
            padding: '14px 16px',
            color: '#f8fafc',
            fontFamily: '"Plus Jakarta Sans", "Be Vietnam Pro", sans-serif',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.65)',
            zIndex: 45,
            fontSize: '12px',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, color: '#34d399', fontSize: '13px' }}>
              <span>🏛️</span>
              <span>Game Function Inspector</span>
            </div>
            <button
              onClick={() => setShowLandmarkInspector(false)}
              style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '14px' }}
            >
              ✕
            </button>
          </div>

          {/* Section 1: Building Identity */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontWeight: 700, color: '#fbbf24', marginBottom: '4px', textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.5px' }}>
              1. Building Identity
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', background: 'rgba(0,0,0,0.25)', padding: '6px 8px', borderRadius: '8px' }}>
              <div><span style={{ color: '#94a3b8' }}>ID:</span> <code style={{ color: '#38bdf8' }}>{selectedBuildingData?.buildingInstanceId || selectedItemName}</code></div>
              <div><span style={{ color: '#94a3b8' }}>Model:</span> <span style={{ color: '#e2e8f0', wordBreak: 'break-all' }}>{selectedBuildingData?.modelStorageKey || selectedBuildingData?.assetUrl || selectedItemName}</span></div>
            </div>
          </div>

          {/* Section 2: Game Function Binding */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontWeight: 700, color: '#fbbf24', marginBottom: '6px', textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.5px' }}>
              2. Chức Năng Game
            </div>

            {/* Function Preset Dropdown */}
            <div style={{ marginBottom: '6px' }}>
              <label style={{ display: 'block', color: '#cbd5e1', marginBottom: '2px', fontSize: '11px' }}>Chọn chức năng:</label>
              <select
                style={{
                  width: '100%',
                  backgroundColor: '#0f172a',
                  color: '#ffffff',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  padding: '5px 8px',
                  fontSize: '11px',
                }}
                value={selectedBuildingData?.landmarkId || ''}
                onChange={(e) => {
                  const lid = e.target.value;
                  if (!lid) {
                    onUpdateBuildingLandmark?.({
                      hasFunction: false,
                      landmarkId: undefined,
                      actionId: undefined,
                    });
                    handleAction('Đã hủy gán chức năng.');
                  } else {
                    const preset = LANDMARK_CATALOG[lid];
                    if (preset) {
                      onUpdateBuildingLandmark?.({
                        hasFunction: true,
                        landmarkId: preset.landmarkId,
                        actionId: preset.actionId,
                        displayNameVi: preset.displayName.vi,
                        displayNameEn: preset.displayName.en,
                        iconId: preset.iconId,
                        descriptionVi: preset.descriptionVi,
                        interactionAnchorLocal: [...preset.defaultInteractionAnchor],
                        labelAnchorLocal: [...preset.defaultLabelAnchor],
                        interactionRadius: preset.interactionRadius,
                      });
                      handleAction(`Đã gán chức năng: ${preset.displayName.vi}`);
                    }
                  }
                }}
              >
                <option value="">(Không gán - Vật trang trí)</option>
                <option value="herbal_garden">🌿 Vườn Thảo Mộc (OPEN_HERBAL_GARDEN)</option>
                <option value="cloud_therapy">☁️ Liệu Pháp Trên Mây (OPEN_CLOUD_THERAPY)</option>
                <option value="knowledge_library">📖 Thư Viện Tri Thức (OPEN_KNOWLEDGE_LIBRARY)</option>
                <option value="journey_house">🏰 Hành Trình Của Tôi (OPEN_JOURNEY_HOUSE)</option>
                <option value="task_square">⛲ Quảng Trường Nhiệm Vụ (OPEN_TASK_SQUARE)</option>
              </select>
            </div>

            {/* Display Name VI & EN */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '6px' }}>
              <div>
                <label style={{ display: 'block', color: '#cbd5e1', marginBottom: '2px', fontSize: '10px' }}>Tên Tiếng Việt:</label>
                <input
                  type="text"
                  value={selectedBuildingData?.displayNameVi || ''}
                  onChange={(e) => onUpdateBuildingLandmark?.({ displayNameVi: e.target.value, hasFunction: true })}
                  style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '4px', padding: '4px 6px', color: '#fff', fontSize: '11px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', color: '#cbd5e1', marginBottom: '2px', fontSize: '10px' }}>Tên Tiếng Anh:</label>
                <input
                  type="text"
                  value={selectedBuildingData?.displayNameEn || ''}
                  onChange={(e) => onUpdateBuildingLandmark?.({ displayNameEn: e.target.value, hasFunction: true })}
                  style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '4px', padding: '4px 6px', color: '#fff', fontSize: '11px' }}
                />
              </div>
            </div>

            {/* Icon Picker & Action ID */}
            <div style={{ marginBottom: '6px' }}>
              <label style={{ display: 'block', color: '#cbd5e1', marginBottom: '2px', fontSize: '10px' }}>Biểu tượng nhận diện:</label>
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '6px' }}>
                {AVAILABLE_ICONS.map((ic) => (
                  <button
                    key={ic}
                    type="button"
                    onClick={() => onUpdateBuildingLandmark?.({ iconId: ic, hasFunction: true })}
                    style={{
                      background: selectedBuildingData?.iconId === ic ? '#10b981' : 'rgba(255,255,255,0.08)',
                      border: selectedBuildingData?.iconId === ic ? '1px solid #34d399' : '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '6px',
                      padding: '2px 6px',
                      cursor: 'pointer',
                      fontSize: '13px',
                    }}
                  >
                    {ic}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '6px' }}>
              <label style={{ display: 'block', color: '#cbd5e1', marginBottom: '2px', fontSize: '10px' }}>Action ID (Mobile Route):</label>
              <input
                type="text"
                value={selectedBuildingData?.actionId || ''}
                onChange={(e) => onUpdateBuildingLandmark?.({ actionId: e.target.value, hasFunction: true })}
                style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '4px', padding: '4px 6px', color: '#38bdf8', fontSize: '11px', fontFamily: 'monospace' }}
              />
            </div>

            {/* Enable Toggle */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', marginTop: '6px' }}>
              <input
                type="checkbox"
                checked={selectedBuildingData?.enabled !== false}
                onChange={(e) => onUpdateBuildingLandmark?.({ enabled: e.target.checked })}
              />
              <span style={{ color: '#cbd5e1', fontSize: '11px' }}>Kích hoạt tương tác cho người chơi</span>
            </label>
          </div>

          {/* Section 3: Interaction & Anchor Offsets */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontWeight: 700, color: '#fbbf24', marginBottom: '6px', textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.5px' }}>
              3. Tương Tác & Điểm Đón Cửa
            </div>

            {/* Mode & Radius */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '6px' }}>
              <div>
                <label style={{ display: 'block', color: '#cbd5e1', marginBottom: '2px', fontSize: '10px' }}>Chế độ tương tác:</label>
                <select
                  value={selectedBuildingData?.interactionMode || 'walk_then_enter'}
                  onChange={(e) => onUpdateBuildingLandmark?.({ interactionMode: e.target.value as any })}
                  style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '4px', padding: '4px', color: '#fff', fontSize: '10px' }}
                >
                  <option value="walk_then_enter">Đi tới cửa rồi vào</option>
                  <option value="direct_open">Mở trực tiếp</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', color: '#cbd5e1', marginBottom: '2px', fontSize: '10px' }}>
                  Bán kính: {selectedBuildingData?.interactionRadius || 2.5}m
                </label>
                <input
                  type="range"
                  min="1.0"
                  max="5.0"
                  step="0.5"
                  value={selectedBuildingData?.interactionRadius || 2.5}
                  onChange={(e) => onUpdateBuildingLandmark?.({ interactionRadius: parseFloat(e.target.value) })}
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            {/* Door Anchor Local (X, Z) */}
            <div style={{ background: 'rgba(0,0,0,0.25)', padding: '6px 8px', borderRadius: '8px', marginBottom: '6px' }}>
              <div style={{ color: '#34d399', fontWeight: 600, fontSize: '10px', marginBottom: '4px' }}>
                🚪 Điểm Đón Trước Cửa (Door Anchor Local):
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: '#94a3b8' }}>X offset: {selectedBuildingData?.interactionAnchorLocal?.[0]?.toFixed(1) || 0}m</span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      const cur = selectedBuildingData?.interactionAnchorLocal || [0, 0, 2.8];
                      onUpdateBuildingLandmark?.({ interactionAnchorLocal: [cur[0] - 0.2, cur[1], cur[2]] });
                    }}
                    style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '4px', padding: '2px 6px', color: '#fff', cursor: 'pointer' }}
                  >-0.2</button>
                  <button
                    type="button"
                    onClick={() => {
                      const cur = selectedBuildingData?.interactionAnchorLocal || [0, 0, 2.8];
                      onUpdateBuildingLandmark?.({ interactionAnchorLocal: [cur[0] + 0.2, cur[1], cur[2]] });
                    }}
                    style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '4px', padding: '2px 6px', color: '#fff', cursor: 'pointer' }}
                  >+0.2</button>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Z offset: {selectedBuildingData?.interactionAnchorLocal?.[2]?.toFixed(1) || 2.8}m</span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      const cur = selectedBuildingData?.interactionAnchorLocal || [0, 0, 2.8];
                      onUpdateBuildingLandmark?.({ interactionAnchorLocal: [cur[0], cur[1], cur[2] - 0.2] });
                    }}
                    style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '4px', padding: '2px 6px', color: '#fff', cursor: 'pointer' }}
                  >-0.2</button>
                  <button
                    type="button"
                    onClick={() => {
                      const cur = selectedBuildingData?.interactionAnchorLocal || [0, 0, 2.8];
                      onUpdateBuildingLandmark?.({ interactionAnchorLocal: [cur[0], cur[1], cur[2] + 0.2] });
                    }}
                    style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '4px', padding: '2px 6px', color: '#fff', cursor: 'pointer' }}
                  >+0.2</button>
                </div>
              </div>
            </div>

            {/* Label Anchor Local (Y) */}
            <div style={{ background: 'rgba(0,0,0,0.25)', padding: '6px 8px', borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>🏷️ Độ cao nhãn (Y): {selectedBuildingData?.labelAnchorLocal?.[1]?.toFixed(1) || 4.0}m</span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      const cur = selectedBuildingData?.labelAnchorLocal || [0, 4.0, 0];
                      onUpdateBuildingLandmark?.({ labelAnchorLocal: [cur[0], cur[1] - 0.2, cur[2]] });
                    }}
                    style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '4px', padding: '2px 6px', color: '#fff', cursor: 'pointer' }}
                  >-0.2</button>
                  <button
                    type="button"
                    onClick={() => {
                      const cur = selectedBuildingData?.labelAnchorLocal || [0, 4.0, 0];
                      onUpdateBuildingLandmark?.({ labelAnchorLocal: [cur[0], cur[1] + 0.2, cur[2]] });
                    }}
                    style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '4px', padding: '2px 6px', color: '#fff', cursor: 'pointer' }}
                  >+0.2</button>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Validation */}
          <div>
            <div style={{ fontWeight: 700, color: '#fbbf24', marginBottom: '4px', textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.5px' }}>
              4. Kiểm Tra Hợp Lệ (Validation)
            </div>
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '6px 8px', borderRadius: '8px', fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <div>🏝️ Nằm trên đảo: <strong style={{ color: selectedValidation?.isOnIsland ? '#34d399' : '#f87171' }}>{selectedValidation?.isOnIsland ? '✅ Hợp lệ' : '❌ Ngoài đảo'}</strong></div>
              <div>🚪 Cửa tiếp cận: <strong style={{ color: selectedValidation?.isDoorReachable ? '#34d399' : '#fbbf24' }}>{selectedValidation?.isDoorReachable ? '✅ Hợp lệ' : '⚠️ Bị chắn'}</strong></div>
              <div>🔑 Không trùng ID: <strong style={{ color: selectedValidation?.noDuplicateLandmark ? '#34d399' : '#f87171' }}>{selectedValidation?.noDuplicateLandmark ? '✅ Độc nhất' : '❌ Trùng landmarkId'}</strong></div>
              {selectedValidation?.warnings && selectedValidation.warnings.length > 0 && (
                <div style={{ marginTop: '4px', color: '#fbbf24', fontSize: '10px' }}>
                  {selectedValidation.warnings.map((w, idx) => (
                    <div key={idx}>⚠️ {w}</div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Real-time Performance HUD */}
      {showStats && (
        <div className="stats-badge">
          <div>FPS: <span className="stats-val">{fps}</span></div>
          <div>Triangles: <span className="stats-val">{(triangles / 1000).toFixed(1)}k</span></div>
          <div>Draw Calls: <span className="stats-val">{drawCalls}</span></div>
          <div>Preset: <span className="stats-val" style={{ textTransform: 'capitalize' }}>{quality}</span></div>
          <div>Scene: <span className="stats-val" style={{ textTransform: 'capitalize', color: '#fbbf24' }}>{worldMode}</span></div>
        </div>
      )}

      {/* Action Toast Feedback */}
      {actionFeedback && (
        <div style={{
          position: 'absolute',
          top: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(245, 158, 11, 0.95)',
          color: '#000',
          padding: '8px 16px',
          borderRadius: '999px',
          fontWeight: 600,
          fontSize: '0.85rem',
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          pointerEvents: 'none',
          zIndex: 60,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          ✨ {actionFeedback}
        </div>
      )}

      {/* Bottom Footer: 5 Compact Location Shortcuts */}
      <footer className="hud-footer">
        <div className="location-bar">
          {locations.map((loc) => {
            const isActive = activeTargetId === loc.id;
            return (
              <button
                key={loc.id}
                className={`loc-btn ${isActive ? 'active' : ''}`}
                onClick={() => onSelectLocation(loc)}
                title={loc.description}
              >
                <span className="loc-icon">{loc.emoji}</span>
                <span>{loc.shortName}</span>
                {isActive && isMoving && (
                  <span style={{ fontSize: '0.7rem', color: '#fbbf24' }}>● walking</span>
                )}
              </button>
            );
          })}
        </div>
        <div className="hud-hint">
          <span>🖱️ <b>Drag</b> rotate • <b>Scroll</b> zoom • <b>Click/Tap</b> walk anywhere</span>
        </div>
      </footer>

      {/* Interactive Location Dialog / Modal */}
      {selectedLocation && (
        <div className="modal-backdrop" onClick={onCloseModal}>
          <div className="location-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-wrap">
                <span className="modal-emoji">{selectedLocation.emoji}</span>
                <div>
                  <h2 className="modal-title">{selectedLocation.name}</h2>
                  <div className="modal-subtitle">{selectedLocation.badge}</div>
                </div>
              </div>
              <button className="modal-close-btn" onClick={onCloseModal}>✕</button>
            </div>

            <div className="modal-body">
              <p>{selectedLocation.description}</p>
              
              <div className="modal-features">
                {selectedLocation.features.map((feat, idx) => (
                  <div key={idx} className="feature-pill">{feat}</div>
                ))}
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn-primary"
                onClick={() => handleAction(`Completed: ${selectedLocation.actionText}!`)}
              >
                {selectedLocation.actionText}
              </button>
              {selectedLocation.secondaryActionText && (
                <button
                  className="btn-secondary"
                  onClick={() => handleAction(`Completed: ${selectedLocation.secondaryActionText}!`)}
                >
                  {selectedLocation.secondaryActionText}
                </button>
              )}
              <button className="btn-secondary" onClick={onCloseModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
