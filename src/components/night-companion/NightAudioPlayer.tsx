'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Check,
  Eye,
  EyeOff,
  FastForward,
  Moon,
  Pause,
  Play,
  Radio,
  Sparkles,
  Square,
  Waves,
} from 'lucide-react';
import {
  type NightOneBackgroundPreset,
  type NightScript,
  type GuideVoiceOption,
  GUIDE_VOICE_PROFILES,
  getNightOneVoicePath,
  selectNightOneIntro,
  selectNightOneVoiceOptions,
  selectCognitivePivotTrack,
  NIGHT_ONE_VOICES,
  DEEP_DELTA_TRACK,
  SLEEP_COCOON_TRACK,
  SLEEP_JOURNEY_STAGES,
  type SleepJourneyStageId,
} from '@/lib/night-companion-content';
import { ListeningAccumulator, createPlaybackSessionId } from '@/lib/night-companion-analytics';
import type { TonightStateId } from '@/lib/night-companion';

type Track = {
  asset_id: string;
  local_path: string;
  pacer_path?: string;
  pacer_pattern?: string;
  pacer_title_en?: string;
  pacer_title_vi?: string;
  label: string;
  label_vi?: string;
  duration_seconds: number;
  kind: 'background' | 'voice';
};
type SleepTimer = 'until_voice' | '15' | '30' | '60' | '90';

type Props = {
  script?: NightScript;
  state?: TonightStateId;
  voices: readonly Track[];
  backgrounds: readonly Track[];
  presets: readonly NightOneBackgroundPreset[];
  profileId?: string;
  onSkip: () => void;
  onComplete?: () => void;
  onStillAwake: () => void;
  onBackToMap?: () => void;
  stillAwakeContent?: React.ReactNode;
};

const DEFAULT_BACKGROUND_VOLUME = 0.18;

type PhaseName = 'inhale' | 'hold' | 'exhale' | 'rest';

interface BreathingPhase {
  name: PhaseName;
  label: string;
  sublabel: string;
  duration: number;
}

const PATTERN_PHASES: Record<string, BreathingPhase[]> = {
  '5-5': [
    { name: 'inhale', label: 'INHALE', sublabel: 'Breathe in slowly through nose', duration: 5 },
    { name: 'exhale', label: 'EXHALE', sublabel: 'Breathe out slowly and relax', duration: 5 },
  ],
  '4-7-8': [
    { name: 'inhale', label: 'INHALE', sublabel: 'Breathe in quietly through nose', duration: 4 },
    { name: 'hold', label: 'HOLD', sublabel: 'Hold breath softly, relax shoulders', duration: 7 },
    { name: 'exhale', label: 'EXHALE', sublabel: 'Whoosh out gently through mouth', duration: 8 },
  ],
  '4-4-4-4': [
    { name: 'inhale', label: 'INHALE', sublabel: 'Breathe in steadily', duration: 4 },
    { name: 'hold', label: 'HOLD', sublabel: 'Hold with lungs full', duration: 4 },
    { name: 'exhale', label: 'EXHALE', sublabel: 'Release breath steadily', duration: 4 },
    { name: 'rest', label: 'REST', sublabel: 'Rest with lungs empty', duration: 4 },
  ],
  '4-2-6': [
    { name: 'inhale', label: 'INHALE', sublabel: 'Breathe in smoothly', duration: 4 },
    { name: 'hold', label: 'PAUSE', sublabel: 'Brief gentle pause', duration: 2 },
    { name: 'exhale', label: 'EXHALE', sublabel: 'Long, slow calming exhale', duration: 6 },
  ],
};

