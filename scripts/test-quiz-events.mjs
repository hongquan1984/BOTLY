const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL)?.replace(/\/$/, '');
const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

async function testDedup() {
  const res = await fetch(`${url}/rest/v1/analytics_events?or=(path.like.*quiz*,metadata->>funnel.eq.quiz_insomnia,metadata->>funnel.eq.night_pattern,event_type.like.*quiz*,event_type.in.(night_1_card_clicked,onboarding_app_download_click,waitlist_signup,beta_cta_click,start_plan_click,store_redirect,recommendation_click))&order=created_at.desc&limit=2000`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` }
  });
  const events = await res.json();

  const stepEvents = events.filter(e => e.event_type === 'quiz_step' || e.event_type === 'quiz_step_complete');
  const stepUniqueSets = {};
  for (let s = 1; s <= 15; s++) stepUniqueSets[s] = new Set();

  stepEvents.forEach(e => {
    const s = Number(e.metadata?.step);
    if (!isNaN(s) && s >= 1 && s <= 15) {
      const uid = e.metadata?.quiz_attempt_id || e.session_id || e.visitor_id || e.id;
      stepUniqueSets[s].add(uid);
    }
  });

  const uniqueStepCounts = {};
  for (let s = 1; s <= 15; s++) uniqueStepCounts[s] = stepUniqueSets[s].size;
  console.log('Unique users per step:', uniqueStepCounts);

  const completionUsers = new Set();
  events.filter(e => e.event_type === 'quiz_completed' || e.event_type === 'quiz_complete').forEach(e => {
    completionUsers.add(e.metadata?.quiz_attempt_id || e.session_id || e.visitor_id || e.id);
  });
  console.log('Unique completions:', completionUsers.size);
}

testDedup().catch(console.error);
