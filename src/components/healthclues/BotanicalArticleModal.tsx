"use client";

import { useEffect, useRef } from "react";
import { 
  X, 
  ExternalLink, 
  Bookmark, 
  BookmarkCheck, 
  ShieldAlert, 
  FlaskConical, 
  AlertTriangle, 
  BookOpen, 
  FileText, 
  Sparkles,
  Info
} from "lucide-react";
import { useHealthCluesLocale } from "@/components/healthclues/HealthCluesLocaleProvider";
import type { BotanicalArticle, BotanicalEvidenceLevel } from "@/data/healthclues-botanical-library";

export interface BotanicalArticleModalProps {
  article: BotanicalArticle | null;
  isOpen: boolean;
  onClose: () => void;
  isBookmarked: boolean;
  onToggleBookmark: (articleId: string) => void;
  bookmarkBusy?: boolean;
}

export function BotanicalArticleModal({
  article,
  isOpen,
  onClose,
  isBookmarked,
  onToggleBookmark,
  bookmarkBusy = false
}: BotanicalArticleModalProps) {
  const { locale } = useHealthCluesLocale();
  const tx = (en: string, vi: string) => (locale === "vi" ? vi : en);
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen || !article) return null;

  const evidenceConfig: Record<string, { label: string; bg: string; text: string; border: string }> = {
    human_clinical_trial: {
      label: tx("Human Clinical Trial", "Thử nghiệm lâm sàng ở người"),
      bg: "bg-emerald-50",
      text: "text-emerald-800",
      border: "border-emerald-300"
    },
    systematic_review: {
      label: tx("Systematic Review & Meta-analysis", "Tổng quan hệ thống & Phân tích gộp"),
      bg: "bg-purple-50",
      text: "text-purple-800",
      border: "border-purple-300"
    },
    animal: {
      label: tx("Animal Study (In Vivo)", "Nghiên cứu trên động vật (In vivo)"),
      bg: "bg-amber-50",
      text: "text-amber-800",
      border: "border-amber-300"
    },
    in_vitro: {
      label: tx("Laboratory / In Vitro Study", "Nghiên cứu in vitro / Ống nghiệm"),
      bg: "bg-blue-50",
      text: "text-blue-800",
      border: "border-blue-300"
    },
    human_observational: {
      label: tx("Human Observational Study", "Nghiên cứu quan sát ở người"),
      bg: "bg-teal-50",
      text: "text-teal-800",
      border: "border-teal-300"
    },
    traditional_use: {
      label: tx("Documented Traditional Use", "Kinh nghiệm truyền thống"),
      bg: "bg-stone-50",
      text: "text-stone-800",
      border: "border-stone-300"
    }
  };

  const evStyle = evidenceConfig[article.evidenceLevel] || evidenceConfig.in_vitro;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-5 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="botanical-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        ref={modalRef}
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl border border-[#cfc6a9] bg-[#fbfaf4] text-[#1c3327] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between gap-3 bg-[#173b34] px-5 py-4 text-white sm:px-6">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#2a564b] text-[#86efac]">
              <FlaskConical size={22} />
            </span>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[.2em] text-[#f6df9d]">
                {tx("Scientific Botanical Library · Peer-reviewed", "Thư viện Khoa học Thảo mộc · Đã qua bình duyệt")}
              </p>
              <h2 id="botanical-modal-title" className="text-xl sm:text-2xl font-black">
                {article.commonName[locale]}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onToggleBookmark(article.id)}
              disabled={bookmarkBusy}
              aria-label={isBookmarked ? tx("Unsave article", "Bỏ lưu bài viết") : tx("Save article", "Lưu bài viết")}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-colors ${
                isBookmarked 
                  ? "bg-amber-400 text-amber-950 hover:bg-amber-300" 
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              {isBookmarked ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
              <span className="hidden sm:inline">
                {isBookmarked ? tx("Saved", "Đã lưu") : tx("Bookmark", "Lưu kiến thức")}
              </span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label={tx("Close", "Đóng")}
              className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto px-5 py-6 sm:px-8 space-y-6">
          
          {/* Prominent Medical Disclaimer */}
          <div className="rounded-2xl border border-rose-300 bg-rose-50/80 p-4 text-xs sm:text-sm text-rose-950 shadow-sm flex items-start gap-3">
            <ShieldAlert size={20} className="shrink-0 text-rose-600 mt-0.5" />
            <div>
              <strong className="block font-bold mb-1">
                {tx("Medical Disclaimer & Educational Scope", "Tuyên bố miễn trừ trách nhiệm y tế & Phạm vi giáo dục")}
              </strong>
              <p className="leading-relaxed text-rose-900/90">
                {article.educationalDisclaimer?.[locale] || tx(
                  "This entry is provided strictly for educational and scientific reference purposes. It does NOT constitute medical advice, diagnosis, or treatment instructions. Botanical compounds are not substitutes for prescribed pharmaceuticals. Always consult your qualified physician or healthcare provider before introducing any herbal extracts or dietary supplements.",
                  "Thông tin bài viết chỉ nhằm mục đích giáo dục khoa học và tham khảo. Đây KHÔNG phải là lời khuyên, chẩn đoán hay phác đồ điều trị y tế. Các thảo dược không thể thay thế thuốc chữa bệnh được bác sĩ kê đơn. Luôn tham vấn bác sĩ chuyên khoa trước khi sử dụng bất kỳ thảo dược hay thay đổi chế độ dinh dưỡng nào."
                )}
              </p>
            </div>
          </div>

          {/* Plant Identity Bar with Botanical Artwork */}
          <div className="rounded-2xl border border-[#ded8c4] bg-[#fdfdfb] p-4 sm:p-5 flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
            {article.imageUrl && (
              <div className="w-24 h-24 sm:w-28 sm:h-28 shrink-0 rounded-2xl overflow-hidden border-2 border-[#d8cfbe] bg-[#f5efe2] shadow-sm">
                <img 
                  src={article.imageUrl} 
                  alt={article.commonName[locale]} 
                  className="w-full h-full object-cover object-center"
                />
              </div>
            )}
            <div className="flex-1 space-y-1 text-center sm:text-left">
              <span className="text-xs font-bold uppercase tracking-wider text-[#697c6d]">
                {tx("Scientific Name (Latin)", "Tên khoa học quốc tế (Latin)")}
              </span>
              <p className="text-lg font-serif italic font-bold text-[#1a3d31]">
                {article.scientificName}
              </p>
              <div className="flex flex-wrap justify-center sm:justify-start gap-x-4 gap-y-1 text-xs text-[#526457] pt-1">
                <span>
                  <strong>{tx("Verified Date:", "Ngày xác thực dữ liệu:")}</strong> {article.lastVerifiedDate}
                </span>
                <span>•</span>
                <span>
                  <strong>{tx("Review Status:", "Trạng thái thẩm định:")}</strong>{" "}
                  <span className="capitalize font-semibold text-emerald-800">{article.reviewStatus}</span>
                </span>
              </div>
            </div>

            <div className="flex flex-col items-center sm:items-end gap-1.5 shrink-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#697c6d]">
                {tx("Evidence Classification", "Mức độ bằng chứng")}
              </span>
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-extrabold ${evStyle.bg} ${evStyle.text} ${evStyle.border}`}>
                <Sparkles size={13} />
                {evStyle.label}
              </span>
            </div>
          </div>

          {/* Target Health Topics */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-[#496556] mb-2 flex items-center gap-1.5">
              <Info size={14} />
              {tx("Target Health Topics & Applications", "Chủ đề sức khỏe & Phạm vi ứng dụng")}
            </h4>
            <div className="flex flex-wrap gap-2">
              {article.topicKeys.map(topic => (
                <span 
                  key={topic} 
                  className="rounded-lg border border-[#c8dec8] bg-[#eef7ee] px-2.5 py-1 text-xs font-semibold text-[#1e4620]"
                >
                  #{topic}
                </span>
              ))}
            </div>
          </div>

          {/* Overview Summary */}
          <div className="rounded-2xl border border-[#e5dfce] bg-white p-5 shadow-sm">
            <h3 className="text-sm font-black uppercase tracking-wider text-[#244b3c] mb-2">
              {tx("Scientific Overview", "Tổng quan khoa học")}
            </h3>
            <p className="text-sm sm:text-base leading-relaxed text-[#35493d]">
              {article.shortIntro[locale]}
            </p>
          </div>

          {/* Active Bioactive Compounds */}
          <div className="space-y-3">
            <h3 className="text-sm font-black uppercase tracking-wider text-[#244b3c]">
              {tx("Key Bioactive Compounds", "Các hợp chất hoạt tính sinh học chính")}
            </h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {article.compounds.map((compound, index) => (
                <div 
                  key={index}
                  className="rounded-2xl border border-[#ded8c4] bg-[#faf8f0] p-4 flex flex-col justify-between"
                >
                  <div>
                    <span className="text-xs font-black text-[#1e4c3d] flex items-center gap-1">
                      <FlaskConical size={13} className="text-emerald-700" />
                      {compound.name}
                    </span>
                    <p className="mt-2 text-xs text-[#526457] leading-relaxed">
                      {compound.scientificDescription[locale]}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Biological Mechanism of Action */}
          <div className="rounded-2xl border border-[#ded8c4] bg-white p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-[#244b3c] flex items-center gap-2">
              <BookOpen size={16} className="text-emerald-700" />
              {tx("Biological Mechanisms of Action", "Cơ chế tác động sinh học & Dược lý")}
            </h3>
            <div className="space-y-3">
              {article.biologicalMechanisms.map((mech, index) => (
                <div key={index} className="rounded-xl bg-[#f8f6ee] p-4 border border-[#e9e3d3] space-y-1">
                  <h4 className="text-xs font-bold text-[#1a4134]">{mech.title[locale]}</h4>
                  <p className="text-sm leading-relaxed text-[#35493d]">{mech.description[locale]}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Scientific Study Findings */}
          <div className="rounded-2xl border border-[#ded8c4] bg-white p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-[#244b3c] flex items-center gap-2">
              <FileText size={16} className="text-emerald-700" />
              {tx("Key Scientific Findings in Evidence Models", "Kết quả nghiên cứu thực nghiệm")}
            </h3>
            <div className="space-y-3">
              {article.actualFindings.map((finding, index) => (
                <div key={index} className="rounded-xl border border-[#e5decb] p-4 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-bold text-[#1b3d30]">{finding.title[locale]}</h4>
                    <span className="text-[10px] uppercase font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {finding.modelType.replaceAll("_", " ")}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-[#3c5144]">{finding.summary[locale]}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Research Limitations */}
          <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 space-y-2">
            <h3 className="text-sm font-black uppercase tracking-wider text-amber-950 flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-700" />
              {tx("Current Research Limitations", "Giới hạn nghiên cứu hiện tại")}
            </h3>
            <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-amber-900 leading-relaxed">
              {article.studyLimitations[locale].map((limitation, i) => (
                <li key={i}>{limitation}</li>
              ))}
            </ul>
          </div>

          {/* Safety, Warnings & Contraindications */}
          <div className="rounded-2xl border border-rose-200 bg-white p-5 shadow-sm space-y-3">
            <h3 className="text-sm font-black uppercase tracking-wider text-rose-900 flex items-center gap-2">
              <ShieldAlert size={16} className="text-rose-700" />
              {tx("Safety, Warnings & Contraindications", "Cảnh báo an toàn, Chống chỉ định & Tác dụng phụ")}
            </h3>
            <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-rose-900 leading-relaxed">
              {article.safetyAndContraindications[locale].map((warn, i) => (
                <li key={i}>{warn}</li>
              ))}
            </ul>
          </div>

          {/* PubMed Citations & References */}
          <div className="rounded-2xl border border-[#ded8c4] bg-white p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-wider text-[#244b3c] flex items-center gap-2">
                <ExternalLink size={16} className="text-emerald-700" />
                {tx("PubMed & Peer-Reviewed References", "Trích dẫn PubMed & Tài liệu bình duyệt")}
              </h3>
              <span className="text-xs font-bold text-[#627768]">
                {article.references.length} {tx("citations", "nguồn trích dẫn")}
              </span>
            </div>

            <div className="divide-y divide-[#eee9dc]">
              {article.references.map((ref, idx) => (
                <div key={idx} className="py-3 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-1">
                    <p className="text-xs sm:text-sm font-bold text-[#1b3d30]">
                      {ref.title}
                    </p>
                    <p className="text-xs text-[#637568]">
                      {ref.authors} {ref.journal ? `· ${ref.journal}` : ""} ({ref.year})
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="inline-block text-[10px] font-mono font-bold bg-[#eef4ea] text-[#1c482c] px-2 py-0.5 rounded">
                        PMID: {ref.pmid}
                      </span>
                      <span className="text-[10px] uppercase text-[#697f72] font-semibold">
                        {ref.studyType.replaceAll("_", " ")}
                      </span>
                    </div>
                  </div>

                  <a 
                    href={ref.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-extrabold text-emerald-800 hover:text-emerald-950 hover:underline shrink-0"
                  >
                    <span>{tx("View on PubMed", "Xem trên PubMed")}</span>
                    <ExternalLink size={13} />
                  </a>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-[#f2eee1] border-t border-[#ded8c4] px-5 py-4 sm:px-8">
          <div className="text-xs text-[#627668]">
            {tx("Source: HealthClues Evidence Database", "Nguồn: Cơ sở Dữ liệu Y học Bằng chứng HealthClues")}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onToggleBookmark(article.id)}
              disabled={bookmarkBusy}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black transition-all ${
                isBookmarked 
                  ? "bg-amber-400 text-amber-950 hover:bg-amber-300 shadow-sm" 
                  : "bg-[#183d36] text-white hover:bg-[#205147]"
              }`}
            >
              {isBookmarked ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
              {isBookmarked ? tx("Remove from Bookmarks", "Bỏ lưu kiến thức") : tx("Save to Bookmarks", "Lưu vào Sổ tay kiến thức")}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#cfc8b4] bg-white px-4 py-2.5 text-xs font-bold text-[#2a3c31] hover:bg-[#faf9f5]"
            >
              {tx("Close", "Đóng")}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
