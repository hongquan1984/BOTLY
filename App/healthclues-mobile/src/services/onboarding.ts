import { DeviceEventEmitter } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { saveMobileGoals } from "./healthclues";
import { getApiBaseUrl, getStoredSession } from "./api";
import type { MobileWellnessGoal } from "../hooks/useWorld";

export type ConcernGroup = "health" | "sleep";

export interface ConcernOption {
  id: string;
  en: string;
  vi: string;
  group: ConcernGroup;
  detail?: boolean;
}

export interface FactorOption {
  id: string;
  en: string;
  vi: string;
}

export type FocusId =
  | "sleep"
  | "weight-fitness"
  | "health-concern"
  | "beauty-skin"
  | "healthy-aging"
  | "stress"
  | "other";

export interface MobileHealthProfile {
  topic: string;
  contentPreferences: string[];
  presentation: string;
  comfortableActivityTime: string;
  refreshFrequency: string;
  twoWeekGoal: string;
  createdAt: string;
  safetyLevel: "none" | "caution" | "urgent";
  specificInterests: string[];
  safetyContext: {
    foodAllergy: "yes" | "no" | "unknown";
    foodRestriction: "yes" | "no" | "unknown";
    professionalRestriction: "yes" | "no" | "unknown";
    activityRestriction: "yes" | "no" | "unknown";
    medicationOrSupplement: "yes" | "no" | "unknown";
    acutePainfulJoint: "yes" | "no" | "unknown";
    urgentSymptoms: "yes" | "no" | "unknown";
    fluidRestriction: "yes" | "no" | "unknown";
  };
  adaptiveDiscovery: {
    schemaVersion: 1;
    ageConfirmed: true;
    focusId: FocusId;
    focusLabel: string;
    concernDetail?: string;
    answers: Array<{
      questionId: string;
      answerIds: string[];
      answerLabels: string[];
      optionalText?: string;
    }>;
  };
}

export interface LocalizedText {
  en: string;
  vi: string;
}

export interface AiWellnessOption {
  title: LocalizedText;
  action: LocalizedText;
}

export interface AiSuggestedGoal {
  goalId: string;
  category: string;
  iconKey?: string;
  title: LocalizedText;
  relevanceReason: LocalizedText;
  optionA: AiWellnessOption;
  optionB: AiWellnessOption;
  advisorProof?: string;
}

export type AdvisorProviderStatus = "GEMINI_AI" | "DETERMINISTIC_DEMO" | "LOCAL_FALLBACK";

export interface AdvisorFetchResult {
  status: AdvisorProviderStatus;
  model: string | null;
  goals: AiSuggestedGoal[];
}

export const ONBOARDING_COMPLETED_KEY = "healthclues-onboarding-completed";
export const STARTER_PROFILE_KEY = "healthclues-starter-profile";

/**
 * Matches Web HealthCluesGoalFirstDiscovery concerns 1:1.
 */
export const HEALTH_CONCERNS: ConcernOption[] = [
  { id: "sleep", en: "Sleep & insomnia", vi: "Mất ngủ & Khó ngủ", group: "sleep" },
  { id: "gout", en: "Gout / high uric acid", vi: "Gút / axit uric cao", group: "health" },
  { id: "weight", en: "Weight management", vi: "Giảm cân / quản lý cân nặng", group: "health" },
  { id: "glucose", en: "Blood glucose / diabetes", vi: "Đường huyết / Tiểu đường", group: "health" },
  { id: "blood-pressure", en: "Blood pressure", vi: "Huyết áp", group: "health" },
  { id: "migraine", en: "Headache / migraine", vi: "Đau đầu / migraine", group: "health" },
  { id: "digestion", en: "Digestion", vi: "Tiêu hóa", group: "health" },
  { id: "stress", en: "Stress", vi: "Căng thẳng", group: "health" },
  { id: "general", en: "General healthy living", vi: "Sức khỏe tổng thể", group: "health" },
  { id: "aging", en: "Healthy aging", vi: "Lão hóa khỏe mạnh", group: "health" },
  { id: "beauty", en: "Beauty and wellness", vi: "Làm đẹp / chăm sóc sức khỏe", group: "health" },
  { id: "other", en: "Something else", vi: "Vấn đề khác", group: "health", detail: true },
];

export const CONCERN_FACTORS: Record<string, FactorOption[]> = {
  gout: [
    { id: "red-meat", en: "I often eat red meat or organ meats", vi: "Tôi thường ăn thịt đỏ hoặc nội tạng" },
    { id: "seafood", en: "I often eat some types of seafood", vi: "Tôi thường ăn một số loại hải sản" },
    { id: "alcohol", en: "I often drink beer or alcohol", vi: "Tôi thường uống bia hoặc rượu" },
    { id: "sweet-drinks", en: "I often drink sugar-sweetened drinks", vi: "Tôi thường uống đồ uống có đường" },
    { id: "hydration", en: "I sometimes drink less than I would like", vi: "Đôi khi tôi uống ít nước hơn mong muốn" },
    { id: "weight", en: "I am concerned about my weight", vi: "Tôi đang quan tâm đến cân nặng" },
    { id: "activity", en: "Movement is difficult or limited for me", vi: "Tôi khó vận động hoặc bị hạn chế vận động" },
  ],
  weight: [
    { id: "sweet-drinks", en: "I often drink sugar-sweetened drinks", vi: "Tôi thường uống đồ uống có đường" },
    { id: "snacks", en: "I often snack between meals", vi: "Tôi thường ăn vặt giữa các bữa" },
    { id: "evening-meals", en: "I often eat larger meals late in the day", vi: "Tôi thường ăn nhiều vào buổi tối" },
    { id: "sitting", en: "My work involves long periods of sitting", vi: "Công việc khiến tôi phải ngồi lâu" },
    { id: "activity-limit", en: "Movement is limited or difficult for me", vi: "Tôi bị hạn chế hoặc khó vận động" },
    { id: "maintain", en: "I find it hard to maintain routines", vi: "Tôi khó duy trì thói quen lâu dài" },
  ],
  glucose: [
    { id: "sweet-drinks", en: "I often drink sugar-sweetened drinks", vi: "Tôi thường uống đồ uống có đường" },
    { id: "activity", en: "I get little movement in a typical week", vi: "Một tuần điển hình tôi ít vận động" },
    { id: "irregular-meals", en: "My meals are often at irregular times", vi: "Tôi thường ăn uống không đúng giờ" },
    { id: "unsure", en: "I am not sure about my current glucose status", vi: "Tôi không rõ tình trạng đường huyết hiện tại" },
  ],
  sleep: [
    { id: "screens", en: "I use a phone or screen close to bedtime", vi: "Tôi dùng điện thoại hoặc màn hình sát giờ ngủ" },
    { id: "caffeine", en: "I drink coffee or caffeine later in the day", vi: "Tôi uống cà phê, trà hoặc caffeine vào cuối ngày" },
    { id: "schedule", en: "My sleep and wake times vary", vi: "Giờ ngủ và thức của tôi không đều" },
    { id: "stress", en: "Stress or thoughts keep me awake", vi: "Căng thẳng hoặc suy nghĩ khiến tôi khó ngủ" },
    { id: "waking", en: "I often wake during the night", vi: "Tôi thường tỉnh giấc giữa đêm" },
  ],
};

