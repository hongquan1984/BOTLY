import { NextResponse } from 'next/server';
import { supabaseRequest } from '@/lib/supabase-server';
import {
  calculateReminderTime,
  checkEmailProviderConfig,
  generate7DaySchedules,
} from '@/lib/night-companion-timezone';
import { sendVerificationEmail } from '@/lib/email-service';

export const runtime = 'nodejs';

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null) as {
      email?: unknown;
      clicked_night?: unknown;
      waitlist_night2_consent?: unknown;
      night1_reminder_consent?: unknown;
      bedtime?: unknown;
      timezone?: unknown;
      profile_id?: unknown;
      visitor_id?: unknown;
      session_id?: unknown;
      source?: unknown;
    } | null;

    if (!body || typeof body !== 'object') {
      return NextResponse.json({ ok: false, error: 'INVALID_PAYLOAD' }, { status: 400 });
    }

    const rawEmail = typeof body.email === 'string' ? body.email.trim() : '';
    if (!rawEmail || rawEmail.length > 254 || !EMAIL_REGEX.test(rawEmail)) {
      return NextResponse.json({ ok: false, error: 'INVALID_EMAIL' }, { status: 400 });
    }

    const rawTimezone = typeof body.timezone === 'string' ? body.timezone.trim() : '';
    if (!rawTimezone) {
      return NextResponse.json({
        ok: false,
        error: 'TIMEZONE_REQUIRED',
        message: 'Múi giờ chưa được chọn. Vui lòng chọn múi giờ của bạn.',
      }, { status: 400 });
    }

    // Verify valid timezone string
    try {
      new Intl.DateTimeFormat('en-US', { timeZone: rawTimezone });
    } catch {
      return NextResponse.json({
        ok: false,
        error: 'INVALID_TIMEZONE',
        message: 'Múi giờ không hợp lệ. Vui lòng chọn lại.',
      }, { status: 400 });
    }

    const rawBedtime = typeof body.bedtime === 'string' && /^\d{1,2}:\d{2}$/.test(body.bedtime)
      ? body.bedtime.trim()
      : '23:00';

    const { reminder_time } = calculateReminderTime(rawBedtime);
    const normalizedEmail = rawEmail.toLowerCase();
    const clickedNight = typeof body.clicked_night === 'number' && Number.isInteger(body.clicked_night) && body.clicked_night >= 2 && body.clicked_night <= 7
      ? body.clicked_night
      : 2;

    const waitlistNight2Consent = body.waitlist_night2_consent !== false; // default true
    const night1ReminderConsent = body.night1_reminder_consent === true; // default false, explicit opt-in only

    const profileId = typeof body.profile_id === 'string' ? body.profile_id.slice(0, 100) : null;
    const visitorId = typeof body.visitor_id === 'string' ? body.visitor_id.slice(0, 100) : null;
    const sessionId = typeof body.session_id === 'string' ? body.session_id.slice(0, 100) : null;
    const source = typeof body.source === 'string' ? body.source.slice(0, 50) : 'journey_map';

    // Check email provider infrastructure
    const providerConfig = checkEmailProviderConfig();
    const nowIso = new Date().toISOString();
    const today = new Date();
    const todayStr = `${today.getUTCFullYear()}-${String(today.getUTCMonth() + 1).padStart(2, '0')}-${String(today.getUTCDate()).padStart(2, '0')}`;
    const endDateObj = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const endDateStr = `${endDateObj.getUTCFullYear()}-${String(endDateObj.getUTCMonth() + 1).padStart(2, '0')}-${String(endDateObj.getUTCDate()).padStart(2, '0')}`;

    // Status: if reminder consented:
    // If provider is configured: 'pending_verification'
    // If provider not configured yet: 'pending_provider_setup'
    let reminderStatus = 'none';
    if (night1ReminderConsent) {
      reminderStatus = providerConfig.configured ? 'pending_verification' : 'pending_provider_setup';
    }

    const manageToken = `rem_mng_${crypto.randomUUID().replace(/-/g, '')}`;
    const verificationToken = `ver_${crypto.randomUUID().replace(/-/g, '')}`;

    // Check if email already exists
    const existingRes = await supabaseRequest(
      `night_companion_waitlist?normalized_email=eq.${encodeURIComponent(normalizedEmail)}&select=*&limit=1`,
      {},
      true
    );

    let waitlistId: string | null = null;
    let isAlreadyRegistered = false;

    if (existingRes.ok) {
      const rows = await existingRes.json() as Array<{
        id: string;
        manage_token?: string;
        night1_reminder_consent?: boolean;
        reminder_status?: string;
      }>;
      if (rows && rows.length > 0) {
        waitlistId = rows[0].id;
        isAlreadyRegistered = true;
      }
    }

    if (isAlreadyRegistered && waitlistId) {
      // Update existing record
      const updatePayload: Record<string, unknown> = {
        updated_at: nowIso,
        timezone: rawTimezone,
        bedtime: rawBedtime,
        reminder_time,
      };

      if (waitlistNight2Consent) {
        updatePayload.waitlist_night2_consent = true;
      }

      if (night1ReminderConsent) {
        updatePayload.night1_reminder_consent = true;
        updatePayload.reminder_consented_at = nowIso;
        updatePayload.reminder_status = reminderStatus;
        updatePayload.reminder_start_date = todayStr;
        updatePayload.reminder_end_date = endDateStr;
        updatePayload.manage_token = manageToken;
        updatePayload.verification_token = verificationToken;

        // Cancel previous pending reminders for this user
        await supabaseRequest(
          `night_companion_reminders?waitlist_id=eq.${waitlistId}&status=eq.pending`,
          {
            method: 'PATCH',
            body: JSON.stringify({
              status: 'cancelled',
              skip_reason: 'schedule_rescheduled',
              updated_at: nowIso,
            }),
          },
          true
        ).catch(() => {});

        // Generate new 7-day schedules
        const schedules = generate7DaySchedules({
          waitlistId,
          bedtime: rawBedtime,
          timezone: rawTimezone,
        });

        const insertJobs = schedules.map(s => ({
          waitlist_id: waitlistId,
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

        if (providerConfig.configured) {
          updatePayload.verification_sent_at = nowIso;
          await sendVerificationEmail({
            to: rawEmail,
            verificationToken,
            bedtime: rawBedtime,
            timezone: rawTimezone,
          }).catch(err => console.error('Verification email error:', err));
        }
      }

      await supabaseRequest(
        `night_companion_waitlist?id=eq.${waitlistId}`,
        {
          method: 'PATCH',
          body: JSON.stringify(updatePayload),
        },
        true
      );

      return NextResponse.json({
        ok: true,
        already_registered: true,
        waitlist_id: waitlistId,
        waitlist_night2_consent: true,
        night1_reminder_consent: night1ReminderConsent,
        reminder_status: reminderStatus,
        reminder_time,
        timezone: rawTimezone,
        provider_configured: providerConfig.configured,
        missing_config: providerConfig.missing_keys,
        manage_token: manageToken,
        message: "You're on the waiting list.",
      });
    }

    // Insert new waitlist row
    const insertPayload = {
      email: rawEmail,
      normalized_email: normalizedEmail,
      source,
      clicked_night: clickedNight,
      profile_id: profileId,
      visitor_id: visitorId,
      session_id: sessionId,
      consent_copy_version: 'v2',
      waitlist_night2_consent: waitlistNight2Consent,
      waitlist_consented_at: nowIso,
      night1_reminder_consent: night1ReminderConsent,
      reminder_consented_at: night1ReminderConsent ? nowIso : null,
      timezone: rawTimezone,
      bedtime: rawBedtime,
      reminder_time,
      email_verified: false,
      reminder_status: reminderStatus,
      reminder_start_date: night1ReminderConsent ? todayStr : null,
      reminder_end_date: night1ReminderConsent ? endDateStr : null,
      manage_token: manageToken,
      verification_token: verificationToken,
    };

    const insertRes = await supabaseRequest(
      'night_companion_waitlist',
      {
        method: 'POST',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify(insertPayload),
      },
      true
    );

    if (!insertRes.ok) {
      if (insertRes.status === 409) {
        return NextResponse.json({
          ok: true,
          already_registered: true,
          message: "You're on the waiting list.",
        });
      }
      return NextResponse.json({ ok: false, error: 'WAITLIST_STORAGE_FAILED' }, { status: 502 });
    }

    const insertedRows = await insertRes.json().catch(() => []) as Array<{ id: string }>;
    const newId = insertedRows[0]?.id || 'saved';

    // Insert 7-day reminder schedule if opted in
    if (night1ReminderConsent && newId !== 'saved') {
      const schedules = generate7DaySchedules({
        waitlistId: newId,
        bedtime: rawBedtime,
        timezone: rawTimezone,
      });

      const insertJobs = schedules.map(s => ({
        waitlist_id: newId,
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

      if (providerConfig.configured) {
        await sendVerificationEmail({
          to: rawEmail,
          verificationToken,
          bedtime: rawBedtime,
          timezone: rawTimezone,
        }).catch(err => console.error('Verification email error:', err));

        await supabaseRequest(
          `night_companion_waitlist?id=eq.${newId}`,
          {
            method: 'PATCH',
            body: JSON.stringify({
              verification_sent_at: nowIso,
            }),
          },
          true
        ).catch(() => {});
      }
    }

    return NextResponse.json({
      ok: true,
      waitlist_id: newId,
      waitlist_night2_consent: waitlistNight2Consent,
      night1_reminder_consent: night1ReminderConsent,
      reminder_status: reminderStatus,
      reminder_time,
      timezone: rawTimezone,
      provider_configured: providerConfig.configured,
      missing_config: providerConfig.missing_keys,
      manage_token: manageToken,
      message: "You're on the waiting list.",
    });

  } catch (error) {
    if (error instanceof Error && error.message === 'SUPABASE_NOT_CONFIGURED') {
      return NextResponse.json({ ok: false, error: 'SERVICE_UNAVAILABLE' }, { status: 503 });
    }
    return NextResponse.json({ ok: false, error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
