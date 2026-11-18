import { useState, useEffect, useCallback } from "react";
import { DeviceEventEmitter } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const WORLD_STATE_EVENT = "healthclues-world-state-changed";
import {
  fetchWorld,
  submitDailyCheckin,
  WorldApiResponse,
  CheckinPayload,
  CheckinResult,
} from "../services/healthclues";

export interface MobileWellnessGoal {
  id: string;
  title: string;
  category: string;
  status: "active" | "saved_for_later" | "skipped";
  target?: string;
  unit?: string;
  daysPerWeek?: number;
  expValue?: number;
  description?: string;
  evidence?: string;
  titleEn?: string;
  categoryEn?: string;
  targetEn?: string;
  unitEn?: string;
  descriptionEn?: string;
  evidenceEn?: string;
}

export const CANONICAL_STARTER_HABITS: MobileWellnessGoal[] = [
  {
    id: "habit-water-hydration",
    title: "Duy Trì Uống Đủ Nước Hàng Ngày",
    titleEn: "Maintain Daily Hydration",
    category: "Dinh Dưỡng",
    categoryEn: "Nutrition",
    status: "active",
    target: "Từng ngụm nhỏ",
    targetEn: "Small sips",
    unit: "đều đặn",
    unitEn: "regularly",
    daysPerWeek: 7,
    expValue: 10,
    description: "Bổ sung nước đều đặn theo nhu cầu cơ thể, hỗ trợ thận bài tiết tự nhiên.",
    descriptionEn: "Drink water steadily according to your body's needs, supporting natural kidney excretion.",
    evidence: "Khuyến cáo Dinh dưỡng Lối sống Y học",
    evidenceEn: "Lifestyle Medicine Nutrition Guidelines",
  },
  {
    id: "habit-antioxidant-nutrition",
    title: "Tăng Cường Rau Quả Chống Oxy Hóa",
    titleEn: "Boost Antioxidant-Rich Greens & Fruits",
    category: "Dinh Dưỡng",
    categoryEn: "Nutrition",
    status: "active",
    target: "1 - 2",
    targetEn: "1 - 2",
    unit: "khẩu phần",
    unitEn: "servings",
    daysPerWeek: 7,
    expValue: 15,
    description: "Bổ sung thực phẩm giàu chất chống oxy hóa tự nhiên giúp hỗ trợ cân bằng chuyển hóa.",
    descriptionEn: "Add natural antioxidant-rich produce to support metabolic balance.",
    evidence: "Dinh dưỡng Dự phòng Y khoa",
    evidenceEn: "Preventive Nutrition Evidence",
  },
  {
    id: "habit-walk-15min",
    title: "Đi Bộ Nhẹ Nhàng 15 Phút Khởi Động Khớp",
    titleEn: "Gentle 15-Minute Joint Mobility Walk",
    category: "Vận Động",
    categoryEn: "Activity",
    status: "active",
    target: "15",
    targetEn: "15",
    unit: "phút",
    unitEn: "mins",
    daysPerWeek: 7,
    expValue: 10,
    description: "Kích thích bài tiết hoạt dịch bôi trơn sụn khớp và duy trì biên độ vận động linh hoạt.",
    descriptionEn: "Stimulates synovial fluid secretion to lubricate cartilage and preserve joint mobility.",
    evidence: "Khuyến nghị Vận động BMJ Clin Evid",
    evidenceEn: "BMJ Clinical Evidence Guidelines",
  },
];

export function getLocalizedGoal(goal: MobileWellnessGoal, locale: string = "vi"): MobileWellnessGoal {
  if (locale !== "en") return goal;
  return {
    ...goal,
    title: goal.titleEn || goal.title,
    category:
      goal.categoryEn ||
      (goal.category === "Dinh Dưỡng"
        ? "Nutrition"
        : goal.category === "Vận Động"
          ? "Activity"
          : goal.category === "Giấc Ngủ"
            ? "Sleep"
            : goal.category === "Tâm Lý"
              ? "Mindfulness"
              : goal.category),
    target: goal.targetEn || goal.target,
    unit:
      goal.unitEn ||
      (goal.unit === "khẩu phần"
        ? "servings"
        : goal.unit === "phút"
          ? "mins"
          : goal.unit === "đều đặn"
            ? "regularly"
            : goal.unit),
    description: goal.descriptionEn || goal.description,
    evidence: goal.evidenceEn || goal.evidence,
  };
}

