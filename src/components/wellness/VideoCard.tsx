import Link from "next/link";
import { ArrowRight, Play, Sparkles } from "lucide-react";
import { articlePath } from "@/lib/article-publishing";

export type VideoItem = {
  title: string;
  duration?: string;
  href?: string;
  thumbnail?: string;
  articleSlug?: string;
  categoryName?: string;
};

export function VideoCard({
  video,
  locale,
  categoryName,
}: {
  video: VideoItem;
  locale: "vi" | "en";
  categoryName?: string;
}) {
  const vi = locale === "vi";
  const thumbnail = video.thumbnail || "/articles/pineapple-cucumber-liver/cover.jpg";
  const cat = categoryName || (vi ? "Mẹo Sức Khỏe" : "Health Tips");
  const articleHref = video.articleSlug ? articlePath(locale, video.articleSlug) : null;

  return (
    <div className="group flex flex-col overflow-hidden rounded-3xl border border-[#dce6dc] bg-white text-[#18302b] shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-emerald-500 hover:shadow-xl hover:shadow-emerald-950/12">
      {/* 16:10 Aspect Ratio Thumbnail Area */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#18302b]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={thumbnail}
          alt={video.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />

        {/* Ambient Gradient Scrim */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

        {/* Center Frosted Glass Play Button */}
        {video.href ? (
          <a
            href={video.href}
            target="_blank"
            rel="noreferrer"
            className="absolute inset-0 flex items-center justify-center focus:outline-none"
            aria-label={vi ? `Xem video ${video.title} trên Facebook Reels` : `Watch ${video.title} on Facebook Reels`}
          >
            <span className="flex h-13 w-13 items-center justify-center rounded-full bg-black/45 backdrop-blur-md border border-white/40 shadow-xl transition-all duration-300 group-hover:scale-115 group-hover:bg-emerald-600 group-hover:border-emerald-400">
              <Play className="h-6 w-6 text-white fill-white ml-0.5" />
            </span>
          </a>
        ) : (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="flex h-13 w-13 items-center justify-center rounded-full bg-black/45 backdrop-blur-md border border-white/40 shadow-xl">
              <Play className="h-6 w-6 text-white fill-white ml-0.5" />
            </span>
          </div>
        )}

        {/* Top-left Facebook Reel Badge */}
        <div className="pointer-events-none absolute top-3.5 left-3.5 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1 text-[11px] font-bold text-white backdrop-blur-md border border-white/20 shadow-md">
          <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          <span>Facebook Reel</span>
        </div>

        {/* Bottom-right 3D Anatomy Tag */}
        <div className="pointer-events-none absolute bottom-3 right-3">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#18302b] shadow-md backdrop-blur-sm">
            <Sparkles className="h-3 w-3 text-emerald-600" />
            {vi ? "Mô Phỏng 3D" : "3D Anatomy"}
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="flex flex-1 flex-col p-5 sm:p-6 justify-between">
        <div>
          <div className="flex items-center justify-between text-[11px] font-extrabold uppercase tracking-wider text-emerald-800">
            <span className="line-clamp-1">{cat}</span>
            <span className="text-[#74867e] font-semibold shrink-0 ml-2">{video.duration || "Facebook Reel"}</span>
          </div>

          <h3 className="mt-2 text-base font-bold leading-snug text-[#18302b] transition-colors group-hover:text-emerald-700 line-clamp-2">
            {video.href ? (
              <a href={video.href} target="_blank" rel="noreferrer" className="hover:underline">
                {video.title}
              </a>
            ) : (
              video.title
            )}
          </h3>
        </div>

        {/* Action Row */}
        <div className="mt-5 flex items-center justify-between gap-2 border-t border-[#f0f4ef] pt-3.5">
          {video.href ? (
            <a
              href={video.href}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full bg-[#18302b] px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-emerald-800 hover:shadow-md"
            >
              <Play className="h-3 w-3 fill-current" />
              <span>{vi ? "Xem Video Reel" : "Watch Reel"}</span>
            </a>
          ) : (
            <div />
          )}

          {articleHref && (
            <Link
              href={articleHref}
              className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 hover:text-emerald-950 hover:underline transition-colors ml-auto"
            >
              <span>{vi ? "Đọc bài viết" : "Read guide"}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
