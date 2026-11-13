const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) throw new Error("SUPABASE_URL and server secret are required");

async function fetchAllRecentEvents() {
  const url = `${SUPABASE_URL}/rest/v1/analytics_events?created_at=gte.2026-10-07T17:00:00Z&order=created_at.asc&limit=5000`;
  const res = await fetch(url, {
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`
    }
  });
  return await res.json();
}

async function fetchNightProfiles() {
  const url = `${SUPABASE_URL}/rest/v1/night_companion_profiles?created_at=gte.2026-10-07T17:00:00Z&order=created_at.desc&limit=100`;
  const res = await fetch(url, {
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`
    }
  }).catch(() => null);
  if (!res || !res.ok) return [];
  return await res.json();
}

async function fetchWaitlist() {
  const url = `${SUPABASE_URL}/rest/v1/night_waitlist?created_at=gte.2026-10-07T17:00:00Z&order=created_at.desc&limit=100`;
  const res = await fetch(url, {
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`
    }
  }).catch(() => null);
  if (!res || !res.ok) return [];
  return await res.json();
}

async function fetchSubscribers() {
  const url = `${SUPABASE_URL}/rest/v1/newsletter_subscribers?created_at=gte.2026-10-07T17:00:00Z&order=created_at.desc&limit=100`;
  const res = await fetch(url, {
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`
    }
  }).catch(() => null);
  if (!res || !res.ok) return [];
  return await res.json();
}

async function main() {
  const [events, profiles, waitlist, subs] = await Promise.all([
    fetchAllRecentEvents(),
    fetchNightProfiles(),
    fetchWaitlist(),
    fetchSubscribers()
  ]);

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

  console.log(`Events count: ${events.length}`);
  console.log(`Profiles count: ${profiles.length}`);
  console.log(`Waitlist count: ${waitlist.length}`);
  console.log(`Subscribers count: ${subs.length}`);

  // Group events by session_id or visitor_id
  const sessions = {};
  events.forEach(e => {
    const sid = e.session_id || e.visitor_id || 'unknown';
    if (!sessions[sid]) {
      sessions[sid] = {
        sessionId: sid,
        visitorId: e.visitor_id,
        firstSeen: e.created_at,
        lastSeen: e.created_at,
        referrer: e.referrer,
        path: e.path,
        device: e.device_type,
        events: []
      };
    }
    sessions[sid].lastSeen = e.created_at;
    sessions[sid].events.push(e);
  });

  console.log(`Unique sessions found: ${Object.keys(sessions).length}`);

  // Detailed analysis for each session
  for (const [sid, s] of Object.entries(sessions)) {
    const vnDate = getVNDate(s.firstSeen);
    const eventTypes = s.events.map(e => e.event_type);
    const hasQuizView = eventTypes.includes('quiz_view') || s.events.some(e => (e.path || '').includes('quiz'));
    const hasQuizStart = eventTypes.includes('quiz_started') || eventTypes.includes('quiz_start');
    const hasQuizComplete = eventTypes.includes('quiz_completed') || eventTypes.includes('quiz_complete');

    if (hasQuizView || hasQuizStart || hasQuizComplete) {
      console.log(`\n--------------------------------------------------`);
      console.log(`Session: ${sid} | Date: ${vnDate} | Time: ${toVN(s.firstSeen)} -> ${toVN(s.lastSeen)}`);
      console.log(`Referrer: ${s.referrer || 'Direct / None'} | Device: ${s.device || 'N/A'}`);
      console.log(`Path: ${s.path}`);
      console.log(`Has Quiz View: ${hasQuizView} | Start: ${hasQuizStart} | Complete: ${hasQuizComplete}`);
      console.log(`Total events in session: ${s.events.length}`);

      // If answers submitted
      const answers = s.events.filter(e => e.event_type === 'quiz_answer_submitted' || (e.metadata && e.metadata.question_id));
      if (answers.length > 0) {
        console.log(`Answers given (${answers.length}):`);
        answers.forEach(a => {
          console.log(`   Q: ${a.metadata?.question_id} => Answer: ${a.metadata?.answer_value}`);
        });
      }

      // If completed
      const comp = s.events.find(e => e.event_type === 'quiz_completed' || e.event_type === 'quiz_complete');
      if (comp) {
        console.log(`>>> COMPLETED RESULT:`, JSON.stringify(comp.metadata, null, 2));
      }

      // Check subsequent actions
      const night1 = s.events.filter(e => e.event_type.includes('night_1') || e.event_type.includes('audio_'));
      if (night1.length > 0) {
        console.log(`>>> NIGHT 1 ACTIONS (${night1.length}): ${[...new Set(night1.map(e => e.event_type))].join(', ')}`);
      }

      const app = s.events.filter(e => e.event_type.includes('app_download'));
      if (app.length > 0) {
        console.log(`>>> APP DOWNLOAD CLICKS: ${app.length}`);
      }

      const wl = s.events.filter(e => e.event_type.includes('waitlist'));
      if (wl.length > 0) {
        console.log(`>>> WAITLIST ACTIONS: ${wl.length}`);
      }
    }
  }

  // Also print all waitlist entries
  console.log(`\n=================== WAITLIST ENTRIES ===================`);
  waitlist.forEach(w => {
    console.log(`Email: ${w.email} | Created: ${toVN(w.created_at)} | Target: ${w.target_state} | Source: ${w.source}`);
  });

  // Profiles
  console.log(`\n=================== NIGHT PROFILES ===================`);
  profiles.forEach(p => {
    console.log(`ID: ${p.id} | Created: ${toVN(p.created_at)} | State: ${p.tonight_state?.current_state} | Resume: ${p.resume_stage}`);
  });
}

main().catch(console.error);
