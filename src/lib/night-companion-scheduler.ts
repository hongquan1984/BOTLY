import { supabaseRequest } from '@/lib/supabase-server';
import {
  checkEmailProviderConfig,
  evaluateReminderEligibility,
  generateReminderEmailContent,
} from './night-companion-timezone';
import { sendEmailWithResend } from './email-service';

export interface ProcessRemindersResult {
  total_evaluated: number;
  sent_count: number;
  skipped_count: number;
  expired_count: number;
  cancelled_count: number;
  pending_provider_count: number;
  details: Array<{
    reminder_id: string;
    waitlist_id: string;
    sleep_date: string;
    status: string;
    reason?: string;
  }>;
}

/**
 * Xử lý các job nhắc nhở đến hạn (Scheduled Reminder Dispatcher).
 * Hỗ trợ fakeClockNow cho môi trường kiểm thử hộp đen (Sandbox/Mock).
 */
export async function processDueReminders(options: {
  fakeClockNow?: Date;
  mockEmailSender?: (to: string, subject: string, html: string) => Promise<boolean>;
  siteUrl?: string;
} = {}): Promise<ProcessRemindersResult> {
  const now = options.fakeClockNow || new Date();
  const nowIso = now.toISOString();
  const siteUrl = options.siteUrl || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  const providerConfig = checkEmailProviderConfig();

  // Query pending reminder jobs where scheduled_for <= now
  const queryRes = await supabaseRequest(
    `night_companion_reminders?status=eq.pending&scheduled_for=lte.${encodeURIComponent(nowIso)}&order=scheduled_for.asc&limit=100`,
    {},
    true
  );

  if (!queryRes.ok) {
    throw new Error(`Failed to query pending reminders: ${queryRes.status}`);
  }

  const jobs = await queryRes.json() as Array<{
    id: string;
    waitlist_id: string;
    sleep_date: string;
    scheduled_for: string;
    idempotency_key: string;
    attempt_count: number;
  }>;

  const result: ProcessRemindersResult = {
    total_evaluated: jobs.length,
    sent_count: 0,
    skipped_count: 0,
    expired_count: 0,
    cancelled_count: 0,
    pending_provider_count: 0,
    details: [],
  };

  for (const job of jobs) {
    const scheduledTime = new Date(job.scheduled_for).getTime();
    const diffMs = now.getTime() - scheduledTime;

    // 1. Chống gửi bù hàng loạt nếu đã trôi qua cửa sổ nhắc (>60 phút)
    if (diffMs > 60 * 60 * 1000) {
      await supabaseRequest(
        `night_companion_reminders?id=eq.${job.id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            status: 'expired',
            skip_reason: 'past_reminder_window_exceeded_60m',
            last_attempt_at: nowIso,
            updated_at: nowIso,
          }),
        },
        true
      );
      result.expired_count++;
      result.details.push({
        reminder_id: job.id,
        waitlist_id: job.waitlist_id,
        sleep_date: job.sleep_date,
        status: 'expired',
        reason: 'past_reminder_window_exceeded_60m',
      });
      continue;
    }

    // 2. Fetch thông tin người nhận
    const userRes = await supabaseRequest(
      `night_companion_waitlist?id=eq.${job.waitlist_id}&select=*&limit=1`,
      {},
      true
    );

    if (!userRes.ok) {
      result.skipped_count++;
      continue;
    }

    const userRows = await userRes.json() as Array<{
      id: string;
      email: string;
      bedtime: string;
      timezone: string;
      manage_token?: string;
      email_verified: boolean;
      night1_reminder_consent: boolean;
      reminder_status: string;
      reminder_end_date?: string | null;
    }>;

    if (!userRows || userRows.length === 0) {
      await supabaseRequest(
        `night_companion_reminders?id=eq.${job.id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            status: 'cancelled',
            skip_reason: 'recipient_not_found',
            last_attempt_at: nowIso,
            updated_at: nowIso,
          }),
        },
        true
      );
      result.cancelled_count++;
      continue;
    }

    const user = userRows[0];

    // 3. Kiểm tra tính hợp lệ (Eligibility evaluation)
    const eligibility = evaluateReminderEligibility({
      email_verified: user.email_verified,
      night1_reminder_consent: user.night1_reminder_consent,
      reminder_status: user.reminder_status,
      reminder_end_date: user.reminder_end_date,
      current_date: now,
    });

    if (!eligibility.eligible) {
      // Nếu chưa xác minh hoặc hết hạn 7 ngày
      const targetStatus = eligibility.reason === 'reminder_consent_not_granted' ? 'cancelled' : 'skipped';
      await supabaseRequest(
        `night_companion_reminders?id=eq.${job.id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            status: targetStatus,
            skip_reason: eligibility.reason,
            last_attempt_at: nowIso,
            updated_at: nowIso,
          }),
        },
        true
      );

      // Nếu hết 7 ngày, cập nhật reminder_status của user thành completed
      if (eligibility.reason === '7_day_limit_exceeded') {
        await supabaseRequest(
          `night_companion_waitlist?id=eq.${user.id}`,
          {
            method: 'PATCH',
            body: JSON.stringify({
              reminder_status: 'completed',
              updated_at: nowIso,
            }),
          },
          true
        );
      }

      result.skipped_count++;
      result.details.push({
        reminder_id: job.id,
        waitlist_id: job.waitlist_id,
        sleep_date: job.sleep_date,
        status: targetStatus,
        reason: eligibility.reason,
      });
      continue;
    }

    // 4. Kiểm tra cấu hình nhà cung cấp email
    if (!providerConfig.configured && !options.mockEmailSender) {
      // Chưa cấu hình provider thật: giữ nguyên trạng thái pending, không báo gửi thành công giả
      await supabaseRequest(
        `night_companion_reminders?id=eq.${job.id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            last_attempt_at: nowIso,
            skip_reason: 'pending_provider_setup',
            updated_at: nowIso,
          }),
        },
        true
      );
      result.pending_provider_count++;
      result.details.push({
        reminder_id: job.id,
        waitlist_id: job.waitlist_id,
        sleep_date: job.sleep_date,
        status: 'pending',
        reason: 'pending_provider_setup',
      });
      continue;
    }

    // 5. Chuẩn bị nội dung email
    const emailContent = generateReminderEmailContent({
      manageToken: user.manage_token || '',
      siteUrl,
      bedtime: user.bedtime,
      timezone: user.timezone,
    });

    // 6. Gửi qua Mock Sender (kiểm thử) hoặc Provider thật (Resend)
    let sendSuccess = true;
    let sendError: string | undefined;

    if (options.mockEmailSender) {
      sendSuccess = await options.mockEmailSender(user.email, emailContent.subject, emailContent.html);
    } else if (providerConfig.provider === 'resend') {
      const sendResult = await sendEmailWithResend({
        to: user.email,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
      });
      sendSuccess = sendResult.ok;
      sendError = sendResult.error;
    }

    if (!sendSuccess) {
      await supabaseRequest(
        `night_companion_reminders?id=eq.${job.id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            status: 'failed',
            skip_reason: sendError || 'delivery_failed',
            last_attempt_at: nowIso,
            attempt_count: job.attempt_count + 1,
            updated_at: nowIso,
          }),
        },
        true
      );
      result.skipped_count++;
      result.details.push({
        reminder_id: job.id,
        waitlist_id: job.waitlist_id,
        sleep_date: job.sleep_date,
        status: 'failed',
        reason: sendError || 'delivery_failed',
      });
      continue;
    }

    // 7. Cập nhật trạng thái sent thành công (Tối đa 1 email cho mỗi sleep_date)
    await supabaseRequest(
      `night_companion_reminders?id=eq.${job.id}`,
      {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'sent',
          delivered_at: nowIso,
          last_attempt_at: nowIso,
          attempt_count: job.attempt_count + 1,
          updated_at: nowIso,
        }),
      },
      true
    );

    result.sent_count++;
    result.details.push({
      reminder_id: job.id,
      waitlist_id: job.waitlist_id,
      sleep_date: job.sleep_date,
      status: 'sent',
    });
  }

  return result;
}
