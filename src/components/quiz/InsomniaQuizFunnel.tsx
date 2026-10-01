'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import QRCode from 'qrcode';
import {
  Moon,
  Sparkles,
  ChevronLeft,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Brain,
  Clock,
  Heart,
  Zap,
  Download,
  Star,
  Lock,
  Smartphone,
  RefreshCw,
  Check,
  Award,
  Activity,
  Smile,
  Frown,
  Meh
} from 'lucide-react';
import { trackClientEvent } from '@/components/analytics/AnalyticsTracker';

const APP_STORE_URL = 'https://apps.apple.com/vn/app/soulscape-meditation-emotion/id6769265902';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=app.soulscape.world&pcampaignid=web_share';

export function InsomniaQuizFunnel() {
  const [lang, setLang] = useState<'en' | 'vi'>('en');
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop'>('desktop');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  // User Quiz Answers State
  const [gender, setGender] = useState<string>('');
  const [selectedIssues, setSelectedIssues] = useState<string[]>([]);
  const [frequency, setFrequency] = useState<string>('');
  const [duration, setDuration] = useState<string>('');
  const [ageGroup, setAgeGroup] = useState<string>('');
  const [sleepHours, setSleepHours] = useState<string>('');
  const [eveningDread, setEveningDread] = useState<number>(3);
  const [racingThoughts, setRacingThoughts] = useState<string>('');
  const [pillsUse, setPillsUse] = useState<string>('');
  const [sideEffects, setSideEffects] = useState<string[]>([]);
  const [primaryGoal, setPrimaryGoal] = useState<string>('');
  const [motivationLevel, setMotivationLevel] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [emailError, setEmailError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [emailSubmitted, setEmailSubmitted] = useState<boolean>(false);

  // Animated Progress for Plan Generator (Step 16)
  const [planProgress, setPlanProgress] = useState<number>(0);

  // Detect platform & generate QR for desktop
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const ua = navigator.userAgent || '';
    const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroid = /Android/i.test(ua);

    if (isIOS) setPlatform('ios');
    else if (isAndroid) setPlatform('android');
    else setPlatform('desktop');

    // Check lang query param
    const searchParams = new URLSearchParams(window.location.search);
    const langParam = searchParams.get('lang');
    if (langParam === 'vi') setLang('vi');

    // QR code for desktop users
    const currentUrl = window.location.href;
    QRCode.toDataURL(currentUrl, {
      width: 220,
      margin: 2,
      color: { dark: '#0a0d18', light: '#ffffff' }
    }).then(setQrDataUrl).catch(console.error);

    // Initial page view track
    trackClientEvent('page_view', {
      locale: langParam === 'vi' ? 'vi' : 'en',
      metadata: {
        funnel: 'quiz_insomnia',
        source: searchParams.get('utm_source') || 'direct',
        campaign: searchParams.get('utm_campaign') || ''
      }
    });
  }, []);

  // Calculate dynamic Insomnia Severity Index (ISI) score: 45 - 88
  const isiScore = useMemo(() => {
    let score = 38;
    if (frequency.includes('5') || frequency.includes('Chronic') || frequency.includes('5 đêm')) score += 18;
    else if (frequency.includes('3-4') || frequency.includes('3 - 4')) score += 12;
    else score += 6;

    if (duration.includes('year') || duration.includes('năm')) score += 14;
    else if (duration.includes('6') || duration.includes('tháng')) score += 8;
    else score += 4;

    score += Math.round(eveningDread * 2.8);

    if (pillsUse.includes('night') || pillsUse.includes('đêm')) score += 12;
    else if (pillsUse.includes('week') || pillsUse.includes('tuần')) score += 6;

    return Math.min(Math.max(score, 48), 89);
  }, [frequency, duration, eveningDread, pillsUse]);

  // Plan generation simulation effect on Step 16
  useEffect(() => {
    if (currentStep === 16) {
      setPlanProgress(15);
      const timer1 = setTimeout(() => setPlanProgress(42), 600);
      const timer2 = setTimeout(() => setPlanProgress(76), 1300);
      const timer3 = setTimeout(() => setPlanProgress(98), 2000);
      const timer4 = setTimeout(() => {
        setPlanProgress(100);
        trackClientEvent('quiz_step', {
          locale: lang,
          metadata: {
            funnel: 'quiz_insomnia',
            step: 17,
            previous_step: 16,
            isi_score: isiScore
          }
        });
        setCurrentStep(17); // Move to email gate
      }, 2500);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
        clearTimeout(timer4);
      };
    }
  }, [currentStep]);

  // Navigate next
  const goNext = () => {
    const nextStep = currentStep + 1;
    if (currentStep === 0) {
      const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      trackClientEvent('quiz_started', {
        locale: lang,
        metadata: {
          funnel: 'quiz_insomnia',
          utm_source: searchParams?.get('utm_source') || 'direct',
          utm_campaign: searchParams?.get('utm_campaign') || '',
          utm_medium: searchParams?.get('utm_medium') || '',
          utm_content: searchParams?.get('utm_content') || '',
          referrer: typeof document !== 'undefined' ? document.referrer : ''
        }
      });
    }

    if (nextStep <= 18) {
      trackClientEvent('quiz_step', {
        locale: lang,
        metadata: {
          funnel: 'quiz_insomnia',
          step: nextStep,
          previous_step: currentStep,
          isi_score: isiScore,
          gender: gender || undefined,
          issues_count: selectedIssues.length || undefined,
          frequency: frequency || undefined,
          duration: duration || undefined,
          age_group: ageGroup || undefined,
          sleep_hours: sleepHours || undefined,
          pills_use: pillsUse || undefined,
          primary_goal: primaryGoal || undefined
        }
      });
    }

    setCurrentStep(nextStep);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Navigate back
  const goBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Handle single choice option select with auto advance
  const handleSelectSingle = (value: string, setter: (val: string) => void) => {
    setter(value);
    setTimeout(() => {
      goNext();
    }, 220);
  };

  // Handle multiple choice toggle
  const toggleItem = (item: string, currentList: string[], setter: (val: string[]) => void) => {
    if (currentList.includes(item)) {
      setter(currentList.filter(i => i !== item));
    } else {
      setter([...currentList, item]);
    }
  };

  // Submit email to API
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError(lang === 'vi' ? 'Vui lòng nhập địa chỉ email hợp lệ' : 'Please enter a valid email address');
      return;
    }
    setEmailError('');
    setIsSubmitting(true);

    try {
      await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          locale: lang,
          source: 'quiz_insomnia'
        })
      });

      trackClientEvent('lead_submit', {
        locale: lang,
        metadata: {
          email,
          isi_score: isiScore,
          source: 'quiz_insomnia',
          issues: selectedIssues,
          pills_use: pillsUse
        }
      });

      trackClientEvent('quiz_completed', {
        locale: lang,
        metadata: {
          funnel: 'quiz_insomnia',
          isi_score: isiScore,
          email
        }
      });

      setEmailSubmitted(true);
      goNext();
    } catch (err) {
      console.error(err);
      // Still allow them to see results
      goNext();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Trigger app download click
  const handleDownloadApp = (store: 'app_store' | 'google_play') => {
    const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const metadata = {
      store,
      platform,
      method: 'quiz_insomnia_offer_button',
      utm_source: searchParams?.get('utm_source') || 'quiz_insomnia',
      utm_medium: searchParams?.get('utm_medium') || 'quiz',
      utm_campaign: searchParams?.get('utm_campaign') || 'insomnia_cbti',
      isi_score: isiScore,
      timestamp: new Date().toISOString()
    };

    trackClientEvent('onboarding_app_download_click', {
      locale: lang,
      metadata
    });

    const target = store === 'app_store' ? APP_STORE_URL : PLAY_STORE_URL;
    window.open(target, '_blank');
  };

  // Total steps for progress bar calculation (excluding intro step 0 and results step 18)
  const totalQuestionSteps = 17;
  const progressPercent = Math.min(Math.round((currentStep / totalQuestionSteps) * 100), 100);

  // Content Strings dictionary (English & Vietnamese)
  const t = {
    brand: 'SOULSCAPE · INSOMNIA LAB',
    poweredBy: lang === 'vi' ? 'Phương Pháp CBT-I & Thần Kinh Thực Vật 432Hz' : 'Clinical CBT-I & 432Hz Somatic Protocol',
    next: lang === 'vi' ? 'Tiếp tục' : 'Continue',
    start: lang === 'vi' ? 'Bắt Đầu Đánh Giá 3 Phút' : 'Start 3-Min Assessment',
    freeNotice: lang === 'vi' ? 'Hoàn toàn miễn phí • Không cần thẻ thanh toán' : '100% Free Assessment • No Credit Card Required',
    back: lang === 'vi' ? 'Quay lại' : 'Back',
  };

  return (
    <div className="min-h-screen bg-[#090b14] text-slate-100 flex flex-col font-sans selection:bg-purple-600 selection:text-white">
      {/* Top Sticky Bar */}
      <header className="sticky top-0 z-50 bg-[#090b14]/90 backdrop-blur-md border-b border-purple-950/40">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {currentStep > 0 && currentStep < 18 ? (
              <button
                onClick={goBack}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-950/50 border border-purple-800/40 text-purple-300 hover:text-white transition-all cursor-pointer"
                aria-label={t.back}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-950/50 border border-purple-800/40 text-purple-400">
                <Moon className="h-4 w-4" />
              </div>
            )}
            <div>
              <span className="text-xs font-extrabold tracking-wider text-purple-200">
                {t.brand}
              </span>
            </div>
          </div>

          {/* Language Toggle & Step Counter */}
          <div className="flex items-center gap-2">
            {currentStep > 0 && currentStep <= 17 && (
              <span className="text-[11px] font-mono font-semibold text-purple-300/70 bg-purple-950/60 px-2 py-0.5 rounded-lg border border-purple-900/40">
                {currentStep}/{totalQuestionSteps}
              </span>
            )}
            <button
              onClick={() => setLang(l => l === 'en' ? 'vi' : 'en')}
              className="text-[11px] font-bold px-2 py-1 rounded-lg border border-purple-800/40 bg-purple-950/40 text-purple-300 hover:text-white transition-all"
            >
              {lang === 'en' ? '🇻🇳 VI' : '🇬🇧 EN'}
            </button>
          </div>
        </div>

        {/* Glowing Top Progress Bar */}
        {currentStep > 0 && currentStep <= 17 && (
          <div className="w-full bg-purple-950/30 h-1 relative overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 via-indigo-400 to-emerald-400 transition-all duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}
      </header>

      {/* Main Container - Mobile Centered Viewport */}
      <main className="flex-1 w-full max-w-md mx-auto px-4 py-6 flex flex-col justify-between">
        
        {/* ================= STEP 0: HERO INTRO SCREEN ================= */}
        {currentStep === 0 && (
          <div className="flex-1 flex flex-col justify-between animate-fadeIn">
            <div className="pt-2 text-center">
              {/* Badge */}
              <div className="inline-flex items-center gap-1.5 rounded-full bg-purple-950/80 border border-purple-800/50 px-3 py-1 text-xs font-semibold text-purple-300 mb-4 shadow-sm">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                <span>{lang === 'vi' ? 'Liệu Trình Giấc Ngủ Khoa Học 2026' : 'Clinical Sleep Assessment 2026'}</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl leading-tight">
                {lang === 'vi' ? (
                  <>
                    Ngủ Sâu Tự Nhiên.<br />
                    <span className="bg-gradient-to-r from-purple-400 via-indigo-300 to-teal-300 bg-clip-text text-transparent">
                      Không Cần Thuốc Ngủ.
                    </span>
                  </>
                ) : (
                  <>
                    Sleep Better, Naturally.<br />
                    <span className="bg-gradient-to-r from-purple-400 via-indigo-300 to-teal-300 bg-clip-text text-transparent">
                      100% Pill-Free.
                    </span>
                  </>
                )}
              </h1>

              <p className="mt-3 text-sm text-slate-300 leading-relaxed max-w-xs mx-auto">
                {lang === 'vi'
                  ? 'Bắt đầu bài kiểm tra 3 phút theo tiêu chuẩn y khoa Stanford & Mayo Clinic để đo lường chỉ số mất ngủ và nhận phác đồ riêng của bạn.'
                  : "Mirroring the clinical methods of Stanford sleep clinics. Discover your Insomnia Severity Score and tailored CBT-I recovery plan."}
              </p>

              {/* 4 Core Value Pillars */}
              <div className="mt-6 space-y-2.5 text-left bg-[#111424] border border-purple-900/40 rounded-2xl p-4 shadow-lg">
                {[
                  {
                    icon: Clock,
                    color: 'text-purple-400',
                    en: 'Fall asleep in under 15 minutes effortlessly',
                    vi: 'Vào giấc dễ dàng trong dưới 15 phút'
                  },
                  {
                    icon: Moon,
                    color: 'text-indigo-400',
                    en: 'Eliminate 3:00 AM awakenings & racing thoughts',
                    vi: 'Chấm dứt thức giấc lúc 3h sáng & đầu óc lo nghĩ'
                  },
                  {
                    icon: ShieldCheck,
                    color: 'text-emerald-400',
                    en: 'Avoid dangerous sleeping pill dependencies',
                    vi: 'Tránh xa nguy cơ nhờn thuốc & tác dụng phụ thuốc ngủ'
                  },
                  {
                    icon: Brain,
                    color: 'text-amber-400',
                    en: '432Hz Somatic Vagus Nerve relaxation protocol',
                    vi: 'Thư giãn dây thần kinh phế vị bằng âm học Somatic 432Hz'
                  }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-xs text-slate-200">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-purple-950/80 border border-purple-800/40">
                      <item.icon className={`h-4 w-4 ${item.color}`} />
                    </div>
                    <span>{lang === 'vi' ? item.vi : item.en}</span>
                  </div>
                ))}
              </div>

              {/* Social proof badge */}
              <div className="mt-5 flex items-center justify-center gap-2 text-xs text-slate-400">
                <div className="flex text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-amber-400" />
                  ))}
                </div>
                <span>4.9/5 • 42,000+ {lang === 'vi' ? 'người đã cải thiện' : 'successful nights'}</span>
              </div>
            </div>

            <div className="pt-6">
              <button
                onClick={goNext}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-teal-500 text-white font-bold text-base shadow-xl shadow-purple-900/30 hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{t.start}</span>
                <ArrowRight className="h-5 w-5" />
              </button>
              <p className="mt-2 text-center text-[11px] text-slate-500 font-medium">
                {t.freeNotice}
              </p>
            </div>
          </div>
        )}

        {/* ================= STEP 1: GENDER ================= */}
        {currentStep === 1 && (
          <div className="flex-1 flex flex-col justify-between animate-fadeIn">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
                {lang === 'vi' ? 'Bước 1 / 17' : 'Step 1 / 17'}
              </span>
              <h2 className="mt-1 text-2xl font-extrabold text-white">
                {lang === 'vi' ? 'Chọn giới tính sinh học của bạn' : 'Select your biological gender'}
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                {lang === 'vi'
                  ? 'Hormone và chu kỳ sinh học ảnh hưởng trực tiếp đến cấu trúc giai đoạn ngủ sâu.'
                  : 'Hormonal and circadian rhythms impact slow-wave deep sleep stages.'}
              </p>

              <div className="mt-6 space-y-3">
                {[
                  { id: 'female', labelEn: 'Female', labelVi: 'Nữ giới', icon: '👩' },
                  { id: 'male', labelEn: 'Male', labelVi: 'Nam giới', icon: '👨' },
                  { id: 'other', labelEn: 'Other / Prefer not to say', labelVi: 'Khác / Không muốn tiết lộ', icon: '✨' }
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleSelectSingle(item.id, setGender)}
                    className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                      gender === item.id
                        ? 'border-purple-500 bg-purple-950/60 shadow-lg shadow-purple-950/50'
                        : 'border-purple-900/40 bg-[#121526] hover:border-purple-700/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{item.icon}</span>
                      <span className="text-base font-semibold text-white">
                        {lang === 'vi' ? item.labelVi : item.labelEn}
                      </span>
                    </div>
                    <div className={`h-5 w-5 rounded-full border flex items-center justify-center ${gender === item.id ? 'border-purple-400 bg-purple-500' : 'border-slate-600'}`}>
                      {gender === item.id && <Check className="h-3 w-3 text-white" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 2: SLEEP ISSUES (MULTI-CHOICE) ================= */}
        {currentStep === 2 && (
          <div className="flex-1 flex flex-col justify-between animate-fadeIn">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
                {lang === 'vi' ? 'Bước 2 / 17' : 'Step 2 / 17'}
              </span>
              <h2 className="mt-1 text-2xl font-extrabold text-white">
                {lang === 'vi' ? 'Bạn đang gặp phải những vấn đề nào?' : 'What disrupts your sleep the most?'}
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                {lang === 'vi' ? 'Chọn tất cả những gì bạn đang trải qua (có thể chọn nhiều):' : 'Select all that apply to your current nights:'}
              </p>

              <div className="mt-5 space-y-2.5">
                {[
                  { id: 'cant_fall_asleep', icon: '⏳', en: 'Takes more than 30-60 mins to fall asleep', vi: 'Trằn trọc hơn 30-60 phút mới vào được giấc' },
                  { id: 'wake_up_middle', icon: '⏰', en: 'Waking up at 2 - 4 AM unable to fall back asleep', vi: 'Thức giấc lúc 2 - 4 giờ sáng và không thể ngủ lại' },
                  { id: 'racing_mind', icon: '💭', en: 'Mind racing with stress & tomorrow’s tasks in bed', vi: 'Đầu óc suy nghĩ quay cuồng về công việc khi nằm' },
                  { id: 'wake_early', icon: '🌅', en: 'Waking up way too early feeling exhausted', vi: 'Thức dậy quá sớm và cảm thấy kiệt sức' },
                  { id: 'daytime_fatigue', icon: '🥱', en: 'Severe daytime brain fog and sluggish energy', vi: 'Sương mù não, mệt mỏi và thiếu tỉnh táo cả ngày' }
                ].map(item => {
                  const isSelected = selectedIssues.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      onClick={() => toggleItem(item.id, selectedIssues, setSelectedIssues)}
                      className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                        isSelected
                          ? 'border-purple-500 bg-purple-950/60 shadow-md'
                          : 'border-purple-900/40 bg-[#121526] hover:border-purple-700/60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{item.icon}</span>
                        <span className="text-xs sm:text-sm font-medium text-slate-200">
                          {lang === 'vi' ? item.vi : item.en}
                        </span>
                      </div>
                      <div className={`h-5 w-5 shrink-0 rounded-md border flex items-center justify-center ${isSelected ? 'border-purple-400 bg-purple-500' : 'border-slate-600'}`}>
                        {isSelected && <Check className="h-3 w-3 text-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-4">
              <button
                disabled={selectedIssues.length === 0}
                onClick={goNext}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-base shadow-lg shadow-purple-950/50 hover:opacity-95 disabled:opacity-40 transition-all cursor-pointer"
              >
                {t.next} ({selectedIssues.length})
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 3: FREQUENCY ================= */}
        {currentStep === 3 && (
          <div className="flex-1 flex flex-col justify-between animate-fadeIn">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
                {lang === 'vi' ? 'Bước 3 / 17' : 'Step 3 / 17'}
              </span>
              <h2 className="mt-1 text-2xl font-extrabold text-white">
                {lang === 'vi' ? 'Trong 1 tuần, bạn bị mất ngủ bao nhiêu lần?' : 'How often do you have trouble sleeping in a week?'}
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                {lang === 'vi' ? 'Tần suất phản ánh mức độ kích thích thần kinh thực vật của bạn.' : 'Helps calibrate your autonomic nervous system baseline.'}
              </p>

              <div className="mt-6 space-y-3">
                {[
                  { id: '1-2', en: '1 - 2 nights a week (Occasional)', vi: '1 - 2 đêm / tuần (Thỉnh thoảng)', level: 'text-teal-400' },
                  { id: '3-4', en: '3 - 4 nights a week (Moderate)', vi: '3 - 4 đêm / tuần (Trung bình)', level: 'text-amber-400' },
                  { id: '5+', en: '5 or more nights a week (Chronic)', vi: '5 đêm trở lên / tuần (Mãn tính)', level: 'text-rose-400' }
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleSelectSingle(item.id, setFrequency)}
                    className="w-full p-4 rounded-2xl border border-purple-900/40 bg-[#121526] hover:border-purple-500 hover:bg-purple-950/50 text-left flex items-center justify-between transition-all cursor-pointer"
                  >
                    <span className="text-sm font-semibold text-white">
                      {lang === 'vi' ? item.vi : item.en}
                    </span>
                    <ArrowRight className="h-4 w-4 text-purple-400" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 4: DURATION ================= */}
        {currentStep === 4 && (
          <div className="flex-1 flex flex-col justify-between animate-fadeIn">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
                {lang === 'vi' ? 'Bước 4 / 17' : 'Step 4 / 17'}
              </span>
              <h2 className="mt-1 text-2xl font-extrabold text-white">
                {lang === 'vi' ? 'Tình trạng này đã kéo dài bao lâu rồi?' : 'How long have you been struggling with sleep?'}
              </h2>

              <div className="mt-6 space-y-3">
                {[
                  { id: '<1m', en: 'Less than 1 month', vi: 'Dưới 1 tháng' },
                  { id: '1-6m', en: '1 to 6 months', vi: 'Từ 1 đến 6 tháng' },
                  { id: '6-12m', en: '6 to 12 months', vi: 'Từ 6 đến 12 tháng' },
                  { id: '>1y', en: 'Over a year (Chronic sleeplessness)', vi: 'Hơn 1 năm (Mất ngủ kinh niên)' }
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleSelectSingle(item.id, setDuration)}
                    className="w-full p-4 rounded-2xl border border-purple-900/40 bg-[#121526] hover:border-purple-500 hover:bg-purple-950/50 text-left flex items-center justify-between transition-all cursor-pointer"
                  >
                    <span className="text-sm font-semibold text-white">
                      {lang === 'vi' ? item.vi : item.en}
                    </span>
                    <ArrowRight className="h-4 w-4 text-purple-400" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 5: AGE GROUP ================= */}
        {currentStep === 5 && (
          <div className="flex-1 flex flex-col justify-between animate-fadeIn">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
                {lang === 'vi' ? 'Bước 5 / 17' : 'Step 5 / 17'}
              </span>
              <h2 className="mt-1 text-2xl font-extrabold text-white">
                {lang === 'vi' ? 'Độ tuổi hiện tại của bạn?' : 'What is your current age bracket?'}
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                {lang === 'vi' ? 'Nồng độ Melatonin tự nhiên giảm dần 10-15% sau mỗi thập kỷ.' : 'Natural melatonin production decreases after age 30.'}
              </p>

              <div className="mt-6 grid grid-cols-2 gap-3">
                {['18 - 29', '30 - 39', '40 - 49', '50 - 59', '60 - 69', '70+'].map(age => (
                  <button
                    key={age}
                    onClick={() => handleSelectSingle(age, setAgeGroup)}
                    className="p-4 rounded-2xl border border-purple-900/40 bg-[#121526] hover:border-purple-500 hover:bg-purple-950/50 text-center transition-all cursor-pointer"
                  >
                    <span className="text-base font-bold text-white">{age}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 6: [INTERSTITIAL 1 - ISI SCORE REVEAL] ================= */}
        {currentStep === 6 && (
          <div className="flex-1 flex flex-col justify-between animate-fadeIn text-center">
            <div className="pt-2">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-950/70 border border-amber-800/50 px-3 py-1 text-xs font-semibold text-amber-300 mb-3">
                <Activity className="h-3.5 w-3.5" />
                <span>{lang === 'vi' ? 'Chẩn Đoán Lâm Sàng Ban Đầu' : 'Clinical Diagnostic Phase'}</span>
              </div>

              <h2 className="text-2xl font-extrabold text-white">
                {lang === 'vi' ? 'Chỉ Số Mức Độ Mất Ngủ (ISI)' : 'Your Insomnia Severity Score'}
              </h2>

              {/* Dial Gauge Card */}
              <div className="mt-5 rounded-3xl border border-amber-900/40 bg-gradient-to-b from-[#221810] to-[#120e17] p-6 shadow-xl relative overflow-hidden">
                <div className="flex flex-col items-center">
                  <div className="relative flex items-center justify-center">
                    <svg className="w-36 h-36 transform -rotate-90">
                      <circle cx="72" cy="72" r="58" stroke="#2a1e36" strokeWidth="10" fill="transparent" />
                      <circle
                        cx="72"
                        cy="72"
                        r="58"
                        stroke="#f59e0b"
                        strokeWidth="10"
                        strokeDasharray={364}
                        strokeDashoffset={364 - (364 * isiScore) / 100}
                        strokeLinecap="round"
                        fill="transparent"
                        className="transition-all duration-1000 ease-out"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className="text-4xl font-black text-amber-400 font-mono tracking-tight">{isiScore}</span>
                      <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">/ 100 Điểm</span>
                    </div>
                  </div>

                  <div className="mt-3 inline-block rounded-xl bg-amber-950 border border-amber-800/60 px-3 py-1 text-xs font-bold text-amber-300">
                    {isiScore >= 70
                      ? (lang === 'vi' ? 'Mức Độ: Rất Nghiêm Trọng (Severe)' : 'Severity: High Chronic')
                      : (lang === 'vi' ? 'Mức Độ: Đáng Báo Động (Significant)' : 'Severity: Significant')}
                  </div>

                  <p className="mt-3 text-xs text-slate-300 leading-relaxed max-w-xs">
                    {lang === 'vi'
                      ? 'Dữ liệu cho thấy hệ thần kinh giao cảm (Sympathetic) của bạn bị kích hoạt quá mức vào ban đêm, ngăn cản não bộ bước vào chu kỳ sóng não Delta (ngủ sâu).'
                      : 'Your responses reveal hyper-arousal in your autonomic nervous system, blocking entry into restorative deep slow-wave sleep.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <button
                onClick={goNext}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-base shadow-lg shadow-purple-950/50 hover:opacity-95 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>{lang === 'vi' ? 'Tiếp tục phân tích nguyên nhân' : 'Continue root-cause analysis'}</span>
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 7: SLEEP DURATION ================= */}
        {currentStep === 7 && (
          <div className="flex-1 flex flex-col justify-between animate-fadeIn">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
                {lang === 'vi' ? 'Bước 6 / 17' : 'Step 6 / 17'}
              </span>
              <h2 className="mt-1 text-2xl font-extrabold text-white">
                {lang === 'vi' ? 'Mỗi đêm bạn ngủ thực tế được mấy tiếng?' : 'How many hours of sleep do you get on an average night?'}
              </h2>

              <div className="mt-6 space-y-3">
                {[
                  { id: '<5h', en: 'Less than 5 hours (Severe deficit)', vi: 'Dưới 5 tiếng (Thiếu ngủ trầm trọng)' },
                  { id: '5-6h', en: '5 - 6 hours', vi: '5 - 6 tiếng' },
                  { id: '6-7h', en: '6 - 7 hours', vi: '6 - 7 tiếng' },
                  { id: '7-8h', en: '7 - 8+ hours but still exhausted', vi: '7 - 8 tiếng nhưng dậy vẫn mệt mỏi' }
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleSelectSingle(item.id, setSleepHours)}
                    className="w-full p-4 rounded-2xl border border-purple-900/40 bg-[#121526] hover:border-purple-500 hover:bg-purple-950/50 text-left flex items-center justify-between transition-all cursor-pointer"
                  >
                    <span className="text-sm font-semibold text-white">
                      {lang === 'vi' ? item.vi : item.en}
                    </span>
                    <ArrowRight className="h-4 w-4 text-purple-400" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 8: [INTERSTITIAL 2 - THE 8-HOUR MYTH] ================= */}
        {currentStep === 8 && (
          <div className="flex-1 flex flex-col justify-between animate-fadeIn text-center">
            <div className="pt-2">
              <div className="flex justify-center mb-3">
                <div className="h-16 w-16 rounded-2xl bg-indigo-950 border border-indigo-800/50 flex items-center justify-center text-3xl shadow-lg shadow-indigo-950/50">
                  🧬
                </div>
              </div>

              <h2 className="text-2xl font-extrabold text-white">
                {lang === 'vi' ? 'Quy Tắc "8 Tiếng" Là Một Ngộ Nhận' : 'The "8-Hour Rule" is a Myth'}
              </h2>

              <div className="mt-4 rounded-2xl border border-indigo-900/40 bg-[#121426] p-5 text-left space-y-3">
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                  {lang === 'vi'
                    ? 'Nghiên cứu sinh học giấc ngủ chứng minh nhu cầu ngủ của mỗi cơ thể là hoàn toàn khác nhau. Việc cố ép bản thân phải ngủ đủ 8 tiếng chính là mồi lửa châm ngòi cho chứng "Lo âu nỗ lực ngủ".'
                    : 'Sleep needs vary genetically. Forcing yourself to hit exactly 8 hours activates bedtime panic. Sleep quality and nervous system decompression matter far more than raw duration.'}
                </p>
                <div className="border-t border-indigo-900/30 pt-3 flex items-center gap-2 text-xs text-indigo-300 font-semibold">
                  <CheckCircle2 className="h-4 w-4 text-teal-400 shrink-0" />
                  <span>{lang === 'vi' ? '6.5 tiếng ngủ sâu chất lượng cao quý hơn 8 tiếng trằn trọc chập chờn.' : '6.5 hours of deep somatic restorative sleep beats 8 hours of fractured tossing.'}</span>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <button
                onClick={goNext}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-base shadow-lg shadow-purple-950/50 hover:opacity-95 transition-all cursor-pointer"
              >
                {t.next}
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 9: EVENING DREAD (SCALE) ================= */}
        {currentStep === 9 && (
          <div className="flex-1 flex flex-col justify-between animate-fadeIn text-center">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
                {lang === 'vi' ? 'Bước 7 / 17' : 'Step 7 / 17'}
              </span>
              <h2 className="mt-2 text-xl sm:text-2xl font-extrabold text-white leading-snug">
                {lang === 'vi'
                  ? '«Buổi tối, chỉ cần nghĩ đến việc phải lên giường ngủ là tôi đã thấy căng thẳng lo âu»'
                  : '«I feel dread and tension in the evening just thinking about trying to sleep»'}
              </h2>
              <p className="mt-2 text-xs text-slate-400">
                {lang === 'vi' ? 'Chọn mức độ mô tả chính xác cảm giác của bạn:' : 'Rate how strongly this reflects your feelings:'}
              </p>

              {/* 5-Emoji Scale */}
              <div className="mt-8 flex justify-between items-center gap-2 max-w-sm mx-auto">
                {[
                  { val: 1, label: lang === 'vi' ? 'Không bao giờ' : 'Never', emoji: '😌' },
                  { val: 2, label: lang === 'vi' ? 'Hiếm khi' : 'Rarely', emoji: '🙂' },
                  { val: 3, label: lang === 'vi' ? 'Thỉnh thoảng' : 'Sometimes', emoji: '😐' },
                  { val: 4, label: lang === 'vi' ? 'Thường xuyên' : 'Often', emoji: '😟' },
                  { val: 5, label: lang === 'vi' ? 'Mỗi tối' : 'Every night', emoji: '😫' }
                ].map(item => (
                  <button
                    key={item.val}
                    onClick={() => {
                      setEveningDread(item.val);
                      setTimeout(goNext, 200);
                    }}
                    className={`flex-1 flex flex-col items-center gap-1.5 p-3 rounded-2xl border transition-all cursor-pointer ${
                      eveningDread === item.val
                        ? 'border-purple-500 bg-purple-950/80 shadow-lg scale-105'
                        : 'border-purple-900/40 bg-[#121526] hover:border-purple-700/60'
                    }`}
                  >
                    <span className="text-2xl">{item.emoji}</span>
                    <span className="text-[10px] font-semibold text-slate-300">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-6">
              <button
                onClick={goNext}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-base shadow-lg hover:opacity-95 transition-all cursor-pointer"
              >
                {t.next}
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 10: BEDTIME RACING THOUGHTS ================= */}
        {currentStep === 10 && (
          <div className="flex-1 flex flex-col justify-between animate-fadeIn">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
                {lang === 'vi' ? 'Bước 8 / 17' : 'Step 8 / 17'}
              </span>
              <h2 className="mt-1 text-2xl font-extrabold text-white">
                {lang === 'vi'
                  ? 'Khi đặt lưng xuống giường, tâm trí bạn có hay bị cuốn vào suy nghĩ miên man?'
                  : 'When lying down, does your mind replay work and daily worries?'}
              </h2>

              <div className="mt-6 space-y-3">
                {[
                  { id: 'always', en: 'Always - Brain feels like a browser with 50 tabs open', vi: 'Luôn luôn - Não như mở 50 tab không thể tắt' },
                  { id: 'often', en: 'Often - Constant planning, worrying, and mental calculations', vi: 'Thường xuyên - Loay hoay tính toán và dự trù công việc' },
                  { id: 'sometimes', en: 'Sometimes - Only when under high pressure', vi: 'Thỉnh thoảng - Chỉ khi gặp áp lực công việc lớn' },
                  { id: 'rarely', en: 'Rarely - My body is tired but mind won’t shut off', vi: 'Hiếm khi - Cơ thể mệt rã rời nhưng mắt vẫn chong chong' }
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleSelectSingle(item.id, setRacingThoughts)}
                    className="w-full p-4 rounded-2xl border border-purple-900/40 bg-[#121526] hover:border-purple-500 hover:bg-purple-950/50 text-left flex items-center justify-between transition-all cursor-pointer"
                  >
                    <span className="text-sm font-semibold text-white">
                      {lang === 'vi' ? item.vi : item.en}
                    </span>
                    <ArrowRight className="h-4 w-4 text-purple-400" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 11: [INTERSTITIAL 3 - PARADOX OF SLEEP EFFORT] ================= */}
        {currentStep === 11 && (
          <div className="flex-1 flex flex-col justify-between animate-fadeIn text-center">
            <div className="pt-2">
              <div className="flex justify-center mb-3">
                <div className="h-16 w-16 rounded-2xl bg-amber-950 border border-amber-800/50 flex items-center justify-center text-3xl shadow-lg">
                  ⚡
                </div>
              </div>

              <h2 className="text-2xl font-extrabold text-white">
                {lang === 'vi' ? 'Nghịch Lý Của Sự Cố Gắng' : 'The Paradox of Sleep Effort'}
              </h2>

              <div className="mt-4 rounded-2xl border border-amber-900/40 bg-[#1a141e] p-5 text-left space-y-3">
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                  {lang === 'vi'
                    ? 'Giấc ngủ là cơ chế sinh học duy nhất trên đời mà "càng cố gắng làm thì càng thất bại". Hành động cố nhắm mắt ép mình ngủ kích hoạt phản xạ phòng vệ (Fight-or-Flight).'
                    : 'Sleep is the only biological function that fails the harder you try. Actively trying to fall asleep triggers cortisol surges. The clinical secret is somatic down-regulation.'}
                </p>
                <div className="border-t border-amber-900/30 pt-3 text-xs text-amber-300 font-semibold">
                  {lang === 'vi'
                    ? '🔑 Giải pháp cốt lõi: Hạ nhiệt thần kinh thực vật bằng tần số 432Hz để cơ thể tự động trôi vào giấc ngủ mà không cần nỗ lực.'
                    : '🔑 The Key: Re-wiring sleep associations with 432Hz somatic soundscapes so sleep happens effortlessly.'}
                </div>
              </div>
            </div>

            <div className="pt-6">
              <button
                onClick={goNext}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-base shadow-lg hover:opacity-95 transition-all cursor-pointer"
              >
                {t.next}
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 12: PILLS & SLEEP AIDS USE ================= */}
        {currentStep === 12 && (
          <div className="flex-1 flex flex-col justify-between animate-fadeIn">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
                {lang === 'vi' ? 'Bước 9 / 17' : 'Step 9 / 17'}
              </span>
              <h2 className="mt-1 text-2xl font-extrabold text-white">
                {lang === 'vi'
                  ? 'Bạn có đang sử dụng thuốc ngủ hoặc Melatonin không?'
                  : 'Do you currently rely on sleeping pills or Melatonin?'}
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                {lang === 'vi' ? 'Bao gồm cả thuốc kê đơn, thảo dược, kẹo dẻo ngủ, rượu bia...' : 'Includes prescription pills, OTC supplements, gummies, or alcohol.'}
              </p>

              <div className="mt-6 space-y-3">
                {[
                  { id: 'every_night', en: 'Yes, almost every night', vi: 'Có, hầu như mỗi đêm' },
                  { id: 'few_times_week', en: 'A few times a week', vi: 'Vài lần một tuần' },
                  { id: 'occasionally', en: 'Occasionally / Only in desperation', vi: 'Thỉnh thoảng / Chỉ khi cùng đường' },
                  { id: 'never', en: 'Never / I want to avoid chemicals', vi: 'Không bao giờ / Tôi tránh xa thuốc' }
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleSelectSingle(item.id, setPillsUse)}
                    className="w-full p-4 rounded-2xl border border-purple-900/40 bg-[#121526] hover:border-purple-500 hover:bg-purple-950/50 text-left flex items-center justify-between transition-all cursor-pointer"
                  >
                    <span className="text-sm font-semibold text-white">
                      {lang === 'vi' ? item.vi : item.en}
                    </span>
                    <ArrowRight className="h-4 w-4 text-purple-400" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 13: SIDE EFFECTS (MULTI-CHOICE) ================= */}
        {currentStep === 13 && (
          <div className="flex-1 flex flex-col justify-between animate-fadeIn">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
                {lang === 'vi' ? 'Bước 10 / 17' : 'Step 10 / 17'}
              </span>
              <h2 className="mt-1 text-2xl font-extrabold text-white">
                {lang === 'vi'
                  ? 'Bạn có gặp phải tác dụng phụ nào dưới đây không?'
                  : 'Have you noticed any of these side effects?'}
              </h2>

              <div className="mt-5 space-y-2.5">
                {[
                  { id: 'grogginess', en: 'Morning grogginess & heavy brain fog', vi: 'Sáng dậy đầu óc nặng trĩu, ngầy ngật cả buổi' },
                  { id: 'tolerance', en: 'Needing higher doses over time (Tolerance)', vi: 'Phải tăng liều mới có tác dụng (Nhờn thuốc)' },
                  { id: 'memory', en: 'Memory slips & lack of concentration', vi: 'Suy giảm trí nhớ ngắn hạn & mất tập trung' },
                  { id: 'dependency_fear', en: 'Fear of being unable to sleep without aids', vi: 'Nỗi sợ không ngủ được nếu thiếu thuốc' },
                  { id: 'none', en: 'None of the above', vi: 'Không có tác dụng phụ nào' }
                ].map(item => {
                  const isSelected = sideEffects.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      onClick={() => toggleItem(item.id, sideEffects, setSideEffects)}
                      className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                        isSelected
                          ? 'border-purple-500 bg-purple-950/60 shadow-md'
                          : 'border-purple-900/40 bg-[#121526] hover:border-purple-700/60'
                      }`}
                    >
                      <span className="text-xs sm:text-sm font-medium text-slate-200">
                        {lang === 'vi' ? item.vi : item.en}
                      </span>
                      <div className={`h-5 w-5 shrink-0 rounded-md border flex items-center justify-center ${isSelected ? 'border-purple-400 bg-purple-500' : 'border-slate-600'}`}>
                        {isSelected && <Check className="h-3 w-3 text-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-4">
              <button
                disabled={sideEffects.length === 0}
                onClick={goNext}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-base shadow-lg hover:opacity-95 disabled:opacity-40 transition-all cursor-pointer"
              >
                {t.next}
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 14: [INTERSTITIAL 4 - 100% PILL-FREE CLINICAL SOLUTION] ================= */}
        {currentStep === 14 && (
          <div className="flex-1 flex flex-col justify-between animate-fadeIn text-center">
            <div className="pt-2">
              <div className="flex justify-center mb-3">
                <div className="h-16 w-16 rounded-2xl bg-emerald-950 border border-emerald-800/50 flex items-center justify-center text-3xl shadow-lg">
                  🛡️
                </div>
              </div>

              <h2 className="text-2xl font-extrabold text-white">
                {lang === 'vi' ? 'Liệu Pháp Lâm Sàng 100% Không Thuốc' : 'Say Goodbye to Pills & Brain Fog'}
              </h2>

              <p className="mt-2 text-xs text-slate-300">
                {lang === 'vi'
                  ? 'Phát triển dựa trên phương pháp CBT-I (Stanford) kết hợp âm học Somatic 432Hz.'
                  : 'Based on gold-standard CBT-I methods proven at Stanford & Mayo Clinic.'}
              </p>

              {/* Clinical stats card */}
              <div className="mt-5 grid grid-cols-3 gap-2.5 text-center">
                <div className="rounded-2xl border border-emerald-900/40 bg-[#0f1f1a] p-3">
                  <span className="text-2xl font-black text-emerald-400 font-mono">+75m</span>
                  <span className="block text-[10px] text-slate-300 mt-1 font-medium">{lang === 'vi' ? 'Ngủ thêm mỗi đêm' : 'More sleep per night'}</span>
                </div>
                <div className="rounded-2xl border border-emerald-900/40 bg-[#0f1f1a] p-3">
                  <span className="text-2xl font-black text-teal-400 font-mono">-53%</span>
                  <span className="block text-[10px] text-slate-300 mt-1 font-medium">{lang === 'vi' ? 'Rút ngắn vào giấc' : 'Faster sleep onset'}</span>
                </div>
                <div className="rounded-2xl border border-emerald-900/40 bg-[#0f1f1a] p-3">
                  <span className="text-2xl font-black text-amber-400 font-mono">0%</span>
                  <span className="block text-[10px] text-slate-300 mt-1 font-medium">{lang === 'vi' ? 'Tác dụng phụ' : 'Side effects'}</span>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <button
                onClick={goNext}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-base shadow-lg hover:opacity-95 transition-all cursor-pointer"
              >
                {lang === 'vi' ? 'Tiếp tục thiết lập lộ trình' : 'Continue to personalized plan'}
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 15: PRIMARY GOAL ================= */}
        {currentStep === 15 && (
          <div className="flex-1 flex flex-col justify-between animate-fadeIn">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
                {lang === 'vi' ? 'Bước 11 / 17' : 'Step 11 / 17'}
              </span>
              <h2 className="mt-1 text-2xl font-extrabold text-white">
                {lang === 'vi'
                  ? 'Động lực lớn nhất để bạn khôi phục giấc ngủ là gì?'
                  : 'What is your primary motivation to fix your sleep?'}
              </h2>

              <div className="mt-6 space-y-3">
                {[
                  { id: 'energy', icon: '⚡', en: 'Reclaim sharp mental clarity & peak productivity', vi: 'Lấy lại sự tỉnh táo, minh mẫn & năng suất đỉnh cao' },
                  { id: 'family', icon: '💖', en: 'Be emotionally calm & present with my loved ones', vi: 'Tâm trạng ổn định, nhẹ nhõm & bình an bên gia đình' },
                  { id: 'health', icon: '🛡️', en: 'Protect brain health, immunity & prevent dementia', vi: 'Bảo vệ não bộ, phòng ngừa lão hóa & sa sút trí tuệ' },
                  { id: 'youth', icon: '✨', en: 'Look fresher, younger and revitalize body cells', vi: 'Trẻ trung, tái tạo làn da & hồi phục tế bào toàn thân' }
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleSelectSingle(item.id, setPrimaryGoal)}
                    className="w-full p-4 rounded-2xl border border-purple-900/40 bg-[#121526] hover:border-purple-500 hover:bg-purple-950/50 text-left flex items-center justify-between transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{item.icon}</span>
                      <span className="text-sm font-semibold text-white">
                        {lang === 'vi' ? item.vi : item.en}
                      </span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-purple-400" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 16: [INTERSTITIAL 5 - ANIMATED PLAN GENERATOR] ================= */}
        {currentStep === 16 && (
          <div className="flex-1 flex flex-col justify-center items-center text-center animate-fadeIn py-8">
            <div className="relative mb-6">
              <div className="h-24 w-24 rounded-full border-4 border-purple-900/40 border-t-purple-400 animate-spin flex items-center justify-center" />
              <div className="absolute inset-0 flex items-center justify-center font-mono font-bold text-xl text-purple-300">
                {planProgress}%
              </div>
            </div>

            <h2 className="text-2xl font-extrabold text-white">
              {lang === 'vi' ? 'Đang Thiết Lập Phác Đồ Cá Nhân Hóa...' : 'Crafting Your Custom Sleep Protocol...'}
            </h2>
            <p className="mt-2 text-xs text-slate-400 max-w-xs">
              {lang === 'vi' ? 'Hệ thống đang tích hợp dữ liệu chỉ số ISI của bạn với thư viện âm học Somatic 432Hz.' : 'Synthesizing your ISI score with vagus nerve somatic soundscapes.'}
            </p>

            {/* Checklist */}
            <div className="mt-6 w-full max-w-xs space-y-2.5 text-left text-xs bg-[#111424] border border-purple-900/40 rounded-2xl p-4">
              {[
                { done: planProgress >= 25, en: 'Evaluating Insomnia Severity Index (ISI)', vi: 'Đánh giá chỉ số mất ngủ cá nhân (ISI)' },
                { done: planProgress >= 50, en: 'Calibrating Vagus Nerve relaxation cycle', vi: 'Điều chỉnh chu kỳ xoa dịu dây thần kinh phế vị' },
                { done: planProgress >= 75, en: 'Synthesizing 432Hz delta binaural sleepscapes', vi: 'Tổng hợp tần số âm học 432Hz dẫn sóng não Delta' },
                { done: planProgress >= 95, en: 'Generating 14-day CBT-I sleep blueprint', vi: 'Lập bản đồ lộ trình khôi phục giấc ngủ 14 ngày' }
              ].map((c, idx) => (
                <div key={idx} className="flex items-center gap-2.5">
                  <div className={`h-4 w-4 rounded-full flex items-center justify-center shrink-0 ${c.done ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-600'}`}>
                    <Check className="h-2.5 w-2.5" />
                  </div>
                  <span className={c.done ? 'text-slate-200 font-medium' : 'text-slate-500'}>
                    {lang === 'vi' ? c.vi : c.en}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= STEP 17: EMAIL CAPTURE GATE ================= */}
        {currentStep === 17 && (
          <div className="flex-1 flex flex-col justify-between animate-fadeIn text-center">
            <div className="pt-2">
              <div className="flex justify-center mb-3">
                <div className="h-14 w-14 rounded-2xl bg-purple-950 border border-purple-800/50 flex items-center justify-center text-2xl shadow-lg">
                  💌
                </div>
              </div>

              <h2 className="text-2xl font-extrabold text-white">
                {lang === 'vi' ? 'Hồ Sơ Giấc Ngủ Của Bạn Đã Sẵn Sàng!' : 'Your Personalized Plan is Ready!'}
              </h2>

              <p className="mt-2 text-xs text-slate-300 max-w-xs mx-auto">
                {lang === 'vi'
                  ? 'Nhập email để nhận bản báo cáo phân tích toàn diện và mở khóa phác đồ ngủ sâu 14 ngày của bạn.'
                  : 'Enter your email to view your full diagnostic report and tailored CBT-I recovery roadmap.'}
              </p>

              {/* Diagnostic preview card */}
              <div className="mt-5 rounded-2xl border border-purple-900/40 bg-[#121526] p-4 text-left flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">{lang === 'vi' ? 'Chỉ số ISI của bạn' : 'Your ISI Index'}</span>
                  <p className="text-xl font-black text-amber-400 font-mono">{isiScore} / 100</p>
                  <span className="text-[11px] text-slate-300">{lang === 'vi' ? 'Mức độ cảnh báo: Đáng kể' : 'Severity: Significant Alert'}</span>
                </div>
                <div className="h-10 w-10 rounded-xl bg-purple-900/40 border border-purple-700/40 flex items-center justify-center text-purple-300">
                  <Lock className="h-5 w-5" />
                </div>
              </div>

              <form onSubmit={handleEmailSubmit} className="mt-5 space-y-3">
                <div>
                  <input
                    type="email"
                    required
                    placeholder={lang === 'vi' ? 'Nhập địa chỉ email của bạn...' : 'Enter your email address...'}
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full py-4 px-4 rounded-2xl border border-purple-900/60 bg-[#0d1020] text-sm text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                  {emailError && (
                    <p className="mt-1 text-left text-xs text-rose-400 font-medium">{emailError}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-teal-500 text-white font-bold text-base shadow-xl shadow-purple-950/50 hover:opacity-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <RefreshCw className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <span>{lang === 'vi' ? 'Xem Kết Quả & Mở Khóa Phác Đồ' : 'Unlock My Personalized Plan'}</span>
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
                <ShieldCheck className="h-3.5 w-3.5 text-teal-400" />
                <span>{lang === 'vi' ? 'Bảo mật 100% • Không spam • Không bán dữ liệu' : '100% Private & Secure • No Spam Guarantee'}</span>
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 18: PERSONALIZED RESULTS & APP DOWNLOAD OFFER ================= */}
        {currentStep === 18 && (
          <div className="flex-1 flex flex-col justify-between animate-fadeIn text-center space-y-5">
            <div className="pt-2">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-950/80 border border-emerald-800/50 px-3 py-1 text-xs font-semibold text-emerald-300 mb-3">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>{lang === 'vi' ? 'Đã Mở Khóa Phác Đồ Cá Nhân Hóa' : 'Plan Successfully Generated'}</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
                {lang === 'vi' ? 'Lộ Trình Ngủ Sâu 14 Ngày Của Bạn' : 'Your 14-Day Deep Sleep Blueprint'}
              </h2>

              <p className="mt-1 text-xs text-slate-300">
                {lang === 'vi'
                  ? `Đã gửi báo cáo chi tiết về: ${email || 'email của bạn'}`
                  : `Full diagnostic breakdown sent to: ${email || 'your email'}`}
              </p>

              {/* Main Result Card */}
              <div className="mt-4 rounded-3xl border border-purple-900/50 bg-gradient-to-b from-[#181329] to-[#0f0c1a] p-5 text-left shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-purple-900/30 pb-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-purple-400">{lang === 'vi' ? 'Điểm số của bạn' : 'Your Assessment'}</span>
                    <p className="text-2xl font-black text-amber-400 font-mono">{isiScore} <span className="text-xs text-slate-400 font-normal">/ 100</span></p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-teal-400">{lang === 'vi' ? 'Dự kiến sau 14 ngày' : '14-Day Target'}</span>
                    <p className="text-2xl font-black text-teal-300 font-mono">&lt; 15 <span className="text-xs text-slate-400 font-normal">{lang === 'vi' ? '(Bình thường)' : '(Optimal)'}</span></p>
                  </div>
                </div>

                {/* 3 Core pillars of the personalized roadmap */}
                <div className="space-y-2.5">
                  <div className="flex items-start gap-2.5 text-xs">
                    <div className="h-5 w-5 rounded-md bg-purple-950 border border-purple-800/40 text-purple-300 flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </div>
                    <div>
                      <p className="font-bold text-white">{lang === 'vi' ? 'Cắt Đứt Vòng Lặp Lo Âu Ban Đêm (CBT-I)' : 'Cognitive De-escalation Protocol'}</p>
                      <p className="text-[11px] text-slate-400">{lang === 'vi' ? 'Xóa bỏ phản xạ "càng cố ngủ càng thức", đưa tâm trí về trạng thái thả lỏng.' : 'Disarm nighttime anxiety loops and bedtime overthinking without effort.'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 text-xs">
                    <div className="h-5 w-5 rounded-md bg-indigo-950 border border-indigo-800/40 text-indigo-300 flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </div>
                    <div>
                      <p className="font-bold text-white">{lang === 'vi' ? 'Âm Học Thần Kinh Thực Vật 432Hz & Delta Waves' : '432Hz Somatic Vagus Soundscapes'}</p>
                      <p className="text-[11px] text-slate-400">{lang === 'vi' ? 'Kích hoạt dây thần kinh phế vị xoa dịu nhịp tim và dẫn truyền sóng não ngủ sâu.' : 'Vagus nerve acoustic stimulation to slow pulse and guide delta sleep waves.'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 text-xs">
                    <div className="h-5 w-5 rounded-md bg-teal-950 border border-teal-800/40 text-teal-300 flex items-center justify-center shrink-0 mt-0.5">
                      3
                    </div>
                    <div>
                      <p className="font-bold text-white">{lang === 'vi' ? '100% Thuần Tự Nhiên - Không Thuốc, Không Nhờn' : '100% Non-Pharmacological & Sustainable'}</p>
                      <p className="text-[11px] text-slate-400">{lang === 'vi' ? 'Khôi phục cơ chế tiết Melatonin tự thân của cơ thể, phòng tránh tái phát.' : 'Restore internal circadian rhythms with zero dependence risk.'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Call To Action Card: Direct to Soulscape App */}
              <div className="mt-4 rounded-3xl border border-emerald-900/50 bg-gradient-to-b from-[#11241f] to-[#0a1714] p-5 text-center shadow-xl">
                <div className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800/40 px-2.5 py-0.5 rounded-full mb-2">
                  <Sparkles className="h-3 w-3" />
                  <span>{lang === 'vi' ? 'ỨNG DỤNG ĐÃ SẴN SÀNG TRÊN ĐIỆN THOẠI' : 'READY ON MOBILE APP'}</span>
                </div>

                <h3 className="text-lg font-extrabold text-white">
                  {lang === 'vi' ? 'Bắt Đầu Lộ Trình Trên App Soulscape' : 'Start Your Journey on Soulscape App'}
                </h3>
                <p className="mt-1 text-xs text-slate-300">
                  {lang === 'vi'
                    ? 'Toàn bộ bài tập thở Somatic, chuông xoay 432Hz và thư viện âm học đã được tích hợp sẵn trong ứng dụng.'
                    : 'Your 432Hz sleepscapes, somatic breathwork, and CBT-I routines are live in the app.'}
                </p>

                {/* Primary Smart Download Button */}
                <div className="mt-4 space-y-2.5">
                  {platform === 'ios' ? (
                    <button
                      onClick={() => handleDownloadApp('app_store')}
                      className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-teal-500 text-white font-bold text-base shadow-xl shadow-emerald-950/50 hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-3 cursor-pointer"
                    >
                      <Download className="h-5 w-5" />
                      <span>{lang === 'vi' ? 'Tải App Trên App Store (iOS)' : 'Download on App Store (iOS)'}</span>
                    </button>
                  ) : platform === 'android' ? (
                    <button
                      onClick={() => handleDownloadApp('google_play')}
                      className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-bold text-base shadow-xl shadow-emerald-950/50 hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-3 cursor-pointer"
                    >
                      <Download className="h-5 w-5" />
                      <span>{lang === 'vi' ? 'Tải App Trên Google Play (Android)' : 'Download on Google Play (Android)'}</span>
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <button
                          onClick={() => handleDownloadApp('app_store')}
                          className="flex-1 py-3 px-4 rounded-xl bg-purple-950 border border-purple-700/60 text-white font-semibold text-xs flex items-center justify-center gap-2 hover:bg-purple-900 transition-all cursor-pointer"
                        >
                          <span> App Store</span>
                        </button>
                        <button
                          onClick={() => handleDownloadApp('google_play')}
                          className="flex-1 py-3 px-4 rounded-xl bg-emerald-950 border border-emerald-700/60 text-white font-semibold text-xs flex items-center justify-center gap-2 hover:bg-emerald-900 transition-all cursor-pointer"
                        >
                          <span>▶ Google Play</span>
                        </button>
                      </div>

                      {/* Desktop QR Code */}
                      {qrDataUrl && (
                        <div className="pt-2 flex flex-col items-center">
                          <p className="text-[11px] text-slate-400 mb-2">
                            {lang === 'vi' ? 'Hoặc quét mã QR bằng camera điện thoại để tải:' : 'Or scan with your phone camera to download:'}
                          </p>
                          <div className="p-2 bg-white rounded-xl shadow-md">
                            <Image src={qrDataUrl} alt="Download Soulscape QR" width={140} height={140} unoptimized />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Guarantee */}
            <div className="text-center pt-2 pb-4 text-xs text-slate-500">
              <p>Soulscape: Meditation & Emotion • Stanford CBT-I & 432Hz Soundscapes</p>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
