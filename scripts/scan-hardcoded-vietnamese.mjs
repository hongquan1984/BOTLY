import fs from "fs";
import path from "path";

const VI_REGEX = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;

function scanDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanDir(fullPath);
    } else if (/\.(tsx|ts|jsx|js)$/.test(entry.name)) {
      const content = fs.readFileSync(fullPath, "utf8");
      const lines = content.split("\n");
      const hits = [];
      lines.forEach((line, idx) => {
        // Look for Vietnamese characters in JSX or string literals that aren't wrapped in locale check
        if (VI_REGEX.test(line)) {
          // If the line has 'locale' or 'viText' or 'text(' or 'i18n', it might be bilingual, but let's check
          if (!line.includes("locale") && !line.includes("viText") && !line.includes("vi-VN") && !line.includes("/vi/") && !line.includes("healthclues-i18n")) {
            hits.push({ line: idx + 1, text: line.trim() });
          }
        }
      });
      if (hits.length > 0) {
        console.log(`\n=== ${fullPath} (${hits.length} lines) ===`);
        hits.slice(0, 15).forEach(h => console.log(`  Line ${h.line}: ${h.text}`));
        if (hits.length > 15) console.log(`  ... and ${hits.length - 15} more lines`);
      }
    }
  }
}

scanDir("d:/botly/src/features/healthclues");
scanDir("d:/botly/src/components/healthclues");
