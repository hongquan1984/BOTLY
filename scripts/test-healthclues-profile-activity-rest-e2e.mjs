import assert from 'node:assert/strict';
import { createHmac, randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const postgrestContainer = 'botly-healthclues-postgrest-e2e';
const databaseContainer = 'botly-healthclues-db-e2e';
const networkName = 'botly-healthclues-e2e-20261027';
const databaseName = 'botly_restore_verification';
const origin = 'http://127.0.0.1:3001';

function inspect(name) {
  return JSON.parse(execFileSync('docker', ['inspect', name], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }))[0];
}

function containerEnv(container, name) {
  const entry = container.Config.Env.find(value => value.startsWith(`${name}=`));
  if (!entry) throw new Error(`Test E2E blocked: ${name} is missing from the verified container.`);
  return entry.slice(name.length + 1);
}

function signJwt(secret, role, sub) {
  const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const header = encode({ alg: 'HS256', typ: 'JWT' });
  const claims = encode({ role, aud: role, iss: 'healthclues-e2e', ...(sub ? { sub } : {}), iat: now, exp: now + 600 });
  const input = `${header}.${claims}`;
  return `${input}.${createHmac('sha256', secret).update(input).digest('base64url')}`;
}

const postgrest = inspect(postgrestContainer);
const db = inspect(databaseContainer);
assert.equal(postgrest.Config.Image, 'postgrest/postgrest:v16.4');
assert.equal(db.Config.Image, 'supabase/postgres:17.6.1.068');
assert.ok(postgrest.State.Running && db.State.Running, 'verified test containers must be running');
assert.ok(postgrest.NetworkSettings.Networks[networkName], 'PostgREST must be in the dedicated E2E network');
assert.ok(db.NetworkSettings.Networks[networkName], 'database must be in the dedicated E2E network');
assert.equal(Object.keys(db.HostConfig.PortBindings ?? {}).length, 0, 'test database must not expose a host port');
const bindings = postgrest.HostConfig.PortBindings?.['3000/tcp'] ?? [];
assert.equal(bindings.length, 1);
assert.equal(bindings[0].HostIp, '127.0.0.1');
assert.equal(bindings[0].HostPort, '3001');
const dbUri = new URL(containerEnv(postgrest, 'PGRST_DB_URI'));
assert.equal(dbUri.hostname, 'botly-hc-db');
assert.equal(dbUri.pathname, `/${databaseName}`);
assert.equal(dbUri.username, 'authenticator');
const jwtSecret = containerEnv(postgrest, 'PGRST_JWT_SECRET');
assert.ok(jwtSecret.length >= 32);
assert.equal(origin, 'http://127.0.0.1:3001');

const anonKey = signJwt(jwtSecret, 'anon');
const firstId = randomUUID();
const secondId = randomUUID();
const suffix = randomUUID();
const firstUserJwt = signJwt(jwtSecret, 'authenticated', firstId);
const secondUserJwt = signJwt(jwtSecret, 'authenticated', secondId);
const tempDir = mkdtempSync(path.join(root, '.tmp', 'healthclues-profile-e2e-'));
const userSqlPath = path.join(tempDir, 'users.sql');
const cleanupSqlPath = path.join(tempDir, 'cleanup.sql');
const profileHistoryMigrationPath = path.join(root, 'supabase', 'migrations', '20261028250000_healthclues_profile_history.sql');
const safeIds = [firstId, secondId];
const userValues = safeIds.map((id, index) => {
  const email = `hc-e2e-${suffix}-${index}@example.invalid`;
  return `('${id}'::uuid, '${email}', 'authenticated', 'authenticated', '{}'::jsonb, '{}'::jsonb, now(), now())`;
}).join(',\n');
writeFileSync(userSqlPath, `insert into auth.users (id, email, aud, role, raw_app_meta_data, raw_user_meta_data, created_at, updated_at) values ${userValues};\n`);
writeFileSync(cleanupSqlPath, `delete from auth.users where id in ('${firstId}'::uuid, '${secondId}'::uuid);\n`);

function psqlFile(localPath, containerPath) {
  execFileSync('docker', ['cp', localPath, `${databaseContainer}:${containerPath}`], { stdio: ['ignore', 'ignore', 'pipe'] });
  execFileSync('docker', ['exec', databaseContainer, 'sh', '-c', `PGPASSWORD="$POSTGRES_PASSWORD" psql -h 127.0.0.1 -U supabase_admin -d ${databaseName} -v ON_ERROR_STOP=1 -f ${containerPath}`], { stdio: ['ignore', 'ignore', 'pipe'] });
}

