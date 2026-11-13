"use client";

import { useEffect, useState } from "react";
import { hydrateUser, saveCloudSession } from "@/lib/wellness-cloud";
import { HealthCluesGameShell } from "@/components/healthclues/HealthCluesGameShell";
import { getPendingHealthCluesJourney } from "@/lib/healthclues-pending-journey";
import { useHealthCluesLocale } from "@/components/healthclues/HealthCluesLocaleProvider";

export function WorldAuthCallback({ journeyActivation = false }: { journeyActivation?: boolean }) {
  const { locale } = useHealthCluesLocale();
  const vi = locale === "vi";
  const [message, setMessage] = useState(vi ? "Đang xác nhận liên kết đăng nhập..." : "Confirming your secure sign-in link…");

  useEffect(() => {
    let active = true;
    const finish = async () => {
      try {
        const hashParams = new URLSearchParams(window.location.hash.slice(1));
        const searchParams = new URLSearchParams(window.location.search);
        let access_token = hashParams.get("access_token") || searchParams.get("access_token");
        let refresh_token = hashParams.get("refresh_token") || searchParams.get("refresh_token");
        let expires_in = Number(hashParams.get("expires_in") || searchParams.get("expires_in") || 3600);

        if (!access_token && searchParams.get("code")) {
          const authCode = searchParams.get("code");
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
          const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
          try {
            const tokenRes = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=pkce`, {
              method: "POST",
              headers: { apikey: anonKey, "Content-Type": "application/json" },
              body: JSON.stringify({ auth_code: authCode }),
            });
            if (tokenRes.ok) {
              const tokenData = await tokenRes.json();
              access_token = tokenData.access_token;
              refresh_token = tokenData.refresh_token;
              expires_in = Number(tokenData.expires_in || 3600);
            }
          } catch {}
        }

        if (!access_token || !refresh_token) throw new Error("expired");
        const user = await hydrateUser(access_token);
        if (!user.email_confirmed_at && !user.confirmed_at) throw new Error("unverified");

        // Always persist authenticated session immediately
        saveCloudSession({ access_token, refresh_token, expires_at: Date.now() + expires_in * 1000, user });

        // Clean up any quiz draft so user is never routed back to quiz
        try {
          sessionStorage.removeItem("healthclues-quiz-draft-v1");
          sessionStorage.removeItem("healthclues-two-question-discovery-v1");
          sessionStorage.removeItem("healthclues-goal-first-discovery-v1");
        } catch {}

        let verifiedQuestId: string | null = null;
        try {
          const pending = await getPendingHealthCluesJourney(access_token);
          if (pending && pending.email === user.email?.trim().toLowerCase()) {
            verifiedQuestId = pending.questId;
          }
        } catch {}

        if (!verifiedQuestId && typeof window !== "undefined") {
          try {
            const rawLocal = localStorage.getItem("healthclues-pending-journey-local") || sessionStorage.getItem("healthclues-pending-journey-local");
            if (rawLocal) {
              const localPending = JSON.parse(rawLocal) as { email?: string; questId?: string };
              if (!localPending.email || localPending.email === user.email?.trim().toLowerCase()) {
                localPending.email = user.email?.trim().toLowerCase();
                try {
                  localStorage.setItem("healthclues-pending-journey-local", JSON.stringify(localPending));
                  sessionStorage.setItem("healthclues-pending-journey-local", JSON.stringify(localPending));
                } catch {}
                if (localPending.questId) {
                  verifiedQuestId = localPending.questId;
                }
              }
            }
          } catch {}
        }

        if (!active) return;
        setMessage(vi ? "Xác thực thành công! Đang đưa bạn vào thẳng thế giới phiêu lưu..." : "Your sign-in is verified. Opening your adventure…");
        const worldPath = vi ? "/vi/wellness/healthclues/world" : "/en/wellness/healthclues/world";
        const targetRedirect = verifiedQuestId
          ? `${worldPath}?quest=${encodeURIComponent(verifiedQuestId)}&onboarding=backpack#hc-journey`
          : `${worldPath}?onboarding=backpack#hc-journey`;
        window.setTimeout(() => window.location.replace(targetRedirect), 350);
      } catch (cause) {
        if (!active) return;
        setMessage(
          cause instanceof Error && cause.message === "unverified"
            ? (vi ? "Email này chưa được xác thực. Hãy thử yêu cầu một liên kết mới." : "This email is not verified yet. Return to the preview and request a new secure link.")
            : (vi ? "Liên kết đăng nhập không hợp lệ hoặc đã hết hạn. Hãy yêu cầu liên kết mới." : "This sign-in link is invalid or expired. Return to the World preview and request a new one.")
        );
      }
    };
    void finish();
    return () => { active = false; };
  }, [journeyActivation, vi]);

  return (
    <HealthCluesGameShell current="loading">
      <main className="grid min-h-[calc(100dvh-4.25rem)] place-items-center px-5 py-10">
        <div className="max-w-md rounded-3xl border border-[#e6cd88] bg-[#fbf4df] p-8 text-center text-[#18302b] shadow-2xl">
          <p className="text-xs font-black uppercase tracking-[.2em] text-emerald-900">HealthClues · World Gate</p>
          <h1 className="mt-4 text-xl font-bold" role="status">{message}</h1>
          <a href="/play" className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-[#173f36] px-5 py-3 text-sm font-bold text-white">
            {vi ? "Vào trang game" : "Return to Game"}
          </a>
        </div>
      </main>
    </HealthCluesGameShell>
  );
}
