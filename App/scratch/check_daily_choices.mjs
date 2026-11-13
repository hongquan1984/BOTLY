import fs from 'fs';

const c = fs.readFileSync('d:/botly/src/components/healthclues/HealthCluesWellnessHome.tsx', 'utf8');
const idx = c.indexOf('dailyRewardChoices');
console.log(c.substring(idx - 100, idx + 1200));