function VisualBreathingPacer({
  pattern = '5-5',
  isPlaying,
  stage,
  stageName,
}: {
  pattern?: string;
  isPlaying: boolean;
  stage: SleepJourneyStageId;
  stageName: string;
}) {
  const [elapsed, setElapsed] = useState(0);
  const phases = PATTERN_PHASES[pattern] || PATTERN_PHASES['5-5'];
  const totalDuration = phases.reduce((acc, p) => acc + p.duration, 0);

  useEffect(() => {
    if (!isPlaying) {
      setElapsed(0);
      return;
    }
    const startMs = Date.now() - elapsed * 1000;
    const interval = window.setInterval(() => {
      setElapsed((Date.now() - startMs) / 1000);
    }, 80);
    return () => clearInterval(interval);
  }, [isPlaying, pattern]);

  const cycleSeconds = elapsed % totalDuration;
  let accumulated = 0;
  let currentPhase = phases[0];
  let phaseSeconds = 0;
  for (const p of phases) {
    if (cycleSeconds < accumulated + p.duration) {
      currentPhase = p;
      phaseSeconds = cycleSeconds - accumulated;
      break;
    }
    accumulated += p.duration;
  }

  const secondsLeft = isPlaying ? Math.max(1, Math.ceil(currentPhase.duration - phaseSeconds)) : currentPhase.duration;
  const progress = isPlaying ? Math.min(1, Math.max(0, phaseSeconds / currentPhase.duration)) : 0;

  let scale = 1.0;
  if (!isPlaying) {
    scale = 1.0;
  } else if (stage === 'intro' || stage === 'guided') {
    if (currentPhase.name === 'inhale') {
      scale = 0.86 + 0.34 * (1 - Math.cos(progress * Math.PI)) / 2;
    } else if (currentPhase.name === 'hold') {
      scale = 1.20 + 0.015 * Math.sin(progress * Math.PI * 2);
    } else if (currentPhase.name === 'exhale') {
      scale = 1.20 - 0.34 * (1 - Math.cos(progress * Math.PI)) / 2;
    } else {
      scale = 0.86;
    }
  } else {
    // Gentle hypnotic slow pulse for theta, pivot, delta, cocoon
    scale = 0.95 + 0.08 * Math.sin((elapsed * Math.PI) / 4);
  }

  const isHold = currentPhase.name === 'hold' || currentPhase.name === 'rest';
  const isExhale = currentPhase.name === 'exhale';

  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = isPlaying ? circumference * (1 - progress) : circumference;

  return (
    <div className="relative overflow-hidden rounded-xl border border-teal-900/60 bg-gradient-to-b from-[#09101f] to-[#060812] px-3 py-3 shadow-inner">
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-1000"
        style={{
          background:
            stage === 'theta_drift'
              ? 'radial-gradient(circle at 50% 50%, rgba(245,158,11,0.08) 0%, transparent 70%)'
              : stage === 'cognitive_pivot'
              ? 'radial-gradient(circle at 50% 50%, rgba(168,85,247,0.12) 0%, transparent 70%)'
              : stage === 'delta_immersion'
              ? 'radial-gradient(circle at 50% 50%, rgba(59,130,246,0.10) 0%, transparent 70%)'
              : stage === 'sleep_cocoon'
              ? 'radial-gradient(circle at 50% 50%, rgba(20,184,166,0.08) 0%, transparent 70%)'
              : isHold
              ? 'radial-gradient(circle at 50% 50%, rgba(129,140,248,0.12) 0%, transparent 70%)'
              : isExhale
              ? 'radial-gradient(circle at 50% 50%, rgba(56,189,248,0.1) 0%, transparent 70%)'
              : 'radial-gradient(circle at 50% 50%, rgba(45,212,191,0.12) 0%, transparent 70%)',
        }}
      />

      <div className="relative flex items-center justify-between text-[11px] text-slate-400">
        <span className="flex items-center gap-1 font-semibold text-teal-300">
          <Sparkles className="h-3 w-3" />
          <span>Visual Sleep Guide</span>
        </span>
        <span className="rounded bg-[#0c1222] border border-teal-900/70 px-2 py-0.5 text-[10px] font-mono font-medium text-slate-300">
          {stage === 'theta_drift'
            ? 'Stage 2: 432Hz Waves'
            : stage === 'cognitive_pivot'
            ? 'Stage 3: Cognitive Pivot'
            : stage === 'delta_immersion'
            ? 'Stage 4: 1.8Hz Deep Delta'
            : stage === 'sleep_cocoon'
            ? 'Stage 5: Sleep Cocoon'
            : `Pattern: ${pattern}`}
        </span>
      </div>

      <div className="relative my-2 flex items-center justify-center">
        <div className="relative h-28 w-28 flex items-center justify-center">
          <svg className="absolute inset-0 h-full w-full -rotate-90">
            <circle
              cx="56"
              cy="56"
              r={radius}
              fill="none"
              stroke="#1e293b"
              strokeWidth="3.5"
              className="opacity-50"
            />
            <circle
              cx="56"
              cy="56"
              r={radius}
              fill="none"
              stroke={
                stage === 'theta_drift'
                  ? '#f59e0b'
                  : stage === 'cognitive_pivot'
                  ? '#a855f7'
                  : stage === 'delta_immersion'
                  ? '#3b82f6'
                  : stage === 'sleep_cocoon'
                  ? '#14b8a6'
                  : isHold
                  ? '#818cf8'
                  : isExhale
                  ? '#38bdf8'
                  : '#2dd4bf'
              }
              strokeWidth="3.5"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-150"
            />
          </svg>

          <div
            className={`relative flex h-20 w-20 flex-col items-center justify-center rounded-full border transition-transform duration-150 ${
              stage === 'theta_drift'
                ? 'border-amber-400/40 bg-gradient-to-br from-amber-500/20 to-amber-950/40 shadow-[0_0_25px_rgba(245,158,11,0.25)]'
                : stage === 'cognitive_pivot'
                ? 'border-purple-400/40 bg-gradient-to-br from-purple-500/20 to-indigo-950/40 shadow-[0_0_25px_rgba(168,85,247,0.25)]'
                : stage === 'delta_immersion'
                ? 'border-blue-400/40 bg-gradient-to-br from-blue-500/20 to-slate-950/40 shadow-[0_0_25px_rgba(59,130,246,0.25)]'
                : stage === 'sleep_cocoon'
                ? 'border-teal-400/40 bg-gradient-to-br from-teal-500/20 to-emerald-950/40 shadow-[0_0_25px_rgba(20,184,166,0.25)]'
                : isHold
                ? 'border-indigo-400/40 bg-gradient-to-br from-indigo-500/20 to-purple-950/40 shadow-[0_0_25px_rgba(129,140,248,0.25)]'
                : isExhale
                ? 'border-sky-400/40 bg-gradient-to-br from-sky-500/20 to-blue-950/40 shadow-[0_0_25px_rgba(56,189,248,0.25)]'
                : 'border-teal-400/40 bg-gradient-to-br from-teal-500/20 to-emerald-950/40 shadow-[0_0_25px_rgba(45,212,191,0.25)]'
            }`}
            style={{ transform: `scale(${scale})` }}
          >
            {stage === 'theta_drift' ? (
              <div className="flex flex-col items-center justify-center">
                <div className="flex items-center gap-1 my-0.5">
                  <span className="w-1 h-3 rounded-full bg-amber-400 animate-pulse" />
                  <span className="w-1 h-5 rounded-full bg-amber-300 animate-pulse [animation-delay:150ms]" />
                  <span className="w-1 h-4 rounded-full bg-amber-400 animate-pulse [animation-delay:300ms]" />
                </div>
                <span className="text-[10px] font-bold text-amber-200">432Hz</span>
              </div>
            ) : stage === 'cognitive_pivot' ? (
              <div className="flex flex-col items-center justify-center text-center px-1">
                <Moon className="h-4 w-4 text-purple-300 animate-pulse" />
                <span className="text-[9px] font-bold text-purple-200 mt-0.5">Whisper</span>
              </div>
            ) : stage === 'delta_immersion' ? (
              <div className="flex flex-col items-center justify-center">
                <Waves className="h-4 w-4 text-blue-300 animate-pulse" />
                <span className="text-[9px] font-bold text-blue-200 mt-0.5">1.8Hz Delta</span>
              </div>
            ) : stage === 'sleep_cocoon' ? (
              <div className="flex flex-col items-center justify-center">
                <span className="text-base">🌙</span>
                <span className="text-[9px] font-bold text-teal-200">Cocoon</span>
              </div>
            ) : (
              <>
                <span
                  className={`text-[9px] font-extrabold tracking-widest ${
                    isHold ? 'text-indigo-200' : isExhale ? 'text-sky-200' : 'text-teal-200'
                  }`}
                >
                  {isPlaying ? currentPhase.label : 'READY'}
                </span>
                <span className="font-mono text-xl font-black text-white">
                  {isPlaying ? secondsLeft : currentPhase.duration}
                </span>
                <span className="text-[9px] font-medium text-slate-400">sec</span>
              </>
            )}
          </div>
        </div>
      </div>

      <p className="relative text-center text-xs font-medium text-slate-300">
        {stage === 'theta_drift'
          ? '432Hz theta sleep waves looping. Rest comfortably.'
          : stage === 'cognitive_pivot'
          ? 'Quiet cognitive whisper playing — releasing sleep effort.'
          : stage === 'delta_immersion'
          ? '1.8Hz deep delta waves & velvet brown noise entrainment.'
          : stage === 'sleep_cocoon'
          ? 'Continuous sleep cocoon protecting rest through the night.'
          : isPlaying
          ? currentPhase.sublabel
          : 'Press "Start listening" below — progression will transition automatically.'}
      </p>
    </div>
  );
}

