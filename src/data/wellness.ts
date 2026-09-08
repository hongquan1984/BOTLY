import { Apple, Brain, Leaf, Moon, Sparkles, TimerReset } from "lucide-react";

export type WellnessLocale = "en" | "vi";

export const wellnessCopy = {
  en: {
    nav: [
      ["Weight Loss", "/en/wellness/weight-management"],
      ["Healing", "/en/wellness/healing"],
      ["Health Tips", "/en/wellness/health-tips"],
      ["Tools", "/en/wellness/tools"],
    ],
    languageHref: "/vi/song-khoe",
    languageLabel: "VI",
    businessHref: "/en/business",
    businessLabel: "For business",
    eyebrow: "SMALL STEPS · REAL LIFE",
    title: "Feel better, one gentle habit at a time.",
    subtitle: "Practical tools for healthier meals, calmer days, mindful moments and sustainable weight goals—without miracle claims.",
    primaryCta: "Take the 2-minute check-in",
    secondaryCta: "Explore free tools",
    prompt: "What would you like help with today?",
    trust: "Built for everyday wellness—not diagnosis or treatment.",
    toolsTitle: "Start with a small win",
    toolsSubtitle: "No account needed. See your result first, save it later.",
    articlesTitle: "Practical, evidence-aware guides",
    articlesSubtitle: "Clear next steps, honest limits and sources you can check.",
    newsletterTitle: "A calmer week, delivered.",
    newsletterBody: "One useful meal idea, one mindful practice and one small habit every Sunday.",
    emailPlaceholder: "Email address",
    subscribe: "Join free",
    footerText: "Wellness guidance for everyday life. Not medical advice.",
  },
  vi: {
    nav: [
      ["Giảm cân", "/vi/song-khoe/giam-can"],
      ["Chữa lành", "/vi/song-khoe/chua-lanh"],
      ["Mẹo sức khỏe", "/vi/song-khoe/meo-suc-khoe"],
      ["Công cụ", "/vi/song-khoe/cong-cu"],
    ],
    languageHref: "/en/wellness",
    languageLabel: "EN",
    businessHref: "/vi/doanh-nghiep",
    businessLabel: "Cho doanh nghiệp",
    eyebrow: "BƯỚC NHỎ · ĐỜI SỐNG THẬT",
    title: "Khỏe hơn từ những thói quen nhẹ nhàng.",
    subtitle: "Công cụ thực tế cho bữa ăn lành mạnh, ngày sống thư thái, thiền định và mục tiêu cân nặng bền vững—không hứa hẹn thần kỳ.",
    primaryCta: "Kiểm tra nhanh trong 2 phút",
    secondaryCta: "Khám phá công cụ miễn phí",
    prompt: "Hôm nay bạn muốn Botly hỗ trợ điều gì?",
    trust: "Dành cho wellness hằng ngày—không chẩn đoán hay điều trị.",
    toolsTitle: "Bắt đầu bằng một thay đổi nhỏ",
    toolsSubtitle: "Không cần tài khoản. Xem kết quả trước, lưu lại sau.",
    articlesTitle: "Hướng dẫn thực tế, tôn trọng bằng chứng",
    articlesSubtitle: "Bước tiếp theo rõ ràng, giới hạn trung thực và nguồn có thể kiểm tra.",
    newsletterTitle: "Một tuần nhẹ nhàng hơn.",
    newsletterBody: "Mỗi Chủ nhật: một món ăn hữu ích, một bài thực hành chánh niệm và một thói quen nhỏ.",
    emailPlaceholder: "Địa chỉ email",
    subscribe: "Tham gia miễn phí",
    footerText: "Hướng dẫn wellness cho đời sống hằng ngày. Không thay thế tư vấn y tế.",
  },
} as const;

export const goalCards = {
  en: [
    { title: "Manage my weight", text: "Build a sustainable food routine.", icon: Apple, tone: "peach", href: "/en/wellness/nourish" },
    { title: "Feel less stressed", text: "Check in and reset your day.", icon: Sparkles, tone: "sky", href: "/en/wellness/calm" },
    { title: "Build a meditation habit", text: "Start with just three minutes.", icon: Brain, tone: "lilac", href: "/en/wellness/mindful" },
    { title: "Sleep more gently", text: "Create a calmer evening rhythm.", icon: Moon, tone: "night", href: "/en/wellness/calm" },
  ],
  vi: [
    { title: "Quản lý cân nặng", text: "Xây thói quen ăn uống bền vững.", icon: Apple, tone: "peach", href: "/vi/song-khoe/dinh-duong" },
    { title: "Bớt căng thẳng", text: "Check-in và cân bằng lại ngày sống.", icon: Sparkles, tone: "sky", href: "/vi/song-khoe/giam-cang-thang" },
    { title: "Tạo thói quen thiền", text: "Bắt đầu chỉ với ba phút.", icon: Brain, tone: "lilac", href: "/vi/song-khoe/thien" },
    { title: "Ngủ nhẹ nhàng hơn", text: "Tạo nhịp buổi tối thư thái.", icon: Moon, tone: "night", href: "/vi/song-khoe/giam-cang-thang" },
  ],
} as const;

