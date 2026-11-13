import fs from "fs";

const VI_REGEX = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;

const content = fs.readFileSync("d:/botly/src/features/healthclues/WorldAdventureScene.tsx", "utf8");
const lines = content.split("\n");

lines.forEach((line, idx) => {
  const trimmed = line.trim();
  if (trimmed.startsWith("//") || trimmed.startsWith("*")) return;
  if (VI_REGEX.test(line)) {
    // Check if line uses locale === "vi" or similar bilingual ternary
    const isBilingual = line.includes('locale === "vi"') || line.includes("locale === 'vi'") || line.includes('locale !== "vi"') || line.includes("locale === 'en'") || line.includes('locale === "en"');
    if (!isBilingual) {
      console.log(`[Line ${idx + 1}] ${trimmed}`);
    }
  }
});
