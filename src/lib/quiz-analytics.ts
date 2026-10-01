export interface InsomniaQuizEvent {
  id: string;
  event_type: string;
  path?: string;
  referrer?: string;
  device_type?: string;
  visitor_id?: string;
  session_id?: string;
  created_at: string;
  metadata?: {
    funnel?: string;
    step?: number;
    isi_score?: number | string;
    email?: string;
    source?: string;
    campaign?: string;
    utm_source?: string;
    utm_campaign?: string;
    utm_medium?: string;
    utm_content?: string;
    platform?: string;
    store?: string;
    issues?: string[];
    pills_use?: string;
    duration?: string;
    [key: string]: unknown;
  };
}

export interface InsomniaQuizSubscriber {
  id: string;
  email: string;
  source: string;
  consented_at: string;
}

export interface InsomniaQuizStats {
  summary: {
    page_views: number;
    unique_visitors: number;
    today_views: number;
    today_unique_visitors: number;
    starts: number;
    today_starts: number;
    completions: number;
    today_completions: number;
    leads: number;
    today_leads: number;
    app_clicks: number;
    today_app_clicks: number;
    app_clicks_ios: number;
    app_clicks_android: number;
    avg_isi_score: number;
    start_rate: number;
    completion_rate: number;
    lead_rate: number;
    app_download_rate: number;
  };
  step_waterfall: Array<{
    step: number;
    title_vi: string;
    title_en: string;
    count: number;
    reach_pct: number;
    dropoff_pct: number;
  }>;
  traffic_sources: Array<{
    source: string;
    campaign: string;
    medium: string;
    views: number;
    unique_visitors: number;
    starts: number;
    completions: number;
    leads: number;
    app_clicks: number;
    last_active_at: string;
  }>;
  recent_submissions: Array<{
    id: string;
    created_at_vn: string;
    event_type: string;
    email?: string;
    isi_score: number;
    device: string;
    platform?: string;
    issues?: string[];
    pills_use?: string;
    duration?: string;
    source: string;
    app_clicked: boolean;
  }>;
}

