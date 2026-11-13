import fs from 'fs';

function check(f) {
  const content = fs.readFileSync(f, 'utf8');
  content.split('\n').forEach((l, idx) => {
    if (l.includes('Chúc Mừng') || l.includes('Alps') || l.includes('Mở Hộp') || l.includes('Sang Trọng')) {
      console.log(`${f}:${idx+1}: ${l.trim()}`);
    }
  });
}

check('d:/botly/src/components/healthclues/HealthCluesWellnessHome.tsx');
check('d:/botly/src/features/healthclues/HealthCluesRpgWorldHud.tsx');
