import fs from 'fs';

const c = fs.readFileSync('d:/botly/src/components/healthclues/wellness-home.css', 'utf8');
c.split('\n').forEach((l, idx) => {
  if (l.includes('modal') || l.includes('z-index') || l.includes('stage-item') || l.includes('matrix3d')) {
    console.log(`${idx+1}: ${l.trim()}`);
  }
});
