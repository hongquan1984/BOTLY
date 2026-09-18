import type { WellnessLocale } from "./wellness";

export type EbookStatus = "available" | "in_development";

export interface WellnessEbook {
  id: string;
  volume: string;
  status: EbookStatus;
  pillar: "nourish" | "calm" | "mindful";
  categoryEn: string;
  categoryVi: string;
  titleEn: string;
  titleVi: string;
  subtitleEn: string;
  subtitleVi: string;
  descriptionEn: string;
  descriptionVi: string;
  coverImage: string;
  pdfUrl?: string;
  pages: number;
  pairingsCount: number;
  citationsCount: number;
  slugEn: string;
  slugVi: string;
  featuredPairingsEn: string[];
  featuredPairingsVi: string[];
}

export const wellnessEbooks: WellnessEbook[] = [
  {
    id: "blood-sugar",
    volume: "VOL. 01",
    status: "available",
    pillar: "nourish",
    categoryEn: "Blood Sugar & Glucose",
    categoryVi: "Đường Huyết & Glucose",
    titleEn: "Blood Sugar & Everyday Pairings",
    titleVi: "Đường Huyết & Bữa Ăn Hàng Ngày",
    subtitleEn: "What food combinations can teach us about glucose, fibre and the science of a meal",
    subtitleVi: "Sự thật về glucose, chất xơ và khoa học sắp đặt một đĩa ăn",
    descriptionEn: "Four familiar food pairings tested in human crossover trials. How changing the proportions of rice, lentils, oats, and beans alters acute glucose and insulin curves.",
    descriptionVi: "Bốn cặp thực phẩm quen thuộc được thử nghiệm đối chứng ngẫu nhiên trên người. Cách thay đổi tỷ lệ cơm, đậu lăng, yến mạch và đậu hầm giúp làm phẳng đỉnh đường huyết sau ăn.",
    coverImage: "/ebooks/blood-sugar/lentils-rice-hero.png",
    pdfUrl: "/ebooks/blood-sugar/healthclues-blood-sugar-guide.pdf",
    pages: 11,
    pairingsCount: 4,
    citationsCount: 15,
    slugEn: "blood-sugar-pairings",
    slugVi: "duong-huyet",
    featuredPairingsEn: ["Lentils + Rice", "Oats + Berries", "Onion + Honey (Myth-check)", "Beans + Toast"],
    featuredPairingsVi: ["Đậu lăng + Cơm trắng", "Yến mạch + Quả mọng", "Hành tây + Mật ong (Kiểm chứng)", "Đậu hầm + Bánh mì"]
  },
  {
    id: "antioxidants",
    volume: "VOL. 02",
    status: "available",
    pillar: "nourish",
    categoryEn: "Antioxidants & Cellular Health",
    categoryVi: "Chất Chống Oxy Hóa & Tế Bào",
    titleEn: "Antioxidants on the Plate",
    titleVi: "Chất Chống Oxy Hóa Trên Đĩa Ăn",
    subtitleEn: "Everyday food combinations, compounds and what human research actually says",
    subtitleVi: "Các cặp thực phẩm hàng ngày, hoạt chất tự nhiên và những gì nghiên cứu thực sự chứng minh",
    descriptionEn: "Six everyday pairings: how dietary fats enhance carotenoid absorption (tomatoes, carrots, avocado), catechin gastric dynamics in green tea, and the evidence boundaries around fermentation.",
    descriptionVi: "Sáu cặp thực phẩm quen thuộc: cách chất béo tốt tăng hấp thu carotenoid (cà chua, cà rốt, bơ), độ ổn định catechin của trà xanh và ranh giới khoa học của thực phẩm lên men.",
    coverImage: "/ebooks/antioxidants/tomato-olive-oil-hero.png",
    pdfUrl: "/ebooks/antioxidants/healthclues-antioxidant-guide.pdf",
    pages: 14,
    pairingsCount: 6,
    citationsCount: 18,
    slugEn: "antioxidants-on-the-plate",
    slugVi: "chat-chong-oxy-hoa",
    featuredPairingsEn: ["Tomato + Olive Oil", "Avocado + Tomato", "Broccoli + Olive Oil", "Carrot + Hummus", "Green Tea + Citrus", "Kimchi + Rice"],
    featuredPairingsVi: ["Cà chua + Dầu ô liu", "Quả bơ + Cà chua", "Bông cải + Dầu ô liu", "Cà rốt + Sốt Hummus", "Trà xanh + Cam chanh", "Kim chi + Cơm"]
  },
  {
    id: "weight-management",
    volume: "VOL. 03",
    status: "in_development",
    pillar: "nourish",
    categoryEn: "Weight Management",
    categoryVi: "Quản Lý Cân Nặng",
    titleEn: "Food Combinations for Weight Management",
    titleVi: "Kết Hợp Thực Phẩm Cho Quản Lý Cân Nặng",
    subtitleEn: "Evidence, Context & Claims: What research measures about satiety, protein, and energy density",
    subtitleVi: "Khoa học về cảm giác no, tỷ lệ đạm và mật độ năng lượng trong bữa ăn",
    descriptionEn: "A rigorous look at whole-food satiety indexes, fiber visco-elastic matrices, and why food synergy matters more than extreme caloric restriction.",
    descriptionVi: "Phân tích chỉ số no lâu từ thực phẩm nguyên bản, cấu trúc chất xơ và lý do vì sao sự kết hợp nguyên liệu quyết định sự bền vững hơn là ăn kiêng hà khắc.",
    coverImage: "/ebooks/covers/vol3-weight-management.png",
    pages: 12,
    pairingsCount: 5,
    citationsCount: 16,
    slugEn: "weight-management-pairings",
    slugVi: "quan-ly-can-nang",
    featuredPairingsEn: ["Greek Yogurt + Chia", "Eggs + Spinach", "Salmon + Broccoli", "Apple + Peanut Butter"],
    featuredPairingsVi: ["Sữa chua Hy Lạp + Hạt chia", "Trứng + Rau bina", "Cá hồi + Bông cải xanh", "Táo + Bơ đậu phộng"]
  },
  {
    id: "better-sleep",
    volume: "VOL. 04",
    status: "in_development",
    pillar: "calm",
    categoryEn: "Sleep & Circadian Rhythm",
    categoryVi: "Giấc Ngủ & Nhịp Sinh Học",
    titleEn: "Food Combinations for Better Sleep",
    titleVi: "Kết Hợp Bữa Tối Cho Giấc Ngủ Sâu",
    subtitleEn: "Evidence & Tradition: Which dietary factors have been studied for nocturnal recovery?",
    subtitleVi: "Bằng chứng & Truyền thống: Những yếu tố dinh dưỡng nào đã được thử nghiệm cho phục hồi đêm?",
    descriptionEn: "Tryptophan pathways, magnesium bioavailability, melatonin precursors, and separating traditional calming teas from clinical intervention outcomes.",
    descriptionVi: "Con đường chuyển hóa Tryptophan, độ sinh khả dụng của Magie, tiền chất Melatonin và phân định giữa trà thảo mộc truyền thống với kết quả thử nghiệm lâm sàng.",
    coverImage: "/ebooks/covers/vol4-better-sleep.jpg",
    pages: 12,
    pairingsCount: 5,
    citationsCount: 14,
    slugEn: "sleep-circadian-pairings",
    slugVi: "giac-ngu-sau",
    featuredPairingsEn: ["Chamomile + Cinnamon", "Tart Cherry + Almonds", "Warm Milk + Nutmeg", "Oatmeal + Pumpkin Seeds"],
    featuredPairingsVi: ["Hoa cúc + Quế", "Anh đào chua + Hạnh nhân", "Sữa ấm + Nhục đậu khấu", "Yến mạch + Hạt bí"]
  },
  {
    id: "gout-support",
    volume: "VOL. 05",
    status: "in_development",
    pillar: "nourish",
    categoryEn: "Metabolism & Uric Acid",
    categoryVi: "Chuyển Hóa & Axit Uric",
    titleEn: "Food & Gout: What the Evidence Actually Says",
    titleVi: "Thực Phẩm & Bệnh Gút: Bằng Chứng Y Sinh Thực Tế",
    subtitleEn: "Uric acid, purines, hydration, and dietary patterns without replacing clinical care",
    subtitleVi: "Axit uric, nhân purin, nước và mô hình ăn uống an toàn không thay thế thuốc điều trị",
    descriptionEn: "Deconstructing purine myths: why plant-derived purines behave differently from animal purines, the role of vitamin C, and cherries in uric acid excretion.",
    descriptionVi: "Giải mã lầm tưởng về purin: vì sao purin từ thực vật phản ứng khác với động vật, vai trò của vitamin C và quả anh đào trong việc bài tiết axit uric.",
    coverImage: "/ebooks/covers/vol5-gout-support.png",
    pages: 10,
    pairingsCount: 4,
    citationsCount: 15,
    slugEn: "gout-uric-acid-evidence",
    slugVi: "gut-axit-uric",
    featuredPairingsEn: ["Tart Cherries + Lemon Water", "Tofu + Cruciferous Vegetables", "Celery Seed + Cucumber", "Coffee + Skim Milk"],
    featuredPairingsVi: ["Anh đào + Nước chanh loãng", "Đậu phụ + Rau họ cải", "Hạt cần tây + Dưa leo", "Cà phê + Sữa tách béo"]
  },
  {
    id: "liver-health",
    volume: "VOL. 06",
    status: "in_development",
    pillar: "nourish",
    categoryEn: "Liver & Metabolic Health",
    categoryVi: "Gan & Chuyển Hóa",
    titleEn: "Food & Liver Health: Beyond Detox Claims",
    titleVi: "Dinh Dưỡng Cho Lá Gan: Vượt Qua Lời Đồn Thải Độc",
    subtitleEn: "What do liver enzymes, antioxidant pathways, and detox myths look like under review?",
    subtitleVi: "Men gan, cơ chế chống oxy hóa nội sinh và sự thật đằng sau trào lưu thải độc",
    descriptionEn: "Your liver detoxifies your body 24/7. Discover what clinical research actually shows regarding cruciferous sulforaphane, artichoke, coffee, and milk thistle.",
    descriptionVi: "Lá gan tự thải độc 24/7. Tìm hiểu nghiên cứu lâm sàng thực tế về sulforaphane từ bông cải, atisô, cà phê và kế sữa bảo vệ tế bào gan.",
    coverImage: "/ebooks/covers/vol6-liver-health.png",
    pages: 11,
    pairingsCount: 4,
    citationsCount: 16,
    slugEn: "liver-health-beyond-detox",
    slugVi: "suc-khoe-la-gan",
    featuredPairingsEn: ["Black Coffee + Citrus Peel", "Beetroot + Olive Oil", "Turmeric + Black Pepper", "Pineapple + Cucumber"],
    featuredPairingsVi: ["Cà phê đen + Vỏ cam chanh", "Củ dền + Dầu ô liu", "Nghệ + Tiêu đen", "Dứa + Dưa chuột"]
  }
];

export function getEbook(idOrSlug: string): WellnessEbook | undefined {
  return wellnessEbooks.find(
    (b) => b.id === idOrSlug || b.slugEn === idOrSlug || b.slugVi === idOrSlug
  );
}
