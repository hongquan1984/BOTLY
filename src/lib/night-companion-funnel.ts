export interface FunnelBreakdown {
  quiz_starts: number;
  quiz_completes: number;
  result_views: number;
  map_views: number;
  night_1_clicks: number;
  night_1_started: number;
  audio_starts: number;
  audio_completed_coverage: number;
  listening_distribution: {
    under_1m: number;
    from_1m_to_3m: number;
    from_3m_to_5m: number;
    from_5m_to_10m: number;
    over_10m: number;
    median_seconds: number;
    total_seconds_sum: number;
  };
  night_locked_clicks: Record<number, number>;
  total_night_2_plus_clicks: number;
  waitlist_signups: number;
  waitlist_by_night: Record<number, number>;
  returning_users: number;
  night_1_replays: number;
  waterfall_questions: Array<{
    step: number;
    question_id: string;
    views: number;
    answers: number;
    dropoff_count: number;
    reach_pct: number;
    dropoff_pct: number;
  }>;
}

export interface FunnelReportData {
  production: FunnelBreakdown;
  test: FunnelBreakdown;
  generated_at: string;
}

const QUESTION_ORDER = [
  { step: 1, id: 'gender' },
  { step: 2, id: 'issues' },
  { step: 3, id: 'frequency' },
  { step: 4, id: 'duration' },
  { step: 5, id: 'age_group' },
  { step: 6, id: 'insight_1' },
  { step: 7, id: 'sleep_hours' },
  { step: 8, id: 'insight_2' },
  { step: 9, id: 'bedtime_tension' },
  { step: 10, id: 'racing_thoughts' },
  { step: 11, id: 'insight_3' },
  { step: 12, id: 'sleep_support' },
  { step: 13, id: 'concerns' },
  { step: 14, id: 'insight_4' },
  { step: 15, id: 'primary_goal' },
];

function createEmptyBreakdown(): FunnelBreakdown {
  return {
    quiz_starts: 0,
    quiz_completes: 0,
    result_views: 0,
    map_views: 0,
    night_1_clicks: 0,
    night_1_started: 0,
    audio_starts: 0,
    audio_completed_coverage: 0,
    listening_distribution: {
      under_1m: 0,
      from_1m_to_3m: 0,
      from_3m_to_5m: 0,
      from_5m_to_10m: 0,
      over_10m: 0,
      median_seconds: 0,
      total_seconds_sum: 0,
    },
    night_locked_clicks: { 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 },
    total_night_2_plus_clicks: 0,
    waitlist_signups: 0,
    waitlist_by_night: { 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 },
    returning_users: 0,
    night_1_replays: 0,
    waterfall_questions: QUESTION_ORDER.map(q => ({
      step: q.step,
      question_id: q.id,
      views: 0,
      answers: 0,
      dropoff_count: 0,
      reach_pct: 0,
      dropoff_pct: 0,
    })),
  };
}

