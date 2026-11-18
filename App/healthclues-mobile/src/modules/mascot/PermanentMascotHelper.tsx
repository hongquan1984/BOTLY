import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  Platform,
  useWindowDimensions,
  DeviceEventEmitter,
} from "react-native";
import { Image } from "expo-image";
import { usePathname, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";
import {
  Compass,
  Scroll,
  CheckCircle2,
  Home,
  Search,
  Sparkles,
  HeartPulse,
  RotateCcw,
  X,
  ArrowRight,
  HelpCircle,
  ShoppingBag,
} from "lucide-react-native";
import { MASCOT_SPRITES, SproutMood } from "./MascotSprout";
import { playDolphinChirp, playDolphinGiggle } from "../audio/dolphinAudio";
import { startVillageTour } from "../tour/villageTourService";
import { isCinematicTourOpen } from "../tour/VillageCinematicTourModal";
import { IntroStoryPlayer } from "../story/IntroStoryPlayer";
import { t, useLocale } from "@/localization";

interface PermanentMascotHelperProps {
  onOpenDetective?: () => void;
  onOpenHomeShop?: () => void;
}

export function PermanentMascotHelper({
  onOpenDetective,
  onOpenHomeShop,
}: PermanentMascotHelperProps) {
  const { locale } = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [modalVisible, setModalVisible] = useState(false);
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [mood, setMood] = useState<SproutMood>("talk");
  const [userConcernText, setUserConcernText] = useState("Chăm sóc sức khỏe tổng quát");
  const [isTourActive, setIsTourActive] = useState(() => isCinematicTourOpen());

  useEffect(() => {
    const handleVis = (e: any) => {
      setIsTourActive(e?.detail?.active ?? true);
    };
    if (typeof window !== "undefined") {
      window.addEventListener("healthclues-tour-active", handleVis);
    }
    const sub = DeviceEventEmitter.addListener("CINEMATIC_TOUR_VISIBILITY", (visible: boolean) => {
      setIsTourActive(!!visible);
    });
    const startSub = DeviceEventEmitter.addListener("VILLAGE_CINEMATIC_TOUR_START", () => {
      setIsTourActive(true);
    });
    const doneSub = DeviceEventEmitter.addListener("VILLAGE_CINEMATIC_TOUR_DONE", () => {
      setIsTourActive(false);
    });
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("healthclues-tour-active", handleVis);
      }
      sub.remove();
      startSub.remove();
      doneSub.remove();
    };
  }, []);

  // Animation thở phập phồng nhẹ cho icon góc dưới
  const breathe = useSharedValue(1);
  const floatY = useSharedValue(0);

  useEffect(() => {
    breathe.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.95, { duration: 1200, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    floatY.value = withRepeat(
      withSequence(
        withTiming(-4, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, [breathe, floatY]);

  // Đọc thông tin cá nhân của người chơi
  useEffect(() => {
    AsyncStorage.getItem("healthclues-starter-profile").then((raw) => {
      if (raw) {
        try {
          const data = JSON.parse(raw);
          const p = data.profile;
          if (p?.concernNote && p.concernNote.trim().length > 0) {
            setUserConcernText(p.concernNote.trim());
          } else if (p?.primaryConcernId) {
            const map: Record<string, string> = {
              sleep: "Cải thiện giấc ngủ & phục hồi",
              weight: "Quản lý cân nặng & vóc dáng",
              stress: "Giảm căng thẳng & thư giãn tinh thần",
              gout: "Cân bằng Axit Uric & Gút",
              blood_pressure: "Huyết áp ổn định & tim mạch",
              digestion: "Hệ tiêu hóa khỏe mạnh",
              migraine: "Giảm đau đầu & cân bằng",
              general: "Sức khỏe toàn diện mỗi ngày",
            };
            setUserConcernText(map[p.primaryConcernId] || "Chăm sóc sức khỏe");
          }
        } catch {}
      }
    });
  }, [modalVisible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breathe.value }, { translateY: floatY.value }],
  }));

  const handleOpen = () => {
    playDolphinGiggle(0.35);
    setMood("laugh");
    setModalVisible(true);
  };

  const handleClose = () => {
    playDolphinChirp(0.3);
    setModalVisible(false);
    setMood("talk");
  };

  const handleRestartTour = () => {
    handleClose();
    // Chuyển về màn hình làng và bắt đầu lại tour
    router.replace("/(game)/world");
    setTimeout(() => {
      startVillageTour();
    }, 250);
  };

  // Xác định hướng dẫn theo màn hình hiện tại
  const getCurrentScreenGuide = () => {
    if (pathname.includes("world")) {
      return {
        title: locale === "en" ? "3D Wellness Realm" : "Xứ Sở Sức Khỏe 3D",
        icon: <Compass size={18} color="#34d399" />,
        text: locale === "en"
          ? "This is the Cloud Village floating among the skies! Tap each house to discover body wisdom, or tap 'Investigate' to decode wellness case studies with me!"
          : "Đây là ngôi làng trên mây mà Nhà Tiên Tri đã giao sứ mệnh cho chúng ta! Chạm vào từng ngôi nhà để khám phá kiến thức cơ thể, hoặc bấm 'Giải Mã' để cùng mình giải mã những câu chuyện sức khỏe từ thế giới của bạn!",
      };
    }
    if (pathname.includes("journey")) {
      return {
        title: locale === "en" ? "Your Roadmap & Commitments" : "Lộ Trình & Giao Ước Của Bạn",
        icon: <Scroll size={18} color="#38bdf8" />,
        text: locale === "en"
          ? "Where you track tailored habits for your unique wellness path. Tap ➕ to add new rituals whenever you're ready!"
          : "Nơi lưu dấu những thói quen phù hợp cho hành trình của riêng bạn. Chạm ➕ để bổ sung mục tiêu mới khi bạn sẵn sàng!",
      };
    }
    if (pathname.includes("daily-care")) {
      return {
        title: locale === "en" ? "Daily Self-Care" : "Chăm Sóc Bản Thân Mỗi Ngày",
        icon: <CheckCircle2 size={18} color="#f59e0b" />,
        text: locale === "en"
          ? "Apply what you've learned to daily life. Check-in each day to earn EXP and Coins to furnish your home!"
          : "Áp dụng những điều đã học vào cuộc sống thực tế. Điểm danh mỗi ngày để nhận EXP và Xu khám phá, dần mở khóa ngôi nhà của bạn!",
      };
    }
    if (pathname.includes("home")) {
      return {
        title: locale === "en" ? "Your Private Home" : "Căn Nhà Riêng Của Bạn",
        icon: <Home size={18} color="#a78bfa" />,
        text: locale === "en"
          ? "The land and sanctuary that mirror your healthy lifestyle journey. Use coins to furnish cozy decor!"
          : "Mảnh đất và ngôi nhà lưu dấu hành trình sống khỏe. Dùng Xu khám phá để sắm sửa nội thất ấm cúng nhé!",
      };
    }
    return {
      title: locale === "en" ? "Tips from Lumi" : "Mẹo nhỏ từ Lumi",
      icon: <Sparkles size={18} color="#34d399" />,
      text: locale === "en"
        ? "Explore your biology — Care for yourself — Decode health clues — Thrive with Lumi!"
        : "Khám phá cơ thể — Chăm sóc bản thân — Giải mã câu chuyện sức khỏe — Lan tỏa kiến thức hữu ích cùng Lumi!",
    };
  };

  const currentGuide = getCurrentScreenGuide();
  const isHomeScreen = pathname === "/home" || pathname?.includes("home");
  const isWorldScreen = pathname === "/world" || pathname?.includes("world") || pathname === "/";

  if (isTourActive || isCinematicTourOpen()) return null;

  return (
    <>
      {/* Icon linh vật ghim cố định góc dưới bên trái — nâng cao lên khi ở Home & World để tránh đè dock / pills */}
      <View
        style={[
          styles.fixedContainer,
          isHomeScreen && styles.fixedContainerHome,
          isWorldScreen && styles.fixedContainerWorld,
        ]}
        pointerEvents="box-none"
      >
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleOpen}
          accessibilityRole="button"
          accessibilityLabel="Trợ lý Lumi hướng dẫn"
          style={[
            styles.mascotButton,
            Platform.OS === "web" ? ({ outlineStyle: "none", outline: "none" } as any) : null,
          ]}
        >
          {/* Vòng aura phát sáng */}
          <View style={styles.glowAura} />

          <Animated.View style={animatedStyle}>
            <Image
              source={MASCOT_SPRITES.talk}
              style={styles.mascotAvatar}
              contentFit="contain"
            />
          </Animated.View>

          {/* Mini pill badge */}
          <View style={styles.badgePill}>
            <Text style={styles.badgeText}>Lumi 🌱</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Modal hướng dẫn khi bấm vào Mầm Nhỏ */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleClose}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.dialogCard, { maxWidth: Math.min(width - 28, 440) }]}>
            {/* Header */}
            <View style={styles.dialogHeader}>
              <View style={styles.headerLeft}>
                <Image
                  source={MASCOT_SPRITES[mood]}
                  style={styles.dialogMascot}
                  contentFit="contain"
                />
                <View>
                  <Text style={styles.headerTitle}>{locale === "en" ? "Companion Lumi" : "Lumi Đồng Hành"}</Text>
                  <Text style={styles.headerSubtitle}>{locale === "en" ? "Wellness Realm Mascot" : "Linh vật Xứ Sở Sức Khỏe"}</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={handleClose}
                accessibilityRole="button"
                accessibilityLabel={locale === "en" ? "Close help" : "Đóng trợ giúp"}
                style={styles.closeBtn}
              >
                <X size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollBody}>
              {/* Lời chào & Nhắc nhở cá nhân hóa */}
              <View style={styles.infoBox}>
                <View style={styles.infoBoxHeader}>
                  <HeartPulse size={16} color="#34d399" />
                  <Text style={styles.infoBoxTitle}>{locale === "en" ? "Your Wellness Focus" : "Mục tiêu của bạn"}</Text>
                </View>
                <Text style={styles.infoBoxBody}>
                  {userConcernText}
                </Text>
                <Text style={styles.infoBoxTip}>
                  {locale === "en"
                    ? "💡 I have saved your focus to help you discover your body and nurture daily habits!"
                    : "💡 Mình đã lưu lại thông tin này để cùng bạn khám phá cơ thể và chăm sóc bản thân tốt nhất!"}
                </Text>
              </View>

              {/* Hướng dẫn màn hình hiện tại */}
              <View style={styles.guideCard}>
                <View style={styles.guideHeader}>
                  {currentGuide.icon}
                  <Text style={styles.guideTitle}>{currentGuide.title}</Text>
                </View>
                <Text style={styles.guideText}>{currentGuide.text}</Text>
              </View>

              {/* Các lối tắt tính năng quan trọng */}
              <Text style={styles.sectionHeader}>{locale === "en" ? "Explore the Realm with Lumi" : "Khám phá Xứ Sở cùng Lumi"}</Text>

              {/* Thám tử phá án */}
              <TouchableOpacity
                style={styles.actionRow}
                onPress={() => {
                  handleClose();
                  onOpenDetective?.();
                }}
              >
                <View style={[styles.actionIcon, { backgroundColor: "rgba(239, 68, 68, 0.15)" }]}>
                  <Search size={18} color="#f87171" />
                </View>
                <View style={styles.actionMeta}>
                  <Text style={styles.actionTitle}>{locale === "en" ? "Body Clue Detective Office" : "Văn Phòng Thám Tử Cơ Thể"}</Text>
                  <Text style={styles.actionDesc}>
                    {locale === "en"
                      ? "Investigate medical case files from the human world, find clues, and solve mysteries with Lumi!"
                      : "Khám phá các hồ sơ sức khỏe từ thế giới con người, tìm manh mối và giải mã bí ẩn cùng Lumi!"}
                  </Text>
                </View>
                <ArrowRight size={16} color="#64748b" />
              </TouchableOpacity>

              {/* Ngôi nhà 3D & Mua sắm */}
              <TouchableOpacity
                style={styles.actionRow}
                onPress={() => {
                  handleClose();
                  router.push("/(game)/home");
                }}
              >
                <View style={[styles.actionIcon, { backgroundColor: "rgba(245, 158, 11, 0.15)" }]}>
                  <Home size={18} color="#fbbf24" />
                </View>
                <View style={styles.actionMeta}>
                  <Text style={styles.actionTitle}>{locale === "en" ? "3D Home & Decoration" : "Ngôi Nhà 3D & Trang Trí"}</Text>
                  <Text style={styles.actionDesc}>
                    {locale === "en"
                      ? "Use earned coins to furnish cedar wood beds, comfy sofas, and warm fireplaces."
                      : "Dùng Xu kiếm được để sắm giường gỗ tuyết tùng, sofa, lò sưởi ấm cúng."}
                  </Text>
                </View>
                <ArrowRight size={16} color="#64748b" />
              </TouchableOpacity>

              {/* Xem lại đoạn phim mở đầu */}
              <TouchableOpacity
                style={styles.actionRow}
                onPress={() => {
                  handleClose();
                  setShowStoryModal(true);
                }}
              >
                <View style={[styles.actionIcon, { backgroundColor: "rgba(52, 211, 153, 0.15)" }]}>
                  <Sparkles size={18} color="#34d399" />
                </View>
                <View style={styles.actionMeta}>
                  <Text style={styles.actionTitle}>{locale === "en" ? "Replay Opening Cinematic (3 Scenes)" : "Xem Lại Đoạn Phim Mở Đầu (3 Cảnh)"}</Text>
                  <Text style={styles.actionDesc}>
                    {locale === "en"
                      ? "The Mystical Gate, meeting Lumi, and the panoramic Wellness Realm."
                      : "Cánh Cổng Bí Ẩn, gặp gỡ Lumi và toàn cảnh Xứ Sở Sức Khỏe."}
                  </Text>
                </View>
                <ArrowRight size={16} color="#64748b" />
              </TouchableOpacity>

              {/* Nút Chạy Lại Tour Hướng Dẫn Từng Bước */}
              <TouchableOpacity
                style={styles.restartBtn}
                onPress={handleRestartTour}
              >
                <RotateCcw size={16} color="#34d399" />
                <Text style={styles.restartText}>{locale === "en" ? "Restart Step-by-Step Village Tour" : "Bật lại hướng dẫn từng bước của làng"}</Text>
              </TouchableOpacity>
            </ScrollView>

            <View style={styles.dialogFooter}>
              <TouchableOpacity style={styles.primaryBtn} onPress={handleClose}>
                <Text style={styles.primaryBtnText}>{locale === "en" ? "Understood, thank you Lumi!" : "Đã hiểu, cảm ơn Lumi!"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Xem Lại Cốt Truyện 3 Video */}
      <Modal
        visible={showStoryModal}
        animationType="fade"
        transparent={false}
        onRequestClose={() => setShowStoryModal(false)}
      >
        <IntroStoryPlayer
          onFinish={() => setShowStoryModal(false)}
          onSkip={() => setShowStoryModal(false)}
        />
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fixedContainer: {
    position: "absolute",
    bottom: 74,
    left: 14,
    zIndex: 999,
  },
  fixedContainerHome: {
    bottom: 125,
    left: 14,
  },
  fixedContainerWorld: {
    bottom: 110,
    left: 14,
  },
  mascotButton: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "rgba(6, 26, 21, 0.92)",
    borderWidth: 2,
    borderColor: "rgba(52, 211, 153, 0.7)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 8,
  },
  glowAura: {
    position: "absolute",
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "rgba(52, 211, 153, 0.18)",
  },
  mascotAvatar: {
    width: 50,
    height: 50,
  },
  badgePill: {
    position: "absolute",
    bottom: -6,
    backgroundColor: "#059669",
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#a7f3d0",
  },
  badgeText: {
    fontSize: 8.5,
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: -0.2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(3, 10, 8, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 14,
  },
  dialogCard: {
    width: "100%",
    maxHeight: "85%",
    backgroundColor: "#061a15",
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: "rgba(52, 211, 153, 0.5)",
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 18,
    elevation: 12,
    overflow: "hidden",
  },
  dialogHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(52, 211, 153, 0.2)",
    backgroundColor: "rgba(10, 38, 30, 0.95)",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  dialogMascot: {
    width: 44,
    height: 44,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#ecfdf5",
  },
  headerSubtitle: {
    fontSize: 11.5,
    color: "#6ee7b7",
    fontWeight: "500",
  },
  closeBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  scrollBody: {
    padding: 16,
  },
  infoBox: {
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(52, 211, 153, 0.35)",
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
  },
  infoBoxHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  infoBoxTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6ee7b7",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoBoxBody: {
    fontSize: 14,
    fontWeight: "700",
    color: "#f8fafc",
    marginBottom: 6,
  },
  infoBoxTip: {
    fontSize: 12,
    color: "#cbd5e1",
    lineHeight: 17,
  },
  guideCard: {
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.2)",
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
  },
  guideHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  guideTitle: {
    fontSize: 13.5,
    fontWeight: "700",
    color: "#f1f5f9",
  },
  guideText: {
    fontSize: 12.5,
    color: "#94a3b8",
    lineHeight: 18,
  },
  sectionHeader: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 10,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    gap: 10,
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  actionMeta: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#f1f5f9",
    marginBottom: 2,
  },
  actionDesc: {
    fontSize: 11,
    color: "#94a3b8",
    lineHeight: 15,
  },
  restartBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    marginTop: 6,
    marginBottom: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(52, 211, 153, 0.5)",
    borderRadius: 12,
    backgroundColor: "rgba(52, 211, 153, 0.05)",
  },
  restartText: {
    fontSize: 12.5,
    fontWeight: "600",
    color: "#34d399",
  },
  dialogFooter: {
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(52, 211, 153, 0.15)",
    backgroundColor: "rgba(10, 38, 30, 0.95)",
  },
  primaryBtn: {
    backgroundColor: "#059669",
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ffffff",
  },
});
