"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Leaf, RotateCcw, Sparkles } from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { buildWellnessPlan, type DietStyle, type SavedWellnessPlan, type WellnessGoal, type WellnessProfile } from "@/data/wellness-plan";
import type { WellnessLocale } from "@/data/wellness";
import { trackWellness } from "@/lib/wellness-analytics";

export function WellnessPlanner({ locale }: { locale: WellnessLocale }) {
  const vi = locale === "vi";
  const [step, setStep] = useState(1);
  const [goal, setGoal] = useState<WellnessGoal>("weight");
  const [diet, setDiet] = useState<DietStyle>("balanced");
  const [minutes, setMinutes] = useState(10);
  const [saved, setSaved] = useLocalStorage<SavedWellnessPlan>("botly-wellness-plan", null);
  const profile = useMemo<WellnessProfile>(() => ({ goal, diet, minutes, locale, createdAt: new Date().toISOString() }), [goal, diet, minutes, locale]);
  const plan = useMemo(() => buildWellnessPlan(profile), [profile]);
  const base = vi ? "/vi/song-khoe" : "/en/wellness";
  const goals: { id: WellnessGoal; icon: string; en: string; vi: string }[] = [
    { id: "weight", icon: "🥗", en: "Manage my weight", vi: "Quản lý cân nặng" }, { id: "stress", icon: "🌿", en: "Feel less stressed", vi: "Bớt căng thẳng" }, { id: "meditation", icon: "🧘", en: "Meditate regularly", vi: "Thiền đều đặn" }, { id: "sleep", icon: "🌙", en: "Sleep more gently", vi: "Ngủ nhẹ nhàng hơn" },
  ];
  const diets: { id: DietStyle; en: string; vi: string }[] = [{ id: "balanced", en: "Balanced", vi: "Cân bằng" }, { id: "vegetarian", en: "Vegetarian", vi: "Ăn chay" }, { id: "high-protein", en: "Higher protein", vi: "Giàu đạm" }];
  const savePlan = () => { setSaved({ profile, days: plan, completed: [] }); trackWellness("tool_completed", { tool: "wellness-planner", goal, locale }); setStep(4); };

  return <div className="planner-shell">
    <div className="planner-progress"><span style={{ width: `${Math.min(step, 3) / 3 * 100}%` }} /></div>
    {step === 1 && <div><p className="section-kicker">01 / 03</p><h2>{vi ? "Điều gì quan trọng nhất với bạn lúc này?" : "What matters most to you right now?"}</h2><p className="planner-intro">{vi ? "Chọn một mục tiêu chính. Bạn có thể thay đổi sau." : "Choose one main goal. You can change it later."}</p><div className="planner-options planner-goals">{goals.map(item => <button key={item.id} onClick={() => setGoal(item.id)} className={goal === item.id ? "selected" : ""}><span>{item.icon}</span><strong>{vi ? item.vi : item.en}</strong>{goal === item.id && <Check />}</button>)}</div><button className="wellness-button mt-8" onClick={() => setStep(2)}>{vi ? "Tiếp tục" : "Continue"}<ArrowRight /></button></div>}
    {step === 2 && <div><button className="planner-back" onClick={() => setStep(1)}><ArrowLeft />{vi ? "Quay lại" : "Back"}</button><p className="section-kicker">02 / 03</p><h2>{vi ? "Kiểu ăn nào gần với bạn nhất?" : "Which eating style is closest to you?"}</h2><p className="planner-intro">{vi ? "Đây không phải chế độ ăn bắt buộc—chỉ để gợi ý phù hợp hơn." : "This is not a prescribed diet—just a way to make suggestions more relevant."}</p><div className="planner-options">{diets.map(item => <button key={item.id} onClick={() => setDiet(item.id)} className={diet === item.id ? "selected" : ""}><strong>{vi ? item.vi : item.en}</strong>{diet === item.id && <Check />}</button>)}</div><button className="wellness-button mt-8" onClick={() => setStep(3)}>{vi ? "Tiếp tục" : "Continue"}<ArrowRight /></button></div>}
    {step === 3 && <div><button className="planner-back" onClick={() => setStep(2)}><ArrowLeft />{vi ? "Quay lại" : "Back"}</button><p className="section-kicker">03 / 03</p><h2>{vi ? "Bạn thực sự có bao nhiêu phút mỗi ngày?" : "How many minutes can you realistically give yourself?"}</h2><p className="planner-intro">{vi ? "Một kế hoạch nhỏ làm được vẫn tốt hơn kế hoạch hoàn hảo bị bỏ dở." : "A small plan you can do beats a perfect plan you abandon."}</p><div className="mt-8 flex flex-wrap gap-3">{[5, 10, 20, 30].map(value => <button key={value} onClick={() => setMinutes(value)} className={`planner-minute ${minutes === value ? "selected" : ""}`}>{value}<span>min</span></button>)}</div><div className="mt-8 rounded-3xl bg-white p-5"><p className="flex items-center gap-2 font-semibold text-[#18302b]"><Sparkles className="h-5 w-5" />{vi ? "Kế hoạch của bạn sẽ gồm" : "Your plan will include"}</p><div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">{(vi ? ["Một bước dinh dưỡng", "Một lần thư giãn", "Một thực hành chánh niệm"] : ["One nourish step", "One calm reset", "One mindful practice"]).map(x => <span key={x} className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-[#628573]" />{x}</span>)}</div></div><button className="wellness-button mt-8" onClick={savePlan}>{vi ? "Tạo kế hoạch 7 ngày" : "Build my 7-day plan"}<Leaf /></button></div>}
    {step === 4 && saved && <div className="text-center"><span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#d9f99d]"><Check className="h-7 w-7" /></span><p className="section-kicker mt-7">{vi ? "KẾ HOẠCH ĐÃ SẴN SÀNG" : "YOUR PLAN IS READY"}</p><h2>{vi ? "Bảy ngày, mỗi ngày ba bước nhỏ." : "Seven days, three small steps each day."}</h2><p className="planner-intro mx-auto">{vi ? "Kế hoạch được lưu trên thiết bị này. Không cần tạo tài khoản." : "Your plan is saved on this device. No account required."}</p><div className="mt-8 flex flex-wrap justify-center gap-3"><Link href={`${base}/${vi ? "ke-hoach" : "my-plan"}`} className="wellness-button">{vi ? "Mở kế hoạch" : "Open my plan"}<ArrowRight /></Link><button className="wellness-button-secondary" onClick={() => setStep(1)}><RotateCcw />{vi ? "Tạo lại" : "Start over"}</button></div></div>}
  </div>;
}

