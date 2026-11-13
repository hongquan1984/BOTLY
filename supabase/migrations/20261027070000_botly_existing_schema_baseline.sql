--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: growth; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA growth;


--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA IF NOT EXISTS public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: capture_ebook_lead(text, text, text, text, text, boolean, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.capture_ebook_lead(p_email text, p_name text, p_ebook_id text, p_locale text, p_source_page text, p_marketing boolean, p_bucket_hash text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $_$
declare v_ebook public.wellness_ebooks; v_lead public.ebook_email_leads; v_attempts integer;
begin
 if p_email is null or length(p_email)>254 or p_email !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
  raise exception using message='INVALID_EMAIL',errcode='P0001'; end if;
 if p_locale not in ('en','vi') then raise exception using message='INVALID_INPUT',errcode='P0001'; end if;
 insert into public.ebook_download_rate_limits values(p_bucket_hash,now(),1)
 on conflict(bucket_hash) do update set attempts=case when ebook_download_rate_limits.window_start < now()-interval '1 hour' then 1 else ebook_download_rate_limits.attempts+1 end,
 window_start=case when ebook_download_rate_limits.window_start < now()-interval '1 hour' then now() else ebook_download_rate_limits.window_start end
 returning attempts into v_attempts;
 if v_attempts>8 then raise exception using message='RATE_LIMITED',errcode='P0001'; end if;
 select * into v_ebook from public.wellness_ebooks where id=p_ebook_id and status='published';
 if not found then raise exception using message='EBOOK_NOT_FOUND',errcode='P0001'; end if;
 if v_ebook.downloadable_file_url is null or not v_ebook.redistribution_allowed then
  raise exception using message='LINK_OUT_ONLY',errcode='P0001'; end if;
 insert into public.ebook_email_leads(email,name,ebook_id,locale,source_page,marketing_consent_at)
 values(lower(trim(p_email)),nullif(trim(p_name),''),p_ebook_id,p_locale,left(coalesce(p_source_page,''),300),case when p_marketing then now() else null end)
 on conflict(email,ebook_id) do update set name=coalesce(excluded.name,ebook_email_leads.name),source_page=excluded.source_page,
  marketing_consent_at=coalesce(ebook_email_leads.marketing_consent_at,excluded.marketing_consent_at)
 returning * into v_lead;
 insert into public.ebook_download_logs(lead_id,ebook_id,source_page,event)
 values(v_lead.id,p_ebook_id,left(coalesce(p_source_page,''),300),'unlocked');
 if p_marketing then
  insert into public.newsletter_subscribers(email,locale,source,consented_at,status)
  values(lower(trim(p_email)),p_locale,'ebook:'||p_ebook_id,now(),'active')
  on conflict(email,locale) do update set source=excluded.source,consented_at=excluded.consented_at,status='active';
 end if;
 return jsonb_build_object('ok',true,'download_url',case when v_ebook.downloadable_file_url like 'private:%' then 'email-gated' else v_ebook.downloadable_file_url end,'lead_id',v_lead.id);
end; $_$;


--
-- Name: get_admin_analytics(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_admin_analytics(p_days integer DEFAULT 30) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
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
$$;


--
-- Name: get_ebook_admin_summary(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_ebook_admin_summary() RETURNS jsonb
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO ''
    AS $$
 select jsonb_build_object(
  'ebook_total',(select count(*) from public.wellness_ebooks where status='published'),
  'ebook_hosted',(select count(*) from public.wellness_ebooks where status='published' and downloadable_file_url is not null and redistribution_allowed),
  'ebook_link_out',(select count(*) from public.wellness_ebooks where status='published' and source_url is not null and downloadable_file_url is null),
  'ebook_pending',(select count(*) from public.wellness_ebooks where status='draft'),
  'leads_total',(select count(*) from public.ebook_email_leads),
  'leads_today',(select count(*) from public.ebook_email_leads where created_at>=date_trunc('day',now())),
  'downloads_today',(select count(*) from public.ebook_download_logs where event='downloaded' and created_at>=date_trunc('day',now())),
  'page_views_total',(select count(*) from public.ebook_page_views),
  'articles_published',(select count(*) from public.wellness_article_translations where locale='en' and status='published' and published_at<=now()),
  'articles_queued',(select count(*) from public.content_generation_queue where status in ('queued','review','draft')),
  'leads_by_ebook',(select coalesce(jsonb_agg(x),'[]'::jsonb) from (
    select e.id,e.public_display_title,count(distinct l.id) as leads,
      (select count(*) from public.ebook_download_logs d where d.ebook_id=e.id and d.event='downloaded') as downloads,
      (select count(*) from public.ebook_page_views v where v.ebook_id=e.id) as views,
      case when (select count(*) from public.ebook_page_views v where v.ebook_id=e.id)>0
        then round(count(distinct l.id)::numeric*100/(select count(*) from public.ebook_page_views v where v.ebook_id=e.id),1)
        else 0 end as conversion_rate
    from public.wellness_ebooks e left join public.ebook_email_leads l on l.ebook_id=e.id
    where e.status='published' group by e.id,e.public_display_title order by leads desc limit 20
  ) x),
  'leads_by_article',(select coalesce(jsonb_agg(x),'[]'::jsonb) from (
    select source_page,count(*) as leads from public.ebook_email_leads
    where source_page like '%/guides/%' group by source_page order by leads desc limit 20
  ) x),
  'recent_schedule',(select coalesce(jsonb_agg(x),'[]'::jsonb) from (
    select scheduled_for,status,topic_angle,source_ebook_id from public.content_generation_queue
    order by scheduled_for desc limit 14
  ) x)
 );
$$;


--
-- Name: publish_wellness_article(text, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.publish_wellness_article(p_token_hash text, p_payload jsonb) RETURNS jsonb
    LANGUAGE plpgsql
    SET search_path TO ''
    AS $$
declare
  v_channel public.wellness_channels;
  v_article public.wellness_articles;
  v_old public.wellness_article_translations;
  v_new public.wellness_article_translations;
  v_input jsonb;
  v_merged jsonb;
  v_result jsonb := '[]'::jsonb;
  v_created boolean := false;
  v_count integer;
  v_constraint text;
begin
  -- Locks serialize writes for a channel and token revocation with publishing.
  select c.* into v_channel from public.wellness_channels c
    join public.wellness_channel_tokens t on t.channel_id = c.id
    where t.token_hash = p_token_hash and t.revoked_at is null
    for update of c, t;
  if not found then raise exception using message = 'UNAUTHORIZED', errcode = 'P0001'; end if;
  if not v_channel.enabled or v_channel.facebook_page_id <> p_payload->>'facebook_page_id' then
    raise exception using message = 'CHANNEL_FORBIDDEN', errcode = 'P0001';
  end if;

  insert into public.wellness_publish_limits values (v_channel.id, now(), 1)
    on conflict (channel_id) do update set
      requests = case when wellness_publish_limits.window_start <= now() - interval '1 minute'
        then 1 else wellness_publish_limits.requests + 1 end,
      window_start = case when wellness_publish_limits.window_start <= now() - interval '1 minute'
        then now() else wellness_publish_limits.window_start end
    returning requests into v_count;
  if v_count > 30 then raise exception using message = 'RATE_LIMITED', errcode = 'P0001'; end if;

  select * into v_article from public.wellness_articles
    where channel_id = v_channel.id and facebook_post_id = p_payload->>'facebook_post_id';
  if not found then
    insert into public.wellness_articles (category_id, channel_id, facebook_post_id, facebook_url,
      facebook_published_at, cover_image_url)
      values (v_channel.category_id, v_channel.id, p_payload->>'facebook_post_id',
        p_payload->>'facebook_url', (p_payload->>'facebook_published_at')::timestamptz,
        p_payload->>'cover_image_url') returning * into v_article;
    v_created := true;
  else
    update public.wellness_articles set facebook_url = p_payload->>'facebook_url',
      facebook_published_at = case when p_payload ? 'facebook_published_at'
        then (p_payload->>'facebook_published_at')::timestamptz else facebook_published_at end,
      cover_image_url = case when p_payload ? 'cover_image_url'
        then p_payload->>'cover_image_url' else cover_image_url end
      where id = v_article.id returning * into v_article;
  end if;

  for v_input in select value from jsonb_array_elements(p_payload->'translations') loop
    -- Normalize midnight_faqs into faqs if faqs is not provided
    if (v_input ? 'midnight_faqs') and not (v_input ? 'faqs') then
      v_input := v_input || jsonb_build_object('faqs', v_input->'midnight_faqs');
    end if;

    select * into v_old from public.wellness_article_translations
      where article_id = v_article.id and locale = v_input->>'locale';
    if found then
      if v_old.slug <> v_input->>'slug' then
        raise exception using message = 'SLUG_IMMUTABLE', errcode = 'P0001';
      end if;
      if v_old.published_at is not null and v_input ? 'published_at'
        and v_old.published_at <> (v_input->>'published_at')::timestamptz then
        raise exception using message = 'PUBLICATION_TIME_IMMUTABLE', errcode = 'P0001';
      end if;
      v_merged := to_jsonb(v_old) || v_input;
    else
      v_merged := jsonb_build_object('article_id', v_article.id, 'eyebrow', '', 'takeaway', '',
        'sources', '[]'::jsonb, 'cover_image_alt', '', 'status', 'draft', 'created_at', now(),
        'updated_at', now()) || v_input;
    end if;
    if v_input ? 'published_at' and v_merged->>'status' <> 'published' then
      raise exception using message = 'INVALID_PUBLICATION_STATUS', errcode = 'P0001';
    end if;
    if v_merged->>'status' = 'published' and v_merged->>'published_at' is null then
      v_merged := v_merged || jsonb_build_object('published_at', now());
    end if;
    v_new := jsonb_populate_record(null::public.wellness_article_translations, v_merged);
    insert into public.wellness_article_translations select v_new.*
      on conflict (article_id, locale) do update set
        title = excluded.title, description = excluded.description, eyebrow = excluded.eyebrow,
        takeaway = excluded.takeaway, sections = excluded.sections, sources = excluded.sources,
        cover_image_alt = excluded.cover_image_alt, reading_minutes = excluded.reading_minutes,
        evidence = excluded.evidence, reviewed_at = excluded.reviewed_at, tool = excluded.tool,
        seo_title = excluded.seo_title, seo_description = excluded.seo_description,
        status = excluded.status, published_at = excluded.published_at,
        trust_meter = excluded.trust_meter, quick_recipe = excluded.quick_recipe,
        fact_checks = excluded.fact_checks, faqs = excluded.faqs,
        safety_quiz = excluded.safety_quiz,
        somatic_signals = excluded.somatic_signals,
        winddown_protocol = excluded.winddown_protocol,
        mind_traps = excluded.mind_traps,
        somatic_quiz = excluded.somatic_quiz,
        midnight_faqs = excluded.midnight_faqs;
    v_result := v_result || jsonb_build_array(jsonb_build_object('locale', v_new.locale,
      'slug', v_new.slug, 'status', v_new.status, 'published_at', v_new.published_at,
      'visible', coalesce(v_new.status = 'published' and v_new.published_at <= now(), false)));
  end loop;
  return jsonb_build_object('ok', true, 'action', case when v_created then 'created' else 'updated' end,
    'article_id', v_article.id, 'category_id', v_channel.category_id,
    'facebook_page_id', v_channel.facebook_page_id, 'facebook_post_id', v_article.facebook_post_id,
    'translations', v_result);
exception when unique_violation then
  get stacked diagnostics v_constraint = CONSTRAINT_NAME;
  if v_constraint = 'wellness_article_translations_locale_slug_key' then
    raise exception using message = 'SLUG_CONFLICT', errcode = 'P0001';
  end if;
  raise;
end;
$$;


--
-- Name: rls_auto_enable(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rls_auto_enable() RETURNS event_trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


--
-- Name: set_ebook_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_ebook_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO ''
    AS $$
begin
 new.updated_at = now();
 return new;
end; $$;


--
-- Name: set_wellness_article_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_wellness_article_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO ''
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: growth_agent_runs; Type: TABLE; Schema: growth; Owner: -
--

CREATE TABLE growth.growth_agent_runs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    run_id text NOT NULL,
    correlation_id text,
    agent_id uuid,
    workflow_type text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    input_reference jsonb,
    output_reference jsonb,
    error_category text,
    retry_count integer DEFAULT 0,
    estimated_cost numeric(10,4) DEFAULT 0.0000,
    actual_cost numeric(10,4) DEFAULT 0.0000,
    prompt_version text,
    model_version text,
    started_at timestamp with time zone DEFAULT now(),
    finished_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT growth_agent_runs_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'running'::text, 'completed'::text, 'failed'::text, 'paused'::text])))
);


--
-- Name: growth_agent_tasks; Type: TABLE; Schema: growth; Owner: -
--

CREATE TABLE growth.growth_agent_tasks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    task_id text NOT NULL,
    parent_task_id text,
    agent_id text NOT NULL,
    role text NOT NULL,
    action_type text NOT NULL,
    priority integer DEFAULT 50 NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    dependencies text[] DEFAULT '{}'::text[],
    input_params jsonb DEFAULT '{}'::jsonb,
    output_result jsonb DEFAULT '{}'::jsonb,
    error_details text,
    retry_count integer DEFAULT 0,
    max_retries integer DEFAULT 3,
    scheduled_for timestamp with time zone DEFAULT now(),
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    cost_usd numeric(10,4) DEFAULT 0.0000,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT growth_agent_tasks_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'running'::text, 'completed'::text, 'failed'::text, 'blocked'::text, 'cancelled'::text])))
);