export const FALLBACK_FACTORS: FactorOption[] = [
  { id: "daily-context", en: "My daily routine or schedule affects this", vi: "Nếp sinh hoạt hoặc lịch trình ảnh hưởng đến điều này" },
  { id: "access", en: "Access, time, or cost makes this harder", vi: "Thời gian, chi phí hoặc khả năng tiếp cận khiến việc này khó hơn" },
  { id: "health-context", en: "Another health concern may be relevant", vi: "Một vấn đề sức khỏe khác có thể liên quan" },
];

export const SPECIAL_FACTOR_CHOICES: FactorOption[] = [
  { id: "none", en: "None of these", vi: "Không có điều nào kể trên" },
  { id: "unsure", en: "I'm not sure", vi: "Tôi không chắc" },
];

/**
 * Generates RFC-4122 UUID v4 without relying on browser-only crypto.randomUUID.
 */
export function generateUuidV4(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Aggregates unique lifestyle factors relevant to the user's selected health concerns.
 */
export function getFactorsForConcerns(selectedConcernIds: string[], concernNote: string): FactorOption[] {
  const collected: FactorOption[] = [];
  const seen = new Set<string>();
  const lowerNote = concernNote.toLowerCase();

  for (const cid of selectedConcernIds) {
    let list = CONCERN_FACTORS[cid];
    if (!list && cid === "stress") list = CONCERN_FACTORS.sleep;
    if (!list && cid === "other" && /ngủ|mất ngủ|sleep|stress|căng thẳng/.test(lowerNote)) {
      list = CONCERN_FACTORS.sleep;
    }
    if (!list) list = FALLBACK_FACTORS;
    for (const item of list) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        collected.push(item);
      }
    }
  }
  return collected.length > 0 ? collected : FALLBACK_FACTORS;
}

/**
 * Builds canonical Web-compatible HealthCluesProfile from user-selected/typed concerns & factors.
 */
export function buildDiscoveryProfile(params: {
  selectedConcerns: string[];
  primaryConcernId: string;
  concernNote: string;
  selectedFactors: string[];
  factorNote: string;
  locale: "vi" | "en";
}): { profile: MobileHealthProfile; requestQuestId: string } {
  const { selectedConcerns, primaryConcernId, concernNote, selectedFactors, factorNote, locale } = params;
  const activeConcerns = HEALTH_CONCERNS.filter((item) =>
    selectedConcerns.length > 0 ? selectedConcerns.includes(item.id) : item.id === primaryConcernId
  );
  const primary = activeConcerns.find((c) => c.id === primaryConcernId) || activeConcerns[0] || HEALTH_CONCERNS[7];
  const trimmedConcernNote = concernNote.trim();
  const trimmedFactorNote = factorNote.trim();

  const concernLabel =
    trimmedConcernNote ||
    activeConcerns.map((c) => (locale === "vi" ? c.vi : c.en)).join(" · ") ||
    (locale === "vi" ? primary.vi : primary.en);

  let detectedFocus = primary.id;
  if (primary.id === "other" && trimmedConcernNote) {
    const lowerNote = trimmedConcernNote.toLowerCase();
    if (/stress|căng thẳng|áp lực|lo âu|lo lắng|mệt mỏi|anxiety/i.test(lowerNote)) detectedFocus = "stress";
    else if (/ngủ|mất ngủ|khó ngủ|thức giấc|insomnia|sleep/i.test(lowerNote)) detectedFocus = "sleep";
    else if (/đường huyết|tiểu đường|glucose|glycemic|gút|gout|axit uric|acid uric|tiêu hóa|dạ dày|huyết áp|đau đầu|migraine/i.test(lowerNote)) detectedFocus = "health-concern";
    else if (/cân nặng|giảm cân|béo|thừa cân|weight/i.test(lowerNote)) detectedFocus = "weight";
  }

  const focusId: FocusId =
    detectedFocus === "sleep"
      ? "sleep"
      : detectedFocus === "weight"
        ? "weight-fitness"
        : detectedFocus === "stress"
          ? "stress"
          : detectedFocus === "beauty"
            ? "beauty-skin"
            : detectedFocus === "aging"
              ? "healthy-aging"
              : detectedFocus === "other"
                ? "other"
                : "health-concern";

  const factorOptions = [...getFactorsForConcerns(selectedConcerns, trimmedConcernNote), ...SPECIAL_FACTOR_CHOICES];
  const otherIds = new Set(["none", "unsure"]);
  const answerIds = selectedFactors.map((id) => (otherIds.has(id) ? id : `a-${id}`));
  const answerLabels = selectedFactors
    .map((id) => {
      const opt = factorOptions.find((f) => f.id === id);
      return opt ? (locale === "vi" ? opt.vi : opt.en) : id;
    })
    .filter(Boolean);

  const profile: MobileHealthProfile = {
    topic: `${concernLabel} · HealthClues Realm`.slice(0, 120),
    contentPreferences: [],
    presentation: "Choice-based discovery",
    comfortableActivityTime: "Not provided",
    refreshFrequency: "Not provided",
    twoWeekGoal: "Explore personal wellness goals",
    createdAt: new Date().toISOString(),
    safetyLevel: "caution",
    specificInterests: [],
    safetyContext: {
      foodAllergy: "unknown",
      foodRestriction: "unknown",
      professionalRestriction: "unknown",
      activityRestriction: "unknown",
      medicationOrSupplement: "unknown",
      acutePainfulJoint: "unknown",
      urgentSymptoms: "unknown",
      fluidRestriction: "unknown",
    },
    adaptiveDiscovery: {
      schemaVersion: 1,
      ageConfirmed: true,
      focusId,
      focusLabel: concernLabel.slice(0, 100),
      ...(trimmedConcernNote ? { concernDetail: trimmedConcernNote.slice(0, 100) } : {}),
      answers: [
        {
          questionId: `q-${primary.id}-factors`,
          answerIds,
          answerLabels,
          ...(trimmedFactorNote ? { optionalText: trimmedFactorNote.slice(0, 180) } : {}),
        },
      ],
    },
  };

  return {
    profile,
    requestQuestId: focusId === "sleep" ? "sleep-better" : "health-concern",
  };
}

