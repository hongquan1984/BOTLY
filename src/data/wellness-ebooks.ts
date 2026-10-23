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
    pages: 9,
    pairingsCount: 3,
    citationsCount: 15,
    slugEn: "blood-sugar-pairings",
    slugVi: "duong-huyet",
    featuredPairingsEn: ["Lentils + Rice", "Oats + Berries", "Beans + Toast"],
    featuredPairingsVi: ["Đậu lăng + Cơm trắng", "Yến mạch + Quả mọng", "Đậu hầm + Bánh mì"]
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
    subtitleEn: "Everyday food combinations, lipophilic compounds and what human research actually says",
    subtitleVi: "Các cặp thực phẩm hàng ngày, hoạt chất tự nhiên và những gì nghiên cứu thực sự chứng minh",
    descriptionEn: "Clinical pairings: how dietary fats enhance carotenoid and curcumin absorption (tomatoes, turmeric, black pepper), catechin gastric dynamics in green tea.",
    descriptionVi: "Các cặp thực phẩm lâm sàng: cách chất béo tốt tăng hấp thu carotenoid và curcumin (cà chua, nghệ, tiêu đen), độ ổn định catechin của trà xanh.",
    coverImage: "/ebooks/antioxidants/tomato-olive-oil-hero.png",
    pdfUrl: "/ebooks/antioxidants/healthclues-antioxidant-guide.pdf",
    pages: 9,
    pairingsCount: 3,
    citationsCount: 18,
    slugEn: "antioxidants-on-the-plate",
    slugVi: "chat-chong-oxy-hoa",
    featuredPairingsEn: ["Tomato + Olive Oil", "Turmeric + Black Pepper", "Green Tea + Citrus"],
    featuredPairingsVi: ["Cà chua + Dầu ô liu", "Nghệ + Tiêu đen", "Trà xanh + Chanh"]
  },
  {
    id: "weight-management",
    volume: "VOL. 03",
    status: "available",
    pillar: "nourish",
    categoryEn: "Weight Management & Satiety",
    categoryVi: "Quản Lý Cân Nặng & No Lâu",
    titleEn: "Food Combinations for Weight Management",
    titleVi: "Kết Hợp Thực Phẩm Cho Quản Lý Cân Nặng",
    subtitleEn: "Evidence, Context & Claims: What research measures about satiety, protein, and energy density",
    subtitleVi: "Khoa học về cảm giác no, tỷ lệ đạm và mật độ năng lượng trong bữa ăn",
    descriptionEn: "A rigorous look at whole-food satiety indexes, fiber visco-elastic matrices, and why food synergy matters more than extreme caloric restriction.",
    descriptionVi: "Phân tích chỉ số no lâu từ thực phẩm nguyên bản, cấu trúc chất xơ và lý do vì sao sự kết hợp nguyên liệu quyết định sự bền vững hơn là ăn kiêng hà khắc.",
    coverImage: "/ebooks/covers/vol3-weight-management.png",
    pdfUrl: "/ebooks/weight-management/healthclues-weight-management-guide.pdf",
    pages: 7,
    pairingsCount: 2,
    citationsCount: 14,
    slugEn: "weight-management-pairings",
    slugVi: "quan-ly-can-nang",
    featuredPairingsEn: ["Greek Yogurt + Chia", "Eggs + Spinach"],
    featuredPairingsVi: ["Sữa chua Hy Lạp + Hạt chia", "Trứng + Rau bina"]
  },
  {
    id: "better-sleep",
    volume: "VOL. 04",
    status: "available",
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
    pdfUrl: "/ebooks/better-sleep/healthclues-better-sleep-guide.pdf",
    pages: 7,
    pairingsCount: 2,
    citationsCount: 14,
    slugEn: "sleep-circadian-pairings",
    slugVi: "giac-ngu-sau",
    featuredPairingsEn: ["Tart Cherry + Almonds", "Chamomile + Cinnamon"],
    featuredPairingsVi: ["Anh đào chua + Hạnh nhân", "Hoa cúc + Quế"]
  },
  {
    id: "gout-support",
    volume: "VOL. 05",
    status: "available",
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
    pdfUrl: "/ebooks/gout-support/healthclues-gout-support-guide.pdf",
    pages: 7,
    pairingsCount: 2,
    citationsCount: 14,
    slugEn: "gout-uric-acid-evidence",
    slugVi: "gut-axit-uric",
    featuredPairingsEn: ["Tart Cherries + Lemon Water", "Tofu + Cruciferous Greens"],
    featuredPairingsVi: ["Anh đào + Nước chanh ấm", "Đậu phụ + Rau họ cải"]
  },
  {
    id: "liver-health",
    volume: "VOL. 06",
    status: "available",
    pillar: "nourish",
    categoryEn: "Liver & Vascular Health",
    categoryVi: "Gan & Chuyển Hóa Mạch Máu",
    titleEn: "Food & Liver Health: Beyond Detox Claims",
    titleVi: "Dinh Dưỡng Cho Lá Gan: Vượt Qua Lời Đồn Thải Độc",
    subtitleEn: "Cruciferous sulforaphane, myrosinase reactivation, hepatic phase II enzyme upregulation, and nitric oxide",
    subtitleVi: "Men gan, cơ chế chống oxy hóa nội sinh và sự thật đằng sau trào lưu thải độc",
    descriptionEn: "Your liver detoxifies your body 24/7. Discover what clinical research actually shows regarding cruciferous sulforaphane, beetroot nitrates, and coffee.",
    descriptionVi: "Lá gan tự thải độc 24/7. Tìm hiểu nghiên cứu lâm sàng thực tế về sulforaphane từ bông cải, nitrat củ dền và cà phê bảo vệ tế bào gan.",
    coverImage: "/ebooks/covers/vol6-liver-health.png",
    pdfUrl: "/ebooks/liver-health/healthclues-liver-health-guide.pdf",
    pages: 9,
    pairingsCount: 3,
    citationsCount: 18,
    slugEn: "liver-health-beyond-detox",
    slugVi: "suc-khoe-la-gan",
    featuredPairingsEn: ["Broccoli + Mustard Seed", "Beetroot + Olive Oil", "Dark Coffee + Citrus Peel"],
    featuredPairingsVi: ["Bông cải + Bột mù tạt", "Củ dền + Dầu ô liu", "Cà phê đen + Vỏ cam chanh"]
  }
];

export function getEbook(idOrSlug: string): WellnessEbook | undefined {
  return wellnessEbooks.find(
    (b) => b.id === idOrSlug || b.slugEn === idOrSlug || b.slugVi === idOrSlug
  );
}
