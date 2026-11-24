import AsyncStorage from '@react-native-async-storage/async-storage';
import { IslandPlayerState } from '../types/island';
import { createDefaultIslandState, ISLAND_TEMPLATE_VERSION, STARTER_HOUSE_CONFIG } from '../constants/islandConfig';

const ISLAND_STORAGE_PREFIX = 'healthclues_my_island_v1_';

export async function loadPlayerIslandState(userId: string): Promise<IslandPlayerState> {
  if (!userId) {
    userId = 'guest_player';
  }
  const storageKey = `${ISLAND_STORAGE_PREFIX}${userId}`;
  try {
    const raw = await AsyncStorage.getItem(storageKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.ownerUserId === userId) {
        // Keep player-owned decorations, but migrate the canonical Admin
        // template values for the starter house/camera when the template changes.
        if (parsed.templateVersion !== ISLAND_TEMPLATE_VERSION) {
          const migrated = {
            ...parsed,
            templateVersion: ISLAND_TEMPLATE_VERSION,
            houseModelId: STARTER_HOUSE_CONFIG.id,
            placedItems: Array.isArray(parsed.placedItems)
              ? parsed.placedItems.map((item: any) => {
                  if (item.itemId !== 'starter_wooden_cottage' && item.itemId !== 'bld_starter_cottage') return item;
                  return {
                    ...item,
                    itemId: STARTER_HOUSE_CONFIG.id,
                    position: { ...STARTER_HOUSE_CONFIG.position },
                    rotation: { ...STARTER_HOUSE_CONFIG.rotation },
                    scale: { ...STARTER_HOUSE_CONFIG.scale },
                  };
                })
              : [],
          };
          await savePlayerIslandState(migrated);
          return migrated;
        }
        return parsed;
      }
    }
  } catch (err) {
    console.warn(`[IslandStorage] Error reading state for ${userId}:`, err);
  }

  // If first time, return pristine default state with starter cottage and empty plateau
  const defaultState = createDefaultIslandState(userId);
  await savePlayerIslandState(defaultState);
  return defaultState;
}

export async function savePlayerIslandState(state: IslandPlayerState): Promise<boolean> {
  if (!state || !state.ownerUserId) return false;
  const storageKey = `${ISLAND_STORAGE_PREFIX}${state.ownerUserId}`;
  try {
    const payload = {
      ...state,
      updatedAt: new Date().toISOString(),
    };
    await AsyncStorage.setItem(storageKey, JSON.stringify(payload));
    return true;
  } catch (err) {
    console.error(`[IslandStorage] Failed to save island state:`, err);
    return false;
  }
}
