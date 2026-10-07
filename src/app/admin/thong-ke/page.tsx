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
  BookOpen,
  ArrowUpRight,
  Radio,
  Layers,
  Tag,
  Moon,
  Activity,
  Zap
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

interface AppDownloadDailyRecord {
  day: string;
  total_clicks: number;
  unique_visitors: number;
  ios: number;
  android: number;
  desktop: number;
  from_ads: number;
  organic: number;
}

interface AppDownloadSourceRecord {
  campaign: string;
  source: string;
  medium: string;
  content: string;
  article_slug?: string | null;
  source_title: string;
  path: string;
  total_clicks: number;
  unique_visitors: number;
  ios: number;
  android: number;
  last_click_at: string;
}

interface AppDownloadRecentRecord {
  id: string;
  created_at_vn: string;
  platform: string;
  path: string;
  article_slug?: string | null;
  article_title: string;
  utm_campaign?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_content?: string | null;
  referrer_clean: string;
  referrer?: string | null;
  visitor_id?: string | null;
}

interface PatternBreakdownItem {
  pattern_key: string;
  label_vi: string;
  label_en: string;
  count: number;
  percentage: number;
  color: string;
  desc_vi: string;
}

interface IssueBreakdownItem {
  issue_key: string;
  label_vi: string;
  label_en: string;
  count: number;
  percentage: number;
}

interface GoalBreakdownItem {
  goal_key: string;
  label_vi: string;
  label_en: string;
  count: number;
  percentage: number;
}

interface SupportBreakdownItem {
  support_key: string;
  label_vi: string;
  label_en: string;
  count: number;
  percentage: number;
}

interface PostQuizFunnelItem {
  key: string;
  label_vi: string;
  label_en: string;
  count: number;
  conversion_rate: number;
  icon_name: string;
}

interface PostQuizPeriodData {
  period: 'today' | 'week' | 'month' | 'all';
  label_vi: string;
  completions: number;
  night_1_clicks: number;
  unique_night_1: number;
  night_1_rate: number;
  app_clicks: number;
  unique_app: number;
  app_rate: number;
  waitlist_signups: number;
  unique_waitlist: number;
  waitlist_rate: number;
  funnel: PostQuizFunnelItem[];
}

