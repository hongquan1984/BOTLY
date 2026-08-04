export const siteConfig = {
  name: "Botly",
  shortName: "Botly",
  tagline: "Tự động hóa doanh nghiệp bằng AI để giảm chi phí, tăng năng suất và vận hành 24/7.",
  description:
    "Xây dựng hệ thống AI Automation, AI Livestream, chatbot, marketing automation và công cụ tự động hóa giúp doanh nghiệp giảm chi phí, tăng năng suất và vận hành hiệu quả.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://aiflow-automation.vercel.app",
  locale: "vi_VN",
  contact: {
    email: "lienhe@botly.vn",
    phone: "0900 000 000",
    phoneHref: "tel:0900000000",
    zalo: "https://zalo.me/0900000000",
    address: "TP. Hồ Chí Minh, Việt Nam",
    workingHours: "T2–T6 · 9:00–18:00",
  },
  social: {
    facebook: "https://facebook.com",
    linkedin: "https://linkedin.com",
    youtube: "https://youtube.com",
  },
  keywords: [
    "AI Automation",
    "AI Livestream",
    "Tự động hóa doanh nghiệp",
    "Marketing Automation",
    "AI Chatbot",
    "Workflow Automation",
    "n8n",
    "Make",
    "AI cho doanh nghiệp",
    "Tự động hóa bán hàng",
    "Tự động hóa chăm sóc khách hàng",
  ],
} as const;

export const navItems = [
  { label: "Giải pháp", href: "#services" },
  { label: "AI Livestream", href: "#ai-livestream" },
  { label: "Automation Marketing", href: "#automation" },
  { label: "Quy trình", href: "#process" },
  { label: "Case Study", href: "#case-studies" },
  { label: "FAQ", href: "#faq" },
  { label: "Liên hệ", href: "#contact" },
] as const;
