import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, ExternalLink, ShieldCheck, Sparkles, BookOpen } from "lucide-react";
import type { WellnessArticle } from "@/data/wellness-articles";
import { WellnessShell } from "./WellnessShell";
import { EbookLeadCapture } from "./EbookLeadCapture";

const evidenceCopy = {
  en: { supported: "Supported guidance", promising: "Promising evidence", limited: "Limited evidence" },
  vi: { supported: "Hướng dẫn có cơ sở", promising: "Bằng chứng triển vọng", limited: "Bằng chứng hạn chế" },
};

export function ArticlePage({ article }: { article: WellnessArticle }) {
  const vi = article.locale === "vi";
  const base = vi ? "/vi/song-khoe" : "/en/wellness";
  const translation = vi ? `/en/wellness/guides/${article.translationSlug}` : `/vi/song-khoe/huong-dan/${article.translationSlug}`;
  const toolHref = `${base}/${vi ? "cong-cu" : "tools"}#${article.tool}`;
  const schema = { "@context": "https://schema.org", "@type": "Article", headline: article.title, description: article.description, dateModified: "2026-09-18", inLanguage: article.locale, author: { "@type": "Organization", name: "Botly Wellness" }, publisher: { "@type": "Organization", name: "Botly" } };

  return <WellnessShell locale={article.locale}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
    <main>
      <article>
        <header className={`tone-${article.pillar === "nourish" ? "peach" : article.pillar === "calm" ? "sky" : "lilac"}`}>
          <div className="mx-auto max-w-4xl px-5 py-16 lg:px-8">
            <Link href={base} className="mb-10 inline-flex items-center gap-2 text-sm font-semibold text-[#536b62]"><ArrowLeft className="h-4 w-4" />{vi ? "Về Sống khỏe" : "Back to Wellness"}</Link>
            <p className="section-kicker">{article.eyebrow}</p><h1 className="mt-4 text-4xl font-semibold leading-[1.05] tracking-[-.05em] sm:text-6xl">{article.title}</h1><p className="mt-6 max-w-3xl text-lg leading-8 text-[#526b62]">{article.description}</p>
            <div className="mt-8 flex flex-wrap items-center gap-3 text-xs font-semibold"><span className="rounded-full bg-white/65 px-3 py-2">{article.readTime}</span><span className="rounded-full bg-white/65 px-3 py-2">{vi ? "Cập nhật" : "Reviewed"}: {article.reviewedAt}</span><span className="flex items-center gap-1.5 rounded-full bg-[#18302b] px-3 py-2 text-white"><ShieldCheck className="h-4 w-4" />{evidenceCopy[article.locale][article.evidence]}</span><Link href={translation} className="rounded-full border border-[#18302b]/15 px-3 py-2">{vi ? "Read in English" : "Đọc tiếng Việt"}</Link></div>
          </div>
        </header>
        <div className="mx-auto grid max-w-6xl gap-12 px-5 py-16 lg:grid-cols-[minmax(0,1fr)_19rem] lg:px-8">
          <div className="wellness-prose">
            {article.heroImage && (
              <figure className="mb-8 overflow-hidden rounded-3xl border border-slate-200 shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={article.heroImage} alt={article.title} className="w-full object-cover max-h-[420px]" loading="eager" />
              </figure>
            )}

            <div className="takeaway"><span>{vi ? "Ý chính" : "The takeaway"}</span><p>{article.takeaway}</p></div>

            {article.snapshot && (
              <div className="my-8 rounded-3xl bg-[#f2f7f1] p-6 border border-emerald-800/15 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-emerald-850">
                  <Sparkles className="h-4 w-4 text-emerald-600" />
                  <span>{vi ? "BẢN TÓM TẮT DỮ LIỆU Y SINH" : "EVIDENCE SNAPSHOT"}</span>
                </div>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="rounded-2xl bg-white p-3.5 border border-slate-200">
                    <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">{vi ? "Đặc tính thực phẩm" : "Key Food Property"}</span>
                    <strong className="text-slate-800 text-sm">{article.snapshot.property}</strong>
                  </div>
                  <div className="rounded-2xl bg-white p-3.5 border border-slate-200">
                    <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">{vi ? "Nghiên cứu lâm sàng" : "Human Research"}</span>
                    <strong className="text-emerald-800 text-sm">{article.snapshot.humanResearch}</strong>
                  </div>
                  <div className="rounded-2xl bg-white p-3.5 border border-slate-200">
                    <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">{vi ? "Dạng thực phẩm nghiên cứu" : "Study Form"}</span>
                    <strong className="text-slate-800 text-sm">{article.snapshot.studyForm}</strong>
                  </div>
                  <div className="rounded-2xl bg-white p-3.5 border border-slate-200">
                    <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">{vi ? "Thử nghiệm kết hợp trực tiếp" : "Exact Pairing Tested"}</span>
                    <strong className="text-slate-800 text-sm">{article.snapshot.exactPairing}</strong>
                  </div>
                </div>
              </div>
            )}

            {article.sections.map(section => <section key={section.title}><h2>{section.title}</h2>{section.paragraphs.map(p => <p key={p}>{p}</p>)}{section.bullets && <ul>{section.bullets.map(b => <li key={b}><CheckCircle2 />{b}</li>)}</ul>}</section>)}

            {/* In-Article Ebook Download Banner */}
            <EbookLeadCapture
              locale={article.locale}
              variant="inline"
              source={`article_${article.slug}`}
            />

            <section className="sources"><h2>{vi ? "Nguồn tham khảo" : "Sources"}</h2>{article.sources.map(source => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.label}<ExternalLink /></a>)}</section>
          </div>

          <aside className="space-y-6">
            <EbookLeadCapture
              locale={article.locale}
              variant="sidebar"
              source={`article_sidebar_${article.slug}`}
            />

            <div className="rounded-3xl bg-[#eaf0e5] p-6">
              <p className="section-kicker">{vi ? "THỰC HÀNH" : "TRY IT"}</p>
              <h2 className="mt-3 text-xl font-semibold">{vi ? "Thử kết hợp bữa ăn của bạn." : "Test your meal combination."}</h2>
              <p className="mt-3 text-sm leading-6 text-[#61756e]">{vi ? "Mở công cụ phân tích kết hợp thực phẩm miễn phí." : "Open the free Food Combination tool."}</p>
              <Link href={toolHref} className="wellness-button mt-5 w-full">{vi ? "Mở công cụ" : "Open the tool"}<ArrowRight /></Link>
            </div>
          </aside>
        </div>
      </article>
    </main>
  </WellnessShell>;
}
