import { useState, useEffect, useCallback } from "react";
import { DeviceEventEmitter } from "react-native";

export const WORLD_STATE_EVENT = "healthclues-world-state-changed";
import {
  fetchWorld,
  submitDailyCheckin,
  fetchMobileProgress,
  saveMobileGoals,
  saveMobileCheckin,
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

  const loadWorld = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const [result, progress] = await Promise.all([fetchWorld(), fetchMobileProgress()]);
      setData(result);
      setXpTotal(Math.max(0, result.xpTotal || 0));
      const serverGoals = progress.goals.length ? progress.goals : result.wellnessPlan?.goals;
      setGoals(serverGoals?.length ? serverGoals as MobileWellnessGoal[] : CANONICAL_STARTER_HABITS);
      setTodayCheckin(progress.todayCheckin ?? { statuses: {}, stars: 0, note: "", submitted: false });
    } catch (err: any) {
      // Offline / demo resilient fallback - do not surface scary session expired errors to the UI
      if (err.message && !err.message.includes("session is invalid")) {
        setError(err.message);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadWorld();
  }, [loadWorld]);

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener(WORLD_STATE_EVENT, () => {
      loadWorld(true);
    });
    return () => sub.remove();
  }, [loadWorld]);

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
    await saveMobileGoals(updatedGoals);
    setGoals(updatedGoals);
    DeviceEventEmitter.emit(WORLD_STATE_EVENT);

    return habitToAdd;
  };

  const removeHabit = async (habitId: string) => {
    const updatedGoals = goals.filter(g => g.id !== habitId);
    await saveMobileGoals(updatedGoals);
    setGoals(updatedGoals);
    DeviceEventEmitter.emit(WORLD_STATE_EVENT);
  };

  const toggleGoalStatus = async (habitId: string, nextStatus: "active" | "saved_for_later") => {
    const updatedGoals = goals.map(g =>
      g.id === habitId ? { ...g, status: nextStatus } : g
    );
    await saveMobileGoals(updatedGoals);
    setGoals(updatedGoals);
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
    const checkinRecord = {
      statuses,
      stars,
      note: note || "",
      submitted: true,
      timestamp: new Date().toISOString(),
    };

    const today = getTodayStr();
    const saved = await saveMobileCheckin({ localDate: today, statuses, stars, note });

    setTodayCheckin(checkinRecord);
    setXpTotal(saved.xpTotal);
    DeviceEventEmitter.emit(WORLD_STATE_EVENT);

    return { stars, expAwarded, newTotalExp: saved.xpTotal, alreadySubmitted };
  };

  const checkin = async (
    usages: CheckinPayload["usages"],
    note?: string
  ): Promise<CheckinResult> => {
    if (!data?.world?.id) {
      throw new Error("Tạo Wellness World trước khi lưu điểm danh.");
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
