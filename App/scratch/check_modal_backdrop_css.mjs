import fs from 'fs';

function findModalBackdropCss(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = dir + '/' + e.name;
    if (e.isDirectory() && e.name !== 'node_modules' && e.name !== '.next') {
      findModalBackdropCss(p);
    } else if (e.isFile() && p.endsWith('.css')) {
      const c = fs.readFileSync(p, 'utf8');
      if (c.includes('hc-game-modal-backdrop')) {
        console.log(p);
        c.split('\n').forEach((l, idx) => {
          if (l.includes('hc-game-modal-backdrop') || l.includes('hc-game-modal')) {
            console.log(`${idx+1}: ${l}`);
          }
        });
      }
    }
  }
}

findModalBackdropCss('d:/botly/src');
