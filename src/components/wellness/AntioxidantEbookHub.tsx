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

export function AntioxidantEbookHub({ locale }: { locale: WellnessLocale }) {
  const vi = locale === "vi";
  const base = vi ? "/vi/song-khoe" : "/en/wellness";
  const [showPdfViewer, setShowPdfViewer] = useState(false);

  const pairings = [
    {
      num: "01",
      pair: vi ? "Cà Chua + Dầu Ô Liu" : "Tomato + Olive Oil",
      image: "/ebooks/antioxidants/tomato-olive-oil-hero.png",
      question: vi
        ? "Vì sao một chút dầu ô liu có thể thay đổi lượng dưỡng chất cơ thể hấp thu từ cà chua?"
        : "Why might a little olive oil change what your body gets from a tomato?",
      finding: vi
        ? "Nghiên cứu thử nghiệm trên người chứng minh việc nấu cà chua cùng dầu ô liu làm tăng nồng độ lycopene trong huyết tương so với cà chua không dầu. Chất béo giúp hòa tan và giải phóng carotenoid."
        : "Human studies show consuming tomatoes cooked with olive oil significantly increases plasma lycopene concentration compared to tomatoes without fat. Dietary lipids enhance carotenoid bioaccessibility.",
      keyProperty: vi ? "Lycopene hòa tan trong chất béo thực vật" : "Lycopene bioaccessibility & dietary fats",
      researchType: vi ? "Thử nghiệm lâm sàng hấp thu trên người (PMID: 15927929)" : "Human bioavailability study (PMID: 15927929)",
      pmid: "15927929",
      pmidUrl: "https://pubmed.ncbi.nlm.nih.gov/15927929/",
    },
    {
      num: "02",
      pair: vi ? "Quả Bơ + Cà Chua" : "Avocado + Tomato",
      image: "/ebooks/antioxidants/avocado-tomato-hero.png",
      question: vi
        ? "Thành phần béo bùi của quả bơ trong đĩa salad có giúp hấp thu carotenoid tốt hơn?"
        : "Can the creamy part of a salad change what happens to its colorful nutrients?",
      finding: vi
        ? "Thử nghiệm lâm sàng đối chứng trên người cho thấy việc bổ sung bơ hoặc dầu bơ vào món salad/salsa làm tăng hấp thu lycopene lên gấp 4.4 lần và beta-carotene lên gấp 2.6 lần."
        : "A clinical trial in humans demonstrated that adding avocado or avocado oil to salad and salsa enhanced lycopene absorption by 4.4-fold and beta-carotene absorption by 2.6-fold.",
      keyProperty: vi ? "Chất béo đơn không bão hòa & ma trận thực phẩm" : "Monounsaturated fat & whole-food matrix",
      researchType: vi ? "Thử nghiệm chéo hấp thu carotenoid ở người (PMID: 15735074)" : "Human carotenoid absorption crossover trial (PMID: 15735074)",
      pmid: "15735074",
      pmidUrl: "https://pubmed.ncbi.nlm.nih.gov/15735074/",
    },
    {
      num: "03",
      pair: vi ? "Bông Cải Xanh + Dầu Ô Liu" : "Broccoli + Olive Oil",
      image: "/ebooks/antioxidants/broccoli-olive-oil-hero.png",
      question: vi
        ? "Nhãn dán 'chứa chất chống oxy hóa' thực sự có ý nghĩa y sinh học gì?"
        : "Why does 'contains antioxidants' tell us less than many food labels suggest?",
      finding: vi
        ? "Bông cải giàu glucosinolate và vitamin C. Dầu ô liu giúp cải thiện hương vị và hấp thu vitamin tan trong dầu. Tuy nhiên, 'chống oxy hóa' là tính chất hóa học ống nghiệm, không tự động đồng nghĩa với điều trị bệnh."
        : "Broccoli provides glucosinolates and vitamin C. Olive oil provides lipid vehicles. However, in-vitro antioxidant capacity is a chemical metric, not an automatic proof of disease outcome.",
      keyProperty: vi ? "Glucosinolate & chất mang lipid" : "Glucosinolates & lipid carrier context",
      researchType: vi ? "Phân tích thành phần & động học tế bào" : "Food composition & cellular kinetics",
    },
    {
      num: "04",
      pair: vi ? "Cà Rốt + Sốt Hummus" : "Carrot + Hummus",
      image: "/ebooks/antioxidants/carrot-hummus-hero.png",
      question: vi
        ? "Sốt chấm từ đậu gà và vừng thay đổi giá trị dinh dưỡng của cà rốt như thế nào?"
        : "What can a dip change about the nutrition of a crunchy vegetable?",
      finding: vi
        ? "Cà rốt chứa nhiều beta-carotene (tiền chất vitamin A). Sốt hummus bổ sung đạm thực vật, chất xơ và chất béo từ dầu mè/tahini, tạo nên một bữa phụ hoàn chỉnh dinh dưỡng và làm chậm tiêu hóa."
        : "Carrots supply provitamin A carotenoids. Hummus adds plant protein, viscous fiber, and sesamin fats from tahini, creating a balanced meal context with higher satiety.",
      keyProperty: vi ? "Beta-carotene & dinh dưỡng bổ trợ đa thành phần" : "Beta-carotene & complementary macronutrients",
      researchType: vi ? "Động học tiêu hóa & thành phần đĩa ăn" : "Digestive kinetics & plate balance",
    },
    {
      num: "05",
      pair: vi ? "Trà Xanh + Cam Chanh" : "Green Tea + Citrus",
      image: "/ebooks/antioxidants/green-tea-citrus-hero.png",
      question: vi
        ? "Vắt chanh vào trà xanh có thực sự làm tăng tác dụng chống oxy hóa?"
        : "Does adding citrus make a 'healthy' drink scientifically stronger?",
      finding: vi
        ? "Catechin (đặc biệt là EGCG) trong trà xanh dễ bị thoái hóa trong môi trường kiềm ở ruột non. Axit ascorbic (vitamin C) và độ pH thấp từ cam chanh giúp ổn định phân tử catechin trong điều kiện mô phỏng tiêu hóa."
        : "Catechins (notably EGCG) are unstable in alkaline intestinal environments. Vitamin C and mild acidity from citrus improve catechin stability in gastric simulation models.",
      keyProperty: vi ? "Ổn định polyphenol & độ pH tiêu hóa" : "Polyphenol stability & pH gastric dynamics",
      researchType: vi ? "Mô hình tiêu hóa in-vitro & động học sinh học" : "In-vitro digestion models & kinetic assays",
    },
    {
      num: "06",
      pair: vi ? "Kim Chi + Cơm Trắng" : "Kimchi + Rice",
      image: "/ebooks/antioxidants/kimchi-rice-hero.png",
      question: vi
        ? "Món ăn truyền thống lên men dạy chúng ta điều gì về ranh giới bằng chứng?"
        : "What can a traditional plate teach us—and what can it not prove?",
      finding: vi
        ? "Quá trình lên men rau củ tạo ra axit hữu cơ và hệ vi sinh vật có ích. Kết hợp với tinh bột cơm tạo nên bữa ăn truyền thống dễ tiêu hóa. Cần tôn trọng văn hóa ẩm thực mà không thổi phồng thành thuốc chữa bệnh."
        : "Lactic acid fermentation alters vegetable phytochemistry and microbial activity. Eaten with rice, it provides cultural context and flavor without needing exaggerated detox promises.",
      keyProperty: vi ? "Axit hữu cơ lên men & vi sinh vật" : "Fermentation acids & food heritage context",
      researchType: vi ? "Nghiên cứu văn hóa ẩm thực & vi sinh thực phẩm" : "Culinary epidemiology & microbial biology",
    },
  ];

  return (
    <WellnessShell locale={locale}>
      <main className="bg-[#f7faf6] min-h-screen">
        {/* Top Breadcrumb */}
        <div className="mx-auto max-w-7xl px-5 pt-8 lg:px-8">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#526b62]">
            <Link href={`${base}/ebooks`} className="hover:text-[#18302b] transition flex items-center gap-1">
              <span>← {vi ? "Thư Viện Cẩm Nang Ebook" : "Evidence Ebooks Library"}</span>
            </Link>
            <span>/</span>
            <span className="text-[#18302b]">VOL. 02 · {vi ? "Chất Chống Oxy Hóa" : "Antioxidants"}</span>
          </div>
        </div>

        {/* Hero Section */}
        <section className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            {/* Left Col: Headings & Copy */}
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-600/25 bg-emerald-50 px-3.5 py-1 text-xs font-extrabold uppercase tracking-wider text-emerald-900 shadow-sm">
                <Sparkles className="h-3.5 w-3.5 text-emerald-600 animate-pulse" />
                <span>HEALTHCLUES · EVIDENCE HANDBOOK VOL. 02</span>
              </div>

              <h1 className="mt-4 text-3xl font-black tracking-tight text-[#18302b] sm:text-5xl lg:text-[3.25rem] leading-[1.1]">
                {vi ? "Chất Chống Oxy Hóa Trên Đĩa Ăn" : "Antioxidants on the Plate"}
              </h1>

              <p className="mt-4 text-lg font-bold text-emerald-850">
                {vi
                  ? "Các cặp thực phẩm hàng ngày, hoạt chất tự nhiên và những gì nghiên cứu y sinh thực sự chứng minh."
                  : "Everyday food combinations, compounds, and what human research actually says."}
              </p>

              <p className="mt-3 text-base text-[#4e665d] leading-relaxed">
                {vi
                  ? "Cẩm nang 14 trang phân tích sâu 6 cặp thực phẩm: sự khác biệt giữa 'chứa chất chống oxy hóa' và 'hấp thu vào máu', vai trò của chất béo trong việc hòa tan carotenoid, và ranh giới khoa học giữa ẩm thực truyền thống với các lời hứa hẹn thần kỳ."
                  : "A 14-page printable handbook examining 6 everyday combinations. Learn the crucial difference between 'contains antioxidants' and 'bioavailable in blood', how healthy fats unlock carotenoids, and where clinical proof ends."}
              </p>

              {/* Metrics Pills */}
              <div className="mt-8 flex flex-wrap gap-4 text-xs font-bold text-[#18302b]">
                <div className="flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 shadow-sm border border-[#d8e4d8]">
                  <FileText className="h-4 w-4 text-emerald-700" />
                  <span>{vi ? "14 Trang Chuẩn Y Sinh" : "14-Page Editorial PDF"}</span>
                </div>
                <div className="flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 shadow-sm border border-[#d8e4d8]">
                  <Microscope className="h-4 w-4 text-emerald-700" />
                  <span>{vi ? "6 Cặp Thực Phẩm Đối Chiếu" : "6 Tested Food Pairings"}</span>
                </div>
                <div className="flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 shadow-sm border border-[#d8e4d8]">
                  <ShieldCheck className="h-4 w-4 text-emerald-700" />
                  <span>{vi ? "18 Trích Dẫn Y Khoa PubMed" : "18 PubMed Citations"}</span>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => setShowPdfViewer(!showPdfViewer)}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-5 py-3 text-xs font-bold text-slate-800 shadow-sm hover:bg-slate-50 transition cursor-pointer"
                >
                  <Eye className="h-4 w-4 text-emerald-700" />
                  <span>{showPdfViewer ? (vi ? "Thu gọn PDF" : "Hide PDF Reader") : (vi ? "Xem trực tiếp PDF trên web" : "Read PDF in Browser")}</span>
                </button>
                <a
                  href="/ebooks/antioxidants/healthclues-antioxidant-guide.pdf"
                  download
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 hover:text-emerald-950 underline"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>{vi ? "Tải thẳng file PDF (13.2 MB)" : "Direct PDF download (13.2 MB)"}</span>
                </a>
              </div>
            </div>

            {/* Right Col: High-Converting Lead Capture Card */}
            <div className="lg:col-span-5">
              <EbookLeadCapture
                locale={locale}
                variant="hero"
                source="antioxidant_ebook_hub"
                pdfUrl="/ebooks/antioxidants/healthclues-antioxidant-guide.pdf"
                ebookId="antioxidants-on-the-plate"
                ebookTitle="Antioxidants on the Plate"
                pages={14}
                fileSize="13.2 MB"
                onPreviewClick={() => setShowPdfViewer(true)}
              />
            </div>
          </div>
        </section>

        {/* Optional Embedded PDF Reader */}
        {showPdfViewer && (
          <section className="mx-auto max-w-6xl px-5 py-8 animate-in fade-in duration-300">
            <div className="rounded-3xl border border-emerald-800/30 bg-slate-900 p-4 sm:p-6 shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-slate-700 text-white">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-amber-400" />
                  <span className="font-bold text-sm sm:text-base">
                    {vi ? "Đọc trực tuyến: Cẩm nang Chất Chống Oxy Hóa (14 trang)" : "Online PDF Reader: Antioxidants on the Plate"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPdfViewer(false)}
                  className="rounded-xl bg-slate-800 px-3 py-1.5 text-xs font-semibold hover:bg-slate-700 transition cursor-pointer"
                >
                  ✕ {vi ? "Đóng" : "Close"}
                </button>
              </div>
              <div className="mt-4 aspect-[4/3] w-full overflow-hidden rounded-2xl bg-slate-950">
                <iframe
                  src="/ebooks/antioxidants/healthclues-antioxidant-guide.pdf#toolbar=1"
                  className="h-full w-full border-0"
                  title="HealthClues Antioxidant Guide"
                />
              </div>
            </div>
          </section>
        )}

        {/* 6 Pairings Breakdown Section */}
        <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-800">
              {vi ? "BÊN TRONG CẨM NANG" : "WHAT'S INSIDE"}
            </span>
            <h2 className="mt-2 text-2xl sm:text-4xl font-black text-[#18302b] tracking-tight">
              {vi ? "6 Cặp Thực Phẩm Được Phân Tích Cơ Chế" : "6 Everyday Combinations Examined"}
            </h2>
            <p className="mt-3 text-sm text-[#4e665d] leading-relaxed">
              {vi
                ? "Mỗi mục phân tích rõ thành phần hoạt chất, mục tiêu nghiên cứu, và sự khác biệt giữa thử nghiệm trên người so với thí nghiệm ống nghiệm."
                : "Each entry explains what compounds are inside, what human trials measured, and how to enjoy whole foods without exaggerated claims."}
            </p>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {pairings.map((p) => (
              <div
                key={p.num}
                className="flex flex-col justify-between rounded-3xl border border-[#d6e3d6] bg-white p-6 shadow-sm hover:shadow-lg transition hover:border-emerald-500"
              >
                <div>
                  <div className="flex items-center justify-between text-xs font-extrabold text-emerald-800 mb-3">
                    <span>VOL. 02 · PAIRING {p.num}</span>
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] text-emerald-900 border border-emerald-200">
                      {vi ? "Thực nghiệm" : "Evidence"}
                    </span>
                  </div>

                  <div className="relative h-44 w-full overflow-hidden rounded-2xl bg-slate-100 mb-4 border border-slate-150">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.image}
                      alt={p.pair}
                      className="h-full w-full object-cover transition duration-500 hover:scale-105"
                      loading="lazy"
                    />
                  </div>

                  <h3 className="text-xl font-bold text-[#18302b]">{p.pair}</h3>
                  <p className="mt-2 text-xs italic font-medium text-emerald-900 leading-snug">
                    &quot;{p.question}&quot;
                  </p>
                  <p className="mt-3 text-xs sm:text-sm text-[#4e665d] leading-relaxed">
                    {p.finding}
                  </p>

                  <div className="mt-4 space-y-2 pt-4 border-t border-slate-100 text-xs">
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-slate-700 shrink-0">{vi ? "Cơ chế:" : "Mechanism:"}</span>
                      <span className="text-[#526b62]">{p.keyProperty}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-slate-700 shrink-0">{vi ? "Bằng chứng:" : "Trial type:"}</span>
                      <span className="text-[#526b62]">{p.researchType}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100">
                  {p.pmidUrl ? (
                    <a
                      href={p.pmidUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-950 transition"
                    >
                      <Microscope className="h-3.5 w-3.5" />
                      <span>{vi ? `Tra cứu PubMed PMID: ${p.pmid}` : `PubMed citation: ${p.pmid}`}</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <span className="text-[11px] font-medium text-slate-400">
                      {vi ? "Nghiên cứu động học & thành phần đĩa ăn" : "Digestive kinetics & food composition"}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Bottom Lead Magnet Box */}
        <section className="mx-auto max-w-5xl px-5 pb-24">
          <EbookLeadCapture
            locale={locale}
            variant="inline"
            source="antioxidant_ebook_bottom"
            pdfUrl="/ebooks/antioxidants/healthclues-antioxidant-guide.pdf"
            ebookId="antioxidants-on-the-plate"
            ebookTitle="Antioxidants on the Plate"
            pages={14}
            fileSize="13.2 MB"
          />
        </section>
      </main>
    </WellnessShell>
  );
}
