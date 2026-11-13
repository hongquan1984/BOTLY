import fs from 'fs';

const c = fs.readFileSync('d:/botly/src/app/admin/healthclues-home/page.tsx', 'utf8');
const lines = c.split('\n');
lines.forEach((l, idx) => {
  if (l.includes('user_scale') || l.includes('Tỷ Lệ') || l.includes('Scale') || l.includes('Phóng to') || l.includes('Thu nhỏ')) {
    console.log(`${idx+1}: ${l}`);
  }
});
