import fs from 'fs';

const content = fs.readFileSync('d:/botly/src/features/healthclues/WorldAdventureScene.tsx', 'utf8');
const lines = content.split('\n');
lines.forEach((l, idx) => {
  if (l.includes('HealthCluesWellnessHome') || l.includes('panel === "home"') || l.includes('home')) {
    console.log(`${idx + 1}: ${l.trim()}`);
  }
});
