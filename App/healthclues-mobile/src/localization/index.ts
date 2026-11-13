import { DeviceEventEmitter } from "react-native";
import { vi } from "./vi";
import { en } from "./en";

export type Locale = "vi" | "en";
export type Translation = typeof vi;
export const LOCALE_CHANGE_EVENT = "healthclues-locale-changed";

export const translations: Record<Locale, Translation> = {
  vi,
  en,
};

let currentLocale: Locale = "vi";

export function setLocale(locale: Locale) {
  currentLocale = locale;
  DeviceEventEmitter.emit(LOCALE_CHANGE_EVENT, locale);
}

export function getLocale(): Locale {
  return currentLocale;
}

export function t(): Translation {
  return translations[currentLocale] || vi;
}
