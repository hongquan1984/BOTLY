import React, { useCallback, useEffect, useState } from "react";
import { Tabs, useRouter } from "expo-router";
import {
  View,
  StyleSheet,
  Platform,
  ActivityIndicator,
  useWindowDimensions,
  DeviceEventEmitter,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { fetchMobileProgress } from "@/services/healthclues";
import { getStoredSession } from "@/services/api";
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
import {
  initVillageTour,
  getCurrentTourStep,
  setTourStep,
  completeVillageTour,
  TOUR_CHANGE_EVENT,
  VillageTourStep,
  getHighlightedTab,
} from "@/modules/tour/villageTourService";
import { InteractiveTourCard } from "@/modules/tour/InteractiveTourCard";
import {
  VILLAGE_CINEMATIC_TOUR_COMPLETED_KEY,
  isCinematicTourOpen,
} from "@/modules/tour/VillageCinematicTourModal";
import { PermanentMascotHelper } from "@/modules/mascot/PermanentMascotHelper";
import { DetectiveWebViewModal } from "@/modules/detective/DetectiveWebViewModal";

export default function GameLayout() {
  const [, setLocaleTick] = useState(0);
  const strings = t();
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [checkingQuiz, setCheckingQuiz] = useState(true);
  const [pendingCheckin, setPendingCheckin] = useState(true);
  const [tourStep, setTourStepState] = useState<VillageTourStep>(null);
  const [cinematicTourDone, setCinematicTourDone] = useState(false);
  const [isCinematicTourActive, setIsCinematicTourActive] = useState(false);
  const [showDetectiveModal, setShowDetectiveModal] = useState(false);

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
    fetchMobileProgress()
      .then((progress) => setPendingCheckin(!progress.todayCheckin?.submitted || progress.todayCheckin.localDate !== today))
      .catch(() => setPendingCheckin(true));
  }, []);

  useEffect(() => {
    let isMounted = true;
    Promise.all([AsyncStorage.getItem("healthclues-onboarding-completed"), getStoredSession()])
      .then(([completed, session]) => {
        if (!isMounted) return;
        if (completed !== "true") {
          router.replace("/(onboarding)/quiz");
        } else if (!session?.access_token) {
          router.replace("/(auth)/login");
        } else {
          setCheckingQuiz(false);
        }
      })
      .catch(() => {
        if (isMounted) setCheckingQuiz(false);
      });

    refreshPendingCheckin();
    initVillageTour().then((step) => {
      if (isMounted) setTourStepState(step);
    });

    AsyncStorage.getItem(VILLAGE_CINEMATIC_TOUR_COMPLETED_KEY).then((done) => {
      if (isMounted) {
        setCinematicTourDone(done === "true");
        if (done !== "true") {
          setIsCinematicTourActive(true);
        }
      }
    });
    const cinematicStartSub = DeviceEventEmitter.addListener("VILLAGE_CINEMATIC_TOUR_START", () => {
      if (isMounted) setIsCinematicTourActive(true);
    });
    const cinematicSub = DeviceEventEmitter.addListener("VILLAGE_CINEMATIC_TOUR_DONE", () => {
      if (isMounted) {
        setIsCinematicTourActive(false);
        setCinematicTourDone(true);
      }
    });
    const cinematicVisSub = DeviceEventEmitter.addListener("CINEMATIC_TOUR_VISIBILITY", (visible: boolean) => {
      if (isMounted) {
        setIsCinematicTourActive(!!visible);
        if (!visible) {
          setCinematicTourDone(true);
        }
      }
    });

    const handleWebTourActive = (e: any) => {
      if (isMounted) {
        const active = !!(e?.detail?.active);
        setIsCinematicTourActive(active);
        if (!active) setCinematicTourDone(true);
      }
    };
    if (typeof window !== "undefined") {
      window.addEventListener("healthclues-tour-active", handleWebTourActive);
    }

    const worldSub = DeviceEventEmitter.addListener(WORLD_STATE_EVENT, refreshPendingCheckin);
    const localeSub = DeviceEventEmitter.addListener(LOCALE_CHANGE_EVENT, () => {
      setLocaleTick((n) => n + 1);
    });
    const tourSub = DeviceEventEmitter.addListener(TOUR_CHANGE_EVENT, (step) => {
      if (isMounted) setTourStepState(step);
    });

    return () => {
      isMounted = false;
      if (typeof window !== "undefined") {
        window.removeEventListener("healthclues-tour-active", handleWebTourActive);
      }
      cinematicStartSub.remove();
      cinematicSub.remove();
      cinematicVisSub.remove();
      worldSub.remove();
      localeSub.remove();
      tourSub.remove();
    };
  }, [router, refreshPendingCheckin]);

  if (checkingQuiz) {
    return (
      <View style={{ flex: 1, backgroundColor: "#061814", alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={colors.emeraldLight} />
      </View>
    );
  }

  const isTourActiveGlobal = isCinematicTourActive || isCinematicTourOpen();
  const highlightedTab = !isTourActiveGlobal && cinematicTourDone ? getHighlightedTab(tourStep) : null;

  return (
    <View style={styles.rootContainer}>
      <Tabs
        screenListeners={{
          tabPress: (e) => {
            void playSfx("tab");
            const target = e.target?.split("-")[0];
            if (tourStep === "welcome" && target === "journey") {
              setTourStep("journey_track");
            } else if ((tourStep === "journey_to_daily" || tourStep === "journey") && (target === "daily" || target === "daily-care")) {
              setTourStep("daily_checkin");
            } else if ((tourStep === "daily_to_home" || tourStep === "daily_care") && target === "home") {
              setTourStep("home_gift");
            }
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
          tabBarItemStyle: styles.tabBarItemBase,
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
            tabBarItemStyle: [
              styles.tabBarItemBase,
              highlightedTab === "home" && styles.highlightedTabItem,
            ],
            tabBarBadge: highlightedTab === "home" ? "✨" : undefined,
            tabBarBadgeStyle: highlightedTab === "home" ? styles.highlightedBadge : undefined,
            tabBarIcon: ({ color }) => (
              <Home size={iconSize} color={highlightedTab === "home" ? "#fbbf24" : color} />
            ),
          }}
        />
        <Tabs.Screen
          name="journey"
          options={{
            title: strings.nav.journey,
            tabBarItemStyle: [
              styles.tabBarItemBase,
              highlightedTab === "journey" && styles.highlightedTabItem,
            ],
            tabBarBadge: highlightedTab === "journey" ? "✨" : undefined,
            tabBarBadgeStyle: highlightedTab === "journey" ? styles.highlightedBadge : undefined,
            tabBarIcon: ({ color }) => (
              <Scroll size={iconSize} color={highlightedTab === "journey" ? "#fbbf24" : color} />
            ),
          }}
        />
        <Tabs.Screen
          name="daily-care"
          options={{
            title: strings.nav.dailyCare,
            tabBarItemStyle: [
              styles.tabBarItemBase,
              highlightedTab === "daily-care" && styles.highlightedTabItem,
            ],
            tabBarBadge: highlightedTab === "daily-care" ? "✨" : pendingCheckin ? 1 : undefined,
            tabBarBadgeStyle: highlightedTab === "daily-care" ? styles.highlightedBadge : {
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
              <CheckCircle2 size={iconSize} color={highlightedTab === "daily-care" ? "#fbbf24" : color} />
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

      {/* Linh vật icon ghim cố định góc dưới bên trái - CHỈ HIỂN THỊ KHI TOUR ĐÃ HOÀN THÀNH VÀ TOUR KHÔNG ĐANG CHẠY */}
      {!tourStep && cinematicTourDone && !isTourActiveGlobal && (
        <PermanentMascotHelper
          onOpenDetective={() => setShowDetectiveModal(true)}
        />
      )}

      {/* Cửa sổ hướng dẫn từng bước của Mầm Nhỏ (Interactive Spotlight Tour) - chỉ hiển thị sau khi hoàn thành Cinematic Village Tour và Cinematic Tour không đang mở */}
      {tourStep && cinematicTourDone && !isTourActiveGlobal && (
        <InteractiveTourCard
          currentStep={tourStep}
          onOpenDetective={() => setShowDetectiveModal(true)}
        />
      )}

      {/* Game Phá Án Thám Tử Cơ Thể qua WebView / Iframe */}
      <DetectiveWebViewModal
        visible={showDetectiveModal}
        onClose={() => {
          setShowDetectiveModal(false);
          if (tourStep === "detective_modal" || tourStep === "detective" || tourStep === "world_detective_lore") {
            void completeVillageTour();
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    position: "relative",
  },
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
  tabBarItemBase: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    minWidth: 0,
    justifyContent: "center",
  },
  highlightedTabItem: {
    backgroundColor: "rgba(245, 158, 11, 0.16)",
    borderTopWidth: 2.5,
    borderTopColor: "#fbbf24",
    borderBottomWidth: 1.5,
    borderBottomColor: "#fbbf24",
    borderRadius: 8,
    shadowColor: "#f59e0b",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
  },
  highlightedBadge: {
    backgroundColor: "rgba(245, 158, 11, 0.95)",
    color: "#042f2e",
    fontSize: 10,
    fontWeight: "900",
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    lineHeight: 15,
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
});
