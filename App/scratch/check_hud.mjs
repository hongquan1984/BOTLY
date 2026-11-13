import fs from 'fs';

const content = fs.readFileSync('d:/botly/src/features/healthclues/HealthCluesRpgWorldHud.tsx', 'utf8');
const lines = content.split('\n');
lines.forEach((l, idx) => {
  if (l.includes('home') || l.includes('Nhà') || l.includes('Chalet') || l.includes('panel')) {
    console.log(`${idx + 1}: ${l.trim()}`);
  }
});
