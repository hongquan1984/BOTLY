import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  DeviceEventEmitter,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Award,
  BookOpen,
  Brain,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  HelpCircle,
  Lightbulb,
  Search,
  Sparkles,
  X,
  Zap,
} from "lucide-react-native";
import { useLocale } from "@/localization";
import {
  BODY_SCIENCE_TOPICS,
  getBodyScienceTopicsForProfile,
  type BodyScienceChapter,
  type BodyScienceTopic,
} from "./bodyScienceData";

interface BodyScienceLibraryModalProps {
  visible: boolean;
  onClose: () => void;
  onOpenDetective?: () => void;
  onAwardExp?: (amount: number, reason: string) => void;
}

const STARTER_PROFILE_KEY = "healthclues-starter-profile";
const QUIZ_COMPLETED_KEY = "hc_mobile_body_science_quiz_date";
const CLUES_STORAGE_KEY = "hc_mobile_unlocked_clues";

export function BodyScienceLibraryModal({
  visible,
  onClose,
  onOpenDetective,
  onAwardExp,
}: BodyScienceLibraryModalProps) {
  const { locale } = useLocale();
  const [profile, setProfile] = useState<any>(null);
  const [selectedTopicId, setSelectedTopicId] = useState<string>("sleep-neurobiology");
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);

  // Daily Quiz State
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizAnsweredToday, setQuizAnsweredToday] = useState(false);
  const [unlockedClues, setUnlockedClues] = useState<string[]>([]);

  useEffect(() => {
    if (!visible) return;

    let isMounted = true;
    const loadState = async () => {
      try {
        let profileObj: any = null;
        const rawProfile = await AsyncStorage.getItem(STARTER_PROFILE_KEY);
        if (rawProfile) {
          try {
            profileObj = JSON.parse(rawProfile);
          } catch {}
        }
        if (!profileObj) {
          const rawQuiz = await AsyncStorage.getItem("healthclues-quiz-results");
          if (rawQuiz) {
            try {
              const q = JSON.parse(rawQuiz);
              profileObj = {
                quest: q.focus || q.primaryConcernId || "sleep",
                topic: q.title || q.category || "Mất ngủ & Khó ngủ",
                profile: q,
              };
            } catch {}
          }
        }
        if (!profileObj && typeof window !== "undefined") {
          try {
            const lsQuiz = window.localStorage.getItem("healthclues-quiz-results");
            if (lsQuiz) {
              const q = JSON.parse(lsQuiz);
              profileObj = {
                quest: q.focus || q.primaryConcernId || "sleep",
                topic: q.title || q.category || "Mất ngủ & Khó ngủ",
                profile: q,
              };
            }
          } catch {}
        }
        if (profileObj && isMounted) {
          setProfile(profileObj);
          const effectiveQuest =
            profileObj.quest ||
            profileObj.profile?.primaryConcernId ||
            profileObj.profile?.adaptiveDiscovery?.focusId ||
            "sleep";
          const effectiveTopic =
            profileObj.profile?.adaptiveDiscovery?.focusLabel ||
            profileObj.profile?.topic ||
            profileObj.topic ||
            profileObj.profile?.concernNote ||
            "";
          const sortedTopics = getBodyScienceTopicsForProfile(effectiveQuest, effectiveTopic);
          if (sortedTopics.length > 0) {
            setSelectedTopicId(sortedTopics[0].id);
            setActiveChapterId(sortedTopics[0].chapters[0].id);
          }
        }

        const todayStr = new Date().toISOString().slice(0, 10);
        const lastQuizDate = await AsyncStorage.getItem(QUIZ_COMPLETED_KEY);
        if (lastQuizDate === todayStr && isMounted) {
          setQuizAnsweredToday(true);
        } else {
          setQuizAnsweredToday(false);
          setQuizSubmitted(false);
          setSelectedOption(null);
        }

        const rawClues = await AsyncStorage.getItem(CLUES_STORAGE_KEY);
        if (rawClues && isMounted) {
          try {
            const parsedClues = JSON.parse(rawClues);
            if (Array.isArray(parsedClues)) setUnlockedClues(parsedClues);
          } catch {}
        }
      } catch (err) {
        console.warn("Failed to load body science library:", err);
      }
    };

    loadState();
    return () => {
      isMounted = false;
    };
  }, [visible]);

  const topics = useMemo(() => {
    const quest =
      profile?.quest ||
      profile?.profile?.primaryConcernId ||
      profile?.profile?.adaptiveDiscovery?.focusId ||
      "sleep";
    const topic =
      profile?.profile?.adaptiveDiscovery?.focusLabel ||
      profile?.profile?.topic ||
      profile?.topic ||
      profile?.profile?.concernNote ||
      "";
    return getBodyScienceTopicsForProfile(quest, topic);
  }, [profile]);

  const currentTopic = useMemo(() => {
    return topics.find((t) => t.id === selectedTopicId) || topics[0] || BODY_SCIENCE_TOPICS[0];
  }, [topics, selectedTopicId]);

  const currentChapter = useMemo(() => {
    if (!currentTopic) return null;
    return (
      currentTopic.chapters.find((c) => c.id === activeChapterId) ||
      currentTopic.chapters[0]
    );
  }, [currentTopic, activeChapterId]);

  const handleSelectOption = (idx: number) => {
    if (quizSubmitted || quizAnsweredToday) return;
    setSelectedOption(idx);
  };

  const handleSubmitQuiz = async () => {
    if (selectedOption === null || quizSubmitted || quizAnsweredToday) return;

    setQuizSubmitted(true);
    const isCorrect = selectedOption === currentTopic.dailyQuiz.correctIndex;
    const todayStr = new Date().toISOString().slice(0, 10);

    if (isCorrect) {
      try {
        await AsyncStorage.setItem(QUIZ_COMPLETED_KEY, todayStr);
        setQuizAnsweredToday(true);

        // Award EXP
        const expGain = 20;
        if (onAwardExp) {
          onAwardExp(expGain, "Giải câu đố sinh học tại Thư Viện Tri Thức");
        } else {
          DeviceEventEmitter.emit("AWARD_EXP", {
            amount: expGain,
            reason: "Giải câu đố sinh học tại Thư Viện Tri Thức",
          });
        }

        // Save Clue
        const clueId = currentTopic.dailyQuiz.clueReward.id;
        const newClues = Array.from(new Set([...unlockedClues, clueId]));
        setUnlockedClues(newClues);
        await AsyncStorage.setItem(CLUES_STORAGE_KEY, JSON.stringify(newClues));
      } catch (err) {
        console.warn("Error saving quiz outcome:", err);
      }
    }
  };

  if (!visible) return null;

  const userConcernName =
    profile?.profile?.adaptiveDiscovery?.focusLabel ||
    profile?.profile?.topic ||
    profile?.topic ||
    profile?.profile?.concernNote ||
    (profile?.quest === "sleep" ? "Mất ngủ & Khó ngủ" : "Sức khỏe toàn diện");

  const rawGoal = profile?.profile?.twoWeekGoal || profile?.twoWeekGoal;
  const userGoalText =
    rawGoal && !rawGoal.includes("Explore personal wellness")
      ? rawGoal
      : userConcernName
      ? `Cải thiện & thấu hiểu về ${userConcernName}`
      : "Hiểu sâu cơ thể để sống khỏe & an nhiên";

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerTitleWrap}>
              <View style={styles.headerIconRing}>
                <Brain size={18} color="#818cf8" />
              </View>
              <View>
                <Text style={styles.headerTitle}>
                  {locale === "en" ? "Body Science Library" : "Thư Viện Tri Thức Cơ Thể"}
                </Text>
                <Text style={styles.headerSub}>
                  {locale === "en"
                    ? "Biological Mechanisms · Decode Your Body"
                    : "Hiểu Rõ Cơ Chế Sinh Học · Giải Mã Cơ Thể Bạn"}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel="Đóng Thư Viện Tri Thức"
            >
              <X size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {/* Quiz Match Personal Banner */}
          <View style={styles.personalBanner}>
            <View style={styles.mascotSpeechBubble}>
              <View style={styles.bubbleTagRow}>
                <Sparkles size={13} color="#a78bfa" />
                <Text style={styles.bubbleTagText}>TRI THỨC THEO VẤN ĐỀ QUIZ CỦA BẠN</Text>
                <View style={{ backgroundColor: "rgba(129, 140, 248, 0.2)", paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6, borderWidth: 1, borderColor: "rgba(129, 140, 248, 0.4)" }}>
                  <Text style={{ fontSize: 10, fontWeight: "800", color: "#a5b4fc" }}>{userConcernName}</Text>
                </View>
              </View>
              <Text style={styles.bubbleBodyText}>
                Dành cho: <Text style={styles.highlightText}>"{userGoalText}"</Text> — Thư
                viện đã tự động làm nổi bật các chương sinh lý học giúp bạn hiểu vì sao cơ thể
                lại phản ứng như vậy và cách điều chỉnh lối sống từ gốc rễ.
              </Text>
            </View>
          </View>

          {/* Topic Selector Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.topicScroll}
            contentContainerStyle={styles.topicScrollContent}
          >
            {topics.map((t) => {
              const isSelected = t.id === currentTopic.id;
              return (
                <TouchableOpacity
                  key={t.id}
                  style={[styles.topicChip, isSelected && styles.topicChipActive]}
                  onPress={() => {
                    setSelectedTopicId(t.id);
                    setActiveChapterId(t.chapters[0].id);
                  }}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[styles.topicChipText, isSelected && styles.topicChipTextActive]}
                  >
                    {t.title}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Main Scroll Content */}
          <ScrollView
            style={styles.contentScrollView}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Topic Summary */}
            <View style={styles.topicOverviewCard}>
              <View style={styles.badgeRow}>
                <Text style={styles.topicBadgeText}>{currentTopic.badge}</Text>
              </View>
              <Text style={styles.topicSummaryText}>{currentTopic.summaryVi}</Text>
            </View>

            {/* Chapter Selector Tabs */}
            <View style={styles.chapterNavContainer}>
              <Text style={styles.sectionSmallHeading}>CHỌN CHƯƠNG ĐỌC KHOA HỌC:</Text>
              <View style={styles.chapterList}>
                {currentTopic.chapters.map((ch, idx) => {
                  const isActive = currentChapter?.id === ch.id;
                  return (
                    <TouchableOpacity
                      key={ch.id}
                      style={[styles.chapterItem, isActive && styles.chapterItemActive]}
                      onPress={() => setActiveChapterId(ch.id)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.chapterNumBadge}>
                        <Text
                          style={[
                            styles.chapterNumText,
                            isActive && { color: "#ffffff", fontWeight: "800" },
                          ]}
                        >
                          {idx + 1}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.chapterItemTitle,
                            isActive && styles.chapterItemTitleActive,
                          ]}
                        >
                          {ch.title}
                        </Text>
                        <Text style={styles.chapterItemSub}>{ch.scientificConcept}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Active Chapter Reading View */}
            {currentChapter && (
              <View style={styles.chapterReadCard}>
                <Text style={styles.readChapterHeading}>{currentChapter.title}</Text>
                <Text style={styles.readChapterSubtitle}>{currentChapter.subtitle}</Text>

                <View style={styles.conceptPill}>
                  <Brain size={14} color="#818cf8" />
                  <Text style={styles.conceptPillText}>
                    Khái niệm khoa học: {currentChapter.scientificConcept}
                  </Text>
                </View>

                {/* Mechanism Detail */}
                <View style={styles.detailBlock}>
                  <Text style={styles.detailLabel}>CƠ CHẾ SINH HỌC DIỄN RA TRONG CƠ THỂ:</Text>
                  <Text style={styles.detailBodyText}>
                    {currentChapter.mechanismDetail}
                  </Text>
                </View>

                {/* Actionable Clue */}
                <View style={styles.actionableBlock}>
                  <View style={styles.actionableTitleRow}>
                    <Lightbulb size={16} color="#fbbf24" />
                    <Text style={styles.actionableHeading}>MANH MỐI HÀNH ĐỘNG THỰC TẾ:</Text>
                  </View>
                  <Text style={styles.actionableText}>
                    {currentChapter.actionableClue}
                  </Text>
                </View>

                {/* PubMed Link if available */}
                {currentChapter.pmid && (
                  <TouchableOpacity
                    style={styles.pubmedLinkRow}
                    onPress={() =>
                      Linking.openURL(
                        `https://pubmed.ncbi.nlm.nih.gov/${currentChapter.pmid}/`
                      )
                    }
                  >
                    <ExternalLink size={12} color="#60a5fa" />
                    <Text style={styles.pubmedLinkText}>
                      Xác thực trên PubMed NLM (PMID: {currentChapter.pmid})
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Daily Biology Clue Quiz Section (Retention Mechanic) */}
            <View style={styles.quizSectionCard}>
              <View style={styles.quizHeaderRow}>
                <View style={styles.quizIconRing}>
                  <HelpCircle size={18} color="#f59e0b" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.quizSectionTitle}>
                    Câu Đố Manh Mối Sinh Học Hôm Nay
                  </Text>
                  <Text style={styles.quizSectionSub}>
                    Trả lời đúng nhận +20 EXP & 1 Manh Mối Sinh Học dùng trong Văn Phòng Giải Mã
                  </Text>
                </View>
                {quizAnsweredToday && (
                  <View style={styles.quizDoneBadge}>
                    <CheckCircle2 size={13} color="#10b981" />
                    <Text style={styles.quizDoneBadgeText}>Đã nhận +20 EXP</Text>
                  </View>
                )}
              </View>

              <Text style={styles.quizQuestionText}>
                {currentTopic.dailyQuiz.question}
              </Text>

              {/* Options */}
              <View style={styles.optionsList}>
                {currentTopic.dailyQuiz.options.map((opt, optIdx) => {
                  const isSelected = selectedOption === optIdx;
                  const isCorrect = optIdx === currentTopic.dailyQuiz.correctIndex;
                  const showResult = quizSubmitted || quizAnsweredToday;

                  const isWrong = showResult && isSelected && !isCorrect;
                  const isRight = showResult && isCorrect;

                  return (
                    <TouchableOpacity
                      key={optIdx}
                      style={[
                        styles.optionItem,
                        isSelected && !showResult && styles.optionItemSelected,
                        isRight && styles.optionItemCorrect,
                        isWrong && styles.optionItemWrong,
                      ]}
                      onPress={() => handleSelectOption(optIdx)}
                      disabled={showResult}
                      activeOpacity={0.8}
                    >
                      <View style={styles.optionCircle}>
                        <Text style={styles.optionLetter}>
                          {String.fromCharCode(65 + optIdx)}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.optionText,
                          isSelected && !showResult && styles.optionTextSelected,
                          isRight && styles.optionTextCorrect,
                          isWrong && styles.optionTextWrong,
                        ]}
                      >
                        {opt}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Submit Button or Explanation */}
              {!quizSubmitted && !quizAnsweredToday ? (
                <TouchableOpacity
                  style={[
                    styles.submitQuizBtn,
                    selectedOption === null && styles.submitQuizBtnDisabled,
                  ]}
                  onPress={handleSubmitQuiz}
                  disabled={selectedOption === null}
                  activeOpacity={0.8}
                >
                  <Zap size={14} color="#0f172a" />
                  <Text style={styles.submitQuizBtnText}>
                    Xác nhận câu trả lời (+20 EXP)
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.explanationBox}>
                  <Text style={styles.explanationHeading}>
                    {selectedOption === currentTopic.dailyQuiz.correctIndex
                      ? "🎉 Hoàn toàn chính xác!"
                      : "💡 Giải thích khoa học:"}
                  </Text>
                  <Text style={styles.explanationBody}>
                    {currentTopic.dailyQuiz.explanation}
                  </Text>

                  {/* Clue Reward Presentation */}
                  <View style={styles.clueRewardCard}>
                    <View style={styles.clueHeaderRow}>
                      <Award size={16} color="#fbbf24" />
                      <Text style={styles.clueRewardTitle}>
                        {currentTopic.dailyQuiz.clueReward.title}
                      </Text>
                    </View>
                    <Text style={styles.clueRewardDesc}>
                      {currentTopic.dailyQuiz.clueReward.description}
                    </Text>
                  </View>

                  {/* Tie-in Button to Detective Office */}
                  {onOpenDetective && (
                    <TouchableOpacity
                      style={styles.openDetectiveBtn}
                      onPress={() => {
                        onClose();
                        onOpenDetective();
                      }}
                      activeOpacity={0.85}
                    >
                      <Search size={14} color="#ffffff" />
                      <Text style={styles.openDetectiveBtnText}>
                        Đến Văn Phòng Giải Mã Dùng Manh Mối Này Ngay
                      </Text>
                      <ChevronRight size={14} color="#ffffff" />
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(4, 9, 20, 0.88)",
    justifyContent: "center",
    alignItems: "center",
    padding: 12,
  },
  modalCard: {
    width: "100%",
    maxWidth: 620,
    maxHeight: "92%",
    backgroundColor: "#090d16",
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "rgba(99, 102, 241, 0.45)",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 12,
    display: "flex",
    flexDirection: "column",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  headerTitleWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  headerIconRing: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(99, 102, 241, 0.15)",
    borderWidth: 1,
    borderColor: "#818cf8",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#f8fafc",
    letterSpacing: -0.2,
  },
  headerSub: {
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  personalBanner: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 4,
  },
  mascotSpeechBubble: {
    backgroundColor: "rgba(19, 27, 46, 0.9)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(167, 139, 250, 0.35)",
    padding: 10,
  },
  bubbleTagRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 4,
  },
  bubbleTagText: {
    fontSize: 10.5,
    fontWeight: "800",
    color: "#c4b5fd",
    letterSpacing: 0.5,
  },
  bubbleBodyText: {
    fontSize: 12,
    color: "#cbd5e1",
    lineHeight: 17,
  },
  highlightText: {
    color: "#818cf8",
    fontWeight: "700",
  },
  topicScroll: {
    marginHorizontal: 14,
    marginTop: 6,
    maxHeight: 38,
  },
  topicScrollContent: {
    flexDirection: "row",
    gap: 6,
    paddingVertical: 2,
  },
  topicChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  topicChipActive: {
    backgroundColor: "rgba(99, 102, 241, 0.2)",
    borderColor: "#818cf8",
  },
  topicChipText: {
    fontSize: 11.5,
    color: "#94a3b8",
    fontWeight: "600",
  },
  topicChipTextActive: {
    color: "#c7d2fe",
    fontWeight: "800",
  },
  contentScrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 14,
    gap: 12,
  },
  topicOverviewCard: {
    backgroundColor: "rgba(15, 23, 42, 0.8)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(99, 102, 241, 0.2)",
    padding: 10,
  },
  badgeRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  topicBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#a5b4fc",
    backgroundColor: "rgba(99, 102, 241, 0.15)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  topicSummaryText: {
    fontSize: 11.5,
    color: "#cbd5e1",
    lineHeight: 16,
  },
  chapterNavContainer: {
    gap: 6,
  },
  sectionSmallHeading: {
    fontSize: 10.5,
    fontWeight: "800",
    color: "#94a3b8",
    letterSpacing: 0.5,
  },
  chapterList: {
    gap: 6,
  },
  chapterItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    padding: 8,
  },
  chapterItemActive: {
    backgroundColor: "rgba(99, 102, 241, 0.15)",
    borderColor: "#818cf8",
  },
  chapterNumBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  chapterNumText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94a3b8",
  },
  chapterItemTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#cbd5e1",
  },
  chapterItemTitleActive: {
    color: "#ffffff",
  },
  chapterItemSub: {
    fontSize: 10,
    color: "#64748b",
  },
  chapterReadCard: {
    backgroundColor: "rgba(15, 23, 42, 0.95)",
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: "rgba(99, 102, 241, 0.3)",
    padding: 12,
    gap: 10,
  },
  readChapterHeading: {
    fontSize: 15,
    fontWeight: "800",
    color: "#f8fafc",
  },
  readChapterSubtitle: {
    fontSize: 11.5,
    color: "#94a3b8",
    fontStyle: "italic",
  },
  conceptPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(99, 102, 241, 0.12)",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  conceptPillText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#c7d2fe",
  },
  detailBlock: {
    gap: 4,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    borderRadius: 8,
    padding: 8,
  },
  detailLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#818cf8",
    letterSpacing: 0.5,
  },
  detailBodyText: {
    fontSize: 12,
    color: "#cbd5e1",
    lineHeight: 18,
  },
  actionableBlock: {
    backgroundColor: "rgba(245, 158, 11, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.25)",
    borderRadius: 8,
    padding: 8,
    gap: 4,
  },
  actionableTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  actionableHeading: {
    fontSize: 10.5,
    fontWeight: "800",
    color: "#fbbf24",
    letterSpacing: 0.5,
  },
  actionableText: {
    fontSize: 11.5,
    color: "#fef3c7",
    lineHeight: 16,
  },
  pubmedLinkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    marginTop: 2,
  },
  pubmedLinkText: {
    fontSize: 10.5,
    fontWeight: "600",
    color: "#60a5fa",
    textDecorationLine: "underline",
  },
  quizSectionCard: {
    backgroundColor: "rgba(20, 27, 45, 0.95)",
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: "rgba(245, 158, 11, 0.4)",
    padding: 12,
    gap: 10,
  },
  quizHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  quizIconRing: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  quizSectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#fef3c7",
  },
  quizSectionSub: {
    fontSize: 10,
    color: "#94a3b8",
  },
  quizDoneBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(16, 185, 129, 0.2)",
    borderColor: "#10b981",
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  quizDoneBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#34d399",
  },
  quizQuestionText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#f8fafc",
    lineHeight: 18,
  },
  optionsList: {
    gap: 6,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    padding: 8,
  },
  optionItemSelected: {
    backgroundColor: "rgba(99, 102, 241, 0.2)",
    borderColor: "#818cf8",
  },
  optionItemCorrect: {
    backgroundColor: "rgba(16, 185, 129, 0.2)",
    borderColor: "#10b981",
  },
  optionItemWrong: {
    backgroundColor: "rgba(239, 68, 68, 0.2)",
    borderColor: "#ef4444",
  },
  optionCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  optionLetter: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "#cbd5e1",
  },
  optionText: {
    fontSize: 11.5,
    color: "#cbd5e1",
    flex: 1,
  },
  optionTextSelected: {
    color: "#ffffff",
    fontWeight: "700",
  },
  optionTextCorrect: {
    color: "#a7f3d0",
    fontWeight: "700",
  },
  optionTextWrong: {
    color: "#fca5a5",
    fontWeight: "600",
  },
  submitQuizBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#f59e0b",
    borderRadius: 8,
    paddingVertical: 8,
  },
  submitQuizBtnDisabled: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  submitQuizBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0f172a",
  },
  explanationBox: {
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: 8,
    padding: 8,
    gap: 6,
  },
  explanationHeading: {
    fontSize: 11.5,
    fontWeight: "800",
    color: "#fef3c7",
  },
  explanationBody: {
    fontSize: 11,
    color: "#cbd5e1",
    lineHeight: 16,
  },
  clueRewardCard: {
    backgroundColor: "rgba(245, 158, 11, 0.12)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.3)",
    padding: 8,
    gap: 3,
  },
  clueHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  clueRewardTitle: {
    fontSize: 11.5,
    fontWeight: "800",
    color: "#fbbf24",
  },
  clueRewardDesc: {
    fontSize: 10.5,
    color: "#d1d5db",
    lineHeight: 14,
  },
  openDetectiveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#2563eb",
    borderRadius: 8,
    paddingVertical: 8,
    marginTop: 4,
  },
  openDetectiveBtnText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#ffffff",
  },
});
