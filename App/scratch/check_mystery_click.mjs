import fs from 'fs';

function findSnippet(file, query) {
  const content = fs.readFileSync(file, 'utf8');
  const idx = content.indexOf(query);
  if (idx !== -1) {
    console.log(`Found in ${file} at ${idx}:`);
    console.log(content.substring(Math.max(0, idx - 100), Math.min(content.length, idx + 800)));
  }
}

findSnippet('d:/botly/src/features/healthclues/HealthCluesRpgWorldHud.tsx', 'Khám Phá Quà Tặng');
findSnippet('d:/botly/src/features/healthclues/MysteryGiftModal.tsx', 'Khám Phá Quà Tặng');
