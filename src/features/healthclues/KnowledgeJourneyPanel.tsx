"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { 
  BookOpen, 
  CheckCircle2, 
  Gamepad2, 
  LibraryBig, 
  Sparkles, 
  Star,
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  Trash2,
  FlaskConical
} from "lucide-react";
import { HealthCluesAdventurer } from "@/components/healthclues/HealthCluesAdventurer";
import { HealthCluesGameIcon } from "@/components/healthclues/HealthCluesGameIcon";
import { useHealthCluesLocale } from "@/components/healthclues/HealthCluesLocaleProvider";
import { 
  BOTANICAL_ARTICLES, 
  type BotanicalArticle 
} from "@/data/healthclues-botanical-library";
import { BotanicalArticleModal } from "@/components/healthclues/BotanicalArticleModal";
import { getHealthCluesSkillLevel, HEALTHCLUES_SKILL_LEVELS } from "./knowledge-skill-progress";

type Clue = {
  clue_id: string; version: number; topic_key: string; chapter_id: string; title: string; content: string;
  source_references: Array<{ label: string; url: string }>;
  related_catalog_ids: string[]; question_prompt: string | null; question_options: Array<{ id: string; label: string }>;
  review_due_at: string | null;
  demoOnly?: boolean;
};

type KnowledgePayload = {
  world: { id: string; localDate: string; topicKey: string } | null;
  featured: Clue | null;
  featuredDiscovered?: boolean;
  book: Array<Clue & { discoveryId: string; localDate: string; discoveredAt: string; attempts: Array<{ selected_option_id: string; is_correct: boolean }> }>;
  bookmarks?: string[];
  bookmarkedArticles?: BotanicalArticle[];
  skills?: Record<string, number>;
  completedGames?: string[];
  demoGamesEnabled?: boolean;
  emptyReason?: string;
  emptyReasonVi?: string;
  error?: string;
};

const skillRows = [
  { id: "health_knowledge", labelEn: "Health Knowledge", labelVi: "Kiến thức Sức khỏe", gameIcon: "know:detective" },
  { id: "natural_nutrition", labelEn: "Natural & Nutrition", labelVi: "Tự nhiên & Dinh dưỡng", gameIcon: "know:garden" },
  { id: "movement", labelEn: "Movement", labelVi: "Vận động", gameIcon: "know:movement" },
  { id: "mind_sleep", labelEn: "Mind & Sleep", labelVi: "Tâm trí & Giấc ngủ", gameIcon: "know:mind" },
] as const;

const games = [
  { id: "evidence-detective-v1", title: "Evidence Detective", skill: "Health Knowledge", values: ["clue", "lab-only", "limits"], questions: [{ prompt: "One person's story is best treated as…", options: [{ id: "clue", label: "A clue about one experience" }, { id: "proof", label: "Proof for everyone" }] }, { prompt: "A laboratory observation alone establishes…", options: [{ id: "lab-only", label: "A result in the lab setting" }, { id: "people", label: "A proven result in people" }] }, { prompt: "A careful summary should…", options: [{ id: "limits", label: "State what is not yet known" }, { id: "certainty", label: "Remove all uncertainty" }] }] },
  { id: "garden-sort-v1", title: "Garden of Questions", skill: "Natural & Nutrition", values: ["general-info", "source-trail", "separate-questions"], questions: [{ prompt: "A food description can provide…", options: [{ id: "general-info", label: "General information about the food" }, { id: "guarantee", label: "A guaranteed personal outcome" }] }, { prompt: "A source link helps a player…", options: [{ id: "source-trail", label: "Follow where information came from" }, { id: "proof", label: "Assume every claim is proven" }] }, { prompt: "Keep these questions separate…", options: [{ id: "separate-questions", label: "What it is, what evidence says, and personal fit" }, { id: "one-question", label: "Treat them all as the same question" }] }] },
  { id: "movement-trail-v1", title: "Movement Trail", skill: "Movement", values: ["different-paces", "personal-choice", "ask-support"], questions: [{ prompt: "People's movement abilities and preferences…", options: [{ id: "different-paces", label: "Can differ from person to person" }, { id: "same-pace", label: "Are always identical" }] }, { prompt: "A wellness game should leave room for…", options: [{ id: "personal-choice", label: "Personal choice" }, { id: "prescription", label: "A one-size-fits-all instruction" }] }, { prompt: "If personal suitability is uncertain…", options: [{ id: "ask-support", label: "Seek appropriate individual guidance" }, { id: "ignore", label: "Ignore the uncertainty" }] }] },
  { id: "rest-reflection-v1", title: "Quiet Reflection", skill: "Mind & Sleep", values: ["preferences-vary", "observe-not-prove", "small-reflection"], questions: [{ prompt: "Rest preferences…", options: [{ id: "preferences-vary", label: "Vary between people" }, { id: "one-way", label: "Are exactly the same for everyone" }] }, { prompt: "A personal note can…", options: [{ id: "observe-not-prove", label: "Record an observation without proving its cause" }, { id: "prove-cause", label: "Prove what caused a change" }] }, { prompt: "A useful reflection can be…", options: [{ id: "small-reflection", label: "Brief and optional" }, { id: "mandatory", label: "A required long questionnaire" }] }] },
] as const;

