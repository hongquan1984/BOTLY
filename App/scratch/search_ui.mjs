import fs from 'fs';

const files = [
  'd:/botly/src/components/healthclues/HealthCluesWellnessHome.tsx',
  'd:/botly/src/features/healthclues/WorldAdventureScene.tsx',
  'd:/botly/src/features/healthclues/HealthCluesRpgWorldHud.tsx'
];

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (line.includes('Nhà Nghỉ Dưỡng Thụy Sĩ') || line.includes('HEALTHCLUES REALM')) {
      console.log(`${file}:${idx + 1}: ${line.trim()}`);
    }
  });
}
