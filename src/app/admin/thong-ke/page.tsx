'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Users,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Download,
  RefreshCw,
  Search,
  Filter,
  ShieldCheck,
  Mail,
  Sparkles,
  Smartphone,
  Monitor,
  Globe,
  BarChart3,
  TrendingUp,
  Calendar,
  ExternalLink,
  Lock,
  Unlock,
  EyeOff,
  Flame,
  FileSpreadsheet,
  BookOpen
} from 'lucide-react';

interface SummaryData {
  total_page_views: number;
  today_page_views: number;
  total_unique_visitors?: number;
  today_unique_visitors?: number;
  views_per_visitor?: number;
  total_quiz_starts?: number;
  today_quiz_starts?: number;
  total_quiz_completions: number;
  today_quiz_completions: number;
  total_quiz_in_progress?: number;
  quiz_drop_off_rate?: number;
  quiz_completion_rate?: number;
  total_ebook_downloads?: number;
  today_ebook_downloads?: number;
  ebook_direct_downloads?: number;
  ebook_unlock_downloads?: number;
  ebook_subscribers?: number;
  today_ebook_subscribers?: number;
  total_app_clicks?: number;
  today_app_clicks?: number;
  app_clicks_ios?: number;
  app_clicks_android?: number;
  total_subscribers: number;
  quiz_subscribers: number;
  somatic_subscribers?: number;
  home_subscribers: number;
  today_subscribers: number;
  overall_conversion_rate: number;
}

interface DailyRecord {
  day: string;
  page_views: number;
  unique_visitors?: number;
  quiz_starts?: number;
  quiz_completions: number;
  quiz_drop_offs?: number;
  leads: number;
  app_clicks?: number;
  ebook_downloads?: number;
}

interface ArticleRecord {
  article_slug: string;
  title: string;
  locale: string;
  views: number;
  unique_visitors?: number;
  quiz_starts?: number;
  quiz_completions: number;
  quiz_drop_offs?: number;
  quiz_drop_off_rate?: number;
  app_clicks?: number;
  leads: number;
  quiz_rate: number;
  conversion_rate: number;
}

interface StaticPageRecord {
  path: string;
  title: string;
  locale: string;
  views: number;
  unique_visitors?: number;
  quiz_starts: number;
  quiz_completions: number;
  quiz_drop_offs: number;
  app_clicks: number;
}

interface EbookBreakdownRecord {
  ebook_id: string;
  volume: string;
  title: string;
  status: string;
  views: number;
  total_downloads: number;
  direct_downloads: number;
  unlock_downloads: number;
  subscribers: number;
  download_rate: number;
}

interface RecentEbookRecord {
  id: string;
  ebook_id: string;
  title: string;
  method: string;
  source: string;
  locale: string;
  device_type: string;
  created_at: string;
}

interface SubscriberRecord {
  id: string;
  email: string;
  locale: string;
  source: string;
  consented_at: string;
  status: string;
}

interface DeviceRecord {
  device: string;
  count: number;
}

interface ReferrerRecord {
  channel: string;
  count: number;
}

interface RecentQuizRecord {
  id: string;
  article_slug: string;
  locale: string;
  path: string;
  event_type?: string;
  metadata: {
    verdict?: string;
    completion_seconds?: number;
    questions_count?: number;
    total_questions?: number;
    step?: number;
    sprout?: string;
    quiz_type?: string;
    source?: string;
  };
  created_at: string;
}

