"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowDownRight, ArrowRight, Award, Backpack, Check, Compass, Leaf, Map, Moon, Mountain, Plus, ShieldCheck, Sparkles, Sun, Wind } from "lucide-react";
import { getCloudSession, subscribeCloudSession, type CloudSession, sendMagicLink, loadHealthCluesProfile, saveHealthCluesProfile, clearCloudSession, handleSessionExpired, refreshCloudSession } from "@/lib/wellness-cloud";
import { clearPendingHealthCluesJourney, getPendingHealthCluesJourney, type PendingHealthCluesJourney } from "@/lib/healthclues-pending-journey";
import { WellnessWorldMap, WELLNESS_REGIONS } from "./world-map";
import { ToolkitCollection } from "./ToolkitCollection";
import { KnowledgeJourneyPanel } from "./KnowledgeJourneyPanel";
import { PrivateJournalPanel } from "./PrivateJournalPanel";
import { BossBattlePanel } from "./BossBattlePanel";
import { ComboJourneyPanel } from "./ComboJourneyPanel";
import { CommunityJourneysPanel } from "./CommunityJourneysPanel";
import { ReminderPreferencesPanel } from "./ReminderPreferencesPanel";
import { WorldAdventureScene } from "./WorldAdventureScene";
import { DailyCheckinDialog } from "./DailyCheckinDialog";
import { resolveJourneyPlaybook } from "./gout-playbook";
import type { PetRegion } from "./HealthCluesPet";
import { HealthCluesAdventurer } from "@/components/healthclues/HealthCluesAdventurer";
import { HealthCluesGameShell } from "@/components/healthclues/HealthCluesGameShell";
import { useHealthCluesLocale } from "@/components/healthclues/HealthCluesLocaleProvider";
import { useRouter } from "next/navigation";
import { localeHealthCluesPath } from "@/components/healthclues/HealthCluesLocaleProvider";
import type { ToolkitSlot, UsageStatus } from "./toolkit-domain";
import type { WellnessPlanGoal } from "./wellness-plan";
import type { HealthCluesProfile } from "@/lib/healthclues-quiz";
import { getHealthCluesSessionProfile } from "@/lib/healthclues-funnel";
import { mergeVerifiedDiscoveryProfile, localizedDiscoveryConcern } from "@/features/healthclues/onboarding-context";

function storedQuizProfile(value: Record<string, unknown> | null): HealthCluesProfile | null {
  if (!value || typeof value.topic !== "string" || !value.topic.trim()) return null;
  const adaptiveRaw = value.adaptiveDiscovery && typeof value.adaptiveDiscovery === "object" && !Array.isArray(value.adaptiveDiscovery) ? value.adaptiveDiscovery as Record<string, unknown> : null;
  const focusIds = ["sleep", "weight-fitness", "health-concern", "beauty-skin", "healthy-aging", "stress", "other"];
  const adaptive = adaptiveRaw && adaptiveRaw.schemaVersion === 1 && adaptiveRaw.ageConfirmed === true && focusIds.includes(String(adaptiveRaw.focusId)) && typeof adaptiveRaw.focusLabel === "string" && Array.isArray(adaptiveRaw.answers) && adaptiveRaw.answers.length <= 8
    ? { schemaVersion: 1 as const, ageConfirmed: true as const, focusId: adaptiveRaw.focusId as NonNullable<HealthCluesProfile["adaptiveDiscovery"]>["focusId"], focusLabel: adaptiveRaw.focusLabel.slice(0, 100), ...(typeof adaptiveRaw.concernDetail === "string" ? { concernDetail: adaptiveRaw.concernDetail.slice(0, 100) } : {}), answers: adaptiveRaw.answers.flatMap((entry: unknown) => { if (!entry || typeof entry !== "object" || Array.isArray(entry)) return []; const row = entry as Record<string, unknown>; if (typeof row.questionId !== "string" || !/^q-[a-z0-9-]{2,48}$/.test(row.questionId) || !Array.isArray(row.answerIds) || !Array.isArray(row.answerLabels) || row.answerIds.length > 12 || row.answerIds.length !== row.answerLabels.length || !row.answerIds.every((item: unknown) => typeof item === "string" && (/^a-[a-z0-9-]{1,48}$/.test(item) || item === "none" || item === "unsure")) || !row.answerLabels.every((item: unknown) => typeof item === "string" && item.length <= 100)) return []; return [{ questionId: row.questionId, answerIds: row.answerIds as string[], answerLabels: row.answerLabels as string[], ...(typeof row.optionalText === "string" ? { optionalText: row.optionalText.slice(0, 180) } : {}) }]; }) }
    : null;
  const answerState = (input: unknown): "yes" | "no" | "unknown" => input === "yes" || input === "no" ? input : "unknown";
  const safety = value.safetyContext && typeof value.safetyContext === "object" && !Array.isArray(value.safetyContext)
    ? value.safetyContext as Record<string, unknown>
    : {};
  return {
    topic: value.topic.slice(0, 120),
    contentPreferences: Array.isArray(value.contentPreferences) ? value.contentPreferences.filter((item): item is string => typeof item === "string").slice(0, 20) : [],
    presentation: typeof value.presentation === "string" ? value.presentation : "A mix of everything",
    comfortableActivityTime: typeof value.comfortableActivityTime === "string" ? value.comfortableActivityTime : "I only want to read",
    refreshFrequency: typeof value.refreshFrequency === "string" ? value.refreshFrequency : "Weekly",
    twoWeekGoal: typeof value.twoWeekGoal === "string" ? value.twoWeekGoal : "Find interesting new information",
    createdAt: typeof value.createdAt === "string" ? value.createdAt : "",
    safetyLevel: value.safetyLevel === "urgent" || value.safetyLevel === "caution" || value.safetyLevel === "none" ? value.safetyLevel : "caution",
    country: typeof value.country === "string" ? value.country : undefined,
    excludedIngredients: Array.isArray(value.excludedIngredients) ? value.excludedIngredients.filter((item): item is string => typeof item === "string").slice(0, 30) : [],
    foodSafetyHold: value.foodSafetyHold === true,
    activitySafetyHold: value.activitySafetyHold === true,
    specificInterests: Array.isArray(value.specificInterests) ? value.specificInterests.filter((item): item is string => typeof item === "string").slice(0, 30) : [],
    safetyContext: {
      foodAllergy: answerState(safety.foodAllergy), foodRestriction: answerState(safety.foodRestriction),
      professionalRestriction: answerState(safety.professionalRestriction), activityRestriction: answerState(safety.activityRestriction),
      medicationOrSupplement: answerState(safety.medicationOrSupplement), acutePainfulJoint: answerState(safety.acutePainfulJoint),
      urgentSymptoms: answerState(safety.urgentSymptoms), fluidRestriction: answerState(safety.fluidRestriction),
    },
    ...(adaptive ? { adaptiveDiscovery: adaptive } : {}),
  };
}

