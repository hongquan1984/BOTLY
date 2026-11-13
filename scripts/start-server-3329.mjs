import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { spawn } from "node:child_process";
import path from "node:path";
import nextEnv from "@next/env";

const root = "d:\\botly";
const demoRoot = path.join(root, "App", ".tmp", "healthclues-owner-demo");
const buildDir = path.join(demoRoot, "app-build-rpg-ui");
const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next");
const pidFile = path.join(demoRoot, "next-app-build-rpg-ui.pid");
const port = 3329;

const rt = JSON.parse(readFileSync(path.join(demoRoot, "owner-demo-runtime.json"), "utf8"));
const pendingSecret = readFileSync(path.join(demoRoot, "pending-journey-secret.txt"), "utf8").trim();
const reminderToken = readFileSync(path.join(demoRoot, "reminder-job-token.txt"), "utf8").trim();

const loadedEnv = nextEnv.loadEnvConfig(root).combinedEnv;
const runtimeEnv = {
  ...loadedEnv,
  NODE_ENV: "production",
  PORT: String(port),
  HEALTHCLUES_OWNER_DEMO: "1",
  SUPABASE_URL: "http://127.0.0.1:54321",
  NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: rt.publishableKey,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: rt.publishableKey,
  SUPABASE_SERVICE_ROLE_KEY: rt.secretKey,
  SUPABASE_SECRET_KEY: rt.secretKey,
  HEALTHCLUES_PENDING_JOURNEY_SECRET: pendingSecret,
  HEALTHCLUES_REMINDER_JOB_TOKEN: reminderToken,
};

const server = spawn(process.execPath, [nextBin, "start", buildDir, "--hostname", "127.0.0.1", "--port", String(port)], {
  cwd: buildDir,
  env: runtimeEnv,
  stdio: "inherit",
});

writeFileSync(pidFile, String(server.pid), "utf8");
console.log(`Spawned Next.js server PID ${server.pid} on port ${port}`);

process.on("SIGINT", () => { server.kill(); process.exit(0); });
process.on("SIGTERM", () => { server.kill(); process.exit(0); });

// Keep process running
await new Promise((resolve) => server.on("close", resolve));
