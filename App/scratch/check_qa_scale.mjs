import fs from 'fs';

const c = fs.readFileSync('d:/botly/scripts/qa-auditor-suite.mjs', 'utf8');
c.split('\n').forEach((l, idx) => {
  if (l.includes('user_scale') || l.includes('scale')) {
    console.log(`${idx+1}: ${l}`);
  }
});
