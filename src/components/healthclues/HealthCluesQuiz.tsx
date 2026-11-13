"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, ShieldCheck, Sparkles } from "lucide-react";
import questionBankSource from "@/data/healthclues-quiz-bank.json";
import { createDiscoveryProfile, getDeepQuestionIds, HEALTHCLUES_DISCLOSURE, HEALTHCLUES_RESULT_DISCLAIMER, HEALTHCLUES_SAFETY_NOTICE, type HealthCluesProfile } from "@/lib/healthclues-quiz";
import type { QuizBankQuestion } from "@/features/healthclues/quiz-bank";
import { getHealthCluesSessionProfile, saveHealthCluesSessionProfile, subscribeHealthCluesSessionProfile, trackHealthCluesFunnel } from "@/lib/healthclues-funnel";
import { AnalyticsConsent } from "./AnalyticsConsent";
import { HealthCluesAdventurer } from "./HealthCluesAdventurer";
import styles from "./HealthCluesQuiz.module.css";
import { discoveryTimeLabel, matchHealthCluesDiscoveries, type DiscoveryContent, type DiscoveryStatus } from "@/data/healthclues-discoveries";
import { cloudEnabled, deleteHealthCluesProfile, getCloudSession, saveHealthCluesProfile, sendMagicLink, subscribeCloudSession, type CloudSession } from "@/lib/wellness-cloud";
import { HealthCluesWorldPreview } from "@/components/healthclues/HealthCluesWorldPreview";
import { HealthCluesGoalFirstDiscovery } from "@/components/healthclues/HealthCluesGoalFirstDiscovery";
import { isPlayableHealthCluesRegion } from "@/features/healthclues/region-availability";
import { WellnessPlanBuilder } from "@/components/healthclues/WellnessPlanBuilder";
import type { WellnessPlanGoal } from "@/features/healthclues/wellness-plan";
import { localeHealthCluesPath, useHealthCluesLocale } from "./HealthCluesLocaleProvider";
import { healthCluesQuizOption, healthCluesQuizText } from "@/lib/healthclues-i18n";

type Question = Omit<QuizBankQuestion, "note_vi">;
type Attribution = { source: string; entry: string; ebookId: string; suggestedTopic: string | null; showProfile: boolean };
type Answers = Record<string, string | string[]>;
type View = "intro" | "discovery" | "quest" | "onboarding" | "deep_offer" | "deep" | "result" | "wellness_plan" | "world_preview" | "underage" | "general";

const countryOptions = ["Australia", "Brazil", "Canada", "France", "Germany", "India", "Indonesia", "Japan", "Malaysia", "Mexico", "Netherlands", "Philippines", "Singapore", "Thailand", "United Kingdom", "United States"];
const quests = [
  { id: "sleep-better", title: "Sleep Valley", companion: "Luna", region: "Sleep Valley", icon: "☾", summary: "Begin a gentle discovery journey with Luna.", topic: "", playable: isPlayableHealthCluesRegion("sleep-better"), color: "from-indigo-950 to-sky-700" },
  { id: "feel-calmer", title: "Calm Forest", region: "Calm Forest", icon: "✧", summary: "Coming Soon", topic: "", playable: isPlayableHealthCluesRegion("feel-calmer"), color: "from-emerald-950 to-teal-700" },
  { id: "more-energy", title: "Energy Hills", region: "Energy Hills", icon: "☀", summary: "Coming Soon", topic: "", playable: isPlayableHealthCluesRegion("more-energy"), color: "from-amber-950 to-orange-700" },
  { id: "eat-healthier", title: "Nutrition Garden", region: "Nutrition Garden", icon: "❋", summary: "Coming Soon", topic: "", playable: isPlayableHealthCluesRegion("eat-healthier"), color: "from-lime-950 to-emerald-700" },
  { id: "move-more", title: "Movement Peaks", region: "Movement Peaks", icon: "↗", summary: "Coming Soon", topic: "", playable: isPlayableHealthCluesRegion("move-more"), color: "from-slate-950 to-blue-700" },
  { id: "healthy-weight", title: "Balance Meadow", region: "Balance Meadow", icon: "◉", summary: "Coming Soon", topic: "", playable: isPlayableHealthCluesRegion("healthy-weight"), color: "from-green-950 to-teal-700" },
  { id: "natural-wellness", title: "Natural Living Forest", region: "Natural Living Forest", icon: "❧", summary: "Coming Soon", topic: "", playable: isPlayableHealthCluesRegion("natural-wellness"), color: "from-stone-950 to-emerald-700" },
  { id: "health-concern", title: "HealthClues Realm", companion: "Lumi", region: "HealthClues Realm", icon: "⌕", summary: "Discover your personal wellness journey with Lumi.", topic: "", playable: isPlayableHealthCluesRegion("health-concern"), color: "from-indigo-950 to-violet-700" },
];
const questMapPosition: Record<string, string> = {
  "sleep-better": "0% 24%",
  "feel-calmer": "24% 24%",
  "more-energy": "94% 21%",
  "eat-healthier": "6% 72%",
  "move-more": "52% 10%",
  "healthy-weight": "52% 55%",
  "natural-wellness": "88% 78%",
  "health-concern": "100% 100%",
};

function isSafetyConcern(answers: Answers) {
  const positive = (id: string, values: string[]) => {
    const answer = answers[id];
    return typeof answer === "string" && values.includes(answer);
  };
  return positive("C24", ["Yes", "Not sure"]) || positive("C25", ["Yes", "Not sure"]) || positive("C32", ["Yes", "Not sure"]) ||
    positive("G02", ["Yes", "Unsure"]) || positive("G03", ["Yes", "Unsure"]) || positive("G06", ["Yes", "Unsure"]) ||
    positive("W05", ["Yes", "Unsure"]) || positive("S06", ["Yes", "Unsure"]);
}

function isUrgentConcern(answers: Answers) {
  return (answers.C33 === "Yes") || (answers.G03 === "Yes" || answers.G03 === "Unsure");
}

