const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) throw new Error("SUPABASE_URL and server secret are required");

async function main() {
  const url = `${SUPABASE_URL}/rest/v1/analytics_events?created_at=gte.2026-10-07T17:00:00Z&created_at=lt.2026-10-08T17:00:00Z&event_type=eq.night_1_card_clicked&order=created_at.asc`;
  const res = await fetch(url, {
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`
    }
  });
  const events = await res.json();

  const toVN = (isoStr) => {
    if (!isoStr) return '';
    const d = new Date(new Date(isoStr).getTime() + 7 * 3600 * 1000);
    return d.toISOString().replace('T', ' ').replace('Z', '').slice(0, 19);
  };

  console.log(`Found ${events.length} clicks on yesterday (08/10):`);
  events.forEach((e, idx) => {
    console.log(`[#${idx + 1}] Time: ${toVN(e.created_at)} | Visitor: ${e.visitor_id} | Path: ${e.path} | Ref: ${e.referrer} | ProfileId: ${e.metadata?.night_profile_id}`);
  });
}

main().catch(console.error);
