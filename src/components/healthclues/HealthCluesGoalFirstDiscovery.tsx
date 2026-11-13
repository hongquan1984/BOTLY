"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check, ShieldCheck } from "lucide-react";
import type { HealthCluesProfile } from "@/lib/healthclues-quiz";
import { useHealthCluesLocale } from "@/components/healthclues/HealthCluesLocaleProvider";

type Choice = { id: string; en: string; vi: string };
type Concern = Choice & { group: "sleep" | "health"; detail?: boolean };
const healthConcerns: Concern[] = [
  { id: "gout", en: "Gout / high uric acid", vi: "Gút / axit uric cao", group: "health" },
  { id: "weight", en: "Weight management", vi: "Giảm cân / quản lý cân nặng", group: "health" },
  { id: "glucose", en: "Blood glucose", vi: "Đường huyết", group: "health" },
  { id: "blood-pressure", en: "Blood pressure", vi: "Huyết áp", group: "health" },
  { id: "migraine", en: "Headache / migraine", vi: "Đau đầu / migraine", group: "health" },
  { id: "digestion", en: "Digestion", vi: "Tiêu hóa", group: "health" },
  { id: "stress", en: "Stress", vi: "Căng thẳng", group: "health" },
  { id: "general", en: "General healthy living", vi: "Sức khỏe tổng thể", group: "health" },
  { id: "aging", en: "Healthy aging", vi: "Lão hóa khỏe mạnh", group: "health" },
  { id: "beauty", en: "Beauty and wellness", vi: "Làm đẹp / chăm sóc sức khỏe", group: "health" },
  { id: "other", en: "Something else", vi: "Vấn đề khác", group: "health", detail: true },
  { id: "sleep-onset", en: "Difficulty falling asleep", vi: "Khó đi vào giấc ngủ", group: "sleep" },
  { id: "sleep-waking", en: "Waking during the night", vi: "Hay tỉnh giấc giữa đêm", group: "sleep" },
  { id: "sleep-early", en: "Waking too early", vi: "Thức dậy quá sớm", group: "sleep" },
  { id: "sleep-restless", en: "Sleep does not feel refreshing", vi: "Ngủ dậy vẫn thấy mệt", group: "sleep" },
  { id: "sleep-schedule", en: "Irregular sleep schedule", vi: "Lịch ngủ thất thường", group: "sleep" },
  { id: "sleep-other", en: "Something else", vi: "Vấn đề khác", group: "sleep", detail: true },
];

