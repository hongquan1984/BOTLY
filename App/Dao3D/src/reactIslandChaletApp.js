import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Access React & ReactDOM from global UMD bundle
const { useState, useEffect, useRef, useCallback, useMemo } = window.React;
const e = window.React.createElement;

// ============================================================================
// AUDIO SFX HELPER (Web Audio API - Zero External Audio File Dependencies)
// ============================================================================
class SoundEffects {
  constructor() {
    this.ctx = null;
  }
  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }
  playClick() {
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.08);
  }
  playPlace() {
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(520, this.ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }
  playToggle() {
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.12);
  }
  playDelete() {
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(350, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.14);
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.14);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.14);
  }
}
const sfx = new SoundEffects();

// ============================================================================
// CATALOG: MERGED 3DHOME INDOOR FURNITURE & ISLAND OUTDOOR ASSETS
// ============================================================================
const MERGED_CATALOG = [
  // --- 3DHOME INDOOR FURNITURE ---
  {
    id: 'sofa_03',
    name: 'Sofa Vải Nỉ Cao Cấp',
    category: '3dhome',
    placementType: 'interior',
    modelUrl: '/sofa_03.glb',
    scale: 1.0,
    price: 120,
    emoji: '🛋️',
    description: 'Sofa 3 chỗ ngồi êm ái phong cách Bắc Âu cho phòng khách Chalet.',
  },
  {
    id: 'coffee_table_round_01',
    name: 'Bàn Trà Tròn Gỗ Sồi',
    category: '3dhome',
    placementType: 'interior',
    modelUrl: '/coffee_table_round_01.glb',
    scale: 1.0,
    price: 65,
    emoji: '🪵',
    description: 'Bàn trà gỗ sồi mộc mạc đặt cạnh sofa phòng khách.',
  },
  {
    id: 'mid_century_lounge_chair',
    name: 'Ghế Bành Thư Giãn Mid-Century',
    category: '3dhome',
    placementType: 'interior',
    modelUrl: '/mid_century_lounge_chair.glb',
    scale: 1.0,
    price: 85,
    emoji: '🪑',
    description: 'Ghế bành êm ái thư giãn ngắm cảnh núi tuyết bên cửa kính.',
  },
  {
    id: 'wooden_bookshelf_worn',
    name: 'Kệ Sách Gỗ Mộc Cổ Điển',
    category: '3dhome',
    placementType: 'interior',
    modelUrl: '/wooden_bookshelf_worn.glb',
    scale: 1.0,
    price: 95,
    emoji: '📚',
    description: 'Kệ sách gỗ thông lưu trữ cổ thư và dược điển y học.',
  },
  {
    id: 'dining_table',
    name: 'Bàn Ăn Gia Đình Chalet',
    category: '3dhome',
    placementType: 'interior',
    modelUrl: '/dining_table.glb',
    scale: 1.0,
    price: 110,
    emoji: '🍽️',
    description: 'Bàn ăn gỗ sồi tự nhiên cho phòng ăn và gian bếp.',
  },
  {
    id: 'dining_chair_02',
    name: 'Ghế Ăn Alpine',
    category: '3dhome',
    placementType: 'interior',
    modelUrl: '/dining_chair_02.glb',
    scale: 1.0,
    price: 45,
    emoji: '🪑',
    description: 'Ghế ăn gỗ thanh lịch đồng bộ với bàn ăn gia đình.',
  },
  {
    id: 'GothicBed_01',
    name: 'Giường Ngủ Master Suite',
    category: '3dhome',
    placementType: 'interior',
    modelUrl: '/GothicBed_01.glb',
    scale: 0.95,
    price: 160,
    emoji: '🛏️',
    description: 'Giường ngủ đôi cao cấp êm ái cho phòng ngủ chính.',
  },
  {
    id: 'ClassicNightstand_01',
    name: 'Tủ Đầu Giường Rustic',
    category: '3dhome',
    placementType: 'interior',
    modelUrl: '/ClassicNightstand_01.glb',
    scale: 1.0,
    price: 40,
    emoji: '🗄️',
    description: 'Tủ gỗ nhỏ đầu giường để đèn ngủ và đồng hồ.',
  },
  {
    id: 'drawer_cabinet',
    name: 'Tủ Quần Áo Gỗ Khắc',
    category: '3dhome',
    placementType: 'interior',
    modelUrl: '/drawer_cabinet.glb',
    scale: 1.0,
    price: 130,
    emoji: '🚪',
    description: 'Tủ gỗ đựng trang phục và khăn ấm cho mùa đông.',
  },
  {
    id: 'tea_set_01',
    name: 'Bộ Ấm Chén Trà Gốm Sứ',
    category: '3dhome',
    placementType: 'interior',
    modelUrl: '/tea_set_01.glb',
    scale: 1.0,
    price: 35,
    emoji: '🫖',
    description: 'Bộ ấm trà nóng thưởng thức bên lò sưởi ấm cúng.',
  },
  {
    id: 'wooden_bowl_01',
    name: 'Bát Gỗ Hoa Quả Rừng',
    category: '3dhome',
    placementType: 'interior',
    modelUrl: '/wooden_bowl_01.glb',
    scale: 1.0,
    price: 25,
    emoji: '🍎',
    description: 'Bát gỗ táo tươi ngon lành đặt trên bàn ăn.',
  },
  {
    id: 'ceramic_vase_01',
    name: 'Bình Gốm Hoa Dại Alpine',
    category: '3dhome',
    placementType: '3dhome',
    modelUrl: '/ceramic_vase_01.glb',
    scale: 1.0,
    price: 30,
    emoji: '🏺',
    description: 'Bình hoa gốm thủ công cắm hoa dại trên bậu cửa sổ.',
  },
  {
    id: 'potted_plant_04',
    name: 'Chậu Cây Xanh Trong Nhà',
    category: 'plants',
    placementType: 'both',
    modelUrl: '/potted_plant_04.glb',
    scale: 1.0,
    price: 50,
    emoji: '🪴',
    description: 'Cây kiểng thanh lọc không khí trong phòng khách và hiên nhà.',
  },
  {
    id: 'lantern_chandelier_01',
    name: 'Đèn Chùm Đèn Lồng Cổ Điển',
    category: '3dhome',
    placementType: 'interior',
    modelUrl: '/lantern_chandelier_01.glb',
    scale: 1.0,
    price: 90,
    emoji: '🏮',
    description: 'Đèn chùm tỏa ánh sáng vàng ấm áp cho cả căn phòng.',
  },

  // --- ISLAND OUTDOOR ASSETS ---
  {
    id: 'out_outdoor_dining',
    name: 'Bộ Bàn Ghế Hiên Nhà Hướng Núi',
    category: 'exterior',
    placementType: 'exterior',
    modelUrl: '/outdoor_table_chair_set_01.glb',
    scale: 1.0,
    price: 110,
    emoji: '☕',
    description: 'Bàn ghế hiên nhà ngắm hồ Brienz và mây trôi trên đỉnh núi.',
  },
  {
    id: 'out_stone_fire_pit',
    name: 'Lò Lửa Đá Sân Vườn',
    category: 'exterior',
    placementType: 'exterior',
    modelUrl: '/stone_fire_pit.glb',
    scale: 1.0,
    price: 80,
    emoji: '🔥',
    description: 'Bếp lửa đá ngoài trời sưởi ấm những đêm ngắm sao.',
  },
  {
    id: 'out_planter_box',
    name: 'Bồn Hoa Gỗ Hiên Nhà',
    category: 'plants',
    placementType: 'both',
    modelUrl: '/planter_box_01.glb',
    scale: 1.0,
    price: 40,
    emoji: '🌸',
    description: 'Bồn hoa ngát hương rực rỡ sắc màu bên ban công.',
  },
  {
    id: 'out_island_tree',
    name: 'Cây Thông Cổ Thụ Alpine',
    category: 'plants',
    placementType: 'exterior',
    modelUrl: '/island_tree_02.glb',
    scale: 1.2,
    price: 70,
    emoji: '🌲',
    description: 'Cây thông cổ thụ reo vui trong gió núi.',
  },
  {
    id: 'out_tree_small',
    name: 'Cây Phong Núi Lá Nhỏ',
    category: 'plants',
    placementType: 'exterior',
    modelUrl: '/tree_small_02.glb',
    scale: 1.1,
    price: 55,
    emoji: '🌳',
    description: 'Cây phong lá mềm mại tạo bóng râm dịu dàng.',
  },
  {
    id: 'out_boulder',
    name: 'Khối Đá Rêu Tuyết Sơn',
    category: 'exterior',
    placementType: 'exterior',
    modelUrl: '/boulder_01.glb',
    scale: 1.3,
    price: 35,
    emoji: '🪨',
    description: 'Khối đá tảng rêu phong tự nhiên bên bờ suối.',
  },
  {
    id: 'out_lantern_carriage',
    name: 'Đèn Lồng Lối Đi Sân Cỏ',
    category: 'exterior',
    placementType: 'exterior',
    modelUrl: '/Lantern_01.glb',
    scale: 1.0,
    price: 45,
    emoji: '🏮',
    description: 'Đèn lồng thắp sáng lối đi ven bờ suối hòn đảo.',
  },
  {
    id: 'comp_lumi_fox',
    name: 'Hồ Ly Lumi Đồng Hành',
    category: 'companions',
    placementType: 'both',
    modelUrl: '/Fox.glb',
    scale: 0.0071,
    price: 0,
    emoji: '🦊',
    description: 'Bạn đồng hành tri kỷ hướng dẫn hành trình sức khỏe.',
  },
];

