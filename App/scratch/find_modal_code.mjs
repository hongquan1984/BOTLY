import fs from 'fs';

function findSnippet(file, query) {
  const content = fs.readFileSync(file, 'utf8');
  const idx = content.indexOf(query);
  if (idx !== -1) {
    console.log(`Found in ${file}:`);
    console.log(content.substring(Math.max(0, idx - 100), Math.min(content.length, idx + 1500)));
  }
}

findSnippet('d:/botly/src/components/healthclues/HealthCluesWellnessHome.tsx', 'Chọn 1 Trong 2 Món Nội Thất');
