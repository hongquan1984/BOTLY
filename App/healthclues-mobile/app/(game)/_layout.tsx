import React, { useCallback, useEffect, useState } from "react";
import { Tabs, useRouter } from "expo-router";
import { View, StyleSheet, Platform, ActivityIndicator, useWindowDimensions, DeviceEventEmitter } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Compass,
  Home,
  Scroll,
  CheckCircle2,
  Backpack,
  User,
} from "lucide-react-native";
import { colors, fonts } from "@/theme";
import { t, LOCALE_CHANGE_EVENT } from "@/localization";
import { WORLD_STATE_EVENT } from "@/hooks/useWorld";
import { playSfx } from "@/services/gameAudio";

export default function GameLayout() {
  const [, setLocaleTick] = useState(0);
  const strings = t();
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [checkingQuiz, setCheckingQuiz] = useState(true);
  const [pendingCheckin, setPendingCheckin] = useState(true);

  const isShortScreen = height < 520;
  const isWideCompact = isShortScreen && width >= 520;
  const iconSize = isShortScreen ? 16 : 19;
  const bottomPad = insets.bottom > 0 ? insets.bottom : isShortScreen ? 2 : 5;
  const tabBarHeight = (isShortScreen ? 42 : 60) + (insets.bottom > 0 ? insets.bottom : 0);

  const refreshPendingCheckin = useCallback(() => {
    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Ho_Chi_Minh",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
    AsyncStorage.getItem(`healthclues-checkin-${today}`).then((val) => {
      if (val) {
        try {
          const parsed = JSON.parse(val);
          setPendingCheckin(!parsed.submitted);
          return;
        } catch {}
      }
      setPendingCheckin(true);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    let isMounted = true;
    AsyncStorage.getItem("healthclues-onboarding-completed").then((completed) => {
      if (!isMounted) return;
      if (completed !== "true") {
        router.replace("/(onboarding)/quiz");
      } else {
        setCheckingQuiz(false);
      }
    }).catch(() => {
      if (isMounted) setCheckingQuiz(false);
    });

    refreshPendingCheckin();
    const worldSub = DeviceEventEmitter.addListener(WORLD_STATE_EVENT, refreshPendingCheckin);
    const localeSub = DeviceEventEmitter.addListener(LOCALE_CHANGE_EVENT, () => {
      setLocaleTick((n) => n + 1);
    });

    return () => {
      isMounted = false;
      worldSub.remove();
      localeSub.remove();
    };
  }, [router, refreshPendingCheckin]);

  if (checkingQuiz) {
    return (
      <View style={{ flex: 1, backgroundColor: "#061814", alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={colors.emeraldLight} />
      </View>
    );
  }

  return (
    <Tabs
      screenListeners={{
        tabPress: () => {
          void playSfx("tab");
        },
      }}
      screenOptions={{
        headerShown: false,
        tabBarStyle: [
          styles.tabBar,
          {
            height: tabBarHeight,
            paddingBottom: bottomPad,
            paddingTop: isShortScreen ? 2 : 3,
          },
        ],
        tabBarItemStyle: { paddingHorizontal: 0, paddingVertical: 0, minWidth: 0, justifyContent: "center" },
        tabBarIconStyle: { marginTop: 0, marginBottom: 0 },
        tabBarLabelPosition: isWideCompact ? "beside-icon" : "below-icon",
        tabBarAllowFontScaling: false,
        tabBarActiveTintColor: colors.emeraldLight,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: [
          styles.tabLabel,
          width < 390 && !isWideCompact && { fontSize: 9.8, letterSpacing: -0.38 },
          width >= 390 && !isWideCompact && { fontSize: 11, letterSpacing: -0.1 },
          isWideCompact && { fontSize: width >= 760 ? 11 : 10, marginTop: 0, marginBottom: 0, marginLeft: 3 },
        ],
      }}
    >
      <Tabs.Screen
        name="world"
        options={{
          title: strings.nav.world,
          tabBarIcon: ({ color }) => (
            <Compass size={iconSize} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="home"
        options={{
          title: strings.nav.home,
          tabBarIcon: ({ color }) => (
            <Home size={iconSize} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="journey"
        options={{
          title: strings.nav.journey,
          tabBarIcon: ({ color }) => (
            <Scroll size={iconSize} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="daily-care"
        options={{
          title: strings.nav.dailyCare,
          tabBarBadge: pendingCheckin ? 1 : undefined,
          tabBarBadgeStyle: {
            backgroundColor: "#ef4444",
            color: "#ffffff",
            fontFamily: fonts.uiExtraBold,
            fontSize: 10,
            fontWeight: "900",
            minWidth: 16,
            height: 16,
            borderRadius: 8,
            lineHeight: 15,
          },
          tabBarIcon: ({ color }) => (
            <CheckCircle2 size={iconSize} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="inventory"
        options={{
          title: strings.nav.inventory,
          tabBarBadge: 3,
          tabBarBadgeStyle: {
            backgroundColor: "rgba(245, 158, 11, 0.95)",
            color: "#042f2e",
            fontFamily: fonts.uiExtraBold,
            fontSize: 10,
            fontWeight: "900",
            minWidth: 16,
            height: 16,
            borderRadius: 8,
            lineHeight: 15,
          },
          tabBarIcon: ({ color }) => (
            <Backpack size={iconSize} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: strings.nav.profile,
          tabBarIcon: ({ color }) => (
            <User size={iconSize} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: "rgba(10, 24, 21, 0.98)",
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    elevation: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  tabLabel: {
    fontFamily: fonts.uiSemiBold,
    fontSize: 10.5,
    fontWeight: "700",
    letterSpacing: -0.25,
    lineHeight: 13,
    marginTop: 1,
    marginBottom: 0,
    ...(Platform.OS === "web" ? { whiteSpace: "nowrap" as any } : {}),
  },
  notificationPulseDot: {
    position: "absolute",
    top: -2,
    right: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ef4444",
    borderWidth: 1.5,
    borderColor: "#0a1815",
  },
});
