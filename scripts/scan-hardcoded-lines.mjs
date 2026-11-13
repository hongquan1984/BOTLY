import fs from "fs";

const VI_REGEX = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;

const files = process.argv.slice(2);
for (const f of files) {
  if (!fs.existsSync(f)) {
    console.log("File not found: " + f);
    continue;
  }
  const content = fs.readFileSync(f, "utf8");
  const lines = content.split("\n");
  const hits = [];
  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("//") || trimmed.startsWith("*")) return;
    if (VI_REGEX.test(line)) {
      const isBilingual = line.includes('locale === "vi"') || line.includes("locale === 'vi'") || line.includes('locale !== "vi"') || line.includes("locale === 'en'") || line.includes('locale === "en"') || line.includes("isVi ?") || line.includes("vi ?");
      if (!isBilingual) {
        hits.push(`[Line ${idx + 1}] ${trimmed}`);
      }
    }
  });
  console.log(`\n=== ${f}: ${hits.length} non-bilingual VI lines ===`);
  hits.forEach(h => console.log(h));
}
