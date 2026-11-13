import {
  type GameIconSemanticKey,
  type WellnessCategory,
  type ValidAiHabitIconKey,
  GAME_ICON_REGISTRY,
  toAiHabitIconKey,
  VALID_AI_HABIT_ICON_KEYS,
  AI_CATEGORY_FALLBACK_ICONS,
  UNIVERSAL_AI_FALLBACK_ICON,
} from "./gameIconRegistry.ts";

export interface ResolvedWellnessIcon {
  key: GameIconSemanticKey;
  aiHabitKey: ValidAiHabitIconKey;
  label: string;
  category: WellnessCategory;
  matchedBy: "exact_keyword" | "phrase" | "category_fallback" | "default";
  keywordFound?: string;
}

interface MatchRule {
  key: GameIconSemanticKey;
  label: string;
  category: WellnessCategory;
  patterns: RegExp[];
}

/**
 * Ordered semantic matching rules for Vietnamese & English wellness AI content
 */
const MATCH_RULES: MatchRule[] = [
  // --- 1. Herbs & Botanical Infusions ---
  {
    key: "herbs:chamomile",
    label: "Hoa cúc / Trà cúc",
    category: "Herbs & Plants",
    patterns: [/hoa\s*cúc/i, /cúc\s*la\s*mã/i, /trà\s*cúc/i, /chamomile/i],
  },
  {
    key: "herbs:mint",
    label: "Bạc hà",
    category: "Herbs & Plants",
    patterns: [/bạc\s*hà/i, /lá\s*bạc\s*hà/i, /peppermint/i, /mint/i],
  },
  {
    key: "herbs:basil",
    label: "Húng quế / Thảo mộc tươi",
    category: "Herbs & Plants",
    patterns: [/húng\s*quế/i, /basil/i],
  },
  {
    key: "herbs:green-tea",
    label: "Trà xanh ấm",
    category: "Herbs & Plants",
    patterns: [/trà\s*xanh/i, /chè\s*xanh/i, /green\s*tea/i, /matcha/i],
  },
  {
    key: "herbs:bundle",
    label: "Bó thảo mộc dưỡng sinh",
    category: "Herbs & Plants",
    patterns: [/thảo\s*mộc/i, /dược\s*liệu/i, /cây\s*thuốc/i, /thảo\s*dược/i, /herbs?/i, /botanical/i],
  },

  // --- 2. Food & Specific Nutrition Items ---
  {
    key: "food:fish",
    label: "Cá & Hải sản giàu Omega-3",
    category: "Food & Nutrition",
    patterns: [/cá\s*hồi/i, /cá\s*ngừ/i, /cá\s*biển/i, /ăn\s*cá/i, /omega-?3/i, /fish/i, /salmon/i, /seafood/i, /tuna/i],
  },
  {
    key: "food:red-meat",
    label: "Giảm thịt đỏ & Phủ tạng",
    category: "Food & Nutrition",
    patterns: [/thịt\s*đỏ/i, /thịt\s*bò/i, /thịt\s*heo/i, /thịt\s*lợn/i, /nội\s*tạng/i, /phủ\s*tạng/i, /red\s*meat/i, /beef/i, /pork/i, /organ\s*meat/i, /purine/i],
  },
  {
    key: "food:salt-off",
    label: "Giảm muối & Hạn chế Natri",
    category: "Food & Nutrition",
    patterns: [/giảm\s*muối/i, /hạn\s*chế\s*mặn/i, /bớt\s*muối/i, /natri/i, /ít\s*muối/i, /low\s*sodium/i, /reduce\s*salt/i, /salt/i, /sodium/i],
  },
  {
    key: "food:sugar-off",
    label: "Giảm đường & Nước ngọt",
    category: "Food & Nutrition",
    patterns: [/giảm\s*đường/i, /bỏ\s*nước\s*ngọt/i, /nước\s*có\s*ga/i, /đồ\s*ngọt/i, /bớt\s*ngọt/i, /sugar/i, /soft\s*drinks?/i, /soda/i, /sweet/i],
  },
  {
    key: "food:vegetables",
    label: "Rau xanh & Chất xơ",
    category: "Food & Nutrition",
    patterns: [/rau\s*xanh/i, /rau\s*lá\s*xanh/i, /cải\s*bó\s*xôi/i, /súp\s*lơ/i, /rau\s*củ/i, /chất\s*xơ/i, /salad/i, /vegetables?/i, /greens?/i, /spinach/i, /broccoli/i, /fiber/i],
  },
  {
    key: "food:carrot",
    label: "Cà rốt & Củ quả",
    category: "Food & Nutrition",
    patterns: [/cà\s*rốt/i, /carrot/i, /root\s*vegetables?/i],
  },
  {
    key: "food:berries",
    label: "Quả mọng & Quả anh đào (Cherry)",
    category: "Food & Nutrition",
    patterns: [/quả\s*mọng/i, /anh\s*đào/i, /cherry/i, /việt\s*quất/i, /dâu\s*tây/i, /berries/i, /blueberr(y|ies)/i, /cherries/i],
  },
  {
    key: "food:apple",
    label: "Trái cây tươi",
    category: "Food & Nutrition",
    patterns: [/táo/i, /trái\s*cây/i, /hoa\s*quả/i, /quả\s*tươi/i, /apple/i, /fresh\s*fruits?/i],
  },
  {
    key: "food:egg",
    label: "Trứng & Đạm lành",
    category: "Food & Nutrition",
    patterns: [/trứng/i, /lòng\s*trắng/i, /egg/i, /boiled\s*egg/i],
  },
  {
    key: "food:beans",
    label: "Các loại đậu & Đậu phụ",
    category: "Food & Nutrition",
    patterns: [/đậu\s*phụ/i, /đậu\s*nành/i, /hạt\s*đậu/i, /đỗ/i, /beans?/i, /tofu/i, /legumes?/i, /lentils?/i],
  },
  {
    key: "food:dairy",
    label: "Sữa chua & Sữa ít béo",
    category: "Food & Nutrition",
    patterns: [/sữa\s*chua/i, /sữa\s*ít\s*béo/i, /phô\s*mai/i, /yogurt/i, /dairy/i, /milk/i],
  },
  {
    key: "food:hot-meal",
    label: "Bữa ăn dinh dưỡng cân bằng",
    category: "Food & Nutrition",
    patterns: [/bữa\s*ăn/i, /ăn\s*uống/i, /ăn\s*tối/i, /ăn\s*trưa/i, /dinh\s*dưỡng/i, /thực\s*đơn/i, /meal/i, /nutrition/i, /diet/i, /dinner/i, /lunch/i],
  },

  // --- 3. Yoga & Stretching ---
  {
    key: "yoga:lotus",
    label: "Yoga nhẹ nhàng",
    category: "Yoga & Stretching",
    patterns: [/yoga/i, /asana/i, /tư\s*thế\s*yoga/i, /hatha/i, /vinyasa/i],
  },
  {
    key: "yoga:stretching",
    label: "Kéo giãn cơ & Khớp",
    category: "Yoga & Stretching",
    patterns: [/kéo\s*giãn/i, /giãn\s*cơ/i, /uốn\s*dẻo/i, /vươn\s*vai/i, /duỗi\s*người/i, /stretch(ing)?/i, /flexibility/i],
  },

  // --- 4. Meditation & Breathing ---
  {
    key: "meditation:breathing",
    label: "Hít thở sâu & Điều hòa nhịp thở",
    category: "Meditation & Breathing",
    patterns: [/hít\s*thở/i, /thở\s*sâu/i, /thở\s*bụng/i, /4-?7-?8/i, /điều\s*hòa\s*nhịp\s*thở/i, /nhịp\s*thở/i, /deep\s*breath(ing)?/i, /inhale/i, /exhale/i, /respiration/i],
  },
  {
    key: "meditation:mindfulness",
    label: "Thiền chánh niệm & Tĩnh tâm",
    category: "Meditation & Breathing",
    patterns: [/thiền/i, /chánh\s*niệm/i, /tĩnh\s*tâm/i, /buông\s*thư/i, /thư\s*giãn\s*tâm\s*trí/i, /giải\s*tỏa\s*căng\s*thẳng/i, /giảm\s*stress/i, /mindful(ness)?/i, /meditat(e|ion)/i, /calm\s*mind/i],
  },
  {
    key: "meditation:bell",
    label: "Chuông chánh niệm",
    category: "Meditation & Breathing",
    patterns: [/chuông/i, /chuông\s*xoay/i, /mindfulness\s*bell/i],
  },

  // --- 5. Physical Activities ---
  {
    key: "physical:walking",
    label: "Đi bộ nhẹ nhàng",
    category: "Physical Activities",
    patterns: [/đi\s*bộ/i, /dạo\s*bộ/i, /tản\s*bộ/i, /bước\s*chân/i, /10\.?000\s*bước/i, /5\.?000\s*bước/i, /walk(ing)?/i, /stroll/i, /steps?/i],
  },
  {
    key: "physical:running",
    label: "Chạy bộ & Jogging",
    category: "Physical Activities",
    patterns: [/chạy\s*bộ/i, /chạy\s*chậm/i, /jogging/i, /run(ning)?/i],
  },
  {
    key: "physical:cycling",
    label: "Đạp xe rèn luyện",
    category: "Physical Activities",
    patterns: [/đạp\s*xe/i, /xe\s*đạp/i, /cycl(e|ing)/i, /bicycle/i, /bike/i],
  },
  {
    key: "physical:swimming",
    label: "Bơi lội thể thao",
    category: "Physical Activities",
    patterns: [/bơi\s*lội/i, /đi\s*bơi/i, /swim(ming)?/i],
  },
  {
    key: "physical:stairs",
    label: "Leo cầu thang",
    category: "Physical Activities",
    patterns: [/cầu\s*thang/i, /leo\s*thang/i, /stairs?/i],
  },
  {
    key: "physical:strength",
    label: "Tập thể lực & Kháng lực",
    category: "Physical Activities",
    patterns: [/tập\s*tạ/i, /kháng\s*lực/i, /thể\s*lực/i, /hít\s*đất/i, /chống\s*đẩy/i, /squat/i, /gym/i, /strength/i, /weights?/i, /push-?ups?/i],
  },
  {
    key: "physical:exercise",
    label: "Vận động thể chất",
    category: "Physical Activities",
    patterns: [/vận\s*động/i, /thể\s*dục/i, /tập\s*luyện/i, /hoạt\s*động\s*thể\s*chất/i, /exercise/i, /workout/i, /physical\s*activity/i],
  },

  // --- 6. Hydration ---
  {
    key: "hydration:glass",
    label: "Uống đủ nước lọc",
    category: "Hydration",
    patterns: [/uống\s*nước/i, /cốc\s*nước/i, /ly\s*nước/i, /nước\s*lọc/i, /2\s*lít/i, /1\.5\s*lít/i, /8\s*ly/i, /500\s*ml/i, /drink\s*water/i, /glass\s*of\s*water/i, /hydration/i],
  },
  {
    key: "hydration:bottle",
    label: "Bình nước cá nhân",
    category: "Hydration",
    patterns: [/bình\s*nước/i, /mang\s*nước/i, /water\s*bottle/i],
  },
  {
    key: "hydration:droplet",
    label: "Bù nước & Cấp ẩm",
    category: "Hydration",
    patterns: [/cấp\s*nước/i, /bù\s*nước/i, /đủ\s*nước/i, /hydrate/i, /hydration\s*level/i],
  },

  // --- 8. Specific Daily Behavioral Habits (Screen off, Journaling, Sunlight, Alcohol) ---
  {
    key: "habits:journaling",
    label: "Viết nhật ký & Ghi chép",
    category: "Daily Habits",
    patterns: [/nhật\s*ký/i, /ghi\s*chép/i, /viết\s*sổ/i, /ghi\s*chú/i, /journal(ing)?/i, /diary/i, /write\s*notes?/i],
  },
  {
    key: "habits:screen-off",
    label: "Hạn chế màn hình & Ánh sáng xanh",
    category: "Daily Habits",
    patterns: [/tắt\s*màn\s*hình/i, /hạn\s*chế\s*điện\s*thoại/i, /tắt\s*máy\s*tính/i, /ánh\s*sáng\s*xanh/i, /rời\s*màn\s*hình/i, /screen\s*time/i, /blue\s*light/i, /digital\s*detox/i, /phone\s*off/i],
  },
  {
    key: "habits:sunlight",
    label: "Đón ánh nắng sáng sớm",
    category: "Daily Habits",
    patterns: [/tắm\s*nắng/i, /ánh\s*nắng/i, /nắng\s*sáng/i, /tiếp\s*xúc\s*ánh\s*sáng/i, /vitamin\s*d/i, /sunlight/i, /morning\s*sun/i, /daylight/i],
  },
  {
    key: "habits:alcohol-cessation",
    label: "Hạn chế đồ uống có cồn",
    category: "Daily Habits",
    patterns: [/rượu/i, /bia/i, /đồ\s*uống\s*có\s*cồn/i, /hạn\s*chế\s*bia\s*rượu/i, /alcohol/i, /beer/i, /wine/i],
  },

  // --- 7. Sleep & Relaxation ---
  {
    key: "sleep:routine",
    label: "Lịch trình giấc ngủ cố định",
    category: "Sleep & Relaxation",
    patterns: [/giờ\s*ngủ\s*cố\s*định/i, /ngủ\s*đúng\s*giờ/i, /thức\s*dậy\s*đúng\s*giờ/i, /chu\s*kỳ\s*ngủ/i, /lịch\s*sinh\s*học/i, /bedtime\s*routine/i, /sleep\s*schedule/i, /circadian/i],
  },
  {
    key: "sleep:bed",
    label: "Không gian phòng ngủ thư thái",
    category: "Sleep & Relaxation",
    patterns: [/phòng\s*ngủ/i, /giường\s*ngủ/i, /nằm\s*thư\s*giãn/i, /bed/i, /bedroom/i],
  },
  {
    key: "sleep:moon-stars",
    label: "Giấc ngủ trăng sao êm ái",
    category: "Sleep & Relaxation",
    patterns: [/giấc\s*ngủ/i, /ngủ\s*sâu/i, /ngủ\s*ngon/i, /chất\s*lượng\s*ngủ/i, /buổi\s*tối/i, /ban\s*đêm/i, /sleep/i, /restful\s*sleep/i, /deep\s*sleep/i, /insomnia/i, /night/i],
  },

  // --- Other Daily Habits ---
  {
    key: "habits:checklist",
    label: "Duy trì danh sách thói quen",
    category: "Daily Habits",
    patterns: [/thói\s*quen/i, /hàng\s*ngày/i, /danh\s*sách/i, /kiên\s*trì/i, /habits?/i, /routine/i, /daily\s*checklist/i],
  },

  // --- 9. Knowledge & Learning ---
  {
    key: "knowledge:book",
    label: "Đọc cẩm nang & Nghiên cứu",
    category: "Knowledge & Learning",
    patterns: [/đọc\s*sách/i, /cẩm\s*nang/i, /tài\s*liệu/i, /tri\s*thức/i, /học\s*hỏi/i, /read(ing)?/i, /study/i, /book/i],
  },
  {
    key: "knowledge:bulb",
    label: "Khám phá manh mối sức khỏe",
    category: "Knowledge & Learning",
    patterns: [/khám\s*phá/i, /manh\s*mối/i, /tìm\s*hiểu/i, /mẹo/i, /clues?/i, /learn(ing)?/i, /insight/i],
  },
];

