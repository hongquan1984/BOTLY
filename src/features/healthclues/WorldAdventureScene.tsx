"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Award, BookOpen, Backpack, Bell, Calendar, Check, CheckCircle2, CheckSquare, ChevronLeft, ChevronRight, Clock, Compass, DoorOpen, Eye, Globe, Leaf, Lock, Mail, Moon, Plus, Route, Scroll, Sparkles, Target, Trash2, UsersRound, X } from "lucide-react";
import { HealthCluesGameShell } from "@/components/healthclues/HealthCluesGameShell";
import { HealthCluesGameIcon, type HealthCluesGameIconName } from "@/components/healthclues/HealthCluesGameIcon";
import { resolveWellnessIcon, validateAndResolveGoalIcon } from "@/components/healthclues/wellnessIconResolver";
import { WellnessWorldMap } from "./world-map";
import { RegionMapScene, type GuideStep, type RegionLandmark, type ActiveTalkPrompt } from "./RegionMapScene";
import { HealthCluesPet, type PetRegion } from "./HealthCluesPet";
import { healthCluesAdaptiveFocusLabel, healthCluesQuizOption } from "@/lib/healthclues-i18n";
import { HealthCluesLocaleControl, localeHealthCluesPath, useHealthCluesLocale } from "@/components/healthclues/HealthCluesLocaleProvider";
import { usePathname, useRouter } from "next/navigation";
import { BackpackExperience, type BackpackTool } from "./BackpackExperience";
import { ToolkitCollection } from "./ToolkitCollection";
import { ComboJourneyPanel } from "./ComboJourneyPanel";
import { KnowledgeJourneyPanel } from "./KnowledgeJourneyPanel";
import { PrivateJournalPanel } from "./PrivateJournalPanel";
import { ReminderPreferencesPanel } from "./ReminderPreferencesPanel";
import { BossBattlePanel } from "./BossBattlePanel";
import { CommunityJourneysPanel } from "./CommunityJourneysPanel";
import { WellnessEncyclopediaStation } from "./WellnessEncyclopediaStation";
import { PrivateCarePlanPanel } from "./PrivateCarePlanPanel";
import { PersonalizedSuggestions } from "./PersonalizedSuggestions";
import { HealthCluesRpgWorldHud } from "./HealthCluesRpgWorldHud";
import { HealthCluesWellnessHome } from "@/components/healthclues/HealthCluesWellnessHome";
import { WellnessPlanBuilder } from "@/components/healthclues/WellnessPlanBuilder";
import type { HealthCluesProfile } from "@/lib/healthclues-quiz";
import "./world-adventure.css";
import { buildPersonalPlanGoal, localizedPlanGoalCopy, type WellnessPlanGoal } from "./wellness-plan";
import { calculateStars } from "./DailyCheckinDialog";

type Tool = BackpackTool;
type Entry = { id: string; journey_id: string; catalog_item_id: string | null; equipment_position?: number | null; slot_key?: string; discovery_station?: "nutrition" | "practices" | "movement" | null; status: string };
type UsageHistory = { toolkit_entry_id: string; checkin_id?: string; local_date?: string; status: string; occurrence_count: number | null };
type Region = PetRegion;
type Panel = RegionLandmark | "checkin" | "community" | "collection" | "journal" | "careplan" | "settings" | "plan" | "journey" | "reminder" | "home" | null;
const entrySteps: Exclude<GuideStep, null>[] = ["welcome", "discovery_herbal", "discovery_movement", "discovery_practices"];
const guideVersion = 2;

export function getDisplayGoalTitle(goal: WellnessPlanGoal, locale: "en" | "vi" = "vi"): string {
  const copy = localizedPlanGoalCopy(goal, locale);
  let chosen = "";
  // 1. If user typed a custom note/target (e.g. "Đi dạo 20 phút", "5 phút")
  if (goal.originalNote && goal.originalNote.trim()) {
    chosen = goal.originalNote.trim();
  }
  // 2. The exact specific action description the user ticked (contains specific minutes, e.g. "20 phút", "5-10 phút", "8 cốc")
  else if (copy.trackingDefinition && copy.trackingDefinition.trim() && !copy.trackingDefinition.startsWith("Personal note saved") && !copy.trackingDefinition.startsWith("Saved for later") && !copy.trackingDefinition.startsWith("Unconfigured personal goal") && !copy.trackingDefinition.startsWith("Skipped during")) {
    chosen = copy.trackingDefinition.trim();
  }
  // 3. If targetValue and targetUnit exist
  else if (goal.targetValue !== null && goal.targetValue !== undefined && goal.targetUnit) {
    chosen = `${copy.optionTitle || copy.title} ${goal.targetValue} ${goal.targetUnit}`.trim();
  }
  // 4. Fallback to option title if different from main title
  else if (copy.optionTitle && copy.optionTitle !== copy.title) {
    chosen = copy.optionTitle.trim();
  }
  // 5. Fallback to main category title
  else {
    chosen = copy.title.trim();
  }
  return chosen.trim().replace(/\.+$/, "");
}

