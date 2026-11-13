'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Check,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Info,
  MoonStar,
  Pause,
  Play,
  SlidersHorizontal,
  Sparkles,
  Square,
  X,
} from 'lucide-react';
import {
  type NightOneBackgroundPreset,
  type NightScript,
  type GuideVoiceOption,
  getNightOneVoicePath,
  selectNightOneIntro,
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
type SleepTimer = 'until_voice' | '15' | '30' | '60' | '90' | 'all_night';

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

/**
 * Atmospheric Aura Visual ("Your quiet moment")
 * Thay thế cho visualizer đếm nhịp thở cũ.
 * Tạo không khí êm dịu với quầng sáng màu teal pha tím chuyển động chậm như sương,
 * không phồng-xẹp theo chu kỳ đều, không nhấp nháy, hỗ trợ pause vị trí và reduced-motion.
 */
function QuietMomentAura({
  isPlaying,
  hasActiveVoiceGuide,
  isDimmed,
}: {
  isPlaying: boolean;
  hasActiveVoiceGuide: boolean;
  isDimmed: boolean;
}) {
  const animRunning = isPlaying && !isDimmed;
  const playState = animRunning ? 'running' : 'paused';

  return (
    <div className="relative overflow-hidden rounded-xl border border-teal-900/60 bg-gradient-to-b from-[#09101f] to-[#060812] px-4 py-4 sm:py-5 shadow-inner">
      {/* Decorative Aura / Mist (aria-hidden) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        {/* Layer 1: Soft Teal mist drifting slowly */}
        <div
          data-aura-anim="true"
          className="aura-anim-teal absolute -top-[25%] -left-[15%] h-[150%] w-[130%] rounded-full blur-3xl pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at 35% 45%, rgba(20, 184, 166, 0.45) 0%, rgba(13, 148, 136, 0.2) 40%, transparent 70%)',
            animationPlayState: playState,
          }}
        />

        {/* Layer 2: Soft Violet/Indigo mist gently shifting */}
        <div
          data-aura-anim="true"
          className="aura-anim-violet absolute -bottom-[25%] -right-[15%] h-[150%] w-[130%] rounded-full blur-3xl pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at 65% 55%, rgba(147, 51, 234, 0.45) 0%, rgba(99, 102, 241, 0.2) 40%, transparent 70%)',
            animationPlayState: playState,
          }}
        />

        {/* Layer 3: Central subtle blend between teal and violet */}
        <div
          data-aura-anim="true"
          className="aura-anim-center absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-48 w-48 rounded-full blur-2xl pointer-events-none"
          style={{
            background:
              'radial-gradient(circle, rgba(45, 212, 191, 0.35) 0%, rgba(168, 85, 247, 0.25) 50%, transparent 75%)',
            animationPlayState: playState,
          }}
        />
      </div>

      {/* Heading */}
      <div className="relative flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5 font-semibold text-teal-300">
          <Sparkles className="h-3.5 w-3.5 text-teal-400" aria-hidden="true" />
          <div>
            <span className="text-teal-200 font-semibold text-xs sm:text-sm">
              Your quiet moment
            </span>
            <span className="block text-[10px] font-normal text-slate-400">
              Khoảng lặng của bạn
            </span>
          </div>
        </div>
      </div>

      {/* Visual Aura center / text */}
      <div className="relative my-3 sm:my-4 flex flex-col items-center justify-center text-center">
        {/* Soft glowing ambient circular indicator ("vòng tròn") */}
        <div
          data-aura-anim="true"
          aria-hidden="true"
          className="aura-anim-orb relative flex h-24 w-24 sm:h-28 sm:w-28 items-center justify-center rounded-full border border-teal-400/30 bg-teal-950/40 backdrop-blur-sm"
          style={{
            animationPlayState: playState,
          }}
        >
          {/* Inner radiating colored nebula mist */}
          <div
            data-aura-anim="true"
            className="aura-anim-core h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-gradient-to-br from-teal-400/35 via-cyan-400/25 to-purple-500/35"
            style={{
              animationPlayState: playState,
            }}
          />
          {/* Soft central pearlescent mist core */}
          <div className="absolute h-7 w-7 rounded-full bg-teal-200/25 blur-[6px] pointer-events-none" />
        </div>

        {/* Center message: "A moment to unwind" */}
        <div className="mt-3">
          <p className="text-xs sm:text-sm font-semibold tracking-wide text-slate-200">
            A moment to unwind
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Một khoảng nghỉ dành cho bạn.
          </p>
        </div>
      </div>

      {/* Contextual guidance line based on player state */}
      <div className="relative border-t border-teal-950/80 pt-2.5 text-center">
        <p className="text-xs font-medium text-slate-300 leading-relaxed">
          {hasActiveVoiceGuide
            ? 'Follow the audio. You can close your eyes whenever you like.'
            : 'Settle in and listen at your own pace.'}
        </p>
        <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
          {hasActiveVoiceGuide
            ? 'Nghe theo lời hướng dẫn. Bạn có thể nhắm mắt bất cứ khi nào muốn.'
            : 'Dành thời gian nghỉ và nghe theo nhịp của bạn.'}
        </p>
      </div>
    </div>
  );
}

