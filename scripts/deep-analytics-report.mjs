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
    if (!res.ok) {
      console.error(`Failed to fetch offset ${offset}:`, res.status);
      break;
    }
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
  console.log('Fetching analytics data...');
  const [events, profiles] = await Promise.all([fetchAllEvents(), fetchProfiles()]);
  console.log(`Fetched ${events.length} events, ${profiles.length} night companion profiles.`);

  // Write to scratch file for deep analysis if needed
  fs.writeFileSync('scripts/events_dump.json', JSON.stringify({ count: events.length }, null, 2));

  // Helper for Vietnam Time (+7)
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

  // Classify events: Production (Real User) vs Internal/Dev/Test
  const isInternal = (e) => {
    const ref = (e.referrer || '').toLowerCase();
    const meta = e.metadata || {};
    const ip = e.ip || '';
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

  console.log(`\n=== OVERVIEW ===`);
  console.log(`Total Events: ${events.length}`);
  console.log(`Production (Real Users): ${prodEvents.length}`);
  console.log(`Internal/Dev/Test: ${testEvents.length}`);

  // Analyze Event Types in Prod
  const eventTypesProd = {};
  prodEvents.forEach(e => {
    eventTypesProd[e.event_type] = (eventTypesProd[e.event_type] || 0) + 1;
  });
  console.log('\n--- Production Event Types Count ---');
  console.log(Object.entries(eventTypesProd).sort((a,b) => b[1] - a[1]));

  // Analyze paths visited
  const pathsProd = {};
  prodEvents.forEach(e => {
    const p = e.path || 'unknown';
    pathsProd[p] = (pathsProd[p] || 0) + 1;
  });
  console.log('\n--- Production Top Paths ---');
  console.log(Object.entries(pathsProd).sort((a,b) => b[1] - a[1]).slice(0, 20));

  // 1. QUIZ FUNNEL ANALYSIS (Production)
  console.log('\n=================== 1. QUIZ ANALYSIS (PRODUCTION) ===================');
  const quizPageViews = prodEvents.filter(e => {
    const p = (e.path || '').toLowerCase();
    return p.includes('/quiz-insomnia') || p.includes('/sleep-quiz') || p.includes('/quizinsomnia');
  });

  const quizStarts = prodEvents.filter(e => e.event_type === 'quiz_started' || e.event_type === 'quiz_start');
  const quizAnswers = prodEvents.filter(e => e.event_type === 'quiz_answered' || e.event_type === 'quiz_step_completed');
  const quizCompletes = prodEvents.filter(e => e.event_type === 'quiz_completed' || e.event_type === 'quiz_complete');
  const quizResultViews = prodEvents.filter(e => {
    const p = (e.path || '').toLowerCase();
    return e.event_type === 'quiz_result_view' || p.includes('/quiz-insomnia/result') || (e.event_type === 'page_view' && p.includes('result'));
  });

  console.log(`Quiz Page Views: ${quizPageViews.length}`);
  console.log(`Quiz Starts: ${quizStarts.length}`);
  console.log(`Quiz Total Step Answers: ${quizAnswers.length}`);
  console.log(`Quiz Completes: ${quizCompletes.length}`);
  console.log(`Quiz Result Views: ${quizResultViews.length}`);

  const completionRate = quizStarts.length ? ((quizCompletes.length / quizStarts.length) * 100).toFixed(1) : 0;
  console.log(`Quiz Completion Rate: ${completionRate}% (${quizCompletes.length}/${quizStarts.length})`);

  // Waterfall drop-off by question
  const questionViews = {};
  const questionAnswers = {};
  prodEvents.forEach(e => {
    const meta = e.metadata || {};
    const qId = meta.question_id || meta.step_id || meta.step;
    if (e.event_type === 'quiz_step_view' && qId) {
      questionViews[qId] = (questionViews[qId] || 0) + 1;
    }
    if ((e.event_type === 'quiz_answered' || e.event_type === 'quiz_step_completed') && qId) {
      questionAnswers[qId] = (questionAnswers[qId] || 0) + 1;
    }
  });
  console.log('\n--- Question Answers Distribution ---');
  console.log(questionAnswers);

  // Completed Quizzes Insights
  console.log('\n--- Completed Quizzes Details (Prod) ---');
  const patternsCount = {};
  const goalsCount = {};
  const scores = [];
  quizCompletes.forEach((c, i) => {
    const m = c.metadata || {};
    const pat = m.night_pattern || m.primary_pattern || 'unknown';
    const goal = m.primary_goal || 'unknown';
    patternsCount[pat] = (patternsCount[pat] || 0) + 1;
    goalsCount[goal] = (goalsCount[goal] || 0) + 1;
    if (typeof m.isi_score === 'number') scores.push(m.isi_score);
    console.log(`  [Complete #${i+1}] Date: ${toVN(c.created_at)} | Session: ${c.session_id?.slice(0,8)} | Pattern: ${pat} | Goal: ${goal} | ISI: ${m.isi_score}`);
  });
  console.log('Patterns:', patternsCount);
  console.log('Goals:', goalsCount);
  if (scores.length) {
    const avgScore = (scores.reduce((a,b)=>a+b,0)/scores.length).toFixed(1);
    console.log(`Average ISI Score: ${avgScore}`);
  }

  // 2. NIGHT 1 / NIGHT COMPANION ANALYSIS (Production)
  console.log('\n=================== 2. NIGHT 1 ANALYSIS (PRODUCTION) ===================');
  const nightPageViews = prodEvents.filter(e => {
    const p = (e.path || '').toLowerCase();
    return p.includes('/night-companion');
  });
  const nightOneClicks = prodEvents.filter(e => {
    return e.event_type === 'night_1_click' || e.event_type === 'night_one_click' || e.event_type === 'night_1_start_click';
  });
  const audioStarts = prodEvents.filter(e => {
    return e.event_type === 'audio_start' || e.event_type === 'audio_play' || e.event_type === 'night_companion_play' || e.event_type === 'playback_started';
  });
  const audioHeartbeats = prodEvents.filter(e => {
    return e.event_type === 'audio_heartbeat' || e.event_type === 'listening_progress' || e.event_type === 'night_companion_heartbeat';
  });
  const audioCompletes = prodEvents.filter(e => {
    return e.event_type === 'audio_completed' || e.event_type === 'night_companion_complete' || e.event_type === 'night_1_completed';
  });
  const nightLockedClicks = prodEvents.filter(e => {
    return e.event_type === 'night_locked_click' || e.event_type === 'night_locked_modal_view';
  });
  const appDownloadClicks = prodEvents.filter(e => {
    const p = (e.path || '').toLowerCase();
    return e.event_type === 'onboarding_app_download_click' || e.event_type === 'app_download_click' || p.includes('/app') || p.includes('/tai-app');
  });

  console.log(`Night Companion Pageviews: ${nightPageViews.length}`);
  console.log(`Night 1 Clicks: ${nightOneClicks.length}`);
  console.log(`Audio Starts: ${audioStarts.length}`);
  console.log(`Audio Heartbeats / Progress pings: ${audioHeartbeats.length}`);
  console.log(`Audio Completes: ${audioCompletes.length}`);
  console.log(`Night 2+ Locked Clicks: ${nightLockedClicks.length}`);
  console.log(`App Download / Onboarding Clicks: ${appDownloadClicks.length}`);

  // Duration analysis from audio_heartbeat / metadata
  const durations = [];
  prodEvents.forEach(e => {
    const m = e.metadata || {};
    if (m.listened_seconds || m.duration_seconds || m.seconds_listened) {
      durations.push(m.listened_seconds || m.duration_seconds || m.seconds_listened);
    }
  });
  console.log(`Logged Listening Sessions with duration: ${durations.length}`);
  if (durations.length) {
    const under1m = durations.filter(s => s < 60).length;
    const from1to3m = durations.filter(s => s >= 60 && s < 180).length;
    const from3to5m = durations.filter(s => s >= 180 && s < 300).length;
    const from5to10m = durations.filter(s => s >= 300 && s < 600).length;
    const over10m = durations.filter(s => s >= 600).length;
    console.log(`  < 1 min: ${under1m}`);
    console.log(`  1 - 3 min: ${from1to3m}`);
    console.log(`  3 - 5 min: ${from3to5m}`);
    console.log(`  5 - 10 min: ${from5to10m}`);
    console.log(`  > 10 min: ${over10m}`);
  }

  // Daily Trend Breakdown
  console.log('\n=================== 3. DAILY TIMELINE (PRODUCTION) ===================');
  const dailyStats = {};
  prodEvents.forEach(e => {
    const d = getVNDate(e.created_at);
    if (!dailyStats[d]) {
      dailyStats[d] = {
        total: 0,
        quiz_views: 0,
        quiz_starts: 0,
        quiz_completes: 0,
        night_views: 0,
        night_starts: 0,
        app_clicks: 0
      };
    }
    const stat = dailyStats[d];
    stat.total++;
    const p = (e.path || '').toLowerCase();
    if (p.includes('quiz')) stat.quiz_views++;
    if (e.event_type.includes('quiz_start')) stat.quiz_starts++;
    if (e.event_type.includes('quiz_complete')) stat.quiz_completes++;
    if (p.includes('night-companion')) stat.night_views++;
    if (e.event_type.includes('audio_start') || e.event_type.includes('night_1')) stat.night_starts++;
    if (e.event_type.includes('app_download') || p.includes('/app')) stat.app_clicks++;
  });

  console.table(dailyStats);

  // Profiles analysis
  console.log('\n=================== 4. PROFILES TABLE ANALYSIS ===================');
  console.log(`Total Profiles Created: ${profiles.length}`);
  profiles.forEach((p, idx) => {
    const prof = p.profile || {};
    const tone = prof.tonight_state || {};
    const n1 = prof.night_one_plan || {};
    console.log(`  Profile #${idx+1}: Created: ${toVN(p.created_at)} | Stage: ${prof.resume_stage || 'none'} | ModuleFeedback: ${prof.module_feedback?.length || 0}`);
  });
}

main().catch(console.error);
