import assert from "node:assert/strict";
import { cpSync, existsSync, mkdirSync, openSync, readFileSync, readdirSync, symlinkSync, writeFileSync } from "node:fs";
import { spawn, spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const demoRoot = path.join(root, "App", ".tmp", "healthclues-owner-demo");
const supabaseDir = path.join(demoRoot, "supabase");
const buildName = process.env.HEALTHCLUES_OWNER_DEMO_BUILD_NAME || "app-build";
assert.ok(/^[a-zA-Z0-9-]{1,50}$/.test(buildName), "Invalid owner-demo build name.");
const buildRoot = path.resolve(process.env.HEALTHCLUES_OWNER_DEMO_BUILD_ROOT || demoRoot);
const buildDir = path.join(buildRoot, buildName);
const pidFile = path.join(demoRoot, buildName === "app-build" ? "next.pid" : `next-${buildName}.pid`);
const pendingSecretFile = path.join(demoRoot, "pending-journey-secret.txt");
const reminderJobTokenFile = path.join(demoRoot, "reminder-job-token.txt");
const runtimeConfigFile = path.join(demoRoot, "owner-demo-runtime.json");
const privateGeminiEnvFile = path.join(root, "App", "secrets", "healthclues-owner-demo.env");
const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next");
const supabaseBin = path.join(demoRoot, "supabase.exe");
const port = Number(process.env.HEALTHCLUES_OWNER_DEMO_PORT || 3235);
const apiUrl = "http://127.0.0.1:54321";
const inboxUrl = "http://127.0.0.1:54324";
const isStop = process.argv.includes("--stop");
const isRebuild = process.argv.includes("--rebuild");
// Reuse the owner-verified live local Supabase without starting/stopping it,
// applying migrations, or seeding data. Intended for Phase 10A acceptance.
const reuseExistingSupabase = process.argv.includes("--reuse-existing-supabase");

function run(args, { cwd = root, env = process.env, quiet = false } = {}) {
  const scopedEnv = { ...env, SUPABASE_TELEMETRY_DISABLED: "1", DOCKER_HOST: "npipe:////./pipe/dockerDesktopLinuxEngine", DOCKER_CONFIG: path.join(demoRoot, "docker-config") };
  let result;
  for (let attempt = 0; attempt < 3; attempt++) {
    result = spawnSync(args[0], args.slice(1), { cwd, env: scopedEnv, encoding: "utf8", windowsHide: true, maxBuffer: 20 * 1024 * 1024 });
    if (result.status === 0 || !/permission denied|cannot connect to the docker api/i.test(result.stderr || "") || attempt === 2) break;
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 300);
  }
  if (!quiet && result.stdout) process.stdout.write(result.stdout);
  if (result.status !== 0) {
    if (result.stderr) process.stderr.write(result.stderr.replace(/(SECRET_KEY|SERVICE_ROLE_KEY|PUBLISHABLE_KEY|ANON_KEY)=\S+/gi, "$1=[redacted]"));
    throw new Error(`${path.basename(args[0])} ${args.slice(1).join(" ")} exited ${result.status ?? result.error?.message ?? "without a status"}`);
  }
  return result.stdout || "";
}

function configText() {
  return `project_id = "healthclues-owner-demo"\n\n[api]\nenabled = true\nport = 54321\nschemas = ["public", "graphql_public"]\nextra_search_path = ["public", "extensions"]\nmax_rows = 1000\n\n[db]\nport = 54322\nshadow_port = 54320\nhealth_timeout = "3m"\nmajor_version = 17\n\n[db.pooler]\nenabled = false\n\n[db.migrations]\nenabled = true\nschema_paths = []\n\n[db.seed]\nenabled = false\nsql_paths = []\n\n[realtime]\nenabled = false\n\n[studio]\nenabled = false\n\n[local_smtp]\nenabled = true\nport = 54324\nsmtp_port = 54325\n\n[storage]\nenabled = false\n\n[auth]\nenabled = true\nsite_url = "http://127.0.0.1:${port}"\nadditional_redirect_urls = ["http://127.0.0.1:${port}/**", "http://localhost:${port}/**"]\njwt_expiry = 3600\nenable_refresh_token_rotation = true\nrefresh_token_reuse_interval = 10\nenable_signup = true\nenable_anonymous_sign_ins = false\n\n[auth.rate_limit]\nemail_sent = 20\nsign_in_sign_ups = 60\ntoken_verifications = 60\n\n[auth.email]\nenable_signup = true\ndouble_confirm_changes = true\nenable_confirmations = true\nsecure_password_change = false\nmax_frequency = "1s"\notp_length = 6\notp_expiry = 3600\n`;
}

