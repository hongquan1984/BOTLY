'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Check,
  Eye,
  EyeOff,
  FastForward,
  Pause,
  Play,
  Radio,
  Sparkles,
  Square,
} from 'lucide-react';
import {
  type NightOneBackgroundPreset,
  type NightScript,
  selectNightOneIntro,
  NIGHT_ONE_VOICES,
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
type SleepTimer = 'until_voice' | '15' | '30' | '60';

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
}: {
  pattern?: string;
  isPlaying: boolean;
  stage: 'intro' | 'guided' | 'pacer';
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
  } else if (currentPhase.name === 'inhale') {
    scale = 0.86 + 0.34 * (1 - Math.cos(progress * Math.PI)) / 2;
  } else if (currentPhase.name === 'hold') {
    scale = 1.20 + 0.015 * Math.sin(progress * Math.PI * 2);
  } else if (currentPhase.name === 'exhale') {
    scale = 1.20 - 0.34 * (1 - Math.cos(progress * Math.PI)) / 2;
  } else {
    scale = 0.86;
  }

  const isHold = currentPhase.name === 'hold' || currentPhase.name === 'rest';
  const isExhale = currentPhase.name === 'exhale';
  const isPacerStage = stage === 'pacer';

  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = isPlaying ? circumference * (1 - progress) : circumference;

  return (
    <div className="relative overflow-hidden rounded-xl border border-teal-900/60 bg-gradient-to-b from-[#09101f] to-[#060812] px-3 py-3 shadow-inner">
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-1000"
        style={{
          background: isPacerStage
            ? 'radial-gradient(circle at 50% 50%, rgba(245,158,11,0.08) 0%, transparent 70%)'
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
          <span>Visual Breathing Guide</span>
        </span>
        <span className="rounded bg-[#0c1222] border border-teal-900/70 px-2 py-0.5 text-[10px] font-mono font-medium text-slate-300">
          {isPacerStage ? '432Hz Sound Waves' : `Pattern: ${pattern}`}
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
                isPacerStage ? '#f59e0b' : isHold ? '#818cf8' : isExhale ? '#38bdf8' : '#2dd4bf'
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
              isPacerStage
                ? 'border-amber-400/40 bg-gradient-to-br from-amber-500/20 to-amber-950/40 shadow-[0_0_25px_rgba(245,158,11,0.25)]'
                : isHold
                ? 'border-indigo-400/40 bg-gradient-to-br from-indigo-500/20 to-purple-950/40 shadow-[0_0_25px_rgba(129,140,248,0.25)]'
                : isExhale
                ? 'border-sky-400/40 bg-gradient-to-br from-sky-500/20 to-blue-950/40 shadow-[0_0_25px_rgba(56,189,248,0.25)]'
                : 'border-teal-400/40 bg-gradient-to-br from-teal-500/20 to-emerald-950/40 shadow-[0_0_25px_rgba(45,212,191,0.25)]'
            }`}
            style={{ transform: `scale(${scale})` }}
          >
            {isPacerStage ? (
              <div className="flex flex-col items-center justify-center">
                <div className="flex items-center gap-1 my-0.5">
                  <span className="w-1 h-3 rounded-full bg-amber-400 animate-pulse" />
                  <span className="w-1 h-5 rounded-full bg-amber-300 animate-pulse [animation-delay:150ms]" />
                  <span className="w-1 h-4 rounded-full bg-amber-400 animate-pulse [animation-delay:300ms]" />
                  <span className="w-1 h-2 rounded-full bg-amber-400 animate-pulse [animation-delay:450ms]" />
                </div>
                <span className="text-[10px] font-bold text-amber-200">432Hz</span>
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
        {isPacerStage
          ? '432Hz theta sleep waves looping. Rest comfortably.'
          : isPlaying
          ? currentPhase.sublabel
          : 'Press "Start listening" below to begin breathing.'}
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
  const backgroundRefs = useRef<Record<string, HTMLAudioElement | null>>({});
  const fadeTimerRef = useRef<number | undefined>(undefined);
  const accumulatorRef = useRef<ListeningAccumulator | null>(null);
  const isPlayingRef = useRef(false);
  const prevStateRef = useRef(state);

  const introTrack = selectNightOneIntro(state);
  const fallbackVoices = Object.values(NIGHT_ONE_VOICES);
  const effectiveVoices = voices.length > 0 ? voices : fallbackVoices;

  const [guidedOn, setGuidedOn] = useState(true);
  const [showVisualPacer, setShowVisualPacer] = useState(true);
  const [playStage, setPlayStage] = useState<'intro' | 'guided' | 'pacer'>('intro');
  const [voiceId, setVoiceId] = useState(effectiveVoices[0]?.asset_id || 'night1-guided-coherent-5-5');
  const [backgroundIds, setBackgroundIds] = useState<string[]>(presets[0]?.asset_ids || (backgrounds[0] ? [backgrounds[0].asset_id] : []));
  const [voiceVolume, setVoiceVolume] = useState(1);
  const [backgroundVolume, setBackgroundVolume] = useState(DEFAULT_BACKGROUND_VOLUME);
  const [timer, setTimer] = useState<SleepTimer>('30');
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
  const selectedBackgrounds = backgrounds.filter(track => backgroundIds.includes(track.asset_id));
  const hasSelection = (guidedOn && !!selectedVoice) || selectedBackgrounds.length > 0;

  const stopAll = useCallback(() => {
    isPlayingRef.current = false;
    if (fadeTimerRef.current) window.clearInterval(fadeTimerRef.current);
    fadeTimerRef.current = undefined;
    introRef.current?.pause();
    if (introRef.current) introRef.current.currentTime = 0;
    voiceRef.current?.pause();
    if (voiceRef.current) voiceRef.current.currentTime = 0;
    pacerRef.current?.pause();
    if (pacerRef.current) pacerRef.current.currentTime = 0;
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
    introRef.current?.pause();
    if (introRef.current) introRef.current.currentTime = 0;
    voiceRef.current?.pause();
    if (voiceRef.current) voiceRef.current.currentTime = 0;
    pacerRef.current?.pause();
    if (pacerRef.current) pacerRef.current.currentTime = 0;
    fadeAndStopBackground();
    setPlaying(false);
    setPlayStage('intro');
    accumulatorRef.current?.stop();
  }, [fadeAndStopBackground]);

  const pauseAll = useCallback(() => {
    isPlayingRef.current = false;
    introRef.current?.pause();
    voiceRef.current?.pause();
    pacerRef.current?.pause();
    Object.values(backgroundRefs.current).forEach(audio => audio?.pause());
    setPlaying(false);
    accumulatorRef.current?.pause();
  }, []);

  const handleSkipIntro = async () => {
    if (playStage !== 'intro') return;
    if (introRef.current) {
      const elapsed = introRef.current.currentTime || 0;
      introRef.current.pause();
      introRef.current.currentTime = 0;
      accumulatorRef.current?.trackIntroSkipped(introTrack.asset_id, elapsed);
    }
    setPlayStage('guided');
    if (isPlayingRef.current && guidedOn && voiceRef.current) {
      try {
        await voiceRef.current.play();
        accumulatorRef.current?.trackGuidedPracticeStarted(selectedVoice?.asset_id || '');
      } catch {
        setError('Could not start guided practice audio.');
      }
    }
  };

  const handleSkipVoiceToPacer = async () => {
    if (playStage === 'pacer') return;
    if (introRef.current) {
      introRef.current.pause();
      introRef.current.currentTime = 0;
    }
    if (voiceRef.current) {
      voiceRef.current.pause();
      voiceRef.current.currentTime = 0;
    }
    setPlayStage('pacer');
    if (isPlayingRef.current && guidedOn && pacerRef.current) {
      try {
        await pacerRef.current.play();
        accumulatorRef.current?.trackPacerStarted(selectedVoice?.asset_id || '');
      } catch {
        setError('Could not start 432Hz sleep frequency audio.');
      }
    }
  };

  const playSpecificStage = async (stage: 'intro' | 'guided' | 'pacer') => {
    introRef.current?.pause();
    if (introRef.current) introRef.current.currentTime = 0;
    voiceRef.current?.pause();
    if (voiceRef.current) voiceRef.current.currentTime = 0;
    pacerRef.current?.pause();
    if (pacerRef.current) pacerRef.current.currentTime = 0;

    setPlayStage(stage);
    setGuidedOn(true);
    setError('');

    const elements: HTMLAudioElement[] = [];
    if (stage === 'intro' && introRef.current) {
      elements.push(introRef.current);
      accumulatorRef.current?.trackIntroStarted(introTrack.asset_id);
    } else if (stage === 'guided' && voiceRef.current) {
      elements.push(voiceRef.current);
      accumulatorRef.current?.trackGuidedPracticeStarted(selectedVoice?.asset_id || '');
    } else if (stage === 'pacer' && pacerRef.current) {
      elements.push(pacerRef.current);
      accumulatorRef.current?.trackPacerStarted(selectedVoice?.asset_id || '');
    }

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

  const onIntroEnded = async () => {
    if (!isPlayingRef.current) return;
    accumulatorRef.current?.trackIntroEnded(introTrack.asset_id);
    accumulatorRef.current?.trackEnded('intro');
    setPlayStage('guided');
    if (guidedOn && voiceRef.current) {
      try {
        await voiceRef.current.play();
        accumulatorRef.current?.trackGuidedPracticeStarted(selectedVoice?.asset_id || '');
      } catch {
        setError('Could not start guided practice audio.');
      }
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
        if (introRef.current) {
          elements.push(introRef.current);
          accumulatorRef.current?.trackIntroStarted(introTrack.asset_id);
        } else if (voiceRef.current) {
          elements.push(voiceRef.current);
          accumulatorRef.current?.trackGuidedPracticeStarted(selectedVoice?.asset_id || '');
        }
      } else if (playStage === 'guided') {
        if (voiceRef.current) {
          elements.push(voiceRef.current);
          accumulatorRef.current?.trackGuidedPracticeStarted(selectedVoice?.asset_id || '');
        } else if (pacerRef.current) {
          elements.push(pacerRef.current);
          accumulatorRef.current?.trackPacerStarted(selectedVoice?.asset_id || '');
        }
      } else if (playStage === 'pacer' && pacerRef.current) {
        elements.push(pacerRef.current);
        accumulatorRef.current?.trackPacerStarted(selectedVoice?.asset_id || '');
      }
    } else {
      accumulatorRef.current?.trackBackgroundOnlyStarted(backgroundIds);
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
      const isPacer = Boolean(guidedOn && playStage === 'pacer' && pacerRef.current && !pacerRef.current.paused);
      const isBg = selectedBackgrounds.some(b => !backgroundRefs.current[b.asset_id]?.paused);
      const voiceTime = voiceRef.current?.currentTime || 0;
      accumulatorRef.current?.updateState(isVoice, isBg, voiceTime, isIntro, isPacer);
    }, 500);
    return () => clearInterval(interval);
  }, [playing, guidedOn, playStage, selectedBackgrounds]);

  useEffect(() => {
    if (introRef.current) introRef.current.volume = voiceVolume;
    if (voiceRef.current) voiceRef.current.volume = voiceVolume;
    if (pacerRef.current) pacerRef.current.volume = voiceVolume;
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

  const onVoiceEnded = async () => {
    if (!isPlayingRef.current) return;
    if (voiceRef.current) voiceRef.current.pause();
    accumulatorRef.current?.trackEnded('voice');
    if (timer === 'until_voice') {
      stopAll();
      return;
    }
    // Transition to Stage 3: 432Hz sleep frequency & gentle wave chime
    setPlayStage('pacer');
    if (guidedOn && pacerRef.current) {
      try {
        await pacerRef.current.play();
        accumulatorRef.current?.trackPacerStarted(selectedVoice?.asset_id || '');
      } catch {
        setError('Could not start 432Hz sleep frequency audio.');
      }
    }
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

  return (
    <div className="rounded-2xl border border-teal-900/60 bg-[#080b15] p-3.5 sm:p-4">
      {/* Top Banner with Visual Guide Toggle */}
      <div className="flex items-center justify-between rounded-xl border border-teal-900/70 bg-teal-950/30 px-3 py-2 text-xs">
        <div>
          <p className="font-semibold text-teal-200">
            From here, you can put your phone down.
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Follow along with the breath, or switch to ambient sound anytime.
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

      {/* Visual Breathing Pacer ("Video hơi thở") */}
      {showVisualPacer && (
        <div className="mt-2.5">
          <VisualBreathingPacer
            pattern={selectedVoice?.pacer_pattern || '5-5'}
            isPlaying={playing}
            stage={playStage}
          />
        </div>
      )}

      {/* Header */}
      <div className="mt-2.5 flex items-baseline justify-between gap-2">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-teal-300">
            Tonight’s Practice
          </span>
          <h2 className="text-lg font-black text-white">
            {selectedVoice?.label || (script?.id === 'gentle_breathing_v1' ? 'Gentle breathing' : 'Quiet sound')}
          </h2>
        </div>
        {selectedVoice && (
          <span className="text-[11px] font-medium text-slate-400 shrink-0">
            {Math.round(selectedVoice.duration_seconds / 60)} min guided
          </span>
        )}
      </div>

      <div className="mt-3 space-y-2.5">
        {/* Guided Practice & 3 Stages */}
        <div className="rounded-xl border border-indigo-800/70 p-2.5 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div>
              <span className="text-xs font-bold text-white block">
                Guided voice practice
              </span>
              <span className="text-[11px] text-slate-400">
                1. State intro → 2. Guided breathing → 3. 432Hz sleep frequency
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

          {/* Stage 1: State Intro */}
          {guidedOn && (
            <div className="rounded-lg border border-teal-900/60 bg-teal-950/20 p-2 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-teal-200 text-[11px]">
                  Stage 1: State Intro (~15s)
                </span>
                <span className="rounded bg-[#0c1222] px-1.5 py-0.5 text-[10px] font-semibold text-teal-300 border border-teal-900">
                  {playStage === 'intro' ? (playing ? 'Playing' : 'Ready') : 'Passed'}
                </span>
              </div>
              <p className="mt-0.5 text-[11px] text-slate-300 truncate">
                {introTrack.title_en}
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {playStage !== 'intro' && (
                  <button
                    type="button"
                    onClick={() => void playSpecificStage('intro')}
                    className="inline-flex items-center gap-1 rounded-md border border-teal-700/80 bg-teal-900/40 px-2 py-0.5 text-[10px] font-semibold text-teal-200 hover:bg-teal-800/50"
                  >
                    <Play className="h-2.5 w-2.5" />
                    Replay intro
                  </button>
                )}
                {playStage === 'intro' && (
                  <>
                    <button
                      type="button"
                      onClick={() => void handleSkipIntro()}
                      className="inline-flex items-center gap-1 rounded-md border border-teal-700/80 bg-teal-900/40 px-2 py-0.5 text-[10px] font-semibold text-teal-200 hover:bg-teal-800/50"
                    >
                      <FastForward className="h-2.5 w-2.5" />
                      Skip intro to voice
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleSkipVoiceToPacer()}
                      className="inline-flex items-center gap-1 rounded-md border border-amber-700/80 bg-amber-950/40 px-2 py-0.5 text-[10px] font-semibold text-amber-200 hover:bg-amber-900/50"
                    >
                      <FastForward className="h-2.5 w-2.5" />
                      Skip to 432Hz frequency
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Stage 2: Voice Guidance */}
          {guidedOn && (
            <div className="rounded-lg border border-indigo-900/60 bg-indigo-950/20 p-2 text-xs space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-indigo-200 text-[11px]">
                  Stage 2: Voice Guidance (Plays 1x)
                </span>
                <span className="rounded bg-[#0c1222] px-1.5 py-0.5 text-[10px] font-semibold text-indigo-300 border border-indigo-800">
                  {playStage === 'guided' ? (playing ? 'Playing (1x)' : 'Ready') : (playStage === 'pacer' ? 'Completed' : 'Upcoming')}
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
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {playStage !== 'guided' && (
                  <button
                    type="button"
                    onClick={() => void playSpecificStage('guided')}
                    className="inline-flex items-center gap-1 rounded-md border border-indigo-700/80 bg-indigo-900/40 px-2 py-0.5 text-[10px] font-semibold text-indigo-200 hover:bg-indigo-800/50"
                  >
                    <Play className="h-2.5 w-2.5" />
                    Play voice directly
                  </button>
                )}
                {playStage === 'guided' && (
                  <button
                    type="button"
                    onClick={() => void handleSkipVoiceToPacer()}
                    className="inline-flex items-center gap-1 rounded-md border border-amber-700/80 bg-amber-950/40 px-2 py-0.5 text-[10px] font-semibold text-amber-200 hover:bg-amber-900/50"
                  >
                    <FastForward className="h-2.5 w-2.5" />
                    Skip voice to 432Hz frequency
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Stage 3: 432Hz Sleep Frequency & Gentle Waves (Loops) */}
          {guidedOn && selectedVoice?.pacer_path && (
            <div className="rounded-lg border border-amber-900/60 bg-amber-950/20 p-2 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-amber-200 text-[11px] flex items-center gap-1">
                  <Radio className="h-3 w-3" />
                  <span>Stage 3: 432Hz Sleep Frequency (Loops)</span>
                </span>
                <span className="rounded bg-[#0c1222] px-1.5 py-0.5 text-[10px] font-semibold text-amber-300 border border-amber-800">
                  {playStage === 'pacer' ? (playing ? 'Active (Looping)' : 'Paused') : (timer === 'until_voice' ? 'Off (timer: until voice)' : 'Auto-starts next')}
                </span>
              </div>
              <p className="mt-0.5 text-[11px] text-slate-300 truncate">
                {selectedVoice.pacer_title_en || '432Hz Sleep Frequency & Gentle Breath Waves'}
              </p>
              <div className="mt-1 flex items-center justify-between gap-2">
                <div className="inline-flex items-center gap-1 rounded bg-black/40 px-1.5 py-0.5 text-[10px] text-amber-300/90 border border-amber-900/50">
                  <span>🎵</span>
                  <span>{selectedVoice.pacer_pattern || 'Breathing cycle'} · 432Hz & Theta sleep waves · Soft volume</span>
                </div>
                {playStage !== 'pacer' && (
                  <button
                    type="button"
                    onClick={() => void playSpecificStage('pacer')}
                    className="shrink-0 inline-flex items-center gap-1 rounded-md border border-amber-700/80 bg-amber-900/40 px-2 py-0.5 text-[10px] font-semibold text-amber-200 hover:bg-amber-800/50"
                  >
                    <Play className="h-2.5 w-2.5" />
                    Play 432Hz now
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Volume sliders in 2 columns */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            {selectedVoice && guidedOn && (
              <label className="block text-[11px] text-slate-400">
                <span>Guidance volume</span>
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
            )}
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
                <option value="30">30 minutes</option>
                <option value="15">15 minutes</option>
                <option value="60">60 minutes</option>
                <option value="until_voice" disabled={!selectedVoice}>Stop with guided practice</option>
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

      {/* Audio tags */}
      <audio
        ref={introRef}
        key={`intro-${introTrack.asset_id}-${retry}`}
        src={introTrack.local_path}
        preload="metadata"
        onEnded={() => void onIntroEnded()}
        onError={() => setError('The introductory audio could not be loaded.')}
      />
      <audio
        ref={voiceRef}
        key={`voice-${voiceId}-${retry}`}
        src={selectedVoice?.local_path}
        preload="metadata"
        loop={false}
        onEnded={() => void onVoiceEnded()}
        onError={() => setError('The guided audio could not be loaded.')}
      />
      <audio
        ref={pacerRef}
        key={`pacer-${voiceId}-${retry}`}
        src={selectedVoice?.pacer_path}
        preload="metadata"
        loop={timer !== 'until_voice'}
        onError={() => setError('The 432Hz sleep frequency audio could not be loaded.')}
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
          <span>{playing ? 'Pause' : 'Start listening'}</span>
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

      {/* Complete button to advance with completed status */}
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
