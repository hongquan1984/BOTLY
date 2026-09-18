"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Download,
  ExternalLink,
  Eye,
  FileText,
  HelpCircle,
  Layers,
  Microscope,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { WellnessLocale } from "@/data/wellness";
import { WellnessShell } from "./WellnessShell";
import { EbookLeadCapture } from "./EbookLeadCapture";

export function BloodSugarEbookHub({ locale }: { locale: WellnessLocale }) {
  const vi = locale === "vi";
  const base = vi ? "/vi/song-khoe" : "/en/wellness";
  const [showPdfViewer, setShowPdfViewer] = useState(false);

  const pairings = [
    {
      num: "01",
      pair: vi ? "Đậu Lăng + Cơm Trắng" : "Lentils + Rice",
      slug: vi ? "dau-lang-va-com-duong-huyet" : "lentils-rice-blood-sugar",
      image: "/ebooks/blood-sugar/lentils-rice-hero.png",
      question: vi
        ? "Điều gì xảy ra khi thay thế một phần cơm trắng bằng đậu lăng?"
        : "What happens when lentils replace part of the rice on your plate?",
      finding: vi
        ? "Nghiên cứu thử nghiệm chéo ngẫu nhiên trên 48 người trưởng thành cho thấy việc thay 50% tinh bột cơm bằng đậu lăng làm giảm đáng kể đỉnh đường huyết (AUC) sau ăn."
        : "A randomized crossover study in 48 healthy adults found replacing half of available rice carbohydrates with lentils significantly blunted post-meal glucose rise (AUC).",
      keyProperty: vi ? "Chất xơ và đạm thực vật thay thế tinh bột nhanh" : "Fibre & plant protein replacing rice carbs",
      researchType: vi ? "Thử nghiệm lâm sàng chéo trực tiếp (Crossover RCT)" : "Direct acute crossover trial",
    },
    {
      num: "02",
      pair: vi ? "Yến Mạch + Quả Mọng" : "Oats + Berries",
      slug: vi ? "yen-mach-va-qua-mong-duong-huyet" : "oats-berries-blood-sugar",
      image: "/ebooks/blood-sugar/oats-berries-hero.png",
      question: vi
        ? "Nghiên cứu y sinh thực sự nói gì về yến mạch và kiểm soát glucose?"
        : "What does human research actually say about oats and blood sugar?",
      finding: vi
        ? "Beta-glucan trong yến mạch làm tăng độ nhớt tiêu hóa, làm chậm hấp thu đường. Quả mọng bổ sung anthocyanin giúp giảm nhẹ đỉnh đường sớm."
        : "Oat beta-glucan increases digestive viscosity, slowing sugar absorption. Berry anthocyanins may flatten early peaks, though everyday bowls vary by dose and form.",
      keyProperty: vi ? "Beta-glucan nhớt & polyphenol thực vật" : "Viscous beta-glucan & fruit polyphenols",
      researchType: vi ? "Phân tích gộp & thử nghiệm bữa ăn có kiểm soát" : "Meta-analyses & controlled-meal trials",
    },
    {
      num: "03",
      pair: vi ? "Hành Tây + Mật Ong" : "Onion + Honey",
      slug: vi ? "hanh-tay-va-mat-ong-duong-huyet" : "onion-honey-blood-sugar",
      image: "/ebooks/blood-sugar/onion-honey-hero.png",
      question: vi
        ? "Mẹo dân gian hành tây ngâm mật ong: Có ý nghĩa gì với đường huyết?"
        : "Onion and honey are both popular—does combining them make sense for blood sugar?",
      finding: vi
        ? "Kiểm chứng sự thật (Myth-check): Mật ong chủ yếu là đường tự do (fructose & glucose). Không có bằng chứng lâm sàng nào cho thấy hành tây triệt tiêu lượng đường từ mật ong."
        : "Myth-check: Honey is primarily free sugars (glucose & fructose). No qualifying human trial supports claims that onion cancels out honey's glycemic load.",
      keyProperty: vi ? "Chiết xuất Quercetin vs đường tự do trong mật ong" : "Quercetin supplements vs honey sugars",
      researchType: vi ? "Nghiên cứu độc lập từng thành phần; không có thử nghiệm kết hợp" : "Separate ingredient studies; no combo trial",
    },
    {
      num: "04",
      pair: vi ? "Đậu Hầm + Bánh Mì Nướng" : "Beans + Toast",
      slug: vi ? "dau-va-banh-mi-duong-huyet" : "beans-toast-blood-sugar",
      image: "/ebooks/blood-sugar/beans-toast-hero.png",
      question: vi
        ? "Đậu có thể thay đổi điều gì trong bữa sáng giàu tinh bột?"
        : "What can beans change in a high-carbohydrate breakfast?",
      finding: vi
        ? "Đậu bổ sung đạm và chất xơ làm chậm quá trình vận chuyển đường vào máu, giảm phản ứng insulin sau bữa sáng giàu tinh bột."
        : "Pulse fibre and physical structure slow the delivery of carbohydrate into the bloodstream, improving acute insulin responses compared to starch alone.",
      keyProperty: vi ? "Cấu trúc đạm thực vật & chất xơ hòa tan" : "Plant protein matrix & dietary fibre",
      researchType: vi ? "Thử nghiệm bữa sáng giàu chất xơ & bữa ăn đậu + cơm" : "High-fibre acute breakfasts & bean-rice trials",
    },
  ];

  const references = [
    { id: 1, title: "Moravek D et al. Carbohydrate Replacement of Rice or Potato with Lentils Reduces Postprandial Glycemic Response in Healthy Adults. J Nutr 2018.", url: "https://jn.nutrition.org/article/S0022-3166(22)10813-8/fulltext" },
    { id: 2, title: "Clarke ST et al. A Review of the Relationship between Lentil Serving and Acute Postprandial Blood Glucose Response. Nutrients 2022.", url: "https://pubmed.ncbi.nlm.nih.gov/35215500/" },
    { id: 3, title: "Chen V et al. Effect of oats and oat beta-glucan on glycemic control in diabetes. BMJ Open Diabetes Res Care 2022.", url: "https://pmc.ncbi.nlm.nih.gov/articles/9438016/" },
    { id: 4, title: "Zurbau A et al. The effect of oat beta-glucan on postprandial blood glucose and insulin responses. Eur J Clin Nutr 2021.", url: "https://www.nature.com/articles/s41430-021-00875-9" },
    { id: 5, title: "Törrönen R et al. Berries modify postprandial plasma glucose response to sucrose in healthy subjects. Br J Nutr 2010.", url: "https://pubmed.ncbi.nlm.nih.gov/19930765/" },
    { id: 6, title: "Ahmed A et al. Effects of Honey on Metabolic Risk Factors in Healthy Adults. Curr Dev Nutr 2021.", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC8180681/" },
    { id: 7, title: "Ostadmohammadi V et al. Effects of quercetin supplementation on glycemic control. Phytother Res 2019.", url: "https://pubmed.ncbi.nlm.nih.gov/30848564/" },
    { id: 8, title: "Thompson SV et al. Bean and rice meals reduce postprandial glycemic response in adults with type 2 diabetes. Nutr J 2012.", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC3489574/" },
  ];

  return (
    <WellnessShell locale={locale}>
      <main className="bg-[#f7faf6]">
        {/* Top Breadcrumb */}
        <div className="mx-auto max-w-7xl px-5 pt-8 lg:px-8">
          <Link
            href={`${base}/health-tips`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#526b62] hover:text-[#18302b] transition"
          >
            <span>← {vi ? "Chuyên mục Mẹo Sức Khỏe (Health Tips)" : "Health Tips Portal"}</span>
          </Link>
        </div>

        {/* Hero Section: Editorial Ebook Lead Magnet */}
        <section className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
            {/* Left Col (7 cols) */}
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-600/25 bg-emerald-50 px-3.5 py-1 text-xs font-extrabold uppercase tracking-wider text-emerald-900 shadow-sm">
                <Sparkles className="h-3.5 w-3.5 text-emerald-600 animate-pulse" />
                <span>HEALTHCLUES · EVIDENCE-BASED HANDBOOK · 11 PAGES</span>
              </div>

              <h1 className="mt-4 text-3xl font-black tracking-tight text-[#18302b] sm:text-5xl lg:text-[3.25rem] leading-[1.1]">
                {vi ? "Đường Huyết & Bữa Ăn Hàng Ngày" : "Blood Sugar & Everyday Pairings"}
              </h1>

              <p className="mt-4 text-sm font-bold uppercase tracking-wider text-emerald-800">
                {vi
                  ? "Sự thật về glucose, chất xơ và khoa học sắp đặt một đĩa ăn"
                  : "What food combinations can teach us about glucose, fibre and the science of a meal"}
              </p>

              <p className="mt-4 text-base leading-relaxed text-[#4e665d] sm:text-lg max-w-2xl">
                {vi
                  ? "Bốn cặp thực phẩm quen thuộc, cơ chế phân tử bên trong chúng và kết quả thực tế từ các thử nghiệm lâm sàng đối chứng trên người (Human Randomized Crossover Trials)."
                  : "Four familiar pairings, the compounds and nutrients inside them, and what human clinical trials actually measured without the hype."}
              </p>

              {/* Key Scientific Credentials Grid */}
              <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-[#d8e4d8]">
                <div className="rounded-2xl bg-white p-3.5 shadow-sm border border-[#d6e3d6]">
                  <span className="block text-2xl font-black text-[#18302b]">4</span>
                  <span className="text-[11px] font-bold text-[#5c776c]">
                    {vi ? "Cặp món ăn quen thuộc" : "Everyday pairings"}
                  </span>
                </div>
                <div className="rounded-2xl bg-white p-3.5 shadow-sm border border-[#d6e3d6]">
                  <span className="block text-2xl font-black text-emerald-700">15</span>
                  <span className="text-[11px] font-bold text-[#5c776c]">
                    {vi ? "Nguồn PubMed / RCT" : "PubMed citations"}
                  </span>
                </div>
                <div className="rounded-2xl bg-white p-3.5 shadow-sm border border-[#d6e3d6]">
                  <span className="block text-2xl font-black text-[#18302b]">100%</span>
                  <span className="text-[11px] font-bold text-[#5c776c]">
                    {vi ? "Thực phẩm nguyên bản" : "Whole food matrix"}
                  </span>
                </div>
                <div className="rounded-2xl bg-white p-3.5 shadow-sm border border-[#d6e3d6]">
                  <span className="block text-2xl font-black text-amber-600">0%</span>
                  <span className="text-[11px] font-bold text-[#5c776c]">
                    {vi ? "Không thần thánh hóa" : "Zero pseudoscience"}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <a
                  href="#download-form"
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#18302b] px-6 py-3.5 text-sm font-bold text-white shadow-md hover:bg-[#26483a] transition"
                >
                  <Download className="h-4 w-4 text-amber-300" />
                  <span>{vi ? "Tải Cẩm Nang PDF (Miễn Phí)" : "Download PDF Handbook (Free)"}</span>
                </a>
                <button
                  type="button"
                  onClick={() => setShowPdfViewer(!showPdfViewer)}
                  className="inline-flex items-center gap-2 rounded-2xl border border-[#b7ceba] bg-white px-5 py-3.5 text-sm font-bold text-[#18302b] hover:bg-[#ebf2ea] transition cursor-pointer"
                >
                  <Eye className="h-4 w-4 text-emerald-700" />
                  <span>{showPdfViewer ? (vi ? "Đóng bản xem trực tiếp" : "Hide PDF Preview") : (vi ? "Đọc trực tiếp trên web" : "Read Online Preview")}</span>
                </button>
              </div>
            </div>

            {/* Right Col: 3D-styled Book Mockup + Quick Download Card (5 cols) */}
            <div id="download-form" className="lg:col-span-5 scroll-mt-20">
              <EbookLeadCapture
                locale={locale}
                variant="hero"
                source="ebook_blood_sugar_hub"
                onPreviewClick={() => {
                  document.getElementById("chapters-overview")?.scrollIntoView({ behavior: "smooth" });
                }}
              />
            </div>
          </div>
        </section>

        {/* Embedded PDF Viewer (Toggleable) */}
        {showPdfViewer && (
          <section className="mx-auto max-w-5xl px-5 py-6 animate-in fade-in duration-300">
            <div className="rounded-3xl border border-slate-300 bg-white p-4 shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 px-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-emerald-600" />
                  <span className="font-bold text-sm text-slate-800">
                    HealthClues — Blood Sugar &amp; Everyday Pairings (11 Pages)
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <a
                    href="/ebooks/blood-sugar/healthclues-blood-sugar-guide.pdf"
                    download
                    className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 hover:bg-emerald-200 transition"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>{vi ? "Lưu file về máy" : "Save file"}</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => setShowPdfViewer(false)}
                    className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200 cursor-pointer"
                  >
                    ✕ {vi ? "Đóng" : "Close"}
                  </button>
                </div>
              </div>

              <div className="mt-3 w-full h-[700px] rounded-2xl bg-slate-100 overflow-hidden">
                <iframe
                  src="/ebooks/blood-sugar/healthclues-blood-sugar-guide.pdf"
                  title="HealthClues Blood Sugar Guide PDF"
                  className="w-full h-full border-0"
                />
              </div>
            </div>
          </section>
        )}

        {/* Section: The 4 Clinically Researched Chapters (The Spokes) */}
        <section id="chapters-overview" className="mx-auto max-w-7xl px-5 py-16 lg:px-8 border-t border-[#d8e4d8] scroll-mt-10">
          <div className="max-w-3xl">
            <p className="text-xs font-extrabold uppercase tracking-widest text-emerald-800">
              {vi ? "MỤC LỤC CHI TIẾT" : "TABLE OF CONTENTS & CHAPTER OVERVIEW"}
            </p>
            <h2 className="mt-2 text-2xl sm:text-4xl font-black text-[#18302b] tracking-tight">
              {vi ? "4 Cặp Thực Phẩm Được Kiểm Chứng Lâm Sàng" : "4 Pairs Investigated in Human Trials"}
            </h2>
            <p className="mt-3 text-sm sm:text-base text-[#4e665d] leading-relaxed">
              {vi
                ? "Mỗi chương trong cẩm nang giải đáp trực diện một câu hỏi dinh dưỡng thực tế, tách bạch giữa cơ chế phòng thí nghiệm và tác động đo lường được trên cơ thể người."
                : "Each chapter tests an everyday eating question, separating molecular laboratory mechanisms from what actually happens in human digestion."}
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {pairings.map((p) => (
              <div
                key={p.slug}
                className="group flex flex-col justify-between rounded-3xl border border-[#d6e3d6] bg-white p-6 shadow-sm transition hover:shadow-lg hover:border-emerald-500"
              >
                <div>
                  <div className="relative h-52 w-full overflow-hidden rounded-2xl bg-slate-100 mb-5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.image}
                      alt={p.pair}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <span className="absolute top-3 left-3 rounded-full bg-black/70 px-3 py-1 text-xs font-bold text-white backdrop-blur-md">
                      {p.num} · {p.pair}
                    </span>
                  </div>

                  <h3 className="text-lg sm:text-xl font-bold text-[#18302b] leading-snug group-hover:text-emerald-800 transition">
                    {p.question}
                  </h3>

                  <p className="mt-3 text-xs sm:text-sm text-[#4e665d] leading-relaxed">
                    {p.finding}
                  </p>

                  <div className="mt-4 rounded-2xl bg-[#f5f8f5] p-3.5 text-xs space-y-1.5">
                    <div className="flex justify-between">
                      <span className="font-semibold text-slate-500">{vi ? "Đặc tính:" : "Key property:"}</span>
                      <span className="font-bold text-slate-800 text-right">{p.keyProperty}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold text-slate-500">{vi ? "Nghiên cứu:" : "Study design:"}</span>
                      <span className="font-bold text-emerald-800 text-right">{p.researchType}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <Link
                    href={`${base}/guides/${p.slug}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-950 group-hover:underline"
                  >
                    <span>{vi ? "Đọc bài phân tích chuyên sâu" : "Read in-depth study breakdown"}</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                  <span className="text-[11px] font-semibold text-slate-400">
                    {vi ? "Đọc 4 phút" : "4 min read"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section: Methodology & Reader Guidelines */}
        <section className="bg-[#ebf2ea] py-16">
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <span className="inline-block rounded-full bg-emerald-200/80 px-3 py-1 text-xs font-extrabold uppercase tracking-widest text-emerald-900">
                {vi ? "QUY CHUẨN KHOA HỌC" : "EVIDENCE INTEGRITY GUIDELINES"}
              </span>
              <h2 className="mt-3 text-2xl sm:text-3xl font-black text-[#18302b]">
                {vi ? "Cách Đọc Hiểu Cẩm Nang Này" : "How to Read This Guide"}
              </h2>
              <p className="mt-3 text-sm text-[#4e665d] leading-relaxed">
                {vi
                  ? "Phản ứng đường huyết sau khi ăn phụ thuộc vào cấu trúc tổng thể của cả bữa ăn, không chỉ một thành phần đơn lẻ."
                  : "Blood sugar after eating depends on more than one ingredient. The amount and type of carbohydrate, fibre, protein, food structure and the rest of the meal all shape the response."}
              </p>
            </div>

            <div className="mt-10 grid gap-6 sm:grid-cols-3">
              <div className="rounded-3xl bg-white p-6 shadow-sm border border-[#d6e3d6]">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800 font-bold">
                  1
                </div>
                <h4 className="mt-4 font-bold text-[#18302b]">
                  {vi ? "Thực phẩm vs Hoạt chất cô lập" : "Whole Food vs Concentrated Extract"}
                </h4>
                <p className="mt-2 text-xs leading-relaxed text-[#526b62]">
                  {vi
                    ? "Bằng chứng về một hoạt chất tinh khiết (như quercetin dạng viên nén) không tự động là bằng chứng cho một củ hành tây thông thường."
                    : "Evidence about a concentrated compound is not automatically evidence about the whole food."}
                </p>
              </div>

              <div className="rounded-3xl bg-white p-6 shadow-sm border border-[#d6e3d6]">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800 font-bold">
                  2
                </div>
                <h4 className="mt-4 font-bold text-[#18302b]">
                  {vi ? "Đơn lẻ vs Phối hợp" : "Single Ingredient vs The Pairing"}
                </h4>
                <p className="mt-2 text-xs leading-relaxed text-[#526b62]">
                  {vi
                    ? "Bằng chứng về từng thành phần riêng biệt không thể tự suy luận thành sự hiệp đồng (synergy) khi kết hợp lại với nhau."
                    : "Evidence about one ingredient is not automatically evidence about the pairing. The exact mixture must be tested."}
                </p>
              </div>

              <div className="rounded-3xl bg-white p-6 shadow-sm border border-[#d6e3d6]">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800 font-bold">
                  3
                </div>
                <h4 className="mt-4 font-bold text-[#18302b]">
                  {vi ? "Giáo dục vs Y khoa" : "Educational vs Medical Prescription"}
                </h4>
                <p className="mt-2 text-xs leading-relaxed text-[#526b62]">
                  {vi
                    ? "Tài liệu mang tính giáo dục dinh dưỡng tự chăm sóc, không thay thế chẩn đoán y khoa hay chỉ định thuốc hạ đường huyết."
                    : "This guide is educational. It does not replace individualized medical care or advice about diabetes medication."}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section: Academic References */}
        <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
          <div className="max-w-3xl">
            <h3 className="text-xl font-bold text-[#18302b]">
              {vi ? "Tài liệu tham khảo chọn lọc" : "Selected Clinical References"}
            </h3>
            <p className="mt-1 text-xs text-[#526b62]">
              {vi
                ? "Tất cả các tuyên bố trong cẩm nang đều có thể đối chiếu trực tiếp trên thư viện y khoa quốc tế."
                : "All empirical statements in this handbook are indexed on peer-reviewed repositories."}
            </p>
          </div>

          <div className="mt-6 grid gap-2 sm:grid-cols-2 text-xs text-slate-600">
            {references.map((r) => (
              <a
                key={r.id}
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-2 rounded-2xl border border-slate-200 bg-white p-3 hover:border-emerald-600 transition"
              >
                <span className="font-bold text-emerald-700">{r.id}.</span>
                <span className="flex-1 group-hover:text-emerald-950">{r.title}</span>
                <ExternalLink className="h-3 w-3 text-slate-400 group-hover:text-emerald-600 shrink-0 mt-0.5" />
              </a>
            ))}
          </div>
        </section>

        {/* Final CTA Banner */}
        <section className="mx-auto max-w-5xl px-5 pb-20">
          <EbookLeadCapture
            locale={locale}
            variant="inline"
            source="ebook_blood_sugar_bottom"
          />
        </section>
      </main>
    </WellnessShell>
  );
}
