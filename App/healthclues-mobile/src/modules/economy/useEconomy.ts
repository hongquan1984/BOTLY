import { useState, useEffect, useCallback } from "react";
import { DeviceEventEmitter } from "react-native";
import {
  EconomyState,
  ECONOMY_CHANGED_EVENT,
  getStoredCoins,
  getStoredExp,
  calculateLevelFromExp,
  addCoins as persistAddCoins,
  spendCoins as persistSpendCoins,
  addExp as persistAddExp,
} from "./economyStorage";

export function useEconomy() {
  const [economy, setEconomy] = useState<EconomyState>({
    coins: 100,
    exp: 50,
    level: 1,
  });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const [coins, exp] = await Promise.all([getStoredCoins(), getStoredExp()]);
    setEconomy({
      coins,
      exp,
      level: calculateLevelFromExp(exp),
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    let isMounted = true;
    refresh();

    const sub = DeviceEventEmitter.addListener(
      ECONOMY_CHANGED_EVENT,
      (next: EconomyState) => {
        if (isMounted && next) {
          setEconomy(next);
        }
      }
    );

    return () => {
      isMounted = false;
      sub.remove();
    };
  }, [refresh]);

  const addCoins = useCallback(async (amount: number) => {
    return await persistAddCoins(amount);
  }, []);

  const spendCoins = useCallback(async (amount: number) => {
    return await persistSpendCoins(amount);
  }, []);

  const addExp = useCallback(async (amount: number) => {
    return await persistAddExp(amount);
  }, []);

  return {
    coins: economy.coins,
    exp: economy.exp,
    level: economy.level,
    loading,
    refresh,
    addCoins,
    spendCoins,
    addExp,
  };
}
