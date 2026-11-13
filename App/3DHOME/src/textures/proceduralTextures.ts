import * as THREE from 'three';

function seededRandom(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export interface PBRTextureSet {
  map: THREE.Texture;
  normalMap: THREE.Texture;
  roughnessMap: THREE.Texture;
}

const sharedTexLoader = new THREE.TextureLoader();

/**
 * Loads a CC0 1K PBR texture set (Diffuse, OpenGL Normal, Roughness) downloaded from Poly Haven.
 */
export function loadPolyHavenPBR(
  texId: string,
  repeatX: number,
  repeatY: number
): PBRTextureSet {
  const prep = (file: string, isColor: boolean): THREE.Texture => {
    const tex = sharedTexLoader.load(`/assets/tex/${texId}/${file}`);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeatX, repeatY);
    tex.anisotropy = 8;
    tex.colorSpace = isColor ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    return tex;
  };
  return {
    map: prep('diff.jpg', true),
    normalMap: prep('nor.jpg', false),
    roughnessMap: prep('rough.jpg', false),
  };
}

function finalizeTexture(
  canvas: HTMLCanvasElement,
  repeatX: number,
  repeatY: number,
  isColor: boolean
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.anisotropy = 8;
  tex.colorSpace = isColor ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Converts a grayscale height canvas into a tangent-space RGB normal map via Sobel filtering.
 */
function heightCanvasToNormalCanvas(heightCanvas: HTMLCanvasElement, strength = 2.6): HTMLCanvasElement {
  const w = heightCanvas.width;
  const h = heightCanvas.height;
  const hCtx = heightCanvas.getContext('2d')!;
  const src = hCtx.getImageData(0, 0, w, h).data;

  const outCanvas = document.createElement('canvas');
  outCanvas.width = w;
  outCanvas.height = h;
  const oCtx = outCanvas.getContext('2d')!;
  const dst = oCtx.createImageData(w, h);
  const d = dst.data;

  const sample = (x: number, y: number) => {
    const wx = ((x % w) + w) % w;
    const wy = ((y % h) + h) % h;
    return src[(wy * w + wx) * 4] / 255;
  };

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const tl = sample(x - 1, y - 1);
      const t = sample(x, y - 1);
      const tr = sample(x + 1, y - 1);
      const l = sample(x - 1, y);
      const r = sample(x + 1, y);
      const bl = sample(x - 1, y + 1);
      const b = sample(x, y + 1);
      const br = sample(x + 1, y + 1);

      const dX = (tr + 2 * r + br) - (tl + 2 * l + bl);
      const dY = (bl + 2 * b + br) - (tl + 2 * t + tr);

      let nx = -dX * strength;
      let ny = -dY * strength;
      let nz = 1.0;
      const len = Math.hypot(nx, ny, nz) || 1;
      nx /= len;
      ny /= len;
      nz /= len;

      const idx = (y * w + x) * 4;
      d[idx] = Math.round((nx * 0.5 + 0.5) * 255);
      d[idx + 1] = Math.round((ny * 0.5 + 0.5) * 255);
      d[idx + 2] = Math.round((nz * 0.5 + 0.5) * 255);
      d[idx + 3] = 255;
    }
  }

  oCtx.putImageData(dst, 0, 0);
  return outCanvas;
}

