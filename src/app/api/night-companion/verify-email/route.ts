import { NextResponse } from 'next/server';
import { supabaseRequest } from '@/lib/supabase-server';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token || typeof token !== 'string' || token.length < 8) {
      return NextResponse.json({ ok: false, error: 'INVALID_TOKEN' }, { status: 400 });
    }

    // Lookup waitlist entry by verification_token
    const queryRes = await supabaseRequest(
      `night_companion_waitlist?verification_token=eq.${encodeURIComponent(token)}&select=id,email,bedtime,timezone,reminder_time,manage_token,email_verified,reminder_status&limit=1`,
      {},
      true
    );

    if (!queryRes.ok) {
      return NextResponse.json({ ok: false, error: 'QUERY_FAILED' }, { status: 502 });
    }

    const rows = await queryRes.json() as Array<{
      id: string;
      email: string;
      bedtime: string;
      timezone: string;
      reminder_time: string;
      manage_token: string;
      email_verified: boolean;
      reminder_status: string;
    }>;

    if (!rows || rows.length === 0) {
      return NextResponse.json({ ok: false, error: 'TOKEN_NOT_FOUND', message: 'Mã xác minh không tồn tại hoặc đã hết hạn.' }, { status: 404 });
    }

    const row = rows[0];
    const nowIso = new Date().toISOString();

    // If not yet verified, update to verified & active
    if (!row.email_verified || row.reminder_status !== 'active') {
      await supabaseRequest(
        `night_companion_waitlist?id=eq.${row.id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            email_verified: true,
            verified_at: nowIso,
            reminder_status: 'active',
            updated_at: nowIso,
          }),
        },
        true
      );
    }

    return NextResponse.json({
      ok: true,
      data: {
        id: row.id,
        email_masked: row.email.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
        bedtime: row.bedtime,
        timezone: row.timezone,
        reminder_time: row.reminder_time,
        manage_token: row.manage_token,
        email_verified: true,
        reminder_status: 'active',
      },
    });

  } catch (error) {
    if (error instanceof Error && error.message === 'SUPABASE_NOT_CONFIGURED') {
      return NextResponse.json({ ok: false, error: 'SERVICE_UNAVAILABLE' }, { status: 503 });
    }
    return NextResponse.json({ ok: false, error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
