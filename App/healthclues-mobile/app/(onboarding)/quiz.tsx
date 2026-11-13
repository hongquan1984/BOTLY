import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  ImageBackground,
  TextInput,
  DeviceEventEmitter,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  ShieldCheck,
  LogIn,
  Lock,
  Compass,
  Plus,
  RefreshCw,
  ScrollText,
  Smartphone,
  Trash2,
  Volume2,
  VolumeX,
} from "lucide-react-native";
import { colors, fonts, spacing, radius } from "@/theme";
import type { MobileWellnessGoal } from "@/hooks/useWorld";
import {
  AUDIO_STATE_EVENT,
  DEFAULT_AUDIO_SETTINGS,
  GameAudioSettings,
  loadAudioSettings,
  playSfx,
  unlockAndStartBgm,
  updateAudioSettings,
} from "@/services/gameAudio";
import {
  AdvisorProviderStatus,
  AiSuggestedGoal,
  HEALTH_CONCERNS,
  MobileHealthProfile,
  SPECIAL_FACTOR_CHOICES,
  buildActiveGoalsFromSelection,
  buildDiscoveryProfile,
  buildLocalPersonalizedGoals,
  completeMobileOnboarding,
  getFactorsForConcerns,
  requestWellnessAdvisor,
} from "@/services/onboarding";

function OnboardingStepTrail({
  activeStep,
  locale,
}: {
  activeStep: 1 | 2 | 3;
  locale: "vi" | "en";
}) {
  const steps = [
    { num: 1, label: locale === "vi" ? "1. Vùng" : "1. Realm" },
    { num: 2, label: locale === "vi" ? "2. Khám phá" : "2. Discover" },
    { num: 3, label: locale === "vi" ? "3. Kế hoạch" : "3. Plan" },
  ] as const;

  return (
    <View style={styles.stepTrailBar} accessibilityLabel={`onboarding-step-trail-${activeStep}`}>
      {steps.map((item, idx) => {
        const isDone = item.num < activeStep;
        const isActive = item.num === activeStep;
        return (
          <React.Fragment key={item.num}>
            <View
              style={[
                styles.stepTrailPill,
                isActive && styles.stepTrailPillActive,
                isDone && styles.stepTrailPillDone,
              ]}
            >
              {isDone && <Check size={11} color="#6ee7b7" />}
              <Text
                numberOfLines={1}
                style={[
                  styles.stepTrailText,
                  isActive && styles.stepTrailTextActive,
                  isDone && styles.stepTrailTextDone,
                ]}
              >
                {item.label}
              </Text>
            </View>
            {idx < steps.length - 1 && <View style={styles.stepTrailConnector} />}
          </React.Fragment>
        );
      })}
    </View>
  );
}

type QuizStep = "welcome" | "quest_choice" | "discovery" | "plan";

