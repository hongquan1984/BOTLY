import { trackClientEvent } from "@/components/analytics/AnalyticsTracker";
import { hasHealthCluesAnalyticsConsent } from "@/lib/healthclues-analytics-consent";
export { hasHealthCluesAnalyticsConsent, setHealthCluesAnalyticsConsent } from "@/lib/healthclues-analytics-consent";

export type HealthCluesFunnelEvent =
  | "ebook_library_view" | "quiz_hero_view" | "quiz_hero_click"
  | "ebook_download_success" | "post_download_quiz_view" | "post_download_quiz_click" | "post_download_quiz_dismiss"
  | "post_download_profile_view" | "post_download_profile_click" | "post_download_profile_dismiss"
  | "quiz_started" | "quiz_completed" | "profile_created";

export function trackHealthCluesFunnel(event: HealthCluesFunnelEvent, metadata: Record<string, string> = {}) {
  if (!hasHealthCluesAnalyticsConsent()) return;
  trackClientEvent(event, { locale: "en", metadata: { funnel: "healthclues_ebook_quiz_v1", ...metadata } });
}

export function getHealthCluesQuizUrl(ebookId: string, entry: "hero" | "post_download") {
  const params = new URLSearchParams({ source: "ebook", entry });
  if (/^[a-z0-9-]{1,100}$/.test(ebookId)) params.set("ebook_id", ebookId);
  return `/en/wellness/healthclues/quiz?${params.toString()}`;
}

const PROFILE_KEY = "healthclues_discovery_profile_v1";
const PROFILE_EVENT = "botly:healthclues-profile";
let cachedSessionProfile: import("@/lib/healthclues-quiz").HealthCluesProfile | null | undefined;

export function getHealthCluesSessionProfile() {
  if (typeof window === "undefined") return null;
  if (cachedSessionProfile !== undefined) return cachedSessionProfile;
  try {
    const raw = sessionStorage.getItem(PROFILE_KEY);
    if (!raw) { cachedSessionProfile = null; return cachedSessionProfile; }
    const value = JSON.parse(raw) as Record<string, unknown>;
    if (typeof value.topic !== "string" || typeof value.createdAt !== "string" || !Array.isArray(value.contentPreferences) || !value.contentPreferences.every(item => typeof item === "string") || typeof value.presentation !== "string" || typeof value.comfortableActivityTime !== "string" || typeof value.refreshFrequency !== "string" || typeof value.twoWeekGoal !== "string") { cachedSessionProfile = null; return cachedSessionProfile; }
    cachedSessionProfile = value as import("@/lib/healthclues-quiz").HealthCluesProfile;
    return cachedSessionProfile;
  } catch { cachedSessionProfile = null; return cachedSessionProfile; }
}

export function saveHealthCluesSessionProfile(profile: import("@/lib/healthclues-quiz").HealthCluesProfile | null) {
  if (typeof window === "undefined") return;
  try {
    if (profile) sessionStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    else sessionStorage.removeItem(PROFILE_KEY);
    cachedSessionProfile = profile;
    window.dispatchEvent(new Event(PROFILE_EVENT));
  } catch { /* The session-only profile still works in component memory. */ }
}

export function subscribeHealthCluesSessionProfile(callback: () => void) {
  window.addEventListener(PROFILE_EVENT, callback);
  return () => window.removeEventListener(PROFILE_EVENT, callback);
}

export function getHealthCluesProfileUrl(ebookId: string) {
  const params = new URLSearchParams(new URL(getHealthCluesQuizUrl(ebookId, "post_download"), "https://botly.invalid").searchParams);
  params.set("view", "profile");
  return `/en/wellness/healthclues/quiz?${params.toString()}`;
}
