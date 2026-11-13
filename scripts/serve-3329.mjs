import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import nextEnv from "@next/env";

const root = "d:\\botly";
const demoRoot = path.join(root, "App", ".tmp", "healthclues-owner-demo");
const buildDir = path.join(demoRoot, "proof-title-20261105");
const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next");

let runtimePub = "";
let runtimeSecret = "";
const runtimePath = path.join(demoRoot, "owner-demo-runtime.json");
if (existsSync(runtimePath)) {
  const rt = JSON.parse(readFileSync(runtimePath, "utf8"));
  runtimePub = rt.publishableKey;
  runtimeSecret = rt.secretKey;
}

const loadedEnv = nextEnv.loadEnvConfig(root).combinedEnv;
const buildEnv = {
  ...loadedEnv,
  NODE_ENV: "production",
  HEALTHCLUES_TURBOPACK_ROOT: root,
  NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: runtimePub || loadedEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_SECRET_KEY: runtimeSecret || loadedEnv.SUPABASE_SECRET_KEY,
};
delete buildEnv.HEALTHCLUES_BUILD_DIST_DIR;

console.log("Serving Next.js on port 3329 from", buildDir);
const server = spawn(process.execPath, [nextBin, "start", buildDir, "--port", "3329"], {
  cwd: buildDir,
  env: buildEnv,
  stdio: "inherit",
});

server.on("exit", (code) => {
  console.log("Server exited with code", code);
  process.exit(code ?? 0);
});