/**
 * Generates contextual offline fallback habits when /api/healthclues/wellness-advisor is offline.
 */
export function buildLocalPersonalizedGoals(profile: MobileHealthProfile): AiSuggestedGoal[] {
  const focusLabel = profile.adaptiveDiscovery.concernDetail || profile.adaptiveDiscovery.focusLabel;
  const answerIds = new Set(profile.adaptiveDiscovery.answers.flatMap((a) => a.answerIds));
  const combined = `${focusLabel} ${profile.topic} ${profile.adaptiveDiscovery.answers.flatMap((a) => [...a.answerLabels, a.optionalText || ""]).join(" ")}`.toLowerCase();

  if (/gút|gout|uric|axit uric|acid uric/.test(combined)) {
    const candidates: Array<{ priority: number; goal: AiSuggestedGoal }> = [
      {
        priority: answerIds.has("a-red-meat") || answerIds.has("a-seafood") ? 10 : 8,
        goal: {
          goalId: "local-gout-lowpurine",
          category: "nutrition",
          iconKey: "nutrition",
          title: { en: "Swap High-Purine Meats for Lighter Protein", vi: "Giảm thịt đỏ & hải sản giàu purine trong bữa ăn" },
          relevanceReason: {
            en: `For "${focusLabel}": trimming red meat, organ meats, and high-purine seafood lowers metabolic uric load.`,
            vi: `Phù hợp với "${focusLabel}": thịt đỏ, nội tạng và một số hải sản nhiều purine dễ làm tăng axit uric; ưu tiên đậu phụ, trứng và rau xanh.`,
          },
          optionA: { title: { en: "Lighter protein 1 meal", vi: "Đổi đạm nhẹ purine 1 bữa" }, action: { en: "Replace red meat or seafood in 1 main meal with tofu, eggs, or greens", vi: "Thay thịt đỏ hoặc hải sản ở 1 bữa chính bằng đậu hũ, trứng hoặc rau củ" } },
          optionB: { title: { en: "Low-purine lunch & dinner", vi: "Đạm nhẹ purine cả trưa & tối" }, action: { en: "Focus both lunch and dinner on low-purine proteins and greens", vi: "Duy trì bữa trưa và bữa tối với đạm nhẹ purine (đậu phụ, sữa ít béo, rau xanh)" } },
        },
      },
      {
        priority: answerIds.has("a-alcohol") || answerIds.has("a-sweet-drinks") || answerIds.has("a-hydration") ? 10 : 9,
        goal: {
          goalId: "local-gout-hydration",
          category: "hydration",
          iconKey: "water",
          title: { en: "Plain Water Over Sweet Drinks & Alcohol", vi: "Thay bia rượu & nước ngọt bằng nước lọc đều" },
          relevanceReason: {
            en: `Sugary drinks and alcohol slow uric clearance; steady water supports natural excretion.`,
            vi: `Đồ uống có đường fructose và cồn làm chậm bài tiết axit uric tại thận; uống nước lọc đều hỗ trợ thận thải tự nhiên.`,
          },
          optionA: { title: { en: "Swap 1 sweet/alcohol drink", vi: "Đổi 1 đồ uống ngọt/cồn" }, action: { en: "Swap one sugary or alcoholic drink for warm filtered water", vi: "Thay 1 cốc nước ngọt hoặc bia rượu trong ngày bằng nước lọc ấm" } },
          optionB: { title: { en: "4 plain-water checkpoints", vi: "Nước lọc tại 4 mốc ngày" }, action: { en: "Stick to plain water across morning, noon, afternoon, and early evening", vi: "Chỉ dùng nước lọc hoặc trà nhạt không đường vào sáng, trưa, chiều và đầu tối" } },
        },
      },
      {
        priority: 7,
        goal: {
          goalId: "local-gout-vitc-greens",
          category: "nutrition",
          iconKey: "nutrition",
          title: { en: "Fresh Greens & Low-Sugar Vitamin C Fruit", vi: "Tăng rau xanh & quả giàu vitamin C ít ngọt" },
          relevanceReason: {
            en: "Fiber and natural vitamin C from greens, cherries, or citrus support uric acid balance.",
            vi: "Chất xơ từ rau xanh và vitamin C tự nhiên từ ổi, cam, anh đào giúp hỗ trợ cân bằng chuyển hóa axit uric.",
          },
          optionA: { title: { en: "Greens + 1 vitamin C fruit", vi: "Rau xanh & quả ít ngọt" }, action: { en: "Add 1 serving of fresh greens plus guava, orange, or cherries", vi: "Thêm 1 phần rau xanh tươi và 1 phần quả ít ngọt (ổi, cam hoặc sơ-ri)" } },
          optionB: { title: { en: "Greens in 2 meals + vitamin C", vi: "Rau 2 bữa + vitamin C" }, action: { en: "Include fresh greens in 2 main meals plus vitamin C fruit", vi: "Duy trì rau xanh trong 2 bữa chính kèm trái cây giàu vitamin C tự nhiên" } },
        },
      },
      {
        priority: answerIds.has("a-activity") ? 9 : 6,
        goal: {
          goalId: "local-gout-mobility",
          category: "movement",
          iconKey: "movement",
          title: { en: "Gentle Low-Impact Joint Mobility", vi: "Vận động nhẹ không dồn lực lên khớp" },
          relevanceReason: {
            en: "Light joint circles keep circulation smooth without stressing sensitive joints.",
            vi: "Xoay giãn khớp nhẹ giúp lưu thông tuần hoàn (tạm nghỉ ngay nếu khớp đang sưng đau cấp).",
          },
          optionA: { title: { en: "10 mins gentle mobility", vi: "Xoay khớp nhẹ 10 phút" }, action: { en: "10 minutes of gentle joint circles and slow flat walking", vi: "Xoay nhẹ cổ chân, cổ tay và đi lại chậm 10 phút trên mặt phẳng êm" } },
          optionB: { title: { en: "20 mins flat walk", vi: "Đi bộ êm 20 phút" }, action: { en: "20 minutes cushioned flat walk, stopping if joints ache", vi: "Đi bộ nhẹ 20 phút với giày êm trên nền phẳng, dừng nếu thấy nhức khớp" } },
        },
      },
    ];
    return candidates.sort((a, b) => b.priority - a.priority).map((c) => c.goal);
  }

  if (/huyết áp|blood pressure/.test(combined)) {
    return [
      {
        goalId: "local-bp-sodium",
        category: "nutrition",
        iconKey: "nutrition",
        title: { en: "Ease Hidden Salt & Dipping Sauces", vi: "Giảm nước chấm mặn & đồ chế biến sẵn" },
        relevanceReason: { en: `Tailored for "${focusLabel}": reducing excess sodium eases vascular load.`, vi: `Phù hợp "${focusLabel}": hạn chế muối ẩn trong nước chấm đậm giúp nhẹ gánh cho thành mạch.` },
        optionA: { title: { en: "Half the dipping sauce", vi: "Giảm 1/2 nước chấm" }, action: { en: "Cut dipping sauce portion in half at meals", vi: "Giảm một nửa lượng nước mắm/nước tương chấm và không nêm thêm muối" } },
        optionB: { title: { en: "2 lightly seasoned meals", vi: "2 bữa nêm nhạt tự nhiên" }, action: { en: "Keep two meals lightly seasoned with herbs or lemon", vi: "Ưu tiên 2 bữa tự nấu thanh đạm, dùng chanh/tỏi/gừng thay vị mặn" } },
      },
      {
        goalId: "local-bp-breathing",
        category: "relaxation",
        iconKey: "breathing",
        title: { en: "Slow Calm Breathing Breaks", vi: "Thở chậm 4-7-8 dịu nhịp tim mạch" },
        relevanceReason: { en: "Slow exhalations calm sympathetic vascular tension.", vi: "Kéo dài nhịp thở ra giúp làm dịu hệ thần kinh và ổn định nhịp tim mạch." },
        optionA: { title: { en: "3 mins paced breathing", vi: "Thở chậm 3 phút" }, action: { en: "Practice 3 minutes of slow breathing in the afternoon", vi: "Ngồi thẳng thư giãn vai và thở chậm sâu 3 phút vào buổi chiều" } },
        optionB: { title: { en: "5 mins morning & night", vi: "5 phút sáng & tối" }, action: { en: "Two 5-minute calm breathing sessions daily", vi: "Duy trì 5 phút hít thở chậm mỗi sáng và tối trước khi ngủ" } },
      },
      {
        goalId: "local-bp-walk",
        category: "movement",
        iconKey: "movement",
        title: { en: "Steady Rhythmic Walk", vi: "Đi bộ nhịp đều ngoài trời" },
        relevanceReason: { en: "Consistent light walking supports smooth circulation.", vi: "Đi bộ đều đặn giúp tăng độ đàn hồi mạch máu một cách tự nhiên." },
        optionA: { title: { en: "10 mins relaxed walk", vi: "Đi bộ 10 phút" }, action: { en: "Walk calmly for 10 minutes", vi: "Đi bộ nhịp thoải mái 10 phút nơi thoáng mát" } },
        optionB: { title: { en: "20 mins steady walk", vi: "Đi bộ đều 20 phút" }, action: { en: "Walk steadily for 20 minutes", vi: "Đi bộ nhịp đều 20 phút giữ hơi thở êm, không gắng sức" } },
      },
    ];
  }

  if (/tiêu hóa|dạ dày|đại tràng|đầy hơi|digestion|stomach|gut/.test(combined)) {
    return [
      {
        goalId: "local-digest-chew",
        category: "nutrition",
        iconKey: "nutrition",
        title: { en: "Unrushed Meals & Thorough Chewing", vi: "Ăn đúng giờ & nhai kỹ giảm áp lực dạ dày" },
        relevanceReason: { en: `Tailored for "${focusLabel}": thorough chewing eases digestive workload.`, vi: `Phù hợp "${focusLabel}": nhai kỹ giúp enzyme tiêu hóa hoạt động tốt và giảm đầy hơi.` },
        optionA: { title: { en: "15 mins mindful lunch", vi: "Ăn chậm 15 phút bữa trưa" }, action: { en: "Put down screens and chew slowly for 15 mins at lunch", vi: "Không dùng điện thoại khi ăn và nhai chậm rãi trong bữa trưa 15 phút" } },
        optionB: { title: { en: "Fixed schedule + chewing", vi: "Đúng giờ & nhai kỹ 2 bữa" }, action: { en: "Eat lunch & dinner on schedule without rushing", vi: "Giữ giờ ăn đều đặn và nhai kỹ ở cả bữa trưa lẫn tối" } },
      },
      {
        goalId: "local-digest-walk",
        category: "movement",
        iconKey: "movement",
        title: { en: "Gentle Post-Meal Walk", vi: "Đi lại nhẹ 10 phút sau ăn, không nằm ngay" },
        relevanceReason: { en: "Staying upright supports natural gut motility.", vi: "Giữ tư thế thẳng và đi lại nhẹ giúp nhu động ruột vận hành êm ái." },
        optionA: { title: { en: "Upright 20m + 5m walk", vi: "Ngồi/đứng thẳng sau ăn" }, action: { en: "Stay upright 20 mins and stroll 5 mins after meals", vi: "Không nằm ngay trong 20 phút đầu và đi nhẹ 5 phút sau bữa ăn" } },
        optionB: { title: { en: "12 mins evening stroll", vi: "Đi dạo 12 phút sau tối" }, action: { en: "Stroll calmly for 12 mins after dinner", vi: "Tản bộ thong thả 12 phút sau bữa tối hỗ trợ tiêu hóa nhẹ bụng" } },
      },
      {
        goalId: "local-digest-warm",
        category: "hydration",
        iconKey: "water",
        title: { en: "Warm Sips & Cooked Greens", vi: "Nước ấm từng ngụm & rau củ nấu mềm" },
        relevanceReason: { en: "Warm fluids and soft fiber comfort the digestive tract.", vi: "Nước ấm và rau củ nấu mềm dịu nhẹ cho niêm mạc tiêu hóa." },
        optionA: { title: { en: "Warm water + cooked greens", vi: "Nước ấm + rau nấu mềm" }, action: { en: "Sip warm water morning and eat cooked greens", vi: "Uống từng ngụm nước ấm buổi sáng và thêm rau hấp/luộc mềm trong bữa" } },
        optionB: { title: { en: "Warm sips all day", vi: "Nước ấm cả ngày & ít đồ chiên" }, action: { en: "Favor warm water over iced drinks and light cooking", vi: "Thay đồ uống đá lạnh bằng nước ấm và hạn chế món chiên rán nhiều dầu" } },
      },
    ];
  }

  if (profile.adaptiveDiscovery.focusId === "stress" || /căng thẳng|stress|áp lực|lo âu|đau đầu|migraine|vai gáy/.test(combined)) {
    return [
      {
        goalId: "local-stress-breathing",
        category: "relaxation",
        iconKey: "breathing",
        title: { en: "4-7-8 Relaxing Breath", vi: "Thở sâu 4-7-8 giải tỏa căng thẳng" },
        relevanceReason: {
          en: `Tailored for "${focusLabel}" to soothe your nervous system.`,
          vi: `Phù hợp với mục tiêu "${focusLabel}": làm dịu hệ thần kinh và giảm áp lực nhanh chóng.`,
        },
        optionA: { title: { en: "3 mins breathing", vi: "Thở chậm 3 phút" }, action: { en: "Practice 3 minutes of slow breathing", vi: "Thực hành 3 phút thở sâu bụng khi thấy căng thẳng" } },
        optionB: { title: { en: "5 mins morning & noon", vi: "5 phút sáng & trưa" }, action: { en: "5 minutes breathing twice daily", vi: "Dành 5 phút thở sâu thư giãn sáng và giữa giờ làm việc" } },
      },
      {
        goalId: "local-stress-walk",
        category: "movement",
        iconKey: "movement",
        title: { en: "Nature De-Stress Walk", vi: "Đi dạo hít thở không khí thoáng đãng" },
        relevanceReason: {
          en: `Helps clear mental fatigue linked to "${focusLabel}".`,
          vi: `Giúp chuyển hóa năng lượng trì trệ và thư giãn cơ thể xoay quanh vấn đề "${focusLabel}".`,
        },
        optionA: { title: { en: "10 mins stroll", vi: "Đi dạo 10 phút" }, action: { en: "Walk 10 mins without work phone", vi: "Đi bộ thả lỏng 10 phút ngoài trời, tạm gác điện thoại" } },
        optionB: { title: { en: "20 mins brisk stroll", vi: "Tản bộ 20 phút" }, action: { en: "20 minutes light walk outdoors", vi: "Tản bộ nhẹ nhàng 20 phút buổi chiều tối" } },
      },
      {
        goalId: "local-stress-disconnect",
        category: "sleep",
        iconKey: "wind-down",
        title: { en: "Screen-Free Evening Pause", vi: "Rời màn hình 20 phút trước ngủ" },
        relevanceReason: {
          en: "Supports calmer evening transition and deeper recovery.",
          vi: "Giảm quá tải thông báo buổi tối để cơ thể phục hồi tự nhiên.",
        },
        optionA: { title: { en: "15 mins offline", vi: "Nghỉ màn hình 15 phút" }, action: { en: "Step away from screens 15 mins before bed", vi: "Đặt điện thoại sang một bên 15 phút trước khi ngủ" } },
        optionB: { title: { en: "30 mins offline + book", vi: "30 phút đọc sách nhẹ" }, action: { en: "30 mins reading without screens", vi: "Dành 30 phút đọc sách hoặc nghe nhạc nhẹ trước ngủ" } },
      },
    ];
  }

  if (/ngủ|mất ngủ|sleep|insomnia/.test(combined)) {
    return [
      {
        goalId: "local-sleep-screens",
        category: "sleep",
        iconKey: "wind-down",
        title: { en: "Evening Screen Sunset", vi: "Tạm dừng màn hình trước giờ ngủ" },
        relevanceReason: {
          en: `Directly addresses "${focusLabel}" by protecting natural melatonin rhythm.`,
          vi: `Gắn trực tiếp với "${focusLabel}": hạn chế ánh sáng xanh để dễ đi vào giấc ngủ sâu.`,
        },
        optionA: { title: { en: "15 mins screen-free", vi: "Nghỉ màn hình 15 phút" }, action: { en: "Put screens away 15 mins before sleep", vi: "Tắt màn hình điện thoại 15 phút trước giờ lên giường" } },
        optionB: { title: { en: "30 mins screen-free", vi: "Nghỉ màn hình 30 phút" }, action: { en: "Turn off screens 30 mins before bed", vi: "Ngừng dùng mọi thiết bị điện tử 30 phút trước khi ngủ" } },
      },
      {
        goalId: "local-sleep-breathing",
        category: "relaxation",
        iconKey: "breathing",
        title: { en: "Calm Bedtime Breathing", vi: "Thở chậm thư giãn trên giường" },
        relevanceReason: {
          en: "Quiets racing thoughts before falling asleep.",
          vi: "Làm chậm nhịp tim và dịu suy nghĩ trước khi chợp mắt.",
        },
        optionA: { title: { en: "3 mins breathing", vi: "Thở chậm 3 phút" }, action: { en: "3 mins slow belly breathing in bed", vi: "Hít thở bụng chậm rãi 3 phút khi đã nằm nghỉ" } },
        optionB: { title: { en: "5 mins body relaxation", vi: "Thả lỏng cơ 5 phút" }, action: { en: "5 mins progressive relaxation before sleep", vi: "Thực hành 5 phút thả lỏng từng nhóm cơ trước ngủ" } },
      },
      {
        goalId: "local-sleep-caffeine",
        category: "nutrition",
        iconKey: "water",
        title: { en: "Switch Evening Drinks to Warm Water", vi: "Ưu tiên nước ấm / trà dịu buổi chiều tối" },
        relevanceReason: {
          en: "Prevents late caffeine interference while staying comfortably hydrated.",
          vi: "Tránh kích thích muộn và giữ cổ họng êm dịu suốt đêm.",
        },
        optionA: { title: { en: "No caffeine after 4 PM", vi: "Hạn chế caffeine sau 16h" }, action: { en: "Avoid coffee or strong tea after 4 PM", vi: "Không uống cà phê hoặc trà đặc sau 16h chiều" } },
        optionB: { title: { en: "Warm herbal sip evening", vi: "1 cốc trà thảo mộc ấm" }, action: { en: "Sip caffeine-free chamomile tea in the evening", vi: "Thưởng thức 1 tách trà hoa cúc ấm không caffeine buổi tối" } },
      },
    ];
  }

  if (/tiểu đường|đái tháo đường|đường huyết|glucose|glycemic|hạ đường|tiểu đuờng/.test(combined)) {
    return [
      {
        goalId: "local-diabetes-water",
        category: "hydration",
        iconKey: "water",
        title: {
          en: "Drink 2L Warm Water Throughout the Day",
          vi: "Uống 2L nước ấm rải rác trong ngày",
        },
        relevanceReason: {
          en: `Customized for "${focusLabel}": steady warm water supports kidney filtration to naturally excrete excess circulating glucose and prevent blood hyperosmolality.`,
          vi: `Thiết kế riêng cho "${focusLabel}": uống nước lọc ấm đều đặn hỗ trợ thận lọc và đào thải lượng glucose dư thừa qua nước tiểu một cách tự nhiên, giảm độ cô đặc của máu.`,
        },
        optionA: {
          title: { en: "1 glass on waking & before meals", vi: "1 cốc ấm sau ngủ dậy & trước bữa ăn" },
          action: { en: "Drink 1 glass of warm water after waking and 15 mins before each meal", vi: "Uống 1 cốc nước ấm ngay sau khi thức dậy và 15 phút trước mỗi bữa ăn chính" },
        },
        optionB: {
          title: { en: "6-8 warm water checkpoints (2L)", vi: "Chia đều 6-8 cốc nước ấm (2L/ngày)" },
          action: { en: "Spread 6-8 glasses of warm water across morning, noon, afternoon and early evening", vi: "Uống đều 6-8 cốc nước ấm rải rác vào sáng, giữa buổi, trưa, xế chiều và đầu tối" },
        },
      },
      {
        goalId: "local-diabetes-sugar",
        category: "nutrition",
        iconKey: "nutrition",
        title: {
          en: "Cut Added Sugars, Soda & Sweets",
          vi: "Cắt giảm đường đơn, nước ngọt có ga & bánh kẹo",
        },
        relevanceReason: {
          en: "Simple sugars absorb rapidly, triggering sharp post-meal glycemic spikes that overburden pancreatic beta cells.",
          vi: "Đường tinh luyện hấp thu cực nhanh vào máu gây tăng vọt đường huyết sau ăn (spike) và làm quá tải tế bào beta tuyến tụy.",
        },
        optionA: {
          title: { en: "Zero soft drinks or sweet teas", vi: "Không nước ngọt có ga & trà sữa" },
          action: { en: "Avoid soda, bubble tea, and added sugar in coffee/tea today", vi: "Cắt hoàn toàn nước ngọt có ga, trà sữa và không thêm đường vào cà phê/trà" },
        },
        optionB: {
          title: { en: "Swap sweets for raw nuts/low-GI fruits", vi: "Thay đồ ngọt bằng hạt & quả ít ngọt" },
          action: { en: "Replace sweet snacks with raw walnuts, almonds, or low-sugar guava", vi: "Thay đồ ăn vặt ngọt bằng các loại hạt nguyên vị (hạnh nhân, óc chó) hoặc quả ít ngọt (ổi, thanh long ruột trắng)" },
        },
      },
      {
        goalId: "local-diabetes-plate-rule",
        category: "nutrition",
        iconKey: "nutrition",
        title: {
          en: "Plate Rule: Eat Greens First, Reduce Fast Carbs",
          vi: "Quy tắc đĩa ăn: Ăn rau xanh trước, giảm tinh bột nhanh",
        },
        relevanceReason: {
          en: "Soluble dietary fiber coats the intestinal lining, significantly slowing glucose absorption; reducing white rice lowers glycemic load.",
          vi: "Chất xơ hòa tan từ rau xanh tạo lớp màng làm chậm quá trình phân giải carbohydrate; giảm 1/3 cơm trắng giúp làm phẳng đỉnh đường huyết.",
        },
        optionA: {
          title: { en: "Eat greens 5-10m before rice", vi: "Ăn rau xanh trước cơm 5-10 phút" },
          action: { en: "Eat boiled greens or soup 5-10 mins before eating starches and main protein", vi: "Ăn hết phần rau luộc hoặc canh rau trước khi ăn cơm và thức ăn chính 5-10 phút" },
        },
        optionB: {
          title: { en: "Trim 1/3 white rice & add greens", vi: "Giảm 1/3 cơm trắng, tăng rau & ngũ cốc" },
          action: { en: "Cut white rice portion by 1/3 at lunch and dinner, swapping in brown rice or greens", vi: "Giảm 1/3 lượng cơm trắng mỗi bữa, ưu tiên thay thế bằng gạo lứt, yến mạch hoặc rau củ" },
        },
      },
      {
        goalId: "local-diabetes-walk",
        category: "movement",
        iconKey: "movement",
        title: {
          en: "Post-Meal 15-20 Min Light Walk",
          vi: "Đi bộ nhẹ nhàng 15-20 phút sau bữa ăn chính",
        },
        relevanceReason: {
          en: "Light post-meal muscle contraction activates non-insulin-dependent GLUT4 translocation, drawing glucose out of circulation.",
          vi: "Vận động cơ bắp nhẹ sau bữa ăn kích hoạt kênh GLUT4 vận chuyển glucose trực tiếp vào tế bào mà không phụ thuộc quá nhiều vào insulin.",
        },
        optionA: {
          title: { en: "15 mins stroll after lunch", vi: "Đi bộ nhẹ 15 phút sau bữa trưa" },
          action: { en: "Stroll calmly for 15 mins after lunch without lying down immediately", vi: "Đi bộ thư giãn hoặc đứng đi lại nhẹ nhàng 15 phút sau bữa trưa (không nằm ngay)" },
        },
        optionB: {
          title: { en: "15-20 mins walk after 2 meals", vi: "Đi bộ 15-20 phút sau 2 bữa chính" },
          action: { en: "Walk comfortably for 15-20 mins after both lunch and dinner", vi: "Tản bộ nhẹ nhàng 15-20 phút sau cả bữa trưa và tối để cơ thể tiêu hao bớt năng lượng dư" },
        },
      },
    ];
  }

  if (/cân nặng|weight|béo|thừa cân/.test(combined)) {
    return [
      {
        goalId: "local-metabolic-walk",
        category: "movement",
        iconKey: "movement",
        title: { en: "Post-Meal Gentle Walk", vi: "Đi bộ nhẹ nhàng sau bữa ăn" },
        relevanceReason: {
          en: `Matches "${focusLabel}" by naturally engaging muscles right after eating.`,
          vi: `Phù hợp với "${focusLabel}": hỗ trợ tiêu hao năng lượng và chuyển hóa đường sau bữa ăn.`,
        },
        optionA: { title: { en: "10 mins post-lunch", vi: "Đi bộ 10 phút sau trưa" }, action: { en: "10-minute gentle walk after lunch", vi: "Đi bộ thư giãn 10 phút sau bữa trưa" } },
        optionB: { title: { en: "15 mins after 2 meals", vi: "15 phút sau 2 bữa chính" }, action: { en: "15-minute walk after lunch & dinner", vi: "Đi bộ nhẹ 15 phút sau cả bữa trưa và bữa tối" } },
      },
      {
        goalId: "local-metabolic-fiber",
        category: "nutrition",
        iconKey: "nutrition",
        title: { en: "Eat Vegetables Before Starches", vi: "Ưu tiên ăn rau xanh đầu bữa" },
        relevanceReason: {
          en: "Dietary fiber slows starch absorption and increases fullness naturally.",
          vi: "Chất xơ đầu bữa giúp làm chậm hấp thu tinh bột và tăng cảm giác no lành mạnh.",
        },
        optionA: { title: { en: "1 serving greens first", vi: "Rau đầu bữa ở 1 bữa" }, action: { en: "Eat greens first in 1 main meal", vi: "Ăn một phần rau luộc/salad trước tinh bột ở 1 bữa chính" } },
        optionB: { title: { en: "Greens first in 2 meals", vi: "Rau đầu bữa ở 2 bữa" }, action: { en: "Eat greens before carbs in lunch & dinner", vi: "Duy trì ăn rau trước tinh bột trong cả bữa trưa và tối" } },
      },
      {
        goalId: "local-metabolic-drinks",
        category: "hydration",
        iconKey: "water",
        title: { en: "Replace Sugary Drinks with Water", vi: "Thay đồ uống ngọt bằng nước lọc ấm" },
        relevanceReason: {
          en: `Reduces unnecessary liquid sugar intake aligned with "${focusLabel}".`,
          vi: `Giảm tải đường nạp vào giúp hỗ trợ "${focusLabel}" bền vững.`,
        },
        optionA: { title: { en: "Swap 1 sweet drink/day", vi: "Đổi 1 ly nước ngọt/ngày" }, action: { en: "Swap one sugary beverage for filtered water", vi: "Thay thế 1 cốc nước ngọt/trà sữa bằng nước lọc trong ngày" } },
        optionB: { title: { en: "Pure water all day", vi: "Chỉ dùng nước lọc & trà nhạt" }, action: { en: "Stick to water and unsweetened tea today", vi: "Ưu tiên hoàn toàn nước lọc hoặc trà không đường cả ngày" } },
      },
    ];
  }

  // General, Gout, Blood pressure, Digestion, Migraine, Aging, Beauty, Custom free text
  return [
    {
      goalId: "local-custom-hydration",
      category: "hydration",
      iconKey: "water",
      title: { en: "Steady Hydration Rhythm", vi: "Duy Trì Nhịp Uống Nước Đều Đặn" },
      relevanceReason: {
        en: `Customized for "${focusLabel}" to support circulation and natural clearance.`,
        vi: `Thiết lập theo mối quan tâm "${focusLabel}": giữ nhịp uống từng ngụm nhỏ hỗ trợ chuyển hóa.`,
      },
      optionA: { title: { en: "Warm water each morning", vi: "1 cốc ấm buổi sáng" }, action: { en: "Drink 1 glass of warm water after waking up", vi: "Uống 1 cốc nước ấm vào sáng sớm và nhắc nhỏ giữa ngày" } },
      optionB: { title: { en: "4 regular hydration checkpoints", vi: "Uống đều 4 mốc trong ngày" }, action: { en: "Drink water across 4 scheduled checkpoints", vi: "Chia nhỏ nước lọc uống đều vào sáng, trưa, xế chiều và tối" } },
    },
    {
      goalId: "local-custom-nutrition",
      category: "nutrition",
      iconKey: "nutrition",
      title: { en: "Balanced Greens & Whole Foods", vi: "Tăng Cường Rau Quả Tự Nhiên Trong Bữa" },
      relevanceReason: {
        en: `Addresses "${focusLabel}" with anti-inflammatory, micronutrient-rich meals.`,
        vi: `Hỗ trợ trực tiếp cho "${focusLabel}" nhờ bổ sung chất xơ và chất chống oxy hóa thực vật.`,
      },
      optionA: { title: { en: "1 green dish today", vi: "Thêm rau ở 1 bữa" }, action: { en: "Add 1 serving of fresh vegetables to a meal", vi: "Bổ sung 1 phần rau xanh tươi hoặc trái cây ít ngọt vào bữa chính" } },
      optionB: { title: { en: "2 balanced whole-food meals", vi: "Ăn cân bằng 2 bữa chính" }, action: { en: "Include fresh greens and low-processed protein in 2 meals", vi: "Duy trì rau xanh và đạm lành mạnh ít chế biến trong 2 bữa chính" } },
    },
    {
      goalId: "local-custom-movement",
      category: "movement",
      iconKey: "movement",
      title: { en: "Gentle Mobility & Walking", vi: "Đi Bộ Nhẹ & Giãn Cơ Linh Hoạt" },
      relevanceReason: {
        en: `Supports daily vitality around "${focusLabel}".`,
        vi: `Giúp lưu thông tuần hoàn và giảm ứ trệ phù hợp với "${focusLabel}".`,
      },
      optionA: { title: { en: "10 mins light movement", vi: "Vận động nhẹ 10 phút" }, action: { en: "10-minute gentle walk or shoulder/joint stretch", vi: "Đi bộ thả lỏng hoặc xoay giãn khớp nhẹ nhàng 10 phút" } },
      optionB: { title: { en: "20 mins outdoor walk", vi: "Đi bộ ngoài trời 20 phút" }, action: { en: "20-minute rhythmic walk in fresh air", vi: "Đi bộ nhịp nhàng 20 phút kết hợp hít thở đều" } },
    },
  ];
}

