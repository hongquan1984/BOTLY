import type { CaseClue, DetailHotspot, SceneHotspot } from "../../types";

export interface ClueInspectionResult {
  isClue: boolean;
  clue?: CaseClue;
  decorText?: string;
  isFirstDiscovery: boolean;
}

export interface SceneInspectionResult {
  opensDeepInspection: boolean;
  hotspot: SceneHotspot;
  detailHotspots: DetailHotspot[];
  legacyClue?: CaseClue;
}

export interface DetailInspectionResult {
  detail: DetailHotspot;
  clueToRecord: CaseClue;
  isAlreadyRecorded: boolean;
}

/**
 * Inspect a Scene Hotspot.
 * In V5 Deep Inspection, this opens the object close-up view without automatically recording clues.
 */
export function inspectSceneHotspot(
  hotspot: SceneHotspot,
  allClues: CaseClue[]
): SceneInspectionResult {
  const hasDetails = Boolean(hotspot.detailHotspots && hotspot.detailHotspots.length > 0);
  const legacyClue = allClues.find((c) => c.id === hotspot.clueId);

  return {
    opensDeepInspection: hasDetails || Boolean(hotspot.inspectionType),
    hotspot,
    detailHotspots: hotspot.detailHotspots || [],
    legacyClue,
  };
}

/**
 * Inspect a Detail Hotspot inside the Object Inspection view.
 * Allows the player to examine specific timestamps, statements, or physical properties.
 */
export function inspectDetailHotspot(
  detail: DetailHotspot,
  sceneHotspot: SceneHotspot,
  allClues: CaseClue[],
  currentlyRecordedClueIds: string[]
): DetailInspectionResult {
  const clueToRecord = createClueFromDetail(detail, sceneHotspot, allClues);
  const isAlreadyRecorded = currentlyRecordedClueIds.includes(clueToRecord.id);

  return {
    detail,
    clueToRecord,
    isAlreadyRecorded,
  };
}

/**
 * Helper to resolve or construct a valid CaseClue from a discovered DetailHotspot.
 */
export function createClueFromDetail(
  detail: DetailHotspot,
  sceneHotspot: SceneHotspot,
  allClues: CaseClue[]
): CaseClue {
  // If mapped to a pre-defined case clue, return that clue
  if (detail.associatedClueId) {
    const existing = allClues.find((c) => c.id === detail.associatedClueId);
    if (existing) {
      return existing;
    }
  }

  // Construct from detail
  return {
    id: `clue-${detail.id}`,
    caseId: sceneHotspot.sceneId.replace("scene-", "case-"),
    sceneId: sceneHotspot.sceneId,
    title: detail.title,
    shortDescription: detail.subtitle || detail.observation.slice(0, 80),
    detailedObservation: detail.observation,
    icon: detail.discoveredIcon || "📝",
    source: {
      type:
        detail.category === "statement"
          ? "witness"
          : detail.category === "timestamp"
          ? "record"
          : detail.category === "medical_record"
          ? "test_result"
          : "item",
      location: sceneHotspot.name,
      timestamp: detail.evidenceData?.timestamp,
      verified: true,
      medicalRef: detail.evidenceData?.medicalRef,
    },
    isKeyClue: Boolean(detail.isCrucialEvidence),
  };
}

/**
 * Legacy inspectHotspot function for backward compatibility.
 */
export function inspectHotspot(
  hotspot: SceneHotspot,
  allClues: CaseClue[],
  currentlyFoundClueIds: string[]
): ClueInspectionResult {
  if (hotspot.isDecorativeOnly) {
    return {
      isClue: false,
      decorText: hotspot.decorText || hotspot.inspectMessage,
      isFirstDiscovery: false,
    };
  }

  const clue = allClues.find((c) => c.id === hotspot.clueId);
  if (!clue) {
    return {
      isClue: false,
      decorText: hotspot.inspectMessage || "Không tìm thấy manh mối đặc biệt nào tại đây.",
      isFirstDiscovery: false,
    };
  }

  const isFirstDiscovery = !currentlyFoundClueIds.includes(clue.id);

  return {
    isClue: true,
    clue,
    isFirstDiscovery,
  };
}

export function getCluesWithTimeline(
  clues: CaseClue[]
): Array<{ clue: CaseClue; timestampStr: string }> {
  return clues
    .filter((c) => c.source.timestamp && c.source.timestamp.trim().length > 0)
    .map((c) => ({
      clue: c,
      timestampStr: c.source.timestamp!,
    }));
}
