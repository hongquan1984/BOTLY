import Link from 'next/link';
import type { PublishedArticle } from '@/lib/published-articles';
import { portals } from '@/data/wellness-portals';
import { WellnessShell } from './WellnessShell';
import { TrustMeterWidget, QuickRecipeWidget, FactChecksWidget, FaqsWidget, SafetyQuizWidget } from './ArticleWidgets';
import { RelatedArticlesSection } from './RelatedArticlesSection';

export function PublishedArticlePage({ article: a, translationPath, relatedArticles = [] }: {
  article: PublishedArticle; translationPath: string | null; relatedArticles?: PublishedArticle[];
}) {
  const vi = a.locale === 'vi';
  const base = vi ? '/vi/song-khoe' : '/en/wellness';
  const portal = portals[a.locale].find(p => p.id === a.wellness_articles.category_id)!;
  const toolPath = a.tool === 'wellness-planner' ? `${base}/${vi ? 'cong-cu/ke-hoach' : 'tools/plan'}`
    : `${base}/${vi ? 'cong-cu' : 'tools'}#${a.tool}`;
  const date = (value: string) => new Date(value).toLocaleDateString(vi ? 'vi-VN' : 'en-US', { timeZone: 'UTC' });
  const schema = { '@context': 'https://schema.org', '@type': 'Article', headline: a.title,
    description: a.description, datePublished: a.published_at, dateModified: a.updated_at,
    inLanguage: a.locale, image: a.wellness_articles.cover_image_url ?? undefined,
    author: { '@type': 'Organization', name: 'Botly Wellness' } };
  return <WellnessShell locale={a.locale}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }} />
    <main><article>
      <header className={`tone-${portal.tone}`}><div className="mx-auto max-w-5xl px-5 py-16">
        <Link href={`${base}/${portal.slug}`} className="text-sm font-semibold">← {portal.name}</Link>
        <p className="section-kicker mt-8">{a.eyebrow || portal.name}</p>
        <h1 className="mt-4 text-4xl font-semibold leading-tight sm:text-6xl">{a.title}</h1>
        <p className="mt-6 text-lg leading-8">{a.description}</p>
        <div className="mt-6 flex flex-wrap gap-4 text-sm">
          <span>{vi ? 'Đăng ngày' : 'Published'}: {date(a.published_at)}</span>
          {a.reading_minutes && <span>{a.reading_minutes} {vi ? 'phút đọc' : 'min read'}</span>}
          {a.reviewed_at && <span>{vi ? 'Đã rà soát' : 'Reviewed'}: {date(a.reviewed_at)}</span>}
          {translationPath && <Link href={translationPath} className="underline">{vi ? 'Read in English' : 'Đọc tiếng Việt'}</Link>}
        </div>
      </div></header>

      <div className="mx-auto max-w-6xl px-5 py-12 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="wellness-prose min-w-0">
            {a.wellness_articles.cover_image_url && <figure className="mb-8">
              {/* Remote publisher URLs are displayed directly, never fetched by the image optimizer. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={a.wellness_articles.cover_image_url} alt={a.cover_image_alt} className="w-full rounded-3xl" loading="lazy" referrerPolicy="no-referrer" />
            </figure>}
            {a.wellness_articles.facebook_url && <p className="mb-8"><a href={a.wellness_articles.facebook_url} target="_blank" rel="noopener noreferrer" className="wellness-button">{vi ? 'Xem video đi kèm trên Facebook' : 'Watch the accompanying video on Facebook'} ↗</a></p>}
            {a.trust_meter && <TrustMeterWidget data={a.trust_meter} locale={a.locale} />}
            {a.takeaway && <div className="takeaway"><span>{vi ? 'Ý chính' : 'The takeaway'}</span><p>{a.takeaway}</p></div>}
            {a.quick_recipe && <QuickRecipeWidget data={a.quick_recipe} locale={a.locale} />}

            {/* Inline Safety Quiz in Article Flow (especially for mobile) */}
            {a.safety_quiz && (
              <div id="safety-quiz" className="lg:hidden scroll-mt-24">
                <SafetyQuizWidget quiz={a.safety_quiz} locale={a.locale} articleSlug={a.slug} mode="inline" />
              </div>
            )}

            {a.sections.map((section, i) => <section key={i}><h2>{section.title}</h2>
              {section.paragraphs.map((p, j) => <p key={j}>{p}</p>)}
              {section.image_url && <figure className="my-6">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={section.image_url} alt={section.image_alt || section.title} className="w-full rounded-2xl shadow-sm border border-stone-150" loading="lazy" referrerPolicy="no-referrer" />
                {section.image_alt && <figcaption className="mt-2 text-center text-xs text-stone-500 font-medium">{section.image_alt}</figcaption>}
              </figure>}
              {section.bullets?.length ? <ul>{section.bullets.map((b, j) => <li key={j}>{b}</li>)}</ul> : null}
            </section>)}

            {/* Inline Safety Quiz for Desktop in the reading flow */}
            {a.safety_quiz && (
              <div className="hidden lg:block">
                <SafetyQuizWidget quiz={a.safety_quiz} locale={a.locale} articleSlug={a.slug} mode="inline" />
              </div>
            )}

            {a.fact_checks?.length ? <FactChecksWidget items={a.fact_checks} locale={a.locale} /> : null}
            {a.faqs?.length ? <FaqsWidget items={a.faqs} locale={a.locale} /> : null}
            {a.sources.length > 0 && <section className="sources"><h2>{vi ? 'Nguồn tham khảo' : 'Sources'}</h2>
              {a.sources.map((s, i) => <a key={i} href={s.url} target="_blank" rel="noopener noreferrer">{s.label} ↗</a>)}
            </section>}
            {a.tool && <Link href={toolPath} className="wellness-button mt-8">{vi ? 'Mở công cụ liên quan' : 'Open the related tool'} →</Link>}
          </div>

          {/* Desktop Sticky Right Sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-6">
              {a.safety_quiz && (
                <SafetyQuizWidget quiz={a.safety_quiz} locale={a.locale} articleSlug={a.slug} mode="sidebar" />
              )}
              {a.tool && (
                <div className="rounded-3xl bg-[#eaf0e5] p-6 border border-[#d6e2d5]">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#526b62]">
                    {vi ? 'CÔNG CỤ LIÊN QUAN' : 'RELATED TOOL'}
                  </p>
                  <h4 className="mt-2 text-base font-bold text-[#18302b]">
                    {vi ? 'Kiểm chứng thêm các mẹo khác' : 'Check other viral remedies'}
                  </h4>
                  <p className="mt-1.5 text-xs text-[#526b62] leading-relaxed">
                    {vi ? 'Sử dụng công cụ Remedy Checker miễn phí của Botly.' : 'Use the free Botly Remedy Checker.'}
                  </p>
                  <Link href={toolPath} className="wellness-button mt-4 w-full text-center text-xs">
                    {vi ? 'Mở công cụ' : 'Open tool'} →
                  </Link>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>

      {/* Floating Quick Action for Mobile / Small Screens */}
      {a.safety_quiz && (
        <div className="fixed bottom-6 right-5 z-40 lg:hidden">
          <a
            href="#safety-quiz"
            className="flex items-center gap-2 rounded-full bg-[#18302b] px-4 py-3 text-xs font-bold text-white shadow-2xl shadow-black/40 border border-emerald-500/40 transition active:scale-95"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span>{vi ? 'Trắc nghiệm an toàn (15s)' : 'Safety Quiz (15s)'}</span>
          </a>
        </div>
      )}

      {/* Related Articles Section */}
      <RelatedArticlesSection currentSlug={a.slug} locale={a.locale} articles={relatedArticles} />
    </article></main>
  </WellnessShell>;
}
