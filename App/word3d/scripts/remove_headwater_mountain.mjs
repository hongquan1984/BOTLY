import fs from 'fs';

const filePath = 'D:/botly/App/word3d/src/systems/cozyVillageBuilder.ts';
const content = fs.readFileSync(filePath, 'utf-8');
const lines = content.split(/\r?\n/);

console.log('Total lines before:', lines.length);

const startIdx = lines.findIndex((l) => l.includes('// B. HEADWATER MOUNTAIN PEAK & SOURCE CASCADE'));
const endIdx = lines.findIndex((l) => l.includes("registerEditable(mountainGroup, 'mountain'"));

console.log('Found startIdx:', startIdx, 'endIdx:', endIdx);

if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
  // Replace from startIdx - 1 (the comment line) to endIdx
  const removeStart = startIdx - 1;
  const removeEnd = endIdx; // inclusive
  lines.splice(removeStart, removeEnd - removeStart + 1, '  // B. Headwater mountain is placed and customized by user');
  fs.writeFileSync(filePath, lines.join('\r\n'), 'utf-8');
  console.log('Successfully removed HeadwaterMountain! New line count:', lines.length);
} else {
  console.error('Could not locate mountain block');
}
