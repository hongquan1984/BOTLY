import path from "node:path";
import { ESLint } from "eslint";

const baseline = new Map([
  ["src/app/admin/night-companion/page.tsx|react-hooks/set-state-in-effect", 1],
  ["src/app/admin/thong-ke/page.tsx|react-hooks/set-state-in-effect", 1],
  ["src/app/admin/thong-ke/page.tsx|react-hooks/preserve-manual-memoization", 5],
  ["src/app/api/ebooks/lead/route.ts|@typescript-eslint/no-explicit-any", 1],
  ["src/app/api/rss/wellness/route.ts|@typescript-eslint/no-explicit-any", 2],
  ["src/app/night-companion/reminder-manage/page.tsx|react-hooks/set-state-in-effect", 1],
  ["src/app/night-companion/verify-email/page.tsx|react-hooks/set-state-in-effect", 1],
  ["src/app/vi/song-khoe/huong-dan/[slug]/page.tsx|@typescript-eslint/no-explicit-any", 1],
  ["src/components/app/SmartAppDownloadLanding.tsx|react-hooks/set-state-in-effect", 1],
  ["src/components/app/SmartAppDownloadLanding.tsx|react-hooks/immutability", 1],
  ["src/components/night-companion/NightAudioPlayer.tsx|react-hooks/set-state-in-effect", 2],
  ["src/components/night-companion/NightAudioPlayer.tsx|@typescript-eslint/no-explicit-any", 1],
  ["src/components/quiz/CompactResultScreen.tsx|react-hooks/set-state-in-effect", 1],
  ["src/components/wellness/HealingSanctuaryHub.tsx|react-hooks/set-state-in-effect", 1],
]);

const eslint = new ESLint();
const results = await eslint.lintFiles(["."]);
const current = new Map();
let warningCount = 0;
for (const result of results) {
  const file = path.relative(process.cwd(), result.filePath).replaceAll("\\", "/");
  for (const message of result.messages) {
    if (message.severity === 1) warningCount++;
    if (message.severity !== 2) continue;
    const key = `${file}|${message.ruleId ?? "fatal"}`;
    current.set(key, (current.get(key) ?? 0) + 1);
  }
}

const regressions = [...current].filter(([key, count]) => count > (baseline.get(key) ?? 0));
if (regressions.length) {
  for (const [key, count] of regressions) {
    process.stderr.write(`ESLint baseline exceeded: ${key} has ${count}, allowed ${baseline.get(key) ?? 0}\n`);
  }
  process.exitCode = 1;
} else {
  const errorCount = [...current.values()].reduce((sum, count) => sum + count, 0);
  process.stdout.write(`ESLint debt baseline passed: ${errorCount} existing errors, ${warningCount} warnings; no file/rule count increased.\n`);
}
