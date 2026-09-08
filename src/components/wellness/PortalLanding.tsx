import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ShieldCheck, BookOpen } from "lucide-react";
import type { WellnessLocale } from "@/data/wellness";
import { portals } from "@/data/wellness-portals";
import { WellnessShell } from "./WellnessShell";
import { NewsletterForm } from "./NewsletterForm";
import { listPublishedArticles } from "@/lib/published-articles";
import { ArticleCard } from "./ArticleCard";
import { VideoCard } from "./VideoCard";

export async function PortalLanding({ locale }: { locale: WellnessLocale }) {
  const vi = locale === "vi";
  const base = vi ? "/vi/song-khoe" : "/en/wellness";
  const allGuidesUrl = vi ? "/vi/song-khoe/huong-dan" : "/en/wellness/guides";

  // Fetch latest published articles for the 3 portals
  const publishedArticles = await listPublishedArticles(locale, undefined, 6);

  const items = portals[locale].map(portal => {
    // Pick the most relevant video for this portal
    const video = portal.videos[0];
    return {
      ...portal,
      video,
    };
  });

  return (
    <WellnessShell locale={locale}>
      <main>
        {/* Friendly Home Hero */}
        <section className="friendly-home-hero">
          <div className="mx-auto max-w-7xl px-5 py-16 text-center lg:px-8">
            <p className="section-kicker">BOTLY WELLNESS</p>
            <h1>
              {vi
                ? "Hôm nay bạn muốn chăm sóc phần nào của mình?"
                : "What would you like to care for today?"}
            </h1>
            <p>
              {vi
                ? "Ba người bạn, ba không gian riêng—cùng giúp bạn tạo những bước nhỏ dễ thực hiện."
                : "Three friendly guides, three clear spaces—each helping you take small, practical steps."}
            </p>
            <div className="mt-12 grid gap-5 lg:grid-cols-3">
              {items.map(portal => (
                <Link
                  href={`${base}/${portal.slug}`}
                  key={portal.id}
                  className={`portal-home-card tone-${portal.tone}`}
                >
                  <div className="portal-home-image">
                    <Image
                      src={portal.mascot}
                      alt={`${portal.mascotName} – ${portal.name}`}
                      width={380}
                      height={450}
                      priority
                    />
                  </div>
                  <div className="portal-home-copy">
                    <span>{portal.mascotName}</span>
                    <h2>{portal.name}</h2>
                    <p>{portal.tagline}</p>
                    <b>
                      {vi ? "Bước vào" : "Enter this space"}
                      <ArrowRight />
                    </b>
                  </div>
                </Link>
              ))}
            </div>
            <p className="mt-7 flex items-center justify-center gap-2 text-xs text-[#6b7d76]">
              <ShieldCheck className="h-4 w-4" />
              {vi
                ? "Wellness hằng ngày, không chẩn đoán hay hứa hẹn chữa bệnh."
                : "Everyday wellness—no diagnosis or miracle-cure promises."}
            </p>
          </div>
        </section>

        {/* 01: Starting Tools */}
        <section className="mx-auto max-w-7xl px-5 py-18 lg:px-8">
          <div className="section-row">
            <div>
              <p className="section-kicker">01 — {vi ? "CÔNG CỤ" : "TOOLS"}</p>
              <h2 className="section-title">
                {vi ? "Mỗi không gian, một công cụ để bắt đầu" : "One friendly starting tool for each space"}
              </h2>
            </div>
          </div>
          <div className="mt-9 grid gap-5 lg:grid-cols-3">
            {items.map(portal => (
              <Link
                href={portal.featuredTool.href}
                key={portal.id}
                className={`home-tool-feature tone-${portal.tone}`}
              >
                <div>
                  <span>{portal.name}</span>
                  <h3>{portal.featuredTool.title}</h3>
                  <p>{portal.featuredTool.description}</p>
                  <b>
                    {vi ? "Mở công cụ" : "Open tool"}
                    <ArrowRight />
                  </b>
                </div>
                <Image src={portal.mascot} alt="" width={170} height={210} />
              </Link>
            ))}
          </div>
        </section>

        {/* 02: Companion Video Reels */}
        <section className="bg-[#eaf0e5]">
          <div className="mx-auto max-w-7xl px-5 py-18 lg:px-8">
            <div className="section-row">
              <div>
                <p className="section-kicker">02 — {vi ? "VIDEO ĐỒNG HÀNH" : "COMPANION REELS"}</p>
                <h2 className="section-title">
                  {vi ? "Video mới từ ba không gian" : "Fresh videos from all three spaces"}
                </h2>
              </div>
              <span className="text-xs font-semibold text-[#526d62]">
                {vi ? "Video ngắn Facebook Reels, giải thích trực quan cơ chế sinh học" : "Short Facebook Reels with clear molecular insights"}
              </span>
            </div>
            <div className="mt-9 grid gap-5 lg:grid-cols-3">
              {items.map(portal => (
                <VideoCard
                  key={portal.id}
                  video={portal.video}
                  locale={locale}
                  categoryName={portal.name}
                />
              ))}
            </div>
          </div>
        </section>

        {/* 03: Latest Evidence-Based Articles */}
        <section className="mx-auto max-w-7xl px-5 py-18 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pb-6 border-b border-[#d8e4d8]">
            <div>
              <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-emerald-800">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>03 — {vi ? "BÀI VIẾT Y SINH MỚI NHẤT" : "LATEST EVIDENCE-BASED GUIDES"}</span>
              </div>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#18302b] sm:text-3xl">
                {vi ? "Một điều hữu ích từ mỗi góc nhìn" : "One useful insight for your body today"}
              </h2>
              <p className="mt-1 text-sm text-[#4e665d]">
                {vi
                  ? "Kiểm chứng khoa học Trust Meter, mô phỏng giải phẫu 3D và công thức bỏ túi tiện lợi."
                  : "Clinical Trust Meter scores, 3D anatomical simulations, and 2-minute recipes."}
              </p>
            </div>

            <Link
              href={allGuidesUrl}
              className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-800 hover:text-emerald-950 hover:underline transition-colors shrink-0"
            >
              <span>{vi ? "Xem tất cả bài viết" : "View all articles"}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {publishedArticles.slice(0, 3).map(article => (
              <ArticleCard key={article.slug} article={article} locale={locale} />
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link
              href={allGuidesUrl}
              className="inline-flex items-center gap-2 rounded-full border border-[#c5d8c5] bg-white px-7 py-3.5 text-sm font-bold text-[#18302b] shadow-sm hover:border-emerald-600 hover:bg-emerald-50 transition-all"
            >
              <BookOpen className="h-4 w-4 text-emerald-600" />
              <span>{vi ? "Khám phá toàn bộ kho bài viết y sinh" : "Explore complete biomedical library"}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        {/* 04: Newsletter Subscribe */}
        <section className="mx-auto max-w-7xl px-5 pb-20 lg:px-8">
          <div className="newsletter-card">
            <div>
              <p className="section-kicker !text-[#cfef9b]">BOTLY WEEKLY</p>
              <h2>{vi ? "Một tuần nhẹ nhàng hơn." : "A gentler week, delivered."}</h2>
              <p>
                {vi
                  ? "Mỗi Chủ nhật: một gợi ý giảm cân lành mạnh, một thực hành chữa lành và một health tip được kiểm tra."
                  : "Every Sunday: one weight-friendly idea, one healing practice and one carefully checked health tip."}
              </p>
            </div>
            <NewsletterForm
              locale={locale}
              placeholder={vi ? "Địa chỉ email" : "Email address"}
              buttonLabel={vi ? "Tham gia miễn phí" : "Join free"}
            />
            <div className="col-span-full flex flex-wrap gap-x-6 gap-y-2 text-xs text-white/55">
              {(vi
                ? ["Không spam", "Hủy bất kỳ lúc nào", "Nội dung có chọn lọc"]
                : ["No spam", "Unsubscribe anytime", "Carefully curated"]
              ).map(x => (
                <span key={x} className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" />
                  {x}
                </span>
              ))}
            </div>
          </div>
        </section>
      </main>
    </WellnessShell>
  );
}
