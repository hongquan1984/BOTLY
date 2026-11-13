import { NextResponse } from "next/server";
import { z } from "zod";
import { getDiscoveryCandidateSeeds } from "@/data/healthclues-discoveries";
import { getDiscoveryAdminCandidates, resolveEbookCandidateUrls } from "@/lib/healthclues-discovery-admin";
import { isHealthCluesReviewerRequest } from "@/lib/admin-auth";
import { supabaseConfig, supabaseRequest } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CREDENTIAL_IDENTITY = "healthclues_reviewer_credential:HEALTHCLUES_REVIEWER_TOKEN";

const contentSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]{1,180}$/), locale: z.enum(["en", "vi"]),
  url: z.string().max(2048).refine(value => value.startsWith("/en/wellness/") && !value.startsWith("//") || (() => { try { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password; } catch { return false; } })()),
  title: z.string().trim().min(1).max(240), summary: z.string().trim().min(1).max(4000),
  topicTags: z.array(z.string().regex(/^[a-z0-9-]{1,80}$/)).max(30),
  contentType: z.enum(["recipe", "activity", "research", "ebook"]),
  estimatedMinutes: z.number().int().min(1).max(240).nullable(),
  ingredients: z.array(z.string().trim().min(1).max(200)).max(50),
  instructions: z.array(z.string().trim().min(1).max(1000)).max(30),
  restrictions: z.array(z.string().trim().min(1).max(300)).max(50),
  countryRelevance: z.array(z.string().trim().min(2).max(80)).max(100),
  evidence: z.object({
    summary: z.string().max(2000),
    sources: z.array(z.object({
      label: z.string().min(1).max(250),
      url: z.string().url().max(2048).refine(value => {
        try {
          const sourceUrl = new URL(value);
          return sourceUrl.protocol === "https:" && !sourceUrl.username && !sourceUrl.password;
        } catch {
          return false;
        }
      }),
    })).max(30),
  }).strict(),
  safetyNotes: z.string().max(2000).nullable(),
}).strict();

const writeSchema = z.object({
  action: z.enum(["submitted", "approved", "activated", "changes_requested", "rejected", "deactivated"]),
  reason: z.string().trim().min(2).max(2000),
  item: contentSchema,
  confirmReviewed: z.boolean().optional(),
}).strict();

async function writeContent(item: z.infer<typeof contentSchema>, action: z.infer<typeof writeSchema>["action"], reason: string, ifMissing = false) {
  const status = action === "activated" ? "published" : action === "rejected" || action === "deactivated" ? "archived" : "draft";
  const reviewStatus = action === "approved" || action === "activated" || action === "deactivated" ? "reviewed"
    : action === "changes_requested" ? "changes_requested"
      : action === "rejected" ? "rejected" : "needs_review";
  const row = {
    id: item.id, locale: item.locale, url: item.url, title: item.title, summary: item.summary,
    topic_tags: item.topicTags, content_type: item.contentType, estimated_minutes: item.estimatedMinutes,
    ingredients: item.ingredients, instructions: item.instructions, restrictions: item.restrictions,
    country_relevance: item.countryRelevance, evidence: item.evidence, safety_notes: item.safetyNotes,
    review_status: reviewStatus, status,
  };
  return supabaseRequest("rpc/healthclues_review_write", {
    method: "POST", body: JSON.stringify({ p_content: row, p_action: action, p_reason: reason, p_if_missing: ifMissing }),
  }, true);
}

