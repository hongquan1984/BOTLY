'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, FastForward, Pause, Play, Square } from 'lucide-react';
import {
  type NightOneBackgroundPreset,
  type NightScript,
  selectNightOneIntro,
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

  const [guidedOn, setGuidedOn] = useState(voices.length > 0);
  const [playStage, setPlayStage] = useState<'intro' | 'guided' | 'pacer'>('intro');
  const [voiceId, setVoiceId] = useState(voices[0]?.asset_id || '');
  const [backgroundIds, setBackgroundIds] = useState<string[]>(presets[0]?.asset_ids || (backgrounds[0] ? [backgrounds[0].asset_id] : []));
  const [voiceVolume, setVoiceVolume] = useState(1);
  const [backgroundVolume, setBackgroundVolume] = useState(DEFAULT_BACKGROUND_VOLUME);
  const [timer, setTimer] = useState<SleepTimer>('30');
  const [deadline, setDeadline] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);

  const selectedVoice = voices.find(track => track.asset_id === voiceId);
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
    if (playStage !== 'intro') return; // prevent duplicate transitions
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
        setError('Could not start meditation chime pacer audio.');
      }
    }
  };

  const onIntroEnded = async () => {
    if (!isPlayingRef.current) return; // avoid race conditions if stopped during end
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
      setError('Audio could not be started. Check the file or connection and try again.');
    }
  };

  // High-precision tracking loop while playing
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
    // Transition to Stage 3: Meditation Chime Pacer & Sleep Frequency (Option B)
    setPlayStage('pacer');
    if (guidedOn && pacerRef.current) {
      try {
        await pacerRef.current.play();
        accumulatorRef.current?.trackPacerStarted(selectedVoice?.asset_id || '');
      } catch {
        setError('Could not start meditation chime pacer audio.');
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
      {/* Pre-playback phone-down guidance banner */}
      <div className="rounded-xl border border-teal-900/70 bg-teal-950/30 px-3 py-2 text-xs text-slate-300">
        <p className="font-semibold text-teal-200">
          From here, you can put your phone down.
        </p>
        <p className="text-[11px] text-slate-400 mt-0.5">
          Follow along comfortably, or switch to ambient sound anytime.
        </p>
      </div>

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
        {/* Guided practice section */}
        <div className="rounded-xl border border-indigo-800/70 p-2.5 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div>
              <span className="text-xs font-bold text-white block">
                Guided voice practice
              </span>
              <span className="text-[11px] text-slate-400">
                Personalized intro → guided breathing → sleep frequency loop
              </span>
            </div>
            <input
              aria-label="Guided voice practice"
              type="checkbox"
              checked={guidedOn}
              disabled={!voices.length}
              onChange={event => {
                pauseAll();
                setGuidedOn(event.target.checked);
              }}
              className="h-4 w-4 rounded border-indigo-700 bg-slate-900 text-teal-400 focus:ring-teal-400"
            />
          </div>

          {/* Stage 1: Personalized Intro status & skip buttons */}
          {guidedOn && (
            <div className="rounded-lg border border-teal-900/60 bg-teal-950/20 p-2 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-teal-200 text-[11px]">
                  Stage 1: State Intro
                </span>
                <span className="rounded bg-[#0c1222] px-1.5 py-0.5 text-[10px] font-semibold text-teal-300 border border-teal-900">
                  {playStage === 'intro' ? (playing ? 'Playing' : 'Ready') : 'Passed'}
                </span>
              </div>
              <p className="mt-0.5 text-[11px] text-slate-300 truncate">
                {introTrack.title_en}
              </p>
              {playStage === 'intro' && (
                <div className="mt-1.5 flex flex-wrap gap-1.5">
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
                    Skip straight to sleep frequency
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Stage 2: Spoken voice guidance (Plays 1x) */}
          {voices.length > 0 && guidedOn && (
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
                {voices.map(voice => (
                  <option key={voice.asset_id} value={voice.asset_id}>{voice.label}</option>
                ))}
              </select>
              {playStage === 'guided' && (
                <button
                  type="button"
                  onClick={() => void handleSkipVoiceToPacer()}
                  className="inline-flex items-center gap-1 rounded-md border border-amber-700/80 bg-amber-950/40 px-2 py-0.5 text-[10px] font-semibold text-amber-200 hover:bg-amber-900/50"
                >
                  <FastForward className="h-2.5 w-2.5" />
                  Skip voice to sleep frequency
                </button>
              )}
            </div>
          )}

          {/* Stage 3: Sleep Frequency Music & Gentle Breath Waves (Loops with timer) */}
          {guidedOn && selectedVoice?.pacer_path && (
            <div className="rounded-lg border border-amber-900/60 bg-amber-950/20 p-2 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-amber-200 text-[11px]">
                  Stage 3: Sleep Frequency Music & Waves (Loops)
                </span>
                <span className="rounded bg-[#0c1222] px-1.5 py-0.5 text-[10px] font-semibold text-amber-300 border border-amber-800">
                  {playStage === 'pacer' ? (playing ? 'Active (Looping)' : 'Paused') : (timer === 'until_voice' ? 'Off (timer: until voice)' : 'Auto-starts next')}
                </span>
              </div>
              <p className="mt-0.5 text-[11px] text-slate-300 truncate">
                {selectedVoice.pacer_title_en || '432Hz Sleep Frequency & Gentle Breath Waves (Soft volume)'}
              </p>
              <div className="mt-1 inline-flex items-center gap-1 rounded bg-black/40 px-1.5 py-0.5 text-[10px] text-amber-300/90 border border-amber-900/50">
                <span>🎵</span>
                <span>{selectedVoice.pacer_pattern || 'Breathing cycle'} · 432Hz & Theta sleep waves · Soft volume</span>
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

        {/* Ambient Sound & Timer compact section */}
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
        onError={() => setError('The meditation chime pacer audio could not be loaded.')}
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