export async function processInsomniaQuizAnalytics(url: string, serviceKey: string): Promise<InsomniaQuizStats | null> {
  try {
    const [eventsRes, subsRes] = await Promise.all([
      fetch(`${url}/rest/v1/analytics_events?or=(path.like.*quiz*,metadata->>funnel.eq.quiz_insomnia)&order=created_at.desc&limit=1000`, {
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }
      }),
      fetch(`${url}/rest/v1/newsletter_subscribers?source=eq.quiz_insomnia&order=consented_at.desc&limit=200`, {
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }
      })
    ]);

    const events: InsomniaQuizEvent[] = eventsRes.ok ? await eventsRes.json() : [];
    const subs: InsomniaQuizSubscriber[] = subsRes.ok ? await subsRes.json() : [];

    const nowVN = new Date(Date.now() + 7 * 3600 * 1000);
    const todayStr = nowVN.toISOString().slice(0, 10);

    const isToday = (dateStr?: string): boolean => {
      if (!dateStr) return false;
      const d = new Date(new Date(dateStr).getTime() + 7 * 3600 * 1000);
      return d.toISOString().slice(0, 10) === todayStr;
    };

    const toVnTime = (dateStr?: string): string => {
      if (!dateStr) return '';
      const d = new Date(new Date(dateStr).getTime() + 7 * 3600 * 1000);
      return d.toISOString().replace('T', ' ').slice(0, 19);
    };

    const pageViews = events.filter(e => e.event_type === 'page_view');
    const uniqueVisitorSet = new Set(pageViews.map(e => e.visitor_id || e.session_id || ''));
    const uniqueVisitors = uniqueVisitorSet.size;

    const todayViews = pageViews.filter(e => isToday(e.created_at));
    const todayUniqueVisitors = new Set(todayViews.map(e => e.visitor_id || e.session_id || '')).size;

    const starts = events.filter(e => e.event_type === 'quiz_started');
    const todayStarts = starts.filter(e => isToday(e.created_at));

    const completions = events.filter(e => e.event_type === 'quiz_completed');
    const todayCompletions = completions.filter(e => isToday(e.created_at));

    const leads = events.filter(e => e.event_type === 'lead_submit');
    const todayLeads = leads.filter(e => isToday(e.created_at));
    const totalLeads = Math.max(leads.length, subs.length);

    const appClicks = events.filter(e => e.event_type === 'onboarding_app_download_click');
    const todayAppClicks = appClicks.filter(e => isToday(e.created_at));
    const appClicksIos = appClicks.filter(e => e.metadata?.store === 'app_store' || e.metadata?.platform === 'ios');
    const appClicksAndroid = appClicks.filter(e => e.metadata?.store === 'google_play' || e.metadata?.platform === 'android');

    const isiScores = completions
      .map(e => Number(e.metadata?.isi_score))
      .filter(s => !isNaN(s) && s > 0);
    const avgIsiScore = isiScores.length > 0
      ? Math.round(isiScores.reduce((a, b) => a + b, 0) / isiScores.length)
      : 74;

    const summary = {
      page_views: pageViews.length,
      unique_visitors: uniqueVisitors,
      today_views: todayViews.length,
      today_unique_visitors: todayUniqueVisitors,
      starts: starts.length,
      today_starts: todayStarts.length,
      completions: completions.length,
      today_completions: todayCompletions.length,
      leads: totalLeads,
      today_leads: todayLeads.length,
      app_clicks: appClicks.length,
      today_app_clicks: todayAppClicks.length,
      app_clicks_ios: appClicksIos.length,
      app_clicks_android: appClicksAndroid.length,
      avg_isi_score: avgIsiScore,
      start_rate: uniqueVisitors > 0 ? Math.round((starts.length / uniqueVisitors) * 100) : 0,
      completion_rate: starts.length > 0 ? Math.round((completions.length / starts.length) * 100) : 0,
      lead_rate: starts.length > 0 ? Math.round((totalLeads / starts.length) * 100) : 0,
      app_download_rate: completions.length > 0 ? Math.round((appClicks.length / completions.length) * 100) : 0
    };

    // Step waterfall
    const stepDefinitions = [
      { step: 0, title_vi: 'Trang Giới Thiệu (Hero)', title_en: 'Intro Landing' },
      { step: 1, title_vi: 'Giới Tính Sinh Học', title_en: 'Gender' },
      { step: 2, title_vi: 'Triệu Chứng Giấc Ngủ', title_en: 'Sleep Issues' },
      { step: 3, title_vi: 'Tần Suất Mất Ngủ', title_en: 'Frequency' },
      { step: 4, title_vi: 'Thời Gian Bị Mất Ngủ', title_en: 'Duration' },
      { step: 5, title_vi: 'Độ Tuổi Hiện Tại', title_en: 'Age Group' },
      { step: 6, title_vi: 'Tiết Lộ Điểm Lâm Sàng ISI', title_en: 'ISI Score Reveal' },
      { step: 7, title_vi: 'Thời Lượng Ngủ Ban Đêm', title_en: 'Sleep Hours' },
      { step: 8, title_vi: 'Phá Vỡ Ngộ Nhận 8 Tiếng', title_en: '8-Hour Myth' },
      { step: 9, title_vi: 'Thang Đo Nỗi Sợ Buổi Tối', title_en: 'Evening Dread' },
      { step: 10, title_vi: 'Đầu Óc Quay Cuồng Khi Nằm', title_en: 'Racing Thoughts' },
      { step: 11, title_vi: 'Nghịch Lý Của Sự Cố Gắng', title_en: 'Sleep Effort Paradox' },
      { step: 12, title_vi: 'Dùng Thuốc Ngủ & Melatonin', title_en: 'Pills & Sleep Aids' },
      { step: 13, title_vi: 'Tác Dụng Phụ Của Thuốc', title_en: 'Side Effects' },
      { step: 14, title_vi: 'Giải Pháp 100% Không Thuốc', title_en: 'Clinical CBT-I Proof' },
      { step: 15, title_vi: 'Mục Tiêu & Động Lực', title_en: 'Primary Goal' },
      { step: 16, title_vi: 'Thiết Lập Phác Đồ 14 Ngày', title_en: 'Plan Generator' },
      { step: 17, title_vi: 'Điền Email Nhận Phác Đồ', title_en: 'Email Gate' },
      { step: 18, title_vi: 'Xem Kết Quả & Tải App', title_en: 'Results & App Offer' }
    ];

    const stepEvents = events.filter(e => e.event_type === 'quiz_step');
    const stepCounts: Record<number, number> = {};
    stepEvents.forEach(e => {
      const s = Number(e.metadata?.step);
      if (!isNaN(s)) {
        stepCounts[s] = (stepCounts[s] || 0) + 1;
      }
    });

    const baseCount = Math.max(pageViews.length, starts.length, 1);
    const step_waterfall = stepDefinitions.map((def, idx) => {
      let count = 0;
      if (def.step === 0) count = pageViews.length;
      else if (def.step === 1) count = Math.max(starts.length, stepCounts[1] || 0);
      else if (def.step === 17) count = Math.max(totalLeads, stepCounts[17] || 0);
      else if (def.step === 18) count = Math.max(completions.length, stepCounts[18] || 0);
      else count = stepCounts[def.step] || 0;

      const prevCount = idx === 0 ? baseCount : (stepCounts[def.step - 1] || baseCount);
      const reach_pct = Math.round((count / baseCount) * 100);
      const dropoff_pct = prevCount > 0 ? Math.max(0, Math.round(((prevCount - count) / prevCount) * 100)) : 0;

      return {
        step: def.step,
        title_vi: def.title_vi,
        title_en: def.title_en,
        count,
        reach_pct,
        dropoff_pct
      };
    });

    // Traffic sources breakdown
    interface SourceBucket {
      source: string;
      campaign: string;
      medium: string;
      views: number;
      unique_visitors_set: Set<string>;
      starts: number;
      completions: number;
      leads: number;
      app_clicks: number;
      last_active_at: string;
    }

    const sourceMap: Record<string, SourceBucket> = {};
    pageViews.forEach(e => {
      const src = e.metadata?.source || e.metadata?.utm_source || (e.referrer ? cleanReferrer(e.referrer) : 'Trực tiếp (Direct)');
      const campaign = e.metadata?.campaign || e.metadata?.utm_campaign || '-';
      const medium = e.metadata?.utm_medium || '-';
      const key = `${src}__${campaign}__${medium}`;

      if (!sourceMap[key]) {
        sourceMap[key] = {
          source: src,
          campaign,
          medium,
          views: 0,
          unique_visitors_set: new Set<string>(),
          starts: 0,
          completions: 0,
          leads: 0,
          app_clicks: 0,
          last_active_at: e.created_at
        };
      }
      sourceMap[key].views += 1;
      sourceMap[key].unique_visitors_set.add(e.visitor_id || e.session_id || '');
      if (new Date(e.created_at) > new Date(sourceMap[key].last_active_at)) {
        sourceMap[key].last_active_at = e.created_at;
      }
    });

    starts.forEach(e => {
      const src = e.metadata?.utm_source || (e.referrer ? cleanReferrer(e.referrer) : 'Trực tiếp (Direct)');
      const campaign = e.metadata?.utm_campaign || '-';
      const medium = e.metadata?.utm_medium || '-';
      const key = `${src}__${campaign}__${medium}`;
      if (sourceMap[key]) sourceMap[key].starts += 1;
    });

    completions.forEach(e => {
      const src = e.metadata?.utm_source || (e.referrer ? cleanReferrer(e.referrer) : 'Trực tiếp (Direct)');
      const campaign = e.metadata?.utm_campaign || '-';
      const medium = e.metadata?.utm_medium || '-';
      const key = `${src}__${campaign}__${medium}`;
      if (sourceMap[key]) sourceMap[key].completions += 1;
    });

    leads.forEach(() => {
      const key = Object.keys(sourceMap)[0];
      if (key && sourceMap[key]) sourceMap[key].leads += 1;
    });

    appClicks.forEach(e => {
      const src = e.metadata?.utm_source || (e.referrer ? cleanReferrer(e.referrer) : 'Trực tiếp (Direct)');
      const campaign = e.metadata?.utm_campaign || '-';
      const medium = e.metadata?.utm_medium || '-';
      const key = `${src}__${campaign}__${medium}`;
      if (sourceMap[key]) sourceMap[key].app_clicks += 1;
    });

    const traffic_sources = Object.values(sourceMap).map(s => ({
      source: s.source,
      campaign: s.campaign,
      medium: s.medium,
      views: s.views,
      unique_visitors: s.unique_visitors_set.size,
      starts: s.starts,
      completions: s.completions,
      leads: s.leads,
      app_clicks: s.app_clicks,
      last_active_at: toVnTime(s.last_active_at)
    })).sort((a, b) => b.views - a.views);

    // Recent submissions
    interface SubmissionRecord {
      id: string;
      created_at_vn: string;
      event_type: string;
      email?: string;
      isi_score: number;
      device: string;
      platform?: string;
      issues?: string[];
      pills_use?: string;
      duration?: string;
      source: string;
      app_clicked: boolean;
    }

    const recent_submissions: SubmissionRecord[] = [];
    const appClickedVisitors = new Set(appClicks.map(e => e.visitor_id || e.session_id || ''));

    const combinedSubmissions = [...completions, ...leads];
    const seenIds = new Set<string>();

    combinedSubmissions.forEach(e => {
      if (seenIds.has(e.id)) return;
      seenIds.add(e.id);
      const email = e.metadata?.email || (e.metadata?.source === 'quiz_insomnia' ? e.metadata?.email : undefined);
      recent_submissions.push({
        id: e.id,
        created_at_vn: toVnTime(e.created_at),
        event_type: e.event_type,
        email: email || '',
        isi_score: Number(e.metadata?.isi_score) || 72,
        device: e.device_type === 'mobile' ? 'Mobile' : e.device_type === 'desktop' ? 'Desktop' : 'Tablet',
        platform: e.metadata?.platform || e.device_type,
        issues: e.metadata?.issues || [],
        pills_use: e.metadata?.pills_use || '',
        duration: e.metadata?.duration || '',
        source: e.metadata?.utm_source || cleanReferrer(e.referrer),
        app_clicked: appClickedVisitors.has(e.visitor_id || e.session_id || '')
      });
    });

    subs.forEach(s => {
      if (!recent_submissions.some(r => r.email === s.email)) {
        recent_submissions.push({
          id: s.id,
          created_at_vn: toVnTime(s.consented_at),
          event_type: 'lead_submit',
          email: s.email,
          isi_score: 72,
          device: 'Mobile',
          source: 'quiz_insomnia',
          app_clicked: false
        });
      }
    });

    recent_submissions.sort((a, b) => (b.created_at_vn > a.created_at_vn ? 1 : -1));

    return {
      summary,
      step_waterfall,
      traffic_sources,
      recent_submissions: recent_submissions.slice(0, 50)
    };
  } catch (err) {
    console.error('processInsomniaQuizAnalytics error:', err);
    return null;
  }
}

function cleanReferrer(ref?: string): string {
  if (!ref) return 'Trực tiếp (Direct)';
  if (ref.includes('facebook') || ref.includes('fb')) return 'Facebook';
  if (ref.includes('tiktok')) return 'TikTok';
  if (ref.includes('instagram') || ref.includes('ig')) return 'Instagram';
  if (ref.includes('google')) return 'Google';
  if (ref.includes('botly')) return 'Botly Internal';
  return ref.slice(0, 30);
}
