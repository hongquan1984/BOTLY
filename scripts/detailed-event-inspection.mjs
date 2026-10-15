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
      meta.is_test === true ||
      meta.is_dev === true ||
      ua.includes('headlesschrome')
    );
  };

  const prodEvents = events.filter(e => !isInternal(e));
  const testEvents = events.filter(e => isInternal(e));

  console.log(`TOTAL EVENTS: ${events.length}`);
  console.log(`PROD EVENTS: ${prodEvents.length} | TEST/DEV EVENTS: ${testEvents.length}`);

  // Let's inspect Audio Progress events
  const audioProgress = prodEvents.filter(e => e.event_type === 'audio_progress' || e.event_type === 'audio_stopped' || e.event_type === 'audio_started');
  console.log(`\n=== AUDIO EVENTS SAMPLE (PROD: ${audioProgress.length}) ===`);
  audioProgress.slice(0, 15).forEach(e => {
    console.log(`[${e.event_type}] Time: ${toVN(e.created_at)} | Path: ${e.path} | Meta:`, JSON.stringify(e.metadata));
  });

  // Let's inspect Night 1 card clicks and starts
  const night1Clicks = prodEvents.filter(e => e.event_type === 'night_1_card_clicked' || e.event_type === 'night_1_started' || e.event_type === 'audio_started');
  console.log(`\n=== NIGHT 1 CLICKS & STARTS (PROD: ${night1Clicks.length}) ===`);
  night1Clicks.forEach(e => {
    console.log(`[${e.event_type}] Time: ${toVN(e.created_at)} | Session: ${e.session_id?.slice(0,8)} | Meta:`, JSON.stringify(e.metadata));
  });

  // Let's inspect Quiz Question Viewed and Dropoff
  const questionMap = {};
  prodEvents.forEach(e => {
    if (e.event_type === 'quiz_question_viewed' || e.event_type === 'quiz_answer_submitted' || e.event_type === 'micro_insight_view') {
      const q = e.metadata?.question_id || e.metadata?.step || e.metadata?.id || 'unknown';
      if (!questionMap[q]) questionMap[q] = { viewed: 0, answered: 0, insight: 0 };
      if (e.event_type === 'quiz_question_viewed') questionMap[q].viewed++;
      if (e.event_type === 'quiz_answer_submitted') questionMap[q].answered++;
      if (e.event_type === 'micro_insight_view') questionMap[q].insight++;
    }
  });
  console.log('\n=== QUIZ QUESTIONS DETAILED BREAKDOWN ===');
  console.table(questionMap);

  // Let's inspect Quiz Completes
  const completes = prodEvents.filter(e => e.event_type === 'quiz_complete' || e.event_type === 'quiz_completed');
  console.log(`\n=== QUIZ COMPLETES (PROD: ${completes.length}) ===`);
  completes.forEach((c, idx) => {
    console.log(`[#${idx+1}] Time: ${toVN(c.created_at)} | Session: ${c.session_id?.slice(0,8)} | Meta:`, JSON.stringify(c.metadata));
  });

  // Journey Map & Result Views
  const resultViews = prodEvents.filter(e => e.event_type === 'result_view' || e.event_type === 'result_viewed' || e.event_type === 'journey_map_viewed');
  console.log(`\n=== RESULT & JOURNEY MAP VIEWS (PROD: ${resultViews.length}) ===`);
  resultViews.forEach(r => {
    console.log(`[${r.event_type}] Time: ${toVN(r.created_at)} | Session: ${r.session_id?.slice(0,8)} | Path: ${r.path}`);
  });

  // Check App Download / Onboarding Click
  const appDownloads = prodEvents.filter(e => e.event_type === 'onboarding_app_download_click' || (e.path && e.path.includes('/app')));
  console.log(`\n=== APP DOWNLOAD / ONBOARDING (PROD: ${appDownloads.length}) ===`);
  const appDaily = {};
  appDownloads.forEach(e => {
    const d = getVNDate(e.created_at);
    appDaily[d] = (appDaily[d] || 0) + 1;
  });
  console.table(appDaily);
}

main().catch(console.error);