export const toolCards = {
  en: [
    { slug: "calorie-needs", title: "Calorie Needs", text: "A useful starting range for sustainable weight goals.", icon: Apple, label: "2 min" },
    { slug: "stress-check", title: "Stress Check-in", text: "Pause, notice and choose a gentle next step.", icon: Sparkles, label: "1 min" },
    { slug: "meditation-timer", title: "Meditation Timer", text: "A quiet, distraction-free timer for your practice.", icon: TimerReset, label: "3–10 min" },
  ],
  vi: [
    { slug: "calorie-needs", title: "Nhu cầu năng lượng", text: "Khoảng tham khảo để bắt đầu mục tiêu cân nặng bền vững.", icon: Apple, label: "2 phút" },
    { slug: "stress-check", title: "Check-in căng thẳng", text: "Dừng lại, nhận biết và chọn bước tiếp theo nhẹ nhàng.", icon: Sparkles, label: "1 phút" },
    { slug: "meditation-timer", title: "Đồng hồ thiền", text: "Khoảng thời gian yên tĩnh, không gây xao nhãng.", icon: TimerReset, label: "3–10 phút" },
  ],
} as const;

export const guideCards = {
  en: [
    { slug: "balanced-plate-simple", tag: "NOURISH", title: "A balanced plate that keeps healthy eating simple", meta: "6 min read", tone: "peach" },
    { slug: "three-minute-stress-reset", tag: "CALM", title: "A three-minute reset for an overloaded afternoon", meta: "Practice", tone: "sky" },
    { slug: "meditation-for-restless-beginners", tag: "MINDFUL", title: "Meditation for beginners who think they cannot meditate", meta: "5 min read", tone: "lilac" },
  ],
  vi: [
    { slug: "dia-an-can-bang", tag: "DINH DƯỠNG", title: "Một đĩa ăn cân bằng để việc ăn khỏe trở nên đơn giản", meta: "Đọc 6 phút", tone: "peach" },
    { slug: "ba-phut-giam-tai", tag: "THƯ GIÃN", title: "Ba phút cân bằng lại một buổi chiều quá tải", meta: "Thực hành", tone: "sky" },
    { slug: "thien-cho-nguoi-moi", tag: "CHÁNH NIỆM", title: "Thiền cho người mới luôn nghĩ rằng mình không thể thiền", meta: "Đọc 5 phút", tone: "lilac" },
  ],
} as const;

export const pillars = {
  en: [
    { slug: "nourish", name: "Nourish", kicker: "Eat with clarity", description: "Healthy eating and sustainable weight management without rigid rules.", icon: Apple, tone: "peach", topics: ["Balanced meals", "Weight goals", "Food combinations", "Meal planning"] },
    { slug: "calm", name: "Calm", kicker: "Make room to breathe", description: "Practical ways to manage everyday stress and build a gentler sleep rhythm.", icon: Moon, tone: "sky", topics: ["Stress check-ins", "Better sleep", "Breathing", "Evening routines"] },
    { slug: "mindful", name: "Mindful", kicker: "Be where you are", description: "Short, approachable meditation and mindfulness practices for real life.", icon: Leaf, tone: "lilac", topics: ["Meditation", "Mindful eating", "Focus", "Daily practice"] },
  ],
  vi: [
    { slug: "dinh-duong", name: "Nuôi dưỡng", kicker: "Ăn uống sáng suốt", description: "Ăn lành mạnh và quản lý cân nặng bền vững, không theo quy tắc cực đoan.", icon: Apple, tone: "peach", topics: ["Bữa ăn cân bằng", "Mục tiêu cân nặng", "Kết hợp thực phẩm", "Lên thực đơn"] },
    { slug: "giam-cang-thang", name: "Thư giãn", kicker: "Cho mình khoảng thở", description: "Cách thực tế để quản lý stress hằng ngày và xây nhịp ngủ nhẹ nhàng hơn.", icon: Moon, tone: "sky", topics: ["Check-in stress", "Ngủ ngon", "Bài thở", "Nhịp buổi tối"] },
    { slug: "thien", name: "Chánh niệm", kicker: "Có mặt ở hiện tại", description: "Những bài thiền và thực hành chánh niệm ngắn, dễ tiếp cận trong đời sống.", icon: Leaf, tone: "lilac", topics: ["Thiền định", "Ăn chánh niệm", "Tập trung", "Thực hành hằng ngày"] },
  ],
} as const;
