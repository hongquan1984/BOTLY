import { Platform } from "react-native";
import * as Haptics from "expo-haptics";

let webAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (Platform.OS !== "web" || typeof window === "undefined") return null;
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioCtx) return null;
  if (!webAudioCtx) {
    webAudioCtx = new AudioCtx();
  }
  if (webAudioCtx && webAudioCtx.state === "suspended") {
    webAudioCtx.resume().catch(() => {});
  }
  return webAudioCtx;
}

/**
 * Âm thanh tiếng cá heo vui vẻ (Happy Dolphin Chirp):
 * Lướt sóng tần số cao 1500Hz -> 2850Hz -> 2150Hz tạo âm thanh chít chít đáng yêu.
 */
export function playDolphinChirp(volume = 0.35): void {
  try {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      return;
    }
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    // Tần số lượn sóng đặc trưng của tiếng cá heo
    osc.frequency.setValueAtTime(1450, now);
    osc.frequency.exponentialRampToValueAtTime(2900, now + 0.08);
    osc.frequency.exponentialRampToValueAtTime(2100, now + 0.16);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.24);
  } catch {}
}

/**
 * Âm thanh cá heo cười rúc rích (Dolphin Giggle / Chatter):
 * Chuỗi 3 tiếng chít ngắn liên tiếp nhanh.
 */
export function playDolphinGiggle(volume = 0.3): void {
  try {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      return;
    }
    const ctx = getAudioContext();
    if (!ctx) return;

    const delays = [0, 0.07, 0.15];
    const freqs = [1900, 2400, 2200];

    delays.forEach((delay, idx) => {
      const now = ctx.currentTime + delay;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freqs[idx], now);
      osc.frequency.exponentialRampToValueAtTime(freqs[idx] * 1.35, now + 0.04);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(volume * 0.9, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.065);
    });
  } catch {}
}

/**
 * Âm thanh tiếng huýt sáo cá heo (Dolphin Signature Whistle):
 * Du dương, nhẹ nhàng, dùng khi đưa ra lời khuyên hoặc chào đón.
 */
export function playDolphinWhistle(volume = 0.28): void {
  try {
    if (Platform.OS !== "web") return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(1750, now);
    osc.frequency.linearRampToValueAtTime(2600, now + 0.12);
    osc.frequency.linearRampToValueAtTime(2350, now + 0.24);
    osc.frequency.linearRampToValueAtTime(2850, now + 0.38);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.44);
  } catch {}
}
