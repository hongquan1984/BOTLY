"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ICON_CATALOG, type WellnessCategory, type IconMetadata, VALID_AI_HABIT_ICON_KEYS, toAiHabitIconKey } from "@/components/healthclues/gameIconRegistry";
import { resolveWellnessIcon, type ResolvedWellnessIcon } from "@/components/healthclues/wellnessIconResolver";
import { HealthCluesGameIcon, type IconTone } from "@/components/healthclues/HealthCluesGameIcon";

const CATEGORIES: Array<"All" | WellnessCategory> = [
  "All",
  "Food & Nutrition",
  "Herbs & Plants",
  "Physical Activities",
  "Yoga & Stretching",
  "Meditation & Breathing",
  "Sleep & Relaxation",
  "Hydration",
  "Daily Habits",
  "Knowledge & Learning",
  "Quests & Achievements",
  "World & Navigation",
];

const QUICK_EXAMPLES = [
  "Đi bộ nhẹ mỗi ngày",
  "Tập yoga trước khi ngủ",
  "Uống đủ 2 lít nước",
  "Giảm tiêu thụ thịt đỏ",
  "Ăn thêm rau xanh",
  "Thiền trước khi ngủ",
  "Trà hoa cúc",
  "Ăn cá hồi giàu omega 3",
  "Hít thở 4-7-8 khi căng thẳng",
  "Tắm nắng sáng 15 phút",
  "Tắt điện thoại trước khi ngủ",
  "Giảm lượng muối",
];

// Icons directly embedded into key game scenes & components
const IN_USE_KEYS = new Set([
  "nav:compass", "nav:map", "nav:camp", "nav:zoom-in", "nav:zoom-out",
  "trail:sleep", "trail:calm", "trail:energy", "trail:nutrition", "trail:movement", "trail:weight", "trail:natural", "trail:health",
  "quest:scroll", "quest:checklist", "quest:bookmark", "quest:quill", "quest:check", "quest:star",
  "inv:backpack", "inv:herbs", "inv:food", "inv:apple", "inv:water", "inv:movement", "inv:lotus", "inv:book", "inv:chest",
  "know:detective", "know:garden", "know:movement", "know:mind", "know:gamepad",
  "boss:swords", "boss:key", "boss:shield", "achieve:trophy", "achieve:sparkles",
  "food:fish", "food:red-meat", "food:vegetables", "food:hot-meal",
  "herbs:chamomile", "herbs:bundle", "physical:walking", "physical:running", "physical:exercise",
  "yoga:lotus", "meditation:breathing", "meditation:mindfulness", "sleep:moon-stars",
  "hydration:glass", "habits:sunlight", "habits:screen-off", "habits:checklist",
]);

