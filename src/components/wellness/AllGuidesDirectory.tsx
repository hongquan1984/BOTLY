'use client';

import { useState, useMemo } from 'react';
import type { PublishedArticle } from '@/lib/published-articles';
import { ArticleCard } from './ArticleCard';
import { Search, Sparkles, BookOpen, Layers, ShieldCheck } from 'lucide-react';

export function AllGuidesDirectory({
  initialArticles,
  locale
}: {
  initialArticles: PublishedArticle[];
  locale: 'vi' | 'en';
}) {
  const vi = locale === 'vi';
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = useMemo(() => [
    { id: 'all', label: vi ? 'Tất cả bài viết' : 'All Guides', icon: Layers },
    { id: 'health-tips', label: vi ? 'Mẹo Sức Khỏe' : 'Health Tips', icon: Sparkles },
    { id: 'weight', label: vi ? 'Giảm Cân Bền Vững' : 'Weight Management', icon: ShieldCheck },
    { id: 'healing', label: vi ? 'Chữa Lành & Giấc Ngủ' : 'Healing & Rest', icon: BookOpen },
  ], [vi]);

  const filteredArticles = useMemo(() => {
    return initialArticles.filter(art => {
      const matchCategory =
        selectedCategory === 'all' ||
        art.wellness_articles?.category_id === selectedCategory;

      const matchSearch =
        searchTerm.trim() === '' ||
        art.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        art.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        art.slug.toLowerCase().includes(searchTerm.toLowerCase());

      return matchCategory && matchSearch;
    });
  }, [initialArticles, selectedCategory, searchTerm]);

  return (
    <div>
      {/* Search & Category Filter Bar */}
      <div className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {categories.map(cat => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#18302b] text-white shadow-md shadow-[#18302b]/20 scale-105'
                    : 'bg-white text-[#4e665d] border border-[#dce6dc] hover:border-emerald-500 hover:text-[#18302b]'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isSelected ? 'text-emerald-400' : 'text-emerald-600'}`} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#758f84]" />
          <input
            type="text"
            placeholder={vi ? 'Tìm bài viết, hoạt chất...' : 'Search guides, bioactives...'}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full rounded-2xl border border-[#dce6dc] bg-white py-2.5 pl-10 pr-4 text-xs font-medium text-[#18302b] placeholder-[#758f84] focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-sm"
          />
        </div>
      </div>

      {/* Results Header */}
      <div className="mb-6 flex items-center justify-between text-xs text-[#637d73]">
        <p>
          {vi ? 'Hiển thị' : 'Showing'}{' '}
          <strong className="text-[#18302b] font-bold">{filteredArticles.length}</strong>{' '}
          {vi ? 'bài viết khoa học y sinh' : 'evidence-based guides'}
        </p>
      </div>

      {/* Articles Grid */}
      {filteredArticles.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredArticles.map(article => (
            <ArticleCard key={article.slug} article={article} locale={locale} />
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-[#dce6dc] bg-white/60 p-12 text-center">
          <BookOpen className="mx-auto h-12 w-12 text-emerald-600/40 mb-3" />
          <h3 className="text-base font-bold text-[#18302b]">
            {vi ? 'Không tìm thấy bài viết phù hợp' : 'No matching guides found'}
          </h3>
          <p className="mt-1 text-xs text-[#637d73]">
            {vi ? 'Hãy thử tìm kiếm với từ khóa khác hoặc chọn tất cả danh mục.' : 'Try adjusting your search terms or selecting all categories.'}
          </p>
          <button
            onClick={() => { setSearchTerm(''); setSelectedCategory('all'); }}
            className="mt-4 inline-flex rounded-xl bg-emerald-50 border border-emerald-300/60 px-4 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition-colors"
          >
            {vi ? 'Xóa bộ lọc' : 'Clear filters'}
          </button>
        </div>
      )}
    </div>
  );
}
