import http from 'http';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) throw new Error("SUPABASE_URL and server secret are required");

async function fetchEvents() {
  // Fetch events since 2026-10-07T00:00:00Z
  const url = `${SUPABASE_URL}/rest/v1/analytics_events?created_at=gte.2026-10-07T00:00:00Z&order=created_at.desc&limit=5000`;
  const res = await fetch(url, {
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`
    }
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch events: ${res.status} ${await res.text()}`);
  }
  return await res.json();
}

async function fetchSubscribers() {
  const url = `${SUPABASE_URL}/rest/v1/newsletter_subscribers?created_at=gte.2026-10-07T00:00:00Z&order=created_at.desc&limit=500`;
  const res = await fetch(url, {
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`
    }
  }).catch(() => null);
  if (!res || !res.ok) return [];
  return await res.json();
}

async function fetchNightWaitlist() {
  const url = `${SUPABASE_URL}/rest/v1/night_waitlist?created_at=gte.2026-10-07T00:00:00Z&order=created_at.desc&limit=500`;
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
  const events = await fetchEvents();
  const subs = await fetchSubscribers();
  const waitlist = await fetchNightWaitlist();

  console.log(`Total events fetched: ${events.length}`);

  // Helper to convert to Vietnam Time String (YYYY-MM-DD HH:mm:ss)
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

  // Filter events related to quiz or sleep funnel
  const quizEvents = events.filter(e => {
    const p = (e.path || '').toLowerCase();
    const t = (e.event_type || '').toLowerCase();
    const meta = e.metadata || {};
    const ref = (e.referrer || '').toLowerCase();

    // Check test / dev
    const isTest = ref.includes('localhost') || ref.includes('127.0.0.1') || meta.is_test || meta.is_dev;

    const isQuiz = p.includes('quiz') || t.includes('quiz') || meta.funnel === 'quiz_insomnia' || meta.funnel === 'night_pattern' ||
      t.includes('night_1') || t.includes('app_download') || t.includes('waitlist');

    return isQuiz;
  });

  console.log(`Quiz-related events: ${quizEvents.length}`);

  // Group by VN Date
  const dateGroups = {};
  quizEvents.forEach(e => {
    const vnDate = getVNDate(e.created_at);
    if (!dateGroups[vnDate]) dateGroups[vnDate] = [];
    dateGroups[vnDate].push(e);
  });

  const dates = Object.keys(dateGroups).sort();
  console.log('Available dates (VN time):', dates);

  for (const date of dates) {
    const evts = dateGroups[date];
    const realEvts = evts.filter(e => {
      const ref = (e.referrer || '').toLowerCase();
      const meta = e.metadata || {};
      return !ref.includes('localhost') && !ref.includes('127.0.0.1') && !meta.is_test && !meta.is_dev;
    });
    const testEvts = evts.filter(e => {
      const ref = (e.referrer || '').toLowerCase();
      const meta = e.metadata || {};
      return ref.includes('localhost') || ref.includes('127.0.0.1') || meta.is_test || meta.is_dev;
    });

    console.log(`\n=================== DATE: ${date} (VN Time) ===================`);
    console.log(`Total events: ${evts.length} (Real: ${realEvts.length}, Test/Dev: ${testEvts.length})`);

    // Event type breakdown (Real)
    const typeCount = {};
    realEvts.forEach(e => {
      typeCount[e.event_type] = (typeCount[e.event_type] || 0) + 1;
    });
    console.log('Real Event Types:', typeCount);

    // Event type breakdown (Test/Dev)
    const testTypeCount = {};
    testEvts.forEach(e => {
      testTypeCount[e.event_type] = (testTypeCount[e.event_type] || 0) + 1;
    });
    console.log('Test Event Types:', testTypeCount);

    // Completed quizzes details
    const completed = evts.filter(e => e.event_type === 'quiz_completed' || e.event_type === 'quiz_complete');
    console.log(`Completions count: ${completed.length}`);
    completed.forEach((c, idx) => {
      const meta = c.metadata || {};
      const isTest = (c.referrer || '').includes('localhost') || meta.is_test;
      console.log(`  [#${idx + 1}] Time: ${toVN(c.created_at)} | Test: ${isTest} | Pattern: ${meta.night_pattern || meta.primary_pattern} | Score: ${meta.isi_score} | Goal: ${meta.primary_goal} | Ref: ${c.referrer}`);
    });

    // Started quizzes
    const starts = evts.filter(e => e.event_type === 'quiz_started' || e.event_type === 'quiz_start');
    console.log(`Starts count: ${starts.length}`);
  }
}

main().catch(console.error);
