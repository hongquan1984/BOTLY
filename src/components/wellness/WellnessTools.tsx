"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Activity, BookOpen, Check, Download, Pause, Play, RotateCcw, Sparkles } from "lucide-react";
import type { WellnessLocale } from "@/data/wellness";
import { trackWellness } from "@/lib/wellness-analytics";

const combinations = [
  {
    ingredients: ["rice", "lentils"],
    en: "Lentils + White Rice",
    vi: "Đậu lăng + Cơm trắng",
    whyEn: "Replacing 50% of rice carbohydrate with cooked lentils significantly blunted post-meal blood glucose rise (Human crossover RCT).",
    whyVi: "Thay 50% tinh bột cơm bằng đậu lăng nấu chín giúp giảm đáng kể đỉnh đường huyết sau ăn (Thử nghiệm lâm sàng có đối chứng trên người).",
    evidenceBadge: "RCT Verified",
    guideSlug: "lentils-rice-blood-sugar",
  },
  {
    ingredients: ["oats", "berries"],
    en: "Oats + Berries",
    vi: "Yến mạch + Quả mọng",
    whyEn: "Viscous oat beta-glucan slows starch absorption; berry polyphenols help flatten early glucose spikes.",
    whyVi: "Chất xơ hòa tan beta-glucan làm chậm hấp thu đường; anthocyanin trong quả mọng giúp làm dịu đỉnh glucose ban đầu.",
    evidenceBadge: "Clinical Review",
    guideSlug: "oats-berries-blood-sugar",
  },
  {
    ingredients: ["onion", "honey"],
    en: "Onion + Honey",
    vi: "Hành tây + Mật ong",
    whyEn: "Myth-check: Honey is predominantly free sugars (glucose & fructose). No evidence onions offset this glycemic load.",
    whyVi: "Kiểm chứng: Mật ong là đường tự do. Chưa có thử nghiệm lâm sàng nào chứng minh hành tây có thể hóa giải lượng đường này.",
    evidenceBadge: "Myth-Check",
    guideSlug: "onion-honey-blood-sugar",
  },
  {
    ingredients: ["beans", "toast"],
    en: "Beans + Whole Toast",
    vi: "Đậu hầm + Bánh mì nướng",
    whyEn: "Pulse protein & fibre matrix slows systemic carbohydrate absorption from bread, moderating insulin responses.",
    whyVi: "Mạng lưới đạm và chất xơ từ các loại đậu làm chậm quá trình tiêu hóa tinh bột bánh mì, hạ thấp phản ứng insulin.",
    evidenceBadge: "Acute Trial",
    guideSlug: "beans-toast-blood-sugar",
  },
  { ingredients: ["oats", "yogurt", "banana"], en: "Oats, yogurt & banana", vi: "Yến mạch, sữa chua và chuối", whyEn: "Fiber, protein and an easy source of fruit.", whyVi: "Chất xơ, đạm và một phần trái cây dễ chuẩn bị." },
  { ingredients: ["eggs", "spinach", "rice"], en: "Egg, greens & rice bowl", vi: "Cơm, trứng và rau xanh", whyEn: "A practical mix of protein, vegetables and carbohydrate.", whyVi: "Kết hợp thực tế giữa đạm, rau và tinh bột." },
  { ingredients: ["tofu", "tomato", "rice"], en: "Tofu, tomato & rice", vi: "Đậu phụ, cà chua và cơm", whyEn: "Plant protein with vegetables and a satisfying staple.", whyVi: "Đạm thực vật, rau và món tinh bột tạo cảm giác no." },
  { ingredients: ["chicken", "broccoli", "sweet-potato"], en: "Chicken, broccoli & sweet potato", vi: "Gà, bông cải và khoai lang", whyEn: "Protein, vegetables and a fiber-rich carbohydrate.", whyVi: "Đạm, rau và nguồn tinh bột giàu chất xơ." },
];

