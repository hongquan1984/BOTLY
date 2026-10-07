import { NextResponse } from 'next/server';
import { supabaseRequest } from '@/lib/supabase-server';
import {
  calculateReminderTime,
  checkEmailProviderConfig,
  generate7DaySchedules,
} from '@/lib/night-companion-timezone';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token || typeof token !== 'string' || token.length < 10) {
      return NextResponse.json({ ok: false, error: 'INVALID_TOKEN' }, { status: 400 });
    }

    const res = await supabaseRequest(
      `night_companion_waitlist?manage_token=eq.${encodeURIComponent(token)}&select=id,bedtime,timezone,reminder_time,reminder_status,email_verified,night1_reminder_consent,waitlist_night2_consent,reminder_start_date,reminder_end_date,created_at&limit=1`,
      {},
      true
    );

    if (!res.ok) {
      return NextResponse.json({ ok: false, error: 'FETCH_FAILED' }, { status: 502 });
    }

    const rows = await res.json() as Array<{
      id: string;
      bedtime: string;
      timezone: string;
      reminder_time: string;
      reminder_status: string;
      email_verified: boolean;
      night1_reminder_consent: boolean;
      waitlist_night2_consent: boolean;
      reminder_start_date: string | null;
      reminder_end_date: string | null;
      created_at: string;
    }>;

    if (!rows || rows.length === 0) {
      return NextResponse.json({ ok: false, error: 'TOKEN_NOT_FOUND' }, { status: 404 });
    }

    const row = rows[0];

    // Compute remaining days
    let daysRemaining = 0;
    if (row.reminder_end_date) {
      const end = new Date(row.reminder_end_date);
      const diffMs = end.getTime() - Date.now();
      daysRemaining = Math.max(0, Math.ceil(diffMs / (24 * 60 * 60 * 1000)));
    }

    return NextResponse.json({
      ok: true,
      data: {
        bedtime: row.bedtime,
        timezone: row.timezone,
        reminder_time: row.reminder_time,
        reminder_status: row.reminder_status,
        email_verified: row.email_verified,
        night1_reminder_consent: row.night1_reminder_consent,
        waitlist_night2_consent: row.waitlist_night2_consent,
        reminder_start_date: row.reminder_start_date,
        reminder_end_date: row.reminder_end_date,
        days_remaining: daysRemaining,
        provider_config: checkEmailProviderConfig(),
      },
    });

  } catch (error) {
    if (error instanceof Error && error.message === 'SUPABASE_NOT_CONFIGURED') {
      return NextResponse.json({ ok: false, error: 'SERVICE_UNAVAILABLE' }, { status: 503 });
    }
    return NextResponse.json({ ok: false, error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null) as {
      token?: unknown;
      action?: unknown;
      bedtime?: unknown;
      timezone?: unknown;
    } | null;

    if (!body || typeof body !== 'object') {
      return NextResponse.json({ ok: false, error: 'INVALID_PAYLOAD' }, { status: 400 });
    }

    const token = typeof body.token === 'string' ? body.token.trim() : '';
    const action = typeof body.action === 'string' ? body.action.trim() : '';

    if (!token || token.length < 10) {
      return NextResponse.json({ ok: false, error: 'INVALID_TOKEN' }, { status: 400 });
    }

    // Lookup waitlist record
    const res = await supabaseRequest(
      `night_companion_waitlist?manage_token=eq.${encodeURIComponent(token)}&select=*&limit=1`,
      {},
      true
    );

    if (!res.ok) {
      return NextResponse.json({ ok: false, error: 'FETCH_FAILED' }, { status: 502 });
    }

    const rows = await res.json() as Array<{
      id: string;
      bedtime: string;
      timezone: string;
      reminder_status: string;
      waitlist_night2_consent: boolean;
    }>;

    if (!rows || rows.length === 0) {
      return NextResponse.json({ ok: false, error: 'TOKEN_NOT_FOUND' }, { status: 404 });
    }

    const row = rows[0];
    const nowIso = new Date().toISOString();
    const providerConfig = checkEmailProviderConfig();

    if (action === 'unsubscribe') {
      // Unsubscribe from bedtime reminders:
      // Sets reminder_status = 'unsubscribed', night1_reminder_consent = false
      // BUT keeps waitlist_night2_consent = true!
      await Promise.all([
        supabaseRequest(
          `night_companion_waitlist?id=eq.${row.id}`,
          {
            method: 'PATCH',
            body: JSON.stringify({
              reminder_status: 'unsubscribed',
              night1_reminder_consent: false,
              updated_at: nowIso,
            }),
          },
          true
        ),
        supabaseRequest(
          `night_companion_reminders?waitlist_id=eq.${row.id}&status=eq.pending`,
          {
            method: 'PATCH',
            body: JSON.stringify({
              status: 'cancelled',
              skip_reason: 'user_unsubscribed',
              updated_at: nowIso,
            }),
          },
          true
        ),
      ]);

      return NextResponse.json({
        ok: true,
        action: 'unsubscribe',
        message: 'Đã hủy nhận lời nhắc giờ ngủ. Bạn vẫn tiếp tục nhận thông báo khi Đêm 2 sẵn sàng.',
        waitlist_night2_consent: row.waitlist_night2_consent,
        reminder_status: 'unsubscribed',
      });
    }

    if (action === 'pause') {
      await Promise.all([
        supabaseRequest(
          `night_companion_waitlist?id=eq.${row.id}`,
          {
            method: 'PATCH',
            body: JSON.stringify({
              reminder_status: 'paused',
              updated_at: nowIso,
            }),
          },
          true
        ),
        supabaseRequest(
          `night_companion_reminders?waitlist_id=eq.${row.id}&status=eq.pending`,
          {
            method: 'PATCH',
            body: JSON.stringify({
              status: 'cancelled',
              skip_reason: 'user_paused',
              updated_at: nowIso,
            }),
          },
          true
        ),
      ]);

      return NextResponse.json({
        ok: true,
        action: 'pause',
        message: 'Đã tạm dừng lời nhắc.',
        reminder_status: 'paused',
      });
    }

    if (action === 'resume') {
      const newStatus = providerConfig.configured ? 'active' : 'pending_provider_setup';
      await supabaseRequest(
        `night_companion_waitlist?id=eq.${row.id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            reminder_status: newStatus,
            night1_reminder_consent: true,
            updated_at: nowIso,
          }),
        },
        true
      );

      // Re-generate fresh 7-day schedules
      const schedules = generate7DaySchedules({
        waitlistId: row.id,
        bedtime: row.bedtime,
        timezone: row.timezone,
      });

      const insertJobs = schedules.map(s => ({
        waitlist_id: row.id,
        sleep_date: s.sleep_date,
        scheduled_for: s.scheduled_utc,
        status: 'pending',
        idempotency_key: s.idempotency_key,
      }));

      await supabaseRequest(
        'night_companion_reminders',
        {
          method: 'POST',
          body: JSON.stringify(insertJobs),
        },
        true
      ).catch(() => {});

      return NextResponse.json({
        ok: true,
        action: 'resume',
        message: 'Đã kích hoạt lại lời nhắc.',
        reminder_status: newStatus,
      });
    }

    if (action === 'update_schedule') {
      const newBedtime = typeof body.bedtime === 'string' && /^\d{1,2}:\d{2}$/.test(body.bedtime)
        ? body.bedtime.trim()
        : row.bedtime;
      const newTimezone = typeof body.timezone === 'string' && body.timezone.trim()
        ? body.timezone.trim()
        : row.timezone;

      try {
        new Intl.DateTimeFormat('en-US', { timeZone: newTimezone });
      } catch {
        return NextResponse.json({ ok: false, error: 'INVALID_TIMEZONE' }, { status: 400 });
      }

      const { reminder_time } = calculateReminderTime(newBedtime);

      // Update waitlist record
      await supabaseRequest(
        `night_companion_waitlist?id=eq.${row.id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            bedtime: newBedtime,
            timezone: newTimezone,
            reminder_time,
            updated_at: nowIso,
          }),
        },
        true
      );

      // Cancel old pending reminders
      await supabaseRequest(
        `night_companion_reminders?waitlist_id=eq.${row.id}&status=eq.pending`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            status: 'cancelled',
            skip_reason: 'schedule_updated',
            updated_at: nowIso,
          }),
        },
        true
      ).catch(() => {});

      // Generate new schedules
      const schedules = generate7DaySchedules({
        waitlistId: row.id,
        bedtime: newBedtime,
        timezone: newTimezone,
      });

      const insertJobs = schedules.map(s => ({
        waitlist_id: row.id,
        sleep_date: s.sleep_date,
        scheduled_for: s.scheduled_utc,
        status: 'pending',
        idempotency_key: s.idempotency_key,
      }));

      await supabaseRequest(
        'night_companion_reminders',
        {
          method: 'POST',
          body: JSON.stringify(insertJobs),
        },
        true
      ).catch(() => {});

      return NextResponse.json({
        ok: true,
        action: 'update_schedule',
        message: 'Đã cập nhật giờ ngủ và múi giờ thành công.',
        bedtime: newBedtime,
        timezone: newTimezone,
        reminder_time,
      });
    }

    return NextResponse.json({ ok: false, error: 'INVALID_ACTION' }, { status: 400 });

  } catch (error) {
    if (error instanceof Error && error.message === 'SUPABASE_NOT_CONFIGURED') {
      return NextResponse.json({ ok: false, error: 'SERVICE_UNAVAILABLE' }, { status: 503 });
    }
    return NextResponse.json({ ok: false, error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
