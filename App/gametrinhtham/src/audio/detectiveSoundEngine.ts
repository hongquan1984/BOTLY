/**
 * HealthClues Mystery Detective — Sensory Audio Engine (Hybrid Web Audio API + Rain Ambience)
 *
 * Zero-dependency browser synthesizer paired with an optional cozy rain ambience bed:
 * - Adaptive 3-stage nocturnal mystery BGM ("ambient" | "investigate" | "tension")
 * - Pitch-varied semantic foley SFX for paper folders, brass locks, magnifying lens,
 *   evidence wax-stamping, Luna chimes, corkboard string pins, penalties, & coin cascades.
 * - Safe browser autoplay compliance (unlocks smoothly on first user interaction) + haptics.
 */

export type MysteryBgmMood = "ambient" | "investigate" | "tension";

const SOUND_PREF_KEY = "healthclues_detective_sound_v1";

// Minor Pentatonic / Dorian nocturnal mystery chord progressions (Hz)
const MOOD_CHORDS: Record<MysteryBgmMood, number[][]> = {
  // Nocturnal curiosity (Am9 -> Fmaj7 -> Dm9 -> Em7)
  ambient: [
    [110.0, 220.0, 261.63, 329.63], // Am
    [87.31, 174.61, 220.0, 329.63], // Fmaj7
    [146.83, 220.0, 261.63, 329.63], // Dm9
    [82.41, 164.81, 246.94, 293.66], // Em7
  ],
  // Analytical investigation (steady focus + quiet intrigue)
  investigate: [
    [110.0, 196.0, 261.63, 329.63],
    [98.0, 196.0, 246.94, 293.66],
    [87.31, 174.61, 220.0, 293.66],
    [110.0, 164.81, 261.63, 392.0],
  ],
  // High-stakes deduction climax (deeper bass & noir suspense)
  tension: [
    [82.41, 164.81, 220.0, 261.63],
    [73.42, 146.83, 220.0, 261.63],
    [87.31, 174.61, 207.65, 311.13], // Noir diminished shift
    [82.41, 164.81, 246.94, 311.13],
  ],
};

const MELODY_POOL = [440.0, 523.25, 587.33, 659.25, 783.99, 880.0];

class DetectiveSoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private bgmBus: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private rainEl: HTMLAudioElement | null = null;
  private isEnabled = true;
  private isUnlocked = false;
  private mood: MysteryBgmMood = "ambient";
  private stepIdx = 0;
  private sequencerTimer: number | null = null;
  private noiseBuffer: AudioBuffer | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      try {
        const saved = window.localStorage.getItem(SOUND_PREF_KEY);
        if (saved === "off") this.isEnabled = false;
      } catch {}
    }
  }

  public getEnabled(): boolean {
    return this.isEnabled;
  }

  public toggleEnabled(): boolean {
    this.isEnabled = !this.isEnabled;
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(SOUND_PREF_KEY, this.isEnabled ? "on" : "off");
      } catch {}
    }
    this.syncAudioState();
    if (this.isEnabled) {
      this.unlock();
      this.playUiClick();
    }
    return this.isEnabled;
  }

  public setBgmMood(nextMood: MysteryBgmMood): void {
    if (this.mood === nextMood) return;
    this.mood = nextMood;
    if (this.isUnlocked && this.isEnabled) {
      this.restartSequencer();
    }
  }

  public unlock(): void {
    if (typeof window === "undefined") return;
    if (!this.ctx) {
      const AudioCtor =
        window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtor) return;
      try {
        this.ctx = new AudioCtor();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = this.isEnabled ? 0.9 : 0;
        this.masterGain.connect(this.ctx.destination);

        this.bgmBus = this.ctx.createGain();
        this.bgmBus.gain.value = 0.55;
        this.bgmBus.connect(this.masterGain);

        this.sfxBus = this.ctx.createGain();
        this.sfxBus.gain.value = 0.85;
        this.sfxBus.connect(this.masterGain);

        // Pre-bake 1.2s soft noise buffer for zero-latency tactile paper/stamp SFX
        const len = Math.floor(this.ctx.sampleRate * 1.2);
        this.noiseBuffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
        const ch = this.noiseBuffer.getChannelData(0);
        let lastOut = 0;
        for (let i = 0; i < len; i++) {
          const white = Math.random() * 2 - 1;
          lastOut = (lastOut + 0.04 * white) / 1.04;
          ch[i] = white * 0.55 + lastOut * 1.8;
        }
      } catch {
        return;
      }
    }

    if (this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }

    if (!this.isUnlocked) {
      this.isUnlocked = true;
      this.ensureRainAmbience();
      if (this.isEnabled) {
        this.restartSequencer();
      }
    }
  }

  private ensureRainAmbience(): void {
    if (typeof window === "undefined" || this.rainEl) return;
    try {
      const el = new Audio("/gametrinhtham/audio/rain-ambience.mp3");
      el.loop = true;
      el.volume = this.isEnabled ? 0.065 : 0;
      el.preload = "auto";
      this.rainEl = el;
      if (this.isEnabled) {
        el.play().catch(() => {});
      }
    } catch {}
  }

  private syncAudioState(): void {
    if (this.ctx && this.masterGain) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.linearRampToValueAtTime(this.isEnabled ? 0.9 : 0.0, now + 0.12);
    }
    if (this.rainEl) {
      this.rainEl.volume = this.isEnabled ? 0.065 : 0;
      if (this.isEnabled) {
        this.rainEl.play().catch(() => {});
      } else {
        this.rainEl.pause();
      }
    }
    if (this.isEnabled && this.isUnlocked) {
      this.restartSequencer();
    } else if (this.sequencerTimer !== null && typeof window !== "undefined") {
      window.clearInterval(this.sequencerTimer);
      this.sequencerTimer = null;
    }
  }

  private restartSequencer(): void {
    if (typeof window === "undefined") return;
    if (this.sequencerTimer !== null) {
      window.clearInterval(this.sequencerTimer);
      this.sequencerTimer = null;
    }
    if (!this.isEnabled || !this.ctx) return;

    // Play an immediate opening beat smoothly
    this.tickAmbientStep();
    const intervalMs = this.mood === "tension" ? 580 : this.mood === "investigate" ? 720 : 880;
    this.sequencerTimer = window.setInterval(() => {
      this.tickAmbientStep();
    }, intervalMs);
  }

  private tickAmbientStep(): void {
    if (!this.isEnabled || !this.ctx || !this.bgmBus || this.ctx.state !== "running") return;

    const chords = MOOD_CHORDS[this.mood];
    const chordIdx = Math.floor(this.stepIdx / 4) % chords.length;
    const beatInBar = this.stepIdx % 4;
    const chord = chords[chordIdx];

    // On downbeat of bar: warm soft lowpass nocturnal pad chord
    if (beatInBar === 0) {
      chord.forEach((freq, idx) => {
        this.schedulePadVoice(
          freq,
          idx === 0 ? "triangle" : "sine",
          this.mood === "tension" ? 2.2 : 3.2,
          idx === 0 ? 0.055 : 0.028,
          idx * 0.035
        );
      });
    }

    // Subtle wooden pocket-watch pulse during investigation & deduction tension
    if (this.mood !== "ambient") {
      const tickFreq = beatInBar === 0 ? 920 : 680;
      this.scheduleNoiseCore(
        0.022,
        tickFreq,
        4.5,
        this.mood === "tension" ? 0.025 : 0.015,
        0,
        this.bgmBus
      );
    }

    // Delicate contemplative Rhodes/music-box mystery note on beats 1 or 3
    if (beatInBar === 1 || (beatInBar === 3 && Math.random() > 0.35)) {
      const noteIdx = (chordIdx * 2 + beatInBar + Math.floor(Math.random() * 2)) % MELODY_POOL.length;
      const melodyFreq = this.mood === "tension" ? MELODY_POOL[noteIdx] * 0.75 : MELODY_POOL[noteIdx];
      this.scheduleToneCore(melodyFreq, "sine", 1.15, 0.022, 0.02, undefined, this.bgmBus);
    }

    this.stepIdx = (this.stepIdx + 1) % 64;
  }

  private schedulePadVoice(
    freq: number,
    type: OscillatorType,
    duration: number,
    peakGain: number,
    delay = 0
  ): void {
    if (!this.ctx || !this.bgmBus) return;
    const now = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(580, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(peakGain, now + Math.min(0.85, duration * 0.32));
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.bgmBus);

    osc.start(now);
    osc.stop(now + duration + 0.05);
  }

  private scheduleToneCore(
    freq: number,
    type: OscillatorType,
    duration: number,
    peakGain: number,
    delay = 0,
    slideToFreq?: number,
    dest?: AudioNode
  ): void {
    if (!this.ctx || !this.sfxBus) return;
    const targetBus = dest || this.sfxBus;
    const now = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slideToFreq) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(25, slideToFreq), now + duration);
    }

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(peakGain, now + Math.min(0.014, duration * 0.2));
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(targetBus);

    osc.start(now);
    osc.stop(now + duration + 0.03);
  }

  private scheduleNoiseCore(
    duration: number,
    bandFreq: number,
    q: number,
    peakGain: number,
    delay = 0,
    dest?: AudioNode
  ): void {
    if (!this.ctx || !this.sfxBus || !this.noiseBuffer) return;
    const targetBus = dest || this.sfxBus;
    const now = this.ctx.currentTime + delay;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(bandFreq, now);
    filter.Q.setValueAtTime(q, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(peakGain, now + Math.min(0.018, duration * 0.25));
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(targetBus);

    src.start(now);
    src.stop(now + duration + 0.03);
  }

  private canPlaySfx(): boolean {
    if (!this.isEnabled) return false;
    this.unlock();
    return Boolean(this.ctx && this.sfxBus && this.ctx.state !== "closed");
  }

  private vibrate(pattern: number | number[]): void {
    if (!this.isEnabled || typeof navigator === "undefined") return;
    try {
      if (typeof navigator.vibrate === "function") {
        navigator.vibrate(pattern);
      }
    } catch {}
  }

  private vary(base: number, pct = 0.04): number {
    return base * (1 + (Math.random() * 2 - 1) * pct);
  }

  // ============================================================================
  // SEMANTIC FOLEY LIBRARY
  // ============================================================================

  /** Subtle warm wooden/brass UI tap */
  public playUiClick(): void {
    if (!this.canPlaySfx()) return;
    this.scheduleToneCore(this.vary(760), "triangle", 0.055, 0.11, 0, 380);
    this.scheduleNoiseCore(0.025, 2200, 1.8, 0.06, 0);
    this.vibrate(10);
  }

  /** Crisp paper rustle for tabs, notebook page flip & modals */
  public playPaperFlip(): void {
    if (!this.canPlaySfx()) return;
    this.scheduleNoiseCore(0.11, this.vary(1350, 0.08), 1.4, 0.14, 0);
    this.scheduleNoiseCore(0.08, this.vary(2100, 0.08), 2.1, 0.09, 0.045);
    this.vibrate(10);
  }

  /** Tactile leather/kraft dossier opening on Mahogany desk */
  public playFolderOpen(): void {
    if (!this.canPlaySfx()) return;
    this.scheduleToneCore(165, "sine", 0.09, 0.18, 0, 68);
    this.scheduleNoiseCore(0.16, 1100, 1.2, 0.16, 0.03);
    this.scheduleToneCore(440, "triangle", 0.14, 0.07, 0.06, 554);
    this.vibrate([15, 20, 12]);
  }

  /** Ethereal magnifying glass shimmer on object click or Detective Scan */
  public playMagnifyInspect(): void {
    if (!this.canPlaySfx()) return;
    this.scheduleToneCore(this.vary(523.25), "sine", 0.16, 0.1, 0, 783.99);
    this.scheduleToneCore(this.vary(1046.5), "triangle", 0.18, 0.06, 0.035);
    this.scheduleNoiseCore(0.14, 2900, 2.6, 0.05, 0);
    this.vibrate(14);
  }

  /** Wax seal thud + ascending crystal "Aha!" sparkle when recording a clue */
  public playEvidenceSave(clueCountSoFar = 1): void {
    if (!this.canPlaySfx()) return;
    const semitoneLift = Math.pow(2, Math.min(6, Math.max(0, clueCountSoFar - 1)) / 12);
    // Warm wax stamp thump
    this.scheduleToneCore(180, "sine", 0.11, 0.2, 0, 75);
    // Crystal confirmation chord pitched upward progressively across 1..6 clues
    this.scheduleToneCore(523.25 * semitoneLift, "triangle", 0.22, 0.14, 0.04);
    this.scheduleToneCore(659.25 * semitoneLift, "sine", 0.26, 0.12, 0.095);
    this.scheduleToneCore(783.99 * semitoneLift, "sine", 0.34, 0.11, 0.15);
    this.vibrate([18, 25, 16]);
  }

  /** Friendly playful Fox Companion Luna notification chime */
  public playLunaChirp(): void {
    if (!this.canPlaySfx()) return;
    this.scheduleToneCore(659.25, "sine", 0.12, 0.1, 0);
    this.scheduleToneCore(880.0, "triangle", 0.16, 0.09, 0.065);
    this.scheduleToneCore(1046.5, "sine", 0.22, 0.08, 0.12);
    this.vibrate(12);
  }

  /** Brass pin snap on Corkboard wiring card to Center Padlock */
  public playPinSnap(selecting: boolean, selectedCount = 1): void {
    if (!this.canPlaySfx()) return;
    if (selecting) {
      const pitchScale = [1, 1.122, 1.26, 1.335, 1.498][Math.min(4, Math.max(0, selectedCount - 1))];
      this.scheduleToneCore(1320 * pitchScale, "sine", 0.06, 0.13, 0, 520);
      this.scheduleToneCore(440 * pitchScale, "triangle", 0.16, 0.11, 0.025);
      this.scheduleNoiseCore(0.035, 3200, 2.2, 0.08, 0);
    } else {
      this.scheduleToneCore(392, "triangle", 0.09, 0.09, 0, 261.63);
    }
    this.vibrate(selecting ? 16 : 8);
  }

  /** Dramatic pause tick while padlock evaluates conclusion */
  public playAnticipationLock(): void {
    if (!this.canPlaySfx()) return;
    this.scheduleToneCore(1180, "sine", 0.05, 0.12, 0, 620);
    this.scheduleToneCore(1480, "sine", 0.05, 0.1, 0.11, 740);
    this.vibrate(15);
  }

  /** Heavy wooden thud + minor second dissonance for -1★ mistake */
  public playWrongAttempt(): void {
    if (!this.canPlaySfx()) return;
    this.scheduleToneCore(130, "sawtooth", 0.24, 0.12, 0, 58);
    this.scheduleToneCore(233.08, "triangle", 0.28, 0.1, 0.02, 207.65);
    this.scheduleToneCore(220.0, "triangle", 0.28, 0.1, 0.02, 196.0);
    this.vibrate([45, 30, 55]);
  }

  /** Ascending ink checkmark harmonic on Step 2 health action checklist */
  public playChecklistTick(checkedCount = 1): void {
    if (!this.canPlaySfx()) return;
    const notes = [523.25, 587.33, 659.25, 783.99];
    const freq = notes[Math.min(3, Math.max(0, checkedCount - 1))];
    this.scheduleToneCore(freq, "triangle", 0.18, 0.13, 0);
    this.scheduleToneCore(freq * 1.5, "sine", 0.2, 0.07, 0.045);
    this.vibrate(14);
  }

  /** Heavy locked brass padlock rattle */
  public playLockedPadlock(): void {
    if (!this.canPlaySfx()) return;
    this.scheduleToneCore(320, "triangle", 0.06, 0.12, 0, 210);
    this.scheduleToneCore(280, "triangle", 0.07, 0.1, 0.07, 180);
    this.scheduleNoiseCore(0.05, 2500, 3.0, 0.07, 0);
    this.vibrate([20, 20, 20]);
  }

  /** Cascading metallic gold coin clinks (used after solving a case) */
  public playCoinCascade(coinBurstCount = 5): void {
    if (!this.canPlaySfx()) return;
    const count = Math.min(7, Math.max(2, coinBurstCount));
    for (let i = 0; i < count; i++) {
      const delay = i * 0.085;
      const base = this.vary(2450 + i * 160, 0.04);
      this.scheduleToneCore(base, "sine", 0.24, 0.085, delay);
      this.scheduleToneCore(base * 1.38, "sine", 0.2, 0.055, delay + 0.01);
    }
  }

  /** Triumphant Breakthrough fanfare + coin cascade when solving a case */
  public playCaseSolvedFanfare(): void {
    if (!this.canPlaySfx()) return;
    const notes = [440.0, 554.37, 659.25, 880.0];
    notes.forEach((n, idx) => {
      this.scheduleToneCore(n, "triangle", 0.45, 0.13, idx * 0.085);
      this.scheduleToneCore(n * 2, "sine", 0.4, 0.055, idx * 0.085 + 0.02);
    });
    this.playCoinCascade(6);
    this.vibrate([25, 30, 25, 30, 50]);
  }
}

export const detectiveAudio = new DetectiveSoundEngine();
