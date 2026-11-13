'use client';

import { useEffect, useState } from 'react';
import type { NightPatternResult } from '@/lib/night-pattern';
import type { Recommendation } from '@/lib/recommendations';
import { ArrowRight, Check, Headphones, Info, Moon, Play, Sparkles, Volume2, X } from 'lucide-react';
import { BilingualLine, viForModule, viForPattern } from '@/lib/night-companion-i18n';

export function CompactResultScreen({
  result,
  recommendations,
  onStartTonight,
  onRecommendation,
  onBetaPlan: betaPlan,
}: {
  result: NightPatternResult;
  recommendations: Recommendation[];
  onStartTonight: () => void;
  onRecommendation: (recommendation: Recommendation) => void;
  onBetaPlan?: () => void;
}) {
  const [nightStarted, setNightStarted] = useState(false);
  const [isFacebookApp, setIsFacebookApp] = useState(false);
  const [hideInAppNotice, setHideInAppNotice] = useState(false);

  // Email lead capture state
  const [email, setEmail] = useState('');
  const [emailStatus, setEmailStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [emailMessage, setEmailMessage] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const ua = navigator.userAgent || navigator.vendor || '';
      if (/FBAN|FBAV|Instagram|FB_IAB|FBSS/i.test(ua)) {
        setIsFacebookApp(true);
      }
    }
  }, []);

  const externalRecommendation = recommendations.find(
    recommendation => recommendation.can_open && recommendation.provider?.relationship === 'affiliate',
  );

  if (nightStarted) return null;

  const handleStartNight1 = () => {
    setNightStarted(true);
    if (betaPlan) betaPlan();
  };

  const handleSaveJourneyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setEmailMessage('Vui lòng nhập địa chỉ email hợp lệ.');
      setEmailStatus('error');
      return;
    }
    setEmailStatus('submitting');
    setEmailMessage('');
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          locale: 'vi',
          source: `quiz_result_${result.primary_pattern.toLowerCase()}`,
        }),
      });
      if (res.ok) {
        setEmailStatus('success');
        setEmailMessage('✓ Đã lưu thành công! Chúng tôi sẽ gửi lộ trình Đêm 2 vào 21:00 tối mai.');
      } else {
        setEmailStatus('error');
        setEmailMessage('Không thể lưu email lúc này. Bạn vẫn có thể bấm nghe Đêm 1 ngay bên dưới.');
      }
    } catch {
      setEmailStatus('error');
      setEmailMessage('Không thể kết nối máy chủ. Bạn vẫn có thể trải nghiệm Đêm 1 miễn phí bên dưới.');
    }
  };

  return (
    <section className="mx-auto w-full max-w-xl px-4 pb-8 pt-2 sm:px-6 space-y-4">
      {/* 1. Facebook In-App Browser Guidance Notice */}
      {isFacebookApp && !hideInAppNotice && (
        <div className="rounded-2xl border border-sky-500/40 bg-sky-950/40 p-3.5 text-xs text-sky-200 shadow-lg flex items-start gap-3">
          <Info className="h-4 w-4 text-sky-300 shrink-0 mt-0.5" />
          <div className="flex-1 leading-relaxed">
            <p className="font-bold text-white text-[12px]">
              Bạn đang mở trong ứng dụng Facebook
            </p>
            <p className="text-slate-300 text-[11px] mt-0.5">
              Để âm thanh tiếp tục phát êm dịu khi tắt màn hình điện thoại, hãy bấm biểu tượng <strong className="text-white">•••</strong> ở góc trên bên phải và chọn <strong className="text-white">&quot;Mở bằng trình duyệt ngoài&quot;</strong> (Safari / Chrome).
            </p>
          </div>
          <button
            type="button"
            onClick={() => setHideInAppNotice(true)}
            className="text-slate-400 hover:text-white p-1"
            aria-label="Dismiss notice"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* 2. Night Pattern Reflection Header */}
      <div className="rounded-2xl border border-indigo-900/60 bg-[#0d1222] p-4 sm:p-5">
        <div className="flex items-center gap-2">
          <Moon className="h-4 w-4 text-teal-300" />
          <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-teal-300">
            <BilingualLine english="Your Personalized Night Pattern" vietnamese="Mẫu hình ban đêm được phân tích cho bạn" />
          </p>
        </div>
        <h1 className="mt-1.5 text-2xl sm:text-3xl font-black leading-tight text-white">
          <BilingualLine english={result.primary_pattern.replace(/_/g, ' ')} vietnamese={viForPattern(result.primary_pattern)} />
        </h1>
        <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-300">
          <BilingualLine
            english="Your answers indicate your mind and body stay highly active as bedtime nears. This is a non-clinical wellness reflection designed to help you gently wind down tonight."
            vietnamese="Câu trả lời của bạn cho thấy tâm trí và cơ thể vẫn hoạt động ở mức cao khi đến giờ ngủ. Đây là phân tích sức khỏe giấc ngủ phi lâm sàng giúp bạn thả lỏng tối nay."
          />
        </p>
      </div>

      {/* 3. HERO AUDIO PRESCRIPTION CARD (High Converting Direct CTA) */}
      <div className="relative overflow-hidden rounded-2xl border-2 border-teal-400/80 bg-gradient-to-b from-teal-950/60 via-[#0c1424] to-[#080d1a] p-4 sm:p-6 shadow-2xl shadow-teal-950/40">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-500/50 bg-teal-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-teal-200">
            <Headphones className="h-3 w-3 text-teal-300" />
            <BilingualLine english="Prescribed for Tonight · Night 1" vietnamese="Liệu trình Đêm 1 · Dành riêng cho bạn" />
          </span>
          <span className="text-[10px] font-semibold text-slate-400">
            100% Free · No App Required
          </span>
        </div>

        <h2 className="mt-3 text-xl sm:text-2xl font-black text-white leading-snug">
          <BilingualLine
            english="7-Min Sleep Hypnosis & 432Hz Soundscape"
            vietnamese="7 Phút Thôi Miên Giấc Ngủ & Tần Số Sóng Não 432Hz"
          />
        </h2>

        <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-slate-300">
          <BilingualLine
            english="Designed specifically to dissolve racing thoughts, disarm bedtime tension, and release physical tightness in your jaw and shoulders."
            vietnamese="Thiết kế chuyên biệt để tháo gỡ luồng suy nghĩ cuộn xoáy, gỡ bỏ căng cơ hàm và vai để đưa bạn vào giấc ngủ êm dịu."
          />
        </p>

        {/* 3 Bullet Highlights */}
        <div className="mt-4 space-y-2 rounded-xl border border-teal-900/50 bg-black/30 p-3 text-xs">
          <div className="flex items-start gap-2.5">
            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-teal-400/20 text-teal-300 text-[10px] font-bold">1</span>
            <p className="text-slate-200 leading-tight">
              <strong className="text-white">0:00 – 7:00:</strong> Thôi miên thì thầm (Bedtime Whisper) + sóng 432Hz siêu êm dịu làm yên tâm trí.
            </p>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-teal-400/20 text-teal-300 text-[10px] font-bold">2</span>
            <p className="text-slate-200 leading-tight">
              <strong className="text-white">7:00 – 25:00:</strong> Tự động hòa vào sóng Theta 432Hz & kén âm thanh sóng biển ru ngủ.
            </p>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-teal-400/20 text-teal-300 text-[10px] font-bold">3</span>
            <p className="text-slate-200 leading-tight">
              <strong className="text-white">Tự động ngắt:</strong> Giảm dần âm lượng về im lặng, bạn có thể an tâm nhắm mắt ngủ say.
            </p>
          </div>
        </div>

        {/* PRIMARY ACTION BUTTON */}
        <button
          type="button"
          onClick={handleStartNight1}
          className="mt-5 flex min-h-14 w-full items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-teal-400 via-teal-300 to-emerald-300 px-6 py-3.5 text-sm sm:text-base font-black text-slate-950 shadow-lg shadow-teal-500/20 transition hover:brightness-105 active:scale-[0.99]"
        >
          <Play className="h-4 w-4 fill-slate-950 text-slate-950" />
          <span>BẮT ĐẦU NGHE NIGHT 1 NGAY — MIỄN PHÍ</span>
          <ArrowRight className="h-4 w-4 text-slate-950" />
        </button>

        <p className="mt-2 text-center text-[11px] text-slate-400">
          Phát trực tiếp trên web • Không quảng cáo • Đã tối ưu âm lượng êm ái
        </p>
      </div>

      {/* 4. LEAD CAPTURE: SAVE 7-NIGHT JOURNEY & EMAIL REMINDER */}
      <div className="rounded-2xl border border-indigo-900/60 bg-[#0d1326] p-4 sm:p-5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-indigo-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-300">
            Lưu lộ trình 7 đêm & Nhắc nhở Đêm 2
          </h3>
        </div>
        <p className="mt-1 text-xs leading-relaxed text-slate-300">
          Nhập email của bạn để hệ thống lưu kết quả phân tích và gửi bài tập Đêm 2 vào lúc 21:00 tối mai.
        </p>

        {emailStatus === 'success' ? (
          <div className="mt-3 rounded-xl border border-teal-500/40 bg-teal-950/40 p-3 text-xs font-semibold text-teal-200">
            {emailMessage}
          </div>
        ) : (
          <form onSubmit={handleSaveJourneyEmail} className="mt-3 flex flex-col sm:flex-row gap-2">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Nhập email của bạn (ví dụ: ban@gmail.com)"
              className="flex-1 rounded-xl border border-indigo-800 bg-[#080b15] px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-teal-400"
            />
            <button
              type="submit"
              disabled={emailStatus === 'submitting'}
              className="rounded-xl border border-indigo-700 bg-indigo-950/80 px-4 py-2.5 text-xs font-bold text-teal-200 hover:bg-indigo-900/60 disabled:opacity-50 shrink-0"
            >
              {emailStatus === 'submitting' ? 'Đang lưu...' : 'Lưu lộ trình'}
            </button>
          </form>
        )}
        {emailStatus === 'error' && (
          <p className="mt-1.5 text-[11px] text-rose-300">{emailMessage}</p>
        )}
      </div>

      {/* 5. What May Help You Tonight Steps */}
      <div className="rounded-2xl border border-indigo-950/80 bg-[#080d1c] p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
          <BilingualLine english="Tonight's Structure" vietnamese="Cấu trúc lộ trình tối nay" />
        </p>
        <div className="mt-2 divide-y divide-indigo-950/80">
          {result.tonight_plan.map((step, index) => (
            <div key={step.title} className="flex items-center gap-3 py-2">
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-indigo-950 border border-indigo-800 text-[10px] font-black text-indigo-300">
                {index + 1}
              </span>
              <p className="min-w-0 flex-1 text-xs font-bold text-slate-200">
                <BilingualLine english={step.title} vietnamese={viForModule(step.title)} />
              </p>
              <span className="shrink-0 text-[11px] font-semibold text-teal-300/80">
                {step.duration}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 6. Secondary App Store Link */}
      <button
        type="button"
        onClick={onStartTonight}
        className="flex min-h-10 w-full items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition"
      >
        <BilingualLine english="Looking for the mobile app? Explore Soulscape App" vietnamese="Hoặc tải app di động: Khám phá ứng dụng Soulscape" />
        <ArrowRight className="h-3 w-3" />
      </button>

      {/* External Recommendation */}
      {externalRecommendation && (
        <div className="rounded-2xl border border-indigo-900/60 bg-[#111629] p-3 text-xs">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-300">Gợi ý bổ sung</p>
          <div className="mt-1 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-white">{externalRecommendation.title} · {externalRecommendation.provider?.name}</p>
              <p className="mt-0.5 text-[11px] text-slate-400">{externalRecommendation.description}</p>
            </div>
            <button
              type="button"
              onClick={() => onRecommendation(externalRecommendation)}
              className="flex min-h-8 shrink-0 items-center gap-1 rounded-lg border border-indigo-600 px-2.5 py-1 text-[10px] font-bold text-white"
            >
              XEM <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
