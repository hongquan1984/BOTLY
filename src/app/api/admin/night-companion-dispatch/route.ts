import { NextResponse } from 'next/server';
import { processDueReminders } from '@/lib/night-companion-scheduler';

export const runtime = 'nodejs';

export async function POST(request: Request) {
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
