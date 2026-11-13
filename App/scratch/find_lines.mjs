import fs from 'fs';

['d:/botly/src/components/healthclues/HealthCluesWellnessHome.tsx', 'd:/botly/src/features/healthclues/HealthCluesRpgWorldHud.tsx'].forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  content.split('\n').forEach((l, idx) => {
    if (l.includes('Chúc Mừng Đến Căn Nhà') || l.includes('Mở Hộp Quà Tự Do')) {
      console.log(`${f}:${idx+1}: ${l.trim()}`);
    }
  });
});