interface InsomniaQuizPayload {
  summary: {
    page_views: number;
    unique_visitors: number;
    today_views: number;
    today_unique_visitors: number;
    starts: number;
    today_starts: number;
    completions: number;
    today_completions: number;
    start_rate: number;
    completion_rate: number;
    night_1_clicks: number;
    today_night_1_clicks: number;
    night_1_rate: number;
    app_clicks: number;
    today_app_clicks: number;
    app_clicks_ios: number;
    app_clicks_android: number;
    app_download_rate: number;
    waitlist_signups: number;
    today_waitlist_signups: number;
    waitlist_rate: number;
    recommendation_clicks?: number;
    top_pattern?: string;
    top_pattern_label?: string;
    leads?: number;
    today_leads?: number;
    lead_rate?: number;
    avg_isi_score?: number;
  };
  step_waterfall: Array<{
    step: number;
    title_vi: string;
    title_en: string;
    count: number;
    reach_pct: number;
    dropoff_pct: number;
  }>;
  pattern_breakdown?: PatternBreakdownItem[];
  issues_breakdown?: IssueBreakdownItem[];
  goals_breakdown?: GoalBreakdownItem[];
  support_breakdown?: SupportBreakdownItem[];
  post_quiz_funnel?: PostQuizFunnelItem[];
  post_quiz_by_period?: Record<'today' | 'week' | 'month' | 'all', PostQuizPeriodData>;
  traffic_sources: Array<{
    source: string;
    campaign: string;
    medium: string;
    views: number;
    unique_visitors: number;
    starts: number;
    completions: number;
    night_1_clicks?: number;
    app_clicks: number;
    leads: number;
    last_active_at: string;
  }>;
  recent_submissions: Array<{
    id: string;
    created_at_vn: string;
    event_type: string;
    email?: string;
    isi_score?: number;
    night_pattern?: string;
    night_pattern_label?: string;
    secondary_pattern?: string;
    primary_goal?: string;
    primary_goal_label?: string;
    issues?: string[];
    issues_labels?: string[];
    sleep_support?: string;
    frequency?: string;
    duration?: string;
    sleep_hours?: string;
    device: string;
    platform?: string;
    source: string;
    clicked_night_1?: boolean;
    app_clicked: boolean;
    waitlist_signed?: boolean;
    pills_use?: string;
  }>;
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
  app_downloads_daily?: AppDownloadDailyRecord[];
  app_downloads_sources?: AppDownloadSourceRecord[];
  app_downloads_recent?: AppDownloadRecentRecord[];
  insomnia_quiz?: InsomniaQuizPayload;
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDays, setSelectedDays] = useState<number>(7);
  const [activeTab, setActiveTab] = useState<'app_downloads' | 'quiz_insomnia' | 'subscribers' | 'ebooks' | 'articles' | 'static_pages' | 'quizzes' | 'devices'>('app_downloads');

  // Search and filters for quiz insomnia
  const [quizSearch, setQuizSearch] = useState<string>('');
  const [quizFilterDevice, setQuizFilterDevice] = useState<string>('all');
  const [quizPatternFilter, setQuizPatternFilter] = useState<string>('all');
  const [quizSubTab, setQuizSubTab] = useState<'overview' | 'insights' | 'sources' | 'submissions'>('overview');
  const [postQuizPeriod, setPostQuizPeriod] = useState<'today' | 'week' | 'month' | 'all'>('all');

  // Search and filters for app downloads
  const [appSearchQuery, setAppSearchQuery] = useState<string>('');
  const [appFilterSource, setAppFilterSource] = useState<string>('all');
  const [appSubTab, setAppSubTab] = useState<'daily' | 'sources' | 'recent'>('daily');

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

  // Filtered app downloads daily
  const filteredAppDaily = useMemo(() => {
    if (!data?.app_downloads_daily) return [];
    return data.app_downloads_daily.filter(item => {
      const q = appSearchQuery.toLowerCase();
      const matchSearch = !q || item.day.includes(q);
      const matchSource =
        appFilterSource === 'all'
          ? true
          : appFilterSource === 'ads'
          ? item.from_ads > 0
          : appFilterSource === 'direct' || appFilterSource === 'facebook' || appFilterSource === 'zalo' || appFilterSource === 'article'
          ? item.organic > 0
          : true;
      return matchSearch && matchSource;
    });
  }, [data?.app_downloads_daily, appSearchQuery, appFilterSource]);

  // Filtered app downloads sources
  const filteredAppSources = useMemo(() => {
    if (!data?.app_downloads_sources) return [];
    return data.app_downloads_sources.filter(item => {
      const q = appSearchQuery.toLowerCase();
      const matchSearch =
        !q ||
        item.campaign.toLowerCase().includes(q) ||
        item.source.toLowerCase().includes(q) ||
        item.source_title.toLowerCase().includes(q) ||
        item.path.toLowerCase().includes(q);

      const matchSource =
        appFilterSource === 'all'
          ? true
          : appFilterSource === 'ads'
          ? item.medium === 'paid' || (item.campaign && !item.campaign.includes('Tự nhiên'))
          : appFilterSource === 'facebook'
          ? item.source.toLowerCase().includes('facebook') || item.source.toLowerCase().includes('fb')
          : appFilterSource === 'zalo'
          ? item.source.toLowerCase().includes('zalo')
          : appFilterSource === 'article'
          ? !!item.article_slug || item.path.includes('/guides') || item.path.includes('/huong-dan')
          : item.source.toLowerCase().includes('direct') || item.source.toLowerCase().includes('trực tiếp');

      return matchSearch && matchSource;
    });
  }, [data?.app_downloads_sources, appSearchQuery, appFilterSource]);

  // Filtered app downloads recent
  const filteredAppRecent = useMemo(() => {
    if (!data?.app_downloads_recent) return [];
    return data.app_downloads_recent.filter(item => {
      const q = appSearchQuery.toLowerCase();
      const matchSearch =
        !q ||
        (item.utm_campaign && item.utm_campaign.toLowerCase().includes(q)) ||
        (item.utm_source && item.utm_source.toLowerCase().includes(q)) ||
        item.article_title.toLowerCase().includes(q) ||
        item.path.toLowerCase().includes(q) ||
        item.referrer_clean.toLowerCase().includes(q);

      const matchSource =
        appFilterSource === 'all'
          ? true
          : appFilterSource === 'ads'
          ? item.utm_medium === 'paid' || !!item.utm_campaign
          : appFilterSource === 'facebook'
          ? item.referrer_clean.toLowerCase().includes('facebook') || (item.utm_source && item.utm_source.toLowerCase().includes('fb'))
          : appFilterSource === 'zalo'
          ? item.referrer_clean.toLowerCase().includes('zalo') || (item.utm_source && item.utm_source.toLowerCase().includes('zalo'))
          : appFilterSource === 'article'
          ? !!item.article_slug || item.path.includes('/guides') || item.path.includes('/huong-dan')
          : item.referrer_clean.toLowerCase().includes('direct');

      return matchSearch && matchSource;
    });
  }, [data?.app_downloads_recent, appSearchQuery, appFilterSource]);

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
    if (activeTab === 'app_downloads') {
      if (!data?.app_downloads_sources || data.app_downloads_sources.length === 0) return;
      const headers = ['Chiến dịch / Video', 'Kênh nguồn', 'Hình thức', 'Trang / Bài viết', 'Đường dẫn', 'Tổng Click', 'Khách thật (UV)', 'iOS', 'Android', 'Lần click cuối'];
      const rows = data.app_downloads_sources.map(s => [
        `"${s.campaign}"`,
        `"${s.source}"`,
        `"${s.medium}"`,
        `"${s.source_title.replace(/"/g, '""')}"`,
        `"${s.path}"`,
        s.total_clicks,
        s.unique_visitors,
        s.ios,
        s.android,
        `"${s.last_click_at}"`
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `botly-app-downloads-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

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
              {activeTab === 'app_downloads' ? 'Xuất Thống Kê Tải App (CSV)' : 'Xuất File Email (CSV)'}
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
          <div
            onClick={() => setActiveTab('app_downloads')}
            className="rounded-3xl border border-purple-900/40 bg-gradient-to-b from-[#1b1429] to-[#120d1c] p-5 shadow-lg shadow-black/20 cursor-pointer hover:border-purple-500/80 transition-all hover:scale-[1.02]"
            title="Bấm để xem chi tiết lượt tải theo ngày và nguồn link"
          >
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
              { id: 'app_downloads', label: `🚀 Lượt Tải App & Nguồn Link (${data?.summary?.total_app_clicks || 0})` },
              { id: 'quiz_insomnia', label: `🌙 Phễu Quiz Mất Ngủ (${data?.insomnia_quiz?.summary?.page_views || 0} views / ${data?.insomnia_quiz?.summary?.starts || 0} làm)` },
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
                    ? 'border-purple-400 text-purple-300'
                    : 'border-transparent text-emerald-200/50 hover:text-white hover:border-emerald-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* TAB 0: APP DOWNLOADS & SOURCES BREAKDOWN */}
        {activeTab === 'app_downloads' && (
          <div className="mt-6 space-y-6">
            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="rounded-3xl border border-purple-900/40 bg-gradient-to-b from-[#181126] to-[#0f0b18] p-5 shadow-lg shadow-black/20">
                <span className="text-xs text-purple-300/70 font-semibold uppercase tracking-wider">Tổng Click Tải App</span>
                <p className="mt-2 text-3xl font-extrabold text-white">
                  {data?.summary?.total_app_clicks?.toLocaleString('vi-VN') || 0}
                </p>
                <div className="mt-2 flex items-center justify-between text-[11px] text-purple-300/80 border-t border-purple-900/30 pt-2 font-medium">
                  <span>+{data?.summary?.today_app_clicks || 0} hôm nay</span>
                  <span className="text-purple-200/50">Toàn thời gian</span>
                </div>
              </div>

              <div className="rounded-3xl border border-purple-900/40 bg-gradient-to-b from-[#181126] to-[#0f0b18] p-5 shadow-lg shadow-black/20">
                <span className="text-xs text-purple-300/70 font-semibold uppercase tracking-wider">Tỷ Lệ Thiết Bị</span>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-xl font-extrabold text-white"> {data?.summary?.app_clicks_ios || 0}</span>
                  <span className="text-xs text-purple-300/60 font-semibold">iOS</span>
                  <span className="text-purple-500">•</span>
                  <span className="text-xl font-extrabold text-emerald-400">▶ {data?.summary?.app_clicks_android || 0}</span>
                  <span className="text-xs text-emerald-300/60 font-semibold">Android</span>
                </div>
                <div className="mt-2 flex items-center gap-1.5 text-[11px] text-purple-300/80 border-t border-purple-900/30 pt-2 font-medium">
                  <div className="w-full bg-purple-950/80 rounded-full h-1.5 flex overflow-hidden">
                    <div
                      className="bg-purple-400 h-full"
                      style={{ width: `${Math.round(((data?.summary?.app_clicks_ios || 0) / Math.max(data?.summary?.total_app_clicks || 1, 1)) * 100)}%` }}
                    />
                    <div
                      className="bg-emerald-400 h-full"
                      style={{ width: `${Math.round(((data?.summary?.app_clicks_android || 0) / Math.max(data?.summary?.total_app_clicks || 1, 1)) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-amber-900/40 bg-gradient-to-b from-[#211a14] to-[#14100c] p-5 shadow-lg shadow-black/20">
                <span className="text-xs text-amber-300/70 font-semibold uppercase tracking-wider">Từ Quảng Cáo Trả Phí</span>
                <p className="mt-2 text-3xl font-extrabold text-amber-400">
                  {data?.app_downloads_daily?.reduce((acc, cur) => acc + (cur.from_ads || 0), 0) || 0}
                </p>
                <div className="mt-2 flex items-center justify-between text-[11px] text-amber-300/80 border-t border-amber-900/30 pt-2 font-medium">
                  <span>Facebook Ads / UTM Paid</span>
                  <span>{Math.round(((data?.app_downloads_daily?.reduce((acc, cur) => acc + (cur.from_ads || 0), 0) || 0) / Math.max(data?.summary?.total_app_clicks || 1, 1)) * 100)}%</span>
                </div>
              </div>

              <div className="rounded-3xl border border-emerald-900/40 bg-gradient-to-b from-[#11221b] to-[#0a1712] p-5 shadow-lg shadow-black/20">
                <span className="text-xs text-emerald-300/70 font-semibold uppercase tracking-wider">Tự Nhiên & Mạng Xã Hội</span>
                <p className="mt-2 text-3xl font-extrabold text-emerald-400">
                  {data?.app_downloads_daily?.reduce((acc, cur) => acc + (cur.organic || 0), 0) || 0}
                </p>
                <div className="mt-2 flex items-center justify-between text-[11px] text-emerald-300/80 border-t border-emerald-900/30 pt-2 font-medium">
                  <span>Reels, Zalo, Direct, Bài viết</span>
                  <span>{Math.round(((data?.app_downloads_daily?.reduce((acc, cur) => acc + (cur.organic || 0), 0) || 0) / Math.max(data?.summary?.total_app_clicks || 1, 1)) * 100)}%</span>
                </div>
              </div>
            </div>

            {/* Main App Downloads Content Box */}
            <div className="rounded-3xl border border-purple-900/40 bg-[#120f1f] p-5 shadow-xl shadow-black/20">
              {/* Header with Sub-tabs & Search Filters */}
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-5 border-b border-purple-900/30">
                {/* Sub Tab Navigation Pills */}
                <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#090710] border border-purple-900/40 w-fit">
                  <button
                    onClick={() => setAppSubTab('daily')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      appSubTab === 'daily'
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'text-purple-300/60 hover:text-white hover:bg-purple-950/40'
                    }`}
                  >
                    📅 Theo Từng Ngày ({filteredAppDaily.length})
                  </button>
                  <button
                    onClick={() => setAppSubTab('sources')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      appSubTab === 'sources'
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'text-purple-300/60 hover:text-white hover:bg-purple-950/40'
                    }`}
                  >
                    🎯 Theo Nguồn & Bài Viết / Video ({filteredAppSources.length})
                  </button>
                  <button
                    onClick={() => setAppSubTab('recent')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      appSubTab === 'recent'
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'text-purple-300/60 hover:text-white hover:bg-purple-950/40'
                    }`}
                  >
                    ⏱️ Nhật Ký 100 Lượt Click ({filteredAppRecent.length})
                  </button>
                </div>

                {/* Filter and Search */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-purple-400/60" />
                    <input
                      type="text"
                      placeholder="Tìm chiến dịch, bài viết, ngày..."
                      value={appSearchQuery}
                      onChange={e => setAppSearchQuery(e.target.value)}
                      className="w-48 sm:w-60 rounded-xl border border-purple-900/60 bg-[#090710] py-1.5 pl-8 pr-3 text-xs text-white placeholder-purple-400/40 focus:border-purple-500 focus:outline-none"
                    />
                  </div>

                  <select
                    value={appFilterSource}
                    onChange={e => setAppFilterSource(e.target.value)}
                    className="rounded-xl border border-purple-900/60 bg-[#090710] px-3 py-1.5 text-xs text-purple-200 focus:outline-none"
                  >
                    <option value="all">Tất cả kênh nguồn</option>
                    <option value="ads">🎯 Từ Quảng cáo (Paid Ads)</option>
                    <option value="facebook">📱 Facebook (Tự nhiên / Reels)</option>
                    <option value="article">📰 Từ Bài viết Sống Khỏe (Guides)</option>
                    <option value="zalo">💬 Zalo</option>
                    <option value="direct">🔗 Trực tiếp (Direct)</option>
                  </select>
                </div>
              </div>

              {/* SUB-VIEW 1: DAILY TABLE */}
              {appSubTab === 'daily' && (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-purple-900/30 text-xs font-semibold uppercase tracking-wider text-purple-300/70">
                        <th className="py-3 px-4">Ngày (Giờ VN)</th>
                        <th className="py-3 px-4 text-center">Tổng Lượt Click</th>
                        <th className="py-3 px-4 text-center">Người Dùng Thực (UV)</th>
                        <th className="py-3 px-4 text-center"> iOS</th>
                        <th className="py-3 px-4 text-center">▶ Android</th>
                        <th className="py-3 px-4 text-center">💻 Máy Tính</th>
                        <th className="py-3 px-4 text-center">🎯 Quảng Cáo</th>
                        <th className="py-3 px-4 text-center">🌿 Tự Nhiên / MXH</th>
                        <th className="py-3 px-4">Phân Bổ Kênh</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-purple-900/20">
                      {filteredAppDaily.length > 0 ? (
                        filteredAppDaily.map(row => {
                          const isToday = row.day === new Date().toISOString().slice(0, 10);
                          const total = row.total_clicks || 1;
                          const adsPercent = Math.round(((row.from_ads || 0) / total) * 100);
                          const organicPercent = 100 - adsPercent;

                          return (
                            <tr key={row.day} className={`hover:bg-purple-950/20 transition-colors ${isToday ? 'bg-purple-950/10' : ''}`}>
                              <td className="py-3.5 px-4 font-mono font-medium text-white flex items-center gap-2">
                                <Calendar className="h-3.5 w-3.5 text-purple-400" />
                                <span>{row.day}</span>
                                {isToday && (
                                  <span className="rounded-md bg-purple-500/20 border border-purple-400/40 px-1.5 py-0.5 text-[10px] text-purple-300 font-sans font-bold">
                                    Hôm nay
                                  </span>
                                )}
                              </td>
                              <td className="py-3.5 px-4 text-center font-extrabold text-white">
                                {row.total_clicks}
                              </td>
                              <td className="py-3.5 px-4 text-center font-bold text-purple-300 font-mono">
                                {row.unique_visitors}
                              </td>
                              <td className="py-3.5 px-4 text-center text-purple-300 font-medium">
                                {row.ios > 0 ? (
                                  <span className="rounded-md bg-purple-950/80 border border-purple-800/40 px-2 py-0.5">
                                    {row.ios}
                                  </span>
                                ) : (
                                  <span className="text-purple-300/30">-</span>
                                )}
                              </td>
                              <td className="py-3.5 px-4 text-center text-emerald-400 font-medium">
                                {row.android > 0 ? (
                                  <span className="rounded-md bg-emerald-950/80 border border-emerald-800/40 px-2 py-0.5">
                                    {row.android}
                                  </span>
                                ) : (
                                  <span className="text-emerald-400/30">-</span>
                                )}
                              </td>
                              <td className="py-3.5 px-4 text-center text-sky-400 font-medium">
                                {row.desktop > 0 ? (
                                  <span className="rounded-md bg-sky-950/80 border border-sky-800/40 px-2 py-0.5">
                                    {row.desktop}
                                  </span>
                                ) : (
                                  <span className="text-sky-400/30">-</span>
                                )}
                              </td>
                              <td className="py-3.5 px-4 text-center">
                                {row.from_ads > 0 ? (
                                  <span className="rounded-md bg-amber-950/80 border border-amber-800/50 px-2 py-0.5 text-xs font-semibold text-amber-300">
                                    {row.from_ads}
                                  </span>
                                ) : (
                                  <span className="text-amber-300/30 text-xs">0</span>
                                )}
                              </td>
                              <td className="py-3.5 px-4 text-center">
                                {row.organic > 0 ? (
                                  <span className="rounded-md bg-emerald-950/80 border border-emerald-800/50 px-2 py-0.5 text-xs font-semibold text-emerald-300">
                                    {row.organic}
                                  </span>
                                ) : (
                                  <span className="text-emerald-300/30 text-xs">0</span>
                                )}
                              </td>
                              <td className="py-3.5 px-4">
                                <div className="flex flex-col gap-1 w-32">
                                  <div className="w-full bg-purple-950/80 rounded-full h-1.5 flex overflow-hidden">
                                    {row.from_ads > 0 && (
                                      <div className="bg-amber-400 h-full" style={{ width: `${adsPercent}%` }} />
                                    )}
                                    {row.organic > 0 && (
                                      <div className="bg-emerald-400 h-full" style={{ width: `${organicPercent}%` }} />
                                    )}
                                  </div>
                                  <span className="text-[10px] text-purple-300/60 font-mono">
                                    {row.from_ads > 0 ? `${adsPercent}% Ads` : ''} {row.organic > 0 ? `${organicPercent}% Tự nhiên` : ''}
                                  </span>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={9} className="py-8 text-center text-sm text-purple-300/50">
                            Chưa có dữ liệu lượt tải app trong khoảng thời gian này.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* SUB-VIEW 2: SOURCES & ARTICLES BREAKDOWN */}
              {appSubTab === 'sources' && (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-purple-900/30 text-xs font-semibold uppercase tracking-wider text-purple-300/70">
                        <th className="py-3 px-4">#</th>
                        <th className="py-3 px-4">Chiến Dịch / Mã Video</th>
                        <th className="py-3 px-4">Kênh Nguồn (Source)</th>
                        <th className="py-3 px-4">Trang / Bài Viết Đích</th>
                        <th className="py-3 px-4 text-center"> iOS</th>
                        <th className="py-3 px-4 text-center">▶ Android</th>
                        <th className="py-3 px-4 text-center">Khách Thật (UV)</th>
                        <th className="py-3 px-4 text-center">Tổng Click</th>
                        <th className="py-3 px-4">Lần Click Cuối</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-purple-900/20">
                      {filteredAppSources.length > 0 ? (
                        filteredAppSources.map((item, idx) => {
                          const isPaid = item.medium === 'paid' || (item.campaign && !item.campaign.includes('Tự nhiên'));
                          const isArticle = !!item.article_slug || item.path.includes('/guides') || item.path.includes('/huong-dan');

                          return (
                            <tr key={idx} className="hover:bg-purple-950/20 transition-colors">
                              <td className="py-3.5 px-4 text-xs text-purple-400/50 font-mono">{idx + 1}</td>
                              <td className="py-3.5 px-4 font-medium text-white">
                                {isPaid ? (
                                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-950/70 border border-amber-800/50 px-2.5 py-1 text-xs font-bold text-amber-300">
                                    <Tag className="h-3 w-3" />
                                    {item.campaign}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 rounded-lg bg-purple-950/60 border border-purple-800/40 px-2 py-1 text-xs text-purple-200">
                                    {item.campaign}
                                  </span>
                                )}
                              </td>
                              <td className="py-3.5 px-4 text-xs">
                                <div className="flex flex-col">
                                  <span className="font-semibold text-white capitalize">{item.source}</span>
                                  <span className="text-purple-300/50 text-[10px]">Medium: {item.medium}</span>
                                </div>
                              </td>
                              <td className="py-3.5 px-4 text-xs">
                                {isArticle ? (
                                  <Link
                                    href={item.path}
                                    target="_blank"
                                    className="group flex items-center gap-1.5 text-emerald-300 hover:text-white font-medium transition-colors"
                                  >
                                    <span className="max-w-[280px] truncate">{item.source_title}</span>
                                    <ArrowUpRight className="h-3 w-3 shrink-0 opacity-70 group-hover:opacity-100" />
                                  </Link>
                                ) : (
                                  <span className="text-purple-200 font-medium">
                                    {item.source_title}
                                  </span>
                                )}
                                <span className="block text-[10px] text-purple-300/40 font-mono mt-0.5">{item.path}</span>
                              </td>
                              <td className="py-3.5 px-4 text-center font-mono text-purple-300">
                                {item.ios > 0 ? (
                                  <span className="font-bold">{item.ios}</span>
                                ) : (
                                  <span className="text-purple-300/30">0</span>
                                )}
                              </td>
                              <td className="py-3.5 px-4 text-center font-mono text-emerald-400">
                                {item.android > 0 ? (
                                  <span className="font-bold">{item.android}</span>
                                ) : (
                                  <span className="text-emerald-400/30">0</span>
                                )}
                              </td>
                              <td className="py-3.5 px-4 text-center font-mono font-bold text-white">
                                {item.unique_visitors}
                              </td>
                              <td className="py-3.5 px-4 text-center">
                                <span className="rounded-lg bg-purple-950 border border-purple-800/50 px-2.5 py-1 text-sm font-extrabold text-white shadow-sm">
                                  {item.total_clicks}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-xs text-purple-300/70 font-mono">
                                {item.last_click_at}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={9} className="py-8 text-center text-sm text-purple-300/50">
                            Không tìm thấy nguồn tải phù hợp với bộ lọc.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* SUB-VIEW 3: RECENT 100 REALTIME CLICKS */}
              {appSubTab === 'recent' && (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-purple-900/30 text-xs font-semibold uppercase tracking-wider text-purple-300/70">
                        <th className="py-3 px-4">Thời Gian (Giờ VN)</th>
                        <th className="py-3 px-4 text-center">Thiết Bị</th>
                        <th className="py-3 px-4">Trang / Bài Viết Đích</th>
                        <th className="py-3 px-4">Mã Video / Chiến Dịch</th>
                        <th className="py-3 px-4">Kênh & Nguồn Đến</th>
                        <th className="py-3 px-4">Mã Khách (Visitor)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-purple-900/20">
                      {filteredAppRecent.length > 0 ? (
                        filteredAppRecent.map(item => {
                          const isIos = item.platform.toLowerCase().includes('ios');
                          const isAndroid = item.platform.toLowerCase().includes('android');
                          const isArticle = !!item.article_slug || item.path.includes('/guides') || item.path.includes('/huong-dan');

                          return (
                            <tr key={item.id} className="hover:bg-purple-950/20 transition-colors">
                              <td className="py-3 px-4 text-xs font-mono text-purple-200">
                                {item.created_at_vn}
                              </td>
                              <td className="py-3 px-4 text-center">
                                {isIos ? (
                                  <span className="inline-flex items-center gap-1 rounded-md bg-purple-950/90 border border-purple-700/50 px-2 py-0.5 text-xs font-semibold text-purple-300">
                                     iOS
                                  </span>
                                ) : isAndroid ? (
                                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-950/90 border border-emerald-700/50 px-2 py-0.5 text-xs font-semibold text-emerald-300">
                                    ▶ Android
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 rounded-md bg-sky-950/90 border border-sky-700/50 px-2 py-0.5 text-xs font-semibold text-sky-300">
                                    💻 Máy tính
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-xs">
                                {isArticle ? (
                                  <Link
                                    href={item.path}
                                    target="_blank"
                                    className="group flex items-center gap-1 text-emerald-300 hover:text-white font-medium"
                                  >
                                    <span className="max-w-[240px] truncate">{item.article_title}</span>
                                    <ArrowUpRight className="h-3 w-3 shrink-0 opacity-70 group-hover:opacity-100" />
                                  </Link>
                                ) : (
                                  <span className="text-white font-medium">{item.article_title}</span>
                                )}
                                <span className="block text-[10px] text-purple-300/40 font-mono">{item.path}</span>
                              </td>
                              <td className="py-3 px-4 text-xs">
                                {item.utm_campaign ? (
                                  <span className="rounded bg-amber-950/80 border border-amber-800/40 px-2 py-0.5 font-bold text-amber-300">
                                    {item.utm_campaign}
                                  </span>
                                ) : (
                                  <span className="text-purple-300/40 italic">Tự nhiên</span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-xs">
                                <div className="flex flex-col">
                                  <span className="font-semibold text-white">
                                    {item.referrer_clean}
                                    {item.utm_source ? ` (${item.utm_source})` : ''}
                                  </span>
                                  {item.referrer && (
                                    <span className="text-[10px] text-purple-300/40 max-w-[200px] truncate font-mono" title={item.referrer}>
                                      {item.referrer}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-4 text-xs font-mono text-purple-300/50">
                                {item.visitor_id ? `${item.visitor_id.slice(0, 14)}...` : '-'}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-sm text-purple-300/50">
                            Không có nhật ký click phù hợp.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: QUIZ INSOMNIA DETAILED FUNNEL */}
        {activeTab === 'quiz_insomnia' && (
          <div className="mt-6 space-y-6">
            {/* Funnel Header Banner */}
            <div className="rounded-3xl border border-purple-900/40 bg-gradient-to-r from-[#170e28] via-[#121324] to-[#0c1815] p-6 shadow-xl relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-purple-950/80 border border-purple-800/50 px-3 py-1 text-xs font-semibold text-purple-300 mb-2">
                    <Moon className="h-3.5 w-3.5 text-amber-400" />
                    <span>PHỄU CHUYỂN ĐỔI CHUYÊN BIỆT · NIGHT PATTERN & CLINICAL QUIZ</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white">
                    Thống Kê Chi Tiết Phễu Đánh Giá Mẫu Hình Giấc Ngủ (Night Pattern Quiz)
                  </h3>
                  <p className="text-xs sm:text-sm text-purple-200/70 mt-1 max-w-2xl leading-relaxed">
                    Theo dõi toàn diện tỷ lệ bắt đầu, độ rơi rụng qua 17 bước, nhận diện 6 mẫu hình giấc ngủ y sinh, tỷ lệ trải nghiệm âm thanh Đêm 1 (Night Companion), tải ứng dụng Soulscape và đăng ký Waitlist.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href="/admin/night-companion"
                    target="_blank"
                    className="inline-flex items-center gap-2 rounded-xl border border-teal-800/60 bg-teal-950/60 px-4 py-2.5 text-xs font-bold text-teal-300 hover:bg-teal-900/50 transition-all shadow-lg"
                  >
                    <span>Báo Cáo Phễu 7 Đêm & Player</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                  <Link
                    href="/quiz-insomnia"
                    target="_blank"
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:opacity-95 transition-all shadow-lg shadow-purple-950/40"
                  >
                    <span>Mở Trang Quiz Trực Tiếp</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>

            {/* 8 Key Performance Metric Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
              {/* Card 1: Views */}
              <div className="rounded-3xl border border-purple-900/40 bg-[#121124] p-4 shadow-lg shadow-black/20">
                <div className="flex items-center justify-between text-purple-300/70">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Xem Quiz</span>
                  <Eye className="h-4 w-4 text-purple-400" />
                </div>
                <p className="mt-2 text-2xl font-extrabold text-white">
                  {data?.insomnia_quiz?.summary?.page_views?.toLocaleString('vi-VN') || 0}
                </p>
                <div className="mt-2 flex items-center justify-between text-[11px] text-purple-300/80 border-t border-purple-900/30 pt-2 font-medium">
                  <span>+{data?.insomnia_quiz?.summary?.today_views || 0} hôm nay</span>
                  <span className="text-purple-400 font-semibold">{data?.insomnia_quiz?.summary?.unique_visitors || 0} UV</span>
                </div>
              </div>

              {/* Card 2: Starts */}
              <div className="rounded-3xl border border-indigo-900/40 bg-[#101328] p-4 shadow-lg shadow-black/20">
                <div className="flex items-center justify-between text-indigo-300/70">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Bắt Đầu Làm</span>
                  <Activity className="h-4 w-4 text-indigo-400" />
                </div>
                <p className="mt-2 text-2xl font-extrabold text-indigo-200">
                  {data?.insomnia_quiz?.summary?.starts?.toLocaleString('vi-VN') || 0}
                </p>
                <div className="mt-2 flex items-center justify-between text-[11px] text-indigo-300/80 border-t border-indigo-900/30 pt-2 font-medium">
                  <span>+{data?.insomnia_quiz?.summary?.today_starts || 0} hôm nay</span>
                  <span className="text-indigo-400 font-semibold">{data?.insomnia_quiz?.summary?.start_rate || 0}% click</span>
                </div>
              </div>

              {/* Card 3: Completions */}
              <div className="rounded-3xl border border-teal-900/40 bg-[#0e1922] p-4 shadow-lg shadow-black/20">
                <div className="flex items-center justify-between text-teal-300/70">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Hoàn Tất 100%</span>
                  <CheckCircle2 className="h-4 w-4 text-teal-400" />
                </div>
                <p className="mt-2 text-2xl font-extrabold text-teal-300">
                  {data?.insomnia_quiz?.summary?.completions?.toLocaleString('vi-VN') || 0}
                </p>
                <div className="mt-2 flex items-center justify-between text-[11px] text-teal-300/80 border-t border-teal-900/30 pt-2 font-medium">
                  <span>+{data?.insomnia_quiz?.summary?.today_completions || 0} hôm nay</span>
                  <span className="text-teal-400 font-semibold">{data?.insomnia_quiz?.summary?.completion_rate || 0}% xong</span>
                </div>
              </div>

              {/* Card 4: Top Pattern */}
              <div className="rounded-3xl border border-purple-900/40 bg-[#19102b] p-4 shadow-lg shadow-black/20">
                <div className="flex items-center justify-between text-purple-300/70">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Mẫu Hình Đêm</span>
                  <Moon className="h-4 w-4 text-amber-400" />
                </div>
                <p className="mt-2 text-base font-extrabold text-white truncate" title={data?.insomnia_quiz?.summary?.top_pattern_label || 'Tâm Trí Bận Rộn'}>
                  {data?.insomnia_quiz?.summary?.top_pattern_label || 'Tâm Trí Bận Rộn'}
                </p>
                <div className="mt-2 flex items-center justify-between text-[11px] text-purple-300/80 border-t border-purple-900/30 pt-2 font-medium">
                  <span>Phổ biến nhất</span>
                  <span className="text-amber-400 font-mono font-semibold">{data?.insomnia_quiz?.summary?.top_pattern || 'RACING_MIND'}</span>
                </div>
              </div>

              {/* Card 5: Night 1 Clicks */}
              <div className="rounded-3xl border border-cyan-900/40 bg-[#0c1a24] p-4 shadow-lg shadow-black/20">
                <div className="flex items-center justify-between text-cyan-300/70">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Vào Đêm 1</span>
                  <Sparkles className="h-4 w-4 text-cyan-400" />
                </div>
                <p className="mt-2 text-2xl font-extrabold text-cyan-300">
                  {data?.insomnia_quiz?.summary?.night_1_clicks?.toLocaleString('vi-VN') || 0}
                </p>
                <div className="mt-2 flex items-center justify-between text-[11px] text-cyan-300/80 border-t border-cyan-900/30 pt-2 font-medium">
                  <span>+{data?.insomnia_quiz?.summary?.today_night_1_clicks || 0} hôm nay</span>
                  <span className="text-cyan-400 font-semibold">{data?.insomnia_quiz?.summary?.night_1_rate || 0}% CVR</span>
                </div>
              </div>

              {/* Card 6: App Clicks */}
              <div className="rounded-3xl border border-emerald-900/40 bg-[#0d1a16] p-4 shadow-lg shadow-black/20">
                <div className="flex items-center justify-between text-emerald-300/70">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Tải App</span>
                  <Download className="h-4 w-4 text-emerald-400" />
                </div>
                <p className="mt-2 text-2xl font-extrabold text-emerald-300">
                  {data?.insomnia_quiz?.summary?.app_clicks?.toLocaleString('vi-VN') || 0}
                </p>
                <div className="mt-2 flex items-center justify-between text-[11px] text-emerald-300/80 border-t border-emerald-900/30 pt-2 font-medium">
                  <span>iOS: {data?.insomnia_quiz?.summary?.app_clicks_ios || 0}</span>
                  <span className="text-emerald-400 font-semibold">{data?.insomnia_quiz?.summary?.app_download_rate || 0}% CVR</span>
                </div>
              </div>

              {/* Card 7: Waitlist */}
              <div className="rounded-3xl border border-pink-900/40 bg-[#1d1020] p-4 shadow-lg shadow-black/20">
                <div className="flex items-center justify-between text-pink-300/70">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Waitlist</span>
                  <Mail className="h-4 w-4 text-pink-400" />
                </div>
                <p className="mt-2 text-2xl font-extrabold text-pink-300">
                  {data?.insomnia_quiz?.summary?.waitlist_signups?.toLocaleString('vi-VN') || 0}
                </p>
                <div className="mt-2 flex items-center justify-between text-[11px] text-pink-300/80 border-t border-pink-900/30 pt-2 font-medium">
                  <span>+{data?.insomnia_quiz?.summary?.today_waitlist_signups || 0} hôm nay</span>
                  <span className="text-pink-400 font-semibold">{data?.insomnia_quiz?.summary?.waitlist_rate || 0}% CVR</span>
                </div>
              </div>

              {/* Card 8: Funnel Retention */}
              <div className="rounded-3xl border border-amber-900/40 bg-[#1d1610] p-4 shadow-lg shadow-black/20">
                <div className="flex items-center justify-between text-amber-300/70">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Tỷ Lệ Giữ Chân</span>
                  <TrendingUp className="h-4 w-4 text-amber-400" />
                </div>
                <p className="mt-2 text-2xl font-extrabold text-amber-300 font-mono">
                  {data?.insomnia_quiz?.summary?.completion_rate || 0}%
                </p>
                <div className="mt-2 flex items-center justify-between text-[11px] text-amber-300/80 border-t border-amber-900/30 pt-2 font-medium">
                  <span>Phễu 17 bước</span>
                  <span className="text-amber-400 font-semibold">Tối ưu tốt</span>
                </div>
              </div>
            </div>

            {/* Sub-tabs Selector */}
            <div className="flex items-center justify-between border-b border-purple-900/40 pb-3">
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'overview', label: '📊 Phễu 17 Bước & Hành Vi Sau Quiz' },
                  { id: 'insights', label: '🧠 Mẫu Hình Đêm & Vấn Đề Giấc Ngủ' },
                  { id: 'sources', label: `🌐 Nguồn & Link Video (${data?.insomnia_quiz?.traffic_sources?.length || 0})` },
                  { id: 'submissions', label: `📋 Nhật Ký Người Làm Quiz (${data?.insomnia_quiz?.recent_submissions?.length || 0})` }
                ].map(sub => (
                  <button
                    key={sub.id}
                    onClick={() => setQuizSubTab(sub.id as typeof quizSubTab)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      quizSubTab === sub.id
                        ? 'bg-purple-950 border border-purple-700/60 text-purple-200 shadow-sm'
                        : 'text-slate-400 hover:text-white bg-slate-900/40 border border-slate-800/40'
                    }`}
                  >
                    {sub.label}
                  </button>
                ))}
              </div>
            </div>

            {/* SUB-VIEW 1: OVERVIEW & POST-QUIZ FUNNEL */}
            {quizSubTab === 'overview' && (
              <div className="space-y-6">
                {/* Post-Quiz Actions Funnel Cards */}
                <div className="rounded-3xl border border-purple-900/40 bg-[#111322] p-5 shadow-xl shadow-black/20">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <div>
                      <h4 className="text-base font-bold text-white flex items-center gap-2">
                        <Zap className="h-5 w-5 text-amber-400" />
                        Phễu Chuyển Đổi Sau Khi Nhận Kết Quả (Post-Quiz Actions)
                      </h4>
                      <p className="text-xs text-purple-300/60 mt-0.5">
                        Theo dõi hành vi thực tế của độc giả sau khi xem kết quả mẫu hình và phác đồ cá nhân hóa
                      </p>
                    </div>

                    {/* Timeframe Filter Buttons */}
                    <div className="flex items-center gap-1 bg-[#0a0c16] border border-purple-900/50 p-1 rounded-2xl shrink-0 self-start sm:self-auto">
                      {[
                        { id: 'today', label: 'Hôm nay (24h)', icon: '⚡' },
                        { id: 'week', label: '7 ngày qua', icon: '🗓️' },
                        { id: 'month', label: '30 ngày qua', icon: '📆' },
                        { id: 'all', label: 'Toàn thời gian', icon: '🌐' }
                      ].map(tab => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setPostQuizPeriod(tab.id as typeof postQuizPeriod)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            postQuizPeriod === tab.id
                              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-950/50'
                              : 'text-purple-300/60 hover:text-purple-200 hover:bg-purple-950/40'
                          }`}
                        >
                          <span className="text-[11px]">{tab.icon}</span>
                          <span>{tab.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {(() => {
                    const periodData = data?.insomnia_quiz?.post_quiz_by_period?.[postQuizPeriod];
                    const activeFunnel = periodData?.funnel || data?.insomnia_quiz?.post_quiz_funnel || [];

                    return (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                          {activeFunnel.map((item, idx) => (
                            <div
                              key={idx}
                              className="rounded-2xl border border-purple-950 bg-[#0d0f1c] p-4 hover:border-purple-800/50 transition-all"
                            >
                              <div className="flex items-center justify-between text-xs text-slate-400">
                                <span className="font-semibold">{item.label_en}</span>
                                <span className="text-purple-400 font-mono font-bold">{item.conversion_rate}% CVR</span>
                              </div>
                              <p className="mt-1 text-sm font-bold text-white">{item.label_vi}</p>
                              <p className="mt-3 text-2xl font-extrabold text-purple-300 font-mono">
                                {item.count.toLocaleString('vi-VN')} <span className="text-xs text-slate-400 font-normal">lượt</span>
                              </p>
                              <div className="mt-3 h-2 w-full rounded-full bg-slate-900 overflow-hidden">
                                <div
                                  style={{ width: `${Math.min(100, Math.max(item.conversion_rate, 4))}%` }}
                                  className="h-full rounded-full bg-gradient-to-r from-purple-600 via-indigo-500 to-teal-400"
                                />
                              </div>
                            </div>
                          ))}
                        </div>

                        {periodData && (
                          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 rounded-xl bg-purple-950/30 border border-purple-900/30 text-xs text-purple-300/70">
                            <span className="flex items-center gap-1.5 font-medium">
                              <span>📌 Khung thời gian:</span>
                              <strong className="text-purple-200">{periodData.label_vi}</strong>
                            </span>
                            <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono">
                              <span>Hoàn tất: <strong className="text-white">{periodData.completions}</strong></span>
                              <span>·</span>
                              <span>Đêm 1: <strong className="text-purple-300">{periodData.night_1_clicks}</strong> ({periodData.unique_night_1} UV)</span>
                              <span>·</span>
                              <span>Tải App: <strong className="text-teal-300">{periodData.app_clicks}</strong> ({periodData.unique_app} UV)</span>
                              <span>·</span>
                              <span>Waitlist: <strong className="text-pink-300">{periodData.waitlist_signups}</strong></span>
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>

                {/* Step-by-Step 17 Waterfall */}
                <div className="rounded-3xl border border-purple-900/40 bg-[#111322] p-5 shadow-xl shadow-black/20">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-base font-bold text-white flex items-center gap-2">
                        <Layers className="h-5 w-5 text-purple-400" />
                        Phễu Rơi Rụng Từng Bước (17 Steps Waterfall)
                      </h4>
                      <p className="text-xs text-purple-300/60 mt-0.5">
                        Theo dõi từng câu hỏi trắc nghiệm để phát hiện chính xác vị trí độc giả thoát ra nhiều nhất
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {data?.insomnia_quiz?.step_waterfall && data.insomnia_quiz.step_waterfall.length > 0 ? (
                      data.insomnia_quiz.step_waterfall.map((stepItem, idx) => {
                        const isHighDrop = stepItem.dropoff_pct > 25 && idx > 0;
                        return (
                          <div
                            key={idx}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-2xl border border-purple-950 bg-[#0d0f1c] hover:border-purple-800/50 transition-all text-xs"
                          >
                            <div className="flex items-center gap-3 sm:w-1/3">
                              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-purple-950 border border-purple-800/40 text-[10px] font-mono font-bold text-purple-300">
                                {stepItem.step}
                              </span>
                              <div>
                                <p className="font-semibold text-white truncate max-w-xs">{stepItem.title_vi}</p>
                                <p className="text-[10px] text-slate-400 font-mono">{stepItem.title_en}</p>
                              </div>
                            </div>

                            {/* Progress bar */}
                            <div className="flex-1 px-2">
                              <div className="h-3 w-full rounded-full bg-slate-900/80 border border-purple-950 overflow-hidden relative">
                                <div
                                  style={{ width: `${Math.max(stepItem.reach_pct, stepItem.count > 0 ? 5 : 0)}%` }}
                                  className="h-full rounded-full bg-gradient-to-r from-purple-600 via-indigo-500 to-teal-400 transition-all duration-500"
                                />
                              </div>
                            </div>

                            {/* Numbers */}
                            <div className="flex items-center justify-between sm:justify-end gap-4 sm:w-1/4 text-right">
                              <div>
                                <span className="font-bold text-white font-mono">{stepItem.count} lượt</span>
                                <span className="block text-[10px] text-purple-400/80 font-mono">{stepItem.reach_pct}% tiếp cận</span>
                              </div>
                              {idx > 0 && (
                                <div className="w-16">
                                  <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold font-mono ${isHighDrop ? 'bg-rose-950 text-rose-300 border border-rose-800/40' : 'bg-slate-800/60 text-slate-400'}`}>
                                    -{stepItem.dropoff_pct}%
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="py-8 text-center text-sm text-slate-500">
                        Chưa có dữ liệu bước làm quiz
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* SUB-VIEW 2: INSIGHTS & NIGHT PATTERNS BREAKDOWN */}
            {quizSubTab === 'insights' && (
              <div className="space-y-6">
                {/* Row 1: Night Patterns Distribution & Top Sleep Issues */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Pattern Breakdown */}
                  <div className="rounded-3xl border border-purple-900/40 bg-[#111322] p-5 shadow-xl shadow-black/20">
                    <h4 className="text-base font-bold text-white mb-1 flex items-center gap-2">
                      <Moon className="h-5 w-5 text-indigo-400" />
                      Phân Bổ 6 Mẫu Hình Giấc Ngủ (Night Patterns Distribution)
                    </h4>
                    <p className="text-xs text-purple-300/60 mb-4">
                      Tỷ lệ phần trăm độc giả được chuẩn đoán theo từng nhóm phản ứng thần kinh ban đêm
                    </p>

                    <div className="space-y-3">
                      {data?.insomnia_quiz?.pattern_breakdown?.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-2xl border border-purple-950 bg-[#0d0f1c] hover:border-purple-800/50 transition-all"
                        >
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <div className="flex items-center gap-2">
                              <span
                                className="h-2.5 w-2.5 rounded-full"
                                style={{ backgroundColor: item.color }}
                              />
                              <span className="font-bold text-white">{item.label_vi}</span>
                              <span className="text-[10px] text-slate-400 font-mono">({item.label_en})</span>
                            </div>
                            <span className="font-bold font-mono text-purple-300">
                              {item.count} ca ({item.percentage}%)
                            </span>
                          </div>

                          <div className="h-2 w-full rounded-full bg-slate-900 overflow-hidden mb-2">
                            <div
                              style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                              className="h-full rounded-full transition-all duration-500"
                            />
                          </div>

                          <p className="text-[11px] text-slate-400 leading-relaxed">
                            {item.desc_vi}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Top Sleep Issues */}
                  <div className="rounded-3xl border border-purple-900/40 bg-[#111322] p-5 shadow-xl shadow-black/20">
                    <h4 className="text-base font-bold text-white mb-1 flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-amber-400" />
                      Top Vấn Đề Giấc Ngủ Độc Giả Gặp Phải (Reported Issues)
                    </h4>
                    <p className="text-xs text-purple-300/60 mb-4">
                      Các triệu chứng cản trở giấc ngủ được người dùng tick chọn nhiều nhất tại bước 2
                    </p>

                    <div className="space-y-2.5">
                      {data?.insomnia_quiz?.issues_breakdown?.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 rounded-2xl border border-purple-950 bg-[#0d0f1c] text-xs hover:border-purple-800/50 transition-all"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-lg bg-amber-950/60 border border-amber-800/40 text-[10px] font-mono font-bold text-amber-300">
                              #{idx + 1}
                            </span>
                            <div>
                              <p className="font-semibold text-white">{item.label_vi}</p>
                              <p className="text-[10px] text-slate-400 font-mono">{item.label_en}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 text-right">
                            <div className="w-24 h-2 rounded-full bg-slate-900 overflow-hidden hidden sm:block">
                              <div
                                style={{ width: `${Math.max(item.percentage, 5)}%` }}
                                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-rose-400"
                              />
                            </div>
                            <span className="font-bold text-white font-mono">{item.count} lượt</span>
                            <span className="text-[11px] text-amber-300 font-mono font-bold w-12">{item.percentage}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Row 2: Goals & Support */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Primary Goals */}
                  <div className="rounded-3xl border border-purple-900/40 bg-[#111322] p-5 shadow-xl shadow-black/20">
                    <h4 className="text-base font-bold text-white mb-1 flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-teal-400" />
                      Mục Tiêu Ưu Tiên Hàng Đầu Của Độc Giả (Primary Goals)
                    </h4>
                    <p className="text-xs text-purple-300/60 mb-4">
                      Kết quả độc giả mong muốn đạt được nhất khi hoàn thành trắc nghiệm
                    </p>

                    <div className="space-y-2.5">
                      {data?.insomnia_quiz?.goals_breakdown?.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 rounded-2xl border border-purple-950 bg-[#0d0f1c] text-xs hover:border-purple-800/50 transition-all"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-lg bg-teal-950/60 border border-teal-800/40 text-[10px] font-mono font-bold text-teal-300">
                              #{idx + 1}
                            </span>
                            <p className="font-semibold text-white">{item.label_vi}</p>
                          </div>

                          <div className="flex items-center gap-3 text-right">
                            <span className="font-bold text-white font-mono">{item.count} ca</span>
                            <span className="text-[11px] text-teal-300 font-mono font-bold w-12">{item.percentage}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Sleep Support & Pills */}
                  <div className="rounded-3xl border border-purple-900/40 bg-[#111322] p-5 shadow-xl shadow-black/20">
                    <h4 className="text-base font-bold text-white mb-1 flex items-center gap-2">
                      <Activity className="h-5 w-5 text-rose-400" />
                      Thói Quen Dùng Thuốc Ngủ & Hỗ Trợ (Sleep Aids & Pills)
                    </h4>
                    <p className="text-xs text-purple-300/60 mb-4">
                      Mức độ phụ thuộc vào thuốc kê đơn, melatonin hoặc thảo dược hỗ trợ ngủ
                    </p>

                    <div className="space-y-2.5">
                      {data?.insomnia_quiz?.support_breakdown?.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 rounded-2xl border border-purple-950 bg-[#0d0f1c] text-xs hover:border-purple-800/50 transition-all"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-lg bg-purple-950 border border-purple-800/40 text-[10px] font-mono font-bold text-purple-300">
                              #{idx + 1}
                            </span>
                            <p className="font-semibold text-white">{item.label_vi}</p>
                          </div>

                          <div className="flex items-center gap-3 text-right">
                            <span className="font-bold text-white font-mono">{item.count} ca</span>
                            <span className="text-[11px] text-purple-300 font-mono font-bold w-12">{item.percentage}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SUB-VIEW 3: TRAFFIC SOURCES & VIDEO CAMPAIGNS */}
            {quizSubTab === 'sources' && (
              <div className="rounded-3xl border border-purple-900/40 bg-[#111322] p-5 shadow-xl shadow-black/20">
                <h4 className="text-base font-bold text-white mb-1 flex items-center gap-2">
                  <Globe className="h-5 w-5 text-indigo-400" />
                  Nguồn Lưu Lượng Truy Cập Vào Quiz (Video / TikTok / Ads / Direct)
                </h4>
                <p className="text-xs text-purple-300/60 mb-4">
                  Phân tích xem độc giả đến từ link video nào, chiến dịch quảng cáo nào và tỷ lệ hoàn tất cũng như chuyển đổi tải app
                </p>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-purple-900/40 text-xs font-semibold uppercase tracking-wider text-purple-300/70">
                        <th className="py-3 px-4">Kênh & Nguồn (Source)</th>
                        <th className="py-3 px-4">Chiến Dịch / Link Video</th>
                        <th className="py-3 px-4 text-right">Lượt Xem (Views)</th>
                        <th className="py-3 px-4 text-right">Người Xem (UV)</th>
                        <th className="py-3 px-4 text-right">Bắt Đầu (Starts)</th>
                        <th className="py-3 px-4 text-right">Hoàn Tất (Done)</th>
                        <th className="py-3 px-4 text-right">Vào Đêm 1</th>
                        <th className="py-3 px-4 text-right">Tải App (Clicks)</th>
                        <th className="py-3 px-4 text-right">Hoạt Động Gần Nhất</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-purple-950">
                      {data?.insomnia_quiz?.traffic_sources && data.insomnia_quiz.traffic_sources.length > 0 ? (
                        data.insomnia_quiz.traffic_sources.map((src, i) => (
                          <tr key={i} className="hover:bg-purple-950/20 transition-colors">
                            <td className="py-3.5 px-4">
                              <span className="font-bold text-white">{src.source}</span>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="rounded-md bg-purple-950/70 border border-purple-800/40 px-2 py-0.5 text-xs font-mono text-purple-300">
                                {src.campaign}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right font-bold text-white font-mono">{src.views}</td>
                            <td className="py-3.5 px-4 text-right font-semibold text-purple-300 font-mono">{src.unique_visitors}</td>
                            <td className="py-3.5 px-4 text-right font-bold text-indigo-300 font-mono">{src.starts}</td>
                            <td className="py-3.5 px-4 text-right font-bold text-teal-300 font-mono">{src.completions}</td>
                            <td className="py-3.5 px-4 text-right font-bold text-cyan-300 font-mono">{src.night_1_clicks || 0}</td>
                            <td className="py-3.5 px-4 text-right font-bold text-emerald-300 font-mono">{src.app_clicks}</td>
                            <td className="py-3.5 px-4 text-right text-xs text-slate-400 font-mono">{src.last_active_at || '-'}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={9} className="py-8 text-center text-sm text-purple-400/50">
                            Chưa có dữ liệu nguồn truy cập
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SUB-VIEW 4: RECENT SUBMISSIONS FEED */}
            {quizSubTab === 'submissions' && (
              <div className="rounded-3xl border border-purple-900/40 bg-[#111322] p-5 shadow-xl shadow-black/20">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-purple-900/40">
                  <div>
                    <h4 className="text-base font-bold text-white flex items-center gap-2">
                      <Mail className="h-5 w-5 text-pink-400" />
                      Nhật Ký Chi Tiết Người Làm Quiz Thời Gian Thực
                    </h4>
                    <p className="text-xs text-purple-300/60 mt-0.5">
                      Xem danh sách các ca hoàn tất trắc nghiệm, mẫu hình được phân tích và hành vi tiếp theo
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Pattern Filter */}
                    <select
                      value={quizPatternFilter}
                      onChange={e => setQuizPatternFilter(e.target.value)}
                      className="px-3 py-1.5 rounded-xl border border-purple-900/60 bg-[#0d0f1c] text-xs text-purple-200 focus:outline-none focus:border-purple-500"
                    >
                      <option value="all">Tất cả mẫu hình ({data?.insomnia_quiz?.recent_submissions?.length || 0})</option>
                      <option value="RACING_MIND">Tâm Trí Bận Rộn (RACING_MIND)</option>
                      <option value="SLEEP_ANXIETY">Lo Âu Trước Giờ Ngủ (SLEEP_ANXIETY)</option>
                      <option value="STRESS_CARRYOVER">Căng Thẳng Kéo Dài (STRESS_CARRYOVER)</option>
                      <option value="BEDTIME_PROCRASTINATION">Trì Hoãn Giờ Ngủ (BEDTIME_PROCRASTINATION)</option>
                      <option value="NIGHT_WAKING">Thức Giấc Nửa Đêm (NIGHT_WAKING)</option>
                      <option value="SLEEP_RHYTHM">Lệch Nhịp Sinh Học (SLEEP_RHYTHM)</option>
                    </select>

                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-purple-400/60" />
                      <input
                        type="text"
                        placeholder="Tìm kiếm..."
                        value={quizSearch}
                        onChange={e => setQuizSearch(e.target.value)}
                        className="pl-9 pr-3 py-1.5 rounded-xl border border-purple-900/60 bg-[#0d0f1c] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {data?.insomnia_quiz?.recent_submissions && data.insomnia_quiz.recent_submissions.length > 0 ? (
                    data.insomnia_quiz.recent_submissions
                      .filter(item => {
                        const matchPattern = quizPatternFilter === 'all' || item.night_pattern === quizPatternFilter;
                        const q = quizSearch.toLowerCase();
                        const matchSearch =
                          !q ||
                          item.email?.toLowerCase().includes(q) ||
                          item.source?.toLowerCase().includes(q) ||
                          item.night_pattern_label?.toLowerCase().includes(q) ||
                          item.primary_goal_label?.toLowerCase().includes(q);
                        return matchPattern && matchSearch;
                      })
                      .map((sub, idx) => (
                        <div
                          key={idx}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border border-purple-950 bg-[#0c0e1a] hover:border-purple-800/50 transition-all text-xs"
                        >
                          <div className="flex items-start sm:items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-950/80 border border-purple-800/50 text-purple-300 font-mono font-bold text-xs text-center px-1">
                              {sub.night_pattern?.slice(0, 4)}
                            </div>
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-bold text-white text-sm">
                                  {sub.night_pattern_label || sub.night_pattern}
                                </span>
                                {sub.clicked_night_1 && (
                                  <span className="rounded-md bg-cyan-950 border border-cyan-700/60 px-2 py-0.5 text-[10px] font-bold text-cyan-300">
                                    🌙 Đã Vào Đêm 1
                                  </span>
                                )}
                                {sub.app_clicked && (
                                  <span className="rounded-md bg-emerald-950 border border-emerald-700/60 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                                    🚀 Đã Bấm Tải App
                                  </span>
                                )}
                                {sub.waitlist_signed && (
                                  <span className="rounded-md bg-pink-950 border border-pink-700/60 px-2 py-0.5 text-[10px] font-bold text-pink-300">
                                    💌 Đăng Ký Waitlist
                                  </span>
                                )}
                              </div>

                              <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px] text-slate-400">
                                {sub.primary_goal_label && (
                                  <span>Mục tiêu: <strong className="text-teal-300">{sub.primary_goal_label}</strong> • </span>
                                )}
                                <span>Thiết bị: <strong className="text-slate-200">{sub.device}</strong></span>
                                <span>•</span>
                                <span>Nguồn: <strong className="text-purple-300">{sub.source || 'Direct'}</strong></span>
                                {sub.sleep_support && (
                                  <>
                                    <span>•</span>
                                    <span>Hỗ trợ: <strong className="text-amber-300">{sub.sleep_support}</strong></span>
                                  </>
                                )}
                              </div>

                              {sub.issues_labels && sub.issues_labels.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                  {sub.issues_labels.map((issue, i) => (
                                    <span key={i} className="rounded-lg bg-slate-900 border border-purple-900/40 px-2 py-0.5 text-[10px] text-purple-200/80">
                                      {issue}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="text-right text-[11px] text-purple-300/60 font-mono shrink-0">
                            {sub.created_at_vn}
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="py-8 text-center text-sm text-purple-400/50">
                      Chưa có lượt gửi kết quả quiz nào
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

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
