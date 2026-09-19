import { trackClientEvent } from "@/components/analytics/AnalyticsTracker";

export type WellnessEvent =
  | "tool_started"
  | "tool_completed"
  | "guide_opened"
  | "newsletter_submitted"
  | "ebook_downloaded"
  | "ebook_download_unlocked"
  | "ebook_download";

export function trackWellness(event: WellnessEvent, properties: Record<string, string | number | boolean> = {}) {
  if (typeof window === "undefined") return;
  const payload = { event, ...properties, timestamp: new Date().toISOString() };
  const analyticsWindow = window as typeof window & { dataLayer?: Record<string, unknown>[] };
  analyticsWindow.dataLayer ??= [];
  analyticsWindow.dataLayer.push(payload);
  window.dispatchEvent(new CustomEvent("botly:analytics", { detail: payload }));

  try {
    trackClientEvent(event, { metadata: properties });
  } catch {
    // Non-blocking fallback
  }
}

