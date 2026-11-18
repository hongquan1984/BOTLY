import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import {
  Search,
  CheckCircle2,
  AlertCircle,
  Coins,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  X,
  FileQuestion,
  ShieldCheck,
  Star,
  Award,
} from "lucide-react-native";
import {
  MobileDetectiveCase,
  DETECTIVE_CASES,
  getSolvedCaseIds,
  recordCaseSolved,
} from "./detectiveService";
import { playDolphinChirp, playDolphinWhistle } from "../audio/dolphinAudio";
import { useEconomy } from "../economy/useEconomy";

interface DetectiveMobileLauncherProps {
  visible: boolean;
  onClose: () => void;
}

export function DetectiveMobileLauncher({
  visible,
  onClose,
}: DetectiveMobileLauncherProps) {
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(width - 24, 460);
  const { coins, addCoins, addExp } = useEconomy();

  const [solvedIds, setSolvedIds] = useState<string[]>([]);
  const [selectedCase, setSelectedCase] = useState<MobileDetectiveCase | null>(null);
  const [selectedClueIndex, setSelectedClueIndex] = useState<number | null>(null);
  const [selectedAnswerId, setSelectedAnswerId] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const [earnedCoins, setEarnedCoins] = useState<number>(0);

  useEffect(() => {
    if (visible) {
      getSolvedCaseIds().then(setSolvedIds);
      setSelectedCase(null);
      setSelectedClueIndex(null);
      setSelectedAnswerId(null);
      setSubmitted(false);
    }
  }, [visible]);

  const handleOpenCase = (c: MobileDetectiveCase) => {
    playDolphinChirp(0.35);
    setSelectedCase(c);
    setSelectedClueIndex(0);
    setSelectedAnswerId(null);
    setSubmitted(false);
  };

  const handleSelectAnswer = (ansId: string) => {
    playDolphinChirp(0.3);
    setSelectedAnswerId(ansId);
  };

  const handleSubmitConclusion = async () => {
    if (!selectedCase || !selectedAnswerId) return;
    const choice = selectedCase.culpritOptions.find((o) => o.id === selectedAnswerId);
    if (!choice) return;

    setSubmitted(true);
    if (choice.isCorrect) {
      setIsCorrect(true);
      playDolphinWhistle(0.45);
      const res = await recordCaseSolved(selectedCase, 3);
      setEarnedCoins(res.coinsEarned);
      const nextSolved = await getSolvedCaseIds();
      setSolvedIds(nextSolved);
    } else {
      setIsCorrect(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.mainCard, { width: cardWidth }]}>
          {/* Header Bar */}
          <View style={styles.headerBar}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIconBox}>
                <Search size={18} color="#38bdf8" />
              </View>
              <View>
                <Text style={styles.headerTitle}>Hồ Sơ Thám Tử Cơ Thể</Text>
                <Text style={styles.headerSubtitle}>Làng Sống Khỏe · Điều Tra & Giải Mã</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Đóng văn phòng thám tử"
            >
              <X size={18} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {/* Lore Banner */}
          {!selectedCase && (
            <View style={styles.loreBanner}>
              <View style={styles.loreIconCol}>
                <FileQuestion size={22} color="#fbbf24" />
              </View>
              <View style={styles.loreTextCol}>
                <Text style={styles.loreBannerTitle}>
                  Ngôi làng không có bác sĩ!
                </Text>
                <Text style={styles.loreBannerBody}>
                  Gần đây dân làng hay bị mất ngủ, những cơn đau nhức bí ẩn... Giúp dân làng giải
                  mã để nhận thù lao <Text style={styles.highlightCoins}>Xu Vàng (Coins 🪙)</Text>{" "}
                  trang trí Ngôi Nhà 3D của bạn nhé!
                </Text>
              </View>
            </View>
          )}

          {/* Body Content */}
          <ScrollView style={styles.bodyScroll} contentContainerStyle={styles.bodyScrollInner}>
            {!selectedCase ? (
              // DANH SÁCH VỤ ÁN
              <View style={styles.casesList}>
                <Text style={styles.sectionHeading}>HỒ SƠ CÁC VỤ ÁN CẦN GIẢI MÃ ({DETECTIVE_CASES.length})</Text>

                {DETECTIVE_CASES.map((c, idx) => {
                  const isSolved = solvedIds.includes(c.id);
                  return (
                    <TouchableOpacity
                      key={c.id}
                      style={[styles.caseCard, isSolved && styles.caseCardSolved]}
                      activeOpacity={0.8}
                      onPress={() => handleOpenCase(c)}
                      accessibilityRole="button"
                      accessibilityLabel={`Mở vụ án ${c.title}`}
                    >
                      <View style={styles.caseTopRow}>
                        <View style={styles.caseBadge}>
                          <Text style={styles.caseBadgeText}>{c.topicLabel}</Text>
                        </View>
                        {isSolved ? (
                          <View style={styles.solvedBadge}>
                            <CheckCircle2 size={12} color="#34d399" />
                            <Text style={styles.solvedBadgeText}>ĐÃ GIẢI MÃ</Text>
                          </View>
                        ) : (
                          <View style={styles.rewardPill}>
                            <Coins size={12} color="#fbbf24" />
                            <Text style={styles.rewardPillText}>+{c.coinReward} Xu</Text>
                          </View>
                        )}
                      </View>

                      <Text style={styles.caseTitle}>
                        Vụ {idx + 1}: {c.title}
                      </Text>
                      <Text style={styles.caseVictim}>Nạn nhân: {c.victim}</Text>
                      <Text style={styles.caseDesc} numberOfLines={2}>
                        {c.description}
                      </Text>

                      <View style={styles.caseActionRow}>
                        <Text style={styles.caseActionText}>
                          {isSolved ? "Xem lại hồ sơ & giải mã" : "Bắt đầu khám nghiệm hiện trường"}
                        </Text>
                        <ArrowRight size={14} color={isSolved ? "#6ee7b7" : "#38bdf8"} />
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              // CHI TIẾT VỤ ÁN ĐANG ĐIỀU TRA
              <View style={styles.caseDetail}>
                <TouchableOpacity
                  style={styles.backBtn}
                  onPress={() => setSelectedCase(null)}
                  activeOpacity={0.7}
                >
                  <ArrowLeft size={14} color="#94a3b8" />
                  <Text style={styles.backBtnText}>Quay lại danh sách hồ sơ</Text>
                </TouchableOpacity>

                <View style={styles.activeCaseHeader}>
                  <Text style={styles.activeCaseTopic}>{selectedCase.topicLabel}</Text>
                  <Text style={styles.activeCaseTitle}>{selectedCase.title}</Text>
                  <Text style={styles.activeCaseScene}>📍 Hiện trường: {selectedCase.sceneName}</Text>
                </View>

                {/* Tóm tắt tình trạng nạn nhân */}
                <View style={styles.victimBox}>
                  <Text style={styles.victimBoxTitle}>Hồ Sơ Nạn Nhân: {selectedCase.victim}</Text>
                  <Text style={styles.victimBoxDesc}>{selectedCase.description}</Text>
                </View>

                {/* Manh Mối Thu Thập Được */}
                <Text style={styles.sectionHeading}>CÁC MANH MỐI TẠI HIỆN TRƯỜNG ({selectedCase.clues.length})</Text>
                <View style={styles.cluesGrid}>
                  {selectedCase.clues.map((clue, idx) => {
                    const isSelected = selectedClueIndex === idx;
                    return (
                      <TouchableOpacity
                        key={clue.id}
                        style={[styles.clueCard, isSelected && styles.clueCardActive]}
                        activeOpacity={0.8}
                        onPress={() => setSelectedClueIndex(idx)}
                      >
                        <View style={styles.clueHeaderRow}>
                          <Text style={styles.clueNum}>Manh mối #{idx + 1}</Text>
                          {clue.isKey && (
                            <View style={styles.keyClueBadge}>
                              <Sparkles size={10} color="#fbbf24" />
                              <Text style={styles.keyClueText}>Trọng yếu</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.clueTitle}>{clue.title}</Text>
                        <Text style={styles.clueDesc}>{clue.description}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Bảng Suy Luận Kết Luận */}
                <Text style={[styles.sectionHeading, { marginTop: 14 }]}>KẾT LUẬN NGUYÊN NHÂN CƠ THỂ</Text>
                <View style={styles.optionsList}>
                  {selectedCase.culpritOptions.map((opt) => {
                    const isChosen = selectedAnswerId === opt.id;
                    return (
                      <TouchableOpacity
                        key={opt.id}
                        style={[
                          styles.optionBtn,
                          isChosen && styles.optionBtnChosen,
                          submitted && opt.isCorrect && styles.optionBtnCorrect,
                          submitted && isChosen && !opt.isCorrect && styles.optionBtnWrong,
                        ]}
                        activeOpacity={0.85}
                        disabled={submitted && isCorrect}
                        onPress={() => handleSelectAnswer(opt.id)}
                      >
                        <View style={styles.optionRadio}>
                          {isChosen && <View style={styles.optionRadioDot} />}
                        </View>
                        <Text style={styles.optionText}>{opt.text}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Phản Hồi Sau Khi Gửi */}
                {submitted && (
                  <View
                    style={[
                      styles.feedbackBox,
                      isCorrect ? styles.feedbackBoxSuccess : styles.feedbackBoxError,
                    ]}
                  >
                    <View style={styles.feedbackHeader}>
                      {isCorrect ? (
                        <>
                          <Award size={18} color="#34d399" />
                          <Text style={styles.feedbackTitleSuccess}>GIẢI MÃ THÀNH CÔNG! (3 ⭐)</Text>
                        </>
                      ) : (
                        <>
                          <AlertCircle size={18} color="#f87171" />
                          <Text style={styles.feedbackTitleError}>CHƯA CHÍNH XÁC</Text>
                        </>
                      )}
                    </View>
                    <Text style={styles.feedbackBody}>
                      {selectedCase.culpritOptions.find((o) => o.id === selectedAnswerId)?.explanation}
                    </Text>

                    {isCorrect && (
                      <View style={{ marginTop: 12, gap: 8 }}>
                        <View style={styles.congratsRow}>
                          <Coins size={16} color="#fbbf24" />
                          <Text style={styles.congratsCoins}>+{earnedCoins} Xu Vàng</Text>
                          <Text style={styles.congratsExp}>+{selectedCase.expReward} EXP</Text>
                        </View>

                        <TouchableOpacity
                          style={styles.doneAndCloseBtn}
                          activeOpacity={0.85}
                          onPress={onClose}
                          accessibilityRole="button"
                          accessibilityLabel="Hoàn thành và đóng văn phòng"
                        >
                          <CheckCircle2 size={16} color="#042f2e" />
                          <Text style={styles.doneAndCloseText}>NHẬN XU & ĐÓNG VĂN PHÒNG</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.anotherCaseBtn}
                          activeOpacity={0.8}
                          onPress={() => setSelectedCase(null)}
                          accessibilityRole="button"
                          accessibilityLabel="Khám phá vụ án khác"
                        >
                          <ArrowLeft size={14} color="#38bdf8" />
                          <Text style={styles.anotherCaseText}>Điều Tra Vụ Án Khác</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                )}

                {/* Nút gửi suy luận */}
                {(!submitted || !isCorrect) && (
                  <TouchableOpacity
                    style={[
                      styles.submitBtn,
                      !selectedAnswerId && styles.submitBtnDisabled,
                    ]}
                    disabled={!selectedAnswerId}
                    activeOpacity={0.85}
                    onPress={handleSubmitConclusion}
                  >
                    <ShieldCheck size={16} color="#042f2e" />
                    <Text style={styles.submitBtnText}>GỬI KẾT LUẬN SUY LUẬN</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(3, 10, 8, 0.88)",
    justifyContent: "center",
    alignItems: "center",
    padding: 12,
  },
  mainCard: {
    backgroundColor: "#071c17",
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "rgba(56, 189, 248, 0.35)",
    maxHeight: "92%",
    flex: 1,
    shadowColor: "#0284c7",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 12,
    overflow: "hidden",
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
    backgroundColor: "rgba(10, 30, 25, 0.95)",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(56, 189, 248, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.4)",
  },
  headerTitle: {
    color: "#f8fafc",
    fontSize: 14.5,
    fontWeight: "900",
  },
  headerSubtitle: {
    color: "#94a3b8",
    fontSize: 11,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  loreBanner: {
    flexDirection: "row",
    backgroundColor: "rgba(245, 158, 11, 0.12)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(245, 158, 11, 0.25)",
    padding: 12,
    gap: 10,
  },
  loreIconCol: {
    marginTop: 2,
  },
  loreTextCol: {
    flex: 1,
  },
  loreBannerTitle: {
    color: "#fbbf24",
    fontSize: 12.5,
    fontWeight: "900",
    marginBottom: 2,
  },
  loreBannerBody: {
    color: "#e2e8f0",
    fontSize: 11.5,
    lineHeight: 16,
  },
  highlightCoins: {
    color: "#fbbf24",
    fontWeight: "900",
  },
  bodyScroll: {
    flex: 1,
  },
  bodyScrollInner: {
    padding: 14,
  },
  sectionHeading: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  casesList: {
    gap: 10,
  },
  caseCard: {
    backgroundColor: "rgba(10, 32, 27, 0.75)",
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.25)",
    borderRadius: 14,
    padding: 14,
    gap: 6,
  },
  caseCardSolved: {
    borderColor: "rgba(52, 211, 153, 0.35)",
    backgroundColor: "rgba(6, 28, 23, 0.85)",
  },
  caseTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  caseBadge: {
    backgroundColor: "rgba(56, 189, 248, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  caseBadgeText: {
    color: "#38bdf8",
    fontSize: 10.5,
    fontWeight: "800",
  },
  solvedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(52, 211, 153, 0.18)",
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  solvedBadgeText: {
    color: "#34d399",
    fontSize: 10,
    fontWeight: "900",
  },
  rewardPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(245, 158, 11, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  rewardPillText: {
    color: "#fbbf24",
    fontSize: 10.5,
    fontWeight: "900",
  },
  caseTitle: {
    color: "#f8fafc",
    fontSize: 14.5,
    fontWeight: "900",
  },
  caseVictim: {
    color: "#94a3b8",
    fontSize: 11.5,
    fontStyle: "italic",
  },
  caseDesc: {
    color: "#cbd5e1",
    fontSize: 12,
    lineHeight: 16.5,
  },
  caseActionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 6,
    marginTop: 4,
  },
  caseActionText: {
    color: "#38bdf8",
    fontSize: 11.5,
    fontWeight: "800",
  },
  caseDetail: {
    gap: 10,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    paddingVertical: 4,
  },
  backBtnText: {
    color: "#94a3b8",
    fontSize: 11.5,
    fontWeight: "700",
  },
  activeCaseHeader: {
    backgroundColor: "rgba(0, 0, 0, 0.28)",
    padding: 12,
    borderRadius: 12,
    gap: 3,
  },
  activeCaseTopic: {
    color: "#38bdf8",
    fontSize: 11,
    fontWeight: "800",
  },
  activeCaseTitle: {
    color: "#f8fafc",
    fontSize: 16,
    fontWeight: "900",
  },
  activeCaseScene: {
    color: "#fbbf24",
    fontSize: 12,
    fontWeight: "700",
  },
  victimBox: {
    backgroundColor: "rgba(244, 63, 94, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(244, 63, 94, 0.25)",
    padding: 10,
    borderRadius: 10,
    gap: 4,
  },
  victimBoxTitle: {
    color: "#fda4af",
    fontSize: 12,
    fontWeight: "800",
  },
  victimBoxDesc: {
    color: "#fecdd3",
    fontSize: 11.5,
    lineHeight: 16,
  },
  cluesGrid: {
    gap: 8,
  },
  clueCard: {
    backgroundColor: "rgba(12, 38, 32, 0.75)",
    borderWidth: 1,
    borderColor: "rgba(52, 211, 153, 0.25)",
    borderRadius: 10,
    padding: 10,
    gap: 4,
  },
  clueCardActive: {
    borderColor: "#34d399",
    backgroundColor: "rgba(16, 185, 129, 0.18)",
  },
  clueHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  clueNum: {
    color: "#94a3b8",
    fontSize: 10.5,
    fontWeight: "700",
  },
  keyClueBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(245, 158, 11, 0.2)",
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  keyClueText: {
    color: "#fbbf24",
    fontSize: 9.5,
    fontWeight: "800",
  },
  clueTitle: {
    color: "#e2e8f0",
    fontSize: 12.5,
    fontWeight: "800",
  },
  clueDesc: {
    color: "#cbd5e1",
    fontSize: 11.5,
    lineHeight: 16,
  },
  optionsList: {
    gap: 8,
  },
  optionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(15, 35, 30, 0.8)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    padding: 12,
    borderRadius: 10,
  },
  optionBtnChosen: {
    borderColor: "#38bdf8",
    backgroundColor: "rgba(56, 189, 248, 0.15)",
  },
  optionBtnCorrect: {
    borderColor: "#34d399",
    backgroundColor: "rgba(52, 211, 153, 0.2)",
  },
  optionBtnWrong: {
    borderColor: "#f87171",
    backgroundColor: "rgba(248, 113, 113, 0.15)",
  },
  optionRadio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: "#94a3b8",
    alignItems: "center",
    justifyContent: "center",
  },
  optionRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#38bdf8",
  },
  optionText: {
    color: "#f1f5f9",
    fontSize: 12,
    lineHeight: 16.5,
    flex: 1,
    fontWeight: "600",
  },
  feedbackBox: {
    padding: 12,
    borderRadius: 12,
    gap: 6,
    marginTop: 6,
  },
  feedbackBoxSuccess: {
    backgroundColor: "rgba(16, 185, 129, 0.18)",
    borderWidth: 1,
    borderColor: "rgba(52, 211, 153, 0.45)",
  },
  feedbackBoxError: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(248, 113, 113, 0.4)",
  },
  feedbackHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  feedbackTitleSuccess: {
    color: "#34d399",
    fontSize: 13,
    fontWeight: "900",
  },
  feedbackTitleError: {
    color: "#f87171",
    fontSize: 13,
    fontWeight: "900",
  },
  feedbackBody: {
    color: "#e2e8f0",
    fontSize: 11.5,
    lineHeight: 16.5,
  },
  congratsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  congratsCoins: {
    color: "#fbbf24",
    fontSize: 12.5,
    fontWeight: "900",
  },
  congratsExp: {
    color: "#a7f3d0",
    fontSize: 12,
    fontWeight: "800",
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#38bdf8",
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 8,
    shadowColor: "#0284c7",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  submitBtnDisabled: {
    opacity: 0.45,
  },
  submitBtnText: {
    color: "#042f2e",
    fontSize: 12.5,
    fontWeight: "900",
  },
  doneAndCloseBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#10b981",
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 6,
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 3,
  },
  doneAndCloseText: {
    color: "#042f2e",
    fontSize: 12.5,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
  anotherCaseBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "rgba(56, 189, 248, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.35)",
    paddingVertical: 10,
    borderRadius: 10,
  },
  anotherCaseText: {
    color: "#38bdf8",
    fontSize: 12,
    fontWeight: "800",
  },
});
