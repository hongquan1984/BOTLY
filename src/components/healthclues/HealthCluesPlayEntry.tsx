"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { HealthCluesGameShell, healthCluesGameShellStyles } from "@/components/healthclues/HealthCluesGameShell";
import { HealthCluesWelcome } from "@/components/healthclues/HealthCluesWelcome";
import { localeHealthCluesPath, useHealthCluesLocale } from "@/components/healthclues/HealthCluesLocaleProvider";
import { clearCloudSession, getCloudSession, subscribeCloudSession, type CloudSession } from "@/lib/wellness-cloud";
import { clearPendingHealthCluesJourney, getPendingHealthCluesJourney, removeLegacyPendingHealthCluesJourney } from "@/lib/healthclues-pending-journey";

type EntryState = "resolving" | "welcome" | "redirecting" | "error";
type QuizDraft = { view?: string; answers?: unknown; ownerId?: string | null };

function hasResumableQuizDraft(session: CloudSession | null) {
  try {
    const raw = sessionStorage.getItem("healthclues-quiz-draft-v1");
    if (!raw) return false;
    const draft = JSON.parse(raw) as QuizDraft;
    // Exclude "world_preview" so players who reached the preview can see the Play landing screen
    const resumableView = ["quest", "discovery", "onboarding", "deep_offer", "deep"].includes(String(draft.view));
    const hasAnswerState = typeof draft.answers === "object" && draft.answers !== null && !Array.isArray(draft.answers);
    return resumableView && hasAnswerState && (draft.ownerId ?? null) === (session?.user.id ?? null);
  } catch {
    return false;
  }
}

