import pg from 'pg';
const { Client } = pg;

const client = new Client({
  host: 'aws-0-ap-northeast-1.pooler.supabase.com',
  port: 5432,
  user: 'postgres.rswmadukvegraxfcdbcb',
  password: 'lA2ideE0GydDFPTn',
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  const tables = await client.query(`
    SELECT table_schema, table_name 
    FROM information_schema.tables 
    WHERE table_schema NOT IN ('information_schema', 'pg_catalog')
    ORDER BY table_schema, table_name;
  `);
  console.log("All tables in DB:", tables.rows);
  await client.end();
}

main();
