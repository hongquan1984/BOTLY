const fs = require('fs');
const path = require('path');
const https = require('https');

const targetDir = 'D:/botly/App/3DHOME/glb_public/assets/models/village';
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const files = [
  // Core Chalets / Buildings
  { url: 'https://raw.githubusercontent.com/apresmoi/glyphcss/main/website/public/gallery/glb/urban/Greenhouse.glb', name: 'greenhouse.glb' },
  { url: 'https://raw.githubusercontent.com/apresmoi/glyphcss/main/website/public/gallery/glb/medieval/Fantasy%20Inn.glb', name: 'fantasy_inn.glb' },
  { url: 'https://raw.githubusercontent.com/apresmoi/glyphcss/main/website/public/gallery/glb/medieval/Fantasy%20Barracks.glb', name: 'fantasy_barracks.glb' },
  { url: 'https://raw.githubusercontent.com/apresmoi/glyphcss/main/website/public/gallery/glb/medieval/Fantasy%20House.glb', name: 'fantasy_house_1.glb' },
  { url: 'https://raw.githubusercontent.com/apresmoi/glyphcss/main/website/public/gallery/glb/medieval/Fantasy%20House-BH2XHWUNmF.glb', name: 'fantasy_house_2.glb' },
  { url: 'https://raw.githubusercontent.com/apresmoi/glyphcss/main/website/public/gallery/glb/medieval/Fantasy%20House-dcPho4SUA3.glb', name: 'fantasy_house_3.glb' },
  { url: 'https://raw.githubusercontent.com/apresmoi/glyphcss/main/website/public/gallery/glb/medieval/Blacksmith.glb', name: 'blacksmith.glb' },
  { url: 'https://raw.githubusercontent.com/apresmoi/glyphcss/main/website/public/gallery/glb/medieval/Mill.glb', name: 'mill.glb' },
  { url: 'https://raw.githubusercontent.com/apresmoi/glyphcss/main/website/public/gallery/glb/medieval/Bell%20Tower.glb', name: 'bell_tower.glb' },
  { url: 'https://raw.githubusercontent.com/apresmoi/glyphcss/main/website/public/gallery/glb/poly-pizza/two-story-house.glb', name: 'two_story_house.glb' },
  
  // Props & Accessories
  { url: 'https://raw.githubusercontent.com/apresmoi/glyphcss/main/website/public/gallery/glb/medieval/Well.glb', name: 'well.glb' },
  { url: 'https://raw.githubusercontent.com/apresmoi/glyphcss/main/website/public/gallery/glb/medieval/Gazebo.glb', name: 'gazebo.glb' },
  { url: 'https://raw.githubusercontent.com/apresmoi/glyphcss/main/website/public/gallery/glb/medieval/Market%20Stand.glb', name: 'market_stand.glb' },
  { url: 'https://raw.githubusercontent.com/apresmoi/glyphcss/main/website/public/gallery/glb/medieval/Cart.glb', name: 'cart.glb' },
  { url: 'https://raw.githubusercontent.com/apresmoi/glyphcss/main/website/public/gallery/glb/medieval/Barrel.glb', name: 'barrel.glb' },
  { url: 'https://raw.githubusercontent.com/apresmoi/glyphcss/main/website/public/gallery/glb/medieval/Crate.glb', name: 'crate.glb' },
  { url: 'https://raw.githubusercontent.com/apresmoi/glyphcss/main/website/public/gallery/glb/medieval/Bench.glb', name: 'bench.glb' },
  { url: 'https://raw.githubusercontent.com/apresmoi/glyphcss/main/website/public/gallery/glb/medieval/Fence.glb', name: 'fence.glb' },
  { url: 'https://raw.githubusercontent.com/apresmoi/glyphcss/main/website/public/gallery/glb/medieval/Bonfire.glb', name: 'bonfire.glb' }
];

async function downloadFile(item) {
  const dest = path.join(targetDir, item.name);
  if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) {
    console.log('Already exists:', item.name);
    return;
  }
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(item.url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
      if (res.statusCode !== 200) {
        file.close();
        if (fs.existsSync(dest)) fs.unlinkSync(dest);
        reject(new Error('Failed to download ' + item.name + ': HTTP ' + res.statusCode));
        return;
      }
      res.pipe(file);
      file.on('finish', () => {
        file.close(() => {
          console.log('Downloaded:', item.name, fs.statSync(dest).size, 'bytes');
          resolve();
        });
      });
    }).on('error', err => {
      file.close();
      if (fs.existsSync(dest)) fs.unlinkSync(dest);
      reject(err);
    });
  });
}

(async () => {
  console.log('Starting downloads into ' + targetDir);
  for (const f of files) {
    try {
      await downloadFile(f);
    } catch(e) {
      console.error(e.message);
    }
  }
  console.log('All downloads completed!');
})();