export function NightAudioPlayer({
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
  const stageStartedAtRef = useRef<number | null>(null);

  const [guideVoice, setGuideVoice] = useState<GuideVoiceOption>('female_whisper');
  const introTrack = selectNightOneIntro(state, guideVoice);
  const fallbackVoices = Object.values(NIGHT_ONE_VOICES);
  const effectiveVoices = voices.length > 0 ? voices : fallbackVoices;
  const pivotTrack = selectCognitivePivotTrack(state, guideVoice);

  const [guidedOn, setGuidedOn] = useState(true);
  const [showVisualPacer, setShowVisualPacer] = useState(true);
  const [blackoutMode, setBlackoutMode] = useState(false);
  const [showCustomizer, setShowCustomizer] = useState(false);
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

  const [isFacebookApp, setIsFacebookApp] = useState(false);
  const [hideInAppNotice, setHideInAppNotice] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const ua = navigator.userAgent || navigator.vendor || '';
      if (/FBAN|FBAV|Instagram|FB_IAB|FBSS/i.test(ua)) {
        setIsFacebookApp(true);
      }
    }
  }, []);

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
    stageStartedAtRef.current = null;
    if (fadeTimerRef.current) window.clearInterval(fadeTimerRef.current);
    fadeTimerRef.current = undefined;

    [introRef, voiceRef, pacerRef, pivotRef, deltaRef, cocoonRef].forEach(ref => {
      ref.current?.pause();
      if (ref.current) {
        ref.current.currentTime = 0;
        ref.current.volume = voiceVolume;
      }
    });

    Object.values(backgroundRefs.current).forEach(audio => {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
        audio.volume = backgroundVolume;
      }
    });

    setPlaying(false);
    setDeadline(null);
    setPlayStage('intro');
    accumulatorRef.current?.stop();
  }, [voiceVolume, backgroundVolume]);

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
    const audios = selectedBackgrounds
      .map(track => backgroundRefs.current[track.asset_id])
      .filter((audio): audio is HTMLAudioElement => Boolean(audio));
    if (!audios.length) return;
    if (fadeTimerRef.current) window.clearInterval(fadeTimerRef.current);
    const starts = audios.map(audio => audio.volume);
    let step = 0;
    fadeTimerRef.current = window.setInterval(() => {
      step += 1;
      audios.forEach((audio, index) => {
        audio.volume = Math.max(0, starts[index] * (1 - step / 10));
      });
      if (step >= 10) {
        window.clearInterval(fadeTimerRef.current);
        fadeTimerRef.current = undefined;
        audios.forEach(audio => {
          audio.pause();
          audio.currentTime = 0;
          audio.volume = backgroundVolume;
        });
      }
    }, 200);
  }, [backgroundVolume, selectedBackgrounds]);

  // Stop at deadline triggers peaceful resting completion
  const stopAtDeadline = useCallback(() => {
    isPlayingRef.current = false;
    stageStartedAtRef.current = null;
    [introRef, voiceRef, pacerRef, pivotRef, deltaRef, cocoonRef].forEach(ref => {
      ref.current?.pause();
      if (ref.current) {
        ref.current.currentTime = 0;
        ref.current.volume = voiceVolume;
      }
    });
    fadeAndStopBackground();
    setPlaying(false);
    setPlayStage('intro');
    accumulatorRef.current?.stop();
    if (onComplete) {
      onComplete();
    }
  }, [fadeAndStopBackground, voiceVolume, onComplete]);

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
    stageStartedAtRef.current = Date.now();

    let nextAudio: HTMLAudioElement | null = null;
    if (nextStage === 'guided') nextAudio = voiceRef.current;
    else if (nextStage === 'theta_drift') nextAudio = pacerRef.current;
    else if (nextStage === 'cognitive_pivot') nextAudio = pivotRef.current;
    else if (nextStage === 'delta_immersion') nextAudio = deltaRef.current;
    else if (nextStage === 'sleep_cocoon') nextAudio = cocoonRef.current;

    if (nextAudio && (guidedOn || nextStage === 'delta_immersion' || nextStage === 'sleep_cocoon')) {
      try {
        await nextAudio.play();
      } catch {
        setError(`Could not transition smoothly to ${nextStage}.`);
      }
    }

    // At minute 7:00 when entering Stage 2 (theta_drift), smoothly fade in background ambience (ocean waves/rain)
    if (nextStage === 'theta_drift') {
      selectedBackgrounds.forEach(track => {
        const audio = backgroundRefs.current[track.asset_id];
        if (audio) {
          audio.volume = 0;
          audio.play().catch(() => {});
          const startVolTime = Date.now();
          const fadeDuration = 10_000;
          const bgFadeTimer = window.setInterval(() => {
            const elapsed = Date.now() - startVolTime;
            const progress = Math.min(1, elapsed / fadeDuration);
            audio.volume = backgroundVolume * progress;
            if (progress >= 1) window.clearInterval(bgFadeTimer);
          }, 200);
        }
      });
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

    if (!stageStartedAtRef.current) {
      stageStartedAtRef.current = Date.now();
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
    } else {
      if (playStage === 'delta_immersion' && deltaRef.current) {
        elements.push(deltaRef.current);
      } else if (playStage === 'sleep_cocoon' && cocoonRef.current) {
        elements.push(cocoonRef.current);
      }
    }

    // Only play background sounds (ocean waves/rain) if NOT in the opening 7-minute hypnosis stage
    const isOpeningHypnosis = guidedOn && (playStage === 'intro' || playStage === 'guided');
    if (!isOpeningHypnosis) {
      selectedBackgrounds.forEach(track => {
        const audio = backgroundRefs.current[track.asset_id];
        if (audio) elements.push(audio);
      });
    }

    // Reset volume levels
    [introRef, voiceRef, pacerRef, pivotRef, deltaRef, cocoonRef].forEach(ref => {
      if (ref.current) ref.current.volume = voiceVolume;
    });
    Object.values(backgroundRefs.current).forEach(audio => {
      if (audio) audio.volume = isOpeningHypnosis ? 0 : backgroundVolume;
    });

    try {
      const results = await Promise.allSettled(elements.map(element => element.play()));
      const anySucceeded = results.some(r => r.status === 'fulfilled');
      if (anySucceeded) {
        isPlayingRef.current = true;
        setPlaying(true);
        if (timer === 'all_night' || timer === 'until_voice') {
          setDeadline(null);
        } else {
          setDeadline(current => current || Date.now() + Number(timer) * 60_000);
        }
        accumulatorRef.current?.start();
        setError('');
      } else {
        throw new Error('All audio elements failed to start');
      }
    } catch {
      isPlayingRef.current = false;
      pauseAll();
      setError('Audio could not be started. Check connection and try again.');
    }
  };

  // Tracking loop and progressive deceleration timeline manager while playing
  useEffect(() => {
    if (!playing) return;
    const interval = window.setInterval(() => {
      const isIntro = Boolean(guidedOn && playStage === 'intro' && introRef.current && !introRef.current.paused);
      const isVoice = Boolean(guidedOn && playStage === 'guided' && voiceRef.current && !voiceRef.current.paused);
      const isPacer = Boolean(guidedOn && playStage === 'theta_drift' && pacerRef.current && !pacerRef.current.paused);
      const isBg = selectedBackgrounds.some(b => !backgroundRefs.current[b.asset_id]?.paused);
      const voiceTime = voiceRef.current?.currentTime || 0;
      accumulatorRef.current?.updateState(isVoice, isBg, voiceTime, isIntro, isPacer);

      // 60-Minute Progressive Stage Progression Logic:
      if (isPlayingRef.current && stageStartedAtRef.current) {
        const stageElapsedSec = (Date.now() - stageStartedAtRef.current) / 1000;

        // Stage 2 (432Hz Theta Drift): Runs for 18 minutes (1080s) before moving to Stage 3 (7m + 18m = 25m)
        if (playStage === 'theta_drift' && stageElapsedSec >= 18 * 60) {
          void advanceToStage('cognitive_pivot');
        }
        // Stage 3 (Cognitive Pivot): Runs for ~15 minutes (900s) before moving to Stage 4 (25m + 15m = 40m)
        else if (playStage === 'cognitive_pivot' && stageElapsedSec >= 15 * 60) {
          void advanceToStage('delta_immersion');
        }
        // Stage 4 (1.8Hz Deep Delta): Runs for ~15 minutes (900s) before moving to Stage 5 (40m + 15m = 55m)
        else if (playStage === 'delta_immersion' && stageElapsedSec >= 15 * 60) {
          void advanceToStage('sleep_cocoon');
        }
      }
    }, 500);
    return () => clearInterval(interval);
  }, [playing, guidedOn, playStage, selectedBackgrounds]);

  // Volume sync across all primary tracks when not in the final 90s fade window
  useEffect(() => {
    if (deadline && Date.now() >= deadline - 90_000) return;
    [introRef, voiceRef, pacerRef, pivotRef, deltaRef, cocoonRef].forEach(ref => {
      if (ref.current) ref.current.volume = voiceVolume;
    });
    const isOpeningHypnosis = guidedOn && (playStage === 'intro' || playStage === 'guided');
    Object.values(backgroundRefs.current).forEach(audio => {
      if (audio) audio.volume = isOpeningHypnosis ? 0 : backgroundVolume;
    });
  }, [voiceVolume, backgroundVolume, retry, selectedVoice?.asset_id, backgroundIds, deadline, guidedOn, playStage]);

  // Ultra-gentle 90-second fade out to silence before deadline
  useEffect(() => {
    if (!deadline || timer === 'all_night' || timer === 'until_voice') return;
    const checkDeadline = () => {
      const timeLeft = deadline - Date.now();
      if (timeLeft <= 0) {
        stopAtDeadline();
        setDeadline(null);
      } else if (timeLeft <= 90_000) {
        const fadeFactor = Math.max(0, timeLeft / 90_000);
        [introRef, voiceRef, pacerRef, pivotRef, deltaRef, cocoonRef].forEach(ref => {
          if (ref.current) ref.current.volume = voiceVolume * fadeFactor;
        });
        Object.values(backgroundRefs.current).forEach(audio => {
          if (audio) audio.volume = backgroundVolume * fadeFactor;
        });
      }
    };
    const interval = window.setInterval(checkDeadline, 500);
    document.addEventListener('visibilitychange', checkDeadline);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', checkDeadline);
    };
  }, [deadline, timer, voiceVolume, backgroundVolume, stopAtDeadline]);

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

  const selectedPreset = presets.find(presetIsActive);
  const soundSummary = selectedPreset
    ? selectedPreset.label
    : backgroundIds.length > 0
    ? 'Custom soundscape'
    : 'No background sound';

  const hasActiveVoiceGuide = guidedOn && (playStage === 'intro' || playStage === 'guided' || playStage === 'cognitive_pivot');

  return (
    <>
      {/* Bedtime Blackout Mode Overlay (Tap to wake) */}
      {blackoutMode && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Wake screen"
          onClick={() => setBlackoutMode(false)}
          onKeyDown={e => {
            if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') setBlackoutMode(false);
          }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black px-6 text-center select-none cursor-pointer"
        >
          <div className="relative flex flex-col items-center justify-center space-y-4">
            <MoonStar className="h-10 w-10 text-teal-500/30 animate-pulse [animation-duration:4s]" />
            <p className="text-sm font-semibold tracking-wide text-slate-500">
              Bedtime Dimming Active
            </p>
            <p className="text-xs text-slate-600 max-w-xs">
              Audio is gently playing in the background. Tap anywhere on screen to wake controls.
            </p>
            <span className="inline-block mt-4 rounded-full border border-slate-800 bg-slate-900/60 px-4 py-1.5 text-[11px] font-medium text-slate-500">
              Tap to wake
            </span>
          </div>
        </div>
      )}

      {isFacebookApp && !hideInAppNotice && (
        <div className="mb-3 rounded-xl border border-sky-500/40 bg-sky-950/50 p-2.5 text-xs text-sky-200 flex items-start gap-2.5 shadow-md">
          <Info className="h-4 w-4 text-sky-400 shrink-0 mt-0.5" />
          <div className="flex-1 text-[11px] leading-relaxed">
            <span className="font-semibold text-white">Mẹo nghe khi tắt màn hình:</span>{' '}
            <span className="text-slate-300">
              Bạn đang mở trong ứng dụng Facebook. Hãy bấm biểu tượng <strong className="text-white">•••</strong> ở góc trên và chọn <strong className="text-white">&quot;Mở bằng trình duyệt ngoài&quot;</strong> (Safari / Chrome) để âm thanh không bị ngắt khi khóa máy.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setHideInAppNotice(true)}
            className="text-slate-400 hover:text-white p-0.5"
            aria-label="Đóng thông báo"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="rounded-2xl border border-teal-900/60 bg-[#080b15] p-3.5 sm:p-4">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between gap-1.5 rounded-xl border border-teal-900/70 bg-teal-950/30 px-2.5 sm:px-3 py-2 text-xs">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <span className="flex h-2 w-2 rounded-full bg-teal-400 animate-pulse shrink-0" />
            <span className="font-semibold text-teal-200 text-[11px] sm:text-xs truncate">
              Continuous Sleep Flow
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setBlackoutMode(true)}
              className="inline-flex items-center gap-1 rounded-md border border-teal-800 bg-teal-900/40 px-2 py-1 text-[11px] font-semibold text-teal-200 hover:bg-teal-800/60"
            >
              <MoonStar className="h-3 w-3" />
              <span>Dim screen</span>
            </button>
            <button
              type="button"
              onClick={() => setShowVisualPacer(v => !v)}
              className="inline-flex items-center gap-1 rounded-md border border-slate-800 bg-slate-900/60 px-2 py-1 text-[11px] font-semibold text-slate-300 hover:text-white"
            >
              {showVisualPacer ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              <span>{showVisualPacer ? 'Hide visual' : 'Show visual'}</span>
            </button>
          </div>
        </div>

        {/* Atmospheric Aura Visual ("Your quiet moment") */}
        {showVisualPacer && (
          <div className="mt-2.5">
            <QuietMomentAura
              isPlaying={playing}
              hasActiveVoiceGuide={hasActiveVoiceGuide}
              isDimmed={blackoutMode}
            />
          </div>
        )}

        {/* Ambient Deceleration Stream (Continuous flow without stress-inducing minute clocks) */}
        <div className="mt-3 rounded-xl border border-teal-900/60 bg-[#060a14] p-2.5">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-teal-300 mb-1.5">
            <span className="flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-teal-400" />
              <span>Continuous Deceleration Flow</span>
            </span>
            <span className="text-slate-400 font-mono text-[10px] lowercase">
              {timer === 'all_night' ? 'all night' : `${timer} min`}
            </span>
          </div>

          {/* Gentle Flow Stages (Informative display only - non-clickable to protect uninterrupted sleep progression) */}
          <div className="grid grid-cols-5 gap-1 text-[9px] font-semibold text-center select-none" aria-label="Sleep journey timeline">
            {[
              { id: 'intro', label: '1. Hypnosis', active: playStage === 'intro' || playStage === 'guided', color: 'teal', hint: 'Thôi miên 7 phút' },
              { id: 'theta_drift', label: '2. 432Hz', active: playStage === 'theta_drift', color: 'amber', hint: 'Sóng 432Hz hạ áp (18 phút)' },
              { id: 'cognitive_pivot', label: '3. Whisper', active: playStage === 'cognitive_pivot', color: 'purple', hint: 'Thì thầm buông thư (phút 25)' },
              { id: 'delta_immersion', label: '4. Delta', active: playStage === 'delta_immersion', color: 'blue', hint: 'Sóng Delta 1.8Hz (phút 40)' },
              { id: 'sleep_cocoon', label: '5. Cocoon', active: playStage === 'sleep_cocoon', color: 'teal', hint: 'Kén ngủ êm dịu (phút 55)' },
            ].map(step => (
              <div
                key={step.id}
                title={step.hint}
                className={`rounded py-1 px-0.5 border transition truncate cursor-default select-none ${
                  step.active
                    ? step.color === 'amber'
                      ? 'border-amber-400 bg-amber-950/60 text-amber-200 shadow-[0_0_10px_rgba(245,158,11,0.25)] ring-1 ring-amber-400/50'
                      : step.color === 'purple'
                      ? 'border-purple-400 bg-purple-950/60 text-purple-200 shadow-[0_0_10px_rgba(168,85,247,0.25)] ring-1 ring-purple-400/50'
                      : step.color === 'blue'
                      ? 'border-blue-400 bg-blue-950/60 text-blue-200 shadow-[0_0_10px_rgba(59,130,246,0.25)] ring-1 ring-blue-400/50'
                      : 'border-teal-400 bg-teal-950/60 text-teal-200 shadow-[0_0_10px_rgba(45,212,191,0.25)] ring-1 ring-teal-400/50'
                    : 'border-slate-800/80 bg-slate-900/30 text-slate-400 opacity-75'
                }`}
              >
                <div className="flex items-center justify-center gap-0.5">
                  {step.active && <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse shrink-0" />}
                  <span>{step.label}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400">
            <p className="truncate">
              Active: <span className="font-semibold text-slate-200">{currentStageInfo.name_en}</span> · {currentStageInfo.description_en}
            </p>
            <span className="text-[9px] text-teal-400/80 shrink-0 font-medium ml-2">
              Auto-advancing
            </span>
          </div>
        </div>

        {/* Primary Playback Action Controls */}
        <div className="mt-3.5 space-y-2">
          <button
            type="button"
            disabled={!hasSelection}
            onClick={() => void (playing ? pauseAll() : start())}
            className="companion-button flex w-full items-center justify-center gap-2.5 py-3.5 text-sm font-bold shadow-lg shadow-teal-950/40"
          >
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current" />}
            <span>
              {playing
                ? 'Pause & Rest'
                : timer === 'all_night'
                ? 'Start All-Night Sleep Journey'
                : `Start ${timer}-Min Sleep Journey`}
            </span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setBlackoutMode(true)}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-indigo-900/80 bg-indigo-950/30 px-3 py-2 text-xs font-semibold text-indigo-200 hover:bg-indigo-900/40 transition"
            >
              <MoonStar className="h-3.5 w-3.5 text-indigo-300" />
              <span>Dim screen</span>
            </button>
            <button
              type="button"
              onClick={stopAll}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-indigo-900/80 bg-indigo-950/30 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-indigo-900/40 transition"
            >
              <Square className="h-3 w-3 text-slate-400" />
              <span>Stop listening</span>
            </button>
          </div>
        </div>

        {/* Collapsible Customizer (Voice, Timer, Technique, Ambient presets & volume) */}
        <div className="mt-3 rounded-xl border border-indigo-950/80 bg-[#090d1a] overflow-hidden">
          <button
            type="button"
            onClick={() => setShowCustomizer(v => !v)}
            className="w-full flex items-center justify-between px-3 py-2.5 text-xs text-slate-300 hover:text-white transition"
          >
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-3.5 w-3.5 text-teal-400" />
              <span className="font-semibold text-[11px]">Customize Sound & Settings</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
              <span>
                {guideVoice === 'female_whisper' ? '🌸 Whisper' : '🌿 Calm'} · {soundSummary}
              </span>
              {showCustomizer ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </div>
          </button>

          {showCustomizer && (
            <div className="border-t border-indigo-950/80 p-2.5 space-y-2.5 bg-[#070a14]">
              {/* Guide Voice Options */}
              <div className="rounded-lg border border-purple-900/60 bg-purple-950/20 p-2 text-xs space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-purple-200 text-[11px] flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3 text-purple-400" />
                    <span>Guide Voice (VietVoiceStudio Clone)</span>
                  </span>
                  <span className="text-[10px] text-purple-300 font-medium">
                    {guideVoice === 'female_whisper' ? '🌸 Female Whisper' : '🌿 Male Calm'}
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
                      <span>Female Whisper</span>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                      Bedtime Whisper · Intimate & Soothing
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
                      <span>Male Calm</span>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                      Calm Meditation · Grounded & Serene
                    </span>
                  </button>
                </div>
              </div>

              {/* Breathing Technique */}
              <div className="rounded-lg border border-indigo-900/60 bg-indigo-950/20 p-2 text-xs space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-indigo-200 text-[11px]">
                    Guided Practice & Voice
                  </span>
                  <span className="rounded bg-[#0c1222] px-1.5 py-0.5 text-[10px] font-semibold text-indigo-300 border border-indigo-800">
                    {selectedVoice?.pacer_pattern || '7-Min Hypnosis'}
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

              {/* Timer Duration Selection */}
              <div className="rounded-lg border border-indigo-900/60 bg-indigo-950/20 p-2 text-xs space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-indigo-200 text-[11px]">
                    Sleep Timer & Fade-Out
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {timer === 'all_night' ? 'Loop continuous' : '90s gentle fade to silence'}
                  </span>
                </div>
                <select
                  value={timer}
                  onChange={event => {
                    pauseAll();
                    setTimer(event.target.value as SleepTimer);
                  }}
                  className="w-full rounded-md border border-indigo-800 bg-[#0c1222] px-2.5 py-1 text-xs text-white"
                >
                  <option value="60">60 minutes (Recommended · Gentle Fade)</option>
                  <option value="90">90 minutes (Full Sleep Cycle · Gentle Fade)</option>
                  <option value="30">30 minutes (Gentle Fade)</option>
                  <option value="15">15 minutes (Quick Rest)</option>
                  <option value="all_night">Keep playing all night (Continuous Masking)</option>
                  <option value="until_voice" disabled={!selectedVoice}>Stop after guided breath practice</option>
                </select>
              </div>

              {/* Background Ambience Presets */}
              <div className="rounded-lg border border-indigo-900/60 bg-indigo-950/20 p-2 text-xs space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-indigo-200 text-[11px]">
                    Background Soundscape
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {soundSummary}
                  </span>
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

              {/* Volume Sliders */}
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
          )}
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
          onEnded={() => {
            if (timer === 'until_voice') {
              stopAtDeadline();
            } else {
              void advanceToStage('theta_drift');
            }
          }}
          onError={() => setError('The guided audio could not be loaded.')}
        />
        <audio
          ref={pacerRef}
          key={`theta-${voiceId}-${retry}`}
          src={selectedVoice?.pacer_path}
          preload="metadata"
          loop={true}
          onError={() => setError('The 432Hz sleep frequency audio could not be loaded.')}
        />
        <audio
          ref={pivotRef}
          key={`pivot-${pivotTrack.asset_id}-${guideVoice}-${retry}`}
          src={pivotTrack.local_path}
          preload="metadata"
          loop={false}
          onError={() => setError('The cognitive pivot audio could not be loaded.')}
        />
        <audio
          ref={deltaRef}
          key={`delta-${retry}`}
          src={DEEP_DELTA_TRACK.local_path}
          preload="metadata"
          loop={true}
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
            <button
              type="button"
              onClick={() => { setError(''); setRetry(value => value + 1); }}
              className="ml-2 underline font-semibold"
            >
              Retry
            </button>
          </p>
        )}

        {/* Complete button */}
        <button
          type="button"
          onClick={handleComplete}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-teal-950/60 border border-teal-500/50 px-4 py-2.5 text-xs font-bold text-teal-200 hover:bg-teal-900/40"
        >
          <Check className="h-3.5 w-3.5 text-teal-300" />
          <span>Finished listening — ready to rest</span>
        </button>

        <div className="mt-2.5 flex items-center justify-between text-xs text-slate-400 px-1">
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
    </>
  );
}
