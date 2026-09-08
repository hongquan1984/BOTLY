export type WellnessEvent = "tool_started" | "tool_completed" | "guide_opened" | "newsletter_submitted";

export function trackWellness(event: WellnessEvent, properties: Record<string, string | number | boolean> = {}) {
  if (typeof window === "undefined") return;
  const payload = { event, ...properties, timestamp: new Date().toISOString() };
  const analyticsWindow = window as typeof window & { dataLayer?: Record<string, unknown>[] };
  analyticsWindow.dataLayer ??= [];
  analyticsWindow.dataLayer.push(payload);
  window.dispatchEvent(new CustomEvent("botly:analytics", { detail: payload }));
}
