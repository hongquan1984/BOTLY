import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  Animated,
  Platform,
  DeviceEventEmitter,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  X,
  Compass,
  Home,
  Flower2,
  BookOpen,
  Search,
  Droplets,
  CheckCircle2,
  Music,
  Wind,
} from "lucide-react-native";
import { MascotSprout, SproutMood } from "../mascot/MascotSprout";
import { playDolphinChirp, playDolphinWhistle } from "../audio/dolphinAudio";
import { HighlightLandmarkTarget } from "@/components/game/World3DView";
import { setTourStep } from "./villageTourService";
import { useLocale } from "@/localization";

export const VILLAGE_CINEMATIC_TOUR_COMPLETED_KEY = "healthclues-village-cinematic-tour-v1";

export function isCinematicTourOpen(): boolean {
  if (typeof window !== "undefined") {
    return !!(window as any).__CINEMATIC_TOUR_ACTIVE;
  }
  return false;
}

export function setCinematicTourOpen(active: boolean) {
  if (typeof window !== "undefined") {
    (window as any).__CINEMATIC_TOUR_ACTIVE = active;
    try {
      window.dispatchEvent(new CustomEvent("healthclues-tour-active", { detail: { active } }));
    } catch {}
  }
  try {
    DeviceEventEmitter.emit("CINEMATIC_TOUR_VISIBILITY", active);
    DeviceEventEmitter.emit(active ? "VILLAGE_CINEMATIC_TOUR_START" : "VILLAGE_CINEMATIC_TOUR_DONE");
  } catch {}
}

export interface TourStop {
  id: string;
  badgeVi: string;
  badgeEn?: string;
  badgeIcon: any;
  titleVi: string;
  titleEn?: string;
  dialogueVi: string;
  dialogueEn?: string;
  highlightLandmark: HighlightLandmarkTarget | null;
  cameraView: "overview" | "close";
  lumiMood: SproutMood;
}

