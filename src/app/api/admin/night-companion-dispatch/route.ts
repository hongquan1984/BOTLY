import { NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/admin-auth';
import { processDueReminders } from '@/lib/night-companion-scheduler';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  if (!process.env.EBOOK_ADMIN_TOKEN) {
    return NextResponse.json({ ok: false, error: 'Admin dispatch is not configured.' }, { status: 503 });
  }
  if (!isAdminRequest(request)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({})) as {
      fake_clock_now?: string;
    };

    const fakeClockNow = body.fake_clock_now ? new Date(body.fake_clock_now) : undefined;

    const result = await processDueReminders({
      fakeClockNow,
    });

    return NextResponse.json({
      ok: true,
      data: result,
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'DISPATCH_FAILED',
    }, { status: 500 });
  }
}
