import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import Svg, { Circle as SvgCircle } from "react-native-svg";
import * as Haptics from "expo-haptics";
import {
  Check,
  Sparkles,
  Flame,
  Info,
  BookOpen,
  CheckCircle2,
} from "lucide-react-native";
import { colors, fonts, spacing, radius } from "@/theme";
import { TopHud } from "@/components/common/TopHud";
import { HabitIconBox } from "@/components/game/HabitIconBox";
import { CheckinCelebrationModal } from "@/components/game/CheckinCelebrationModal";
import { ExpGain } from "@/components/game/ExpGain";
import { useAuth } from "@/hooks/useAuth";
import { useWorld } from "@/hooks/useWorld";
import { playSfx } from "@/services/gameAudio";

/**
 * Daily Care RPG Quest Board: 1-tap rune Check Seal per mission + bottom hero confirmation CTA.
 */
export default function DailyCareScreen() {
  const { height: screenHeight } = useWindowDimensions();
  const isCompactViewport = screenHeight < 480;
  const { isAuthenticated } = useAuth();
  const {
    activeGoals,
    xpTotal,
    currencies,
    loading,
    refreshing,
    refreshWorld,
    todayCheckin,
    submitHabitCheckin,
  } = useWorld(isAuthenticated);

  const [statuses, setStatuses] = useState<Record<string, "done" | "not_yet" | "skipped">>({});
  const [expandedDetails, setExpandedDetails] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitFeedback, setSubmitFeedback] = useState<string | null>(null);
  const [expFeedback, setExpFeedback] = useState<{ visible: boolean; amount: number }>({
    visible: false,
    amount: 10,
  });
  const [celebrationModal, setCelebrationModal] = useState<{
    visible: boolean;
    stars: number;
    expAwarded: number;
    streakDays: number;
  }>({
    visible: false,
    stars: 5,
    expAwarded: 35,
    streakDays: 3,
  });

  // Synchronize saved daily check-in statuses or default to not_yet
  useEffect(() => {
    if (todayCheckin?.submitted && todayCheckin?.statuses && Object.keys(todayCheckin.statuses).length > 0) {
      setStatuses(todayCheckin.statuses);
    } else {
      setStatuses((prev) => {
        let changed = false;
        const next = { ...prev };
        activeGoals.forEach((g) => {
          if (!next[g.id]) {
            next[g.id] = "not_yet";
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    }
  }, [todayCheckin, activeGoals]);

  const handleToggleQuestTick = (goalId: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    void playSfx("seal");
    setStatuses((prev) => ({
      ...prev,
      [goalId]: prev[goalId] === "done" ? "not_yet" : "done",
    }));
  };

  const toggleExpand = (goalId: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setExpandedDetails((prev) => ({
      ...prev,
      [goalId]: !prev[goalId],
    }));
  };

  const doneGoals = activeGoals.filter((g) => statuses[g.id] === "done");
  const doneCount = doneGoals.length;
  const totalCount = activeGoals.length;
  const progressPct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
  const earnedDailyExp = doneGoals.reduce((sum, g) => sum + (g.expValue || 10), 0);
  const totalDailyExp = activeGoals.reduce((sum, g) => sum + (g.expValue || 10), 0);

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    setSubmitFeedback(null);
    try {
      const result = await submitHabitCheckin(statuses, "Điểm danh nhiệm vụ hàng ngày");
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}

      if (result.expAwarded > 0) {
        void playSfx("success");
        setExpFeedback({ visible: true, amount: result.expAwarded });
        setSubmitFeedback(`Đã xác nhận điểm danh (+${result.expAwarded} EXP)!`);
        if (doneCount === totalCount && totalCount > 0) {
          setCelebrationModal({
            visible: true,
            stars: result.stars || 5,
            expAwarded: result.expAwarded,
            streakDays: 3,
          });
        }
      } else if (result.alreadySubmitted) {
        setSubmitFeedback("Đã cập nhật trạng thái hôm nay (EXP đã nhận trong ngày).");
      } else {
        setSubmitFeedback("Đã lưu bảng nhiệm vụ hôm nay.");
      }
    } catch (err: any) {
      console.warn("Checkin failed:", err);
      setSubmitFeedback("Không thể xác nhận lúc này. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
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
          {/* RPG Quest Board Header Signboard */}
          <View style={[styles.questBoardHeader, isCompactViewport && { paddingVertical: 7, gap: 10 }]}>
            {/* Subtle Corner Brass Rivets */}
            <View style={[styles.rivet, styles.rivetTL]} />
            <View style={[styles.rivet, styles.rivetTR]} />
            <View style={[styles.rivet, styles.rivetBL]} />
            <View style={[styles.rivet, styles.rivetBR]} />

            <View
              style={[
                styles.lumiCrestRing,
                isCompactViewport && { width: 46, height: 46, borderRadius: 23 },
              ]}
            >
              <View style={styles.lumiCrestGlow} />
              <Image
                source={require("../../assets/game/ui/lumi_fox_clean.png")}
                style={isCompactViewport ? { width: 38, height: 38 } : styles.lumiCrestImg}
                contentFit="contain"
              />
            </View>

            <View style={[styles.headerStatsCol, isCompactViewport && { gap: 4 }]}>
              <Text style={[styles.boardTitle, isCompactViewport && { fontSize: 15 }]}>
                Bảng Nhiệm Vụ Hôm Nay
              </Text>

              <View style={styles.headerBadgesRow}>
                <View style={styles.streakPill}>
                  <Flame size={12} color="#fb923c" />
                  <Text style={styles.streakPillText}>Chuỗi 3 Ngày</Text>
                </View>

                <View style={styles.progressSummaryPill}>
                  <Sparkles size={11} color="#fde047" />
                  <Text style={styles.progressSummaryText}>
                    {doneCount}/{totalCount} · +{earnedDailyExp}/{totalDailyExp} EXP
                  </Text>
                </View>
              </View>

              {/* Illuminated EXP Progress Bar */}
              <View style={styles.gaugeTrack}>
                <View style={[styles.gaugeFill, { width: `${progressPct}%` }]} />
                <Text style={styles.gaugePctText}>{progressPct}%</Text>
              </View>
            </View>
          </View>

          {/* Quest Cards List (Compact 1-Tick Right Seal Layout) */}
          {loading && !refreshing ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={colors.emeraldLight} />
            </View>
          ) : activeGoals.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>
                Chưa có nhiệm vụ nào được kích hoạt. Hãy mở tab Hành Trình để kích hoạt thói quen!
              </Text>
            </View>
          ) : (
            <View style={styles.questList}>
              {activeGoals.map((goal) => {
                const isDone = statuses[goal.id] === "done";
                const isExpanded = !!expandedDetails[goal.id];

                return (
                  <View
                    key={goal.id}
                    style={[styles.questTile, isDone && styles.questTileDone]}
                  >
                    <View style={styles.questTileInner}>
                      {/* Left Medallion */}
                      <TouchableOpacity
                        style={styles.medallionTap}
                        activeOpacity={0.85}
                        onPress={() => handleToggleQuestTick(goal.id)}
                      >
                        <View style={[styles.medallionRing, isDone && styles.medallionRingDone]}>
                          <HabitIconBox
                            title={goal.title}
                            category={goal.category}
                            size={36}
                          />
                        </View>
                      </TouchableOpacity>

                      {/* Center Column: Top badges + Info (i) sibling on right, Full 2-line Title & Goal below */}
                      <View style={styles.questCenterCol}>
                        <View style={styles.questMetaTopRow}>
                          <View style={styles.questMetaTop}>
                            <View style={styles.catChip}>
                              <Text style={styles.catChipText}>
                                {(goal.category || "SỐNG KHỎE").toUpperCase()}
                              </Text>
                            </View>
                            <View style={styles.expChip}>
                              <Sparkles size={9.5} color="#fde047" />
                              <Text style={styles.expChipText}>+{goal.expValue || 10} EXP</Text>
                            </View>
                          </View>

                          <TouchableOpacity
                            style={styles.infoIconBtn}
                            onPress={() => toggleExpand(goal.id)}
                            accessibilityRole="button"
                            accessibilityLabel={`Xem cơ chế ${goal.title}`}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                          >
                            <Info
                              size={14}
                              color={isExpanded ? colors.emeraldLight : colors.textSecondary}
                            />
                          </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                          activeOpacity={0.85}
                          onPress={() => handleToggleQuestTick(goal.id)}
                        >
                          <Text style={styles.questTitle} numberOfLines={2}>
                            {goal.title}
                          </Text>

                          <Text style={styles.questTargetText} numberOfLines={1}>
                            {goal.target || "Đều đặn"} {goal.unit || ""}
                          </Text>
                        </TouchableOpacity>
                      </View>

                      {/* Divider Seam */}
                      <View style={styles.tileDivider} />

                      {/* Right Tactile Check Seal Toggle (Ticked = Done, Unticked = Not Yet) */}
                      <View style={styles.tickSlotCol}>
                        <TouchableOpacity
                          style={[
                            styles.tickSealBtn,
                            isDone ? styles.tickSealBtnActive : styles.tickSealBtnIdle,
                          ]}
                          onPress={() => handleToggleQuestTick(goal.id)}
                          activeOpacity={0.78}
                          accessibilityRole="checkbox"
                          accessibilityState={{ checked: isDone }}
                          accessibilityLabel={`tick-quest-${goal.title}`}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          {isDone ? (
                            <View style={styles.tickSealInnerDone}>
                              <Check size={20} color="#ffffff" strokeWidth={3} />
                            </View>
                          ) : (
                            <View style={styles.tickSealInnerIdle}>
                              <Svg width={28} height={28} viewBox="0 0 28 28">
                                <SvgCircle
                                  cx={14}
                                  cy={14}
                                  r={11.5}
                                  stroke="rgba(212, 168, 79, 0.52)"
                                  strokeWidth={1.6}
                                  strokeDasharray="3.2, 3.2"
                                  fill="none"
                                />
                              </Svg>
                            </View>
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Optional Expanded Medical Lore Drawer (only opened when user taps (i)) */}
                    {isExpanded && (
                      <View style={styles.expandedDrawer}>
                        <Text style={styles.expandedDesc}>
                          {goal.description ||
                            "Thói quen lối sống chuẩn mực giúp cơ thể điều hòa chuyển hóa tự nhiên."}
                        </Text>
                        {goal.evidence && (
                          <View style={styles.evidenceTag}>
                            <BookOpen size={11} color={colors.emeraldLight} />
                            <Text style={styles.evidenceText}>Tài liệu: {goal.evidence}</Text>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}

          {/* Bottom Confirmation CTA Section */}
          {activeGoals.length > 0 && (
            <View style={styles.confirmSection}>
              {submitFeedback && (
                <View style={styles.feedbackBanner}>
                  <CheckCircle2 size={13} color={colors.emeraldLight} />
                  <Text style={styles.feedbackText}>{submitFeedback}</Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.heroConfirmBtn, submitting && { opacity: 0.72 }]}
                onPress={handleSubmit}
                disabled={submitting}
                activeOpacity={0.86}
                accessibilityRole="button"
                accessibilityLabel="Lưu điểm danh hôm nay"
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    {todayCheckin?.submitted ? (
                      <CheckCircle2 size={17} color="#fef08a" />
                    ) : (
                      <Sparkles size={16} color="#fef08a" />
                    )}
                    <Text style={styles.heroConfirmBtnText}>
                      {todayCheckin?.submitted
                        ? "CẬP NHẬT XÁC NHẬN HÔM NAY"
                        : `XÁC NHẬN HOÀN THÀNH (+${earnedDailyExp} EXP)`}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      <ExpGain
        amount={expFeedback.amount}
        visible={expFeedback.visible}
        onComplete={() => setExpFeedback({ visible: false, amount: 0 })}
      />

      <CheckinCelebrationModal
        visible={celebrationModal.visible}
        stars={celebrationModal.stars}
        expAwarded={celebrationModal.expAwarded}
        streakDays={celebrationModal.streakDays}
        onClose={() => setCelebrationModal((prev) => ({ ...prev, visible: false }))}
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
    gap: 12,
  },
  // Header Crest Card
  questBoardHeader: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#0b221b",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#a37e3c",
    paddingHorizontal: 12,
    paddingVertical: 11,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  rivet: {
    position: "absolute",
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#d4a84f",
    opacity: 0.8,
  },
  rivetTL: { top: 6, left: 6 },
  rivetTR: { top: 6, right: 6 },
  rivetBL: { bottom: 6, left: 6 },
  rivetBR: { bottom: 6, right: 6 },
  lumiCrestRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#092e22",
    borderWidth: 2,
    borderColor: "#d4a84f",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  lumiCrestGlow: {
    position: "absolute",
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(52, 211, 153, 0.22)",
  },
  lumiCrestImg: {
    width: 52,
    height: 52,
  },
  headerStatsCol: {
    flex: 1,
    gap: 6,
  },
  boardTitle: {
    fontFamily: fonts.displayBold,
    fontSize: 18,
    fontWeight: "800",
    color: "#fde047",
    letterSpacing: -0.2,
  },
  headerBadgesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  streakPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(180, 83, 9, 0.28)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.55)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  streakPillText: {
    fontFamily: fonts.uiBold,
    fontSize: 11,
    fontWeight: "800",
    color: "#fed7aa",
  },
  progressSummaryPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(212, 168, 79, 0.16)",
    borderWidth: 1,
    borderColor: "rgba(253, 224, 71, 0.45)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  progressSummaryText: {
    fontFamily: fonts.uiBold,
    fontSize: 11,
    fontWeight: "800",
    color: "#fef08a",
  },
  gaugeTrack: {
    height: 16,
    borderRadius: radius.full,
    backgroundColor: "rgba(4, 15, 11, 0.9)",
    borderWidth: 1,
    borderColor: "#8c6d37",
    overflow: "hidden",
    justifyContent: "center",
    position: "relative",
  },
  gaugeFill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "#10b981",
    borderRadius: radius.full,
  },
  gaugePctText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#ffffff",
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowRadius: 2,
  },
  loadingBox: {
    padding: spacing.xl,
    alignItems: "center",
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
  questList: {
    gap: 10,
  },
  questTile: {
    backgroundColor: "#0a1f19",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#8c6d37",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  questTileDone: {
    borderColor: "#d4a84f",
    backgroundColor: "#0c2820",
  },
  questTileInner: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 72,
  },
  medallionTap: {
    paddingLeft: 10,
    paddingVertical: 10,
  },
  medallionRing: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "rgba(212, 168, 79, 0.5)",
    backgroundColor: "rgba(4, 15, 11, 0.8)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  medallionRingDone: {
    borderColor: "#34d399",
  },
  questCenterCol: {
    flex: 1,
    paddingHorizontal: 9,
    paddingVertical: 9,
    gap: 2,
  },
  questMetaTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 4,
  },
  questMetaTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    flexShrink: 1,
  },
  catChip: {
    backgroundColor: "rgba(16, 185, 129, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(52, 211, 153, 0.35)",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.full,
  },
  catChipText: {
    fontFamily: fonts.uiBold,
    fontSize: 10.5,
    fontWeight: "800",
    color: "#34d399",
    letterSpacing: 0.2,
  },
  expChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(212, 168, 79, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(253, 224, 71, 0.4)",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  expChipText: {
    fontFamily: fonts.uiBold,
    fontSize: 10.5,
    fontWeight: "800",
    color: "#fef08a",
  },
  questTitle: {
    fontFamily: fonts.uiBold,
    fontSize: 14,
    fontWeight: "700",
    color: "#f8fafc",
    lineHeight: 19,
  },
  questTargetText: {
    fontFamily: fonts.uiMedium,
    fontSize: 11.5,
    color: "#94a3b8",
    marginTop: 2,
  },
  infoIconBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  tileDivider: {
    width: 1,
    alignSelf: "stretch",
    backgroundColor: "rgba(212, 168, 79, 0.26)",
    marginVertical: 8,
  },
  tickSlotCol: {
    width: 60,
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(5, 16, 13, 0.55)",
    paddingHorizontal: 6,
  },
  tickSealBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    ...(Platform.OS === "web" ? { cursor: "pointer" as any } : {}),
  },
  tickSealBtnActive: {
    backgroundColor: "#eab308",
    borderWidth: 2,
    borderColor: "#fef08a",
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.85,
    shadowRadius: 8,
    elevation: 6,
  },
  tickSealBtnIdle: {
    backgroundColor: "#141e19",
    borderWidth: 2,
    borderColor: "#8c6d37",
  },
  tickSealInnerDone: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#10b981",
    alignItems: "center",
    justifyContent: "center",
  },
  tickSealInnerIdle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  expandedDrawer: {
    backgroundColor: "rgba(4, 14, 11, 0.78)",
    borderTopWidth: 1,
    borderTopColor: "rgba(212, 168, 79, 0.22)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 4,
  },
  expandedDesc: {
    fontSize: 11.5,
    color: "#cbd5e1",
    lineHeight: 16,
  },
  evidenceTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 2,
  },
  evidenceText: {
    fontFamily: fonts.uiMedium,
    fontSize: 11,
    fontWeight: "600",
    color: colors.emeraldLight,
  },
  confirmSection: {
    marginTop: 4,
    gap: 8,
  },
  feedbackBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "rgba(16, 185, 129, 0.14)",
    borderWidth: 1,
    borderColor: "rgba(52, 211, 153, 0.35)",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  feedbackText: {
    fontSize: 11.5,
    fontWeight: "600",
    color: colors.emeraldLight,
  },
  heroConfirmBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#0f7657",
    borderWidth: 2,
    borderColor: "#d4a84f",
    borderRadius: 16,
    paddingVertical: 13,
    paddingHorizontal: 16,
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 6,
  },
  heroConfirmBtnText: {
    fontSize: 13.5,
    fontWeight: "900",
    color: "#ffffff",
    letterSpacing: 0.4,
  },
});
