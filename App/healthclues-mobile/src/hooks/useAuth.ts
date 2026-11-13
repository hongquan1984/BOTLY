import { useState, useEffect, useCallback } from "react";
import {
  MobileSession,
  getStoredSession,
  storeSession,
  removeStoredSession,
} from "../services/api";
import {
  signInWithEmailPassword,
  signUpWithEmailPassword,
  sendMagicLink,
  refreshCurrentSession,
  signOut as authSignOut,
} from "../services/auth";

export function useAuth() {
  const [session, setSession] = useState<MobileSession | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const initAuth = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const stored = await getStoredSession();
      if (!stored) {
        setSession(null);
        return;
      }
      // Check expiry (renew if within 60 seconds)
      const now = Math.floor(Date.now() / 1000);
      if (stored.expires_at < now + 60) {
        const refreshed = await refreshCurrentSession();
        setSession(refreshed);
      } else {
        setSession(stored);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load auth session");
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  const login = async (email: string, pass: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await signInWithEmailPassword(email, pass);
      setSession(res);
      return res;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, pass: string) => {
    setLoading(true);
    setError(null);
    try {
      return await signUpWithEmailPassword(email, pass);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const requestMagicLink = async (email: string) => {
    setLoading(true);
    setError(null);
    try {
      return await sendMagicLink(email);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authSignOut();
      setSession(null);
    } finally {
      setLoading(false);
    }
  };

  return {
    session,
    isAuthenticated: !!session?.access_token,
    user: session?.user ?? null,
    loading,
    error,
    login,
    register,
    requestMagicLink,
    logout,
    refreshAuth: initAuth,
  };
}
