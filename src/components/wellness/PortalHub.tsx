import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Play, ShieldCheck, Sparkles, BookOpen } from "lucide-react";
import type { Portal } from "@/data/wellness-portals";
import type { WellnessLocale } from "@/data/wellness";
import { WellnessShell } from "./WellnessShell";
import { listPublishedArticles } from "@/lib/published-articles";
import { articlePath } from "@/lib/article-publishing";
import { ArticleCard } from "./ArticleCard";
import { VideoCard, type VideoItem } from "./VideoCard";

export async function PortalHub({ locale, portal }: { locale: WellnessLocale; portal: Portal }) {
  const vi = locale === "vi";
  const allGuidesUrl = vi ? "/vi/song-khoe/huong-dan" : "/en/wellness/guides";

  // Fetch category-specific articles first, fallback to all published articles if category is sparse
  let articles = await listPublishedArticles(locale, portal.id, 12);
  if (articles.length === 0) {
    articles = await listPublishedArticles(locale, undefined, 6);
  }

  // Map articles that have Facebook reels
  const dbVideos: VideoItem[] = articles
    .filter(a => a.wellness_articles?.facebook_url)
    .map(a => ({
      title: a.title,
      duration: "Facebook Reel",
      href: a.wellness_articles.facebook_url!,
      thumbnail: a.wellness_articles.cover_image_url || "/articles/pineapple-cucumber-liver/cover.jpg",
      articleSlug: a.slug,
      categoryName: portal.name,
    }));

  // Prioritize curated portal videos, then fill with unique db videos
  const candidateVideos = [...portal.videos, ...dbVideos];
  const videos: VideoItem[] = [];
  const seenThumbnails = new Set<string>();

  for (const v of candidateVideos) {
    const thumb = v.thumbnail || "";
    if (thumb && seenThumbnails.has(thumb)) continue;
    if (thumb) seenThumbnails.add(thumb);
    videos.push({
      ...v,
      categoryName: portal.name,
    });
    if (videos.length >= 3) break;
  }

  return (
    <WellnessShell locale={locale}>
      <main>
        {/* Portal Hero Banner */}
        <section className={`portal-hero tone-${portal.tone}`}>
          <div className="mx-auto grid max-w-7xl items-center gap-8 px-5 py-14 lg:grid-cols-[1fr_.75fr] lg:px-8">
            <div>
              <p className="section-kicker">BOTLY · {portal.name.toUpperCase()}</p>
              <h1 className="mt-2 text-4xl font-extrabold tracking-tight sm:text-5xl">{portal.tagline}</h1>
              <p className="mt-4 text-base leading-relaxed text-[#4e665d] sm:text-lg">{portal.description}</p>
              <div className="mt-7 flex flex-wrap gap-4">
                <Link href={portal.featuredTool.href} className="wellness-button">
                  {vi ? "Bắt đầu ngay" : "Start here"}
                  <ArrowRight />
                </Link>
                <Link
                  href={allGuidesUrl}
                  className="inline-flex items-center gap-2 rounded-full border border-[#c5d8c5] bg-white/80 px-6 py-3 text-sm font-bold text-[#18302b] shadow-sm hover:bg-white hover:border-emerald-600 transition-all"
                >
                  <BookOpen className="h-4 w-4 text-emerald-600" />
                  {vi ? "Xem kho bài viết" : "Explore guides"}
                </Link>
              </div>
            </div>
            <div className="portal-mascot">
              <Image src={portal.mascot} alt={`${portal.mascotName}, ${portal.name} mascot`} width={520} height={620} priority />
              <span>{vi ? `Xin chào, mình là ${portal.mascotName}!` : `Hi, I'm ${portal.mascotName}!`}</span>
            </div>
          </div>
        </section>

        {/* 01: Featured Tool & Tools Grid */}
        <section className="mx-auto max-w-7xl px-5 py-18 lg:px-8">
          <p className="section-kicker">01 — {vi ? "CÔNG CỤ NỔI BẬT" : "FEATURED TOOL"}</p>
          <div className={`featured-tool tone-${portal.tone}`}>
            <div>
              <span className="tool-icon"><Sparkles /></span>
              <h2>{portal.featuredTool.title}</h2>
              <p>{portal.featuredTool.description}</p>
              <Link href={portal.featuredTool.href} className="wellness-button mt-6">
                {vi ? "Mở công cụ" : "Open the tool"}
                <ArrowRight />
              </Link>
            </div>
            <Image src={portal.mascot} alt="" width={260} height={320} />
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {portal.tools.map(tool => (
              <Link key={tool.title} href={tool.href} className="friendly-tool-box">
                <span>✦</span>
                <h3>{tool.title}</h3>
                <p>{tool.description}</p>
                <ArrowRight />
              </Link>
            ))}
          </div>
        </section>

        {/* 02: Videos Section */}
        <section className="bg-[#eaf0e5]">
          <div className="mx-auto max-w-7xl px-5 py-18 lg:px-8">
            <div className="section-row">
              <div>
                <p className="section-kicker">02 — {vi ? "VIDEO ĐỒNG HÀNH" : "COMPANION REELS"}</p>
                <h2 className="section-title">{vi ? `Xem cùng ${portal.mascotName}` : `Watch with ${portal.mascotName}`}</h2>
              </div>
              <span className="text-xs font-semibold text-[#526d62]">
                {vi ? "Video ngắn Facebook Reels, giải thích trực quan cơ chế sinh học" : "Short Facebook Reels with clear molecular insights"}
              </span>
            </div>
            <div className="mt-9 grid gap-5 md:grid-cols-3">
              {videos.map(video => (
                <VideoCard
                  key={video.title}
                  video={video}
                  locale={locale}
                  categoryName={portal.name}
                />
              ))}
            </div>
          </div>
        </section>

        {/* 03: Articles Showcase with Rich Avatars & Trust Meter */}
        <section className="mx-auto max-w-7xl px-5 py-18 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pb-6 border-b border-[#d8e4d8]">
            <div>
              <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-emerald-800">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>03 — {vi ? "BÀI VIẾT Y SINH MỚI NHẤT" : "LATEST EVIDENCE-BASED GUIDES"}</span>
              </div>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#18302b] sm:text-3xl">
                {vi ? "Đọc Tiếp, Hiểu Rõ Hơn Về Cơ Chế Cơ Thể" : "Read On, Understand Your Body Better"}
              </h2>
              <p className="mt-1 text-sm text-[#4e665d]">
                {vi
                  ? "Các bài viết có ảnh mô phỏng 3D giải phẫu, thang điểm kiểm chứng khoa học Trust Meter và công thức bỏ túi 2 phút."
                  : "Every guide includes 3D cutaway simulations, clinical Trust Meter scores, and 2-minute pocket recipes."}
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

          {/* Articles Grid with Big Covers and Badges */}
          {articles.length > 0 ? (
            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {articles.map(article => (
                <ArticleCard key={article.slug} article={article} locale={locale} />
              ))}
            </div>
          ) : (
            <div className="mt-10 grid gap-4 lg:grid-cols-3">
              {portal.stories.map((story, index) => (
                <Link href={story.href} key={story.title} className="story-box">
                  <div className={`story-number tone-${portal.tone}`}>0{index + 1}</div>
                  <div>
                    <span>{story.label}</span>
                    <h3>{story.title}</h3>
                  </div>
                  <ArrowRight />
                </Link>
              ))}
            </div>
          )}

          {/* Big CTA below articles */}
          <div className="mt-14 text-center">
            <Link
              href={allGuidesUrl}
              className="inline-flex items-center gap-2.5 rounded-2xl bg-[#18302b] px-8 py-4 text-sm font-bold text-white shadow-xl shadow-[#18302b]/15 hover:bg-emerald-900 transition-all hover:-translate-y-0.5"
            >
              <span>{vi ? `Khám Phá Toàn Bộ Kho Bài Viết (${locale === 'vi' ? '14+ bài' : '14+ guides'})` : 'Explore Complete Article Library'}</span>
              <ArrowRight className="h-4 w-4 text-emerald-400" />
            </Link>
          </div>
        </section>
      </main>
    </WellnessShell>
  );
}
