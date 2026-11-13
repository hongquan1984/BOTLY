import fs from 'fs';

const c = fs.readFileSync('d:/botly/src/components/healthclues/HealthCluesWellnessHome.tsx', 'utf8');
const idx = c.indexOf('sofa_luxury');
console.log(c.substring(idx, idx + 600));
