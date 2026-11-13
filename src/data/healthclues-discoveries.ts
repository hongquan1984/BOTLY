import { wellnessArticles } from "@/data/wellness-articles";
import { wellnessEbooks } from "@/data/wellness-ebooks";

export type DiscoveryStatus = "New" | "Tried" | "Not tried" | "Saved" | "Not interested";
export type DiscoveryContentType = "recipe" | "activity" | "research" | "ebook";
export type DiscoveryReviewStatus = "needs_review" | "changes_requested" | "reviewed" | "rejected";
export type DiscoveryPublicationStatus = "draft" | "published" | "archived";
export type DiscoveryContent = {
  id: string;
  url: string;
  title: string;
  summary: string;
  topicTags: string[];
  contentType: DiscoveryContentType;
  estimatedMinutes: number | null;
  ingredients: string[];
  instructions: string[];
  restrictions: string[];
  countryRelevance: string[];
  evidence: { summary: string; sources: { label: string; url: string }[] };
  safetyNotes: string | null;
  locale: "en";
  reviewStatus: DiscoveryReviewStatus;
  reviewedBy: string | null;
  reviewedAt: string | null;
  status: DiscoveryPublicationStatus;
};

export function discoveryTimeLabel(item: Pick<DiscoveryContent, "contentType" | "estimatedMinutes">) {
  if (item.estimatedMinutes !== null) {
    return item.contentType === "recipe" || item.contentType === "activity"
      ? `Estimated time: ${item.estimatedMinutes} minutes`
      : `Reading time: ${item.estimatedMinutes} minutes`;
  }
  return item.contentType === "recipe" || item.contentType === "activity"
    ? "Not estimated"
    : "Reading time not stated by the source";
}

const articleTags: Record<string, string[]> = {
  "balanced-plate-simple": ["balanced-nutrition", "healthy-weight"],
  "three-minute-stress-reset": ["stress-relaxation", "general-wellness"],
  "meditation-for-restless-beginners": ["stress-relaxation", "sleep-rest", "general-wellness"],
  "blood-sugar-pairings": ["balanced-nutrition"],
  "lentils-rice-blood-sugar": ["balanced-nutrition"],
  "oats-berries-blood-sugar": ["balanced-nutrition"],
  "onion-honey-blood-sugar": ["balanced-nutrition"],
  "beans-toast-blood-sugar": ["balanced-nutrition"],
};
const ebookTags: Record<string, string[]> = {
  "blood-sugar": ["balanced-nutrition"], antioxidants: ["balanced-nutrition"],
  "weight-management": ["healthy-weight", "balanced-nutrition"],
  "better-sleep": ["sleep-rest"], "gout-support": ["gout-uric-acid"],
  "liver-health": ["balanced-nutrition"],
};

