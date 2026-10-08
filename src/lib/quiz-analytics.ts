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
    question_index?: number;
    question_id?: string;
    answer_value?: string;
    isi_score?: number | string;
    night_pattern?: string;
    primary_pattern?: string;
    secondary_pattern?: string;
    primary_goal?: string;
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
    answers?: {
      gender?: string;
      ageGroup?: string;
      issues?: string[];
      frequency?: string;
      duration?: string;
      sleepHours?: string;
      bedtimeTension?: string;
      racingThoughts?: string;
      sleepSupport?: string;
      concerns?: string[];
      primaryGoal?: string;
    };
    quiz_attempt_id?: string;
    [key: string]: unknown;
  };
}

export interface InsomniaQuizSubscriber {
  id: string;
  email: string;
  source: string;
  consented_at: string;
}

export interface PatternBreakdownItem {
  pattern_key: string;
  label_vi: string;
  label_en: string;
  count: number;
  percentage: number;
  color: string;
  desc_vi: string;
}

export interface IssueBreakdownItem {
  issue_key: string;
  label_vi: string;
  label_en: string;
  count: number;
  percentage: number;
}

export interface GoalBreakdownItem {
  goal_key: string;
  label_vi: string;
  label_en: string;
  count: number;
  percentage: number;
}

export interface SupportBreakdownItem {
  support_key: string;
  label_vi: string;
  label_en: string;
  count: number;
  percentage: number;
}

export interface PostQuizFunnelItem {
  key: string;
  label_vi: string;
  label_en: string;
  count: number;
  conversion_rate: number;
  icon_name: string;
}

export interface PostQuizPeriodData {
  period: 'today' | 'week' | 'month' | 'all';
  label_vi: string;
  completions: number;
  night_1_clicks: number;
  unique_night_1: number;
  night_1_rate: number;
  app_clicks: number;
  unique_app: number;
  app_rate: number;
  waitlist_signups: number;
  unique_waitlist: number;
  waitlist_rate: number;
  funnel: PostQuizFunnelItem[];
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
    start_rate: number;
    completion_rate: number;
    
    // Post-quiz actions
    night_1_clicks: number;
    today_night_1_clicks: number;
    night_1_rate: number;
    app_clicks: number;
    today_app_clicks: number;
    app_clicks_ios: number;
    app_clicks_android: number;
    app_download_rate: number;
    waitlist_signups: number;
    today_waitlist_signups: number;
    waitlist_rate: number;
    recommendation_clicks: number;

    top_pattern: string;
    top_pattern_label: string;

    // Backward compatibility
    leads: number;
    today_leads: number;
    lead_rate: number;
    avg_isi_score: number;
  };
  step_waterfall: Array<{
    step: number;
    title_vi: string;
    title_en: string;
    count: number;
    reach_pct: number;
    dropoff_pct: number;
  }>;
  pattern_breakdown: PatternBreakdownItem[];
  issues_breakdown: IssueBreakdownItem[];
  goals_breakdown: GoalBreakdownItem[];
  support_breakdown: SupportBreakdownItem[];
  post_quiz_funnel: PostQuizFunnelItem[];
  post_quiz_by_period: Record<'today' | 'week' | 'month' | 'all', PostQuizPeriodData>;
  traffic_sources: Array<{
    source: string;
    campaign: string;
    medium: string;
    views: number;
    unique_visitors: number;
    starts: number;
    completions: number;
    night_1_clicks: number;
    app_clicks: number;
    leads: number;
    last_active_at: string;
  }>;
  recent_submissions: Array<{
    id: string;
    created_at_vn: string;
    event_type: string;
    email?: string;
    isi_score: number;
    night_pattern: string;
    night_pattern_label: string;
    secondary_pattern?: string;
    primary_goal?: string;
    primary_goal_label?: string;
    issues?: string[];
    issues_labels?: string[];
    sleep_support?: string;
    frequency?: string;
    duration?: string;
    sleep_hours?: string;
    device: string;
    platform?: string;
    source: string;
    clicked_night_1: boolean;
    app_clicked: boolean;
    waitlist_signed: boolean;
    pills_use?: string;
  }>;
}

