import type { WellnessLocale } from "./wellness";

export type EvidenceLevel = "supported" | "promising" | "limited";

export type WellnessArticle = {
  locale: WellnessLocale;
  slug: string;
  translationSlug?: string;
  pillar: "nourish" | "calm" | "mindful";
  eyebrow: string;
  title: string;
  description: string;
  readTime: string;
  reviewedAt: string;
  evidence: EvidenceLevel;
  takeaway: string;
  sections: { title: string; paragraphs: string[]; bullets?: string[] }[];
  sources: { label: string; url: string }[];
  tool: "calorie-needs" | "stress-check" | "meditation-timer" | "food-combinations" | "remedy-checker";
};

export const wellnessArticles: WellnessArticle[] = [
  {
    locale: "en", slug: "balanced-plate-simple", translationSlug: "dia-an-can-bang",
    pillar: "nourish", eyebrow: "NOURISH", title: "A balanced plate that keeps healthy eating simple",
    description: "A flexible visual method for building satisfying meals without turning every bite into a calculation.",
    readTime: "6 min read", reviewedAt: "August 2026", evidence: "supported",
    takeaway: "Build most meals around vegetables or fruit, a protein source, a satisfying carbohydrate and a little healthy fat.",
    sections: [
      { title: "Think in proportions, not perfection", paragraphs: ["A plate guide is a visual prompt, not a rigid prescription. It can make everyday choices easier while leaving room for culture, appetite and the foods available to you."], bullets: ["About half vegetables or fruit", "About one quarter protein-rich food", "About one quarter grains or another carbohydrate", "Add a modest source of healthy fat"] },
      { title: "Why this can help with weight goals", paragraphs: ["Meals containing protein, fiber-rich foods and appropriate portions tend to be more satisfying. Sustainable weight change still depends on your overall pattern, needs and circumstances—not one perfect plate."] },
      { title: "Make it yours", paragraphs: ["A Vietnamese rice meal, a grain bowl, soup with sides or a sandwich can all follow the same idea. Use the pattern as a check, then adjust for hunger, activity and medical needs."] },
    ],
    sources: [{ label: "Harvard T.H. Chan School of Public Health – Healthy Eating Plate", url: "https://www.hsph.harvard.edu/nutritionsource/healthy-eating-plate/" }], tool: "food-combinations",
  },
  {
    locale: "vi", slug: "dia-an-can-bang", translationSlug: "balanced-plate-simple",
    pillar: "nourish", eyebrow: "DINH DƯỠNG", title: "Một đĩa ăn cân bằng để việc ăn khỏe trở nên đơn giản",
    description: "Cách hình dung linh hoạt giúp xây bữa ăn đủ chất mà không phải biến mọi miếng ăn thành phép tính.",
    readTime: "Đọc 6 phút", reviewedAt: "Tháng 8/2026", evidence: "supported",
    takeaway: "Phần lớn bữa ăn gồm rau hoặc trái cây, một nguồn đạm, tinh bột phù hợp và một lượng nhỏ chất béo tốt.",
    sections: [
      { title: "Nghĩ theo tỷ lệ, không đòi hỏi hoàn hảo", paragraphs: ["Đĩa ăn cân bằng là gợi ý trực quan, không phải đơn thuốc cứng nhắc. Bạn vẫn có thể điều chỉnh theo văn hóa, khẩu vị và nguyên liệu sẵn có."], bullets: ["Khoảng một nửa là rau hoặc trái cây", "Khoảng một phần tư là thực phẩm giàu đạm", "Khoảng một phần tư là ngũ cốc hoặc tinh bột", "Thêm lượng vừa phải chất béo tốt"] },
      { title: "Liên quan gì đến mục tiêu cân nặng?", paragraphs: ["Bữa ăn có đạm, chất xơ và khẩu phần phù hợp thường tạo cảm giác no tốt hơn. Thay đổi cân nặng bền vững vẫn phụ thuộc tổng thể thói quen và nhu cầu cá nhân."] },
      { title: "Áp dụng vào bữa cơm Việt", paragraphs: ["Cơm, món mặn, canh và rau vẫn có thể theo nguyên tắc này. Hãy xem đây là bước kiểm tra nhanh rồi điều chỉnh theo đói no, vận động và tình trạng sức khỏe."] },
    ],
    sources: [{ label: "Harvard T.H. Chan – Healthy Eating Plate", url: "https://www.hsph.harvard.edu/nutritionsource/healthy-eating-plate/" }], tool: "food-combinations",
  },
  {
    locale: "en", slug: "three-minute-stress-reset", translationSlug: "ba-phut-giam-tai",
    pillar: "calm", eyebrow: "CALM", title: "A three-minute reset for an overloaded afternoon",
    description: "A short pause to notice tension, slow the breath and choose one manageable next action.",
    readTime: "3 min practice", reviewedAt: "August 2026", evidence: "promising",
    takeaway: "A brief breathing pause will not remove the cause of stress, but it can create enough space to choose your next step more clearly.",
    sections: [
      { title: "Minute one: arrive", paragraphs: ["Put both feet down if comfortable. Notice three things you can see and two sounds you can hear. You do not need to force yourself to feel calm."] },
      { title: "Minute two: soften the exhale", paragraphs: ["Breathe normally and let each exhale become slightly slower. Stop if deliberate breathing makes you dizzy or uncomfortable."] },
      { title: "Minute three: make the next step smaller", paragraphs: ["Ask: what is one useful action I can complete in ten minutes? Write it down and let the rest wait."] },
    ],
    sources: [{ label: "NCCIH – Stress and relaxation approaches", url: "https://www.nccih.nih.gov/health/stress" }], tool: "stress-check",
  },
  {
    locale: "vi", slug: "ba-phut-giam-tai", translationSlug: "three-minute-stress-reset",
    pillar: "calm", eyebrow: "THƯ GIÃN", title: "Ba phút cân bằng lại một buổi chiều quá tải",
    description: "Một khoảng dừng ngắn để nhận biết căng thẳng, làm chậm hơi thở và chọn một việc vừa sức.",
    readTime: "Thực hành 3 phút", reviewedAt: "Tháng 8/2026", evidence: "promising",
    takeaway: "Khoảng thở ngắn không xóa nguyên nhân gây stress, nhưng có thể tạo không gian để bạn chọn bước tiếp theo rõ ràng hơn.",
    sections: [
      { title: "Phút một: có mặt", paragraphs: ["Đặt hai chân xuống sàn nếu thấy thoải mái. Nhận biết ba thứ bạn nhìn thấy và hai âm thanh bạn nghe được. Không cần ép mình phải bình tĩnh ngay."] },
      { title: "Phút hai: thở ra chậm hơn", paragraphs: ["Thở tự nhiên và để mỗi lần thở ra chậm hơn một chút. Dừng nếu việc điều khiển hơi thở khiến bạn chóng mặt hoặc khó chịu."] },
      { title: "Phút ba: thu nhỏ bước tiếp theo", paragraphs: ["Tự hỏi: việc hữu ích nào mình có thể hoàn thành trong mười phút? Viết nó xuống và tạm để những việc khác chờ."] },
    ],
    sources: [{ label: "NCCIH – Stress và các phương pháp thư giãn", url: "https://www.nccih.nih.gov/health/stress" }], tool: "stress-check",
  },
  {
    locale: "en", slug: "meditation-for-restless-beginners", translationSlug: "thien-cho-nguoi-moi",
    pillar: "mindful", eyebrow: "MINDFUL", title: "Meditation for beginners who think they cannot meditate",
    description: "Your mind does not need to become blank. The practice is simply noticing and returning.",
    readTime: "5 min read", reviewedAt: "August 2026", evidence: "promising",
    takeaway: "Distraction is not failure. Noticing that your attention wandered is the moment of practice.",
    sections: [
      { title: "Start smaller than you think", paragraphs: ["Choose three minutes. Sit, stand or lie down in a position that feels safe. Let your attention rest on breathing, sound or contact with the floor."] },
      { title: "The return is the practice", paragraphs: ["Thoughts will appear. When you notice, quietly name it as thinking and return to your chosen anchor. Repeat without scoring the session."] },
      { title: "Know when to pause", paragraphs: ["Meditation is usually low risk, but some people report difficult experiences. Stop and seek appropriate support if practice consistently increases distress."] },
    ],
    sources: [{ label: "NCCIH – Meditation effectiveness and safety", url: "https://www.nccih.nih.gov/health/meditation-and-mindfulness-effectiveness-and-safety" }], tool: "meditation-timer",
  },
  {
    locale: "vi", slug: "thien-cho-nguoi-moi", translationSlug: "meditation-for-restless-beginners",
    pillar: "mindful", eyebrow: "CHÁNH NIỆM", title: "Thiền cho người mới luôn nghĩ rằng mình không thể thiền",
    description: "Tâm trí không cần hoàn toàn trống rỗng. Thực hành đơn giản là nhận biết rồi quay lại.",
    readTime: "Đọc 5 phút", reviewedAt: "Tháng 8/2026", evidence: "promising",
    takeaway: "Xao nhãng không phải thất bại. Khoảnh khắc nhận ra tâm trí đi đâu chính là lúc bạn đang thực hành.",
    sections: [
      { title: "Bắt đầu ngắn hơn bạn nghĩ", paragraphs: ["Chọn ba phút. Ngồi, đứng hoặc nằm ở tư thế an toàn, thoải mái. Đặt sự chú ý vào hơi thở, âm thanh hoặc cảm giác tiếp xúc với sàn."] },
      { title: "Quay lại chính là thực hành", paragraphs: ["Suy nghĩ sẽ xuất hiện. Khi nhận ra, nhẹ nhàng ghi nhận đó là suy nghĩ rồi quay về điểm tập trung đã chọn. Không cần chấm điểm buổi thiền."] },
      { title: "Biết khi nào nên dừng", paragraphs: ["Thiền thường có ít rủi ro nhưng một số người có trải nghiệm khó chịu. Hãy dừng và tìm hỗ trợ phù hợp nếu thực hành liên tục làm tăng bất an."] },
    ],
    sources: [{ label: "NCCIH – Hiệu quả và an toàn của thiền", url: "https://www.nccih.nih.gov/health/meditation-and-mindfulness-effectiveness-and-safety" }], tool: "meditation-timer",
  },
];

export function getArticle(locale: WellnessLocale, slug: string) {
  return wellnessArticles.find((article) => article.locale === locale && article.slug === slug);
}
