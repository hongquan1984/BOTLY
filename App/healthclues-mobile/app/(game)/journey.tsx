import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  useWindowDimensions,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import Svg, { Path } from "react-native-svg";
import * as Haptics from "expo-haptics";
import {
  Sparkles,
  Scroll,
  AlertCircle,
  Plus,
  X,
  Check,
  ChevronDown,
  ChevronUp,
  Info,
  BookOpen,
  Lightbulb,
  PenLine,
} from "lucide-react-native";
import { colors, fonts, spacing, radius } from "@/theme";
import { t, useLocale } from "@/localization";
import { TopHud } from "@/components/common/TopHud";
import { HabitIconBox } from "@/components/game/HabitIconBox";
import { ExpGain } from "@/components/game/ExpGain";
import { useAuth } from "@/hooks/useAuth";
import { useWorld, getLocalizedGoal } from "@/hooks/useWorld";
import {
  AiSuggestedGoal,
  buildDiscoveryProfile,
  loadSavedStarterProfile,
  requestWellnessAdvisor,
} from "@/services/onboarding";

const QUICK_HABIT_PRESETS = [
  {
    title: "Uống một cốc nước ấm khi thức dậy",
    category: "Dinh Dưỡng",
    target: "1",
    unit: "cốc ấm",
    daysPerWeek: 7,
    expValue: 10,
    description: "Kích hoạt hệ bài tiết và hỗ trợ đào thải cặn chuyển hóa buổi sáng.",
    evidence: "PubMed PMID: 18174899",
  },
  {
    title: "Thực hành thở sâu 4-7-8 trước khi ngủ",
    category: "Thư Giãn",
    target: "5",
    unit: "phút",
    daysPerWeek: 7,
    expValue: 10,
    description: "Kích hoạt hệ thần kinh phó giao cảm, giảm căng thẳng tim mạch.",
    evidence: "Sleep Med Rev 2021",
  },
  {
    title: "Đi bộ nhẹ 20 phút sau bữa tối",
    category: "Vận Động",
    target: "20",
    unit: "phút",
    daysPerWeek: 7,
    expValue: 15,
    description: "Hạ đỉnh đường huyết sau ăn và tăng chuyển hóa acid uric tự nhiên.",
    evidence: "BMJ Clin Evid 2020",
  },
  {
    title: "Tắt màn hình thiết bị 30 phút trước ngủ",
    category: "Giấc Ngủ",
    target: "30",
    unit: "phút",
    daysPerWeek: 7,
    expValue: 10,
    description: "Ngăn ánh sáng xanh ức chế melatonin, bảo vệ chất lượng pha ngủ sâu.",
    evidence: "Harvard Health 2022",
  },
  {
    title: "Tăng cường rau xanh trong mỗi bữa ăn",
    category: "Dinh Dưỡng",
    target: "2",
    unit: "bữa",
    daysPerWeek: 7,
    expValue: 10,
    description: "Bổ sung chất xơ hòa tan và kiềm hóa môi trường nước tiểu.",
    evidence: "ACR Guideline 2020",
  },
];

const QUICK_HABIT_PRESETS_EN = [
  { title: "Drink warm water after waking", category: "Nutrition" },
  { title: "Practice 4-7-8 breathing before bed", category: "Relaxation" },
  { title: "Take a gentle 20-minute walk after dinner", category: "Movement" },
  { title: "Turn off screens 30 minutes before bed", category: "Sleep" },
  { title: "Add more leafy greens to each meal", category: "Nutrition" },
] as const;

const TRAIL_WAVE_OFFSETS = [5, -5, 4, -4, 3, -5, 0];

function buildSmoothTrailPath(pts: { x: number; y: number }[]): string {
  if (pts.length === 0) return "";
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    const midX = (a.x + b.x) / 2;
    d += ` C ${midX} ${a.y}, ${midX} ${b.y}, ${b.x} ${b.y}`;
  }
  return d;
}

/**
 * Wellness Journey RPG Adventure Scroll: Lumi signboard, 7-day rune trail, guild charters & saved drawer.
 */
