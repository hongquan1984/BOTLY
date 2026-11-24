import {
  MobileSession,
  getStoredSession,
  storeSession,
  removeStoredSession,
  resolveServiceUrl,
} from "./api";

export function getSupabaseUrl(): string {
  return resolveServiceUrl(process.env.EXPO_PUBLIC_SUPABASE_URL, 54321);
}

const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH";

function authHeaders() {
  return {
    apikey: SUPABASE_ANON_KEY,
    "Content-Type": "application/json",
  };
}

export async function signInWithEmailPassword(
  email: string,
  pass: string
): Promise<MobileSession> {
  const cleanEmail = email.trim().toLowerCase();

  // Every player session must be issued by Supabase Auth.
  try {
    const url = `${getSupabaseUrl().replace(/\/$/, "")}/auth/v1/token?grant_type=password`;
    const response = await fetch(url, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ email: cleanEmail, password: pass }),
    });

    if (!response.ok) {
      let message = "Đăng nhập thất bại";
      try { const err = await response.json(); message = err.error_description || err.msg || err.error || message; } catch {}
      throw new Error(message);
    }
    const data = await response.json();
    const session: MobileSession = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: data.expires_at || Math.floor(Date.now() / 1000) + (data.expires_in || 3600),
      user: { id: data.user.id, email: data.user.email },
    };
    await storeSession(session);
    return session;
  } catch (err) { throw err; }
}

export async function signUpWithEmailPassword(
  email: string,
  pass: string
): Promise<{ user: any; needsEmailConfirmation: boolean }> {
  const url = `${getSupabaseUrl().replace(/\/$/, "")}/auth/v1/signup`;
  const response = await fetch(url, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ email: email.trim().toLowerCase(), password: pass }),
  });

  if (!response.ok) {
    let message = "Đăng ký tài khoản thất bại";
    try {
      const err = await response.json();
      message = err.error_description || err.msg || err.error || message;
    } catch {}
    throw new Error(message);
  }

  const data = await response.json();
  return {
    user: data.user || data,
    needsEmailConfirmation: !data.access_token,
  };
}

export async function sendMagicLink(email: string): Promise<boolean> {
  const url = `${getSupabaseUrl().replace(/\/$/, "")}/auth/v1/otp`;
  const response = await fetch(url, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      email: email.trim().toLowerCase(),
      create_user: true,
    }),
  });

  if (!response.ok) {
    let message = "Không thể gửi liên kết đăng nhập";
    try {
      const err = await response.json();
      message = err.error_description || err.msg || err.error || message;
    } catch {}
    throw new Error(message);
  }

  return true;
}

export async function refreshCurrentSession(): Promise<MobileSession | null> {
  const current = await getStoredSession();
  if (!current?.refresh_token) {
    await removeStoredSession();
    return null;
  }

  const url = `${getSupabaseUrl().replace(/\/$/, "")}/auth/v1/token?grant_type=refresh_token`;
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ refresh_token: current.refresh_token }),
    });

    if (!response.ok) {
      await removeStoredSession();
      return null;
    }

    const data = await response.json();
    const refreshed: MobileSession = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: data.expires_at || Math.floor(Date.now() / 1000) + (data.expires_in || 3600),
      user: {
        id: data.user.id,
        email: data.user.email || current.user.email,
      },
    };

    await storeSession(refreshed);
    return refreshed;
  } catch {
    return null;
  }
}

export async function signOut(): Promise<void> {
  await removeStoredSession();
}
