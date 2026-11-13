"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Compass, LogIn, ShieldCheck, X } from "lucide-react";
import { HealthCluesAdventurer } from "@/components/healthclues/HealthCluesAdventurer";
import { WellnessWorldMap, WELLNESS_REGIONS } from "@/features/healthclues/world-map";
import styles from "./HealthCluesWorldPreview.module.css";
import { cloudEnabled, getCloudSession, saveCloudSession, sendMagicLink, signInWithOAuth, subscribeCloudSession, type CloudSession } from "@/lib/wellness-cloud";
import { clearPendingHealthCluesJourney, savePendingHealthCluesJourney } from "@/lib/healthclues-pending-journey";
import { loadHealthCluesProfile, saveHealthCluesProfile } from "@/lib/wellness-cloud";
import { mergeVerifiedDiscoveryProfile } from "@/features/healthclues/onboarding-context";
import type { HealthCluesProfile } from "@/lib/healthclues-quiz";
import type { WellnessPlanGoal } from "@/features/healthclues/wellness-plan";
import { useHealthCluesLocale, localeHealthCluesPath } from "@/components/healthclues/HealthCluesLocaleProvider";

const eligibleSession = (session: CloudSession | null) => Boolean(session?.user.email_confirmed_at || session?.user.confirmed_at);

