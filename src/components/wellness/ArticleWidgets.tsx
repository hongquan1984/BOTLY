'use client';

import { useState, useEffect } from 'react';
import {
  CheckCircle2, XCircle, AlertTriangle, Copy, Check, ShieldCheck, HelpCircle,
  Flame, Sparkles, RefreshCw, Send, Moon, ArrowRight, HeartPulse, Download,
  ExternalLink, Bed
} from 'lucide-react';
import type {
  TrustMeter, QuickRecipe, FactCheckItem, FaqItem, SafetyQuiz,
  SomaticSignals, WinddownProtocol, MindTrapItem, SomaticQuiz, SomaticQuizQuestion
} from '@/lib/published-articles';
import { trackClientEvent } from '@/components/analytics/AnalyticsTracker';

export function TrustMeterWidget({ data, locale }: { data: TrustMeter; locale: 'en' | 'vi' }) {
  const vi = locale === 'vi';
  const riskColor = data.risk_level === 'low'
    ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
    : data.risk_level === 'moderate'
    ? 'text-amber-700 bg-amber-50 border-amber-200'
    : 'text-rose-700 bg-rose-50 border-rose-200';

  const riskLabel = {
    low: vi ? 'Rủi ro thấp (An toàn)' : 'Low Risk (Safe)',
    moderate: vi ? 'Rủi ro trung bình (Thận trọng)' : 'Moderate Risk (Caution)',
    high: vi ? 'Rủi ro cao (Cần ý kiến bác sĩ)' : 'High Risk (Medical supervision required)',
  }[data.risk_level];

  return (
    <div className="my-8 rounded-3xl border border-[#d6e2d5] bg-gradient-to-br from-[#f4f7f2] to-[#e8efe5] p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#18302b] text-white shadow-md">
            <ShieldCheck className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#526b62]">
              {vi ? 'Thước đo kiểm chứng khoa học' : 'Science Verdict Meter'}
            </p>
            <h3 className="text-lg font-bold text-[#18302b]">
              {vi ? 'Mức độ tin cậy của bài thuốc' : 'Remedy Reliability Score'}
            </h3>
          </div>
        </div>
        <div className="flex items-baseline gap-1 rounded-2xl bg-white/80 px-4 py-2 shadow-inner">
          <span className="text-3xl font-extrabold text-[#18302b]">{data.score}</span>
          <span className="text-sm font-semibold text-[#526b62]">/ 10</span>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-white/70 p-3.5 border border-white">
          <p className="text-xs font-semibold text-[#526b62]">{vi ? 'Phán quyết khoa học' : 'Scientific Verdict'}</p>
          <p className="mt-1 text-sm font-medium text-[#18302b]">{data.verdict}</p>
        </div>
        <div className="rounded-2xl bg-white/70 p-3.5 border border-white">
          <p className="text-xs font-semibold text-[#526b62]">{vi ? 'Tác dụng chính' : 'Primary Benefit'}</p>
          <p className="mt-1 text-sm font-medium text-[#18302b]">{data.primary_benefit}</p>
        </div>
        <div className={`rounded-2xl border p-3.5 ${riskColor}`}>
          <p className="text-xs font-semibold">{vi ? 'Mức độ an toàn' : 'Safety Level'}</p>
          <p className="mt-1 text-sm font-bold">{riskLabel}</p>
        </div>
      </div>
    </div>
  );
}

