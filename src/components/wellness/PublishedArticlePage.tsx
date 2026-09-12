import Link from 'next/link';
import type { PublishedArticle } from '@/lib/published-articles';
import { portals } from '@/data/wellness-portals';
import { WellnessShell } from './WellnessShell';
import {
  TrustMeterWidget, QuickRecipeWidget, FactChecksWidget, FaqsWidget, SafetyQuizWidget,
  SomaticSignalsWidget, WinddownProtocolWidget, MindTrapsWidget, SomaticQuizWidget
} from './ArticleWidgets';
import { MindfulOnboardingWizard } from './MindfulOnboardingWizard';
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
      {/* 🌙 Immersive Bedtime Onboarding Sanctuary for Healing Articles */}
      {a.somatic_signals && a.winddown_protocol ? (
        <section className="relative min-h-[calc(100vh-4.5rem)] bg-gradient-to-b from-[#060911] via-[#0a0f1d] to-[#0f172a] px-4 py-8 sm:px-6 lg:px-8 flex flex-col justify-center items-center">
          <div className="w-full max-w-3xl mx-auto">
            {/* Ambient Top Bar */}
            <div className="mb-4 flex items-center justify-between text-xs text-indigo-300/80">
              <Link href={`${base}/${portal.slug}`} className="hover:text-white transition flex items-center gap-1.5 font-medium">
                <span>← {portal.name}</span>
              </Link>
              {translationPath && (
                <Link href={translationPath} className="rounded-full bg-indigo-950/70 px-3 py-1 text-xs text-slate-300 border border-indigo-800/40 hover:text-white transition">
                  {vi ? 'English version' : 'Bản Tiếng Việt'} 🌐
                </Link>
              )}
            </div>

            {/* Title & Theme Banner */}
            <div className="text-center mb-6">
              <span className="inline-block rounded-full bg-amber-400/10 px-3 py-0.5 text-[11px] font-bold uppercase tracking-[0.2em] text-amber-300 border border-amber-400/20">
                {a.eyebrow || (vi ? 'HẠ CÁNH THỂ CẢM ĐÊM MUỘN' : 'BEDTIME SOMATIC GROUNDING')}
              </span>
              <h1 className="mt-3 text-2xl font-black text-white sm:text-4xl tracking-tight leading-snug">
                {a.title}
              </h1>
              <p className="mt-2 text-xs text-slate-400 sm:text-sm max-w-xl mx-auto line-clamp-2">
                {a.description}
              </p>
            </div>

            {/* The 5-Step Interactive Bedtime Onboarding Stepper */}
            <MindfulOnboardingWizard
              somaticSignals={a.somatic_signals}
              winddownProtocol={a.winddown_protocol}
              mindTraps={a.mind_traps}
              somaticQuiz={a.somatic_quiz}
              locale={a.locale}
            />

            {/* Soothing Scroll-down hint */}
            <div className="mt-6 text-center">
              <a
                href="#full-article"
                className="inline-flex items-center gap-2 rounded-full border border-indigo-800/50 bg-indigo-950/40 px-5 py-2 text-xs font-semibold text-slate-400 hover:text-amber-200 hover:border-amber-400/40 transition"
              >
                <span>{vi ? 'Hoặc cuộn xuống đọc bài phân tích y sinh & xem video' : 'Or scroll down to read in-depth science & video'}</span>
                <span>↓</span>
              </a>
            </div>
          </div>
        </section>
      ) : (
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
      )}

      <div className="mx-auto max-w-6xl px-5 py-12 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="wellness-prose min-w-0">
            {/* Check if healing category with somatic signals */}
            {a.somatic_signals && a.winddown_protocol ? (
              <div id="full-article" className="space-y-8 scroll-mt-10">
                {a.wellness_articles.cover_image_url && <figure className="mb-8">
                  {/* Remote publisher URLs are displayed directly, never fetched by the image optimizer. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={a.wellness_articles.cover_image_url} alt={a.cover_image_alt} className="w-full rounded-3xl" loading="lazy" referrerPolicy="no-referrer" />
                </figure>}
                {a.wellness_articles.facebook_url && <p className="mb-8"><a href={a.wellness_articles.facebook_url} target="_blank" rel="noopener noreferrer" className="wellness-button">{vi ? 'Xem video đi kèm trên Facebook' : 'Watch the accompanying video on Facebook'} ↗</a></p>}

                <div className="flex items-center gap-3 pb-4 border-b border-stone-200">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-950 text-xl text-amber-300 shadow">
                    📖
                  </span>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-indigo-900/70">
                      {vi ? 'CHIỀU SÂU KHOA HỌC' : 'IN-DEPTH SCIENCE'}
                    </p>
                    <h2 className="text-2xl font-bold text-slate-900 m-0">
                      {vi ? 'Bài Phân Tích Chuyên Sâu & Giải Mã 2h Sáng' : 'Scientific Analysis & Midnight Deconstruction'}
                    </h2>
                  </div>
                </div>

                  {a.takeaway && <div className="takeaway"><span>{vi ? 'Ý chính' : 'The takeaway'}</span><p>{a.takeaway}</p></div>}

                  {a.sections.map((section, i) => <section key={i}><h2>{section.title}</h2>
                    {section.paragraphs.map((p, j) => <p key={j}>{p}</p>)}
                    {section.image_url && <figure className="my-6">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={section.image_url} alt={section.image_alt || section.title} className="w-full rounded-2xl shadow-sm border border-stone-150" loading="lazy" referrerPolicy="no-referrer" />
                      {section.image_alt && <figcaption className="mt-2 text-center text-xs text-stone-500 font-medium">{section.image_alt}</figcaption>}
                    </figure>}
                    {section.bullets?.length ? <ul>{section.bullets.map((b, j) => <li key={j}>{b}</li>)}</ul> : null}
                  </section>)}

                  {/* Midnight FAQs */}
                  {a.midnight_faqs?.length ? (
                    <FaqsWidget items={a.midnight_faqs} locale={a.locale} isMidnight={true} />
                  ) : null}
                </div>
            ) : (
              <>
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

                {a.faqs?.length ? (
                  <FaqsWidget items={a.faqs} locale={a.locale} isMidnight={false} />
                ) : null}
              </>
            )}

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
              {a.somatic_quiz && (
                <SomaticQuizWidget quiz={a.somatic_quiz} locale={a.locale} articleSlug={a.slug} mode="sidebar" />
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
              {a.wellness_articles.category_id === 'healing' && !a.tool && (
                <div className="rounded-3xl bg-gradient-to-br from-[#131b2e] to-[#0f172a] p-6 border border-indigo-900/40 text-slate-100 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                    SOULSCAPE WORLD
                  </p>
                  <h4 className="mt-2 text-base font-bold text-white">
                    {vi ? 'Không gian chữa lành đêm muộn' : 'Late-Night Healing Sanctuary'}
                  </h4>
                  <p className="mt-1.5 text-xs text-slate-300 leading-relaxed">
                    {vi ? 'Thiền định & thấu cảm cảm xúc không áp lực chuỗi ngày.' : 'Emotion-focused meditation without streak pressure.'}
                  </p>
                  <a
                    href="https://soulscapeworld.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-indigo-500"
                  >
                    <span>{vi ? 'Khám phá Soulscape' : 'Explore Soulscape'}</span>
                    <span>↗</span>
                  </a>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>

      {/* Floating Quick Action for Mobile / Small Screens */}
      {a.safety_quiz ? (
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
      ) : a.somatic_quiz && !a.somatic_signals ? (
        <div className="fixed bottom-6 right-5 z-40 lg:hidden">
          <a
            href="#somatic-quiz"
            className="flex items-center gap-2 rounded-full bg-[#0f172a] px-4 py-3 text-xs font-bold text-white shadow-2xl shadow-black/40 border border-indigo-400/40 transition active:scale-95"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
            </span>
            <span>{vi ? 'Trắc nghiệm thể cảm (15s)' : 'Somatic Check (15s)'}</span>
          </a>
        </div>
      ) : null}

      {/* Related Articles Section */}
      <RelatedArticlesSection currentSlug={a.slug} locale={a.locale} articles={relatedArticles} categoryId={a.wellness_articles.category_id} />
    </article></main>
  </WellnessShell>;
}
