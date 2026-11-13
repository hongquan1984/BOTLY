import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const base = process.env.HEALTHCLUES_OWNER_DEMO_URL || "http://127.0.0.1:3329";

async function main() {
  console.log("=== STARTING BOTANICAL REVIEW GATE & SAFETY REGRESSION ===");

  const topicsToTest = ["Digestion", "Tiêu hóa", "Gout", "Gút", "Sleep", "Mất ngủ"];

  for (const topic of topicsToTest) {
    console.log(`Testing fail-closed botanical-advisor for topic: '${topic}'...`);
    const res = await fetch(`${base}/api/healthclues/botanical-advisor?topic=${encodeURIComponent(topic)}&focusId=health-concern`, {
      headers: { "Cache-Control": "no-store" },
    });
    assert.equal(res.status, 200, `GET botanical-advisor should return 200 for ${topic}`);
    const data = await res.json();
    assert.equal(data.status, "NO_REVIEWED_CONTENT", `Status must be NO_REVIEWED_CONTENT for ${topic}`);
    assert.equal(data.category, null, `Category must be null for ${topic}`);
    assert.deepEqual(data.herbs, [], `Herbs array must be strictly empty for ${topic}`);
    assert.equal(data.reviewed, false, `Reviewed must be false for ${topic}`);
    assert.equal(data.recommendationEligible, false, `recommendationEligible must be false for ${topic}`);
    console.log(`✓ '${topic}' correctly failed closed with herbs: [] and zero unreviewed dosing.`);
  }

  // Verify WellnessEncyclopediaStation.tsx has no automatic POST to botanical-advisor
  console.log("Checking WellnessEncyclopediaStation.tsx source for privacy boundaries...");
  const srcRoot = fs.existsSync(path.join(process.cwd(), "src")) ? process.cwd() : path.resolve(process.cwd(), "..");
  const stationSource = fs.readFileSync(path.join(srcRoot, "src/features/healthclues/WellnessEncyclopediaStation.tsx"), "utf8");
  assert.ok(!stationSource.includes("/api/healthclues/botanical-advisor"), "WellnessEncyclopediaStation must NOT call botanical-advisor endpoint automatically");
  assert.ok(!stationSource.includes("aiLoading"), "WellnessEncyclopediaStation must not contain aiLoading state");
  console.log("✓ Verified WellnessEncyclopediaStation does not make automatic background POST requests to botanical-advisor.");

  // Catalog endpoint check: reviewed catalog items vs test fixtures
  console.log("Testing /api/healthclues/catalog safety boundaries...");
  const catRes = await fetch(`${base}/api/healthclues/catalog`);
  assert.equal(catRes.status, 200, "Catalog endpoint should respond 200");
  const catData = await catRes.json();
  assert.ok(Array.isArray(catData.items), "Catalog must return items array");

  const demoItems = catData.items.filter(it => it.id.startsWith("hc-demo-"));
  for (const item of demoItems) {
    assert.equal(item.demoOnly, true, `Demo fixture ${item.id} must have demoOnly: true`);
  }
  console.log(`✓ Verified ${demoItems.length} demo fixtures are strictly marked demoOnly: true.`);

  console.log("\n=== ALL BOTANICAL REVIEW GATE CHECKS PASSED (100%) ===");
}

main().catch(err => {
  console.error("FAIL:", err);
  process.exit(1);
});
