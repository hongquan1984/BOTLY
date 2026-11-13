import fs from 'fs';

const c = fs.readFileSync('d:/botly/src/components/healthclues/HealthCluesWellnessHome.tsx', 'utf8');
const lines = c.split('\n');
lines.forEach((l, idx) => {
  if (l.includes('sofa_luxury')) {
    console.log(`${idx+1}: ${l}`);
  }
});
