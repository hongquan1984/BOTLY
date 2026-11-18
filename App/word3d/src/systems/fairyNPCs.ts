import * as THREE from 'three';

export interface FairyNPCConfig {
  id: string;
  name: string;
  titleVi: string;
  titleEn: string;
  roleVi: string;
  roleEn: string;
  greetingVi: string;
  greetingEn: string;
  position: [number, number, number];
  primaryColor: string;
  secondaryColor: string;
  wingColor: string;
  iconSymbol: string;
  landmarkId: string;
}

export const FAIRY_NPCS: FairyNPCConfig[] = [
  {
    id: 'npc-flora',
    name: 'Flora',
    titleVi: 'Flora 🌿',
    titleEn: 'Flora 🌿',
    roleVi: 'Vườn Thảo Mộc & Dược Liệu',
    roleEn: 'Herbal Garden & Natural Wellness',
    greetingVi: 'Chào mừng bạn đến Vườn Thảo Mộc! Dược tính hoa cỏ tự nhiên nuôi dưỡng cơ thể thanh khiết.',
    greetingEn: 'Welcome to the Herbal Garden! Pure botanical herbs nurture your body naturally.',
    position: [-6.2, 1.82, 3.8],
    primaryColor: '#10b981',   // Emerald green
    secondaryColor: '#f59e0b', // Golden amber
    wingColor: '#6ee7b7',      // Translucent mint
    iconSymbol: '🌿',
    landmarkId: 'potion-shop',
  },
  {
    id: 'npc-aura',
    name: 'Aura',
    titleVi: 'Aura 💧',
    titleEn: 'Aura 💧',
    roleVi: 'Liệu Pháp Suối Nguồn & Thở 4-7-8',
    roleEn: 'Cloud Therapy & 4-7-8 Breathing',
    greetingVi: 'Hãy hít thở sâu cùng tiếng suối róc rách. Thả lỏng mọi căng thẳng tích tụ hôm nay nhé.',
    greetingEn: 'Breathe deeply with the soothing waterfall stream. Release all tension.',
    position: [-6.0, 2.4, -5.2],
    primaryColor: '#0ea5e9',   // Sky blue
    secondaryColor: '#ffffff', // Cloud white
    wingColor: '#bae6fd',      // Crystal cyan
    iconSymbol: '💧',
    landmarkId: 'watermill',
  },
  {
    id: 'npc-lyra',
    name: 'Lyra',
    titleVi: 'Lyra 📖',
    titleEn: 'Lyra 📖',
    roleVi: 'Thư Viện Tri Thức & Hồ Sơ Phá Án',
    roleEn: 'Knowledge Library & Body Detective',
    greetingVi: 'Tri thức là chìa khóa thấu hiểu cơ thể. Bạn đã sẵn sàng mở hồ sơ thám tử y khoa chưa?',
    greetingEn: 'Knowledge is key to understanding your body. Ready to solve a medical case?',
    position: [6.2, 1.82, -3.8],
    primaryColor: '#8b5cf6',   // Royal violet
    secondaryColor: '#fde047', // Starlight gold
    wingColor: '#ddd6fe',      // Lavender shimmer
    iconSymbol: '📖',
    landmarkId: 'arcane-library',
  },
  {
    id: 'npc-mira',
    name: 'Mira',
    titleVi: 'Mira 🧭',
    titleEn: 'Mira 🧭',
    roleVi: 'Hành Trình Sống Khỏe & Điểm Danh',
    roleEn: 'My Journey & Daily Care',
    greetingVi: 'Mỗi thói quen nhỏ đều tích lũy thành sức khỏe dẻo dai. Hãy cùng ghi nhận tiến trình hôm nay!',
    greetingEn: 'Every small daily habit builds long-term wellness. Let us record today progress!',
    position: [-0.8, 2.0, -6.8],
    primaryColor: '#f97316',   // Warm sunset orange
    secondaryColor: '#fef3c7', // Cream
    wingColor: '#fed7aa',      // Peach glow
    iconSymbol: '🧭',
    landmarkId: 'guild-hall',
  },
  {
    id: 'npc-nova',
    name: 'Nova',
    titleVi: 'Nova ✨',
    titleEn: 'Nova ✨',
    roleVi: 'Quảng Trường & Phần Thưởng EXP',
    roleEn: 'Village Square Quests & EXP',
    greetingVi: 'Chào mừng chiến binh sống khỏe! Rất nhiều nhiệm vụ và phần thưởng đang đợi bạn tại quảng trường.',
    greetingEn: 'Welcome health adventurer! Daily quests and rewards await you in the village square.',
    position: [2.8, 1.82, 0.8],
    primaryColor: '#ec4899',   // Rose pink
    secondaryColor: '#fef08a', // Sunlight gold
    wingColor: '#fbcfe8',      // Radiant fairy pink
    iconSymbol: '✨',
    landmarkId: 'central-fountain',
  },
];

