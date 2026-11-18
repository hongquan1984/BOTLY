import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import JSZip from 'jszip';
import { waterAnimationManager } from '../../systems/waterAnimation';

export interface ExtractedAssetItem {
  id: string;
  name: string;
  filename: string;
  category: string;
  relativePath: string;
  triangles: number;
  vertices: number;
  fileSizeBytes: number;
  fileSizeKb: string;
  dimensions: {
    width: number;
    height: number;
    depth: number;
  };
  instancesInOriginalVillage: number;
  description: string;
}

interface AssetLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlaceInMap: (asset: ExtractedAssetItem) => void;
}

export const AssetLibraryModal: React.FC<AssetLibraryModalProps> = ({
  isOpen,
  onClose,
  onPlaceInMap,
}) => {
  const [manifest, setManifest] = useState<ExtractedAssetItem[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<ExtractedAssetItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [wireframe, setWireframe] = useState<boolean>(false);
  const [isZipping, setIsZipping] = useState<boolean>(false);
  const [zipProgress, setZipProgress] = useState<string>('');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewerRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    currentMesh: THREE.Object3D | null;
    controls: {
      isDragging: boolean;
      prevMouse: { x: number; y: number };
      spherical: { radius: number; phi: number; theta: number };
    };
  } | null>(null);

  // Load manifest.json on mount
  useEffect(() => {
    fetch('/assets-extracted/manifest.json')
      .then((res) => res.json())
      .then((data) => {
        if (data.assets && Array.isArray(data.assets)) {
          setManifest(data.assets);
          if (data.assets.length > 0) {
            setSelectedAsset(data.assets[0]);
          }
        }
      })
      .catch((err) => console.error('Failed to load asset manifest:', err));
  }, []);

  // 3D Canvas Viewport Setup
  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = canvas.clientWidth || 540;
    const height = canvas.clientHeight || 420;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: false,
        alpha: true,
        powerPreference: 'low-power',
      });
    } catch (e) {
      console.warn('Could not initialize Asset Studio modal preview WebGL context:', e);
      return;
    }

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;

    const scene = new THREE.Scene();

    // Studio Lighting
    const ambientLight = new THREE.AmbientLight('#ffffff', 0.85);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight('#fffbeb', 1.8);
    keyLight.position.set(5, 8, 5);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight('#93c5fd', 0.8);
    fillLight.position.set(-5, 4, -4);
    scene.add(fillLight);

    // Subtle Ground Grid
    const grid = new THREE.GridHelper(10, 10, '#f59e0b', '#334155');
    grid.position.y = -0.01;
    scene.add(grid);

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(4, 3, 5);
    camera.lookAt(0, 1, 0);

    const controls = {
      isDragging: false,
      prevMouse: { x: 0, y: 0 },
      spherical: { radius: 6.5, phi: Math.PI / 3, theta: Math.PI / 4 },
    };

    viewerRef.current = {
      scene,
      camera,
      renderer,
      currentMesh: null,
      controls,
    };

    // Orbit Drag Controls
    const onMouseDown = (e: MouseEvent) => {
      controls.isDragging = true;
      controls.prevMouse = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!controls.isDragging) return;
      const deltaX = e.clientX - controls.prevMouse.x;
      const deltaY = e.clientY - controls.prevMouse.y;
      controls.prevMouse = { x: e.clientX, y: e.clientY };

      controls.spherical.theta -= deltaX * 0.01;
      controls.spherical.phi = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, controls.spherical.phi - deltaY * 0.01));
    };

    const onMouseUp = () => {
      controls.isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      controls.spherical.radius = Math.max(1.5, Math.min(20, controls.spherical.radius + e.deltaY * 0.005));
    };

    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });

    // Touch controls
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        controls.isDragging = true;
        controls.prevMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!controls.isDragging || e.touches.length !== 1) return;
      const deltaX = e.touches[0].clientX - controls.prevMouse.x;
      const deltaY = e.touches[0].clientY - controls.prevMouse.y;
      controls.prevMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };

      controls.spherical.theta -= deltaX * 0.01;
      controls.spherical.phi = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, controls.spherical.phi - deltaY * 0.01));
    };

    const onTouchEnd = () => {
      controls.isDragging = false;
    };

    canvas.addEventListener('touchstart', onTouchStart);
    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('touchend', onTouchEnd);

    // Animation Loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      waterAnimationManager.update(performance.now() / 1000);

      if (autoRotate && !controls.isDragging) {
        controls.spherical.theta += 0.008;
      }

      // Update Camera from spherical coordinates
      const s = controls.spherical;
      const targetY = viewerRef.current?.currentMesh?.userData?.targetY || 1.0;
      camera.position.x = s.radius * Math.sin(s.phi) * Math.sin(s.theta);
      camera.position.y = targetY + s.radius * Math.cos(s.phi);
      camera.position.z = s.radius * Math.sin(s.phi) * Math.cos(s.theta);
      camera.lookAt(0, targetY, 0);

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      renderer.dispose();
      renderer.forceContextLoss();
    };
  }, [isOpen, autoRotate]);

  // Load and display 3D model when selectedAsset changes
  useEffect(() => {
    if (!isOpen || !selectedAsset || !viewerRef.current) return;

    const { scene, controls } = viewerRef.current;

    // Remove old mesh
    if (viewerRef.current.currentMesh) {
      scene.remove(viewerRef.current.currentMesh);
      viewerRef.current.currentMesh = null;
    }

    const loader = new GLTFLoader();
    loader.load(
      `/${selectedAsset.relativePath}`,
      (gltf) => {
        const model = gltf.scene;

        // Apply wireframe if enabled
        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            const mat = mesh.material as THREE.MeshStandardMaterial;
            if (mat) {
              mat.wireframe = wireframe;
            }
          }
        });

        // Compute Bounding Box to adjust camera distance and center
        const box = new THREE.Box3().setFromObject(model);
        const size = new THREE.Vector3();
        box.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z);

        const targetY = size.y * 0.45;
        model.userData.targetY = targetY;

        controls.spherical.radius = Math.max(2.5, maxDim * 1.85);

        waterAnimationManager.animateWaterMeshes(model);
        scene.add(model);
        viewerRef.current!.currentMesh = model;
      },
      undefined,
      (err) => console.error('Error loading asset preview:', err)
    );
  }, [isOpen, selectedAsset, wireframe]);

  if (!isOpen) return null;

  const categories = [
    { id: 'all', label: `Tất cả (${manifest.length || 22})` },
    { id: 'terrain', label: '🌊 Suối & Nước (6)' },
    { id: 'houses', label: '🏡 Nhà cửa (3)' },
    { id: 'trees', label: '🌳 Cây cối (3)' },
    { id: 'props', label: '⛲ Đồ vật (3)' },
    { id: 'vegetation', label: '🌿 Cây cỏ (6)' },
    { id: 'rocks', label: '🪨 Đá tự nhiên (1)' },
  ];

  const filteredAssets =
    selectedCategory === 'all'
      ? manifest
      : manifest.filter((item) => item.category === selectedCategory);

  // Single GLB Download
  const handleDownloadSingle = (asset: ExtractedAssetItem) => {
    const link = document.createElement('a');
    link.href = `/${asset.relativePath}`;
    link.download = asset.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Bulk ZIP Download
  const handleDownloadAllZip = async () => {
    if (isZipping || manifest.length === 0) return;
    setIsZipping(true);
    setZipProgress('Đang chuẩn bị gói ZIP...');

    try {
      const zip = new JSZip();

      // Fetch and bundle each GLB
      for (let i = 0; i < manifest.length; i++) {
        const item = manifest[i];
        setZipProgress(`Đang nén ${i + 1}/${manifest.length}: ${item.filename}...`);
        const res = await fetch(`/${item.relativePath}`);
        const buffer = await res.arrayBuffer();
        zip.file(`${item.category}/${item.filename}`, buffer);
      }

      // Add manifest.json and README.txt
      const manifestRes = await fetch('/assets-extracted/manifest.json');
      const manifestJson = await manifestRes.text();
      zip.file('manifest.json', manifestJson);

      zip.file(
        'README.txt',
        `HEALTHCLUES COZY VILLAGE EXTRACTED 3D ASSETS\n` +
          `===========================================\n` +
          `Tong so asset da tach: ${manifest.length} models\n` +
          `Format: glTF 2.0 Binary (.glb)\n` +
          `Dac tinh:\n` +
          `- Day mo hinh dat chuan tai Y=0 (bottom grounded)\n` +
          `- Tam mo hinh dat chuan tai (0, 0) X-Z\n` +
          `- Giu nguyen Vertex Colors, Normals, Materials\n` +
          `- San sang keo tha vao ThreeJS Assets Studio Map Builder & Blender\n\n` +
          `Danh sach cac thu muc:\n` +
          `- houses/      : 3 toa nha co kinh\n` +
          `- trees/       : 3 loai cay phong cach\n` +
          `- props/       : 3 do vat quang truong\n` +
          `- vegetation/  : 6 loai bui co hoa la\n` +
          `- rocks/       : 1 tang da phu reu\n`
      );

      setZipProgress('Đang tạo file ZIP cuối cùng...');
      const zipBlob = await zip.generateAsync({ type: 'blob' });

      // Trigger browser download
      const link = document.createElement('a');
      link.href = URL.createObjectURL(zipBlob);
      link.download = 'HealthClues_Cozy_Village_Extracted_Assets.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      setZipProgress('Hoàn tất tải về!');
      setTimeout(() => {
        setIsZipping(false);
        setZipProgress('');
      }, 2500);
    } catch (err) {
      console.error('ZIP generation failed:', err);
      alert('Không thể tạo file zip: ' + err);
      setIsZipping(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 80 }}>
      <div
        className="asset-library-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '92vw',
          maxWidth: '1180px',
          height: '86vh',
          maxHeight: '780px',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
          borderRadius: '20px',
          border: '1px solid rgba(245, 158, 11, 0.4)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.8), 0 0 30px rgba(245, 158, 11, 0.25)',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 20px',
            background: 'rgba(15, 23, 42, 0.95)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.6rem' }}>📦</span>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                Thư Viện 3D Asset Studio — Cozy Village Extracted
              </h2>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0 }}>
                Bộ 20 mô hình 3D tách biệt từ bản đồ làng (gồm 4 mẫu suối, hồ đá, thác nước & nhà cửa, cây cỏ)
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Download Full ZIP Button */}
            <button
              className="editor-tool-btn"
              onClick={handleDownloadAllZip}
              disabled={isZipping}
              style={{
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: '#000',
                fontWeight: 700,
                padding: '7px 14px',
                borderRadius: '8px',
                border: 'none',
              }}
              title="Tải toàn bộ 20 file GLB đã tách theo từng thư mục"
            >
              <span>{isZipping ? '⏳' : '📦'}</span>
              <span>{isZipping ? zipProgress : `Tải Trọn Bộ ZIP (${manifest.length || 20} Assets)`}</span>
            </button>

            <button
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                color: '#cbd5e1',
                fontSize: '1.2rem',
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Modal Main Content: Split View */}
        <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
          {/* Left Sidebar: Asset List & Filters */}
          <div
            style={{
              width: '320px',
              borderRight: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              flexDirection: 'column',
              background: 'rgba(15, 23, 42, 0.75)',
            }}
          >
            {/* Category Filter Tabs */}
            <div
              style={{
                display: 'flex',
                gap: '6px',
                overflowX: 'auto',
                padding: '10px 12px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                scrollbarWidth: 'none',
              }}
            >
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  style={{
                    background: selectedCategory === cat.id ? 'rgba(245, 158, 11, 0.25)' : 'rgba(255, 255, 255, 0.06)',
                    borderColor: selectedCategory === cat.id ? '#fbbf24' : 'rgba(255, 255, 255, 0.12)',
                    color: selectedCategory === cat.id ? '#fef08a' : '#cbd5e1',
                    fontSize: '0.72rem',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                    border: '1px solid',
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Assets List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
              {filteredAssets.map((asset) => {
                const isSelected = selectedAsset?.id === asset.id;
                return (
                  <div
                    key={asset.id}
                    className="asset-item-card"
                    onClick={() => setSelectedAsset(asset)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '10px',
                      marginBottom: '6px',
                      cursor: 'pointer',
                      background: isSelected ? 'rgba(245, 158, 11, 0.18)' : 'rgba(255, 255, 255, 0.03)',
                      border: isSelected ? '1px solid #fbbf24' : '1px solid rgba(255, 255, 255, 0.06)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '0.84rem', color: isSelected ? '#fef08a' : '#f8fafc' }}>
                        {asset.name}
                      </strong>
                      <span
                        style={{
                          fontSize: '0.65rem',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: 'rgba(255, 255, 255, 0.1)',
                          color: '#94a3b8',
                        }}
                      >
                        {asset.category}
                      </span>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginTop: '4px',
                        fontSize: '0.72rem',
                        color: '#94a3b8',
                      }}
                    >
                      <span>🔺 {asset.triangles.toLocaleString()} tris</span>
                      <span>•</span>
                      <span>💾 {asset.fileSizeKb}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Center 3D Preview Viewport */}
          <div
            style={{
              flex: 1,
              position: 'relative',
              background: 'radial-gradient(circle at center, #1e293b 0%, #0f172a 100%)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Viewport Top Controls Toolbar */}
            <div
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                display: 'flex',
                gap: '8px',
                zIndex: 10,
              }}
            >
              <button
                className="editor-tool-btn"
                onClick={() => setAutoRotate(!autoRotate)}
                title="Bật/Tắt tự động xoay 360 độ"
                style={{
                  background: autoRotate ? 'rgba(245, 158, 11, 0.25)' : 'rgba(255, 255, 255, 0.1)',
                  borderColor: autoRotate ? '#fbbf24' : 'rgba(255, 255, 255, 0.2)',
                  color: autoRotate ? '#fef08a' : '#f1f5f9',
                }}
              >
                <span>↺</span>
                <span>Tự xoay: {autoRotate ? 'BẬT' : 'TẮT'}</span>
              </button>

              <button
                className="editor-tool-btn"
                onClick={() => setWireframe(!wireframe)}
                title="Bật/Tắt chế độ khung lưới (Wireframe)"
                style={{
                  background: wireframe ? 'rgba(245, 158, 11, 0.25)' : 'rgba(255, 255, 255, 0.1)',
                  borderColor: wireframe ? '#fbbf24' : 'rgba(255, 255, 255, 0.2)',
                  color: wireframe ? '#fef08a' : '#f1f5f9',
                }}
              >
                <span>🕸️</span>
                <span>Wireframe: {wireframe ? 'BẬT' : 'TẮT'}</span>
              </button>
            </div>

            {/* Interactive 3D Canvas */}
            <canvas
              ref={canvasRef}
              style={{
                width: '100%',
                height: '100%',
                display: 'block',
                cursor: 'grab',
              }}
            />

            {/* Bottom Floating Info & Action Bar */}
            {selectedAsset && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '14px',
                  left: '16px',
                  right: '16px',
                  background: 'rgba(15, 23, 42, 0.92)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(245, 158, 11, 0.35)',
                  borderRadius: '14px',
                  padding: '12px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong style={{ fontSize: '1rem', color: '#fbbf24' }}>{selectedAsset.name}</strong>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>({selectedAsset.filename})</span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      gap: '12px',
                      fontSize: '0.75rem',
                      color: '#cbd5e1',
                      marginTop: '4px',
                    }}
                  >
                    <span>🔺 <strong>{selectedAsset.triangles.toLocaleString()}</strong> tam giác</span>
                    <span>•</span>
                    <span>💾 <strong>{selectedAsset.fileSizeKb}</strong></span>
                    <span>•</span>
                    <span>
                      📏 <strong>{selectedAsset.dimensions.width}m × {selectedAsset.dimensions.height}m × {selectedAsset.dimensions.depth}m</strong>
                    </span>
                    <span>•</span>
                    <span>Gốc tọa độ: <strong>Đáy Y=0 (Grounded)</strong></span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className="editor-tool-btn"
                    onClick={() => handleDownloadSingle(selectedAsset)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      color: '#f8fafc',
                      padding: '8px 14px',
                      borderRadius: '8px',
                    }}
                    title="Tải riêng file GLB này về máy tính"
                  >
                    <span>📥</span>
                    <span>Tải GLB Này</span>
                  </button>

                  <button
                    className="editor-tool-btn"
                    onClick={() => {
                      onPlaceInMap(selectedAsset);
                      onClose();
                    }}
                    style={{
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: '#fff',
                      fontWeight: 600,
                      padding: '8px 14px',
                      borderRadius: '8px',
                      border: 'none',
                    }}
                    title="Đưa ngay vật thể này vào bản đồ làng để kéo thả vị trí"
                  >
                    <span>🚀</span>
                    <span>Đặt Vào Làng (Map Builder)</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
