'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Moon, Sparkles, HeartPulse, Volume2, VolumeX, Play, Pause,
  ArrowRight, ShieldCheck, CheckCircle2, Mail, Send, Download,
  BookOpen, RotateCcw, Bed, Check, ExternalLink, Headphones, Flower2
} from 'lucide-react';
import type { Portal } from '@/data/wellness-portals';
import type { WellnessLocale } from '@/data/wellness';
import type { PublishedArticle } from '@/lib/published-articles';
import { ArticleCard } from './ArticleCard';
import { VideoCard, type VideoItem } from './VideoCard';
import { trackClientEvent } from '@/components/analytics/AnalyticsTracker';

interface HealingSanctuaryHubProps {
  locale: WellnessLocale;
  portal: Portal;
  articles: PublishedArticle[];
  videos: VideoItem[];
}

export function HealingSanctuaryHub({
  locale,
  portal,
  articles,
  videos
}: HealingSanctuaryHubProps) {
  const vi = locale === 'vi';
  const allGuidesUrl = vi ? '/vi/song-khoe/huong-dan' : '/en/wellness/guides';

  // Hero interactive mode: 'audio' | 'screener'
  const [activeHeroTab, setActiveHeroTab] = useState<'audio' | 'screener'>('audio');

  // --- AUDIO FREQUENCY (432Hz sine tone) ---
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  const toggleAudio = () => {
    if (!isPlayingAudio) {
      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new AudioCtx();
        audioCtxRef.current = ctx;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(432, ctx.currentTime);

        gain.gain.setValueAtTime(0.01, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 1.5);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();

        oscRef.current = osc;
        gainRef.current = gain;
        setIsPlayingAudio(true);

        trackClientEvent('onboarding_audio_start', { locale, metadata: { hz: 432, source: 'healing_hub' } });
      } catch (e) {
        console.error('Audio start error:', e);
      }
    } else {
      if (oscRef.current) {
        try { oscRef.current.stop(); } catch {}
      }
      if (audioCtxRef.current) {
        try { audioCtxRef.current.close(); } catch {}
      }
      setIsPlayingAudio(false);
    }
  };

  useEffect(() => {
    return () => {
      if (oscRef.current) {
        try { oscRef.current.stop(); } catch {}
      }
      if (audioCtxRef.current) {
        try { audioCtxRef.current.close(); } catch {}
      }
    };
  }, []);

  // --- 15-SECOND SOMATIC SCREENER ---
  const [quizStep, setQuizStep] = useState(1);
  const [quizAnswers, setQuizAnswers] = useState<{ q1?: string; q2?: string; q3?: string }>({});

  const questions = [
    {
      id: 'q1',
      title: vi ? 'Đêm nay cơ thể bạn đang phản ứng thế nào?' : 'What is your physical body experiencing tonight?',
      options: vi
        ? [
            { label: 'Vai gáy gồng cứng / Cổ căng tức', value: 'tension' },
            { label: 'Lồng ngực nghẹn / Hơi thở nông, ngắn', value: 'chest' },
            { label: 'Chân tay bồn chồn / Khó nằm yên một chỗ', value: 'restless' },
            { label: 'Đầu óc ong ong / Mắt khô mỏi nhưng không ngủ được', value: 'overheated' }
          ]
        : [
            { label: 'Shoulders clenched / Stiff neck & jaw', value: 'tension' },
            { label: 'Tight chest / Shallow, rapid breathing', value: 'chest' },
            { label: 'Restless legs / Tossing and turning', value: 'restless' },
            { label: 'Racing head / Tired eyes but wide awake', value: 'overheated' }
          ]
    },
    {
      id: 'q2',
      title: vi ? 'Luồng suy nghĩ nào đang chiếm trọn tâm trí bạn?' : 'What thoughts are keeping you awake?',
      options: vi
        ? [
            { label: 'Tua lại sai lầm hoặc cuộc trò chuyện trong ngày', value: 'ruminating' },
            { label: 'Lo lắng về ngày mai / Danh sách việc chưa xong', value: 'anticipating' },
            { label: 'Tiếc nuối vì cả ngày chưa có chút thời gian tự do', value: 'revenge' },
            { label: 'Mệt mỏi và tự trách bản thân vì sao chưa ngủ', value: 'guilt' }
          ]
        : [
            { label: 'Replaying today\'s mistakes or conversations', value: 'ruminating' },
            { label: 'Worrying about tomorrow / Endless to-do list', value: 'anticipating' },
            { label: 'Craving free time you missed out on all day', value: 'revenge' },
            { label: 'Frustrated and guilty for still being awake', value: 'guilt' }
          ]
    },
    {
      id: 'q3',
      title: vi ? 'Bạn mong muốn điều gì nhất trong đêm nay?' : 'What do you need most right now?',
      options: vi
        ? [
            { label: 'Một khoảng lặng để thở mà không phải suy nghĩ', value: 'silence' },
            { label: 'Âm thanh êm dịu dẫn lối chìm vào giấc ngủ', value: 'sound' },
            { label: 'Cảm giác an toàn, biết rằng mình không đơn độc', value: 'presence' },
            { label: 'Giải tỏa mặc cảm tội lỗi vì mất ngủ', value: 'acceptance' }
          ]
        : [
            { label: 'A quiet pause to breathe without overthinking', value: 'silence' },
            { label: 'A soothing soundscape to guide me into sleep', value: 'sound' },
            { label: 'A feeling of safety, knowing I am not alone', value: 'presence' },
            { label: 'Freedom from the guilt of insomnia', value: 'acceptance' }
          ]
    }
  ];

  const handleSelectOption = (questionId: 'q1' | 'q2' | 'q3', value: string) => {
    setQuizAnswers(prev => ({ ...prev, [questionId]: value }));

    // Track initial start when answering Q1
    if (quizStep === 1) {
      trackClientEvent('quiz_started', {
        locale,
        metadata: {
          source: 'healing_hub_screener',
          quiz_type: 'somatic_screener',
          question_id: questionId,
          value,
          total_questions: 3
        }
      });
    } else if (quizStep < 3) {
      // Track intermediate steps (Q2)
      trackClientEvent('quiz_step_progress', {
        locale,
        metadata: {
          source: 'healing_hub_screener',
          quiz_type: 'somatic_screener',
          step: quizStep,
          question_id: questionId,
          value,
          total_questions: 3
        }
      });
    }

    if (quizStep < 3) {
      setQuizStep(prev => prev + 1);
    } else {
      setQuizStep(4); // completed
      trackClientEvent('quiz_completed', {
        locale,
        metadata: {
          source: 'healing_hub_screener',
          quiz_type: 'somatic_screener',
          answers: { ...quizAnswers, [questionId]: value },
          total_questions: 3
        }
      });
    }
  };

  const getRecommendedSprout = () => {
    if (quizAnswers.q1 === 'tension' || quizAnswers.q2 === 'anticipating') {
      return {
        name: vi ? 'Chú Mầm Bình An (Calm Sprout)' : 'Calm Sprout',
        desc: vi ? 'Giúp bạn buông lỏng đôi vai, trả lại gánh nặng của ngày mai và neo giữ nhịp thở êm đềm.' : 'Gently releases shoulder tension and holds grounded breathing space.'
      };
    }
    if (quizAnswers.q2 === 'ruminating' || quizAnswers.q1 === 'chest') {
      return {
        name: vi ? 'Chú Mầm Thấu Cảm (Worry Sprout)' : 'Worry Sprout',
        desc: vi ? 'Đồng hành lắng nghe những tâm tư chưa nói, ôm lấy cảm giác bất an mà không phán xét.' : 'Compassionately holds your unsaid thoughts without judgment.'
      };
    }
    return {
      name: vi ? 'Chú Mầm Thư Giãn (Restful Sprout)' : 'Restful Sprout',
      desc: vi ? 'Vỗ về giấc ngủ sâu, ru dịu hệ thần kinh giao cảm và xua tan mặc cảm thao thức 2h sáng.' : 'Soothes your sympathetic nervous system for deep restorative rest.'
    };
  };

  // --- EMAIL LEAD CAPTURE ---
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@') || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          locale,
          source: 'somatic_haven_hub'
        })
      });

      if (!res.ok) throw new Error('Subscription failed');
      setIsSubmitted(true);
      trackClientEvent('lead_submit', {
        locale,
        metadata: { source: 'somatic_haven_hub' }
      });
    } catch {
      setErrorMessage(vi ? 'Có lỗi xảy ra, vui lòng thử lại.' : 'An error occurred, please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const sprout = getRecommendedSprout();

  return (
    <div className="min-h-screen bg-[#060911] text-slate-100">
      {/* 🌙 AMBIENT HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#060911] via-[#0a0f1d] to-[#0f172a] px-4 pt-12 pb-20 sm:px-6 lg:px-8 border-b border-indigo-950/60">
        {/* Ambient Glows */}
        <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-indigo-500/10 via-purple-500/5 to-transparent blur-3xl" />
        <div className="pointer-events-none absolute -top-24 left-1/4 h-72 w-72 rounded-full bg-amber-400/5 blur-3xl" />

        <div className="relative mx-auto max-w-5xl">
          {/* Top Pill */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-amber-300 shadow-sm backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5" />
              <span>MINDFUL HAVEN · SOULSCAPE SANCTUARY · ZERO STREAK GUILT</span>
            </div>

            {/* Headline */}
            <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-5xl lg:text-6xl text-white leading-[1.15]">
              {vi ? 'Nơi Những Thao Thức 2h Sáng' : 'A Softer Place to Land'}
              <br />
              <span className="bg-gradient-to-r from-amber-200 via-indigo-200 to-purple-300 bg-clip-text text-transparent">
                {vi ? 'Được Lắng Nghe & Ôm Lấy' : 'When Midnight Feels Too Heavy'}
              </span>
            </h1>

            {/* Empathy Subtitle */}
            <p className="mt-4 text-sm text-slate-300 sm:text-base max-w-2xl mx-auto leading-relaxed">
              {vi
                ? 'Không phán xét. Không áp lực chuỗi ngày điểm danh. Chỉ có tần số ru ngủ 432Hz êm dịu, trắc nghiệm thể cảm 15 giây và cẩm nang hạ cánh thực tế trên giường.'
                : 'No streak pressure. No toxic positivity. Just gentle 432Hz sleep frequencies, 15-second somatic checks, and neuroscience-grounded bedside rituals.'}
            </p>

            {/* 3 Non-judgmental Pledges */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-slate-400">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                {vi ? 'Không phán xét vì mất ngủ' : 'Zero-judgment for insomnia'}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                {vi ? 'Không ép chuỗi ngày (Zero Streak Guilt)' : 'Zero streak guilt'}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                {vi ? 'Khoa học thể cảm & thần kinh học' : 'Somatic & polyvagal science'}
              </span>
            </div>
          </div>

          {/* 🌿 INTERACTIVE SANCTUARY CONSOLE DIRECTLY IN HERO */}
          <div className="mt-10 mx-auto max-w-2xl rounded-3xl border border-indigo-800/60 bg-gradient-to-br from-[#0c1222]/90 to-[#11182c]/90 p-6 sm:p-8 shadow-2xl shadow-black/40 backdrop-blur-xl">
            {/* Tabs */}
            <div className="flex items-center justify-center gap-2 border-b border-indigo-900/60 pb-5">
              <button
                type="button"
                onClick={() => setActiveHeroTab('audio')}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition cursor-pointer ${
                  activeHeroTab === 'audio'
                    ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                    : 'text-indigo-300 hover:text-white bg-indigo-950/40 border border-indigo-800/40'
                }`}
              >
                <Headphones className="h-3.5 w-3.5" />
                <span>{vi ? 'Tần số ru ngủ 432Hz' : '432Hz Sleep Sound'}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveHeroTab('screener')}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition cursor-pointer ${
                  activeHeroTab === 'screener'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-indigo-300 hover:text-white bg-indigo-950/40 border border-indigo-800/40'
                }`}
              >
                <HeartPulse className="h-3.5 w-3.5" />
                <span>{vi ? 'Trắc nghiệm thể cảm (15s)' : 'Somatic Check (15s)'}</span>
              </button>
            </div>

            {/* TAB 1: AUDIO FREQUENCY */}
            {activeHeroTab === 'audio' && (
              <div className="mt-6 text-center space-y-5">
                <div className="flex items-center justify-center">
                  <button
                    type="button"
                    onClick={toggleAudio}
                    className={`group relative flex h-24 w-24 items-center justify-center rounded-3xl border transition-all duration-300 cursor-pointer ${
                      isPlayingAudio
                        ? 'border-amber-400 bg-amber-400 text-slate-950 shadow-2xl shadow-amber-400/40 scale-105'
                        : 'border-indigo-700/60 bg-indigo-950/70 text-amber-300 hover:border-amber-400/60 hover:bg-indigo-900/80 shadow-lg'
                    }`}
                  >
                    {isPlayingAudio ? (
                      <Pause className="h-10 w-10 animate-pulse" />
                    ) : (
                      <Play className="h-10 w-10 translate-x-0.5" />
                    )}
                  </button>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white">
                    {isPlayingAudio
                      ? (vi ? '🌿 Đang phát Tần Số Ru Ngủ 432Hz...' : '🌿 Playing 432Hz Sleep Frequency...')
                      : (vi ? 'Chạm để phát Tần Số 432Hz (Web Audio)' : 'Tap to play 432Hz Frequency')}
                  </h3>
                  <p className="mt-1.5 text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                    {vi
                      ? 'Sóng âm sin 432Hz thuần khiết được tạo trực tiếp trên trình duyệt, hỗ trợ đồng bộ nhịp tim và đưa sóng não về trạng thái Alpha/Theta tĩnh lặng.'
                      : 'Pure 432Hz sine wave generated directly in your browser, helping synchronize heart rate and guiding brainwaves into calm Alpha/Theta state.'}
                  </p>
                </div>

                {/* Visualizer bars */}
                <div className="flex items-center justify-center gap-1.5 h-6">
                  {[40, 70, 30, 90, 50, 80, 45, 65, 35, 75].map((h, i) => (
                    <span
                      key={i}
                      style={{ height: isPlayingAudio ? `${h}%` : '20%' }}
                      className={`w-1 rounded-full transition-all duration-300 ${
                        isPlayingAudio ? 'bg-amber-400 animate-pulse' : 'bg-indigo-900/60'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* TAB 2: 15-SECOND SOMATIC SCREENER */}
            {activeHeroTab === 'screener' && (
              <div className="mt-6">
                {quizStep <= 3 ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs text-slate-400 border-b border-indigo-900/40 pb-2">
                      <span className="font-semibold text-amber-300 uppercase tracking-wider">
                        {vi ? `Câu hỏi ${quizStep} / 3` : `Question ${quizStep} / 3`}
                      </span>
                      <span>15s Screener</span>
                    </div>

                    <h4 className="text-base font-bold text-white leading-snug">
                      {questions[quizStep - 1].title}
                    </h4>

                    <div className="grid gap-2 sm:grid-cols-2 pt-2">
                      {questions[quizStep - 1].options.map((opt, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleSelectOption(questions[quizStep - 1].id as 'q1' | 'q2' | 'q3', opt.value)}
                          className="flex items-center gap-2.5 rounded-2xl border border-indigo-800/60 bg-indigo-950/40 p-3.5 text-left text-xs font-medium text-slate-200 hover:border-amber-400/60 hover:bg-indigo-900/60 hover:text-white transition cursor-pointer active:scale-95"
                        >
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-900/80 text-[10px] font-bold text-amber-300">
                            {i + 1}
                          </span>
                          <span className="leading-relaxed">{opt.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* QUIZ RESULT */
                  <div className="space-y-5 text-center py-2 animate-in fade-in duration-300">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-400/20 border border-emerald-500/40 text-3xl shadow-lg shadow-emerald-500/10">
                      🌱
                    </div>

                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                        {vi ? 'CHÚ MẦM CỦA BẠN ĐÊM NAY' : 'YOUR SPROUT TONIGHT'}
                      </span>
                      <h4 className="mt-1 text-xl font-bold text-white">
                        {sprout.name}
                      </h4>
                      <p className="mt-1.5 text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                        {sprout.desc}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setQuizStep(1);
                          setQuizAnswers({});
                        }}
                        className="flex items-center gap-1.5 rounded-xl border border-indigo-800/60 bg-indigo-950/40 px-3.5 py-2 text-xs font-semibold text-slate-400 hover:text-white transition cursor-pointer"
                      >
                        <RotateCcw className="h-3 w-3" />
                        <span>{vi ? 'Làm lại trắc nghiệm' : 'Restart check'}</span>
                      </button>
                      <a
                        href="#conversion-funnel"
                        className="flex items-center gap-1.5 rounded-xl bg-amber-400 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-300 transition cursor-pointer shadow-md"
                      >
                        <span>{vi ? 'Nhận quà & Tải App ↓' : 'Get Gift & App ↓'}</span>
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 🎁 DUAL CONVERSION HUB (APP DOWNLOADS + PDF LEAD CAPTURE) */}
      <section id="conversion-funnel" className="relative px-4 py-16 sm:px-6 lg:px-8 bg-gradient-to-b from-[#0f172a] via-[#0c1220] to-[#060911] border-b border-indigo-950/60 scroll-mt-10">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-10">
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">
              {vi ? 'BƯỚC TIẾP THEO CHO BẠN' : 'YOUR NEXT GENTLE STEP'}
            </span>
            <h2 className="mt-2 text-2xl font-black text-white sm:text-4xl">
              {vi ? 'Kết Nối Trọn Vẹn Cùng Soulscape' : 'Deepen Your Bedtime Practice'}
            </h2>
            <p className="mt-2 text-xs text-slate-400 sm:text-sm max-w-xl mx-auto">
              {vi
                ? 'Tải ứng dụng để hẹn giờ tần số ru ngủ 8 tiếng hoặc nhận cẩm nang bỏ túi gửi trực tiếp vào email để mở lại trên giường.'
                : 'Download the app for 8-hour continuous background sleep audio, or receive the pocket PDF bedtime guide in your inbox.'}
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-2 items-stretch">
            {/* CARD 1: APP DOWNLOAD (SOULSCAPE) */}
            <div className="flex flex-col justify-between rounded-3xl border border-indigo-700/40 bg-gradient-to-br from-[#12192e] to-[#0b101e] p-6 sm:p-8 shadow-xl shadow-indigo-950/30">
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 text-white shadow-md text-xl">
                    🌱
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-purple-300">
                      SOULSCAPE APP · ZERO STREAK GUILT
                    </span>
                    <h3 className="text-lg font-bold text-white sm:text-xl">
                      Soulscape: Emotion & Sleep
                    </h3>
                  </div>
                </div>

                <p className="mt-4 text-xs text-slate-300 sm:text-sm leading-relaxed">
                  {vi
                    ? 'Trình duyệt web sẽ tự dừng phát khi bạn khóa màn hình. Hãy tải app Soulscape để hẹn giờ tần số 432Hz ru ngủ 8 tiếng xuyên màn đêm, và chăm sóc Chú Mầm cảm xúc không áp lực chuỗi ngày.'
                    : 'Web browsers stop audio when your screen locks. Download Soulscape for continuous 8-hour sleep frequencies and care for your Sprout with zero streak pressure.'}
                </p>

                <div className="mt-4 space-y-2 text-xs text-indigo-200/80">
                  <div className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span>{vi ? 'Phát âm thanh chạy ngầm khi khóa màn hình' : 'Background lock-screen audio playback'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span>{vi ? 'Hẹn giờ tắt tự động thông minh (Sleep Timer)' : 'Smart sleep auto-off timer'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span>{vi ? 'Không phạt mất chuỗi, không tạo mặc cảm tội lỗi' : 'Zero streak guilt, no guilt-tripping'}</span>
                  </div>
                </div>
              </div>

              {/* 2 App Buttons */}
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href="https://apps.apple.com/us/app/soulscape-emotion-poke-diary/id6769265902"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackClientEvent('onboarding_app_download_click', { locale, metadata: { store: 'app_store', source: 'healing_hub' } })}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-white py-3 px-4 text-xs font-bold text-slate-900 shadow-lg hover:bg-slate-100 transition active:scale-95"
                >
                  <span className="text-base"></span>
                  <span>App Store (iOS)</span>
                </a>
                <a
                  href="https://play.google.com/store/apps/details?id=app.soulscape.world"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackClientEvent('onboarding_app_download_click', { locale, metadata: { store: 'google_play', source: 'healing_hub' } })}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-800/90 py-3 px-4 text-xs font-bold text-white shadow-lg hover:bg-slate-700 transition active:scale-95"
                >
                  <span className="text-sm">▶</span>
                  <span>Google Play (Android)</span>
                </a>
              </div>
            </div>

            {/* CARD 2: BEDSIDE PROTOCOL PDF EMAIL CAPTURE */}
            <div className="flex flex-col justify-between rounded-3xl border border-amber-400/30 bg-gradient-to-br from-[#1c1822] via-[#14121a] to-[#0c0a10] p-6 sm:p-8 shadow-xl shadow-amber-950/20">
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400/20 text-amber-300 border border-amber-400/30 shadow-md">
                    <Mail className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                      LEAD MAGNET · MIỄN PHÍ 100%
                    </span>
                    <h3 className="text-lg font-bold text-white sm:text-xl">
                      {vi ? 'Cẩm Nang Hạ Cánh 3 Phút (PDF)' : 'Midnight Somatic Guide (PDF)'}
                    </h3>
                  </div>
                </div>

                <p className="mt-4 text-xs text-slate-300 sm:text-sm leading-relaxed">
                  {vi
                    ? 'Nhận trọn bộ Nghi thức hạ cánh trên nệm 3 bước & Lộ trình làm dịu hệ thần kinh 5 ngày gửi thẳng về email để bạn mở ra đọc trên giường mỗi khi thức giấc lúc 2h sáng.'
                    : 'Receive the 3-step bedside winddown protocol & 5-day nervous system reset roadmap sent to your inbox to open in bed at 2 AM.'}
                </p>

                <div className="mt-4 space-y-2 text-xs text-amber-200/80">
                  <div className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                    <span>{vi ? '3 Bước hạ nhiệt thần kinh không cần rời giường' : '3 In-bed reset steps without turning on lights'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                    <span>{vi ? '5 Điều cấm kỵ khiến vỏ não bị kích thích đêm' : '5 Late-night habits that trigger cortisol spikes'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                    <span>{vi ? 'Bảng đối chiếu bẫy suy nghĩ vs Sự thật y sinh' : 'Midnight Cognitive Traps vs Somatic Realities'}</span>
                  </div>
                </div>
              </div>

              {/* Form Input */}
              <div className="mt-8">
                {isSubmitted ? (
                  <div className="flex items-center gap-2.5 rounded-2xl bg-emerald-950/70 border border-emerald-500/40 p-4 text-xs font-semibold text-emerald-300 shadow-md">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
                    <span>{vi ? '✨ Đã ghi nhận! Cẩm nang sẽ được gửi ngay đến hòm thư của bạn.' : '✨ Saved! The guide will be sent to your email.'}</span>
                  </div>
                ) : (
                  <form onSubmit={handleLeadSubmit} className="flex flex-col gap-2.5 sm:flex-row">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={vi ? 'Nhập email của bạn...' : 'Enter your email...'}
                      required
                      className="flex-1 rounded-2xl border border-slate-700 bg-slate-900/90 px-4 py-3.5 text-xs text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
                    />
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex items-center justify-center gap-2 rounded-2xl bg-amber-400 px-6 py-3.5 text-xs font-bold text-slate-950 hover:bg-amber-300 transition active:scale-95 disabled:opacity-50 cursor-pointer shrink-0 shadow-lg shadow-amber-400/20"
                    >
                      <span>{isSubmitting ? (vi ? 'Đang gửi...' : 'Sending...') : (vi ? 'Nhận Cẩm Nang' : 'Get PDF')}</span>
                      <Send className="h-3.5 w-3.5" />
                    </button>
                  </form>
                )}
                {errorMessage && <p className="mt-2 text-xs text-rose-400">{errorMessage}</p>}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 🎬 COMPANION MINDFUL REELS */}
      {videos.length > 0 && (
        <section className="px-4 py-16 sm:px-6 lg:px-8 bg-[#0a0f1d] border-b border-indigo-950/60">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pb-6 border-b border-indigo-900/40">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">
                  {vi ? 'THƯỚC PHIM ĐỒNG HÀNH' : 'MINDFUL COMPANION REELS'}
                </span>
                <h2 className="mt-1 text-2xl font-black text-white sm:text-3xl">
                  {vi ? 'Video Chữa Lành Đêm Muộn' : 'Late-Night Healing Reels'}
                </h2>
                <p className="mt-1 text-xs text-slate-400 sm:text-sm">
                  {vi
                    ? 'Phong cách hoạt họa 2D nhẹ nhàng, chạm vào những khoảnh khắc cô đơn và thao thức lúc 2h sáng.'
                    : 'Gentle 2D animated reflections on late-night insomnia and emotional fatigue.'}
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {videos.map(video => (
                <VideoCard
                  key={video.title}
                  video={video}
                  locale={locale}
                  categoryName={portal.name}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 📖 CURATED HEALING ARTICLES */}
      <section className="px-4 py-16 sm:px-6 lg:px-8 bg-[#060911]">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pb-6 border-b border-indigo-900/40">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-amber-300">
                {vi ? 'CẨM NANG Y SINH & THỂ CẢM' : 'EVIDENCE-BASED HEALING GUIDES'}
              </span>
              <h2 className="mt-1 text-2xl font-black text-white sm:text-3xl">
                {vi ? 'Bài Phân Tích Chuyên Sâu & Giải Mã Giấc Ngủ' : 'Deep-Dive Science & Bedtime Insights'}
              </h2>
              <p className="mt-1 text-xs text-slate-400 sm:text-sm">
                {vi
                  ? 'Mỗi bài viết đều có bộ công cụ thể cảm, thanh trượt nhịp thở và bóc mẽ bẫy suy nghĩ 2h sáng.'
                  : 'Every guide includes somatic grounding tools, breathing sliders, and 2 AM mental trap reframings.'}
              </p>
            </div>

            <Link
              href={allGuidesUrl}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-300 hover:text-white transition shrink-0"
            >
              <span>{vi ? 'Xem tất cả bài viết' : 'Explore all guides'}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map(article => (
              <ArticleCard key={article.slug} article={article} locale={locale} />
            ))}
          </div>

          {/* Bottom Explore CTA */}
          <div className="mt-14 text-center">
            <Link
              href={allGuidesUrl}
              className="inline-flex items-center gap-2 rounded-2xl bg-indigo-950/80 border border-indigo-800/60 px-8 py-4 text-xs font-bold text-amber-200 shadow-xl hover:bg-indigo-900 hover:text-white transition active:scale-95"
            >
              <span>{vi ? 'Khám Phá Toàn Bộ Kho Cẩm Nang Chữa Lành' : 'Explore Full Healing Library'}</span>
              <ArrowRight className="h-4 w-4 text-amber-400" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
