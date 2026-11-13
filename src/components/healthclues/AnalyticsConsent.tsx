"use client";

import { useSyncExternalStore } from "react";
import { hasHealthCluesAnalyticsConsent, setHealthCluesAnalyticsConsent } from "@/lib/healthclues-funnel";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("botly:analytics-consent", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("botly:analytics-consent", callback);
  };
}

export function AnalyticsConsent({ compact = false }: { compact?: boolean }) {
  const allowed = useSyncExternalStore(subscribe, hasHealthCluesAnalyticsConsent, () => false);
  return <label className={`flex cursor-pointer items-start gap-2 text-xs leading-relaxed ${compact ? "text-[#71837b]" : "text-[#60746d]"}`}>
    <input type="checkbox" checked={allowed} onChange={event => setHealthCluesAnalyticsConsent(event.target.checked)} className="mt-0.5 accent-emerald-800" />
    <span>Allow Botly to measure funnel steps with a pseudonymous browser ID and device/referrer data (optional). Quiz answers and health details are never sent.</span>
  </label>;
}
