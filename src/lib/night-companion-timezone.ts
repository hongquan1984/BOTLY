/**
 * Logic Múi giờ, Tính toán Giờ nhắc, và Lập lịch 7 ngày cho Night Companion
 */

export interface TimezoneOption {
  iana: string;
  city: string;
  country: string;
  label_vi: string;
  label_en: string;
  region: string;
}

export const COMMON_TIMEZONES: TimezoneOption[] = [
  { iana: 'Asia/Ho_Chi_Minh', city: 'Hồ Chí Minh / Hà Nội', country: 'Việt Nam', label_vi: 'Việt Nam — TP. Hồ Chí Minh', label_en: 'Vietnam — Ho Chi Minh City', region: 'Asia' },
  { iana: 'Asia/Bangkok', city: 'Bangkok', country: 'Thái Lan', label_vi: 'Thái Lan — Bangkok', label_en: 'Thailand — Bangkok', region: 'Asia' },
  { iana: 'Asia/Singapore', city: 'Singapore', country: 'Singapore', label_vi: 'Singapore', label_en: 'Singapore', region: 'Asia' },
  { iana: 'Asia/Tokyo', city: 'Tokyo', country: 'Nhật Bản', label_vi: 'Nhật Bản — Tokyo', label_en: 'Japan — Tokyo', region: 'Asia' },
  { iana: 'Asia/Seoul', city: 'Seoul', country: 'Hàn Quốc', label_vi: 'Hàn Quốc — Seoul', label_en: 'South Korea — Seoul', region: 'Asia' },
  { iana: 'Asia/Hong_Kong', city: 'Hồng Kông', country: 'Hồng Kông', label_vi: 'Hồng Kông', label_en: 'Hong Kong', region: 'Asia' },
  { iana: 'Asia/Jakarta', city: 'Jakarta', country: 'Indonesia', label_vi: 'Indonesia — Jakarta', label_en: 'Indonesia — Jakarta', region: 'Asia' },
  { iana: 'Europe/London', city: 'London', country: 'Vương quốc Anh', label_vi: 'Vương quốc Anh — London', label_en: 'UK — London', region: 'Europe' },
  { iana: 'Europe/Paris', city: 'Paris', country: 'Pháp', label_vi: 'Pháp — Paris', label_en: 'France — Paris', region: 'Europe' },
  { iana: 'Europe/Berlin', city: 'Berlin', country: 'Đức', label_vi: 'Đức — Berlin', label_en: 'Germany — Berlin', region: 'Europe' },
  { iana: 'America/New_York', city: 'New York', country: 'Hoa Kỳ (Miền Đông)', label_vi: 'Hoa Kỳ — New York (ET)', label_en: 'US — New York (Eastern)', region: 'America' },
  { iana: 'America/Chicago', city: 'Chicago', country: 'Hoa Kỳ (Miền Trung)', label_vi: 'Hoa Kỳ — Chicago (CT)', label_en: 'US — Chicago (Central)', region: 'America' },
  { iana: 'America/Denver', city: 'Denver', country: 'Hoa Kỳ (Miền Núi)', label_vi: 'Hoa Kỳ — Denver (MT)', label_en: 'US — Denver (Mountain)', region: 'America' },
  { iana: 'America/Los_Angeles', city: 'Los Angeles', country: 'Hoa Kỳ (Thái Bình Dương)', label_vi: 'Hoa Kỳ — Los Angeles (PT)', label_en: 'US — Los Angeles (Pacific)', region: 'America' },
  { iana: 'America/Toronto', city: 'Toronto', country: 'Canada', label_vi: 'Canada — Toronto', label_en: 'Canada — Toronto', region: 'America' },
  { iana: 'Australia/Sydney', city: 'Sydney', country: 'Úc', label_vi: 'Úc — Sydney', label_en: 'Australia — Sydney', region: 'Australia' },
  { iana: 'Australia/Melbourne', city: 'Melbourne', country: 'Úc', label_vi: 'Úc — Melbourne', label_en: 'Australia — Melbourne', region: 'Australia' },
  { iana: 'Pacific/Auckland', city: 'Auckland', country: 'New Zealand', label_vi: 'New Zealand — Auckland', label_en: 'New Zealand — Auckland', region: 'Pacific' },
  { iana: 'UTC', city: 'UTC', country: 'Giờ quốc tế', label_vi: 'Giờ quốc tế chuẩn (UTC)', label_en: 'Coordinated Universal Time (UTC)', region: 'Global' },
];

