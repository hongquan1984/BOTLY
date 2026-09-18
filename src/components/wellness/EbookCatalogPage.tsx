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
} from "lucide-react";
import type { WellnessLocale } from "@/data/wellness";
import { wellnessEbooks, type WellnessEbook } from "@/data/wellness-ebooks";
import { WellnessShell } from "./WellnessShell";
import { EbookLeadCapture } from "./EbookLeadCapture";

export function EbookCatalogPage({ locale }: { locale: WellnessLocale }) {
  const vi = locale === "vi";
  const base = vi ? "/vi/song-khoe" : "/en/wellness";
  const [activeFilter, setActiveFilter] = useState<"all" | "available" | "nourish" | "calm">("all");

  const filteredEbooks = wellnessEbooks.filter((b) => {
    if (activeFilter === "available") return b.status === "available";
    if (activeFilter === "nourish") return b.pillar === "nourish";
    if (activeFilter === "calm") return b.pillar === "calm";
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

        {/* Hero Section */}
        <section className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-600/25 bg-emerald-50 px-3.5 py-1 text-xs font-extrabold uppercase tracking-wider text-emerald-900 shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-emerald-600 animate-pulse" />
              <span>HEALTHCLUES · EVIDENCE LIBRARY &amp; HANDBOOKS</span>
            </div>

            <h1 className="mt-4 text-3xl font-black tracking-tight text-[#18302b] sm:text-5xl lg:text-[3.25rem] leading-[1.1]">
              {vi ? "Thư Viện Cẩm Nang Y Sinh Thực Chứng" : "The HealthClues Evidence Library"}
            </h1>

            <p className="mt-4 text-base sm:text-lg text-[#4e665d] leading-relaxed">
              {vi
                ? "Bộ cẩm nang dinh dưỡng định dạng PDF có thể tải về miễn phí. Mỗi cuốn sách giải mã các cặp thực phẩm quen thuộc dựa trên thử nghiệm lâm sàng đối chứng trên người và tài liệu y khoa PubMed có thể tra cứu."
                : "Free printable nutrition handbooks that separate whole-food science from marketing myths. Every guide is grounded in human clinical crossover trials and peer-reviewed PubMed citations."}
            </p>

            {/* Quick Metrics */}
            <div className="mt-6 flex flex-wrap gap-6 text-xs font-bold text-[#526b62]">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 text-[11px]">✓</span>
                <span>{vi ? "Miễn phí 100% không quảng cáo rác" : "100% Free · No Paywalls"}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 text-[11px]">✓</span>
                <span>{vi ? "Đối chiếu thử nghiệm người (Human RCTs)" : "Human RCTs Verified"}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 text-[11px]">✓</span>
                <span>{vi ? "Định dạng PDF in ấn cao cấp" : "High-Res Printable PDFs"}</span>
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="mt-10 flex flex-wrap items-center gap-2 pt-6 border-t border-[#d8e4d8]">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mr-2 flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5" />
              {vi ? "Bộ lọc:" : "Filter:"}
            </span>
            {[
              { id: "all", labelEn: "All Handbooks", labelVi: "Tất cả cẩm nang" },
              { id: "available", labelEn: "Available Now (PDF)", labelVi: "Đã có sẵn (Tải ngay)" },
              { id: "nourish", labelEn: "Nutrition & Metabolism", labelVi: "Dinh dưỡng & Chuyển hóa" },
              { id: "calm", labelEn: "Sleep & Circadian", labelVi: "Giấc ngủ & Phục hồi" },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setActiveFilter(f.id as typeof activeFilter)}
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
                    : (vi ? "/vi/song-khoe/ebooks/chat-chong-oxy-hoa" : "/en/wellness/ebooks/antioxidants"))
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
                          <span>{vi ? "Đã có sẵn" : "Available"}</span>
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
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs font-bold">
                        <span>{b.pages} {vi ? "Trang PDF" : "Pages"}</span>
                        <span>{b.citationsCount} {vi ? "Nguồn PubMed" : "PubMed Citations"}</span>
                      </div>
                    </div>

                    {/* Title & Description */}
                    <h3 className="text-xl font-black text-[#18302b] leading-snug">
                      {title}
                    </h3>
                    <p className="mt-1 text-xs font-bold text-emerald-850">
                      {subtitle}
                    </p>
                    <p className="mt-3 text-xs sm:text-sm text-[#4e665d] leading-relaxed line-clamp-3">
                      {desc}
                    </p>

                    {/* Featured Pairings Chips */}
                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">
                        {vi ? "Các cặp thực phẩm tiêu biểu:" : "Tested Pairings Inside:"}
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {pairings.slice(0, 3).map((p) => (
                          <span
                            key={p}
                            className="rounded-full bg-[#f2f6f2] px-2.5 py-1 text-[11px] font-semibold text-slate-700"
                          >
                            {p}
                          </span>
                        ))}
                        {pairings.length > 3 && (
                          <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-500">
                            +{pairings.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-6 pt-4 border-t border-slate-100">
                    {isAvailable ? (
                      <div className="space-y-2">
                        <Link
                          href={ebookPageHref}
                          className="w-full inline-flex justify-center items-center gap-2 rounded-2xl bg-[#18302b] px-4 py-3 text-xs font-bold text-white shadow-sm hover:bg-[#25483a] transition"
                        >
                          <BookOpen className="h-4 w-4 text-amber-300" />
                          <span>{vi ? "Xem Chi Tiết & Tải Sách" : "View Handbook & Download"}</span>
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                        {b.pdfUrl && (
                          <a
                            href={b.pdfUrl}
                            download
                            className="w-full inline-flex justify-center items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-bold text-slate-700 hover:bg-slate-50 transition"
                          >
                            <Download className="h-3.5 w-3.5 text-emerald-700" />
                            <span>{vi ? "Tải trực tiếp file PDF" : "Direct PDF Download"}</span>
                          </a>
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
