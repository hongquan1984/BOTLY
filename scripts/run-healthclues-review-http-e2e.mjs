import assert from "node:assert/strict";
import { randomBytes, randomUUID, createHmac, timingSafeEqual } from "node:crypto";
import { execFileSync, spawn } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, unlinkSync, writeFileSync } from "node:fs";
import http from "node:http";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const appUrl = "http://127.0.0.1:3207";
const restUrl = "http://127.0.0.1:3001";
const supabaseUrl = "http://127.0.0.1:3002";
const expectedDatabase = "botly_restore_verification";
const testStartedAt = new Date().toISOString();
const databaseContainer = "botly-healthclues-db-e2e";
const discoveryReviewerMigration = path.join(root, "supabase", "migrations", "20261028170000_healthclues_discovery_reviewer_boundary.sql");
const quizBankMigration = path.join(root, "supabase", "migrations", "20261028180000_healthclues_quiz_bank_review.sql");
const sourceDraftMigration = path.join(root, "supabase", "migrations", "20261028190000_healthclues_boss_source_references.sql");
const worldEvolutionMigration = path.join(root, "supabase", "migrations", "20261028200000_healthclues_milestone_world_evolution.sql");
const bossCosmeticRewardMigration = path.join(root, "supabase", "migrations", "20261028210000_healthclues_boss_cosmetic_rewards.sql");
const cosmeticRewardConfigMigration = path.join(root, "supabase", "migrations", "20261028220000_healthclues_cosmetic_reward_configuration.sql");
const knowledgeCurrencyMigration = path.join(root, "supabase", "migrations", "20261028230000_healthclues_knowledge_currency_ledger.sql");
const dataDeletionMigration = path.join(root, "supabase", "migrations", "20261028240000_healthclues_data_deletion.sql");
const profileHistoryMigration = path.join(root, "supabase", "migrations", "20261028250000_healthclues_profile_history.sql");
const analyticsIngestionMigration = path.join(root, "supabase", "migrations", "20261028260000_analytics_service_ingestion_only.sql");
const adminAnalyticsRpcMigration = path.join(root, "supabase", "migrations", "20261028270000_admin_analytics_service_only.sql");
const postgrestContainer = "botly-healthclues-postgrest-e2e";
const forwarderContainer = "botly-healthclues-pg-forward-cli";
const testNetwork = "botly-healthclues-e2e-20261027";
const markerPath = path.join(root, ".tmp", "healthclues-e2e-app.json");
const buildParent = path.join(root, ".tmp");
const buildRoot = mkdtempSync(path.join(buildParent, "healthclues-review-build-"));
let buildPassed = false;
const sensitiveName = name => /^(SUPABASE_|NEXT_PUBLIC_SUPABASE_|EBOOK_ADMIN_TOKEN$|DATABASE_URL$|PGHOST$|PGPORT$|PGUSER$|PGPASSWORD$|HC_E2E_)/i.test(name)
  || /(^|_)(API_KEY|ACCESS_KEY|SECRET(?:_KEY)?|TOKEN|PASSWORD|PRIVATE_KEY|CLIENT_SECRET|DATABASE_URL)$/i.test(name)
  || /^(RESEND_API_KEY|EMAIL_FROM|ENABLE_REAL_EMAIL_DISPATCH|SMTP_)/i.test(name);
const dotenvSensitiveNames = new Set();
for (const filename of [".env.production.local", ".env.local", ".env.production", ".env", ".env.development.local", ".env.development"]) {
  const filepath = path.join(root, filename);
  if (!existsSync(filepath)) continue;
  for (const line of readFileSync(filepath, "utf8").split(/\r?\n/)) {
    const match = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=/.exec(line);
    if (match && sensitiveName(match[1])) dotenvSensitiveNames.add(match[1]);
  }
}

function inspect(name) {
  return JSON.parse(execFileSync("docker", ["inspect", name], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }))[0];
}

function envValue(container, name) {
  const prefix = `${name}=`;
  const entry = container.Config.Env.find(value => value.startsWith(prefix));
  if (!entry) throw new Error(`E2E blocked: ${name} missing from the verified test container`);
  return entry.slice(prefix.length);
}

function loopbackBinding(container, port) {
  const bindings = container.HostConfig.PortBindings?.[`${port}/tcp`] ?? [];
  return bindings.length === 1 && bindings[0].HostIp === "127.0.0.1";
}

function signedJwt(secret, role) {
  const encode = value => Buffer.from(JSON.stringify(value)).toString("base64url");
  const header = encode({ alg: "HS256", typ: "JWT" });
  const now = Math.floor(Date.now() / 1000);
  const claims = encode({ role, iss: "healthclues-e2e", iat: now, exp: now + 3600 });
  const input = `${header}.${claims}`;
  return `${input}.${createHmac("sha256", secret).update(input).digest("base64url")}`;
}

