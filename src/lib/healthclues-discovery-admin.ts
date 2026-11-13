import "server-only";
import { getDiscoveryCandidateSeeds, type DiscoveryContent } from "@/data/healthclues-discoveries";
import { listPublishedArticles } from "@/lib/published-articles";
import { supabaseConfig, supabaseRequest } from "@/lib/supabase-server";

type StoredContent = {
  id: string; locale: "en"; url: string; title: string; summary: string;
  topic_tags: string[]; content_type: DiscoveryContent["contentType"]; estimated_minutes: number | null;
  ingredients: string[]; instructions: string[]; restrictions: string[]; country_relevance: string[];
  evidence: DiscoveryContent["evidence"]; safety_notes: string | null;
  review_status: DiscoveryContent["reviewStatus"]; reviewed_by: string | null;
  reviewed_at: string | null; status: DiscoveryContent["status"];
};

function mapStored(row: StoredContent): DiscoveryContent {
  return {
    id: row.id, locale: row.locale, url: row.url, title: row.title, summary: row.summary,
    topicTags: row.topic_tags ?? [], contentType: row.content_type, estimatedMinutes: row.estimated_minutes,
    ingredients: row.ingredients ?? [], instructions: row.instructions ?? [], restrictions: row.restrictions ?? [], countryRelevance: row.country_relevance ?? [],
    evidence: row.evidence ?? { summary: "", sources: [] }, safetyNotes: row.safety_notes,
    reviewStatus: row.review_status, reviewedBy: row.reviewed_by, reviewedAt: row.reviewed_at, status: row.status,
  };
}

function dynamicArticleCandidates() {
  return listPublishedArticles("en", undefined, 100).then(articles => articles.map(article => {
    const recipe = article.quick_recipe;
    const hasRecipeSteps = Boolean(recipe?.ingredients?.length && recipe.steps?.length);
    const isActivity = Boolean(article.winddown_protocol?.steps?.length || article.somatic_signals);
    const category = article.wellness_articles.category_id;
    const topicTags = category === "weight" ? ["healthy-weight"] : category === "healing" ? ["general-wellness"] : ["general-wellness"];
    return {
      id: `published-${article.article_id}`, locale: "en" as const, url: `/en/wellness/guides/${article.slug}`,
      title: article.title, summary: article.description, topicTags,
      contentType: hasRecipeSteps ? "recipe" as const : isActivity ? "activity" as const : "research" as const,
      estimatedMinutes: null,
      ingredients: recipe?.ingredients?.map(item => `${item.item}: ${item.amount}${item.note ? ` (${item.note})` : ""}`) ?? [],
      instructions: recipe?.steps ?? article.winddown_protocol?.steps ?? [],
      restrictions: recipe?.donts ?? [], countryRelevance: [],
      evidence: { summary: `Existing article evidence label: ${article.evidence ?? "not specified"}; published/review metadata is not discovery approval.`, sources: article.sources ?? [] },
      safetyNotes: recipe?.donts?.join("; ") || "Requires a dedicated discovery safety review before activation.",
      reviewStatus: "needs_review" as const, reviewedBy: null, reviewedAt: null, status: "draft" as const,
    } satisfies DiscoveryContent;
  }));
}

export async function getDiscoveryAdminCandidates() {
  const staticSeeds = [...getDiscoveryCandidateSeeds()];
  let publishedCandidates: DiscoveryContent[] = [];
  try { publishedCandidates = await dynamicArticleCandidates(); } catch { /* Catalog still exposes local source candidates. */ }
  let candidates = [...staticSeeds, ...publishedCandidates];
  const configAvailable = Boolean(supabaseConfig(true));
  if (!configAvailable) return { candidates, persistenceAvailable: false };
  try {
    const resolvedSeeds = await resolveEbookCandidateUrls(staticSeeds);
    candidates = [...resolvedSeeds, ...publishedCandidates];
    const response = await supabaseRequest("healthclues_discovery_content?select=*&limit=500", {}, true);
    if (!response.ok) {
      console.error("HealthClues admin catalog query failed", response.status, await response.text());
      return { candidates, persistenceAvailable: false };
    }
    const stored = (await response.json() as StoredContent[]).map(mapStored);
    const byId = new Map(stored.map(item => [item.id, item]));
    return { candidates: candidates.map(item => {
      const existing = byId.get(item.id);
      if (!existing) return item;
      // Refresh only pending seed URLs from the current catalog. Preserve reviewer-edited
      // URLs and all reviewed content as the authoritative stored version.
      if (item.id.startsWith("ebook-") && existing.reviewStatus !== "reviewed") return { ...existing, url: item.url };
      return existing;
    }), persistenceAvailable: true };
  } catch (error) {
    console.error("HealthClues admin catalog connection failed", error);
    return { candidates, persistenceAvailable: false };
  }
}

export async function resolveEbookCandidateUrls(seeds: DiscoveryContent[]) {
  const ebookSeeds = seeds.filter(item => item.id.startsWith("ebook-"));
  if (!ebookSeeds.length) return seeds;
  const ids = ebookSeeds.map(item => item.id.slice("ebook-".length));
  const response = await supabaseRequest(
    `wellness_ebooks?select=id,slug&status=eq.published&id=in.(${ids.map(encodeURIComponent).join(",")})`,
    {}, true,
  );
  if (!response.ok) throw new Error("PUBLISHED_EBOOK_SLUGS_UNAVAILABLE");
  const rows = await response.json() as { id: string; slug: string }[];
  const slugById = new Map(rows.filter(row => /^[a-z0-9-]+$/.test(row.slug)).map(row => [row.id, row.slug]));
  if (ids.some(id => !slugById.has(id))) throw new Error("PUBLISHED_EBOOK_SLUG_MISSING");
  return seeds.map(item => item.id.startsWith("ebook-")
    ? { ...item, url: `/en/wellness/ebooks/${slugById.get(item.id.slice("ebook-".length))}` }
    : item);
}

export async function getActiveDiscoveryContent() {
  const response = await supabaseRequest("healthclues_discovery_content?locale=eq.en&review_status=eq.reviewed&status=eq.published&select=*&limit=500", {}, true);
  if (!response.ok) throw new Error("DISCOVERY_CATALOG_UNAVAILABLE");
  return (await response.json() as StoredContent[]).map(mapStored);
}
