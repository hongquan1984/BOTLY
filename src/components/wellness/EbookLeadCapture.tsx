"use client";

import { useState } from "react";
import { Download, CheckCircle2, FileText, ArrowRight, ShieldCheck, Sparkles, Eye } from "lucide-react";
import type { WellnessLocale } from "@/data/wellness";
import { trackWellness } from "@/lib/wellness-analytics";

interface EbookLeadCaptureProps {
  locale: WellnessLocale;
  variant?: "hero" | "inline" | "sidebar";
  source?: string;
  pdfUrl?: string;
  ebookId?: string;
  ebookTitle?: string;
  pages?: number;
  fileSize?: string;
  onPreviewClick?: () => void;
}

export function EbookLeadCapture({
  locale,
  variant = "hero",
  source = "ebook_blood_sugar_pairings",
  pdfUrl = "/ebooks/blood-sugar/healthclues-blood-sugar-guide.pdf",
  ebookId = "blood-sugar-pairings",
  ebookTitle,
  pages = 11,
  fileSize = "5.6 MB",
  onPreviewClick,
}: EbookLeadCaptureProps) {
  const vi = locale === "vi";
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) return;

    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, locale, source, ebookId }),
      });

      if (!res.ok) throw new Error("Subscription failed");
      setStatus("done");
      trackWellness("newsletter_submitted", { source, locale });
      trackWellness("ebook_download_unlocked", { ebook: ebookId, locale });
      trackWellness("ebook_download", { ebook: ebookId, method: "unlocked", source, locale });

      // Automatically trigger PDF download
      const link = document.createElement("a");
      link.href = pdfUrl;
      link.download = pdfUrl.split("/").pop() || "healthclues-guide.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      setStatus("error");
    }
  };

  const handleDirectDownload = () => {
    trackWellness("ebook_downloaded", { source, locale, ebook: ebookId, method: "direct" });
    trackWellness("ebook_download", { source, locale, ebook: ebookId, method: "direct" });
  };

  if (status === "done") {
    return (
      <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-[#0c2018] via-[#102b20] to-[#183a2d] p-6 sm:p-8 text-white shadow-xl animate-in fade-in duration-300">
        <div className="flex items-center gap-3 text-emerald-400">
          <CheckCircle2 className="h-6 w-6 shrink-0" />
          <h4 className="text-lg font-bold">
            {vi ? "Đã sẵn sàng tải xuống!" : "Your Guide is Ready!"}
          </h4>
        </div>
        <p className="mt-2 text-xs sm:text-sm text-emerald-100/80 leading-relaxed">
          {vi
            ? "File PDF 11 trang chuẩn y sinh đã bắt đầu được tải tự động về máy của bạn. Bạn cũng có thể bấm nút bên dưới để mở hoặc tải lại bất kỳ lúc nào."
            : "The 11-page evidence-based handbook has started downloading. You can also re-download or open it directly below."}
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <a
            href={pdfUrl}
            download="healthclues-blood-sugar-everyday-pairings.pdf"
            onClick={handleDirectDownload}
            className="inline-flex items-center gap-2 rounded-2xl bg-amber-400 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-md hover:bg-amber-300 transition"
          >
            <Download className="h-4 w-4" />
            <span>{vi ? "Tải lại file PDF (5.6 MB)" : "Download PDF Again (5.6 MB)"}</span>
          </a>
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleDirectDownload}
            className="inline-flex items-center gap-2 rounded-2xl border border-emerald-400/40 bg-white/10 px-4 py-2.5 text-xs font-semibold text-emerald-200 hover:bg-white/20 transition"
          >
            <Eye className="h-4 w-4" />
            <span>{vi ? "Đọc trên trình duyệt" : "Read in Browser"}</span>
          </a>
        </div>
      </div>
    );
  }

  // Sidebar compact variant
  if (variant === "sidebar") {
    return (
      <div className="rounded-3xl border border-emerald-900/20 bg-[#f4f8f4] p-5 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-emerald-800">
          <FileText className="h-4 w-4 text-emerald-600" />
          <span>{vi ? "CẨM NANG MIỄN PHÍ" : "FREE EVIDENCE HANDBOOK"}</span>
        </div>
        <h4 className="mt-2.5 text-base font-bold text-[#18302b] leading-snug">
          {vi ? "Đường Huyết & Kết Hợp Thực Phẩm Hàng Ngày" : "Blood Sugar & Everyday Pairings"}
        </h4>
        <p className="mt-1.5 text-xs text-[#526b62] leading-relaxed">
          {vi
            ? "Tài liệu 11 trang trích dẫn 15 nghiên cứu lâm sàng PubMed về 4 cặp thực phẩm quen thuộc."
            : "11-page printable handbook featuring 4 human crossover trials and 15 PubMed citations."}
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-2.5">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={vi ? "Nhập email nhận sách..." : "Your email address..."}
            className="w-full rounded-2xl border border-[#c8d9cb] bg-white px-3.5 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full inline-flex justify-center items-center gap-2 rounded-2xl bg-[#18302b] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#284638] transition disabled:opacity-60 cursor-pointer shadow-sm"
          >
            <Download className="h-3.5 w-3.5 text-amber-300" />
            <span>{status === "loading" ? "..." : (vi ? "Tải PDF Miễn Phí" : "Get Free PDF")}</span>
          </button>
          {status === "error" && (
            <p className="text-[11px] text-rose-600">{vi ? "Vui lòng thử lại với email hợp lệ." : "Please try again with a valid email."}</p>
          )}
        </form>
      </div>
    );
  }

  // Inline Banner in Article flow
  if (variant === "inline") {
    return (
      <div className="my-10 rounded-3xl border border-emerald-800/20 bg-gradient-to-br from-[#f2f7f1] via-[#eaf2e8] to-[#e1eee0] p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100/90 px-3 py-1 text-[11px] font-bold text-emerald-900">
              <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
              <span>HEALTHCLUES · VERIFIED EBOOK</span>
            </div>
            <h3 className="mt-3 text-xl sm:text-2xl font-black text-[#18302b] tracking-tight">
              {vi
                ? "Tải Trọn Bộ Cẩm Nang: Đường Huyết & Bữa Ăn Hàng Ngày"
                : "Download the Complete Blood Sugar & Food Pairings Handbook"}
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-[#486357] leading-relaxed">
              {vi
                ? "Tổng hợp 4 cặp thực phẩm (Gạo + Đậu lăng, Yến mạch + Quả mọng, Hành tây + Mật ong, Đậu + Bánh mì) với 15 tài liệu kiểm chứng y sinh PubMed."
                : "Includes all 4 food combinations, postprandial glucose curves, human crossover trials, and 15 PubMed citations in an 11-page printable PDF."}
            </p>
          </div>

          <div className="w-full md:w-80 shrink-0">
            <form onSubmit={handleSubmit} className="space-y-2.5">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={vi ? "Nhập email của bạn..." : "Enter your email..."}
                className="w-full rounded-2xl border border-[#bed2c2] bg-white px-4 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 shadow-inner"
              />
              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full inline-flex justify-center items-center gap-2 rounded-2xl bg-[#18302b] px-5 py-3 text-xs font-bold text-white hover:bg-[#234336] transition shadow-md cursor-pointer disabled:opacity-60"
              >
                <Download className="h-4 w-4 text-amber-300" />
                <span>{status === "loading" ? "..." : (vi ? "Tải Cẩm Nang PDF (Miễn Phí)" : "Download Free PDF (5.6 MB)")}</span>
              </button>
            </form>
            <p className="mt-2 text-[10px] text-center text-[#678074]">
              ✓ {vi ? "Không spam. Tải ngay lập tức." : "100% free. Instant download link."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Hero Lead Capture Card (Default for Landing Page)
  return (
    <div className="rounded-3xl border border-emerald-700/20 bg-white/95 p-6 sm:p-8 shadow-xl backdrop-blur-md">
      <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-emerald-800">
        <ShieldCheck className="h-4 w-4 text-emerald-600" />
        <span>{vi ? "TẢI CẨM NANG MIỄN PHÍ" : "GET THE FREE EVIDENCE GUIDE"}</span>
      </div>

      <h3 className="mt-3 text-xl sm:text-2xl font-black text-[#18302b] tracking-tight">
        {vi ? "Nhận cẩm nang y sinh bản PDF đầy đủ" : "Instant Access to the 11-Page PDF"}
      </h3>
      <p className="mt-2 text-xs sm:text-sm text-[#4e665d] leading-relaxed">
        {vi
          ? "Điền email để tải ngay bản PDF 11 trang với thiết kế trang nhã, công thức bữa ăn và tài liệu tham khảo PubMed chi tiết."
          : "Enter your email for the complete 11-page editorial guide with full references, food ratios, and glucose mechanism charts."}
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-3">
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#4e665d] mb-1">
            {vi ? "Địa chỉ Email" : "Your Email Address"}
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={vi ? "vidu@gmail.com" : "you@example.com"}
            className="w-full rounded-2xl border border-[#bed2c2] bg-[#f8faf8] px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 transition"
          />
        </div>

        <button
          type="submit"
          disabled={status === "loading"}
          className="w-full inline-flex justify-center items-center gap-2 rounded-2xl bg-[#18302b] px-6 py-3.5 text-sm font-bold text-white shadow-lg hover:bg-[#254639] active:scale-[0.99] transition cursor-pointer disabled:opacity-60"
        >
          <Download className="h-4 w-4 text-amber-300" />
          <span>{status === "loading" ? "..." : (vi ? "Tải Ngay Bản PDF Miễn Phí (5.6 MB)" : "Download Free PDF Guide (5.6 MB)")}</span>
          <ArrowRight className="h-4 w-4" />
        </button>

        {status === "error" && (
          <p className="text-xs text-rose-600 text-center font-medium">
            {vi ? "Đã có lỗi xảy ra. Vui lòng kiểm tra lại email." : "Something went wrong. Please check your email."}
          </p>
        )}
      </form>

      <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-xs text-[#6a8074]">
        <div className="flex items-center gap-1.5">
          <span className="text-emerald-600 font-bold">✓</span>
          <span>{vi ? "Bản quyền HealthClues" : "HealthClues Certified"}</span>
        </div>
        {onPreviewClick && (
          <button
            type="button"
            onClick={onPreviewClick}
            className="text-emerald-800 hover:text-emerald-950 font-semibold underline cursor-pointer"
          >
            {vi ? "Xem trước mục lục" : "Preview Table of Contents"}
          </button>
        )}
      </div>
    </div>
  );
}
