"use client";

export type CloudSession = { access_token: string; refresh_token: string; expires_at: number; user: { id: string; email?: string } };
const sessionKey = "botly-cloud-session";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const cloudEnabled = Boolean(url && anonKey);

function headers(accessToken?: string) {
  const bearer = accessToken ?? (anonKey?.startsWith('sb_') ? undefined : anonKey);
  return { apikey: anonKey ?? '', ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}), 'Content-Type': 'application/json' };
}
export function getCloudSession(): CloudSession | null { if (typeof window === "undefined") return null; try { const raw = localStorage.getItem(sessionKey); return raw ? JSON.parse(raw) as CloudSession : null; } catch { return null; } }
export function saveCloudSession(session: CloudSession) { localStorage.setItem(sessionKey, JSON.stringify(session)); window.dispatchEvent(new Event("botly:session")); }
export function clearCloudSession() { localStorage.removeItem(sessionKey); window.dispatchEvent(new Event("botly:session")); }

export async function sendMagicLink(email: string, locale: "en" | "vi") {
  if (!cloudEnabled) throw new Error("Cloud sync is not configured yet.");
  const redirectTo = `${window.location.origin}/${locale === "vi" ? "vi/song-khoe" : "en/wellness"}/auth/callback`;
  const response = await fetch(`${url}/auth/v1/otp`, { method: "POST", headers: headers(), body: JSON.stringify({ email, create_user: true, options: { email_redirect_to: redirectTo } }) });
  if (!response.ok) throw new Error("Could not send the sign-in link.");
}
export async function hydrateUser(accessToken: string) { const response = await fetch(`${url}/auth/v1/user`, { headers: headers(accessToken) }); if (!response.ok) throw new Error("The sign-in link is invalid or expired."); return response.json() as Promise<{ id: string; email?: string }>; }
export async function uploadPlan(plan: unknown, session: CloudSession) { const response = await fetch(`${url}/rest/v1/wellness_plans?on_conflict=user_id`, { method: "POST", headers: { ...headers(session.access_token), Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify({ user_id: session.user.id, plan, updated_at: new Date().toISOString() }) }); if (!response.ok) throw new Error("Could not sync your plan."); }
export async function downloadPlan(session: CloudSession) { const response = await fetch(`${url}/rest/v1/wellness_plans?user_id=eq.${session.user.id}&select=plan`, { headers: headers(session.access_token) }); if (!response.ok) throw new Error("Could not download your plan."); const rows = await response.json() as { plan: unknown }[]; return rows[0]?.plan ?? null; }
