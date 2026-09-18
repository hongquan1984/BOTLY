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
          coalesce(count(e.id) FILTER (WHERE e.event_type = 'quiz_started'), 0) AS quiz_starts,
          coalesce(count(e.id) FILTER (WHERE e.event_type = 'quiz_completed'), 0) AS quiz_completions,
          coalesce(count(e.id) FILTER (WHERE e.event_type = 'lead_submit'), 0) AS lead_submits,
          coalesce(count(e.id) FILTER (WHERE e.event_type = 'onboarding_app_download_click'), 0) AS app_clicks
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
          de.quiz_starts,
          de.quiz_completions,
          greatest(de.quiz_starts - de.quiz_completions, 0) AS quiz_drop_offs,
          greatest(de.lead_submits, coalesce(dl.new_subscribers, 0)) AS leads,
          de.app_clicks
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
          count(e.id) FILTER (WHERE e.event_type = 'quiz_started') AS quiz_starts,
          count(e.id) FILTER (WHERE e.event_type = 'quiz_completed') AS quiz_completions,
          count(e.id) FILTER (WHERE e.event_type = 'onboarding_app_download_click') AS app_clicks
        FROM events_filtered e
        LEFT JOIN public.wellness_article_translations t ON t.slug = e.article_slug
        WHERE e.article_slug IS NOT NULL AND e.article_slug <> ''
        GROUP BY e.article_slug
        ORDER BY views DESC
      ),
      article_leads AS (
        SELECT
          CASE
            WHEN source LIKE 'safety_quiz_%' THEN replace(source, 'safety_quiz_', '')
            WHEN source LIKE 'somatic_haven_%' THEN replace(source, 'somatic_haven_', '')
            ELSE source
          END AS slug,
          count(*) AS lead_count
        FROM public.newsletter_subscribers
        WHERE source LIKE 'safety_quiz_%' OR source LIKE 'somatic_haven_%'
        GROUP BY 1
      ),
      articles_final AS (
        SELECT
          a.article_slug,
          a.title,
          a.locale,
          a.views,
          a.quiz_starts,
          a.quiz_completions,
          greatest(a.quiz_starts - a.quiz_completions, 0) AS quiz_drop_offs,
          a.app_clicks,
          coalesce(al.lead_count, 0) AS leads,
          CASE WHEN a.views > 0 THEN round((a.quiz_completions::numeric / a.views::numeric) * 100, 1) ELSE 0 END AS quiz_rate,
          CASE WHEN a.quiz_starts > 0 THEN round((greatest(a.quiz_starts - a.quiz_completions, 0)::numeric / a.quiz_starts::numeric) * 100, 1) ELSE 0 END AS quiz_drop_off_rate,
          CASE WHEN a.quiz_completions > 0 THEN round((coalesce(al.lead_count, 0)::numeric / a.quiz_completions::numeric) * 100, 1) ELSE 0 END AS conversion_rate
        FROM article_stats a
        LEFT JOIN article_leads al ON al.slug = a.article_slug
        ORDER BY a.views DESC
      ),
      static_page_stats AS (
        SELECT
          e.path,
          CASE
            WHEN e.path = '/' THEN 'Trang chủ (Homepage)'
            WHEN e.path = '/en/wellness/healing' THEN 'Hub Chữa Lành Sanctuary (EN)'
            WHEN e.path = '/vi/song-khoe/healing' THEN 'Hub Chữa Lành Sanctuary (VI)'
            WHEN e.path = '/en/wellness/tools' THEN 'Công Cụ Y Sinh Học & Sức Khỏe (EN)'
            WHEN e.path = '/vi/song-khoe/cong-cu' THEN 'Công Cụ Y Sinh Học & Sức Khỏe (VI)'
            WHEN e.path = '/en/wellness/guides' THEN 'Kho Cẩm Nang Hướng Dẫn (EN)'
            WHEN e.path = '/vi/song-khoe/huong-dan' THEN 'Kho Cẩm Nang Hướng Dẫn (VI)'
            WHEN e.path = '/en/wellness' THEN 'Trang Chủ Sống Khỏe (EN)'
            WHEN e.path = '/vi/song-khoe' THEN 'Trang Chủ Sống Khỏe (VI)'
            WHEN e.path = '/en/business' THEN 'Cổng Khách Hàng Doanh Nghiệp (EN)'
            WHEN e.path = '/vi/doanh-nghiep' THEN 'Cổng Khách Hàng Doanh Nghiệp (VI)'
            WHEN e.path = '/en/wellness/health-tips' THEN 'Mẹo Sống Khỏe & Lối Sống (EN)'
            WHEN e.path = '/vi/song-khoe/meo-hay' THEN 'Mẹo Sống Khỏe & Lối Sống (VI)'
            ELSE e.path
          END AS title,
          CASE WHEN e.path LIKE '/vi%' THEN 'vi' ELSE 'en' END AS locale,
          count(e.id) FILTER (WHERE e.event_type = 'page_view') AS views,
          count(e.id) FILTER (WHERE e.event_type = 'quiz_started') AS quiz_starts,
          count(e.id) FILTER (WHERE e.event_type = 'quiz_completed') AS quiz_completions,
          greatest(count(e.id) FILTER (WHERE e.event_type = 'quiz_started') - count(e.id) FILTER (WHERE e.event_type = 'quiz_completed'), 0) AS quiz_drop_offs,
          count(e.id) FILTER (WHERE e.event_type = 'onboarding_app_download_click') AS app_clicks
        FROM events_filtered e
        WHERE e.article_slug IS NULL OR e.article_slug = ''
        GROUP BY e.path
        ORDER BY views DESC
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
          id, article_slug, locale, path, event_type, metadata, created_at
        FROM events_filtered
        WHERE event_type IN ('quiz_completed', 'quiz_started')
        ORDER BY created_at DESC
        LIMIT 30
      ),
      summary_calc AS (
        SELECT
          (SELECT coalesce(sum(page_views), 0) FROM daily_merged) AS total_page_views,
          (SELECT coalesce(page_views, 0) FROM daily_merged WHERE day = to_char(now(), 'YYYY-MM-DD')) AS today_page_views,
          (SELECT coalesce(sum(quiz_starts), 0) FROM daily_merged) AS total_quiz_starts,
          (SELECT coalesce(quiz_starts, 0) FROM daily_merged WHERE day = to_char(now(), 'YYYY-MM-DD')) AS today_quiz_starts,
          (SELECT coalesce(sum(quiz_completions), 0) FROM daily_merged) AS total_quiz_completions,
          (SELECT coalesce(quiz_completions, 0) FROM daily_merged WHERE day = to_char(now(), 'YYYY-MM-DD')) AS today_quiz_completions,
          (SELECT coalesce(count(*), 0) FROM events_filtered WHERE event_type = 'onboarding_app_download_click') AS total_app_clicks,
          (SELECT coalesce(count(*), 0) FROM events_filtered WHERE event_type = 'onboarding_app_download_click' AND created_at >= date_trunc('day', now())) AS today_app_clicks,
          (SELECT coalesce(count(*), 0) FROM events_filtered WHERE event_type = 'onboarding_app_download_click' AND (metadata->>'store' = 'app_store' OR metadata->>'store' = 'ios')) AS app_clicks_ios,
          (SELECT coalesce(count(*), 0) FROM events_filtered WHERE event_type = 'onboarding_app_download_click' AND (metadata->>'store' = 'google_play' OR metadata->>'store' = 'android')) AS app_clicks_android,
          (SELECT count(*) FROM public.newsletter_subscribers) AS total_subscribers,
          (SELECT count(*) FROM public.newsletter_subscribers WHERE source LIKE 'safety_quiz_%') AS quiz_subscribers,
          (SELECT count(*) FROM public.newsletter_subscribers WHERE source LIKE 'somatic_haven_%') AS somatic_subscribers,
          (SELECT count(*) FROM public.newsletter_subscribers WHERE source NOT LIKE 'safety_quiz_%' AND source NOT LIKE 'somatic_haven_%') AS home_subscribers,
          (SELECT count(*) FROM public.newsletter_subscribers WHERE consented_at >= date_trunc('day', now())) AS today_subscribers
      )
      SELECT jsonb_build_object(
        'summary', jsonb_build_object(
          'total_page_views', sc.total_page_views,
          'today_page_views', sc.today_page_views,
          'total_quiz_starts', sc.total_quiz_starts,
          'today_quiz_starts', sc.today_quiz_starts,
          'total_quiz_completions', sc.total_quiz_completions,
          'today_quiz_completions', sc.today_quiz_completions,
          'total_quiz_in_progress', greatest(sc.total_quiz_starts - sc.total_quiz_completions, 0),
          'quiz_drop_off_rate', CASE WHEN sc.total_quiz_starts > 0 THEN round((greatest(sc.total_quiz_starts - sc.total_quiz_completions, 0)::numeric / sc.total_quiz_starts::numeric) * 100, 1) ELSE 0 END,
          'quiz_completion_rate', CASE WHEN sc.total_quiz_starts > 0 THEN round((sc.total_quiz_completions::numeric / sc.total_quiz_starts::numeric) * 100, 1) ELSE 0 END,
          'total_app_clicks', sc.total_app_clicks,
          'today_app_clicks', sc.today_app_clicks,
          'app_clicks_ios', sc.app_clicks_ios,
          'app_clicks_android', sc.app_clicks_android,
          'total_subscribers', sc.total_subscribers,
          'quiz_subscribers', sc.quiz_subscribers,
          'somatic_subscribers', sc.somatic_subscribers,
          'home_subscribers', sc.home_subscribers,
          'today_subscribers', sc.today_subscribers,
          'overall_conversion_rate', (
            SELECT CASE
              WHEN sum(quiz_completions) > 0 THEN round(((SELECT count(*) FROM public.newsletter_subscribers WHERE source LIKE 'safety_quiz_%' OR source LIKE 'somatic_haven_%')::numeric / sum(quiz_completions)::numeric) * 100, 1)
              ELSE 0
            END
            FROM daily_merged
          )
        ),
        'daily', (SELECT coalesce(jsonb_agg(to_jsonb(dm)), '[]'::jsonb) FROM daily_merged dm),
        'articles', (SELECT coalesce(jsonb_agg(to_jsonb(af)), '[]'::jsonb) FROM articles_final af),
        'static_pages', (SELECT coalesce(jsonb_agg(to_jsonb(sp)), '[]'::jsonb) FROM static_page_stats sp),
        'subscribers', (SELECT coalesce(jsonb_agg(to_jsonb(sd)), '[]'::jsonb) FROM subscribers_data sd),
        'devices', (SELECT coalesce(jsonb_agg(to_jsonb(ds)), '[]'::jsonb) FROM device_stats ds),
        'referrers', (SELECT coalesce(jsonb_agg(to_jsonb(rs)), '[]'::jsonb) FROM referrer_stats rs),
        'recent_quizzes', (SELECT coalesce(jsonb_agg(to_jsonb(rq)), '[]'::jsonb) FROM recent_quizzes rq)
      ) INTO v_result
      FROM summary_calc sc;

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