/**
 * Tự động phát hiện IANA timezone từ trình duyệt client.
 * Trả về null nếu không phát hiện được hoặc đang chạy trên server.
 * Tuyệt đối không fallback âm thầm về timezone của server.
 */
export function detectBrowserTimezone(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz && typeof tz === 'string' && tz.trim().length > 0) {
      return tz.trim();
    }
  } catch {
    // Ignore error
  }
  return null;
}

/**
 * Tính offset hiển thị hiện tại cho một IANA timezone (e.g. "GMT+7", "GMT-4")
 */
export function getTimezoneOffsetString(timeZone: string, date = new Date()): string {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      timeZoneName: 'shortOffset'
    }).formatToParts(date);
    const tzPart = parts.find(p => p.type === 'timeZoneName');
    return tzPart ? tzPart.value : '';
  } catch {
    return '';
  }
}

/**
 * Hiển thị tên múi giờ thân thiện dễ hiểu song ngữ
 */
export function formatTimezoneDisplay(timeZone: string): {
  iana: string;
  friendly_name: string;
  friendly_name_vi: string;
  offset: string;
} {
  const match = COMMON_TIMEZONES.find(t => t.iana.toLowerCase() === timeZone.toLowerCase());
  const offset = getTimezoneOffsetString(timeZone);
  const offsetSuffix = offset ? ` (${offset})` : '';

  if (match) {
    return {
      iana: match.iana,
      friendly_name: `${match.label_en}${offsetSuffix}`,
      friendly_name_vi: `${match.label_vi}${offsetSuffix}`,
      offset,
    };
  }

  // Tự động phân tách tên thành phố từ IANA string cho bất kỳ múi giờ nào trên thế giới
  const city = timeZone.split('/')[1]?.replace(/_/g, ' ') || timeZone;
  return {
    iana: timeZone,
    friendly_name: `${city}${offsetSuffix}`,
    friendly_name_vi: `${city}${offsetSuffix}`,
    offset,
  };
}

/**
 * Tìm kiếm múi giờ theo tên thành phố, quốc gia hoặc chuỗi IANA
 */
export function searchTimezones(query: string): TimezoneOption[] {
  const q = query.trim().toLowerCase();
  if (!q) return COMMON_TIMEZONES;

  return COMMON_TIMEZONES.filter(tz =>
    tz.city.toLowerCase().includes(q) ||
    tz.country.toLowerCase().includes(q) ||
    tz.iana.toLowerCase().includes(q) ||
    tz.label_en.toLowerCase().includes(q) ||
    tz.label_vi.toLowerCase().includes(q)
  );
}

/**
 * Tính giờ nhắc (bedtime - 30 phút).
 * Xử lý trường hợp qua nửa đêm (wrap-around):
 * Ví dụ: 00:15 -> 23:45 (thuộc về tối hôm trước).
 */
export function calculateReminderTime(bedtime: string): {
  reminder_time: string;
  is_previous_day: boolean;
} {
  const parts = bedtime.split(':');
  let h = parseInt(parts[0] || '23', 10);
  let m = parseInt(parts[1] || '00', 10);
  if (isNaN(h) || h < 0 || h > 23) h = 23;
  if (isNaN(m) || m < 0 || m > 59) m = 0;

  let totalMinutes = h * 60 + m - 30;
  let isPreviousDay = false;

  if (totalMinutes < 0) {
    totalMinutes += 24 * 60;
    isPreviousDay = true;
  }

  const remH = Math.floor(totalMinutes / 60);
  const remM = totalMinutes % 60;

  return {
    reminder_time: `${String(remH).padStart(2, '0')}:${String(remM).padStart(2, '0')}`,
    is_previous_day: isPreviousDay,
  };
}

