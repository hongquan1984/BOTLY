import pg from 'pg';
import nextEnv from '@next/env';

const projectRoot = 'd:\\botly';
const env = nextEnv.loadEnvConfig(projectRoot).combinedEnv;

const projectRef = env.SUPABASE_PROJECT_REF || 'rswmadukvegraxfcdbcb';
const password = env.SUPABASE_DB_PASSWORD;

if (!password) {
  console.log("No SUPABASE_DB_PASSWORD provided. Skipping DB migration.");
  process.exit(0);
}

const client = new pg.Client({
  host: `aws-0-ap-northeast-1.pooler.supabase.com`,
  port: 5432,
  user: `postgres.${projectRef}`,
  password: password,
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  console.log("Connected to Supabase Postgres.");

  await client.query(`
    CREATE TABLE IF NOT EXISTS healthclues_online_presence (
      user_id VARCHAR(120) PRIMARY KEY,
      region VARCHAR(60) NOT NULL,
      nickname VARCHAR(80) NOT NULL,
      avatar_key VARCHAR(60) NOT NULL DEFAULT 'chibi-adventurer',
      x NUMERIC NOT NULL DEFAULT 740,
      y NUMERIC NOT NULL DEFAULT 450,
      facing VARCHAR(10) NOT NULL DEFAULT 'right',
      walking BOOLEAN NOT NULL DEFAULT false,
      status_action VARCHAR(40) NULL,
      speech VARCHAR(160) NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_healthclues_presence_region_updated
      ON healthclues_online_presence (region, updated_at);

    ALTER TABLE healthclues_online_presence ENABLE ROW LEVEL SECURITY;

    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'healthclues_online_presence' AND policyname = 'Public read active presence'
      ) THEN
        CREATE POLICY "Public read active presence"
          ON healthclues_online_presence FOR SELECT
          USING (true);
      END IF;
    END $$;

    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'healthclues_online_presence' AND policyname = 'Service role full access presence'
      ) THEN
        CREATE POLICY "Service role full access presence"
          ON healthclues_online_presence FOR ALL
          USING (true)
          WITH CHECK (true);
      END IF;
    END $$;
  `);

  console.log("healthclues_online_presence table ensured.");

  // Reload PostgREST schema cache
  await client.query("NOTIFY pgrst, 'reload schema';");
  console.log("PostgREST schema cache notified.");

  await client.end();
  console.log("Done.");
}

main().catch(err => {
  console.error("Setup error:", err.message);
  process.exit(1);
});
