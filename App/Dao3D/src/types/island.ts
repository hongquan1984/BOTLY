/**
 * HealthClues My Island 3D - Types & Interfaces
 */

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface EulerRotation {
  x: number;
  y: number;
  z: number;
}

export type DecorCategory = 'building' | 'nature' | 'furniture' | 'utility' | 'companion' | 'landscape' | 'terrain';

export interface PlacedItemInstance {
  instanceId: string;
  itemId: string;
  nameVi: string;
  category: DecorCategory;
  position: Vector3D;
  elevation?: number;
  rotation: EulerRotation;
  scale: Vector3D;
  placedAt: string;
}

export interface IslandPlayerState {
  ownerUserId: string;
  islandId: string;
  templateVersion: string;
  houseLevel: number;
  houseModelId: string;
  placedItems: PlacedItemInstance[];
  updatedAt: string;
  hasClaimedLumiGift: boolean;
}

export interface DecorCatalogItem {
  id: string;
  nameVi: string;
  nameEn: string;
  category: DecorCategory;
  priceCoins: number;
  descriptionVi: string;
  modelFileName: string;
  modelScale: number;
  colliderRadius: number;
  icon: string;
  isStarterGift?: boolean;
}

export type DecorationPlacementStatus = 'valid' | 'out_of_bounds' | 'colliding_house' | 'colliding_stream' | 'colliding_mountain' | 'colliding_item';

export interface PlacementValidationResult {
  status: DecorationPlacementStatus;
  isValid: boolean;
  messageVi: string;
}
