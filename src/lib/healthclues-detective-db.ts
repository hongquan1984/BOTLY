import { supabaseRequest } from './supabase-server';

type AssetRow = {
  case_id: string;
  role: string;
  clue_id: string | null;
  sort_order: number;
  storage_key: string;
  public_url: string;
  alt_text?: string | null;
  width?: number | null;
  height?: number | null;
  metadata?: Record<string, unknown>;
};

function asset(row: AssetRow) {
  return {
    role: row.role,
    clueId: row.clue_id ?? undefined,
    url: row.public_url,
    storageKey: row.storage_key,
    alt: row.alt_text ?? undefined,
    width: row.width ?? undefined,
    height: row.height ?? undefined,
    sortOrder: row.sort_order,
    metadata: row.metadata ?? {},
  };
}

export async function loadDetectiveCampaignFromDb() {
  const [chaptersResponse, casesResponse, assetsResponse] = await Promise.all([
    supabaseRequest('healthclues_detective_chapters?is_published=eq.true&order=chapter_number.asc'),
    supabaseRequest('healthclues_detective_case_files?publication_status=eq.published&order=chapter_order.asc'),
    supabaseRequest('healthclues_detective_case_assets?order=case_id.asc,role.asc,sort_order.asc'),
  ]);
  if (!chaptersResponse.ok || !casesResponse.ok || !assetsResponse.ok) {
    throw new Error('DETECTIVE_DB_CAMPAIGN_UNAVAILABLE');
  }
  const [chapters, rows, assets] = await Promise.all([
    chaptersResponse.json() as Promise<any[]>,
    casesResponse.json() as Promise<any[]>,
    assetsResponse.json() as Promise<AssetRow[]>,
  ]);
  const byCase = new Map<string, ReturnType<typeof asset>[]>();
  for (const row of assets) byCase.set(row.case_id, [...(byCase.get(row.case_id) ?? []), asset(row)]);
  const cases = rows.map((row) => ({
    ...row.case_payload,
    id: row.id,
    chapterId: row.chapter_id,
    chapterOrder: row.chapter_order,
    prerequisiteCaseId: row.prerequisite_case_id,
    title: row.title,
    subtitle: row.subtitle,
    topic: row.topic,
    region: row.region,
    difficulty: row.difficulty,
    assets: byCase.get(row.id) ?? [],
  }));
  return {
    chapters: chapters.map((chapter) => ({ ...chapter, caseIds: cases.filter((item) => item.chapterId === chapter.id).map((item) => item.id) })),
    cases,
    rankTitle: 'Thám tử tập sự',
  };
}

export async function loadDetectiveProgressFromDb(userId: string) {
  const response = await supabaseRequest(
    `healthclues_detective_player_progress?user_id=eq.${encodeURIComponent(userId)}&select=case_id,status,found_clues,inspected_hotspots,board_connections,stars_awarded,exp_awarded&order=updated_at.asc`,
  );
  if (!response.ok) throw new Error('DETECTIVE_DB_PROGRESS_UNAVAILABLE');
  const rows = await response.json() as Array<{
    case_id: string;
    status: 'available' | 'in_progress' | 'solved';
    found_clues?: string[] | null;
    inspected_hotspots?: string[] | null;
    stars_awarded?: number | null;
    exp_awarded?: number | null;
    board_connections?: { connections?: unknown[]; selectedConclusionIds?: string[]; wrongConclusionAttempts?: number; puzzleStates?: Record<string, string[]> } | unknown[] | null;
  }>;
  return rows.map((row) => {
    const saved = row.board_connections && !Array.isArray(row.board_connections) ? row.board_connections : {};
    return {
    caseId: row.case_id,
    status: row.status,
    foundClueIds: row.found_clues ?? [],
    inspectedHotspotIds: row.inspected_hotspots ?? [],
    starsAwarded: row.stars_awarded ?? 0,
    expAwarded: row.exp_awarded ?? 0,
    selectedConclusionIds: saved.selectedConclusionIds ?? [],
    wrongConclusionAttempts: saved.wrongConclusionAttempts ?? 0,
    puzzleStates: saved.puzzleStates ?? {},
  };
  });
}
