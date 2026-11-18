import { DeviceEventEmitter } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const COINS_STORAGE_KEY = "healthclues_coins_v1";
export const TOTAL_EXP_STORAGE_KEY = "healthclues-total-exp";
export const DETECTIVE_COINS_STORAGE_KEY = "healthclues_detective_wallet_coins_v1";
export const ECONOMY_CHANGED_EVENT = "healthclues-economy-changed";

export interface EconomyState {
  coins: number;
  exp: number;
  level: number;
}

export function calculateLevelFromExp(exp: number): number {
  return Math.max(1, Math.floor(exp / 100) + 1);
}

/**
 * Đọc số dư Xu vàng hiện tại. Tự động đồng bộ với ví Game Trinh Thám nếu có.
 */
export async function getStoredCoins(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(COINS_STORAGE_KEY);
    if (raw !== null) {
      return Math.max(0, parseInt(raw, 10) || 0);
    }
    // Kiểm tra ví thám tử có sẵn từ trước không
    const detectiveRaw = await AsyncStorage.getItem(DETECTIVE_COINS_STORAGE_KEY);
    if (detectiveRaw !== null) {
      const val = Math.max(0, parseInt(detectiveRaw, 10) || 0);
      await AsyncStorage.setItem(COINS_STORAGE_KEY, String(val));
      return val;
    }
    // Mặc định tân thủ được tặng 100 Xu khởi nghiệp
    const defaultStarter = 100;
    await AsyncStorage.setItem(COINS_STORAGE_KEY, String(defaultStarter));
    return defaultStarter;
  } catch {
    return 100;
  }
}

/**
 * Đọc tổng EXP hiện tại.
 */
export async function getStoredExp(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(TOTAL_EXP_STORAGE_KEY);
    if (raw !== null) {
      return Math.max(0, parseInt(raw, 10) || 0);
    }
    return 50;
  } catch {
    return 50;
  }
}

/**
 * Cộng thêm Xu (từ Nhiệm Vụ Hàng Ngày hoặc Game Trinh Thám).
 */
export async function addCoins(amount: number): Promise<number> {
  if (amount <= 0) return await getStoredCoins();
  const current = await getStoredCoins();
  const next = current + Math.round(amount);
  await AsyncStorage.setItem(COINS_STORAGE_KEY, String(next));
  await AsyncStorage.setItem(DETECTIVE_COINS_STORAGE_KEY, String(next));

  const exp = await getStoredExp();
  DeviceEventEmitter.emit(ECONOMY_CHANGED_EVENT, {
    coins: next,
    exp,
    level: calculateLevelFromExp(exp),
  } as EconomyState);

  return next;
}

/**
 * Chi tiêu Xu (mua sắm đồ nội thất Ngôi Nhà 3D).
 * Trả về true nếu đủ tiền và trừ thành công, false nếu không đủ tiền.
 */
export async function spendCoins(amount: number): Promise<boolean> {
  if (amount <= 0) return true;
  const current = await getStoredCoins();
  if (current < amount) return false;

  const next = current - Math.round(amount);
  await AsyncStorage.setItem(COINS_STORAGE_KEY, String(next));
  await AsyncStorage.setItem(DETECTIVE_COINS_STORAGE_KEY, String(next));

  const exp = await getStoredExp();
  DeviceEventEmitter.emit(ECONOMY_CHANGED_EVENT, {
    coins: next,
    exp,
    level: calculateLevelFromExp(exp),
  } as EconomyState);

  return true;
}

/**
 * Cộng thêm EXP (từ Onboarding, Nhiệm Vụ, hoặc Phá Án).
 */
export async function addExp(amount: number): Promise<number> {
  if (amount <= 0) return await getStoredExp();
  const current = await getStoredExp();
  const next = current + Math.round(amount);
  await AsyncStorage.setItem(TOTAL_EXP_STORAGE_KEY, String(next));

  const coins = await getStoredCoins();
  DeviceEventEmitter.emit(ECONOMY_CHANGED_EVENT, {
    coins,
    exp: next,
    level: calculateLevelFromExp(next),
  } as EconomyState);

  return next;
}
