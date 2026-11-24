/**
 * HealthClues Mobile API Client
 * Configurable for Android Emulator (10.0.2.2), Physical Device LAN IP, or Cloud Production.
 */
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const SESSION_STORAGE_KEY = "healthclues-mobile-session";

export interface MobileSession {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user: {
    id: string;
    email?: string;
  };
}

export function resolveServiceUrl(envUrl: string | undefined, defaultPort: number): string {
  // If remote HTTPS, use as is
  if (envUrl && envUrl.startsWith("https://")) {
    return envUrl;
  }

  // Web environment (desktop browser or mobile web testing)
  if (Platform.OS === "web") {
    if (envUrl) {
      const host = typeof window !== "undefined" && window.location?.hostname ? window.location.hostname : "localhost";
      return envUrl.replace("10.0.2.2", host);
    }
    const host = typeof window !== "undefined" && window.location?.hostname ? window.location.hostname : "localhost";
    return `http://${host}:${defaultPort}`;
  }

  // Android emulator
  if (Platform.OS === "android") {
    if (envUrl && (envUrl.includes("localhost") || envUrl.includes("127.0.0.1"))) {
      return envUrl.replace("localhost", "10.0.2.2").replace("127.0.0.1", "10.0.2.2");
    }
    return envUrl || `http://10.0.2.2:${defaultPort}`;
  }

  // iOS simulator or default fallback
  if (envUrl) {
    return envUrl.replace("10.0.2.2", "localhost");
  }
  return `http://localhost:${defaultPort}`;
}

export function getApiBaseUrl(): string {
  if (Platform.OS === "web") {
    // Expo web does not proxy unknown /api paths; use the configured backend
    // so API calls cannot fall through to SPA HTML.
    return resolveServiceUrl(process.env.EXPO_PUBLIC_API_URL, 3329);
  }
  return resolveServiceUrl(process.env.EXPO_PUBLIC_API_URL, 3329);
}

export async function getStoredSession(): Promise<MobileSession | null> {
  try {
    const raw = await AsyncStorage.getItem(SESSION_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as MobileSession) : null;
  } catch {
    return null;
  }
}

export async function storeSession(session: MobileSession): Promise<void> {
  await AsyncStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

export async function removeStoredSession(): Promise<void> {
  await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
}

export interface ApiFetchOptions extends RequestInit {
  timeoutMs?: number;
}

export async function apiFetch<T>(
  endpoint: string,
  options: ApiFetchOptions = {}
): Promise<T> {
  const session = await getStoredSession();
  const baseUrl = getApiBaseUrl();
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${baseUrl.replace(/\/$/, "")}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeoutMs ?? 10000);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorMessage = `API Error ${response.status}`;
      try {
        const errorJson = await response.json();
        if (errorJson.error) errorMessage = errorJson.error;
      } catch {
        // Fallback to status text
      }
      throw new Error(errorMessage);
    }

    return (await response.json()) as T;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === "AbortError") {
      throw new Error("Yêu cầu mạng quá hạn (Network timeout). Vui lòng thử lại.");
    }
    throw error;
  }
}
