import { DeviceEventEmitter, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { vi } from "./vi";
import { en } from "./en";

export type Locale = "vi" | "en";
export type Translation = typeof vi;
export const LOCALE_CHANGE_EVENT = "healthclues-locale-changed";
export const STORAGE_LOCALE_KEY = "@healthclues_locale";

export const translations: Record<Locale, Translation> = {
  vi,
  en,
};

let currentLocale: Locale = "vi";

// Initialize locale synchronously if on web localStorage, or trigger async load
if (typeof window !== "undefined" && window.localStorage) {
  try {
    const saved = window.localStorage.getItem(STORAGE_LOCALE_KEY) || window.localStorage.getItem("healthclues_locale");
    if (saved === "en" || saved === "vi") {
      currentLocale = saved;
    }
  } catch {}
}

AsyncStorage.getItem(STORAGE_LOCALE_KEY).then((val) => {
  if (val === "en" || val === "vi") {
    if (currentLocale !== val) {
      currentLocale = val;
      DeviceEventEmitter.emit(LOCALE_CHANGE_EVENT, val);
    }
  }
}).catch(() => {});

export function setLocale(locale: Locale) {
  currentLocale = locale;
  try {
    void AsyncStorage.setItem(STORAGE_LOCALE_KEY, locale);
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(STORAGE_LOCALE_KEY, locale);
      window.dispatchEvent(new CustomEvent("healthclues-locale-changed", { detail: locale }));
    }
  } catch {}
  DeviceEventEmitter.emit(LOCALE_CHANGE_EVENT, locale);
}

export function getLocale(): Locale {
  return currentLocale;
}

export function t(): Translation {
  return translations[currentLocale] || vi;
}

/**
 * React hook to automatically re-render components on locale change
 */
export function useLocale(): { locale: Locale; strings: Translation } {
  const [loc, setLoc] = useState<Locale>(currentLocale);

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener(LOCALE_CHANGE_EVENT, (next: Locale) => {
      setLoc(next);
    });
    return () => sub.remove();
  }, []);

  return { locale: loc, strings: translations[loc] || vi };
}
