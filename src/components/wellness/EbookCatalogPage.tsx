"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock,
  Download,
  FileText,
  Filter,
  Microscope,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import type { WellnessLocale } from "@/data/wellness";
import { wellnessEbooks, type WellnessEbook } from "@/data/wellness-ebooks";
import { trackWellness } from "@/lib/wellness-analytics";
import { WellnessShell } from "./WellnessShell";
import { EbookLeadCapture } from "./EbookLeadCapture";

export function EbookCatalogPage({ locale }: { locale: WellnessLocale }) {
  const vi = locale === "vi";
  const base = vi ? "/vi/song-khoe" : "/en/wellness";
  const [activeFilter, setActiveFilter] = useState<string>("all");

  const filteredEbooks = wellnessEbooks.filter((b) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "available") return b.status === "available";
    if (activeFilter === "blood-sugar") return b.id === "blood-sugar";
    if (activeFilter === "antioxidants") return b.id === "antioxidants";
    if (activeFilter === "weight") return b.id === "weight-management";
    if (activeFilter === "sleep") return b.id === "better-sleep";
    if (activeFilter === "gout") return b.id === "gout-support";
    if (activeFilter === "liver") return b.id === "liver-health";
    return true;
  });

  return (
    <WellnessShell locale={locale}>
      <main className="bg-[#f7faf6] min-h-screen">
        {/* Top Breadcrumb */}
        <div className="mx-auto max-w-7xl px-5 pt-8 lg:px-8">
          <Link
            href={`${base}/health-tips`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#526b62] hover:text-[#18302b] transition"
          >
            <span>← {vi ? "Chuyên mục Mẹo Sức Khỏe (Health Tips)" : "Health Tips Portal"}</span>
          </Link>
        </div>

        {/* Hero Section & Topic-Based Ebook Hub */}
        <section className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-600/25 bg-emerald-50 px-3.5 py-1 text-xs font-extrabold uppercase tracking-wider text-emerald-900 shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-emerald-600 animate-pulse" />
              <span>HEALTHCLUES · TOPIC-BASED EVIDENCE EBOOKS</span>
            </div>

            <h1 className="mt-4 text-3xl font-black tracking-tight text-[#18302b] sm:text-5xl lg:text-[3.25rem] leading-[1.1]">
              {vi ? "Toàn Bộ Cẩm Nang Dinh Dưỡng Theo Chủ Đề" : "The Complete Topic-Based Evidence Handbooks"}
            </h1>

            <p className="mt-4 text-base sm:text-lg text-[#4e665d] leading-relaxed">
              {vi
                ? "Bộ cẩm nang y sinh định dạng PDF in ấn chuẩn quốc tế (100% English Evidence Edition) có thể tải về miễn phí. Được phân loại độc lập theo từng mục tiêu sức khỏe: Đường huyết, Chống oxy hóa, Cân nặng, Giấc ngủ, Axit Uric và Lá gan."
                : "Comprehensive clinical handbooks in high-resolution printable PDF format. Grounded strictly in human randomized crossover trials and categorized by clinical health goals: Blood Sugar, Antioxidants, Satiety, Sleep, Uric Acid, and Hepatic Longevity."}
            </p>

            {/* Quick Metrics */}
            <div className="mt-6 flex flex-wrap gap-5 text-xs font-bold text-[#526b62]">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 text-[11px]">✓</span>
                <span>{vi ? "6 Tập Cẩm Nang Theo Chủ Đề" : "6 Topic-Based Master Volumes"}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 text-[11px]">✓</span>
                <span>{vi ? "Đối chiếu thử nghiệm lâm sàng PubMed" : "PubMed Clinical RCTs"}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 text-[11px]">✓</span>
                <span>{vi ? "Tải miễn phí 1-Click PDF" : "Instant 1-Click PDF Download"}</span>
              </div>
            </div>
          </div>

          {/* Topic Filter Pills */}
          <div className="mt-10 flex flex-wrap items-center gap-2 pt-6 border-t border-[#d8e4d8]">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mr-2 flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5" />
              {vi ? "Chủ đề:" : "Health Goal:"}
            </span>
            {[
              { id: "all", labelEn: "All Topics (6 Volumes)", labelVi: "Tất cả chủ đề (6 Tập)" },
              { id: "blood-sugar", labelEn: "Blood Sugar (Vol.01)", labelVi: "Đường Huyết (Tập 1)" },
              { id: "antioxidants", labelEn: "Antioxidants (Vol.02)", labelVi: "Chống Oxy Hóa (Tập 2)" },
              { id: "weight", labelEn: "Satiety & Weight (Vol.03)", labelVi: "Cân Nặng & No Lâu (Tập 3)" },
              { id: "sleep", labelEn: "Sleep & Circadian (Vol.04)", labelVi: "Giấc Ngủ (Tập 4)" },
              { id: "gout", labelEn: "Uric Acid & Gout (Vol.05)", labelVi: "Axit Uric (Tập 5)" },
              { id: "liver", labelEn: "Liver & Vascular (Vol.06)", labelVi: "Lá Gan (Tập 6)" },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setActiveFilter(f.id)}
                className={`rounded-full px-4 py-2 text-xs font-bold transition cursor-pointer ${
                  activeFilter === f.id
                    ? "bg-[#18302b] text-white shadow-sm"
                    : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                {vi ? f.labelVi : f.labelEn}
              </button>
            ))}
          </div>
        </section>

        {/* Ebooks Grid */}
        <section className="mx-auto max-w-7xl px-5 pb-20 lg:px-8">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {filteredEbooks.map((b) => {
              const isAvailable = b.status === "available";
              const title = vi ? b.titleVi : b.titleEn;
              const subtitle = vi ? b.subtitleVi : b.subtitleEn;
              const desc = vi ? b.descriptionVi : b.descriptionEn;
              const pairings = vi ? b.featuredPairingsVi : b.featuredPairingsEn;
              const ebookPageHref = isAvailable
                ? (b.id === "blood-sugar"
                    ? (vi ? "/vi/song-khoe/ebooks/duong-huyet" : "/en/wellness/ebooks/blood-sugar-pairings")
                    : (b.id === "antioxidants"
                        ? (vi ? "/vi/song-khoe/ebooks/chat-chong-oxy-hoa" : "/en/wellness/ebooks/antioxidants")
                        : (b.pdfUrl || "#")))
                : "#";

              return (
                <div
                  key={b.id}
                  className="flex flex-col justify-between rounded-3xl border border-[#d6e3d6] bg-white p-6 shadow-sm transition hover:shadow-xl hover:border-emerald-500"
                >
                  <div>
                    {/* Top Tag & Volume */}
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <span className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-800">
                        {b.volume} · {vi ? b.categoryVi : b.categoryEn}
                      </span>
                      {isAvailable ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-emerald-900">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                          <span>{vi ? "PDF Đã Có Sẵn" : "Master PDF Ready"}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-amber-900">
                          <Clock className="h-3 w-3 text-amber-600" />
                          <span>{vi ? "Đang nghiên cứu" : "In Progress"}</span>
                        </span>
                      )}
                    </div>

                    {/* Image Preview Box */}
                    <div className="relative h-48 w-full overflow-hidden rounded-2xl bg-slate-100 mb-5 border border-slate-150">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={b.coverImage}
                        alt={title}
                        className="h-full w-full object-cover transition duration-500 hover:scale-105"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.src = "/ebooks/blood-sugar/lentils-rice-hero.png";
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs font-bold">
                        <span>{b.pages} {vi ? "Trang PDF" : "Pages Handbook"}</span>
                        <span>{b.citationsCount} {vi ? "Nguồn PubMed" : "PubMed Citations"}</span>
                      </div>
                    </div>

                    {/* Title & Description */}
                    <h3 className="text-xl font-black text-[#18302b] leading-snug">
                      {title}
                    </h3>
                    <p className="mt-1 text-xs font-bold text-emerald-800">
                      {subtitle}
                    </p>
                    <p className="mt-3 text-xs sm:text-sm text-[#4e665d] leading-relaxed line-clamp-3">
                      {desc}
                    </p>

                    {/* Featured Pairings Chips */}
                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">
                        {vi ? "Các cặp thực phẩm y sinh trong tập này:" : "Tested Pairings in this Volume:"}
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {pairings.map((p) => (
                          <span
                            key={p}
                            className="rounded-full bg-[#f2f6f2] px-2.5 py-1 text-[11px] font-semibold text-slate-700"
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-6 pt-4 border-t border-slate-100">
                    {isAvailable ? (
                      <div className="space-y-2">
                        {b.pdfUrl && (
                          <a
                            href={b.pdfUrl}
                            download
                            onClick={() => {
                              trackWellness("ebook_download", {
                                ebook: b.id,
                                method: "direct",
                                source: "catalog_card",
                                locale,
                              });
                            }}
                            className="w-full inline-flex justify-center items-center gap-2 rounded-2xl bg-[#18302b] px-4 py-3 text-xs font-bold text-white shadow-sm hover:bg-[#25483a] transition cursor-pointer"
                          >
                            <Download className="h-4 w-4 text-amber-300" />
                            <span>{vi ? `Tải Trọn Bộ PDF (${b.volume})` : `Download Full Master PDF (${b.volume})`}</span>
                          </a>
                        )}
                        {(b.id === "blood-sugar" || b.id === "antioxidants") && (
                          <Link
                            href={ebookPageHref}
                            className="w-full inline-flex justify-center items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-bold text-slate-700 hover:bg-slate-50 transition"
                          >
                            <BookOpen className="h-3.5 w-3.5 text-emerald-700" />
                            <span>{vi ? "Xem bài đọc trực tuyến" : "Read Online Edition"}</span>
                            <ChevronRight className="h-3.5 w-3.5" />
                          </Link>
                        )}
                      </div>
                    ) : (
                      <div className="rounded-2xl bg-amber-50/80 p-3 border border-amber-200/60 text-center">
                        <p className="text-[11px] font-semibold text-amber-900">
                          {vi ? "Đang tổng hợp dữ liệu nghiên cứu đối chứng." : "Human trials & evidence synthesis in progress."}
                        </p>
                        <span className="block mt-1 text-[10px] font-bold uppercase tracking-wider text-amber-800">
                          {vi ? "Dự kiến phát hành trong đợt tiếp theo" : "Scheduled in Next Evidence Batch"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Global Evidence Dispatch Lead Magnet */}
        <section className="mx-auto max-w-5xl px-5 pb-20">
          <EbookLeadCapture
            locale={locale}
            variant="inline"
            source="ebook_library_master"
          />
        </section>
      </main>
    </WellnessShell>
  );
}
