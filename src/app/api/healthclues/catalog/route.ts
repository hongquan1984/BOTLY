import { NextResponse } from "next/server";
import { isHealthCluesOwnerDemo, serviceRest } from "@/features/healthclues/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Item = { id: string; slug: string; item_type: string; slot_key: string; current_version: number; recommendation_eligible: boolean };
type ItemVersion = { catalog_item_id: string; version: number; name: string; description: string; icon_key: string | null; evidence_class: string; evidence_summary: string | null; evidence_sources: unknown[]; safety_notes: string | null; contraindications: unknown[]; source_provenance: unknown; reviewed_by: string | null };

export async function GET(request: Request) {
  try {
    const slot = new URL(request.url).searchParams.get("slot");
    if (slot && !["consume", "reduce", "practice"].includes(slot)) return NextResponse.json({ error: "Unknown toolkit slot." }, { status: 400 });
    const query = new URLSearchParams({ select: "id,slug,item_type,slot_key,current_version,recommendation_eligible", active: "eq.true", review_status: "eq.reviewed", order: "id.asc" });
    if (slot) query.set("slot_key", `eq.${slot}`);
    const allRows = await serviceRest<Item[]>(`healthclues_catalog_items?${query.toString()}`);
    const ownerDemo = isHealthCluesOwnerDemo();
    const rows = allRows.filter(row => !row.id.startsWith("hc-demo-") || ownerDemo);
    if (rows.length === 0) return NextResponse.json({ items: [] }, { headers: { "Cache-Control": "no-store, max-age=0" } });
    const ids = rows.map(row => encodeURIComponent(row.id)).join(",");
    const [versions, methodLinks] = await Promise.all([
      serviceRest<ItemVersion[]>(`healthclues_catalog_item_versions?catalog_item_id=in.(${ids})&select=catalog_item_id,version,name,description,icon_key,evidence_class,evidence_summary,evidence_sources,safety_notes,contraindications,source_provenance,reviewed_by&order=catalog_item_id.asc,version.desc`),
      serviceRest<Array<{ catalog_item_id: string; item_version: number; method_id: string; method_version: number; relationship: string }>>(`healthclues_usage_method_items?catalog_item_id=in.(${ids})&select=catalog_item_id,item_version,method_id,method_version,relationship&limit=500`),
    ]);
    const linkedMethodIds = [...new Set(methodLinks.map(link => link.method_id))];
    const methodSets = linkedMethodIds.length ? await Promise.all([
      serviceRest<Array<{ id: string; current_version: number }>>(`healthclues_usage_methods?id=in.(${linkedMethodIds.map(encodeURIComponent).join(",")})&active=eq.true&review_status=eq.reviewed&select=id,current_version&limit=200`),
      serviceRest<Array<{ method_id: string; version: number; name: string; instructions: unknown[]; estimated_minutes: number | null; safety_notes: string | null; review_status: string }>>(`healthclues_usage_method_versions?method_id=in.(${linkedMethodIds.map(encodeURIComponent).join(",")})&review_status=eq.reviewed&select=method_id,version,name,instructions,estimated_minutes,safety_notes,review_status&limit=500`),
    ]) : [[], []] as [Array<{ id: string; current_version: number }>, Array<{ method_id: string; version: number; name: string; instructions: unknown[]; estimated_minutes: number | null; safety_notes: string | null; review_status: string }>];
    const activeMethods = methodSets[0];
    const reviewedMethods = methodSets[1];
    const items = rows.flatMap(row => {
      const version = versions.find(candidate => candidate.catalog_item_id === row.id && candidate.version === row.current_version);
      if (!version) return [];
      const provenance = version.source_provenance && typeof version.source_provenance === "object" && !Array.isArray(version.source_provenance) ? version.source_provenance as Record<string, unknown> : {};
      const topicTags = Array.isArray(provenance.topic_tags) ? provenance.topic_tags.filter((tag): tag is string => typeof tag === "string" && /^[a-z0-9-]{2,60}$/i.test(tag)).map(tag => tag.toLowerCase()) : [];
      const demoOnly = version.reviewed_by === "test-fixture" || provenance.demo_only === true;
      if (demoOnly && !ownerDemo) return [];
      const usageMethods = methodLinks.flatMap(link => {
        if (link.catalog_item_id !== row.id || link.item_version !== row.current_version) return [];
        const active = activeMethods.find(method => method.id === link.method_id && method.current_version === link.method_version);
        const method = reviewedMethods.find(candidate => candidate.method_id === link.method_id && candidate.version === link.method_version);
        return active && method ? [{ id: link.method_id, name: method.name, instructions: method.instructions, estimatedMinutes: method.estimated_minutes, safetyNotes: method.safety_notes, relationship: link.relationship }] : [];
      });
      return [{ id: row.id, slug: row.slug, kind: row.item_type, slot: row.slot_key, version: row.current_version,
        name: version.name, description: version.description, icon: version.icon_key, category: typeof provenance.category === "string" ? provenance.category : row.item_type, evidenceClass: version.evidence_class,
        evidenceSummary: version.evidence_summary, evidenceSources: version.evidence_sources, safetyNotes: version.safety_notes, contraindications: version.contraindications,
        usageMethods, topicTags, recommendationEligible: row.recommendation_eligible, demoOnly,
        goalTags: stringTags(provenance.goal_tags), preferenceTags: stringTags(provenance.preference_tags),
        estimatedMinutes: typeof provenance.estimated_minutes === "number" ? provenance.estimated_minutes : null,
        personalizationEligibility: provenance.personalization_eligibility === "eligible" || provenance.personalization_eligibility === "education_only" || provenance.personalization_eligibility === "caution" ? provenance.personalization_eligibility : "unknown",
        requiresMedicationContext: provenance.requires_medication_context === true, requiresKnownFoodSafety: provenance.requires_known_food_safety === true,
        requiresKnownActivitySafety: provenance.requires_known_activity_safety === true, requiresKnownFluidSafety: provenance.requires_known_fluid_safety === true,
        ingredientTags: stringTags(provenance.ingredient_tags) }];
    });
    return NextResponse.json({ items }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    console.error("HealthClues reviewed catalog request failed.", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "The reviewed Wellness Toolkit is temporarily unavailable." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}

function stringTags(value: unknown): string[] { return Array.isArray(value) ? value.filter((tag): tag is string => typeof tag === "string" && tag.length < 80) : []; }
