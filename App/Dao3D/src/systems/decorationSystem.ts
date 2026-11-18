import { PlacedItemInstance, IslandPlayerState, DecorCatalogItem } from '../types/island';
import { DECOR_CATALOG, ISLAND_BOUNDS } from '../constants/islandConfig';

export class DecorationSystem {
  private playerState: IslandPlayerState;
  private onStateChange?: (state: IslandPlayerState) => void;

  constructor(initialState: IslandPlayerState, onStateChange?: (state: IslandPlayerState) => void) {
    this.playerState = { ...initialState };
    this.onStateChange = onStateChange;
  }

  public getState(): IslandPlayerState {
    return { ...this.playerState };
  }

  public setState(nextState: IslandPlayerState): void {
    this.playerState = { ...nextState };
    if (this.onStateChange) {
      this.onStateChange(this.playerState);
    }
  }

  /**
   * Đặt một vật phẩm từ kho đồ lên đảo.
   * Sinh một instanceId độc lập cho từng lần đặt (kể cả khi người chơi sở hữu 2 vật phẩm giống nhau).
   */
  public placeItem(
    itemId: string,
    position: { x: number; z: number },
    rotationY: number = 0,
    customScale: number = 1.0
  ): PlacedItemInstance | null {
    const catalogDef = DECOR_CATALOG.find((d) => d.id === itemId);
    if (!catalogDef) {
      console.error(`Decoration item ${itemId} not found in catalog`);
      return null;
    }

    const instanceId = `inst_${itemId}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const scale = catalogDef.modelScale * customScale;

    const newInstance: PlacedItemInstance = {
      instanceId,
      itemId,
      nameVi: catalogDef.nameVi,
      category: catalogDef.category,
      position: { x: position.x, y: ISLAND_BOUNDS.centerGroundY, z: position.z },
      rotation: { x: 0, y: rotationY, z: 0 },
      scale: { x: scale, y: scale, z: scale },
      placedAt: new Date().toISOString(),
    };

    const nextPlacedItems = [...this.playerState.placedItems, newInstance];
    this.playerState = {
      ...this.playerState,
      placedItems: nextPlacedItems,
      updatedAt: new Date().toISOString(),
    };

    if (this.onStateChange) {
      this.onStateChange(this.playerState);
    }

    return newInstance;
  }

  /**
   * Di chuyển hoặc xoay một vật phẩm đã đặt trên đảo.
   */
  public updateItemTransform(
    instanceId: string,
    position?: { x: number; z: number },
    rotationY?: number
  ): boolean {
    const idx = this.playerState.placedItems.findIndex((p) => p.instanceId === instanceId);
    if (idx === -1) return false;

    const current = this.playerState.placedItems[idx];
    const updated: PlacedItemInstance = {
      ...current,
      position: position
        ? { x: position.x, y: ISLAND_BOUNDS.centerGroundY, z: position.z }
        : current.position,
      rotation: rotationY !== undefined
        ? { x: 0, y: rotationY, z: 0 }
        : current.rotation,
    };

    const nextPlacedItems = [...this.playerState.placedItems];
    nextPlacedItems[idx] = updated;

    this.playerState = {
      ...this.playerState,
      placedItems: nextPlacedItems,
      updatedAt: new Date().toISOString(),
    };

    if (this.onStateChange) {
      this.onStateChange(this.playerState);
    }

    return true;
  }

  /**
   * Cất vật phẩm vào kho:
   * CHỈ xóa instance trang trí khỏi đảo, TUYỆT ĐỐI KHÔNG xóa quyền sở hữu khỏi Inventory!
   */
  public stashItem(instanceId: string): PlacedItemInstance | null {
    const target = this.playerState.placedItems.find((p) => p.instanceId === instanceId);
    if (!target) return null;

    const nextPlaced = this.playerState.placedItems.filter((p) => p.instanceId !== instanceId);
    this.playerState = {
      ...this.playerState,
      placedItems: nextPlaced,
      updatedAt: new Date().toISOString(),
    };

    if (this.onStateChange) {
      this.onStateChange(this.playerState);
    }

    return target;
  }

  /**
   * Xóa toàn bộ trang trí (Clear layout), chỉ giữ lại nhà khởi đầu.
   */
  public clearAllDecorations(): void {
    this.playerState = {
      ...this.playerState,
      placedItems: [],
      updatedAt: new Date().toISOString(),
    };
    if (this.onStateChange) {
      this.onStateChange(this.playerState);
    }
  }
}
