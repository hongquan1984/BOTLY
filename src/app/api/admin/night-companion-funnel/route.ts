import { NextResponse } from 'next/server';
import { processNightCompanionFunnel } from '@/lib/night-companion-funnel';
import { isAdminRequest } from '@/lib/admin-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  if (!process.env.EBOOK_ADMIN_TOKEN) return NextResponse.json({ ok: false, error: 'Admin analytics is not configured' }, { status: 503 });
  if (!isAdminRequest(request)) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  try {
    const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL)?.replace(/\/$/, '');
    const serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
      return NextResponse.json({ ok: false, error: 'Database credentials not configured' }, { status: 503 });
    }

    const funnelData = await processNightCompanionFunnel(url, serviceKey);

    return NextResponse.json(
      { ok: true, data: funnelData },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  } catch (error) {
    console.error('Night Companion Funnel API error:', error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
