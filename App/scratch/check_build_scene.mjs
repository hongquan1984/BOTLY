import fs from 'fs';

const p = 'd:/botly/App/.tmp/healthclues-owner-demo/app-build/src/features/healthclues/WorldAdventureScene.tsx';
if (fs.existsSync(p)) {
  const content = fs.readFileSync(p, 'utf8');
  content.split('\n').forEach((l, idx) => {
    if (idx >= 294 && idx <= 300) {
      console.log(`${idx+1}: ${l}`);
    }
  });
} else {
  console.log('File does not exist in app-build/src');
}
