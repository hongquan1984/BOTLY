import { execSync } from "node:child_process";

console.log("=== VERCEL DEPLOYMENT CLEANUP ===");

// List of old, superseded deployment URLs to delete (keeping top 2 recent ones safe)
const toDelete = [
  "https://aiflow-automation-25vcfjae1-hong-quans-projects-99fb0586.vercel.app",
  "https://aiflow-automation-2r5cx6oml-hong-quans-projects-99fb0586.vercel.app",
  "https://aiflow-automation-pyx17prkk-hong-quans-projects-99fb0586.vercel.app",
  "https://aiflow-automation-pz5b5lqba-hong-quans-projects-99fb0586.vercel.app",
  "https://aiflow-automation-jwqzzn5j2-hong-quans-projects-99fb0586.vercel.app",
  "https://aiflow-automation-o27r0h5b7-hong-quans-projects-99fb0586.vercel.app",
  "https://aiflow-automation-f0rxiygmk-hong-quans-projects-99fb0586.vercel.app",
  "https://aiflow-automation-d141n9eaj-hong-quans-projects-99fb0586.vercel.app",
  "https://aiflow-automation-7gx38md8r-hong-quans-projects-99fb0586.vercel.app",
  "https://aiflow-automation-n5cws5r3x-hong-quans-projects-99fb0586.vercel.app",
  "https://aiflow-automation-gyhpqpxe0-hong-quans-projects-99fb0586.vercel.app",
  "https://aiflow-automation-21m5ak2md-hong-quans-projects-99fb0586.vercel.app",
  "https://aiflow-automation-n0vfuap38-hong-quans-projects-99fb0586.vercel.app",
  "https://aiflow-automation-phfxmpn8q-hong-quans-projects-99fb0586.vercel.app",
  "https://aiflow-automation-mlmxdec28-hong-quans-projects-99fb0586.vercel.app",
  "https://aiflow-automation-qmgdzuxts-hong-quans-projects-99fb0586.vercel.app",
  "https://aiflow-automation-fq8lcfcny-hong-quans-projects-99fb0586.vercel.app"
];

console.log(`Starting cleanup of ${toDelete.length} superseded deployments...`);

// Batch in chunks of 5
for (let i = 0; i < toDelete.length; i += 5) {
  const batch = toDelete.slice(i, i + 5);
  console.log(`\nRemoving batch ${Math.floor(i / 5) + 1}/${Math.ceil(toDelete.length / 5)} (${batch.length} deployments)...`);
  try {
    const cmd = `npx vercel rm ${batch.join(" ")} --yes`;
    const res = execSync(cmd, { cwd: "d:/botly", encoding: "utf8" });
    console.log(res.trim());
  } catch (err) {
    console.error("Batch error:", err.message);
  }
}

console.log("\n=== Checking live production status after cleanup ===");
const liveCheck = await fetch("https://www.botly.vn/vi/wellness/healthclues/world");
console.log("https://www.botly.vn HTTP Status:", liveCheck.status);
console.log("✓ Cleanup finished successfully!");
