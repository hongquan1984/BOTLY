import { NextResponse } from "next/server";
import { isApiError, isHealthCluesOwnerDemo, requireUser, serviceRest, userRpc, validTimeZone, validUuid } from "@/features/healthclues/server";
import type { ToolkitSlot } from "@/features/healthclues/toolkit-domain";
import { isPlayableHealthCluesRegion } from "@/features/healthclues/region-availability";
import { wellnessContextKey } from "@/features/healthclues/server/wellness-context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Selection = { catalogItemId: string; itemVersion: number; methodId?: string | null; methodVersion?: number | null; slot: ToolkitSlot; schedule?: Record<string, unknown> };
const noStore = { "Cache-Control": "no-store, max-age=0" };

export async function GET(request: Request) {
  const auth = await requireUser(request);
  if (isApiError(auth)) return auth.response;
  try {
    const worlds = await serviceRest<Array<{ id: string; title: string; timezone: string; created_at: string }>>(`healthclues_wellness_worlds?user_id=eq.${auth.id}&select=id,title,timezone,created_at&limit=1`).catch(() => []);
    if (!worlds[0]) {
      const collection = await serviceRest<unknown[]>(`healthclues_toolkit_collection?user_id=eq.${auth.id}&select=id,catalog_item_id,personal_tool_id,saved_at&order=saved_at.desc&limit=200`).catch(() => []);
      return NextResponse.json({ world: null, branches: [], journeys: [], entries: [], collection, entryEvents: [], checkins: [], usage: [], xpTotal: 0, knowledgeCurrencies: { fragments: 0, keys: 0 }, rewards: [], milestones: [], unlocks: [], wellnessPlan: null }, { headers: noStore });
    }
    const world = worlds[0];
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: world.timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
    await userRpc<number>("healthclues_award_elapsed_milestones_v1", { p_user_id: auth.id, p_local_date: today }).catch(() => 0);
    const [branches, journeys, entries, collection, entryEvents, checkins, xp, currencies, rewards, milestones, unlocks, profileRows] = await Promise.all([
      serviceRest<unknown[]>(`healthclues_branches?world_id=eq.${world.id}&user_id=eq.${auth.id}&select=id,topic_key,title,status,created_at&order=created_at.asc`),
      serviceRest<unknown[]>(`healthclues_journeys?user_id=eq.${auth.id}&select=id,branch_id,title,status,started_on,created_at,updated_at&order=started_on.desc&limit=100`),
      serviceRest<unknown[]>(`healthclues_toolkit_entries?world_id=eq.${world.id}&user_id=eq.${auth.id}&select=id,branch_id,journey_id,catalog_item_id,item_version,method_id,method_version,personal_tool_id,slot_key,equipment_position,discovery_station,status,schedule,started_on,ended_on&order=started_on.desc&limit=200`),
      serviceRest<unknown[]>(`healthclues_toolkit_collection?user_id=eq.${auth.id}&select=id,catalog_item_id,personal_tool_id,saved_at&order=saved_at.desc&limit=200`),
      serviceRest<unknown[]>(`healthclues_toolkit_entry_events?user_id=eq.${auth.id}&select=id,toolkit_entry_id,event_type,previous_status,next_status,replacement_entry_id,effective_date,created_at&order=created_at.desc&limit=500`),
      serviceRest<unknown[]>(`healthclues_daily_checkins?world_id=eq.${world.id}&user_id=eq.${auth.id}&select=id,local_date,timezone,revision,note_private,created_at,updated_at&order=local_date.desc&limit=90`),
      serviceRest<Array<{ amount: number }>>(`healthclues_xp_ledger?user_id=eq.${auth.id}&select=amount&limit=10000`),
      serviceRest<Array<{ currency_type: "fragment" | "key"; amount: number }>>(`healthclues_knowledge_currency_ledger?user_id=eq.${auth.id}&world_id=eq.${world.id}&select=currency_type,amount&limit=10000`),
      serviceRest<Array<{ id: string; reward_id: string; source_key: string; awarded_at: string }>>(`healthclues_user_rewards?user_id=eq.${auth.id}&select=id,reward_id,source_key,awarded_at&order=awarded_at.desc&limit=100`),
      serviceRest<unknown[]>(`healthclues_user_milestones?user_id=eq.${auth.id}&select=id,journey_id,milestone_day,reached_on,awarded_at&order=reached_on.desc&limit=100`),
      serviceRest<unknown[]>(`healthclues_world_unlocks?user_id=eq.${auth.id}&world_id=eq.${world.id}&select=unlock_key,source_type,source_id,unlocked_at&order=unlocked_at.asc&limit=200`),
      serviceRest<Array<{ profile: Record<string, unknown> }>>(`healthclues_profiles?user_id=eq.${auth.id}&select=profile&limit=1`),
    ]);
    const checkinIds = checkins.map(row => (row as { id: string }).id);
    const usage = checkinIds.length
      ? await serviceRest<unknown[]>(`healthclues_daily_usage_records?user_id=eq.${auth.id}&checkin_id=in.(${checkinIds.join(",")})&select=id,checkin_id,toolkit_entry_id,catalog_item_id,item_version,method_id,method_version,status,occurrence_count,updated_at`)
      : [];
    const rewardIds = [...new Set(rewards.map(row => row.reward_id).filter(Boolean))];
    const rewardDefinitions = rewardIds.length
      ? await serviceRest<Array<{ id: string; version: number; reward_type: string; title: string }>>(`healthclues_reward_definitions?id=in.(${rewardIds.map(encodeURIComponent).join(",")})&select=id,version,reward_type,title`)
      : [];
    const rewardDetails = rewards.map(reward => {
      const rewardId = reward.reward_id;
      const definition = rewardDefinitions.find(item => item.id === rewardId);
      return { ...reward, reward_type: definition?.reward_type ?? "badge", title: definition?.title ?? rewardId.replaceAll("-", " "), version: definition?.version ?? 1 };
    });
    const knowledgeCurrencies = currencies.reduce((total, row) => {
      if (row.currency_type === "fragment") total.fragments += row.amount;
      if (row.currency_type === "key") total.keys += row.amount;
      return total;
    }, { fragments: 0, keys: 0 });
    const currentProfile = profileRows[0]?.profile;
    const storedPlans = currentProfile?.wellnessPlans;
    const currentContextKey = wellnessContextKey(currentProfile);
    const eligiblePlans = Array.isArray(storedPlans) ? storedPlans.filter(plan => {
      if (!plan || typeof plan !== "object") return false;
      const candidate = plan as { worldId?: unknown; version?: unknown; goals?: unknown; contextKey?: unknown };
      return candidate.worldId === world.id && Number.isInteger(candidate.version) && Array.isArray(candidate.goals) && (typeof candidate.contextKey !== "string" || candidate.contextKey === currentContextKey);
    }) as Array<{ worldId: string; version: number; goals: unknown[]; confirmedAt: string }> : [];
    const wellnessPlan = eligiblePlans.sort((a, b) => b.version - a.version)[0] ?? null;
    const mobileJourneyGoals = Array.isArray(currentProfile?.mobileJourneyGoals) ? currentProfile.mobileJourneyGoals : null;
    return NextResponse.json({ world, branches, journeys, entries, collection, entryEvents, checkins, usage, xpTotal: xp.reduce((sum, row) => sum + row.amount, 0), knowledgeCurrencies, rewards: rewardDetails, milestones, unlocks, wellnessPlan: wellnessPlan && mobileJourneyGoals ? { ...wellnessPlan, goals: mobileJourneyGoals } : wellnessPlan }, { headers: noStore });
  } catch {
    return NextResponse.json({ error: "Your Wellness World could not be loaded. Please try again." }, { status: 503, headers: noStore });
  }
}

