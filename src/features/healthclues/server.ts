import { NextResponse } from "next/server";

export type VerifiedUser = { id: string; email?: string; emailConfirmed: boolean };
type ApiError = { response: NextResponse };

function configuration() {
  const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
  const serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const publicKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  return { url, serviceKey, publicKey };
}

/** Server-only switch for synthetic local owner-demo fixtures; never trusts a client flag. */
export function isHealthCluesOwnerDemo(): boolean {
  if (process.env.HEALTHCLUES_OWNER_DEMO !== "1") return false;
  try {
    const host = new URL(configuration().url).hostname.toLowerCase();
    return host === "127.0.0.1" || host === "localhost" || host === "::1";
  } catch { return false; }
}

export async function requireUser(request: Request, options: { allowDeletionPending?: boolean } = {}): Promise<VerifiedUser | ApiError> {
  const { url, publicKey } = configuration();
  const token = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!url || !publicKey) return { response: NextResponse.json({ error: "HealthClues account service is unavailable." }, { status: 503, headers: { "Cache-Control": "no-store" } }) };
  if (!token || token.length > 8192) return { response: NextResponse.json({ error: "Sign in to continue." }, { status: 401, headers: { "Cache-Control": "no-store" } }) };
  try {
    const response = await fetch(`${url}/auth/v1/user`, { headers: { apikey: publicKey, Authorization: `Bearer ${token}` }, cache: "no-store", signal: AbortSignal.timeout(5000) });
    if (!response.ok) return { response: NextResponse.json({ error: "Your sign-in session is invalid or expired." }, { status: 401, headers: { "Cache-Control": "no-store" } }) };
    const body = await response.json() as { id?: string; email?: string; email_confirmed_at?: string | null; confirmed_at?: string | null };
    if (!body.id || !/^[0-9a-f-]{36}$/i.test(body.id)) return { response: NextResponse.json({ error: "Your sign-in session is invalid." }, { status: 401, headers: { "Cache-Control": "no-store" } }) };
    if (!options.allowDeletionPending) {
      const requests = await serviceRest<Array<{ id: string }>>(`healthclues_account_deletion_requests?user_id=eq.${body.id}&status=eq.requested&select=id&limit=1`).catch(() => []);
      if (requests.length) return { response: NextResponse.json({ error: "HealthClues access is paused while your data deletion request is pending.", code: "healthclues_deletion_pending" }, { status: 423, headers: { "Cache-Control": "no-store, max-age=0, private" } }) };
    }
    return { id: body.id, emailConfirmed: Boolean(body.email_confirmed_at || body.confirmed_at), ...(body.email ? { email: body.email } : {}) };
  } catch (error) {
    console.error("HealthClues requireUser failed:", error instanceof Error ? error.message : "unknown");
    return { response: NextResponse.json({ error: "Account verification is temporarily unavailable." }, { status: 503, headers: { "Cache-Control": "no-store" } }) };
  }
}

export function isApiError(value: VerifiedUser | ApiError): value is ApiError { return "response" in value; }

export async function serviceRest<T>(path: string, init?: RequestInit): Promise<T> {
  const { url, serviceKey } = configuration();
  if (!url || !serviceKey) throw new Error("HealthClues storage is unavailable.");
  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json", ...(init?.headers ?? {}) },
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) {
    let errorCode = "unknown";
    let missingRelation = "";
    let missingFunction = "";
    try {
      const body = await response.clone().json() as { code?: unknown; message?: unknown };
      if (typeof body.code === "string" && /^[A-Z0-9]{4,12}$/.test(body.code)) errorCode = body.code;
      if (typeof body.message === "string") missingRelation = body.message.match(/public\.(healthclues_[a-z_]+)/)?.[1] ?? "";
      if (errorCode === "PGRST202" && typeof body.message === "string") {
        const match = body.message.match(/function public\.([a-z0-9_]+)\(([^)]*)\)/i);
        if (match) missingFunction = `${match[1]}(${match[2].slice(0, 240)})`;
      }
    } catch { /* Keep response details private and avoid logging user data. */ }
    throw new Error(`HealthClues storage request failed (${response.status}; ${errorCode}${missingFunction ? `; ${missingFunction}` : missingRelation ? `; ${missingRelation}` : ""}).`);
  }
  if (response.status === 204) return undefined as T;
  const responseBody = await response.text();
  if (!responseBody.trim()) return undefined as T;
  return JSON.parse(responseBody) as T;
}

export async function serviceCount(path: string): Promise<number> {
  const { url, serviceKey } = configuration();
  if (!url || !serviceKey) throw new Error("HealthClues storage is unavailable.");
  const response = await fetch(`${url}/rest/v1/${path}`, {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      Prefer: "count=exact",
      Range: "0-0",
    },
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error(`HealthClues diagnostics request failed (${response.status}).`);
  const contentRange = response.headers.get("content-range") || "";
  const total = /\/(\d+)$/.exec(contentRange)?.[1];
  if (total === undefined) throw new Error("HealthClues diagnostics count was unavailable.");
  return Number(total);
}

export async function userRpc<T>(name: string, args: Record<string, unknown>): Promise<T> {
  return serviceRest<T>(`rpc/${encodeURIComponent(name)}`, { method: "POST", body: JSON.stringify(args) });
}

export function apiFailure(error: unknown, fallback: string) {
  const message = error instanceof Error && error.message.startsWith("HealthClues storage request failed (400)")
    ? "Some selected tools changed or are no longer eligible. Review your choices and try again."
    : fallback;
  return NextResponse.json({ error: message }, { status: 400, headers: { "Cache-Control": "no-store" } });
}

export function validTimeZone(timeZone: unknown): timeZone is string {
  if (typeof timeZone !== "string" || timeZone.length > 100) return false;
  try { new Intl.DateTimeFormat("en", { timeZone }); return true; } catch { return false; }
}

export function validUuid(value: unknown): value is string { return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value); }

