"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getCloudSession, subscribeCloudSession } from "@/lib/wellness-cloud";
import { healthCluesText, type HealthCluesLocale } from "@/lib/healthclues-i18n";

type LocaleContextValue = { locale: HealthCluesLocale; setLocale: (locale: HealthCluesLocale) => void; text: (english: string) => string };
const LocaleContext = createContext<LocaleContextValue | null>(null);
const guestKey = "healthclues-player-locale-v1";
const lastOwnerKey = "healthclues-player-locale-owner-v1";
const ownerKey = (id: string) => `healthclues-player-locale-v1:${id}`;
const validLocale = (value: unknown): value is HealthCluesLocale => value === "en" || value === "vi";

function persistBrowserLocale(locale: HealthCluesLocale, accountId: string | null) {
  try {
    const effectiveOwner = accountId || getCloudSession()?.user.id || null;
    localStorage.setItem(guestKey, locale);
    if (effectiveOwner) {
      localStorage.setItem(ownerKey(effectiveOwner), locale);
      localStorage.setItem(lastOwnerKey, effectiveOwner);
    }
    document.cookie = `hc_locale=${locale}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
    document.documentElement.lang = locale;
  } catch { /* The active page still honors this tab's React state. */ }
}

export function HealthCluesLocaleProvider({ children, initialLocale = "en" }: { children: React.ReactNode; initialLocale?: HealthCluesLocale }) {
  const [locale, setLocaleState] = useState<HealthCluesLocale>(initialLocale);
  const [accountId, setAccountId] = useState<string | null>(null);
  const setLocale = useCallback((next: HealthCluesLocale) => {
    setLocaleState(next);
    persistBrowserLocale(next, accountId);
  }, [accountId]);

  useEffect(() => {
    const loadPreference = () => {
      let session = null;
      try { session = getCloudSession(); } catch { /* Anonymous browsing remains available. */ }
      try {
        const oldOwner = localStorage.getItem(lastOwnerKey);
        const owner = session?.user.id ?? null;
        setAccountId(owner);
        const stored = owner ? localStorage.getItem(ownerKey(owner)) : localStorage.getItem(guestKey);
        const selected = validLocale(stored) ? stored : owner && oldOwner && oldOwner !== owner ? "en" : localStorage.getItem(guestKey);
        const resolved = validLocale(selected) ? selected : initialLocale;
        setLocaleState(resolved);
        persistBrowserLocale(resolved, owner);
      } catch { setLocaleState(initialLocale); }
    };
    const unsubscribe = subscribeCloudSession(loadPreference);
    loadPreference();
    return unsubscribe;
  }, [initialLocale]);

  useEffect(() => { try { document.documentElement.lang = locale; } catch { /* Server rendering has no document. */ } }, [locale]);
  const value = useMemo(() => ({ locale, setLocale, text: (english: string) => healthCluesText(locale, english) }), [locale, setLocale]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useHealthCluesLocale() {
  const value = useContext(LocaleContext);
  if (!value) throw new Error("HealthCluesLocaleProvider is required around the player experience.");
  return value;
}

export function localeHealthCluesPath(pathname: string, locale: HealthCluesLocale) {
  if (!/^\/(en|vi)\/wellness\/healthclues(?:\/|$)/.test(pathname)) return pathname;
  return pathname.replace(/^\/(en|vi)(?=\/wellness\/healthclues(?:\/|$))/, `/${locale}`);
}

export function HealthCluesLocaleControl({ worldId, accessToken, compact = false }: { worldId?: string; accessToken?: string; compact?: boolean }) {
  const { locale, setLocale, text } = useHealthCluesLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [status, setStatus] = useState("");
  const choose = async (next: HealthCluesLocale) => {
    if (next === locale) return;
    setLocale(next);
    setStatus("");
    if (worldId && accessToken) {
      try {
        const response = await fetch("/api/healthclues/profile", { method: "PATCH", headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" }, body: JSON.stringify({ worldId, preferredLocale: next }), cache: "no-store" });
        if (!response.ok) throw new Error("preference_save_failed");
        setStatus(healthCluesText(next, "Your language preference is saved to this account."));
      } catch { setStatus(healthCluesText(next, "Language preference could not be saved. Try again.")); }
    } else setStatus(healthCluesText(next, "Language is saved on this device until you sign in."));
    const target = localeHealthCluesPath(pathname, next);
    if (target !== pathname) router.replace(`${target}${window.location.search}${window.location.hash}`);
  };
  return <div className={`inline-flex flex-wrap items-center gap-1 rounded-xl border border-amber-100/30 bg-[#081c18]/90 p-1 ${compact ? "text-[10px]" : "text-xs"}`} role="group" aria-label={text("Language")}>
    <button type="button" aria-pressed={locale === "en"} onClick={() => void choose("en")} className={`min-h-8 rounded-lg px-2 py-1 font-bold text-amber-50 ${locale === "en" ? "bg-amber-200 text-[#18302b]" : "hover:bg-white/10"}`}>English</button>
    <button type="button" lang="vi" aria-pressed={locale === "vi"} onClick={() => void choose("vi")} className={`min-h-8 rounded-lg px-2 py-1 font-bold text-amber-50 ${locale === "vi" ? "bg-amber-200 text-[#18302b]" : "hover:bg-white/10"}`}>Tiếng Việt</button>
    {status && <span className="basis-full px-2 py-1 text-[10px] text-amber-50" role="status">{status}</span>}
  </div>;
}
