import sharp from 'sharp';
import fs from 'fs';

async function makeGrid() {
  const imagePath = 'C:/Users/Admin/.gemini/antigravity/brain/bf806726-5fdf-45f1-b574-a2b65a5fbf0f/.user_uploaded/media_1793858483481_d1785343.jpg';
  const width = 1024;
  const height = 576;
  
  let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;
  
  for (let x = 0; x <= width; x += 50) {
    const isMajor = x % 100 === 0;
    svg += `<line x1="${x}" y1="0" x2="${x}" y2="${height}" stroke="${isMajor ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.35)'}" stroke-width="${isMajor ? 1.5 : 0.8}" />`;
    if (isMajor) {
      svg += `<text x="${x + 2}" y="14" fill="#ffff00" stroke="#000" stroke-width="2" paint-order="stroke" font-size="11" font-weight="bold" font-family="monospace">${x}</text>`;
      svg += `<text x="${x + 2}" y="${height - 4}" fill="#ffff00" stroke="#000" stroke-width="2" paint-order="stroke" font-size="11" font-weight="bold" font-family="monospace">${x}</text>`;
    }
  }
  for (let y = 0; y <= height; y += 50) {
    const isMajor = y % 100 === 0;
    svg += `<line x1="0" y1="${y}" x2="${width}" y2="${y}" stroke="${isMajor ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.35)'}" stroke-width="${isMajor ? 1.5 : 0.8}" />`;
    if (isMajor) {
      svg += `<text x="4" y="${y - 3}" fill="#ffff00" stroke="#000" stroke-width="2" paint-order="stroke" font-size="11" font-weight="bold" font-family="monospace">${y}</text>`;
      svg += `<text x="${width - 34}" y="${y - 3}" fill="#ffff00" stroke="#000" stroke-width="2" paint-order="stroke" font-size="11" font-weight="bold" font-family="monospace">${y}</text>`;
    }
  }
  svg += '</svg>';
  
  const outputDir = 'd:/botly/.tmp';
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  
  await sharp(imagePath)
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .jpeg({ quality: 90 })
    .toFile(outputDir + '/annotated-scene-grid.jpg');
    
  console.log('Saved grid overlay to d:/botly/.tmp/annotated-scene-grid.jpg');
}
makeGrid();
