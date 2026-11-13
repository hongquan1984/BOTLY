import assert from "node:assert/strict";
import { cpSync, existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import nextEnv from "@next/env";

const root = "d:\\botly";
const demoRoot = path.join(root, "App", ".tmp", "healthclues-owner-demo");
const buildDir = path.join(demoRoot, "app-build-rpg-ui");
const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next");

assert.ok(existsSync(buildDir), `buildDir does not exist: ${buildDir}`);

console.log("Syncing src and public to app-build-rpg-ui...");
cpSync(path.join(root, "src"), path.join(buildDir, "src"), { recursive: true });
cpSync(path.join(root, "public"), path.join(buildDir, "public"), { recursive: true });

for (const name of ["package.json", "next.config.ts", "tsconfig.json", "postcss.config.mjs"]) {
  cpSync(path.join(root, name), path.join(buildDir, name));
}

let runtimePub = "";
const runtimePath = path.join(demoRoot, "owner-demo-runtime.json");
if (existsSync(runtimePath)) {
  const rt = JSON.parse(readFileSync(runtimePath, "utf8"));
  runtimePub = rt.publishableKey;
}

const loadedEnv = nextEnv.loadEnvConfig(root).combinedEnv;
const buildEnv = {
  ...loadedEnv,
  NODE_ENV: "production",
  NODE_OPTIONS: "--max-old-space-size=4096",
  HEALTHCLUES_TURBOPACK_ROOT: root,
  NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: runtimePub || loadedEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
};
delete buildEnv.HEALTHCLUES_BUILD_DIST_DIR;

console.log("Running next build in app-build-rpg-ui...");
const result = spawnSync(process.execPath, [nextBin, "build"], {
  cwd: buildDir,
  env: buildEnv,
  stdio: "inherit",
  windowsHide: true,
});

if (result.error) throw result.error;
if (result.status !== 0) {
  throw new Error(`Build failed with exit code ${result.status}`);
}

console.log("Build successfully completed for app-build-rpg-ui!");
