import { existsSync, readFileSync, cpSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const demoRoot = path.join(root, "App", ".tmp", "healthclues-owner-demo");
const buildDir = path.join(demoRoot, "app-build");
const runtimeConfigFile = path.join(demoRoot, "owner-demo-runtime.json");
const pendingSecretFile = path.join(demoRoot, "pending-journey-secret.txt");
const reminderJobTokenFile = path.join(demoRoot, "reminder-job-token.txt");
const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next");

console.log("Syncing latest src, public and configs from workspace root to app-build...");
cpSync(path.join(root, "src"), path.join(buildDir, "src"), { recursive: true });
cpSync(path.join(root, "public"), path.join(buildDir, "public"), { recursive: true });

for (const name of ["package.json", "next.config.ts", "tsconfig.json", "postcss.config.mjs"]) {
  if (existsSync(path.join(root, name))) {
    cpSync(path.join(root, name), path.join(buildDir, name));
  }
}

const runtimeConfig = JSON.parse(readFileSync(runtimeConfigFile, "utf8"));
const pendingSecret = readFileSync(pendingSecretFile, "utf8").trim();
const reminderJobToken = readFileSync(reminderJobTokenFile, "utf8").trim();

const env = {
  ...process.env,
  NODE_OPTIONS: `${process.env.NODE_OPTIONS || ""} --max-old-space-size=4096`.trim(),
  NODE_ENV: "production",
  NEXT_TELEMETRY_DISABLED: "1",
  HEALTHCLUES_AI_ENABLED: "false",
  HEALTHCLUES_EMAIL_PROVIDER: "mailpit",
  HEALTHCLUES_REMINDER_JOB_TOKEN: reminderJobToken,
  HEALTHCLUES_OWNER_DEMO_PORT: "3000",
  HEALTHCLUES_TURBOPACK_ROOT: root,
  NODE_PATH: [path.join(demoRoot, "node_modules"), path.join(root, "node_modules")].join(path.delimiter),
  NEXT_PUBLIC_SUPABASE_URL: runtimeConfig.apiUrl,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: runtimeConfig.publishableKey,
  SUPABASE_URL: runtimeConfig.apiUrl,
  SUPABASE_SECRET_KEY: runtimeConfig.secretKey,
  HEALTHCLUES_OWNER_DEMO: "1",
  HEALTHCLUES_PENDING_JOURNEY_SECRET: pendingSecret,
};

console.log("Running next build in", buildDir);
const result = spawnSync(process.execPath, [nextBin, "build"], {
  cwd: buildDir,
  env,
  encoding: "utf8",
  stdio: "inherit",
  windowsHide: true,
  maxBuffer: 40 * 1024 * 1024,
});

if (result.status !== 0) {
  console.error("Build failed with code:", result.status);
  process.exit(result.status || 1);
}

console.log("Build succeeded!");