--
-- Name: growth_agents; Type: TABLE; Schema: growth; Owner: -
--

CREATE TABLE growth.growth_agents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    role text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    configuration jsonb DEFAULT '{}'::jsonb,
    version text DEFAULT '1.0.0'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT growth_agents_status_check CHECK ((status = ANY (ARRAY['active'::text, 'paused'::text, 'disabled'::text])))
);


--
-- Name: growth_alerts; Type: TABLE; Schema: growth; Owner: -
--

CREATE TABLE growth.growth_alerts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    severity text NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    error_category text,
    context jsonb DEFAULT '{}'::jsonb,
    resolved boolean DEFAULT false,
    resolved_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT growth_alerts_severity_check CHECK ((severity = ANY (ARRAY['INFO'::text, 'WARNING'::text, 'ERROR'::text, 'CRITICAL'::text])))
);


--
-- Name: growth_approvals; Type: TABLE; Schema: growth; Owner: -
--

CREATE TABLE growth.growth_approvals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    entity_type text NOT NULL,
    entity_id uuid NOT NULL,
    action_requested text NOT NULL,
    requested_by text DEFAULT 'system'::text,
    status text DEFAULT 'PENDING'::text,
    approved_by text,
    approved_at timestamp with time zone,
    rejection_reason text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT growth_approvals_status_check CHECK ((status = ANY (ARRAY['PENDING'::text, 'APPROVED'::text, 'REJECTED'::text, 'CANCELLED'::text])))
);


--
-- Name: growth_audit_logs; Type: TABLE; Schema: growth; Owner: -
--

CREATE TABLE growth.growth_audit_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    actor text DEFAULT 'system'::text NOT NULL,
    action text NOT NULL,
    entity_type text,
    entity_id uuid,
    changes jsonb DEFAULT '{}'::jsonb,
    ip_address text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: growth_channels; Type: TABLE; Schema: growth; Owner: -
--

CREATE TABLE growth.growth_channels (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    channel_name text NOT NULL,
    is_enabled boolean DEFAULT true,
    daily_quota integer DEFAULT 3,
    current_daily_count integer DEFAULT 0,
    quota_reset_at timestamp with time zone DEFAULT (now() + '1 day'::interval),
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: growth_code_changes; Type: TABLE; Schema: growth; Owner: -
--

CREATE TABLE growth.growth_code_changes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    change_id text NOT NULL,
    agent_id text DEFAULT 'software-engineer'::text NOT NULL,
    module text NOT NULL,
    change_type text NOT NULL,
    risk_tier text NOT NULL,
    root_cause text NOT NULL,
    evidence text NOT NULL,
    file_path text NOT NULL,
    git_branch text,
    commit_hash text,
    previous_snippet text,
    proposed_snippet text,
    automated_tests jsonb DEFAULT '[]'::jsonb,
    test_result text DEFAULT 'PASS'::text,
    deployment_status text DEFAULT 'DEPLOYED'::text NOT NULL,
    rollback_supported boolean DEFAULT true,
    rollback_status text DEFAULT 'NONE'::text,
    expected_impact text,
    actual_measured_impact text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT growth_code_changes_change_type_check CHECK ((change_type = ANY (ARRAY['prompt_optimization'::text, 'parameter_tuning'::text, 'scheduling_algorithm'::text, 'ranking_model'::text, 'bug_fix'::text, 'conversion_component'::text, 'query_optimization'::text]))),
    CONSTRAINT growth_code_changes_deployment_status_check CHECK ((deployment_status = ANY (ARRAY['PROPOSED'::text, 'TESTING'::text, 'DEPLOYED'::text, 'REVERTED'::text, 'REJECTED'::text]))),
    CONSTRAINT growth_code_changes_risk_tier_check CHECK ((risk_tier = ANY (ARRAY['LOW'::text, 'MEDIUM'::text, 'HIGH'::text]))),
    CONSTRAINT growth_code_changes_rollback_status_check CHECK ((rollback_status = ANY (ARRAY['NONE'::text, 'ARMED'::text, 'ROLLED_BACK'::text]))),
    CONSTRAINT growth_code_changes_test_result_check CHECK ((test_result = ANY (ARRAY['PASS'::text, 'FAIL'::text, 'SKIPPED'::text])))
);


--
-- Name: growth_content_assets; Type: TABLE; Schema: growth; Owner: -
--

CREATE TABLE growth.growth_content_assets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    brief_id uuid,
    channel text DEFAULT 'pinterest'::text NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    image_headline text NOT NULL,
    image_subheadline text,
    alt_text text,
    cta text NOT NULL,
    target_keywords text[] DEFAULT '{}'::text[],
    board_category text,
    destination_url text NOT NULL,
    utm_source text DEFAULT 'pinterest'::text,
    utm_medium text DEFAULT 'organic'::text,
    utm_campaign text NOT NULL,
    utm_content text NOT NULL,
    prompt_version text,
    model_version text,
    qa_status text DEFAULT 'PENDING'::text,
    qa_feedback jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT growth_content_assets_qa_status_check CHECK ((qa_status = ANY (ARRAY['PENDING'::text, 'PASS'::text, 'NEEDS_REVISION'::text, 'NEEDS_HUMAN_REVIEW'::text, 'REJECTED'::text])))
);


--
-- Name: growth_content_briefs; Type: TABLE; Schema: growth; Owner: -
--

CREATE TABLE growth.growth_content_briefs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    topic_id uuid NOT NULL,
    audience_problem text NOT NULL,
    intended_benefit text NOT NULL,
    search_intent text,
    content_angle text,
    core_message text NOT NULL,
    supporting_evidence text[] DEFAULT '{}'::text[],
    suggested_image_style text DEFAULT 'minimalist_infographic'::text,
    suggested_board text DEFAULT 'Sleep Routine & Hacks'::text,
    recommended_cta text DEFAULT 'Take the 2-Minute Sleep Quiz'::text,
    destination_url text NOT NULL,
    risk_classification text DEFAULT 'low'::text,
    content_variants jsonb DEFAULT '[]'::jsonb,
    quality_requirements jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT growth_content_briefs_risk_classification_check CHECK ((risk_classification = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text])))
);


--
-- Name: growth_conversion_events; Type: TABLE; Schema: growth; Owner: -
--

CREATE TABLE growth.growth_conversion_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_name text NOT NULL,
    utm_source text DEFAULT 'pinterest'::text,
    utm_medium text DEFAULT 'organic'::text,
    utm_campaign text,
    utm_content text,
    remote_pin_id text,
    visitor_id text,
    session_id text,
    metadata jsonb DEFAULT '{}'::jsonb,
    occurred_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT growth_conversion_events_event_name_check CHECK ((event_name = ANY (ARRAY['landing_page_view'::text, 'quiz_start'::text, 'quiz_complete'::text, 'app_store_click'::text, 'app_first_open'::text, 'app_activation'::text])))
);


--
-- Name: growth_daily_reports; Type: TABLE; Schema: growth; Owner: -
--

CREATE TABLE growth.growth_daily_reports (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    report_type text DEFAULT 'daily'::text NOT NULL,
    report_date date NOT NULL,
    executive_summary text NOT NULL,
    metrics_snapshot jsonb DEFAULT '{}'::jsonb NOT NULL,
    top_opportunities jsonb DEFAULT '[]'::jsonb NOT NULL,
    top_risks jsonb DEFAULT '[]'::jsonb NOT NULL,
    actions_taken jsonb DEFAULT '[]'::jsonb NOT NULL,
    next_planned_actions jsonb DEFAULT '[]'::jsonb NOT NULL,
    recommendations_for_owner jsonb DEFAULT '[]'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT growth_daily_reports_report_type_check CHECK ((report_type = ANY (ARRAY['daily'::text, 'weekly'::text, 'monthly'::text])))
);


--
-- Name: growth_experiment_assignments; Type: TABLE; Schema: growth; Owner: -
--

CREATE TABLE growth.growth_experiment_assignments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    experiment_id uuid NOT NULL,
    variant_id uuid NOT NULL,
    entity_type text NOT NULL,
    entity_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: growth_experiment_variants; Type: TABLE; Schema: growth; Owner: -
--

CREATE TABLE growth.growth_experiment_variants (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    experiment_id uuid NOT NULL,
    variant_code text NOT NULL,
    is_control boolean DEFAULT false,
    config_parameters jsonb DEFAULT '{}'::jsonb,
    sample_count integer DEFAULT 0,
    performance_score numeric(8,4) DEFAULT 0.0000,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: growth_experiments; Type: TABLE; Schema: growth; Owner: -
--

CREATE TABLE growth.growth_experiments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code text NOT NULL,
    hypothesis text NOT NULL,
    baseline_description text NOT NULL,
    candidate_description text NOT NULL,
    target_segment text DEFAULT 'Insomnia Discovery'::text,
    primary_metric text NOT NULL,
    secondary_metrics text[] DEFAULT '{}'::text[],
    guardrail_metrics text[] DEFAULT '{}'::text[],
    start_date timestamp with time zone DEFAULT now(),
    evaluation_date timestamp with time zone,
    minimum_sample_size integer DEFAULT 100,
    stopping_rule text DEFAULT 'Significant outbound click difference at 95% confidence or 14 days elapsed'::text,
    status text DEFAULT 'PLANNED'::text,
    result text,
    decision text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT growth_experiments_status_check CHECK ((status = ANY (ARRAY['PLANNED'::text, 'RUNNING'::text, 'COMPLETED'::text, 'CONCLUDED'::text, 'TERMINATED'::text])))
);


--
-- Name: growth_goals; Type: TABLE; Schema: growth; Owner: -
--

CREATE TABLE growth.growth_goals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code text NOT NULL,
    title text NOT NULL,
    target_metric text NOT NULL,
    baseline_value numeric(12,4) DEFAULT 0.0000 NOT NULL,
    target_value numeric(12,4) NOT NULL,
    current_value numeric(12,4) DEFAULT 0.0000 NOT NULL,
    unit text DEFAULT 'count'::text NOT NULL,
    horizon_days integer DEFAULT 30 NOT NULL,
    deadline timestamp with time zone,
    status text DEFAULT 'in_progress'::text NOT NULL,
    strategic_rationale text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT growth_goals_status_check CHECK ((status = ANY (ARRAY['in_progress'::text, 'achieved'::text, 'at_risk'::text, 'missed'::text, 'paused'::text])))
);


--
-- Name: growth_insights; Type: TABLE; Schema: growth; Owner: -
--

CREATE TABLE growth.growth_insights (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    insight_key text NOT NULL,
    domain text NOT NULL,
    title text NOT NULL,
    observation text NOT NULL,
    evidence jsonb DEFAULT '{}'::jsonb,
    confidence numeric(5,2) DEFAULT 80.00,
    decay_rate numeric(5,2) DEFAULT 0.05,
    impact_tier text DEFAULT 'medium'::text,
    actionable_recommendation text,
    status text DEFAULT 'active'::text,
    expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT growth_insights_domain_check CHECK ((domain = ANY (ARRAY['market'::text, 'platform'::text, 'content'::text, 'funnel'::text, 'retention'::text, 'monetization'::text, 'system'::text]))),
    CONSTRAINT growth_insights_impact_tier_check CHECK ((impact_tier = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'critical'::text]))),
    CONSTRAINT growth_insights_status_check CHECK ((status = ANY (ARRAY['active'::text, 'applied'::text, 'invalidated'::text, 'expired'::text])))
);


--
-- Name: growth_media_assets; Type: TABLE; Schema: growth; Owner: -
--

CREATE TABLE growth.growth_media_assets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    content_asset_id uuid,
    platform text DEFAULT 'pinterest'::text NOT NULL,
    filename text NOT NULL,
    relative_file_path text NOT NULL,
    storage_provider text DEFAULT 'local_disk'::text NOT NULL,
    mime_type text DEFAULT 'image/png'::text NOT NULL,
    file_size_bytes bigint NOT NULL,
    checksum_sha256 text NOT NULL,
    generation_prompt text,
    publication_status text DEFAULT 'draft'::text NOT NULL,
    related_post_id text,
    dimensions_width integer DEFAULT 1000,
    dimensions_height integer DEFAULT 1500,
    thumbnail_relative_path text,
    public_serving_url text,
    analytics_metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT growth_media_assets_platform_check CHECK ((platform = ANY (ARRAY['pinterest'::text, 'instagram'::text, 'tiktok'::text, 'youtube'::text, 'general'::text]))),
    CONSTRAINT growth_media_assets_publication_status_check CHECK ((publication_status = ANY (ARRAY['draft'::text, 'scheduled'::text, 'publishing'::text, 'published'::text, 'verified'::text, 'archived'::text])))
);


