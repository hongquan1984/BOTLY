import { NextResponse } from "next/server";
import { isApiError, requireUser, serviceRest, userRpc, validUuid } from "@/features/healthclues/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "no-store, max-age=0, private" };
type PublicJourney = { id: string; journey_id: string; alias: string; title: string; public_topics: string[]; sharing_catalog_items: boolean; sharing_methods: boolean; sharing_timeline: boolean; sharing_frequency: boolean; projection: Record<string, unknown>; updated_at: string };
type PublicUsage = { public_journey_id: string; catalog_item_id: string; method_id: string | null; match_item_consent: boolean; match_method_consent: boolean; timeline_projection: unknown[] };

export async function GET(request: Request) {
  const auth = await requireUser(request);
  if (isApiError(auth)) return auth.response;
  const params = new URL(request.url).searchParams;
  const id = params.get("id");
  const catalogItemId = params.get("catalogItemId");
  const methodId = params.get("methodId");
  const mine = params.get("mine") === "1";
  if (id && !validUuid(id)) return NextResponse.json({ error: "Choose a valid public journey." }, { status: 400, headers });
  if (catalogItemId && !/^[a-z0-9-]{1,120}$/.test(catalogItemId)) return NextResponse.json({ error: "Choose a valid Catalog item." }, { status: 400, headers });
  if (methodId && !/^[a-z0-9-]{1,120}$/.test(methodId)) return NextResponse.json({ error: "Choose a valid Usage Method." }, { status: 400, headers });
  try {
    let rows: PublicJourney[];
    if (id) rows = await serviceRest<PublicJourney[]>(`healthclues_public_journeys?id=eq.${id}&status=eq.active&select=id,journey_id,alias,title,public_topics,sharing_catalog_items,sharing_methods,sharing_timeline,sharing_frequency,projection,updated_at&limit=1`);
    else if (mine) rows = await serviceRest<PublicJourney[]>(`healthclues_public_journeys?user_id=eq.${auth.id}&select=id,journey_id,alias,title,public_topics,sharing_catalog_items,sharing_methods,sharing_timeline,sharing_frequency,projection,updated_at,status&order=updated_at.desc&limit=100`);
    else {
      rows = await serviceRest<PublicJourney[]>(`healthclues_public_journeys?status=eq.active&select=id,journey_id,alias,title,public_topics,sharing_catalog_items,sharing_methods,sharing_timeline,sharing_frequency,projection,updated_at&order=updated_at.desc&limit=100`);
      if (catalogItemId || methodId) {
        const hits = await serviceRest<PublicUsage[]>(`healthclues_public_tool_usages?${catalogItemId ? `catalog_item_id=eq.${encodeURIComponent(catalogItemId)}&match_item_consent=eq.true&` : ""}${methodId ? `method_id=eq.${encodeURIComponent(methodId)}&match_method_consent=eq.true&` : ""}select=public_journey_id&limit=500`);
        const hitIds = new Set(hits.map(hit => hit.public_journey_id));
        rows = rows.filter(row => hitIds.has(row.id));
      }
    }
    const usageRows = rows.length ? await serviceRest<PublicUsage[]>(`healthclues_public_tool_usages?public_journey_id=in.(${rows.map(row => row.id).join(",")})&select=public_journey_id,catalog_item_id,method_id,match_item_consent,match_method_consent,timeline_projection&limit=1000`) : [];
    const following = rows.length ? await serviceRest<Array<{ public_journey_id: string }>>(`healthclues_journey_follows?follower_user_id=eq.${auth.id}&public_journey_id=in.(${rows.map(row => row.id).join(",")})&select=public_journey_id&limit=200`) : [];
    const followingIds = new Set(following.map(item => item.public_journey_id));
    const journeys = rows.map(row => ({
      id: row.id, alias: row.alias, title: row.title, publicTopics: row.public_topics,
      ...(mine ? { status: (row as PublicJourney & { status?: string }).status } : {}),
      projection: row.projection,
      sharedTools: usageRows.filter(usage => usage.public_journey_id === row.id).map(usage => ({
        ...(usage.match_item_consent ? { catalogItemId: usage.catalog_item_id } : {}),
        ...(usage.match_method_consent && usage.method_id ? { methodId: usage.method_id } : {}),
        ...(row.sharing_timeline ? { timeline: usage.timeline_projection } : {}),
      })).filter(item => Object.keys(item).length),
      sharingFrequency: row.sharing_frequency ? "opted_in" : null,
      following: followingIds.has(row.id), updatedAt: row.updated_at,
    }));
    return NextResponse.json({ journeys }, { headers });
  } catch (error) {
    console.error("HealthClues Community read failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "The public journey library is temporarily unavailable." }, { status: 503, headers });
  }
}

export async function POST(request: Request) {
  const auth = await requireUser(request);
  if (isApiError(auth)) return auth.response;
  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; } catch { return NextResponse.json({ error: "Choose a Community action." }, { status: 400, headers }); }
  const action = body.action;
  try {
    if (action === "share") {
      if (!validUuid(body.journeyId) || typeof body.alias !== "string" || body.alias.trim().length < 2 || body.alias.length > 40 || typeof body.title !== "string" || body.title.trim().length < 1 || body.title.length > 120 || !Array.isArray(body.publicTopics) || !Array.isArray(body.catalogItemIds) || !Array.isArray(body.methodIds) || typeof body.shareTimeline !== "boolean" || typeof body.shareFrequency !== "boolean" || body.shareReflections !== false) return NextResponse.json({ error: "Choose explicit public fields. Private reflections cannot be projected." }, { status: 400, headers });
      const journeyId = body.journeyId;
      const journeys = await serviceRest<Array<{ id: string; user_id: string; branch_id: string; title: string; started_on: string }>>(`healthclues_journeys?id=eq.${journeyId}&user_id=eq.${auth.id}&select=id,user_id,branch_id,title,started_on&limit=1`);
      const ownJourney = journeys[0];
      if (!ownJourney) return NextResponse.json({ error: "That journey is not available to this account." }, { status: 404, headers });
      const branches = await serviceRest<Array<{ topic_key: string }>>(`healthclues_branches?id=eq.${ownJourney.branch_id}&user_id=eq.${auth.id}&select=topic_key&limit=1`);
      if (!branches[0]) return NextResponse.json({ error: "That journey has no shareable topic." }, { status: 409, headers });
      const allowedTopics = new Set([branches[0].topic_key]);
      const requestedTopics = (body.publicTopics as unknown[]).filter((topic): topic is string => typeof topic === "string" && allowedTopics.has(topic));
      const entries = await serviceRest<Array<{ id: string; catalog_item_id: string | null; method_id: string | null; status: string }>>(`healthclues_toolkit_entries?journey_id=eq.${journeyId}&user_id=eq.${auth.id}&select=id,catalog_item_id,method_id,status&limit=200`);
      const selectedCatalog = [...new Set((body.catalogItemIds as unknown[]).filter((id): id is string => typeof id === "string" && /^[a-z0-9-]{1,120}$/.test(id)))];
      const selectedMethods = [...new Set((body.methodIds as unknown[]).filter((id): id is string => typeof id === "string" && /^[a-z0-9-]{1,120}$/.test(id)))];
      const toolUsages = entries.filter(entry => entry.catalog_item_id && selectedCatalog.includes(entry.catalog_item_id) && entry.status !== "archived");
      const methodUsages = toolUsages.filter(entry => entry.method_id && selectedMethods.includes(entry.method_id));
      if (selectedCatalog.some(id => !toolUsages.some(entry => entry.catalog_item_id === id)) || selectedMethods.some(id => !methodUsages.some(entry => entry.method_id === id))) return NextResponse.json({ error: "Choose only tools or methods that belong to this journey." }, { status: 422, headers });
      if (!requestedTopics.length || (!selectedCatalog.length && !selectedMethods.length)) return NextResponse.json({ error: "Share at least one topic and one specific reviewed item or method." }, { status: 422, headers });
      const ids = [...new Set(toolUsages.map(entry => entry.id))];
      const usage = ids.length ? await serviceRest<Array<{ toolkit_entry_id: string; checkin_id: string; status: string; occurrence_count: number | null }>>(`healthclues_daily_usage_records?user_id=eq.${auth.id}&toolkit_entry_id=in.(${ids.join(",")})&select=toolkit_entry_id,checkin_id,status,occurrence_count&limit=1000`) : [];
      const checkinIds = [...new Set(usage.map(item => item.checkin_id))];
      const dates = checkinIds.length ? await serviceRest<Array<{ id: string; local_date: string }>>(`healthclues_daily_checkins?id=in.(${checkinIds.join(",")})&user_id=eq.${auth.id}&select=id,local_date&limit=1000`) : [];
      const dateByCheckin = new Map(dates.map(row => [row.id, row.local_date]));
      const entriesToShare = toolUsages.map(entry => {
        const itemRows = usage.filter(record => record.toolkit_entry_id === entry.id);
        return { entry, timeline: body.shareTimeline === true ? itemRows.map(record => ({ date: dateByCheckin.get(record.checkin_id), status: record.status, ...(body.shareFrequency === true ? { occurrences: record.occurrence_count } : {}) })).filter(record => record.date) : [] };
      });
      const projection = { topicKey: requestedTopics[0], sharedFields: { catalogItems: selectedCatalog.length > 0, methods: selectedMethods.length > 0, timeline: body.shareTimeline === true, frequency: body.shareFrequency === true, reflections: false } };
      const existing = await serviceRest<Array<{ id: string }>>(`healthclues_public_journeys?journey_id=eq.${journeyId}&select=id&limit=1`);
      const publicRows = await serviceRest<Array<{ id: string }>>("healthclues_public_journeys?on_conflict=journey_id", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=representation" }, body: JSON.stringify({ user_id: auth.id, journey_id: journeyId, alias: body.alias.trim(), title: body.title.trim(), public_topics: requestedTopics, sharing_catalog_items: selectedCatalog.length > 0, sharing_methods: selectedMethods.length > 0, sharing_timeline: body.shareTimeline, sharing_frequency: body.shareFrequency, sharing_reflections: false, consent_version: "healthclues-community-share-v1", consented_at: new Date().toISOString(), status: "active", projection, updated_at: new Date().toISOString() }) });
      const publicId = publicRows[0]?.id ?? existing[0]?.id;
      if (!publicId) throw new Error("public_projection_write_failed");
      await serviceRest("healthclues_public_tool_usages?public_journey_id=eq." + publicId, { method: "DELETE" });
      if (entriesToShare.length) await serviceRest("healthclues_public_tool_usages", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify(entriesToShare.map(({ entry, timeline }) => ({ public_journey_id: publicId, catalog_item_id: entry.catalog_item_id, method_id: entry.method_id && selectedMethods.includes(entry.method_id) ? entry.method_id : null, match_item_consent: Boolean(entry.catalog_item_id && selectedCatalog.includes(entry.catalog_item_id)), match_method_consent: Boolean(entry.method_id && selectedMethods.includes(entry.method_id)), timeline_projection: timeline }))) });
      return NextResponse.json({ publicJourneyId: publicId, status: "active" }, { status: existing.length ? 200 : 201, headers });
    }
    if (action === "revoke" || action === "follow" || action === "unfollow" || action === "report") {
      if (!validUuid(body.publicJourneyId)) return NextResponse.json({ error: "Choose a valid public journey." }, { status: 400, headers });
      const publicId = body.publicJourneyId;
      const active = await serviceRest<Array<{ id: string; user_id: string; status: string }>>(`healthclues_public_journeys?id=eq.${publicId}&select=id,user_id,status&limit=1`);
      if (!active[0]) return NextResponse.json({ error: "That public journey is not available." }, { status: 404, headers });
      if (action === "revoke") {
        if (active[0].user_id !== auth.id) return NextResponse.json({ error: "Only the owner can revoke sharing." }, { status: 403, headers });
        await serviceRest(`healthclues_public_journeys?id=eq.${publicId}&user_id=eq.${auth.id}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ status: "revoked", updated_at: new Date().toISOString() }) });
        return NextResponse.json({ status: "revoked" }, { headers });
      }
      if (action === "unfollow") {
        await serviceRest(`healthclues_journey_follows?follower_user_id=eq.${auth.id}&public_journey_id=eq.${publicId}`, { method: "DELETE" });
        return NextResponse.json({ following: false }, { headers });
      }
      if (active[0].status !== "active") return NextResponse.json({ error: "That shared journey is no longer public." }, { status: 404, headers });
      if (action === "follow") {
        await serviceRest("healthclues_journey_follows?on_conflict=follower_user_id,public_journey_id", { method: "POST", headers: { Prefer: "resolution=ignore-duplicates,return=minimal" }, body: JSON.stringify({ follower_user_id: auth.id, public_journey_id: publicId, notifications_enabled: false }) });
        return NextResponse.json({ following: true }, { headers });
      }
      if (action === "report") {
        const reasons = new Set(["medical_claim", "privacy", "harassment", "spam", "other"]);
        if (typeof body.reasonCode !== "string" || !reasons.has(body.reasonCode) || (body.details !== undefined && (typeof body.details !== "string" || body.details.length > 2000))) return NextResponse.json({ error: "Choose a report reason." }, { status: 400, headers });
        await serviceRest("healthclues_community_reports", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ reporter_user_id: auth.id, public_journey_id: publicId, reason_code: body.reasonCode, details: typeof body.details === "string" ? body.details.trim() : null, status: "open" }) });
        return NextResponse.json({ reported: true }, { status: 201, headers });
      }
    }
    if (action === "start_own") {
      if (!validUuid(body.publicJourneyId)) return NextResponse.json({ error: "Choose a valid public journey." }, { status: 400, headers });
      const sources = await serviceRest<Array<{ public_topics: string[]; status: string; projection: Record<string, unknown> }>>(`healthclues_public_journeys?id=eq.${body.publicJourneyId}&status=eq.active&select=public_topics,status,projection&limit=1`);
      const source = sources[0];
      const topic = typeof body.topicKey === "string" && source?.public_topics.includes(body.topicKey) ? body.topicKey : source?.public_topics[0];
      if (!source || !topic) return NextResponse.json({ error: "That shared journey has no public topic to use." }, { status: 409, headers });
      const worlds = await serviceRest<Array<{ id: string; timezone: string }>>(`healthclues_wellness_worlds?user_id=eq.${auth.id}&select=id,timezone&limit=1`);
      const timezone = worlds[0]?.timezone || "UTC";
      const localDate = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
      const created = await userRpc<{ world_id: string; journey_id: string; reused: boolean }>("healthclues_create_world_v1", { p_user_id: auth.id, p_request_key: crypto.randomUUID(), p_topic_key: topic, p_title: "My own Wellness Journey", p_timezone: timezone, p_started_on: localDate, p_selections: [] });
      return NextResponse.json({ ...created, inspiredBy: body.publicJourneyId }, { status: created.reused ? 200 : 201, headers });
    }
    return NextResponse.json({ error: "Choose a supported Community action." }, { status: 400, headers });
  } catch (error) {
    console.error("HealthClues Community action failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "That Community action could not be saved." }, { status: 503, headers });
  }
}
