"use client";

export type CloudSession = { access_token: string; refresh_token: string; expires_at: number; user: { id: string; email?: string; email_confirmed_at?: string | null; confirmed_at?: string | null } };
const sessionKey = "botly-cloud-session";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const cloudEnabled = Boolean(url && anonKey);

function headers(accessToken?: string) {
  const bearer = accessToken ?? (anonKey?.startsWith('sb_') ? undefined : anonKey);
  return { apikey: anonKey ?? '', ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}), 'Content-Type': 'application/json' };
}
export function getCloudSessionSnapshot() { return typeof window === "undefined" ? null : localStorage.getItem(sessionKey); }
export function subscribeCloudSession(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("botly:session", callback);
  window.addEventListener("storage", callback);
  return () => { window.removeEventListener("botly:session", callback); window.removeEventListener("storage", callback); };
}
export function parseCloudSessionSnapshot(raw: string | null): CloudSession | null { try { return raw ? JSON.parse(raw) as CloudSession : null; } catch { return null; } }
export function getCloudSession(): CloudSession | null { return parseCloudSessionSnapshot(getCloudSessionSnapshot()); }
export function saveCloudSession(session: CloudSession) { localStorage.setItem(sessionKey, JSON.stringify(session)); window.dispatchEvent(new Event("botly:session")); }
export function clearCloudSession() { localStorage.removeItem(sessionKey); window.dispatchEvent(new Event("botly:session")); }

export function isCloudSessionExpired(session: CloudSession | null): boolean {
  if (!session || !session.access_token) return true;
  if (typeof session.expires_at === "number" && session.expires_at > 0) {
    return session.expires_at < Math.floor(Date.now() / 1000) + 15;
  }
  return false;
}

export async function refreshCloudSession(): Promise<CloudSession | null> {
  const session = getCloudSession();
  if (!session?.refresh_token || !cloudEnabled) {
    clearCloudSession();
    return null;
  }
  try {
    const response = await fetch(`${url}/auth/v1/token?grant_type=refresh_token`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ refresh_token: session.refresh_token }),
    });
    if (!response.ok) {
      clearCloudSession();
      return null;
    }
    const data = await response.json();
    if (data.access_token) {
      const refreshed: CloudSession = {
        access_token: data.access_token,
        refresh_token: data.refresh_token || session.refresh_token,
        expires_at: data.expires_at || Math.floor(Date.now() / 1000) + (data.expires_in || 3600),
        user: data.user || session.user,
      };
      saveCloudSession(refreshed);
      return refreshed;
    }
  } catch {
    clearCloudSession();
    return null;
  }
  clearCloudSession();
  return null;
}

export function handleSessionExpired(locale: string = "vi") {
  clearCloudSession();
  if (typeof window !== "undefined") {
    const target = `/play?signin=1&expired=1`;
    window.location.replace(target);
  }
}

export async function sendMagicLink(email: string, locale: "en" | "vi", purpose?: "healthclues-save-profile" | "healthclues-world" | "healthclues-journey-activation") {
  if (!cloudEnabled) throw new Error("Cloud sync is not configured yet.");
  const callback = `${window.location.origin}/${locale === "vi" ? "vi/song-khoe" : "en/wellness"}/auth/callback`;
  const next = purpose === "healthclues-save-profile" ? "/en/wellness/healthclues/quiz?view=save" : purpose === "healthclues-world" ? "/en/wellness/healthclues/world" : purpose === "healthclues-journey-activation" ? "/play?activation=complete" : "";
  const redirectTo = next ? `${callback}?next=${encodeURIComponent(next)}` : callback;
  // GoTrue's REST OTP endpoint accepts the redirect target as the `redirect_to` query
  // parameter. The `options.email_redirect_to` shape belongs to the Supabase JS SDK,
  // and posting it here silently fell back to the project site_url (the Botly home page).
  const response = await fetch(`${url}/auth/v1/otp?redirect_to=${encodeURIComponent(redirectTo)}`, { method: "POST", headers: headers(), body: JSON.stringify({ email, create_user: true }) });
  if (!response.ok) throw new Error("Could not send the sign-in link.");
}