const factors: Record<string, Choice[]> = {
  gout: [
    { id: "red-meat", en: "I often eat red meat or organ meats", vi: "Tôi thường ăn thịt đỏ hoặc nội tạng" },
    { id: "seafood", en: "I often eat some types of seafood", vi: "Tôi thường ăn một số loại hải sản" },
    { id: "alcohol", en: "I often drink beer or alcohol", vi: "Tôi thường uống bia hoặc rượu" },
    { id: "sweet-drinks", en: "I often drink sugar-sweetened drinks", vi: "Tôi thường uống đồ uống có đường" },
    { id: "hydration", en: "I sometimes drink less than I would like", vi: "Đôi khi tôi uống ít nước hơn mong muốn" },
    { id: "weight", en: "I am concerned about my weight", vi: "Tôi đang quan tâm đến cân nặng" },
    { id: "activity", en: "Movement is difficult or limited for me", vi: "Tôi khó vận động hoặc bị hạn chế vận động" },
    { id: "kidney", en: "I have a kidney condition", vi: "Tôi có vấn đề về thận" },
    { id: "medication", en: "I take medicine and wonder if it is relevant", vi: "Tôi dùng thuốc và băn khoăn liệu thuốc có liên quan không" },
    { id: "family", en: "Gout runs in my family", vi: "Gia đình tôi có người mắc Gút" },
    { id: "joint-attacks", en: "I have recurring painful or swollen joints", vi: "Tôi thường bị đau hoặc sưng khớp tái phát" },
    { id: "high-urate", en: "A test showed high uric acid, but I have not been diagnosed with gout", vi: "Xét nghiệm axit uric cao nhưng tôi chưa được chẩn đoán Gút" },
  ],
  weight: [
    { id: "sweet-drinks", en: "I often drink sugar-sweetened drinks", vi: "Tôi thường uống đồ uống có đường" },
    { id: "snacks", en: "I often snack between meals", vi: "Tôi thường ăn vặt giữa các bữa" },
    { id: "evening-meals", en: "I often eat larger meals late in the day", vi: "Tôi thường ăn nhiều vào buổi tối" },
    { id: "sitting", en: "My work involves long periods of sitting", vi: "Công việc khiến tôi phải ngồi lâu" },
    { id: "activity-limit", en: "Movement is limited or difficult for me", vi: "Tôi bị hạn chế hoặc khó vận động" },
    { id: "schedule", en: "My work or meal schedule changes often", vi: "Lịch làm việc hoặc ăn uống của tôi thường thay đổi" },
    { id: "maintain", en: "I find it hard to maintain routines", vi: "Tôi khó duy trì thói quen lâu dài" },
  ],
  glucose: [
    { id: "sweet-drinks", en: "I often drink sugar-sweetened drinks", vi: "Tôi thường uống đồ uống có đường" },
    { id: "activity", en: "I get little movement in a typical week", vi: "Một tuần điển hình tôi ít vận động" },
    { id: "irregular-meals", en: "My meals are often at irregular times", vi: "Tôi thường ăn uống không đúng giờ" },
    { id: "diagnosed", en: "I have been diagnosed and am receiving care", vi: "Tôi đã được chẩn đoán và đang được chăm sóc" },
    { id: "abnormal-test", en: "A glucose test was outside range and needs follow-up", vi: "Kết quả đường huyết ngoài ngưỡng và cần được đánh giá tiếp" },
    { id: "unsure", en: "I am not sure about my current glucose status", vi: "Tôi không rõ tình trạng đường huyết hiện tại" },
  ],
  sleep: [
    { id: "screens", en: "I use a phone or screen close to bedtime", vi: "Tôi dùng điện thoại hoặc màn hình sát giờ ngủ" },
    { id: "caffeine", en: "I drink coffee, tea, or other caffeine later in the day", vi: "Tôi uống cà phê, trà hoặc caffeine vào cuối ngày" },
    { id: "schedule", en: "My sleep and wake times vary", vi: "Giờ ngủ và thức của tôi không đều" },
    { id: "shift", en: "I work night shifts or changing shifts", vi: "Tôi làm ca đêm hoặc đổi ca" },
    { id: "noise", en: "Noise or light affects my sleep space", vi: "Tiếng ồn hoặc ánh sáng ảnh hưởng nơi ngủ" },
    { id: "stress", en: "Stress or thoughts keep me awake", vi: "Căng thẳng hoặc suy nghĩ khiến tôi khó ngủ" },
    { id: "waking", en: "I often wake during the night", vi: "Tôi thường tỉnh giấc giữa đêm" },
  ],
};
const fallback: Choice[] = [
  { id: "daily-context", en: "My daily routine or schedule affects this", vi: "Nếp sinh hoạt hoặc lịch trình ảnh hưởng đến điều này" },
  { id: "access", en: "Access, time, or cost makes this harder", vi: "Thời gian, chi phí hoặc khả năng tiếp cận khiến việc này khó hơn" },
  { id: "health-context", en: "Another health concern may be relevant", vi: "Một vấn đề sức khỏe khác có thể liên quan" },
];

