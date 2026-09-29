import { createRequire } from 'node:module';
const require = createRequire('d:/botly/package.json');
const { Client } = require('pg');
import fs from 'fs';

const env = Object.fromEntries(
  fs.readFileSync('d:/botly/.env.local', 'utf8').split('\n').filter(l => l.includes('=')).map(l => {
    const [k, ...v] = l.trim().split('=');
    return [k, v.join('=')];
  })
);

const client = new Client({
  host: 'aws-0-ap-northeast-1.pooler.supabase.com',
  port: 5432,
  database: 'postgres',
  user: 'postgres.rswmadukvegraxfcdbcb',
  password: env.SUPABASE_DB_PASSWORD,
  ssl: { rejectUnauthorized: false }
});

const updatedFunctionSql = `
CREATE OR REPLACE FUNCTION public.get_admin_analytics(p_days integer DEFAULT 30)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
          coalesce(count(DISTINCT coalesce(e.visitor_id, e.session_id, e.id::text)) FILTER (WHERE e.event_type = 'page_view'), 0) AS unique_visitors,
          coalesce(count(e.id) FILTER (WHERE e.event_type = 'quiz_started'), 0) AS quiz_starts,
          coalesce(count(e.id) FILTER (WHERE e.event_type = 'quiz_completed'), 0) AS quiz_completions,
          coalesce(count(e.id) FILTER (WHERE e.event_type = 'lead_submit'), 0) AS lead_submits,
          coalesce(count(e.id) FILTER (WHERE e.event_type = 'onboarding_app_download_click'), 0) AS app_clicks,
          coalesce(count(e.id) FILTER (WHERE e.event_type IN ('ebook_download', 'ebook_downloaded', 'ebook_download_unlocked')), 0) AS ebook_downloads
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
          de.unique_visitors,
          de.quiz_starts,
          de.quiz_completions,
          greatest(de.quiz_starts - de.quiz_completions, 0) AS quiz_drop_offs,
          greatest(de.lead_submits, coalesce(dl.new_subscribers, 0)) AS leads,
          de.app_clicks,
          de.ebook_downloads
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
          count(DISTINCT coalesce(e.visitor_id, e.session_id, e.id::text)) FILTER (WHERE e.event_type = 'page_view') AS unique_visitors,
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
          a.unique_visitors,
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
            WHEN e.path = '/en/wellness/ebooks' THEN 'Thư Viện Cẩm Nang Ebook (EN)'
            WHEN e.path = '/vi/song-khoe/ebooks' THEN 'Thư Viện Cẩm Nang Ebook (VI)'
            WHEN e.path = '/en/wellness/ebooks/blood-sugar-pairings' THEN 'Ebook Vol 01 - Blood Sugar (EN)'
            WHEN e.path = '/vi/song-khoe/ebooks/duong-huyet' THEN 'Ebook Vol 01 - Đường Huyết (VI)'
            WHEN e.path = '/en/wellness/ebooks/antioxidants' THEN 'Ebook Vol 02 - Antioxidants (EN)'
            WHEN e.path = '/vi/song-khoe/ebooks/chat-chong-oxy-hoa' THEN 'Ebook Vol 02 - Chất Chống Oxy Hóa (VI)'
            WHEN e.path = '/en/business' THEN 'Cổng Khách Hàng Doanh Nghiệp (EN)'
            WHEN e.path = '/en/wellness/health-tips' THEN 'Mẹo Sống Khỏe & Lối Sống (EN)'
            WHEN e.path = '/vi/song-khoe/meo-hay' THEN 'Mẹo Sống Khỏe & Lối Sống (VI)'
            WHEN e.path = '/tai-app' OR e.path = '/app' OR e.path = '/download' THEN 'Landing Page Tải App Soulscape'
            ELSE e.path
          END AS title,
          CASE WHEN e.path LIKE '/vi%' THEN 'vi' ELSE 'en' END AS locale,
          count(e.id) FILTER (WHERE e.event_type = 'page_view') AS views,
          count(DISTINCT coalesce(e.visitor_id, e.session_id, e.id::text)) FILTER (WHERE e.event_type = 'page_view') AS unique_visitors,
          count(e.id) FILTER (WHERE e.event_type = 'quiz_started') AS quiz_starts,
          count(e.id) FILTER (WHERE e.event_type = 'quiz_completed') AS quiz_completions,
          greatest(count(e.id) FILTER (WHERE e.event_type = 'quiz_started') - count(e.id) FILTER (WHERE e.event_type = 'quiz_completed'), 0) AS quiz_drop_offs,
          count(e.id) FILTER (WHERE e.event_type = 'onboarding_app_download_click') AS app_clicks
        FROM events_filtered e
        WHERE e.article_slug IS NULL OR e.article_slug = ''
        GROUP BY e.path
        ORDER BY views DESC
      ),
      ebook_breakdown AS (
        SELECT
          eb.id AS ebook_id,
          eb.volume,
          eb.title,
          eb.status,
          coalesce(v.views, 0) AS views,
          coalesce(d.total_downloads, 0) AS total_downloads,
          coalesce(d.direct_downloads, 0) AS direct_downloads,
          coalesce(d.unlock_downloads, 0) AS unlock_downloads,
          coalesce(s.subscribers, 0) AS subscribers,
          CASE
            WHEN coalesce(v.views, 0) > 0 THEN round((coalesce(d.total_downloads, 0)::numeric / v.views::numeric) * 100, 1)
            ELSE 0
          END AS download_rate
        FROM (
          VALUES
            ('blood-sugar', 'VOL. 01', 'Đường Huyết & Bữa Ăn Hàng Ngày', 'available'),
            ('antioxidants', 'VOL. 02', 'Chất Chống Oxy Hóa Trên Đĩa Ăn', 'available'),
            ('weight-management', 'VOL. 03', 'Kết Hợp Thực Phẩm Cho Quản Lý Cân Nặng', 'in_development'),
            ('better-sleep', 'VOL. 04', 'Kết Hợp Bữa Tối Cho Giấc Ngủ Sâu', 'in_development'),
            ('gout-support', 'VOL. 05', 'Thực Phẩm & Bệnh Gút: Bằng Chứng Y Sinh', 'in_development'),
            ('liver-health', 'VOL. 06', 'Dinh Dưỡng Cho Lá Gan: Vượt Qua Lời Đồn', 'in_development'),
            ('catalog_master', 'ALL', 'Thư Viện Cẩm Nang Ebook Tổng (Catalog)', 'available')
        ) AS eb(id, volume, title, status)
        LEFT JOIN (
          SELECT
            CASE
              WHEN path LIKE '%duong-huyet%' OR path LIKE '%blood-sugar%' THEN 'blood-sugar'
              WHEN path LIKE '%chat-chong-oxy-hoa%' OR path LIKE '%antioxidants%' THEN 'antioxidants'
              WHEN path LIKE '%/ebooks%' OR path LIKE '%/song-khoe/ebooks%' THEN 'catalog_master'
              ELSE 'other'
            END AS target_id,
            count(*) AS views
          FROM events_filtered
          WHERE event_type = 'page_view' AND (path LIKE '%/ebooks%' OR path LIKE '%duong-huyet%' OR path LIKE '%blood-sugar%' OR path LIKE '%chat-chong-oxy-hoa%' OR path LIKE '%antioxidants%')
          GROUP BY 1
        ) v ON v.target_id = eb.id
        LEFT JOIN (
          SELECT
            CASE
              WHEN coalesce(metadata->>'ebook', metadata->>'ebook_id', '') IN ('blood-sugar', 'blood-sugar-pairings') THEN 'blood-sugar'
              WHEN coalesce(metadata->>'ebook', metadata->>'ebook_id', '') IN ('antioxidants', 'antioxidants-on-the-plate') THEN 'antioxidants'
              WHEN coalesce(metadata->>'ebook', metadata->>'ebook_id', '') = 'weight-management' THEN 'weight-management'
              WHEN coalesce(metadata->>'ebook', metadata->>'ebook_id', '') = 'better-sleep' THEN 'better-sleep'
              WHEN coalesce(metadata->>'ebook', metadata->>'ebook_id', '') = 'gout-support' THEN 'gout-support'
              WHEN coalesce(metadata->>'ebook', metadata->>'ebook_id', '') = 'liver-health' THEN 'liver-health'
              ELSE 'catalog_master'
            END AS target_id,
            count(*) AS total_downloads,
            count(*) FILTER (WHERE coalesce(metadata->>'method', '') != 'unlocked' AND event_type != 'ebook_download_unlocked') AS direct_downloads,
            count(*) FILTER (WHERE coalesce(metadata->>'method', '') = 'unlocked' OR event_type = 'ebook_download_unlocked') AS unlock_downloads
          FROM events_filtered
          WHERE event_type IN ('ebook_download', 'ebook_downloaded', 'ebook_download_unlocked')
          GROUP BY 1
        ) d ON d.target_id = eb.id
        LEFT JOIN (
          SELECT
            CASE
              WHEN source LIKE '%blood_sugar%' OR source LIKE '%duong-huyet%' THEN 'blood-sugar'
              WHEN source LIKE '%antioxidant%' OR source LIKE '%oxy_hoa%' THEN 'antioxidants'
              ELSE 'catalog_master'
            END AS target_id,
            count(*) AS subscribers
          FROM public.newsletter_subscribers
          WHERE source LIKE '%ebook%'
          GROUP BY 1
        ) s ON s.target_id = eb.id
        ORDER BY eb.volume ASC
      ),
      recent_ebook_downloads AS (
        SELECT
          id,
          coalesce(metadata->>'ebook', metadata->>'ebook_id', 'all') AS ebook_id,
          CASE
            WHEN coalesce(metadata->>'ebook', metadata->>'ebook_id', '') IN ('blood-sugar', 'blood-sugar-pairings') THEN 'VOL. 01 · Đường Huyết & Bữa Ăn Hàng Ngày'
            WHEN coalesce(metadata->>'ebook', metadata->>'ebook_id', '') IN ('antioxidants', 'antioxidants-on-the-plate') THEN 'VOL. 02 · Chất Chống Oxy Hóa'
            WHEN coalesce(metadata->>'ebook', metadata->>'ebook_id', '') = 'weight-management' THEN 'VOL. 03 · Quản Lý Cân Nặng'
            WHEN coalesce(metadata->>'ebook', metadata->>'ebook_id', '') = 'better-sleep' THEN 'VOL. 04 · Giấc Ngủ Sâu'
            WHEN coalesce(metadata->>'ebook', metadata->>'ebook_id', '') = 'gout-support' THEN 'VOL. 05 · Bệnh Gút & Axit Uric'
            WHEN coalesce(metadata->>'ebook', metadata->>'ebook_id', '') = 'liver-health' THEN 'VOL. 06 · Sức Khỏe Lá Gan'
            ELSE coalesce(metadata->>'title', path, 'Cẩm nang Ebook')
          END AS title,
          coalesce(metadata->>'method', 'direct') AS method,
          coalesce(metadata->>'source', 'web') AS source,
          locale,
          device_type,
          created_at
        FROM events_filtered
        WHERE event_type IN ('ebook_download', 'ebook_downloaded', 'ebook_download_unlocked')
        ORDER BY created_at DESC
        LIMIT 50
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
      app_downloads_daily AS (
        SELECT
          to_char(e.created_at AT TIME ZONE 'Asia/Ho_Chi_Minh', 'YYYY-MM-DD') AS day,
          count(e.id) AS total_clicks,
          count(DISTINCT coalesce(e.visitor_id, e.session_id, e.id::text)) AS unique_visitors,
          count(e.id) FILTER (WHERE e.metadata->>'platform' = 'ios' OR e.metadata->>'store' IN ('app_store', 'ios')) AS ios,
          count(e.id) FILTER (WHERE e.metadata->>'platform' = 'android' OR e.metadata->>'store' IN ('google_play', 'android')) AS android,
          count(e.id) FILTER (WHERE coalesce(e.metadata->>'platform', e.device_type) = 'desktop' AND coalesce(e.metadata->>'store', '') NOT IN ('app_store', 'ios', 'google_play', 'android')) AS desktop,
          count(e.id) FILTER (WHERE nullif(e.metadata->>'utm_medium', '') = 'paid' OR nullif(e.metadata->>'utm_campaign', '') IS NOT NULL) AS from_ads,
          count(e.id) FILTER (WHERE (nullif(e.metadata->>'utm_medium', '') IS NULL OR nullif(e.metadata->>'utm_medium', '') != 'paid') AND nullif(e.metadata->>'utm_campaign', '') IS NULL) AS organic
        FROM events_filtered e
        WHERE e.event_type = 'onboarding_app_download_click'
        GROUP BY 1
        ORDER BY day DESC
      ),
      app_downloads_sources AS (
        SELECT
          coalesce(nullif(e.metadata->>'utm_campaign', ''), '(Không gắn UTM / Tự nhiên)') AS campaign,
          CASE
            WHEN nullif(e.metadata->>'utm_source', '') IS NOT NULL THEN e.metadata->>'utm_source'
            WHEN e.referrer ILIKE '%facebook%' OR e.referrer ILIKE '%fb%' THEN 'Facebook (Tự nhiên)'
            WHEN e.referrer ILIKE '%instagram%' OR e.referrer ILIKE '%ig%' THEN 'Instagram (Tự nhiên)'
            WHEN e.referrer ILIKE '%tiktok%' THEN 'TikTok'
            WHEN e.referrer ILIKE '%zalo%' THEN 'Zalo'
            WHEN e.referrer ILIKE '%google%' THEN 'Google Search'
            WHEN e.referrer ILIKE '%botly%' THEN 'Nội bộ Botly'
            WHEN e.referrer IS NULL OR e.referrer = '' THEN 'Trực tiếp (Direct)'
            ELSE 'Nguồn khác'
          END AS source,
          coalesce(nullif(e.metadata->>'utm_medium', ''), '-') AS medium,
          coalesce(nullif(e.metadata->>'utm_content', ''), '-') AS content,
          COALESCE(e.article_slug, substring(e.path from '/(?:guides|huong-dan)/([^/?#]+)')) AS article_slug,
          coalesce(
            max(t.title),
            max(nullif(e.metadata->>'article_title', '')),
            CASE
              WHEN e.path = '/app' OR e.path = '/tai-app' OR e.path = '/download' THEN 'Landing Page Tải App Soulscape'
              WHEN e.path = '/en/wellness/healing' THEN 'Hub Chữa Lành Sanctuary (EN)'
              WHEN e.path = '/vi/song-khoe/healing' THEN 'Hub Chữa Lành Sanctuary (VI)'
              WHEN e.path = '/' THEN 'Trang Chủ Botly'
              ELSE e.path
            END
          ) AS source_title,
          e.path,
          count(e.id) AS total_clicks,
          count(DISTINCT coalesce(e.visitor_id, e.session_id, e.id::text)) AS unique_visitors,
          count(e.id) FILTER (WHERE e.metadata->>'platform' = 'ios' OR e.metadata->>'store' IN ('app_store', 'ios')) AS ios,
          count(e.id) FILTER (WHERE e.metadata->>'platform' = 'android' OR e.metadata->>'store' IN ('google_play', 'android')) AS android,
          max(to_char(e.created_at AT TIME ZONE 'Asia/Ho_Chi_Minh', 'YYYY-MM-DD HH24:MI')) AS last_click_at
        FROM events_filtered e
        LEFT JOIN public.wellness_article_translations t ON t.slug = COALESCE(e.article_slug, substring(e.path from '/(?:guides|huong-dan)/([^/?#]+)'))
        WHERE e.event_type = 'onboarding_app_download_click'
        GROUP BY 1, 2, 3, 4, 5, e.path
        ORDER BY total_clicks DESC
      ),
      app_downloads_recent AS (
        SELECT
          e.id,
          to_char(e.created_at AT TIME ZONE 'Asia/Ho_Chi_Minh', 'YYYY-MM-DD HH24:MI:SS') AS created_at_vn,
          CASE
            WHEN e.metadata->>'platform' = 'ios' OR e.metadata->>'store' IN ('app_store', 'ios') THEN 'iOS'
            WHEN e.metadata->>'platform' = 'android' OR e.metadata->>'store' IN ('google_play', 'android') THEN 'Android'
            ELSE coalesce(nullif(e.device_type, ''), 'Desktop')
          END AS platform,
          e.path,
          COALESCE(e.article_slug, substring(e.path from '/(?:guides|huong-dan)/([^/?#]+)')) AS article_slug,
          coalesce(
            max(t.title),
            max(nullif(e.metadata->>'article_title', '')),
            CASE
              WHEN e.path = '/app' OR e.path = '/tai-app' OR e.path = '/download' THEN 'Landing Page Tải App Soulscape'
              WHEN e.path = '/en/wellness/healing' THEN 'Hub Chữa Lành Sanctuary (EN)'
              WHEN e.path = '/vi/song-khoe/healing' THEN 'Hub Chữa Lành Sanctuary (VI)'
              WHEN e.path = '/' THEN 'Trang Chủ Botly'
              ELSE e.path
            END
          ) AS article_title,
          nullif(e.metadata->>'utm_campaign', '') AS utm_campaign,
          nullif(e.metadata->>'utm_source', '') AS utm_source,
          nullif(e.metadata->>'utm_medium', '') AS utm_medium,
          nullif(e.metadata->>'utm_content', '') AS utm_content,
          CASE
            WHEN e.referrer ILIKE '%facebook%' OR e.referrer ILIKE '%fb%' THEN 'Facebook'
            WHEN e.referrer ILIKE '%instagram%' OR e.referrer ILIKE '%ig%' THEN 'Instagram'
            WHEN e.referrer ILIKE '%tiktok%' THEN 'TikTok'
            WHEN e.referrer ILIKE '%zalo%' THEN 'Zalo'
            WHEN e.referrer ILIKE '%google%' THEN 'Google'
            WHEN e.referrer IS NULL OR e.referrer = '' THEN 'Direct'
            ELSE e.referrer
          END AS referrer_clean,
          e.referrer,
          coalesce(e.visitor_id, e.session_id, 'Khách ẩn danh') AS visitor_id
        FROM events_filtered e
        LEFT JOIN public.wellness_article_translations t ON t.slug = COALESCE(e.article_slug, substring(e.path from '/(?:guides|huong-dan)/([^/?#]+)'))
        WHERE e.event_type = 'onboarding_app_download_click'
        GROUP BY e.id, e.created_at, e.metadata, e.device_type, e.path, e.article_slug, e.referrer, e.visitor_id, e.session_id
        ORDER BY e.created_at DESC
        LIMIT 100
      ),
      summary_calc AS (
        SELECT
          (SELECT coalesce(sum(page_views), 0) FROM daily_merged) AS total_page_views,
          (SELECT coalesce(page_views, 0) FROM daily_merged WHERE day = to_char(now(), 'YYYY-MM-DD')) AS today_page_views,
          (SELECT coalesce(count(DISTINCT coalesce(e.visitor_id, e.session_id, e.id::text)), 0) FROM events_filtered e WHERE e.event_type = 'page_view') AS total_unique_visitors,
          (SELECT coalesce(count(DISTINCT coalesce(e.visitor_id, e.session_id, e.id::text)), 0) FROM events_filtered e WHERE e.event_type = 'page_view' AND to_char(e.created_at, 'YYYY-MM-DD') = to_char(now(), 'YYYY-MM-DD')) AS today_unique_visitors,
          (SELECT coalesce(sum(quiz_starts), 0) FROM daily_merged) AS total_quiz_starts,
          (SELECT coalesce(quiz_starts, 0) FROM daily_merged WHERE day = to_char(now(), 'YYYY-MM-DD')) AS today_quiz_starts,
          (SELECT coalesce(sum(quiz_completions), 0) FROM daily_merged) AS total_quiz_completions,
          (SELECT coalesce(quiz_completions, 0) FROM daily_merged WHERE day = to_char(now(), 'YYYY-MM-DD')) AS today_quiz_completions,
          (SELECT coalesce(sum(ebook_downloads), 0) FROM daily_merged) AS total_ebook_downloads,
          (SELECT coalesce(ebook_downloads, 0) FROM daily_merged WHERE day = to_char(now(), 'YYYY-MM-DD')) AS today_ebook_downloads,
          (SELECT coalesce(count(*), 0) FROM events_filtered WHERE event_type IN ('ebook_download', 'ebook_downloaded') AND coalesce(metadata->>'method', '') != 'unlocked') AS ebook_direct_downloads,
          (SELECT coalesce(count(*), 0) FROM events_filtered WHERE event_type = 'ebook_download_unlocked' OR coalesce(metadata->>'method', '') = 'unlocked') AS ebook_unlock_downloads,
          (SELECT coalesce(count(*), 0) FROM events_filtered WHERE event_type = 'onboarding_app_download_click') AS total_app_clicks,
          (SELECT coalesce(count(*), 0) FROM events_filtered WHERE event_type = 'onboarding_app_download_click' AND created_at >= date_trunc('day', now())) AS today_app_clicks,
          (SELECT coalesce(count(*), 0) FROM events_filtered WHERE event_type = 'onboarding_app_download_click' AND (metadata->>'store' = 'app_store' OR metadata->>'store' = 'ios' OR metadata->>'platform' = 'ios')) AS app_clicks_ios,
          (SELECT coalesce(count(*), 0) FROM events_filtered WHERE event_type = 'onboarding_app_download_click' AND (metadata->>'store' = 'google_play' OR metadata->>'store' = 'android' OR metadata->>'platform' = 'android')) AS app_clicks_android,
          (SELECT count(*) FROM public.newsletter_subscribers) AS total_subscribers,
          (SELECT count(*) FROM public.newsletter_subscribers WHERE source LIKE 'safety_quiz_%') AS quiz_subscribers,
          (SELECT count(*) FROM public.newsletter_subscribers WHERE source LIKE 'somatic_haven_%') AS somatic_subscribers,
          (SELECT count(*) FROM public.newsletter_subscribers WHERE source LIKE '%ebook%') AS ebook_subscribers,
          (SELECT count(*) FROM public.newsletter_subscribers WHERE source NOT LIKE 'safety_quiz_%' AND source NOT LIKE 'somatic_haven_%' AND source NOT LIKE '%ebook%') AS home_subscribers,
          (SELECT count(*) FROM public.newsletter_subscribers WHERE consented_at >= date_trunc('day', now())) AS today_subscribers
      )
      SELECT jsonb_build_object(
        'summary', jsonb_build_object(
          'total_page_views', sc.total_page_views,
          'today_page_views', sc.today_page_views,
          'total_unique_visitors', sc.total_unique_visitors,
          'today_unique_visitors', sc.today_unique_visitors,
          'views_per_visitor', CASE WHEN sc.total_unique_visitors > 0 THEN round((sc.total_page_views::numeric / sc.total_unique_visitors::numeric), 1) ELSE 1.0 END,
          'total_quiz_starts', sc.total_quiz_starts,
          'today_quiz_starts', sc.today_quiz_starts,
          'total_quiz_completions', sc.total_quiz_completions,
          'today_quiz_completions', sc.today_quiz_completions,
          'total_quiz_in_progress', greatest(sc.total_quiz_starts - sc.total_quiz_completions, 0),
          'quiz_drop_off_rate', CASE WHEN sc.total_quiz_starts > 0 THEN round((greatest(sc.total_quiz_starts - sc.total_quiz_completions, 0)::numeric / sc.total_quiz_starts::numeric) * 100, 1) ELSE 0 END,
          'quiz_completion_rate', CASE WHEN sc.total_quiz_starts > 0 THEN round((sc.total_quiz_completions::numeric / sc.total_quiz_starts::numeric) * 100, 1) ELSE 0 END,
          'total_ebook_downloads', sc.total_ebook_downloads,
          'today_ebook_downloads', sc.today_ebook_downloads,
          'ebook_direct_downloads', sc.ebook_direct_downloads,
          'ebook_unlock_downloads', sc.ebook_unlock_downloads,
          'ebook_subscribers', sc.ebook_subscribers,
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
        'ebooks', (SELECT coalesce(jsonb_agg(to_jsonb(eb)), '[]'::jsonb) FROM ebook_breakdown eb),
        'recent_ebooks', (SELECT coalesce(jsonb_agg(to_jsonb(re)), '[]'::jsonb) FROM recent_ebook_downloads re),
        'subscribers', (SELECT coalesce(jsonb_agg(to_jsonb(sd)), '[]'::jsonb) FROM subscribers_data sd),
        'devices', (SELECT coalesce(jsonb_agg(to_jsonb(ds)), '[]'::jsonb) FROM device_stats ds),
        'referrers', (SELECT coalesce(jsonb_agg(to_jsonb(rs)), '[]'::jsonb) FROM referrer_stats rs),
        'recent_quizzes', (SELECT coalesce(jsonb_agg(to_jsonb(rq)), '[]'::jsonb) FROM recent_quizzes rq),
        'app_downloads_daily', (SELECT coalesce(jsonb_agg(to_jsonb(ad)), '[]'::jsonb) FROM app_downloads_daily ad),
        'app_downloads_sources', (SELECT coalesce(jsonb_agg(to_jsonb(asrc)), '[]'::jsonb) FROM app_downloads_sources asrc),
        'app_downloads_recent', (SELECT coalesce(jsonb_agg(to_jsonb(ar)), '[]'::jsonb) FROM app_downloads_recent ar)
      ) INTO v_result
      FROM summary_calc sc;

      RETURN v_result;
    END;
$function$;
`;

async function main() {
  await client.connect();
  console.log('Deploying updated get_admin_analytics...');
  await client.query(updatedFunctionSql);
  console.log('Successfully updated function get_admin_analytics!');

  // Test calling the updated function
  const testRes = await client.query('SELECT public.get_admin_analytics(30) as res;');
  const data = testRes.rows[0].res;
  console.log('\nTest Call Results:');
  console.log('- app_downloads_daily count:', data.app_downloads_daily?.length);
  console.log('- app_downloads_sources count:', data.app_downloads_sources?.length);
  console.log('- app_downloads_recent count:', data.app_downloads_recent?.length);
  console.log('\nTop 3 Daily:');
  console.table(data.app_downloads_daily?.slice(0, 3));
  console.log('\nTop 3 Sources:');
  console.table(data.app_downloads_sources?.slice(0, 3));
  console.log('\nTop 3 Recent:');
  console.table(data.app_downloads_recent?.slice(0, 3));

  await client.end();
}

main().catch(err => {
  console.error('Error deploying function:', err);
  process.exit(1);
});
