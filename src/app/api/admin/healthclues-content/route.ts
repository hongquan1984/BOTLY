import { NextResponse } from "next/server";
import { isHealthCluesReviewerRequest } from "@/lib/admin-auth";
import { serviceRest } from "@/features/healthclues/server";
import reviewDraftCandidates from "@/data/healthclues-content-review-candidates-v1.json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const reviewer = "healthclues_reviewer_credential:HEALTHCLUES_REVIEWER_TOKEN";
const contentTypes = ["catalog", "clue", "boss", "method", "recipe_combo", "journey_combo"] as const;
type ContentType = typeof contentTypes[number];
const actions = ["approve", "publish", "recommend", "reject", "deactivate"] as const;

function denied(request: Request) {
  if (!process.env.HEALTHCLUES_REVIEWER_TOKEN) return NextResponse.json({ error: "HealthClues reviewer is not configured." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  if (!isHealthCluesReviewerRequest(request)) return NextResponse.json({ error: "Reviewer access required." }, { status: 401, headers: { "Cache-Control": "no-store" } });
  return null;
}

async function isPublishedCatalogItem(id: string, version: number) {
  const rows = await serviceRest<Array<{ id: string; current_version: number; active: boolean; review_status: string }>>(`healthclues_catalog_items?id=eq.${encodeURIComponent(id)}&select=id,current_version,active,review_status&limit=1`);
  return rows.length > 0 && rows[0].current_version === version && rows[0].active && rows[0].review_status === "reviewed";
}

async function isPublishedMethod(id: string, version: number) {
  const rows = await serviceRest<Array<{ id: string; current_version: number; active: boolean; review_status: string }>>(`healthclues_usage_methods?id=eq.${encodeURIComponent(id)}&select=id,current_version,active,review_status&limit=1`);
  if (!rows.length || rows[0].current_version !== version || !rows[0].active || rows[0].review_status !== "reviewed") return false;
  const versions = await serviceRest<Array<{ method_id: string; version: number; review_status: string; safety_notes: string | null }>>(`healthclues_usage_method_versions?method_id=eq.${encodeURIComponent(id)}&version=eq.${version}&select=method_id,version,review_status,safety_notes&limit=1`);
  return versions.length > 0 && versions[0].review_status === "reviewed" && Boolean(versions[0].safety_notes?.trim());
}

export async function GET(request: Request) {
  const response = denied(request); if (response) return response;
  try {
    const [catalog, clues, bosses, methods, methodVersions, methodItems, recipeCombos, journeyCombos, journeyComponents] = await Promise.all([
      serviceRest<Array<Record<string, unknown>>>("healthclues_catalog_items?review_status=in.(draft,needs_review,rejected)&select=id,slug,slot_key,review_status,active,recommendation_eligible,current_version&order=updated_at.desc&limit=200"),
      serviceRest<Array<Record<string, unknown>>>("healthclues_knowledge_clues?review_status=in.(draft,needs_review,rejected)&select=clue_id,version,topic_key,chapter_id,title,content,source_references,related_catalog_ids,question_prompt,question_options,published,review_status,reviewed_by,review_due_at&order=updated_at.desc&limit=200"),
      serviceRest<Array<Record<string, unknown>>>("healthclues_boss_challenges?review_status=in.(draft,needs_review,rejected)&select=boss_id,version,topic_key,title,intro,question_prompt,question_options,source_references,published,review_status,reviewed_by,review_due_at&order=topic_key.asc,boss_id.asc,version.desc&limit=200"),
      serviceRest<Array<Record<string, unknown>>>("healthclues_usage_methods?or=(review_status.in.(draft,needs_review,rejected),and(review_status.eq.reviewed,active.eq.false))&select=id,slug,review_status,active,current_version&order=created_at.desc&limit=200"),
      serviceRest<Array<Record<string, unknown>>>("healthclues_usage_method_versions?review_status=in.(draft,needs_review,rejected,reviewed)&select=method_id,version,name,instructions,estimated_minutes,safety_notes,review_status,reviewed_by,created_at&order=created_at.desc&limit=500"),
      serviceRest<Array<Record<string, unknown>>>("healthclues_usage_method_items?select=method_id,method_version,catalog_item_id,item_version,relationship,is_required,display_order&limit=1000"),
      serviceRest<Array<Record<string, unknown>>>("healthclues_recipe_combos?or=(review_status.in.(draft,needs_review,rejected),and(review_status.eq.reviewed,active.eq.false))&select=id,version,recipe_item_id,recipe_item_version,method_id,method_version,review_status,active&order=created_at.desc&limit=200"),
      serviceRest<Array<Record<string, unknown>>>("healthclues_journey_combos?or=(review_status.in.(draft,needs_review,rejected),and(review_status.eq.reviewed,active.eq.false))&select=id,version,name,review_status,active,rationale,safety_compatibility,partial_acceptance&order=created_at.desc&limit=200"),
      serviceRest<Array<Record<string, unknown>>>("healthclues_journey_combo_components?select=combo_id,combo_version,slot_key,catalog_item_id,item_version,method_id,method_version,required,display_order,rationale&limit=1000"),
    ]);
    const ids = [...new Set([...catalog.map(row => String(row.id)), ...methodItems.map(row => String(row.catalog_item_id)), ...journeyComponents.map(row => String(row.catalog_item_id)), ...recipeCombos.map(row => String(row.recipe_item_id))])];
    const versions = ids.length ? await serviceRest<Array<Record<string, unknown>>>(`healthclues_catalog_item_versions?catalog_item_id=in.(${ids.map(encodeURIComponent).join(",")})&select=catalog_item_id,version,name,description,evidence_class,evidence_summary,evidence_sources,safety_notes,contraindications,source_provenance,reviewed_by,review_due_at&limit=1500`) : [];
    return NextResponse.json({
      catalog: catalog.map(row => ({ ...row, current: versions.find(version => version.catalog_item_id === row.id && version.version === row.current_version) ?? null })), clues, bosses,
      methods: methods.map(row => ({ ...row, current: methodVersions.find(version => version.method_id === row.id && version.version === row.current_version) ?? null, components: methodItems.filter(item => item.method_id === row.id && item.method_version === row.current_version).map(item => ({ ...item, catalog: versions.find(version => version.catalog_item_id === item.catalog_item_id && version.version === item.item_version) ?? null })) })),
      recipeCombos: recipeCombos.map(row => ({ ...row, recipe: versions.find(version => version.catalog_item_id === row.recipe_item_id && version.version === row.recipe_item_version) ?? null })),
      journeyCombos: journeyCombos.map(row => ({ ...row, components: journeyComponents.filter(item => item.combo_id === row.id && item.combo_version === row.version).map(item => ({ ...item, catalog: versions.find(version => version.catalog_item_id === item.catalog_item_id && version.version === item.item_version) ?? null })) })),
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("HealthClues content review queue failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Could not load HealthClues review queue." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}

export async function POST(request: Request) {
  const response = denied(request); if (response) return response;
  let body: { action?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }
  if (body.action !== "import_v1_review_drafts") return NextResponse.json({ error: "Unsupported reviewer action." }, { status: 400 });
  try {
    const result = await serviceRest<unknown>("rpc/healthclues_import_review_drafts_v1", {
      method: "POST", headers: { Prefer: "return=representation" },
      body: JSON.stringify({ p_candidates: reviewDraftCandidates, p_reason: "Source-linked HealthClues V1 candidate content imported for independent human review; remains unpublished." }),
    });
    return NextResponse.json({ ok: true, result, published: false, reviewStatus: "needs_review" }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("HealthClues review draft import failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Could not import review drafts. Existing content was not approved or published." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}

export async function PATCH(request: Request) {
  const response = denied(request); if (response) return response;
  let body: { contentType?: unknown; id?: unknown; version?: unknown; action?: unknown; reason?: unknown; confirmReviewed?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }
  const type = body.contentType as ContentType;
  const action = String(body.action);
  if (action === "recommend" && type !== "catalog") return NextResponse.json({ error: "Only Catalog items can be made recommendation-eligible." }, { status: 400 });
  if (!(contentTypes as readonly unknown[]).includes(type) || typeof body.id !== "string" || !/^[a-z0-9-]{1,120}$/.test(body.id) || !Number.isInteger(body.version) || Number(body.version) < 1 || !(actions as readonly string[]).includes(action) || typeof body.reason !== "string" || body.reason.trim().length < 3 || body.reason.length > 1200) return NextResponse.json({ error: "Choose valid content, version, action and audit reason." }, { status: 400 });
  if (["approve", "publish", "recommend"].includes(action) && body.confirmReviewed !== true) return NextResponse.json({ error: "Reviewer confirmation is required before approving or publishing content." }, { status: 422 });
  try {
    const now = new Date().toISOString();
    const status = action === "reject" ? "rejected" : action === "deactivate" ? "retired" : "reviewed";
    const key = encodeURIComponent(body.id);
    if (type === "catalog") {
      const parents = await serviceRest<Array<{ id: string; current_version: number; review_status: string; active: boolean }>>(`healthclues_catalog_items?id=eq.${key}&select=id,current_version,review_status,active&limit=1`);
      if (!parents.length || parents[0].current_version !== body.version) return NextResponse.json({ error: "Catalog version changed. Reload the queue." }, { status: 409 });
      const versions = await serviceRest<Array<{ evidence_sources: unknown; reviewed_by: string | null; reviewed_at: string | null }>>(`healthclues_catalog_item_versions?catalog_item_id=eq.${key}&version=eq.${body.version}&select=evidence_sources,reviewed_by,reviewed_at&limit=1`);
      if (!versions.length) return NextResponse.json({ error: "Catalog version not found." }, { status: 404 });
      if (action === "recommend") {
        if (!parents[0].active || parents[0].review_status !== "reviewed" || !versions[0].reviewed_at || !Array.isArray(versions[0].evidence_sources) || !versions[0].evidence_sources.length) return NextResponse.json({ error: "Only active, reviewed Catalog items with sources can be recommended." }, { status: 422 });
        const updated = await serviceRest<Array<{ id: string }>>(`healthclues_catalog_items?id=eq.${key}&current_version=eq.${body.version}&review_status=eq.reviewed&active=eq.true`, { method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify({ recommendation_eligible: true, updated_at: now }) });
        if (!updated.length) return NextResponse.json({ error: "Catalog state changed. Reload the queue." }, { status: 409 });
      } else {
        if (action === "publish" && (!Array.isArray(versions[0].evidence_sources) || !versions[0].evidence_sources.length)) return NextResponse.json({ error: "Catalog needs reviewed source references before publication." }, { status: 422 });
        await serviceRest(`healthclues_catalog_item_versions?catalog_item_id=eq.${key}&version=eq.${body.version}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ reviewed_by: action === "deactivate" ? versions[0].reviewed_by : reviewer, reviewed_at: action === "deactivate" ? versions[0].reviewed_at : now }) });
        await serviceRest(`healthclues_catalog_items?id=eq.${key}&current_version=eq.${body.version}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ review_status: status, active: action === "publish", recommendation_eligible: false, updated_at: now }) });
      }
    } else if (type === "clue" || type === "boss") {
      const keyColumn = type === "clue" ? "clue_id" : "boss_id";
      const table = type === "clue" ? "healthclues_knowledge_clues" : "healthclues_boss_challenges";
      const cols = type === "clue" ? "source_references,question_prompt" : "source_references,question_prompt";
      const rows = await serviceRest<Array<Record<string, unknown>>>(`${table}?${keyColumn}=eq.${key}&version=eq.${body.version}&select=${keyColumn},version,${cols},reviewed_by,reviewed_at&limit=1`);
      if (!rows.length) return NextResponse.json({ error: "Content version not found." }, { status: 404 });
      if (action === "publish") {
        if (!Array.isArray(rows[0].source_references) || !rows[0].source_references.length) return NextResponse.json({ error: "Challenges need reviewed source references before publication." }, { status: 422 });
        const answerTable = type === "clue" ? "healthclues_knowledge_answer_keys" : "healthclues_boss_answer_keys";
        const answerKey = type === "clue" ? "clue_id" : "boss_id";
        if (type === "boss" || rows[0].question_prompt) {
          const answers = await serviceRest<unknown[]>(`${answerTable}?${answerKey}=eq.${key}&${type === "clue" ? "clue_version" : "boss_version"}=eq.${body.version}&select=correct_option_id&limit=1`);
          if (!answers.length) return NextResponse.json({ error: "Challenge content needs a private answer key before publication." }, { status: 422 });
        }
      }
      await serviceRest(`${table}?${keyColumn}=eq.${key}&version=eq.${body.version}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ review_status: status, published: action === "publish", reviewed_by: action === "deactivate" ? rows[0].reviewed_by : reviewer, reviewed_at: action === "deactivate" ? rows[0].reviewed_at : now, ...(type === "clue" ? { updated_at: now } : {}) }) });
    } else if (type === "method") {
      const parents = await serviceRest<Array<{ current_version: number }>>(`healthclues_usage_methods?id=eq.${key}&select=current_version&limit=1`);
      if (!parents.length || parents[0].current_version !== body.version) return NextResponse.json({ error: "Method version changed. Reload the queue." }, { status: 409 });
      const versions = await serviceRest<Array<{ reviewed_by: string | null; reviewed_at: string | null; safety_notes: string | null }>>(`healthclues_usage_method_versions?method_id=eq.${key}&version=eq.${body.version}&select=reviewed_by,reviewed_at,safety_notes&limit=1`);
      if (!versions.length) return NextResponse.json({ error: "Method version not found." }, { status: 404 });
      if (action === "publish") {
        if (!versions[0].safety_notes?.trim()) return NextResponse.json({ error: "Usage Methods need safety information before publication." }, { status: 422 });
        const components = await serviceRest<Array<{ catalog_item_id: string; item_version: number }>>(`healthclues_usage_method_items?method_id=eq.${key}&method_version=eq.${body.version}&select=catalog_item_id,item_version&limit=100`);
        if (!components.length) return NextResponse.json({ error: "A Method needs at least one reviewed Catalog component before publication." }, { status: 422 });
        for (const component of components) if (!await isPublishedCatalogItem(component.catalog_item_id, component.item_version)) return NextResponse.json({ error: "Every Method component must still be active, current and reviewed." }, { status: 422 });
      }
      await serviceRest(`healthclues_usage_method_versions?method_id=eq.${key}&version=eq.${body.version}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ review_status: status, reviewed_by: action === "deactivate" ? versions[0].reviewed_by : reviewer, reviewed_at: action === "deactivate" ? versions[0].reviewed_at : now }) });
      await serviceRest(`healthclues_usage_methods?id=eq.${key}&current_version=eq.${body.version}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ review_status: status, active: action === "publish" }) });
    } else {
      const table = type === "recipe_combo" ? "healthclues_recipe_combos" : "healthclues_journey_combos";
      const rows = await serviceRest<Array<Record<string, unknown>>>(`${table}?id=eq.${key}&version=eq.${body.version}&select=*&limit=1`);
      if (!rows.length) return NextResponse.json({ error: "Combo version not found." }, { status: 404 });
      if (action === "publish") {
        const components = type === "recipe_combo"
          ? [{ catalog_item_id: String(rows[0].recipe_item_id), item_version: Number(rows[0].recipe_item_version), method_id: rows[0].method_id ? String(rows[0].method_id) : null, method_version: rows[0].method_version ? Number(rows[0].method_version) : null }]
          : await serviceRest<Array<{ catalog_item_id: string; item_version: number; method_id: string | null; method_version: number | null }>>(`healthclues_journey_combo_components?combo_id=eq.${key}&combo_version=eq.${body.version}&select=catalog_item_id,item_version,method_id,method_version&limit=100`);
        if (!components.length) return NextResponse.json({ error: "A Combo needs at least one reviewed Catalog component before publication." }, { status: 422 });
        if (type === "recipe_combo" && (!rows[0].method_id || !rows[0].method_version)) return NextResponse.json({ error: "A Recipe Combo needs a reviewed Usage Method before publication." }, { status: 422 });
        for (const component of components) {
          if (!await isPublishedCatalogItem(component.catalog_item_id, component.item_version)) return NextResponse.json({ error: "Every Combo component must still be active, current and reviewed." }, { status: 422 });
          if (component.method_id && component.method_version && !await isPublishedMethod(component.method_id, component.method_version)) return NextResponse.json({ error: "Every linked Usage Method must be active and reviewed before publishing its Combo." }, { status: 422 });
        }
      }
      await serviceRest(`${table}?id=eq.${key}&version=eq.${body.version}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ review_status: status, active: action === "publish" }) });
    }
    await serviceRest("healthclues_audit_events", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ actor_type: "reviewer", action: `content_${type}_${action}`, entity_type: type, entity_id: `${body.id}:v${body.version}`, reason: body.reason.trim(), metadata: { reviewer_credential: reviewer, review_status: action === "recommend" ? "reviewed" : status } }) });
    return NextResponse.json({ ok: true, contentType: type, id: body.id, version: body.version, status: action === "recommend" ? "reviewed" : status, active: action === "publish" || action === "recommend", recommendationEligible: action === "recommend" }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("HealthClues content review action failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Could not save the review decision." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
