import fs from 'fs';

const p = 'd:/botly/src/features/healthclues/WellnessWorldGame.tsx';
const content = fs.readFileSync(p, 'utf8');
content.split('\n').forEach((l, idx) => {
  if (l.includes('panel') || l.includes('home') || l.includes('WorldAdventureScene')) {
    console.log(`${idx+1}: ${l.trim()}`);
  }
});
