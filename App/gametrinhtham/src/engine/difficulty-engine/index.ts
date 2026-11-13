import type { CaseDifficultyInfo, CaseDifficultyLevel } from "../../types";

export const DIFFICULTY_TIERS: Record<CaseDifficultyLevel, CaseDifficultyInfo> = {
  1: {
    level: 1,
    name: "Tập sự (Apprentice)",
    badge: "🌱",
    description: "Một hiện trường, 3-4 manh mối cơ bản, câu chuyện rõ ràng, 1 bước suy luận có Luna hướng dẫn trực quan.",
    estimatedMinutes: "2-3 phút",
    maxScenes: 1,
    hasMisdirection: false,
    hasContradiction: false,
    color: "#10b981", // Emerald
  },
  2: {
    level: 2,
    name: "Khám phá (Explorer)",
    badge: "🔍",
    description: "Nhiều manh mối hơn, có chi tiết gây hiểu nhầm, cần đối chiếu dòng thời gian (timeline) và nguồn dữ liệu.",
    estimatedMinutes: "4-6 phút",
    maxScenes: 1,
    hasMisdirection: true,
    hasContradiction: true,
    color: "#3b82f6", // Blue
  },
  3: {
    level: 3,
    name: "Điều tra viên (Detective)",
    badge: "🕵️",
    description: "Nhiều giả thuyết cạnh tranh, thông tin nhiễu, đối chiếu lời khai nhân chứng, tình tiết đảo chiều (revelation).",
    estimatedMinutes: "7-10 phút",
    maxScenes: 2,
    hasMisdirection: true,
    hasContradiction: true,
    color: "#8b5cf6", // Purple
  },
  4: {
    level: 4,
    name: "Chuyên gia (Inspector)",
    badge: "🎖️",
    description: "Nhiều hiện trường, lời khai mâu thuẫn, phân định rõ chứng cứ xác thực vs nhận định chủ quan, bảng suy luận nhiều bước.",
    estimatedMinutes: "10-15 phút",
    maxScenes: 3,
    hasMisdirection: true,
    hasContradiction: true,
    color: "#f59e0b", // Amber
  },
  5: {
    level: 5,
    name: "Bậc thầy bí ẩn (Master Sleuth)",
    badge: "👑",
    description: "Đại án nhiều chương, phức hợp nhiều yếu tố bệnh lý, giả thuyết cạnh tranh gay gắt, kết luận khoa học đa nhân tố.",
    estimatedMinutes: "15-20 phút",
    maxScenes: 4,
    hasMisdirection: true,
    hasContradiction: true,
    color: "#ef4444", // Rose/Red
  },
};

export function getDifficultyInfo(level: CaseDifficultyLevel): CaseDifficultyInfo {
  return DIFFICULTY_TIERS[level] || DIFFICULTY_TIERS[1];
}

export function validateCaseDifficulty(
  level: CaseDifficultyLevel,
  cluesCount: number,
  scenesCount: number,
  hasMisdirection: boolean
): { isValid: boolean; warnings: string[] } {
  const tier = getDifficultyInfo(level);
  const warnings: string[] = [];

  if (scenesCount > tier.maxScenes) {
    warnings.push(`Cấp độ ${tier.name} khuyến nghị tối đa ${tier.maxScenes} hiện trường (hiện có ${scenesCount}).`);
  }

  if (level === 1 && hasMisdirection) {
    warnings.push("Cấp độ 1 (Tập sự) không nên có tình tiết đánh lạc hướng để người mới dễ làm quen.");
  }

  if (level >= 2 && !hasMisdirection) {
    warnings.push(`Cấp độ ${level} nên có ít nhất một chi tiết đánh lạc hướng (misdirection) để tăng chiều sâu suy luận.`);
  }

  return {
    isValid: warnings.length === 0,
    warnings,
  };
}