--
-- Name: growth_metric_snapshots; Type: TABLE; Schema: growth; Owner: -
--

CREATE TABLE growth.growth_metric_snapshots (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    job_id uuid,
    channel text DEFAULT 'pinterest'::text NOT NULL,
    remote_id text NOT NULL,
    impressions integer DEFAULT 0,
    saves integer DEFAULT 0,
    outbound_clicks integer DEFAULT 0,
    pin_clicks integer DEFAULT 0,
    captured_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: growth_optimization_decisions; Type: TABLE; Schema: growth; Owner: -
--

CREATE TABLE growth.growth_optimization_decisions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    decision_type text NOT NULL,
    context text,
    reason text NOT NULL,
    expected_benefit text,
    actual_measured_benefit text,
    promoted_parameters jsonb DEFAULT '{}'::jsonb,
    previous_parameters jsonb DEFAULT '{}'::jsonb,
    rollback_supported boolean DEFAULT true,
    rolled_back boolean DEFAULT false,
    rolled_back_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: growth_pinterest_boards; Type: TABLE; Schema: growth; Owner: -
--

CREATE TABLE growth.growth_pinterest_boards (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    board_id text NOT NULL,
    board_name text NOT NULL,
    category text,
    is_active boolean DEFAULT true,
    pin_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: growth_prompt_evaluations; Type: TABLE; Schema: growth; Owner: -
--

CREATE TABLE growth.growth_prompt_evaluations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    prompt_id uuid NOT NULL,
    evaluation_dataset text NOT NULL,
    score numeric(5,2) NOT NULL,
    benchmark_baseline_score numeric(5,2),
    metrics jsonb DEFAULT '{}'::jsonb,
    notes text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: growth_prompt_versions; Type: TABLE; Schema: growth; Owner: -
--

CREATE TABLE growth.growth_prompt_versions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    prompt_name text NOT NULL,
    version text NOT NULL,
    purpose text NOT NULL,
    content text NOT NULL,
    model text NOT NULL,
    active_status boolean DEFAULT false,
    rollback_reference text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: growth_publishing_attempts; Type: TABLE; Schema: growth; Owner: -
--

CREATE TABLE growth.growth_publishing_attempts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    job_id uuid NOT NULL,
    attempt_number integer NOT NULL,
    request_payload jsonb,
    response_payload jsonb,
    error_category text,
    error_message text,
    status_code integer,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: growth_publishing_jobs; Type: TABLE; Schema: growth; Owner: -
--

CREATE TABLE growth.growth_publishing_jobs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    content_asset_id uuid,
    media_asset_id uuid,
    channel text DEFAULT 'pinterest'::text NOT NULL,
    target_board_id text NOT NULL,
    scheduled_for timestamp with time zone NOT NULL,
    status text DEFAULT 'DRAFT'::text NOT NULL,
    idempotency_key text NOT NULL,
    remote_pin_id text,
    remote_url text,
    retry_count integer DEFAULT 0,
    max_retries integer DEFAULT 3,
    locked_at timestamp with time zone,
    locked_by text,
    approval_required boolean DEFAULT true,
    approved_at timestamp with time zone,
    approved_by text,
    published_at timestamp with time zone,
    verified_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT growth_publishing_jobs_status_check CHECK ((status = ANY (ARRAY['DRAFT'::text, 'VALIDATED'::text, 'APPROVED'::text, 'SCHEDULED'::text, 'PUBLISHING'::text, 'PUBLISHED'::text, 'VERIFIED'::text, 'FAILED_RETRYABLE'::text, 'FAILED_PERMANENT'::text, 'WAITING_FOR_CREDENTIALS'::text, 'WAITING_FOR_APPROVAL'::text, 'CANCELLED'::text])))
);


--
-- Name: growth_strategy_versions; Type: TABLE; Schema: growth; Owner: -
--

CREATE TABLE growth.growth_strategy_versions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    version text NOT NULL,
    topic_weights jsonb NOT NULL,
    creative_style_distribution jsonb NOT NULL,
    posting_windows jsonb NOT NULL,
    board_allocation jsonb NOT NULL,
    active_status boolean DEFAULT false,
    notes text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: growth_system_settings; Type: TABLE; Schema: growth; Owner: -
--

CREATE TABLE growth.growth_system_settings (
    key text NOT NULL,
    value jsonb NOT NULL,
    description text,
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: growth_topics; Type: TABLE; Schema: growth; Owner: -
--

CREATE TABLE growth.growth_topics (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    normalized_topic text NOT NULL,
    target_audience text DEFAULT 'People suffering from nighttime anxiety & insomnia'::text,
    primary_keyword text NOT NULL,
    supporting_keywords text[] DEFAULT '{}'::text[],
    search_intent text DEFAULT 'informational'::text,
    content_angle text,
    funnel_stage text DEFAULT 'discovery'::text,
    destination_page text DEFAULT 'https://www.botly.vn/quiz-insomnia'::text,
    evidence_sources jsonb DEFAULT '[]'::jsonb,
    estimated_priority numeric(5,2) DEFAULT 50.00,
    confidence numeric(5,2) DEFAULT 70.00,
    duplication_score numeric(5,2) DEFAULT 0.00,
    status text DEFAULT 'discovered'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT growth_topics_funnel_stage_check CHECK ((funnel_stage = ANY (ARRAY['discovery'::text, 'engagement'::text, 'quiz_intent'::text, 'app_intent'::text]))),
    CONSTRAINT growth_topics_status_check CHECK ((status = ANY (ARRAY['discovered'::text, 'prioritized'::text, 'briefed'::text, 'published'::text, 'archived'::text])))
);


--
-- Name: analytics_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.analytics_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_type text NOT NULL,
    path text NOT NULL,
    article_slug text,
    locale text DEFAULT 'vi'::text,
    referrer text,
    device_type text,
    session_id text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    visitor_id text
);


--
-- Name: content_generation_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.content_generation_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    task_type text NOT NULL,
    status text NOT NULL,
    internal_note_vi text DEFAULT ''::text NOT NULL,
    source_ebook_id text,
    article_id uuid,
    scheduled_for timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT content_generation_logs_status_check CHECK ((status = ANY (ARRAY['queued'::text, 'draft'::text, 'published'::text, 'failed'::text, 'paused'::text])))
);


--
-- Name: content_generation_queue; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.content_generation_queue (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    scheduled_for timestamp with time zone NOT NULL,
    source_ebook_id text,
    topic_angle text NOT NULL,
    status text DEFAULT 'queued'::text NOT NULL,
    article_id uuid,
    attempts smallint DEFAULT 0 NOT NULL,
    last_error text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT content_generation_queue_status_check CHECK ((status = ANY (ARRAY['queued'::text, 'draft'::text, 'review'::text, 'published'::text, 'failed'::text, 'paused'::text])))
);


--
-- Name: ebook_article_links; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ebook_article_links (
    article_id uuid NOT NULL,
    ebook_id text NOT NULL,
    relevance text DEFAULT 'related'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: ebook_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ebook_categories (
    id text NOT NULL,
    name_en text NOT NULL,
    name_vi text NOT NULL,
    slug text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    CONSTRAINT ebook_categories_id_check CHECK ((id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'::text))
);


--
-- Name: ebook_download_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ebook_download_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    lead_id uuid,
    ebook_id text NOT NULL,
    source_page text DEFAULT ''::text NOT NULL,
    event text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ebook_download_logs_event_check CHECK ((event = ANY (ARRAY['unlocked'::text, 'downloaded'::text, 'view_source'::text])))
);


--
-- Name: ebook_download_rate_limits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ebook_download_rate_limits (
    bucket_hash text NOT NULL,
    window_start timestamp with time zone NOT NULL,
    attempts integer NOT NULL
);


--
-- Name: ebook_email_leads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ebook_email_leads (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    name text,
    ebook_id text NOT NULL,
    locale text DEFAULT 'en'::text NOT NULL,
    source_page text DEFAULT ''::text NOT NULL,
    delivery_consent_at timestamp with time zone DEFAULT now() NOT NULL,
    marketing_consent_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ebook_email_leads_email_check CHECK ((length(email) <= 254)),
    CONSTRAINT ebook_email_leads_locale_check CHECK ((locale = ANY (ARRAY['en'::text, 'vi'::text])))
);


--
-- Name: ebook_page_views; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ebook_page_views (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ebook_id text NOT NULL,
    source_page text DEFAULT ''::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: legal_review_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.legal_review_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ebook_id text NOT NULL,
    reviewer text,
    decision text NOT NULL,
    jurisdiction text DEFAULT 'global'::text NOT NULL,
    evidence_url text,
    note_vi text DEFAULT ''::text NOT NULL,
    reviewed_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT legal_review_logs_decision_check CHECK ((decision = ANY (ARRAY['host'::text, 'link_out'::text, 'exclude'::text, 'pending'::text])))
);


--
-- Name: newsletter_subscribers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.newsletter_subscribers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    locale text NOT NULL,
    source text DEFAULT 'website'::text NOT NULL,
    consented_at timestamp with time zone DEFAULT now() NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    CONSTRAINT newsletter_subscribers_locale_check CHECK ((locale = ANY (ARRAY['en'::text, 'vi'::text])))
);


--
-- Name: night_companion_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.night_companion_profiles (
    id uuid NOT NULL,
    access_token_hash text NOT NULL,
    profile jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone DEFAULT (now() + '90 days'::interval) NOT NULL
);


--
-- Name: night_companion_reminders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.night_companion_reminders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    waitlist_id uuid NOT NULL,
    sleep_date date NOT NULL,
    scheduled_for timestamp with time zone NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    idempotency_key text NOT NULL,
    attempt_count integer DEFAULT 0 NOT NULL,
    last_attempt_at timestamp with time zone,
    delivered_at timestamp with time zone,
    skip_reason text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: night_companion_waitlist; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.night_companion_waitlist (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    normalized_email text NOT NULL,
    source text DEFAULT 'journey_map'::text NOT NULL,
    clicked_night integer DEFAULT 2 NOT NULL,
    profile_id text,
    visitor_id text,
    session_id text,
    consent_copy_version text DEFAULT 'v1'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    waitlist_night2_consent boolean DEFAULT true NOT NULL,
    waitlist_consented_at timestamp with time zone DEFAULT now() NOT NULL,
    night1_reminder_consent boolean DEFAULT false NOT NULL,
    reminder_consented_at timestamp with time zone,
    timezone text DEFAULT 'UTC'::text NOT NULL,
    bedtime text DEFAULT '23:00'::text NOT NULL,
    reminder_time text DEFAULT '22:30'::text NOT NULL,
    email_verified boolean DEFAULT false NOT NULL,
    verified_at timestamp with time zone,
    verification_token text,
    verification_sent_at timestamp with time zone,
    reminder_status text DEFAULT 'none'::text NOT NULL,
    reminder_start_date date,
    reminder_end_date date,
    manage_token text
);


--
-- Name: wellness_ebooks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.wellness_ebooks (
    id text NOT NULL,
    public_display_title text NOT NULL,
    public_subtitle text DEFAULT ''::text NOT NULL,
    slug text NOT NULL,
    summary_short text DEFAULT ''::text NOT NULL,
    summary_long text DEFAULT ''::text NOT NULL,
    cover_image_url text,
    category_id text,
    tags text[] DEFAULT '{}'::text[] NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    language text DEFAULT 'en'::text NOT NULL,
    downloadable_file_url text,
    sample_file_url text,
    source_title_original text,
    source_author text,
    source_url text,
    source_site text,
    document_delivery_note text DEFAULT ''::text NOT NULL,
    source_license_type text DEFAULT 'unverified'::text NOT NULL,
    redistribution_allowed boolean DEFAULT false NOT NULL,
    attribution_required boolean DEFAULT true NOT NULL,
    legal_notes_internal text DEFAULT ''::text NOT NULL,
    featured boolean DEFAULT false NOT NULL,
    seo_title text,
    seo_description text,
    premium_only boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT wellness_ebooks_check CHECK (((downloadable_file_url IS NULL) OR redistribution_allowed)),
    CONSTRAINT wellness_ebooks_id_check CHECK ((id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'::text)),
    CONSTRAINT wellness_ebooks_slug_check CHECK ((slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'::text)),
    CONSTRAINT wellness_ebooks_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'published'::text, 'archived'::text])))
);


--
-- Name: public_ebook_catalog; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.public_ebook_catalog WITH (security_invoker='false') AS
 SELECT id,
    public_display_title,
    public_subtitle,
    slug,
    summary_short,
    summary_long,
    cover_image_url,
    category_id,
    tags,
    status,
    language,
    featured,
    seo_title,
    seo_description,
    premium_only,
        CASE
            WHEN ((downloadable_file_url ~~ 'private:%'::text) AND redistribution_allowed) THEN 'email-gated'::text
            WHEN redistribution_allowed THEN downloadable_file_url
            ELSE NULL::text
        END AS downloadable_file_url
   FROM public.wellness_ebooks
  WHERE (status = 'published'::text);


--
-- Name: wellness_article_translations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.wellness_article_translations (
    article_id uuid NOT NULL,
    locale text NOT NULL,
    slug text NOT NULL,
    title text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    eyebrow text DEFAULT ''::text NOT NULL,
    takeaway text DEFAULT ''::text NOT NULL,
    sections jsonb DEFAULT '[]'::jsonb NOT NULL,
    sources jsonb DEFAULT '[]'::jsonb NOT NULL,
    cover_image_alt text DEFAULT ''::text NOT NULL,
    reading_minutes smallint,
    evidence text,
    reviewed_at timestamp with time zone,
    tool text,
    seo_title text,
    seo_description text,
    status text DEFAULT 'draft'::text NOT NULL,
    published_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    trust_meter jsonb,
    quick_recipe jsonb,
    fact_checks jsonb,
    faqs jsonb,
    safety_quiz jsonb,
    somatic_signals jsonb,
    winddown_protocol jsonb,
    mind_traps jsonb,
    somatic_quiz jsonb,
    midnight_faqs jsonb,
    CONSTRAINT wellness_article_translations_check CHECK (((status <> 'published'::text) OR ((published_at IS NOT NULL) AND (length(btrim(description)) > 0) AND (jsonb_array_length(sections) > 0)))),
    CONSTRAINT wellness_article_translations_evidence_check CHECK ((evidence = ANY (ARRAY['supported'::text, 'promising'::text, 'limited'::text]))),
    CONSTRAINT wellness_article_translations_locale_check CHECK ((locale = ANY (ARRAY['en'::text, 'vi'::text]))),
    CONSTRAINT wellness_article_translations_reading_minutes_check CHECK (((reading_minutes >= 1) AND (reading_minutes <= 120))),
    CONSTRAINT wellness_article_translations_sections_check CHECK ((jsonb_typeof(sections) = 'array'::text)),
    CONSTRAINT wellness_article_translations_slug_check CHECK ((slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'::text)),
    CONSTRAINT wellness_article_translations_sources_check CHECK ((jsonb_typeof(sources) = 'array'::text)),
    CONSTRAINT wellness_article_translations_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'published'::text, 'archived'::text]))),
    CONSTRAINT wellness_article_translations_title_check CHECK (((length(btrim(title)) >= 1) AND (length(btrim(title)) <= 240))),
    CONSTRAINT wellness_article_translations_tool_check CHECK ((tool = ANY (ARRAY['calorie-needs'::text, 'stress-check'::text, 'meditation-timer'::text, 'food-combinations'::text, 'remedy-checker'::text, 'wellness-planner'::text])))
);