export async function GET(request: Request) {
  if (!process.env.HEALTHCLUES_REVIEWER_TOKEN) return NextResponse.json({ error: "HealthClues reviewer is not configured." }, { status: 503 });
  if (!isHealthCluesReviewerRequest(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const auditContentId = new URL(request.url).searchParams.get("auditContentId");
  if (auditContentId) {
    if (!/^[a-z0-9-]{1,180}$/.test(auditContentId)) return NextResponse.json({ error: "Invalid content ID." }, { status: 400 });
    try {
      const response = await supabaseRequest(`healthclues_review_audit?content_id=eq.${encodeURIComponent(auditContentId)}&select=id,content_id,action,old_status,new_status,occurred_at,reason,actor_identity,content_version&order=occurred_at.desc,id.desc&limit=100`, {}, true);
      if (!response.ok) return NextResponse.json({ error: "Audit history is unavailable. Apply the review audit migration." }, { status: 503 });
      return NextResponse.json({ audit: await response.json() }, { headers: { "Cache-Control": "no-store, private" } });
    } catch {
      return NextResponse.json({ error: "Audit history is unavailable." }, { status: 503 });
    }
  }
  const data = await getDiscoveryAdminCandidates();
  return NextResponse.json({ ...data, credentialIdentity: CREDENTIAL_IDENTITY }, { headers: { "Cache-Control": "no-store, private" } });
}

export async function POST(request: Request) {
  if (!process.env.HEALTHCLUES_REVIEWER_TOKEN) return NextResponse.json({ error: "HealthClues reviewer is not configured." }, { status: 503 });
  if (!isHealthCluesReviewerRequest(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!supabaseConfig(true)) return NextResponse.json({ error: "Server-side discovery storage is not configured." }, { status: 503 });
  let input: unknown;
  try { input = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON." }, { status: 400 }); }

  const importRequest = z.object({ action: z.literal("import_static_candidates"), confirmPendingImport: z.literal(true) }).strict().safeParse(input);
  if (importRequest.success) {
    let seeds;
    try { seeds = await resolveEbookCandidateUrls(getDiscoveryCandidateSeeds()); }
    catch { return NextResponse.json({ error: "Could not resolve every ebook candidate to a published catalog page." }, { status: 503 }); }
    let insertedCount = 0;
    for (const seed of seeds) {
      const content = contentSchema.safeParse({
        id: seed.id, locale: seed.locale, url: seed.url, title: seed.title, summary: seed.summary,
        topicTags: seed.topicTags, contentType: seed.contentType, estimatedMinutes: seed.estimatedMinutes,
        ingredients: seed.ingredients, instructions: seed.instructions, restrictions: seed.restrictions,
        countryRelevance: seed.countryRelevance, evidence: seed.evidence, safetyNotes: seed.safetyNotes,
      });
      if (!content.success) return NextResponse.json({ error: "A static candidate is invalid." }, { status: 500 });
      try {
        const response = await writeContent(content.data, "submitted", "Static candidate imported and submitted for review.", true);
        if (!response.ok) return NextResponse.json({ error: "Could not import candidates. Verify the review audit migration." }, { status: 503 });
        const result = await response.json() as { created?: boolean };
        if (result.created) insertedCount += 1;
      } catch {
        return NextResponse.json({ error: "Discovery storage is unavailable." }, { status: 503 });
      }
    }
    return NextResponse.json({ ok: true, candidateCount: seeds.length, insertedCount, credentialIdentity: CREDENTIAL_IDENTITY }, { headers: { "Cache-Control": "no-store, private" } });
  }

  const parsed = writeSchema.safeParse(input);
  if (!parsed.success) return NextResponse.json({ error: "Invalid review fields or missing review reason.", details: parsed.error.flatten() }, { status: 400 });
  const { item, action, reason, confirmReviewed } = parsed.data;
  const { candidates } = await getDiscoveryAdminCandidates();
  if (!candidates.some(candidate => candidate.id === item.id)) return NextResponse.json({ error: "Unknown content record." }, { status: 404 });
  if ((action === "approved" || action === "activated") && item.evidence.sources.length === 0) {
    return NextResponse.json({ error: "Every candidate needs at least one verified HTTPS source before approval or activation." }, { status: 422 });
  }
  if ((action === "approved" || action === "activated") && !confirmReviewed) {
    return NextResponse.json({ error: "Confirm source, claims, audience fit, and safety review before approval." }, { status: 422 });
  }
  if (action === "activated" && item.contentType === "recipe" && (!item.ingredients.length || !item.instructions.length || !item.estimatedMinutes)) {
    return NextResponse.json({ error: "A recipe needs ingredients, step-by-step instructions, and a verified preparation-time estimate before activation." }, { status: 422 });
  }
  if (action === "activated" && item.contentType === "activity" && (!item.instructions.length || !item.estimatedMinutes)) {
    return NextResponse.json({ error: "An activity needs reviewed instructions and an estimated duration before activation." }, { status: 422 });
  }
  if (action === "activated" && item.contentType === "ebook") {
    const match = /^\/en\/wellness\/ebooks\/([a-z0-9-]+)$/.exec(item.url);
    if (!match) return NextResponse.json({ error: "An ebook discovery must link to its published catalog page." }, { status: 422 });
    try {
      const deliverable = await supabaseRequest(
        `wellness_ebooks?select=id&slug=eq.${encodeURIComponent(match[1])}&status=eq.published&or=(downloadable_file_url.not.is.null,source_url.not.is.null)&limit=1`,
        {}, true,
      );
      if (!deliverable.ok) return NextResponse.json({ error: "Could not verify the ebook delivery target." }, { status: 503 });
      const rows = await deliverable.json() as { id: string }[];
      if (rows.length === 0) return NextResponse.json({ error: "This ebook has no published file or public source to deliver." }, { status: 422 });
    } catch {
      return NextResponse.json({ error: "Could not verify the ebook delivery target." }, { status: 503 });
    }
  }
  try {
    const response = await writeContent(item, action, reason);
    if (!response.ok) return NextResponse.json({ error: "Could not save review and audit history." }, { status: 503 });
    return NextResponse.json({ ok: true, review: await response.json(), credentialIdentity: CREDENTIAL_IDENTITY }, { headers: { "Cache-Control": "no-store, private" } });
  } catch {
    return NextResponse.json({ error: "Discovery storage is unavailable." }, { status: 503 });
  }
}
