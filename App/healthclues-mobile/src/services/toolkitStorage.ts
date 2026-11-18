import AsyncStorage from "@react-native-async-storage/async-storage";
import { DeviceEventEmitter } from "react-native";

export const STORAGE_KEY_HERBS = "hc_mobile_botanical_bookmarks";
export const STORAGE_KEY_SOUNDS = "hc_mobile_toolkit_sounds";
export const STORAGE_KEY_BREATHS = "hc_mobile_toolkit_breaths";
export const TOOLKIT_CHANGE_EVENT = "HEALTHCLUES_TOOLKIT_CHANGED";

export const toolkitStorage = {
  // Sounds
  async getSavedSoundIds(): Promise<string[]> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY_SOUNDS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },
  async isSoundSaved(id: string): Promise<boolean> {
    const ids = await this.getSavedSoundIds();
    return ids.includes(id);
  },
  async saveSound(id: string): Promise<string[]> {
    const ids = await this.getSavedSoundIds();
    if (!ids.includes(id)) {
      const updated = [...ids, id];
      await AsyncStorage.setItem(STORAGE_KEY_SOUNDS, JSON.stringify(updated));
      DeviceEventEmitter.emit(TOOLKIT_CHANGE_EVENT, { type: "sounds", ids: updated });
      return updated;
    }
    return ids;
  },
  async removeSound(id: string): Promise<string[]> {
    const ids = await this.getSavedSoundIds();
    const updated = ids.filter((item) => item !== id);
    await AsyncStorage.setItem(STORAGE_KEY_SOUNDS, JSON.stringify(updated));
    DeviceEventEmitter.emit(TOOLKIT_CHANGE_EVENT, { type: "sounds", ids: updated });
    return updated;
  },
  async toggleSound(id: string): Promise<{ saved: boolean; ids: string[] }> {
    const ids = await this.getSavedSoundIds();
    if (ids.includes(id)) {
      const updated = await this.removeSound(id);
      return { saved: false, ids: updated };
    } else {
      const updated = await this.saveSound(id);
      return { saved: true, ids: updated };
    }
  },

  // Breaths
  async getSavedBreathIds(): Promise<string[]> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY_BREATHS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },
  async isBreathSaved(id: string): Promise<boolean> {
    const ids = await this.getSavedBreathIds();
    return ids.includes(id);
  },
  async saveBreath(id: string): Promise<string[]> {
    const ids = await this.getSavedBreathIds();
    if (!ids.includes(id)) {
      const updated = [...ids, id];
      await AsyncStorage.setItem(STORAGE_KEY_BREATHS, JSON.stringify(updated));
      DeviceEventEmitter.emit(TOOLKIT_CHANGE_EVENT, { type: "breaths", ids: updated });
      return updated;
    }
    return ids;
  },
  async removeBreath(id: string): Promise<string[]> {
    const ids = await this.getSavedBreathIds();
    const updated = ids.filter((item) => item !== id);
    await AsyncStorage.setItem(STORAGE_KEY_BREATHS, JSON.stringify(updated));
    DeviceEventEmitter.emit(TOOLKIT_CHANGE_EVENT, { type: "breaths", ids: updated });
    return updated;
  },
  async toggleBreath(id: string): Promise<{ saved: boolean; ids: string[] }> {
    const ids = await this.getSavedBreathIds();
    if (ids.includes(id)) {
      const updated = await this.removeBreath(id);
      return { saved: false, ids: updated };
    } else {
      const updated = await this.saveBreath(id);
      return { saved: true, ids: updated };
    }
  },

  // Herbs
  async getSavedHerbIds(): Promise<string[]> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY_HERBS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },
  async isHerbSaved(id: string): Promise<boolean> {
    const ids = await this.getSavedHerbIds();
    return ids.includes(id);
  },
  async saveHerb(id: string): Promise<string[]> {
    const ids = await this.getSavedHerbIds();
    if (!ids.includes(id)) {
      const updated = [...ids, id];
      await AsyncStorage.setItem(STORAGE_KEY_HERBS, JSON.stringify(updated));
      DeviceEventEmitter.emit(TOOLKIT_CHANGE_EVENT, { type: "herbs", ids: updated });
      return updated;
    }
    return ids;
  },
  async removeHerb(id: string): Promise<string[]> {
    const ids = await this.getSavedHerbIds();
    const updated = ids.filter((item) => item !== id);
    await AsyncStorage.setItem(STORAGE_KEY_HERBS, JSON.stringify(updated));
    DeviceEventEmitter.emit(TOOLKIT_CHANGE_EVENT, { type: "herbs", ids: updated });
    return updated;
  },
  async toggleHerb(id: string): Promise<{ saved: boolean; ids: string[] }> {
    const ids = await this.getSavedHerbIds();
    if (ids.includes(id)) {
      const updated = await this.removeHerb(id);
      return { saved: false, ids: updated };
    } else {
      const updated = await this.saveHerb(id);
      return { saved: true, ids: updated };
    }
  },
};
