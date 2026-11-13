const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) throw new Error("SUPABASE_URL and server secret are required");

// Test our updated filtering logic
async function fetchCleanAnalytics() {
  const url = `${SUPABASE_URL}/rest/v1/analytics_events?order=created_at.desc&limit=2500`;
  const res = await fetch(url, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` }
  });
  const rawEvents = await res.json();

  const internalVisitorIds = new Set([
    'v_13a690ff3d534f9eb8d1e392c3bd9e40',
    'v_c1ef96811dc243b5befd4cc5389d3d6c',
  ]);
  const testProfileIds = new Set([
    'test-seed-profile-prod',
    '6ab4030b-ce93-4d4f-9287-e07736ae51a3',
  ]);

  rawEvents.forEach(e => {
    const ref = String(e.referrer || '');
    const path = String(e.path || '');
    const meta = e.metadata || {};
    const pId = String(meta.night_profile_id || '');
    const vid = String(e.visitor_id || '');
    if (
      ref.includes('localhost') || ref.includes('127.0.0.1') ||
      path.startsWith('/admin') || path.startsWith('/thong-ke') || path.startsWith('/thongke') ||
      meta.is_test === true || meta.is_dev === true || meta.exclude_tracking === true ||
      testProfileIds.has(pId) || pId.startsWith('test-') || pId.includes('seed-')
    ) {
      if (vid) internalVisitorIds.add(vid);
      if (pId) testProfileIds.add(pId);
    }
  });

  const events = rawEvents.filter(e => {
    const vid = String(e.visitor_id || '');
    if (vid && internalVisitorIds.has(vid)) return false;
    const ref = String(e.referrer || '');
    const path = String(e.path || '');
    const meta = e.metadata || {};
    const pId = String(meta.night_profile_id || '');
    if (testProfileIds.has(pId) || pId.startsWith('test-') || pId.includes('seed-')) return false;
    if (ref.includes('localhost') || ref.includes('127.0.0.1')) return false;
    if (path.startsWith('/admin') || path.startsWith('/thong-ke') || path.startsWith('/thongke')) return false;
    if (meta.is_test === true || meta.is_dev === true || meta.exclude_tracking === true) return false;
    return true;
  });

  console.log('Internal visitors excluded:', internalVisitorIds.size);
  console.log('Total raw events:', rawEvents.length);
  console.log('Clean production events:', events.length);

  const getVNDate = (s) => new Date(new Date(s).getTime() + 7 * 3600 * 1000).toISOString().slice(0, 10);
  const nowVN = new Date(Date.now() + 7 * 3600 * 1000);
  const todayStr = nowVN.toISOString().slice(0, 10);
  const yesterdayStr = new Date(Date.now() + 7 * 3600 * 1000 - 86400000).toISOString().slice(0, 10);

  const yesterdayEvents = events.filter(e => getVNDate(e.created_at) === yesterdayStr);
  const todayEvents = events.filter(e => getVNDate(e.created_at) === todayStr);

  const summarize = (evts, label) => {
    const quizViews = evts.filter(e => e.event_type === 'quiz_view' || (e.path || '').includes('quiz'));
    const uniqueQuizViewers = new Set(quizViews.map(e => e.visitor_id)).size;
    const starts = evts.filter(e => e.event_type === 'quiz_started' || e.event_type === 'quiz_start');
    const uniqueStarts = new Set(starts.map(e => e.visitor_id)).size;
    const completes = evts.filter(e => e.event_type === 'quiz_completed' || e.event_type === 'quiz_complete');
    const uniqueCompletes = new Set(completes.map(e => e.visitor_id)).size;
    const night1 = evts.filter(e => e.event_type === 'night_1_card_clicked');
    const uniqueNight1 = new Set(night1.map(e => e.visitor_id)).size;
    const app = evts.filter(e => e.event_type === 'onboarding_app_download_click');
    const uniqueApp = new Set(app.map(e => e.visitor_id)).size;

    console.log(`\n================= ${label} =================`);
    console.log(`Total events: ${evts.length}`);
    console.log(`Quiz page views: ${quizViews.length} (Unique visitors: ${uniqueQuizViewers})`);
    console.log(`Quiz starts: ${starts.length} (Unique: ${uniqueStarts})`);
    console.log(`Quiz completes: ${completes.length} (Unique: ${uniqueCompletes})`);
    console.log(`Night 1 clicks: ${night1.length} (Unique users: ${uniqueNight1})`);
    console.log(`App download clicks: ${app.length} (Unique users: ${uniqueApp})`);
  };

  summarize(yesterdayEvents, `HÔM QUA (${yesterdayStr})`);
  summarize(todayEvents, `HÔM NAY (${todayStr})`);
}

fetchCleanAnalytics().catch(console.error);
