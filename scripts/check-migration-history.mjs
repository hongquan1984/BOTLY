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
  const res = await client.query(`
    SELECT * FROM supabase_migrations.schema_migrations ORDER BY version;
  `).catch(err => ({ error: err.message }));
  console.log("Applied supabase migrations:", res.rows || res.error);
  await client.end();
}

main();
