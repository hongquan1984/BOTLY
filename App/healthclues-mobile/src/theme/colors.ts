/**
 * HealthClues Mobile Palette — Premium Cozy Fantasy RPG
 */
export const colors = {
  // Brand Backgrounds
  background: "#081311",       // Sâu thẳm rừng đêm
  surface: "#0f231f",          // Bề mặt thẻ / card nền
  surfaceSubtle: "#16332d",    // Thẻ lồng bên trong
  surfaceHighlight: "#1f453d", // Hover / active state

  // Fantasy Accents
  emerald: "#10b981",          // Sống khỏe / Sinh mệnh
  emeraldLight: "#34d399",     // Điểm nhấn ngọc lục bảo
  emeraldDark: "#065f46",      // Viền ngọc lục bảo

  gold: "#f59e0b",             // EXP / Vàng thần thoại
  goldLight: "#fbbf24",        // Sao / Thưởng lấp lánh
  goldDark: "#b45309",         // Viền đồng vàng

  amethyst: "#8b5cf6",         // Kỳ bí / Cổ vật / Phép thuật
  amethystLight: "#a78bfa",
  amethystDark: "#5b21b6",

  sky: "#38bdf8",              // Nước / Hồi phục năng lượng
  skyDark: "#0369a1",

  rose: "#f43f5e",             // Trái tim / Cảnh báo / Nguy cơ
  roseDark: "#9f1239",

  // Text Hierarchy
  textPrimary: "#f3f4f6",      // Chữ sáng chính (95% trắng)
  textSecondary: "#9ca3af",    // Chữ phụ / mô tả
  textMuted: "#6b7280",        // Chữ mờ / placeholder
  textGold: "#fde68a",         // Chữ vàng vinh danh
  textEmerald: "#6ee7b7",      // Chữ xanh trị liệu

  // Borders & Dividers
  border: "#1f3b34",           // Đường kẻ thanh lịch
  borderLight: "#2d5248",
  borderGold: "rgba(245, 158, 11, 0.4)",
  borderEmerald: "rgba(16, 185, 129, 0.4)",

  // RPG Badges & Statuses
  done: "#10b981",
  notYet: "#6b7280",
  skipped: "#9ca3af",
  unsure: "#f59e0b",
} as const;

export type ColorName = keyof typeof colors;
