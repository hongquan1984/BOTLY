'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Moon, Clock, Globe, ArrowLeft, CheckCircle2, AlertCircle, Pause, Play, BellOff } from 'lucide-react';
import { BilingualLine } from '@/lib/night-companion-i18n';
import { formatTimezoneDisplay, calculateReminderTime } from '@/lib/night-companion-timezone';
import { TimezoneReminderCard } from '@/components/night-companion/TimezoneReminderCard';

interface ManageData {
  bedtime: string;
  timezone: string;
  reminder_time: string;
  reminder_status: string;
  email_verified: boolean;
  night1_reminder_consent: boolean;
  waitlist_night2_consent: boolean;
  days_remaining: number;
  reminder_end_date: string | null;
  provider_config: { configured: boolean; provider: string; missing_keys: string[] };
}

function ReminderManageContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState<ManageData | null>(null);

  const [editBedtime, setEditBedtime] = useState('23:00');
  const [editTimezone, setEditTimezone] = useState('Asia/Ho_Chi_Minh');
  const [savingAction, setSavingAction] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (!token) {
      setError('Liên kết quản lý không hợp lệ hoặc thiếu mã xác thực (Missing token).');
      setLoading(false);
      return;
    }

    fetch(`/api/night-companion/reminder-manage?token=${encodeURIComponent(token)}`)
      .then(res => res.json())
      .then(json => {
        if (!json.ok) {
          throw new Error(json.error === 'TOKEN_NOT_FOUND' ? 'Mã quản lý đã hết hạn hoặc không tồn tại.' : 'Không thể tải dữ liệu.');
        }
        setData(json.data);
        setEditBedtime(json.data.bedtime);
        setEditTimezone(json.data.timezone);
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : 'Lỗi khi tải thông tin.');
      })
      .finally(() => setLoading(false));
  }, [token]);

  const handleAction = async (action: 'update_schedule' | 'pause' | 'resume' | 'unsubscribe') => {
    if (!token) return;
    setSavingAction(action);
    setActionFeedback(null);

    try {
      const res = await fetch('/api/night-companion/reminder-manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          action,
          bedtime: editBedtime,
          timezone: editTimezone,
        }),
      });

      const json = await res.json() as { ok: boolean; message?: string; reminder_status?: string };
      if (!res.ok || !json.ok) {
        throw new Error(json.message || 'Thao tác không thành công.');
      }

      setActionFeedback({
        type: 'success',
        message: json.message || 'Thành công!',
      });

      // Update local view
      if (data) {
        setData({
          ...data,
          bedtime: editBedtime,
          timezone: editTimezone,
          reminder_time: calculateReminderTime(editBedtime).reminder_time,
          reminder_status: json.reminder_status || data.reminder_status,
        });
      }
    } catch (err) {
      setActionFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Có lỗi xảy ra.',
      });
    } finally {
      setSavingAction(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-slate-400 text-sm">
        <BilingualLine english="Loading reminder settings..." vietnamese="Đang tải cài đặt lời nhắc..." />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-3xl border border-rose-900/60 bg-[#0c1222] p-6 text-center shadow-xl space-y-4">
        <AlertCircle className="mx-auto h-10 w-10 text-rose-400" />
        <h2 className="text-xl font-bold text-white">
          <BilingualLine english="Link expired or invalid" vietnamese="Liên kết không hợp lệ hoặc đã hết hạn" />
        </h2>
        <p className="text-xs text-slate-300 max-w-sm mx-auto">
          {error}
        </p>
        <Link
          href="/night-companion"
          className="inline-flex items-center gap-2 rounded-xl bg-teal-400 px-4 py-2.5 text-xs font-bold text-slate-950"
        >
          <ArrowLeft className="h-4 w-4" />
          <BilingualLine english="Back to 7-Night Journey" vietnamese="Về Lộ trình 7 Đêm" />
        </Link>
      </div>
    );
  }

  const tzDisplay = formatTimezoneDisplay(data.timezone);
  const isUnsubscribed = data.reminder_status === 'unsubscribed';
  const isPaused = data.reminder_status === 'paused';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-3xl border border-teal-900/60 bg-[#0c1222] p-5 shadow-2xl sm:p-6">
        <div className="flex items-center justify-between">
          <Link
            href="/night-companion"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-300 hover:text-teal-200"
          >
            <ArrowLeft className="h-4 w-4" />
            <BilingualLine english="Back to Journey" vietnamese="Về Lộ trình 7 Đêm" />
          </Link>

          <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
            isUnsubscribed
              ? 'border border-slate-700 bg-slate-900 text-slate-400'
              : isPaused
              ? 'border border-amber-600/50 bg-amber-950/40 text-amber-300'
              : 'border border-teal-500/40 bg-teal-950/60 text-teal-300'
          }`}>
            {isUnsubscribed
              ? 'Đã hủy nhắc'
              : isPaused
              ? 'Đang tạm dừng'
              : data.provider_config.configured
              ? 'Đang kích hoạt'
              : 'Chờ cấu hình gửi'}
          </span>
        </div>

        <h1 className="mt-4 text-2xl font-black text-white sm:text-3xl">
          <BilingualLine english="Manage Bedtime Reminder" vietnamese="Quản lý Lời nhắc Giờ ngủ" />
        </h1>
        <p className="mt-2 text-xs leading-5 text-slate-300">
          <BilingualLine
            english="Adjust your reminder time, pause notifications, or unsubscribe. Your Night 2 waitlist reservation remains safe."
            vietnamese="Điều chỉnh giờ nhắc, tạm dừng hoặc hủy nhận email. Đăng ký nhận thông báo Đêm 2 của bạn vẫn được giữ nguyên."
          />
        </p>

        {/* 7-day period remaining */}
        {data.days_remaining > 0 && !isUnsubscribed && (
          <div className="mt-4 rounded-xl border border-indigo-900/50 bg-[#080b15] px-3.5 py-2.5 text-xs text-slate-300 flex items-center justify-between">
            <span className="text-slate-400">
              <BilingualLine english="7-Day Reminder Duration:" vietnamese="Thời hạn nhắc 7 ngày:" />
            </span>
            <span className="font-bold text-teal-300">
              <BilingualLine
                english={`${data.days_remaining} days remaining`}
                vietnamese={`Còn ${data.days_remaining} ngày`}
              />
            </span>
          </div>
        )}
      </div>

      {actionFeedback && (
        <div className={`rounded-2xl p-4 text-xs font-medium flex items-center gap-2.5 ${
          actionFeedback.type === 'success'
            ? 'border border-teal-500/50 bg-teal-950/40 text-teal-200'
            : 'border border-rose-800/60 bg-rose-950/40 text-rose-200'
        }`}>
          {actionFeedback.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-teal-400" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
          )}
          <span>{actionFeedback.message}</span>
        </div>
      )}

      {/* Main Settings Card */}
      <div className="rounded-3xl border border-indigo-950 bg-[#0c1222] p-5 shadow-xl sm:p-6 space-y-5">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Clock className="h-4 w-4 text-teal-400" />
          <BilingualLine english="Reminder Schedule" vietnamese="Lịch nhận nhắc nhở" />
        </h3>

        <TimezoneReminderCard
          timezone={editTimezone}
          onTimezoneChange={setEditTimezone}
          bedtime={editBedtime}
          onBedtimeChange={setEditBedtime}
          reminderConsent={true}
          onReminderConsentChange={() => {}}
          disabled={isUnsubscribed || savingAction !== null}
        />

        {!isUnsubscribed && (
          <button
            type="button"
            onClick={() => handleAction('update_schedule')}
            disabled={savingAction !== null}
            className="w-full flex min-h-12 items-center justify-center gap-2 rounded-xl bg-teal-300 px-4 py-3 text-xs font-bold text-slate-950 transition hover:bg-teal-200 disabled:opacity-50"
          >
            <BilingualLine
              english={savingAction === 'update_schedule' ? 'Saving...' : 'Update schedule'}
              vietnamese={savingAction === 'update_schedule' ? 'Đang lưu...' : 'Lưu giờ & múi giờ mới'}
            />
          </button>
        )}

        {/* Action Buttons: Pause / Resume / Unsubscribe */}
        <div className="pt-4 border-t border-indigo-950 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {!isUnsubscribed && (
              isPaused ? (
                <button
                  type="button"
                  onClick={() => handleAction('resume')}
                  disabled={savingAction !== null}
                  className="flex items-center justify-center gap-2 rounded-xl border border-teal-500/50 bg-teal-950/30 px-4 py-3 text-xs font-bold text-teal-200 hover:bg-teal-900/40"
                >
                  <Play className="h-3.5 w-3.5" />
                  <BilingualLine english="Resume reminders" vietnamese="Tiếp tục nhận nhắc" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleAction('pause')}
                  disabled={savingAction !== null}
                  className="flex items-center justify-center gap-2 rounded-xl border border-indigo-800 bg-[#080b15] px-4 py-3 text-xs font-bold text-slate-300 hover:bg-indigo-950/40"
                >
                  <Pause className="h-3.5 w-3.5" />
                  <BilingualLine english="Pause reminders" vietnamese="Tạm dừng nhắc" />
                </button>
              )
            )}

            {!isUnsubscribed && (
              <button
                type="button"
                onClick={() => handleAction('unsubscribe')}
                disabled={savingAction !== null}
                className="flex items-center justify-center gap-2 rounded-xl border border-rose-900/60 bg-rose-950/20 px-4 py-3 text-xs font-bold text-rose-300 hover:bg-rose-950/40"
              >
                <BellOff className="h-3.5 w-3.5" />
                <BilingualLine english="Unsubscribe from reminders" vietnamese="Hủy nhận lời nhắc" />
              </button>
            )}
          </div>

          <p className="text-center text-[11px] leading-4 text-slate-500">
            <BilingualLine
              english="Unsubscribing only stops bedtime reminders. Your email will still be notified when Night 2 is ready."
              vietnamese="Hủy nhận chỉ dừng lời nhắc giờ ngủ. Bạn vẫn sẽ nhận được thông báo khi Đêm 2 sẵn sàng."
            />
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ReminderManagePage() {
  return (
    <main className="min-h-screen bg-[#070a13] px-4 py-10 text-white">
      <div className="mx-auto max-w-xl">
        <Suspense fallback={<div className="text-center text-slate-400 py-20 text-sm">Loading...</div>}>
          <ReminderManageContent />
        </Suspense>
      </div>
    </main>
  );
}