export function MyPlan({ locale }: { locale: WellnessLocale }) {
  const vi = locale === "vi";
  const [saved, setSaved, ready] = useLocalStorage<SavedWellnessPlan>("botly-wellness-plan", null);
  const base = vi ? "/vi/song-khoe" : "/en/wellness";
  if (!ready) return <div className="py-24 text-center text-sm text-[#61756e]">{vi ? "Đang mở kế hoạch..." : "Opening your plan..."}</div>;
  if (!saved) return <div className="mx-auto max-w-2xl px-5 py-24 text-center"><h1 className="section-title">{vi ? "Bạn chưa có kế hoạch." : "You do not have a plan yet."}</h1><p className="section-subtitle mx-auto">{vi ? "Tạo kế hoạch wellness 7 ngày đầu tiên trong vài phút." : "Build your first 7-day wellness plan in a few minutes."}</p><Link href={`${base}/${vi ? "cong-cu/ke-hoach" : "tools/plan"}`} className="wellness-button mt-7">{vi ? "Tạo kế hoạch" : "Build a plan"}<ArrowRight /></Link></div>;
  const toggle = (key: string) => { const completed = saved.completed.includes(key) ? saved.completed.filter(x => x !== key) : [...saved.completed, key]; setSaved({ ...saved, completed }); trackWellness("tool_completed", { tool: "daily-plan-step", locale }); };
  const total = saved.days.length * 3; const percent = Math.round(saved.completed.length / total * 100);
  return <main className="mx-auto max-w-5xl px-5 py-14 lg:px-8"><div className="flex flex-wrap items-end justify-between gap-6"><div><p className="section-kicker">BOTLY · 7 DAYS</p><h1 className="section-title">{vi ? "Kế hoạch của tôi" : "My gentle plan"}</h1><p className="section-subtitle">{vi ? `${saved.profile.minutes} phút mỗi ngày · Tiến độ được lưu trên thiết bị` : `${saved.profile.minutes} minutes a day · Progress saved on this device`}</p></div><div className="plan-score"><strong>{percent}%</strong><span>{vi ? "hoàn thành" : "complete"}</span></div></div><div className="mt-8 h-2 overflow-hidden rounded-full bg-[#dce4d8]"><span className="block h-full rounded-full bg-[#668b75] transition-all" style={{ width: `${percent}%` }} /></div><div className="mt-10 space-y-5">{saved.days.map(day => <article key={day.day} className="plan-day"><div><span>{vi ? "Ngày" : "Day"} {day.day}</span><h2>{day.title}</h2></div><div className="grid gap-3 md:grid-cols-3">{([["nourish", day.nourish, "🥗"], ["calm", day.calm, "🌿"], ["mindful", day.mindful, "🧘"]] as const).map(([type, text, icon]) => { const key = `${day.day}-${type}`; const done = saved.completed.includes(key); return <button key={key} onClick={() => toggle(key)} className={done ? "done" : ""}><span>{done ? <Check /> : icon}</span><p>{text}</p></button>; })}</div></article>)}</div><div className="mt-10 flex justify-center"><Link href={`${base}/${vi ? "cong-cu/ke-hoach" : "tools/plan"}`} className="wellness-button-secondary"><RotateCcw />{vi ? "Tạo kế hoạch mới" : "Build a new plan"}</Link></div></main>;
}
