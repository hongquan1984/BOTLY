"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { AlertCircle, ArrowRight, CheckCircle2, LogIn, Mail, Sparkles, X } from "lucide-react";
import { HealthCluesAdventurer } from "./HealthCluesAdventurer";
import styles from "./HealthCluesWelcome.module.css";
import { useHealthCluesLocale } from "./HealthCluesLocaleProvider";
import { cloudEnabled, sendMagicLink, signInWithOAuth } from "@/lib/wellness-cloud";

export function HealthCluesWelcome({ onStart }: { onStart: () => void }) {
  const reducedMotion = useReducedMotion();
  const { locale, setLocale, text } = useHealthCluesLocale();
  const vi = locale === "vi";

  const [signInOpen, setSignInOpen] = useState(false);
  const [isExpiredSession, setIsExpiredSession] = useState(false);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const sp = new URLSearchParams(window.location.search);
      if (sp.get("signin") === "1" || sp.get("auth") === "signin") {
        setSignInOpen(true);
      }
      if (sp.get("expired") === "1") {
        setIsExpiredSession(true);
      }
    } catch {}
  }, []);

  const handleGoogleSignIn = () => {
    setErrorMessage("");
    try {
      signInWithOAuth("google", locale, "/play");
    } catch {
      setErrorMessage(
        vi
          ? "Đăng nhập Google đang bảo trì hoặc chưa kích hoạt. Vui lòng dùng Đăng nhập Email bên dưới."
          : "Google Sign-In is temporarily unavailable. Please use Email Sign-In below."
      );
    }
  };

  const handleEmailSignIn = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim() || busy) return;
    setBusy(true);
    setErrorMessage("");
    try {
      await sendMagicLink(email.trim().toLowerCase(), locale, "healthclues-world");
      setSent(true);
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : (vi ? "Chưa thể gửi email đăng nhập. Vui lòng kiểm tra lại địa chỉ email." : "Could not send sign-in link. Please check your email.")
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className={styles.scene}>
      <div className={styles.art} aria-hidden="true" />
      <div className={styles.vignette} aria-hidden="true" />
      <div className={styles.fireflies} aria-hidden="true">
        <i /><i /><i /><i /><i /><i /><i /><i />
      </div>

      {/* Top right quick Sign In button */}
      <button
        type="button"
        onClick={() => { setSignInOpen(true); setSent(false); setErrorMessage(""); }}
        className="absolute top-4 right-4 z-20 flex items-center gap-2 px-4 py-2 rounded-full border border-[#e6cd88]/40 bg-[#071713]/70 hover:bg-[#071713]/90 text-amber-200 text-xs font-bold tracking-wide shadow-md backdrop-blur-md transition hover:scale-105 active:scale-95"
      >
        <LogIn className="w-3.5 h-3.5 text-amber-300" />
        <span>{vi ? "Đăng nhập" : "Sign in"}</span>
      </button>

      <HealthCluesAdventurer pose="curious" width={142} className={styles.companion} />
      <motion.section
        className={styles.content}
        initial={reducedMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reducedMotion ? 0 : 0.65, ease: "easeOut" }}
        aria-labelledby="hc-welcome-title"
      >
        <p className={styles.eyebrow}><Sparkles className="h-4 w-4" aria-hidden="true" /> {text("A COZY ADVENTURE FOR YOUR WELLNESS")}</p>
        <h1 id="hc-welcome-title" className={styles.title}>HEALTHCLUES</h1>
        <p className={styles.subtitle}>{text("Your Wellness Adventure Begins Here")}</p>
        <p className={styles.description}>{text("Choose a path, discover at your own pace, and shape one World that is yours.")}</p>
        <fieldset className={styles.languageChoice} aria-label={text("Choose language")}>
          <legend>{text("Choose language")}</legend>
          <button type="button" lang="en" aria-pressed={locale === "en"} onClick={() => setLocale("en")}>English</button>
          <button type="button" lang="vi" aria-pressed={locale === "vi"} onClick={() => setLocale("vi")}>Tiếng Việt</button>
        </fieldset>

        <motion.button
          type="button"
          onClick={onStart}
          whileHover={reducedMotion ? undefined : { y: -2, scale: 1.015 }}
          whileTap={reducedMotion ? undefined : { scale: 0.985 }}
          className={styles.startButton}
        >
          {text("Start Journey")} <ArrowRight className="h-5 w-5" aria-hidden="true" />
        </motion.button>

        <button
          type="button"
          onClick={() => { setSignInOpen(true); setSent(false); setErrorMessage(""); }}
          className="mt-3.5 block mx-auto text-xs font-semibold text-amber-200/80 hover:text-amber-100 underline underline-offset-4 decoration-amber-400/40 hover:decoration-amber-300 transition"
        >
          {vi ? "Đã có tài khoản? Đăng nhập để tiếp tục →" : "Already have an account? Sign in to continue →"}
        </button>

        <p className={styles.disclaimer}>{text("A gentle wellness discovery experience · not diagnosis or treatment")}</p>
      </motion.section>
      <div className={styles.bottomNote} aria-hidden="true"><span /> {text("YOUR WORLD IS WAITING")} <span /></div>

      {/* Sign In Modal */}
      {signInOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-in fade-in duration-200" role="dialog" aria-modal="true">
          <div className="relative w-full max-w-md rounded-3xl border-2 border-[#dfc982] bg-gradient-to-b from-[#fdfbf6] to-[#f4ede0] p-6 text-[#19322c] shadow-[0_24px_70px_rgba(0,0,0,0.5)]">
            <button
              type="button"
              onClick={() => setSignInOpen(false)}
              className="absolute top-4 right-4 grid h-8 w-8 place-items-center rounded-full text-[#5a4820] hover:bg-black/5 transition"
              aria-label={vi ? "Đóng" : "Close"}
            >
              <X className="h-5 w-5" />
            </button>

            <div className="text-center pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f2e7cc] border border-[#dfc982] text-xs font-extrabold uppercase tracking-wider text-[#856526]">
                ✦ HealthClues Account
              </span>
              <h2 className="mt-3 text-2xl font-black text-[#1b3d33]">
                {vi ? "Đăng nhập HealthClues" : "Sign in to HealthClues"}
              </h2>
              <p className="mt-1.5 text-xs leading-relaxed text-[#526b62]">
                {vi ? "Vào thẳng thế giới và kế hoạch sức khỏe đã lưu của bạn." : "Enter directly into your saved world and wellness plan."}
              </p>
            </div>

            {isExpiredSession && (
              <div className="mt-4 flex items-center gap-2.5 rounded-2xl border border-amber-300 bg-amber-50/90 p-3.5 text-xs font-semibold text-amber-900 shadow-sm text-left">
                <AlertCircle className="h-5 w-5 shrink-0 text-amber-600" />
                <span>
                  {vi
                    ? "Phiên đăng nhập trước đã hết hạn. Vui lòng đăng nhập lại để tiếp tục hành trình."
                    : "Your previous session has expired. Please sign in again to continue your journey."}
                </span>
              </div>
            )}

            {sent ? (
              <div className="mt-6 rounded-2xl border border-emerald-300 bg-emerald-50/90 p-5 text-center">
                <CheckCircle2 className="mx-auto h-9 w-9 text-emerald-600" />
                <h3 className="mt-2 text-base font-bold text-emerald-950">
                  {vi ? "Đã gửi liên kết đăng nhập!" : "Sign-in link sent!"}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-emerald-800">
                  {vi
                    ? `Chúng tôi đã gửi một liên kết an toàn tới ${email}. Vui lòng mở email và nhấn vào liên kết để vào thẳng game!`
                    : `We've sent a secure sign-in link to ${email}. Check your inbox and click the link to enter the game!`}
                </p>
                <button
                  type="button"
                  onClick={() => setSignInOpen(false)}
                  className="mt-4 inline-flex min-h-10 items-center justify-center rounded-xl bg-[#1b4a3e] px-5 text-xs font-bold text-white shadow-sm"
                >
                  {vi ? "Đã hiểu" : "Got it"}
                </button>
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                {/* Option 1: 1-Click Google Auth */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={busy}
                  className="group flex w-full min-h-12 items-center justify-center gap-3 rounded-2xl border-2 border-[#d6c48a] bg-white px-4 py-3 text-sm font-bold text-[#1b3d33] shadow-sm hover:border-[#b8a674] hover:bg-[#fffdf7] active:scale-[0.99] transition"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>{vi ? "Tiếp tục với Google" : "Continue with Google"}</span>
                </button>

                {/* Divider */}
                <div className="flex items-center gap-3 text-[11px] font-bold text-[#8a7a60] uppercase tracking-wider">
                  <span className="flex-1 h-px bg-[#dfcf9d]" />
                  <span>{vi ? "hoặc dùng email" : "or with email"}</span>
                  <span className="flex-1 h-px bg-[#dfcf9d]" />
                </div>

                {/* Option 2: Email Magic Link */}
                <form onSubmit={handleEmailSignIn} className="space-y-3">
                  <div>
                    <label htmlFor="signin-email" className="block text-xs font-bold text-[#233d32] mb-1">
                      {vi ? "Địa chỉ Email" : "Email address"}
                    </label>
                    <input
                      id="signin-email"
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder={vi ? "Nhập email của bạn..." : "name@example.com"}
                      className="w-full min-h-11 rounded-xl border border-[#c9be9a] bg-white px-3.5 text-sm shadow-inner outline-none focus:ring-2 focus:ring-[#1b4a3e]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={busy || !email.trim()}
                    className="flex w-full min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1b4a3e] to-[#12382f] px-4 py-2.5 text-sm font-black text-[#fff6db] shadow-md hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 transition"
                  >
                    <Mail className="h-4 w-4" />
                    <span>{busy ? (vi ? "Đang gửi liên kết..." : "Sending link…") : (vi ? "Gửi liên kết đăng nhập" : "Send sign-in link")}</span>
                  </button>
                </form>

                {errorMessage && (
                  <div className="flex items-start gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-semibold text-rose-900" role="alert">
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <p className="text-center text-[11px] text-[#78887e]">
                  {vi ? "Không cần mật khẩu. Liên kết an toàn sẽ gửi trực tiếp đến hộp thư của bạn." : "No password needed. A secure sign-in link is sent to your inbox."}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