export function createWoodPlankTextures(options: {
  size?: number;
  planks?: number;
  repeatX?: number;
  repeatY?: number;
  baseHex?: [number, number, number];
  grainDarkness?: number;
  glossy?: boolean;
  seed?: number;
}): PBRTextureSet {
  const size = options.size ?? 512;
  const planks = options.planks ?? 8;
  const repeatX = options.repeatX ?? 4;
  const repeatY = options.repeatY ?? 4;
  const base = options.baseHex ?? [186, 128, 72];
  const grainDarkness = options.grainDarkness ?? 28;
  const glossy = options.glossy ?? false;
  const rand = seededRandom(options.seed ?? 101);

  const colorCanvas = document.createElement('canvas');
  const heightCanvas = document.createElement('canvas');
  const roughCanvas = document.createElement('canvas');
  colorCanvas.width = heightCanvas.width = roughCanvas.width = size;
  colorCanvas.height = heightCanvas.height = roughCanvas.height = size;

  const cCtx = colorCanvas.getContext('2d')!;
  const hCtx = heightCanvas.getContext('2d')!;
  const rCtx = roughCanvas.getContext('2d')!;

  const plankH = size / planks;

  for (let p = 0; p < planks; p++) {
    const y0 = p * plankH;
    const toneShift = (rand() - 0.5) * 26;
    const warmShift = (rand() - 0.5) * 16;
    const r = Math.min(255, Math.max(0, base[0] + toneShift + warmShift * 0.4));
    const g = Math.min(255, Math.max(0, base[1] + toneShift * 0.85));
    const b = Math.min(255, Math.max(0, base[2] + toneShift * 0.55 - warmShift * 0.25));

    cCtx.fillStyle = `rgb(${r | 0}, ${g | 0}, ${b | 0})`;
    cCtx.fillRect(0, y0, size, plankH);

    hCtx.fillStyle = 'rgb(180,180,180)';
    hCtx.fillRect(0, y0, size, plankH);

    const baseRough = glossy ? 72 : 162;
    const roughVal = Math.min(242, Math.max(38, baseRough + (rand() - 0.5) * 28)) | 0;
    rCtx.fillStyle = `rgb(${roughVal},${roughVal},${roughVal})`;
    rCtx.fillRect(0, y0, size, plankH);

    // Multi-frequency wood grain & cathedral curves
    const streakCount = 54;
    for (let s = 0; s < streakCount; s++) {
      const sy = y0 + 2 + rand() * (plankH - 4);
      const thickness = 0.7 + rand() * 2.0;
      const waveAmp = 1.0 + rand() * 2.8;
      const waveFreq = 0.012 + rand() * 0.032;
      const phase = rand() * Math.PI * 2;
      const dark = (rand() - 0.35) * grainDarkness;

      cCtx.strokeStyle = `rgba(${dark > 0 ? 52 : 232}, ${dark > 0 ? 30 : 186}, ${dark > 0 ? 12 : 132}, ${Math.abs(dark) / 130})`;
      cCtx.lineWidth = thickness;
      cCtx.beginPath();
      for (let x = 0; x <= size; x += 14) {
        const y = sy + Math.sin(x * waveFreq + phase) * waveAmp;
        if (x === 0) cCtx.moveTo(x, y);
        else cCtx.lineTo(x, y);
      }
      cCtx.stroke();

      hCtx.strokeStyle = dark > 0 ? 'rgba(135,135,135,0.28)' : 'rgba(205,205,205,0.22)';
      hCtx.lineWidth = thickness;
      hCtx.stroke();

      rCtx.strokeStyle = dark > 0 ? 'rgba(180,180,180,0.2)' : 'rgba(95,95,95,0.18)';
      rCtx.lineWidth = thickness;
      rCtx.stroke();
    }

    // Subtle wood knot
    if (rand() < 0.45) {
      const kx = 40 + rand() * (size - 80);
      const ky = y0 + plankH * (0.25 + rand() * 0.5);
      const kr = 4 + rand() * 5.5;
      const grad = cCtx.createRadialGradient(kx, ky, 1, kx, ky, kr * 2);
      grad.addColorStop(0, 'rgba(62, 34, 14, 0.58)');
      grad.addColorStop(0.55, 'rgba(95, 55, 24, 0.24)');
      grad.addColorStop(1, 'rgba(95, 55, 24, 0)');
      cCtx.fillStyle = grad;
      cCtx.beginPath();
      cCtx.ellipse(kx, ky, kr * 2.1, kr * 0.85, 0, 0, Math.PI * 2);
      cCtx.fill();
    }

    // Beveled plank horizontal groove
    cCtx.fillStyle = 'rgba(38, 22, 10, 0.72)';
    cCtx.fillRect(0, y0, size, 2.0);
    hCtx.fillStyle = 'rgb(30,30,30)';
    hCtx.fillRect(0, y0, size, 3.0);
    rCtx.fillStyle = 'rgb(238,238,238)';
    rCtx.fillRect(0, y0, size, 3.0);

    // Staggered vertical plank end joint
    const jointX = ((p * 173 + 95) % (size - 40)) + 20;
    cCtx.fillRect(jointX, y0, 2, plankH);
    hCtx.fillRect(jointX, y0, 2.5, plankH);
  }

  const normalCanvas = heightCanvasToNormalCanvas(heightCanvas, 2.2);
  return {
    map: finalizeTexture(colorCanvas, repeatX, repeatY, true),
    normalMap: finalizeTexture(normalCanvas, repeatX, repeatY, false),
    roughnessMap: finalizeTexture(roughCanvas, repeatX, repeatY, false),
  };
}