// Predefined room camera viewpoints
const VIEW_PRESETS = {
  island: {
    name: '🏝️ Đảo Ngoại Thất',
    position: new THREE.Vector3(0, 15, 24),
    target: new THREE.Vector3(-1.0, 2.0, 0),
    isInterior: false,
  },
  overview: {
    name: '🛋️ Phòng Khách',
    position: new THREE.Vector3(-0.2, 3.3, 7.8),
    target: new THREE.Vector3(-2.2, 3.0, 1.8),
    isInterior: true,
    room: 'living_room',
  },
  kitchen: {
    name: '🍳 Bếp & Ăn',
    position: new THREE.Vector3(-0.8, 3.4, 0.5),
    target: new THREE.Vector3(-4.2, 3.1, -1.0),
    isInterior: true,
    room: 'kitchen',
  },
  bedroom: {
    name: '🛏️ Phòng Ngủ',
    position: new THREE.Vector3(0.5, 3.4, -4.2),
    target: new THREE.Vector3(0.8, 3.0, -7.2),
    isInterior: true,
    room: 'bedroom',
  },
  bathroom: {
    name: '🛁 Phòng Tắm Spa',
    position: new THREE.Vector3(-3.5, 3.3, -4.5),
    target: new THREE.Vector3(-4.6, 3.1, -7.5),
    isInterior: true,
    room: 'bathroom',
  },
  view34: {
    name: '🏛️ Cắt Mái 3/4',
    position: new THREE.Vector3(8.5, 13.5, 8.5),
    target: new THREE.Vector3(-2.0, 2.8, -2.5),
    isInterior: true,
    room: 'cutaway',
  },
};