/**
 * Category fallback mapping if no specific phrase matched
 */
const CATEGORY_FALLBACKS: Record<string, { key: GameIconSemanticKey; label: string; category: WellnessCategory }> = {
  nutrition: { key: "food:hot-meal", label: "Dinh dưỡng", category: "Food & Nutrition" },
  food: { key: "food:hot-meal", label: "Dinh dưỡng", category: "Food & Nutrition" },
  diet: { key: "food:hot-meal", label: "Dinh dưỡng", category: "Food & Nutrition" },
  sleep: { key: "sleep:moon-stars", label: "Giấc ngủ", category: "Sleep & Relaxation" },
  movement: { key: "physical:walking", label: "Vận động", category: "Physical Activities" },
  activity: { key: "physical:exercise", label: "Vận động", category: "Physical Activities" },
  exercise: { key: "physical:exercise", label: "Vận động", category: "Physical Activities" },
  practices: { key: "meditation:mindfulness", label: "Chánh niệm", category: "Meditation & Breathing" },
  mind: { key: "meditation:mindfulness", label: "Chánh niệm", category: "Meditation & Breathing" },
  hydration: { key: "hydration:glass", label: "Cấp nước", category: "Hydration" },
  water: { key: "hydration:glass", label: "Cấp nước", category: "Hydration" },
  habits: { key: "habits:checklist", label: "Thói quen", category: "Daily Habits" },
  lifestyle: { key: "habits:checklist", label: "Thói quen", category: "Daily Habits" },
  knowledge: { key: "knowledge:book", label: "Tri thức", category: "Knowledge & Learning" },
};