export default function OnboardingQuizScreen() {
  const router = useRouter();
  const [step, setStep] = useState<QuizStep>("welcome");
  const [selectedQuest, setSelectedQuest] = useState<string>("healthclues-realm");
  const [locale, setLocale] = useState<"vi" | "en">("vi");
  const [lockNotice, setLockNotice] = useState<string | null>(null);

  // Two-step Adaptive Health Discovery (1:1 parity with Web HealthCluesGoalFirstDiscovery)
  const [discoveryScreen, setDiscoveryScreen] = useState<1 | 2>(1);
  const [selectedConcerns, setSelectedConcerns] = useState<string[]>([]);
  const [primaryConcernId, setPrimaryConcernId] = useState<string>("");
  const [concernNote, setConcernNote] = useState<string>("");
  const [selectedFactors, setSelectedFactors] = useState<string[]>([]);
  const [factorNote, setFactorNote] = useState<string>("");
  const [discoveryError, setDiscoveryError] = useState<string | null>(null);

  // AI Advisor & Personalized Plan Builder state (1:1 parity with Web WellnessPlanBuilder)
  const [builtProfile, setBuiltProfile] = useState<MobileHealthProfile | null>(null);
  const [requestQuestId, setRequestQuestId] = useState<string>("health-concern");
  const [advisorLoading, setAdvisorLoading] = useState<boolean>(false);
  const [providerStatus, setProviderStatus] = useState<AdvisorProviderStatus>("GEMINI_AI");
  const [providerModel, setProviderModel] = useState<string | null>(null);
  const [aiGoals, setAiGoals] = useState<AiSuggestedGoal[]>([]);
  const [includedMap, setIncludedMap] = useState<Record<string, boolean>>({});
  const [modeMap, setModeMap] = useState<Record<string, "A" | "B" | "custom">>({});
  const [customDrafts, setCustomDrafts] = useState<Record<string, string>>({});
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);

  // Inline custom habit creator during onboarding
  const [showAddCustomHabit, setShowAddCustomHabit] = useState<boolean>(false);
  const [newHabitTitle, setNewHabitTitle] = useState<string>("");
  const [newHabitCategory, setNewHabitCategory] = useState<string>("Vận Động");
  const discoveryScrollRef = useRef<ScrollView>(null);
  const planScrollRef = useRef<ScrollView>(null);
  const advisorRequestIdRef = useRef<number>(0);

  const [newHabitError, setNewHabitError] = useState<string | null>(null);
  const [extraCustomGoals, setExtraCustomGoals] = useState<MobileWellnessGoal[]>([]);
  const [completing, setCompleting] = useState<boolean>(false);
  const [audioSettings, setAudioSettings] = useState<GameAudioSettings>(DEFAULT_AUDIO_SETTINGS);

  useEffect(() => {
    let active = true;
    loadAudioSettings().then((s) => {
      if (active) setAudioSettings(s);
    });
    const sub = DeviceEventEmitter.addListener(AUDIO_STATE_EVENT, (next: GameAudioSettings) => {
      if (active && next) setAudioSettings(next);
    });
    return () => {
      active = false;
      sub.remove();
    };
  }, []);

  const handleToggleWelcomeAudio = async () => {
    const nextMuted = !audioSettings.muted;
    const updated = await updateAudioSettings({ muted: nextMuted });
    setAudioSettings(updated);
    if (!nextMuted) {
      await unlockAndStartBgm();
      void playSfx("tap");
    }
  };

  const triggerHaptic = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    if (Platform.OS !== "web") {
      void playSfx("tap");
    }
  };

  const triggerSuccessHaptic = () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
    void playSfx("seal");
  };

  const toggleConcern = (id: string) => {
    triggerHaptic();
    setDiscoveryError(null);
    setSelectedConcerns((curr) => {
      const adding = !curr.includes(id);
      const next = adding ? [...curr, id] : curr.filter((x) => x !== id);
      if (!next.includes(primaryConcernId)) {
        setPrimaryConcernId(next[0] || "");
      } else if (!primaryConcernId && next.length > 0) {
        setPrimaryConcernId(next[0]);
      }
      if (id === "other" && adding) {
        setTimeout(() => discoveryScrollRef.current?.scrollToEnd({ animated: true }), 90);
      }
      return next;
    });
  };

  const toggleFactor = (id: string) => {
    triggerHaptic();
    setSelectedFactors((curr) => {
      if (id === "none") {
        return curr.includes("none") ? [] : ["none"];
      }
      const withoutNone = curr.filter((x) => x !== "none");
      return withoutNone.includes(id)
        ? withoutNone.filter((x) => x !== id)
        : [...withoutNone, id];
    });
  };

  const handleDiscoveryNext = () => {
    setDiscoveryError(null);
    if (selectedConcerns.length === 0) {
      setDiscoveryError(
        locale === "vi"
          ? "Vui lòng chọn ít nhất một vấn đề sức khỏe hoặc chọn Vấn đề khác để tự nhập."
          : "Choose at least one concern or select Something else."
      );
      return;
    }
    if (selectedConcerns.includes("other") && !concernNote.trim()) {
      setDiscoveryError(
        locale === "vi"
          ? "Vui lòng mô tả ngắn vấn đề sức khỏe của bạn trong ô nhập bên dưới."
          : "Briefly describe your concern below."
      );
      setTimeout(() => discoveryScrollRef.current?.scrollToEnd({ animated: true }), 90);
      return;
    }
    triggerSuccessHaptic();
    setDiscoveryScreen(2);
    setTimeout(() => discoveryScrollRef.current?.scrollTo({ y: 0, animated: false }), 40);
  };

  const applySuggestedGoalsToPlan = (
    goals: AiSuggestedGoal[],
    status: AdvisorProviderStatus,
    model: string | null
  ) => {
    setProviderStatus(status);
    setProviderModel(model);
    setAiGoals(goals);

    // Select top 3 suggested habits by default at Option A ("Start Small"), matching Web
    const nextIncluded: Record<string, boolean> = {};
    const nextModes: Record<string, "A" | "B" | "custom"> = {};
    goals.forEach((g, idx) => {
      nextIncluded[g.goalId] = idx < 3;
      nextModes[g.goalId] = "A";
    });
    setIncludedMap(nextIncluded);
    setModeMap(nextModes);
    setEditingGoalId(null);
  };

  const runAdvisorAnalysis = async (profileToUse: MobileHealthProfile, questKey: string) => {
    const reqId = ++advisorRequestIdRef.current;
    setAdvisorLoading(true);
    setStep("plan");
    try {
      const res = await requestWellnessAdvisor(profileToUse, questKey, locale);
      if (advisorRequestIdRef.current !== reqId) return;
      applySuggestedGoalsToPlan(res.goals, res.status, res.model);
    } finally {
      if (advisorRequestIdRef.current === reqId) {
        setAdvisorLoading(false);
      }
    }
  };

  const handleQuickFallbackPlan = () => {
    if (!builtProfile) return;
    advisorRequestIdRef.current += 1;
    triggerSuccessHaptic();
    const localGoals = buildLocalPersonalizedGoals(builtProfile);
    applySuggestedGoalsToPlan(localGoals, "LOCAL_FALLBACK", null);
    setAdvisorLoading(false);
  };

  const handleAnalyzeAndBuildPlan = () => {
    triggerSuccessHaptic();
    const { profile, requestQuestId: rqId } = buildDiscoveryProfile({
      selectedConcerns,
      primaryConcernId: primaryConcernId || selectedConcerns[0] || "general",
      concernNote,
      selectedFactors,
      factorNote,
      locale,
    });
    setBuiltProfile(profile);
    setRequestQuestId(rqId);
    void runAdvisorAnalysis(profile, rqId);
  };

  const handleToggleAiGoal = (goalId: string) => {
    triggerHaptic();
    setIncludedMap((prev) => ({ ...prev, [goalId]: !prev[goalId] }));
  };

  const handleChooseOption = (goalId: string, opt: "A" | "B") => {
    triggerHaptic();
    setIncludedMap((prev) => ({ ...prev, [goalId]: true }));
    setModeMap((prev) => ({ ...prev, [goalId]: opt }));
    setEditingGoalId(null);
  };

  const handleApplyInlineCustom = (goalId: string) => {
    const note = (customDrafts[goalId] || "").trim();
    if (!note) return;
    triggerSuccessHaptic();
    setIncludedMap((prev) => ({ ...prev, [goalId]: true }));
    setModeMap((prev) => ({ ...prev, [goalId]: "custom" }));
    setEditingGoalId(null);
  };

  const handleAddExtraCustomHabit = () => {
    const trimmed = newHabitTitle.trim();
    if (!trimmed) {
      setNewHabitError(
        locale === "vi" ? "Hãy nhập tên thói quen bạn muốn thực hiện." : "Enter your custom habit title."
      );
      return;
    }
    triggerSuccessHaptic();
    setNewHabitError(null);
    const created: MobileWellnessGoal = {
      id: `user-onboarding-${Date.now()}`,
      title: trimmed,
      category: newHabitCategory,
      status: "active",
      target: "Tự chọn",
      unit: "hằng ngày",
      daysPerWeek: 7,
      expValue: 15,
      description:
        locale === "vi"
          ? "Thói quen tự thêm lúc khởi tạo hành trình cùng Lumi."
          : "Self-added starter habit created during onboarding.",
      evidence: "Người dùng tự thêm khi Onboarding",
    };
    setExtraCustomGoals((prev) => [...prev, created]);
    setNewHabitTitle("");
    setShowAddCustomHabit(false);
  };

  const handleEnterWorld = async () => {
    if (!builtProfile) return;
    triggerSuccessHaptic();
    setCompleting(true);
    try {
      const selectedGoals = buildActiveGoalsFromSelection({
        aiGoals,
        includedMap,
        modeMap,
        customDrafts,
        extraCustomGoals,
        locale,
      });

      await completeMobileOnboarding({
        quest: selectedQuest,
        profile: builtProfile,
        goals: selectedGoals,
        providerStatus,
      });
    } catch {}
    setTimeout(() => {
      setCompleting(false);
      router.replace("/(game)/world");
    }, 350);
  };

  const factorChoices = getFactorsForConcerns(selectedConcerns, concernNote);
  const allStep2Factors = [...factorChoices, ...SPECIAL_FACTOR_CHOICES];
  const selectedAiCount = aiGoals.filter((g) => includedMap[g.goalId]).length;
  const totalSelectedGoals = selectedAiCount + extraCustomGoals.length;
  const displayFocus =
    builtProfile?.adaptiveDiscovery.concernDetail ||
    builtProfile?.adaptiveDiscovery.focusLabel ||
    (locale === "vi" ? "Sức khỏe tổng thể" : "General wellness");

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      {/* ============================================================== */}
      {/* STEP 1: WELCOME SCREEN (WEB GAME PLAY LANDING PARITY)           */}
      {/* ============================================================== */}
      {step === "welcome" && (
        <ImageBackground
          source={require("../../assets/game/regions/healthclues-world-overworld.webp")}
          style={styles.welcomeBackground}
          resizeMode="cover"
        >
          <View style={styles.welcomeVignette} />

          <View style={styles.welcomeTopBar}>
            <View style={styles.brandBadge}>
              <View style={styles.brandIconCircle}>
                <Compass size={17} color="#fef08a" />
              </View>
              <View style={styles.brandTextWrap}>
                <Text style={styles.brandTitleText} numberOfLines={1}>HEALTHCLUES</Text>
                <Text style={styles.brandSubtitleText} numberOfLines={1}>WELLNESS RPG</Text>
              </View>
            </View>

            <View style={styles.welcomeTopActions}>
              <TouchableOpacity
                style={styles.topAudioIconBtn}
                accessibilityRole="button"
                accessibilityLabel="welcome-audio-toggle-btn"
                onPress={handleToggleWelcomeAudio}
                activeOpacity={0.8}
              >
                {audioSettings.muted ? (
                  <VolumeX size={15} color="rgba(255,255,255,0.65)" />
                ) : (
                  <Volume2 size={15} color="#fef08a" />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.topSignInBtn}
                accessibilityRole="button"
                onPress={() => router.push("/(auth)/login")}
                activeOpacity={0.8}
              >
                <LogIn size={13} color="#fef08a" />
                <Text style={styles.topSignInText}>{locale === "vi" ? "Đăng nhập" : "Sign in"}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.welcomeCenterContent} showsVerticalScrollIndicator={false}>
            <View style={styles.welcomeChibiWrapper}>
              <Image
                source={require("../../assets/game/characters/chibi-anna.png")}
                style={styles.welcomeChibiImg}
                contentFit="contain"
              />
              <View style={styles.welcomeFireflyGlow} />
            </View>

            <View style={styles.cozyEyebrowPill}>
              <Sparkles size={13} color="#fef08a" />
              <Text style={styles.cozyEyebrowText}>
                {locale === "vi" ? "HÀNH TRÌNH SỐNG KHỎE ẤM ÁP" : "A COZY ADVENTURE FOR YOUR WELLNESS"}
              </Text>
            </View>

            <Text style={styles.heroMainTitle}>HEALTHCLUES</Text>
            <Text style={styles.heroSubSerif}>
              {locale === "vi" ? "Hành Trình Sống Khỏe Bắt Đầu Tại Đây" : "Your Wellness Adventure Begins Here"}
            </Text>
            <Text style={styles.heroDescParagraph}>
              {locale === "vi"
                ? "Chọn hoặc nhập vấn đề bạn quan tâm để AI gợi ý lộ trình thói quen cá nhân hóa cho riêng bạn."
                : "Share what matters to your wellbeing so Lumi & AI can craft practical daily habits."}
            </Text>

            <View style={styles.languagePillContainer}>
              <Text style={styles.languageLabel}>{locale === "vi" ? "Chọn ngôn ngữ" : "Choose language"}</Text>
              <View style={styles.langButtonsRow}>
                <TouchableOpacity
                  style={[styles.langBtn, locale === "en" && styles.langBtnActive]}
                  onPress={() => setLocale("en")}
                  accessibilityRole="button"
                >
                  <Text style={[styles.langBtnText, locale === "en" && styles.langBtnTextActive]}>English</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.langBtn, locale === "vi" && styles.langBtnActive]}
                  onPress={() => setLocale("vi")}
                  accessibilityRole="button"
                >
                  <Text style={[styles.langBtnText, locale === "vi" && styles.langBtnTextActive]}>Tiếng Việt</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={styles.startJourneyCtaBtn}
              accessibilityRole="button"
              accessibilityLabel="welcome-start-btn"
              activeOpacity={0.85}
              onPress={() => {
                triggerSuccessHaptic();
                setStep("quest_choice");
              }}
            >
              <Text style={styles.startJourneyCtaText}>
                {locale === "vi" ? "Bắt Đầu Hành Trình (+50 EXP)" : "Start Journey (+50 EXP)"}
              </Text>
              <ArrowRight size={20} color="#3d2c06" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.alreadyAccountLink}
              accessibilityRole="button"
              onPress={() => router.push("/(auth)/login")}
            >
              <Text style={styles.alreadyAccountText}>
                {locale === "vi" ? "Đã có tài khoản? Đăng nhập để tiếp tục →" : "Already have an account? Sign in →"}
              </Text>
            </TouchableOpacity>

            <Text style={styles.disclaimerText}>
              {locale === "vi"
                ? "Trải nghiệm khám phá lối sống nhẹ nhàng · Không chẩn đoán hay điều trị y khoa"
                : "A gentle wellness discovery experience · not diagnosis or treatment"}
            </Text>

            <View style={styles.bottomWorldNoteRow}>
              <View style={styles.noteLine} />
              <Text style={styles.bottomWorldNoteText}>
                {locale === "vi" ? "THẾ GIỚI CỦA BẠN ĐANG ĐỢI" : "YOUR WORLD IS WAITING"}
              </Text>
              <View style={styles.noteLine} />
            </View>
          </ScrollView>
        </ImageBackground>
      )}

      {/* ============================================================== */}
      {/* STEP 2: QUEST SELECTION (PARCHMENT RPG REPLICA)                 */}
      {/* ============================================================== */}
      {step === "quest_choice" && (
        <ScrollView style={styles.innerScroll} contentContainerStyle={styles.innerScrollContent}>
          <OnboardingStepTrail activeStep={1} locale={locale} />

          <View style={styles.chapterHeaderCard}>
            <Image
              source={require("../../assets/game/characters/chibi-anna.png")}
              style={styles.chapterAvatar}
              contentFit="contain"
            />
            <View style={styles.chapterInfo}>
              <Text style={styles.chapterKicker}>CHƯƠNG HIỆN TẠI</Text>
              <Text style={styles.chapterTitle}>Chọn hành trình khởi đầu của bạn</Text>
            </View>
          </View>

          <View style={styles.parchmentCard}>
            <Text style={styles.parchmentKicker}>CHỌN NƠI BẮT ĐẦU</Text>
            <Text style={styles.parchmentTitle}>Vương Quốc Khám Phá</Text>
            <Text style={styles.parchmentDesc}>
              Bạn chọn hoặc nhập vấn đề sức khỏe ngay sau đây để Lumi & AI gợi ý thói quen cá nhân hóa.
            </Text>

            {lockNotice && (
              <View style={styles.lockNoticeBanner}>
                <Lock size={14} color="#f59e0b" />
                <Text style={styles.lockNoticeText}>{lockNotice}</Text>
              </View>
            )}

            <View style={styles.questOptionsList}>
              <TouchableOpacity
                style={[
                  styles.questItemCard,
                  selectedQuest === "healthclues-realm" && styles.questItemCardActive,
                ]}
                accessibilityRole="button"
                activeOpacity={0.85}
                onPress={() => {
                  triggerHaptic();
                  setSelectedQuest("healthclues-realm");
                  setLockNotice(null);
                }}
              >
                <ImageBackground
                  source={require("../../assets/game/regions/healthclues-realm-scene-blueprint.webp")}
                  style={styles.questCardBgImage}
                  imageStyle={{ borderRadius: radius.lg }}
                >
                  <View style={styles.questOverlayDark} />
                  <View style={styles.questContentFront}>
                    <View style={styles.questBadgeRow}>
                      <View style={styles.questBadgeActive}>
                        <Sparkles size={10} color="#042f2e" />
                        <Text style={styles.questBadgeActiveText}>ĐANG MỞ (PLAYABLE)</Text>
                      </View>
                    </View>
                    <View style={styles.questHeroInfo}>
                      <Text style={styles.questNameMain}>Vương Quốc HealthClues</Text>
                      <View style={styles.companionTag}>
                        <Image
                          source={require("../../assets/game/ui/lumi_fox_clean.png")}
                          style={styles.companionMiniIcon}
                          contentFit="contain"
                        />
                        <Text style={styles.companionTagName}>Đồng hành cùng Bé Cáo Lumi</Text>
                      </View>
                      <Text style={styles.questSummaryText}>
                        Tùy biến theo mọi mối quan tâm (Gút, cân nặng, đường huyết, căng thẳng, giấc ngủ hoặc tự nhập vấn đề riêng).
                      </Text>
                    </View>
                  </View>
                </ImageBackground>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.questItemCard, styles.questItemCardLocked]}
                accessibilityRole="button"
                activeOpacity={0.7}
                onPress={() => {
                  triggerHaptic();
                  setLockNotice(
                    "Thung Lũng Giấc Ngủ đang tạm khóa vùng bản đồ. Bạn vẫn có thể chọn/nhập vấn đề giấc ngủ hoặc căng thẳng trong Vương Quốc HealthClues!"
                  );
                }}
              >
                <ImageBackground
                  source={require("../../assets/game/regions/sleep-valley-scene-blueprint.webp")}
                  style={styles.questCardBgImage}
                  imageStyle={{ borderRadius: radius.lg }}
                >
                  <View style={styles.questOverlayDarker} />
                  <View style={styles.questContentFront}>
                    <View style={styles.questBadgeRow}>
                      <View style={styles.questBadgeLocked}>
                        <Lock size={11} color="#fcd34d" />
                        <Text style={styles.questBadgeLockedText}>TẠM KHÓA (SẮP MỞ)</Text>
                      </View>
                    </View>
                    <View style={styles.questHeroInfo}>
                      <Text style={[styles.questNameMain, { color: "rgba(255,255,255,0.7)" }]}>Thung Lũng Giấc Ngủ</Text>
                      <Text style={styles.companionLocked}>Linh vật đồng hành: Bé Cú Luna</Text>
                      <Text style={styles.questSummaryTextLocked}>
                        Đang bảo trì & nâng cấp không gian giấc ngủ sâu. Vùng đất sẽ mở lại ở bản tiếp theo.
                      </Text>
                    </View>
                  </View>
                </ImageBackground>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.parchmentContinueBtn}
              accessibilityRole="button"
              accessibilityLabel="quest-choice-continue-btn"
              activeOpacity={0.85}
              onPress={() => {
                triggerSuccessHaptic();
                setDiscoveryScreen(1);
                setStep("discovery");
              }}
            >
              <Text style={styles.parchmentContinueText}>Tiếp Tục Khám Phá Vấn Đề</Text>
              <ArrowRight size={18} color="#042f2e" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* ============================================================== */}
      {/* STEP 3: TWO-SCREEN GOAL-FIRST DISCOVERY (WEB PARITY)            */}
      {/* ============================================================== */}
      {step === "discovery" && (
        <View style={styles.stepViewportContainer}>
          <View style={styles.stepTrailFixedWrap}>
            <OnboardingStepTrail activeStep={2} locale={locale} />
          </View>
          <ScrollView
            ref={discoveryScrollRef}
            style={styles.innerScroll}
            contentContainerStyle={styles.innerScrollContentWithSticky}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.parchmentCard}>
              <View style={styles.discoveryTopRow}>
                <View style={styles.parchmentKickerRow}>
                  <Compass size={12} color="#047857" />
                  <Text style={styles.parchmentKicker}>KHÁM PHÁ SỨC KHỎE</Text>
                </View>
                <View style={styles.stepBadgePill}>
                  <Text style={styles.stepBadgePillText}>BƯỚC {discoveryScreen} / 2</Text>
                </View>
              </View>

              {discoveryScreen === 1 ? (
                <>
                  <Text style={styles.parchmentTitle}>
                    {locale === "vi"
                      ? "Bạn đang quan tâm vấn đề gì về sức khỏe?"
                      : "What health concerns interest you?"}
                  </Text>
                  <Text style={styles.parchmentDesc}>
                    {locale === "vi"
                      ? "Chọn một hoặc nhiều vấn đề bên dưới, hoặc chạm \"Vấn đề khác\" để tự mô tả vấn đề của bạn."
                      : "Choose one or more concerns, or tap Something else to type your own."}
                  </Text>

                  <View style={styles.concernsGrid}>
                    {HEALTH_CONCERNS.map((item) => {
                      const active = selectedConcerns.includes(item.id);
                      return (
                        <TouchableOpacity
                          key={item.id}
                          style={[styles.concernChipCard, active && styles.concernChipCardActive]}
                          accessibilityRole="button"
                          accessibilityLabel={`concern-${item.id}`}
                          activeOpacity={0.8}
                          onPress={() => toggleConcern(item.id)}
                        >
                          <View style={[styles.concernCheckSquare, active && styles.concernCheckSquareActive]}>
                            {active && <Check size={12} color="#ffffff" />}
                          </View>
                          <Text style={[styles.concernLabelText, active && styles.concernLabelTextActive]}>
                            {locale === "vi" ? item.vi : item.en}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {selectedConcerns.length > 1 && (
                    <View style={styles.primaryFocusBox}>
                      <Text style={styles.primaryFocusTitle}>
                        {locale === "vi" ? "Mục ưu tiên chính trong hành trình:" : "Primary focus:"}
                      </Text>
                      <View style={styles.primaryFocusPills}>
                        {selectedConcerns.map((cid) => {
                          const found = HEALTH_CONCERNS.find((c) => c.id === cid);
                          if (!found) return null;
                          const isPrimary = (primaryConcernId || selectedConcerns[0]) === cid;
                          return (
                            <TouchableOpacity
                              key={cid}
                              style={[styles.focusStarPill, isPrimary && styles.focusStarPillActive]}
                              onPress={() => setPrimaryConcernId(cid)}
                            >
                              <Text style={[styles.focusStarText, isPrimary && styles.focusStarTextActive]}>
                                {isPrimary ? "★ " : ""}
                                {locale === "vi" ? found.vi : found.en}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  )}

                  {selectedConcerns.includes("other") && (
                    <View style={styles.inputFieldBox}>
                      <Text style={styles.parchmentInputLabel}>
                        {locale === "vi" ? "Tự mô tả vấn đề sức khỏe của bạn *" : "Briefly describe your concern *"}
                      </Text>
                      <TextInput
                        style={styles.parchmentTextInput}
                        accessibilityLabel="onboarding-custom-concern-input"
                        placeholder={
                          locale === "vi"
                            ? "VD: Khó ngủ sâu, hay mỏi vai gáy, muốn giảm cân..."
                            : "e.g. Trouble sleeping, back stiffness..."
                        }
                        placeholderTextColor="#6b8075"
                        maxLength={100}
                        value={concernNote}
                        onChangeText={(val) => {
                          setConcernNote(val);
                          setDiscoveryError(null);
                        }}
                      />
                    </View>
                  )}

                  {discoveryError && (
                    <View style={styles.discoveryErrorBox}>
                      <Text style={styles.discoveryErrorText}>{discoveryError}</Text>
                    </View>
                  )}
                </>
              ) : (
                <>
                  <Text style={styles.parchmentTitle}>
                    {locale === "vi"
                      ? "Những điều nào dưới đây đúng với bạn?"
                      : "Which of these apply to you?"}
                  </Text>
                  <Text style={styles.parchmentDesc}>
                    {locale === "vi"
                      ? "Chọn nhiều mục nếu đúng (hoặc bỏ qua nếu muốn). Bạn cũng có thể ghi chú thêm nếp sinh hoạt riêng."
                      : "Choose any that apply, or leave unchecked."}
                  </Text>

                  <View style={styles.concernsGrid}>
                    {allStep2Factors.map((item) => {
                      const active = selectedFactors.includes(item.id);
                      return (
                        <TouchableOpacity
                          key={item.id}
                          style={[styles.concernChipCard, active && styles.concernChipCardActive]}
                          accessibilityRole="button"
                          accessibilityLabel={`factor-${item.id}`}
                          activeOpacity={0.8}
                          onPress={() => toggleFactor(item.id)}
                        >
                          <View style={[styles.concernCheckSquare, active && styles.concernCheckSquareActive]}>
                            {active && <Check size={12} color="#ffffff" />}
                          </View>
                          <Text style={[styles.concernLabelText, active && styles.concernLabelTextActive]}>
                            {locale === "vi" ? item.vi : item.en}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <View style={styles.inputFieldBox}>
                    <Text style={styles.parchmentInputLabel}>
                      {locale === "vi" ? "Ghi chú thêm hoàn cảnh / mong muốn (tùy chọn)" : "Additional context (optional)"}
                    </Text>
                    <TextInput
                      style={styles.parchmentTextInput}
                      accessibilityLabel="onboarding-factor-note-input"
                      placeholder={
                        locale === "vi"
                          ? "VD: Ngồi 8h/ngày, rảnh buổi tối..."
                          : "e.g. Desk job 8h/day, prefer evening..."
                      }
                      placeholderTextColor="#6b8075"
                      maxLength={180}
                      value={factorNote}
                      onChangeText={setFactorNote}
                    />
                  </View>

                  <View style={styles.safetyParchmentNote}>
                    <ShieldCheck size={15} color="#047857" />
                    <Text style={styles.safetyParchmentText}>
                      Các lựa chọn là thông tin tự chia sẻ về nếp sinh hoạt, không phải chẩn đoán hay chỉ định điều trị.
                    </Text>
                  </View>
                </>
              )}
            </View>
          </ScrollView>

          <View style={styles.stickyBottomBar}>
            <View style={styles.stickyInnerMaxWidth}>
              <View style={styles.discoveryFooterRow}>
                {discoveryScreen === 1 ? (
                  <>
                    <TouchableOpacity
                      style={styles.parchmentBackBtn}
                      onPress={() => setStep("quest_choice")}
                    >
                      <ArrowLeft size={16} color="#1b4a3e" />
                      <Text style={styles.parchmentBackBtnText}>Quay lại</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.parchmentNextBtn}
                      accessibilityRole="button"
                      accessibilityLabel="discovery-step1-next"
                      onPress={handleDiscoveryNext}
                    >
                      <Text style={styles.parchmentNextBtnText}>Tiếp tục</Text>
                      <ArrowRight size={16} color="#ffffff" />
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <TouchableOpacity
                      style={styles.parchmentBackBtn}
                      onPress={() => {
                        setDiscoveryError(null);
                        setDiscoveryScreen(1);
                        setTimeout(() => discoveryScrollRef.current?.scrollTo({ y: 0, animated: false }), 40);
                      }}
                    >
                      <ArrowLeft size={16} color="#1b4a3e" />
                      <Text style={styles.parchmentBackBtnText}>Quay lại</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.parchmentNextBtn}
                      accessibilityRole="button"
                      accessibilityLabel="discovery-analyze-btn"
                      onPress={handleAnalyzeAndBuildPlan}
                    >
                      <Text style={styles.parchmentNextBtnText}>AI Phân Tích & Gợi Ý</Text>
                      <Sparkles size={15} color="#fde047" />
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          </View>
        </View>
      )}

      {/* ============================================================== */}
      {/* STEP 4: AI PERSONALIZED SOLUTIONS & HABIT SELECTION             */}
      {/* ============================================================== */}
      {step === "plan" && (
        <View style={styles.stepViewportContainer}>
          <View style={styles.stepTrailFixedWrap}>
            <OnboardingStepTrail activeStep={3} locale={locale} />
          </View>
          <ScrollView
            ref={planScrollRef}
            style={styles.innerScroll}
            contentContainerStyle={styles.innerScrollContentWithSticky}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.planHeaderBox}>
              <View style={styles.lumiAvatarBox}>
                <Image
                  source={require("../../assets/game/ui/lumi_fox_clean.png")}
                  style={styles.lumiAvatarImg}
                  contentFit="contain"
                />
              </View>
              <View style={styles.planHeaderTag}>
                {advisorLoading || providerStatus === "GEMINI_AI" ? (
                  <Sparkles size={13} color={colors.goldLight} />
                ) : providerStatus === "DETERMINISTIC_DEMO" ? (
                  <ScrollText size={13} color={colors.goldLight} />
                ) : (
                  <Smartphone size={13} color={colors.goldLight} />
                )}
                <Text style={styles.planHeaderTagText} accessibilityLabel="advisor-provider-badge">
                  {advisorLoading
                    ? "ĐANG PHÂN TÍCH HỒ SƠ..."
                    : providerStatus === "GEMINI_AI"
                      ? `PHÂN TÍCH AI GEMINI${providerModel ? ` · ${providerModel}` : ""}`
                      : providerStatus === "DETERMINISTIC_DEMO"
                        ? "GỢI Ý TỪ HỒ SƠ KHÁM PHÁ"
                        : "GỢI Ý CÁ NHÂN HÓA (NGOẠI TUYẾN)"}
                </Text>
              </View>
              <Text style={styles.planMainTitle}>Kế Hoạch Giải Pháp Dành Cho Bạn</Text>
              <Text style={styles.planSubtitle}>
                Dựa trên mối quan tâm <Text style={{ color: "#fde047", fontWeight: "700" }}>{displayFocus}</Text>, hãy chọn mức độ phù hợp hoặc tự thêm thói quen riêng:
              </Text>
              {!advisorLoading && (
                <View style={styles.planReassurePill}>
                  <ShieldCheck size={13} color="#6ee7b7" />
                  <Text style={styles.planReassureText}>
                    Gợi ý an toàn · Có thể đổi hoặc chỉnh bất cứ lúc nào
                  </Text>
                </View>
              )}
            </View>

            {advisorLoading ? (
              <View style={styles.loadingCard} accessibilityLabel="advisor-loading-card">
                <ActivityIndicator size="large" color={colors.emeraldLight} />
                <Text style={styles.loadingCardTitle}>Bé Cáo Lumi & AI đang phân tích câu trả lời của bạn...</Text>
                <Text style={styles.loadingCardSub}>
                  Đang đối chiếu thói quen an toàn & gợi ý 2 cấp độ Khởi Động / Bứt Phá cho vấn đề "{displayFocus}".
                </Text>
                {builtProfile && (
                  <TouchableOpacity
                    style={styles.quickFallbackBtn}
                    accessibilityRole="button"
                    accessibilityLabel="plan-quick-fallback-btn"
                    onPress={handleQuickFallbackPlan}
                  >
                    <Text style={styles.quickFallbackBtnText}>Dùng gợi ý nhanh ngay →</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <>
                <View style={styles.planCardsList}>
                  {aiGoals.map((goal) => {
                    const included = Boolean(includedMap[goal.goalId]);
                    const activeMode = modeMap[goal.goalId] || "A";
                    const isEditingCustom = editingGoalId === goal.goalId || activeMode === "custom";
                    const customDraft = customDrafts[goal.goalId] || "";
                    return (
                      <View
                        key={goal.goalId}
                        style={[styles.aiGoalCard, !included && styles.aiGoalCardExcluded]}
                        accessibilityLabel={`plan-goal-card-${goal.goalId}`}
                      >
                        {/* Header Row: 44x44 Hitbox Checkbox + Title + EXP */}
                        <View style={styles.aiGoalTopRow}>
                          <TouchableOpacity
                            style={styles.goalToggleHitbox}
                            accessibilityRole="checkbox"
                            accessibilityLabel={`plan-toggle-${goal.goalId}`}
                            onPress={() => handleToggleAiGoal(goal.goalId)}
                          >
                            <View style={[styles.goalToggleSeal, included && styles.goalToggleSealActive]}>
                              {included && <Check size={14} color="#042f2e" />}
                            </View>
                          </TouchableOpacity>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.aiGoalTitle}>
                              {locale === "vi" ? goal.title.vi : goal.title.en}
                            </Text>
                          </View>
                          <Text style={styles.expPill}>+{activeMode === "B" || activeMode === "custom" ? 15 : 10} EXP</Text>
                        </View>

                      {/* AI Relevance Explanation */}
                      <Text style={styles.aiGoalReason}>
                        {locale === "vi" ? goal.relevanceReason.vi : goal.relevanceReason.en}
                      </Text>

                      {/* Option A / B / Custom Choices */}
                      <View style={styles.optionChipsCol}>
                        <TouchableOpacity
                          style={[
                            styles.levelOptionBtn,
                            included && activeMode === "A" && styles.levelOptionBtnActive,
                          ]}
                          accessibilityRole="button"
                          accessibilityLabel={`plan-opt-a-${goal.goalId}`}
                          onPress={() => handleChooseOption(goal.goalId, "A")}
                        >
                          <View style={styles.levelHeaderRow}>
                            <Text style={styles.levelBadgeA}>Khởi Động</Text>
                            <Text style={styles.levelTitleText}>
                              {locale === "vi" ? goal.optionA.title.vi : goal.optionA.title.en}
                            </Text>
                          </View>
                          <Text style={styles.levelActionText}>
                            {locale === "vi" ? goal.optionA.action.vi : goal.optionA.action.en}
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.levelOptionBtn,
                            included && activeMode === "B" && styles.levelOptionBtnActive,
                          ]}
                          accessibilityRole="button"
                          accessibilityLabel={`plan-opt-b-${goal.goalId}`}
                          onPress={() => handleChooseOption(goal.goalId, "B")}
                        >
                          <View style={styles.levelHeaderRow}>
                            <Text style={styles.levelBadgeB}>Bứt Phá</Text>
                            <Text style={styles.levelTitleText}>
                              {locale === "vi" ? goal.optionB.title.vi : goal.optionB.title.en}
                            </Text>
                          </View>
                          <Text style={styles.levelActionText}>
                            {locale === "vi" ? goal.optionB.action.vi : goal.optionB.action.en}
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.levelOptionBtn,
                            included && activeMode === "custom" && styles.levelOptionBtnActive,
                          ]}
                          accessibilityRole="button"
                          accessibilityLabel={`plan-opt-custom-${goal.goalId}`}
                          onPress={() => {
                            triggerHaptic();
                            setEditingGoalId(goal.goalId);
                            setModeMap((prev) => ({ ...prev, [goal.goalId]: "custom" }));
                            setIncludedMap((prev) => ({ ...prev, [goal.goalId]: true }));
                          }}
                        >
                          <View style={styles.levelHeaderRow}>
                            <Text style={styles.levelBadgeCustom}>Tự điều chỉnh</Text>
                            <Text style={styles.levelTitleText}>
                              {customDraft.trim() ? customDraft : "Nhập phiên bản của riêng bạn"}
                            </Text>
                          </View>
                        </TouchableOpacity>

                        {isEditingCustom && (
                          <View style={styles.inlineCustomRow}>
                            <TextInput
                              style={styles.inlineCustomInput}
                              accessibilityLabel={`plan-custom-input-${goal.goalId}`}
                              placeholder="VD: Đi bộ nhẹ 10 phút trước bữa tối..."
                              placeholderTextColor="rgba(255,255,255,0.45)"
                              maxLength={140}
                              value={customDraft}
                              onChangeText={(txt) =>
                                setCustomDrafts((prev) => ({ ...prev, [goal.goalId]: txt }))
                              }
                            />
                            <TouchableOpacity
                              style={styles.inlineCustomSaveBtn}
                              accessibilityLabel={`plan-custom-save-${goal.goalId}`}
                              onPress={() => handleApplyInlineCustom(goal.goalId)}
                            >
                              <Text style={styles.inlineCustomSaveText}>Lưu</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>

              {/* Extra Custom User Habits Added Right During Onboarding */}
              {extraCustomGoals.length > 0 && (
                <View style={styles.extraCustomSection}>
                  <Text style={styles.extraCustomHeading}>Thói quen bạn tự thêm ({extraCustomGoals.length})</Text>
                  {extraCustomGoals.map((item) => (
                    <View key={item.id} style={styles.extraCustomItem}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.extraCustomTitle}>{item.title}</Text>
                        <Text style={styles.extraCustomMeta}>{item.category} · +{item.expValue} EXP</Text>
                      </View>
                      <TouchableOpacity
                        accessibilityLabel={`remove-extra-habit-${item.id}`}
                        onPress={() => setExtraCustomGoals((curr) => curr.filter((g) => g.id !== item.id))}
                        style={{ padding: 6 }}
                      >
                        <Trash2 size={15} color="#f43f5e" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              {/* Toggle Add Custom Habit Card */}
              <TouchableOpacity
                style={styles.addCustomToggleBtn}
                accessibilityRole="button"
                accessibilityLabel="onboarding-toggle-custom-habit-btn"
                onPress={() => {
                  triggerHaptic();
                  setShowAddCustomHabit((p) => {
                    const next = !p;
                    if (next) {
                      setTimeout(() => planScrollRef.current?.scrollToEnd({ animated: true }), 90);
                    }
                    return next;
                  });
                  setNewHabitError(null);
                }}
              >
                <Plus size={16} color="#fde047" />
                <Text style={styles.addCustomToggleText}>
                  {showAddCustomHabit ? "Ẩn khung tự thêm thói quen" : "Tự thêm thói quen riêng của bạn"}
                </Text>
              </TouchableOpacity>

              {showAddCustomHabit && (
                <View style={styles.addCustomBox}>
                  <TextInput
                    style={styles.inlineCustomInput}
                    accessibilityLabel="onboarding-custom-habit-input"
                    placeholder="Nhập thói quen của bạn (VD: Thiền thở 5 phút sáng)..."
                    placeholderTextColor="rgba(255,255,255,0.45)"
                    maxLength={120}
                    value={newHabitTitle}
                    onChangeText={(txt) => {
                      setNewHabitTitle(txt);
                      setNewHabitError(null);
                    }}
                  />
                  <View style={styles.categoryChipsRow}>
                    {["Vận Động", "Dinh Dưỡng", "Giấc Ngủ", "Thư Giãn"].map((cat) => (
                      <TouchableOpacity
                        key={cat}
                        style={[styles.catChip, newHabitCategory === cat && styles.catChipActive]}
                        onPress={() => setNewHabitCategory(cat)}
                      >
                        <Text style={[styles.catChipText, newHabitCategory === cat && styles.catChipTextActive]}>
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  {newHabitError && <Text style={styles.newHabitErrorText}>{newHabitError}</Text>}
                  <TouchableOpacity
                    style={styles.confirmCustomHabitBtn}
                    accessibilityRole="button"
                    accessibilityLabel="onboarding-save-custom-habit-btn"
                    onPress={handleAddExtraCustomHabit}
                  >
                    <Text style={styles.confirmCustomHabitBtnText}>Thêm vào kế hoạch (+15 EXP/ngày)</Text>
                  </TouchableOpacity>
                </View>
              )}
              </>
            )}
          </ScrollView>

          {!advisorLoading && (
            <View style={styles.stickyBottomBarDark}>
              <View style={styles.stickyInnerMaxWidth}>
                <View style={styles.planFooterMetaRow}>
                  <Text style={styles.selectedCountText} accessibilityLabel="onboarding-selected-count">
                    Đã chọn {totalSelectedGoals} thói quen
                  </Text>
                  <View style={styles.planSecondaryActions}>
                    <TouchableOpacity
                      style={styles.miniOutlineBtn}
                      onPress={() => {
                        setDiscoveryScreen(1);
                        setStep("discovery");
                      }}
                    >
                      <ArrowLeft size={12} color="#cbd5e1" />
                      <Text style={styles.miniOutlineBtnText}>Sửa vấn đề</Text>
                    </TouchableOpacity>
                    {builtProfile && (
                      <TouchableOpacity
                        style={styles.miniOutlineBtn}
                        accessibilityLabel="plan-retry-ai-btn"
                        onPress={() => void runAdvisorAnalysis(builtProfile, requestQuestId)}
                      >
                        <RefreshCw size={12} color="#34d399" />
                        <Text style={[styles.miniOutlineBtnText, { color: "#34d399" }]}>Gợi ý lại</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.enterRealmBtn}
                  accessibilityRole="button"
                  accessibilityLabel="onboarding-enter-world-btn"
                  activeOpacity={0.85}
                  onPress={handleEnterWorld}
                  disabled={completing}
                >
                  {completing ? (
                    <ActivityIndicator size="small" color="#042f2e" />
                  ) : (
                    <>
                      <Text style={styles.enterRealmBtnText} numberOfLines={1}>
                        Bắt Đầu Hành Trình (+50 EXP)
                      </Text>
                      <ArrowRight size={16} color="#042f2e" />
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#071713" },
  welcomeBackground: { flex: 1, width: "100%", height: "100%" },
  welcomeVignette: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(7, 23, 19, 0.72)" },
  welcomeTopBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingTop: Platform.OS === "android" ? 10 : 6,
    paddingBottom: 8,
    zIndex: 10,
  },
  brandBadge: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1, flexShrink: 1, marginRight: 8 },
  brandTextWrap: { flexShrink: 1 },
  brandIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(230, 205, 136, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(230, 205, 136, 0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  brandTitleText: { fontFamily: fonts.uiExtraBold, fontSize: 13.5, fontWeight: "900", color: "#fef08a", letterSpacing: 0.6 },
  brandSubtitleText: { fontFamily: fonts.uiSemiBold, fontSize: 10.5, fontWeight: "700", color: "rgba(254, 240, 138, 0.78)", letterSpacing: 0.3 },
  welcomeTopActions: { flexDirection: "row", alignItems: "center", gap: 6 },
  topAudioIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(7, 23, 19, 0.78)",
    borderWidth: 1,
    borderColor: "rgba(230, 205, 136, 0.4)",
  },
  topSignInBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    minHeight: 40,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: "rgba(7, 23, 19, 0.78)",
    borderWidth: 1,
    borderColor: "rgba(230, 205, 136, 0.4)",
  },
  topSignInText: { fontSize: 12, fontWeight: "700", color: "#fef08a" },
  welcomeCenterContent: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl, alignItems: "center" },
  welcomeChibiWrapper: {
    position: "relative",
    width: 140,
    height: 140,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  welcomeChibiImg: { width: 128, height: 128 },
  welcomeFireflyGlow: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(230, 205, 136, 0.12)",
  },
  cozyEyebrowPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radius.full,
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.4)",
    marginBottom: spacing.sm,
  },
  cozyEyebrowText: { fontFamily: fonts.uiBold, fontSize: 11, fontWeight: "800", color: "#fef08a", letterSpacing: 0.5 },
  heroMainTitle: { fontFamily: fonts.displayBold, fontSize: 34, fontWeight: "900", color: "#ffffff", letterSpacing: 1.2, textAlign: "center" },
  heroSubSerif: { fontFamily: fonts.displaySemiBold, fontSize: 19, fontWeight: "700", color: "#e6cd88", textAlign: "center", marginTop: 4, marginBottom: 8 },
  heroDescParagraph: {
    fontFamily: fonts.ui,
    fontSize: 13.5,
    lineHeight: 20,
    color: "rgba(255, 255, 255, 0.86)",
    textAlign: "center",
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  languagePillContainer: { alignItems: "center", marginBottom: spacing.lg },
  languageLabel: { fontSize: 11, fontWeight: "600", color: "rgba(255, 255, 255, 0.6)", marginBottom: 6 },
  langButtonsRow: {
    flexDirection: "row",
    backgroundColor: "rgba(7, 23, 19, 0.85)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: radius.full,
    padding: 3,
    gap: 4,
  },
  langBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    minHeight: 40,
    justifyContent: "center",
    borderRadius: radius.full,
  },
  langBtnActive: { backgroundColor: "#e6cd88" },
  langBtnText: { fontSize: 12, fontWeight: "700", color: "rgba(255, 255, 255, 0.7)" },
  langBtnTextActive: { color: "#19322c" },
  startJourneyCtaBtn: {
    width: "100%",
    maxWidth: 420,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#e6cd88",
    borderRadius: radius.xl,
    paddingVertical: 16,
    minHeight: 52,
    marginBottom: spacing.sm,
  },
  startJourneyCtaText: { fontFamily: fonts.uiExtraBold, fontSize: 16, fontWeight: "900", color: "#3d2c06" },
  alreadyAccountLink: {
    minHeight: 42,
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: spacing.sm,
  },
  alreadyAccountText: { fontFamily: fonts.uiSemiBold, fontSize: 13, fontWeight: "700", color: "#fef08a", textDecorationLine: "underline" },
  disclaimerText: { fontFamily: fonts.ui, fontSize: 11.5, color: "rgba(255, 255, 255, 0.56)", textAlign: "center", lineHeight: 17, marginBottom: spacing.lg },
  bottomWorldNoteRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: spacing.sm },
  noteLine: { width: 32, height: 1, backgroundColor: "rgba(230, 205, 136, 0.3)" },
  bottomWorldNoteText: { fontFamily: fonts.uiBold, fontSize: 10.5, fontWeight: "800", color: "rgba(230, 205, 136, 0.78)", letterSpacing: 1 },

  stepViewportContainer: { flex: 1, backgroundColor: "#071713" },
  stepTrailFixedWrap: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: 4,
    maxWidth: 640,
    width: "100%",
    alignSelf: "center",
  },
  stepTrailBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  stepTrailPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRadius: radius.full,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  stepTrailPillActive: {
    backgroundColor: "rgba(245, 158, 11, 0.2)",
    borderColor: "#f59e0b",
  },
  stepTrailPillDone: {
    backgroundColor: "rgba(16, 185, 129, 0.16)",
    borderColor: "rgba(52, 211, 153, 0.45)",
  },
  stepTrailText: { fontFamily: fonts.uiSemiBold, fontSize: 11.5, fontWeight: "700", color: colors.textSecondary },
  stepTrailTextActive: { color: "#fef08a" },
  stepTrailTextDone: { color: "#6ee7b7" },
  stepTrailConnector: { width: 8, height: 1.5, backgroundColor: "rgba(255,255,255,0.16)", marginHorizontal: 3 },

  innerScroll: { flex: 1, backgroundColor: "#071713" },
  innerScrollContent: { paddingHorizontal: spacing.md, paddingVertical: spacing.md, maxWidth: 640, width: "100%", alignSelf: "center" },
  innerScrollContentWithSticky: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xl,
    maxWidth: 640,
    width: "100%",
    alignSelf: "center",
  },
  stickyBottomBar: {
    backgroundColor: "#f5efe0",
    borderTopWidth: 1,
    borderTopColor: "#dcd1b0",
    paddingHorizontal: spacing.md,
    paddingTop: 10,
    paddingBottom: 12,
  },
  stickyBottomBarDark: {
    backgroundColor: "#091e18",
    borderTopWidth: 1,
    borderTopColor: "rgba(52, 211, 153, 0.25)",
    paddingHorizontal: spacing.md,
    paddingTop: 10,
    paddingBottom: 12,
  },
  stickyInnerMaxWidth: { maxWidth: 640, width: "100%", alignSelf: "center" },
  chapterHeaderCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.3)",
    borderRadius: radius.xl,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  chapterAvatar: { width: 44, height: 44 },
  chapterInfo: { flex: 1 },
  chapterKicker: { fontFamily: fonts.uiBold, fontSize: 11, fontWeight: "800", color: colors.emeraldLight, letterSpacing: 0.4 },
  chapterTitle: { fontFamily: fonts.uiBold, fontSize: 15, fontWeight: "700", color: "#ffffff", marginTop: 2 },
  parchmentCard: { backgroundColor: "#fbf8f0", borderRadius: radius.xxl, padding: spacing.lg },
  parchmentKickerRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  parchmentKicker: { fontFamily: fonts.uiExtraBold, fontSize: 11, fontWeight: "900", color: "#047857", letterSpacing: 0.8 },
  parchmentTitle: { fontFamily: fonts.displayBold, fontSize: 22, fontWeight: "900", color: "#132a22", marginTop: 4, marginBottom: 6, lineHeight: 29 },
  parchmentDesc: { fontFamily: fonts.ui, fontSize: 13.5, lineHeight: 19.5, color: "#3f594e", marginBottom: spacing.md },
  lockNoticeBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fef3c7",
    borderWidth: 1,
    borderColor: "#f59e0b",
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  lockNoticeText: { fontSize: 12, fontWeight: "600", color: "#92400e", flex: 1 },
  questOptionsList: { gap: spacing.md, marginBottom: spacing.lg },
  questItemCard: { borderRadius: radius.xl, overflow: "hidden", borderWidth: 2, borderColor: "transparent" },
  questItemCardActive: { borderColor: "#059669" },
  questItemCardLocked: { opacity: 0.72 },
  questCardBgImage: { width: "100%", minHeight: 135, justifyContent: "flex-end" },
  questOverlayDark: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(10, 25, 20, 0.78)" },
  questOverlayDarker: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(15, 15, 25, 0.88)" },
  questContentFront: { padding: spacing.md },
  questBadgeRow: { flexDirection: "row", marginBottom: 6 },
  questBadgeActive: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#10b981", paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full },
  questBadgeActiveText: { fontFamily: fonts.uiExtraBold, fontSize: 10.5, fontWeight: "900", color: "#042f2e" },
  questBadgeLocked: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(245, 158, 11, 0.2)",
    borderWidth: 1,
    borderColor: "#f59e0b",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  questBadgeLockedText: { fontFamily: fonts.uiBold, fontSize: 10.5, fontWeight: "800", color: "#fcd34d" },
  questHeroInfo: { gap: 4 },
  questNameMain: { fontFamily: fonts.displayBold, fontSize: 19, fontWeight: "900", color: "#ffffff" },
  companionTag: { flexDirection: "row", alignItems: "center", gap: 6 },
  companionMiniIcon: { width: 18, height: 18 },
  companionTagName: { fontSize: 12, fontWeight: "700", color: "#34d399" },
  companionLocked: { fontSize: 11, fontWeight: "600", color: "rgba(255, 255, 255, 0.6)" },
  questSummaryText: { fontSize: 11.5, lineHeight: 16, color: "rgba(255, 255, 255, 0.88)", marginTop: 2 },
  questSummaryTextLocked: { fontSize: 11, lineHeight: 16, color: "rgba(255, 255, 255, 0.5)", marginTop: 2 },
  parchmentContinueBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.emerald,
    borderRadius: radius.xl,
    paddingVertical: 14,
  },
  parchmentContinueText: { fontSize: 15, fontWeight: "800", color: "#042f2e" },

  // Discovery Step Styles
  discoveryTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  stepBadgePill: {
    backgroundColor: "#fffbf0",
    borderWidth: 1,
    borderColor: "#d6c48a",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  stepBadgePillText: { fontSize: 10.5, fontWeight: "800", color: "#856526" },
  concernsGrid: { gap: 8, marginBottom: spacing.md },
  concernChipCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#ffffff",
    borderWidth: 1.5,
    borderColor: "#ded9c5",
    borderRadius: radius.lg,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  concernChipCardActive: { borderColor: "#9c7b33", backgroundColor: "#fff4d1" },
  concernCheckSquare: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#cfc6ab",
    backgroundColor: "#faf8f0",
    alignItems: "center",
    justifyContent: "center",
  },
  concernCheckSquareActive: { backgroundColor: "#8a6820", borderColor: "#8a6820" },
  concernLabelText: { flex: 1, fontSize: 13.5, fontWeight: "700", color: "#2a3c33" },
  concernLabelTextActive: { color: "#132a22" },
  primaryFocusBox: {
    backgroundColor: "#fffaf0",
    borderWidth: 1,
    borderColor: "#dfc982",
    borderRadius: radius.lg,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  primaryFocusTitle: { fontSize: 11, fontWeight: "800", color: "#80652f", textTransform: "uppercase", marginBottom: 6 },
  primaryFocusPills: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  focusStarPill: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#c8bc94",
    borderRadius: radius.md,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  focusStarPillActive: { backgroundColor: "#1b4a3e", borderColor: "#1b4a3e" },
  focusStarText: { fontSize: 11.5, fontWeight: "700", color: "#294235" },
  focusStarTextActive: { color: "#fff6db" },
  inputFieldBox: { marginBottom: spacing.md },
  parchmentInputLabel: { fontSize: 12.5, fontWeight: "800", color: "#233d32", marginBottom: 6 },
  parchmentTextInput: {
    backgroundColor: "#ffffff",
    borderWidth: 1.5,
    borderColor: "#c9be9a",
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13.5,
    color: "#132a22",
  },
  discoveryErrorBox: { backgroundColor: "#fee2e2", borderRadius: radius.md, padding: spacing.sm, marginBottom: spacing.md },
  discoveryErrorText: { fontSize: 12, fontWeight: "700", color: "#991b1b" },
  safetyParchmentNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#ecfdf5",
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  safetyParchmentText: { flex: 1, fontSize: 11.5, color: "#065f46", lineHeight: 16 },
  discoveryFooterRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10, marginTop: 4 },
  parchmentBackBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderColor: "#b8a674",
    backgroundColor: "#ffffff",
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  parchmentBackBtnText: { fontSize: 13, fontWeight: "700", color: "#354f42" },
  parchmentNextBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#1b4a3e",
    borderRadius: radius.lg,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  parchmentNextBtnText: { fontSize: 13.5, fontWeight: "800", color: "#fff6db" },

  // Plan Screen Styles
  planHeaderBox: { alignItems: "center", marginBottom: spacing.md },
  lumiAvatarBox: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    borderWidth: 2,
    borderColor: colors.emeraldLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  lumiAvatarImg: { width: 54, height: 54 },
  planHeaderTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    borderWidth: 1,
    borderColor: colors.gold,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    marginBottom: 6,
  },
  planHeaderTagText: { fontFamily: fonts.uiBold, fontSize: 11, fontWeight: "800", color: colors.goldLight, letterSpacing: 0.4 },
  planMainTitle: { fontFamily: fonts.displayBold, fontSize: 20, fontWeight: "800", color: colors.textPrimary, textAlign: "center", marginBottom: 4 },
  planSubtitle: { fontFamily: fonts.ui, fontSize: 13, color: colors.textSecondary, textAlign: "center", lineHeight: 19 },
  planReassurePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(110, 231, 183, 0.28)",
  },
  planReassureText: { fontFamily: fonts.uiSemiBold, fontSize: 11.5, fontWeight: "600", color: "#a7f3d0" },
  loadingCard: {
    backgroundColor: "rgba(10, 26, 21, 0.9)",
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderGold,
    padding: spacing.xl,
    alignItems: "center",
    gap: 10,
  },
  loadingCardTitle: { fontSize: 14.5, fontWeight: "800", color: colors.textGold, textAlign: "center" },
  loadingCardSub: { fontSize: 12, color: colors.textSecondary, textAlign: "center", lineHeight: 17 },
  quickFallbackBtn: {
    marginTop: 6,
    minHeight: 42,
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: radius.full,
    backgroundColor: "rgba(16, 185, 129, 0.16)",
    borderWidth: 1,
    borderColor: colors.emeraldLight,
  },
  quickFallbackBtnText: { fontSize: 12.5, fontWeight: "800", color: "#6ee7b7" },
  planCardsList: { gap: 10, marginBottom: spacing.md },
  aiGoalCard: {
    backgroundColor: "rgba(10, 26, 21, 0.94)",
    borderWidth: 1.5,
    borderColor: "rgba(52, 211, 153, 0.35)",
    borderRadius: radius.xl,
    padding: 12,
    gap: 8,
  },
  aiGoalCardExcluded: { opacity: 0.55, borderColor: "rgba(255,255,255,0.12)" },
  aiGoalTopRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  goalToggleHitbox: {
    width: 44,
    height: 44,
    marginLeft: -8,
    marginVertical: -6,
    alignItems: "center",
    justifyContent: "center",
  },
  goalToggleSeal: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: colors.emeraldLight,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  goalToggleSealActive: { backgroundColor: colors.emeraldLight },
  aiGoalTitle: { fontFamily: fonts.uiBold, fontSize: 14.5, fontWeight: "800", color: "#ffffff" },
  expPill: {
    fontFamily: fonts.uiBold,
    fontSize: 11,
    fontWeight: "800",
    color: colors.goldLight,
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: radius.sm,
  },
  aiGoalReason: { fontFamily: fonts.ui, fontSize: 12, color: "#a7f3d0", lineHeight: 17 },
  optionChipsCol: { gap: 6 },
  levelOptionBtn: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: radius.md,
    padding: 10,
    minHeight: 44,
    justifyContent: "center",
  },
  levelOptionBtnActive: { backgroundColor: "rgba(16, 185, 129, 0.16)", borderColor: colors.emeraldLight },
  levelHeaderRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 },
  levelBadgeA: {
    fontFamily: fonts.uiBold,
    fontSize: 10.5,
    fontWeight: "800",
    color: "#064e3b",
    backgroundColor: "#6ee7b7",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  levelBadgeB: {
    fontFamily: fonts.uiBold,
    fontSize: 10.5,
    fontWeight: "800",
    color: "#451a03",
    backgroundColor: "#fcd34d",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  levelBadgeCustom: {
    fontFamily: fonts.uiBold,
    fontSize: 10.5,
    fontWeight: "800",
    color: "#e0e7ff",
    backgroundColor: "rgba(99, 102, 241, 0.45)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  levelTitleText: { flex: 1, fontSize: 12, fontWeight: "700", color: "#ffffff" },
  levelActionText: { fontSize: 11, color: colors.textSecondary, lineHeight: 15 },
  inlineCustomRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 },
  inlineCustomInput: {
    flex: 1,
    backgroundColor: "#0a1c17",
    borderWidth: 1,
    borderColor: colors.borderGold,
    borderRadius: radius.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12.5,
    color: "#ffffff",
  },
  inlineCustomSaveBtn: {
    backgroundColor: colors.emeraldLight,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: radius.md,
  },
  inlineCustomSaveText: { fontSize: 12, fontWeight: "800", color: "#042f2e" },

  extraCustomSection: {
    backgroundColor: "rgba(250, 204, 21, 0.08)",
    borderWidth: 1,
    borderColor: colors.borderGold,
    borderRadius: radius.lg,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    gap: 6,
  },
  extraCustomHeading: { fontSize: 11.5, fontWeight: "800", color: colors.textGold },
  extraCustomItem: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(0,0,0,0.25)", borderRadius: radius.md, padding: 8 },
  extraCustomTitle: { fontSize: 13, fontWeight: "700", color: "#ffffff" },
  extraCustomMeta: { fontSize: 11, color: colors.emeraldLight, marginTop: 1 },

  addCustomToggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.borderGold,
    borderRadius: radius.lg,
    minHeight: 44,
    paddingVertical: 11,
    marginBottom: spacing.sm,
    backgroundColor: "rgba(250, 204, 21, 0.06)",
  },
  addCustomToggleText: { fontSize: 12.5, fontWeight: "700", color: colors.textGold },
  addCustomBox: {
    backgroundColor: "rgba(10, 26, 21, 0.96)",
    borderWidth: 1,
    borderColor: colors.borderGold,
    borderRadius: radius.lg,
    padding: spacing.sm,
    gap: 8,
    marginBottom: spacing.sm,
  },
  categoryChipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  catChip: {
    minHeight: 38,
    justifyContent: "center",
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  catChipActive: { borderColor: colors.emeraldLight, backgroundColor: "rgba(16, 185, 129, 0.18)" },
  catChipText: { fontSize: 11.5, fontWeight: "700", color: colors.textSecondary },
  catChipTextActive: { color: colors.emeraldLight },
  newHabitErrorText: { fontSize: 11.5, fontWeight: "700", color: "#fb7185" },
  confirmCustomHabitBtn: {
    backgroundColor: colors.gold,
    borderRadius: radius.md,
    minHeight: 44,
    justifyContent: "center",
    paddingVertical: 11,
    alignItems: "center",
  },
  confirmCustomHabitBtnText: { fontSize: 13, fontWeight: "800", color: "#2d1d04" },

  planFooterMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
    marginTop: 0,
  },
  selectedCountText: { fontSize: 12.5, fontWeight: "800", color: colors.emeraldLight },
  planSecondaryActions: { flexDirection: "row", gap: 8 },
  miniOutlineBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    minHeight: 38,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    borderRadius: radius.md,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  miniOutlineBtnText: { fontSize: 11.5, fontWeight: "700", color: "#cbd5e1" },
  enterRealmBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    minHeight: 48,
    backgroundColor: "#10b981",
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: "#fde047",
    paddingVertical: 13,
    paddingHorizontal: 16,
    marginTop: 2,
  },
  enterRealmBtnText: { fontSize: 14, fontWeight: "800", color: "#042f2e" },
});
