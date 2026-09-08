'use client';

import { useState } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Copy, Check, ShieldCheck, HelpCircle, Flame, Sparkles, RefreshCw, Send } from 'lucide-react';
import type { TrustMeter, QuickRecipe, FactCheckItem, FaqItem, SafetyQuiz } from '@/lib/published-articles';
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
        trackClientEvent('quiz_completed', {
          articleSlug,
          locale,
          metadata: { questions_count: quiz.questions.length }
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

export function FaqsWidget({ items, locale }: { items: FaqItem[]; locale: 'en' | 'vi' }) {
  const vi = locale === 'vi';
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  if (!items?.length) return null;

  return (
    <div className="my-10 rounded-3xl border border-[#d6e2d5] bg-[#f9faf7] p-6 lg:p-8">
      <div className="mb-6 flex items-center gap-2">
        <HelpCircle className="h-5 w-5 text-[#355248]" />
        <h3 className="text-xl font-bold text-[#18302b]">
          {vi ? 'Giải đáp các thắc mắc thường gặp' : 'Frequently Asked Questions'}
        </h3>
      </div>

      <div className="space-y-3">
        {items.map((item, i) => {
          const isOpen = openIndex === i;
          return (
            <div key={i} className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
              <button
                onClick={() => setOpenIndex(isOpen ? null : i)}
                className="flex w-full items-center justify-between p-4 text-left font-semibold text-[#18302b] hover:bg-stone-50"
              >
                <span>{item.question}</span>
                <span className="ml-3 shrink-0 text-stone-400 font-bold">{isOpen ? '−' : '+'}</span>
              </button>
              {isOpen && (
                <div className="border-t border-stone-100 bg-[#fdfdfc] p-4 text-sm leading-relaxed text-[#40564e]">
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