function assertPortFree(port) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", () => reject(new Error(`E2E blocked: loopback port ${port} is already in use`)));
    server.listen(port, "127.0.0.1", () => server.close(resolve));
  });
}

async function waitForApp(child) {
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error("E2E app exited before becoming ready");
    try {
      const response = await fetch(appUrl, { signal: AbortSignal.timeout(1500) });
      if (response.ok) return;
    } catch { /* Keep waiting while the loopback-only test app starts. */ }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  throw new Error("E2E app did not become ready on its allowlisted loopback origin");
}

const db = inspect(databaseContainer);
const postgrest = inspect(postgrestContainer);
const forwarder = inspect(forwarderContainer);
assert.equal(db.Config.Image, "supabase/postgres:17.6.1.068", "unexpected test PostgreSQL image");
assert.ok(db.NetworkSettings.Networks[testNetwork], "test PostgreSQL is outside the dedicated test network");
assert.equal(Object.keys(db.HostConfig.PortBindings ?? {}).length, 0, "test PostgreSQL must not publish a host port");
assert.equal(postgrest.Config.Image, "postgrest/postgrest:v16.4", "unexpected PostgREST test image");
assert.ok(postgrest.NetworkSettings.Networks[testNetwork], "PostgREST is outside the dedicated test network");
assert.ok(loopbackBinding(postgrest, 3000), "PostgREST must bind only to loopback");
assert.equal(postgrest.HostConfig.PortBindings["3000/tcp"][0].HostPort, "3001", "PostgREST host port mismatch");
assert.equal(forwarder.Config.Image, "alpine/socat", "unexpected PostgreSQL forwarder image");
assert.ok(forwarder.NetworkSettings.Networks[testNetwork], "PostgreSQL forwarder is outside the test network");
assert.ok(loopbackBinding(forwarder, 5434), "PostgreSQL forwarder must bind only to loopback");
assert.equal(forwarder.HostConfig.PortBindings["5434/tcp"][0].HostPort, "5434", "PostgreSQL forwarder host port mismatch");
assert.ok(forwarder.Config.Cmd.includes("TCP:botly-healthclues-db-e2e:5432"), "forwarder target mismatch");

const postgrestDbUri = new URL(envValue(postgrest, "PGRST_DB_URI"));
assert.equal(postgrestDbUri.hostname, "botly-hc-db", "PostgREST DB host mismatch");
assert.equal(postgrestDbUri.pathname, `/${expectedDatabase}`, "PostgREST database mismatch");
assert.equal(postgrestDbUri.username, "authenticator", "PostgREST database role mismatch");
const jwtSecret = envValue(postgrest, "PGRST_JWT_SECRET");
assert.ok(jwtSecret.length >= 32, "test PostgREST JWT secret is invalid");

const databaseUrl = new URL(postgrestDbUri);
databaseUrl.protocol = "postgresql:";
databaseUrl.hostname = "127.0.0.1";
databaseUrl.port = "5434";
databaseUrl.searchParams.set("sslmode", "disable");
const dbIdentity = await import("pg").then(async ({ default: pg }) => {
  const client = new pg.Client({ connectionString: databaseUrl.toString(), connectionTimeoutMillis: 3000 });
  await client.connect();
  try {
    const result = await client.query("SELECT current_database() AS db, current_user AS role, current_setting('server_version') AS version, inet_server_addr()::text AS address");
    return result.rows[0];
  } finally { await client.end(); }
});
assert.equal(dbIdentity.db, expectedDatabase, "test database identity mismatch");
assert.equal(dbIdentity.role, "authenticator", "unexpected PostgreSQL login role");
assert.ok(dbIdentity.version.startsWith("17.6"), "test PostgreSQL version mismatch");
assert.match(dbIdentity.address, /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/, "database resolved outside private Docker networking");

const testSecretKey = signedJwt(jwtSecret, "service_role");
const testAnonKey = signedJwt(jwtSecret, "anon");
const adminToken = `hc-e2e:${randomBytes(32).toString("base64url")}`;
const reviewerToken = `hc-e2e-reviewer:${randomBytes(32).toString("base64url")}`;
const restPreflight = await fetch(`${restUrl}/healthclues_discovery_content?select=id&limit=0`, {
  headers: { apikey: testSecretKey, Authorization: `Bearer ${testSecretKey}` },
  signal: AbortSignal.timeout(5000),
});
assert.equal(restPreflight.status, 200, "PostgREST does not expose the verified test database schema");

await assertPortFree(3002);
await assertPortFree(3207);