export const PATTERN_INFO: Record<string, { label_vi: string; label_en: string; color: string; desc_vi: string }> = {
  RACING_MIND: {
    label_vi: 'Tâm Trí Bận Rộn / Quay Cuồng',
    label_en: 'Racing Mind',
    color: '#818cf8',
    desc_vi: 'Tâm trí liên tục mở các vòng lặp suy nghĩ khi lên giường, khó ngắt kết nối với lo toan.'
  },
  SLEEP_ANXIETY: {
    label_vi: 'Lo Âu Trước Giờ Đi Ngủ',
    label_en: 'Sleep Anxiety',
    color: '#f43f5e',
    desc_vi: 'Cảm giác hồi hộp, sợ không ngủ được, cố gắng ép bản thân ngủ tạo phản tác dụng.'
  },
  STRESS_CARRYOVER: {
    label_vi: 'Căng Thẳng Kéo Dài Sang Đêm',
    label_en: 'Stress Carryover',
    color: '#f59e0b',
    desc_vi: 'Áp lực công việc ban ngày bám riết vào phòng ngủ, cơ thể chưa kịp xả áp.'
  },
  BEDTIME_PROCRASTINATION: {
    label_vi: 'Trì Hoãn Giờ Lên Giường',
    label_en: 'Bedtime Procrastination',
    color: '#a855f7',
    desc_vi: 'Cố thức để bù đắp thời gian tự do cá nhân, lướt điện thoại muộn dù biết cần ngủ.'
  },
  NIGHT_WAKING: {
    label_vi: 'Thức Giấc Lúc Nửa Đêm',
    label_en: 'Night Waking',
    color: '#06b6d4',
    desc_vi: 'Dễ ngủ ban đầu nhưng thường xuyên giật mình thức giấc lúc 1h-3h sáng và khó ngủ lại.'
  },
  SLEEP_RHYTHM: {
    label_vi: 'Rối Loạn Nhịp Sinh Học',
    label_en: 'Sleep Rhythm',
    color: '#10b981',
    desc_vi: 'Giờ ngủ và giờ thức thất thường, đồng hồ sinh học bị lệch pha so với chu kỳ tự nhiên.'
  }
};

export const ISSUE_LABELS: Record<string, { vi: string; en: string }> = {
  racing_mind: { vi: 'Tâm trí không dừng suy nghĩ', en: "Can't stop thinking" },
  difficulty_falling_asleep: { vi: 'Khó vào giấc ngủ ban đầu', en: 'Struggle to fall asleep' },
  night_waking: { vi: 'Thức giấc giữa đêm', en: 'Wake up during the night' },
  sleep_anxiety: { vi: 'Lo lắng khi sắp đến giờ ngủ', en: 'Anxious about sleep' },
  phone_use: { vi: 'Dùng điện thoại quá khuya', en: 'Phone use before bed' },
  stress_carryover: { vi: 'Mang stress ban ngày lên giường', en: 'Stress follows into bed' },
  inconsistent_routine: { vi: 'Lịch ngủ xáo trộn, thất thường', en: 'Inconsistent schedule' },
  bedtime_procrastination: { vi: 'Trì hoãn giờ đi ngủ', en: 'Delaying bedtime' },
  other: { vi: 'Vấn đề khác', en: 'Other' }
};

export const GOAL_LABELS: Record<string, { vi: string; en: string }> = {
  quiet_mind: { vi: 'Làm dịu tâm trí, ngừng suy nghĩ', en: 'Quiet my mind' },
  fall_asleep: { vi: 'Đi vào giấc ngủ dễ dàng hơn', en: 'Fall asleep more easily' },
  less_anxious: { vi: 'Bớt lo âu, bồn chồn trước khi ngủ', en: 'Feel less anxious before bed' },
  stop_waking: { vi: 'Chấm dứt tỉnh giấc giữa đêm', en: 'Stop waking during the night' },
  phone_earlier: { vi: 'Cất điện thoại sớm hơn để đi ngủ', en: 'Put phone down earlier' },
  consistent_routine: { vi: 'Xây dựng thói quen đi ngủ đều đặn', en: 'Build consistent sleep routine' },
  calmer_night: { vi: 'Cảm thấy bình an hơn vào ban đêm', en: 'Feel calmer at night' }
};

export const SUPPORT_LABELS: Record<string, { vi: string; en: string }> = {
  None: { vi: 'Không dùng thuốc hay hỗ trợ', en: 'None' },
  Melatonin: { vi: 'Sử dụng kẹo/viên Melatonin', en: 'Melatonin' },
  'Prescription sleep medication': { vi: 'Thuốc ngủ kê đơn của bác sĩ', en: 'Prescription sleep medication' },
  'Over-the-counter sleep aids': { vi: 'Thảo dược hoặc thuốc không kê đơn', en: 'Over-the-counter sleep aids' },
  Other: { vi: 'Biện pháp hỗ trợ khác', en: 'Other' }
};

