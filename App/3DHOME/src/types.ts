import * as THREE from 'three';

export type ViewMode =
  | 'overview'
  | 'kitchen'
  | 'bedroom'
  | 'bathroom'
  | 'view34'
  | 'garden'
  | 'lake'
  | 'character';

export type QualityPreset = 'high' | 'balanced';

export interface AABBCollider {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  maxY?: number;
  tag?: string;
  obb?: {
    cx: number;
    cz: number;
    halfW: number;
    halfD: number;
    rotY: number;
  };
}

export interface BoundingDimensions {
  width: number;
  height: number;
  depth: number;
}

export interface PlaceableDefinition {
  id: string;
  name: string;
  emoji: string;
  radius: number;
  boundingBox: BoundingDimensions;
  allowedZones: Array<'interior' | 'deck' | 'garden'>;
}

export interface PlacedItemRecord {
  uid: string;
  defId: string;
  x: number;
  y: number;
  z: number;
  rotY: number;
  scale: number;
  boundingBox: BoundingDimensions;
}

export interface SurfaceZone {
  zone: 'interior' | 'deck' | 'garden';
  mesh: THREE.Object3D;
}

export interface VillageEntityRecord {
  id: string;
  name: string;
  badge: string;
  category: 'building' | 'prop';
  x: number;
  y: number;
  z: number;
  rotY: number;
  scale: number;
}

