import fs from 'fs';

function searchIn(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = dir + '/' + e.name;
    if (e.isDirectory() && e.name !== 'node_modules' && e.name !== '.next') {
      searchIn(p);
    } else if (e.isFile() && p.includes('world') && /\.(tsx|ts)$/.test(e.name)) {
      console.log(p);
    }
  }
}

searchIn('d:/botly/src/app');
