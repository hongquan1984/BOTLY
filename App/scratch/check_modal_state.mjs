import fs from 'fs';

const c = fs.readFileSync('d:/botly/src/components/healthclues/HealthCluesWellnessHome.tsx', 'utf8');
c.split('\n').forEach((l, idx) => {
  if (l.includes('isAnyModalOpen')) {
    console.log(`${idx+1}: ${l.trim()}`);
  }
});
