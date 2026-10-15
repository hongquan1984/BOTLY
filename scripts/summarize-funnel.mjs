import fs from 'fs';

const SUPABASE_URL = 'https://rswmadukvegraxfcdbcb.supabase.co';
const SERVICE_KEY = 'sb_secret_V0mR7XNH85YEwk7bsP9d4Q_XG7nk3ED';

async function fetchAllEvents() {
  let allEvents = [];
  let pageSize = 1000;
  let offset = 0;
  let hasMore = true;

  while (hasMore && offset < 10000) {
    const url = `${SUPABASE_URL}/rest/v1/analytics_events?order=created_at.desc&limit=${pageSize}&offset=${offset}`;
    const res = await fetch(url, {
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` }
    });
    if (!res.ok) break;
    const data = await res.json();
    if (!data.length) break;
    allEvents = allEvents.concat(data);
    offset += pageSize;
    if (data.length < pageSize) hasMore = false;
  }
  return allEvents;
}

async function main() {
  const events = await fetchAllEvents();

  const toVN = (isoStr) => {
    if (!isoStr) return '';
    const d = new Date(new Date(isoStr).getTime() + 7 * 3600 * 1000);
    return d.toISOString().replace('T', ' ').replace('Z', '').slice(0, 19);
  };
  const getVNDate = (isoStr) => {
    if (!isoStr) return '';
    const d = new Date(new Date(isoStr).getTime() + 7 * 3600 * 1000);
    return d.toISOString().slice(0, 10);
  };

  const isInternal = (e) => {
    const ref = (e.referrer || '').toLowerCase();
    const meta = e.metadata || {};
    const ua = (e.user_agent || '').toLowerCase();
    return (
      ref.includes('localhost') ||
      ref.includes('127.0.0.1') ||
      meta.is_test ||
      meta.is_dev ||
      ua.includes('headlesschrome') ||
      ua.includes('bot')
    );
  };

  const prodEvents = events.filter(e => !isInternal(e));
  const testEvents = events.filter(e => isInternal(e));

  console.log(`TOTAL: ${events.length} events (PROD: ${prodEvents.length}, TEST: ${testEvents.length})`);

  // Daily statistics for Prod
  const daily = {};
  prodEvents.forEach(e => {
    const d = getVNDate(e.created_at);
    if (!daily[d]) {
      daily[d] = {
        date: d,
        quiz_views: 0,
        quiz_starts: 0,
        quiz_completes: 0,
        quiz_results: 0,
        night_views: 0,
        night_starts: 0,
        audio_durations: [],
        app_clicks: 0
      };
    }
    const item = daily[d];
    const p = (e.path || '').toLowerCase();
    const t = (e.event_type || '').toLowerCase();
    const m = e.metadata || {};

    if (p.includes('/quiz-insomnia') || p.includes('/sleep-quiz') || p.includes('/quizinsomnia')) {
      if (t === 'page_view') item.quiz_views++;
    }
    if (t === 'quiz_started' || t === 'quiz_start') item.quiz_starts++;
    if (t === 'quiz_completed' || t === 'quiz_complete') item.quiz_completes++;
    if (t === 'quiz_result_view' || p.includes('/result')) item.quiz_results++;

    if (p.includes('/night-companion')) {
      if (t === 'page_view') item.night_views++;
    }
    if (t === 'night_1_click' || t === 'night_1_start_click' || t === 'audio_start' || t === 'playback_started') {
      item.night_starts++;
    }
    if (m.listened_seconds || m.duration_seconds || m.seconds_listened) {
      item.audio_durations.push(m.listened_seconds || m.duration_seconds || m.seconds_listened);
    }
    if (t.includes('app_download') || p.includes('/app') || p.includes('/tai-app')) {
      item.app_clicks++;
    }
  });

  console.log('\n=== DAILY PRODUCTION STATS ===');
  const tableData = Object.keys(daily).sort().map(d => {
    const row = daily[d];
    return {
      Date: row.date,
      QuizViews: row.quiz_views,
      QuizStarts: row.quiz_starts,
      QuizCompletes: row.quiz_completes,
      ResultViews: row.quiz_results,
      NightViews: row.night_views,
      NightStarts: row.night_starts,
      AppClicks: row.app_clicks
    };
  });
  console.table(tableData);

  // Question waterfall in Prod
  const questionSteps = {};
  prodEvents.forEach(e => {
    const m = e.metadata || {};
    const q = m.question_id || m.step_id || (m.step ? `step_${m.step}` : null);
    if (q) {
      if (!questionSteps[q]) questionSteps[q] = { views: 0, answers: 0 };
      if (e.event_type === 'quiz_step_view') questionSteps[q].views++;
      if (e.event_type === 'quiz_answered' || e.event_type === 'quiz_step_completed') questionSteps[q].answers++;
    }
  });
  console.log('\n=== QUIZ QUESTIONS WATERFALL (PROD) ===');
  console.table(questionSteps);

  // Audio sessions analysis
  console.log('\n=== NIGHT 1 AUDIO LISTENING DISTRIBUTION (PROD) ===');
  const allDurations = [];
  prodEvents.forEach(e => {
    const m = e.metadata || {};
    const sec = m.listened_seconds || m.duration_seconds || m.seconds_listened;
    if (typeof sec === 'number' && sec > 0) allDurations.push(sec);
  });
  allDurations.sort((a,b)=>a-b);
  console.log(`Total listening records: ${allDurations.length}`);
  if (allDurations.length) {
    const cUnder1 = allDurations.filter(s => s < 60).length;
    const c1to3 = allDurations.filter(s => s >= 60 && s < 180).length;
    const c3to5 = allDurations.filter(s => s >= 180 && s < 300).length;
    const c5to10 = allDurations.filter(s => s >= 300 && s < 600).length;
    const cOver10 = allDurations.filter(s => s >= 600).length;
    const median = allDurations[Math.floor(allDurations.length / 2)];
    console.log({
      '< 1 min (Drop fast)': cUnder1,
      '1 - 3 min (Testing)': c1to3,
      '3 - 5 min (Engaged)': c3to5,
      '5 - 10 min (Deep relax)': c5to10,
      '> 10 min (Full/Sleep)': cOver10,
      'Median seconds': median,
      'Max seconds': allDurations[allDurations.length - 1]
    });
  }

  // Look at unique visitors/sessions
  const quizSessions = new Set();
  const quizCompleteSessions = new Set();
  const nightSessions = new Set();
  const nightAudioSessions = new Set();

  prodEvents.forEach(e => {
    const p = (e.path || '').toLowerCase();
    const t = (e.event_type || '').toLowerCase();
    const s = e.session_id || e.anonymous_id || (e.ip + '_' + (e.user_agent || '').slice(0, 20));

    if (p.includes('quiz') || t.includes('quiz')) {
      quizSessions.add(s);
    }
    if (t === 'quiz_completed' || t === 'quiz_complete') {
      quizCompleteSessions.add(s);
    }
    if (p.includes('night-companion')) {
      nightSessions.add(s);
    }
    if (t.includes('audio_start') || t.includes('night_1_start')) {
      nightAudioSessions.add(s);
    }
  });

  console.log('\n=== UNIQUE SESSIONS FUNNEL ===');
  console.log(`Unique Sessions on Quiz: ${quizSessions.size}`);
  console.log(`Unique Sessions completing Quiz: ${quizCompleteSessions.size} (${((quizCompleteSessions.size/quizSessions.size)*100).toFixed(1)}%)`);
  console.log(`Unique Sessions visiting Night Companion: ${nightSessions.size}`);
  console.log(`Unique Sessions starting Night 1 Audio: ${nightAudioSessions.size} (${((nightAudioSessions.size/nightSessions.size)*100).toFixed(1)}% of visitors)`);

  // Traffic overlap: Did quiz completers go to Night Companion?
  const quizCompletersWentToNight = [...quizCompleteSessions].filter(s => nightSessions.has(s)).length;
  console.log(`Quiz Completers who visited Night Companion: ${quizCompletersWentToNight} (${((quizCompletersWentToNight/quizCompleteSessions.size)*100).toFixed(1)}%)`);
}

main().catch(console.error);