function initializeIsolatedWorkspace() {
  mkdirSync(path.join(supabaseDir, "migrations"), { recursive: true });
  mkdirSync(demoRoot, { recursive: true });
  const dockerConfigDir = path.join(demoRoot, "docker-config");
  mkdirSync(dockerConfigDir, { recursive: true });
  const dockerConfigFile = path.join(dockerConfigDir, "config.json");
  if (!existsSync(dockerConfigFile)) writeFileSync(dockerConfigFile, "{}\n", "utf8");
  const configFile = path.join(supabaseDir, "config.toml");
  if (!existsSync(configFile)) writeFileSync(configFile, configText(), "utf8");
  else {
    const existing = readFileSync(configFile, "utf8");
    assert.ok(existing.includes('project_id = "healthclues-owner-demo"'), "Refusing to overwrite an unrecognized Supabase config.");
    if (existing !== configText()) writeFileSync(configFile, configText(), "utf8");
  }

  const migrations = path.join(root, "supabase", "migrations");
  const migrationFiles = readdirSync(migrations).filter(name => /^\d+.*\.sql$/i.test(name));
  assert.ok(migrationFiles.length > 0, "No repository migrations found.");
  for (const name of migrationFiles) {
    const source = path.join(migrations, name);
    const target = path.join(supabaseDir, "migrations", name);
    let contents = readFileSync(source, "utf8");
    if (name === "20261027070000_botly_existing_schema_baseline.sql") {
      // Local Supabase does not grant the migration role ownership of the cloud-only supabase_admin role.
      const remoteRoleAcl = contents.match(/^ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin[^;]*;\r?\n/gm) || [];
      assert.equal(remoteRoleAcl.length, 12, "Unexpected production baseline ACL shape; refusing to normalize automatically.");
      contents = contents.replace(/^ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin[^;]*;\r?\n/gm, "");
    }
    if (!existsSync(target)) writeFileSync(target, contents, "utf8");
    else {
      const existing = readFileSync(target, "utf8");
      if (existing === contents) continue;
      if (name === "20261027070000_botly_existing_schema_baseline.sql" && existing === readFileSync(source, "utf8")) writeFileSync(target, contents, "utf8");
      else assert.fail(`Demo migration snapshot differs from source: ${name}`);
    }
  }
  if (!existsSync(supabaseBin)) {
    const source = path.join(root, "App", ".tmp", "supabase-cli", "package", "bin", "supabase.exe");
    assert.ok(existsSync(source), `Supabase CLI was not found at ${source}`);
    cpSync(source, supabaseBin);
  }
}

async function isPortFree(target) {
  return new Promise(resolve => {
    const probe = net.createServer();
    probe.once("error", () => resolve(false));
    probe.listen(target, "127.0.0.1", () => probe.close(() => resolve(true)));
  });
}

