import AsyncStorage from "@react-native-async-storage/async-storage";

export interface StoryProgressState {
  hasSeenIntro: boolean;
  currentVideoIndex: number; // 0: Portal, 1: Lumi, 2: Realm
  completedAt?: string;
  skipped?: boolean;
}

export const STORY_STORAGE_KEY = "healthclues_story_state_v1";

export const DEFAULT_STORY_STATE: StoryProgressState = {
  hasSeenIntro: false,
  currentVideoIndex: 0,
};

export async function getStoryState(): Promise<StoryProgressState> {
  try {
    const raw = await AsyncStorage.getItem(STORY_STORAGE_KEY);
    if (!raw) return DEFAULT_STORY_STATE;
    const parsed = JSON.parse(raw);
    return {
      hasSeenIntro: !!parsed.hasSeenIntro,
      currentVideoIndex: typeof parsed.currentVideoIndex === "number" ? parsed.currentVideoIndex : 0,
      completedAt: parsed.completedAt,
      skipped: !!parsed.skipped,
    };
  } catch {
    return DEFAULT_STORY_STATE;
  }
}

export async function saveStoryProgress(
  videoIndex: number,
  completed: boolean = false,
  skipped: boolean = false
): Promise<StoryProgressState> {
  try {
    const current = await getStoryState();
    const updated: StoryProgressState = {
      ...current,
      currentVideoIndex: videoIndex,
      hasSeenIntro: completed || skipped || current.hasSeenIntro,
      skipped: skipped || current.skipped,
      completedAt: completed ? new Date().toISOString() : current.completedAt,
    };
    await AsyncStorage.setItem(STORY_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return DEFAULT_STORY_STATE;
  }
}

export async function markStoryCompleted(): Promise<void> {
  await saveStoryProgress(2, true, false);
}

export async function markStorySkipped(): Promise<void> {
  await saveStoryProgress(2, false, true);
}

export async function resetStoryState(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORY_STORAGE_KEY);
  } catch {}
}
