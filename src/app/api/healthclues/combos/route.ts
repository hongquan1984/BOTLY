import { NextResponse } from "next/server";
import { isApiError, requireUser, serviceRest } from "@/features/healthclues/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "no-store, max-age=0, private" };
type CatalogVersion = { catalog_item_id: string; version: number; name: string; description: string; evidence_class: string; evidence_summary: string | null; safety_notes: string | null; contraindications: unknown[] };
type Component = { catalog_item_id: string; item_version: number; slot_key: string; required: boolean; rationale: string | null; method_id?: string | null; method_version?: number | null; relationship?: string };

async function eligibleVersions(components: Component[]) {
  const ids = [...new Set(components.map(row => row.catalog_item_id))];
  if (!ids.length) return [];
  const [items, versions] = await Promise.all([
    serviceRest<Array<{ id: string; current_version: number; slot_key: string }>>(`healthclues_catalog_items?id=in.(${ids.map(encodeURIComponent).join(",")})&active=eq.true&review_status=eq.reviewed&recommendation_eligible=eq.true&select=id,current_version,slot_key&limit=100`),
    serviceRest<CatalogVersion[]>(`healthclues_catalog_item_versions?catalog_item_id=in.(${ids.map(encodeURIComponent).join(",")})&select=catalog_item_id,version,name,description,evidence_class,evidence_summary,safety_notes,contraindications&limit=300`),
  ]);
  return components.flatMap(component => {
    const item = items.find(row => row.id === component.catalog_item_id && row.current_version === component.item_version && row.slot_key === component.slot_key);
    const version = versions.find(row => row.catalog_item_id === component.catalog_item_id && row.version === component.item_version);
    return item && version ? [{ ...component, name: version.name, description: version.description, evidenceClass: version.evidence_class, evidenceSummary: version.evidence_summary, safetyNotes: version.safety_notes, contraindications: version.contraindications }] : [];
  });
}

export async function GET(request: Request) {
  const auth = await requireUser(request);
  if (isApiError(auth)) return auth.response;
  try {
    const recipeDefinitions = await serviceRest<Array<{ id: string; version: number; recipe_item_id: string; recipe_item_version: number; method_id: string | null; method_version: number | null }>>(`healthclues_recipe_combos?active=eq.true&review_status=eq.reviewed&select=id,version,recipe_item_id,recipe_item_version,method_id,method_version&order=id.asc,version.desc&limit=100`);
    const recipes = await Promise.all(recipeDefinitions.map(async recipe => {
      const parts: Component[] = [{ catalog_item_id: recipe.recipe_item_id, item_version: recipe.recipe_item_version, slot_key: "consume", required: true, rationale: null }];
      let method: { name: string; instructions: unknown[]; safety_notes: string | null } | null = null;
      if (recipe.method_id && recipe.method_version) {
        const [methodStatus, methodVersion, methodParts] = await Promise.all([
          serviceRest<Array<{ id: string; active: boolean; review_status: string; current_version: number }>>(`healthclues_usage_methods?id=eq.${encodeURIComponent(recipe.method_id)}&select=id,active,review_status,current_version&limit=1`),
          serviceRest<Array<{ name: string; instructions: unknown[]; safety_notes: string | null; review_status: string }>>(`healthclues_usage_method_versions?method_id=eq.${encodeURIComponent(recipe.method_id)}&version=eq.${recipe.method_version}&select=name,instructions,safety_notes,review_status&limit=1`),
          serviceRest<Array<{ catalog_item_id: string; item_version: number; relationship: string; is_required: boolean; display_order: number }>>(`healthclues_usage_method_items?method_id=eq.${encodeURIComponent(recipe.method_id)}&method_version=eq.${recipe.method_version}&select=catalog_item_id,item_version,relationship,is_required,display_order&order=display_order.asc&limit=100`),
        ]);
        if (!methodStatus[0]?.active || methodStatus[0].review_status !== "reviewed" || methodStatus[0].current_version !== recipe.method_version || methodVersion[0]?.review_status !== "reviewed") return null;
        method = methodVersion[0];
        parts.push(...methodParts.map(row => ({ catalog_item_id: row.catalog_item_id, item_version: row.item_version, slot_key: "consume", required: row.is_required, rationale: null, method_id: recipe.method_id, method_version: recipe.method_version, relationship: row.relationship })));
      }
      const components = await eligibleVersions(parts);
      return components.length === parts.length ? { kind: "recipe", id: recipe.id, version: recipe.version, title: components[0]?.name ?? "Reviewed recipe", method, components } : null;
    }));

    const journeyDefinitions = await serviceRest<Array<{ id: string; version: number; name: string; rationale: string | null; partial_acceptance: string }>>(`healthclues_journey_combos?active=eq.true&review_status=eq.reviewed&select=id,version,name,rationale,partial_acceptance&order=id.asc,version.desc&limit=100`);
    const journeys = await Promise.all(journeyDefinitions.map(async combo => {
      const rows = await serviceRest<Component[]>(`healthclues_journey_combo_components?combo_id=eq.${encodeURIComponent(combo.id)}&combo_version=eq.${combo.version}&select=catalog_item_id,item_version,slot_key,required,rationale,method_id,method_version&order=display_order.asc&limit=100`);
      const components = await eligibleVersions(rows);
      return components.length ? { kind: "journey", id: combo.id, version: combo.version, title: combo.name, rationale: combo.rationale, partialAcceptance: combo.partial_acceptance, components } : null;
    }));
    return NextResponse.json({ recipes: recipes.filter(Boolean), journeys: journeys.filter(Boolean) }, { headers });
  } catch (error) {
    console.error("HealthClues Combo query failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Reviewed Journey Combos are temporarily unavailable." }, { status: 503, headers });
  }
}
