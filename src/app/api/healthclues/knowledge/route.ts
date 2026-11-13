import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { isApiError, isHealthCluesOwnerDemo, requireUser, serviceRest, userRpc } from "@/features/healthclues/server";
import { BOTANICAL_ARTICLES, type BotanicalArticle } from "@/data/healthclues-botanical-library";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "no-store, max-age=0, private" };

type ClueRow = {
  clue_id: string; version: number; topic_key: string; chapter_id: string; title: string; content: string; skill_key: string;
  source_references: Array<{ label: string; url: string }>;
  related_catalog_ids: string[]; question_prompt: string | null; question_options: Array<{ id: string; label: string }>;
  review_due_at: string | null;
  reviewed_by: string | null;
};

function isCurrent(row: ClueRow) { return !row.review_due_at || new Date(row.review_due_at).getTime() > Date.now(); }
function safeClue(row: ClueRow) {
  const { reviewed_by, ...content } = row;
  return { ...content, demoOnly: reviewed_by === "test-fixture" };
}

async function getMemberWorld(userId: string) {
  const worlds = await serviceRest<Array<{ id: string; timezone: string }>>(`healthclues_wellness_worlds?user_id=eq.${userId}&select=id,timezone&limit=1`);
  if (!worlds[0]) return null;
  const branches = await serviceRest<Array<{ topic_key: string }>>(`healthclues_branches?world_id=eq.${worlds[0].id}&user_id=eq.${userId}&status=eq.active&select=topic_key&order=created_at.asc&limit=1`);
  const regionKey = branches[0]?.topic_key ?? "";
  let topicKey = regionKey;
  let journeyLabel = regionKey === "sleep-better" ? "Sleep & rest" : "";
  if (regionKey === "health-concern") {
    const profiles = await serviceRest<Array<{ profile: { topic?: unknown } }>>(`healthclues_profiles?user_id=eq.${userId}&select=profile&limit=1`);
    const topic = typeof profiles[0]?.profile?.topic === "string" ? profiles[0].profile.topic : "";
    journeyLabel = topic || "General wellness";
    const normalizedTopic = topic.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    topicKey = !normalizedTopic || normalizedTopic === "other" ? "general-wellness" : normalizedTopic;
  }
  const localDate = new Intl.DateTimeFormat("en-CA", { timeZone: worlds[0].timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  return { ...worlds[0], regionKey, topicKey, journeyLabel, localDate };
}

export async function GET(request: Request) {
  const auth = await requireUser(request);
  if (isApiError(auth)) return auth.response;
  try {
    const [world, profileRows] = await Promise.all([
      getMemberWorld(auth.id),
      serviceRest<Array<{ profile: Record<string, unknown> }>>(`healthclues_profiles?user_id=eq.${auth.id}&select=profile&limit=1`),
    ]);

    const profileData = profileRows[0]?.profile || {};
    const bookmarks: string[] = Array.isArray(profileData.bookmarked_articles) ? (profileData.bookmarked_articles as string[]) : [];
    const bookmarkedArticles = BOTANICAL_ARTICLES.filter(item => bookmarks.includes(item.id));

    if (!world) {
      return NextResponse.json({
        world: null,
        featured: null,
        book: [],
        bookmarks,
        bookmarkedArticles,
        message: "Create a Wellness World to begin your Knowledge Book."
      }, { headers: noStore });
    }

    const [rows, discoveries, allDiscoveries, gameCompletions] = await Promise.all([
      serviceRest<ClueRow[]>(`healthclues_knowledge_clues?topic_key=eq.${encodeURIComponent(world.topicKey)}&published=eq.true&review_status=eq.reviewed&select=clue_id,version,topic_key,chapter_id,title,content,skill_key,source_references,related_catalog_ids,question_prompt,question_options,review_due_at,reviewed_by&order=chapter_id.asc,clue_id.asc,version.desc&limit=300`),
      serviceRest<Array<{ id: string; clue_id: string; clue_version: number; local_date: string; discovered_at: string }>>(`healthclues_knowledge_discoveries?user_id=eq.${auth.id}&world_id=eq.${world.id}&select=id,clue_id,clue_version,local_date,discovered_at&order=discovered_at.desc&limit=300`),
      serviceRest<Array<{ clue_id: string; clue_version: number }>>(`healthclues_knowledge_discoveries?user_id=eq.${auth.id}&select=clue_id,clue_version&limit=2000`),
      serviceRest<Array<{ game_id: string; skill_key: string }>>(`healthclues_learning_game_completions?user_id=eq.${auth.id}&select=game_id,skill_key&limit=100`),
    ]);
    const published = rows.filter(isCurrent).filter(row => row.reviewed_by !== "test-fixture" || isHealthCluesOwnerDemo());
    const discoveredKeys = new Set(discoveries.map(row => `${row.clue_id}:${row.clue_version}`));
    const unseen = published.filter(row => ![...discoveredKeys].some(key => key.startsWith(`${row.clue_id}:`)));
    const daySeed = createHash("sha256").update(`${auth.id}:${world.id}:${world.localDate}`).digest().readUInt32BE(0);
    const todayDiscovery = discoveries.find(row => row.local_date === world.localDate);
    const featured = todayDiscovery
      ? published.find(row => row.clue_id === todayDiscovery.clue_id && row.version === todayDiscovery.clue_version) ?? null
      : unseen.length ? unseen[daySeed % unseen.length] : null;
    const clueIds = [...new Set(discoveries.map(row => row.clue_id))];
    const bookRows = clueIds.length
      ? await serviceRest<ClueRow[]>(`healthclues_knowledge_clues?clue_id=in.(${clueIds.map(encodeURIComponent).join(",")})&published=eq.true&review_status=eq.reviewed&select=clue_id,version,topic_key,chapter_id,title,content,skill_key,source_references,related_catalog_ids,question_prompt,question_options,review_due_at,reviewed_by&limit=500`)
      : [];
    const visibleBookRows = bookRows.filter(row => row.reviewed_by !== "test-fixture" || isHealthCluesOwnerDemo());
    const titleByKey = new Map(visibleBookRows.map(row => [`${row.clue_id}:${row.version}`, safeClue(row)]));
    const relevantDiscoveries = discoveries.filter(row => titleByKey.has(`${row.clue_id}:${row.clue_version}`));
    const attempts = discoveries.length ? await serviceRest<Array<{ clue_id: string; clue_version: number; selected_option_id: string; is_correct: boolean; attempted_at: string }>>(`healthclues_knowledge_attempts?user_id=eq.${auth.id}&world_id=eq.${world.id}&select=clue_id,clue_version,selected_option_id,is_correct,attempted_at&order=attempted_at.desc&limit=300`) : [];
    const book = relevantDiscoveries.map(discovery => ({
      ...titleByKey.get(`${discovery.clue_id}:${discovery.clue_version}`),
      discoveryId: discovery.id,
      version: discovery.clue_version,
      localDate: discovery.local_date,
      discoveredAt: discovery.discovered_at,
      attempts: attempts.filter(attempt => attempt.clue_id === discovery.clue_id && attempt.clue_version === discovery.clue_version),
    }));
    const featuredKey = featured ? `${featured.clue_id}:${featured.version}` : null;
    const progressRows = allDiscoveries.length
      ? await serviceRest<Array<{ clue_id: string; version: number; skill_key: string; reviewed_by: string | null }>>(`healthclues_knowledge_clues?clue_id=in.(${[...new Set(allDiscoveries.map(row => row.clue_id))].map(encodeURIComponent).join(",")})&published=eq.true&review_status=eq.reviewed&select=clue_id,version,skill_key,reviewed_by&limit=2000`)
      : [];
    const completedKeys = new Set(allDiscoveries.map(row => `${row.clue_id}:${row.clue_version}`));
    const counts: Record<string, number> = {};
    for (const row of progressRows) {
      if (completedKeys.has(`${row.clue_id}:${row.version}`) && (row.reviewed_by !== "test-fixture" || isHealthCluesOwnerDemo())) counts[row.skill_key] = (counts[row.skill_key] ?? 0) + 1;
    }
    for (const game of gameCompletions) counts[game.skill_key] = (counts[game.skill_key] ?? 0) + 1;
    return NextResponse.json({
      world: { id: world.id, localDate: world.localDate, topicKey: world.topicKey, regionKey: world.regionKey },
      featured: featured ? safeClue(featured) : null,
      featuredDiscovered: Boolean(todayDiscovery || (featuredKey && discoveredKeys.has(featuredKey))),
      book,
      bookmarks,
      bookmarkedArticles,
      skills: { health_knowledge: counts.health_knowledge ?? 0, natural_nutrition: counts.natural_nutrition ?? 0, movement: counts.movement ?? 0, mind_sleep: counts.mind_sleep ?? 0 },
      completedGames: gameCompletions.map(game => game.game_id),
      demoGamesEnabled: isHealthCluesOwnerDemo(),
      emptyReason: featured
        ? null
        : published.length
        ? "You have explored every currently reviewed clue for this trail. Open your Knowledge Book to revisit one."
        : `No reviewed Knowledge is currently available for ${world.journeyLabel || "this topic"}. HealthClues will not substitute unrelated topics.`,
      emptyReasonVi: featured
        ? null
        : published.length
        ? "Bạn đã khám phá toàn bộ manh mối đã thẩm định cho hành trình này. Hãy mở Sổ tay kiến thức để ôn tập lại."
        : `Hiện chưa có manh mối kiến thức đã thẩm định y tế riêng cho chủ đề ${world.journeyLabel || "này"}. HealthClues không thay thế bằng các chủ đề chưa liên quan để bảo đảm tính chuẩn xác.`,
    }, { headers: noStore });
  } catch (error) {
    console.error("HealthClues Knowledge query failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Your Knowledge Book is temporarily unavailable." }, { status: 503, headers: noStore });
  }
}

export async function POST(request: Request) {
  const auth = await requireUser(request);
  if (isApiError(auth)) return auth.response;
  let body: { 
    action?: unknown; 
    clueId?: unknown; 
    version?: unknown; 
    selectedOptionId?: unknown; 
    idempotencyKey?: unknown;
    articleId?: unknown;
    bookmarked?: unknown;
  };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Choose a Knowledge action." }, { status: 400, headers: noStore }); }

  // Action: Bookmark / Unbookmark scientific botanical article
  if (body.action === "bookmark_article" || body.action === "unbookmark_article") {
    const articleId = typeof body.articleId === "string" ? body.articleId.trim() : "";
    if (!articleId) {
      return NextResponse.json({ error: "Choose an article to bookmark." }, { status: 400, headers: noStore });
    }
    try {
      const profileRows = await serviceRest<Array<{ profile: Record<string, unknown> }>>(`healthclues_profiles?user_id=eq.${auth.id}&select=profile&limit=1`);
      const currentProfile = profileRows[0]?.profile || {};
      const currentBookmarks: string[] = Array.isArray(currentProfile.bookmarked_articles) ? (currentProfile.bookmarked_articles as string[]) : [];
      
      let isBookmarked: boolean;
      if (body.action === "unbookmark_article") {
        isBookmarked = false;
      } else if (typeof body.bookmarked === "boolean") {
        isBookmarked = body.bookmarked;
      } else {
        isBookmarked = !currentBookmarks.includes(articleId);
      }

      const nextBookmarks = isBookmarked
        ? Array.from(new Set([...currentBookmarks, articleId]))
        : currentBookmarks.filter(id => id !== articleId);

      const updatedProfile = { ...currentProfile, bookmarked_articles: nextBookmarks };

      if (profileRows.length > 0) {
        await serviceRest(`healthclues_profiles?user_id=eq.${auth.id}`, {
          method: "PATCH",
          body: JSON.stringify({ profile: updatedProfile, updated_at: new Date().toISOString() })
        });
      } else {
        await serviceRest("healthclues_profiles", {
          method: "POST",
          body: JSON.stringify({
            user_id: auth.id,
            profile: updatedProfile,
            consent_version: "v1",
            consented_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
        });
      }

      return NextResponse.json({
        success: true,
        articleId,
        bookmarked: isBookmarked,
        bookmarks: nextBookmarks
      }, { headers: noStore });
    } catch (err) {
      console.error("Knowledge bookmark storage failed", err instanceof Error ? err.message : "unknown");
      return NextResponse.json({ error: "Could not update article bookmark." }, { status: 500, headers: noStore });
    }
  }

  // Clue discovery & answer actions
  if (!new Set(["discover", "answer"]).has(String(body.action)) || typeof body.clueId !== "string" || !/^[a-z0-9-]{1,120}$/.test(body.clueId) || !Number.isInteger(body.version)) {
    return NextResponse.json({ error: "Choose a valid reviewed clue." }, { status: 400, headers: noStore });
  }
  if (body.clueId.startsWith("hc-demo-") && !isHealthCluesOwnerDemo()) return NextResponse.json({ error: "TEST ONLY learning fixtures are available only in the isolated owner demo." }, { status: 404, headers: noStore });
  try {
    const world = await getMemberWorld(auth.id);
    if (!world) return NextResponse.json({ error: "Create your Wellness World before saving a clue." }, { status: 409, headers: noStore });
    if (body.action === "discover") {
      const result = await userRpc<{ discovered: boolean; already_today?: boolean; discovery_id: string; clue_id?: string; local_date: string; xp_awarded?: boolean }>("healthclues_discover_knowledge_clue_v1", {
        p_user_id: auth.id, p_world_id: world.id, p_clue_id: body.clueId, p_clue_version: body.version, p_local_date: world.localDate,
      });
      return NextResponse.json(result, { headers: noStore });
    }
    if (typeof body.selectedOptionId !== "string" || body.selectedOptionId.length > 100 || typeof body.idempotencyKey !== "string" || !/^[0-9a-f-]{36}$/i.test(body.idempotencyKey)) {
      return NextResponse.json({ error: "Choose an answer to this reviewed question." }, { status: 400, headers: noStore });
    }
    const clues = await serviceRest<ClueRow[]>(`healthclues_knowledge_clues?clue_id=eq.${encodeURIComponent(body.clueId)}&version=eq.${body.version}&published=eq.true&review_status=eq.reviewed&select=clue_id,version,question_prompt,question_options,review_due_at&limit=1`);
    const clue = clues.find(isCurrent);
    const answerKeys = await serviceRest<Array<{ correct_option_id: string }>>(`healthclues_knowledge_answer_keys?clue_id=eq.${encodeURIComponent(body.clueId)}&clue_version=eq.${body.version}&select=correct_option_id&limit=1`);
    const correctOptionId = answerKeys[0]?.correct_option_id;
    if (!clue?.question_prompt || !correctOptionId) return NextResponse.json({ error: "This reviewed question is not available." }, { status: 409, headers: noStore });
    const result = await userRpc<{ correct: boolean; attempt_id: string; reused: boolean; explanation: string }>("healthclues_answer_knowledge_clue_v1", {
      p_user_id: auth.id, p_world_id: world.id, p_clue_id: body.clueId, p_clue_version: body.version,
      p_selected_option_id: body.selectedOptionId, p_idempotency_key: body.idempotencyKey,
    });
    const correctOption = clue.question_options.find(option => option.id === correctOptionId);
    return NextResponse.json({ ...result, correctOption: correctOption?.label ?? null }, { headers: noStore });
  } catch (error) {
    console.error("HealthClues Knowledge action failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "That Knowledge action could not be saved. Refresh your World and try again." }, { status: 409, headers: noStore });
  }
}
