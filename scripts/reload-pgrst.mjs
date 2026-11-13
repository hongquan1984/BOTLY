import pg from 'pg';
import nextEnv from '@next/env';

const env = nextEnv.loadEnvConfig('d:\\botly').combinedEnv;
const client = new pg.Client({
  host: 'aws-0-ap-northeast-1.pooler.supabase.com',
  port: 5432,
  user: 'postgres.' + env.SUPABASE_PROJECT_REF,
  password: env.SUPABASE_DB_PASSWORD,
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  console.log("Connected.");
  await client.query("NOTIFY pgrst, 'reload schema';");
  await client.query("NOTIFY pgrst, 'reload config';");
  console.log("PostgREST schema reload signal sent!");
  await client.end();
}

main().catch(console.error);