function createBillboardCanvasTexture(text: string, subText: string, accentColor: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 384;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Background pill
  ctx.fillStyle = 'rgba(5, 20, 16, 0.88)';
  ctx.beginPath();
  ctx.roundRect(16, 12, 352, 104, 28);
  ctx.fill();

  // Border
  ctx.lineWidth = 4;
  ctx.strokeStyle = accentColor;
  ctx.stroke();

  // Inner subtle glow
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.stroke();

  // Title
  ctx.font = 'bold 36px "Be Vietnam Pro", sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 192, 48);

  // Subtitle / Role
  ctx.font = 'bold 22px "Be Vietnam Pro", sans-serif';
  ctx.fillStyle = accentColor;
  ctx.fillText(subText, 192, 86);

  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  return tex;
}

export class FairyNPCSystem {
  private scene: THREE.Scene;
  private fairyGroups: Map<string, THREE.Group> = new Map();
  private leftWings: THREE.Mesh[] = [];
  private rightWings: THREE.Mesh[] = [];
  private interactiveMeshes: THREE.Mesh[] = [];
  private lumiGroup: THREE.Group | null = null;
  private time: number = 0;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.initNPCs();
    // Replaced by high-fidelity 3D LumiCompanion from sample.ply
  }

  private initNPCs() {
    FAIRY_NPCS.forEach((npc, index) => {
      const npcGroup = new THREE.Group();
      npcGroup.name = `NPC_${npc.id}`;
      npcGroup.position.set(npc.position[0], npc.position[1], npc.position[2]);

      // 1. Fairy Body (Stylized humanoid torso + dress)
      const dressMat = new THREE.MeshStandardMaterial({
        color: npc.primaryColor,
        roughness: 0.4,
        metalness: 0.1,
      });

      // Dress / Body cone
      const bodyGeo = new THREE.ConeGeometry(0.24, 0.65, 8);
      const bodyMesh = new THREE.Mesh(bodyGeo, dressMat);
      bodyMesh.position.y = 0.35;
      bodyMesh.castShadow = true;
      npcGroup.add(bodyMesh);

      // Torso / Chest
      const torsoGeo = new THREE.CylinderGeometry(0.12, 0.15, 0.3, 8);
      const torsoMesh = new THREE.Mesh(torsoGeo, dressMat);
      torsoMesh.position.y = 0.72;
      torsoMesh.castShadow = true;
      npcGroup.add(torsoMesh);

      // Head
      const headMat = new THREE.MeshStandardMaterial({
        color: '#ffedd5', // Fair porcelain skin
        roughness: 0.6,
      });
      const headGeo = new THREE.SphereGeometry(0.16, 12, 12);
      const headMesh = new THREE.Mesh(headGeo, headMat);
      headMesh.position.y = 0.98;
      headMesh.castShadow = true;
      npcGroup.add(headMesh);

      // Hair
      const hairMat = new THREE.MeshStandardMaterial({
        color: npc.secondaryColor,
        roughness: 0.8,
      });
      const hairGeo = new THREE.SphereGeometry(0.18, 10, 10);
      const hairMesh = new THREE.Mesh(hairGeo, hairMat);
      hairMesh.position.set(0, 1.02, -0.04);
      hairMesh.scale.set(1.05, 1.1, 1.1);
      npcGroup.add(hairMesh);

      // 2. Wings (Translucent double wing pair)
      const wingMat = new THREE.MeshStandardMaterial({
        color: npc.wingColor,
        roughness: 0.2,
        metalness: 0.1,
        transparent: true,
        opacity: 0.78,
        side: THREE.DoubleSide,
      });

      const wingShape = new THREE.Shape();
      wingShape.moveTo(0, 0);
      wingShape.quadraticCurveTo(0.28, 0.45, 0.45, 0.42);
      wingShape.quadraticCurveTo(0.52, 0.22, 0.25, 0.05);
      wingShape.closePath();
      const wingGeo = new THREE.ShapeGeometry(wingShape);

      // Left wing
      const wingL = new THREE.Mesh(wingGeo, wingMat);
      wingL.position.set(-0.06, 0.72, -0.1);
      wingL.rotation.set(0.1, -0.2, 0.15);
      npcGroup.add(wingL);
      this.leftWings.push(wingL);

      // Right wing
      const wingR = new THREE.Mesh(wingGeo, wingMat);
      wingR.position.set(0.06, 0.72, -0.1);
      wingR.scale.set(-1, 1, 1);
      wingR.rotation.set(0.1, 0.2, -0.15);
      npcGroup.add(wingR);
      this.rightWings.push(wingR);

      // 3. Ambient Fairy Glow Aura
      const glowGeo = new THREE.SphereGeometry(0.55, 8, 8);
      const glowMat = new THREE.MeshBasicMaterial({
        color: npc.wingColor,
        transparent: true,
        opacity: 0.15,
      });
      const glowMesh = new THREE.Mesh(glowGeo, glowMat);
      glowMesh.position.y = 0.65;
      npcGroup.add(glowMesh);

      // 4. Ground Shadow
      const shadowGeo = new THREE.CircleGeometry(0.35, 12);
      const shadowMat = new THREE.MeshBasicMaterial({
        color: '#000000',
        transparent: true,
        opacity: 0.35,
      });
      const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
      shadowMesh.rotation.x = -Math.PI / 2;
      shadowMesh.position.y = 0.02;
      npcGroup.add(shadowMesh);

      // 5. 3D Billboard Name Tag
      const billboardTex = createBillboardCanvasTexture(
        npc.titleVi,
        npc.roleVi,
        npc.primaryColor
      );
      const billboardMat = new THREE.SpriteMaterial({
        map: billboardTex,
        transparent: true,
        depthWrite: false,
      });
      const sprite = new THREE.Sprite(billboardMat);
      sprite.position.set(0, 1.55, 0);
      sprite.scale.set(1.8, 0.6, 1);
      npcGroup.add(sprite);

      // 6. Interactive Tap Collider (Invisible large cylinder for easy mobile touch)
      const hitGeo = new THREE.CylinderGeometry(0.65, 0.65, 1.8, 8);
      const hitMat = new THREE.MeshBasicMaterial({ visible: false });
      const hitMesh = new THREE.Mesh(hitGeo, hitMat);
      hitMesh.position.y = 0.9;
      hitMesh.userData = {
        isNPC: true,
        npcConfig: npc,
      };
      npcGroup.add(hitMesh);
      this.interactiveMeshes.push(hitMesh);

      this.scene.add(npcGroup);
      this.fairyGroups.set(npc.id, npcGroup);
    });
  }

  private initLumiCompanion() {
    this.lumiGroup = new THREE.Group();
    this.lumiGroup.name = 'LumiCompanion';

    // Cute glowing floating fox/bunny spirit
    const lumiMat = new THREE.MeshStandardMaterial({
      color: '#fef08a',
      emissive: '#eab308',
      emissiveIntensity: 0.45,
      roughness: 0.3,
    });

    const bodyMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 12, 12),
      lumiMat
    );
    this.lumiGroup.add(bodyMesh);

    // Glowing tail
    const tailMesh = new THREE.Mesh(
      new THREE.ConeGeometry(0.1, 0.28, 8),
      lumiMat
    );
    tailMesh.position.set(0, -0.06, -0.16);
    tailMesh.rotation.x = -0.6;
    this.lumiGroup.add(tailMesh);

    // Cute ears
    const earGeo = new THREE.ConeGeometry(0.06, 0.18, 6);
    const earL = new THREE.Mesh(earGeo, lumiMat);
    earL.position.set(-0.08, 0.18, 0);
    earL.rotation.z = 0.25;
    this.lumiGroup.add(earL);

    const earR = new THREE.Mesh(earGeo, lumiMat);
    earR.position.set(0.08, 0.18, 0);
    earR.rotation.z = -0.25;
    this.lumiGroup.add(earR);

    // Soft aura
    const auraMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.32, 8, 8),
      new THREE.MeshBasicMaterial({
        color: '#fef08a',
        transparent: true,
        opacity: 0.25,
      })
    );
    this.lumiGroup.add(auraMesh);

    this.scene.add(this.lumiGroup);
  }

  public getInteractiveMeshes(): THREE.Mesh[] {
    return this.interactiveMeshes;
  }

  public update(delta: number, playerPos: THREE.Vector3) {
    this.time += delta;

    // 1. Animate fairy wings fluttering
    const wingAngle = Math.sin(this.time * 12) * 0.32;
    this.leftWings.forEach((w) => {
      w.rotation.y = -0.2 + wingAngle;
    });
    this.rightWings.forEach((w) => {
      w.rotation.y = 0.2 - wingAngle;
    });

    // 2. Animate gentle hovering bob and face player when close
    FAIRY_NPCS.forEach((npc, index) => {
      const grp = this.fairyGroups.get(npc.id);
      if (!grp) return;

      const bob = Math.sin(this.time * 2.2 + index * 1.3) * 0.06;
      grp.position.y = npc.position[1] + bob;

      // Distance to player
      const dist = grp.position.distanceTo(playerPos);
      if (dist < 4.5) {
        // Smoothly rotate to face player
        const targetAngle = Math.atan2(
          playerPos.x - grp.position.x,
          playerPos.z - grp.position.z
        );
        let diff = targetAngle - grp.rotation.y;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        grp.rotation.y += diff * delta * 3.5;
      }
    });

    // 3. Update Lumi companion orbiting player
    if (this.lumiGroup) {
      const orbitAngle = this.time * 1.2;
      const targetX = playerPos.x + Math.cos(orbitAngle) * 0.95;
      const targetZ = playerPos.z + Math.sin(orbitAngle) * 0.95;
      const targetY = playerPos.y + 1.15 + Math.sin(this.time * 3.0) * 0.12;

      this.lumiGroup.position.lerp(
        new THREE.Vector3(targetX, targetY, targetZ),
        delta * 4.0
      );
      this.lumiGroup.rotation.y = orbitAngle + Math.PI / 2;
    }
  }
}
