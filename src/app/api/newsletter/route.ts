import { NextResponse } from "next/server";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const body = await request.json() as { email?: string; locale?: string; website?: string; source?: string };
    if (body.website) return NextResponse.json({ ok: true });
    const email = body.email?.trim().toLowerCase();
    const locale = body.locale === "vi" ? "vi" : "en";
    if (!email || email.length > 254 || !emailPattern.test(email)) return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL)?.replace(/\/$/, "");
    const serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) return NextResponse.json({ error: "Newsletter is not configured" }, { status: 503 });
    const source = (typeof body.source === 'string' && body.source.slice(0, 100)) || "wellness_home";
    const response = await fetch(`${url}/rest/v1/newsletter_subscribers?on_conflict=email,locale`, { method: "POST", headers: { apikey: serviceKey, ...(!serviceKey.startsWith('sb_') ? { Authorization: `Bearer ${serviceKey}` } : {}), "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify({ email, locale, source, consented_at: new Date().toISOString(), status: "active" }) });
    if (!response.ok) return NextResponse.json({ error: "Could not subscribe" }, { status: 502 });
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }
}