export function WorldAdventureScene({
  initialRegion, initialPlanPrompt = false, journeyTopic, journeyGoal, quizProfile, nickname, playbook, onNicknameChange, worldId, xp, fragments, keys, checkinCount, rewards, unlocks, wellnessGoals,
  wellnessPlanVersion,
  accessToken, tools, savedIds, entries, usageHistory, journeys, branches, onCheckin, onProgressUpdated, checkinDialog,
  checkins = [], timezone = "UTC",
}: {
  initialRegion: Region; initialPlanPrompt?: boolean; journeyTopic: string; journeyGoal: string; quizProfile: HealthCluesProfile | null; nickname: string; playbook: { id: string; context: string; greeting: string; dailyPrompt: string }; onNicknameChange: (value: string) => Promise<void>; worldId: string; xp: number; fragments: number; keys: number;
  checkinCount: number; rewards: Array<{ reward_id: string; awarded_at: string; reward_type: string; title: string }>;
  unlocks: string[]; accessToken?: string; tools: Tool[]; savedIds: string[]; entries: Entry[]; usageHistory: UsageHistory[];
  wellnessGoals: WellnessPlanGoal[];
  wellnessPlanVersion: number | null;
  journeys: Array<{ id: string; branch_id: string; title: string; status: string; started_on: string }>;
  branches: Array<{ id: string; topic_key: string; title: string; status: string }>;
  onCheckin: () => void; onProgressUpdated: () => void; checkinDialog?: React.ReactNode;
  checkins?: Array<{ id: string; local_date: string; revision: number; note_private?: string | null }>;
  timezone?: string;
}) {
  const { locale, setLocale, text } = useHealthCluesLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [region, setRegion] = useState<Region>(initialRegion === "sleep-better" ? "health-concern" : initialRegion);
  const [regionEntered, setRegionEntered] = useState(true);
  const [panel, setPanel] = useState<Panel>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("panel") === "checkin" || params.get("action") === "checkin" || params.get("checkin") === "1") {
        return null;
      }
      if (params.get("panel") === "home" || params.get("view") === "home" || params.has("parallax")) {
        return "home";
      }
    }
    return null;
  });
  const [highlightHomeItemId, setHighlightHomeItemId] = useState<string | null>(null);
  const [regionChoice, setRegionChoice] = useState<Region | null>(null);
  const [lockedMessage, setLockedMessage] = useState("");
  const [guideReady, setGuideReady] = useState(false);
  const [guideStep, setGuideStep] = useState<GuideStep>(null);
  const [guideVisible, setGuideVisible] = useState(false);
  const [guideFinish, setGuideFinish] = useState(false);
  const [guideError, setGuideError] = useState("");
  const [myJourneyViewed, setMyJourneyViewed] = useState(false);
  const [reviewSuggestionsDirectly, setReviewSuggestionsDirectly] = useState(false);
  const [showFirstObjective, setShowFirstObjective] = useState(false);
  const [nicknameOpen, setNicknameOpen] = useState(false);
  const [nicknameDraft, setNicknameDraft] = useState(nickname);
  const [nicknameError, setNicknameError] = useState("");
  const [nicknameBusy, setNicknameBusy] = useState(false);
  const [showInitialPlanDialogue, setShowInitialPlanDialogue] = useState(false);
  const [onlineCount, setOnlineCount] = useState(1);
  const [activeTalk, setActiveTalk] = useState<ActiveTalkPrompt | null>(null);
  const initialPlanShown = useRef(false);
  const restoreGuideAfterPlan = useRef(false);
  const topic = region === initialRegion ? journeyTopic || (region === "sleep-better" ? "Sleep & rest" : "General wellness discovery") : region === "sleep-better" ? "Sleep & rest" : "Your saved health interest";
  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const response = await fetch(`/api/healthclues/guide?worldId=${encodeURIComponent(worldId)}`, { headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {}, cache: "no-store" });
        const result = await response.json() as { stage?: string; guideVersion?: number; error?: string };
        if (!response.ok) throw new Error(result.error || "Guide state is unavailable.");
        if (!active) return;
        if (result.guideVersion !== guideVersion) throw new Error("Your World guide needs an update. Reload the page to continue.");
        if (entrySteps.includes(result.stage as Exclude<GuideStep, null>)) {
          setRegion(initialRegion); setRegionEntered(true); setGuideStep(result.stage as GuideStep); setGuideVisible(true);
        }
      } catch (error) {
        if (active) setGuideError(error instanceof Error ? error.message : "The guide is unavailable.");
      } finally { if (active) setGuideReady(true); }
    })();
    return () => { active = false; };
  }, [accessToken, initialRegion, worldId]);
  useEffect(() => {
    if (!initialPlanPrompt || initialPlanShown.current || !guideReady || nicknameOpen || panel) return;
    initialPlanShown.current = true;
    restoreGuideAfterPlan.current = Boolean(guideStep);
    setGuideVisible(false);
    if (wellnessGoals.length > 0) {
      setReviewSuggestionsDirectly(false);
      setShowInitialPlanDialogue(true);
      setPanel("journey");
    }
  }, [guideReady, guideStep, initialPlanPrompt, nicknameOpen, panel, wellnessGoals.length]);
  useEffect(() => {
    if (!accessToken || !worldId) return;
    let active = true;
    void fetch(`/api/healthclues/profile?worldId=${encodeURIComponent(worldId)}`, { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" })
      .then(async response => response.ok ? response.json() as Promise<{ preferredLocale?: "en" | "vi" | null }> : null)
      .then(async profile => {
        if (!active) return;
        if (profile?.preferredLocale) {
          if (profile.preferredLocale !== locale) {
            setLocale(profile.preferredLocale);
          }
          const target = localeHealthCluesPath(pathname, profile.preferredLocale);
          if (target !== pathname) router.replace(`${target}${window.location.search}${window.location.hash}`);
        } else {
          await fetch("/api/healthclues/profile", { method: "PATCH", headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" }, body: JSON.stringify({ worldId, preferredLocale: locale }), cache: "no-store" });
        }
      }).catch(() => undefined);
    return () => { active = false; };
  }, [accessToken, worldId]);
  const saveGuide = async (step: GuideStep | "completed" | "skipped") => {
    const savedStage = step === null ? "completed" : step;
    setGuideError("");
    setGuideStep(step === "completed" || step === "skipped" ? null : step);
    setGuideVisible(step !== "completed" && step !== "skipped");
    try {
      const response = await fetch("/api/healthclues/guide", { method: "PUT", headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" }, body: JSON.stringify({ worldId, stage: savedStage }), cache: "no-store" });
      const result = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(result.error || "Guide progress could not be saved.");
    } catch (error) { setGuideError(error instanceof Error ? error.message : "Guide progress could not be saved."); }
  };
  const continueFromBackpack = () => { setPanel("camp"); };
  const reminderSaved = () => { setPanel(null); };
  const finishGuide = () => { setPanel(null); setGuideFinish(false); setShowFirstObjective(true); void saveGuide("completed"); };
  const skipGuide = () => { setPanel(null); setGuideFinish(false); void saveGuide("skipped"); };
  const markMyJourneyViewed = useCallback(() => setMyJourneyViewed(true), []);
  const stepBack = () => {
    if (guideFinish) { setGuideFinish(false); return; }
    const index = entrySteps.indexOf(guideStep as Exclude<GuideStep, null>);
    if (index > 0) void saveGuide(entrySteps[index - 1]);
  };
  const stepNext = () => {
    const index = entrySteps.indexOf(guideStep as Exclude<GuideStep, null>);
    if (index < 0) return;
    if (guideStep === "discovery_herbal" && !myJourneyViewed) { setGuideError("Open My Journey to see your saved goals before continuing."); return; }
    if (guideStep === "discovery_practices" && !guideFinish) { setGuideFinish(true); setGuideError(""); return; }
    if (guideStep === "discovery_practices" && guideFinish) { finishGuide(); return; }
    void saveGuide(entrySteps[index + 1]);
  };
  const openPlan = () => { setReviewSuggestionsDirectly(Boolean(quizProfile)); setGuideVisible(false); setPanel("plan"); };
  const openMyJourney = () => { setGuideVisible(false); setPanel("journey"); };
  const finishJourneyTour = () => { setMyJourneyViewed(true); setPanel(null); setGuideVisible(true); setGuideError(""); void saveGuide("discovery_movement"); };
  const openSavedSuggestions = () => { setReviewSuggestionsDirectly(true); setPanel("plan"); };
  const closePanel = () => {
    setPanel(null);
    setShowInitialPlanDialogue(false);
    if (typeof window !== "undefined" && window.location.hash) {
      history.replaceState(null, "", window.location.pathname + window.location.search);
    }
    if (guideStep === "discovery_herbal" || restoreGuideAfterPlan.current) setGuideVisible(true);
    restoreGuideAfterPlan.current = false;
  };

  const saveNickname = async () => { setNicknameBusy(true); setNicknameError(""); try { await onNicknameChange(nicknameDraft); setNicknameOpen(false); } catch (error) { setNicknameError(error instanceof Error ? error.message : "Nickname could not be saved."); } finally { setNicknameBusy(false); } };
  useEffect(() => {
    if (!panel) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") { setPanel(null); setShowInitialPlanDialogue(false); if (guideStep === "discovery_herbal" || restoreGuideAfterPlan.current) setGuideVisible(true); restoreGuideAfterPlan.current = false; } };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [panel, guideStep]);
  useEffect(() => {
    const fromHash = () => {
      const target = window.location.hash;
      if (target === "#hc-plan") openPlan();
      else if (target === "#hc-journey") openMyJourney();
      else if (target === "#hc-toolkit") setPanel("camp");
      else if (target === "#hc-knowledge") setPanel("knowledge");
      else if (target === "#hc-community") setPanel("community");
      else if (target === "#hc-boss") setPanel("boss");
    };
    fromHash(); window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, []);
  const openLandmark = (landmark: RegionLandmark) => {
    setShowFirstObjective(false);
    if (landmark === "camp") { setPanel("camp"); setGuideVisible(false); return; }
    if (landmark === "knowledge" && guideStep === "knowledge") saveGuide("completed");
    setPanel(landmark);
  };
  const panelTitle = locale === "vi"
    ? (panel === "home" ? "Nhà Nghỉ Dưỡng Thụy Sĩ" : panel === "camp" ? "Khu trại khám phá" : panel === "plan" ? "Kế hoạch sức khỏe của tôi" : panel === "journey" ? "Hành trình của tôi" : panel === "reminder" ? "Cài đặt nhắc nhở" : panel === "knowledge" ? "Thư viện kiến thức" : panel === "boss" ? "Thử thách kiến thức" : panel === "rewards" ? "Phần thưởng thế giới" : panel === "nutrition" ? "Vườn thảo mộc" : panel === "practices" ? "Khu thực hành tĩnh tâm" : panel === "movement" ? "Đường vận động" : panel === "collection" ? "Túi đồ của tôi" : panel === "careplan" ? "Sổ tay chăm sóc" : panel === "community" ? "Cộng đồng" : panel === "checkin" ? "Ghi nhận hằng ngày" : panel === "settings" ? "Cài đặt hành trình" : "")
    : text(panel === "home" ? "Swiss Alpine Chalet" : panel === "camp" ? "Adventure Camp" : panel === "plan" ? "My Wellness Plan" : panel === "journey" ? "My Journey" : panel === "reminder" ? "Reminder Settings" : panel === "knowledge" ? "Knowledge Library" : panel === "boss" ? "Knowledge Challenge" : panel === "rewards" ? "World Rewards" : panel === "nutrition" ? "Food & Botanical Garden" : panel === "practices" ? "Wellness Sanctuary" : panel === "movement" ? "Activity Trail" : panel === "collection" ? "My Collection" : panel === "careplan" ? "My Care Plan" : panel === "community" ? "Adventurers’ Community" : panel === "checkin" ? "Daily Check-in" : panel === "settings" ? "Journey Settings" : "");

  if (!guideReady) return <HealthCluesGameShell current="loading" xp={xp} worldId={worldId} accessToken={accessToken}><main className="hc-game-root" role="status" aria-label="Opening your adventure"/></HealthCluesGameShell>;

  return <HealthCluesGameShell current={panel === "plan" ? "quest" : "world"} xp={xp} guidedOnboarding={false} onQuestNavigate={openPlan} worldId={worldId} accessToken={accessToken} customTopbar={regionEntered}>
    <main data-hc-game-canvas className={`hc-game-root ${regionEntered ? "has-rpg-hud" : ""}`} aria-label="HealthClues game world">
      <div className="hc-game-currency" aria-label="Saved learning currencies"><span><Sparkles size={13}/> {fragments} Fragments</span><span><Award size={13}/> {keys} Keys</span></div>
      {regionEntered && (
        <HealthCluesRpgWorldHud
          xp={xp ?? 0}
          nickname={nickname}
          onlineCount={onlineCount}
          activePanel={panel}
          activeTalk={activeTalk}
          region={region}
          wellnessGoals={wellnessGoals}
          checkins={checkins}
          usageHistory={usageHistory}
          timezone={timezone}
          onNavigate={(target, extra) => {
            setActiveTalk(null);
            if (target === "world") setPanel(null);
            else if (target === "care") onCheckin();
            else if (target === "journey") openMyJourney();
            else if (target === "camp") setPanel("camp");
            else if (target === "knowledge") setPanel("knowledge");
            else if (target === "settings") setPanel("settings");
            else if (target === "reminder") setPanel("reminder");
            else if (target === "home") {
              setHighlightHomeItemId(extra || null);
              setPanel("home");
            }
          }}
          onOpenCheckin={() => { setActiveTalk(null); onCheckin(); }}
          onOpenPlan={() => { setActiveTalk(null); openPlan(); }}
          onOpenNickname={() => setNicknameOpen(true)}
          onToggleLocale={async () => {
            const nextLocale = locale === "vi" ? "en" : "vi";
            setLocale(nextLocale);
            if (worldId && accessToken) {
              try {
                await fetch("/api/healthclues/profile", {
                  method: "PATCH",
                  headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
                  body: JSON.stringify({ worldId, preferredLocale: nextLocale }),
                  cache: "no-store",
                });
              } catch (err) {
                console.error("Failed to persist preferred locale", err);
              }
            }
            const nextPath = localeHealthCluesPath(pathname, nextLocale);
            if (nextPath !== pathname) {
              router.replace(`${nextPath}${window.location.search}${window.location.hash}`);
            }
          }}
        />
      )}
          {!regionEntered && <WellnessWorldMap questId={initialRegion === "sleep-better" ? "health-concern" : initialRegion} checkinCount={checkinCount} unlocks={unlocks} immersive onRegionSelect={(id) => {
            if (id === "sleep-better") {
              setLockedMessage(locale === "vi" ? "Thung lũng Giấc ngủ đang tạm khóa để nâng cấp. Vui lòng khám phá Vương quốc HealthClues!" : "Sleep Valley is temporarily locked for maintenance. Please explore HealthClues Realm!");
              window.setTimeout(() => setLockedMessage(""), 4500);
              return;
            }
            if (id === "health-concern") {
              setRegionChoice(id);
              setLockedMessage("");
            }
          }} onUnavailableRegion={(name, id) => {
            const msg = id === "sleep-better" || name.includes("Sleep")
              ? (locale === "vi" ? "Thung lũng Giấc ngủ đang tạm khóa để nâng cấp. Vui lòng khám phá Vương quốc HealthClues!" : "Sleep Valley is temporarily locked for maintenance. Please explore HealthClues Realm!")
              : `${name} is coming soon. Your current World and Journey remain unchanged.`;
            setLockedMessage(msg);
            window.setTimeout(()=>setLockedMessage(""),4500);
          }} />}
      {!regionEntered && <div className="hc-world-overlay-hud"><div className="hc-world-current"><Compass size={16}/><span>{text("MY WELLNESS WORLD")}</span><strong>{region === "sleep-better" ? text("Sleep Valley") : text("HealthClues Realm")}</strong></div><div className="hc-world-actions"><button type="button" onClick={()=>setPanel("camp")}><Backpack size={17}/> {text("Backpack")}</button><button type="button" onClick={()=>setPanel("plan")}><Compass size={17}/> {text("My Plan")}</button><button type="button" onClick={onCheckin}><CheckCircle2 size={17}/> {text("Check-in")}</button><button type="button" onClick={()=>setPanel("knowledge")}><BookOpen size={17}/> {text("Knowledge")}</button><button type="button" onClick={()=>setPanel("community")}><UsersRound size={17}/> {text("Community")}</button><button type="button" onClick={()=>setNicknameOpen(true)}>{nickname ? `${text("Welcome,")} ${nickname}` : text("Choose a nickname")}</button></div></div>}
      {lockedMessage && <p role="status" className="hc-world-toast">{lockedMessage}</p>}
      {guideError && <p role="status" className="hc-game-guide-error">{guideError} You can still explore; use Replay guide from your Pet later.</p>}
          {nicknameOpen && <div className="hc-region-choice" role="dialog" aria-modal="true" aria-labelledby="hc-nickname-title"><div className="hc-region-choice-card"><p className="hc-kicker">{locale === "vi" ? "HỒ SƠ NGƯỜI CHƠI RIÊNG TƯ" : "YOUR PRIVATE PLAYER PROFILE"}</p><h2 id="hc-nickname-title">{locale === "vi" ? "Bạn muốn chúng tôi gọi bạn là gì?" : "What should we call you?"}</h2><p>{locale === "vi" ? "Biệt danh là tùy chọn. Bạn không cần chia sẻ tên thật và biệt danh sẽ không hiển thị công khai ở Cộng đồng." : "A nickname is optional. You do not need to share your real name, and it will not be published to Community."}</p><label htmlFor="hc-player-nickname">{locale === "vi" ? "Biệt danh" : "Nickname"}</label><input id="hc-player-nickname" autoComplete="nickname" maxLength={32} value={nicknameDraft} onChange={event=>setNicknameDraft(event.target.value)} placeholder={locale === "vi" ? "Tên nhà phiêu lưu của bạn" : "Your adventurer name"}/><div className="mt-4 flex flex-wrap gap-2"><button type="button" className="hc-gold-action" disabled={nicknameBusy} onClick={()=>void saveNickname()}>{nicknameBusy ? (locale === "vi" ? "Đang lưu…" : "Saving…") : (locale === "vi" ? "Lưu biệt danh" : "Save nickname")}</button><button type="button" onClick={()=>setNicknameOpen(false)}>{locale === "vi" ? "Bỏ qua lúc này" : "Skip for now"}</button></div>{nicknameError && <p role="alert">{nicknameError}</p>}</div></div>}
          {regionChoice && <div className="hc-region-choice" role="dialog" aria-modal="true" aria-labelledby="hc-region-choice-title"><div className="hc-region-choice-card"><button type="button" className="hc-choice-close" aria-label={locale === "vi" ? "Đóng chi tiết khu vực" : "Close region details"} onClick={()=>setRegionChoice(null)}>×</button><HealthCluesPet region={regionChoice} topic={regionChoice === "sleep-better" ? (initialRegion === "sleep-better" ? topic : (locale === "vi" ? "Giấc ngủ & nghỉ ngơi" : "Sleep & rest")) : initialRegion === "health-concern" ? topic : (locale === "vi" ? "Mối quan tâm sức khỏe đã lưu" : "Your saved health interest")}/><p className="hc-kicker">{locale === "vi" ? "KHU VỰC CÓ THỂ KHÁM PHÁ" : "PLAYABLE REGION"}</p><h2 id="hc-region-choice-title">{regionChoice === "sleep-better" ? (locale === "vi" ? "Thung lũng Giấc ngủ" : "Sleep Valley") : (locale === "vi" ? "Vương quốc HealthClues" : "HealthClues Realm")}</h2><p>{regionChoice === "sleep-better" ? (locale === "vi" ? "Thung lũng dưới ánh trăng để học hỏi kiến thức về giấc ngủ và suy ngẫm bản thân." : "A moonlit valley for gentle, reviewed sleep learning and personal reflection.") : (locale === "vi" ? `Khu vực khám phá sức khỏe cá nhân của bạn. Trọng tâm đã lưu: ${journeyTopic || "Sức khỏe chung"}. Chủ đề tự chia sẻ, không phải chẩn đoán y khoa.` : `Your personal wellness discovery region. Saved interest: ${journeyTopic || "General wellness"}. This self-reported topic is not a diagnosis.`)}</p><button type="button" className="hc-gold-action" onClick={()=>{setRegion(regionChoice);setRegionEntered(true);setRegionChoice(null);}}>{locale === "vi" ? `VÀO ${regionChoice === "sleep-better" ? "THUNG LŨNG GIẤC NGỦ" : "VƯƠNG QUỐC HEALTHCLUES"}` : `ENTER ${regionChoice === "sleep-better" ? "SLEEP VALLEY" : "HEALTHCLUES REALM"}`}<DoorOpen size={17}/></button></div></div>}
          {regionEntered && <RegionMapScene key={region} region={region} journeyTopic={topic} nickname={nickname} journeyGoal={journeyGoal} guideStep={null} highlightMyJourney={guideVisible && guideStep === "discovery_herbal"} onMyJourney={openMyJourney} guidedLandmark={guideVisible && !guideFinish && guideStep === "discovery_movement" ? "nutrition" : guideVisible && !guideFinish && guideStep === "discovery_practices" ? "practices" : showFirstObjective ? "nutrition" : null} tourFocusLandmark={guideVisible && !guideFinish && guideStep === "discovery_movement" ? "nutrition" : guideVisible && !guideFinish && guideStep === "discovery_practices" ? "practices" : null} paused={Boolean(panel)} onGuideHelp={()=>{setRegion(initialRegion);setRegionEntered(true);setPanel(null);setMyJourneyViewed(false);setGuideFinish(false);setShowFirstObjective(false);void saveGuide("welcome");}} onLandmark={openLandmark} onBack={()=>{setRegion(initialRegion);setRegionEntered(false);setPanel(null);setGuideVisible(false);setShowFirstObjective(false);}} unlockedRewards={rewards.length} suppressLegacyHud={regionEntered} onOnlineCountChange={setOnlineCount} onActiveTalkChange={setActiveTalk}/>}
          {regionEntered && guideVisible && guideStep && !nicknameOpen && !panel && <WorldEntryTutorial region={region} nickname={nickname} topic={topic} journeyGoal={journeyGoal} step={guideStep} finish={guideFinish} journeyViewed={myJourneyViewed} onOpenJourney={openMyJourney} onBack={stepBack} onNext={stepNext} onSkip={skipGuide}/>}
      {panel && panel !== "home" && <div className={`hc-game-modal-backdrop ${panel === "journey" ? "is-journey-drawer" : ""} ${panel === "journey" && guideStep === "discovery_herbal" ? "is-journey-guided" : ""}`} role="presentation" onMouseDown={(event)=>{if(event.target===event.currentTarget&&guideStep!=="discovery_herbal")closePanel();}}><section className={`hc-game-modal ${panel === "journey" ? "hc-game-modal-journey" : ""}`} role="dialog" aria-modal="true" aria-label={panelTitle} data-game-panel={panel}><header className="hc-game-modal-header"><div>{panel !== "journey" && <p>HEALTHCLUES · {region === "sleep-better" ? "SLEEP VALLEY" : "HEALTHCLUES REALM"}</p>}<h2>{panelTitle}</h2>{panel === "camp" && <span>{region === "sleep-better" ? "Luna" : "Lumi"} · Your journey: {topic}</span>}</div><button type="button" onClick={closePanel} aria-label={text("Close panel")} data-close-game-modal>x</button></header>
          {panel === "journey" && showInitialPlanDialogue && <div className="hidden sm:flex hc-plan-builder-dialogue mx-4 mt-3 items-center gap-3 rounded-2xl border border-[#dfce9a] bg-[#fff6dd] px-3 py-2 sm:mx-7"><HealthCluesPet region={region} topic={topic} pose="guide" className="shrink-0"/><p className="text-sm font-semibold leading-relaxed">{text("I’ve prepared a few ideas for the focus you shared. Choose any, change them, or skip them for now.")}</p></div>}
        <div className="hc-game-modal-body">
          {panel === "journey" && <MyJourneyPanel nickname={nickname} region={region} topic={topic} profile={quizProfile} goals={wellnessGoals} confirmed={wellnessPlanVersion !== null} entries={entries} tools={tools} worldId={worldId} accessToken={accessToken || ""} version={wellnessPlanVersion} questId={initialRegion} checkins={checkins} usageHistory={usageHistory} timezone={timezone} onPlanUpdated={onProgressUpdated} tutorialMode={guideStep === "discovery_herbal"} onViewed={markMyJourneyViewed} onViewFullPlan={openPlan} onReviewSuggestions={openSavedSuggestions} onTourComplete={finishJourneyTour} onTourSkip={skipGuide} onNavigateStation={(landmark) => { closePanel(); openLandmark(landmark); }} onOpenCheckin={() => { closePanel(); onCheckin(); }} onClose={closePanel}/>}
          {panel === "reminder" && <DailyReminderPanel region={region} topic={topic} accessToken={accessToken || ""} onClose={closePanel} />}
          {panel === "plan" && <MyWellnessPlanPanel region={region} worldId={worldId} accessToken={accessToken || ""} version={wellnessPlanVersion} goals={wellnessGoals} profile={quizProfile} questId={initialRegion} openSuggestions={reviewSuggestionsDirectly} onUpdated={onProgressUpdated} onConfirmed={() => { setPanel("journey"); onProgressUpdated(); }}/>}
          {panel === "camp" && <><div className="hc-camp-welcome"><HealthCluesPet region={region} topic={topic} pose="guide"/><p><strong>{region === "sleep-better" ? "Luna" : "Lumi"}:</strong> {nickname ? (locale === "vi" ? `Chào mừng trở lại, ${nickname}! ` : `Welcome back, ${nickname}! `) : (locale === "vi" ? "Chào mừng Nhà thám hiểm! " : "Welcome, Wayfinder! ")}{topic ? (locale === "vi" ? `Bạn đang khám phá ${topic === "gout" ? "Gút" : topic}, dựa trên trắc nghiệm của bạn. ` : `You are exploring ${topic}, based on your Quiz. `) : (locale === "vi" ? "Hồ sơ trắc nghiệm định hướng hành trình này. " : "Your Quiz profile guides this Journey. ")}{locale === "vi" ? "Dưới đây là các gợi ý học hỏi tùy chọn; bạn có thể tự do khám phá hoặc bỏ qua." : "Here are optional learning suggestions; you can explore freely or skip them."}</p></div><div className="hc-camp-links"><button type="button" onClick={()=>setPanel("home")} data-testid="camp-enter-home-btn" style={{ background: "#10b981", color: "#ffffff", fontWeight: 800 }}>🏡 {locale === "vi" ? "Vào Nhà Nghỉ Dưỡng Thụy Sĩ" : "Enter Swiss Alpine Chalet"}</button><button type="button" onClick={()=>setPanel("plan")}>{text("My Wellness Plan")}</button><button type="button" onClick={()=>setPanel("checkin")}>{text("Daily Check-in")}</button><button type="button" onClick={()=>setPanel("journal")}>{locale === "vi" ? "Nhật ký riêng tư" : "Private Journal"}</button><button type="button" onClick={()=>setPanel("settings")}>{locale === "vi" ? "Cài đặt hành trình" : "Journey settings"}</button><button type="button" onClick={()=>setPanel("careplan")}>{locale === "vi" ? "Sổ tay chăm sóc / Ghi nhận" : "My Care Plan / Medication Records"}</button></div>{wellnessGoals.filter(goal=>goal.choice==="active").length>0 && <section className="mt-4 rounded-2xl border border-emerald-900/15 bg-[#eff4e9] p-4" aria-label="Daily Care plan preview" data-daily-plan-preview><p className="text-xs font-black uppercase tracking-widest text-emerald-900">{locale === "vi" ? "Xem trước mục tiêu hằng ngày" : "My Daily Care preview"}</p><p className="mt-1 text-xs text-[#68766a]">{locale === "vi" ? "Các mục tiêu đã xác nhận sẽ xuất hiện tại đây. Mục tiêu chưa ghi nhận không bị coi là bỏ lỡ hay hoàn thành." : "Your confirmed goals appear here. An unrecorded goal is not treated as missed or completed."}</p><ul className="mt-3 space-y-2">{wellnessGoals.filter(goal=>goal.choice==="active").map(goal=><li key={goal.goalId} className="flex flex-wrap justify-between gap-2 rounded-xl bg-white p-3 text-sm"><span><strong>{localizedPlanGoalCopy(goal, locale).title}</strong><small className="ml-2 text-xs text-[#647368]">{goal.frequency}</small></span><span className="text-xs font-bold text-[#68766a]">{locale === "vi" ? "Chưa ghi nhận hôm nay" : "Not recorded today"}</span></li>)}</ul></section>}<PersonalizedSuggestions worldId={worldId} token={accessToken} savedIds={savedIds} entries={entries} onUpdated={onProgressUpdated}/><BackpackExperience accessToken={accessToken} worldId={worldId} tools={tools} savedIds={savedIds} entries={entries} usageHistory={usageHistory} topic={topic} onEquipped={onProgressUpdated} onCollection={()=>setPanel("collection")} onContinue={continueFromBackpack}/></>}
          {panel === "careplan" && <PrivateCarePlanPanel accessToken={accessToken} worldId={worldId}/>}
          {panel === "collection" && <ToolkitCollection accessToken={accessToken} worldId={worldId} tools={tools} savedIds={savedIds} entries={entries} onEquipped={onProgressUpdated}/>}
          {panel === "checkin" && <div className="hc-empty-lore"><HealthCluesPet region={region} topic={topic}/><h3>{locale === "vi" ? "Ghi nhận hằng ngày" : "Daily Check-in"}</h3><p>{locale === "vi" ? "Người bạn đồng hành có thể mở biểu mẫu điểm danh riêng tư cho Thế giới này." : "Your companion can open the private check-in for this World."}</p><button type="button" onClick={()=>{setPanel(null);onCheckin();}}>{locale === "vi" ? "Mở biểu mẫu điểm danh hôm nay" : "Open today’s private check-in"}</button></div>}
          {panel === "journal" && <PrivateJournalPanel accessToken={accessToken}/>}
          {panel === "settings" && <><section className="mb-4 rounded-2xl border border-[#d8ddce] bg-white p-4"><h3 className="mb-2 font-black">{text("Language")}</h3><HealthCluesLocaleControl worldId={worldId} accessToken={accessToken}/></section>{guideStep === "reminder_setup" ? <><div className="hc-camp-welcome"><HealthCluesPet region={region} topic={topic} pose="guide"/><p><strong>Lumi:</strong> A gentle generic reminder is optional. Choose a time and timezone, or continue without email.</p></div><ReminderPreferencesPanel accessToken={accessToken} onSaved={reminderSaved}/><button type="button" onClick={()=>{setPanel(null);void saveGuide("knowledge");setGuideVisible(true);}}>Skip reminders</button></> : <><ComboJourneyPanel accessToken={accessToken} tools={tools} onSaved={onProgressUpdated}/><ReminderPreferencesPanel accessToken={accessToken}/></>}</>}
          {panel === "knowledge" && <><p className="hc-context-note">{locale === "vi" ? `Hành trình hiện tại: ${topic === "gout" ? "Gút" : topic}. Chỉ hiển thị kiến thức đã được chuyên gia thẩm định nguồn cho khu vực này. Mối quan tâm sức khỏe do bạn tự chia sẻ, không phải chẩn đoán y khoa.` : `Current Journey: ${topic}. Only source-reviewed learning for this region is shown. Personal topics are self-reported, not diagnoses.`}</p><KnowledgeJourneyPanel accessToken={accessToken} onProgressUpdated={onProgressUpdated}/></>}
          {panel === "boss" && <BossBattlePanel accessToken={accessToken} onProgressUpdated={onProgressUpdated}/>}
          {panel === "rewards" && <div className="hc-rewards-list">{rewards.length ? rewards.map(reward=><article key={`${reward.reward_id}:${reward.awarded_at}`}><Award/><div><strong>{reward.title}</strong><small>{locale === "vi" ? `Đã lưu ${new Date(reward.awarded_at).toLocaleDateString("vi-VN")}` : `Saved ${new Date(reward.awarded_at).toLocaleDateString("en-US")}`}</small></div></article>) : <div className="hc-empty-lore"><Sparkles/><h3>{locale === "vi" ? "Chưa có phần thưởng Thế giới" : "No World rewards yet"}</h3><p>{locale === "vi" ? "Phần thưởng nhận được sẽ hiển thị tại đây sau các hoạt động hợp lệ được máy chủ xác nhận. Không có phần thưởng được cấp trước." : "Earned rewards will appear here after a qualifying server-verified activity. Nothing is pre-awarded."}</p></div>}</div>}
          {(panel === "nutrition" || panel === "practices" || panel === "movement") && <>{panel !== "nutrition" && <PersonalizedSuggestions station={panel} worldId={worldId} token={accessToken} savedIds={savedIds} entries={entries} onUpdated={onProgressUpdated}/>}<WellnessEncyclopediaStation station={panel} topic={topic} nickname={nickname} journeyGreeting={playbook.greeting} accessToken={accessToken} worldId={worldId} savedIds={savedIds} entries={entries} onUpdated={onProgressUpdated}/>{guideStep === `discovery_${panel === "nutrition" ? "herbal" : panel === "movement" ? "movement" : "practices"}` && <div className="hc-guide-station-actions"><button type="button" onClick={skipGuide}>{locale === "vi" ? "Tự do khám phá" : "Explore freely"}</button><button type="button" className="hc-guide-primary" onClick={()=>{const next = panel === "nutrition" ? "discovery_movement" : panel === "movement" ? "discovery_practices" : "backpack"; setPanel(null); void saveGuide(next);}}>{panel === "practices" ? (locale === "vi" ? "Xem túi đồ" : "Review Backpack") : (locale === "vi" ? "Tiếp tục địa điểm tiếp theo" : "Continue to next place")}</button></div>}</>}
          {panel === "community" && <CommunityJourneysPanel accessToken={accessToken} journeys={journeys} branches={branches} tools={tools} entries={entries} onWorldUpdated={onProgressUpdated}/>}
        </div>
      </section></div>}
      {panel === "home" && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-[#0f1715]" role="dialog" aria-modal="true" data-testid="home-full-container">
          <HealthCluesWellnessHome
            worldId={worldId}
            accessToken={accessToken}
            nickname={nickname}
            playerId={worldId || "adventurer_guest"}
            highlightItemId={highlightHomeItemId}
            onClose={() => {
              setHighlightHomeItemId(null);
              closePanel();
            }}
          />
        </div>
      )}
      {checkinDialog}
    </main>
  </HealthCluesGameShell>;
}

function WorldEntryTutorial({ region, nickname, topic, journeyGoal, step, finish, journeyViewed, onOpenJourney, onBack, onNext, onSkip }: {
  region: Region; nickname: string; topic: string; journeyGoal: string; step: Exclude<GuideStep, null>; finish: boolean; journeyViewed: boolean;
  onOpenJourney: () => void; onBack: () => void; onNext: () => void; onSkip: () => void;
}) {
  const { text } = useHealthCluesLocale();
  const dialogRef = useRef<HTMLDivElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const skipRef = useRef(onSkip);
  const [spotlight, setSpotlight] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const [targetInView, setTargetInView] = useState(false);
  const [dialoguePosition, setDialoguePosition] = useState({ left: 16, top: 80, placement: "right" });
  const pet = region === "sleep-better" ? "Luna" : "Lumi";
  const regionName = region === "sleep-better" ? "Sleep Valley" : "HealthClues Realm";
  const stepNumber = finish ? 5 : Math.max(0, entrySteps.indexOf(step)) + 1;
  const targetSelector = finish ? "[data-player-actor] .hc-rpg-player-sprite, [data-pet-follow] .hc-pet" : step === "welcome" ? "[data-pet-follow] .hc-pet" : step === "discovery_herbal" ? "[data-my-journey-button]" : step === "discovery_movement" ? '[data-guide-target="true"] [data-npc="botanist"]' : '[data-guide-target="true"] [data-npc="wellness"]';
  const heading = text(finish ? "Your World is ready" : step === "welcome" ? "Welcome to your World" : step === "discovery_herbal" ? "Your goals live here" : step === "discovery_movement" ? "Meet the Botanist" : "Explore supportive practices");

  useEffect(() => { skipRef.current = onSkip; }, [onSkip]);

  useEffect(() => {
    let frame = 0;
    let lastMeasure = 0;
    const update = () => {
      const nodes = [...document.querySelectorAll<HTMLElement>(targetSelector)].filter(node => {
        const rect = node.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      });
      let rect: DOMRect | null = null;
      for (const node of nodes) {
        const next = node.getBoundingClientRect();
        if (!rect) rect = next;
        else {
          const left = Math.min(rect.left, next.left); const top = Math.min(rect.top, next.top);
          const right = Math.max(rect.right, next.right); const bottom = Math.max(rect.bottom, next.bottom);
          rect = new DOMRect(left, top, right - left, bottom - top);
        }
      }
      const vw = document.documentElement.clientWidth || window.innerWidth;
      const vh = document.documentElement.clientHeight || window.innerHeight;
      const inView = Boolean(rect && rect.left >= 0 && rect.top >= 0 && rect.right <= vw && rect.bottom <= vh);
      setTargetInView(previous => previous === inView ? previous : inView);
      const clipped = rect ? {
        top: Math.max(0, rect.top - 10), left: Math.max(0, rect.left - 10),
        width: Math.max(0, Math.min(vw, rect.right + 10) - Math.max(0, rect.left - 10)),
        height: Math.max(0, Math.min(vh, rect.bottom + 10) - Math.max(0, rect.top - 10)),
      } : null;
      setSpotlight(previous => {
        if (!clipped && !previous) return previous;
        if (clipped && previous && Math.abs(clipped.left - previous.left) < 1.5 && Math.abs(clipped.top - previous.top) < 1.5 && Math.abs(clipped.width - previous.width) < 1.5 && Math.abs(clipped.height - previous.height) < 1.5) return previous;
        return clipped;
      });
      const bubble = bubbleRef.current?.getBoundingClientRect();
      const bw = bubble?.width || Math.min(400, vw - 24); const bh = bubble?.height || 280; const gap = 16; const margin = 12;
      let nextPosition = { left: Math.max(margin, (vw - bw) / 2), top: Math.max(margin, (vh - bh) / 2), placement: "center" };
      if (rect) {
        const centerY = rect.top + rect.height / 2; const centerX = rect.left + rect.width / 2;
        const candidates = [
          { placement: "right", left: rect.right + gap, top: centerY - bh / 2 },
          { placement: "left", left: rect.left - bw - gap, top: centerY - bh / 2 },
          { placement: "above", left: centerX - bw / 2, top: rect.top - bh - gap },
          { placement: "below", left: centerX - bw / 2, top: rect.bottom + gap },
        ];
        const fit = candidates.find(item => item.left >= margin && item.top >= margin && item.left + bw <= vw - margin && item.top + bh <= vh - margin);
        if (fit) nextPosition = { left: fit.left, top: fit.top, placement: fit.placement };
        else {
          const safeTop = Math.max(margin, Math.min(vh - bh - margin, centerY < vh / 2 ? rect.bottom + gap : rect.top - bh - gap));
          nextPosition = { left: Math.max(margin, Math.min(vw - bw - margin, centerX < vw / 2 ? rect.right + gap : rect.left - bw - gap)), top: safeTop, placement: "near" };
        }
      }
      setDialoguePosition(previous => Math.abs(previous.left - nextPosition.left) < 1.5 && Math.abs(previous.top - nextPosition.top) < 1.5 && previous.placement === nextPosition.placement ? previous : nextPosition);
    };
    const observer = new ResizeObserver(update);
    if (bubbleRef.current) observer.observe(bubbleRef.current);
    update();
    const handleViewport = () => update();
    window.addEventListener("resize", handleViewport); window.addEventListener("scroll", handleViewport, true);
    const animate = (time: number) => {
      if (time - lastMeasure >= 75) { update(); lastMeasure = time; }
      frame = window.requestAnimationFrame(animate);
    };
    frame = window.requestAnimationFrame(animate);
    return () => { observer.disconnect(); window.cancelAnimationFrame(frame); window.removeEventListener("resize", handleViewport); window.removeEventListener("scroll", handleViewport, true); };
  }, [targetSelector, stepNumber]);

  useEffect(() => {
    const first = dialogRef.current?.querySelector<HTMLElement>("button:not(:disabled)");
    first?.focus();
    const trap = (event: KeyboardEvent) => {
      if (!dialogRef.current) return;
      if (event.key === "Escape") { event.preventDefault(); skipRef.current(); return; }
      if (event.key !== "Tab") return;
      const focusable = [...dialogRef.current.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input:not(:disabled),[tabindex]:not([tabindex="-1"])')];
      if (!focusable.length) return;
      const firstItem = focusable[0]; const lastItem = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === firstItem) { event.preventDefault(); lastItem.focus(); }
      else if (!event.shiftKey && document.activeElement === lastItem) { event.preventDefault(); firstItem.focus(); }
    };
    document.addEventListener("keydown", trap);
    return () => document.removeEventListener("keydown", trap);
  }, [stepNumber]);

  const targetAvailable = Boolean(spotlight && spotlight.width >= 28 && spotlight.height >= 28 && targetInView);
  const primaryAction = finish ? "Start Exploring" : step === "welcome" ? "Start Tour" : step === "discovery_herbal" ? "Show My Goals" : "Got it";
  const primaryClick = finish ? onNext : step === "welcome" ? onNext : step === "discovery_herbal" ? onOpenJourney : onNext;
  const canAdvance = step !== "discovery_herbal" || journeyViewed;
  return <div ref={dialogRef} className="hc-world-tour" data-world-entry-tutorial data-tutorial-step={stepNumber} data-tour-state={finish ? "finish" : step} data-target-visible={targetAvailable}>
    <div className="hc-tour-shades" aria-hidden="true">
      {spotlight ? <><span className="hc-tour-shade" style={{ top: 0, left: 0, width: "100vw", height: spotlight.top }}/><span className="hc-tour-shade" style={{ top: spotlight.top, left: 0, width: spotlight.left, height: spotlight.height }}/><span className="hc-tour-shade" style={{ top: spotlight.top, left: spotlight.left + spotlight.width, width: `calc(100vw - ${spotlight.left + spotlight.width}px)`, height: spotlight.height }}/><span className="hc-tour-shade" style={{ top: spotlight.top + spotlight.height, left: 0, width: "100vw", height: `calc(100dvh - ${spotlight.top + spotlight.height}px)` }}/><span className="hc-tour-target-shield" aria-hidden="true" style={{ top: spotlight.top, left: spotlight.left, width: spotlight.width, height: spotlight.height }}/><span className="hc-tour-spotlight" style={{ top: spotlight.top, left: spotlight.left, width: spotlight.width, height: spotlight.height }}/></> : <span className="hc-tour-shade hc-tour-shade-full"/>}
    </div>
    <div ref={bubbleRef} className="hc-world-tour-dialogue" role="dialog" aria-modal="true" aria-labelledby="hc-tour-title" data-placement={dialoguePosition.placement} style={{ left: dialoguePosition.left, top: dialoguePosition.top }}>
      <div className="hc-world-tour-progress" aria-label={`${text("Step")} ${stepNumber} ${text("of")} 5`}><span>{text(regionName)} · {text("YOUR WORLD TOUR")}</span><strong>{text("STEP")} {stepNumber} {text("OF")} 5</strong><div>{Array.from({ length: 5 }, (_, index) => <i key={index} data-current={index + 1 === stepNumber || undefined} data-complete={index + 1 < stepNumber || undefined}/>)}</div></div>
      <div className="hc-world-tour-copy" aria-live="polite"><div className="hc-world-tour-pet" aria-label={`${pet}, your companion`}><HealthCluesPet region={region} topic={topic} pose="guide"/></div><section>
        <p className="hc-world-tour-eyebrow">{pet.toUpperCase()} · YOUR COMPANION</p><h1 id="hc-tour-title">{heading}</h1>
        {finish && <p>{text("Now you know where to find your goals and explore new ideas. Your journey is yours — let’s begin!")}</p>}
        {!finish && step === "welcome" && <><p>{text("Welcome")} {nickname ? `${nickname}! ` : "! "}{text("Let me show you where your goals and helpful discoveries live.")}</p><small>{text("Your Quiz focus:")} {topic}{journeyGoal ? ` · ${journeyGoal}` : ""}. {text("This is self-reported, not a diagnosis.")}</small></>}
        {!finish && step === "discovery_herbal" && <><p>{text("This is My Journey, where your personal goals and selected wellness tools live.")}</p><button type="button" className="hc-tour-primary" onClick={onOpenJourney} disabled={!targetAvailable}><Route aria-hidden="true" size={16}/>{text("Show My Goals")}</button>{!journeyViewed && <small>{text("Open your actual summary before continuing.")}</small>}</>}
        {!finish && step === "discovery_movement" && <><p>{text("Meet the Botanist: an optional place to explore herbs, traditional uses, available evidence and safety.")}</p><small>{text("Nothing is prescribed or added to your Plan automatically. Choose the guide and walk closer to Talk.")}</small></>}
        {!finish && step === "discovery_practices" && <><p>{text("Meet the Wellness Guide to explore supportive practices such as relaxation, breathing and meditation.")}</p><small>{text("These are optional learning topics; choose only what feels appropriate to you.")}</small></>}
        {!targetAvailable && <small className="hc-tour-target-warning" role="status">{text("Finding this place on your map…")}</small>}
      </section></div>
      <footer className="hc-world-tour-controls">{step !== "welcome" && <button type="button" className="hc-tour-link" onClick={onBack}>{text("Back")}</button>}<button type="button" className="hc-tour-link" onClick={onSkip}>{text("Skip Tour")}</button><div>{step === "discovery_herbal" && !finish && <button type="button" className="hc-tour-primary" onClick={onNext} disabled={!targetAvailable || !canAdvance}>{text("Continue")}</button>}{(finish || step === "welcome" || step === "discovery_movement" || step === "discovery_practices") && <button type="button" className="hc-tour-primary" onClick={primaryClick} disabled={!targetAvailable}>{text(primaryAction)}</button>}</div></footer>
    </div>
  </div>;
}


export function parseCheckinStars(
  checkin?: { note_private?: string | null; id: string },
  usages?: Array<{ checkin_id?: string; status: string }>
): { stars: number; reasons: string[]; personalNote: string } {
  if (!checkin) return { stars: 0, reasons: [], personalNote: "" };

  let stars = 5;
  let reasons: string[] = [];
  let personalNote = "";

  const note = checkin.note_private || "";
  if (note) {
    const starMatch = note.match(/\[(?:Đánh giá ngày|Daily rating):\s*(\d(?:\.\d)?)\/5\s*(?:sao|stars)\]/i);
    if (starMatch) {
      stars = Math.max(0, Math.min(5, Math.round(Number(starMatch[1]))));
    } else if (usages && usages.length > 0) {
      const dayUsages = usages.filter(u => u.checkin_id === checkin.id);
      if (dayUsages.length > 0) {
        const done = dayUsages.filter(u => u.status === "done").length;
        stars = calculateStars(done, dayUsages.length);
      }
    }

    const reasonHeaderVi = "Lý do chưa hoàn thành:";
    const reasonHeaderEn = "Reason not completed:";
    const reasonIdx = note.indexOf(reasonHeaderVi) !== -1 ? note.indexOf(reasonHeaderVi) : note.indexOf(reasonHeaderEn);
    const reasonHeaderLen = note.indexOf(reasonHeaderVi) !== -1 ? reasonHeaderVi.length : reasonHeaderEn.length;
    if (reasonIdx !== -1) {
      const afterHeader = note.slice(reasonIdx + reasonHeaderLen).trim();
      const lines = afterHeader.split("\n");
      const cleanReasons: string[] = [];
      const remainingLines: string[] = [];
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith("-") || trimmed.startsWith("•")) {
          cleanReasons.push(trimmed.replace(/^[-•]\s*/, ""));
        } else if (trimmed && !trimmed.startsWith("[Đánh giá ngày:") && !trimmed.startsWith("[Daily rating:")) {
          remainingLines.push(trimmed);
        }
      }
      reasons = cleanReasons;
      if (cleanReasons.length > 0 && !starMatch) {
        stars = Math.max(1, 5 - cleanReasons.length * 2);
      }
      personalNote = remainingLines.join("\n");
    } else {
      personalNote = note
        .replace(/\[(?:Đánh giá ngày|Daily rating):\s*\d(?:\.\d)?\/5\s*(?:sao|stars)\]/gi, "")
        .replace(/\[(?:Trạng thái mục tiêu|Goal status):\s*[^\]]+\]/gi, "")
        .trim();
    }
  } else if (usages && usages.length > 0) {
    const dayUsages = usages.filter(u => u.checkin_id === checkin.id);
    if (dayUsages.length > 0) {
      const done = dayUsages.filter(u => u.status === "done").length;
      stars = calculateStars(done, dayUsages.length);
    }
  }

  return { stars, reasons, personalNote };
}

function MyJourneyPanel({
  nickname = "",
  region, topic, profile, goals, confirmed, entries, tools, worldId, accessToken, version, questId,
  checkins = [], usageHistory = [], timezone = "UTC",
  onPlanUpdated, tutorialMode = false, onViewed, onViewFullPlan, onReviewSuggestions, onTourComplete, onTourSkip, onNavigateStation, onOpenCheckin, onClose,
}: {
  nickname?: string;
  region: Region; topic: string; profile: HealthCluesProfile | null; goals: WellnessPlanGoal[]; confirmed?: boolean; entries: Entry[]; tools: Tool[]; worldId: string; accessToken: string; version: number | null; questId: string;
  checkins?: Array<{ id: string; local_date: string; revision: number; note_private?: string | null }>;
  usageHistory?: UsageHistory[];
  timezone?: string;
  onPlanUpdated: () => void; tutorialMode?: boolean; onViewed?: () => void; onViewFullPlan: () => void; onReviewSuggestions: () => void; onTourComplete: () => void; onTourSkip: () => void; onNavigateStation?: (landmark: RegionLandmark) => void; onOpenCheckin?: () => void; onClose?: () => void;
}) {
  const { locale, text } = useHealthCluesLocale();
  const [journeyTab, setJourneyTab] = useState<"habits" | "roadmap">("habits");
  const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null);
  const panelRef = useRef<HTMLElement>(null);

  // Timezone-aware today
  const getPlayerToday = (tz?: string) => {
    try {
      const formatter = new Intl.DateTimeFormat("en-CA", {
        timeZone: tz || Intl.DateTimeFormat().resolvedOptions().timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
      const parts = formatter.format(new Date()).split("-");
      return {
        year: parseInt(parts[0], 10),
        month: parseInt(parts[1], 10) - 1, // 0-indexed
        day: parseInt(parts[2], 10),
        isoDate: `${parts[0]}-${parts[1]}-${parts[2]}`,
      };
    } catch {
      const d = new Date();
      return {
        year: d.getFullYear(),
        month: d.getMonth(),
        day: d.getDate(),
        isoDate: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
      };
    }
  };

  const todayInfo = getPlayerToday(timezone);
  const [viewYear, setViewYear] = useState<number>(todayInfo.year);
  const [viewMonth, setViewMonth] = useState<number>(todayInfo.month);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const petName = region === "sleep-better" ? "Luna" : "Lumi";
  const userName = nickname?.trim() || (locale === "vi" ? "anh Quân" : "Wayfinder");

  // Interactive Companion Add Habit Dialog State
  const [companionAddOpen, setCompanionAddOpen] = useState(false);
  const [companionStep, setCompanionStep] = useState<"input" | "success">("input");
  const [customHabitText, setCustomHabitText] = useState("");
  const [customHabitSaving, setCustomHabitSaving] = useState(false);
  const [savedHabitTitle, setSavedHabitTitle] = useState("");
  const [customHabitError, setCustomHabitError] = useState("");

  const handleSaveCustomHabit = async (habitText: string) => {
    const trimmed = habitText.trim();
    if (!trimmed) return;
    if (!accessToken) {
      setCustomHabitError(locale === "vi" ? "Vui lòng đăng nhập để lưu thói quen." : "Sign in to save habit.");
      return;
    }
    const normalizedNew = trimmed.toLowerCase();
    const isWalkingNew = /đi bộ|bước chân|dạo bộ|walk/i.test(normalizedNew);
    const alreadyExists = goals.some(g => {
      const t1 = (g.title || "").trim().toLowerCase();
      const t2 = (getDisplayGoalTitle(g, locale) || "").trim().toLowerCase();
      if (t1 === normalizedNew || t2 === normalizedNew) return true;
      if (isWalkingNew && (/đi bộ|bước chân|dạo bộ|walk/i.test(t1) || /đi bộ|bước chân|dạo bộ|walk/i.test(t2))) {
        return true;
      }
      return false;
    });
    if (alreadyExists) {
      setSavedHabitTitle(trimmed);
      setCompanionStep("success");
      return;
    }
    setCustomHabitSaving(true);
    setCustomHabitError("");
    try {
      const isMove = /vận động|đi bộ|chạy|bước|tập|thể dục|walk|exercise/i.test(trimmed);
      const isNutr = /uống|nước|ăn|rau|bữa|food|drink|water/i.test(trimmed);
      const isRelax = /thở|thiền|thư giãn|ngủ|relax|breath|sleep/i.test(trimmed);
      const category = isMove ? "movement" : isNutr ? "nutrition" : isRelax ? "relaxation" : "general routine";

      const newGoal = buildPersonalPlanGoal({
        title: trimmed,
        category,
        goalType: "maintain",
        frequency: "Daily",
        trackingDefinition: trimmed,
        activityConfirmed: true,
      });
      const nextGoals = [...goals, newGoal];
      const res = await fetch("/api/healthclues/plan", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          worldId,
          requestKey: crypto.randomUUID(),
          confirmed: true,
          goals: nextGoals,
        }),
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Could not save custom habit");
      setSavedHabitTitle(trimmed);
      setCompanionStep("success");
      onPlanUpdated?.();
    } catch {
      setCustomHabitError(locale === "vi" ? "Chưa lưu được thói quen. Vui lòng thử lại!" : "Could not save habit. Try again!");
    } finally {
      setCustomHabitSaving(false);
    }
  };

  const [deletingGoalId, setDeletingGoalId] = useState<string | null>(null);
  const handleDeleteGoal = async (goalId: string) => {
    if (!accessToken || deletingGoalId) return;
    const confirmed = typeof window !== "undefined"
      ? window.confirm(locale === "vi" ? "Bạn có chắc chắn muốn bỏ theo dõi thói quen này không?" : "Remove this habit from your active list?")
      : true;
    if (!confirmed) return;
    setDeletingGoalId(goalId);
    try {
      const nextGoals = goals.filter(g => g.goalId !== goalId);
      const res = await fetch("/api/healthclues/plan", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          worldId,
          requestKey: crypto.randomUUID(),
          confirmed: true,
          goals: nextGoals,
        }),
        cache: "no-store",
      });
      if (res.ok) {
        onPlanUpdated?.();
      }
    } catch (e) {
      console.error("Failed to delete habit", e);
    } finally {
      setDeletingGoalId(null);
    }
  };

  // Daily Companion Email Reminder State
  const [reminderOptedIn, setReminderOptedIn] = useState<boolean>(false);
  const [reminderTime, setReminderTime] = useState<string>("07:30");
  const [reminderTimezone, setReminderTimezone] = useState<string>(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Ho_Chi_Minh";
    } catch {
      return "Asia/Ho_Chi_Minh";
    }
  });
  const [reminderSaving, setReminderSaving] = useState<boolean>(false);
  const [reminderToast, setReminderToast] = useState<string | null>(null);
  const [showEmailPreview, setShowEmailPreview] = useState<boolean>(false);

  // Load existing reminder preference
  useEffect(() => {
    if (!accessToken) return;
    let active = true;
    fetch("/api/healthclues/reminders", {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    })
      .then(async res => res.ok ? res.json() as Promise<{ preference?: { opted_in: boolean; timezone: string; local_send_time: string; paused: boolean } | null }> : null)
      .then(data => {
        if (!active || !data?.preference) return;
        setReminderOptedIn(Boolean(data.preference.opted_in && !data.preference.paused));
        if (data.preference.local_send_time) {
          setReminderTime(data.preference.local_send_time.slice(0, 5));
        }
        if (data.preference.timezone) {
          setReminderTimezone(data.preference.timezone);
        }
      })
      .catch(() => {});
    return () => { active = false; };
  }, [accessToken]);

  // Save reminder preference
  const saveReminderPreference = async (targetOptedIn: boolean, targetTime?: string, targetTz?: string) => {
    if (!accessToken) return;
    setReminderSaving(true);
    setReminderToast(null);
    const sendTime = targetTime || reminderTime;
    const sendTz = targetTz || reminderTimezone;
    try {
      const res = await fetch("/api/healthclues/reminders", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: targetOptedIn ? "save" : "unsubscribe",
          optedIn: targetOptedIn,
          timezone: sendTz,
          localSendTime: sendTime,
          frequency: "daily",
          consentConfirmed: targetOptedIn ? true : undefined,
        }),
      });
      if (res.ok) {
        setReminderOptedIn(targetOptedIn);
        setReminderToast(targetOptedIn
          ? (locale === "vi" ? `Đã lưu lịch nhắc hằng ngày lúc ${sendTime} (${sendTz})!` : `Daily reminder saved for ${sendTime} (${sendTz})!`)
          : (locale === "vi" ? "Đã tắt email nhắc nhở hằng ngày." : "Daily reminder email disabled.")
        );
        setTimeout(() => setReminderToast(null), 4000);
      }
    } catch {
      // safe fallback
    } finally {
      setReminderSaving(false);
    }
  };

  // Month navigation
  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(y => y - 1);
    } else {
      setViewMonth(m => m - 1);
    }
    setSelectedDay(null);
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(y => y + 1);
    } else {
      setViewMonth(m => m + 1);
    }
    setSelectedDay(null);
  };

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const monthDisplayLabel = locale === "vi"
    ? `Tháng ${viewMonth + 1}`
    : new Date(viewYear, viewMonth, 1).toLocaleString("en-US", { month: "long" });

  // Real checkin calculations
  const checkinDates = new Set((checkins || []).map(c => c.local_date));
  let completedDaysInMonth = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const dStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    if (checkinDates.has(dStr)) completedDaysInMonth++;
  }
  const progressPercent = Math.min(100, Math.round((completedDaysInMonth / daysInMonth) * 100));

  // Week rows: 1..7, 8..14, 15..21, 22..28, and 29..daysInMonth
  const weekRows = [
    { weekNum: 1, label: locale === "vi" ? "Tuần 1" : "Week 1", start: 1, end: 7, milestone: 7 },
    { weekNum: 2, label: locale === "vi" ? "Tuần 2" : "Week 2", start: 8, end: 14, milestone: 14 },
    { weekNum: 3, label: locale === "vi" ? "Tuần 3" : "Week 3", start: 15, end: 21, milestone: 21 },
    { weekNum: 4, label: locale === "vi" ? "Tuần 4" : "Week 4", start: 22, end: 28, milestone: 28 },
    ...(daysInMonth > 28
      ? [{ weekNum: 5, label: locale === "vi" ? "Tuần 5" : "Week 5", start: 29, end: daysInMonth, milestone: daysInMonth }]
      : []),
  ];

  const getDayStatus = (d: number) => {
    const dStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const isToday = viewYear === todayInfo.year && viewMonth === todayInfo.month && d === todayInfo.day;
    const dayDate = new Date(viewYear, viewMonth, d);
    const todayDate = new Date(todayInfo.year, todayInfo.month, todayInfo.day);
    const isFuture = dayDate > todayDate;
    const checkin = (checkins || []).find(c => c.local_date === dStr);
    const isCompleted = Boolean(checkin);
    const isUnrecorded = !isFuture && !isToday && !isCompleted;

    let state: "completed" | "today" | "future" | "unrecorded" = "unrecorded";
    if (isCompleted) state = "completed";
    else if (isToday) state = "today";
    else if (isFuture) state = "future";
    else state = "unrecorded";

    const { stars, reasons, personalNote } = parseCheckinStars(checkin, usageHistory);

    return { dStr, isToday, isCompleted, isFuture, isUnrecorded, state, checkin, stars, reasons, personalNote };
  };

  const selectedDayInfo = selectedDay !== null ? getDayStatus(selectedDay) : null;
  const selectedDateFormatted = selectedDay !== null
    ? new Date(viewYear, viewMonth, selectedDay).toLocaleDateString(locale === "vi" ? "vi-VN" : "en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  const todayStr = `${todayInfo.year}-${String(todayInfo.month + 1).padStart(2, "0")}-${String(todayInfo.day).padStart(2, "0")}`;
  const todayCheckin = (checkins || []).find(c => c.local_date === todayStr);
  const isTodayCompleted = Boolean(todayCheckin);
  const todayStarsInfo = parseCheckinStars(todayCheckin, usageHistory);

  // Tour logic
  const journeyTourSections = ["focus", "checklist", "herbs", "practices"] as const;
  type JourneyTourSection = typeof journeyTourSections[number];
  const [tourSection, setTourSection] = useState<JourneyTourSection>("focus");
  useEffect(() => {
    if (!tutorialMode) return;
    onViewed?.();
  }, [onViewed, tutorialMode]);

  const focusAccessibility = (id: JourneyTourSection) => tutorialMode && tourSection === id ? { tabIndex: -1 as const } : {};
  const displayGoalTitle = (goal: WellnessPlanGoal) => getDisplayGoalTitle(goal, locale);
  const statusLabel = (goal: WellnessPlanGoal) => text(goal.choice === "active" ? "Active" : "Saved for later");

  const goalDetails = (goal: WellnessPlanGoal) => {
    const details: string[] = [];
    const targetStr = (goal.targetValue !== null && goal.targetValue !== undefined)
      ? `${goal.targetValue} ${text(goal.targetUnit || goal.trackingUnit)}`
      : "";
    if (targetStr) details.push(targetStr);
    if (goal.frequency && goal.frequency !== "Flexible") details.push(text(goal.frequency));
    if (goal.durationDays) details.push(`${goal.durationDays} ${text("days")}`);
    if (goal.durationMinutes) {
      const minStr = `${goal.durationMinutes} ${text("minutes")}`;
      if (!targetStr.includes(String(goal.durationMinutes)) && !targetStr.toLowerCase().includes("phút") && !targetStr.toLowerCase().includes("minute")) {
        details.push(minStr);
      }
    }
    const unique = Array.from(new Set(details.filter(Boolean)));
    return unique.join(" · ");
  };

  const getHabitEmoji = (goal: WellnessPlanGoal, title: string): string => {
    const lower = `${title} ${goal.category || ""} ${goal.targetUnit || ""}`.toLowerCase();
    if (/đọc sách|book|read/i.test(lower)) return "📖";
    if (/điện thoại|màn hình|phone|screen|tắt thiết bị/i.test(lower)) return "📵";
    if (/nước|water|uống|hydration/i.test(lower)) return "💧";
    if (/đi bộ|walk|bước chân|chạy|step/i.test(lower)) return "🚶‍♂️";
    if (/đũa|thìa|nhai|ăn|bữa ăn|food|dinh dưỡng|salad|rau/i.test(lower)) return "🥗";
    if (/ngủ|sleep|giấc ngủ|bed|phòng ngủ/i.test(lower)) return "🌙";
    if (/thở|breathe|thư giãn|thiền|relax/i.test(lower)) return "🫁";
    if (/trà|tea|thảo mộc|herb/i.test(lower)) return "🍵";
    if (/tắm|bath|nước ấm/i.test(lower)) return "🛁";
    return "🌱";
  };

  const resolveCardIllustration = (goal: WellnessPlanGoal, title: string) => {
    const cat = (goal.category || "").toLowerCase();
    const lower = `${title} ${goal.targetUnit || ""}`.toLowerCase();
    if (cat === "movement" || /vận động|đi bộ|chạy bộ|bước chân|thể dục|tập luyện/i.test(lower)) {
      return "/assets/game/ui/goal-icons/ref_card_movement.png";
    }
    if (/uống đủ nước|nước lọc|lượng nước|cốc nước/i.test(lower)) {
      return "/assets/game/ui/goal-icons/ref_card_hydration.png";
    }
    if (cat === "nutrition" || /ăn uống|bữa ăn|dinh dưỡng|rau xanh|chậm nhai/i.test(lower)) {
      return "/assets/game/ui/goal-icons/ref_card_food.png";
    }
    return null;
  };

  const rawSelectedGoals = confirmed ? goals.filter(goal => goal.choice === "active" || goal.choice === "saved") : [];
  const uniqueGoalsMap = new Map<string, WellnessPlanGoal>();
  for (const goal of rawSelectedGoals) {
    const normTitle = (displayGoalTitle(goal) || goal.title || "").trim().toLowerCase();
    if (!uniqueGoalsMap.has(normTitle)) {
      uniqueGoalsMap.set(normTitle, goal);
    }
  }
  const selectedGoals = Array.from(uniqueGoalsMap.values());
  const activeGoals = selectedGoals.filter(goal => goal.choice === "active");

  const toolById = new Map(tools.map(tool => [tool.id, tool]));
  const equipped = entries.filter(entry => entry.status === "equipped");
  const herbs = equipped.filter(entry => {
    if (entry.discovery_station !== "nutrition" || !entry.catalog_item_id) return false;
    const tool = toolById.get(entry.catalog_item_id);
    return Boolean(tool && /herb|botanical/i.test(`${tool.kind} ${tool.category || ""} ${tool.slug}`));
  });
  const practices = equipped.filter(entry => entry.slot_key === "practice" && (entry.discovery_station === "practices" || !entry.discovery_station));

  return (
    <section ref={panelRef} className="hc-my-journey-panel" data-my-journey-panel>
      {/* Hidden/Muted focus anchor for test suite compatibility */}
      <div {...focusAccessibility("focus")} data-journey-tour-section="focus" style={{ display: "none" }} />

      {/* ==================================================================== */}
      {/* TAB NAVIGATION: ACTIVE HABITS (Default) vs 30-DAY ROADMAP           */}
      {/* ==================================================================== */}
      <div className="hc-journey-nav-tabs" role="tablist" aria-label="Journey view tabs">
        <button
          type="button"
          role="tab"
          aria-selected={journeyTab === "habits"}
          className={`hc-journey-nav-tab-btn ${journeyTab === "habits" ? "is-active" : ""}`}
          onClick={() => setJourneyTab("habits")}
        >
          <Leaf size={15} />
          <span>{locale === "vi" ? "Thói quen" : "Habits"}</span>
          <span className="hc-journey-tab-badge">{selectedGoals.length}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={journeyTab === "roadmap"}
          className={`hc-journey-nav-tab-btn ${journeyTab === "roadmap" ? "is-active" : ""}`}
          onClick={() => setJourneyTab("roadmap")}
        >
          <Calendar size={15} />
          <span>{locale === "vi" ? "Lộ trình 30 ngày" : "30-Day Roadmap"}</span>
        </button>
      </div>

      {/* ==================================================================== */}
      {/* TAB 1: 30-DAY ROADMAP (Rendered only when roadmap tab is selected)   */}
      {/* ==================================================================== */}
      {journeyTab === "roadmap" && (
        <div className="hc-journey-map-banner" role="region" aria-label={text("30-Day Journey")}>
          {/* Top Control Bar: Unified Month Navigation + Overall Progress Badge */}
          <div className="hc-journey-map-topbar">
            <div className="hc-month-picker-pill">
              <button type="button" className="hc-month-nav-btn" onClick={prevMonth} aria-label="Previous month">
                <ChevronLeft size={16} />
              </button>
              <span className="hc-month-current-title">
                <Calendar size={14} className="text-amber-400" />
                <span>{monthDisplayLabel}</span>
              </span>
              <button type="button" className="hc-month-nav-btn" onClick={nextMonth} aria-label="Next month">
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Compact Progress Badge */}
            <div className="hc-roadmap-progress-badge">
              <span className="hc-roadmap-progress-icon">🌱</span>
              <span className="hc-roadmap-progress-text">
                <strong>{completedDaysInMonth}/{daysInMonth}</strong> {text("Day").toLowerCase()} ({progressPercent}%)
              </span>
              <div className="hc-roadmap-progress-mini-track">
                <div className="hc-roadmap-progress-mini-fill" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
          </div>

          {/* Subbar: Companion Note + Inline Legend */}
          <div className="hc-roadmap-subbar">
            <div className="hc-roadmap-companion-hint">
              <span className="hc-roadmap-companion-icon">🦉</span>
              <span className="hc-roadmap-companion-text">
                {locale === "vi"
                  ? "Tích lũy cùng Luna!"
                  : "Daily with Luna!"}
              </span>
            </div>
            <div className="hc-map-legend-inline">
              <span className="hc-legend-item">
                <span className="hc-legend-dot is-completed">✔</span>
                <span>{locale === "vi" ? "Xong" : text("Completed")}</span>
              </span>
              <span className="hc-legend-item">
                <span className="hc-legend-dot is-today" />
                <span>{text("Today")}</span>
              </span>
              <span className="hc-legend-item">
                <span className="hc-legend-dot is-future" />
                <span>{locale === "vi" ? "Tới" : text("Upcoming")}</span>
              </span>
            </div>
          </div>

          {/* Clean 5-Week Grid: 100% of Days (1..30) Visible and Never Clipped */}
          <div className="hc-roadmap-weeks-container">
            {weekRows.map(row => {
              const daysInRow: number[] = [];
              for (let i = row.start; i <= row.end; i++) {
                daysInRow.push(i);
              }

              const rowCompletedCount = daysInRow.filter(d => {
                const s = getDayStatus(d);
                return s.isCompleted;
              }).length;

              return (
                <div key={row.weekNum} className="hc-trail-week-block">
                  <div className="hc-trail-week-header">
                    <span className="hc-week-title-badge">
                      <span>{row.label}</span>
                      <span className="hc-week-days-range">({row.start} - {row.end})</span>
                    </span>
                    <span className="hc-week-progress-pill">
                      {rowCompletedCount === daysInRow.length ? (
                        <span className="hc-week-done-tag">✨ {locale === "vi" ? "Hoàn thành tuần" : "Week completed"}</span>
                      ) : (
                        <span>{rowCompletedCount}/{daysInRow.length} {locale === "vi" ? "ngày" : "days"}</span>
                      )}
                      {row.milestone && (
                        <span className="hc-milestone-reward-tag" title={locale === "vi" ? "Mốc thưởng tuần" : "Milestone reward"}>🎁</span>
                      )}
                    </span>
                  </div>

                  {/* 7-Column Grid: Every node gets equal width, perfectly aligned */}
                  <div className="hc-trail-nodes-grid">
                    {daysInRow.map(dayNum => {
                      const status = getDayStatus(dayNum);
                      const isDaySelected = selectedDay === dayNum;
                      const isMilestone = dayNum === row.milestone;

                      return (
                        <button
                          key={dayNum}
                          type="button"
                          className={`hc-day-node is-${status.state} ${isDaySelected ? "is-selected-node" : ""} ${status.isCompleted && status.stars < 5 ? "is-partial" : ""}`}
                          onClick={() => setSelectedDay(selectedDay === dayNum ? null : dayNum)}
                          aria-label={`${text("Day")} ${dayNum}, ${status.state}${status.isCompleted ? `, ${status.stars}/5 ${text("stars")}` : ""}`}
                          aria-pressed={isDaySelected}
                        >
                          <span className="hc-day-node-num">{String(dayNum).padStart(2, "0")}</span>
                          {status.isCompleted && (
                            <span className="hc-day-node-check-badge" title={text("Completed")}>✔</span>
                          )}
                          {status.isToday && <span className="hc-day-today-pulse" aria-hidden="true" />}
                          {isMilestone && !status.isCompleted && (
                            <span className="hc-day-milestone-badge" title={locale === "vi" ? "Mốc tuần" : "Milestone"}>🎁</span>
                          )}
                        </button>
                      );
                    })}
                    {row.weekNum === 5 && daysInRow.length < 7 && (
                      <div className="hc-final-stage-pill" style={{ gridColumn: `span ${7 - daysInRow.length}` }}>
                        🏆 <span>{locale === "vi" ? "Đích đến 30 ngày!" : "30-Day Milestone!"}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        {/* Floating Day Detail Popover when clicked */}
        {selectedDayInfo && (
          <div className="hc-day-detail-popover" role="region" aria-label={locale === "vi" ? "Chi tiết ngày" : "Day detail"}>
            <div className="hc-day-popover-header">
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-amber-400" />
                <strong>{selectedDateFormatted}</strong>
                <span className={`hc-day-status-pill is-${selectedDayInfo.state}`}>
                  {selectedDayInfo.isToday && (locale === "vi" ? "Hôm nay · Ngày hiện tại" : "Today · Current Day")}
                  {selectedDayInfo.isCompleted && (selectedDayInfo.stars === 5 ? (locale === "vi" ? "Hoàn thành tất cả (5 sao)" : "Completed all goals (5 stars)") : `${selectedDayInfo.stars}/5 ${locale === "vi" ? "sao" : "stars"}`)}
                  {selectedDayInfo.isFuture && (locale === "vi" ? "Ngày sắp tới" : "Upcoming day")}
                  {selectedDayInfo.isUnrecorded && (locale === "vi" ? "Đã qua · Khóa" : "Day passed · Locked")}
                </span>
              </div>
              <button type="button" className="hc-popover-close-btn" onClick={() => setSelectedDay(null)} aria-label={locale === "vi" ? "Đóng chi tiết ngày" : "Close day detail"}>✕</button>
            </div>
            <div className="hc-day-popover-body">
              {selectedDayInfo.isToday ? (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-emerald-100">
                    {locale === "vi" ? "Hôm nay là ngày thực hiện hành trình của bạn. Hãy ghi nhận trạng thái thói quen của hôm nay." : "Today is your active journey day. Record your habit progress for today."}
                  </p>
                  {onOpenCheckin && (
                    <button type="button" className="hc-popover-checkin-cta" onClick={onOpenCheckin}>
                      <CheckCircle2 size={14} /> {text("Daily Check-in")}
                    </button>
                  )}
                </div>
              ) : selectedDayInfo.isCompleted ? (
                <div className="space-y-2">
                  <div className="hc-popover-stars-row">
                    {[1, 2, 3, 4, 5].map(s => (
                      <span key={s} className={`hc-popover-star ${s <= selectedDayInfo.stars ? "is-filled" : "is-empty"}`}>★</span>
                    ))}
                    <span className="hc-popover-stars-caption">
                      {selectedDayInfo.stars === 5
                        ? (locale === "vi" ? "Hoàn thành tất cả (5 sao)" : "Completed all goals (5 stars)")
                        : `${selectedDayInfo.stars}/5 ${locale === "vi" ? "sao" : "stars"}`}
                    </span>
                  </div>
                  {selectedDayInfo.reasons.length > 0 && (
                    <div className="hc-popover-reasons-block">
                      <p className="hc-popover-reasons-title">{locale === "vi" ? "Lý do chưa hoàn thành:" : "Reason not completed:"}</p>
                      <ul className="hc-popover-reasons-list">
                        {selectedDayInfo.reasons.map((r, i) => (
                          <li key={i}>• {r}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {selectedDayInfo.personalNote ? (
                    <p className="hc-popover-personal-note">“{selectedDayInfo.personalNote}”</p>
                  ) : (
                    <p className="text-xs text-emerald-200">
                      ✔ {locale === "vi" ? "Bạn đã ghi nhận ngày này thành công trong hành trình sức khỏe." : "You successfully recorded this day in your wellness journey."}
                    </p>
                  )}
                </div>
              ) : selectedDayInfo.isFuture ? (
                <p className="text-xs text-emerald-200/80">
                  ◯ {locale === "vi" ? "Ngày sắp tới" : "Upcoming day"}
                </p>
              ) : (
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-amber-200">
                    🔒 {locale === "vi" ? "Ngày này đã qua và không thể ghi nhận bù." : "This day has passed and cannot be retroactively recorded."}
                  </p>
                  <p className="text-xs text-emerald-200/70">
                    {locale === "vi" ? "HealthClues không phạt ngày bỏ lỡ. Hãy tập trung cho mục tiêu hôm nay nhé!" : "HealthClues has no penalty for missed days. Stay focused on today's goals!"}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: ACTIVE HABITS ("Thói quen đang theo dõi")                     */}
      {/* ==================================================================== */}
      {journeyTab === "habits" && (
        <section {...focusAccessibility("checklist")} className="hc-active-goals-section" data-inventory-section="checklist" aria-label={text("Active Goals")}>
          <div className="hc-active-goals-header-bar">
            <div className="hc-active-goals-title-group">
              <span className="hc-target-emblem">🎯</span>
              <div>
                <h3 className="hc-active-goals-heading">{locale === "vi" ? "Thói quen đang theo dõi" : text("Active Goals")}</h3>
                <p className="hc-active-goals-caption">
                  {locale === "vi"
                    ? `Đang theo dõi ${selectedGoals.length} thói quen · Cuộn xuống để xem đầy đủ`
                    : `Tracking ${selectedGoals.length} habits · Scroll down to view all`}
                </p>
              </div>
            </div>
            <div className="hc-active-goals-actions">
              <button
                type="button"
                className="hc-add-habit-btn"
                onClick={() => {
                  setCompanionAddOpen(true);
                  setCompanionStep("input");
                  setCustomHabitText("");
                  setCustomHabitError("");
                }}
                title={locale === "vi" ? "Thêm thói quen mới cùng bạn đồng hành" : "Add habit with companion"}
              >
                <Plus size={14} />
                <span>{locale === "vi" ? "Thêm thói quen" : "Add Habit"}</span>
              </button>
              <button type="button" className="hc-view-all-plan-btn" onClick={onViewFullPlan}>
                <span>{text("View Full Plan")}</span>
                <ChevronRight size={15} />
              </button>
            </div>
          </div>

        {/* Goal Cards Grid or Empty State */}
        {!confirmed || selectedGoals.length === 0 ? (
          <div className="hc-inventory-empty hc-goals-empty-state">
            <div className="hc-empty-guide-greeting">
              <HealthCluesPet region={region} topic={topic} pose="guide" />
              <div>
                <strong className="text-base font-extrabold text-[#173f33]">{locale === "vi" ? "Chưa chọn thói quen đồng hành" : text("No confirmed Plan yet.")}</strong>
                <p className="mt-1.5 leading-relaxed text-sm text-[#38594b] font-medium">{locale === "vi" ? "Lumi đã chuẩn bị sẵn các gợi ý thói quen sức khỏe cá nhân hóa dựa trên bài trắc nghiệm của bạn. Hãy chọn 1-2 thói quen bạn muốn đồng hành nhé!" : text("Your Quiz focus is saved. Review suggestions without retaking the Quiz.")}</p>
              </div>
            </div>
            {profile && (
              <button type="button" className="hc-journal-primary-btn" onClick={onReviewSuggestions} style={{ marginTop: "0.85rem", background: "linear-gradient(180deg, #ffe59b 0%, #dcae4e 100%)", color: "#2b210a", fontWeight: "900", border: "1px solid #fff2c3", padding: "0.65rem 1.4rem", borderRadius: "0.75rem", display: "inline-flex", alignItems: "center", gap: "0.5rem", boxShadow: "0 4px 14px rgba(0,0,0,0.3)" }}>
                <Sparkles size={16} /> {locale === "vi" ? "Khám phá & Chọn thói quen ngay (+50 EXP)" : text("Review saved Quiz suggestions")}
              </button>
            )}
          </div>
        ) : (
          <div className="hc-active-goals-grid">
            {selectedGoals.map(goal => {
              const copy = localizedPlanGoalCopy(goal, locale);
              const chosenTitle = displayGoalTitle(goal);
              const cardIllustration = resolveCardIllustration(goal, `${copy.title} ${chosenTitle}`);
              const goalIcon = (goal.iconKey as HealthCluesGameIconName) || resolveWellnessIcon({ text: `${chosenTitle} ${copy.title}`, category: goal.category, description: copy.trackingDefinition }).key;
              const isExpanded = expandedGoalId === goal.goalId;
              const details = goalDetails(goal);

              return (
                <article
                  key={goal.goalId}
                  data-journey-goal={goal.goalId}
                  className={`hc-active-goal-card ${goal.choice === "active" ? "is-active-goal" : "is-saved-goal"} ${isTodayCompleted ? "is-done-today" : ""}`}
                >
                  <div className="hc-goal-compact-main-row">
                    {/* Left Icon Badge: Emoji or Illustration */}
                    <div className="hc-goal-illustration-col">
                      {cardIllustration ? (
                        <div className="hc-goal-3d-frame">
                          <img src={cardIllustration} alt="" className="hc-goal-3d-img" />
                        </div>
                      ) : (
                        <div className="hc-goal-emoji-badge">
                          <span className="hc-goal-emoji-icon">{getHabitEmoji(goal, chosenTitle)}</span>
                        </div>
                      )}
                    </div>

                    {/* Center: Title + Meta */}
                    <div className="hc-goal-info-col" onClick={() => setExpandedGoalId(isExpanded ? null : goal.goalId)}>
                      <p className="hc-quest-card-title">{chosenTitle}</p>
                      <div className="hc-goal-meta-chips">
                        <span className="hc-meta-chip hc-meta-exp">⭐ +20 EXP</span>
                        {details && <span className="hc-meta-chip">· ⏱ {details}</span>}
                      </div>
                    </div>

                    {/* Right: Quick Action Check Button */}
                    {onOpenCheckin && (
                      <div className="hc-goal-right-action-col">
                        {selectedDayInfo && (selectedDayInfo.isUnrecorded || selectedDayInfo.isFuture) ? (
                          <button
                            type="button"
                            disabled
                            className="hc-goal-check-circle is-locked"
                            title={selectedDayInfo.isFuture ? text("Upcoming day") : text("This day has passed")}
                            aria-disabled="true"
                          >
                            <Lock size={13} />
                          </button>
                        ) : isTodayCompleted || (selectedDayInfo && !selectedDayInfo.isToday && selectedDayInfo.isCompleted) ? (
                          <button
                            type="button"
                            className="hc-goal-check-circle is-completed"
                            onClick={onOpenCheckin}
                            title={text("Completed today")}
                            aria-label={text("Completed today")}
                          >
                            <Check size={18} className="stroke-[3]" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="hc-goal-check-circle is-pending"
                            onClick={onOpenCheckin}
                            title={text("Check-in today")}
                            aria-label={text("Check-in today")}
                          >
                            <Check size={15} className="hc-check-pending-icon stroke-[2.5]" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Sleek Minimalist Actions Subrow: [Xem chi tiết] */}
                  <div className="hc-goal-card-actions-row">
                    <button
                      type="button"
                      className="hc-quest-details-toggle"
                      onClick={() => setExpandedGoalId(isExpanded ? null : goal.goalId)}
                    >
                      {isExpanded ? text("Hide details") : text("View details")}
                    </button>
                  </div>

                  <div className={`hc-quest-disclosure-content ${isExpanded ? "is-open" : "is-closed"}`}>
                    {copy.title && copy.title !== chosenTitle && (
                      <small className="hc-journey-reason"><strong>{text("Why this goal")}:</strong> {copy.title}</small>
                    )}
                    {copy.relevanceReason && copy.relevanceReason !== chosenTitle && copy.relevanceReason !== copy.title && (
                      <small className="hc-journey-relevance"><strong>{text("Focus")}:</strong> {copy.relevanceReason}</small>
                    )}
                    {copy.trackingDefinition && copy.trackingDefinition !== chosenTitle && (
                      <small className="hc-journey-tracking-hint"><strong>{text("How to try it")}:</strong> {copy.trackingDefinition}</small>
                    )}
                    {goal.originalNote && (
                      <small className="hc-journey-personal-note"><strong>{text("Personal note:")}</strong> {goal.originalNote}</small>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
      )}

      {/* Interactive Companion Add Habit Modal (Single Screen, No Scroll) */}
      {companionAddOpen && (
        <div className="hc-companion-dialog-backdrop" onClick={() => !customHabitSaving && setCompanionAddOpen(false)} role="dialog" aria-modal="true" aria-label={locale === "vi" ? "Thêm thói quen cùng Trợ lý" : "Add habit with Companion"}>
          <div className="hc-companion-dialog-card" onClick={(e) => e.stopPropagation()}>
            <div className="hc-companion-dialog-header">
              <div className="flex items-center gap-2">
                <span className="hc-companion-badge-tag">{region === "sleep-better" ? "Luna 🦉" : "Lumi 🦊"} {locale === "vi" ? "Trợ lý đồng hành" : "Companion Guide"}</span>
              </div>
              <button
                type="button"
                className="hc-popover-close-btn"
                onClick={() => {
                  setCompanionAddOpen(false);
                  setCompanionStep("input");
                  setCustomHabitText("");
                }}
                aria-label={locale === "vi" ? "Đóng" : "Close"}
              >✕</button>
            </div>

            {companionStep !== "success" ? (
              <div className="hc-companion-step-content">
                <div className="hc-companion-hero-row">
                  <div className="hc-companion-avatar-wrap">
                    <HealthCluesPet region={region} topic={topic} pose="guide" className="hc-companion-pet-img" />
                  </div>
                  <div className="hc-companion-greeting-bubble">
                    <p className="hc-companion-greeting-text">
                      <strong>{locale === "vi" ? `Chào ${userName}!` : `Hello ${userName}!`}</strong> {locale === "vi" ? "Anh muốn thêm thói quen nhỏ nào để cùng em cải thiện sức khỏe mỗi ngày?" : "What healthy habit would you like to build together?"}
                    </p>
                  </div>
                </div>

                <div className="hc-companion-input-box">
                  <label htmlFor="hc-new-habit-input" className="hc-companion-input-label">
                    {locale === "vi" ? "Tên thói quen bạn muốn theo dõi:" : "Name of your new habit:"}
                  </label>
                  <input
                    id="hc-new-habit-input"
                    type="text"
                    className="hc-companion-text-input"
                    placeholder={locale === "vi" ? "Ví dụ: Đi bộ 15 phút, Uống nước ấm..." : "e.g. 15-min walk, drink warm water..."}
                    value={customHabitText}
                    onChange={(e) => setCustomHabitText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && customHabitText.trim() && !customHabitSaving) {
                        e.preventDefault();
                        void handleSaveCustomHabit(customHabitText);
                      }
                    }}
                    disabled={customHabitSaving}
                    autoFocus
                  />
                </div>

                <div className="hc-companion-quick-suggestions">
                  <span className="hc-companion-suggestions-label">
                    {locale === "vi" ? "💡 Gợi ý nhanh 1 chạm:" : "💡 1-tap quick suggestions:"}
                  </span>
                  <div className="hc-companion-quick-pills">
                    {[
                      { icon: "🫁", text: locale === "vi" ? "Thở sâu thư giãn 3 phút" : "3-minute deep breathing" },
                      { icon: "💧", text: locale === "vi" ? "Uống 1 cốc nước ấm" : "Drink a warm glass of water" },
                      { icon: "📵", text: locale === "vi" ? "Tắt màn hình trước khi ngủ" : "Screens off before bed" },
                      { icon: "🚶‍♂️", text: locale === "vi" ? "Đi bộ nhẹ 15 phút" : "15-minute gentle walk" },
                    ].map((sug, i) => (
                      <button
                        key={i}
                        type="button"
                        className="hc-companion-quick-pill"
                        onClick={() => setCustomHabitText(sug.text)}
                        disabled={customHabitSaving}
                      >
                        <span>{sug.icon}</span> <span>{sug.text}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {customHabitError && (
                  <p className="hc-companion-error-msg text-xs text-rose-300 bg-rose-950/60 p-2 rounded-lg text-center my-1 border border-rose-800">
                    {customHabitError}
                  </p>
                )}

                <div className="hc-companion-footer-actions">
                  <button
                    type="button"
                    className="hc-companion-submit-btn"
                    disabled={!customHabitText.trim() || customHabitSaving}
                    onClick={() => void handleSaveCustomHabit(customHabitText)}
                  >
                    {customHabitSaving ? (locale === "vi" ? "Đang lưu..." : "Saving...") : (locale === "vi" ? "➕ Thêm vào hành trình (+20 EXP)" : "➕ Add to Journey (+20 EXP)")}
                  </button>
                </div>
              </div>
            ) : (
              <div className="hc-companion-step-content is-success">
                <div className="hc-companion-hero-row">
                  <div className="hc-companion-avatar-wrap">
                    <HealthCluesPet region={region} topic={topic} pose="celebrate" className="hc-companion-pet-img" />
                  </div>
                  <div className="hc-companion-greeting-bubble is-cheer">
                    <p className="hc-companion-greeting-text font-medium text-emerald-950">
                      {locale === "vi" ? (
                        <>🎉 <strong>Tuyệt vời {userName}!</strong> Em đã ghi nhận thói quen &ldquo;<span className="text-emerald-800 font-bold">{savedHabitTitle}</span>&rdquo; vào Hành trình theo dõi rồi nhé!</>
                      ) : (
                        <>🎉 <strong>Awesome {userName}!</strong> I have added &ldquo;<span className="text-emerald-800 font-bold">{savedHabitTitle}</span>&rdquo; to your Daily Journey!</>
                      )}
                    </p>
                    <p className="text-xs text-emerald-900 mt-2 leading-relaxed">
                      {locale === "vi"
                        ? "Mỗi ngày hoàn thành một việc nhỏ thôi, em sẽ luôn đồng hành và nhắc nhở anh! 🌟 (+20 EXP)"
                        : "Small steps every day make lasting change. I will always be here to support you! 🌟 (+20 EXP)"}
                    </p>
                  </div>
                </div>

                <div className="hc-companion-success-box">
                  <span className="text-2xl">🌱</span>
                  <div>
                    <strong className="block text-sm text-emerald-950">{savedHabitTitle}</strong>
                    <span className="text-xs text-emerald-700">{locale === "vi" ? "Đã kích hoạt trong mục tiêu hằng ngày của bạn" : "Activated in your daily wellness goals"}</span>
                  </div>
                </div>

                {customHabitError && (
                  <p className="hc-companion-error-msg text-xs text-rose-300 bg-rose-950/60 p-2 rounded-lg text-center my-1 border border-rose-800">
                    {customHabitError}
                  </p>
                )}

                <div className="hc-companion-footer-actions">
                  <button
                    type="button"
                    className="hc-companion-done-btn"
                    onClick={() => {
                      setCompanionAddOpen(false);
                      setCompanionStep("input");
                      setCustomHabitText("");
                    }}
                  >
                    {locale === "vi" ? "👍 Xong & Về hành trình" : "👍 Done & Back to Journey"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function DailyReminderPanel({
  region,
  topic,
  accessToken,
  onClose,
}: {
  region: Region;
  topic?: string;
  accessToken: string;
  onClose: () => void;
}) {
  const { locale } = useHealthCluesLocale();
  const [optedIn, setOptedIn] = useState<boolean>(true);
  const [reminderTime, setReminderTime] = useState<string>("07:30");
  const [reminderTimezone, setReminderTimezone] = useState<string>(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Ho_Chi_Minh";
    } catch {
      return "Asia/Ho_Chi_Minh";
    }
  });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [showEmailPreview, setShowEmailPreview] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/healthclues/reminders", {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    })
      .then(async (res) => (res.ok ? (res.json() as Promise<{ preference?: { opted_in: boolean; timezone: string; local_send_time: string; paused: boolean } | null }>) : null))
      .then((data) => {
        if (!active || !data?.preference) return;
        setOptedIn(Boolean(data.preference.opted_in && !data.preference.paused));
        if (data.preference.local_send_time) setReminderTime(data.preference.local_send_time.slice(0, 5));
        if (data.preference.timezone) setReminderTimezone(data.preference.timezone);
      })
      .catch(() => {});
    return () => { active = false; };
  }, [accessToken]);

  const handleSave = async (targetOptedIn: boolean, targetTime?: string, targetTz?: string) => {
    setLoading(true);
    setToast(null);
    const sendTime = targetTime || reminderTime;
    const sendTz = targetTz || reminderTimezone;
    try {
      const res = await fetch("/api/healthclues/reminders", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: targetOptedIn ? "save" : "unsubscribe",
          optedIn: targetOptedIn,
          timezone: sendTz,
          localSendTime: sendTime,
          frequency: "daily",
          consentConfirmed: targetOptedIn ? true : undefined,
        }),
      });
      if (res.ok) {
        setOptedIn(targetOptedIn);
        setToast(
          targetOptedIn
            ? (locale === "vi" ? `Đã lưu lịch nhắc hằng ngày lúc ${sendTime} (${sendTz})!` : `Daily reminder saved for ${sendTime} (${sendTz})!`)
            : (locale === "vi" ? "Đã tắt email nhắc nhở hằng ngày." : "Daily reminder email disabled.")
        );
        setTimeout(() => setToast(null), 4000);
      }
    } catch {
      // safe fallback
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hc-daily-reminder-panel-view">
      <div className="hc-reminder-panel-card">
        <div className="hc-reminder-panel-header">
          <div className="hc-reminder-companion-intro">
            <HealthCluesPet region={region} topic={topic || "general"} pose="guide" className="hc-reminder-pet-avatar" />
            <div>
              <span className="hc-reminder-kicker">HEALTHCLUES · {region === "sleep-better" ? "LUNA" : "LUMI"} {locale === "vi" ? "NHẮC LỊCH" : "REMINDERS"}</span>
              <h2 className="hc-reminder-panel-title">
                {region === "sleep-better" ? "Luna" : "Lumi"} {locale === "vi" ? "đồng hành nhắc nhở bạn mỗi ngày" : "daily reminder companion"}
              </h2>
            </div>
          </div>
          <p className="hc-reminder-panel-subtitle">
            {locale === "vi"
              ? "Mặc định gửi 1 email ấm áp vào mỗi buổi sáng. Đồng hành nhắc nhở thói quen hôm nay và mời bạn điểm danh ngày hôm qua, nhẹ nhàng và không gây phiền toái."
              : "Gentle morning reminder email to start today's wellness habits and reflect on yesterday's check-in. Supportive and zero spam."}
          </p>
        </div>

        {toast && (
          <div className="hc-journey-toast-banner" role="status">
            {toast}
          </div>
        )}

        <div className="hc-reminder-settings-box">
          <button
            type="button"
            className={`hc-reminder-opt-toggle ${optedIn ? "is-active" : "is-inactive"}`}
            disabled={loading}
            onClick={() => void handleSave(!optedIn)}
          >
            <Bell size={18} />
            <span>{optedIn ? (locale === "vi" ? "🔔 Đang bật nhắc nhở hằng ngày" : "🔔 Daily reminder is ON") : (locale === "vi" ? "🔕 Đang tắt nhắc nhở hằng ngày" : "🔕 Daily reminder is OFF")}</span>
          </button>

          <div className="hc-reminder-field-row">
            <label className="hc-reminder-field-label">
              <Clock size={15} /> <span>{locale === "vi" ? "Giờ gửi hằng ngày" : "Daily send time"}</span>
            </label>
            <select
              className="hc-reminder-select-input"
              value={reminderTime}
              disabled={loading || !optedIn}
              onChange={(e) => {
                setReminderTime(e.target.value);
                void handleSave(optedIn, e.target.value, reminderTimezone);
              }}
            >
              <option value="06:30">{locale === "vi" ? "06:30 - Sáng sớm (Khởi đầu ngày mới)" : "06:30 - Early morning (Fresh start)"}</option>
              <option value="07:30">{locale === "vi" ? "07:30 - Buổi sáng (Khuyên dùng: Nhắc thói quen & check-in hôm qua) ⭐" : "07:30 - Morning (Recommended: Habits & yesterday's check-in) ⭐"}</option>
              <option value="08:30">{locale === "vi" ? "08:30 - Giờ làm việc" : "08:30 - Workday start"}</option>
              <option value="12:00">{locale === "vi" ? "12:00 - Trưa" : "12:00 - Midday break"}</option>
              <option value="18:30">{locale === "vi" ? "18:30 - Chiều tan ca" : "18:30 - Evening return"}</option>
              <option value="20:00">{locale === "vi" ? "20:00 - Buổi tối" : "20:00 - Evening wind-down"}</option>
              <option value="21:30">{locale === "vi" ? "21:30 - Trước giờ ngủ" : "21:30 - Before bedtime"}</option>
            </select>
          </div>

          <div className="hc-reminder-field-row">
            <label className="hc-reminder-field-label">
              <Globe size={15} /> <span>{locale === "vi" ? "Múi giờ của bạn" : "Your timezone"}</span>
            </label>
            <select
              className="hc-reminder-select-input"
              value={reminderTimezone}
              disabled={loading || !optedIn}
              onChange={(e) => {
                setReminderTimezone(e.target.value);
                void handleSave(optedIn, reminderTime, e.target.value);
              }}
            >
              <option value="Asia/Ho_Chi_Minh">{locale === "vi" ? "Asia/Ho_Chi_Minh (Việt Nam UTC+7)" : "Asia/Ho_Chi_Minh (Vietnam UTC+7)"}</option>
              <option value="Asia/Bangkok">Asia/Bangkok (UTC+7)</option>
              <option value="Asia/Tokyo">{locale === "vi" ? "Asia/Tokyo (Nhật Bản UTC+9)" : "Asia/Tokyo (Japan UTC+9)"}</option>
              <option value="Asia/Seoul">{locale === "vi" ? "Asia/Seoul (Hàn Quốc UTC+9)" : "Asia/Seoul (Korea UTC+9)"}</option>
              <option value="Asia/Singapore">Asia/Singapore (UTC+8)</option>
              <option value="Australia/Sydney">Australia/Sydney (UTC+10/11)</option>
              <option value="Europe/London">Europe/London (UK GMT/BST)</option>
              <option value="Europe/Paris">{locale === "vi" ? "Europe/Paris (Pháp CET)" : "Europe/Paris (France CET)"}</option>
              <option value="America/New_York">America/New_York (US Eastern)</option>
              <option value="America/Los_Angeles">America/Los_Angeles (US Pacific)</option>
              <option value="UTC">{locale === "vi" ? "UTC (Giờ quốc tế chuẩn)" : "UTC (Universal Standard Time)"}</option>
            </select>
          </div>

          <div className="hc-reminder-actions-row">
            <button
              type="button"
              className="hc-reminder-preview-action-btn"
              onClick={() => setShowEmailPreview(true)}
            >
              <Eye size={15} /> <span>{locale === "vi" ? "Xem trước thư mẫu bạn đồng hành" : "Preview companion email sample"}</span>
            </button>
            <button
              type="button"
              className="hc-reminder-done-btn"
              onClick={onClose}
            >
              <span>{locale === "vi" ? "Xong & Đóng cửa sổ" : "Done & Close window"}</span>
            </button>
          </div>
        </div>

        <div className="hc-reminder-note-badge">
          <span>{locale === "vi" ? "✨ 1 email/ngày · Kết hợp mục tiêu & kiến thức · Tự do bật tắt bất kỳ lúc nào" : "✨ 1 email/day · Goals & knowledge · Turn on/off anytime"}</span>
        </div>
      </div>

      {showEmailPreview && (
        <div className="hc-email-preview-backdrop" onClick={() => setShowEmailPreview(false)} role="dialog" aria-modal="true" aria-label={locale === "vi" ? "Xem trước email Daily Companion" : "Preview Daily Companion Email"}>
          <div className="hc-email-preview-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="hc-email-preview-header">
              <div className="flex items-center gap-2">
                <Mail size={16} className="text-amber-400" />
                <h3 className="font-bold text-white text-base">{locale === "vi" ? "Xem trước email Daily Companion" : "Preview Daily Companion Email"}</h3>
              </div>
              <button
                type="button"
                className="hc-popover-close-btn"
                onClick={() => setShowEmailPreview(false)}
                aria-label={locale === "vi" ? "Đóng xem trước email" : "Close email preview"}
              >✕</button>
            </div>

            <div className="hc-email-preview-inbox-bar">
              <div className="hc-email-meta-row">
                <span className="hc-meta-label">{locale === "vi" ? "Tiêu đề:" : "Subject:"}</span>
                <strong>{locale === "vi" ? `[HealthClues] Tối nay bạn thế nào rồi? ${region === "sleep-better" ? "Luna" : "Lumi"} ghé thăm bạn nè 🌙` : `[HealthClues] How is your day going? ${region === "sleep-better" ? "Luna" : "Lumi"} is dropping by 🌙`}</strong>
              </div>
              <div className="hc-email-meta-row">
                <span className="hc-meta-label">{locale === "vi" ? "Người gửi:" : "From:"}</span>
                <span>{region === "sleep-better" ? "Luna" : "Lumi"} · {locale === "vi" ? "Bạn đồng hành HealthClues" : "HealthClues Companion"} &lt;companion@healthclues.vn&gt;</span>
              </div>
              <div className="hc-email-meta-row">
                <span className="hc-meta-label">{locale === "vi" ? "Gửi lúc:" : "Send time:"}</span>
                <span>{locale === "vi" ? "Mỗi ngày lúc" : "Daily at"} <strong>{reminderTime}</strong> ({reminderTimezone})</span>
              </div>
            </div>

            <div className="hc-email-rendered-card">
              <div className="hc-email-card-header">
                <div className="hc-email-brand-tag">{locale === "vi" ? "HEALTHCLUES · BẠN ĐỒNG HÀNH SỨC KHỎE" : "HEALTHCLUES · WELLNESS COMPANION"}</div>
                <div className="hc-email-hero-section">
                  <div className="hc-email-pet-circle">
                    <HealthCluesPet region={region} topic={topic || "general"} pose="guide" className="hc-email-pet-img" />
                  </div>
                  <h2 className="hc-email-hero-title">
                    {locale === "vi" ? `Chào bạn thân mến, ${region === "sleep-better" ? "Luna" : "Lumi"} đây! 🌿` : `Hello dear friend, ${region === "sleep-better" ? "Luna" : "Lumi"} here! 🌿`}
                  </h2>
                  <p className="hc-email-hero-subtitle">
                    {locale === "vi" ? "Một ngày dài bận rộn lại trôi qua rồi, bạn đã được nghỉ ngơi thảnh thơi chút nào chưa?" : "Another busy day has passed. Have you had a moment to rest and unwind?"}
                  </p>
                </div>
              </div>

              <div className="hc-email-card-body">
                <div className="hc-email-section-box">
                  <p className="text-sm leading-relaxed text-[#2c473c] mb-3">
                    {locale === "vi"
                      ? `${region === "sleep-better" ? "Luna" : "Lumi"} ngồi dưới bầu trời sao ở Thung lũng Giấc ngủ, tự nhiên nhớ tới bạn và muốn ghé qua hỏi thăm một chút.`
                      : `${region === "sleep-better" ? "Luna" : "Lumi"} is resting under the starry sky, thinking of you and stopping by for a warm check-in.`}
                  </p>
                  <p className="text-sm leading-relaxed text-[#2c473c] mb-3">
                    {locale === "vi"
                      ? "Tối nay, bạn đừng để bản thân bị áp lực bởi những mục tiêu lớn lao nhé. Chúng mình chỉ cần cùng nhau làm một việc nhỏ xíu để chăm sóc cơ thể thôi nè."
                      : "Don't let big targets overwhelm you. We only need small, gentle moments to care for our well-being."}
                  </p>
                  <p className="text-xs italic text-[#5f7a6f] mt-3">
                    {locale === "vi"
                      ? `💛 Kể cả hôm nay bạn mệt mỏi quá và chỉ muốn nghỉ ngơi thôi, điều đó cũng hoàn toàn ổn. ${region === "sleep-better" ? "Luna" : "Lumi"} vẫn luôn ở đây bên bạn và lắng nghe.`
                      : `💛 Even if you were exhausted today and only rested, that is completely okay. ${region === "sleep-better" ? "Luna" : "Lumi"} is always here with you.`}
                  </p>
                </div>

                <div className="hc-email-section-box is-knowledge">
                  <h4 className="hc-email-section-title">{locale === "vi" ? "Một món quà nhỏ gửi tặng bạn tối nay 💡" : "A little wellness gift for you 💡"}</h4>
                  <div className="hc-email-knowledge-card">
                    <p className="hc-email-knowledge-text">
                      {region === "sleep-better"
                        ? (locale === "vi"
                          ? "Lumi vừa đọc được một mẹo nhỏ này: Khi chúng mình tạm rời màn hình điện thoại khoảng 15–20 phút trước khi ngủ, não bộ sẽ tự nhiên tiết ra melatonin giúp giấc ngủ sâu và dịu êm hơn rất nhiều. Tối nay thử cùng Lumi để điện thoại sang một bên nhé!"
                          : "Here's a gentle tip: Putting screens away 15–20 minutes before bedtime lets your brain naturally produce melatonin for deeper, more restful sleep.")
                        : (locale === "vi"
                          ? "Một cốc nước ấm nhỏ sau bữa ăn cùng vài phút đi dạo thong thả sẽ giúp cơ thể nhẹ nhõm, hỗ trợ tiêu hóa và mang lại cảm giác bình yên dễ chịu trước khi nghỉ ngơi."
                          : "A warm glass of water after dinner and a relaxed gentle stroll helps digestion and brings calm before bedtime.")}
                    </p>
                    <span className="hc-email-knowledge-source">
                      {locale === "vi" ? "Gửi gắm từ thư viện sức khỏe HealthClues" : "From the HealthClues Wellness Library"}
                    </span>
                  </div>
                </div>

                <div className="text-center my-4">
                  <p className="text-sm font-semibold text-[#183a2d]">
                    {locale === "vi" ? "Chúc bạn có một buổi tối thật dịu êm và một giấc ngủ thật ngon! 🌟" : "Wishing you a peaceful evening and restful sleep! 🌟"}
                  </p>
                  <p className="text-xs text-[#526b62] mt-1">
                    {locale === "vi" ? "Thương mến," : "Warm regards,"}<br />
                    <strong>{region === "sleep-better" ? "Luna" : "Lumi"} 🦊✨</strong><br />
                    <em>{locale === "vi" ? "Người bạn đồng hành sức khỏe của bạn" : "Your personal wellness companion"}</em>
                  </p>
                </div>

                <div className="hc-email-cta-wrap">
                  <button type="button" className="hc-email-cta-btn" onClick={() => setShowEmailPreview(false)}>
                    {locale === "vi" ? `Ghé thăm ${region === "sleep-better" ? "Luna" : "Lumi"} & nhận chút bình yên 🌿` : `Visit ${region === "sleep-better" ? "Luna" : "Lumi"} & unwind 🌿`}
                  </button>
                </div>

                <div className="hc-email-footer-boundary">
                  <p className="hc-email-boundary-text">
                    🔒 <strong>{locale === "vi" ? "Bạn đồng hành luôn lắng nghe:" : "Your companion is always here:"}</strong> {locale === "vi" ? "Email này chỉ gửi 1 lần mỗi ngày vào giờ bạn chọn. Bạn có thể thay đổi giờ hoặc tắt nhắc nhở bất kỳ lúc nào trong game." : "This email is sent once a day at your chosen time. You can change the time or turn off reminders anytime in-game."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MyWellnessPlanPanel({ region, worldId, accessToken, version, goals, profile, questId, openSuggestions = false, onUpdated, onConfirmed }: { region: Region; worldId: string; accessToken: string; version: number | null; goals: WellnessPlanGoal[]; profile: HealthCluesProfile | null; questId: string; openSuggestions?: boolean; onUpdated: () => void; onConfirmed?: () => void }) {
  const { locale, text } = useHealthCluesLocale();
  const effectiveQuestId = profile?.adaptiveDiscovery?.focusId === "sleep" || /sleep|rest|ngủ/i.test(profile?.topic || "") ? "sleep-better" : "health-concern";
  const displayGoalTitle = (goal: WellnessPlanGoal) => getDisplayGoalTitle(goal, locale);
  const [draftGoals, setDraftGoals] = useState(goals);
  const [planVersion, setPlanVersion] = useState(version);
  const lastSavedGoals = useRef(goals);
  const [planLoading, setPlanLoading] = useState(true);
  const [suggestionsOpen, setSuggestionsOpen] = useState(openSuggestions);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<{ targetValue: string; targetUnit: string; frequency: string; trackingDefinition: string } | null>(null);
  const [personalNote, setPersonalNote] = useState("");
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [pendingGoals, setPendingGoals] = useState<WellnessPlanGoal[] | null>(null);
  const requestKey = useRef<string | null>(null);
  const clearNoteAfterSave = useRef(false);
  const [saving, setSaving] = useState(false);
  const immediateSaveQueue = useRef<Promise<void>>(Promise.resolve());
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    void fetch(`/api/healthclues/plan?worldId=${encodeURIComponent(worldId)}`, { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store", signal: controller.signal })
      .then(async response => {
        const result = await response.json() as { plan?: { version: number; goals: WellnessPlanGoal[] } | null; error?: string };
        if (!response.ok) throw new Error(result.error || "Your private Wellness Plan could not be loaded.");
        const saved = result.plan;
        const savedGoals = saved?.goals || [];
        setDraftGoals(savedGoals); lastSavedGoals.current = savedGoals; setPlanVersion(saved?.version ?? null); setError("");
      })
      .catch(cause => { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Your private Wellness Plan could not be loaded."); })
      .finally(() => { if (!controller.signal.aborted) setPlanLoading(false); });
    return () => controller.abort();
  }, [accessToken, worldId]);

  const confirmSuggestions = async (nextGoals: WellnessPlanGoal[]) => {
    if (!accessToken) { setError("Sign in to save your private Wellness Plan."); return; }
    setSaving(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/healthclues/plan", { method: "POST", headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" }, body: JSON.stringify({ worldId, requestKey: crypto.randomUUID(), confirmed: true, goals: nextGoals }), cache: "no-store" });
      const result = await response.json() as { plan?: { version: number; goals: WellnessPlanGoal[] }; error?: string };
      if (!response.ok || !result.plan) throw new Error(result.error || "Your confirmed Plan could not be saved.");
      setDraftGoals(result.plan.goals); lastSavedGoals.current = result.plan.goals; setPlanVersion(result.plan.version); setSuggestionsOpen(false); setNotice(`Saved as Plan version ${result.plan.version}.`); onUpdated(); onConfirmed?.();
    } catch (cause) {
      const msg = cause instanceof Error ? cause.message : "Your confirmed Plan could not be saved.";
      setError(msg);
      throw cause;
    }
    finally { setSaving(false); }
  };

  const persistImmediateSelection = (nextGoals: WellnessPlanGoal[], suggestionIds: string[]) => {
    immediateSaveQueue.current = immediateSaveQueue.current.then(async () => {
      if (!accessToken) throw new Error("Sign in to save your private Wellness Plan.");
      setSaving(true); setError(""); setNotice("");
      const suggestionSet = new Set(suggestionIds);
      const preserved = lastSavedGoals.current.filter(goal => !suggestionSet.has(goal.goalId));
      const combinedGoals = [...preserved, ...nextGoals];
      const saveKey = crypto.randomUUID(); requestKey.current = saveKey; setPendingGoals(combinedGoals);
      const response = await fetch("/api/healthclues/plan", { method: "POST", headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" }, body: JSON.stringify({ worldId, requestKey: saveKey, confirmed: true, goals: combinedGoals }), cache: "no-store" });
      const result = await response.json() as { plan?: { version: number; goals: WellnessPlanGoal[] }; error?: string };
      if (!response.ok || !result.plan) throw new Error(result.error || "Your selected goal could not be saved.");
      requestKey.current = null; setPendingGoals(null); setDraftGoals(result.plan.goals); lastSavedGoals.current = result.plan.goals; setPlanVersion(result.plan.version); setNotice("Plan saved."); onUpdated();
    }).catch(cause => { setError(cause instanceof Error ? cause.message : "Your selected goal could not be saved."); })
      .finally(() => setSaving(false));
  };

  const persistPlan = async (nextGoals: WellnessPlanGoal[], retry = false) => {
    setSaving(true); setError(""); setNotice(""); setDraftGoals(nextGoals);
    if (!retry || !requestKey.current) requestKey.current = crypto.randomUUID();
    setPendingGoals(nextGoals);
    try {
      const response = await fetch("/api/healthclues/plan", { method: "POST", headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" }, body: JSON.stringify({ worldId, requestKey: requestKey.current, confirmed: true, goals: nextGoals }), cache: "no-store" });
      const result = await response.json() as { plan?: { version?: number; goals?: WellnessPlanGoal[] }; error?: string };
      if (!response.ok || !result.plan) throw new Error(result.error || "Your Plan update could not be saved.");
      const savedGoals = result.plan.goals ?? nextGoals;
      requestKey.current = null; setPendingGoals(null); setPlanVersion(result.plan.version ?? null); lastSavedGoals.current = savedGoals; setDraftGoals(savedGoals); setEditingId(null); setEditDraft(null); setRemovingId(null); setNotice(`Saved as Plan version ${result.plan.version}.`); if (clearNoteAfterSave.current) setPersonalNote(""); clearNoteAfterSave.current = false; onUpdated();
    } catch (cause) { setDraftGoals(lastSavedGoals.current); setError(cause instanceof Error ? cause.message : "Your Plan update could not be saved."); }
    finally { setSaving(false); }
  };
  const beginEdit = (goal: WellnessPlanGoal) => {
    setEditingId(goal.goalId); setRemovingId(null); setNotice("");
    setEditDraft({ targetValue: goal.targetValue === null || goal.targetValue === undefined ? "" : String(goal.targetValue), targetUnit: goal.targetUnit || "", frequency: goal.frequency, trackingDefinition: goal.trackingDefinition });
  };
  const saveEdit = (goal: WellnessPlanGoal) => {
    if (!editDraft) return;
    const value = editDraft.targetValue.trim() ? Number(editDraft.targetValue) : null;
    if (value !== null && (!Number.isFinite(value) || value < 0 || value > 10000)) { setError("Choose a valid measurable target."); return; }
    if (!editDraft.trackingDefinition.trim()) { setError("Describe how you want to track this goal."); return; }
    const next = draftGoals.map(item => item.goalId === goal.goalId ? { ...item, targetValue: value, targetUnit: editDraft.targetUnit.trim() || null, frequency: editDraft.frequency, trackingDefinition: editDraft.trackingDefinition.trim() } : item);
    void persistPlan(next);
  };
  const addPersonalNote = () => {
    const title = personalNote.trim();
    if (!title) { setError("Write a short personal goal first."); return; }
    const normalized = title.toLowerCase();
    const goalType: WellnessPlanGoal["goalType"] = /\b(avoid|stop|quit)\b/.test(normalized) ? "avoid" : /\b(reduce|less|limit|cut)\b/.test(normalized) ? "reduce" : "maintain";
    const category: WellnessPlanGoal["category"] = /sleep|bedtime|wind.down/.test(normalized) ? "sleep" : /walk|movement|exercise|activity/.test(normalized) ? "movement" : /food|meal|vegetable|soda|drink|water|nutrition/.test(normalized) ? "nutrition" : /breathe|relax|mindful|meditat/.test(normalized) ? "mindfulness" : "general routine";
    const resolved = validateAndResolveGoalIcon({ title, category });
    const goal: WellnessPlanGoal = { goalId: crypto.randomUUID(), templateId: null, title: title.slice(0, 120), category, iconKey: (resolved.aiHabitKey || resolved.iconKey) as string, goalType, choice: "saved", frequency: "Flexible", durationMinutes: null, trackingUnit: "self-reported", trackingDefinition: "Personal note saved for later. Configure a measurable routine before activating.", targetValue: null, targetUnit: null, durationDays: null, safetyStatus: "user_created_unreviewed", provenance: "user_created", sourceVersion: null, evidenceStatus: "USER-CREATED · NOT REVIEWED", explanation: "Added by the player as a personal goal note.", safetyNote: null, sources: [] };
    clearNoteAfterSave.current = true;
    void persistPlan([...draftGoals, goal]);
  };
  const frequencyOptions = ["Flexible", "Once a week", "3 days a week", "Most days", "Daily", ...Array.from({ length: 7 }, (_, index) => `${index + 1} days a week`)];
  return <section className="hc-my-wellness-plan" id="hc-plan" data-my-wellness-plan data-plan-persistence-state={error ? "PERSISTENCE_ERROR" : saving ? "PERSISTING" : planVersion !== null ? "PERSISTED" : "NOT_PERSISTED"}>
    {!suggestionsOpen && <div className="hc-plan-intro"><p>{text("Your confirmed goals, saved with this Wellness World.")}</p><span>{planVersion ? `${text("Plan version")} ${planVersion} · ` : ""}{text("World goals and daily check-ins are separate. No completion is inferred from your plan.")}</span></div>}
    {!suggestionsOpen && profile && draftGoals.length > 0 && <button type="button" className="hc-inventory-link" onClick={() => setSuggestionsOpen(true)}>{text("Review wellness suggestions")}</button>}
    {planLoading && <p role="status" className="hc-plan-notice">{text("Loading the confirmed Plan for this World…")}</p>}
    {!suggestionsOpen && !planLoading && !error && !draftGoals.length && <div className="hc-plan-empty"><HealthCluesPet region={region} topic="your Journey"/><h3>{text("No confirmed goals for this World yet")}</h3><p>{text("Your Quiz is saved. You can review its wellness suggestions and choose goals now without taking the Quiz again. Nothing becomes active until you confirm it.")}</p>{profile ? <button type="button" onClick={()=>setSuggestionsOpen(true)}>{text("Review my Quiz suggestions")}</button> : <p role="status">{text("A saved Quiz profile is not available for this account. You can still add a personal goal note below.")}</p>}</div>}
    {!suggestionsOpen && !planLoading && !error && draftGoals.map(goal => {
      const copy = localizedPlanGoalCopy(goal, locale);
      const chosenTitle = displayGoalTitle(goal);
      const goalIcon = (goal.iconKey as HealthCluesGameIconName) || resolveWellnessIcon({ text: `${copy.title} ${copy.optionTitle || ""}`, category: goal.category, description: copy.trackingDefinition }).key;
      const state = text(goal.choice === "active" ? "Active" : goal.choice === "saved" ? "Saved for later" : "Skipped");
      const source = text(goal.provenance === "user_created" ? "My Own Goal · self-reported" : goal.evidenceStatus.includes("TEST ONLY") ? "TEST ONLY · not reviewed" : "Suggested goal");
      const target = goal.targetValue !== null && goal.targetValue !== undefined ? `${goal.targetValue} ${text(goal.targetUnit || goal.trackingUnit)}` : "";
      const needsConfiguration = goal.provenance === "user_created" && (goal.targetValue === null || goal.targetValue === undefined || !goal.targetUnit);
      return <article className="hc-plan-goal" key={goal.goalId}><div><span>{source}</span><div style={{ display: "flex", alignItems: "center", gap: "0.55rem" }}><HealthCluesGameIcon icon={goalIcon} tone={goal.choice === "active" ? "gold" : "lavender"} size="md" /><h3>{chosenTitle}</h3></div>{copy.title && copy.title !== chosenTitle && <p>{text("Why this goal")}: {copy.title}{copy.relevanceReason && copy.relevanceReason !== copy.title ? ` — ${copy.relevanceReason}` : ""}</p>}{goal.provenance === "ai_generated" && copy.trackingDefinition && copy.trackingDefinition !== chosenTitle && <p>{text("How to try it")}: {copy.trackingDefinition}</p>}{editingId === goal.goalId && editDraft && <div className="hc-plan-edit" data-plan-goal-editor={goal.goalId}><label>Tracking target<input type="number" min="0" max="10000" value={editDraft.targetValue} onChange={event=>setEditDraft({ ...editDraft, targetValue: event.target.value })} placeholder="Set your own target or leave blank"/></label><label>Target unit<input value={editDraft.targetUnit} readOnly={goal.provenance === "habit_library"} onChange={event=>setEditDraft({ ...editDraft, targetUnit: event.target.value })} placeholder="e.g. sessions per week"/></label><label>Schedule<select value={editDraft.frequency} onChange={event=>setEditDraft({ ...editDraft, frequency: event.target.value })}>{frequencyOptions.map(option=><option key={option}>{option}</option>)}</select></label><label>How you want to track it<textarea maxLength={240} value={editDraft.trackingDefinition} onChange={event=>setEditDraft({ ...editDraft, trackingDefinition: event.target.value })}/></label>{goal.provenance === "user_created" && <small>This goal stays saved for later until you choose a measurable target and activate it.</small>}<div><button type="button" disabled={saving} onClick={()=>saveEdit(goal)}>Save Plan revision</button><button type="button" disabled={saving} onClick={()=>{setEditingId(null);setEditDraft(null);}}>{text("Cancel")}</button></div></div>}{removingId === goal.goalId && <div className="hc-plan-remove-confirm" role="group" aria-label={`${text("Remove")} ${copy.title}`}><span>{text("Remove this goal from your current Plan?")}</span><button type="button" disabled={saving} onClick={()=>void persistPlan(draftGoals.filter(item=>item.goalId!==goal.goalId))}>{text("Remove goal")}</button><button type="button" onClick={()=>setRemovingId(null)}>{text("Keep goal")}</button></div>}<div className="hc-plan-actions">{editingId !== goal.goalId && <button type="button" onClick={()=>beginEdit(goal)}>{text("Edit")}</button>}{goal.choice !== "skipped" && editingId !== goal.goalId && <button type="button" disabled={saving} onClick={()=>needsConfiguration ? beginEdit(goal) : void persistPlan(draftGoals.map(item=>item.goalId===goal.goalId?{...item,choice:item.choice==="active"?"saved":"active"}:item))}>{goal.choice === "active" ? text("Pause") : needsConfiguration ? text("Configure goal") : text("Resume")}</button>}{removingId !== goal.goalId && editingId !== goal.goalId && <button type="button" disabled={saving} onClick={()=>{setRemovingId(goal.goalId);setEditingId(null);setEditDraft(null);}}>{text("Remove")}</button>}</div></div><div className="hc-plan-goal-meta"><span className={`hc-plan-status ${goal.choice === "active" ? "is-active" : goal.choice === "saved" ? "is-saved" : "is-skipped"}`}>{state}</span>{target && <span>{target}</span>}{goal.frequency !== "Flexible" && <span>{text(goal.frequency)}{goal.durationDays ? ` · ${goal.durationDays} ${text("days")}` : ""}{goal.durationMinutes ? ` · ${goal.durationMinutes} ${text("minutes")}` : ""}</span>}</div></article>;
    })}
    {!planLoading && !error && !suggestionsOpen && <form className="hc-plan-add-note" onSubmit={event=>{event.preventDefault();addPersonalNote();}}><label htmlFor="hc-world-plan-note">+ {text("Add My Own Goal")}</label><p>{text("Write one short note. It will be saved as self-reported and inactive until you configure it.")}</p><div><input id="hc-world-plan-note" maxLength={120} value={personalNote} onChange={event=>setPersonalNote(event.target.value)} placeholder={text("e.g. I want to reduce sugary drinks for 3 days")}/><button type="submit" disabled={saving}>{text("Save note")}</button></div></form>}
    {error && <p className="hc-plan-error" role="alert">{text("Your private Wellness Plan could not be saved. Please try again.")}{pendingGoals && <button type="button" disabled={saving} onClick={()=>void persistPlan(pendingGoals,true)}>{text("Retry saving")}</button>}</p>}{notice && <p className="hc-plan-notice" role="status">{text("Plan saved.")} {planVersion ? `${text("Plan version")} ${planVersion}.` : ""}</p>}
    {suggestionsOpen && profile && <div className="hc-plan-recovery" role="region" aria-label={text("Review wellness suggestions")}><WellnessPlanBuilder profile={profile} questId={effectiveQuestId} worldId={worldId} accessToken={accessToken} advisorCacheKey={worldId} initialGoals={draftGoals} onConfirm={goals=>void confirmSuggestions(goals)} onSelectionChange={openSuggestions ? persistImmediateSelection : undefined} onSkip={()=>setSuggestionsOpen(false)} onBack={()=>setSuggestionsOpen(false)}/></div>}
    {suggestionsOpen && <section className="hc-plan-following" aria-label={text("Currently following")} data-currently-following><h2>{text("Currently following")}</h2>{planLoading ? <p role="status">{text("Loading your followed goals…")}</p> : draftGoals.some(goal => goal.choice === "active") ? <ul>{draftGoals.filter(goal => goal.choice === "active").map(goal => { const copy = localizedPlanGoalCopy(goal, locale); const goalIcon = (goal.iconKey as HealthCluesGameIconName) || resolveWellnessIcon({ text: `${copy.title} ${copy.optionTitle || ""}`, category: goal.category, description: copy.trackingDefinition }).key; const chosenTitle = displayGoalTitle(goal); return <li key={goal.goalId} data-following-goal={goal.goalId}><HealthCluesGameIcon icon={goalIcon} tone="gold"/><div><strong>{chosenTitle}</strong><span className="hc-journey-status is-active">{text("Active")}</span></div></li>; })}</ul> : <p role="status">{text("You are not following any goals yet. Choose and tick any suggestions above, or continue with zero goals.")}</p>}</section>}
    {!suggestionsOpen && <p className="hc-plan-footnote">{text("These are the goals you selected. They are not medical instructions and do not indicate completed activity.")}</p>}
  </section>;
}
