import React, { useState, useEffect, useRef, useMemo } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Platform,
  Alert,
  DeviceEventEmitter,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import {
  Backpack,
  Sparkles,
  X,
  CheckCircle2,
  Bookmark,
  BookmarkCheck,
  Info,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Clock,
  Flame,
  Leaf,
  Wind,
  Heart,
  Brain,
  Moon,
  Sun,
  Sliders,
  Plus,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Check,
  Music,
  Thermometer,
  Trash2,
  Compass,
} from "lucide-react-native";
import { colors, fonts, spacing, radius } from "@/theme";
import { t, useLocale } from "@/localization";
import { TopHud } from "@/components/common/TopHud";
import { useAuth } from "@/hooks/useAuth";
import { useWorld, WORLD_STATE_EVENT } from "@/hooks/useWorld";
import {
  soundscape,
  SOUND_TRACKS,
  SoundTrack,
} from "@/services/soundscapeEngine";
import {
  BREATH_EXERCISES,
  BreathExercise,
} from "@/services/breathworkData";
import {
  HERBAL_CATALOG,
  getLocalizedHerb,
  HerbalArticle,
} from "@/modules/herbal/herbalData";
import { toolkitStorage } from "@/services/toolkitStorage";

export type ToolkitTab = "herbs" | "sounds" | "breath";

const BOOKMARKS_STORAGE_KEY = "hc_mobile_botanical_bookmarks";

const DEFAULT_STARTER_HERB_IDS = [
  "matricaria-chamomilla",
  "passiflora-incarnata",
  "gymnema-sylvestre",
];

