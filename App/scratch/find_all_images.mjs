import fs from 'fs';

function findImages(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = dir + '/' + e.name;
    if (e.isDirectory()) {
      findImages(p);
    } else if (e.isFile() && /\.(png|jpg|jpeg|webp|svg)$/.test(e.name)) {
      if (p.includes('home') || p.includes('sofa') || p.includes('chalet') || p.includes('item')) {
        console.log(p);
      }
    }
  }
}

findImages('d:/botly/public');
