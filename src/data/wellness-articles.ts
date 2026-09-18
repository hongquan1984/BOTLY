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
  heroImage?: string;
  snapshot?: { property: string; humanResearch: string; studyForm: string; exactPairing: string };
  ebookCta?: boolean;
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
  {
    locale: "en", slug: "blood-sugar-pairings", translationSlug: "duong-huyet-va-ket-hop-thuc-pham",
    pillar: "nourish", eyebrow: "HEALTHCLUES · VERIFIED HANDBOOK", title: "Blood Sugar & Everyday Pairings: What Food Combinations Teach Us",
    description: "Four familiar food pairings, the compounds and nutrients inside them, and what human clinical trials actually tested on postprandial glucose curves.",
    readTime: "8 min read", reviewedAt: "September 2026", evidence: "supported",
    heroImage: "/ebooks/blood-sugar/lentils-rice-hero.png",
    takeaway: "Changing the proportions and fibre-protein matrix within a meal can flatten the post-meal glucose curve. The insight is about the whole plate, not turning ordinary foods into treatments.",
    snapshot: { property: "Mixed-meal macronutrient composition", humanResearch: "Human acute crossover trials & meta-analyses", studyForm: "Whole foods: cooked pulses, grains, fruits", exactPairing: "Directly tested for lentils+rice and high-fibre pulses" },
    ebookCta: true,
    sections: [
      { title: "How to read blood-sugar food research", paragraphs: ["Blood sugar after eating depends on more than one ingredient. The amount and type of carbohydrate, fibre, protein, food structure and the rest of the meal all shape the response.", "One important habit runs through every clinical study: evidence about a concentrated compound is not automatically evidence about the whole food, and evidence about one ingredient is not automatically evidence about the pairing."] },
      { title: "The 4 pairings tested in human trials", paragraphs: ["1. Lentils + Rice: Replacing 50% of available rice carbohydrates with lentils significantly reduced the area under the blood glucose curve.", "2. Oats + Berries: Viscous oat beta-glucan slows glucose digestion, but clinical certainty varies with the exact form and dose.", "3. Onion + Honey (Myth-check): While onions contain quercetin, honey contributes free glucose and fructose. There is no human evidence showing onions offset honey's sugar load.", "4. Beans + Toast: Adding pulses introduces a slow-digesting protein and fibre structure that alters the carbohydrate context of starchy bread."] },
      { title: "Practical takeaway for your plate", paragraphs: ["Do not look for magical food pairs to cure diabetes or cancel out excess calories. Instead, use food composition to your advantage: adding legumes, whole oats, or protein to a starchy meal reliably dampens post-meal glucose spikes."] }
    ],
    sources: [
      { label: "Moravek D et al. Carbohydrate Replacement of Rice with Lentils Reduces Glycemic Response. J Nutr 2018", url: "https://jn.nutrition.org/article/S0022-3166(22)10813-8/fulltext" },
      { label: "Chen V et al. Effect of oats and oat beta-glucan on glycemic control. BMJ Open Diabetes Res Care 2022", url: "https://pmc.ncbi.nlm.nih.gov/articles/9438016/" },
      { label: "Thompson SV et al. Bean and rice meals reduce postprandial glycemic response. Nutr J 2012", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC3489574/" }
    ],
    tool: "food-combinations"
  },
  {
    locale: "vi", slug: "duong-huyet-va-ket-hop-thuc-pham", translationSlug: "blood-sugar-pairings",
    pillar: "nourish", eyebrow: "HEALTHCLUES · CẨM NANG Y SINH", title: "Đường Huyết & Bữa Ăn Hàng Ngày: Khoa Học Đằng Sau Sự Kết Hợp Thực Phẩm",
    description: "Bốn cặp thực phẩm quen thuộc, cơ chế sinh học và những gì các thử nghiệm lâm sàng đối chứng ngẫu nhiên trên người thực sự đo lường được.",
    readTime: "Đọc 8 phút", reviewedAt: "Tháng 9/2026", evidence: "supported",
    heroImage: "/ebooks/blood-sugar/lentils-rice-hero.png",
    takeaway: "Thay đổi tỷ lệ đạm - chất xơ trong một đĩa ăn có thể làm phẳng đường cong đường huyết sau ăn. Giá trị thực sự nằm ở tổng thể cấu trúc bữa ăn, không phải biến thực phẩm thành thần dược.",
    snapshot: { property: "Cấu trúc dinh dưỡng đa lượng trong bữa ăn hỗn hợp", humanResearch: "Thử nghiệm lâm sàng chéo trên người & phân tích gộp", studyForm: "Thực phẩm nguyên bản: đậu nấu chín, ngũ cốc, trái cây", exactPairing: "Đã thử nghiệm trực tiếp cho đậu lăng + cơm và bữa ăn giàu đậu" },
    ebookCta: true,
    sections: [
      { title: "Cách đọc hiểu nghiên cứu y sinh về đường huyết", paragraphs: ["Đường huyết sau khi ăn phụ thuộc vào nhiều yếu tố kết hợp, không phải một món đơn lẻ. Lượng và loại tinh bột, chất xơ, chất đạm và cấu trúc vật lý của thực phẩm đều định hình phản ứng đường huyết.", "Một nguyên tắc cốt lõi: Bằng chứng về một hoạt chất chiết xuất nồng độ cao không đồng nghĩa với tác dụng của toàn bộ củ/quả, và bằng chứng về từng món riêng lẻ không tự động là bằng chứng cho sự kết hợp."] },
      { title: "4 cặp thực phẩm được thử nghiệm lâm sàng", paragraphs: ["1. Đậu lăng + Cơm trắng: Thay thế 50% tinh bột cơm bằng đậu lăng làm giảm rõ rệt diện tích dưới đường cong đường huyết (AUC).", "2. Yến mạch + Quả mọng: Beta-glucan tạo độ nhớt làm chậm tiêu hóa đường, nhưng hiệu quả phụ thuộc chặt chẽ vào liều lượng và dạng chế biến.", "3. Hành tây + Mật ong (Kiểm chứng sự thật): Hành tây có quercetin, nhưng mật ong chứa nhiều đường tự do. Chưa có nghiên cứu nào chứng minh hành tây có thể xóa bỏ lượng đường từ mật ong.", "4. Đậu hầm + Bánh mì: Bổ sung đậu mang lại đạm thực vật và chất xơ giúp điều hòa phản ứng insulin sau bữa sáng giàu tinh bột."] },
      { title: "Ứng dụng thực tế cho bữa cơm gia đình", paragraphs: ["Thay vì tìm kiếm công thức thần kỳ để chữa bệnh, hãy ứng dụng quy luật kết hợp: thay một phần cơm trắng bằng các loại đậu, hoặc thêm chất xơ hòa tan để kiểm soát đỉnh đường huyết một cách tự nhiên và bền vững."] }
    ],
    sources: [
      { label: "Moravek D et al. Thay thế tinh bột cơm bằng đậu lăng giúp giảm đáp ứng đường huyết. J Nutr 2018", url: "https://jn.nutrition.org/article/S0022-3166(22)10813-8/fulltext" },
      { label: "Chen V et al. Tác dụng của yến mạch và beta-glucan lên kiểm soát glucose. BMJ Open 2022", url: "https://pmc.ncbi.nlm.nih.gov/articles/9438016/" },
      { label: "Thompson SV et al. Bữa ăn đậu và cơm làm giảm phản ứng đường huyết sau ăn. Nutr J 2012", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC3489574/" }
    ],
    tool: "food-combinations"
  },
  {
    locale: "en", slug: "lentils-rice-blood-sugar", translationSlug: "dau-lang-va-com-duong-huyet",
    pillar: "nourish", eyebrow: "01 · LENTILS + RICE", title: "What happens when lentils replace part of the rice on your plate?",
    description: "A controlled clinical crossover trial tested whether changing meal proportions blunts postprandial glucose spikes.",
    readTime: "4 min read", reviewedAt: "September 2026", evidence: "supported",
    heroImage: "/ebooks/blood-sugar/lentils-rice-hero.png",
    takeaway: "Lentils change the carbohydrate context of a rice meal. Replacing half of the rice carbohydrate with lentils significantly blunted post-meal glucose rise in healthy adults.",
    snapshot: { property: "Fibre and plant protein replacing rice carbohydrates", humanResearch: "Direct acute randomized crossover trial", studyForm: "Cooked lentils and white rice", exactPairing: "Yes, directly measured for post-meal glucose" },
    ebookCta: true,
    sections: [
      { title: "What is in lentils?", paragraphs: ["Lentils bring dietary fibre, plant protein and carbohydrate that is digested more slowly than the starch in many refined foods. Those features matter because they can change the structure of a mixed meal, rather than delivering carbohydrate in exactly the same way as rice alone."] },
      { title: "What did human research find?", paragraphs: ["In a randomized crossover study, 48 healthy adults ate white rice alone or meals in which half of the available carbohydrate came from cooked lentils. Several lentil varieties lowered the peak or the total rise in blood glucose during the measured period—what researchers call the glucose area under the curve—compared with rice alone.", "This was an acute meal experiment. It measured what happened after one meal; it did not test long-term average blood sugar (HbA1c) or cure diabetes."] },
      { title: "The memorable lesson", paragraphs: ["Changing the proportions within a meal can change the glucose curve. The practical insight is about the whole plate and its carbohydrate context—not about turning lentils and rice into a drug."] }
    ],
    sources: [
      { label: "Moravek D et al. Carbohydrate Replacement of Rice or Potato with Lentils. Journal of Nutrition, 2018", url: "https://jn.nutrition.org/article/S0022-3166(22)10813-8/fulltext" },
      { label: "Clarke ST et al. Lentil Serving and Acute Postprandial Blood Glucose Response. Nutrients, 2022", url: "https://pubmed.ncbi.nlm.nih.gov/35215500/" }
    ],
    tool: "food-combinations"
  },
  {
    locale: "vi", slug: "dau-lang-va-com-duong-huyet", translationSlug: "lentils-rice-blood-sugar",
    pillar: "nourish", eyebrow: "01 · ĐẬU LĂNG + CƠM", title: "Điều gì xảy ra khi thay thế một phần cơm trắng bằng đậu lăng?",
    description: "Thử nghiệm lâm sàng có đối chứng kiểm tra việc thay đổi tỷ lệ nguyên liệu tác động thế nào đến đỉnh đường huyết sau ăn.",
    readTime: "Đọc 4 phút", reviewedAt: "Tháng 9/2026", evidence: "supported",
    heroImage: "/ebooks/blood-sugar/lentils-rice-hero.png",
    takeaway: "Đậu lăng thay đổi cấu trúc tinh bột của bữa cơm. Thay một nửa lượng tinh bột cơm bằng đậu lăng giúp giảm rõ rệt mức tăng đường huyết sau ăn.",
    snapshot: { property: "Chất xơ và đạm thực vật thay thế tinh bột nhanh", humanResearch: "Thử nghiệm chéo ngẫu nhiên có đối chứng trên người", studyForm: "Đậu lăng nấu chín và cơm trắng", exactPairing: "Có, kiểm tra trực tiếp đáp ứng đường huyết sau ăn" },
    ebookCta: true,
    sections: [
      { title: "Bên trong hạt đậu lăng có gì?", paragraphs: ["Đậu lăng chứa chất xơ hòa tan, đạm thực vật và nguồn carbohydrate tiêu hóa chậm hơn nhiều so với tinh bột tinh chế trong gạo trắng. Những đặc tính này làm thay đổi tốc độ giải phóng glucose vào máu của toàn bộ đĩa ăn."] },
      { title: "Nghiên cứu lâm sàng trên người phát hiện điều gì?", paragraphs: ["Trong một thử nghiệm chéo ngẫu nhiên trên 48 người trưởng thành khỏe mạnh, các tình nguyện viên ăn cơm trắng đơn thuần hoặc bữa ăn có 50% tinh bột đến từ đậu lăng nấu chín. Kết quả cho thấy các giống đậu lăng đều làm giảm đáng kể đỉnh đường huyết và tổng lượng glucose đo được trong suốt thời gian theo dõi so với chỉ ăn cơm trắng.", "Cần lưu ý: Đây là thử nghiệm cấp tính trên một bữa ăn đơn lẻ, không phải nghiên cứu điều trị bệnh tiểu đường dài hạn."] },
      { title: "Bài học ghi nhớ", paragraphs: ["Thay đổi tỷ lệ nguyên liệu trong đĩa ăn có thể thay đổi đường cong glucose. Giải pháp thực tế là tái cấu trúc cả đĩa cơm, không biến đậu lăng thành phương thuốc kỳ diệu."] }
    ],
    sources: [
      { label: "Moravek D et al. Thay thế tinh bột cơm bằng đậu lăng. Tạp chí Dinh dưỡng Hoa Kỳ, 2018", url: "https://jn.nutrition.org/article/S0022-3166(22)10813-8/fulltext" },
      { label: "Clarke ST et al. Đậu lăng và phản ứng đường huyết cấp tính. Nutrients, 2022", url: "https://pubmed.ncbi.nlm.nih.gov/35215500/" }
    ],
    tool: "food-combinations"
  },
  {
    locale: "en", slug: "oats-berries-blood-sugar", translationSlug: "yen-mach-va-qua-mong-duong-huyet",
    pillar: "nourish", eyebrow: "02 · OATS + BERRIES", title: "What does human research actually say about oats and blood sugar?",
    description: "Oats and berries make a familiar breakfast. The clinical research question is how much the answer changes with form and dose.",
    readTime: "4 min read", reviewedAt: "September 2026", evidence: "promising",
    heroImage: "/ebooks/blood-sugar/oats-berries-hero.png",
    takeaway: "The strongest evidence belongs to oat beta-glucan and its viscous gel mechanism. Berry polyphenols show mixed glycemic results; form and dose matter as much as the ingredient name.",
    snapshot: { property: "Oat beta-glucan; berry anthocyanin polyphenols", humanResearch: "Available, with mixed forms and outcomes (meta-analyses)", studyForm: "Oats, oat bran, concentrates, puree & whole berries", exactPairing: "Limited specialized preparation" },
    ebookCta: true,
    sections: [
      { title: "What is in oats?", paragraphs: ["Oats contain beta-glucan, a soluble fibre that becomes viscous and thick in the digestive tract. Researchers are interested in it because this texture can slow down carbohydrate digestion and absorption, smoothing the rise in blood sugar."] },
      { title: "What did human studies find?", paragraphs: ["A meta-analysis of eight randomized trials in 407 adults with type 2 diabetes found modest improvements in glucose control (fasting glucose, HbA1c, and HOMA-IR) with a typical beta-glucan dose of ~3.25g over 4.5 weeks.", "However, results depend heavily on the molecular size of beta-glucan and whether oats are rolled, steel-cut, or instant."] },
      { title: "What do berries add?", paragraphs: ["Berries contribute plant anthocyanins, fibre, and fruit sugars. A small crossover study found berry puree blunted early glucose peaks after sugar intake, but total 3-hour rise remained similar."] }
    ],
    sources: [
      { label: "Chen V et al. Effect of oats and oat beta-glucan on glycemic control. BMJ Open Diabetes Res Care 2022", url: "https://pmc.ncbi.nlm.nih.gov/articles/9438016/" },
      { label: "Zurbau A et al. Effect of oat beta-glucan on postprandial glucose and insulin. Eur J Clin Nutr 2021", url: "https://www.nature.com/articles/s41430-021-00875-9" }
    ],
    tool: "food-combinations"
  },
  {
    locale: "vi", slug: "yen-mach-va-qua-mong-duong-huyet", translationSlug: "oats-berries-blood-sugar",
    pillar: "nourish", eyebrow: "02 · YẾN MẠCH + QUẢ MỌNG", title: "Nghiên cứu lâm sàng thực sự nói gì về yến mạch và đường huyết?",
    description: "Yến mạch và dâu tây/việt quất là bữa sáng quen thuộc. Câu hỏi nghiên cứu là hiệu quả thay đổi thế nào theo dạng chế biến và liều lượng.",
    readTime: "Đọc 4 phút", reviewedAt: "Tháng 9/2026", evidence: "promising",
    heroImage: "/ebooks/blood-sugar/oats-berries-hero.png",
    takeaway: "Bằng chứng mạnh mẽ nhất thuộc về chất xơ beta-glucan trong yến mạch. Hiệu quả của quả mọng còn nhiều khác biệt; dạng chế biến và liều lượng quan trọng tương đương tên nguyên liệu.",
    snapshot: { property: "Chất xơ nhớt Beta-glucan & polyphenol quả mọng", humanResearch: "Phân tích gộp & thử nghiệm có đối chứng trên người", studyForm: "Yến mạch cán, cám yến mạch, bột xay và quả mọng tươi", exactPairing: "Thử nghiệm trên dạng đồ uống lên men chuyên biệt" },
    ebookCta: true,
    sections: [
      { title: "Beta-glucan trong yến mạch hoạt động thế nào?", paragraphs: ["Yến mạch giàu beta-glucan, một dạng chất xơ hòa tan tạo thành gel nhớt trong đường ruột. Lớp gel này làm chậm tốc độ tiếp xúc của enzyme tiêu hóa với tinh bột, giúp đường giải phóng vào máu đều đặn hơn."] },
      { title: "Nghiên cứu trên bệnh nhân tiểu đường", paragraphs: ["Một phân tích gộp trên 407 người trưởng thành mắc đái tháo đường tuýp 2 ghi nhận mức cải thiện khiêm tốn ở chỉ số đường huyết đói và HbA1c khi bổ sung khoảng 3.25g beta-glucan mỗi ngày trong 4.5 tuần.", "Tuy nhiên, yến mạch ăn liền đã qua tinh chế quá kỹ sẽ làm mất đi nhiều cấu trúc nhớt so với yến mạch cán thô (rolled oats)."] },
      { title: "Quả mọng đóng góp điều gì?", paragraphs: ["Quả mọng (dâu, việt quất) cung cấp sắc tố anthocyanin và chất xơ. Các thử nghiệm cho thấy quả mọng giúp giảm độ dốc của đỉnh đường huyết ban đầu nhưng tổng lượng đường hấp thu sau 3 giờ không thay đổi quá lớn."] }
    ],
    sources: [
      { label: "Chen V et al. Tác dụng của beta-glucan trên người tiểu đường. BMJ Open 2022", url: "https://pmc.ncbi.nlm.nih.gov/articles/9438016/" },
      { label: "Zurbau A et al. Ảnh hưởng của beta-glucan lên phản ứng insulin sau ăn. Eur J Clin Nutr 2021", url: "https://www.nature.com/articles/s41430-021-00875-9" }
    ],
    tool: "food-combinations"
  },
  {
    locale: "en", slug: "onion-honey-blood-sugar", translationSlug: "hanh-tay-va-mat-ong-duong-huyet",
    pillar: "nourish", eyebrow: "03 · ONION + HONEY (MYTH-CHECK)", title: "Onion and honey: does combining them make sense for blood sugar?",
    description: "This familiar home-remedy pairing is a useful test of whether interesting ingredients automatically create an anti-diabetic synergy.",
    readTime: "4 min read", reviewedAt: "September 2026", evidence: "limited",
    heroImage: "/ebooks/blood-sugar/onion-honey-hero.png",
    takeaway: "Separate the onion question from the honey question. Honey is rich in free sugars, and there is zero scientific evidence that onions offset honey's glycemic burden.",
    snapshot: { property: "Quercetin extract evidence vs honey free sugars", humanResearch: "Available separately; no qualifying human combination trials", studyForm: "Oral honey; quercetin capsules; onion extracts", exactPairing: "No qualifying human combination study found" },
    ebookCta: true,
    sections: [
      { title: "What is in the onion?", paragraphs: ["Onions contain flavonoids including quercetin and organosulfur compounds. High-dose quercetin supplements have been studied for metabolic markers, but reductions in fasting glucose appeared only in selective high-dose subgroups—not ordinary food portions."] },
      { title: "What does honey contribute?", paragraphs: ["Honey is predominantly a mixture of glucose and fructose. While raw honey contains minor trace polyphenols, those constituents do not erase the reality of its high sugar content.", "In clinical trials with diabetic patients, replacing sugar with honey still increases postprandial glucose, and prolonged consumption increased HbA1c in controlled trials."] },
      { title: "Myth-check: Did anyone study the combination?", paragraphs: ["Researchers have not identified any qualifying human clinical trial testing onions and honey together for glycemic control. Treating onion-and-honey syrup as a blood-sugar remedy is unsupported by clinical literature."] }
    ],
    sources: [
      { label: "Hejazi N et al. Onion supplementation and metabolic parameters. Clin Nutr ESPEN 2023", url: "https://pubmed.ncbi.nlm.nih.gov/38056991/" },
      { label: "Ahmed A et al. Effects of Honey on Metabolic Risk Factors. Curr Dev Nutr 2021", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC8180681/" },
      { label: "Bahrami M et al. Effects of honey in diabetic patients. Int J Food Sci Nutr 2009", url: "https://pubmed.ncbi.nlm.nih.gov/19817641/" }
    ],
    tool: "remedy-checker"
  },
  {
    locale: "vi", slug: "hanh-tay-va-mat-ong-duong-huyet", translationSlug: "onion-honey-blood-sugar",
    pillar: "nourish", eyebrow: "03 · HÀNH TÂY + MẬT ONG (KIỂM CHỨNG)", title: "Hành tây và mật ong: Có thực sự tốt cho đường huyết như lời đồn?",
    description: "Mẹo dân gian truyền miệng này là một bài kiểm tra điển hình để xem hai nguyên liệu thú vị có tự động tạo ra một bài thuốc hạ đường huyết hay không.",
    readTime: "Đọc 4 phút", reviewedAt: "Tháng 9/2026", evidence: "limited",
    heroImage: "/ebooks/blood-sugar/onion-honey-hero.png",
    takeaway: "Hãy tách biệt câu hỏi về hành tây và câu hỏi về mật ong. Mật ong là đường tự do, và không có bất kỳ nghiên cứu khoa học nào chứng minh hành tây có thể xóa bỏ gánh nặng đường của mật ong.",
    snapshot: { property: "Bằng chứng hoạt chất Quercetin vs đường tự do trong mật ong", humanResearch: "Nghiên cứu riêng lẻ từng chất; không có thử nghiệm kết hợp", studyForm: "Mật ong nguyên chất, viên bổ sung quercetin, dịch chiết hành", exactPairing: "Chưa có nghiên cứu lâm sàng đạt chuẩn trên người" },
    ebookCta: true,
    sections: [
      { title: "Hoạt chất trong hành tây", paragraphs: ["Hành tây chứa hợp chất lưu huỳnh hữu cơ và quercetin. Các nghiên cứu về quercetin dạng viên uống liều cao cho thấy một số tác động nhẹ đến chuyển hóa, nhưng điều này không thể đánh đồng với một vài lát hành tây trong bữa ăn."] },
      { title: "Thực tế về mật ong", paragraphs: ["Mật ong về bản chất chủ yếu là đường fructose và glucose. Dù mật ong chứa một lượng nhỏ khoáng chất và chất chống oxy hóa, những chất vi lượng này không thể biến mật ong thành thực phẩm 'không calo' hay 'không làm tăng đường'.", "Trong một thử nghiệm lâm sàng kéo dài 8 tuần trên 48 người bệnh tiểu đường, chỉ số đường huyết HbA1c thậm chí còn tăng lên ở nhóm dùng mật ong."] },
      { title: "Kiểm chứng sự thật: Đã ai nghiên cứu kết hợp này chưa?", paragraphs: ["Không có bất kỳ thử nghiệm lâm sàng nào trên người chứng minh hỗn hợp hành tây và mật ong giúp hạ đường huyết. Đây là mẹo dân gian truyền miệng trong văn hóa trị ho, không phải giải pháp y khoa cho người kiểm soát đường huyết."] }
    ],
    sources: [
      { label: "Hejazi N et al. Bổ sung hành tây và các chỉ số chuyển hóa. Clin Nutr ESPEN 2023", url: "https://pubmed.ncbi.nlm.nih.gov/38056991/" },
      { label: "Ahmed A et al. Tác động của mật ong lên yếu tố nguy cơ tim mạch - chuyển hóa. 2021", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC8180681/" },
      { label: "Bahrami M et al. Sử dụng mật ong tự nhiên ở bệnh nhân đái tháo đường. 2009", url: "https://pubmed.ncbi.nlm.nih.gov/19817641/" }
    ],
    tool: "remedy-checker"
  },
  {
    locale: "en", slug: "beans-toast-blood-sugar", translationSlug: "dau-va-banh-mi-duong-huyet",
    pillar: "nourish", eyebrow: "04 · BEANS + TOAST", title: "What can beans change in a high-carbohydrate breakfast?",
    description: "Beans bring fibre and protein to a starchy meal. Human studies show why the full breakfast matters more than the headline pairing.",
    readTime: "4 min read", reviewedAt: "September 2026", evidence: "supported",
    heroImage: "/ebooks/blood-sugar/beans-toast-hero.png",
    takeaway: "Pulse fibre and plant protein alter the digestive dynamics of toast. Human crossover studies show adding cooked beans significantly lowers post-meal glucose and insulin peaks.",
    snapshot: { property: "Dietary fibre & plant protein matrix", humanResearch: "Available for related pulse-starch meal trials", studyForm: "Cooked beans in controlled meal tests", exactPairing: "Studied as bean-based breakfasts and bean-with-rice meals" },
    ebookCta: true,
    sections: [
      { title: "What is in the beans?", paragraphs: ["Beans provide plant protein and dietary fibre packaged within an intact cellular matrix. This physical structure slows the digestion and systemic absorption of carbohydrates from other starchy foods eaten during the same meal."] },
      { title: "What did human studies find?", paragraphs: ["In controlled crossover studies, participants who consumed high-fibre bean meals alongside starchy carbohydrates demonstrated significantly lower post-meal insulin responses and reduced blood glucose peaks compared to eating refined starches alone.", "In adults with type 2 diabetes, bean-and-starch meals produced lower glucose concentrations at multiple post-meal time points."] },
      { title: "Practical takeaway", paragraphs: ["Think about fibre-rich meal composition rather than treating 'beans on toast' as a special cure. Combining pulses with grains is a reliable nutritional strategy to manage glycemic curves."] }
    ],
    sources: [
      { label: "Thompson SV et al. Bean and rice meals reduce postprandial glycemic response. Nutr J 2012", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC3489574/" },
      { label: "Fleming SE, Shaheen SM. High-fiber breakfasts and glucose/insulin responses. Am J Clin Nutr 1988", url: "https://pubmed.ncbi.nlm.nih.gov/2834943/" }
    ],
    tool: "food-combinations"
  },
  {
    locale: "vi", slug: "dau-va-banh-mi-duong-huyet", translationSlug: "beans-toast-blood-sugar",
    pillar: "nourish", eyebrow: "04 · ĐẬU + BÁNH MÌ", title: "Đậu hầm có thể thay đổi điều gì trong bữa sáng giàu tinh bột?",
    description: "Đậu mang lại chất xơ và đạm thực vật cho bữa ăn nhiều bột đường. Các thử nghiệm lâm sàng chứng minh vì sao cấu trúc tổng thể bữa sáng quan trọng hơn món ăn tiêu đề.",
    readTime: "Đọc 4 phút", reviewedAt: "Tháng 9/2026", evidence: "supported",
    heroImage: "/ebooks/blood-sugar/beans-toast-hero.png",
    takeaway: "Chất xơ và đạm từ các loại đậu làm chậm tốc độ tiêu hóa tinh bột của bánh mì. Bổ sung đậu giúp hạ thấp đỉnh đường huyết và phản ứng insulin sau bữa ăn.",
    snapshot: { property: "Cấu trúc đạm thực vật & chất xơ hòa tan", humanResearch: "Thử nghiệm bữa ăn đậu kết hợp tinh bột trên người", studyForm: "Đậu nấu chín trong khẩu phần ăn có kiểm soát", exactPairing: "Đã nghiên cứu trên bữa sáng chứa đậu và bữa ăn đậu + cơm" },
    ebookCta: true,
    sections: [
      { title: "Cơ chế của các loại đậu", paragraphs: ["Các loại đậu (đậu đen, đậu tây, đậu lăng) chứa mạng lưới tế bào giàu chất xơ bao bọc hạt tinh bột. Cấu trúc này làm chậm quá trình amylase phân giải đường, kéo dài thời gian giải phóng glucose vào tuần hoàn."] },
      { title: "Nghiên cứu lâm sàng", paragraphs: ["Các nghiên cứu đối chứng cho thấy việc bổ sung đậu vào khẩu phần bữa sáng giàu tinh bột giúp giảm phản ứng insulin cấp tính. Trên bệnh nhân đái tháo đường tuýp 2, việc kết hợp đậu cùng cơm hoặc bánh mì giúp giảm nồng độ đường huyết ở nhiều thời điểm đo sau ăn so với bữa ăn chỉ có tinh bột đơn thuần."] },
      { title: "Bài học thực tiễn", paragraphs: ["Hãy tư duy theo cấu trúc bữa ăn giàu chất xơ: kết hợp ngũ cốc tinh chế với một nguồn đậu giàu đạm là cách đơn giản và khoa học nhất để làm dịu đường cong đường huyết."] }
    ],
    sources: [
      { label: "Thompson SV et al. Bữa ăn đậu và cơm làm giảm đáp ứng đường huyết sau ăn. Nutr J 2012", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC3489574/" },
      { label: "Fleming SE, Shaheen SM. Tiêu thụ bữa sáng giàu chất xơ và đáp ứng insulin. Am J Clin Nutr 1988", url: "https://pubmed.ncbi.nlm.nih.gov/2834943/" }
    ],
    tool: "food-combinations"
  },
];

export function getArticle(locale: WellnessLocale, slug: string) {
  return wellnessArticles.find((article) => article.locale === locale && article.slug === slug);
}
