import { NextResponse } from "next/server";
import { isApiError, isHealthCluesOwnerDemo, requireUser, serviceRest, userRpc } from "@/features/healthclues/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "no-store, max-age=0, private" };

const games: Record<string, { skillKey: string; answers: string[]; feedback: string }> = {
  "evidence-detective-v1": { skillKey: "health_knowledge", answers: ["clue", "lab-only", "limits"], feedback: "Careful wording helps separate an early clue, a lab observation and evidence about people." },
  "garden-sort-v1": { skillKey: "natural_nutrition", answers: ["general-info", "source-trail", "separate-questions"], feedback: "General food information, a source and a person’s individual suitability are different things." },
  "movement-trail-v1": { skillKey: "movement", answers: ["different-paces", "personal-choice", "ask-support"], feedback: "Movement preferences vary. This demo does not prescribe an activity or assess personal suitability." },
  "rest-reflection-v1": { skillKey: "mind_sleep", answers: ["preferences-vary", "observe-not-prove", "small-reflection"], feedback: "A personal reflection can record an experience, but it does not establish cause or prove an outcome." },
};

export async function POST(request: Request) {
  const auth = await requireUser(request);
  if (isApiError(auth)) return auth.response;
  if (!isHealthCluesOwnerDemo()) return NextResponse.json({ error: "These TEST ONLY learning games are available only in the isolated owner demo." }, { status: 404, headers: noStore });
  let body: { gameId?: unknown; answers?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Finish the learning game to save its result." }, { status: 400, headers: noStore }); }
  if (typeof body.gameId !== "string" || !Object.hasOwn(games, body.gameId) || !Array.isArray(body.answers) || body.answers.length !== 3 || body.answers.some(answer => typeof answer !== "string" || !/^[a-z-]{1,40}$/.test(answer))) {
    return NextResponse.json({ error: "Choose a valid TEST ONLY learning game result." }, { status: 400, headers: noStore });
  }
  const game = games[body.gameId];
  if (!game) return NextResponse.json({ error: "This learning game is unavailable." }, { status: 404, headers: noStore });
  if (JSON.stringify(body.answers) !== JSON.stringify(game.answers)) {
    return NextResponse.json({ completed: false, correct: false, feedback: "Not quite. Review each card and try again; this activity has no penalty." }, { headers: noStore });
  }
  try {
    const worlds = await serviceRest<Array<{ id: string }>>(`healthclues_wellness_worlds?user_id=eq.${auth.id}&select=id&limit=1`);
    const world = worlds[0];
    if (!world) return NextResponse.json({ error: "Enter your saved World before playing a learning game." }, { status: 409, headers: noStore });
    const completion = await userRpc<{ completed: boolean; first_completion: boolean; reward_granted: boolean; skill_key: string }>("healthclues_complete_learning_game_v1", {
      p_user_id: auth.id, p_world_id: world.id, p_game_id: body.gameId,
    });
    return NextResponse.json({ ...completion, correct: true, feedback: game.feedback, demoOnly: true }, { headers: noStore });
  } catch (error) {
    console.error("HealthClues demo learning game failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "That TEST ONLY learning result could not be saved. Try again." }, { status: 503, headers: noStore });
  }
}
