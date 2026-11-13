export const HEALTHCLUES_ANALYTICS_CONSENT_KEY = "botly_analytics_consent";
let healthCluesAnalyticsRevokedInMemory = false;

const HEALTHCLUES_ANALYTICS_PATHS = [
  "/en/wellness/healthclues",
  "/vi/song-khoe/healthclues",
  "/en/wellness/ebooks",
  "/vi/song-khoe/ebooks",
] as const;

const HEALTHCLUES_FUNNEL_EVENTS = new Set([
  "page_view", "ebook_library_view", "quiz_hero_view", "quiz_hero_click",
  "ebook_download_success", "post_download_quiz_view", "post_download_quiz_click",
  "post_download_quiz_dismiss", "post_download_profile_view", "post_download_profile_click",
  "post_download_profile_dismiss", "quiz_started", "quiz_completed", "profile_created",
]);

function writeConsentCookie(consented: boolean) {
  if (typeof document === "undefined") return;
  const current = document.cookie.split(";").map(cookie => cookie.trim()).find(cookie => cookie.startsWith(`${HEALTHCLUES_ANALYTICS_CONSENT_KEY}=`));
  if (consented && current === `${HEALTHCLUES_ANALYTICS_CONSENT_KEY}=granted`) return;
  if (!consented && !current) return;
  const secure = typeof window !== "undefined" && window.location?.protocol === "https:" ? "; Secure" : "";
  document.cookie = consented
    ? `${HEALTHCLUES_ANALYTICS_CONSENT_KEY}=granted; Path=/; Max-Age=31536000; SameSite=Lax${secure}`
    : `${HEALTHCLUES_ANALYTICS_CONSENT_KEY}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
}

export function hasHealthCluesAnalyticsConsent() {
  if (typeof window === "undefined") return false;
  if (healthCluesAnalyticsRevokedInMemory) return false;
  try {
    return window.localStorage.getItem(HEALTHCLUES_ANALYTICS_CONSENT_KEY) === "granted";
  } catch { return false; }
}

export function syncHealthCluesAnalyticsConsentCookie() {
  if (hasHealthCluesAnalyticsConsent()) writeConsentCookie(true);
  else writeConsentCookie(false);
}

export function setHealthCluesAnalyticsConsent(consented: boolean) {
  if (typeof window === "undefined") return;
  if (!consented) healthCluesAnalyticsRevokedInMemory = true;
  try {
    if (consented) {
      window.localStorage.setItem(HEALTHCLUES_ANALYTICS_CONSENT_KEY, "granted");
      healthCluesAnalyticsRevokedInMemory = false;
      syncHealthCluesAnalyticsConsentCookie();
    } else {
      window.localStorage.removeItem(HEALTHCLUES_ANALYTICS_CONSENT_KEY);
      syncHealthCluesAnalyticsConsentCookie();
    }
  } catch {
    // A failed write cannot grant consent; a failed removal remains revoked for this page session.
    healthCluesAnalyticsRevokedInMemory = true;
    syncHealthCluesAnalyticsConsentCookie();
  }
  window.dispatchEvent(new Event("botly:analytics-consent"));
}

export function isHealthCluesAnalyticsPath(pathname: string) {
  return HEALTHCLUES_ANALYTICS_PATHS.some(prefix => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function excludeHealthCluesFromGeneralAnalytics<T extends { path?: unknown }>(rows: readonly T[]) {
  return rows.filter(row => typeof row.path !== "string" || !isHealthCluesAnalyticsPath(row.path));
}

export function hasHealthCluesAnalyticsConsentCookie(cookieHeader: string) {
  return cookieHeader.split(";").some(cookie => cookie.trim() === `${HEALTHCLUES_ANALYTICS_CONSENT_KEY}=granted`);
}

export function sanitizeHealthCluesAnalyticsPayload(eventType: string, pathname: string, metadata: unknown) {
  const safePath = (() => {
    try { return new URL(pathname, "https://healthclues.invalid").pathname.slice(0, 500); }
    catch { return "/"; }
  })();
  if (!HEALTHCLUES_FUNNEL_EVENTS.has(eventType)) return null;
  const raw = typeof metadata === "object" && metadata !== null && !Array.isArray(metadata)
    ? metadata as Record<string, unknown> : {};
  const safeMetadata: Record<string, string> = { funnel: "healthclues_ebook_quiz_v1" };
  if (raw.entry === "hero" || raw.entry === "post_download") safeMetadata.entry = raw.entry;
  if (raw.delivery === "signed_download_url") safeMetadata.delivery = raw.delivery;
  return { eventType, path: safePath, metadata: safeMetadata };
}

export function shouldTrackAnalyticsPath(pathname: string, healthCluesConsent: boolean) {
  return !isHealthCluesAnalyticsPath(pathname) || healthCluesConsent;
}

export function analyticsTrackingKey(pathname: string, healthCluesConsent: boolean) {
  return isHealthCluesAnalyticsPath(pathname) ? `${pathname}:${healthCluesConsent ? "granted" : "denied"}` : pathname;
}
