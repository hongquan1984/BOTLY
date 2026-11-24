import { DeviceEventEmitter } from "react-native";
import { apiFetch } from "./api";

export const TOOLKIT_CHANGE_EVENT = "HEALTHCLUES_TOOLKIT_CHANGED";

type ToolkitType = "herb" | "sound" | "breath";
type ToolkitState = { herbs: string[]; sounds: string[]; breaths: string[] };

async function loadToolkit(): Promise<ToolkitState> {
  return apiFetch<ToolkitState>("/api/healthclues/mobile-toolkit");
}

async function mutateToolkit(action: "save" | "remove", itemType: ToolkitType, itemId: string): Promise<string[]> {
  await apiFetch("/api/healthclues/mobile-toolkit", { method: "POST", body: JSON.stringify({ action, itemType, itemId }) });
  const state = await loadToolkit();
  const ids = state[`${itemType}s` as "herbs" | "sounds" | "breaths"];
  DeviceEventEmitter.emit(TOOLKIT_CHANGE_EVENT, { type: `${itemType}s`, ids });
  return ids;
}

export const toolkitStorage = {
  async getState(): Promise<ToolkitState> {
    return loadToolkit();
  },

  // Sounds
  async getSavedSoundIds(): Promise<string[]> {
    return (await loadToolkit()).sounds;
  },
  async isSoundSaved(id: string): Promise<boolean> {
    const ids = await this.getSavedSoundIds();
    return ids.includes(id);
  },
  async saveSound(id: string): Promise<string[]> {
    const ids = await this.getSavedSoundIds();
    if (!ids.includes(id)) {
      return mutateToolkit("save", "sound", id);
    }
    return ids;
  },
  async removeSound(id: string): Promise<string[]> {
    return mutateToolkit("remove", "sound", id);
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
    return (await loadToolkit()).breaths;
  },
  async isBreathSaved(id: string): Promise<boolean> {
    const ids = await this.getSavedBreathIds();
    return ids.includes(id);
  },
  async saveBreath(id: string): Promise<string[]> {
    const ids = await this.getSavedBreathIds();
    if (!ids.includes(id)) {
      return mutateToolkit("save", "breath", id);
    }
    return ids;
  },
  async removeBreath(id: string): Promise<string[]> {
    return mutateToolkit("remove", "breath", id);
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
    return (await loadToolkit()).herbs;
  },
  async isHerbSaved(id: string): Promise<boolean> {
    const ids = await this.getSavedHerbIds();
    return ids.includes(id);
  },
  async saveHerb(id: string): Promise<string[]> {
    const ids = await this.getSavedHerbIds();
    if (!ids.includes(id)) {
      return mutateToolkit("save", "herb", id);
    }
    return ids;
  },
  async removeHerb(id: string): Promise<string[]> {
    return mutateToolkit("remove", "herb", id);
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
