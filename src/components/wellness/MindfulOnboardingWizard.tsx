'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Sparkles, Moon, HeartPulse, ArrowRight, ArrowLeft, Volume2, VolumeX,
  Play, Pause, RotateCcw, Bed, ShieldAlert, CheckCircle2, Award, Mail, Send
} from 'lucide-react';
import type {
  SomaticSignals, WinddownProtocol, MindTrapItem, SomaticQuiz
} from '@/lib/published-articles';
import { trackClientEvent } from '@/components/analytics/AnalyticsTracker';

interface MindfulOnboardingWizardProps {
  somaticSignals: SomaticSignals;
  winddownProtocol: WinddownProtocol;
  mindTraps?: MindTrapItem[] | null;
  somaticQuiz?: SomaticQuiz | null;
  locale: 'en' | 'vi';
  articleSlug?: string;
  onExpandArticle?: () => void;
}

export function MindfulOnboardingWizard({
  somaticSignals,
  winddownProtocol,
  mindTraps,
  somaticQuiz,
  locale,
  articleSlug,
  onExpandArticle
}: MindfulOnboardingWizardProps) {
  const vi = locale === 'vi';
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedSignal, setSelectedSignal] = useState<string | null>(null);

  // Audio frequency state (Web Audio API 432Hz sine tone)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  // Breathing slider state: Inhale 4s, Hold 4s, Exhale 8s (Total 16s)
  const [isBreathing, setIsBreathing] = useState(false);
  const [breathSecond, setBreathSecond] = useState(0);

  // Flip card state for Mind Traps
  const [cardFlipped, setCardFlipped] = useState(false);

  // Email lead capture state (Step 5)
  const [leadEmail, setLeadEmail] = useState('');
  const [leadSubmitting, setLeadSubmitting] = useState(false);
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [leadError, setLeadError] = useState<string | null>(null);

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadEmail || !leadEmail.includes('@') || leadSubmitting) return;
    setLeadSubmitting(true);
    setLeadError(null);
    try {
      const source = `somatic_haven_${articleSlug || 'healing'}`;
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: leadEmail,
          locale,
          source
        })
      });
      if (!res.ok) throw new Error('Subscription failed');
      setLeadSubmitted(true);
      trackClientEvent('lead_submit', {
        articleSlug,
        locale,
        metadata: {
          source,
          sprout: somaticQuiz?.recommended_sprout
        }
      });
    } catch {
      setLeadError(vi ? 'Có lỗi xảy ra, vui lòng thử lại.' : 'An error occurred, please try again.');
    } finally {
      setLeadSubmitting(false);
    }
  };

  // Track breathing interval
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isBreathing) {
      timer = setInterval(() => {
        setBreathSecond(prev => (prev + 1) % 16);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isBreathing]);

  // Handle Web Audio toggle
  const toggleAudio = () => {
    if (!isPlayingAudio) {
      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new AudioCtx();
        audioCtxRef.current = ctx;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(432, ctx.currentTime); // 432Hz healing pitch

        // Gentle volume ramp up
        gain.gain.setValueAtTime(0.01, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 1.5);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();

        oscRef.current = osc;
        gainRef.current = gain;
        setIsPlayingAudio(true);

        trackClientEvent('onboarding_audio_start', { locale, metadata: { hz: 432 } });
      } catch (e) {
        console.error('Audio initialization error:', e);
      }
    } else {
      if (oscRef.current) {
        try {
          oscRef.current.stop();
        } catch {}
      }
      if (audioCtxRef.current) {
        try {
          audioCtxRef.current.close();
        } catch {}
      }
      setIsPlayingAudio(false);
    }
  };

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (oscRef.current) {
        try {
          oscRef.current.stop();
        } catch {}
      }
      if (audioCtxRef.current) {
        try {
          audioCtxRef.current.close();
        } catch {}
      }
    };
  }, []);

  const goToStep = (step: number) => {
    setCurrentStep(step);
    trackClientEvent('onboarding_step_view', { articleSlug, locale, metadata: { step } });
    if (step > 1 && step < 5) {
      trackClientEvent('quiz_step_progress', {
        articleSlug,
        locale,
        metadata: {
          quiz_type: 'mindful_onboarding',
          step,
          total_steps: 5
        }
      });
    } else if (step === 5) {
      trackClientEvent('quiz_completed', {
        articleSlug,
        locale,
        metadata: {
          quiz_type: 'mindful_onboarding',
          completed: true,
          total_steps: 5
        }
      });
    }
    if (step === 3 && !isBreathing) {
      setBreathSecond(0);
      setIsBreathing(true);
    }
  };

  // Breathing parameters calculation
  let phaseText = vi ? '🌿 Sẵn sàng bắt đầu nhịp thở' : '🌿 Ready to begin breathing cycle';
  let descText = vi ? 'Nhìn theo số đếm to ở giữa thanh trượt để đồng bộ nhịp tim' : 'Follow the large centered countdown number to synchronize your heart rate';
  let barWidth = '0%';
  let barColorClass = 'bg-amber-400';
  let remainSec = 0;
  let phaseBadge = vi ? 'CHỜ BẮT ĐẦU' : 'STANDBY';

  if (isBreathing) {
    if (breathSecond < 4) {
      remainSec = 4 - breathSecond;
      phaseText = vi ? '🌬️ HÍT VÀO CHẬM RÃI...' : '🌬️ SLOW INHALE...';
      phaseBadge = vi ? 'HÍT VÀO' : 'INHALE';
      descText = vi ? 'Hít vào êm dịu bằng mũi, cảm nhận cơ hoành nở ra' : 'Inhale smoothly through nose, feeling abdomen expand';
      barWidth = `${((breathSecond + 1) / 4) * 100}%`;
      barColorClass = 'bg-gradient-to-r from-amber-400 to-amber-300';
    } else if (breathSecond < 8) {
      remainSec = 8 - breathSecond;
      phaseText = vi ? '⏸️ GIỮ YÊN HƠI THỞ...' : '⏸️ GENTLE HOLD...';
      phaseBadge = vi ? 'GIỮ YÊN' : 'HOLD';
      descText = vi ? 'Thả lỏng toàn thân, giữ hơi tĩnh lặng trong lồng ngực' : 'Relax your muscles, rest quietly in fullness';
      barWidth = '100%';
      barColorClass = 'bg-gradient-to-r from-purple-500 to-pink-400 animate-pulse';
    } else {
      remainSec = 16 - breathSecond;
      phaseText = vi ? '💨 THỞ RA THẬT ÊM...' : '💨 EXTENDED EXHALE...';
      phaseBadge = vi ? 'THỞ RA' : 'EXHALE';
      descText = vi ? 'Thở ra chậm rãi qua kẽ môi, trút bỏ mọi áp lực ra ngoài' : 'Exhale softly through relaxed lips, releasing all tension';
      barWidth = `${(remainSec / 8) * 100}%`;
      barColorClass = 'bg-gradient-to-r from-emerald-500 to-teal-300';
    }
  }

  const stepsList = [
    { num: 1, label: vi ? 'Thể Cảm' : 'Sensation' },
    { num: 2, label: vi ? 'Tần Số 432Hz' : 'Soundscape' },
    { num: 3, label: vi ? 'Thanh Trượt Thở' : 'Breathing' },
    { num: 4, label: vi ? 'Bẫy Tâm Trí' : 'Mind Trap' },
    { num: 5, label: vi ? 'Chú Mầm Sprout' : 'Sprout App' },
  ];

  // Default mind trap if not populated
  const defaultTrap = mindTraps?.[0] || {
    trap: vi
      ? 'Nếu bây giờ không ngủ được, ngày mai của mình coi như hỏng bét.'
      : 'If I do not fall asleep right now, tomorrow will be completely ruined.',
    reality: vi
      ? 'Nằm yên tĩnh lặng thả lỏng (Restful wakefulness) vẫn mang lại 70-80% giá trị phục hồi thể chất. Một đêm ngủ ít không phá hủy tương lai của bạn.'
      : 'Restful wakefulness lying quietly still restores 70-80% of physical cellular energy. One rough night will not break you.'
  };

  return (
    <div className="my-8 overflow-hidden rounded-3xl border-2 border-indigo-900/40 bg-gradient-to-b from-[#131b2e] via-[#0f172a] to-[#090d16] p-5 text-slate-100 shadow-2xl sm:p-8">
      
      {/* 1. Header Bar with Step Navigation */}
      <div className="border-b border-indigo-900/50 pb-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex h-3 w-3 rounded-full bg-amber-400"></span>
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
              {vi ? `BƯỚC ${currentStep}/5 • ` : `STEP ${currentStep}/5 • `}
              {stepsList[currentStep - 1].label.toUpperCase()}
            </span>
          </div>
          <span className="rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-300">
            🌙 Soulscape 30s Bedtime Landing
          </span>
        </div>

        {/* Interactive Step Pills */}
        <div className="mt-4 grid grid-cols-5 gap-1.5 sm:gap-2">
          {stepsList.map(s => {
            const isPassed = currentStep > s.num;
            const isCurrent = currentStep === s.num;
            return (
              <button
                key={s.num}
                type="button"
                onClick={() => goToStep(s.num)}
                className={`flex flex-col items-center justify-center rounded-xl p-2 text-center transition cursor-pointer ${
                  isCurrent
                    ? 'border border-amber-400/80 bg-amber-400/20 text-amber-300 shadow-md shadow-amber-400/10'
                    : isPassed
                    ? 'border border-indigo-800/80 bg-indigo-950/40 text-slate-300 hover:bg-indigo-900/40'
                    : 'border border-indigo-950/60 bg-slate-900/30 text-slate-500 hover:text-slate-400'
                }`}
              >
                <span className="text-[10px] font-black uppercase sm:text-xs">
                  {s.num}. {s.label}
                </span>
                <div className={`mt-1.5 h-1 w-full rounded-full ${
                  isCurrent ? 'bg-amber-400' : isPassed ? 'bg-indigo-400' : 'bg-slate-800'
                }`} />
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Step Contents */}
      <div className="py-6">

        {/* STEP 1: SOMATIC SIGNALS */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-bold text-white sm:text-2xl">
                {vi ? 'Đêm nay, cơ thể bạn đang cảm thấy nặng trĩu nhất ở đâu?' : 'Where is your body holding tension tonight?'}
              </h3>
              <p className="mt-1.5 text-xs text-slate-400 sm:text-sm">
                {vi ? 'Chạm vào cảm giác bạn đang nhận thấy lúc này để bắt đầu xoa dịu:' : 'Tap the physical sensation you notice right now to begin easing it:'}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3">
              {somaticSignals.body_signals.map((sig, idx) => {
                const isSelected = selectedSignal === sig;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSelectedSignal(sig);
                      trackClientEvent('onboarding_signal_selected', { articleSlug, locale, metadata: { signal: sig } });
                      trackClientEvent('quiz_started', {
                        articleSlug,
                        locale,
                        metadata: {
                          quiz_type: 'mindful_onboarding',
                          signal: sig,
                          step: 1,
                          total_steps: 5
                        }
                      });
                    }}
                    className={`flex items-center gap-3 rounded-2xl border p-4 text-left text-sm font-semibold transition cursor-pointer ${
                      isSelected
                        ? 'border-amber-400 bg-amber-400/15 text-amber-200 shadow-lg shadow-amber-400/10 scale-[1.01]'
                        : 'border-indigo-900/60 bg-indigo-950/30 text-slate-200 hover:border-indigo-700 hover:bg-indigo-900/40'
                    }`}
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-900/60 text-base">
                      {idx === 0 ? '🫀' : idx === 1 ? '💆' : idx === 2 ? '🦵' : idx === 3 ? '👁️' : '🌪️'}
                    </span>
                    <span>{sig}</span>
                  </button>
                );
              })}
            </div>

            {/* Empathic Transmutation Banner */}
            <div className="rounded-2xl border border-indigo-800/60 bg-gradient-to-r from-indigo-950/80 to-purple-950/60 p-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-purple-300">
                {vi ? 'HÀNH TRÌNH CHUYỂN HÓA CẢM XÚC' : 'SOMATIC TRANSMUTATION'}
              </p>
              <p className="mt-1 text-sm font-medium text-amber-200">
                ✨ {somaticSignals.transmutation}
              </p>
              {somaticSignals.triggers?.length ? (
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] text-slate-400">
                    {vi ? 'Tác nhân kích hoạt:' : 'Triggers:'}
                  </span>
                  {somaticSignals.triggers.map((t, idx) => (
                    <span key={idx} className="rounded-md border border-slate-700 bg-slate-800/80 px-2 py-0.5 text-[10px] text-slate-300">
                      {t}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>

            <button
              type="button"
              onClick={() => goToStep(2)}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 py-3.5 text-sm font-bold text-slate-950 shadow-lg shadow-amber-400/20 transition hover:brightness-105 active:scale-[0.99] cursor-pointer"
            >
              <span>{vi ? 'Tiếp tục sang Bước 2: Bật Tần Số Chữa Lành' : 'Continue to Step 2: Healing Soundscape'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* STEP 2: HEALING FREQUENCY 432Hz */}
        {currentStep === 2 && (
          <div className="space-y-6 text-center">
            {selectedSignal && (
              <span className="inline-block rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-300">
                {vi ? 'Đã ghi nhận thể cảm: ' : 'Targeting: '} <strong className="text-white">{selectedSignal}</strong>
              </span>
            )}

            <div>
              <h3 className="text-xl font-bold text-white sm:text-2xl">
                {vi ? 'Kích Hoạt Tần Số 432Hz & Chuông Gió Ru Ngủ' : 'Activate 432Hz Neuro-Calming Soundscape'}
              </h3>
              <p className="mt-1.5 text-xs text-slate-400 sm:text-sm">
                {vi ? 'Tần số 432Hz tự nhiên hỗ trợ hạ nhịp tim và giãn nở các bó cơ sau 15 giây:' : 'Natural 432Hz acoustic tone downregulates autonomic fight-or-flight within 15 seconds:'}
              </p>
            </div>

            {/* Circular Audio Button */}
            <div className="py-4">
              <button
                type="button"
                onClick={toggleAudio}
                className={`relative mx-auto flex h-24 w-24 items-center justify-center rounded-full text-white shadow-2xl transition duration-300 hover:scale-105 active:scale-95 cursor-pointer ${
                  isPlayingAudio
                    ? 'bg-gradient-to-tr from-emerald-600 to-teal-400 shadow-emerald-500/40 ring-4 ring-emerald-400/30 animate-pulse'
                    : 'bg-gradient-to-tr from-purple-600 via-indigo-600 to-amber-500 shadow-purple-500/40'
                }`}
              >
                {isPlayingAudio ? (
                  <Pause className="h-10 w-10 text-white" />
                ) : (
                  <Play className="ml-1 h-10 w-10 text-white" />
                )}
              </button>

              <p className={`mt-3 text-xs font-bold ${isPlayingAudio ? 'text-emerald-400' : 'text-slate-400'}`}>
                {isPlayingAudio
                  ? (vi ? '🎶 Đang phát tần số 432Hz thuần khiết... (Hạ nhịp tim)' : '🎶 432Hz calming tone active... (Slowing pulse)')
                  : (vi ? 'Chạm để nghe thử âm thoa 432Hz êm dịu' : 'Tap to play 432Hz calming tone')}
              </p>
            </div>

            <div className="flex flex-col gap-2.5 sm:flex-row">
              <button
                type="button"
                onClick={() => goToStep(1)}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-indigo-900 bg-indigo-950/40 px-4 py-3 text-xs font-semibold text-slate-400 transition hover:bg-indigo-900/40 cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>{vi ? 'Quay lại' : 'Back'}</span>
              </button>
              <button
                type="button"
                onClick={() => goToStep(3)}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 py-3.5 text-xs font-bold text-white shadow-lg shadow-purple-600/20 transition hover:opacity-95 cursor-pointer"
              >
                <span>{vi ? 'Đã bật âm thanh • Sang thanh trượt nhịp thở' : 'Sound ready • Go to breathing slider'}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: PACED BREATHING SLIDER (4-4-8) */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-bold text-white sm:text-2xl">
                {vi ? 'Nghi Thức Hạ Cánh & Thanh Trượt Nhịp Thở' : 'Bedtime Landing & Paced Breathing Slider'}
              </h3>
              <p className="mt-1.5 text-xs text-slate-400 sm:text-sm">
                {vi ? 'Nhìn theo số đếm to ở giữa thanh trượt để đồng bộ hơi thở trên nệm' : 'Follow the large centered countdown number to synchronize your heart rate'}
              </p>
            </div>

            {/* Slider Container Card */}
            <div className="rounded-2xl border border-indigo-800/80 bg-indigo-950/40 p-5 shadow-inner">
              <div className="text-center pb-2">
                <span className="text-base font-bold uppercase tracking-wider text-amber-300">
                  {phaseText}
                </span>
                <p className="mt-0.5 text-xs text-slate-400 min-h-[18px]">{descText}</p>
              </div>

              {/* Big Slider Track with Large Centered Number */}
              <div className="my-4">
                <div className="relative h-16 w-full overflow-hidden rounded-2xl bg-slate-900/90 p-1.5 border-2 border-indigo-700/60 flex items-center shadow-inner">
                  <div
                    className={`h-full rounded-xl transition-all duration-1000 ease-linear shadow-sm ${barColorClass}`}
                    style={{ width: barWidth }}
                  />
                  {/* BIG CENTERED NUMBER & BADGE */}
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center gap-2.5 z-10">
                    <span className="text-4xl font-black tracking-tight text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                      {isBreathing ? remainSec : 0}
                    </span>
                    <span className="text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-md bg-slate-900/90 text-amber-300 border border-amber-400/40 shadow-sm">
                      {phaseBadge}
                    </span>
                  </div>
                </div>
              </div>

              {/* Breathing Controls */}
              <div className="flex items-center justify-between gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    if (isBreathing) {
                      setIsBreathing(false);
                    } else {
                      setBreathSecond(0);
                      setIsBreathing(true);
                    }
                  }}
                  className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition shadow-sm cursor-pointer ${
                    isBreathing
                      ? 'bg-slate-800 text-amber-300 hover:bg-slate-700 border border-amber-400/30'
                      : 'bg-amber-400 text-slate-950 hover:bg-amber-300'
                  }`}
                >
                  {isBreathing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                  <span>{isBreathing ? (vi ? 'Tạm dừng nhịp thở' : 'Pause breathing') : (vi ? 'Bắt đầu thở' : 'Start breathing')}</span>
                </button>
                <span className="text-[11px] text-slate-400">
                  {vi ? '✨ Làm 2–3 chu kỳ (16s/chu kỳ) để cơ thể tự chùng xuống' : '✨ Practice 2–3 cycles to ease heart rate'}
                </span>
              </div>
            </div>

            {/* 3 Bedtime Donts */}
            {winddownProtocol.donts?.length ? (
              <div className="rounded-2xl border border-rose-900/50 bg-rose-950/20 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-rose-300">
                  ⚠️ {vi ? '3 Điều Tuyệt Đối Không Làm Lúc Nửa Đêm' : '3 Things Never To Do At Midnight'}
                </p>
                <ul className="mt-2 space-y-1.5 text-xs text-rose-200/90">
                  {winddownProtocol.donts.map((dont, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-rose-400 font-bold">•</span>
                      <span>{dont}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="flex flex-col gap-2.5 sm:flex-row">
              <button
                type="button"
                onClick={() => goToStep(2)}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-indigo-900 bg-indigo-950/40 px-4 py-3 text-xs font-semibold text-slate-400 transition hover:bg-indigo-900/40 cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>{vi ? 'Quay lại' : 'Back'}</span>
              </button>
              <button
                type="button"
                onClick={() => goToStep(4)}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 py-3.5 text-xs font-bold text-slate-950 shadow-lg shadow-amber-400/20 transition hover:brightness-105 cursor-pointer"
              >
                <span>{vi ? 'Đã thở êm • Sang bóc mẽ bẫy suy nghĩ' : 'Breathing steady • Unlock mind traps'}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: MIND TRAPS FLIP CARD */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-bold text-white sm:text-2xl">
                {vi ? 'Bóc Mẽ Bẫy Suy Nghĩ Đêm Muộn (The Mind Trap)' : 'Deconstruct Midnight Mind Traps'}
              </h3>
              <p className="mt-1.5 text-xs text-slate-400 sm:text-sm">
                {vi ? 'Chạm vào thẻ bài để lật mở sự thật y sinh giải phóng âu lo:' : 'Tap the card below to flip and reveal the liberating somatic truth:'}
              </p>
            </div>

            {/* 3D Flip Card Container */}
            <div
              onClick={() => setCardFlipped(!cardFlipped)}
              className="group mx-auto max-w-lg cursor-pointer"
            >
              <div
                className={`relative min-h-[160px] w-full rounded-2xl border transition-all duration-300 ${
                  cardFlipped
                    ? 'border-emerald-500/80 bg-gradient-to-br from-emerald-950/80 to-slate-900 shadow-xl shadow-emerald-500/10'
                    : 'border-amber-500/80 bg-gradient-to-br from-amber-950/60 to-slate-900 shadow-xl shadow-amber-500/10'
                }`}
              >
                {/* Front Side */}
                {!cardFlipped ? (
                  <div className="p-6 text-center">
                    <span className="inline-block rounded-full bg-rose-500/20 px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider text-rose-300 border border-rose-500/30">
                      ❌ {vi ? 'Bẫy suy nghĩ lúc 2 giờ sáng' : 'Midnight Mental Trap'}
                    </span>
                    <p className="mt-3 text-base font-semibold text-amber-200 leading-snug">
                      &ldquo;{defaultTrap.trap}&rdquo;
                    </p>
                    <span className="mt-4 inline-block text-xs font-semibold text-slate-400 group-hover:text-amber-300 transition">
                      👆 {vi ? 'Chạm để lật mở sự thật khoa học' : 'Tap to reveal scientific truth'}
                    </span>
                  </div>
                ) : (
                  /* Back Side */
                  <div className="p-6 text-center">
                    <span className="inline-block rounded-full bg-emerald-500/20 px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider text-emerald-300 border border-emerald-500/30">
                      ✅ {vi ? 'Sự thật y sinh chữa lành' : 'Somatic Scientific Reality'}
                    </span>
                    <p className="mt-3 text-sm font-medium text-slate-100 leading-relaxed">
                      {defaultTrap.reality}
                    </p>
                    <span className="mt-4 inline-block text-xs font-semibold text-emerald-300">
                      ✨ {vi ? 'Đêm nay bạn hoàn toàn an toàn' : 'You are safe tonight'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2.5 sm:flex-row">
              <button
                type="button"
                onClick={() => goToStep(3)}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-indigo-900 bg-indigo-950/40 px-4 py-3 text-xs font-semibold text-slate-400 transition hover:bg-indigo-900/40 cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>{vi ? 'Quay lại' : 'Back'}</span>
              </button>
              <button
                type="button"
                onClick={() => goToStep(5)}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 py-3.5 text-xs font-bold text-white shadow-lg shadow-purple-600/20 transition hover:opacity-95 cursor-pointer"
              >
                <span>{vi ? 'Hoàn tất 30s hạ cánh • Đón Chú Mầm Sprout' : 'Complete 30s landing • Meet Sprout'}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: COMPLETED & SPROUT CONVERSION */}
        {currentStep === 5 && (
          <div className="space-y-6 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-emerald-500/40 bg-gradient-to-tr from-emerald-500/20 to-teal-400/20 text-4xl shadow-xl shadow-emerald-500/20">
              🌱
            </div>

            <div>
              <h3 className="text-2xl font-bold text-white sm:text-3xl">
                {vi ? 'Bạn Đã Hạ Cánh An Toàn!' : 'You Have Landed Safely!'}
              </h3>
              <p className="mt-2 text-sm text-slate-300">
                {vi ? 'Đêm nay, ' : 'Tonight, '}
                <strong className="text-amber-300">
                  {somaticQuiz?.recommended_sprout || (vi ? 'Chú Mầm Bình An (Calm Sprout)' : 'Calm Sprout')}
                </strong>
                {vi ? ' sẽ đồng hành canh giữ giấc ngủ êm đềm cho bạn.' : ' will keep gentle watch over your slumber.'}
              </p>
            </div>

            <div className="mx-auto max-w-md rounded-2xl border border-indigo-800/80 bg-indigo-950/60 p-4 text-left text-xs text-slate-300 leading-relaxed">
              <p>
                {vi
                  ? 'Trình duyệt web sẽ tự dừng phát khi bạn khóa màn hình máy. Để hẹn giờ tần số 432Hz ru ngủ liên tục 8 tiếng và nuôi dưỡng chú mầm không áp lực chuỗi ngày (Zero Streak Guilt):'
                  : 'Mobile web browsers stop audio when your phone locks. To set an 8-hour continuous 432Hz sleep timer and care for your Sprout with zero streak guilt:'}
              </p>
            </div>

            {/* App download buttons */}
            <div className="mx-auto flex max-w-md flex-col gap-3 sm:flex-row">
              <a
                href={somaticQuiz?.app_store_url || 'https://apps.apple.com/us/app/soulscape-emotion-poke-diary/id6769265902'}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackClientEvent('onboarding_app_download_click', { articleSlug, locale, metadata: { store: 'app_store' } })}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-white py-3 text-xs font-bold text-slate-900 shadow-md transition hover:bg-slate-100 active:scale-95"
              >
                <span className="text-sm"></span>
                <span>App Store (iOS)</span>
              </a>
              <a
                href={somaticQuiz?.play_store_url || 'https://play.google.com/store/apps/details?id=app.soulscape.world'}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackClientEvent('onboarding_app_download_click', { articleSlug, locale, metadata: { store: 'google_play' } })}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-800/80 py-3 text-xs font-bold text-white shadow-md transition hover:bg-slate-700 active:scale-95"
              >
                <span>▶</span>
                <span>Google Play (Android)</span>
              </a>
            </div>

            {/* Somatic Bedside Protocol Email Lead Capture */}
            <div className="mx-auto max-w-md rounded-2xl border border-amber-400/30 bg-gradient-to-b from-[#131b2e] to-[#0c1220] p-5 text-left shadow-lg">
              <div className="flex items-center gap-2 text-amber-300">
                <Mail className="h-4 w-4" />
                <h4 className="text-xs font-bold uppercase tracking-wider">
                  {vi ? 'Cẩm Nang Đêm Muộn (PDF 3 Phút)' : 'Midnight Somatic Guide (3-Min PDF)'}
                </h4>
              </div>
              <p className="mt-1.5 text-xs text-slate-300 leading-relaxed">
                {vi
                  ? 'Nhận trọn bộ Nghi thức hạ cánh 3 bước & Lộ trình làm dịu thần kinh 5 ngày gửi trực tiếp về email để mở đọc ngay trên giường khi thức giấc 2h sáng.'
                  : 'Receive the full 3-step bedside winddown protocol & 5-day calming roadmap sent straight to your inbox to open in bed at 2 AM.'}
              </p>

              {leadSubmitted ? (
                <div className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-950/70 border border-emerald-500/40 px-3.5 py-2.5 text-xs font-medium text-emerald-300">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                  <span>{vi ? '✨ Đã ghi nhận! Cẩm nang sẽ được gửi đến email của bạn.' : '✨ Saved! The guide will be sent to your email.'}</span>
                </div>
              ) : (
                <form onSubmit={handleLeadSubmit} className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <input
                    type="email"
                    value={leadEmail}
                    onChange={(e) => setLeadEmail(e.target.value)}
                    placeholder={vi ? 'Nhập email của bạn...' : 'Enter your email...'}
                    required
                    className="flex-1 rounded-xl border border-slate-700 bg-slate-900/90 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
                  />
                  <button
                    type="submit"
                    disabled={leadSubmitting}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-amber-400 px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-300 active:scale-95 transition disabled:opacity-50 cursor-pointer shrink-0"
                  >
                    <span>{leadSubmitting ? (vi ? 'Đang gửi...' : 'Sending...') : (vi ? 'Nhận PDF' : 'Get PDF')}</span>
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </form>
              )}
              {leadError && <p className="mt-2 text-[11px] text-rose-400">{leadError}</p>}
            </div>

            {/* Reset / Explore options */}
            <div className="pt-2 flex items-center justify-center gap-4 text-xs text-slate-400">
              <button
                type="button"
                onClick={() => goToStep(1)}
                className="flex items-center gap-1.5 hover:text-amber-300 transition cursor-pointer"
              >
                <RotateCcw className="h-3 w-3" />
                <span>{vi ? 'Thực hiện lại từ Bước 1' : 'Restart from Step 1'}</span>
              </button>
              <span>•</span>
              <a
                href="#full-article"
                onClick={() => onExpandArticle?.()}
                className="hover:text-amber-300 transition cursor-pointer"
              >
                {vi ? '📖 Đọc bài phân tích chuyên sâu bên dưới' : '📖 Read in-depth article below'}
              </a>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