export default function JourneyScreen() {
  const { locale, strings } = useLocale();
  const { height: screenHeight } = useWindowDimensions();
  const isCompactViewport = screenHeight < 480;
  const { isAuthenticated } = useAuth();
  const {
    activeGoals,
    savedGoals,
    xpTotal,
    currencies,
    loading,
    refreshing,
    todayCheckin,
    refreshWorld,
    addHabit,
    toggleGoalStatus,
  } = useWorld(isAuthenticated);

  const [modalVisible, setModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState(locale === "en" ? "Nutrition" : "Dinh Dưỡng");
  const [adding, setAdding] = useState(false);
  const [habitFormError, setHabitFormError] = useState<string | null>(null);
  const [habitToast, setHabitToast] = useState<string | null>(null);
  const [expNotice, setExpNotice] = useState<{ visible: boolean; amount: number }>({
    visible: false,
    amount: 20,
  });
  const [expandedLore, setExpandedLore] = useState<Record<string, boolean>>({});
  const [savedExpandedManual, setSavedExpandedManual] = useState(false);
  const [aiPresets, setAiPresets] = useState<AiSuggestedGoal[]>([]);
  const [aiSuggestLoading, setAiSuggestLoading] = useState(false);
  const [aiSuggestFocus, setAiSuggestFocus] = useState<string | null>(null);

  // Show saved items automatically whenever any item exists in Saved for Later, or when user opens drawer
  const isSavedDrawerOpen = savedGoals.length > 0 || savedExpandedManual;

  // Build 7-day past rune milestone trail
  const timelineDays = Array.from({ length: 7 }, (_, i) => {
    const offset = i - 6;
    const d = new Date();
    d.setDate(d.getDate() + offset);
    const dayLabelsVi = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
    const dayLabelsEn = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dayLabels = locale === "en" ? dayLabelsEn : dayLabelsVi;
    const isToday = offset === 0;
    const completed = isToday ? !!todayCheckin?.submitted : offset >= -2;
    return {
      key: `day-${offset}`,
      label: isToday ? (locale === "en" ? "Today" : "Hôm nay") : dayLabels[d.getDay()],
      dayNum: d.getDate(),
      isToday,
      completed,
      waveY: TRAIL_WAVE_OFFSETS[i] ?? 0,
      svgX: 25 + i * 50,
      svgY: 23 + (TRAIL_WAVE_OFFSETS[i] ?? 0),
    };
  });

  const fullTrailPathD = buildSmoothTrailPath(
    timelineDays.map((d) => ({ x: d.svgX, y: d.svgY }))
  );
  const completedStreakPts = timelineDays
    .filter((d) => d.completed)
    .map((d) => ({ x: d.svgX, y: d.svgY }));
  const completedTrailPathD =
    completedStreakPts.length >= 2 ? buildSmoothTrailPath(completedStreakPts) : "";

  const triggerHaptic = () => {
    try {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch?.(() => {});
      }
    } catch {}
  };

  const triggerSuccessHaptic = () => {
    try {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch?.(() => {});
      }
    } catch {}
  };

  const handlePickPreset = (preset: (typeof QUICK_HABIT_PRESETS)[0], index: number) => {
    triggerHaptic();
    const displayPreset = locale === "en" ? QUICK_HABIT_PRESETS_EN[index] : preset;
    setNewTitle(displayPreset.title);
    setNewCategory(displayPreset.category);
    setHabitFormError(null);
  };

  const handleFetchAiSuggestions = async () => {
    triggerHaptic();
    setAiSuggestLoading(true);
    try {
      const saved = await loadSavedStarterProfile();
      const { profile, requestQuestId } = saved
        ? {
            profile: saved.profile,
            requestQuestId:
              saved.profile.adaptiveDiscovery.focusId === "sleep" ? "sleep-better" : "health-concern",
          }
        : buildDiscoveryProfile({
            selectedConcerns: ["general"],
            primaryConcernId: "general",
            concernNote: "",
            selectedFactors: [],
            factorNote: "",
            locale,
          });
      setAiSuggestFocus(profile.adaptiveDiscovery.concernDetail || profile.adaptiveDiscovery.focusLabel);
      const res = await requestWellnessAdvisor(profile, requestQuestId, locale);
      setAiPresets(res.goals);
    } finally {
      setAiSuggestLoading(false);
    }
  };

  const handlePickAiPreset = (goal: AiSuggestedGoal) => {
    triggerHaptic();
    setNewTitle(locale === "en" ? goal.title.en : goal.title.vi);
    const catLower = (goal.category || "").toLowerCase();
    setNewCategory(
      /sleep|ngủ/.test(catLower)
        ? locale === "en" ? "Sleep" : "Giấc Ngủ"
        : /move|walk|vận động/.test(catLower)
          ? locale === "en" ? "Movement" : "Vận Động"
          : /relax|breath|thư giãn/.test(catLower)
            ? locale === "en" ? "Lifestyle" : "Lối Sống"
            : locale === "en" ? "Nutrition" : "Dinh Dưỡng"
    );
    setHabitFormError(null);
  };

  const handleSaveHabit = async () => {
    if (!newTitle.trim()) {
      setHabitFormError("Vui lòng nhập tên thói quen sống khỏe của bạn.");
      return;
    }
    setHabitFormError(null);

    setAdding(true);
    triggerSuccessHaptic();
    try {
      await addHabit({
        title: newTitle.trim(),
        category: newCategory,
        target: "Hằng ngày",
        unit: "mục tiêu",
        daysPerWeek: 7,
        expValue: 15,
        description: `Thói quen "${newTitle.trim()}" rèn luyện đều đặn hằng ngày.`,
        evidence: "Người dùng tự thiết lập",
      });

      setModalVisible(false);
      setNewTitle("");
      setHabitFormError(null);
      setExpNotice({ visible: true, amount: 20 });
      setHabitToast("Đã thêm thói quen mới vào Hành Trình (+20 EXP)!");
      setTimeout(() => setHabitToast(null), 4000);
    } catch (err: any) {
      setHabitFormError(err.message || "Không thể lưu thói quen.");
    } finally {
      setAdding(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <TopHud
        level={Math.max(1, Math.floor(xpTotal / 100) + 1)}
        expTotal={xpTotal}
        keys={currencies.keys}
        fragments={currencies.fragments}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshWorld}
            tintColor={colors.emeraldLight}
          />
        }
      >
        <View style={[styles.pageContainer, isCompactViewport && { gap: 8 }]}>
          {/* Wooden-Brass Adventure Signboard Header with Lumi Crest */}
          <View style={[styles.signboardCard, isCompactViewport && { paddingVertical: 7, gap: 10 }]}>
            <View style={[styles.rivet, styles.rivetTL]} />
            <View style={[styles.rivet, styles.rivetTR]} />
            <View style={[styles.rivet, styles.rivetBL]} />
            <View style={[styles.rivet, styles.rivetBR]} />

            <View
              style={[
                styles.lumiPortraitRing,
                isCompactViewport && { width: 42, height: 42, borderRadius: 21 },
              ]}
            >
              <View style={styles.lumiPortraitGlow} />
              <Image
                source={require("../../assets/game/ui/lumi_fox_clean.png")}
                style={isCompactViewport ? { width: 34, height: 34 } : styles.lumiPortraitImg}
                contentFit="contain"
              />
            </View>

            <View style={styles.signboardTextCol}>
              <Text style={[styles.signboardTitle, isCompactViewport && { fontSize: 15 }]}>
                {locale === "en" ? "Wellness Journey" : "Hành Trình Sống Khỏe"}
              </Text>
              <Text style={styles.signboardQuote} numberOfLines={2}>
                {locale === "en"
                  ? "\"Small, steady daily steps with Lumi ~\""
                  : "\"Từng bước nhỏ vững vàng mỗi ngày cùng Lumi ~\""}
              </Text>
            </View>
          </View>

          {habitToast && (
            <View style={styles.toastBanner}>
              <Check size={14} color={colors.emeraldLight} />
              <Text style={styles.toastBannerText}>{habitToast}</Text>
            </View>
          )}

          {/* 7-Day Winding Rune Trail Card */}
          <View style={styles.trailCard}>
            <View style={styles.trailTitleTag}>
              <Text style={styles.trailTitleTagText}>{locale === "en" ? "7-Day Journal" : "Nhật Ký 7 Ngày"}</Text>
            </View>

            <View style={styles.trailPathContainer}>
              <Svg
                style={styles.trailCurveSvg}
                viewBox="0 0 350 48"
                preserveAspectRatio="none"
                pointerEvents="none"
              >
                <Path
                  d={fullTrailPathD}
                  stroke="rgba(212, 168, 79, 0.45)"
                  strokeWidth="2.5"
                  strokeDasharray="5, 4"
                  fill="none"
                />
                {completedTrailPathD !== "" && (
                  <Path
                    d={completedTrailPathD}
                    stroke="#34d399"
                    strokeWidth="2.8"
                    fill="none"
                    opacity={0.85}
                  />
                )}
              </Svg>
              <View style={styles.trailNodesRow}>
                {timelineDays.map((day) => (
                  <View
                    key={day.key}
                    style={[styles.trailNodeWrap, { transform: [{ translateY: day.waveY }] }]}
                  >
                    <View
                      style={[
                        styles.runeStoneOrb,
                        day.completed && styles.runeStoneOrbDone,
                        day.isToday && styles.runeStoneOrbToday,
                      ]}
                    >
                      {day.completed ? (
                        <Check
                          size={day.isToday ? 15 : 13}
                          color={day.isToday ? "#042f2e" : "#ffffff"}
                          strokeWidth={3}
                        />
                      ) : (
                        <Text style={styles.runeStoneNum}>{day.dayNum}</Text>
                      )}
                    </View>
                    <Text
                      style={[
                        styles.runeDayLabel,
                        day.completed && styles.runeDayLabelDone,
                        day.isToday && styles.runeDayLabelToday,
                      ]}
                      numberOfLines={1}
                    >
                      {day.label}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {loading && !refreshing ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={colors.emeraldLight} />
            </View>
          ) : (
            <>
              {/* Active Goals Section Header */}
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionTitleGroup}>
                  <Text style={styles.sectionTitle}>
                    {locale === "en" ? `Active Habits (${activeGoals.length})` : `Đang Theo Dõi (${activeGoals.length})`}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.addPlaqueBtn}
                  accessibilityRole="button"
                  accessibilityLabel={locale === "en" ? "Add new habit" : "Thêm mới"}
                  activeOpacity={0.82}
                  onPress={() => {
                    triggerHaptic();
                    setModalVisible(true);
                  }}
                >
                  <Plus size={13} color="#fef08a" />
                  <Text style={styles.addPlaqueBtnText}>{locale === "en" ? "Add Habit" : "Thêm Mới"}</Text>
                </TouchableOpacity>
              </View>

              {/* Active Guild Charter Cards */}
              {activeGoals.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>
                    {locale === "en"
                      ? "No habits currently tracked. Tap '+ Add Habit' or explore presets below!"
                      : "Chưa có mục tiêu nào đang theo dõi. Bấm \"Thêm Mới\" hoặc kích hoạt bên dưới!"}
                  </Text>
                </View>
              ) : (
                <View style={styles.chartersList}>
                  {activeGoals.map((rawGoal, index) => {
                    const goal = getLocalizedGoal(rawGoal, locale);
                    const isLoreOpen = !!expandedLore[goal.id];
                    return (
                      <View key={goal.id || index} style={styles.charterCard}>
                        <View style={styles.charterRow}>
                          {/* Left Medallion with Floating +EXP Crest */}
                          <View style={styles.charterMedallionWrap}>
                            <View style={styles.charterMedallionRing}>
                              <HabitIconBox category={goal.category} title={goal.title} size={38} />
                            </View>
                            <View style={styles.floatingExpTag}>
                              <Text style={styles.floatingExpText}>+{goal.expValue || 10}</Text>
                            </View>
                          </View>

                          {/* Middle Title + Sub-meta */}
                          <View style={styles.charterTextCol}>
                            <Text style={styles.charterTitle} numberOfLines={2}>
                              {goal.title}
                            </Text>
                            <Text style={styles.charterSub} numberOfLines={2}>
                              {goal.daysPerWeek || 7} {locale === "en" ? "days/wk" : "ngày/tuần"} · {goal.target || (locale === "en" ? "Daily" : "Đều đặn")} {goal.unit || ""}
                            </Text>
                          </View>

                          {/* Compact Right Action Cluster: Info + Lưu sau */}
                          <View style={styles.charterActionsCol}>
                            <TouchableOpacity
                              style={styles.charterInfoBtn}
                              onPress={() =>
                                setExpandedLore((prev) => ({ ...prev, [goal.id]: !prev[goal.id] }))
                              }
                              accessibilityRole="button"
                              accessibilityLabel={`Thông tin ${goal.title}`}
                              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                              <Info
                                size={14}
                                color={isLoreOpen ? colors.emeraldLight : colors.textSecondary}
                              />
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={styles.archivePlaqueBtn}
                              accessibilityRole="button"
                              accessibilityLabel={`Lưu xem sau ${goal.title}`}
                              activeOpacity={0.78}
                              onPress={() => {
                                triggerHaptic();
                                toggleGoalStatus(goal.id, "saved_for_later");
                              }}
                            >
                              <Text style={styles.archivePlaqueText}>{locale === "en" ? "Save" : "Lưu sau"}</Text>
                            </TouchableOpacity>
                          </View>
                        </View>

                        {isLoreOpen && (
                          <View style={styles.charterLoreDrawer}>
                            {goal.description && (
                              <Text style={styles.charterLoreDesc}>{goal.description}</Text>
                            )}
                            {goal.evidence && (
                              <View style={styles.charterEvidenceRow}>
                                <BookOpen size={10} color={colors.emeraldLight} />
                                <Text style={styles.charterEvidenceText}>{goal.evidence}</Text>
                              </View>
                            )}
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              )}

              {/* Bottom Collapsible Wooden Drawer: Đã Lưu Xem Sau */}
              <View style={styles.savedDrawerWrapper}>
                <TouchableOpacity
                  style={styles.savedDrawerHeader}
                  accessibilityRole="button"
                  accessibilityLabel="Đã Lưu Xem Sau"
                  activeOpacity={0.8}
                  onPress={() => setSavedExpandedManual((v) => !v)}
                >
                  <View style={styles.savedHeaderLeft}>
                    <Scroll size={14} color="#d4a84f" />
                    <Text style={styles.savedDrawerTitle}>
                      {locale === "en" ? `Saved for Later (${savedGoals.length})` : `Đã Lưu Xem Sau (${savedGoals.length})`}
                    </Text>
                  </View>
                  {isSavedDrawerOpen ? (
                    <ChevronUp size={15} color="#d4a84f" />
                  ) : (
                    <ChevronDown size={15} color="#d4a84f" />
                  )}
                </TouchableOpacity>

                {isSavedDrawerOpen && (
                  <View style={styles.savedDrawerBody}>
                    {savedGoals.length === 0 ? (
                      <Text style={styles.savedEmptyHint}>
                        {locale === "en"
                          ? "Deferred habits will be kept neatly here to reactivate whenever you're ready."
                          : "Các thói quen tạm hoãn sẽ nằm gọn tại ngăn này để kích hoạt lại bất cứ lúc nào."}
                      </Text>
                    ) : (
                      savedGoals.map((rawGoal, index) => {
                        const goal = getLocalizedGoal(rawGoal, locale);
                        return (
                          <View key={goal.id || index} style={styles.savedGoalRow}>
                            <HabitIconBox category={goal.category} title={goal.title} size={32} />
                            <View style={styles.savedGoalMeta}>
                              <Text style={styles.savedGoalTitle} numberOfLines={1}>
                                {goal.title}
                              </Text>
                              <Text style={styles.savedGoalSub}>
                                {goal.category} · +{goal.expValue || 10} EXP
                              </Text>
                            </View>
                            <TouchableOpacity
                              style={styles.activateGoalBtn}
                              accessibilityRole="button"
                              accessibilityLabel={`Kích hoạt ${goal.title}`}
                              onPress={() => {
                                triggerSuccessHaptic();
                                toggleGoalStatus(goal.id, "active");
                              }}
                            >
                              <Text style={styles.activateGoalBtnText}>
                                {locale === "en" ? "Activate" : "Kích hoạt"}
                              </Text>
                            </TouchableOpacity>
                          </View>
                        );
                      })
                    )}
                  </View>
                )}
              </View>

              {/* Subtle Safety Disclaimer */}
              <View style={styles.disclaimerFootnote}>
                <AlertCircle size={12} color="#64748b" />
                <Text style={styles.disclaimerFootnoteText}>
                  {locale === "en"
                    ? "Disclaimer: Lifestyle wellness guidance based on ACR & BMJ recommendations; does not substitute clinical physician advice."
                    : "Khuyến cáo: Các mục tiêu mang tính định hướng lối sống dựa trên khuyến cáo ACR & BMJ, không thay thế tư vấn bác sĩ."}
                </Text>
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {/* Add Habit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleRow}>
                <Image
                  source={require("../../assets/game/ui/lumi_fox_clean.png")}
                  style={styles.modalLumiImg}
                  contentFit="contain"
                />
                <View>
                  <Text style={styles.modalTitle}>{locale === "en" ? "Add New Habit" : "Thêm Thói Quen Mới"}</Text>
                  <Text style={styles.modalSub}>{locale === "en" ? "Set a healthy goal with Lumi" : "Cùng Lumi thiết lập mục tiêu khỏe mạnh"}</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <TouchableOpacity
                style={styles.aiSuggestTriggerBtn}
                accessibilityRole="button"
                accessibilityLabel="journey-ai-suggest-btn"
                activeOpacity={0.8}
                onPress={handleFetchAiSuggestions}
                disabled={aiSuggestLoading}
              >
                <Sparkles size={15} color="#fef08a" />
                <Text style={styles.aiSuggestTriggerText}>
                  {aiSuggestLoading
                    ? locale === "en" ? "Loading AI suggestions..." : "Đang tải gợi ý AI..."
                    : locale === "en" ? "Get AI suggestions for your focus" : "Lấy gợi ý AI theo vấn đề của bạn"}
                </Text>
              </TouchableOpacity>

              {aiPresets.length > 0 && (
                <View style={styles.aiPresetsBox}>
                  <View style={styles.fieldHeadingRow}>
                    <Sparkles size={13} color="#fef08a" />
                    <Text style={styles.fieldSectionHeading}>
                      {locale === "en" ? `AI SUGGESTIONS FOR "${aiSuggestFocus || "YOUR PROFILE"}":` : `GỢI Ý AI CHO "${aiSuggestFocus || "HỒ SƠ CỦA BẠN"}":`}
                    </Text>
                  </View>
                  <View style={styles.presetsContainer}>
                    {aiPresets.map((goal) => (
                      <TouchableOpacity
                        key={goal.goalId}
                        style={[styles.presetPill, { borderColor: "#10b981" }]}
                        activeOpacity={0.75}
                        onPress={() => handlePickAiPreset(goal)}
                      >
                        <View style={styles.presetPillRow}>
                          <Text style={styles.presetTitleText} numberOfLines={1}>
                            {locale === "en" ? goal.title.en : goal.title.vi}
                          </Text>
                          <Text style={styles.presetExpText}>+15 EXP</Text>
                        </View>
                        <Text style={styles.presetCategoryText} numberOfLines={2}>
                          {locale === "en" ? goal.relevanceReason.en : goal.relevanceReason.vi}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              <View style={styles.fieldHeadingRow}>
                <Lightbulb size={13} color="#fef08a" />
                <Text style={styles.fieldSectionHeading}>{locale === "en" ? "QUICK SUGGESTIONS FROM LUMI:" : "GỢI Ý NHANH TỪ BÉ CÁO LUMI:"}</Text>
              </View>
              <View style={styles.presetsContainer}>
                {QUICK_HABIT_PRESETS.map((preset, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.presetPill}
                    activeOpacity={0.7}
                    onPress={() => handlePickPreset(preset, idx)}
                  >
                    <View style={styles.presetPillRow}>
                      <Text style={styles.presetTitleText} numberOfLines={1}>
                        {locale === "en" ? QUICK_HABIT_PRESETS_EN[idx].title : preset.title}
                      </Text>
                      <Text style={styles.presetExpText}>+{preset.expValue} EXP</Text>
                    </View>
                    <Text style={styles.presetCategoryText}>
                      {locale === "en" ? QUICK_HABIT_PRESETS_EN[idx].category : preset.category} • {preset.target} {preset.unit}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={[styles.fieldHeadingRow, { marginTop: spacing.md }]}>
                <PenLine size={13} color="#fef08a" />
                <Text style={styles.fieldSectionHeading}>
                  {locale === "en" ? "WRITE YOUR OWN HABIT:" : "TỰ GÕ THÓI QUEN CỦA BẠN:"}
                </Text>
              </View>

              <Text style={styles.inputLabel}>{locale === "en" ? "Enter the habit you want to practice *" : "Nhập thói quen bạn muốn rèn luyện *"}</Text>
              <TextInput
                style={[styles.textInput, { minHeight: 46, fontSize: 14 }]}
                placeholder={locale === "en" ? "e.g. No alcohol, Drink 2L water, Walk 15 min..." : "Ví dụ: Không uống rượu bia, Uống 2L nước, Đi bộ 15p..."}
                placeholderTextColor="rgba(255,255,255,0.45)"
                value={newTitle}
                onChangeText={setNewTitle}
                returnKeyType="done"
              />

              <Text style={styles.inputLabel}>{locale === "en" ? "Habit category" : "Nhóm thói quen"}</Text>
              <View style={styles.pillSelectorRow}>
                {(locale === "en"
                  ? ["Nutrition", "Movement", "Sleep", "Lifestyle"]
                  : ["Dinh Dưỡng", "Vận Động", "Giấc Ngủ", "Lối Sống"]
                ).map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.choicePill,
                      newCategory === cat && styles.choicePillActive,
                    ]}
                    onPress={() => {
                      triggerHaptic();
                      setNewCategory(cat);
                    }}
                  >
                    <Text
                      style={[
                        styles.choicePillText,
                        newCategory === cat && styles.choicePillTextActive,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {habitFormError && (
                <Text style={styles.habitErrorText}>{habitFormError}</Text>
              )}

              <TouchableOpacity
                style={styles.submitModalBtn}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="save-custom-habit-btn"
                onPress={handleSaveHabit}
                disabled={adding}
              >
                {adding ? (
                  <ActivityIndicator size="small" color="#042f2e" />
                ) : (
                  <>
                    <Check size={18} color="#042f2e" />
                    <Text style={styles.submitModalBtnText}>
                      LƯU THÓI QUEN VÀO HÀNH TRÌNH (+20 EXP)
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <ExpGain
        visible={expNotice.visible}
        amount={expNotice.amount}
        onComplete={() => setExpNotice((prev) => ({ ...prev, visible: false }))}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#04120e",
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: 44,
    alignItems: "center",
  },
  pageContainer: {
    width: "100%",
    maxWidth: 520,
    gap: 11,
  },
  // Lumi Signboard Header
  signboardCard: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#14211b",
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: "#a37e3c",
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 5,
  },
  rivet: {
    position: "absolute",
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#d4a84f",
    opacity: 0.85,
  },
  rivetTL: { top: 6, left: 6 },
  rivetTR: { top: 6, right: 6 },
  rivetBL: { bottom: 6, left: 6 },
  rivetBR: { bottom: 6, right: 6 },
  lumiPortraitRing: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#092b20",
    borderWidth: 2,
    borderColor: "#d4a84f",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  lumiPortraitGlow: {
    position: "absolute",
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(52, 211, 153, 0.2)",
  },
  lumiPortraitImg: {
    width: 44,
    height: 44,
  },
  signboardTextCol: {
    flex: 1,
    gap: 2,
  },
  signboardTitle: {
    fontSize: 16.5,
    fontWeight: "800",
    color: "#fde047",
    letterSpacing: -0.2,
  },
  signboardQuote: {
    fontSize: 11.5,
    color: "#cbd5e1",
    fontStyle: "italic",
    lineHeight: 15,
  },
  toastBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(16, 185, 129, 0.16)",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.45)",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  toastBannerText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: colors.emeraldLight,
    flex: 1,
  },
  // 7-Day Winding Rune Trail Card
  trailCard: {
    backgroundColor: "#09241c",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#9c783b",
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 14,
    alignItems: "center",
  },
  trailTitleTag: {
    backgroundColor: "#14352a",
    borderWidth: 1,
    borderColor: "#d4a84f",
    borderRadius: radius.full,
    paddingHorizontal: 14,
    paddingVertical: 3,
    marginBottom: 10,
  },
  trailTitleTagText: {
    fontSize: 11.5,
    fontWeight: "800",
    color: "#fef08a",
    letterSpacing: 0.3,
  },
  trailPathContainer: {
    width: "100%",
    position: "relative",
    paddingVertical: 6,
    justifyContent: "center",
  },
  trailCurveSvg: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 48,
    width: "100%",
  },
  trailNodesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  trailNodeWrap: {
    flex: 1,
    alignItems: "center",
    gap: 5,
  },
  runeStoneOrb: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#15231e",
    borderWidth: 1.5,
    borderColor: "#8c6d37",
    alignItems: "center",
    justifyContent: "center",
  },
  runeStoneOrbDone: {
    backgroundColor: "#0f7657",
    borderColor: "#34d399",
  },
  runeStoneOrbToday: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#34d399",
    borderWidth: 2,
    borderColor: "#fde047",
    shadowColor: "#fde047",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 8,
    elevation: 6,
  },
  runeStoneNum: {
    fontFamily: fonts.uiBold,
    fontSize: 11,
    fontWeight: "800",
    color: "#cbd5e1",
  },
  runeDayLabel: {
    fontFamily: fonts.uiSemiBold,
    fontSize: 10.5,
    fontWeight: "600",
    color: "#94a3b8",
  },
  runeDayLabelDone: {
    color: "#6ee7b7",
    fontWeight: "700",
  },
  runeDayLabelToday: {
    color: "#fde047",
    fontWeight: "900",
  },
  loadingBox: {
    paddingVertical: spacing.xxxl,
    alignItems: "center",
  },
  // Active Goals Header & Add Plaque
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 2,
  },
  sectionTitleGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#f8fafc",
  },
  addPlaqueBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#3e2e16",
    borderWidth: 1.5,
    borderColor: "#d4a84f",
    paddingVertical: 5,
    paddingHorizontal: 11,
    borderRadius: 10,
  },
  addPlaqueBtnText: {
    fontSize: 11.5,
    fontWeight: "800",
    color: "#fef08a",
  },
  emptyCard: {
    backgroundColor: "#0a2019",
    borderRadius: 14,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: "#8c6d37",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 18,
  },
  // Guild Charter Cards
  chartersList: {
    gap: 8,
  },
  charterCard: {
    backgroundColor: "#0a2019",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#8c6d37",
    paddingHorizontal: 10,
    paddingVertical: 9,
    gap: 6,
  },
  charterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  charterMedallionWrap: {
    position: "relative",
    width: 46,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
  },
  charterMedallionRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#051410",
    borderWidth: 1.5,
    borderColor: "#d4a84f",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  floatingExpTag: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#422c0c",
    borderWidth: 1,
    borderColor: "#fde047",
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  floatingExpText: {
    fontFamily: fonts.uiExtraBold,
    fontSize: 10,
    fontWeight: "900",
    color: "#fef08a",
  },
  charterTextCol: {
    flex: 1,
    gap: 2,
  },
  charterTitle: {
    fontFamily: fonts.uiBold,
    fontSize: 14,
    fontWeight: "700",
    color: "#fefce8",
    lineHeight: 19,
  },
  charterSub: {
    fontFamily: fonts.ui,
    fontSize: 11.5,
    color: "#94a3b8",
    lineHeight: 15.5,
  },
  charterActionsCol: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  charterInfoBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  archivePlaqueBtn: {
    backgroundColor: "#2d2415",
    borderWidth: 1,
    borderColor: "#a37e3c",
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  archivePlaqueText: {
    fontFamily: fonts.uiBold,
    fontSize: 11,
    fontWeight: "700",
    color: "#fef08a",
  },
  charterLoreDrawer: {
    borderTopWidth: 1,
    borderTopColor: "rgba(212, 168, 79, 0.2)",
    paddingTop: 6,
    gap: 3,
  },
  charterLoreDesc: {
    fontFamily: fonts.ui,
    fontSize: 12,
    color: "#cbd5e1",
    lineHeight: 16.5,
  },
  charterEvidenceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  charterEvidenceText: {
    fontFamily: fonts.uiSemiBold,
    fontSize: 11,
    fontWeight: "600",
    color: colors.emeraldLight,
  },
  // Collapsible Bottom Wooden Drawer: Đã Lưu Xem Sau
  savedDrawerWrapper: {
    backgroundColor: "#14201b",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#8c6d37",
    overflow: "hidden",
  },
  savedDrawerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  savedHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  savedDrawerTitle: {
    fontSize: 12.5,
    fontWeight: "800",
    color: "#fef08a",
  },
  savedDrawerBody: {
    borderTopWidth: 1,
    borderTopColor: "rgba(212, 168, 79, 0.25)",
    padding: 10,
    gap: 8,
    backgroundColor: "#0a1914",
  },
  savedEmptyHint: {
    fontSize: 11,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 16,
  },
  savedGoalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(16, 42, 34, 0.8)",
    borderRadius: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  savedGoalMeta: {
    flex: 1,
  },
  savedGoalTitle: {
    fontSize: 12.5,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  savedGoalSub: {
    fontFamily: fonts.ui,
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  activateGoalBtn: {
    backgroundColor: "rgba(16, 185, 129, 0.2)",
    borderWidth: 1,
    borderColor: colors.emeraldLight,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  activateGoalBtnText: {
    fontFamily: fonts.uiBold,
    fontSize: 11,
    fontWeight: "800",
    color: colors.emeraldLight,
  },
  disclaimerFootnote: {
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 4,
    alignItems: "center",
    marginTop: 2,
  },
  disclaimerFootnoteText: {
    fontFamily: fonts.ui,
    fontSize: 11,
    color: "#64748b",
    lineHeight: 15,
    flex: 1,
  },
  // Modal styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#071f1a",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.md,
    maxHeight: "88%",
    borderWidth: 1,
    borderColor: "#10b981",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  modalHeaderTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  modalLumiImg: {
    width: 36,
    height: 36,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#ffffff",
  },
  modalSub: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  modalCloseBtn: {
    padding: 6,
  },
  modalScroll: {
    marginTop: 4,
  },
  fieldHeadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  fieldSectionHeading: {
    fontFamily: fonts.uiExtraBold,
    fontSize: 11.5,
    fontWeight: "800",
    color: "#fef08a",
    letterSpacing: 0.4,
    flexShrink: 1,
  },
  presetsContainer: {
    gap: 6,
  },
  presetPill: {
    backgroundColor: "rgba(16, 185, 129, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.3)",
    borderRadius: radius.md,
    padding: 10,
  },
  presetPillRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  presetTitleText: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#ffffff",
    flex: 1,
    marginRight: 8,
  },
  presetExpText: {
    fontSize: 10.5,
    fontWeight: "800",
    color: colors.gold,
  },
  presetCategoryText: {
    fontSize: 10.5,
    color: colors.emeraldLight,
    marginTop: 2,
  },
  inputLabel: {
    fontSize: 11.5,
    fontWeight: "700",
    color: colors.textSecondary,
    marginBottom: 4,
    marginTop: 6,
  },
  textInput: {
    backgroundColor: "#061814",
    borderWidth: 1,
    borderColor: "rgba(52, 211, 153, 0.4)",
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: "#ffffff",
  },
  pillSelectorRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 4,
  },
  choicePill: {
    backgroundColor: "#061814",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.full,
  },
  choicePillActive: {
    backgroundColor: "#10b981",
    borderColor: "#fef08a",
  },
  choicePillText: {
    fontSize: 11.5,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  choicePillTextActive: {
    color: "#042f2e",
    fontWeight: "800",
  },
  targetRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  habitErrorText: {
    color: "#fda4af",
    fontSize: 11.5,
    fontWeight: "700",
    marginTop: 8,
  },
  submitModalBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#10b981",
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: "#fef08a",
    paddingVertical: 14,
    marginTop: spacing.md,
    marginBottom: spacing.xxl,
  },
  submitModalBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#042f2e",
    letterSpacing: 0.3,
  },
  aiSuggestTriggerBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "rgba(16, 185, 129, 0.16)",
    borderWidth: 1,
    borderColor: "#34d399",
    borderRadius: radius.md,
    paddingVertical: 9,
    marginBottom: 10,
  },
  aiSuggestTriggerText: {
    fontSize: 12.5,
    fontWeight: "800",
    color: "#fef08a",
  },
  aiPresetsBox: {
    marginBottom: 10,
  },
});
