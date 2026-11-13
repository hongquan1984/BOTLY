import sharp from 'sharp';
import fs from 'fs';

// Refined paths in 1024x576
const anchors1024 = {
  camp: { x: 185, y: 270, approach: { x: 185, y: 415 } },
  activity: { x: 250, y: 390, approach: { x: 280, y: 415 }, npc: { x: 250, y: 415 } },
  library: { x: 250, y: 140, approach: { x: 280, y: 275 } },
  boss: { x: 504, y: 160, approach: { x: 504, y: 265 } },
  garden: { x: 750, y: 160, approach: { x: 735, y: 265 }, npc: { x: 700, y: 265 } },
  sanctuary: { x: 825, y: 295, approach: { x: 815, y: 415 }, npc: { x: 775, y: 415 } },
  rewards: { x: 860, y: 450, approach: { x: 860, y: 485 } },
  centerHub: { x: 490, y: 442, approach: { x: 490, y: 442 } },
};

const paths1024 = [
  // 1. Central Circular Plaza outer ring (12-point ellipse)
  [
    { x: 490, y: 388 },
    { x: 560, y: 395 },
    { x: 620, y: 415 },
    { x: 655, y: 442 },
    { x: 620, y: 470 },
    { x: 560, y: 490 },
    { x: 490, y: 496 },
    { x: 420, y: 490 },
    { x: 360, y: 470 },
    { x: 325, y: 442 },
    { x: 360, y: 415 },
    { x: 420, y: 395 },
    { x: 490, y: 388 },
  ],
  // 2. Spokes through center leaf emblem
  [
    { x: 325, y: 442 },
    { x: 490, y: 442 },
    { x: 655, y: 442 },
  ],
  [
    { x: 490, y: 388 },
    { x: 490, y: 442 },
    { x: 490, y: 496 },
  ],
  // Diagonal spokes
  [
    { x: 360, y: 415 },
    { x: 490, y: 442 },
    { x: 620, y: 470 },
  ],
  [
    { x: 420, y: 395 },
    { x: 490, y: 442 },
    { x: 560, y: 490 },
  ],
  [
    { x: 560, y: 395 },
    { x: 490, y: 442 },
    { x: 420, y: 490 },
  ],
  [
    { x: 620, y: 415 },
    { x: 490, y: 442 },
    { x: 360, y: 470 },
  ],

  // 3. Central plaza to Camp/Clinic (West Road)
  [
    { x: 325, y: 442 },
    { x: 280, y: 420 },
    { x: 230, y: 415 },
    { x: 185, y: 415 },
    { x: 140, y: 415 },
  ],

  // 4. Central plaza NW to Knowledge Library
  [
    { x: 420, y: 395 },
    { x: 385, y: 365 },
    { x: 365, y: 325 },
    { x: 320, y: 290 },
    { x: 280, y: 275 }, // In front of Library stairs
  ],

  // 5. Cross road from Library branch to Fountain
  [
    { x: 365, y: 325 },
    { x: 410, y: 295 },
    { x: 450, y: 265 },
    { x: 480, y: 250 },
    { x: 504, y: 240 },
  ],

  // 6. Central plaza straight North to Fountain
  [
    { x: 490, y: 388 },
    { x: 495, y: 340 },
    { x: 500, y: 300 },
    { x: 504, y: 265 },
  ],

  // 7. Fountain apron circle
  [
    { x: 480, y: 250 },
    { x: 455, y: 245 },
    { x: 475, y: 235 },
    { x: 504, y: 230 },
    { x: 535, y: 235 },
    { x: 555, y: 245 },
    { x: 530, y: 250 },
    { x: 504, y: 265 },
    { x: 480, y: 250 },
  ],

  // 8. Cross road from Fountain to Greenhouse
  [
    { x: 530, y: 250 },
    { x: 560, y: 265 },
    { x: 595, y: 295 },
    { x: 635, y: 335 },
  ],

  // 9. Central plaza NE to Greenhouse
  [
    { x: 560, y: 395 },
    { x: 600, y: 365 },
    { x: 635, y: 335 },
    { x: 680, y: 305 },
    { x: 735, y: 265 }, // In front of Greenhouse stairs
  ],

  // 10. Central plaza East to Wellness Sanctuary (Lotus Pavilion)
  [
    { x: 655, y: 442 },
    { x: 720, y: 420 },
    { x: 765, y: 415 },
    { x: 815, y: 415 }, // In front of Lotus Pavilion steps
  ],

  // 11. Branch to Wooden Pier / Lake Dock
  [
    { x: 765, y: 415 },
    { x: 785, y: 440 },
    { x: 805, y: 470 }, // Shore base of pier
    { x: 840, y: 480 },
    { x: 860, y: 485 }, // On pier
    { x: 885, y: 490 }, // End of pier
  ],

  // 12. South-West road exit
  [
    { x: 360, y: 470 },
    { x: 310, y: 520 },
    { x: 260, y: 560 },
    { x: 240, y: 575 },
  ],
];