/**
 * Universally resolve any arbitrary AI-generated wellness goal, suggestion, or user text
 * to an accurate, vetted semantic game icon.
 */
export function resolveWellnessIcon(input: {
  title?: string;
  action?: string;
  category?: string;
  topic?: string;
  tags?: string[];
  text?: string;
  description?: string;
}): ResolvedWellnessIcon {
  // Combine all input fragments into one searchable string
  const combined = [
    input.title || "",
    input.action || "",
    input.topic || "",
    input.text || "",
    input.description || "",
    Array.isArray(input.tags) ? input.tags.join(" ") : "",
  ].join(" ").trim();

  // Tier 1: Match against specific semantic rules
  if (combined) {
    for (const rule of MATCH_RULES) {
      for (const pattern of rule.patterns) {
        if (pattern.test(combined)) {
          // Double-check asset exists in registry
          if (rule.key in GAME_ICON_REGISTRY) {
            return {
              key: rule.key,
              aiHabitKey: toAiHabitIconKey(rule.key) || "quests.target",
              label: rule.label,
              category: rule.category,
              matchedBy: "phrase",
              keywordFound: pattern.source,
            };
          }
        }
      }
    }
  }

  // Tier 2: Match against category fallback
  const rawCat = (input.category || "").toLowerCase().trim();
  if (rawCat && rawCat in CATEGORY_FALLBACKS) {
    const fallback = CATEGORY_FALLBACKS[rawCat];
    return {
      key: fallback.key,
      aiHabitKey: toAiHabitIconKey(fallback.key) || "quests.target",
      label: fallback.label,
      category: fallback.category,
      matchedBy: "category_fallback",
      keywordFound: rawCat,
    };
  }

  // Tier 3: Universal safe neutral icon (Bia mục tiêu thành tựu)
  return {
    key: "quests:target",
    aiHabitKey: "quests.target",
    label: "Mục tiêu phiêu lưu",
    category: "Quests & Achievements",
    matchedBy: "default",
  };
}

