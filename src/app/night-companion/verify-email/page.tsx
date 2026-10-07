'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, AlertCircle, Moon, Clock, ArrowRight, Settings } from 'lucide-react';
import { BilingualLine } from '@/lib/night-companion-i18n';
import { formatTimezoneDisplay } from '@/lib/night-companion-timezone';

interface VerificationData {
  id: string;
  email_masked: string;
  bedtime: string;
  timezone: string;
  reminder_time: string;
  manage_token: string;
  email_verified: boolean;
  reminder_status: string;
}

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<VerificationData | null>(null);

  useEffect(() => {
    if (!token) {
      setError('Thiếu mã xác minh trong đường dẫn (Missing token).');
      setLoading(false);
      return;
    }

    fetch(`/api/night-companion/verify-email?token=${encodeURIComponent(token)}`)
      .then(res => res.json())
      .then(json => {
        if (!json.ok) {
          throw new Error(json.message || 'Mã xác minh không hợp lệ hoặc đã hết hạn.');
        }
        setData(json.data);
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : 'Lỗi khi xác minh email.');
      })
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070a13] text-slate-100 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400 font-medium">Đang xác minh email...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#070a13] text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-7 h-7" />
          </div>

          <div>
            <h1 className="text-xl font-bold text-white mb-2">Không thể xác minh</h1>
            <p className="text-sm text-slate-400 leading-relaxed">
              {error || 'Mã xác minh không tồn tại hoặc đã được sử dụng.'}
            </p>
          </div>

          <div className="pt-2">
            <Link
              href="/night-companion"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold transition"
            >
              Quay lại Hành trình Đêm
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const tzDisplay = formatTimezoneDisplay(data.timezone);

  return (
    <div className="min-h-screen bg-[#070a13] text-slate-100 flex items-center justify-center p-4 selection:bg-teal-500/20">
      <div className="max-w-lg w-full bg-slate-900/80 backdrop-blur-md border border-slate-800/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
        {/* Header icon */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-3xl bg-teal-500/15 text-teal-400 flex items-center justify-center mx-auto border border-teal-500/20 shadow-lg shadow-teal-500/10">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <BilingualLine
              english="Email confirmed"
              vietnamese="Email của bạn đã được xác minh"
              className="text-2xl font-bold text-white tracking-tight"
            />
          </div>

          <p className="text-sm text-slate-400 leading-relaxed pt-1">
            Lời nhắc trước giờ ngủ 30 phút đã được kích hoạt thành công cho địa chỉ{' '}
            <span className="text-slate-200 font-medium">{data.email_masked}</span> trong 7 đêm tới.
          </p>
        </div>

        {/* Schedule preview card */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3.5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-400 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Giờ nhắc dự kiến</p>
              <p className="text-lg font-bold text-white">
                {data.reminder_time} <span className="text-xs font-normal text-slate-400">giờ địa phương</span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800/80 text-xs">
            <div>
              <span className="text-slate-500">Giờ ngủ dự kiến:</span>
              <p className="text-slate-300 font-medium mt-0.5">{data.bedtime}</p>
            </div>
            <div>
              <span className="text-slate-500">Múi giờ:</span>
              <p className="text-slate-300 font-medium mt-0.5 truncate" title={tzDisplay.friendly_name_vi}>
                {tzDisplay.friendly_name_vi}
              </p>
            </div>
          </div>
        </div>

        {/* Gentle promise banner */}
        <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-3.5 text-xs text-slate-400 flex items-start gap-2.5">
          <Moon className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Lời nhắc chỉ là một thông báo nhẹ nhàng nhắc bạn mở bài nghe Đêm 1. Không gửi quảng cáo hay nội dung khác. Lời nhắc tự động dừng sau 7 ngày.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3 pt-2">
          <Link
            href="/night-companion"
            className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold text-sm transition shadow-lg shadow-teal-500/20"
          >
            <span>Vào bản đồ 7 đêm ngay</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          {data.manage_token && (
            <Link
              href={`/night-companion/reminder-manage?token=${encodeURIComponent(data.manage_token)}`}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition border border-slate-700/50"
            >
              <Settings className="w-3.5 h-3.5 text-slate-400" />
              <span>Đổi giờ ngủ hoặc múi giờ nhắc</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#070a13] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
