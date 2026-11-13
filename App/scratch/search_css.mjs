import fs from 'fs';

function searchCss(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = dir + '/' + e.name;
    if (e.isDirectory() && e.name !== 'node_modules' && e.name !== '.next') {
      searchCss(p);
    } else if (e.isFile() && (p.endsWith('.css') || p.endsWith('.tsx'))) {
      const c = fs.readFileSync(p, 'utf8');
      if (c.includes('hc-home-modal-backdrop') || c.includes('hc-wellness-home-stage')) {
        console.log(p);
      }
    }
  }
}

searchCss('d:/botly/src');