export function HealthCluesQuiz({ attribution, questionBank = questionBankSource as Question[], quizVersion = 0, initialView = "intro", initialQuest = "" }: { attribution: Attribution; questionBank?: Question[]; quizVersion?: number; initialView?: "intro" | "discovery" | "quest" | "result"; initialQuest?: string }) {
  const router = useRouter();
  const { locale, text } = useHealthCluesLocale();
  const questions = questionBank;
  const byId = useMemo(() => new Map(questions.map(question => [question.id, question])), [questions]);
  const onboardingIds = useMemo(() => {
    const ids = questions.filter(question => question.group === "core" && question.stage === "onboarding").map(question => question.id);
    const ordered = ids.includes("C01") ? ["C01", ...ids.filter(id => id !== "C01")] : ids;
    return ordered.slice(0, 10);
  }, [questions]);
  const [view, setView] = useState<View>(initialView);
  const [answers, setAnswers] = useState<Answers>(() => attribution.suggestedTopic ? { C04: attribution.suggestedTopic } as Answers : {} as Answers);
  const [onboardingIndex, setOnboardingIndex] = useState(0);
  const [deepIndex, setDeepIndex] = useState(0);
  const [selectedQuest, setSelectedQuest] = useState(initialQuest);
  const [draftReady, setDraftReady] = useState(false);
  const [profile, setProfile] = useState<HealthCluesProfile | null>(null);
  const [confirmedWellnessPlan, setConfirmedWellnessPlan] = useState<WellnessPlanGoal[] | null>(null);
  const [cloudSession, setCloudSession] = useState<CloudSession | null>(null);
  const sessionOwner = useRef<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [saveEmail, setSaveEmail] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [saveBusy, setSaveBusy] = useState(false);
  const [pendingSave, setPendingSave] = useState(false);
  const savedProfile = useSyncExternalStore(subscribeHealthCluesSessionProfile, getHealthCluesSessionProfile, () => null);
  const completionTracked = useRef(false);
  const activationPending = useRef(false);
  const activationEmail = useRef("");
  const activeView = view === "intro" && attribution.showProfile && savedProfile ? "result" : view;
  const profileToShow = profile || savedProfile;
  const needsProfileRecovery = ["result", "wellness_plan", "world_preview"].includes(activeView) && !profileToShow;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const currentSession = getCloudSession();
      sessionOwner.current = currentSession?.user.id ?? null;
      setCloudSession(currentSession);
      const urlQuest = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("quest") : null;
      const effective = initialQuest || urlQuest;
      if (effective && quests.some(quest => quest.id === effective)) {
        setSelectedQuest(effective);
        sessionStorage.setItem("healthclues-selected-quest", effective);
      } else {
        const restoredQuest = sessionStorage.getItem("healthclues-selected-quest");
        if (restoredQuest && quests.some(quest => quest.id === restoredQuest)) setSelectedQuest(restoredQuest);
      }
      setPendingSave(sessionStorage.getItem("healthclues-pending-profile") === "1");
    }, 0);
    return () => window.clearTimeout(timer);
  }, [initialQuest]);

  useEffect(() => {
    try {
      if (initialView === "discovery") {
        sessionStorage.removeItem("healthclues-quiz-draft-v1");
        return;
      }
      if (initialView === "quest" || initialView === "result") {
        sessionStorage.removeItem("healthclues-quiz-draft-v1");
        return;
      }
      const raw = sessionStorage.getItem("healthclues-quiz-draft-v1");
      if (raw) {
        const draft = JSON.parse(raw) as { answers?: Answers; view?: View; onboardingIndex?: number; deepIndex?: number; selectedQuest?: string; quizVersion?: number; ownerId?: string | null };
        if ((draft.ownerId ?? null) !== (getCloudSession()?.user.id ?? null)) {
          sessionStorage.removeItem("healthclues-quiz-draft-v1");
          return;
        }
        if (draft.quizVersion !== quizVersion) {
          sessionStorage.removeItem("healthclues-quiz-draft-v1");
          return;
        }
        // Restore the saved session draft after hydration to keep server/client initial markup consistent.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (draft.answers && typeof draft.answers === "object" && !Array.isArray(draft.answers)) setAnswers(draft.answers);
        if (Number.isInteger(draft.onboardingIndex) && (draft.onboardingIndex as number) >= 0 && (draft.onboardingIndex as number) < onboardingIds.length) setOnboardingIndex(draft.onboardingIndex as number);
        if (Number.isInteger(draft.deepIndex) && (draft.deepIndex as number) >= 0 && (draft.deepIndex as number) < 40) setDeepIndex(draft.deepIndex as number);
        if (typeof draft.selectedQuest === "string" && quests.some(quest => quest.id === draft.selectedQuest)) setSelectedQuest(draft.selectedQuest);
        if (["deep_offer", "deep"].includes(draft.view || "")) {
          const completed = draft.answers ? createDiscoveryProfile(draft.answers) : null;
          if (completed) { setProfile(completed); saveHealthCluesSessionProfile(completed); setView("result"); }
        } else if (["quest", "onboarding", "wellness_plan", "world_preview"].includes(draft.view || "")) setView(draft.view as View);
      }
    } catch { sessionStorage.removeItem("healthclues-quiz-draft-v1"); }
    finally { setDraftReady(true); }
  }, [initialView, onboardingIds.length, quizVersion]);

  useEffect(() => {
    const restoreViewFromHistory = () => {
      if (window.location.hash === "#world-preview") setView("world_preview");
      else if (window.location.hash === "#wellness-plan") setView("wellness_plan");
      else if (activeView === "world_preview") setView("result");
    };
    window.addEventListener("popstate", restoreViewFromHistory);
    return () => window.removeEventListener("popstate", restoreViewFromHistory);
  }, [activeView]);

  useEffect(() => {
    if (!draftReady || (activeView !== "result" && activeView !== "world_preview")) return;
    const frame = window.requestAnimationFrame(() => window.scrollTo(0, 0));
    return () => window.cancelAnimationFrame(frame);
  }, [activeView, draftReady]);

  useEffect(() => subscribeCloudSession(() => {
    const nextSession = getCloudSession();
    const nextOwner = nextSession?.user.id ?? null;
    if (nextOwner !== sessionOwner.current) {
      if (activationPending.current && nextSession?.user.email?.toLowerCase() === activationEmail.current && (nextSession.user.email_confirmed_at || nextSession.user.confirmed_at)) {
        sessionOwner.current = nextOwner;
        setCloudSession(nextSession);
        router.push(`${localeHealthCluesPath("/en/wellness/healthclues/world", locale)}?quest=${encodeURIComponent(selectedQuest || "health-concern")}#hc-journey`);
        return;
      }
      sessionOwner.current = nextOwner;
      sessionStorage.removeItem("healthclues-quiz-draft-v1");
      setAnswers({});
      setSelectedQuest("");
      setConfirmedWellnessPlan(null);
      setOnboardingIndex(0);
      setDeepIndex(0);
      setView("intro");
    }
    setCloudSession(nextSession);
  }), [locale, router]);

  useEffect(() => {
    if (!draftReady) return;
    if (view === "result" || view === "underage") {
      sessionStorage.removeItem("healthclues-quiz-draft-v1");
      return;
    }
    try { sessionStorage.setItem("healthclues-quiz-draft-v1", JSON.stringify({ answers, view, onboardingIndex, deepIndex, selectedQuest, quizVersion, ownerId: getCloudSession()?.user.id ?? null })); }
    catch { /* Session storage can be unavailable; the current tab can still complete the Quiz. */ }
  }, [answers, deepIndex, draftReady, onboardingIndex, quizVersion, selectedQuest, view]);

  const topic = typeof answers.C04 === "string" ? answers.C04 : attribution.suggestedTopic || "General wellness";
  const deepIds = useMemo(() => getDeepQuestionIds(topic, selectedQuest), [selectedQuest, topic]);
  const currentId = activeView === "onboarding" ? onboardingIds[onboardingIndex] : activeView === "deep" ? deepIds[deepIndex] : "";
  const question = currentId ? byId.get(currentId) : undefined;
  const funnelMeta = { entry: attribution.entry, ...(attribution.ebookId ? { ebook_id: attribution.ebookId } : {}) };

  const setAnswer = (id: string, value: string | string[]) => setAnswers(previous => {
    if (id !== "C04" || previous.C04 === value) return { ...previous, [id]: value };
    const next = { ...previous };
    for (const key of Object.keys(next)) if (/^C(1[1-9]|2[0-9]|3[0-3])$/.test(key) || (byId.get(key)?.stage === "deep" && byId.get(key)?.group !== "core")) delete next[key];
    return { ...next, [id]: value };
  });
  const startQuiz = () => {
    setView("quest");
  };
  const chooseQuest = (questId: string) => {
    const quest = quests.find(item => item.id === questId);
    if (!quest) return;
    const ageAnswer = answers.C01;
    setAnswers({ ...(ageAnswer ? { C01: ageAnswer } : {}) });
    setSelectedQuest(questId);
    const currentUrl = new URL(window.location.href);
    if (currentUrl.searchParams.get("from") === "play") {
        currentUrl.searchParams.set("step", "discovery");
        window.history.replaceState({ healthCluesStep: "discovery" }, "", `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`);
    }
    setOnboardingIndex(0);
    setDeepIndex(0);
    sessionStorage.setItem("healthclues-selected-quest", quest.id);
    trackHealthCluesFunnel("quiz_started", { ...funnelMeta, quest_id: quest.id });
    if (currentUrl.searchParams.get("from") === "play") {
      sessionStorage.removeItem("healthclues-goal-first-discovery-v1");
      setView("discovery");
    } else setView("onboarding");
  };
  const finish = () => {
    const created = createDiscoveryProfile(answers);
    if (!created) { setView(answers.C01 === "No" ? "underage" : "general"); return; }
    setProfile(created);
    setConfirmedWellnessPlan(null);
    saveHealthCluesSessionProfile(created);
    const currentUrl = new URL(window.location.href);
    if (currentUrl.searchParams.get("from") === "play") {
      currentUrl.searchParams.set("step", "reveal");
      window.history.replaceState({ healthCluesStep: "reveal" }, "", `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`);
    }
    if (!completionTracked.current) {
      trackHealthCluesFunnel("quiz_completed", funnelMeta);
      trackHealthCluesFunnel("profile_created", funnelMeta);
      completionTracked.current = true;
    }
    window.history.pushState({ healthCluesStep: "wellness-plan" }, "", "#wellness-plan");
    setView("wellness_plan");
  };
  const openWellnessPlan = () => { window.history.pushState({ healthCluesStep: "wellness-plan" }, "", "#wellness-plan"); setView("wellness_plan"); };
  const skipWellnessPlan = () => {
    setConfirmedWellnessPlan(null);
    try { sessionStorage.removeItem("healthclues-confirmed-plan"); } catch {}
    window.history.pushState({ healthCluesStep: "world-preview" }, "", "#world-preview");
    setView("world_preview");
  };
  const confirmWellnessPlan = (goals: WellnessPlanGoal[]) => {
    setConfirmedWellnessPlan(goals);
    try {
      sessionStorage.setItem("healthclues-confirmed-plan", JSON.stringify({
        goals,
        requestKey: typeof crypto !== "undefined" ? crypto.randomUUID() : "",
        savedAt: new Date().toISOString(),
      }));
    } catch {}
    window.history.pushState({ healthCluesStep: "world-preview" }, "", "#world-preview");
    setView("world_preview");
  };
  const next = () => {
    if (!question) return;
    if (question.id === "C01" && answers.C01 === "No") { setView("underage"); return; }
    if (view === "onboarding") {
      if (onboardingIndex < onboardingIds.length - 1) setOnboardingIndex(index => index + 1);
      else finish();
    } else if (deepIndex < deepIds.length - 1) setDeepIndex(index => index + 1);
    else finish();
  };
  const back = () => {
    if (view === "onboarding") {
      if (onboardingIndex === 0) setView("quest");
      else setOnboardingIndex(index => index - 1);
    } else if (view === "deep") {
      if (deepIndex === 0) setView("deep_offer");
      else setDeepIndex(index => index - 1);
    } else if (view === "deep_offer") {
      setView("onboarding"); setOnboardingIndex(onboardingIds.length - 1);
    }
  };
  const toggleMulti = (id: string, option: string, exclusiveNone = false) => {
    const selected = Array.isArray(answers[id]) ? answers[id] as string[] : [];
    const noneLike = option === "None" || option === "Prefer not to say";
    if (exclusiveNone && noneLike) { setAnswer(id, selected.includes(option) ? [] : [option]); return; }
    const withoutExclusive = exclusiveNone ? selected.filter(item => item !== "None" && item !== "Prefer not to say") : selected;
    const updated = withoutExclusive.includes(option) ? withoutExclusive.filter(item => item !== option) : [...withoutExclusive, option];
    const limit = id === "C06" ? 4 : 8;
    if (updated.length <= limit) setAnswer(id, updated);
  };

  const stepNumber = activeView === "onboarding" ? onboardingIndex + 1 : deepIndex + 1;
  const stepTotal = activeView === "onboarding" ? onboardingIds.length : deepIds.length;
  const value = question ? answers[question.id] : undefined;
  const isSensitiveOptional = ["C05", "C24", "C25", "C32", "C33", "G01", "G02", "G03", "G06", "W05", "S06"].includes(question?.id || "");
  const currentQuest = quests.find(quest => quest.id === selectedQuest);
  const scenePose = activeView === "result" ? "victory" : activeView === "quest" || activeView === "intro" ? "curious" : activeView === "deep_offer" ? "welcoming" : "thinking";
  const sceneRegion = activeView === "quest" && !currentQuest ? "Choose your first trail" : currentQuest?.region || "Your discovery trail";

  return <main className={styles.screen} data-quest={selectedQuest || "health-concern"}>
    <div className={styles.worldArt} aria-hidden="true" />
    <div className={styles.sceneShade} aria-hidden="true" />
    <div className={styles.scene}>
      <aside className={styles.adventureRail} aria-label={`${sceneRegion} adventure scene`}>
        <HealthCluesAdventurer pose={scenePose} width={220} className={styles.railCharacter} alt={`Your adventurer companion, ${scenePose}`} />
        <div className={styles.railText}>
          <p className={styles.chapter}>{text(activeView === "onboarding" && question?.id === "C01" ? "Eligibility checkpoint" : activeView === "result" ? "Discovery complete" : "Your current chapter")}</p>
          <h2 className={styles.regionName}>{text(sceneRegion)}</h2>
          <p className={styles.railCopy}>{text(activeView === "onboarding" && question?.id === "C01" ? "A clear, private checkpoint before any personalized discovery." : "Follow the trail at your own pace. Your choices stay in control.")}</p>
        </div>
      </aside>
      <div className={styles.content}>
       <div className="mx-auto max-w-3xl">
      {activeView === "discovery" && <HealthCluesGoalFirstDiscovery questId={selectedQuest} onComplete={(nextProfile, questId) => {
        setProfile(nextProfile); setConfirmedWellnessPlan(null); setSelectedQuest(questId); saveHealthCluesSessionProfile(nextProfile);
        sessionStorage.setItem("healthclues-selected-quest", questId);
        if (!completionTracked.current) { trackHealthCluesFunnel("quiz_completed", { entry: "direct", flow: "goal_first" }); trackHealthCluesFunnel("profile_created", { entry: "direct", flow: "goal_first" }); completionTracked.current = true; }
        setView("wellness_plan");
      }} />}
      {needsProfileRecovery && <section className={`${styles.panel} p-6 sm:p-10`} role="alert" data-quiz-profile-recovery>
        <p className="text-xs font-black uppercase tracking-[.18em] text-amber-900">{text("Journey checkpoint")}</p>
        <h1 className="mt-3 text-2xl font-black sm:text-3xl">{text("Your Quiz profile is not available in this browser tab.")}</h1>
        <p className="mt-3 text-sm leading-relaxed text-[#526b62]">{text("We haven’t created recommendations or a Plan because your answers aren’t available here. Start the Quiz to continue; your World is not affected.")}</p>
        <button type="button" onClick={() => { const url = new URL(window.location.href); url.searchParams.delete("step"); url.hash = ""; window.history.replaceState({}, "", `${url.pathname}${url.search}`); setAnswers({}); setProfile(null); setConfirmedWellnessPlan(null); setView("intro"); }} className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-[#18302b] px-5 py-3 text-sm font-bold text-white">{text("Start the Quiz")}</button>
      </section>}
      {activeView === "intro" && <section className={`${styles.panel} p-6 sm:p-10`}>
        <p className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-emerald-800"><Sparkles className="h-4 w-4"/> {text("HealthClues · Wellness discovery")}</p>
        <h1 className="mt-4 text-3xl font-black leading-tight sm:text-5xl">{text("Create Your Wellness Journey")}</h1>
        <p className="mt-5 text-base leading-relaxed text-[#526b62]">{text("Share the topics and everyday preferences that interest you. Your answers shape a personal starting point for discovering wellness resources.")}</p>
        {attribution.suggestedTopic && <p className="mt-5 rounded-xl bg-[#edf4ec] p-4 text-sm leading-relaxed">{text("Suggested from your ebook:")} <strong>{attribution.suggestedTopic}</strong>{text(". You can change this topic in the quiz.")}</p>}
        <div className="mt-6 rounded-2xl border border-[#dce8dc] bg-[#f7faf6] p-4 text-sm leading-relaxed text-[#526b62]"><ShieldCheck className="mr-2 inline h-4 w-4 text-emerald-800"/>{text(HEALTHCLUES_DISCLOSURE)}</div>
        <button type="button" onClick={startQuiz} className="mt-7 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#18302b] px-6 py-3 text-sm font-bold text-white hover:bg-[#25483a] sm:w-auto">{text("Begin My Adventure")} <ArrowRight className="h-4 w-4"/></button>
        <p className="mt-3 text-xs text-[#71837b]">{text("No account needed. Sensitive questions are optional, and your answers stay in this browser session.")}</p>
        {attribution.showProfile && !savedProfile && <p role="status" className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-950">{text("This browser session has no saved Discovery Profile. You can take the quiz to create one.")}</p>}
        <div className="mt-4 max-w-xl"><AnalyticsConsent compact/></div>
      </section>}

      {activeView === "quest" && <section data-world-selection className={`${styles.panel} ${styles.questPanel}`}><p className="text-xs font-black uppercase tracking-[.2em] text-emerald-900">{text("Choose where to begin")}</p><h1 className="mt-2 text-3xl font-black sm:text-4xl">{text("Two adventures are open")}</h1><p className="mt-2 text-sm text-[#526b62]">{text("Your Discovery Quiz will shape your personal journey. You can change regions later.")}</p><div className="mt-6 grid gap-3 sm:grid-cols-2">{quests.map(quest => <button key={quest.id} type="button" disabled={!quest.playable} onClick={() => chooseQuest(quest.id)} aria-pressed={quest.playable ? selectedQuest === quest.id : undefined} aria-disabled={!quest.playable} className={`${styles.questCard} group relative isolate flex flex-col justify-end rounded-2xl border p-4 text-left shadow-sm transition ${quest.playable ? "hover:-translate-y-0.5 hover:shadow-lg active:scale-[.985] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300" : "cursor-not-allowed opacity-75"} ${selectedQuest === quest.id ? "border-amber-300 ring-2 ring-amber-300" : "border-white/50"}`}><span aria-hidden="true" className={styles.questLandscape} style={{ backgroundPosition: `center, ${questMapPosition[quest.id]}` }}/><span className="absolute inset-0 -z-10 bg-gradient-to-t from-[#071713]/95 via-[#071713]/42 to-transparent" aria-hidden="true"/><span className={`${styles.questCopy} flex items-center gap-3`}><span className="grid h-10 w-10 place-items-center rounded-xl border border-white/35 bg-white/15 shadow-inner"><Sparkles className="h-5 w-5 text-amber-200" aria-hidden="true"/></span><span><span className="block text-lg font-extrabold">{text(quest.title)}</span><span className={`${styles.questRegion} mt-0.5 block text-xs font-bold uppercase tracking-wider`}>{quest.companion ? `${text("With")} ${quest.companion}` : text(quest.region)}</span></span></span><span className={`${styles.questSummary} mt-3 block max-w-[90%] text-xs leading-relaxed`}>{text(quest.summary)}</span>{!quest.playable && <span className="absolute right-3 top-3 rounded-full bg-black/55 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-amber-100">{text("Coming Soon")}</span>}</button>)}</div><p className="mt-4 text-xs leading-relaxed text-[#64776c]">{text("The Discovery Quiz asks about your interests once, then guides your personal journey.")}</p><div className="mt-5 flex items-center justify-between"><button type="button" onClick={() => setView("intro")} className="min-h-11 rounded-xl px-4 text-sm font-bold text-[#526b62] underline">{text("Back")}</button><span className="text-xs font-bold text-emerald-900">{text("Choose an open adventure")}</span></div></section>}

      {activeView === "underage" && <section className={`${styles.panel} p-6 text-center sm:p-10`}><h1 className="text-3xl font-black">{text("Thanks for letting us know.")}</h1><p className="mx-auto mt-4 max-w-xl leading-relaxed text-[#526b62]">{text("The personalized HealthClues experience is currently designed for adults aged 18 and over. No profile has been created.")}</p><button type="button" onClick={() => { setAnswers({}); setView("intro"); }} className="mt-6 rounded-xl border border-[#b8b9a2] px-5 py-3 text-sm font-bold">{text("Return")}</button></section>}

      {activeView === "general" && <section className={`${styles.panel} p-6 sm:p-10`}><p className="text-xs font-extrabold uppercase tracking-widest text-emerald-800">{text("General wellness information")}</p><h1 className="mt-3 text-3xl font-black">{text("Explore at your own pace")}</h1><p className="mt-4 leading-relaxed text-[#526b62]">{text("Because you chose not to answer the age question, HealthClues has not created a personal profile or recommendations. You can still browse general wellness information. No quiz answers were saved to your account.")}</p><div className="mt-6 flex flex-col gap-3 sm:flex-row"><Link href={locale === "vi" ? "/vi/song-khoe/huong-dan" : "/en/wellness/guides"} className={`inline-flex min-h-11 items-center justify-center rounded-xl px-5 py-3 text-sm font-bold text-white ${styles.actionPrimary}`}>{text("Browse general wellness guides")}</Link><button type="button" onClick={() => { setAnswers({}); setView("quest"); }} className="min-h-11 rounded-xl border border-[#b8b9a2] px-5 py-3 text-sm font-bold">{text("Start over")}</button></div></section>}

      {activeView === "deep_offer" && <section className={`${styles.panel} p-6 sm:p-10`}><p className="text-xs font-bold uppercase tracking-widest text-emerald-800">{text("Quick profile complete")}</p><h1 className="mt-3 text-3xl font-black">{text("Would you like to personalize it further?")}</h1><p className="mt-4 leading-relaxed text-[#526b62]">{text("You can answer up to")} {deepIds.length} {text("optional questions, including a few topic-specific questions. Skip any question or skip this section entirely.")}</p><div className="mt-7 flex flex-col gap-3 sm:flex-row"><button type="button" onClick={() => { setDeepIndex(0); setView("deep"); }} className={`inline-flex min-h-12 items-center justify-center rounded-xl px-6 py-3 text-sm font-bold ${styles.actionPrimary}`}>{text("Continue with optional questions")}</button><button type="button" onClick={finish} className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[#b8b9a2] px-6 py-3 text-sm font-bold">{text("Skip and create my profile")}</button></div><button type="button" onClick={back} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#526b62]"><ArrowLeft className="h-4 w-4"/> {text("Back")}</button></section>}

      {(activeView === "onboarding" || activeView === "deep") && question && <section className={`${styles.panel} p-5 sm:p-9`}>
        <div className="flex items-center justify-between gap-3"><p className="text-xs font-extrabold uppercase tracking-widest text-emerald-800">{text(activeView === "onboarding" ? quests.find(quest => quest.id === selectedQuest)?.region || "Your quick profile" : "Optional personalization")}</p><p className="text-xs font-semibold text-[#71837b]">{text("Question")} {stepNumber} {text("of")} {stepTotal}</p></div>
        <div className={`${styles.progressTrack} mt-3`} role="progressbar" aria-label={text("Quiz progress")} aria-valuemin={0} aria-valuemax={stepTotal} aria-valuenow={stepNumber}><div className={styles.progressFill} style={{ width: `${(stepNumber / stepTotal) * 100}%` }}/></div>
        {question.id === "C01" && <p className={styles.eligibility}><ShieldCheck className="h-4 w-4" aria-hidden="true"/>{text("Eligibility checkpoint · answer, decline, or skip")}</p>}
        <h1 className="mt-6 text-2xl font-black leading-tight sm:text-3xl">{healthCluesQuizText(locale, question.id, question.id === "C04" && attribution.suggestedTopic ? "Which health or wellness topic interests you most right now?" : question.text)}</h1>
        {question.id === "C04" && attribution.suggestedTopic && <p className="mt-2 text-sm text-[#60746d]">{text("Your ebook suggests")} {attribution.suggestedTopic}{text("; choose any topic that feels right to you.")}</p>}
        {question.id === "C03" && answers.C03 === "Another language" && <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-950">{text("HealthClues discoveries are currently available in English.")}</p>}
        {question.id === "C02" ? <div className="mt-6 space-y-3"><label htmlFor="healthclues-country" className="block text-sm font-semibold">{text("Choose or type a country (optional)")}</label><input id="healthclues-country" list="healthclues-countries" autoComplete="country-name" value={typeof value === "string" && value !== "Prefer not to say" ? value : ""} onChange={event => setAnswer(question.id, event.target.value.slice(0, 80))} placeholder={text("Start typing a country")} className="min-h-12 w-full rounded-xl border border-[#cbd9cb] px-4 text-sm outline-none focus:ring-2 focus:ring-emerald-700"/><datalist id="healthclues-countries">{countryOptions.map(country => <option key={country} value={country}/>)}</datalist><Choice selected={value === "Prefer not to say"} onClick={() => setAnswer(question.id, "Prefer not to say")}>{healthCluesQuizOption(locale, "Prefer not to say")}</Choice></div>
          : question.type === "multi" ? <div className="mt-6 space-y-2" role="group" aria-label={question.text}>{question.options.map(option => { const selected = Array.isArray(value) && value.includes(option); return <Choice key={option} selected={selected} onClick={() => toggleMulti(question.id, option, question.id === "C23")}>{healthCluesQuizOption(locale, option)}</Choice>; })}</div>
          : question.type === "text_or_none" ? <div className="mt-6 space-y-3"><input type="text" maxLength={100} value={typeof value === "string" && value !== "None" ? value : ""} onChange={event => setAnswer(question.id, event.target.value)} placeholder="Optional topic" className="min-h-12 w-full rounded-xl border border-[#cbd9cb] px-4 text-sm outline-none focus:ring-2 focus:ring-emerald-700"/><Choice selected={value === "None"} onClick={() => setAnswer(question.id, "None")}>{healthCluesQuizOption(locale, "None")}</Choice></div>
          : <div className="mt-6 space-y-2" role="group" aria-label={question.text}>{question.options.map(option => <Choice key={option} selected={value === option} onClick={() => setAnswer(question.id, option)}>{healthCluesQuizOption(locale, option)}</Choice>)}</div>}
        {isSensitiveOptional && <p className="mt-3 text-xs leading-relaxed text-[#71837b]">{text("This is optional. You can skip it without affecting your profile.")}</p>}
        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between"><button type="button" onClick={back} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#d1ddd1] px-4 py-2 text-sm font-bold"><ArrowLeft className="h-4 w-4"/> {text("Back")}</button><div className="flex gap-3"><button type="button" onClick={() => { if (question.id === "C01" && !answers.C01) setView("general"); else next(); }} className="min-h-11 rounded-xl px-4 py-2 text-sm font-semibold text-[#526b62] underline">{text("Skip")}</button><button type="button" onClick={next} disabled={question.id === "C01" && !value} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#18302b] px-5 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">{text("Next")} <ArrowRight className="h-4 w-4"/></button></div></div>
      </section>}

      {activeView === "result" && profileToShow && <>
        <section className={`${styles.panel} relative overflow-hidden p-6 sm:p-10`} aria-labelledby="hc-discovery-reveal-title"><p className="text-xs font-black uppercase tracking-[.18em] text-emerald-800">{text("Discovery reveal ·")} {text(currentQuest?.region || "Your first trail")}</p><h1 id="hc-discovery-reveal-title" className="mt-3 text-3xl font-black sm:text-4xl">{text("Your adventure is ready!")}</h1><p className="mt-4 text-lg leading-relaxed text-[#405c50]">{text("“I’ve learned a little about what interests you. We can discover more together as your journey unfolds.”")}</p><div className="mt-6 rounded-2xl border border-[#d6c68f] bg-[#fff7df] p-4"><p className="text-xs font-black uppercase tracking-widest text-[#80652f]">{text("Your chosen Quest")}</p><p className="mt-1 text-xl font-black">{text(currentQuest?.region || "Discovery Path")}</p><p className="mt-1 text-sm text-[#526b62]">{text("You’re interested in exploring")} {healthCluesQuizOption(locale, profileToShow.topic)}.</p>{profileToShow.contentPreferences[0] && <p className="mt-2 text-sm text-[#526b62]">{text("You prefer:")} {healthCluesQuizOption(locale, profileToShow.contentPreferences[0])}.</p>}</div>{(isUrgentConcern(answers) || profileToShow.safetyLevel === "urgent") ? <div role="alert" className="mt-5 rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm font-semibold leading-relaxed text-rose-950">{HEALTHCLUES_SAFETY_NOTICE}</div> : (isSafetyConcern(answers) || profileToShow.safetyLevel === "caution") ? <div role="status" className="mt-5 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm leading-relaxed text-amber-950">{text("Some answers indicate that general wellness ideas may not fit your circumstances. Please check with a qualified healthcare professional before trying food or activity changes. This quiz does not assess safety.")}</div> : null}<p className="mt-4 text-xs leading-relaxed text-[#64776c]">{text("This is a discovery starting point, not a diagnosis or treatment plan. Your answers remain in this browser until you choose to activate an account.")}</p><div className="mt-6 flex flex-col gap-3 sm:flex-row"><button type="button" onClick={openWellnessPlan} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-[#ffe9a5] to-[#e9bd5f] px-6 py-3 font-black text-[#392b13] shadow-[0_5px_0_#a67932]">{text("BUILD MY WELLNESS PLAN")} <ArrowRight className="h-5 w-5"/></button><button type="button" onClick={skipWellnessPlan} className="min-h-12 rounded-xl border border-[#d1ddd1] px-5 text-sm font-bold">{text("Skip plan and preview World")}</button></div></section>
        {attribution.showProfile && <details className="mt-4 rounded-2xl border border-[#d8d0b8] bg-[#fbf8ed]/95 p-4"><summary className="cursor-pointer font-bold text-emerald-950">{text("More about your profile and discoveries")}</summary>
        <section className={`${styles.panel} mt-4 p-6 sm:p-10`}><p className="text-xs font-extrabold uppercase tracking-widest text-emerald-800">{text("Your personal discovery profile")}</p><h2 className="mt-3 text-2xl font-black">{text("A starting point shaped around you")}</h2><p className="mt-4 leading-relaxed text-[#526b62]">{text(HEALTHCLUES_RESULT_DISCLAIMER)}</p>
        {(isUrgentConcern(answers) || profileToShow.safetyLevel === "urgent") ? <div role="alert" className="mt-6 rounded-2xl border border-rose-300 bg-rose-50 p-5 text-sm font-semibold leading-relaxed text-rose-950">{text(HEALTHCLUES_SAFETY_NOTICE)}</div> : (isSafetyConcern(answers) || profileToShow.safetyLevel === "caution") ? <div role="status" className="mt-6 rounded-2xl border border-amber-300 bg-amber-50 p-5 text-sm leading-relaxed text-amber-950">{text("Some answers indicate that general wellness ideas may not fit your circumstances. Please check with a qualified healthcare professional before trying food or activity changes. This quiz does not assess safety.")}</div> : null}
        <dl className="mt-7 grid gap-3 sm:grid-cols-2">{[["Topic of interest", healthCluesQuizOption(locale, profileToShow.topic)], ["Content interests", profileToShow.contentPreferences.length ? profileToShow.contentPreferences.map(value => healthCluesQuizOption(locale, value)).join(", ") : text("Explore a mix of resources")], ["Preferred format", healthCluesQuizOption(locale, profileToShow.presentation)], ["Comfortable time", healthCluesQuizOption(locale, profileToShow.comfortableActivityTime)], ["Refresh preference", healthCluesQuizOption(locale, profileToShow.refreshFrequency)], ["Two-week focus", healthCluesQuizOption(locale, profileToShow.twoWeekGoal)]].map(([label, value]) => <div key={label} className="rounded-2xl bg-[#f3f7f1] p-4"><dt className="text-xs font-bold uppercase tracking-wider text-emerald-800">{text(label)}</dt><dd className="mt-2 text-sm font-semibold">{value}</dd></div>)}</dl>
        <p className="mt-5 text-xs leading-relaxed text-[#71837b]">{text("Your Discovery Profile is available in this browser tab for the current session. Saving it to an account is optional and requires separate consent.")}</p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row"><button type="button" onClick={() => { setAnswers({ C04: profileToShow.topic }); saveHealthCluesSessionProfile(null); setProfile(null); setOnboardingIndex(0); setView("onboarding"); }} className="min-h-11 rounded-xl border border-[#b8cbbb] px-5 py-3 text-sm font-bold">{text("Update profile")}</button><button type="button" onClick={async () => { if (cloudSession) { try { await deleteHealthCluesProfile(cloudSession); setSaveMessage("Your saved HealthClues profile was deleted."); } catch (error) { setSaveMessage(error instanceof Error ? error.message : "Could not delete profile."); return; } } saveHealthCluesSessionProfile(null); setAnswers({}); setProfile(null); setOnboardingIndex(0); setDeepIndex(0); completionTracked.current = false; setView("intro"); }} className="min-h-11 rounded-xl px-5 py-3 text-sm font-semibold text-[#526b62] underline">{text("Clear profile and start again")}</button></div>
        <DiscoveryResults profile={profileToShow} />
        <section className="mt-7 overflow-hidden rounded-2xl border border-emerald-900/15 bg-gradient-to-br from-[#123d35] to-[#397a58] p-5 text-white shadow-lg sm:p-6"><p className="text-xs font-black uppercase tracking-[.2em] text-amber-200">{text("Next · your World awaits")}</p><h3 className="mt-2 text-2xl font-black">{text("Continue the adventure")}</h3><p className="mt-2 text-sm leading-relaxed text-emerald-50">{text("Review an optional personal plan, or skip it and preview your World.")}</p><button type="button" onClick={openWellnessPlan} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-amber-300 px-5 py-3 text-sm font-extrabold text-[#18302b] shadow-sm hover:bg-amber-200">{text("Build My Wellness Plan")} <ArrowRight className="h-4 w-4"/></button></section>
        <section className="mt-5 rounded-2xl border border-[#dce8dc] bg-[#f7faf6] p-5 sm:p-6"><h2 className="text-xl font-black">{text("Continue in your dashboard")}</h2><p className="mt-2 text-sm leading-relaxed text-[#526b62]">{text("Save your profile to your Botly account to return to reviewed discoveries and keep a private check-in history.")}</p><Link href={localeHealthCluesPath("/en/wellness/healthclues/dashboard", locale)} className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-[#18302b] px-5 py-3 text-sm font-bold text-white">{text("Open My Dashboard")}</Link></section>
        <section className="mt-5 rounded-2xl border border-[#dce8dc] p-5 sm:p-6"><h2 className="text-xl font-black">{text("Save My Profile")}</h2><p className="mt-2 text-sm leading-relaxed text-[#526b62]">{text("You can keep viewing this profile without an account. Saving sends your topic, preferences, selected food avoidances, and a practical-content safety hold derived from optional answers to your signed-in Botly account for HealthClues personalization. It does not include your full answer set and is not joined to ebook delivery email or marketing.")}</p><label className="mt-4 flex items-start gap-3 text-sm leading-relaxed"><input type="checkbox" checked={consent} onChange={event => setConsent(event.target.checked)} className="mt-1 h-4 w-4 accent-emerald-800"/><span>{text("I agree to save this HealthClues profile to my Botly account. I can delete it later.")}</span></label>{!cloudSession && <form className="mt-4 flex flex-col gap-3 sm:flex-row" onSubmit={async event => { event.preventDefault(); if (!consent || !cloudEnabled) return; setSaveBusy(true); try { sessionStorage.setItem("healthclues-pending-profile", "1");   await sendMagicLink(saveEmail, locale, "healthclues-save-profile"); setSaveMessage("Check your inbox for a secure sign-in link. Return on this device to complete saving your profile."); } catch (error) { sessionStorage.removeItem("healthclues-pending-profile"); setPendingSave(false);   setSaveMessage(error instanceof Error ? error.message : "Could not send the sign-in link."); } finally { setSaveBusy(false); } }}><input required type="email" value={saveEmail} onChange={event => setSaveEmail(event.target.value)} placeholder="Email for your Botly account" className="min-h-11 flex-1 rounded-xl border border-[#cbd9cb] px-4 text-sm"/><button disabled={!consent || !cloudEnabled || saveBusy} className="min-h-11 rounded-xl bg-[#18302b] px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{saveBusy ? "Sending…" : "Continue to account"}</button></form>}{cloudSession && <button type="button" disabled={!consent || saveBusy} onClick={async () => { if (!consent) return; setSaveBusy(true); try { await saveHealthCluesProfile(profileToShow, new Date().toISOString(), cloudSession); setSaveMessage("Your profile was saved to your Botly account."); sessionStorage.removeItem("healthclues-pending-profile"); setPendingSave(false);    } catch (error) { setSaveMessage(error instanceof Error ? error.message : "Could not save profile."); } finally { setSaveBusy(false); } }} className="mt-4 min-h-11 rounded-xl bg-[#18302b] px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{text("Save to my account")}</button>}{saveMessage && <p role="status" className="mt-3 rounded-xl bg-[#f3f7f1] p-3 text-sm">{saveMessage}</p>}{pendingSave && cloudSession && <p className="mt-3 text-sm font-semibold text-emerald-900">{text("You are signed in. Review this profile and choose Save to my account to complete your request.")}</p>}<p className="mt-3 text-xs text-[#71837b]">{text("Consent version: HealthClues profile saving v1. This does not save your full quiz answers.")}</p></section>
        </section></details>}
      </>}
      {activeView === "wellness_plan" && profileToShow && <WellnessPlanBuilder profile={profileToShow} questId={selectedQuest || "health-concern"} onBack={() => setView("result")} onSkip={skipWellnessPlan} onConfirm={confirmWellnessPlan}/>}
      {activeView === "world_preview" && profileToShow && <HealthCluesWorldPreview questId={selectedQuest || "health-concern"} profile={profileToShow} wellnessPlan={confirmedWellnessPlan} onBack={() => window.history.back()} onVerificationRequested={email => { activationPending.current = true; activationEmail.current = email; }}/ >}
       </div>
      </div>
    </div>
  </main>;
}

function Choice({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" aria-pressed={selected} onClick={onClick} className={`flex min-h-12 w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm font-semibold transition ${selected ? "border-emerald-800 bg-[#edf4ec] text-[#18302b]" : "border-[#dce8dc] bg-white hover:border-emerald-700"}`}><span>{children}</span>{selected && <Check aria-hidden="true" className="h-4 w-4 text-emerald-800"/>}</button>;
}

function DiscoveryResults({ profile }: { profile: HealthCluesProfile }) {
  const { locale, text } = useHealthCluesLocale();
  const [items, setItems] = useState<DiscoveryContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);
  const [skipped, setSkipped] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<Record<string, DiscoveryStatus>>({});
  const [notice, setNotice] = useState("");
  const discoveryLoading = locale === "vi" ? false : loading;
  const discoveryUnavailable = locale === "vi" ? true : unavailable;
  useEffect(() => {
    if (locale === "vi") return;
    let cancelled = false;
    fetch("/api/healthclues/discoveries", { cache: "no-store" }).then(async response => {
      const result = await response.json();
      if (!response.ok) throw new Error("unavailable");
      if (!cancelled) setItems(Array.isArray(result.items) ? result.items as DiscoveryContent[] : []);
    }).catch(() => { if (!cancelled) setUnavailable(true); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [locale]);
  const matches = useMemo(() => locale === "vi" ? [] : matchHealthCluesDiscoveries(profile, items.filter(item => !skipped.includes(item.id))), [locale, profile, items, skipped]);
  const category = (item: DiscoveryContent) => item.contentType === "recipe" || item.contentType === "ebook" ? "Food or Recipe Discovery" : item.contentType === "activity" ? "Everyday Wellness Activity" : "Research & Learn";
  const why = (item: DiscoveryContent) => `This reviewed ${item.contentType === "ebook" ? "reading guide" : item.contentType} matches your ${profile.topic} interest${profile.contentPreferences.length ? ` and ${profile.contentPreferences.join(", ")} preference` : ""}.`;
  return <section className="mt-8 border-t border-[#dce8dc] pt-7"><h2 className="text-2xl font-black">{text("Your First Discoveries")}</h2><p className="mt-2 text-sm leading-relaxed text-[#526b62]">{text("A few reviewed resources matched to the interests and preferences you shared.")}</p>
    {discoveryLoading ? <p role="status" className="mt-5 rounded-xl bg-[#f3f7f1] p-4 text-sm">{text("Finding reviewed resources…")}</p> : matches.length ? <div className="mt-5 grid gap-4">{matches.map(item => <article key={item.id} className="rounded-2xl border border-[#dce8dc] bg-white p-5"><p className="text-xs font-extrabold uppercase tracking-wider text-emerald-800">{text(category(item))}{item.contentType === "ebook" ? " · READING GUIDE" : ` · ${item.contentType}`}</p><h3 className="mt-2 text-lg font-bold">{item.title}</h3><p className="mt-2 text-sm leading-relaxed text-[#526b62]">{item.summary}</p>{item.evidence.sources.length > 0 && <ul className="mt-2 list-inside list-disc text-sm">{item.evidence.sources.map(source => <li key={source.url}><a className="underline" href={source.url} target="_blank" rel="noreferrer">{source.label}</a></li>)}</ul>}<p className="mt-3 text-sm"><strong>{text("Why am I seeing this?")}</strong> {why(item)}</p><p className="mt-2 text-sm">{discoveryTimeLabel(item)}</p>{item.ingredients.length > 0 && <p className="mt-2 text-sm"><strong>{text("Ingredients:")}</strong> {item.ingredients.join(", ")}</p>}{item.instructions.length > 0 && <div className="mt-3 text-sm"><strong>{text("Steps / practice:")}</strong><ol className="mt-1 list-decimal space-y-1 pl-5">{item.instructions.map((step, index) => <li key={`${item.id}-${index}`}>{step}</li>)}</ol></div>}{item.restrictions.length > 0 && <p className="mt-2 text-sm text-amber-900"><strong>{text("Restrictions:")}</strong> {item.restrictions.join("; ")}</p>}{item.safetyNotes && <p className="mt-2 text-sm text-amber-900"><strong>{text("Safety note:")}</strong> {item.safetyNotes}</p>}<div className="mt-4 flex flex-wrap gap-2"><a href={item.url} target={item.url.startsWith("http") ? "_blank" : undefined} rel={item.url.startsWith("http") ? "noreferrer" : undefined} className="inline-flex min-h-10 items-center rounded-lg bg-[#18302b] px-4 text-sm font-bold text-white">{item.contentType === "activity" || item.contentType === "recipe" ? "View" : "Read"}</a><button type="button" onClick={() => { setStatuses(current => ({ ...current, [item.id]: "Saved" })); setNotice("Saved for this session only. It has not been added to your account."); }} className="min-h-10 rounded-lg border border-[#b8cbbb] px-3 text-sm font-semibold">{text("Save for Later")}</button>{(item.contentType === "activity" || item.contentType === "recipe") && <button type="button" onClick={() => { setStatuses(current => ({ ...current, [item.id]: "Tried" })); setNotice("Marked as tried for this session only."); }} className="min-h-10 rounded-lg border border-[#b8cbbb] px-3 text-sm font-semibold">{text("I&apos;ve Tried It")}</button>}<button type="button" onClick={() => { setStatuses(current => ({ ...current, [item.id]: "Not tried" })); setNotice("Marked Not Yet for this session only."); }} className="min-h-10 rounded-lg border border-[#b8cbbb] px-3 text-sm font-semibold">{text("Not Yet")}</button><button type="button" onClick={() => { setSkipped(current => [...current, item.id]); setNotice("Showing another matching option when one is available."); }} className="min-h-10 rounded-lg px-3 text-sm font-semibold text-[#526b62] underline">{text("Try Something Else")}</button></div>{statuses[item.id] && <p className="mt-2 text-xs text-[#71837b]">{text("Current session status:")} {text(statuses[item.id])}</p>}</article>)}</div> : <div className="mt-5 rounded-2xl border border-[#dce8dc] bg-[#f7faf6] p-5"><p className="text-sm leading-relaxed text-[#526b62]">{text(discoveryUnavailable ? "The reviewed discovery library is temporarily unavailable. You can still explore the HealthClues library directly." : skipped.length ? "There are no other reviewed resources matching this profile right now." : "We do not have a reviewed item that fits this combination yet. Browse the library to find a resource that feels right for you.")}</p><div className="mt-4 flex flex-wrap gap-3"><Link href={locale === "vi" ? "/vi/song-khoe/huong-dan" : "/en/wellness/guides"} className="font-semibold text-emerald-900 underline">{text("Explore Wellness Guides")}</Link><Link href={locale === "vi" ? "/vi/song-khoe/ebooks" : "/en/wellness/ebooks"} className="font-semibold text-emerald-900 underline">{text("Explore Free Ebooks")}</Link></div></div>}
    {notice && <p role="status" className="mt-3 rounded-lg bg-[#f3f7f1] p-3 text-sm">{text(notice)}</p>}<p className="mt-3 text-xs text-[#71837b]">{text("Card choices last only while this result is open in your browser tab. They are not saved to your account.")}</p></section>;
}