const proxy = http.createServer((incoming, outgoing) => {
  if (incoming.url === "/auth/v1/user" && incoming.method === "GET") {
    const token = incoming.headers.authorization?.match(/^Bearer\s+(.+)$/i)?.[1] ?? "";
    const parts = token.split(".");
    if (parts.length !== 3) { outgoing.writeHead(401); outgoing.end(); return; }
    try {
      const input = `${parts[0]}.${parts[1]}`;
      const expected = createHmac("sha256", jwtSecret).update(input).digest();
      const supplied = Buffer.from(parts[2], "base64url");
      const claims = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
      if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)
          || claims.role !== "authenticated" || !claims.sub || !/^[0-9a-f-]{36}$/i.test(claims.sub)
          || !claims.exp || claims.exp < Math.floor(Date.now() / 1000)) {
        outgoing.writeHead(401); outgoing.end(); return;
      }
      outgoing.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-store" });
      outgoing.end(JSON.stringify({ id: claims.sub }));
      return;
    } catch {
      outgoing.writeHead(401); outgoing.end(); return;
    }
  }
  const upstreamPath = incoming.url.replace(/^\/rest\/v1/, "") || "/";
  const upstream = http.request({ hostname: "127.0.0.1", port: 3001, method: incoming.method, path: upstreamPath,
    headers: { ...incoming.headers, host: "127.0.0.1:3001" } }, response => {
    outgoing.writeHead(response.statusCode ?? 502, response.headers);
    response.pipe(outgoing);
  });
  upstream.on("error", () => { outgoing.writeHead(502); outgoing.end(); });
  incoming.pipe(upstream);
});

let app;
let appExited;
let catalogResetStarted = false;
let catalogSnapshotSql;
let catalogSnapshotState;
let quizBankSnapshotSql;
let quizBankSnapshotState;
let quizBankResetStarted = false;
const appExit = new Promise(resolve => { appExited = resolve; });
proxy.listen(3002, "127.0.0.1");
const startedAt = Date.now();
const marker = { pid: process.pid, startedAt, appUrl, restUrl, supabaseUrl, database: expectedDatabase,
  postgresContainer: databaseContainer, postgrestContainer, network: testNetwork, externalSideEffectsDisabled: true };
writeFileSync(markerPath, JSON.stringify(marker));