const remedyClaims = {
  "lemon-sleep": { en: "Lemon water improves sleep", vi: "Nước chanh giúp cải thiện giấc ngủ", level: "limited", noteEn: "There is no good evidence that lemon water directly treats insomnia. A consistent sleep routine has stronger support.", noteVi: "Chưa có bằng chứng tốt cho thấy nước chanh trực tiếp điều trị mất ngủ. Nhịp ngủ ổn định có cơ sở rõ hơn." },
  "baking-breath": { en: "Baking soda cures bad breath", vi: "Baking soda chữa hôi miệng", level: "limited", noteEn: "It may change mouth acidity temporarily, but persistent bad breath can have dental or medical causes.", noteVi: "Nó có thể tạm thời thay đổi độ axit trong miệng, nhưng hôi miệng kéo dài có thể liên quan nguyên nhân răng miệng hoặc y khoa." },
  "watermelon-stones": { en: "Watermelon drink dissolves kidney stones", vi: "Nước dưa hấu làm tan sỏi thận", level: "unsafe", noteEn: "This claim is not established. Kidney stones vary by type and size; severe pain, fever or urinary symptoms need medical care.", noteVi: "Tuyên bố này chưa được xác lập. Sỏi thận khác nhau về loại và kích thước; đau dữ dội, sốt hoặc triệu chứng tiểu tiện cần được chăm sóc y tế." },
} as const;

export function CalorieTool({ locale }: { locale: WellnessLocale }) {
  const vi = locale === "vi";
  const [sex, setSex] = useState<"female" | "male">("female");
  const [age, setAge] = useState(32);
  const [height, setHeight] = useState(165);
  const [weight, setWeight] = useState(65);
  const [activity, setActivity] = useState(1.375);
  const [shown, setShown] = useState(false);
  const result = Math.round(((10 * weight) + (6.25 * height) - (5 * age) + (sex === "male" ? 5 : -161)) * activity / 50) * 50;

  return <div className="tool-panel">
    <div className="mb-6 flex items-center gap-3"><span className="tool-icon bg-[#ffe0cb]"><Activity /></span><div><h3>{vi ? "Ước tính nhu cầu năng lượng" : "Estimate your calorie needs"}</h3><p>{vi ? "Một khoảng tham khảo, không phải đơn thuốc." : "A useful starting range—not a prescription."}</p></div></div>
    <div className="grid gap-4 sm:grid-cols-2">
      <label>{vi ? "Giới tính sinh học" : "Biological sex"}<select value={sex} onChange={(e) => setSex(e.target.value as "female" | "male")}><option value="female">{vi ? "Nữ" : "Female"}</option><option value="male">{vi ? "Nam" : "Male"}</option></select></label>
      <label>{vi ? "Tuổi" : "Age"}<input type="number" min="18" max="90" value={age} onChange={(e) => setAge(Number(e.target.value))} /></label>
      <label>{vi ? "Chiều cao (cm)" : "Height (cm)"}<input type="number" min="120" max="230" value={height} onChange={(e) => setHeight(Number(e.target.value))} /></label>
      <label>{vi ? "Cân nặng (kg)" : "Weight (kg)"}<input type="number" min="35" max="250" value={weight} onChange={(e) => setWeight(Number(e.target.value))} /></label>
      <label className="sm:col-span-2">{vi ? "Mức vận động" : "Activity level"}<select value={activity} onChange={(e) => setActivity(Number(e.target.value))}><option value="1.2">{vi ? "Ít vận động" : "Mostly sedentary"}</option><option value="1.375">{vi ? "Vận động nhẹ" : "Lightly active"}</option><option value="1.55">{vi ? "Vận động vừa" : "Moderately active"}</option><option value="1.725">{vi ? "Vận động nhiều" : "Very active"}</option></select></label>
    </div>
    <button className="wellness-button mt-5" onClick={() => { setShown(true); trackWellness("tool_completed", { tool: "calorie-needs", locale }); }}>{vi ? "Xem khoảng tham khảo" : "See my starting range"}</button>
    {shown && <div className="result-card"><span>{vi ? "Duy trì ước tính" : "Estimated maintenance"}</span><strong>{result.toLocaleString()} kcal</strong><p>{vi ? `Khoảng hữu ích: ${(result - 150).toLocaleString()}–${(result + 150).toLocaleString()} kcal/ngày. Thay đổi cân nặng bền vững cần được điều chỉnh theo thực tế.` : `Useful range: ${(result - 150).toLocaleString()}–${(result + 150).toLocaleString()} kcal/day. Sustainable change should be adjusted from real-world progress.`}</p></div>}
  </div>;
}

