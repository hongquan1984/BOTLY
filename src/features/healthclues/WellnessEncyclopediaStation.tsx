"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { 
  ArrowLeft, 
  BookOpen, 
  Bookmark, 
  BookmarkCheck,
  ExternalLink, 
  Footprints, 
  Leaf, 
  Search, 
  ShieldAlert, 
  Sparkles,
  FlaskConical,
  FileText,
  X,
  Star,
  Filter
} from "lucide-react";
import { HealthCluesGameIcon, type HealthCluesGameIconName } from "@/components/healthclues/HealthCluesGameIcon";
import { useHealthCluesLocale } from "@/components/healthclues/HealthCluesLocaleProvider";
import { 
  botanicalLibrary, 
  getRecommendedBotanicalsForTopic, 
  type BotanicalArticle, 
  type BotanicalEvidenceLevel 
} from "@/data/healthclues-botanical-library";
import { BotanicalArticleModal } from "@/components/healthclues/BotanicalArticleModal";
import type { BackpackTool } from "./BackpackExperience";

type Station = "nutrition" | "practices" | "movement";
type View = "list" | "preview" | "details";
type CatalogItem = BackpackTool & { kind: string; category?: string; evidenceSources?: unknown[]; topicTags?: string[]; demoOnly?: boolean; personalizationEligibility?: string };
type Entry = { id: string; catalog_item_id: string | null; equipment_position?: number | null; status: string };

const stationCopy: Record<Station, { title: string; npc: string; category: string; greeting: string; gameIcon?: HealthCluesGameIconName; iconTone?: "botanical" | "lavender" }> = {
  nutrition: { title: "Scientific Botanical Library", npc: "Botanist", category: "herbal_nutrition", greeting: "Welcome to the Scientific Botanical Library. Discover peer-reviewed medical research, biological mechanisms, and transparent PubMed citations.", gameIcon: "herbs-bundle", iconTone: "botanical" },
  practices: { title: "Wellness Sanctuary", npc: "Wellness Guide", category: "wellness_practice", greeting: "Here are supportive practices to explore at your own pace. These are learning options, not a treatment plan.", gameIcon: "lotus", iconTone: "lavender" },
  movement: { title: "Activity Trail", npc: "Explorer", category: "movement", greeting: "Explore activity ideas and their limits. Choose only what feels appropriate for you." },
};

