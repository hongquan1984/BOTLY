'use client';

import { useEffect, useState } from 'react';
import { Moon, RefreshCw, Volume2, Users, Mail, CheckCircle2, ChevronRight, BarChart3, Filter } from 'lucide-react';
import type { FunnelReportData, FunnelBreakdown } from '@/lib/night-companion-funnel';

export default function AdminNightCompanionPage() {
  const [data, setData] = useState<FunnelReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'production' | 'test'>('production');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/night-companion-funnel');
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || 'Failed to load report');
      }
      setData(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading funnel data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const b: FunnelBreakdown | undefined = data ? data[activeTab] : undefined;

  return (
    <div className="min-h-screen bg-[#070b14] p-4 text-slate-100 sm:p-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-indigo-950 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-teal-300">
              <Moon className="h-4 w-4" />
              <span>MINDFUL HAVEN · NIGHT COMPANION ADMIN</span>
            </div>
            <h1 className="mt-1 text-2xl font-black text-white sm:text-3xl">
              Báo cáo Phễu 7 Đêm & Danh sách Chờ
            </h1>
            <p className="mt-1 text-xs text-slate-400">
              Dữ liệu thời gian thực được tổng hợp trực tiếp từ Supabase Analytics & Waitlist
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Environment Toggle */}
            <div className="flex rounded-xl border border-indigo-900 bg-[#0c1222] p-1">
              <button
                type="button"
                onClick={() => setActiveTab('production')}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  activeTab === 'production'
                    ? 'bg-teal-400 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Người dùng thật (Prod)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('test')}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  activeTab === 'test'
                    ? 'bg-amber-400 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Dữ liệu Test / Dev
              </button>
            </div>

            <button
              type="button"
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-xl border border-indigo-800 bg-indigo-950/60 px-3 py-2 text-xs font-bold text-slate-200 transition hover:bg-indigo-900"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Tải lại</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-6 rounded-2xl border border-rose-800/60 bg-rose-950/40 p-4 text-sm text-rose-200">
            {error}
          </div>
        )}

        {b && (
          <div className="mt-8 space-y-8">
            {/* Top KPIs Grid */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
              <KpiCard label="Bắt đầu quiz" value={b.quiz_starts} />
              <KpiCard
                label="Xong quiz"
                value={b.quiz_completes}
                rate={b.quiz_starts ? `${Math.round((b.quiz_completes / b.quiz_starts) * 100)}%` : undefined}
              />
              <KpiCard label="Xem kết quả" value={b.result_views} />
              <KpiCard label="Vào Map 7 đêm" value={b.map_views} highlight />
              <KpiCard label="Bấm Night 1" value={b.night_1_clicks} />
              <KpiCard label="Mở player N1" value={b.audio_starts} />
              <KpiCard label="Bấm Night 2–7" value={b.total_night_2_plus_clicks} highlightAmber />
              <KpiCard label="Đăng ký Waitlist" value={b.waitlist_signups} highlightTeal />
            </div>

            {/* Middle Section: Waterfall & Listening Duration */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Question Waterfall */}
              <div className="rounded-3xl border border-indigo-900/60 bg-[#0c1222] p-5 shadow-xl sm:p-6">
                <div className="flex items-center justify-between border-b border-indigo-950 pb-4">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-teal-300" />
                    <h2 className="text-base font-bold text-white">Waterfall từng câu hỏi Quiz</h2>
                  </div>
                  <span className="text-xs text-slate-400">15 bước câu hỏi</span>
                </div>

                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-indigo-950 text-[11px] uppercase tracking-wider text-slate-400">
                        <th className="pb-2 font-semibold">Bước</th>
                        <th className="pb-2 font-semibold">Tên câu hỏi</th>
                        <th className="pb-2 text-right font-semibold">Lượt xem</th>
                        <th className="pb-2 text-right font-semibold">Trả lời</th>
                        <th className="pb-2 text-right font-semibold">Tỉ lệ tới</th>
                        <th className="pb-2 text-right font-semibold">Bỏ rơi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-indigo-950/60">
                      {b.waterfall_questions.map((q) => (
                        <tr key={q.step} className="hover:bg-indigo-950/20">
                          <td className="py-2.5 font-bold text-teal-300">Q{q.step}</td>
                          <td className="py-2.5 font-medium text-slate-200">{q.question_id}</td>
                          <td className="py-2.5 text-right font-semibold text-white">{q.views}</td>
                          <td className="py-2.5 text-right text-slate-300">{q.answers}</td>
                          <td className="py-2.5 text-right font-bold text-teal-300">{q.reach_pct}%</td>
                          <td className="py-2.5 text-right text-rose-300">
                            {q.dropoff_count > 0 ? `-${q.dropoff_count} (${q.dropoff_pct}%)` : '0%'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Listening Time Distribution */}
              <div className="rounded-3xl border border-indigo-900/60 bg-[#0c1222] p-5 shadow-xl sm:p-6">
                <div className="flex items-center justify-between border-b border-indigo-950 pb-4">
                  <div className="flex items-center gap-2">
                    <Volume2 className="h-4 w-4 text-teal-300" />
                    <h2 className="text-base font-bold text-white">Phân bố thời gian nghe thực tế (Wall-Clock)</h2>
                  </div>
                  <span className="rounded-full bg-teal-950/70 px-2.5 py-0.5 text-xs font-bold text-teal-300">
                    Trung vị: {b.listening_distribution.median_seconds}s
                  </span>
                </div>

                <p className="mt-3 text-xs leading-5 text-slate-400">
                  Thời gian được tích lũy độc lập khi âm thanh phát thực sự. Tua cóc đến cuối không làm tăng thời gian nghe.
                </p>

                <div className="mt-5 space-y-3">
                  <DistBar
                    label="Dưới 1 phút (<60s)"
                    count={b.listening_distribution.under_1m}
                    total={b.audio_starts}
                  />
                  <DistBar
                    label="1–3 phút (60–180s)"
                    count={b.listening_distribution.from_1m_to_3m}
                    total={b.audio_starts}
                  />
                  <DistBar
                    label="3–5 phút (180–300s)"
                    count={b.listening_distribution.from_3m_to_5m}
                    total={b.audio_starts}
                  />
                  <DistBar
                    label="5–10 phút (300–600s)"
                    count={b.listening_distribution.from_5m_to_10m}
                    total={b.audio_starts}
                  />
                  <DistBar
                    label="Trên 10 phút (>600s)"
                    count={b.listening_distribution.over_10m}
                    total={b.audio_starts}
                  />
                </div>

                <div className="mt-6 rounded-2xl border border-teal-950 bg-teal-950/30 p-3.5 text-xs text-slate-300">
                  <div className="flex items-center justify-between">
                    <span>Số người đạt độ phủ voice &gt;= 80%:</span>
                    <span className="font-bold text-teal-300">{b.audio_completed_coverage}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span>Số lượt nghe lại Night 1:</span>
                    <span className="font-bold text-teal-300">{b.night_1_replays}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span>Số phiên người dùng quay lại:</span>
                    <span className="font-bold text-teal-300">{b.returning_users}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Night 2–7 Clicks & Waitlist Signups */}
            <div className="rounded-3xl border border-indigo-900/60 bg-[#0c1222] p-5 shadow-xl sm:p-6">
              <div className="flex items-center justify-between border-b border-indigo-950 pb-4">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-teal-300" />
                  <h2 className="text-base font-bold text-white">Ý định tiếp tục (Night 2–7) & Đăng ký Chờ</h2>
                </div>
                <span className="text-xs text-teal-300">
                  Tỉ lệ đăng ký: {b.total_night_2_plus_clicks ? `${Math.round((b.waitlist_signups / b.total_night_2_plus_clicks) * 100)}%` : '0%'}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-6">
                {[2, 3, 4, 5, 6, 7].map((night) => {
                  const clicks = b.night_locked_clicks[night] || 0;
                  const signups = b.waitlist_by_night[night] || 0;
                  return (
                    <div
                      key={night}
                      className="rounded-2xl border border-indigo-950 bg-[#080b15] p-3 text-center"
                    >
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Đêm {night}
                      </div>
                      <div className="mt-1 text-lg font-black text-white">{clicks}</div>
                      <div className="text-[10px] text-slate-400">lượt bấm</div>
                      <div className="mt-2 border-t border-indigo-950 pt-1 text-[11px] font-bold text-teal-300">
                        {signups} chờ
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  rate,
  highlight,
  highlightAmber,
  highlightTeal,
}: {
  label: string;
  value: number;
  rate?: string;
  highlight?: boolean;
  highlightAmber?: boolean;
  highlightTeal?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-3 text-center transition ${
        highlightTeal
          ? 'border-teal-500/60 bg-teal-950/40 text-teal-200'
          : highlightAmber
          ? 'border-amber-500/60 bg-amber-950/40 text-amber-200'
          : highlight
          ? 'border-teal-400/40 bg-[#0d162a]'
          : 'border-indigo-950 bg-[#0c1222]'
      }`}
    >
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</div>
      <div className="mt-1 text-xl font-black text-white">{value}</div>
      {rate && <div className="text-[10px] font-bold text-teal-300">{rate}</div>}
    </div>
  );
}

function DistBar({ label, count, total }: { label: string; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs text-slate-300">
        <span>{label}</span>
        <span className="font-bold text-teal-200">{count} lượt ({pct}%)</span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-[#080b15]">
        <div
          className="h-full bg-gradient-to-r from-teal-400 to-indigo-500 transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
