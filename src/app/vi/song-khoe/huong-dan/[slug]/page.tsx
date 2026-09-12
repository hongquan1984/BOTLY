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
  const categoryId = article.wellness_articles?.category_id;
  const [translationPath, categoryArticles, allArticles] = await Promise.all([
    translatedArticlePath(article),
    categoryId ? listPublishedArticles('vi', categoryId, 12) : Promise.resolve([]),
    listPublishedArticles('vi', undefined, 12)
  ]);
  const sameCat = categoryArticles.filter(a => a.slug !== article.slug);
  const otherCat = allArticles.filter(a => a.slug !== article.slug && (!categoryId || a.wellness_articles.category_id !== categoryId));
  const relatedArticles = [...sameCat, ...otherCat].slice(0, 10);
  return <PublishedArticlePage article={article} translationPath={translationPath} relatedArticles={relatedArticles} />;
}
