import type { MetadataRoute } from "next";
import { siteConfig } from "@/data/site";
import { wellnessArticles } from "@/data/wellness-articles";
import { publishedSitemapEntries } from "@/lib/published-articles";
export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const paths = [
    "", "/en/wellness", "/en/wellness/weight-management", "/en/wellness/healing",
    "/en/wellness/health-tips", "/en/wellness/tools", "/vi/song-khoe",
    "/vi/song-khoe/giam-can", "/vi/song-khoe/chua-lanh",
    "/vi/song-khoe/meo-suc-khoe", "/vi/song-khoe/cong-cu", "/en/business",
    "/vi/doanh-nghiep", "/en/wellness/tools/plan", "/vi/song-khoe/cong-cu/ke-hoach",
  ];
  const articlePaths = wellnessArticles.map((article) => article.locale === "en" ? `/en/wellness/guides/${article.slug}` : `/vi/song-khoe/huong-dan/${article.slug}`);
  const published = await publishedSitemapEntries();
  return [...paths, ...articlePaths].map((path, index) => ({
    url: `${siteConfig.url}${path}`,
    lastModified: new Date(),
    changeFrequency: index === 0 ? "weekly" as const : "monthly" as const,
    priority: index === 0 ? 1 : 0.8,
  })).concat(published.map(a => ({ url: `${siteConfig.url}${a.path}`,
    lastModified: new Date(a.updatedAt), changeFrequency: 'monthly' as const, priority: 0.8 })));
}