const sourcedCandidates: DiscoveryContent[] = [
  {
    id: "external-niams-gout-overview", url: "https://www.niams.nih.gov/health-topics/gout",
    title: "Gout basics: urate, crystals, and joint flares",
    summary: "An NIAMS overview explains how urate crystals can lead to joint inflammation and notes that many people with high blood urate do not develop gout. Open the official page for the full explanation.",
    topicTags: ["gout-uric-acid"], contentType: "research", estimatedMinutes: null,
    ingredients: [], instructions: [], restrictions: [], countryRelevance: [],
    evidence: { summary: "Plain-language condition overview from the U.S. National Institute of Arthritis and Musculoskeletal and Skin Diseases (NIAMS). No treatment recommendation is summarized here.", sources: [{ label: "NIAMS — Gout: Overview, Symptoms, & Causes", url: "https://www.niams.nih.gov/health-topics/gout" }] },
    safetyNotes: "Educational information only; this resource cannot diagnose gout or guide treatment or medication changes. Seek a qualified health professional for symptoms or care decisions.",
    locale: "en", reviewStatus: "needs_review", reviewedBy: null, reviewedAt: null, status: "draft",
  },
  {
    id: "external-nhlbi-healthy-sleep-habits", url: "https://www.nhlbi.nih.gov/health/sleep-deprivation/healthy-sleep-habits",
    title: "Healthy sleep habits: practical ideas from NHLBI",
    summary: "NHLBI lists general sleep-habit ideas, including keeping a regular schedule and making the bedroom quiet, cool, and dark. These are general educational suggestions, not a promise of improved sleep.",
    topicTags: ["sleep-rest"], contentType: "research", estimatedMinutes: null,
    ingredients: [], instructions: [], restrictions: [], countryRelevance: [],
    evidence: { summary: "General sleep-habit information from the U.S. National Heart, Lung, and Blood Institute (NHLBI); no individual sleep plan is inferred.", sources: [{ label: "NHLBI — Healthy Sleep Habits", url: "https://www.nhlbi.nih.gov/health/sleep-deprivation/healthy-sleep-habits" }] },
    safetyNotes: "General information, not insomnia diagnosis or treatment. For persistent sleep problems, consult a qualified health professional.",
    locale: "en", reviewStatus: "needs_review", reviewedBy: null, reviewedAt: null, status: "draft",
  },
  {
    id: "external-myplate-salmon-skewers", url: "https://www.myplate.gov/index.php/recipes/myplate-cnpp/hearty-salmon-skewers-over-brown-rice",
    title: "Salmon skewers with brown rice",
    summary: "A MyPlate-linked meal with salmon, cherry tomatoes, pineapple, lemon, and brown rice. The source lists 20 minutes of preparation and 15 minutes of cooking; the recipe page credits Seafood Nutrition Partnership.",
    topicTags: ["healthy-weight", "balanced-nutrition"], contentType: "recipe", estimatedMinutes: 35,
    ingredients: ["salmon (fish)", "cherry tomatoes", "pineapple", "brown rice", "lemon", "canola oil", "salt", "pepper", "paprika", "skewers"],
    instructions: ["Open the linked source for the complete recipe and preparation instructions."],
    restrictions: ["Contains salmon (fish). Review the full source ingredients before preparing."], countryRelevance: ["United States"],
    evidence: { summary: "The MyPlate page lists 20 minutes preparation and 15 minutes cooking (35 minutes combined) and credits Seafood Nutrition Partnership. The linked USDA FSIS source states the safe minimum internal temperature for fish.", sources: [
      { label: "USDA MyPlate — Hearty Salmon Skewers over Brown Rice (recipe credited to Seafood Nutrition Partnership)", url: "https://www.myplate.gov/index.php/recipes/myplate-cnpp/hearty-salmon-skewers-over-brown-rice" },
      { label: "USDA FSIS — Safe Minimum Internal Temperature Chart", url: "https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/food-safety-basics/safe-temperature-chart" },
    ] },
    safetyNotes: "Contains fish. USDA FSIS lists 145°F (62.8°C) for fish, measured with a food thermometer. Confirm the safety note and source recipe suitability during review.",
    locale: "en", reviewStatus: "needs_review", reviewedBy: null, reviewedAt: null, status: "draft",
  },
];

function minutes(value: string) {
  const match = /(?:^|\D)(\d{1,3})\s*(?:min|minute)/i.exec(value);
  return match ? Number(match[1]) : null;
}

