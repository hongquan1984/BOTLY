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

async function fetchProfiles() {
  const url = `${SUPABASE_URL}/rest/v1/night_companion_profiles?order=created_at.desc&limit=1000`;
  const res = await fetch(url, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` }
  });
  if (!res.ok) return [];
  return await res.json();
}

async function main() {
  const [events, profiles] = await Promise.all([fetchAllEvents(), fetchProfiles()]);

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
    const pid = meta.night_profile_id || '';
    return (
      ref.includes('localhost') ||
      ref.includes('127.0.0.1') ||
      meta.is_test === true ||
      meta.is_dev === true ||
      pid.includes('test-seed') ||
      ua.includes('headlesschrome')
    );
  };

  const prodEvents = events.filter(e => !isInternal(e));
  const testEvents = events.filter(e => isInternal(e));

  // 1. QUIZ BREAKDOWN
  const quizStarts = prodEvents.filter(e => e.event_type === 'quiz_start' || e.event_type === 'quiz_started');
  const quizQuestionsViewed = prodEvents.filter(e => e.event_type === 'quiz_question_viewed');
  const quizAnswers = prodEvents.filter(e => e.event_type === 'quiz_answer_submitted' || e.event_type === 'quiz_step_complete');
  const quizCompletes = prodEvents.filter(e => e.event_type === 'quiz_complete' || e.event_type === 'quiz_completed');
  const resultViews = prodEvents.filter(e => e.event_type === 'result_view' || e.event_type === 'result_viewed');
  const journeyMapViews = prodEvents.filter(e => e.event_type === 'journey_map_viewed');

  // Waterfall questions
  const qStats = {};
  prodEvents.forEach(e => {
    const m = e.metadata || {};
    const q = m.question_id || m.step || m.id;
    if (q) {
      if (!qStats[q]) qStats[q] = { views: 0, answers: 0 };
      if (e.event_type === 'quiz_question_viewed') qStats[q].views++;
      if (e.event_type === 'quiz_answer_submitted') qStats[q].answers++;
    }
  });

  // Quiz Completers Profiles
  const completeDetails = quizCompletes.map(c => {
    const m = c.metadata || {};
    return {
      time: toVN(c.created_at),
      pattern: m.night_pattern || m.primary_pattern,
      isi: m.isi_score,
      goal: m.primary_goal,
      gender: m.gender,
      duration: m.duration,
      issues: m.issues
    };
  });

  // 2. NIGHT 1 / AUDIO BREAKDOWN
  const nightPageViews = prodEvents.filter(e => e.event_type === 'page_view' && (e.path || '').includes('/night-companion'));
  const night1CardClicks = prodEvents.filter(e => e.event_type === 'night_1_card_clicked');
  const night1Starts = prodEvents.filter(e => e.event_type === 'night_1_started' || e.event_type === 'audio_started');
  const audioStops = prodEvents.filter(e => e.event_type === 'audio_stopped');
  const audioCompletes = prodEvents.filter(e => e.event_type === 'audio_completed');

  // Track max listening seconds per session
  const sessionListening = {};
  prodEvents.forEach(e => {
    const m = e.metadata || {};
    const sec = m.total_seconds_listened;
    const sess = m.playback_session_id || m.night_session_id || e.session_id;
    if (sess && typeof sec === 'number') {
      if (!sessionListening[sess] || sec > sessionListening[sess].sec) {
        sessionListening[sess] = {
          sec,
          intro_sec: m.intro_seconds || 0,
          voice_sec: m.voice_seconds || 0,
          pacer_sec: m.pacer_seconds || 0,
          bg_sec: m.background_seconds || 0,
          coverage_pct: m.voice_coverage_pct || 0,
          time: toVN(e.created_at)
        };
      }
    }
  });

  // 3. APP DOWNLOAD / ONBOARDING
  const appDownloads = prodEvents.filter(e => e.event_type === 'onboarding_app_download_click' || (e.path && e.path.includes('/app')));

  console.log(JSON.stringify({
    total_events: events.length,
    prod_events: prodEvents.length,
    test_events: testEvents.length,
    quiz: {
      starts: quizStarts.length,
      completes: quizCompletes.length,
      completion_rate: `${((quizCompletes.length / (quizStarts.length || 1)) * 100).toFixed(1)}%`,
      result_views: resultViews.length,
      journey_map_views: journeyMapViews.length,
      waterfall: qStats,
      complete_details: completeDetails
    },
    night_1: {
      page_views: nightPageViews.length,
      card_clicks: night1CardClicks.length,
      audio_starts: night1Starts.length,
      audio_stops: audioStops.length,
      audio_completes: audioCompletes.length,
      listening_sessions: sessionListening
    },
    app_download: {
      total_clicks: appDownloads.length
    }
  }, null, 2));
}

main().catch(console.error);
