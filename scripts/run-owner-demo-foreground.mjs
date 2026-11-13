import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const demoRoot = path.join(root, "App", ".tmp", "healthclues-owner-demo");
const buildDir = path.join(demoRoot, "app-build");
const runtimeConfigFile = path.join(demoRoot, "owner-demo-runtime.json");
const pendingSecretFile = path.join(demoRoot, "pending-journey-secret.txt");
const reminderJobTokenFile = path.join(demoRoot, "reminder-job-token.txt");
const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next");

const port = Number(process.env.HEALTHCLUES_OWNER_DEMO_PORT || 3000);

assert.ok(existsSync(runtimeConfigFile), "Local demo runtime config missing.");
const runtimeConfig = JSON.parse(readFileSync(runtimeConfigFile, "utf8"));
assert.ok(existsSync(pendingSecretFile), "Pending secret missing.");
const pendingSecret = readFileSync(pendingSecretFile, "utf8").trim();
assert.ok(existsSync(reminderJobTokenFile), "Reminder token missing.");
const reminderJobToken = readFileSync(reminderJobTokenFile, "utf8").trim();

const env = {
  ...process.env,
  NODE_ENV: "production",
  NEXT_TELEMETRY_DISABLED: "1",
  HEALTHCLUES_AI_ENABLED: "false",
  HEALTHCLUES_EMAIL_PROVIDER: "mailpit",
  HEALTHCLUES_REMINDER_JOB_TOKEN: reminderJobToken,
  HEALTHCLUES_OWNER_DEMO_PORT: String(port),
  HEALTHCLUES_TURBOPACK_ROOT: root,
  NEXT_PUBLIC_SUPABASE_URL: runtimeConfig.apiUrl,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: runtimeConfig.publishableKey,
  SUPABASE_URL: runtimeConfig.apiUrl,
  SUPABASE_SECRET_KEY: runtimeConfig.secretKey,
  HEALTHCLUES_OWNER_DEMO: "1",
  HEALTHCLUES_PENDING_JOURNEY_SECRET: pendingSecret,
};

console.log(`Starting HealthClues Owner Demo on port ${port} (0.0.0.0)...`);
const server = spawn(process.execPath, [nextBin, "start", buildDir, "--hostname", "0.0.0.0", "--port", String(port)], {
  cwd: buildDir,
  env,
  stdio: "inherit",
  windowsHide: false,
});

server.on("exit", (code, signal) => {
  console.log(`Demo server exited with code ${code}, signal ${signal}`);
  process.exit(code ?? 1);
});
