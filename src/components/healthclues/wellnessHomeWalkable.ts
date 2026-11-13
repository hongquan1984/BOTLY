/**
 * HealthClues Swiss Chalet — Walkable NavMesh & Collision Mask Engine
 * Enables visual floor painting in Admin (/admin/healthclues-home) and
 * obstacle-avoiding autonomous character wandering in Game.
 */

export const MASK_CANVAS_WIDTH = 640;
export const MASK_CANVAS_HEIGHT = 360;

/**
 * Default floor polygons for Swiss Chalet rooms (in 0-100% coordinates)
 */
export const ROOM_FLOOR_PRESETS: Record<string, [number, number][]> = {
  scene_interior_wide: [
    [15, 63],
    [85, 63],
    [90, 94],
    [10, 94],
  ],
  scene_bedroom: [
    [14, 60],
    [86, 60],
    [88, 93],
    [12, 93],
  ],
};

/**
 * Draws the default floor preset polygon onto a 2D canvas context with green fill.
 */
export function drawDefaultFloorPreset(
  ctx: CanvasRenderingContext2D,
  width: number = MASK_CANVAS_WIDTH,
  height: number = MASK_CANVAS_HEIGHT,
  roomId: string = "scene_interior_wide"
): void {
  ctx.save();
  ctx.clearRect(0, 0, width, height);

  const poly = ROOM_FLOOR_PRESETS[roomId] || ROOM_FLOOR_PRESETS.scene_interior_wide;
  if (!poly || poly.length < 3) {
    ctx.restore();
    return;
  }

  ctx.beginPath();
  const startX = (poly[0][0] / 100) * width;
  const startY = (poly[0][1] / 100) * height;
  ctx.moveTo(startX, startY);

  for (let i = 1; i < poly.length; i++) {
    const px = (poly[i][0] / 100) * width;
    const py = (poly[i][1] / 100) * height;
    ctx.lineTo(px, py);
  }
  ctx.closePath();

  // Vibrant Emerald Green with soft translucent fill
  ctx.fillStyle = "rgba(16, 185, 129, 0.50)";
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = "rgba(16, 185, 129, 0.85)";
  ctx.stroke();

  ctx.restore();
}

/**
 * Checks whether a given percentage coordinate (0-100%) is in the walkable painted zone.
 */
export function isPointWalkable(
  ctx: CanvasRenderingContext2D,
  pctX: number,
  pctY: number,
  width: number = MASK_CANVAS_WIDTH,
  height: number = MASK_CANVAS_HEIGHT
): boolean {
  if (pctX < 0 || pctX > 100 || pctY < 0 || pctY > 100) return false;

  const px = Math.floor((pctX / 100) * width);
  const py = Math.floor((pctY / 100) * height);

  if (px < 0 || px >= width || py < 0 || py >= height) return false;

  try {
    const pixel = ctx.getImageData(px, py, 1, 1).data;
    // Walkable if alpha is above threshold (> 40)
    return pixel[3] > 40;
  } catch {
    return true; // fallback on security context or canvas error
  }
}

/**
 * Picks a random walkable coordinate using rejection sampling against the painted mask.
 */
export function pickRandomWalkableTarget(
  ctx: CanvasRenderingContext2D | null,
  roomId: string,
  width: number = MASK_CANVAS_WIDTH,
  height: number = MASK_CANVAS_HEIGHT,
  maxAttempts: number = 35
): { x: number; y: number } {
  const isLiving = roomId === "scene_interior_wide";
  const xMin = isLiving ? 18 : 16;
  const xMax = isLiving ? 82 : 84;
  const yMin = isLiving ? 64 : 62;
  const yMax = isLiving ? 90 : 88;

  if (!ctx) {
    // Basic rectangular fallback if canvas is not ready
    return {
      x: xMin + Math.random() * (xMax - xMin),
      y: yMin + Math.random() * (yMax - yMin),
    };
  }

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const candidateX = Number((xMin + Math.random() * (xMax - xMin)).toFixed(1));
    const candidateY = Number((yMin + Math.random() * (yMax - yMin)).toFixed(1));

    if (isPointWalkable(ctx, candidateX, candidateY, width, height)) {
      return { x: candidateX, y: candidateY };
    }
  }

  // Fallback to center-bottom of room
  return {
    x: (xMin + xMax) / 2,
    y: (yMin + yMax) / 2,
  };
}
