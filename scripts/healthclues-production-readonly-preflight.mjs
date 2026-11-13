import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import pg from 'pg';
import { X509Certificate } from 'node:crypto';

const expectedHost = 'aws-0-ap-northeast-1.pooler.supabase.com';
const expectedUser = 'postgres.rswmadukvegraxfcdbcb';
const expectedDatabase = 'postgres';
const envText = readFileSync(new URL('../.env.local', import.meta.url), 'utf8');

function readEnv(name) {
  const line = envText.split(/\r?\n/).find(entry => new RegExp(`^\\s*${name}\\s*=`).test(entry));
  if (!line) return '';
  const value = line.slice(line.indexOf('=') + 1).trim();
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) return value.slice(1, -1);
  return value;
}

const password = readEnv('SUPABASE_DB_PASSWORD') || readEnv('PGPASSWORD');
if (!password) throw new Error('Required local database credential is unavailable.');

const rootCertPath = process.env.SUPABASE_DB_SSLROOTCERT || readEnv('SUPABASE_DB_SSLROOTCERT') || readEnv('PGSSLROOTCERT');
let ssl = { rejectUnauthorized: true };
if (rootCertPath) {
  if (!existsSync(rootCertPath)) throw new Error('Configured Supabase root certificate path is unavailable.');
  const ca = readFileSync(rootCertPath, 'utf8');
  new X509Certificate(ca);
  ssl = { ca, rejectUnauthorized: true };
}

const client = new pg.Client({
  host: expectedHost,
  port: 5432,
  database: expectedDatabase,
  user: expectedUser,
  password,
  ssl,
  connectionTimeoutMillis: 10_000,
  application_name: 'botly-healthclues-readonly-preflight',
});

try {
  await client.connect();
  await client.query('BEGIN READ ONLY');
  const identity = (await client.query(`
    SELECT current_database() AS database, current_user AS role,
      current_setting('server_version') AS version,
      current_setting('transaction_read_only') AS read_only
  `)).rows[0];
  assert.equal(identity.database, expectedDatabase);
  assert.equal(identity.role, expectedUser);
  assert.match(identity.version, /^17\./);
  assert.equal(identity.read_only, 'on');

  const tables = await client.query(`
    SELECT n.nspname AS schema, count(*)::int AS relations
    FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE c.relkind IN ('r','p','v','m','f')
      AND n.nspname NOT IN ('information_schema','pg_catalog','pg_toast')
      AND n.nspname NOT LIKE 'pg_temp_%' AND n.nspname NOT LIKE 'pg_toast_temp_%'
    GROUP BY n.nspname ORDER BY n.nspname
  `);
  const targets = await client.query(`
    SELECT n.nspname AS schema, c.relname AS relation, c.relkind AS kind,
      coalesce(c.relrowsecurity,false) AS rls
    FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE c.relname IN ('schema_migrations','healthclues_profiles','healthclues_discovery_content','healthclues_review_audit','healthclues_discovery_activity')
      AND n.nspname NOT IN ('information_schema','pg_catalog')
    ORDER BY n.nspname,c.relname
  `);
  const ledger = targets.rows.some(row => row.schema === 'supabase_migrations' && row.relation === 'schema_migrations');
  let migrationVersions = [];
  if (ledger) {
    migrationVersions = (await client.query('SELECT version::text FROM supabase_migrations.schema_migrations ORDER BY version')).rows.map(row => row.version);
  }
  const grants = await client.query(`
    SELECT table_schema AS schema, table_name AS relation, grantee, privilege_type
    FROM information_schema.role_table_grants
    WHERE table_schema IN ('public','growth')
      AND table_name IN ('healthclues_profiles','healthclues_discovery_content','healthclues_review_audit','healthclues_discovery_activity')
    ORDER BY table_schema,table_name,grantee,privilege_type
  `);
  await client.query('ROLLBACK');
  console.log(JSON.stringify({ identity, relationCountsBySchema: tables.rows, relevantRelations: targets.rows, migrationVersions, healthcluesGrants: grants.rows }));
} catch (error) {
  const code = typeof error?.code === 'string' ? error.code : 'READ_ONLY_CHECK_FAILED';
  console.error(`READ_ONLY_CHECK_FAILED ${code}`);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => undefined);
}
