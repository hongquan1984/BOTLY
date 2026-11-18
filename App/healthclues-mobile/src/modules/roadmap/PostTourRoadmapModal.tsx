import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
  DeviceEventEmitter,
  ActivityIndicator,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import {
  Sparkles,
  Check,
  CheckCircle2,
  Plus,
  X,
  Edit3,
  Calendar,
  Flame,
  Droplets,
  Apple,
  Activity,
  Moon,
  Heart,
  ArrowRight,
  ShieldCheck,
} from "lucide-react-native";
import { useLocale } from "@/localization";
import {
  AiSuggestedGoal,
  STARTER_PROFILE_KEY,
  USER_GOALS_KEY,
  buildLocalPersonalizedGoals,
  MobileHealthProfile,
} from "../../services/onboarding";
import type { MobileWellnessGoal } from "../../hooks/useWorld";

export const POST_TOUR_ROADMAP_REVIEWED_KEY = "healthclues-post-tour-roadmap-reviewed-v1";

interface PostTourRoadmapModalProps {
  visible: boolean;
  onClose: () => void;
  onSavedGoals?: (savedCount: number) => void;
}

export function PostTourRoadmapModal({
  visible,
  onClose,
  onSavedGoals,
}: PostTourRoadmapModalProps) {
  const { locale } = useLocale();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [goals, setGoals] = useState<AiSuggestedGoal[]>([]);
  const [selectedMap, setSelectedMap] = useState<Record<string, boolean>>({});
  const [selectedOptions, setSelectedOptions] = useState<Record<string, "A" | "B">>({});
  const [customActionText, setCustomActionText] = useState<Record<string, string>>({});
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);

  // Extra user-added custom habits
  const [extraHabits, setExtraHabits] = useState<string[]>([]);
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [newCustomInput, setNewCustomInput] = useState("");

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load user profile & generate AI goals when modal opens
  useEffect(() => {
    if (!visible) return;

    let isMounted = true;
    const loadData = async () => {
      try {
        let loadedProfile: any = null;
        const rawProfile = await AsyncStorage.getItem(STARTER_PROFILE_KEY);
        if (rawProfile) {
          try {
            loadedProfile = JSON.parse(rawProfile);
          } catch {}
        }
        if (!loadedProfile) {
          const rawQuiz = await AsyncStorage.getItem("healthclues-quiz-results");
          if (rawQuiz) {
            try {
              loadedProfile = JSON.parse(rawQuiz);
            } catch {}
          }
        }
        if (!loadedProfile && typeof window !== "undefined") {
          try {
            const lsQuiz = window.localStorage.getItem("healthclues-quiz-results");
            if (lsQuiz) loadedProfile = JSON.parse(lsQuiz);
          } catch {}
        }

        if (isMounted) {
          setProfile(loadedProfile);
        }

        // Generate AI suggested goals
        let profileForGoals: MobileHealthProfile;
        if (loadedProfile?.profile?.adaptiveDiscovery) {
          profileForGoals = loadedProfile.profile;
        } else if (loadedProfile?.adaptiveDiscovery) {
          profileForGoals = loadedProfile;
        } else {
          const concernLabel =
            loadedProfile?.title ||
            loadedProfile?.category ||
            loadedProfile?.topic ||
            loadedProfile?.concernNote ||
            "Sức khỏe toàn diện";
          profileForGoals = {
            topic: concernLabel,
            contentPreferences: [],
            presentation: "",
            comfortableActivityTime: "",
            refreshFrequency: "",
            twoWeekGoal: "",
            createdAt: new Date().toISOString(),
            safetyLevel: "caution",
            specificInterests: [],
            safetyContext: {
              foodAllergy: "unknown",
              foodRestriction: "unknown",
              professionalRestriction: "unknown",
              activityRestriction: "unknown",
              medicationOrSupplement: "unknown",
              acutePainfulJoint: "unknown",
              urgentSymptoms: "unknown",
              fluidRestriction: "unknown",
            },
            adaptiveDiscovery: {
              schemaVersion: 1,
              ageConfirmed: true,
              focusId: "health-concern",
              focusLabel: concernLabel,
              concernDetail: loadedProfile?.concernNote || concernLabel,
              answers: [],
            },
          };
        }

        const generated = buildLocalPersonalizedGoals(profileForGoals);
        if (isMounted) {
          setGoals(generated);
          // Pre-select all suggested goals by default with option A
          const sel: Record<string, boolean> = {};
          const opts: Record<string, "A" | "B"> = {};
          generated.forEach((g) => {
            sel[g.goalId] = true;
            opts[g.goalId] = "A";
          });
          setSelectedMap(sel);
          setSelectedOptions(opts);
        }
      } catch (e) {
        console.warn("Failed to load roadmap profile:", e);
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, [visible]);

  const userConcernName =
    profile?.profile?.adaptiveDiscovery?.concernDetail ||
    profile?.profile?.adaptiveDiscovery?.focusLabel ||
    profile?.adaptiveDiscovery?.concernDetail ||
    profile?.adaptiveDiscovery?.focusLabel ||
    profile?.profile?.topic ||
    profile?.topic ||
    profile?.profile?.concernNote ||
    profile?.concernNote ||
    profile?.title ||
    "Sức khỏe cá nhân";

  const selectedCount =
    goals.filter((g) => selectedMap[g.goalId]).length + extraHabits.length;

  const toggleSelectGoal = (id: string) => {
    setSelectedMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const setOptionForGoal = (id: string, opt: "A" | "B") => {
    setSelectedOptions((prev) => ({ ...prev, [id]: opt }));
    setSelectedMap((prev) => ({ ...prev, [id]: true }));
  };

  const handleAddExtra = () => {
    const trimmed = newCustomInput.trim();
    if (!trimmed) return;
    setExtraHabits((prev) => [...prev, trimmed]);
    setNewCustomInput("");
    setShowAddCustom(false);
  };

  const handleRemoveExtra = (idx: number) => {
    setExtraHabits((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSaveToJourney = async () => {
    if (selectedCount === 0) return;
    setSaving(true);

    try {
      // Map AI suggested goals to canonical MobileWellnessGoal format
      const convertedGoals: MobileWellnessGoal[] = [];

      goals.forEach((g) => {
        if (!selectedMap[g.goalId]) return;
        const opt = selectedOptions[g.goalId] || "A";
        const chosenOption = opt === "A" ? g.optionA : g.optionB;
        const customText = customActionText[g.goalId]?.trim();

        const title = customText || chosenOption.action.vi || chosenOption.title.vi;
        convertedGoals.push({
          id: `goal-${g.goalId}-${Date.now().toString(36)}`,
          title,
          category:
            g.category === "hydration"
              ? "Uống Nước"
              : g.category === "movement"
              ? "Vận Động"
              : g.category === "nutrition"
              ? "Dinh Dưỡng"
              : g.category === "sleep"
              ? "Giấc Ngủ"
              : "Sống Khỏe",
          status: "active",
          target: "Hằng ngày",
          unit: "lần/ngày",
          daysPerWeek: 7,
          expValue: 15,
          description: g.relevanceReason.vi,
          evidence: g.advisorProof || "Khuyến nghị từ AI HealthClues",
        });
      });

      // Add extra custom habits
      extraHabits.forEach((habitText, idx) => {
        convertedGoals.push({
          id: `extra-custom-${Date.now()}-${idx}`,
          title: habitText,
          category: "Thói Quen Tự Chọn",
          status: "active",
          target: "Tự chọn",
          unit: "hằng ngày",
          daysPerWeek: 7,
          expValue: 15,
          description: `Thói quen cá nhân hóa thiết lập theo mục tiêu "${userConcernName}".`,
          evidence: "Người dùng tự thiết lập",
        });
      });

      // Save to AsyncStorage
      await AsyncStorage.setItem(USER_GOALS_KEY, JSON.stringify(convertedGoals));
      await AsyncStorage.setItem(POST_TOUR_ROADMAP_REVIEWED_KEY, "true");

      // Notify other parts of the app (like useWorld & journey)
      DeviceEventEmitter.emit("HEALTHCLUES_GOALS_UPDATED");

      if (onSavedGoals) {
        onSavedGoals(convertedGoals.length);
      }

      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setSaving(false);
        onClose();
      }, 1400);
    } catch (e) {
      console.warn("Failed to save roadmap goals:", e);
      setSaving(false);
    }
  };

  const handleNavigateToJourney = () => {
    onClose();
    router.push("/(game)/journey");
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.avatarGlow}>
                <Text style={{ fontSize: 24 }}>✨</Text>
              </View>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <View style={styles.titleRow}>
                  <Text style={styles.title}>
                    {locale === "en" ? "Tailored Wellness Roadmap" : "Lộ Trình Sống Khỏe Đồng Hành"}
                  </Text>
                  <View style={styles.concernBadge}>
                    <Text style={styles.concernBadgeText} numberOfLines={1}>
                      {userConcernName}
                    </Text>
                  </View>
                </View>
                <Text style={styles.subtitle}>
                  {locale === "en"
                    ? "Actionable personalized habits · Integrated into Daily Journey"
                    : "Gợi ý AI cá nhân hóa thiết thực · Đưa vào Hành Trình Hằng Ngày"}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              accessibilityLabel="Đóng gợi ý thói quen"
            >
              <X size={18} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {/* Intro Guidance Speech */}
          <View style={styles.introCard}>
            <Text style={styles.introSpeechText}>
              Chào bạn! Dựa trên mối quan tâm{" "}
              <Text style={{ color: "#34d399", fontWeight: "800" }}>"{userConcernName}"</Text>,
              AI Advisor đề xuất <Text style={{ color: "#fbbf24", fontWeight: "800" }}>4 thói quen cụ thể</Text>{" "}
              dưới đây để bạn bắt đầu ngay hôm nay. Hãy chọn, tùy chỉnh hoặc tự điền thêm thói quen riêng của bạn nhé!
            </Text>
          </View>

          {/* Success Overlay Toast */}
          {saveSuccess && (
            <View style={styles.successBanner}>
              <CheckCircle2 size={18} color="#ffffff" />
              <Text style={styles.successBannerText}>
                Đã thêm thành công {selectedCount} thói quen vào mục Hành Trình!
              </Text>
            </View>
          )}

          {/* Goal List ScrollView */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {goals.map((g, idx) => {
              const isSelected = !!selectedMap[g.goalId];
              const currentOpt = selectedOptions[g.goalId] || "A";
              const isEditing = editingGoalId === g.goalId;

              return (
                <View
                  key={g.goalId}
                  style={[
                    styles.goalItem,
                    isSelected ? styles.goalItemSelected : styles.goalItemUnselected,
                  ]}
                >
                  {/* Top Bar of Item */}
                  <View style={styles.goalTopRow}>
                    <TouchableOpacity
                      style={styles.checkboxTouch}
                      onPress={() => toggleSelectGoal(g.goalId)}
                      activeOpacity={0.7}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: isSelected }}
                    >
                      <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
                        {isSelected && <Check size={13} color="#ffffff" strokeWidth={3} />}
                      </View>
                      <View style={{ flex: 1, paddingRight: 6 }}>
                        <Text style={[styles.goalTitle, !isSelected && styles.goalTitleDim]}>
                          {idx + 1}. {g.title.vi}
                        </Text>
                        <View style={styles.categoryTag}>
                          <Text style={styles.categoryTagText}>
                            {g.category === "hydration"
                              ? "💧 Uống Nước"
                              : g.category === "movement"
                              ? "🚶 Vận Động"
                              : g.category === "nutrition"
                              ? "🥗 Dinh Dưỡng"
                              : "✦ Thói Quen"}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.editToggleBtn}
                      onPress={() => setEditingGoalId(isEditing ? null : g.goalId)}
                      accessibilityLabel="Tự điều chỉnh nội dung thói quen"
                    >
                      <Edit3 size={15} color={isEditing ? "#34d399" : "#94a3b8"} />
                    </TouchableOpacity>
                  </View>

                  {/* Scientific Relevance Reason */}
                  <View style={styles.reasonBox}>
                    <Text style={styles.reasonText}>{g.relevanceReason.vi}</Text>
                  </View>

                  {/* Inline Option A vs Option B Selector */}
                  <View style={styles.optionRow}>
                    <TouchableOpacity
                      style={[
                        styles.optionPill,
                        currentOpt === "A" && isSelected && styles.optionPillActive,
                      ]}
                      onPress={() => setOptionForGoal(g.goalId, "A")}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.optionPillLabel,
                          currentOpt === "A" && isSelected && styles.optionPillLabelActive,
                        ]}
                      >
                        Tùy chọn A
                      </Text>
                      <Text
                        style={[
                          styles.optionPillAction,
                          currentOpt === "A" && isSelected && styles.optionPillActionActive,
                        ]}
                        numberOfLines={2}
                      >
                        {g.optionA.action.vi}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.optionPill,
                        currentOpt === "B" && isSelected && styles.optionPillActive,
                      ]}
                      onPress={() => setOptionForGoal(g.goalId, "B")}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.optionPillLabel,
                          currentOpt === "B" && isSelected && styles.optionPillLabelActive,
                        ]}
                      >
                        Tùy chọn B
                      </Text>
                      <Text
                        style={[
                          styles.optionPillAction,
                          currentOpt === "B" && isSelected && styles.optionPillActionActive,
                        ]}
                        numberOfLines={2}
                      >
                        {g.optionB.action.vi}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Inline Custom Text Input if User wants to adjust */}
                  {isEditing && (
                    <View style={styles.inlineEditWrap}>
                      <Text style={styles.inlineEditLabel}>
                        Tự chỉnh sửa thói quen theo ý bạn:
                      </Text>
                      <TextInput
                        style={styles.inlineEditInput}
                        value={customActionText[g.goalId] || (currentOpt === "A" ? g.optionA.action.vi : g.optionB.action.vi)}
                        onChangeText={(txt) =>
                          setCustomActionText((prev) => ({ ...prev, [g.goalId]: txt }))
                        }
                        placeholder="Nhập điều chỉnh riêng của bạn..."
                        placeholderTextColor="#64748b"
                      />
                    </View>
                  )}
                </View>
              );
            })}

            {/* Extra Custom Added Habits */}
            {extraHabits.map((h, i) => (
              <View key={`extra-${i}`} style={styles.extraHabitItem}>
                <View style={styles.extraHabitLeft}>
                  <CheckCircle2 size={16} color="#34d399" />
                  <Text style={styles.extraHabitText}>{h}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleRemoveExtra(i)}
                  style={styles.extraRemoveBtn}
                >
                  <X size={15} color="#ef4444" />
                </TouchableOpacity>
              </View>
            ))}

            {/* Add Custom Habit Toggle & Form */}
            {showAddCustom ? (
              <View style={styles.addCustomCard}>
                <Text style={styles.addCustomHeading}>Thêm Thói Quen Riêng Của Bạn</Text>
                <TextInput
                  style={styles.addCustomInput}
                  value={newCustomInput}
                  onChangeText={setNewCustomInput}
                  placeholder="Ví dụ: Đo đường huyết lúc 7h sáng, Uống trà thảo mộc..."
                  placeholderTextColor="#64748b"
                  autoFocus
                />
                <View style={styles.addCustomActions}>
                  <TouchableOpacity
                    style={styles.addCustomCancelBtn}
                    onPress={() => setShowAddCustom(false)}
                  >
                    <Text style={styles.addCustomCancelText}>Hủy</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.addCustomConfirmBtn}
                    onPress={handleAddExtra}
                  >
                    <Text style={styles.addCustomConfirmText}>Thêm Ngay</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.addHabitDashedBtn}
                onPress={() => setShowAddCustom(true)}
                activeOpacity={0.7}
              >
                <Plus size={16} color="#34d399" />
                <Text style={styles.addHabitDashedText}>
                  + Tự Điền / Thêm Thói Quen Riêng Của Bạn
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>

          {/* Bottom Action Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.saveBtn,
                (selectedCount === 0 || saving) && styles.saveBtnDisabled,
              ]}
              onPress={handleSaveToJourney}
              disabled={selectedCount === 0 || saving}
              activeOpacity={0.8}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Sparkles size={16} color="#ffffff" />
                  <Text style={styles.saveBtnText}>
                    Lưu Vào Hành Trình Nhắc Nhở Hàng Ngày ({selectedCount})
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.skipBtn}
              onPress={handleNavigateToJourney}
              activeOpacity={0.7}
            >
              <Text style={styles.skipBtnText}>Xem Mục Hành Trình Ngay</Text>
              <ArrowRight size={13} color="#38bdf8" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(3, 10, 8, 0.88)",
    justifyContent: "center",
    alignItems: "center",
    padding: 12,
  },
  card: {
    width: "100%",
    maxWidth: 580,
    maxHeight: "92%",
    backgroundColor: "#071b15",
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "rgba(52, 211, 153, 0.45)",
    overflow: "hidden",
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
    flexDirection: "column",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  avatarGlow: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(52, 211, 153, 0.2)",
    borderWidth: 1.5,
    borderColor: "#34d399",
    alignItems: "center",
    justifyContent: "center",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  title: {
    fontSize: 15.5,
    fontWeight: "800",
    color: "#f8fafc",
    letterSpacing: -0.2,
  },
  concernBadge: {
    backgroundColor: "rgba(52, 211, 153, 0.18)",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(52, 211, 153, 0.45)",
    maxWidth: 130,
  },
  concernBadgeText: {
    fontSize: 10.5,
    fontWeight: "800",
    color: "#34d399",
  },
  subtitle: {
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  introCard: {
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(52, 211, 153, 0.2)",
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  introSpeechText: {
    fontSize: 11.5,
    color: "#d1d5db",
    lineHeight: 16.5,
  },
  successBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#059669",
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  successBannerText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#ffffff",
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 14,
    gap: 12,
  },
  goalItem: {
    borderRadius: 14,
    borderWidth: 1.2,
    padding: 12,
  },
  goalItemSelected: {
    backgroundColor: "rgba(12, 38, 30, 0.9)",
    borderColor: "rgba(52, 211, 153, 0.4)",
  },
  goalItemUnselected: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderColor: "rgba(255, 255, 255, 0.08)",
    opacity: 0.7,
  },
  goalTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  checkboxTouch: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    flex: 1,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#64748b",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  checkboxActive: {
    backgroundColor: "#059669",
    borderColor: "#34d399",
  },
  goalTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#f8fafc",
    lineHeight: 19,
  },
  goalTitleDim: {
    color: "#94a3b8",
  },
  categoryTag: {
    alignSelf: "flex-start",
    marginTop: 3,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 5,
  },
  categoryTagText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#a7f3d0",
  },
  editToggleBtn: {
    padding: 6,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: 8,
  },
  reasonBox: {
    backgroundColor: "rgba(0, 0, 0, 0.22)",
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
    marginBottom: 8,
  },
  reasonText: {
    fontSize: 11,
    color: "#cbd5e1",
    lineHeight: 15.5,
  },
  optionRow: {
    flexDirection: "row",
    gap: 8,
  },
  optionPill: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 9,
    padding: 8,
  },
  optionPillActive: {
    backgroundColor: "rgba(52, 211, 153, 0.15)",
    borderColor: "#34d399",
  },
  optionPillLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#94a3b8",
    marginBottom: 3,
  },
  optionPillLabelActive: {
    color: "#34d399",
  },
  optionPillAction: {
    fontSize: 11,
    color: "#94a3b8",
    lineHeight: 14.5,
  },
  optionPillActionActive: {
    color: "#ffffff",
    fontWeight: "600",
  },
  inlineEditWrap: {
    marginTop: 10,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    padding: 8,
    borderRadius: 8,
  },
  inlineEditLabel: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "#fbbf24",
    marginBottom: 4,
  },
  inlineEditInput: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(52, 211, 153, 0.35)",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
    fontSize: 12,
    color: "#ffffff",
  },
  extraHabitItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(16, 185, 129, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(52, 211, 153, 0.35)",
    borderRadius: 10,
    padding: 10,
  },
  extraHabitLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  extraHabitText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#f8fafc",
    flex: 1,
  },
  extraRemoveBtn: {
    padding: 4,
  },
  addCustomCard: {
    backgroundColor: "rgba(15, 34, 28, 0.95)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(52, 211, 153, 0.4)",
    padding: 12,
    gap: 8,
  },
  addCustomHeading: {
    fontSize: 12,
    fontWeight: "800",
    color: "#34d399",
  },
  addCustomInput: {
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    color: "#ffffff",
  },
  addCustomActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
  addCustomCancelBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  addCustomCancelText: {
    fontSize: 11.5,
    color: "#94a3b8",
  },
  addCustomConfirmBtn: {
    backgroundColor: "#059669",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 6,
  },
  addCustomConfirmText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#ffffff",
  },
  addHabitDashedBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1.2,
    borderStyle: "dashed",
    borderColor: "rgba(52, 211, 153, 0.4)",
    borderRadius: 12,
    paddingVertical: 11,
    backgroundColor: "rgba(52, 211, 153, 0.05)",
  },
  addHabitDashedText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#34d399",
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
    backgroundColor: "rgba(0, 0, 0, 0.25)",
    gap: 8,
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#059669",
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  saveBtnDisabled: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    shadowOpacity: 0,
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: -0.1,
  },
  skipBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 4,
  },
  skipBtnText: {
    fontSize: 11.5,
    fontWeight: "600",
    color: "#38bdf8",
  },
});