export async function processInsomniaQuizAnalytics(url: string, serviceKey: string): Promise<InsomniaQuizStats | null> {
  try {
    const [eventsRes, subsRes, waitlistRes] = await Promise.all([
      fetch(`${url}/rest/v1/analytics_events?or=(path.like.*quiz*,metadata->>funnel.eq.quiz_insomnia,metadata->>funnel.eq.night_pattern,event_type.like.*quiz*,event_type.in.(night_1_card_clicked,onboarding_app_download_click,waitlist_signup,beta_cta_click,start_plan_click,store_redirect,recommendation_click))&order=created_at.desc&limit=2500`, {
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }
      }),
      fetch(`${url}/rest/v1/newsletter_subscribers?source=eq.quiz_insomnia&order=consented_at.desc&limit=200`, {
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }
      }).catch(() => ({ ok: false, json: async () => [] })),
      fetch(`${url}/rest/v1/night_waitlist?order=created_at.desc&limit=200`, {
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }
      }).catch(() => ({ ok: false, json: async () => [] }))
    ]);

    const rawEvents: InsomniaQuizEvent[] = eventsRes.ok ? await eventsRes.json() : [];
    // Strictly filter out test traffic (localhost, admin visits, dev/test sessions)
    const events: InsomniaQuizEvent[] = rawEvents.filter(e => {
      const ref = String(e.referrer || '');
      const path = String(e.path || '');
      const meta = (e.metadata || {}) as Record<string, unknown>;
      if (ref.includes('localhost') || ref.includes('127.0.0.1')) return false;
      if (path.includes('/admin') || path.includes('/thong-ke') || path.includes('/thongke')) return false;
      if (meta.is_test === true || meta.is_dev === true || meta.exclude_tracking === true) return false;
      return true;
    });
    const subs: InsomniaQuizSubscriber[] = subsRes && 'ok' in subsRes && subsRes.ok ? await subsRes.json() : [];
    const waitlist = waitlistRes && 'ok' in waitlistRes && waitlistRes.ok ? await waitlistRes.json() : [];

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

    // 1. Page views & unique visitors
    const pageViews = events.filter(e => e.event_type === 'page_view' || e.event_type === 'quiz_view');
    const uniqueVisitorSet = new Set(pageViews.map(e => e.visitor_id || e.session_id || ''));
    const uniqueVisitors = uniqueVisitorSet.size || 1;

    const todayViews = pageViews.filter(e => isToday(e.created_at));
    const todayUniqueVisitors = new Set(todayViews.map(e => e.visitor_id || e.session_id || '')).size;

    // 2. Starts
    const starts = events.filter(e => e.event_type === 'quiz_started' || e.event_type === 'quiz_start');
    const uniqueStartUsers = new Set(starts.map(e => e.metadata?.quiz_attempt_id || e.visitor_id || e.session_id || ''));
    const totalStartsCount = Math.max(starts.length, uniqueStartUsers.size);
    const todayStarts = starts.filter(e => isToday(e.created_at));

    // 3. Completions
    const completions = events.filter(e => e.event_type === 'quiz_completed' || e.event_type === 'quiz_complete');
    const uniqueCompletionUsers = new Set(completions.map(e => e.metadata?.quiz_attempt_id || e.visitor_id || e.session_id || ''));
    const totalCompletionsCount = Math.max(completions.length, uniqueCompletionUsers.size);
    const todayCompletions = completions.filter(e => isToday(e.created_at));

    // 4. Post-quiz actions
    // Night 1 Clicks
    const night1Clicks = events.filter(e => e.event_type === 'night_1_card_clicked' || e.event_type === 'beta_cta_click');
    const todayNight1Clicks = night1Clicks.filter(e => isToday(e.created_at));
    const uniqueNight1Users = new Set(night1Clicks.map(e => e.metadata?.quiz_attempt_id || e.visitor_id || e.session_id || '')).size;

    // App Downloads Clicks
    const appClicks = events.filter(e =>
      e.event_type === 'onboarding_app_download_click' ||
      e.event_type === 'start_plan_click' ||
      e.event_type === 'store_redirect'
    );
    const todayAppClicks = appClicks.filter(e => isToday(e.created_at));
    const appClicksIos = appClicks.filter(e => e.metadata?.store === 'app_store' || e.metadata?.platform === 'ios');
    const appClicksAndroid = appClicks.filter(e => e.metadata?.store === 'google_play' || e.metadata?.platform === 'android');
    const uniqueAppClickUsers = new Set(appClicks.map(e => e.metadata?.quiz_attempt_id || e.visitor_id || e.session_id || '')).size;

    // Waitlist Signups & Leads
    const waitlistEvents = events.filter(e => e.event_type === 'waitlist_signup' || e.event_type === 'lead_submit');
    const totalWaitlistCount = Math.max(waitlistEvents.length, Array.isArray(waitlist) ? waitlist.length : 0, subs.length);
    const todayWaitlistCount = waitlistEvents.filter(e => isToday(e.created_at)).length;
    const uniqueWaitlistUsers = new Set(waitlistEvents.map(e => e.metadata?.quiz_attempt_id || e.visitor_id || e.session_id || '')).size;

    // Recommendation clicks
    const recoClicks = events.filter(e => e.event_type === 'recommendation_click');

    // Sets of visitors for correlation
    const night1VisitorSet = new Set(night1Clicks.map(e => e.metadata?.quiz_attempt_id || e.visitor_id || e.session_id || ''));
    const appClickedVisitorSet = new Set(appClicks.map(e => e.metadata?.quiz_attempt_id || e.visitor_id || e.session_id || ''));
    const waitlistVisitorSet = new Set(waitlistEvents.map(e => e.metadata?.quiz_attempt_id || e.visitor_id || e.session_id || ''));

    // 5. Gather pattern, issue, goal, support distributions
    const patternCountMap: Record<string, number> = {};
    const issueCountMap: Record<string, number> = {};
    const goalCountMap: Record<string, number> = {};
    const supportCountMap: Record<string, number> = {};

    // Map quiz_attempt_id to latest answers
    const attemptAnswersMap: Record<string, NonNullable<InsomniaQuizEvent['metadata']>['answers']> = {};

    events.forEach(e => {
      const meta = e.metadata;
      if (!meta) return;

      const attemptId = meta.quiz_attempt_id || e.session_id || e.visitor_id;
      if (attemptId && meta.answers) {
        attemptAnswersMap[attemptId] = {
          ...attemptAnswersMap[attemptId],
          ...meta.answers
        };
      }

      // Collect answers from quiz_answer_submitted
      if (e.event_type === 'quiz_answer_submitted' && meta.question_id && meta.answer_value && attemptId) {
        const qid = meta.question_id;
        const ans = meta.answer_value;
        if (!attemptAnswersMap[attemptId]) attemptAnswersMap[attemptId] = {};
        if (qid === 'primary_goal') attemptAnswersMap[attemptId]!.primaryGoal = ans;
        if (qid === 'sleep_support') attemptAnswersMap[attemptId]!.sleepSupport = ans;
        if (qid === 'issues') attemptAnswersMap[attemptId]!.issues = ans.split(',');
        if (qid === 'duration') attemptAnswersMap[attemptId]!.duration = ans;
        if (qid === 'frequency') attemptAnswersMap[attemptId]!.frequency = ans;
      }
    });

    completions.forEach(e => {
      const meta = e.metadata;
      const rawPat = meta?.primary_pattern || meta?.night_pattern || meta?.pattern;
      const pat = typeof rawPat === 'string' ? rawPat.toUpperCase() : '';
      if (pat) {
        patternCountMap[pat] = (patternCountMap[pat] || 0) + 1;
      }

      const goal = meta?.primary_goal;
      if (goal) {
        goalCountMap[goal] = (goalCountMap[goal] || 0) + 1;
      }
    });

    // Accumulate issues, goals, support from collected attempt answers
    Object.values(attemptAnswersMap).forEach(ans => {
      if (!ans) return;
      if (Array.isArray(ans.issues)) {
        ans.issues.forEach(i => {
          if (i) issueCountMap[i] = (issueCountMap[i] || 0) + 1;
        });
      }
      if (ans.primaryGoal) {
        goalCountMap[ans.primaryGoal] = (goalCountMap[ans.primaryGoal] || 0) + 1;
      }
      if (ans.sleepSupport) {
        supportCountMap[ans.sleepSupport] = (supportCountMap[ans.sleepSupport] || 0) + 1;
      }
    });

    // Calculate Top Pattern
    let topPatternKey = 'RACING_MIND';
    let topPatternMax = 0;
    Object.entries(patternCountMap).forEach(([k, v]) => {
      if (v > topPatternMax) {
        topPatternMax = v;
        topPatternKey = k;
      }
    });

    const topPatternInfo = PATTERN_INFO[topPatternKey] || {
      label_vi: topPatternKey,
      label_en: topPatternKey,
      color: '#818cf8',
      desc_vi: ''
    };

    // Calculate distributions
    const totalPatternsReported = Object.values(patternCountMap).reduce((a, b) => a + b, 0) || 1;
    const pattern_breakdown: PatternBreakdownItem[] = Object.keys(PATTERN_INFO).map(key => {
      const count = patternCountMap[key] || 0;
      const info = PATTERN_INFO[key];
      return {
        pattern_key: key,
        label_vi: info.label_vi,
        label_en: info.label_en,
        count,
        percentage: Math.round((count / totalPatternsReported) * 100),
        color: info.color,
        desc_vi: info.desc_vi
      };
    }).sort((a, b) => b.count - a.count);

    const totalIssuesCount = Object.values(issueCountMap).reduce((a, b) => a + b, 0) || 1;
    const issues_breakdown: IssueBreakdownItem[] = Object.entries(ISSUE_LABELS).map(([key, label]) => {
      const count = issueCountMap[key] || 0;
      return {
        issue_key: key,
        label_vi: label.vi,
        label_en: label.en,
        count,
        percentage: Math.round((count / totalIssuesCount) * 100)
      };
    }).sort((a, b) => b.count - a.count);

    const totalGoalsCount = Object.values(goalCountMap).reduce((a, b) => a + b, 0) || 1;
    const goals_breakdown: GoalBreakdownItem[] = Object.entries(GOAL_LABELS).map(([key, label]) => {
      const count = goalCountMap[key] || 0;
      return {
        goal_key: key,
        label_vi: label.vi,
        label_en: label.en,
        count,
        percentage: Math.round((count / totalGoalsCount) * 100)
      };
    }).sort((a, b) => b.count - a.count);

    const totalSupportCount = Object.values(supportCountMap).reduce((a, b) => a + b, 0) || 1;
    const support_breakdown: SupportBreakdownItem[] = Object.entries(SUPPORT_LABELS).map(([key, label]) => {
      const count = supportCountMap[key] || 0;
      return {
        support_key: key,
        label_vi: label.vi,
        label_en: label.en,
        count,
        percentage: Math.round((count / totalSupportCount) * 100)
      };
    }).sort((a, b) => b.count - a.count);

    // Summary calculations
    const summary = {
      page_views: pageViews.length,
      unique_visitors: uniqueVisitors,
      today_views: todayViews.length,
      today_unique_visitors: todayUniqueVisitors,
      starts: totalStartsCount,
      today_starts: todayStarts.length,
      completions: totalCompletionsCount,
      today_completions: todayCompletions.length,
      start_rate: uniqueVisitors > 0 ? Math.min(100, Math.round((totalStartsCount / uniqueVisitors) * 100)) : 0,
      completion_rate: totalStartsCount > 0 ? Math.min(100, Math.round((totalCompletionsCount / totalStartsCount) * 100)) : 0,

      night_1_clicks: night1Clicks.length,
      today_night_1_clicks: todayNight1Clicks.length,
      night_1_rate: totalCompletionsCount > 0 ? Math.min(100, Math.round((uniqueNight1Users / totalCompletionsCount) * 100)) : 0,

      app_clicks: appClicks.length,
      today_app_clicks: todayAppClicks.length,
      app_clicks_ios: appClicksIos.length,
      app_clicks_android: appClicksAndroid.length,
      app_download_rate: totalCompletionsCount > 0 ? Math.min(100, Math.round((uniqueAppClickUsers / totalCompletionsCount) * 100)) : 0,

      waitlist_signups: totalWaitlistCount,
      today_waitlist_signups: todayWaitlistCount,
      waitlist_rate: totalCompletionsCount > 0 ? Math.min(100, Math.round((uniqueWaitlistUsers / totalCompletionsCount) * 100)) : 0,
      recommendation_clicks: recoClicks.length,

      top_pattern: topPatternKey,
      top_pattern_label: topPatternInfo.label_vi,

      // Backward compatibility
      leads: totalWaitlistCount,
      today_leads: todayWaitlistCount,
      lead_rate: totalStartsCount > 0 ? Math.min(100, Math.round((totalWaitlistCount / totalStartsCount) * 100)) : 0,
      avg_isi_score: 72
    };

    // Post-quiz funnel steps
    const post_quiz_funnel: PostQuizFunnelItem[] = [
      {
        key: 'completions',
        label_vi: 'Hoàn Tất Quiz & Xem Phác Đồ',
        label_en: 'Completed Quiz & Viewed Plan',
        count: totalCompletionsCount,
        conversion_rate: 100,
        icon_name: 'CheckCircle2'
      },
      {
        key: 'night_1',
        label_vi: 'Bắt Đầu Kế Hoạch Đêm 1 (Night Companion)',
        label_en: 'Started Night 1 Sound Journey',
        count: night1Clicks.length,
        conversion_rate: totalCompletionsCount > 0 ? Math.min(100, Math.round((uniqueNight1Users / totalCompletionsCount) * 100)) : 0,
        icon_name: 'Moon'
      },
      {
        key: 'app_download',
        label_vi: 'Click Tải Ứng Dụng Soulscape',
        label_en: 'App Download Clicks (iOS & Android)',
        count: appClicks.length,
        conversion_rate: totalCompletionsCount > 0 ? Math.min(100, Math.round((uniqueAppClickUsers / totalCompletionsCount) * 100)) : 0,
        icon_name: 'Download'
      },
      {
        key: 'waitlist',
        label_vi: 'Đăng Ký Danh Sách Chờ & Nhắc Nhở',
        label_en: 'Waitlist & Notification Signups',
        count: totalWaitlistCount,
        conversion_rate: totalCompletionsCount > 0 ? Math.min(100, Math.round((uniqueWaitlistUsers / totalCompletionsCount) * 100)) : 0,
        icon_name: 'Mail'
      }
    ];

    // Period-filtered post quiz funnels (today / 7 days / 30 days / all)
    const nowTs = Date.now();
    const periodFilters: Record<'today' | 'week' | 'month' | 'all', (dateStr?: string) => boolean> = {
      today: (dateStr?: string) => isToday(dateStr),
      week: (dateStr?: string) => {
        if (!dateStr) return false;
        const t = new Date(dateStr).getTime();
        return !isNaN(t) && nowTs - t <= 7 * 86400 * 1000;
      },
      month: (dateStr?: string) => {
        if (!dateStr) return false;
        const t = new Date(dateStr).getTime();
        return !isNaN(t) && nowTs - t <= 30 * 86400 * 1000;
      },
      all: () => true
    };

    const periodLabels: Record<'today' | 'week' | 'month' | 'all', string> = {
      today: 'Hôm nay (24h)',
      week: '7 ngày qua (Tuần)',
      month: '30 ngày qua (Tháng)',
      all: 'Toàn thời gian'
    };

    const post_quiz_by_period: Record<'today' | 'week' | 'month' | 'all', PostQuizPeriodData> = {
      today: {} as PostQuizPeriodData,
      week: {} as PostQuizPeriodData,
      month: {} as PostQuizPeriodData,
      all: {} as PostQuizPeriodData
    };

    (['today', 'week', 'month', 'all'] as const).forEach(periodKey => {
      const filterFn = periodFilters[periodKey];

      // Completions for this period
      const pCompletions = completions.filter(e => filterFn(e.created_at));
      const pUniqueCompUsers = new Set(pCompletions.map(e => e.metadata?.quiz_attempt_id || e.visitor_id || e.session_id || ''));
      const pTotalCompletions = Math.max(pCompletions.length, pUniqueCompUsers.size);

      // Night 1 clicks
      const pNight1 = night1Clicks.filter(e => filterFn(e.created_at));
      const pNight1Users = new Set(pNight1.map(e => e.metadata?.quiz_attempt_id || e.visitor_id || e.session_id || '')).size;
      const pNight1Rate = pTotalCompletions > 0 ? Math.min(100, Math.round((pNight1Users / pTotalCompletions) * 100)) : 0;

      // App clicks
      const pAppClicks = appClicks.filter(e => filterFn(e.created_at));
      const pAppUsers = new Set(pAppClicks.map(e => e.metadata?.quiz_attempt_id || e.visitor_id || e.session_id || '')).size;
      const pAppRate = pTotalCompletions > 0 ? Math.min(100, Math.round((pAppUsers / pTotalCompletions) * 100)) : 0;

      // Waitlist
      const pWaitlistEvents = waitlistEvents.filter(e => filterFn(e.created_at));
      const pWaitlistTable = Array.isArray(waitlist) ? waitlist.filter((w: { created_at?: string }) => filterFn(w.created_at)).length : 0;
      const pSubs = subs.filter((s: InsomniaQuizSubscriber) => filterFn(s.consented_at)).length;
      const pTotalWaitlist = Math.max(pWaitlistEvents.length, pWaitlistTable, pSubs);
      const pWaitlistUsers = new Set(pWaitlistEvents.map(e => e.metadata?.quiz_attempt_id || e.visitor_id || e.session_id || '')).size;
      const pWaitlistRate = pTotalCompletions > 0 ? Math.min(100, Math.round((pWaitlistUsers / pTotalCompletions) * 100)) : 0;

      post_quiz_by_period[periodKey] = {
        period: periodKey,
        label_vi: periodLabels[periodKey],
        completions: pTotalCompletions,
        night_1_clicks: pNight1.length,
        unique_night_1: pNight1Users,
        night_1_rate: pNight1Rate,
        app_clicks: pAppClicks.length,
        unique_app: pAppUsers,
        app_rate: pAppRate,
        waitlist_signups: pTotalWaitlist,
        unique_waitlist: pWaitlistUsers,
        waitlist_rate: pWaitlistRate,
        funnel: [
          {
            key: 'completions',
            label_vi: 'Hoàn Tất Quiz & Xem Phác Đồ',
            label_en: 'Completed Quiz & Viewed Plan',
            count: pTotalCompletions,
            conversion_rate: 100,
            icon_name: 'CheckCircle2'
          },
          {
            key: 'night_1',
            label_vi: 'Bắt Đầu Kế Hoạch Đêm 1 (Night Companion)',
            label_en: 'Started Night 1 Sound Journey',
            count: pNight1.length,
            conversion_rate: pNight1Rate,
            icon_name: 'Moon'
          },
          {
            key: 'app_download',
            label_vi: 'Click Tải Ứng Dụng Soulscape',
            label_en: 'App Download Clicks (iOS & Android)',
            count: pAppClicks.length,
            conversion_rate: pAppRate,
            icon_name: 'Download'
          },
          {
            key: 'waitlist',
            label_vi: 'Đăng Ký Danh Sách Chờ & Nhắc Nhở',
            label_en: 'Waitlist & Notification Signups',
            count: pTotalWaitlist,
            conversion_rate: pWaitlistRate,
            icon_name: 'Mail'
          }
        ]
      };
    });

    // 6. Accurate 17 Steps Waterfall
    const STEP_DEFINITIONS = [
      { step: 0, title_vi: 'Trang Giới Thiệu (Hero)', title_en: 'Intro Landing' },
      { step: 1, title_vi: 'Giới Tính Sinh Học', title_en: 'Gender Identity' },
      { step: 2, title_vi: 'Vấn Đề Giấc Ngủ Chính', title_en: 'Main Sleep Issues' },
      { step: 3, title_vi: 'Tần Suất Mỗi Tuần', title_en: 'Weekly Frequency' },
      { step: 4, title_vi: 'Thời Gian Bị Mất Ngủ', title_en: 'Duration of Issue' },
      { step: 5, title_vi: 'Độ Tuổi Hiện Tại', title_en: 'Age Group' },
      { step: 6, title_vi: 'Insight 1: Nhận Diện Mẫu Hình', title_en: 'Pattern Emerging' },
      { step: 7, title_vi: 'Thời Lượng Ngủ Ban Đêm', title_en: 'Average Sleep Hours' },
      { step: 8, title_vi: 'Insight 2: Dao Động Giấc Ngủ', title_en: 'Sleep Variations' },
      { step: 9, title_vi: 'Mức Độ Căng Thẳng Buổi Tối', title_en: 'Bedtime Tension' },
      { step: 10, title_vi: 'Suy Nghĩ Quay Cuồng Khi Nằm', title_en: 'Racing Thoughts' },
      { step: 11, title_vi: 'Insight 3: Vòng Lặp Cố Gắng Ngủ', title_en: 'Sleep Effort Loop' },
      { step: 12, title_vi: 'Biện Pháp Hỗ Trợ Đang Dùng', title_en: 'Sleep Support & Pills' },
      { step: 13, title_vi: 'Mối Bận Tâm Về Biện Pháp', title_en: 'Support Concerns' },
      { step: 14, title_vi: 'Insight 4: Thiết Lập Kế Hoạch', title_en: 'Starting Plan' },
      { step: 15, title_vi: 'Mục Tiêu Giấc Ngủ Ưu Tiên', title_en: 'Primary Sleep Goal' },
      { step: 16, title_vi: 'Đang Tạo Phác Đồ Đêm Nay', title_en: 'Plan Generator' },
      { step: 17, title_vi: 'Xem Kết Quả & Phác Đồ Đêm 1', title_en: 'Result & Night 1' }
    ];

    const stepEvents = events.filter(e => e.event_type === 'quiz_step' || e.event_type === 'quiz_step_complete');
    const stepUniqueUsers: Record<number, Set<string>> = {};
    for (let s = 1; s <= 15; s++) stepUniqueUsers[s] = new Set();

    stepEvents.forEach(e => {
      const s = Number(e.metadata?.step);
      if (!isNaN(s) && s >= 1 && s <= 15) {
        const uid = e.metadata?.quiz_attempt_id || e.session_id || e.visitor_id || e.id;
        stepUniqueUsers[s].add(uid);
      }
    });

    const baseCount = Math.max(pageViews.length, totalStartsCount, 1);
    let previousStepCount = baseCount;

    const step_waterfall = STEP_DEFINITIONS.map(def => {
      let count = 0;
      if (def.step === 0) count = pageViews.length;
      else if (def.step === 1) count = Math.max(totalStartsCount, stepUniqueUsers[1]?.size || 0);
      else if (def.step >= 2 && def.step <= 15) count = stepUniqueUsers[def.step]?.size || 0;
      else if (def.step === 16) count = Math.max(totalCompletionsCount, stepUniqueUsers[15]?.size || 0);
      else if (def.step === 17) count = totalCompletionsCount;

      const reach_pct = Math.round((count / baseCount) * 100);
      const dropoff_pct = previousStepCount > 0 ? Math.max(0, Math.round(((previousStepCount - count) / previousStepCount) * 100)) : 0;
      previousStepCount = count > 0 ? count : previousStepCount;

      return {
        step: def.step,
        title_vi: def.title_vi,
        title_en: def.title_en,
        count,
        reach_pct,
        dropoff_pct
      };
    });

    // 7. Traffic sources breakdown
    interface SourceBucket {
      source: string;
      campaign: string;
      medium: string;
      views: number;
      unique_visitors_set: Set<string>;
      starts: number;
      completions: number;
      night_1_clicks: number;
      app_clicks: number;
      leads: number;
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
          night_1_clicks: 0,
          app_clicks: 0,
          leads: 0,
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

    night1Clicks.forEach(e => {
      const src = e.metadata?.utm_source || (e.referrer ? cleanReferrer(e.referrer) : 'Trực tiếp (Direct)');
      const campaign = e.metadata?.utm_campaign || '-';
      const medium = e.metadata?.utm_medium || '-';
      const key = `${src}__${campaign}__${medium}`;
      if (sourceMap[key]) sourceMap[key].night_1_clicks += 1;
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
      night_1_clicks: s.night_1_clicks,
      app_clicks: s.app_clicks,
      leads: s.leads,
      last_active_at: toVnTime(s.last_active_at)
    })).sort((a, b) => b.views - a.views);

    // 8. Recent submissions feed with real data
    const recent_submissions: InsomniaQuizStats['recent_submissions'] = [];
    const seenAttemptIds = new Set<string>();

    completions.forEach(e => {
      const meta = e.metadata;
      const attemptId = meta?.quiz_attempt_id || e.id;
      if (seenAttemptIds.has(attemptId)) return;
      seenAttemptIds.add(attemptId);

      const rawPat = meta?.primary_pattern || meta?.night_pattern || meta?.pattern;
      const patKey = (typeof rawPat === 'string' ? rawPat : 'RACING_MIND').toUpperCase();
      const patInfo = PATTERN_INFO[patKey] || { label_vi: patKey, label_en: patKey };

      const ans = attemptAnswersMap[attemptId] || meta?.answers || {};
      const goalKey = typeof meta?.primary_goal === 'string' ? meta.primary_goal : (ans.primaryGoal || '');
      const goalInfo = GOAL_LABELS[goalKey];

      const rawIssues = ans.issues || meta?.issues || [];
      const issuesLabels = rawIssues.map(i => ISSUE_LABELS[i]?.vi || i);

      const uid = attemptId;
      const hasClickedNight1 = night1VisitorSet.has(uid) || night1VisitorSet.has(e.visitor_id || '') || night1VisitorSet.has(e.session_id || '');
      const hasClickedApp = appClickedVisitorSet.has(uid) || appClickedVisitorSet.has(e.visitor_id || '') || appClickedVisitorSet.has(e.session_id || '');
      const hasWaitlist = waitlistVisitorSet.has(uid) || waitlistVisitorSet.has(e.visitor_id || '') || waitlistVisitorSet.has(e.session_id || '');

      const email = meta?.email || '';

      recent_submissions.push({
        id: e.id,
        created_at_vn: toVnTime(e.created_at),
        event_type: e.event_type,
        email: email || '',
        isi_score: 72,
        night_pattern: patKey,
        night_pattern_label: patInfo.label_vi,
        secondary_pattern: meta?.secondary_pattern,
        primary_goal: goalKey,
        primary_goal_label: goalInfo?.vi || goalKey,
        issues: rawIssues,
        issues_labels: issuesLabels,
        sleep_support: ans.sleepSupport || SUPPORT_LABELS[ans.sleepSupport || '']?.vi || '',
        frequency: ans.frequency,
        duration: ans.duration,
        sleep_hours: ans.sleepHours,
        device: e.device_type === 'mobile' ? 'Mobile' : e.device_type === 'desktop' ? 'Desktop' : 'Tablet',
        platform: meta?.platform || e.device_type,
        source: meta?.utm_source || cleanReferrer(e.referrer),
        clicked_night_1: hasClickedNight1,
        app_clicked: hasClickedApp,
        waitlist_signed: hasWaitlist,
        pills_use: ans.sleepSupport
      });
    });

    recent_submissions.sort((a, b) => (b.created_at_vn > a.created_at_vn ? 1 : -1));

    return {
      summary,
      step_waterfall,
      pattern_breakdown,
      issues_breakdown,
      goals_breakdown,
      support_breakdown,
      post_quiz_funnel,
      post_quiz_by_period,
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
