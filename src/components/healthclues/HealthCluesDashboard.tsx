'use client';

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore, type MouseEvent } from 'react';
import Link from 'next/link';
import { 
  Sparkles, Compass, Bookmark, CheckCircle2, Clock, 
  ExternalLink, RotateCcw, Award, Trash2, ArrowRight, 
  Check, Heart, Leaf, ShieldAlert
} from 'lucide-react';
import { discoveryTimeLabel, matchHealthCluesDiscoveries, type DiscoveryContent } from '@/data/healthclues-discoveries';
import { 
  deleteHealthCluesActivity, downloadHealthCluesProfile, getCloudSessionSnapshot, 
  loadHealthCluesActivity, parseCloudSessionSnapshot, recordHealthCluesActivity, 
  subscribeCloudSession, type CloudSession, type HealthCluesActivity 
} from '@/lib/wellness-cloud';
import type { HealthCluesProfile } from '@/lib/healthclues-quiz';
import { useHealthCluesLocale } from '@/components/healthclues/HealthCluesLocaleProvider';
import styles from './HealthCluesDashboard.module.css';

const reasonsVi: Record<string, string> = {
  not_enough_time: 'Chưa có đủ thời gian',
  ingredients_unavailable: 'Chưa có sẵn nguyên liệu',
  too_complicated: 'Hơi phức tạp đối với tôi',
  not_interested: 'Chưa thấy phù hợp lúc này',
  other: 'Lý do khác',
};

const reasonsEn: Record<string, string> = {
  not_enough_time: 'Not enough time',
  ingredients_unavailable: 'Ingredients unavailable',
  too_complicated: 'Too complicated',
  not_interested: 'Not interested right now',
  other: 'Other reason',
};

const reasons = [
  ['not_enough_time', 'Not enough time'],
  ['ingredients_unavailable', 'Ingredients unavailable'],
  ['too_complicated', 'Too complicated'],
  ['not_interested', 'Not interested'],
  ['other', 'Other'],
] as const;

type CheckInReason = typeof reasons[number][0];
type ReasonPrompt = { itemId: string; action: 'not_yet' | 'not_interested'; value: CheckInReason };

function isProfile(value: unknown): value is HealthCluesProfile {
  if (!value || typeof value !== 'object') return false;
  const row = value as Partial<HealthCluesProfile>;
  return typeof row.topic === 'string' && Array.isArray(row.contentPreferences) && typeof row.presentation === 'string' &&
    typeof row.comfortableActivityTime === 'string' && typeof row.refreshFrequency === 'string' && typeof row.twoWeekGoal === 'string';
}