export function StressTool({ locale }: { locale: WellnessLocale }) {
  const vi = locale === "vi";
  const [value, setValue] = useState(3);
  const steps = vi ? ["Thở chậm trong 60 giây", "Uống một cốc nước", "Viết ra việc quan trọng nhất"] : ["Breathe slowly for 60 seconds", "Drink a glass of water", "Write down the one thing that matters now"];
  return <div className="tool-panel">
    <div className="mb-6 flex items-center gap-3"><span className="tool-icon bg-[#dcedf2]"><Sparkles /></span><div><h3>{vi ? "Bạn đang thấy thế nào?" : "How loaded do you feel?"}</h3><p>{vi ? "Không phải đánh giá sức khỏe tâm thần." : "This is a momentary check-in, not an assessment."}</p></div></div>
    <div className="flex justify-between text-3xl">{["😌", "🙂", "😐", "😟", "😣"].map((emoji, i) => <button key={emoji} onClick={() => setValue(i + 1)} className={`rounded-2xl p-2 transition ${value === i + 1 ? "bg-[#dcedf2] scale-110" : "opacity-45 hover:opacity-100"}`}>{emoji}</button>)}</div>
    <div className="mt-6 rounded-3xl bg-white p-5"><p className="text-xs font-bold uppercase tracking-widest text-[#6b7d76]">{vi ? "Bước nhẹ nhàng tiếp theo" : "Your gentle next steps"}</p><ul className="mt-4 space-y-3">{steps.slice(0, value >= 4 ? 3 : 2).map((step) => <li key={step} className="flex gap-3 text-sm"><Check className="h-5 w-5 shrink-0 text-[#557b69]" />{step}</li>)}</ul></div>
  </div>;
}

export function MeditationTool({ locale }: { locale: WellnessLocale }) {
  const vi = locale === "vi";
  const [duration, setDuration] = useState(180);
  const [left, setLeft] = useState(180);
  const [running, setRunning] = useState(false);
  useEffect(() => { if (!running || left <= 0) return; const id = window.setInterval(() => setLeft((v) => v - 1), 1000); return () => window.clearInterval(id); }, [running, left]);
  const display = useMemo(() => `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`, [left]);
  const reset = () => { setRunning(false); setLeft(duration); };
  return <div className="tool-panel text-center">
    <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#e8def4] text-[#654f76]"><Sparkles /></span>
    <h3 className="mt-4">{vi ? "Một khoảng dừng cho bạn" : "A quiet pause for you"}</h3><p>{vi ? "Hít vào nhẹ nhàng. Thở ra chậm hơn một chút." : "Breathe in gently. Let the exhale be a little slower."}</p>
    <div className={`meditation-orb mx-auto my-8 ${running ? "is-running" : ""}`}><strong>{display}</strong><span>{left === 0 ? (vi ? "Hoàn thành" : "Complete") : (vi ? "thở nhẹ" : "breathe softly")}</span></div>
    <div className="mb-5 flex justify-center gap-2">{[180, 300, 600].map((seconds) => <button key={seconds} onClick={() => { setDuration(seconds); setLeft(seconds); setRunning(false); }} className={`rounded-full px-4 py-2 text-sm font-semibold ${duration === seconds ? "bg-[#18302b] text-white" : "bg-white"}`}>{seconds / 60} min</button>)}</div>
    <div className="flex justify-center gap-3"><button className="wellness-button" onClick={() => setRunning(!running)}>{running ? <Pause /> : <Play />}{running ? (vi ? "Tạm dừng" : "Pause") : (vi ? "Bắt đầu" : "Begin")}</button><button className="rounded-full border border-[#18302b]/15 p-3" onClick={reset} aria-label="Reset"><RotateCcw /></button></div>
  </div>;
}

