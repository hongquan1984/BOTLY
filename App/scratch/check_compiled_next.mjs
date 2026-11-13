import fs from 'fs';
import path from 'path';

function searchIn(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      searchIn(p);
    } else if (e.isFile() && p.includes('.next') && (p.endsWith('.js') || p.endsWith('.html'))) {
      try {
        const c = fs.readFileSync(p, 'utf8');
        if (c.includes('Nhà Nghỉ Dưỡng Thụy Sĩ')) {
          console.log('Found in compiled file:', p);
          // Check if panel !== "home" is in that compiled chunk
          const idx = c.indexOf('Nhà Nghỉ Dưỡng Thụy Sĩ');
          console.log('Snippet around occurrence:');
          console.log(c.substring(Math.max(0, idx - 150), Math.min(c.length, idx + 150)));
        }
      } catch (err) {}
    }
  }
}

searchIn('d:/botly/App/.tmp/healthclues-owner-demo/app-build/.next');