--
-- Name: wellness_articles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.wellness_articles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    category_id text NOT NULL,
    channel_id uuid,
    facebook_post_id text,
    facebook_url text,
    facebook_published_at timestamp with time zone,
    cover_image_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT wellness_articles_check CHECK ((((channel_id IS NULL) AND (facebook_post_id IS NULL)) OR ((channel_id IS NOT NULL) AND (facebook_post_id IS NOT NULL) AND (length(btrim(facebook_post_id)) > 0) AND (facebook_url IS NOT NULL)))),
    CONSTRAINT wellness_articles_cover_image_url_check CHECK ((cover_image_url ~ '^https?://|^/[^/]'::text)),
    CONSTRAINT wellness_articles_facebook_url_check CHECK ((facebook_url ~ '^https://'::text))
);


--
-- Name: wellness_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.wellness_categories (
    id text NOT NULL,
    name_en text NOT NULL,
    name_vi text NOT NULL,
    slug_en text NOT NULL,
    slug_vi text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    CONSTRAINT wellness_categories_id_check CHECK ((id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'::text))
);


--
-- Name: wellness_channel_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.wellness_channel_tokens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    channel_id uuid NOT NULL,
    token_hash text NOT NULL,
    label text DEFAULT 'publisher'::text NOT NULL,
    revoked_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT wellness_channel_tokens_token_hash_check CHECK ((token_hash ~ '^[0-9a-f]{64}$'::text))
);


--
-- Name: wellness_channels; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.wellness_channels (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    facebook_page_id text NOT NULL,
    category_id text NOT NULL,
    default_locale text DEFAULT 'en'::text NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT wellness_channels_default_locale_check CHECK ((default_locale = ANY (ARRAY['en'::text, 'vi'::text]))),
    CONSTRAINT wellness_channels_facebook_page_id_check CHECK ((facebook_page_id ~ '^[0-9]+$'::text)),
    CONSTRAINT wellness_channels_name_check CHECK ((length(btrim(name)) > 0))
);


--
-- Name: wellness_plans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.wellness_plans (
    user_id uuid NOT NULL,
    plan jsonb NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: wellness_publish_limits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.wellness_publish_limits (
    channel_id uuid NOT NULL,
    window_start timestamp with time zone NOT NULL,
    requests integer NOT NULL
);


--
-- Name: growth_agent_runs growth_agent_runs_pkey; Type: CONSTRAINT; Schema: growth; Owner: -
--

ALTER TABLE ONLY growth.growth_agent_runs
    ADD CONSTRAINT growth_agent_runs_pkey PRIMARY KEY (id);


--
-- Name: growth_agent_tasks growth_agent_tasks_pkey; Type: CONSTRAINT; Schema: growth; Owner: -
--

ALTER TABLE ONLY growth.growth_agent_tasks
    ADD CONSTRAINT growth_agent_tasks_pkey PRIMARY KEY (id);


--
-- Name: growth_agent_tasks growth_agent_tasks_task_id_key; Type: CONSTRAINT; Schema: growth; Owner: -
--

ALTER TABLE ONLY growth.growth_agent_tasks
    ADD CONSTRAINT growth_agent_tasks_task_id_key UNIQUE (task_id);


--
-- Name: growth_agents growth_agents_name_key; Type: CONSTRAINT; Schema: growth; Owner: -
--

ALTER TABLE ONLY growth.growth_agents
    ADD CONSTRAINT growth_agents_name_key UNIQUE (name);


--
-- Name: growth_agents growth_agents_pkey; Type: CONSTRAINT; Schema: growth; Owner: -
--

ALTER TABLE ONLY growth.growth_agents
    ADD CONSTRAINT growth_agents_pkey PRIMARY KEY (id);


--
-- Name: growth_alerts growth_alerts_pkey; Type: CONSTRAINT; Schema: growth; Owner: -
--

ALTER TABLE ONLY growth.growth_alerts
    ADD CONSTRAINT growth_alerts_pkey PRIMARY KEY (id);


--
-- Name: growth_approvals growth_approvals_pkey; Type: CONSTRAINT; Schema: growth; Owner: -
--

ALTER TABLE ONLY growth.growth_approvals
    ADD CONSTRAINT growth_approvals_pkey PRIMARY KEY (id);


--
-- Name: growth_audit_logs growth_audit_logs_pkey; Type: CONSTRAINT; Schema: growth; Owner: -
--

ALTER TABLE ONLY growth.growth_audit_logs
    ADD CONSTRAINT growth_audit_logs_pkey PRIMARY KEY (id);


--
-- Name: growth_channels growth_channels_channel_name_key; Type: CONSTRAINT; Schema: growth; Owner: -
--

ALTER TABLE ONLY growth.growth_channels
    ADD CONSTRAINT growth_channels_channel_name_key UNIQUE (channel_name);


--
-- Name: growth_channels growth_channels_pkey; Type: CONSTRAINT; Schema: growth; Owner: -
--

ALTER TABLE ONLY growth.growth_channels
    ADD CONSTRAINT growth_channels_pkey PRIMARY KEY (id);


--
-- Name: growth_code_changes growth_code_changes_change_id_key; Type: CONSTRAINT; Schema: growth; Owner: -
--

ALTER TABLE ONLY growth.growth_code_changes
    ADD CONSTRAINT growth_code_changes_change_id_key UNIQUE (change_id);


--
-- Name: growth_code_changes growth_code_changes_pkey; Type: CONSTRAINT; Schema: growth; Owner: -
--

ALTER TABLE ONLY growth.growth_code_changes
    ADD CONSTRAINT growth_code_changes_pkey PRIMARY KEY (id);


--
-- Name: growth_content_assets growth_content_assets_pkey; Type: CONSTRAINT; Schema: growth; Owner: -
--

ALTER TABLE ONLY growth.growth_content_assets
    ADD CONSTRAINT growth_content_assets_pkey PRIMARY KEY (id);


--
-- Name: growth_content_briefs growth_content_briefs_pkey; Type: CONSTRAINT; Schema: growth; Owner: -
--

ALTER TABLE ONLY growth.growth_content_briefs
    ADD CONSTRAINT growth_content_briefs_pkey PRIMARY KEY (id);


--
-- Name: growth_conversion_events growth_conversion_events_pkey; Type: CONSTRAINT; Schema: growth; Owner: -
--

ALTER TABLE ONLY growth.growth_conversion_events
    ADD CONSTRAINT growth_conversion_events_pkey PRIMARY KEY (id);


--
-- Name: growth_daily_reports growth_daily_reports_pkey; Type: CONSTRAINT; Schema: growth; Owner: -
--

ALTER TABLE ONLY growth.growth_daily_reports
    ADD CONSTRAINT growth_daily_reports_pkey PRIMARY KEY (id);


--
-- Name: growth_daily_reports growth_daily_reports_report_type_report_date_key; Type: CONSTRAINT; Schema: growth; Owner: -
--

ALTER TABLE ONLY growth.growth_daily_reports
    ADD CONSTRAINT growth_daily_reports_report_type_report_date_key UNIQUE (report_type, report_date);


--
-- Name: growth_experiment_assignments growth_experiment_assignments_pkey; Type: CONSTRAINT; Schema: growth; Owner: -
--

ALTER TABLE ONLY growth.growth_experiment_assignments
    ADD CONSTRAINT growth_experiment_assignments_pkey PRIMARY KEY (id);


--
-- Name: growth_experiment_variants growth_experiment_variants_experiment_id_variant_code_key; Type: CONSTRAINT; Schema: growth; Owner: -
--

ALTER TABLE ONLY growth.growth_experiment_variants
    ADD CONSTRAINT growth_experiment_variants_experiment_id_variant_code_key UNIQUE (experiment_id, variant_code);


--
-- Name: growth_experiment_variants growth_experiment_variants_pkey; Type: CONSTRAINT; Schema: growth; Owner: -
--

ALTER TABLE ONLY growth.growth_experiment_variants
    ADD CONSTRAINT growth_experiment_variants_pkey PRIMARY KEY (id);


--
-- Name: growth_experiments growth_experiments_code_key; Type: CONSTRAINT; Schema: growth; Owner: -
--

ALTER TABLE ONLY growth.growth_experiments
    ADD CONSTRAINT growth_experiments_code_key UNIQUE (code);


--
-- Name: growth_experiments growth_experiments_pkey; Type: CONSTRAINT; Schema: growth; Owner: -
--

ALTER TABLE ONLY growth.growth_experiments
    ADD CONSTRAINT growth_experiments_pkey PRIMARY KEY (id);


--
-- Name: growth_goals growth_goals_code_key; Type: CONSTRAINT; Schema: growth; Owner: -
--

ALTER TABLE ONLY growth.growth_goals
    ADD CONSTRAINT growth_goals_code_key UNIQUE (code);


--
-- Name: growth_goals growth_goals_pkey; Type: CONSTRAINT; Schema: growth; Owner: -
--

ALTER TABLE ONLY growth.growth_goals
    ADD CONSTRAINT growth_goals_pkey PRIMARY KEY (id);


--
-- Name: growth_insights growth_insights_insight_key_key; Type: CONSTRAINT; Schema: growth; Owner: -
--

ALTER TABLE ONLY growth.growth_insights
    ADD CONSTRAINT growth_insights_insight_key_key UNIQUE (insight_key);


--
-- Name: growth_insights growth_insights_pkey; Type: CONSTRAINT; Schema: growth; Owner: -
--

ALTER TABLE ONLY growth.growth_insights
    ADD CONSTRAINT growth_insights_pkey PRIMARY KEY (id);


--
-- Name: growth_media_assets growth_media_assets_pkey; Type: CONSTRAINT; Schema: growth; Owner: -
--

ALTER TABLE ONLY growth.growth_media_assets
    ADD CONSTRAINT growth_media_assets_pkey PRIMARY KEY (id);


--
-- Name: growth_metric_snapshots growth_metric_snapshots_pkey; Type: CONSTRAINT; Schema: growth; Owner: -
--

ALTER TABLE ONLY growth.growth_metric_snapshots
    ADD CONSTRAINT growth_metric_snapshots_pkey PRIMARY KEY (id);


--
-- Name: growth_optimization_decisions growth_optimization_decisions_pkey; Type: CONSTRAINT; Schema: growth; Owner: -
--

ALTER TABLE ONLY growth.growth_optimization_decisions
    ADD CONSTRAINT growth_optimization_decisions_pkey PRIMARY KEY (id);


--
-- Name: growth_pinterest_boards growth_pinterest_boards_board_id_key; Type: CONSTRAINT; Schema: growth; Owner: -
--

ALTER TABLE ONLY growth.growth_pinterest_boards
    ADD CONSTRAINT growth_pinterest_boards_board_id_key UNIQUE (board_id);


--
-- Name: growth_pinterest_boards growth_pinterest_boards_pkey; Type: CONSTRAINT; Schema: growth; Owner: -
--

ALTER TABLE ONLY growth.growth_pinterest_boards
    ADD CONSTRAINT growth_pinterest_boards_pkey PRIMARY KEY (id);


--
-- Name: growth_prompt_evaluations growth_prompt_evaluations_pkey; Type: CONSTRAINT; Schema: growth; Owner: -
--

ALTER TABLE ONLY growth.growth_prompt_evaluations
    ADD CONSTRAINT growth_prompt_evaluations_pkey PRIMARY KEY (id);


--
-- Name: growth_prompt_versions growth_prompt_versions_pkey; Type: CONSTRAINT; Schema: growth; Owner: -
--

ALTER TABLE ONLY growth.growth_prompt_versions
    ADD CONSTRAINT growth_prompt_versions_pkey PRIMARY KEY (id);


--
-- Name: growth_prompt_versions growth_prompt_versions_prompt_name_version_key; Type: CONSTRAINT; Schema: growth; Owner: -
--

ALTER TABLE ONLY growth.growth_prompt_versions
    ADD CONSTRAINT growth_prompt_versions_prompt_name_version_key UNIQUE (prompt_name, version);


--
-- Name: growth_publishing_attempts growth_publishing_attempts_pkey; Type: CONSTRAINT; Schema: growth; Owner: -
--

ALTER TABLE ONLY growth.growth_publishing_attempts
    ADD CONSTRAINT growth_publishing_attempts_pkey PRIMARY KEY (id);


--
-- Name: growth_publishing_jobs growth_publishing_jobs_idempotency_key_key; Type: CONSTRAINT; Schema: growth; Owner: -
--

ALTER TABLE ONLY growth.growth_publishing_jobs
    ADD CONSTRAINT growth_publishing_jobs_idempotency_key_key UNIQUE (idempotency_key);


--
-- Name: growth_publishing_jobs growth_publishing_jobs_pkey; Type: CONSTRAINT; Schema: growth; Owner: -
--

ALTER TABLE ONLY growth.growth_publishing_jobs
    ADD CONSTRAINT growth_publishing_jobs_pkey PRIMARY KEY (id);


--
-- Name: growth_strategy_versions growth_strategy_versions_pkey; Type: CONSTRAINT; Schema: growth; Owner: -
--

ALTER TABLE ONLY growth.growth_strategy_versions
    ADD CONSTRAINT growth_strategy_versions_pkey PRIMARY KEY (id);


--
-- Name: growth_strategy_versions growth_strategy_versions_version_key; Type: CONSTRAINT; Schema: growth; Owner: -
--

ALTER TABLE ONLY growth.growth_strategy_versions
    ADD CONSTRAINT growth_strategy_versions_version_key UNIQUE (version);


--
-- Name: growth_system_settings growth_system_settings_pkey; Type: CONSTRAINT; Schema: growth; Owner: -
--

ALTER TABLE ONLY growth.growth_system_settings
    ADD CONSTRAINT growth_system_settings_pkey PRIMARY KEY (key);


--
-- Name: growth_topics growth_topics_normalized_topic_key; Type: CONSTRAINT; Schema: growth; Owner: -
--

ALTER TABLE ONLY growth.growth_topics
    ADD CONSTRAINT growth_topics_normalized_topic_key UNIQUE (normalized_topic);


--
-- Name: growth_topics growth_topics_pkey; Type: CONSTRAINT; Schema: growth; Owner: -
--

ALTER TABLE ONLY growth.growth_topics
    ADD CONSTRAINT growth_topics_pkey PRIMARY KEY (id);


--
-- Name: analytics_events analytics_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analytics_events
    ADD CONSTRAINT analytics_events_pkey PRIMARY KEY (id);


--
-- Name: content_generation_logs content_generation_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_generation_logs
    ADD CONSTRAINT content_generation_logs_pkey PRIMARY KEY (id);


--
-- Name: content_generation_queue content_generation_queue_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_generation_queue
    ADD CONSTRAINT content_generation_queue_pkey PRIMARY KEY (id);


--
-- Name: content_generation_queue content_generation_queue_scheduled_for_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_generation_queue
    ADD CONSTRAINT content_generation_queue_scheduled_for_key UNIQUE (scheduled_for);


--
-- Name: ebook_article_links ebook_article_links_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ebook_article_links
    ADD CONSTRAINT ebook_article_links_pkey PRIMARY KEY (article_id, ebook_id);


--
-- Name: ebook_categories ebook_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ebook_categories
    ADD CONSTRAINT ebook_categories_pkey PRIMARY KEY (id);


--
-- Name: ebook_categories ebook_categories_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ebook_categories
    ADD CONSTRAINT ebook_categories_slug_key UNIQUE (slug);


--
-- Name: ebook_download_logs ebook_download_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ebook_download_logs
    ADD CONSTRAINT ebook_download_logs_pkey PRIMARY KEY (id);


--
-- Name: ebook_download_rate_limits ebook_download_rate_limits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ebook_download_rate_limits
    ADD CONSTRAINT ebook_download_rate_limits_pkey PRIMARY KEY (bucket_hash);


--
-- Name: ebook_email_leads ebook_email_leads_email_ebook_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ebook_email_leads
    ADD CONSTRAINT ebook_email_leads_email_ebook_id_key UNIQUE (email, ebook_id);


--
-- Name: ebook_email_leads ebook_email_leads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ebook_email_leads
    ADD CONSTRAINT ebook_email_leads_pkey PRIMARY KEY (id);


--
-- Name: ebook_page_views ebook_page_views_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ebook_page_views
    ADD CONSTRAINT ebook_page_views_pkey PRIMARY KEY (id);


--
-- Name: legal_review_logs legal_review_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.legal_review_logs
    ADD CONSTRAINT legal_review_logs_pkey PRIMARY KEY (id);


--
-- Name: newsletter_subscribers newsletter_subscribers_email_locale_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.newsletter_subscribers
    ADD CONSTRAINT newsletter_subscribers_email_locale_key UNIQUE (email, locale);


--
-- Name: newsletter_subscribers newsletter_subscribers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.newsletter_subscribers
    ADD CONSTRAINT newsletter_subscribers_pkey PRIMARY KEY (id);


--
-- Name: night_companion_profiles night_companion_profiles_access_token_hash_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.night_companion_profiles
    ADD CONSTRAINT night_companion_profiles_access_token_hash_key UNIQUE (access_token_hash);


--
-- Name: night_companion_profiles night_companion_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.night_companion_profiles
    ADD CONSTRAINT night_companion_profiles_pkey PRIMARY KEY (id);


--
-- Name: night_companion_reminders night_companion_reminders_idempotency_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.night_companion_reminders
    ADD CONSTRAINT night_companion_reminders_idempotency_key_key UNIQUE (idempotency_key);


--
-- Name: night_companion_reminders night_companion_reminders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.night_companion_reminders
    ADD CONSTRAINT night_companion_reminders_pkey PRIMARY KEY (id);


--
-- Name: night_companion_waitlist night_companion_waitlist_normalized_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.night_companion_waitlist
    ADD CONSTRAINT night_companion_waitlist_normalized_email_key UNIQUE (normalized_email);


--
-- Name: night_companion_waitlist night_companion_waitlist_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.night_companion_waitlist
    ADD CONSTRAINT night_companion_waitlist_pkey PRIMARY KEY (id);


--
-- Name: wellness_article_translations wellness_article_translations_locale_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wellness_article_translations
    ADD CONSTRAINT wellness_article_translations_locale_slug_key UNIQUE (locale, slug);


--
-- Name: wellness_article_translations wellness_article_translations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wellness_article_translations
    ADD CONSTRAINT wellness_article_translations_pkey PRIMARY KEY (article_id, locale);


--
-- Name: wellness_articles wellness_articles_channel_id_facebook_post_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wellness_articles
    ADD CONSTRAINT wellness_articles_channel_id_facebook_post_id_key UNIQUE (channel_id, facebook_post_id);


--
-- Name: wellness_articles wellness_articles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wellness_articles
    ADD CONSTRAINT wellness_articles_pkey PRIMARY KEY (id);


--
-- Name: wellness_categories wellness_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wellness_categories
    ADD CONSTRAINT wellness_categories_pkey PRIMARY KEY (id);


--
-- Name: wellness_categories wellness_categories_slug_en_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wellness_categories
    ADD CONSTRAINT wellness_categories_slug_en_key UNIQUE (slug_en);


--
-- Name: wellness_categories wellness_categories_slug_vi_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wellness_categories
    ADD CONSTRAINT wellness_categories_slug_vi_key UNIQUE (slug_vi);


--
-- Name: wellness_channel_tokens wellness_channel_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wellness_channel_tokens
    ADD CONSTRAINT wellness_channel_tokens_pkey PRIMARY KEY (id);


--
-- Name: wellness_channel_tokens wellness_channel_tokens_token_hash_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wellness_channel_tokens
    ADD CONSTRAINT wellness_channel_tokens_token_hash_key UNIQUE (token_hash);


--
-- Name: wellness_channels wellness_channels_facebook_page_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wellness_channels
    ADD CONSTRAINT wellness_channels_facebook_page_id_key UNIQUE (facebook_page_id);


--
-- Name: wellness_channels wellness_channels_id_category_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wellness_channels
    ADD CONSTRAINT wellness_channels_id_category_id_key UNIQUE (id, category_id);


--
-- Name: wellness_channels wellness_channels_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wellness_channels
    ADD CONSTRAINT wellness_channels_pkey PRIMARY KEY (id);


--
-- Name: wellness_ebooks wellness_ebooks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wellness_ebooks
    ADD CONSTRAINT wellness_ebooks_pkey PRIMARY KEY (id);


--
-- Name: wellness_ebooks wellness_ebooks_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wellness_ebooks
    ADD CONSTRAINT wellness_ebooks_slug_key UNIQUE (slug);


--
-- Name: wellness_plans wellness_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wellness_plans
    ADD CONSTRAINT wellness_plans_pkey PRIMARY KEY (user_id);


--
-- Name: wellness_publish_limits wellness_publish_limits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wellness_publish_limits
    ADD CONSTRAINT wellness_publish_limits_pkey PRIMARY KEY (channel_id);


--
-- Name: idx_agent_runs_run_id; Type: INDEX; Schema: growth; Owner: -
--

CREATE INDEX idx_agent_runs_run_id ON growth.growth_agent_runs USING btree (run_id);


--
-- Name: idx_agent_runs_status; Type: INDEX; Schema: growth; Owner: -
--

CREATE INDEX idx_agent_runs_status ON growth.growth_agent_runs USING btree (status);


--
-- Name: idx_agent_runs_workflow; Type: INDEX; Schema: growth; Owner: -
--

CREATE INDEX idx_agent_runs_workflow ON growth.growth_agent_runs USING btree (workflow_type);


--
-- Name: idx_content_assets_campaign; Type: INDEX; Schema: growth; Owner: -
--

CREATE INDEX idx_content_assets_campaign ON growth.growth_content_assets USING btree (utm_campaign);


--
-- Name: idx_content_assets_qa; Type: INDEX; Schema: growth; Owner: -
--

CREATE INDEX idx_content_assets_qa ON growth.growth_content_assets USING btree (qa_status);


--
-- Name: idx_content_briefs_topic; Type: INDEX; Schema: growth; Owner: -
--

CREATE INDEX idx_content_briefs_topic ON growth.growth_content_briefs USING btree (topic_id);


--
-- Name: idx_conversion_campaign; Type: INDEX; Schema: growth; Owner: -
--

CREATE INDEX idx_conversion_campaign ON growth.growth_conversion_events USING btree (utm_campaign);


--
-- Name: idx_conversion_event_name; Type: INDEX; Schema: growth; Owner: -
--

CREATE INDEX idx_conversion_event_name ON growth.growth_conversion_events USING btree (event_name);


--
-- Name: idx_growth_code_changes_module; Type: INDEX; Schema: growth; Owner: -
--

CREATE INDEX idx_growth_code_changes_module ON growth.growth_code_changes USING btree (module);


--
-- Name: idx_growth_code_changes_tier; Type: INDEX; Schema: growth; Owner: -
--

CREATE INDEX idx_growth_code_changes_tier ON growth.growth_code_changes USING btree (risk_tier);


--
-- Name: idx_growth_goals_status; Type: INDEX; Schema: growth; Owner: -
--

CREATE INDEX idx_growth_goals_status ON growth.growth_goals USING btree (status);


--
-- Name: idx_growth_insights_domain; Type: INDEX; Schema: growth; Owner: -
--

CREATE INDEX idx_growth_insights_domain ON growth.growth_insights USING btree (domain);


--
-- Name: idx_growth_insights_status; Type: INDEX; Schema: growth; Owner: -
--

CREATE INDEX idx_growth_insights_status ON growth.growth_insights USING btree (status);


--
-- Name: idx_growth_reports_date; Type: INDEX; Schema: growth; Owner: -
--

CREATE INDEX idx_growth_reports_date ON growth.growth_daily_reports USING btree (report_date DESC);


--
-- Name: idx_growth_tasks_agent; Type: INDEX; Schema: growth; Owner: -
--

CREATE INDEX idx_growth_tasks_agent ON growth.growth_agent_tasks USING btree (agent_id);


--
-- Name: idx_growth_tasks_priority; Type: INDEX; Schema: growth; Owner: -
--

CREATE INDEX idx_growth_tasks_priority ON growth.growth_agent_tasks USING btree (priority DESC);


--
-- Name: idx_growth_tasks_status; Type: INDEX; Schema: growth; Owner: -
--

CREATE INDEX idx_growth_tasks_status ON growth.growth_agent_tasks USING btree (status);


--
-- Name: idx_media_assets_checksum; Type: INDEX; Schema: growth; Owner: -
--

CREATE INDEX idx_media_assets_checksum ON growth.growth_media_assets USING btree (checksum_sha256);


--
-- Name: idx_media_assets_content; Type: INDEX; Schema: growth; Owner: -
--

CREATE INDEX idx_media_assets_content ON growth.growth_media_assets USING btree (content_asset_id);


--
-- Name: idx_media_assets_platform; Type: INDEX; Schema: growth; Owner: -
--

CREATE INDEX idx_media_assets_platform ON growth.growth_media_assets USING btree (platform);


--
-- Name: idx_metric_snapshots_captured; Type: INDEX; Schema: growth; Owner: -
--

CREATE INDEX idx_metric_snapshots_captured ON growth.growth_metric_snapshots USING btree (captured_at);


--
-- Name: idx_metric_snapshots_remote; Type: INDEX; Schema: growth; Owner: -
--

CREATE INDEX idx_metric_snapshots_remote ON growth.growth_metric_snapshots USING btree (remote_id);


--
-- Name: idx_publishing_attempts_job; Type: INDEX; Schema: growth; Owner: -
--

CREATE INDEX idx_publishing_attempts_job ON growth.growth_publishing_attempts USING btree (job_id);


--
-- Name: idx_publishing_jobs_sched; Type: INDEX; Schema: growth; Owner: -
--

CREATE INDEX idx_publishing_jobs_sched ON growth.growth_publishing_jobs USING btree (scheduled_for);


--
-- Name: idx_publishing_jobs_status; Type: INDEX; Schema: growth; Owner: -
--

CREATE INDEX idx_publishing_jobs_status ON growth.growth_publishing_jobs USING btree (status);


--
-- Name: idx_topics_priority; Type: INDEX; Schema: growth; Owner: -
--

CREATE INDEX idx_topics_priority ON growth.growth_topics USING btree (estimated_priority DESC);


--
-- Name: idx_topics_status; Type: INDEX; Schema: growth; Owner: -
--

CREATE INDEX idx_topics_status ON growth.growth_topics USING btree (status);


--
-- Name: idx_analytics_events_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_analytics_events_created_at ON public.analytics_events USING btree (created_at DESC);


--
-- Name: idx_analytics_events_path; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_analytics_events_path ON public.analytics_events USING btree (path);


--
-- Name: idx_analytics_events_session_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_analytics_events_session_id ON public.analytics_events USING btree (session_id);


--
-- Name: idx_analytics_events_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_analytics_events_slug ON public.analytics_events USING btree (article_slug);


--
-- Name: idx_analytics_events_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_analytics_events_type ON public.analytics_events USING btree (event_type);


--
-- Name: idx_analytics_events_visitor_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_analytics_events_visitor_id ON public.analytics_events USING btree (visitor_id);


--
-- Name: night_companion_profiles_expires_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX night_companion_profiles_expires_at_idx ON public.night_companion_profiles USING btree (expires_at);


--
-- Name: night_companion_profiles_token_hash_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX night_companion_profiles_token_hash_idx ON public.night_companion_profiles USING btree (access_token_hash);


--
-- Name: night_companion_reminders_schedule_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX night_companion_reminders_schedule_idx ON public.night_companion_reminders USING btree (scheduled_for, status);


--
-- Name: night_companion_reminders_waitlist_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX night_companion_reminders_waitlist_idx ON public.night_companion_reminders USING btree (waitlist_id);


--
-- Name: night_companion_waitlist_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX night_companion_waitlist_created_at_idx ON public.night_companion_waitlist USING btree (created_at DESC);


--
-- Name: night_companion_waitlist_email_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX night_companion_waitlist_email_idx ON public.night_companion_waitlist USING btree (normalized_email);


--
-- Name: night_companion_waitlist_manage_token_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX night_companion_waitlist_manage_token_idx ON public.night_companion_waitlist USING btree (manage_token) WHERE (manage_token IS NOT NULL);


--
-- Name: night_companion_waitlist_night_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX night_companion_waitlist_night_idx ON public.night_companion_waitlist USING btree (clicked_night);


--
-- Name: night_companion_waitlist_verification_token_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX night_companion_waitlist_verification_token_idx ON public.night_companion_waitlist USING btree (verification_token) WHERE (verification_token IS NOT NULL);


--
-- Name: wellness_article_translations_feed_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX wellness_article_translations_feed_idx ON public.wellness_article_translations USING btree (locale, published_at DESC, article_id) WHERE (status = 'published'::text);


--
-- Name: wellness_articles_category_created_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX wellness_articles_category_created_idx ON public.wellness_articles USING btree (category_id, created_at DESC);


--
-- Name: wellness_article_translations wellness_article_translations_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER wellness_article_translations_updated_at BEFORE UPDATE ON public.wellness_article_translations FOR EACH ROW EXECUTE FUNCTION public.set_wellness_article_updated_at();


--
-- Name: wellness_articles wellness_articles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER wellness_articles_updated_at BEFORE UPDATE ON public.wellness_articles FOR EACH ROW EXECUTE FUNCTION public.set_wellness_article_updated_at();


--
-- Name: wellness_ebooks wellness_ebooks_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER wellness_ebooks_updated_at BEFORE UPDATE ON public.wellness_ebooks FOR EACH ROW EXECUTE FUNCTION public.set_ebook_updated_at();


--
-- Name: growth_agent_runs growth_agent_runs_agent_id_fkey; Type: FK CONSTRAINT; Schema: growth; Owner: -
--

ALTER TABLE ONLY growth.growth_agent_runs
    ADD CONSTRAINT growth_agent_runs_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES growth.growth_agents(id) ON DELETE SET NULL;


--
-- Name: growth_content_assets growth_content_assets_brief_id_fkey; Type: FK CONSTRAINT; Schema: growth; Owner: -
--

ALTER TABLE ONLY growth.growth_content_assets
    ADD CONSTRAINT growth_content_assets_brief_id_fkey FOREIGN KEY (brief_id) REFERENCES growth.growth_content_briefs(id) ON DELETE SET NULL;


--
-- Name: growth_content_briefs growth_content_briefs_topic_id_fkey; Type: FK CONSTRAINT; Schema: growth; Owner: -
--

ALTER TABLE ONLY growth.growth_content_briefs
    ADD CONSTRAINT growth_content_briefs_topic_id_fkey FOREIGN KEY (topic_id) REFERENCES growth.growth_topics(id) ON DELETE CASCADE;


--
-- Name: growth_experiment_assignments growth_experiment_assignments_experiment_id_fkey; Type: FK CONSTRAINT; Schema: growth; Owner: -
--

ALTER TABLE ONLY growth.growth_experiment_assignments
    ADD CONSTRAINT growth_experiment_assignments_experiment_id_fkey FOREIGN KEY (experiment_id) REFERENCES growth.growth_experiments(id) ON DELETE CASCADE;


--
-- Name: growth_experiment_assignments growth_experiment_assignments_variant_id_fkey; Type: FK CONSTRAINT; Schema: growth; Owner: -
--

ALTER TABLE ONLY growth.growth_experiment_assignments
    ADD CONSTRAINT growth_experiment_assignments_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES growth.growth_experiment_variants(id) ON DELETE CASCADE;


--
-- Name: growth_experiment_variants growth_experiment_variants_experiment_id_fkey; Type: FK CONSTRAINT; Schema: growth; Owner: -
--

ALTER TABLE ONLY growth.growth_experiment_variants
    ADD CONSTRAINT growth_experiment_variants_experiment_id_fkey FOREIGN KEY (experiment_id) REFERENCES growth.growth_experiments(id) ON DELETE CASCADE;


--
-- Name: growth_media_assets growth_media_assets_content_asset_id_fkey; Type: FK CONSTRAINT; Schema: growth; Owner: -
--

ALTER TABLE ONLY growth.growth_media_assets
    ADD CONSTRAINT growth_media_assets_content_asset_id_fkey FOREIGN KEY (content_asset_id) REFERENCES growth.growth_content_assets(id) ON DELETE CASCADE;


--
-- Name: growth_metric_snapshots growth_metric_snapshots_job_id_fkey; Type: FK CONSTRAINT; Schema: growth; Owner: -
--

ALTER TABLE ONLY growth.growth_metric_snapshots
    ADD CONSTRAINT growth_metric_snapshots_job_id_fkey FOREIGN KEY (job_id) REFERENCES growth.growth_publishing_jobs(id) ON DELETE SET NULL;


--
-- Name: growth_prompt_evaluations growth_prompt_evaluations_prompt_id_fkey; Type: FK CONSTRAINT; Schema: growth; Owner: -
--

ALTER TABLE ONLY growth.growth_prompt_evaluations
    ADD CONSTRAINT growth_prompt_evaluations_prompt_id_fkey FOREIGN KEY (prompt_id) REFERENCES growth.growth_prompt_versions(id) ON DELETE CASCADE;


--
-- Name: growth_publishing_attempts growth_publishing_attempts_job_id_fkey; Type: FK CONSTRAINT; Schema: growth; Owner: -
--

ALTER TABLE ONLY growth.growth_publishing_attempts
    ADD CONSTRAINT growth_publishing_attempts_job_id_fkey FOREIGN KEY (job_id) REFERENCES growth.growth_publishing_jobs(id) ON DELETE CASCADE;


--
-- Name: growth_publishing_jobs growth_publishing_jobs_content_asset_id_fkey; Type: FK CONSTRAINT; Schema: growth; Owner: -
--

ALTER TABLE ONLY growth.growth_publishing_jobs
    ADD CONSTRAINT growth_publishing_jobs_content_asset_id_fkey FOREIGN KEY (content_asset_id) REFERENCES growth.growth_content_assets(id) ON DELETE SET NULL;


--
-- Name: growth_publishing_jobs growth_publishing_jobs_media_asset_id_fkey; Type: FK CONSTRAINT; Schema: growth; Owner: -
--

ALTER TABLE ONLY growth.growth_publishing_jobs
    ADD CONSTRAINT growth_publishing_jobs_media_asset_id_fkey FOREIGN KEY (media_asset_id) REFERENCES growth.growth_media_assets(id) ON DELETE SET NULL;


--
-- Name: content_generation_logs content_generation_logs_article_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_generation_logs
    ADD CONSTRAINT content_generation_logs_article_id_fkey FOREIGN KEY (article_id) REFERENCES public.wellness_articles(id);


--
-- Name: content_generation_logs content_generation_logs_source_ebook_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_generation_logs
    ADD CONSTRAINT content_generation_logs_source_ebook_id_fkey FOREIGN KEY (source_ebook_id) REFERENCES public.wellness_ebooks(id);


--
-- Name: content_generation_queue content_generation_queue_article_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_generation_queue
    ADD CONSTRAINT content_generation_queue_article_id_fkey FOREIGN KEY (article_id) REFERENCES public.wellness_articles(id);


--
-- Name: content_generation_queue content_generation_queue_source_ebook_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_generation_queue
    ADD CONSTRAINT content_generation_queue_source_ebook_id_fkey FOREIGN KEY (source_ebook_id) REFERENCES public.wellness_ebooks(id);


--
-- Name: ebook_article_links ebook_article_links_article_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ebook_article_links
    ADD CONSTRAINT ebook_article_links_article_id_fkey FOREIGN KEY (article_id) REFERENCES public.wellness_articles(id) ON DELETE CASCADE;


--
-- Name: ebook_article_links ebook_article_links_ebook_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ebook_article_links
    ADD CONSTRAINT ebook_article_links_ebook_id_fkey FOREIGN KEY (ebook_id) REFERENCES public.wellness_ebooks(id);


--
-- Name: ebook_download_logs ebook_download_logs_ebook_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ebook_download_logs
    ADD CONSTRAINT ebook_download_logs_ebook_id_fkey FOREIGN KEY (ebook_id) REFERENCES public.wellness_ebooks(id);


--
-- Name: ebook_download_logs ebook_download_logs_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ebook_download_logs
    ADD CONSTRAINT ebook_download_logs_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.ebook_email_leads(id);


--
-- Name: ebook_email_leads ebook_email_leads_ebook_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ebook_email_leads
    ADD CONSTRAINT ebook_email_leads_ebook_id_fkey FOREIGN KEY (ebook_id) REFERENCES public.wellness_ebooks(id);


--
-- Name: ebook_page_views ebook_page_views_ebook_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ebook_page_views
    ADD CONSTRAINT ebook_page_views_ebook_id_fkey FOREIGN KEY (ebook_id) REFERENCES public.wellness_ebooks(id);


--
-- Name: legal_review_logs legal_review_logs_ebook_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.legal_review_logs
    ADD CONSTRAINT legal_review_logs_ebook_id_fkey FOREIGN KEY (ebook_id) REFERENCES public.wellness_ebooks(id);


--
-- Name: night_companion_reminders night_companion_reminders_waitlist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.night_companion_reminders
    ADD CONSTRAINT night_companion_reminders_waitlist_id_fkey FOREIGN KEY (waitlist_id) REFERENCES public.night_companion_waitlist(id) ON DELETE CASCADE;


--
-- Name: wellness_article_translations wellness_article_translations_article_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wellness_article_translations
    ADD CONSTRAINT wellness_article_translations_article_id_fkey FOREIGN KEY (article_id) REFERENCES public.wellness_articles(id) ON DELETE CASCADE;


--
-- Name: wellness_articles wellness_articles_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wellness_articles
    ADD CONSTRAINT wellness_articles_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.wellness_categories(id);


--
-- Name: wellness_articles wellness_articles_channel_id_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wellness_articles
    ADD CONSTRAINT wellness_articles_channel_id_category_id_fkey FOREIGN KEY (channel_id, category_id) REFERENCES public.wellness_channels(id, category_id);


--
-- Name: wellness_channel_tokens wellness_channel_tokens_channel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wellness_channel_tokens
    ADD CONSTRAINT wellness_channel_tokens_channel_id_fkey FOREIGN KEY (channel_id) REFERENCES public.wellness_channels(id);


--
-- Name: wellness_channels wellness_channels_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wellness_channels
    ADD CONSTRAINT wellness_channels_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.wellness_categories(id);


--
-- Name: wellness_ebooks wellness_ebooks_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wellness_ebooks
    ADD CONSTRAINT wellness_ebooks_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.ebook_categories(id);


--
-- Name: wellness_plans wellness_plans_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wellness_plans
    ADD CONSTRAINT wellness_plans_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: wellness_publish_limits wellness_publish_limits_channel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wellness_publish_limits
    ADD CONSTRAINT wellness_publish_limits_channel_id_fkey FOREIGN KEY (channel_id) REFERENCES public.wellness_channels(id);


--
-- Name: growth_agent_tasks Allow authenticated read/write growth_agent_tasks; Type: POLICY; Schema: growth; Owner: -
--

CREATE POLICY "Allow authenticated read/write growth_agent_tasks" ON growth.growth_agent_tasks USING (true);


--
-- Name: growth_code_changes Allow authenticated read/write growth_code_changes; Type: POLICY; Schema: growth; Owner: -
--

CREATE POLICY "Allow authenticated read/write growth_code_changes" ON growth.growth_code_changes USING (true);


--
-- Name: growth_daily_reports Allow authenticated read/write growth_daily_reports; Type: POLICY; Schema: growth; Owner: -
--

CREATE POLICY "Allow authenticated read/write growth_daily_reports" ON growth.growth_daily_reports USING (true);


--
-- Name: growth_goals Allow authenticated read/write growth_goals; Type: POLICY; Schema: growth; Owner: -
--

CREATE POLICY "Allow authenticated read/write growth_goals" ON growth.growth_goals USING (true);


--
-- Name: growth_insights Allow authenticated read/write growth_insights; Type: POLICY; Schema: growth; Owner: -
--

CREATE POLICY "Allow authenticated read/write growth_insights" ON growth.growth_insights USING (true);


--
-- Name: growth_agent_runs Service role full access on growth_agent_runs; Type: POLICY; Schema: growth; Owner: -
--

CREATE POLICY "Service role full access on growth_agent_runs" ON growth.growth_agent_runs TO service_role USING (true) WITH CHECK (true);


--
-- Name: growth_agents Service role full access on growth_agents; Type: POLICY; Schema: growth; Owner: -
--

CREATE POLICY "Service role full access on growth_agents" ON growth.growth_agents TO service_role USING (true) WITH CHECK (true);


--
-- Name: growth_alerts Service role full access on growth_alerts; Type: POLICY; Schema: growth; Owner: -
--

CREATE POLICY "Service role full access on growth_alerts" ON growth.growth_alerts TO service_role USING (true) WITH CHECK (true);


--
-- Name: growth_approvals Service role full access on growth_approvals; Type: POLICY; Schema: growth; Owner: -
--

CREATE POLICY "Service role full access on growth_approvals" ON growth.growth_approvals TO service_role USING (true) WITH CHECK (true);


--
-- Name: growth_audit_logs Service role full access on growth_audit_logs; Type: POLICY; Schema: growth; Owner: -
--

CREATE POLICY "Service role full access on growth_audit_logs" ON growth.growth_audit_logs TO service_role USING (true) WITH CHECK (true);


--
-- Name: growth_channels Service role full access on growth_channels; Type: POLICY; Schema: growth; Owner: -
--

CREATE POLICY "Service role full access on growth_channels" ON growth.growth_channels TO service_role USING (true) WITH CHECK (true);


--
-- Name: growth_content_assets Service role full access on growth_content_assets; Type: POLICY; Schema: growth; Owner: -
--

CREATE POLICY "Service role full access on growth_content_assets" ON growth.growth_content_assets TO service_role USING (true) WITH CHECK (true);


--
-- Name: growth_content_briefs Service role full access on growth_content_briefs; Type: POLICY; Schema: growth; Owner: -
--

CREATE POLICY "Service role full access on growth_content_briefs" ON growth.growth_content_briefs TO service_role USING (true) WITH CHECK (true);


--
-- Name: growth_conversion_events Service role full access on growth_conversion_events; Type: POLICY; Schema: growth; Owner: -
--

CREATE POLICY "Service role full access on growth_conversion_events" ON growth.growth_conversion_events TO service_role USING (true) WITH CHECK (true);


--
-- Name: growth_experiment_assignments Service role full access on growth_experiment_assignments; Type: POLICY; Schema: growth; Owner: -
--

CREATE POLICY "Service role full access on growth_experiment_assignments" ON growth.growth_experiment_assignments TO service_role USING (true) WITH CHECK (true);


--
-- Name: growth_experiment_variants Service role full access on growth_experiment_variants; Type: POLICY; Schema: growth; Owner: -
--

CREATE POLICY "Service role full access on growth_experiment_variants" ON growth.growth_experiment_variants TO service_role USING (true) WITH CHECK (true);


--
-- Name: growth_experiments Service role full access on growth_experiments; Type: POLICY; Schema: growth; Owner: -
--

CREATE POLICY "Service role full access on growth_experiments" ON growth.growth_experiments TO service_role USING (true) WITH CHECK (true);


--
-- Name: growth_media_assets Service role full access on growth_media_assets; Type: POLICY; Schema: growth; Owner: -
--

CREATE POLICY "Service role full access on growth_media_assets" ON growth.growth_media_assets TO service_role USING (true) WITH CHECK (true);


--
-- Name: growth_metric_snapshots Service role full access on growth_metric_snapshots; Type: POLICY; Schema: growth; Owner: -
--

CREATE POLICY "Service role full access on growth_metric_snapshots" ON growth.growth_metric_snapshots TO service_role USING (true) WITH CHECK (true);


--
-- Name: growth_optimization_decisions Service role full access on growth_optimization_decisions; Type: POLICY; Schema: growth; Owner: -
--

CREATE POLICY "Service role full access on growth_optimization_decisions" ON growth.growth_optimization_decisions TO service_role USING (true) WITH CHECK (true);


--
-- Name: growth_pinterest_boards Service role full access on growth_pinterest_boards; Type: POLICY; Schema: growth; Owner: -
--

CREATE POLICY "Service role full access on growth_pinterest_boards" ON growth.growth_pinterest_boards TO service_role USING (true) WITH CHECK (true);


--
-- Name: growth_prompt_evaluations Service role full access on growth_prompt_evaluations; Type: POLICY; Schema: growth; Owner: -
--

CREATE POLICY "Service role full access on growth_prompt_evaluations" ON growth.growth_prompt_evaluations TO service_role USING (true) WITH CHECK (true);


--
-- Name: growth_prompt_versions Service role full access on growth_prompt_versions; Type: POLICY; Schema: growth; Owner: -
--

CREATE POLICY "Service role full access on growth_prompt_versions" ON growth.growth_prompt_versions TO service_role USING (true) WITH CHECK (true);


--
-- Name: growth_publishing_attempts Service role full access on growth_publishing_attempts; Type: POLICY; Schema: growth; Owner: -
--

CREATE POLICY "Service role full access on growth_publishing_attempts" ON growth.growth_publishing_attempts TO service_role USING (true) WITH CHECK (true);


--
-- Name: growth_publishing_jobs Service role full access on growth_publishing_jobs; Type: POLICY; Schema: growth; Owner: -
--

CREATE POLICY "Service role full access on growth_publishing_jobs" ON growth.growth_publishing_jobs TO service_role USING (true) WITH CHECK (true);


--
-- Name: growth_strategy_versions Service role full access on growth_strategy_versions; Type: POLICY; Schema: growth; Owner: -
--

CREATE POLICY "Service role full access on growth_strategy_versions" ON growth.growth_strategy_versions TO service_role USING (true) WITH CHECK (true);


--
-- Name: growth_system_settings Service role full access on growth_system_settings; Type: POLICY; Schema: growth; Owner: -
--

CREATE POLICY "Service role full access on growth_system_settings" ON growth.growth_system_settings TO service_role USING (true) WITH CHECK (true);


--
-- Name: growth_topics Service role full access on growth_topics; Type: POLICY; Schema: growth; Owner: -
--

CREATE POLICY "Service role full access on growth_topics" ON growth.growth_topics TO service_role USING (true) WITH CHECK (true);


--
-- Name: growth_agent_runs; Type: ROW SECURITY; Schema: growth; Owner: -
--

ALTER TABLE growth.growth_agent_runs ENABLE ROW LEVEL SECURITY;

--
-- Name: growth_agent_tasks; Type: ROW SECURITY; Schema: growth; Owner: -
--

ALTER TABLE growth.growth_agent_tasks ENABLE ROW LEVEL SECURITY;

--
-- Name: growth_agents; Type: ROW SECURITY; Schema: growth; Owner: -
--

ALTER TABLE growth.growth_agents ENABLE ROW LEVEL SECURITY;

--
-- Name: growth_alerts; Type: ROW SECURITY; Schema: growth; Owner: -
--

ALTER TABLE growth.growth_alerts ENABLE ROW LEVEL SECURITY;

--
-- Name: growth_approvals; Type: ROW SECURITY; Schema: growth; Owner: -
--

ALTER TABLE growth.growth_approvals ENABLE ROW LEVEL SECURITY;

--
-- Name: growth_audit_logs; Type: ROW SECURITY; Schema: growth; Owner: -
--

ALTER TABLE growth.growth_audit_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: growth_channels; Type: ROW SECURITY; Schema: growth; Owner: -
--

ALTER TABLE growth.growth_channels ENABLE ROW LEVEL SECURITY;

--
-- Name: growth_code_changes; Type: ROW SECURITY; Schema: growth; Owner: -
--

ALTER TABLE growth.growth_code_changes ENABLE ROW LEVEL SECURITY;

--
-- Name: growth_content_assets; Type: ROW SECURITY; Schema: growth; Owner: -
--

ALTER TABLE growth.growth_content_assets ENABLE ROW LEVEL SECURITY;

--
-- Name: growth_content_briefs; Type: ROW SECURITY; Schema: growth; Owner: -
--

ALTER TABLE growth.growth_content_briefs ENABLE ROW LEVEL SECURITY;

--
-- Name: growth_conversion_events; Type: ROW SECURITY; Schema: growth; Owner: -
--

ALTER TABLE growth.growth_conversion_events ENABLE ROW LEVEL SECURITY;

--
-- Name: growth_daily_reports; Type: ROW SECURITY; Schema: growth; Owner: -
--

ALTER TABLE growth.growth_daily_reports ENABLE ROW LEVEL SECURITY;

--
-- Name: growth_experiment_assignments; Type: ROW SECURITY; Schema: growth; Owner: -
--

ALTER TABLE growth.growth_experiment_assignments ENABLE ROW LEVEL SECURITY;

--
-- Name: growth_experiment_variants; Type: ROW SECURITY; Schema: growth; Owner: -
--

ALTER TABLE growth.growth_experiment_variants ENABLE ROW LEVEL SECURITY;

--
-- Name: growth_experiments; Type: ROW SECURITY; Schema: growth; Owner: -
--

ALTER TABLE growth.growth_experiments ENABLE ROW LEVEL SECURITY;

--
-- Name: growth_goals; Type: ROW SECURITY; Schema: growth; Owner: -
--

ALTER TABLE growth.growth_goals ENABLE ROW LEVEL SECURITY;

--
-- Name: growth_insights; Type: ROW SECURITY; Schema: growth; Owner: -
--

ALTER TABLE growth.growth_insights ENABLE ROW LEVEL SECURITY;

--
-- Name: growth_media_assets; Type: ROW SECURITY; Schema: growth; Owner: -
--

ALTER TABLE growth.growth_media_assets ENABLE ROW LEVEL SECURITY;

--
-- Name: growth_metric_snapshots; Type: ROW SECURITY; Schema: growth; Owner: -
--

ALTER TABLE growth.growth_metric_snapshots ENABLE ROW LEVEL SECURITY;

--
-- Name: growth_optimization_decisions; Type: ROW SECURITY; Schema: growth; Owner: -
--

ALTER TABLE growth.growth_optimization_decisions ENABLE ROW LEVEL SECURITY;

--
-- Name: growth_pinterest_boards; Type: ROW SECURITY; Schema: growth; Owner: -
--

ALTER TABLE growth.growth_pinterest_boards ENABLE ROW LEVEL SECURITY;

--
-- Name: growth_prompt_evaluations; Type: ROW SECURITY; Schema: growth; Owner: -
--

ALTER TABLE growth.growth_prompt_evaluations ENABLE ROW LEVEL SECURITY;

--
-- Name: growth_prompt_versions; Type: ROW SECURITY; Schema: growth; Owner: -
--

ALTER TABLE growth.growth_prompt_versions ENABLE ROW LEVEL SECURITY;

--
-- Name: growth_publishing_attempts; Type: ROW SECURITY; Schema: growth; Owner: -
--

ALTER TABLE growth.growth_publishing_attempts ENABLE ROW LEVEL SECURITY;

--
-- Name: growth_publishing_jobs; Type: ROW SECURITY; Schema: growth; Owner: -
--

ALTER TABLE growth.growth_publishing_jobs ENABLE ROW LEVEL SECURITY;

--
-- Name: growth_strategy_versions; Type: ROW SECURITY; Schema: growth; Owner: -
--

ALTER TABLE growth.growth_strategy_versions ENABLE ROW LEVEL SECURITY;

--
-- Name: growth_system_settings; Type: ROW SECURITY; Schema: growth; Owner: -
--

ALTER TABLE growth.growth_system_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: growth_topics; Type: ROW SECURITY; Schema: growth; Owner: -
--

ALTER TABLE growth.growth_topics ENABLE ROW LEVEL SECURITY;

--
-- Name: ebook_article_links Public article ebook links; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public article ebook links" ON public.ebook_article_links FOR SELECT TO authenticated, anon USING (true);


--
-- Name: wellness_articles Public articles with published content; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public articles with published content" ON public.wellness_articles FOR SELECT TO authenticated, anon USING ((EXISTS ( SELECT 1
   FROM public.wellness_article_translations t
  WHERE ((t.article_id = wellness_articles.id) AND (t.status = 'published'::text) AND (t.published_at <= now())))));