export function FoodCombinationTool({ locale }: { locale: WellnessLocale }) {
  const vi = locale === "vi";
  const guidePath = (slug: string) => {
    if (vi) {
      if (slug === "lentils-rice-blood-sugar") return "/vi/song-khoe/huong-dan/dau-lang-va-com-duong-huyet";
      if (slug === "oats-berries-blood-sugar") return "/vi/song-khoe/huong-dan/yen-mach-va-qua-mong-duong-huyet";
      if (slug === "onion-honey-blood-sugar") return "/vi/song-khoe/huong-dan/hanh-tay-va-mat-ong-duong-huyet";
      if (slug === "beans-toast-blood-sugar") return "/vi/song-khoe/huong-dan/dau-va-banh-mi-duong-huyet";
      return "/vi/song-khoe/ebooks/duong-huyet";
    }
    return `/en/wellness/guides/${slug}`;
  };

  const options = [
    ["rice", "Cơm", "Rice"],
    ["lentils", "Đậu lăng", "Lentils"],
    ["oats", "Yến mạch", "Oats"],
    ["berries", "Quả mọng", "Berries"],
    ["beans", "Đậu hầm", "Beans"],
    ["toast", "Bánh mì", "Toast"],
    ["onion", "Hành tây", "Onion"],
    ["honey", "Mật ong", "Honey"],
    ["yogurt", "Sữa chua", "Yogurt"],
    ["banana", "Chuối", "Banana"],
    ["eggs", "Trứng", "Eggs"],
    ["spinach", "Rau xanh", "Greens"],
    ["tofu", "Đậu phụ", "Tofu"],
    ["tomato", "Cà chua", "Tomato"],
    ["chicken", "Thịt gà", "Chicken"],
    ["broccoli", "Bông cải", "Broccoli"],
    ["sweet-potato", "Khoai lang", "Sweet potato"]
  ];

  const [selected, setSelected] = useState<string[]>(["rice", "lentils"]);
  const results = combinations.filter(c => c.ingredients.some(i => selected.includes(i))).sort((a,b) => b.ingredients.filter(i => selected.includes(i)).length - a.ingredients.filter(i => selected.includes(i)).length).slice(0, 4);
  const toggle = (id: string) => { setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]); trackWellness("tool_started", { tool: "food-combinations", locale }); };

  return (
    <div className="tool-panel">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3>{vi ? "Bạn đang có nguyên liệu gì?" : "What ingredients do you have?"}</h3>
          <p>{vi ? "Chọn nguyên liệu để kiểm chứng kết hợp dinh dưỡng và đường huyết." : "Pick ingredients to test nutritional balance and blood sugar impact."}</p>
        </div>
        <Link
          href={vi ? "/vi/song-khoe/ebooks/duong-huyet" : "/en/wellness/ebooks/blood-sugar-pairings"}
          className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3.5 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-200 transition shrink-0"
        >
          <BookOpen className="h-3.5 w-3.5" />
          <span>{vi ? "Tải Cẩm Nang Ebook PDF" : "Get Blood Sugar Ebook (PDF)"}</span>
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {options.map(([id, viName, enName]) => (
          <button
            key={id}
            onClick={() => toggle(id)}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition cursor-pointer ${selected.includes(id) ? "border-[#18302b] bg-[#18302b] text-white" : "border-[#18302b]/15 bg-white text-slate-700 hover:bg-slate-50"}`}
          >
            {vi ? viName : enName}
          </button>
        ))}
      </div>

      <div className="mt-7 grid gap-4 sm:grid-cols-2">
        {results.map(result => (
          <div key={result.en} className="flex flex-col justify-between rounded-2xl bg-white p-5 border border-slate-200 shadow-sm">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xl">🥗</span>
                {"evidenceBadge" in result && result.evidenceBadge && (
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-emerald-800">
                    {result.evidenceBadge}
                  </span>
                )}
              </div>
              <h4 className="mt-3 font-bold text-base text-slate-900">{vi ? result.vi : result.en}</h4>
              <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-600">{vi ? result.whyVi : result.whyEn}</p>
            </div>

            {"guideSlug" in result && result.guideSlug && (
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <Link
                  href={guidePath(result.guideSlug as string)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 hover:underline"
                >
                  <span>{vi ? "Xem nghiên cứu lâm sàng" : "Read clinical research"} →</span>
                </Link>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl bg-[#f2f7f1] p-4 border border-emerald-800/15 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-xs text-[#526b62] leading-relaxed">
          {vi
            ? "Bốn cặp thực phẩm y sinh đã được xuất bản thành cẩm nang Ebook 11 trang miễn phí có đầy đủ tài liệu PubMed."
            : "Four everyday pairs are compiled in our free 11-page evidence handbook with complete PubMed citations."}
        </p>
        <Link
          href={vi ? "/vi/song-khoe/ebooks/duong-huyet" : "/en/wellness/ebooks/blood-sugar-pairings"}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#18302b] px-4 py-2 text-xs font-bold text-white hover:bg-[#27483a] transition shrink-0"
        >
          <Download className="h-3.5 w-3.5 text-amber-300" />
          <span>{vi ? "Tải Ebook PDF (5.6 MB)" : "Download PDF (5.6 MB)"}</span>
        </Link>
      </div>
    </div>
  );
}

export function RemedyChecker({ locale }: { locale: WellnessLocale }) {
  const vi = locale === "vi";
  const [claim, setClaim] = useState<keyof typeof remedyClaims>("lemon-sleep");
  const result = remedyClaims[claim];
  const unsafe = result.level === "unsafe";
  return <div className="tool-panel"><div className="mb-6"><h3>{vi ? "Kiểm tra một mẹo đang lan truyền" : "Check a viral remedy claim"}</h3><p>{vi ? "Bản thử nghiệm giúp phân biệt điều đã biết và điều còn phỏng đoán." : "A starter checker that separates what is known from what is assumed."}</p></div><label>{vi ? "Chọn tuyên bố" : "Choose a claim"}<select value={claim} onChange={e => { setClaim(e.target.value as keyof typeof remedyClaims); trackWellness("tool_completed", { tool: "remedy-checker", claim: e.target.value, locale }); }}>{Object.entries(remedyClaims).map(([key, item]) => <option key={key} value={key}>{vi ? item.vi : item.en}</option>)}</select></label><div className={`mt-6 rounded-3xl p-6 ${unsafe ? "bg-[#f7d8d3]" : "bg-[#fff4d6]"}`}><span className="text-xs font-extrabold uppercase tracking-[.16em]">{unsafe ? (vi ? "Không nên tự điều trị" : "Do not self-treat") : (vi ? "Bằng chứng hạn chế" : "Limited evidence")}</span><h4 className="mt-3 text-xl font-semibold">{vi ? result.vi : result.en}</h4><p className="mt-3 leading-6 text-[#4e655d]">{vi ? result.noteVi : result.noteEn}</p></div><p className="mt-5 text-xs leading-5 text-[#667970]">{vi ? "Không dùng công cụ này cho tình huống khẩn cấp hoặc thay thế chuyên gia y tế." : "Do not use this checker for emergencies or as a substitute for professional care."}</p></div>;
}