export function KnowledgeJourneyPanel({ accessToken, onProgressUpdated }: { accessToken?: string; onProgressUpdated?: () => void }) {
  const { locale } = useHealthCluesLocale();
  const tx = useCallback((en: string, vi: string) => locale === "vi" ? vi : en, [locale]);

  const [data, setData] = useState<KnowledgePayload | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [selectedBookId, setSelectedBookId] = useState("");
  const [answerResult, setAnswerResult] = useState<{ correct: boolean; explanation: string; correctOption: string | null } | null>(null);
  const [activeGame, setActiveGame] = useState<{ id: string; step: number; answers: string[]; done: boolean } | null>(null);
  const [gameBusy, setGameBusy] = useState(false);
  const reducedMotion = useReducedMotion();

  // Bookmarks state (bidirectional sync with Botanist)
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [sidebarTab, setSidebarTab] = useState<"clues" | "saved">("clues");
  const [selectedBotanicalArticle, setSelectedBotanicalArticle] = useState<BotanicalArticle | null>(null);
  const [isBotanicalModalOpen, setIsBotanicalModalOpen] = useState(false);
  const [bookmarkBusy, setBookmarkBusy] = useState(false);

  // Load initial local bookmarks
  useEffect(() => {
    try {
      const cached = localStorage.getItem("hc_botanical_bookmarks");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) setBookmarks(parsed);
      }
    } catch {}

    const handleSync = (e: Event) => {
      const customEvent = e as CustomEvent<string[]>;
      if (Array.isArray(customEvent.detail)) {
        setBookmarks(customEvent.detail);
      }
    };
    window.addEventListener("hc_bookmarks_updated", handleSync);
    return () => window.removeEventListener("hc_bookmarks_updated", handleSync);
  }, []);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setError("");
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000); // 10s timeout to prevent hanging

    try {
      const response = await fetch("/api/healthclues/knowledge", { 
        headers: { Authorization: `Bearer ${accessToken}` }, 
        cache: "no-store",
        signal: controller.signal 
      });
      clearTimeout(timer);
      const payload = await response.json() as KnowledgePayload;
      if (!response.ok) throw new Error(payload.error || tx("Your Knowledge Book could not be opened.", "Không thể mở Sổ tay kiến thức."));
      setData(payload);
      if (Array.isArray(payload.bookmarks)) {
        setBookmarks(payload.bookmarks);
        try {
          localStorage.setItem("hc_botanical_bookmarks", JSON.stringify(payload.bookmarks));
        } catch {}
      }
    } catch (reason) {
      clearTimeout(timer);
      setError(reason instanceof Error ? reason.message : tx("Your Knowledge Book could not be opened.", "Không thể mở Sổ tay kiến thức."));
    }
  }, [accessToken, tx]);

  useEffect(() => { void load(); }, [load]);

  // Toggle or Remove bookmark
  const toggleBookmark = async (articleId: string) => {
    const isCurrentlySaved = bookmarks.includes(articleId);
    const nextBookmarks = isCurrentlySaved 
      ? bookmarks.filter(id => id !== articleId)
      : [...bookmarks, articleId];

    setBookmarks(nextBookmarks);
    try {
      localStorage.setItem("hc_botanical_bookmarks", JSON.stringify(nextBookmarks));
    } catch {}
    window.dispatchEvent(new CustomEvent("hc_bookmarks_updated", { detail: nextBookmarks }));

    if (accessToken) {
      setBookmarkBusy(true);
      try {
        await fetch("/api/healthclues/knowledge", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            action: "bookmark_article",
            articleId,
            bookmarked: !isCurrentlySaved
          })
        });
        onProgressUpdated?.();
      } catch (err) {
        console.error("Failed to update bookmark:", err);
      } finally {
        setBookmarkBusy(false);
      }
    }
  };

  const act = async (body: Record<string, unknown>) => {
    if (!accessToken || busy) return null;
    setBusy(true); setError(""); setStatus("");
    try {
      const response = await fetch("/api/healthclues/knowledge", {
        method: "POST", headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify(body), cache: "no-store",
      });
      const payload = await response.json() as { error?: string; discovered?: boolean; already_today?: boolean; correct?: boolean; explanation?: string; correctOption?: string | null };
      if (!response.ok) throw new Error(payload.error || tx("This Knowledge action could not be saved.", "Không thể lưu hành động Kiến thức này."));
      if (body.action === "discover") {
        setStatus(payload.discovered 
          ? tx("Clue discovered and added to your Knowledge Book. +2 learning XP · +1 Knowledge Fragment.", "Đã khám phá manh mối và thêm vào Sổ tay kiến thức. +2 XP học tập · +1 Mảnh ghép kiến thức.") 
          : payload.already_today 
          ? tx("Today’s Clue is already recorded in your Knowledge Book.", "Manh mối hôm nay đã được ghi nhận trong Sổ tay kiến thức của bạn.") 
          : tx("You already discovered this Clue. Open it from your Book anytime.", "Bạn đã khám phá manh mối này trước đây. Mở từ Sổ tay bất kỳ lúc nào."));
      }
      if (body.action === "answer") {
        setAnswerResult({ 
          correct: Boolean(payload.correct), 
          explanation: payload.explanation || tx("Review the source-linked clue above and try another reviewed question.", "Xem lại manh mối dẫn nguồn bên trên và thử lại câu hỏi khác."), 
          correctOption: payload.correctOption ?? null 
        });
      }
      await load();
      onProgressUpdated?.();
      return payload;
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : tx("This Knowledge action could not be saved.", "Không thể lưu hành động Kiến thức này."));
      return null;
    } finally { setBusy(false); }
  };

  const featured = data?.featured;
  const activeBookEntry = data?.book.find(entry => `${entry.clue_id}:${entry.version}` === selectedBookId);
  const openClue = activeBookEntry || featured;

  // Bookmarked botanical articles list
  const savedBotanicalArticles = useMemo(() => {
    return BOTANICAL_ARTICLES.filter(item => bookmarks.includes(item.id));
  }, [bookmarks]);

  const playGame = async (gameId: string, answers: string[]) => {
    if (!accessToken || gameBusy) return;
    setGameBusy(true); setError(""); setStatus("");
    try {
      const response = await fetch("/api/healthclues/learning-games", { method: "POST", headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" }, body: JSON.stringify({ gameId, answers }), cache: "no-store" });
      const payload = await response.json() as { error?: string; correct?: boolean; first_completion?: boolean; reward_granted?: boolean };
      if (!response.ok) throw new Error(payload.error || tx("The learning game could not be saved.", "Không thể lưu trò chơi học tập."));
      if (!payload.correct) { 
        setStatus(tx("Not quite. Take another look and try again; there is no penalty.", "Chưa chính xác. Hãy xem kỹ lại và thử lại; không có điểm phạt.")); 
        setActiveGame(current => current ? { ...current, step: 0, answers: [] } : current); 
        return; 
      }
      setActiveGame(current => current ? { ...current, done: true } : current);
      setStatus(payload.first_completion 
        ? tx("Learning activity complete. +3 learning XP. This demo reward is awarded once.", "Hoàn thành hoạt động học tập. +3 XP học tập. Phần thưởng này nhận 1 lần.") 
        : tx("You have already completed this learning activity. Your progress is saved.", "Bạn đã hoàn thành hoạt động này. Tiến trình đã được lưu."));
      await load(); onProgressUpdated?.();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : tx("The learning game could not be saved.", "Không thể lưu trò chơi học tập."));
      setActiveGame(current => current ? { ...current, step: 0, answers: [], done: false } : current);
    }
    finally { setGameBusy(false); }
  };

  const chooseGameAnswer = (gameId: string, answer: string) => {
    const game = games.find(candidate => candidate.id === gameId);
    if (!game || !activeGame || activeGame.id !== gameId || gameBusy) return;
    if (answer !== game.values[activeGame.step]) {
      setStatus(tx("Not quite. Review the choices and try that step again; there is no penalty.", "Chưa chính xác. Hãy xem lại các lựa chọn và thử lại bước này."));
      return;
    }
    const answers = [...activeGame.answers, answer];
    if (answers.length === game.values.length) void playGame(gameId, answers);
    else setActiveGame({ ...activeGame, step: activeGame.step + 1, answers });
  };

  return (
    <section aria-labelledby="hc-knowledge-title" className="mt-6 overflow-hidden rounded-3xl border border-[#cfc6a9] bg-[#fbfaf4] shadow-sm">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#173b34] px-5 py-4 text-white sm:px-6">
        <div className="flex items-center gap-3">
          <HealthCluesAdventurer pose="thinking" width={52} alt="Your adventurer studying the Knowledge Book"/>
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#f5df9b] text-[#254d3e]">
            <HealthCluesGameIcon icon="inv:book" size={22} tone="inherit"/>
          </span>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[.2em] text-[#f6df9d]">
              {tx("The Wayfinder Library · Daily Knowledge", "Thư Viện Dẫn Lối · Kiến Thức Mỗi Ngày")}
            </p>
            <h2 id="hc-knowledge-title" className="text-xl sm:text-2xl font-black">
              {tx("Your Knowledge Book", "Sổ Tay Kiến Thức của bạn")}
            </h2>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-white/20 bg-white/10 px-3 py-2 text-xs font-bold">
            {locale === "vi" ? `${data?.book.length ?? 0} manh mối đã lưu` : `${data?.book.length ?? 0} clues saved`}
          </span>
          <span className="rounded-full border border-amber-300/30 bg-amber-400/20 px-3 py-2 text-xs font-bold text-amber-200">
            {locale === "vi" ? `${bookmarks.length} bài viết đã lưu` : `${bookmarks.length} articles saved`}
          </span>
        </div>
      </div>

      {!accessToken ? (
        <p className="p-5 text-sm text-[#647469]">
          {tx("Sign in to save discovered clues to your Knowledge Book.", "Đăng nhập để lưu manh mối khám phá vào Sổ tay kiến thức của bạn.")}
        </p>
      ) : error ? (
        <div role="alert" className="m-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900 flex items-center justify-between gap-3">
          <span>{error}</span>
          <button 
            type="button" 
            onClick={() => void load()} 
            className="rounded-lg bg-rose-900 text-white px-3 py-1.5 text-xs font-bold shrink-0"
          >
            {tx("Retry", "Thử lại")}
          </button>
        </div>
      ) : !data ? (
        <p role="status" className="p-5 text-sm text-[#647469]">
          {tx("Opening your Knowledge Book…", "Đang mở Sổ tay kiến thức…")}
        </p>
      ) : (
        <div className="grid gap-5 p-4 sm:p-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(260px,.6fr)]">
          {/* Skills Progress Grid */}
          <div className="lg:col-span-2 grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Knowledge Skills">
            {skillRows.map(skill => {
              const points = data.skills?.[skill.id] ?? 0; 
              const level = getHealthCluesSkillLevel(points); 
              const threshold = [0, 1, 3, 5, 8][level]; 
              const next = [1, 3, 5, 8][level] ?? null;
              const skillTitle = locale === "vi" ? skill.labelVi : skill.labelEn;
              return (
                <article key={skill.id} className="rounded-2xl border border-[#d9d0b7] bg-[#fffdf6] p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <HealthCluesGameIcon icon={skill.gameIcon} size={18} tone="botanical"/>
                      <h3 className="text-sm font-black text-[#244a3c]">{skillTitle}</h3>
                    </div>
                    <HealthCluesGameIcon icon="quest:star" size={16} tone="amber"/>
                  </div>
                  <p className="mt-2 text-xs font-bold text-[#657469]">
                    {HEALTHCLUES_SKILL_LEVELS[level]} · {points} {tx(points === 1 ? "unique learning completion" : "unique learning completions", "lần hoàn thành học tập")}
                  </p>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#e7e2d5]" role="progressbar" aria-label={`${skillTitle} progress`} aria-valuemin={0} aria-valuemax={Math.max(points, next ?? threshold)} aria-valuenow={points}>
                    <span className="block h-full rounded-full bg-emerald-700" style={{ width: `${next ? Math.min(100, Math.max(0, ((points - threshold) / Math.max(1, next - threshold)) * 100)) : 100}%` }}/>
                  </div>
                  <p className="mt-2 text-[10px] text-[#687a6e]">
                    {next 
                      ? tx(`${next - points} more unique learning ${next - points === 1 ? "completion" : "completions"} to ${HEALTHCLUES_SKILL_LEVELS[level + 1]}.`, `Còn ${next - points} lần học tập nữa để đạt ${HEALTHCLUES_SKILL_LEVELS[level + 1]}.`)
                      : tx("Highest learning level reached.", "Đã đạt cấp độ học tập cao nhất.")}
                  </p>
                </article>
              );
            })}
          </div>

          {/* Test Games Section (Owner demo) */}
          {data.demoGamesEnabled && (
            <section className="lg:col-span-2 rounded-2xl border border-dashed border-amber-600/50 bg-amber-50/70 p-4" aria-label="TEST ONLY educational mini-games">
              <div className="flex items-center gap-2">
                <HealthCluesGameIcon icon="know:gamepad" size={20} tone="amber"/>
                <h3 className="font-black text-amber-950">
                  {tx("Learning Games · TEST ONLY", "Trò chơi học tập · THỬ NGHIỆM")}
                </h3>
              </div>
              <p className="mt-1 text-xs text-amber-950">
                {tx("Synthetic, non-clinical activities for the isolated owner demo. Not human-reviewed HealthClues content.", "Hoạt động giáo dục thử nghiệm phi lâm sàng. Không phải nội dung y tế qua kiểm duyệt.")}
              </p>
              {activeGame ? (() => { 
                const game = games.find(candidate => candidate.id === activeGame.id); 
                if (!game) return null; 
                const question = game.questions[activeGame.step]; 
                return (
                  <div className="mt-3 rounded-xl border border-amber-200 bg-white p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-black uppercase tracking-widest text-amber-900">
                        {game.title} · {tx(`Step ${Math.min(activeGame.step + 1, game.values.length)} of ${game.values.length}`, `Bước ${Math.min(activeGame.step + 1, game.values.length)} trên ${game.values.length}`)}
                      </p>
                      <button type="button" className="text-xs font-bold underline" onClick={() => { setActiveGame(null); setStatus(""); }}>
                        {tx("Close", "Đóng")}
                      </button>
                    </div>
                    {activeGame.done ? (
                      <p className="mt-3 text-sm font-bold">
                        {tx("Activity complete. You can replay it, but a repeat does not earn another reward.", "Hoạt động đã hoàn thành. Bạn có thể chơi lại.")}
                      </p>
                    ) : question && (
                      <>
                        <h4 className="mt-3 font-extrabold">{question.prompt}</h4>
                        <div className="mt-3 grid gap-2">
                          {question.options.map(option => (
                            <button key={option.id} type="button" disabled={gameBusy} onClick={() => chooseGameAnswer(game.id, option.id)} className="min-h-11 rounded-xl border border-[#d5d8c8] bg-white px-4 py-2 text-left text-sm font-semibold hover:border-emerald-700 focus-visible:outline focus-visible:outline-2 disabled:opacity-60">
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                ); 
              })() : (
                <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                  {games.map(game => (
                    <button key={game.id} type="button" onClick={() => { setActiveGame({ id: game.id, step: 0, answers: [], done: false }); setStatus(""); }} className="min-h-14 rounded-xl border border-amber-300 bg-white px-3 py-2 text-left hover:border-amber-700">
                      <span className="block text-sm font-extrabold">{game.title}</span>
                      <span className="text-[10px] text-[#657469]">
                        {game.skill} · {(data.completedGames ?? []).includes(game.id) ? tx("Completed", "Đã xong") : tx("Play", "Chơi")}
                      </span>
                    </button>
                  ))}
                </div>
              )}
              {status && <p role="status" className="mt-3 rounded-lg bg-white p-3 text-sm font-semibold text-amber-950">{status}</p>}
            </section>
          )}

          {/* Main Content Area */}
          <div aria-live="polite">
            {openClue ? (
              <motion.article 
                key={`${openClue.clue_id}:${openClue.version}`} 
                initial={reducedMotion ? false : { opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ duration: reducedMotion ? 0 : .24 }} 
                className="rounded-2xl border border-[#e2dcc7] bg-white p-5 sm:p-6"
              >
                <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-900">
                  <span>
                    {openClue.demoOnly 
                      ? tx("TEST ONLY · NOT HUMAN-REVIEWED", "THỬ NGHIỆM · CHƯA QUA DUYỆT Y TẾ") 
                      : activeBookEntry 
                      ? tx("From your book", "Từ sổ tay của bạn") 
                      : tx("Today’s reviewed clue", "Manh mối đã duyệt hôm nay")}
                  </span>
                  <span>·</span>
                  <span>{tx(`Chapter ${openClue.chapter_id}`, `Chương ${openClue.chapter_id}`)}</span>
                  <span>·</span>
                  <span>{tx(`Version ${openClue.version}`, `Phiên bản ${openClue.version}`)}</span>
                </div>
                <h3 className="mt-2 text-2xl font-black">{openClue.title}</h3>
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-[#53675b]">{openClue.content}</p>
                <div className="mt-4 border-t border-[#ece8dc] pt-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#687a6e]">
                    {openClue.demoOnly ? tx("Demo fixture notice", "Ghi chú thử nghiệm") : tx("Reviewed sources", "Tài liệu nguồn đã duyệt")}
                  </p>
                  <ul className="mt-2 space-y-2">
                    {openClue.source_references.map(source => (
                      <li key={`${source.url}-${source.label}`}>
                        {source.url.startsWith("https://") ? (
                          <a href={source.url} target="_blank" rel="noreferrer" className="text-xs font-semibold text-emerald-900 underline flex items-center gap-1">
                            <span>{source.label}</span>
                            <ExternalLink size={12}/>
                          </a>
                        ) : (
                          <span className="text-xs text-[#53675b]">{source.label}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
                {openClue.related_catalog_ids.length > 0 && (
                  <p className="mt-3 text-xs text-[#687a6e]">
                    {tx("Related Catalog IDs:", "Mã danh mục liên quan:")} {openClue.related_catalog_ids.join(" · ")}
                  </p>
                )}
                {!activeBookEntry && (
                  <button 
                    type="button" 
                    disabled={busy || !data.world || Boolean(data.featuredDiscovered)} 
                    onClick={() => void act({ action: "discover", clueId: openClue.clue_id, version: openClue.version })} 
                    className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#183d36] px-4 text-sm font-extrabold text-white disabled:opacity-50"
                  >
                    <HealthCluesGameIcon icon="achieve:sparkles" size={16} tone="gold"/>
                    {busy 
                      ? tx("Saving…", "Đang lưu…") 
                      : data.featuredDiscovered 
                      ? tx("In your Knowledge Book", "Đã có trong Sổ tay kiến thức") 
                      : tx("Discover this Clue", "Khám phá manh mối này")}
                  </button>
                )}
                {status && <p role="status" className="mt-3 rounded-xl bg-[#edf4e9] p-3 text-sm font-semibold text-emerald-950">{status}</p>}
                
                {openClue.question_prompt && (
                  <div className="mt-5 rounded-2xl border border-[#e4ddc7] bg-[#faf8ef] p-4">
                    <p className="text-xs font-black uppercase tracking-widest text-[#6f612f]">
                      {tx("Optional knowledge challenge", "Thử thách kiến thức tùy chọn")}
                    </p>
                    <h4 className="mt-2 font-extrabold">{openClue.question_prompt}</h4>
                    <div className="mt-3 grid gap-2">
                      {openClue.question_options.map(option => (
                        <button key={option.id} type="button" disabled={busy || !accessToken || Boolean(activeBookEntry ? false : !data.featured)} onClick={() => { setAnswerResult(null); void act({ action: "answer", clueId: openClue.clue_id, version: openClue.version, selectedOptionId: option.id, idempotencyKey: crypto.randomUUID() }); }} className="min-h-11 rounded-xl border border-[#d5d8c8] bg-white px-4 py-2 text-left text-sm font-semibold hover:border-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60">
                          {option.label}
                        </button>
                      ))}
                    </div>
                    {answerResult && (
                      <div role="status" className={`mt-3 rounded-xl p-3 text-sm ${answerResult.correct ? "bg-emerald-50 text-emerald-950" : "bg-amber-50 text-amber-950"}`}>
                        <p className="font-extrabold">
                          {answerResult.correct 
                            ? tx("That’s right. +2 learning XP.", "Chính xác! +2 XP học tập.") 
                            : tx(`Not quite${answerResult.correctOption ? ` · reviewed answer: ${answerResult.correctOption}` : ""}.`, `Chưa chính xác${answerResult.correctOption ? ` · đáp án đúng: ${answerResult.correctOption}` : ""}.`)}
                        </p>
                        <p className="mt-1 leading-relaxed">{answerResult.explanation}</p>
                      </div>
                    )}
                  </div>
                )}
              </motion.article>
            ) : (
              <div className="rounded-2xl border border-dashed border-[#cfcab8] bg-white/70 p-6">
                <p className="font-extrabold text-[#173f33]">
                  {locale === "vi"
                    ? (data.emptyReasonVi ||
                       (data.emptyReason?.includes("explored every")
                         ? "Bạn đã khám phá toàn bộ manh mối đã thẩm định cho hành trình này. Hãy mở Sổ tay kiến thức để ôn tập lại."
                         : data.emptyReason?.startsWith("Hiện chưa có")
                         ? data.emptyReason
                         : "Hiện chưa có manh mối kiến thức đã thẩm định y tế riêng cho chủ đề này. HealthClues không thay thế bằng các chủ đề chưa liên quan để bảo đảm tính chuẩn xác."))
                    : (data.emptyReason || "No reviewed clue is available for this Quest yet.")}
                </p>
                <p className="mt-2 text-sm text-[#617268]">
                  {tx(
                    "HealthClues only shows source-linked knowledge after review. Your check-in and World remain available while you wait.",
                    "HealthClues chỉ hiển thị kiến thức có dẫn nguồn sau khi đã qua kiểm duyệt y tế. Bạn có thể ghé thăm Vườn Thảo Mộc để khám phá và lưu các bài viết khoa học có đối chứng."
                  )}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setSidebarTab("saved")}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#173f33] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#205244] transition-colors"
                  >
                    <BookmarkCheck size={14} className="text-amber-300" />
                    <span>{tx("View Saved Botanical Articles", "Xem các bài viết thảo mộc đã lưu")}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar: Discovered Clues & Saved Articles */}
          <aside className="rounded-2xl border border-[#e2dcc7] bg-[#f4f1e6] p-4" aria-label="Knowledge Book chapters">
            
            {/* Sidebar Switcher Tabs */}
            <div className="flex rounded-xl bg-[#e6dfce] p-1 gap-1 mb-3">
              <button
                type="button"
                onClick={() => setSidebarTab("clues")}
                className={`flex-1 rounded-lg py-2 text-xs font-black transition-colors ${
                  sidebarTab === "clues" ? "bg-white text-[#183d36] shadow-sm" : "text-[#5e7164] hover:text-black"
                }`}
              >
                {tx("Discovered Clues", "Manh mối đã học")} ({data.book.length})
              </button>
              <button
                type="button"
                onClick={() => setSidebarTab("saved")}
                className={`flex-1 rounded-lg py-2 text-xs font-black transition-colors flex items-center justify-center gap-1 ${
                  sidebarTab === "saved" ? "bg-white text-[#183d36] shadow-sm" : "text-[#5e7164] hover:text-black"
                }`}
              >
                <BookmarkCheck size={13} className="text-amber-600" />
                <span>{tx("Saved Articles", "Đã lưu")}</span>
                <span>({bookmarks.length})</span>
              </button>
            </div>

            {/* TAB 1: Discovered Clues */}
            {sidebarTab === "clues" && (
              <>
                {data.book.length ? (
                  <ul className="space-y-2">
                    {data.book.map(entry => (
                      <li key={entry.discoveryId}>
                        <button 
                          type="button" 
                          onClick={() => { setSelectedBookId(`${entry.clue_id}:${entry.version}`); setAnswerResult(null); }} 
                          className={`w-full rounded-xl border px-3 py-3 text-left transition-all ${
                            selectedBookId === `${entry.clue_id}:${entry.version}` 
                              ? "border-emerald-800 bg-emerald-50" 
                              : "border-[#e1ddcf] bg-white hover:border-[#183d36]"
                          }`}
                        >
                          <span className="flex items-start justify-between gap-2">
                            <span>
                              <span className="block text-sm font-bold">{entry.title}</span>
                              <span className="mt-1 block text-[10px] text-[#687a6e]">
                                {tx(`Chapter ${entry.chapter_id}`, `Chương ${entry.chapter_id}`)} · {entry.localDate}
                              </span>
                            </span>
                            <HealthCluesGameIcon icon="quest:check" size={16} tone="botanical" className="shrink-0"/>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm leading-relaxed text-[#657469]">
                    {tx("Discover a reviewed daily clue to start collecting chapters. Saved knowledge stays private to you.", "Khám phá manh mối hàng ngày để tích lũy các chương kiến thức. Dữ liệu lưu trữ hoàn toàn riêng tư.")}
                  </p>
                )}

                {activeBookEntry && (
                  <button 
                    type="button" 
                    onClick={() => { setSelectedBookId(""); setAnswerResult(null); }} 
                    className="mt-3 text-xs font-bold text-emerald-900 underline block"
                  >
                    {tx("Return to today’s clue", "Quay lại manh mối hôm nay")}
                  </button>
                )}
              </>
            )}

            {/* TAB 2: Saved Scientific Botanical Articles */}
            {sidebarTab === "saved" && (
              <div className="space-y-2.5">
                {savedBotanicalArticles.length > 0 ? (
                  <ul className="space-y-2">
                    {savedBotanicalArticles.map(article => (
                      <li key={article.id} className="rounded-xl border border-[#ded8c4] bg-white p-3 shadow-sm hover:border-emerald-700 transition-all">
                        <div className="flex items-start justify-between gap-2.5">
                          <div className="flex items-center gap-2.5">
                            {article.imageUrl && (
                              <div className="w-10 h-10 shrink-0 rounded-lg overflow-hidden border border-[#d8cfbe] bg-[#f5efe2]">
                                <img src={article.imageUrl} alt={article.commonName[locale]} className="w-full h-full object-cover" />
                              </div>
                            )}
                            <div className="space-y-0.5">
                              <span className="block text-xs font-bold text-[#1b3d30]">
                                {article.commonName[locale]}
                              </span>
                              <span className="block text-[11px] font-serif italic text-[#546a5d]">
                                {article.scientificName}
                              </span>
                              <span className="inline-block mt-0.5 text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
                                {article.references.length} {tx("PubMed citations", "trích dẫn PubMed")}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => void toggleBookmark(article.id)}
                            disabled={bookmarkBusy}
                            title={tx("Unsave article", "Bỏ lưu bài viết")}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/70 rounded-lg transition-colors shrink-0"
                          >
                            <Trash2 size={12} />
                            <span>{tx("Remove", "Bỏ lưu")}</span>
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedBotanicalArticle(article);
                            setIsBotanicalModalOpen(true);
                          }}
                          className="mt-2.5 w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#183d36] py-1.5 text-xs font-bold text-white hover:bg-[#205046] transition-colors"
                        >
                          <BookOpen size={12} />
                          <span>{tx("Read Full Article", "Đọc lại toàn bộ")}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center py-6 px-2 space-y-2">
                    <Bookmark size={24} className="mx-auto text-[#94a398]" />
                    <p className="text-xs font-bold text-[#314639]">
                      {tx("No saved articles yet", "Chưa có bài viết nào được lưu")}
                    </p>
                    <p className="text-[11px] text-[#637669] leading-relaxed">
                      {tx(
                        "Visit the Botanist station to explore herbal science and bookmark articles here.",
                        "Hãy ghé thăm Nhà Thực Vật Học để khám phá các bài viết khoa học và lưu vào đây."
                      )}
                    </p>
                  </div>
                )}
              </div>
            )}

            <Link href="/en/wellness/healthclues/dashboard" className="mt-4 inline-block text-xs font-bold text-emerald-900 underline">
              {tx("Explore reviewed wellness library", "Khám phá thư viện sống khỏe đã duyệt")}
            </Link>
          </aside>

        </div>
      )}

      {/* Detail Modal for Saved Botanical Articles in Knowledge Book */}
      <BotanicalArticleModal
        article={selectedBotanicalArticle}
        isOpen={isBotanicalModalOpen}
        onClose={() => setIsBotanicalModalOpen(false)}
        isBookmarked={Boolean(selectedBotanicalArticle && bookmarks.includes(selectedBotanicalArticle.id))}
        onToggleBookmark={toggleBookmark}
        bookmarkBusy={bookmarkBusy}
      />
    </section>
  );
}
