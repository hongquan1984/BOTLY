import type { HealthCluesProfile } from "@/lib/healthclues-quiz";

type ProfileWithHistory = HealthCluesProfile & Record<string, unknown> & { wellnessPlans?: unknown[] };

/** Stable across EN/VI because canonical answer IDs, not translated labels, identify the journey. */
export function discoveryContextIdentity(value: unknown): string {
  if (!value || typeof value !== "object" || Array.isArray(value)) return "missing";
  const profile = value as Record<string, unknown>;
  const adaptive = profile.adaptiveDiscovery && typeof profile.adaptiveDiscovery === "object" && !Array.isArray(profile.adaptiveDiscovery)
    ? profile.adaptiveDiscovery as Record<string, unknown> : null;
  if (!adaptive) return JSON.stringify({ legacyTopic: typeof profile.topic === "string" ? profile.topic.trim().toLocaleLowerCase() : "" });
  const answers = Array.isArray(adaptive.answers) ? adaptive.answers.flatMap((item: unknown) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return [];
    const answer = item as Record<string, unknown>;
    const questionId = typeof answer.questionId === "string" ? answer.questionId : "";
    const concernId = /^q-(.+)-factors$/.exec(questionId)?.[1] || questionId;
    return [{ concernId, answerIds: Array.isArray(answer.answerIds) ? answer.answerIds.filter((id): id is string => typeof id === "string") : [], optionalText: typeof answer.optionalText === "string" ? answer.optionalText.trim() : "" }];
  }) : [];
  return JSON.stringify({ focusId: adaptive.focusId ?? null, answers, concernDetail: typeof adaptive.concernDetail === "string" ? adaptive.concernDetail.trim().toLocaleLowerCase() : "" });
}

const CONCERN_DICTIONARY: Record<string, [string, string]> = {
  gout: ["Gout / high uric acid", "Gút / axit uric cao"],
  weight: ["Weight management", "Giảm cân / quản lý cân nặng"],
  glucose: ["Blood glucose", "Đường huyết"],
  "blood-pressure": ["Blood pressure", "Huyết áp"],
  migraine: ["Headache / migraine", "Đau đầu / migraine"],
  digestion: ["Digestion", "Tiêu hóa"],
  stress: ["Stress", "Căng thẳng"],
  general: ["General healthy living", "Sức khỏe tổng thể"],
  aging: ["Healthy aging", "Lão hóa khỏe mạnh"],
  beauty: ["Beauty and wellness", "Làm đẹp / chăm sóc sức khỏe"],
  "sleep-onset": ["Difficulty falling asleep", "Khó đi vào giấc ngủ"],
  "sleep-waking": ["Waking during the night", "Hay tỉnh giấc giữa đêm"],
  "sleep-early": ["Waking too early", "Thức dậy quá sớm"],
  "sleep-restless": ["Sleep does not feel refreshing", "Ngủ dậy vẫn thấy mệt"],
  "sleep-schedule": ["Irregular sleep schedule", "Lịch ngủ thất thường"],
};

export function discoveryContextMatchesWorld(questId: string, profile: Pick<HealthCluesProfile, "topic" | "adaptiveDiscovery">): boolean {
  const adaptive = profile.adaptiveDiscovery;
  if (adaptive) {
    const selectedLabel = (adaptive.concernDetail?.trim() || adaptive.focusLabel.trim()).normalize("NFKC").toLocaleLowerCase();
    const storedTopic = profile.topic.normalize("NFKC").toLocaleLowerCase();
    const primaryLabel = (adaptive.focusLabel.split(" · ")[0] || adaptive.focusLabel).trim().normalize("NFKC").toLocaleLowerCase();
    
    const isSleepContext = adaptive.focusId === "sleep" && (/sleep|rest|ngủ/i.test(storedTopic) || /sleep|rest|ngủ/i.test(selectedLabel));

    const directMatch = Boolean(
      selectedLabel &&
      (storedTopic.includes(selectedLabel) || storedTopic.includes(primaryLabel) || selectedLabel.includes(storedTopic))
    );

    const bilingualMatch = Object.values(CONCERN_DICTIONARY).some(([en, vi]) => {
      const enNorm = en.normalize("NFKC").toLocaleLowerCase();
      const viNorm = vi.normalize("NFKC").toLocaleLowerCase();
      const topicMatches = storedTopic.includes(enNorm) || storedTopic.includes(viNorm) || enNorm.includes(storedTopic) || viNorm.includes(storedTopic);
      const labelMatches = selectedLabel.includes(enNorm) || selectedLabel.includes(viNorm) || primaryLabel.includes(enNorm) || primaryLabel.includes(viNorm) || enNorm.includes(primaryLabel) || viNorm.includes(primaryLabel);
      return topicMatches && labelMatches;
    });

    if (!isSleepContext && !directMatch && !bilingualMatch) return false;
  }
  if (questId === "sleep-better") return adaptive ? adaptive.focusId === "sleep" : /sleep|rest|ngủ/i.test(profile.topic);
  if (questId === "health-concern") return adaptive ? adaptive.focusId !== "sleep" : Boolean(profile.topic.trim()) && !/sleep|rest|ngủ/i.test(profile.topic);
  return false;
}

