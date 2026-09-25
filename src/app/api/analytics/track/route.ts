import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ ok: false, error: 'Invalid payload' }, { status: 400 });
    }

    const {
      event_type,
      path: reqPath,
      article_slug,
      locale = 'vi',
      referrer = '',
      device_type = 'desktop',
      visitor_id,
      session_id,
      metadata = {}
    } = body as Record<string, unknown>;

    if (!event_type || !reqPath || typeof event_type !== 'string' || typeof reqPath !== 'string') {
      return NextResponse.json({ ok: false, error: 'Missing event_type or path' }, { status: 400 });
    }

    // Ignore admin visits from analytics to prevent skews
    if (reqPath.startsWith('/admin')) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL)?.replace(/\/$/, '');
    const serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
      return NextResponse.json({ ok: false, error: 'Not configured' }, { status: 503 });
    }

    // Server fallback identifier if client storage was blocked or empty
    let finalVisitorId = typeof visitor_id === 'string' && visitor_id.trim() ? visitor_id.trim() : null;
    let finalSessionId = typeof session_id === 'string' && session_id.trim() ? session_id.trim() : null;

    if (!finalVisitorId) {
      const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
      const ua = request.headers.get('user-agent') || '';
      const day = new Date().toISOString().slice(0, 10);
      finalVisitorId = 'srv_' + Buffer.from(`${ip}-${ua}-${day}`).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 24);
    }

    if (!finalSessionId) {
      finalSessionId = 's_' + finalVisitorId;
    }

    // Await database insert so Vercel Serverless function does not terminate early
    const insertRes = await fetch(`${url}/rest/v1/analytics_events`, {
      method: 'POST',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal'
      },
      body: JSON.stringify({
        event_type: String(event_type).slice(0, 50),
        path: String(reqPath).slice(0, 500),
        article_slug: article_slug ? String(article_slug).slice(0, 200) : null,
        locale: locale === 'en' ? 'en' : 'vi',
        referrer: String(referrer).slice(0, 500),
        device_type: String(device_type).slice(0, 50),
        visitor_id: finalVisitorId.slice(0, 100),
        session_id: finalSessionId.slice(0, 100),
        metadata: typeof metadata === 'object' && metadata !== null ? metadata : {},
        created_at: new Date().toISOString()
      })
    });

    if (!insertRes.ok) {
      const errText = await insertRes.text().catch(() => '');
      console.error('Analytics event insert failure:', insertRes.status, errText);
      return NextResponse.json({ ok: false, error: 'Database insert failure' }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Track analytics error:', error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
