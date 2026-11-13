import fs from 'fs';

const c = fs.readFileSync('d:/botly/src/components/healthclues/HealthCluesWellnessHome.tsx', 'utf8');
const lines = c.split('\n');
lines.forEach((l, idx) => {
  if (l.includes('setDailyRewardChoices') || l.includes('BEDROOM_PRIORITY') || l.includes('LIVING_PRIORITY')) {
    console.log(`${idx+1}: ${l}`);
  }
});
