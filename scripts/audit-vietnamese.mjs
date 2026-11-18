import fs from 'fs';
import path from 'path';

const VI_REGEX = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ]/i;

function walk(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (file === 'node_modules' || file === '.expo' || file === 'dist-web' || file === 'dist' || file === '.git') continue;
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walk(fullPath, fileList);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      if (file === 'vi.ts' || file === 'vi_full.ts') continue;
      fileList.push(fullPath);
    }
  }
  return fileList;
}

const targetDirs = [
  path.join(process.cwd(), 'healthclues-mobile', 'app'),
  path.join(process.cwd(), 'healthclues-mobile', 'src')
];

const files = targetDirs.flatMap(d => walk(d));
const report = {};

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  const matchingLines = [];
  lines.forEach((line, i) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) return;
    if (VI_REGEX.test(trimmed)) {
      if (!trimmed.includes('locale ===') && !trimmed.includes('strings.') && !trimmed.includes('t().') && !trimmed.includes('titleEn') && !trimmed.includes('greetingEn') && !trimmed.includes('nameEn')) {
        matchingLines.push({ lineNum: i + 1, text: trimmed });
      }
    }
  });
  if (matchingLines.length > 0) {
    report[path.relative(process.cwd(), file)] = matchingLines;
  }
}

console.log('Found ' + Object.keys(report).length + ' files with untranslated or unconditioned Vietnamese:');
for (const [file, items] of Object.entries(report)) {
  console.log(`\n=== ${file} (${items.length} lines) ===`);
  items.slice(0, 6).forEach(it => console.log(`  L${it.lineNum}: ${it.text.slice(0, 100)}`));
}
