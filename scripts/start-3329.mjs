import { spawn } from "node:child_process";
import { existsSync, openSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import nextEnv from "@next/env";

const root = "d:\\botly";
const demoRoot = path.join(root, "App", ".tmp", "healthclues-owner-demo");
const buildDir = path.join(demoRoot, "proof-title-20261105");
const pidFile = path.join(demoRoot, "next-proof-title-20261105.pid");
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
  NEXT_PUBLIC_SUPABASE_URL: loadedEnv.NEXT_PUBLIC_SUPABASE_URL || "https://rswmadukvegraxfcdbcb.supabase.co",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: loadedEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || runtimePub,
  SUPABASE_SECRET_KEY: loadedEnv.SUPABASE_SECRET_KEY || runtimeSecret,
  SUPABASE_SERVICE_ROLE_KEY: loadedEnv.SUPABASE_SERVICE_ROLE_KEY || loadedEnv.SUPABASE_SECRET_KEY || runtimeSecret,
  HEALTHCLUES_PENDING_JOURNEY_SECRET: loadedEnv.HEALTHCLUES_PENDING_JOURNEY_SECRET || loadedEnv.SUPABASE_SECRET_KEY || runtimeSecret,
};
delete buildEnv.HEALTHCLUES_BUILD_DIST_DIR;

console.log("Starting Next.js on port 3329 from", buildDir);
const logFile = path.join(demoRoot, "owner-demo-next.log");
const logFd = openSync(logFile, "a");
const server = spawn(process.execPath, [nextBin, "start", buildDir, "--hostname", "127.0.0.1", "--port", "3329"], {
  cwd: buildDir,
  env: buildEnv,
  detached: true,
  windowsHide: true,
  stdio: ["ignore", logFd, logFd],
});
server.unref();

writeFileSync(pidFile, String(server.pid), "utf8");
console.log("Spawned new server PID", server.pid);

for (let i = 0; i < 30; i++) {
  try {
    const res = await fetch("http://127.0.0.1:3329/play", { signal: AbortSignal.timeout(2000) });
    if (res.ok) {
      console.log("✓ Server ready on 3329!");
      process.exit(0);
    }
  } catch {}
  await new Promise(r => setTimeout(r, 1000));
}
console.error("Timeout waiting for 3329");
process.exit(1);

