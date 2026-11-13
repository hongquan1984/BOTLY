import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const testSuites = [
  "test-campaign-engine.mjs",
  "test-deduction-engine.mjs",
  "test-deep-inspection.mjs",
  "test-random-player.mjs",
  "test-reasoning-player.mjs",
  "test-rpc-campaign.mjs",
  "test-browser-e2e.mjs",
];

console.log("=================================================");
console.log("HEALTHCLUES MYSTERY DETECTIVE - FULL TEST SUITE");
console.log("=================================================\n");

let passedCount = 0;

for (const suite of testSuites) {
  const suitePath = path.join(__dirname, suite);
  console.log(`>>> Running: ${suite}...`);
  const start = Date.now();
  const res = spawnSync(process.execPath, [suitePath], {
    stdio: "inherit",
    cwd: __dirname,
    env: process.env,
  });

  const duration = ((Date.now() - start) / 1000).toFixed(2);
  if (res.status === 0) {
    passedCount++;
    console.log(`>>> [PASS] ${suite} (${duration}s)\n`);
  } else {
    console.error(`>>> [FAIL] ${suite} with code ${res.status} (${duration}s)\n`);
    process.exit(res.status || 1);
  }
}

console.log("=================================================");
console.log(`ALL ${passedCount}/${testSuites.length} TEST SUITES PASSED (100%)!`);
console.log("=================================================");