export default function InventoryScreen() {
  const { locale, strings } = useLocale();
  const { isAuthenticated } = useAuth();
  const {
    xpTotal,
    currencies,
    loading,
    refreshing,
    refreshWorld,
    addHabit,
  } = useWorld(isAuthenticated);

  const params = useLocalSearchParams<{ tab?: string }>();

  const router = useRouter();

  // Active top-level tab in Toolkit
  const [activeTab, setActiveTab] = useState<ToolkitTab>(
    params.tab === "sounds" || params.tab === "breath" ? params.tab : "herbs"
  );

  useEffect(() => {
    if (params.tab && (params.tab === "herbs" || params.tab === "sounds" || params.tab === "breath")) {
      setActiveTab(params.tab as ToolkitTab);
    }
  }, [params.tab]);

  // Filter categories per tab
  const [herbCategory, setHerbCategory] = useState<string>("all");
  const [soundCategory, setSoundCategory] = useState<string>("all");
  const [breathCategory, setBreathCategory] = useState<string>("all");

  // Toast / feedback message
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // --- TOOLKIT ITEMS SAVED IN STORAGE ---
  const [bookmarkedHerbIds, setBookmarkedHerbIds] = useState<string[]>([]);
  const [savedSoundIds, setSavedSoundIds] = useState<string[]>([]);
  const [savedBreathIds, setSavedBreathIds] = useState<string[]>([]);
  const [expandedHerbId, setExpandedHerbId] = useState<string | null>(null);

  // Sync all toolkit saved items from storage and listen to live changes
  useEffect(() => {
    const reloadAll = async () => {
      const herbs = await toolkitStorage.getSavedHerbIds();
      const sounds = await toolkitStorage.getSavedSoundIds();
      const breaths = await toolkitStorage.getSavedBreathIds();
      setBookmarkedHerbIds(herbs);
      setSavedSoundIds(sounds);
      setSavedBreathIds(breaths);
    };
    reloadAll();

    const sub = DeviceEventEmitter.addListener("HEALTHCLUES_TOOLKIT_CHANGED", () => {
      reloadAll();
    });
    return () => {
      sub.remove();
    };
  }, []);

  // --- TAB 1: HERBS ---
  const collectedHerbs = useMemo(() => {
    return HERBAL_CATALOG.filter((h) => bookmarkedHerbIds.includes(h.id)).map((h) =>
      getLocalizedHerb(h, locale)
    );
  }, [bookmarkedHerbIds, locale]);

  const filteredHerbs = useMemo(() => {
    if (herbCategory === "all") return collectedHerbs;
    return collectedHerbs.filter(
      (h) => h.categoryBadge.toLowerCase().includes(herbCategory.toLowerCase())
    );
  }, [collectedHerbs, herbCategory]);

  const handleRemoveHerb = async (id: string, name: string) => {
    triggerHaptic();
    const updated = await toolkitStorage.removeHerb(id);
    setBookmarkedHerbIds(updated);
    showToast(locale === "en" ? `Removed ${name} from Bag.` : `Đã bỏ ${name} khỏi Túi Đồ.`);
  };

  const handleAddHerbToJourney = async (herb: HerbalArticle) => {
    triggerSuccessHaptic();
    const hName = locale === "en" ? (herb.englishName || herb.commonName) : herb.commonName;
    try {
      await addHabit({
        title: locale === "en" ? `Drink 1 cup of ${hName}` : `Uống 1 tách ${herb.commonName}`,
        category: locale === "en" ? "Nutrition" : "Dinh Dưỡng",
        target: "1",
        unit: locale === "en" ? "cup" : "tách",
        daysPerWeek: 7,
        expValue: 20,
        description: locale === "en" ? `Natural herb: ${herb.englishName || herb.shortDesc}` : `Dược thảo tự nhiên: ${herb.shortDesc}`,
        evidence: `PubMed PMID: ${herb.study.pmid}`,
      });
      showToast(locale === "en" ? `Added "${hName} Tea" to Journey (+20 EXP)!` : `Đã thêm "Uống trà ${herb.commonName}" vào Hành Trình (+20 EXP)!`);
    } catch (err) {
      showToast(locale === "en" ? `Saved habit ${hName}!` : `Đã ghi nhận thói quen ${herb.commonName}!`);
    }
  };

  // --- TAB 2: SOUNDSCAPE STATE ---
  const [activeSoundIds, setActiveSoundIds] = useState<string[]>([]);
  const [soundVolumes, setSoundVolumes] = useState<Record<string, number>>({});
  const [sleepTimer, setSleepTimer] = useState<number | null>(null);

  // Sync soundscape manager state
  useEffect(() => {
    const syncState = () => {
      setActiveSoundIds(soundscape.getActiveTrackIds());
      const vols: Record<string, number> = {};
      SOUND_TRACKS.forEach((t) => {
        vols[t.id] = soundscape.getTrackVolume(t.id);
      });
      setSoundVolumes(vols);
      setSleepTimer(soundscape.getSleepTimerMinutes());
    };
    syncState();
  }, []);

  const collectedSounds = useMemo(() => {
    return SOUND_TRACKS.filter((s) => savedSoundIds.includes(s.id));
  }, [savedSoundIds]);

  const filteredSounds = useMemo(() => {
    if (soundCategory === "all") return collectedSounds;
    return collectedSounds.filter((s) => s.category === soundCategory);
  }, [collectedSounds, soundCategory]);

  const handleToggleSound = (trackId: string) => {
    triggerHaptic();
    const isNowPlaying = soundscape.toggleTrack(trackId);
    setActiveSoundIds(soundscape.getActiveTrackIds());
    if (isNowPlaying) {
      const track = SOUND_TRACKS.find((t) => t.id === trackId);
      const tName = locale === "en" ? (track?.nameEn || track?.name) : track?.name;
      showToast(locale === "en" ? `Playing concurrently: ${tName}` : `Đang phát song song: ${tName}`);
    }
  };

  const handleVolumeChange = (trackId: string, delta: number) => {
    const cur = soundVolumes[trackId] ?? 50;
    const next = Math.max(10, Math.min(100, cur + delta));
    soundscape.setTrackVolume(trackId, next);
    setSoundVolumes((prev) => ({ ...prev, [trackId]: next }));
  };

  const handleMuteAllSounds = () => {
    triggerHaptic();
    soundscape.stopAllTracks();
    setActiveSoundIds([]);
    showToast(locale === "en" ? "Muted all ambient sounds." : "Đã tạm dừng tất cả âm thanh.");
  };

  const handleCycleSleepTimer = () => {
    triggerHaptic();
    const timerOptions: (number | null)[] = [null, 15, 30, 60];
    const curIdx = timerOptions.indexOf(sleepTimer);
    const nextTimer = timerOptions[(curIdx + 1) % timerOptions.length];
    soundscape.setSleepTimer(nextTimer);
    setSleepTimer(nextTimer);
    showToast(
      nextTimer
        ? (locale === "en" ? `Sleep timer set to ${nextTimer} minutes.` : `Hẹn giờ tắt sau ${nextTimer} phút.`)
        : (locale === "en" ? "Sleep timer turned off." : "Đã hủy hẹn giờ tắt.")
    );
  };

  const handleRemoveSound = async (id: string, name: string) => {
    triggerHaptic();
    if (activeSoundIds.includes(id)) {
      soundscape.stopTrack(id);
      setActiveSoundIds((prev) => prev.filter((item) => item !== id));
    }
    const updated = await toolkitStorage.removeSound(id);
    setSavedSoundIds(updated);
    showToast(locale === "en" ? `Removed "${name}" from Bag.` : `Đã bỏ "${name}" khỏi Túi Đồ.`);
  };

  // --- TAB 3: BREATHWORK STATE ---
  const [activeBreathId, setActiveBreathId] = useState<string | null>(null);
  const [breathPhaseIndex, setBreathPhaseIndex] = useState(0);
  const [breathSecondsLeft, setBreathSecondsLeft] = useState(4);
  const [currentCycle, setCurrentCycle] = useState(1);
  const [isBreathRunning, setIsBreathRunning] = useState(false);
  const breathAnim = useRef(new Animated.Value(0.4)).current;
  const breathTimerRef = useRef<any>(null);

  const activeExercise = useMemo(() => {
    return BREATH_EXERCISES.find((e) => e.id === activeBreathId) || null;
  }, [activeBreathId]);

  // Breathing timer & animation loop
  useEffect(() => {
    if (!isBreathRunning || !activeExercise) {
      if (breathTimerRef.current) clearInterval(breathTimerRef.current);
      return;
    }

    const curPhase = activeExercise.phases[breathPhaseIndex];
    if (!curPhase) return;

    // Animate breath circle based on phase
    const isExpanding = curPhase.name === "inhale";
    const isHolding = curPhase.name === "hold" || curPhase.name === "hold_empty";
    const targetScale = isExpanding ? 1.0 : isHolding ? (breathAnim as any)._value : 0.4;
    const animDuration = curPhase.durationSec * 1000;

    Animated.timing(breathAnim, {
      toValue: targetScale,
      duration: isHolding ? 0 : animDuration,
      useNativeDriver: true,
    }).start();

    // Pulse haptic on phase start
    try {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch?.(() => {});
      }
    } catch {}

    setBreathSecondsLeft(curPhase.durationSec);

    breathTimerRef.current = setInterval(() => {
      setBreathSecondsLeft((prev) => {
        if (prev <= 1) {
          // Advance to next phase or next cycle
          const nextIdx = breathPhaseIndex + 1;
          if (nextIdx < activeExercise.phases.length) {
            setBreathPhaseIndex(nextIdx);
          } else {
            // Cycle finished
            if (currentCycle < activeExercise.cycles) {
              setCurrentCycle((c) => c + 1);
              setBreathPhaseIndex(0);
            } else {
              // Entire exercise finished!
              setIsBreathRunning(false);
              showToast(`Hoàn thành xuất sắc bài tập ${activeExercise.name} (+20 EXP)!`);
              triggerSuccessHaptic();
            }
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (breathTimerRef.current) clearInterval(breathTimerRef.current);
    };
  }, [isBreathRunning, activeExercise, breathPhaseIndex, currentCycle]);

  const handleStartBreath = (exercise: BreathExercise) => {
    triggerHaptic();
    if (activeBreathId === exercise.id && isBreathRunning) {
      setIsBreathRunning(false);
      return;
    }
    setActiveBreathId(exercise.id);
    setBreathPhaseIndex(0);
    setCurrentCycle(1);
    setBreathSecondsLeft(exercise.phases[0]?.durationSec || 4);
    setIsBreathRunning(true);
  };

  const handleAddBreathToJourney = async (exercise: BreathExercise) => {
    triggerSuccessHaptic();
    const exName = locale === "en" ? (exercise.nameEn || exercise.name) : exercise.name;
    const exSummary = locale === "en" ? (exercise.summaryEn || exercise.summary) : exercise.summary;
    const exScience = locale === "en" ? (exercise.scientificContextEn || exercise.scientificContext) : exercise.scientificContext;
    try {
      await addHabit({
        title: locale === "en" ? `Practice ${exName}` : `Thực hành ${exercise.name}`,
        category: locale === "en" ? "Mindfulness" : "Thư Giãn",
        target: "1",
        unit: locale === "en" ? "session" : "lần",
        daysPerWeek: 7,
        expValue: 20,
        description: exSummary,
        evidence: exScience,
      });
      showToast(locale === "en" ? `Added "${exName}" to Journey (+20 EXP)!` : `Đã thêm "${exercise.name}" vào Hành Trình (+20 EXP)!`);
    } catch (err) {
      showToast(locale === "en" ? `Saved ${exName} to Journey!` : `Đã lưu ${exercise.name} vào Hành Trình!`);
    }
  };

  const collectedBreaths = useMemo(() => {
    return BREATH_EXERCISES.filter((b) => savedBreathIds.includes(b.id));
  }, [savedBreathIds]);

  const filteredBreaths = useMemo(() => {
    if (breathCategory === "all") return collectedBreaths;
    return collectedBreaths.filter((b) => b.category === breathCategory);
  }, [collectedBreaths, breathCategory]);

  const handleRemoveBreath = async (id: string, name: string) => {
    triggerHaptic();
    if (activeBreathId === id) {
      setIsBreathRunning(false);
      setActiveBreathId(null);
    }
    const updated = await toolkitStorage.removeBreath(id);
    setSavedBreathIds(updated);
    showToast(locale === "en" ? `Removed "${name}" from Bag.` : `Đã bỏ "${name}" khỏi Túi Đồ.`);
  };

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

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <TopHud
        level={Math.max(1, Math.floor(xpTotal / 100) + 1)}
        expTotal={xpTotal}
        keys={currencies.keys}
        fragments={currencies.fragments}
      />

      {/* Floating Feedback Toast */}
      {toastMsg && (
        <View style={styles.toastBox}>
          <Sparkles size={16} color={colors.gold} />
          <Text style={styles.toastText}>{toastMsg}</Text>
        </View>
      )}

      {/* Main 3-Tab Selector */}
      <View style={styles.tabsBar}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === "herbs" && styles.tabBtnActive]}
          onPress={() => {
            triggerHaptic();
            setActiveTab("herbs");
          }}
          activeOpacity={0.8}
        >
          <Leaf
            size={16}
            color={activeTab === "herbs" ? colors.emeraldLight : "#94a3b8"}
          />
          <Text
            style={[
              styles.tabBtnText,
              activeTab === "herbs" && styles.tabBtnTextActive,
            ]}
          >
            {locale === "en" ? "Herbs" : "Thảo Mộc"} ({collectedHerbs.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === "sounds" && styles.tabBtnActive]}
          onPress={() => {
            triggerHaptic();
            setActiveTab("sounds");
          }}
          activeOpacity={0.8}
        >
          <Music
            size={16}
            color={activeTab === "sounds" ? "#38bdf8" : "#94a3b8"}
          />
          <Text
            style={[
              styles.tabBtnText,
              activeTab === "sounds" && styles.tabBtnTextActive,
              activeTab === "sounds" && { color: "#38bdf8" },
            ]}
          >
            {locale === "en" ? "Sounds" : "Âm Thanh"} ({collectedSounds.length})
          </Text>
          {activeSoundIds.length > 0 && (
            <View style={styles.playingBadgeDot} />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === "breath" && styles.tabBtnActive]}
          onPress={() => {
            triggerHaptic();
            setActiveTab("breath");
          }}
          activeOpacity={0.8}
        >
          <Wind
            size={16}
            color={activeTab === "breath" ? "#a78bfa" : "#94a3b8"}
          />
          <Text
            style={[
              styles.tabBtnText,
              activeTab === "breath" && styles.tabBtnTextActive,
              activeTab === "breath" && { color: "#a78bfa" },
            ]}
          >
            {locale === "en" ? "Breathing" : "Hơi Thở"} ({collectedBreaths.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshWorld}
            tintColor={colors.emerald}
          />
        }
      >
        {/* ============================================================== */}
        {/* TAB 1: THẢO MỘC (HERBAL CABINET - GUARDIAN: FLORA)            */}
        {/* ============================================================== */}
        {activeTab === "herbs" && (
          <View>
            {/* Flora Guardian Header Card */}
            <View style={styles.guardianCard}>
              <View style={styles.guardianAvatarCol}>
                <View style={[styles.avatarCircle, { borderColor: "#34d399" }]}>
                  <Text style={styles.avatarEmoji}>🌿</Text>
                </View>
                <Text style={styles.guardianRole}>
                  {locale === "en" ? "Herbalist" : "Thảo Dược Sĩ"}
                </Text>
              </View>
              <View style={styles.guardianSpeechCol}>
                <View style={styles.guardianTitleRow}>
                  <Sparkles size={14} color="#34d399" />
                  <Text style={styles.guardianName}>
                    {locale === "en" ? "Herbal Fairy · Flora" : "Tiên Nữ Thảo Mộc · Flora"}
                  </Text>
                </View>
                <Text style={styles.guardianSpeechText}>
                  {locale === "en"
                    ? "\"Welcome traveler! Here are the precious herbs you've collected from the Herbal House. Check brewing temperatures and tap '+ Journey' to build daily healthy rituals!\""
                    : "\"Chào lữ khách! Đây là những thảo mộc quý bạn đã thu thập từ Nhà Thảo Mộc. Hãy tra cứu nhiệt độ hãm trà và bấm '+ Đưa vào Hành Trình' để rèn luyện thói quen mỗi ngày nhé!\""}
                </Text>
                <View style={styles.guardianBadgeRow}>
                  <Text style={styles.guardianBadgeText}>
                    {locale === "en"
                      ? "🌱 PubMed medical grade botanicals · 100% natural"
                      : "🌱 Dược liệu chuẩn y khoa PubMed · Tự nhiên 100%"}
                  </Text>
                </View>
              </View>
            </View>

            {/* Category Filter Pills */}
            <View style={styles.filterPillsRow}>
              {[
                { id: "all", label: locale === "en" ? `All (${collectedHerbs.length})` : `Tất Cả (${collectedHerbs.length})` },
                { id: "giấc ngủ", label: locale === "en" ? "Sleep" : "Giấc Ngủ" },
                { id: "đường huyết", label: locale === "en" ? "Glucose" : "Đường Huyết" },
                { id: "dược thảo", label: locale === "en" ? "Herbs" : "Dược Thảo" },
              ].map((pill) => (
                <TouchableOpacity
                  key={pill.id}
                  style={[
                    styles.pillBtn,
                    herbCategory === pill.id && styles.pillBtnActive,
                  ]}
                  onPress={() => {
                    triggerHaptic();
                    setHerbCategory(pill.id);
                  }}
                >
                  <Text
                    style={[
                      styles.pillBtnText,
                      herbCategory === pill.id && styles.pillBtnTextActive,
                    ]}
                  >
                    {pill.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Collected Herbs List */}
            {filteredHerbs.length === 0 ? (
              <View style={styles.emptyToolkitState}>
                <View style={[styles.emptyIconCircle, { backgroundColor: "rgba(52, 211, 153, 0.15)" }]}>
                  <Leaf size={32} color="#34d399" />
                </View>
                <Text style={styles.emptyToolkitTitle}>
                  {locale === "en" ? "Herbal Bag is empty" : "Túi đồ Thảo Mộc đang trống"}
                </Text>
                <Text style={styles.emptyToolkitDesc}>
                  {locale === "en"
                    ? "You haven't saved any herbal recipes yet. Visit Fairy Flora's Herbal House in the village to discover and collect healing herbs!"
                    : "Bạn chưa lưu công thức trà nào. Hãy ghé thăm Nhà Thảo Mộc của Tiên Nữ Flora trong làng để tìm hiểu và thu thập thảo mộc vào túi đồ!"}
                </Text>
                <TouchableOpacity
                  style={[styles.emptyToolkitBtn, { backgroundColor: "#34d399" }]}
                  onPress={() => router.push("/(game)/world")}
                  activeOpacity={0.8}
                >
                  <Compass size={15} color="#061a15" />
                  <Text style={styles.emptyToolkitBtnText}>
                    {locale === "en" ? "Visit Herbal House" : "Ghé Thăm Nhà Thảo Mộc"}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              filteredHerbs.map((herb) => {
                const isExpanded = expandedHerbId === herb.id;
                const herbTitle = locale === "en" ? herb.englishName : herb.commonName;
                const herbSubTitle =
                  locale === "en"
                    ? `${herb.scientificName} · ${herb.commonName}`
                    : `${herb.scientificName} · ${herb.englishName}`;
                return (
                  <View key={herb.id} style={styles.itemCard}>
                    <View style={styles.itemHeaderRow}>
                      <View style={{ flex: 1 }}>
                        <View style={styles.itemCategoryRow}>
                          <Text style={styles.itemCategoryBadge}>
                            {herb.categoryBadge}
                          </Text>
                        </View>
                        <Text style={styles.itemTitle}>{herbTitle}</Text>
                        <Text style={styles.itemSubtitle}>{herbSubTitle}</Text>
                      </View>

                      {/* Remove from bag icon */}
                      <TouchableOpacity
                        style={styles.actionIconBtn}
                        onPress={() => handleRemoveHerb(herb.id, herbTitle)}
                        accessibilityRole="button"
                        accessibilityLabel={locale === "en" ? "Remove from bag" : "Bỏ khỏi túi"}
                      >
                        <Trash2 size={16} color="#94a3b8" />
                      </TouchableOpacity>
                    </View>

                    <Text style={styles.itemDesc}>{herb.shortDesc}</Text>

                    {/* Actions */}
                    <View style={styles.cardActionsRow}>
                      <TouchableOpacity
                        style={styles.addToJourneyBtn}
                        onPress={() => handleAddHerbToJourney(herb)}
                        activeOpacity={0.8}
                      >
                        <Plus size={15} color="#061a15" />
                        <Text style={styles.addToJourneyBtnText}>
                          {locale === "en"
                            ? "Add to Journey (+20 EXP)"
                            : "Đưa vào Hành Trình (+20 EXP)"}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.expandToggleBtn}
                        onPress={() =>
                          setExpandedHerbId(isExpanded ? null : herb.id)
                        }
                      >
                        <Text style={styles.expandToggleBtnText}>
                          {isExpanded
                            ? (locale === "en" ? "Collapse" : "Thu gọn")
                            : (locale === "en" ? "Details" : "Chi tiết")}
                        </Text>
                        {isExpanded ? (
                          <ChevronUp size={14} color="#38bdf8" />
                        ) : (
                          <ChevronDown size={14} color="#38bdf8" />
                        )}
                      </TouchableOpacity>
                    </View>

                    {/* Expanded Clinical Lore */}
                    {isExpanded && (
                      <View style={styles.expandedBlock}>
                        <Text style={styles.expandedHeading}>
                          {locale === "en"
                            ? "🍵 EVIDENCE-BASED TEA RITUAL"
                            : "🍵 NGHI THỨC HÃM TRÀ CHUẨN KHOA HỌC"}
                        </Text>
                        <Text style={styles.expandedText}>
                          {herb.teaRitual.recipeName}: {herb.teaRitual.preparationTip}
                        </Text>
                        <Text style={styles.expandedHeading}>
                          {locale === "en"
                            ? "🔬 CLINICAL EVIDENCE (PUBMED / NLM)"
                            : "🔬 BẰNG CHỨNG PUBMED / NLM"}
                        </Text>
                        <Text style={styles.expandedText}>
                          "{herb.study.title}" ({herb.study.year}) · PMID: {herb.study.pmid}
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* ============================================================== */}
        {/* TAB 2: ÂM THANH (SOUND GARDEN MIXER - GUARDIAN: LYRA)          */}
        {/* ============================================================== */}
        {activeTab === "sounds" && (
          <View>
            {/* Lyra Guardian Header Card */}
            <View style={[styles.guardianCard, { borderColor: "rgba(56, 189, 248, 0.45)" }]}>
              <View style={styles.guardianAvatarCol}>
                <View style={[styles.avatarCircle, { borderColor: "#38bdf8" }]}>
                  <Text style={styles.avatarEmoji}>🎶</Text>
                </View>
                <Text style={[styles.guardianRole, { color: "#38bdf8" }]}>
                  {locale === "en" ? "Sound Fairy" : "Tiên Thanh Âm"}
                </Text>
              </View>
              <View style={styles.guardianSpeechCol}>
                <View style={styles.guardianTitleRow}>
                  <Sparkles size={14} color="#38bdf8" />
                  <Text style={[styles.guardianName, { color: "#38bdf8" }]}>
                    {locale === "en" ? "Sound Fairy · Lyra" : "Tiên Nữ Thanh Âm · Lyra"}
                  </Text>
                </View>
                <Text style={styles.guardianSpeechText}>
                  {locale === "en"
                    ? "\"Welcome traveler! Here are the soothing sounds you've gathered from the Sound Garden. Layer multiple ambient sounds together or set a sleep timer to drift into calm!\""
                    : "\"Chào lữ khách! Đây là những bản âm thanh bạn đã thu thập từ Nhà Âm Thanh. Bạn có thể bật cùng lúc nhiều âm thanh để hòa âm thư giãn hoặc hẹn giờ ngủ mang theo nhé!\""}
                </Text>

                {/* Quick Tools Row: Timer + Mute All */}
                <View style={styles.quickToolsRow}>
                  <TouchableOpacity
                    style={styles.quickToolPill}
                    onPress={handleCycleSleepTimer}
                  >
                    <Clock size={13} color="#38bdf8" />
                    <Text style={styles.quickToolPillText}>
                      {sleepTimer
                        ? (locale === "en" ? `Timer: ${sleepTimer}m` : `Hẹn giờ: ${sleepTimer}p`)
                        : (locale === "en" ? "Timer: Infinite" : "Hẹn giờ: Vô tận")}
                    </Text>
                  </TouchableOpacity>

                  {activeSoundIds.length > 0 && (
                    <TouchableOpacity
                      style={[styles.quickToolPill, { borderColor: "#f87171" }]}
                      onPress={handleMuteAllSounds}
                    >
                      <VolumeX size={13} color="#f87171" />
                      <Text style={[styles.quickToolPillText, { color: "#f87171" }]}>
                        {locale === "en" ? "Stop All" : "Tắt tất cả"}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>

            {/* Sound Category Filter Pills */}
            <View style={styles.filterPillsRow}>
              {[
                { id: "all", label: locale === "en" ? `All (${collectedSounds.length})` : `Tất Cả (${collectedSounds.length})` },
                { id: "nature", label: locale === "en" ? "Nature" : "Thiên Nhiên" },
                { id: "frequency", label: locale === "en" ? "Brainwaves 432Hz" : "Sóng Não 432Hz" },
                { id: "hypnosis", label: locale === "en" ? "Hypnosis" : "Thôi Miên" },
              ].map((pill) => (
                <TouchableOpacity
                  key={pill.id}
                  style={[
                    styles.pillBtn,
                    soundCategory === pill.id && styles.pillBtnActive,
                  ]}
                  onPress={() => {
                    triggerHaptic();
                    setSoundCategory(pill.id);
                  }}
                >
                  <Text
                    style={[
                      styles.pillBtnText,
                      soundCategory === pill.id && styles.pillBtnTextActive,
                    ]}
                  >
                    {pill.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Sound Tracks List */}
            {filteredSounds.length === 0 ? (
              <View style={styles.emptyToolkitState}>
                <View style={[styles.emptyIconCircle, { backgroundColor: "rgba(56, 189, 248, 0.15)" }]}>
                  <Music size={32} color="#38bdf8" />
                </View>
                <Text style={styles.emptyToolkitTitle}>
                  {locale === "en" ? "Sound Bag is empty" : "Túi đồ Âm Thanh đang trống"}
                </Text>
                <Text style={styles.emptyToolkitDesc}>
                  {locale === "en"
                    ? "You haven't saved any soundscapes yet. Visit Fairy Lyra's Sound Garden in the village to preview and save tranquil nature harmonies!"
                    : "Bạn chưa nhặt âm thanh nào. Hãy ghé thăm Nhà Âm Thanh của Tiên Nữ Lyra trong làng để nghe thử và lưu các bản giao hưởng thiên nhiên mang theo!"}
                </Text>
                <TouchableOpacity
                  style={[styles.emptyToolkitBtn, { backgroundColor: "#38bdf8" }]}
                  onPress={() => router.push("/(game)/world")}
                  activeOpacity={0.8}
                >
                  <Compass size={15} color="#061a15" />
                  <Text style={styles.emptyToolkitBtnText}>
                    {locale === "en" ? "Visit Sound Garden" : "Ghé Thăm Nhà Âm Thanh"}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              filteredSounds.map((track) => {
              const isPlaying = activeSoundIds.includes(track.id);
              const volume = soundVolumes[track.id] ?? track.defaultVolume;
              const trackName = locale === "en" ? (track.nameEn || track.name) : track.name;
              const trackCategory = locale === "en" ? (track.categoryLabelEn || track.categoryLabel) : track.categoryLabel;
              const trackDesc = locale === "en" ? (track.descriptionEn || track.description) : track.description;

              return (
                <View
                  key={track.id}
                  style={[
                    styles.itemCard,
                    isPlaying && styles.itemCardSoundPlaying,
                  ]}
                >
                  <View style={styles.itemHeaderRow}>
                    <View style={styles.soundEmojiBox}>
                      <Text style={styles.soundEmoji}>{track.emoji}</Text>
                    </View>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <View style={styles.itemCategoryRow}>
                        <Text style={[styles.itemCategoryBadge, { color: "#38bdf8", borderColor: "rgba(56, 189, 248, 0.4)" }]}>
                          {trackCategory}
                        </Text>
                      </View>
                      <Text style={styles.itemTitle}>{trackName}</Text>
                      <Text style={styles.itemSubtitle}>{trackDesc}</Text>
                    </View>

                    {/* Toggle Button */}
                    <TouchableOpacity
                      style={[
                        styles.soundToggleBtn,
                        isPlaying && styles.soundToggleBtnActive,
                      ]}
                      onPress={() => handleToggleSound(track.id)}
                      activeOpacity={0.8}
                    >
                      {isPlaying ? (
                        <>
                          <Volume2 size={15} color="#061a15" />
                          <Text style={styles.soundToggleBtnTextActive}>
                            {locale === "en" ? "ON ılılı" : "BẬT ılılı"}
                          </Text>
                        </>
                      ) : (
                        <>
                          <Play size={13} color="#38bdf8" />
                          <Text style={styles.soundToggleBtnText}>
                            {locale === "en" ? "PLAY" : "BẬT"}
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>

                  {/* Volume Slider & Controls */}
                  {isPlaying && (
                    <View style={styles.volumeBarRow}>
                      <Volume2 size={14} color="#38bdf8" />
                      <Text style={styles.volumeLabel}>
                        {locale === "en" ? `Volume: ${volume}%` : `Âm lượng: ${volume}%`}
                      </Text>

                      <View style={styles.volumeStepBtns}>
                        <TouchableOpacity
                          style={styles.volStepBtn}
                          onPress={() => handleVolumeChange(track.id, -10)}
                        >
                          <Text style={styles.volStepBtnText}>-</Text>
                        </TouchableOpacity>
                        <View style={styles.volTrackLine}>
                          <View
                            style={[
                              styles.volTrackFill,
                              { width: `${volume}%` },
                            ]}
                          />
                        </View>
                        <TouchableOpacity
                          style={styles.volStepBtn}
                          onPress={() => handleVolumeChange(track.id, 10)}
                        >
                          <Text style={styles.volStepBtnText}>+</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {track.pubmedOrLore && (
                    <Text style={styles.soundLoreText}>
                      💡 {track.pubmedOrLore}
                    </Text>
                  )}

                  {/* Remove from Bag Button */}
                  <View style={styles.cardActionsRow}>
                    <TouchableOpacity
                      style={styles.removeBagItemBtn}
                      onPress={() => handleRemoveSound(track.id, trackName)}
                      activeOpacity={0.8}
                    >
                      <Trash2 size={12} color="#94a3b8" />
                      <Text style={styles.removeBagItemBtnText}>
                        {locale === "en" ? "Remove from Bag" : "Bỏ Khỏi Túi Đồ"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
          </View>
        )}

        {/* ============================================================== */}
        {/* TAB 3: HƠI THỞ (BREATHWORK & MINDFULNESS - GUARDIAN: AURA)      */}
        {/* ============================================================== */}
        {activeTab === "breath" && (
          <View>
            {/* Aura Guardian Header Card */}
            <View style={[styles.guardianCard, { borderColor: "rgba(167, 139, 250, 0.45)" }]}>
              <View style={styles.guardianAvatarCol}>
                <View style={[styles.avatarCircle, { borderColor: "#a78bfa" }]}>
                  <Text style={styles.avatarEmoji}>🧘</Text>
                </View>
                <Text style={[styles.guardianRole, { color: "#a78bfa" }]}>
                  {locale === "en" ? "Breath Fairy" : "Tiên Khí Tức"}
                </Text>
              </View>
              <View style={styles.guardianSpeechCol}>
                <View style={styles.guardianTitleRow}>
                  <Sparkles size={14} color="#a78bfa" />
                  <Text style={[styles.guardianName, { color: "#a78bfa" }]}>
                    {locale === "en" ? "Breath Fairy · Aura" : "Tiên Nữ Khí Tức · Aura"}
                  </Text>
                </View>
                <Text style={styles.guardianSpeechText}>
                  {locale === "en"
                    ? "\"Welcome traveler! Here are your collected breathing techniques. Practice anytime to steady your heart rate and reset your nervous system!\""
                    : "\"Chào lữ khách! Đây là những bài tập thở bạn đã thu thập từ Thiền Đường. Hãy cùng ta luyện thở điều hòa nhịp tim bất cứ khi nào bạn cần tĩnh tâm nhé!\""}
                </Text>
                <View style={styles.guardianBadgeRow}>
                  <Text style={[styles.guardianBadgeText, { color: "#c4b5fd" }]}>
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
                { id: "all", label: locale === "en" ? `All (${collectedBreaths.length})` : `Tất Cả (${collectedBreaths.length})` },
                { id: "sleep", label: locale === "en" ? "Deep Sleep" : "Ru Ngủ Sâu" },
                { id: "stress", label: locale === "en" ? "Stress Relief" : "Xả Stress" },
                { id: "hypnosis", label: locale === "en" ? "Hypnosis" : "Thôi Miên" },
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

            {/* Interactive Breath Widget when running */}
            {isBreathRunning && activeExercise && (
              <View style={styles.breathWidgetCard}>
                <View style={styles.breathWidgetHeader}>
                  <Text style={styles.breathWidgetTitle}>
                    {locale === "en" ? (activeExercise.nameEn || activeExercise.name) : activeExercise.name}
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
                      {
                        transform: [{ scale: breathAnim }],
                      },
                    ]}
                  >
                    <View style={styles.breathCircleInner}>
                      <Text style={styles.breathPhaseLabel}>
                        {locale === "en"
                          ? (activeExercise.phases[breathPhaseIndex]?.labelEn || activeExercise.phases[breathPhaseIndex]?.label)
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
                    ? (activeExercise.phases[breathPhaseIndex]?.instructionEn || activeExercise.phases[breathPhaseIndex]?.instruction)
                    : activeExercise.phases[breathPhaseIndex]?.instruction}
                </Text>

                <View style={styles.breathWidgetActions}>
                  <TouchableOpacity
                    style={styles.stopBreathBtn}
                    onPress={() => {
                      triggerHaptic();
                      setIsBreathRunning(false);
                    }}
                  >
                    <X size={16} color="#f87171" />
                    <Text style={styles.stopBreathBtnText}>
                      {locale === "en" ? "Stop practice" : "Dừng bài tập"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Breath Exercises List */}
            {filteredBreaths.length === 0 ? (
              <View style={styles.emptyToolkitState}>
                <View style={[styles.emptyIconCircle, { backgroundColor: "rgba(167, 139, 250, 0.15)" }]}>
                  <Wind size={32} color="#a78bfa" />
                </View>
                <Text style={styles.emptyToolkitTitle}>
                  {locale === "en" ? "Breathing Bag is empty" : "Túi đồ Hơi Thở đang trống"}
                </Text>
                <Text style={styles.emptyToolkitDesc}>
                  {locale === "en"
                    ? "You haven't saved any breathing exercises yet. Visit Fairy Aura's Zen Breath Pavilion in the village to discover and collect evidence-based breathwork!"
                    : "Bạn chưa lưu bài tập thở nào. Hãy ghé thăm Thiền Đường - Hơi Thở của Tiên Nữ Aura trong làng để khám phá và thu thập các bài thở khoa học vào túi đồ!"}
                </Text>
                <TouchableOpacity
                  style={[styles.emptyToolkitBtn, { backgroundColor: "#a78bfa" }]}
                  onPress={() => router.push("/(game)/world")}
                  activeOpacity={0.8}
                >
                  <Compass size={15} color="#061a15" />
                  <Text style={styles.emptyToolkitBtnText}>
                    {locale === "en" ? "Visit Zen Breath Pavilion" : "Ghé Thăm Thiền Đường"}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              filteredBreaths.map((exercise) => {
                const isCurrent = activeBreathId === exercise.id && isBreathRunning;
                const exName = locale === "en" ? (exercise.nameEn || exercise.name) : exercise.name;
                const exCategory = locale === "en" ? (exercise.categoryLabelEn || exercise.categoryLabel) : exercise.categoryLabel;
                const exDuration = locale === "en" ? (exercise.totalDurationMinEn || exercise.totalDurationMin) : exercise.totalDurationMin;
                const exSummary = locale === "en" ? (exercise.summaryEn || exercise.summary) : exercise.summary;
                const exScience = locale === "en" ? (exercise.scientificContextEn || exercise.scientificContext) : exercise.scientificContext;

                return (
                  <View key={exercise.id} style={styles.itemCard}>
                    <View style={styles.itemHeaderRow}>
                      <View style={styles.soundEmojiBox}>
                        <Text style={styles.soundEmoji}>{exercise.emoji}</Text>
                      </View>
                      <View style={{ flex: 1, paddingRight: 8 }}>
                        <View style={styles.itemCategoryRow}>
                          <Text style={[styles.itemCategoryBadge, { color: "#a78bfa", borderColor: "rgba(167, 139, 250, 0.4)" }]}>
                            {exCategory} · {exDuration}
                          </Text>
                        </View>
                        <Text style={styles.itemTitle}>{exName}</Text>
                        <Text style={styles.itemSubtitle}>{exSummary}</Text>
                      </View>
                    </View>

                    {/* Body scan steps if present */}
                    {exercise.bodyScanSteps && (
                      <View style={styles.bodyScanStepsBox}>
                        {exercise.bodyScanSteps.map((step, sIdx) => {
                          const sTitle = locale === "en" ? (step.titleEn || step.title) : step.title;
                          const sDesc = locale === "en" ? (step.descEn || step.desc) : step.desc;
                          return (
                            <View key={sIdx} style={styles.bodyScanStepRow}>
                              <Text style={styles.bodyScanStepTitle}>
                                • {sTitle}:
                              </Text>
                              <Text style={styles.bodyScanStepDesc}>
                                {sDesc}
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                    )}

                    {/* Actions */}
                    <View style={styles.cardActionsRow}>
                      <TouchableOpacity
                        style={[
                          styles.startBreathBtn,
                          isCurrent && styles.startBreathBtnActive,
                        ]}
                        onPress={() => handleStartBreath(exercise)}
                        activeOpacity={0.8}
                      >
                        {isCurrent ? (
                          <>
                            <Pause size={15} color="#061a15" />
                            <Text style={styles.startBreathBtnText}>
                              {locale === "en" ? "BREATHING WITH AURA..." : "ĐANG THỞ CÙNG AURA..."}
                            </Text>
                          </>
                        ) : (
                          <>
                            <Play size={15} color="#061a15" />
                            <Text style={styles.startBreathBtnText}>
                              {locale === "en" ? "START BREATHWORK" : "BẮT ĐẦU TẬP THỞ"}
                            </Text>
                          </>
                        )}
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.addBreathJourneyBtn}
                        onPress={() => handleAddBreathToJourney(exercise)}
                      >
                        <Plus size={14} color="#a78bfa" />
                        <Text style={styles.addBreathJourneyBtnText}>
                          {locale === "en" ? "Journey" : "Hành Trình"}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.removeBagItemBtn}
                        onPress={() => handleRemoveBreath(exercise.id, exName)}
                        activeOpacity={0.8}
                      >
                        <Trash2 size={12} color="#94a3b8" />
                        <Text style={styles.removeBagItemBtnText}>
                          {locale === "en" ? "Remove from Bag" : "Bỏ Khỏi Túi"}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <Text style={styles.soundLoreText}>
                      🔬 {exScience}
                    </Text>
                  </View>
                );
              })
            )}
          </View>
        )}
      </ScrollView>

      {/* Floating Bottom Master Playback Bar (Fixed Docked above Tab Bar) */}
      {activeSoundIds.length > 0 && (
        <View style={styles.masterPlaybackBar}>
          <View style={styles.masterPlaybackLeft}>
            <Sparkles size={16} color="#38bdf8" />
            <Text style={styles.masterPlaybackText}>
              {locale === "en"
                ? `Playing ${activeSoundIds.length} ambient sound${activeSoundIds.length > 1 ? "s" : ""} 🎵`
                : `Đang phát ${activeSoundIds.length} âm thanh song song 🎵`}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.masterPauseBtn}
            onPress={handleMuteAllSounds}
          >
            <Pause size={14} color="#061a15" />
            <Text style={styles.masterPauseBtnText}>
              {locale === "en" ? "Mute" : "Tắt"}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#030c0a",
  },
  content: {
    padding: 14,
    paddingBottom: 150,
  },
  toastBox: {
    position: "absolute",
    top: 60,
    left: 16,
    right: 16,
    zIndex: 999,
    backgroundColor: "rgba(6, 26, 21, 0.95)",
    borderWidth: 1.5,
    borderColor: colors.gold,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  toastText: {
    flex: 1,
    fontFamily: fonts.uiMedium,
    fontSize: 13,
    color: "#fef08a",
    fontWeight: "700",
  },
  tabsBar: {
    flexDirection: "row",
    backgroundColor: "rgba(6, 26, 21, 0.85)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(52, 211, 153, 0.2)",
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
  },
  tabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: "transparent",
  },
  tabBtnActive: {
    backgroundColor: "rgba(52, 211, 153, 0.15)",
    borderColor: "rgba(52, 211, 153, 0.4)",
  },
  tabBtnText: {
    fontFamily: fonts.uiSemiBold,
    fontSize: 12,
    color: "#94a3b8",
    fontWeight: "600",
  },
  tabBtnTextActive: {
    color: colors.emeraldLight,
    fontWeight: "800",
  },
  playingBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#38bdf8",
  },
  guardianCard: {
    flexDirection: "row",
    backgroundColor: "#061a15",
    borderWidth: 1.5,
    borderColor: "rgba(52, 211, 153, 0.35)",
    borderRadius: 16,
    padding: 12,
    marginBottom: 14,
    gap: 12,
  },
  guardianAvatarCol: {
    alignItems: "center",
    width: 68,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarEmoji: {
    fontSize: 26,
  },
  guardianRole: {
    fontFamily: fonts.uiBold,
    fontSize: 10,
    color: "#34d399",
    marginTop: 4,
    textAlign: "center",
    fontWeight: "700",
  },
  guardianSpeechCol: {
    flex: 1,
  },
  guardianTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  guardianName: {
    fontFamily: fonts.uiBold,
    fontSize: 13,
    color: "#34d399",
    fontWeight: "800",
  },
  guardianSpeechText: {
    fontFamily: fonts.ui,
    fontSize: 12,
    color: "#e2e8f0",
    lineHeight: 18,
    marginBottom: 6,
  },
  guardianBadgeRow: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  guardianBadgeText: {
    fontFamily: fonts.uiMedium,
    fontSize: 10.5,
    color: "#a7f3d0",
  },
  quickToolsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  quickToolPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(56, 189, 248, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.35)",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
  },
  quickToolPillText: {
    fontFamily: fonts.uiSemiBold,
    fontSize: 11,
    color: "#38bdf8",
    fontWeight: "700",
  },
  filterPillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 14,
  },
  pillBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  pillBtnActive: {
    backgroundColor: "rgba(52, 211, 153, 0.18)",
    borderColor: colors.emeraldLight,
  },
  pillBtnText: {
    fontFamily: fonts.uiMedium,
    fontSize: 11.5,
    color: "#94a3b8",
  },
  pillBtnTextActive: {
    color: colors.emeraldLight,
    fontWeight: "800",
  },
  itemCard: {
    backgroundColor: "#071e19",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  itemCardSoundPlaying: {
    borderColor: "rgba(56, 189, 248, 0.5)",
    backgroundColor: "#082520",
  },
  itemHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 6,
  },
  itemCategoryRow: {
    marginBottom: 3,
  },
  itemCategoryBadge: {
    fontFamily: fonts.uiBold,
    fontSize: 10,
    color: "#34d399",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    alignSelf: "flex-start",
    backgroundColor: "rgba(52, 211, 153, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(52, 211, 153, 0.3)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  itemTitle: {
    fontFamily: fonts.uiBold,
    fontSize: 14.5,
    color: "#f8fafc",
    fontWeight: "800",
  },
  itemSubtitle: {
    fontFamily: fonts.uiMedium,
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 2,
  },
  itemDesc: {
    fontFamily: fonts.ui,
    fontSize: 12,
    color: "#cbd5e1",
    lineHeight: 18,
    marginVertical: 6,
  },
  actionIconBtn: {
    padding: 6,
  },
  teaSpecRow: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "rgba(0, 0, 0, 0.25)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginVertical: 6,
  },
  teaSpecItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  teaSpecText: {
    fontFamily: fonts.uiMedium,
    fontSize: 11,
    color: "#e2e8f0",
  },
  cardActionsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
    alignItems: "center",
  },
  addToJourneyBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: colors.gold,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  addToJourneyBtnText: {
    fontFamily: fonts.uiBold,
    fontSize: 11.5,
    color: "#061a15",
    fontWeight: "800",
  },
  expandToggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "rgba(56, 189, 248, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.25)",
  },
  expandToggleBtnText: {
    fontFamily: fonts.uiSemiBold,
    fontSize: 11,
    color: "#38bdf8",
  },
  expandedBlock: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
  },
  expandedHeading: {
    fontFamily: fonts.uiBold,
    fontSize: 10.5,
    color: colors.gold,
    marginTop: 6,
    marginBottom: 2,
    fontWeight: "800",
  },
  expandedText: {
    fontFamily: fonts.ui,
    fontSize: 11.5,
    color: "#cbd5e1",
    lineHeight: 17,
  },
  soundEmojiBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  soundEmoji: {
    fontSize: 18,
  },
  soundToggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(56, 189, 248, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.35)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  soundToggleBtnActive: {
    backgroundColor: "#38bdf8",
    borderColor: "#38bdf8",
  },
  soundToggleBtnText: {
    fontFamily: fonts.uiBold,
    fontSize: 11,
    color: "#38bdf8",
    fontWeight: "800",
  },
  soundToggleBtnTextActive: {
    fontFamily: fonts.uiBold,
    fontSize: 11,
    color: "#061a15",
    fontWeight: "900",
  },
  volumeBarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.06)",
  },
  volumeLabel: {
    fontFamily: fonts.uiMedium,
    fontSize: 11,
    color: "#38bdf8",
    width: 100,
  },
  volumeStepBtns: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  volStepBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(56, 189, 248, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  volStepBtnText: {
    fontSize: 15,
    color: "#38bdf8",
    fontWeight: "800",
    lineHeight: 18,
  },
  volTrackLine: {
    flex: 1,
    height: 5,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 3,
    overflow: "hidden",
  },
  volTrackFill: {
    height: "100%",
    backgroundColor: "#38bdf8",
  },
  soundLoreText: {
    fontFamily: fonts.ui,
    fontSize: 10.5,
    color: "#94a3b8",
    fontStyle: "italic",
    marginTop: 6,
  },
  masterPlaybackBar: {
    position: "absolute",
    bottom: 68,
    left: 74,
    right: 14,
    backgroundColor: "rgba(6, 26, 21, 0.96)",
    borderWidth: 1.5,
    borderColor: "#38bdf8",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 20,
    zIndex: 999,
  },
  masterPlaybackLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  masterPlaybackText: {
    fontFamily: fonts.uiBold,
    fontSize: 12,
    color: "#e0f2fe",
    fontWeight: "700",
  },
  masterPauseBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#38bdf8",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  masterPauseBtnText: {
    fontFamily: fonts.uiBold,
    fontSize: 11,
    color: "#061a15",
    fontWeight: "800",
  },
  breathWidgetCard: {
    backgroundColor: "#091f24",
    borderWidth: 1.5,
    borderColor: "#a78bfa",
    borderRadius: 18,
    padding: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  breathWidgetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 12,
  },
  breathWidgetTitle: {
    fontFamily: fonts.uiBold,
    fontSize: 13.5,
    color: "#e9d5ff",
    fontWeight: "800",
  },
  breathWidgetCycle: {
    fontFamily: fonts.uiSemiBold,
    fontSize: 12,
    color: "#a78bfa",
  },
  breathCircleContainer: {
    width: 150,
    height: 150,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 10,
  },
  breathCircleOuter: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 3,
    borderColor: "#a78bfa",
    backgroundColor: "rgba(167, 139, 250, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  breathCircleInner: {
    alignItems: "center",
  },
  breathPhaseLabel: {
    fontFamily: fonts.uiBold,
    fontSize: 14,
    color: "#f5f3ff",
    fontWeight: "900",
    letterSpacing: 1,
  },
  breathSecondsText: {
    fontFamily: fonts.uiExtraBold,
    fontSize: 22,
    color: "#a78bfa",
    fontWeight: "900",
    marginTop: 2,
  },
  breathInstructionText: {
    fontFamily: fonts.ui,
    fontSize: 12.5,
    color: "#f3e8ff",
    textAlign: "center",
    lineHeight: 18,
    marginVertical: 8,
    paddingHorizontal: 10,
  },
  breathWidgetActions: {
    marginTop: 8,
  },
  stopBreathBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(248, 113, 113, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(248, 113, 113, 0.35)",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  stopBreathBtnText: {
    fontFamily: fonts.uiSemiBold,
    fontSize: 11.5,
    color: "#f87171",
    fontWeight: "700",
  },
  startBreathBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#a78bfa",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  startBreathBtnActive: {
    backgroundColor: "#c4b5fd",
  },
  startBreathBtnText: {
    fontFamily: fonts.uiBold,
    fontSize: 11.5,
    color: "#061a15",
    fontWeight: "800",
  },
  addBreathJourneyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "rgba(167, 139, 250, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(167, 139, 250, 0.3)",
  },
  addBreathJourneyBtnText: {
    fontFamily: fonts.uiSemiBold,
    fontSize: 11,
    color: "#a78bfa",
    fontWeight: "700",
  },
  bodyScanStepsBox: {
    backgroundColor: "rgba(0, 0, 0, 0.25)",
    borderRadius: 8,
    padding: 8,
    marginVertical: 6,
  },
  bodyScanStepRow: {
    marginBottom: 4,
  },
  bodyScanStepTitle: {
    fontFamily: fonts.uiBold,
    fontSize: 11,
    color: "#e9d5ff",
  },
  bodyScanStepDesc: {
    fontFamily: fonts.ui,
    fontSize: 10.5,
    color: "#cbd5e1",
    lineHeight: 15,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
    gap: 8,
  },
  emptyStateTitle: {
    fontFamily: fonts.uiBold,
    fontSize: 14,
    color: "#94a3b8",
  },
  emptyStateSub: {
    fontFamily: fonts.ui,
    fontSize: 12,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 18,
  },
  emptyToolkitState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 36,
    paddingHorizontal: 24,
    backgroundColor: "rgba(10, 32, 26, 0.45)",
    borderRadius: radius.lg,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(255, 255, 255, 0.12)",
    marginVertical: 12,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  emptyToolkitTitle: {
    fontFamily: fonts.uiBold,
    fontSize: 15,
    color: "#f8fafc",
    marginBottom: 6,
    textAlign: "center",
  },
  emptyToolkitDesc: {
    fontFamily: fonts.ui,
    fontSize: 12,
    color: "#94a3b8",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 16,
  },
  emptyToolkitBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.md,
  },
  emptyToolkitBtnText: {
    fontFamily: fonts.uiBold,
    fontSize: 12.5,
    color: "#061a15",
    fontWeight: "800",
  },
  removeBagItemBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.md,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.25)",
  },
  removeBagItemBtnText: {
    fontFamily: fonts.uiSemiBold,
    fontSize: 11,
    color: "#fca5a5",
    fontWeight: "700",
  },
});