--
-- Name: wellness_categories Public categories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public categories" ON public.wellness_categories FOR SELECT TO authenticated, anon USING (true);


--
-- Name: ebook_categories Public ebook categories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public ebook categories" ON public.ebook_categories FOR SELECT TO authenticated, anon USING (true);


--
-- Name: wellness_article_translations Public published translations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public published translations" ON public.wellness_article_translations FOR SELECT TO authenticated, anon USING (((status = 'published'::text) AND (published_at <= now())));


--
-- Name: wellness_plans Users can insert their own wellness plan; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own wellness plan" ON public.wellness_plans FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: wellness_plans Users can read their own wellness plan; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can read their own wellness plan" ON public.wellness_plans FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: wellness_plans Users can update their own wellness plan; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own wellness plan" ON public.wellness_plans FOR UPDATE TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: analytics_events; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

--
-- Name: analytics_events anon_insert_analytics; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY anon_insert_analytics ON public.analytics_events FOR INSERT TO anon WITH CHECK (true);


--
-- Name: content_generation_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.content_generation_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: content_generation_queue; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.content_generation_queue ENABLE ROW LEVEL SECURITY;

--
-- Name: ebook_article_links; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ebook_article_links ENABLE ROW LEVEL SECURITY;

--
-- Name: ebook_categories; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ebook_categories ENABLE ROW LEVEL SECURITY;