export function signInWithOAuth(provider: "google", locale: "en" | "vi", nextPath: string = "/play") {
  if (!cloudEnabled) throw new Error("Cloud sync is not configured yet.");
  const callback = `${window.location.origin}/${locale === "vi" ? "vi/song-khoe" : "en/wellness"}/auth/callback`;
  const redirectTo = `${callback}?next=${encodeURIComponent(nextPath)}`;
  window.location.href = `${url}/auth/v1/authorize?provider=${provider}&redirect_to=${encodeURIComponent(redirectTo)}`;
}
export async function saveHealthCluesProfile(profile: unknown, consentedAt: string, session: CloudSession) {
  const response = await fetch(`${url}/rest/v1/healthclues_profiles?on_conflict=user_id`, { method: "POST", headers: { ...headers(session.access_token), Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify({ user_id: session.user.id, profile, consent_version: "healthclues-profile-consent-v1", consented_at: consentedAt, updated_at: new Date().toISOString() }) });
  if (!response.ok) throw new Error("Profile saving is unavailable. Please try again later.");
}
export async function loadHealthCluesProfile(session: CloudSession) {
  const response = await fetch(`${url}/rest/v1/healthclues_profiles?user_id=eq.${encodeURIComponent(session.user.id)}&select=profile&limit=1`, { headers: headers(session.access_token), cache: "no-store" });
  if (!response.ok) throw new Error("Could not check the saved discovery profile.");
  const rows = await response.json() as Array<{ profile: unknown }>;
  return rows[0]?.profile ?? null;
}
export async function deleteHealthCluesProfile(session: CloudSession) {
  const response = await fetch(`${url}/rest/v1/healthclues_profiles?user_id=eq.${encodeURIComponent(session.user.id)}`, { method: "DELETE", headers: headers(session.access_token) });
  if (!response.ok) throw new Error("Could not delete your saved profile.");
}
export async function downloadHealthCluesProfile(session: CloudSession) {
  const response = await fetch(`${url}/rest/v1/healthclues_profiles?user_id=eq.${encodeURIComponent(session.user.id)}&select=profile,consented_at,consent_version`, { headers: headers(session.access_token), cache: "no-store" });
  if (!response.ok) throw new Error("Could not retrieve your saved HealthClues profile.");
  const rows = await response.json() as { profile: unknown; consented_at: string; consent_version: string }[];
  return rows[0]?.profile ?? null;
}
export type HealthCluesProfileRevision = { version: number; profile: Record<string, unknown>; consent_version: string; consented_at: string; changed_at: string };
export async function loadHealthCluesProfileHistory(session: CloudSession) {
  const response = await fetch(`${url}/rest/v1/healthclues_profile_history?select=version,profile,consent_version,consented_at,changed_at&order=version.desc&limit=50`, { headers: headers(session.access_token), cache: "no-store" });
  if (!response.ok) throw new Error("Could not retrieve your saved HealthClues profile history.");
  return response.json() as Promise<HealthCluesProfileRevision[]>;
}
export type HealthCluesActivity = { id: number; content_id: string; action: 'viewed' | 'saved' | 'tried' | 'not_yet' | 'not_interested' | 'skipped'; reason: string | null; occurred_at: string };
export async function loadHealthCluesActivity(session: CloudSession) {
  const response = await fetch(`${url}/rest/v1/healthclues_discovery_activity?select=id,content_id,action,reason,occurred_at&order=occurred_at.desc,id.desc&limit=500`, { headers: headers(session.access_token), cache: 'no-store' });
  if (!response.ok) throw new Error('Could not retrieve your HealthClues history.');
  return response.json() as Promise<HealthCluesActivity[]>;
}
export async function recordHealthCluesActivity(contentId: string, action: HealthCluesActivity['action'], reason: string | null, session: CloudSession) {
  const response = await fetch(`${url}/rest/v1/healthclues_discovery_activity`, { method: 'POST', headers: { ...headers(session.access_token), Prefer: 'return=minimal' }, body: JSON.stringify({ user_id: session.user.id, content_id: contentId, action, reason }) });
  if (!response.ok) throw new Error('Could not save your HealthClues check-in.');
}
export async function deleteHealthCluesActivity(session: CloudSession) {
  const response = await fetch(`${url}/rest/v1/healthclues_discovery_activity?user_id=eq.${encodeURIComponent(session.user.id)}`, { method: 'DELETE', headers: headers(session.access_token) });
  if (!response.ok) throw new Error('Could not delete your HealthClues history.');
}
export async function hydrateUser(accessToken: string) { const response = await fetch(`${url}/auth/v1/user`, { headers: headers(accessToken) }); if (!response.ok) throw new Error("The sign-in link is invalid or expired."); return response.json() as Promise<{ id: string; email?: string; email_confirmed_at?: string | null; confirmed_at?: string | null }>; }
export async function uploadPlan(plan: unknown, session: CloudSession) { const response = await fetch(`${url}/rest/v1/wellness_plans?on_conflict=user_id`, { method: "POST", headers: { ...headers(session.access_token), Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify({ user_id: session.user.id, plan, updated_at: new Date().toISOString() }) }); if (!response.ok) throw new Error("Could not sync your plan."); }
export async function downloadPlan(session: CloudSession) { const response = await fetch(`${url}/rest/v1/wellness_plans?user_id=eq.${session.user.id}&select=plan`, { headers: headers(session.access_token) }); if (!response.ok) throw new Error("Could not download your plan."); const rows = await response.json() as { plan: unknown }[]; return rows[0]?.plan ?? null; }