/**
 * Chuyển đổi chính xác ngày giờ địa phương trong bất kỳ IANA Timezone nào sang UTC Date.
 * Tự động xử lý chính xác Daylight Saving Time (DST) mà không cần thư viện bên ngoài.
 */
export function localToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string
): Date {
  let guess = new Date(Date.UTC(year, month - 1, day, hour, minute));
  for (let i = 0; i < 3; i++) {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: false,
    });
    const parts = formatter.formatToParts(guess);
    const p: Record<string, string> = {};
    for (const part of parts) p[part.type] = part.value;
    let h = parseInt(p.hour, 10);
    if (h === 24) h = 0;
    const formattedUtcMs = Date.UTC(
      parseInt(p.year, 10),
      parseInt(p.month, 10) - 1,
      parseInt(p.day, 10),
      h,
      parseInt(p.minute, 10),
      parseInt(p.second, 10)
    );
    const targetUtcMs = Date.UTC(year, month - 1, day, hour, minute);
    const diff = targetUtcMs - formattedUtcMs;
    if (diff === 0) break;
    guess = new Date(guess.getTime() + diff);
  }
  return guess;
}

export interface GeneratedReminderSchedule {
  day_index: number;
  sleep_date: string; // YYYY-MM-DD
  reminder_date: string; // YYYY-MM-DD (có thể trước sleep_date 1 ngày nếu bedtime < 00:30)
  reminder_time: string; // HH:mm
  scheduled_utc: string; // ISO 8601 UTC
  idempotency_key: string;
}

/**
 * Sinh danh sách 7 ngày gửi lời nhắc (kết thúc sau đúng 7 ngày).
 * Mỗi ngày có 1 idempotency key duy nhất dựa trên waitlistId và sleep_date.
 */
export function generate7DaySchedules(options: {
  waitlistId: string;
  bedtime: string;
  timezone: string;
  startDate?: Date;
}): GeneratedReminderSchedule[] {
  const { waitlistId, bedtime, timezone } = options;
  const start = options.startDate ? new Date(options.startDate) : new Date();
  const { reminder_time, is_previous_day } = calculateReminderTime(bedtime);
  const [remH, remM] = reminder_time.split(':').map(Number);

  const schedules: GeneratedReminderSchedule[] = [];

  for (let i = 0; i < 7; i++) {
    // Sleep date bắt đầu từ ngày start + i
    const targetSleep = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
    const sleepYear = targetSleep.getUTCFullYear();
    const sleepMonth = targetSleep.getUTCMonth() + 1;
    const sleepDay = targetSleep.getUTCDate();
    const sleepDateStr = `${sleepYear}-${String(sleepMonth).padStart(2, '0')}-${String(sleepDay).padStart(2, '0')}`;

    // Reminder date: nếu is_previous_day thì lùi 1 ngày
    const remDateObj = is_previous_day
      ? new Date(targetSleep.getTime() - 24 * 60 * 60 * 1000)
      : targetSleep;
    const remYear = remDateObj.getUTCFullYear();
    const remMonth = remDateObj.getUTCMonth() + 1;
    const remDay = remDateObj.getUTCDate();
    const remDateStr = `${remYear}-${String(remMonth).padStart(2, '0')}-${String(remDay).padStart(2, '0')}`;

    const scheduledUtc = localToUtc(remYear, remMonth, remDay, remH, remM, timezone);

    schedules.push({
      day_index: i + 1,
      sleep_date: sleepDateStr,
      reminder_date: remDateStr,
      reminder_time,
      scheduled_utc: scheduledUtc.toISOString(),
      idempotency_key: `rem_${waitlistId}_${sleepDateStr}`,
    });
  }

  return schedules;
}

/**
 * Kiểm tra điều kiện gửi email nhắc:
 * - Email phải được xác minh (email_verified = true).
 * - Phải có consent nhận nhắc (night1_reminder_consent = true).
 * - Trạng thái phải là active.
 * - Chưa vượt quá 7 ngày kết thúc.
 */