export function getDiscoveryCandidateSeeds(): DiscoveryContent[] {
  const articles: DiscoveryContent[] = wellnessArticles.filter(article => article.locale === "en").map(article => ({
    id: `static-article-${article.slug}`, url: `/en/wellness/guides/${article.slug}`,
    title: article.title, summary: article.description, topicTags: articleTags[article.slug] ?? [],
    contentType: article.slug === "three-minute-stress-reset" || article.slug === "meditation-for-restless-beginners" ? "activity" : "research",
    estimatedMinutes: article.slug === "meditation-for-restless-beginners" ? 3 : minutes(article.readTime), ingredients: [],
    instructions: article.slug === "three-minute-stress-reset" || article.slug === "meditation-for-restless-beginners" ? article.sections.flatMap(section => section.paragraphs).slice(0, 6) : [],
    restrictions: [], countryRelevance: [],
    evidence: { summary: `Existing article metadata says ${article.evidence}; the article's displayed review date is ${article.reviewedAt}. Neither field is discovery approval.`, sources: article.sources },
    safetyNotes: article.slug === "three-minute-stress-reset" || article.slug === "meditation-for-restless-beginners"
      ? "Candidate safety copy: stop if the practice causes dizziness, discomfort, or increased distress. Requires editor review before activation."
      : "Educational reading only. Do not use as diagnosis, treatment, medication, or dosing guidance.",
    locale: "en", reviewStatus: "needs_review", reviewedBy: null, reviewedAt: null, status: "draft",
  }));
  const ebooks: DiscoveryContent[] = wellnessEbooks.filter(ebook => ebook.status === "available").map(ebook => ({
    id: `ebook-${ebook.id}`, url: `/en/wellness/ebooks/${ebook.slugEn}`, title: ebook.titleEn,
    summary: ebook.descriptionEn, topicTags: ebookTags[ebook.id] ?? [], contentType: "ebook",
    estimatedMinutes: null, ingredients: [], instructions: [], restrictions: [], countryRelevance: [],
    evidence: { summary: `Ebook availability is ${ebook.status}; no discovery review is inferred from availability.`, sources: [] },
    safetyNotes: "Educational reading, not individualized care. Requires discovery review before activation.",
    locale: "en", reviewStatus: "needs_review", reviewedBy: null, reviewedAt: null, status: "draft",
  }));
  return [...articles, ...ebooks, ...sourcedCandidates];
}

export type MatchProfile = {
  topic: string; contentPreferences: string[]; presentation: string;
  comfortableActivityTime: string; refreshFrequency: string; twoWeekGoal: string;
  country?: string; excludedIngredients?: string[]; foodSafetyHold?: boolean; activitySafetyHold?: boolean;
  specificInterests?: string[];
};

