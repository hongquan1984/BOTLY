import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  useWindowDimensions,
  Animated,
} from "react-native";
import { Image } from "expo-image";
import { useRouter, usePathname } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Sparkles,
  ArrowRight,
  X,
  Compass,
  Scroll,
  CheckCircle2,
  Home,
  Search,
  Key,
  ChevronDown,
  ChevronUp,
} from "lucide-react-native";
import { MASCOT_SPRITES } from "../mascot/MascotSprout";
import { playDolphinChirp, playDolphinGiggle, playDolphinWhistle } from "../audio/dolphinAudio";
import {
  VillageTourStep,
  setTourStep,
  completeVillageTour,
} from "./villageTourService";
import { isCinematicTourOpen } from "./VillageCinematicTourModal";
import { addCoins } from "../economy/economyStorage";
import { useLocale } from "@/localization";

interface InteractiveTourCardProps {
  currentStep: VillageTourStep;
  onNavigateToTab?: (tab: string) => void;
  onOpenDetective?: () => void;
}

export function InteractiveTourCard({
  currentStep,
  onNavigateToTab,
  onOpenDetective,
}: InteractiveTourCardProps) {
  const { locale } = useLocale();
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const [userConcernText, setUserConcernText] = useState("Chăm sóc sức khỏe toàn diện");

  // Pulse animation for spotlight frame & indicator
  const [pulseAnim] = useState(() => new Animated.Value(1));
  const [bounceAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.06,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.98,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    const bounceLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -6,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();
    bounceLoop.start();

    return () => {
      pulseLoop.stop();
      bounceLoop.stop();
    };
  }, [pulseAnim, bounceAnim]);

  useEffect(() => {
    if (locale === "en") {
      setUserConcernText("Whole-person wellness");
      return;
    }
    AsyncStorage.getItem("healthclues-starter-profile").then((raw) => {
      if (raw) {
        try {
          const data = JSON.parse(raw);
          const p = data.profile;
          if (p?.concernNote && p.concernNote.trim().length > 0) {
            setUserConcernText(p.concernNote.trim());
          } else if (p?.primaryConcernId) {
            const map: Record<string, string> = {
              sleep: "Mất ngủ & Khó ngủ",
              weight: "Cân nặng & Vóc dáng",
              stress: "Tinh thần & Căng thẳng",
              gout: "Gút & Axit Uric",
              blood_pressure: "Huyết áp & Tim mạch",
              digestion: "Tiêu hóa & Dạ dày",
              migraine: "Đau đầu & Đau nửa đầu",
              general: "Chăm sóc sức khỏe toàn diện",
            };
            setUserConcernText(map[p.primaryConcernId] || "Chăm sóc sức khỏe");
          }
        } catch {}
      }
    });
  }, [currentStep, locale]);

  if (!currentStep || isCinematicTourOpen()) return null;

  const handleNext = () => {
    playDolphinChirp(0.35);

    if (currentStep === "welcome") {
      setTourStep("journey_track");
      router.push("/(game)/journey");
    } else if (currentStep === "journey_track") {
      setTourStep("journey_add");
    } else if (currentStep === "journey_add") {
      setTourStep("journey_to_daily");
    } else if (currentStep === "journey_to_daily" || currentStep === "journey") {
      setTourStep("daily_checkin");
      router.push("/(game)/daily-care");
    } else if (currentStep === "daily_checkin") {
      setTourStep("daily_to_home");
    } else if (currentStep === "daily_to_home" || currentStep === "daily_care") {
      setTourStep("home_gift");
      router.push("/(game)/home");
    } else if (currentStep === "home_gift") {
      setTourStep("home_chalet_lore");
    } else if (currentStep === "home_chalet_lore") {
      setTourStep("world_detective_lore");
      router.push("/(game)/world");
    } else if (currentStep === "world_detective_lore" || currentStep === "home") {
      setTourStep("detective_modal");
      onOpenDetective?.();
    } else if (currentStep === "detective_modal" || currentStep === "detective") {
      playDolphinWhistle(0.4);
      addCoins(50);
      completeVillageTour();
    }
  };

  const handleSkip = () => {
    playDolphinChirp(0.25);
    completeVillageTour();
  };

  // Determine step configuration
  const getStepConfig = () => {
    switch (currentStep) {
      case "welcome":
        return {
          stepNum: "1/6",
          title: locale === "en" ? "Welcome to Wellness Village!" : "Chào mừng đến Làng Sống Khỏe!",
          mood: "talk" as const,
          body: locale === "en"
            ? `I received your focus: "${userConcernText}". I'll be your daily wellness companion in this magical village!`
            : `Mình đã nhận được thông tin: "${userConcernText}". Mình sẽ là người bạn đồng hành cùng bạn mỗi ngày tại ngôi làng này!`,
          prompt: locale === "en"
            ? "👉 Tap the JOURNEY tab below to set your wellness compass!"
            : "👉 Hãy chạm vào tab HÀNH TRÌNH bên dưới để bắt đầu la bàn sức khỏe nhé!",
          btnText: locale === "en" ? "Go to Journey ➔" : "Đến Hành Trình ➔",
          placement: "bottom" as const,
          spotlightType: "tab_journey" as const,
        };

      case "journey_track":
        return {
          stepNum: "2/6 (a)",
          title: locale === "en" ? "7-Day Streak Tracker" : "Theo Dõi Chuỗi 7 Ngày (Streak)",
          mood: "wave" as const,
          body: locale === "en"
            ? "This is your 7-Day Journal! Each day you maintain a habit, the rune gems light up your streak, granting extra EXP and reward coins!"
            : "Đây là Nhật Ký 7 Ngày! Mỗi ngày bạn duy trì thói quen, các viên ngọc rune sẽ sáng lên tạo chuỗi liên tục (streak) giúp bạn nhận thêm nhiều EXP và Xu thưởng!",
          prompt: locale === "en"
            ? "💡 Consistent daily habits build lifelong wellness!"
            : "💡 Thói quen tích lũy đều đặn tạo nên sức khỏe bền vững!",
          btnText: locale === "en" ? "Next: Add Habits ➔" : "Tiếp Tục: Thêm Thói Quen ➔",
          placement: "top_mid" as const, // Position below 7-day tracker
          spotlightType: "journey_7days" as const,
        };

      case "journey_add":
        return {
          stepNum: "2/6 (b)",
          title: locale === "en" ? "Set Personalized Goals" : "Tự Lập Mục Tiêu Riêng",
          mood: "talk" as const,
          body: locale === "en"
            ? "Here you track daily rituals! You can set personal goals and tap '+ Add Habit' in the top right to customize your routine!"
            : "Tại đây bạn theo dõi thói quen hàng ngày! Bạn có thể tự lập mục tiêu cho mình và bấm nút '+ Thêm Mới' ở góc phải để bổ sung thói quen riêng phù hợp nhất!",
          prompt: locale === "en"
            ? "👉 Tap '+ Add Habit' or proceed to view your daily check-in board!"
            : "👉 Bạn có thể bấm nút '+ Thêm Mới' hoặc tiếp tục để xem bảng điểm danh!",
          btnText: locale === "en" ? "Next: Daily Care Board ➔" : "Tiếp Tục: Bảng Điểm Danh ➔",
          placement: "mid" as const,
          spotlightType: "journey_add_button" as const,
        };

      case "journey_to_daily":
      case "journey":
        return {
          stepNum: "3/6",
          title: locale === "en" ? "Daily Quests & Check-in" : "Nhiệm Vụ Hàng Ngày & Điểm Danh",
          mood: "wave" as const,
          body: locale === "en"
            ? "Awesome! Now tap the DAILY CARE tab to view your check-in board and claim daily rewards!"
            : "Tuyệt vời! Bây giờ hãy chạm vào tab NHIỆM VỤ để xem bảng điểm danh và nhận thưởng hàng ngày nào!",
          prompt: locale === "en"
            ? "👉 The DAILY CARE tab is glowing below, tap it now!"
            : "👉 Tab NHIỆM VỤ đang phát sáng bên dưới, hãy chạm vào nhé!",
          btnText: locale === "en" ? "Go to Daily Care ➔" : "Đến Nhiệm Vụ ➔",
          placement: "bottom" as const,
          spotlightType: "tab_daily" as const,
        };

      case "daily_checkin":
        return {
          stepNum: "3/6 (b)",
          title: locale === "en" ? "1-Tap Stamp to Earn Coins 🪙" : "1 Chạm Đóng Dấu Nhận Xu 🪙",
          mood: "laugh" as const,
          body: locale === "en"
            ? "Each day you complete habits, simply 1-tap this Wax Seal (✓) to stamp your check-in, earn EXP, and collect Gold Coins 🪙 to furnish your house!"
            : "Mỗi ngày hoàn thành thói quen, bạn chỉ cần 1 chạm vào Dấu Niêm Phong (✓) này để đóng dấu điểm danh nhận EXP và Xu Vàng (Coins 🪙) dùng mua sắm nội thất!",
          prompt: locale === "en"
            ? "💡 Daily consistency unlocks valuable rewards!"
            : "💡 Điểm danh đều đặn là chìa khóa nhận nhiều phần thưởng giá trị!",
          btnText: locale === "en" ? "Next: Claim Private House ➔" : "Tiếp Tục: Nhận Căn Nhà Riêng ➔",
          placement: "bottom" as const,
          spotlightType: "daily_seal" as const,
        };

      case "daily_to_home":
      case "daily_care":
        return {
          stepNum: "4/6",
          title: locale === "en" ? "Receive Your Home Key" : "Nhận Chìa Khóa Căn Nhà Mới",
          mood: "wave" as const,
          body: locale === "en"
            ? "As a special welcome, you are gifted a PRIVATE 3D HOUSE! Tap the HOME tab to claim your key!"
            : "Đặc biệt, bạn sẽ được TẶNG 1 CĂN NHÀ RIÊNG! Hãy chạm vào tab NGÔI NHÀ để nhận chìa khóa căn nhà của bạn nhé!",
          prompt: locale === "en"
            ? "👉 The HOME tab is glowing below, tap it!"
            : "👉 Tab NGÔI NHÀ đang phát sáng bên dưới, hãy chạm vào nhé!",
          btnText: locale === "en" ? "Go to Home ➔" : "Đến Ngôi Nhà ➔",
          placement: "bottom" as const,
          spotlightType: "tab_home" as const,
        };

      case "home_gift":
        return null; // Handled directly by HouseGiftCelebration modal

      case "home_chalet_lore":
        return {
          stepNum: "5/6",
          title: locale === "en" ? "3D Cozy Chalet Awaits Decor" : "Căn Nhà Gỗ 3D Cần Trang Trí",
          mood: "talk" as const,
          body: locale === "en"
            ? "Your 3D chalet is charming, but currently empty! Complete daily quests and solve health cases to earn coins for tea tables, fireplaces, and pianos!"
            : "Căn nhà gỗ 3D rất đẹp nhưng hiện tại bên trong còn trống trải! Chúng ta cần làm nhiệm vụ hàng ngày và giải mã hồ sơ để kiếm Xu mua bàn trà, lò sưởi, piano trang trí sang trọng ấm cúng nhé!",
          prompt: locale === "en"
            ? "👉 Tap 'Shop Decor' to browse furniture purchasable with coins!"
            : "👉 Bạn có thể bấm 'Sắm Đồ' để xem cửa hàng nội thất bằng Xu!",
          btnText: locale === "en" ? "Next: Village Mystery ➔" : "Tiếp Tục: Bí Ẩn Ngôi Làng ➔",
          placement: "below_top" as const,
          spotlightType: "home_stage" as const,
        };

      case "world_detective_lore":
      case "home":
        return {
          stepNum: "6/6",
          title: locale === "en" ? "Mystery of the Village With No Doctors" : "Bí Ẩn Ngôi Làng Không Bác Sĩ",
          mood: "laugh" as const,
          body: locale === "en"
            ? "Did you know this village HAS NO DOCTORS? Lately villagers face insomnia and unexplained fatigue... They gladly reward coins if you investigate clue files and find root causes!"
            : "Bạn biết không, ở ngôi làng này KHÔNG HỀ CÓ BÁC SĨ! Gần đây người làng hay bị mất ngủ, những cơn đau bí ẩn... Họ rất sẵn sàng tặng Xu cho bạn nếu bạn giúp họ điều tra và giải mã manh mối!",
          prompt: locale === "en"
            ? "👉 Tap the glowing INVESTIGATE button on the top toolbar to open Detective Files!"
            : "👉 Hãy chạm vào nút GIẢI MÃ nổi bật ở thanh công cụ để mở Văn Phòng Giải Mã!",
          btnText: locale === "en" ? "Open Detective Files ➔" : "Mở Hồ Sơ Giải Mã ➔",
          placement: "below_top" as const,
          spotlightType: "world_detective_button" as const,
        };

      case "detective_modal":
      case "detective":
        return {
          stepNum: locale === "en" ? "Completed" : "Hoàn Thành",
          title: locale === "en" ? "Body Clue Detective Office" : "Văn Phòng Thám Tử Cơ Thể",
          mood: "laugh" as const,
          body: locale === "en"
            ? "Investigate 2D scenes, gather forensic clues, and deduce with Dr. Luna to solve medical cases. Each case awards 100-300 Coins! Enjoy +50 starter bonus Coins!"
            : "Khám phá hiện trường 2D, thu thập chứng cứ và suy luận cùng bác sĩ Luna để giải mã các bệnh án. Mỗi vụ án thành công mang về 100 - 300 Xu! Tặng bạn +50 Xu tân thủ khởi đầu!",
          prompt: locale === "en"
            ? "✨ You are ready to explore and live well across the village!"
            : "✨ Bạn đã sẵn sàng sống khỏe và khám phá mọi điều tuyệt vời tại làng!",
          btnText: locale === "en" ? "Start Adventure 🎉" : "Bắt Đầu Trải Nghiệm 🎉",
          placement: "bottom" as const,
          spotlightType: "none" as const,
        };
    }
  };

  const config = getStepConfig();
  if (!config) return null;

  // Calculate dynamic punch-through cutout rectangle (100% transparent window, zero dimming on focused element)
  const tabWidth = width / 6;
  const tabHeight = 62;
  const tabY = height - tabHeight;

  let punchRect: { x: number; y: number; width: number; height: number; radius: number } | null = null;
  switch (config.spotlightType) {
    case "tab_journey":
      punchRect = { x: 2 * tabWidth, y: tabY, width: tabWidth, height: tabHeight, radius: 12 };
      break;
    case "tab_daily":
      punchRect = { x: 3 * tabWidth, y: tabY, width: tabWidth, height: tabHeight, radius: 12 };
      break;
    case "tab_home":
      punchRect = { x: 1 * tabWidth, y: tabY, width: tabWidth, height: tabHeight, radius: 12 };
      break;
    case "journey_7days":
      punchRect = { x: 12, y: 120, width: width - 24, height: 142, radius: 18 };
      break;
    case "journey_add_button":
      punchRect = { x: width - 140, y: 268, width: 128, height: 40, radius: 14 };
      break;
    case "daily_seal":
      punchRect = { x: 12, y: 154, width: width - 24, height: 254, radius: 16 };
      break;
    case "home_stage":
      punchRect = { x: Math.max(10, width - 142), y: 52, width: 132, height: 32, radius: 16 };
      break;
    case "world_detective_button":
      punchRect = { x: Math.round(width * 0.46), y: 47, width: 82, height: 33, radius: 16 };
      break;
    default:
      punchRect = null;
  }

  // Render 4-slice dark backdrop leaving the focused element 100% UNBLURRED and UNDIMMED
  const renderCutoutBackdrop = () => {
    if (!punchRect) {
      return <View style={styles.darkBackdrop} pointerEvents="none" />;
    }

    const { x, y, width: w, height: h } = punchRect;
    const bgDark = "rgba(3, 10, 8, 0.76)";

    return (
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        {/* Top slice: from 0 to y */}
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: Math.max(0, y),
            backgroundColor: bgDark,
          }}
        />
        {/* Bottom slice: from y + h to bottom */}
        <View
          style={{
            position: "absolute",
            top: y + h,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: bgDark,
          }}
        />
        {/* Left slice: from y to y + h, width x */}
        <View
          style={{
            position: "absolute",
            top: y,
            left: 0,
            width: Math.max(0, x),
            height: h,
            backgroundColor: bgDark,
          }}
        />
        {/* Right slice: from y to y + h, left x + w to right edge */}
        <View
          style={{
            position: "absolute",
            top: y,
            left: x + w,
            right: 0,
            height: h,
            backgroundColor: bgDark,
          }}
        />
      </View>
    );
  };

  // Render spotlight golden frame around the punch-through window
  const renderSpotlightFrame = () => {
    if (!punchRect) return null;

    switch (config.spotlightType) {
      case "tab_journey":
      case "tab_daily":
      case "tab_home":
        return (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.spotlightFrameTab,
              {
                left: punchRect.x,
                top: punchRect.y,
                width: punchRect.width,
                height: punchRect.height,
                borderRadius: punchRect.radius,
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            <View style={styles.spotlightCornerTL} />
            <View style={styles.spotlightCornerTR} />
            <View style={styles.spotlightCornerBL} />
            <View style={styles.spotlightCornerBR} />
          </Animated.View>
        );

      case "journey_7days":
        return (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.spotlightFrameCard,
              {
                left: punchRect.x,
                top: punchRect.y,
                width: punchRect.width,
                height: punchRect.height,
                borderRadius: punchRect.radius,
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            <View style={styles.spotlightBadgeChip}>
              <Sparkles size={11} color="#fbbf24" />
              <Text style={styles.spotlightBadgeChipText}>ĐANG FOCUS: NHẬT KÝ 7 NGÀY</Text>
            </View>
          </Animated.View>
        );

      case "journey_add_button":
        return (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.spotlightFrameBtn,
              {
                left: punchRect.x,
                top: punchRect.y,
                width: punchRect.width,
                height: punchRect.height,
                borderRadius: punchRect.radius,
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            <View style={styles.spotlightBadgeChipSmall}>
              <Text style={styles.spotlightBadgeChipTextSmall}>TỰ LẬP MỤC TIÊU</Text>
            </View>
          </Animated.View>
        );

      case "daily_seal":
        return (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.spotlightFrameCard,
              {
                left: punchRect.x,
                top: punchRect.y,
                width: punchRect.width,
                height: punchRect.height,
                borderRadius: punchRect.radius,
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            <View style={styles.spotlightBadgeChip}>
              <Sparkles size={11} color="#fbbf24" />
              <Text style={styles.spotlightBadgeChipText}>ĐANG FOCUS: ĐÓNG DẤU NHẬN XU</Text>
            </View>
          </Animated.View>
        );

      case "home_stage":
        return (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.spotlightFrameBtn,
              {
                left: punchRect.x,
                top: punchRect.y,
                width: punchRect.width,
                height: punchRect.height,
                borderRadius: punchRect.radius,
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            <View style={styles.spotlightBadgeChipSmall}>
              <Text style={styles.spotlightBadgeChipTextSmall}>SẮM ĐỒ NỘI THẤT</Text>
            </View>
          </Animated.View>
        );

      case "world_detective_button":
        return (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.spotlightFrameBtn,
              {
                left: punchRect.x,
                top: punchRect.y,
                width: punchRect.width,
                height: punchRect.height,
                borderRadius: punchRect.radius,
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            <View style={styles.spotlightBadgeChipSmall}>
              <Text style={styles.spotlightBadgeChipTextSmall}>GIẢI MÃ KIẾM XU</Text>
            </View>
          </Animated.View>
        );

      default:
        return null;
    }
  };

  // Determine balloon positioning
  let balloonPositionStyle: any = { bottom: 84 };
  let showDownArrow = true;
  let showUpArrow = false;

  if (config.placement === "top_mid") {
    // Below 7-day tracker
    balloonPositionStyle = { top: punchRect ? punchRect.y + punchRect.height + 14 : 274 };
    showDownArrow = false;
    showUpArrow = true;
  } else if (config.placement === "mid") {
    // Below + Thêm Mới button
    balloonPositionStyle = { top: punchRect ? punchRect.y + punchRect.height + 14 : 322 };
    showDownArrow = false;
    showUpArrow = true;
  } else if (config.placement === "below_top") {
    // Below top toolbar / header buttons
    balloonPositionStyle = { top: punchRect ? punchRect.y + punchRect.height + 14 : 96 };
    showDownArrow = false;
    showUpArrow = true;
  } else if ((config.placement as string) === "above_detective_btn") {
    balloonPositionStyle = { bottom: 160 };
    showDownArrow = true;
    showUpArrow = false;
  } else {
    // Default bottom tab focus
    balloonPositionStyle = { bottom: 84 };
    showDownArrow = true;
    showUpArrow = false;
  }

  const cardMaxWidth = Math.min(width - 24, 460);

  // Calculate dynamic arrow horizontal center matching the punch-through target
  let arrowLeftPercent = "50%";
  if (punchRect) {
    const cardLeft = (width - cardMaxWidth) / 2;
    const targetCenterX = punchRect.x + punchRect.width / 2;
    const relativeX = targetCenterX - cardLeft;
    const clampedX = Math.max(28, Math.min(cardMaxWidth - 28, relativeX));
    arrowLeftPercent = `${Math.round((clampedX / cardMaxWidth) * 100)}%`;
  }

  const pathname = usePathname();
  const isWorldScreen =
    pathname === "/world" ||
    pathname?.includes("world") ||
    pathname === "/" ||
    pathname === "/(game)/world";
  const isJourneyScreen = pathname?.includes("journey");
  const isDailyScreen = pathname?.includes("daily");
  const isHomeScreen = pathname?.includes("home");

  // Never render when cinematic tour is open
  if (isCinematicTourOpen()) return null;

  // Screen affinity check: only show step guide on its corresponding tab!
  // On World screen, NEVER block the village with Journey/Daily/Home cards!
  if (
    isWorldScreen &&
    (currentStep === "welcome" ||
      currentStep?.startsWith("journey") ||
      currentStep?.startsWith("daily") ||
      currentStep?.startsWith("home"))
  ) {
    return null;
  }
  if (!isJourneyScreen && currentStep?.startsWith("journey")) {
    return null;
  }
  if (!isDailyScreen && currentStep?.startsWith("daily")) {
    return null;
  }
  if (!isHomeScreen && currentStep?.startsWith("home")) {
    return null;
  }

  return (
    <View style={styles.fullScreenScrim} pointerEvents="box-none">
      {/* Background Dimmed Overlay with True Punch-Through Cutout */}
      {renderCutoutBackdrop()}

      {/* Spotlight Frame highlighting the focused element */}
      {renderSpotlightFrame()}

      {/* Contextual Dialogue Balloon */}
      <View
        style={[styles.dialogueWrapper, balloonPositionStyle]}
        pointerEvents="box-none"
      >
        <View style={[styles.dialogueCard, { maxWidth: cardMaxWidth }]}>
          {/* Arrow pointing up if placed below focused element */}
          {showUpArrow && (
            <Animated.View style={[styles.pointerUpWrap, { left: arrowLeftPercent as any, transform: [{ translateY: bounceAnim }] }]}>
              <View style={styles.triangleUp} />
            </Animated.View>
          )}

          {/* Card Header: Integrated Step badge + Title + Skip button */}
          <View style={styles.dialogueHeader}>
            <View style={styles.headerLeftRow}>
              <View style={styles.stepBadge}>
                <Sparkles size={11} color="#fbbf24" />
                <Text style={styles.stepBadgeText}>BƯỚC {config.stepNum}</Text>
              </View>
              <Text style={styles.dialogueTitle} numberOfLines={1}>
                {config.title}
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleSkip}
              accessibilityRole="button"
              accessibilityLabel={locale === "en" ? "Skip tour" : "Bỏ qua hướng dẫn"}
              style={styles.skipBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              activeOpacity={0.7}
            >
              <Text style={styles.skipBtnText}>{locale === "en" ? "Skip" : "Bỏ qua"}</Text>
              <X size={12} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {/* Body: Mascot avatar + speech text */}
          <View style={styles.dialogueBody}>
            <View style={styles.mascotThumbWrap}>
              <Image
                source={MASCOT_SPRITES[config.mood]}
                style={styles.mascotThumb}
                contentFit="contain"
              />
              <View style={styles.mascotMiniTag}>
                <Text style={styles.mascotMiniTagText}>Lumi</Text>
              </View>
            </View>

            <View style={styles.textContainer}>
              <Text style={styles.dialogueText}>{config.body}</Text>
              <View style={styles.promptNoticeBox}>
                <Text style={styles.promptNoticeText}>{config.prompt}</Text>
              </View>
            </View>
          </View>

          {/* Action CTA */}
          <View style={styles.dialogueFooter}>
            <TouchableOpacity
              style={styles.ctaButton}
              onPress={handleNext}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={config.btnText}
            >
              <Text style={styles.ctaButtonText}>{config.btnText}</Text>
              <ArrowRight size={16} color="#042f2e" />
            </TouchableOpacity>
          </View>

          {/* Arrow pointing down if placed above focused element */}
          {showDownArrow && (
            <Animated.View style={[styles.pointerDownWrap, { left: arrowLeftPercent as any, transform: [{ translateY: bounceAnim }] }]}>
              <View style={styles.triangleDown} />
            </Animated.View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreenScrim: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 900,
    justifyContent: "space-between",
  },
  darkBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(3, 10, 8, 0.74)",
    ...(Platform.OS === "web" ? { backdropFilter: "blur(2px)" } as any : {}),
  },
  topHudRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 52 : 36,
    zIndex: 910,
  },
  stepCounterPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(10, 38, 30, 0.94)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.5)",
    shadowColor: "#f59e0b",
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  stepCounterText: {
    color: "#fef08a",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  skipPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(15, 23, 42, 0.85)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.3)",
  },
  skipPillText: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "600",
  },

  /* Spotlight Cutouts & Glowing Frames */
  spotlightFrameTab: {
    position: "absolute",
    bottom: 0,
    height: 64,
    borderWidth: 2.5,
    borderColor: "#fbbf24",
    backgroundColor: "rgba(245, 158, 11, 0.22)",
    borderRadius: 14,
    shadowColor: "#fbbf24",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.8,
    shadowRadius: 14,
    elevation: 12,
    zIndex: 905,
  },
  spotlightCornerTL: {
    position: "absolute",
    top: -3,
    left: -3,
    width: 8,
    height: 8,
    borderColor: "#fff",
    borderTopWidth: 2,
    borderLeftWidth: 2,
  },
  spotlightCornerTR: {
    position: "absolute",
    top: -3,
    right: -3,
    width: 8,
    height: 8,
    borderColor: "#fff",
    borderTopWidth: 2,
    borderRightWidth: 2,
  },
  spotlightCornerBL: {
    position: "absolute",
    bottom: -3,
    left: -3,
    width: 8,
    height: 8,
    borderColor: "#fff",
    borderBottomWidth: 2,
    borderLeftWidth: 2,
  },
  spotlightCornerBR: {
    position: "absolute",
    bottom: -3,
    right: -3,
    width: 8,
    height: 8,
    borderColor: "#fff",
    borderBottomWidth: 2,
    borderRightWidth: 2,
  },

  spotlightFrameCard: {
    position: "absolute",
    borderWidth: 2.5,
    borderColor: "#fbbf24",
    borderRadius: 18,
    backgroundColor: "rgba(245, 158, 11, 0.08)",
    shadowColor: "#fbbf24",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.75,
    shadowRadius: 16,
    elevation: 10,
    zIndex: 905,
  },
  spotlightFrameBtn: {
    position: "absolute",
    borderWidth: 2.5,
    borderColor: "#fbbf24",
    borderRadius: 12,
    backgroundColor: "rgba(245, 158, 11, 0.28)",
    shadowColor: "#fbbf24",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.85,
    shadowRadius: 14,
    elevation: 10,
    zIndex: 905,
  },
  spotlightFrameCircle: {
    position: "absolute",
    borderWidth: 3,
    borderColor: "#fbbf24",
    borderRadius: 32,
    backgroundColor: "rgba(245, 158, 11, 0.32)",
    shadowColor: "#fbbf24",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 20,
    elevation: 14,
    zIndex: 905,
  },
  spotlightBadgeChip: {
    position: "absolute",
    top: -12,
    left: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#06221c",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#fbbf24",
  },
  spotlightBadgeChipText: {
    color: "#fef08a",
    fontSize: 9.5,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  spotlightBadgeChipSmall: {
    position: "absolute",
    top: -10,
    right: 6,
    backgroundColor: "#06221c",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#fbbf24",
  },
  spotlightBadgeChipBtn: {
    position: "absolute",
    top: -10,
    right: -4,
    backgroundColor: "#06221c",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#fbbf24",
  },
  spotlightBadgeChipTextSmall: {
    color: "#fef08a",
    fontSize: 8.5,
    fontWeight: "800",
  },

  /* Contextual Dialogue Balloon */
  dialogueWrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    zIndex: 915,
  },
  dialogueCard: {
    width: "100%",
    backgroundColor: "rgba(6, 26, 21, 0.96)",
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "rgba(52, 211, 153, 0.7)",
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 12,
    overflow: "visible",
  },
  pointerUpWrap: {
    position: "absolute",
    top: -9,
    marginLeft: -8,
  },
  triangleUp: {
    width: 0,
    height: 0,
    backgroundColor: "transparent",
    borderStyle: "solid",
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 9,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "rgba(52, 211, 153, 0.9)",
  },
  pointerDownWrap: {
    position: "absolute",
    bottom: -9,
    marginLeft: -8,
  },
  triangleDown: {
    width: 0,
    height: 0,
    backgroundColor: "transparent",
    borderStyle: "solid",
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 9,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "rgba(52, 211, 153, 0.9)",
  },

  dialogueHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(52, 211, 153, 0.15)",
  },
  headerLeftRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    marginRight: 6,
  },
  stepBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(245, 158, 11, 0.16)",
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.45)",
  },
  stepBadgeText: {
    color: "#fef08a",
    fontSize: 9.5,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  dialogueTitle: {
    color: "#6ee7b7",
    fontSize: 12.5,
    fontWeight: "800",
    letterSpacing: -0.2,
    flexShrink: 1,
  },
  skipBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 8,
    borderWidth: 0.8,
    borderColor: "rgba(148, 163, 184, 0.25)",
  },
  skipBtnText: {
    color: "#94a3b8",
    fontSize: 10,
    fontWeight: "600",
  },

  dialogueBody: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 12,
    alignItems: "center",
  },
  mascotThumbWrap: {
    alignItems: "center",
    width: 58,
  },
  mascotThumb: {
    width: 56,
    height: 56,
  },
  mascotMiniTag: {
    marginTop: 2,
    backgroundColor: "rgba(52, 211, 153, 0.2)",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: "rgba(52, 211, 153, 0.4)",
  },
  mascotMiniTagText: {
    color: "#a7f3d0",
    fontSize: 8.5,
    fontWeight: "700",
  },
  textContainer: {
    flex: 1,
    gap: 4,
  },
  dialogueText: {
    color: "#f8fafc",
    fontSize: 12,
    lineHeight: 16.5,
    fontWeight: "500",
  },
  promptNoticeBox: {
    backgroundColor: "rgba(245, 158, 11, 0.12)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderLeftWidth: 2.5,
    borderLeftColor: "#fbbf24",
    marginTop: 2,
  },
  promptNoticeText: {
    color: "#fef08a",
    fontSize: 10.5,
    fontWeight: "700",
    lineHeight: 14,
  },

  dialogueFooter: {
    paddingHorizontal: 12,
    paddingBottom: 10,
    paddingTop: 2,
  },
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#34d399",
    paddingVertical: 9,
    borderRadius: 12,
    shadowColor: "#34d399",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  ctaButtonText: {
    color: "#042f2e",
    fontSize: 12.5,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
});
