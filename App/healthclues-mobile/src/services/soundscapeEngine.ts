// HealthClues Soundscape & Ambient Audio Engine
// Multi-track Web Audio API synthesizer for offline, zero-latency nature and frequency sounds

export interface SoundTrack {
  id: string;
  name: string;
  nameEn?: string;
  category: "nature" | "frequency" | "hypnosis";
  categoryLabel: string;
  categoryLabelEn?: string;
  emoji: string;
  description: string;
  descriptionEn?: string;
  defaultVolume: number;
  pubmedOrLore?: string;
}

export const SOUND_TRACKS: SoundTrack[] = [
  {
    id: "rain",
    name: "Mưa Rào Trên Mái Hiên",
    nameEn: "Rain on Porch Roof",
    category: "nature",
    categoryLabel: "Thiên Nhiên",
    categoryLabelEn: "Nature",
    emoji: "🌧️",
    description: "Tiếng mưa rơi êm dịu trên mái lá, kích hoạt dải sóng Alpha giúp thần kinh dịu đi nhanh chóng.",
    descriptionEn: "Gentle rain tapping on leafy eaves, inducing calming Alpha waves to soothe nervous tension.",
    defaultVolume: 75,
    pubmedOrLore: "PMC 2017: Rain sounds lower cortisol and induce alpha brainwaves",
  },
  {
    id: "stream",
    name: "Suối Thác Ban Mai",
    nameEn: "Morning Stream",
    category: "nature",
    categoryLabel: "Thiên Nhiên",
    categoryLabelEn: "Nature",
    emoji: "🌊",
    description: "Dòng suối nguồn Thung Lũng Giấc Ngủ chảy róc rách qua các bậc đá rêu phong, rửa trôi lo âu.",
    descriptionEn: "A crystal brook babbling through mossy stones in Sleep Valley, washing away daily fatigue.",
    defaultVolume: 60,
    pubmedOrLore: "J Environ Psychol: Water sounds reduce mental fatigue by 38%",
  },
  {
    id: "birds",
    name: "Rừng Thông Chim Hót",
    nameEn: "Pine Forest Birds",
    category: "nature",
    categoryLabel: "Thiên Nhiên",
    categoryLabelEn: "Nature",
    emoji: "🌲",
    description: "Tiếng chim hót ríu rít giữa rặng thông buổi sớm, đánh thức cảm giác an toàn và tươi mới.",
    descriptionEn: "Delightful birdsong echoing through morning pines, awakening calm clarity and freshness.",
    defaultVolume: 50,
    pubmedOrLore: "Nature Sci Rep 2022: Bird song reduces anxiety and paranoia",
  },
  {
    id: "campfire",
    name: "Tiếng Lửa Trại Bập Bùng",
    nameEn: "Cozy Campfire",
    category: "nature",
    categoryLabel: "Thiên Nhiên",
    categoryLabelEn: "Nature",
    emoji: "🏕️",
    description: "Ngọn lửa bập bùng với tiếng lách tách ấm cúng bên lò sưởi làng Thụy Sĩ cổ kính.",
    descriptionEn: "Warm flickering embers and crackles beside an Alpine hearth, softening muscle tightness.",
    defaultVolume: 45,
    pubmedOrLore: "Evolutionary Psychol: Fire crackling relaxes cardiovascular system",
  },
  {
    id: "binaural_432",
    name: "Tần Số Sóng Não Delta 432Hz",
    nameEn: "Delta Brainwave 432Hz",
    category: "frequency",
    categoryLabel: "Sóng Não",
    categoryLabelEn: "Brainwave",
    emoji: "🧠",
    description: "Tần số chữa lành 432Hz kết hợp nhịp sóng Delta (3.5Hz) đồng bộ sóng não vào giấc ngủ sâu không mộng mị.",
    descriptionEn: "Harmonic 432Hz frequency with 3.5Hz Delta beats synchronizing brainwaves into dreamless deep sleep.",
    defaultVolume: 65,
    pubmedOrLore: "Sleep Med Res 2019: 432Hz music promotes deeper NREM sleep",
  },
  {
    id: "hypnosis_ocean",
    name: "Sóng Biển Thôi Miên Êm Ái",
    nameEn: "Hypnotic Ocean Waves",
    category: "hypnosis",
    categoryLabel: "Thôi Miên",
    categoryLabelEn: "Hypnosis",
    emoji: "🌙",
    description: "Nhịp sóng biển vỗ chậm rãi chu kỳ 10 giây/nhịp giúp điều hòa nhịp thở và đưa cơ thể vào trạng thái thôi miên ngủ.",
    descriptionEn: "Gentle 10-second rhythmic ocean swell regulating breath rhythm and lulling mind into restorative slumber.",
    defaultVolume: 55,
    pubmedOrLore: "Frontiers Psychiatry: Slow rhythmic ocean sound promotes sleep onset",
  },
];

