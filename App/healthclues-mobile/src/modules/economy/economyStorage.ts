import { DeviceEventEmitter } from "react-native";
import { addMobileCoins, fetchMobileProgress, fetchWorld, spendMobileCoins } from "@/services/healthclues";

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
    return (await fetchMobileProgress()).coins;
  } catch { return 0;
  }
}

/**
 * Đọc tổng EXP hiện tại.
 */
export async function getStoredExp(): Promise<number> {
  try {
    const world = await fetchWorld();
    return Math.max(0, world.xpTotal || 0);
  } catch {
    return 0;
  }
}

/**
 * Cộng thêm Xu (từ Nhiệm Vụ Hàng Ngày hoặc Game Trinh Thám).
 */
export async function addCoins(amount: number): Promise<number> {
  if (amount <= 0) return await getStoredCoins();
  const next = await addMobileCoins(Math.round(amount));

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
  const success = await spendMobileCoins(Math.round(amount));
  if (!success) return false;
  const next = current - Math.round(amount);

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
  void amount;
  throw new Error("EXP must be awarded by a server-authoritative HealthClues event.");
}
