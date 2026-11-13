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

async function main() {
  try {
    await client.connect();
    console.log("Postgres connected successfully!");
    const res = await client.query("SELECT version();");
    console.log("Postgres version:", res.rows[0]);
    await client.end();
  } catch (err) {
    console.error("Postgres connection error:", err.message);
  }
}

main();