export const VILLAGE_TOUR_STOPS: TourStop[] = [
  {
    id: "village_overview",
    badgeVi: "TOÀN CẢNH LÀNG MÂY",
    badgeEn: "CLOUD VILLAGE PANORAMA",
    badgeIcon: Compass,
    titleVi: "Chào mừng đến Xứ Sở Sức Khỏe!",
    titleEn: "Welcome to the Wellness Realm!",
    dialogueVi:
      "Làng Mây lơ lửng giữa những tầng trời này là nơi Nhà Tiên Tri đã dặn mình đón bạn! Toàn cảnh ngôi làng thật thanh bình đúng không? Hãy cùng mình dạo một vòng ngắm nhìn những ngôi nhà đặc biệt nơi đây nhé!",
    dialogueEn:
      "This Cloud Village floating among the skies is where the Oracle asked me to welcome you! The village is so peaceful, isn't it? Let's take a stroll together to explore each magical house here!",
    highlightLandmark: null,
    cameraView: "overview",
    lumiMood: "wave",
  },
  {
    id: "herbal_house",
    badgeVi: "NHÀ THẢO MỘC",
    badgeEn: "HERBAL HOUSE",
    badgeIcon: Flower2,
    titleVi: "Dược Liệu & Trà Tự Nhiên (Tiên Nữ Flora)",
    titleEn: "Natural Herbs & Tea Rituals (Fairy Flora)",
    dialogueVi:
      "Ngôi nhà ngát hương hoa kia là Nhà Thảo Mộc — nơi Tiên Nữ Flora lưu giữ các loại thảo dược Cúc La Mã, Lạc Tiên, Dây Thìa Canh và các công thức hãm trà chữa lành chuẩn y khoa.",
    dialogueEn:
      "That fragrant pavilion is the Herbal House — where Fairy Flora safeguards Chamomile, Passionflower, Gymnema, and evidence-based therapeutic tea formulas.",
    highlightLandmark: {
      buildingInstanceId: "bld_potion_shop",
      landmarkId: "herbal_garden",
      actionId: "OPEN_HERBAL_GARDEN",
      focusCamera: false,
    },
    cameraView: "overview",
    lumiMood: "talk",
  },
  {
    id: "sound_garden",
    badgeVi: "VƯỜN ÂM THANH",
    badgeEn: "SOUND GARDEN",
    badgeIcon: Music,
    titleVi: "Thanh Âm Thiên Nhiên & Sóng Não (Tiên Nữ Lyra)",
    titleEn: "Nature Sounds & Brainwaves (Fairy Lyra)",
    dialogueVi:
      "Bên bờ suối mát rượi là Vườn Âm Thanh của Tiên Nữ Lyra — nơi bạn lắng nghe tiếng mưa rào, chim rừng thông và tần số sóng não Delta 432Hz ru ngủ sâu, xua tan mọi âu lo.",
    dialogueEn:
      "By the crisp mountain stream is Fairy Lyra's Sound Garden — where gentle rain, pine forest birds, and 432Hz Delta brainwave frequencies soothe anxiety into deep sleep.",
    highlightLandmark: {
      buildingInstanceId: "bld_watermill",
      landmarkId: "sound_garden",
      actionId: "OPEN_SOUND_GARDEN",
      focusCamera: false,
    },
    cameraView: "overview",
    lumiMood: "talk",
  },
  {
    id: "zen_breath_sanctuary",
    badgeVi: "THIỀN ĐƯỜNG - HƠI THỞ",
    badgeEn: "ZEN BREATH PAVILION",
    badgeIcon: Wind,
    titleVi: "Kỹ Thuật Thở & Tĩnh Tâm (Tiên Nữ Aura)",
    titleEn: "Breathing Techniques & Mindfulness (Fairy Aura)",
    dialogueVi:
      "Ngôi nhà trang nghiêm kia là Thiền Đường - Hơi Thở — nơi Tiên Nữ Aura hướng dẫn bạn các bài tập thở khoa học 4-7-8, thở hộp Box Breathing và thôi miên giải tỏa muộn phiền.",
    dialogueEn:
      "That serene temple is the Zen Breath Pavilion — where Fairy Aura guides you through scientific 4-7-8 breathing, Navy SEAL Box Breathing, and hypno-relaxation.",
    highlightLandmark: {
      buildingInstanceId: "bld_great_hall",
      landmarkId: "zen_breath",
      actionId: "OPEN_ZEN_BREATH",
      focusCamera: false,
    },
    cameraView: "overview",
    lumiMood: "laugh",
  },
  {
    id: "body_science_house",
    badgeVi: "NHÀ CƠ THỂ",
    badgeEn: "BODY SCIENCE HOUSE",
    badgeIcon: BookOpen,
    titleVi: "Thư Viện Tri Thức Cơ Thể",
    titleEn: "Human Biology & Health Library",
    dialogueVi:
      "Ngôi nhà mái xanh và kính thiên văn là Nhà Cơ Thể — nơi giải mã cơ chế tim mạch, chu kỳ giấc ngủ sâu, nhịp sinh học và nguyên lý vận hành kỳ diệu của chính cơ thể bạn.",
    dialogueEn:
      "The cottage with blue roof and telescope is the Body Science House — uncovering cardiovascular mechanisms, deep sleep cycles, circadian clocks, and your body's wondrous inner workings.",
    highlightLandmark: {
      buildingInstanceId: "bld_bookshop",
      landmarkId: "knowledge_library",
      actionId: "OPEN_KNOWLEDGE_LIBRARY",
      focusCamera: false,
    },
    cameraView: "overview",
    lumiMood: "laugh",
  },
  {
    id: "detective_office",
    badgeVi: "VĂN PHÒNG GIẢI MÃ",
    badgeEn: "CLUE DETECTIVE OFFICE",
    badgeIcon: Search,
    titleVi: "Giải Mã Manh Mối Sức Khỏe",
    titleEn: "Decipher Health Mysteries",
    dialogueVi:
      "Nút [ 🔍 Giải Mã ] trên cùng dẫn tới Văn Phòng Giải Mã Manh Mối. Nơi đây tiếp nhận những Hồ Sơ Sức Khỏe từ thế giới con người để truy tìm manh mối thói quen xấu và tìm ra giải pháp cải thiện sức khỏe!",
    dialogueEn:
      "The [ 🔍 Investigate ] button up top leads to the Health Clue Detective Office. Investigate case files from the human world to spot hidden root causes and unlock healthier lifestyles!",
    highlightLandmark: {
      buildingInstanceId: "bld_watermill",
      landmarkId: "cloud_therapy",
      actionId: "OPEN_CLOUD_THERAPY",
      focusCamera: false,
    },
    cameraView: "overview",
    lumiMood: "talk",
  },
  {
    id: "plaza_well",
    badgeVi: "QUẢNG TRƯỜNG & GIẾNG ƯỚC",
    badgeEn: "VILLAGE PLAZA & WISHING WELL",
    badgeIcon: Droplets,
    titleVi: "Điểm Danh Sống Khỏe Mỗi Ngày",
    titleEn: "Daily Wellness Check-in",
    dialogueVi:
      "Giữa trung tâm làng là Quảng Trường & Giếng Ước. Mỗi ngày ghé thăm, bạn có thể uống ngụm nước trong lành, điểm danh nhịp sống để nhận năng lượng EXP, xu may mắn và gặp gỡ bạn bè!",
    dialogueEn:
      "In the center of the village lies the Plaza & Wishing Well. Visit daily for a fresh sip of spring water, log your habits for EXP and lucky coins, and greet fellow travelers!",
    highlightLandmark: {
      buildingInstanceId: "bld_plaza_well",
      landmarkId: "village_square",
      actionId: "OPEN_VILLAGE_SQUARE",
      focusCamera: false,
    },
    cameraView: "overview",
    lumiMood: "talk",
  },
  {
    id: "ready_to_explore",
    badgeVi: "SẴN SÀNG KHÁM PHÁ",
    badgeEn: "READY TO EXPLORE",
    badgeIcon: Sparkles,
    titleVi: "Bắt Đầu Hành Trình Cùng Lumi!",
    titleEn: "Begin Your Adventure with Lumi!",
    dialogueVi:
      "Ngôi làng đã mở cửa đón chào bạn! Bạn có thể chạm vào mặt đất để bước đi, hoặc chạm trực tiếp vào bất kỳ ngôi nhà nào để ghé thăm. Hãy bắt đầu hành trình ngay thôi!",
    dialogueEn:
      "The village doors are wide open! Tap the terrain to walk around, or tap directly on any house to step inside. Let's begin our cozy journey now!",
    highlightLandmark: null,
    cameraView: "close",
    lumiMood: "wave",
  },
];