export function calculateStars(done: number, total: number): number {
  if (total <= 0) return 0;
  if (done === total) return 5;
  if (done <= 0) return 0;
  return Math.min(4, Math.max(1, Math.round((done / total) * 5)));
}

export function useWorld(isAuthenticated: boolean) {
  const [data, setData] = useState<WorldApiResponse | null>(null);
  const [goals, setGoals] = useState<MobileWellnessGoal[]>(CANONICAL_STARTER_HABITS);
  const [xpTotal, setXpTotal] = useState<number>(50);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [todayCheckin, setTodayCheckin] = useState<{
    statuses: Record<string, "done" | "not_yet" | "skipped">;
    stars: number;
    note: string;
    submitted: boolean;
  }>({
    statuses: {},
    stars: 0,
    note: "",
    submitted: false,
  });

  const getTodayStr = () => {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Ho_Chi_Minh",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  };

  const loadLocalState = useCallback(async () => {
    try {
      // 1. Load Goals
      const rawGoals = await AsyncStorage.getItem("healthclues-user-goals");
      if (rawGoals) {
        const parsed = JSON.parse(rawGoals) as MobileWellnessGoal[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setGoals(parsed);
        } else {
          setGoals(CANONICAL_STARTER_HABITS);
          await AsyncStorage.setItem("healthclues-user-goals", JSON.stringify(CANONICAL_STARTER_HABITS));
        }
      } else {
        setGoals(CANONICAL_STARTER_HABITS);
        await AsyncStorage.setItem("healthclues-user-goals", JSON.stringify(CANONICAL_STARTER_HABITS));
      }

      // 2. Load XP
      const rawXp = await AsyncStorage.getItem("healthclues-total-exp");
      if (rawXp) {
        setXpTotal(Math.max(50, parseInt(rawXp, 10) || 50));
      }

      // 3. Load Today Check-in
      const today = getTodayStr();
      const rawCheckin = await AsyncStorage.getItem(`healthclues-checkin-${today}`);
      if (rawCheckin) {
        setTodayCheckin(JSON.parse(rawCheckin));
      }
    } catch (e) {
      // Fallback safe defaults
      setGoals(CANONICAL_STARTER_HABITS);
    }
  }, []);

  const loadWorld = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    await loadLocalState();

    try {
      const result = await fetchWorld();
      setData(result);
      if (result.xpTotal && result.xpTotal > 0) {
        setXpTotal(prev => Math.max(prev, result.xpTotal));
      }
      const localPlanUpdatedAt = await AsyncStorage.getItem("healthclues-local-plan-updated-at");
      const hasLocalGoals = Boolean(await AsyncStorage.getItem("healthclues-user-goals"));
      if (
        !localPlanUpdatedAt &&
        !hasLocalGoals &&
        result.wellnessPlan?.goals &&
        result.wellnessPlan.goals.length > 0
      ) {
        setGoals(result.wellnessPlan.goals as MobileWellnessGoal[]);
      }
    } catch (err: any) {
      // Offline / demo resilient fallback - do not surface scary session expired errors to the UI
      if (err.message && !err.message.includes("session is invalid")) {
        setError(err.message);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [loadLocalState]);

  useEffect(() => {
    loadWorld();
  }, [loadWorld]);

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener(WORLD_STATE_EVENT, () => {
      loadLocalState();
    });
    return () => sub.remove();
  }, [loadLocalState]);

  const addHabit = async (newHabit: Omit<MobileWellnessGoal, "id" | "status"> & { id?: string }): Promise<MobileWellnessGoal> => {
    const habitToAdd: MobileWellnessGoal = {
      id: newHabit.id || `custom-habit-${Date.now()}`,
      title: newHabit.title,
      category: newHabit.category || "Sống Khỏe",
      status: "active",
      target: newHabit.target || "1",
      unit: newHabit.unit || "lần",
      daysPerWeek: newHabit.daysPerWeek || 7,
      expValue: newHabit.expValue || 15,
      description: newHabit.description || "Thói quen cá nhân hóa cùng Lumi.",
      evidence: newHabit.evidence || "Tự tạo bởi Người Dùng",
    };

    const updatedGoals = [...goals, habitToAdd];
    setGoals(updatedGoals);
    await AsyncStorage.setItem("healthclues-user-goals", JSON.stringify(updatedGoals));

    // Award bonus +20 EXP for establishing a new healthy habit
    const nextXp = xpTotal + 20;
    setXpTotal(nextXp);
    await AsyncStorage.setItem("healthclues-total-exp", String(nextXp));
    DeviceEventEmitter.emit(WORLD_STATE_EVENT);

    return habitToAdd;
  };

  const removeHabit = async (habitId: string) => {
    const updatedGoals = goals.filter(g => g.id !== habitId);
    setGoals(updatedGoals);
    await AsyncStorage.setItem("healthclues-user-goals", JSON.stringify(updatedGoals));
    DeviceEventEmitter.emit(WORLD_STATE_EVENT);
  };

  const toggleGoalStatus = async (habitId: string, nextStatus: "active" | "saved_for_later") => {
    const updatedGoals = goals.map(g =>
      g.id === habitId ? { ...g, status: nextStatus } : g
    );
    setGoals(updatedGoals);
    await AsyncStorage.setItem("healthclues-user-goals", JSON.stringify(updatedGoals));
    DeviceEventEmitter.emit(WORLD_STATE_EVENT);
  };

  const submitHabitCheckin = async (
    statuses: Record<string, "done" | "not_yet" | "skipped">,
    note?: string
  ): Promise<{ stars: number; expAwarded: number; newTotalExp: number; alreadySubmitted: boolean }> => {
    const activeGoals = goals.filter(g => g.status === "active" || !g.status);
    let doneCount = 0;
    let earnedSum = 0;
    activeGoals.forEach(g => {
      if (statuses[g.id] === "done") {
        doneCount++;
        earnedSum += g.expValue || 10;
      }
    });

    const alreadySubmitted = !!todayCheckin.submitted;
    const stars = calculateStars(doneCount, activeGoals.length);
    const expAwarded = alreadySubmitted ? 0 : earnedSum;
    const newTotalExp = xpTotal + expAwarded;

    const checkinRecord = {
      statuses,
      stars,
      note: note || "",
      submitted: true,
      timestamp: new Date().toISOString(),
    };

    const today = getTodayStr();
    await AsyncStorage.setItem(`healthclues-checkin-${today}`, JSON.stringify(checkinRecord));
    await AsyncStorage.setItem("healthclues-total-exp", String(newTotalExp));

    setTodayCheckin(checkinRecord);
    setXpTotal(newTotalExp);
    DeviceEventEmitter.emit(WORLD_STATE_EVENT);

    return { stars, expAwarded, newTotalExp, alreadySubmitted };
  };

  const checkin = async (
    usages: CheckinPayload["usages"],
    note?: string
  ): Promise<CheckinResult> => {
    if (!data?.world?.id) {
      // Local fallback
      const expAwarded = 10;
      const newTotal = xpTotal + expAwarded;
      setXpTotal(newTotal);
      await AsyncStorage.setItem("healthclues-total-exp", String(newTotal));
      DeviceEventEmitter.emit(WORLD_STATE_EVENT);
      return {
        checkin_id: `local-checkin-${Date.now()}`,
        revision: 1,
        xp_awarded: true,
        xp_total: newTotal,
      };
    }
    const worldTimezone = data.world.timezone || "Asia/Ho_Chi_Minh";
    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: worldTimezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());

    const payload: CheckinPayload = {
      worldId: data.world.id,
      localDate: today,
      timezone: worldTimezone,
      usages,
      note,
    };

    const res = await submitDailyCheckin(payload);
    await loadWorld(true);
    DeviceEventEmitter.emit(WORLD_STATE_EVENT);
    return res;
  };

  return {
    worldData: data,
    world: data?.world ?? null,
    entries: data?.entries ?? [],
    checkins: data?.checkins ?? [],
    usage: data?.usage ?? [],
    goals,
    activeGoals: goals.filter(g => g.status === "active" || !g.status),
    savedGoals: goals.filter(g => g.status === "saved_for_later"),
    xpTotal,
    wellnessPlan: data?.wellnessPlan ?? { goals, originalNote: "Kế hoạch Sống Khỏe Khởi Đầu" },
    currencies: data?.knowledgeCurrencies ?? { fragments: 0, keys: 0 },
    loading,
    refreshing,
    error,
    todayCheckin,
    addHabit,
    removeHabit,
    toggleGoalStatus,
    submitHabitCheckin,
    refreshWorld: () => loadWorld(true),
    checkin,
  };
}
