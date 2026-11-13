import type { HealthCluesProfile } from "@/lib/healthclues-quiz";
import type { WellnessPlanGoal } from "@/features/healthclues/wellness-plan";

export type PendingHealthCluesJourney = {
  version: 1;
  email: string;
  questId: string;
  profile: HealthCluesProfile;
  wellnessPlan?: WellnessPlanGoal[] | null;
  wellnessPlanRequestKey?: string;
  consentedAt: string;
  expiresAt: number;
};

export function removeLegacyPendingHealthCluesJourney() {
  try { window.localStorage.removeItem("healthclues-pending-journey-v1"); } catch { /* Storage may be unavailable. */ }
}

export async function savePendingHealthCluesJourney(input: Omit<PendingHealthCluesJourney, "version" | "expiresAt">): Promise<{ ok: true } | { ok: false; status: number | null }> {
  try {
    const response = await fetch("/api/healthclues/pending-journey", {
      method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...input, consent: true }), cache: "no-store",
    });
    return response.ok ? { ok: true } : { ok: false, status: response.status };
  } catch {
    return { ok: false, status: null };
  }
}

export async function getPendingHealthCluesJourney(accessToken: string) {
  const response = await fetch("/api/healthclues/pending-journey", {
    headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store",
  });
  if (!response.ok) return null;
  return response.json() as Promise<PendingHealthCluesJourney | null>;
}

export async function clearPendingHealthCluesJourney(accessToken?: string) {
  await fetch("/api/healthclues/pending-journey", {
    method: "DELETE", credentials: "same-origin",
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {}, cache: "no-store",
  }).catch(() => undefined);
}
