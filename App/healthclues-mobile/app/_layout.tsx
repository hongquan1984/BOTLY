import React, { useEffect, useState } from "react";
import { Stack, router } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { View, ActivityIndicator, StyleSheet, Platform, Text, TextInput } from "react-native";
import { useFonts } from "expo-font";
import * as Notifications from "expo-notifications";
import { colors, fonts } from "@/theme";
import { getStoredSession } from "@/services/api";
import {
  initNotificationHandler,
  loadReminderPreferences,
  syncOsNotificationSchedule,
} from "@/services/reminders";
import {
  loadAudioSettings,
  playSfx,
  unlockAndStartBgm,
} from "@/services/gameAudio";

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const [fontsLoaded, fontError] = useFonts({
    [fonts.ui]: require("../assets/fonts/BeVietnamPro-Regular.ttf"),
    [fonts.uiMedium]: require("../assets/fonts/BeVietnamPro-Medium.ttf"),
    [fonts.uiSemiBold]: require("../assets/fonts/BeVietnamPro-SemiBold.ttf"),
    [fonts.uiBold]: require("../assets/fonts/BeVietnamPro-Bold.ttf"),
    [fonts.uiExtraBold]: require("../assets/fonts/BeVietnamPro-ExtraBold.ttf"),
    [fonts.displaySemiBold]: require("../assets/fonts/Spectral-SemiBold.ttf"),
    [fonts.displayBold]: require("../assets/fonts/Spectral-Bold.ttf"),
  });

  useEffect(() => {
    if (!fontsLoaded) return;
    const textAny = Text as unknown as { defaultProps?: { style?: unknown } };
    if (!textAny.defaultProps) textAny.defaultProps = {};
    if (!textAny.defaultProps.style) {
      textAny.defaultProps.style = { fontFamily: fonts.ui };
    }
    const inputAny = TextInput as unknown as { defaultProps?: { style?: unknown } };
    if (!inputAny.defaultProps) inputAny.defaultProps = {};
    if (!inputAny.defaultProps.style) {
      inputAny.defaultProps.style = { fontFamily: fonts.ui };
    }
  }, [fontsLoaded]);

  useEffect(() => {
    initNotificationHandler();
    void loadAudioSettings().then(() => {
      if (Platform.OS !== "web") {
        void unlockAndStartBgm();
      }
    });

    let removePointerAudio: (() => void) | null = null;
    if (Platform.OS === "web" && typeof document !== "undefined") {
      const existing = document.getElementById("hc-hide-web-scrollbars");
      const css =
        "html, body, #root { width: 100%; height: 100%; margin: 0; padding: 0; overflow: hidden !important; overscroll-behavior: none; font-family: 'BeVietnamPro-Regular', -apple-system, BlinkMacSystemFont, sans-serif; } " +
        "input, textarea, button, select { font-family: 'BeVietnamPro-Regular', -apple-system, BlinkMacSystemFont, sans-serif; } " +
        "* { scrollbar-width: none !important; -ms-overflow-style: none !important; } " +
        "*::-webkit-scrollbar { width: 0px !important; height: 0px !important; display: none !important; background: transparent !important; }";
      if (!existing) {
        const style = document.createElement("style");
        style.id = "hc-hide-web-scrollbars";
        style.textContent = css;
        document.head.appendChild(style);
      } else {
        existing.textContent = css;
      }

      const handleGlobalPointerDown = (evt: PointerEvent) => {
        void unlockAndStartBgm();
        const target = evt.target as Element | null;
        if (!target || typeof target.closest !== "function") return;
        const interactive = target.closest('[role="button"], button, a, [role="checkbox"]');
        if (!interactive) return;
        if (target.closest('[role="tab"]')) return;
        const label = interactive.getAttribute("aria-label") || "";
        if (label.startsWith("tick-quest-") || label === "hud-audio-toggle-btn") return;
        void playSfx("tap");
      };
      document.addEventListener("pointerdown", handleGlobalPointerDown, true);
      removePointerAudio = () =>
        document.removeEventListener("pointerdown", handleGlobalPointerDown, true);
    }

    let notificationSub: Notifications.EventSubscription | null = null;
    if (Platform.OS !== "web") {
      notificationSub = Notifications.addNotificationResponseReceivedListener((response) => {
        const route = response.notification.request.content.data?.route;
        if (typeof route === "string" && route.startsWith("/")) {
          router.push(route as never);
        } else {
          router.push("/(game)/daily-care");
        }
      });
    }

    // Initial check & ensure local OS reminder triggers match saved preferences
    getStoredSession().finally(() => {
      setReady(true);
      loadReminderPreferences()
        .then((pref) => syncOsNotificationSchedule(pref))
        .catch(() => {});
    });

    return () => {
      notificationSub?.remove();
      removePointerAudio?.();
    };
  }, []);

  if (!ready || (!fontsLoaded && !fontError)) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color={colors.emerald} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor={colors.background} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: "fade",
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" options={{ animation: "slide_from_bottom" }} />
        <Stack.Screen name="(game)" options={{ animation: "fade" }} />
      </Stack>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
});
