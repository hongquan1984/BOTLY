import Link from 'next/link';
import type { PublishedArticle } from '@/lib/published-articles';
import { articlePath } from '@/lib/article-publishing';
import { ArrowRight, Clock, ShieldCheck, Sparkles, Moon } from 'lucide-react';

export function ArticleCard({
  article,
  locale
}: {
  article: PublishedArticle;
  locale: 'vi' | 'en';
}) {
  const vi = locale === 'vi';
  const href = articlePath(locale, article.slug);
  const coverImg = article.wellness_articles?.cover_image_url || '/logo.png';
  const score = article.trust_meter?.score;

  const categoryName = {
    'health-tips': vi ? 'Mẹo Sức Khỏe' : 'Health Tips',
    'weight': vi ? 'Giảm Cân Bền Vững' : 'Weight Goals',
    'healing': vi ? 'Chữa Lành & Thư Giãn' : 'Healing & Mind'
  }[article.wellness_articles?.category_id || 'health-tips'];

  return (
    <Link
      href={href}
      className="group flex flex-col overflow-hidden rounded-3xl border border-[#dce6dc] bg-white text-[#18302b] shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500 hover:shadow-xl hover:shadow-emerald-950/10"
    >
      {/* Article Cover Avatar */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#eaf0e5]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={coverImg}
          alt={article.cover_image_alt || article.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          referrerPolicy="no-referrer"
        />

        {/* Category Pill */}
        <div className="absolute top-3.5 left-3.5 flex flex-wrap gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[#18302b] shadow-md backdrop-blur-sm">
            <Sparkles className="h-3 w-3 text-emerald-600" />
            {categoryName}
          </span>
        </div>

        {/* Trust Meter Score or Somatic Reset Badge */}
        {score ? (
          <div className="absolute bottom-3.5 right-3.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#18302b]/90 px-2.5 py-1 text-[11px] font-bold text-white shadow-md backdrop-blur-sm border border-emerald-500/30">
              <ShieldCheck className="h-3 w-3 text-emerald-400" />
              {score.toFixed(1)} / 10 {vi ? 'Tin cậy' : 'Trust'}
            </span>
          </div>
        ) : article.winddown_protocol ? (
          <div className="absolute bottom-3.5 right-3.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#0f172a]/90 px-2.5 py-1 text-[11px] font-bold text-indigo-200 shadow-md backdrop-blur-sm border border-indigo-400/40">
              <Moon className="h-3 w-3 text-indigo-300" />
              {vi ? 'Hạ cánh giấc ngủ' : 'Bedtime Reset'}
            </span>
          </div>
        ) : null}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        {/* Meta Info */}
        <div className="mb-2.5 flex items-center gap-3 text-xs text-[#637d73]">
          {article.reading_minutes && (
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-emerald-600" />
              {article.reading_minutes} {vi ? 'phút đọc' : 'min read'}
            </span>
          )}
          <span>•</span>
          <span>
            {new Date(article.published_at).toLocaleDateString(vi ? 'vi-VN' : 'en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold leading-snug text-[#18302b] transition-colors group-hover:text-emerald-700 line-clamp-2">
          {article.title}
        </h3>

        {/* Excerpt */}
        <p className="mt-2 text-xs leading-relaxed text-[#4e665d] line-clamp-2 flex-1">
          {article.takeaway || article.description}
        </p>

        {/* Read More Footer */}
        <div className="mt-5 flex items-center justify-between border-t border-[#f0f4ef] pt-3 text-xs font-bold text-emerald-700">
          <span>{vi ? 'Đọc bài viết' : 'Read guide'}</span>
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f0f5ee] text-emerald-800 transition-transform group-hover:translate-x-1 group-hover:bg-emerald-600 group-hover:text-white">
            <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
