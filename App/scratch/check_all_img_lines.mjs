import fs from 'fs';

const c = fs.readFileSync('d:/botly/src/components/healthclues/HealthCluesWellnessHome.tsx', 'utf8');
const lines = c.split('\n');
lines.forEach((l, idx) => {
  if (l.includes('.png') || l.includes('.webp') || l.includes('.jpg') || l.includes('img') || l.includes('Image')) {
    console.log(`${idx+1}: ${l.trim()}`);
  }
});