export function localizedDiscoveryConcern(profile: Pick<HealthCluesProfile, "adaptiveDiscovery" | "topic">, locale: "en" | "vi"): string {
  const adaptive = profile.adaptiveDiscovery;
  if (!adaptive) return profile.topic;
  const concernId = /^q-(.+)-factors$/.exec(adaptive.answers[0]?.questionId || "")?.[1];
  if (adaptive.concernDetail?.trim()) return adaptive.concernDetail.trim();
  const label = concernId ? CONCERN_DICTIONARY[concernId] : undefined;
  return label ? label[locale === "vi" ? 1 : 0] : adaptive.focusLabel;
}

export function localizedDiscoveryFactors(profile: Pick<HealthCluesProfile, "adaptiveDiscovery">, locale: "en" | "vi"): string[] {
  const answers = profile.adaptiveDiscovery?.answers || [];
  const labels: Record<string, [string, string]> = {
    "red-meat": ["Red or organ meat", "Thịt đỏ hoặc nội tạng"], seafood: ["Some seafood", "Một số loại hải sản"], alcohol: ["Beer or alcohol", "Bia hoặc rượu"],
    "sweet-drinks": ["Sugar-sweetened drinks", "Đồ uống có đường"], hydration: ["Hydration routine", "Thói quen uống nước"], weight: ["Weight concern", "Quan tâm về cân nặng"],
    activity: ["Movement or activity", "Vận động"], kidney: ["Kidney health context", "Tình trạng thận"], medication: ["Medication context", "Thông tin về thuốc"],
    family: ["Family history", "Tiền sử gia đình"], "joint-attacks": ["Recurring joint symptoms", "Triệu chứng khớp tái phát"], "high-urate": ["High uric acid result", "Kết quả axit uric cao"],
    snacks: ["Snacking", "Ăn vặt"], "evening-meals": ["Late meals", "Bữa ăn muộn"], sitting: ["Long periods sitting", "Ngồi lâu"],
    "activity-limit": ["Movement limitations", "Hạn chế vận động"], schedule: ["Changing schedule", "Lịch trình thay đổi"], maintain: ["Keeping routines", "Duy trì thói quen"],
    diagnosed: ["Receiving care for glucose", "Đang được chăm sóc về đường huyết"], "abnormal-test": ["Glucose result needing follow-up", "Kết quả đường huyết cần theo dõi"], unsure: ["Not sure", "Không chắc"],
    screens: ["Screens near bedtime", "Màn hình gần giờ ngủ"], caffeine: ["Late-day caffeine", "Caffeine vào cuối ngày"], shift: ["Night or changing shifts", "Làm ca đêm hoặc đổi ca"], noise: ["Noise or light in sleep space", "Tiếng ồn hoặc ánh sáng nơi ngủ"], stress: ["Stress or thoughts affecting sleep", "Căng thẳng hoặc suy nghĩ ảnh hưởng giấc ngủ"], waking: ["Waking during the night", "Tỉnh giấc giữa đêm"],
    none: ["None of these", "Không có điều nào kể trên"], "daily-context": ["Daily routine or schedule", "Nếp sinh hoạt hoặc lịch trình"], access: ["Time, cost, or access", "Thời gian, chi phí hoặc khả năng tiếp cận"], "health-context": ["Another health concern", "Vấn đề sức khỏe khác"],
  };
  return answers.flatMap(answer => answer.answerIds.map((id, index) => {
    const key = id.replace(/^a-/, "");
    const pair = labels[key];
    return pair ? pair[locale === "vi" ? 1 : 0] : answer.answerLabels[index] || "";
  }).filter(Boolean));
}

export async function mergeVerifiedDiscoveryProfile(existing: unknown, incoming: HealthCluesProfile): Promise<ProfileWithHistory> {
  const previous = existing && typeof existing === "object" && !Array.isArray(existing) ? existing as ProfileWithHistory : {} as ProfileWithHistory;
  const priorPlans = Array.isArray(previous.wellnessPlans) ? previous.wellnessPlans : [];
  const previousIdentity = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(discoveryContextIdentity(previous))));
  const previousContextKey = Array.from(previousIdentity, value => value.toString(16).padStart(2, "0")).join("");
  const wellnessPlans = priorPlans.map(plan => {
    if (!plan || typeof plan !== "object" || Array.isArray(plan)) return plan;
    const row = plan as Record<string, unknown>;
    return typeof row.contextKey === "string" ? row : { ...row, contextKey: previousContextKey };
  });
  return {
    ...previous,
    ...incoming,
    ...(Array.isArray(previous.wellnessPlans) ? { wellnessPlans } : {}),
    ...(typeof previous.nickname === "string" ? { nickname: previous.nickname } : {}),
    ...(previous.preferredLocale === "en" || previous.preferredLocale === "vi" ? { preferredLocale: previous.preferredLocale } : {}),
  };
}

export function advisorCacheIdentity(input: { accountId: string; worldId: string; questId: string; context: string; locale: string }): string {
  return JSON.stringify(input);
}