export function NightAudioPlayer({
  script,
  state,
  voices,
  backgrounds,
  presets,
  profileId,
  onSkip,
  onComplete,
  onStillAwake,
  stillAwakeContent,
}: Props) {
  const introRef = useRef<HTMLAudioElement>(null);
  const voiceRef = useRef<HTMLAudioElement>(null);
  const pacerRef = useRef<HTMLAudioElement>(null);
  const pivotRef = useRef<HTMLAudioElement>(null);
  const deltaRef = useRef<HTMLAudioElement>(null);
  const cocoonRef = useRef<HTMLAudioElement>(null);
  const backgroundRefs = useRef<Record<string, HTMLAudioElement | null>>({});

  const fadeTimerRef = useRef<number | undefined>(undefined);
  const accumulatorRef = useRef<ListeningAccumulator | null>(null);
  const isPlayingRef = useRef(false);
  const prevStateRef = useRef(state);

  const [guideVoice, setGuideVoice] = useState<GuideVoiceOption>('female_whisper');
  const introTrack = selectNightOneIntro(state, guideVoice);
  const fallbackVoices = Object.values(NIGHT_ONE_VOICES);
  const effectiveVoices = voices.length > 0 ? voices : fallbackVoices;
  const pivotTrack = selectCognitivePivotTrack(state, guideVoice);

  const [guidedOn, setGuidedOn] = useState(true);
  const [showVisualPacer, setShowVisualPacer] = useState(true);
  const [playStage, setPlayStage] = useState<SleepJourneyStageId>('intro');
  const [voiceId, setVoiceId] = useState(effectiveVoices[0]?.asset_id || 'night1-guided-coherent-5-5');
  const [backgroundIds, setBackgroundIds] = useState<string[]>(presets[0]?.asset_ids || (backgrounds[0] ? [backgrounds[0].asset_id] : []));
  const [voiceVolume, setVoiceVolume] = useState(1);
  const [backgroundVolume, setBackgroundVolume] = useState(DEFAULT_BACKGROUND_VOLUME);
  const [timer, setTimer] = useState<SleepTimer>('60');
  const [deadline, setDeadline] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);

  // Keep voiceId valid when effectiveVoices loads or changes
  useEffect(() => {
    if (!effectiveVoices.some(v => v.asset_id === voiceId)) {
      if (effectiveVoices[0]) setVoiceId(effectiveVoices[0].asset_id);
    }
  }, [effectiveVoices, voiceId]);

  const selectedVoice = effectiveVoices.find(track => track.asset_id === voiceId) || effectiveVoices[0];
  const voicePath = selectedVoice ? getNightOneVoicePath(selectedVoice as any, guideVoice) : '';
  const selectedBackgrounds = backgrounds.filter(track => backgroundIds.includes(track.asset_id));
  const hasSelection = (guidedOn && !!selectedVoice) || selectedBackgrounds.length > 0;

  const stopAll = useCallback(() => {
    isPlayingRef.current = false;
    if (fadeTimerRef.current) window.clearInterval(fadeTimerRef.current);
    fadeTimerRef.current = undefined;

    [introRef, voiceRef, pacerRef, pivotRef, deltaRef, cocoonRef].forEach(ref => {
      ref.current?.pause();
      if (ref.current) ref.current.currentTime = 0;
    });

    Object.values(backgroundRefs.current).forEach(audio => {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    });

    setPlaying(false);
    setDeadline(null);
    setPlayStage('intro');
    accumulatorRef.current?.stop();
  }, []);

  // Stop audio immediately when tonight state changes
  useEffect(() => {
    if (prevStateRef.current !== state) {
      prevStateRef.current = state;
      stopAll();
    }
  }, [state, stopAll]);

  // Initialize listening accumulator
  useEffect(() => {
    const playbackSessionId = createPlaybackSessionId();
    accumulatorRef.current = new ListeningAccumulator(
      playbackSessionId,
      profileId,
      selectedVoice?.duration_seconds || 0
    );
    return () => {
      accumulatorRef.current?.stop();
    };
  }, [profileId, selectedVoice?.asset_id, selectedVoice?.duration_seconds]);

  const fadeAndStopBackground = useCallback(() => {
    const audios = selectedBackgrounds.map(track => backgroundRefs.current[track.asset_id]).filter((audio): audio is HTMLAudioElement => Boolean(audio));
    if (!audios.length) return;
    if (fadeTimerRef.current) window.clearInterval(fadeTimerRef.current);
    const starts = audios.map(audio => audio.volume);
    let step = 0;
    fadeTimerRef.current = window.setInterval(() => {
      step += 1;
      audios.forEach((audio, index) => { audio.volume = Math.max(0, starts[index] * (1 - step / 10)); });
      if (step >= 10) {
        window.clearInterval(fadeTimerRef.current);
        fadeTimerRef.current = undefined;
        audios.forEach(audio => { audio.pause(); audio.currentTime = 0; audio.volume = backgroundVolume; });
      }
    }, 200);
  }, [backgroundVolume, selectedBackgrounds]);

  const stopAtDeadline = useCallback(() => {
    isPlayingRef.current = false;
    [introRef, voiceRef, pacerRef, pivotRef, deltaRef, cocoonRef].forEach(ref => {
      ref.current?.pause();
      if (ref.current) ref.current.currentTime = 0;
    });
    fadeAndStopBackground();
    setPlaying(false);
    setPlayStage('intro');
    accumulatorRef.current?.stop();
  }, [fadeAndStopBackground]);

  const pauseAll = useCallback(() => {
    isPlayingRef.current = false;
    [introRef, voiceRef, pacerRef, pivotRef, deltaRef, cocoonRef].forEach(ref => {
      ref.current?.pause();
    });
    Object.values(backgroundRefs.current).forEach(audio => audio?.pause());
    setPlaying(false);
    accumulatorRef.current?.pause();
  }, []);

  // Automatic progression pipeline:
  // Stage 1 (Intro) -> Stage 1B (Guided Voice) -> Stage 2 (432Hz Theta Drift) -> Stage 3 (Cognitive Pivot) -> Stage 4 (Delta Immersion) -> Stage 5 (Sleep Cocoon)
  const advanceToStage = async (nextStage: SleepJourneyStageId) => {
    if (!isPlayingRef.current) return;
    setPlayStage(nextStage);

    let nextAudio: HTMLAudioElement | null = null;
    if (nextStage === 'guided') nextAudio = voiceRef.current;
    else if (nextStage === 'theta_drift') nextAudio = pacerRef.current;
    else if (nextStage === 'cognitive_pivot') nextAudio = pivotRef.current;
    else if (nextStage === 'delta_immersion') nextAudio = deltaRef.current;
    else if (nextStage === 'sleep_cocoon') nextAudio = cocoonRef.current;

    if (nextAudio && guidedOn) {
      try {
        await nextAudio.play();
      } catch {
        setError(`Could not transition smoothly to ${nextStage}.`);
      }
    }
  };

  const playSpecificStage = async (targetStage: SleepJourneyStageId) => {
    [introRef, voiceRef, pacerRef, pivotRef, deltaRef, cocoonRef].forEach(ref => {
      ref.current?.pause();
      if (ref.current) ref.current.currentTime = 0;
    });

    setPlayStage(targetStage);
    setGuidedOn(true);
    setError('');

    const elements: HTMLAudioElement[] = [];
    if (targetStage === 'intro' && introRef.current) elements.push(introRef.current);
    else if (targetStage === 'guided' && voiceRef.current) elements.push(voiceRef.current);
    else if (targetStage === 'theta_drift' && pacerRef.current) elements.push(pacerRef.current);
    else if (targetStage === 'cognitive_pivot' && pivotRef.current) elements.push(pivotRef.current);
    else if (targetStage === 'delta_immersion' && deltaRef.current) elements.push(deltaRef.current);
    else if (targetStage === 'sleep_cocoon' && cocoonRef.current) elements.push(cocoonRef.current);

    selectedBackgrounds.forEach(track => {
      const audio = backgroundRefs.current[track.asset_id];
      if (audio) elements.push(audio);
    });

    try {
      await Promise.all(elements.map(el => el.play()));
      isPlayingRef.current = true;
      setPlaying(true);
      setDeadline(current => current || (timer === 'until_voice' ? null : Date.now() + Number(timer) * 60_000));
      accumulatorRef.current?.start();
    } catch {
      isPlayingRef.current = false;
      pauseAll();
      setError('Audio could not be started. Check connection and try again.');
    }
  };

  const start = async () => {
    if (!hasSelection) {
      setError('Choose guided practice or a background sound before starting.');
      return;
    }
    setError('');
    if (deadline && Date.now() >= deadline) {
      stopAtDeadline();
      setDeadline(null);
      return;
    }

    const elements: HTMLAudioElement[] = [];
    if (guidedOn) {
      if (playStage === 'intro') {
        if (introRef.current) elements.push(introRef.current);
        else if (voiceRef.current) elements.push(voiceRef.current);
      } else if (playStage === 'guided' && voiceRef.current) {
        elements.push(voiceRef.current);
      } else if (playStage === 'theta_drift' && pacerRef.current) {
        elements.push(pacerRef.current);
      } else if (playStage === 'cognitive_pivot' && pivotRef.current) {
        elements.push(pivotRef.current);
      } else if (playStage === 'delta_immersion' && deltaRef.current) {
        elements.push(deltaRef.current);
      } else if (playStage === 'sleep_cocoon' && cocoonRef.current) {
        elements.push(cocoonRef.current);
      }
    }

    selectedBackgrounds.forEach(track => {
      const audio = backgroundRefs.current[track.asset_id];
      if (audio) elements.push(audio);
    });

    try {
      await Promise.all(elements.map(element => element.play()));
      isPlayingRef.current = true;
      setPlaying(true);
      setDeadline(current => current || (timer === 'until_voice' ? null : Date.now() + Number(timer) * 60_000));
      accumulatorRef.current?.start();
    } catch {
      isPlayingRef.current = false;
      pauseAll();
      setError('Audio could not be started. Check connection and try again.');
    }
  };

  // Tracking loop while playing
  useEffect(() => {
    if (!playing) return;
    const interval = window.setInterval(() => {
      const isIntro = Boolean(guidedOn && playStage === 'intro' && introRef.current && !introRef.current.paused);
      const isVoice = Boolean(guidedOn && playStage === 'guided' && voiceRef.current && !voiceRef.current.paused);
      const isPacer = Boolean(guidedOn && playStage === 'theta_drift' && pacerRef.current && !pacerRef.current.paused);
      const isBg = selectedBackgrounds.some(b => !backgroundRefs.current[b.asset_id]?.paused);
      const voiceTime = voiceRef.current?.currentTime || 0;
      accumulatorRef.current?.updateState(isVoice, isBg, voiceTime, isIntro, isPacer);
    }, 500);
    return () => clearInterval(interval);
  }, [playing, guidedOn, playStage, selectedBackgrounds]);

  // Volume sync across all primary tracks
  useEffect(() => {
    [introRef, voiceRef, pacerRef, pivotRef, deltaRef, cocoonRef].forEach(ref => {
      if (ref.current) ref.current.volume = voiceVolume;
    });
    Object.values(backgroundRefs.current).forEach(audio => {
      if (audio) audio.volume = backgroundVolume;
    });
  }, [voiceVolume, backgroundVolume, retry, selectedVoice?.asset_id, backgroundIds]);

  useEffect(() => {
    if (!deadline) return;
    const checkDeadline = () => {
      if (Date.now() >= deadline) {
        stopAtDeadline();
        setDeadline(null);
      }
    };
    const interval = window.setInterval(checkDeadline, 1000);
    document.addEventListener('visibilitychange', checkDeadline);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', checkDeadline);
    };
  }, [deadline, stopAtDeadline]);

  useEffect(() => () => stopAll(), [stopAll]);

  const presetIsActive = (preset: NightOneBackgroundPreset) =>
    preset.asset_ids.length === backgroundIds.length && preset.asset_ids.every(id => backgroundIds.includes(id));

  const togglePreset = (preset: NightOneBackgroundPreset) => {
    pauseAll();
    setBackgroundIds(presetIsActive(preset) ? [] : preset.asset_ids);
    setError('');
  };

  const handleSkip = () => {
    stopAll();
    onSkip();
  };

  const handleComplete = () => {
    stopAll();
    if (onComplete) onComplete();
    else onSkip();
  };

  const handleStillAwake = () => {
    pauseAll();
    onStillAwake();
  };

  const currentStageInfo = SLEEP_JOURNEY_STAGES.find(s => s.id === playStage) || SLEEP_JOURNEY_STAGES[0];

  return (
    <div className="rounded-2xl border border-teal-900/60 bg-[#080b15] p-3.5 sm:p-4">
      {/* Top Banner with Visual Guide Toggle */}
      <div className="flex items-center justify-between rounded-xl border border-teal-900/70 bg-teal-950/30 px-3 py-2 text-xs">
        <div>
          <p className="font-semibold text-teal-200">
            60-Minute Progressive Sleep Engine
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Transitions automatically from breath to theta, cognitive pivot, delta, and sleep cocoon.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowVisualPacer(v => !v)}
          className="ml-2 shrink-0 inline-flex items-center gap-1 rounded-md border border-teal-800 bg-teal-900/50 px-2 py-1 text-[10px] font-semibold text-teal-200 hover:bg-teal-800/60"
        >
          {showVisualPacer ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
          <span>{showVisualPacer ? 'Hide video' : 'Show video'}</span>
        </button>
      </div>

      {/* Visual Sleep / Breathing Guide */}
      {showVisualPacer && (
        <div className="mt-2.5">
          <VisualBreathingPacer
            pattern={selectedVoice?.pacer_pattern || '5-5'}
            isPlaying={playing}
            stage={playStage}
            stageName={currentStageInfo.name_en}
          />
        </div>
      )}

      {/* 60-Minute Progressive Sleep Timeline Bar */}
      <div className="mt-3 rounded-xl border border-teal-900/60 bg-[#060a14] p-2.5">
        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-teal-300 mb-1.5">
          <span>60-Min Automated Progression</span>
          <span className="text-slate-400 font-mono">
            {playStage === 'sleep_cocoon' ? '55:00+' : currentStageInfo.timeRange}
          </span>
        </div>

        {/* Stage Progress Pills */}
        <div className="grid grid-cols-5 gap-1 text-[9px] font-semibold text-center">
          <button
            type="button"
            onClick={() => void playSpecificStage('intro')}
            className={`rounded py-1 px-0.5 border transition truncate ${
              playStage === 'intro' || playStage === 'guided'
                ? 'border-teal-400 bg-teal-950/60 text-teal-200 shadow-[0_0_10px_rgba(45,212,191,0.2)]'
                : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:text-white'
            }`}
          >
            1. Breath
          </button>
          <button
            type="button"
            onClick={() => void playSpecificStage('theta_drift')}
            className={`rounded py-1 px-0.5 border transition truncate ${
              playStage === 'theta_drift'
                ? 'border-amber-400 bg-amber-950/60 text-amber-200 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:text-white'
            }`}
          >
            2. 432Hz
          </button>
          <button
            type="button"
            onClick={() => void playSpecificStage('cognitive_pivot')}
            className={`rounded py-1 px-0.5 border transition truncate ${
              playStage === 'cognitive_pivot'
                ? 'border-purple-400 bg-purple-950/60 text-purple-200 shadow-[0_0_10px_rgba(168,85,247,0.2)]'
                : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:text-white'
            }`}
          >
            3. Pivot
          </button>
          <button
            type="button"
            onClick={() => void playSpecificStage('delta_immersion')}
            className={`rounded py-1 px-0.5 border transition truncate ${
              playStage === 'delta_immersion'
                ? 'border-blue-400 bg-blue-950/60 text-blue-200 shadow-[0_0_10px_rgba(59,130,246,0.2)]'
                : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:text-white'
            }`}
          >
            4. Delta
          </button>
          <button
            type="button"
            onClick={() => void playSpecificStage('sleep_cocoon')}
            className={`rounded py-1 px-0.5 border transition truncate ${
              playStage === 'sleep_cocoon'
                ? 'border-teal-400 bg-teal-950/60 text-teal-200 shadow-[0_0_10px_rgba(20,184,166,0.2)]'
                : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:text-white'
            }`}
          >
            5. Cocoon
          </button>
        </div>

        <p className="mt-1.5 text-[10px] text-slate-400 truncate">
          Active: <span className="font-semibold text-slate-200">{currentStageInfo.name_en}</span> · {currentStageInfo.description_en}
        </p>
      </div>

      {/* Main Guided Practice & Voice Options */}
      <div className="mt-3 space-y-2.5">
        <div className="rounded-xl border border-indigo-800/70 p-2.5 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div>
              <span className="text-xs font-bold text-white block">
                Guided Somatic Practice (0–10 min)
              </span>
              <span className="text-[11px] text-slate-400">
                Paced breathing rhythm for nervous system deceleration
              </span>
            </div>
            <input
              aria-label="Guided voice practice"
              type="checkbox"
              checked={guidedOn}
              onChange={event => {
                pauseAll();
                setGuidedOn(event.target.checked);
              }}
              className="h-4 w-4 rounded border-indigo-700 bg-slate-900 text-teal-400 focus:ring-teal-400"
            />
          </div>

          {/* Guide Voice Selector (Cloned from calm_thien) */}
          <div className="rounded-lg border border-purple-900/60 bg-purple-950/20 p-2 text-xs space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-purple-200 text-[11px] flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 text-purple-400" />
                <span>Giọng dẫn (VietVoiceStudio Clone)</span>
              </span>
              <span className="text-[10px] text-purple-300 font-medium">
                {guideVoice === 'female_whisper' ? '🌸 Nữ thì thầm' : '🌿 Nam trầm ấm'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  pauseAll();
                  setGuideVoice('female_whisper');
                }}
                className={`flex flex-col text-left rounded-lg p-2 border transition ${
                  guideVoice === 'female_whisper'
                    ? 'border-purple-400 bg-purple-900/50 text-purple-100 ring-1 ring-purple-400/60 shadow-[0_0_10px_rgba(168,85,247,0.25)]'
                    : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-[11px] text-white">
                  <span>🌸</span>
                  <span>Nữ thì thầm</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                  Bedtime Whisper · Êm dịu ru ngủ
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  pauseAll();
                  setGuideVoice('male_calm');
                }}
                className={`flex flex-col text-left rounded-lg p-2 border transition ${
                  guideVoice === 'male_calm'
                    ? 'border-teal-400 bg-teal-900/50 text-teal-100 ring-1 ring-teal-400/60 shadow-[0_0_10px_rgba(45,212,191,0.25)]'
                    : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-[11px] text-white">
                  <span>🌿</span>
                  <span>Nam trầm ấm</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                  Calm Meditation · Tĩnh lặng vững chãi
                </span>
              </button>
            </div>
          </div>

          {/* Voice Selector */}
          <div className="rounded-lg border border-indigo-900/60 bg-indigo-950/20 p-2 text-xs space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-indigo-200 text-[11px]">
                Kỹ thuật thở (Breathing Technique)
              </span>
              <span className="rounded bg-[#0c1222] px-1.5 py-0.5 text-[10px] font-semibold text-indigo-300 border border-indigo-800">
                {selectedVoice?.pacer_pattern || '5-5'}
              </span>
            </div>
            <select
              value={voiceId}
              onChange={event => {
                pauseAll();
                setVoiceId(event.target.value);
              }}
              className="w-full rounded-md border border-indigo-800 bg-[#0c1222] px-2.5 py-1 text-xs text-white"
            >
              {effectiveVoices.map(voice => (
                <option key={voice.asset_id} value={voice.asset_id}>{voice.label}</option>
              ))}
            </select>
          </div>

          {/* Active Stage Detail Card */}
          <div className="rounded-lg border border-purple-900/60 bg-purple-950/20 p-2 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-purple-200 text-[11px] flex items-center gap-1">
                <Moon className="h-3 w-3 text-purple-400" />
                <span>Stage 3 Cognitive Pivot (Min 25–40)</span>
              </span>
              <span className="rounded bg-[#0c1222] px-1.5 py-0.5 text-[10px] font-semibold text-purple-300 border border-purple-900">
                Auto-engages
              </span>
            </div>
            <p className="mt-0.5 text-[11px] text-slate-300">
              {pivotTrack.title_en}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {pivotTrack.subtitle_en}
            </p>
          </div>

          {/* Volume sliders */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <label className="block text-[11px] text-slate-400">
              <span>Guidance & Waves</span>
              <input
                aria-label="Guidance volume"
                type="range"
                min="0"
                max="100"
                value={Math.round(voiceVolume * 100)}
                onChange={event => setVoiceVolume(Number(event.target.value) / 100)}
                className="mt-1 w-full"
              />
            </label>
            {selectedBackgrounds.length > 0 && (
              <label className="block text-[11px] text-slate-400">
                <span>Background volume</span>
                <input
                  aria-label="Background volume"
                  type="range"
                  min="0"
                  max="100"
                  value={Math.round(backgroundVolume * 100)}
                  onChange={event => setBackgroundVolume(Number(event.target.value) / 100)}
                  className="mt-1 w-full"
                />
              </label>
            )}
          </div>
        </div>

        {/* Ambient Sound & Timer Section */}
        <div className="rounded-xl border border-indigo-800/70 p-2.5 space-y-2">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="font-bold text-white text-[11px]">Background sound:</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400">Timer:</span>
              <select
                value={timer}
                onChange={event => {
                  pauseAll();
                  setTimer(event.target.value as SleepTimer);
                }}
                className="rounded-md border border-indigo-800 bg-[#0c1222] px-2 py-0.5 text-[11px] text-white"
              >
                <option value="60">60 minutes (Full Journey)</option>
                <option value="90">90 minutes (Full Sleep Cycle)</option>
                <option value="30">30 minutes</option>
                <option value="15">15 minutes</option>
                <option value="until_voice" disabled={!selectedVoice}>Stop with guided voice</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => {
                pauseAll();
                setBackgroundIds([]);
              }}
              className={`px-2 py-1 rounded-md text-[11px] font-medium border transition ${
                backgroundIds.length === 0
                  ? 'border-teal-300 bg-teal-300/20 text-teal-200'
                  : 'border-indigo-800 bg-[#0c1222] text-slate-400 hover:text-white'
              }`}
            >
              No background
            </button>
            {presets.map(preset => (
              <button
                key={preset.id}
                type="button"
                onClick={() => togglePreset(preset)}
                className={`px-2 py-1 rounded-md text-[11px] font-medium border transition ${
                  presetIsActive(preset)
                    ? 'border-teal-300 bg-teal-300/20 text-teal-200'
                    : 'border-indigo-800 bg-[#0c1222] text-slate-300 hover:text-white'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Audio tags for the entire 60-minute automated pipeline */}
      <audio
        ref={introRef}
        key={`intro-${introTrack.asset_id}-${guideVoice}-${retry}`}
        src={introTrack.local_path}
        preload="metadata"
        onEnded={() => void advanceToStage('guided')}
        onError={() => setError('The introductory audio could not be loaded.')}
      />
      <audio
        ref={voiceRef}
        key={`voice-${voiceId}-${guideVoice}-${retry}`}
        src={voicePath}
        preload="metadata"
        loop={false}
        onEnded={() => void advanceToStage('theta_drift')}
        onError={() => setError('The guided audio could not be loaded.')}
      />
      <audio
        ref={pacerRef}
        key={`theta-${voiceId}-${retry}`}
        src={selectedVoice?.pacer_path}
        preload="metadata"
        loop={false}
        onEnded={() => void advanceToStage('cognitive_pivot')}
        onError={() => setError('The 432Hz sleep frequency audio could not be loaded.')}
      />
      <audio
        ref={pivotRef}
        key={`pivot-${pivotTrack.asset_id}-${guideVoice}-${retry}`}
        src={pivotTrack.local_path}
        preload="metadata"
        loop={false}
        onEnded={() => void advanceToStage('delta_immersion')}
        onError={() => setError('The cognitive pivot audio could not be loaded.')}
      />
      <audio
        ref={deltaRef}
        key={`delta-${retry}`}
        src={DEEP_DELTA_TRACK.local_path}
        preload="metadata"
        loop={false}
        onEnded={() => void advanceToStage('sleep_cocoon')}
        onError={() => setError('The deep delta audio could not be loaded.')}
      />
      <audio
        ref={cocoonRef}
        key={`cocoon-${retry}`}
        src={SLEEP_COCOON_TRACK.local_path}
        preload="metadata"
        loop={timer !== 'until_voice'}
        onError={() => setError('The sleep cocoon audio could not be loaded.')}
      />
      {selectedBackgrounds.map(background => (
        <audio
          key={`${background.asset_id}-${retry}`}
          ref={element => { backgroundRefs.current[background.asset_id] = element; }}
          src={background.local_path}
          preload="metadata"
          loop
          onError={() => setError('The background audio could not be loaded.')}
        />
      ))}

      {error && (
        <p className="mt-3 rounded-lg border border-rose-800/60 bg-rose-950/30 p-2.5 text-xs text-rose-200">
          <span>{error}</span>
          <button type="button" onClick={() => { setError(''); setRetry(value => value + 1); }} className="ml-2 underline font-semibold">
            Retry
          </button>
        </p>
      )}

      {/* Main play controls */}
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          disabled={!hasSelection}
          onClick={() => void (playing ? pauseAll() : start())}
          className="companion-button flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50 py-2.5 text-xs font-bold"
        >
          {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          <span>{playing ? 'Pause' : 'Start 60-min sleep journey'}</span>
        </button>
        <button
          type="button"
          onClick={stopAll}
          className="rounded-xl border border-indigo-800 px-4 py-2 text-xs font-bold text-indigo-200 hover:bg-indigo-900/30"
        >
          <Square className="mr-1.5 inline h-3 w-3" />
          <span>Stop listening</span>
        </button>
      </div>

      {/* Complete button */}
      <button
        type="button"
        onClick={handleComplete}
        className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl bg-teal-950/60 border border-teal-500/50 px-4 py-2 text-xs font-bold text-teal-200 hover:bg-teal-900/40"
      >
        <Check className="h-3.5 w-3.5 text-teal-300" />
        <span>Finished listening — ready to rest</span>
      </button>

      <div className="mt-2 flex items-center justify-between text-xs text-slate-400 px-1">
        <button
          type="button"
          onClick={handleStillAwake}
          className="font-medium text-indigo-300 underline underline-offset-4 text-[11px]"
        >
          I’m still awake
        </button>
        <button
          type="button"
          onClick={handleSkip}
          className="text-slate-400 hover:text-white text-[11px]"
        >
          Skip this audio
        </button>
      </div>

      {stillAwakeContent}
    </div>
  );
}
