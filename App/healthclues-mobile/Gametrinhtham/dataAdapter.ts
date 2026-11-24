import { Platform } from "react-native";
import { getApiBaseUrl, getStoredSession, resolveServiceUrl } from "@/services/api";
import { DetectiveCampaignPayload, MobileCase, MobileClue, MobileHotspot, MobileScene } from "./types";

function campaignUrl(): string {
  if (Platform.OS === "web") {
    return `${getApiBaseUrl()}/api/healthclues/mobile-detective/campaign`;
  }
  return `${resolveServiceUrl(process.env.EXPO_PUBLIC_API_URL, 3329)}/api/healthclues/detective/campaign`;
}

function normalizeClue(input: Record<string, any>, caseId: string, sceneId: string, assets: any[]): MobileClue {
  const clueId = String(input.id ?? input.clueId ?? `${caseId}-clue-unknown`);
  const clueAssets = assets.filter((asset) => asset.clueId === clueId || asset.role === "clue-closeup");
  return {
    id: clueId,
    name: String(input.name ?? input.title ?? "Vật chứng"),
    icon: input.icon ?? input.discoveredIcon,
    description: input.description ?? input.shortDescription,
    inspectMessage: input.inspectMessage ?? input.detailedObservation ?? input.description ?? input.shortDescription,
    inspectionTitle: input.inspectionTitle ?? input.title,
    inspectionSubtitle: input.inspectionSubtitle,
    closeupImageUrl: input.closeupImageUrl ?? input.inspectionAsset ?? clueAssets[0]?.url,
    assets: input.assets ?? clueAssets,
    ...(input.caseId ? { caseId: input.caseId } : {}),
    ...(input.sceneId ? { sceneId: input.sceneId } : { sceneId }),
  } as MobileClue;
}

function normalizeScene(input: Record<string, any>, caseId: string, assets: any[]): MobileScene {
  const sceneId = String(input.id ?? input.sceneId ?? `${caseId}-scene-1`);
  return {
    id: sceneId,
    name: String(input.name ?? input.title ?? "Hiện trường"),
    description: input.description,
    backgroundUrl: input.backgroundUrl ?? assets.find((asset) => asset.role === "scene-main")?.url,
    backgroundSvg: input.backgroundSvg,
    assets: input.assets ?? assets.filter((asset) => asset.role === "scene-main"),
    hotspots: (input.hotspots ?? []).map((hotspot: Record<string, any>, index: number): MobileHotspot => ({
      id: String(hotspot.id ?? hotspot.hotspotId ?? `${sceneId}-hotspot-${index + 1}`),
      clueId: hotspot.clueId ?? hotspot.associatedClueId,
      name: String(hotspot.name ?? hotspot.title ?? "Vật chứng"),
      x: Number(hotspot.x ?? hotspot.bounds?.x ?? 50),
      y: Number(hotspot.y ?? hotspot.bounds?.y ?? 50),
      radius: hotspot.radius,
      polygon: hotspot.polygon,
    })),
  };
}

function normalizeCase(input: MobileCase): MobileCase {
  const caseAssets = input.assets ?? [];
  const rawScenes = input.scenes ?? (input as any).case_payload?.scenes ?? [];
  const rawClues = input.clues ?? (input as any).case_payload?.clues ?? [];
  const scenes = rawScenes.map((scene: any) => normalizeScene(scene, input.id, caseAssets));
  const sceneId = scenes[0]?.id ?? `${input.id}-scene-1`;
  const clues = rawClues.map((clue: any) => normalizeClue(clue, input.id, clue.sceneId ?? sceneId, caseAssets));
  const rawHypotheses = input.hypotheses?.length ? input.hypotheses : (input as any).conclusionConfig?.candidates ?? [];
  const hypotheses = rawHypotheses.map((hypothesis: any, index: number) => ({
    ...hypothesis,
    id: String(hypothesis.id ?? hypothesis.hypothesisId ?? `hypothesis-${index + 1}`),
    title: hypothesis.title ?? hypothesis.label ?? hypothesis.statement ?? hypothesis.text,
    text: hypothesis.text ?? hypothesis.label ?? hypothesis.statement,
  }));
  return { ...input, scenes, clues, hypotheses, assets: caseAssets };
}

export async function loadDetectiveCampaign(token?: string): Promise<DetectiveCampaignPayload> {
  const session = token ? null : await getStoredSession();
  const accessToken = token ?? session?.access_token;
  const response = await fetch(campaignUrl(), {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Không tải được dữ liệu điều tra (${response.status}).`);
  const payload = (await response.json()) as DetectiveCampaignPayload;
  return { ...payload, cases: (payload.cases ?? []).map(normalizeCase) };
}

export async function submitDetectiveSolution(params: {
  caseId: string;
  stars: number;
  foundClues: string[];
  connections?: unknown[];
  selectedConclusionIds?: string[];
  wrongConclusionAttempts?: number;
  puzzleStates?: Record<string, unknown>;
  token?: string;
}): Promise<{ success: boolean; expAwarded?: number; coinsAwarded?: number; unlockedNextCaseId?: string | null }> {
  const session = params.token ? null : await getStoredSession();
  const accessToken = params.token ?? session?.access_token;
  const response = await fetch(campaignUrl().replace("/campaign", "/solve"), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
    body: JSON.stringify({ caseId: params.caseId, stars: params.stars, foundClues: params.foundClues, connections: params.connections ?? [], selectedConclusionIds: params.selectedConclusionIds ?? [], wrongConclusionAttempts: params.wrongConclusionAttempts ?? 0, puzzleStates: params.puzzleStates ?? {} }),
  });
  if (!response.ok) throw new Error(`Không lưu được kết quả điều tra (${response.status}).`);
  return (await response.json()) as { success: boolean; expAwarded?: number; coinsAwarded?: number; unlockedNextCaseId?: string | null };
}