export function createFieldstoneTextures(options?: {
  size?: number;
  repeatX?: number;
  repeatY?: number;
  seed?: number;
}): PBRTextureSet {
  const size = options?.size ?? 512;
  const repeatX = options?.repeatX ?? 2;
  const repeatY = options?.repeatY ?? 2;
  const rand = seededRandom(options?.seed ?? 307);

  const colorCanvas = document.createElement('canvas');
  const heightCanvas = document.createElement('canvas');
  const roughCanvas = document.createElement('canvas');
  colorCanvas.width = heightCanvas.width = roughCanvas.width = size;
  colorCanvas.height = heightCanvas.height = roughCanvas.height = size;

  const cCtx = colorCanvas.getContext('2d')!;
  const hCtx = heightCanvas.getContext('2d')!;
  const rCtx = roughCanvas.getContext('2d')!;

  // Recessed warm-grey lime mortar background
  cCtx.fillStyle = '#979083';
  cCtx.fillRect(0, 0, size, size);
  hCtx.fillStyle = 'rgb(42,42,42)';
  hCtx.fillRect(0, 0, size, size);
  rCtx.fillStyle = 'rgb(244,244,244)';
  rCtx.fillRect(0, 0, size, size);

  const rows = 8;
  const rowH = size / rows;

  const stonePalette: [number, number, number][] = [
    [208, 200, 186],
    [184, 176, 162],
    [160, 154, 145],
    [192, 178, 158],
    [144, 141, 136],
    [214, 207, 194],
  ];

  const drawStone = (cx: number, cy: number, rx: number, ry: number, col: [number, number, number]) => {
    const pts: Array<[number, number]> = [];
    const verts = 10;
    for (let i = 0; i < verts; i++) {
      const a = (i / verts) * Math.PI * 2;
      const jitter = 0.84 + rand() * 0.24;
      pts.push([cx + Math.cos(a) * rx * jitter, cy + Math.sin(a) * ry * jitter]);
    }

    const trace = (ctx: CanvasRenderingContext2D, ox = 0, oy = 0) => {
      ctx.beginPath();
      for (let i = 0; i < pts.length; i++) {
        const [px, py] = pts[i];
        if (i === 0) ctx.moveTo(px + ox, py + oy);
        else ctx.lineTo(px + ox, py + oy);
      }
      ctx.closePath();
    };

    // Soft mortar AO shadow
    trace(cCtx, 1.5, 2.2);
    cCtx.fillStyle = 'rgba(48, 44, 38, 0.48)';
    cCtx.fill();

    // Stone face gradient
    const grad = cCtx.createLinearGradient(cx - rx, cy - ry, cx + rx, cy + ry);
    grad.addColorStop(0, `rgb(${Math.min(255, col[0] + 18)}, ${Math.min(255, col[1] + 16)}, ${Math.min(255, col[2] + 14)})`);
    grad.addColorStop(1, `rgb(${Math.max(0, col[0] - 28)}, ${Math.max(0, col[1] - 28)}, ${Math.max(0, col[2] - 28)})`);
    trace(cCtx);
    cCtx.fillStyle = grad;
    cCtx.fill();

    // Mineral flecks & micro pitting
    for (let k = 0; k < 14; k++) {
      const sx = cx + (rand() - 0.5) * rx * 1.15;
      const sy = cy + (rand() - 0.5) * ry * 1.15;
      cCtx.fillStyle = rand() > 0.5 ? 'rgba(255,250,240,0.18)' : 'rgba(58,54,48,0.22)';
      cCtx.fillRect(sx, sy, 2.5, 2.5);
    }

    // Smooth pillowed stone height profile for natural bevel normals
    const hGrad = hCtx.createRadialGradient(cx, cy, 2, cx, cy, Math.max(rx, ry));
    hGrad.addColorStop(0, 'rgb(248,248,248)');
    hGrad.addColorStop(0.68, 'rgb(210,210,210)');
    hGrad.addColorStop(1, 'rgb(96,96,96)');
    trace(hCtx);
    hCtx.fillStyle = hGrad;
    hCtx.fill();

    const rv = (170 + rand() * 50) | 0;
    trace(rCtx);
    rCtx.fillStyle = `rgb(${rv},${rv},${rv})`;
    rCtx.fill();
  };

  for (let row = 0; row < rows; row++) {
    let x = (row % 2) * 32 - 20;
    const y = (row + 0.5) * rowH;
    while (x < size + 30) {
      const w = 44 + rand() * 52;
      const h = rowH * (0.42 + rand() * 0.12);
      const col = stonePalette[Math.floor(rand() * stonePalette.length)];
      drawStone(x + w * 0.5, y + (rand() - 0.5) * 4, w * 0.46, h, col);
      if (x + w > size) {
        drawStone(x + w * 0.5 - size, y, w * 0.46, h, col);
      }
      x += w + 4;
    }
  }

  const normalCanvas = heightCanvasToNormalCanvas(heightCanvas, 3.2);
  return {
    map: finalizeTexture(colorCanvas, repeatX, repeatY, true),
    normalMap: finalizeTexture(normalCanvas, repeatX, repeatY, false),
    roughnessMap: finalizeTexture(roughCanvas, repeatX, repeatY, false),
  };
}

