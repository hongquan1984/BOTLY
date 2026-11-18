import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Animated,
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
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  ExternalLink,
  Flame,
  FlaskConical,
  Heart,
  Info,
  Leaf,
  ShieldAlert,
  Sparkles,
  Thermometer,
  X,
  Plus,
} from "lucide-react-native";
import {
  HERBAL_CATALOG,
  getRecommendedHerbsForProfile,
  getLocalizedHerb,
  type HerbalArticle,
} from "./herbalData";
import { useLocale } from "@/localization";

interface HerbalGardenModalProps {
  visible: boolean;
  onClose: () => void;
  onAwardExp?: (amount: number, reason: string) => void;
}

const STARTER_PROFILE_KEY = "healthclues-starter-profile";
const BOOKMARKS_STORAGE_KEY = "hc_mobile_botanical_bookmarks";
const TEA_BREWED_KEY = "hc_mobile_tea_brewed_date";

export function HerbalGardenModal({
  visible,
  onClose,
  onAwardExp,
}: HerbalGardenModalProps) {
  const { locale } = useLocale();
  const [profile, setProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"for_you" | "all" | "saved">("for_you");
  const [expandedHerbId, setExpandedHerbId] = useState<string | null>(null);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [brewedToday, setBrewedToday] = useState(false);
  const [brewingHerb, setBrewingHerb] = useState<HerbalArticle | null>(null);
  const [brewSuccessMsg, setBrewSuccessMsg] = useState<string | null>(null);

  // Load user profile & storage states on open
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
        }

        const rawBookmarks = await AsyncStorage.getItem(BOOKMARKS_STORAGE_KEY);
        if (rawBookmarks && isMounted) {
          try {
            const parsed = JSON.parse(rawBookmarks);
            if (Array.isArray(parsed)) setBookmarkedIds(parsed);
          } catch {}
        }

        const todayStr = new Date().toISOString().slice(0, 10);
        const lastBrewDate = await AsyncStorage.getItem(TEA_BREWED_KEY);
        if (lastBrewDate === todayStr && isMounted) {
          setBrewedToday(true);
        } else {
          setBrewedToday(false);
        }
      } catch (err) {
        console.warn("Failed to load herbal profile:", err);
      }
    };

    loadState();
    return () => {
      isMounted = false;
    };
  }, [visible]);

  // Recommended herbs sorted by quiz profile
  const recommendedHerbs = useMemo(() => {
    const quest = profile?.quest || profile?.profile?.primaryConcernId || "sleep";
    const topic = profile?.profile?.topic || profile?.topic || profile?.profile?.concernNote || "";
    return getRecommendedHerbsForProfile(quest, topic);
  }, [profile]);

  // Herbs to display based on tab
  const displayedHerbs = useMemo(() => {
    let list: HerbalArticle[] = [];
    if (activeTab === "for_you") {
      // Return top recommended herbs for user's profile
      const quest = profile?.quest || profile?.profile?.primaryConcernId || profile?.profile?.adaptiveDiscovery?.focusId || "sleep";
      const topic = profile?.profile?.topic || profile?.topic || profile?.profile?.adaptiveDiscovery?.focusLabel || profile?.profile?.concernNote || "";
      const rec = getRecommendedHerbsForProfile(quest, topic, locale);
      list = rec.slice(0, 4); // Top 4 priority matches for rich choice
    } else if (activeTab === "saved") {
      list = HERBAL_CATALOG.filter((h) => bookmarkedIds.includes(h.id));
    } else {
      list = HERBAL_CATALOG;
    }
    return list.map((h) => getLocalizedHerb(h, locale));
  }, [activeTab, recommendedHerbs, bookmarkedIds, profile, locale]);

  const toggleBookmark = async (id: string) => {
    try {
      let updated: string[];
      if (bookmarkedIds.includes(id)) {
        updated = bookmarkedIds.filter((item) => item !== id);
      } else {
        updated = [...bookmarkedIds, id];
      }
      setBookmarkedIds(updated);
      await AsyncStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(updated));
      DeviceEventEmitter.emit("HEALTHCLUES_TOOLKIT_CHANGED", { type: "herbs", ids: updated });
    } catch (err) {
      console.warn("Failed to toggle bookmark:", err);
    }
  };

  const handleAddToJourney = async (herb: HerbalArticle) => {
    try {
      // 1. Add to bookmarks/inventory if not yet there
      if (!bookmarkedIds.includes(herb.id)) {
        const updated = [...bookmarkedIds, herb.id];
        setBookmarkedIds(updated);
        await AsyncStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(updated));
      }

      // 2. Add goal to healthclues-user-goals
      const rawGoals = await AsyncStorage.getItem("healthclues-user-goals");
      let goals: any[] = [];
      if (rawGoals) {
        try {
          goals = JSON.parse(rawGoals);
        } catch {}
      }
      const newHabit = {
        id: `habit-herb-${herb.id}-${Date.now()}`,
        title: `Uống 1 tách ${herb.commonName}`,
        category: "Dinh Dưỡng",
        status: "active",
        target: "1",
        unit: "tách",
        daysPerWeek: 7,
        expValue: 20,
        description: `Dược thảo tự nhiên: ${herb.shortDesc}`,
        evidence: `PubMed PMID: ${herb.study.pmid}`,
      };
      goals.push(newHabit);
      await AsyncStorage.setItem("healthclues-user-goals", JSON.stringify(goals));

      // 3. Award EXP
      const expGain = 20;
      const herbLabel = locale === "en" ? herb.englishName : herb.commonName;
      if (onAwardExp) {
        onAwardExp(
          expGain,
          locale === "en"
            ? `Added tea habit: ${herbLabel}`
            : `Thêm thói quen uống trà ${herb.commonName}`
        );
      } else {
        DeviceEventEmitter.emit("AWARD_EXP", {
          amount: expGain,
          reason:
            locale === "en"
              ? `Added tea habit: ${herbLabel}`
              : `Thêm thói quen uống trà ${herb.commonName}`,
        });
      }

      DeviceEventEmitter.emit("healthclues-world-state-changed");

      setBrewSuccessMsg(
        locale === "en"
          ? `Added "${herbLabel} Tea" to Journey (+20 EXP)!`
          : `Đã đưa "Uống trà ${herb.commonName}" vào Hành Trình rèn luyện (+20 EXP)!`
      );
      setTimeout(() => {
        setBrewSuccessMsg(null);
      }, 4000);
    } catch (err) {
      console.warn("Failed to add herb habit:", err);
    }
  };

  const userConcernName =
    profile?.profile?.adaptiveDiscovery?.focusLabel ||
    profile?.profile?.topic ||
    profile?.topic ||
    profile?.profile?.concernNote ||
    (profile?.quest === "sleep" ? (locale === "en" ? "Sleep & Insomnia" : "Mất ngủ & Khó ngủ") : (locale === "en" ? "Holistic Wellness" : "Sức khỏe toàn diện"));

  const userGoalText =
    profile?.profile?.twoWeekGoal ||
    profile?.twoWeekGoal ||
    profile?.profile?.topic ||
    profile?.topic ||
    profile?.profile?.concernNote ||
    (locale === "en" ? "Build natural restorative daily habits" : "Xây dựng thói quen phục hồi tự nhiên, an lành");

  const floraSpeech = useMemo(() => {
    const raw = `${userConcernName} ${userGoalText} ${profile?.quest || ""}`.toLowerCase();
    const isEn = locale === "en";

    if (/tiểu đường|đường huyết|glucose|insulin|glycemic|đái tháo đường/.test(raw)) {
      return {
        greeting: isEn
          ? "Greetings traveler! I am Flora, the Herbal Fairy guarding this ancient botanical garden."
          : "Chào bạn lữ khách! Ta là Nàng Tiên Thảo Mộc Flora canh giữ vườn dược liệu cổ kính.",
        advice: isEn
          ? "I sense your focus on glycemic balance and metabolic health. I have specially prepared Gymnema and Bitter Melon — botanicals clinically demonstrated on PubMed to slow intestinal glucose absorption and support natural cellular energy."
          : "Ta cảm nhận bạn đang quan tâm đến chỉ số đường huyết và chuyển hóa. Ta đã đặc biệt chuẩn bị Dây Thìa Canh và Mướp Đắng Rừng — hai thảo mộc quý có nghiên cứu PubMed chứng minh giúp làm chậm hấp thu đường ruột và kích hoạt tế bào sử dụng năng lượng tự nhiên.",
        herbTags: isEn ? ["Gymnema", "Bitter Melon", "Ceylon Cinnamon"] : ["Dây Thìa Canh", "Mướp Đắng Rừng", "Quế Ceylon"],
        cta: isEn
          ? "You can save knowledge into your Backpack or tap '+ Journey' to build daily healthy rituals with me!"
          : "Bạn có thể Lưu kiến thức vào Túi đồ hoặc Dùng thử / Hãm trà nóng nhận +15 EXP cùng ta nhé!",
      };
    }
    if (/ngủ|mất ngủ|khó ngủ|sleep|insomnia/.test(raw)) {
      return {
        greeting: isEn
          ? "Greetings traveler! I am Flora, the Herbal Fairy guarding this ancient botanical garden."
          : "Chào bạn lữ khách! Ta là Nàng Tiên Thảo Mộc Flora canh giữ vườn dược liệu cổ kính.",
        advice: isEn
          ? "Peaceful sleep is the foundation of cellular renewal. I have prepared Chamomile and Passionflower to soothe GABA neurotransmitters and dissolve nighttime restlessness."
          : "Giấc ngủ an lành là cội nguồn của sự phục hồi tế bào. Ta đã chuẩn bị Cúc La Mã và Lạc Tiên Tây ngát hương hoa giúp làm êm dịu dẫn truyền thần kinh GABA, xua tan những băn khoăn trằn trọc ban đêm.",
        herbTags: isEn ? ["German Chamomile", "Passionflower", "Lotus Plumule"] : ["Cúc La Mã", "Lạc Tiên Tây", "Tâm Sen"],
        cta: isEn
          ? "You can save knowledge into your Backpack or tap '+ Journey' to build daily healthy rituals with me!"
          : "Bạn có thể Lưu kiến thức vào Túi đồ hoặc Dùng thử / Hãm trà nóng nhận +15 EXP cùng ta nhé!",
      };
    }
    if (/gút|gout|axit uric|uric|khớp/.test(raw)) {
      return {
        greeting: isEn
          ? "Greetings traveler! I am Flora, the Herbal Fairy guarding this ancient botanical garden."
          : "Chào bạn lữ khách! Ta là Nàng Tiên Thảo Mộc Flora canh giữ vườn dược liệu cổ kính.",
        advice: isEn
          ? "To ease the burden on joint tissues and uric acid, I suggest Rosmarinic-rich Perilla leaf and cooling Hibiscus to support natural kidney clearance."
          : "Để làm nhẹ gánh nặng mô khớp và acid uric, ta gợi ý lá Tía Tô giàu Axit Rosmarinic và Bụp Giấm thanh mát giúp thận tăng cường đào thải cặn bã tự nhiên.",
        herbTags: isEn ? ["Fresh Perilla", "Hibiscus Flower"] : ["Tía Tô Tươi", "Bụp Giấm (Atiso Đỏ)"],
        cta: isEn
          ? "You can save knowledge into your Backpack or tap '+ Journey' to build daily healthy rituals with me!"
          : "Bạn có thể Lưu kiến thức vào Túi đồ hoặc Dùng thử / Hãm trà nóng nhận +15 EXP cùng ta nhé!",
      };
    }
    if (/tiêu hóa|dạ dày|stomach|gut|đầy hơi/.test(raw)) {
      return {
        greeting: isEn
          ? "Greetings traveler! I am Flora, the Herbal Fairy guarding this ancient botanical garden."
          : "Chào bạn lữ khách! Ta là Nàng Tiên Thảo Mộc Flora canh giữ vườn dược liệu cổ kính.",
        advice: isEn
          ? "A calm stomach is the beginning of a joyful day. Warm Ginger and crisp Peppermint will relieve bloating and gently protect your digestive lining."
          : "Một chiếc bụng êm dịu là khởi đầu của ngày vui. Gừng Tươi ấm tỳ vị và Bạc Hà the mát sẽ giúp giải tỏa đầy trướng và bảo vệ niêm mạc ruột êm ái.",
        herbTags: isEn ? ["Fresh Ginger", "Peppermint"] : ["Gừng Tươi", "Bạc Hà Âu"],
        cta: isEn
          ? "You can save knowledge into your Backpack or tap '+ Journey' to build daily healthy rituals with me!"
          : "Bạn có thể Lưu kiến thức vào Túi đồ hoặc Dùng thử / Hãm trà nóng nhận +15 EXP cùng ta nhé!",
      };
    }
    return {
      greeting: isEn
        ? "Greetings traveler! I am Flora, the Herbal Fairy guarding this ancient botanical garden."
        : "Chào bạn lữ khách! Ta là Nàng Tiên Thảo Mộc Flora canh giữ vườn dược liệu cổ kính.",
      advice: isEn
        ? `Welcome! Based on your wellness goal, I have gathered the finest natural herbs rich in bioactive compounds to accompany you each day.`
        : `Chào mừng bạn ghé thăm! Dựa trên mục tiêu "${userConcernName}", ta đã chuẩn bị những thảo mộc tự nhiên giàu hoạt chất sinh học tốt nhất để đồng hành cùng bạn mỗi ngày.`,
      herbTags: isEn ? ["German Chamomile", "Green Tea EGCG", "Perilla"] : ["Cúc La Mã", "Trà Xanh EGCG", "Tía Tô"],
      cta: isEn
        ? "You can save knowledge into your Backpack or tap '+ Journey' to build daily healthy rituals with me!"
        : "Bạn có thể Lưu kiến thức vào Túi đồ hoặc Dùng thử / Hãm trà nóng nhận +15 EXP cùng ta nhé!",
    };
  }, [userConcernName, userGoalText, profile, locale]);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerTitleWrap}>
              <View style={styles.headerIconRing}>
                <Leaf size={18} color="#34d399" />
              </View>
              <View>
                <Text style={styles.headerTitle}>
                  {locale === "en" ? "Herbal House" : "Nhà Thảo Mộc"}
                </Text>
                <Text style={styles.headerSub}>
                  {locale === "en"
                    ? "Evidence-Based Botanical & Herbal Knowledge"
                    : "Dược Liệu & Hoa Cỏ Khoa Học · Chuẩn Y Học Chứng Cứ"}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel={locale === "en" ? "Close Herbal House" : "Đóng Nhà Thảo Mộc"}
            >
              <X size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {/* Navigation Tabs (Top-Pinned directly under Header) */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === "for_you" && styles.tabButtonActive]}
              onPress={() => setActiveTab("for_you")}
              accessibilityRole="tab"
              accessibilityLabel={locale === "en" ? "For you" : "Dành cho bạn"}
            >
              <Text
                style={[
                  styles.tabButtonText,
                  activeTab === "for_you" && styles.tabButtonTextActive,
                ]}
              >
                {locale === "en"
                  ? `For You (${Math.min(recommendedHerbs.length, 4)})`
                  : `Dành Cho Bạn (${Math.min(recommendedHerbs.length, 4)})`}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabButton, activeTab === "all" && styles.tabButtonActive]}
              onPress={() => setActiveTab("all")}
              accessibilityRole="tab"
              accessibilityLabel={locale === "en" ? "All herbs" : "Tất cả thảo mộc"}
            >
              <Text
                style={[
                  styles.tabButtonText,
                  activeTab === "all" && styles.tabButtonTextActive,
                ]}
              >
                {locale === "en"
                  ? `All Herbs (${HERBAL_CATALOG.length})`
                  : `Tất Cả (${HERBAL_CATALOG.length})`}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabButton, activeTab === "saved" && styles.tabButtonActive]}
              onPress={() => setActiveTab("saved")}
              accessibilityRole="tab"
              accessibilityLabel={locale === "en" ? "Saved herbs" : "Thảo mộc đã lưu"}
            >
              <Text
                style={[
                  styles.tabButtonText,
                  activeTab === "saved" && styles.tabButtonTextActive,
                ]}
              >
                {locale === "en"
                  ? `Saved (${bookmarkedIds.length})`
                  : `Đã Lưu (${bookmarkedIds.length})`}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Feedback Toast */}
          {brewSuccessMsg && (
            <View style={styles.toastSuccess}>
              <Sparkles size={16} color="#ffffff" />
              <Text style={styles.toastSuccessText}>{brewSuccessMsg}</Text>
            </View>
          )}

          {/* Herb List & Scrollable Content */}
          <ScrollView
            style={styles.herbScrollView}
            contentContainerStyle={styles.herbListContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Flora Greeting Card & Tea Ritual only in 'Dành Cho Bạn' tab */}
            {activeTab === "for_you" && (
              <>
                {/* Nàng Tiên Thảo Mộc Flora Greeting Card */}
                <View style={styles.floraCard}>
                  <View style={styles.floraHeaderRow}>
                    <View style={styles.floraAvatarRing}>
                      <Text style={{ fontSize: 24 }}>🧚‍♀️</Text>
                    </View>
                    <View style={{ flex: 1, paddingRight: 6 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <Text style={styles.floraName}>
                          {locale === "en" ? "Herbal Fairy Flora" : "Nàng Tiên Thảo Mộc Flora"}
                        </Text>
                        <Sparkles size={14} color="#f59e0b" />
                      </View>
                      <Text style={styles.floraRole}>
                        {locale === "en"
                          ? "Guardian of Ancient Botanicals · PubMed Standard"
                          : "Người Canh Giữ Vườn Dược Liệu Cổ Sinh · Chuẩn PubMed"}
                      </Text>
                    </View>
                    <View style={styles.concernPill}>
                      <Text style={styles.concernPillText}>{userConcernName}</Text>
                    </View>
                  </View>

                  <View style={styles.floraBubble}>
                    <Text style={styles.floraGreetingText}>{floraSpeech.greeting}</Text>
                    <Text style={styles.floraAdviceText}>{floraSpeech.advice}</Text>
                    <View style={styles.floraTagsRow}>
                      <Text style={styles.floraTagsLabel}>
                        {locale === "en" ? "Core botanicals:" : "Thảo mộc cốt lõi:"}
                      </Text>
                      {floraSpeech.herbTags.map((tag, idx) => (
                        <View key={idx} style={styles.floraTagBadge}>
                          <Leaf size={10} color="#34d399" />
                          <Text style={styles.floraTagBadgeText}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                    <Text style={styles.floraCtaText}>{floraSpeech.cta}</Text>
                  </View>
                </View>

                {/* Toolkit & Habit Guidance Bar */}
                <View style={styles.teaRitualBar}>
                  <View style={styles.teaRitualLeft}>
                    <Sparkles size={16} color="#34d399" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.teaRitualTitle}>
                        {locale === "en"
                          ? "Herbal Garden & Healing Backpack"
                          : "Vườn Thảo Mộc & Balo Trị Liệu"}
                      </Text>
                      <Text style={styles.teaRitualDesc}>
                        {locale === "en"
                          ? "Tap 'In Backpack' to store or '+ Add to Journey' to build daily healthy tea rituals (+20 EXP)."
                          : "Bấm 'Cất vào Túi' để lưu trữ hoặc '+ Đưa vào Hành Trình' để rèn luyện thói quen uống trà hằng ngày (+20 EXP)."}
                      </Text>
                    </View>
                  </View>
                </View>
              </>
            )}
            {displayedHerbs.length === 0 ? (
              <View style={styles.emptyState}>
                <Bookmark size={32} color="#475569" />
                <Text style={styles.emptyStateTitle}>
                  {locale === "en" ? "No saved herbs yet" : "Chưa có thảo mộc nào được lưu"}
                </Text>
                <Text style={styles.emptyStateSub}>
                  {locale === "en"
                    ? "Tap the bookmark icon on any herb card to save it for quick reference."
                    : "Hãy bấm biểu tượng dấu trang ở góc mỗi bài viết thảo mộc để lưu lại xem lại sau."}
                </Text>
              </View>
            ) : (
              displayedHerbs.map((herb) => {
                const isExpanded = expandedHerbId === herb.id;
                const isBookmarked = bookmarkedIds.includes(herb.id);
                const herbTitle = locale === "en" ? herb.englishName : herb.commonName;
                const herbSubTitle =
                  locale === "en"
                    ? `${herb.scientificName} · ${herb.commonName}`
                    : `${herb.scientificName} · ${herb.englishName}`;

                return (
                  <View key={herb.id} style={styles.herbCard}>
                    {/* Herb Card Top Summary */}
                    <View style={styles.cardHeaderRow}>
                      <View style={{ flex: 1, paddingRight: 8 }}>
                        <View style={styles.badgeRow}>
                          <Text style={styles.categoryBadge}>{herb.categoryBadge}</Text>
                        </View>
                        <Text style={styles.herbCommonName}>{herbTitle}</Text>
                        <Text style={styles.herbScientificName}>
                          {herbSubTitle}
                        </Text>
                      </View>

                      <View style={styles.cardHeaderActions}>
                        <TouchableOpacity
                          style={styles.iconBtn}
                          onPress={() => toggleBookmark(herb.id)}
                          accessibilityRole="button"
                          accessibilityLabel={
                            isBookmarked ? "Bỏ lưu thảo mộc" : "Lưu thảo mộc vào sổ tay"
                          }
                        >
                          {isBookmarked ? (
                            <BookmarkCheck size={20} color="#34d399" />
                          ) : (
                            <Bookmark size={20} color="#94a3b8" />
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Short Description */}
                    <Text style={styles.herbShortDesc}>{herb.shortDesc}</Text>

                    {/* Key Highlights */}
                    <View style={styles.highlightsContainer}>
                      {herb.keyHighlights.map((hl, idx) => (
                        <View key={idx} style={styles.highlightItem}>
                          <View style={styles.highlightBullet} />
                          <Text style={styles.highlightText}>{hl}</Text>
                        </View>
                      ))}
                    </View>

                    {/* Interactive Action Bar: Bookmark, Brew Tea & Read More */}
                    <View style={styles.cardActionBar}>
                      <TouchableOpacity
                        style={[
                          styles.actionBtnSecondary,
                          isBookmarked && styles.actionBtnSecondaryActive,
                        ]}
                        onPress={() => toggleBookmark(herb.id)}
                        activeOpacity={0.8}
                        accessibilityLabel={
                          isBookmarked
                            ? (locale === "en" ? "Saved in bag" : "Đã cất vào túi đồ")
                            : (locale === "en" ? "Save to bag" : "Cất thảo mộc vào túi đồ")
                        }
                      >
                        {isBookmarked ? (
                          <BookmarkCheck size={14} color="#34d399" />
                        ) : (
                          <Bookmark size={14} color="#94a3b8" />
                        )}
                        <Text
                          style={[
                            styles.actionBtnSecondaryText,
                            isBookmarked && styles.actionBtnSecondaryTextActive,
                          ]}
                        >
                          {isBookmarked
                            ? (locale === "en" ? "In Backpack" : "Trong Túi Đồ")
                            : (locale === "en" ? "Save to Bag" : "Cất vào Túi")}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.brewTeaBtn}
                        onPress={() => handleAddToJourney(herb)}
                        activeOpacity={0.8}
                        accessibilityLabel={`add-journey-${herb.id}`}
                      >
                        <Plus size={14} color="#061a15" />
                        <Text style={styles.brewTeaBtnText}>
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
                        activeOpacity={0.7}
                      >
                        <Text style={styles.expandToggleText}>
                          {isExpanded
                            ? (locale === "en" ? "Collapse" : "Thu gọn")
                            : (locale === "en" ? "Medical Details" : "Chi tiết Y học")}
                        </Text>
                        {isExpanded ? (
                          <ChevronUp size={15} color="#38bdf8" />
                        ) : (
                          <ChevronDown size={15} color="#38bdf8" />
                        )}
                      </TouchableOpacity>
                    </View>

                    {/* Expandable Deep Science & Tea Ritual Details */}
                    {isExpanded && (
                      <View style={styles.deepScienceWrapper}>
                        {/* 1. Bioactive Compounds */}
                        <View style={styles.sectionBlock}>
                          <View style={styles.sectionTitleRow}>
                            <FlaskConical size={15} color="#34d399" />
                            <Text style={styles.sectionHeading}>
                              {locale === "en"
                                ? "KEY BIOACTIVE COMPOUNDS"
                                : "HOẠT CHẤT SINH HỌC CHÍNH"}
                            </Text>
                          </View>
                          {herb.compounds.map((cmp, cIdx) => (
                            <View key={cIdx} style={styles.compoundCard}>
                              <Text style={styles.compoundName}>{cmp.name}</Text>
                              <Text style={styles.compoundRole}>{cmp.role}</Text>
                            </View>
                          ))}
                        </View>

                        {/* 2. Biological Mechanisms */}
                        <View style={styles.sectionBlock}>
                          <View style={styles.sectionTitleRow}>
                            <Info size={15} color="#38bdf8" />
                            <Text style={styles.sectionHeading}>
                              {locale === "en"
                                ? "PHYSIOLOGICAL MECHANISM"
                                : "CƠ CHẾ TÁC ĐỘNG LÊN CƠ THỂ"}
                            </Text>
                          </View>
                          {herb.mechanisms.map((mech, mIdx) => (
                            <View key={mIdx} style={styles.mechanismCard}>
                              <Text style={styles.mechanismTitle}>{mech.title}</Text>
                              <Text style={styles.mechanismDesc}>{mech.desc}</Text>
                            </View>
                          ))}
                        </View>

                        {/* 3. PubMed Clinical Study Citation */}
                        <View style={styles.sectionBlock}>
                          <View style={styles.sectionTitleRow}>
                            <ExternalLink size={15} color="#fbbf24" />
                            <Text style={styles.sectionHeading}>
                              {locale === "en"
                                ? "CLINICAL EVIDENCE (PUBMED / NLM)"
                                : "BẰNG CHỨNG LÂM SÀNG (PUBMED / NLM)"}
                            </Text>
                          </View>
                          <View style={styles.studyCard}>
                            <Text style={styles.studyTitle}>"{herb.study.title}"</Text>
                            <Text style={styles.studyMeta}>
                              {herb.study.authors} ({herb.study.year}) · {herb.study.journal}
                            </Text>
                            <Text style={styles.studySummary}>{herb.study.summary}</Text>
                            <TouchableOpacity
                              style={styles.pmidLinkBtn}
                              onPress={() =>
                                Linking.openURL(
                                  `https://pubmed.ncbi.nlm.nih.gov/${herb.study.pmid}/`
                                )
                              }
                            >
                              <Text style={styles.pmidLinkText}>
                                {locale === "en"
                                  ? `View on PubMed (PMID: ${herb.study.pmid})`
                                  : `Xem trên PubMed (PMID: ${herb.study.pmid})`}
                              </Text>
                              <ExternalLink size={12} color="#38bdf8" />
                            </TouchableOpacity>
                          </View>
                        </View>

                        {/* 4. Practical Tea Brewing Ritual */}
                        <View style={styles.sectionBlock}>
                          <View style={styles.sectionTitleRow}>
                            <Thermometer size={15} color="#f472b6" />
                            <Text style={styles.sectionHeading}>
                              {locale === "en"
                                ? "EVIDENCE-BASED TEA RITUAL"
                                : "NGHI THỨC HÃM TRÀ CHUẨN KHOA HỌC"}
                            </Text>
                          </View>
                          <View style={styles.teaRitualCard}>
                            <Text style={styles.teaRecipeTitle}>
                              🍵 {herb.teaRitual.recipeName}
                            </Text>
                            <View style={styles.teaParamGrid}>
                              <View style={styles.teaParamCol}>
                                <Text style={styles.paramLabel}>
                                  {locale === "en" ? "Water Temp" : "Nhiệt độ nước"}
                                </Text>
                                <Text style={styles.paramVal}>
                                  {herb.teaRitual.waterTemp}
                                </Text>
                              </View>
                              <View style={styles.teaParamCol}>
                                <Text style={styles.paramLabel}>
                                  {locale === "en" ? "Steep Time" : "Thời gian ủ"}
                                </Text>
                                <Text style={styles.paramVal}>
                                  {herb.teaRitual.steepTime}
                                </Text>
                              </View>
                              <View style={styles.teaParamCol}>
                                <Text style={styles.paramLabel}>
                                  {locale === "en" ? "Best Time" : "Thời điểm uống"}
                                </Text>
                                <Text style={styles.paramVal}>
                                  {herb.teaRitual.bestTime}
                                </Text>
                              </View>
                            </View>
                            <Text style={styles.teaTasteNote}>
                              🌸 <Text style={{ fontWeight: "700" }}>
                                {locale === "en" ? "Flavor:" : "Hương vị:"}
                              </Text>{" "}
                              {herb.teaRitual.tasteNote}
                            </Text>
                            <Text style={styles.teaPrepTip}>
                              💡 <Text style={{ fontWeight: "700" }}>
                                {locale === "en" ? "Brewing Tip:" : "Mẹo hãm:"}
                              </Text>{" "}
                              {herb.teaRitual.preparationTip}
                            </Text>
                          </View>
                        </View>

                        {/* 5. Cautions & Contraindications */}
                        <View style={styles.sectionBlock}>
                          <View style={styles.sectionTitleRow}>
                            <ShieldAlert size={15} color="#f87171" />
                            <Text style={[styles.sectionHeading, { color: "#f87171" }]}>
                              {locale === "en"
                                ? "SAFETY NOTES & PRECAUTIONS"
                                : "LƯU Ý AN TOÀN & CHỐNG CHỈ ĐỊNH"}
                            </Text>
                          </View>
                          <View style={styles.cautionsCard}>
                            {herb.cautions.map((cau, cIdx) => (
                              <View key={cIdx} style={styles.cautionRow}>
                                <Text style={styles.cautionDot}>⚠️</Text>
                                <Text style={styles.cautionText}>{cau}</Text>
                              </View>
                            ))}
                            <Text style={styles.disclaimerText}>
                              {locale === "en"
                                ? "* Educational wellness information only; does not replace a physician's diagnosis or medical treatment plan."
                                : "* Thông tin mang tính chất giáo dục lối sống, không thay thế chẩn đoán hoặc phác đồ điều trị y khoa của bác sĩ."}
                            </Text>
                          </View>
                        </View>
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(3, 12, 10, 0.88)",
    justifyContent: "center",
    alignItems: "center",
    padding: 12,
  },
  modalCard: {
    width: "100%",
    maxWidth: 620,
    maxHeight: "92%",
    backgroundColor: "#061a15",
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "rgba(52, 211, 153, 0.45)",
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
    backgroundColor: "rgba(52, 211, 153, 0.15)",
    borderWidth: 1,
    borderColor: "#34d399",
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
  floraCard: {
    marginHorizontal: 14,
    marginTop: 10,
    marginBottom: 4,
    backgroundColor: "rgba(10, 32, 26, 0.95)",
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: "rgba(52, 211, 153, 0.35)",
    padding: 12,
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  floraHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  floraAvatarRing: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(52, 211, 153, 0.2)",
    borderWidth: 1.5,
    borderColor: "#34d399",
    alignItems: "center",
    justifyContent: "center",
  },
  floraName: {
    fontSize: 13.5,
    fontWeight: "800",
    color: "#f8fafc",
  },
  floraRole: {
    fontSize: 10.5,
    color: "#94a3b8",
    marginTop: 1,
  },
  concernPill: {
    backgroundColor: "rgba(52, 211, 153, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(52, 211, 153, 0.4)",
  },
  concernPillText: {
    fontSize: 10.5,
    fontWeight: "800",
    color: "#34d399",
  },
  floraBubble: {
    backgroundColor: "rgba(0, 0, 0, 0.25)",
    borderRadius: 10,
    padding: 10,
    gap: 6,
  },
  floraGreetingText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#fbbf24",
  },
  floraAdviceText: {
    fontSize: 11.5,
    color: "#e2e8f0",
    lineHeight: 16.5,
  },
  floraTagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  floraTagsLabel: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "#94a3b8",
  },
  floraTagBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(52, 211, 153, 0.15)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(52, 211, 153, 0.3)",
  },
  floraTagBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#6ee7b7",
  },
  floraCtaText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#38bdf8",
    fontStyle: "italic",
    marginTop: 2,
  },
  personalBanner: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 4,
  },
  mascotSpeechBubble: {
    backgroundColor: "rgba(15, 34, 28, 0.9)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.35)",
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
    color: "#fbbf24",
    letterSpacing: 0.5,
  },
  bubbleBodyText: {
    fontSize: 12,
    color: "#cbd5e1",
    lineHeight: 17,
  },
  highlightText: {
    color: "#34d399",
    fontWeight: "700",
  },
  teaRitualBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(245, 158, 11, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.3)",
    borderRadius: 10,
    marginHorizontal: 14,
    marginTop: 6,
    marginBottom: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  teaRitualLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  teaRitualTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#fef3c7",
  },
  teaRitualDesc: {
    fontSize: 10.5,
    color: "#d1d5db",
    marginTop: 1,
  },
  doneBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(16, 185, 129, 0.2)",
    borderColor: "#10b981",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  doneBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#34d399",
  },
  toastSuccess: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#059669",
    borderRadius: 8,
    marginHorizontal: 14,
    marginBottom: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  toastSuccessText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#ffffff",
    flex: 1,
  },
  tabContainer: {
    flexDirection: "row",
    marginHorizontal: 14,
    marginTop: 10,
    marginBottom: 6,
    backgroundColor: "rgba(3, 20, 16, 0.96)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(52, 211, 153, 0.25)",
    padding: 3,
    gap: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  tabButtonActive: {
    backgroundColor: "rgba(16, 185, 129, 0.25)",
    borderWidth: 1.2,
    borderColor: "#34d399",
  },
  tabButtonText: {
    fontSize: 11.5,
    fontWeight: "600",
    color: "#94a3b8",
  },
  tabButtonTextActive: {
    color: "#34d399",
    fontWeight: "800",
  },
  herbScrollView: {
    flex: 1,
  },
  herbListContent: {
    padding: 14,
    gap: 12,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 36,
    paddingHorizontal: 20,
    gap: 8,
  },
  emptyStateTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#cbd5e1",
  },
  emptyStateSub: {
    fontSize: 12,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 16,
  },
  herbCard: {
    backgroundColor: "rgba(10, 30, 24, 0.85)",
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: "rgba(52, 211, 153, 0.25)",
    padding: 12,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  badgeRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  categoryBadge: {
    fontSize: 10,
    fontWeight: "700",
    color: "#34d399",
    backgroundColor: "rgba(52, 211, 153, 0.14)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  herbCommonName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#f8fafc",
  },
  herbScientificName: {
    fontSize: 11,
    fontStyle: "italic",
    color: "#94a3b8",
    marginTop: 1,
  },
  cardHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconBtn: {
    padding: 6,
  },
  herbShortDesc: {
    fontSize: 12,
    color: "#cbd5e1",
    lineHeight: 17,
    marginBottom: 8,
  },
  highlightsContainer: {
    gap: 4,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    padding: 8,
    borderRadius: 8,
    marginBottom: 10,
  },
  highlightItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },
  highlightBullet: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#34d399",
    marginTop: 6,
  },
  cardActionBar: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
  },
  actionBtnSecondary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    paddingVertical: 6,
    paddingHorizontal: 9,
    borderRadius: 8,
  },
  actionBtnSecondaryActive: {
    backgroundColor: "rgba(52, 211, 153, 0.15)",
    borderColor: "rgba(52, 211, 153, 0.45)",
  },
  actionBtnSecondaryText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#cbd5e1",
  },
  actionBtnSecondaryTextActive: {
    color: "#34d399",
    fontWeight: "700",
  },
  brewTeaBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#059669",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  brewTeaBtnDisabled: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  brewTeaBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#ffffff",
  },
  brewTeaBtnTextDisabled: {
    color: "#64748b",
  },
  expandToggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingVertical: 4,
  },
  expandToggleText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#38bdf8",
  },
  deepScienceWrapper: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.12)",
    gap: 12,
  },
  sectionBlock: {
    gap: 6,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sectionHeading: {
    fontSize: 10.5,
    fontWeight: "800",
    color: "#94a3b8",
    letterSpacing: 0.5,
  },
  compoundCard: {
    backgroundColor: "rgba(52, 211, 153, 0.07)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(52, 211, 153, 0.2)",
    padding: 8,
  },
  compoundName: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#6ee7b7",
    marginBottom: 2,
  },
  compoundRole: {
    fontSize: 11,
    color: "#cbd5e1",
    lineHeight: 15,
  },
  mechanismCard: {
    backgroundColor: "rgba(56, 189, 248, 0.07)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.2)",
    padding: 8,
  },
  mechanismTitle: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#7dd3fc",
    marginBottom: 2,
  },
  mechanismDesc: {
    fontSize: 11,
    color: "#cbd5e1",
    lineHeight: 15,
  },
  studyCard: {
    backgroundColor: "rgba(245, 158, 11, 0.08)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.25)",
    padding: 8,
  },
  studyTitle: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#fde68a",
    fontStyle: "italic",
    marginBottom: 2,
  },
  studyMeta: {
    fontSize: 10.5,
    color: "#94a3b8",
    marginBottom: 4,
  },
  studySummary: {
    fontSize: 11,
    color: "#e2e8f0",
    lineHeight: 15,
    marginBottom: 6,
  },
  pmidLinkBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
  },
  pmidLinkText: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "#38bdf8",
    textDecorationLine: "underline",
  },
  teaRitualCard: {
    backgroundColor: "rgba(244, 114, 182, 0.08)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(244, 114, 182, 0.25)",
    padding: 8,
    gap: 6,
  },
  teaRecipeTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#fbcfe8",
  },
  teaParamGrid: {
    flexDirection: "row",
    gap: 6,
    backgroundColor: "rgba(0, 0, 0, 0.25)",
    borderRadius: 6,
    padding: 6,
  },
  teaParamCol: {
    flex: 1,
  },
  paramLabel: {
    fontSize: 9.5,
    color: "#94a3b8",
  },
  paramVal: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "#f8fafc",
    marginTop: 1,
  },
  teaTasteNote: {
    fontSize: 11,
    color: "#cbd5e1",
    lineHeight: 15,
  },
  teaPrepTip: {
    fontSize: 11,
    color: "#cbd5e1",
    lineHeight: 15,
  },
  cautionsCard: {
    backgroundColor: "rgba(239, 68, 68, 0.08)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.25)",
    padding: 8,
    gap: 4,
  },
  cautionRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },
  cautionDot: {
    fontSize: 10,
    marginTop: 2,
  },
  cautionText: {
    fontSize: 10.5,
    color: "#fca5a5",
    flex: 1,
    lineHeight: 15,
  },
  disclaimerText: {
    fontSize: 9.5,
    color: "#94a3b8",
    fontStyle: "italic",
    marginTop: 4,
    lineHeight: 13,
  },
});