async function generateDebugOverlay() {
  const imagePath = 'C:/Users/Admin/.gemini/antigravity/brain/bf806726-5fdf-45f1-b574-a2b65a5fbf0f/.user_uploaded/media_1793858483481_d1785343.jpg';
  
  let svg = `<svg width="1024" height="576" xmlns="http://www.w3.org/2000/svg">`;
  
  // Draw walkable paths corridor
  for (const path of paths1024) {
    const pts = path.map(p => `${p.x},${p.y}`).join(' ');
    svg += `<polyline points="${pts}" fill="none" stroke="rgba(20, 215, 123, 0.45)" stroke-width="24" stroke-linecap="round" stroke-linejoin="round" />`;
    svg += `<polyline points="${pts}" fill="none" stroke="#d9ffe9" stroke-width="2" stroke-dasharray="6,4" />`;
  }
  
  // Draw path node points
  for (const path of paths1024) {
    for (const p of path) {
      svg += `<circle cx="${p.x}" cy="${p.y}" r="2.5" fill="#00ffcc" stroke="#003322" stroke-width="1" />`;
    }
  }
  
  // Draw Anchors & Approaches
  for (const [key, val] of Object.entries(anchors1024)) {
    if (val.approach) {
      svg += `<circle cx="${val.approach.x}" cy="${val.approach.y}" r="5" fill="#ffcc00" stroke="#000" stroke-width="2" />`;
      svg += `<text x="${val.approach.x + 7}" y="${val.approach.y + 4}" fill="#ffffff" stroke="#000" stroke-width="3" paint-order="stroke" font-size="10" font-weight="bold">${key} approach</text>`;
    }
    if (val.npc) {
      svg += `<circle cx="${val.npc.x}" cy="${val.npc.y}" r="7" fill="#ff33cc" stroke="#fff" stroke-width="2" />`;
      svg += `<text x="${val.npc.x - 15}" y="${val.npc.y - 8}" fill="#ff33cc" stroke="#000" stroke-width="3" paint-order="stroke" font-size="10" font-weight="bold">NPC ${key}</text>`;
    }
    svg += `<rect x="${val.x - 36}" y="${val.y - 11}" width="72" height="22" rx="11" fill="rgba(16, 50, 38, 0.92)" stroke="#d4a742" stroke-width="1.5" />`;
    svg += `<text x="${val.x}" y="${val.y + 4}" fill="#ffffff" font-size="9" font-weight="bold" text-anchor="middle">${key}</text>`;
  }
  
  svg += '</svg>';
  
  const outPath = 'd:/botly/.tmp/path-alignment-check-2.jpg';
  await sharp(imagePath)
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .jpeg({ quality: 95 })
    .toFile(outPath);
    
  console.log('Saved debug overlay 2 to', outPath);
}

generateDebugOverlay();
