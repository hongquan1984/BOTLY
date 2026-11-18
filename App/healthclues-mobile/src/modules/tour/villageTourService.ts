import { DeviceEventEmitter } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type VillageTourStep =
  | "welcome"                  // Step 1: On World -> Welcome & concern rec -> Tab 'journey' glows
  | "journey_track"            // Step 2A: On Journey -> Focus 'Nhật Ký 7 Ngày' streak trail
  | "journey_add"              // Step 2B: On Journey -> Focus '+ Thêm Mới' & custom habit creation
  | "journey_to_daily"         // Step 2C: On Journey -> Tab 'daily-care' glows
  | "daily_checkin"            // Step 3A: On Daily Care -> Focus 1-tap check-in seal & EXP/Xu rewards
  | "daily_to_home"            // Step 3B: On Daily Care -> Tab 'home' glows
  | "home_gift"                // Step 4A: On Home -> Golden Key Celebration modal unlocks 3D Chalet
  | "home_chalet_lore"         // Step 4B: On Home -> 3D Chalet empty furniture lore & shop
  | "world_detective_lore"     // Step 4C: On World/Home -> Doctorless village lore & 'Phá Án' button glows
  | "detective_modal"          // Step 5: Opens Detective Game (Webview /detective) -> Tour finishes with +50 Xu
  // Legacy aliases for backward compatibility
  | "journey"
  | "daily_care"
  | "home"
  | "detective"
  | null;

export const TOUR_STORAGE_KEY = "healthclues-interactive-spotlight-tour-v4";
export const TOUR_CHANGE_EVENT = "HEALTHCLUES_VILLAGE_TOUR_CHANGE";

let currentStep: VillageTourStep = null;

export async function initVillageTour(): Promise<VillageTourStep> {
  try {
    const completed = await AsyncStorage.getItem(TOUR_STORAGE_KEY);
    if (completed === "true") {
      currentStep = null;
    } else {
      currentStep = "welcome";
    }
  } catch {
    currentStep = null;
  }
  DeviceEventEmitter.emit(TOUR_CHANGE_EVENT, currentStep);
  return currentStep;
}

export function getCurrentTourStep(): VillageTourStep {
  return currentStep;
}

export function setTourStep(step: VillageTourStep) {
  // Normalize legacy aliases
  let normalized = step;
  if (step === "journey") normalized = "journey_track";
  else if (step === "daily_care") normalized = "daily_checkin";
  else if (step === "home") normalized = "home_gift";
  else if (step === "detective") normalized = "detective_modal";

  currentStep = normalized;
  DeviceEventEmitter.emit(TOUR_CHANGE_EVENT, normalized);
}

export function startVillageTour() {
  currentStep = "welcome";
  DeviceEventEmitter.emit(TOUR_CHANGE_EVENT, "welcome");
}

export async function completeVillageTour() {
  currentStep = null;
  try {
    await AsyncStorage.setItem(TOUR_STORAGE_KEY, "true");
  } catch {}
  DeviceEventEmitter.emit(TOUR_CHANGE_EVENT, null);
}

export function getHighlightedTab(step: VillageTourStep): string | null {
  switch (step) {
    case "welcome":
      return "journey";
    case "journey_to_daily":
    case "journey":
      return "daily-care";
    case "daily_to_home":
    case "daily_care":
      return "home";
    default:
      return null;
  }
}

export function getHighlightedButton(step: VillageTourStep): string | null {
  switch (step) {
    case "world_detective_lore":
    case "home":
      return "detective";
    default:
      return null;
  }
}
