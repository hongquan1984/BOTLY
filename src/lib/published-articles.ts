import 'server-only';
import { supabaseConfig, supabaseRequest } from './supabase-server';
import { articlePath } from './article-publishing';
import type { WellnessLocale } from '@/data/wellness';
import type { PortalId } from '@/data/wellness-portals';

export type TrustMeter = {
  score: number;
  verdict: string;
  primary_benefit: string;
  risk_level: 'low' | 'moderate' | 'high';
};

export type QuickRecipe = {
  badge?: string;
  servings?: string;
  ingredients?: { item: string; amount: string; note?: string }[];
  steps?: string[];
  best_time?: string;
  donts?: string[];
};

export type FactCheckItem = {
  myth: string;
  reality: string;
};

export type FaqItem = {
  question: string;
  answer: string;
};

export type SafetyQuizQuestion = {
  id: string;
  question: string;
  options: {
    label: string;
    is_contraindicated?: boolean;
    warning?: string;
  }[];
};

export type SafetyQuiz = {
  title?: string;
  subtitle?: string;
  questions: SafetyQuizQuestion[];
  safe_verdict?: string;
  caution_verdict?: string;
  contraindicated_verdict?: string;
};

export type SomaticSignals = {
  body_signals: string[];
  triggers: string[];
  transmutation: string;
};

export type WinddownProtocol = {
  badge?: string;
  objective?: string;
  steps: string[];
  donts: string[];
};

export type MindTrapItem = {
  trap: string;
  reality: string;
};

export type SomaticQuizQuestion = {
  id: string;
  question: string;
  options: {
    label: string;
    sprout?: string;
    note?: string;
  }[];
};

export type SomaticQuiz = {
  title?: string;
  subtitle?: string;
  recommended_sprout?: string;
  recommended_soundscape?: string;
  app_store_url?: string;
  play_store_url?: string;
  questions?: SomaticQuizQuestion[];
};

export type PublishedArticle = {
  article_id: string; locale: WellnessLocale; slug: string; title: string;
  description: string; eyebrow: string; takeaway: string;
  sections: { title: string; paragraphs: string[]; bullets?: string[]; image_url?: string; image_alt?: string }[];
  sources: { label: string; url: string }[];
  cover_image_alt: string; reading_minutes: number | null;
  evidence: 'supported' | 'promising' | 'limited' | null;
  reviewed_at: string | null; tool: string | null;
  seo_title: string | null; seo_description: string | null;
  trust_meter?: TrustMeter | null;
  quick_recipe?: QuickRecipe | null;
  fact_checks?: FactCheckItem[] | null;
  faqs?: FaqItem[] | null;
  safety_quiz?: SafetyQuiz | null;
  somatic_signals?: SomaticSignals | null;
  winddown_protocol?: WinddownProtocol | null;
  mind_traps?: MindTrapItem[] | null;
  somatic_quiz?: SomaticQuiz | null;
  midnight_faqs?: FaqItem[] | null;
  published_at: string; updated_at: string;
  wellness_articles: { category_id: PortalId; facebook_url: string | null; cover_image_url: string | null };
};

// Read using the public key: RLS is the publication boundary, including scheduled posts.
async function queryArticles(params: URLSearchParams): Promise<PublishedArticle[]> {
  if (!supabaseConfig()) return [];
  params.set('select', '*,wellness_articles!inner(category_id,facebook_url,cover_image_url)');
  params.set('status', 'eq.published');
  params.set('published_at', `lte.${new Date().toISOString()}`);
  params.set('order', 'published_at.desc,article_id.desc');
  const response = await supabaseRequest(`wellness_article_translations?${params}`);
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    // During first-time setup, keep existing static content available until migration is applied.
    if (['PGRST205', '42P01'].includes(error.code)) return [];
    throw new Error('Published articles are temporarily unavailable');
  }
  return response.json();
}

export async function listPublishedArticles(locale: WellnessLocale, category?: PortalId, limit = 30) {
  const params = new URLSearchParams({ locale: `eq.${locale}`, limit: String(limit) });
  if (category) params.set('wellness_articles.category_id', `eq.${category}`);
  return queryArticles(params);
}

export async function findPublishedArticle(locale: WellnessLocale, slug: string) {
  const rows = await queryArticles(new URLSearchParams({ locale: `eq.${locale}`, slug: `eq.${slug}`, limit: '1' }));
  return rows[0] ?? null;
}

export async function translatedArticlePath(article: PublishedArticle) {
  const rows = await queryArticles(new URLSearchParams({ article_id: `eq.${article.article_id}`,
    locale: `eq.${article.locale === 'en' ? 'vi' : 'en'}`, limit: '1' }));
  return rows[0] ? articlePath(rows[0].locale, rows[0].slug) : null;
}

export async function publishedSitemapEntries() {
  const entries: { path: string; updatedAt: string }[] = [];
  // Supabase commonly caps a response at 1000 rows; page explicitly.
  for (let offset = 0; ; offset += 500) {
    const rows = await queryArticles(new URLSearchParams({ limit: '500', offset: String(offset) }));
    entries.push(...rows.map(a => ({ path: articlePath(a.locale, a.slug), updatedAt: a.updated_at })));
    if (rows.length < 500) break;
  }
  return entries;
}