export function QuickRecipeWidget({ data, locale }: { data: QuickRecipe; locale: 'en' | 'vi' }) {
  const vi = locale === 'vi';
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!data) return;
    const text = [
      `📌 ${data.badge || (vi ? 'CÔNG THỨC BỎ TÚI' : 'POCKET RECIPE')}`,
      `Khẩu phần: ${data.servings || '1 người'}`,
      `\n--- NGUYÊN LIỆU ---`,
      ...(data.ingredients?.map(i => `• ${i.item}: ${i.amount}${i.note ? ` (${i.note})` : ''}`) || []),
      `\n--- CÁCH THỰC HIỆN ---`,
      ...(data.steps?.map((s, idx) => `${idx + 1}. ${s}`) || []),
      data.best_time ? `\n⏰ Thời điểm: ${data.best_time}` : '',
      data.donts?.length ? `\n⚠️ CẦN TRÁNH:\n${data.donts.map(d => `- ${d}`).join('\n')}` : '',
      `\nNguồn: Botly.vn`
    ].filter(Boolean).join('\n');

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-10 overflow-hidden rounded-3xl border-2 border-[#18302b]/10 bg-white shadow-xl shadow-[#18302b]/5">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#18302b] px-6 py-4 text-white">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
            <Flame className="h-4 w-4" />
          </span>
          <span className="text-sm font-bold uppercase tracking-wider text-emerald-300">
            {data.badge || (vi ? 'CÔNG THỨC BỎ TÚI' : 'POCKET CHEAT SHEET')}
          </span>
          {data.servings && (
            <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs text-stone-200">
              {data.servings}
            </span>
          )}
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1 text-xs font-semibold text-white transition hover:bg-white/20 active:scale-95"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? (vi ? 'Đã sao chép' : 'Copied') : (vi ? 'Lưu công thức' : 'Copy Recipe')}
        </button>
      </div>

      <div className="p-6 lg:p-8">
        <div className="grid gap-8 md:grid-cols-2">
          {/* Ingredients */}
          {data.ingredients?.length ? (
            <div className="rounded-2xl bg-[#f7f9f6] p-5 border border-[#e4ede1]">
              <h4 className="text-sm font-bold uppercase tracking-wider text-[#355248]">
                {vi ? '1. Nguyên liệu & Tỷ lệ chuẩn' : '1. Standard Ingredients'}
              </h4>
              <ul className="mt-4 space-y-2.5">
                {data.ingredients.map((ing, i) => (
                  <li key={i} className="flex items-start justify-between gap-3 text-sm">
                    <span className="font-medium text-[#18302b]">{ing.item}</span>
                    <span className="shrink-0 rounded-md bg-white px-2 py-0.5 text-xs font-bold text-[#2d493f] shadow-sm border border-stone-200">
                      {ing.amount}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {/* Steps & Timing */}
          <div className="space-y-4">
            {data.steps?.length ? (
              <div>
                <h4 className="text-sm font-bold uppercase tracking-wider text-[#355248]">
                  {vi ? '2. Các bước thực hiện' : '2. Preparation Steps'}
                </h4>
                <ol className="mt-3 space-y-2 text-sm text-[#2d493f]">
                  {data.steps.map((step, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#18302b] text-[11px] font-bold text-white">
                        {idx + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}

            {data.best_time && (
              <div className="rounded-xl bg-emerald-50 p-3.5 border border-emerald-200 text-xs text-emerald-900">
                <span className="font-bold">{vi ? '⏰ Thời điểm tốt nhất: ' : '⏰ Optimal Timing: '}</span>
                {data.best_time}
              </div>
            )}
          </div>
        </div>

        {/* Donts & Warnings */}
        {data.donts?.length ? (
          <div className="mt-6 rounded-2xl bg-amber-50/80 p-4 border border-amber-200">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <span>{vi ? '3 ĐIỀU CẦN TRÁNH TUYỆT ĐỐI (DON’TS)' : 'CRITICAL MISTAKES TO AVOID'}</span>
            </div>
            <ul className="mt-2.5 space-y-1.5 text-xs text-amber-800">
              {data.donts.map((d, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="font-bold text-rose-500">✕</span>
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function SafetyQuizWidget({
  quiz,
  locale,
  articleSlug,
  mode = 'inline',
}: {
  quiz: SafetyQuiz;
  locale: 'en' | 'vi';
  articleSlug?: string;
  mode?: 'inline' | 'sidebar';
}) {
  const vi = locale === 'vi';
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [email, setEmail] = useState('');
  const [submittedEmail, setSubmittedEmail] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const totalQuestions = quiz.questions.length;
  const answeredCount = Object.keys(selectedAnswers).length;
  const isCompleted = answeredCount === totalQuestions;

  // Calculate verdict
  const warnings: string[] = [];
  let isContraindicated = false;

  quiz.questions.forEach((q) => {
    const selectedIdx = selectedAnswers[q.id];
    if (selectedIdx !== undefined) {
      const opt = q.options[selectedIdx];
      if (opt?.is_contraindicated) {
        isContraindicated = true;
      }
      if (opt?.warning) {
        warnings.push(opt.warning);
      }
    }
  });

  const handleSelect = (qId: string, optIdx: number) => {
    setSelectedAnswers(prev => {
      const next = { ...prev, [qId]: optIdx };
      if (Object.keys(next).length === quiz.questions.length && Object.keys(prev).length < quiz.questions.length) {
        let isContra = false;
        let hasWarn = false;
        quiz.questions.forEach((q) => {
          const sIdx = next[q.id];
          if (sIdx !== undefined) {
            const opt = q.options[sIdx];
            if (opt?.is_contraindicated) isContra = true;
            if (opt?.warning) hasWarn = true;
          }
        });
        const verdict = isContra ? 'contraindicated' : hasWarn ? 'caution' : 'safe';

        trackClientEvent('quiz_completed', {
          articleSlug,
          locale,
          metadata: {
            questions_count: quiz.questions.length,
            verdict
          }
        });
      }
      return next;
    });
  };

  const handleReset = () => {
    setSelectedAnswers({});
    setSubmittedEmail(false);
    setEmail('');
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || submitting) return;
    setSubmitting(true);
    try {
      await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          locale,
          source: `safety_quiz_${articleSlug || 'wellness'}`,
        }),
      });
      setSubmittedEmail(true);
      trackClientEvent('lead_submit', {
        articleSlug,
        locale,
        metadata: { source: `safety_quiz_${articleSlug || 'wellness'}` }
      });
    } catch {
      // ignore
    } finally {
      setSubmitting(false);
    }
  };

  const isSidebar = mode === 'sidebar';

  return (
    <div className={`overflow-hidden rounded-3xl border ${isSidebar ? 'border-emerald-200 bg-gradient-to-b from-[#f4f9f4] to-white p-5 shadow-lg' : 'my-10 border-2 border-emerald-300/50 bg-gradient-to-br from-[#f2f8f2] via-white to-[#f0f6f0] p-6 lg:p-8 shadow-xl shadow-emerald-950/5'}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
              {vi ? 'Trắc nghiệm sàng lọc' : 'Safety Screener'}
            </span>
            <h4 className={`${isSidebar ? 'text-sm font-bold' : 'text-lg font-bold'} text-[#18302b]`}>
              {quiz.title || (vi ? 'Bạn có an toàn để dùng bài thuốc này?' : 'Is this remedy safe for you?')}
            </h4>
          </div>
        </div>
        {answeredCount > 0 && (
          <button onClick={handleReset} title={vi ? 'Làm lại' : 'Reset'} className="text-stone-400 hover:text-stone-700">
            <RefreshCw className="h-4 w-4" />
          </button>
        )}
      </div>

      {quiz.subtitle && (
        <p className="mt-2 text-xs leading-relaxed text-[#526b62]">{quiz.subtitle}</p>
      )}

      {/* Progress */}
      <div className="mt-4 flex items-center justify-between text-xs text-[#526b62] font-semibold">
        <span>{vi ? `Tiến độ: ${answeredCount}/${totalQuestions} câu` : `Progress: ${answeredCount}/${totalQuestions}`}</span>
        <span>{Math.round((answeredCount / totalQuestions) * 100)}%</span>
      </div>
      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-stone-200">
        <div
          className="h-full bg-emerald-500 transition-all duration-300"
          style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
        />
      </div>

      {/* Step 1: Questions */}
      {!isCompleted ? (
        <div className="mt-5 space-y-4">
          {quiz.questions.map((q, qIndex) => {
            const currentSelected = selectedAnswers[q.id];

            return (
              <div key={q.id} className="rounded-2xl border border-stone-200/80 bg-white/90 p-4 shadow-sm">
                <p className="text-xs font-bold text-[#18302b]">
                  <span className="mr-1.5 text-emerald-600">#{qIndex + 1}.</span> {q.question}
                </p>
                <div className="mt-2.5 space-y-1.5">
                  {q.options.map((opt, optIndex) => {
                    const isSelected = currentSelected === optIndex;
                    return (
                      <button
                        key={optIndex}
                        type="button"
                        onClick={() => handleSelect(q.id, optIndex)}
                        className={`w-full rounded-xl p-2.5 text-left text-xs font-medium transition flex items-center justify-between border ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-sm font-semibold'
                            : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                        }`}
                      >
                        <span>{opt.label}</span>
                        {isSelected && <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0 ml-2" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Step 2: Instant Verdict & Email Lead Capture */
        <div className="mt-6 space-y-4">
          {/* Verdict Card */}
          <div className={`rounded-2xl border p-4 ${
            isContraindicated
              ? 'border-rose-300 bg-rose-50 text-rose-950'
              : warnings.length > 0
              ? 'border-amber-300 bg-amber-50 text-amber-950'
              : 'border-emerald-300 bg-emerald-50 text-emerald-950'
          }`}>
            <div className="flex items-center gap-2">
              {isContraindicated ? (
                <XCircle className="h-5 w-5 text-rose-600 shrink-0" />
              ) : warnings.length > 0 ? (
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              )}
              <p className="text-sm font-extrabold">
                {isContraindicated
                  ? (vi ? 'CẢNH BÁO: CHỐNG CHỈ ĐỊNH' : 'WARNING: CONTRAINDICATED')
                  : warnings.length > 0
                  ? (vi ? 'CẦN THẬN TRỌNG & ĐIỀU CHỈNH' : 'CAUTION & ADJUSTMENT NEEDED')
                  : (vi ? 'PHÙ HỢP 100% - AN TOÀN ĐỂ THỬ' : '100% SAFE FOR YOU')}
              </p>
            </div>

            <p className="mt-2 text-xs leading-relaxed font-medium">
              {isContraindicated
                ? (quiz.contraindicated_verdict || (vi ? 'Cơ địa của bạn đang có yếu tố chống chỉ định y khoa. Không nên tự ý áp dụng mẹo này.' : 'Your profile indicates clinical contraindications. Avoid self-administering this remedy.'))
                : warnings.length > 0
                ? (quiz.caution_verdict || (vi ? 'Bạn có thể áp dụng nhưng cần giảm 1/2 liều và tuân thủ chặt chẽ hướng dẫn an toàn.' : 'You may try this remedy with reduced dosage and strict adherence to safety guidelines.'))
                : (quiz.safe_verdict || (vi ? 'Không phát hiện yếu tố rủi ro. Bạn có thể áp dụng theo đúng tỷ lệ chuẩn.' : 'No risk factors detected. You can safely follow the standardized recipe.'))}
            </p>

            {warnings.length > 0 && (
              <ul className="mt-3 space-y-1 text-xs border-t border-black/10 pt-2.5">
                {warnings.map((w, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span>⚠️</span>
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Email Lead Capture Card */}
          <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-base">📩</span>
              <p className="text-xs font-bold text-[#18302b]">
                {vi ? 'Nhận Cẩm nang & Lịch uống 5 ngày chi tiết' : 'Get 5-Day Schedule & PDF Guide'}
              </p>
            </div>
            <p className="mt-1 text-[11px] text-[#526b62]">
              {vi
                ? 'Nhập Email để lưu kết quả này và nhận tài liệu hướng dẫn an toàn vào hòm thư.'
                : 'Enter your email to save this verdict and receive the complete safety protocol.'}
            </p>

            {submittedEmail ? (
              <div className="mt-3 rounded-xl bg-emerald-50 p-3 text-center text-xs font-bold text-emerald-800 border border-emerald-200">
                {vi ? '✓ Đã lưu! Vui lòng kiểm tra hòm thư của bạn.' : '✓ Saved! Please check your inbox.'}
              </div>
            ) : (
              <form onSubmit={handleEmailSubmit} className="mt-3 space-y-2">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={vi ? 'Nhập email của bạn...' : 'Enter your email...'}
                  className="w-full rounded-xl border border-stone-300 px-3 py-2 text-xs text-stone-800 focus:border-emerald-600 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#18302b] px-3 py-2 text-xs font-bold text-white transition hover:bg-emerald-800 active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>{submitting ? (vi ? 'Đang gửi...' : 'Sending...') : (vi ? 'Gửi cẩm nang cho tôi' : 'Send my guide')}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function FactChecksWidget({ items, locale }: { items: FactCheckItem[]; locale: 'en' | 'vi' }) {
  const vi = locale === 'vi';
  if (!items?.length) return null;

  return (
    <div className="my-10">
      <div className="mb-6 flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-emerald-600" />
        <h3 className="text-xl font-bold text-[#18302b]">
          {vi ? 'Bóc mẽ lời đồn: Sự thật vs. Tin đồn mạng xã hội' : 'Myth vs. Science: Social Media Fact-Check'}
        </h3>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {items.map((item, i) => (
          <div key={i} className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
            <div className="bg-rose-50/80 p-4 border-b border-rose-100 flex items-start gap-2.5">
              <XCircle className="h-5 w-5 shrink-0 text-rose-600 mt-0.5" />
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700">
                  {vi ? 'Lời đồn lan truyền' : 'Viral Myth'}
                </span>
                <p className="mt-1 text-sm font-semibold text-rose-950">{item.myth}</p>
              </div>
            </div>
            <div className="bg-emerald-50/40 p-4 flex items-start gap-2.5">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" />
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                  {vi ? 'Nghiên cứu khoa học xác nhận' : 'Scientific Reality'}
                </span>
                <p className="mt-1 text-sm text-[#18302b]">{item.reality}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FaqsWidget({ items, locale, isMidnight }: { items: FaqItem[]; locale: 'en' | 'vi'; isMidnight?: boolean }) {
  const vi = locale === 'vi';
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  if (!items?.length) return null;

  return (
    <div className={`my-10 rounded-3xl border p-6 lg:p-8 ${
      isMidnight
        ? 'border-indigo-900/30 bg-gradient-to-br from-[#0f172a] via-[#162036] to-[#0f172a] text-slate-100'
        : 'border-[#d6e2d5] bg-[#f9faf7]'
    }`}>
      <div className="mb-6 flex items-center gap-2.5">
        {isMidnight ? (
          <Moon className="h-5 w-5 text-indigo-400" />
        ) : (
          <HelpCircle className="h-5 w-5 text-[#355248]" />
        )}
        <h3 className={`text-xl font-bold ${isMidnight ? 'text-white' : 'text-[#18302b]'}`}>
          {isMidnight
            ? (vi ? 'Hỏi đáp đêm muộn (Midnight FAQs)' : 'Midnight FAQs: Calming Your Racing Thoughts')
            : (vi ? 'Giải đáp các thắc mắc thường gặp' : 'Frequently Asked Questions')}
        </h3>
      </div>

      <div className="space-y-3">
        {items.map((item, i) => {
          const isOpen = openIndex === i;
          return (
            <div
              key={i}
              className={`overflow-hidden rounded-2xl border ${
                isMidnight
                  ? 'border-slate-700/60 bg-slate-800/50'
                  : 'border-stone-200 bg-white'
              }`}
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : i)}
                className={`flex w-full items-center justify-between p-4 text-left font-semibold cursor-pointer ${
                  isMidnight
                    ? 'text-slate-100 hover:bg-slate-700/40'
                    : 'text-[#18302b] hover:bg-stone-50'
                }`}
              >
                <span>{item.question}</span>
                <span className={`ml-3 shrink-0 font-bold ${isMidnight ? 'text-indigo-400' : 'text-stone-400'}`}>
                  {isOpen ? '−' : '+'}
                </span>
              </button>
              {isOpen && (
                <div
                  className={`border-t p-4 text-sm leading-relaxed ${
                    isMidnight
                      ? 'border-slate-700/50 bg-slate-900/40 text-slate-300'
                      : 'border-stone-100 bg-[#fdfdfc] text-[#40564e]'
                  }`}
                >
                  {item.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function SomaticSignalsWidget({ data, locale }: { data: SomaticSignals; locale: 'en' | 'vi' }) {
  const vi = locale === 'vi';
  return (
    <div className="my-8 overflow-hidden rounded-3xl border border-slate-700/60 bg-gradient-to-br from-[#0f172a] via-[#162036] to-[#0d1527] p-6 text-slate-100 shadow-xl shadow-slate-950/20 sm:p-8">
      {/* Header */}
      <div className="flex items-center gap-3.5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 shadow-inner">
          <HeartPulse className="h-6 w-6 text-indigo-300" />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-indigo-400">
            {vi ? 'Hộp Tín Hiệu Cơ Thể & Tác Nhân' : 'Somatic Signals & Triggers'}
          </p>
          <h3 className="text-lg font-bold text-white sm:text-xl">
            {vi ? 'Lắng nghe phản ứng của cơ thể trong đêm muộn' : 'Listen to Your Body’s Midnight Signals'}
          </h3>
        </div>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        {/* Body Signals */}
        <div className="rounded-2xl border border-slate-700/50 bg-slate-800/40 p-5 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-300">
            <span className="h-2 w-2 rounded-full bg-teal-400 animate-pulse" />
            <span>{vi ? 'Tín hiệu thể chất (Body Signals)' : 'Physical Sensations (Body Signals)'}</span>
          </div>
          <div className="mt-3.5 flex flex-wrap gap-2">
            {data.body_signals.map((sig, i) => (
              <span
                key={i}
                className="inline-flex items-center rounded-xl border border-teal-500/30 bg-teal-950/40 px-3 py-1.5 text-xs font-medium text-teal-200"
              >
                {sig}
              </span>
            ))}
          </div>
        </div>

        {/* Triggers */}
        <div className="rounded-2xl border border-slate-700/50 bg-slate-800/40 p-5 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-300">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
            <span>{vi ? 'Tác nhân kích hoạt (Midnight Triggers)' : 'Midnight Triggers'}</span>
          </div>
          <div className="mt-3.5 flex flex-wrap gap-2">
            {data.triggers.map((trig, i) => (
              <span
                key={i}
                className="inline-flex items-center rounded-xl border border-amber-500/30 bg-amber-950/40 px-3 py-1.5 text-xs font-medium text-amber-200"
              >
                {trig}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Transmutation Pathway */}
      {data.transmutation && (
        <div className="mt-6 rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/50 via-slate-900/60 to-purple-950/50 p-4.5 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-300">
                {vi ? 'Chuyển hóa cảm xúc & Hạ nhiệt thần kinh' : 'Emotional Transmutation Pathway'}
              </p>
              <p className="mt-1 text-sm font-semibold text-white sm:text-base">
                {data.transmutation}
              </p>
            </div>
            <span className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-300 border border-indigo-400/30">
              <Sparkles className="h-3.5 w-3.5" />
              <span>{vi ? 'Đối giao cảm' : 'Parasympathetic'}</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export function WinddownProtocolWidget({ data, locale }: { data: WinddownProtocol; locale: 'en' | 'vi' }) {
  const vi = locale === 'vi';
  const [copied, setCopied] = useState(false);

  // Interactive Breathing Slider State: 4s Inhale, 4s Hold, 8s Exhale (Total 16s)
  const [isBreathing, setIsBreathing] = useState(false);
  const [breathSecond, setBreathSecond] = useState(0);

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

  const handleCopy = () => {
    if (!data) return;
    const text = [
      `🌙 ${data.badge || (vi ? 'NGHI THỨC HẠ CÁNH TRÊN NỆM (3 PHÚT)' : '3-MINUTE BEDTIME SOMATIC RESET')}`,
      data.objective ? `\n🎯 ${vi ? 'Mục tiêu' : 'Objective'}: ${data.objective}` : '',
      `\n--- ${vi ? 'CÁC BƯỚC THỰC HIỆN NGAY TRÊN NỆM' : 'BEDSIDE PROTOCOL STEPS'} ---`,
      ...(data.steps?.map((s, idx) => `${idx + 1}. ${s}`) || []),
      data.donts?.length ? `\n--- ${vi ? '3 ĐIỀU CẤM KỴ ĐÊM MUỘN (DON\'TS)' : '3 CRITICAL MIDNIGHT DON\'TS'} ---\n${data.donts.map(d => `✕ ${d}`).join('\n')}` : '',
      `\nNguồn: Soulscape • Mindful Haven / Botly.vn`
    ].filter(Boolean).join('\n');

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Calculate breathing phase parameters
  let phaseText = vi ? '🌿 Sẵn sàng bắt đầu nhịp thở' : '🌿 Ready to start breathing cycle';
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

  return (
    <div className="my-10 overflow-hidden rounded-3xl border-2 border-indigo-900/20 bg-white shadow-xl shadow-slate-900/5">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-[#0f172a] via-[#1e293b] to-[#131b2e] px-6 py-4 text-white">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-300">
            <Moon className="h-4 w-4" />
          </span>
          <span className="text-sm font-bold uppercase tracking-wider text-indigo-200">
            {data.badge || (vi ? 'NGHI THỨC HẠ CÁNH TRÊN NỆM (3 PHÚT)' : '3-MINUTE BEDTIME SOMATIC RESET')}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1 text-xs font-semibold text-white transition hover:bg-white/20 active:scale-95 cursor-pointer"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? (vi ? 'Đã sao chép vào ghi chú' : 'Copied to clipboard') : (vi ? 'Sao chép 1-Click' : '1-Click Copy')}
        </button>
      </div>

      <div className="p-6 lg:p-8">
        {/* Objective */}
        {data.objective && (
          <div className="mb-6 rounded-2xl bg-indigo-50/70 border border-indigo-100 p-4 text-xs sm:text-sm text-indigo-950 font-medium leading-relaxed">
            <span className="font-bold text-indigo-900">
              {vi ? '🎯 Mục tiêu thể cảm: ' : '🎯 Somatic Objective: '}
            </span>
            {data.objective}
          </div>
        )}

        {/* Steps */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#355248]">
            {vi ? 'Các bước thực hiện ngay trên giường' : 'Bedside Protocol Steps'}
          </h4>
          <div className="space-y-3">
            {data.steps.map((step, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-[#f8fafc] p-4 transition hover:bg-white hover:shadow-sm"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0f172a] text-xs font-bold text-indigo-200">
                  {idx + 1}
                </span>
                <p className="text-sm text-slate-800 leading-relaxed font-medium pt-0.5">{step}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Interactive Paced Breathing Slider (Hít 4s - Giữ 4s - Thở 8s) with Big Centered Number */}
        <div className="mt-8 overflow-hidden rounded-2xl border border-indigo-200/80 bg-gradient-to-br from-indigo-50/60 via-purple-50/30 to-slate-50 p-5 shadow-sm">
          <div className="text-center pb-2">
            <span className="text-sm font-bold uppercase tracking-wider text-indigo-950">
              {phaseText}
            </span>
            <p className="text-xs text-stone-500 mt-0.5">{descText}</p>
          </div>

          <div className="my-3">
            {/* Big Slider Track with Large Centered Number */}
            <div className="relative h-14 w-full overflow-hidden rounded-2xl bg-slate-200/80 p-1 border-2 border-slate-300/80 flex items-center shadow-inner">
              <div
                className={`h-full rounded-xl transition-all duration-1000 ease-linear shadow-sm ${barColorClass}`}
                style={{ width: barWidth }}
              />
              {/* BIG CENTERED NUMBER & BADGE */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center gap-2 z-10">
                <span className="text-3xl font-black tracking-tight text-slate-900 drop-shadow-sm">
                  {isBreathing ? remainSec : 0}
                </span>
                <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/90 text-slate-800 border border-slate-200 shadow-sm">
                  {phaseBadge}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1">
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
              className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition shadow-sm cursor-pointer ${
                isBreathing
                  ? 'bg-stone-800 text-amber-200 hover:bg-stone-700'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              <span>{isBreathing ? '❚❚' : '▶'}</span>
              <span>{isBreathing ? (vi ? 'Tạm dừng' : 'Pause') : (vi ? 'Bắt đầu thở theo thanh trượt' : 'Start breathing with slider')}</span>
            </button>
            <span className="text-[11px] text-stone-500">
              {vi ? '✨ Làm 2–3 chu kỳ để hạ nhịp tim trước khi ngủ' : '✨ Practice 2–3 cycles to calm heart rate'}
            </span>
          </div>
        </div>

        {/* Donts */}
        {data.donts?.length ? (
          <div className="mt-8 rounded-2xl border border-rose-200/80 bg-rose-50/60 p-5">
            <div className="flex items-center gap-2 text-xs font-bold text-rose-900">
              <AlertTriangle className="h-4 w-4 text-rose-600" />
              <span>{vi ? '3 ĐIỀU CẤM KỴ ĐÊM MUỘN (DON’TS)' : '3 CRITICAL MIDNIGHT DON’TS'}</span>
            </div>
            <ul className="mt-3 space-y-2 text-xs sm:text-sm text-rose-900 font-medium">
              {data.donts.map((d, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="font-bold text-rose-600">✕</span>
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function MindTrapsWidget({ items, locale }: { items: MindTrapItem[]; locale: 'en' | 'vi' }) {
  const vi = locale === 'vi';
  if (!items?.length) return null;

  return (
    <div className="my-10">
      <div className="mb-6 flex items-center gap-2.5">
        <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
          <Sparkles className="h-4 w-4" />
        </span>
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700">
            {vi ? 'Giải mã nhận thức' : 'Cognitive Reframing'}
          </span>
          <h3 className="text-xl font-bold text-[#18302b]">
            {vi ? 'Bóc mẽ bẫy suy nghĩ đêm muộn: Ảo giác vs. Sự thật' : 'Midnight Mind Traps: Distortion vs. Reality'}
          </h3>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {items.map((item, i) => (
          <div key={i} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between">
            {/* Trap */}
            <div className="bg-amber-50/70 p-5 border-b border-amber-100 flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-200/70 text-amber-800 text-xs font-bold mt-0.5">
                ✕
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                  {vi ? 'Bẫy suy nghĩ lúc nửa đêm (The Trap)' : 'Midnight Mental Trap'}
                </span>
                <p className="mt-1 text-sm font-semibold text-amber-950 leading-snug">&ldquo;{item.trap}&rdquo;</p>
              </div>
            </div>

            {/* Reality */}
            <div className="bg-emerald-50/50 p-5 flex-1 flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-200/70 text-emerald-800 text-xs font-bold mt-0.5">
                ✓
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                  {vi ? 'Sự thật chữa lành & Khoa học (The Reality)' : 'Healing Reality & Neuroscience'}
                </span>
                <p className="mt-1 text-sm text-slate-800 leading-relaxed font-medium">{item.reality}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SomaticQuizWidget({
  quiz,
  locale,
  articleSlug,
  mode = 'inline',
}: {
  quiz: SomaticQuiz;
  locale: 'en' | 'vi';
  articleSlug?: string;
  mode?: 'inline' | 'sidebar';
}) {
  const vi = locale === 'vi';
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});

  const defaultQuestions: SomaticQuizQuestion[] = vi
    ? [
        {
          id: 'q1_tension_area',
          question: 'Khu vực nào trên cơ thể bạn đang cảm thấy gồng cứng hoặc căng tức nhất lúc này?',
          options: [
            { label: 'Nặng ngực, hơi thở nông hoặc nghẹn ở cổ họng', sprout: 'Mầm Lo Lắng (Worry Sprout)' },
            { label: 'Gồng cứng cổ vai gáy, siết chặt quai hàm vô thức', sprout: 'Mầm Kiệt Sức (Burnout Sprout)' },
            { label: 'Bồn chồn ở chân, muốn cựa quậy trở mình liên tục', sprout: 'Mầm Bồn Chồn (Restless Sprout)' },
            { label: 'Đầu óc căng ong ong, mắt khô rát vì ánh sáng màn hình', sprout: 'Mầm Quá Tải (Overload Sprout)' },
          ],
        },
        {
          id: 'q2_racing_thought',
          question: 'Dòng suy nghĩ nào đang chiếm lĩnh và quẩn quanh trong tâm trí bạn nhiều nhất?',
          options: [
            { label: 'Bi kịch hóa ngày mai: Lo sợ mệt mỏi và hỏng việc', sprout: 'Mầm Lo Lắng (Worry Sprout)' },
            { label: 'Tua đi tua lại những chuyện áp lực, sai lầm ban ngày', sprout: 'Mầm Kiệt Sức (Burnout Sprout)' },
            { label: 'Cảm giác tiếc nuối thời gian, khao khát tự do nên cố thức lướt mạng', sprout: 'Mầm Thao Thức (Night Owl Sprout)' },
          ],
        },
        {
          id: 'q3_frequency',
          question: 'Tần suất bạn gặp phải trạng thái thao thức đêm muộn này như thế nào?',
          options: [
            { label: 'Thỉnh thoảng vào những ngày chịu nhiều áp lực công việc' },
            { label: 'Gần như mỗi đêm trong khung giờ 1h - 3h sáng' },
            { label: 'Chỉ đêm nay, như một vị khách bất chợt ghé thăm' },
          ],
        },
      ]
    : [
        {
          id: 'q1_tension_area',
          question: 'Where in your body are you feeling the most tension right now?',
          options: [
            { label: 'Chest tightness, shallow breath or throat lump', sprout: 'Worry Sprout' },
            { label: 'Stiff neck and shoulders, clenched jaw', sprout: 'Burnout Sprout' },
            { label: 'Restless legs, constant urge to toss and turn', sprout: 'Restless Sprout' },
            { label: 'Racing head pressure, dry eyes from screens', sprout: 'Overload Sprout' },
          ],
        },
        {
          id: 'q2_racing_thought',
          question: 'What thought loop is dominating your midnight mind?',
          options: [
            { label: 'Catastrophizing tomorrow: fearing exhaustion and ruined plans', sprout: 'Worry Sprout' },
            { label: 'Replaying daytime conflicts, regrets and conversations', sprout: 'Burnout Sprout' },
            { label: 'Craving autonomy, endlessly scrolling to reclaim stolen time', sprout: 'Night Owl Sprout' },
          ],
        },
        {
          id: 'q3_frequency',
          question: 'How frequently does this midnight sleeplessness visit you?',
          options: [
            { label: 'Occasionally on high-stress work days' },
            { label: 'Almost every night between 1 AM and 3 AM' },
            { label: 'Just tonight, like an uninvited visitor' },
          ],
        },
      ];

  const questions = (quiz.questions && quiz.questions.length > 0) ? quiz.questions : defaultQuestions;
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(selectedAnswers).length;
  const isCompleted = answeredCount === totalQuestions;

  // Determine Sprout companion
  let identifiedSprout = quiz.recommended_sprout || (vi ? 'Mầm Lo Lắng (Worry Sprout)' : 'Worry Sprout');
  const opt1 = questions[0]?.options[selectedAnswers['q1_tension_area'] ?? 0];
  const opt2 = questions[1]?.options[selectedAnswers['q2_racing_thought'] ?? 0];
  if (opt1?.sprout) {
    identifiedSprout = opt1.sprout;
  } else if (opt2?.sprout) {
    identifiedSprout = opt2.sprout;
  }

  const soundscape = quiz.recommended_soundscape || (vi ? 'Mưa Rơi Đêm Muộn & Chuông Gió Êm Đềm' : 'Gentle Midnight Rain & Soft Windchimes');

  const handleSelect = (qId: string, optIdx: number) => {
    setSelectedAnswers(prev => {
      const next = { ...prev, [qId]: optIdx };
      if (Object.keys(next).length === questions.length && Object.keys(prev).length < questions.length) {
        let sprout = identifiedSprout;
        const o1 = questions[0]?.options[next['q1_tension_area'] ?? 0];
        const o2 = questions[1]?.options[next['q2_racing_thought'] ?? 0];
        if (o1?.sprout) sprout = o1.sprout;
        else if (o2?.sprout) sprout = o2.sprout;

        trackClientEvent('quiz_completed', {
          articleSlug,
          locale,
          metadata: {
            quiz_type: 'somatic_screener',
            questions_count: questions.length,
            sprout,
            verdict: 'safe'
          }
        });
      }
      return next;
    });
  };

  const handleReset = () => {
    setSelectedAnswers({});
  };

  const isSidebar = mode === 'sidebar';

  return (
    <div className={`overflow-hidden rounded-3xl border ${
      isSidebar
        ? 'border-indigo-800/40 bg-gradient-to-b from-[#111a2e] to-[#0b1120] text-slate-100 p-5 shadow-lg'
        : 'my-10 border-2 border-indigo-700/30 bg-gradient-to-br from-[#0f172a] via-[#17233d] to-[#0d1527] p-6 lg:p-8 text-slate-100 shadow-xl shadow-indigo-950/20'
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 shadow-sm">
            <Moon className="h-4 w-4" />
          </span>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">
              {vi ? 'Trắc nghiệm thể cảm 15s' : '15s Somatic Check'}
            </span>
            <h4 className={`${isSidebar ? 'text-sm font-bold' : 'text-lg font-bold'} text-white`}>
              {quiz.title || (vi ? 'Nhận diện cảm giác & Chú Mầm đêm nay' : 'Check Your Midnight Sensation')}
            </h4>
          </div>
        </div>
        {answeredCount > 0 && (
          <button onClick={handleReset} title={vi ? 'Làm lại' : 'Reset'} className="text-slate-400 hover:text-white cursor-pointer">
            <RefreshCw className="h-4 w-4" />
          </button>
        )}
      </div>

      {quiz.subtitle && (
        <p className="mt-2 text-xs leading-relaxed text-slate-300">{quiz.subtitle}</p>
      )}

      {/* Progress */}
      <div className="mt-4 flex items-center justify-between text-xs text-indigo-300 font-semibold">
        <span>{vi ? `Tiến độ: ${answeredCount}/${totalQuestions} câu` : `Progress: ${answeredCount}/${totalQuestions}`}</span>
        <span>{Math.round((answeredCount / totalQuestions) * 100)}%</span>
      </div>
      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full bg-indigo-400 transition-all duration-300"
          style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
        />
      </div>

      {/* Step 1: Questions */}
      {!isCompleted ? (
        <div className="mt-5 space-y-4">
          {questions.map((q, qIndex) => {
            const currentSelected = selectedAnswers[q.id];

            return (
              <div key={q.id} className="rounded-2xl border border-slate-700/60 bg-slate-800/40 p-4 shadow-sm backdrop-blur-sm">
                <p className="text-xs font-bold text-slate-100">
                  <span className="mr-1.5 text-indigo-400">#{qIndex + 1}.</span> {q.question}
                </p>
                <div className="mt-2.5 space-y-1.5">
                  {q.options.map((opt, optIndex) => {
                    const isSelected = currentSelected === optIndex;
                    return (
                      <button
                        key={optIndex}
                        type="button"
                        onClick={() => handleSelect(q.id, optIndex)}
                        className={`w-full rounded-xl p-2.5 text-left text-xs font-medium transition flex items-center justify-between border cursor-pointer ${
                          isSelected
                            ? 'border-indigo-400 bg-indigo-950/60 text-white shadow-sm font-semibold'
                            : 'border-slate-700/50 bg-slate-900/30 text-slate-300 hover:bg-slate-800/50 hover:text-white'
                        }`}
                      >
                        <span>{opt.label}</span>
                        {isSelected && <Check className="h-3.5 w-3.5 text-indigo-300 shrink-0 ml-2" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Step 2: Sprout Companion Result & Soulscape Funnel */
        <div className="mt-6 space-y-4">
          {/* Sprout Result Card */}
          <div className="rounded-2xl border border-indigo-500/40 bg-gradient-to-br from-indigo-950/80 via-slate-900/90 to-purple-950/70 p-5 text-white">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-300 shrink-0" />
              <p className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                {vi ? 'CHÚ MẦM CẢM XÚC ĐỒNG HÀNH ĐÊM NAY' : 'YOUR MIDNIGHT COMPANION SPROUT'}
              </p>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <h5 className="text-lg font-bold text-white sm:text-xl">{identifiedSprout}</h5>
            </div>

            <p className="mt-2 text-xs leading-relaxed text-slate-300">
              {vi
                ? 'Cảm xúc không phải là sự yếu đuối — chúng chỉ là những vị khách ghé thăm cần một không gian êm dịu để hạ cánh.'
                : 'Emotions are not flaws — they are gentle visitors asking for a softer place to land.'}
            </p>

            {/* Recommended Soundscape */}
            <div className="mt-4 rounded-xl border border-indigo-400/20 bg-indigo-950/50 p-3">
              <p className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider">
                {vi ? '🎧 Âm thanh gợi ý để hạ cánh giấc ngủ:' : '🎧 Recommended Bedtime Soundscape:'}
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-100">{soundscape}</p>
            </div>

            {/* App CTA Buttons */}
            <div className="mt-5 space-y-2.5">
              <a
                href={quiz.app_store_url || 'https://soulscapeworld.com'}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-950/50 transition hover:from-indigo-600 hover:to-purple-700 active:scale-95"
              >
                <span>{vi ? 'Bắt đầu hạ cánh trên Soulscape' : 'Start Wind-down on Soulscape'}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </a>

              <p className="text-center text-[10px] text-indigo-300/80 font-medium">
                {vi ? '☁ Zero Streak Guilt — Ứng dụng thiền không áp lực chuỗi ngày' : '☁ Zero Streak Guilt — Meditation without streak pressure'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

