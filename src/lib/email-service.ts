/**
 * Email Service cho Mindful Haven Night Companion
 * Tích hợp trực tiếp với Resend API REST qua domain botly.vn đã xác minh.
 */

import { generateReminderEmailContent } from './night-companion-timezone';

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

export interface SendEmailResult {
  ok: boolean;
  id?: string;
  error?: string;
  simulated?: boolean;
}

/**
 * Gửi email qua Resend REST API
 */
export async function sendEmailWithResend(options: SendEmailOptions): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    return {
      ok: false,
      error: 'RESEND_API_KEY_NOT_CONFIGURED',
    };
  }

  // Chế độ an toàn kiểm thử: nếu chưa kích hoạt ENABLE_REAL_EMAIL_DISPATCH=true
  // thì giả lập gửi thành công và ghi log cấu trúc để tuân thủ quy tắc "không gửi email thật ngoài ý muốn"
  const enableRealDispatch = process.env.ENABLE_REAL_EMAIL_DISPATCH === 'true';
  const fromAddress = options.from || process.env.EMAIL_FROM || 'Mindful Haven <night@botly.vn>';
  const recipients = Array.isArray(options.to) ? options.to : [options.to];

  if (!enableRealDispatch) {
    console.info(`[EmailService] (SIMULATED SEND via Resend configured) To: ${recipients.join(', ')} | Subject: "${options.subject}" | From: ${fromAddress}`);
    return {
      ok: true,
      id: `sim_resend_${Date.now()}`,
      simulated: true,
    };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromAddress,
        to: recipients,
        subject: options.subject,
        html: options.html,
        text: options.text,
      }),
    });

    const data = await res.json().catch(() => ({})) as { id?: string; message?: string; name?: string };

    if (!res.ok) {
      console.error('[EmailService] Resend API error:', res.status, data);
      return {
        ok: false,
        error: data.message || `Resend error HTTP ${res.status}`,
      };
    }

    return {
      ok: true,
      id: data.id,
      simulated: false,
    };
  } catch (err) {
    console.error('[EmailService] Network exception when calling Resend:', err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'UNKNOWN_NETWORK_ERROR',
    };
  }
}

/**
 * Gửi email xác minh đăng ký lời nhắc giờ ngủ (100% English for end-users)
 */