interface VillageCinematicTourModalProps {
  visible: boolean;
  onFinish: () => void;
  onHighlightLandmark: (target: HighlightLandmarkTarget | null) => void;
  onCameraViewChange: (view: "overview" | "close") => void;
}

export function VillageCinematicTourModal({
  visible,
  onFinish,
  onHighlightLandmark,
  onCameraViewChange,
}: VillageCinematicTourModalProps) {
  // Keep every hook before the visibility early-return. The tour can become
  // visible after the first render; conditionally introducing this hook then
  // would violate React's hook ordering and blank the World screen.
  const { locale } = useLocale();
  const [stepIndex, setStepIndex] = useState(0);
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(width - 24, 460);

  // Floating hover animation for Lumi
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -10,
          duration: 1400,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1400,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [floatAnim]);

  // Notify other floating components (like PermanentMascotHelper) to hide while tour is active
  useEffect(() => {
    DeviceEventEmitter.emit("CINEMATIC_TOUR_VISIBILITY", visible);
    return () => {
      DeviceEventEmitter.emit("CINEMATIC_TOUR_VISIBILITY", false);
    };
  }, [visible]);

  // Synchronize stop with 3D scene whenever step changes or modal becomes visible
  useEffect(() => {
    if (!visible) return;
    const currentStop = VILLAGE_TOUR_STOPS[stepIndex];
    if (currentStop) {
      onHighlightLandmark(currentStop.highlightLandmark);
      onCameraViewChange(currentStop.cameraView);
    }
  }, [stepIndex, visible]);

  if (!visible) return null;
  
  const currentStop = VILLAGE_TOUR_STOPS[stepIndex] || VILLAGE_TOUR_STOPS[0];
  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === VILLAGE_TOUR_STOPS.length - 1;
  const BadgeIcon = currentStop.badgeIcon;
  const stopBadge = locale === "en" ? (currentStop.badgeEn || currentStop.badgeVi) : currentStop.badgeVi;
  const stopTitle = locale === "en" ? (currentStop.titleEn || currentStop.titleVi) : currentStop.titleVi;
  const stopDialogue = locale === "en" ? (currentStop.dialogueEn || currentStop.dialogueVi) : currentStop.dialogueVi;

  const handleNext = () => {
    try {
      playDolphinChirp(0.35);
    } catch {}
    if (!isLastStep) {
      setStepIndex((prev) => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    try {
      playDolphinChirp(0.25);
    } catch {}
    if (!isFirstStep) {
      setStepIndex((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    // 1. Immediately dismiss modal synchronously so UI updates instantly
    try {
      onHighlightLandmark(null);
      onCameraViewChange("close");
      onFinish();
    } catch (e) {
      console.warn("Error dismissing tour modal:", e);
    }

    // 2. Play dolphin whistle sound safely
    try {
      playDolphinWhistle(0.4);
    } catch {}

    // 3. Persist completion flag and advance tour step to journey_track so the world screen is 100% clean
    try {
      AsyncStorage.setItem(VILLAGE_CINEMATIC_TOUR_COMPLETED_KEY, "true").catch(() => {});
      setTourStep("journey_track");
      DeviceEventEmitter.emit("VILLAGE_CINEMATIC_TOUR_DONE");
    } catch (e) {
      console.warn("Failed to broadcast tour completion:", e);
    }
  };

  return (
    <View style={styles.cinematicOverlay} pointerEvents="box-none">
      {/* Floating Compact Dialogue HUD at Top Sky Area */}
      <View style={[styles.topContainer, { width: cardWidth }]} pointerEvents="box-none">
        {/* Lumi Mascot floating over card */}
        <Animated.View
          style={[
            styles.floatingMascotWrapper,
            {
              transform: [{ translateY: floatAnim }],
            },
          ]}
        >
          <View style={styles.mascotGlowHalo} />
          <MascotSprout
            mood={currentStop.lumiMood}
            size={36}
            showBubbleHint={false}
            accessibilityLabel="Linh vật Lumi bay lơ lửng"
          />
        </Animated.View>

        {/* Ultra-Compact Narrative Card */}
        <View style={styles.dialogCard} pointerEvents="auto">
          {/* Micro Top Bar: Location Tag + Progress Dots + Skip */}
          <View style={styles.cardHeader}>
            <View style={styles.locationBadgeRow}>
              <View style={styles.locationBadgeIconWrapper}>
                <BadgeIcon size={11} color="#34d399" />
              </View>
              <Text style={styles.locationBadgeText}>{stopBadge}</Text>
            </View>

            {/* Compact Progress Segments */}
            <View style={styles.progressBarRow}>
              {VILLAGE_TOUR_STOPS.map((stop, idx) => (
                <View
                  key={stop.id}
                  style={[
                    styles.progressSegment,
                    idx === stepIndex && styles.progressSegmentActive,
                    idx < stepIndex && styles.progressSegmentDone,
                  ]}
                />
              ))}
            </View>

            <TouchableOpacity
              onPress={handleSkip}
              {...(Platform.OS === "web" ? ({ onClick: handleSkip } as any) : {})}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.skipButton}
              accessibilityRole="button"
              accessibilityLabel={locale === "en" ? "Skip tour" : "Bỏ qua hướng dẫn"}
            >
              <Text style={styles.skipButtonText}>{locale === "en" ? "Skip" : "Bỏ qua"}</Text>
              <X size={10} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {/* Stop Title & Dialogue */}
          <Text style={styles.stopTitle} numberOfLines={1}>{stopTitle}</Text>
          <Text style={styles.dialogueText} numberOfLines={3}>{stopDialogue}</Text>

          {/* Special Glowing Clue Banner for Detective Stop */}
          {currentStop.id === "detective_office" && (
            <TouchableOpacity
              style={[
                styles.detectiveNoticeBanner,
                Platform.OS === "web" ? ({ cursor: "pointer", userSelect: "none" } as any) : null,
              ]}
              activeOpacity={0.75}
              onPress={() => {
                try {
                  DeviceEventEmitter.emit("OPEN_DETECTIVE_GAME_MODAL");
                } catch {}
              }}
              accessibilityRole="button"
              accessibilityLabel={locale === "en" ? "Open Clue Detective Office" : "Mở Văn Phòng Giải Mã Manh Mối"}
            >
              <Search size={12} color="#38bdf8" />
              <Text style={styles.detectiveNoticeText} numberOfLines={1}>
                🔍 <Text style={{ color: "#38bdf8", fontWeight: "900" }}>{locale === "en" ? "[ Tap here to Open Detective ]" : "[ Chạm vào đây để Mở Giải Mã ]"}</Text> {locale === "en" ? "or use the top button!" : "hoặc nút góc trên!"}
              </Text>
              <Sparkles size={11} color="#38bdf8" />
            </TouchableOpacity>
          )}

          {/* Compact Footer Controls */}
          <View style={styles.cardFooter}>
            <View style={styles.stepCounterWrapper}>
              <Text style={styles.stepCounterText}>
                {stepIndex + 1} / {VILLAGE_TOUR_STOPS.length}
              </Text>
            </View>

            <View style={styles.buttonActionRow}>
              {!isFirstStep && (
                <TouchableOpacity
                  onPress={handlePrev}
                  {...(Platform.OS === "web" ? ({ onClick: handlePrev } as any) : {})}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={[styles.backButton, Platform.OS === "web" ? ({ cursor: "pointer", userSelect: "none" } as any) : null]}
                  accessibilityRole="button"
                  accessibilityLabel={locale === "en" ? "Previous step" : "Quay lại bước trước"}
                >
                  <ArrowLeft size={11} color="#94a3b8" />
                  <Text style={styles.backButtonText}>{locale === "en" ? "Back" : "Quay lại"}</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={handleNext}
                {...(Platform.OS === "web" ? ({ onClick: handleNext } as any) : {})}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={[
                  styles.nextButton,
                  isLastStep && styles.finishButton,
                  Platform.OS === "web" ? ({ cursor: "pointer", userSelect: "none" } as any) : null,
                ]}
                accessibilityRole="button"
                accessibilityLabel={isLastStep ? (locale === "en" ? "Start Exploring" : "Bắt đầu khám phá") : (locale === "en" ? "Continue" : "Tiếp tục")}
              >
                <Text style={styles.nextButtonText}>
                  {isLastStep ? (locale === "en" ? "Start Exploring" : "Bắt đầu khám phá") : (locale === "en" ? "Continue" : "Tiếp tục")}
                </Text>
                {isLastStep ? (
                  <Sparkles size={11} color="#061814" />
                ) : (
                  <ArrowRight size={11} color="#061814" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cinematicOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    justifyContent: "flex-start",
    alignItems: "center",
  },
  topContainer: {
    marginTop: Platform.OS === "web" ? 52 : Platform.OS === "ios" ? 58 : 54,
    paddingHorizontal: 8,
    alignItems: "center",
  },
  detectiveNoticeBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(14, 165, 233, 0.16)",
    borderColor: "#38bdf8",
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 7,
    marginBottom: 4,
  },
  detectiveNoticeText: {
    fontSize: 10,
    color: "#e0f2fe",
    fontWeight: "700",
    flex: 1,
    lineHeight: 13,
  },
  floatingMascotWrapper: {
    position: "absolute",
    top: -12,
    left: 8,
    zIndex: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  mascotGlowHalo: {
    position: "absolute",
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(52, 211, 153, 0.28)",
    transform: [{ scale: 1.1 }],
  },
  dialogCard: {
    backgroundColor: "rgba(10, 24, 21, 0.95)",
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: "rgba(52, 211, 153, 0.45)",
    paddingTop: 6,
    paddingBottom: 7,
    paddingHorizontal: 11,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 8,
    backdropFilter: "blur(12px)",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingLeft: 34, // Space for compact floating Lumi
    marginBottom: 3,
    gap: 6,
  },
  progressBarRow: {
    flex: 1,
    flexDirection: "row",
    gap: 2.5,
    marginHorizontal: 4,
  },
  progressSegment: {
    flex: 1,
    height: 2.5,
    borderRadius: 1.5,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
  progressSegmentActive: {
    backgroundColor: "#34d399",
  },
  progressSegmentDone: {
    backgroundColor: "rgba(52, 211, 153, 0.6)",
  },
  skipButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingVertical: 1.5,
    paddingHorizontal: 4,
    borderRadius: 5,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  skipButtonText: {
    fontSize: 9.5,
    color: "#94a3b8",
    fontWeight: "600",
  },
  locationBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  locationBadgeIconWrapper: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "rgba(52, 211, 153, 0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  locationBadgeText: {
    fontSize: 9.5,
    fontWeight: "800",
    color: "#6ee7b7",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  stopTitle: {
    fontSize: 12.5,
    fontWeight: "800",
    color: "#ffffff",
    marginBottom: 2,
    letterSpacing: 0.1,
  },
  dialogueText: {
    fontSize: 11,
    lineHeight: 15,
    color: "#cbd5e1",
    marginBottom: 4,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
    paddingTop: 4,
  },
  stepCounterWrapper: {
    paddingHorizontal: 2,
  },
  stepCounterText: {
    fontSize: 9.5,
    fontWeight: "700",
    color: "#64748b",
  },
  buttonActionRow: {
    flexDirection: "row",
    gap: 5,
    alignItems: "center",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingVertical: 3.5,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  backButtonText: {
    fontSize: 10.5,
    fontWeight: "600",
    color: "#cbd5e1",
  },
  nextButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 3.5,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: "#34d399",
    shadowColor: "#34d399",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 3,
  },
  finishButton: {
    backgroundColor: "#fbbf24",
    shadowColor: "#fbbf24",
  },
  nextButtonText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#061814",
    letterSpacing: 0.15,
  },
});