type QuestId = typeof WELLNESS_REGIONS[number]["id"];
type Tool = { id: string; slug: string; kind: string; category?: string | null; slot: ToolkitSlot; version: number; name: string; description: string; icon: string | null; evidenceClass: string; evidenceSummary: string | null; evidenceSources?: Array<{ title: string; url: string }>; safetyNotes: string | null; contraindications: unknown[]; recommendationEligible: boolean; demoOnly?: boolean };
type Entry = { id: string; journey_id: string; catalog_item_id: string | null; item_version: number | null; method_id: string | null; method_version: number | null; personal_tool_id: string | null; slot_key: ToolkitSlot; equipment_position?: number | null; discovery_station?: "nutrition" | "practices" | "movement" | null; status: string; schedule: Record<string, unknown> };
type CollectionItem = { id: string; catalog_item_id: string | null; personal_tool_id: string | null; saved_at: string };
type ToolkitEvent = { id: string; toolkit_entry_id: string; event_type: string; previous_status: string; next_status: string; replacement_entry_id: string | null; effective_date: string; created_at: string };
type WorldPayload = { world: { id: string; title: string; timezone: string } | null; branches: Array<{ id: string; topic_key: string; title: string; status: string }>; journeys: Array<{ id: string; branch_id: string; title: string; status: string; started_on: string }>; entries: Entry[]; collection: CollectionItem[]; entryEvents: ToolkitEvent[]; checkins: Array<{ id: string; local_date: string; revision: number; note_private?: string | null }>; usage: Array<{ checkin_id: string; toolkit_entry_id: string; status: UsageStatus; occurrence_count: number | null }>; xpTotal: number; knowledgeCurrencies: { fragments: number; keys: number }; rewards: Array<{ reward_id: string; awarded_at: string; reward_type: "badge" | "map_unlock" | "cosmetic"; title: string; version: number }>; milestones: Array<{ milestone_day: number; reached_on: string }>; unlocks: Array<{ unlock_key: string; source_type: string; source_id: string }>; wellnessPlan: { version: number; confirmedAt: string; goals: WellnessPlanGoal[] } | null };
type Selection = { catalogItemId: string; itemVersion: number; methodId: null; methodVersion: null; slot: ToolkitSlot };

const questLabels: Record<QuestId, { name: string; region: string; intro: string }> = {
  "sleep-better": { name: "Sleep Better", region: "Sleep Valley", intro: "A quieter trail toward restful routines." },
  "feel-calmer": { name: "Feel Calmer", region: "Calm Forest", intro: "A gentle path to explore moments of calm." },
  "more-energy": { name: "More Energy", region: "Energy Hills", intro: "Small, sustainable habits for everyday energy." },
  "eat-healthier": { name: "Eat Healthier", region: "Nutrition Garden", intro: "Explore nourishing choices one step at a time." },
  "move-more": { name: "Move More", region: "Movement Peaks", intro: "Find movement that fits into your day." },
  "healthy-weight": { name: "Healthy Weight", region: "Balance Meadow", intro: "Explore balanced everyday routines." },
  "natural-wellness": { name: "Explore Natural Wellness", region: "Natural Living Forest", intro: "Learn about nature, food, and daily habits." },
  "health-concern": { name: "HealthClues Realm", region: "HealthClues Realm", intro: "Follow your Discovery Quiz into a personal wellness journey." },
};
const slots: Array<{ id: ToolkitSlot; title: string; subtitle: string; icon: typeof Leaf; accent: string }> = [
  { id: "consume", title: "Consume / Eat", subtitle: "Food, ingredients, recipes", icon: Leaf, accent: "#c98f4b" },
  { id: "reduce", title: "Reduce / Avoid", subtitle: "A habit you want to adjust", icon: ArrowDownRight, accent: "#6c9b8a" },
  { id: "practice", title: "Do / Practice", subtitle: "Movement, breathing, rest", icon: Wind, accent: "#789cbd" },
];
const emptyWorld = (): WorldPayload => ({ world: null, branches: [], journeys: [], entries: [], collection: [], entryEvents: [], checkins: [], usage: [], xpTotal: 0, knowledgeCurrencies: { fragments: 0, keys: 0 }, rewards: [], milestones: [], unlocks: [], wellnessPlan: null });

