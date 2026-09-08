import Link from 'next/link';
import type { PublishedArticle } from '@/lib/published-articles';
import { ArticleCard } from './ArticleCard';
import { ArrowRight, BookOpen } from 'lucide-react';

export function RelatedArticlesSection({
  currentSlug,
  locale,
  articles
}: {
  currentSlug: string;
  locale: 'vi' | 'en';
  articles: PublishedArticle[];
}) {
  const vi = locale === 'vi';
  const allGuidesUrl = vi ? '/vi/song-khoe/huong-dan' : '/en/wellness/guides';

  // Filter out current article and take up to 10
  const related = articles.filter(a => a.slug !== currentSlug).slice(0, 10);

  if (related.length === 0) return null;

  return (
    <section className="border-t border-[#d8e4d8] bg-gradient-to-b from-[#f7f9f6] to-[#edf4ec] py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pb-8 border-b border-[#d8e4d8]">
          <div>
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-emerald-800">
              <BookOpen className="h-4 w-4 text-emerald-600" />
              <span>{vi ? 'BÀI VIẾT KHOA HỌC ĐỒNG HÀNH' : 'RELATED SCIENTIFIC ARTICLES'}</span>
            </div>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#18302b] sm:text-3xl">
              {vi ? 'Các Bài Viết Y Sinh Khác Bạn Nên Đọc' : 'Explore More Molecular Analyses & Remedy Checks'}
            </h2>
            <p className="mt-1 text-sm text-[#4e665d]">
              {vi
                ? 'Mổ xẻ cơ chế tế bào, phân tích dược lý học thực vật và trắc nghiệm an toàn thực chứng.'
                : 'Cellular mechanics, phytochemical evaluations, and clinical safety screenings.'}
            </p>
          </div>

          <Link
            href={allGuidesUrl}
            className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-800 hover:text-emerald-950 hover:underline transition-colors shrink-0"
          >
            <span>{vi ? 'Xem tất cả bài viết' : 'View all articles'}</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* 10 Related Article Cards Grid */}
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {related.map(article => (
            <ArticleCard key={article.slug} article={article} locale={locale} />
          ))}
        </div>

        {/* Big Bottom Action */}
        <div className="mt-12 text-center">
          <Link
            href={allGuidesUrl}
            className="inline-flex items-center gap-2.5 rounded-2xl bg-[#18302b] px-8 py-4 text-sm font-bold text-white shadow-xl shadow-[#18302b]/15 hover:bg-emerald-900 transition-all hover:-translate-y-0.5"
          >
            <span>{vi ? 'Xem Toàn Bộ Kho Bài Viết Y Sinh Học' : 'Explore The Complete Scientific Article Library'}</span>
            <ArrowRight className="h-4 w-4 text-emerald-400" />
          </Link>
        </div>
      </div>
    </section>
  );
}
