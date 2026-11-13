import fs from 'fs';

function searchRug(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = dir + '/' + e.name;
    if (e.isDirectory() && e.name !== 'node_modules' && e.name !== '.next') {
      searchRug(p);
    } else if (e.isFile() && /\.(tsx|ts|json|mjs|js)$/.test(e.name)) {
      const c = fs.readFileSync(p, 'utf8');
      if (c.includes('bedroom_rug')) {
        console.log(p);
      }
    }
  }
}

searchRug('d:/botly/src');
