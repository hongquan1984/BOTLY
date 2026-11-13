import fs from 'fs';

const c = fs.readFileSync('d:/botly/src/app/admin/healthclues-home/page.tsx', 'utf8');
const lines = c.split('\n');
lines.slice(630, 715).forEach((l, idx) => {
  console.log(`${idx+631}: ${l}`);
});
