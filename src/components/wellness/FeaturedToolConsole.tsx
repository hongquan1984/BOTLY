"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Search, Sparkles, ShieldCheck, AlertCircle } from "lucide-react";
import type { Portal } from "@/data/wellness-portals";
import { articlePath } from "@/lib/article-publishing";

type RemedyPreset = {
  label: string;
  query: string;
  verdict: string;
  score: string;
  slug: string;
  status: "verified" | "caution" | "myth";
};

export function FeaturedToolConsole({
  portal,
  locale,
}: {
  portal: Portal;
  locale: "vi" | "en";
}) {
  const vi = locale === "vi";

  const presets: RemedyPreset[] = vi
    ? [
        {
          label: "🍍 Dứa & gan nhiễm mỡ?",
          query: "Nước ép dứa và dưa leo có làm tan mỡ gan không?",
          verdict: "Bromelain hỗ trợ kháng viêm, nhưng không có tác dụng tan mỡ gan cơ học. Cần cẩn trọng lượng đường Fructose.",
          score: "Trust: 7.8 / 10",
          slug: "nuoc-ep-dua-dua-leo-va-tuyen-bo-gan-nhiem-mo",
          status: "caution",
        },
        {
          label: "🍋 Baking soda trắng răng?",
          query: "Baking soda và nước chanh có tẩy trắng răng và khử hôi miệng không?",
          verdict: "Tạo môi trường kiềm đệm pH tạm thời, nhưng tính mài mòn kết hợp acid citric dễ làm mòn men răng vĩnh viễn.",
          score: "Trust: 5.2 / 10",
          slug: "baking-soda-chanh-hoi-mieng-men-rang",
          status: "caution",
        },
        {
          label: "🫚 Ngâm chân gừng ngủ sâu?",
          query: "Ngâm chân nước gừng chanh ấm có giúp dễ ngủ và sâu giấc hơn?",
          verdict: "Kích hoạt thụ thể nhiệt TRPV1 làm giãn mạch ngoại biên, giúp hạ nhiệt độ lõi cơ thể để khởi động nhịp ngủ NREM.",
          score: "Trust: 8.8 / 10",
          slug: "ngam-chan-gung-chanh-giac-ngu-tuan-hoan",
          status: "verified",
        },
        {
          label: "🌱 Dưa leo & hạt chia?",
          query: "Dưa leo bạc hà và hạt chia có thanh lọc ruột không?",
          verdict: "Cơ chế gel Mucilage hút nước làm mềm phân, tạo môi trường thuận lợi cho lợi khuẩn ruột già phát triển.",
          score: "Trust: 9.4 / 10",
          slug: "nuoc-dua-leo-bac-ha-chia-detox-ruot",
          status: "verified",
        },
      ]
    : [
        {
          label: "🍍 Pineapple & fatty liver?",
          query: "Can pineapple & cucumber juice cleanse a fatty liver?",
          verdict: "Bromelain provides cellular anti-inflammatory support, but does NOT mechanically melt liver fat. Mind pure fructose intake.",
          score: "Trust: 7.8 / 10",
          slug: "pineapple-cucumber-juice-fatty-liver-claims",
          status: "caution",
        },
        {
          label: "🍋 Baking soda for enamel?",
          query: "Does baking soda & lemon rinse whiten teeth and cure bad breath?",
          verdict: "Buffers oral pH temporarily, but repeated abrasive scrubbing with citric acid risks irreversible enamel demineralization.",
          score: "Trust: 5.2 / 10",
          slug: "baking-soda-lemon-oral-ph-enamel-safety",
          status: "caution",
        },
        {
          label: "🫚 Warm ginger foot soak?",
          query: "Will a warm ginger and lemon foot bath induce faster deep sleep?",
          verdict: "TRPV1 receptor heat activation triggers peripheral vasodilation, dropping core temperature to facilitate NREM onset.",
          score: "Trust: 8.8 / 10",
          slug: "warm-ginger-lemon-foot-soak-sleep-circulation",
          status: "verified",
        },
        {
          label: "🌱 Cucumber & chia gut detox?",
          query: "Does cucumber mint chia water detoxify the colon?",
          verdict: "Soluble mucilage hydrogel retains water, lubricating transit and promoting a healthy mucosal microbiome barrier.",
          score: "Trust: 9.4 / 10",
          slug: "cucumber-mint-chia-hydration-gut-detox",
          status: "verified",
        },
      ];

  const [activePreset, setActivePreset] = useState<RemedyPreset>(presets[0]);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-[#dce6dc] bg-gradient-to-br from-white via-[#f8faf6] to-[#eef4eb] p-6 sm:p-8 shadow-sm">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left: Tool Info & Launch Button */}
        <div className="lg:col-span-5 space-y-4 text-left">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#18302b] text-emerald-400 shadow-md">
            <Sparkles className="h-6 w-6" />
          </div>

          <span className="block text-[11px] font-extrabold uppercase tracking-widest text-emerald-800">
            {vi ? "CÔNG CỤ NỔI BẬT · MIỄN PHÍ" : "FEATURED TOOL · FREE"}
          </span>

          <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#18302b]">
            {portal.featuredTool.title}
          </h3>

          <p className="text-sm leading-relaxed text-[#4e665d]">
            {portal.featuredTool.description}
          </p>

          <div className="pt-2">
            <Link
              href={portal.featuredTool.href}
              className="inline-flex items-center gap-2 rounded-full bg-[#18302b] px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-emerald-900 transition-all hover:-translate-y-0.5"
            >
              <span>{vi ? "Mở công cụ đầy đủ" : "Launch full tool"}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Right: Live Interactive Remedy Console */}
        <div className="lg:col-span-7">
          <div className="rounded-2xl border border-white/80 bg-white/95 p-5 shadow-xl shadow-emerald-950/5 backdrop-blur-md">
            {/* Search Input Simulation */}
            <div className="relative flex items-center">
              <Search className="absolute left-3.5 h-4 w-4 text-[#738b7e]" />
              <input
                type="text"
                readOnly
                value={activePreset.query}
                className="w-full rounded-xl border border-[#d8e4d8] bg-[#f7faf5] py-2.5 pl-10 pr-4 text-xs font-semibold text-[#18302b] shadow-inner focus:outline-none"
              />
            </div>

            {/* Clickable Preset Chips */}
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#6a8276] mr-1">
                {vi ? "Bấm thử:" : "Try:"}
              </span>
              {presets.map(p => (
                <button
                  key={p.label}
                  onClick={() => setActivePreset(p)}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all ${
                    activePreset.label === p.label
                      ? "bg-[#18302b] text-white shadow-sm scale-[1.02]"
                      : "border border-[#d0ded0] bg-white text-[#18302b] hover:border-emerald-500 hover:bg-emerald-50/50"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Scientific Verdict Box */}
            <div className="mt-4 rounded-xl border border-emerald-100 bg-[#f4f8f2] p-4 text-left">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <span>{vi ? "Kết Luận Kiểm Chứng Y Sinh" : "Biomedical Scientific Verdict"}</span>
                </div>
                <span className="rounded-full bg-emerald-700 px-2.5 py-0.5 text-[10px] font-extrabold text-white">
                  {activePreset.score}
                </span>
              </div>

              <p className="mt-2 text-xs leading-relaxed text-[#354e44]">
                {activePreset.verdict}
              </p>

              <div className="mt-3 pt-2.5 border-t border-[#e2ece0] flex items-center justify-between">
                <span className="text-[10px] text-[#637d71] font-semibold">
                  {vi ? "Kiểm tra cơ chế phân tử & thử nghiệm RCTs" : "Explore molecular mechanisms & RCTs"}
                </span>
                <Link
                  href={articlePath(locale, activePreset.slug)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 hover:text-emerald-950 hover:underline"
                >
                  <span>{vi ? "Xem bài nghiên cứu" : "Read study"}</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
