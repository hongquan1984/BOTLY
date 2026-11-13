import { DeviceEventEmitter, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Asset } from "expo-asset";
import { Audio } from "expo-av";

export const AUDIO_STORAGE_KEY = "healthclues-audio-settings";
export const AUDIO_STATE_EVENT = "healthclues-audio-changed";

export type BgmTrackId = "forest" | "alpine" | "night" | "off";
export type SfxSoundType = "tap" | "tab" | "seal" | "success" | "locked";

export interface BgmTrackOption {
  id: BgmTrackId;
  emoji: string;
  label: string;
  desc: string;
}

export const BGM_TRACK_OPTIONS: BgmTrackOption[] = [
  {
    id: "forest",
    emoji: "🌲",
    label: "Rừng Ngọc Lục Bảo",
    desc: "Giai điệu hạc ngũ cung dịu nhẹ, thư thái",
  },
  {
    id: "alpine",
    emoji: "🏔️",
    label: "Thung Lũng Thụy Sĩ",
    desc: "Âm sắc chuông mộc & đàn harp trong trẻo",
  },
  {
    id: "night",
    emoji: "🌙",
    label: "Đêm Bình Yên",
    desc: "Nhịp điệu chậm ấm áp, êm dịu cuối ngày",
  },
  {
    id: "off",
    emoji: "🔇",
    label: "Tắt nhạc nền",
    desc: "Chỉ giữ hiệu ứng nút bấm hoặc im lặng",
  },
];

export interface GameAudioSettings {
  bgmTrack: BgmTrackId;
  sfxEnabled: boolean;
  muted: boolean;
  musicVolume: number;
  sfxVolume: number;
}

export const DEFAULT_AUDIO_SETTINGS: GameAudioSettings = {
  bgmTrack: "forest",
  sfxEnabled: true,
  muted: false,
  musicVolume: 0.28,
  sfxVolume: 0.52,
};

const SFX_ASSETS: Record<SfxSoundType, number> = {
  tap: require("../../assets/audio/sfx-tap.wav"),
  tab: require("../../assets/audio/sfx-tab.wav"),
  seal: require("../../assets/audio/sfx-seal.wav"),
  success: require("../../assets/audio/sfx-success.wav"),
  locked: require("../../assets/audio/sfx-locked.wav"),
};

const BGM_ASSETS: Record<Exclude<BgmTrackId, "off">, number> = {
  forest: require("../../assets/audio/bgm-forest.wav"),
  alpine: require("../../assets/audio/bgm-alpine.wav"),
  night: require("../../assets/audio/bgm-night.wav"),
};

let currentSettings: GameAudioSettings = { ...DEFAULT_AUDIO_SETTINGS };
let settingsLoaded = false;

// Web Audio API handles
let webAudioCtx: AudioContext | null = null;
const webBuffers = new Map<string, AudioBuffer>();
let webBgmSource: AudioBufferSourceNode | null = null;
let webBgmGain: GainNode | null = null;
let activeWebTrack: BgmTrackId = "off";

// Native Expo AV handles
let nativeModeReady = false;
let nativeBgmSound: Audio.Sound | null = null;
let activeNativeTrack: BgmTrackId = "off";
const nativeSfxPool = new Map<SfxSoundType, Audio.Sound>();

function getWebAudioContext(): AudioContext | null {
  if (Platform.OS !== "web" || typeof window === "undefined") return null;
  if (!webAudioCtx) {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (Ctor) {
      try {
        webAudioCtx = new Ctor();
      } catch {
        return null;
      }
    }
  }
  return webAudioCtx;
}

async function loadWebBuffer(key: string, moduleRef: number): Promise<AudioBuffer | null> {
  const ctx = getWebAudioContext();
  if (!ctx) return null;
  const cached = webBuffers.get(key);
  if (cached) return cached;

  try {
    const asset = Asset.fromModule(moduleRef);
    const uri = asset.uri || asset.localUri;
    if (!uri) return null;
    const response = await fetch(uri);
    const arrayBuf = await response.arrayBuffer();
    const decoded = await ctx.decodeAudioData(arrayBuf);
    webBuffers.set(key, decoded);
    return decoded;
  } catch {
    return null;
  }
}

function playWebFallbackTone(type: SfxSoundType): void {
  const ctx = getWebAudioContext();
  if (!ctx || ctx.state !== "running") return;
  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const freqMap: Record<SfxSoundType, number> = {
      tap: 640,
      tab: 720,
      seal: 1046,
      success: 880,
      locked: 170,
    };
    osc.type = type === "locked" ? "triangle" : "sine";
    osc.frequency.setValueAtTime(freqMap[type], now);
    gain.gain.setValueAtTime(0.08 * currentSettings.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (type === "success" ? 0.28 : 0.08));
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + (type === "success" ? 0.3 : 0.09));
  } catch {}
}

function stopWebBgm(): void {
  try {
    webBgmSource?.stop();
    webBgmSource?.disconnect();
  } catch {}
  webBgmSource = null;
  activeWebTrack = "off";
}

