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
  HEALTHCLUES_OWNER_DEMO: "1",
  HEALTHCLUES_EMAIL_PROVIDER: "mailpit",
  HEALTHCLUES_REMINDER_JOB_TOKEN: "local-reminder-secret-token-3329",
  MAILPIT_API_URL: "http://127.0.0.1:54324",
  SUPABASE_URL: "http://127.0.0.1:54321",
  NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
  SUPABASE_PUBLISHABLE_KEY: runtimePub || loadedEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: runtimePub || loadedEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: runtimePub || loadedEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_SERVICE_ROLE_KEY: runtimeSecret || loadedEnv.SUPABASE_SECRET_KEY,
  SUPABASE_SECRET_KEY: runtimeSecret || loadedEnv.SUPABASE_SECRET_KEY,
};
delete buildEnv.HEALTHCLUES_BUILD_DIST_DIR;

console.log("Starting Next.js daemon on port 3329 (with auto-restart)...");

function runServer() {
  const server = spawn(process.execPath, [nextBin, "start", buildDir, "--hostname", "127.0.0.1", "--port", "3329"], {
    cwd: buildDir,
    env: buildEnv,
    stdio: ["ignore", "inherit", "inherit"],
  });

  server.on("exit", (code) => {
    console.log(`[Next.js 3329] exited with code ${code}, reviving in 1000ms...`);
    setTimeout(runServer, 1000);
  });
}

runServer();