--
-- Name: ebook_download_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ebook_download_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: ebook_download_rate_limits; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ebook_download_rate_limits ENABLE ROW LEVEL SECURITY;

--
-- Name: ebook_email_leads; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ebook_email_leads ENABLE ROW LEVEL SECURITY;

--
-- Name: ebook_page_views; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ebook_page_views ENABLE ROW LEVEL SECURITY;

--
-- Name: legal_review_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.legal_review_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: newsletter_subscribers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

--
-- Name: night_companion_profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.night_companion_profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: night_companion_reminders; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.night_companion_reminders ENABLE ROW LEVEL SECURITY;

--
-- Name: night_companion_waitlist; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.night_companion_waitlist ENABLE ROW LEVEL SECURITY;

--
-- Name: analytics_events service_role_all_analytics; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY service_role_all_analytics ON public.analytics_events TO service_role USING (true) WITH CHECK (true);


--
-- Name: wellness_article_translations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.wellness_article_translations ENABLE ROW LEVEL SECURITY;

--
-- Name: wellness_articles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.wellness_articles ENABLE ROW LEVEL SECURITY;

--
-- Name: wellness_categories; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.wellness_categories ENABLE ROW LEVEL SECURITY;

--
-- Name: wellness_channel_tokens; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.wellness_channel_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: wellness_channels; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.wellness_channels ENABLE ROW LEVEL SECURITY;