export function createSlateRoofTextures(options?: {
  size?: number;
  repeatX?: number;
  repeatY?: number;
}): PBRTextureSet {
  const size = options?.size ?? 512;
  const repeatX = options?.repeatX ?? 6;
  const repeatY = options?.repeatY ?? 5;
  const rand = seededRandom(519);

  const colorCanvas = document.createElement('canvas');
  const heightCanvas = document.createElement('canvas');
  const roughCanvas = document.createElement('canvas');
  colorCanvas.width = heightCanvas.width = roughCanvas.width = size;
  colorCanvas.height = heightCanvas.height = roughCanvas.height = size;

  const cCtx = colorCanvas.getContext('2d')!;
  const hCtx = heightCanvas.getContext('2d')!;
  const rCtx = roughCanvas.getContext('2d')!;

  cCtx.fillStyle = '#2b313a';
  cCtx.fillRect(0, 0, size, size);
  hCtx.fillStyle = 'rgb(110,110,110)';
  hCtx.fillRect(0, 0, size, size);
  rCtx.fillStyle = 'rgb(155,155,155)';
  rCtx.fillRect(0, 0, size, size);

  const rows = 10;
  const cols = 8;
  const tileH = size / rows;
  const tileW = size / cols;

  for (let r = 0; r < rows; r++) {
    const offset = (r % 2) * (tileW * 0.5);
    const y = r * tileH;
    for (let c = -1; c <= cols; c++) {
      const x = c * tileW + offset;
      const shade = 38 + Math.floor(rand() * 20);
      const blueTint = 7 + Math.floor(rand() * 7);
      cCtx.fillStyle = `rgb(${shade}, ${shade + 4}, ${shade + blueTint})`;
      cCtx.fillRect(x + 1, y + 1, tileW - 2, tileH - 2);

      // Subtle stone cleavage striations
      for (let k = 0; k < 5; k++) {
        cCtx.fillStyle = rand() > 0.5 ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.08)';
        cCtx.fillRect(x + 2, y + 3 + rand() * (tileH - 6), tileW - 4, 1.5);
      }

      // Overlapping shingle step shadow
      cCtx.fillStyle = 'rgba(10, 12, 16, 0.72)';
      cCtx.fillRect(x, y + tileH - 3.5, tileW, 3.5);
      cCtx.fillStyle = 'rgba(10, 12, 16, 0.42)';
      cCtx.fillRect(x, y, 2, tileH);

      const hGrad = hCtx.createLinearGradient(0, y, 0, y + tileH);
      hGrad.addColorStop(0, 'rgb(115,115,115)');
      hGrad.addColorStop(0.88, 'rgb(220,220,220)');
      hGrad.addColorStop(1, 'rgb(36,36,36)');
      hCtx.fillStyle = hGrad;
      hCtx.fillRect(x + 1, y, tileW - 2, tileH);

      const rv = (120 + rand() * 55) | 0;
      rCtx.fillStyle = `rgb(${rv},${rv},${rv})`;
      rCtx.fillRect(x + 1, y + 1, tileW - 2, tileH - 2);
    }
  }

  const normalCanvas = heightCanvasToNormalCanvas(heightCanvas, 2.8);
  return {
    map: finalizeTexture(colorCanvas, repeatX, repeatY, true),
    normalMap: finalizeTexture(normalCanvas, repeatX, repeatY, false),
    roughnessMap: finalizeTexture(roughCanvas, repeatX, repeatY, false),
  };
}