export function HealthCluesPlayEntry() {
  const router = useRouter();
  const { locale, text } = useHealthCluesLocale();
  const [state, setState] = useState<EntryState>("resolving");
  const [error, setError] = useState("");
  const resolutionId = useRef(0);

  const resolveEntry = useCallback(async () => {
    const requestId = ++resolutionId.current;
    setState("resolving");
    setError("");

    let session: CloudSession | null = null;
    try { session = getCloudSession(); } catch { session = null; }

    const goToResume = (targetSession: CloudSession | null) => {
      if (hasResumableQuizDraft(targetSession)) {
        setState("redirecting");
        router.replace(`${localeHealthCluesPath("/en/wellness/healthclues/quiz", locale)}?from=play`);
        return true;
      }
      return false;
    };

    if (!session) {
      if (!goToResume(null) && requestId === resolutionId.current) setState("welcome");
      return;
    }

    try {
      const response = await fetch("/api/healthclues/world", {
        headers: { Authorization: `Bearer ${session.access_token}` },
        cache: "no-store",
      });

      if (requestId !== resolutionId.current) return;
      let latestSession: CloudSession | null = null;
      try { latestSession = getCloudSession(); } catch { /* Treat unavailable browser storage as signed out. */ }
      if (latestSession?.user.id !== session.user.id) return;

      if (response.status === 401 || response.status === 403) {
        try { clearCloudSession(); } catch { /* The next visit still validates the token server-side. */ }
        if (!goToResume(null)) {
          setState("welcome");
          router.replace("/play?signin=1&expired=1");
        }
        return;
      }
      if (!response.ok) throw new Error("Your World could not be checked. Try again in a moment.");

      const payload = await response.json() as { world?: { id?: string } | null; branches?: Array<{ topic_key?: string }> };
      if (requestId !== resolutionId.current) return;
      if (payload.world?.id) {
        void clearPendingHealthCluesJourney(session.access_token);
        setState("redirecting");
        const existingQuest = payload.branches?.[0]?.topic_key;
        const targetQuest = (existingQuest === "sleep-better" ? "health-concern" : existingQuest) || "health-concern";
        const searchParams = new URLSearchParams(window.location.search);
        const queryParams = new URLSearchParams();
        queryParams.set("quest", targetQuest);
        if (searchParams.get("checkin") === "1" || searchParams.get("panel") === "checkin" || searchParams.get("action") === "checkin") {
          queryParams.set("checkin", "1");
        }
        router.replace(`${localeHealthCluesPath("/en/wellness/healthclues/world", locale)}?${queryParams.toString()}`);
        return;
      }
      const searchParams = new URLSearchParams(window.location.search);
      const isActivationReturn = searchParams.get("activation") === "complete";
      const urlQuest = searchParams.get("quest");
      let pendingJourney = isActivationReturn ? await getPendingHealthCluesJourney(session.access_token).catch(() => null) : null;
      if (!pendingJourney && typeof window !== "undefined") {
        try {
          const rawLocal = localStorage.getItem("healthclues-pending-journey-local") || sessionStorage.getItem("healthclues-pending-journey-local");
          if (rawLocal) {
            const candidate = JSON.parse(rawLocal);
            if (!candidate?.email || candidate.email === session.user.email?.trim().toLowerCase()) {
              pendingJourney = { ...candidate, email: session.user.email?.trim().toLowerCase() };
              try {
                localStorage.setItem("healthclues-pending-journey-local", JSON.stringify(pendingJourney));
                sessionStorage.setItem("healthclues-pending-journey-local", JSON.stringify(pendingJourney));
              } catch {}
            }
          }
        } catch {}
      }

      if (pendingJourney && (session.user.email_confirmed_at || session.user.confirmed_at)) {
        setState("redirecting");
        const rawTargetQuest = pendingJourney.questId || urlQuest || "health-concern";
        const targetQuest = rawTargetQuest === "sleep-better" ? "health-concern" : rawTargetQuest;
        const checkinQuery = searchParams.get("checkin") === "1" || searchParams.get("panel") === "checkin" ? "&checkin=1" : "";
        router.replace(`${localeHealthCluesPath("/en/wellness/healthclues/world", locale)}?onboarding=backpack&quest=${encodeURIComponent(targetQuest)}${checkinQuery}`);
        return;
      }

      // Signed in user without world: create/enter world directly, NEVER trap back in quiz
      setState("redirecting");
      const rawDefaultQuest = urlQuest || "health-concern";
      const defaultQuest = rawDefaultQuest === "sleep-better" ? "health-concern" : rawDefaultQuest;
      const checkinQuery = searchParams.get("checkin") === "1" || searchParams.get("panel") === "checkin" ? "&checkin=1" : "";
      router.replace(`${localeHealthCluesPath("/en/wellness/healthclues/world", locale)}?onboarding=backpack&quest=${encodeURIComponent(defaultQuest)}${checkinQuery}`);
      return;
    } catch (cause) {
      if (requestId !== resolutionId.current) return;
      setError(cause instanceof Error ? cause.message : "Your game state could not be checked.");
      setState("error");
    }
  }, [locale, router]);

  useEffect(() => {
    removeLegacyPendingHealthCluesJourney();
    const unsubscribe = subscribeCloudSession(() => { void resolveEntry(); });
    const timer = window.setTimeout(() => { void resolveEntry(); }, 0);
    return () => {
      window.clearTimeout(timer);
      resolutionId.current += 1;
      unsubscribe();
    };
  }, [resolveEntry]);

  const styles = healthCluesGameShellStyles;
  if (state === "welcome") {
    return <HealthCluesGameShell welcome><HealthCluesWelcome onStart={() => router.push(`${localeHealthCluesPath("/en/wellness/healthclues/quiz", locale)}?from=play&step=quest`)} /></HealthCluesGameShell>;
  }

  if (state === "error") {
    return (
      <HealthCluesGameShell current="loading">
        <main className={styles.loading}>
          <section className={styles.loadingCard} role="alert">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-200">{text("World status")}</p>
            <h1 className="mt-2 text-xl font-black text-white">{text("We could not open your adventure yet")}</h1>
            <p className="mt-2 text-sm leading-relaxed text-white/75">{error}</p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              <button type="button" className={styles.errorButton} onClick={() => void resolveEntry()}>{text("Try again")}</button>
              <button
                type="button"
                className="rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-white/20"
                onClick={() => {
                  try { clearCloudSession(); } catch {}
                  setState("welcome");
                  router.replace("/play");
                }}
              >
                {locale === "vi" ? "Đăng nhập lại / Màn hình chính" : "Sign in again / Start screen"}
              </button>
            </div>
          </section>
        </main>
      </HealthCluesGameShell>
    );
  }

  return (
    <HealthCluesGameShell current="loading">
      <main className={styles.loading} role="status" aria-live="polite">
        <section className={styles.loadingCard}>
          <div className={styles.loadingMark} aria-hidden="true" />
          <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-200">{text(state === "redirecting" ? "Continuing your journey" : "Opening your World")}</p>
          <p className="mt-2 text-sm text-white/75">{text("Checking your saved adventure…")}</p>
        </section>
      </main>
    </HealthCluesGameShell>
  );
}