export async function processNightCompanionFunnel(url: string, serviceKey: string): Promise<FunnelReportData> {
  const [eventsRes, waitlistRes] = await Promise.all([
    fetch(`${url}/rest/v1/analytics_events?order=created_at.desc&limit=5000`, {
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
    }),
    fetch(`${url}/rest/v1/night_companion_waitlist?order=created_at.desc&limit=1000`, {
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
    }),
  ]);

  const rawEvents = eventsRes.ok ? ((await eventsRes.json()) as Array<{
    event_type: string;
    visitor_id?: string;
    metadata?: Record<string, unknown>;
  }>) : [];

  const rawWaitlist = waitlistRes.ok ? ((await waitlistRes.json()) as Array<{
    id: string;
    normalized_email: string;
    clicked_night: number;
    created_at: string;
  }>) : [];

  const prod = createEmptyBreakdown();
  const test = createEmptyBreakdown();

  const prodListeningSeconds: number[] = [];
  const testListeningSeconds: number[] = [];

  const questionViewsMapProd: Record<number, number> = {};
  const questionAnswersMapProd: Record<number, number> = {};
  const questionViewsMapTest: Record<number, number> = {};
  const questionAnswersMapTest: Record<number, number> = {};

  for (const ev of rawEvents) {
    const meta = ev.metadata || {};
    const isTest = Boolean(
      meta.is_test ||
      (typeof ev.visitor_id === 'string' && ev.visitor_id.startsWith('test_')) ||
      (typeof meta.email === 'string' && meta.email.includes('test'))
    );

    const b = isTest ? test : prod;
    const listeningArr = isTest ? testListeningSeconds : prodListeningSeconds;
    const qViewsMap = isTest ? questionViewsMapTest : questionViewsMapProd;
    const qAnsMap = isTest ? questionAnswersMapTest : questionAnswersMapProd;

    const eventName = ev.event_type;

    if (eventName === 'quiz_start' || eventName === 'quiz_started') {
      b.quiz_starts++;
    } else if (eventName === 'quiz_completed' || eventName === 'quiz_complete') {
      b.quiz_completes++;
    } else if (eventName === 'result_view' || eventName === 'result_viewed') {
      b.result_views++;
    } else if (eventName === 'journey_map_viewed') {
      b.map_views++;
    } else if (eventName === 'night_1_card_clicked' || eventName === 'beta_cta_click') {
      b.night_1_clicks++;
    } else if (eventName === 'night_1_started') {
      b.night_1_started++;
    } else if (eventName === 'audio_started') {
      b.audio_starts++;
    } else if (eventName === 'audio_stopped' || eventName === 'audio_progress' || eventName === 'audio_track_ended') {
      const listened = typeof meta.total_seconds_listened === 'number' ? meta.total_seconds_listened : 0;
      if (listened > 0 && eventName === 'audio_stopped') {
        listeningArr.push(listened);
      }
      const coverage = typeof meta.voice_coverage_pct === 'number' ? meta.voice_coverage_pct : 0;
      if (coverage >= 80 && (eventName === 'audio_track_ended' || eventName === 'audio_stopped')) {
        b.audio_completed_coverage++;
      }
    } else if (eventName === 'journey_night_clicked') {
      const nightNum = Number(meta.clicked_night);
      if (nightNum >= 2 && nightNum <= 7) {
        b.night_locked_clicks[nightNum] = (b.night_locked_clicks[nightNum] || 0) + 1;
        b.total_night_2_plus_clicks++;
      }
    } else if (eventName === 'returning_user_detected') {
      b.returning_users++;
    } else if (eventName === 'night_1_replayed') {
      b.night_1_replays++;
    } else if (eventName === 'quiz_question_viewed') {
      const step = Number(meta.question_index);
      if (step >= 1 && step <= 15) {
        qViewsMap[step] = (qViewsMap[step] || 0) + 1;
      }
    } else if (eventName === 'quiz_answer_submitted') {
      const step = Number(meta.question_index);
      if (step >= 1 && step <= 15) {
        qAnsMap[step] = (qAnsMap[step] || 0) + 1;
      }
    }
  }

  // Populate waitlist counts
  for (const item of rawWaitlist) {
    const isTest = item.normalized_email.includes('test') || item.normalized_email.includes('example');
    const b = isTest ? test : prod;
    b.waitlist_signups++;
    const night = item.clicked_night || 2;
    b.waitlist_by_night[night] = (b.waitlist_by_night[night] || 0) + 1;
  }

  // Populate listening distribution
  const calcDistribution = (b: FunnelBreakdown, seconds: number[]) => {
    if (!seconds.length) return;
    seconds.sort((a, b) => a - b);
    for (const s of seconds) {
      b.listening_distribution.total_seconds_sum += s;
      if (s < 60) b.listening_distribution.under_1m++;
      else if (s <= 180) b.listening_distribution.from_1m_to_3m++;
      else if (s <= 300) b.listening_distribution.from_3m_to_5m++;
      else if (s <= 600) b.listening_distribution.from_5m_to_10m++;
      else b.listening_distribution.over_10m++;
    }
    const mid = Math.floor(seconds.length / 2);
    b.listening_distribution.median_seconds = seconds.length % 2 === 0
      ? Math.round((seconds[mid - 1] + seconds[mid]) / 2)
      : Math.round(seconds[mid]);
  };

  calcDistribution(prod, prodListeningSeconds);
  calcDistribution(test, testListeningSeconds);

  // Populate waterfall
  const calcWaterfall = (b: FunnelBreakdown, viewsMap: Record<number, number>, ansMap: Record<number, number>) => {
    const base = b.quiz_starts || 1;
    let prevViews = b.quiz_starts;
    for (let i = 0; i < b.waterfall_questions.length; i++) {
      const q = b.waterfall_questions[i];
      const views = viewsMap[q.step] || 0;
      const ans = ansMap[q.step] || 0;
      q.views = views;
      q.answers = ans;
      q.reach_pct = Math.round((views / base) * 100);
      q.dropoff_count = Math.max(0, prevViews - views);
      q.dropoff_pct = prevViews > 0 ? Math.round((q.dropoff_count / prevViews) * 100) : 0;
      prevViews = views;
    }
  };

  calcWaterfall(prod, questionViewsMapProd, questionAnswersMapProd);
  calcWaterfall(test, questionViewsMapTest, questionAnswersMapTest);

  return {
    production: prod,
    test,
    generated_at: new Date().toISOString(),
  };
}