export async function POST(request: Request) {
  const auth = await requireUser(request);
  if (isApiError(auth)) return auth.response;
  let body: { requestKey?: string; topicKey?: string; title?: string; timezone?: string; startedOn?: string; selections?: Selection[] };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Choose your starting Quest and tools." }, { status: 400, headers: noStore }); }
  if (typeof body.topicKey !== "string" || !isPlayableHealthCluesRegion(body.topicKey)) {
    return NextResponse.json({ error: "That region is not available for new journeys yet." }, { status: 403, headers: noStore });
  }
  if (!validUuid(body.requestKey) || typeof body.topicKey !== "string" || !/^[a-z0-9-]{1,60}$/.test(body.topicKey) || typeof body.title !== "string" || body.title.trim().length < 1 || body.title.length > 100 || !validTimeZone(body.timezone) || !Array.isArray(body.selections) || body.selections.length > 3) {
    return NextResponse.json({ error: "Your World choices are incomplete or invalid." }, { status: 400, headers: noStore });
  }
  const selections = body.selections.map(row => ({
    catalog_item_id: row.catalogItemId,
    item_version: row.itemVersion,
    method_id: row.methodId ?? null,
    method_version: row.methodVersion ?? null,
    slot_key: row.slot,
    schedule: row.schedule ?? {},
  }));
  if (selections.some(row => typeof row.catalog_item_id !== "string" || row.catalog_item_id.length > 120 || !Number.isInteger(row.item_version) || !["consume", "reduce", "practice"].includes(row.slot_key) || (row.method_version !== null && !Number.isInteger(row.method_version)))) {
    return NextResponse.json({ error: "One of your equipment choices needs to be reviewed." }, { status: 400, headers: noStore });
  }
  if (selections.length) {
    const ids = [...new Set(selections.map(row => row.catalog_item_id))];
    const versions = await serviceRest<Array<{ catalog_item_id: string; version: number; reviewed_by: string | null; source_provenance: unknown }>>(`healthclues_catalog_item_versions?catalog_item_id=in.(${ids.map(encodeURIComponent).join(",")})&select=catalog_item_id,version,reviewed_by,source_provenance&limit=30`);
    const demoSelection = selections.some(selection => {
      const version = versions.find(row => row.catalog_item_id === selection.catalog_item_id && row.version === selection.item_version);
      const provenance = version?.source_provenance && typeof version.source_provenance === "object" && !Array.isArray(version.source_provenance) ? version.source_provenance as Record<string, unknown> : {};
      return selection.catalog_item_id.startsWith("hc-demo-") || version?.reviewed_by === "test-fixture" || provenance.demo_only === true;
    });
    if (demoSelection && !isHealthCluesOwnerDemo()) return NextResponse.json({ error: "TEST ONLY tools cannot start a production World." }, { status: 404, headers: noStore });
  }
  const date = body.startedOn && /^\d{4}-\d{2}-\d{2}$/.test(body.startedOn) ? body.startedOn : new Intl.DateTimeFormat("en-CA", { timeZone: body.timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  try {
    const result = await userRpc<{ world_id: string; branch_id: string; journey_id: string; entries_created?: number; reused: boolean }>("healthclues_create_world_v1", {
      p_user_id: auth.id, p_request_key: body.requestKey, p_topic_key: body.topicKey, p_title: body.title.trim(), p_timezone: body.timezone, p_started_on: date, p_selections: selections,
    });
    return NextResponse.json({ ...result }, { status: result.reused ? 200 : 201, headers: noStore });
  } catch {
    return NextResponse.json({ error: "One of the tools changed or is no longer eligible. Review the catalog and try again." }, { status: 409, headers: noStore });
  }
}
