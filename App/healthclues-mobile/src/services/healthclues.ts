import { apiFetch } from "./api";

export interface WellnessWorld {
  id: string;
  title: string;
  timezone: string;
  created_at: string;
}

export interface ToolkitEntry {
  id: string;
  branch_id?: string;
  journey_id?: string;
  catalog_item_id: string;
  item_version: number;
  method_id?: string | null;
  method_version?: number | null;
  personal_tool_id?: string | null;
  slot_key: "slot_1" | "slot_2" | "slot_3";
  equipment_position: number;
  discovery_station?: string;
  status: "active" | "saved" | "archived";
  schedule?: Record<string, unknown>;
  started_on: string;
  ended_on?: string | null;
}

export interface DailyCheckinRecord {
  id: string;
  local_date: string;
  timezone: string;
  revision: number;
  note_private?: string | null;
  created_at: string;
  updated_at: string;
}

export type UsageStatus = "done" | "not_yet" | "skipped" | "not_suitable" | "unsure";

export interface DailyUsageRecord {
  id: string;
  checkin_id: string;
  toolkit_entry_id: string;
  catalog_item_id: string;
  item_version: number;
  status: UsageStatus;
  occurrence_count?: number | null;
  updated_at: string;
}

export interface WorldApiResponse {
  world: WellnessWorld | null;
  branches: Array<{ id: string; topic_key: string; title: string; status: string }>;
  journeys: Array<{ id: string; branch_id: string; title: string; status: string; started_on: string }>;
  entries: ToolkitEntry[];
  collection: Array<{ id: string; catalog_item_id: string; personal_tool_id?: string | null; saved_at: string }>;
  checkins: DailyCheckinRecord[];
  usage: DailyUsageRecord[];
  xpTotal: number;
  knowledgeCurrencies: { fragments: number; keys: number };
  rewards: Array<{ id: string; reward_id: string; source_key: string; title: string; reward_type: string }>;
  milestones: Array<{ id: string; milestone_day: number; reached_on: string }>;
  unlocks: Array<{ unlock_key: string; source_type: string }>;
  wellnessPlan: {
    goals?: Array<{
      id: string;
      title: string;
      category?: string;
      status?: "active" | "saved_for_later" | "skipped";
      target?: string;
      unit?: string;
      daysPerWeek?: number;
      expValue?: number;
    }>;
    originalNote?: string;
  } | null;
}

export interface CheckinPayload {
  worldId: string;
  localDate: string; // YYYY-MM-DD
  timezone: string;
  usages: Array<{
    toolkitEntryId: string;
    status: "done" | "not_yet" | "skipped" | "not_suitable" | "unsure";
    occurrenceCount?: number | null;
  }>;
  note?: string;
  reflection?: string;
}

export interface CheckinResult {
  checkin_id: string;
  revision: number;
  xp_awarded: boolean;
  xp_total: number;
}

export interface MobileProgressResponse {
  goals: Array<Record<string, any>>;
  todayCheckin: { localDate: string; statuses: Record<string, "done" | "not_yet" | "skipped">; stars: number; note: string; submitted: true; timestamp: string } | null;
  coins: number;
}

export async function fetchWorld(): Promise<WorldApiResponse> {
  return apiFetch<WorldApiResponse>("/api/healthclues/world");
}

export async function submitDailyCheckin(
  payload: CheckinPayload
): Promise<CheckinResult> {
  return apiFetch<CheckinResult>("/api/healthclues/world/checkin", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchMobileProgress(): Promise<MobileProgressResponse> {
  return apiFetch<MobileProgressResponse>("/api/healthclues/mobile-progress");
}

export async function saveMobileGoals(goals: Array<Record<string, any>>): Promise<MobileProgressResponse> {
  return apiFetch<MobileProgressResponse>("/api/healthclues/mobile-progress", { method: "POST", body: JSON.stringify({ action: "save_goals", goals }) });
}

export async function saveMobileCheckin(payload: { localDate: string; statuses: Record<string, "done" | "not_yet" | "skipped">; stars: number; note?: string }): Promise<{ checkin: MobileProgressResponse["todayCheckin"]; xpTotal: number }> {
  return apiFetch<{ checkin: MobileProgressResponse["todayCheckin"]; xpTotal: number }>("/api/healthclues/mobile-progress", { method: "POST", body: JSON.stringify({ action: "save_checkin", ...payload }) });
}

export async function addMobileCoins(amount: number): Promise<number> {
  const result = await apiFetch<{ coins: number }>("/api/healthclues/mobile-progress", { method: "POST", body: JSON.stringify({ action: "add_coins", amount }) });
  return result.coins;
}

export async function spendMobileCoins(amount: number): Promise<boolean> {
  try {
    await apiFetch<{ coins: number }>("/api/healthclues/mobile-progress", { method: "POST", body: JSON.stringify({ action: "spend_coins", amount }) });
    return true;
  } catch { return false; }
}

export async function updateProfile(payload: {
  worldId?: string;
  nickname?: string;
  preferredLocale?: "vi" | "en";
}): Promise<{ ok: boolean; preferredLocale?: string }> {
  return apiFetch<{ ok: boolean; preferredLocale?: string }>("/api/healthclues/profile", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function createOrResetWorld(payload: {
  regionId: string;
  timezone?: string;
}): Promise<{ world: WellnessWorld }> {
  return apiFetch<{ world: WellnessWorld }>("/api/healthclues/world", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