interface AnalyticsPayload {
  summary: SummaryData;
  daily: DailyRecord[];
  articles: ArticleRecord[];
  static_pages?: StaticPageRecord[];
  ebooks?: EbookBreakdownRecord[];
  recent_ebooks?: RecentEbookRecord[];
  subscribers: SubscriberRecord[];
  devices: DeviceRecord[];
  referrers: ReferrerRecord[];
  recent_quizzes: RecentQuizRecord[];
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDays, setSelectedDays] = useState<number>(7);
  const [activeTab, setActiveTab] = useState<'subscribers' | 'ebooks' | 'articles' | 'static_pages' | 'quizzes' | 'devices'>('subscribers');

  // Search and filters for subscribers
  const [searchEmail, setSearchEmail] = useState<string>('');
  const [filterSource, setFilterSource] = useState<string>('all');
  const [filterLocale, setFilterLocale] = useState<string>('all');
  const [maskEmails, setMaskEmails] = useState<boolean>(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  // Fetch data
  const fetchData = async (days: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/analytics?days=${days}`);
      if (!res.ok) throw new Error(`Lỗi kết nối máy chủ (${res.status})`);
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'Không thể tải dữ liệu thống kê');
      setData(json.data);
      setLastRefreshed(new Date());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Lỗi không xác định');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(selectedDays);
  }, [selectedDays]);

  // Filtered subscribers list
  const filteredSubscribers = useMemo(() => {
    if (!data?.subscribers) return [];
    return data.subscribers.filter(sub => {
      const matchSearch =
        sub.email.toLowerCase().includes(searchEmail.toLowerCase()) ||
        sub.source.toLowerCase().includes(searchEmail.toLowerCase());

      const matchSource =
        filterSource === 'all'
          ? true
          : filterSource === 'quiz'
          ? sub.source.startsWith('safety_quiz_')
          : filterSource === 'somatic'
          ? sub.source.startsWith('somatic_haven_')
          : filterSource === 'ebook'
          ? sub.source.includes('ebook')
          : !sub.source.startsWith('safety_quiz_') && !sub.source.startsWith('somatic_haven_') && !sub.source.includes('ebook');

      const matchLocale = filterLocale === 'all' ? true : sub.locale === filterLocale;

      return matchSearch && matchSource && matchLocale;
    });
  }, [data?.subscribers, searchEmail, filterSource, filterLocale]);

  // Export CSV
  const handleExportCSV = () => {
    if (!data?.subscribers || data.subscribers.length === 0) return;
    const headers = ['ID', 'Email', 'Ngôn ngữ', 'Nguồn đăng ký', 'Ngày đăng ký', 'Trạng thái'];
    const rows = data.subscribers.map(s => [
      `"${s.id}"`,
      `"${s.email}"`,
      `"${s.locale}"`,
      `"${s.source}"`,
      `"${new Date(s.consented_at).toLocaleString('vi-VN')}"`,
      `"${s.status}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `botly-subscribers-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const maskEmailStr = (email: string) => {
    if (!maskEmails) return email;
    const [user, domain] = email.split('@');
    if (!domain) return email;
    const maskedUser = user.length > 2 ? user.slice(0, 2) + '***' : user + '***';
    return `${maskedUser}@${domain}`;
  };

  // Calculate max daily pageviews for responsive SVG bar scaling
  const maxDailyViews = useMemo(() => {
    if (!data?.daily || data.daily.length === 0) return 100;
    return Math.max(...data.daily.map(d => Math.max(d.page_views, d.quiz_completions * 2)), 50);
  }, [data?.daily]);

  return (
    <div className="min-h-screen bg-[#0d1614] text-slate-100 font-sans antialiased selection:bg-emerald-500 selection:text-white">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 border-b border-emerald-900/40 bg-[#0d1614]/90 backdrop-blur-md px-4 py-3 sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 font-bold text-white shadow-md shadow-emerald-950/40">
                B
              </div>
              <div>
                <span className="font-semibold tracking-tight text-white">Botly Analytics</span>
                <span className="ml-2 rounded-md bg-emerald-950 px-2 py-0.5 text-xs font-medium text-emerald-400 border border-emerald-800/60">
                  Admin Pro
                </span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {/* Live Indicator */}
            <div className="hidden sm:flex items-center gap-2 rounded-full border border-emerald-800/40 bg-emerald-950/30 px-3 py-1 text-xs text-emerald-400">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
              </span>
              Dữ liệu trực tiếp
            </div>

            {/* Time Filter */}
            <div className="flex items-center rounded-xl border border-emerald-900/50 bg-[#13221f] p-0.5 text-xs">
              {[
                { label: '7 ngày', value: 7 },
                { label: '14 ngày', value: 14 },
                { label: '30 ngày', value: 30 }
              ].map(item => (
                <button
                  key={item.value}
                  onClick={() => setSelectedDays(item.value)}
                  className={`rounded-lg px-2.5 py-1.5 font-medium transition-all ${
                    selectedDays === item.value
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-emerald-300/70 hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Refresh Button */}
            <button
              onClick={() => fetchData(selectedDays)}
              disabled={loading}
              title="Làm mới dữ liệu"
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-emerald-900/60 bg-[#13221f] text-emerald-300 hover:bg-emerald-900/40 hover:text-white transition-all disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {/* Masking Toggle */}
            <button
              onClick={() => setMaskEmails(!maskEmails)}
              title={maskEmails ? 'Hiển thị email đầy đủ' : 'Che bớt email (bảo mật)'}
              className={`hidden sm:flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-medium transition-all ${
                maskEmails
                  ? 'border-amber-800/60 bg-amber-950/30 text-amber-300'
                  : 'border-emerald-900/60 bg-[#13221f] text-emerald-300 hover:text-white'
              }`}
            >
              {maskEmails ? <Lock className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              {maskEmails ? 'Đang che' : 'Che email'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Dashboard Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
        {/* Title Header */}
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Trung Tâm Thống Kê & Phân Tích Dữ Liệu
            </h1>
            <p className="mt-1 text-sm text-emerald-200/60">
              Lượt truy cập hàng ngày, số người làm bài trắc nghiệm an toàn (Quiz) và danh sách email thu thập được.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-900/20 hover:from-emerald-500 hover:to-teal-400 transition-all cursor-pointer"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Xuất File Email (CSV)
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-rose-900/50 bg-rose-950/30 p-4 text-rose-300 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0 text-rose-400" />
            <div>
              <p className="font-semibold text-sm">Không thể tải dữ liệu thống kê</p>
              <p className="text-xs opacity-80">{error}</p>
            </div>
          </div>
        )}

        {/* 6 Summary KPI Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {/* Card 1: Pageviews & Unique Visitors */}
          <div className="rounded-3xl border border-emerald-900/50 bg-gradient-to-b from-[#132320] to-[#0f1b18] p-5 shadow-lg shadow-black/20">
            <div className="flex items-center justify-between text-emerald-400">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-300/70">Lượt Xem & Người Dùng</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-900/40 text-emerald-300">
                <Eye className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-extrabold text-white tracking-tight">
                  {data?.summary?.total_page_views?.toLocaleString('vi-VN') || 0}
                </span>
                <span className="text-xs font-bold text-emerald-400/80 uppercase">views</span>
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-200">
                <span>👤</span>
                <span className="font-extrabold text-white">{data?.summary?.total_unique_visitors?.toLocaleString('vi-VN') || 0}</span>
                <span className="text-emerald-300/70">người (UV)</span>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-emerald-900/40 pt-2 text-[11px]">
              <span className="text-emerald-400 font-medium">
                +{data?.summary?.today_page_views || 0} views hôm nay
              </span>
              <span className="text-emerald-300/80 font-mono">
                ({data?.summary?.today_unique_visitors || 0} người)
              </span>
            </div>
          </div>

          {/* Card 2: Quizzes Funnel (Starts, Drop-offs, Completions) */}
          <div className="rounded-3xl border border-amber-900/40 bg-gradient-to-b from-[#211d14] to-[#17140d] p-5 shadow-lg shadow-black/20">
            <div className="flex items-center justify-between text-amber-400">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-300/70">Tương Tác Quiz</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-900/40 text-amber-300">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-extrabold text-white tracking-tight">
                {(data?.summary?.total_quiz_starts && data.summary.total_quiz_starts > 0 ? data.summary.total_quiz_starts : data?.summary?.total_quiz_completions || 0).toLocaleString('vi-VN')}
              </span>
              <span className="ml-2 text-xs font-medium text-amber-300 bg-amber-950/80 border border-amber-800/40 px-2 py-0.5 rounded-md">
                +{data?.summary?.today_quiz_starts || data?.summary?.today_quiz_completions || 0} hôm nay
              </span>
            </div>
            <div className="mt-2 flex flex-col gap-1 text-xs">
              <div className="flex items-center justify-between text-emerald-300 font-medium">
                <span>✓ Xong 100%:</span>
                <span className="font-bold">{data?.summary?.total_quiz_completions || 0} lượt</span>
              </div>
              <div className="flex items-center justify-between text-amber-400/90 font-medium">
                <span>⏳ Bỏ dở:</span>
                <span className="font-bold">{data?.summary?.total_quiz_in_progress || 0} ({data?.summary?.quiz_drop_off_rate || 0}%)</span>
              </div>
            </div>
          </div>

          {/* Card 3: Ebook Downloads */}
          <div className="rounded-3xl border border-emerald-800/50 bg-gradient-to-b from-[#142821] to-[#0c1a15] p-5 shadow-lg shadow-black/20">
            <div className="flex items-center justify-between text-emerald-300">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-300/70">Tải Ebook</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-900/40 text-amber-300">
                <BookOpen className="h-5 w-5 text-amber-300" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-extrabold text-white tracking-tight">
                {(data?.summary?.total_ebook_downloads || 0).toLocaleString('vi-VN')}
              </span>
              <span className="ml-2 text-xs font-medium text-amber-300 bg-amber-950/80 border border-amber-800/40 px-2 py-0.5 rounded-md">
                +{data?.summary?.today_ebook_downloads || 0} hôm nay
              </span>
            </div>
            <div className="mt-2 flex flex-col gap-1 text-xs">
              <div className="flex items-center justify-between text-emerald-300 font-medium">
                <span>✓ Trực tiếp:</span>
                <span className="font-bold">{data?.summary?.ebook_direct_downloads || 0} lượt</span>
              </div>
              <div className="flex items-center justify-between text-teal-300 font-medium">
                <span>📥 Qua email:</span>
                <span className="font-bold">{data?.summary?.ebook_unlock_downloads || 0} ({data?.summary?.ebook_subscribers || 0} leads)</span>
              </div>
            </div>
          </div>

          {/* Card 4: App Download Clicks */}
          <div className="rounded-3xl border border-purple-900/40 bg-gradient-to-b from-[#1b1429] to-[#120d1c] p-5 shadow-lg shadow-black/20">
            <div className="flex items-center justify-between text-purple-300">
              <span className="text-xs font-semibold uppercase tracking-wider text-purple-300/70">Click Nút Tải App</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-900/40 text-purple-300">
                <Download className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-extrabold text-white tracking-tight">
                {data?.summary?.total_app_clicks?.toLocaleString('vi-VN') || 0}
              </span>
              <span className="ml-2 text-xs font-medium text-purple-300 bg-purple-950/80 border border-purple-800/40 px-2 py-0.5 rounded-md">
                +{data?.summary?.today_app_clicks || 0} hôm nay
              </span>
            </div>
            <div className="mt-2 flex items-center gap-3 text-xs text-purple-200/70 font-medium">
              <span> {data?.summary?.app_clicks_ios || 0} iOS</span>
              <span>•</span>
              <span>▶ {data?.summary?.app_clicks_android || 0} Android</span>
            </div>
          </div>

          {/* Card 5: Email Leads */}
          <div className="rounded-3xl border border-teal-900/40 bg-gradient-to-b from-[#132322] to-[#0e1b1a] p-5 shadow-lg shadow-black/20">
            <div className="flex items-center justify-between text-teal-300">
              <span className="text-xs font-semibold uppercase tracking-wider text-teal-300/70">Email Thu Thập (Leads)</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-900/40 text-teal-300">
                <Mail className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-extrabold text-white tracking-tight">
                {data?.summary?.total_subscribers?.toLocaleString('vi-VN') || 0}
              </span>
              <span className="ml-2 text-xs font-medium text-teal-300 bg-teal-950/80 border border-teal-800/40 px-2 py-0.5 rounded-md">
                +{data?.summary?.today_subscribers || 0} hôm nay
              </span>
            </div>
            <p className="mt-2 text-xs text-teal-200/60">
              Quiz: {data?.summary?.quiz_subscribers || 0} • Ebook: {data?.summary?.ebook_subscribers || 0} • Haven: {data?.summary?.somatic_subscribers || 0}
            </p>
          </div>

          {/* Card 5: Quiz-to-Lead Conversion Rate */}
          <div className="rounded-3xl border border-indigo-900/40 bg-gradient-to-b from-[#171926] to-[#10121d] p-5 shadow-lg shadow-black/20">
            <div className="flex items-center justify-between text-indigo-300">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300/70">Tỷ Lệ Tương Tác</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-900/40 text-indigo-300">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-extrabold text-white tracking-tight">
                {data?.summary?.total_page_views
                  ? ((data.summary.total_quiz_completions / data.summary.total_page_views) * 100).toFixed(1)
                  : '0'}%
              </span>
              <span className="ml-2 text-xs font-medium text-indigo-300 bg-indigo-950/80 border border-indigo-800/40 px-2 py-0.5 rounded-md">
                Quiz / Views
              </span>
            </div>
            <p className="mt-2 text-xs text-indigo-200/50">
              Trung bình cứ 4 người đọc bài viết thì có 1 người làm bài trắc nghiệm
            </p>
          </div>
        </div>

        {/* Daily Progression Chart */}
        <div className="mt-8 rounded-3xl border border-emerald-900/40 bg-[#111f1c] p-6 shadow-xl shadow-black/20">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-emerald-900/40 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-emerald-400" />
                Biểu Đồ Xu Hướng Truy Cập & Tương Tác Hàng Ngày
              </h2>
              <p className="text-xs text-emerald-300/60 mt-0.5">
                So sánh lượng người xem (Xanh lá) và số lượt hoàn thành trắc nghiệm (Vàng cam)
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs font-medium">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="h-3 w-3 rounded-sm bg-emerald-500"></span> Lượt xem trang
              </span>
              <span className="flex items-center gap-1.5 text-amber-400">
                <span className="h-3 w-3 rounded-sm bg-amber-500"></span> Làm Quiz
              </span>
              <span className="flex items-center gap-1.5 text-teal-300">
                <span className="h-3 w-3 rounded-sm bg-teal-400"></span> Email thu thập
              </span>
            </div>
          </div>

          {/* Bar Chart Container */}
          <div className="mt-6">
            <div className="flex h-56 items-end gap-2 sm:gap-4 pt-6 pb-2 px-2 border-b border-emerald-900/40">
              {data?.daily && data.daily.length > 0 ? (
                data.daily.map((dayItem, idx) => {
                  const viewHeight = Math.max(8, (dayItem.page_views / maxDailyViews) * 100);
                  const quizHeight = Math.max(4, (dayItem.quiz_completions / maxDailyViews) * 100);

                  return (
                    <div key={idx} className="group relative flex-1 flex items-end justify-center gap-1 h-full">
                      {/* Tooltip on Hover */}
                      <div className="pointer-events-none absolute -top-14 left-1/2 -translate-x-1/2 z-20 hidden rounded-xl border border-emerald-700/60 bg-[#081210] p-2 text-center text-xs shadow-xl group-hover:block whitespace-nowrap">
                        <p className="font-semibold text-white">{dayItem.day}</p>
                        <p className="text-emerald-400">👁️ {dayItem.page_views} xem ({dayItem.unique_visitors || dayItem.page_views} người)</p>
                        <p className="text-amber-400">🧪 {dayItem.quiz_completions} quiz</p>
                        {dayItem.leads > 0 && <p className="text-teal-300">💌 {dayItem.leads} email</p>}
                      </div>

                      {/* Bar 1: Page Views */}
                      <div
                        style={{ height: `${viewHeight}%` }}
                        className="w-full max-w-[18px] rounded-t-md bg-gradient-to-t from-emerald-700 to-emerald-400 transition-all group-hover:brightness-125"
                      ></div>

                      {/* Bar 2: Quiz Completions */}
                      <div
                        style={{ height: `${quizHeight}%` }}
                        className="w-full max-w-[18px] rounded-t-md bg-gradient-to-t from-amber-700 to-amber-400 transition-all group-hover:brightness-125"
                      ></div>
                    </div>
                  );
                })
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-emerald-400/50">
                  Chưa có dữ liệu thời gian trong khoảng đã chọn
                </div>
              )}
            </div>

            {/* Date Labels below chart */}
            <div className="flex justify-between px-2 pt-2 text-[11px] text-emerald-300/50">
              {data?.daily?.map((d, i) => (
                <span key={i} className="text-center truncate px-1">
                  {d.day.slice(5)}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mt-10 border-b border-emerald-900/40">
          <nav className="flex space-x-2 sm:space-x-8 overflow-x-auto pb-px">
            {[
              { id: 'subscribers', label: `💌 Danh Sách Email (${data?.subscribers?.length || 0})` },
              { id: 'ebooks', label: `📚 Cẩm Nang Ebook (${data?.summary?.total_ebook_downloads || 0} lượt tải)` },
              { id: 'articles', label: `📊 Bài Viết (${data?.articles?.length || 0})` },
              { id: 'static_pages', label: `🌐 Trang Tĩnh & Hubs Toàn Trang (${data?.static_pages?.length || 0})` },
              { id: 'quizzes', label: `🧪 Nhật Ký Quiz Gần Đây (${data?.recent_quizzes?.length || 0})` },
              { id: 'devices', label: `📱 Thiết Bị & Nguồn Đến` }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`py-3 px-1 text-sm font-semibold border-b-2 whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'border-emerald-400 text-emerald-300'
                    : 'border-transparent text-emerald-200/50 hover:text-white hover:border-emerald-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* TAB 1: SUBSCRIBERS TABLE */}
        {activeTab === 'subscribers' && (
          <div className="mt-6 rounded-3xl border border-emerald-900/40 bg-[#111f1c] p-5 shadow-xl shadow-black/20">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-5 border-b border-emerald-900/40">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-400/60" />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo email, tên bài viết, cẩm nang..."
                  value={searchEmail}
                  onChange={e => setSearchEmail(e.target.value)}
                  className="w-full rounded-xl border border-emerald-900/60 bg-[#0c1815] py-2 pl-10 pr-4 text-sm text-white placeholder-emerald-400/40 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                {/* Source Filter */}
                <select
                  value={filterSource}
                  onChange={e => setFilterSource(e.target.value)}
                  className="rounded-xl border border-emerald-900/60 bg-[#0c1815] px-3 py-2 text-emerald-300 focus:outline-none"
                >
                  <option value="all">Tất cả nguồn</option>
                  <option value="ebook">📚 Từ Cẩm nang Ebook (PDF Leads)</option>
                  <option value="quiz">Từ Quiz bài thuốc</option>
                  <option value="somatic">🌙 Từ Cẩm nang Chữa lành (Mindful Haven)</option>
                  <option value="newsletter">Từ Newsletter trang chủ</option>
                </select>

                {/* Locale Filter */}
                <select
                  value={filterLocale}
                  onChange={e => setFilterLocale(e.target.value)}
                  className="rounded-xl border border-emerald-900/60 bg-[#0c1815] px-3 py-2 text-emerald-300 focus:outline-none"
                >
                  <option value="all">Tất cả ngôn ngữ</option>
                  <option value="vi">Tiếng Việt (VI)</option>
                  <option value="en">Tiếng Anh (EN)</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-emerald-900/40 text-xs font-semibold uppercase tracking-wider text-emerald-300/70">
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">Email Độc Giả</th>
                    <th className="py-3 px-4">Nguồn Chuyển Đổi</th>
                    <th className="py-3 px-4 text-center">Ngôn Ngữ</th>
                    <th className="py-3 px-4">Thời Gian</th>
                    <th className="py-3 px-4 text-center">Trạng Thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-900/30">
                  {filteredSubscribers.length > 0 ? (
                    filteredSubscribers.map((sub, idx) => {
                      const isQuiz = sub.source.startsWith('safety_quiz_');
                      const isSomatic = sub.source.startsWith('somatic_haven_');
                      const isEbook = sub.source.includes('ebook');
                      const cleanSource = isQuiz
                        ? sub.source.replace('safety_quiz_', '')
                        : isSomatic
                        ? sub.source.replace('somatic_haven_', '')
                        : sub.source;

                      return (
                        <tr key={sub.id} className="hover:bg-emerald-950/20 transition-colors">
                          <td className="py-3.5 px-4 text-xs text-emerald-400/50 font-mono">{idx + 1}</td>
                          <td className="py-3.5 px-4 font-medium text-white flex items-center gap-2">
                            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-950 border border-emerald-800/40 text-emerald-400 text-xs">
                              @
                            </span>
                            {maskEmailStr(sub.email)}
                          </td>
                          <td className="py-3.5 px-4 text-xs">
                            {isQuiz ? (
                              <div className="flex items-center gap-1.5">
                                <span className="inline-flex items-center rounded-md bg-amber-950/60 border border-amber-800/40 px-2 py-0.5 text-[11px] font-medium text-amber-300">
                                  Quiz
                                </span>
                                <Link
                                  href={sub.locale === 'vi' ? `/vi/song-khoe/huong-dan/${cleanSource}` : `/en/wellness/guides/${cleanSource}`}
                                  target="_blank"
                                  className="text-emerald-300 hover:underline hover:text-white truncate max-w-xs inline-flex items-center gap-1"
                                >
                                  {cleanSource}
                                  <ExternalLink className="h-3 w-3 opacity-60" />
                                </Link>
                              </div>
                            ) : isSomatic ? (
                              <div className="flex items-center gap-1.5">
                                <span className="inline-flex items-center rounded-md bg-purple-950/60 border border-purple-800/40 px-2 py-0.5 text-[11px] font-medium text-purple-300">
                                  🌙 Chữa lành
                                </span>
                                <Link
                                  href={sub.locale === 'vi' ? `/vi/song-khoe/huong-dan/${cleanSource}` : `/en/wellness/guides/${cleanSource}`}
                                  target="_blank"
                                  className="text-indigo-300 hover:underline hover:text-white truncate max-w-xs inline-flex items-center gap-1"
                                >
                                  {cleanSource}
                                  <ExternalLink className="h-3 w-3 opacity-60" />
                                </Link>
                              </div>
                            ) : isEbook ? (
                              <div className="flex items-center gap-1.5">
                                <span className="inline-flex items-center rounded-md bg-emerald-950/80 border border-emerald-700/60 px-2 py-0.5 text-[11px] font-medium text-amber-300">
                                  📚 Ebook Lead
                                </span>
                                <span className="text-emerald-300 font-medium truncate max-w-xs">
                                  {sub.source === 'ebook_blood_sugar_pairings'
                                    ? 'Vol 1: Đường Huyết'
                                    : sub.source.includes('antioxidant')
                                    ? 'Vol 2: Chống Oxy Hóa'
                                    : sub.source === 'ebook_library_master'
                                    ? 'Thư Viện Ebook Tổng'
                                    : sub.source}
                                </span>
                              </div>
                            ) : (
                              <span className="inline-flex items-center rounded-md bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 text-[11px] font-medium text-emerald-300">
                                {cleanSource}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="rounded-md bg-[#0c1815] border border-emerald-900/60 px-2 py-0.5 text-xs font-mono uppercase text-emerald-400">
                              {sub.locale}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-xs text-emerald-200/60 whitespace-nowrap">
                            {new Date(sub.consented_at).toLocaleString('vi-VN')}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="inline-flex items-center rounded-full bg-emerald-950 border border-emerald-700/40 px-2.5 py-0.5 text-xs font-medium text-emerald-300">
                              Active
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-sm text-emerald-400/50">
                        Không tìm thấy email nào phù hợp với bộ lọc.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: EBOOK PERFORMANCE & DOWNLOADS */}
        {activeTab === 'ebooks' && (
          <div className="mt-6 space-y-6">
            {/* Top Stat Banner */}
            <div className="rounded-3xl border border-emerald-900/40 bg-gradient-to-br from-[#12241e] via-[#0f1d18] to-[#0a1512] p-6 shadow-xl shadow-black/20">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-emerald-950 border border-emerald-700/60 px-3 py-1 text-xs font-bold text-amber-300">
                    <BookOpen className="h-3.5 w-3.5 text-amber-300" />
                    <span>HEALTHCLUES · THỐNG KÊ CẨM NANG &amp; EBOOK Y SINH</span>
                  </div>
                  <h3 className="mt-2 text-xl font-bold text-white">
                    Hiệu Quả Tải Sách &amp; Thu Thập Leads Từ Ebook
                  </h3>
                  <p className="mt-1 text-xs text-emerald-200/70 max-w-2xl">
                    Thống kê lượt truy cập thư viện, số lượt đọc trực tiếp, tải file PDF về máy và số lượng độc giả để lại email nhận sách từ các chiến dịch Facebook Reels và bài viết.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    href="/vi/song-khoe/ebooks"
                    target="_blank"
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 transition shadow-md"
                  >
                    <BookOpen className="h-4 w-4 text-amber-300" />
                    <span>Xem Thư Viện Web (VI)</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                  <Link
                    href="/en/wellness/ebooks"
                    target="_blank"
                    className="inline-flex items-center gap-2 rounded-xl border border-emerald-800/60 bg-[#13251f] px-3.5 py-2.5 text-xs font-semibold text-emerald-300 hover:text-white hover:bg-emerald-900/40 transition"
                  >
                    <span>Web (EN)</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>

              {/* 4 Mini Cards */}
              <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-emerald-900/40">
                <div className="rounded-2xl border border-emerald-900/60 bg-[#0d1c17]/80 p-3.5">
                  <span className="text-[11px] font-semibold text-emerald-400/80">Tổng Lượt Tải Toàn Sách</span>
                  <div className="mt-1 text-2xl font-black text-white">
                    {(data?.summary?.total_ebook_downloads || 0).toLocaleString('vi-VN')}
                  </div>
                  <span className="text-[10px] text-amber-300">+{data?.summary?.today_ebook_downloads || 0} hôm nay</span>
                </div>
                <div className="rounded-2xl border border-emerald-900/60 bg-[#0d1c17]/80 p-3.5">
                  <span className="text-[11px] font-semibold text-emerald-400/80">Tải File PDF Trực Tiếp</span>
                  <div className="mt-1 text-2xl font-black text-emerald-300">
                    {(data?.summary?.ebook_direct_downloads || 0).toLocaleString('vi-VN')}
                  </div>
                  <span className="text-[10px] text-emerald-400/60">Không cần điền form</span>
                </div>
                <div className="rounded-2xl border border-emerald-900/60 bg-[#0d1c17]/80 p-3.5">
                  <span className="text-[11px] font-semibold text-emerald-400/80">Email Mở Khóa (Leads)</span>
                  <div className="mt-1 text-2xl font-black text-amber-300">
                    {(data?.summary?.ebook_subscribers || 0).toLocaleString('vi-VN')}
                  </div>
                  <span className="text-[10px] text-teal-300">Đã lưu vào danh sách newsletter</span>
                </div>
                <div className="rounded-2xl border border-emerald-900/60 bg-[#0d1c17]/80 p-3.5">
                  <span className="text-[11px] font-semibold text-emerald-400/80">Tỷ Lệ Để Lại Email</span>
                  <div className="mt-1 text-2xl font-black text-teal-300">
                    {data?.summary?.total_ebook_downloads && data.summary.total_ebook_downloads > 0
                      ? Math.round(((data.summary.ebook_subscribers || 0) / data.summary.total_ebook_downloads) * 100)
                      : 0}%
                  </div>
                  <span className="text-[10px] text-emerald-400/60">Leads / Tổng lượt tải</span>
                </div>
              </div>
            </div>

            {/* Table 1: Ebook Breakdown */}
            <div className="rounded-3xl border border-emerald-900/40 bg-[#111f1c] p-5 shadow-xl shadow-black/20">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-base font-bold text-white">Thống Kê Chi Tiết Từng Cuốn Cẩm Nang</h4>
                  <p className="text-xs text-emerald-300/60">Hiệu quả phân phối của từng tập trong kiến trúc HealthClues Food Pairing Engine</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-emerald-900/40 text-xs font-semibold uppercase tracking-wider text-emerald-300/70">
                      <th className="py-3 px-4">Tập &amp; Tên Cẩm Nang</th>
                      <th className="py-3 px-4 text-center">Trạng Thái</th>
                      <th className="py-3 px-4 text-right">Lượt Xem Trang</th>
                      <th className="py-3 px-4 text-right">Tổng Lượt Tải</th>
                      <th className="py-3 px-4 text-right">Tải Trực Tiếp</th>
                      <th className="py-3 px-4 text-right">Email Mở Khóa</th>
                      <th className="py-3 px-4 text-right">Tỷ Lệ Tải</th>
                      <th className="py-3 px-4 text-center">Xem Trang</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-900/30">
                    {data?.ebooks && data.ebooks.length > 0 ? (
                      data.ebooks.map((eb) => {
                        const isLive = eb.status === 'available';
                        const href =
                          eb.ebook_id === 'blood-sugar'
                            ? '/vi/song-khoe/ebooks/duong-huyet'
                            : eb.ebook_id === 'antioxidants'
                            ? '/vi/song-khoe/ebooks/chat-chong-oxy-hoa'
                            : '/vi/song-khoe/ebooks';

                        return (
                          <tr key={eb.ebook_id} className="hover:bg-emerald-950/20 transition-colors">
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2.5">
                                <span className="rounded-lg bg-emerald-950 border border-emerald-800/60 px-2 py-1 text-[11px] font-extrabold text-amber-300">
                                  {eb.volume}
                                </span>
                                <div>
                                  <span className="font-semibold text-white">{eb.title}</span>
                                  <span className="block text-[11px] text-emerald-400/50">{eb.ebook_id}</span>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              {isLive ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-950 border border-emerald-600/40 px-2.5 py-0.5 text-xs font-semibold text-emerald-300">
                                  <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                                  Đã phát hành
                                </span>
                              ) : (
                                <span className="inline-flex items-center rounded-full bg-amber-950/60 border border-amber-800/40 px-2.5 py-0.5 text-xs font-medium text-amber-300">
                                  Đang biên soạn
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-right font-medium text-emerald-300">
                              {eb.views.toLocaleString('vi-VN')}
                            </td>
                            <td className="py-3.5 px-4 text-right font-bold text-white">
                              {eb.total_downloads.toLocaleString('vi-VN')}
                            </td>
                            <td className="py-3.5 px-4 text-right text-emerald-400/90 text-xs">
                              {eb.direct_downloads}
                            </td>
                            <td className="py-3.5 px-4 text-right text-amber-300 font-medium text-xs">
                              {eb.unlock_downloads || eb.subscribers}
                            </td>
                            <td className="py-3.5 px-4 text-right font-semibold text-teal-300 text-xs">
                              {eb.download_rate}%
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <Link
                                href={href}
                                target="_blank"
                                className="inline-flex items-center gap-1 rounded-lg border border-emerald-900/60 bg-[#0c1815] px-2.5 py-1 text-xs font-medium text-emerald-300 hover:text-white hover:bg-emerald-900/40 transition"
                              >
                                <span>Mở xem</span>
                                <ExternalLink className="h-3 w-3 opacity-60" />
                              </Link>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-sm text-emerald-400/50">
                          Chưa có dữ liệu thống kê từng cuốn cẩm nang.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Table 2: Recent Ebook Activity Log */}
            <div className="rounded-3xl border border-emerald-900/40 bg-[#111f1c] p-5 shadow-xl shadow-black/20">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-base font-bold text-white">Nhật Ký Tải &amp; Mở Khóa Ebook Thời Gian Thực</h4>
                  <p className="text-xs text-emerald-300/60">50 lượt tải gần nhất trên toàn bộ website</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-emerald-900/40 text-xs font-semibold uppercase tracking-wider text-emerald-300/70">
                      <th className="py-3 px-4">Thời Gian</th>
                      <th className="py-3 px-4">Cẩm Nang</th>
                      <th className="py-3 px-4 text-center">Hình Thức Tải</th>
                      <th className="py-3 px-4">Nguồn Xuất Phát</th>
                      <th className="py-3 px-4 text-center">Ngôn Ngữ</th>
                      <th className="py-3 px-4 text-center">Thiết Bị</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-900/30">
                    {data?.recent_ebooks && data.recent_ebooks.length > 0 ? (
                      data.recent_ebooks.map((re) => {
                        const isUnlock = re.method === 'unlocked';

                        return (
                          <tr key={re.id} className="hover:bg-emerald-950/20 transition-colors">
                            <td className="py-3 px-4 text-xs text-emerald-300/60 whitespace-nowrap">
                              {new Date(re.created_at).toLocaleString('vi-VN')}
                            </td>
                            <td className="py-3 px-4 font-medium text-white">
                              {re.title}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {isUnlock ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-teal-950 border border-teal-700/60 px-2.5 py-0.5 text-xs font-semibold text-teal-300">
                                  <Mail className="h-3 w-3" />
                                  Đăng ký Email
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-950 border border-emerald-700/60 px-2.5 py-0.5 text-xs font-semibold text-emerald-300">
                                  <Download className="h-3 w-3" />
                                  Tải trực tiếp
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-xs text-emerald-400/80 font-mono">
                              {re.source}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="rounded-md bg-[#0c1815] border border-emerald-900/60 px-2 py-0.5 text-xs font-mono uppercase text-emerald-400">
                                {re.locale || 'vi'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center text-xs text-emerald-300/70">
                              {re.device_type === 'mobile' ? '📱 Mobile' : re.device_type === 'tablet' ? '📟 Tablet' : '💻 Desktop'}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-sm text-emerald-400/50">
                          Chưa có lượt tải ebook nào được ghi nhận gần đây.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ARTICLE PERFORMANCE */}
        {activeTab === 'articles' && (
          <div className="mt-6 rounded-3xl border border-emerald-900/40 bg-[#111f1c] p-5 shadow-xl shadow-black/20">
            <h3 className="text-base font-bold text-white mb-1">Hiệu Quả Từng Bài Viết Y Sinh & Chữa Lành</h3>
            <p className="text-xs text-emerald-300/60 mb-4">
              Xếp hạng theo lượt xem, tỷ lệ bắt đầu làm quiz, bỏ dở giữa chừng (dang dở), hoàn tất 100% và chuyển đổi tải app / email
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-emerald-900/40 text-xs font-semibold uppercase tracking-wider text-emerald-300/70">
                    <th className="py-3 px-4">Tên Bài Viết & Slug</th>
                    <th className="py-3 px-4 text-center">Ngôn Ngữ</th>
                    <th className="py-3 px-4 text-right">Lượt Xem (Views)</th>
                    <th className="py-3 px-4 text-right">Người Xem (UV)</th>
                    <th className="py-3 px-4 text-right">Bắt Đầu Quiz</th>
                    <th className="py-3 px-4 text-right">Xong 100%</th>
                    <th className="py-3 px-4 text-right">Dang Dở</th>
                    <th className="py-3 px-4 text-right">Click Tải App</th>
                    <th className="py-3 px-4 text-right">Email Thu Được</th>
                    <th className="py-3 px-4 text-right">Tỷ Lệ Bỏ Dở</th>
                    <th className="py-3 px-4 text-center">Liên Kết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-900/30">
                  {data?.articles && data.articles.length > 0 ? (
                    data.articles.map((art, idx) => {
                      const articleUrl =
                        art.locale === 'vi'
                          ? `/vi/song-khoe/huong-dan/${art.article_slug}`
                          : `/en/wellness/guides/${art.article_slug}`;
                      const starts = art.quiz_starts && art.quiz_starts > 0 ? art.quiz_starts : art.quiz_completions;
                      const dropOffs = art.quiz_drop_offs || 0;

                      return (
                        <tr key={idx} className="hover:bg-emerald-950/20 transition-colors">
                          <td className="py-3.5 px-4">
                            <p className="font-semibold text-white line-clamp-1 max-w-md">{art.title}</p>
                            <p className="text-xs text-emerald-400/50 font-mono truncate max-w-sm">{art.article_slug}</p>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="rounded-md bg-[#0c1815] border border-emerald-900/60 px-2 py-0.5 text-xs font-mono uppercase text-emerald-400">
                              {art.locale}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold text-white">{art.views}</td>
                          <td className="py-3.5 px-4 text-right font-semibold text-emerald-300">{art.unique_visitors || art.views}</td>
                          <td className="py-3.5 px-4 text-right font-bold text-indigo-300">{starts}</td>
                          <td className="py-3.5 px-4 text-right font-bold text-emerald-300">{art.quiz_completions}</td>
                          <td className="py-3.5 px-4 text-right font-bold text-amber-400">
                            {dropOffs > 0 ? `${dropOffs}` : '0'}
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold text-purple-300">{art.app_clicks || 0}</td>
                          <td className="py-3.5 px-4 text-right font-bold text-teal-300">{art.leads}</td>
                          <td className="py-3.5 px-4 text-right font-mono text-xs">
                            {dropOffs > 0 ? (
                              <span className="text-amber-400 font-semibold">{art.quiz_drop_off_rate ?? 0}%</span>
                            ) : (
                              <span className="text-emerald-400/70">0%</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <Link
                              href={articleUrl}
                              target="_blank"
                              className="inline-flex items-center gap-1 rounded-lg border border-emerald-800/40 bg-emerald-950/50 px-2.5 py-1 text-xs text-emerald-300 hover:bg-emerald-900 hover:text-white transition-all"
                            >
                              Xem <ExternalLink className="h-3 w-3" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={11} className="py-8 text-center text-sm text-emerald-400/50">
                        Chưa có dữ liệu bài viết
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: STATIC PAGES & HUBS */}
        {activeTab === 'static_pages' && (
          <div className="mt-6 rounded-3xl border border-emerald-900/40 bg-[#111f1c] p-5 shadow-xl shadow-black/20">
            <h3 className="text-base font-bold text-white mb-1">Lưu Lượng & Tương Tác Các Trang Tĩnh Toàn Trang Web</h3>
            <p className="text-xs text-emerald-300/60 mb-4">
              Theo dõi lượt truy cập, bắt đầu trắc nghiệm, bỏ dở và click tải app trên Trang chủ, Hub Chữa Lành, Công cụ y sinh...
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-emerald-900/40 text-xs font-semibold uppercase tracking-wider text-emerald-300/70">
                    <th className="py-3 px-4">Tên Trang & Đường Dẫn</th>
                    <th className="py-3 px-4 text-center">Ngôn Ngữ</th>
                    <th className="py-3 px-4 text-right">Lượt Xem (Views)</th>
                    <th className="py-3 px-4 text-right">Người Xem (UV)</th>
                    <th className="py-3 px-4 text-right">Bắt Đầu Quiz</th>
                    <th className="py-3 px-4 text-right">Xong 100%</th>
                    <th className="py-3 px-4 text-right">Dang Dở</th>
                    <th className="py-3 px-4 text-right">Click Tải App</th>
                    <th className="py-3 px-4 text-center">Liên Kết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-900/30">
                  {data?.static_pages && data.static_pages.length > 0 ? (
                    data.static_pages.map((sp, idx) => (
                      <tr key={idx} className="hover:bg-emerald-950/20 transition-colors">
                        <td className="py-3.5 px-4">
                          <p className="font-semibold text-white">{sp.title}</p>
                          <p className="text-xs text-emerald-400/50 font-mono truncate max-w-sm">{sp.path}</p>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="rounded-md bg-[#0c1815] border border-emerald-900/60 px-2 py-0.5 text-xs font-mono uppercase text-emerald-400">
                            {sp.locale}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-white">{sp.views}</td>
                        <td className="py-3.5 px-4 text-right font-semibold text-emerald-300">{sp.unique_visitors || sp.views}</td>
                        <td className="py-3.5 px-4 text-right font-bold text-indigo-300">{sp.quiz_starts}</td>
                        <td className="py-3.5 px-4 text-right font-bold text-emerald-300">{sp.quiz_completions}</td>
                        <td className="py-3.5 px-4 text-right font-bold text-amber-400">{sp.quiz_drop_offs}</td>
                        <td className="py-3.5 px-4 text-right font-bold text-purple-300">{sp.app_clicks}</td>
                        <td className="py-3.5 px-4 text-center">
                          <Link
                            href={sp.path}
                            target="_blank"
                            className="inline-flex items-center gap-1 rounded-lg border border-emerald-800/40 bg-emerald-950/50 px-2.5 py-1 text-xs text-emerald-300 hover:bg-emerald-900 hover:text-white transition-all"
                          >
                            Xem <ExternalLink className="h-3 w-3" />
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-sm text-emerald-400/50">
                        Chưa có dữ liệu trang tĩnh
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: RECENT QUIZ FEED */}
        {activeTab === 'quizzes' && (
          <div className="mt-6 rounded-3xl border border-emerald-900/40 bg-[#111f1c] p-5 shadow-xl shadow-black/20">
            <h3 className="text-base font-bold text-white mb-1">Nhật Ký 20 Lượt Làm Trắc Nghiệm Mới Nhất</h3>
            <p className="text-xs text-emerald-300/60 mb-4">
              Theo dõi kết quả sàng lọc y sinh học độc giả thực hiện trên các bài viết
            </p>

            <div className="space-y-3">
              {data?.recent_quizzes && data.recent_quizzes.length > 0 ? (
                data.recent_quizzes.map((quizItem, idx) => {
                  const verdict = quizItem.metadata?.verdict;
                  const isContra = verdict === 'contraindicated';
                  const isCaution = verdict === 'caution';
                  const sprout = quizItem.metadata?.sprout;

                  return (
                    <div
                      key={idx}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-emerald-900/40 bg-[#0c1815] p-4 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl font-bold ${
                            quizItem.event_type === 'quiz_started'
                              ? 'bg-indigo-950 text-indigo-400 border border-indigo-800/50'
                              : isContra
                              ? 'bg-rose-950 text-rose-400 border border-rose-800/40'
                              : isCaution
                              ? 'bg-amber-950 text-amber-400 border border-amber-800/40'
                              : 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'
                          }`}
                        >
                          {quizItem.event_type === 'quiz_started' ? '▶' : isContra ? '!' : isCaution ? '⚠' : '✓'}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-white text-sm">
                              {quizItem.article_slug || quizItem.path}
                            </p>
                            <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                              quizItem.event_type === 'quiz_started'
                                ? 'bg-indigo-950/80 border border-indigo-700/60 text-indigo-300'
                                : 'bg-emerald-950/80 border border-emerald-700/60 text-emerald-300'
                            }`}>
                              {quizItem.event_type === 'quiz_started' ? 'Bắt đầu làm' : 'Hoàn thành 100%'}
                            </span>
                          </div>
                          <p className="text-emerald-400/60 mt-0.5 text-xs">
                            {quizItem.event_type === 'quiz_started' ? (
                              <span>Độc giả vừa bấm làm câu hỏi đầu tiên • Loại quiz: <span className="text-indigo-300 font-mono">{quizItem.metadata?.quiz_type || 'safety_quiz'}</span></span>
                            ) : (
                              <>
                                Phán quyết: {isContra ? 'Có yếu tố chống chỉ định' : isCaution ? 'Cần thận trọng & giảm liều' : 'Phù hợp an toàn'}
                                {sprout && <span className="ml-2 text-indigo-300">• Đồng hành: {sprout}</span>}
                                {quizItem.metadata?.completion_seconds && (
                                  <span className="ml-2 font-mono">({quizItem.metadata.completion_seconds}s)</span>
                                )}
                              </>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-emerald-300/60">
                        <span className="rounded-md bg-emerald-950 px-2 py-0.5 font-mono uppercase text-emerald-400">
                          {quizItem.locale}
                        </span>
                        <span>{new Date(quizItem.created_at).toLocaleString('vi-VN')}</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-sm text-emerald-400/50">
                  Chưa ghi nhận lượt làm quiz nào trong khoảng thời gian này
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: DEVICES & REFERRERS */}
        {activeTab === 'devices' && (
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Devices breakdown */}
            <div className="rounded-3xl border border-emerald-900/40 bg-[#111f1c] p-5 shadow-xl shadow-black/20">
              <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-emerald-400" />
                Thiết Bị Người Dùng
              </h3>
              <p className="text-xs text-emerald-300/60 mb-6">
                Phân bố lượt truy cập theo loại thiết bị di động và máy tính
              </p>

              <div className="space-y-4">
                {data?.devices && data.devices.length > 0 ? (
                  data.devices.map((dev, idx) => {
                    const totalDev = data.devices.reduce((acc, d) => acc + Number(d.count), 0);
                    const pct = totalDev > 0 ? ((Number(dev.count) / totalDev) * 100).toFixed(1) : '0';

                    return (
                      <div key={idx}>
                        <div className="flex justify-between text-xs font-semibold mb-1 text-white">
                          <span className="capitalize flex items-center gap-1.5">
                            {dev.device === 'mobile' ? <Smartphone className="h-3.5 w-3.5" /> : <Monitor className="h-3.5 w-3.5" />}
                            {dev.device === 'mobile' ? 'Điện thoại di động' : dev.device === 'desktop' ? 'Máy tính để bàn' : 'Máy tính bảng'}
                          </span>
                          <span className="font-mono text-emerald-400">{dev.count} ({pct}%)</span>
                        </div>
                        <div className="h-2.5 w-full rounded-full bg-emerald-950/60 overflow-hidden">
                          <div
                            style={{ width: `${pct}%` }}
                            className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-teal-400"
                          ></div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-emerald-400/50">Chưa có dữ liệu thiết bị</p>
                )}
              </div>
            </div>

            {/* Referrers breakdown */}
            <div className="rounded-3xl border border-emerald-900/40 bg-[#111f1c] p-5 shadow-xl shadow-black/20">
              <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
                <Globe className="h-5 w-5 text-emerald-400" />
                Nguồn Truy Cập (Referrers)
              </h3>
              <p className="text-xs text-emerald-300/60 mb-6">
                Kênh giới thiệu người đọc đến các bài viết y sinh học
              </p>

              <div className="space-y-4">
                {data?.referrers && data.referrers.length > 0 ? (
                  data.referrers.map((ref, idx) => {
                    const totalRef = data.referrers.reduce((acc, r) => acc + Number(r.count), 0);
                    const pct = totalRef > 0 ? ((Number(ref.count) / totalRef) * 100).toFixed(1) : '0';

                    return (
                      <div key={idx}>
                        <div className="flex justify-between text-xs font-semibold mb-1 text-white">
                          <span>{ref.channel}</span>
                          <span className="font-mono text-amber-300">{ref.count} ({pct}%)</span>
                        </div>
                        <div className="h-2.5 w-full rounded-full bg-emerald-950/60 overflow-hidden">
                          <div
                            style={{ width: `${pct}%` }}
                            className="h-full rounded-full bg-gradient-to-r from-amber-600 to-amber-400"
                          ></div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-emerald-400/50">Chưa có dữ liệu nguồn</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Footer info */}
        <div className="mt-12 text-center text-xs text-emerald-400/40 border-t border-emerald-900/30 pt-6">
          <p>Botly Wellness Real-time Analytics System • Dữ liệu cập nhật lúc: {lastRefreshed.toLocaleTimeString('vi-VN')}</p>
        </div>
      </main>
    </div>
  );
}
