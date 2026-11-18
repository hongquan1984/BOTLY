import React, { useState, useEffect, useRef } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
  Platform,
} from "react-native";
import {
  X,
  Sparkles,
  Wind,
  Play,
  Pause,
  RotateCcw,
  Clock,
  Plus,
  BookOpen,
  CheckCircle2,
} from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import {
  BREATH_EXERCISES,
  BreathExercise,
} from "@/services/breathworkData";
import { toolkitStorage } from "@/services/toolkitStorage";
import { colors, spacing, radius, fonts } from "@/theme";
import { useLocale } from "@/localization";

interface ZenBreathModalProps {
  visible: boolean;
  onClose: () => void;
  onAwardExp?: (amount: number, reason: string) => void;
}

const CUSTOM_HABITS_STORAGE_KEY = "healthclues_custom_habits_v1";

export const ZenBreathModal: React.FC<ZenBreathModalProps> = ({
  visible,
  onClose,
  onAwardExp,
}) => {
  const { locale } = useLocale();
  const [breathCategory, setBreathCategory] = useState<string>("all");
  const [activeExercise, setActiveExercise] = useState<BreathExercise>(
    BREATH_EXERCISES[0]
  );
  const [isBreathRunning, setIsBreathRunning] = useState<boolean>(false);
  const [breathPhaseIndex, setBreathPhaseIndex] = useState<number>(0);
  const [breathSecondsLeft, setBreathSecondsLeft] = useState<number>(4);
  const [currentCycle, setCurrentCycle] = useState<number>(1);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [savedBreathIds, setSavedBreathIds] = useState<string[]>([]);

  const breathAnim = useRef(new Animated.Value(1.0)).current;
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (visible) {
      toolkitStorage.getSavedBreathIds().then(setSavedBreathIds);
    }
  }, [visible]);

  const handleToggleSaveBreathToBag = async (exercise: BreathExercise) => {
    triggerSuccessHaptic();
    const { saved, ids } = await toolkitStorage.toggleBreath(exercise.id);
    setSavedBreathIds(ids);
    const exerciseName = locale === "en" ? (exercise.nameEn || exercise.name) : exercise.name;
    if (saved) {
      showToast(
        locale === "en"
          ? `Saved "${exerciseName}" to Bag (+10 EXP)!`
          : `Đã lưu "${exerciseName}" vào Túi Đồ (+10 EXP)!`
      );
      if (onAwardExp) {
        onAwardExp(
          10,
          locale === "en" ? `Saved ${exerciseName} to Bag` : `Lưu ${exerciseName} vào Túi Đồ`
        );
      }
    } else {
      showToast(
        locale === "en"
          ? `Removed "${exerciseName}" from Bag.`
          : `Đã bỏ "${exerciseName}" khỏi Túi Đồ.`
      );
    }
  };

  const triggerHaptic = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
  };

  const triggerPhaseHaptic = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
  };

  const triggerSuccessHaptic = () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Run breath animation on phase changes
  useEffect(() => {
    if (!isBreathRunning || !activeExercise) return;

    const phase = activeExercise.phases[breathPhaseIndex];
    if (!phase) return;

    setBreathSecondsLeft(phase.durationSec);
    triggerPhaseHaptic();

    if (phase.name === "inhale") {
      Animated.timing(breathAnim, {
        toValue: 1.45,
        duration: phase.durationSec * 1000,
        useNativeDriver: true,
      }).start();
    } else if (phase.name === "exhale") {
      Animated.timing(breathAnim, {
        toValue: 1.0,
        duration: phase.durationSec * 1000,
        useNativeDriver: true,
      }).start();
    }
  }, [isBreathRunning, breathPhaseIndex, activeExercise]);

  // Phase countdown interval
  useEffect(() => {
    if (!isBreathRunning || !activeExercise) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setBreathSecondsLeft((prev) => {
        if (prev <= 1) {
          const nextIndex =
            (breathPhaseIndex + 1) % activeExercise.phases.length;
          if (nextIndex === 0) {
            setCurrentCycle((c) => {
              const nextC = c + 1;
              if (nextC > activeExercise.cycles) {
                setIsBreathRunning(false);
                triggerSuccessHaptic();
                const exName = locale === "en" ? (activeExercise.nameEn || activeExercise.name) : activeExercise.name;
                if (onAwardExp) {
                  onAwardExp(
                    20,
                    locale === "en" ? `Completed ${exName}` : `Hoàn thành bài tập ${exName}`
                  );
                }
                showToast(
                  locale === "en"
                    ? `🎉 Excellent! Completed ${exName} (+20 EXP)!`
                    : `🎉 Hoàn thành xuất sắc bài tập ${exName} (+20 EXP)!`
                );
                return 1;
              }
              return nextC;
            });
          }
          setBreathPhaseIndex(nextIndex);
          return activeExercise.phases[nextIndex]?.durationSec ?? 4;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isBreathRunning, breathPhaseIndex, activeExercise, locale]);

  const handleStartExercise = (exercise: BreathExercise) => {
    triggerHaptic();
    setActiveExercise(exercise);
    setBreathPhaseIndex(0);
    setCurrentCycle(1);
    setBreathSecondsLeft(exercise.phases[0]?.durationSec ?? 4);
    breathAnim.setValue(1.0);
    setIsBreathRunning(true);
  };

  const handleStopExercise = () => {
    triggerHaptic();
    setIsBreathRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);
    breathAnim.setValue(1.0);
  };

  const handleAddBreathToJourney = async (exercise: BreathExercise) => {
    triggerSuccessHaptic();
    const exName = locale === "en" ? (exercise.nameEn || exercise.name) : exercise.name;
    try {
      const existing = await AsyncStorage.getItem(CUSTOM_HABITS_STORAGE_KEY);
      const habitsList = existing ? JSON.parse(existing) : [];

      const habitTitle = locale === "en" ? `Practice ${exName}` : `Tập ${exName}`;
      const isAlreadyAdded = habitsList.some((h: any) => h.title === habitTitle);

      if (!isAlreadyAdded) {
        const newHabit = {
          id: `breath_${exercise.id}_${Date.now()}`,
          title: habitTitle,
          category: exercise.category === "sleep" ? (locale === "en" ? "Sleep" : "Giấc Ngủ") : (locale === "en" ? "Relaxation" : "Thư Giãn"),
          target: locale === "en" ? (exercise.totalDurationMinEn || exercise.totalDurationMin) : exercise.totalDurationMin,
          unit: locale === "en" ? "daily" : "mỗi ngày",
          daysPerWeek: 7,
          expValue: 20,
          status: "active",
          source: "zen_sanctuary",
          createdAt: new Date().toISOString(),
        };
        habitsList.unshift(newHabit);
        await AsyncStorage.setItem(
          CUSTOM_HABITS_STORAGE_KEY,
          JSON.stringify(habitsList)
        );
      }

      if (onAwardExp) {
        onAwardExp(
          20,
          locale === "en" ? `Added '${habitTitle}' to Journey` : `Đưa '${habitTitle}' vào Hành Trình`
        );
      }
      showToast(
        locale === "en"
          ? `Added '${habitTitle}' to Journey (+20 EXP)!`
          : `Đã thêm '${habitTitle}' vào Hành Trình (+20 EXP)!`
      );
    } catch {
      showToast(
        locale === "en"
          ? `Saved '${exName}' successfully!`
          : `Đã lưu '${exName}' thành công!`
      );
    }
  };

  const filteredExercises = BREATH_EXERCISES.filter((ex) => {
    if (breathCategory === "all") return true;
    return ex.category === breathCategory;
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          {/* Header Bar */}
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderTitleRow}>
              <View style={styles.headerIconRing}>
                <Wind size={18} color="#a78bfa" />
              </View>
              <View>
                <Text style={styles.modalTitle}>
                  {locale === "en" ? "Zen Breath Pavilion" : "Thiền Đường - Hơi Thở"}
                </Text>
                <Text style={styles.modalSub}>
                  {locale === "en"
                    ? "Harvard Medical Breathwork & Mindfulness"
                    : "Luyện Thở Y Khoa Harvard & Thôi Miên"}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.modalCloseBtn}
              accessibilityRole="button"
              accessibilityLabel={locale === "en" ? "Close Zen Breath Pavilion" : "Đóng Thiền Đường"}
            >
              <X size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {/* Toast Notification */}
          {toastMsg && (
            <View style={styles.toastBox}>
              <Sparkles size={14} color="#fef08a" />
              <Text style={styles.toastText}>{toastMsg}</Text>
            </View>
          )}

          {/* Sticky Aura Guardian Top Section (Always visible above scroll) */}
          <View style={styles.guardianTopSection}>
            <View style={styles.guardianCard}>
              <View style={styles.guardianAvatarCol}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarEmoji}>🧘</Text>
                </View>
                <Text style={styles.guardianRole}>
                  {locale === "en" ? "Breath Fairy" : "Tiên Khí Tức"}
                </Text>
              </View>
              <View style={styles.guardianSpeechCol}>
                <View style={styles.guardianTitleRow}>
                  <Sparkles size={13} color="#a78bfa" />
                  <Text style={styles.guardianName}>
                    {locale === "en" ? "Breath Fairy · Aura" : "Tiên Nữ Khí Tức · Aura"}
                  </Text>
                </View>
                <Text style={styles.guardianSpeechText} numberOfLines={2}>
                  {locale === "en"
                    ? "\"Greetings, traveler! I guard the Zen Breath Pavilion. Practice breathing with me and tap '+ Save to Bag' to carry these exercises with you!\""
                    : "\"Chào lữ khách! Ta canh giữ Thiền Đường. Bạn có thể luyện thở cùng ta và bấm '+ Lưu Vào Túi Đồ' để mang theo rèn luyện nhé!\""}
                </Text>
                <View style={styles.guardianBadgeRow}>
                  <Text style={styles.guardianBadgeText}>
                    {locale === "en"
                      ? "🌿 Lower cortisol · Instant heart rate calm"
                      : "🌿 Giảm cortisol · Hạ nhịp tim tức thì"}
                  </Text>
                </View>
              </View>
            </View>

            {/* Breath Category Filter Pills */}
            <View style={styles.filterPillsRow}>
              {[
                {
                  id: "all",
                  label: locale === "en" ? `All (${BREATH_EXERCISES.length})` : `Tất Cả (${BREATH_EXERCISES.length})`,
                },
                {
                  id: "sleep",
                  label: locale === "en" ? "Deep Sleep" : "Ru Ngủ Sâu",
                },
                {
                  id: "stress",
                  label: locale === "en" ? "Stress Relief" : "Xả Stress",
                },
                {
                  id: "hypnosis",
                  label: locale === "en" ? "Hypnosis" : "Thôi Miên",
                },
              ].map((pill) => (
                <TouchableOpacity
                  key={pill.id}
                  style={[
                    styles.pillBtn,
                    breathCategory === pill.id && styles.pillBtnActive,
                  ]}
                  onPress={() => {
                    triggerHaptic();
                    setBreathCategory(pill.id);
                  }}
                >
                  <Text
                    style={[
                      styles.pillBtnText,
                      breathCategory === pill.id && styles.pillBtnTextActive,
                    ]}
                  >
                    {pill.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Interactive Breath Widget when running */}
            {isBreathRunning && activeExercise && (
              <View style={styles.breathWidgetCard}>
                <View style={styles.breathWidgetHeader}>
                  <Text style={styles.breathWidgetTitle}>
                    {locale === "en"
                      ? (activeExercise.nameEn || activeExercise.name)
                      : activeExercise.name}
                  </Text>
                  <Text style={styles.breathWidgetCycle}>
                    {locale === "en"
                      ? `Cycle: ${currentCycle}/${activeExercise.cycles}`
                      : `Chu kỳ: ${currentCycle}/${activeExercise.cycles}`}
                  </Text>
                </View>

                {/* Animated Breathing Circle */}
                <View style={styles.breathCircleContainer}>
                  <Animated.View
                    style={[
                      styles.breathCircleOuter,
                      { transform: [{ scale: breathAnim }] },
                    ]}
                  >
                    <View style={styles.breathCircleInner}>
                      <Text style={styles.breathPhaseLabel}>
                        {locale === "en"
                          ? (activeExercise.phases[breathPhaseIndex]?.labelEn ||
                              activeExercise.phases[breathPhaseIndex]?.label)
                          : activeExercise.phases[breathPhaseIndex]?.label}
                      </Text>
                      <Text style={styles.breathSecondsText}>
                        {breathSecondsLeft}s
                      </Text>
                    </View>
                  </Animated.View>
                </View>

                <Text style={styles.breathInstructionText}>
                  {locale === "en"
                    ? (activeExercise.phases[breathPhaseIndex]?.instructionEn ||
                        activeExercise.phases[breathPhaseIndex]?.instruction)
                    : activeExercise.phases[breathPhaseIndex]?.instruction}
                </Text>

                <View style={styles.breathWidgetActions}>
                  <TouchableOpacity
                    style={styles.stopBreathBtn}
                    onPress={handleStopExercise}
                  >
                    <Pause size={14} color="#f87171" />
                    <Text style={styles.stopBreathBtnText}>
                      {locale === "en" ? "Stop" : "Dừng lại"}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.resetBreathBtn}
                    onPress={() => handleStartExercise(activeExercise)}
                  >
                    <RotateCcw size={14} color="#a78bfa" />
                    <Text style={styles.resetBreathBtnText}>
                      {locale === "en" ? "Reset" : "Làm lại"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Breath Exercises List */}
            {filteredExercises.map((exercise) => {
              const isSelected = activeExercise?.id === exercise.id;
              const isSaved = savedBreathIds.includes(exercise.id);
              const exName =
                locale === "en" ? (exercise.nameEn || exercise.name) : exercise.name;
              const exCategoryLabel =
                locale === "en"
                  ? (exercise.categoryLabelEn || exercise.categoryLabel)
                  : exercise.categoryLabel;
              const exSummary =
                locale === "en"
                  ? (exercise.summaryEn || exercise.summary)
                  : exercise.summary;
              const exScientificContext =
                locale === "en"
                  ? (exercise.scientificContextEn || exercise.scientificContext)
                  : exercise.scientificContext;

              return (
                <View
                  key={exercise.id}
                  style={[
                    styles.itemCard,
                    isSelected && styles.itemCardSelected,
                  ]}
                >
                  <View style={styles.itemHeaderRow}>
                    <View style={styles.breathEmojiBox}>
                      <Text style={styles.breathEmoji}>{exercise.emoji}</Text>
                    </View>
                    <View style={{ flex: 1, paddingRight: 6 }}>
                      <View style={styles.itemCategoryRow}>
                        <Text style={styles.itemCategoryBadge}>
                          {exCategoryLabel}
                        </Text>
                      </View>
                      <Text style={styles.itemTitle}>{exName}</Text>
                      <Text style={styles.itemSubtitle}>{exSummary}</Text>
                    </View>
                  </View>

                  {/* Scientific Context */}
                  <View style={styles.scienceBox}>
                    <BookOpen size={12} color="#a78bfa" />
                    <Text style={styles.scienceText}>
                      {exScientificContext}
                    </Text>
                  </View>

                  {/* Actions Container: Responsive Two-Row Layout */}
                  <View style={styles.cardActionsContainer}>
                    <TouchableOpacity
                      style={styles.startExerciseBtn}
                      onPress={() => handleStartExercise(exercise)}
                      activeOpacity={0.8}
                    >
                      <Play size={13} color="#061a15" />
                      <Text style={styles.startExerciseBtnText}>
                        {locale === "en" ? "Practice Now" : "Luyện Thở Ngay"}
                      </Text>
                    </TouchableOpacity>

                    <View style={styles.secondaryActionsRow}>
                      <TouchableOpacity
                        style={[
                          styles.saveToBagBtn,
                          isSaved && styles.saveToBagBtnSaved,
                        ]}
                        onPress={() => handleToggleSaveBreathToBag(exercise)}
                        activeOpacity={0.8}
                        accessibilityLabel={
                          isSaved
                            ? (locale === "en" ? "Saved in Bag" : "Đã có trong túi đồ")
                            : (locale === "en" ? "Save to Bag" : "Lưu vào túi đồ")
                        }
                      >
                        {isSaved ? (
                          <>
                            <CheckCircle2 size={13} color="#34d399" />
                            <Text style={styles.saveToBagBtnTextSaved}>
                              {locale === "en" ? "Saved in Bag ✓" : "Đã Có Trong Túi Đồ ✓"}
                            </Text>
                          </>
                        ) : (
                          <>
                            <Plus size={13} color="#a78bfa" />
                            <Text style={styles.saveToBagBtnText}>
                              {locale === "en" ? "Save to Bag (+10 EXP)" : "Lưu Vào Túi Đồ (+10 EXP)"}
                            </Text>
                          </>
                        )}
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.addToJourneyBtn}
                        onPress={() => handleAddBreathToJourney(exercise)}
                        activeOpacity={0.8}
                      >
                        <Plus size={13} color="#cbd5e1" />
                        <Text style={styles.addToJourneyBtnText}>
                          {locale === "en" ? "Journey" : "Hành Trình"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(2, 10, 8, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.md,
  },
  modalCard: {
    width: "100%",
    maxWidth: 480,
    maxHeight: "90%",
    backgroundColor: "#071a15",
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: "rgba(167, 139, 250, 0.45)",
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
    backgroundColor: "rgba(6, 26, 21, 0.8)",
  },
  modalHeaderTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  headerIconRing: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(167, 139, 250, 0.15)",
    borderWidth: 1,
    borderColor: "#a78bfa",
    justifyContent: "center",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#f8fafc",
  },
  modalSub: {
    fontSize: 11,
    color: "#a78bfa",
  },
  modalCloseBtn: {
    padding: 6,
    borderRadius: radius.full,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  modalScroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 40,
  },
  toastBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(167, 139, 250, 0.2)",
    borderBottomWidth: 1,
    borderBottomColor: "#a78bfa",
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  toastText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#e2e8f0",
  },
  guardianTopSection: {
    paddingHorizontal: spacing.md,
    paddingTop: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
    backgroundColor: "rgba(5, 22, 18, 0.95)",
  },
  guardianCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(8, 38, 30, 0.75)",
    borderRadius: radius.lg,
    borderWidth: 1.2,
    borderColor: "rgba(167, 139, 250, 0.45)",
    padding: 10,
    marginBottom: 8,
    gap: spacing.sm,
  },
  guardianAvatarCol: {
    alignItems: "center",
    width: 58,
  },
  avatarCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(167, 139, 250, 0.15)",
    borderWidth: 1.5,
    borderColor: "#a78bfa",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarEmoji: {
    fontSize: 24,
  },
  guardianRole: {
    fontSize: 9.5,
    fontWeight: "700",
    color: "#a78bfa",
    marginTop: 4,
    textAlign: "center",
  },
  guardianSpeechCol: {
    flex: 1,
  },
  guardianTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  guardianName: {
    fontSize: 13,
    fontWeight: "800",
    color: "#a78bfa",
  },
  guardianSpeechText: {
    fontSize: 11.5,
    color: "#cbd5e1",
    lineHeight: 16,
    fontStyle: "italic",
  },
  guardianBadgeRow: {
    marginTop: 6,
  },
  guardianBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#c4b5fd",
  },
  breathWidgetCard: {
    backgroundColor: "rgba(16, 24, 40, 0.9)",
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: "#a78bfa",
    padding: spacing.md,
    marginBottom: spacing.md,
    alignItems: "center",
  },
  breathWidgetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: spacing.md,
  },
  breathWidgetTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#f8fafc",
  },
  breathWidgetCycle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#a78bfa",
  },
  breathCircleContainer: {
    width: 140,
    height: 140,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: spacing.sm,
  },
  breathCircleOuter: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "rgba(167, 139, 250, 0.25)",
    borderWidth: 2,
    borderColor: "#a78bfa",
    justifyContent: "center",
    alignItems: "center",
  },
  breathCircleInner: {
    alignItems: "center",
  },
  breathPhaseLabel: {
    fontSize: 12,
    fontWeight: "900",
    color: "#f8fafc",
    letterSpacing: 0.5,
  },
  breathSecondsText: {
    fontSize: 20,
    fontWeight: "900",
    color: "#a78bfa",
    marginTop: 2,
  },
  breathInstructionText: {
    fontSize: 12,
    color: "#cbd5e1",
    textAlign: "center",
    marginTop: 8,
    marginHorizontal: spacing.md,
    fontStyle: "italic",
  },
  breathWidgetActions: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.md,
  },
  stopBreathBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: "rgba(248, 113, 113, 0.15)",
    borderWidth: 1,
    borderColor: "#f87171",
  },
  stopBreathBtnText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#f87171",
  },
  resetBreathBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: "rgba(167, 139, 250, 0.15)",
    borderWidth: 1,
    borderColor: "#a78bfa",
  },
  resetBreathBtnText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#a78bfa",
  },
  filterPillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: spacing.md,
  },
  pillBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  pillBtnActive: {
    backgroundColor: "rgba(167, 139, 250, 0.2)",
    borderColor: "#a78bfa",
  },
  pillBtnText: {
    fontSize: 11.5,
    color: "#94a3b8",
    fontWeight: "600",
  },
  pillBtnTextActive: {
    color: "#a78bfa",
    fontWeight: "800",
  },
  itemCard: {
    backgroundColor: "rgba(8, 30, 24, 0.7)",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  itemCardSelected: {
    borderColor: "rgba(167, 139, 250, 0.6)",
    backgroundColor: "rgba(16, 32, 28, 0.85)",
  },
  itemHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  breathEmojiBox: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: "rgba(167, 139, 250, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  breathEmoji: {
    fontSize: 22,
  },
  itemCategoryRow: {
    marginBottom: 2,
  },
  itemCategoryBadge: {
    fontSize: 9.5,
    fontWeight: "700",
    color: "#a78bfa",
    borderWidth: 1,
    borderColor: "rgba(167, 139, 250, 0.4)",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#f8fafc",
  },
  itemSubtitle: {
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 2,
    lineHeight: 15,
  },
  scienceBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.05)",
  },
  scienceText: {
    flex: 1,
    fontSize: 10,
    color: "#64748b",
    lineHeight: 14,
    fontStyle: "italic",
  },
  cardActionsContainer: {
    marginTop: 10,
    gap: 7,
  },
  startExerciseBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#a78bfa",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.md,
  },
  startExerciseBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#061a15",
  },
  secondaryActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  saveToBagBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    borderWidth: 1,
    borderColor: "rgba(167, 139, 250, 0.4)",
    backgroundColor: "rgba(167, 139, 250, 0.12)",
    paddingHorizontal: 8,
    paddingVertical: 7,
    borderRadius: radius.md,
  },
  saveToBagBtnSaved: {
    backgroundColor: "rgba(52, 211, 153, 0.12)",
    borderColor: "rgba(52, 211, 153, 0.4)",
  },
  saveToBagBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#c4b5fd",
  },
  saveToBagBtnTextSaved: {
    fontSize: 11,
    fontWeight: "700",
    color: "#34d399",
  },
  addToJourneyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.35)",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.md,
  },
  addToJourneyBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#cbd5e1",
  },
});