async function request(table, query = '', { method = 'GET', token = anonKey, body, extraHeaders = {} } = {}) {
  const response = await fetch(`${origin}/${table}${query ? `?${query}` : ''}`, {
    method,
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...extraHeaders,
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    signal: AbortSignal.timeout(8000),
  });
  const text = await response.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* Keep error bodies opaque in the report. */ }
  return { response, json };
}

try {
  psqlFile(profileHistoryMigrationPath, '/tmp/healthclues-profile-history-migration.sql');
  execFileSync('docker', ['restart', postgrestContainer], { stdio: ['ignore', 'pipe', 'pipe'] });
  const restDeadline = Date.now() + 30_000;
  let restReady = false;
  while (Date.now() < restDeadline) {
    try {
      const response = await fetch(origin, { signal: AbortSignal.timeout(1500) });
      if (response.ok) { restReady = true; break; }
    } catch { /* Wait for PostgREST to reload the newly migrated table. */ }
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  assert.ok(restReady, 'PostgREST reloads its schema cache after the profile-history migration');
  psqlFile(userSqlPath, '/tmp/healthclues-profile-e2e-users.sql');
  const profile = {
    topic: 'Healthy weight',
    contentPreferences: ['Food & recipes'],
    presentation: 'Step-by-step recipes',
    comfortableActivityTime: '5 minutes',
    refreshFrequency: 'Three times a week',
    twoWeekGoal: 'Explore simple recipes',
    createdAt: new Date().toISOString(),
    safetyLevel: 'none',
    specificInterests: ['Easy meal ideas'],
  };
  const saveProfile = await request('healthclues_profiles', 'on_conflict=user_id', {
    method: 'POST', token: firstUserJwt, body: {
      user_id: firstId, profile, consent_version: 'healthclues-profile-consent-v1', consented_at: new Date().toISOString(),
    }, extraHeaders: { Prefer: 'resolution=merge-duplicates,return=representation' },
  });
  assert.equal(saveProfile.response.status, 201, 'authenticated owner can save the consented profile');

  const ownProfile = await request('healthclues_profiles', `user_id=eq.${firstId}&select=user_id,profile,version` , { token: firstUserJwt });
  assert.equal(ownProfile.response.status, 200);
  assert.equal(ownProfile.json.length, 1);
  assert.deepEqual(ownProfile.json[0].profile, profile);
  assert.equal(ownProfile.json[0].version, 1, 'new saved profile starts at version one');
  const revisedProfile = { ...profile, topic: 'Sleep & rest', createdAt: new Date(Date.now() + 1000).toISOString() };
  const updateProfile = await request('healthclues_profiles', 'on_conflict=user_id', {
    method: 'POST', token: firstUserJwt, body: {
      user_id: firstId, profile: revisedProfile, consent_version: 'healthclues-profile-consent-v1', consented_at: new Date(Date.now() + 1000).toISOString(),
    }, extraHeaders: { Prefer: 'resolution=merge-duplicates,return=representation' },
  });
  assert.ok([200, 201].includes(updateProfile.response.status), `owner can revise the profile; HTTP ${updateProfile.response.status}`);
  const currentRevision = await request('healthclues_profiles', `user_id=eq.${firstId}&select=version,profile` , { token: firstUserJwt });
  assert.equal(currentRevision.json[0].version, 2, 'profile revision increments on a saved change');
  assert.deepEqual(currentRevision.json[0].profile, revisedProfile);
  const ownProfileHistory = await request('healthclues_profile_history', `user_id=eq.${firstId}&select=version,profile&order=version.asc`, { token: firstUserJwt });
  assert.equal(ownProfileHistory.response.status, 200);
  assert.deepEqual(ownProfileHistory.json, [{ version: 1, profile }], 'owner can retrieve the previous saved profile revision');
  const crossProfileHistory = await request('healthclues_profile_history', `user_id=eq.${firstId}&select=version,profile`, { token: secondUserJwt });
  assert.deepEqual(crossProfileHistory.json, [], 'another authenticated user cannot read profile revisions');
  const anonymousProfileHistory = await request('healthclues_profile_history', `user_id=eq.${firstId}&select=version`, { token: anonKey });
  assert.ok(anonymousProfileHistory.response.status >= 400, 'anonymous profile revision access is denied');
  const forgedRevision = await request('healthclues_profile_history', '', { method: 'POST', token: firstUserJwt, body: { user_id: firstId, version: 99, profile, consent_version: 'forged', consented_at: new Date().toISOString() } });
  assert.ok(forgedRevision.response.status >= 400, 'clients cannot write or forge profile revision history');
  const crossProfile = await request('healthclues_profiles', `user_id=eq.${firstId}&select=user_id,profile`, { token: secondUserJwt });
  assert.equal(crossProfile.response.status, 200);
  assert.deepEqual(crossProfile.json, [], 'another authenticated user cannot read the profile');
  const anonymousProfile = await request('healthclues_profiles', `user_id=eq.${firstId}&select=user_id`, { token: anonKey });
  assert.ok(anonymousProfile.response.status >= 400, 'anonymous profile access is denied');

  const actions = [
    { action: 'saved', reason: null },
    { action: 'not_yet', reason: 'ingredients_unavailable' },
    { action: 'skipped', reason: null },
  ];
  for (const [index, item] of actions.entries()) {
    const created = await request('healthclues_discovery_activity', '', {
      method: 'POST', token: firstUserJwt,
      body: { user_id: firstId, content_id: `hc-e2e-${suffix}-${index}`, action: item.action, reason: item.reason },
      extraHeaders: { Prefer: 'return=representation' },
    });
    assert.equal(created.response.status, 201, `owner can record ${item.action}; HTTP ${created.response.status}; ${created.json?.code ?? 'no-code'}: ${created.json?.message ?? 'no-message'}`);
  }

  const ownHistory = await request('healthclues_discovery_activity', `user_id=eq.${firstId}&select=content_id,action,reason&order=content_id.asc`, { token: firstUserJwt });
  assert.equal(ownHistory.response.status, 200);
  assert.equal(ownHistory.json.length, 3);
  assert.ok(ownHistory.json.some(row => row.action === 'not_yet' && row.reason === 'ingredients_unavailable'));
  assert.ok(ownHistory.json.some(row => row.action === 'skipped'));
  const crossHistory = await request('healthclues_discovery_activity', `user_id=eq.${firstId}&select=content_id`, { token: secondUserJwt });
  assert.equal(crossHistory.response.status, 200);
  assert.deepEqual(crossHistory.json, [], 'another authenticated user cannot read check-in history');
  const anonymousHistory = await request('healthclues_discovery_activity', `user_id=eq.${firstId}&select=content_id`, { token: anonKey });
  assert.ok(anonymousHistory.response.status >= 400, 'anonymous history access is denied');
  const forbiddenUpdate = await request('healthclues_discovery_activity', `user_id=eq.${firstId}`, {
    method: 'PATCH', token: firstUserJwt, body: { reason: 'other' },
  });
  assert.ok(forbiddenUpdate.response.status >= 400, 'authenticated users cannot update activity rows');

  const deletedHistory = await request('healthclues_discovery_activity', `user_id=eq.${firstId}`, { method: 'DELETE', token: firstUserJwt });
  assert.equal(deletedHistory.response.status, 204, 'owner can delete their check-in history');
  const noHistory = await request('healthclues_discovery_activity', `user_id=eq.${firstId}&select=id`, { token: firstUserJwt });
  assert.deepEqual(noHistory.json, []);
  const deletedProfile = await request('healthclues_profiles', `user_id=eq.${firstId}`, { method: 'DELETE', token: firstUserJwt });
  assert.equal(deletedProfile.response.status, 204, 'owner can delete their profile');
  const noProfile = await request('healthclues_profiles', `user_id=eq.${firstId}&select=user_id`, { token: firstUserJwt });
  assert.deepEqual(noProfile.json, []);
  const noProfileHistory = await request('healthclues_profile_history', `user_id=eq.${firstId}&select=version`, { token: firstUserJwt });
  assert.deepEqual(noProfileHistory.json, [], 'deleting the consented profile also purges all saved revisions');
  console.log('HealthClues profile/activity REST E2E passed: consented versioned profile save/revision/delete, private history owner isolation and cascade purge, reasoned check-ins, persistent skipped action, anon denial, cross-user isolation, and no authenticated UPDATE.');
} finally {
  try { psqlFile(cleanupSqlPath, '/tmp/healthclues-profile-e2e-cleanup.sql'); } finally { rmSync(tempDir, { recursive: true, force: true }); }
}
