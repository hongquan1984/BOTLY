import fs from "node:fs";

const p = "d:/botly/src/features/healthclues/WellnessWorldGame.tsx";
let c = fs.readFileSync(p, "utf8");
if (!c.includes('import { HealthCluesAdventurer }')) {
  c = c.replace(
    'import { HealthCluesGameShell }',
    'import { HealthCluesAdventurer } from "@/components/healthclues/HealthCluesAdventurer";\r\nimport { HealthCluesGameShell }'
  );
  fs.writeFileSync(p, c, "utf8");
  console.log("Import added successfully!");
} else {
  console.log("Already has import statement.");
}
