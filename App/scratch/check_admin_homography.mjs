import fs from 'fs';

const c = fs.readFileSync('d:/botly/src/app/admin/healthclues-home/page.tsx', 'utf8');
const lines = c.split('\n');
lines.slice(750, 830).forEach((l, idx) => {
  console.log(`${idx+751}: ${l}`);
});