export function HealthCluesGoalFirstDiscovery({ questId, onComplete }: { questId: string; onComplete: (profile: HealthCluesProfile, questId: string) => void }) {
  const { locale } = useHealthCluesLocale();
  const vi = locale === "vi";
  const effectiveQuestId = questId || (typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("quest") || "" : "");
  const isSleep = effectiveQuestId === "sleep-better";
  const [screen, setScreen] = useState<1 | 2>(1);
  const [concernId, setConcernId] = useState("");
  const [selectedConcerns, setSelectedConcerns] = useState<string[]>([]);
  const [concernNote, setConcernNote] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [factorNote, setFactorNote] = useState("");
  const [ageConfirmed, setAgeConfirmed] = useState(true);
  const [error, setError] = useState("");
  const concernChoices = healthConcerns.filter(item => item.group === (isSleep ? "sleep" : "health"));
  const concern = concernChoices.find(item => item.id === concernId) || concernChoices.find(item => selectedConcerns.includes(item.id));
  
  const factorChoices = (() => {
    const active = selectedConcerns.length ? selectedConcerns : concernId ? [concernId] : [];
    const collected: Choice[] = [];
    const seen = new Set<string>();
    for (const cid of active) {
      const list = factors[cid] || (isSleep ? factors.sleep : cid === "stress" ? factors.sleep : fallback);
      for (const item of list) {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          collected.push(item);
        }
      }
    }
    return collected.length ? collected : (isSleep ? factors.sleep : fallback);
  })();

  const otherIds = new Set(["none", "unsure"]);
  const copy = vi ? {
    title1: "Bạn đang quan tâm vấn đề gì về sức khỏe?", titleSleep: "Bạn đang quan tâm điều gì về giấc ngủ?", title2: "Những điều nào dưới đây đúng với bạn?",
    intro: "Chọn một hoặc nhiều mục bạn quan tâm. Bạn có thể chọn nhiều để nhận đề xuất phù hợp.", intro2: "Chọn nhiều mục nếu muốn (được chọn nhiều). Bạn cũng có thể bỏ qua tất cả.", other: "Mô tả ngắn mối quan tâm", note: "Chia sẻ tùy chọn", age: "Tôi xác nhận mình từ 13 tuổi trở lên.", start: "Bắt đầu", next: "Tiếp tục", back: "Quay lại", finish: "Tiếp tục kích hoạt tài khoản", none: "Không có điều nào kể trên", unsure: "Tôi không chắc", extra: "Ghi chú thêm (không bắt buộc)", required: "Hãy chọn ít nhất một mối quan tâm.", noteRequired: "Hãy mô tả ngắn mối quan tâm của bạn.", ageRequired: "HealthClues hiện dành cho người từ 13 tuổi trở lên.", safety: "Các lựa chọn là yếu tố và hoàn cảnh tự báo cáo, không xác định nguyên nhân hay chẩn đoán. Không tự ý ngừng thuốc. Đau/sưng khớp mới xuất hiện hoặc nghiêm trọng cần được chuyên gia y tế đánh giá." 
  } : {
    title1: "What health concerns are you interested in?", titleSleep: "What would you like to explore about sleep?", title2: "Which of these things apply to you?",
    intro: "Choose one or more concerns that matter to you. You can select multiple.", intro2: "Choose any that apply (multiple allowed), or leave them all unchecked.", other: "Briefly describe your concern", note: "Optional note", age: "I confirm that I am 13 or older.", start: "Start", next: "Continue", back: "Back", finish: "Continue to account activation", none: "None of these", unsure: "I'm not sure", extra: "Anything else? (optional)", required: "Choose at least one concern.", noteRequired: "Briefly describe your concern.", ageRequired: "HealthClues is currently for people aged 13 and older.", safety: "These are self-reported factors and circumstances, not causes or a diagnosis. Do not stop medication on your own. New or severe joint pain or swelling should be assessed by a health professional."
  };
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("healthclues-two-question-discovery-v1");
      if (!raw) return;
      const s = JSON.parse(raw);
      if (s.questId === questId) {
        setScreen(s.screen === 2 ? 2 : 1);
        const storedConcern = typeof s.concernId === "string" ? s.concernId : "";
        const storedConcerns = Array.isArray(s.selectedConcerns) ? s.selectedConcerns : storedConcern ? [storedConcern] : [];
        setConcernId(storedConcern);
        setSelectedConcerns(storedConcerns);
        setConcernNote(typeof s.concernNote === "string" ? s.concernNote : "");
        setSelected(Array.isArray(s.selected) ? s.selected : []);
        setFactorNote(typeof s.factorNote === "string" ? s.factorNote : "");
        setAgeConfirmed(true);
      }
    } catch { sessionStorage.removeItem("healthclues-two-question-discovery-v1"); }
  }, [questId]);
  useEffect(() => {
    sessionStorage.setItem("healthclues-two-question-discovery-v1", JSON.stringify({ questId, screen, concernId, selectedConcerns, concernNote, selected, factorNote, ageConfirmed: true }));
  }, [questId, screen, concernId, selectedConcerns, concernNote, selected, factorNote]);

  const toggleConcern = (id: string) => {
    setError("");
    setSelectedConcerns(current => {
      const base = current.length > 0 ? current : concernId ? [concernId] : [];
      const updated = base.includes(id) ? base.filter(item => item !== id) : [...base, id];
      setConcernId(updated[0] || "");
      return updated;
    });
  };

  const toggle = (id: string) => setSelected(current => {
    if (id === "none") {
      return current.includes("none") ? [] : ["none"];
    }
    const withoutNone = current.filter(item => item !== "none");
    return withoutNone.includes(id) ? withoutNone.filter(item => item !== id) : [...withoutNone, id];
  });

  const advance = () => {
    setError("");
    const activeConcernList = concernChoices.filter(item =>
      selectedConcerns.length > 0 ? selectedConcerns.includes(item.id) : item.id === concernId
    );
    if (screen === 1) {
      if (!activeConcernList.length) { setError(copy.required); return; }
      if (activeConcernList.some(item => item.detail) && !concernNote.trim()) { setError(copy.noteRequired); return; }
      setScreen(2); return;
    }
    const primaryConcern = activeConcernList[0];
    const concernLabel = concernNote.trim() || activeConcernList.map(item => vi ? item.vi : item.en).join(" · ") || (vi ? primaryConcern.vi : primaryConcern.en);
    const selectedLabels = selected.filter(id => !otherIds.has(id)).map(id => factorChoices.find(item => item.id === id)).filter(Boolean).map(item => vi ? item!.vi : item!.en);
    if (selected.includes("none")) selectedLabels.push(copy.none);
    if (selected.includes("unsure")) selectedLabels.push(copy.unsure);
    const labels = selectedLabels;
    const effectiveConcernId = primaryConcern?.id || "general";
    let detectedFocus = effectiveConcernId;
    if (effectiveConcernId === "other" && concernNote.trim()) {
      const lowerNote = concernNote.toLowerCase();
      if (/stress|căng thẳng|áp lực|lo âu|lo lắng|mệt mỏi|anxiety/i.test(lowerNote)) detectedFocus = "stress";
      else if (/ngủ|mất ngủ|khó ngủ|thức giấc|insomnia/i.test(lowerNote)) detectedFocus = "sleep";
      else if (/đường huyết|tiểu đường|glucose|glycemic/i.test(lowerNote)) detectedFocus = "health-concern";
      else if (/gút|gout|axit uric|acid uric/i.test(lowerNote)) detectedFocus = "health-concern";
      else if (/tiêu hóa|dạ dày|đại tràng|bụng/i.test(lowerNote)) detectedFocus = "health-concern";
      else if (/cân nặng|giảm cân|béo|thừa cân/i.test(lowerNote)) detectedFocus = "weight";
    }
    const canonicalFocus = isSleep || detectedFocus === "sleep" ? "sleep" : detectedFocus === "weight" ? "weight-fitness" : detectedFocus === "stress" ? "stress" : detectedFocus === "beauty" ? "beauty-skin" : detectedFocus === "aging" ? "healthy-aging" : detectedFocus === "other" ? "other" : "health-concern";
    const profile: HealthCluesProfile = {
      topic: `${concernLabel}${isSleep ? " · Sleep Valley" : " · HealthClues Realm"}`.slice(0, 120), contentPreferences: [], presentation: "Choice-based discovery", comfortableActivityTime: "Not provided", refreshFrequency: "Not provided", twoWeekGoal: "Explore personal wellness goals", createdAt: new Date().toISOString(), safetyLevel: "caution", specificInterests: [],
      safetyContext: { foodAllergy: "unknown", foodRestriction: "unknown", professionalRestriction: "unknown", activityRestriction: "unknown", medicationOrSupplement: "unknown", acutePainfulJoint: "unknown", urgentSymptoms: "unknown", fluidRestriction: "unknown" },
      adaptiveDiscovery: { schemaVersion: 1, ageConfirmed: true, focusId: canonicalFocus, focusLabel: concernLabel.slice(0, 100), ...(concernNote.trim() ? { concernDetail: concernNote.trim().slice(0, 100) } : {}), answers: [{ questionId: `q-${effectiveConcernId}-factors`, answerIds: selected.map(id => otherIds.has(id) ? id : `a-${id}`), answerLabels: labels, ...(factorNote.trim() ? { optionalText: factorNote.trim().slice(0, 180) } : {}) }] },
    };
    sessionStorage.removeItem("healthclues-two-question-discovery-v1");
    sessionStorage.removeItem("healthclues-goal-first-discovery-v1");
    const targetQuestId = effectiveQuestId || (isSleep ? "sleep-better" : "health-concern");
    onComplete(profile, targetQuestId);
  };
  const choices = screen === 1 ? concernChoices : [...factorChoices, { id: "none", en: "None of these", vi: "Không có điều nào kể trên" }, { id: "unsure", en: "I'm not sure", vi: "Tôi không chắc" }];
  const hasSelection = screen === 1 ? (selectedConcerns.length > 0 || Boolean(concernId)) : true;
  return <section className="mx-auto w-full max-w-4xl rounded-[1.6rem] border-2 border-[#dfc982] bg-gradient-to-b from-[#fdfbf6] to-[#f4ede0] p-4 text-[#19322c] shadow-[0_24px_70px_#081a143d] sm:p-8" data-healthclues-two-question-quiz data-question-count="2" data-question-screen={screen}>
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#dfcf9d] pb-3">
      <p className="text-xs font-black uppercase tracking-[.22em] text-[#916e25]">✦ {isSleep ? "SLEEP VALLEY" : "HEALTHCLUES REALM"}</p>
      <span className="rounded-full border border-[#d6c48a] bg-[#fffbf0] px-3 py-0.5 text-xs font-black text-[#856526]">{vi ? `BƯỚC ${screen} / 2` : `STEP ${screen} OF 2`}</span>
    </div>
    <div className="mt-3 flex items-center justify-between">
      <h1 className="text-2xl font-black text-[#1b3d33] sm:text-3xl">{screen === 1 ? (isSleep ? copy.titleSleep : copy.title1) : copy.title2}</h1>
      {screen === 1 && selectedConcerns.length > 0 && <span className="rounded-lg bg-[#e8f1e6] px-2.5 py-1 text-xs font-bold text-[#2e5b41]">{vi ? `Đã chọn: ${selectedConcerns.length}` : `Selected: ${selectedConcerns.length}`}</span>}
      {screen === 2 && selected.length > 0 && <span className="rounded-lg bg-[#e8f1e6] px-2.5 py-1 text-xs font-bold text-[#2e5b41]">{vi ? `Đã chọn: ${selected.length}` : `Selected: ${selected.length}`}</span>}
    </div>
    <p className="mt-2 text-sm text-[#526a5d]">{screen === 1 ? copy.intro : copy.intro2}</p>
    <div className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
      {choices.map(item => {
        const active = screen === 1
          ? (selectedConcerns.length > 0 ? selectedConcerns.includes(item.id) : concernId === item.id)
          : selected.includes(item.id);
        return <button key={item.id} type="button" aria-pressed={active} onClick={() => { if (screen === 1) toggleConcern(item.id); else toggle(item.id); }} className={`group flex min-h-13 items-center justify-between rounded-xl border-2 px-4 py-3 text-left text-sm font-bold transition-all ${active ? "border-[#9c7b33] bg-gradient-to-r from-[#fff4d1] to-[#fbf0cd] text-[#294235] shadow-md ring-2 ring-[#e5c977]" : "border-[#ded9c5] bg-white text-[#2a3c33] hover:border-[#b8a674] hover:bg-[#fffdf7]"}`}>
          <span className="flex items-center gap-2.5">
            <span className={`grid h-5 w-5 place-items-center rounded-md border text-xs font-black transition ${active ? "border-[#9c7b33] bg-[#8a6820] text-white" : "border-[#cfc6ab] bg-[#faf8f0] text-transparent group-hover:border-[#a89972]"}`}>✓</span>
            <span>{vi ? item.vi : item.en}</span>
          </span>
          {active && <Check className="h-4 w-4 text-[#8a6820]"/>}
        </button>;
      })}
    </div>
    {screen === 1 && selectedConcerns.length > 1 && (
      <div className="mt-4 rounded-2xl border border-[#dfc982] bg-[#fffaf0] p-3.5">
        <p className="text-xs font-black uppercase tracking-wider text-[#80652f]">
          {vi ? "Mục ưu tiên chính của bạn trong hành trình này:" : "Your primary focus for this journey:"}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {selectedConcerns.map(cid => {
            const item = concernChoices.find(c => c.id === cid);
            if (!item) return null;
            const isPrimary = (concernId || selectedConcerns[0]) === cid;
            return (
              <button
                key={cid}
                type="button"
                onClick={() => setConcernId(cid)}
                className={`min-h-9 rounded-xl px-3 py-1 text-xs font-black transition ${
                  isPrimary
                    ? "bg-[#1b4a3e] text-[#fff6db] shadow-sm"
                    : "border border-[#c8bc94] bg-white text-[#294235] hover:bg-[#faf6e8]"
                }`}
              >
                {isPrimary ? "★ " : ""}{vi ? item.vi : item.en}
              </button>
            );
          })}
        </div>
      </div>
    )}
    {screen === 1 && concern?.detail && <label className="mt-4 block text-sm font-bold text-[#233d32]">{copy.other}<input value={concernNote} onChange={event => setConcernNote(event.target.value)} maxLength={100} placeholder={vi ? "Nhập chi tiết mối quan tâm của bạn..." : "Briefly describe your concern..."} className="mt-1.5 min-h-11 w-full rounded-xl border border-[#c9be9a] bg-white px-3.5 text-sm shadow-inner focus:outline-none focus:ring-2 focus:ring-[#a88a38]"/></label>}
    {screen === 2 && <><label className="mt-4 block text-sm font-bold text-[#233d32]">{copy.extra}<input value={factorNote} onChange={event => setFactorNote(event.target.value)} maxLength={180} placeholder={vi ? "Ghi chú thêm về nếp sinh hoạt hoặc hoàn cảnh..." : "Any additional notes..."} className="mt-1.5 min-h-11 w-full rounded-xl border border-[#c9be9a] bg-white px-3.5 text-sm shadow-inner focus:outline-none focus:ring-2 focus:ring-[#a88a38]"/></label><p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-[#5a6d61]"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#295b45]"/>{copy.safety}</p></>}
    {error && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-2.5 text-sm font-bold text-red-800">{error}</p>}
    <div className="sticky bottom-0 z-20 -mx-4 -mb-4 mt-6 flex items-center justify-between gap-2.5 rounded-b-[1.4rem] border-t border-[#dfcf9d] bg-[#f4ede0]/95 px-4 py-3 backdrop-blur-md pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] shadow-[0_-6px_16px_rgba(0,0,0,0.06)] sm:static sm:mx-0 sm:mb-0 sm:bg-transparent sm:p-0 sm:pt-3 sm:shadow-none">
      {screen === 2 ? <button type="button" onClick={() => { setScreen(1); setError(""); }} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-[#b8a674] bg-white px-3 py-2 text-xs font-bold text-[#354f42] hover:bg-[#f6f2e8] sm:px-4 sm:text-sm transition"><ArrowLeft className="h-4 w-4"/>{copy.back}</button> : <span/>}
      <button type="button" onClick={advance} disabled={screen === 1 && !hasSelection} className="inline-flex min-h-11 flex-1 sm:flex-initial items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1b4a3e] to-[#12382f] px-4 py-2 text-center text-xs font-black leading-tight text-[#fff6db] shadow-md hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 sm:max-w-xs sm:px-6 sm:text-sm transition"><span className="line-clamp-2">{screen === 1 ? copy.next : copy.finish}</span><ArrowRight className="h-4 w-4 shrink-0"/></button>
    </div>
  </section>;
}
