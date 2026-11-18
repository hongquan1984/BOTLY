import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceEventEmitter } from 'react-native';
import { DECOR_CATALOG } from '../constants/islandConfig';
import { DecorCatalogItem } from '../types/island';

export const HEALTHCLUES_COINS_STORAGE_KEY = 'healthclues_coins_v1';
export const HEALTHCLUES_INVENTORY_ITEMS_KEY = 'healthclues_island_unlocked_items_v1';
export const HEALTHCLUES_LUMI_GIFT_CLAIMED_KEY = 'healthclues_lumi_island_gift_claimed_v1';
export const ECONOMY_CHANGED_EVENT = 'healthclues-economy-changed';

export interface IslandInventoryItem {
  itemId: string;
  count: number;
  unlockedAt: string;
}

export interface PurchaseResult {
  success: boolean;
  messageVi: string;
  remainingCoins: number;
}

/**
 * Đọc số dư Xu vàng hiện tại từ hệ thống kinh tế chung HealthClues.
 */
export async function getPlayerCoins(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(HEALTHCLUES_COINS_STORAGE_KEY);
    if (raw !== null) {
      return Math.max(0, parseInt(raw, 10) || 0);
    }
    // Mặc định tân thủ 100 xu nếu chưa có
    return 100;
  } catch {
    return 100;
  }
}

/**
 * Đọc danh sách vật phẩm trang trí 3D người chơi đang sở hữu trong Túi Đồ.
 */
export async function getOwnedDecorItems(userId: string): Promise<IslandInventoryItem[]> {
  try {
    const key = `${HEALTHCLUES_INVENTORY_ITEMS_KEY}_${userId}`;
    const raw = await AsyncStorage.getItem(key);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}

  // Mặc định ban đầu người chơi sở hữu 1 giếng nước và 1 ghế gỗ tân thủ
  const defaultItems: IslandInventoryItem[] = [
    { itemId: 'decor_ancient_well', count: 1, unlockedAt: new Date().toISOString() },
    { itemId: 'decor_wooden_bench', count: 1, unlockedAt: new Date().toISOString() },
  ];
  await saveOwnedDecorItems(userId, defaultItems);
  return defaultItems;
}

export async function saveOwnedDecorItems(userId: string, items: IslandInventoryItem[]): Promise<void> {
  const key = `${HEALTHCLUES_INVENTORY_ITEMS_KEY}_${userId}`;
  await AsyncStorage.setItem(key, JSON.stringify(items));
}

/**
 * Mua vật phẩm từ Cửa Hàng Đảo:
 * - Kiểm tra số dư Xu thật trong HealthClues.
 * - Idempotency lock chống bấm nhanh trừ xu 2 lần.
 * - Trừ xu & cộng vật phẩm vào Kho Đồ.
 */
let isPurchasingLock = false;

export async function buyDecorItem(
  userId: string,
  itemId: string
): Promise<PurchaseResult> {
  if (isPurchasingLock) {
    return { success: false, messageVi: 'Giao dịch đang được xử lý, vui lòng chờ!', remainingCoins: await getPlayerCoins() };
  }
  isPurchasingLock = true;

  try {
    const catalogItem = DECOR_CATALOG.find((d) => d.id === itemId);
    if (!catalogItem) {
      return { success: false, messageVi: 'Vật phẩm không tồn tại trong danh mục!', remainingCoins: await getPlayerCoins() };
    }

    const currentCoins = await getPlayerCoins();
    if (currentCoins < catalogItem.priceCoins) {
      return {
        success: false,
        messageVi: `Không đủ Xu Vàng! Bạn có ${currentCoins} xu, vật phẩm có giá ${catalogItem.priceCoins} xu.`,
        remainingCoins: currentCoins,
      };
    }

    // Trừ xu qua backend/AsyncStorage
    const nextCoins = currentCoins - catalogItem.priceCoins;
    await AsyncStorage.setItem(HEALTHCLUES_COINS_STORAGE_KEY, String(nextCoins));

    // Phát sự kiện toàn app HealthClues cập nhật TopHUD
    DeviceEventEmitter.emit(ECONOMY_CHANGED_EVENT, { coins: nextCoins });

    // Cập nhật Túi Đồ
    const owned = await getOwnedDecorItems(userId);
    const existing = owned.find((i) => i.itemId === itemId);
    if (existing) {
      existing.count += 1;
    } else {
      owned.push({ itemId, count: 1, unlockedAt: new Date().toISOString() });
    }
    await saveOwnedDecorItems(userId, owned);

    return {
      success: true,
      messageVi: `Mua thành công ${catalogItem.nameVi}! Đã thêm vào Túi Đồ.`,
      remainingCoins: nextCoins,
    };
  } finally {
    isPurchasingLock = false;
  }
}

/**
 * Kiểm tra trạng thái cốt truyện Lumi trao tặng đảo.
 */
export async function checkLumiGiftStatus(userId: string): Promise<boolean> {
  try {
    const key = `${HEALTHCLUES_LUMI_GIFT_CLAIMED_KEY}_${userId}`;
    const raw = await AsyncStorage.getItem(key);
    return raw === 'true';
  } catch {
    return false;
  }
}

export async function setLumiGiftClaimed(userId: string): Promise<void> {
  const key = `${HEALTHCLUES_LUMI_GIFT_CLAIMED_KEY}_${userId}`;
  await AsyncStorage.setItem(key, 'true');
}