export function matchHealthCluesDiscoveries(profile: MatchProfile, items: DiscoveryContent[]) {
  const topicKey: Record<string, string> = {
    "Healthy weight": "healthy-weight", "Gout & uric acid": "gout-uric-acid",
    "Sleep & rest": "sleep-rest", "Balanced nutrition": "balanced-nutrition",
    "Stress & relaxation": "stress-relaxation", "Digestion & gut health": "digestion-gut-health",
  };
  const topic = topicKey[profile.topic];
  const preferredType = profile.presentation === "Step-by-step recipes" ? "recipe"
    : profile.presentation === "Short research summaries" ? "research" : null;
  const interests = profile.specificInterests ?? [];
  const wantsFood = profile.contentPreferences.includes("Food & recipes") || profile.presentation === "Step-by-step recipes" || profile.twoWeekGoal === "Explore simple recipes" || interests.some(value => ["Easy meal ideas", "Food", "Simple recipes", "Ingredients", "Meal planning ideas", "Food traditions", "Culinary uses", "Flexible substitutions", "Familiar flavors"].includes(value));
  const wantsActivity = profile.comfortableActivityTime !== "I only want to read" && (profile.contentPreferences.includes("Everyday habits") || profile.presentation === "Quick daily cards" || profile.twoWeekGoal === "Build a small routine" || interests.some(value => ["Everyday movement", "Long-term habits", "Relaxation", "Gentle stretching", "Journaling", "Try a simple activity", "Breathing and grounding activities", "Guided activity", "Movement breaks", "Morning routines", "Walking routes and prompts", "Stretching information", "A few minutes", "Around 10 minutes"].includes(value)));
  const wantsResearch = profile.contentPreferences.includes("Research explained") || profile.presentation === "Short research summaries" || profile.twoWeekGoal === "Understand the research better" || interests.some(value => ["Research explanations", "Research", "Always", "Only when important", "Open on demand", "General research", "Just information", "Research and evidence", "A source-linked article", "Show sources every time", "Show sources when available", "Let me open sources on demand"].includes(value));
  const maxMinutes = profile.comfortableActivityTime === "5 minutes" ? 5
    : profile.comfortableActivityTime === "10–15 minutes" ? 15
      : profile.comfortableActivityTime === "20–30 minutes" ? 30 : profile.comfortableActivityTime === "More than 30 minutes" ? 120 : null;
  const eligible = items.filter(item => item.locale === "en" && item.reviewStatus === "reviewed" && item.status === "published");
  const avoidanceTerms: Record<string, string[]> = {
    dairy: ["milk", "cheese", "yogurt", "butter", "cream", "whey"],
    nuts: ["nut", "almond", "walnut", "cashew", "pecan", "pistachio", "hazelnut", "peanut"],
    seafood: ["seafood", "fish", "shrimp", "prawn", "crab", "lobster", "mollusk"],
    meat: ["meat", "beef", "pork", "lamb", "chicken", "turkey"],
    "spicy foods": ["chili", "chilli", "hot pepper", "cayenne"],
  };
  const conflictsWithAvoidance = (item: DiscoveryContent) => {
    const itemText = [...item.ingredients, ...item.restrictions].join(" ").toLowerCase();
    return (profile.excludedIngredients ?? []).some(raw => {
      const avoid = raw.toLowerCase();
      return itemText.includes(avoid) || (avoidanceTerms[avoid] ?? []).some(term => itemText.includes(term));
    });
  };
  const score = (item: DiscoveryContent) => {
    if (topic && !item.topicTags.includes(topic)) return -1;
    if (item.contentType === "recipe" && (profile.foodSafetyHold || conflictsWithAvoidance(item))) return -1;
    if (item.contentType === "activity" && profile.activitySafetyHold) return -1;
    if ((item.contentType === "recipe" || item.contentType === "activity") && maxMinutes !== null
      && (item.estimatedMinutes === null || item.estimatedMinutes > maxMinutes)) return -1;
    if ((item.contentType === "recipe" || item.contentType === "activity") && !item.instructions.length) return -1;
    const categoryInterest = item.contentType === "recipe" ? wantsFood : item.contentType === "activity" ? wantsActivity : item.contentType === "ebook" ? (wantsFood || wantsActivity || wantsResearch || profile.contentPreferences.includes("Free guides")) : wantsResearch;
    if (!categoryInterest && !profile.contentPreferences.includes("Free guides")) return -1;
    let result = topic && item.topicTags.includes(topic) ? 10 : 0;
    if (categoryInterest) result += 5;
    if (preferredType && item.contentType === preferredType) result += 4;
    if (item.contentType === "ebook" && (wantsFood || wantsActivity || wantsResearch)) result += 1; // Clearly presented as reading, never as a recipe.
    if (profile.twoWeekGoal === "Find interesting new information" && item.contentType === "research") result += 2;
    if (profile.country && item.countryRelevance.some(country => country.toLowerCase() === profile.country?.toLowerCase())) result += 2;
    if (maxMinutes !== null && item.estimatedMinutes !== null && item.estimatedMinutes <= maxMinutes) result += 2;
    if (profile.refreshFrequency === "Daily") result += 0; // Refresh preference never fabricates additional content.
    return result;
  };
  const ordered = eligible.map(item => ({ item, score: score(item) })).filter(row => row.score > 0)
    .sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title));
  const slots = ["recipe", "ebook", "activity", "research"] as const;
  const result: DiscoveryContent[] = [];
  for (const slot of slots) {
    const item = ordered.find(row => !result.some(existing => existing.id === row.item.id) && (slot === "recipe" ? row.item.contentType === "recipe" || row.item.contentType === "ebook" : row.item.contentType === slot))?.item;
    if (item) result.push(item);
    if (result.length === 3) break;
  }
  const maxCards = profile.refreshFrequency === "Weekly" ? 1 : profile.refreshFrequency === "Three times a week" ? 2 : 3;
  return result.slice(0, maxCards);
}