export function evaluateReminderEligibility(row: {
  email_verified: boolean;
  night1_reminder_consent: boolean;
  reminder_status: string;
  reminder_end_date?: string | null;
  current_date?: Date;
}): {
  eligible: boolean;
  reason: string;
} {
  if (!row.night1_reminder_consent) {
    return { eligible: false, reason: 'reminder_consent_not_granted' };
  }
  if (!row.email_verified) {
    return { eligible: false, reason: 'unverified_email' };
  }
  if (row.reminder_status !== 'active') {
    return { eligible: false, reason: `status_${row.reminder_status}` };
  }
  if (row.reminder_end_date) {
    const end = new Date(row.reminder_end_date);
    const now = row.current_date || new Date();
    if (now.getTime() > end.getTime() + 24 * 60 * 60 * 1000) {
      return { eligible: false, reason: '7_day_limit_exceeded' };
    }
  }
  return { eligible: true, reason: 'eligible' };
}

/**
 * Kiểm tra cấu hình nhà cung cấp email thực tế (Resend, SMTP, Sendgrid, etc.)
 */
export function checkEmailProviderConfig(): {
  configured: boolean;
  provider: string;
  missing_keys: string[];
} {
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey && resendKey.trim().length > 0) {
    return { configured: true, provider: 'resend', missing_keys: [] };
  }

  const smtpHost = process.env.SMTP_HOST;
  if (smtpHost && smtpHost.trim().length > 0) {
    return { configured: true, provider: 'smtp', missing_keys: [] };
  }

  return {
    configured: false,
    provider: 'none',
    missing_keys: ['RESEND_API_KEY', 'SMTP_HOST'],
  };
}

/**
 * Mẫu nội dung email nhắc nhở ngắn gọn, nhẹ nhàng:
 * “Một khoảng nghỉ dành cho tối nay”
 * CTA: “Mở kế hoạch tối nay” -> dẫn về /night-companion (không kèm access token hay dữ liệu sức khỏe).
 * Footer: Link quản lý lịch/hủy nhắc bằng manage_token giới hạn mục đích.
 */
export function generateReminderEmailContent(options: {
  manageToken: string;
  siteUrl: string;
  bedtime: string;
  timezone: string;
}): {
  subject: string;
  html: string;
  text: string;
} {
  const { manageToken, siteUrl, bedtime } = options;
  const baseUrl = siteUrl.replace(/\/$/, '');
  const entryUrl = `${baseUrl}/night-companion`;
  const manageUrl = `${baseUrl}/night-companion/reminder-manage?token=${encodeURIComponent(manageToken)}`;

  const subject = 'A gentle moment for tonight · Mindful Haven';

  const text = `
Mindful Haven Night Companion
A gentle moment for tonight

It is about 30 minutes before your planned bedtime (${bedtime}).
Night 1 is ready whenever you would like to slow down and ease into rest:

👉 Open tonight's practice: ${entryUrl}

---
Manage your reminder time or unsubscribe:
${manageUrl}
Sent only for bedtime notifications · Automatically ends after 7 days
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
      A gentle moment for tonight
    </h1>
    <p style="font-size: 14px; line-height: 1.6; color: #94a3b8; margin: 0 0 24px 0;">
      It is about 30 minutes before your planned bedtime (<strong>${bedtime}</strong>). 
      Night 1 is waiting for you whenever you feel ready to pause, breathe, and let go of the day at your own pace.
    </p>

    <div style="text-align: center; margin: 28px 0;">
      <a href="${entryUrl}" style="display: inline-block; background-color: #2dd4bf; color: #022c22; font-size: 14px; font-weight: 700; text-decoration: none; padding: 14px 28px; border-radius: 12px; box-shadow: 0 4px 14px rgba(45, 212, 191, 0.3);">
        Open tonight's practice
      </a>
    </div>

    <hr style="border: 0; border-top: 1px solid #1e293b; margin: 28px 0;" />

    <p style="font-size: 11px; line-height: 1.5; color: #64748b; margin: 0; text-align: center;">
      You received this email because you opted into a 30-minute bedtime reminder (lasts 7 days).<br/>
      <a href="${manageUrl}" style="color: #2dd4bf; text-decoration: underline; margin-top: 6px; display: inline-block;">
        Change reminder time or unsubscribe
      </a>
    </p>
  </div>
</body>
</html>
  `.trim();

  return { subject, html, text };
}
