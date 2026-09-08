"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Sparkles, AlertTriangle } from "lucide-react";
import type { PortalId } from "@/data/wellness-portals";
import { articlePath } from "@/lib/article-publishing";

type HubItem = {
  id: string;
  name: string;
  compound: string;
  image: string;
  score: string;
  scoreVerdict: string;
  warning: string;
  dataCount: string;
  slug: string;
};

export function BiomedicalHeroHub({
  portalId,
  locale,
}: {
  portalId: PortalId;
  locale: "vi" | "en";
}) {
  const vi = locale === "vi";

  const dataByPortal: Record<PortalId, HubItem[]> = {
    "health-tips": [
      {
        id: "watermelon",
        name: vi ? "Dưa hấu & Sỏi thận" : "Watermelon & Kidney",
        compound: "L-Citrulline + Nitric Oxide",
        image: "/articles/watermelon-kidney/cover.jpg",
        score: "9.6 / 10",
        scoreVerdict: vi ? "Kiềm hóa nước tiểu, rửa trôi cặn" : "Urinary alkalization & flushing",
        warning: vi ? "< 350ml/ngày · Cẩn trọng Fructose" : "< 350ml/day · Mind Fructose",
        dataCount: vi ? "24 thử nghiệm lâm sàng (RCTs)" : "24 Clinical Trials (RCTs)",
        slug: vi ? "nuoc-dua-hau-citrulline-loc-than" : "watermelon-seed-citrulline-kidney-cleanse",
      },
      {
        id: "baking_soda",
        name: vi ? "Baking Soda & Men răng" : "Baking Soda & Enamel",
        compound: "Sodium Bicarbonate · Oral pH",
        image: "/articles/baking-soda-lemon/cover.jpg",
        score: "5.2 / 10",
        scoreVerdict: vi ? "Khử mùi tạm thời, cảnh báo mòn men" : "Odour buffer, enamel erosion alert",
        warning: vi ? "Tối đa 1 lần/tuần · pH quá kiềm" : "Max 1x/week · Excessive alkalinity",
        dataCount: vi ? "12 nghiên cứu nha khoa" : "12 Dental Clinical Studies",
        slug: vi ? "baking-soda-chanh-hoi-mieng-men-rang" : "baking-soda-lemon-oral-ph-enamel-safety",
      },
      {
        id: "ginger_lemon",
        name: vi ? "Ngâm chân Gừng Chanh" : "Ginger Lemon Foot Bath",
        compound: "Gingerol + TRPV1 Vasodilation",
        image: "/articles/ginger-lemon-footsoak/cover.jpg",
        score: "8.8 / 10",
        scoreVerdict: vi ? "Hạ nhiệt độ lõi, kích hoạt ngủ sâu" : "Core cooling & deep NREM sleep",
        warning: vi ? "Nhiệt độ 40–42°C · 15–20 phút" : "Temp 40–42°C · 15–20 mins",
        dataCount: vi ? "16 thử nghiệm sinh lý học" : "16 Physiological Studies",
        slug: vi ? "ngam-chan-gung-chanh-giac-ngu-tuan-hoan" : "warm-ginger-lemon-foot-soak-sleep-circulation",
      },
    ],
    weight: [
      {
        id: "cucumber_chia",
        name: vi ? "Dưa leo & Hạt chia" : "Cucumber & Chia",
        compound: "Mucilage Hydrogels + Hydration",
        image: "/articles/cucumber-mint-chia/cover.jpg",
        score: "9.4 / 10",
        scoreVerdict: vi ? "Thủy hóa tế bào & tạo cảm giác no" : "Cellular hydration & satiety index",
        warning: vi ? "Uống kèm 300–500ml nước lọc" : "Pair with 300–500ml water",
        dataCount: vi ? "18 thử nghiệm dinh dưỡng" : "18 Nutritional Trials",
        slug: vi ? "nuoc-dua-leo-bac-ha-chia-detox-ruot" : "cucumber-mint-chia-hydration-gut-detox",
      },
      {
        id: "pineapple_liver",
        name: vi ? "Dứa & Gan nhiễm mỡ" : "Pineapple & Liver",
        compound: "Bromelain Protease + Hepatic Lipid",
        image: "/articles/pineapple-cucumber-liver/cover.jpg",
        score: "7.8 / 10",
        scoreVerdict: vi ? "Kháng viêm tế bào, không làm tan mỡ" : "Anti-inflammatory, no magic detox",
        warning: vi ? "Không ép bỏ bã · Hạn chế Fructose" : "Keep whole pulp · Watch Fructose",
        dataCount: vi ? "21 nghiên cứu chuyển hóa" : "21 Metabolic Studies",
        slug: vi ? "nuoc-ep-dua-dua-leo-va-tuyen-bo-gan-nhiem-mo" : "pineapple-cucumber-juice-fatty-liver-claims",
      },
      {
        id: "beetroot_apple",
        name: vi ? "Củ dền & Táo đỏ" : "Beetroot & Apple",
        compound: "Nitrate-Nitric Oxide Cascade",
        image: "/articles/beetroot-apple/cover.jpg",
        score: "9.7 / 10",
        scoreVerdict: vi ? "Giãn mạch sinh lý, hạ áp tâm thu" : "Endothelial vasodilation & stamina",
        warning: vi ? "Thận trọng nếu có tiền sử oxalat" : "Caution with oxalate history",
        dataCount: vi ? "32 thử nghiệm tim mạch" : "32 Cardiovascular Studies",
        slug: vi ? "nuoc-cu-den-nitric-oxide-ha-huyet-ap" : "beetroot-apple-juice-nitric-oxide-cardiovascular",
      },
    ],
    healing: [
      {
        id: "chamomile",
        name: vi ? "Hoa cúc & Quế chi" : "Chamomile & Cinnamon",
        compound: "Apigenin GABA-A Agonist",
        image: "/articles/chamomile-cinnamon/cover.jpg",
        score: "9.5 / 10",
        scoreVerdict: vi ? "Kích hoạt thụ thể GABA-A ngủ sâu" : "Apigenin GABA-A sleep induction",
        warning: vi ? "Uống trước khi ngủ 30–45 phút" : "Drink 30–45m before bed",
        dataCount: vi ? "28 thử nghiệm lâm sàng" : "28 Clinical Studies",
        slug: vi ? "tra-hoa-cuc-que-chi-giac-ngu-duong-huyet" : "chamomile-cinnamon-tea-gaba-sleep-glucose",
      },
      {
        id: "ginger_clove",
        name: vi ? "Gừng & Đinh hương" : "Ginger & Clove",
        compound: "Gingerol + Eugenol Antispasmodic",
        image: "/articles/ginger-clove-tea/cover.jpg",
        score: "9.1 / 10",
        scoreVerdict: vi ? "Giảm co thắt cơ trơn & xẹp hơi" : "Smooth muscle spasm reduction",
        warning: vi ? "Không uống khi dạ dày rỗng quá mức" : "Avoid on severely empty stomach",
        dataCount: vi ? "15 nghiên cứu tiêu hóa" : "15 GI Tract Studies",
        slug: vi ? "tra-gung-dinh-huong-tieu-hoa-day-hoi" : "ginger-clove-tea-digestive-spasm-bloating",
      },
      {
        id: "foot_soak",
        name: vi ? "Ngâm chân Gừng Chanh" : "Ginger Lemon Soak",
        compound: "Thermoregulatory Circadian Reset",
        image: "/articles/ginger-lemon-footsoak/cover.jpg",
        score: "8.8 / 10",
        scoreVerdict: vi ? "Hạ nhiệt độ lõi cơ thể chuẩn bị ngủ" : "Distal heat loss & sleep gate",
        warning: vi ? "Nhiệt độ 40–42°C · Lau khô chân" : "Water 40–42°C · Dry thoroughly",
        dataCount: vi ? "16 thử nghiệm giấc ngủ" : "16 Sleep Studies",
        slug: vi ? "ngam-chan-gung-chanh-giac-ngu-tuan-hoan" : "warm-ginger-lemon-foot-soak-sleep-circulation",
      },
    ],
  };

  const items = dataByPortal[portalId] || dataByPortal["health-tips"];
  const [selectedIndex, setSelectedIndex] = useState(0);
  const active = items[selectedIndex] || items[0];

  return (
    <div className="relative mx-auto w-full max-w-lg">
      {/* Glow Backdrop */}
      <div className="pointer-events-none absolute -inset-2 rounded-3xl bg-gradient-to-r from-emerald-500/20 via-teal-500/15 to-lime-500/20 blur-xl opacity-70" />

      {/* Main Glassmorphic Card */}
      <div className="relative overflow-hidden rounded-3xl border border-white/80 bg-white/90 p-5 sm:p-6 shadow-2xl shadow-emerald-950/10 backdrop-blur-xl">
        {/* Terminal Header */}
        <div className="flex items-center justify-between border-b border-[#e2ede2] pb-3 text-xs">
          <div className="flex items-center gap-2 font-mono font-bold tracking-wider text-emerald-950">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-600" />
            </span>
            <span>BOTLY LABS · EVIDENCE HUB</span>
          </div>
          <span className="rounded-full bg-emerald-100/80 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-emerald-900">
            {vi ? "Dữ liệu thực" : "Live Metrics"}
          </span>
        </div>

        {/* 3D Simulation Cutaway Display */}
        <div className="group relative mt-4 aspect-[16/10] w-full overflow-hidden rounded-2xl bg-[#18302b] shadow-inner">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={active.image}
            src={active.image}
            alt={active.name}
            className="h-full w-full object-cover transition-all duration-700 group-hover:scale-105"
            loading="lazy"
          />

          {/* Ambient Scrim */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

          {/* Top-Left Active Compound Badge */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-black/65 px-3 py-1 text-[11px] font-bold text-white backdrop-blur-md border border-white/20 shadow-md">
            <Sparkles className="h-3 w-3 text-emerald-400" />
            <span>{active.compound}</span>
          </div>

          {/* Center Subtle Radar Marker */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="relative">
              <div className="absolute -inset-2 h-10 w-10 animate-ping rounded-full bg-emerald-400/30" />
              <div className="flex h-7 w-7 items-center justify-center rounded-full border border-white/60 bg-white/30 text-xs font-bold text-white shadow-lg backdrop-blur-md">
                ✦
              </div>
            </div>
          </div>

          {/* Bottom Card Title & Evidence Row */}
          <div className="absolute inset-x-3 bottom-3 text-white">
            <h4 className="text-base font-bold leading-snug drop-shadow-sm line-clamp-1">
              {active.name}
            </h4>
            <div className="mt-1 flex items-center justify-between text-[11px] text-white/80">
              <span>{active.dataCount}</span>
              <span className="rounded-full bg-emerald-500/90 px-2 py-0.5 text-[10px] font-extrabold text-white backdrop-blur-sm">
                {vi ? "Kiểm chứng" : "Verified"}
              </span>
            </div>
          </div>
        </div>

        {/* Dual Metric Pill Row */}
        <div className="mt-3.5 grid grid-cols-2 gap-2.5">
          {/* Trust Meter Box */}
          <div className="rounded-2xl border border-emerald-100 bg-[#f3f8f1] p-3 text-left">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#547365]">
                {vi ? "Điểm Trust Meter" : "Trust Score"}
              </span>
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-700" />
            </div>
            <strong className="mt-0.5 block text-lg font-black text-emerald-950">
              {active.score}
            </strong>
            <p className="mt-0.5 text-[10px] leading-tight text-[#4e6a5c] line-clamp-1 font-medium">
              {active.scoreVerdict}
            </p>
          </div>

          {/* Safety & Warning Box */}
          <div className="rounded-2xl border border-amber-200/70 bg-[#fff9f0] p-3 text-left">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#996426]">
                {vi ? "Cảnh báo an toàn" : "Safety Alert"}
              </span>
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
            </div>
            <strong className="mt-0.5 block text-sm font-bold text-[#8a4f15] line-clamp-1">
              {active.warning.split("·")[0]}
            </strong>
            <p className="mt-0.5 text-[10px] leading-tight text-[#996426] line-clamp-1 font-medium">
              {active.warning.split("·")[1] || active.warning}
            </p>
          </div>
        </div>

        {/* Interactive Topic Selector Pills */}
        <div className="mt-3.5 border-t border-[#e2ede2] pt-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#698476]">
              {vi ? "Bấm kiểm tra mẹo khác:" : "Select to verify:"}
            </span>
            <Link
              href={articlePath(locale, active.slug)}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 hover:text-emerald-950 hover:underline"
            >
              <span>{vi ? "Đọc bài phân tích y sinh" : "Read biomedical report"}</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {items.map((item, index) => {
              const isSelected = index === selectedIndex;
              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedIndex(index)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                    isSelected
                      ? "bg-[#18302b] text-white shadow-md shadow-[#18302b]/15 scale-[1.02]"
                      : "border border-[#c8dbc8] bg-white text-[#18302b] hover:border-emerald-500 hover:bg-emerald-50/50"
                  }`}
                >
                  {item.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
