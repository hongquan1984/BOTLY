import fs from 'fs';

const c = fs.readFileSync('d:/botly/src/components/healthclues/HealthCluesWellnessHome.tsx', 'utf8');
c.split('\n').slice(0, 40).forEach((l, idx) => {
  if (l.includes('import')) {
    console.log(`${idx+1}: ${l}`);
  }
});
