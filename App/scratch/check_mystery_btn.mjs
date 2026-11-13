import fs from 'fs';

const c = fs.readFileSync('d:/botly/src/features/healthclues/MysteryGiftModal.tsx', 'utf8');
const lines = c.split('\n');
lines.forEach((l, idx) => {
  if (l.includes('Khám Phá Quà Tặng') || (idx > 250 && idx < 320)) {
    console.log(`${idx+1}: ${l}`);
  }
});
