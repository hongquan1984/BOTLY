import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import * as Haptics from "expo-haptics";
import { apiFetch, getStoredSession } from "./api";

export const REMINDER_STORAGE_KEY = "healthclues-reminder-settings";
export const REMINDER_CHANNEL_ID = "daily-habits";

export type ReminderFrequency = "daily" | "weekdays" | "weekly";
export type ReminderPermissionStatus = "unknown" | "granted" | "denied" | "unsupported";

export interface ReminderPreference {
  enabled: boolean;
  paused: boolean;
  localSendTime: string; // "HH:MM" 24-hour
  frequency: ReminderFrequency;
  timezone: string;
  consentConfirmed: boolean;
  permissionStatus: ReminderPermissionStatus;
  updatedAt: string;
}

export const DEFAULT_REMINDER_PREFERENCE: ReminderPreference = {
  enabled: false,
  paused: false,
  localSendTime: "07:30",
  frequency: "daily",
  timezone: "Asia/Ho_Chi_Minh",
  consentConfirmed: false,
  permissionStatus: "unknown",
  updatedAt: new Date(0).toISOString(),
};

let handlerInitialized = false;

/**
 * Configures foreground notification behavior once on iOS/Android.
 */
export function initNotificationHandler(): void {
  if (Platform.OS === "web" || handlerInitialized) return;
  handlerInitialized = true;
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  } catch {
    // Keep non-fatal if running inside headless preview container
  }
}

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== "android") return;
  try {
    await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
      name: "Nhắc nhở sống khỏe",
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 180, 120, 180],
      lightColor: "#10b981",
    });
  } catch {}
}

/**
 * Parses a "HH:MM" time string safely into 24-hour components.
 */
export function parseTimeHHMM(raw: string): { hour: number; minute: number } {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(raw);
  if (!match) return { hour: 7, minute: 30 };
  return {
    hour: parseInt(match[1], 10),
    minute: parseInt(match[2], 10),
  };
}

/**
 * Requests OS notification permission safely on Native & supported Web contexts.
 */
export async function requestReminderPermission(): Promise<ReminderPermissionStatus> {
  if (Platform.OS === "web") {
    try {
      if (typeof window === "undefined" || !("Notification" in window)) {
        return "unsupported";
      }
      if (window.Notification.permission === "granted") return "granted";
      // Chrome blocks Notification.requestPermission on insecure plain-HTTP non-localhost LAN origins
      if (!window.isSecureContext && window.location?.hostname !== "localhost" && window.location?.hostname !== "127.0.0.1") {
        return "unsupported";
      }
      const perm = await window.Notification.requestPermission();
      return perm === "granted" ? "granted" : perm === "denied" ? "denied" : "unknown";
    } catch {
      return "unsupported";
    }
  }

  try {
    await ensureAndroidChannel();
    const existing = await Notifications.getPermissionsAsync();
    if (existing.granted || existing.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
      return "granted";
    }
    const asked = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: false,
        allowSound: true,
      },
    });
    return asked.granted || asked.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
      ? "granted"
      : "denied";
  } catch {
    return "unsupported";
  }
}

/**
 * Cancels previously scheduled local notifications and creates triggers matching user preferences.
 */
export async function syncOsNotificationSchedule(pref: ReminderPreference): Promise<void> {
  if (Platform.OS === "web") return;
  initNotificationHandler();
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    if (!pref.enabled || pref.paused) return;

    const perm = await Notifications.getPermissionsAsync();
    if (!perm.granted && perm.ios?.status !== Notifications.IosAuthorizationStatus.PROVISIONAL) {
      return;
    }

    await ensureAndroidChannel();
    const { hour, minute } = parseTimeHHMM(pref.localSendTime);
    const content: Notifications.NotificationContentInput = {
      title: "Lumi nhắc nhẹ — HealthClues",
      body: "Đã đến giờ điểm danh thói quen sống khỏe và nhận thưởng EXP hôm nay!",
      sound: true,
      data: { route: "/(game)/daily-care" },
    };

    if (pref.frequency === "daily") {
      await Notifications.scheduleNotificationAsync({
        content,
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          channelId: REMINDER_CHANNEL_ID,
          hour,
          minute,
        },
      });
    } else if (pref.frequency === "weekdays") {
      // Expo Notifications weekday: 1 = Sun, 2 = Mon .. 6 = Fri
      for (const weekday of [2, 3, 4, 5, 6]) {
        await Notifications.scheduleNotificationAsync({
          content,
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
            channelId: REMINDER_CHANNEL_ID,
            weekday,
            hour,
            minute,
          },
        });
      }
    } else {
      await Notifications.scheduleNotificationAsync({
        content,
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          channelId: REMINDER_CHANNEL_ID,
          weekday: 2, // Monday weekly gentle check-in
          hour,
          minute,
        },
      });
    }
  } catch {
    // Keep non-fatal on simulators without notification entitlements
  }
}