export function HealthCluesWorldPreview({ questId, profile, wellnessPlan = null, onVerificationRequested, onBack }: { questId: string; profile: HealthCluesProfile; wellnessPlan?: WellnessPlanGoal[] | null; onVerificationRequested?: (email: string) => void; onBack?: () => void }) {
  const router = useRouter();
  const { locale } = useHealthCluesLocale();
  const t = (en: string, vi: string) => locale === "vi" ? vi : en;
  const [session, setSession] = useState<CloudSession | null>(null);
  const [activationOpen, setActivationOpen] = useState(false);
  const [activationEmail, setActivationEmail] = useState("");
  const [consent, setConsent] = useState(true);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [existingAccount, setExistingAccount] = useState(false);
  const [error, setError] = useState("");
  const [compactViewport, setCompactViewport] = useState(false);
  const [inspectedRegionId, setInspectedRegionId] = useState(questId);
  const [dialogueOpen, setDialogueOpen] = useState(true);
  const [wellnessPlanRequestKey] = useState(() => typeof crypto !== "undefined" ? crypto.randomUUID() : "");
  const activationTriggerRef = useRef<HTMLButtonElement>(null);
  const activationDialogRef = useRef<HTMLElement>(null);
  const quest = WELLNESS_REGIONS.find(region => region.id === questId) || WELLNESS_REGIONS[7];
  const inspected = WELLNESS_REGIONS.find(region => region.id === inspectedRegionId) || quest;
  const returnToPreview = useCallback(() => {
    void clearPendingHealthCluesJourney(session?.access_token);
    setSent(false);
    setActivationOpen(false);
  }, [session?.access_token]);

  const handleGoogleSignIn = () => {
    if (busy || !cloudEnabled) return;
    setBusy(true);
    setError("");
    const consentedAt = new Date().toISOString();
    const pendingPayload = {
      email: "",
      questId,
      profile,
      wellnessPlan,
      ...(wellnessPlan !== null ? { wellnessPlanRequestKey } : {}),
      consentedAt,
    };
    try {
      localStorage.setItem("healthclues-pending-journey-local", JSON.stringify(pendingPayload));
      sessionStorage.setItem("healthclues-pending-journey-local", JSON.stringify(pendingPayload));
      sessionStorage.removeItem("healthclues-quiz-draft-v1");
      sessionStorage.removeItem("healthclues-two-question-discovery-v1");
      sessionStorage.removeItem("healthclues-goal-first-discovery-v1");
    } catch {}
    try {
      signInWithOAuth("google", locale, "/play?activation=complete");
    } catch {
      setBusy(false);
      setError(
        locale === "vi"
          ? "Đăng nhập Google đang bảo trì hoặc chưa kích hoạt. Vui lòng dùng Đăng nhập bằng Email bên dưới."
          : "Google Sign-In is temporarily unavailable. Please use Email below."
      );
    }
  };

  useEffect(() => {
    const sync = () => setSession(getCloudSession());
    sync();
    return subscribeCloudSession(sync);
  }, []);

  useEffect(() => {
    const updateViewport = () => setCompactViewport(window.matchMedia("(max-width: 680px)").matches);
    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const previous = {
      htmlHeight: html.style.height,
      htmlOverflow: html.style.overflow,
      bodyHeight: body.style.height,
      bodyMinHeight: body.style.minHeight,
      bodyOverflow: body.style.overflow,
      bodyPosition: body.style.position,
      bodyInset: body.style.inset,
      bodyWidth: body.style.width,
    };
    html.style.height = "100dvh";
    html.style.overflow = "hidden";
    body.style.height = "100dvh";
    body.style.minHeight = "0";
    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.inset = "0";
    body.style.width = "100%";
    return () => {
      html.style.height = previous.htmlHeight;
      html.style.overflow = previous.htmlOverflow;
      body.style.height = previous.bodyHeight;
      body.style.minHeight = previous.bodyMinHeight;
      body.style.overflow = previous.bodyOverflow;
      body.style.position = previous.bodyPosition;
      body.style.inset = previous.bodyInset;
      body.style.width = previous.bodyWidth;
    };
  }, []);

  useEffect(() => {
    if (!activationOpen) return;
    const dialog = activationDialogRef.current;
    const getFocusable = () => dialog?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])') ?? [];
    getFocusable()[0]?.focus();
    const handleKeys = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); returnToPreview(); return; }
      if (event.key !== "Tab") return;
      const items = getFocusable();
      if (!items.length) { event.preventDefault(); return; }
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", handleKeys);
    return () => {
      document.removeEventListener("keydown", handleKeys);
      activationTriggerRef.current?.focus();
    };
  }, [activationOpen, returnToPreview]);

  const continueToWorld = () => {
    const worldPath = localeHealthCluesPath("/en/wellness/healthclues/world", locale);
    window.location.href = `${worldPath}?quest=${encodeURIComponent(questId)}&onboarding=backpack#hc-journey`;
  };

  const startJourney = () => {
    const email = session?.user.email;
    if (eligibleSession(session) && email) setActivationEmail(email);
    setActivationOpen(true);
  };

  const requestVerification = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!consent || !cloudEnabled || busy) return;
    setBusy(true); setError("");
    const consentedAt = new Date().toISOString();
    const pendingPayload = { email: activationEmail.trim().toLowerCase(), questId, profile, wellnessPlan, ...(wellnessPlan !== null ? { wellnessPlanRequestKey } : {}), consentedAt };
    try {
      localStorage.setItem("healthclues-pending-journey-local", JSON.stringify(pendingPayload));
      sessionStorage.setItem("healthclues-pending-journey-local", JSON.stringify(pendingPayload));
      sessionStorage.removeItem("healthclues-quiz-draft-v1");
      sessionStorage.removeItem("healthclues-two-question-discovery-v1");
      sessionStorage.removeItem("healthclues-goal-first-discovery-v1");
    } catch {}
    const saved = await savePendingHealthCluesJourney(pendingPayload);
    if (!saved.ok) {
      setBusy(false);
      setError(saved.status === 400
        ? t("Some journey details could not be validated. Your answers are still on this page; please go back and retry.", "Một số thông tin hành trình chưa hợp lệ. Câu trả lời vẫn còn trên trang này; hãy quay lại và thử lại.")
        : saved.status === 413
          ? t("This journey contains more information than can be saved securely. Your answers are still on this page; please remove optional notes and retry.", "Hành trình có nhiều thông tin hơn mức có thể lưu an toàn. Câu trả lời vẫn còn trên trang này; hãy bỏ ghi chú tùy chọn rồi thử lại.")
          : saved.status === 503
            ? t("Secure journey saving is temporarily unavailable. Keep this preview open and try again shortly.", "Tính năng lưu hành trình an toàn đang tạm thời không khả dụng. Hãy giữ trang xem trước và thử lại sau ít phút.")
            : t("The journey could not be saved because the connection failed. Keep this preview open and try again.", "Không thể lưu hành trình do kết nối bị gián đoạn. Hãy giữ trang xem trước và thử lại."));
      return;
    }
    if (eligibleSession(session) && session?.user.email?.trim().toLowerCase() === activationEmail.trim().toLowerCase()) {
      setBusy(false);
      continueToWorld();
      return;
    }
    try {
      await sendMagicLink(activationEmail, locale, "healthclues-journey-activation");
      onVerificationRequested?.(activationEmail.trim().toLowerCase());
      setSent(true);
    } catch {
      await clearPendingHealthCluesJourney();
      setError(t("The secure verification link could not be sent. Check your email address and try again.", "Chưa thể gửi liên kết xác minh an toàn. Hãy kiểm tra địa chỉ email và thử lại."));
    } finally { setBusy(false); }
  };

  return <main className={styles.scene} style={compactViewport ? { top: "3.7rem", bottom: "calc(4.3rem + env(safe-area-inset-bottom, 0px))" } : undefined} data-hc-world-preview aria-labelledby="hc-world-preview-title">
    <h1 id="hc-world-preview-title" className="sr-only">{t("Your Wellness World preview", "Xem trước Thế Giới Sức Khỏe")}</h1>
    <WellnessWorldMap questId={questId} checkinCount={0} unlocks={[]} previewMode immersive onRegionSelect={id => setInspectedRegionId(id)} />
    <div className={styles.status}>
      <span className={styles.starting}><Compass aria-hidden="true"/> {t("Starting trail", "Lộ trình bắt đầu tại")} · {quest.name}</span>
      <span className={styles.readonly}>{t("READ-ONLY PREVIEW", "BẢN XEM TRƯỚC · CHỈ ĐỌC")}</span>
      <button
        type="button"
        onClick={() => setActivationOpen(true)}
        className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-[#d6c58e] bg-[#fbf4df]/95 px-3 py-1 text-xs font-bold text-[#173f36] shadow-sm hover:bg-white transition"
      >
        <LogIn className="h-3.5 w-3.5 text-amber-700" />
        <span>{t("Sign in", "Đăng nhập")}</span>
      </button>
    </div>
    <aside className={styles.region} aria-live="polite"><p>{inspectedRegionId === questId ? t("STARTING REGION", "KHU VỰC KHỞI ĐẦU") : t("REGION PREVIEW", "XEM TRƯỚC KHU VỰC")}</p><h2>{inspected.name}</h2><span>{inspected.clue}</span>{inspectedRegionId !== questId && <small>{t("Your starting trail remains", "Lộ trình bắt đầu của bạn vẫn ở")} {quest.name}.</small>}</aside>
    {dialogueOpen ? <div className={styles.companion}>
      <HealthCluesAdventurer pose="curious" width={68} alt={`${quest.companion ?? "Your"} adventure companion`} />
      <div className={styles.speech}><button type="button" aria-label={t("Minimize companion dialogue", "Thu nhỏ lời thoại của bạn đồng hành")} onClick={() => setDialogueOpen(false)}><X aria-hidden="true"/></button><p>{inspectedRegionId === questId ? t(`Welcome to ${quest.name}!`, `Chào mừng bạn đến ${quest.name}!`) : t(`${inspected.name} looks lovely.`, `${inspected.name} thật đẹp.`)}</p><span>{inspectedRegionId === questId ? t(`I’m ${quest.companion ?? "your companion"}. Let’s discover your personal wellness journey together.`, `Mình là ${quest.companion ?? "người bạn đồng hành"}. Cùng khám phá hành trình sức khỏe của bạn nhé.`) : t(`I’m ${quest.companion ?? "your companion"}. Ready to begin your journey?`, `Mình là ${quest.companion ?? "người bạn đồng hành"}. Bạn sẵn sàng bắt đầu chưa?`)}</span></div>
    </div> : <button type="button" className={styles.companionReopen} onClick={() => setDialogueOpen(true)}><HealthCluesAdventurer pose="curious" width={46} alt={t("Show companion dialogue", "Mở lời thoại bạn đồng hành")}/><span>{t("Companion", "Bạn đồng hành")}</span></button>}
    <div className={styles.actions}>{onBack && <button type="button" onClick={onBack} className={styles.back}>{t("Back", "Quay lại")}</button>}<button ref={activationTriggerRef} data-start-journey-btn type="button" onClick={event => { activationTriggerRef.current = event.currentTarget; startJourney(); }} className={styles.start}>{t("START YOUR JOURNEY", "BẮT ĐẦU HÀNH TRÌNH")} <ArrowRight aria-hidden="true"/></button></div>

    {activationOpen && <div className="fixed inset-0 z-[60] grid place-items-center overflow-y-auto bg-[#071713]/75 p-3 backdrop-blur-sm sm:p-6" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) returnToPreview(); }}>
      <section ref={activationDialogRef} role="dialog" aria-modal="true" aria-labelledby="hc-activation-title" className="relative my-auto w-full max-w-lg rounded-[1.7rem] border border-[#e6cd88] bg-[#fbf4df] p-5 text-[#18302b] shadow-[0_28px_90px_#000b] sm:p-8">
        <button type="button" onClick={returnToPreview} aria-label={t("Return to World preview", "Quay lại xem trước Thế Giới")} className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full border border-[#d6c58e] text-[#54451f] hover:bg-white/70"><X className="h-5 w-5"/></button>
        <div className="flex items-center gap-3 pr-10">
          <HealthCluesAdventurer pose="welcoming" width={70} alt={t("Your companion is ready to help", "Bạn đồng hành đã sẵn sàng hỗ trợ")}/>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[.17em] text-emerald-900">{t("The World is waiting", "Thế Giới đang chờ bạn")}</p>
            <h2 id="hc-activation-title" className="text-2xl font-black">{t("Create Your Adventure", "Tạo hành trình của bạn")}</h2>
          </div>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-[#526b62]">
          {t(`Save your World, discovery profile${wellnessPlan?.length ? " and confirmed Wellness Plan" : ""} and progress. Choose Google for instant entry, or use your email to receive a secure sign-in link.`, `Lưu Thế Giới, hồ sơ khám phá${wellnessPlan?.length ? " và Kế hoạch Sức khỏe đã xác nhận" : ""} cùng tiến trình của bạn. Đăng nhập Google (1 chạm vào game) hoặc nhận liên kết an toàn qua email.`)}
        </p>

        {!cloudEnabled ? (
          <p role="alert" className="mt-5 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
            {t("Authentication is not configured in this guest preview. Your read-only World preview remains available.", "Tính năng đăng nhập chưa được cấu hình trong bản xem trước dành cho khách. Bạn vẫn có thể xem Thế Giới ở chế độ chỉ đọc.")}
          </p>
        ) : sent ? (
          <div className="mt-5 rounded-2xl border border-emerald-800/15 bg-[#eaf2e4] p-5 text-center" role="status">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <p className="font-bold text-base text-emerald-950">{t("Check your email for the secure verification link.", "Liên kết đăng nhập đã được gửi tới email của bạn!")}</p>
            <p className="mt-2 text-sm leading-relaxed text-[#526b62]">
              {t(`Open your email and click the link to instantly enter your adventure. No password needed.`, `Hãy mở email và nhấp vào liên kết để vào thẳng thế giới phiêu lưu. Không cần mật khẩu.`)}
            </p>
            <p className="mt-2 text-xs font-semibold text-emerald-800">{activationEmail}</p>
            <button
              type="button"
              disabled={busy}
              onClick={() => { setSent(false); setError(""); }}
              className="mt-4 min-h-10 w-full rounded-xl border border-emerald-900/25 px-4 text-sm font-bold text-emerald-950 hover:bg-emerald-50"
            >
              {t("Change email", "Đổi email khác")}
            </button>
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            {/* GOOGLE 1-CLICK BUTTON */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={busy}
              className="group flex w-full min-h-12 items-center justify-center gap-3 rounded-2xl border-2 border-[#173f36] bg-white px-5 py-3 text-sm font-bold text-[#173f36] shadow-sm hover:border-emerald-600 hover:bg-[#f6fcf8] active:scale-[0.99] transition cursor-pointer"
            >
              <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>{t("Continue with Google (Instant Entry)", "Tiếp tục với Google (1 chạm vào game)")}</span>
            </button>

            {/* DIVIDER */}
            <div className="relative my-3 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#d8c892]" /></div>
              <span className="relative bg-[#fbf4df] px-3 text-xs uppercase tracking-wider text-[#6b624b] font-bold">
                {t("Or with email", "Hoặc tiếp tục bằng email")}
              </span>
            </div>

            {/* EMAIL FORM */}
            <form onSubmit={requestVerification} className="space-y-3">
              {!eligibleSession(session) ? (
                <>
                  <label htmlFor="hc-activation-email" className="block text-xs font-bold uppercase tracking-wider text-[#526b62]">
                    {t("Email address", "Địa chỉ email của bạn")}
                  </label>
                  <input
                    id="hc-activation-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={activationEmail}
                    onChange={event => setActivationEmail(event.target.value)}
                    className="min-h-12 w-full rounded-xl border border-[#c6b77e] bg-[#fffaf0] px-4 text-base shadow-inner outline-none focus-visible:ring-4 focus-visible:ring-amber-300"
                    placeholder="you@example.com"
                  />
                </>
              ) : (
                <p className="rounded-xl bg-[#eaf2e4] p-3 text-sm">
                  {t("Verified as", "Đã xác minh")} <strong>{session?.user.email}</strong>.
                </p>
              )}

              <label className="flex items-start gap-2.5 rounded-xl border border-[#d7c791]/60 bg-white/40 p-2.5 text-xs leading-relaxed text-[#526b62]">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={event => setConsent(event.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-emerald-900"
                />
                <span>
                  {t(
                    `Save discovery profile, chosen quest and world progress to this account.`,
                    `Đồng ý lưu hồ sơ khám phá, nhiệm vụ đã chọn và tiến trình Thế Giới vào tài khoản này.`
                  )}
                </span>
              </label>

              {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-xs text-rose-900">{error}</p>}

              <button
                type="submit"
                disabled={!consent || busy || !activationEmail.trim()}
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#173f36] px-5 py-3 font-extrabold text-white shadow-md transition hover:bg-[#12332c] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy ? t("Sending secure link…", "Đang gửi liên kết an toàn…") : t("Send Sign-In Link to Email", "Gửi liên kết đăng nhập qua Email")}
                <ShieldCheck className="h-4 w-4" />
              </button>
            </form>
          </div>
        )}
        {sent && (
          <button
            type="button"
            onClick={async () => {
              if (!activationEmail || busy) return;
              setBusy(true);
              setError("");
              try {
                await sendMagicLink(activationEmail, locale, "healthclues-journey-activation");
              } catch {
                setError(t("The secure verification link could not be resent. Try again shortly.", "Chưa thể gửi lại liên kết xác minh an toàn. Hãy thử lại sau ít phút."));
              } finally {
                setBusy(false);
              }
            }}
            className="mt-4 min-h-11 w-full rounded-xl bg-[#173f36] px-4 py-3 text-sm font-bold text-white"
          >
            {busy ? t("Resending…", "Đang gửi lại…") : t("Resend verification email", "Gửi lại email xác minh")}
          </button>
        )}
        <button
          type="button"
          onClick={returnToPreview}
          className="mt-3 min-h-10 w-full rounded-xl px-4 py-2 text-sm font-bold text-[#526b62] underline"
        >
          {t("Close · Return to Preview", "Đóng · Quay lại bản xem trước")}
        </button>
      </section>
    </div>}
  </main>;
}
