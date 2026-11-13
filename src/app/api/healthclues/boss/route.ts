import { NextResponse } from "next/server";
import { isApiError, isHealthCluesOwnerDemo, requireUser, serviceRest, userRpc, validUuid } from "@/features/healthclues/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "no-store, max-age=0, private" };
type Boss = { boss_id: string; version: number; topic_key: string; title: string; intro: string; question_prompt: string; question_options: Array<{ id: string; label: string }>; review_due_at: string | null; reviewed_by: string | null };
const current = (boss: Boss) => !boss.review_due_at || new Date(boss.review_due_at).getTime() > Date.now();

async function memberWorld(userId: string) {
  const worlds = await serviceRest<Array<{ id: string }>>(`healthclues_wellness_worlds?user_id=eq.${userId}&select=id&limit=1`);
  if (!worlds[0]) return null;
  const branches = await serviceRest<Array<{ topic_key: string }>>(`healthclues_branches?world_id=eq.${worlds[0].id}&user_id=eq.${userId}&status=eq.active&select=topic_key&order=created_at.asc&limit=1`);
  return { id: worlds[0].id, topicKey: branches[0]?.topic_key ?? "" };
}

export async function GET(request: Request) {
  const auth = await requireUser(request);
  if (isApiError(auth)) return auth.response;
  try {
    const world = await memberWorld(auth.id);
    if (!world) return NextResponse.json({ world: null, boss: null, cleared: false }, { headers });
    const bosses = world.topicKey ? await serviceRest<Boss[]>(`healthclues_boss_challenges?topic_key=eq.${encodeURIComponent(world.topicKey)}&published=eq.true&review_status=eq.reviewed&select=boss_id,version,topic_key,title,intro,question_prompt,question_options,review_due_at,reviewed_by&order=boss_id.asc,version.desc&limit=100`) : [];
    const boss = bosses.filter(current).find(row => row.reviewed_by !== "test-fixture" || isHealthCluesOwnerDemo()) ?? null;
    if (!boss) return NextResponse.json({ world, boss: null, cleared: false, emptyReason: "No source-reviewed Boss challenge is available for this trail yet." }, { headers });
    const clears = await serviceRest<unknown[]>(`healthclues_boss_clears?user_id=eq.${auth.id}&world_id=eq.${world.id}&boss_id=eq.${encodeURIComponent(boss.boss_id)}&boss_version=eq.${boss.version}&select=cleared_at&limit=1`);
    const { reviewed_by, ...publicBoss } = boss;
    return NextResponse.json({ world, boss: { ...publicBoss, demoOnly: reviewed_by === "test-fixture" }, cleared: clears.length > 0, emptyReason: null }, { headers });
  } catch (error) {
    console.error("HealthClues Boss read failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "The Boss checkpoint is temporarily unavailable." }, { status: 503, headers });
  }
}

export async function POST(request: Request) {
  const auth = await requireUser(request);
  if (isApiError(auth)) return auth.response;
  let body: { bossId?: unknown; version?: unknown; selectedOptionId?: unknown; idempotencyKey?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Choose an answer to the reviewed challenge." }, { status: 400, headers }); }
  if (typeof body.bossId !== "string" || !/^[a-z0-9-]{1,100}$/.test(body.bossId) || !Number.isInteger(body.version) || typeof body.selectedOptionId !== "string" || body.selectedOptionId.length > 100 || !validUuid(body.idempotencyKey)) return NextResponse.json({ error: "Choose a valid reviewed Boss answer." }, { status: 400, headers });
  if (body.bossId.startsWith("hc-demo-") && !isHealthCluesOwnerDemo()) return NextResponse.json({ error: "TEST ONLY challenges are available only in the isolated owner demo." }, { status: 404, headers });
  try {
    const world = await memberWorld(auth.id);
    if (!world) return NextResponse.json({ error: "Create a Wellness World before entering a Boss checkpoint." }, { status: 409, headers });
    const result = await userRpc<{ correct: boolean; reused: boolean; cleared?: boolean; reward_granted?: boolean; unlock_key?: string; cosmetic_reward_id?: string | null; cosmetic_unlock_key?: string | null; explanation?: string }>("healthclues_answer_boss_challenge_v1", { p_user_id: auth.id, p_world_id: world.id, p_boss_id: body.bossId, p_boss_version: body.version, p_selected_option_id: body.selectedOptionId, p_idempotency_key: body.idempotencyKey });
    const answer = await serviceRest<Array<{ correct_option_id: string }>>(`healthclues_boss_answer_keys?boss_id=eq.${encodeURIComponent(body.bossId)}&boss_version=eq.${body.version}&select=correct_option_id&limit=1`);
    const challenge = await serviceRest<Array<{ question_options: Boss["question_options"] }>>(`healthclues_boss_challenges?boss_id=eq.${encodeURIComponent(body.bossId)}&version=eq.${body.version}&select=question_options&limit=1`);
    const correctLabel = challenge[0]?.question_options.find(option => option.id === answer[0]?.correct_option_id)?.label ?? null;
    const cosmetics = result.cosmetic_reward_id ? await serviceRest<Array<{ title: string }>>(`healthclues_reward_definitions?id=eq.${encodeURIComponent(result.cosmetic_reward_id)}&select=title&limit=1`) : [];
    return NextResponse.json({ ...result, correctLabel, cosmeticRewardTitle: cosmetics[0]?.title ?? null }, { headers });
  } catch (error) {
    console.error("HealthClues Boss answer failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "That challenge could not be saved. Refresh your World and try again." }, { status: 409, headers });
  }
}