/**
 * Reads local AsyncStorage preference and refreshes from /api/healthclues/reminders when authenticated.
 */
export async function loadReminderPreferences(fallbackTimezone?: string): Promise<ReminderPreference> {
  let localPref: ReminderPreference = {
    ...DEFAULT_REMINDER_PREFERENCE,
    timezone: fallbackTimezone || DEFAULT_REMINDER_PREFERENCE.timezone,
  };

  try {
    const raw = await AsyncStorage.getItem(REMINDER_STORAGE_KEY);
    if (raw) {
      localPref = { ...localPref, ...(JSON.parse(raw) as Partial<ReminderPreference>) };
    }
  } catch {}

  try {
    const session = await getStoredSession();
    if (session?.access_token) {
      const remote = await apiFetch<{
        preference: {
          opted_in: boolean;
          timezone: string;
          local_send_time: string;
          frequency: ReminderFrequency;
          paused: boolean;
        } | null;
      }>("/api/healthclues/reminders");
      if (remote?.preference) {
        localPref = {
          ...localPref,
          enabled: remote.preference.opted_in && !remote.preference.paused,
          paused: remote.preference.paused,
          timezone: remote.preference.timezone || localPref.timezone,
          localSendTime: remote.preference.local_send_time || localPref.localSendTime,
          frequency: remote.preference.frequency || localPref.frequency,
          consentConfirmed: remote.preference.opted_in,
        };
        await AsyncStorage.setItem(REMINDER_STORAGE_KEY, JSON.stringify(localPref));
      }
    }
  } catch {
    // Local preference remains authoritative offline/guest
  }

  return localPref;
}

/**
 * Saves preference locally, requests permission if turning ON, updates OS schedule, and syncs backend when signed in.
 */
export async function saveReminderPreferences(
  draft: Omit<ReminderPreference, "updatedAt" | "permissionStatus">
): Promise<{ preference: ReminderPreference; syncedBackend: boolean }> {
  let permissionStatus: ReminderPermissionStatus = "unknown";
  if (draft.enabled && !draft.paused) {
    permissionStatus = await requestReminderPermission();
  }

  const saved: ReminderPreference = {
    ...draft,
    permissionStatus,
    updatedAt: new Date().toISOString(),
  };

  await AsyncStorage.setItem(REMINDER_STORAGE_KEY, JSON.stringify(saved));
  await syncOsNotificationSchedule(saved);

  let syncedBackend = false;
  try {
    const session = await getStoredSession();
    if (session?.access_token) {
      await apiFetch("/api/healthclues/reminders", {
        method: "POST",
        body: JSON.stringify({
          action: "save",
          optedIn: saved.enabled,
          timezone: saved.timezone,
          localSendTime: saved.localSendTime,
          frequency: saved.frequency,
          consentConfirmed: saved.enabled ? saved.consentConfirmed : false,
        }),
      });
      syncedBackend = true;
    }
  } catch {
    // Non-fatal offline fallback
  }

  return { preference: saved, syncedBackend };
}

/**
 * Dispatches an immediate sample notification preview (Native OS banner, Web Notification when granted, or in-app banner fallback).
 */
export async function sendTestReminderNotification(
  localSendTime: string
): Promise<{ deliveredVia: "native" | "web" | "in_app"; message: string }> {
  try {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {}

  if (Platform.OS !== "web") {
    initNotificationHandler();
    try {
      const perm = await requestReminderPermission();
      if (perm === "granted") {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Lumi nhắc nhẹ — HealthClues",
            body: `Thông báo mẫu (${localSendTime}): Đã đến giờ chăm sóc thói quen sống khỏe hôm nay!`,
            sound: true,
            data: { route: "/(game)/daily-care" },
          },
          trigger: null,
        });
        return {
          deliveredVia: "native",
          message: `Đã gửi thông báo mẫu lên thanh trạng thái thiết bị (${localSendTime}).`,
        };
      }
    } catch {}
    return {
      deliveredVia: "in_app",
      message: `Xem trước nhắc nhở (${localSendTime}): "Lumi nhắc nhẹ: Đã đến giờ điểm danh hôm nay!"`,
    };
  }

  try {
    const perm = await requestReminderPermission();
    if (perm === "granted" && typeof window !== "undefined" && "Notification" in window) {
      new window.Notification("Lumi nhắc nhẹ — HealthClues", {
        body: `Thông báo mẫu (${localSendTime}): Đã đến giờ điểm danh thói quen sống khỏe!`,
      });
      return {
        deliveredVia: "web",
        message: `Đã gửi thông báo mẫu lên trình duyệt lúc ${localSendTime}!`,
      };
    }
  } catch {}

  return {
    deliveredVia: "in_app",
    message: `Xem trước nhắc nhở (${localSendTime}): "Lumi nhắc nhẹ: Đã đến giờ điểm danh sống khỏe hôm nay!"`,
  };
}
