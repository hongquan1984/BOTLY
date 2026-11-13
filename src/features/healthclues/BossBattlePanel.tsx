"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { KeyRound, Shield, Sparkles, Swords } from "lucide-react";
import { HealthCluesAdventurer } from "@/components/healthclues/HealthCluesAdventurer";
import { HealthCluesGameIcon } from "@/components/healthclues/HealthCluesGameIcon";
import { useHealthCluesLocale } from "@/components/healthclues/HealthCluesLocaleProvider";

type Boss = { boss_id: string; version: number; title: string; intro: string; question_prompt: string; question_options: Array<{ id: string; label: string }>; demoOnly?: boolean };
type Payload = { boss: Boss | null; cleared: boolean; emptyReason?: string; error?: string };
type Result = { correct: boolean; cleared?: boolean; reward_granted?: boolean; unlock_key?: string | null; cosmetic_reward_id?: string | null; cosmetic_unlock_key?: string | null; cosmeticRewardTitle?: string | null; correctLabel?: string | null; explanation?: string };

export function BossBattlePanel({ accessToken, onProgressUpdated }: { accessToken?: string; onProgressUpdated?: () => void }) {
  const { locale } = useHealthCluesLocale();
  const tx = useCallback((en: string, vi: string) => locale === "vi" ? vi : en, [locale]);
  const [data, setData] = useState<Payload | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const reducedMotion = useReducedMotion();
  const load = useCallback(async () => {
    if (!accessToken) return;
    try {
      const response = await fetch("/api/healthclues/boss", { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" });
      const payload = await response.json() as Payload;
      if (!response.ok) throw new Error(payload.error || "The Boss checkpoint could not be opened.");
      setData(payload);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "The Boss checkpoint could not be opened."); }
  }, [accessToken]);
  // load() updates state only after its network await completes.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);

  const answer = async (optionId: string) => {
    if (!accessToken || !data?.boss || data.cleared || busy) return;
    setBusy(true); setError(""); setResult(null);
    try {
      const response = await fetch("/api/healthclues/boss", { method: "POST", headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" }, body: JSON.stringify({ bossId: data.boss.boss_id, version: data.boss.version, selectedOptionId: optionId, idempotencyKey: crypto.randomUUID() }) });
      const payload = await response.json() as Result & { error?: string };
      if (!response.ok) throw new Error(payload.error || "Your answer could not be recorded.");
      setResult(payload);
      if (payload.cleared) { setData(previous => previous ? { ...previous, cleared: true } : previous); onProgressUpdated?.(); }
      else await load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Your answer could not be recorded."); }
    finally { setBusy(false); }
  };

  return <section aria-labelledby="hc-boss-title" className="mt-6 overflow-hidden rounded-3xl border border-[#705b47] bg-[#1d2c2a] text-white shadow-xl">
    <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-[#202f30] to-[#493a43] px-5 py-4 sm:px-6"><div><p className="text-[10px] font-black uppercase tracking-[.22em] text-amber-200">{tx("Optional knowledge checkpoint", "Trạm kiểm tra kiến thức tự chọn")}</p><h2 id="hc-boss-title" className="text-xl font-black">{tx("The Knowledge Boss", "Thử thách Thủ lĩnh Tri thức")}</h2></div><span className="inline-flex items-center gap-2 rounded-full border border-amber-200/30 bg-black/20 px-3 py-2 text-xs font-bold text-amber-100"><HealthCluesGameIcon icon="boss:shield" size={16} tone="amber"/>{data?.cleared ? tx("Checkpoint cleared", "Đã vượt qua thử thách") : tx("Review the clues to prepare", "Ôn tập manh mối để chuẩn bị")}</span></div>
    {!accessToken ? <p className="p-5 text-sm text-white/70">{tx("Sign in to unlock and save Boss checkpoint progress.", "Đăng nhập để mở khóa và lưu tiến trình thử thách.")}</p> : error ? <p role="alert" className="m-5 rounded-xl bg-rose-950/60 p-4 text-sm">{error}</p> : !data ? <p role="status" className="p-5 text-sm text-white/70">{tx("Opening the checkpoint…", "Đang mở trạm thử thách…")}</p> : !data.boss ? <p className="p-5 text-sm leading-relaxed text-white/75">{locale === "vi" ? "Hiện chưa có thử thách kiến thức đã thẩm định y tế riêng cho chủ đề này. Bản đồ, ghi nhận hằng ngày và Sổ tay kiến thức của bạn vẫn hoạt động bình thường." : (data.emptyReason || "No source-reviewed challenge is ready for this trail. Your map, check-in and Knowledge Book stay available.")}</p> : <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[220px_minmax(0,1fr)]">
      <div className="grid min-h-[190px] place-items-center overflow-hidden rounded-2xl border border-white/10 bg-[radial-gradient(ellipse_at_center,_#755a4c_0%,_#352f35_48%,_#172623_100%)]"><motion.div animate={reducedMotion ? undefined : result?.correct ? { scale: [1, 1.08, 1], filter: ["brightness(1)", "brightness(1.45)", "brightness(1)"] } : result ? { x: [0, -5, 5, -3, 0] } : { y: [0, -5, 0] }} transition={{ duration: reducedMotion ? 0 : result?.correct ? .72 : result ? .32 : 2.8, repeat: reducedMotion || result ? 0 : Infinity }} className="relative flex h-40 w-40 items-center justify-center drop-shadow-[0_15px_24px_#0008]"><HealthCluesAdventurer pose={data.cleared ? "victory" : result?.correct ? "welcoming" : "challenge"} width={116} alt="Your adventurer at the Knowledge Boss checkpoint"/><motion.span animate={reducedMotion ? undefined : result?.correct ? { opacity: [0, 1, 0], scale: [0.5, 1.7, 2.1] } : { opacity: [0.35, 0.85, 0.35] }} transition={{ duration: reducedMotion ? 0 : result?.correct ? .6 : 2, repeat: result?.correct || reducedMotion ? 0 : Infinity }} className="absolute inset-[-7px] rounded-[2.8rem] border border-amber-200/40"/></motion.div></div>
      <div><h3 className="flex items-center gap-2 text-2xl font-black"><HealthCluesGameIcon icon="boss:swords" size={24} tone="amber"/>{data.boss.title}</h3>{data.boss.demoOnly && <p className="mt-2 rounded-lg border border-amber-200/40 bg-amber-100/10 p-2 text-xs font-extrabold text-amber-100">{tx("TEST ONLY · NOT HUMAN-REVIEWED · LOCAL DEMO PROGRESSION", "THỬ NGHIỆM · CHƯA QUA KIỂM DUYỆT Y TẾ")}</p>}<p className="mt-2 text-sm leading-relaxed text-white/75">{data.cleared ? tx("The gate is open. Your progress and reward are saved in this World.", "Cánh cổng đã mở. Tiến trình và phần thưởng đã được lưu trong Thế giới này.") : data.boss.intro}</p><div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4"><p className="text-[10px] font-black uppercase tracking-widest text-amber-200">{tx("Knowledge challenge", "Thử thách kiến thức")}</p><h4 className="mt-2 font-bold">{data.boss.question_prompt}</h4><div className="mt-3 grid gap-2 sm:grid-cols-2">{data.boss.question_options.map(option => <button key={option.id} type="button" disabled={busy || data.cleared} onClick={() => void answer(option.id)} className="min-h-11 rounded-xl border border-white/20 bg-white/5 px-3 text-left text-sm font-bold hover:border-amber-200 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-200 disabled:opacity-60">{option.label}</button>)}</div></div>
        {result && <motion.div initial={reducedMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} role="status" className={`mt-3 rounded-xl p-4 text-sm ${result.cleared ? "border border-amber-200/40 bg-amber-100 text-[#2d3025]" : "bg-white/10 text-white"}`}><p className="flex items-center gap-2 font-black">{result.cleared ? <><HealthCluesGameIcon icon="boss:key" size={18} tone="inherit"/>{tx("Gate opened · +25 XP · Knowledge Key collected", "Cánh cổng đã mở · +25 XP · Đã thu thập Chìa khóa Tri thức")}</> : result.correct ? tx("Correct answer", "Đáp án chính xác") : tx(`Not quite${result.correctLabel ? ` · reviewed answer: ${result.correctLabel}` : " — review the Knowledge Book and try again."}`, `Chưa chính xác${result.correctLabel ? ` · đáp án đúng: ${result.correctLabel}` : " — hãy xem lại Sổ tay kiến thức và thử lại."}`)}</p>{result.explanation && <p className="mt-1 leading-relaxed">{result.explanation}</p>}{result.cleared && <p className="mt-2 inline-flex items-center gap-1 font-bold"><HealthCluesGameIcon icon="achieve:sparkles" size={16} tone="amber"/>{tx("World path unlocked:", "Đã mở lối đi thế giới:")} {result.unlock_key}</p>}{result.cosmeticRewardTitle && <p className="mt-2 inline-flex items-center gap-1 font-bold"><HealthCluesGameIcon icon="achieve:trophy" size={16} tone="gold"/>{tx("Keepsake earned:", "Kỷ vật nhận được:")} {result.cosmeticRewardTitle}</p>}</motion.div>}
        <p className="mt-3 text-[11px] leading-relaxed text-white/55">{tx("This optional challenge is about reviewed knowledge. It does not assess health, diagnosis, or recovery. Wrong answers can be retried.", "Thử thách tự chọn này nhằm ôn tập kiến thức. Không đánh giá chẩn đoán y khoa. Có thể thử lại nếu chọn sai.")}</p>
      </div>
    </div>}
  </section>;
}