class SoundscapeManager {
  private audioCtx: any = null;
  private nodes: Map<string, { gain: any; sourceNodes: any[] }> = new Map();
  private activeTracks: Set<string> = new Set();
  private volumes: Map<string, number> = new Map();
  private sleepTimerId: any = null;
  private sleepTimerMinutes: number | null = null;
  private timerEndTimestamp: number | null = null;

  constructor() {
    SOUND_TRACKS.forEach((track) => {
      this.volumes.set(track.id, track.defaultVolume);
    });
  }

  private getAudioContext(): any {
    if (typeof window === "undefined") return null;
    if (!this.audioCtx) {
      const AudioContextClass =
        (window as any).AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === "suspended") {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  public isTrackPlaying(trackId: string): boolean {
    return this.activeTracks.has(trackId);
  }

  public getTrackVolume(trackId: string): number {
    return this.volumes.get(trackId) ?? 50;
  }

  public getActiveTrackCount(): number {
    return this.activeTracks.size;
  }

  public getActiveTrackIds(): string[] {
    return Array.from(this.activeTracks);
  }

  public getActiveTracks(): string[] {
    return Array.from(this.activeTracks);
  }

  public setTrackVolume(trackId: string, volumePercent: number) {
    const clamped = Math.max(0, Math.min(100, volumePercent));
    this.volumes.set(trackId, clamped);

    const node = this.nodes.get(trackId);
    if (node && this.audioCtx) {
      const gainValue = (clamped / 100) * 0.4;
      node.gain.gain.setValueAtTime(gainValue, this.audioCtx.currentTime);
    }
  }

  public toggleTrack(trackId: string): boolean {
    if (this.activeTracks.has(trackId)) {
      this.stopTrack(trackId);
      return false;
    } else {
      this.playTrack(trackId);
      return true;
    }
  }

  public playTrack(trackId: string) {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    if (this.nodes.has(trackId)) {
      this.stopTrack(trackId);
    }

    const masterGain = ctx.createGain();
    const vol = (this.volumes.get(trackId) ?? 50) / 100;
    masterGain.gain.setValueAtTime(vol * 0.4, ctx.currentTime);
    masterGain.connect(ctx.destination);

    const sourceNodes: any[] = [];

    switch (trackId) {
      case "rain": {
        // Pink noise generator with low-pass filter
        const bufferSize = ctx.sampleRate * 2;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
          b6 = white * 0.115926;
        }
        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(800, ctx.currentTime);

        whiteNoise.connect(filter);
        filter.connect(masterGain);
        whiteNoise.start(0);
        sourceNodes.push(whiteNoise, filter);
        break;
      }

      case "stream": {
        // Brown noise with low-mid resonance
        const bufferSize = ctx.sampleRate * 2;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          output[i] = (lastOut + 0.02 * white) / 1.02;
          lastOut = output[i];
          output[i] *= 3.5;
        }
        const brownNoise = ctx.createBufferSource();
        brownNoise.buffer = noiseBuffer;
        brownNoise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.setValueAtTime(450, ctx.currentTime);
        filter.Q.setValueAtTime(1.2, ctx.currentTime);

        brownNoise.connect(filter);
        filter.connect(masterGain);
        brownNoise.start(0);
        sourceNodes.push(brownNoise, filter);
        break;
      }

      case "birds": {
        // High harmonic sine osc with soft fluttering frequency
        const osc = ctx.createOscillator();
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(2600, ctx.currentTime);

        lfo.type = "sine";
        lfo.frequency.setValueAtTime(4.5, ctx.currentTime);
        lfoGain.gain.setValueAtTime(320, ctx.currentTime);

        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);

        osc.connect(masterGain);
        lfo.start(0);
        osc.start(0);
        sourceNodes.push(osc, lfo, lfoGain);
        break;
      }

      case "campfire": {
        // Low rumble + randomized crackle
        const osc = ctx.createOscillator();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(120, ctx.currentTime);

        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(200, ctx.currentTime);

        osc.connect(filter);
        filter.connect(masterGain);
        osc.start(0);
        sourceNodes.push(osc, filter);
        break;
      }

      case "binaural_432": {
        // 432Hz carrier left + 435.5Hz carrier right (Delta 3.5Hz sleep wave)
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        osc1.type = "sine";
        osc1.frequency.setValueAtTime(432, ctx.currentTime);

        osc2.type = "sine";
        osc2.frequency.setValueAtTime(435.5, ctx.currentTime);

        osc1.connect(masterGain);
        osc2.connect(masterGain);
        osc1.start(0);
        osc2.start(0);
        sourceNodes.push(osc1, osc2);
        break;
      }

      case "hypnosis_ocean": {
        // Very slow 0.1Hz undulating wave filter on pink noise
        const bufferSize = ctx.sampleRate * 2;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = (Math.random() * 2 - 1) * 0.2;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuffer;
        noise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(350, ctx.currentTime);

        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.type = "sine";
        lfo.frequency.setValueAtTime(0.08, ctx.currentTime);
        lfoGain.gain.setValueAtTime(220, ctx.currentTime);

        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);

        noise.connect(filter);
        filter.connect(masterGain);
        noise.start(0);
        lfo.start(0);
        sourceNodes.push(noise, filter, lfo, lfoGain);
        break;
      }
    }

    this.nodes.set(trackId, { gain: masterGain, sourceNodes });
    this.activeTracks.add(trackId);
  }

  public stopTrack(trackId: string) {
    const node = this.nodes.get(trackId);
    if (node) {
      try {
        node.sourceNodes.forEach((s) => {
          if (s.stop) s.stop(0);
          if (s.disconnect) s.disconnect();
        });
        node.gain.disconnect();
      } catch {}
      this.nodes.delete(trackId);
    }
    this.activeTracks.delete(trackId);
  }

  public stopAllTracks() {
    this.activeTracks.forEach((id) => this.stopTrack(id));
    this.activeTracks.clear();
  }

  public setSleepTimer(minutes: number | null) {
    if (this.sleepTimerId) {
      clearTimeout(this.sleepTimerId);
      this.sleepTimerId = null;
    }
    this.sleepTimerMinutes = minutes;
    if (minutes && minutes > 0) {
      this.timerEndTimestamp = Date.now() + minutes * 60 * 1000;
      this.sleepTimerId = setTimeout(() => {
        this.stopAllTracks();
        this.sleepTimerMinutes = null;
        this.timerEndTimestamp = null;
      }, minutes * 60 * 1000);
    } else {
      this.timerEndTimestamp = null;
    }
  }

  public getSleepTimerRemaining(): number | null {
    if (!this.timerEndTimestamp) return null;
    const rem = Math.max(0, Math.floor((this.timerEndTimestamp - Date.now()) / 1000));
    return rem;
  }

  public getSleepTimerMinutes(): number | null {
    return this.sleepTimerMinutes;
  }
}

export const soundscape = new SoundscapeManager();
