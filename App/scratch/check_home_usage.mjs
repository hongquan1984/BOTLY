import fs from 'fs';

const content = fs.readFileSync('d:/botly/src/features/healthclues/WorldAdventureScene.tsx', 'utf8');
content.split('\n').forEach((l, idx) => {
  if (l.includes('"home"') || l.includes("'home'")) {
    console.log(`${idx+1}: ${l.trim()}`);
  }
});
