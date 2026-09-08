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
  console.log('Connected to Supabase Postgres. Creating analytics_events table...');

  await client.query(`
    CREATE TABLE IF NOT EXISTS public.analytics_events (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      event_type text NOT NULL,
      path text NOT NULL,
      article_slug text,
      locale text DEFAULT 'vi',
      referrer text,
      device_type text,
      session_id text,
      metadata jsonb DEFAULT '{}'::jsonb,
      created_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON public.analytics_events(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON public.analytics_events(event_type);
    CREATE INDEX IF NOT EXISTS idx_analytics_events_slug ON public.analytics_events(article_slug);
    CREATE INDEX IF NOT EXISTS idx_analytics_events_path ON public.analytics_events(path);

    ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'analytics_events' AND policyname = 'anon_insert_analytics') THEN
        CREATE POLICY anon_insert_analytics ON public.analytics_events FOR INSERT TO anon WITH CHECK (true);
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'analytics_events' AND policyname = 'service_role_all_analytics') THEN
        CREATE POLICY service_role_all_analytics ON public.analytics_events FOR ALL TO service_role USING (true) WITH CHECK (true);
      END IF;
    END
    $$;

    GRANT INSERT ON public.analytics_events TO anon;
    GRANT ALL ON public.analytics_events TO service_role;
  `);

  console.log('Table and policies created successfully.');

  const subs = await client.query('SELECT count(*) FROM public.newsletter_subscribers');
  console.log('Existing subscribers count:', subs.rows[0].count);

  await client.end();
}

main().catch(console.error);
