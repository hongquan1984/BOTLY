import type { Metadata } from 'next';
import { listPublishedArticles } from '@/lib/published-articles';
import { WellnessShell } from '@/components/wellness/WellnessShell';
import { AllGuidesDirectory } from '@/components/wellness/AllGuidesDirectory';
import { Sparkles, ShieldCheck } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Kho Bài Viết Y Sinh Thực Chứng & Cơ Chế Dược Tính | Botly Wellness',
  description: 'Khám phá thư viện bài viết khoa học giải mã các mẹo sức khỏe, bài thuốc tự nhiên, mô phỏng 3D giải phẫu tế bào và trắc nghiệm an toàn.',
  alternates: {
    canonical: '/vi/song-khoe/huong-dan',
    languages: {
      en: '/en/wellness/guides',
      vi: '/vi/song-khoe/huong-dan',
      'x-default': '/en/wellness/guides',
    },
  }
};

export default async function VietnameseGuidesDirectoryPage() {
  const articles = await listPublishedArticles('vi', undefined, 50);

  return (
    <WellnessShell locale="vi">
      <main className="bg-[#f7f9f6] min-h-screen">
        {/* Hero Header */}
        <section className="border-b border-[#d8e4d8] bg-gradient-to-b from-[#eaf2e8] to-[#f7f9f6] py-14 sm:py-18">
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-800 border border-emerald-300/40 shadow-sm backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                <span>KHO BÀI VIẾT Y SINH THỰC CHỨNG BOTLY</span>
              </div>
              <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-[#18302b] sm:text-5xl leading-tight">
                Toàn Bộ Bài Viết Khoa Học & Phân Tích Dược Tính Tự Nhiên
              </h1>
              <p className="mt-4 text-base leading-relaxed text-[#4e665d] sm:text-lg">
                Giải mã các mẹo dân gian dưới lăng kính y học hiện đại: phân tích cơ chế tế bào, mô phỏng 3D giải phẫu, thang điểm kiểm chứng Trust Meter và công cụ trắc nghiệm mức độ phù hợp sinh học.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-6 text-xs font-medium text-[#526d62]">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <span>100% Tham vấn Y học Thực chứng (PubMed/EASL/AASLD)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                  <span>Đi kèm Thước đo Trust Meter & Công thức bỏ túi 2 phút</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Directory Content */}
        <section className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
          <AllGuidesDirectory initialArticles={articles} locale="vi" />
        </section>
      </main>
    </WellnessShell>
  );
}
