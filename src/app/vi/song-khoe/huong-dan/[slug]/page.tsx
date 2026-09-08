import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticlePage } from "@/components/wellness/ArticlePage";
import { getArticle, wellnessArticles } from "@/data/wellness-articles";
import { findPublishedArticle, listPublishedArticles, translatedArticlePath } from "@/lib/published-articles";
import { PublishedArticlePage } from "@/components/wellness/PublishedArticlePage";
import { articlePath } from "@/lib/article-publishing";
export const dynamic = 'force-dynamic';
export function generateStaticParams() { return wellnessArticles.filter(a => a.locale === "vi").map(a => ({ slug: a.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const a = getArticle('vi', slug) ?? await findPublishedArticle('vi', slug);
  return a ? { title: ('seo_title' in a && a.seo_title) || a.title,
    description: ('seo_description' in a && a.seo_description) || a.description,
    alternates: { canonical: articlePath('vi', slug) } } : {};
}
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const legacy = getArticle('vi', slug);
  if (legacy) return <ArticlePage article={legacy} />;
  const article = await findPublishedArticle('vi', slug);
  if (!article) notFound();
  const [translationPath, relatedArticles] = await Promise.all([
    translatedArticlePath(article),
    listPublishedArticles('vi', undefined, 12)
  ]);
  return <PublishedArticlePage article={article} translationPath={translationPath} relatedArticles={relatedArticles} />;
}
