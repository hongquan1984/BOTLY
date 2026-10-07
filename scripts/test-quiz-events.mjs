const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL)?.replace(/\/$/, '');
const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

async function testPeriods() {
  const res = await fetch(`${url}/rest/v1/analytics_events?or=(path.like.*quiz*,metadata->>funnel.eq.quiz_insomnia,metadata->>funnel.eq.night_pattern,event_type.like.*quiz*,event_type.in.(night_1_card_clicked,onboarding_app_download_click,waitlist_signup,beta_cta_click,start_plan_click,store_redirect,recommendation_click))&order=created_at.desc&limit=2500`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` }
  });
  const events = await res.json();

  const now = Date.now();
  const nowVN = new Date(now + 7 * 3600 * 1000);
  const todayStr = nowVN.toISOString().slice(0, 10);

  const isToday = (dateStr) => {
    if (!dateStr) return false;
    const d = new Date(new Date(dateStr).getTime() + 7 * 3600 * 1000);
    return d.toISOString().slice(0, 10) === todayStr;
  };

  const periods = {
    today: (e) => isToday(e.created_at),
    week: (e) => now - new Date(e.created_at).getTime() <= 7 * 86400 * 1000,
    month: (e) => now - new Date(e.created_at).getTime() <= 30 * 86400 * 1000,
    all: () => true
  };

  Object.entries(periods).forEach(([pName, filterFn]) => {
    const pEvents = events.filter(filterFn);
    const completions = pEvents.filter(e => e.event_type === 'quiz_completed' || e.event_type === 'quiz_complete');
    const compUsers = new Set(completions.map(e => e.metadata?.quiz_attempt_id || e.visitor_id || e.session_id || ''));
    const compCount = Math.max(completions.length, compUsers.size);

    const night1 = pEvents.filter(e => e.event_type === 'night_1_card_clicked' || e.event_type === 'beta_cta_click');
    const night1Users = new Set(night1.map(e => e.metadata?.quiz_attempt_id || e.visitor_id || e.session_id || '')).size;

    const apps = pEvents.filter(e => e.event_type === 'onboarding_app_download_click' || e.event_type === 'start_plan_click' || e.event_type === 'store_redirect');
    const appUsers = new Set(apps.map(e => e.metadata?.quiz_attempt_id || e.visitor_id || e.session_id || '')).size;

    const waitlist = pEvents.filter(e => e.event_type === 'waitlist_signup' || e.event_type === 'lead_submit');
    const waitlistUsers = new Set(waitlist.map(e => e.metadata?.quiz_attempt_id || e.visitor_id || e.session_id || '')).size;

    console.log(`--- PERIOD: ${pName.toUpperCase()} ---`);
    console.log(`Events: ${pEvents.length}`);
    console.log(`Completions: ${compCount}`);
    console.log(`Night 1 clicks: ${night1.length} (unique: ${night1Users}, CVR: ${compCount > 0 ? Math.min(100, Math.round((night1Users / compCount) * 100)) : 0}%)`);
    console.log(`App clicks: ${apps.length} (unique: ${appUsers}, CVR: ${compCount > 0 ? Math.min(100, Math.round((appUsers / compCount) * 100)) : 0}%)`);
    console.log(`Waitlist: ${waitlist.length} (unique: ${waitlistUsers}, CVR: ${compCount > 0 ? Math.min(100, Math.round((waitlistUsers / compCount) * 100)) : 0}%)`);
  });
}

testPeriods().catch(console.error);
