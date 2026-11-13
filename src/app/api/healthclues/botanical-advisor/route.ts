import { NextResponse } from "next/server";
import { 
  botanicalLibrary, 
  getRecommendedBotanicalsForTopic, 
  searchBotanicals,
  getBotanicalById,
  type BotanicalArticle,
  type BotanicalEvidenceLevel 
} from "@/data/healthclues-botanical-library";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store, max-age=0, private" };

const EDUCATIONAL_DISCLAIMER = {
  vi: "Thông tin chỉ nhằm mục đích giáo dục khoa học và tham khảo, không phải hướng dẫn điều trị hoặc thay thế tư vấn y khoa.",
  en: "For scientific educational and reference purposes only. Not medical treatment advice or a substitute for professional medical care."
};

/**
 * Public Scientific Botanical Library endpoint.
 * Serves peer-reviewed herbal scientific entries with PubMed citations.
 * Fails closed against unreviewed prescription or treatment regimens.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const topic = url.searchParams.get("topic") || "";
  const query = (url.searchParams.get("search") || url.searchParams.get("q") || "").trim();
  const evidenceLevel = url.searchParams.get("evidenceLevel") as BotanicalEvidenceLevel | null;
  const articleId = url.searchParams.get("id") || "";

  // If specific article requested
  if (articleId) {
    const article = getBotanicalById(articleId) || botanicalLibrary.find(item => item.slug === articleId);
    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404, headers: noStore });
    }
    return NextResponse.json({
      article,
      disclaimer: EDUCATIONAL_DISCLAIMER
    }, { headers: noStore });
  }

  let articles: BotanicalArticle[] = query ? searchBotanicals(query) : [...botanicalLibrary];

  if (evidenceLevel && evidenceLevel !== ("all" as any)) {
    articles = articles.filter(item => item.evidenceLevel === evidenceLevel);
  }

  const recommended = topic ? getRecommendedBotanicalsForTopic(topic) : [];

  return NextResponse.json({
    status: "SUCCESS",
    topic,
    disclaimer: EDUCATIONAL_DISCLAIMER,
    total: articles.length,
    articles,
    recommended,
    reviewed: true,
  }, { headers: noStore });
}

export async function POST(request: Request) {
  let body: {
    topic?: string;
    search?: string;
    evidenceLevel?: string;
  } = {};

  try {
    body = await request.json();
  } catch {
    // defaults
  }

  const topic = body.topic || "";
  const query = (body.search || "").trim();
  const evidenceLevel = body.evidenceLevel;

  let articles: BotanicalArticle[] = query ? searchBotanicals(query) : [...botanicalLibrary];

  if (evidenceLevel && evidenceLevel !== "all") {
    articles = articles.filter(item => item.evidenceLevel === evidenceLevel);
  }

  const recommended = topic ? getRecommendedBotanicalsForTopic(topic) : [];

  return NextResponse.json({
    status: "SUCCESS",
    topic,
    disclaimer: EDUCATIONAL_DISCLAIMER,
    total: articles.length,
    articles,
    recommended,
    reviewed: true,
  }, { headers: noStore });
}