function readOwnerDemoRuntimeConfig() {
  assert.ok(existsSync(runtimeConfigFile), `Dedicated local runtime config is missing: ${runtimeConfigFile}`);
  const config = JSON.parse(readFileSync(runtimeConfigFile, "utf8"));
  assert.equal(config.projectId, "healthclues-owner-demo", "Runtime config project id does not match the isolated Owner Demo.");
  assert.equal(config.apiUrl, apiUrl, "Runtime config does not target the expected loopback API.");
  assert.ok(typeof config.publishableKey === "string" && config.publishableKey.length > 20, "Local publishable key is missing.");
  assert.ok(typeof config.secretKey === "string" && config.secretKey.length > 20, "Local server key is missing.");
  assert.equal(config.source, "supabase status --workdir healthclues-owner-demo --output json", "Runtime config was not generated from the isolated local Supabase CLI status.");
  assert.match(config.cliVersion || "", /^\d+\.\d+\.\d+$/, "Local Supabase CLI version is missing from runtime config.");
  return { apiUrl: config.apiUrl, publishableKey: config.publishableKey, secretKey: config.secretKey };
}

function saveOwnerDemoRuntimeConfig(keys) {
  const cliVersion = run([supabaseBin, "--version"], { quiet: true }).trim();
  assert.match(cliVersion, /^\d+\.\d+\.\d+$/, "Could not verify the installed Supabase CLI version.");
  const config = {
    projectId: "healthclues-owner-demo", apiUrl: keys.apiUrl,
    publishableKey: keys.publishableKey, secretKey: keys.secretKey,
    source: "supabase status --workdir healthclues-owner-demo --output json",
    cliVersion,
    verifiedAtUtc: new Date().toISOString(),
  };
  writeFileSync(runtimeConfigFile, JSON.stringify(config), { encoding: "utf8", mode: 0o600 });
}

function readSupabaseEnv() {
  // Reuse the dedicated git-ignored configuration, never .env.local. The local
  // launcher/preflight verifies its endpoint and keys before the app is built.
  if (existsSync(runtimeConfigFile)) return readOwnerDemoRuntimeConfig();
  const status = run([supabaseBin, "status", "--workdir", demoRoot, "--output", "json"], { quiet: true });
  const parsed = JSON.parse(status);
  const localApi = parsed.API_URL || parsed.api_url;
  assert.equal(localApi, apiUrl, "Supabase CLI did not confirm the expected local API URL; refusing to enable writes.");
  const publishable = parsed.PUBLISHABLE_KEY || parsed.publishable_key || parsed.ANON_KEY || parsed.anon_key;
  const secret = parsed.SECRET_KEY || parsed.secret_key || parsed.SERVICE_ROLE_KEY || parsed.service_role_key;
  assert.ok(publishable && secret, "Local Supabase publishable/secret keys are missing.");
  const keys = { apiUrl: localApi, publishableKey: publishable, secretKey: secret };
  saveOwnerDemoRuntimeConfig(keys);
  return readOwnerDemoRuntimeConfig();
}

function isLocalServiceReady(url) {
  return fetch(url, { signal: AbortSignal.timeout(1500) }).then(response => response.ok || response.status === 404).catch(() => false);
}

function seedLocalOwnerDemoContent() {
  // Called only after Supabase status confirmed the local API is exactly 127.0.0.1:54321.
  const fixtureFile = path.join(root, "scripts", "fixtures", "healthclues-owner-demo-content.sql");
  assert.ok(existsSync(fixtureFile), "The local-only owner demo fixture file is missing.");
  const dockerEnv = { ...process.env, DOCKER_HOST: "npipe:////./pipe/dockerDesktopLinuxEngine", DOCKER_CONFIG: path.join(demoRoot, "docker-config") };
  const result = spawnSync("docker", ["exec", "-i", "supabase_db_healthclues-owner-demo", "psql", "-v", "ON_ERROR_STOP=1", "-U", "postgres", "-d", "postgres"], {
    cwd: root,
    env: dockerEnv,
    input: readFileSync(fixtureFile, "utf8"), encoding: "utf8", windowsHide: true, maxBuffer: 5 * 1024 * 1024,
  });
  if (result.status !== 0) throw new Error(`Local TEST ONLY owner-demo fixture seed failed: ${(result.stderr || result.stdout || "unknown error").slice(-1600)}`);
  console.log("Seeded idempotent TEST ONLY fixtures into the verified local owner-demo database.");
}

