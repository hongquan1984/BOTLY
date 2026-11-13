import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), "..");
const mode = process.argv[2] ?? "--staged";
const secretKeyPattern = new RegExp("sb_" + "secret_[A-Za-z0-9_-]{20,}", "g");
const jwtPattern = /eyJ[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}/g;

function hasPrivilegedCredential(content) {
  if (secretKeyPattern.test(content)) return true;
  secretKeyPattern.lastIndex = 0;
  for (const token of content.match(jwtPattern) ?? []) {
    try {
      const claims = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString("utf8"));
      if (claims.role === "service_role") return true;
    } catch {
      // Ignore JWT-shaped non-credentials that do not decode as a JWT payload.
    }
  }
  return false;
}

if (mode === "--self-test") {
  const dummySecret = "sb_" + "secret_" + "A".repeat(24);
  if (!hasPrivilegedCredential(dummySecret) || hasPrivilegedCredential("SUPABASE_SECRET_KEY=process.env.SUPABASE_SECRET_KEY")) {
    throw new Error("Secret scanner self-test failed");
  }
  console.log("Secret scanner self-test passed.");
  process.exit(0);
}

let files = [];
if (mode === "--staged") {
  const listed = spawnSync("git", ["diff", "--cached", "--name-only", "--diff-filter=ACMR", "-z"], { cwd: root, encoding: "buffer" });
  if (listed.status !== 0) throw new Error("Could not enumerate staged files");
  files = listed.stdout.toString("utf8").split("\0").filter(Boolean);
} else if (mode === "--all") {
  const listed = spawnSync("git", ["ls-files", "-co", "--exclude-standard", "-z"], { cwd: root, encoding: "buffer", maxBuffer: 64 * 1024 * 1024 });
  if (listed.status !== 0) throw new Error("Could not enumerate tracked and unignored workspace files");
  const textExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".json", ".md", ".yml", ".yaml", ".toml", ".sql", ".ps1", ".sh", ".html", ".css", ".txt"]);
  files = listed.stdout.toString("utf8").split("\0").filter((file) => {
    const base = path.basename(file);
    if (file.startsWith(".next-") || file.startsWith("App/.tmp") || file.startsWith("App/app-build") || file.includes("node_modules")) return false;
    return !base.startsWith(".env") && base !== "package-lock.json" && !file.includes(".tmp") && textExtensions.has(path.extname(file).toLowerCase());
  });
} else {
  throw new Error("Usage: node scripts/scan-secrets.mjs [--staged|--all|--self-test]");
}

const findings = [];
for (const file of files) {
  let content;
  if (mode === "--staged") {
    const staged = spawnSync("git", ["show", `:${file}`], { encoding: "buffer", maxBuffer: 20 * 1024 * 1024 });
    if (staged.status !== 0) continue;
    content = staged.stdout.toString("utf8");
  } else {
    const absolute = path.resolve(root, file);
    if (!absolute.startsWith(root + path.sep) || !fs.existsSync(absolute) || !fs.statSync(absolute).isFile()) continue;
    content = fs.readFileSync(absolute, "utf8");
  }
  if (hasPrivilegedCredential(content)) findings.push(file);
}

if (findings.length) {
  console.error(`Blocked: privileged Supabase credential pattern detected in ${findings.length} staged/workspace file(s):`);
  for (const file of findings) console.error(`- ${file}`);
  process.exit(1);
}
console.log(`Secret scan passed (${files.length} ${mode === "--staged" ? "staged" : "workspace source"} files checked).`);