export default function HealthCluesIconGalleryPage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"All" | WellnessCategory>("All");
  const [selectedTone, setSelectedTone] = useState<IconTone>("gold");
  const [simText, setSimText] = useState("Đi bộ nhẹ mỗi ngày");
  const [selectedLicense, setSelectedLicense] = useState<string>("All");

  const simulationResult = useMemo<ResolvedWellnessIcon>(() => {
    return resolveWellnessIcon({ title: simText, text: simText });
  }, [simText]);

  const filteredIcons = useMemo(() => {
    const q = search.trim().toLowerCase();
    return ICON_CATALOG.filter((item) => {
      // Category filter
      if (selectedCategory !== "All" && item.category !== selectedCategory) return false;
      // License filter
      if (selectedLicense !== "All" && item.license !== selectedLicense) return false;
      // Search query filter
      if (!q) return true;
      const haystack = `${item.key} ${item.label} ${item.category} ${item.source} ${item.license} ${item.tags.join(" ")}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [search, selectedCategory, selectedLicense]);

  const stats = useMemo(() => {
    const total = ICON_CATALOG.length;
    const inUse = ICON_CATALOG.filter((i) => IN_USE_KEYS.has(i.key)).length;
    const aiKeysCount = VALID_AI_HABIT_ICON_KEYS.length;
    const cc0 = ICON_CATALOG.filter((i) => i.license === "CC0").length;
    const mit = ICON_CATALOG.filter((i) => i.license === "MIT").length;
    const ccby = ICON_CATALOG.filter((i) => i.license.includes("CC BY")).length;
    return { total, inUse, aiKeysCount, cc0, mit, ccby };
  }, []);

  return (
    <main data-icon-gallery-page className="min-h-screen bg-[#f7f5ed] px-4 py-8 text-[#1b3832] sm:px-8">
      {/* Header */}
      <header className="mx-auto max-w-7xl border-b border-[#dfd8c2] pb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-emerald-800 px-2.5 py-0.5 text-xs font-black uppercase tracking-wider text-amber-200">
                Internal Only
              </span>
              <span className="text-xs font-semibold text-[#6d7c74]">Owner Asset Studio</span>
            </div>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-[#14332c] sm:text-4xl">
              HealthClues Game & Wellness Icon Library
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#596b61]">
              Hệ thống tra cứu, kiểm tra bản quyền và mô phỏng ánh xạ AI ngữ nghĩa cho toàn bộ icon game & hoạt động chăm sóc sức khỏe. Không công khai cho người chơi.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/play"
              className="inline-flex items-center gap-2 rounded-xl border border-[#c4beab] bg-white px-4 py-2.5 text-xs font-bold text-[#1a3831] shadow-sm hover:bg-[#faf8f2]"
            >
              <span>🎮 Quay lại Game</span>
            </Link>
          </div>
        </div>

        {/* Stats Summary Bar */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-6">
          <div className="rounded-xl border border-[#ddd6c0] bg-white p-3.5 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-[#697a70]">Tổng số Icons</span>
            <p className="mt-1 text-2xl font-black text-emerald-950">{stats.total}</p>
            <span className="text-[11px] text-[#78887e]">10 Nhóm sức khỏe</span>
          </div>
          <div className="rounded-xl border border-[#ddd6c0] bg-white p-3.5 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">Đang hoạt động</span>
            <p className="mt-1 text-2xl font-black text-emerald-800">{stats.inUse}</p>
            <span className="text-[11px] text-emerald-700">Tích hợp trực tiếp</span>
          </div>
          <div className="rounded-xl border border-[#ddd6c0] bg-white p-3.5 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-800">Gemini AI Keys</span>
            <p className="mt-1 text-2xl font-black text-sky-800">{stats.aiKeysCount}</p>
            <span className="text-[11px] text-sky-700">Dot-notation keys</span>
          </div>
          <div className="rounded-xl border border-[#ddd6c0] bg-white p-3.5 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-[#697a70]">CC0 Public Domain</span>
            <p className="mt-1 text-2xl font-black text-emerald-950">{stats.cc0}</p>
            <span className="text-[11px] text-[#78887e]">HealthIcons / OpenCrop / Nieobie</span>
          </div>
          <div className="rounded-xl border border-[#ddd6c0] bg-white p-3.5 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-[#697a70]">MIT Open Source</span>
            <p className="mt-1 text-2xl font-black text-emerald-950">{stats.mit}</p>
            <span className="text-[11px] text-[#78887e]">Tabler Icons</span>
          </div>
          <div className="rounded-xl border border-[#ddd6c0] bg-white p-3.5 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-[#697a70]">CC BY 3.0</span>
            <p className="mt-1 text-2xl font-black text-emerald-950">{stats.ccby}</p>
            <span className="text-[11px] text-[#78887e]">Game-icons.net</span>
          </div>
        </div>
      </header>

      {/* AI Semantic Resolver Simulator Section */}
      <section className="mx-auto mt-8 max-w-7xl rounded-2xl border-2 border-[#d9ccab] bg-[#fffdf7] p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#ebdcc1] pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🤖</span>
            <h2 className="text-lg font-black text-[#15342d]">
              Mô phỏng Ánh xạ AI Ngữ nghĩa (Live Semantic AI Resolver)
            </h2>
          </div>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-extrabold text-amber-900">
            Real-time Parser
          </span>
        </div>

        <p className="mt-2 text-xs leading-relaxed text-[#5f7065]">
          Nhập bất kỳ câu gợi ý nào do AI tạo ra (tiếng Việt hoặc tiếng Anh). Hệ thống tự động phân tích hành động, vị ngữ, danh từ và đối chiếu từ điển ngữ nghĩa để chọn icon chính xác nhất, hoặc an toàn chuyển về nhóm trung tính mà không gây lỗi giao diện.
        </p>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_320px]">
          <div>
            <label htmlFor="ai-sim-input" className="block text-xs font-extrabold text-[#3d5045]">
              Nội dung gợi ý / Mục tiêu AI tạo ra:
            </label>
            <input
              id="ai-sim-input"
              data-resolver-input
              type="text"
              value={simText}
              onChange={(e) => setSimText(e.target.value)}
              placeholder="VD: Đi bộ nhẹ mỗi ngày, Ăn cá hồi, Tập yoga, Uống đủ nước..."
              className="hc-gallery-sim-input mt-1.5 min-h-12 w-full rounded-xl border border-[#cfc8b4] bg-white px-4 text-sm font-semibold text-[#183932] shadow-xs focus:border-emerald-700 focus:outline-none"
            />

            {/* Quick test phrases */}
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold text-[#718277]">Thử nhanh:</span>
              {QUICK_EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => setSimText(ex)}
                  className="rounded-lg border border-[#ded8c4] bg-white px-2.5 py-1 text-[11px] font-medium text-[#2d4c44] hover:bg-[#f3eedc]"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>

          {/* Simulation Output Card */}
          <div className="hc-gallery-sim-card rounded-xl border border-[#d6cbb0] bg-white p-4 shadow-xs">
            <span className="text-[11px] font-black uppercase tracking-wider text-[#7a8b80]">Kết quả phân giải AI</span>
            <div className="mt-3 flex items-center gap-3.5">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-[#dfd6be] bg-[#fbf9f2]">
                <HealthCluesGameIcon icon={simulationResult.key} size={30} tone="emerald" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-black text-[#13302a]">{simulationResult.label}</p>
                <code className="text-xs font-bold text-emerald-800">{simulationResult.key}</code>
                {simulationResult.aiHabitKey && (
                  <p className="mt-0.5 truncate text-[11px] font-mono font-bold text-sky-800">
                    AI Key: {simulationResult.aiHabitKey}
                  </p>
                )}
                <div className="mt-1 flex flex-wrap gap-1">
                  <span className="rounded-md bg-[#edf5e7] px-1.5 py-0.5 text-[10px] font-bold text-emerald-900">
                    {simulationResult.category}
                  </span>
                  <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-900">
                    Khớp: {simulationResult.matchedBy}
                  </span>
                  {simulationResult.aiHabitKey && VALID_AI_HABIT_ICON_KEYS.includes(simulationResult.aiHabitKey as any) && (
                    <span className="rounded-md bg-sky-100 px-1.5 py-0.5 text-[10px] font-bold text-sky-900">
                      ✓ Gemini Approved Key
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filter and Control Bar */}
      <section className="mx-auto mt-8 max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#ddd5bf] bg-white p-4 shadow-xs">
          {/* Search box */}
          <div className="min-w-64 flex-1">
            <label htmlFor="icon-search" className="sr-only">
              Tìm kiếm icon
            </label>
            <input
              id="icon-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="🔍 Tìm kiếm theo tên, semantic key, từ khóa (VD: rau, cá, yoga, nước, đi bộ)..."
              className="min-h-11 w-full rounded-xl border border-[#d2cbba] bg-[#faf8f2] px-3.5 text-sm text-[#183932] placeholder-[#819287] focus:bg-white focus:outline-none"
            />
          </div>

          {/* Tone Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#64746a]">Đổi màu tone:</span>
            {(["gold", "emerald", "amber", "lavender", "sky", "crimson"] as IconTone[]).map((tone) => (
              <button
                key={tone}
                type="button"
                onClick={() => setSelectedTone(tone)}
                className={`h-7 w-7 rounded-full border-2 transition-transform ${
                  selectedTone === tone ? "scale-115 border-black shadow-sm" : "border-white"
                }`}
                style={{
                  backgroundColor:
                    tone === "gold"
                      ? "#cca65b"
                      : tone === "emerald"
                      ? "#2e8b57"
                      : tone === "amber"
                      ? "#e6a13c"
                      : tone === "lavender"
                      ? "#8a6cb5"
                      : tone === "sky"
                      ? "#5bc0de"
                      : "#d9534f",
                }}
                title={`Tone ${tone}`}
                aria-label={`Tone ${tone}`}
              />
            ))}
          </div>

          {/* License Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#64746a]">Giấy phép:</span>
            <select
              value={selectedLicense}
              onChange={(e) => setSelectedLicense(e.target.value)}
              className="min-h-9 rounded-lg border border-[#cfc7b4] bg-[#faf8f2] px-2.5 text-xs font-semibold text-[#1a3831]"
            >
              <option value="All">Tất cả giấy phép</option>
              <option value="CC0">CC0 (Public Domain)</option>
              <option value="MIT">MIT License</option>
              <option value="CC BY 3.0">CC BY 3.0</option>
            </select>
          </div>
        </div>

        {/* Category Tabs */}
        <div data-category-tabs className="hc-gallery-tabs mt-4 flex flex-wrap gap-1.5 overflow-x-auto pb-1">
          {CATEGORIES.map((cat) => {
            const count = cat === "All" ? ICON_CATALOG.length : ICON_CATALOG.filter((i) => i.category === cat).length;
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-colors ${
                  active
                    ? "bg-[#183d36] text-amber-200 shadow-xs"
                    : "border border-[#ded6c0] bg-white text-[#38534c] hover:bg-[#f4efe0]"
                }`}
              >
                <span>{cat}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                    active ? "bg-[#255249] text-amber-100" : "bg-[#ede7d6] text-[#55695e]"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Icons Grid */}
      <section className="mx-auto mt-6 max-w-7xl">
        <div className="mb-3 flex items-center justify-between text-xs font-semibold text-[#66776e]">
          <span>Hiển thị {filteredIcons.length} icon</span>
          {search && (
            <button type="button" onClick={() => setSearch("")} className="text-emerald-800 underline">
              Xóa bộ lọc tìm kiếm
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filteredIcons.map((item) => {
            const inUse = IN_USE_KEYS.has(item.key);
            return (
              <article
                key={item.key}
                data-icon-card={item.key}
                className="group relative flex flex-col justify-between rounded-2xl border border-[#ded5be] bg-white p-4 shadow-2xs transition-all hover:-translate-y-0.5 hover:border-[#b8aa89] hover:shadow-md"
              >
                <div>
                  {/* Status Badges */}
                  <div className="flex items-center justify-between gap-1 text-[10px]">
                    <span
                      className={`rounded-md px-1.5 py-0.5 font-bold ${
                        inUse ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"
                      }`}
                    >
                      {inUse ? "✓ In-Game" : "AI Ready"}
                    </span>
                    <span className="rounded-md bg-[#ede8d8] px-1.5 py-0.5 font-semibold text-[#54685d]">
                      {item.license}
                    </span>
                  </div>

                  {/* Icon Rendering Frame */}
                  <div className="mt-3 flex h-20 items-center justify-center rounded-xl border border-[#ece4d0] bg-[#fbf9f4] transition-colors group-hover:bg-[#f6f2e6]">
                    <HealthCluesGameIcon icon={item.key} size={36} tone={selectedTone} />
                  </div>

                  {/* Details */}
                  <div className="mt-3">
                    <h3 className="text-sm font-extrabold text-[#15342d]">{item.label}</h3>
                    <code className="mt-0.5 block truncate text-xs font-bold text-emerald-900">{item.key}</code>
                    {toAiHabitIconKey(item.key) && (
                      <span className="mt-1 inline-block rounded bg-sky-50 px-1 py-0.5 text-[10px] font-mono font-bold text-sky-800">
                        {toAiHabitIconKey(item.key)}
                      </span>
                    )}
                    <p className="mt-1 text-[11px] font-medium text-[#73847b]">{item.category}</p>
                  </div>
                </div>

                {/* Footer tags */}
                <div className="mt-3 border-t border-[#f0ebd9] pt-2">
                  <div className="flex flex-wrap gap-1">
                    {item.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="rounded bg-[#f0ebd9] px-1 py-0.2 text-[9px] text-[#4d6156]">
                        {tag}
                      </span>
                    ))}
                    {item.tags.length > 3 && (
                      <span className="text-[9px] text-[#86958d]">+{item.tags.length - 3}</span>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {filteredIcons.length === 0 && (
          <div className="rounded-2xl border border-[#ded5be] bg-white p-12 text-center">
            <span className="text-3xl">🔍</span>
            <p className="mt-2 text-sm font-bold text-[#1a3831]">Không tìm thấy icon nào khớp với tìm kiếm</p>
            <p className="mt-1 text-xs text-[#6e8076]">Thử tìm với từ khóa khác như "cá", "rau", "bộ", "thảo mộc", "nước"</p>
          </div>
        )}
      </section>
    </main>
  );
}
