import { NextResponse } from 'next/server';
import { isApiError, requireUser, userRpc, validUuid } from '@/features/healthclues/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const noStore = { 'Cache-Control': 'no-store, max-age=0, private' };

export async function POST(request: Request) {
  const auth = await requireUser(request);
  if (isApiError(auth)) return auth.response;
  let body: { caseId?: unknown; stars?: unknown; foundClues?: unknown; connections?: unknown; selectedConclusionIds?: unknown; wrongConclusionAttempts?: unknown; puzzleStates?: unknown; worldId?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid investigation result.' }, { status: 400, headers: noStore }); }

  const caseId = typeof body.caseId === 'string' && /^[A-Za-z0-9._:-]{1,120}$/.test(body.caseId) ? body.caseId : null;
  const stars = typeof body.stars === 'number' && Number.isInteger(body.stars) && body.stars >= 0 && body.stars <= 3 ? body.stars : null;
  const foundClues = Array.isArray(body.foundClues) && body.foundClues.length <= 100 && body.foundClues.every((item) => typeof item === 'string' && item.length <= 160) ? body.foundClues : null;
  const connections = Array.isArray(body.connections) && body.connections.length <= 100 ? body.connections : null;
  const selectedConclusionIds = Array.isArray(body.selectedConclusionIds) && body.selectedConclusionIds.length <= 20 && body.selectedConclusionIds.every((item) => typeof item === 'string' && /^[A-Za-z0-9._:-]{1,160}$/.test(item)) ? body.selectedConclusionIds : null;
  const wrongConclusionAttempts = Number.isInteger(body.wrongConclusionAttempts) && Number(body.wrongConclusionAttempts) >= 0 && Number(body.wrongConclusionAttempts) <= 100 ? Number(body.wrongConclusionAttempts) : null;
  const puzzleStates = body.puzzleStates && typeof body.puzzleStates === 'object' && !Array.isArray(body.puzzleStates) && Object.keys(body.puzzleStates).length <= 100 ? body.puzzleStates : null;
  const worldId = body.worldId === undefined || body.worldId === null ? null : (validUuid(body.worldId) ? body.worldId : undefined);
  if (!caseId || stars === null || !foundClues || !connections || !selectedConclusionIds || wrongConclusionAttempts === null || !puzzleStates || worldId === undefined) return NextResponse.json({ error: 'Investigation result is incomplete.' }, { status: 400, headers: noStore });

  try {
    const result = await userRpc<Record<string, unknown>>('healthclues_solve_detective_case_v1', {
      p_user_id: auth.id, p_world_id: worldId, p_case_id: caseId, p_stars: stars,
      p_found_clues: foundClues, p_connections: connections,
      p_selected_conclusion_ids: selectedConclusionIds,
      p_wrong_conclusion_attempts: wrongConclusionAttempts,
      p_puzzle_states: puzzleStates,
    });
    return NextResponse.json({ success: Boolean(result.success), caseId: result.case_id ?? caseId, stars: result.stars ?? stars, expAwarded: result.exp_awarded ?? 0, unlockedNextCaseId: result.unlocked_next_case_id ?? null }, { headers: noStore });
  } catch {
    return NextResponse.json({ error: 'Investigation result could not be saved. Please try again.' }, { status: 409, headers: noStore });
  }
}
