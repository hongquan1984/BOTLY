import Link from 'next/link';
import type { PublishedArticle } from '@/lib/published-articles';
import { ArticleCard } from './ArticleCard';
import { ArrowRight, BookOpen } from 'lucide-react';

export function RelatedArticlesSection({
  currentSlug,
  locale,
  articles,
  categoryId,
}: {
  currentSlug: string;
  locale: 'vi' | 'en';
  articles: PublishedArticle[];
  categoryId?: string;
}) {
  const vi = locale === 'vi';

  // Determine category-specific URLs and copy
  let kicker = vi ? 'BÀI VIẾT KHOA HỌC ĐỒNG HÀNH' : 'RELATED SCIENTIFIC ARTICLES';
  let title = vi ? 'Các Bài Viết Y Sinh Khác Bạn Nên Đọc' : 'Explore More Molecular Analyses & Remedy Checks';
  let desc = vi
    ? 'Mổ xẻ cơ chế tế bào, phân tích dược lý học thực vật và trắc nghiệm an toàn thực chứng.'
    : 'Cellular mechanics, phytochemical evaluations, and clinical safety screenings.';
  let categoryUrl = vi ? '/vi/song-khoe/huong-dan' : '/en/wellness/guides';
  let buttonLabel = vi ? 'Xem Toàn Bộ Kho Bài Viết Y Sinh Học' : 'Explore The Complete Scientific Article Library';

  if (categoryId === 'healing') {
    kicker = vi ? 'CẨM NANG CHỮA LÀNH & HẠ CÁNH ĐÊM MUỘN' : 'MIDNIGHT HEALING & WIND-DOWN GUIDES';
    title = vi ? 'Các Bài Viết Thể Cảm & Giấc Ngủ Khác Bạn Nên Đọc' : 'Explore More Somatic & Bedtime Guides';
    desc = vi
      ? 'Giải mã khoa học thần kinh, thấu cảm tâm lý và nghi thức hạ nhiệt hệ thần kinh lúc nửa đêm.'
      : 'Neuroscience validation, somatic resets, and gentle bedtime companions.';
    categoryUrl = vi ? '/vi/song-khoe/chua-lanh' : '/en/wellness/healing';
    buttonLabel = vi ? 'Xem Toàn Bộ Chuyên Mục Chữa Lành' : 'Explore All Healing Guides';
  } else if (categoryId === 'weight') {
    kicker = vi ? 'CẨM NANG KIỂM SOÁT CÂN NẶNG KHOA HỌC' : 'WEIGHT MANAGEMENT GUIDES';
    title = vi ? 'Các Bài Viết Chuyển Hóa & Dinh Dưỡng Khác' : 'Explore More Metabolic & Nutrition Guides';
    desc = vi
      ? 'Phân tích khoa học trao đổi chất, cân bằng insulin và chiến lược dinh dưỡng chuẩn y khoa.'
      : 'Metabolic science, insulin sensitivity, and evidence-based nutritional strategies.';
    categoryUrl = vi ? '/vi/song-khoe/giam-can' : '/en/wellness/weight-management';
    buttonLabel = vi ? 'Xem Toàn Bộ Bài Viết Giảm Cân' : 'Explore All Weight Management Guides';
  }

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
              <span>{kicker}</span>
            </div>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#18302b] sm:text-3xl">
              {title}
            </h2>
            <p className="mt-1 text-sm text-[#4e665d]">
              {desc}
            </p>
          </div>

          <Link
            href={categoryUrl}
            className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-800 hover:text-emerald-950 hover:underline transition-colors shrink-0"
          >
            <span>{vi ? 'Xem tất cả' : 'View all'}</span>
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
            href={categoryUrl}
            className="inline-flex items-center gap-2.5 rounded-2xl bg-[#18302b] px-8 py-4 text-sm font-bold text-white shadow-xl shadow-[#18302b]/15 hover:bg-emerald-900 transition-all hover:-translate-y-0.5"
          >
            <span>{buttonLabel}</span>
            <ArrowRight className="h-4 w-4 text-emerald-400" />
          </Link>
        </div>
      </div>
    </section>
  );
}