export function HealthCluesDashboard() {
  const { locale, text } = useHealthCluesLocale();
  const rawSession = useSyncExternalStore(subscribeCloudSession, getCloudSessionSnapshot, () => '__server_pending__');
  const session = useMemo(() => parseCloudSessionSnapshot(rawSession === '__server_pending__' ? null : rawSession), [rawSession]);
  const sessionReady = rawSession !== '__server_pending__';

  const [profile, setProfile] = useState<HealthCluesProfile | null>(null);
  const [items, setItems] = useState<DiscoveryContent[]>([]);
  const [history, setHistory] = useState<HealthCluesActivity[]>([]);
  const [worldData, setWorldData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'discoveries' | 'profile' | 'history'>('discoveries');
  const [error, setError] = useState('');
  const [reasonFor, setReasonFor] = useState<ReasonPrompt | null>(null);
  const [message, setMessage] = useState('');

  const refresh = useCallback(async (current: CloudSession) => {
    setLoading(true);
    setError('');
    try {
      const [savedProfile, activity, response, worldResponse] = await Promise.all([
        downloadHealthCluesProfile(current).catch(() => null),
        loadHealthCluesActivity(current).catch(() => []),
        fetch('/api/healthclues/discoveries', { cache: 'no-store' }),
        fetch('/api/healthclues/world', {
          headers: current.access_token ? { Authorization: `Bearer ${current.access_token}` } : {},
          cache: 'no-store',
        }).catch(() => null),
      ]);

      const payload = await response.json();
      const worldJson = worldResponse && worldResponse.ok ? await worldResponse.json() : null;

      if (worldJson) {
        setWorldData(worldJson);
      }

      let activeProfile: HealthCluesProfile | null = null;
      if (isProfile(savedProfile)) {
        activeProfile = savedProfile;
      } else if (worldJson?.world) {
        // Fallback profile synthesized from world
        activeProfile = {
          topic: worldJson.branches?.[0]?.topic_key || 'sleep-better',
          twoWeekGoal: 'Xây dựng thói quen khoa học',
          contentPreferences: ['practical', 'articles', 'recipes'],
          presentation: 'Tóm tắt ngắn gọn',
          comfortableActivityTime: '10–15 phút',
          refreshFrequency: 'Hằng tuần',
          createdAt: new Date().toISOString(),
          safetyLevel: 'none',
        };
      }

      setProfile(activeProfile);
      setHistory(Array.isArray(activity) ? activity : []);
      setItems(Array.isArray(payload.items) ? payload.items : []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load your dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!session) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    queueMicrotask(() => { if (!cancelled) void refresh(session); });
    return () => { cancelled = true; };
  }, [session, refresh]);

  const recommendations = useMemo(() => {
    if (!profile) return items.slice(0, 4);
    const candidates = matchHealthCluesDiscoveries(profile, items);
    const latestById = new Map<string, HealthCluesActivity>();
    for (const event of history) if (!latestById.has(event.content_id)) latestById.set(event.content_id, event);
    const filtered = candidates.filter(item => !['tried', 'not_interested', 'skipped'].includes(latestById.get(item.id)?.action || ''));
    return filtered.length ? filtered.slice(0, 4) : items.slice(0, 4);
  }, [profile, items, history]);

  async function checkIn(item: DiscoveryContent, action: HealthCluesActivity['action'], reason: string | null = null) {
    if (!session) return;
    try {
      await recordHealthCluesActivity(item.id, action, reason, session);
      const next = await loadHealthCluesActivity(session);
      setHistory(next);
      setReasonFor(null);
      setMessage(
        action === 'tried'
          ? (locale === 'vi' ? 'Đã thêm vào lịch sử hoạt động!' : 'Added to your activity history.')
          : action === 'saved'
          ? (locale === 'vi' ? 'Đã lưu tài liệu để xem sau!' : 'Saved for later.')
          : (locale === 'vi' ? 'Hệ thống sẽ gợi ý tài liệu phù hợp hơn.' : 'We will suggest another reviewed resource.')
      );
      setTimeout(() => setMessage(''), 4000);
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : 'Could not save your check-in.');
    }
  }

  async function openDiscovery(event: MouseEvent<HTMLAnchorElement>, item: DiscoveryContent) {
    if (item.url.startsWith('http')) {
      void checkIn(item, 'viewed');
      return;
    }
    event.preventDefault();
    await checkIn(item, 'viewed');
    window.location.assign(item.url);
  }

  const isLoading = !sessionReady || Boolean(session && loading);
  const xpTotal = worldData?.xpTotal ?? 120;
  const activeHabitsCount = worldData?.wellnessPlan?.goals?.length ?? 6;
  const checkinsCount = worldData?.checkins?.length ?? 2;

  return (
    <main className={styles.dashboardShell}>
      <div className={styles.dashboardCard}>
        {/* Hero Header */}
        <div className={styles.heroHeader}>
          <span className={styles.eyebrow}>
            <Sparkles size={13} />
            <span>HealthClues · {locale === 'vi' ? 'Khám phá Sức khỏe' : 'Wellness Journey'}</span>
          </span>
          <h1 className={styles.heroTitle}>
            {locale === 'vi' ? 'Hồ sơ & Tài liệu Sức khỏe' : 'Your Wellness Discoveries'}
          </h1>
          <p className={styles.heroSubtitle}>
            {locale === 'vi'
              ? 'Không gian gợi ý tài liệu được kiểm duyệt dựa trên mục tiêu của bạn. HealthClues không thay thế chẩn đoán hay điều trị y khoa.'
              : 'A personal space for reviewed resources that match your interests. HealthClues does not diagnose or provide treatment.'}
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className={styles.emptyCard}>
            <div className={styles.emptyIcon}>⏳</div>
            <h2 className={styles.emptyTitle}>{locale === 'vi' ? 'Đang tải dữ liệu...' : 'Loading your dashboard…'}</h2>
            <p className={styles.emptyDesc}>{locale === 'vi' ? 'Vui lòng chờ trong giây lát.' : 'Please wait a moment.'}</p>
          </div>
        )}

        {/* Not Logged In or No Profile State */}
        {!isLoading && (!session || !profile) && (
          <div className={styles.emptyCard}>
            <div className={styles.emptyIcon}>🦉</div>
            <h2 className={styles.emptyTitle}>
              {locale === 'vi' ? 'Chào mừng bạn đến với HealthClues!' : 'Welcome to HealthClues!'}
            </h2>
            <p className={styles.emptyDesc}>
              {locale === 'vi'
                ? 'Hãy hoàn thành bài trắc nghiệm định hướng 2 phút để mở khóa kế hoạch sức khỏe riêng biệt, xây dựng thói quen và nhận tài liệu gợi ý độc quyền.'
                : 'Take the 2-minute wellness quiz to unlock personalized routines, evidence-backed guides, and your interactive world adventure.'}
            </p>
            <div className={styles.emptyActionsRow}>
              <Link className={styles.btnPrimary} href={`/${locale}/wellness/healthclues/quiz`}>
                <Sparkles size={14} />
                <span>{locale === 'vi' ? 'Làm bài trắc nghiệm (Quiz)' : 'Take the free quiz'}</span>
              </Link>
              <Link className={styles.btnSecondary} href={`/${locale}/wellness/healthclues/world`}>
                <Compass size={14} />
                <span>{locale === 'vi' ? 'Khám phá Thế giới Sức khỏe' : 'Explore Wellness World'}</span>
              </Link>
            </div>
          </div>
        )}

        {/* Active Player Dashboard Content */}
        {!isLoading && session && profile && (
          <>
            {/* Player RPG Status Bar */}
            <div className={styles.playerStatusBar}>
              <div className={styles.playerIdentity}>
                <div className={styles.avatarBadge}>🦉</div>
                <div className={styles.playerTitles}>
                  <span className={styles.playerName}>
                    {profile.topic === 'sleep-better' ? (locale === 'vi' ? 'Nhà Thám Hiểm Giấc Ngủ' : 'Sleep Explorer') : (locale === 'vi' ? 'Lữ Khách Sức Khỏe' : 'Wellness Wayfinder')}
                  </span>
                  <span className={styles.playerRank}>
                    {locale === 'vi' ? 'Cấp 1 · Thung lũng Giấc ngủ' : 'Level 1 · Sleep Valley'}
                  </span>
                </div>
              </div>
              <div className={styles.playerStatsRow}>
                <span className={styles.statChip}>
                  <Leaf size={12} className="text-emerald-400" />
                  <span><strong>{activeHabitsCount}</strong> {locale === 'vi' ? 'thói quen' : 'habits'}</span>
                </span>
                <span className={styles.statChip}>
                  <CheckCircle2 size={12} className="text-amber-400" />
                  <span><strong>{checkinsCount}/30</strong> {locale === 'vi' ? 'ngày đã ghi nhận' : 'days recorded'}</span>
                </span>
                <span className={styles.statChip}>
                  <Award size={12} className="text-amber-400" />
                  <span><strong>{xpTotal}</strong> EXP</span>
                </span>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className={styles.tabList} role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'discoveries'}
                className={`${styles.tabBtn} ${activeTab === 'discoveries' ? styles.tabBtnActive : ''}`}
                onClick={() => setActiveTab('discoveries')}
              >
                <Sparkles size={14} />
                <span>{locale === 'vi' ? `Gợi ý khám phá (${recommendations.length})` : `Discoveries (${recommendations.length})`}</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'profile'}
                className={`${styles.tabBtn} ${activeTab === 'profile' ? styles.tabBtnActive : ''}`}
                onClick={() => setActiveTab('profile')}
              >
                <Compass size={14} />
                <span>{locale === 'vi' ? 'Hồ sơ sức khỏe' : 'My Profile'}</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'history'}
                className={`${styles.tabBtn} ${activeTab === 'history' ? styles.tabBtnActive : ''}`}
                onClick={() => setActiveTab('history')}
              >
                <Clock size={14} />
                <span>{locale === 'vi' ? `Lịch sử (${history.length})` : `History (${history.length})`}</span>
              </button>
            </div>

            {/* TAB 1: Discoveries */}
            {activeTab === 'discoveries' && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-emerald-200">
                    {locale === 'vi'
                      ? 'Các tài liệu kiểm duyệt phù hợp với sở thích của bạn. Không tự động thay đổi nếu bạn chưa ghi nhận.'
                      : 'Reviewed recommendations tailored to your goals. The same recommendations stay until you check in.'}
                  </p>
                  <Link href={`/${locale}/wellness/healthclues/world#hc-journey`} className="text-xs font-bold text-amber-300 hover:underline inline-flex items-center gap-1">
                    <span>{locale === 'vi' ? 'Xem Hành trình của tôi' : 'View My Journey'}</span>
                    <ArrowRight size={12} />
                  </Link>
                </div>

                <div className={styles.discoveriesGrid}>
                  {recommendations.map(item => (
                    <article key={item.id} className={styles.discoveryCard}>
                      <div className={styles.cardHeaderRow}>
                        <span className={styles.contentTypeTag}>
                          {item.contentType === 'recipe'
                            ? (locale === 'vi' ? '🥗 Dinh dưỡng' : 'Food & recipe')
                            : item.contentType === 'activity'
                            ? (locale === 'vi' ? '🚶 Vận động' : 'Everyday activity')
                            : item.contentType === 'ebook'
                            ? (locale === 'vi' ? '📖 Hướng dẫn' : 'Reading guide')
                            : (locale === 'vi' ? '🔬 Khoa học' : 'Research')}
                        </span>
                        <span className={styles.timePill}>
                          <Clock size={12} />
                          <span>{discoveryTimeLabel(item)}</span>
                        </span>
                      </div>

                      <h3 className={styles.cardTitle}>{item.title}</h3>
                      <p className={styles.cardSummary}>{item.summary}</p>

                      {item.safetyNotes && (
                        <div className={styles.safetyAlert}>
                          <ShieldAlert size={13} className="inline mr-1 text-amber-300" />
                          <span><strong>{locale === 'vi' ? 'Lưu ý an toàn: ' : 'Safety note: '}</strong>{item.safetyNotes}</span>
                        </div>
                      )}

                      <div className={styles.cardActions}>
                        <a
                          href={item.url}
                          target={item.url.startsWith('http') ? '_blank' : undefined}
                          rel={item.url.startsWith('http') ? 'noreferrer' : undefined}
                          onClick={event => void openDiscovery(event, item)}
                          className={styles.btnPrimary}
                        >
                          <ExternalLink size={13} />
                          <span>{locale === 'vi' ? 'Khám phá ngay' : 'Explore'}</span>
                        </a>
                        <button
                          type="button"
                          onClick={() => void checkIn(item, 'saved')}
                          className={styles.btnSecondary}
                        >
                          <Bookmark size={13} />
                          <span>{locale === 'vi' ? 'Lưu lại' : 'Save'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => void checkIn(item, 'tried')}
                          className={styles.btnSecondary}
                        >
                          <Check size={13} />
                          <span>{locale === 'vi' ? 'Đã thử' : 'Tried'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setReasonFor({ itemId: item.id, action: 'not_yet', value: 'not_enough_time' })}
                          className={styles.btnSecondary}
                        >
                          <RotateCcw size={13} />
                          <span>{locale === 'vi' ? 'Đổi gợi ý khác' : 'Skip'}</span>
                        </button>
                      </div>

                      {reasonFor?.itemId === item.id && (
                        <div className="mt-2 rounded-xl bg-black/40 border border-amber-400/30 p-3 space-y-2">
                          <label className="text-xs font-semibold text-amber-200 block">
                            {locale === 'vi' ? 'Điều gì khiến gợi ý này chưa phù hợp?' : 'What made this hard to try?'}
                            <select
                              className="mt-1 w-full rounded-lg border border-white/20 bg-emerald-950/80 p-2 text-xs text-white"
                              value={reasonFor.value}
                              onChange={event => setReasonFor(curr => curr ? { ...curr, value: event.target.value as CheckInReason } : null)}
                            >
                              {reasons.map(([val]) => (
                                <option key={val} value={val}>
                                  {locale === 'vi' ? reasonsVi[val] || val : reasonsEn[val] || val}
                                </option>
                              ))}
                            </select>
                          </label>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => void checkIn(item, reasonFor.action, reasonFor.value)}
                              className={styles.btnPrimary}
                            >
                              {locale === 'vi' ? 'Xác nhận' : 'Save check-in'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setReasonFor(null)}
                              className={styles.btnSecondary}
                            >
                              {locale === 'vi' ? 'Hủy' : 'Cancel'}
                            </button>
                          </div>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 2: Profile */}
            {activeTab === 'profile' && (
              <div className="space-y-4">
                <dl className={styles.profileGrid}>
                  <div className={styles.profileItem}>
                    <dt>{locale === 'vi' ? 'Mục tiêu trọng tâm' : 'Topic'}</dt>
                    <dd>{profile.topic === 'sleep-better' ? (locale === 'vi' ? 'Giấc ngủ ngon & Thư giãn' : 'Better Sleep') : profile.topic}</dd>
                  </div>
                  <div className={styles.profileItem}>
                    <dt>{locale === 'vi' ? 'Mục tiêu 2 tuần' : 'Two-week focus'}</dt>
                    <dd>{profile.twoWeekGoal || (locale === 'vi' ? 'Duy trì thói quen đều đặn' : 'Daily momentum')}</dd>
                  </div>
                  <div className={styles.profileItem}>
                    <dt>{locale === 'vi' ? 'Định dạng yêu thích' : 'Format preference'}</dt>
                    <dd>{profile.presentation || (locale === 'vi' ? 'Tóm tắt ngắn gọn' : 'Bite-sized')}</dd>
                  </div>
                  <div className={styles.profileItem}>
                    <dt>{locale === 'vi' ? 'Thời gian mỗi lần' : 'Activity time'}</dt>
                    <dd>{profile.comfortableActivityTime || '10–15 phút'}</dd>
                  </div>
                  <div className={styles.profileItem}>
                    <dt>{locale === 'vi' ? 'Tần suất cập nhật' : 'Refresh preference'}</dt>
                    <dd>{profile.refreshFrequency || (locale === 'vi' ? 'Hằng tuần' : 'Weekly')}</dd>
                  </div>
                  <div className={styles.profileItem}>
                    <dt>{locale === 'vi' ? 'Sở thích nội dung' : 'Content preferences'}</dt>
                    <dd>{profile.contentPreferences?.join(', ') || (locale === 'vi' ? 'Dinh dưỡng, Vận động, Giấc ngủ' : 'Mixed resources')}</dd>
                  </div>
                </dl>

                <div className="flex flex-wrap gap-3 pt-2">
                  <Link href={`/${locale}/wellness/healthclues/quiz?view=profile`} className={styles.btnSecondary}>
                    <RotateCcw size={13} />
                    <span>{locale === 'vi' ? 'Làm lại trắc nghiệm định hướng' : 'Update quiz preferences'}</span>
                  </Link>
                  <Link href={`/${locale}/wellness/healthclues/world`} className={styles.btnPrimary}>
                    <Compass size={13} />
                    <span>{locale === 'vi' ? 'Vào Thế giới Sức khỏe' : 'Enter Wellness World'}</span>
                  </Link>
                </div>
              </div>
            )}

            {/* TAB 3: History */}
            {activeTab === 'history' && (
              <div className="space-y-4">
                {history.length === 0 ? (
                  <p className="text-xs text-slate-300 py-4 text-center">
                    {locale === 'vi' ? 'Chưa có lịch sử hoạt động. Hãy khám phá và lưu các tài liệu bên trên!' : 'No activity history yet. Start exploring resources above!'}
                  </p>
                ) : (
                  <div className={styles.historyList}>
                    {history.map(event => (
                      <div key={event.id} className={styles.historyItem}>
                        <div>
                          <strong className="text-slate-100 block">
                            {items.find(i => i.id === event.content_id)?.title || event.content_id}
                          </strong>
                          <span className={styles.historyAction}>
                            {event.action === 'tried'
                              ? (locale === 'vi' ? '✓ Đã thử nghiệm' : 'Tried')
                              : event.action === 'saved'
                              ? (locale === 'vi' ? '🔖 Đã lưu xem sau' : 'Saved')
                              : (locale === 'vi' ? '👁 Đã xem' : 'Viewed')}
                            {' · '}
                            {new Date(event.occurred_at).toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {history.length > 0 && (
                  <button
                    type="button"
                    className="text-xs text-rose-300 hover:text-rose-200 underline inline-flex items-center gap-1 pt-2"
                    onClick={async () => {
                      if (!session || !window.confirm(locale === 'vi' ? 'Xóa lịch sử khám phá?' : 'Delete history?')) return;
                      try {
                        await deleteHealthCluesActivity(session);
                        setHistory([]);
                        setMessage(locale === 'vi' ? 'Đã xóa lịch sử khám phá.' : 'History deleted.');
                      } catch (err) {
                        setMessage(err instanceof Error ? err.message : 'Error deleting history');
                      }
                    }}
                  >
                    <Trash2 size={12} />
                    <span>{locale === 'vi' ? 'Xóa lịch sử khám phá' : 'Clear activity history'}</span>
                  </button>
                )}
              </div>
            )}

            {/* Floating Toast Notification */}
            {message && (
              <div className="rounded-xl bg-emerald-900/90 border border-emerald-400 p-3 text-xs text-emerald-100 shadow-lg" role="status">
                {message}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
