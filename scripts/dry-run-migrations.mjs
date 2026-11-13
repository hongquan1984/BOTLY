import fs from 'fs';
import path from 'path';
import pg from 'pg';
import nextEnv from '@next/env';

const env = nextEnv.loadEnvConfig('d:\\botly').combinedEnv;
const client = new pg.Client({
  host: 'aws-0-ap-northeast-1.pooler.supabase.com',
  port: 5432,
  user: `postgres.${env.SUPABASE_PROJECT_REF || 'rswmadukvegraxfcdbcb'}`,
  password: env.SUPABASE_DB_PASSWORD,
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

const migrationsDir = 'd:\\botly\\supabase\\migrations';

async function main() {
  await client.connect();
  console.log("Connected to Supabase Postgres.");

  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql') && !f.includes('baseline'))
    .sort();

  console.log(`Found ${files.length} migrations to dry-run.`);

  await client.query("BEGIN;");
  try {
    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');
      console.log(`Testing migration: ${file}...`);
      await client.query(sql);
      console.log(`  -> OK: ${file}`);
    }
    console.log("All migrations passed dry-run! Rolling back transaction.");
  } catch (err) {
    console.error("Migration failed:", err.message);
  } finally {
    await client.query("ROLLBACK;");
    await client.end();
  }
}

main().catch(console.error);
