import fs from 'fs';
import path from 'path';
import pg from 'pg';
import nextEnv from '@next/env';

const projectRoot = 'd:\\botly';
const env = nextEnv.loadEnvConfig(projectRoot).combinedEnv;

const projectRef = env.SUPABASE_PROJECT_REF || 'rswmadukvegraxfcdbcb';
const password = env.SUPABASE_DB_PASSWORD;

if (!password) {
  console.error("Missing SUPABASE_DB_PASSWORD in environment.");
  process.exit(1);
}

const client = new pg.Client({
  host: `aws-0-ap-northeast-1.pooler.supabase.com`,
  port: 5432,
  user: `postgres.${projectRef}`,
  password: password,
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

const migrationsDir = path.join(projectRoot, 'supabase', 'migrations');

async function main() {
  await client.connect();
  console.log("Connected to Supabase Postgres via session pooler.");

  // Create schema migrations tracker table
  await client.query(`
    CREATE SCHEMA IF NOT EXISTS supabase_migrations;
    CREATE TABLE IF NOT EXISTS supabase_migrations.schema_migrations (
      version text PRIMARY KEY,
      inserted_at timestamptz DEFAULT now()
    );
  `);

  const existingRes = await client.query(`SELECT version FROM supabase_migrations.schema_migrations;`);
  const appliedVersions = new Set(existingRes.rows.map(r => r.version));

  const allFiles = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql') && !f.includes('baseline'))
    .sort();

  console.log(`Total HealthClues migration files: ${allFiles.length}`);

  let appliedCount = 0;
  for (const file of allFiles) {
    const version = file.replace(/\.sql$/, '');
    if (appliedVersions.has(version)) {
      console.log(`Skipping already-applied: ${file}`);
      continue;
    }

    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf-8');
    console.log(`Applying migration: ${file}...`);

    await client.query("BEGIN;");
    try {
      await client.query(sql);
      await client.query(`INSERT INTO supabase_migrations.schema_migrations (version) VALUES ($1);`, [version]);
      await client.query("COMMIT;");
      console.log(`  -> Applied successfully: ${file}`);
      appliedCount++;
    } catch (err) {
      await client.query("ROLLBACK;");
      console.error(`Failed to apply ${file}:`, err.message);
      throw err;
    }
  }

  console.log(`Done! Applied ${appliedCount} migrations.`);

  // Reload PostgREST schema cache
  console.log("Reloading PostgREST schema cache...");
  await client.query("NOTIFY pgrst, 'reload schema';");
  await client.query("NOTIFY pgrst, 'reload config';");
  console.log("Schema cache reloaded successfully.");

  await client.end();
}

main().catch(err => {
  console.error("Migration error:", err);
  process.exit(1);
});