try {
  const serviceJwt = testSecretKey;
  const publishableJwt = testAnonKey;
  const appEnv = Object.fromEntries(Object.entries(process.env).filter(([name]) => !sensitiveName(name)));
  for (const name of dotenvSensitiveNames) appEnv[name] = "";
  Object.assign(appEnv, {
    SUPABASE_URL: supabaseUrl,
    NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
    SUPABASE_SECRET_KEY: serviceJwt,
    SUPABASE_SERVICE_ROLE_KEY: serviceJwt,
    SUPABASE_PUBLISHABLE_KEY: publishableJwt,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: publishableJwt,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: publishableJwt,
    NEXT_PUBLIC_SITE_URL: appUrl,
    EBOOK_ADMIN_TOKEN: adminToken,
    HEALTHCLUES_REVIEWER_TOKEN: reviewerToken,
    RESEND_API_KEY: "",
    EMAIL_FROM: "",
    ENABLE_REAL_EMAIL_DISPATCH: "false",
    NODE_ENV: "production",
  });
  appEnv.HEALTHCLUES_TURBOPACK_ROOT = root;
  assert.equal(appEnv.ENABLE_REAL_EMAIL_DISPATCH, "false", "real email dispatch must be disabled in test app");
  assert.equal(appEnv.RESEND_API_KEY, "", "production email provider credential must not reach test app");
  const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next");
  for (const name of ["src", "public", "package.json", "next.config.ts", "tsconfig.json", "postcss.config.mjs"]) {
    const source = path.join(root, name);
    assert.ok(existsSync(source), `Missing isolated E2E build input: ${name}`);
    cpSync(source, path.join(buildRoot, name), { recursive: true, dereference: false });
  }
  execFileSync(process.execPath, [nextBin, "build"], { cwd: buildRoot, env: appEnv, stdio: "inherit", windowsHide: true });
  buildPassed = true;
  app = spawn(process.execPath, [nextBin, "start", "--hostname", "127.0.0.1", "--port", "3207"], {
    cwd: buildRoot, env: appEnv, stdio: "inherit", windowsHide: true,
  });
  app.once("exit", code => appExited(code ?? 1));
  await waitForApp(app);

  const reviewerMigrationPath = "/tmp/20261028170000_healthclues_discovery_reviewer_boundary.sql";
  execFileSync("docker", ["cp", discoveryReviewerMigration, `${databaseContainer}:${reviewerMigrationPath}`], { stdio: ["ignore", "ignore", "pipe"] });
  execFileSync("docker", ["exec", databaseContainer, "sh", "-lc", `PGPASSWORD="$POSTGRES_PASSWORD" psql -h 127.0.0.1 -U supabase_admin -d ${expectedDatabase} -v ON_ERROR_STOP=1 -f ${reviewerMigrationPath}`], { stdio: ["ignore", "ignore", "pipe"] });
  const quizBankMigrationPath = "/tmp/20261028180000_healthclues_quiz_bank_review.sql";
  execFileSync("docker", ["cp", quizBankMigration, `${databaseContainer}:${quizBankMigrationPath}`], { stdio: ["ignore", "ignore", "pipe"] });
  execFileSync("docker", ["exec", databaseContainer, "sh", "-lc", `PGPASSWORD="$POSTGRES_PASSWORD" psql -h 127.0.0.1 -U supabase_admin -d ${expectedDatabase} -v ON_ERROR_STOP=1 -f ${quizBankMigrationPath}`], { stdio: ["ignore", "ignore", "pipe"] });
  const sourceDraftMigrationPath = "/tmp/20261028190000_healthclues_boss_source_references.sql";
  execFileSync("docker", ["cp", sourceDraftMigration, `${databaseContainer}:${sourceDraftMigrationPath}`], { stdio: ["ignore", "ignore", "pipe"] });
  execFileSync("docker", ["exec", databaseContainer, "sh", "-lc", `PGPASSWORD="$POSTGRES_PASSWORD" psql -h 127.0.0.1 -U supabase_admin -d ${expectedDatabase} -v ON_ERROR_STOP=1 -f ${sourceDraftMigrationPath}`], { stdio: ["ignore", "ignore", "pipe"] });
  const worldEvolutionMigrationPath = "/tmp/20261028200000_healthclues_milestone_world_evolution.sql";
  execFileSync("docker", ["cp", worldEvolutionMigration, `${databaseContainer}:${worldEvolutionMigrationPath}`], { stdio: ["ignore", "ignore", "pipe"] });
  execFileSync("docker", ["exec", databaseContainer, "sh", "-lc", `PGPASSWORD="$POSTGRES_PASSWORD" psql -h 127.0.0.1 -U supabase_admin -d ${expectedDatabase} -v ON_ERROR_STOP=1 -f ${worldEvolutionMigrationPath}`], { stdio: ["ignore", "ignore", "pipe"] });
  const bossCosmeticRewardMigrationPath = "/tmp/20261028210000_healthclues_boss_cosmetic_rewards.sql";
  execFileSync("docker", ["cp", bossCosmeticRewardMigration, `${databaseContainer}:${bossCosmeticRewardMigrationPath}`], { stdio: ["ignore", "ignore", "pipe"] });
  execFileSync("docker", ["exec", databaseContainer, "sh", "-lc", `PGPASSWORD="$POSTGRES_PASSWORD" psql -h 127.0.0.1 -U supabase_admin -d ${expectedDatabase} -v ON_ERROR_STOP=1 -f ${bossCosmeticRewardMigrationPath}`], { stdio: ["ignore", "ignore", "pipe"] });
  const cosmeticRewardConfigMigrationPath = "/tmp/20261028220000_healthclues_cosmetic_reward_configuration.sql";
  execFileSync("docker", ["cp", cosmeticRewardConfigMigration, `${databaseContainer}:${cosmeticRewardConfigMigrationPath}`], { stdio: ["ignore", "ignore", "pipe"] });
  execFileSync("docker", ["exec", databaseContainer, "sh", "-lc", `PGPASSWORD="$POSTGRES_PASSWORD" psql -h 127.0.0.1 -U supabase_admin -d ${expectedDatabase} -v ON_ERROR_STOP=1 -f ${cosmeticRewardConfigMigrationPath}`], { stdio: ["ignore", "ignore", "pipe"] });
  const knowledgeCurrencyMigrationPath = "/tmp/20261028230000_healthclues_knowledge_currency_ledger.sql";
  execFileSync("docker", ["cp", knowledgeCurrencyMigration, `${databaseContainer}:${knowledgeCurrencyMigrationPath}`], { stdio: ["ignore", "ignore", "pipe"] });
  execFileSync("docker", ["exec", databaseContainer, "sh", "-lc", `PGPASSWORD="$POSTGRES_PASSWORD" psql -h 127.0.0.1 -U supabase_admin -d ${expectedDatabase} -v ON_ERROR_STOP=1 -f ${knowledgeCurrencyMigrationPath}`], { stdio: ["ignore", "ignore", "pipe"] });
  const dataDeletionMigrationPath = "/tmp/20261028240000_healthclues_data_deletion.sql";
  execFileSync("docker", ["cp", dataDeletionMigration, `${databaseContainer}:${dataDeletionMigrationPath}`], { stdio: ["ignore", "ignore", "pipe"] });
  execFileSync("docker", ["exec", databaseContainer, "sh", "-lc", `PGPASSWORD="$POSTGRES_PASSWORD" psql -h 127.0.0.1 -U supabase_admin -d ${expectedDatabase} -v ON_ERROR_STOP=1 -f ${dataDeletionMigrationPath}`], { stdio: ["ignore", "ignore", "pipe"] });
  const profileHistoryMigrationPath = "/tmp/20261028250000_healthclues_profile_history.sql";
  execFileSync("docker", ["cp", profileHistoryMigration, `${databaseContainer}:${profileHistoryMigrationPath}`], { stdio: ["ignore", "ignore", "pipe"] });
  execFileSync("docker", ["exec", databaseContainer, "sh", "-lc", `PGPASSWORD="$POSTGRES_PASSWORD" psql -h 127.0.0.1 -U supabase_admin -d ${expectedDatabase} -v ON_ERROR_STOP=1 -f ${profileHistoryMigrationPath}`], { stdio: ["ignore", "ignore", "pipe"] });
  const analyticsIngestionMigrationPath = "/tmp/20261028260000_analytics_service_ingestion_only.sql";
  execFileSync("docker", ["cp", analyticsIngestionMigration, `${databaseContainer}:${analyticsIngestionMigrationPath}`], { stdio: ["ignore", "ignore", "pipe"] });
  execFileSync("docker", ["exec", databaseContainer, "sh", "-lc", `PGPASSWORD="$POSTGRES_PASSWORD" psql -h 127.0.0.1 -U supabase_admin -d ${expectedDatabase} -v ON_ERROR_STOP=1 -f ${analyticsIngestionMigrationPath}`], { stdio: ["ignore", "ignore", "pipe"] });
  const adminAnalyticsRpcMigrationPath = "/tmp/20261028270000_admin_analytics_service_only.sql";
  execFileSync("docker", ["cp", adminAnalyticsRpcMigration, `${databaseContainer}:${adminAnalyticsRpcMigrationPath}`], { stdio: ["ignore", "ignore", "pipe"] });
  execFileSync("docker", ["exec", databaseContainer, "sh", "-lc", `PGPASSWORD="$POSTGRES_PASSWORD" psql -h 127.0.0.1 -U supabase_admin -d ${expectedDatabase} -v ON_ERROR_STOP=1 -f ${adminAnalyticsRpcMigrationPath}`], { stdio: ["ignore", "ignore", "pipe"] });
  execFileSync("docker", ["restart", postgrestContainer], { stdio: ["ignore", "pipe", "pipe"] });
  const quizSchemaDeadline = Date.now() + 30_000;
  let quizSchemaReady = false;
  while (Date.now() < quizSchemaDeadline) {
    try {
      const response = await fetch(new URL("/healthclues_quiz_bank_versions?select=version&limit=0", restUrl), { headers: { apikey: testSecretKey, Authorization: `Bearer ${testSecretKey}` }, signal: AbortSignal.timeout(1500) });
      if (response.ok) { quizSchemaReady = true; break; }
    } catch { /* Wait for PostgREST to reload the isolated database schema. */ }
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  assert.equal(quizSchemaReady, true, "PostgREST reloads the versioned Quiz bank migration");
  quizBankSnapshotSql = execFileSync("docker", ["exec", databaseContainer, "pg_dump", "-U", "postgres", "-d", expectedDatabase,
    "--data-only", "--column-inserts", "--table=public.healthclues_quiz_bank_versions", "--table=public.healthclues_quiz_bank_audit"],
  { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  quizBankSnapshotState = execFileSync("docker", ["exec", databaseContainer, "psql", "-U", "postgres", "-d", expectedDatabase,
    "-v", "ON_ERROR_STOP=1", "-At", "-c", "SELECT (SELECT count(*) FROM public.healthclues_quiz_bank_versions) || '|' || (SELECT count(*) FROM public.healthclues_quiz_bank_audit) || '|' || coalesce((SELECT version::text FROM public.healthclues_quiz_bank_versions WHERE status='published'),'0')"],
  { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  quizBankResetStarted = true;
  execFileSync("docker", ["exec", databaseContainer, "sh", "-lc", `PGPASSWORD="$POSTGRES_PASSWORD" psql -h 127.0.0.1 -U supabase_admin -d ${expectedDatabase} -v ON_ERROR_STOP=1 -c "TRUNCATE public.healthclues_quiz_bank_audit, public.healthclues_quiz_bank_versions RESTART IDENTITY CASCADE;"`], { stdio: ["ignore", "ignore", "pipe"] });

  for (const route of [
    "/en/wellness/healthclues/quiz?source=ebook&entry=hero",
    "/en/wellness/healthclues/dashboard",
    "/en/wellness/ebooks",
    "/en/wellness/ebooks/everyday-food-wellness",
    "/en/wellness/ebooks/food-everyday-wellness-evidence",
  ]) {
    const response = await fetch(new URL(route, appUrl), { signal: AbortSignal.timeout(10_000) });
    assert.equal(response.status, 200, `release route smoke failed: ${route}`);
    assert.match(response.headers.get("content-type") ?? "", /text\/html/, `expected HTML for ${route}`);
  }

  for (const endpoint of ["/api/event-ping", "/api/analytics/track"]) {
    const response = await fetch(new URL(endpoint, appUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event_type: "quiz_started", path: "/en/wellness/healthclues/quiz?concern=private", metadata: { quest_id: "sleep-better", answer: "private" }, referrer: "https://example.test/private-health-context" }),
    });
    assert.equal(response.status, 200, `${endpoint} safely acknowledges an unconsented HealthClues analytics event`);
    assert.equal((await response.json()).ignored, true, `${endpoint} rejects direct HealthClues analytics without the explicit consent cookie`);
    const unsupported = await fetch(new URL(endpoint, appUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: "botly_analytics_consent=granted" },
      body: JSON.stringify({ event_type: "quiz_answer_submitted", path: "/en/wellness/healthclues/quiz", metadata: { answer: "private" } }),
    });
    assert.equal((await unsupported.json()).ignored, true, `${endpoint} rejects answer-level events even when consent is present`);
  }
  const directAnalyticsProbe = `hc-anon-write-${randomUUID()}`;
  const directAnalyticsWrite = await fetch(new URL("/analytics_events", restUrl), {
    method: "POST",
    headers: { apikey: testAnonKey, Authorization: `Bearer ${testAnonKey}`, "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify({ event_type: "page_view", path: "/en/wellness/healthclues/quiz", visitor_id: directAnalyticsProbe, metadata: { answer: "private" } }),
  });
  assert.ok(!directAnalyticsWrite.ok, "anon Supabase role cannot bypass server consent/sanitization with a direct analytics_events write");
  const directAnalyticsCheck = await fetch(new URL(`/analytics_events?visitor_id=eq.${directAnalyticsProbe}&select=id`, restUrl), {
    headers: { apikey: testSecretKey, Authorization: `Bearer ${testSecretKey}` },
  });
  assert.equal(directAnalyticsCheck.ok, true, "service-only verifier can inspect the isolated analytics fixture");
  assert.deepEqual(await directAnalyticsCheck.json(), [], "rejected direct anonymous analytics write did not persist");
  for (const caller of [testAnonKey, signedJwt(jwtSecret, "authenticated")]) {
    const rpc = await fetch(new URL("/rpc/get_admin_analytics", restUrl), {
      method: "POST",
      headers: { apikey: testAnonKey, Authorization: `Bearer ${caller}`, "Content-Type": "application/json" },
      body: JSON.stringify({ p_days: 1 }),
    });
    assert.ok(!rpc.ok, `anonymous/authenticated Supabase callers cannot execute get_admin_analytics directly (status ${rpc.status})`);
  }
  const protectedAnalytics = await fetch(new URL("/api/admin/analytics?days=1", appUrl), { headers: { Authorization: `Bearer ${adminToken}` } });
  assert.equal(protectedAnalytics.status, 200, "existing Botly admin analytics API retains service-role RPC access");
  assert.equal((await protectedAnalytics.json()).ok, true, "protected Botly analytics response remains usable after RPC ACL hardening");

  catalogSnapshotSql = execFileSync("docker", ["exec", databaseContainer, "pg_dump", "-U", "postgres", "-d", expectedDatabase,
    "--data-only", "--column-inserts", "--table=public.healthclues_discovery_content", "--table=public.healthclues_review_audit"],
  { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  catalogSnapshotState = execFileSync("docker", ["exec", databaseContainer, "psql", "-U", "postgres", "-d", expectedDatabase,
    "-v", "ON_ERROR_STOP=1", "-At", "-c",
    "SELECT count(*) || '|' || count(*) FILTER (WHERE review_status='needs_review' AND status='draft') || '|' || count(*) FILTER (WHERE status='published') || '|' || (SELECT count(*) FROM public.healthclues_review_audit WHERE action='submitted') FROM public.healthclues_discovery_content;"],
  { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  catalogResetStarted = true;
  execFileSync("docker", ["exec", databaseContainer, "psql", "-U", "postgres", "-d", expectedDatabase,
    "-v", "ON_ERROR_STOP=1", "-c", "TRUNCATE public.healthclues_review_audit, public.healthclues_discovery_content CASCADE;"],
  { stdio: ["ignore", "ignore", "pipe"] });

  const suiteEnv = Object.fromEntries(Object.entries(process.env).filter(([name]) => !sensitiveName(name)));
  suiteEnv.HEALTHCLUES_REVIEWER_TOKEN = reviewerToken;
  Object.assign(suiteEnv, {
    HC_E2E_APP_URL: appUrl,
    HC_E2E_REST_URL: restUrl,
    HC_E2E_DB_URL: databaseUrl.toString(),
    HC_E2E_EXPECTED_DB: expectedDatabase,
    HC_E2E_ADMIN_TOKEN: adminToken,
    HC_E2E_REVIEWER_TOKEN: reviewerToken,
    HC_E2E_JWT_SECRET: jwtSecret,
    HC_E2E_RUNNER_PID: String(process.pid),
  });
  const suite = spawn(process.execPath, [path.join(root, "scripts", "test-healthclues-review-http-e2e.mjs")], {
    cwd: root, env: suiteEnv, stdio: "inherit", windowsHide: true,
  });
  const exitCode = await new Promise((resolve, reject) => {
    suite.once("error", reject);
    suite.once("exit", code => resolve(code ?? 1));
  });
  assert.equal(exitCode, 0, "HealthClues HTTP E2E suite failed");
} finally {
  let cleanupError;
  try {
    const smokePagePaths = [
      "/en/wellness/ebooks/everyday-food-wellness",
      "/en/wellness/ebooks/food-everyday-wellness-evidence",
    ];
    const sqlTimestamp = testStartedAt.replaceAll("'", "''");
    const sqlPaths = smokePagePaths.map(value => `'${value.replaceAll("'", "''")}'`).join(",");
    execFileSync("docker", ["exec", databaseContainer, "psql", "-U", "postgres", "-d", expectedDatabase,
      "-v", "ON_ERROR_STOP=1", "-c",
      `DELETE FROM public.ebook_page_views WHERE created_at >= '${sqlTimestamp}'::timestamptz AND source_page IN (${sqlPaths});`],
    { stdio: ["ignore", "ignore", "pipe"] });
    // The suite deliberately publishes/deactivates catalog fixtures. Restore the
    // isolated database to the pending seed state so a test item cannot leak
    // into later local/test sessions as an active recommendation.
    if (catalogResetStarted) {
      execFileSync("docker", ["exec", databaseContainer, "psql", "-U", "postgres", "-d", expectedDatabase,
        "-v", "ON_ERROR_STOP=1", "-c", "TRUNCATE public.healthclues_review_audit, public.healthclues_discovery_content CASCADE;"],
      { stdio: ["ignore", "ignore", "pipe"] });
      const restoreResponse = await fetch(new URL("/api/admin/healthclues-discoveries", appUrl), {
        method: "POST",
        headers: { Authorization: `Bearer ${reviewerToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ action: "import_static_candidates", confirmPendingImport: true }),
        signal: AbortSignal.timeout(15_000),
      });
      assert.equal(restoreResponse.status, 200, "test catalog pending-state restore failed");
      const restored = await restoreResponse.json();
      assert.equal(restored.candidateCount, 17, "unexpected static candidate count after test cleanup");
      assert.equal(restored.insertedCount, 17, "not all static candidates returned to the pending state");
      const finalState = execFileSync("docker", ["exec", databaseContainer, "psql", "-U", "postgres", "-d", expectedDatabase,
        "-v", "ON_ERROR_STOP=1", "-At", "-c",
        "SELECT count(*) || '|' || count(*) FILTER (WHERE review_status='needs_review' AND status='draft') || '|' || count(*) FILTER (WHERE status='published') || '|' || (SELECT count(*) FROM public.healthclues_review_audit WHERE action='submitted') FROM public.healthclues_discovery_content;"],
      { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
      assert.equal(finalState, "17|17|0|17", "test catalog was not restored to 17 pending/draft seeds with no active content");
      console.log("Isolated E2E cleanup passed: 17 static candidates restored to needs_review/draft; no active item remains.");
    }
    if (quizBankResetStarted && quizBankSnapshotSql !== undefined) {
      execFileSync("docker", ["exec", databaseContainer, "sh", "-lc", `PGPASSWORD="$POSTGRES_PASSWORD" psql -h 127.0.0.1 -U supabase_admin -d ${expectedDatabase} -v ON_ERROR_STOP=1 -c "TRUNCATE public.healthclues_quiz_bank_audit, public.healthclues_quiz_bank_versions RESTART IDENTITY CASCADE;"`], { stdio: ["ignore", "ignore", "pipe"] });
      execFileSync("docker", ["exec", "-i", databaseContainer, "sh", "-lc", `PGPASSWORD="$POSTGRES_PASSWORD" psql -h 127.0.0.1 -U supabase_admin -d ${expectedDatabase} -v ON_ERROR_STOP=1`], { input: quizBankSnapshotSql, stdio: ["pipe", "ignore", "pipe"] });
      const restoredQuizState = execFileSync("docker", ["exec", databaseContainer, "psql", "-U", "postgres", "-d", expectedDatabase, "-v", "ON_ERROR_STOP=1", "-At", "-c", "SELECT (SELECT count(*) FROM public.healthclues_quiz_bank_versions) || '|' || (SELECT count(*) FROM public.healthclues_quiz_bank_audit) || '|' || coalesce((SELECT version::text FROM public.healthclues_quiz_bank_versions WHERE status='published'),'0')"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
      assert.equal(restoredQuizState, quizBankSnapshotState, "isolated Quiz bank state was restored exactly after HTTP E2E");
      console.log("Isolated E2E cleanup passed: prior Quiz bank version and audit state restored.");
    }
  } catch (error) {
    cleanupError = error;
    if (catalogResetStarted && catalogSnapshotSql !== undefined) {
      try {
        execFileSync("docker", ["exec", databaseContainer, "psql", "-U", "postgres", "-d", expectedDatabase,
          "-v", "ON_ERROR_STOP=1", "-c", "TRUNCATE public.healthclues_review_audit, public.healthclues_discovery_content CASCADE;"],
        { stdio: ["ignore", "ignore", "pipe"] });
        execFileSync("docker", ["exec", "-i", databaseContainer, "psql", "-U", "postgres", "-d", expectedDatabase,
          "-v", "ON_ERROR_STOP=1"],
        { input: catalogSnapshotSql, stdio: ["pipe", "ignore", "pipe"] });
        const restoredState = execFileSync("docker", ["exec", databaseContainer, "psql", "-U", "postgres", "-d", expectedDatabase,
          "-v", "ON_ERROR_STOP=1", "-At", "-c",
          "SELECT count(*) || '|' || count(*) FILTER (WHERE review_status='needs_review' AND status='draft') || '|' || count(*) FILTER (WHERE status='published') || '|' || (SELECT count(*) FROM public.healthclues_review_audit WHERE action='submitted') FROM public.healthclues_discovery_content;"],
        { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
        assert.equal(restoredState, catalogSnapshotState, "test catalog snapshot fallback did not restore the pre-test state");
      } catch (restoreError) {
        cleanupError = new AggregateError([error, restoreError], "E2E cleanup failed and the isolated catalog snapshot fallback could not restore the test DB");
      }
    }
    if (quizBankResetStarted && quizBankSnapshotSql !== undefined) {
      try {
        execFileSync("docker", ["exec", databaseContainer, "sh", "-lc", `PGPASSWORD="$POSTGRES_PASSWORD" psql -h 127.0.0.1 -U supabase_admin -d ${expectedDatabase} -v ON_ERROR_STOP=1 -c "TRUNCATE public.healthclues_quiz_bank_audit, public.healthclues_quiz_bank_versions RESTART IDENTITY CASCADE;"`], { stdio: ["ignore", "ignore", "pipe"] });
        execFileSync("docker", ["exec", "-i", databaseContainer, "sh", "-lc", `PGPASSWORD="$POSTGRES_PASSWORD" psql -h 127.0.0.1 -U supabase_admin -d ${expectedDatabase} -v ON_ERROR_STOP=1`], { input: quizBankSnapshotSql, stdio: ["pipe", "ignore", "pipe"] });
      } catch (restoreError) { cleanupError = new AggregateError([cleanupError, restoreError], "E2E cleanup failed and could not restore the isolated Quiz bank snapshot"); }
    }
  }
  if (app && app.exitCode === null) {
    app.kill("SIGINT");
    await Promise.race([appExit, new Promise(resolve => setTimeout(resolve, 10_000))]);
  }
  if (buildPassed) {
    try {
      const relative = path.relative(buildParent, path.resolve(buildRoot));
      if (!relative.startsWith("healthclues-review-build-") || relative.includes("..") || path.isAbsolute(relative)) throw new Error("Refusing E2E cleanup outside this run's build workspace.");
      if (existsSync(buildRoot)) rmSync(buildRoot, { recursive: true, force: true });
    } catch (error) { cleanupError ??= error; }
  }
  proxy.closeAllConnections?.();
  await new Promise(resolve => proxy.close(resolve));
  if (existsSync(markerPath)) unlinkSync(markerPath);
  if (cleanupError) throw cleanupError;
}