export function createGraniteTextures(): PBRTextureSet {
  const size = 256;
  const rand = seededRandom(881);
  const colorCanvas = document.createElement('canvas');
  const heightCanvas = document.createElement('canvas');
  const roughCanvas = document.createElement('canvas');
  colorCanvas.width = heightCanvas.width = roughCanvas.width = size;
  colorCanvas.height = heightCanvas.height = roughCanvas.height = size;

  const cCtx = colorCanvas.getContext('2d')!;
  const hCtx = heightCanvas.getContext('2d')!;
  const rCtx = roughCanvas.getContext('2d')!;

  cCtx.fillStyle = '#a8ada8';
  cCtx.fillRect(0, 0, size, size);
  hCtx.fillStyle = 'rgb(130,130,130)';
  hCtx.fillRect(0, 0, size, size);
  rCtx.fillStyle = 'rgb(215,215,215)';
  rCtx.fillRect(0, 0, size, size);

  for (let i = 0; i < 3600; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const s = 1 + rand() * 3.8;
    const tone = 95 + rand() * 125;
    cCtx.fillStyle = `rgba(${tone | 0}, ${(tone + 2) | 0}, ${(tone - 4) | 0}, 0.36)`;
    cCtx.fillRect(x, y, s, s);
    const hv = (80 + rand() * 145) | 0;
    hCtx.fillStyle = `rgba(${hv},${hv},${hv},0.35)`;
    hCtx.fillRect(x, y, s, s);
  }

  const normalCanvas = heightCanvasToNormalCanvas(heightCanvas, 2.2);
  return {
    map: finalizeTexture(colorCanvas, 2, 2, true),
    normalMap: finalizeTexture(normalCanvas, 2, 2, false),
    roughnessMap: finalizeTexture(roughCanvas, 2, 2, false),
  };
}

export function createLeafClusterTexture(): THREE.CanvasTexture {
  const size = 512;
  const rand = seededRandom(404);
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, size, size);

  // Subtle dark inner twigs for organic canopy structure
  ctx.strokeStyle = 'rgba(72, 56, 38, 0.72)';
  ctx.lineWidth = 4;
  for (let t = 0; t < 7; t++) {
    const a = (t / 7) * Math.PI * 2 + rand() * 0.4;
    ctx.beginPath();
    ctx.moveTo(size * 0.5, size * 0.5);
    ctx.lineTo(size * 0.5 + Math.cos(a) * size * 0.34, size * 0.5 + Math.sin(a) * size * 0.34);
    ctx.stroke();
  }

  const cx = size * 0.5;
  const cy = size * 0.5;
  for (let i = 0; i < 165; i++) {
    const a = rand() * Math.PI * 2;
    const dist = Math.sqrt(rand()) * (size * 0.41);
    const lx = cx + Math.cos(a) * dist;
    const ly = cy + Math.sin(a) * dist;
    const lw = 24 + rand() * 24;
    const lh = 13 + rand() * 14;
    const rot = rand() * Math.PI * 2;

    const gVal = 128 + Math.floor(rand() * 84);
    const rVal = 72 + Math.floor(rand() * 78);
    const bVal = 18 + Math.floor(rand() * 26);

    ctx.save();
    ctx.translate(lx, ly);
    ctx.rotate(rot);
    ctx.fillStyle = `rgb(${rVal}, ${gVal}, ${bVal})`;
    ctx.beginPath();
    ctx.moveTo(-lw * 0.5, 0);
    ctx.quadraticCurveTo(0, -lh * 0.65, lw * 0.5, 0);
    ctx.quadraticCurveTo(0, lh * 0.65, -lw * 0.5, 0);
    ctx.fill();

    ctx.strokeStyle = 'rgba(218, 245, 130, 0.32)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-lw * 0.42, 0);
    ctx.lineTo(lw * 0.42, 0);
    ctx.stroke();
    ctx.restore();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

export function createBarkTexture(): THREE.CanvasTexture {
  const size = 256;
  const rand = seededRandom(773);
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#5a4536';
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 220; i++) {
    const x = rand() * size;
    const w = 1.5 + rand() * 5.5;
    const shade = 44 + Math.floor(rand() * 58);
    ctx.fillStyle = `rgba(${shade + 14}, ${shade + 4}, ${shade - 6}, 0.58)`;
    ctx.fillRect(x, 0, w, size);
  }
  return finalizeTexture(canvas, 2, 3, true);
}

