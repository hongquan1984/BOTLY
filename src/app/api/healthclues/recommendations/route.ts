import { NextResponse } from "next/server";
import { isApiError, isHealthCluesOwnerDemo, requireUser, serviceRest } from "@/features/healthclues/server";
import { rankPersonalizedRecommendations, RECOMMENDATION_RULE_VERSION, type PersonalProfile, type RecommendationCandidate } from "@/features/healthclues/personalized-recommendations";
import { resolveJourneyPlaybook } from "@/features/healthclues/gout-playbook";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "no-store, max-age=0, private" };

export async function GET(request: Request) {
  const auth = await requireUser(request);
  if (isApiError(auth)) return auth.response;
  const params = new URL(request.url).searchParams;
  const worldId = params.get("worldId") || "";
  if (!/^[0-9a-f-]{36}$/i.test(worldId)) return NextResponse.json({ error: "A valid World is required." }, { status: 400, headers: noStore });
  try {
    const worlds = await serviceRest<Array<{ id: string }>>(`healthclues_wellness_worlds?id=eq.${worldId}&user_id=eq.${auth.id}&select=id&limit=1`);
    if (!worlds.length) return NextResponse.json({ error: "That World is not available to this account." }, { status: 404, headers: noStore });
    const [profiles, catalogRows, versions, history, tools, careRecords, medicationContext, collection] = await Promise.all([
      serviceRest<Array<{ profile: PersonalProfile }>>(`healthclues_profiles?user_id=eq.${auth.id}&select=profile&limit=1`),
      serviceRest<Array<{ id: string; slug: string; item_type: string; slot_key: string; current_version: number; recommendation_eligible: boolean }>>(`healthclues_catalog_items?active=eq.true&review_status=eq.reviewed&select=id,slug,item_type,slot_key,current_version,recommendation_eligible&order=id.asc&limit=500`),
      serviceRest<Array<{ catalog_item_id: string; version: number; name: string; description: string; evidence_class: string; evidence_summary: string | null; safety_notes: string | null; source_provenance: unknown; reviewed_by: string | null }>>(`healthclues_catalog_item_versions?select=catalog_item_id,version,name,description,evidence_class,evidence_summary,safety_notes,source_provenance,reviewed_by&order=catalog_item_id.asc,version.desc&limit=1000`),
      serviceRest<Array<{ catalog_item_id: string; event_type: string; feedback_code: string | null; created_at: string }>>(`healthclues_recommendation_events?user_id=eq.${auth.id}&world_id=eq.${worldId}&select=catalog_item_id,event_type,feedback_code,created_at&order=created_at.desc&limit=500`),
      serviceRest<Array<{ catalog_item_id: string | null; status: string }>>(`healthclues_toolkit_entries?user_id=eq.${auth.id}&world_id=eq.${worldId}&status=eq.equipped&select=catalog_item_id,status&limit=3`),
      serviceRest<Array<{ catalog_item_id: string | null }>>(`healthclues_personal_care_records?user_id=eq.${auth.id}&world_id=eq.${worldId}&record_type=eq.user_method&status=eq.active&select=catalog_item_id&limit=200`),
      serviceRest<Array<{ id: string }>>(`healthclues_personal_care_records?user_id=eq.${auth.id}&world_id=eq.${worldId}&record_type=eq.medication&status=eq.active&select=id&limit=1`),
      serviceRest<Array<{ catalog_item_id: string }>>(`healthclues_toolkit_collection?user_id=eq.${auth.id}&select=catalog_item_id&limit=500`),
    ]);
    const demo = isHealthCluesOwnerDemo();
    const candidates: RecommendationCandidate[] = catalogRows.flatMap(row => {
      const version = versions.find(item => item.catalog_item_id === row.id && item.version === row.current_version);
      if (!version) return [];
      const p = version.source_provenance && typeof version.source_provenance === "object" && !Array.isArray(version.source_provenance) ? version.source_provenance as Record<string, unknown> : {};
      const demoOnly = version.reviewed_by === "test-fixture" || p.demo_only === true;
      if (demoOnly && !demo) return [];
      const tags = (value: unknown) => Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
      const category = /movement|activity|walk|mobility/i.test(`${row.item_type} ${row.slug}`) ? "movement" : /food|herb|nutrition|botanical|drink/i.test(`${row.item_type} ${row.slug}`) || row.slot_key === "consume" ? "nutrition" : "practices";
      return [{ id: row.id, version: row.current_version, name: version.name, description: version.description, category, slot: row.slot_key,
        topicTags: tags(p.topic_tags), goalTags: tags(p.goal_tags), preferenceTags: tags(p.preference_tags), estimatedMinutes: typeof p.estimated_minutes === "number" ? p.estimated_minutes : null,
        demoOnly, recommendationEligible: row.recommendation_eligible, personalizationEligibility: p.personalization_eligibility === "eligible" || p.personalization_eligibility === "education_only" || p.personalization_eligibility === "caution" ? p.personalization_eligibility : "unknown",
        requiresMedicationContext: p.requires_medication_context === true, requiresKnownFoodSafety: p.requires_known_food_safety === true, requiresKnownActivitySafety: p.requires_known_activity_safety === true,
        requiresKnownFluidSafety: p.requires_known_fluid_safety === true, ingredientTags: tags(p.ingredient_tags), evidenceClass: version.evidence_class, evidenceSummary: version.evidence_summary, safetyNotes: version.safety_notes }];
    });
    const profile: PersonalProfile = profiles[0]?.profile || {};
    if (medicationContext.length) profile.safetyContext = { ...(profile.safetyContext || {}), medicationOrSupplement: "yes" };
    const dismissed = history.filter(item => item.event_type === "dismissed" || (item.event_type === "feedback" && ["not_interested", "too_difficult", "no_time"].includes(item.feedback_code || ""))).map(item => item.catalog_item_id);
    const alternativeRequested = history.filter(item => item.event_type === "feedback" && item.feedback_code === "want_alternative").map(item => item.catalog_item_id);
    const previouslyShown = history.filter(item => item.event_type === "shown").map(item => item.catalog_item_id);
    const equipped = tools.flatMap(item => item.catalog_item_id ? [item.catalog_item_id] : []);
    const tracked = careRecords.flatMap(item => item.catalog_item_id ? [item.catalog_item_id] : []);
    const saved = collection.map(item => item.catalog_item_id);
    const station = params.get("station") || undefined;
    if (station && !["nutrition", "movement", "practices"].includes(station)) return NextResponse.json({ error: "Unknown discovery station." }, { status: 400, headers: noStore });
    const results = rankPersonalizedRecommendations(profile, candidates, { dismissedIds: dismissed, alternativeRequestedIds: alternativeRequested, equippedIds: equipped, trackedIds: tracked, savedIds: saved, previouslyShownIds: previouslyShown, station, limit: station ? 5 : 3 });
    const safetyNotice = profile.safetyContext?.urgentSymptoms === "yes" ? "Your Quiz response mentioned new, severe, or quickly worsening symptoms. Please seek timely medical assessment; this game cannot assess or treat symptoms. If you feel in immediate danger, contact local emergency services." : null;
    return NextResponse.json({ engineVersion: RECOMMENDATION_RULE_VERSION, profile: { topic: profile.topic || null, goals: profile.twoWeekGoal || null, preferences: profile.contentPreferences || [], time: profile.comfortableActivityTime || null }, playbook: resolveJourneyPlaybook(profile), safetyNotice, items: results }, { headers: noStore });
  } catch (error) {
    console.error("HealthClues recommendation request failed.", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Personalized suggestions are temporarily unavailable." }, { status: 503, headers: noStore });
  }
}

export async function PATCH(request: Request) {
  const auth = await requireUser(request);
  if (isApiError(auth)) return auth.response;
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid preference update." }, { status: 400, headers: noStore }); }
  if (typeof body.worldId !== "string" || !/^[0-9a-f-]{36}$/i.test(body.worldId) || !["preference", "time"].includes(String(body.field)) || typeof body.value !== "string" || body.value.length > 80) return NextResponse.json({ error: "Choose a supported preference." }, { status: 400, headers: noStore });
  const allowed = body.field === "preference" ? ["Food & recipes", "Gentle movement", "Relaxation", "Open to exploring"] : ["Under 5 minutes", "5-15 minutes", "More than 15 minutes", "Not sure"];
  if (!allowed.includes(body.value)) return NextResponse.json({ error: "Choose a supported preference." }, { status: 400, headers: noStore });
  try {
    const worlds = await serviceRest<Array<{ id: string }>>(`healthclues_wellness_worlds?id=eq.${body.worldId}&user_id=eq.${auth.id}&select=id&limit=1`);
    if (!worlds.length) return NextResponse.json({ error: "That World is not available to this account." }, { status: 404, headers: noStore });
    const rows = await serviceRest<Array<{ profile: Record<string, unknown> }>>(`healthclues_profiles?user_id=eq.${auth.id}&select=profile&limit=1`);
    if (!rows.length) return NextResponse.json({ error: "Complete the Discovery Quiz before saving personalized preferences." }, { status: 409, headers: noStore });
    const profile = rows[0]?.profile || {};
    const next = body.field === "preference" ? { ...profile, contentPreferences: [body.value] } : { ...profile, comfortableActivityTime: body.value };
    await serviceRest(`healthclues_profiles?user_id=eq.${auth.id}`, { method: "PATCH", body: JSON.stringify({ profile: next, updated_at: new Date().toISOString() }) });
    return NextResponse.json({ updated: true }, { headers: noStore });
  } catch {
    return NextResponse.json({ error: "Your private preference could not be updated." }, { status: 503, headers: noStore });
  }
}

export async function POST(request: Request) {
  const auth = await requireUser(request);
  if (isApiError(auth)) return auth.response;
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid recommendation event." }, { status: 400, headers: noStore }); }
  if (typeof body.worldId !== "string" || !/^[0-9a-f-]{36}$/i.test(body.worldId) || typeof body.catalogItemId !== "string" || body.catalogItemId.length > 120 || !Number.isInteger(body.itemVersion) || typeof body.eventKey !== "string" || !/^[0-9a-f-]{36}$/i.test(body.eventKey) || !["shown","saved","equipped","dismissed","replaced","feedback"].includes(String(body.eventType)) || (body.feedbackCode !== undefined && !["not_interested","too_difficult","no_time","want_alternative"].includes(String(body.feedbackCode)))) return NextResponse.json({ error: "Recommendation event is incomplete." }, { status: 400, headers: noStore });
  try {
    const worlds = await serviceRest<Array<{ id: string }>>(`healthclues_wellness_worlds?id=eq.${body.worldId}&user_id=eq.${auth.id}&select=id&limit=1`);
    if (!worlds.length) return NextResponse.json({ error: "That World is not available to this account." }, { status: 404, headers: noStore });
    const reasonAllowlist = new Set(["topic", "goal", "preference", "time_mismatch", "already_equipped", "already_tracked", "already_saved", "previously_shown", "alternative_requested", "previously_dismissed", "general_education"]);
    await serviceRest("healthclues_recommendation_events", { method: "POST", headers: { Prefer: "resolution=ignore-duplicates,return=minimal" }, body: JSON.stringify({ user_id: auth.id, world_id: body.worldId, catalog_item_id: body.catalogItemId, item_version: body.itemVersion, event_type: body.eventType, feedback_code: body.feedbackCode || null, reason_codes: Array.isArray(body.reasonCodes) ? body.reasonCodes.filter((value): value is string => typeof value === "string" && reasonAllowlist.has(value)).slice(0, 8) : [], engine_version: RECOMMENDATION_RULE_VERSION, event_key: body.eventKey }) });
    return NextResponse.json({ saved: true }, { headers: noStore });
  } catch {
    return NextResponse.json({ error: "The private recommendation update could not be saved." }, { status: 503, headers: noStore });
  }
}