export async function sendVerificationEmail(options: {
  to: string;
  verificationToken: string;
  siteUrl?: string;
  bedtime: string;
  timezone: string;
}): Promise<SendEmailResult> {
  const { to, verificationToken, bedtime } = options;
  const baseUrl = (options.siteUrl || process.env.NEXT_PUBLIC_SITE_URL || 'https://botly.vn').replace(/\/$/, '');
  const verifyUrl = `${baseUrl}/night-companion/verify-email?token=${encodeURIComponent(verificationToken)}`;

  const subject = 'Confirm your bedtime reminder · Mindful Haven';

  const text = `
Mindful Haven Night Companion
Confirm your bedtime reminder

You requested a gentle reminder 30 minutes before your planned bedtime (${bedtime}) for the next 7 nights.
To complete activation, please confirm your email address below:

👉 Confirm your email address:
${verifyUrl}

Important notes:
- Reminders run for a maximum of 7 days and end automatically.
- You can pause or unsubscribe anytime.
- We never send marketing emails or newsletters.
  `.trim();

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #070a13; color: #e2e8f0;">
  <div style="max-width: 520px; margin: 0 auto; background-color: #0d1322; border: 1px solid #1e293b; border-radius: 20px; padding: 32px 24px; box-sizing: border-box;">
    <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; color: #2dd4bf; margin-bottom: 8px;">
      Mindful Haven Night Companion
    </div>
    <h1 style="font-size: 20px; font-weight: 800; color: #ffffff; margin: 0 0 12px 0;">
      Confirm your bedtime reminder
    </h1>
    <p style="font-size: 14px; line-height: 1.6; color: #94a3b8; margin: 0 0 20px 0;">
      You requested a gentle reminder 30 minutes before your planned bedtime (expected at <strong>${bedtime}</strong>) for Night 1 over the next 7 nights.
    </p>
    <p style="font-size: 14px; line-height: 1.6; color: #94a3b8; margin: 0 0 24px 0;">
      Please tap the button below to confirm that this is your email address:
    </p>

    <div style="text-align: center; margin: 28px 0;">
      <a href="${verifyUrl}" style="display: inline-block; background-color: #2dd4bf; color: #022c22; font-size: 14px; font-weight: 700; text-decoration: none; padding: 14px 28px; border-radius: 12px; box-shadow: 0 4px 14px rgba(45, 212, 191, 0.3);">
        Activate 7-Night Reminders
      </a>
    </div>

    <hr style="border: 0; border-top: 1px solid #1e293b; margin: 28px 0;" />

    <p style="font-size: 11px; line-height: 1.5; color: #64748b; margin: 0; text-align: center;">
      If you did not request this reminder, you can safely ignore this email.<br/>
      Bedtime reminders only · Automatically ends after 7 days.
    </p>
  </div>
</body>
</html>
  `.trim();

  return sendEmailWithResend({
    to,
    subject,
    html,
    text,
  });
}

/**
 * Gửi email chào mừng (Welcome Email) đến người dùng Mindful Haven Night Companion (100% English)
 */
export async function sendWelcomeEmail(options: {
  to: string;
  siteUrl?: string;
}): Promise<SendEmailResult> {
  const { to } = options;
  const baseUrl = (options.siteUrl || process.env.NEXT_PUBLIC_SITE_URL || 'https://botly.vn').replace(/\/$/, '');
  const entryUrl = `${baseUrl}/night-companion`;

  const subject = 'Welcome to Mindful Haven · Night Companion';

  const text = `
Mindful Haven Night Companion
Welcome to your evening practice

Night 1: A Gentle Beginning is ready for you whenever you are ready to pause and unwind.
There is no goal to complete, just a quiet space at whatever pace feels right for you:

👉 Open tonight's practice: ${entryUrl}

Wishing you a peaceful and restorative night.
---
Mindful Haven · botly.vn
  `.trim();

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #070a13; color: #e2e8f0;">
  <div style="max-width: 520px; margin: 0 auto; background-color: #0d1322; border: 1px solid #1e293b; border-radius: 20px; padding: 32px 24px; box-sizing: border-box;">
    <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; color: #2dd4bf; margin-bottom: 8px;">
      Mindful Haven Night Companion
    </div>
    <h1 style="font-size: 22px; font-weight: 800; color: #ffffff; margin: 0 0 12px 0;">
      Welcome to your evening practice
    </h1>
    <p style="font-size: 14px; line-height: 1.6; color: #94a3b8; margin: 0 0 16px 0;">
      A gentle evening companion designed to help you transition into rest at your own comfortable pace.
    </p>
    <p style="font-size: 14px; line-height: 1.6; color: #94a3b8; margin: 0 0 24px 0;">
      <strong>Night 1 — A Gentle Beginning</strong> is waiting for you whenever you feel ready. There are no tests to pass and no pressure to fall asleep immediately — simply a calming space guided by gentle, natural pacing.
    </p>

    <div style="text-align: center; margin: 28px 0;">
      <a href="${entryUrl}" style="display: inline-block; background-color: #2dd4bf; color: #022c22; font-size: 14px; font-weight: 700; text-decoration: none; padding: 14px 28px; border-radius: 12px; box-shadow: 0 4px 14px rgba(45, 212, 191, 0.3);">
        Begin Night 1 Practice
      </a>
    </div>

    <hr style="border: 0; border-top: 1px solid #1e293b; margin: 28px 0;" />

    <p style="font-size: 11px; line-height: 1.5; color: #64748b; margin: 0; text-align: center;">
      Mindful Haven does not provide medical advice, diagnosis, or clinical treatment.<br/>
      Natural sleep support · botly.vn
    </p>
  </div>
</body>
</html>
  `.trim();

  return sendEmailWithResend({
    to,
    subject,
    html,
    text,
  });
}