export function resolveWellnessIconKey(input: Parameters<typeof resolveWellnessIcon>[0]): GameIconSemanticKey {
  return resolveWellnessIcon(input).key;
}

/**
 * Validate and resolve the icon for an AI-generated goal or user-authored goal.
 * Fulfills Master Prompt requirements:
 * 1. If Gemini returns a valid `icon_key` (from VALID_AI_HABIT_ICON_KEYS or registry), accept it directly.
 * 2. If invalid or missing, fallback to category fallback icon.
 * 3. If category is missing or invalid, fallback to semantic matching on goal text.
 * 4. Fallback to universal neutral icon (quests.target).
 * 0 runtime image generation, 0 external network requests, 0 broken images.
 */
export function validateAndResolveGoalIcon(goal: {
  icon_key?: string | null;
  iconKey?: string | null;
  category?: string | null;
  title?: { en?: string; vi?: string } | string;
  relevanceReason?: { en?: string; vi?: string } | string;
  optionA?: { action?: { en?: string; vi?: string } | string; title?: { en?: string; vi?: string } | string };
  optionB?: { action?: { en?: string; vi?: string } | string; title?: { en?: string; vi?: string } | string };
  profile?: unknown;
}): {
  iconKey: ValidAiHabitIconKey;
  aiHabitKey: ValidAiHabitIconKey;
  category: string;
  source: "direct_ai_key" | "category_fallback" | "semantic_text" | "universal_fallback";
  matchedBy: "direct_ai_key" | "category_fallback" | "semantic_text" | "universal_fallback";
} {
  // 1. Direct validation of AI-provided icon_key
  const rawKey = goal.icon_key || goal.iconKey;
  const directKey = toAiHabitIconKey(rawKey);
  if (directKey) {
    return {
      iconKey: directKey,
      aiHabitKey: directKey,
      category: goal.category || "wellness",
      source: "direct_ai_key",
      matchedBy: "direct_ai_key",
    };
  }

  // 2. Category Fallback
  const rawCategory = (goal.category || "").toLowerCase().trim();
  if (rawCategory && rawCategory in AI_CATEGORY_FALLBACK_ICONS) {
    const catFallback = AI_CATEGORY_FALLBACK_ICONS[rawCategory];
    return {
      iconKey: catFallback,
      aiHabitKey: catFallback,
      category: goal.category || "wellness",
      source: "category_fallback",
      matchedBy: "category_fallback",
    };
  }

  // 3. Semantic Text Resolution
  const extractText = (val: unknown): string => {
    if (!val) return "";
    if (typeof val === "string") return val;
    if (typeof val === "object") {
      const obj = val as Record<string, unknown>;
      return [obj.en || "", obj.vi || ""].join(" ");
    }
    return "";
  };
  const textBody = [
    extractText(goal.title),
    extractText(goal.relevanceReason),
    extractText(goal.optionA?.action),
    extractText(goal.optionB?.action),
  ].join(" ").trim();

  if (textBody) {
    const resolved = resolveWellnessIcon({ text: textBody, category: goal.category || undefined });
    if (resolved.matchedBy !== "default") {
      const key = resolved.aiHabitKey || toAiHabitIconKey(resolved.key) || UNIVERSAL_AI_FALLBACK_ICON;
      return {
        iconKey: key,
        aiHabitKey: key,
        category: goal.category || resolved.category,
        source: "semantic_text",
        matchedBy: "semantic_text",
      };
    }
  }

  // 4. Universal Fallback
  return {
    iconKey: UNIVERSAL_AI_FALLBACK_ICON,
    aiHabitKey: UNIVERSAL_AI_FALLBACK_ICON,
    category: goal.category || "general routine",
    source: "universal_fallback",
    matchedBy: "universal_fallback",
  };
}
