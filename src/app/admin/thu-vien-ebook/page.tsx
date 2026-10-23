'use client';

import { useState } from 'react';
import { BookOpen, Download, FileText, Mail, RefreshCw, ShieldCheck } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type Summary = {
  ebook_total: number; ebook_hosted: number; ebook_link_out: number; ebook_pending: number;
  leads_total: number; leads_today: number; downloads_today: number;
  page_views_total: number; articles_published: number; articles_queued: number;
  leads_by_ebook: { id: string; public_display_title: string; leads: number; downloads: number; views: number; conversion_rate: number }[];
  recent_schedule: { scheduled_for: string; status: string; topic_angle: string; source_ebook_id: string | null }[];
};

export default function EbookLibraryAdminPage() {
  const [token, setToken] = useState('');
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const metrics: { icon: LucideIcon; label: string; value: number }[] = summary ? [
    {icon:BookOpen,label:'Tổng ebook',value:summary.ebook_total},
    {icon:ShieldCheck,label:'Được phép host',value:summary.ebook_hosted},
    {icon:FileText,label:'Chỉ dẫn nguồn',value:summary.ebook_link_out},
    {icon:FileText,label:'Chờ rà soát',value:summary.ebook_pending},
    {icon:Mail,label:'Tổng email leads',value:summary.leads_total},
    {icon:Mail,label:'Leads hôm nay',value:summary.leads_today},
    {icon:Download,label:'Lượt tải hôm nay',value:summary.downloads_today},
    {icon:BookOpen,label:'Bài tiếng Anh đã đăng',value:summary.articles_published},
    {icon:FileText,label:'Bài trong hàng đợi',value:summary.articles_queued},
    {icon:BookOpen,label:'Lượt xem ebook',value:summary.page_views_total},
  ] : [];
  async function load(event: React.FormEvent) {
    event.preventDefault(); setLoading(true); setError('');
    try {
      const response = await fetch('/api/admin/ebook-library', { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Không thể tải báo cáo.');
      setSummary(result.data);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Có lỗi khi tải dữ liệu.'); }
    finally { setLoading(false); }
  }
  return <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100 sm:px-8">
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-emerald-300">BOTLY · QUẢN TRỊ NỘI BỘ</p><h1 className="mt-2 text-3xl font-black">Thư viện Ebook Wellness</h1><p className="mt-2 text-sm text-slate-400">Báo cáo lead, lượt mở khóa, phân loại pháp lý và hàng đợi nội dung.</p></div><a href="/admin/thong-ke" className="text-sm font-semibold text-emerald-300 underline">Mở trang thống kê chung</a></div>
      {!summary && <form onSubmit={load} className="mt-8 max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-5"><label className="block text-sm font-semibold" htmlFor="ebook-admin-token">Mã truy cập quản trị</label><input id="ebook-admin-token" type="password" required value={token} onChange={(event) => setToken(event.target.value)} autoComplete="current-password" className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5"/><button className="mt-3 rounded-xl bg-emerald-400 px-4 py-2.5 font-bold text-slate-950 disabled:opacity-50" disabled={loading}>{loading ? 'Đang tải…' : 'Xem báo cáo'}</button>{error && <p className="mt-3 text-sm text-rose-300" role="alert">{error}</p>}<p className="mt-3 text-xs leading-relaxed text-slate-500">Token được cấu hình bằng biến môi trường máy chủ EBOOK_ADMIN_TOKEN. Không lưu token trên trình duyệt.</p></form>}
      {summary && <>
        <div className="mt-7 flex items-center justify-between"><p className="text-sm text-emerald-200">Dữ liệu báo cáo được tổng hợp, không hiển thị địa chỉ email.</p><button onClick={() => { setSummary(null); }} className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-300"><RefreshCw className="h-4 w-4"/> Tải lại</button></div>
        <section className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map(({icon:Icon,label,value}) => <div key={label} className="rounded-2xl border border-slate-800 bg-slate-900 p-4"><p className="flex items-center gap-2 text-xs font-semibold text-slate-400"><Icon className="h-4 w-4 text-emerald-300"/>{label}</p><p className="mt-2 text-2xl font-black">{value.toLocaleString('vi-VN')}</p></div>)}
        </section>
        <section className="mt-8 grid gap-6 lg:grid-cols-2"><div className="rounded-2xl border border-slate-800 bg-slate-900 p-5"><h2 className="text-lg font-extrabold">Lead theo ebook</h2><div className="mt-4 space-y-3">{summary.leads_by_ebook.map((row) => <div key={row.id} className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3 text-sm"><span>{row.public_display_title}</span><span className="shrink-0 text-emerald-200">{row.leads} leads · {row.downloads} lượt tải · {row.conversion_rate}%</span></div>)}</div></div><div className="rounded-2xl border border-slate-800 bg-slate-900 p-5"><h2 className="text-lg font-extrabold">Lịch nội dung</h2><div className="mt-4 space-y-3">{summary.recent_schedule.map((row) => <div key={row.scheduled_for} className="border-b border-slate-800 pb-3"><p className="text-sm font-semibold">{row.topic_angle}</p><p className="mt-1 text-xs text-slate-400">{new Date(row.scheduled_for).toLocaleString('vi-VN')} · {row.status} · {row.source_ebook_id || 'Chưa gắn ebook'}</p></div>)}{summary.recent_schedule.length === 0 && <p className="text-sm text-slate-500">Chưa có lịch đăng. Áp dụng migration và cấu hình bộ lập lịch để thêm lịch.</p>}</div></div></section>
      </>}
    </div>
  </main>;
}
