import Link from 'next/link';
import type { PublishedArticle } from '@/lib/published-articles';
import { articlePath } from '@/lib/article-publishing';
import { ArrowRight, Clock, ShieldCheck, Sparkles, Moon } from 'lucide-react';

export function getArticleCoverImage(article: PublishedArticle): string {
  if (article.wellness_articles?.cover_image_url) {
    return article.wellness_articles.cover_image_url;
  }
  const slug = (article.slug || '').toLowerCase();
  if (slug.includes('tomato') && (slug.includes('olive') || slug.includes('oil'))) return '/ebooks/antioxidants/tomato-olive-oil-hero.png';
  if (slug.includes('green-tea') || slug.includes('tea') || slug.includes('lemon') || slug.includes('citrus')) return '/ebooks/antioxidants/green-tea-citrus-hero.png';
  if (slug.includes('avocado')) return '/ebooks/antioxidants/avocado-tomato-hero.png';
  if (slug.includes('lentil') || slug.includes('rice')) return '/ebooks/blood-sugar/lentils-rice-hero.png';
  if (slug.includes('oat') || slug.includes('berr')) return '/ebooks/blood-sugar/oats-berries-hero.png';
  if (slug.includes('bean') || slug.includes('toast')) return '/ebooks/blood-sugar/beans-toast-hero.png';
  if (slug.includes('broccoli') || slug.includes('mustard')) return '/ebooks/antioxidants/broccoli-olive-oil-hero.png';
  if (slug.includes('carrot') || slug.includes('hummus')) return '/ebooks/antioxidants/carrot-hummus-hero.png';
  if (slug.includes('kimchi')) return '/ebooks/antioxidants/kimchi-rice-hero.png';
  if (slug.includes('turmeric') || slug.includes('pepper')) return '/ebooks/antioxidants/tomato-olive-oil-hero.png';

  const cat = article.wellness_articles?.category_id;
  if (cat === 'healing') return '/characters/lumi-healing.png';
  if (cat === 'weight') return '/ebooks/covers/vol3-weight-management.png';

  return '/ebooks/antioxidants/tomato-olive-oil-hero.png';
}

export function ArticleCard({
  article,
  locale
}: {
  article: PublishedArticle;
  locale: 'vi' | 'en';
}) {
  const vi = locale === 'vi';
  const href = articlePath(locale, article.slug);
  const coverImg = getArticleCoverImage(article);
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
          onError={(e) => {
            e.currentTarget.src = '/ebooks/antioxidants/tomato-olive-oil-hero.png';
          }}
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

      <div className="flex flex-1 flex-col justify-between p-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800">
            <span>{article.eyebrow || 'Y SINH & DINH DƯỠNG'}</span>
            <span>•</span>
            <span className="flex items-center gap-1 text-slate-500 font-normal">
              <Clock className="h-3 w-3" />
              {article.reading_minutes || 3} {vi ? 'phút' : 'min'}
            </span>
          </div>

          <h3 className="mt-2.5 text-lg font-black leading-snug tracking-tight text-[#18302b] group-hover:text-emerald-700 transition">
            {article.title}
          </h3>

          <p className="mt-2 text-xs text-[#526b62] line-clamp-2 leading-relaxed">
            {article.description}
          </p>
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-xs font-bold text-emerald-850">
          <span>{vi ? 'Khám phá ngay' : 'Explore guide'}</span>
          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 text-emerald-700" />
        </div>
      </div>
    </Link>
  );
}
