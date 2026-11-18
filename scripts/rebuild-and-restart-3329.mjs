import { cpSync, existsSync, openSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import nextEnv from "@next/env";

const root = "d:\\botly";
const demoRoot = path.join(root, "App", ".tmp", "healthclues-owner-demo");
const buildDir = path.join(demoRoot, "proof-title-20261105");
const pidFile = path.join(demoRoot, "next-proof-title-20261105.pid");
const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next");

console.log("=== REBUILDING PROOF-TITLE-20261105 ===");

// 1. Sync updated src
cpSync(path.join(root, "src"), path.join(buildDir, "src"), { recursive: true, force: true });
cpSync(path.join(root, "public", "gametrinhtham"), path.join(buildDir, "public", "gametrinhtham"), { recursive: true, force: true });
cpSync(path.join(root, "App", "gametrinhtham"), path.join(buildDir, "gametrinhtham"), { recursive: true, force: true });
cpSync(path.join(root, "App", "gametrinhtham"), path.join(buildDir, "App", "gametrinhtham"), { recursive: true, force: true });
cpSync(path.join(root, "tsconfig.json"), path.join(buildDir, "tsconfig.json"), { force: true });

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

console.log("Running next build in", buildDir);
const buildResult = spawnSync(process.execPath, [nextBin, "build"], {
  cwd: buildDir,
  env: buildEnv,
  stdio: "inherit",
  windowsHide: true,
});

if (buildResult.status !== 0) {
  console.error("Build failed with code", buildResult.status);
  process.exit(1);
}

console.log("✓ Build completed successfully!");

// 2. Stop old server PID
if (existsSync(pidFile)) {
  const oldPid = Number(readFileSync(pidFile, "utf8").trim());
  if (oldPid > 0) {
    console.log("Stopping old PID", oldPid);
    try {
      spawnSync("powershell.exe", ["-NoProfile", "-Command", `Stop-Process -Id ${oldPid} -Force -ErrorAction SilentlyContinue`], { windowsHide: true });
    } catch {}
  }
}

// Kill anything remaining on port 3329
try {
  spawnSync("powershell.exe", ["-NoProfile", "-Command", "Get-NetTCPConnection -LocalPort 3329 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"], { windowsHide: true });
} catch {}

// Wait 1s
spawnSync("powershell.exe", ["-NoProfile", "-Command", "Start-Sleep -Seconds 1"]);

// 3. Start new server
console.log("Starting Next.js on port 3329...");
const logFile = path.join(demoRoot, "owner-demo-next.log");
const logFd = openSync(logFile, "a");
const server = spawn(process.execPath, [nextBin, "start", buildDir, "--hostname", "0.0.0.0", "--port", "3329"], {
  cwd: buildDir,
  env: buildEnv,
  detached: true,
  windowsHide: true,
  stdio: ["ignore", logFd, logFd],
});
server.unref();

writeFileSync(pidFile, String(server.pid), "utf8");
console.log("Spawned new server PID", server.pid);

// 4. Poll until port 3329 is ready
console.log("Waiting for http://127.0.0.1:3329/play to be ready...");
let ready = false;
for (let i = 0; i < 30; i++) {
  try {
    const res = await fetch("http://127.0.0.1:3329/play", { signal: AbortSignal.timeout(2000) });
    if (res.ok) {
      ready = true;
      break;
    }
  } catch {}
  await new Promise(r => setTimeout(r, 1000));
}

if (!ready) {
  console.error("Server did not become ready in 30s!");
  process.exit(1);
}

console.log("✓ Live server is UP and READY on port 3329!");
