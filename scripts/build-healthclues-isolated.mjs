import assert from "node:assert/strict";
import { cpSync, existsSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import nextEnv from "@next/env";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const nextBin = path.join(projectRoot, "node_modules", "next", "dist", "bin", "next");

if (process.env.VERCEL) {
  const result = spawnSync(process.execPath, [nextBin, "build"], {
    cwd: projectRoot,
    env: { ...process.env, NODE_ENV: "production" },
    stdio: "inherit",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status);
  process.exit(0);
}

const tempParent = path.join(projectRoot, ".tmp");
if (!existsSync(tempParent)) mkdirSync(tempParent, { recursive: true });
const buildRoot = mkdtempSync(path.join(tempParent, "healthclues-build-"));
const requiredFiles = ["package.json", "next.config.ts", "tsconfig.json", "postcss.config.mjs"];
const loadedEnv = nextEnv.loadEnvConfig(projectRoot).combinedEnv;
const buildEnv = { ...loadedEnv, NODE_ENV: "production" };
buildEnv.HEALTHCLUES_TURBOPACK_ROOT = projectRoot;
buildEnv.NODE_OPTIONS = (buildEnv.NODE_OPTIONS ? `${buildEnv.NODE_OPTIONS} ` : "") + "--max-old-space-size=4096";
delete buildEnv.HEALTHCLUES_BUILD_DIST_DIR;

function cleanupOwnedBuildDirectory() {
  const resolved = path.resolve(buildRoot);
  const relative = path.relative(tempParent, resolved);
  assert.ok(relative.startsWith("healthclues-build-"), "Refusing to clean a path outside this run's build directory.");
  assert.ok(!relative.includes("..") && !path.isAbsolute(relative), "Refusing to clean an unexpected path.");
  try {
    if (existsSync(resolved)) rmSync(resolved, { recursive: true, force: true, maxRetries: 2 });
  } catch (e) {
    console.warn("Notice: temp build directory retained for later async cleanup:", e?.message || e);
  }
}

try {
  for (const name of ["src", "public", ...requiredFiles]) {
    const source = path.join(projectRoot, name);
    assert.ok(existsSync(source), `Missing isolated build input: ${name}`);
    cpSync(source, path.join(buildRoot, name), { recursive: true, dereference: false });
  }
  const detectiveSource = path.join(projectRoot, "App", "gametrinhtham");
  if (existsSync(detectiveSource)) {
    cpSync(detectiveSource, path.join(buildRoot, "gametrinhtham"), { recursive: true, dereference: false });
  }
  // The isolated project root prevents the sibling App product-docs folder from
  // being mistaken for Next's case-insensitive root `app` directory on Windows.

  const result = spawnSync(process.execPath, [nextBin, "build"], {
    cwd: buildRoot,
    env: buildEnv,
    stdio: "inherit",
    windowsHide: true,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`Isolated Next.js production build exited with status ${result.status}. Build workspace retained at ${buildRoot}`);

  cleanupOwnedBuildDirectory();
  console.log("HealthClues isolated Next.js production build passed. Existing baseline and root .next artifacts were preserved.");
} catch (error) {
  console.error(`Isolated HealthClues build failed. Workspace retained at ${buildRoot}`);
  throw error;
}
