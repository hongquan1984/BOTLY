import fs from 'fs';

const c = fs.readFileSync('d:/botly/scripts/qa-auditor-suite.mjs', 'utf8');
const lines = c.split('\n');
lines.slice(0, 80).forEach((l, idx) => {
  console.log(`${idx+1}: ${l}`);
});