async function canExposeLocalFixtures() {
  // Older owner-preview bundles query published rows without TEST ONLY filtering.
  // Never activate fixtures while a legacy preview is still serving the shared DB.
  const legacyPorts = [3247, 3248].filter(target => target !== port);
  const occupied = [];
  for (const target of legacyPorts) if (!(await isPortFree(target))) occupied.push(target);
  if (occupied.length) {
    console.log(`Keeping TEST ONLY content inactive because preview port(s) ${occupied.join(", ")} are still serving. No process was stopped.`);
    return false;
  }
  return true;
}

async function startServices() {
  const apiFree = await isPortFree(54321);
  const dbFree = await isPortFree(54322);
  const mailFree = await isPortFree(54324);
  if (!apiFree || !dbFree || !mailFree) {
    const servicesAreOurLocalStack = await isLocalServiceReady(`${apiUrl}/auth/v1/health`) && await isLocalServiceReady(`${inboxUrl}/`);
    assert.ok(servicesAreOurLocalStack, "A required demo port is occupied by a service that cannot be verified as this local HealthClues stack. Nothing was stopped or changed.");
  } else {
    const dockerEnv = { ...process.env, SUPABASE_TELEMETRY_DISABLED: "1", DOCKER_HOST: "npipe:////./pipe/dockerDesktopLinuxEngine", DOCKER_CONFIG: path.join(demoRoot, "docker-config") };
    const started = spawnSync(supabaseBin, ["start", "--workdir", demoRoot, "--exclude", "realtime,storage-api,imgproxy,postgres-meta,studio,edge-runtime,logflare,vector,supavisor"], { cwd: root, env: dockerEnv, encoding: "utf8", windowsHide: true, maxBuffer: 20 * 1024 * 1024 });
    const combined = `${started.stdout || ""}\n${started.stderr || ""}`;
    const log = combined
      .replace(/("(?:SECRET_KEY|SERVICE_ROLE_KEY|PUBLISHABLE_KEY|ANON_KEY|JWT_SECRET|DB_URL)"\s*:\s*")[^"]+("?)/gi, "$1[redacted]$2")
      .replace(/(SECRET_KEY|SERVICE_ROLE_KEY|PUBLISHABLE_KEY|ANON_KEY|JWT_SECRET|DB_URL)=\S+/gi, "$1=[redacted]")
      .replace(/sb_(?:secret|publishable)_[A-Za-z0-9_-]+/g, "[redacted-key]");
    writeFileSync(path.join(demoRoot, "supabase-start.log"), log, "utf8");
    if (started.status !== 0) throw new Error(`Local Supabase start failed (${started.status}). See ${path.join(demoRoot, "supabase-start.log")}`);
  }
  assert.ok(await isLocalServiceReady(`${apiUrl}/auth/v1/health`), "Local Supabase Auth health check failed.");
  assert.ok(await isLocalServiceReady(`${inboxUrl}/`), "Local Mailpit inbox health check failed.");
  const keys = readSupabaseEnv();
  const settings = await fetch(`${apiUrl}/auth/v1/settings`, { headers: { apikey: keys.publishableKey }, signal: AbortSignal.timeout(5000) });
  assert.ok(settings.ok, "Local Auth settings endpoint did not respond.");
  run([supabaseBin, "migration", "up", "--local", "--workdir", demoRoot], { quiet: true });
  return keys;
}

async function verifyReusedLocalServices(keys) {
  const configFile = path.join(supabaseDir, "config.toml");
  assert.ok(existsSync(configFile), "The existing local Supabase config is missing; refusing reuse mode.");
  const config = readFileSync(configFile, "utf8");
  assert.ok(/project_id\s*=\s*"healthclues-owner-demo"/.test(config), "The existing local Supabase project id does not match the isolated Owner Demo.");
  assert.equal(keys.apiUrl, apiUrl, "The existing local Supabase API URL is not the expected loopback endpoint.");
  const [authHealth, authSettings, rest, mailpit] = await Promise.all([
    fetch(apiUrl + "/auth/v1/health", { signal: AbortSignal.timeout(5000) }).catch(() => null),
    fetch(apiUrl + "/auth/v1/settings", { headers: { apikey: keys.publishableKey }, signal: AbortSignal.timeout(5000) }).catch(() => null),
    fetch(apiUrl + "/rest/v1/healthclues_catalog_items?select=id&limit=1", { headers: { apikey: keys.publishableKey, Authorization: "Bearer " + keys.publishableKey }, signal: AbortSignal.timeout(5000) }).catch(() => null),
    fetch(inboxUrl + "/", { signal: AbortSignal.timeout(5000) }).catch(() => null),
  ]);
  assert.ok(authHealth?.ok && authSettings?.ok && rest?.ok && mailpit?.ok, "Existing Auth, REST or Mailpit health checks failed; no write-enabled app was started.");
  console.log("Read-only reuse verification: project=healthclues-owner-demo, API=127.0.0.1:54321, Auth/REST/Mailpit reachable; no migration or fixture seed requested.");
}

function safeAppEnv(keys) {
  const blocked = /^(SUPABASE_|NEXT_PUBLIC_SUPABASE_|DATABASE_URL$|PGHOST$|PGPORT$|PGUSER$|PGPASSWORD$|RESEND_API_KEY$|EMAIL_FROM$|ENABLE_REAL_EMAIL_DISPATCH$|EBOOK_ADMIN_TOKEN$|GEMINI_API_KEY$|GEMINI_MODEL$|HEALTHCLUES_ADVISOR_PROVIDER$|HEALTHCLUES_(AI_|EMAIL_PROVIDER$|REMINDER_JOB_TOKEN$|REVIEWER|MODERATOR))/i;
  const env = Object.fromEntries(Object.entries(process.env).filter(([name]) => !blocked.test(name)));
  let pendingSecret;
  if (existsSync(pendingSecretFile)) pendingSecret = readFileSync(pendingSecretFile, "utf8").trim();
  else {
    pendingSecret = randomBytes(48).toString("base64url");
    writeFileSync(pendingSecretFile, pendingSecret, { mode: 0o600 });
  }
  assert.ok(pendingSecret.length >= 32, "The isolated pending-journey encryption key is invalid.");
  let reminderJobToken;
  if (existsSync(reminderJobTokenFile)) reminderJobToken = readFileSync(reminderJobTokenFile, "utf8").trim();
  else { reminderJobToken = randomBytes(48).toString("base64url"); writeFileSync(reminderJobTokenFile, reminderJobToken, { mode: 0o600 }); }
  assert.ok(reminderJobToken.length >= 32, "The isolated reminder worker token is invalid.");
  Object.assign(env, {
    NODE_ENV: "production",
    NEXT_TELEMETRY_DISABLED: "1",
    HEALTHCLUES_AI_ENABLED: "false",
    HEALTHCLUES_EMAIL_PROVIDER: "mailpit",
    HEALTHCLUES_REMINDER_JOB_TOKEN: reminderJobToken,
    HEALTHCLUES_OWNER_DEMO_PORT: String(port),
    // The isolated source copy is below the repository node_modules. Keep the established
    // repository Turbopack root for package resolution while building the copied app.
    HEALTHCLUES_TURBOPACK_ROOT: root,
    // When the isolated build is staged on C: to protect a full D: workspace, Node
    // still needs the repository's installed toolchain from D:\botly\node_modules.
    NODE_PATH: [path.join(buildRoot, "node_modules"), path.join(root, "node_modules")].join(path.delimiter),
    NEXT_PUBLIC_SUPABASE_URL: keys.apiUrl,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: keys.publishableKey,
    SUPABASE_URL: keys.apiUrl,
    SUPABASE_SECRET_KEY: keys.secretKey,
    HEALTHCLUES_OWNER_DEMO: "1",
    HEALTHCLUES_PENDING_JOURNEY_SECRET: pendingSecret,
  });
  delete env.HEALTHCLUES_BUILD_DIST_DIR;
  return env;
}

function privateAdvisorRuntimeEnv(baseEnv) {
  const env = { ...baseEnv, HEALTHCLUES_ADVISOR_PROVIDER: "unavailable" };
  if (!existsSync(privateGeminiEnvFile)) return env;
  const allowed = new Set(["GEMINI_API_KEY", "GEMINI_MODEL", "HEALTHCLUES_ADVISOR_PROVIDER"]);
  const parsed = {};
  for (const rawLine of readFileSync(privateGeminiEnvFile, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const match = /^([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
    assert.ok(match && allowed.has(match[1]), "Private Gemini env file contains an unsupported entry; use only GEMINI_API_KEY, GEMINI_MODEL, and HEALTHCLUES_ADVISOR_PROVIDER.");
    assert.ok(!Object.hasOwn(parsed, match[1]), "Private Gemini env file contains a duplicate setting.");
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    parsed[match[1]] = value;
  }
  const provider = parsed.HEALTHCLUES_ADVISOR_PROVIDER || "gemini";
  assert.ok(provider === "gemini" || provider === "deterministic_demo", "Advisor provider must be gemini or deterministic_demo.");
  if (provider === "gemini") assert.ok(typeof parsed.GEMINI_API_KEY === "string" && parsed.GEMINI_API_KEY.length >= 20, "The private Gemini env file is missing a valid GEMINI_API_KEY.");
  if (parsed.GEMINI_MODEL) assert.ok(/^[a-zA-Z0-9._-]{3,100}$/.test(parsed.GEMINI_MODEL), "GEMINI_MODEL has an invalid format.");
  return { ...env, ...parsed, HEALTHCLUES_ADVISOR_PROVIDER: provider, GEMINI_MODEL: parsed.GEMINI_MODEL || "gemini-3.8-flash", HEALTHCLUES_AI_ENABLED: "true" };
}

async function buildApp(env) {
  const buildId = path.join(buildDir, ".next", "BUILD_ID");
  if (!isRebuild && existsSync(buildId)) {
    console.log("Using existing isolated owner-demo build. Use --rebuild to build from current source.");
    return;
  }
  mkdirSync(buildDir, { recursive: true });
  // Tailwind's CSS import must resolve within Turbopack's isolated project root.
  // Keep other installed dependencies available through NODE_PATH without copying all node_modules.
  const isolatedNodeModules = path.join(buildRoot, "node_modules");
  mkdirSync(isolatedNodeModules, { recursive: true });
  const localTailwind = path.join(isolatedNodeModules, "tailwindcss");
  if (!existsSync(localTailwind)) cpSync(path.join(root, "node_modules", "tailwindcss"), localTailwind, { recursive: true, dereference: false });
  const junctionPackage = (source, destination) => {
    if (existsSync(destination)) return;
    mkdirSync(path.dirname(destination), { recursive: true });
    try { symlinkSync(source, destination, "junction"); }
    catch (error) {
      // Managed Windows workspaces can reject directory junction creation for a
      // package even when the source and destination are both inside the demo.
      // NODE_PATH already points at the repository's installed dependencies, so
      // the isolated app can resolve this package without copying node_modules.
      if (error?.code !== "EISDIR" && error?.code !== "EPERM" && error?.code !== "UNKNOWN") throw error;
    }
  };
  // TypeScript and PostCSS resolve packages from the isolated project tree. Directory
  // junctions keep this lightweight; Tailwind itself is copied so Turbopack's CSS
  // resolver sees that stylesheet inside its project root rather than outside it.
  for (const entry of readdirSync(path.join(root, "node_modules"), { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;
    const source = path.join(root, "node_modules", entry.name);
    if (entry.name.startsWith("@") && entry.isDirectory()) {
      const scope = path.join(isolatedNodeModules, entry.name);
      mkdirSync(scope, { recursive: true });
      for (const scoped of readdirSync(source, { withFileTypes: true })) {
        if (scoped.isDirectory()) junctionPackage(path.join(source, scoped.name), path.join(scope, scoped.name));
      }
    } else if (entry.isDirectory() && entry.name !== "tailwindcss") {
      junctionPackage(source, path.join(isolatedNodeModules, entry.name));
    }
  }
  for (const name of ["src", "public", "package.json", "next.config.ts", "tsconfig.json", "postcss.config.mjs"]) {
    const source = path.join(root, name);
    assert.ok(existsSync(source), `Missing current source input: ${name}`);
    cpSync(source, path.join(buildDir, name), { recursive: true, dereference: false, force: true });
  }
  const result = spawnSync(process.execPath, [nextBin, "build"], { cwd: buildDir, env, encoding: "utf8", windowsHide: true, maxBuffer: 30 * 1024 * 1024 });
  const output = `${result.stdout || ""}\n${result.stderr || ""}`;
  const scrubbed = output.replace(/(sb_secret_[A-Za-z0-9_-]+|sb_publishable_[A-Za-z0-9_-]+)/g, "[redacted-key]");
  writeFileSync(path.join(demoRoot, "next-build.log"), scrubbed, "utf8");
  if (result.status !== 0) throw new Error(`Isolated owner-demo Next build failed (${result.status}). See ${path.join(demoRoot, "next-build.log")}`);
  process.stdout.write(output.replace(/sb_(?:secret|publishable)_[A-Za-z0-9_-]+/g, "[redacted-key]").split(/\r?\n/).slice(-35).join("\n") + "\n");
}

async function waitForGame() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/play`, { signal: AbortSignal.timeout(2000) });
      const html = await response.text();
      const visibleText = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>|<style\b[^>]*>[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ");
      if (response.ok && /HEALTHCLUES/i.test(visibleText) && /Opening your World|START ADVENTURE|Your Wellness Adventure Begins Here/i.test(visibleText) && !/This page could not be found|404\s*-\s*Page not found/i.test(visibleText)) return;
    } catch { /* wait for Next startup */ }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  throw new Error("The owner preview did not render /play. Check owner-demo-next.log.");
}

async function stopOwnedAppForRebuild() {
  if (await isPortFree(port)) return;
  assert.ok(existsSync(pidFile), `Game port ${port} is occupied without the isolated owner-demo PID record. Nothing was stopped.`);
  const pid = Number(readFileSync(pidFile, "utf8").trim());
  assert.ok(Number.isInteger(pid) && pid > 0, "The isolated owner-demo PID record is invalid. Nothing was stopped.");
  const check = spawnSync("powershell.exe", ["-NoProfile", "-Command", `(Get-CimInstance Win32_Process -Filter 'ProcessId = ${pid}').CommandLine`], { encoding: "utf8", windowsHide: true });
  const commandLine = check.stdout || "";
  assert.ok(commandLine.toLowerCase().includes(buildDir.toLowerCase()), "Refusing to stop a process that is not the recorded owner-demo build.");
  const stopped = spawnSync("powershell.exe", ["-NoProfile", "-Command", `Stop-Process -Id ${pid} -ErrorAction Stop`], { encoding: "utf8", windowsHide: true });
  assert.equal(stopped.status, 0, `Could not stop the verified owner-demo server PID ${pid}.`);
  for (let attempt = 0; attempt < 30 && !(await isPortFree(port)); attempt++) await new Promise(resolve => setTimeout(resolve, 200));
  assert.ok(await isPortFree(port), `Verified owner-demo PID ${pid} stopped, but game port ${port} remains occupied. Nothing else was stopped.`);
  writeFileSync(pidFile, "", "utf8");
  console.log(`Stopped only the verified owner-demo Next.js PID ${pid} before rebuild; local Supabase and its data remain running.`);
}

async function stop() {
  if (existsSync(pidFile)) {
    const pid = Number(readFileSync(pidFile, "utf8").trim());
    const cmd = `(Get-CimInstance Win32_Process -Filter 'ProcessId = ${pid}').CommandLine`;
    const check = spawnSync("powershell.exe", ["-NoProfile", "-Command", cmd], { encoding: "utf8", windowsHide: true });
    const commandLine = check.stdout || "";
    if (commandLine.trim()) {
      assert.ok(commandLine.toLowerCase().includes(buildDir.toLowerCase()), "Refusing to stop a process that cannot be verified as the owned HealthClues demo server.");
      spawnSync("powershell.exe", ["-NoProfile", "-Command", `Stop-Process -Id ${pid}`], { stdio: "ignore", windowsHide: true });
    } else console.log("The recorded owner-demo Next process is already stopped.");
    writeFileSync(pidFile, "", "utf8");
    console.log("Stopped the verified owner-demo Next.js process.");
  }
  const dockerEnv = { ...process.env, SUPABASE_TELEMETRY_DISABLED: "1", DOCKER_HOST: "npipe:////./pipe/dockerDesktopLinuxEngine", DOCKER_CONFIG: path.join(demoRoot, "docker-config") };
  const supabase = spawnSync(supabaseBin, ["stop", "--workdir", demoRoot], { cwd: root, env: dockerEnv, encoding: "utf8", windowsHide: true, maxBuffer: 10 * 1024 * 1024 });
  if (supabase.status === 0) console.log("Stopped only the healthclues-owner-demo Supabase project; its volume/data were preserved.");
  else console.log("Local demo Supabase was not running or could not be stopped; no other project was targeted.");
}

async function main() {
  if (isStop) return stop();
  if (!reuseExistingSupabase) initializeIsolatedWorkspace();
  if (isRebuild) await stopOwnedAppForRebuild();
  assert.ok(await isPortFree(port), `Game port ${port} is occupied. Nothing was stopped. Set HEALTHCLUES_OWNER_DEMO_PORT to an available port.`);
  let keys;
  if (reuseExistingSupabase) {
    keys = readSupabaseEnv();
    await verifyReusedLocalServices(keys);
  } else {
    await startServices();
    keys = readSupabaseEnv();
  }
  const buildEnv = safeAppEnv(keys);
  await buildApp(buildEnv);
  const runtimeEnv = privateAdvisorRuntimeEnv(buildEnv);
  if (!reuseExistingSupabase && await canExposeLocalFixtures()) seedLocalOwnerDemoContent();
  const logFile = path.join(demoRoot, "owner-demo-next.log");
  const logFd = openSync(logFile, "a");
  const server = spawn(process.execPath, [nextBin, "start", buildDir, "--hostname", "127.0.0.1", "--port", String(port)], { cwd: buildDir, env: runtimeEnv, detached: true, windowsHide: true, stdio: ["ignore", logFd, logFd] });
  server.unref();
  writeFileSync(pidFile, String(server.pid), "utf8");
  await waitForGame();
  console.log("\nHealthClues isolated authenticated owner demo is ready.");
  console.log(`Game: http://127.0.0.1:${port}/play`);
  console.log(`Local test inbox: ${inboxUrl}`);
  console.log("Auth + DB: isolated local Supabase at 127.0.0.1:54321 / 54322; confirmation required.");
  console.log(`Advisor provider: ${runtimeEnv.HEALTHCLUES_ADVISOR_PROVIDER === "gemini" && runtimeEnv.GEMINI_API_KEY ? "Gemini configured (server runtime only)" : runtimeEnv.HEALTHCLUES_ADVISOR_PROVIDER === "deterministic_demo" ? "explicit deterministic demo" : "unavailable (no private Gemini key configured)"}`);
  console.log("Persistent demo accounts/data remain in this dedicated Supabase project volume across restarts.");
  console.log(`Logs: ${demoRoot}`);
  process.exit(0);
}

main().catch(error => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
