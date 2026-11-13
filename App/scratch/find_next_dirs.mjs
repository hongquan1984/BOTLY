import fs from 'fs';
import path from 'path';

function findNext(dir, depth = 0) {
  if (depth > 4) return;
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      if (e.isDirectory()) {
        const p = path.join(dir, e.name);
        if (e.name === '.next') {
          console.log('Found .next at:', p);
        } else if (e.name !== 'node_modules') {
          findNext(p, depth + 1);
        }
      }
    }
  } catch (e) {}
}

findNext('d:/botly');
