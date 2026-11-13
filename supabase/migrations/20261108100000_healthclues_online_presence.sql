-- HealthClues Realtime Online Presence for Regional Villages
-- Stores ephemeral presence heartbeats for synchronous multiplayer visibility

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
