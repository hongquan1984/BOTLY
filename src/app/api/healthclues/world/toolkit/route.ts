import { NextResponse } from "next/server";
import { isApiError, isHealthCluesOwnerDemo, requireUser, serviceRest, userRpc, validUuid } from "@/features/healthclues/server";
import { rankPersonalizedRecommendations, type PersonalProfile, type RecommendationCandidate } from "@/features/healthclues/personalized-recommendations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store, max-age=0" };
const actions = ["pause", "resume", "archive", "schedule", "replace"] as const;
type Action = typeof actions[number];

export async function POST(request: Request) {
  const auth = await requireUser(request);
  if (isApiError(auth)) return auth.response;
  let body: { worldId?: unknown; catalogItemId?: unknown; itemVersion?: unknown; requestKey?: unknown; equipmentPosition?: unknown; replaceEntryId?: unknown; discoveryStation?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Choose a reviewed Collection item." }, { status: 400, headers: noStore }); }
  if (!validUuid(body.worldId) || !validUuid(body.requestKey) || typeof body.catalogItemId !== "string" || body.catalogItemId.length > 120 || !Number.isInteger(body.itemVersion) || (body.equipmentPosition !== undefined && (!Number.isInteger(body.equipmentPosition) || Number(body.equipmentPosition)<1 || Number(body.equipmentPosition)>3)) || (body.replaceEntryId !== undefined && !validUuid(body.replaceEntryId)) || (body.discoveryStation !== undefined && !["nutrition", "practices", "movement"].includes(String(body.discoveryStation)))) {
    return NextResponse.json({ error: "Choose a valid reviewed item for your World." }, { status: 400, headers: noStore });
  }
  try {
    const [version, catalogItem] = await Promise.all([
      serviceRest<Array<{ reviewed_by: string | null; source_provenance: unknown; name: string; description: string; evidence_class: string; evidence_summary: string | null; safety_notes: string | null }>>(`healthclues_catalog_item_versions?catalog_item_id=eq.${encodeURIComponent(body.catalogItemId)}&version=eq.${body.itemVersion}&select=reviewed_by,source_provenance,name,description,evidence_class,evidence_summary,safety_notes&limit=1`),
      serviceRest<Array<{ slot_key: "consume" | "reduce" | "practice"; item_type: string; slug: string }>>(`healthclues_catalog_items?id=eq.${encodeURIComponent(body.catalogItemId)}&active=eq.true&review_status=eq.reviewed&recommendation_eligible=eq.true&current_version=eq.${body.itemVersion}&select=slot_key,item_type,slug&limit=1`),
    ]);
    const provenance = version[0]?.source_provenance && typeof version[0].source_provenance === "object" && !Array.isArray(version[0].source_provenance) ? version[0].source_provenance as Record<string, unknown> : {};
    const demoFixture = body.catalogItemId.startsWith("hc-demo-") || version[0]?.reviewed_by === "test-fixture" || provenance.demo_only === true;
    if (demoFixture && !isHealthCluesOwnerDemo()) return NextResponse.json({ error: "TEST ONLY equipment is available only in the isolated owner demo." }, { status: 404, headers: noStore });
    if (!catalogItem.length) return NextResponse.json({ error: "This item is no longer eligible for your Backpack." }, { status: 409, headers: noStore });
    const discoveryStation = body.discoveryStation as "nutrition" | "practices" | "movement" | undefined;
    if (discoveryStation) {
      const category = String(provenance.category || "");
      const itemDescriptor = `${catalogItem[0].item_type} ${catalogItem[0].slug} ${category}`.toLowerCase();
      const sourceMatches = discoveryStation === "nutrition"
        ? catalogItem[0].slot_key === "consume" && /herb|botanical/i.test(itemDescriptor)
        : discoveryStation === "movement"
          ? catalogItem[0].slot_key !== "consume" && /movement|mobility|walk|activity/i.test(itemDescriptor)
          : catalogItem[0].slot_key !== "consume" && /breath|mindfulness|relax|wellness|stress|sleep/i.test(itemDescriptor) && !/movement|mobility|walk|activity/i.test(itemDescriptor);
      if (!sourceMatches) return NextResponse.json({ error: "This item does not match the selected discovery station." }, { status: 400, headers: noStore });
    }
    const world = await serviceRest<Array<{ id: string }>>(`healthclues_wellness_worlds?id=eq.${body.worldId}&user_id=eq.${auth.id}&select=id&limit=1`);
    if (!world.length) return NextResponse.json({ error: "That World is not available to this account." }, { status: 404, headers: noStore });
    const [profileRows, activeMedication] = await Promise.all([
      serviceRest<Array<{ profile: PersonalProfile }>>(`healthclues_profiles?user_id=eq.${auth.id}&select=profile&limit=1`),
      serviceRest<Array<{ id: string }>>(`healthclues_personal_care_records?user_id=eq.${auth.id}&world_id=eq.${body.worldId}&record_type=eq.medication&status=eq.active&select=id&limit=1`),
    ]);
    const profile: PersonalProfile = profileRows[0]?.profile || {};
    if (activeMedication.length) profile.safetyContext = { ...(profile.safetyContext || {}), medicationOrSupplement: "yes" };
    const tags = (value: unknown) => Array.isArray(value) ? value.filter((tag): tag is string => typeof tag === "string") : [];
    const itemType = catalogItem[0].slot_key === "consume" ? "nutrition" : catalogItem[0].slot_key === "practice" ? "practices" : "movement";
    const candidate: RecommendationCandidate = { id: String(body.catalogItemId), version: Number(body.itemVersion), name: version[0].name, description: version[0].description, category: itemType, slot: catalogItem[0].slot_key, topicTags: tags(provenance.topic_tags), goalTags: tags(provenance.goal_tags), preferenceTags: tags(provenance.preference_tags), estimatedMinutes: typeof provenance.estimated_minutes === "number" ? provenance.estimated_minutes : null, demoOnly: demoFixture, recommendationEligible: true, personalizationEligibility: provenance.personalization_eligibility === "eligible" || provenance.personalization_eligibility === "education_only" || provenance.personalization_eligibility === "caution" ? provenance.personalization_eligibility : "unknown", requiresMedicationContext: provenance.requires_medication_context === true, requiresKnownFoodSafety: provenance.requires_known_food_safety === true, requiresKnownActivitySafety: provenance.requires_known_activity_safety === true, requiresKnownFluidSafety: provenance.requires_known_fluid_safety === true, ingredientTags: tags(provenance.ingredient_tags), evidenceClass: version[0].evidence_class, evidenceSummary: version[0].evidence_summary, safetyNotes: version[0].safety_notes };
    const eligible = rankPersonalizedRecommendations(profile, [candidate], { limit: 1 })[0];
    if (!eligible?.equipmentEligible) return NextResponse.json({ error: "This tool is not currently eligible for personalized Backpack equipment with the information available. It may remain available for general learning." }, { status: 409, headers: noStore });
    const legacyPosition: Record<string, number> = { consume: 1, reduce: 2, practice: 3 };
    const position = Number(body.equipmentPosition ?? legacyPosition[catalogItem[0].slot_key]);
    const result = await userRpc<{ entry_id: string; reused: boolean; slot_key: string }>(discoveryStation ? "healthclues_equip_tool_from_station_v1" : "healthclues_equip_tool_v2", {
      p_user_id: auth.id,
      p_world_id: body.worldId,
      p_catalog_item_id: body.catalogItemId,
      p_item_version: body.itemVersion,
      p_request_key: body.requestKey,
      p_equipment_position: position,
      p_replace_entry_id: body.replaceEntryId ?? null,
      p_allow_demo_fixture: isHealthCluesOwnerDemo(),
      ...(discoveryStation ? { p_discovery_station: discoveryStation } : {}),
    });
    return NextResponse.json(result, { status: result.reused ? 200 : 201, headers: noStore });
  } catch (error) {
    console.error("HealthClues Collection equip failed", error instanceof Error ? error.message : "unknown");
    const message = error instanceof Error && error.message.includes("world_not_owned")
      ? "That Wellness World is not available to this account."
      : error instanceof Error && error.message.includes("backpack_position_occupied")
        ? "That Backpack slot is occupied. Choose Replace and confirm the item to continue."
      : error instanceof Error && error.message.includes("backpack_full")
        ? "Your Backpack is full. Choose one equipped item to replace."
      : error instanceof Error && error.message.includes("item_not_eligible")
        ? "This item is no longer active and reviewed. Refresh the Catalog and try again."
        : "The reviewed item could not be equipped. Refresh your World and try again.";
    return NextResponse.json({ error: message }, { status: 409, headers: noStore });
  }
}

export async function PATCH(request: Request) {
  const auth = await requireUser(request);
  if (isApiError(auth)) return auth.response;
  let body: { entryId?: unknown; action?: unknown; catalogItemId?: unknown; itemVersion?: unknown; schedule?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid Toolkit change." }, { status: 400, headers: noStore }); }
  if (!validUuid(body.entryId) || typeof body.action !== "string" || !actions.includes(body.action as Action)) {
    return NextResponse.json({ error: "Choose a valid Toolkit action." }, { status: 400, headers: noStore });
  }
  if (body.action === "replace" && (typeof body.catalogItemId !== "string" || body.catalogItemId.length > 120 || !Number.isInteger(body.itemVersion))) {
    return NextResponse.json({ error: "Select a reviewed replacement for this slot." }, { status: 400, headers: noStore });
  }
  if (body.action === "schedule" && (!body.schedule || typeof body.schedule !== "object" || Array.isArray(body.schedule) || JSON.stringify(body.schedule).length > 2000)) {
    return NextResponse.json({ error: "Add a valid schedule." }, { status: 400, headers: noStore });
  }
  try {
    const result = await userRpc<{ entry_id: string; status: string; replacement_entry_id?: string }>("healthclues_manage_toolkit_entry_v1", {
      p_user_id: auth.id, p_entry_id: body.entryId, p_action: body.action,
      p_catalog_item_id: body.action === "replace" ? body.catalogItemId : null,
      p_item_version: body.action === "replace" ? body.itemVersion : null,
      p_schedule: body.action === "schedule" || body.action === "replace" ? body.schedule ?? null : null,
    });
    return NextResponse.json(result, { headers: noStore });
  } catch (error) {
    const message = error instanceof Error && error.message.includes("replacement_not_eligible")
      ? "That tool is not a reviewed replacement for this slot. Refresh the catalog and choose another."
      : "The Toolkit could not be updated. Refresh your World and try again.";
    return NextResponse.json({ error: message }, { status: 409, headers: noStore });
  }
}
