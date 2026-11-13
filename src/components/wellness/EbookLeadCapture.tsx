"use client";

import { useState, useSyncExternalStore } from "react";
import { ArrowRight, CheckCircle2, Download, ShieldCheck } from "lucide-react";
import type { WellnessLocale } from "@/data/wellness";
import { trackWellness } from "@/lib/wellness-analytics";
import { getHealthCluesProfileUrl, getHealthCluesQuizUrl, getHealthCluesSessionProfile, hasHealthCluesAnalyticsConsent, subscribeHealthCluesSessionProfile, trackHealthCluesFunnel } from "@/lib/healthclues-funnel";

interface EbookLeadCaptureProps {
  locale: WellnessLocale;
  variant?: "hero" | "inline" | "sidebar";
  source?: string;
  pdfUrl?: string;
  ebookId?: string;
  ebookTitle?: string;
  fileFormat?: "PDF" | "EPUB";
  hasMultipleFormats?: boolean;
  pages?: number;
  fileSize?: string;
  onPreviewClick?: () => void;
}

export function EbookLeadCapture({
  locale, variant = "hero", source = "ebook_blood_sugar_pairings",
  pdfUrl = "/ebooks/blood-sugar/healthclues-blood-sugar-guide.pdf",
  ebookId = "blood-sugar", ebookTitle = "Everyday Food Pairings",
  pages = ebookId === "blood-sugar" ? 11 : undefined,
  fileSize = ebookId === "blood-sugar" ? "5.6 MB" : undefined,
  fileFormat = ["food-remedies", "healthy-life-beverage-book", "a-book-of-simples", "complete-herbal"].includes(ebookId) ? "EPUB" : "PDF",
  hasMultipleFormats = ["food-remedies", "healthy-life-beverage-book", "a-book-of-simples", "complete-herbal"].includes(ebookId),
  onPreviewClick,
}: EbookLeadCaptureProps) {
  const vi = locale === "vi";
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [deliveryConsent, setDeliveryConsent] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [downloadLinks, setDownloadLinks] = useState<{ label: string; url: string }[]>([]);
  const [postDownloadDismissed, setPostDownloadDismissed] = useState(false);
  const completedProfile = useSyncExternalStore(subscribeHealthCluesSessionProfile, getHealthCluesSessionProfile, () => null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!deliveryConsent) return;
    setStatus("loading");
    setError("");
    try {
      const response = await fetch("/api/ebooks/lead", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, ebookId, locale, deliveryConsent, marketingConsent, sourcePage: typeof window === "undefined" ? source : `${window.location.pathname}?source=${encodeURIComponent(source)}` }),
      });
      const result = await response.json();
      const links = result.downloadUrls?.length ? result.downloadUrls : result.downloadUrl ? [{ label: 'Download again', url: result.downloadUrl }] : [];
      if (!response.ok || !links.length) throw new Error(result.error || "Could not unlock the guide.");
      setDownloadLinks(links);
      setStatus("done");
      trackHealthCluesFunnel("ebook_download_success", { ebook_id: ebookId, delivery: "signed_download_url" });
      trackHealthCluesFunnel(getHealthCluesSessionProfile() ? "post_download_profile_view" : "post_download_quiz_view", { ebook_id: ebookId });
      if (hasHealthCluesAnalyticsConsent()) {
        trackWellness("ebook_download_unlocked", { ebook: ebookId, locale });
        trackWellness("ebook_download", { ebook: ebookId, method: "email_gate", source, locale });
      }
      if (links.length === 1) {
        const link = document.createElement("a");
        link.href = links[0].url;
        link.download = links[0].url.split("/").pop() || "botly-wellness-guide";
        document.body.appendChild(link); link.click(); link.remove();
      }
    } catch (caught) {
      setStatus("error");
      setError(caught instanceof Error ? caught.message : "Please try again.");
    }
  };

  const compact = variant !== "hero";
  if (compact && !isOpen) return <div className="rounded-2xl border border-[#e2ebe2] bg-[#f8fbf8] p-4">
    <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">{vi ? 'EBOOK MIỄN PHÍ' : 'FREE BOTLY GUIDE'}</p>
    <p className="mt-1 text-sm font-extrabold text-[#18302b]">{ebookTitle}</p>
    <button type="button" onClick={() => setIsOpen(true)} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#18302b] px-4 py-3 text-sm font-bold text-white hover:bg-[#25483a]"><Download className="h-4 w-4 text-amber-300"/>{vi ? 'Mở khóa ebook miễn phí' : 'Get Free Ebook'}</button>
  </div>;
  return <div className={compact ? "fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 px-4 py-6" : ""} onMouseDown={compact ? () => setIsOpen(false) : undefined}>
    <div role={compact ? 'dialog' : undefined} aria-modal={compact ? true : undefined} aria-label={compact ? `${ebookTitle} email form` : undefined} onMouseDown={compact ? (event) => event.stopPropagation() : undefined} className={`relative w-full rounded-2xl ${compact ? "max-h-full max-w-lg overflow-y-auto border border-[#e2ebe2] bg-white p-5 shadow-2xl sm:p-7" : "border border-emerald-700/20 bg-white p-6 shadow-lg sm:p-8"}`}>
    {compact && <button type="button" onClick={() => setIsOpen(false)} aria-label={vi ? 'Đóng biểu mẫu' : 'Close form'} className="absolute right-3 top-3 rounded-full p-2 text-slate-500 hover:bg-slate-100">×</button>}
    <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-emerald-800"><ShieldCheck className="h-4 w-4"/> {vi ? "TẢI SÁCH MIỄN PHÍ" : "FREE BOTLY GUIDE"}</div>
    <h3 className="mt-2 text-lg font-extrabold text-[#18302b]">{vi ? "Mở khóa cẩm nang" : `Unlock ${ebookTitle}`}</h3>
    <p className="mt-1 text-xs leading-relaxed text-[#526b62]">{vi
      ? hasMultipleFormats ? "Nhập email để chọn bản PDF hoặc EPUB. PDF mở bằng ứng dụng đọc PDF; EPUB mở bằng ứng dụng đọc sách." : fileFormat === "EPUB" ? "Nhập email để mở khóa ebook EPUB, có thể đọc bằng ứng dụng đọc sách." : `Nhập email để mở khóa tệp PDF${pages ? ` ${pages} trang` : ""}${fileSize ? ` (${fileSize})` : ""}.`
      : hasMultipleFormats ? "Enter your email to choose PDF or EPUB. Open the PDF in a PDF reader or the EPUB in an ebook reader app." : fileFormat === "EPUB" ? "Enter your email to unlock the EPUB ebook, readable in an ebook reader app." : `Enter your email to unlock the ${pages ? `${pages}-page ` : ""}PDF${fileSize ? ` (${fileSize})` : ""}.`}</p>
    {status === "done" ? <div className="mt-4 rounded-xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-900"><p className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5"/> {vi ? "ÄÃ£ má»Ÿ khÃ³a. Tá»‡p Ä‘ang táº£i xuá»‘ng." : "Unlocked. Your download is ready."}</p><div className="mt-2 flex flex-col gap-2">{downloadLinks.map((item) => <a key={item.url} className="inline-flex items-center gap-2 underline" href={item.url} download>{item.label} <Download className="h-4 w-4"/></a>)}</div>{!vi && !postDownloadDismissed && <aside className="mt-4 rounded-2xl border border-[#dce8dc] bg-white p-5 text-[#18302b] sm:p-6">{completedProfile ? <><h4 className="text-lg font-extrabold">Your Wellness Profile Is Ready</h4><p className="mt-2 text-sm leading-relaxed text-[#526b62]">You already created a Discovery Profile in this browser session. You can view or update it any time.</p><a href={getHealthCluesProfileUrl(ebookId)} onClick={() => trackHealthCluesFunnel("post_download_profile_click", { ebook_id: ebookId, entry: "post_download" })} className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-[#18302b] px-5 py-3 text-sm font-bold text-white hover:bg-[#25483a]">View My Profile</a></> : <><h4 className="text-lg font-extrabold">Want Wellness Ideas That Fit Your Lifestyle?</h4><p className="mt-2 text-sm font-semibold text-emerald-800">Your ebook is just the beginning.</p><p className="mt-2 text-sm leading-relaxed text-[#526b62]">Take our free discovery quiz and explore everyday recipes, wellness activities, and educational resources matched to your interests.</p><a href={getHealthCluesQuizUrl(ebookId, "post_download")} onClick={() => trackHealthCluesFunnel("post_download_quiz_click", { ebook_id: ebookId, entry: "post_download" })} className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-[#18302b] px-5 py-3 text-sm font-bold text-white hover:bg-[#25483a]">Create My Wellness Profile</a><p className="mt-3 text-center text-xs leading-relaxed text-[#71837b]">Your answers help personalize your experience. You&apos;re always in control of your preferences.</p></>}<button type="button" onClick={() => { trackHealthCluesFunnel(completedProfile ? "post_download_profile_dismiss" : "post_download_quiz_dismiss", { ebook_id: ebookId }); setPostDownloadDismissed(true); }} className="mt-3 w-full rounded-lg px-3 py-2 text-sm font-semibold text-[#526b62] underline">Maybe Later</button></aside>}</div> : <form onSubmit={handleSubmit} className="mt-4 space-y-3">
      <input type="text" value={name} onChange={(event) => setName(event.target.value)} maxLength={120} autoComplete="name" placeholder={vi ? "Tên (không bắt buộc)" : "Name (optional)"} className="w-full rounded-xl border border-[#d6e3d6] bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-emerald-700" />
      <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} maxLength={254} autoComplete="email" placeholder={vi ? "Địa chỉ email" : "Email address"} className="w-full rounded-xl border border-[#d6e3d6] bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-emerald-700" />
      <label className="flex items-start gap-2 text-xs leading-relaxed text-[#526b62]"><input type="checkbox" required checked={deliveryConsent} onChange={(event) => setDeliveryConsent(event.target.checked)} className="mt-0.5 accent-emerald-800"/><span>{vi ? "Tôi đồng ý dùng email để mở khóa ebook này. Việc này không đăng ký tôi nhận nội dung tiếp thị." : "I agree to use my email to unlock this ebook. This does not subscribe me to marketing."}</span></label>
      <label className="flex items-start gap-2 text-xs leading-relaxed text-[#526b62]"><input type="checkbox" checked={marketingConsent} onChange={(event) => setMarketingConsent(event.target.checked)} className="mt-0.5 accent-emerald-800"/><span>{vi ? "Gửi cho tôi mẹo và hướng dẫn sức khỏe qua email (không bắt buộc; có thể hủy đăng ký)." : "Email me wellness tips and new guides (optional; unsubscribe any time)."}</span></label>
      {status === "error" && <p role="alert" className="text-xs font-medium text-rose-700">{error}</p>}
      <button type="submit" disabled={status === "loading" || !deliveryConsent} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#18302b] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#25483a] disabled:cursor-not-allowed disabled:opacity-60"><Download className="h-4 w-4 text-amber-300"/><span>{status === "loading" ? "..." : vi ? "Mở khóa ebook miễn phí" : "Get Free Ebook"}</span><ArrowRight className="h-4 w-4"/></button>
      <p className="text-center text-[10px] leading-relaxed text-[#71837b]">{vi ? "Email được dùng để mở khóa tài liệu bạn yêu cầu. Đồng ý nhận nội dung tiếp thị là tùy chọn riêng." : "Your email is used to unlock the requested guide. Marketing consent is separate and optional."}</p>
    </form>}
    {onPreviewClick && <button type="button" onClick={onPreviewClick} className="mt-3 text-xs font-semibold text-emerald-900 underline">{vi ? "Xem nội dung" : "Preview contents"}</button>}
    </div>
  </div>;
}
