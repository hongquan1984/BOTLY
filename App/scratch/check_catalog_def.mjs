import fs from 'fs';

const c = fs.readFileSync('d:/botly/src/components/healthclues/HealthCluesWellnessHome.tsx', 'utf8');
const lines = c.split('\n');
lines.slice(0, 150).forEach((l, idx) => {
  if (l.includes('id:') || l.includes('const DEFAULT_') || l.includes('catalog')) {
    console.log(`${idx+1}: ${l}`);
  }
});
