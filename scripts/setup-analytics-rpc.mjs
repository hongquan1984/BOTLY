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
  console.log('Creating get_admin_analytics RPC function in Postgres...');

  await client.query(`
    CREATE OR REPLACE FUNCTION public.get_admin_analytics(p_days integer DEFAULT 30)
    RETURNS jsonb
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    DECLARE
      v_result jsonb;
      v_start_date timestamptz := now() - (p_days || ' days')::interval;
    BEGIN
      WITH
      subscribers_data AS (
        SELECT
          id, email, locale, source, consented_at, status,
          to_char(consented_at, 'YYYY-MM-DD') AS sub_date
        FROM public.newsletter_subscribers
        ORDER BY consented_at DESC
      ),
      events_filtered AS (
        SELECT *
        FROM public.analytics_events
        WHERE created_at >= v_start_date
      ),
      daily_events AS (
        SELECT
          to_char(d, 'YYYY-MM-DD') AS day,
          coalesce(count(e.id) FILTER (WHERE e.event_type = 'page_view'), 0) AS page_views,
          coalesce(count(e.id) FILTER (WHERE e.event_type = 'quiz_completed'), 0) AS quiz_completions,
          coalesce(count(e.id) FILTER (WHERE e.event_type = 'lead_submit'), 0) AS lead_submits
        FROM generate_series(date_trunc('day', v_start_date), date_trunc('day', now()), '1 day'::interval) d
        LEFT JOIN events_filtered e ON to_char(e.created_at, 'YYYY-MM-DD') = to_char(d, 'YYYY-MM-DD')
        GROUP BY d
        ORDER BY d ASC
      ),
      daily_leads AS (
        SELECT
          to_char(consented_at, 'YYYY-MM-DD') AS day,
          count(*) AS new_subscribers
        FROM public.newsletter_subscribers
        WHERE consented_at >= v_start_date
        GROUP BY to_char(consented_at, 'YYYY-MM-DD')
      ),
      daily_merged AS (
        SELECT
          de.day,
          de.page_views,
          de.quiz_completions,
          greatest(de.lead_submits, coalesce(dl.new_subscribers, 0)) AS leads
        FROM daily_events de
        LEFT JOIN daily_leads dl ON dl.day = de.day
        ORDER BY de.day ASC
      ),
      article_stats AS (
        SELECT
          e.article_slug,
          coalesce(max(t.title), e.article_slug) AS title,
          coalesce(max(t.locale), 'vi') AS locale,
          count(e.id) FILTER (WHERE e.event_type = 'page_view') AS views,
          count(e.id) FILTER (WHERE e.event_type = 'quiz_completed') AS quiz_completions
        FROM events_filtered e
        LEFT JOIN public.wellness_article_translations t ON t.slug = e.article_slug
        WHERE e.article_slug IS NOT NULL AND e.article_slug <> ''
        GROUP BY e.article_slug
        ORDER BY views DESC
      ),
      article_leads AS (
        SELECT
          replace(source, 'safety_quiz_', '') AS slug,
          count(*) AS lead_count
        FROM public.newsletter_subscribers
        WHERE source LIKE 'safety_quiz_%'
        GROUP BY source
      ),
      articles_final AS (
        SELECT
          a.article_slug,
          a.title,
          a.locale,
          a.views,
          a.quiz_completions,
          coalesce(al.lead_count, 0) AS leads,
          CASE WHEN a.views > 0 THEN round((a.quiz_completions::numeric / a.views::numeric) * 100, 1) ELSE 0 END AS quiz_rate,
          CASE WHEN a.quiz_completions > 0 THEN round((coalesce(al.lead_count, 0)::numeric / a.quiz_completions::numeric) * 100, 1) ELSE 0 END AS conversion_rate
        FROM article_stats a
        LEFT JOIN article_leads al ON al.slug = a.article_slug
        ORDER BY a.views DESC
      ),
      device_stats AS (
        SELECT
          coalesce(nullif(device_type, ''), 'desktop') AS device,
          count(*) AS count
        FROM events_filtered
        WHERE event_type = 'page_view'
        GROUP BY 1
        ORDER BY count DESC
      ),
      referrer_stats AS (
        SELECT
          CASE
            WHEN referrer ILIKE '%facebook%' OR referrer ILIKE '%fb%' THEN 'Facebook Reels'
            WHEN referrer ILIKE '%google%' THEN 'Google Search'
            WHEN referrer ILIKE '%botly%' THEN 'Nội bộ Botly'
            WHEN referrer IS NULL OR referrer = '' THEN 'Trực tiếp (Direct)'
            ELSE 'Nguồn khác'
          END AS channel,
          count(*) AS count
        FROM events_filtered
        WHERE event_type = 'page_view'
        GROUP BY 1
        ORDER BY count DESC
      ),
      recent_quizzes AS (
        SELECT
          id, article_slug, locale, path, metadata, created_at
        FROM events_filtered
        WHERE event_type = 'quiz_completed'
        ORDER BY created_at DESC
        LIMIT 20
      )
      SELECT jsonb_build_object(
        'summary', jsonb_build_object(
          'total_page_views', (SELECT coalesce(sum(page_views), 0) FROM daily_merged),
          'today_page_views', (SELECT coalesce(page_views, 0) FROM daily_merged WHERE day = to_char(now(), 'YYYY-MM-DD')),
          'total_quiz_completions', (SELECT coalesce(sum(quiz_completions), 0) FROM daily_merged),
          'today_quiz_completions', (SELECT coalesce(quiz_completions, 0) FROM daily_merged WHERE day = to_char(now(), 'YYYY-MM-DD')),
          'total_subscribers', (SELECT count(*) FROM public.newsletter_subscribers),
          'quiz_subscribers', (SELECT count(*) FROM public.newsletter_subscribers WHERE source LIKE 'safety_quiz_%'),
          'home_subscribers', (SELECT count(*) FROM public.newsletter_subscribers WHERE source NOT LIKE 'safety_quiz_%'),
          'today_subscribers', (SELECT count(*) FROM public.newsletter_subscribers WHERE consented_at >= date_trunc('day', now())),
          'overall_conversion_rate', (
            SELECT CASE
              WHEN sum(quiz_completions) > 0 THEN round(((SELECT count(*) FROM public.newsletter_subscribers WHERE source LIKE 'safety_quiz_%')::numeric / sum(quiz_completions)::numeric) * 100, 1)
              ELSE 0
            END
            FROM daily_merged
          )
        ),
        'daily', (SELECT coalesce(jsonb_agg(to_jsonb(dm)), '[]'::jsonb) FROM daily_merged dm),
        'articles', (SELECT coalesce(jsonb_agg(to_jsonb(af)), '[]'::jsonb) FROM articles_final af),
        'subscribers', (SELECT coalesce(jsonb_agg(to_jsonb(sd)), '[]'::jsonb) FROM subscribers_data sd),
        'devices', (SELECT coalesce(jsonb_agg(to_jsonb(ds)), '[]'::jsonb) FROM device_stats ds),
        'referrers', (SELECT coalesce(jsonb_agg(to_jsonb(rs)), '[]'::jsonb) FROM referrer_stats rs),
        'recent_quizzes', (SELECT coalesce(jsonb_agg(to_jsonb(rq)), '[]'::jsonb) FROM recent_quizzes rq)
      ) INTO v_result;

      RETURN v_result;
    END;
    $$;

    GRANT EXECUTE ON FUNCTION public.get_admin_analytics(integer) TO service_role, anon;
  `);

  console.log('RPC created. Testing get_admin_analytics()...');
  const testRes = await client.query('SELECT public.get_admin_analytics(7) as data;');
  const data = testRes.rows[0].data;
  console.log('Summary:', data.summary);
  console.log('Days count:', data.daily?.length);
  console.log('Articles count:', data.articles?.length);
  console.log('Subscribers count:', data.subscribers?.length);

  await client.end();
}

main().catch(console.error);
