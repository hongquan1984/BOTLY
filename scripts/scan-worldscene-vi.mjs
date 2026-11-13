import fs from "fs";

const VI_REGEX = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;

const content = fs.readFileSync("d:/botly/src/features/healthclues/WorldAdventureScene.tsx", "utf8");
const lines = content.split("\n");

lines.forEach((line, idx) => {
  if (VI_REGEX.test(line)) {
    // Check if line uses locale === "vi" or similar bilingual ternary
    const isBilingual = line.includes("locale ===") || line.includes("locale !==") || line.includes("locale ?") || line.includes("locale === 'vi'") || line.includes('locale === "vi"');
    console.log(`[Line ${idx + 1}] [${isBilingual ? 'BILINGUAL' : 'HARDCODED'}] ${line.trim()}`);
  }
});