/**
 * Requests AI personalized suggestions from /api/healthclues/wellness-advisor,
 * gracefully falling back to topic-aware local suggestions if offline or unavailable.
 */
export async function requestWellnessAdvisor(
  profile: MobileHealthProfile,
  questId: string,
  locale: "vi" | "en" = "vi"
): Promise<AdvisorFetchResult> {
  const requestId = generateUuidV4();
  try {
    const session = await getStoredSession();
    const baseUrl = getApiBaseUrl();
    const endpoint = baseUrl
      ? `${baseUrl.replace(/\/$/, "")}/api/healthclues/wellness-advisor`
      : "/api/healthclues/wellness-advisor";

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Request-Id": requestId,
    };
    if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token}`;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 32000);
    const res = await fetch(endpoint, {
      method: "POST",
      headers,
      signal: controller.signal,
      body: JSON.stringify({
        requestId,
        questId,
        profile,
        locale,
        forceRefresh: false,
      }),
    });
    clearTimeout(timer);

    if (res.ok) {
      const data = (await res.json()) as {
        status?: string;
        model?: string | null;
        goals?: AiSuggestedGoal[];
      };
      if (Array.isArray(data.goals) && data.goals.length > 0) {
        return {
          status: data.status === "GEMINI_AI" ? "GEMINI_AI" : "DETERMINISTIC_DEMO",
          model: data.model ?? null,
          goals: data.goals,
        };
      }
    }
  } catch {
    // Fall back gracefully to concern-specific local goals when backend/network is unavailable
  }

  return {
    status: "LOCAL_FALLBACK",
    model: null,
    goals: buildLocalPersonalizedGoals(profile),
  };
}

function mapAiCategoryToVietnamese(category: string): string {
  const lower = category.toLowerCase();
  if (/hydrat|water|nước/.test(lower)) return "Dinh Dưỡng";
  if (/nutrit|food|diet|ăn/.test(lower)) return "Dinh Dưỡng";
  if (/move|walk|exerc|vận động/.test(lower)) return "Vận Động";
  if (/sleep|wind|ngủ/.test(lower)) return "Giấc Ngủ";
  if (/relax|breath|mindful|stress|thư giãn/.test(lower)) return "Thư Giãn";
  return "Sống Khỏe";
}

/**
 * Converts AI selected/customized goals and user-created habits into game MobileWellnessGoal items.
 */
export function buildActiveGoalsFromSelection(params: {
  aiGoals: AiSuggestedGoal[];
  includedMap: Record<string, boolean>;
  modeMap: Record<string, "A" | "B" | "custom">;
  customDrafts: Record<string, string>;
  extraCustomGoals: MobileWellnessGoal[];
  locale: "vi" | "en";
}): MobileWellnessGoal[] {
  const { aiGoals, includedMap, modeMap, customDrafts, extraCustomGoals, locale } = params;
  const converted: MobileWellnessGoal[] = [];

  for (const goal of aiGoals) {
    if (!includedMap[goal.goalId]) continue;
    const mode = modeMap[goal.goalId] || "A";
    const loc = locale === "en" ? "en" : "vi";
    const category = mapAiCategoryToVietnamese(goal.category || "");

    if (mode === "custom" && customDrafts[goal.goalId]?.trim()) {
      const note = customDrafts[goal.goalId].trim();
      converted.push({
        id: goal.goalId,
        title: note,
        category,
        status: "active",
        target: "Tự điều chỉnh",
        unit: "· theo lịch cá nhân",
        daysPerWeek: 7,
        expValue: 15,
        description: goal.relevanceReason[loc] || goal.relevanceReason.vi,
        evidence: "Tùy chỉnh từ gợi ý AI HealthClues",
      });
    } else {
      const opt = mode === "B" ? goal.optionB : goal.optionA;
      const optTitle = opt.title[loc] || opt.title.vi;
      const optAction = opt.action[loc] || opt.action.vi;
      converted.push({
        id: goal.goalId,
        title: goal.title[loc] || goal.title.vi,
        category,
        status: "active",
        target: optTitle,
        unit: mode === "B" ? "· Mức Bứt Phá" : "· Mức Khởi Động",
        daysPerWeek: 7,
        expValue: mode === "B" ? 15 : 10,
        description: `${optAction}. ${goal.relevanceReason[loc] || goal.relevanceReason.vi}`,
        evidence: "Phân tích gợi ý từ Lumi AI & Hồ sơ khám phá",
      });
    }
  }

  for (const custom of extraCustomGoals) {
    converted.push(custom);
  }

  return converted;
}

/**
 * Persists the onboarding presentation locally, while selected goals are saved to the account API.
 */
export async function completeMobileOnboarding(params: {
  quest: string;
  profile: MobileHealthProfile;
  goals: MobileWellnessGoal[];
  providerStatus: AdvisorProviderStatus;
}): Promise<void> {
  const { quest, profile, goals, providerStatus } = params;
  const nowIso = new Date().toISOString();

  await AsyncStorage.setItem(ONBOARDING_COMPLETED_KEY, "true");
  await AsyncStorage.setItem(
    STARTER_PROFILE_KEY,
    JSON.stringify({
      quest,
      profile,
      providerStatus,
      completedAt: nowIso,
      expAwarded: 50,
    })
  );
  await saveMobileGoals(goals as Array<Record<string, any>>);

  DeviceEventEmitter.emit("healthclues-world-state-changed");
}

/**
 * Reads saved discovery profile if player wants to re-open AI suggestions inside Journey tab.
 */
export async function loadSavedStarterProfile(): Promise<{
  quest: string;
  profile: MobileHealthProfile;
} | null> {
  try {
    const raw = await AsyncStorage.getItem(STARTER_PROFILE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { quest?: string; profile?: MobileHealthProfile };
    if (parsed?.profile?.adaptiveDiscovery) {
      return {
        quest: parsed.quest || "healthclues-realm",
        profile: parsed.profile,
      };
    }
    return null;
  } catch {
    return null;
  }
}