// ============================================================================
// MAIN REACT COMPONENT: APP
// ============================================================================
export function ReactIslandChaletApp() {
  const mountRef = useRef(null);
  const engineRef = useRef(null);

  // Application React States
  const [viewMode, setViewMode] = useState('island');
  const [doorsOpen, setDoorsOpen] = useState(true);
  const [lightsOn, setLightsOn] = useState(true);
  const [roofCutaway, setRoofCutaway] = useState(false);
  const [isDecorating, setIsDecorating] = useState(true);

  const [activeCategory, setActiveCategory] = useState('all');
  const [activeDecorItem, setActiveDecorItem] = useState(MERGED_CATALOG[0]);
  const [selectedPlacedInstance, setSelectedPlacedInstance] = useState(null);

  const [placedItems, setPlacedItems] = useState(() => {
    try {
      const saved = localStorage.getItem('hc_island_chalet_placed_items');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to load saved items:', e);
    }
    // Default starter placed items
    return [
      {
        id: 'init_sofa_1',
        itemId: 'sofa_03',
        name: 'Sofa Vải Nỉ',
        modelUrl: '/sofa_03.glb',
        scale: 1.0,
        x: -2.2,
        y: 1.82,
        z: 2.5,
        rotationY: Math.PI,
        location: 'interior',
        room: 'living_room',
      },
      {
        id: 'init_table_1',
        itemId: 'coffee_table_round_01',
        name: 'Bàn Trà Tròn',
        modelUrl: '/coffee_table_round_01.glb',
        scale: 1.0,
        x: -2.2,
        y: 1.82,
        z: 1.2,
        rotationY: 0,
        location: 'interior',
        room: 'living_room',
      },
      {
        id: 'init_patio_set',
        itemId: 'out_outdoor_dining',
        name: 'Bàn Ghế Hiên Nhà',
        modelUrl: '/outdoor_table_chair_set_01.glb',
        scale: 1.0,
        x: -5.8,
        y: 1.82,
        z: 3.5,
        rotationY: Math.PI * 0.5,
        location: 'exterior',
      },
      {
        id: 'init_pine_1',
        itemId: 'out_island_tree',
        name: 'Thông Cổ Thụ',
        modelUrl: '/island_tree_02.glb',
        scale: 1.2,
        x: 4.8,
        y: 1.8,
        z: -3.5,
        rotationY: 0.4,
        location: 'exterior',
      },
      {
        id: 'init_lumi_fox',
        itemId: 'comp_lumi_fox',
        name: 'Hồ Ly Lumi',
        modelUrl: '/Fox.glb',
        scale: 0.0071,
        x: 0.8,
        y: 1.8,
        z: 3.2,
        rotationY: -0.6,
        location: 'exterior',
      },
    ];
  });

  const [coins, setCoins] = useState(500);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [notification, setNotification] = useState('Chào mừng đến Đảo Thần Tiên & Biệt Thự Chalet 3D!');

  // Save placed items on change
  useEffect(() => {
    try {
      localStorage.setItem('hc_island_chalet_placed_items', JSON.stringify(placedItems));
    } catch (e) {
      console.warn('Storage save error:', e);
    }
  }, [placedItems]);

  const showToast = useCallback((msg) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification((curr) => (curr === msg ? '' : curr));
    }, 3200);
  }, []);

  // Filtered Catalog for Decor Tray
  const filteredCatalog = useMemo(() => {
    const isInterior = viewMode !== 'island';
    return MERGED_CATALOG.filter((item) => {
      if (activeCategory === '3dhome') return item.category === '3dhome';
      if (activeCategory === 'exterior') return item.category === 'exterior';
      if (activeCategory === 'plants') return item.category === 'plants';
      if (activeCategory === 'companions') return item.category === 'companions';

      // 'all' category: prefer showing items suited for current location
      if (isInterior) {
        return item.placementType === 'interior' || item.placementType === 'both' || item.category === '3dhome';
      } else {
        return item.placementType === 'exterior' || item.placementType === 'both' || item.category === 'plants';
      }
    });
  }, [activeCategory, viewMode]);

  // ==========================================================================
  // INITIALIZE THREE.JS ENGINE ONCE IN MOUNT REF
  // ==========================================================================
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    let width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight || window.innerHeight;

    // 1. SCENE & CAMERA
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#93c5fd');
    scene.fog = new THREE.FogExp2('#b8d5e8', 0.0035);

    const camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 1000);
    const initialPreset = VIEW_PRESETS[viewMode] || VIEW_PRESETS.island;
    camera.position.copy(initialPreset.position);
    let camTarget = initialPreset.target.clone();
    camera.lookAt(camTarget);

    // 2. RENDERER
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // 3. LIGHTING
    const hemiLight = new THREE.HemisphereLight('#ffffff', '#445566', 1.05);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight('#fff5e6', 2.2);
    sunLight.position.set(16, 28, 20);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 90;
    const d = 22;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    scene.add(sunLight);

    // 4. AUTHENTIC 2.5D PARALLAX PANORAMA CYLINDER
    const texLoader = new THREE.TextureLoader();
    const panoTex = texLoader.load('/assets/bg/swiss_panorama_360_real.webp');
    panoTex.wrapS = THREE.RepeatWrapping;
    panoTex.wrapT = THREE.ClampToEdgeWrapping;
    panoTex.minFilter = THREE.LinearMipmapLinearFilter;
    panoTex.magFilter = THREE.LinearFilter;

    const panoGeo = new THREE.CylinderGeometry(150, 150, 95, 64, 1, true);
    const panoMat = new THREE.MeshBasicMaterial({
      map: panoTex,
      side: THREE.BackSide,
      fog: false,
    });
    const panoMesh = new THREE.Mesh(panoGeo, panoMat);
    panoMesh.position.set(0, 25, 0);
    scene.add(panoMesh);

    // 5. ORGANIC FLOATING ISLAND MESH
    const islandGroup = new THREE.Group();
    scene.add(islandGroup);

    // Island Meadow (Top Plateau)
    const plateauGeo = new THREE.CylinderGeometry(13.8, 14.5, 1.2, 48);
    // Displace vertices slightly for organic feel
    const posAttr = plateauGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const y = posAttr.getY(i);
      if (y > 0) {
        const x = posAttr.getX(i);
        const z = posAttr.getZ(i);
        const dist = Math.sqrt(x * x + z * z);
        const bump = Math.sin(x * 0.45) * Math.cos(z * 0.45) * 0.22;
        posAttr.setY(i, y + bump);
      }
    }
    plateauGeo.computeVertexNormals();

    const grassMat = new THREE.MeshStandardMaterial({
      color: '#4ade80',
      roughness: 0.85,
      metalness: 0.05,
    });
    const plateauMesh = new THREE.Mesh(plateauGeo, grassMat);
    plateauMesh.position.set(0, 1.2, 0);
    plateauMesh.receiveShadow = true;
    islandGroup.add(plateauMesh);

    // Island Rock Underbelly
    const rockGeo = new THREE.ConeGeometry(13.5, 12, 32);
    rockGeo.rotateX(Math.PI);
    const rockMat = new THREE.MeshStandardMaterial({
      color: '#475569',
      roughness: 0.95,
      flatShading: true,
    });
    const rockMesh = new THREE.Mesh(rockGeo, rockMat);
    rockMesh.position.set(0, -4.8, 0);
    rockMesh.receiveShadow = true;
    islandGroup.add(rockMesh);

    // Natural NW Alpine Mountain
    const mtnGeo = new THREE.ConeGeometry(6.5, 8.5, 9);
    const mtnMat = new THREE.MeshStandardMaterial({
      color: '#334155',
      roughness: 0.9,
      flatShading: true,
    });
    const mtnMesh = new THREE.Mesh(mtnGeo, mtnMat);
    mtnMesh.position.set(-8.5, 5.0, -8.2);
    mtnMesh.castShadow = true;
    mtnMesh.receiveShadow = true;
    scene.add(mtnMesh);

    // Mountain Snow Cap
    const snowGeo = new THREE.ConeGeometry(3.0, 3.8, 9);
    const snowMat = new THREE.MeshStandardMaterial({
      color: '#f8fafc',
      roughness: 0.4,
    });
    const snowMesh = new THREE.Mesh(snowGeo, snowMat);
    snowMesh.position.set(-8.5, 7.6, -8.2);
    scene.add(snowMesh);

    // Curving Alpine Stream
    const streamCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-6.5, 1.83, -7.0),
      new THREE.Vector3(-3.5, 1.83, -3.0),
      new THREE.Vector3(0.5, 1.83, 1.2),
      new THREE.Vector3(4.2, 1.82, 4.5),
      new THREE.Vector3(8.5, 1.81, 6.2),
    ]);
    const streamGeo = new THREE.TubeGeometry(streamCurve, 32, 0.48, 8, false);
    const waterMat = new THREE.MeshStandardMaterial({
      color: '#38bdf8',
      roughness: 0.1,
      metalness: 0.1,
      transparent: true,
      opacity: 0.88,
    });
    const streamMesh = new THREE.Mesh(streamGeo, waterMat);
    scene.add(streamMesh);

    // 6. SWISS ALPINE CHALET (ARCHITECTURE & ROOMS)
    const chaletGroup = new THREE.Group();
    chaletGroup.position.set(-2.5, 1.8, 0.8);
    scene.add(chaletGroup);

    // Chalet Materials
    const floorWoodTex = texLoader.load('/assets/tex/brown_planks_07/diff.jpg');
    floorWoodTex.wrapS = floorWoodTex.wrapT = THREE.RepeatWrapping;
    floorWoodTex.repeat.set(4, 4);

    const chaletFloorMat = new THREE.MeshStandardMaterial({
      map: floorWoodTex,
      roughness: 0.65,
      metalness: 0.05,
    });

    const chaletStoneMat = new THREE.MeshStandardMaterial({
      color: '#64748b',
      roughness: 0.88,
      flatShading: true,
    });

    const chaletTimberMat = new THREE.MeshStandardMaterial({
      color: '#78350f',
      roughness: 0.75,
    });

    const glassMat = new THREE.MeshPhysicalMaterial({
      color: '#dbeafe',
      transmission: 0.92,
      opacity: 0.85,
      transparent: true,
      roughness: 0.08,
      ior: 1.5,
    });

    const roofMat = new THREE.MeshStandardMaterial({
      color: '#451a03',
      roughness: 0.85,
    });

    // Chalet Base Foundation (Cobblestone Plinth)
    const foundationGeo = new THREE.BoxGeometry(8.8, 0.4, 11.2);
    const foundationMesh = new THREE.Mesh(foundationGeo, chaletStoneMat);
    foundationMesh.position.set(0, 0.2, -2.5);
    foundationMesh.receiveShadow = true;
    chaletGroup.add(foundationMesh);

    // Chalet Interior Hardwood Floor
    const floorGeo = new THREE.BoxGeometry(8.4, 0.06, 10.8);
    const floorMesh = new THREE.Mesh(floorGeo, chaletFloorMat);
    floorMesh.position.set(0, 0.42, -2.5);
    floorMesh.receiveShadow = true;
    chaletGroup.add(floorMesh);

    // Chalet Main Log Walls
    // Back Wall (-Z)
    const backWallGeo = new THREE.BoxGeometry(8.4, 3.2, 0.24);
    const backWall = new THREE.Mesh(backWallGeo, chaletTimberMat);
    backWall.position.set(0, 2.0, -7.8);
    chaletGroup.add(backWall);

    // Left Wall (-X) with window cutaways
    const leftWallGeo = new THREE.BoxGeometry(0.24, 3.2, 10.8);
    const leftWall = new THREE.Mesh(leftWallGeo, chaletTimberMat);
    leftWall.position.set(-4.1, 2.0, -2.5);
    chaletGroup.add(leftWall);

    // Right Wall (+X)
    const rightWallGeo = new THREE.BoxGeometry(0.24, 3.2, 10.8);
    const rightWall = new THREE.Mesh(rightWallGeo, chaletTimberMat);
    rightWall.position.set(4.1, 2.0, -2.5);
    chaletGroup.add(rightWall);

    // Interior Cross Partition Wall (dividing Living Room from Master Bedroom & Bathroom)
    const partitionGeo = new THREE.BoxGeometry(8.0, 3.0, 0.18);
    const partitionWall = new THREE.Mesh(partitionGeo, chaletTimberMat);
    partitionWall.position.set(0, 1.9, -2.6);
    chaletGroup.add(partitionWall);

    // Bedroom / Bathroom Dividing Spine Wall
    const spineGeo = new THREE.BoxGeometry(0.18, 3.0, 5.0);
    const spineWall = new THREE.Mesh(spineGeo, chaletTimberMat);
    spineWall.position.set(-0.8, 1.9, -5.2);
    chaletGroup.add(spineWall);

    // Fireplace Chimney (Stone)
    const chimneyGeo = new THREE.BoxGeometry(1.6, 6.2, 1.4);
    const chimney = new THREE.Mesh(chimneyGeo, chaletStoneMat);
    chimney.position.set(-3.2, 3.1, 0.8);
    chimney.castShadow = true;
    chimney.receiveShadow = true;
    chaletGroup.add(chimney);

    // Fireplace Hearth & Fire Light
    const fireLight = new THREE.PointLight('#ff7700', 4.5, 7.5);
    fireLight.position.set(-2.8, 1.2, 0.8);
    chaletGroup.add(fireLight);

    // Warm Interior Chandelier Light
    const chandelierLight = new THREE.PointLight('#ffd599', 2.8, 9.5);
    chandelierLight.position.set(0, 3.1, 0.5);
    chaletGroup.add(chandelierLight);

    // Bedroom Soft Light
    const bedroomLight = new THREE.PointLight('#ffe4b5', 2.2, 8.5);
    bedroomLight.position.set(1.5, 3.0, -5.5);
    chaletGroup.add(bedroomLight);

    // SLIDING GLASS DOORS (Veranda Front +Z)
    const doorGroup = new THREE.Group();
    chaletGroup.add(doorGroup);

    const doorGeo = new THREE.BoxGeometry(1.9, 2.7, 0.08);
    const leftDoor = new THREE.Mesh(doorGeo, glassMat);
    leftDoor.position.set(-1.0, 1.75, 2.8);
    doorGroup.add(leftDoor);

    const rightDoor = new THREE.Mesh(doorGeo, glassMat);
    rightDoor.position.set(1.0, 1.75, 2.8);
    doorGroup.add(rightDoor);

    // ROOF CUTAWAY GROUP (Toggled for 3/4 Dollhouse View)
    const roofCutawayGroup = new THREE.Group();
    chaletGroup.add(roofCutawayGroup);

    const roofL = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.25, 12.0), roofMat);
    roofL.position.set(-2.2, 4.4, -2.5);
    roofL.rotation.z = 0.35;
    roofCutawayGroup.add(roofL);

    const roofR = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.25, 12.0), roofMat);
    roofR.position.set(2.2, 4.4, -2.5);
    roofR.rotation.z = -0.35;
    roofCutawayGroup.add(roofR);

    // Front Gable Triangle
    const gableGeo = new THREE.ConeGeometry(4.4, 1.6, 4);
    gableGeo.rotateY(Math.PI * 0.25);
    const gable = new THREE.Mesh(gableGeo, chaletTimberMat);
    gable.position.set(0, 4.2, 2.7);
    gable.scale.set(1, 1, 0.08);
    roofCutawayGroup.add(gable);

    // 7. PLACED OBJECTS CONTAINER
    const placedGroup = new THREE.Group();
    scene.add(placedGroup);

    // Loader & Model Cache
    const gltfLoader = new GLTFLoader();
    const modelCache = new Map();

    const loadGlb = (url) => {
      return new Promise((resolve) => {
        if (modelCache.has(url)) {
          resolve(modelCache.get(url).clone());
          return;
        }
        gltfLoader.load(
          url,
          (gltf) => {
            const model = gltf.scene;
            model.traverse((child) => {
              if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
              }
            });
            modelCache.set(url, model);
            resolve(model.clone());
          },
          undefined,
          (err) => {
            console.warn('Failed to load GLB ' + url + ', using fallback proxy:', err);
            const fallback = new THREE.Group();
            const proxy = new THREE.Mesh(
              new THREE.BoxGeometry(0.8, 0.8, 0.8),
              new THREE.MeshStandardMaterial({ color: '#f59e0b' })
            );
            proxy.position.y = 0.4;
            fallback.add(proxy);
            modelCache.set(url, fallback);
            resolve(fallback.clone());
          }
        );
      });
    };

    // Synchronization function to update placed objects in Three.js
    const syncPlacedMeshes = async (items) => {
      // Clear existing meshes
      while (placedGroup.children.length > 0) {
        placedGroup.remove(placedGroup.children[0]);
      }

      for (const item of items) {
        const mesh = await loadGlb(item.modelUrl);
        mesh.userData = { id: item.id, itemData: item };
        mesh.position.set(item.x, item.y, item.z);
        mesh.rotation.y = item.rotationY || 0;
        const s = item.scale || 1.0;
        mesh.scale.set(s, s, s);
        placedGroup.add(mesh);
      }
    };

    // Initial sync
    syncPlacedMeshes(placedItems);

    // 8. PLACEMENT GHOST & SELECTION CURSOR
    const ghostGroup = new THREE.Group();
    scene.add(ghostGroup);
    ghostGroup.visible = false;

    const ghostRing = new THREE.Mesh(
      new THREE.RingGeometry(0.3, 0.5, 32),
      new THREE.MeshBasicMaterial({ color: '#38bdf8', side: THREE.DoubleSide })
    );
    ghostRing.rotation.x = -Math.PI / 2;
    ghostRing.position.y = 0.02;
    ghostGroup.add(ghostRing);

    // Raycast Plane (Interior Chalet Floor vs. Outdoor Island Meadow)
    const rayPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(80, 80),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    rayPlane.rotation.x = -Math.PI / 2;
    rayPlane.position.y = 1.82;
    scene.add(rayPlane);

    // 9. POINTER / RAYCASTING CONTROLS
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    const onPointerDown = (evt) => {
      isDragging = false;
      prevMouseX = evt.clientX;
      prevMouseY = evt.clientY;
    };

    const onPointerMove = (evt) => {
      const dx = evt.clientX - prevMouseX;
      const dy = evt.clientY - prevMouseY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        isDragging = true;
      }

      // Orbit camera on drag
      if (evt.buttons === 1) {
        const rotSpeed = 0.005;
        // Rotate around target
        const offset = camera.position.clone().sub(camTarget);
        const radius = offset.length();
        let theta = Math.atan2(offset.x, offset.z) - dx * rotSpeed;
        let phi = Math.acos(Math.max(-1, Math.min(1, offset.y / radius))) - dy * rotSpeed;
        phi = Math.max(0.1, Math.min(Math.PI * 0.48, phi));

        offset.x = radius * Math.sin(phi) * Math.sin(theta);
        offset.y = radius * Math.cos(phi);
        offset.z = radius * Math.sin(phi) * Math.cos(theta);

        camera.position.copy(camTarget).add(offset);
        camera.lookAt(camTarget);
      }

      // Update ghost cursor position when decorating
      if (isDecorating && !isDragging) {
        const rect = container.getBoundingClientRect();
        mouse.x = ((evt.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((evt.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);

        const hits = raycaster.intersectObject(rayPlane);
        if (hits.length > 0) {
          ghostGroup.position.copy(hits[0].point);
          ghostGroup.visible = true;
        } else {
          ghostGroup.visible = false;
        }
      }

      prevMouseX = evt.clientX;
      prevMouseY = evt.clientY;
    };

    const onPointerUp = (evt) => {
      if (isDragging) return; // Ignore drag end

      const rect = container.getBoundingClientRect();
      mouse.x = ((evt.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((evt.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);

      // Check click on placed objects
      const placedHits = raycaster.intersectObjects(placedGroup.children, true);
      if (placedHits.length > 0) {
        // Find top group with userData
        let obj = placedHits[0].object;
        while (obj && (!obj.userData || !obj.userData.id) && obj.parent !== placedGroup) {
          obj = obj.parent;
        }
        if (obj && obj.userData && obj.userData.itemData) {
          sfx.playClick();
          setSelectedPlacedInstance(obj.userData.itemData);
          showToast(`Đã chọn: ${obj.userData.itemData.name}`);
          return;
        }
      }

      // Check click on ground/floor to place active item
      if (isDecorating && activeDecorItem) {
        const hits = raycaster.intersectObject(rayPlane);
        if (hits.length > 0) {
          const pt = hits[0].point;
          const isInterior = viewMode !== 'island';

          const newPlaced = {
            id: 'item_' + Date.now(),
            itemId: activeDecorItem.id,
            name: activeDecorItem.name,
            modelUrl: activeDecorItem.modelUrl,
            scale: activeDecorItem.scale || 1.0,
            x: Math.round(pt.x * 10) / 10,
            y: Math.round(pt.y * 10) / 10,
            z: Math.round(pt.z * 10) / 10,
            rotationY: 0,
            location: isInterior ? 'interior' : 'exterior',
            room: isInterior ? VIEW_PRESETS[viewMode]?.room : undefined,
          };

          sfx.playPlace();
          setPlacedItems((prev) => [...prev, newPlaced]);
          setSelectedPlacedInstance(newPlaced);
          showToast(`Đã đặt "${activeDecorItem.name}" vào ${isInterior ? 'trong nhà' : 'hòn đảo'}!`);
        }
      } else {
        setSelectedPlacedInstance(null);
      }
    };

    container.addEventListener('pointerdown', onPointerDown);
    container.addEventListener('pointermove', onPointerMove);
    container.addEventListener('pointerup', onPointerUp);

    // Resize handler
    const onResize = () => {
      width = container.clientWidth || window.innerWidth;
      height = container.clientHeight || window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', onResize);

    // 10. ANIMATION RENDER LOOP
    let animId = null;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const dt = clock.getDelta();
      const time = clock.getElapsedTime();

      // Door animation lerp
      const targetDoorX = doorsOpen ? 2.1 : 1.0;
      rightDoor.position.x += (targetDoorX - rightDoor.position.x) * Math.min(1, dt * 5);
      leftDoor.position.x += (-targetDoorX - leftDoor.position.x) * Math.min(1, dt * 5);

      // Flickering firelight
      if (lightsOn) {
        fireLight.intensity = 4.2 + Math.sin(time * 12.0) * 0.5 + Math.cos(time * 18.0) * 0.3;
        chandelierLight.intensity = 2.8 + Math.sin(time * 2.0) * 0.1;
      } else {
        fireLight.intensity = 0.0;
        chandelierLight.intensity = 0.2;
      }

      // Parallax cylinder gentle drift
      panoMesh.rotation.y = time * 0.003;

      renderer.render(scene, camera);
    };
    animate();

    // Store engine reference
    engineRef.current = {
      scene,
      camera,
      camTarget,
      renderer,
      syncPlacedMeshes,
      roofCutawayGroup,
      setCameraView: (presetKey) => {
        const p = VIEW_PRESETS[presetKey];
        if (!p) return;
        camera.position.copy(p.position);
        camTarget.copy(p.target);
        camera.lookAt(camTarget);
      },
    };

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
      container.removeEventListener('pointerdown', onPointerDown);
      container.removeEventListener('pointermove', onPointerMove);
      container.removeEventListener('pointerup', onPointerUp);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Update Three.js meshes whenever placedItems state changes
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.syncPlacedMeshes(placedItems);
    }
  }, [placedItems]);

  // Update roof cutaway visibility
  useEffect(() => {
    if (engineRef.current && engineRef.current.roofCutawayGroup) {
      engineRef.current.roofCutawayGroup.visible = !roofCutaway;
    }
  }, [roofCutaway]);

  // Handle switching view mode
  const handleSwitchView = useCallback(
    (presetKey) => {
      sfx.playToggle();
      setViewMode(presetKey);
      if (engineRef.current) {
        engineRef.current.setCameraView(presetKey);
      }
      const p = VIEW_PRESETS[presetKey];
      if (presetKey === 'view34') {
        setRoofCutaway(true);
      }
      showToast(`Đã chuyển góc nhìn: ${p.name}`);
    },
    [showToast]
  );

  // Toggle Doors
  const handleToggleDoors = useCallback(() => {
    sfx.playToggle();
    setDoorsOpen((prev) => {
      const next = !prev;
      showToast(`Cửa kính: ${next ? 'Đang Mở' : 'Đã Đóng'}`);
      return next;
    });
  }, [showToast]);

  // Toggle Lights & Fireplace
  const handleToggleLights = useCallback(() => {
    sfx.playToggle();
    setLightsOn((prev) => {
      const next = !prev;
      showToast(`Đèn & Lò sưởi: ${next ? 'Đang Bật' : 'Đã Tắt'}`);
      return next;
    });
  }, [showToast]);

  // Toggle Roof Cutaway
  const handleToggleRoof = useCallback(() => {
    sfx.playToggle();
    setRoofCutaway((prev) => {
      const next = !prev;
      showToast(`Mái biệt thự: ${next ? 'Cắt Lớp 3/4' : 'Nguyên Khối'}`);
      return next;
    });
  }, [showToast]);

  // Elevated Placement Tools (Up, Down, Rotate, Delete)
  const handleElevate = useCallback(
    (deltaY) => {
      if (!selectedPlacedInstance) return;
      sfx.playClick();
      setPlacedItems((prev) =>
        prev.map((item) => {
          if (item.id === selectedPlacedInstance.id) {
            const updated = { ...item, y: Math.round((item.y + deltaY) * 10) / 10 };
            setSelectedPlacedInstance(updated);
            return updated;
          }
          return item;
        })
      );
      showToast(`Điều chỉnh độ cao: ${deltaY > 0 ? '+' : ''}${deltaY}m`);
    },
    [selectedPlacedInstance, showToast]
  );

  const handleRotate = useCallback(() => {
    if (!selectedPlacedInstance) return;
    sfx.playClick();
    setPlacedItems((prev) =>
      prev.map((item) => {
        if (item.id === selectedPlacedInstance.id) {
          const updated = { ...item, rotationY: (item.rotationY || 0) + Math.PI * 0.25 };
          setSelectedPlacedInstance(updated);
          return updated;
        }
        return item;
      })
    );
    showToast('Đã xoay 45°');
  }, [selectedPlacedInstance, showToast]);

  const handleDeletePlaced = useCallback(() => {
    if (!selectedPlacedInstance) return;
    sfx.playDelete();
    const itemName = selectedPlacedInstance.name;
    setPlacedItems((prev) => prev.filter((item) => item.id !== selectedPlacedInstance.id));
    setSelectedPlacedInstance(null);
    showToast(`Đã thu hồi "${itemName}" về kho đồ!`);
  }, [selectedPlacedInstance, showToast]);

  const isInterior = viewMode !== 'island';

  // ==========================================================================
  // RENDER COMPLETE REACT APPLICATION
  // ==========================================================================
  return e(
    'div',
    { style: { width: '100%', height: '100%', position: 'relative', overflow: 'hidden' } },

    // 1. 3D WebGL Canvas Container
    e('div', {
      id: 'canvas-container',
      ref: mountRef,
      style: { width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 },
    }),

    // 2. Notification Toast
    notification &&
      e(
        'div',
        {
          style: {
            position: 'absolute',
            top: '72px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(15, 23, 42, 0.88)',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            color: '#f8fafc',
            padding: '8px 18px',
            borderRadius: '24px',
            fontSize: '13px',
            fontWeight: '600',
            zIndex: 100,
            boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
            pointerEvents: 'none',
          },
        },
        notification
      ),

    // 3. TOP HUD & ROOM SWITCHER BAR
    e(
      'header',
      { className: 'top-hud' },
      // Brand Pill & Mode Info
      e(
        'div',
        { className: 'hud-left' },
        e(
          'button',
          {
            className: 'icon-btn',
            title: 'Quay lại',
            onClick: () => showToast('HealthClues Island v2.2.0'),
          },
          '←'
        ),
        e(
          'div',
          { className: 'island-title-box' },
          e('div', { className: 'island-name' }, 'My Island & Swiss Chalet 3D'),
          e(
            'div',
            { className: 'island-sub' },
            isInterior ? '🏠 Chế Độ Trong Nhà (Nội Thất)' : '🏝️ Chế Độ Ngoại Thất Đảo'
          )
        )
      ),

      // Room Switcher Tabs
      e(
        'nav',
        {
          style: {
            display: 'flex',
            gap: '6px',
            background: 'rgba(11, 31, 24, 0.85)',
            padding: '4px',
            borderRadius: '16px',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            backdropFilter: 'blur(8px)',
            pointerEvents: 'auto',
          },
        },
        Object.entries(VIEW_PRESETS).map(([key, preset]) =>
          e(
            'button',
            {
              key,
              id: `tab-${key}`,
              style: {
                background: viewMode === key ? '#0284c7' : 'transparent',
                color: viewMode === key ? '#ffffff' : '#94a3b8',
                border: 'none',
                borderRadius: '12px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.2s',
              },
              onClick: () => handleSwitchView(key),
            },
            preset.name
          )
        )
      ),

      // Coin Badge
      e(
        'div',
        { className: 'hud-right' },
        e(
          'div',
          { className: 'coin-badge' },
          e('span', { className: 'coin-icon' }, '🪙'),
          e('span', { id: 'player-coins' }, `${coins} Xu`)
        )
      )
    ),

    // 4. CHALET QUICK ACTION DOCK (Top-Right Floating Actions)
    e(
      'div',
      {
        style: {
          position: 'absolute',
          top: '78px',
          right: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          zIndex: 30,
        },
      },
      // Quick Switch Interior / Exterior
      e(
        'button',
        {
          id: 'btn-toggle-interior',
          className: 'action-btn',
          style: {
            background: isInterior ? '#059669' : '#0284c7',
            padding: '8px 14px',
            borderRadius: '14px',
            fontSize: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          },
          onClick: () => handleSwitchView(isInterior ? 'island' : 'overview'),
        },
        isInterior ? '🏝️ Ra Ngoại Thất Đảo' : '🚪 Vào Trong Nhà Chalet'
      ),
      // Sliding Door Toggle
      e(
        'button',
        {
          id: 'btn-toggle-door',
          className: 'action-btn',
          style: {
            background: doorsOpen ? 'rgba(30, 41, 59, 0.9)' : 'rgba(15, 23, 42, 0.9)',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            padding: '8px 14px',
            borderRadius: '14px',
            fontSize: '12px',
          },
          onClick: handleToggleDoors,
        },
        doorsOpen ? '🚪 Cửa Kính: Mở' : '🚪 Cửa Kính: Đóng'
      ),
      // Lights & Fireplace Toggle
      e(
        'button',
        {
          id: 'btn-toggle-lights',
          className: 'action-btn',
          style: {
            background: lightsOn ? '#d97706' : 'rgba(15, 23, 42, 0.9)',
            border: '1px solid rgba(251, 191, 36, 0.5)',
            padding: '8px 14px',
            borderRadius: '14px',
            fontSize: '12px',
          },
          onClick: handleToggleLights,
        },
        lightsOn ? '🔥 Lò Sưởi & Đèn: Bật' : '💡 Đèn: Đã Tắt'
      ),
      // Roof Cutaway Toggle
      e(
        'button',
        {
          id: 'btn-toggle-roof',
          className: 'action-btn',
          style: {
            background: roofCutaway ? '#9333ea' : 'rgba(15, 23, 42, 0.9)',
            border: '1px solid rgba(192, 132, 252, 0.4)',
            padding: '8px 14px',
            borderRadius: '14px',
            fontSize: '12px',
          },
          onClick: handleToggleRoof,
        },
        roofCutaway ? '🏛️ Mái Cắt Lớp 3/4' : '🏛️ Mái Nguyên Khối'
      )
    ),

    // 5. FLOATING SIDE TOOLS (ELEVATION, ROTATION, DELETE)
    e(
      'div',
      {
        id: 'side-placement-tools',
        style: {
          position: 'absolute',
          left: '16px',
          top: '50%',
          transform: 'translateY(-50%)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          zIndex: 30,
          background: 'rgba(11, 31, 24, 0.88)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          padding: '10px',
          borderRadius: '18px',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        },
      },
      e(
        'div',
        { style: { fontSize: '10px', fontWeight: '800', color: '#38bdf8', textAlign: 'center' } },
        'CÔNG CỤ'
      ),
      e(
        'button',
        {
          id: 'btn-elevate-up',
          title: 'Nâng lên cao (+0.1m)',
          className: 'icon-btn',
          style: { width: '42px', height: '42px', fontSize: '18px', background: '#0f3d2f' },
          onClick: () => handleElevate(0.1),
        },
        '⬆️'
      ),
      e(
        'button',
        {
          id: 'btn-elevate-down',
          title: 'Hạ xuống thấp (-0.1m)',
          className: 'icon-btn',
          style: { width: '42px', height: '42px', fontSize: '18px', background: '#0f3d2f' },
          onClick: () => handleElevate(-0.1),
        },
        '⬇️'
      ),
      e(
        'button',
        {
          id: 'btn-rotate-item',
          title: 'Xoay vật phẩm 45°',
          className: 'icon-btn',
          style: { width: '42px', height: '42px', fontSize: '18px', background: '#0f3d2f' },
          onClick: handleRotate,
        },
        '🔄'
      ),
      e(
        'button',
        {
          id: 'btn-delete-item',
          title: 'Xóa khỏi nhà / đảo',
          className: 'icon-btn',
          style: {
            width: '42px',
            height: '42px',
            fontSize: '18px',
            background: selectedPlacedInstance ? '#dc2626' : '#451a1a',
            borderColor: '#ef4444',
          },
          onClick: handleDeletePlaced,
        },
        '🗑️'
      )
    ),

    // 6. BOTTOM DECOR SELECTOR TRAY
    isDecorating &&
      e(
        'div',
        {
          id: 'decor-tray',
          className: 'decor-tray',
          style: {
            position: 'absolute',
            bottom: '92px',
            left: '14px',
            right: '14px',
            background: 'rgba(11, 31, 24, 0.92)',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            borderRadius: '20px',
            padding: '10px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            zIndex: 25,
            backdropFilter: 'blur(10px)',
            pointerEvents: 'auto',
          },
        },
        // Tray Header with Category Filters
        e(
          'div',
          {
            style: {
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            },
          },
          e(
            'div',
            { style: { display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' } },
            [
              { id: 'all', label: 'Tất Cả' },
              { id: '3dhome', label: '🛋️ Nội Thất 3DHome' },
              { id: 'exterior', label: '🏡 Ngoại Thất' },
              { id: 'plants', label: '🪴 Cây Cối' },
              { id: 'companions', label: '🦊 Đồng Hành' },
            ].map((cat) =>
              e(
                'button',
                {
                  key: cat.id,
                  style: {
                    background: activeCategory === cat.id ? '#059669' : 'rgba(255,255,255,0.08)',
                    color: activeCategory === cat.id ? '#fff' : '#94a3b8',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '4px 10px',
                    fontSize: '11px',
                    fontWeight: '700',
                    cursor: 'pointer',
                  },
                  onClick: () => setActiveCategory(cat.id),
                },
                cat.label
              )
            )
          ),
          e(
            'div',
            { style: { fontSize: '11px', color: '#38bdf8', fontWeight: '700' } },
            `Chọn để đặt (${filteredCatalog.length})`
          )
        ),

        // Scrollable Items Row
        e(
          'div',
          {
            style: {
              display: 'flex',
              gap: '10px',
              overflowX: 'auto',
              padding: '4px 2px',
            },
          },
          filteredCatalog.map((item) => {
            const isSelected = activeDecorItem && activeDecorItem.id === item.id;
            return e(
              'div',
              {
                key: item.id,
                className: `decor-chip ${isSelected ? 'selected' : ''}`,
                id: `decor-item-${item.id}`,
                style: {
                  minWidth: '82px',
                  background: isSelected ? '#1e4a3d' : '#0f2d24',
                  border: isSelected ? '2px solid #38bdf8' : '1px solid #1e4a3d',
                  borderRadius: '14px',
                  padding: '8px 6px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.15s',
                },
                onClick: () => {
                  sfx.playClick();
                  setActiveDecorItem(item);
                  showToast(`Đã chọn: ${item.name} — Nhấp sàn để đặt`);
                },
              },
              // Selection Checkmark
              isSelected &&
                e(
                  'div',
                  {
                    style: {
                      position: 'absolute',
                      top: '4px',
                      right: '4px',
                      background: '#38bdf8',
                      color: '#0f172a',
                      borderRadius: '50%',
                      width: '16px',
                      height: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '10px',
                      fontWeight: 'bold',
                    },
                  },
                  '✓'
                ),
              // Emoji Thumbnail Icon
              e(
                'div',
                {
                  style: {
                    fontSize: '26px',
                    width: '44px',
                    height: '44px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#0b1f18',
                    borderRadius: '10px',
                    marginBottom: '4px',
                  },
                },
                item.emoji
              ),
              // Name & Price
              e(
                'div',
                {
                  style: {
                    fontSize: '10px',
                    fontWeight: '700',
                    color: '#f1f5f9',
                    textAlign: 'center',
                    lineHeight: '1.2',
                    maxWidth: '72px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  },
                },
                item.name
              ),
              e(
                'div',
                { style: { fontSize: '9px', fontWeight: '800', color: '#fbbf24', marginTop: '2px' } },
                item.price ? `${item.price} Xu` : 'Miễn Phí'
              )
            );
          })
        )
      ),

    // 7. BOTTOM NAVIGATION BAR
    e(
      'footer',
      { className: 'bottom-dock' },
      e(
        'button',
        {
          id: 'btn-open-shop',
          className: 'dock-btn',
          onClick: () => setIsShopOpen(true),
        },
        e('div', { className: 'dock-icon' }, '🛍️'),
        e('div', { className: 'dock-label' }, 'Cửa Hàng')
      ),
      e(
        'button',
        {
          id: 'btn-open-inventory',
          className: 'dock-btn',
          onClick: () => setIsInventoryOpen(true),
        },
        e('div', { className: 'dock-icon' }, '🎒'),
        e('div', { className: 'dock-label' }, `Kho Đồ (${placedItems.length})`)
      ),
      e(
        'button',
        {
          id: 'btn-toggle-decor-mode',
          className: 'dock-btn',
          onClick: () => {
            sfx.playToggle();
            setIsDecorating((prev) => !prev);
          },
        },
        e('div', { className: 'dock-icon', style: isDecorating ? { background: '#059669' } : {} }, '🛠️'),
        e('div', { className: 'dock-label' }, isDecorating ? 'Đang Đặt' : 'Trang Trí')
      )
    ),

    // 8. SHOP MODAL
    isShopOpen &&
      e(
        'div',
        { className: 'modal-overlay', onClick: () => setIsShopOpen(false) },
        e(
          'div',
          { className: 'modal-sheet', onClick: (ev) => ev.stopPropagation() },
          e(
            'div',
            { className: 'modal-header' },
            e('div', { className: 'modal-title' }, '🛍️ Cửa Hàng Nội Thất 3DHome & Đảo'),
            e(
              'button',
              { className: 'close-btn', onClick: () => setIsShopOpen(false) },
              '✕'
            )
          ),
          e(
            'div',
            { className: 'modal-body', style: { overflowY: 'auto', maxHeight: '60vh' } },
            e(
              'div',
              { className: 'item-grid' },
              MERGED_CATALOG.map((item) =>
                e(
                  'div',
                  { key: item.id, className: 'item-card' },
                  e('div', { className: 'item-thumb-box' }, item.emoji),
                  e(
                    'div',
                    { className: 'item-info' },
                    e('div', { className: 'item-name' }, item.name),
                    e(
                      'div',
                      { className: 'item-price' },
                      item.price ? `${item.price} Xu` : 'Sở Hữu'
                    )
                  ),
                  e(
                    'button',
                    {
                      className: 'action-btn',
                      onClick: () => {
                        sfx.playClick();
                        setActiveDecorItem(item);
                        setIsShopOpen(false);
                        setIsDecorating(true);
                        showToast(`Đã chọn sắm "${item.name}"! Nhấp sàn để đặt.`);
                      },
                    },
                    'Chọn Đặt'
                  )
                )
              )
            )
          )
        )
      ),

    // 9. INVENTORY MODAL
    isInventoryOpen &&
      e(
        'div',
        { className: 'modal-overlay', onClick: () => setIsInventoryOpen(false) },
        e(
          'div',
          { className: 'modal-sheet', onClick: (ev) => ev.stopPropagation() },
          e(
            'div',
            { className: 'modal-header' },
            e(
              'div',
              { className: 'modal-title' },
              `🎒 Kho Đồ Đã Đặt (${placedItems.length} vật phẩm)`
            ),
            e(
              'button',
              { className: 'close-btn', onClick: () => setIsInventoryOpen(false) },
              '✕'
            )
          ),
          e(
            'div',
            { className: 'modal-body', style: { overflowY: 'auto', maxHeight: '60vh' } },
            e(
              'div',
              { className: 'item-grid' },
              placedItems.map((pItem) =>
                e(
                  'div',
                  { key: pItem.id, className: 'item-card' },
                  e('div', { className: 'item-thumb-box' }, '📦'),
                  e(
                    'div',
                    { className: 'item-info' },
                    e('div', { className: 'item-name' }, pItem.name),
                    e(
                      'div',
                      { style: { fontSize: '10px', color: '#94a3b8' } },
                      pItem.location === 'interior' ? '🏠 Trong Nhà' : '🏝️ Ngoại Thất'
                    )
                  ),
                  e(
                    'button',
                    {
                      className: 'action-btn',
                      style: { background: '#ef4444' },
                      onClick: () => {
                        sfx.playDelete();
                        setPlacedItems((prev) => prev.filter((it) => it.id !== pItem.id));
                        showToast(`Đã thu hồi "${pItem.name}" về kho!`);
                      },
                    },
                    'Thu Hồi'
                  )
                )
              )
            )
          )
        )
      )
  );
}

// ============================================================================
// MOUNT TO REACT ROOT
// ============================================================================
const rootElement = document.getElementById('root');
if (rootElement) {
  const root = window.ReactDOM.createRoot(rootElement);
  root.render(e(ReactIslandChaletApp));
}