export function createSoftShadowTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(size / 2, size / 2, 4, size / 2, size / 2, size / 2);
  grad.addColorStop(0, 'rgba(12, 18, 24, 0.55)');
  grad.addColorStop(0.55, 'rgba(12, 18, 24, 0.22)');
  grad.addColorStop(1, 'rgba(12, 18, 24, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

/**
 * Woven wool bouclé rug PBR set (512x512) with subtle woven border & baked furniture contact AO.
 */
export function createWovenRugTextures(): PBRTextureSet {
  const size = 512;
  const rand = seededRandom(409);

  const colorCanvas = document.createElement('canvas');
  const heightCanvas = document.createElement('canvas');
  const roughCanvas = document.createElement('canvas');
  colorCanvas.width = heightCanvas.width = roughCanvas.width = size;
  colorCanvas.height = heightCanvas.height = roughCanvas.height = size;

  const cCtx = colorCanvas.getContext('2d')!;
  const hCtx = heightCanvas.getContext('2d')!;
  const rCtx = roughCanvas.getContext('2d')!;

  // Base warm oatmeal-linen cream wool
  cCtx.fillStyle = '#ddd2be';
  cCtx.fillRect(0, 0, size, size);
  hCtx.fillStyle = 'rgb(128,128,128)';
  hCtx.fillRect(0, 0, size, size);
  rCtx.fillStyle = 'rgb(232,232,232)';
  rCtx.fillRect(0, 0, size, size);

  // Micro basketweave / herringbone yarn stitches
  const cell = 4;
  for (let y = 0; y < size; y += cell) {
    for (let x = 0; x < size; x += cell) {
      const parity = ((x / cell) + (y / cell)) % 2;
      const noise = (rand() - 0.5) * 18;
      const lum = (parity === 0 ? 6 : -6) + noise;
      const r = Math.min(255, Math.max(0, 221 + lum));
      const g = Math.min(255, Math.max(0, 210 + lum * 0.95));
      const b = Math.min(255, Math.max(0, 190 + lum * 0.85));
      cCtx.fillStyle = `rgb(${r | 0},${g | 0},${b | 0})`;
      cCtx.fillRect(x, y, cell, cell);

      const hv = Math.min(255, Math.max(0, 128 + (parity === 0 ? 28 : -28) + noise));
      hCtx.fillStyle = `rgb(${hv | 0},${hv | 0},${hv | 0})`;
      hCtx.fillRect(x, y, cell, cell);

      const rv = Math.min(255, Math.max(195, 232 + noise * 0.8));
      rCtx.fillStyle = `rgb(${rv | 0},${rv | 0},${rv | 0})`;
      rCtx.fillRect(x, y, cell, cell);
    }
  }

  // Subtle woven taupe stitched perimeter border
  cCtx.strokeStyle = 'rgba(138, 120, 96, 0.34)';
  cCtx.lineWidth = 10;
  cCtx.strokeRect(18, 18, size - 36, size - 36);
  cCtx.strokeStyle = 'rgba(116, 98, 76, 0.20)';
  cCtx.lineWidth = 3;
  cCtx.strokeRect(28, 28, size - 56, size - 56);

  // Soft elliptical ambient contact shadows beneath coffee table, sofa & side chairs
  const drawContactAO = (cx: number, cy: number, rx: number, ry: number, alpha: number) => {
    cCtx.save();
    cCtx.translate(cx, cy);
    cCtx.scale(1, ry / rx);
    const g = cCtx.createRadialGradient(0, 0, rx * 0.15, 0, 0, rx);
    g.addColorStop(0, `rgba(42, 34, 26, ${alpha})`);
    g.addColorStop(0.65, `rgba(42, 34, 26, ${alpha * 0.45})`);
    g.addColorStop(1, 'rgba(42, 34, 26, 0)');
    cCtx.fillStyle = g;
    cCtx.beginPath();
    cCtx.arc(0, 0, rx, 0, Math.PI * 2);
    cCtx.fill();
    cCtx.restore();
  };
  // UV top (y near 0) maps toward -Z or +Z depending on box face orientation; cover symmetrical center & seating footprints cleanly
  drawContactAO(size * 0.50, size * 0.48, 92, 58, 0.30); // Coffee table center
  drawContactAO(size * 0.50, size * 0.80, 128, 48, 0.24); // Sofa (+Z side)
  drawContactAO(size * 0.19, size * 0.56, 56, 48, 0.20); // Left armchair
  drawContactAO(size * 0.81, size * 0.56, 56, 48, 0.20); // Right armchair

  const normalCanvas = heightCanvasToNormalCanvas(heightCanvas, 1.85);
  return {
    map: finalizeTexture(colorCanvas, 1, 1, true),
    normalMap: finalizeTexture(normalCanvas, 1, 1, false),
    roughnessMap: finalizeTexture(roughCanvas, 1, 1, false),
  };
}