export function WellnessEncyclopediaStation({ station, topic, nickname = "", journeyGreeting, accessToken, worldId, savedIds, entries, onUpdated }: {
  station: Station; topic: string; nickname?: string; journeyGreeting?: string; accessToken?: string; worldId: string; savedIds: string[]; entries: Entry[]; onUpdated: () => void;
}) {
  // Existing state for practices & movement
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [eligibleIds, setEligibleIds] = useState<string[]>([]);
  const [recommendationRows, setRecommendationRows] = useState<Array<{ id: string; status: string; equipmentEligible: boolean }>>([]);
  const [recommendationsLoaded, setRecommendationsLoaded] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [localSavedIds, setLocalSavedIds] = useState<string[]>([]);
  const shownEventIds = useRef(new Set<string>());
  const { locale } = useHealthCluesLocale();
  const tx = useCallback((en: string, vi: string) => locale === "vi" ? vi : en, [locale]);
  const [view, setView] = useState<View>("list");
  const [selectedId, setSelectedId] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [equipmentPosition, setEquipmentPosition] = useState(1);
  const [replaceEntryId, setReplaceEntryId] = useState("");
  const [showEquipChoices, setShowEquipChoices] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [question, setQuestion] = useState("");
  const [providerConsent, setProviderConsent] = useState(false);
  const [chatAnswer, setChatAnswer] = useState("");
  const [chatSources, setChatSources] = useState<string[]>([]);

  // NEW STATE: Botanical Scientific Library
  const [botanicalQuery, setBotanicalQuery] = useState("");
  const [botanicalTab, setBotanicalTab] = useState<"for_you" | "all" | "saved">("for_you");
  const [botanicalEvidenceFilter, setBotanicalEvidenceFilter] = useState<"all" | BotanicalEvidenceLevel>("all");
  const [selectedBotanicalArticle, setSelectedBotanicalArticle] = useState<BotanicalArticle | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [botanicalBookmarks, setBotanicalBookmarks] = useState<string[]>([]);
  const [bookmarkBusy, setBookmarkBusy] = useState(false);

  const copy = stationCopy[station];

  // Initialize and sync botanical bookmarks
  useEffect(() => {
    try {
      const cached = localStorage.getItem("hc_botanical_bookmarks");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) setBotanicalBookmarks(parsed);
      }
    } catch {}

    const handleSync = (e: Event) => {
      const customEvent = e as CustomEvent<string[]>;
      if (Array.isArray(customEvent.detail)) {
        setBotanicalBookmarks(customEvent.detail);
      }
    };
    window.addEventListener("hc_bookmarks_updated", handleSync);

    if (accessToken) {
      fetch("/api/healthclues/knowledge", {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store"
      })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data?.bookmarks)) {
            setBotanicalBookmarks(data.bookmarks);
            try {
              localStorage.setItem("hc_botanical_bookmarks", JSON.stringify(data.bookmarks));
            } catch {}
          }
        })
        .catch(() => {});
    }

    return () => {
      window.removeEventListener("hc_bookmarks_updated", handleSync);
    };
  }, [accessToken]);

  // Toggle Botanical Bookmark
  const toggleBotanicalBookmark = async (articleId: string) => {
    const isCurrentlySaved = botanicalBookmarks.includes(articleId);
    const nextBookmarks = isCurrentlySaved 
      ? botanicalBookmarks.filter(id => id !== articleId)
      : [...botanicalBookmarks, articleId];
    
    setBotanicalBookmarks(nextBookmarks);
    try {
      localStorage.setItem("hc_botanical_bookmarks", JSON.stringify(nextBookmarks));
    } catch {}
    window.dispatchEvent(new CustomEvent("hc_bookmarks_updated", { detail: nextBookmarks }));
    
    if (accessToken) {
      setBookmarkBusy(true);
      try {
        await fetch("/api/healthclues/knowledge", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            action: "bookmark_article",
            articleId,
            bookmarked: !isCurrentlySaved
          })
        });
        onUpdated();
      } catch (err) {
        console.error("Bookmark sync error:", err);
      } finally {
        setBookmarkBusy(false);
      }
    }
  };

  // Open Article Detail Modal
  const openArticleDetail = (article: BotanicalArticle) => {
    setSelectedBotanicalArticle(article);
    setIsModalOpen(true);
  };

  // Filter Botanical Articles
  const recommendedBotanicals = useMemo(() => {
    return getRecommendedBotanicalsForTopic(topic);
  }, [topic]);

  const filteredBotanicals = useMemo(() => {
    let list = botanicalLibrary;

    if (botanicalTab === "for_you") {
      list = recommendedBotanicals.length > 0 ? recommendedBotanicals : botanicalLibrary;
    } else if (botanicalTab === "saved") {
      list = botanicalLibrary.filter(item => botanicalBookmarks.includes(item.id));
    }

    if (botanicalEvidenceFilter !== "all") {
      list = list.filter(item => item.evidenceLevel === botanicalEvidenceFilter);
    }

    if (botanicalQuery.trim()) {
      const q = botanicalQuery.toLowerCase().trim();
      list = list.filter(item => {
        const matchVi = item.commonName.vi.toLowerCase().includes(q);
        const matchEn = item.commonName.en.toLowerCase().includes(q);
        const matchSci = item.scientificName.toLowerCase().includes(q);
        const matchCompounds = item.compounds.some(c => 
          c.name.toLowerCase().includes(q) || 
          c.scientificDescription.vi.toLowerCase().includes(q) || 
          c.scientificDescription.en.toLowerCase().includes(q)
        );
        const matchTopics = item.topicKeys.some(t => t.toLowerCase().includes(q));
        const matchIntro = item.shortIntro.vi.toLowerCase().includes(q) || item.shortIntro.en.toLowerCase().includes(q);
        return matchVi || matchEn || matchSci || matchCompounds || matchTopics || matchIntro;
      });
    }

    return list;
  }, [botanicalTab, recommendedBotanicals, botanicalBookmarks, botanicalEvidenceFilter, botanicalQuery]);

  // Load catalog for practices/movement stations
  useEffect(() => {
    if (station === "nutrition") return;
    let alive = true;
    fetch("/api/healthclues/catalog", { cache: "no-store" }).then(async response => {
      const payload = await response.json() as { items?: CatalogItem[]; error?: string };
      if (!response.ok) throw new Error(payload.error || "The learning catalog is unavailable.");
      if (alive) setItems(Array.isArray(payload.items) ? payload.items : []);
    }).catch(caught => { if (alive) setError(caught instanceof Error ? caught.message : "The learning catalog is unavailable."); });
    return () => { alive = false; };
  }, [station]);

  useEffect(() => {
    if (station === "nutrition") return;
    let live = true;
    if (!accessToken) return;
    void fetch(`/api/healthclues/recommendations?worldId=${encodeURIComponent(worldId)}&station=${station}`, { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" })
      .then(async response => {
        const body = await response.json() as { items?: Array<{ id: string; status: string; equipmentEligible: boolean }> };
        if (!response.ok) throw new Error("Personalized discovery is unavailable.");
        if (live) {
          const rows = body.items || [];
          setRecommendationRows(rows);
          setEligibleIds(rows.filter(row => row.equipmentEligible).map(row => row.id));
        }
      })
      .catch(() => { if (live) setError(tx("Personalized discovery is unavailable right now.", "Hiện chưa thể tải nội dung khám phá phù hợp.")); })
      .finally(() => { if (live) setRecommendationsLoaded(true); });
    return () => { live = false; };
  }, [accessToken, worldId, station, locale, tx]);

  const relevant = useMemo(() => {
    if (station === "nutrition") return [];
    const recommendationIds = new Set(recommendationRows.filter(row => row.status === "eligible_for_personalized_discovery" || row.status === "educational_only").map(row => row.id));
    return items.filter(item => (item.topicTags?.some(tag => topicTagMatches(tag, topic) || tag === "general-education") || !item.topicTags?.length) && itemCategoryMatches(item, station) && (!item.demoOnly && recommendationIds.has(item.id)));
  }, [items, station, topic, recommendationRows]);

  const listed = relevant.filter(item => (category === "all" || (item.category || item.kind) === category) && `${item.name} ${item.description} ${item.evidenceSummary || ""}`.toLowerCase().includes(query.toLowerCase().trim()));
  const visible = (showAll ? listed : listed.slice(0, 5)).filter(item => !dismissedIds.includes(item.id));
  const authHeaders: Record<string, string> = { "Content-Type": "application/json", ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) };

  const saveToCollection = async () => {
    const selected = items.find(item => item.id === selectedId);
    if (!selected || !accessToken || savedIds.includes(selected.id) || busy) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/healthclues/world/collection", { method: "POST", headers: authHeaders, body: JSON.stringify({ catalogItemId: selected.id, itemVersion: selected.version }), cache: "no-store" });
      const payload = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(payload.error || "This entry could not be saved.");
      setLocalSavedIds(current => [...new Set([...current, selected.id])]);
      setNotice(tx("Saved to My Collection. It has not been equipped.", "Đã lưu vào Bộ sưu tập. Mục này chưa được trang bị."));
      onUpdated();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "This entry could not be saved."); }
    finally { setBusy(false); }
  };

  const equip = async () => {
    const selected = items.find(item => item.id === selectedId);
    if (!selected || !accessToken || !eligibleIds.includes(selected.id) || busy) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/healthclues/world/toolkit", { method: "POST", headers: authHeaders, body: JSON.stringify({ worldId, catalogItemId: selected.id, itemVersion: selected.version, equipmentPosition, discoveryStation: station, ...(replaceEntryId ? { replaceEntryId } : {}), requestKey: crypto.randomUUID() }), cache: "no-store" });
      const payload = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(payload.error || "This item could not be added to your active Backpack.");
      setNotice(`${selected.name} added to Backpack slot ${equipmentPosition}.`);
      setShowEquipChoices(false);
      setReplaceEntryId("");
      onUpdated();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "This item could not be added to your active Backpack."); }
    finally { setBusy(false); }
  };

  const askNpc = async () => {
    if (!accessToken || !question.trim() || busy) return;
    setBusy(true); setError(""); setNotice(""); setChatAnswer(""); setChatSources([]);
    try {
      const response = await fetch("/api/healthclues/npc-chat", { method: "POST", headers: authHeaders, body: JSON.stringify({ worldId, npc: station === "movement" ? "explorer" : "wellness-guide", question: question.trim(), externalProcessingConsent: providerConsent }), cache: "no-store" });
      const payload = await response.json() as { answer?: string; sources?: Array<{ name?: string }>; error?: string };
      if (!response.ok) throw new Error(payload.error || "NPC conversation is unavailable.");
      setChatAnswer(payload.answer || "I don't have enough verified information to answer that confidently.");
      setChatSources((payload.sources || []).flatMap(source => source.name ? [source.name] : []));
    } catch (caught) { setError(caught instanceof Error ? caught.message : "NPC conversation is unavailable."); }
    finally { setBusy(false); }
  };

  const iconFor = (item: CatalogItem) => /movement|walk|activity/i.test(item.kind) ? Footprints : /food|herb|nutrition/i.test(item.kind) ? Leaf : Sparkles;
  const categories = [...new Set(relevant.map(item => item.category || item.kind))];
  const occupiedPosition = (position: number) => entries.find(entry => entry.status === "equipped" && entry.equipment_position === position);
  const selectedPractice = items.find(item => item.id === selectedId);

  // Evidence Level Badges Style
  const evidenceBadge = (level: BotanicalEvidenceLevel) => {
    switch (level) {
      case "human_clinical_trial":
        return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100/90 text-emerald-900 border border-emerald-300 px-2.5 py-0.5 text-[11px] font-extrabold">{tx("Human Clinical Trial", "Thử nghiệm lâm sàng ở người")}</span>;
      case "systematic_review":
        return <span className="inline-flex items-center gap-1 rounded-full bg-purple-100/90 text-purple-900 border border-purple-300 px-2.5 py-0.5 text-[11px] font-extrabold">{tx("Systematic Review", "Tổng quan hệ thống")}</span>;
      case "animal":
        return <span className="inline-flex items-center gap-1 rounded-full bg-amber-100/90 text-amber-900 border border-amber-300 px-2.5 py-0.5 text-[11px] font-extrabold">{tx("Animal Study", "Nghiên cứu trên động vật")}</span>;
      case "human_observational":
        return <span className="inline-flex items-center gap-1 rounded-full bg-teal-100/90 text-teal-900 border border-teal-300 px-2.5 py-0.5 text-[11px] font-extrabold">{tx("Observational", "Nghiên cứu quan sát")}</span>;
      case "traditional_use":
        return <span className="inline-flex items-center gap-1 rounded-full bg-stone-100/90 text-stone-900 border border-stone-300 px-2.5 py-0.5 text-[11px] font-extrabold">{tx("Traditional Use", "Kinh nghiệm truyền thống")}</span>;
      case "in_vitro":
      default:
        return <span className="inline-flex items-center gap-1 rounded-full bg-blue-100/90 text-blue-900 border border-blue-300 px-2.5 py-0.5 text-[11px] font-extrabold">{tx("In Vitro Study", "Nghiên cứu in vitro")}</span>;
    }
  };

  return (
    <section 
      className={`hc-encyclopedia ${station === "nutrition" ? "hc-botanist" : ""}`} 
      aria-label={station === "nutrition" ? tx("Scientific Botanical Library", "Thư viện Khoa học Thảo mộc") : `${copy.title} encyclopedia`}
    >
      {/* Station Greeting Header */}
      <header className="hc-encyclopedia-greeting hc-botanist-greeting">
        <img 
          src={station === "nutrition" ? "/healthclues/assets/regions/npc-botanist-distinct.webp" : station === "movement" ? "/healthclues/assets/regions/npc-trail-explorer-distinct.webp" : "/healthclues/assets/regions/npc-wellness-guide-distinct.webp"} 
          alt={`${copy.npc} portrait`} 
          className="hc-discovery-npc-portrait"
        />
        <div>
          <p className="hc-encyclopedia-role">
            {copy.gameIcon && <HealthCluesGameIcon icon={copy.gameIcon} tone={copy.iconTone}/>}
            <span>
              {station === "nutrition" 
                ? tx("BOTANIST · SCIENTIFIC LIBRARY", "NHÀ THỰC VẬT HỌC · THƯ VIỆN KHOA HỌC") 
                : `${copy.npc.toUpperCase()} · JOURNEY GUIDE`}
            </span>
          </p>
          <strong>
            {station === "nutrition" 
              ? tx("Welcome to the Scientific Botanical Library. Discover peer-reviewed medical research, biological mechanisms, and transparent PubMed citations.", "Chào mừng bạn đến với Thư viện Khoa học Thảo mộc. Nơi tổng hợp các nghiên cứu y học, cơ chế tác động và dẫn nguồn PubMed minh bạch.")
              : `${nickname ? `Welcome, ${nickname}! ` : ""}${journeyGreeting || copy.greeting}`}
          </strong>
          <small className="block mt-1">
            {station === "nutrition"
              ? tx("For educational purposes only. Not medical treatment advice.", "Thông tin chỉ nhằm mục đích giáo dục và tham khảo, không phải hướng dẫn điều trị.")
              : `For your saved interest: ${topic}. This is self-reported, not a diagnosis.`}
          </small>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* BOTANIST STATION (NUTRITION / BOTANICAL LIBRARY) */}
      {/* ========================================================================= */}
      {station === "nutrition" ? (
        <div className="space-y-5 mt-4">
          
          {/* Friendly Educational Banner */}
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3.5 sm:p-4 text-xs sm:text-sm text-emerald-950 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <FlaskConical size={18} className="text-emerald-700 shrink-0" />
              <span>
                <strong>{tx("Peer-Reviewed Botanical Database:", "Cơ sở dữ liệu thảo mộc bình duyệt:")}</strong>{" "}
                {tx(
                  "All articles feature verified Latin names, active bioactives, mechanisms of action, and direct PubMed citations.",
                  "Tất cả bài viết đều có tên khoa học chuẩn quốc tế, hoạt chất sinh học, cơ chế tác động và link dẫn trực tiếp đến PubMed."
                )}
              </span>
            </div>
            <span className="hidden md:inline-block rounded-full bg-emerald-800 text-white font-bold text-[10px] px-2.5 py-1 shrink-0 uppercase tracking-wider">
              {tx("Educational Only", "Chỉ mục đích tham khảo")}
            </span>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#687a6e]" />
            <input 
              type="text"
              value={botanicalQuery}
              onChange={(e) => setBotanicalQuery(e.target.value)}
              placeholder={tx("Search herbs, compounds, or topics...", "Tìm thảo mộc, hợp chất hoặc chủ đề...")}
              className="w-full rounded-2xl border border-[#d2cbba] bg-white py-3 pl-11 pr-10 text-sm placeholder:text-[#88988d] focus:border-emerald-700 focus:outline-none focus:ring-1 focus:ring-emerald-700 shadow-sm"
            />
            {botanicalQuery && (
              <button 
                type="button" 
                onClick={() => setBotanicalQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#687a6e] hover:text-black"
                aria-label={tx("Clear search", "Xóa tìm kiếm")}
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Navigation Filter Tabs & Evidence Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e5dfcf] pb-3">
            {/* View Tabs */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setBotanicalTab("for_you")}
                className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-black transition-colors ${
                  botanicalTab === "for_you"
                    ? "bg-[#183d36] text-white shadow-sm"
                    : "bg-[#eee9db] text-[#3c5144] hover:bg-[#e4ddcd]"
                }`}
              >
                <Star size={14} className={botanicalTab === "for_you" ? "text-amber-300" : "text-amber-700"} />
                <span>{tx("For You", "Dành cho bạn")}</span>
              </button>

              <button
                type="button"
                onClick={() => setBotanicalTab("all")}
                className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-black transition-colors ${
                  botanicalTab === "all"
                    ? "bg-[#183d36] text-white shadow-sm"
                    : "bg-[#eee9db] text-[#3c5144] hover:bg-[#e4ddcd]"
                }`}
              >
                <BookOpen size={14} />
                <span>{tx("Explore Library", "Thư viện khám phá")}</span>
              </button>

              <button
                type="button"
                onClick={() => setBotanicalTab("saved")}
                className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-black transition-colors ${
                  botanicalTab === "saved"
                    ? "bg-[#183d36] text-white shadow-sm"
                    : "bg-[#eee9db] text-[#3c5144] hover:bg-[#e4ddcd]"
                }`}
              >
                <BookmarkCheck size={14} className={botanicalTab === "saved" ? "text-amber-300" : "text-amber-700"} />
                <span>{tx("Saved Bookmarks", "Đã lưu")}</span>
                <span className="ml-1 rounded-full bg-white/20 px-1.5 py-0.2 text-[10px]">
                  {botanicalBookmarks.length}
                </span>
              </button>
            </div>

            {/* Evidence Classification Filter */}
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-[#64796b]" />
              <select
                value={botanicalEvidenceFilter}
                onChange={(e) => setBotanicalEvidenceFilter(e.target.value as any)}
                className="rounded-xl border border-[#d2cbba] bg-white px-2.5 py-1.5 text-xs font-bold text-[#2a3c31] focus:border-emerald-700 focus:outline-none"
                aria-label={tx("Filter by evidence", "Lọc theo mức bằng chứng")}
              >
                <option value="all">{tx("All Evidence Levels", "Tất cả mức bằng chứng")}</option>
                <option value="human_clinical_trial">{tx("Human Clinical Trials", "Thử nghiệm lâm sàng ở người")}</option>
                <option value="systematic_review">{tx("Systematic Reviews", "Tổng quan hệ thống")}</option>
                <option value="animal">{tx("Animal Studies", "Nghiên cứu trên động vật")}</option>
                <option value="in_vitro">{tx("In Vitro Studies", "Nghiên cứu in vitro")}</option>
                <option value="human_observational">{tx("Observational Studies", "Nghiên cứu quan sát")}</option>
                <option value="traditional_use">{tx("Traditional Use", "Kinh nghiệm truyền thống")}</option>
              </select>
            </div>
          </div>

          {/* Section Sub-heading based on Tab */}
          {botanicalTab === "for_you" && (
            <div className="rounded-xl bg-[#f5f1e5] p-3 text-xs text-[#526457] flex items-center justify-between">
              <span>
                <strong>{tx("Curated for your Journey:", "Gợi ý phù hợp với mối quan tâm:")}</strong>{" "}
                <span className="text-emerald-900 font-bold capitalize">{topic || "General Wellness"}</span>
              </span>
              <span className="text-[11px] text-[#718276]">
                {recommendedBotanicals.length} {tx("relevant herbs found", "thảo mộc liên quan")}
              </span>
            </div>
          )}

          {botanicalTab === "saved" && botanicalBookmarks.length === 0 && (
            <div className="rounded-2xl border border-dashed border-[#cfc8b6] bg-white/80 p-8 text-center space-y-2">
              <Bookmark size={32} className="mx-auto text-[#94a398]" />
              <h3 className="font-bold text-base text-[#244234]">
                {tx("No saved articles yet", "Chưa có bài viết nào được lưu")}
              </h3>
              <p className="text-xs text-[#627568] max-w-md mx-auto">
                {tx(
                  "Click the 'Bookmark' button on any botanical article to save it here and sync it directly to Your Knowledge Book.",
                  "Nhấn nút 'Lưu kiến thức' trên bất kỳ bài viết thảo mộc nào để lưu lại xem sau. Dữ liệu sẽ đồng bộ tự động với Sổ Tay Kiến Thức của bạn."
                )}
              </p>
            </div>
          )}

          {/* Botanical Article Cards Grid */}
          {filteredBotanicals.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2">
              {filteredBotanicals.map(article => {
                const isSaved = botanicalBookmarks.includes(article.id);
                return (
                  <article 
                    key={article.id} 
                    className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border-2 border-[#d8cfbe] bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f6f0e2] shadow-[0_4px_20px_rgba(30,41,36,0.06)] hover:border-[#b89552] hover:shadow-[0_8px_30px_rgba(180,145,75,0.22)] hover:-translate-y-1 transition-all duration-300"
                  >
                    {/* Top Botanical Hero Image Frame */}
                    <div className="relative h-44 sm:h-48 w-full overflow-hidden bg-[#f4eee1] border-b border-[#ded4be]">
                      {article.imageUrl ? (
                        <img 
                          src={article.imageUrl} 
                          alt={article.commonName[locale]} 
                          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-emerald-50 text-emerald-800">
                          <Leaf size={48} className="opacity-40" />
                        </div>
                      )}
                      
                      {/* Gradient scrim for badge readability */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-black/30 pointer-events-none" />

                      {/* Floating Top Left: Evidence Level Badge */}
                      <div className="absolute top-2.5 left-2.5 z-10 drop-shadow-sm">
                        {evidenceBadge(article.evidenceLevel)}
                      </div>

                      {/* Floating Top Right: Category Herb Tag */}
                      {article.categoryBadge?.[locale] && (
                        <span className="absolute top-2.5 right-2.5 z-10 inline-flex items-center rounded-full bg-[#16382f]/85 backdrop-blur-xs px-2.5 py-0.5 text-[10px] font-extrabold text-[#f6df9d] border border-[#d6ba75]/40 shadow-xs">
                          {article.categoryBadge[locale]}
                        </span>
                      )}

                      {/* Floating Bottom Bar: Citations & Latin Name */}
                      <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between z-10 text-[10px] text-white/95 font-semibold">
                        <span className="inline-flex items-center gap-1 rounded-md bg-black/60 backdrop-blur-xs px-2 py-0.5 border border-white/20">
                          <FileText size={11} className="text-[#86efac]" />
                          <span>{article.references.length} {tx("PubMed citations", "trích dẫn PubMed")}</span>
                        </span>
                        <span className="text-white/85 font-mono text-[9.5px] truncate max-w-[170px] drop-shadow-xs">
                          {article.scientificName}
                        </span>
                      </div>
                    </div>

                    {/* Card Body: Scannable Bioactives & Research Highlights */}
                    <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                      <div>
                        {/* Title & Herb Badge */}
                        <div className="mb-3">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="text-lg sm:text-xl font-black text-[#16382f] tracking-tight">
                              {article.commonName[locale]}
                            </h3>
                            <span className="shrink-0 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#ecf4ea] text-emerald-900 border border-emerald-300">
                              {tx("Scientific Herb", "Dược thảo")}
                            </span>
                          </div>
                          <p className="text-xs font-serif italic text-[#577262] mt-0.5">
                            {article.scientificName}
                          </p>
                        </div>

                        {/* Key Bioactive Compounds */}
                        <div className="mb-3 rounded-xl bg-[#f7f3e8] border border-[#e8dfcd] p-2.5">
                          <p className="text-[10px] font-black uppercase tracking-wider text-[#635327] flex items-center gap-1 mb-1.5">
                            <Sparkles size={11} className="text-amber-600 shrink-0" />
                            <span>{tx("Key Active Bioactives", "Hoạt chất sinh học chính")}</span>
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {article.compounds.slice(0, 3).map((comp, idx) => (
                              <span 
                                key={idx} 
                                className="rounded-lg bg-white border border-[#d8cfbe] px-2 py-0.5 text-[10.5px] font-extrabold text-[#2b4435] shadow-2xs"
                              >
                                {comp.name}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Studied Mechanisms & Effects Highlights */}
                        <div className="rounded-xl bg-[#f2f7f1] border border-[#d4e5d2] p-2.5">
                          <p className="text-[10px] font-black uppercase tracking-wider text-[#26533c] flex items-center gap-1 mb-1.5">
                            <FlaskConical size={11} className="text-emerald-700 shrink-0" />
                            <span>{tx("Mechanisms Under Study", "Tác dụng & cơ chế nghiên cứu")}</span>
                          </p>
                          <ul className="space-y-1 text-xs text-[#2b4436]">
                            {(article.keyHighlights?.[locale] || []).map((highlight, idx) => (
                              <li key={idx} className="flex items-start gap-1.5 leading-snug">
                                <span className="text-emerald-700 shrink-0 font-black text-[11px] mt-0.5">✦</span>
                                <span className="font-medium">{highlight}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="mt-4 pt-3.5 border-t border-[#e8dfcd] flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => openArticleDetail(article)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#173b32] to-[#245346] hover:from-[#1d463c] hover:to-[#2c6152] px-4 py-2 text-xs font-black text-[#fbf5e6] shadow-sm hover:shadow-md transition-all active:scale-95"
                        >
                          <BookOpen size={14} className="text-[#a7f3d0]" />
                          <span>{tx("Read Details", "Đọc chi tiết")}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => void toggleBotanicalBookmark(article.id)}
                          disabled={bookmarkBusy}
                          className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition-all ${
                            isSaved 
                              ? "border-amber-400 bg-amber-50 text-amber-950 hover:bg-amber-100 shadow-2xs" 
                              : "border-[#cfc6b2] bg-white text-[#384e40] hover:border-[#183d36]"
                          }`}
                        >
                          {isSaved ? <BookmarkCheck size={14} className="text-amber-600" /> : <Bookmark size={14} />}
                          <span>{isSaved ? tx("Saved", "Đã lưu") : tx("Bookmark", "Lưu kiến thức")}</span>
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            botanicalTab !== "saved" && (
              <div className="rounded-2xl border border-dashed border-[#cfc8b6] bg-white/80 p-8 text-center space-y-2">
                <Search size={32} className="mx-auto text-[#94a398]" />
                <h3 className="font-bold text-base text-[#244234]">
                  {tx("No matching botanical articles", "Không tìm thấy bài viết thảo mộc phù hợp")}
                </h3>
                <p className="text-xs text-[#627568] max-w-md mx-auto">
                  {tx(
                    "Try adjusting your search terms or clearing the evidence filter to explore more plants in the library.",
                    "Hãy thử thay đổi từ khóa tìm kiếm hoặc chọn 'Tất cả mức bằng chứng' để xem các loại thảo mộc khác."
                  )}
                </p>
                <button
                  type="button"
                  onClick={() => { setBotanicalQuery(""); setBotanicalEvidenceFilter("all"); }}
                  className="mt-2 text-xs font-bold text-emerald-800 underline"
                >
                  {tx("Reset filters", "Đặt lại bộ lọc")}
                </button>
              </div>
            )
          )}

          {/* Article Detail Modal */}
          <BotanicalArticleModal
            article={selectedBotanicalArticle}
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            isBookmarked={Boolean(selectedBotanicalArticle && botanicalBookmarks.includes(selectedBotanicalArticle.id))}
            onToggleBookmark={toggleBotanicalBookmark}
            bookmarkBusy={bookmarkBusy}
          />

        </div>
      ) : (
        /* ========================================================================= */
        /* WELLNESS SANCTUARY & ACTIVITY TRAIL (PRESERVED) */
        /* ========================================================================= */
        <>
          <label className="hc-encyclopedia-search">
            <Search size={16}/>
            <span className="sr-only">Search this station</span>
            <input value={query} onChange={event => setQuery(event.target.value)} placeholder={`Search ${copy.title.toLowerCase()}`}/>
          </label>
          <label className="hc-encyclopedia-category">
            Category 
            <select value={category} onChange={event => setCategory(event.target.value)}>
              <option value="all">All categories</option>
              {categories.map(value => <option key={value} value={value}>{value.replaceAll("_", " ")}</option>)}
            </select>
          </label>
          {error && <p role="alert" className="hc-care-error">{error}</p>}
          
          <details className="mt-4 rounded-2xl border border-[#dfe4d8] bg-white p-4 text-sm">
            <summary className="cursor-pointer font-extrabold text-emerald-950">Ask the {copy.npc}</summary>
            <p className="mt-2 text-xs text-[#657469]">Questions use retrieved reviewed HealthClues material. AI is optional and may be unavailable.</p>
            <label className="mt-3 block text-xs font-bold">Ask a short question
              <input className="mt-1 min-h-10 w-full rounded-lg border border-[#d4dacd] px-3 text-sm" value={question} maxLength={500} onChange={event => setQuestion(event.target.value)} placeholder="What does the available research say?"/>
            </label>
            <label className="hc-care-ack mt-3">
              <input type="checkbox" checked={providerConsent} onChange={event => setProviderConsent(event.target.checked)}/> 
              If AI is configured, I consent to sending this question and retrieved public educational excerpts to the provider. My profile and private records are excluded.
            </label>
            <button className="mt-3 min-h-10 rounded-lg bg-[#183d36] px-4 font-bold text-white disabled:opacity-50" type="button" disabled={!accessToken || busy || question.trim().length < 2} onClick={() => void askNpc()}>{busy ? "Asking…" : "Ask"}</button>
            {chatAnswer && <div role="status" className="mt-3 rounded-lg bg-[#f1f5ed] p-3"><p>{chatAnswer}</p>{chatSources.length > 0 && <small>Retrieved sources: {chatSources.join(", ")}</small>}</div>}
          </details>

          {visible.length ? (
            <div className="hc-encyclopedia-list">
              {visible.map(item => { 
                const ItemIcon = iconFor(item); 
                return (
                  <article key={`${item.id}:${item.version}`} className="hc-encyclopedia-entry">
                    <span className="hc-tool-icon"><ItemIcon size={17}/></span>
                    <div className="hc-encyclopedia-entry-copy">
                      <strong>{item.name}</strong>
                      <small>{item.category || item.kind.replaceAll("_", " ")} · {item.demoOnly ? "TEST ONLY · NOT HUMAN-REVIEWED" : "Reviewed publication"} · Evidence: {item.evidenceClass.replaceAll("_", " ")}</small>
                      <p>{item.description}</p>
                    </div>
                    <button type="button" onClick={() => { setSelectedId(item.id); setView("preview"); }}>Read details</button>
                  </article>
                ); 
              })}
            </div>
          ) : (
            <div className="hc-backpack-empty">
              <BookOpen size={21}/>
              <strong>{error ? "The catalog could not be loaded." : "No matching reviewed entries are available here yet."}</strong>
              <p>HealthClues will not substitute unrelated material or invent a recommendation. You can continue exploring, or add a private record at Adventure Camp.</p>
            </div>
          )}

          {listed.length > 5 && (
            <button type="button" className="hc-encyclopedia-more" onClick={() => setShowAll(value => !value)}>
              {showAll ? "Show fewer" : `Explore more (${listed.length})`}
            </button>
          )}

          {/* Practice/Movement Detail */}
          {view !== "list" && selectedPractice && (
            <div className="hc-encyclopedia-detail">
              <button type="button" className="hc-backpack-back" onClick={() => setView(view === "details" ? "preview" : "list")}>
                <ArrowLeft size={15}/> {view === "details" ? "Back to preview" : "Back to entries"}
              </button>
              <h3>{selectedPractice.name}</h3>
              <p>{selectedPractice.description}</p>
              <p className="hc-encyclopedia-separation">
                <strong>Publication:</strong> {selectedPractice.demoOnly ? "TEST ONLY fixture; not human-reviewed and not HealthClues guidance." : "Current editorially reviewed Catalog version."} 
                <strong> Evidence:</strong> {selectedPractice.evidenceClass.replaceAll("_", " ")}{selectedPractice.evidenceSummary ? ` — ${selectedPractice.evidenceSummary}` : ". No further summary is available."}
              </p>
              {selectedPractice.safetyNotes && <p className="hc-tool-safety"><ShieldAlert size={15}/> {selectedPractice.safetyNotes}</p>}
              {view === "details" && (
                <>
                  <section>
                    <h4>Details</h4>
                    <p>{selectedPractice.usageMethods?.length ? selectedPractice.usageMethods.map(method => `${method.name}: ${method.instructions.map(instructionText).join("; ")}`).join("\n") : "No reviewed use instructions are attached."}</p>
                  </section>
                  <section>
                    <h4>References</h4>
                    {selectedPractice.evidenceSources?.map((value, index) => <div key={index}>{sourceLink(value)}</div>)}
                  </section>
                </>
              )}
              <div className="hc-encyclopedia-actions">
                <button type="button" onClick={() => setView(view === "preview" ? "details" : "preview")}>
                  {view === "preview" ? "View full details" : "Back to preview"}
                </button>
                <button type="button" disabled={!accessToken || busy || savedIds.includes(selectedPractice.id)} onClick={() => void saveToCollection()}>
                  {savedIds.includes(selectedPractice.id) ? "In My Collection" : "Save to Collection"}
                </button>
                {eligibleIds.includes(selectedPractice.id) && (
                  <button type="button" onClick={() => setShowEquipChoices(value => !value)}>
                    Equip to Backpack
                  </button>
                )}
              </div>
              {showEquipChoices && (
                <div className="hc-backpack-equip-choice">
                  <label>Choose a Backpack slot
                    <select value={equipmentPosition} onChange={event => { const position = Number(event.target.value); setEquipmentPosition(position); setReplaceEntryId(occupiedPosition(position)?.id || ""); }}>
                      {[1, 2, 3].map(position => <option key={position} value={position}>Slot {position}</option>)}
                    </select>
                  </label>
                  <button type="button" disabled={!accessToken || busy || Boolean(occupiedPosition(equipmentPosition) && !replaceEntryId)} onClick={() => void equip()}>
                    Confirm Equip
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {notice && station !== "nutrition" && <p role="status" className="hc-care-success">{notice}</p>}
    </section>
  );
}

function topicTagMatches(tag: string, topic: string) {
  const normalize = (value: string) => value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, " ").trim().split(/\s+/).filter(word => word.length > 2);
  const topicWords = new Set(normalize(topic).filter(word => !["your", "goal", "interest", "wellness", "journey", "explore", "health", "and", "the"].includes(word)));
  return normalize(tag).some(word => topicWords.has(word));
}

function itemCategoryMatches(item: CatalogItem, station: Station) {
  if (station === "nutrition") return item.slot === "consume" || /herb|food|nutrition|botanical|drink/i.test(`${item.kind} ${item.slug}`);
  if (station === "movement") return /movement|activity|walk|mobility/i.test(`${item.kind} ${item.slug}`) || (item.slot === "practice" && /move|activity/i.test(item.name));
  return item.slot === "reduce" || /relax|wellness|habit|breath|mind/i.test(`${item.kind} ${item.slug}`);
}

function instructionText(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && !Array.isArray(value)) { const row = value as Record<string, unknown>; return [row.title,row.text,row.instruction,row.description].find((text): text is string => typeof text === "string") ?? "Reviewed detail unavailable."; }
  return "Reviewed detail unavailable.";
}

function sourceLink(value: unknown) {
  const row = typeof value === "string" ? { title: value, url: value } : value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
  const title = [row.title, row.citation, row.name].find((text): text is string => typeof text === "string") || "Reference";
  const url = typeof row.url === "string" && /^https:\/\//i.test(row.url) ? row.url : null;
  return url ? <a href={url} target="_blank" rel="noreferrer">{title} <ExternalLink size={13}/></a> : <span>{title} (no link attached)</span>;
}