async function syncWebBgm(): Promise<void> {
  const ctx = getWebAudioContext();
  if (!ctx) return;

  const targetTrack: BgmTrackId = currentSettings.muted ? "off" : currentSettings.bgmTrack;
  if (targetTrack === "off") {
    stopWebBgm();
    return;
  }

  if (ctx.state === "suspended") {
    try {
      await ctx.resume();
    } catch {
      return;
    }
  }
  if (ctx.state !== "running") return;

  if (activeWebTrack === targetTrack && webBgmSource && webBgmGain) {
    webBgmGain.gain.setValueAtTime(currentSettings.musicVolume, ctx.currentTime);
    return;
  }

  stopWebBgm();
  const buffer = await loadWebBuffer(`bgm-${targetTrack}`, BGM_ASSETS[targetTrack]);
  if (!buffer) return;

  // Guard if settings changed while decoding
  if (currentSettings.muted || currentSettings.bgmTrack !== targetTrack) return;

  try {
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(currentSettings.musicVolume, ctx.currentTime);

    src.connect(gain);
    gain.connect(ctx.destination);
    src.start(0);

    webBgmSource = src;
    webBgmGain = gain;
    activeWebTrack = targetTrack;
  } catch {}
}

async function syncNativeBgm(): Promise<void> {
  if (Platform.OS === "web") return;
  if (!nativeModeReady) {
    nativeModeReady = true;
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });
    } catch {}
  }

  const targetTrack: BgmTrackId = currentSettings.muted ? "off" : currentSettings.bgmTrack;
  if (targetTrack === "off") {
    if (nativeBgmSound) {
      try {
        await nativeBgmSound.stopAsync();
        await nativeBgmSound.unloadAsync();
      } catch {}
      nativeBgmSound = null;
    }
    activeNativeTrack = "off";
    return;
  }

  if (activeNativeTrack === targetTrack && nativeBgmSound) {
    try {
      await nativeBgmSound.setVolumeAsync(currentSettings.musicVolume);
    } catch {}
    return;
  }

  if (nativeBgmSound) {
    try {
      await nativeBgmSound.stopAsync();
      await nativeBgmSound.unloadAsync();
    } catch {}
    nativeBgmSound = null;
  }

  try {
    const { sound } = await Audio.Sound.createAsync(BGM_ASSETS[targetTrack], {
      isLooping: true,
      shouldPlay: true,
      volume: currentSettings.musicVolume,
    });
    nativeBgmSound = sound;
    activeNativeTrack = targetTrack;
  } catch {}
}

/**
 * Loads saved game audio settings from AsyncStorage once.
 */
export async function loadAudioSettings(): Promise<GameAudioSettings> {
  if (!settingsLoaded) {
    settingsLoaded = true;
    try {
      const raw = await AsyncStorage.getItem(AUDIO_STORAGE_KEY);
      if (raw) {
        currentSettings = {
          ...DEFAULT_AUDIO_SETTINGS,
          ...(JSON.parse(raw) as Partial<GameAudioSettings>),
        };
      }
    } catch {}
  }
  return { ...currentSettings };
}

/**
 * Returns latest in-memory audio settings synchronously.
 */
export function getAudioSettingsSync(): GameAudioSettings {
  return { ...currentSettings };
}

/**
 * Updates audio preferences, persists locally, emits AUDIO_STATE_EVENT, and updates BGM playback.
 */
export async function updateAudioSettings(
  patch: Partial<GameAudioSettings>
): Promise<GameAudioSettings> {
  await loadAudioSettings();
  currentSettings = { ...currentSettings, ...patch };
  try {
    await AsyncStorage.setItem(AUDIO_STORAGE_KEY, JSON.stringify(currentSettings));
  } catch {}
  DeviceEventEmitter.emit(AUDIO_STATE_EVENT, currentSettings);

  if (Platform.OS === "web") {
    void syncWebBgm();
  } else {
    void syncNativeBgm();
  }

  return { ...currentSettings };
}

/**
 * Unlocks browser audio playback on the first user gesture and starts BGM if enabled.
 */
export async function unlockAndStartBgm(): Promise<void> {
  await loadAudioSettings();
  if (Platform.OS === "web") {
    const ctx = getWebAudioContext();
    if (ctx && ctx.state === "suspended") {
      try {
        await ctx.resume();
      } catch {}
    }
    void syncWebBgm();
    (Object.entries(SFX_ASSETS) as Array<[SfxSoundType, number]>).forEach(([k, ref]) => {
      void loadWebBuffer(`sfx-${k}`, ref);
    });
  } else {
    void syncNativeBgm();
  }
}

/**
 * Plays a game UI/action sound effect if SFX is enabled and global sound is unmuted.
 */
export async function playSfx(type: SfxSoundType = "tap"): Promise<void> {
  if (!settingsLoaded) {
    await loadAudioSettings();
  }
  if (currentSettings.muted || !currentSettings.sfxEnabled) return;

  if (Platform.OS === "web") {
    const ctx = getWebAudioContext();
    if (!ctx) return;
    if (ctx.state === "suspended") {
      try {
        await ctx.resume();
      } catch {}
    }
    const existing = webBuffers.get(`sfx-${type}`);
    if (existing && ctx.state === "running") {
      try {
        const src = ctx.createBufferSource();
        src.buffer = existing;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(currentSettings.sfxVolume, ctx.currentTime);
        src.connect(gain);
        gain.connect(ctx.destination);
        src.start(0);
      } catch {}
    } else {
      playWebFallbackTone(type);
      void loadWebBuffer(`sfx-${type}`, SFX_ASSETS[type]);
    }
    if (activeWebTrack === "off" && currentSettings.bgmTrack !== "off") {
      void syncWebBgm();
    }
    return;
  }

  try {
    let sound = nativeSfxPool.get(type);
    if (!sound) {
      const created = await Audio.Sound.createAsync(SFX_ASSETS[type], {
        volume: currentSettings.sfxVolume,
      });
      sound = created.sound;
      nativeSfxPool.set(type, sound);
    }
    await sound.setVolumeAsync(currentSettings.sfxVolume);
    await sound.replayAsync();
  } catch {}
}