--
-- Name: wellness_ebooks; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.wellness_ebooks ENABLE ROW LEVEL SECURITY;

--
-- Name: wellness_plans; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.wellness_plans ENABLE ROW LEVEL SECURITY;

--
-- Name: wellness_publish_limits; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.wellness_publish_limits ENABLE ROW LEVEL SECURITY;

--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: -
--

GRANT USAGE ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;


--
-- Name: FUNCTION capture_ebook_lead(p_email text, p_name text, p_ebook_id text, p_locale text, p_source_page text, p_marketing boolean, p_bucket_hash text); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.capture_ebook_lead(p_email text, p_name text, p_ebook_id text, p_locale text, p_source_page text, p_marketing boolean, p_bucket_hash text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.capture_ebook_lead(p_email text, p_name text, p_ebook_id text, p_locale text, p_source_page text, p_marketing boolean, p_bucket_hash text) TO service_role;


--
-- Name: FUNCTION get_admin_analytics(p_days integer); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.get_admin_analytics(p_days integer) TO anon;
GRANT ALL ON FUNCTION public.get_admin_analytics(p_days integer) TO authenticated;
GRANT ALL ON FUNCTION public.get_admin_analytics(p_days integer) TO service_role;


--
-- Name: FUNCTION get_ebook_admin_summary(); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.get_ebook_admin_summary() FROM PUBLIC;
GRANT ALL ON FUNCTION public.get_ebook_admin_summary() TO service_role;


--
-- Name: FUNCTION publish_wellness_article(p_token_hash text, p_payload jsonb); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.publish_wellness_article(p_token_hash text, p_payload jsonb) FROM PUBLIC;
GRANT ALL ON FUNCTION public.publish_wellness_article(p_token_hash text, p_payload jsonb) TO service_role;


--
-- Name: FUNCTION rls_auto_enable(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.rls_auto_enable() TO anon;
GRANT ALL ON FUNCTION public.rls_auto_enable() TO authenticated;
GRANT ALL ON FUNCTION public.rls_auto_enable() TO service_role;


--
-- Name: FUNCTION set_ebook_updated_at(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.set_ebook_updated_at() TO anon;
GRANT ALL ON FUNCTION public.set_ebook_updated_at() TO authenticated;
GRANT ALL ON FUNCTION public.set_ebook_updated_at() TO service_role;


--
-- Name: FUNCTION set_wellness_article_updated_at(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.set_wellness_article_updated_at() TO anon;
GRANT ALL ON FUNCTION public.set_wellness_article_updated_at() TO authenticated;
GRANT ALL ON FUNCTION public.set_wellness_article_updated_at() TO service_role;


--
-- Name: TABLE analytics_events; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.analytics_events TO anon;
GRANT ALL ON TABLE public.analytics_events TO authenticated;
GRANT ALL ON TABLE public.analytics_events TO service_role;


--
-- Name: TABLE content_generation_logs; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.content_generation_logs TO service_role;


--
-- Name: TABLE content_generation_queue; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.content_generation_queue TO service_role;


--
-- Name: TABLE ebook_article_links; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.ebook_article_links TO service_role;
GRANT SELECT ON TABLE public.ebook_article_links TO anon;
GRANT SELECT ON TABLE public.ebook_article_links TO authenticated;


--
-- Name: TABLE ebook_categories; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.ebook_categories TO service_role;
GRANT SELECT ON TABLE public.ebook_categories TO anon;
GRANT SELECT ON TABLE public.ebook_categories TO authenticated;


--
-- Name: TABLE ebook_download_logs; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.ebook_download_logs TO service_role;


--
-- Name: TABLE ebook_download_rate_limits; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.ebook_download_rate_limits TO service_role;


--
-- Name: TABLE ebook_email_leads; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.ebook_email_leads TO service_role;


--
-- Name: TABLE ebook_page_views; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.ebook_page_views TO service_role;


--
-- Name: TABLE legal_review_logs; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.legal_review_logs TO service_role;


--
-- Name: TABLE newsletter_subscribers; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.newsletter_subscribers TO anon;
GRANT ALL ON TABLE public.newsletter_subscribers TO authenticated;
GRANT ALL ON TABLE public.newsletter_subscribers TO service_role;


--
-- Name: TABLE night_companion_profiles; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.night_companion_profiles TO anon;
GRANT ALL ON TABLE public.night_companion_profiles TO authenticated;
GRANT ALL ON TABLE public.night_companion_profiles TO service_role;


--
-- Name: TABLE night_companion_reminders; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.night_companion_reminders TO anon;
GRANT ALL ON TABLE public.night_companion_reminders TO authenticated;
GRANT ALL ON TABLE public.night_companion_reminders TO service_role;


--
-- Name: TABLE night_companion_waitlist; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.night_companion_waitlist TO anon;
GRANT ALL ON TABLE public.night_companion_waitlist TO authenticated;
GRANT ALL ON TABLE public.night_companion_waitlist TO service_role;


--
-- Name: TABLE wellness_ebooks; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.wellness_ebooks TO service_role;


--
-- Name: TABLE public_ebook_catalog; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.public_ebook_catalog TO anon;
GRANT ALL ON TABLE public.public_ebook_catalog TO authenticated;
GRANT ALL ON TABLE public.public_ebook_catalog TO service_role;


--
-- Name: TABLE wellness_article_translations; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.wellness_article_translations TO service_role;
GRANT SELECT ON TABLE public.wellness_article_translations TO anon;
GRANT SELECT ON TABLE public.wellness_article_translations TO authenticated;


--
-- Name: TABLE wellness_articles; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.wellness_articles TO service_role;
GRANT SELECT ON TABLE public.wellness_articles TO anon;
GRANT SELECT ON TABLE public.wellness_articles TO authenticated;


--
-- Name: TABLE wellness_categories; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.wellness_categories TO service_role;
GRANT SELECT ON TABLE public.wellness_categories TO anon;
GRANT SELECT ON TABLE public.wellness_categories TO authenticated;


--
-- Name: TABLE wellness_channel_tokens; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.wellness_channel_tokens TO service_role;


--
-- Name: TABLE wellness_channels; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.wellness_channels TO service_role;


--
-- Name: TABLE wellness_plans; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.wellness_plans TO anon;
GRANT ALL ON TABLE public.wellness_plans TO authenticated;
GRANT ALL ON TABLE public.wellness_plans TO service_role;


--
-- Name: TABLE wellness_publish_limits; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.wellness_publish_limits TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- PostgreSQL database dump complete
--
