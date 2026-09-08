import type { WellnessLocale } from "./wellness";

export type WellnessGoal = "weight" | "stress" | "meditation" | "sleep";
export type DietStyle = "balanced" | "vegetarian" | "high-protein";

export type WellnessProfile = {
  goal: WellnessGoal;
  minutes: number;
  diet: DietStyle;
  locale: WellnessLocale;
  createdAt: string;
};

export type PlanDay = {
  day: number;
  title: string;
  nourish: string;
  calm: string;
  mindful: string;
};
export type SavedWellnessPlan = { profile: WellnessProfile; days: PlanDay[]; completed: string[] } | null;

const enMeals = {
  balanced: ["Build one balanced plate", "Add one extra serving of vegetables", "Plan tomorrow's breakfast", "Eat one meal without a screen", "Choose water with lunch", "Cook one simple whole-food meal", "Review what felt satisfying"],
  vegetarian: ["Pair beans or tofu with a whole grain", "Add two colors of vegetables", "Choose a protein-rich breakfast", "Try a lentil or tofu lunch", "Add nuts or seeds to a meal", "Prepare a simple vegetable dinner", "Review your protein sources"],
  "high-protein": ["Include protein at breakfast", "Build lunch around a palm-sized protein", "Pair yogurt or tofu with fruit", "Add protein and vegetables to dinner", "Prepare a protein-rich snack", "Cook a simple protein-based meal", "Notice which meal kept you satisfied"],
};
const viMeals = {
  balanced: ["Tạo một đĩa ăn cân bằng", "Thêm một phần rau", "Chuẩn bị bữa sáng ngày mai", "Ăn một bữa không nhìn màn hình", "Chọn nước lọc cùng bữa trưa", "Nấu một bữa đơn giản từ thực phẩm nguyên bản", "Xem lại bữa nào tạo cảm giác vừa đủ"],
  vegetarian: ["Kết hợp đậu phụ hoặc các loại đậu với ngũ cốc", "Thêm hai màu rau", "Chọn bữa sáng giàu đạm", "Thử bữa trưa với đậu", "Thêm hạt vào một bữa", "Chuẩn bị bữa tối nhiều rau", "Xem lại các nguồn đạm trong tuần"],
  "high-protein": ["Bổ sung đạm vào bữa sáng", "Xây bữa trưa quanh một phần đạm", "Kết hợp sữa chua hoặc đậu phụ với trái cây", "Thêm đạm và rau vào bữa tối", "Chuẩn bị bữa phụ giàu đạm", "Nấu một bữa đơn giản có nguồn đạm chính", "Nhận biết bữa nào giúp no lâu"],
};

export function buildWellnessPlan(profile: WellnessProfile): PlanDay[] {
  const vi = profile.locale === "vi";
  const meals = (vi ? viMeals : enMeals)[profile.diet];
  const titles = vi ? ["Bắt đầu nhẹ nhàng", "Tạo nhịp", "Giữ mọi thứ đơn giản", "Dừng và nhận biết", "Tiếp tục", "Nuôi dưỡng", "Nhìn lại"] : ["Begin gently", "Find a rhythm", "Keep it simple", "Pause and notice", "Continue", "Nourish", "Reflect"];
  const calm = vi ? ["Thở chậm 60 giây", "Đi bộ nhẹ 10 phút", "Thu nhỏ danh sách việc cần làm", "Check-in mức stress 1–5", "Nghỉ khỏi màn hình 5 phút", "Thả lỏng vai và hàm", "Ghi lại điều đã giúp bạn"] : ["Breathe slowly for 60 seconds", "Take a gentle 10-minute walk", "Make your task list smaller", "Check in with stress from 1–5", "Take a 5-minute screen break", "Soften your shoulders and jaw", "Write down what helped"];
  const mindful = vi ? ["Thiền 3 phút", "Chú ý ba âm thanh", "Ăn ba miếng thật chậm", "Gọi tên cảm xúc hiện tại", "Thiền theo hơi thở", "Ghi một điều biết ơn", "Thiền và nhìn lại tuần"] : ["Meditate for 3 minutes", "Notice three sounds", "Eat three bites very slowly", "Name the emotion present", "Use the breathing meditation", "Note one thing you appreciate", "Meditate and review the week"];
  return titles.map((title, index) => ({ day: index + 1, title, nourish: meals[index], calm: calm[index], mindful: mindful[index] }));
}