function localDate(timeZone: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

function QuestIcon({ id }: { id: string }) {
  const icon = id === "sleep-better" ? Moon : id === "more-energy" ? Sun : id === "move-more" ? Mountain : id === "natural-wellness" ? Leaf : Compass;
  const Icon = icon;
  return <Icon aria-hidden="true" className="h-5 w-5"/>;
}

export function WellnessWorldGame({ initialQuest, entryQuest, onboardingBackpack = false, autoOpenCheckin = false }: { initialQuest: string; entryQuest?: string; onboardingBackpack?: boolean; autoOpenCheckin?: boolean }) {
  const { locale } = useHealthCluesLocale();
  const router = useRouter();
  const effectiveInitialQuest = initialQuest === "sleep-better" ? "health-concern" : initialQuest;
  const initialQuestId = (effectiveInitialQuest in questLabels ? effectiveInitialQuest : "health-concern") as QuestId;
  const [questId, setQuestId] = useState<QuestId>(initialQuestId);
  const quest = questLabels[questId];
  const [session, setSession] = useState<CloudSession | null>(null);
  const [catalog, setCatalog] = useState<Tool[]>([]);
  const [worldData, setWorldData] = useState<WorldPayload>(emptyWorld());
  const [replaceFor, setReplaceFor] = useState<string | null>(null);
  const [replacementItemId, setReplacementItemId] = useState("");
  const [scheduleFor, setScheduleFor] = useState<string | null>(null);
  const [scheduleTime, setScheduleTime] = useState("08:00");
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [sessionExpired, setSessionExpired] = useState(false);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginSent, setLoginSent] = useState(false);
  const [consented, setConsented] = useState(false);
  const [guestWorld, setGuestWorld] = useState(false);
  const [checkinOpen, setCheckinOpen] = useState(false);
  const [checkinLoaded, setCheckinLoaded] = useState(false);
  const [usageStatuses, setUsageStatuses] = useState<Record<string, UsageStatus>>({});
  const [occurrenceCounts, setOccurrenceCounts] = useState<Record<string, number>>({});
  const [privateNote, setPrivateNote] = useState("");
  const savedRequestKey = useRef<string | null>(null);
  const [loadedWorldOwner, setLoadedWorldOwner] = useState<string | null>(null);
  const [activationContext, setActivationContext] = useState<PendingHealthCluesJourney | null>(null);
  const [pendingChecked, setPendingChecked] = useState(!onboardingBackpack);
  const [activationProfileSaved, setActivationProfileSaved] = useState(false);
  const [showFirstPlan, setShowFirstPlan] = useState(false);
  const [journeyProfile, setJourneyProfile] = useState<Record<string, unknown> | null>(null);
  const activationProfileOwner = useRef("");
  const activationAutoCreateStarted = useRef(false);
  const [, setMapQuest] = useState<string>(questId);
  const today = useMemo(() => localDate(worldData.world?.timezone || (typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC" : "UTC")), [worldData.world?.timezone]);

  const authorizedFetch = useCallback(async (input: string, init: RequestInit = {}) => {
    let currentSession = session || getCloudSession();
    if (!currentSession) {
      setSessionExpired(true);
      handleSessionExpired(locale);
      throw new Error("Sign in to continue.");
    }
    let response = await fetch(input, {
      ...init,
      headers: {
        ...(init.headers || {}),
        Authorization: `Bearer ${currentSession.access_token}`,
        "Content-Type": "application/json"
      },
      cache: "no-store"
    });

    if (response.status === 401 || response.status === 403) {
      const refreshed = await refreshCloudSession();
      if (refreshed) {
        setSession(refreshed);
        response = await fetch(input, {
          ...init,
          headers: {
            ...(init.headers || {}),
            Authorization: `Bearer ${refreshed.access_token}`,
            "Content-Type": "application/json"
          },
          cache: "no-store"
        });
      }
    }

    if (response.status === 401 || response.status === 403) {
      setSessionExpired(true);
      handleSessionExpired(locale);
      throw new Error(locale === "vi" ? "Phiên đăng nhập đã hết hạn." : "Your sign-in session is invalid or expired.");
    }

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(typeof payload.error === "string" ? payload.error : "The request could not be completed.");
    return payload;
  }, [locale, session]);

  const loadWorld = useCallback(async () => {
    const currentSession = session || getCloudSession();
    if (!currentSession) {
      setLoadedWorldOwner(null);
      setWorldData(emptyWorld());
      setLoading(false);
      setSessionExpired(true);
      handleSessionExpired(locale);
      return;
    }
    const firstLoadForOwner = loadedWorldOwner !== currentSession.user.id;
    if (firstLoadForOwner) { setLoadedWorldOwner(null); setWorldData(emptyWorld()); setLoading(true); }
    setPageError("");
    try {
      const [payload, profile] = await Promise.all([
        authorizedFetch("/api/healthclues/world") as Promise<WorldPayload>,
        loadHealthCluesProfile(currentSession).catch(() => null),
      ]);
      setWorldData(payload);
      if (Array.isArray(payload.branches) && payload.branches.length > 0) {
        const branchTopic = payload.branches[0].topic_key;
        if (branchTopic in questLabels) {
          setQuestId(branchTopic as QuestId);
        }
      }
      setJourneyProfile(profile && typeof profile === "object" && !Array.isArray(profile) ? profile as Record<string, unknown> : null);
      setLoadedWorldOwner(currentSession.user.id);
    }
    catch (error) {
      const msg = error instanceof Error ? error.message : "";
      if (msg.includes("invalid or expired") || msg.includes("Phiên đăng nhập đã hết hạn") || msg.includes("Sign in to continue")) {
        setSessionExpired(true);
        handleSessionExpired(locale);
        return;
      }
      setLoadedWorldOwner(currentSession.user.id);
      setPageError(msg || "Your Wellness World could not be loaded.");
    }
    finally { setLoading(false); }
  }, [authorizedFetch, loadedWorldOwner, locale, session]);

  useEffect(() => {
    const sync = () => setSession(getCloudSession());
    sync();
    return subscribeCloudSession(sync);
  }, []);

  useEffect(() => {
    const current = getCloudSession();
    let active = true;
    const checkPending = async () => {
      try {
        if (!current?.user.email || !(current.user.email_confirmed_at || current.user.confirmed_at)) {
          return;
        }
        let pending = await getPendingHealthCluesJourney(current.access_token).catch(() => null);
        if (!pending && typeof window !== "undefined") {
          try {
            const rawLocal = localStorage.getItem("healthclues-pending-journey-local") || sessionStorage.getItem("healthclues-pending-journey-local");
            if (rawLocal) {
              const candidate = JSON.parse(rawLocal) as PendingHealthCluesJourney;
              if (!candidate?.email || candidate.email === current.user.email?.trim().toLowerCase()) {
                pending = { ...candidate, email: current.user.email?.trim().toLowerCase() };
                try {
                  localStorage.setItem("healthclues-pending-journey-local", JSON.stringify(pending));
                  sessionStorage.setItem("healthclues-pending-journey-local", JSON.stringify(pending));
                } catch {}
              }
            }
          } catch {}
        }
        if (!active) return;
        if (pending && (!pending.email || pending.email === current.user.email?.trim().toLowerCase())) {
          if (pending.questId in questLabels) setQuestId(pending.questId as QuestId);
          setActivationContext(pending);
        }
      } finally {
        if (active) setPendingChecked(true);
      }
    };
    void checkPending();
    return () => { active = false; };
  }, [onboardingBackpack]);

  useEffect(() => {
    if (!activationContext || !session) return;
    if (activationContext.email !== session.user.email?.trim().toLowerCase() || !(session.user.email_confirmed_at || session.user.confirmed_at)) {
      void clearPendingHealthCluesJourney(session.access_token); window.setTimeout(() => { setActivationContext(null); setPageError("Sign in with the verified email used for this adventure preview."); }, 0); return;
    }
    if (activationProfileOwner.current === session.user.id) return;
    activationProfileOwner.current = session.user.id;
    let active = true;
    void (async () => {
      try {
        const existingProfile = await loadHealthCluesProfile(session);
        if (!active) return;
        const mergedProfile = await mergeVerifiedDiscoveryProfile(existingProfile, activationContext.profile);
        await saveHealthCluesProfile(mergedProfile, activationContext.consentedAt, session);
        if (active) setActivationProfileSaved(true);
      } catch (error) {
        activationProfileOwner.current = "";
        if (active) setPageError(error instanceof Error ? error.message : "Your discovery could not be saved yet.");
      }
    })();
    return () => { active = false; };
  }, [activationContext, session]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/healthclues/catalog", { cache: "no-store" }).then(async response => {
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Reviewed tools are unavailable.");
      if (cancelled) return;
      const items = Array.isArray(payload.items) ? payload.items as Tool[] : [];
      setCatalog(items);
    }).catch(error => { if (!cancelled) setPageError(error instanceof Error ? error.message : "The learning catalog is unavailable."); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadWorld(); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadWorld]);

  const enterWorld = async () => {
    if (!session) { setGuestWorld(true); setNotice("Guest preview opened. This temporary World is not saved. Sign in when you want to keep a persistent map and private check-ins."); return; }
    const targetTopicKey = (activationContext?.questId && activationContext.questId in questLabels)
      ? (activationContext.questId as QuestId)
      : (questId in questLabels ? questId : "health-concern");
    setQuestId(targetTopicKey);
    const targetQuest = questLabels[targetTopicKey];

    const requestKey = savedRequestKey.current || sessionStorage.getItem("healthclues-world-request-key") || crypto.randomUUID();
    savedRequestKey.current = requestKey;
    sessionStorage.setItem("healthclues-world-request-key", requestKey);
    setBusy(true); setPageError(""); setNotice("");
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    const selections: Selection[] = [];
    try {
      const createdWorld = await authorizedFetch("/api/healthclues/world", { method: "POST", body: JSON.stringify({ requestKey, topicKey: targetTopicKey, title: targetQuest.name, timezone, startedOn: localDate(timezone), selections }) }) as { world_id: string };
      setShowFirstPlan(true);
      let sessionConfirmedPlan: { goals: WellnessPlanGoal[]; requestKey?: string } | null = null;
      try {
        const raw = sessionStorage.getItem("healthclues-confirmed-plan");
        if (raw) sessionConfirmedPlan = JSON.parse(raw);
      } catch {}
      const goalsToAttach = (activationContext?.wellnessPlan && activationContext.wellnessPlan.length > 0)
        ? activationContext.wellnessPlan
        : sessionConfirmedPlan?.goals;
      if (goalsToAttach && goalsToAttach.length > 0) {
        const planKey = activationContext?.wellnessPlanRequestKey || sessionConfirmedPlan?.requestKey || crypto.randomUUID();
        await authorizedFetch("/api/healthclues/plan", { method: "POST", body: JSON.stringify({ worldId: createdWorld.world_id, requestKey: planKey, confirmed: true, goals: goalsToAttach }) }).catch(() => null);
        try { sessionStorage.removeItem("healthclues-confirmed-plan"); } catch {}
      }
      sessionStorage.removeItem("healthclues-world-request-key");
      sessionStorage.removeItem("healthclues-starting-tools");
      savedRequestKey.current = null;
      void clearPendingHealthCluesJourney(session?.access_token);
      setActivationContext(null);
      setNotice("Your Wellness World is ready. Your Backpack starts open; you can choose tools after meeting your guides.");
      await loadWorld();
      if (onboardingBackpack) router.replace(`${localeHealthCluesPath("/en/wellness/healthclues/world", locale)}?quest=${encodeURIComponent(targetTopicKey)}`);
    } catch (error) { setPageError(error instanceof Error ? error.message : "Your World could not be saved."); }
    finally { setBusy(false); }
  };

  useEffect(() => {
    if (!session || loading || !pendingChecked || worldData.world || busy || activationAutoCreateStarted.current) return;
    activationAutoCreateStarted.current = true;
    void enterWorld();
  }, [session, loading, pendingChecked, worldData.world, busy, enterWorld]);

  useEffect(() => {
    if (!worldData.world || !session) return;
    if (worldData.wellnessPlan && worldData.wellnessPlan.goals?.length) return;
    let sessionConfirmedPlan: { goals: WellnessPlanGoal[]; requestKey?: string } | null = null;
    try {
      const raw = sessionStorage.getItem("healthclues-confirmed-plan");
      if (raw) sessionConfirmedPlan = JSON.parse(raw);
    } catch {}
    const goalsToAttach = (activationContext?.wellnessPlan && activationContext.wellnessPlan.length > 0)
      ? activationContext.wellnessPlan
      : sessionConfirmedPlan?.goals;
    if (!goalsToAttach || !goalsToAttach.length) return;
    const planKey = activationContext?.wellnessPlanRequestKey || sessionConfirmedPlan?.requestKey || crypto.randomUUID();
    void authorizedFetch("/api/healthclues/plan", {
      method: "POST",
      body: JSON.stringify({
        worldId: worldData.world.id,
        requestKey: planKey,
        confirmed: true,
        goals: goalsToAttach
      })
    }).then(() => {
      try { sessionStorage.removeItem("healthclues-confirmed-plan"); } catch {}
      void loadWorld();
    }).catch(() => null);
  }, [activationContext, worldData.world, worldData.wellnessPlan, session, authorizedFetch, loadWorld]);

  const submitCheckin = async (explicitNote?: string) => {
    if (!session) { setCheckinOpen(false); setPageError("Sign in to save a private check-in. Guest preview activity is never recorded as real progress."); return; }
    if (!worldData.world || !session) return;
    const items = worldData.entries.filter(entry => entry.status === "equipped" && usageStatuses[entry.id]).map(entry => ({ toolkitEntryId: entry.id, status: usageStatuses[entry.id], occurrenceCount: occurrenceCounts[entry.id] ?? null }));
    setBusy(true); setPageError("");
    const noteToSend = explicitNote !== undefined ? explicitNote : privateNote;
    try {
      const result = await authorizedFetch("/api/healthclues/world/checkin", { method: "POST", body: JSON.stringify({ worldId: worldData.world.id, localDate: today, timezone: worldData.world.timezone, usages: items, note: noteToSend }) }) as { xp_awarded: boolean; xp_total: number };
      setNotice(result.xp_awarded ? `Check-in saved · +10 XP · ${result.xp_total} XP total. Your note is private.` : `Check-in updated · ${result.xp_total} XP total. Your note is private.`);
      setCheckinOpen(false); setPrivateNote(""); setUsageStatuses({}); setOccurrenceCounts({});
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("healthclues:exp-fireworks", { detail: { xpGained: 10, totalXp: result.xp_total } }));
      }
      await loadWorld();
    } catch (error) { setPageError(error instanceof Error ? error.message : "Check-in could not be saved."); }
    finally { setBusy(false); }
  };

  const manageToolkitEntry = async (entry: Entry, action: "pause" | "resume" | "archive" | "schedule") => {
    if (!session || !entry) return;
    setBusy(true); setPageError("");
    try {
      await authorizedFetch("/api/healthclues/world/toolkit", { method: "PATCH", body: JSON.stringify({ entryId: entry.id, action, ...(action === "schedule" ? { schedule: { frequency: "daily", time: scheduleTime, timezone: worldData.world?.timezone || "UTC" } } : {}) }) });
      setNotice(action === "pause" ? "Tool paused. Its history remains in your World." : action === "resume" ? "Tool added back to your active trail." : action === "schedule" ? "Your local reminder preference for this tool was saved." : "Tool archived. Your past check-ins remain in your history.");
      setReplaceFor(null); setReplacementItemId(""); await loadWorld();
      setScheduleFor(null);
    } catch (error) { setPageError(error instanceof Error ? error.message : "The Toolkit could not be changed."); }
    finally { setBusy(false); }
  };

  const replaceToolkitPosition = async (entry: Entry) => {
    const replacement = catalog.find(item => item.id === replacementItemId && item.recommendationEligible);
    if (!session || !worldData.world || !replacement) { setPageError("Choose an eligible tool before confirming replacement."); return; }
    const legacyPosition: Record<ToolkitSlot, number> = { consume: 1, reduce: 2, practice: 3 };
    setBusy(true); setPageError("");
    try {
      await authorizedFetch("/api/healthclues/world/toolkit", { method: "POST", body: JSON.stringify({ worldId: worldData.world.id, catalogItemId: replacement.id, itemVersion: replacement.version, equipmentPosition: entry.equipment_position ?? legacyPosition[entry.slot_key], replaceEntryId: entry.id, requestKey: crypto.randomUUID() }) });
      setNotice(`${replacement.demoOnly ? "TEST ONLY tool" : "Tool"} replaced in Backpack position ${entry.equipment_position ?? legacyPosition[entry.slot_key]}. Earlier history remains attached to the previous entry.`);
      setReplaceFor(null); setReplacementItemId(""); await loadWorld();
    } catch (error) { setPageError(error instanceof Error ? error.message : "The Backpack position could not be replaced."); }
    finally { setBusy(false); }
  };

  const openCheckin = async () => {
    if (!session) { setPageError("Sign in to save a private check-in. Your guest World remains a preview."); return; }
    const todayCheckin = worldData.checkins.find(c => c.local_date === today);
    setPrivateNote(todayCheckin?.note_private || "");
    setUsageStatuses({});
    setOccurrenceCounts({});
    setCheckinLoaded(false);
    setCheckinOpen(true);
    if (!session || !worldData.world) { setCheckinLoaded(true); return; }
    try {
      const details = await authorizedFetch(`/api/healthclues/world/checkin/detail?worldId=${encodeURIComponent(worldData.world.id)}&date=${encodeURIComponent(today)}`) as { checkin: { note_private?: string | null; reflection_private?: string | null } | null; usage: Array<{ toolkit_entry_id: string; status: UsageStatus; occurrence_count: number | null }> };
      setPrivateNote(details.checkin?.note_private ?? todayCheckin?.note_private ?? "");
      setUsageStatuses(Object.fromEntries(details.usage.map(row => [row.toolkit_entry_id, row.status])));
      setOccurrenceCounts(Object.fromEntries(details.usage.filter(row => row.occurrence_count !== null).map(row => [row.toolkit_entry_id, row.occurrence_count as number])));
      setCheckinLoaded(true);
    } catch (error) { setPageError(error instanceof Error ? error.message : "Private check-in could not be loaded."); setCheckinOpen(false); }
  };

  const requestLoginLink = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!consented) return; setBusy(true); setPageError("");
    try { sessionStorage.removeItem("healthclues-starting-tools"); await sendMagicLink(loginEmail, "en", "healthclues-world"); setLoginSent(true); }
    catch (error) { setPageError(error instanceof Error ? error.message : "The sign-in link could not be sent."); }
    finally { setBusy(false); }
  };

  const ownerDataReady = session ? loadedWorldOwner === session.user.id : loadedWorldOwner === null;
  const existingWorld = Boolean(worldData.world);
  const showWorld = existingWorld || guestWorld;
  const activeEntries = worldData.entries.filter(entry => entry.status === "equipped");
  const visibleEntries = worldData.entries.filter(entry => entry.status === "equipped" || entry.status === "paused");
  const latestCheckin = worldData.checkins.find(row => row.local_date === today);

  const checkinAutoOpenedRef = useRef(false);
  useEffect(() => {
    if (checkinAutoOpenedRef.current) return;
    const isCheckinRequested = autoOpenCheckin || (typeof window !== "undefined" && (
      new URLSearchParams(window.location.search).get("checkin") === "1" ||
      new URLSearchParams(window.location.search).get("panel") === "checkin" ||
      new URLSearchParams(window.location.search).get("action") === "checkin"
    ));
    if (isCheckinRequested && !loading && ownerDataReady && worldData.world && session) {
      checkinAutoOpenedRef.current = true;
      void openCheckin();
    }
  }, [autoOpenCheckin, loading, ownerDataReady, worldData.world, session]);

  const updateNickname = async (nickname: string) => {
    if (!session || !worldData.world) throw new Error("Sign in to save your player name.");
    const response = await fetch("/api/healthclues/profile", { method: "PATCH", headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" }, body: JSON.stringify({ worldId: worldData.world.id, nickname }), cache: "no-store" });
    const result = await response.json().catch(() => ({})) as { error?: string; nickname?: string | null };
    if (!response.ok) throw new Error(result.error || "Nickname could not be saved.");
    setJourneyProfile(value => ({ ...(value || {}), nickname: result.nickname }));
  };

  if (session && worldData.world && !loading && ownerDataReady) {
    const storedRegion = [...worldData.branches].reverse().find(branch => branch.status === "active")?.topic_key;
    // Sleep Valley is temporarily locked per user request; default always to health-concern
    const activeRegion = "health-concern" as PetRegion;
    const profileTopic = typeof journeyProfile?.topic === "string" ? journeyProfile.topic : "";
    const quizProfile = storedQuizProfile(journeyProfile) || getHealthCluesSessionProfile();
    const journeyTopicDisplay = quizProfile?.adaptiveDiscovery ? localizedDiscoveryConcern(quizProfile, locale) : profileTopic;
    const journeyGoal = typeof journeyProfile?.twoWeekGoal === "string" ? journeyProfile.twoWeekGoal : "";
    const journeyPlaybook = resolveJourneyPlaybook({ topic: profileTopic, twoWeekGoal: typeof journeyProfile?.twoWeekGoal === "string" ? journeyProfile.twoWeekGoal : "", specificInterests: Array.isArray(journeyProfile?.specificInterests) ? journeyProfile.specificInterests.filter((item): item is string => typeof item === "string") : [], safetyContext: journeyProfile?.safetyContext && typeof journeyProfile.safetyContext === "object" ? journeyProfile.safetyContext as import("./personalized-recommendations").PersonalProfile["safetyContext"] : undefined });
    const profileInterests = Array.isArray(journeyProfile?.specificInterests) ? journeyProfile.specificInterests.filter((item): item is string => typeof item === "string") : [];
    const sleepGoal = (activeRegion as string) === "sleep-better" ? profileInterests.find(item => ["Falling asleep", "Staying asleep", "More regular bedtime", "Relaxation"].includes(item)) : undefined;
    return <WorldAdventureScene
      initialRegion={activeRegion}
      initialPlanPrompt={showFirstPlan}
      journeyTopic={(activeRegion as string) === "sleep-better" && sleepGoal ? `Sleep & rest · ${sleepGoal}` : journeyTopicDisplay || ((activeRegion as string) === "sleep-better" ? "Sleep & rest" : "General wellness discovery")}
      journeyGoal={journeyGoal}
      quizProfile={quizProfile}
      nickname={typeof journeyProfile?.nickname === "string" ? journeyProfile.nickname : ""} playbook={journeyPlaybook} onNicknameChange={updateNickname}
      worldId={worldData.world.id} xp={worldData.xpTotal}
      wellnessGoals={worldData.wellnessPlan?.goals ?? []}
      wellnessPlanVersion={worldData.wellnessPlan?.version ?? null}
      fragments={worldData.knowledgeCurrencies.fragments} keys={worldData.knowledgeCurrencies.keys}
      checkinCount={worldData.checkins.length} checkins={worldData.checkins} timezone={worldData.world?.timezone || "UTC"} rewards={worldData.rewards} unlocks={worldData.unlocks.map(item => item.unlock_key)}
      accessToken={session.access_token} tools={catalog}
      savedIds={worldData.collection.map(item => item.catalog_item_id).filter((id): id is string => Boolean(id))}
      entries={worldData.entries} usageHistory={worldData.usage} journeys={worldData.journeys} branches={worldData.branches}
      onCheckin={() => void openCheckin()} onProgressUpdated={() => { void loadWorld(); }}
      checkinDialog={<DailyCheckinDialog
        open={checkinOpen} date={today} journeyPrompt={journeyPlaybook.dailyPrompt} goals={worldData.wellnessPlan?.goals.filter(g => g.choice === "active") ?? []} entries={activeEntries} tools={catalog} note={privateNote}
        statuses={usageStatuses} counts={occurrenceCounts} busy={busy} loaded={checkinLoaded}
        onClose={()=>setCheckinOpen(false)} onNote={setPrivateNote}
        onStatus={(entryId,value)=>setUsageStatuses(previous=>({...previous,[entryId]:value}))}
        onCount={(entryId,value)=>setOccurrenceCounts(previous=>{const next={...previous};if(value===null)delete next[entryId];else next[entryId]=Math.max(0,Math.min(100,value));return next;})}
        onRecommendationFeedback={(catalogItemId,feedback)=>{ const item=catalog.find(row=>row.id===catalogItemId); if(!item||!session||!worldData.world)return; void authorizedFetch("/api/healthclues/recommendations",{method:"POST",body:JSON.stringify({worldId:worldData.world.id,catalogItemId,itemVersion:item.version,eventType:"feedback",feedbackCode:feedback,eventKey:crypto.randomUUID()})}).then(()=>{ setNotice(feedback==="want_alternative"?"Your companion saved that you would like an alternative. Nothing was changed automatically.":"Your private feedback was saved. Your Backpack was not changed."); }).catch(err=>{ setPageError(err instanceof Error ? err.message : "Feedback could not be saved."); }); }}
        onSave={(compiledNote)=>void submitCheckin(compiledNote)}
      />}
    />;
  }

  const isSessionTerminated = sessionExpired || Boolean(pageError && (pageError.toLowerCase().includes("expired") || pageError.toLowerCase().includes("invalid") || pageError.toLowerCase().includes("jwt")));

  if (isSessionTerminated) {
    if (typeof window !== "undefined") {
      window.setTimeout(() => {
        window.location.replace("/play?signin=1&reason=expired");
      }, 350);
    }
    return (
      <HealthCluesGameShell current="loading">
        <main className="grid min-h-[calc(100dvh-4.25rem)] place-items-center p-6 text-center" role="status">
          <div className="max-w-md rounded-3xl border border-amber-300 bg-[#fbf4df] p-8 text-[#18302b] shadow-xl">
            <HealthCluesAdventurer pose="curious" width={90} className="mx-auto" />
            <h2 className="mt-4 text-xl font-black text-[#173f36]">
              {locale === "vi" ? "Phiên đăng nhập đã hết hạn" : "Session Expired"}
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-[#526b62]">
              {locale === "vi" ? "Đang chuyển bạn đến màn hình đăng nhập..." : "Redirecting you to the sign-in screen..."}
            </p>
            <a
              href="/play?signin=1&reason=expired"
              className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#173f36] px-5 text-xs font-bold text-white shadow-md hover:bg-[#255245]"
            >
              {locale === "vi" ? "Đăng nhập ngay" : "Sign in now"} <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </main>
      </HealthCluesGameShell>
    );
  }

  if (!ownerDataReady) return <HealthCluesGameShell current="loading"><main className="grid min-h-[calc(100dvh-4.25rem)] place-items-center p-6" role="status" aria-live="polite"><p className="rounded-2xl border border-white/20 bg-[#10271f]/80 p-6 text-sm font-semibold text-white">Opening your saved World…</p></main></HealthCluesGameShell>;

  return <HealthCluesGameShell current="world" xp={session ? worldData.xpTotal : undefined}>
    <main className="min-h-[calc(100dvh-4.25rem)] bg-[#f3f1e7]/90 pb-20 text-[#18302b] backdrop-blur-[2px] max-sm:pb-24">
    <div className="mx-auto max-w-7xl px-4 pb-24 pt-6 sm:px-7 sm:pt-10">
      <div className="mb-4 flex flex-wrap gap-2" aria-label="Knowledge resources"><span className="rounded-full border border-[#d8dccb] bg-white px-3 py-2 text-xs font-bold text-[#315342]">Knowledge Fragments · {worldData.knowledgeCurrencies.fragments}</span><span className="rounded-full border border-[#e6d49f] bg-[#fff8e5] px-3 py-2 text-xs font-bold text-[#735c27]">Knowledge Keys · {worldData.knowledgeCurrencies.keys}</span></div>
      {!onboardingBackpack && (<nav aria-label="Journey progress" className="mb-6 grid grid-cols-4 gap-2 text-[10px] font-extrabold uppercase tracking-wider text-[#738277] sm:text-xs"><span className="rounded-full bg-[#d9e5d3] px-3 py-2 text-[#214a3d]">1 · Quest</span><span className="rounded-full bg-[#d9e5d3] px-3 py-2 text-[#214a3d]">2 · Discover</span><span className={`rounded-full px-3 py-2 ${existingWorld ? "bg-[#d9e5d3] text-[#214a3d]" : "bg-white"}`}>3 · Equip</span><span className={`rounded-full px-3 py-2 ${existingWorld ? "bg-amber-100 text-[#71561f]" : "bg-white"}`}>4 · World</span></nav> )}
      {pageError && <p role="alert" className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-900">{pageError}</p>}
      {notice && <p role="status" className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-950">{notice}</p>}
      {loading && session && <div role="status" className="rounded-2xl bg-white p-6 text-sm">Opening your World…</div>}
      {!loading && showWorld ? <section>
        {!session && guestWorld && <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm"><p><strong>Guest preview:</strong> this map is temporary. No World, check-in, XP, or activity has been saved.</p><a href="#healthclues-world-signin" className="font-bold text-emerald-900 underline">Sign in to save it</a></div>}
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.2em] text-emerald-900">One World · many journeys</p><h1 className="mt-2 text-3xl font-black sm:text-4xl">{session ? "Welcome back, Wayfinder" : "Your World Awaits"}</h1><p className="mt-2 text-sm text-[#5c7064]">{worldData.world?.title || `Preview · ${quest.region}`} · {worldData.branches.length} region {worldData.branches.length === 1 ? "opened" : "trails opened"}</p></div><button type="button" disabled={!session} onClick={() => void openCheckin()} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#163d35] px-5 py-3 text-sm font-extrabold text-white shadow-md hover:bg-[#245748] disabled:cursor-not-allowed disabled:opacity-50"><Check className="h-4 w-4"/> {latestCheckin ? "Edit Today’s Check-in" : "Today’s Quest · Check in"}</button></div>
        <div id="hc-world" className="grid min-w-0 scroll-mt-24 gap-5 lg:grid-cols-[minmax(0,1.65fr)_minmax(280px,.75fr)]"><div className="min-w-0"><WellnessWorldMap questId={worldData.branches[0]?.topic_key || questId} checkinCount={worldData.checkins.length} unlocks={worldData.unlocks.map(item => item.unlock_key)} onRegionSelect={setMapQuest}/><div className="mt-3 flex gap-2 overflow-x-auto pb-1" aria-label="Map view choices"><button type="button" className="rounded-full bg-[#183d36] px-4 py-2 text-xs font-bold text-white"><Map className="mr-1 inline h-3.5 w-3.5"/>Map View</button><button type="button" className="rounded-full border border-[#d4d9c9] bg-white px-4 py-2 text-xs font-bold" onClick={() => document.getElementById("hc-journey-list")?.scrollIntoView({ behavior: "smooth" })}>List / Timeline</button></div></div>
          <aside className="space-y-4"><section className="rounded-3xl border border-[#ddd8c2] bg-[#fbfaf4] p-5 shadow-sm"><div className="flex items-center justify-between"><div><p className="text-xs font-black uppercase tracking-widest text-emerald-900">Today · {today}</p><h2 className="mt-1 text-xl font-black">Your active trail</h2></div><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#e7efe3] text-emerald-900"><Compass className="h-5 w-5"/></span></div>{visibleEntries.length ? <div className="mt-4 space-y-2">{visibleEntries.map(entry => <div key={entry.id} className="rounded-xl border border-[#e5e4d7] bg-white p-3"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-lg bg-[#edf2e7] text-emerald-900"><Sparkles className="h-4 w-4"/></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{catalog.find(item => item.id === entry.catalog_item_id)?.name || "Personal tool"}</p><p className="text-xs text-[#778579]">{slots.find(row => row.id === entry.slot_key)?.title}</p></div><span className="text-[10px] font-bold uppercase text-emerald-800">{entry.status}</span></div><div className="mt-2 flex flex-wrap gap-2"><button type="button" disabled={busy} onClick={() => void manageToolkitEntry(entry, entry.status === "paused" ? "resume" : "pause")} className="rounded-lg border border-[#d5ddcf] px-3 py-1.5 text-xs font-bold">{entry.status === "paused" ? "Resume" : "Pause"}</button><button type="button" disabled={busy} onClick={() => { setReplaceFor(replaceFor === entry.id ? null : entry.id); setReplacementItemId(""); }} className="rounded-lg border border-[#d5ddcf] px-3 py-1.5 text-xs font-bold">Replace</button><button type="button" disabled={busy || entry.status === "paused"} onClick={() => { setScheduleFor(scheduleFor === entry.id ? null : entry.id); setScheduleTime(typeof entry.schedule.time === "string" ? entry.schedule.time : "08:00"); }} className="rounded-lg border border-[#d5ddcf] px-3 py-1.5 text-xs font-bold">Schedule</button>{scheduleFor === entry.id && <div className="w-full rounded-lg bg-[#f7f7ef] p-3"><label className="block text-xs font-bold" htmlFor={`hc-schedule-${entry.id}`}>Preferred local time · {worldData.world?.timezone || "UTC"}</label><input id={`hc-schedule-${entry.id}`} type="time" value={scheduleTime} onChange={event => setScheduleTime(event.target.value)} className="mt-2 min-h-10 rounded-lg border border-[#d5ddcf] bg-white px-3 text-sm"/><button type="button" disabled={busy} onClick={() => void manageToolkitEntry(entry, "schedule")} className="ml-3 rounded-lg bg-[#183d36] px-3 py-2 text-xs font-bold text-white">Save schedule</button></div>}{replaceFor === entry.id && <div className="w-full rounded-lg bg-[#f7f7ef] p-3"><label className="block text-xs font-bold" htmlFor={`hc-replace-${entry.id}`}>Choose any eligible tool for this Backpack position</label><select id={`hc-replace-${entry.id}`} value={replacementItemId} onChange={event => setReplacementItemId(event.target.value)} className="mt-2 min-h-10 w-full rounded-lg border border-[#d5ddcf] bg-white px-3 text-sm"><option value="">Choose a tool</option>{catalog.filter(item => item.recommendationEligible && item.id !== entry.catalog_item_id).map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select><button type="button" disabled={busy || !replacementItemId} onClick={() => void replaceToolkitPosition(entry)} className="mt-2 rounded-lg bg-[#183d36] px-3 py-2 text-xs font-bold text-white disabled:opacity-50">Confirm replacement</button><button type="button" onClick={() => setReplaceFor(null)} className="ml-3 px-2 py-2 text-xs font-bold underline">Cancel</button></div>}</div></div>)}</div> : <p className="mt-4 rounded-xl bg-white p-4 text-sm leading-relaxed text-[#64776c]">Your starting slots are open. Explore the Toolkit to choose tools when you are ready.</p>}<button type="button" onClick={() => void openCheckin()} className="mt-4 w-full rounded-xl border border-[#bbcab9] px-4 py-3 text-sm font-bold text-[#244c3e]">{latestCheckin ? "Review today’s notes" : "Begin a 30-second check-in"}</button></section>
          <section className="rounded-3xl bg-gradient-to-br from-[#dcebd7] to-[#f3e9c9] p-5"><p className="text-xs font-black uppercase tracking-widest text-[#3d6652]">Next checkpoint</p><h2 className="mt-1 text-lg font-black">{worldData.milestones.some(item => item.milestone_day === 7) ? "Trailblazer · Day 7" : "First Trail Marker · Day 7"}</h2><p className="mt-2 text-sm text-[#526b62]">Milestones mark elapsed journey time. You never need a perfect streak; missed days stay part of your story.</p><div className="mt-4 h-2 overflow-hidden rounded-full bg-white/70"><div className="h-full rounded-full bg-[#729c68]" style={{ width: `${Math.min(100, Math.round(worldData.checkins.length / 7 * 100))}%` }}/></div><p className="mt-2 text-xs font-bold text-[#53705d]">{worldData.checkins.length} days with a check-in · no missed-day penalty</p></section></aside></div>
          {worldData.world && <div id="hc-toolkit" className="scroll-mt-24"><ToolkitCollection accessToken={session?.access_token} worldId={worldData.world.id} tools={catalog} savedIds={worldData.collection.map(item => item.catalog_item_id).filter((id): id is string => Boolean(id))} entries={worldData.entries} onEquipped={() => { void loadWorld(); }}/></div>} 
         {worldData.world && <ComboJourneyPanel accessToken={session?.access_token} tools={catalog} onSaved={() => { void loadWorld(); }}/>}
          {worldData.world && <div id="hc-knowledge" className="scroll-mt-24"><KnowledgeJourneyPanel accessToken={session?.access_token} onProgressUpdated={() => { void loadWorld(); }}/></div>} 
          {worldData.world && <div id="hc-community" className="scroll-mt-24"><CommunityJourneysPanel accessToken={session?.access_token} journeys={worldData.journeys} branches={worldData.branches} tools={catalog} entries={worldData.entries} onWorldUpdated={() => { void loadWorld(); }}/></div>} 
         {worldData.world && <ReminderPreferencesPanel accessToken={session?.access_token}/>}
         {worldData.world && <PrivateJournalPanel accessToken={session?.access_token}/>}
          {worldData.world && <div id="hc-boss" className="scroll-mt-24"><BossBattlePanel accessToken={session?.access_token} onProgressUpdated={() => { void loadWorld(); }}/></div>} 
         {!session && guestWorld && <section id="healthclues-world-signin" className="mt-6 rounded-3xl border border-[#d8d0b8] bg-[#fffaf0] p-5"><p className="text-xs font-black uppercase tracking-widest text-emerald-900">Keep this trail</p><h2 className="mt-1 text-xl font-black">Save your World to your Botly account</h2>{loginSent ? <p role="status" className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm font-semibold">Check your inbox for a secure sign-in link. Return to this device to continue.</p> : <form onSubmit={requestLoginLink} className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]"><label className="sr-only" htmlFor="hc-world-email-map">Email address</label><input id="hc-world-email-map" type="email" autoComplete="email" required value={loginEmail} onChange={event => setLoginEmail(event.target.value)} placeholder="Email for your Botly account" className="min-h-11 rounded-xl border border-[#cbd3c1] bg-white px-4 text-sm"/><button disabled={!consented || busy} className="min-h-11 rounded-xl bg-[#183d36] px-5 text-sm font-extrabold text-white disabled:opacity-50">Send secure link</button><label className="flex gap-2 text-xs leading-relaxed text-[#5c6f62] sm:col-span-2"><input type="checkbox" checked={consented} onChange={event => setConsented(event.target.checked)} className="mt-0.5 h-4 w-4 accent-emerald-900"/>I agree to save the World and tools I choose, plus private check-in history. Notes remain private unless I separately share selected fields.</label></form>}</section>}
        <section id="hc-journey-list" className="mt-8 grid gap-4 sm:grid-cols-2"><div className="rounded-2xl border border-[#dadfce] bg-white p-5"><p className="text-xs font-black uppercase tracking-widest text-emerald-900">Your quests</p><div className="mt-3 space-y-2">{worldData.journeys.map(journey => <div key={journey.id} className="flex items-center justify-between rounded-xl bg-[#f7f7ef] p-3"><div><p className="text-sm font-bold">{journey.title}</p><p className="text-xs text-[#758174]">Started {journey.started_on}</p></div><span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold uppercase text-emerald-900">{journey.status}</span></div>)}</div><button type="button" onClick={() => { setPageError("New regions can be added to this same World. Choose another quest, then add a branch from the Toolkit."); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-emerald-900 underline"><Plus className="h-4 w-4"/> Explore another branch</button></div><div className="rounded-2xl border border-[#dadfce] bg-white p-5"><p className="text-xs font-black uppercase tracking-widest text-emerald-900">My collection</p><p className="mt-3 text-sm leading-relaxed text-[#5c7064]">Saved tools stay in your collection after a pause or replacement; usage history remains attached to each separate Tool Entry.</p>{worldData.collection.length ? <div className="mt-3 flex flex-wrap gap-2">{worldData.collection.map(item => <span key={item.id} className="inline-flex items-center gap-1.5 rounded-full bg-[#edf2e7] px-3 py-2 text-xs font-bold text-[#315342]">{item.catalog_item_id ? catalog.find(tool => tool.id === item.catalog_item_id)?.name || "Reviewed tool" : "Personal tool"}</span>)}</div> : <p className="mt-3 text-sm text-[#738074]">Tools you equip will appear here.</p>}<div className="mt-4 flex flex-wrap gap-2">{worldData.rewards.map(reward => { const RewardIcon = reward.reward_type === "map_unlock" ? Map : reward.reward_type === "cosmetic" ? Sparkles : Award; const tone = reward.reward_type === "map_unlock" ? "bg-emerald-50 text-emerald-900" : reward.reward_type === "cosmetic" ? "bg-violet-50 text-violet-900" : "bg-[#fff4d9] text-[#735c27]"; return <span key={`${reward.reward_id}-${reward.awarded_at}`} title={`${reward.title} · ${reward.reward_type.replaceAll("_", " ")}`} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-bold ${tone}`}><RewardIcon className="h-3.5 w-3.5"/><span>{reward.title}</span><span className="sr-only">{reward.reward_type.replaceAll("_", " ")}</span></span>; })}</div></div></section>
      </section> : !loading && (!session || pageError.includes("expired") || pageError.includes("invalid") ? (
        <section className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center" role="status">
          <HealthCluesAdventurer pose="curious" width={110} alt="Lumi" />
          <h2 className="mt-6 text-2xl font-black text-emerald-950">
            {locale === "vi" ? "Phiên đăng nhập đã hết hạn" : "Session Expired"}
          </h2>
          <p className="mt-2 text-sm text-[#5a7167]">
            {locale === "vi" ? "Vui lòng đăng nhập lại để tiếp tục khám phá thế giới của bạn." : "Please sign in again to continue exploring your World."}
          </p>
          <a
            href="/play?signin=1&expired=1"
            className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#173f36] px-6 py-3 text-sm font-extrabold text-white shadow-lg hover:bg-[#255245]"
          >
            {locale === "vi" ? "Đăng nhập ngay" : "Sign In Now"} <ArrowRight className="h-4 w-4" />
          </a>
        </section>
      ) : (
        <section className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center" role="status">
          <HealthCluesAdventurer pose="welcoming" width={110} alt="Lumi" />
          <h2 className="mt-6 text-2xl font-black text-emerald-950">
            {locale === "vi" ? "✨ Đang mở Cõi Sống Khỏe của bạn..." : "✨ Opening your Wellness World..."}
          </h2>
          <p className="mt-2 text-sm text-[#5a7167]">
            {locale === "vi" ? "Đang khởi tạo lộ trình 30 ngày và chuẩn bị bạn đồng hành Lumi..." : "Initializing your 30-day trail and companion Lumi..."}
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={() => void enterWorld()}
            className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#173f36] px-6 py-3 text-sm font-extrabold text-white shadow-lg hover:bg-[#255245]"
          >
            {locale === "vi" ? "Vào ngay Cõi Sống Khỏe" : "Enter Wellness World"} <ArrowRight className="h-4 w-4"/>
          </button>
        </section>
      ))}
      {checkinOpen && existingWorld && <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#061c18]/65 p-0 backdrop-blur-sm sm:items-center sm:p-5" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setCheckinOpen(false); }}><section role="dialog" aria-modal="true" aria-labelledby="hc-checkin-title" className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-t-[2rem] bg-[#fbfaf4] p-5 shadow-2xl sm:rounded-[2rem] sm:p-7"><div className="flex items-start justify-between"><div><p className="text-xs font-black uppercase tracking-widest text-emerald-900">Daily trail mark · {today}</p><h2 id="hc-checkin-title" className="mt-1 text-2xl font-black">How did today go?</h2><p className="mt-1 text-sm text-[#647469]">Choose a status only where you want to check in. No entry does not mean you skipped a tool.</p></div><button type="button" onClick={() => setCheckinOpen(false)} className="rounded-xl px-3 py-1 text-2xl" aria-label="Close check-in">×</button></div>{!checkinLoaded ? <p role="status" className="mt-5 rounded-xl bg-[#edf2e7] p-4 text-sm">Loading your private check-in…</p> : activeEntries.length ? <div className="mt-5 space-y-3">{activeEntries.map(entry => { const item = catalog.find(row => row.id === entry.catalog_item_id); return <article key={entry.id} className="rounded-2xl border border-[#e0dfd1] bg-white p-4"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-lg bg-[#e9efe4] text-emerald-900"><Sparkles className="h-4 w-4"/></span><div><p className="font-bold">{item?.name || "Personal tool"}</p><p className="text-xs text-[#778477]">{slots.find(slot => slot.id === entry.slot_key)?.title}</p></div></div><div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">{([ ["done","Tried / Used"], ["not_yet","Not Yet"], ["skipped","Skipped"], ["unsure","Don't Remember"], ["not_suitable","Not Suitable"] ] as Array<[UsageStatus,string]>).map(([status,label]) => <button key={status} type="button" aria-pressed={usageStatuses[entry.id] === status} onClick={() => setUsageStatuses(value => ({ ...value, [entry.id]: status }))} className={`min-h-10 rounded-lg border px-2 text-xs font-bold ${usageStatuses[entry.id] === status ? "border-emerald-800 bg-emerald-900 text-white" : "border-[#dfe3d7] bg-[#fafbf7]"}`}>{label}</button>)}</div>{usageStatuses[entry.id] === "done" && entry.slot_key === "practice" && <div className="mt-3 flex items-center gap-3"><label htmlFor={`hc-occ-${entry.id}`} className="text-xs text-[#657469]">Optional number of times (does not affect XP)</label><input id={`hc-occ-${entry.id}`} type="number" min={0} max={100} inputMode="numeric" value={occurrenceCounts[entry.id] ?? ""} onChange={event => setOccurrenceCounts(value => { const next = { ...value }; if (event.target.value === "") delete next[entry.id]; else next[entry.id] = Math.max(0, Math.min(100, Number(event.target.value))); return next; })} className="min-h-9 w-20 rounded-lg border border-[#d2d9cc] px-2 text-sm"/></div>}</article>; })}</div> : <div className="mt-5 rounded-2xl bg-[#edf2e7] p-5 text-sm">Your toolkit is open. You can still make a private reflection today.</div>}<label htmlFor="hc-checkin-note" className="mt-4 block text-sm font-bold">Optional private note</label><textarea id="hc-checkin-note" rows={3} maxLength={4000} value={privateNote} onChange={event => setPrivateNote(event.target.value)} placeholder="A small note for yourself…" className="mt-2 w-full rounded-xl border border-[#d4dacd] bg-white p-3 text-sm"/><p className="mt-1 text-xs text-[#788478]">Private by default. Never appears in community sharing or reminder emails.</p><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setCheckinOpen(false)} className="rounded-xl border border-[#d3d8cb] px-4 py-3 text-sm font-bold">Cancel</button><button type="button" disabled={busy || !checkinLoaded} onClick={() => void submitCheckin()} className="rounded-xl bg-[#173f36] px-5 py-3 text-sm font-extrabold text-white disabled:opacity-50">{busy ? "Saving…" : "Save check-in"}</button></div></section></div>}
    </div>
    </main>
  </HealthCluesGameShell>;
}


