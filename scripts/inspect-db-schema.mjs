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
  const res = await client.query(`
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public' 
    ORDER BY tablename;
  `);
  console.log("All tables in public:", res.rows.map(r => r.tablename));

  // Check specific table
  const checkDel = await client.query(`
    SELECT tablename 
    FROM pg_tables 
    WHERE tablename = 'healthclues_account_deletion_requests';
  `);
  console.log("healthclues_account_deletion_requests exists?", checkDel.rows.length > 0);

  // Check permissions/grants
  const checkGrants = await client.query(`
    SELECT grantee, table_name, privilege_type 
    FROM information_schema.role_table_grants 
    WHERE table_name = 'healthclues_account_deletion_requests';
  `);
  console.log("Grants on deletion_requests:", checkGrants.rows);

  await client.end();
}

main().catch(console.error);
