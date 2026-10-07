'use client';

import { useState } from 'react';
import type { NightPatternResult } from '@/lib/night-pattern';
import type { Recommendation } from '@/lib/recommendations';
import { ArrowRight } from 'lucide-react';
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
  const externalRecommendation = recommendations.find(
    recommendation => recommendation.can_open && recommendation.provider?.relationship === 'affiliate',
  );

  if (nightStarted) return null;

  const onBetaPlan = betaPlan ? () => { setNightStarted(true); betaPlan(); } : undefined;

  return (
    <section className="mx-auto w-full max-w-xl px-4 pb-5 pt-2 sm:px-6">
      <div className="border-b border-indigo-900/60 pb-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-teal-300"><BilingualLine english="Your Night Pattern" vietnamese="Mau hinh ban dem cua ban" /></p>
        <h1 className="mt-1 text-3xl font-black leading-tight text-white"><BilingualLine english={result.primary_pattern.replace('_', ' ')} vietnamese={viForPattern(result.primary_pattern)} /></h1>
        <p className="mt-1 max-w-lg text-xs leading-5 text-slate-300"><BilingualLine english="Your answers suggest this pattern is especially relevant tonight. This is a wellness reflection, not a diagnosis." vietnamese="Cac cau tra loi cho thay mau hinh nay dang phu hop voi toi nay. Day la goi y ve suc khoe, khong phai chan doan." /></p>
      </div>

      <div className="border-b border-indigo-900/60 py-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-teal-300"><BilingualLine english="What May Help You Tonight" vietnamese="Dieu gi co the giup ban toi nay" /></p>
        <div className="mt-2 divide-y divide-indigo-950/80">
          {result.tonight_plan.map((step, index) => (
            <div key={step.title} className="flex items-center gap-3 py-2">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-indigo-600 text-[11px] font-black">{index + 1}</span>
              <p className="min-w-0 flex-1 text-sm font-bold text-white"><BilingualLine english={step.title} vietnamese={viForModule(step.title)} /></p>
              <span className="shrink-0 text-xs font-semibold text-teal-300">{step.duration}</span>
            </div>
          ))}
        </div>
      </div>

      {onBetaPlan && <div className="mt-4 rounded-2xl border border-teal-300/70 bg-teal-950/30 p-4"><p className="text-sm font-black text-white"><BilingualLine english="Try your free Night 1 plan" vietnamese="Thu Night 1 mien phi cua ban" /></p><p className="mt-1 text-xs leading-5 text-slate-300"><BilingualLine english="Personalized from your quiz answers. No payment or account required. General wellness only." vietnamese="Duoc ca nhan hoa tu cau tra loi quiz. Khong can thanh toan hay tao tai khoan. Chi danh cho suc khoe tong quat." /></p><button type="button" onClick={onBetaPlan} className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-teal-300 px-4 py-3 text-xs font-black text-slate-950"><BilingualLine english="TRY YOUR NIGHT 1 PLAN — FREE" vietnamese="THU KE HOACH DEM 1 — MIEN PHI" /><ArrowRight className="h-4 w-4" /></button></div>}

      <button type="button" onClick={onStartTonight} className="mt-3 flex min-h-10 w-full items-center justify-center gap-1 px-4 py-2 text-xs font-bold text-teal-200 underline decoration-teal-700 underline-offset-4">
        <BilingualLine english="Continue with Soulscape" vietnamese="Tiep tuc voi Soulscape" /> <ArrowRight className="h-3.5 w-3.5" />
      </button>

      {externalRecommendation && (
        <div className="mt-4 rounded-2xl border border-indigo-900/60 bg-[#111629] p-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-300">Recommended for your pattern</p>
          <div className="mt-1 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-white">{externalRecommendation.title} · {externalRecommendation.provider?.name}</p>
              <p className="mt-1 text-xs text-slate-400">{externalRecommendation.description}</p>
            </div>
            <button type="button" onClick={() => onRecommendation(externalRecommendation)} className="flex min-h-10 shrink-0 items-center gap-1 rounded-xl border border-indigo-600 px-3 py-2 text-[10px] font-black text-white">
              TRY <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}

    </section>
  );
}
