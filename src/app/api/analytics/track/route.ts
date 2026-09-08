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

    // Non-blocking fire-and-forget insert into Supabase
    fetch(`${url}/rest/v1/analytics_events`, {
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
        metadata: typeof metadata === 'object' && metadata !== null ? metadata : {},
        created_at: new Date().toISOString()
      })
    }).catch(err => {
      console.error('Analytics event insert failure:', err);
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Track analytics error:', error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
